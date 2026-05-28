import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Shield, Leaf, Clock, Award } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { ImageGallery } from "@/components/storefront/pdp/ImageGallery";
import { CustomizationEngine } from "@/components/storefront/pdp/CustomizationEngine";
import { ReviewsSection } from "@/components/storefront/pdp/ReviewsSection";
import { RelatedProducts } from "@/components/storefront/pdp/RelatedProducts";
import { StickyBar } from "@/components/storefront/pdp/StickyBar";
import { WishlistButton } from "@/components/storefront/products/WishlistButton";
import { getProductBySlug, getRelatedProducts, getProductReviews } from "@/lib/products";
import { getMinPrice } from "@/lib/product-utils";
import { formatCurrency, brand } from "@/lib/brand";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  const primaryImage = product.product_images?.find((i) => i.is_primary)?.url
    ?? product.product_images?.[0]?.url;

  return {
    title: product.meta_title ?? product.name,
    description: product.meta_description ?? product.description ?? `Order ${product.name} from ${brand.name}.`,
    openGraph: {
      title: product.meta_title ?? product.name,
      description: product.meta_description ?? product.description ?? "",
      images: primaryImage ? [{ url: primaryImage, alt: product.name }] : [],
      type: "website",
    },
  };
}

const TRUST_BADGES = [
  { icon: Shield, label: "Secure Checkout" },
  { icon: Leaf, label: "Fresh Ingredients" },
  { icon: Clock, label: "24h+ Notice" },
  { icon: Award, label: "Handcrafted" },
];

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, reviews] = await Promise.all([
    getRelatedProducts(product.id, product.category_id, 4),
    getProductReviews(product.id),
  ]);

  const minPrice = getMinPrice(product as unknown as import("@/types/database").ProductListItem);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Cakes", href: "/cakes" },
    ...(product.categories
      ? [{ label: product.categories.name, href: `/cakes/category/${product.categories.slug}` }]
      : []),
    { label: product.name, href: "#" },
  ];

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? "",
    image: product.product_images?.map((i) => i.url) ?? [],
    brand: { "@type": "Brand", name: brand.name },
    offers: {
      "@type": "Offer",
      price: minPrice.toFixed(2),
      priceCurrency: "LKR",
      availability: product.stock_tracked && product.stock_quantity <= 0
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: brand.name },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container className="py-6 lg:py-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center flex-wrap gap-1 text-xs font-body text-ink-light">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.href} className="flex items-center gap-1">
                {i < breadcrumbs.length - 1 ? (
                  <>
                    <Link href={crumb.href} className="hover:text-wine transition-colors">
                      {crumb.label}
                    </Link>
                    <ChevronRight className="w-3 h-3 shrink-0" aria-hidden="true" />
                  </>
                ) : (
                  <span className="text-ink font-medium" aria-current="page">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Two-column above the fold */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-14 mb-12">
          {/* Left: Gallery */}
          <ImageGallery images={product.product_images ?? []} productName={product.name} />

          {/* Right: Product info */}
          <div>
            {product.categories && (
              <Link
                href={`/cakes/category/${product.categories.slug}`}
                className="label-small text-wine hover:text-wine-light transition-colors mb-2 block"
              >
                {product.categories.name}
              </Link>
            )}

            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="font-display text-3xl lg:text-4xl text-ink font-medium leading-tight">
                {product.name}
              </h1>
              <WishlistButton productId={product.id} productName={product.name} size="md" className="mt-1 shrink-0" />
            </div>

            {/* Reviews summary — placeholder until real data exists */}
            {reviews.length > 0 && (
              <a
                href="#reviews"
                className="inline-flex items-center gap-2 text-sm font-body text-ink-light hover:text-wine transition-colors mb-3"
              >
                <span className="text-champagne">★★★★★</span>
                <span>({reviews.length} reviews)</span>
              </a>
            )}

            {/* Lead price */}
            <div id="pdp-add-to-cart-sentinel" className="mb-4">
              <p className="font-display text-3xl font-semibold text-wine">
                from {formatCurrency(minPrice)}
              </p>
            </div>

            {/* Short description */}
            {product.description && (
              <p className="body-base text-sm leading-relaxed mb-6 line-clamp-3">
                {product.description}
              </p>
            )}

            {/* Customization engine */}
            <CustomizationEngine product={product} />

            {/* Trust badges */}
            <div className="grid grid-cols-4 gap-3 mt-6 pt-5 border-t border-border">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                  <div className="w-9 h-9 rounded-full bg-blush-light flex items-center justify-center">
                    <Icon className="w-4 h-4 text-wine" aria-hidden="true" />
                  </div>
                  <p className="text-[10px] font-body text-ink-light leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Below the fold */}
        <div className="max-w-3xl">
          {/* Description */}
          {product.description && (
            <section className="py-8 border-t border-border" aria-labelledby="description-heading">
              <h2 id="description-heading" className="heading-sm mb-4">About This Cake</h2>
              <p className="body-base leading-relaxed whitespace-pre-line">{product.description}</p>
            </section>
          )}

          {/* Ingredients & Allergens accordion */}
          {(product.ingredients || product.allergens) && (
            <section className="py-4" aria-labelledby="ingredients-heading">
              <h2 id="ingredients-heading" className="sr-only">Ingredients & Allergens</h2>
              <Accordion type="multiple">
                {product.ingredients && (
                  <AccordionItem value="ingredients">
                    <AccordionTrigger className="font-display text-base text-ink hover:no-underline">
                      Ingredients
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm font-body text-ink-light leading-relaxed">{product.ingredients}</p>
                    </AccordionContent>
                  </AccordionItem>
                )}
                {product.allergens && (
                  <AccordionItem value="allergens">
                    <AccordionTrigger className="font-display text-base text-ink hover:no-underline">
                      Allergen Information
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm font-body text-ink-light leading-relaxed">{product.allergens}</p>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </section>
          )}

          {/* Reviews */}
          <div id="reviews">
            <ReviewsSection
              reviews={reviews as Parameters<typeof ReviewsSection>[0]["reviews"]}
              productName={product.name}
            />
          </div>
        </div>

        {/* Related products — full width */}
        <RelatedProducts
          products={related}
          categoryName={product.categories?.name}
        />
      </Container>

      {/* Mobile sticky bar */}
      <StickyBar productName={product.name} basePrice={minPrice} />
    </>
  );
}
