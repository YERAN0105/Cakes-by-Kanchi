import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/shared/Container";
import { AccountSidebar } from "@/components/storefront/account/AccountSidebar";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", authUser.id)
    .single();

  const name = (profile as { name: string; email: string } | null)?.name ?? authUser.email ?? "Account";
  const email = (profile as { name: string; email: string } | null)?.email ?? authUser.email ?? "";

  return (
    <Container className="py-10 lg:py-14">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <AccountSidebar userName={name} userEmail={email} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </Container>
  );
}
