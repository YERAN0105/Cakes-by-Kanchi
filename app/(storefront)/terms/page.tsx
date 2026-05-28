import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `Terms and conditions for using ${brand.name}.`,
};

export default function TermsPage() {
  return (
    <>
      <div className="py-16 bg-cream-50 border-b border-border text-center">
        <p className="label-small text-wine mb-3">Legal</p>
        <h1 className="heading-lg">Terms &amp; Conditions</h1>
        <div className="ornament-line mt-4" />
      </div>

      <Container narrow className="py-16 prose-custom">
        <div className="space-y-8 font-body text-ink-light leading-relaxed">
          <p className="text-sm text-ink-light">Last updated: {new Date().toLocaleDateString("en-LK", { year: "numeric", month: "long", day: "numeric" })}</p>

          {[
            {
              title: "1. Orders & Cancellations",
              body: "Orders are confirmed upon receipt of payment. Cancellations must be made at least 48 hours before the delivery date for a full refund. Orders cancelled within 48 hours may be subject to a cancellation fee of up to 50% of the order value.",
            },
            {
              title: "2. Payments",
              body: "We accept online payments via PayHere, bank transfer, and cash on delivery. All prices are in Sri Lankan Rupees (LKR) and inclusive of any applicable taxes. Bank transfer orders are confirmed after payment verification.",
            },
            {
              title: "3. Delivery",
              body: "We deliver to specified zones in Colombo and suburbs. Delivery times are estimates and may vary due to traffic or other circumstances. We are not liable for delays beyond our control.",
            },
            {
              title: "4. Product Quality",
              body: "Our products are made to order with fresh ingredients. Cakes should be consumed on the day of delivery for best quality. Store in a cool, dry place (not the freezer) if not consumed immediately.",
            },
            {
              title: "5. Allergies",
              body: "Our kitchen handles nuts, dairy, eggs, and gluten. While we take precautions for allergen-specific orders, we cannot guarantee a completely allergen-free environment. Please disclose any severe allergies when ordering.",
            },
            {
              title: "6. Custom Orders",
              body: "Custom cake designs are subject to feasibility and our creative judgment. Reference images are used as inspiration — exact replication cannot be guaranteed. A 50% deposit is required to confirm custom orders.",
            },
          ].map(({ title, body }) => (
            <section key={title}>
              <h2 className="font-display text-xl text-ink mb-3">{title}</h2>
              <p>{body}</p>
            </section>
          ))}

          <p className="text-sm">
            For questions, contact us at{" "}
            <a href={`mailto:${brand.email}`} className="text-wine hover:underline">
              {brand.email}
            </a>
            .
          </p>
        </div>
      </Container>
    </>
  );
}
