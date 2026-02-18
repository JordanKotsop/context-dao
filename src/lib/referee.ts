/**
 * Referee Engine — automated validation pipeline for the Validation League.
 *
 * Runs both v1 and v2 of a skill against the validation set,
 * scores responses, and calculates improvement delta.
 */

import fs from "fs";
import path from "path";
import { runInference } from "./llm-client";

// --- Types ---

export interface ValidationQuestion {
  input: string;
  expected_output: string;
  match_type: "keyword" | "llm_judge" | "exact" | "contains";
  weight: number;
}

export interface ValidationSet {
  skill: string;
  version: string;
  questions: ValidationQuestion[];
}

export interface QuestionResult {
  input: string;
  match_type: string;
  score: number;
  max_score: number;
  tokens_used: number;
}

export interface SkillRunResult {
  total_score: number;
  max_score: number;
  accuracy_pct: number;
  total_tokens: number;
  question_results: QuestionResult[];
}

export interface RefereeVerdict {
  skill_slug: string;
  v1_score: SkillRunResult;
  v2_score: SkillRunResult;
  accuracy_delta: number;
  token_delta: number;
  improved: boolean;
  timestamp: string;
}

// --- Validation Set Loader ---

export function loadValidationSet(slug: string): ValidationSet | null {
  const candidates = [
    path.join(process.cwd(), "skills", slug, "validation.json"),
    path.join(process.cwd(), "..", "skills", slug, "validation.json"),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw) as ValidationSet;
    }
  }

  return null;
}

// --- Scorers ---

function scoreKeyword(response: string, expected: string): number {
  // Expected format: "keyword1, keyword2, keyword3" or "contains: kw1, kw2"
  const cleaned = expected.replace(/^contains:\s*/i, "");
  const keywords = cleaned.split(",").map((k) => k.trim().toLowerCase());
  const responseLower = response.toLowerCase();

  const matched = keywords.filter((kw) => responseLower.includes(kw));
  return matched.length / keywords.length;
}

function scoreExact(response: string, expected: string): number {
  return response.trim().toLowerCase() === expected.trim().toLowerCase()
    ? 1.0
    : 0.0;
}

function scoreContains(response: string, expected: string): number {
  return response.toLowerCase().includes(expected.toLowerCase()) ? 1.0 : 0.0;
}

async function scoreLlmJudge(
  input: string,
  response: string,
  expected: string
): Promise<number> {
  const judgePrompt = `You are a strict evaluator. Score the following response on a scale of 0 to 10.

QUESTION: ${input}

EXPECTED CRITERIA: ${expected}

ACTUAL RESPONSE: ${response}

Reply with ONLY a JSON object: {"score": <number 0-10>, "reason": "<brief reason>"}`;

  try {
    const result = await runInference({
      systemPrompt: "You are a precise evaluation judge. Always respond with valid JSON.",
      userPrompt: judgePrompt,
      model: "claude-haiku-4-5-20251001",
      maxTokens: 200,
    });

    const parsed = JSON.parse(result.response);
    return Math.min(10, Math.max(0, parsed.score)) / 10;
  } catch {
    // Fallback to keyword scoring if LLM judge fails
    return scoreKeyword(response, expected);
  }
}

// --- Core Runner ---

async function runSkillAgainstValidation(
  skillContent: string,
  validationSet: ValidationSet
): Promise<SkillRunResult> {
  const results: QuestionResult[] = [];
  let totalScore = 0;
  let maxScore = 0;
  let totalTokens = 0;

  for (const q of validationSet.questions) {
    const weight = q.weight ?? 1.0;
    maxScore += weight;

    try {
      const inference = await runInference({
        systemPrompt: skillContent,
        userPrompt: q.input,
        maxTokens: 1024,
      });

      let score: number;

      switch (q.match_type) {
        case "keyword":
          score = scoreKeyword(inference.response, q.expected_output);
          break;
        case "exact":
          score = scoreExact(inference.response, q.expected_output);
          break;
        case "contains":
          score = scoreContains(inference.response, q.expected_output);
          break;
        case "llm_judge":
          score = await scoreLlmJudge(
            q.input,
            inference.response,
            q.expected_output
          );
          break;
        default:
          score = 0;
      }

      const weightedScore = score * weight;
      totalScore += weightedScore;
      totalTokens += inference.tokens_in + inference.tokens_out;

      results.push({
        input: q.input,
        match_type: q.match_type,
        score: weightedScore,
        max_score: weight,
        tokens_used: inference.tokens_in + inference.tokens_out,
      });
    } catch {
      results.push({
        input: q.input,
        match_type: q.match_type,
        score: 0,
        max_score: weight,
        tokens_used: 0,
      });
    }
  }

  return {
    total_score: Math.round(totalScore * 100) / 100,
    max_score: maxScore,
    accuracy_pct: maxScore > 0 ? Math.round((totalScore / maxScore) * 10000) / 100 : 0,
    total_tokens: totalTokens,
    question_results: results,
  };
}

// --- Public API ---

/**
 * Run the full referee pipeline: score v1, score v2, calculate delta.
 */
export async function referee(
  slug: string,
  v1Content: string,
  v2Content: string
): Promise<RefereeVerdict> {
  const validationSet = loadValidationSet(slug);
  if (!validationSet) {
    throw new Error(`No validation set found for skill '${slug}'`);
  }

  const [v1Score, v2Score] = await Promise.all([
    runSkillAgainstValidation(v1Content, validationSet),
    runSkillAgainstValidation(v2Content, validationSet),
  ]);

  const accuracyDelta = v2Score.accuracy_pct - v1Score.accuracy_pct;
  const tokenDelta = v1Score.total_tokens - v2Score.total_tokens;

  return {
    skill_slug: slug,
    v1_score: v1Score,
    v2_score: v2Score,
    accuracy_delta: Math.round(accuracyDelta * 100) / 100,
    token_delta: tokenDelta,
    improved: accuracyDelta > 0 || (accuracyDelta === 0 && tokenDelta > 0),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Score a single skill version against its validation set.
 */
export async function scoreSkill(
  slug: string,
  skillContent: string
): Promise<SkillRunResult> {
  const validationSet = loadValidationSet(slug);
  if (!validationSet) {
    throw new Error(`No validation set found for skill '${slug}'`);
  }

  return runSkillAgainstValidation(skillContent, validationSet);
}
