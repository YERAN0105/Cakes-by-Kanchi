"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  items: string[];
  toggle: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  count: number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      count: 0,
      toggle: (productId) => {
        const current = get().items;
        const next = current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [...current, productId];
        set({ items: next, count: next.length });
      },
      isWishlisted: (productId) => get().items.includes(productId),
    }),
    { name: "cakery-wishlist" }
  )
);
