"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popularity", label: "Most Popular" },
] as const;

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "newest";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="sort-select" className="sr-only">Sort products</label>
      <select
        id="sort-select"
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm font-body bg-card border border-border rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-wine cursor-pointer"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 w-4 h-4 text-ink-light pointer-events-none" aria-hidden="true" />
    </div>
  );
}
