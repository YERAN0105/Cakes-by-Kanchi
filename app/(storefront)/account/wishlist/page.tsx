import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WishlistPageClient } from "./WishlistPageClient";
import type { ProductListItem } from "@/types/database";

export const metadata: Metadata = { title: "My Wishlist" };

const PRODUCT_LIST_SELECT = `
  id, slug, name, base_price, is_featured, is_bestseller,
  stock_tracked, stock_quantity,
  categories ( id, slug, name ),
  product_images ( url, is_primary, alt_text ),
  product_sizes ( price )
`;

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const admin = createAdminClient();

  const { data: wishlistRows } = await admin
    .from("wishlist")
    .select("product_id")
    .eq("user_id", authUser.id);

  const productIds = (wishlistRows ?? []).map((r) => r.product_id);

  let products: ProductListItem[] = [];
  if (productIds.length > 0) {
    const { data } = await admin
      .from("products")
      .select(PRODUCT_LIST_SELECT)
      .in("id", productIds)
      .eq("is_published", true);
    products = (data as unknown as ProductListItem[]) ?? [];
  }

  if (products.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="font-display text-3xl font-semibold text-ink">My Wishlist</h1>
        </div>
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Heart className="w-12 h-12 text-blush mx-auto mb-4 stroke-1" aria-hidden="true" />
          <p className="font-display text-xl text-ink mb-1">Your wishlist is empty</p>
          <p className="text-sm text-ink-light font-body mb-5">
            Save cakes you love by tapping the heart icon on any product.
          </p>
          <Link href="/cakes" className="btn-primary px-6 py-2.5 text-sm">
            Browse Cakes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">My Wishlist</h1>
        <p className="body-base text-ink-light mt-1">{products.length} saved item{products.length !== 1 ? "s" : ""}</p>
      </div>
      <WishlistPageClient products={products} dbIds={productIds} />
    </div>
  );
}
