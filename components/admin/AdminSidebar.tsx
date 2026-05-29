"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tag,
  Gift,
  Users,
  MessageSquare,
  CreditCard,
  Ticket,
  Image,
  MapPin,
  Calendar,
  Star,
  Trophy,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { brand } from "@/lib/brand";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/addons", label: "Add-Ons", icon: Gift },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/inquiries", label: "Custom Inquiries", icon: MessageSquare },
  { href: "/admin/payments/pending", label: "Payments Pending", icon: CreditCard },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/banners", label: "Banners", icon: Image },
  { href: "/admin/delivery-zones", label: "Delivery Zones", icon: MapPin },
  { href: "/admin/schedule", label: "Schedule", icon: Calendar },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/loyalty", label: "Loyalty", icon: Trophy },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/logs", label: "Activity Logs", icon: FileText },
];

interface AdminSidebarProps {
  adminName: string;
  adminEmail: string;
}

export function AdminSidebar({ adminName, adminEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className={cn(
        "flex flex-col bg-ink text-cream h-screen sticky top-0 transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-white/10">
        {!collapsed && (
          <Link href="/admin" className="font-display text-lg text-cream truncate">
            {brand.name} Admin
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-cream/60 hover:text-cream transition-colors p-1"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-body transition-colors",
                isActive
                  ? "bg-wine text-cream"
                  : "text-cream/70 hover:bg-white/10 hover:text-cream"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Admin profile + logout */}
      <div className="border-t border-white/10 p-3">
        {!collapsed && (
          <div className="mb-2 px-1">
            <p className="text-cream text-sm font-medium truncate">{adminName}</p>
            <p className="text-cream/50 text-xs truncate">{adminEmail}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-cream/70 hover:bg-white/10 hover:text-cream text-sm transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
