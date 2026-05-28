"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/brand";

interface StickyBarProps {
  productName: string;
  basePrice: number;
}

export function StickyBar({ productName, basePrice }: StickyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    const sentinel = document.getElementById("pdp-add-to-cart-sentinel");
    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-cream/95 backdrop-blur-sm border-t border-border px-4 py-3 safe-area-inset-bottom"
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-ink-light truncate">{productName}</p>
              <p className="font-display font-semibold text-wine">from {formatCurrency(basePrice)}</p>
            </div>
            <button
              type="button"
              onClick={() => toast.info("Cart coming in Phase 3")}
              className="btn-primary text-sm py-2.5 px-5 shrink-0"
            >
              Add to Cart
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
