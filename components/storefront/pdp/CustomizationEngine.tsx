"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HelpCircle, Minus, Plus, Check, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/brand";
import { customizationSchema, type CustomizationValues } from "@/lib/validations/customization";
import { buildCustomizationSummary } from "@/lib/cart-utils";
import { validateAndPriceItem } from "@/lib/actions/cart";
import { useCartStore } from "@/stores/cart";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ProductWithDetails } from "@/types/database";

interface CustomizationEngineProps {
  product: ProductWithDetails;
}

export function CustomizationEngine({ product }: CustomizationEngineProps) {
  const {
    product_sizes: sizes,
    product_shapes: shapes,
    product_flavors: flavors,
    product_tier_options: tiers,
    product_dietary_options: dietary,
    product_addons: addons,
  } = product;

  const egglessOption = dietary.find((d) => d.type === "eggless");
  const veganOption = dietary.find((d) => d.type === "vegan");
  const glutenFreeOption = dietary.find((d) => d.type === "gluten_free");

  const defaultSize = sizes[0]?.id ?? "";
  const defaultFlavor = flavors[0]?.id ?? "";
  const defaultShape = shapes[0]?.id;
  const defaultTier = tiers[0]?.id;

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomizationValues>({
    resolver: zodResolver(customizationSchema),
    defaultValues: {
      size_id: defaultSize,
      flavor_id: defaultFlavor,
      shape_id: defaultShape,
      tier_id: defaultTier,
      eggless: false,
      vegan: false,
      gluten_free: false,
      addon_ids: [],
      quantity: 1,
    },
  });

  const values = watch();

  // Compute live price
  const selectedSize = sizes.find((s) => s.id === values.size_id);
  const selectedFlavor = flavors.find((f) => f.id === values.flavor_id);
  const selectedTier = tiers.find((t) => t.id === values.tier_id);
  const selectedAddons = (addons ?? [])
    .filter((a) => values.addon_ids.includes(a.addons.id))
    .map((a) => a.addons);

  const basePrice = parseFloat(selectedSize?.price ?? product.base_price);
  const flavorMod = parseFloat(selectedFlavor?.price_modifier ?? "0");
  const tierMod = parseFloat(selectedTier?.price_modifier ?? "0");
  const egglessMod = values.eggless ? parseFloat(egglessOption?.price_modifier ?? "0") : 0;
  const veganMod = values.vegan ? parseFloat(veganOption?.price_modifier ?? "0") : 0;
  const glutenFreeMod = values.gluten_free ? parseFloat(glutenFreeOption?.price_modifier ?? "0") : 0;
  const addonTotal = selectedAddons.reduce((sum, a) => sum + parseFloat(a.price), 0);

  const unitPrice = basePrice + flavorMod + tierMod + egglessMod + veganMod + glutenFreeMod + addonTotal;
  const totalPrice = unitPrice * (values.quantity ?? 1);

  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messageLen = (values.message ?? "").length;
  const instructionsLen = (values.special_instructions ?? "").length;

  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const router = useRouter();

  const onSubmit = async (data: CustomizationValues) => {
    setIsSubmitting(true);
    try {
      let photo_url: string | undefined;

      if (photoFile && product.allows_photo_upload) {
        const supabase = createClient();
        const ext = photoFile.name.split(".").pop() ?? "jpg";
        const path = `photo-cakes/${product.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, photoFile, { upsert: false });
        if (uploadError) {
          toast.error("Photo upload failed — please try again");
          return;
        }
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }

      const customizationWithPhoto: CustomizationValues = { ...data, photo_url };

      const result = await validateAndPriceItem(product.id, customizationWithPhoto);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      const { unitPrice } = result;
      const lineTotal = unitPrice * data.quantity;
      const primaryImage =
        product.product_images.find((i) => i.is_primary)?.url ??
        product.product_images[0]?.url ??
        null;

      addItem({
        productId: product.id,
        snapshot: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          imageUrl: primaryImage,
        },
        customization: customizationWithPhoto,
        customizationSummary: buildCustomizationSummary(product, customizationWithPhoto),
        unitPrice,
        lineTotal,
      });

      toast.success(`${product.name} added to cart`, {
        action: { label: "View Cart", onClick: () => router.push("/cart") },
      });
      openDrawer();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>

      {/* ── SIZE ───────────────────────────────── */}
      {sizes.length > 0 && (
        <div>
          <p className="label-small text-ink mb-2.5">
            Size <span className="text-wine">*</span>
          </p>
          <Controller
            name="size_id"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const selected = field.value === size.id;
                  return (
                    <motion.button
                      key={size.id}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => field.onChange(size.id)}
                      aria-pressed={selected}
                      className={cn(
                        "relative px-4 py-2.5 rounded-lg border text-sm font-body transition-all duration-200 text-left",
                        selected
                          ? "border-wine bg-wine/5 text-wine"
                          : "border-border bg-card text-ink hover:border-wine/50"
                      )}
                    >
                      {selected && (
                        <Check className="w-3 h-3 absolute top-1.5 right-1.5 text-wine" aria-hidden="true" />
                      )}
                      <span className="font-medium">{size.label}</span>
                      <span className="block text-xs text-ink-light mt-0.5">{formatCurrency(parseFloat(size.price))}</span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          />
          {errors.size_id && (
            <p className="text-xs text-destructive mt-1.5">{errors.size_id.message}</p>
          )}
        </div>
      )}

      {/* ── SHAPE ──────────────────────────────── */}
      {shapes.length > 1 && (
        <div>
          <p className="label-small text-ink mb-2.5">
            Shape <span className="text-wine">*</span>
          </p>
          <Controller
            name="shape_id"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {shapes.map((shape) => {
                  const selected = field.value === shape.id;
                  const icons: Record<string, string> = { round: "○", square: "□", heart: "♡", custom: "✦" };
                  return (
                    <motion.button
                      key={shape.id}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => field.onChange(shape.id)}
                      aria-pressed={selected}
                      className={cn(
                        "px-4 py-2.5 rounded-lg border text-sm font-body transition-all duration-200 flex items-center gap-2",
                        selected
                          ? "border-wine bg-wine/5 text-wine"
                          : "border-border bg-card text-ink hover:border-wine/50"
                      )}
                    >
                      <span aria-hidden="true">{icons[shape.shape] ?? "◈"}</span>
                      <span className="capitalize">{shape.shape}</span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          />
        </div>
      )}

      {/* ── FLAVOUR ────────────────────────────── */}
      {flavors.length > 0 && (
        <div>
          <p className="label-small text-ink mb-2.5">
            Flavour <span className="text-wine">*</span>
          </p>
          <Controller
            name="flavor_id"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {flavors.map((flavor) => {
                  const selected = field.value === flavor.id;
                  const mod = parseFloat(flavor.price_modifier);
                  return (
                    <motion.button
                      key={flavor.id}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => field.onChange(flavor.id)}
                      aria-pressed={selected}
                      className={cn(
                        "px-4 py-2.5 rounded-lg border text-sm font-body transition-all duration-200",
                        selected
                          ? "border-wine bg-wine/5 text-wine"
                          : "border-border bg-card text-ink hover:border-wine/50"
                      )}
                    >
                      {flavor.name}
                      {mod > 0 && (
                        <span className="ml-1.5 text-xs text-ink-light">+{formatCurrency(mod)}</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          />
          {errors.flavor_id && (
            <p className="text-xs text-destructive mt-1.5">{errors.flavor_id.message}</p>
          )}
        </div>
      )}

      {/* ── TIER ───────────────────────────────── */}
      {tiers.length > 0 && (
        <div>
          <p className="label-small text-ink mb-2.5">
            Tiers <span className="text-wine">*</span>
          </p>
          <Controller
            name="tier_id"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {tiers.map((tier) => {
                  const selected = field.value === tier.id;
                  const mod = parseFloat(tier.price_modifier);
                  const labels: Record<number, string> = { 1: "Single", 2: "Two-Tier", 3: "Three-Tier", 4: "Four-Tier", 5: "Five-Tier" };
                  return (
                    <motion.button
                      key={tier.id}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => field.onChange(tier.id)}
                      aria-pressed={selected}
                      className={cn(
                        "px-4 py-2.5 rounded-lg border text-sm font-body transition-all duration-200",
                        selected
                          ? "border-wine bg-wine/5 text-wine"
                          : "border-border bg-card text-ink hover:border-wine/50"
                      )}
                    >
                      {labels[tier.tier_count] ?? `${tier.tier_count}-Tier`}
                      {mod > 0 && (
                        <span className="ml-1.5 text-xs text-ink-light">+{formatCurrency(mod)}</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          />
        </div>
      )}

      {/* ── DIETARY TOGGLES ─────────────────────── */}
      {(egglessOption || veganOption || glutenFreeOption) && (
        <div>
          <p className="label-small text-ink mb-2.5">Dietary Options</p>
          <div className="space-y-2">
            {egglessOption && (
              <DietaryToggle
                label="Eggless"
                description={`+${formatCurrency(parseFloat(egglessOption.price_modifier))}`}
                checked={values.eggless ?? false}
                onChange={(v) => setValue("eggless", v)}
              />
            )}
            {veganOption && (
              <DietaryToggle
                label="Vegan"
                description={`+${formatCurrency(parseFloat(veganOption.price_modifier))}`}
                checked={values.vegan ?? false}
                onChange={(v) => setValue("vegan", v)}
              />
            )}
            {glutenFreeOption && (
              <DietaryToggle
                label="Gluten-Free"
                description={`+${formatCurrency(parseFloat(glutenFreeOption.price_modifier))}`}
                checked={values.gluten_free ?? false}
                onChange={(v) => setValue("gluten_free", v)}
              />
            )}
          </div>
        </div>
      )}

      {/* ── CAKE MESSAGE ────────────────────────── */}
      {product.allows_message && (
        <div>
          <label htmlFor="cake-message" className="label-small text-ink mb-2.5 block">
            Cake Message
            <span className="normal-case font-body text-xs text-ink-light ml-2">(optional)</span>
          </label>
          <div className="relative">
            <input
              id="cake-message"
              type="text"
              maxLength={50}
              placeholder="e.g. Happy Birthday Sarah! 🎂"
              {...register("message")}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-body text-ink placeholder:text-ink-light focus:outline-none focus:ring-1 focus:ring-wine pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-light tabular-nums">
              {messageLen}/50
            </span>
          </div>
          {/* Live preview */}
          {values.message && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 px-3 py-2 bg-blush-light rounded-lg"
            >
              <p className="font-accent text-lg text-wine text-center">{values.message}</p>
            </motion.div>
          )}
          {errors.message && (
            <p className="text-xs text-destructive mt-1">{errors.message.message}</p>
          )}
        </div>
      )}

      {/* ── COLOR THEME ─────────────────────────── */}
      {product.allows_color_theme && (
        <div>
          <label htmlFor="color-theme" className="label-small text-ink mb-2.5 block">
            Colour Theme
            <span className="normal-case font-body text-xs text-ink-light ml-2">(optional)</span>
          </label>
          <input
            id="color-theme"
            type="text"
            placeholder="e.g. Dusty pink, sage green, gold & white"
            {...register("color_theme")}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-body text-ink placeholder:text-ink-light focus:outline-none focus:ring-1 focus:ring-wine"
          />
        </div>
      )}

      {/* ── PHOTO UPLOAD ────────────────────────── */}
      {product.allows_photo_upload && (
        <div>
          <p className="label-small text-ink mb-2.5">
            Photo Upload
            <span className="normal-case font-body text-xs text-ink-light ml-2">(optional, printed on cake)</span>
          </p>
          <label
            htmlFor="photo-upload"
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border hover:border-wine transition-colors rounded-lg p-5 cursor-pointer group"
          >
            {photoFile ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(photoFile)}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <p className="text-sm font-body text-ink">{photoFile.name}</p>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setPhotoFile(null); }}
                    className="text-xs text-wine hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-blush-light flex items-center justify-center group-hover:bg-blush transition-colors">
                  <span className="text-wine text-lg">+</span>
                </div>
                <p className="text-sm font-body text-ink-light text-center">
                  Click to upload a photo<br />
                  <span className="text-xs">JPG, PNG or WebP, max 10 MB</span>
                </p>
              </>
            )}
            <input
              id="photo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && file.size <= 10 * 1024 * 1024) {
                  setPhotoFile(file);
                } else if (file) {
                  toast.error("Photo must be under 10 MB");
                }
              }}
            />
          </label>
        </div>
      )}

      {/* ── ADD-ONS ─────────────────────────────── */}
      {addons && addons.length > 0 && (
        <div>
          <p className="label-small text-ink mb-2.5">Add-Ons</p>
          <Controller
            name="addon_ids"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                {addons.map(({ addons: addon }) => {
                  const checked = field.value.includes(addon.id);
                  return (
                    <label
                      key={addon.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200",
                        checked
                          ? "border-wine bg-wine/5"
                          : "border-border hover:border-wine/40 bg-card"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            field.onChange([...field.value, addon.id]);
                          } else {
                            field.onChange(field.value.filter((id) => id !== addon.id));
                          }
                        }}
                        className="w-4 h-4 accent-wine cursor-pointer"
                        aria-label={addon.name}
                      />
                      {addon.image_url && (
                        <Image src={addon.image_url} alt={addon.name} width={36} height={36} className="rounded object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body font-medium text-ink">{addon.name}</p>
                        {addon.description && (
                          <p className="text-xs text-ink-light truncate">{addon.description}</p>
                        )}
                      </div>
                      <p className="text-sm font-body font-medium text-wine shrink-0">
                        +{formatCurrency(parseFloat(addon.price))}
                      </p>
                    </label>
                  );
                })}
              </div>
            )}
          />
        </div>
      )}

      {/* ── SPECIAL INSTRUCTIONS ────────────────── */}
      <div>
        <label htmlFor="special-instructions" className="label-small text-ink mb-2.5 block">
          Special Instructions
          <span className="normal-case font-body text-xs text-ink-light ml-2">(optional)</span>
        </label>
        <div className="relative">
          <textarea
            id="special-instructions"
            rows={3}
            maxLength={500}
            placeholder="Any allergy information, delivery notes, or design requests…"
            {...register("special_instructions")}
            className="w-full px-4 py-3 rounded-lg border border-border bg-card text-sm font-body text-ink placeholder:text-ink-light focus:outline-none focus:ring-1 focus:ring-wine resize-none"
          />
          <span className="absolute bottom-2 right-3 text-xs text-ink-light tabular-nums">
            {instructionsLen}/500
          </span>
        </div>
        {errors.special_instructions && (
          <p className="text-xs text-destructive mt-1">{errors.special_instructions.message}</p>
        )}
      </div>

      {/* ── QUANTITY ────────────────────────────── */}
      <div>
        <p className="label-small text-ink mb-2.5">Quantity</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setValue("quantity", Math.max(1, (values.quantity ?? 1) - 1))}
            aria-label="Decrease quantity"
            disabled={(values.quantity ?? 1) <= 1}
            className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-ink hover:border-wine hover:text-wine transition-colors disabled:opacity-40"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center font-body font-medium text-ink tabular-nums">
            {values.quantity ?? 1}
          </span>
          <button
            type="button"
            onClick={() => setValue("quantity", Math.min(10, (values.quantity ?? 1) + 1))}
            aria-label="Increase quantity"
            disabled={(values.quantity ?? 1) >= 10}
            className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-ink hover:border-wine hover:text-wine transition-colors disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── PRICE SUMMARY ───────────────────────── */}
      <div className="rounded-xl bg-blush-light/60 border border-blush p-4 space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setBreakdownOpen((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-body text-ink-light hover:text-ink transition-colors"
          >
            <HelpCircle className="w-4 h-4" aria-hidden="true" />
            How is this calculated?
          </button>
          <p className="font-display text-2xl font-semibold text-wine">
            {formatCurrency(totalPrice)}
          </p>
        </div>

        {breakdownOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden text-xs font-body text-ink-light space-y-1 pt-2 border-t border-blush"
          >
            <div className="flex justify-between">
              <span>Base ({selectedSize?.label ?? "size"})</span>
              <span>{formatCurrency(parseFloat(selectedSize?.price ?? product.base_price))}</span>
            </div>
            {flavorMod > 0 && (
              <div className="flex justify-between">
                <span>Flavour ({selectedFlavor?.name})</span>
                <span>+{formatCurrency(flavorMod)}</span>
              </div>
            )}
            {tierMod > 0 && (
              <div className="flex justify-between">
                <span>Tiers</span>
                <span>+{formatCurrency(tierMod)}</span>
              </div>
            )}
            {egglessMod > 0 && (
              <div className="flex justify-between"><span>Eggless</span><span>+{formatCurrency(egglessMod)}</span></div>
            )}
            {veganMod > 0 && (
              <div className="flex justify-between"><span>Vegan</span><span>+{formatCurrency(veganMod)}</span></div>
            )}
            {glutenFreeMod > 0 && (
              <div className="flex justify-between"><span>Gluten-Free</span><span>+{formatCurrency(glutenFreeMod)}</span></div>
            )}
            {selectedAddons.map((a) => (
              <div key={a.id} className="flex justify-between">
                <span>{a.name}</span>
                <span>+{formatCurrency(parseFloat(a.price))}</span>
              </div>
            ))}
            {(values.quantity ?? 1) > 1 && (
              <div className="flex justify-between font-medium text-ink pt-1 border-t border-blush">
                <span>× {values.quantity} units</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── CTA BUTTONS ─────────────────────────── */}
      <div className="space-y-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full text-center text-base py-3.5 flex items-center justify-center gap-2 disabled:opacity-70"
          aria-label={`Add to cart — ${formatCurrency(totalPrice)}`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Adding…
            </>
          ) : (
            `Add to Cart — ${formatCurrency(totalPrice)}`
          )}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit(async (data) => {
            await onSubmit(data);
            router.push("/checkout");
          })}
          className="btn-secondary w-full text-center text-base py-3 disabled:opacity-70"
        >
          Buy Now
        </button>
        <div className="flex items-start gap-2 text-xs text-ink-light">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          <span>Order at least 24 hours in advance. Wedding cakes require 5+ days notice.</span>
        </div>
      </div>
    </form>
  );
}

function DietaryToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={cn(
      "flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200",
      checked ? "border-wine bg-wine/5" : "border-border hover:border-wine/40 bg-card"
    )}>
      <div>
        <p className="text-sm font-body font-medium text-ink">{label}</p>
        <p className="text-xs text-ink-light">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0",
          checked ? "bg-wine" : "bg-border"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </label>
  );
}
