"use client";

import { MessageCircle } from "lucide-react";
import { whatsappUrl, brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl(`Hi! I'd like to enquire about ordering a cake from ${brand.name}.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "flex items-center justify-center w-14 h-14 rounded-full",
        "bg-[#25D366] text-white shadow-lg",
        "hover:bg-[#20ba5a] hover:scale-110 transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      )}
    >
      <MessageCircle className="w-7 h-7 fill-white stroke-none" aria-hidden="true" />
    </a>
  );
}
