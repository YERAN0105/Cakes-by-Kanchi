"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { saveLoyaltySettingsAction } from "@/lib/actions/admin";

interface LoyaltySettings {
  earn_rate: number;
  redemption_rate: number;
  max_redemption_percent: number;
  welcome_bonus: number;
  birthday_bonus: number;
  review_bonus: number;
  expiry_months: number;
}

export function LoyaltySettingsClient({ defaults }: { defaults: LoyaltySettings }) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit } = useForm<LoyaltySettings>({ defaultValues: defaults });

  function onSubmit(values: LoyaltySettings) {
    startTransition(async () => {
      const result = await saveLoyaltySettingsAction(values);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Loyalty settings saved.");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-display text-base text-ink mb-4">Earning</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Points per Rs. spent</label>
              <p className="text-xs text-ink-light mb-1">1 point per X Rs. (e.g. 100 = 1 point per Rs. 100)</p>
              <input {...register("earn_rate", { valueAsNumber: true })} type="number" className="input w-32" />
            </div>
            <div>
              <label className="label">Expiry (months)</label>
              <input {...register("expiry_months", { valueAsNumber: true })} type="number" className="input w-32" />
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-display text-base text-ink mb-4">Redemption</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Rs. value per 100 points</label>
              <p className="text-xs text-ink-light mb-1">e.g. 50 = Rs. 50 per 100 points</p>
              <input {...register("redemption_rate", { valueAsNumber: true })} type="number" className="input w-32" />
            </div>
            <div>
              <label className="label">Max redemption % per order</label>
              <input {...register("max_redemption_percent", { valueAsNumber: true })} type="number" className="input w-32" min={0} max={100} />
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-display text-base text-ink mb-4">Bonus Points</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Welcome Bonus (first order)</label>
              <input {...register("welcome_bonus", { valueAsNumber: true })} type="number" className="input w-32" min={0} />
            </div>
            <div>
              <label className="label">Birthday Bonus</label>
              <input {...register("birthday_bonus", { valueAsNumber: true })} type="number" className="input w-32" min={0} />
            </div>
            <div>
              <label className="label">Review Bonus (per approved review)</label>
              <input {...register("review_bonus", { valueAsNumber: true })} type="number" className="input w-32" min={0} />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <button type="submit" disabled={isPending} className="px-6 py-2 bg-wine text-cream rounded-lg text-sm font-medium hover:bg-wine-light disabled:opacity-50">
          {isPending ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
