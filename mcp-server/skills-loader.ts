/**
 * Skills loader — reads skill .md files from the skills/ directory.
 * Standalone version for the MCP server (no Next.js dependency).
 */

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

function getSkillsDir(): string {
  // Walk up from mcp-server/ to find the skills/ directory
  const candidates = [
    path.join(process.cwd(), "skills"),
    path.join(process.cwd(), "..", "skills"),
    path.join(__dirname, "..", "skills"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return path.join(process.cwd(), "skills");
}

function parseSkillFile(skillsDir: string, slug: string): Skill | null {
  const skillPath = path.join(skillsDir, slug, "skill.md");
  if (!fs.existsSync(skillPath)) return null;

  const raw = fs.readFileSync(skillPath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    metadata: data as SkillMetadata,
    content: content.trim(),
  };
}

export function getAllSkills(): Skill[] {
  const skillsDir = getSkillsDir();
  if (!fs.existsSync(skillsDir)) return [];

  const dirs = fs.readdirSync(skillsDir, { withFileTypes: true });

  return dirs
    .filter(
      (d) =>
        d.isDirectory() && d.name !== "schema" && d.name !== "node_modules"
    )
    .map((d) => parseSkillFile(skillsDir, d.name))
    .filter((s): s is Skill => s !== null)
    .sort(
      (a, b) =>
        new Date(b.metadata.created).getTime() -
        new Date(a.metadata.created).getTime()
    );
}

export function getSkillBySlug(slug: string): Skill | null {
  const skillsDir = getSkillsDir();
  return parseSkillFile(skillsDir, slug);
}

export function searchSkills(
  query?: string,
  category?: string,
  maxPrice?: number
): Skill[] {
  let results = getAllSkills();

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (s) =>
        s.metadata.name.toLowerCase().includes(q) ||
        s.metadata.description.toLowerCase().includes(q) ||
        s.metadata.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (category) {
    results = results.filter((s) =>
      s.metadata.category.toLowerCase().startsWith(category.toLowerCase())
    );
  }

  if (maxPrice !== undefined) {
    results = results.filter((s) => s.metadata.price_rent <= maxPrice);
  }

  return results;
}
