/**
 * Bounty System — in-memory store for Validation League bounties.
 *
 * In production this would be backed by a database + x402 escrow.
 * For MVP, we use a JSON file for persistence across server restarts.
 */

import fs from "fs";
import path from "path";

// --- Types ---

export interface Bounty {
  id: string;
  skill_slug: string;
  creator_wallet: string;
  reward_per_accuracy_pct: number;
  reward_per_token_reduction_pct: number;
  max_pool: number;
  pool_remaining: number;
  expires_at: string;
  created_at: string;
  status: "active" | "expired" | "depleted";
}

export interface Submission {
  id: string;
  bounty_id: string;
  skill_slug: string;
  optimizer_wallet: string;
  submitted_at: string;
  v2_content: string;
  status: "pending" | "evaluating" | "accepted" | "rejected";
  accuracy_delta?: number;
  token_delta?: number;
  payout?: number;
  verdict_timestamp?: string;
}

export interface LeaderboardEntry {
  wallet: string;
  total_earnings: number;
  submissions_accepted: number;
  submissions_total: number;
  best_accuracy_delta: number;
}

// --- Storage ---

const DATA_DIR = path.join(process.cwd(), ".league-data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadJson<T>(filename: string, fallback: T): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function saveJson<T>(filename: string, data: T): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// --- Bounty CRUD ---

export function getAllBounties(): Bounty[] {
  const bounties = loadJson<Bounty[]>("bounties.json", []);
  // Auto-expire
  const now = new Date();
  return bounties.map((b) => ({
    ...b,
    status:
      b.pool_remaining <= 0
        ? "depleted"
        : new Date(b.expires_at) < now
          ? "expired"
          : b.status,
  }));
}

export function getActiveBounties(): Bounty[] {
  return getAllBounties().filter((b) => b.status === "active");
}

export function getBountyById(id: string): Bounty | null {
  return getAllBounties().find((b) => b.id === id) ?? null;
}

export function getBountiesForSkill(slug: string): Bounty[] {
  return getActiveBounties().filter((b) => b.skill_slug === slug);
}

let bountyCounter = 0;

export function createBounty(params: {
  skill_slug: string;
  creator_wallet: string;
  reward_per_accuracy_pct: number;
  reward_per_token_reduction_pct: number;
  max_pool: number;
  expires_in_days: number;
}): Bounty {
  const bounties = loadJson<Bounty[]>("bounties.json", []);
  bountyCounter = bounties.length;

  const bounty: Bounty = {
    id: `bounty-${++bountyCounter}-${Date.now()}`,
    skill_slug: params.skill_slug,
    creator_wallet: params.creator_wallet,
    reward_per_accuracy_pct: params.reward_per_accuracy_pct,
    reward_per_token_reduction_pct: params.reward_per_token_reduction_pct,
    max_pool: params.max_pool,
    pool_remaining: params.max_pool,
    expires_at: new Date(
      Date.now() + params.expires_in_days * 24 * 60 * 60 * 1000
    ).toISOString(),
    created_at: new Date().toISOString(),
    status: "active",
  };

  bounties.push(bounty);
  saveJson("bounties.json", bounties);
  return bounty;
}

// --- Submission CRUD ---

let submissionCounter = 0;

export function createSubmission(params: {
  bounty_id: string;
  skill_slug: string;
  optimizer_wallet: string;
  v2_content: string;
}): Submission {
  const submissions = loadJson<Submission[]>("submissions.json", []);
  submissionCounter = submissions.length;

  const submission: Submission = {
    id: `sub-${++submissionCounter}-${Date.now()}`,
    bounty_id: params.bounty_id,
    skill_slug: params.skill_slug,
    optimizer_wallet: params.optimizer_wallet,
    submitted_at: new Date().toISOString(),
    v2_content: params.v2_content,
    status: "pending",
  };

  submissions.push(submission);
  saveJson("submissions.json", submissions);
  return submission;
}

export function getSubmission(id: string): Submission | null {
  const submissions = loadJson<Submission[]>("submissions.json", []);
  return submissions.find((s) => s.id === id) ?? null;
}

export function getSubmissionsForBounty(bountyId: string): Submission[] {
  const submissions = loadJson<Submission[]>("submissions.json", []);
  return submissions.filter((s) => s.bounty_id === bountyId);
}

export function updateSubmission(
  id: string,
  update: Partial<Submission>
): Submission | null {
  const submissions = loadJson<Submission[]>("submissions.json", []);
  const idx = submissions.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  submissions[idx] = { ...submissions[idx], ...update };
  saveJson("submissions.json", submissions);
  return submissions[idx];
}

export function deductBountyPool(id: string, amount: number): boolean {
  const bounties = loadJson<Bounty[]>("bounties.json", []);
  const idx = bounties.findIndex((b) => b.id === id);
  if (idx === -1) return false;

  bounties[idx].pool_remaining = Math.max(
    0,
    bounties[idx].pool_remaining - amount
  );
  if (bounties[idx].pool_remaining <= 0) {
    bounties[idx].status = "depleted";
  }
  saveJson("bounties.json", bounties);
  return true;
}

// --- Leaderboard ---

export function getLeaderboard(): LeaderboardEntry[] {
  const submissions = loadJson<Submission[]>("submissions.json", []);
  const walletMap = new Map<string, LeaderboardEntry>();

  for (const sub of submissions) {
    const entry = walletMap.get(sub.optimizer_wallet) ?? {
      wallet: sub.optimizer_wallet,
      total_earnings: 0,
      submissions_accepted: 0,
      submissions_total: 0,
      best_accuracy_delta: 0,
    };

    entry.submissions_total++;

    if (sub.status === "accepted" && sub.payout) {
      entry.submissions_accepted++;
      entry.total_earnings += sub.payout;
      if (sub.accuracy_delta && sub.accuracy_delta > entry.best_accuracy_delta) {
        entry.best_accuracy_delta = sub.accuracy_delta;
      }
    }

    walletMap.set(sub.optimizer_wallet, entry);
  }

  return Array.from(walletMap.values()).sort(
    (a, b) => b.total_earnings - a.total_earnings
  );
}
