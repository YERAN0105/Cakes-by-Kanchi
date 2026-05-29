import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AdminCardProps {
  children: ReactNode;
  className?: string;
}

export function AdminCard({ children, className }: AdminCardProps) {
  return (
    <div className={cn("bg-white rounded-xl border border-border p-6 shadow-sm", className)}>
      {children}
    </div>
  );
}

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function AdminPageHeader({ title, subtitle, action }: AdminPageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {subtitle && <p className="text-sm text-ink-light mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
