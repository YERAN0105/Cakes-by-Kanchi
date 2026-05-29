"use client";

import { useState, useTransition } from "react";
import { Star, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitReviewAction } from "@/lib/actions/account";

interface ReviewModalProps {
  orderItemId: string;
  productId: string;
  productName: string;
}

export function ReviewModal({ orderItemId, productId, productName }: ReviewModalProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitReviewAction({
        order_item_id: orderItemId,
        product_id: productId,
        rating,
        title: title || undefined,
        body: body || undefined,
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Thank you! Your review will be visible after moderation.");
        setOpen(false);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 mt-2 text-xs font-body text-wine hover:text-wine/80 transition-colors"
      >
        <Star className="w-3.5 h-3.5" aria-hidden="true" />
        Write a Review
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40">
          <div className="bg-cream rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">Write a Review</h2>
                <p className="text-sm text-ink-light font-body mt-0.5 truncate max-w-[240px]">{productName}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-1.5 text-ink-light hover:text-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star rating */}
              <div>
                <label className="block text-sm font-body text-ink mb-2">Rating</label>
                <div className="flex gap-1" role="group" aria-label="Star rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                      aria-pressed={rating >= star}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          (hover || rating) >= star
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-border"
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="review-title" className="block text-sm font-body text-ink mb-1.5">
                  Title <span className="text-ink-light">(optional)</span>
                </label>
                <input
                  id="review-title"
                  type="text"
                  maxLength={80}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarise your experience"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body text-ink placeholder:text-ink-light/60 focus:outline-none focus:ring-2 focus:ring-wine/30"
                />
              </div>

              {/* Body */}
              <div>
                <label htmlFor="review-body" className="block text-sm font-body text-ink mb-1.5">
                  Review <span className="text-ink-light">(optional)</span>
                </label>
                <textarea
                  id="review-body"
                  rows={4}
                  maxLength={1000}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Share your thoughts about this cake…"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body text-ink placeholder:text-ink-light/60 resize-none focus:outline-none focus:ring-2 focus:ring-wine/30"
                />
                <p className="text-xs text-ink-light font-body mt-1 text-right">{body.length}/1000</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-body text-ink hover:border-wine/40 disabled:opacity-60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-wine text-cream text-sm font-body font-medium hover:bg-wine/90 disabled:opacity-60 transition-colors"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
