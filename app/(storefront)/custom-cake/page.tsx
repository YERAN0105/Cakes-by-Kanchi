import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";

export const metadata: Metadata = { title: "Custom Cake" };

export default function CustomCakePage() {
  return (
    <>
      <div className="py-16 bg-cream-50 border-b border-border text-center">
        <p className="label-small text-wine mb-3">Bespoke</p>
        <h1 className="heading-lg">Design Your Custom Cake</h1>
        <div className="ornament-line mt-4" />
      </div>
      <Container narrow className="py-16 text-center">
        <p className="font-display text-2xl text-ink mb-2">Coming in Phase 3</p>
        <p className="body-base">The custom cake inquiry form will be built in the next phase.</p>
      </Container>
    </>
  );
}
