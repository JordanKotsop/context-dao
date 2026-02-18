import { NextRequest, NextResponse } from "next/server";
import { getSkillBySlug } from "@/lib/skills";
import { x402Config } from "@/lib/x402";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const skill = getSkillBySlug(slug);

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  return NextResponse.json({
    slug: skill.slug,
    name: skill.metadata.name,
    pricing: {
      buy: {
        price_usd: skill.metadata.price_buy,
        endpoint: `/api/skills/${slug}/buy`,
        method: "GET",
        description: "One-time purchase. Returns full .md source.",
        network: x402Config.network,
        recipient: x402Config.walletAddress,
      },
      rent: {
        price_usd: skill.metadata.price_rent,
        endpoint: `/api/skills/${slug}/rent`,
        method: "POST",
        body: { prompt: "string" },
        description: "Per-call blind inference. Source stays hidden.",
        network: x402Config.network,
        recipient: x402Config.walletAddress,
      },
    },
    protocol: "x402",
    protocol_version: 1,
    facilitator: x402Config.facilitatorUrl,
  });
}
