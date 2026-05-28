"use client";

import Link from "next/link";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { Container } from "@/components/shared/Container";
import { brand } from "@/lib/brand";

const quickLinks = [
  { href: "/cakes", label: "Our Cakes" },
  { href: "/custom-cake", label: "Custom Orders" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQs" },
  { href: "/delivery-info", label: "Delivery Info" },
];

const legalLinks = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
];

export function Footer() {
  return (
    <footer className="bg-ink text-cream/70">
      <Container className="py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <BrandLogo size="sm" href="/" />
            <p className="mt-4 text-sm font-body leading-relaxed text-cream/60 max-w-xs">
              {brand.tagline}. Every cake is handcrafted with the finest ingredients, made with love.
            </p>
            <div className="flex gap-3 mt-5">
              <SocialIcon href={brand.socials.instagram} label="Instagram">
                <Instagram className="w-4 h-4" />
              </SocialIcon>
              <SocialIcon href={brand.socials.facebook} label="Facebook">
                <Facebook className="w-4 h-4" />
              </SocialIcon>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-display text-cream text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-body text-cream/60 hover:text-cream transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-cream text-lg mb-4">Get in Touch</h3>
            <ul className="space-y-3">
              <li className="flex gap-2.5 text-sm font-body text-cream/60">
                <MapPin className="w-4 h-4 text-champagne shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {brand.address.line1}, {brand.address.line2}
                  <br />
                  {brand.address.city}, {brand.address.country}
                </span>
              </li>
              <li className="flex gap-2.5 text-sm font-body text-cream/60">
                <Phone className="w-4 h-4 text-champagne shrink-0" aria-hidden="true" />
                <a
                  href={`tel:${brand.phone.replace(/\s/g, "")}`}
                  className="hover:text-cream transition-colors"
                >
                  {brand.phone}
                </a>
              </li>
              <li className="flex gap-2.5 text-sm font-body text-cream/60">
                <Mail className="w-4 h-4 text-champagne shrink-0" aria-hidden="true" />
                <a href={`mailto:${brand.email}`} className="hover:text-cream transition-colors">
                  {brand.email}
                </a>
              </li>
            </ul>
            <p className="mt-4 text-xs font-body text-cream/40 uppercase tracking-widest">
              {brand.businessHours}
            </p>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-display text-cream text-lg mb-4">Newsletter</h3>
            <p className="text-sm font-body text-cream/60 mb-3 leading-relaxed">
              Be the first to know about new creations, seasonal specials, and exclusive offers.
            </p>
            <form
              className="flex gap-2"
              onSubmit={(e) => e.preventDefault()}
              aria-label="Newsletter signup"
            >
              <input
                type="email"
                placeholder="your@email.com"
                aria-label="Email address"
                className="flex-1 px-3 py-2 rounded-md text-sm font-body bg-ink-light/30 border border-cream/10 text-cream placeholder:text-cream/30 focus:outline-none focus:ring-1 focus:ring-champagne"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-champagne text-ink text-sm font-body font-medium rounded-md hover:bg-champagne/80 transition-colors shrink-0"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-cream/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-body text-cream/40">
            &copy; {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <div className="flex gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-body text-cream/40 hover:text-cream/70 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex items-center justify-center w-8 h-8 rounded-full border border-cream/20 text-cream/60 hover:text-cream hover:border-cream/40 transition-colors"
    >
      {children}
    </a>
  );
}
