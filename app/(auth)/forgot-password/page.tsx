"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { AuthCard } from "@/components/shared/AuthCard";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { forgotPasswordAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = (data: ForgotPasswordInput) => {
    setServerError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("email", data.email);
      const result = await forgotPasswordAction(fd);
      if ("error" in result) {
        setServerError(result.error);
      } else {
        setSent(true);
      }
    });
  };

  if (sent) {
    return (
      <AuthCard title="Check your email" subtitle="We've sent you a reset link">
        <div className="flex flex-col items-center gap-4 py-4">
          <CheckCircle2 className="w-12 h-12 text-wine" />
          <p className="text-sm text-center font-body text-ink-light">
            We sent a password reset link to{" "}
            <span className="font-medium text-ink">{getValues("email")}</span>. It may take a
            minute to arrive. Check your spam folder if you don&apos;t see it.
          </p>
          <Link href="/login" className="text-sm text-wine hover:text-wine-light font-body font-medium transition-colors mt-2">
            ← Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send a reset link"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-body font-medium text-ink mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className={cn(
              "w-full rounded-md border px-3 py-2.5 text-sm font-body text-ink bg-card",
              "placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-wine focus:border-transparent transition",
              errors.email ? "border-destructive" : "border-input"
            )}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive font-body">{errors.email.message}</p>
          )}
          {serverError && (
            <p className="mt-1 text-xs text-destructive font-body">{serverError}</p>
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
          Send Reset Link
        </button>
      </form>

      <p className="mt-6 text-center text-sm font-body text-ink-light">
        <Link href="/login" className="text-wine hover:text-wine-light font-medium transition-colors">
          ← Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
