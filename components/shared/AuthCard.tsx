import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { type ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export function AuthCard({ children, title, subtitle, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md mx-auto bg-card border border-border rounded-xl shadow-lg px-8 py-10",
        className
      )}
    >
      <div className="flex flex-col items-center mb-8">
        <BrandLogo size="md" />
        <div className="ornament-line mt-6 mb-5" />
        <h1 className="font-display text-2xl text-ink tracking-tight text-center">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-sm text-center text-ink-light font-body">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
