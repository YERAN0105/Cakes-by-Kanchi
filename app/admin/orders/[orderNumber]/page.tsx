import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { formatCurrency } from "@/lib/brand";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OrderDetailClient } from "./OrderDetailClient";
import type { OrderStatus, PaymentStatus, AddressSnapshot, ProductSnapshot } from "@/types/database";

const TZ = "Asia/Colombo";

interface PageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const admin = createAdminClient();

  const { data: rawOrder } = await admin
    .from("orders")
    .select(
      `*,
      users(id, name, email, phone),
      delivery_zones(name, fee),
      time_slots(label, start_time, end_time),
      order_items(id, product_id, product_snapshot, customization, quantity, unit_price, line_total),
      order_status_history(id, status, note, changed_by, changed_at),
      bank_transfer_receipts(id, image_url, status, reject_reason, uploaded_at),
      payments(id, gateway, gateway_transaction_id, amount, status, raw_response, created_at),
      coupons(code)`
    )
    .eq("order_number", orderNumber)
    .single();

  if (!rawOrder) notFound();

  const order = rawOrder as unknown as {
    id: string;
    order_number: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    payment_method: string;
    fulfillment_type: string;
    subtotal: string;
    delivery_fee: string;
    discount_amount: string;
    tax_amount: string;
    loyalty_discount: string;
    loyalty_points_used: number;
    total: string;
    notes: string | null;
    internal_notes: string | null;
    address_snapshot: AddressSnapshot | null;
    delivery_date: string | null;
    guest_email: string | null;
    guest_phone: string | null;
    coupon_id: string | null;
    created_at: string;
    users: { id: string; name: string; email: string; phone: string | null } | null;
    delivery_zones: { name: string; fee: string } | null;
    time_slots: { label: string; start_time: string; end_time: string } | null;
    order_items: {
      id: string;
      product_id: string | null;
      product_snapshot: ProductSnapshot;
      customization: Record<string, unknown>;
      quantity: number;
      unit_price: string;
      line_total: string;
    }[];
    order_status_history: { id: string; status: OrderStatus; note: string | null; changed_by: string | null; changed_at: string }[];
    bank_transfer_receipts: { id: string; image_url: string; status: string; reject_reason: string | null; uploaded_at: string }[];
    payments: { id: string; gateway: string; gateway_transaction_id: string | null; amount: string; status: string; raw_response: unknown; created_at: string }[];
    coupons: { code: string } | null;
  };

  // Resolve add-on names from all order items
  const allAddonIds = Array.from(
    new Set(order.order_items.flatMap((item) => (item.customization.addon_ids as string[]) ?? []))
  );
  const allShapeIds = Array.from(
    new Set(
      order.order_items
        .map((item) => item.customization.shape_id as string | undefined)
        .filter(Boolean) as string[]
    )
  );

  const [addonsRes, shapesRes] = await Promise.all([
    allAddonIds.length > 0
      ? admin.from("addons").select("id, name, price").in("id", allAddonIds)
      : Promise.resolve({ data: [] }),
    allShapeIds.length > 0
      ? admin.from("product_shapes").select("id, shape").in("id", allShapeIds)
      : Promise.resolve({ data: [] }),
  ]);

  const addonMap = Object.fromEntries(
    ((addonsRes.data ?? []) as { id: string; name: string; price: string }[]).map((a) => [a.id, a])
  );
  const shapeMap = Object.fromEntries(
    ((shapesRes.data ?? []) as { id: string; shape: string }[]).map((s) => [s.id, s.shape])
  );

  // Get signed URLs for bank transfer receipts
  const receiptsWithUrls = await Promise.all(
    (order.bank_transfer_receipts ?? []).map(async (r) => {
      const { data } = await admin.storage
        .from("receipts")
        .createSignedUrl(r.image_url, 3600);
      return { ...r, signedUrl: data?.signedUrl ?? null };
    })
  );

  const customerName = order.users?.name ?? order.guest_email ?? "Guest";
  const customerPhone = order.users?.phone ?? order.guest_phone ?? null;
  const customerEmail = order.users?.email ?? order.guest_email ?? null;

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/admin/orders" className="text-sm text-ink-light hover:text-ink">← Orders</Link>
          </div>
          <h2 className="font-display text-2xl text-ink">{order.order_number}</h2>
          <p className="text-sm text-ink-light">{formatInTimeZone(order.created_at, TZ, "d MMMM yyyy, h:mm a")}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge type="order" value={order.status} />
          <StatusBadge type="payment" value={order.payment_status} />
          <Link
            href={`/admin/orders/${order.order_number}/print/invoice`}
            target="_blank"
            className="px-3 py-1.5 text-sm border border-border rounded-lg text-ink-light hover:text-ink hover:border-ink transition-colors"
          >
            Print Invoice
          </Link>
          <Link
            href={`/admin/orders/${order.order_number}/print/kitchen-ticket`}
            target="_blank"
            className="px-3 py-1.5 text-sm border border-border rounded-lg text-ink-light hover:text-ink hover:border-ink transition-colors"
          >
            Kitchen Ticket
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status timeline + controls */}
          <OrderDetailClient
            orderId={order.id}
            orderNumber={order.order_number}
            currentStatus={order.status}
            paymentStatus={order.payment_status}
            paymentMethod={order.payment_method}
            internalNotes={order.internal_notes}
            statusHistory={order.order_status_history}
            receipts={receiptsWithUrls}
          />

          {/* Order items */}
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-display text-lg text-ink">Order Items</h3>
            </div>
            <div className="divide-y divide-border">
              {order.order_items.map((item) => {
                const snap = item.product_snapshot;
                const cust = item.customization as Record<string, unknown>;

                const shapeName = cust.shape_id ? shapeMap[cust.shape_id as string] : null;
                const dietaryParts: string[] = [];
                if (cust.eggless) dietaryParts.push("Eggless");
                if (cust.vegan) dietaryParts.push("Vegan");
                if (cust.gluten_free) dietaryParts.push("Gluten-Free");

                const addonIds = (cust.addon_ids as string[]) ?? [];
                const addonQuantities = (cust.addon_quantities as Record<string, number>) ?? {};
                const resolvedAddons = addonIds
                  .map((id) => addonMap[id])
                  .filter(Boolean)
                  .map((a) => {
                    const qty = addonQuantities[a.id] ?? 1;
                    return qty > 1 ? `${a.name} ×${qty}` : a.name;
                  });

                const priceBreakdown = snap?.priceBreakdown ?? [];

                return (
                  <div key={item.id} className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-ink text-base">{snap?.name ?? "Unknown"}</p>
                        <p className="text-sm text-ink-light">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-ink">{formatCurrency(parseFloat(item.line_total))}</p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-ink-light">{formatCurrency(parseFloat(item.unit_price))} each</p>
                        )}
                      </div>
                    </div>

                    {/* Specifications grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm bg-gray-50 rounded-lg p-4">
                      {snap?.sizeName && (
                        <div><span className="text-ink-light">Size: </span><span className="font-medium text-ink">{snap.sizeName}</span></div>
                      )}
                      {snap?.flavorName && (
                        <div><span className="text-ink-light">Flavor: </span><span className="font-medium text-ink">{snap.flavorName}</span></div>
                      )}
                      {shapeName && (
                        <div><span className="text-ink-light">Shape: </span><span className="font-medium text-ink">{shapeName}</span></div>
                      )}
                      {snap?.tierName && (
                        <div><span className="text-ink-light">Tier: </span><span className="font-medium text-ink">{snap.tierName}</span></div>
                      )}
                      {dietaryParts.length > 0 && (
                        <div className="col-span-2"><span className="text-ink-light">Dietary: </span><span className="font-medium text-ink">{dietaryParts.join(", ")}</span></div>
                      )}
                      {(cust.color_theme as string) && (
                        <div className="col-span-2"><span className="text-ink-light">Color Theme: </span><span className="font-medium text-ink">{cust.color_theme as string}</span></div>
                      )}
                    </div>

                    {/* Add-ons */}
                    {resolvedAddons.length > 0 && (
                      <div className="bg-blush/20 rounded-lg p-4">
                        <p className="text-xs font-semibold text-ink uppercase tracking-wide mb-2">Add-Ons</p>
                        <div className="flex flex-wrap gap-2">
                          {resolvedAddons.map((name, i) => (
                            <span key={i} className="px-2 py-1 bg-white border border-border rounded text-sm text-ink">{name}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cake message */}
                    {(cust.message as string) && (
                      <div className="bg-champagne/30 border border-champagne rounded-lg p-4">
                        <p className="text-xs font-semibold text-ink uppercase tracking-wide mb-1">Cake Message</p>
                        <p className="text-ink italic text-sm">&ldquo;{cust.message as string}&rdquo;</p>
                      </div>
                    )}

                    {/* Special instructions */}
                    {(cust.special_instructions as string) && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Special Instructions</p>
                        <p className="text-ink text-sm">{cust.special_instructions as string}</p>
                      </div>
                    )}

                    {/* Photo upload */}
                    {(cust.photo_url as string) && (
                      <div>
                        <p className="text-xs font-semibold text-ink uppercase tracking-wide mb-2">Reference Photo</p>
                        <a href={cust.photo_url as string} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-wine hover:underline">
                          View uploaded photo →
                        </a>
                      </div>
                    )}

                    {/* Price breakdown */}
                    {priceBreakdown.length > 0 && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-ink-light hover:text-ink select-none">Price breakdown</summary>
                        <div className="mt-2 space-y-1 bg-gray-50 rounded-lg p-3">
                          {priceBreakdown.map((line, i) => (
                            <div key={i} className="flex justify-between">
                              <span className="text-ink-light">{line.label}</span>
                              <span className="text-ink">{formatCurrency(line.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pricing summary */}
            <div className="px-6 py-4 bg-gray-50 border-t border-border space-y-1 text-sm">
              <div className="flex justify-between text-ink-light">
                <span>Subtotal</span>
                <span>{formatCurrency(parseFloat(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-ink-light">
                <span>Delivery</span>
                <span>{formatCurrency(parseFloat(order.delivery_fee))}</span>
              </div>
              {parseFloat(order.discount_amount) > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount{order.coupons?.code ? ` (${order.coupons.code})` : ""}</span>
                  <span>-{formatCurrency(parseFloat(order.discount_amount))}</span>
                </div>
              )}
              {parseFloat(order.loyalty_discount) > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Loyalty ({order.loyalty_points_used} pts)</span>
                  <span>-{formatCurrency(parseFloat(order.loyalty_discount))}</span>
                </div>
              )}
              {parseFloat(order.tax_amount) > 0 && (
                <div className="flex justify-between text-ink-light">
                  <span>Tax</span>
                  <span>{formatCurrency(parseFloat(order.tax_amount))}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-ink pt-2 border-t border-border text-base">
                <span>Total</span>
                <span>{formatCurrency(parseFloat(order.total))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <h3 className="font-display text-base text-ink mb-3">Customer</h3>
            <p className="font-medium text-ink">{customerName}</p>
            {customerEmail && (
              <a href={`mailto:${customerEmail}`} className="text-sm text-wine hover:underline block">{customerEmail}</a>
            )}
            {customerPhone && (
              <a href={`tel:${customerPhone}`} className="text-sm text-wine hover:underline block">{customerPhone}</a>
            )}
            {order.users?.id && (
              <Link href={`/admin/customers/${order.users.id}`} className="text-xs text-ink-light hover:underline mt-2 block">
                View Customer Profile →
              </Link>
            )}
          </div>

          {/* Fulfillment */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <h3 className="font-display text-base text-ink mb-3">Fulfillment</h3>
            <p className="text-sm font-medium text-ink capitalize">{order.fulfillment_type}</p>
            {order.address_snapshot && (
              <div className="text-sm text-ink-light mt-2">
                <p>{order.address_snapshot.recipient}</p>
                <p>{order.address_snapshot.line1}</p>
                {order.address_snapshot.line2 && <p>{order.address_snapshot.line2}</p>}
                <p>{order.address_snapshot.city}</p>
              </div>
            )}
            {order.delivery_zones && (
              <p className="text-xs text-ink-light mt-1">Zone: {order.delivery_zones.name} ({formatCurrency(parseFloat(order.delivery_zones.fee))})</p>
            )}
            {order.delivery_date && (
              <p className="text-sm text-ink mt-2">
                📅 {formatInTimeZone(`${order.delivery_date}T00:00:00`, TZ, "EEEE, d MMMM yyyy")}
              </p>
            )}
            {order.time_slots && (
              <p className="text-sm text-ink-light">{order.time_slots.label}</p>
            )}
            {order.notes && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs text-ink-light">Customer note:</p>
                <p className="text-sm text-ink italic">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <h3 className="font-display text-base text-ink mb-3">Payment</h3>
            <p className="text-sm text-ink capitalize">{order.payment_method.replace("_", " ")}</p>
            <StatusBadge type="payment" value={order.payment_status} className="mt-1" />
            {order.payments.map((p) => p.gateway_transaction_id && (
              <p key={p.id} className="text-xs text-ink-light mt-2">TX: {p.gateway_transaction_id}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
