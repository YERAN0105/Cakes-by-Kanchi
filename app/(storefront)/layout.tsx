import type { ReactNode } from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { AnnouncementBar } from "@/components/storefront/AnnouncementBar";
import { WhatsAppButton } from "@/components/storefront/WhatsAppButton";

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
