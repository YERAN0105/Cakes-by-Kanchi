import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentStatus, ReviewStatus, InquiryStatus } from "@/types/database";

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending_confirmation: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_preparation: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  ready_for_pickup: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_confirmation: "Pending",
  confirmed: "Confirmed",
  in_preparation: "Preparing",
  out_for_delivery: "Out for Delivery",
  ready_for_pickup: "Ready for Pickup",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  pending_transfer: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
  refunded: "bg-gray-100 text-gray-800",
  cod: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  pending_transfer: "Awaiting Transfer",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  cod: "COD",
  rejected: "Rejected",
};

const REVIEW_STYLES: Record<ReviewStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  hidden: "bg-gray-100 text-gray-800",
};

const INQUIRY_STYLES: Record<InquiryStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  quoted: "bg-amber-100 text-amber-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
};

interface StatusBadgeProps {
  type: "order" | "payment" | "review" | "inquiry";
  value: string;
  className?: string;
}

export function StatusBadge({ type, value, className }: StatusBadgeProps) {
  let style = "bg-gray-100 text-gray-800";
  let label = value;

  if (type === "order") {
    style = ORDER_STATUS_STYLES[value as OrderStatus] ?? style;
    label = ORDER_STATUS_LABELS[value as OrderStatus] ?? value;
  } else if (type === "payment") {
    style = PAYMENT_STATUS_STYLES[value as PaymentStatus] ?? style;
    label = PAYMENT_STATUS_LABELS[value as PaymentStatus] ?? value;
  } else if (type === "review") {
    style = REVIEW_STYLES[value as ReviewStatus] ?? style;
    label = value.charAt(0).toUpperCase() + value.slice(1);
  } else if (type === "inquiry") {
    style = INQUIRY_STYLES[value as InquiryStatus] ?? style;
    label = value.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        style,
        className
      )}
    >
      {label}
    </span>
  );
}
