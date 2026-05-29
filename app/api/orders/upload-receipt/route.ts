import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const orderId = formData.get("orderId") as string | null;

    if (!file || !orderId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: orderRaw } = await admin
      .from("orders")
      .select("id, user_id, order_number, payment_method")
      .eq("id", orderId)
      .single();

    if (!orderRaw) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderRaw as unknown as {
      id: string;
      user_id: string | null;
      order_number: string;
      payment_method: string;
    };

    if (order.payment_method !== "bank_transfer") {
      return NextResponse.json({ error: "Not a bank transfer order" }, { status: 400 });
    }

    if (order.user_id && user?.id !== order.user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `receipts/${order.order_number}/${Date.now()}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("receipts")
      .upload(path, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      console.error("[upload-receipt] storage error", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    await admin.from("bank_transfer_receipts").insert({
      order_id: orderId,
      image_url: path,
      status: "pending",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[upload-receipt]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
