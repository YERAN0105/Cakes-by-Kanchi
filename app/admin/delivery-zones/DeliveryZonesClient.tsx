"use client";

import { useState, useTransition } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createZoneAction, updateZoneAction, deleteZoneAction, type ZoneFormData } from "@/lib/actions/admin";
import { formatCurrency } from "@/lib/brand";
import { cn } from "@/lib/utils";

export interface ZoneRow {
  id: string;
  name: string;
  fee: string;
  estimated_time: string | null;
  min_order_amount: string | null;
  same_day_surcharge: string;
  is_active: boolean;
}

const schema = z.object({
  name: z.string().min(1, "Name required"),
  fee: z.string().min(1, "Fee required"),
  estimated_time: z.string().nullable().optional(),
  min_order_amount: z.string().nullable().optional(),
  same_day_surcharge: z.string().optional(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function ZoneModal({ zone, onClose }: { zone?: ZoneRow | null; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: zone?.name ?? "",
      fee: zone?.fee ?? "",
      estimated_time: zone?.estimated_time ?? "",
      min_order_amount: zone?.min_order_amount ?? "",
      same_day_surcharge: zone?.same_day_surcharge ?? "0",
      is_active: zone?.is_active ?? true,
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const data: ZoneFormData = { ...values, estimated_time: values.estimated_time || null, min_order_amount: values.min_order_amount || null };
      const result = zone ? await updateZoneAction(zone.id, data) : await createZoneAction(data);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success(zone ? "Zone updated." : "Zone created.");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink">{zone ? "Edit" : "New"} Delivery Zone</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-ink-light" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Zone Name *</label>
            <input {...register("name")} className="input" placeholder="e.g. Colombo 1-7" />
            {errors.name && <p className="error">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Delivery Fee (Rs.) *</label>
              <input {...register("fee")} className="input" placeholder="350" />
              {errors.fee && <p className="error">{errors.fee.message}</p>}
            </div>
            <div>
              <label className="label">Same-Day Surcharge</label>
              <input {...register("same_day_surcharge")} className="input" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="label">Estimated Time</label>
            <input {...register("estimated_time")} className="input" placeholder="e.g. 2-3 hours" />
          </div>
          <div>
            <label className="label">Min Order Amount (Rs.)</label>
            <input {...register("min_order_amount")} className="input" placeholder="Optional" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("is_active")} className="h-4 w-4 rounded text-wine" />
            <span className="text-sm text-ink">Active</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg text-ink-light">Cancel</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-wine text-cream rounded-lg hover:bg-wine-light disabled:opacity-50">{isPending ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DeliveryZonesClient({ zones: initial }: { zones: ZoneRow[] }) {
  const [zones, setZones] = useState(initial);
  const [modal, setModal] = useState<{ open: boolean; zone: ZoneRow | null }>({ open: false, zone: null });
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete zone "${name}"?`)) return;
    startTransition(async () => {
      await deleteZoneAction(id);
      setZones((prev) => prev.filter((z) => z.id !== id));
      toast.success("Zone deleted.");
    });
  }

  return (
    <>
      {modal.open && <ZoneModal zone={modal.zone} onClose={() => { setModal({ open: false, zone: null }); window.location.reload(); }} />}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <span className="text-sm text-ink-light">{zones.length} zones</span>
          <button onClick={() => setModal({ open: true, zone: null })} className="flex items-center gap-2 px-3 py-1.5 bg-wine text-cream rounded-lg text-sm hover:bg-wine-light">
            <Plus className="h-4 w-4" /> Add Zone
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-ink-light border-b border-border">
            <tr>
              <th className="text-left px-6 py-3">Name</th>
              <th className="text-left px-6 py-3">Fee</th>
              <th className="text-left px-6 py-3">Est. Time</th>
              <th className="text-left px-6 py-3">Min Order</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-right px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {zones.map((z) => (
              <tr key={z.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-ink">{z.name}</td>
                <td className="px-6 py-3">{formatCurrency(parseFloat(z.fee))}</td>
                <td className="px-6 py-3 text-ink-light">{z.estimated_time ?? "—"}</td>
                <td className="px-6 py-3 text-ink-light">{z.min_order_amount ? formatCurrency(parseFloat(z.min_order_amount)) : "None"}</td>
                <td className="px-6 py-3">
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", z.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")}>
                    {z.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setModal({ open: true, zone: z })} className="p-1.5 rounded text-ink-light hover:text-wine hover:bg-wine/10"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(z.id, z.name)} disabled={isPending} className="p-1.5 rounded text-ink-light hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {zones.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-ink-light">No zones yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
