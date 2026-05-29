import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AddressManager } from "./AddressManager";
import type { Database } from "@/types/database";

export const metadata: Metadata = { title: "Saved Addresses" };

type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

export default async function AddressesPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const admin = createAdminClient();

  const [addressesResult, zonesResult] = await Promise.all([
    admin
      .from("addresses")
      .select("*")
      .eq("user_id", authUser.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
    admin.from("delivery_zones").select("id, name, fee").eq("is_active", true).order("name"),
  ]);

  const addresses = (addressesResult.data as unknown as AddressRow[]) ?? [];
  const zones = (zonesResult.data as { id: string; name: string; fee: string }[]) ?? [];

  return <AddressManager addresses={addresses} deliveryZones={zones} />;
}
