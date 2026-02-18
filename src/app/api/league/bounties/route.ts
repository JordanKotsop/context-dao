import { NextRequest, NextResponse } from "next/server";
import {
  getActiveBounties,
  createBounty,
} from "@/lib/bounty";
import { getSkillBySlug } from "@/lib/skills";

export async function GET(): Promise<NextResponse> {
  const bounties = getActiveBounties();

  return NextResponse.json({
    count: bounties.length,
    bounties: bounties.map((b) => ({
      id: b.id,
      skill_slug: b.skill_slug,
      reward_per_accuracy_pct: b.reward_per_accuracy_pct,
      reward_per_token_reduction_pct: b.reward_per_token_reduction_pct,
      pool_remaining: b.pool_remaining,
      max_pool: b.max_pool,
      expires_at: b.expires_at,
      status: b.status,
    })),
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const {
    skill_slug,
    creator_wallet,
    reward_per_accuracy_pct,
    reward_per_token_reduction_pct,
    max_pool,
    expires_in_days,
  } = body;

  if (!skill_slug || !creator_wallet || !max_pool) {
    return NextResponse.json(
      {
        error: "Missing required fields: skill_slug, creator_wallet, max_pool",
      },
      { status: 400 }
    );
  }

  const skill = getSkillBySlug(skill_slug);
  if (!skill) {
    return NextResponse.json(
      { error: `Skill '${skill_slug}' not found` },
      { status: 404 }
    );
  }

  const bounty = createBounty({
    skill_slug,
    creator_wallet,
    reward_per_accuracy_pct: reward_per_accuracy_pct ?? 5,
    reward_per_token_reduction_pct: reward_per_token_reduction_pct ?? 2,
    max_pool,
    expires_in_days: expires_in_days ?? 30,
  });

  return NextResponse.json(bounty, { status: 201 });
}
