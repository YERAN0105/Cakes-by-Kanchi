import { Star, MessageSquare } from "lucide-react";
import { StarRating } from "@/components/storefront/products/StarRating";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  admin_reply: string | null;
  users: { name: string } | null;
}

interface ReviewsSectionProps {
  reviews: Review[];
  productName: string;
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-light w-4 text-right tabular-nums">{star}</span>
      <Star className="w-3.5 h-3.5 fill-champagne text-champagne shrink-0" aria-hidden="true" />
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-champagne rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
          role="presentation"
        />
      </div>
      <span className="text-xs text-ink-light w-6 tabular-nums">{count}</span>
    </div>
  );
}

export function ReviewsSection({ reviews, productName }: ReviewsSectionProps) {
  const total = reviews.length;
  const avgRating = total > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
    : 0;
  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));

  return (
    <section aria-labelledby="reviews-heading" className="py-10 border-t border-border">
      <h2 id="reviews-heading" className="heading-sm mb-6">
        Customer Reviews
      </h2>

      {total === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-blush-light flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6 text-wine/50" aria-hidden="true" />
          </div>
          <p className="font-display text-lg text-ink mb-1">No reviews yet</p>
          <p className="body-base text-sm">
            Be the first to review <span className="text-wine">{productName}</span>
          </p>
          <p className="text-xs text-ink-light mt-2">Review submission available after purchase</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Summary */}
          <div className="flex flex-col items-center justify-center py-6 bg-cream-50 rounded-xl border border-border">
            <p className="font-display text-5xl font-semibold text-ink mb-1">{avgRating.toFixed(1)}</p>
            <StarRating rating={avgRating} showCount={false} size="md" className="mb-2" />
            <p className="text-sm text-ink-light font-body">{total} {total === 1 ? "review" : "reviews"}</p>
          </div>

          {/* Bar chart */}
          <div className="md:col-span-2 py-2 space-y-2">
            {starCounts.map(({ star, count }) => (
              <RatingBar key={star} star={star} count={count} total={total} />
            ))}
          </div>
        </div>
      )}

      {/* Review list */}
      {total > 0 && (
        <div className="space-y-5">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="p-5 rounded-xl border border-border bg-card"
              aria-label={`Review by ${review.users?.name ?? "Anonymous"}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-body font-medium text-ink text-sm">
                    {review.users?.name ?? "Anonymous"}
                  </p>
                  <StarRating rating={review.rating} showCount={false} />
                </div>
                <time
                  className="text-xs text-ink-light"
                  dateTime={review.created_at}
                >
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </time>
              </div>
              {review.title && (
                <p className="font-body font-semibold text-ink text-sm mb-1">{review.title}</p>
              )}
              {review.body && (
                <p className="text-sm font-body text-ink-light leading-relaxed">{review.body}</p>
              )}

              {review.admin_reply && (
                <div className="mt-3 pl-3 border-l-2 border-wine/30">
                  <p className="text-xs font-body font-medium text-wine mb-0.5">Cakery Response</p>
                  <p className="text-sm font-body text-ink-light">{review.admin_reply}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
