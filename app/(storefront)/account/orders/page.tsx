import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/brand";
import { formatInTimeZone } from "date-fns-tz";

const TZ = "Asia/Colombo";
import { OrderStatusBadge } from "@/components/storefront/account/OrderStatusBadge";
import type { Database, OrderStatus } from "@/types/database";

export const metadata: Metadata = { title: "My Orders" };

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

const STATUSES: { value: string; label: string }[] = [
  { value: "all", label: "All Orders" },
  { value: "pending_confirmation", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_preparation", label: "Baking" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<Record<string, string>>;
}

export default async function OrdersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const admin = createAdminClient();

  const statusFilter = sp.status && sp.status !== "all" ? sp.status : null;
  const search = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  let query = admin
    .from("orders")
    .select("id, order_number, status, total, created_at, order_items(id, product_snapshot)", {
      count: "exact",
    })
    .eq("user_id", authUser.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (statusFilter) query = query.eq("status", statusFilter as OrderStatus);
  if (search) query = query.ilike("order_number", `%${search}%`);

  const { data: rawOrders, count } = await query;

  type OrderWithItems = OrderRow & {
    order_items: { id: string; product_snapshot: { name: string; imageUrl: string | null } }[];
  };

  const orders = (rawOrders as unknown as OrderWithItems[]) ?? [];
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const buildUrl = (params: Record<string, string>) => {
    const merged = { status: sp.status ?? "all", q: sp.q ?? "", page: sp.page ?? "1", ...params };
    const qs = new URLSearchParams(
      Object.entries(merged).filter(([, v]) => v && v !== "all" && v !== "1")
    ).toString();
    return `/account/orders${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">My Orders</h1>
        <p className="body-base text-ink-light mt-1">Track and manage your orders.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <form method="GET" action="/account/orders" className="flex-1 flex gap-2">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search order number…"
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-body text-ink placeholder:text-ink-light/60 focus:outline-none focus:ring-2 focus:ring-wine/30"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-wine text-cream text-sm font-body font-medium hover:bg-wine/90 transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Status tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map(({ value, label }) => (
            <Link
              key={value}
              href={buildUrl({ status: value, page: "1" })}
              className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium font-body transition-colors whitespace-nowrap ${
                (sp.status ?? "all") === value
                  ? "bg-wine text-cream"
                  : "bg-card border border-border text-ink hover:border-wine/40 hover:text-wine"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Package className="w-12 h-12 text-blush mx-auto mb-4 stroke-1" aria-hidden="true" />
          <p className="font-display text-xl text-ink mb-1">No orders found</p>
          <p className="text-sm text-ink-light font-body mb-5">
            {search || statusFilter ? "Try adjusting your filters." : "You haven't placed any orders yet."}
          </p>
          <Link href="/cakes" className="btn-primary px-6 py-2.5 text-sm">
            Browse Cakes
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-border bg-card p-5 hover:border-wine/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-mono text-sm font-semibold text-ink">{order.order_number}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-ink-light font-body">
                    {order.order_items.length} item{order.order_items.length !== 1 ? "s" : ""} ·{" "}
                    <span className="font-medium text-ink">{formatCurrency(parseFloat(order.total))}</span>
                  </p>
                  <p className="text-xs text-ink-light font-body mt-0.5">
                    Placed {formatInTimeZone(new Date(order.created_at), TZ, "d MMM yyyy")}
                  </p>
                  {/* Item names preview */}
                  <p className="text-xs text-ink-light font-body mt-1 truncate">
                    {order.order_items
                      .slice(0, 3)
                      .map((i) => i.product_snapshot.name)
                      .join(", ")}
                    {order.order_items.length > 3 && ` +${order.order_items.length - 3} more`}
                  </p>
                </div>
                <Link
                  href={`/account/orders/${order.order_number}`}
                  className="btn-secondary text-sm px-4 py-2 shrink-0"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link href={buildUrl({ page: String(page - 1) })} className="px-4 py-2 text-sm font-body border border-border rounded-lg hover:border-wine/40 hover:text-wine transition-colors">
              Previous
            </Link>
          )}
          <span className="text-sm font-body text-ink-light px-2">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={buildUrl({ page: String(page + 1) })} className="px-4 py-2 text-sm font-body border border-border rounded-lg hover:border-wine/40 hover:text-wine transition-colors">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
