import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminCard";
import { CustomersTableClient } from "./CustomersTableClient";

export default async function CustomersPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("users")
    .select("id, name, email, phone, role, loyalty_points, blocked, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  // Get order counts per user
  const userIds = (data ?? []).map((u) => (u as { id: string }).id);
  const { data: orderStats } = userIds.length
    ? await admin
        .from("orders")
        .select("user_id, total")
        .in("user_id", userIds)
        .not("status", "eq", "cancelled")
    : { data: [] };

  const statsByUser: Record<string, { count: number; total: number }> = {};
  for (const o of orderStats ?? []) {
    const order = o as { user_id: string; total: string };
    if (!statsByUser[order.user_id]) statsByUser[order.user_id] = { count: 0, total: 0 };
    statsByUser[order.user_id]!.count++;
    statsByUser[order.user_id]!.total += parseFloat(order.total);
  }

  const customers = ((data ?? []) as unknown as {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    loyalty_points: number;
    blocked: boolean;
    created_at: string;
  }[]).map((u) => ({
    ...u,
    orderCount: statsByUser[u.id]?.count ?? 0,
    lifetimeValue: statsByUser[u.id]?.total ?? 0,
  }));

  return (
    <div>
      <AdminPageHeader title="Customers" subtitle={`${customers.length} registered customers`} />
      <CustomersTableClient customers={customers} />
    </div>
  );
}
