export const dynamic = "force-dynamic";

import { getActiveBounties, getAllBounties, getLeaderboard } from "@/lib/bounty";
import { getSkillBySlug } from "@/lib/skills";
import { BountyCard } from "@/components/league/bounty-card";
import { LeaderboardTable } from "@/components/league/leaderboard-table";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Validation League — ContextDAO",
  description:
    "Optimize cognitive assets for yield. Bittensor-style bounties for prompt engineering.",
};

export default function LeaguePage() {
  const activeBounties = getActiveBounties();
  const allBounties = getAllBounties();
  const leaderboard = getLeaderboard();

  const totalPool = activeBounties.reduce(
    (sum, b) => sum + b.pool_remaining,
    0
  );
  const totalPaidOut = allBounties.reduce(
    (sum, b) => sum + (b.max_pool - b.pool_remaining),
    0
  );

  // Enrich bounties with skill names
  const enrichedBounties = activeBounties.map((b) => {
    const skill = getSkillBySlug(b.skill_slug);
    return {
      ...b,
      skill_name: skill?.metadata.name,
    };
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader activeNav="League" />

      <main className="mx-auto max-w-6xl px-6 py-12 md:px-12">
        {/* Hero */}
        <div className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-4 py-1.5 text-sm text-lime">
            <span className="h-2 w-2 animate-pulse rounded-full bg-lime" />
            Validation League
          </div>
          <h1 className="mb-3 text-3xl font-bold md:text-4xl">
            Optimize for Yield
          </h1>
          <p className="max-w-2xl text-lg text-white/50">
            Submit improved skill versions. If your optimization beats the
            current score, you get paid automatically via x402.
            Bittensor-style incentives for prompt engineering.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            {
              label: "Active Bounties",
              value: activeBounties.length.toString(),
            },
            {
              label: "Total Pool",
              value: `$${totalPool.toFixed(2)}`,
              accent: true,
            },
            {
              label: "Paid Out",
              value: `$${totalPaidOut.toFixed(2)}`,
            },
            {
              label: "Optimizers",
              value: leaderboard.length.toString(),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
            >
              <div className="text-xs uppercase tracking-wider text-white/40">
                {stat.label}
              </div>
              <div
                className={`mt-2 text-2xl font-bold ${stat.accent ? "text-lime" : "text-white"}`}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Active Bounties */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-semibold">Active Bounties</h2>
          {enrichedBounties.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {enrichedBounties.map((bounty) => (
                <BountyCard key={bounty.id} bounty={bounty} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
              <div className="mb-3 text-3xl">&#127942;</div>
              <p className="text-white/50">No active bounties</p>
              <p className="mt-1 text-sm text-white/30">
                Create a bounty via the API to start the optimization flywheel
              </p>
              <code className="mt-4 rounded-lg bg-white/5 px-4 py-2 text-xs text-white/40">
                POST /api/league/bounties
              </code>
            </div>
          )}
        </section>

        {/* Leaderboard */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-semibold">Leaderboard</h2>
          <LeaderboardTable entries={leaderboard} />
        </section>

        {/* How it works */}
        <section>
          <h2 className="mb-6 text-xl font-semibold">How It Works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Pick a Bounty",
                desc: "Choose a skill to optimize. Download the current version and study the validation criteria.",
              },
              {
                step: "2",
                title: "Submit v2",
                desc: "Improve the system prompt. Better accuracy, fewer tokens, or both. Submit your optimized version.",
              },
              {
                step: "3",
                title: "Get Paid",
                desc: "The Referee Agent scores both versions. If yours wins, USDC payment is triggered automatically via x402.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-lime/10 text-lg font-bold text-lime">
                  {item.step}
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
