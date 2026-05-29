import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminCard";
import { CouponsClient } from "./CouponsClient";

export default async function CouponsPage() {
  const admin = createAdminClient();
  const { data: coupons } = await admin.from("coupons").select("*").order("created_at", { ascending: false });
  const { data: usageCounts } = await admin.from("coupon_usage").select("coupon_id");
  const usageMap: Record<string, number> = {};
  for (const u of usageCounts ?? []) {
    const usage = u as { coupon_id: string };
    usageMap[usage.coupon_id] = (usageMap[usage.coupon_id] ?? 0) + 1;
  }
  const couponsWithUsage = (coupons ?? []).map((c) => ({ ...(c as object), usageCount: usageMap[(c as { id: string }).id] ?? 0 }));
  return (
    <div>
      <AdminPageHeader title="Coupons" />
      <CouponsClient coupons={couponsWithUsage as import("./CouponsClient").CouponWithUsage[]} />
    </div>
  );
}
