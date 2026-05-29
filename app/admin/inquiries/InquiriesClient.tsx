"use client";

import { useState } from "react";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { formatCurrency } from "@/lib/brand";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { InquiryStatus } from "@/types/database";

const TZ = "Asia/Colombo";

export interface InquiryRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  event_date: string | null;
  occasion: string | null;
  servings: number | null;
  status: InquiryStatus;
  budget_min: string | null;
  budget_max: string | null;
  created_at: string;
}

export function InquiriesClient({ inquiries }: { inquiries: InquiryRow[] }) {
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = inquiries.filter((i) => !statusFilter || i.status === statusFilter);

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm outline-none focus:border-wine">
          <option value="">All statuses</option>
          {["new", "in_progress", "quoted", "accepted", "rejected", "completed"].map((s) => (
            <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
        <span className="ml-auto text-sm text-ink-light self-center">{filtered.length} inquiries</span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-ink-light border-b border-border">
          <tr>
            <th className="text-left px-6 py-3">Customer</th>
            <th className="text-left px-6 py-3">Event</th>
            <th className="text-left px-6 py-3">Budget</th>
            <th className="text-left px-6 py-3">Status</th>
            <th className="text-left px-6 py-3">Date</th>
            <th className="text-right px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filtered.map((inq) => (
            <tr key={inq.id} className="hover:bg-gray-50">
              <td className="px-6 py-3">
                <p className="font-medium text-ink">{inq.name}</p>
                <p className="text-xs text-ink-light">{inq.email}</p>
              </td>
              <td className="px-6 py-3">
                <p className="text-ink">{inq.occasion ?? "—"}</p>
                {inq.event_date && <p className="text-xs text-ink-light">{formatInTimeZone(`${inq.event_date}T00:00:00`, TZ, "d MMM yyyy")}</p>}
              </td>
              <td className="px-6 py-3 text-ink-light">
                {inq.budget_min && inq.budget_max
                  ? `${formatCurrency(parseFloat(inq.budget_min))} – ${formatCurrency(parseFloat(inq.budget_max))}`
                  : "—"}
              </td>
              <td className="px-6 py-3"><StatusBadge type="inquiry" value={inq.status} /></td>
              <td className="px-6 py-3 text-ink-light">{formatInTimeZone(inq.created_at, TZ, "d MMM yyyy")}</td>
              <td className="px-6 py-3 text-right">
                <Link href={`/admin/inquiries/${inq.id}`} className="text-sm text-wine hover:underline">View</Link>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-ink-light">No inquiries found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
