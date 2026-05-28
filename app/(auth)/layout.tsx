import type { ReactNode } from "react";
import Link from "next/link";
import { brand } from "@/lib/brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Decorative top accent */}
      <div className="h-1 bg-gradient-to-r from-blush via-wine to-blush opacity-60" />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {/* Background ornament */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blush/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-rose/10 blur-3xl" />
        </div>
        <div className="relative w-full">{children}</div>
      </main>

      <footer className="text-center text-xs text-ink-light font-body py-4 border-t border-border">
        &copy; {new Date().getFullYear()} {brand.name} &middot;{" "}
        <Link href="/privacy" className="hover:text-wine transition-colors">
          Privacy Policy
        </Link>{" "}
        &middot;{" "}
        <Link href="/terms" className="hover:text-wine transition-colors">
          Terms
        </Link>
      </footer>
    </div>
  );
}
