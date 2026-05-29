"use client";

import { useState, useTransition } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createAddonAction, updateAddonAction, deleteAddonAction } from "@/lib/actions/admin";
import type { AddonRow } from "@/types/database";
import { formatCurrency } from "@/lib/brand";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  price: z.string().min(1, "Price is required"),
  stock_tracked: z.boolean(),
  stock_quantity: z.number().int().min(0),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function AddonModal({ addon, onClose }: { addon?: AddonRow | null; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: addon?.name ?? "",
      description: addon?.description ?? "",
      image_url: addon?.image_url ?? "",
      price: addon?.price ?? "",
      stock_tracked: addon?.stock_tracked ?? false,
      stock_quantity: addon?.stock_quantity ?? 0,
      is_active: addon?.is_active ?? true,
    },
  });

  const stockTracked = watch("stock_tracked");

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const data = { ...values, description: values.description || null, image_url: values.image_url || null };
      const result = addon ? await updateAddonAction(addon.id, data) : await createAddonAction(data);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success(addon ? "Add-on updated." : "Add-on created.");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink">{addon ? "Edit" : "New"} Add-On</h2>
          <button onClick={onClose} className="text-ink-light hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input {...register("name")} className="input" />
            {errors.name && <p className="error">{errors.name.message}</p>}
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
            <label className="label">Price (LKR) *</label>
            <input {...register("price")} className="input" placeholder="e.g. 150" />
            {errors.price && <p className="error">{errors.price.message}</p>}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("stock_tracked")} className="h-4 w-4 rounded text-wine" />
            <span className="text-sm text-ink">Track stock</span>
          </label>
          {stockTracked && (
            <div>
              <label className="label">Stock Quantity</label>
              <input {...register("stock_quantity", { valueAsNumber: true })} type="number" className="input w-24" />
            </div>
          )}
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

export function AddonsClient({ addons: initial }: { addons: AddonRow[] }) {
  const [addons, setAddons] = useState(initial);
  const [modal, setModal] = useState<{ open: boolean; addon: AddonRow | null }>({ open: false, addon: null });
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete add-on "${name}"?`)) return;
    startTransition(async () => {
      const result = await deleteAddonAction(id);
      if ("error" in result) { toast.error(result.error); return; }
      setAddons((prev) => prev.filter((a) => a.id !== id));
      toast.success("Add-on deleted.");
    });
  }

  return (
    <>
      {modal.open && (
        <AddonModal
          addon={modal.addon}
          onClose={() => { setModal({ open: false, addon: null }); window.location.reload(); }}
        />
      )}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <span className="text-sm text-ink-light">{addons.length} add-ons</span>
          <button onClick={() => setModal({ open: true, addon: null })} className="flex items-center gap-2 px-3 py-1.5 bg-wine text-cream rounded-lg text-sm hover:bg-wine-light">
            <Plus className="h-4 w-4" /> Add Add-On
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {addons.map((addon) => (
            <div key={addon.id} className="border border-border rounded-lg p-4 flex items-start gap-3">
              {addon.image_url ? (
                <div className="relative h-12 w-12 rounded-lg overflow-hidden shrink-0">
                  <Image src={addon.image_url} alt={addon.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-lg bg-blush-light shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink text-sm">{addon.name}</p>
                <p className="text-xs text-ink-light">{formatCurrency(parseFloat(addon.price))}</p>
                <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-full text-xs mt-1", addon.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")}>
                  {addon.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setModal({ open: true, addon })} className="p-1.5 rounded text-ink-light hover:text-wine hover:bg-wine/10">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(addon.id, addon.name)} disabled={isPending} className="p-1.5 rounded text-ink-light hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {addons.length === 0 && <p className="col-span-3 py-8 text-center text-ink-light text-sm">No add-ons yet.</p>}
        </div>
      </div>
    </>
  );
}
