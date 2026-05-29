"use client";

import { useState, useTransition } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createBannerAction, updateBannerAction, deleteBannerAction, type BannerFormData } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";

export interface BannerRow {
  id: string;
  image_url: string;
  headline: string | null;
  subheadline: string | null;
  cta_text: string | null;
  cta_link: string | null;
  position: string;
  display_order: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

const schema = z.object({
  image_url: z.string().min(1, "Image URL required"),
  headline: z.string().nullable().optional(),
  subheadline: z.string().nullable().optional(),
  cta_text: z.string().nullable().optional(),
  cta_link: z.string().nullable().optional(),
  position: z.string(),
  display_order: z.number().int().min(0),
  valid_from: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function BannerModal({ banner, onClose }: { banner?: BannerRow | null; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      image_url: banner?.image_url ?? "",
      headline: banner?.headline ?? "",
      subheadline: banner?.subheadline ?? "",
      cta_text: banner?.cta_text ?? "",
      cta_link: banner?.cta_link ?? "",
      position: banner?.position ?? "hero",
      display_order: banner?.display_order ?? 0,
      valid_from: banner?.valid_from ? banner.valid_from.slice(0, 10) : "",
      valid_until: banner?.valid_until ? banner.valid_until.slice(0, 10) : "",
      is_active: banner?.is_active ?? true,
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const data: BannerFormData = {
        ...values,
        headline: values.headline || null,
        subheadline: values.subheadline || null,
        cta_text: values.cta_text || null,
        cta_link: values.cta_link || null,
        valid_from: values.valid_from || null,
        valid_until: values.valid_until || null,
      };
      const result = banner ? await updateBannerAction(banner.id, data) : await createBannerAction(data);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success(banner ? "Banner updated." : "Banner created.");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink">{banner ? "Edit" : "New"} Banner</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-ink-light" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Image URL *</label>
            <input {...register("image_url")} className="input" placeholder="https://..." />
            {errors.image_url && <p className="error">{errors.image_url.message}</p>}
          </div>
          <div><label className="label">Headline</label><input {...register("headline")} className="input" /></div>
          <div><label className="label">Sub-headline</label><input {...register("subheadline")} className="input" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">CTA Text</label><input {...register("cta_text")} className="input" placeholder="Shop Now" /></div>
            <div><label className="label">CTA Link</label><input {...register("cta_link")} className="input" placeholder="/cakes" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Position</label>
              <select {...register("position")} className="input">
                <option value="hero">Hero</option>
                <option value="promo">Promo Strip</option>
              </select>
            </div>
            <div><label className="label">Display Order</label><input {...register("display_order", { valueAsNumber: true })} type="number" className="input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Valid From</label><input {...register("valid_from")} type="date" className="input" /></div>
            <div><label className="label">Valid Until</label><input {...register("valid_until")} type="date" className="input" /></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("is_active")} className="h-4 w-4 rounded text-wine" />
            <span className="text-sm text-ink">Active</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg text-ink-light">Cancel</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-wine text-cream rounded-lg hover:bg-wine-light disabled:opacity-50">{isPending ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BannersClient({ banners: initial }: { banners: BannerRow[] }) {
  const [banners, setBanners] = useState(initial);
  const [modal, setModal] = useState<{ open: boolean; banner: BannerRow | null }>({ open: false, banner: null });
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Delete this banner?")) return;
    startTransition(async () => {
      await deleteBannerAction(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      toast.success("Banner deleted.");
    });
  }

  return (
    <>
      {modal.open && <BannerModal banner={modal.banner} onClose={() => { setModal({ open: false, banner: null }); window.location.reload(); }} />}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <span className="text-sm text-ink-light">{banners.length} banners</span>
          <button onClick={() => setModal({ open: true, banner: null })} className="flex items-center gap-2 px-3 py-1.5 bg-wine text-cream rounded-lg text-sm hover:bg-wine-light">
            <Plus className="h-4 w-4" /> Add Banner
          </button>
        </div>
        <div className="divide-y divide-border">
          {banners.map((b) => (
            <div key={b.id} className="flex items-center gap-4 px-6 py-4">
              <div className="relative h-16 w-24 rounded-lg overflow-hidden border border-border shrink-0">
                <Image src={b.image_url} alt={b.headline ?? ""} fill className="object-cover" unoptimized />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink truncate">{b.headline ?? "(No headline)"}</p>
                <p className="text-xs text-ink-light">{b.position} · order {b.display_order}</p>
              </div>
              <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", b.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")}>
                {b.is_active ? "Active" : "Inactive"}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setModal({ open: true, banner: b })} className="p-1.5 rounded text-ink-light hover:text-wine hover:bg-wine/10"><Edit className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(b.id)} disabled={isPending} className="p-1.5 rounded text-ink-light hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {banners.length === 0 && <p className="px-6 py-12 text-center text-sm text-ink-light">No banners yet.</p>}
        </div>
      </div>
    </>
  );
}
