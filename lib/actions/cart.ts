"use server";

import { createClient } from "@/lib/supabase/server";
import { customizationSchema, type CustomizationValues } from "@/lib/validations/customization";
import type { ProductWithDetails, AppliedCoupon, PriceLineItem } from "@/types/database";
import type { Database } from "@/types/database";
import { buildPriceBreakdown } from "@/lib/cart-utils";

type CouponRow = Database["public"]["Tables"]["coupons"]["Row"];

export async function validateAndPriceItem(
  productId: string,
  customization: CustomizationValues
): Promise<{ unitPrice: number; priceBreakdown: PriceLineItem[] } | { error: string }> {
  const parsed = customizationSchema.safeParse(customization);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `*, product_sizes(*), product_flavors(*), product_tier_options(*), product_dietary_options(*), product_addons(addons(*)), product_shapes(*), product_images(*)`
    )
    .eq("id", productId)
    .eq("is_published", true)
    .single();

  if (error || !data) return { error: "Product not found" };

  const product = data as unknown as ProductWithDetails;
  const c = parsed.data;

  const selectedSize = product.product_sizes.find((s) => s.id === c.size_id);
  if (!selectedSize) return { error: "Invalid size selection" };

  if (product.product_flavors.length > 0) {
    const selectedFlavor = product.product_flavors.find((f) => f.id === c.flavor_id);
    if (!selectedFlavor) return { error: "Invalid flavour selection" };
  }

  const egglessOption = product.product_dietary_options.find((d) => d.type === "eggless");
  const veganOption = product.product_dietary_options.find((d) => d.type === "vegan");
  const glutenFreeOption = product.product_dietary_options.find((d) => d.type === "gluten_free");

  const basePrice = parseFloat(selectedSize.price);
  const flavorMod = parseFloat(
    product.product_flavors.find((f) => f.id === c.flavor_id)?.price_modifier ?? "0"
  );
  const tierMod = parseFloat(
    product.product_tier_options.find((t) => t.id === c.tier_id)?.price_modifier ?? "0"
  );
  const egglessMod = c.eggless ? parseFloat(egglessOption?.price_modifier ?? "0") : 0;
  const veganMod = c.vegan ? parseFloat(veganOption?.price_modifier ?? "0") : 0;
  const glutenFreeMod = c.gluten_free ? parseFloat(glutenFreeOption?.price_modifier ?? "0") : 0;
  const addonTotal = product.product_addons
    .filter((a) => c.addon_ids.includes(a.addons.id))
    .reduce((sum, a) => {
      const qty = c.addon_quantities?.[a.addons.id] ?? 1;
      return sum + parseFloat(a.addons.price) * qty;
    }, 0);

  const unitPrice =
    basePrice + flavorMod + tierMod + egglessMod + veganMod + glutenFreeMod + addonTotal;

  const priceBreakdown = buildPriceBreakdown(product, c);

  return { unitPrice, priceBreakdown };
}

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<{ coupon: AppliedCoupon } | { error: string }> {
  const supabase = await createClient();

  const { data: rawData, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .single();

  if (error || !rawData) return { error: "Invalid or expired coupon code" };

  const data = rawData as unknown as CouponRow;
  const now = new Date().toISOString();
  if (data.valid_from && data.valid_from > now) return { error: "This coupon is not yet valid" };
  if (data.valid_until && data.valid_until < now) return { error: "This coupon has expired" };

  const minOrder = parseFloat(data.min_order_amount ?? "0");
  if (subtotal < minOrder) {
    return {
      error: `Minimum order of Rs. ${minOrder.toLocaleString()} required for this coupon`,
    };
  }

  if (data.usage_limit_total !== null) {
    const { count } = await supabase
      .from("coupon_usage")
      .select("*", { count: "exact", head: true })
      .eq("coupon_id", data.id);
    if ((count ?? 0) >= data.usage_limit_total) {
      return { error: "This coupon has reached its usage limit" };
    }
  }

  const value = parseFloat(data.value);
  let discountAmount = 0;

  if (data.type === "percent") {
    discountAmount = (subtotal * value) / 100;
    const maxDiscount = parseFloat(data.max_discount ?? "99999999");
    if (discountAmount > maxDiscount) discountAmount = maxDiscount;
  } else if (data.type === "flat") {
    discountAmount = Math.min(value, subtotal);
  } else {
    discountAmount = 0;
  }

  discountAmount = Math.round(discountAmount * 100) / 100;

  const coupon: AppliedCoupon = {
    id: data.id,
    code: data.code,
    type: data.type,
    value,
    maxDiscount: parseFloat(data.max_discount ?? "99999999"),
    discountAmount,
  };

  return { coupon };
}
