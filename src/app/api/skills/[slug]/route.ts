import { NextRequest, NextResponse } from "next/server";
import { getSkillBySlug } from "@/lib/skills";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const skill = getSkillBySlug(slug);

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  // Don't expose full content in API — that's what x402 is for
  return NextResponse.json({
    slug: skill.slug,
    metadata: skill.metadata,
    content_preview: skill.content.slice(0, 200) + "...",
    content_length: skill.content.length,
  });
}
