"use client";

import Image from "next/image";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/brand";
import { getMinPrice, getPrimaryImage } from "@/lib/product-utils";
import { WishlistButton } from "./WishlistButton";
import type { ProductListItem } from "@/types/database";

interface QuickViewModalProps {
  product: ProductListItem | null;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key="quickview-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="quickview-panel"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative bg-card rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Quick view: ${product.name}`}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close quick view"
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 text-ink-light hover:text-ink transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col sm:flex-row">
              {/* Image */}
              <div className="relative w-full sm:w-48 aspect-square sm:aspect-auto shrink-0 bg-blush-light">
                {getPrimaryImage(product) ? (
                  <Image
                    src={getPrimaryImage(product)!}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 192px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-accent text-2xl text-wine/30 italic">Cakery</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1 min-w-0">
                {product.categories && (
                  <p className="label-small text-wine mb-1">{product.categories.name}</p>
                )}
                <h2 className="font-display text-xl text-ink font-medium leading-snug mb-2">
                  {product.name}
                </h2>
                <p className="text-2xl font-display font-semibold text-wine mb-3">
                  from {formatCurrency(getMinPrice(product))}
                </p>

                {product.is_featured && (
                  <span className="inline-block label-small bg-wine/10 text-wine px-2 py-0.5 rounded-full text-[10px] mb-3 w-fit">
                    Featured
                  </span>
                )}

                <div className="mt-auto flex items-center gap-3 pt-4 border-t border-border">
                  <Link
                    href={`/cakes/${product.slug}`}
                    onClick={onClose}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5"
                  >
                    View Full Details
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                  <WishlistButton productId={product.id} productName={product.name} size="md" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
