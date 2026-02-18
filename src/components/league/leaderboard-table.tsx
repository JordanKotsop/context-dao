interface LeaderboardEntry {
  wallet: string;
  total_earnings: number;
  submissions_accepted: number;
  submissions_total: number;
  best_accuracy_delta: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
        <div className="mb-3 text-3xl">&#9878;</div>
        <p className="text-white/50">No optimizers yet</p>
        <p className="mt-1 text-sm text-white/30">
          Submit an improved skill to appear here
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02]">
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">
              Optimizer
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/40">
              Earnings
            </th>
            <th className="hidden px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/40 sm:table-cell">
              Accepted
            </th>
            <th className="hidden px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/40 md:table-cell">
              Best Delta
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {entries.map((entry, i) => (
            <tr
              key={entry.wallet}
              className="transition-colors hover:bg-white/[0.02]"
            >
              <td className="px-6 py-4">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                    i === 0
                      ? "bg-lime/20 text-lime"
                      : i === 1
                        ? "bg-white/10 text-white/70"
                        : i === 2
                          ? "bg-orange-500/10 text-orange-400"
                          : "text-white/30"
                  }`}
                >
                  {i + 1}
                </span>
              </td>
              <td className="px-6 py-4">
                <code className="text-sm text-white/60">
                  {entry.wallet.slice(0, 6)}...{entry.wallet.slice(-4)}
                </code>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="font-semibold text-lime">
                  ${entry.total_earnings.toFixed(2)}
                </span>
              </td>
              <td className="hidden px-6 py-4 text-right text-sm text-white/50 sm:table-cell">
                {entry.submissions_accepted}/{entry.submissions_total}
              </td>
              <td className="hidden px-6 py-4 text-right text-sm md:table-cell">
                <span className="text-lime">
                  +{entry.best_accuracy_delta.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
