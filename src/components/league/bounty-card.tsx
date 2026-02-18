import Link from "next/link";

interface BountyCardProps {
  bounty: {
    id: string;
    skill_slug: string;
    reward_per_accuracy_pct: number;
    reward_per_token_reduction_pct: number;
    pool_remaining: number;
    max_pool: number;
    expires_at: string;
    status: string;
    skill_name?: string;
  };
}

export function BountyCard({ bounty }: BountyCardProps) {
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
    <Link href={`/league/${bounty.id}`}>
      <div className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:border-lime/30 hover:bg-white/[0.04]">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-white">
              {bounty.skill_name ?? bounty.skill_slug}
            </h3>
            <p className="mt-1 text-sm text-white/40">{bounty.skill_slug}</p>
          </div>
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
        </div>

        {/* Rewards */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-xs text-white/40">Per 1% accuracy</div>
            <div className="mt-1 text-lg font-bold text-lime">
              ${bounty.reward_per_accuracy_pct}
            </div>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-xs text-white/40">Per 1% token save</div>
            <div className="mt-1 text-lg font-bold text-white/80">
              ${bounty.reward_per_token_reduction_pct}
            </div>
          </div>
        </div>

        {/* Pool bar */}
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs text-white/40">
            <span>Pool remaining</span>
            <span>
              ${bounty.pool_remaining.toFixed(2)} / ${bounty.max_pool.toFixed(2)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-lime transition-all"
              style={{ width: `${poolPct}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-white/30">
          <span>{daysLeft}d remaining</span>
          <span className="text-white/50 transition-colors group-hover:text-lime">
            View details &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
