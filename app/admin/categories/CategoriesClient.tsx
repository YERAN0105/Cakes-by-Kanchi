"use client";

import { useState, useTransition } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  type CategoryFormData,
} from "@/lib/actions/admin";
import type { CategoryRow } from "@/types/database";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  image_url: z.string().nullable().optional(),
  display_order: z.number().int().min(0),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface CategoryModalProps {
  category?: CategoryRow | null;
  onClose: () => void;
}

function CategoryModal({ category, onClose }: CategoryModalProps) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      image_url: category?.image_url ?? "",
      display_order: category?.display_order ?? 0,
      is_active: category?.is_active ?? true,
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const data: CategoryFormData = {
        ...values,
        description: values.description || undefined,
        image_url: values.image_url || null,
      };
      const result = category
        ? await updateCategoryAction(category.id, data)
        : await createCategoryAction(data);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success(category ? "Category updated." : "Category created.");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink">{category ? "Edit" : "New"} Category</h2>
          <button onClick={onClose} className="text-ink-light hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input
              {...register("name")}
              className="input"
              onBlur={(e) => {
                if (!category) setValue("slug", slugify(e.target.value));
              }}
            />
            {errors.name && <p className="error">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Slug *</label>
            <input {...register("slug")} className="input" />
            {errors.slug && <p className="error">{errors.slug.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea {...register("description")} rows={2} className="input" />
          </div>
          <div>
            <label className="label">Image URL</label>
            <input {...register("image_url")} className="input" placeholder="https://..." />
          </div>
          <div>
            <label className="label">Display Order</label>
            <input {...register("display_order", { valueAsNumber: true })} type="number" className="input w-24" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("is_active")} className="h-4 w-4 rounded text-wine" />
            <span className="text-sm text-ink">Active</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg text-ink-light">Cancel</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-wine text-cream rounded-lg hover:bg-wine-light disabled:opacity-50">
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CategoriesClient({ categories: initial }: { categories: CategoryRow[] }) {
  const [categories, setCategories] = useState(initial);
  const [modal, setModal] = useState<{ open: boolean; category: CategoryRow | null }>({ open: false, category: null });
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"?`)) return;
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if ("error" in result) { toast.error(result.error); return; }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted.");
    });
  }

  return (
    <>
      {modal.open && (
        <CategoryModal
          category={modal.category}
          onClose={() => { setModal({ open: false, category: null }); window.location.reload(); }}
        />
      )}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <span className="text-sm text-ink-light">{categories.length} categories</span>
          <button
            onClick={() => setModal({ open: true, category: null })}
            className="flex items-center gap-2 px-3 py-1.5 bg-wine text-cream rounded-lg text-sm hover:bg-wine-light"
          >
            <Plus className="h-4 w-4" /> Add Category
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-ink-light border-b border-border">
            <tr>
              <th className="text-left px-6 py-3">Name</th>
              <th className="text-left px-6 py-3">Slug</th>
              <th className="text-left px-6 py-3">Order</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-right px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-ink">{c.name}</td>
                <td className="px-6 py-3 text-ink-light">{c.slug}</td>
                <td className="px-6 py-3 text-ink-light">{c.display_order}</td>
                <td className="px-6 py-3">
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", c.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")}>
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setModal({ open: true, category: c })} className="p-1.5 rounded text-ink-light hover:text-wine hover:bg-wine/10">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.name)} disabled={isPending} className="p-1.5 rounded text-ink-light hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-ink-light text-sm">No categories yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
