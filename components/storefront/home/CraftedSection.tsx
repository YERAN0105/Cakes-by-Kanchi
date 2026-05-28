"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/shared/Container";

export function CraftedSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="section-pad" aria-labelledby="crafted-heading">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image side — shown second on mobile, first on desktop */}
          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1607478900766-efe13248b125?w=800&q=85"
                alt="Baker crafting a beautiful cake with precision"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            {/* Floating accent card */}
            <div className="absolute -bottom-6 -right-6 bg-card border border-border rounded-xl p-5 shadow-lg max-w-[180px]">
              <p className="font-display text-3xl text-wine leading-none">12+</p>
              <p className="font-body text-sm text-ink-light mt-1">Years of baking excellence</p>
            </div>
          </motion.div>

          {/* Text side — shown first on mobile, second on desktop */}
          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="order-1 lg:order-2"
          >
            <p className="label-small text-wine mb-4">Our Story</p>
            <h2 id="crafted-heading" className="heading-lg mb-6">
              Crafted with Love,
              <span className="block font-accent text-wine italic text-4xl sm:text-5xl mt-1">
                baked to perfection
              </span>
            </h2>
            <div className="w-16 h-px bg-champagne mb-6" aria-hidden="true" />
            <p className="body-lg mb-4">
              Born from a passion for the extraordinary, every cake we create is a testament to
              craftsmanship. We use only the finest local and imported ingredients — no shortcuts,
              no compromises.
            </p>
            <p className="body-base mb-8">
              From intimate birthday cakes to grand wedding centrepieces, each creation is
              handcrafted in our Colombo kitchen and delivered with the care it deserves.
            </p>
            <Link href="/about" className="btn-secondary inline-flex">
              Our Story
            </Link>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
