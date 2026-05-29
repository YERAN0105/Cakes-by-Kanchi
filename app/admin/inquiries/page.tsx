import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminCard";
import { InquiriesClient } from "./InquiriesClient";

export default async function InquiriesPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("custom_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <AdminPageHeader title="Custom Inquiries" />
      <InquiriesClient inquiries={(data ?? []) as import("./InquiriesClient").InquiryRow[]} />
    </div>
  );
}
