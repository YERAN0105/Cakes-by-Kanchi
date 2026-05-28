import Link from "next/link";
import { brand } from "@/lib/brand";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 text-center">
      {/* SVG cake illustration */}
      <div className="mb-8" aria-hidden="true">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Cake base */}
          <rect x="20" y="70" width="80" height="30" rx="6" fill="hsl(345,40%,88%)" />
          {/* Middle tier */}
          <rect x="30" y="45" width="60" height="28" rx="5" fill="hsl(345,35%,78%)" />
          {/* Top tier */}
          <rect x="40" y="25" width="40" height="22" rx="4" fill="hsl(345,50%,35%)" opacity="0.85" />
          {/* Candle */}
          <rect x="57" y="12" width="6" height="14" rx="2" fill="hsl(38,45%,82%)" />
          {/* Flame */}
          <ellipse cx="60" cy="10" rx="3" ry="4" fill="hsl(38,80%,65%)" opacity="0.9" />
          {/* Decorative dots */}
          <circle cx="35" cy="58" r="3" fill="hsl(345,50%,35%)" opacity="0.3" />
          <circle cx="55" cy="56" r="3" fill="hsl(345,50%,35%)" opacity="0.3" />
          <circle cx="75" cy="58" r="3" fill="hsl(345,50%,35%)" opacity="0.3" />
        </svg>
      </div>

      <p className="label-small text-wine mb-2">404 — Page Not Found</p>
      <h1 className="font-display text-4xl sm:text-5xl text-ink mb-4 leading-tight">
        This page has been
        <span className="block font-accent text-wine italic text-5xl sm:text-6xl mt-1">
          eaten already
        </span>
      </h1>
      <div className="w-16 h-px bg-champagne mx-auto mb-6" aria-hidden="true" />
      <p className="font-body text-ink-light max-w-sm mb-8 leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you
        back to something delicious.
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/" className="btn-primary">
          Back to Home
        </Link>
        <Link href="/cakes" className="btn-secondary">
          Browse Cakes
        </Link>
      </div>

      <p className="mt-12 text-xs font-body text-ink-light/50">{brand.name}</p>
    </div>
  );
}
