"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { Container } from "@/components/shared/Container";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/cakes", label: "Cakes" },
  { href: "/custom-cake", label: "Custom Cake" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-cream/95 backdrop-blur-sm transition-shadow duration-300",
        scrolled ? "shadow-md shadow-blush/20" : "shadow-none"
      )}
    >
      <Container className="flex items-center justify-between h-16 lg:h-18">
        {/* Logo */}
        <BrandLogo size="sm" />

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "font-body text-sm tracking-wide transition-colors duration-200",
                "hover:text-wine",
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "text-wine font-medium"
                  : "text-ink"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <IconButton href="/search" label="Search" icon={<Search className="w-5 h-5" />} />
          <IconButton href="/account/wishlist" label="Wishlist" icon={<Heart className="w-5 h-5" />} />
          <IconButton href="/account" label="Account" icon={<User className="w-5 h-5" />} />
          {/* Cart with badge */}
          <Link
            href="/cart"
            aria-label="Cart (0 items)"
            className="relative p-2 rounded-md text-ink hover:text-wine hover:bg-blush-light transition-colors duration-200"
          >
            <ShoppingBag className="w-5 h-5" aria-hidden="true" />
            {/* Badge placeholder — will be driven by Zustand store in Phase 3 */}
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 rounded-md text-ink hover:text-wine hover:bg-blush-light transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </Container>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden border-t border-border bg-cream"
          >
            <nav className="flex flex-col py-4 px-4 gap-1" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "font-body text-base py-3 px-3 rounded-md transition-colors duration-150",
                    pathname === link.href
                      ? "text-wine bg-blush-light font-medium"
                      : "text-ink hover:text-wine hover:bg-blush-light"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-border my-2" />
              <Link
                href="/account"
                className="font-body text-base py-3 px-3 rounded-md text-ink hover:text-wine hover:bg-blush-light transition-colors"
              >
                My Account
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function IconButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="p-2 rounded-md text-ink hover:text-wine hover:bg-blush-light transition-colors duration-200"
    >
      {icon}
    </Link>
  );
}
