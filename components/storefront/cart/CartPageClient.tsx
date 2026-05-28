"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingBag, Minus, Plus, Trash2, Tag, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/brand";
import { useCartStore } from "@/stores/cart";
import { validateCoupon } from "@/lib/actions/cart";
import { Container } from "@/components/shared/Container";
import { cn } from "@/lib/utils";

export function CartPageClient() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const _hasHydrated = useCartStore((s) => s._hasHydrated);

  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const discount = appliedCoupon?.discountAmount ?? 0;
  const total = Math.max(0, subtotal - discount);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const result = await validateCoupon(couponInput, subtotal);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        applyCoupon(result.coupon);
        toast.success(`Coupon "${result.coupon.code}" applied!`);
        setCouponInput("");
      }
    } finally {
      setCouponLoading(false);
    }
  };

  if (!_hasHydrated) {
    return (
      <Container className="py-24">
        <div className="h-96 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-wine border-t-transparent animate-spin" />
        </div>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container className="py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm mx-auto space-y-5"
        >
          <div className="w-20 h-20 rounded-full bg-blush-light flex items-center justify-center mx-auto">
            <ShoppingBag className="w-9 h-9 text-wine/50" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink mb-2">
              Your cart is empty
            </h1>
            <p className="body-base text-ink-light">
              Looks like you haven&apos;t added any cakes yet.
            </p>
          </div>
          <Link href="/cakes" className="btn-primary inline-block px-8 py-3">
            Browse Our Cakes
          </Link>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container className="py-12 lg:py-16">
      <h1 className="font-display text-3xl font-semibold text-ink mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Cart Items ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <motion.div
              key={item.cartItemId}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex gap-4 p-4 rounded-xl border border-border bg-card"
            >
              {/* Image */}
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-blush-light shrink-0">
                {item.snapshot.imageUrl ? (
                  <Image
                    src={item.snapshot.imageUrl}
                    alt={item.snapshot.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-wine/30" aria-hidden="true" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/cakes/${item.snapshot.slug}`}
                      className="font-body font-semibold text-ink hover:text-wine transition-colors"
                    >
                      {item.snapshot.name}
                    </Link>
                    {item.customizationSummary.length > 0 && (
                      <p className="text-xs text-ink-light mt-0.5">
                        {item.customizationSummary.join(" · ")}
                      </p>
                    )}
                    {item.customization.message && (
                      <p className="text-xs text-ink-light mt-0.5 italic">
                        Message: &ldquo;{item.customization.message}&rdquo;
                      </p>
                    )}
                    {item.customization.special_instructions && (
                      <p className="text-xs text-ink-light mt-0.5">
                        Note: {item.customization.special_instructions}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.cartItemId)}
                    aria-label={`Remove ${item.snapshot.name}`}
                    className="p-1.5 text-ink-light hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  {/* Qty */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.cartItemId, Math.max(1, item.customization.quantity - 1))
                      }
                      disabled={item.customization.quantity <= 1}
                      aria-label="Decrease quantity"
                      className="w-7 h-7 rounded border border-border flex items-center justify-center text-ink hover:border-wine hover:text-wine transition-colors disabled:opacity-40"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-body font-medium text-ink tabular-nums">
                      {item.customization.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.cartItemId, Math.min(10, item.customization.quantity + 1))
                      }
                      disabled={item.customization.quantity >= 10}
                      aria-label="Increase quantity"
                      className="w-7 h-7 rounded border border-border flex items-center justify-center text-ink hover:border-wine hover:text-wine transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="text-right">
                    <p className="font-body font-semibold text-wine">
                      {formatCurrency(item.lineTotal)}
                    </p>
                    {item.customization.quantity > 1 && (
                      <p className="text-xs text-ink-light">
                        {formatCurrency(item.unitPrice)} each
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          ))}

          <Link
            href="/cakes"
            className="inline-flex items-center gap-1.5 text-sm font-body text-wine hover:underline"
          >
            ← Continue Shopping
          </Link>
        </div>

        {/* ── Order Summary ──────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-semibold text-ink">Order Summary</h2>

            {/* Coupon */}
            {appliedCoupon ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-wine/5 border border-wine/20">
                <Tag className="w-4 h-4 text-wine shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-wine">{appliedCoupon.code}</p>
                  <p className="text-xs text-ink-light">
                    {appliedCoupon.type === "percent"
                      ? `${appliedCoupon.value}% off`
                      : appliedCoupon.type === "flat"
                        ? `${formatCurrency(appliedCoupon.value)} off`
                        : "Free delivery"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  aria-label="Remove coupon"
                  className="text-ink-light hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  placeholder="Coupon code"
                  aria-label="Coupon code"
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-cream text-sm font-body text-ink placeholder:text-ink-light focus:outline-none focus:ring-1 focus:ring-wine"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-body font-medium transition-colors",
                    "bg-wine text-cream hover:bg-wine/90 disabled:opacity-50"
                  )}
                >
                  {couponLoading ? "…" : "Apply"}
                </button>
              </div>
            )}

            <div className="h-px bg-border" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-body">
                <span className="text-ink-light">Subtotal</span>
                <span className="text-ink">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm font-body">
                  <span className="text-wine">Discount</span>
                  <span className="text-wine">−{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-body text-ink-light">
                <span>Delivery fee</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between font-body font-semibold">
                <span className="text-ink">Estimated total</span>
                <span className="font-display text-xl text-wine">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/checkout")}
              className="btn-primary w-full text-center py-3.5 text-base"
            >
              Proceed to Checkout
            </button>

            {/* Reassurance */}
            <div className="flex items-start gap-2 text-xs text-ink-light">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
              <span>Orders must be placed at least 2 days in advance. Custom cakes may require more time.</span>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
