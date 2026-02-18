import { NextRequest, NextResponse } from "next/server";
import {
  getBountyById,
  createSubmission,
  updateSubmission,
  deductBountyPool,
} from "@/lib/bounty";
import { getSkillBySlug } from "@/lib/skills";
import { referee } from "@/lib/referee";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const segments = request.nextUrl.pathname.split("/");
  // URL: /api/league/bounties/[id]/submit → id is at index -2
  const bountyId = segments[segments.length - 2];

  const bounty = getBountyById(bountyId);
  if (!bounty) {
    return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
  }

  if (bounty.status !== "active") {
    return NextResponse.json(
      { error: `Bounty is ${bounty.status}` },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { optimizer_wallet, v2_content } = body;

  if (!optimizer_wallet || !v2_content) {
    return NextResponse.json(
      { error: "Missing required fields: optimizer_wallet, v2_content" },
      { status: 400 }
    );
  }

  const skill = getSkillBySlug(bounty.skill_slug);
  if (!skill) {
    return NextResponse.json(
      { error: "Skill not found for this bounty" },
      { status: 404 }
    );
  }

  // Create the submission record
  const submission = createSubmission({
    bounty_id: bounty.id,
    skill_slug: bounty.skill_slug,
    optimizer_wallet,
    v2_content,
  });

  // Check API key before starting evaluation
  if (!process.env.ANTHROPIC_API_KEY) {
    updateSubmission(submission.id, { status: "pending" });
    return NextResponse.json(
      {
        submission_id: submission.id,
        status: "pending",
        message:
          "Submission recorded. Evaluation requires ANTHROPIC_API_KEY to be configured.",
      },
      { status: 202 }
    );
  }

  // Run the referee
  updateSubmission(submission.id, { status: "evaluating" });

  try {
    const verdict = await referee(bounty.skill_slug, skill.content, v2_content);

    if (verdict.improved) {
      // Calculate payout
      const accuracyReward =
        Math.max(0, verdict.accuracy_delta) *
        bounty.reward_per_accuracy_pct;
      const tokenRewardPct =
        verdict.v1_score.total_tokens > 0
          ? (verdict.token_delta / verdict.v1_score.total_tokens) * 100
          : 0;
      const tokenReward =
        Math.max(0, tokenRewardPct) *
        bounty.reward_per_token_reduction_pct;
      const totalPayout = Math.min(
        accuracyReward + tokenReward,
        bounty.pool_remaining
      );

      updateSubmission(submission.id, {
        status: "accepted",
        accuracy_delta: verdict.accuracy_delta,
        token_delta: verdict.token_delta,
        payout: Math.round(totalPayout * 100) / 100,
        verdict_timestamp: verdict.timestamp,
      });

      deductBountyPool(bounty.id, totalPayout);

      return NextResponse.json({
        submission_id: submission.id,
        status: "accepted",
        verdict: {
          v1_accuracy: verdict.v1_score.accuracy_pct,
          v2_accuracy: verdict.v2_score.accuracy_pct,
          accuracy_delta: verdict.accuracy_delta,
          token_delta: verdict.token_delta,
        },
        payout: {
          accuracy_reward: Math.round(accuracyReward * 100) / 100,
          token_reward: Math.round(tokenReward * 100) / 100,
          total: Math.round(totalPayout * 100) / 100,
          currency: "USDC",
          network: "base-sepolia",
          payment_method: "x402 (simulated on testnet)",
        },
        message: `Improvement confirmed! $${(Math.round(totalPayout * 100) / 100).toFixed(2)} USDC payout queued.`,
      });
    } else {
      updateSubmission(submission.id, {
        status: "rejected",
        accuracy_delta: verdict.accuracy_delta,
        token_delta: verdict.token_delta,
        payout: 0,
        verdict_timestamp: verdict.timestamp,
      });

      return NextResponse.json({
        submission_id: submission.id,
        status: "rejected",
        verdict: {
          v1_accuracy: verdict.v1_score.accuracy_pct,
          v2_accuracy: verdict.v2_score.accuracy_pct,
          accuracy_delta: verdict.accuracy_delta,
          token_delta: verdict.token_delta,
        },
        message: "No improvement detected. Try again with a different approach.",
      });
    }
  } catch (err) {
    updateSubmission(submission.id, { status: "pending" });
    return NextResponse.json(
      {
        submission_id: submission.id,
        status: "error",
        error: err instanceof Error ? err.message : "Evaluation failed",
      },
      { status: 500 }
    );
  }
}
