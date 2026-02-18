import { NextResponse } from "next/server";
import { getLeaderboard, getActiveBounties } from "@/lib/bounty";

export async function GET(): Promise<NextResponse> {
  const leaderboard = getLeaderboard();
  const activeBounties = getActiveBounties();

  return NextResponse.json({
    leaderboard,
    active_bounties: activeBounties.length,
    total_pool: activeBounties.reduce((sum, b) => sum + b.pool_remaining, 0),
  });
}
