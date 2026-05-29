import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbarServer } from "@/components/admin/AdminTopbarServer";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/admin");

  const { data: rawProfile } = await supabase
    .from("users")
    .select("name, email, role")
    .eq("id", user.id)
    .single();

  const profile = rawProfile as { name: string; email: string; role: string } | null;
  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="print:hidden">
        <AdminSidebar
          adminName={profile?.name ?? "Admin"}
          adminEmail={profile?.email ?? user.email ?? ""}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="print:hidden">
          <AdminTopbarServer />
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
