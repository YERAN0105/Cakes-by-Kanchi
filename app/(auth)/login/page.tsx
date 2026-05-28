"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthCard } from "@/components/shared/AuthCard";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction, googleOAuthAction } from "@/lib/actions/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthCard title="Welcome back" subtitle="Sign in to your account"><div className="h-48 skeleton rounded-lg" /></AuthCard>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const oauthError = searchParams.get("error");

  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginInput) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("email", data.email);
      fd.set("password", data.password);
      const result = await loginAction(fd);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    });
  };

  const handleGoogle = () => {
    startTransition(async () => {
      const result = await googleOAuthAction(redirectTo);
      if (result && "error" in result) toast.error(result.error);
    });
  };

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your account">
      {oauthError && (
        <p className="mb-4 text-sm text-destructive text-center font-body bg-destructive/10 rounded-md px-3 py-2">
          OAuth sign-in failed. Please try again or use email.
        </p>
      )}

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={isPending}
        className={cn(
          "w-full flex items-center justify-center gap-3 border border-border rounded-md px-4 py-2.5",
          "font-body text-sm text-ink hover:bg-blush-light transition-colors duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-ink-light font-body">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

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
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-body font-medium text-ink">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-wine hover:text-wine-light font-body transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              {...register("password")}
              className={cn(
                "w-full rounded-md border px-3 py-2.5 pr-10 text-sm font-body text-ink bg-card",
                "placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-wine focus:border-transparent transition",
                errors.password ? "border-destructive" : "border-input"
              )}
              placeholder="Your password"
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

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "w-full btn-primary flex items-center justify-center gap-2 mt-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign In
        </button>
      </form>

      <div className="mt-6 space-y-2 text-center">
        <p className="text-sm font-body text-ink-light">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-wine hover:text-wine-light font-medium transition-colors">
            Create one
          </Link>
        </p>
        <p className="text-sm font-body text-ink-light">
          <Link href="/" className="text-ink-light hover:text-wine transition-colors">
            Continue as guest →
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
