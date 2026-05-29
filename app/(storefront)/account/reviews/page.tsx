import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Star, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatInTimeZone } from "date-fns-tz";

const TZ = "Asia/Colombo";
import { ReviewDeleteButton } from "./ReviewDeleteButton";
import type { Database, ReviewStatus } from "@/types/database";

export const metadata: Metadata = { title: "My Reviews" };

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

const STATUS_STYLES: Record<ReviewStatus, string> = {
  pending:  "bg-yellow-50 text-yellow-700 border-yellow-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  hidden:   "bg-gray-50 text-gray-600 border-gray-200",
};

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending:  "Pending Review",
  approved: "Published",
  hidden:   "Hidden",
};

export default async function ReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const admin = createAdminClient();

  const { data: rawReviews } = await admin
    .from("reviews")
    .select("*, products(id, slug, name, product_images(url, is_primary))")
    .eq("user_id", authUser.id)
    .order("created_at", { ascending: false });

  type ReviewWithProduct = ReviewRow & {
    products: {
      id: string;
      slug: string;
      name: string;
      product_images: { url: string; is_primary: boolean }[];
    } | null;
  };

  const reviews = (rawReviews as unknown as ReviewWithProduct[]) ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">My Reviews</h1>
        <p className="body-base text-ink-light mt-1">Reviews you&apos;ve submitted for products you&apos;ve ordered.</p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Star className="w-12 h-12 text-blush mx-auto mb-4 stroke-1" aria-hidden="true" />
          <p className="font-display text-xl text-ink mb-1">No reviews yet</p>
          <p className="text-sm text-ink-light font-body mb-5">
            After your orders are delivered, you&apos;ll be able to leave a review.
          </p>
          <Link href="/account/orders" className="btn-primary px-6 py-2.5 text-sm">
            <Package className="w-4 h-4 inline mr-2" aria-hidden="true" />
            Browse My Orders
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const product = review.products;
            const image =
              product?.product_images.find((i) => i.is_primary)?.url ??
              product?.product_images[0]?.url;

            return (
              <div key={review.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex gap-4">
                  {/* Product image */}
                  {image ? (
                    <Image
                      src={image}
                      alt={product?.name ?? "Product"}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-lg object-cover shrink-0 border border-border"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-blush-light shrink-0 border border-border" />
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        {product ? (
                          <Link
                            href={`/cakes/${product.slug}`}
                            className="font-body font-medium text-ink hover:text-wine transition-colors text-sm"
                          >
                            {product.name}
                          </Link>
                        ) : (
                          <p className="font-body font-medium text-ink text-sm">Product unavailable</p>
                        )}
                        {/* Stars */}
                        <div className="flex items-center gap-0.5 mt-1" aria-label={`Rating: ${review.rating} out of 5 stars`}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= review.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-border"
                              }`}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-body border ${STATUS_STYLES[review.status]}`}
                        >
                          {STATUS_LABELS[review.status]}
                        </span>
                        {review.status === "pending" && (
                          <ReviewDeleteButton reviewId={review.id} />
                        )}
                      </div>
                    </div>

                    {/* Review content */}
                    {review.title && (
                      <p className="font-body font-medium text-ink text-sm mt-2">{review.title}</p>
                    )}
                    {review.body && (
                      <p className="text-sm text-ink-light font-body mt-1 leading-relaxed">{review.body}</p>
                    )}

                    {/* Admin reply */}
                    {review.admin_reply && (
                      <div className="mt-3 pl-3 border-l-2 border-wine/30">
                        <p className="text-xs font-body font-medium text-wine mb-1">Response from {process.env.NEXT_PUBLIC_BRAND_NAME ?? "Cakery"}</p>
                        <p className="text-sm text-ink font-body">{review.admin_reply}</p>
                      </div>
                    )}

                    <p className="text-xs text-ink-light font-body mt-2">
                      {formatInTimeZone(new Date(review.created_at), TZ, "d MMM yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
