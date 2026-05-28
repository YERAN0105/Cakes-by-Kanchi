import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/shared/Container";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About Us",
  description: `The story behind ${brand.name} — handcrafted cakes made with love in Colombo, Sri Lanka.`,
};

export default function AboutPage() {
  return (
    <>
      <div className="py-16 bg-cream-50 border-b border-border text-center">
        <p className="label-small text-wine mb-3">Our Story</p>
        <h1 className="heading-lg">About {brand.name}</h1>
        <div className="ornament-line mt-4" />
      </div>

      <Container className="py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="heading-md mb-6">Baked with Purpose, Delivered with Love</h2>
            <p className="body-lg mb-4">
              {brand.name} began as a humble home kitchen in Colombo, where every cake was an act of
              devotion. Today, our team of dedicated pastry chefs continues that tradition — crafting
              every creation by hand, using only the finest local and imported ingredients.
            </p>
            <p className="body-base mb-4">
              We believe a cake is more than dessert — it&apos;s the centrepiece of a memory. Whether
              it&apos;s a child&apos;s first birthday, an intimate anniversary, or a grand wedding
              reception, we pour the same care into every order.
            </p>
            <p className="body-base">
              Based in {brand.address.city}, we deliver across Colombo and suburbs, and welcome
              bespoke commissions for any occasion.
            </p>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
            <Image
              src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80"
              alt="Our pastry chef decorating a cake"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* Values */}
        <div className="mt-20 grid sm:grid-cols-3 gap-8 text-center">
          {[
            { title: "Premium Ingredients", body: "Sourced locally and internationally for the best flavour." },
            { title: "Handcrafted", body: "Every cake made from scratch by our skilled team." },
            { title: "Made to Order", body: "We bake fresh for each order — never a day-old cake." },
          ].map((v) => (
            <div key={v.title} className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-display text-xl text-ink mb-2">{v.title}</h3>
              <p className="body-base text-sm">{v.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
