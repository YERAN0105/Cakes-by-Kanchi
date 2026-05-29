"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, Clock, CheckCircle2, Truck, AlertCircle, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/brand";
import { Container } from "@/components/shared/Container";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const TZ = "Asia/Colombo";

interface OrderStatusHistory {
  status: string;
  note: string | null;
  changed_at: string;
}

interface TrackedOrder {
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  fulfillment_type: string;
  delivery_date: string | null;
  subtotal: string;
  delivery_fee: string;
  discount_amount: string;
  total: string;
  created_at: string;
  order_status_history: OrderStatusHistory[];
  order_items: {
    product_snapshot: { name: string; sizeName: string };
    customization: { quantity: number };
    line_total: string;
  }[];
}

const STATUS_LABELS: Record<string, string> = {
  pending_confirmation: "Pending Confirmation",
  confirmed: "Confirmed",
  in_preparation: "Being Prepared",
  out_for_delivery: "Out for Delivery",
  ready_for_pickup: "Ready for Pickup",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_ICONS: Record<string, typeof Package> = {
  pending_confirmation: Clock,
  confirmed: CheckCircle2,
  in_preparation: Package,
  out_for_delivery: Truck,
  ready_for_pickup: Package,
  delivered: CheckCircle2,
  completed: CheckCircle2,
  cancelled: XCircle,
  refunded: XCircle,
};

export function OrderTrackClient() {
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const handleTrack = async () => {
    if (!orderNumber.trim() || !contact.trim()) {
      setError("Please enter both order number and email/phone.");
      return;
    }
    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const res = await fetch(
        `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber.trim())}&contact=${encodeURIComponent(contact.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Order not found. Please check your details.");
      } else {
        setOrder(data.order);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = order ? (STATUS_ICONS[order.status] ?? Package) : Package;

  return (
    <Container className="py-12 lg:py-16 max-w-2xl">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl font-semibold text-ink mb-2">Track Your Order</h1>
        <p className="body-base text-ink-light">
          Enter your order number and the email or phone used at checkout.
        </p>
      </div>

      {/* Search form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4 mb-6">
        <div>
          <label htmlFor="orderNumber" className="label-small text-ink mb-1.5 block">
            Order number
          </label>
          <input
            id="orderNumber"
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            placeholder="CKR-20250528-XXXXXX"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-cream text-sm font-body font-mono text-ink placeholder:text-ink-light focus:outline-none focus:ring-1 focus:ring-wine"
          />
        </div>
        <div>
          <label htmlFor="contact" className="label-small text-ink mb-1.5 block">
            Email or phone
          </label>
          <input
            id="contact"
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="hello@example.com or +94 77 …"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-cream text-sm font-body text-ink placeholder:text-ink-light focus:outline-none focus:ring-1 focus:ring-wine"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleTrack}
          disabled={loading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" aria-hidden="true" />
          )}
          {loading ? "Searching…" : "Track Order"}
        </button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Status card */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blush-light flex items-center justify-center shrink-0">
                  <StatusIcon className="w-5 h-5 text-wine" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-display text-lg font-semibold text-ink">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </p>
                  <p className="text-xs text-ink-light font-mono">{order.order_number}</p>
                </div>
              </div>

              {order.delivery_date && (
                <p className="text-sm font-body text-ink-light">
                  {order.fulfillment_type === "pickup" ? "Pickup" : "Delivery"} scheduled for{" "}
                  <span className="text-ink font-medium">
                    {format(new Date(order.delivery_date + "T00:00:00"), "EEEE, d MMMM yyyy")}
                  </span>
                </p>
              )}
            </div>

            {/* Timeline */}
            {order.order_status_history.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-display text-base font-semibold text-ink mb-4">
                  Order Timeline
                </h2>
                <ol className="space-y-4">
                  {order.order_status_history
                    .slice()
                    .reverse()
                    .map((h, idx) => (
                      <li key={idx} className="flex gap-3 text-sm font-body">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full mt-1.5 shrink-0",
                            idx === 0 ? "bg-wine" : "bg-border"
                          )}
                        />
                        <div>
                          <p className={cn("font-medium", idx === 0 ? "text-wine" : "text-ink")}>
                            {STATUS_LABELS[h.status] ?? h.status}
                          </p>
                          {h.note && <p className="text-ink-light text-xs">{h.note}</p>}
                          <p className="text-ink-light text-xs mt-0.5">
                            {formatInTimeZone(new Date(h.changed_at), TZ, "d MMM yyyy, h:mm a")}
                          </p>
                        </div>
                      </li>
                    ))}
                </ol>
              </div>
            )}

            {/* Items */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-base font-semibold text-ink mb-3">Items</h2>
              <div className="space-y-2">
                {order.order_items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm font-body">
                    <div>
                      <p className="font-medium text-ink">{item.product_snapshot.name}</p>
                      <p className="text-ink-light text-xs">
                        {item.product_snapshot.sizeName} × {item.customization.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-wine">
                      {formatCurrency(parseFloat(item.line_total))}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex justify-between font-semibold text-sm font-body">
                <span className="text-ink">Total</span>
                <span className="font-display text-base text-wine">
                  {formatCurrency(parseFloat(order.total))}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
}
