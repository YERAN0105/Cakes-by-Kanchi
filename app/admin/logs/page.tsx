import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminCard";
import { LogsClient } from "./LogsClient";

export default async function LogsPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("activity_logs")
    .select("*, users(name, email)")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div>
      <AdminPageHeader title="Activity Logs" subtitle="All admin write operations" />
      <LogsClient logs={(data ?? []) as unknown as import("./LogsClient").LogRow[]} />
    </div>
  );
}
