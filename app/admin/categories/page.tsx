import { createAdminClient } from "@/lib/supabase/admin";
import { CategoriesClient } from "./CategoriesClient";
import { AdminPageHeader } from "@/components/admin/AdminCard";
import type { CategoryRow } from "@/types/database";

export default async function CategoriesPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("categories").select("*").order("display_order");
  return (
    <div>
      <AdminPageHeader title="Categories" subtitle="Manage cake categories" />
      <CategoriesClient categories={(data ?? []) as CategoryRow[]} />
    </div>
  );
}
