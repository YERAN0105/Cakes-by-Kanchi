import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/storefront/products/ProductCard";
import type { ProductListItem } from "@/types/database";

interface RelatedProductsProps {
  products: ProductListItem[];
  categoryName?: string;
}

export function RelatedProducts({ products, categoryName }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="py-10 border-t border-border">
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="label-small text-wine mb-1">You May Also Like</p>
          <h2 id="related-heading" className="heading-sm">
            {categoryName ? `More ${categoryName}` : "Related Products"}
          </h2>
        </div>
        <Link
          href="/cakes"
          className="flex items-center gap-1.5 text-sm font-body text-wine hover:text-wine-light transition-colors shrink-0"
        >
          View all <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} delay={i * 0.05} />
        ))}
      </div>
    </section>
  );
}
