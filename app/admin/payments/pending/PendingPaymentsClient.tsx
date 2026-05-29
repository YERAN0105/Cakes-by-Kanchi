"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatInTimeZone } from "date-fns-tz";
import { formatCurrency } from "@/lib/brand";
import { approveBankTransferAction, rejectBankTransferAction } from "@/lib/actions/admin";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

const TZ = "Asia/Colombo";

export interface PendingOrder {
  id: string;
  order_number: string;
  total: string;
  created_at: string;
  users: { name: string; email: string; phone: string | null } | null;
  guest_email: string | null;
  guest_phone: string | null;
  bank_transfer_receipts: { id: string; image_url: string; uploaded_at: string; status: string; reject_reason: string | null; signedUrl: string | null }[];
}

export function PendingPaymentsClient({ orders: initial }: { orders: PendingOrder[] }) {
  const [orders, setOrders] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showReject, setShowReject] = useState<Record<string, boolean>>({});

  function handleApprove(orderId: string) {
    startTransition(async () => {
      const result = await approveBankTransferAction(orderId);
      if ("error" in result) { toast.error(result.error); return; }
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success("Transfer approved. Order confirmed.");
    });
  }

  function handleReject(orderId: string) {
    const reason = rejectReason[orderId]?.trim();
    if (!reason) { toast.error("Enter a rejection reason."); return; }
    startTransition(async () => {
      const result = await rejectBankTransferAction(orderId, reason);
      if ("error" in result) { toast.error(result.error); return; }
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success("Transfer rejected. Customer notified.");
    });
  }

  const pendingOrders = orders.filter((o) => o.bank_transfer_receipts.some((r) => r.status === "pending" && r.signedUrl));

  return (
    <div className="space-y-4">
      {pendingOrders.length === 0 && (
        <div className="bg-white rounded-xl border border-border p-12 text-center text-ink-light">No pending bank transfers.</div>
      )}
      {pendingOrders.map((order) => {
        const receipt = order.bank_transfer_receipts.find((r) => r.status === "pending" && r.signedUrl);
        const customerName = order.users?.name ?? order.guest_email ?? "Guest";
        return (
          <div key={order.id} className="bg-white rounded-xl border border-border shadow-sm p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/admin/orders/${order.order_number}`} className="font-medium text-wine hover:underline">
                    {order.order_number}
                  </Link>
                  <ExternalLink className="h-3.5 w-3.5 text-ink-light" />
                </div>
                <p className="text-sm text-ink">{customerName}</p>
                <p className="text-xs text-ink-light">{formatInTimeZone(order.created_at, TZ, "d MMM yyyy")}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg text-ink">{formatCurrency(parseFloat(order.total))}</p>
                {receipt && (
                  <p className="text-xs text-ink-light">
                    Uploaded {formatInTimeZone(receipt.uploaded_at, TZ, "d MMM, h:mm a")}
                  </p>
                )}
              </div>
            </div>

            {receipt?.signedUrl && (
              <div className="mt-4 flex flex-wrap gap-4 items-start">
                <a href={receipt.signedUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <div className="relative h-32 w-32 rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity">
                    <Image src={receipt.signedUrl} alt="Receipt" fill className="object-cover" />
                  </div>
                </a>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(order.id)} disabled={isPending} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                      Approve Transfer
                    </button>
                    <button onClick={() => setShowReject({ ...showReject, [order.id]: !showReject[order.id] })} disabled={isPending} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">
                      Reject
                    </button>
                  </div>
                  {showReject[order.id] && (
                    <div className="space-y-2">
                      <textarea
                        value={rejectReason[order.id] ?? ""}
                        onChange={(e) => setRejectReason({ ...rejectReason, [order.id]: e.target.value })}
                        rows={2}
                        className="input text-sm"
                        placeholder="Reason for rejection…"
                      />
                      <button onClick={() => handleReject(order.id)} disabled={isPending} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm disabled:opacity-50">
                        Confirm Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
