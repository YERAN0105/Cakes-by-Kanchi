"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { updateInquiryStatusAction, sendQuoteAction } from "@/lib/actions/admin";
import type { InquiryStatus } from "@/types/database";

interface InquiryDetailClientProps {
  inquiryId: string;
  currentStatus: InquiryStatus;
  existingQuote: { amount: string | null; message: string | null; link: string | null };
}

const STATUSES: InquiryStatus[] = ["new", "in_progress", "quoted", "accepted", "rejected", "completed"];

export function InquiryDetailClient({ inquiryId, currentStatus, existingQuote }: InquiryDetailClientProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [quotedAmount, setQuotedAmount] = useState(existingQuote.amount ?? "");
  const [quoteMessage, setQuoteMessage] = useState(existingQuote.message ?? "");
  const [generatedLink, setGeneratedLink] = useState(existingQuote.link ?? "");

  function handleStatusChange(newStatus: InquiryStatus) {
    startTransition(async () => {
      const result = await updateInquiryStatusAction(inquiryId, newStatus);
      if ("error" in result) { toast.error(result.error); return; }
      setStatus(newStatus);
      toast.success("Status updated.");
    });
  }

  function handleSendQuote() {
    if (!quotedAmount) { toast.error("Enter a quoted amount."); return; }
    startTransition(async () => {
      const result = await sendQuoteAction(inquiryId, quotedAmount, quoteMessage);
      if ("error" in result) { toast.error(result.error); return; }
      if ("data" in result && result.data) {
        setGeneratedLink(result.data.paymentLink);
        setStatus("quoted");
      }
      toast.success("Quote sent. Copy the payment link below.");
    });
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-4">
      <h3 className="font-display text-lg text-ink">Quote & Status</h3>

      <div>
        <label className="label">Status</label>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={isPending || s === status}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-40 ${
                s === status ? "bg-wine text-cream" : "border border-border text-ink-light hover:border-wine hover:text-wine"
              }`}
            >
              {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        <h4 className="font-medium text-ink text-sm">Send Quote</h4>
        <div>
          <label className="label">Quoted Amount (LKR)</label>
          <input value={quotedAmount} onChange={(e) => setQuotedAmount(e.target.value)} className="input w-48" placeholder="e.g. 15000" />
        </div>
        <div>
          <label className="label">Message to Customer</label>
          <textarea value={quoteMessage} onChange={(e) => setQuoteMessage(e.target.value)} rows={3} className="input" placeholder="Your custom cake quote details…" />
        </div>
        <button onClick={handleSendQuote} disabled={isPending} className="px-4 py-2 bg-wine text-cream rounded-lg text-sm hover:bg-wine-light disabled:opacity-50">
          {isPending ? "Saving…" : "Generate Quote Link"}
        </button>

        {generatedLink && (
          <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-800 font-medium mb-1">Payment Link Generated</p>
            <div className="flex items-center gap-2">
              <code className="text-xs text-green-700 flex-1 truncate">{generatedLink}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(generatedLink); toast.success("Copied!"); }}
                className="p-1 text-green-700 hover:text-green-900"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-green-600 mt-1">Share this link with the customer via WhatsApp or email.</p>
          </div>
        )}
      </div>
    </div>
  );
}
