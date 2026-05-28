"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/brand";
import type { CategoryRow } from "@/types/database";

const FLAVOR_OPTIONS = [
  "Vanilla", "Chocolate", "Red Velvet", "Strawberry", "Lemon", "Mocha",
  "Caramel", "Pistachio", "Raspberry",
];

const DIETARY_OPTIONS = [
  { value: "eggless", label: "Eggless" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten_free", label: "Gluten-Free" },
];

const PRICE_MIN = 0;
const PRICE_MAX = 60000;
const PRICE_STEP = 500;

interface FilterSidebarProps {
  categories: CategoryRow[];
  className?: string;
  hideCategories?: boolean;
}

export function FilterSidebar({ categories, className, hideCategories }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlMinPrice = parseInt(searchParams.get("minPrice") ?? String(PRICE_MIN), 10);
  const urlMaxPrice = parseInt(searchParams.get("maxPrice") ?? String(PRICE_MAX), 10);

  // Local state tracks value during drag; URL is updated only on pointer release
  const [localMin, setLocalMin] = useState(urlMinPrice);
  const [localMax, setLocalMax] = useState(urlMaxPrice);
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);

  // Sync URL → local state when URL changes externally (e.g. "Clear all")
  useEffect(() => {
    setLocalMin(urlMinPrice);
    setLocalMax(urlMaxPrice);
  }, [urlMinPrice, urlMaxPrice]);

  const selectedCategories = searchParams.getAll("category");
  const selectedFlavors = searchParams.getAll("flavor");
  const selectedDietary = searchParams.getAll("dietary");

  const hasFilters =
    selectedCategories.length > 0 ||
    selectedFlavors.length > 0 ||
    selectedDietary.length > 0 ||
    urlMinPrice > PRICE_MIN ||
    urlMaxPrice < PRICE_MAX;

  const updateParam = (key: string, value: string, checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (checked) {
      params.append(key, value);
    } else {
      const existing = params.getAll(key).filter((v) => v !== value);
      params.delete(key);
      existing.forEach((v) => params.append(key, v));
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const commitPrice = (min: number, max: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (min > PRICE_MIN) params.set("minPrice", String(min));
    else params.delete("minPrice");
    if (max < PRICE_MAX) params.set("maxPrice", String(max));
    else params.delete("maxPrice");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearAll = () => {
    setLocalMin(PRICE_MIN);
    setLocalMax(PRICE_MAX);
    router.push(pathname, { scroll: false });
  };

  // Percentage along the track (0–100) for tooltip positioning
  const thumbPct = (value: number) => ((value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  return (
    <aside className={cn("w-full", className)} aria-label="Product filters">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-base font-semibold text-ink">Filters</h2>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-xs font-body text-wine hover:text-wine-light transition-colors"
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Categories — hidden on category pages since the route already scopes the results */}
        {!hideCategories && (
          <>
            <fieldset>
              <legend className="label-small text-ink mb-3">Category</legend>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.slug)}
                      onChange={(e) => updateParam("category", cat.slug, e.target.checked)}
                      className="w-4 h-4 rounded border-border accent-wine cursor-pointer"
                      aria-label={cat.name}
                    />
                    <span className="text-sm font-body text-ink group-hover:text-wine transition-colors">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="h-px bg-border" />
          </>
        )}

        {/* Price range */}
        <fieldset>
          <legend className="label-small text-ink mb-3">Price Range</legend>
          <div className="space-y-3">
            {/* Static range labels — show local values so they update live while dragging */}
            <div className="flex items-center justify-between text-xs font-body text-ink-light">
              <span>{formatCurrency(localMin)}</span>
              <span>
                {localMax >= PRICE_MAX
                  ? `${formatCurrency(PRICE_MAX)}+`
                  : formatCurrency(localMax)}
              </span>
            </div>

            <div className="space-y-5">
              {/* Min slider */}
              <div className="relative pt-6">
                {dragging === "min" && (
                  <div
                    className="absolute top-0 -translate-x-1/2 px-1.5 py-0.5 rounded text-[11px] font-body bg-wine text-white whitespace-nowrap pointer-events-none z-10"
                    style={{ left: `${thumbPct(localMin)}%` }}
                  >
                    {formatCurrency(localMin)}
                  </div>
                )}
                <label className="sr-only" htmlFor="min-price">Minimum price</label>
                <input
                  id="min-price"
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={localMin}
                  onChange={(e) =>
                    setLocalMin(Math.min(parseInt(e.target.value, 10), localMax - PRICE_STEP))
                  }
                  onPointerDown={() => setDragging("min")}
                  onPointerUp={() => {
                    setDragging(null);
                    commitPrice(localMin, localMax);
                  }}
                  onKeyUp={() => commitPrice(localMin, localMax)}
                  className="w-full accent-wine cursor-pointer"
                />
              </div>

              {/* Max slider */}
              <div className="relative pt-6">
                {dragging === "max" && (
                  <div
                    className="absolute top-0 -translate-x-1/2 px-1.5 py-0.5 rounded text-[11px] font-body bg-wine text-white whitespace-nowrap pointer-events-none z-10"
                    style={{ left: `${thumbPct(localMax)}%` }}
                  >
                    {localMax >= PRICE_MAX
                      ? `${formatCurrency(PRICE_MAX)}+`
                      : formatCurrency(localMax)}
                  </div>
                )}
                <label className="sr-only" htmlFor="max-price">Maximum price</label>
                <input
                  id="max-price"
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={localMax}
                  onChange={(e) =>
                    setLocalMax(Math.max(parseInt(e.target.value, 10), localMin + PRICE_STEP))
                  }
                  onPointerDown={() => setDragging("max")}
                  onPointerUp={() => {
                    setDragging(null);
                    commitPrice(localMin, localMax);
                  }}
                  onKeyUp={() => commitPrice(localMin, localMax)}
                  className="w-full accent-wine cursor-pointer"
                />
              </div>
            </div>
          </div>
        </fieldset>

        <div className="h-px bg-border" />

        {/* Flavours */}
        <fieldset>
          <legend className="label-small text-ink mb-3">Flavour</legend>
          <div className="space-y-2">
            {FLAVOR_OPTIONS.map((flavor) => (
              <label key={flavor} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedFlavors.includes(flavor.toLowerCase())}
                  onChange={(e) => updateParam("flavor", flavor.toLowerCase(), e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-wine cursor-pointer"
                  aria-label={flavor}
                />
                <span className="text-sm font-body text-ink group-hover:text-wine transition-colors">
                  {flavor}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="h-px bg-border" />

        {/* Dietary */}
        <fieldset>
          <legend className="label-small text-ink mb-3">Dietary</legend>
          <div className="space-y-2">
            {DIETARY_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedDietary.includes(opt.value)}
                  onChange={(e) => updateParam("dietary", opt.value, e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-wine cursor-pointer"
                  aria-label={opt.label}
                />
                <span className="text-sm font-body text-ink group-hover:text-wine transition-colors">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </aside>
  );
}
