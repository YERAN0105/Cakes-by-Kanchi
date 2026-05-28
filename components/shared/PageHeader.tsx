import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <div className={cn("py-16 bg-cream-50 border-b border-border text-center", className)}>
      <p className="label-small text-wine mb-3">
        {subtitle ? subtitle.split(" ").slice(0, 2).join(" ") : ""}
      </p>
      <h1 className="heading-lg">{title}</h1>
      <div className="ornament-line mt-4" />
    </div>
  );
}
