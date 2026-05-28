import type { ProductListItem } from "@/types/database";

/** Minimum price from sizes array, falling back to base_price */
export function getMinPrice(product: ProductListItem): number {
  const sizes = product.product_sizes ?? [];
  if (sizes.length === 0) return parseFloat(product.base_price);
  return Math.min(...sizes.map((s) => parseFloat(s.price)));
}

/** Primary image URL, or first image, or null */
export function getPrimaryImage(product: ProductListItem): string | null {
  const images = product.product_images ?? [];
  const primary = images.find((i) => i.is_primary);
  return primary?.url ?? images[0]?.url ?? null;
}
