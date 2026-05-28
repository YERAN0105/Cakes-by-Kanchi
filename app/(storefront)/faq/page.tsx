import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "FAQs",
  description: `Frequently asked questions about ordering from ${brand.name}.`,
};

const FAQS = [
  {
    q: "How far in advance do I need to order?",
    a: "We require at least 24 hours' notice for standard cakes. Wedding cakes and large custom orders require a minimum of 7 days. Same-day orders may be available — please WhatsApp us to check.",
  },
  {
    q: "Do you offer eggless or vegan cakes?",
    a: "Yes! Most of our cakes can be made eggless. Select vegan options are also available. Each product page shows available dietary options. A small price modifier may apply.",
  },
  {
    q: "How are cakes delivered?",
    a: "We deliver across Colombo and suburbs in temperature-controlled packaging. You can select your preferred delivery date and time slot at checkout. Delivery fees vary by zone.",
  },
  {
    q: "Can I customise any cake?",
    a: "Absolutely. Every cake can be personalised with a message, colour theme, and flavour. For fully bespoke designs, use our Custom Cake inquiry form.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept online payments (Visa, Mastercard, etc. via PayHere), bank transfer, and cash on delivery for eligible orders.",
  },
  {
    q: "Can I order a custom cake?",
    a: "Yes — fill in our Custom Cake Inquiry form with your event date, design ideas, and reference images. We'll send you a quote within 24 hours.",
  },
  {
    q: "Do you cater to corporate events?",
    a: "Yes, we regularly supply cakes and dessert platters for corporate events, product launches, and team celebrations. Contact us for volume pricing.",
  },
  {
    q: "What if my cake is damaged on arrival?",
    a: "We take every care in packaging and delivery. If your cake arrives damaged, please photograph it immediately and contact us within 1 hour of delivery — we'll resolve it promptly.",
  },
];

export default function FaqPage() {
  return (
    <>
      <div className="py-16 bg-cream-50 border-b border-border text-center">
        <p className="label-small text-wine mb-3">Help & Info</p>
        <h1 className="heading-lg">Frequently Asked Questions</h1>
        <div className="ornament-line mt-4" />
      </div>

      <Container narrow className="py-16">
        <div className="space-y-4">
          {FAQS.map((item, i) => (
            <details
              key={i}
              className="group bg-card border border-border rounded-xl overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none font-display text-lg text-ink hover:text-wine transition-colors">
                {item.q}
                <span className="text-wine shrink-0 text-xl transition-transform duration-200 group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="px-5 pb-5 font-body text-ink-light leading-relaxed border-t border-border pt-4">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </Container>
    </>
  );
}
