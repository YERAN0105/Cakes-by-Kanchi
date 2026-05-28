import type { Metadata } from "next";
import { HeroSection } from "@/components/storefront/home/HeroSection";
import { CategoryShowcase } from "@/components/storefront/home/CategoryShowcase";
import { FeaturedCakes } from "@/components/storefront/home/FeaturedCakes";
import { CraftedSection } from "@/components/storefront/home/CraftedSection";
import { HowItWorks } from "@/components/storefront/home/HowItWorks";
import { Testimonials } from "@/components/storefront/home/Testimonials";
import { NewsletterBand } from "@/components/storefront/home/NewsletterBand";
import { getAllCategories } from "@/lib/products";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${brand.name} — ${brand.shortTagline}`,
  description: `${brand.tagline}. Premium handcrafted cakes and pastries delivered across Colombo, Sri Lanka.`,
};

export default async function HomePage() {
  const categories = await getAllCategories();

  return (
    <>
      <HeroSection />
      <CategoryShowcase categories={categories} />
      <FeaturedCakes />
      <CraftedSection />
      <HowItWorks />
      <Testimonials />
      <NewsletterBand />
    </>
  );
}
