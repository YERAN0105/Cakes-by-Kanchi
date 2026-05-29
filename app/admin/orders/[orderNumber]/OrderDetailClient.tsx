"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle, Clock } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { updateOrderStatusAction, addOrderNoteAction, approveBankTransferAction, rejectBankTransferAction, cancelOrderAdminAction } from "@/lib/actions/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { OrderStatus, PaymentStatus } from "@/types/database";
import Image from "next/image";

const TZ = "Asia/Colombo";

const STATUS_FLOW: OrderStatus[] = [
  "pending_confirmation",
  "confirmed",
  "in_preparation",
  "out_for_delivery",
  "delivered",
  "completed",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_confirmation: "Pending Confirmation",
  confirmed: "Confirmed",
  in_preparation: "In Preparation",
  out_for_delivery: "Out for Delivery",
  ready_for_pickup: "Ready for Pickup",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

interface ReceiptWithUrl {
  id: string;
  image_url: string;
  status: string;
  reject_reason: string | null;
  uploaded_at: string;
  signedUrl: string | null;
}

interface OrderDetailClientProps {
  orderId: string;
  orderNumber?: string;
  currentStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  internalNotes: string | null;
  statusHistory: { id: string; status: OrderStatus; note: string | null; changed_at: string }[];
  receipts: ReceiptWithUrl[];
}

export function OrderDetailClient({
  orderId,
  currentStatus,
  paymentStatus,
  paymentMethod,
  internalNotes,
  statusHistory,
  receipts,
}: OrderDetailClientProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [newNote, setNewNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [showReject, setShowReject] = useState(false);

  function handleStatusChange(newStatus: OrderStatus, note?: string) {
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, newStatus, note);
      if ("error" in result) { toast.error(result.error); return; }
      setStatus(newStatus);
      if ("data" in result && result.data?.pointsEarned) {
        toast.success(`Status updated. Customer earned ${result.data.pointsEarned} loyalty points.`);
      } else {
        toast.success("Status updated.");
      }
    });
  }

  function handleAddNote() {
    if (!newNote.trim()) return;
    startTransition(async () => {
      const result = await addOrderNoteAction(orderId, newNote);
      if ("error" in result) { toast.error(result.error); return; }
      setNewNote("");
      toast.success("Note added.");
    });
  }

  function handleApproveReceipt() {
    startTransition(async () => {
      const result = await approveBankTransferAction(orderId);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Bank transfer approved. Order confirmed.");
    });
  }

  function handleRejectReceipt() {
    if (!rejectReason.trim()) { toast.error("Please provide a reason."); return; }
    startTransition(async () => {
      const result = await rejectBankTransferAction(orderId, rejectReason);
      if ("error" in result) { toast.error(result.error); return; }
      setShowReject(false);
      setRejectReason("");
      toast.success("Bank transfer rejected.");
    });
  }

  function handleCancel() {
    if (!cancelReason.trim()) { toast.error("Please provide a reason."); return; }
    startTransition(async () => {
      const result = await cancelOrderAdminAction(orderId, cancelReason);
      if ("error" in result) { toast.error(result.error); return; }
      setStatus("cancelled");
      setShowCancel(false);
      toast.success("Order cancelled.");
    });
  }

  const currentIdx = STATUS_FLOW.indexOf(status);

  return (
    <div className="space-y-4">
      {/* Status controls */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <h3 className="font-display text-lg text-ink mb-4">Order Status</h3>

        {/* Timeline */}
        <div className="flex items-center gap-0 mb-6 overflow-x-auto pb-2">
          {STATUS_FLOW.map((s, i) => {
            const done = i <= currentIdx;
            const active = i === currentIdx;
            return (
              <div key={s} className="flex items-center shrink-0">
                <div className={`flex flex-col items-center gap-1 ${done ? "opacity-100" : "opacity-40"}`}>
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center ${active ? "bg-wine" : done ? "bg-green-500" : "bg-gray-200"}`}>
                    {done ? <CheckCircle className="h-4 w-4 text-white" /> : <Clock className="h-3 w-3 text-gray-400" />}
                  </div>
                  <span className="text-xs text-ink-light text-center max-w-16 leading-tight">{STATUS_LABELS[s]}</span>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div className={`h-px w-8 mx-1 mb-5 ${i < currentIdx ? "bg-green-400" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Advance / manual status buttons */}
        <div className="flex flex-wrap gap-2">
          {status !== "cancelled" && status !== "completed" && status !== "refunded" && (
            <>
              {currentIdx < STATUS_FLOW.length - 1 && (
                <button
                  onClick={() => handleStatusChange(STATUS_FLOW[currentIdx + 1]!)}
                  disabled={isPending}
                  className="px-4 py-2 bg-wine text-cream rounded-lg text-sm font-medium hover:bg-wine-light disabled:opacity-50"
                >
                  Advance to {STATUS_LABELS[STATUS_FLOW[currentIdx + 1]!]}
                </button>
              )}
              <button
                onClick={() => setShowCancel(true)}
                disabled={isPending}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
              >
                Cancel Order
              </button>
            </>
          )}
          <StatusBadge type="order" value={status} />
        </div>

        {showCancel && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg space-y-2">
            <p className="text-sm font-medium text-red-800">Reason for cancellation</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
              className="input text-sm"
              placeholder="Enter reason…"
            />
            <div className="flex gap-2">
              <button onClick={handleCancel} disabled={isPending} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm disabled:opacity-50">Confirm Cancel</button>
              <button onClick={() => setShowCancel(false)} className="px-3 py-1.5 border border-border rounded text-sm text-ink-light">Dismiss</button>
            </div>
          </div>
        )}

        {/* Bank transfer approval */}
        {paymentMethod === "bank_transfer" && receipts.length > 0 && paymentStatus === "pending_transfer" && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm font-medium text-ink mb-2">Bank Transfer Receipt</p>
            <div className="flex flex-wrap gap-4 mb-3">
              {receipts.map((r) => r.signedUrl && (
                <a key={r.id} href={r.signedUrl} target="_blank" rel="noopener noreferrer">
                  <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-border">
                    <Image src={r.signedUrl} alt="Receipt" fill className="object-cover" />
                  </div>
                </a>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleApproveReceipt} disabled={isPending} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                Approve Transfer
              </button>
              <button onClick={() => setShowReject(!showReject)} disabled={isPending} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">
                Reject
              </button>
            </div>
            {showReject && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="input text-sm"
                  rows={2}
                  placeholder="Reason for rejection…"
                />
                <button onClick={handleRejectReceipt} disabled={isPending} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm disabled:opacity-50">
                  Confirm Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status history */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <h3 className="font-display text-lg text-ink mb-4">Status History</h3>
        <div className="space-y-3">
          {statusHistory
            .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
            .map((h) => (
              <div key={h.id} className="flex items-start gap-3 text-sm">
                <span className="text-xs text-ink-light whitespace-nowrap pt-0.5">
                  {formatInTimeZone(h.changed_at, TZ, "d MMM, h:mm a")}
                </span>
                <StatusBadge type="order" value={h.status} />
                {h.note && <span className="text-ink-light">{h.note}</span>}
              </div>
            ))}
        </div>
      </div>

      {/* Internal notes */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <h3 className="font-display text-lg text-ink mb-4">Internal Notes</h3>
        {internalNotes && (
          <div className="mb-3 bg-gray-50 rounded-lg p-3 text-sm text-ink-light whitespace-pre-wrap">
            {internalNotes}
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={2}
            className="input flex-1 text-sm"
            placeholder="Add internal note…"
          />
          <button
            onClick={handleAddNote}
            disabled={isPending || !newNote.trim()}
            className="px-4 py-2 bg-ink text-cream rounded-lg text-sm hover:bg-ink/80 disabled:opacity-40 self-end"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
