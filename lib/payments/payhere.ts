import crypto from "crypto";

// PayHere hosted checkout URLs
const SANDBOX_URL = "https://sandbox.payhere.lk/pay/checkout";
const LIVE_URL = "https://www.payhere.lk/pay/checkout";

export function getPayHereCheckoutUrl(): string {
  return process.env.PAYHERE_MODE === "live" ? LIVE_URL : SANDBOX_URL;
}

export interface PayHereCheckoutParams {
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  currency: string;
  amount: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash: string;
}

function md5(value: string): string {
  return crypto.createHash("md5").update(value).digest("hex").toUpperCase();
}

export function generateCheckoutParams(order: {
  orderNumber: string;
  total: number;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  itemName: string;
}): PayHereCheckoutParams | null {
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!merchantId || !merchantSecret) return null;

  const amount = order.total.toFixed(2);
  const currency = "LKR";

  // PayHere hash: MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret).toUpperCase())
  const hashedSecret = md5(merchantSecret);
  const hashInput = `${merchantId}${order.orderNumber}${amount}${currency}${hashedSecret}`;
  const hash = md5(hashInput);

  const nameParts = order.contactName.trim().split(" ");
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") || firstName;

  const returnUrl =
    process.env.PAYHERE_RETURN_URL || `${appUrl}/order-success/${order.orderNumber}`;
  const cancelUrl =
    process.env.PAYHERE_CANCEL_URL || `${appUrl}/checkout/failed/${order.orderNumber}`;
  const notifyUrl =
    process.env.PAYHERE_NOTIFY_URL || `${appUrl}/api/payments/payhere/webhook`;

  return {
    merchant_id: merchantId,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    order_id: order.orderNumber,
    items: order.itemName,
    currency,
    amount,
    first_name: firstName,
    last_name: lastName,
    email: order.email,
    phone: order.phone,
    address: order.address,
    city: order.city,
    country: "Sri Lanka",
    hash,
  };
}

export interface PayHereWebhookPayload {
  merchant_id: string;
  order_id: string;
  payment_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  method: string;
  status_message: string;
  [key: string]: string;
}

export function verifyWebhookSignature(payload: PayHereWebhookPayload): boolean {
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

  if (!merchantId || !merchantSecret) return false;

  const hashedSecret = md5(merchantSecret);
  const expected = md5(
    `${merchantId}${payload.order_id}${payload.payhere_amount}${payload.payhere_currency}${hashedSecret}${payload.status_code}`
  );

  return expected === payload.md5sig?.toUpperCase();
}

// PayHere status codes
export const PAYHERE_STATUS = {
  SUCCESS: "2",
  PENDING: "0",
  CANCELLED: "-1",
  FAILED: "-2",
  CHARGEDBACK: "-3",
} as const;
