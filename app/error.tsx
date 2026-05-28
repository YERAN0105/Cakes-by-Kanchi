"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-8" aria-hidden="true">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" fill="hsl(345,40%,88%)" />
          <path d="M40 24v20M40 52v4" stroke="hsl(345,50%,35%)" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>

      <p className="label-small text-wine mb-2">Something went wrong</p>
      <h1 className="font-display text-3xl sm:text-4xl text-ink mb-4">
        An unexpected error occurred
      </h1>
      <div className="w-16 h-px bg-champagne mx-auto mb-6" />
      <p className="font-body text-ink-light max-w-sm mb-8 leading-relaxed">
        We apologise for the inconvenience. Please try again or contact us if the problem persists.
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={reset}
          className="btn-primary inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try Again
        </button>
        <Link href="/" className="btn-secondary">
          Go Home
        </Link>
      </div>
    </div>
  );
}
