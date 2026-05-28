import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CheckoutClient } from "@/components/storefront/checkout/CheckoutClient";
import type { Database } from "@/types/database";

export const metadata: Metadata = { title: "Checkout" };

type DeliveryZoneRow = Database["public"]["Tables"]["delivery_zones"]["Row"];
type TimeSlotRow = Database["public"]["Tables"]["time_slots"]["Row"];
type HolidayRow = Database["public"]["Tables"]["holidays"]["Row"];
type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

export default async function CheckoutPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch checkout data in parallel
  const [zonesResult, slotsResult, holidaysResult, userResult, addressesResult] =
    await Promise.all([
      admin
        .from("delivery_zones")
        .select("*")
        .eq("is_active", true)
        .order("name"),
      admin
        .from("time_slots")
        .select("*")
        .eq("is_active", true)
        .order("start_time"),
      admin
        .from("holidays")
        .select("date, label")
        .gte("date", new Date().toISOString().slice(0, 10)),
      user
        ? admin.from("users").select("name, email, phone, loyalty_points").eq("id", user.id).single()
        : Promise.resolve({ data: null, error: null }),
      user
        ? admin
            .from("addresses")
            .select("*")
            .eq("user_id", user.id)
            .order("is_default", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

  const deliveryZones = (zonesResult.data ?? []) as DeliveryZoneRow[];
  const timeSlots = (slotsResult.data ?? []) as TimeSlotRow[];
  const holidays = (holidaysResult.data ?? []) as Pick<HolidayRow, "date" | "label">[];
  const savedAddresses = (addressesResult.data ?? []) as AddressRow[];
  const userProfile = userResult.data as {
    name: string;
    email: string;
    phone: string | null;
    loyalty_points: number;
  } | null;

  const checkoutUser = user && userProfile
    ? {
        id: user.id,
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone,
        loyaltyPoints: userProfile.loyalty_points,
      }
    : null;

  return (
    <CheckoutClient
      deliveryZones={deliveryZones}
      timeSlots={timeSlots}
      holidays={holidays}
      savedAddresses={savedAddresses}
      user={checkoutUser}
    />
  );
}
