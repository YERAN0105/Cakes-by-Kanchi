import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import {
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Building2,
  Banknote,
  CheckCircle2,
  Circle,
  Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, brand } from "@/lib/brand";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const TZ = "Asia/Colombo";
import { OrderStatusBadge } from "@/components/storefront/account/OrderStatusBadge";
import { OrderActions } from "@/components/storefront/account/OrderActions";
import { ReviewModal } from "@/components/storefront/account/ReviewModal";
import { OrderItemBreakdown } from "@/components/storefront/account/OrderItemBreakdown";
import type { Database, AddressSnapshot, ProductSnapshot, OrderStatus } from "@/types/database";

export const metadata: Metadata = { title: "Order Details" };

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type TimeSlotRow = Database["public"]["Tables"]["time_slots"]["Row"];

interface OrderItem {
  id: string;
  product_id: string | null;
  product_snapshot: ProductSnapshot;
  customization: {
    quantity: number;
    size_id?: string;
    flavor_id?: string | null;
    tier_id?: string | null;
    eggless?: boolean;
    vegan?: boolean;
    gluten_free?: boolean;
    message?: string;
    color_theme?: string;
    special_instructions?: string;
    addon_ids?: string[];
  };
  quantity: number;
  unit_price: string;
  line_total: string;
}

type StatusHistoryRow = Database["public"]["Tables"]["order_status_history"]["Row"];

const STATUS_STEPS: OrderStatus[] = [
  "pending_confirmation",
  "confirmed",
  "in_preparation",
  "out_for_delivery",
  "delivered",
];

const PICKUP_STEPS: OrderStatus[] = [
  "pending_confirmation",
  "confirmed",
  "in_preparation",
  "ready_for_pickup",
  "completed",
];

const STEP_LABELS: Record<OrderStatus, string> = {
  pending_confirmation: "Order Placed",
  confirmed: "Confirmed",
  in_preparation: "Baking",
  out_for_delivery: "Out for Delivery",
  ready_for_pickup: "Ready for Pickup",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

interface Props {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { orderNumber } = await params;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const admin = createAdminClient();

  const { data: rawOrder } = await admin
    .from("orders")
    .select(
      "*, order_items(id, product_id, product_snapshot, customization, quantity, unit_price, line_total)"
    )
    .eq("order_number", orderNumber)
    .eq("user_id", authUser.id)
    .single();

  if (!rawOrder) notFound();

  type FullOrder = OrderRow & { order_items: OrderItem[] };
  const order = rawOrder as unknown as FullOrder;

  const [slotResult, historyResult, existingReviewsResult, receiptResult] = await Promise.all([
    order.time_slot_id
      ? admin.from("time_slots").select("label").eq("id", order.time_slot_id).single()
      : Promise.resolve({ data: null }),
    admin
      .from("order_status_history")
      .select("*")
      .eq("order_id", order.id)
      .order("changed_at", { ascending: true }),
    order.status === "delivered" || order.status === "completed"
      ? admin
          .from("reviews")
          .select("order_item_id")
          .eq("user_id", authUser.id)
          .in(
            "order_item_id",
            order.order_items.map((i) => i.id)
          )
      : Promise.resolve({ data: [] }),
    order.payment_method === "bank_transfer"
      ? admin.from("bank_transfer_receipts").select("id").eq("order_id", order.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const slot = slotResult.data as unknown as Pick<TimeSlotRow, "label"> | null;
  const history = (historyResult.data ?? []) as StatusHistoryRow[];
  const reviewedItemIds = new Set((existingReviewsResult.data ?? []).map((r) => r.order_item_id));
  const receiptUploaded = receiptResult.data !== null;

  const PAYMENT_STATUS_LABEL: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    pending_transfer: receiptUploaded ? "Receipt Submitted - Pending Verification" : "Awaiting Bank Transfer",
    failed: "Failed",
    refunded: "Refunded",
  };

  const address = order.address_snapshot as AddressSnapshot | null;
  const deliveryDateFormatted = order.delivery_date
    ? format(new Date(order.delivery_date + "T00:00:00"), "EEEE, d MMMM yyyy")
    : null;

  const isDelivery = order.fulfillment_type === "delivery";
  const isCancelled = order.status === "cancelled" || order.status === "refunded";
  const canReview =
    (order.status === "delivered" || order.status === "completed") &&
    order.order_items.some((i) => !reviewedItemIds.has(i.id));

  const steps = isDelivery ? STATUS_STEPS : PICKUP_STEPS;
  const currentStepIdx = isCancelled ? -1 : steps.indexOf(order.status);

  const historyByStatus = new Map(history.map((h) => [h.status, h.changed_at]));

  const paymentMethodLabel: Record<string, string> = {
    payhere: "Online Payment (PayHere)",
    bank_transfer: "Bank Transfer",
    cod: "Cash on Delivery",
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link href="/account/orders" className="text-sm font-body text-wine hover:text-wine/80 transition-colors">
            ← Back to Orders
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="font-display text-2xl font-semibold text-ink">{order.order_number}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-ink-light font-body mt-0.5">
            Placed {formatInTimeZone(new Date(order.created_at), TZ, "d MMMM yyyy, h:mm a")}
          </p>
        </div>
      </div>

      {/* Status Timeline */}
      {!isCancelled && (
        <div className="rounded-xl border border-border bg-card p-5 mb-5">
          <h2 className="font-display text-base font-semibold text-ink mb-4">Order Status</h2>
          <ol className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            {steps.map((step, idx) => {
              const done = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;
              const ts = historyByStatus.get(step);
              return (
                <li key={step} className="relative flex-1 flex sm:flex-col items-start sm:items-center gap-2 sm:gap-1">
                  <div className="flex sm:flex-col items-center gap-2">
                    {/* connector line before (desktop) */}
                    {idx > 0 && (
                      <div
                        className={`hidden sm:block h-0.5 w-full absolute -left-1/2 top-3 z-0 ${done ? "bg-wine" : "bg-border"}`}
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative z-10 flex items-center justify-center bg-card rounded-full">
                      {done ? (
                        <CheckCircle2
                          className={`w-6 h-6 ${isCurrent ? "text-wine" : "text-wine/60"}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle className="w-6 h-6 text-border" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                  <div className="sm:text-center min-w-0">
                    <p className={`text-xs font-body font-medium leading-tight ${done ? "text-ink" : "text-ink-light"}`}>
                      {STEP_LABELS[step]}
                    </p>
                    {ts && (
                      <p className="text-[10px] text-ink-light font-body mt-0.5">
                        {formatInTimeZone(new Date(ts), TZ, "d MMM, h:mm a")}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {isCancelled && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-5 text-sm font-body text-red-700">
          This order has been {order.status}
          {history.find((h) => h.status === "cancelled")?.note
            ? ` — ${history.find((h) => h.status === "cancelled")!.note}`
            : "."}
        </div>
      )}

      {/* Order Items */}
      <div className="rounded-xl border border-border bg-card p-5 mb-5">
        <h2 className="font-display text-base font-semibold text-ink mb-4">
          Items ({order.order_items.length})
        </h2>
        <div className="space-y-5">
          {order.order_items.map((item) => {
            const snap = item.product_snapshot;
            const c = item.customization;
            const alreadyReviewed = reviewedItemIds.has(item.id);
            const customSummary: string[] = [snap.sizeName];
            if (snap.flavorName) customSummary.push(snap.flavorName);
            if (snap.tierName) customSummary.push(snap.tierName);
            if (c.eggless) customSummary.push("Eggless");
            if (c.vegan) customSummary.push("Vegan");
            if (c.gluten_free) customSummary.push("Gluten Free");
            if (c.message) customSummary.push(`Message: "${c.message}"`);
            if (c.color_theme) customSummary.push(`Colour: ${c.color_theme}`);
            if (c.special_instructions) customSummary.push(`Note: ${c.special_instructions}`);

            return (
              <div key={item.id} className="flex gap-4">
                {snap.imageUrl ? (
                  <Image
                    src={snap.imageUrl}
                    alt={snap.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-lg object-cover shrink-0 border border-border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-blush-light shrink-0 border border-border" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <p className="font-body font-medium text-ink text-sm">{snap.name}</p>
                    <p className="font-body font-medium text-wine text-sm shrink-0">
                      {formatCurrency(parseFloat(item.line_total))}
                    </p>
                  </div>
                  <p className="text-xs text-ink-light font-body mt-1 leading-relaxed">
                    {customSummary.join(" · ")} <span className="font-semibold text-ink">× {item.quantity}</span>
                  </p>
                  {snap.priceBreakdown && snap.priceBreakdown.length > 0 && (
                    <OrderItemBreakdown
                      breakdown={snap.priceBreakdown}
                      quantity={item.quantity}
                      lineTotal={parseFloat(item.line_total)}
                    />
                  )}
                  {canReview && !alreadyReviewed && item.product_id && (
                    <ReviewModal
                      orderItemId={item.id}
                      productId={item.product_id}
                      productName={snap.name}
                    />
                  )}
                  {alreadyReviewed && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs text-ink-light font-body">
                      <Star className="w-3 h-3 fill-champagne text-champagne" aria-hidden="true" />
                      Review submitted
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery / Pickup */}
      <div className="rounded-xl border border-border bg-card p-5 mb-5">
        <h2 className="font-display text-base font-semibold text-ink mb-3">
          {isDelivery ? "Delivery Details" : "Pickup Details"}
        </h2>
        <div className="space-y-2 text-sm font-body">
          {deliveryDateFormatted && (
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-wine mt-0.5 shrink-0" aria-hidden="true" />
              <span className="text-ink">{deliveryDateFormatted}</span>
            </div>
          )}
          {slot && (
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-wine mt-0.5 shrink-0" aria-hidden="true" />
              <span className="text-ink">{slot.label}</span>
            </div>
          )}
          {isDelivery && address ? (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-wine mt-0.5 shrink-0" aria-hidden="true" />
              <span className="text-ink">
                {address.recipient}, {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}, {address.city}
                {address.postal_code ? ` ${address.postal_code}` : ""}
              </span>
            </div>
          ) : !isDelivery ? (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-wine mt-0.5 shrink-0" aria-hidden="true" />
              <span className="text-ink">
                Pickup from {brand.address.line1}, {brand.address.line2}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Pricing breakdown */}
      <div className="rounded-xl border border-border bg-card p-5 mb-5">
        <h2 className="font-display text-base font-semibold text-ink mb-3">Payment Summary</h2>
        <div className="space-y-1.5 text-sm font-body">
          <div className="flex justify-between">
            <span className="text-ink-light">Subtotal</span>
            <span className="text-ink">{formatCurrency(parseFloat(order.subtotal))}</span>
          </div>
          {parseFloat(order.delivery_fee) > 0 && (
            <div className="flex justify-between">
              <span className="text-ink-light">Delivery</span>
              <span className="text-ink">{formatCurrency(parseFloat(order.delivery_fee))}</span>
            </div>
          )}
          {parseFloat(order.discount_amount) > 0 && (
            <div className="flex justify-between text-wine">
              <span>Discount</span>
              <span>−{formatCurrency(parseFloat(order.discount_amount))}</span>
            </div>
          )}
          {parseFloat(order.loyalty_discount) > 0 && (
            <div className="flex justify-between text-wine">
              <span>Loyalty Points</span>
              <span>−{formatCurrency(parseFloat(order.loyalty_discount))}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold pt-2 border-t border-border mt-2">
            <span className="text-ink">Total</span>
            <span className="font-display text-lg text-wine">
              {formatCurrency(parseFloat(order.total))}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {order.payment_method === "payhere" && <CreditCard className="w-4 h-4 text-ink-light" aria-hidden="true" />}
            {order.payment_method === "bank_transfer" && <Building2 className="w-4 h-4 text-ink-light" aria-hidden="true" />}
            {order.payment_method === "cod" && <Banknote className="w-4 h-4 text-ink-light" aria-hidden="true" />}
            <span className="text-ink-light text-xs">
              {paymentMethodLabel[order.payment_method]}
              {order.payment_method !== "cod" && (
                <span className={`ml-1 font-medium ${
                  order.payment_status === "paid" ? "text-green-600" :
                  order.payment_status === "failed" ? "text-red-600" :
                  "text-amber-600"
                }`}>
                  · {PAYMENT_STATUS_LABEL[order.payment_status] ?? order.payment_status.replace(/_/g, " ")}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <OrderActions
        orderId={order.id}
        orderNumber={order.order_number}
        status={order.status}
        paymentMethod={order.payment_method}
        paymentStatus={order.payment_status}
        orderItems={order.order_items.map((i) => ({
          id: i.id,
          product_id: i.product_id,
          product_snapshot: i.product_snapshot,
          customization: i.customization as Record<string, unknown>,
          quantity: i.quantity,
          unit_price: i.unit_price,
          line_total: i.line_total,
        }))}
      />
    </div>
  );
}
