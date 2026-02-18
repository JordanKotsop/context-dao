import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "x402-next";
import { getSkillBySlug } from "@/lib/skills";
import { x402Config } from "@/lib/x402";

async function handler(request: NextRequest): Promise<NextResponse> {
  const segments = request.nextUrl.pathname.split("/");
  const slug = segments[segments.length - 2];

  const skill = getSkillBySlug(slug);

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const userPrompt = body?.prompt;

  if (!userPrompt) {
    return NextResponse.json(
      { error: "Missing 'prompt' in request body" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    type: "rent",
    slug: skill.slug,
    skill_name: skill.metadata.name,
    user_prompt: userPrompt,
    response:
      "[Blind Inference Runner not yet implemented — Feature #5] " +
      "Payment verified. In production, this would inject the hidden " +
      `system prompt from '${skill.metadata.name}' and return the ` +
      "LLM response without exposing the source.",
    tokens_used: null,
    latency_ms: null,
  });
}

export const POST = withX402(handler, x402Config.walletAddress, {
  price: "$0.01",
  network: x402Config.network,
  config: {
    description: "Rent: Single blind inference call against this cognitive asset",
  },
});
