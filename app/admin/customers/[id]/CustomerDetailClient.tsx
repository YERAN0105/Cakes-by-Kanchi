"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { blockCustomerAction, adjustLoyaltyAction } from "@/lib/actions/admin";

interface CustomerDetailClientProps {
  userId: string;
  blocked: boolean;
}

export function CustomerDetailClient({ userId, blocked: initialBlocked }: CustomerDetailClientProps) {
  const [blocked, setBlocked] = useState(initialBlocked);
  const [isPending, startTransition] = useTransition();
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  function handleBlock() {
    if (!confirm(`Are you sure you want to ${blocked ? "unblock" : "block"} this customer?`)) return;
    startTransition(async () => {
      const result = await blockCustomerAction(userId, !blocked);
      if ("error" in result) { toast.error(result.error); return; }
      setBlocked(!blocked);
      toast.success(blocked ? "Customer unblocked." : "Customer blocked.");
    });
  }

  function handleAdjust() {
    const pts = parseInt(adjustPoints);
    if (isNaN(pts) || pts === 0) { toast.error("Enter a non-zero number."); return; }
    if (!adjustNote.trim()) { toast.error("Note is required."); return; }
    startTransition(async () => {
      const result = await adjustLoyaltyAction(userId, pts, adjustNote);
      if ("error" in result) { toast.error(result.error); return; }
      setShowAdjust(false);
      setAdjustPoints("");
      setAdjustNote("");
      toast.success("Loyalty points adjusted.");
    });
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-5 space-y-3">
      <h3 className="font-display text-base text-ink">Actions</h3>
      <button
        onClick={handleBlock}
        disabled={isPending}
        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
          blocked ? "bg-green-600 text-white hover:bg-green-700" : "border border-red-200 text-red-600 hover:bg-red-50"
        }`}
      >
        {blocked ? "Unblock Customer" : "Block Customer"}
      </button>
      <button
        onClick={() => setShowAdjust(!showAdjust)}
        className="w-full py-2 border border-border rounded-lg text-sm text-ink-light hover:text-ink hover:border-ink transition-colors"
      >
        Adjust Loyalty Points
      </button>
      {showAdjust && (
        <div className="space-y-2 pt-2 border-t border-border">
          <input
            type="number"
            value={adjustPoints}
            onChange={(e) => setAdjustPoints(e.target.value)}
            placeholder="Points (+ or -)"
            className="input text-sm"
          />
          <input
            value={adjustNote}
            onChange={(e) => setAdjustNote(e.target.value)}
            placeholder="Reason / note"
            className="input text-sm"
          />
          <button
            onClick={handleAdjust}
            disabled={isPending}
            className="w-full py-2 bg-wine text-cream rounded-lg text-sm hover:bg-wine-light disabled:opacity-50"
          >
            Apply Adjustment
          </button>
        </div>
      )}
    </div>
  );
}
