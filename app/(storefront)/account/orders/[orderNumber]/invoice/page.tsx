import { Fragment } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, brand } from "@/lib/brand";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { Database, AddressSnapshot, ProductSnapshot } from "@/types/database";
import { PrintButton } from "./PrintButton";

const TZ = "Asia/Colombo";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

interface OrderItem {
  id: string;
  product_snapshot: ProductSnapshot;
  customization: {
    quantity: number;
    eggless?: boolean;
    vegan?: boolean;
    gluten_free?: boolean;
    message?: string;
    color_theme?: string;
    special_instructions?: string;
  };
  unit_price: string;
  line_total: string;
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  pending_transfer: "Awaiting Bank Transfer",
  cod_pending: "Cash on Delivery",
  failed: "Failed",
  refunded: "Refunded",
};

interface Props {
  params: Promise<{ orderNumber: string }>;
}

export default async function InvoicePage({ params }: Props) {
  const { orderNumber } = await params;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const admin = createAdminClient();
  const { data: rawOrder } = await admin
    .from("orders")
    .select("*, order_items(id, product_snapshot, customization, unit_price, line_total)")
    .eq("order_number", orderNumber)
    .eq("user_id", authUser.id)
    .single();

  if (!rawOrder) notFound();

  type FullOrder = OrderRow & { order_items: OrderItem[] };
  const order = rawOrder as unknown as FullOrder;
  const address = order.address_snapshot as AddressSnapshot | null;
  const isDelivery = order.fulfillment_type === "delivery";

  const [slotResult, profileResult, receiptResult] = await Promise.all([
    order.time_slot_id
      ? admin.from("time_slots").select("label").eq("id", order.time_slot_id).single()
      : Promise.resolve({ data: null }),
    !isDelivery
      ? admin.from("users").select("name, email, phone").eq("id", authUser.id).single()
      : Promise.resolve({ data: null }),
    order.payment_method === "bank_transfer"
      ? admin.from("bank_transfer_receipts").select("id").eq("order_id", order.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const slotLabel = (slotResult.data as { label: string } | null)?.label ?? null;
  const pickupCustomer = (profileResult.data as { name: string; email: string; phone: string | null } | null);
  const receiptUploaded = receiptResult.data !== null;

  return (
    <>
      {/* Print-specific CSS: hide everything except invoice content */}
      <style>{`
        @media print {
          header, footer, nav, aside,
          [data-no-print], .no-print { display: none !important; }
          #invoice-content { display: block !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* Screen action bar — hidden when printing */}
      <div data-no-print className="mb-6 flex items-center justify-between">
        <a href={`/account/orders/${orderNumber}`} className="text-sm font-body text-wine hover:text-wine/80 transition-colors">
          ← Back to Order
        </a>
        <PrintButton />
      </div>

      {/* Invoice content */}
      <div id="invoice-content" className="bg-white rounded-2xl border border-border p-8 max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-start pb-6 mb-6 border-b-2 border-wine">
          <div>
            <p className="font-display text-3xl font-semibold text-wine">{brand.name}</p>
            <p className="text-sm text-ink-light font-body mt-1">{brand.address.line1}, {brand.address.line2}</p>
            <p className="text-sm text-ink-light font-body">{brand.email}</p>
            <p className="text-sm text-ink-light font-body">{brand.phone}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-semibold text-wine">Invoice</p>
            <p className="font-mono text-sm font-semibold text-ink mt-1">{order.order_number}</p>
            <p className="text-sm text-ink-light font-body mt-1">
              {formatInTimeZone(new Date(order.created_at), TZ, "d MMMM yyyy, h:mm a")}
            </p>
          </div>
        </div>

        {/* Billing + order meta */}
        <div className="flex justify-between gap-8 mb-6">
          <div>
            <p className="text-xs font-body uppercase tracking-wider text-ink-light mb-2">
              {isDelivery ? "Billed to" : "Customer"}
            </p>
            {isDelivery && address ? (
              <div className="text-sm font-body text-ink space-y-0.5">
                <p className="font-medium">{address.recipient}</p>
                <p>{address.phone}</p>
                <p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
                <p>{address.city}{address.postal_code ? ` ${address.postal_code}` : ""}</p>
              </div>
            ) : pickupCustomer ? (
              <div className="text-sm font-body text-ink space-y-0.5">
                <p className="font-medium">{pickupCustomer.name}</p>
                <p>{pickupCustomer.email}</p>
                {pickupCustomer.phone && <p>{pickupCustomer.phone}</p>}
                <p className="text-ink-light">Pickup order</p>
              </div>
            ) : (
              <p className="text-sm font-body text-ink">Pickup order</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs font-body uppercase tracking-wider text-ink-light mb-1">
              {isDelivery ? "Delivery Date" : "Pickup Date"}
            </p>
            <p className="text-sm font-body text-ink">
              {order.delivery_date
                ? format(new Date(order.delivery_date + "T00:00:00"), "EEEE, d MMM yyyy")
                : "—"}
            </p>
            {slotLabel && (
              <p className="text-sm font-body text-ink-light mt-0.5">{slotLabel}</p>
            )}
            <p className="text-xs font-body uppercase tracking-wider text-ink-light mt-3 mb-1">Payment</p>
            <p className="text-sm font-body text-ink capitalize">
              {order.payment_method.replace(/_/g, " ")}
            </p>
            {order.payment_method !== "cod" && (
              <p className={`text-xs font-body mt-0.5 font-medium ${
                order.payment_status === "paid" ? "text-green-600" :
                order.payment_status === "failed" ? "text-red-600" :
                "text-amber-600"
              }`}>
                {order.payment_method === "bank_transfer" && order.payment_status === "pending_transfer" && receiptUploaded
                  ? "Receipt Submitted - Pending Verification"
                  : (PAYMENT_STATUS_LABEL[order.payment_status] ?? order.payment_status.replace(/_/g, " "))}
              </p>
            )}
          </div>
        </div>

        {/* Items table */}
        <table className="w-full text-sm font-body mb-6">
          <thead>
            <tr className="bg-blush-light text-ink-light text-xs uppercase tracking-wider">
              <th className="text-left px-3 py-2 rounded-l-lg">Item</th>
              <th className="text-right px-3 py-2">Qty</th>
              <th className="text-right px-3 py-2">Unit Price</th>
              <th className="text-right px-3 py-2 rounded-r-lg">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item, i) => {
              const snap = item.product_snapshot;
              const c = item.customization;
              const details: string[] = [snap.sizeName];
              if (snap.flavorName) details.push(snap.flavorName);
              if (snap.tierName) details.push(snap.tierName);
              if (c.eggless) details.push("Eggless");
              if (c.vegan) details.push("Vegan");
              if (c.gluten_free) details.push("Gluten Free");
              if (c.message) details.push(`Message: "${c.message}"`);
              if (c.color_theme) details.push(`Colour: ${c.color_theme}`);
              if (c.special_instructions) details.push(`Note: ${c.special_instructions}`);

              return (
                <Fragment key={item.id}>
                  <tr className={i % 2 === 1 ? "bg-cream/50" : ""}>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-ink">{snap.name}</p>
                      <p className="text-xs text-ink-light mt-0.5">{details.join(" · ")}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right align-top">{c.quantity}</td>
                    <td className="px-3 py-2.5 text-right align-top">{formatCurrency(parseFloat(item.unit_price))}</td>
                    <td className="px-3 py-2.5 text-right align-top font-medium">{formatCurrency(parseFloat(item.line_total))}</td>
                  </tr>
                  {snap.priceBreakdown && snap.priceBreakdown.length > 0 && (
                    <tr className={i % 2 === 1 ? "bg-cream/50" : ""}>
                      <td colSpan={4} className="px-3 pb-3 pt-0">
                        <div className="pl-3 border-l-2 border-blush space-y-0.5">
                          {snap.priceBreakdown.map((line, j) => (
                            <div key={j} className="flex justify-between text-xs text-ink-light">
                              <span>{line.label}</span>
                              <span>{j === 0 ? formatCurrency(line.amount) : `+${formatCurrency(line.amount)}`}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="ml-auto w-64 space-y-1.5 text-sm font-body">
          <div className="flex justify-between">
            <span className="text-ink-light">Subtotal</span>
            <span>{formatCurrency(parseFloat(order.subtotal))}</span>
          </div>
          {parseFloat(order.delivery_fee) > 0 && (
            <div className="flex justify-between">
              <span className="text-ink-light">Delivery</span>
              <span>{formatCurrency(parseFloat(order.delivery_fee))}</span>
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
          <div className="flex justify-between font-semibold text-base pt-2 border-t-2 border-wine">
            <span className="font-display text-ink">Total</span>
            <span className="font-display text-wine">{formatCurrency(parseFloat(order.total))}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-5 border-t border-border text-center text-xs text-ink-light font-body">
          <p>Thank you for choosing {brand.name}!</p>
          <p className="mt-0.5">Questions? Contact us at {brand.email} or {brand.phone}</p>
        </div>
      </div>
    </>
  );
}
