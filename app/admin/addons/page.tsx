import { createAdminClient } from "@/lib/supabase/admin";
import { AddonsClient } from "./AddonsClient";
import { AdminPageHeader } from "@/components/admin/AdminCard";
import type { AddonRow } from "@/types/database";

export default async function AddonsPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("addons").select("*").order("name");
  return (
    <div>
      <AdminPageHeader title="Add-Ons Library" subtitle="Manage global add-ons" />
      <AddonsClient addons={(data ?? []) as AddonRow[]} />
    </div>
  );
}
