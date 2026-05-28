"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CustomizationValues } from "@/lib/validations/customization";
import type { AppliedCoupon } from "@/types/database";

export type { AppliedCoupon };

export interface CartItemSnapshot {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  snapshot: CartItemSnapshot;
  customization: CustomizationValues;
  customizationSummary: string[];
  unitPrice: number;
  lineTotal: number;
}

interface CartState {
  items: CartItem[];
  count: number;
  subtotal: number;
  appliedCoupon: AppliedCoupon | null;
  isDrawerOpen: boolean;
  _hasHydrated: boolean;

  addItem: (item: Omit<CartItem, "cartItemId">) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  setHasHydrated: (v: boolean) => void;
}

function computeTotals(items: CartItem[]) {
  const count = items.reduce((sum, i) => sum + i.customization.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return { count, subtotal };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      count: 0,
      subtotal: 0,
      appliedCoupon: null,
      isDrawerOpen: false,
      _hasHydrated: false,

      addItem: (item) => {
        const cartItemId = crypto.randomUUID();
        const newItem: CartItem = { ...item, cartItemId };
        const items = [...get().items, newItem];
        set({ items, ...computeTotals(items) });
      },

      removeItem: (cartItemId) => {
        const items = get().items.filter((i) => i.cartItemId !== cartItemId);
        set({ items, ...computeTotals(items) });
      },

      updateQuantity: (cartItemId, quantity) => {
        const items = get().items.map((i) =>
          i.cartItemId === cartItemId
            ? {
                ...i,
                customization: { ...i.customization, quantity },
                lineTotal: i.unitPrice * quantity,
              }
            : i
        );
        set({ items, ...computeTotals(items) });
      },

      clearCart: () => set({ items: [], count: 0, subtotal: 0, appliedCoupon: null }),

      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),
      removeCoupon: () => set({ appliedCoupon: null }),

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "cakery-cart",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
