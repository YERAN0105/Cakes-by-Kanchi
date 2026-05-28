"use client";

import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useWishlistStore } from "@/stores/wishlist";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  productName: string;
  className?: string;
  size?: "sm" | "md";
}

export function WishlistButton({ productId, productName, className, size = "sm" }: WishlistButtonProps) {
  const toggle = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(productId));

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(productId);
    if (!isWishlisted) {
      toast.success(`${productName} saved to wishlist`);
    }
  };

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const btnSize = size === "sm" ? "w-8 h-8" : "w-10 h-10";

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      aria-label={isWishlisted ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      aria-pressed={isWishlisted}
      whileTap={{ scale: 0.85 }}
      className={cn(
        "flex items-center justify-center rounded-full transition-colors duration-200",
        btnSize,
        isWishlisted
          ? "bg-wine/10 text-wine"
          : "bg-white/80 text-ink-light hover:text-wine hover:bg-white",
        className
      )}
    >
      <motion.div
        animate={isWishlisted ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Heart
          className={cn(iconSize, isWishlisted && "fill-wine")}
          aria-hidden="true"
        />
      </motion.div>
    </motion.button>
  );
}
