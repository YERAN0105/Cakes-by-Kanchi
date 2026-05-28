import type { ReactNode } from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { AnnouncementBar } from "@/components/storefront/AnnouncementBar";
import { WhatsAppButton } from "@/components/storefront/WhatsAppButton";
import { CartDrawer } from "@/components/storefront/cart/CartDrawer";
import { getAllCategories } from "@/lib/products";

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const categories = await getAllCategories();

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />
      <main id="main-content">{children}</main>
      <Footer />
      <WhatsAppButton />
      <CartDrawer />
    </>
  );
}
