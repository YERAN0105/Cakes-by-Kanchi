"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { formatInTimeZone } from "date-fns-tz";
import { formatCurrency } from "@/lib/brand";
import { createCustomerAction, type CreateCustomerData } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";

const TZ = "Asia/Colombo";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  loyalty_points: number;
  blocked: boolean;
  created_at: string;
  orderCount: number;
  lifetimeValue: number;
}

const schema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().regex(/^\d{9}$/, "9 digits").optional().or(z.literal("")),
  password: z.string().min(8, "Min 8 chars"),
});

function CreateCustomerModal({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<CreateCustomerData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", password: "" },
  });

  function onSubmit(values: CreateCustomerData) {
    startTransition(async () => {
      const result = await createCustomerAction(values);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Customer created.");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink">Add Customer</h2>
          <button onClick={onClose} className="text-ink-light hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input {...register("name")} className="input" />
            {errors.name && <p className="error">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Email *</label>
            <input {...register("email")} type="email" className="input" />
            {errors.email && <p className="error">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <div className="flex items-center border border-border rounded-lg overflow-hidden focus-within:border-wine focus-within:ring-1 focus-within:ring-wine">
              <span className="px-3 py-2 bg-gray-50 text-sm text-ink-light border-r border-border">+94</span>
              <input {...register("phone")} className="flex-1 px-3 py-2 text-sm outline-none" placeholder="771234567" />
            </div>
            {errors.phone && <p className="error">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="label">Temporary Password *</label>
            <input {...register("password")} type="password" className="input" />
            {errors.password && <p className="error">{errors.password.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg text-ink-light">Cancel</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-wine text-cream rounded-lg hover:bg-wine-light disabled:opacity-50">
              {isPending ? "Creating…" : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CustomersTableClient({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone ?? "").includes(q);
  });

  return (
    <>
      {showCreate && <CreateCustomerModal onClose={() => { setShowCreate(false); window.location.reload(); }} />}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="px-3 py-1.5 border border-border rounded-lg text-sm outline-none focus:border-wine w-56"
          />
          <button
            onClick={() => setShowCreate(true)}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-wine text-cream rounded-lg text-sm hover:bg-wine-light"
          >
            <Plus className="h-4 w-4" /> Add Customer
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-ink-light border-b border-border">
              <tr>
                <th className="text-left px-6 py-3">Customer</th>
                <th className="text-left px-6 py-3">Phone</th>
                <th className="text-left px-6 py-3">Joined</th>
                <th className="text-left px-6 py-3">Orders</th>
                <th className="text-left px-6 py-3">Lifetime Value</th>
                <th className="text-left px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <Link href={`/admin/customers/${c.id}`} className="font-medium text-wine hover:underline">{c.name}</Link>
                    <p className="text-xs text-ink-light">{c.email}</p>
                  </td>
                  <td className="px-6 py-3 text-ink-light">{c.phone ?? "—"}</td>
                  <td className="px-6 py-3 text-ink-light">
                    {formatInTimeZone(c.created_at, TZ, "d MMM yyyy")}
                  </td>
                  <td className="px-6 py-3 text-ink">{c.orderCount}</td>
                  <td className="px-6 py-3 font-medium">{formatCurrency(c.lifetimeValue)}</td>
                  <td className="px-6 py-3">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", c.blocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800")}>
                      {c.blocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-ink-light text-sm">No customers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
