"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Heart,
  Gift,
  Star,
  User,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/loyalty", label: "Loyalty Points", icon: Gift },
  { href: "/account/reviews", label: "Reviews", icon: Star },
  { href: "/account/profile", label: "Profile", icon: User },
];

interface AccountSidebarProps {
  userName: string;
  userEmail: string;
}

export function AccountSidebar({ userName, userEmail }: AccountSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="w-full lg:w-60 shrink-0">
      {/* User identity */}
      <div className="mb-6 pb-5 border-b border-border">
        <div className="w-12 h-12 rounded-full bg-blush flex items-center justify-center mb-3">
          <span className="font-display text-wine text-lg font-semibold">
            {userName
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase() ?? "")
              .join("")}
          </span>
        </div>
        <p className="font-display text-ink font-semibold leading-tight">{userName}</p>
        <p className="text-xs text-ink-light font-body mt-0.5 truncate">{userEmail}</p>
      </div>

      {/* Navigation */}
      <nav aria-label="Account navigation">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors duration-150",
                  isActive(href, exact)
                    ? "bg-wine text-cream font-medium"
                    : "text-ink hover:text-wine hover:bg-blush-light"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}

          <li className="pt-2 border-t border-border mt-2">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-body text-ink-light hover:text-destructive hover:bg-blush-light transition-colors duration-150"
              >
                <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                Sign Out
              </button>
            </form>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
