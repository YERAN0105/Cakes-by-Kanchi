import { createClient } from "@/lib/supabase/server";
import type { ProductListItem, ProductWithDetails, CategoryRow } from "@/types/database";

export interface ProductFilters {
  category?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  flavors?: string[];
  dietary?: string[];
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "popularity" | "rating";
  page?: number;
  limit?: number;
}

const PRODUCTS_PER_PAGE = 12;

const PRODUCT_LIST_SELECT = `
  id, slug, name, base_price, is_featured, is_bestseller,
  stock_tracked, stock_quantity, created_at,
  categories ( id, slug, name ),
  product_images ( url, is_primary, alt_text ),
  product_sizes ( price )
`;

const PRODUCT_DETAIL_SELECT = `
  *,
  categories ( * ),
  product_images ( * ),
  product_sizes ( * ),
  product_shapes ( * ),
  product_flavors ( * ),
  product_tier_options ( * ),
  product_dietary_options ( * ),
  product_addons ( addons ( * ) )
`;

export async function getProducts(
  filters: ProductFilters = {}
): Promise<{ products: ProductListItem[]; total: number }> {
  const supabase = await createClient();
  const { category, minPrice, maxPrice, flavors, dietary, search, sort, page = 1, limit = PRODUCTS_PER_PAGE } = filters;

  let query = supabase
    .from("products")
    .select(PRODUCT_LIST_SELECT, { count: "exact" })
    .eq("is_published", true);

  // Category filter — accepts single slug or array of slugs
  if (category) {
    const cats = Array.isArray(category) ? category : [category];
    if (cats.length > 0) {
      const { data: catRows } = await supabase
        .from("categories")
        .select("id")
        .in("slug", cats);
      if (catRows && catRows.length > 0) {
        query = query.in("category_id", (catRows as { id: string }[]).map((c) => c.id));
      }
    }
  }

  // Price filter — compare against base_price (min across sizes would be ideal but requires RPC;
  // base_price gives good approximation for filter purposes)
  if (minPrice !== undefined) {
    query = query.gte("base_price", minPrice);
  }
  if (maxPrice !== undefined) {
    query = query.lte("base_price", maxPrice);
  }

  // Flavor filter — match products that have any flavor whose name contains any selected term
  // e.g. selecting "Vanilla" matches "Vanilla Bean", "Strawberry & Vanilla", etc.
  if (flavors && flavors.length > 0) {
    const orConditions = flavors.map((f) => `name.ilike.%${f}%`).join(",");
    const { data: flavorRows } = await supabase
      .from("product_flavors")
      .select("product_id")
      .or(orConditions);
    if (flavorRows && flavorRows.length > 0) {
      const ids = [...new Set((flavorRows as { product_id: string }[]).map((r) => r.product_id))];
      query = query.in("id", ids);
    } else {
      return { products: [], total: 0 };
    }
  }

  // Dietary filter — match products that support any of the selected dietary types
  if (dietary && dietary.length > 0) {
    const { data: dietaryRows } = await supabase
      .from("product_dietary_options")
      .select("product_id")
      .in("type", dietary);
    if (dietaryRows && dietaryRows.length > 0) {
      const ids = [...new Set((dietaryRows as { product_id: string }[]).map((r) => r.product_id))];
      query = query.in("id", ids);
    } else {
      return { products: [], total: 0 };
    }
  }

  // Full-text search
  if (search && search.trim().length > 0) {
    const term = search.trim();
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  // Sorting
  switch (sort) {
    case "price_asc":
      query = query.order("base_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("base_price", { ascending: false });
      break;
    case "popularity":
    case "rating":
      query = query
        .order("is_bestseller", { ascending: false })
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("[getProducts]", error.message);
    return { products: [], total: 0 };
  }

  return {
    products: (data ?? []) as unknown as ProductListItem[],
    total: count ?? 0,
  };
}

export async function getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_DETAIL_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as unknown as ProductWithDetails;
}

export async function getFeaturedProducts(limit = 4): Promise<ProductListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_LIST_SELECT)
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getFeaturedProducts]", error.message);
    return [];
  }

  return (data ?? []) as unknown as ProductListItem[];
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4
): Promise<ProductListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(PRODUCT_LIST_SELECT)
    .eq("is_published", true)
    .neq("id", productId)
    .limit(limit);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getRelatedProducts]", error.message);
    return [];
  }

  return (data ?? []) as unknown as ProductListItem[];
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data as CategoryRow | null;
}

export async function getAllCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order");
  return data ?? [];
}

export async function getProductReviews(productId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id, rating, title, body, created_at, admin_reply,
      users ( name )
    `)
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getProductReviews]", error.message);
    return [];
  }

  return data ?? [];
}

export { getMinPrice, getPrimaryImage } from "@/lib/product-utils";
