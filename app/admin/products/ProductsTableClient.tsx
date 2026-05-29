"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toggleProductPublishedAction, deleteProductAction } from "@/lib/actions/admin";
import { formatCurrency } from "@/lib/brand";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/types/database";

interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: string;
  is_published: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  stock_tracked: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  category_id: string | null;
  categories: { name: string } | null;
  product_images: { url: string; is_primary: boolean }[];
}

interface ProductsTableClientProps {
  products: Product[];
  categories: CategoryRow[];
}

export function ProductsTableClient({ products: initialProducts, categories }: ProductsTableClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.category_id === categoryFilter;
    const matchesPublished =
      !publishedFilter ||
      (publishedFilter === "published" ? p.is_published : !p.is_published);
    return matchesSearch && matchesCategory && matchesPublished;
  });

  function handleTogglePublished(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleProductPublishedAction(id, !current);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_published: !current } : p))
        );
        toast.success(!current ? "Product published." : "Product unpublished.");
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteProductAction(id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success("Product deleted.");
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="px-6 py-4 border-b border-border flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="px-3 py-1.5 border border-border rounded-lg text-sm outline-none focus:border-wine w-48"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 border border-border rounded-lg text-sm outline-none focus:border-wine"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={publishedFilter}
          onChange={(e) => setPublishedFilter(e.target.value)}
          className="px-3 py-1.5 border border-border rounded-lg text-sm outline-none focus:border-wine"
        >
          <option value="">All status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <span className="ml-auto text-sm text-ink-light self-center">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-ink-light text-xs border-b border-border">
            <tr>
              <th className="text-left px-6 py-3 font-medium">Product</th>
              <th className="text-left px-6 py-3 font-medium">Category</th>
              <th className="text-left px-6 py-3 font-medium">Price</th>
              <th className="text-left px-6 py-3 font-medium">Status</th>
              <th className="text-left px-6 py-3 font-medium">Stock</th>
              <th className="text-right px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => {
              const primaryImage = p.product_images.find((i) => i.is_primary) ?? p.product_images[0];
              const isLowStock = p.stock_tracked && p.stock_quantity <= p.low_stock_threshold;
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {primaryImage ? (
                        <div className="relative h-10 w-10 rounded-md overflow-hidden shrink-0">
                          <Image src={primaryImage.url} alt={p.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-blush-light shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-ink-light">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-ink-light">{p.categories?.name ?? "—"}</td>
                  <td className="px-6 py-3 font-medium">{formatCurrency(parseFloat(p.base_price))}</td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          p.is_published
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {p.is_published ? "Published" : "Draft"}
                      </span>
                      {p.is_featured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-champagne text-ink">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    {p.stock_tracked ? (
                      <span
                        className={cn(
                          "text-sm",
                          isLowStock ? "text-red-600 font-medium" : "text-ink-light"
                        )}
                      >
                        {p.stock_quantity} {isLowStock && "⚠"}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-light">Not tracked</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleTogglePublished(p.id, p.is_published)}
                        disabled={isPending}
                        title={p.is_published ? "Unpublish" : "Publish"}
                        className="p-1.5 rounded text-ink-light hover:text-ink hover:bg-gray-100 transition-colors"
                      >
                        {p.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="p-1.5 rounded text-ink-light hover:text-wine hover:bg-wine/10 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={isPending}
                        className="p-1.5 rounded text-ink-light hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-ink-light text-sm">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
