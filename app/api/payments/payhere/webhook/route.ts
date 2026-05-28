import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  verifyWebhookSignature,
  PAYHERE_STATUS,
  type PayHereWebhookPayload,
} from "@/lib/payments/payhere";
import type { Database } from "@/types/database";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = String(value);
    });

    const webhookPayload = payload as PayHereWebhookPayload;

    // Verify signature
    if (!verifyWebhookSignature(webhookPayload)) {
      console.error("[PayHere] Invalid signature for order:", webhookPayload.order_id);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const admin = createAdminClient();
    const orderNumber = webhookPayload.order_id;
    const statusCode = webhookPayload.status_code;

    // Fetch order
    const { data: rawOrder } = await admin
      .from("orders")
      .select("id, status, payment_status, total")
      .eq("order_number", orderNumber)
      .single();

    if (!rawOrder) {
      console.error("[PayHere] Order not found:", orderNumber);
      return NextResponse.json({ ok: true }); // Always 200 to PayHere
    }

    const order = rawOrder as unknown as {
      id: string;
      status: OrderStatus;
      payment_status: PaymentStatus;
      total: string;
    };

    // Map PayHere status codes to our statuses
    let newPaymentStatus: PaymentStatus | null = null;
    let newOrderStatus: OrderStatus | null = null;

    if (statusCode === PAYHERE_STATUS.SUCCESS) {
      newPaymentStatus = "paid";
      newOrderStatus = "confirmed";
    } else if (statusCode === PAYHERE_STATUS.PENDING) {
      newPaymentStatus = "pending";
    } else if (statusCode === PAYHERE_STATUS.CANCELLED) {
      newPaymentStatus = "cancelled";
    } else if (statusCode === PAYHERE_STATUS.FAILED) {
      newPaymentStatus = "failed";
    } else if (statusCode === PAYHERE_STATUS.CHARGEDBACK) {
      newPaymentStatus = "refunded";
      newOrderStatus = "refunded";
    }

    // Update order
    if (newPaymentStatus) {
      const updateData: Partial<Database["public"]["Tables"]["orders"]["Update"]> = {
        payment_status: newPaymentStatus,
      };
      if (newOrderStatus) updateData.status = newOrderStatus;

      await admin.from("orders").update(updateData).eq("id", order.id);

      // Add status history entry
      if (newOrderStatus) {
        await admin.from("order_status_history").insert({
          order_id: order.id,
          status: newOrderStatus,
          note: `PayHere payment ${statusCode === PAYHERE_STATUS.SUCCESS ? "successful" : "status: " + statusCode}`,
          changed_by: null,
        });
      }
    }

    // Record raw payment entry
    await admin.from("payments").insert({
      order_id: order.id,
      gateway: "payhere",
      gateway_transaction_id: webhookPayload.payment_id ?? null,
      amount: webhookPayload.payhere_amount ?? order.total,
      status: webhookPayload.status_message ?? String(statusCode),
      raw_response: payload as unknown as Database["public"]["Tables"]["payments"]["Insert"]["raw_response"],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PayHere] Webhook error:", err);
    return NextResponse.json({ ok: true }); // Always return 200 to PayHere
  }
}
