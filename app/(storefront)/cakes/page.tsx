import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/shared/Container";
import { FilterSidebar } from "@/components/storefront/catalog/FilterSidebar";
import { SortSelect } from "@/components/storefront/catalog/SortSelect";
import { ActiveFilters } from "@/components/storefront/catalog/ActiveFilters";
import { CatalogGrid } from "@/components/storefront/catalog/CatalogGrid";
import { ProductGridSkeleton } from "@/components/storefront/products/ProductCardSkeleton";
import { getProducts, getAllCategories } from "@/lib/products";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Our Cakes",
  description: `Browse our full collection of handcrafted cakes — birthday, wedding, cupcakes and more. ${brand.tagline}`,
  openGraph: {
    title: `Our Cakes | ${brand.name}`,
    description: "Browse handcrafted birthday, wedding, and custom cakes. Delivered in Colombo.",
  },
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[]>>;
}

export default async function CakesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const category = params.category
    ? Array.isArray(params.category) ? params.category : [params.category]
    : undefined;
  const sort = (params.sort as "newest" | "price_asc" | "price_desc" | "popularity") ?? "newest";
  const minPrice = params.minPrice ? parseFloat(params.minPrice as string) : undefined;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice as string) : undefined;
  const search = params.q as string | undefined;

  const [{ products, total }, categories] = await Promise.all([
    getProducts({ category, sort, minPrice, maxPrice, search, page: 1 }),
    getAllCategories(),
  ]);

  return (
    <>
      {/* Page header */}
      <div className="py-14 bg-cream-50 border-b border-border text-center">
        <p className="label-small text-wine mb-2">The Collection</p>
        <h1 className="heading-lg">
          {search ? `Results for "${search}"` : "Our Cakes"}
        </h1>
        <div className="ornament-line mt-4" />
        {search && (
          <p className="body-base mt-3">
            Showing results for &ldquo;{search}&rdquo;
          </p>
        )}
      </div>

      <Container className="py-10 lg:py-14">
        <div className="flex gap-8 lg:gap-10">
          {/* Sidebar — desktop only */}
          <div className="hidden lg:block w-56 xl:w-64 shrink-0">
            <div className="sticky top-24">
              <Suspense>
                <FilterSidebar categories={categories} />
              </Suspense>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <Suspense>
                  <ActiveFilters />
                </Suspense>
              </div>
              <div className="shrink-0">
                <Suspense>
                  <SortSelect />
                </Suspense>
              </div>
            </div>

            <Suspense fallback={<ProductGridSkeleton count={12} />}>
              <CatalogGrid
                initialProducts={products}
                initialTotal={total}
                categories={categories}
              />
            </Suspense>
          </div>
        </div>
      </Container>
    </>
  );
}
