import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { ProductForm } from "../../ProductForm";
import type { CategoryRow, AddonRow } from "@/types/database";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  const [productRes, categoriesRes, addonsRes] = await Promise.all([
    admin
      .from("products")
      .select(
        "*, product_images(*), product_sizes(*), product_shapes(*), product_flavors(*), product_tier_options(*), product_dietary_options(*), product_addons(addon_id)"
      )
      .eq("id", id)
      .single() as unknown as Promise<{ data: unknown }>,
    admin.from("categories").select("*").order("display_order"),
    admin.from("addons").select("*").order("name"),
  ]);

  if (!productRes.data) notFound();

  const p = productRes.data as {
    id: string;
    name: string;
    slug: string;
    category_id: string | null;
    description: string | null;
    ingredients: string | null;
    allergens: string | null;
    base_price: string;
    is_published: boolean;
    is_featured: boolean;
    is_bestseller: boolean;
    stock_tracked: boolean;
    stock_quantity: number;
    low_stock_threshold: number;
    allows_message: boolean;
    allows_color_theme: boolean;
    allows_photo_upload: boolean;
    meta_title: string | null;
    meta_description: string | null;
    product_images: { id: string; url: string; alt_text: string | null; display_order: number; is_primary: boolean }[];
    product_sizes: { id: string; label: string; weight_kg: string | null; price: string }[];
    product_shapes: { id: string; shape: string }[];
    product_flavors: { id: string; name: string; price_modifier: string }[];
    product_tier_options: { id: string; tier_count: number; price_modifier: string }[];
    product_dietary_options: { id: string; type: string; price_modifier: string }[];
    product_addons: { addon_id: string }[];
  };

  const defaultValues = {
    name: p.name,
    slug: p.slug,
    category_id: p.category_id,
    description: p.description ?? "",
    ingredients: p.ingredients ?? "",
    allergens: p.allergens ?? "",
    base_price: p.base_price,
    is_published: p.is_published,
    is_featured: p.is_featured,
    is_bestseller: p.is_bestseller,
    stock_tracked: p.stock_tracked,
    stock_quantity: p.stock_quantity,
    low_stock_threshold: p.low_stock_threshold,
    allows_message: p.allows_message,
    allows_color_theme: p.allows_color_theme,
    allows_photo_upload: p.allows_photo_upload,
    meta_title: p.meta_title ?? "",
    meta_description: p.meta_description ?? "",
    images: p.product_images
      .sort((a, b) => a.display_order - b.display_order)
      .map((img) => ({ url: img.url, alt_text: img.alt_text ?? "", display_order: img.display_order, is_primary: img.is_primary })),
    sizes: p.product_sizes.map((s) => ({ label: s.label, weight_kg: s.weight_kg ?? "", price: s.price })),
    shapes: p.product_shapes.map((s) => s.shape),
    flavors: p.product_flavors.map((f) => ({ name: f.name, price_modifier: f.price_modifier })),
    tier_options: p.product_tier_options.map((t) => ({ tier_count: t.tier_count, price_modifier: t.price_modifier })),
    dietary_options: p.product_dietary_options.map((d) => ({ type: d.type as "eggless" | "vegan" | "gluten_free", price_modifier: d.price_modifier })),
    addon_ids: p.product_addons.map((a) => a.addon_id),
  };

  return (
    <div>
      <ProductForm
        productId={id}
        defaultValues={defaultValues}
        categories={(categoriesRes.data ?? []) as CategoryRow[]}
        allAddons={(addonsRes.data ?? []) as AddonRow[]}
      />
    </div>
  );
}
