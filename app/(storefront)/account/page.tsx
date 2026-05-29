import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Heart, Gift, ArrowRight, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/brand";
import { formatInTimeZone } from "date-fns-tz";

const TZ = "Asia/Colombo";
import type { Database } from "@/types/database";
import { OrderStatusBadge } from "@/components/storefront/account/OrderStatusBadge";

export const metadata: Metadata = { title: "My Account" };

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

export default async function AccountDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const admin = createAdminClient();

  const [profileResult, ordersResult, wishlistResult] = await Promise.all([
    admin.from("users").select("name, loyalty_points").eq("id", authUser.id).single(),
    admin
      .from("orders")
      .select("id, order_number, status, total, created_at, order_items(id)")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(1),
    admin
      .from("wishlist")
      .select("product_id", { count: "exact", head: true })
      .eq("user_id", authUser.id),
  ]);

  const profile = profileResult.data as { name: string; loyalty_points: number } | null;
  const firstName = (profile?.name ?? "").split(" ")[0] || "there";
  const loyaltyPoints = profile?.loyalty_points ?? 0;

  const { count: totalOrders } = await admin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", authUser.id);

  const wishlistCount = wishlistResult.count ?? 0;
  const latestOrder = (ordersResult.data?.[0] as unknown as (OrderRow & { order_items: { id: string }[] })) ?? null;

  const STATUS_LABELS: Record<string, string> = {
    pending_confirmation: "Awaiting Confirmation",
    confirmed: "Confirmed",
    in_preparation: "Baking",
    out_for_delivery: "Out for Delivery",
    ready_for_pickup: "Ready for Pickup",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };

  return (
    <div>
      {/* Welcome banner */}
      <div className="mb-8">
        <p className="label-small text-wine mb-1">Welcome back</p>
        <h1 className="font-display text-3xl lg:text-4xl text-ink font-semibold">
          Hello, {firstName}
        </h1>
        <p className="body-base text-ink-light mt-1">Manage your orders, addresses, and more.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/account/orders"
          className="group rounded-xl border border-border bg-card p-5 hover:border-wine/40 hover:shadow-sm transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blush flex items-center justify-center">
              <Package className="w-5 h-5 text-wine" aria-hidden="true" />
            </div>
            <ArrowRight className="w-4 h-4 text-ink-light group-hover:text-wine transition-colors" aria-hidden="true" />
          </div>
          <p className="font-display text-2xl font-semibold text-ink">{totalOrders ?? 0}</p>
          <p className="text-sm text-ink-light font-body mt-0.5">Total Orders</p>
        </Link>

        <Link
          href="/account/loyalty"
          className="group rounded-xl border border-border bg-card p-5 hover:border-wine/40 hover:shadow-sm transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-champagne/40 flex items-center justify-center">
              <Gift className="w-5 h-5 text-wine" aria-hidden="true" />
            </div>
            <ArrowRight className="w-4 h-4 text-ink-light group-hover:text-wine transition-colors" aria-hidden="true" />
          </div>
          <p className="font-display text-2xl font-semibold text-ink">{loyaltyPoints.toLocaleString()}</p>
          <p className="text-sm text-ink-light font-body mt-0.5">Loyalty Points</p>
        </Link>

        <Link
          href="/account/wishlist"
          className="group rounded-xl border border-border bg-card p-5 hover:border-wine/40 hover:shadow-sm transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-rose-light/40 flex items-center justify-center">
              <Heart className="w-5 h-5 text-wine" aria-hidden="true" />
            </div>
            <ArrowRight className="w-4 h-4 text-ink-light group-hover:text-wine transition-colors" aria-hidden="true" />
          </div>
          <p className="font-display text-2xl font-semibold text-ink">{wishlistCount}</p>
          <p className="text-sm text-ink-light font-body mt-0.5">Wishlist Items</p>
        </Link>
      </div>

      {/* Recent order */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-ink">Recent Order</h2>
          <Link href="/account/orders" className="text-sm font-body text-wine hover:text-wine/80 transition-colors">
            View all
          </Link>
        </div>

        {latestOrder ? (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-sm font-semibold text-ink">{latestOrder.order_number}</span>
                  <OrderStatusBadge status={latestOrder.status} />
                </div>
                <p className="text-sm text-ink-light font-body">
                  {latestOrder.order_items.length} item{latestOrder.order_items.length !== 1 ? "s" : ""} ·{" "}
                  {formatCurrency(parseFloat(latestOrder.total))} ·{" "}
                  {formatInTimeZone(new Date(latestOrder.created_at), TZ, "d MMM yyyy")}
                </p>
                <p className="text-xs text-ink-light font-body mt-0.5 capitalize">
                  {STATUS_LABELS[latestOrder.status] ?? latestOrder.status}
                </p>
              </div>
              <Link
                href={`/account/orders/${latestOrder.order_number}`}
                className="btn-secondary text-sm px-4 py-2 shrink-0"
              >
                View Details
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <ShoppingBag className="w-10 h-10 text-blush mx-auto mb-3 stroke-1" aria-hidden="true" />
            <p className="font-body text-ink-light">You haven&apos;t placed any orders yet.</p>
            <Link href="/cakes" className="btn-primary mt-4 inline-block px-6 py-2.5 text-sm">
              Start Shopping
            </Link>
          </div>
        )}
      </div>

      {/* Continue shopping CTA */}
      <div className="rounded-xl border border-champagne/50 bg-champagne/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-display text-base font-semibold text-ink">Ready to order something special?</p>
          <p className="text-sm text-ink-light font-body mt-0.5">Browse our handcrafted cakes and pastries.</p>
        </div>
        <Link href="/cakes" className="btn-primary shrink-0 px-5 py-2.5 text-sm">
          Browse Cakes
        </Link>
      </div>
    </div>
  );
}
