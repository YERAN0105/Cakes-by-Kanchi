import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const date = new URL(req.url).searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data } = await admin
    .from("orders")
    .select("time_slot_id")
    .eq("delivery_date", date)
    .neq("status", "cancelled")
    .neq("status", "refunded");

  const usage: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = (row as { time_slot_id: string | null }).time_slot_id;
    if (id) usage[id] = (usage[id] ?? 0) + 1;
  }

  return NextResponse.json({ usage });
}
