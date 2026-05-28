"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthCard } from "@/components/shared/AuthCard";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { resetPasswordAction } from "@/lib/actions/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = (data: ResetPasswordInput) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("password", data.password);
      fd.set("confirmPassword", data.confirmPassword);
      const result = await resetPasswordAction(fd);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Password updated successfully. Please sign in.");
        router.push("/login");
      }
    });
  };

  return (
    <AuthCard title="Set new password" subtitle="Choose a strong password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="password" className="block text-sm font-body font-medium text-ink mb-1.5">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...register("password")}
              className={cn(
                "w-full rounded-md border px-3 py-2.5 pr-10 text-sm font-body text-ink bg-card",
                "placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-wine focus:border-transparent transition",
                errors.password ? "border-destructive" : "border-input"
              )}
              placeholder="Min. 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-destructive font-body">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-body font-medium text-ink mb-1.5"
          >
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              {...register("confirmPassword")}
              className={cn(
                "w-full rounded-md border px-3 py-2.5 pr-10 text-sm font-body text-ink bg-card",
                "placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-wine focus:border-transparent transition",
                errors.confirmPassword ? "border-destructive" : "border-input"
              )}
              placeholder="Repeat new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-destructive font-body">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "w-full btn-primary flex items-center justify-center gap-2 mt-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Update Password
        </button>
      </form>
    </AuthCard>
  );
}
