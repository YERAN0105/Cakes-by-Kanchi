import type { Metadata } from "next";
import { OrderTrackClient } from "./OrderTrackClient";

export const metadata: Metadata = { title: "Track Your Order" };

export default function TrackOrderPage() {
  return <OrderTrackClient />;
}
