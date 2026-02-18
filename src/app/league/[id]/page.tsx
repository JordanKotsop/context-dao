export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBountyById,
  getSubmissionsForBounty,
  getAllBounties,
} from "@/lib/bounty";
import { getSkillBySlug } from "@/lib/skills";

interface BountyDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const bounties = getAllBounties();
  return bounties.map((b) => ({ id: b.id }));
}

export default async function BountyDetailPage({
  params,
}: BountyDetailPageProps) {
  const { id } = await params;
  const bounty = getBountyById(id);

  if (!bounty) {
    notFound();
  }

  const skill = getSkillBySlug(bounty.skill_slug);
  const submissions = getSubmissionsForBounty(bounty.id);

  const poolPct =
    bounty.max_pool > 0
      ? Math.round((bounty.pool_remaining / bounty.max_pool) * 100)
      : 0;

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(bounty.expires_at).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-4 md:px-12">
        <Link
          href="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime">
            <span className="text-sm font-bold text-black">CD</span>
          </div>
          <span className="hidden text-sm font-medium text-white/70 sm:block">
            ContextDAO
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-white/50">
          <Link
            href="/league"
            className="transition-colors hover:text-white/80"
          >
            League
          </Link>
          <Link
            href="/marketplace"
            className="transition-colors hover:text-white/80"
          >
            Marketplace
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 md:px-12">
        {/* Back link */}
        <Link
          href="/league"
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white/60"
        >
          &larr; Back to League
        </Link>

        {/* Bounty header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                bounty.status === "active"
                  ? "bg-lime/10 text-lime"
                  : bounty.status === "depleted"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-white/10 text-white/40"
              }`}
            >
              {bounty.status}
            </span>
            <span className="text-sm text-white/30">{daysLeft}d remaining</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold">
            {skill?.metadata.name ?? bounty.skill_slug}
          </h1>
          <p className="text-white/50">
            {skill?.metadata.description ?? "Optimize this skill for rewards"}
          </p>
        </div>

        {/* Reward info */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="text-xs uppercase tracking-wider text-white/40">
              Per 1% accuracy gain
            </div>
            <div className="mt-2 text-2xl font-bold text-lime">
              ${bounty.reward_per_accuracy_pct}
            </div>
            <div className="mt-1 text-xs text-white/30">USDC via x402</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="text-xs uppercase tracking-wider text-white/40">
              Per 1% token reduction
            </div>
            <div className="mt-2 text-2xl font-bold text-white/80">
              ${bounty.reward_per_token_reduction_pct}
            </div>
            <div className="mt-1 text-xs text-white/30">USDC via x402</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="text-xs uppercase tracking-wider text-white/40">
              Pool remaining
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              ${bounty.pool_remaining.toFixed(2)}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-lime"
                style={{ width: `${poolPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Submission API reference */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="mb-4 text-lg font-semibold">Submit an Optimization</h2>
          <div className="rounded-xl bg-black/50 p-4">
            <code className="block text-sm text-white/60">
              <span className="text-lime">POST</span>{" "}
              /api/league/bounties/{bounty.id}/submit
            </code>
            <pre className="mt-3 text-xs text-white/40">
              {JSON.stringify(
                {
                  optimizer_wallet: "0xYOUR_WALLET",
                  v2_content: "Your improved system prompt...",
                },
                null,
                2
              )}
            </pre>
          </div>
          <p className="mt-3 text-sm text-white/40">
            The Referee Agent will score your v2 against the validation set and
            compare to the current v1. If improved, payout is automatic.
          </p>
        </div>

        {/* Submissions */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">
            Submissions ({submissions.length})
          </h2>
          {submissions.length > 0 ? (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        sub.status === "accepted"
                          ? "bg-lime/10 text-lime"
                          : sub.status === "rejected"
                            ? "bg-red-500/10 text-red-400"
                            : sub.status === "evaluating"
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-white/10 text-white/40"
                      }`}
                    >
                      {sub.status}
                    </span>
                    <code className="text-sm text-white/50">
                      {sub.optimizer_wallet.slice(0, 6)}...
                      {sub.optimizer_wallet.slice(-4)}
                    </code>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {sub.accuracy_delta !== undefined && (
                      <span
                        className={
                          sub.accuracy_delta > 0
                            ? "text-lime"
                            : "text-white/40"
                        }
                      >
                        {sub.accuracy_delta > 0 ? "+" : ""}
                        {sub.accuracy_delta.toFixed(1)}%
                      </span>
                    )}
                    {sub.payout !== undefined && sub.payout > 0 && (
                      <span className="font-semibold text-lime">
                        ${sub.payout.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-12 text-center">
              <p className="text-white/50">No submissions yet</p>
              <p className="mt-1 text-sm text-white/30">
                Be the first to optimize this skill
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
