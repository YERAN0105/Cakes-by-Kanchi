"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { brand } from "@/lib/brand";

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  const fadeUp = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <section
      className="relative h-[92vh] min-h-[600px] flex items-center overflow-hidden"
      aria-label="Hero"
    >
      {/* Background image */}
      <Image
        src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1920&q=85"
        alt="An exquisite tiered wedding cake adorned with fresh flowers"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center scale-105"
        style={
          reduceMotion
            ? {}
            : {
                animation: "subtle-zoom 20s ease-in-out infinite alternate",
              }
        }
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="label-small text-champagne mb-4"
          >
            {brand.shortTagline}
          </motion.p>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl text-cream leading-tight tracking-tight"
          >
            Every Celebration
            <span className="block font-accent text-champagne mt-1 italic text-6xl sm:text-7xl lg:text-8xl">
              Deserves a
            </span>
            <span className="block">Masterpiece</span>
          </motion.h1>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex w-16 h-px bg-champagne my-6"
            aria-hidden="true"
          />

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="font-body text-lg text-cream/85 leading-relaxed max-w-sm"
          >
            Handcrafted cakes and pastries made with the finest ingredients, delivered across Colombo.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex flex-wrap gap-4 mt-8"
          >
            <Link
              href="/cakes"
              className="btn-primary inline-flex items-center gap-2 text-sm tracking-wide"
            >
              Explore Our Cakes
            </Link>
            <Link
              href="/custom-cake"
              className="inline-flex items-center gap-2 border border-cream/60 text-cream hover:bg-cream/10 transition-colors duration-200 font-body font-medium px-6 py-3 rounded-md text-sm tracking-wide"
            >
              Design a Custom Cake
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream/50"
        animate={reduceMotion ? {} : { y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      >
        <ChevronDown className="w-6 h-6" />
      </motion.div>

      <style jsx>{`
        @keyframes subtle-zoom {
          from { transform: scale(1.05); }
          to { transform: scale(1.12); }
        }
      `}</style>
    </section>
  );
}
