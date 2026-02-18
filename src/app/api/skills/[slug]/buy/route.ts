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

  return NextResponse.json({
    type: "buy",
    slug: skill.slug,
    metadata: skill.metadata,
    content: skill.content,
    message: "Full source access granted. You own this cognitive asset.",
  });
}

export const GET = withX402(handler, x402Config.walletAddress, {
  price: "$5.00",
  network: x402Config.network,
  config: {
    description: "Buy: Full source access to this cognitive asset",
  },
});
