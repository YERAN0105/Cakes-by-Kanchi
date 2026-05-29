"use client";

import { useState, useTransition } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  createSlotAction,
  updateSlotAction,
  deleteSlotAction,
  createHolidayAction,
  deleteHolidayAction,
  type SlotFormData,
} from "@/lib/actions/admin";
import { cn } from "@/lib/utils";

export interface SlotRow {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  capacity: number;
  is_active: boolean;
}

export interface HolidayRow {
  id: string;
  date: string;
  label: string | null;
}

const slotSchema = z.object({
  label: z.string().min(1, "Label required"),
  start_time: z.string().min(1, "Start time required"),
  end_time: z.string().min(1, "End time required"),
  capacity: z.number().int().min(1),
  is_active: z.boolean(),
});

type SlotFormValues = z.infer<typeof slotSchema>;

function SlotModal({ slot, onClose }: { slot?: SlotRow | null; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<SlotFormValues>({
    resolver: zodResolver(slotSchema),
    defaultValues: {
      label: slot?.label ?? "",
      start_time: slot?.start_time ?? "",
      end_time: slot?.end_time ?? "",
      capacity: slot?.capacity ?? 10,
      is_active: slot?.is_active ?? true,
    },
  });

  function onSubmit(values: SlotFormValues) {
    startTransition(async () => {
      const data: SlotFormData = values;
      const result = slot ? await updateSlotAction(slot.id, data) : await createSlotAction(data);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success(slot ? "Slot updated." : "Slot created.");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink">{slot ? "Edit" : "New"} Time Slot</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-ink-light" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Label *</label>
            <input {...register("label")} className="input" placeholder="e.g. Morning (10am – 12pm)" />
            {errors.label && <p className="error">{errors.label.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Time</label>
              <input {...register("start_time")} type="time" className="input" />
            </div>
            <div>
              <label className="label">End Time</label>
              <input {...register("end_time")} type="time" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Capacity (max orders)</label>
            <input {...register("capacity", { valueAsNumber: true })} type="number" className="input w-24" min={1} />
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

export function ScheduleClient({ slots: initialSlots, holidays: initialHolidays }: { slots: SlotRow[]; holidays: HolidayRow[] }) {
  const [slots, setSlots] = useState(initialSlots);
  const [holidays, setHolidays] = useState(initialHolidays);
  const [slotModal, setSlotModal] = useState<{ open: boolean; slot: SlotRow | null }>({ open: false, slot: null });
  const [isPending, startTransition] = useTransition();
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayLabel, setNewHolidayLabel] = useState("");
  const [activeTab, setActiveTab] = useState<"slots" | "holidays">("slots");

  function handleDeleteSlot(id: string) {
    if (!confirm("Delete this time slot?")) return;
    startTransition(async () => {
      await deleteSlotAction(id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
      toast.success("Slot deleted.");
    });
  }

  function handleAddHoliday() {
    if (!newHolidayDate) { toast.error("Select a date."); return; }
    startTransition(async () => {
      const result = await createHolidayAction(newHolidayDate, newHolidayLabel);
      if ("error" in result) { toast.error(result.error); return; }
      setNewHolidayDate("");
      setNewHolidayLabel("");
      toast.success("Holiday added.");
      window.location.reload();
    });
  }

  function handleDeleteHoliday(id: string) {
    startTransition(async () => {
      await deleteHolidayAction(id);
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      toast.success("Holiday removed.");
    });
  }

  return (
    <>
      {slotModal.open && <SlotModal slot={slotModal.slot} onClose={() => { setSlotModal({ open: false, slot: null }); window.location.reload(); }} />}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex border-b border-border">
          {(["slots", "holidays"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === tab ? "border-wine text-wine" : "border-transparent text-ink-light hover:text-ink"
              )}
            >
              {tab === "slots" ? "Time Slots" : "Holidays"}
            </button>
          ))}
        </div>

        {activeTab === "slots" && (
          <div>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <span className="text-sm text-ink-light">{slots.length} slots</span>
              <button onClick={() => setSlotModal({ open: true, slot: null })} className="flex items-center gap-2 px-3 py-1.5 bg-wine text-cream rounded-lg text-sm hover:bg-wine-light">
                <Plus className="h-4 w-4" /> Add Slot
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-ink-light border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3">Label</th>
                  <th className="text-left px-6 py-3">Time</th>
                  <th className="text-left px-6 py-3">Capacity</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {slots.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-ink">{s.label}</td>
                    <td className="px-6 py-3 text-ink-light">{s.start_time} – {s.end_time}</td>
                    <td className="px-6 py-3 text-ink-light">{s.capacity} orders</td>
                    <td className="px-6 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", s.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")}>
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSlotModal({ open: true, slot: s })} className="p-1.5 rounded text-ink-light hover:text-wine hover:bg-wine/10"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteSlot(s.id)} disabled={isPending} className="p-1.5 rounded text-ink-light hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {slots.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-ink-light">No time slots yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "holidays" && (
          <div>
            <div className="px-6 py-4 border-b border-border">
              <div className="flex flex-wrap gap-3">
                <input type="date" value={newHolidayDate} onChange={(e) => setNewHolidayDate(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm outline-none focus:border-wine" />
                <input
                  value={newHolidayLabel}
                  onChange={(e) => setNewHolidayLabel(e.target.value)}
                  placeholder="Label (e.g. Christmas)"
                  className="px-3 py-1.5 border border-border rounded-lg text-sm outline-none focus:border-wine w-48"
                />
                <button onClick={handleAddHoliday} disabled={isPending} className="flex items-center gap-2 px-3 py-1.5 bg-wine text-cream rounded-lg text-sm hover:bg-wine-light disabled:opacity-50">
                  <Plus className="h-4 w-4" /> Add Holiday
                </button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-ink-light border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-6 py-3">Label</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-ink">{h.date}</td>
                    <td className="px-6 py-3 text-ink-light">{h.label ?? "—"}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => handleDeleteHoliday(h.id)} disabled={isPending} className="p-1.5 rounded text-ink-light hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
                {holidays.length === 0 && <tr><td colSpan={3} className="px-6 py-12 text-center text-sm text-ink-light">No holidays set.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
