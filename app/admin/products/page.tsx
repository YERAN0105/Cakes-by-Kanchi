import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminCard";
import { ProductsTableClient } from "./ProductsTableClient";
import type { CategoryRow } from "@/types/database";

export default async function ProductsPage() {
  const admin = createAdminClient();

  const [productsRes, categoriesRes] = await Promise.all([
    admin
      .from("products")
      .select(
        "id, name, slug, base_price, is_published, is_featured, is_bestseller, stock_tracked, stock_quantity, low_stock_threshold, category_id, categories(name), product_images(url, is_primary)"
      )
      .order("created_at", { ascending: false }),
    admin.from("categories").select("id, name").order("display_order"),
  ]);

  const products = (productsRes.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    slug: string;
    base_price: string;
    is_published: boolean;
    is_featured: boolean;
    is_bestseller: boolean;
    stock_tracked: boolean;
    stock_quantity: number;
    low_stock_threshold: number;
    category_id: string | null;
    categories: { name: string } | null;
    product_images: { url: string; is_primary: boolean }[];
  }>;

  const categories = (categoriesRes.data ?? []) as CategoryRow[];

  return (
    <div>
      <AdminPageHeader
        title="Products"
        subtitle={`${products.length} total products`}
        action={
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-wine text-cream rounded-lg text-sm font-medium hover:bg-wine-light transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        }
      />
      <ProductsTableClient products={products} categories={categories} />
    </div>
  );
}
