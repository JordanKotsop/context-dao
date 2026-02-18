#!/usr/bin/env node

/**
 * ContextDAO MCP Server
 *
 * Exposes the cognitive asset marketplace to MCP-compatible agents.
 * Tools: search_skills, get_skill_detail, preview_skill, purchase_skill, list_owned_skills
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getAllSkills, getSkillBySlug, searchSkills } from "./skills-loader.js";
import Anthropic from "@anthropic-ai/sdk";

// --- In-memory state for purchased skills (per-session) ---

interface OwnedSkill {
  slug: string;
  mode: "buy" | "rent";
  acquired_at: string;
  content?: string; // Only present for "buy" mode
}

const ownedSkills: Map<string, OwnedSkill> = new Map();

// --- Preview rate limiting (1/day/skill) ---

const previewLog: Map<string, number> = new Map();
const PREVIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function canPreview(slug: string): boolean {
  const last = previewLog.get(slug);
  if (!last) return true;
  return Date.now() - last > PREVIEW_COOLDOWN_MS;
}

// --- Inference helper (for preview + rent) ---

async function runInference(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 512
): Promise<{ response: string; model: string; tokens_in: number; tokens_out: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set — inference unavailable");
  }

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const responseText = message.content
    .filter((block) => block.type === "text")
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n");

  return {
    response: responseText,
    model: message.model,
    tokens_in: message.usage.input_tokens,
    tokens_out: message.usage.output_tokens,
  };
}

// --- MCP Server ---

const server = new McpServer(
  {
    name: "context-dao",
    version: "0.1.0",
  },
  {
    capabilities: {
      logging: {},
    },
  }
);

// Tool 1: search_skills
server.tool(
  "search_skills",
  "Search the ContextDAO marketplace for cognitive assets (system prompt skills). Returns matching skills with metadata and pricing.",
  {
    query: z.string().optional().describe("Search query (matches name, description, tags)"),
    category: z.string().optional().describe("Filter by category (e.g. 'persona', 'domain-knowledge', 'developer-tool')"),
    max_price: z.number().optional().describe("Maximum price per rent call in USD"),
  },
  async ({ query, category, max_price }) => {
    const results = searchSkills(query, category, max_price);

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No skills found matching your criteria.",
          },
        ],
      };
    }

    const formatted = results.map((s) => ({
      slug: s.slug,
      name: s.metadata.name,
      description: s.metadata.description,
      category: s.metadata.category,
      tags: s.metadata.tags,
      price_buy: `$${s.metadata.price_buy}`,
      price_rent: `$${s.metadata.price_rent}/call`,
      accuracy_score: s.metadata.accuracy_score
        ? `${s.metadata.accuracy_score}%`
        : "Unvalidated",
      token_estimate: s.metadata.token_estimate,
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(formatted, null, 2),
        },
      ],
    };
  }
);

// Tool 2: get_skill_detail
server.tool(
  "get_skill_detail",
  "Get full details for a specific cognitive asset including pricing, accuracy score, and a content preview.",
  {
    slug: z.string().describe("The skill slug (e.g. 'spanish-crypto-tax')"),
  },
  async ({ slug }) => {
    const skill = getSkillBySlug(slug);

    if (!skill) {
      return {
        content: [
          { type: "text" as const, text: `Skill '${slug}' not found.` },
        ],
      };
    }

    // Show a content preview (first 200 chars) — not the full prompt
    const preview =
      skill.content.length > 200
        ? skill.content.slice(0, 200) + "..."
        : skill.content;

    const detail = {
      slug: skill.slug,
      name: skill.metadata.name,
      version: skill.metadata.version,
      author: skill.metadata.author,
      description: skill.metadata.description,
      category: skill.metadata.category,
      tags: skill.metadata.tags,
      pricing: {
        buy: `$${skill.metadata.price_buy} — one-time, get full .md source`,
        rent: `$${skill.metadata.price_rent}/call — blind inference, IP protected`,
      },
      accuracy_score: skill.metadata.accuracy_score
        ? `${skill.metadata.accuracy_score}%`
        : "Unvalidated",
      token_estimate: skill.metadata.token_estimate,
      content_preview: preview,
      owned: ownedSkills.has(slug),
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(detail, null, 2),
        },
      ],
    };
  }
);

// Tool 3: preview_skill
server.tool(
  "preview_skill",
  "Run a free demo inference against a skill (limited to 1 preview per skill per day). Uses a short max-token response to give you a taste of the skill's capabilities.",
  {
    slug: z.string().describe("The skill slug to preview"),
    test_prompt: z.string().describe("A test question to ask the skill"),
  },
  async ({ slug, test_prompt }) => {
    const skill = getSkillBySlug(slug);

    if (!skill) {
      return {
        content: [
          { type: "text" as const, text: `Skill '${slug}' not found.` },
        ],
      };
    }

    if (!canPreview(slug)) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Preview limit reached for '${skill.metadata.name}'. You can preview this skill again in 24 hours. To use it now, purchase via purchase_skill.`,
          },
        ],
      };
    }

    try {
      const result = await runInference(skill.content, test_prompt, 256);
      previewLog.set(slug, Date.now());

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                skill: skill.metadata.name,
                mode: "preview (free, limited)",
                response: result.response,
                model: result.model,
                tokens_used: result.tokens_in + result.tokens_out,
                note: "This is a preview. Full responses available via purchase_skill.",
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Preview failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          },
        ],
      };
    }
  }
);

// Tool 4: purchase_skill
server.tool(
  "purchase_skill",
  "Purchase a cognitive asset. Buy mode returns the full .md source for permanent use. Rent mode runs a blind inference call (IP protected). On testnet (Base Sepolia), payments are simulated.",
  {
    slug: z.string().describe("The skill slug to purchase"),
    mode: z.enum(["buy", "rent"]).describe("'buy' for full source access, 'rent' for single blind inference"),
    prompt: z.string().optional().describe("Required for 'rent' mode — the question to ask the skill"),
  },
  async ({ slug, mode, prompt }) => {
    const skill = getSkillBySlug(slug);

    if (!skill) {
      return {
        content: [
          { type: "text" as const, text: `Skill '${slug}' not found.` },
        ],
      };
    }

    if (mode === "rent" && !prompt) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Rent mode requires a 'prompt' parameter — the question to ask the skill.",
          },
        ],
      };
    }

    const price = mode === "buy" ? skill.metadata.price_buy : skill.metadata.price_rent;

    if (mode === "buy") {
      // Buy: return full source content
      ownedSkills.set(slug, {
        slug,
        mode: "buy",
        acquired_at: new Date().toISOString(),
        content: skill.content,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                status: "purchased",
                skill: skill.metadata.name,
                mode: "buy",
                price: `$${price}`,
                payment: "x402 (Base Sepolia testnet — simulated)",
                content: skill.content,
                instruction:
                  "Add this content to your system prompt or context to use this skill permanently.",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Rent: run blind inference
    try {
      const result = await runInference(skill.content, prompt!, 2048);

      ownedSkills.set(`${slug}:rent:${Date.now()}`, {
        slug,
        mode: "rent",
        acquired_at: new Date().toISOString(),
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                status: "inference_complete",
                skill: skill.metadata.name,
                mode: "rent",
                price: `$${price}`,
                payment: "x402 (Base Sepolia testnet — simulated)",
                response: result.response,
                model: result.model,
                tokens_in: result.tokens_in,
                tokens_out: result.tokens_out,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Inference failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          },
        ],
      };
    }
  }
);

// Tool 5: list_owned_skills
server.tool(
  "list_owned_skills",
  "List all cognitive assets you've purchased or rented in this session.",
  {},
  async () => {
    if (ownedSkills.size === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No skills purchased yet. Use search_skills to find skills, then purchase_skill to acquire them.",
          },
        ],
      };
    }

    const owned = Array.from(ownedSkills.values()).map((s) => ({
      slug: s.slug,
      mode: s.mode,
      acquired_at: s.acquired_at,
      has_source: !!s.content,
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(owned, null, 2),
        },
      ],
    };
  }
);

// --- Start server ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ContextDAO MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
