import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminCard";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("settings").select("key, value");
  const settings: Record<string, Record<string, unknown>> = {};
  for (const row of data ?? []) {
    const s = row as { key: string; value: unknown };
    settings[s.key] = (s.value as Record<string, unknown>) ?? {};
  }
  return (
    <div>
      <AdminPageHeader title="Settings" />
      <SettingsClient settings={settings} />
    </div>
  );
}
