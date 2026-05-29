"use client";

import Link from "next/link";
import { format, differenceInCalendarDays } from "date-fns";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Printer, Phone, Clock, AlertTriangle, MessageSquare } from "lucide-react";
import type { OrderStatus } from "@/types/database";

export interface ScheduleOrder {
  id: string;
  order_number: string;
  status: OrderStatus;
  delivery_date: string | null;
  fulfillment_type: string;
  guest_phone: string | null;
  users: { name: string; phone: string | null } | null;
  time_slots: { label: string } | null;
  order_items: {
    product_snapshot: {
      name: string;
      sizeName: string;
      flavorName: string | null;
      tierName: string | null;
    };
    customization: {
      quantity: number;
      eggless?: boolean;
      vegan?: boolean;
      gluten_free?: boolean;
      message?: string;
      special_instructions?: string;
      addon_ids?: string[];
    };
    quantity: number;
  }[];
}

function getUrgency(deliveryDate: string): { label: string; diff: number } {
  const delivery = new Date(deliveryDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = differenceInCalendarDays(delivery, today);
  if (diff < 0) return { label: "OVERDUE", diff };
  if (diff === 0) return { label: "TODAY", diff };
  if (diff === 1) return { label: "TOMORROW", diff };
  return { label: `in ${diff} days`, diff };
}

function DateGroupHeader({ dateStr }: { dateStr: string }) {
  const { label, diff } = getUrgency(dateStr);
  const date = new Date(dateStr + "T00:00:00");
  const formattedDate = format(date, "EEEE, d MMMM yyyy");

  const urgencyClass =
    diff < 0
      ? "bg-red-100 text-red-800 border-red-300"
      : diff === 0
      ? "bg-red-50 text-red-700 border-red-200"
      : diff === 1
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-gray-50 text-ink-light border-border";

  const labelClass =
    diff < 0
      ? "bg-red-600 text-white"
      : diff === 0
      ? "bg-red-500 text-white"
      : diff === 1
      ? "bg-amber-500 text-white"
      : "bg-gray-400 text-white";

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-medium ${urgencyClass}`}>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${labelClass}`}>
        {label}
      </span>
      <span className="text-sm">{formattedDate}</span>
    </div>
  );
}

function OrderCard({ order }: { order: ScheduleOrder }) {
  const customerName = order.users?.name ?? "Guest";
  const customerPhone = order.users?.phone ?? order.guest_phone ?? null;

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Order header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-gray-50">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/orders/${order.order_number}`}
            className="font-mono text-sm font-semibold text-wine hover:underline"
          >
            {order.order_number}
          </Link>
          <StatusBadge type="order" value={order.status} />
          <span className="text-xs text-ink-light capitalize bg-white border border-border px-2 py-0.5 rounded-full">
            {order.fulfillment_type}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {order.time_slots && (
            <span className="flex items-center gap-1 text-xs text-ink-light">
              <Clock className="h-3 w-3" />
              {order.time_slots.label}
            </span>
          )}
          <Link
            href={`/admin/orders/${order.order_number}/print/kitchen-ticket`}
            target="_blank"
            className="flex items-center gap-1 text-xs text-ink-light hover:text-ink border border-border px-2 py-1 rounded-lg hover:border-ink transition-colors"
          >
            <Printer className="h-3 w-3" />
            Kitchen Ticket
          </Link>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Customer */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-ink">{customerName}</span>
          {customerPhone && (
            <a
              href={`tel:${customerPhone}`}
              className="flex items-center gap-1 text-ink-light hover:text-wine transition-colors"
            >
              <Phone className="h-3 w-3" />
              {customerPhone}
            </a>
          )}
        </div>

        {/* Items */}
        <div className="space-y-2">
          {order.order_items.map((item, i) => {
            const snap = item.product_snapshot;
            const c = item.customization;
            const dietary: string[] = [];
            if (c.eggless) dietary.push("Eggless");
            if (c.vegan) dietary.push("Vegan");
            if (c.gluten_free) dietary.push("GF");
            const addonCount = (c.addon_ids ?? []).length;
            const hasMessage = !!c.message;
            const hasSpecial = !!c.special_instructions;

            return (
              <div key={i} className="flex items-start justify-between gap-4 bg-cream/40 rounded-lg px-3 py-2.5">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="shrink-0 mt-0.5 text-xs font-bold text-wine bg-wine/10 rounded px-1.5 py-0.5">
                    ×{item.quantity}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-ink text-sm truncate">{snap.name}</p>
                    <p className="text-xs text-ink-light">
                      {snap.sizeName}
                      {snap.flavorName && ` · ${snap.flavorName}`}
                      {snap.tierName && ` · ${snap.tierName}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  {dietary.map((d) => (
                    <span key={d} className="text-xs font-semibold bg-green-100 text-green-800 border border-green-300 px-1.5 py-0.5 rounded">
                      {d}
                    </span>
                  ))}
                  {addonCount > 0 && (
                    <span className="text-xs bg-blush text-wine border border-wine/20 px-1.5 py-0.5 rounded">
                      +{addonCount} add-on{addonCount > 1 ? "s" : ""}
                    </span>
                  )}
                  {hasMessage && (
                    <span title={`Message: "${c.message}"`} className="text-xs flex items-center gap-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded">
                      <MessageSquare className="h-2.5 w-2.5" />
                      Message
                    </span>
                  )}
                  {hasSpecial && (
                    <span title={c.special_instructions} className="text-xs flex items-center gap-0.5 bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      Special
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function BakingScheduleClient({ orders }: { orders: ScheduleOrder[] }) {
  // Group by delivery date
  const groups = new Map<string, ScheduleOrder[]>();
  for (const order of orders) {
    const key = order.delivery_date ?? "__no_date__";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(order);
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border shadow-sm px-6 py-16 text-center">
        <p className="text-ink-light text-sm">No upcoming active orders.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Array.from(groups.entries()).map(([dateKey, dayOrders]) => (
        <div key={dateKey} className="space-y-3">
          <div className="flex items-center gap-3">
            {dateKey === "__no_date__" ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-gray-50 text-ink-light border-border">
                <span className="text-sm font-medium">No delivery date set</span>
              </div>
            ) : (
              <DateGroupHeader dateStr={dateKey} />
            )}
            <span className="text-sm text-ink-light">
              {dayOrders.length} order{dayOrders.length > 1 ? "s" : ""}
              {" · "}
              {dayOrders.reduce((sum, o) => sum + o.order_items.reduce((s, i) => s + i.quantity, 0), 0)} cake{dayOrders.reduce((sum, o) => sum + o.order_items.reduce((s, i) => s + i.quantity, 0), 0) > 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-3 pl-2">
            {dayOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
