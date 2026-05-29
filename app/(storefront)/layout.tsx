import type { ReactNode } from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { AnnouncementBar } from "@/components/storefront/AnnouncementBar";
import { WhatsAppButton } from "@/components/storefront/WhatsAppButton";
import { CartDrawer } from "@/components/storefront/cart/CartDrawer";
import { WishlistSync } from "@/components/storefront/WishlistSync";
import { getAllCategories } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const categories = await getAllCategories();

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let userProfile: { id: string; name: string; email: string } | null = null;
  if (authUser) {
    const { data } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", authUser.id)
      .single();
    userProfile = data as { id: string; name: string; email: string } | null;
  }

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} user={userProfile} />
      <main id="main-content">{children}</main>
      <Footer />
      <WhatsAppButton />
      <CartDrawer />
      {userProfile && <WishlistSync />}
    </>
  );
}
