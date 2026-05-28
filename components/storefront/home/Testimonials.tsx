"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import { Container } from "@/components/shared/Container";

const TESTIMONIALS = [
  {
    name: "Dilnoza Mendis",
    event: "Birthday Celebration",
    rating: 5,
    quote:
      "The cake was absolutely stunning — it looked too beautiful to cut! Every guest was amazed. The flavour matched the beauty perfectly. Will order again for every occasion.",
  },
  {
    name: "Roshan & Amali",
    event: "Wedding",
    rating: 5,
    quote:
      "Our five-tier wedding cake was a showstopper. The team delivered exactly what we envisioned. Absolutely professional from first inquiry to delivery.",
  },
  {
    name: "Shalini Fernando",
    event: "Cupcake Order",
    rating: 5,
    quote:
      "Ordered 48 cupcakes for an office celebration and they were gone in minutes. Everyone was asking where I got them from. Truly the best bakery in Colombo.",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-champagne text-champagne" aria-hidden="true" />
      ))}
    </div>
  );
}

export function Testimonials() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="section-pad bg-wine/5" aria-labelledby="testimonials-heading">
      <Container>
        <div className="text-center mb-12">
          <p className="label-small text-wine mb-3">What Our Customers Say</p>
          <h2 id="testimonials-heading" className="heading-lg">
            Loved by Hundreds of Families
          </h2>
          <div className="ornament-line mt-4" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.blockquote
              key={t.name}
              initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card rounded-xl border border-border p-6 shadow-sm flex flex-col gap-4"
            >
              <Stars count={t.rating} />
              <p className="font-body text-base text-ink-light leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="border-t border-border pt-4">
                <p className="font-display text-base text-ink">{t.name}</p>
                <p className="font-body text-xs text-ink-light mt-0.5 uppercase tracking-wider">
                  {t.event}
                </p>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </Container>
    </section>
  );
}
