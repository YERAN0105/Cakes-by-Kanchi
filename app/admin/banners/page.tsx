import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminCard";
import { BannersClient } from "./BannersClient";

export default async function BannersPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("banners").select("*").order("display_order");
  return (
    <div>
      <AdminPageHeader title="Banners & Sliders" />
      <BannersClient banners={(data ?? []) as import("./BannersClient").BannerRow[]} />
    </div>
  );
}
