import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CheckCircle2, Clock, Calendar, MapPin, CreditCard, Building2, Banknote } from "lucide-react";
import { formatCurrency, brand } from "@/lib/brand";
import { BankReceiptUpload } from "./BankReceiptUpload";
import { Container } from "@/components/shared/Container";
import { format } from "date-fns";
import type { Database, AddressSnapshot } from "@/types/database";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type TimeSlotRow = Database["public"]["Tables"]["time_slots"]["Row"];

interface Props {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<Record<string, string>>;
}

export default async function OrderSuccessPage({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rawOrder } = await admin
    .from("orders")
    .select("*, order_items(*, time_slots(label, start_time, end_time))")
    .eq("order_number", orderNumber)
    .single();

  if (!rawOrder) notFound();

  const order = rawOrder as unknown as OrderRow & {
    order_items: {
      id: string;
      product_snapshot: { name: string; imageUrl: string | null; sizeName: string };
      customization: { quantity: number };
      unit_price: string;
      line_total: string;
    }[];
  };

  // Access control — only the owner or guest with token can view
  if (order.user_id && user?.id !== order.user_id) {
    notFound();
  }

  // Fetch time slot label
  const { data: slotRaw } = order.time_slot_id
    ? await admin.from("time_slots").select("label").eq("id", order.time_slot_id).single()
    : { data: null };

  const slot = slotRaw as unknown as Pick<TimeSlotRow, "label"> | null;

  const paymentUnconfigured = sp.payment === "unconfigured";
  const address = order.address_snapshot as AddressSnapshot | null;

  const deliveryDateFormatted = order.delivery_date
    ? format(new Date(order.delivery_date + "T00:00:00"), "EEEE, d MMMM yyyy")
    : null;

  const paymentMethodLabel = {
    payhere: "Online Payment (PayHere)",
    bank_transfer: "Bank Transfer",
    cod: "Cash on Delivery",
  }[order.payment_method];

  return (
    <Container className="py-12 lg:py-16 max-w-2xl">
      {/* Success header */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-green-600" aria-hidden="true" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-ink mb-2">
          {order.payment_status === "cod"
            ? "Order Placed!"
            : order.payment_status === "pending_transfer"
              ? "Order Received!"
              : "Order Confirmed!"}
        </h1>
        <p className="font-body text-ink-light">
          Thank you for your order. Your order number is{" "}
          <span className="font-semibold text-wine font-mono">{order.order_number}</span>.
        </p>
      </div>

      {/* Status message */}
      <div className="rounded-xl border border-border bg-blush-light/60 p-4 mb-6 text-sm font-body text-ink space-y-1">
        {order.payment_method === "payhere" && order.payment_status === "paid" && (
          <p>✅ Payment received. We&apos;re preparing your order.</p>
        )}
        {order.payment_method === "payhere" &&
          order.payment_status === "pending" &&
          !paymentUnconfigured && (
            <p>
              ⏳ Awaiting payment confirmation from PayHere. This usually takes a few moments.
            </p>
          )}
        {paymentUnconfigured && (
          <p>
            ⚠️ Online payment is not configured yet. Please use bank transfer or contact us to pay.
          </p>
        )}
        {order.payment_method === "bank_transfer" && (
          <p>
            📋 Please complete your bank transfer and upload the receipt below. Your order will be
            confirmed after we verify payment.
          </p>
        )}
        {order.payment_method === "cod" && (
          <p>
            📞 Our team will confirm your order by phone shortly. Payment is collected on delivery.
          </p>
        )}
      </div>

      {/* Order summary */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 mb-6">
        <h2 className="font-display text-lg font-semibold text-ink">Order Details</h2>

        {/* Items */}
        <div className="space-y-3">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm font-body">
              <div>
                <p className="font-medium text-ink">{item.product_snapshot.name}</p>
                <p className="text-ink-light text-xs">
                  {item.product_snapshot.sizeName} × {item.customization.quantity}
                </p>
              </div>
              <p className="font-medium text-wine">{formatCurrency(parseFloat(item.line_total))}</p>
            </div>
          ))}
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-1.5 text-sm font-body">
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
              <span>Loyalty points</span>
              <span>−{formatCurrency(parseFloat(order.loyalty_discount))}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold pt-1 border-t border-border">
            <span className="text-ink">Total paid</span>
            <span className="font-display text-lg text-wine">
              {formatCurrency(parseFloat(order.total))}
            </span>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Delivery / pickup info */}
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
          {order.fulfillment_type === "delivery" && address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-wine mt-0.5 shrink-0" aria-hidden="true" />
              <span className="text-ink">
                {address.recipient}, {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}, {address.city}
              </span>
            </div>
          )}
          {order.fulfillment_type === "pickup" && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-wine mt-0.5 shrink-0" aria-hidden="true" />
              <span className="text-ink">
                Pickup from {brand.address.line1}, {brand.address.line2}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {order.payment_method === "payhere" && (
              <CreditCard className="w-4 h-4 text-wine shrink-0" aria-hidden="true" />
            )}
            {order.payment_method === "bank_transfer" && (
              <Building2 className="w-4 h-4 text-wine shrink-0" aria-hidden="true" />
            )}
            {order.payment_method === "cod" && (
              <Banknote className="w-4 h-4 text-wine shrink-0" aria-hidden="true" />
            )}
            <span className="text-ink">{paymentMethodLabel}</span>
          </div>
        </div>
      </div>

      {/* Bank transfer details */}
      {order.payment_method === "bank_transfer" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 mb-6">
          <h2 className="font-display text-lg font-semibold text-ink">Bank Transfer Details</h2>
          <div className="space-y-2 text-sm font-body bg-blush-light/60 rounded-lg p-4">
            <p>
              <span className="text-ink-light">Bank:</span>{" "}
              <span className="font-medium text-ink">Commercial Bank of Ceylon</span>
            </p>
            <p>
              <span className="text-ink-light">Account name:</span>{" "}
              <span className="font-medium text-ink">{brand.name}</span>
            </p>
            <p>
              <span className="text-ink-light">Account number:</span>{" "}
              <span className="font-medium text-ink font-mono">1234567890</span>
            </p>
            <p>
              <span className="text-ink-light">Branch:</span>{" "}
              <span className="font-medium text-ink">Colombo 03</span>
            </p>
            <p>
              <span className="text-ink-light">Reference:</span>{" "}
              <span className="font-medium text-wine font-mono">{order.order_number}</span>
            </p>
          </div>
          <p className="text-xs text-ink-light">
            Please include your order number as the payment reference. Upload your receipt below
            after completing the transfer.
          </p>
          <BankReceiptUpload orderId={order.id} orderNumber={order.order_number} />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {user && (
          <Link
            href="/account/orders"
            className="btn-primary text-center px-6 py-3"
          >
            View My Orders
          </Link>
        )}
        <Link href="/cakes" className="btn-secondary text-center px-6 py-3">
          Continue Shopping
        </Link>
      </div>
    </Container>
  );
}
