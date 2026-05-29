import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminCard";
import { ScheduleClient } from "./ScheduleClient";

export default async function SchedulePage() {
  const admin = createAdminClient();
  const [slotsRes, holidaysRes] = await Promise.all([
    admin.from("time_slots").select("*").order("start_time"),
    admin.from("holidays").select("*").order("date"),
  ]);
  return (
    <div>
      <AdminPageHeader title="Schedule" subtitle="Time slots, holidays, and lead times" />
      <ScheduleClient
        slots={(slotsRes.data ?? []) as import("./ScheduleClient").SlotRow[]}
        holidays={(holidaysRes.data ?? []) as import("./ScheduleClient").HolidayRow[]}
      />
    </div>
  );
}
