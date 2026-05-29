"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, RotateCcw, Loader2, Printer, MessageSquare } from "lucide-react";
import { cancelOrderAction } from "@/lib/actions/account";
import { useCartStore } from "@/stores/cart";
import { whatsappUrl } from "@/lib/brand";
import type { CartItem } from "@/stores/cart";
import type { OrderStatus } from "@/types/database";

interface OrderItem {
  id: string;
  product_id: string | null;
  product_snapshot: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    sizeName: string;
    sizePrice: number;
  };
  customization: Record<string, unknown>;
  quantity: number;
  unit_price: string;
  line_total: string;
}

interface OrderActionsProps {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  orderItems: OrderItem[];
}

const CANCEL_REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Found a better option",
  "Delivery date doesn't work",
  "Other",
];

export function OrderActions({
  orderId,
  orderNumber,
  status,
  paymentMethod,
  paymentStatus,
  orderItems,
}: OrderActionsProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);

  const canCancel = status === "pending_confirmation" || status === "confirmed";
  const showReceiptUpload = paymentMethod === "bank_transfer" && paymentStatus === "pending_transfer";

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelOrderAction(orderId, cancelReason);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Order cancelled successfully.");
        setShowCancelModal(false);
        router.refresh();
      }
    });
  };

  const handleReorder = () => {
    let added = 0;
    for (const item of orderItems) {
      if (!item.product_id) continue;
      const snap = item.product_snapshot;
      const cartItem: Omit<CartItem, "cartItemId"> = {
        productId: snap.id,
        snapshot: {
          id: snap.id,
          name: snap.name,
          slug: snap.slug,
          imageUrl: snap.imageUrl,
        },
        customization: item.customization as Parameters<typeof addItem>[0]["customization"],
        customizationSummary: [snap.sizeName],
        unitPrice: parseFloat(item.unit_price),
        lineTotal: parseFloat(item.line_total),
      };
      addItem(cartItem);
      added++;
    }
    if (added > 0) {
      toast.success(`${added} item${added !== 1 ? "s" : ""} added to cart.`);
      openDrawer();
    } else {
      toast.error("Some products are no longer available.");
    }
  };

  const whatsappMessage = `Hi, I need help with my order ${orderNumber}. `;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Reorder */}
        <button
          type="button"
          onClick={handleReorder}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-body text-ink hover:border-wine/40 hover:text-wine transition-colors"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Reorder
        </button>

        {/* Print invoice */}
        <a
          href={`/account/orders/${orderNumber}/invoice`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-body text-ink hover:border-wine/40 hover:text-wine transition-colors"
        >
          <Printer className="w-4 h-4" aria-hidden="true" />
          Download Invoice
        </a>

        {/* Upload receipt (bank transfer) */}
        {showReceiptUpload && (
          <a
            href={`/order-success/${orderNumber}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-wine text-cream text-sm font-body hover:bg-wine/90 transition-colors"
          >
            Upload Bank Receipt
          </a>
        )}

        {/* Contact support */}
        <a
          href={whatsappUrl(whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-body text-ink hover:border-wine/40 hover:text-wine transition-colors"
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
          Contact Support
        </a>

        {/* Cancel */}
        {canCancel && (
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 text-sm font-body text-red-600 hover:bg-red-50 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            Cancel Order
          </button>
        )}
      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40">
          <div className="bg-cream rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-display text-xl font-semibold text-ink mb-1">Cancel Order?</h2>
            <p className="text-sm text-ink-light font-body mb-5">
              This action cannot be undone. Please tell us why you&apos;re cancelling.
            </p>

            <label className="block text-sm font-body text-ink mb-2">Reason</label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-wine/30 mb-5"
            >
              {CANCEL_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-body text-ink hover:border-wine/40 disabled:opacity-60 transition-colors"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-body font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
