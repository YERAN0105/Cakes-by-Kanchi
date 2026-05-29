import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { brand } from "@/lib/brand";
import { format } from "date-fns";
import { PrintButton } from "../PrintButton";
import type { ProductSnapshot } from "@/types/database";

interface PageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function KitchenTicketPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const admin = createAdminClient();

  const { data: rawOrder } = await admin
    .from("orders")
    .select("*, users(name, phone), time_slots(label), order_items(product_snapshot, customization, quantity)")
    .eq("order_number", orderNumber)
    .single();

  if (!rawOrder) notFound();

  const o = rawOrder as unknown as {
    order_number: string;
    delivery_date: string | null;
    fulfillment_type: string;
    users: { name: string; phone: string | null } | null;
    guest_phone: string | null;
    notes: string | null;
    time_slots: { label: string } | null;
    order_items: {
      product_snapshot: ProductSnapshot;
      customization: {
        quantity: number;
        shape_id?: string;
        flavor_id?: string;
        eggless?: boolean;
        vegan?: boolean;
        gluten_free?: boolean;
        message?: string;
        color_theme?: string;
        addon_ids?: string[];
        addon_quantities?: Record<string, number>;
        special_instructions?: string;
        photo_url?: string;
      };
      quantity: number;
    }[];
  };

  // Resolve add-on and shape names
  const allAddonIds = Array.from(
    new Set(o.order_items.flatMap((item) => item.customization.addon_ids ?? []))
  );
  const allShapeIds = Array.from(
    new Set(
      o.order_items
        .map((item) => item.customization.shape_id)
        .filter(Boolean) as string[]
    )
  );

  const [addonsRes, shapesRes] = await Promise.all([
    allAddonIds.length > 0
      ? admin.from("addons").select("id, name").in("id", allAddonIds)
      : Promise.resolve({ data: [] }),
    allShapeIds.length > 0
      ? admin.from("product_shapes").select("id, shape").in("id", allShapeIds)
      : Promise.resolve({ data: [] }),
  ]);

  const addonMap = Object.fromEntries(
    ((addonsRes.data ?? []) as { id: string; name: string }[]).map((a) => [a.id, a.name])
  );
  const shapeMap = Object.fromEntries(
    ((shapesRes.data ?? []) as { id: string; shape: string }[]).map((s) => [s.id, s.shape])
  );

  const customerName = o.users?.name ?? "Guest";
  const customerPhone = o.users?.phone ?? o.guest_phone ?? "";

  return (
    <div style={{ fontFamily: "'Courier New', monospace", color: "#000", maxWidth: 400, margin: "0 auto", fontSize: 13 }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        .kt-item { border: 2px solid #000; border-radius: 4px; padding: 10px; margin: 8px 0; }
        .kt-item-name { font-size: 18px; font-weight: bold; margin-bottom: 6px; }
        .kt-item-qty { font-size: 13px; color: #555; margin-bottom: 2px; }
        .kt-spec { margin: 2px 0; }
        .kt-dietary { background: #E8F5E9; padding: 4px 6px; border: 1px solid #4CAF50; border-radius: 2px; margin: 4px 0; font-weight: bold; letter-spacing: 0.05em; }
        .kt-addons { margin: 4px 0; }
        .kt-message { background: #FFF9C4; padding: 6px; border: 1px solid #F9A825; border-radius: 2px; margin: 6px 0; font-weight: bold; font-size: 14px; }
        .kt-special { background: #FFEBEE; padding: 6px; border: 2px solid #E53935; border-radius: 4px; margin: 6px 0; }
        .kt-photo { margin: 4px 0; font-size: 11px; color: #555; }
        .kt-note { background: #FFEBEE; padding: 6px; border: 2px solid #E53935; border-radius: 4px; margin: 12px 0; }
        .kt-footer { text-align: center; margin-top: 16px; font-size: 11px; border-top: 1px solid #000; padding-top: 8px; }
        .kt-divider { border: none; border-top: 1px dashed #999; margin: 8px 0; }
      `}</style>

      <div className="no-print" style={{ marginBottom: 12 }}>
        <PrintButton label="Print Ticket" />
      </div>

      {/* Header */}
      <h1 style={{ fontSize: 18, textAlign: "center", borderBottom: "2px solid #000", paddingBottom: 6, marginBottom: 8, letterSpacing: "0.05em" }}>
        {brand.name} — KITCHEN TICKET
      </h1>

      {/* Order info */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: "bold" }}>{o.order_number}</div>
        <div>{customerName}{customerPhone ? ` · ${customerPhone}` : ""}</div>
        <div style={{ fontSize: 14, fontWeight: "bold", marginTop: 4 }}>
          {o.fulfillment_type.toUpperCase()}
          {o.delivery_date && ` — ${format(new Date(o.delivery_date + "T00:00:00"), "EEE d MMM yyyy")}`}
        </div>
        {o.time_slots && (
          <div style={{ fontSize: 13 }}>Slot: {o.time_slots.label}</div>
        )}
      </div>

      <hr className="kt-divider" />

      {/* Items */}
      {o.order_items.map((item, i) => {
        const snap = item.product_snapshot;
        const c = item.customization;

        const shapeName = c.shape_id ? shapeMap[c.shape_id] : null;
        const dietaryParts: string[] = [];
        if (c.eggless) dietaryParts.push("EGGLESS");
        if (c.vegan) dietaryParts.push("VEGAN");
        if (c.gluten_free) dietaryParts.push("GLUTEN-FREE");

        const resolvedAddons = (c.addon_ids ?? [])
          .map((id) => {
            const name = addonMap[id];
            if (!name) return null;
            const qty = c.addon_quantities?.[id] ?? 1;
            return qty > 1 ? `${name} ×${qty}` : name;
          })
          .filter(Boolean) as string[];

        return (
          <div key={i} className="kt-item">
            <div className="kt-item-qty">QTY: {item.quantity}</div>
            <div className="kt-item-name">{snap?.name ?? "Item"}</div>

            {snap?.sizeName && <div className="kt-spec">SIZE: {snap.sizeName}</div>}
            {snap?.flavorName && <div className="kt-spec">FLAVOUR: {snap.flavorName}</div>}
            {shapeName && <div className="kt-spec">SHAPE: {shapeName}</div>}
            {snap?.tierName && <div className="kt-spec">TIER: {snap.tierName}</div>}

            {dietaryParts.length > 0 && (
              <div className="kt-dietary">⚠ {dietaryParts.join(" · ")}</div>
            )}

            {resolvedAddons.length > 0 && (
              <div className="kt-addons">ADD-ONS: {resolvedAddons.join(", ")}</div>
            )}

            {c.color_theme && (
              <div className="kt-spec">COLOUR THEME: {c.color_theme}</div>
            )}

            {c.message && (
              <div className="kt-message">✎ CAKE MESSAGE: &ldquo;{c.message}&rdquo;</div>
            )}

            {c.special_instructions && (
              <div className="kt-special">
                <strong>⚠ SPECIAL INSTRUCTIONS:</strong><br />
                {c.special_instructions}
              </div>
            )}

            {c.photo_url && (
              <div className="kt-photo">
                📷 Reference photo: <a href={c.photo_url} style={{ color: "#555" }}>{c.photo_url}</a>
              </div>
            )}
          </div>
        );
      })}

      {/* Order-level customer note */}
      {o.notes && (
        <div className="kt-note">
          <strong>CUSTOMER NOTE:</strong><br />
          {o.notes}
        </div>
      )}

      <div className="kt-footer">
        Printed: {format(new Date(), "d MMM yyyy, h:mm a")}
      </div>
    </div>
  );
}
