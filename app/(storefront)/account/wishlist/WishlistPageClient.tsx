"use client";

import { useEffect } from "react";
import { ProductCard } from "@/components/storefront/products/ProductCard";
import { useWishlistStore } from "@/stores/wishlist";
import type { ProductListItem } from "@/types/database";

interface WishlistPageClientProps {
  products: ProductListItem[];
  dbIds: string[];
}

export function WishlistPageClient({ products, dbIds }: WishlistPageClientProps) {
  const setItems = useWishlistStore((s) => s.setItems);

  useEffect(() => {
    setItems(dbIds);
  }, [dbIds, setItems]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} delay={i * 0.06} />
      ))}
    </div>
  );
}
