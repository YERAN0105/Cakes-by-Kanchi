"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MousePointerClick, Sparkles, Truck } from "lucide-react";
import { Container } from "@/components/shared/Container";

const STEPS = [
  {
    icon: MousePointerClick,
    number: "01",
    title: "Choose & Customise",
    body: "Browse our collection or design something entirely your own. Select your size, flavour, and every detail that makes it yours.",
  },
  {
    icon: Sparkles,
    number: "02",
    title: "We Bake with Care",
    body: "Our pastry chefs handcraft your cake using premium ingredients. Every layer, every decoration made to order.",
  },
  {
    icon: Truck,
    number: "03",
    title: "Delivered to Your Door",
    body: "We deliver across Colombo with care. Choose your preferred date and time slot — we'll be there.",
  },
];

export function HowItWorks() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="section-pad" aria-labelledby="how-heading">
      <Container>
        <div className="text-center mb-12">
          <p className="label-small text-wine mb-3">Simple & Sweet</p>
          <h2 id="how-heading" className="heading-lg">
            How It Works
          </h2>
          <div className="ornament-line mt-4" />
        </div>

        <div className="relative grid md:grid-cols-3 gap-8 md:gap-12">
          {/* Connecting line (desktop) */}
          <div
            className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-champagne to-champagne via-blush"
            aria-hidden="true"
          />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={reduceMotion ? {} : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="flex flex-col items-center text-center relative"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-blush-light flex items-center justify-center shadow-sm">
                    <Icon className="w-8 h-8 text-wine" aria-hidden="true" />
                  </div>
                  <span className="absolute -top-2 -right-2 font-display text-xs text-champagne font-bold bg-wine rounded-full w-6 h-6 flex items-center justify-center">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-display text-xl text-ink mb-3">{step.title}</h3>
                <p className="body-base max-w-xs">{step.body}</p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
