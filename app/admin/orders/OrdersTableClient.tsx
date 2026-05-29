"use client";

import { useState } from "react";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { formatCurrency } from "@/lib/brand";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { OrderStatus, PaymentStatus } from "@/types/database";

const TZ = "Asia/Colombo";

export interface OrderRow {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  fulfillment_type: string;
  total: string;
  created_at: string;
  delivery_date: string | null;
  user_id: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  users: { name: string; phone: string | null } | null;
}

const ALL_STATUSES: OrderStatus[] = [
  "pending_confirmation",
  "confirmed",
  "in_preparation",
  "out_for_delivery",
  "ready_for_pickup",
  "delivered",
  "completed",
  "cancelled",
];

export function OrdersTableClient({ orders }: { orders: OrderRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const customerName = o.users?.name ?? o.guest_email ?? "";
    const customerPhone = o.users?.phone ?? o.guest_phone ?? "";
    const matchSearch =
      !q ||
      o.order_number.toLowerCase().includes(q) ||
      customerName.toLowerCase().includes(q) ||
      customerPhone.includes(q);
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchPayment = !paymentFilter || o.payment_status === paymentFilter;
    const matchMethod = !methodFilter || o.payment_method === methodFilter;
    return matchSearch && matchStatus && matchPayment && matchMethod;
  });

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="px-6 py-4 border-b border-border flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order, customer, phone…"
          className="px-3 py-1.5 border border-border rounded-lg text-sm outline-none focus:border-wine w-56"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm outline-none focus:border-wine">
          <option value="">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm outline-none focus:border-wine">
          <option value="">All payments</option>
          <option value="pending">Pending</option>
          <option value="pending_transfer">Awaiting Transfer</option>
          <option value="paid">Paid</option>
          <option value="cod">COD</option>
          <option value="failed">Failed</option>
        </select>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm outline-none focus:border-wine">
          <option value="">All methods</option>
          <option value="payhere">PayHere</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cod">COD</option>
        </select>
        <span className="ml-auto text-sm text-ink-light self-center">{filtered.length} orders</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-ink-light border-b border-border">
            <tr>
              <th className="text-left px-6 py-3">Order #</th>
              <th className="text-left px-6 py-3">Customer</th>
              <th className="text-left px-6 py-3">Date</th>
              <th className="text-left px-6 py-3">Delivery</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3">Payment</th>
              <th className="text-right px-6 py-3">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <Link href={`/admin/orders/${o.order_number}`} className="text-wine font-medium hover:underline">
                    {o.order_number}
                  </Link>
                </td>
                <td className="px-6 py-3">
                  <p className="text-ink">{o.users?.name ?? o.guest_email ?? "Guest"}</p>
                  <p className="text-xs text-ink-light">{o.users?.phone ?? o.guest_phone ?? ""}</p>
                </td>
                <td className="px-6 py-3 text-ink-light whitespace-nowrap">
                  {formatInTimeZone(o.created_at, TZ, "d MMM yyyy")}
                </td>
                <td className="px-6 py-3 text-ink-light">
                  {o.delivery_date ? formatInTimeZone(`${o.delivery_date}T00:00:00`, TZ, "d MMM") : "—"}
                </td>
                <td className="px-6 py-3">
                  <StatusBadge type="order" value={o.status} />
                </td>
                <td className="px-6 py-3">
                  <StatusBadge type="payment" value={o.payment_status} />
                </td>
                <td className="px-6 py-3 text-right font-medium">
                  {formatCurrency(parseFloat(o.total))}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-ink-light text-sm">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
