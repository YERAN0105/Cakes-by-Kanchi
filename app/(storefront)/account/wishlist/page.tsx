"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { ProductCard } from "@/components/storefront/products/ProductCard";
import { ProductCardSkeleton } from "@/components/storefront/products/ProductCardSkeleton";
import { useWishlistStore } from "@/stores/wishlist";
import { createClient } from "@/lib/supabase/client";
import type { ProductListItem } from "@/types/database";

const PRODUCT_LIST_SELECT = `
  id, slug, name, base_price, is_featured, is_bestseller,
  stock_tracked, stock_quantity,
  categories ( id, slug, name ),
  product_images ( url, is_primary, alt_text ),
  product_sizes ( price )
`;

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    supabase
      .from("products")
      .select(PRODUCT_LIST_SELECT)
      .in("id", items)
      .eq("is_published", true)
      .then(({ data }) => {
        setProducts((data as unknown as ProductListItem[]) ?? []);
        setLoading(false);
      });
  }, [items]);

  return (
    <section className="section-pad min-h-[60vh]">
      <Container>
        <div className="mb-10">
          <p className="label-small text-wine mb-2">Your Collection</p>
          <h1 className="heading-md">Wishlist</h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {[...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
            <Heart className="w-12 h-12 text-blush stroke-1" aria-hidden="true" />
            <p className="font-display text-2xl text-ink">Your wishlist is empty</p>
            <p className="body-base max-w-xs">
              Save cakes you love by tapping the heart icon on any product.
            </p>
            <Link href="/cakes" className="btn-primary mt-2">
              Browse Cakes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} delay={i * 0.06} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
