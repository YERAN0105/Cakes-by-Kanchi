"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-wine text-cream text-sm font-body font-medium hover:bg-wine/90 transition-colors"
    >
      <Printer className="w-4 h-4" aria-hidden="true" />
      Print / Save as PDF
    </button>
  );
}
