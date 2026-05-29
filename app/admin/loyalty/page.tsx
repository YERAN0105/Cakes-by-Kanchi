import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminCard";
import { LoyaltySettingsClient } from "./LoyaltySettingsClient";

export default async function LoyaltyPage() {
  const admin = createAdminClient();
  const { data: settingsRow } = await admin.from("settings").select("value").eq("key", "loyalty").maybeSingle();
  const settings = (settingsRow?.value ?? {}) as Record<string, number>;

  const { data: stats } = await admin.from("loyalty_transactions").select("type, points");
  let totalEarned = 0, totalRedeemed = 0, totalExpired = 0;
  for (const tx of stats ?? []) {
    const t = tx as { type: string; points: number };
    if (t.type === "earn" || t.type === "bonus") totalEarned += t.points;
    if (t.type === "redeem") totalRedeemed += Math.abs(t.points);
    if (t.type === "expire") totalExpired += Math.abs(t.points);
  }

  return (
    <div>
      <AdminPageHeader title="Loyalty Settings" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Points Issued", value: totalEarned.toLocaleString() },
          { label: "Total Points Redeemed", value: totalRedeemed.toLocaleString() },
          { label: "Total Points Expired", value: totalExpired.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-ink-light uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-display text-ink mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      <LoyaltySettingsClient
        defaults={{
          earn_rate: settings.earn_rate ?? 100,
          redemption_rate: settings.redemption_rate ?? 50,
          max_redemption_percent: settings.max_redemption_percent ?? 20,
          welcome_bonus: settings.welcome_bonus ?? 0,
          birthday_bonus: settings.birthday_bonus ?? 0,
          review_bonus: settings.review_bonus ?? 0,
          expiry_months: settings.expiry_months ?? 12,
        }}
      />
    </div>
  );
}
