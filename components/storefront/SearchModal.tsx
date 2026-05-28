"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  minPrice: number;
  imageUrl: string | null;
}

export function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchResults(query), 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, fetchResults]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        router.push(`/cakes/${results[activeIndex].slug}`);
        onClose();
      } else if (query.trim()) {
        router.push(`/cakes?q=${encodeURIComponent(query.trim())}`);
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleViewAll = () => {
    if (query.trim()) {
      router.push(`/cakes?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="mx-auto mt-16 max-w-xl px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input bar */}
        <div className="relative flex items-center bg-card rounded-xl border border-border shadow-xl overflow-hidden">
          <Search className="absolute left-4 w-5 h-5 text-ink-light shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search cakes, flavours, occasions…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            className="w-full pl-12 pr-12 py-4 bg-transparent font-body text-ink placeholder:text-ink-light focus:outline-none text-base"
            aria-label="Search products"
            aria-autocomplete="list"
          />
          {loading ? (
            <Loader2 className="absolute right-4 w-5 h-5 text-ink-light animate-spin" aria-hidden="true" />
          ) : query ? (
            <button
              onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
              className="absolute right-4 p-1 rounded text-ink-light hover:text-ink transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Results dropdown */}
        <AnimatePresence>
          {(results.length > 0 || (query.trim().length >= 2 && !loading)) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="mt-2 bg-card rounded-xl border border-border shadow-xl overflow-hidden"
              role="listbox"
              aria-label="Search suggestions"
            >
              {results.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="font-display text-lg text-ink mb-1">No results found</p>
                  <p className="text-sm text-ink-light">Try a different search term</p>
                </div>
              ) : (
                <>
                  {results.map((result, i) => (
                    <Link
                      key={result.id}
                      href={`/cakes/${result.slug}`}
                      onClick={onClose}
                      role="option"
                      aria-selected={i === activeIndex}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 transition-colors border-b border-border last:border-0",
                        i === activeIndex ? "bg-blush-light" : "hover:bg-cream"
                      )}
                    >
                      {result.imageUrl ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-blush-light">
                          <Image
                            src={result.imageUrl}
                            alt={result.name}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-blush-light shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-medium text-ink text-sm truncate">{result.name}</p>
                        {result.category && (
                          <p className="text-xs text-ink-light">{result.category}</p>
                        )}
                      </div>
                      <p className="text-sm font-body font-medium text-wine shrink-0">
                        from {formatCurrency(result.minPrice)}
                      </p>
                    </Link>
                  ))}

                  <button
                    onClick={handleViewAll}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-body text-wine hover:bg-blush-light transition-colors"
                  >
                    View all results for &ldquo;{query}&rdquo;
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
