import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminCard";
import { OrdersPageClient } from "./OrdersPageClient";
import type { OrderRow } from "./OrdersTableClient";
import type { ScheduleOrder } from "./BakingScheduleClient";
import type { OrderStatus } from "@/types/database";

const ACTIVE_STATUSES: OrderStatus[] = ["pending_confirmation", "confirmed", "in_preparation"];

export default async function OrdersPage() {
  const admin = createAdminClient();

  const [allRes, scheduleRes] = await Promise.all([
    admin
      .from("orders")
      .select(
        "id, order_number, status, payment_status, payment_method, fulfillment_type, total, created_at, delivery_date, user_id, guest_email, guest_phone, users(name, phone)"
      )
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("orders")
      .select(
        "id, order_number, status, delivery_date, fulfillment_type, guest_phone, users(name, phone), time_slots(label), order_items(product_snapshot, customization, quantity)"
      )
      .in("status", ACTIVE_STATUSES)
      .order("delivery_date", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const orders = (allRes.data ?? []) as unknown as OrderRow[];
  const scheduleOrders = (scheduleRes.data ?? []) as unknown as ScheduleOrder[];

  return (
    <div>
      <AdminPageHeader title="Orders" subtitle={`${orders.length} orders total`} />
      <OrdersPageClient orders={orders} scheduleOrders={scheduleOrders} />
    </div>
  );
}
