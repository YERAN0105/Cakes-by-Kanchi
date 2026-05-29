"use client";

import { useState, useTransition } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createCouponAction, updateCouponAction, deleteCouponAction, type CouponFormData } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";
import type { CouponType } from "@/types/database";

export interface CouponWithUsage {
  id: string;
  code: string;
  type: CouponType;
  value: string;
  min_order_amount: string | null;
  max_discount: string | null;
  usage_limit_total: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  usageCount: number;
}

const schema = z.object({
  code: z.string().min(1, "Code required").toUpperCase(),
  type: z.enum(["percent", "flat", "free_delivery"]),
  value: z.string().min(1, "Value required"),
  min_order_amount: z.string().nullable().optional(),
  max_discount: z.string().nullable().optional(),
  usage_limit_total: z.number().int().nullable().optional(),
  usage_limit_per_user: z.number().int().nullable().optional(),
  valid_from: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function CouponModal({ coupon, onClose }: { coupon?: CouponWithUsage | null; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: coupon?.code ?? "",
      type: coupon?.type ?? "percent",
      value: coupon?.value ?? "",
      min_order_amount: coupon?.min_order_amount ?? "",
      max_discount: coupon?.max_discount ?? "",
      usage_limit_total: coupon?.usage_limit_total ?? null,
      usage_limit_per_user: null,
      valid_from: coupon?.valid_from ? coupon.valid_from.slice(0, 10) : "",
      valid_until: coupon?.valid_until ? coupon.valid_until.slice(0, 10) : "",
      is_active: coupon?.is_active ?? true,
    },
  });

  const type = watch("type");

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const data: CouponFormData = {
        ...values,
        min_order_amount: values.min_order_amount || null,
        max_discount: values.max_discount || null,
        valid_from: values.valid_from || null,
        valid_until: values.valid_until || null,
      };
      const result = coupon ? await updateCouponAction(coupon.id, data) : await createCouponAction(data);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success(coupon ? "Coupon updated." : "Coupon created.");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink">{coupon ? "Edit" : "New"} Coupon</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-ink-light" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Code *</label>
              <input {...register("code")} className="input uppercase" placeholder="SAVE20" />
              {errors.code && <p className="error">{errors.code.message}</p>}
            </div>
            <div>
              <label className="label">Type *</label>
              <select {...register("type")} className="input">
                <option value="percent">% Off</option>
                <option value="flat">Flat Off (Rs.)</option>
                <option value="free_delivery">Free Delivery</option>
              </select>
            </div>
          </div>
          {type !== "free_delivery" && (
            <div>
              <label className="label">Value * {type === "percent" ? "(%)" : "(Rs.)"}</label>
              <input {...register("value")} className="input" placeholder={type === "percent" ? "20" : "500"} />
              {errors.value && <p className="error">{errors.value.message}</p>}
            </div>
          )}
          {type === "free_delivery" && <input {...register("value")} type="hidden" value="0" />}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Min Order (Rs.)</label>
              <input {...register("min_order_amount")} className="input" placeholder="e.g. 2000" />
            </div>
            {type === "percent" && (
              <div>
                <label className="label">Max Discount (Rs.)</label>
                <input {...register("max_discount")} className="input" placeholder="e.g. 1000" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Total Usage Limit</label>
              <input {...register("usage_limit_total", { setValueAs: (v) => (v === "" || v == null ? null : Number(v)) })} type="number" className="input" placeholder="Unlimited" />
            </div>
            <div>
              <label className="label">Per Customer Limit</label>
              <input {...register("usage_limit_per_user", { setValueAs: (v) => (v === "" || v == null ? null : Number(v)) })} type="number" className="input" placeholder="Unlimited" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Valid From</label>
              <input {...register("valid_from")} type="date" className="input" />
            </div>
            <div>
              <label className="label">Valid Until</label>
              <input {...register("valid_until")} type="date" className="input" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("is_active")} className="h-4 w-4 rounded text-wine" />
            <span className="text-sm text-ink">Active</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg text-ink-light">Cancel</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-wine text-cream rounded-lg hover:bg-wine-light disabled:opacity-50">
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CouponsClient({ coupons: initial }: { coupons: CouponWithUsage[] }) {
  const [coupons, setCoupons] = useState(initial);
  const [modal, setModal] = useState<{ open: boolean; coupon: CouponWithUsage | null }>({ open: false, coupon: null });
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, code: string) {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    startTransition(async () => {
      const result = await deleteCouponAction(id);
      if ("error" in result) { toast.error(result.error); return; }
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.success("Coupon deleted.");
    });
  }

  return (
    <>
      {modal.open && (
        <CouponModal coupon={modal.coupon} onClose={() => { setModal({ open: false, coupon: null }); window.location.reload(); }} />
      )}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <span className="text-sm text-ink-light">{coupons.length} coupons</span>
          <button onClick={() => setModal({ open: true, coupon: null })} className="flex items-center gap-2 px-3 py-1.5 bg-wine text-cream rounded-lg text-sm hover:bg-wine-light">
            <Plus className="h-4 w-4" /> Add Coupon
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-ink-light border-b border-border">
            <tr>
              <th className="text-left px-6 py-3">Code</th>
              <th className="text-left px-6 py-3">Type / Value</th>
              <th className="text-left px-6 py-3">Usage</th>
              <th className="text-left px-6 py-3">Validity</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-right px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-mono font-medium text-ink">{c.code}</td>
                <td className="px-6 py-3 text-ink-light">
                  {c.type === "percent" && `${c.value}% off`}
                  {c.type === "flat" && `Rs. ${c.value} off`}
                  {c.type === "free_delivery" && "Free delivery"}
                </td>
                <td className="px-6 py-3 text-ink-light">
                  {c.usageCount}{c.usage_limit_total ? ` / ${c.usage_limit_total}` : " (unlimited)"}
                </td>
                <td className="px-6 py-3 text-xs text-ink-light">
                  {c.valid_from ? c.valid_from.slice(0, 10) : "—"} → {c.valid_until ? c.valid_until.slice(0, 10) : "—"}
                </td>
                <td className="px-6 py-3">
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", c.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")}>
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setModal({ open: true, coupon: c })} className="p-1.5 rounded text-ink-light hover:text-wine hover:bg-wine/10">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.code)} disabled={isPending} className="p-1.5 rounded text-ink-light hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-ink-light">No coupons yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
