"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { saveSettingsAction } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";

interface SettingsClientProps {
  settings: Record<string, Record<string, unknown>>;
}

const TABS = ["shop", "tax", "payment", "notifications", "seo", "maintenance"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  shop: "Shop Info",
  tax: "Tax",
  payment: "Payment",
  notifications: "Notifications",
  seo: "SEO",
  maintenance: "Maintenance",
};

function ShopForm({ defaults }: { defaults: Record<string, unknown> }) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit } = useForm({ defaultValues: { name: defaults.name ?? "Cakery", tagline: defaults.tagline ?? "", address: defaults.address ?? "", phone: defaults.phone ?? "", whatsapp: defaults.whatsapp ?? "", email: defaults.email ?? "", instagram: defaults.instagram ?? "", facebook: defaults.facebook ?? "", business_hours: defaults.business_hours ?? "" } });
  function onSubmit(values: Record<string, unknown>) {
    startTransition(async () => {
      const result = await saveSettingsAction("shop", values);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Shop settings saved.");
    });
  }
  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Shop Name</label><input {...register("name")} className="input" /></div>
        <div><label className="label">Tagline</label><input {...register("tagline")} className="input" /></div>
      </div>
      <div><label className="label">Address</label><input {...register("address")} className="input" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Phone</label><input {...register("phone")} className="input" /></div>
        <div><label className="label">WhatsApp</label><input {...register("whatsapp")} className="input" /></div>
        <div><label className="label">Email</label><input {...register("email")} className="input" /></div>
        <div><label className="label">Business Hours</label><input {...register("business_hours")} className="input" /></div>
        <div><label className="label">Instagram URL</label><input {...register("instagram")} className="input" /></div>
        <div><label className="label">Facebook URL</label><input {...register("facebook")} className="input" /></div>
      </div>
      <SaveButton isPending={isPending} />
    </form>
  );
}

function TaxForm({ defaults }: { defaults: Record<string, unknown> }) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit } = useForm({ defaultValues: { rate: defaults.rate ?? 0, inclusive: defaults.inclusive ?? true } });
  function onSubmit(values: Record<string, unknown>) {
    startTransition(async () => {
      const result = await saveSettingsAction("tax", values);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Tax settings saved.");
    });
  }
  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-4">
      <div>
        <label className="label">Tax Rate (%)</label>
        <input {...register("rate", { valueAsNumber: true })} type="number" step="0.1" className="input w-24" />
        <p className="text-xs text-ink-light mt-1">Set to 0 to disable tax.</p>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" {...register("inclusive")} className="h-4 w-4 rounded text-wine" />
        <span className="text-sm text-ink">Tax inclusive (price already includes tax)</span>
      </label>
      <SaveButton isPending={isPending} />
    </form>
  );
}

function PaymentForm({ defaults }: { defaults: Record<string, unknown> }) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      payhere_merchant_id: defaults.payhere_merchant_id ?? "",
      payhere_mode: defaults.payhere_mode ?? "sandbox",
      bank_name: defaults.bank_name ?? "",
      bank_account_name: defaults.bank_account_name ?? "",
      bank_account_number: defaults.bank_account_number ?? "",
      bank_branch: defaults.bank_branch ?? "",
      cod_enabled: defaults.cod_enabled ?? true,
      cod_min: defaults.cod_min ?? 0,
      cod_max: defaults.cod_max ?? 0,
    }
  });
  function onSubmit(values: Record<string, unknown>) {
    startTransition(async () => {
      const result = await saveSettingsAction("payment", values);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Payment settings saved.");
    });
  }
  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-4">
      <h3 className="font-display text-base text-ink">PayHere</h3>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Merchant ID</label><input {...register("payhere_merchant_id")} className="input" /></div>
        <div>
          <label className="label">Mode</label>
          <select {...register("payhere_mode")} className="input">
            <option value="sandbox">Sandbox</option>
            <option value="live">Live</option>
          </select>
        </div>
      </div>
      <p className="text-xs text-ink-light">PayHere credentials are stored in .env.local. These settings store display metadata only.</p>
      <h3 className="font-display text-base text-ink pt-4">Bank Transfer Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Bank Name</label><input {...register("bank_name")} className="input" /></div>
        <div><label className="label">Account Name</label><input {...register("bank_account_name")} className="input" /></div>
        <div><label className="label">Account Number</label><input {...register("bank_account_number")} className="input" /></div>
        <div><label className="label">Branch</label><input {...register("bank_branch")} className="input" /></div>
      </div>
      <h3 className="font-display text-base text-ink pt-4">Cash on Delivery</h3>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" {...register("cod_enabled")} className="h-4 w-4 rounded text-wine" />
        <span className="text-sm text-ink">Enable COD</span>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Min Order (Rs.)</label><input {...register("cod_min", { valueAsNumber: true })} type="number" className="input" /></div>
        <div><label className="label">Max Order (Rs.)</label><input {...register("cod_max", { valueAsNumber: true })} type="number" className="input" /></div>
      </div>
      <SaveButton isPending={isPending} />
    </form>
  );
}

function NotificationsForm() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-light">Notification templates will be configured in Phase 6 when email (Resend) and WhatsApp Cloud API credentials are added.</p>
      <div className="space-y-3 opacity-60">
        <label className="flex items-center gap-2 cursor-not-allowed">
          <input type="checkbox" disabled className="h-4 w-4 rounded" />
          <span className="text-sm text-ink">Enable Email Notifications (requires RESEND_API_KEY)</span>
        </label>
        <label className="flex items-center gap-2 cursor-not-allowed">
          <input type="checkbox" disabled className="h-4 w-4 rounded" />
          <span className="text-sm text-ink">Enable WhatsApp Notifications (requires WHATSAPP_ACCESS_TOKEN)</span>
        </label>
      </div>
    </div>
  );
}

function SeoForm({ defaults }: { defaults: Record<string, unknown> }) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit } = useForm({ defaultValues: { site_title: defaults.site_title ?? "Cakery", site_description: defaults.site_description ?? "", og_image: defaults.og_image ?? "" } });
  function onSubmit(values: Record<string, unknown>) {
    startTransition(async () => {
      const result = await saveSettingsAction("seo", values);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("SEO settings saved.");
    });
  }
  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-4">
      <div><label className="label">Site Title</label><input {...register("site_title")} className="input" /></div>
      <div><label className="label">Default Meta Description</label><textarea {...register("site_description")} rows={3} className="input" /></div>
      <div><label className="label">OG Image URL</label><input {...register("og_image")} className="input" /></div>
      <SaveButton isPending={isPending} />
    </form>
  );
}

function MaintenanceForm({ defaults }: { defaults: Record<string, unknown> }) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit } = useForm({ defaultValues: { enabled: defaults.enabled ?? false, message: defaults.message ?? "We'll be back soon!" } });
  function onSubmit(values: Record<string, unknown>) {
    startTransition(async () => {
      const result = await saveSettingsAction("maintenance", values);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Maintenance settings saved.");
    });
  }
  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" {...register("enabled")} className="h-4 w-4 rounded text-wine" />
        <span className="text-sm font-medium text-ink">Enable Maintenance Mode</span>
      </label>
      <p className="text-xs text-ink-light">When enabled, the storefront shows a branded &quot;coming back soon&quot; page. Admin panel still works.</p>
      <div><label className="label">Maintenance Message</label><textarea {...register("message")} rows={2} className="input" /></div>
      <SaveButton isPending={isPending} />
    </form>
  );
}

function SaveButton({ isPending }: { isPending: boolean }) {
  return (
    <div className="pt-2">
      <button type="submit" disabled={isPending} className="px-6 py-2 bg-wine text-cream rounded-lg text-sm font-medium hover:bg-wine-light disabled:opacity-50">
        {isPending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

export function SettingsClient({ settings }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("shop");

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="flex border-b border-border overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn("px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap", activeTab === tab ? "border-wine text-wine" : "border-transparent text-ink-light hover:text-ink")}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
      <div className="p-6">
        {activeTab === "shop" && <ShopForm defaults={settings.shop ?? {}} />}
        {activeTab === "tax" && <TaxForm defaults={settings.tax ?? {}} />}
        {activeTab === "payment" && <PaymentForm defaults={settings.payment ?? {}} />}
        {activeTab === "notifications" && <NotificationsForm />}
        {activeTab === "seo" && <SeoForm defaults={settings.seo ?? {}} />}
        {activeTab === "maintenance" && <MaintenanceForm defaults={settings.maintenance ?? {}} />}
      </div>
    </div>
  );
}
