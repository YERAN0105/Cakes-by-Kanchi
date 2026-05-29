"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronDown, LogOut, Package, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { Container } from "@/components/shared/Container";
import { SearchModal } from "@/components/storefront/SearchModal";
import { useWishlistStore } from "@/stores/wishlist";
import { useCartStore } from "@/stores/cart";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/types/database";

const OTHER_NAV = [
  { href: "/custom-cake", label: "Custom Cake" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

interface HeaderProps {
  categories: CategoryRow[];
  user: { id: string; name: string; email: string } | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Header({ categories, user }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCakesOpen, setMobileCakesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const wishlistCount = useWishlistStore((s) => s.count);
  const cartCount = useCartStore((s) => s.count);
  const openCartDrawer = useCartStore((s) => s.openDrawer);
  const cartHydrated = useCartStore((s) => s._hasHydrated);

  const [cartBump, setCartBump] = useState(false);
  const prevCartCount = useRef(cartCount);
  useEffect(() => {
    if (cartHydrated && cartCount > prevCartCount.current) {
      setCartBump(true);
    }
    prevCartCount.current = cartCount;
  }, [cartCount, cartHydrated]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setMobileCakesOpen(false); }, [pathname]);
  useEffect(() => { setSearchOpen(false); }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const cakesActive = pathname === "/cakes" || pathname.startsWith("/cakes/");
  const accountActive = pathname.startsWith("/account");

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logoutAction();
    router.refresh();
  };

  return (
    <>
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
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1 font-body text-sm tracking-wide transition-colors duration-200 hover:text-wine",
                  cakesActive ? "text-wine font-medium" : "text-ink"
                )}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                Cakes
                <ChevronDown
                  className={cn("w-3.5 h-3.5 transition-transform duration-200", dropdownOpen && "rotate-180")}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 bg-cream border border-border rounded-xl shadow-lg py-2 z-50"
                  >
                    <Link
                      href="/cakes"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm font-body text-ink-light hover:text-wine hover:bg-blush-light transition-colors"
                    >
                      All Cakes
                    </Link>
                    <div className="h-px bg-border mx-3 my-1" />
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/cakes/category/${cat.slug}`}
                        onClick={() => setDropdownOpen(false)}
                        className={cn(
                          "block px-4 py-2 text-sm font-body transition-colors hover:text-wine hover:bg-blush-light",
                          pathname === `/cakes/category/${cat.slug}` ? "text-wine font-medium" : "text-ink"
                        )}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {OTHER_NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-body text-sm tracking-wide transition-colors duration-200 hover:text-wine",
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
            <button
              type="button"
              aria-label="Open search"
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-md text-ink hover:text-wine hover:bg-blush-light transition-colors duration-200"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>

            <Link
              href="/account/wishlist"
              aria-label={`Wishlist (${wishlistCount} items)`}
              className="relative p-2 rounded-md text-ink hover:text-wine hover:bg-blush-light transition-colors duration-200"
            >
              <Heart className="w-5 h-5" aria-hidden="true" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-wine text-cream text-[10px] font-medium flex items-center justify-center leading-none">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* User icon / avatar */}
            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label="Account menu"
                  aria-expanded={userMenuOpen}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold font-body transition-colors duration-200",
                    accountActive || userMenuOpen
                      ? "bg-wine text-cream"
                      : "bg-blush text-wine hover:bg-wine hover:text-cream"
                  )}
                >
                  {getInitials(user.name)}
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-3 w-52 bg-cream border border-border rounded-xl shadow-lg py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-border mb-1">
                        <p className="text-sm font-medium text-ink font-body truncate">{user.name}</p>
                        <p className="text-xs text-ink-light font-body truncate">{user.email}</p>
                      </div>
                      <Link href="/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm font-body text-ink hover:text-wine hover:bg-blush-light transition-colors">
                        <User className="w-4 h-4" aria-hidden="true" /> My Account
                      </Link>
                      <Link href="/account/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm font-body text-ink hover:text-wine hover:bg-blush-light transition-colors">
                        <Package className="w-4 h-4" aria-hidden="true" /> My Orders
                      </Link>
                      <Link href="/account/addresses" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm font-body text-ink hover:text-wine hover:bg-blush-light transition-colors">
                        <MapPin className="w-4 h-4" aria-hidden="true" /> Addresses
                      </Link>
                      <div className="h-px bg-border mx-3 my-1" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm font-body text-ink-light hover:text-destructive hover:bg-blush-light transition-colors"
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/account"
                aria-label="Account"
                className="p-2 rounded-md text-ink hover:text-wine hover:bg-blush-light transition-colors duration-200"
              >
                <User className="w-5 h-5" aria-hidden="true" />
              </Link>
            )}

            <button
              type="button"
              onClick={openCartDrawer}
              aria-label={`Cart (${cartHydrated ? cartCount : 0} items)`}
              className="relative p-2 rounded-md text-ink hover:text-wine hover:bg-blush-light transition-colors duration-200"
            >
              <motion.span
                className="inline-flex"
                animate={cartBump ? { scale: [1, 1.35, 0.85, 1.1, 1] } : {}}
                transition={{ duration: 0.4 }}
                onAnimationComplete={() => setCartBump(false)}
              >
                <ShoppingBag className="w-5 h-5" aria-hidden="true" />
              </motion.span>
              {cartHydrated && cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-wine text-cream text-[10px] font-medium flex items-center justify-center leading-none">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>

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

        {/* Mobile menu */}
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
                <button
                  type="button"
                  onClick={() => setMobileCakesOpen((v) => !v)}
                  className={cn(
                    "flex items-center justify-between font-body text-base py-3 px-3 rounded-md transition-colors duration-150",
                    cakesActive ? "text-wine bg-blush-light font-medium" : "text-ink hover:text-wine hover:bg-blush-light"
                  )}
                >
                  Cakes
                  <ChevronDown
                    className={cn("w-4 h-4 transition-transform duration-200", mobileCakesOpen && "rotate-180")}
                    aria-hidden="true"
                  />
                </button>

                <AnimatePresence>
                  {mobileCakesOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden pl-3"
                    >
                      <Link
                        href="/cakes"
                        className="block font-body text-sm py-2.5 px-3 rounded-md text-ink-light hover:text-wine hover:bg-blush-light transition-colors"
                      >
                        All Cakes
                      </Link>
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/cakes/category/${cat.slug}`}
                          className={cn(
                            "block font-body text-sm py-2.5 px-3 rounded-md transition-colors hover:text-wine hover:bg-blush-light",
                            pathname === `/cakes/category/${cat.slug}` ? "text-wine font-medium" : "text-ink"
                          )}
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {OTHER_NAV.map((link) => (
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

                {user ? (
                  <>
                    <div className="px-3 py-2">
                      <p className="text-xs text-ink-light font-body">Signed in as</p>
                      <p className="text-sm font-medium text-ink font-body truncate">{user.name}</p>
                    </div>
                    <Link href="/account" className="font-body text-base py-3 px-3 rounded-md text-ink hover:text-wine hover:bg-blush-light transition-colors">
                      My Account
                    </Link>
                    <Link href="/account/orders" className="font-body text-base py-3 px-3 rounded-md text-ink hover:text-wine hover:bg-blush-light transition-colors">
                      My Orders
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-left font-body text-base py-3 px-3 rounded-md text-ink-light hover:text-destructive hover:bg-blush-light transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/account" className="font-body text-base py-3 px-3 rounded-md text-ink hover:text-wine hover:bg-blush-light transition-colors">
                      My Account
                    </Link>
                    <Link href="/login" className="font-body text-base py-3 px-3 rounded-md text-ink hover:text-wine hover:bg-blush-light transition-colors">
                      Sign In
                    </Link>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); setSearchOpen(true); }}
                  className="text-left font-body text-base py-3 px-3 rounded-md text-ink hover:text-wine hover:bg-blush-light transition-colors"
                >
                  Search
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
