import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { ProductCard } from "@/components/storefront/products/ProductCard";
import { ProductCardSkeleton } from "@/components/storefront/products/ProductCardSkeleton";
import { getFeaturedProducts } from "@/lib/products";

export async function FeaturedCakes() {
  const products = await getFeaturedProducts(4);

  return (
    <section className="section-pad bg-cream-50" aria-labelledby="featured-heading">
      <Container>
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <p className="label-small text-wine mb-2">Handpicked for You</p>
            <h2 id="featured-heading" className="heading-md">Featured Cakes</h2>
          </div>
          <Link
            href="/cakes"
            className="flex items-center gap-1.5 text-sm font-body text-wine hover:text-wine-light transition-colors shrink-0"
          >
            View all <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {[...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                delay={i * 0.08}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
