import { cn } from "@/lib/utils";

interface AccuracyBadgeProps {
  score: number | null;
  size?: "sm" | "md";
}

export function AccuracyBadge({ score, size = "sm" }: AccuracyBadgeProps) {
  if (score === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 text-white/40",
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
        )}
      >
        Unvalidated
      </span>
    );
  }

  const color =
    score >= 80
      ? "text-lime border-lime/30 bg-lime/10"
      : score >= 60
        ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"
        : "text-red-400 border-red-400/30 bg-red-400/10";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        color,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      {score}%
    </span>
  );
}
