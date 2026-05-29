"use client";

import { useState, useTransition } from "react";
import { Star, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { formatInTimeZone } from "date-fns-tz";
import { updateReviewStatusAdminAction, deleteReviewAdminAction, replyToReviewAction } from "@/lib/actions/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { cn } from "@/lib/utils";
import type { ReviewStatus } from "@/types/database";

const TZ = "Asia/Colombo";

export interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  admin_reply: string | null;
  created_at: string;
  products: { name: string; slug: string } | null;
  users: { name: string } | null;
}

export function ReviewsModerationClient({ reviews: initial }: { reviews: ReviewRow[] }) {
  const [reviews, setReviews] = useState(initial);
  const [tabFilter, setTabFilter] = useState<"" | ReviewStatus>("");
  const [isPending, startTransition] = useTransition();
  const [replyState, setReplyState] = useState<Record<string, string>>({});
  const [showReply, setShowReply] = useState<Record<string, boolean>>({});

  const filtered = reviews.filter((r) => !tabFilter || r.status === tabFilter);

  function handleStatus(id: string, status: ReviewStatus) {
    startTransition(async () => {
      const result = await updateReviewStatusAdminAction(id, status);
      if ("error" in result) { toast.error(result.error); return; }
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      toast.success("Status updated.");
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this review?")) return;
    startTransition(async () => {
      await deleteReviewAdminAction(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success("Review deleted.");
    });
  }

  function handleReply(id: string) {
    const reply = replyState[id]?.trim();
    if (!reply) { toast.error("Enter a reply."); return; }
    startTransition(async () => {
      const result = await replyToReviewAction(id, reply);
      if ("error" in result) { toast.error(result.error); return; }
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, admin_reply: reply } : r));
      setShowReply({ ...showReply, [id]: false });
      toast.success("Reply saved.");
    });
  }

  const pending = reviews.filter((r) => r.status === "pending").length;

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="flex border-b border-border">
        {([["", "All"], ["pending", `Pending (${pending})`], ["approved", "Approved"], ["hidden", "Hidden"]] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTabFilter(val as "" | ReviewStatus)}
            className={cn("px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors", tabFilter === val ? "border-wine text-wine" : "border-transparent text-ink-light hover:text-ink")}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="divide-y divide-border">
        {filtered.map((r) => (
          <div key={r.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("h-4 w-4", i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200")} />
                    ))}
                  </div>
                  <StatusBadge type="review" value={r.status} />
                </div>
                <p className="font-medium text-ink">{r.title ?? "(No title)"}</p>
                {r.body && <p className="text-sm text-ink-light mt-1 line-clamp-3">{r.body}</p>}
                <div className="text-xs text-ink-light mt-2">
                  {r.users?.name ?? "Anonymous"} · {r.products?.name ?? "Unknown Product"} · {formatInTimeZone(r.created_at, TZ, "d MMM yyyy")}
                </div>
                {r.admin_reply && (
                  <div className="mt-2 bg-gray-50 rounded-lg p-3 text-sm text-ink-light border-l-2 border-wine">
                    <span className="text-xs font-medium text-wine">Admin reply: </span>
                    {r.admin_reply}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {r.status !== "approved" && (
                  <button onClick={() => handleStatus(r.id, "approved")} disabled={isPending} className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">Approve</button>
                )}
                {r.status !== "hidden" && (
                  <button onClick={() => handleStatus(r.id, "hidden")} disabled={isPending} className="px-3 py-1 text-xs border border-gray-200 text-ink-light rounded hover:text-ink disabled:opacity-50">Hide</button>
                )}
                <button onClick={() => setShowReply({ ...showReply, [r.id]: !showReply[r.id] })} className="px-3 py-1 text-xs border border-border rounded text-ink-light hover:text-wine">
                  <MessageSquare className="h-3 w-3 inline mr-1" />Reply
                </button>
                <button onClick={() => handleDelete(r.id)} disabled={isPending} className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50">
                  <Trash2 className="h-3 w-3 inline mr-1" />Delete
                </button>
              </div>
            </div>
            {showReply[r.id] && (
              <div className="mt-3 flex gap-2">
                <textarea
                  value={replyState[r.id] ?? r.admin_reply ?? ""}
                  onChange={(e) => setReplyState({ ...replyState, [r.id]: e.target.value })}
                  rows={2}
                  className="input flex-1 text-sm"
                  placeholder="Write a public reply…"
                />
                <button onClick={() => handleReply(r.id)} disabled={isPending} className="px-3 py-2 bg-wine text-cream rounded-lg text-sm self-end disabled:opacity-50">Save</button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="px-6 py-12 text-center text-sm text-ink-light">No reviews found.</p>}
      </div>
    </div>
  );
}
