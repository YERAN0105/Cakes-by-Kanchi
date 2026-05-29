"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/brand";
import { cn } from "@/lib/utils";
import type { PriceLineItem } from "@/types/database";

interface Props {
  breakdown: PriceLineItem[];
  quantity: number;
  lineTotal: number;
}

export function OrderItemBreakdown({ breakdown, quantity, lineTotal }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-wine hover:text-wine/80 transition-colors font-body"
      >
        <ChevronDown className={cn("w-3 h-3 transition-transform", open ? "rotate-180" : "")} />
        How is this calculated?
      </button>
      {open && (
        <div className="mt-1.5 pl-2 border-l-2 border-blush space-y-0.5">
          {breakdown.map((line, i) => (
            <div key={i} className="flex justify-between text-xs font-body text-ink-light">
              <span>{line.label}</span>
              <span>{i === 0 ? formatCurrency(line.amount) : `+${formatCurrency(line.amount)}`}</span>
            </div>
          ))}
          <div className="flex justify-between text-xs font-body font-medium text-ink border-t border-border pt-1 mt-1">
            <span>Unit price{quantity > 1 ? ` × ${quantity}` : ""}</span>
            <span>{formatCurrency(lineTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
