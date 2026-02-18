import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "x402-next";
import { getSkillBySlug } from "@/lib/skills";
import { x402Config, getSkillBuyConfig } from "@/lib/x402";

async function handler(request: NextRequest): Promise<NextResponse> {
  const segments = request.nextUrl.pathname.split("/");
  // pathname: /api/skills/{slug}/buy → segments[-2] = slug
  const slug = segments[segments.length - 2];

  const skill = getSkillBySlug(slug);

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  return NextResponse.json({
    type: "buy",
    slug: skill.slug,
    metadata: skill.metadata,
    content: skill.content,
    message: "Full source access granted. You own this cognitive asset.",
  });
}

// Dynamic route config: reads slug from URL to get per-skill pricing
export const GET = withX402(
  handler,
  x402Config.walletAddress,
  async (request: NextRequest) => {
    const segments = request.nextUrl.pathname.split("/");
    const slug = segments[segments.length - 2];
    const skill = getSkillBySlug(slug);
    // Use skill-specific price or default to $5.00
    const price = skill?.metadata.price_buy ?? 5.0;
    const name = skill?.metadata.name ?? "Unknown Skill";
    return getSkillBuyConfig(price, name);
  }
);
