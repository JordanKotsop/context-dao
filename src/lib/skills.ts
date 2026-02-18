import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface SkillMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
  category: string;
  price_buy: number;
  price_rent: number;
  token_estimate: number;
  accuracy_score: number | null;
  created: string;
  tags: string[];
  model_preference?: string;
  license?: string;
}

export interface Skill {
  slug: string;
  metadata: SkillMetadata;
  content: string;
}

export interface SkillSummary {
  slug: string;
  metadata: SkillMetadata;
}

const SKILLS_DIR = path.join(process.cwd(), "skills");

function parseSkillFile(slug: string): Skill | null {
  const skillPath = path.join(SKILLS_DIR, slug, "skill.md");
  if (!fs.existsSync(skillPath)) return null;

  const raw = fs.readFileSync(skillPath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    metadata: data as SkillMetadata,
    content: content.trim(),
  };
}

export function getAllSkills(): SkillSummary[] {
  if (!fs.existsSync(SKILLS_DIR)) return [];

  const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });

  return dirs
    .filter(
      (d) => d.isDirectory() && d.name !== "schema" && d.name !== "node_modules"
    )
    .map((d) => {
      const skill = parseSkillFile(d.name);
      if (!skill) return null;
      return { slug: skill.slug, metadata: skill.metadata };
    })
    .filter((s): s is SkillSummary => s !== null)
    .sort(
      (a, b) =>
        new Date(b.metadata.created).getTime() -
        new Date(a.metadata.created).getTime()
    );
}

export function getSkillBySlug(slug: string): Skill | null {
  return parseSkillFile(slug);
}

export function searchSkills(
  query: string,
  category?: string,
  sortBy?: "newest" | "price_low" | "price_high" | "accuracy"
): SkillSummary[] {
  let results = getAllSkills();

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (s) =>
        s.metadata.name.toLowerCase().includes(q) ||
        s.metadata.description.toLowerCase().includes(q) ||
        s.metadata.tags.some((t) => t.includes(q))
    );
  }

  if (category) {
    results = results.filter((s) => s.metadata.category.startsWith(category));
  }

  if (sortBy) {
    switch (sortBy) {
      case "newest":
        results.sort(
          (a, b) =>
            new Date(b.metadata.created).getTime() -
            new Date(a.metadata.created).getTime()
        );
        break;
      case "price_low":
        results.sort((a, b) => a.metadata.price_buy - b.metadata.price_buy);
        break;
      case "price_high":
        results.sort((a, b) => b.metadata.price_buy - a.metadata.price_buy);
        break;
      case "accuracy":
        results.sort(
          (a, b) => (b.metadata.accuracy_score ?? 0) - (a.metadata.accuracy_score ?? 0)
        );
        break;
    }
  }

  return results;
}
