import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminCard";
import { ReviewsModerationClient } from "./ReviewsModerationClient";

export default async function ReviewsPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("reviews")
    .select("*, products(name, slug), users(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <AdminPageHeader title="Review Moderation" />
      <ReviewsModerationClient reviews={(data ?? []) as unknown as import("./ReviewsModerationClient").ReviewRow[]} />
    </div>
  );
}
