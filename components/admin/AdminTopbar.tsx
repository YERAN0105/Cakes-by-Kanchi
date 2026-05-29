"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { AdminSearchModal } from "./AdminSearchModal";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/orders": "Orders",
  "/admin/products": "Products",
  "/admin/products/new": "New Product",
  "/admin/categories": "Categories",
  "/admin/addons": "Add-Ons",
  "/admin/customers": "Customers",
  "/admin/inquiries": "Custom Inquiries",
  "/admin/payments/pending": "Payments Pending",
  "/admin/coupons": "Coupons",
  "/admin/banners": "Banners",
  "/admin/delivery-zones": "Delivery Zones",
  "/admin/schedule": "Schedule",
  "/admin/reviews": "Reviews",
  "/admin/loyalty": "Loyalty Settings",
  "/admin/settings": "Settings",
  "/admin/logs": "Activity Logs",
};

function deriveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.includes("/edit")) return "Edit Product";
  if (pathname.match(/\/admin\/orders\/[^/]+$/)) return "Order Detail";
  if (pathname.match(/\/admin\/customers\/[^/]+$/)) return "Customer Detail";
  if (pathname.match(/\/admin\/inquiries\/[^/]+$/)) return "Inquiry Detail";
  return "Admin";
}

export function AdminTopbar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const title = deriveTitle(pathname);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className="h-14 bg-white border-b border-border flex items-center px-6 gap-4 sticky top-0 z-30">
        <h1 className="font-display text-xl text-ink flex-1">{title}</h1>
        <button
          onClick={() => setSearchOpen(true)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm text-ink-light",
            "hover:border-wine/40 hover:text-ink transition-colors bg-cream/50"
          )}
          aria-label="Open global search"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline ml-1 text-xs bg-muted px-1 py-0.5 rounded">⌘K</kbd>
        </button>
      </header>
      <AdminSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
