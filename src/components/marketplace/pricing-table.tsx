import type { SkillMetadata } from "@/lib/skills";

interface PricingTableProps {
  metadata: SkillMetadata;
  slug: string;
}

export function PricingTable({ metadata, slug }: PricingTableProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Buy option */}
        <div className="rounded-2xl border border-lime/20 bg-lime/5 p-6">
          <div className="mb-1 text-sm font-medium uppercase tracking-wider text-lime/60">
            Buy — Source Access
          </div>
          <div className="mb-3 text-3xl font-bold text-white">
            ${metadata.price_buy}
            <span className="text-base font-normal text-white/40">
              {" "}
              one-time
            </span>
          </div>
          <ul className="mb-6 space-y-2 text-sm text-white/60">
            <li className="flex items-center gap-2">
              <span className="text-lime">&#10003;</span>
              Full .md source file download
            </li>
            <li className="flex items-center gap-2">
              <span className="text-lime">&#10003;</span>
              Run locally — no per-call fees
            </li>
            <li className="flex items-center gap-2">
              <span className="text-lime">&#10003;</span>
              Modify and customize freely
            </li>
          </ul>
          <button className="w-full rounded-xl bg-lime py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-hover">
            Buy via x402
          </button>
        </div>

        {/* Rent option */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="mb-1 text-sm font-medium uppercase tracking-wider text-white/40">
            Rent — Blind Inference
          </div>
          <div className="mb-3 text-3xl font-bold text-white">
            ${metadata.price_rent}
            <span className="text-base font-normal text-white/40">
              {" "}
              per call
            </span>
          </div>
          <ul className="mb-6 space-y-2 text-sm text-white/60">
            <li className="flex items-center gap-2">
              <span className="text-white/40">&#10003;</span>
              Send prompt, get result — IP hidden
            </li>
            <li className="flex items-center gap-2">
              <span className="text-white/40">&#10003;</span>
              Pay only for what you use
            </li>
            <li className="flex items-center gap-2">
              <span className="text-white/40">&#10003;</span>
              ~{metadata.token_estimate} tokens per call
            </li>
          </ul>
          <button className="w-full rounded-xl border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/10">
            Rent via x402
          </button>
        </div>
      </div>

      {/* API endpoint reference */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-white/30">
          x402 API Endpoints
        </div>
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="rounded bg-lime/20 px-1.5 py-0.5 text-lime">
              GET
            </span>
            <span className="text-white/50">
              /api/skills/{slug}/buy
            </span>
            <span className="text-white/20">
              → 402 → pay → source .md
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-blue-400">
              POST
            </span>
            <span className="text-white/50">
              /api/skills/{slug}/rent
            </span>
            <span className="text-white/20">
              → 402 → pay → inference
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/50">
              GET
            </span>
            <span className="text-white/50">
              /api/skills/{slug}/pricing
            </span>
            <span className="text-white/20">→ payment details (free)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
