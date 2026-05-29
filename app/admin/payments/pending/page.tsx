import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminCard";
import { PendingPaymentsClient } from "./PendingPaymentsClient";

export default async function PaymentsPendingPage() {
  const admin = createAdminClient();

  const { data: orders } = await admin
    .from("orders")
    .select("id, order_number, total, created_at, users(name, email, phone), guest_email, guest_phone, bank_transfer_receipts(id, image_url, uploaded_at, status, reject_reason)")
    .eq("payment_status", "pending_transfer")
    .order("created_at", { ascending: false });

  // Generate signed URLs for receipts
  const ordersWithUrls = await Promise.all(
    (orders ?? []).map(async (o) => {
      const order = o as unknown as {
        id: string;
        order_number: string;
        total: string;
        created_at: string;
        users: { name: string; email: string; phone: string | null } | null;
        guest_email: string | null;
        guest_phone: string | null;
        bank_transfer_receipts: { id: string; image_url: string; uploaded_at: string; status: string; reject_reason: string | null }[];
      };
      const receiptsWithUrls = await Promise.all(
        order.bank_transfer_receipts.map(async (r) => {
          const { data } = await admin.storage.from("receipts").createSignedUrl(r.image_url, 3600);
          return { ...r, signedUrl: data?.signedUrl ?? null };
        })
      );
      return { ...order, bank_transfer_receipts: receiptsWithUrls };
    })
  );

  return (
    <div>
      <AdminPageHeader
        title="Payments Pending"
        subtitle={`${ordersWithUrls.filter((o) => o.bank_transfer_receipts.some((r) => r.status === "pending")).length} awaiting review`}
      />
      <PendingPaymentsClient orders={ordersWithUrls as unknown as import("./PendingPaymentsClient").PendingOrder[]} />
    </div>
  );
}
