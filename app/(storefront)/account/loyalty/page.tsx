import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Gift, TrendingUp, ArrowDownLeft, ArrowUpRight, Sparkles, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatInTimeZone } from "date-fns-tz";

const TZ = "Asia/Colombo";
import type { Database, LoyaltyTransactionType } from "@/types/database";

export const metadata: Metadata = { title: "Loyalty Points" };

type LoyaltyRow = Database["public"]["Tables"]["loyalty_transactions"]["Row"];

const TYPE_CONFIG: Record<LoyaltyTransactionType, { label: string; icon: LucideIcon }> = {
  earn:   { label: "Earned",   icon: TrendingUp },
  redeem: { label: "Redeemed", icon: ArrowUpRight },
  bonus:  { label: "Bonus",    icon: Sparkles },
  expire: { label: "Expired",  icon: ArrowDownLeft },
  adjust: { label: "Adjusted", icon: ArrowDownLeft },
};

const EARN_RATE = 100;
const REDEEM_RATE = 10;

export default async function LoyaltyPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const admin = createAdminClient();

  const [userResult, txResult] = await Promise.all([
    admin.from("users").select("loyalty_points").eq("id", authUser.id).single(),
    admin
      .from("loyalty_transactions")
      .select("*")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const loyaltyPoints = (userResult.data as { loyalty_points: number } | null)?.loyalty_points ?? 0;
  const transactions = (txResult.data as unknown as LoyaltyRow[]) ?? [];
  const pointsValue = (loyaltyPoints * REDEEM_RATE) / 100;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">Loyalty Points</h1>
        <p className="body-base text-ink-light mt-1">Earn points on every order and redeem at checkout.</p>
      </div>

      {/* Balance card */}
      <div className="rounded-2xl bg-gradient-to-br from-wine to-wine/80 text-cream p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" aria-hidden="true" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-cream/70 text-sm font-body mb-1">Your Balance</p>
              <p className="font-display text-5xl font-semibold">{loyaltyPoints.toLocaleString()}</p>
              <p className="text-cream/70 text-sm font-body mt-1">points</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Gift className="w-6 h-6" aria-hidden="true" />
            </div>
          </div>
          <div className="border-t border-white/20 pt-4">
            <p className="text-sm font-body">
              Worth{" "}
              <span className="font-semibold">
                Rs. {pointsValue.toFixed(2)}
              </span>{" "}
              in discounts
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <h2 className="font-display text-base font-semibold text-ink mb-4">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-3">
            <div className="w-10 h-10 rounded-full bg-blush flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-5 h-5 text-wine" aria-hidden="true" />
            </div>
            <p className="font-body font-medium text-ink text-sm">Earn Points</p>
            <p className="text-xs text-ink-light font-body mt-1">
              Get 1 point for every Rs. {EARN_RATE} spent on delivered orders.
            </p>
          </div>
          <div className="text-center p-3">
            <div className="w-10 h-10 rounded-full bg-champagne/40 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-5 h-5 text-wine" aria-hidden="true" />
            </div>
            <p className="font-body font-medium text-ink text-sm">Bonus Points</p>
            <p className="text-xs text-ink-light font-body mt-1">
              Earn extra points for first orders, reviews, and special occasions.
            </p>
          </div>
          <div className="text-center p-3">
            <div className="w-10 h-10 rounded-full bg-rose-light/40 flex items-center justify-center mx-auto mb-3">
              <Gift className="w-5 h-5 text-wine" aria-hidden="true" />
            </div>
            <p className="font-body font-medium text-ink text-sm">Redeem</p>
            <p className="text-xs text-ink-light font-body mt-1">
              {REDEEM_RATE} points = Rs. 1 discount. Redeem at checkout.
            </p>
          </div>
        </div>
        <p className="text-xs text-ink-light font-body mt-3 pt-3 border-t border-border text-center">
          Points expire 12 months after they are earned.
        </p>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="font-display text-lg font-semibold text-ink mb-4">Transaction History</h2>
        {transactions.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Gift className="w-10 h-10 text-blush mx-auto mb-3 stroke-1" aria-hidden="true" />
            <p className="text-sm text-ink-light font-body">No transactions yet.</p>
            <p className="text-xs text-ink-light font-body mt-1">
              Start ordering to earn your first points!
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {transactions.map((tx) => {
                const config = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.adjust;
                const isPositive = tx.points > 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isPositive ? "bg-green-50" : "bg-red-50"
                        }`}
                      >
                        {(() => { const Icon = config.icon; return (
                          <Icon
                            className={`w-4 h-4 ${isPositive ? "text-green-600" : "text-red-500"}`}
                            aria-hidden="true"
                          />
                        ); })()}
                      </div>
                      <div>
                        <p className="text-sm font-body font-medium text-ink">{config.label}</p>
                        {tx.note && (
                          <p className="text-xs text-ink-light font-body">{tx.note}</p>
                        )}
                        <p className="text-xs text-ink-light font-body">
                          {formatInTimeZone(new Date(tx.created_at), TZ, "d MMM yyyy")}
                          {tx.expires_at && isPositive && (
                            <> · Expires {formatInTimeZone(new Date(tx.expires_at), TZ, "d MMM yyyy")}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-body font-semibold text-sm ${
                          isPositive ? "text-green-700" : "text-red-600"
                        }`}
                      >
                        {isPositive ? "+" : ""}{tx.points.toLocaleString()} pts
                      </p>
                      <p className="text-xs text-ink-light font-body">
                        Balance: {tx.balance_after.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
