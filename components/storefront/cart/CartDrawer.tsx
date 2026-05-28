"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/brand";
import { useCartStore } from "@/stores/cart";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isDrawerOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const _hasHydrated = useCartStore((s) => s._hasHydrated);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, closeDrawer]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!_hasHydrated) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.aside
            key="cart-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-cream shadow-2xl"
            aria-label="Shopping cart"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-wine" aria-hidden="true" />
                <h2 className="font-display text-lg font-semibold text-ink">
                  Your Cart
                  {items.length > 0 && (
                    <span className="ml-2 text-sm font-body font-normal text-ink-light">
                      ({items.length} {items.length === 1 ? "item" : "items"})
                    </span>
                  )}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close cart"
                className="p-2 rounded-lg text-ink-light hover:text-wine hover:bg-blush-light transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-blush-light flex items-center justify-center">
                    <ShoppingBag className="w-7 h-7 text-wine/50" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-display text-lg text-ink mb-1">Your cart is empty</p>
                    <p className="text-sm font-body text-ink-light">
                      Add some cakes to get started!
                    </p>
                  </div>
                  <Link
                    href="/cakes"
                    onClick={closeDrawer}
                    className="btn-primary text-sm px-5 py-2.5"
                  >
                    Browse Cakes
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex gap-3 pb-4 border-b border-border last:border-0"
                  >
                    {/* Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-blush-light shrink-0">
                      {item.snapshot.imageUrl ? (
                        <Image
                          src={item.snapshot.imageUrl}
                          alt={item.snapshot.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-wine/30" aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/cakes/${item.snapshot.slug}`}
                        onClick={closeDrawer}
                        className="font-body font-medium text-sm text-ink hover:text-wine transition-colors line-clamp-1"
                      >
                        {item.snapshot.name}
                      </Link>
                      {item.customizationSummary.length > 0 && (
                        <p className="text-xs text-ink-light mt-0.5 line-clamp-1">
                          {item.customizationSummary.join(" · ")}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        {/* Qty controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.cartItemId, Math.max(1, item.customization.quantity - 1))
                            }
                            disabled={item.customization.quantity <= 1}
                            aria-label="Decrease quantity"
                            className="w-6 h-6 rounded border border-border flex items-center justify-center text-ink hover:border-wine hover:text-wine transition-colors disabled:opacity-40"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-sm font-body font-medium text-ink tabular-nums">
                            {item.customization.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.cartItemId, Math.min(10, item.customization.quantity + 1))
                            }
                            disabled={item.customization.quantity >= 10}
                            aria-label="Increase quantity"
                            className="w-6 h-6 rounded border border-border flex items-center justify-center text-ink hover:border-wine hover:text-wine transition-colors disabled:opacity-40"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <p className="text-sm font-body font-semibold text-wine">
                          {formatCurrency(item.lineTotal)}
                        </p>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.cartItemId)}
                      aria-label={`Remove ${item.snapshot.name} from cart`}
                      className="shrink-0 p-1 text-ink-light hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border px-5 py-4 space-y-3 bg-cream">
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-ink-light">Subtotal</span>
                  <span className="font-display text-lg font-semibold text-ink">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <p className="text-xs text-ink-light">
                  Delivery fee calculated at checkout.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/cart"
                    onClick={closeDrawer}
                    className={cn(
                      "btn-secondary text-center text-sm py-2.5"
                    )}
                  >
                    View Cart
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      closeDrawer();
                      router.push("/checkout");
                    }}
                    className="btn-primary text-sm py-2.5"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
