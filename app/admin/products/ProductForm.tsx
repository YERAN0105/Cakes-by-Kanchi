"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { createProductAction, updateProductAction, uploadProductImageAction } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";
import type { AddonRow, CategoryRow } from "@/types/database";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  category_id: z.string().nullable().optional(),
  description: z.string().optional(),
  ingredients: z.string().optional(),
  allergens: z.string().optional(),
  base_price: z.string().min(1, "Base price is required"),
  is_published: z.boolean(),
  is_featured: z.boolean(),
  is_bestseller: z.boolean(),
  stock_tracked: z.boolean(),
  stock_quantity: z.number().int().min(0),
  low_stock_threshold: z.number().int().min(0),
  allows_message: z.boolean(),
  allows_color_theme: z.boolean(),
  allows_photo_upload: z.boolean(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  sizes: z.array(z.object({ label: z.string().min(1), weight_kg: z.string().optional(), price: z.string().min(1) })),
  shapes: z.array(z.string()),
  flavors: z.array(z.object({ name: z.string().min(1), price_modifier: z.string() })),
  tier_options: z.array(z.object({ tier_count: z.number().int().min(1), price_modifier: z.string() })),
  dietary_options: z.array(z.object({ type: z.enum(["eggless", "vegan", "gluten_free"]), price_modifier: z.string() })),
  addon_ids: z.array(z.string()),
  images: z.array(z.object({ url: z.string(), alt_text: z.string().optional(), display_order: z.number(), is_primary: z.boolean() })),
});

type FormValues = z.infer<typeof schema>;

const SHAPES = ["Round", "Square", "Heart", "Custom"];

interface ProductFormProps {
  productId?: string;
  defaultValues?: Partial<FormValues>;
  categories: CategoryRow[];
  allAddons: AddonRow[];
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function ProductForm({ productId, defaultValues, categories, allAddons }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("basic");

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      category_id: null,
      description: "",
      ingredients: "",
      allergens: "",
      base_price: "",
      is_published: false,
      is_featured: false,
      is_bestseller: false,
      stock_tracked: false,
      stock_quantity: 0,
      low_stock_threshold: 5,
      allows_message: true,
      allows_color_theme: true,
      allows_photo_upload: false,
      meta_title: "",
      meta_description: "",
      sizes: [],
      shapes: [],
      flavors: [],
      tier_options: [],
      dietary_options: [],
      addon_ids: [],
      images: [],
      ...defaultValues,
    },
  });

  const { fields: sizes, append: addSize, remove: removeSize } = useFieldArray({ control, name: "sizes" });
  const { fields: flavors, append: addFlavor, remove: removeFlavor } = useFieldArray({ control, name: "flavors" });
  const { fields: tierOptions, append: addTier, remove: removeTier } = useFieldArray({ control, name: "tier_options" });
  const { fields: dietaryOptions, append: addDietary, remove: removeDietary } = useFieldArray({ control, name: "dietary_options" });
  const { fields: images, append: addImage, remove: removeImage } = useFieldArray({ control, name: "images" });

  const watchedShapes = watch("shapes") ?? [];
  const watchedAddonIds = watch("addon_ids") ?? [];
  const watchedImages = watch("images");
  const watchName = watch("name");
  const stockTracked = watch("stock_tracked");

  function handleNameBlur() {
    const currentSlug = watch("slug");
    if (!currentSlug || currentSlug === slugify(watch("name").slice(0, -1))) {
      setValue("slug", slugify(watchName));
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadProductImageAction(fd);
    setUploading(false);
    if ("error" in result) { toast.error(result.error); return; }
    addImage({ url: result.data!.url, alt_text: "", display_order: images.length, is_primary: images.length === 0 });
  }

  function toggleShape(shape: string) {
    const current = watchedShapes;
    setValue("shapes", current.includes(shape) ? current.filter((s) => s !== shape) : [...current, shape]);
  }

  function toggleAddon(addonId: string) {
    const current = watchedAddonIds;
    setValue("addon_ids", current.includes(addonId) ? current.filter((id) => id !== addonId) : [...current, addonId]);
  }

  function setPrimary(index: number) {
    const imgs = watch("images");
    setValue("images", imgs.map((img, i) => ({ ...img, is_primary: i === index })));
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = productId
        ? await updateProductAction(productId, values)
        : await createProductAction(values);

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(productId ? "Product updated." : "Product created.");
        router.push("/admin/products");
      }
    });
  }

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "images", label: "Images" },
    { id: "pricing", label: "Pricing & Sizes" },
    { id: "customization", label: "Customization" },
    { id: "addons", label: "Add-Ons" },
    { id: "stock", label: "Stock & Status" },
    { id: "seo", label: "SEO" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              activeTab === tab.id
                ? "border-wine text-wine"
                : "border-transparent text-ink-light hover:text-ink"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Basic Info ── */}
      {activeTab === "basic" && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input {...register("name")} onBlur={handleNameBlur} className="input" placeholder="e.g. Classic Vanilla Cake" />
              {errors.name && <p className="error">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Slug *</label>
              <input {...register("slug")} className="input" placeholder="e.g. classic-vanilla-cake" />
              {errors.slug && <p className="error">{errors.slug.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <select {...register("category_id")} className="input">
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea {...register("description")} rows={4} className="input" placeholder="Short description of the product" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ingredients</label>
              <textarea {...register("ingredients")} rows={3} className="input" placeholder="List ingredients" />
            </div>
            <div>
              <label className="label">Allergens</label>
              <textarea {...register("allergens")} rows={3} className="input" placeholder="e.g. Contains gluten, dairy, eggs" />
            </div>
          </div>
        </div>
      )}

      {/* ── Images ── */}
      {activeTab === "images" && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            {watchedImages.map((img, i) => (
              <div key={i} className="relative group">
                <div className="relative h-28 w-28 rounded-lg overflow-hidden border-2 border-border">
                  <Image src={img.url} alt={img.alt_text ?? ""} fill className="object-cover" />
                </div>
                {img.is_primary && (
                  <span className="absolute top-1 left-1 bg-wine text-cream text-xs px-1 rounded">Primary</span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-lg flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  {!img.is_primary && (
                    <button type="button" onClick={() => setPrimary(i)} className="bg-white text-xs px-2 py-1 rounded">Set Primary</button>
                  )}
                  <button type="button" onClick={() => removeImage(i)} className="bg-red-600 text-white p-1 rounded">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="h-28 w-28 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-ink-light hover:border-wine hover:text-wine transition-colors"
            >
              {uploading ? <span className="text-xs">Uploading…</span> : (
                <>
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Upload</span>
                </>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>
          {images.length === 0 && <p className="text-sm text-ink-light">No images uploaded yet.</p>}
        </div>
      )}

      {/* ── Pricing & Sizes ── */}
      {activeTab === "pricing" && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div>
            <label className="label">Base Price (LKR) *</label>
            <input {...register("base_price")} className="input w-48" placeholder="e.g. 3500" />
            {errors.base_price && <p className="error">{errors.base_price.message}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Size Options</label>
              <button type="button" onClick={() => addSize({ label: "", weight_kg: "", price: "" })} className="text-sm text-wine flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Size
              </button>
            </div>
            <div className="space-y-2">
              {sizes.map((field, i) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <input {...register(`sizes.${i}.label`)} className="input flex-1" placeholder="Label (e.g. 1 kg)" />
                  <input {...register(`sizes.${i}.weight_kg`)} className="input w-24" placeholder="kg" />
                  <input {...register(`sizes.${i}.price`)} className="input w-28" placeholder="Price" />
                  <button type="button" onClick={() => removeSize(i)} className="p-2 text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Customization ── */}
      {activeTab === "customization" && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-6">
          {/* Shapes */}
          <div>
            <label className="label">Available Shapes</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SHAPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleShape(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-sm transition-colors",
                    watchedShapes.includes(s)
                      ? "border-wine bg-wine text-cream"
                      : "border-border text-ink-light hover:border-wine"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Flavors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Flavors</label>
              <button type="button" onClick={() => addFlavor({ name: "", price_modifier: "0" })} className="text-sm text-wine flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Flavor
              </button>
            </div>
            <div className="space-y-2">
              {flavors.map((f, i) => (
                <div key={f.id} className="flex gap-2">
                  <input {...register(`flavors.${i}.name`)} className="input flex-1" placeholder="Flavor name" />
                  <input {...register(`flavors.${i}.price_modifier`)} className="input w-28" placeholder="+/- price" />
                  <button type="button" onClick={() => removeFlavor(i)} className="p-2 text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Tiers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Tier Options</label>
              <button type="button" onClick={() => addTier({ tier_count: 2, price_modifier: "0" })} className="text-sm text-wine flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Tier
              </button>
            </div>
            <div className="space-y-2">
              {tierOptions.map((t, i) => (
                <div key={t.id} className="flex gap-2">
                  <select {...register(`tier_options.${i}.tier_count`, { valueAsNumber: true })} className="input w-36">
                    <option value={2}>2-Tier</option>
                    <option value={3}>3-Tier</option>
                  </select>
                  <input {...register(`tier_options.${i}.price_modifier`)} className="input w-28" placeholder="+/- price" />
                  <button type="button" onClick={() => removeTier(i)} className="p-2 text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Dietary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Dietary Options</label>
              <button type="button" onClick={() => addDietary({ type: "eggless", price_modifier: "0" })} className="text-sm text-wine flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Option
              </button>
            </div>
            <div className="space-y-2">
              {dietaryOptions.map((d, i) => (
                <div key={d.id} className="flex gap-2">
                  <select {...register(`dietary_options.${i}.type`)} className="input w-40">
                    <option value="eggless">Eggless</option>
                    <option value="vegan">Vegan</option>
                    <option value="gluten_free">Gluten-Free</option>
                  </select>
                  <input {...register(`dietary_options.${i}.price_modifier`)} className="input w-28" placeholder="+/- price" />
                  <button type="button" onClick={() => removeDietary(i)} className="p-2 text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-border">
            {[
              { field: "allows_message" as const, label: "Allow cake message" },
              { field: "allows_color_theme" as const, label: "Allow color theme" },
              { field: "allows_photo_upload" as const, label: "Allow photo upload" },
            ].map(({ field, label }) => (
              <label key={field} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" {...register(field)} className="h-4 w-4 rounded border-border text-wine" />
                <span className="text-sm text-ink">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── Add-Ons ── */}
      {activeTab === "addons" && (
        <div className="bg-white rounded-xl border border-border p-6">
          <label className="label mb-3">Linked Add-Ons</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {allAddons.map((addon) => (
              <label key={addon.id} className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                watchedAddonIds.includes(addon.id)
                  ? "border-wine bg-wine/5"
                  : "border-border hover:border-wine/40"
              )}>
                <input
                  type="checkbox"
                  checked={watchedAddonIds.includes(addon.id)}
                  onChange={() => toggleAddon(addon.id)}
                  className="h-4 w-4 rounded text-wine"
                />
                <div>
                  <p className="text-sm font-medium text-ink">{addon.name}</p>
                  <p className="text-xs text-ink-light">Rs. {parseFloat(addon.price).toLocaleString()}</p>
                </div>
              </label>
            ))}
            {allAddons.length === 0 && <p className="text-sm text-ink-light col-span-3">No add-ons created yet.</p>}
          </div>
        </div>
      )}

      {/* ── Stock & Status ── */}
      {activeTab === "stock" && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div className="space-y-3">
            {[
              { field: "is_published" as const, label: "Published (visible to customers)" },
              { field: "is_featured" as const, label: "Featured (shown on homepage)" },
              { field: "is_bestseller" as const, label: "Bestseller" },
              { field: "stock_tracked" as const, label: "Track stock" },
            ].map(({ field, label }) => (
              <label key={field} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" {...register(field)} className="h-4 w-4 rounded border-border text-wine" />
                <span className="text-sm text-ink">{label}</span>
              </label>
            ))}
          </div>
          {stockTracked && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <label className="label">Current Stock</label>
                <input {...register("stock_quantity", { valueAsNumber: true })} type="number" className="input" />
              </div>
              <div>
                <label className="label">Low Stock Threshold</label>
                <input {...register("low_stock_threshold", { valueAsNumber: true })} type="number" className="input" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SEO ── */}
      {activeTab === "seo" && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div>
            <label className="label">Meta Title</label>
            <input {...register("meta_title")} className="input" placeholder="~60 characters" maxLength={60} />
          </div>
          <div>
            <label className="label">Meta Description</label>
            <textarea {...register("meta_description")} rows={3} className="input" placeholder="~155 characters" maxLength={155} />
          </div>
        </div>
      )}

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-white border-t border-border mt-6 p-4 flex items-center justify-between">
        <button type="button" onClick={() => router.push("/admin/products")} className="px-4 py-2 text-sm text-ink-light hover:text-ink border border-border rounded-lg transition-colors">
          Discard
        </button>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-wine text-cream rounded-lg text-sm font-medium hover:bg-wine-light transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving…" : productId ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </div>
    </form>
  );
}
