"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Star, Loader2, X, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  saveAddressAction,
  updateAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
  type AddressFormData,
} from "@/lib/actions/account";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/database";

type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

interface AddressManagerProps {
  addresses: AddressRow[];
  deliveryZones: { id: string; name: string; fee: string }[];
}

const LABEL_PRESETS = ["Home", "Work", "Other"];

const DEFAULT_FORM: AddressFormData = {
  label: "Home",
  recipient: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  postal_code: "",
  delivery_zone_id: undefined,
};

export function AddressManager({ addresses, deliveryZones }: AddressManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormData>(DEFAULT_FORM);
  const [customLabel, setCustomLabel] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const router = useRouter();

  const openAdd = () => {
    setForm(DEFAULT_FORM);
    setCustomLabel("");
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (addr: AddressRow) => {
    setForm({
      label: addr.label,
      recipient: addr.recipient,
      phone: addr.phone.replace(/^\+94/, ""),
      line1: addr.line1,
      line2: addr.line2 ?? "",
      city: addr.city,
      postal_code: addr.postal_code ?? "",
      delivery_zone_id: addr.delivery_zone_id ?? undefined,
    });
    setCustomLabel(LABEL_PRESETS.includes(addr.label) ? "" : addr.label);
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: AddressFormData = {
      ...form,
      label: customLabel || form.label,
      phone: `+94${form.phone.replace(/^\+94/, "")}`,
    };

    startTransition(async () => {
      const result = editingId
        ? await updateAddressAction(editingId, payload)
        : await saveAddressAction(payload);

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(editingId ? "Address updated." : "Address saved.");
        setShowForm(false);
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteAddressAction(id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Address deleted.");
        router.refresh();
      }
      setDeletingId(null);
    });
  };

  const handleSetDefault = (id: string) => {
    startTransition(async () => {
      const result = await setDefaultAddressAction(id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Default address updated.");
        router.refresh();
      }
    });
  };

  const update = (k: keyof AddressFormData, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div>
      {/* Add button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">Saved Addresses</h1>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-wine text-cream text-sm font-body font-medium hover:bg-wine/90 transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add Address
        </button>
      </div>

      {/* Address cards */}
      {addresses.length === 0 && !showForm ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <MapPin className="w-12 h-12 text-blush mx-auto mb-4 stroke-1" aria-hidden="true" />
          <p className="font-display text-xl text-ink mb-1">No saved addresses</p>
          <p className="text-sm text-ink-light font-body mb-5">
            Save an address to make checkout faster.
          </p>
          <button type="button" onClick={openAdd} className="btn-primary px-6 py-2.5 text-sm">
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-xl border bg-card p-5 relative ${
                addr.is_default ? "border-wine/40 shadow-sm" : "border-border"
              }`}
            >
              {addr.is_default && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs font-body font-medium text-wine bg-wine/10 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3 fill-wine" aria-hidden="true" />
                  Default
                </span>
              )}
              <p className="text-xs font-body uppercase tracking-wider text-ink-light mb-2">{addr.label}</p>
              <p className="font-body font-medium text-ink">{addr.recipient}</p>
              <p className="text-sm text-ink-light font-body">{addr.phone}</p>
              <p className="text-sm text-ink font-body mt-1">
                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}
                {addr.postal_code ? ` ${addr.postal_code}` : ""}
              </p>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => openEdit(addr)}
                  className="flex items-center gap-1.5 text-xs font-body text-ink-light hover:text-wine transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                </button>
                {!addr.is_default && (
                  <>
                    <span className="text-border">·</span>
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      disabled={isPending}
                      className="flex items-center gap-1.5 text-xs font-body text-ink-light hover:text-wine disabled:opacity-60 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5" aria-hidden="true" /> Set Default
                    </button>
                    <span className="text-border">·</span>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(addr.id)}
                      disabled={isPending && deletingId === addr.id}
                      className="flex items-center gap-1.5 text-xs font-body text-red-500 hover:text-red-700 disabled:opacity-60 transition-colors"
                    >
                      {isPending && deletingId === addr.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40">
          <div className="bg-cream rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-display text-xl font-semibold text-ink mb-1">Delete Address?</h2>
            <p className="text-sm text-ink-light font-body mb-5">
              This address will be permanently removed and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-body text-ink hover:border-wine/40 disabled:opacity-60 transition-colors"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={() => { handleDelete(confirmDeleteId); setConfirmDeleteId(null); }}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-body font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40">
          <div className="bg-cream rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-semibold text-ink">
                {editingId ? "Edit Address" : "Add New Address"}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close"
                className="p-1.5 text-ink-light hover:text-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Label */}
              <div>
                <label className="block text-sm font-body text-ink mb-2">Label</label>
                <div className="flex gap-2 flex-wrap">
                  {LABEL_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => { update("label", preset); setCustomLabel(""); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-body border transition-colors ${
                        form.label === preset && !customLabel
                          ? "bg-wine text-cream border-wine"
                          : "border-border text-ink hover:border-wine/40"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                  <input
                    type="text"
                    placeholder="Custom…"
                    value={customLabel}
                    maxLength={20}
                    onChange={(e) => { setCustomLabel(e.target.value); if (e.target.value) update("label", e.target.value); }}
                    className="flex-1 min-w-[80px] px-3 py-1.5 rounded-lg border border-border text-xs font-body text-ink placeholder:text-ink-light/60 focus:outline-none focus:ring-2 focus:ring-wine/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="addr-recipient" className="block text-sm font-body text-ink mb-1.5">Recipient Name</label>
                  <input id="addr-recipient" type="text" required value={form.recipient} onChange={(e) => update("recipient", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-wine/30" />
                </div>
                <div>
                  <label htmlFor="addr-phone" className="block text-sm font-body text-ink mb-1.5">Phone</label>
                  <div className="flex">
                    <span className="px-3 py-2.5 bg-blush-light border border-r-0 border-border rounded-l-lg text-sm font-body text-ink-light">+94</span>
                    <input id="addr-phone" type="tel" required value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 9))}
                      placeholder="771234567"
                      className="flex-1 px-3 py-2.5 rounded-r-lg border border-border bg-card text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-wine/30" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="addr-line1" className="block text-sm font-body text-ink mb-1.5">Address Line 1</label>
                <input id="addr-line1" type="text" required value={form.line1} onChange={(e) => update("line1", e.target.value)}
                  placeholder="No. 10, Main Street"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-wine/30" />
              </div>

              <div>
                <label htmlFor="addr-line2" className="block text-sm font-body text-ink mb-1.5">
                  Address Line 2 <span className="text-ink-light">(optional)</span>
                </label>
                <input id="addr-line2" type="text" value={form.line2} onChange={(e) => update("line2", e.target.value)}
                  placeholder="Apartment, suite, etc."
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-wine/30" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="addr-city" className="block text-sm font-body text-ink mb-1.5">City</label>
                  <input id="addr-city" type="text" required value={form.city} onChange={(e) => update("city", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-wine/30" />
                </div>
                <div>
                  <label htmlFor="addr-postal" className="block text-sm font-body text-ink mb-1.5">
                    Postal Code <span className="text-ink-light">(optional)</span>
                  </label>
                  <input id="addr-postal" type="text" value={form.postal_code} onChange={(e) => update("postal_code", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-wine/30" />
                </div>
              </div>

              {deliveryZones.length > 0 && (
                <div>
                  <label htmlFor="addr-zone" className="block text-sm font-body text-ink mb-1.5">
                    Delivery Zone <span className="text-ink-light">(optional)</span>
                  </label>
                  <select id="addr-zone" value={form.delivery_zone_id ?? ""} onChange={(e) => update("delivery_zone_id", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-wine/30">
                    <option value="">Select zone…</option>
                    {deliveryZones.map((z) => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-body text-ink hover:border-wine/40 disabled:opacity-60 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-wine text-cream text-sm font-body font-medium hover:bg-wine/90 disabled:opacity-60 transition-colors">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  {editingId ? "Save Changes" : "Add Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
