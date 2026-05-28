import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const bodySchema = z.object({
  orderId: z.string().uuid(),
  storagePath: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { orderId, storagePath } = parsed.data;
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Verify this order belongs to the user (or is a guest order)
    const { data: orderRaw } = await admin
      .from("orders")
      .select("id, user_id, payment_method")
      .eq("id", orderId)
      .single();

    if (!orderRaw) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderRaw as unknown as {
      id: string;
      user_id: string | null;
      payment_method: string;
    };

    if (order.payment_method !== "bank_transfer") {
      return NextResponse.json({ error: "Not a bank transfer order" }, { status: 400 });
    }

    // Only order owner or guest can upload (guest orders have no user_id)
    if (order.user_id && user?.id !== order.user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await admin.from("bank_transfer_receipts").insert({
      order_id: orderId,
      image_url: storagePath,
      status: "pending",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[upload-receipt]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
