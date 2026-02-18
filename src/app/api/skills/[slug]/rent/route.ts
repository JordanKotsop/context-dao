import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "x402-next";
import { getSkillBySlug } from "@/lib/skills";
import { x402Config, getSkillRentConfig } from "@/lib/x402";
import { runInference } from "@/lib/llm-client";
import {
  wrapSystemPrompt,
  sanitizeResponse,
  isMetaQuery,
} from "@/lib/leak-guard";

async function handler(request: NextRequest): Promise<NextResponse> {
  const segments = request.nextUrl.pathname.split("/");
  // pathname: /api/skills/{slug}/rent → segments[-2] = slug
  const slug = segments[segments.length - 2];

  const skill = getSkillBySlug(slug);

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const userPrompt = body?.prompt;
  const model = body?.model;

  if (!userPrompt || typeof userPrompt !== "string") {
    return NextResponse.json(
      { error: "Missing 'prompt' string in request body" },
      { status: 400 }
    );
  }

  // Leak guard: detect meta-queries attempting to extract system prompt
  if (isMetaQuery(userPrompt)) {
    return NextResponse.json({
      type: "rent",
      slug: skill.slug,
      skill_name: skill.metadata.name,
      response:
        "I can help you with questions in my area of expertise, but I cannot share my underlying instructions.",
      tokens_used: 0,
      latency_ms: 0,
      meta_query_blocked: true,
    });
  }

  // Check if Anthropic API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error: "Inference not available — ANTHROPIC_API_KEY not configured",
        hint: "Add ANTHROPIC_API_KEY to .env.local to enable blind inference",
      },
      { status: 503 }
    );
  }

  // Run blind inference
  const wrappedPrompt = wrapSystemPrompt(skill.content);

  const result = await runInference({
    systemPrompt: wrappedPrompt,
    userPrompt,
    model,
  });

  // Post-processing: sanitize response for any leaked prompt content
  const sanitized = sanitizeResponse(skill.content, result.response);

  return NextResponse.json({
    type: "rent",
    slug: skill.slug,
    skill_name: skill.metadata.name,
    response: sanitized,
    model: result.model,
    tokens_in: result.tokens_in,
    tokens_out: result.tokens_out,
    latency_ms: result.latency_ms,
  });
}

// Dynamic route config: reads slug from URL to get per-skill pricing
export const POST = withX402(
  handler,
  x402Config.walletAddress,
  async (request: NextRequest) => {
    const segments = request.nextUrl.pathname.split("/");
    const slug = segments[segments.length - 2];
    const skill = getSkillBySlug(slug);
    // Use skill-specific price or default to $0.01
    const price = skill?.metadata.price_rent ?? 0.01;
    const name = skill?.metadata.name ?? "Unknown Skill";
    return getSkillRentConfig(price, name);
  }
);
