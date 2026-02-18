"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "finance", label: "Finance" },
  { value: "development", label: "Development" },
  { value: "persona", label: "Persona" },
  { value: "data", label: "Data" },
  { value: "legal", label: "Legal" },
  { value: "writing", label: "Writing" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price: Low" },
  { value: "price_high", label: "Price: High" },
  { value: "accuracy", label: "Accuracy" },
];

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const currentCategory = searchParams.get("category") ?? "";
  const currentSort = searchParams.get("sort") ?? "newest";

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      startTransition(() => {
        router.push(`/marketplace?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search input */}
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search skills..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateParams({ q: query });
          }}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 transition-colors focus:border-lime/50 focus:outline-none"
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-lime/30 border-t-lime" />
        )}
      </div>

      {/* Category filter */}
      <select
        value={currentCategory}
        onChange={(e) => updateParams({ category: e.target.value })}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/80 transition-colors focus:border-lime/50 focus:outline-none"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value} className="bg-zinc-900">
            {c.label}
          </option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={currentSort}
        onChange={(e) => updateParams({ sort: e.target.value })}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/80 transition-colors focus:border-lime/50 focus:outline-none"
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value} className="bg-zinc-900">
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
