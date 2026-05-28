"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { formatCurrency } from "@/lib/brand";

const PRICE_MAX = 60000;

export function ActiveFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categories = searchParams.getAll("category");
  const flavors = searchParams.getAll("flavor");
  const dietary = searchParams.getAll("dietary");
  const minPrice = parseInt(searchParams.get("minPrice") ?? "0", 10);
  const maxPrice = parseInt(searchParams.get("maxPrice") ?? String(PRICE_MAX), 10);
  const query = searchParams.get("q");

  const chips: { label: string; onRemove: () => void }[] = [];

  if (query) {
    chips.push({
      label: `Search: "${query}"`,
      onRemove: () => {
        const p = new URLSearchParams(searchParams.toString());
        p.delete("q");
        router.push(`${pathname}?${p.toString()}`);
      },
    });
  }

  categories.forEach((cat) => {
    chips.push({
      label: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, " "),
      onRemove: () => {
        const p = new URLSearchParams(searchParams.toString());
        const remaining = p.getAll("category").filter((c) => c !== cat);
        p.delete("category");
        remaining.forEach((c) => p.append("category", c));
        router.push(`${pathname}?${p.toString()}`);
      },
    });
  });

  flavors.forEach((f) => {
    chips.push({
      label: f.charAt(0).toUpperCase() + f.slice(1),
      onRemove: () => {
        const p = new URLSearchParams(searchParams.toString());
        const remaining = p.getAll("flavor").filter((v) => v !== f);
        p.delete("flavor");
        remaining.forEach((v) => p.append("flavor", v));
        router.push(`${pathname}?${p.toString()}`);
      },
    });
  });

  dietary.forEach((d) => {
    const labels: Record<string, string> = { eggless: "Eggless", vegan: "Vegan", gluten_free: "Gluten-Free" };
    chips.push({
      label: labels[d] ?? d,
      onRemove: () => {
        const p = new URLSearchParams(searchParams.toString());
        const remaining = p.getAll("dietary").filter((v) => v !== d);
        p.delete("dietary");
        remaining.forEach((v) => p.append("dietary", v));
        router.push(`${pathname}?${p.toString()}`);
      },
    });
  });

  if (minPrice > 0 || maxPrice < PRICE_MAX) {
    chips.push({
      label: `${formatCurrency(minPrice)} – ${maxPrice >= PRICE_MAX ? formatCurrency(PRICE_MAX) + "+" : formatCurrency(maxPrice)}`,
      onRemove: () => {
        const p = new URLSearchParams(searchParams.toString());
        p.delete("minPrice");
        p.delete("maxPrice");
        router.push(`${pathname}?${p.toString()}`);
      },
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3" aria-label="Active filters">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-blush-light text-ink text-xs font-body rounded-full border border-blush"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove filter: ${chip.label}`}
            className="text-ink-light hover:text-wine transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
