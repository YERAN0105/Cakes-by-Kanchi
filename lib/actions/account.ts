"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Database, LoyaltyTransactionType } from "@/types/database";

// ── Auth helper ───────────────────────────────────────────────────
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { user, supabase };
}

// ── Result type ───────────────────────────────────────────────────
export type ActionResult<T = void> = { success: true; data?: T } | { error: string };

// ── Wishlist ──────────────────────────────────────────────────────

export async function syncWishlistAction(localIds: string[]): Promise<{ ids: string[] }> {
  const { user } = await requireUser();
  const admin = createAdminClient();

  if (localIds.length > 0) {
    await admin
      .from("wishlist")
      .upsert(
        localIds.map((productId) => ({ user_id: user.id, product_id: productId })),
        { ignoreDuplicates: true }
      );
  }

  const { data } = await admin.from("wishlist").select("product_id").eq("user_id", user.id);
  return { ids: (data ?? []).map((r) => r.product_id) };
}

export async function toggleWishlistDbAction(productId: string): Promise<{ isWishlisted: boolean }> {
  const { user } = await requireUser();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("wishlist")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await admin.from("wishlist").delete().eq("user_id", user.id).eq("product_id", productId);
    return { isWishlisted: false };
  } else {
    await admin.from("wishlist").insert({ user_id: user.id, product_id: productId });
    return { isWishlisted: true };
  }
}

export async function getDbWishlistIds(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase.from("wishlist").select("product_id").eq("user_id", user.id);
  return ((data ?? []) as unknown as { product_id: string }[]).map((r) => r.product_id);
}

// ── Addresses ─────────────────────────────────────────────────────

const addressFormSchema = z.object({
  label: z.string().min(1).max(50),
  recipient: z.string().min(2, "Recipient name is required"),
  phone: z.string().min(7, "Phone number is required"),
  line1: z.string().min(5, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  postal_code: z.string().optional(),
  delivery_zone_id: z.string().uuid().optional(),
});

export type AddressFormData = z.infer<typeof addressFormSchema>;

export async function saveAddressAction(data: AddressFormData): Promise<ActionResult> {
  const parsed = addressFormSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { user } = await requireUser();
  const admin = createAdminClient();

  const { count } = await admin
    .from("addresses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const isFirst = (count ?? 0) === 0;

  const { error } = await admin.from("addresses").insert({
    user_id: user.id,
    ...parsed.data,
    line2: parsed.data.line2 ?? null,
    postal_code: parsed.data.postal_code ?? null,
    delivery_zone_id: parsed.data.delivery_zone_id ?? null,
    is_default: isFirst,
  });

  if (error) return { error: "Failed to save address." };
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}

export async function updateAddressAction(id: string, data: AddressFormData): Promise<ActionResult> {
  const parsed = addressFormSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { user } = await requireUser();
  const admin = createAdminClient();

  const { error } = await admin
    .from("addresses")
    .update({
      ...parsed.data,
      line2: parsed.data.line2 ?? null,
      postal_code: parsed.data.postal_code ?? null,
      delivery_zone_id: parsed.data.delivery_zone_id ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to update address." };
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}

export async function deleteAddressAction(id: string): Promise<ActionResult> {
  const { user } = await requireUser();
  const admin = createAdminClient();

  const { error } = await admin
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to delete address." };
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}

export async function setDefaultAddressAction(id: string): Promise<ActionResult> {
  const { user } = await requireUser();
  const admin = createAdminClient();

  await admin.from("addresses").update({ is_default: false }).eq("user_id", user.id);

  const { error } = await admin
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to set default address." };
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}

// ── Profile ───────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^\d{9}$/, "Enter 9 digits (e.g. 771234567)")
    .optional()
    .or(z.literal("")),
});

export async function updateProfileAction(data: {
  name: string;
  phone: string;
}): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { user } = await requireUser();
  const admin = createAdminClient();

  const phone = parsed.data.phone ? `+94${parsed.data.phone.replace(/^\+94/, "")}` : null;

  if (phone) {
    const { data: existing } = await admin
      .from("users")
      .select("id")
      .eq("phone", phone)
      .neq("id", user.id)
      .maybeSingle();
    if (existing) return { error: "This phone number is already in use." };
  }

  const { error } = await admin
    .from("users")
    .update({ name: parsed.data.name, phone })
    .eq("id", user.id);

  if (error) return { error: "Failed to update profile." };

  revalidatePath("/account/profile");
  revalidatePath("/account");
  return { success: true };
}

export async function changePasswordAction(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  if (data.newPassword !== data.confirmPassword) return { error: "Passwords do not match." };
  if (data.newPassword.length < 8) return { error: "Password must be at least 8 characters." };

  const { supabase } = await requireUser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Unable to verify identity." };

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: data.currentPassword,
  });
  if (verifyError) return { error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: data.newPassword });
  if (error) return { error: error.message };

  return { success: true };
}

// ── Cancel Order ──────────────────────────────────────────────────

type OrderWithItems = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items: {
    product_id: string | null;
    quantity: number;
    unit_price: string;
    line_total: string;
  }[];
};

export async function cancelOrderAction(
  orderId: string,
  reason: string
): Promise<ActionResult> {
  const { user } = await requireUser();
  const admin = createAdminClient();

  const { data: rawOrder } = await admin
    .from("orders")
    .select("*, order_items(product_id, quantity, unit_price, line_total)")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (!rawOrder) return { error: "Order not found." };

  const order = rawOrder as unknown as OrderWithItems;

  if (!["pending_confirmation", "confirmed"].includes(order.status)) {
    return { error: "This order cannot be cancelled at its current status." };
  }

  await admin.from("orders").update({ status: "cancelled" }).eq("id", orderId);

  await admin.from("order_status_history").insert({
    order_id: orderId,
    status: "cancelled",
    note: `Cancelled by customer: ${reason}`,
    changed_by: user.id,
  });

  // Restore loyalty points used on this order
  if (order.loyalty_points_used > 0) {
    const { data: userData } = await admin
      .from("users")
      .select("loyalty_points")
      .eq("id", user.id)
      .single();
    const currentPoints = (userData as { loyalty_points: number } | null)?.loyalty_points ?? 0;
    const newBalance = currentPoints + order.loyalty_points_used;

    await admin.from("users").update({ loyalty_points: newBalance }).eq("id", user.id);
    await admin.from("loyalty_transactions").insert({
      user_id: user.id,
      order_id: orderId,
      type: "adjust" as LoyaltyTransactionType,
      points: order.loyalty_points_used,
      balance_after: newBalance,
      note: `Points restored — order ${order.order_number} cancelled`,
    });
  }

  // Release coupon usage so the coupon can be used again
  if (order.coupon_id) {
    await admin.from("coupon_usage").delete().eq("order_id", orderId);
  }

  // Restore stock for physical add-ons (stock_tracked products only)
  const itemsWithProducts = order.order_items.filter((i) => i.product_id !== null);
  if (itemsWithProducts.length > 0) {
    const { data: products } = await admin
      .from("products")
      .select("id, stock_tracked, stock_quantity")
      .in("id", itemsWithProducts.map((i) => i.product_id as string));

    for (const product of (products ?? []) as { id: string; stock_tracked: boolean; stock_quantity: number }[]) {
      if (!product.stock_tracked) continue;
      const item = itemsWithProducts.find((i) => i.product_id === product.id)!;
      await admin
        .from("products")
        .update({ stock_quantity: product.stock_quantity + item.quantity })
        .eq("id", product.id);
    }
  }

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${order.order_number}`);
  return { success: true };
}

// ── Reviews ───────────────────────────────────────────────────────

const reviewSchema = z.object({
  order_item_id: z.string().uuid(),
  product_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(80).optional(),
  body: z.string().max(1000).optional(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

export async function submitReviewAction(data: ReviewFormData): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { user } = await requireUser();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("reviews")
    .select("id")
    .eq("order_item_id", parsed.data.order_item_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return { error: "You have already reviewed this item." };

  const { error } = await admin.from("reviews").insert({
    ...parsed.data,
    user_id: user.id,
    title: parsed.data.title ?? null,
    body: parsed.data.body ?? null,
    status: "pending",
  });

  if (error) return { error: "Failed to submit review." };

  revalidatePath("/account/reviews");
  return { success: true };
}

export async function updateReviewAction(
  reviewId: string,
  data: Pick<ReviewFormData, "rating" | "title" | "body">
): Promise<ActionResult> {
  const { user } = await requireUser();
  const admin = createAdminClient();

  const { error } = await admin
    .from("reviews")
    .update({
      rating: data.rating,
      title: data.title ?? null,
      body: data.body ?? null,
    })
    .eq("id", reviewId)
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) return { error: "Failed to update review." };

  revalidatePath("/account/reviews");
  return { success: true };
}

export async function deleteReviewAction(reviewId: string): Promise<ActionResult> {
  const { user } = await requireUser();
  const admin = createAdminClient();

  const { error } = await admin
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) return { error: "Failed to delete review." };

  revalidatePath("/account/reviews");
  return { success: true };
}

// ── Loyalty Points Earn (stub for Phase 5 to call) ────────────────

export async function earnLoyaltyPointsAction(orderId: string): Promise<ActionResult> {
  const admin = createAdminClient();

  const { data: rawOrder } = await admin
    .from("orders")
    .select("id, order_number, user_id, total, status")
    .eq("id", orderId)
    .single();

  if (!rawOrder) return { error: "Order not found." };
  const order = rawOrder as unknown as Database["public"]["Tables"]["orders"]["Row"];

  if (!order.user_id) return { success: true };
  if (order.status !== "delivered") return { error: "Points are only earned on delivered orders." };

  const { data: existingTx } = await admin
    .from("loyalty_transactions")
    .select("id")
    .eq("order_id", orderId)
    .eq("type", "earn")
    .maybeSingle();

  if (existingTx) return { success: true };

  const earnRate = 100;
  const total = parseFloat(order.total);
  const pointsEarned = Math.floor(total / earnRate);

  if (pointsEarned === 0) return { success: true };

  const { data: userData } = await admin
    .from("users")
    .select("loyalty_points")
    .eq("id", order.user_id)
    .single();
  const currentPoints = (userData as { loyalty_points: number } | null)?.loyalty_points ?? 0;
  const newBalance = currentPoints + pointsEarned;

  await admin.from("users").update({ loyalty_points: newBalance }).eq("id", order.user_id);

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await admin.from("loyalty_transactions").insert({
    user_id: order.user_id,
    order_id: orderId,
    type: "earn" as LoyaltyTransactionType,
    points: pointsEarned,
    balance_after: newBalance,
    note: `Earned for order ${order.order_number}`,
    expires_at: expiresAt.toISOString(),
  });

  return { success: true };
}
