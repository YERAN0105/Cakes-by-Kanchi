"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ProductImageRow } from "@/types/database";

interface ImageGalleryProps {
  images: ProductImageRow[];
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const sorted = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.display_order - b.display_order;
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const active = sorted[activeIndex];

  const prev = () => setActiveIndex((i) => (i - 1 + sorted.length) % sorted.length);
  const next = () => setActiveIndex((i) => (i + 1) % sorted.length);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
    if (e.key === "Escape") setLightboxOpen(false);
  };

  if (sorted.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-blush-light flex items-center justify-center">
        <span className="font-accent text-4xl text-wine/30 italic">Cakery</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div
          className="relative aspect-square rounded-2xl overflow-hidden bg-blush-light group cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Enlarge image"
          onKeyDown={(e) => { if (e.key === "Enter") setLightboxOpen(true); }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <Image
                src={active.url}
                alt={active.alt_text ?? productName}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority={activeIndex === 0}
              />
            </motion.div>
          </AnimatePresence>

          {/* Zoom hint */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-white/80 backdrop-blur-sm rounded-lg p-1.5">
              <ZoomIn className="w-4 h-4 text-ink" aria-hidden="true" />
            </span>
          </div>

          {/* Nav arrows — only if multiple images */}
          {sorted.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4 text-ink" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Next image"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronRight className="w-4 h-4 text-ink" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {sorted.length > 1 && (
          <div className="flex gap-2.5 overflow-x-auto pb-1" role="tablist" aria-label="Product images">
            {sorted.map((img, i) => (
              <button
                key={img.id}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`View image ${i + 1}`}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-200",
                  i === activeIndex
                    ? "border-wine shadow-sm"
                    : "border-transparent opacity-60 hover:opacity-90 hover:border-blush-dark"
                )}
              >
                <Image
                  src={img.url}
                  alt={img.alt_text ?? `${productName} thumbnail ${i + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4"
            onClick={() => setLightboxOpen(false)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="dialog"
            aria-modal="true"
            aria-label="Image lightbox"
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close lightbox"
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-cream"
            >
              <X className="w-5 h-5" />
            </button>
            {sorted.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-cream"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-cream"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative max-w-3xl max-h-[85vh] w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={active.url}
                alt={active.alt_text ?? productName}
                fill
                sizes="(max-width: 768px) 100vw, 900px"
                className="object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
