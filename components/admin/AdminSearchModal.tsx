"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, ShoppingBag, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "product" | "order" | "customer";
  id: string;
  label: string;
  sub: string;
  href: string;
}

interface AdminSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function AdminSearchModal({ open, onClose }: AdminSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const supabase = createClient();

    const [products, orders, customers] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, slug, base_price")
        .ilike("name", `%${q}%`)
        .limit(4),
      supabase
        .from("orders")
        .select("id, order_number, status, total")
        .ilike("order_number", `%${q}%`)
        .limit(4),
      supabase
        .from("users")
        .select("id, name, email, phone")
        .or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(4),
    ]);

    const res: SearchResult[] = [
      ...((products.data ?? []) as { id: string; name: string; base_price: string }[]).map((p) => ({
        type: "product" as const,
        id: p.id,
        label: p.name,
        sub: `Rs. ${parseFloat(p.base_price).toLocaleString()}`,
        href: `/admin/products/${p.id}/edit`,
      })),
      ...((orders.data ?? []) as { id: string; order_number: string; status: string; total: string }[]).map((o) => ({
        type: "order" as const,
        id: o.id,
        label: o.order_number,
        sub: o.status,
        href: `/admin/orders/${o.order_number}`,
      })),
      ...((customers.data ?? []) as { id: string; name: string; email: string }[]).map((c) => ({
        type: "customer" as const,
        id: c.id,
        label: c.name,
        sub: c.email,
        href: `/admin/customers/${c.id}`,
      })),
    ];
    setResults(res);
    setSelected(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 250);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); }
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose(); else {
          // trigger open — parent controls this
        }
      }
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setSelected((s) => Math.min(s + 1, results.length - 1));
      if (e.key === "ArrowUp") setSelected((s) => Math.max(s - 1, 0));
      if (e.key === "Enter" && results[selected]) {
        router.push(results[selected].href);
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, results, selected, onClose, router]);

  if (!open) return null;

  const icons = { product: Package, order: ShoppingBag, customer: Users };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-ink-light shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, orders, customers…"
            className="flex-1 text-sm outline-none bg-transparent text-ink placeholder:text-ink-light/60"
          />
          <button onClick={onClose} className="text-ink-light hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading && (
          <div className="px-4 py-6 text-center text-sm text-ink-light">Searching…</div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-ink-light">No results found.</div>
        )}

        {results.length > 0 && (
          <ul className="py-2 max-h-80 overflow-y-auto">
            {results.map((r, i) => {
              const Icon = icons[r.type];
              return (
                <li key={r.id}>
                  <button
                    onMouseEnter={() => setSelected(i)}
                    onClick={() => { router.push(r.href); onClose(); }}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors",
                      i === selected ? "bg-cream" : "hover:bg-cream/50"
                    )}
                  >
                    <Icon className="h-4 w-4 text-wine shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{r.label}</p>
                      <p className="text-xs text-ink-light truncate">{r.sub}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {!query && (
          <div className="px-4 py-6 text-center text-xs text-ink-light">
            Type to search products, orders, or customers
          </div>
        )}
      </div>
    </div>
  );
}
