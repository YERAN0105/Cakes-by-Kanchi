import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/database";

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending_confirmation: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  confirmed:           { label: "Confirmed", className: "bg-blue-50 text-blue-700 border-blue-200" },
  in_preparation:      { label: "Baking", className: "bg-orange-50 text-orange-700 border-orange-200" },
  out_for_delivery:    { label: "Out for Delivery", className: "bg-purple-50 text-purple-700 border-purple-200" },
  ready_for_pickup:    { label: "Ready for Pickup", className: "bg-purple-50 text-purple-700 border-purple-200" },
  delivered:           { label: "Delivered", className: "bg-green-50 text-green-700 border-green-200" },
  completed:           { label: "Completed", className: "bg-green-50 text-green-700 border-green-200" },
  cancelled:           { label: "Cancelled", className: "bg-red-50 text-red-600 border-red-200" },
  refunded:            { label: "Refunded", className: "bg-gray-50 text-gray-600 border-gray-200" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: "bg-gray-50 text-gray-600 border-gray-200" };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-body border",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
