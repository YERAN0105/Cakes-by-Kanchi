import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: "sm" | "md";
  showCount?: boolean;
  className?: string;
}

export function StarRating({ rating, count, size = "sm", showCount = true, className }: StarRatingProps) {
  const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div className={cn("flex items-center gap-1", className)} aria-label={`${rating} out of 5 stars`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              starSize,
              star <= Math.round(rating)
                ? "fill-champagne text-champagne"
                : "fill-transparent text-border"
            )}
            aria-hidden="true"
          />
        ))}
      </div>
      {showCount && count !== undefined && (
        <span className="text-xs text-ink-light font-body">({count})</span>
      )}
    </div>
  );
}
