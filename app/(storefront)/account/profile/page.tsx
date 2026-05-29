import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("name, email, phone")
    .eq("id", authUser.id)
    .single();

  const p = profile as { name: string; email: string; phone: string | null } | null;
  const name = p?.name ?? "";
  const email = p?.email ?? authUser.email ?? "";
  const phone = p?.phone ?? "";

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">My Profile</h1>
        <p className="body-base text-ink-light mt-1">Manage your personal information and password.</p>
      </div>
      <ProfileForm initialName={name} initialPhone={phone} email={email} />
    </div>
  );
}
