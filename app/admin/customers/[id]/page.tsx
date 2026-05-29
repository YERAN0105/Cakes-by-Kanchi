import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { formatCurrency } from "@/lib/brand";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CustomerDetailClient } from "./CustomerDetailClient";
import type { OrderStatus } from "@/types/database";

const TZ = "Asia/Colombo";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  const [userRes, ordersRes, loyaltyRes] = await Promise.all([
    admin.from("users").select("*").eq("id", id).single(),
    admin.from("orders").select("id, order_number, status, total, created_at, payment_method").eq("user_id", id).order("created_at", { ascending: false }),
    admin.from("loyalty_transactions").select("*").eq("user_id", id).order("created_at", { ascending: false }),
  ]);

  if (!userRes.data) notFound();

  const user = userRes.data as {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    loyalty_points: number;
    blocked: boolean;
    created_at: string;
  };

  const orders = (ordersRes.data ?? []) as unknown as {
    id: string;
    order_number: string;
    status: OrderStatus;
    total: string;
    created_at: string;
    payment_method: string;
  }[];

  const loyaltyTxs = (loyaltyRes.data ?? []) as unknown as {
    id: string;
    type: string;
    points: number;
    balance_after: number;
    note: string | null;
    created_at: string;
  }[];

  const totalSpent = orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + parseFloat(o.total), 0);
  const aov = orders.length ? totalSpent / orders.length : 0;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin/customers" className="text-sm text-ink-light hover:text-ink">← Customers</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Orders tab */}
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-display text-lg text-ink">Orders ({orders.length})</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-ink-light border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3">Order #</th>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-right px-6 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <Link href={`/admin/orders/${o.order_number}`} className="text-wine hover:underline font-medium">{o.order_number}</Link>
                    </td>
                    <td className="px-6 py-3 text-ink-light">{formatInTimeZone(o.created_at, TZ, "d MMM yyyy")}</td>
                    <td className="px-6 py-3"><StatusBadge type="order" value={o.status} /></td>
                    <td className="px-6 py-3 text-right font-medium">{formatCurrency(parseFloat(o.total))}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-ink-light">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Loyalty transactions */}
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-display text-lg text-ink">Loyalty Transactions</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-ink-light border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-6 py-3">Type</th>
                  <th className="text-left px-6 py-3">Note</th>
                  <th className="text-right px-6 py-3">Points</th>
                  <th className="text-right px-6 py-3">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loyaltyTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-ink-light">{formatInTimeZone(tx.created_at, TZ, "d MMM yyyy")}</td>
                    <td className="px-6 py-3 capitalize">{tx.type}</td>
                    <td className="px-6 py-3 text-ink-light text-xs">{tx.note ?? "—"}</td>
                    <td className={`px-6 py-3 text-right font-medium ${tx.points > 0 ? "text-green-700" : "text-red-600"}`}>
                      {tx.points > 0 ? "+" : ""}{tx.points}
                    </td>
                    <td className="px-6 py-3 text-right text-ink-light">{tx.balance_after}</td>
                  </tr>
                ))}
                {loyaltyTxs.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-ink-light">No transactions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          {/* Profile */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <h3 className="font-display text-base text-ink mb-3">Profile</h3>
            <p className="font-medium text-ink">{user.name}</p>
            <p className="text-sm text-ink-light">{user.email}</p>
            <p className="text-sm text-ink-light">{user.phone ?? "No phone"}</p>
            <p className="text-xs text-ink-light mt-2">Joined {formatInTimeZone(user.created_at, TZ, "d MMMM yyyy")}</p>
          </div>

          {/* KPIs */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <h3 className="font-display text-base text-ink mb-3">Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink-light">Total Orders</span><span className="font-medium">{orders.length}</span></div>
              <div className="flex justify-between"><span className="text-ink-light">Lifetime Value</span><span className="font-medium">{formatCurrency(totalSpent)}</span></div>
              <div className="flex justify-between"><span className="text-ink-light">Avg Order</span><span className="font-medium">{formatCurrency(aov)}</span></div>
              <div className="flex justify-between"><span className="text-ink-light">Loyalty Points</span><span className="font-medium text-wine">{user.loyalty_points}</span></div>
            </div>
          </div>

          {/* Actions */}
          <CustomerDetailClient userId={user.id} blocked={user.blocked} />
        </div>
      </div>
    </div>
  );
}
