"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteReviewAction } from "@/lib/actions/account";
import { useRouter } from "next/navigation";

export function ReviewDeleteButton({ reviewId }: { reviewId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!window.confirm("Delete this review? This action cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteReviewAction(reviewId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Review deleted.");
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      aria-label="Delete review"
      className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 className="w-4 h-4" aria-hidden="true" />
      )}
    </button>
  );
}
