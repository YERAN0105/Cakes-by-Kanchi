import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <Container className="py-24 text-center">
      <p className="font-display text-2xl text-ink mb-2">Your cart is empty</p>
      <p className="body-base">Cart functionality coming in Phase 3.</p>
    </Container>
  );
}
