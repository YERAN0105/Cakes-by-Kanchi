"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type {
  OrderStatus,
  ReviewStatus,
  InquiryStatus,
  LoyaltyTransactionType,
  DietaryType,
} from "@/types/database";
import { earnLoyaltyPointsAction } from "@/lib/actions/account";

export type ActionResult<T = void> = { success: true; data?: T } | { error: string };

// ── Auth guard ─────────────────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: rawProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const profile = rawProfile as { role: string } | null;
  if (profile?.role !== "admin") redirect("/");
  return { user, supabase };
}

// ── Activity log helper ────────────────────────────────────────────
async function logActivity(
  adminId: string,
  action: string,
  targetTable?: string,
  targetId?: string,
  metadata?: Record<string, unknown>
) {
  const admin = createAdminClient();
  await admin.from("activity_logs").insert({
    user_id: adminId,
    action,
    target_table: targetTable ?? null,
    target_id: targetId ?? null,
    metadata: (metadata ?? null) as import("@/types/database").Json | null,
  });
}

// ══════════════════════════════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════════════════════════════

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  category_id: z.string().uuid().nullable().optional(),
  description: z.string().optional(),
  ingredients: z.string().optional(),
  allergens: z.string().optional(),
  base_price: z.string().min(1, "Base price is required"),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  is_bestseller: z.boolean().optional(),
  stock_tracked: z.boolean().optional(),
  stock_quantity: z.number().int().min(0).optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
  allows_message: z.boolean().optional(),
  allows_color_theme: z.boolean().optional(),
  allows_photo_upload: z.boolean().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  // Related data
  sizes: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string().min(1),
        weight_kg: z.string().nullable().optional(),
        price: z.string().min(1),
      })
    )
    .optional(),
  shapes: z.array(z.string()).optional(),
  flavors: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        price_modifier: z.string().optional(),
      })
    )
    .optional(),
  tier_options: z
    .array(
      z.object({
        id: z.string().optional(),
        tier_count: z.number().int().min(1),
        price_modifier: z.string().optional(),
      })
    )
    .optional(),
  dietary_options: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.enum(["eggless", "vegan", "gluten_free"]),
        price_modifier: z.string().optional(),
      })
    )
    .optional(),
  addon_ids: z.array(z.string()).optional(),
  images: z
    .array(
      z.object({
        id: z.string().optional(),
        url: z.string(),
        alt_text: z.string().nullable().optional(),
        display_order: z.number().int().optional(),
        is_primary: z.boolean().optional(),
      })
    )
    .optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

export async function createProductAction(data: ProductFormData): Promise<ActionResult<{ id: string }>> {
  const { user } = await requireAdmin();
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const admin = createAdminClient();
  const { sizes, shapes, flavors, tier_options, dietary_options, addon_ids, images, ...productData } = parsed.data;

  const { data: product, error } = await admin
    .from("products")
    .insert({
      ...productData,
      base_price: productData.base_price,
      description: productData.description ?? null,
      ingredients: productData.ingredients ?? null,
      allergens: productData.allergens ?? null,
      category_id: productData.category_id ?? null,
      meta_title: productData.meta_title ?? null,
      meta_description: productData.meta_description ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: "Failed to create product." };

  await Promise.all([
    sizes?.length
      ? admin.from("product_sizes").insert(sizes.map((s) => ({ ...s, product_id: product.id, weight_kg: s.weight_kg ?? null })))
      : null,
    shapes?.length
      ? admin.from("product_shapes").insert(shapes.map((shape) => ({ product_id: product.id, shape })))
      : null,
    flavors?.length
      ? admin.from("product_flavors").insert(flavors.map((f) => ({ ...f, product_id: product.id, price_modifier: f.price_modifier ?? "0" })))
      : null,
    tier_options?.length
      ? admin.from("product_tier_options").insert(tier_options.map((t) => ({ ...t, product_id: product.id, price_modifier: t.price_modifier ?? "0" })))
      : null,
    dietary_options?.length
      ? admin.from("product_dietary_options").insert(dietary_options.map((d) => ({ type: d.type as DietaryType, product_id: product.id, price_modifier: d.price_modifier ?? "0" })))
      : null,
    addon_ids?.length
      ? admin.from("product_addons").insert(addon_ids.map((addon_id) => ({ product_id: product.id, addon_id })))
      : null,
    images?.length
      ? admin.from("product_images").insert(images.map((img, i) => ({ ...img, product_id: product.id, display_order: img.display_order ?? i, is_primary: img.is_primary ?? i === 0, alt_text: img.alt_text ?? null })))
      : null,
  ]);

  await logActivity(user.id, "create_product", "products", product.id, { name: productData.name });
  revalidatePath("/admin/products");
  revalidatePath("/cakes");
  return { success: true, data: { id: product.id } };
}

export async function updateProductAction(id: string, data: ProductFormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const admin = createAdminClient();
  const { sizes, shapes, flavors, tier_options, dietary_options, addon_ids, images, ...productData } = parsed.data;

  const { error } = await admin
    .from("products")
    .update({
      ...productData,
      description: productData.description ?? null,
      ingredients: productData.ingredients ?? null,
      allergens: productData.allergens ?? null,
      category_id: productData.category_id ?? null,
      meta_title: productData.meta_title ?? null,
      meta_description: productData.meta_description ?? null,
    })
    .eq("id", id);

  if (error) return { error: "Failed to update product." };

  // Replace related data
  await Promise.all([
    admin.from("product_sizes").delete().eq("product_id", id),
    admin.from("product_shapes").delete().eq("product_id", id),
    admin.from("product_flavors").delete().eq("product_id", id),
    admin.from("product_tier_options").delete().eq("product_id", id),
    admin.from("product_dietary_options").delete().eq("product_id", id),
    admin.from("product_addons").delete().eq("product_id", id),
    admin.from("product_images").delete().eq("product_id", id),
  ]);

  await Promise.all([
    sizes?.length
      ? admin.from("product_sizes").insert(sizes.map((s) => ({ label: s.label, weight_kg: s.weight_kg ?? null, price: s.price, product_id: id })))
      : null,
    shapes?.length
      ? admin.from("product_shapes").insert(shapes.map((shape) => ({ product_id: id, shape })))
      : null,
    flavors?.length
      ? admin.from("product_flavors").insert(flavors.map((f) => ({ name: f.name, price_modifier: f.price_modifier ?? "0", product_id: id })))
      : null,
    tier_options?.length
      ? admin.from("product_tier_options").insert(tier_options.map((t) => ({ tier_count: t.tier_count, price_modifier: t.price_modifier ?? "0", product_id: id })))
      : null,
    dietary_options?.length
      ? admin.from("product_dietary_options").insert(dietary_options.map((d) => ({ type: d.type as DietaryType, price_modifier: d.price_modifier ?? "0", product_id: id })))
      : null,
    addon_ids?.length
      ? admin.from("product_addons").insert(addon_ids.map((addon_id) => ({ product_id: id, addon_id })))
      : null,
    images?.length
      ? admin.from("product_images").insert(images.map((img, i) => ({ url: img.url, alt_text: img.alt_text ?? null, display_order: img.display_order ?? i, is_primary: img.is_primary ?? i === 0, product_id: id })))
      : null,
  ]);

  await logActivity(user.id, "update_product", "products", id, { name: productData.name });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/cakes");
  return { success: true };
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const { count } = await admin
    .from("order_items")
    .select("*", { count: "exact", head: true })
    .eq("product_id", id);

  if ((count ?? 0) > 0) {
    await admin.from("products").update({ is_published: false }).eq("id", id);
    await logActivity(user.id, "soft_delete_product", "products", id);
  } else {
    await admin.from("products").delete().eq("id", id);
    await logActivity(user.id, "delete_product", "products", id);
  }

  revalidatePath("/admin/products");
  return { success: true };
}

export async function toggleProductPublishedAction(id: string, is_published: boolean): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  await admin.from("products").update({ is_published }).eq("id", id);
  await logActivity(user.id, is_published ? "publish_product" : "unpublish_product", "products", id);
  revalidatePath("/admin/products");
  return { success: true };
}

export async function uploadProductImageAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  await requireAdmin();
  const admin = createAdminClient();
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided." };

  const ext = file.name.split(".").pop();
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await admin.storage.from("product-images").upload(path, file, { contentType: file.type });
  if (error) return { error: "Upload failed." };

  const { data: urlData } = admin.storage.from("product-images").getPublicUrl(path);
  return { success: true, data: { url: urlData.publicUrl } };
}

// ══════════════════════════════════════════════════════════════════
// CATEGORIES
// ══════════════════════════════════════════════════════════════════

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  image_url: z.string().nullable().optional(),
  display_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export async function createCategoryAction(data: CategoryFormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const admin = createAdminClient();
  const { error } = await admin.from("categories").insert({ ...parsed.data, description: parsed.data.description ?? null, image_url: parsed.data.image_url ?? null });
  if (error) return { error: "Failed to create category." };
  await logActivity(user.id, "create_category", "categories", undefined, { name: data.name });
  revalidatePath("/admin/categories");
  revalidatePath("/cakes");
  return { success: true };
}

export async function updateCategoryAction(id: string, data: CategoryFormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const admin = createAdminClient();
  const { error } = await admin.from("categories").update({ ...parsed.data, description: parsed.data.description ?? null, image_url: parsed.data.image_url ?? null }).eq("id", id);
  if (error) return { error: "Failed to update category." };
  await logActivity(user.id, "update_category", "categories", id);
  revalidatePath("/admin/categories");
  revalidatePath("/cakes");
  return { success: true };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("categories").delete().eq("id", id);
  if (error) return { error: "Failed to delete category." };
  await logActivity(user.id, "delete_category", "categories", id);
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function reorderCategoriesAction(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const admin = createAdminClient();
  await Promise.all(ids.map((id, i) => admin.from("categories").update({ display_order: i }).eq("id", id)));
  revalidatePath("/admin/categories");
  return { success: true };
}

// ══════════════════════════════════════════════════════════════════
// ADD-ONS
// ══════════════════════════════════════════════════════════════════

const addonSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  price: z.string().min(1, "Price is required"),
  stock_tracked: z.boolean().optional(),
  stock_quantity: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export type AddonFormData = z.infer<typeof addonSchema>;

export async function createAddonAction(data: AddonFormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const parsed = addonSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const admin = createAdminClient();
  const { error } = await admin.from("addons").insert({ ...parsed.data, description: parsed.data.description ?? null, image_url: parsed.data.image_url ?? null });
  if (error) return { error: "Failed to create add-on." };
  await logActivity(user.id, "create_addon", "addons");
  revalidatePath("/admin/addons");
  return { success: true };
}

export async function updateAddonAction(id: string, data: AddonFormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const parsed = addonSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const admin = createAdminClient();
  const { error } = await admin.from("addons").update({ ...parsed.data, description: parsed.data.description ?? null, image_url: parsed.data.image_url ?? null }).eq("id", id);
  if (error) return { error: "Failed to update add-on." };
  await logActivity(user.id, "update_addon", "addons", id);
  revalidatePath("/admin/addons");
  return { success: true };
}

export async function deleteAddonAction(id: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("addons").delete().eq("id", id);
  if (error) return { error: "Failed to delete add-on." };
  await logActivity(user.id, "delete_addon", "addons", id);
  revalidatePath("/admin/addons");
  return { success: true };
}

// ══════════════════════════════════════════════════════════════════
// ORDERS
// ══════════════════════════════════════════════════════════════════

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  note?: string
): Promise<ActionResult<{ pointsEarned?: number }>> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("order_number, status, user_id")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Order not found." };

  await admin.from("orders").update({ status }).eq("id", orderId);
  await admin.from("order_status_history").insert({
    order_id: orderId,
    status,
    note: note ?? null,
    changed_by: user.id,
  });

  let pointsEarned: number | undefined;

  if (status === "delivered" && order.user_id) {
    const result = await earnLoyaltyPointsAction(orderId);
    if ("success" in result && result.success) {
      const { data: tx } = await admin
        .from("loyalty_transactions")
        .select("points")
        .eq("order_id", orderId)
        .eq("type", "earn")
        .maybeSingle();
      pointsEarned = (tx as { points: number } | null)?.points;
    }
  }

  // Reverse loyalty points if admin cancels a delivered order
  if (status === "cancelled" && order.status === "delivered" && order.user_id) {
    const { data: earnTx } = await admin
      .from("loyalty_transactions")
      .select("points")
      .eq("order_id", orderId)
      .eq("type", "earn")
      .maybeSingle();

    if (earnTx) {
      const pts = (earnTx as { points: number }).points;
      const { data: userData } = await admin.from("users").select("loyalty_points").eq("id", order.user_id).single();
      const current = (userData as { loyalty_points: number } | null)?.loyalty_points ?? 0;
      const newBalance = Math.max(0, current - pts);
      await admin.from("users").update({ loyalty_points: newBalance }).eq("id", order.user_id);
      await admin.from("loyalty_transactions").insert({
        user_id: order.user_id,
        order_id: orderId,
        type: "adjust" as LoyaltyTransactionType,
        points: -pts,
        balance_after: newBalance,
        note: `Points reversed — order ${order.order_number} cancelled after delivery`,
      });
    }
  }

  await logActivity(user.id, "update_order_status", "orders", orderId, { status, note });
  revalidatePath(`/admin/orders/${order.order_number}`);
  revalidatePath("/admin/orders");
  return { success: true, data: { pointsEarned } };
}

export async function addOrderNoteAction(orderId: string, note: string): Promise<ActionResult> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("internal_notes, order_number").eq("id", orderId).single();
  if (!order) return { error: "Order not found." };
  const o = order as { internal_notes: string | null; order_number: string };
  const timestamp = new Date().toISOString();
  const newNote = `[${timestamp}] ${note}`;
  const updated = o.internal_notes ? `${o.internal_notes}\n${newNote}` : newNote;
  await admin.from("orders").update({ internal_notes: updated }).eq("id", orderId);
  revalidatePath(`/admin/orders/${o.order_number}`);
  return { success: true };
}

export async function approveBankTransferAction(orderId: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  await admin
    .from("bank_transfer_receipts")
    .update({ status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("order_id", orderId);

  await admin.from("orders").update({ payment_status: "paid", status: "confirmed" }).eq("id", orderId);

  const { data: order } = await admin.from("orders").select("order_number").eq("id", orderId).single();
  await admin.from("order_status_history").insert({
    order_id: orderId,
    status: "confirmed" as OrderStatus,
    note: "Bank transfer approved — payment confirmed",
    changed_by: user.id,
  });

  await logActivity(user.id, "approve_bank_transfer", "orders", orderId);
  revalidatePath(`/admin/orders/${(order as { order_number: string } | null)?.order_number}`);
  revalidatePath("/admin/payments/pending");
  return { success: true };
}

export async function rejectBankTransferAction(orderId: string, reason: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  await admin
    .from("bank_transfer_receipts")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      reject_reason: reason,
    })
    .eq("order_id", orderId);

  await logActivity(user.id, "reject_bank_transfer", "orders", orderId, { reason });
  revalidatePath("/admin/payments/pending");
  return { success: true };
}

export async function cancelOrderAdminAction(orderId: string, reason: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const { data: rawOrder } = await admin
    .from("orders")
    .select("order_number, coupon_id, loyalty_points_used, user_id")
    .eq("id", orderId)
    .single();

  if (!rawOrder) return { error: "Order not found." };
  const order = rawOrder as {
    order_number: string;
    coupon_id: string | null;
    loyalty_points_used: number;
    user_id: string | null;
  };

  await admin.from("orders").update({ status: "cancelled" }).eq("id", orderId);
  await admin.from("order_status_history").insert({
    order_id: orderId,
    status: "cancelled" as OrderStatus,
    note: `Cancelled by admin: ${reason}`,
    changed_by: user.id,
  });

  if (order.coupon_id) {
    await admin.from("coupon_usage").delete().eq("order_id", orderId);
  }

  if (order.loyalty_points_used > 0 && order.user_id) {
    const { data: userData } = await admin.from("users").select("loyalty_points").eq("id", order.user_id).single();
    const current = (userData as { loyalty_points: number } | null)?.loyalty_points ?? 0;
    const newBalance = current + order.loyalty_points_used;
    await admin.from("users").update({ loyalty_points: newBalance }).eq("id", order.user_id);
    await admin.from("loyalty_transactions").insert({
      user_id: order.user_id,
      order_id: orderId,
      type: "adjust" as LoyaltyTransactionType,
      points: order.loyalty_points_used,
      balance_after: newBalance,
      note: `Points restored — order ${order.order_number} cancelled by admin`,
    });
  }

  await logActivity(user.id, "cancel_order", "orders", orderId, { reason });
  revalidatePath(`/admin/orders/${order.order_number}`);
  revalidatePath("/admin/orders");
  return { success: true };
}

// ══════════════════════════════════════════════════════════════════
// CUSTOMERS
// ══════════════════════════════════════════════════════════════════

export async function blockCustomerAction(id: string, blocked: boolean): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  await admin.from("users").update({ blocked }).eq("id", id);
  await logActivity(user.id, blocked ? "block_customer" : "unblock_customer", "users", id);
  revalidatePath(`/admin/customers/${id}`);
  revalidatePath("/admin/customers");
  return { success: true };
}

export async function adjustLoyaltyAction(
  userId: string,
  points: number,
  note: string
): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const { data: userData } = await admin.from("users").select("loyalty_points").eq("id", userId).single();
  const current = (userData as { loyalty_points: number } | null)?.loyalty_points ?? 0;
  const newBalance = Math.max(0, current + points);
  await admin.from("users").update({ loyalty_points: newBalance }).eq("id", userId);
  await admin.from("loyalty_transactions").insert({
    user_id: userId,
    type: "adjust" as LoyaltyTransactionType,
    points,
    balance_after: newBalance,
    note,
  });
  await logActivity(user.id, "adjust_loyalty", "users", userId, { points, note });
  revalidatePath(`/admin/customers/${userId}`);
  return { success: true };
}

const createCustomerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z
    .string()
    .regex(/^\d{9}$/, "Enter 9 digits")
    .optional()
    .or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateCustomerData = z.infer<typeof createCustomerSchema>;

export async function createCustomerAction(data: CreateCustomerData): Promise<ActionResult> {
  const { user: adminUser } = await requireAdmin();
  const parsed = createCustomerSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const admin = createAdminClient();

  const phone = parsed.data.phone ? `+94${parsed.data.phone}` : null;
  if (phone) {
    const { data: existing } = await admin.from("users").select("id").eq("phone", phone).maybeSingle();
    if (existing) return { error: "Phone number already in use." };
  }

  const { data: authData, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { name: parsed.data.name },
  });

  if (error) return { error: error.message };

  await admin.from("users").insert({
    id: authData.user.id,
    email: parsed.data.email,
    name: parsed.data.name,
    phone,
    role: "customer",
  });

  await logActivity(adminUser.id, "create_customer", "users", authData.user.id, { email: parsed.data.email });
  revalidatePath("/admin/customers");
  return { success: true };
}

export async function updateCustomerProfileAction(
  id: string,
  data: { name: string; phone: string }
): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const phone = data.phone ? `+94${data.phone.replace(/^\+94/, "")}` : null;
  if (phone) {
    const { data: existing } = await admin.from("users").select("id").eq("phone", phone).neq("id", id).maybeSingle();
    if (existing) return { error: "Phone number already in use." };
  }
  await admin.from("users").update({ name: data.name, phone }).eq("id", id);
  await logActivity(user.id, "update_customer", "users", id);
  revalidatePath(`/admin/customers/${id}`);
  return { success: true };
}

// ══════════════════════════════════════════════════════════════════
// INQUIRIES
// ══════════════════════════════════════════════════════════════════

export async function updateInquiryStatusAction(id: string, status: InquiryStatus): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  await admin.from("custom_inquiries").update({ status }).eq("id", id);
  await logActivity(user.id, "update_inquiry_status", "custom_inquiries", id, { status });
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
  return { success: true };
}

export async function sendQuoteAction(
  id: string,
  quotedAmount: string,
  quoteMessage: string
): Promise<ActionResult<{ paymentLink: string }>> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const token = `${id.replace(/-/g, "").slice(0, 12)}-${Date.now()}`;
  const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/quote/${token}`;

  await admin
    .from("custom_inquiries")
    .update({ status: "quoted", quoted_amount: quotedAmount, quote_message: quoteMessage, payment_link: paymentLink })
    .eq("id", id);

  await logActivity(user.id, "send_quote", "custom_inquiries", id, { quotedAmount });
  revalidatePath(`/admin/inquiries/${id}`);
  revalidatePath("/admin/inquiries");
  return { success: true, data: { paymentLink } };
}

// ══════════════════════════════════════════════════════════════════
// COUPONS
// ══════════════════════════════════════════════════════════════════

const couponSchema = z.object({
  code: z.string().min(1).toUpperCase(),
  type: z.enum(["percent", "flat", "free_delivery"]),
  value: z.string(),
  min_order_amount: z.string().nullable().optional(),
  max_discount: z.string().nullable().optional(),
  usage_limit_total: z.number().int().nullable().optional(),
  usage_limit_per_user: z.number().int().nullable().optional(),
  valid_from: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type CouponFormData = z.infer<typeof couponSchema>;

export async function createCouponAction(data: CouponFormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const parsed = couponSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const admin = createAdminClient();
  const { data: existing } = await admin.from("coupons").select("id").eq("code", parsed.data.code).maybeSingle();
  if (existing) return { error: "Coupon code already exists." };
  const { error } = await admin.from("coupons").insert({
    ...parsed.data,
    min_order_amount: parsed.data.min_order_amount ?? null,
    max_discount: parsed.data.max_discount ?? null,
    usage_limit_total: parsed.data.usage_limit_total ?? null,
    usage_limit_per_user: parsed.data.usage_limit_per_user ?? null,
    valid_from: parsed.data.valid_from ?? null,
    valid_until: parsed.data.valid_until ?? null,
  });
  if (error) return { error: "Failed to create coupon." };
  await logActivity(user.id, "create_coupon", "coupons", undefined, { code: data.code });
  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function updateCouponAction(id: string, data: CouponFormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const parsed = couponSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const admin = createAdminClient();
  const { data: existing } = await admin.from("coupons").select("id").eq("code", parsed.data.code).neq("id", id).maybeSingle();
  if (existing) return { error: "Coupon code already in use." };
  const { error } = await admin.from("coupons").update({
    ...parsed.data,
    min_order_amount: parsed.data.min_order_amount ?? null,
    max_discount: parsed.data.max_discount ?? null,
    usage_limit_total: parsed.data.usage_limit_total ?? null,
    usage_limit_per_user: parsed.data.usage_limit_per_user ?? null,
    valid_from: parsed.data.valid_from ?? null,
    valid_until: parsed.data.valid_until ?? null,
  }).eq("id", id);
  if (error) return { error: "Failed to update coupon." };
  await logActivity(user.id, "update_coupon", "coupons", id);
  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function deleteCouponAction(id: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  await admin.from("coupons").delete().eq("id", id);
  await logActivity(user.id, "delete_coupon", "coupons", id);
  revalidatePath("/admin/coupons");
  return { success: true };
}

// ══════════════════════════════════════════════════════════════════
// BANNERS
// ══════════════════════════════════════════════════════════════════

const bannerSchema = z.object({
  image_url: z.string().min(1, "Image is required"),
  headline: z.string().nullable().optional(),
  subheadline: z.string().nullable().optional(),
  cta_text: z.string().nullable().optional(),
  cta_link: z.string().nullable().optional(),
  position: z.string().optional(),
  display_order: z.number().int().min(0).optional(),
  valid_from: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type BannerFormData = z.infer<typeof bannerSchema>;

export async function createBannerAction(data: BannerFormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const parsed = bannerSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const admin = createAdminClient();
  const { error } = await admin.from("banners").insert({
    ...parsed.data,
    headline: parsed.data.headline ?? null,
    subheadline: parsed.data.subheadline ?? null,
    cta_text: parsed.data.cta_text ?? null,
    cta_link: parsed.data.cta_link ?? null,
    valid_from: parsed.data.valid_from ?? null,
    valid_until: parsed.data.valid_until ?? null,
  });
  if (error) return { error: "Failed to create banner." };
  await logActivity(user.id, "create_banner", "banners");
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { success: true };
}

export async function updateBannerAction(id: string, data: BannerFormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const parsed = bannerSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const admin = createAdminClient();
  const { error } = await admin.from("banners").update({
    ...parsed.data,
    headline: parsed.data.headline ?? null,
    subheadline: parsed.data.subheadline ?? null,
    cta_text: parsed.data.cta_text ?? null,
    cta_link: parsed.data.cta_link ?? null,
    valid_from: parsed.data.valid_from ?? null,
    valid_until: parsed.data.valid_until ?? null,
  }).eq("id", id);
  if (error) return { error: "Failed to update banner." };
  await logActivity(user.id, "update_banner", "banners", id);
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { success: true };
}

export async function deleteBannerAction(id: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  await admin.from("banners").delete().eq("id", id);
  await logActivity(user.id, "delete_banner", "banners", id);
  revalidatePath("/admin/banners");
  return { success: true };
}

// ══════════════════════════════════════════════════════════════════
// DELIVERY ZONES
// ══════════════════════════════════════════════════════════════════

const zoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  fee: z.string().min(1, "Fee is required"),
  estimated_time: z.string().nullable().optional(),
  min_order_amount: z.string().nullable().optional(),
  same_day_surcharge: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type ZoneFormData = z.infer<typeof zoneSchema>;

export async function createZoneAction(data: ZoneFormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const parsed = zoneSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const admin = createAdminClient();
  const { error } = await admin.from("delivery_zones").insert({
    ...parsed.data,
    estimated_time: parsed.data.estimated_time ?? null,
    min_order_amount: parsed.data.min_order_amount ?? null,
    same_day_surcharge: parsed.data.same_day_surcharge ?? "0",
  });
  if (error) return { error: "Failed to create zone." };
  await logActivity(user.id, "create_delivery_zone", "delivery_zones");
  revalidatePath("/admin/delivery-zones");
  return { success: true };
}

export async function updateZoneAction(id: string, data: ZoneFormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const parsed = zoneSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const admin = createAdminClient();
  const { error } = await admin.from("delivery_zones").update({
    ...parsed.data,
    estimated_time: parsed.data.estimated_time ?? null,
    min_order_amount: parsed.data.min_order_amount ?? null,
    same_day_surcharge: parsed.data.same_day_surcharge ?? "0",
  }).eq("id", id);
  if (error) return { error: "Failed to update zone." };
  await logActivity(user.id, "update_delivery_zone", "delivery_zones", id);
  revalidatePath("/admin/delivery-zones");
  return { success: true };
}

export async function deleteZoneAction(id: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  await admin.from("delivery_zones").delete().eq("id", id);
  await logActivity(user.id, "delete_delivery_zone", "delivery_zones", id);
  revalidatePath("/admin/delivery-zones");
  return { success: true };
}

// ══════════════════════════════════════════════════════════════════
// TIME SLOTS
// ══════════════════════════════════════════════════════════════════

const slotSchema = z.object({
  label: z.string().min(1, "Label is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  capacity: z.number().int().min(1).optional(),
  is_active: z.boolean().optional(),
});

export type SlotFormData = z.infer<typeof slotSchema>;

export async function createSlotAction(data: SlotFormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const parsed = slotSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const admin = createAdminClient();
  const { error } = await admin.from("time_slots").insert({ ...parsed.data, capacity: parsed.data.capacity ?? 10 });
  if (error) return { error: "Failed to create time slot." };
  await logActivity(user.id, "create_time_slot", "time_slots");
  revalidatePath("/admin/schedule");
  return { success: true };
}

export async function updateSlotAction(id: string, data: SlotFormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const parsed = slotSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const admin = createAdminClient();
  const { error } = await admin.from("time_slots").update({ ...parsed.data, capacity: parsed.data.capacity ?? 10 }).eq("id", id);
  if (error) return { error: "Failed to update time slot." };
  await logActivity(user.id, "update_time_slot", "time_slots", id);
  revalidatePath("/admin/schedule");
  return { success: true };
}

export async function deleteSlotAction(id: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  await admin.from("time_slots").delete().eq("id", id);
  await logActivity(user.id, "delete_time_slot", "time_slots", id);
  revalidatePath("/admin/schedule");
  return { success: true };
}

// ══════════════════════════════════════════════════════════════════
// HOLIDAYS
// ══════════════════════════════════════════════════════════════════

export async function createHolidayAction(date: string, label: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("holidays").insert({ date, label: label || null });
  if (error) return { error: "Failed to create holiday." };
  await logActivity(user.id, "create_holiday", "holidays");
  revalidatePath("/admin/schedule");
  return { success: true };
}

export async function deleteHolidayAction(id: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  await admin.from("holidays").delete().eq("id", id);
  await logActivity(user.id, "delete_holiday", "holidays", id);
  revalidatePath("/admin/schedule");
  return { success: true };
}

// ══════════════════════════════════════════════════════════════════
// REVIEWS
// ══════════════════════════════════════════════════════════════════

export async function updateReviewStatusAdminAction(id: string, status: ReviewStatus): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  await admin.from("reviews").update({ status }).eq("id", id);
  await logActivity(user.id, "update_review_status", "reviews", id, { status });
  revalidatePath("/admin/reviews");
  return { success: true };
}

export async function deleteReviewAdminAction(id: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  await admin.from("reviews").delete().eq("id", id);
  await logActivity(user.id, "delete_review", "reviews", id);
  revalidatePath("/admin/reviews");
  return { success: true };
}

export async function replyToReviewAction(id: string, reply: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  await admin.from("reviews").update({ admin_reply: reply }).eq("id", id);
  await logActivity(user.id, "reply_review", "reviews", id);
  revalidatePath("/admin/reviews");
  return { success: true };
}

// ══════════════════════════════════════════════════════════════════
// LOYALTY SETTINGS
// ══════════════════════════════════════════════════════════════════

export async function saveLoyaltySettingsAction(settings: {
  earn_rate: number;
  redemption_rate: number;
  max_redemption_percent: number;
  welcome_bonus: number;
  birthday_bonus: number;
  review_bonus: number;
  expiry_months: number;
}): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  await admin
    .from("settings")
    .upsert({ key: "loyalty", value: settings as unknown as import("@/types/database").Json });
  await logActivity(user.id, "update_loyalty_settings", "settings");
  return { success: true };
}

// ══════════════════════════════════════════════════════════════════
// SHOP SETTINGS
// ══════════════════════════════════════════════════════════════════

export async function saveSettingsAction(key: string, value: Record<string, unknown>): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  await admin
    .from("settings")
    .upsert({ key, value: value as unknown as import("@/types/database").Json });
  await logActivity(user.id, "update_settings", "settings", undefined, { key });
  return { success: true };
}
