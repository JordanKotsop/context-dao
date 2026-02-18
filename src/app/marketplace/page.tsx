import { Suspense } from "react";
import { searchSkills } from "@/lib/skills";
import { SkillCard } from "@/components/marketplace/skill-card";
import { SearchBar } from "@/components/marketplace/search-bar";
import { SiteHeader } from "@/components/site-header";

interface MarketplacePageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
  }>;
}

export const metadata = {
  title: "Marketplace — ContextDAO",
  description: "Browse, search, and acquire cognitive assets",
};

export default async function MarketplacePage({
  searchParams,
}: MarketplacePageProps) {
  const params = await searchParams;
  const skills = searchSkills(
    params.q ?? "",
    params.category ?? undefined,
    (params.sort as "newest" | "price_low" | "price_high" | "accuracy") ??
      undefined
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader activeNav="Marketplace" />

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-12 md:px-12">
        {/* Title */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Cognitive Assets</h1>
          <p className="text-white/50">
            Browse high-performance system prompts. Buy for source access or
            rent for blind inference.
          </p>
        </div>

        {/* Search & filters */}
        <div className="mb-8">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
        </div>

        {/* Results count */}
        <div className="mb-6 text-sm text-white/40">
          {skills.length} skill{skills.length !== 1 ? "s" : ""} available
        </div>

        {/* Grid */}
        {skills.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => (
              <SkillCard key={skill.slug} skill={skill} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
            <div className="mb-3 text-4xl">&#128270;</div>
            <p className="text-white/50">No skills found</p>
            <p className="text-sm text-white/30">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
