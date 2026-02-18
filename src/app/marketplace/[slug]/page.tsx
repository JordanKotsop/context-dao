import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllSkills, getSkillBySlug } from "@/lib/skills";
import { AccuracyBadge } from "@/components/marketplace/accuracy-badge";
import { PricingTable } from "@/components/marketplace/pricing-table";
import { SiteHeader } from "@/components/site-header";

interface SkillDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const skills = getAllSkills();
  return skills.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: SkillDetailPageProps) {
  const { slug } = await params;
  const skill = getSkillBySlug(slug);
  if (!skill) return { title: "Not Found — ContextDAO" };
  return {
    title: `${skill.metadata.name} — ContextDAO`,
    description: skill.metadata.description,
  };
}

export default async function SkillDetailPage({
  params,
}: SkillDetailPageProps) {
  const { slug } = await params;
  const skill = getSkillBySlug(slug);

  if (!skill) notFound();

  const { metadata } = skill;
  const categoryParts = metadata.category.split("/");

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader activeNav="Marketplace" />

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-12 md:px-12">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-white/40">
          <Link
            href="/marketplace"
            className="transition-colors hover:text-white/60"
          >
            Marketplace
          </Link>
          <span>/</span>
          <span className="text-white/60">{metadata.name}</span>
        </div>

        {/* Title section */}
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-white/50">
              {categoryParts.join(" / ")}
            </span>
            <AccuracyBadge score={metadata.accuracy_score} size="md" />
            <span className="text-xs text-white/30">v{metadata.version}</span>
          </div>
          <h1 className="mb-3 text-4xl font-bold">{metadata.name}</h1>
          <p className="max-w-2xl text-lg text-white/60">
            {metadata.description}
          </p>
        </div>

        {/* Meta row */}
        <div className="mb-10 flex flex-wrap items-center gap-6 text-sm text-white/40">
          <div className="flex items-center gap-2">
            <span className="text-white/60">Author:</span>
            <span className="text-white">{metadata.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60">Tokens:</span>
            <span className="text-white">~{metadata.token_estimate}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60">Created:</span>
            <span className="text-white">{metadata.created}</span>
          </div>
          {metadata.model_preference && (
            <div className="flex items-center gap-2">
              <span className="text-white/60">Best with:</span>
              <span className="font-mono text-xs text-lime">
                {metadata.model_preference}
              </span>
            </div>
          )}
        </div>

        {/* Pricing */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Pricing</h2>
          <PricingTable metadata={metadata} slug={slug} />
        </section>

        {/* Tags */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {metadata.tags.map((tag) => (
              <Link
                key={tag}
                href={`/marketplace?q=${tag}`}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/60 transition-colors hover:border-lime/30 hover:text-lime"
              >
                {tag}
              </Link>
            ))}
          </div>
        </section>

        {/* Content preview */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Prompt Preview</h2>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-white/50">
              {skill.content.slice(0, 500)}
            </pre>
            {skill.content.length > 500 && (
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
            )}
            {skill.content.length > 500 && (
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="rounded-full border border-lime/30 bg-black px-4 py-1.5 text-xs text-lime">
                  Buy to see full prompt ({skill.content.length} chars)
                </span>
              </div>
            )}
          </div>
        </section>

        {/* License */}
        {metadata.license && (
          <section className="border-t border-white/5 pt-6 text-sm text-white/30">
            License: {metadata.license}
          </section>
        )}
      </main>
    </div>
  );
}
