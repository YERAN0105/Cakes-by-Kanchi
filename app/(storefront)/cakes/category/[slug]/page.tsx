import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { Container } from "@/components/shared/Container";
import { FilterSidebar } from "@/components/storefront/catalog/FilterSidebar";
import { SortSelect } from "@/components/storefront/catalog/SortSelect";
import { ActiveFilters } from "@/components/storefront/catalog/ActiveFilters";
import { CatalogGrid } from "@/components/storefront/catalog/CatalogGrid";
import { ProductGridSkeleton } from "@/components/storefront/products/ProductCardSkeleton";
import { getCategoryBySlug, getProducts, getAllCategories } from "@/lib/products";
import { brand } from "@/lib/brand";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[]>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found" };
  return {
    title: category.name,
    description: category.description ?? `Shop ${category.name} at ${brand.name}.`,
    openGraph: {
      title: `${category.name} | ${brand.name}`,
      description: category.description ?? `Shop ${category.name}.`,
      images: category.image_url ? [{ url: category.image_url }] : [],
    },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const [category, allCategories] = await Promise.all([
    getCategoryBySlug(slug),
    getAllCategories(),
  ]);

  if (!category) notFound();

  const sort = (sp.sort as "newest" | "price_asc" | "price_desc" | "popularity") ?? "newest";
  const minPrice = sp.minPrice ? parseFloat(sp.minPrice as string) : undefined;
  const maxPrice = sp.maxPrice ? parseFloat(sp.maxPrice as string) : undefined;

  const { products, total } = await getProducts({
    category: [slug],
    sort,
    minPrice,
    maxPrice,
    page: 1,
  });

  return (
    <>
      {/* Category hero */}
      <div className="relative h-48 sm:h-64 md:h-72 overflow-hidden bg-blush-light">
        {category.image_url && (
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 px-4 text-center">
          <p className="label-small text-cream/80 mb-1">The Collection</p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-cream font-medium leading-tight">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-2 text-sm text-cream/80 font-body max-w-lg">{category.description}</p>
          )}
        </div>
      </div>

      <Container className="py-10 lg:py-14">
        <div className="flex gap-8 lg:gap-10">
          {/* Sidebar */}
          <div className="hidden lg:block w-56 xl:w-64 shrink-0">
            <div className="sticky top-24">
              <Suspense>
                <FilterSidebar categories={allCategories} hideCategories />
              </Suspense>
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 min-w-0">
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
                categories={allCategories}
                defaultCategory={slug}
              />
            </Suspense>
          </div>
        </div>
      </Container>
    </>
  );
}
