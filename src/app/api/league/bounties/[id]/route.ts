import { NextRequest, NextResponse } from "next/server";
import { getBountyById, getSubmissionsForBounty } from "@/lib/bounty";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const segments = request.nextUrl.pathname.split("/");
  const id = segments[segments.length - 1];

  const bounty = getBountyById(id);
  if (!bounty) {
    return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
  }

  const submissions = getSubmissionsForBounty(bounty.id).map((s) => ({
    id: s.id,
    optimizer_wallet: s.optimizer_wallet,
    submitted_at: s.submitted_at,
    status: s.status,
    accuracy_delta: s.accuracy_delta,
    token_delta: s.token_delta,
    payout: s.payout,
  }));

  return NextResponse.json({
    ...bounty,
    submissions,
  });
}
