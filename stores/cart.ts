"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CustomizationValues } from "@/lib/validations/customization";
import type { AppliedCoupon, PriceLineItem } from "@/types/database";
import { computeDiscount } from "@/lib/cart-utils";

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
  priceBreakdown?: PriceLineItem[];
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

function refreshCoupon(coupon: AppliedCoupon | null, subtotal: number): AppliedCoupon | null {
  if (!coupon) return null;
  return { ...coupon, discountAmount: computeDiscount(coupon, subtotal) };
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
        const totals = computeTotals(items);
        set({ items, ...totals, appliedCoupon: refreshCoupon(get().appliedCoupon, totals.subtotal) });
      },

      removeItem: (cartItemId) => {
        const items = get().items.filter((i) => i.cartItemId !== cartItemId);
        const totals = computeTotals(items);
        set({ items, ...totals, appliedCoupon: refreshCoupon(get().appliedCoupon, totals.subtotal) });
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
        const totals = computeTotals(items);
        set({ items, ...totals, appliedCoupon: refreshCoupon(get().appliedCoupon, totals.subtotal) });
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
