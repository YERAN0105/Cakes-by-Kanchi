import { createAdminClient } from "@/lib/supabase/admin";
import { ProductForm } from "../ProductForm";
import type { CategoryRow, AddonRow } from "@/types/database";

export default async function NewProductPage() {
  const admin = createAdminClient();
  const [categoriesRes, addonsRes] = await Promise.all([
    admin.from("categories").select("*").eq("is_active", true).order("display_order"),
    admin.from("addons").select("*").eq("is_active", true).order("name"),
  ]);

  return (
    <div>
      <ProductForm
        categories={(categoriesRes.data ?? []) as CategoryRow[]}
        allAddons={(addonsRes.data ?? []) as AddonRow[]}
      />
    </div>
  );
}
