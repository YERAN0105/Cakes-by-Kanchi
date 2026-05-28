"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "@/components/storefront/products/ProductCard";
import { ProductCardSkeleton } from "@/components/storefront/products/ProductCardSkeleton";
import { QuickViewModal } from "@/components/storefront/products/QuickViewModal";
import { FilterSidebar } from "./FilterSidebar";
import type { ProductListItem, CategoryRow } from "@/types/database";

interface CatalogGridProps {
  initialProducts: ProductListItem[];
  initialTotal: number;
  categories: CategoryRow[];
  defaultCategory?: string;
}

const PAGE_SIZE = 12;

export function CatalogGrid({ initialProducts, initialTotal, categories, defaultCategory }: CatalogGridProps) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductListItem[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductListItem | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const buildApiUrl = useCallback(
    (pageNum: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(pageNum));
      params.set("limit", String(PAGE_SIZE));
      // Always include the route-level category so client re-fetches respect it
      if (defaultCategory && !params.getAll("category").includes(defaultCategory)) {
        params.append("category", defaultCategory);
      }
      return `/api/products?${params.toString()}`;
    },
    [searchParams, defaultCategory]
  );

  // Reload when search params change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);
    fetch(buildApiUrl(1))
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setProducts(data.products ?? []);
          setTotal(data.total ?? 0);
        }
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [searchParams, buildApiUrl]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await fetch(buildApiUrl(nextPage));
      const data = await res.json();
      setProducts((prev) => [...prev, ...(data.products ?? [])]);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = products.length < total;

  return (
    <>
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile filter bar */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className="flex items-center gap-2 text-sm font-body text-ink border border-border rounded-lg px-3 py-2 hover:border-wine hover:text-wine transition-colors"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          <p className="text-sm text-ink-light font-body">{total} products</p>
        </div>

        {/* Hidden on mobile, shown on desktop */}
        <p className="hidden lg:block text-sm text-ink-light font-body mb-4">
          {total} {total === 1 ? "product" : "products"}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
              {products.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={setQuickViewProduct}
                  delay={Math.min(i * 0.04, 0.3)}
                />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="btn-secondary flex items-center gap-2 min-w-[160px] justify-center"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Loading…
                    </>
                  ) : (
                    `Load more (${total - products.length} remaining)`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick view */}
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {filterDrawerOpen && (
          <motion.div
            key="filter-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm lg:hidden"
            onClick={() => setFilterDrawerOpen(false)}
          >
            <motion.div
              key="filter-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute inset-y-0 left-0 w-80 max-w-[90vw] bg-cream overflow-y-auto p-5"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Product filters"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg text-ink">Filters</h2>
                <button
                  type="button"
                  onClick={() => setFilterDrawerOpen(false)}
                  aria-label="Close filters"
                  className="p-2 rounded-md text-ink-light hover:text-ink transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterSidebar categories={categories} hideCategories={!!defaultCategory} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-blush-light flex items-center justify-center mb-5">
        <span className="font-accent text-3xl text-wine/50 italic">✦</span>
      </div>
      <h3 className="heading-sm mb-2">No cakes found</h3>
      <p className="body-base mb-6 max-w-xs">
        We couldn&apos;t find any cakes matching your filters. Try adjusting your search.
      </p>
      <Link
        href="/cakes"
        className="btn-secondary text-sm py-2"
      >
        Reset filters
      </Link>
    </div>
  );
}
