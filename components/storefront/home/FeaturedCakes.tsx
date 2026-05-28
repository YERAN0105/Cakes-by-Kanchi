"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/shared/Container";

function PlaceholderCard({ delay = 0 }: { delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      className="group bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      {/* Image placeholder */}
      <div className="aspect-square bg-gradient-to-br from-blush-light via-blush to-rose/30 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-accent text-3xl text-wine/40 italic">coming soon</span>
        </div>
      </div>
      {/* Info */}
      <div className="p-4">
        <div className="h-4 bg-blush/40 rounded w-3/4 mb-2 skeleton" />
        <div className="h-3 bg-blush/30 rounded w-1/2 mb-3 skeleton" />
        <div className="flex items-center justify-between">
          <div className="h-5 bg-wine/20 rounded w-1/3 skeleton" />
          <div className="h-8 w-24 bg-wine/10 rounded-md skeleton" />
        </div>
      </div>
    </motion.div>
  );
}

export function FeaturedCakes() {
  return (
    <section className="section-pad bg-cream-50" aria-labelledby="featured-heading">
      <Container>
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <p className="label-small text-wine mb-2">Handpicked for You</p>
            <h2 id="featured-heading" className="heading-md">Featured Cakes</h2>
          </div>
          <Link
            href="/cakes"
            className="flex items-center gap-1.5 text-sm font-body text-wine hover:text-wine-light transition-colors shrink-0"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[0, 0.08, 0.16, 0.24].map((delay, i) => (
            <PlaceholderCard key={i} delay={delay} />
          ))}
        </div>

        <p className="text-center mt-8 text-sm font-body text-ink-light">
          Products will appear here once added.{" "}
          <Link href="/admin/products" className="text-wine hover:underline">
            Add products →
          </Link>
        </p>
      </Container>
    </section>
  );
}
