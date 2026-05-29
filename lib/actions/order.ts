"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { customizationSchema, type CustomizationValues } from "@/lib/validations/customization";
import { buildPriceBreakdown } from "@/lib/cart-utils";
import { z } from "zod";
import type {
  ProductWithDetails,
  AddressSnapshot,
  ProductSnapshot,
  FulfillmentType,
  PaymentMethod,
  OrderStatus,
  PaymentStatus,
  Database,
} from "@/types/database";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type TimeSlotRow = Database["public"]["Tables"]["time_slots"]["Row"];

// ── Zod schemas ──────────────────────────────────────────────────

const cartItemPayloadSchema = z.object({
  productId: z.string().uuid(),
  customization: customizationSchema,
});

const addressSchema = z.object({
  recipient: z.string().min(2, "Recipient name is required"),
  phone: z.string().min(7, "Phone number is required"),
  line1: z.string().min(5, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  postal_code: z.string().optional(),
  label: z.string().optional(),
  save: z.boolean().optional(),
});

const createOrderSchema = z.object({
  // Contact
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(7, "Phone is required"),

  // Fulfillment
  fulfillmentType: z.enum(["delivery", "pickup"]),

  // Delivery
  deliveryZoneId: z.string().uuid().optional(),
  savedAddressId: z.string().uuid().optional(),
  address: addressSchema.optional(),

  // Schedule
  deliveryDate: z.string().min(1, "Delivery date is required"),
  timeSlotId: z.string().uuid("Time slot is required"),
  notes: z.string().max(500).optional(),

  // Payment
  paymentMethod: z.enum(["payhere", "bank_transfer", "cod"]),

  // Loyalty
  loyaltyPointsToRedeem: z.number().int().min(0).optional(),

  // Cart
  cartItems: z.array(cartItemPayloadSchema).min(1, "Cart is empty"),

  // Coupon
  couponId: z.string().uuid().optional(),
});

export type CreateOrderPayload = z.infer<typeof createOrderSchema>;

export type CreateOrderResult =
  | {
      success: true;
      orderNumber: string;
      orderId: string;
      redirectUrl: string;
    }
  | { error: string };

// ── Helpers ──────────────────────────────────────────────────────

function generateOrderNumber(): string {
  const date = new Date();
  const ymd =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `CKR-${ymd}-${rand}`;
}

function computeItemPrice(product: ProductWithDetails, c: CustomizationValues): number {
  const selectedSize = product.product_sizes.find((s) => s.id === c.size_id);
  const basePrice = parseFloat(selectedSize?.price ?? product.base_price);
  const flavorMod = parseFloat(
    product.product_flavors.find((f) => f.id === c.flavor_id)?.price_modifier ?? "0"
  );
  const tierMod = parseFloat(
    product.product_tier_options.find((t) => t.id === c.tier_id)?.price_modifier ?? "0"
  );
  const egglessMod = c.eggless
    ? parseFloat(product.product_dietary_options.find((d) => d.type === "eggless")?.price_modifier ?? "0")
    : 0;
  const veganMod = c.vegan
    ? parseFloat(product.product_dietary_options.find((d) => d.type === "vegan")?.price_modifier ?? "0")
    : 0;
  const glutenFreeMod = c.gluten_free
    ? parseFloat(
        product.product_dietary_options.find((d) => d.type === "gluten_free")?.price_modifier ?? "0"
      )
    : 0;
  const addonTotal = product.product_addons
    .filter((a) => c.addon_ids.includes(a.addons.id))
    .reduce((sum, a) => {
      const qty = c.addon_quantities?.[a.addons.id] ?? 1;
      return sum + parseFloat(a.addons.price) * qty;
    }, 0);

  return basePrice + flavorMod + tierMod + egglessMod + veganMod + glutenFreeMod + addonTotal;
}

// ── Main action ───────────────────────────────────────────────────

export async function createOrder(raw: CreateOrderPayload): Promise<CreateOrderResult> {
  // 1. Validate payload
  const parsed = createOrderSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const payload = parsed.data;

  const supabase = await createClient();
  const admin = createAdminClient();

  // 2. Get auth user (nullable — guest checkout allowed)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Validate delivery date server-side
  const minAllowed = new Date();
  minAllowed.setUTCDate(minAllowed.getUTCDate() + 2);
  const minAllowedStr = minAllowed.toISOString().slice(0, 10); // "YYYY-MM-DD"
  if (payload.deliveryDate < minAllowedStr) {
    return { error: "Orders must be placed at least 2 days in advance." };
  }
  const { data: holidayRow } = await admin
    .from("holidays")
    .select("id")
    .eq("date", payload.deliveryDate)
    .maybeSingle();
  if (holidayRow) {
    return { error: "The selected date is unavailable. Please choose another date." };
  }

  // 4. Re-fetch all products and recalculate prices
  const PRODUCT_DETAIL_SELECT =
    "*, product_sizes(*), product_flavors(*), product_tier_options(*), product_dietary_options(*), product_addons(addons(*)), product_images(*)";

  const productIds = [...new Set(payload.cartItems.map((i) => i.productId))];
  const { data: productsRaw, error: productsError } = await admin
    .from("products")
    .select(PRODUCT_DETAIL_SELECT)
    .in("id", productIds)
    .eq("is_published", true);

  if (productsError || !productsRaw || productsRaw.length !== productIds.length) {
    return { error: "One or more products are unavailable. Please refresh your cart." };
  }

  const products = productsRaw as unknown as ProductWithDetails[];
  const productMap = new Map(products.map((p) => [p.id, p]));

  // 5. Validate slot capacity
  const { data: slotRaw, error: slotError } = await admin
    .from("time_slots")
    .select("*")
    .eq("id", payload.timeSlotId)
    .eq("is_active", true)
    .single();

  if (slotError || !slotRaw) return { error: "Selected time slot is unavailable." };
  const slot = slotRaw as unknown as TimeSlotRow;

  const { count: slotUsed } = await admin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("time_slot_id", payload.timeSlotId)
    .eq("delivery_date", payload.deliveryDate)
    .not("status", "in", '("cancelled","refunded")');

  if ((slotUsed ?? 0) >= slot.capacity) {
    return {
      error: "This time slot is now fully booked. Please select another slot.",
    };
  }

  // 6. Validate delivery zone
  let deliveryFee = 0;
  if (payload.fulfillmentType === "delivery") {
    if (!payload.deliveryZoneId) return { error: "Please select a delivery zone." };
    const { data: zoneRaw } = await admin
      .from("delivery_zones")
      .select("*")
      .eq("id", payload.deliveryZoneId)
      .eq("is_active", true)
      .single();
    if (!zoneRaw) return { error: "Selected delivery zone is unavailable." };
    const zone = zoneRaw as unknown as Database["public"]["Tables"]["delivery_zones"]["Row"];
    deliveryFee = parseFloat(zone.fee);
  }

  // 6. Build order items + subtotal
  const orderItemsData: {
    productId: string;
    customization: CustomizationValues;
    unitPrice: number;
    lineTotal: number;
    productSnapshot: ProductSnapshot;
  }[] = [];

  for (const item of payload.cartItems) {
    const product = productMap.get(item.productId);
    if (!product) return { error: `Product not found: ${item.productId}` };

    // Stock check
    if (product.stock_tracked && product.stock_quantity < item.customization.quantity) {
      return {
        error: `"${product.name}" has insufficient stock. Please reduce quantity.`,
      };
    }

    const unitPrice = computeItemPrice(product, item.customization);
    const lineTotal = unitPrice * item.customization.quantity;

    const sizeRow = product.product_sizes.find((s) => s.id === item.customization.size_id);
    const flavorRow = product.product_flavors.find((f) => f.id === item.customization.flavor_id);
    const tierRow = product.product_tier_options.find((t) => t.id === item.customization.tier_id);
    const tierLabels: Record<number, string> = { 1: "Single", 2: "Two-Tier", 3: "Three-Tier" };

    const productSnapshot: ProductSnapshot = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      imageUrl:
        product.product_images.find((i) => i.is_primary)?.url ??
        product.product_images[0]?.url ??
        null,
      sizeName: sizeRow?.label ?? "",
      sizePrice: parseFloat(sizeRow?.price ?? product.base_price),
      flavorName: flavorRow?.name ?? null,
      tierName: tierRow ? (tierLabels[tierRow.tier_count] ?? `${tierRow.tier_count}-Tier`) : null,
      priceBreakdown: buildPriceBreakdown(product, item.customization),
    };

    orderItemsData.push({ productId: product.id, customization: item.customization, unitPrice, lineTotal, productSnapshot });
  }

  const subtotal = orderItemsData.reduce((sum, i) => sum + i.lineTotal, 0);

  // 7. Validate and apply coupon
  let discountAmount = 0;
  let couponId: string | null = null;

  if (payload.couponId) {
    const { data: couponRaw } = await admin
      .from("coupons")
      .select("*")
      .eq("id", payload.couponId)
      .eq("is_active", true)
      .single();

    if (couponRaw) {
      const coupon = couponRaw as unknown as Database["public"]["Tables"]["coupons"]["Row"];
      const value = parseFloat(coupon.value);
      if (coupon.type === "percent") {
        discountAmount = (subtotal * value) / 100;
        const maxD = parseFloat(coupon.max_discount ?? "99999999");
        if (discountAmount > maxD) discountAmount = maxD;
      } else if (coupon.type === "flat") {
        discountAmount = Math.min(value, subtotal);
      } else if (coupon.type === "free_delivery") {
        deliveryFee = 0;
      }
      discountAmount = Math.round(discountAmount * 100) / 100;
      couponId = coupon.id;
    }
  }

  // 8. Loyalty points redemption
  let loyaltyDiscount = 0;
  let loyaltyPointsUsed = 0;

  if (user && payload.loyaltyPointsToRedeem && payload.loyaltyPointsToRedeem > 0) {
    const { data: userData } = await admin
      .from("users")
      .select("loyalty_points")
      .eq("id", user.id)
      .single();

    const availablePoints = (userData as { loyalty_points: number } | null)?.loyalty_points ?? 0;
    const pointsToUse = Math.min(payload.loyaltyPointsToRedeem, availablePoints);
    loyaltyDiscount = pointsToUse * 0.1; // 1 point = Rs. 0.10 (configurable in settings later)
    loyaltyPointsUsed = pointsToUse;
  }

  // 9. Tax (none configured yet — always 0)
  const taxAmount = 0;

  // 10. Calculate total
  const total = Math.max(
    0,
    subtotal + deliveryFee - discountAmount - loyaltyDiscount + taxAmount
  );

  // 11. Build address snapshot
  let addressSnapshot: AddressSnapshot | null = null;

  if (payload.fulfillmentType === "delivery") {
    if (payload.savedAddressId && user) {
      const { data: addrRaw } = await admin
        .from("addresses")
        .select("*")
        .eq("id", payload.savedAddressId)
        .eq("user_id", user.id)
        .single();
      if (addrRaw) {
        const addr = addrRaw as unknown as Database["public"]["Tables"]["addresses"]["Row"];
        addressSnapshot = {
          recipient: addr.recipient,
          phone: addr.phone,
          line1: addr.line1,
          line2: addr.line2,
          city: addr.city,
          postal_code: addr.postal_code,
          label: addr.label,
        };
      }
    } else if (payload.address) {
      addressSnapshot = {
        recipient: payload.address.recipient,
        phone: payload.address.phone,
        line1: payload.address.line1,
        line2: payload.address.line2,
        city: payload.address.city,
        postal_code: payload.address.postal_code,
      };
      // Optionally save address for logged-in users
      if (payload.address.save && user) {
        const { count: existingCount } = await admin
          .from("addresses")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        const isFirst = (existingCount ?? 0) === 0;

        await admin.from("addresses").insert({
          user_id: user.id,
          label: payload.address.label ?? "Home",
          recipient: payload.address.recipient,
          phone: payload.address.phone,
          line1: payload.address.line1,
          line2: payload.address.line2 ?? null,
          city: payload.address.city,
          postal_code: payload.address.postal_code ?? null,
          is_default: isFirst,
          delivery_zone_id: payload.deliveryZoneId ?? null,
        });
      }
    }
  }

  // 12. Determine order status
  let orderStatus: OrderStatus;
  let paymentStatus: PaymentStatus;

  if (payload.paymentMethod === "payhere") {
    orderStatus = "pending_confirmation";
    paymentStatus = "pending";
  } else if (payload.paymentMethod === "bank_transfer") {
    orderStatus = "pending_confirmation";
    paymentStatus = "pending_transfer";
  } else {
    orderStatus = "pending_confirmation";
    paymentStatus = "cod";
  }

  // 13. Generate order number
  const orderNumber = generateOrderNumber();

  // 14. Create order
  const { data: orderRaw, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: user?.id ?? null,
      guest_email: !user ? payload.email : null,
      guest_phone: !user ? payload.phone : null,
      status: orderStatus,
      fulfillment_type: payload.fulfillmentType as FulfillmentType,
      delivery_zone_id: payload.deliveryZoneId ?? null,
      address_snapshot: addressSnapshot as unknown as Database["public"]["Tables"]["orders"]["Insert"]["address_snapshot"],
      delivery_date: payload.deliveryDate,
      time_slot_id: payload.timeSlotId,
      payment_method: payload.paymentMethod as PaymentMethod,
      payment_status: paymentStatus,
      subtotal: subtotal.toFixed(2),
      delivery_fee: deliveryFee.toFixed(2),
      discount_amount: discountAmount.toFixed(2),
      tax_amount: taxAmount.toFixed(2),
      loyalty_points_used: loyaltyPointsUsed,
      loyalty_discount: loyaltyDiscount.toFixed(2),
      total: total.toFixed(2),
      coupon_id: couponId,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (orderError || !orderRaw) {
    return { error: "Failed to create order. Please try again." };
  }

  const order = orderRaw as unknown as OrderRow;

  // 15. Create order items
  const itemsInsert = orderItemsData.map((i) => ({
    order_id: order.id,
    product_id: i.productId,
    product_snapshot: i.productSnapshot as unknown as Database["public"]["Tables"]["order_items"]["Insert"]["product_snapshot"],
    customization: i.customization as unknown as Database["public"]["Tables"]["order_items"]["Insert"]["customization"],
    quantity: i.customization.quantity,
    unit_price: i.unitPrice.toFixed(2),
    line_total: i.lineTotal.toFixed(2),
  }));

  const { error: itemsError } = await admin.from("order_items").insert(itemsInsert);
  if (itemsError) {
    // Rollback order on item failure
    await admin.from("orders").delete().eq("id", order.id);
    return { error: "Failed to save order items. Please try again." };
  }

  // 16. Initial status history
  await admin.from("order_status_history").insert({
    order_id: order.id,
    status: orderStatus,
    note: "Order placed",
    changed_by: user?.id ?? null,
  });

  // 17. Record coupon usage
  if (couponId) {
    await admin.from("coupon_usage").insert({
      coupon_id: couponId,
      order_id: order.id,
      user_id: user?.id ?? null,
    });
  }

  // 18. Loyalty points reservation
  if (loyaltyPointsUsed > 0 && user) {
    const { data: userRow } = await admin
      .from("users")
      .select("loyalty_points")
      .eq("id", user.id)
      .single();
    const currentPoints = (userRow as { loyalty_points: number } | null)?.loyalty_points ?? 0;
    const newBalance = Math.max(0, currentPoints - loyaltyPointsUsed);

    await admin
      .from("users")
      .update({ loyalty_points: newBalance })
      .eq("id", user.id);

    await admin.from("loyalty_transactions").insert({
      user_id: user.id,
      order_id: order.id,
      type: "redeem",
      points: -loyaltyPointsUsed,
      balance_after: newBalance,
      note: `Redeemed for order ${orderNumber}`,
    });
  }

  // 19. Decrement stock
  for (const item of orderItemsData) {
    const product = productMap.get(item.productId)!;
    if (product.stock_tracked) {
      await admin
        .from("products")
        .update({ stock_quantity: Math.max(0, product.stock_quantity - item.customization.quantity) })
        .eq("id", item.productId);
    }
  }

  // 20. Return redirect URL
  let redirectUrl: string;
  if (payload.paymentMethod === "payhere") {
    redirectUrl = `/checkout/pay/${orderNumber}`;
  } else {
    redirectUrl = `/order-success/${orderNumber}`;
  }

  return { success: true, orderNumber, orderId: order.id, redirectUrl };
}
