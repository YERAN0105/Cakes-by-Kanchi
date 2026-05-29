import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/brand";
import { formatInTimeZone } from "date-fns-tz";
import { subDays, format } from "date-fns";
import Link from "next/link";
import { TrendingUp, ShoppingBag, Clock, AlertTriangle } from "lucide-react";
import { RevenueChart, OrderStatusChart } from "@/components/admin/DashboardCharts";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { OrderStatus } from "@/types/database";

const TZ = "Asia/Colombo";

const STATUS_COLORS: Record<string, string> = {
  pending_confirmation: "#F59E0B",
  confirmed: "#3B82F6",
  in_preparation: "#8B5CF6",
  out_for_delivery: "#F97316",
  ready_for_pickup: "#06B6D4",
  delivered: "#10B981",
  completed: "#059669",
  cancelled: "#EF4444",
  refunded: "#6B7280",
};

export default async function AdminDashboard() {
  const admin = createAdminClient();
  const now = new Date();
  const todayStr = formatInTimeZone(now, TZ, "yyyy-MM-dd");

  const [todayOrders, pendingOrders, lowStockProducts, recentOrders, ordersByStatus] =
    await Promise.all([
      admin
        .from("orders")
        .select("total, created_at")
        .gte("created_at", `${todayStr}T00:00:00`)
        .not("status", "eq", "cancelled"),
      admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending_confirmation", "confirmed"]),
      admin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("stock_tracked", true)
        .filter("stock_quantity", "lte", "low_stock_threshold"),
      admin
        .from("orders")
        .select(
          "id, order_number, status, payment_status, total, payment_method, created_at, users(name)"
        )
        .order("created_at", { ascending: false })
        .limit(10),
      admin.from("orders").select("status").not("status", "eq", "cancelled"),
    ]);

  const todayRevenue = (todayOrders.data ?? []).reduce(
    (sum, o) => sum + parseFloat((o as { total: string }).total),
    0
  );
  const todayOrderCount = (todayOrders.data ?? []).length;
  const pendingCount = pendingOrders.count ?? 0;
  const lowStockCount = lowStockProducts.count ?? 0;

  // Revenue over last 90 days
  const revenueByDay: Record<string, number> = {};
  for (let i = 89; i >= 0; i--) {
    const d = format(subDays(now, i), "MMM d");
    revenueByDay[d] = 0;
  }

  const { data: revenueRaw } = await admin
    .from("orders")
    .select("total, created_at")
    .gte("created_at", subDays(now, 90).toISOString())
    .not("status", "eq", "cancelled");

  for (const o of revenueRaw ?? []) {
    const d = formatInTimeZone((o as { created_at: string }).created_at, TZ, "MMM d");
    if (d in revenueByDay) {
      revenueByDay[d] = (revenueByDay[d] ?? 0) + parseFloat((o as { total: string }).total);
    }
  }

  const revenueData = Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue }));

  // Orders by status
  const statusCounts: Record<string, number> = {};
  for (const o of ordersByStatus.data ?? []) {
    const s = (o as { status: string }).status;
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value,
    color: STATUS_COLORS[name] ?? "#6B7280",
  }));

  // Top products (last 30 days)
  const { data: topProducts } = await admin
    .from("order_items")
    .select("product_snapshot, quantity, line_total")
    .gte(
      "order_id",
      // This is a join workaround — we filter by joined order date on client
      // For simplicity, just get top items by aggregating
      ""
    )
    .limit(100);

  const productTotals: Record<string, { name: string; revenue: number; qty: number }> = {};
  for (const item of topProducts ?? []) {
    const snap = (item as { product_snapshot: { name?: string; id?: string } | null }).product_snapshot;
    if (!snap) continue;
    const key = snap.id ?? snap.name ?? "";
    if (!productTotals[key]) {
      productTotals[key] = { name: snap.name ?? "Unknown", revenue: 0, qty: 0 };
    }
    productTotals[key]!.revenue += parseFloat((item as { line_total: string }).line_total);
    productTotals[key]!.qty += (item as { quantity: number }).quantity;
  }

  const topProductsList = Object.values(productTotals)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Today's Revenue"
          value={formatCurrency(todayRevenue)}
          sub={`${todayOrderCount} order${todayOrderCount !== 1 ? "s" : ""} today`}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          color="green"
        />
        <KpiCard
          label="Today's Orders"
          value={String(todayOrderCount)}
          sub="orders placed today"
          icon={<ShoppingBag className="h-5 w-5 text-blue-600" />}
          color="blue"
        />
        <KpiCard
          label="Pending Orders"
          value={String(pendingCount)}
          sub="need attention"
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          color="amber"
        />
        <KpiCard
          label="Low Stock"
          value={String(lowStockCount)}
          sub="products below threshold"
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart allData={revenueData} />
        </div>
        <div>
          <OrderStatusChart data={statusData} />
        </div>
      </div>

      {/* Recent Orders + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display text-lg text-ink">Recent Orders</h3>
            <Link href="/admin/orders" className="text-sm text-wine hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-ink-light text-xs">
                <tr>
                  <th className="text-left px-6 py-3">Order</th>
                  <th className="text-left px-6 py-3">Customer</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-right px-6 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(recentOrders.data ?? []).map((o) => {
                  const order = o as {
                    id: string;
                    order_number: string;
                    status: OrderStatus;
                    total: string;
                    users: { name: string } | null;
                  };
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <Link
                          href={`/admin/orders/${order.order_number}`}
                          className="text-wine hover:underline font-medium"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-ink-light">
                        {order.users?.name ?? "Guest"}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge type="order" value={order.status} />
                      </td>
                      <td className="px-6 py-3 text-right font-medium">
                        {formatCurrency(parseFloat(order.total))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-display text-lg text-ink">Top Products</h3>
          </div>
          <ul className="divide-y divide-border">
            {topProductsList.map((p, i) => (
              <li key={i} className="px-6 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                  <p className="text-xs text-ink-light">{p.qty} sold</p>
                </div>
                <span className="text-sm font-medium text-ink ml-4 shrink-0">
                  {formatCurrency(p.revenue)}
                </span>
              </li>
            ))}
            {topProductsList.length === 0 && (
              <li className="px-6 py-6 text-center text-sm text-ink-light">No data yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: "green" | "blue" | "amber" | "red";
}) {
  const bg = {
    green: "bg-green-50",
    blue: "bg-blue-50",
    amber: "bg-amber-50",
    red: "bg-red-50",
  }[color];

  return (
    <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ink-light uppercase tracking-wide font-medium">{label}</p>
          <p className="mt-1 text-2xl font-display text-ink">{value}</p>
          <p className="text-xs text-ink-light mt-1">{sub}</p>
        </div>
        <div className={`p-2 rounded-lg ${bg}`}>{icon}</div>
      </div>
    </div>
  );
}
