import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Custom Cake" };

export default function CustomCakePage() {
  return (
    <>
      <div className="py-16 bg-cream-50 border-b border-border text-center">
        <p className="label-small text-wine mb-3">Bespoke</p>
        <h1 className="heading-lg">Design Your Custom Cake</h1>
        <div className="ornament-line mt-4" />
      </div>
      <Container narrow className="py-16 text-center space-y-4">
        <p className="font-display text-2xl text-ink">
          Have something special in mind?
        </p>
        <p className="body-base text-ink-light max-w-md mx-auto">
          Our bespoke inquiry form is coming soon. In the meantime, reach out to us directly on WhatsApp and we&apos;ll bring your vision to life.
        </p>
        <a
          href={`https://wa.me/${brand.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex items-center gap-2 mt-2"
        >
          Chat on WhatsApp
        </a>
      </Container>
    </>
  );
}
