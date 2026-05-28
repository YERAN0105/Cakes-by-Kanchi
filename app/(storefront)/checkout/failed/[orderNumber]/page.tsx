import Link from "next/link";
import { XCircle } from "lucide-react";

interface Props {
  params: Promise<{ orderNumber: string }>;
}

export default async function PaymentFailedPage({ params }: Props) {
  const { orderNumber } = await params;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
        <XCircle className="w-8 h-8 text-destructive" aria-hidden="true" />
      </div>
      <div className="max-w-sm space-y-2">
        <h1 className="font-display text-2xl font-semibold text-ink">Payment Cancelled</h1>
        <p className="font-body text-ink-light text-sm">
          Your payment was not completed. Your order <strong>{orderNumber}</strong> has been saved.
        </p>
        <p className="font-body text-ink-light text-sm">
          You can retry payment from your order history, or contact us for help.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/cakes" className="btn-secondary px-6 py-2.5 text-sm">
          Continue Shopping
        </Link>
        <Link href="/account/orders" className="btn-primary px-6 py-2.5 text-sm">
          View Orders
        </Link>
      </div>
    </div>
  );
}
