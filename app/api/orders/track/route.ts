import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const orderNumber = url.searchParams.get("orderNumber")?.trim();
  const contact = url.searchParams.get("contact")?.trim().toLowerCase();

  if (!orderNumber || !contact) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: rawOrder } = await admin
    .from("orders")
    .select(
      `
      order_number, status, payment_status, payment_method, fulfillment_type,
      delivery_date, subtotal, delivery_fee, discount_amount, total, created_at,
      guest_email, guest_phone, user_id,
      order_status_history(status, note, changed_at),
      order_items(product_snapshot, customization, line_total)
    `
    )
    .eq("order_number", orderNumber)
    .single();

  if (!rawOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = rawOrder as unknown as {
    order_number: string;
    status: string;
    payment_status: string;
    payment_method: string;
    fulfillment_type: string;
    delivery_date: string | null;
    subtotal: string;
    delivery_fee: string;
    discount_amount: string;
    total: string;
    created_at: string;
    guest_email: string | null;
    guest_phone: string | null;
    user_id: string | null;
    order_status_history: { status: string; note: string | null; changed_at: string }[];
    order_items: {
      product_snapshot: { name: string; sizeName: string };
      customization: { quantity: number };
      line_total: string;
    }[];
  };

  // Verify contact matches
  let contactMatch = false;
  if (order.guest_email && order.guest_email.toLowerCase() === contact) {
    contactMatch = true;
  }
  if (order.guest_phone && order.guest_phone.replace(/\D/g, "").includes(contact.replace(/\D/g, ""))) {
    contactMatch = true;
  }

  // For logged-in user orders — they need to check via account page
  // But allow lookup if they provide matching email
  if (!contactMatch && !order.guest_email && !order.guest_phone) {
    // Logged-in user order — fetch their email from users table
    if (order.user_id) {
      const { data: userData } = await admin
        .from("users")
        .select("email, phone")
        .eq("id", order.user_id)
        .single();
      const u = userData as unknown as { email: string; phone: string | null } | null;
      if (u) {
        if (u.email.toLowerCase() === contact) contactMatch = true;
        if (u.phone && u.phone.replace(/\D/g, "").includes(contact.replace(/\D/g, "")))
          contactMatch = true;
      }
    }
  }

  if (!contactMatch) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Strip sensitive fields before returning
  const safeOrder = {
    order_number: order.order_number,
    status: order.status,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    fulfillment_type: order.fulfillment_type,
    delivery_date: order.delivery_date,
    subtotal: order.subtotal,
    delivery_fee: order.delivery_fee,
    discount_amount: order.discount_amount,
    total: order.total,
    created_at: order.created_at,
    order_status_history: order.order_status_history,
    order_items: order.order_items,
  };

  return NextResponse.json({ order: safeOrder });
}
