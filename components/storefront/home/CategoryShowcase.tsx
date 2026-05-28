"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/shared/Container";
import type { CategoryRow } from "@/types/database";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80";

interface CategoryShowcaseProps {
  categories: CategoryRow[];
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="section-pad bg-cream-50" aria-labelledby="categories-heading">
      <Container>
        <div className="text-center mb-12">
          <p className="label-small text-wine mb-3">Browse by Category</p>
          <h2 id="categories-heading" className="heading-lg">
            Something for Every Occasion
          </h2>
          <div className="ornament-line mt-4" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Link
                href={`/cakes/category/${cat.slug}`}
                className="group block relative overflow-hidden rounded-xl aspect-[3/4]"
                aria-label={`Browse ${cat.name}`}
              >
                <Image
                  src={cat.image_url ?? FALLBACK_IMAGE}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-display text-cream text-lg leading-tight">{cat.name}</p>
                  {cat.description && (
                    <p className="font-accent text-champagne text-sm italic mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {cat.description}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
