"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { t, type Lang } from "@/lib/i18n";

export default function ShopFilters(
  { categories, activeCategory, sort, q, lang }: {
    categories: { slug: string; name: string }[];
    activeCategory?: string;
    sort: string;
    q: string;
    lang: Lang;
  }
) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(q);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/products?${next.toString()}`);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    update("q", search.trim());
  }

  const sorts = [
    { value: "newest", label: t("sortNewest", lang) },
    { value: "featured", label: t("sortFeatured", lang) },
    { value: "price-asc", label: t("sortPriceAsc", lang) },
    { value: "price-desc", label: t("sortPriceDesc", lang) },
  ];

  return (
    <div className="space-y-4">
      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => update("category", "")}
          className={cn(
            "shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors",
            !activeCategory
              ? "bg-[var(--primary)] text-white border-[var(--primary)]"
              : "bg-white text-[var(--primary)] border-border hover:border-[var(--primary)]"
          )}
        >
          {t("allGifts", lang)}
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => update("category", c.slug)}
            className={cn(
              "shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors",
              activeCategory === c.slug
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "bg-white text-[var(--primary)] border-border hover:border-[var(--primary)]"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={submitSearch} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder", lang)}
            className="w-full bg-white border border-input rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
          />
        </form>
        <div className="relative">
          <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => update("sort", e.target.value)}
            aria-label={t("sortProducts", lang)}
            className="w-full sm:w-56 appearance-none bg-white border border-input rounded-full pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
          >
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
