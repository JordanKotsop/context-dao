import Link from "next/link";
import type { SkillSummary } from "@/lib/skills";
import { AccuracyBadge } from "./accuracy-badge";

interface SkillCardProps {
  skill: SkillSummary;
}

const categoryIcons: Record<string, string> = {
  "finance": "$",
  "development": ">_",
  "persona": "@",
  "data": "#",
  "legal": "§",
  "writing": "A",
};

function getCategoryIcon(category: string): string {
  const root = category.split("/")[0];
  return categoryIcons[root] ?? "?";
}

export function SkillCard({ skill }: SkillCardProps) {
  const { metadata, slug } = skill;

  return (
    <Link href={`/marketplace/${slug}`}>
      <div className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:border-lime/30 hover:bg-white/[0.04]">
        {/* Category icon */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 font-mono text-sm text-white/60 transition-colors group-hover:bg-lime/10 group-hover:text-lime">
            {getCategoryIcon(metadata.category)}
          </div>
          <AccuracyBadge score={metadata.accuracy_score} />
        </div>

        {/* Name & description */}
        <h3 className="mb-1 text-lg font-semibold text-white transition-colors group-hover:text-lime">
          {metadata.name}
        </h3>
        <p className="mb-4 line-clamp-2 text-sm text-white/50">
          {metadata.description}
        </p>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {metadata.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/40"
            >
              {tag}
            </span>
          ))}
          {metadata.tags.length > 3 && (
            <span className="text-xs text-white/30">
              +{metadata.tags.length - 3}
            </span>
          )}
        </div>

        {/* Footer: pricing + meta */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm font-medium text-white">
                ${metadata.price_buy}
              </div>
              <div className="text-xs text-white/40">buy</div>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div>
              <div className="text-sm font-medium text-white">
                ${metadata.price_rent}
              </div>
              <div className="text-xs text-white/40">per call</div>
            </div>
          </div>
          <div className="text-xs text-white/30">
            ~{metadata.token_estimate} tokens
          </div>
        </div>
      </div>
    </Link>
  );
}
