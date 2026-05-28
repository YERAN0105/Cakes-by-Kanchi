"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { formatCurrency } from "@/lib/brand";
import { getMinPrice, getPrimaryImage } from "@/lib/product-utils";
import { WishlistButton } from "./WishlistButton";
import { StarRating } from "./StarRating";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "@/types/database";

interface ProductCardProps {
  product: ProductListItem;
  onQuickView?: (product: ProductListItem) => void;
  delay?: number;
}

export function ProductCard({ product, onQuickView, delay = 0 }: ProductCardProps) {
  const minPrice = getMinPrice(product);
  const imageUrl = getPrimaryImage(product);
  const secondaryImage = product.product_images?.find((i) => !i.is_primary)?.url;
  const isOutOfStock = product.stock_tracked && product.stock_quantity <= 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.45, delay }}
      className="group relative"
    >
      <Link
        href={`/cakes/${product.slug}`}
        aria-label={`View ${product.name}`}
        className={cn("block", isOutOfStock && "pointer-events-none")}
        tabIndex={isOutOfStock ? -1 : undefined}
      >
        {/* Image */}
        <div className="relative aspect-square rounded-xl overflow-hidden bg-blush-light mb-3">
          {imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt={product.product_images?.[0]?.alt_text ?? product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={cn(
                  "object-cover transition-all duration-500",
                  "group-hover:scale-105",
                  secondaryImage && "group-hover:opacity-0"
                )}
              />
              {secondaryImage && (
                <Image
                  src={secondaryImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden="true"
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-accent text-2xl text-wine/30 italic">Cakery</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {product.is_featured && (
              <span className="label-small bg-wine text-cream px-2 py-0.5 rounded-full text-[10px]">
                Featured
              </span>
            )}
            {product.is_bestseller && (
              <span className="label-small bg-champagne text-ink px-2 py-0.5 rounded-full text-[10px]">
                Bestseller
              </span>
            )}
            {isOutOfStock && (
              <span className="label-small bg-ink/70 text-cream px-2 py-0.5 rounded-full text-[10px]">
                Sold Out
              </span>
            )}
          </div>

          {/* Wishlist */}
          <div className="absolute top-2.5 right-2.5">
            <WishlistButton productId={product.id} productName={product.name} />
          </div>

          {/* Quick view — desktop hover */}
          {onQuickView && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 hidden md:flex">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onQuickView(product); }}
                className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-ink text-xs font-body font-medium px-3 py-1.5 rounded-full shadow-md hover:bg-white transition-colors"
                aria-label={`Quick view ${product.name}`}
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                Quick view
              </button>
            </div>
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-cream/60 backdrop-blur-[2px] rounded-xl" />
          )}
        </div>

        {/* Info */}
        <div className="px-0.5">
          {product.categories && (
            <p className="label-small text-wine/70 mb-0.5">{product.categories.name}</p>
          )}
          <h3 className="font-display text-ink text-base font-medium leading-snug mb-1 group-hover:text-wine transition-colors line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center justify-between gap-2">
            <p className="font-body text-sm font-medium text-wine">
              from {formatCurrency(minPrice)}
            </p>
            {/* Placeholder rating — real data wired once reviews are seeded */}
            <StarRating rating={0} count={0} showCount={false} />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
