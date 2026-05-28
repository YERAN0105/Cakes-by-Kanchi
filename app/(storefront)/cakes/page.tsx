import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";

export const metadata: Metadata = { title: "Our Cakes" };

export default function CakesPage() {
  return (
    <>
      <div className="py-16 bg-cream-50 border-b border-border text-center">
        <p className="label-small text-wine mb-3">The Collection</p>
        <h1 className="heading-lg">Our Cakes</h1>
        <div className="ornament-line mt-4" />
      </div>
      <Container className="py-16 text-center">
        <p className="font-display text-2xl text-ink mb-2">Coming in Phase 2</p>
        <p className="body-base">The full product catalog will be built in the next phase.</p>
      </Container>
    </>
  );
}
