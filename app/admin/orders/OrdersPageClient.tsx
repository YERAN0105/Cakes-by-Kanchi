"use client";

import { useState } from "react";
import { CalendarDays, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrdersTableClient } from "./OrdersTableClient";
import { BakingScheduleClient } from "./BakingScheduleClient";
import type { OrderRow } from "./OrdersTableClient";
import type { ScheduleOrder } from "./BakingScheduleClient";

interface OrdersPageClientProps {
  orders: OrderRow[];
  scheduleOrders: ScheduleOrder[];
}

export function OrdersPageClient({ orders, scheduleOrders }: OrdersPageClientProps) {
  const [tab, setTab] = useState<"all" | "schedule">("schedule");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("schedule")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            tab === "schedule"
              ? "bg-wine text-cream shadow-sm"
              : "bg-white border border-border text-ink-light hover:text-ink hover:border-ink"
          )}
        >
          <CalendarDays className="h-4 w-4" />
          Baking Schedule
          {scheduleOrders.length > 0 && (
            <span className={cn(
              "text-xs rounded-full px-1.5 py-0.5 font-semibold",
              tab === "schedule" ? "bg-white/20 text-cream" : "bg-wine/10 text-wine"
            )}>
              {scheduleOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("all")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            tab === "all"
              ? "bg-wine text-cream shadow-sm"
              : "bg-white border border-border text-ink-light hover:text-ink hover:border-ink"
          )}
        >
          <List className="h-4 w-4" />
          All Orders
        </button>
      </div>

      {tab === "schedule" ? (
        <BakingScheduleClient orders={scheduleOrders} />
      ) : (
        <OrdersTableClient orders={orders} />
      )}
    </div>
  );
}
