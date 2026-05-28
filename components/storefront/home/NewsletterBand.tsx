"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Check } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { cn } from "@/lib/utils";

export function NewsletterBand() {
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    // Placeholder — will wire to API in Phase 6
    await new Promise((r) => setTimeout(r, 800));
    setStatus("success");
  };

  return (
    <section className="py-16 bg-wine" aria-labelledby="newsletter-heading">
      <Container>
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="label-small text-champagne mb-3">Stay in the Loop</p>
          <h2 id="newsletter-heading" className="font-display text-3xl sm:text-4xl text-cream mb-3">
            Sweet News, Delivered to You
          </h2>
          <p className="font-body text-cream/70 mb-8 max-w-md mx-auto">
            New flavours, seasonal specials, and exclusive offers — be the first to know.
          </p>

          {status === "success" ? (
            <div className="flex items-center justify-center gap-2 text-cream font-body">
              <Check className="w-5 h-5 text-champagne" />
              <span>Thank you! We&apos;ll be in touch soon.</span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              aria-label="Newsletter signup"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                aria-label="Email address"
                required
                className="flex-1 px-4 py-3 rounded-md text-sm font-body text-ink bg-cream placeholder:text-ink-light/60 focus:outline-none focus:ring-2 focus:ring-champagne"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className={cn(
                  "px-6 py-3 bg-champagne text-ink text-sm font-body font-medium rounded-md",
                  "hover:bg-champagne/80 transition-colors duration-200",
                  "flex items-center justify-center gap-2 whitespace-nowrap",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              >
                {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                Subscribe
              </button>
            </form>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
