import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminCard";
import { DeliveryZonesClient } from "./DeliveryZonesClient";

export default async function DeliveryZonesPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("delivery_zones").select("*").order("name");
  return (
    <div>
      <AdminPageHeader title="Delivery Zones" />
      <DeliveryZonesClient zones={(data ?? []) as import("./DeliveryZonesClient").ZoneRow[]} />
    </div>
  );
}
