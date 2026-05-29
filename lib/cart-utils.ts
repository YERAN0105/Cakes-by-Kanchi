import type { ProductWithDetails, AppliedCoupon } from "@/types/database";
import type { CustomizationValues } from "@/lib/validations/customization";

export function computeDiscount(coupon: AppliedCoupon, subtotal: number): number {
  let amount = 0;
  if (coupon.type === "percent") {
    amount = (subtotal * coupon.value) / 100;
    if (amount > coupon.maxDiscount) amount = coupon.maxDiscount;
  } else if (coupon.type === "flat") {
    amount = Math.min(coupon.value, subtotal);
  }
  return Math.round(amount * 100) / 100;
}

export function calculateUnitPrice(
  product: ProductWithDetails,
  customization: CustomizationValues
): number {
  const selectedSize = product.product_sizes.find((s) => s.id === customization.size_id);
  const selectedFlavor = product.product_flavors.find((f) => f.id === customization.flavor_id);
  const selectedTier = product.product_tier_options.find((t) => t.id === customization.tier_id);
  const egglessOption = product.product_dietary_options.find((d) => d.type === "eggless");
  const veganOption = product.product_dietary_options.find((d) => d.type === "vegan");
  const glutenFreeOption = product.product_dietary_options.find((d) => d.type === "gluten_free");

  const basePrice = parseFloat(selectedSize?.price ?? product.base_price);
  const flavorMod = parseFloat(selectedFlavor?.price_modifier ?? "0");
  const tierMod = parseFloat(selectedTier?.price_modifier ?? "0");
  const egglessMod = customization.eggless ? parseFloat(egglessOption?.price_modifier ?? "0") : 0;
  const veganMod = customization.vegan ? parseFloat(veganOption?.price_modifier ?? "0") : 0;
  const glutenFreeMod = customization.gluten_free
    ? parseFloat(glutenFreeOption?.price_modifier ?? "0")
    : 0;
  const addonTotal = product.product_addons
    .filter((a) => customization.addon_ids.includes(a.addons.id))
    .reduce((sum, a) => sum + parseFloat(a.addons.price), 0);

  return basePrice + flavorMod + tierMod + egglessMod + veganMod + glutenFreeMod + addonTotal;
}

export function buildCustomizationSummary(
  product: ProductWithDetails,
  customization: CustomizationValues
): string[] {
  const parts: string[] = [];

  const size = product.product_sizes.find((s) => s.id === customization.size_id);
  if (size) parts.push(size.label);

  const flavor = product.product_flavors.find((f) => f.id === customization.flavor_id);
  if (flavor) parts.push(flavor.name);

  const tier = product.product_tier_options.find((t) => t.id === customization.tier_id);
  if (tier) {
    const labels: Record<number, string> = { 1: "Single", 2: "Two-Tier", 3: "Three-Tier", 4: "Four-Tier" };
    parts.push(labels[tier.tier_count] ?? `${tier.tier_count}-Tier`);
  }

  const shape = product.product_shapes.find((s) => s.id === customization.shape_id);
  if (shape) parts.push(shape.shape.charAt(0).toUpperCase() + shape.shape.slice(1));

  if (customization.eggless) parts.push("Eggless");
  if (customization.vegan) parts.push("Vegan");
  if (customization.gluten_free) parts.push("Gluten-Free");

  if (customization.message) parts.push(`"${customization.message}"`);

  return parts;
}
