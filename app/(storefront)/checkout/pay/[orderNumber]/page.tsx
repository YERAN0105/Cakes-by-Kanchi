import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCheckoutParams, getPayHereCheckoutUrl } from "@/lib/payments/payhere";
import { brand } from "@/lib/brand";
import type { Database } from "@/types/database";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

interface Props {
  params: Promise<{ orderNumber: string }>;
}

export default async function PayHereRedirectPage({ params }: Props) {
  const { orderNumber } = await params;
  const admin = createAdminClient();

  const { data: rawOrder } = await admin
    .from("orders")
    .select("*, order_items(product_snapshot, quantity)")
    .eq("order_number", orderNumber)
    .single();

  if (!rawOrder) notFound();

  const order = rawOrder as unknown as OrderRow & {
    order_items: { product_snapshot: { name: string }; quantity: number }[];
  };

  if (order.payment_method !== "payhere") {
    redirect(`/order-success/${orderNumber}`);
  }

  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

  if (!merchantId || !merchantSecret) {
    redirect(`/order-success/${orderNumber}?payment=unconfigured`);
  }

  const itemName = order.order_items
    .map((i) => `${i.product_snapshot.name} x${i.quantity}`)
    .join(", ")
    .slice(0, 200);

  const addressSnapshot = order.address_snapshot as {
    recipient?: string;
    line1?: string;
    city?: string;
  } | null;

  const checkoutParams = generateCheckoutParams({
    orderNumber: order.order_number,
    total: parseFloat(order.total),
    contactName: addressSnapshot?.recipient ?? "Customer",
    email: order.guest_email ?? "",
    phone: order.guest_phone ?? "",
    address: addressSnapshot?.line1 ?? brand.address.line1,
    city: addressSnapshot?.city ?? brand.address.city,
    itemName,
  });

  if (!checkoutParams) {
    redirect(`/order-success/${orderNumber}?payment=unconfigured`);
  }

  const checkoutUrl = getPayHereCheckoutUrl();

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-6 p-6">
      <div className="max-w-sm w-full space-y-4 text-center">
        <div className="w-14 h-14 rounded-full bg-blush-light flex items-center justify-center mx-auto">
          <span className="text-2xl" role="img" aria-label="Redirecting">
            🔒
          </span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">Redirecting to PayHere…</h1>
        <p className="font-body text-ink-light text-sm">
          You will be redirected to PayHere&apos;s secure payment page. Do not close this window.
        </p>
      </div>

      {/* Auto-submit form to PayHere */}
      <form id="payhere-form" method="POST" action={checkoutUrl} className="hidden">
        {Object.entries(checkoutParams).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      </form>

      <button form="payhere-form" type="submit" className="btn-primary px-8 py-3">
        Continue to Payment
      </button>

      {/* Auto-submit script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){document.getElementById('payhere-form').submit();},800);});`,
        }}
      />
    </div>
  );
}
