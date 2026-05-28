import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";
import Link from "next/link";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  asLink?: boolean;
}

const sizeClasses = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl sm:text-5xl",
};

function LogoMark({ size = "md", className }: { size?: BrandLogoProps["size"]; className?: string }) {
  return (
    <span className={cn("inline-flex flex-col items-center select-none", className)}>
      {/* Thin decorative line above */}
      <span className="block w-12 h-px bg-champagne mb-1.5" aria-hidden="true" />
      <span
        className={cn(
          "font-display tracking-[0.15em] text-wine leading-none",
          sizeClasses[size ?? "md"]
        )}
      >
        {brand.name}
      </span>
      {/* Elegant subtitle */}
      <span className="block text-[0.55em] tracking-[0.3em] uppercase text-ink-light mt-1 font-body">
        Artisan Cakery
      </span>
      {/* Thin decorative line below */}
      <span className="block w-12 h-px bg-champagne mt-1.5" aria-hidden="true" />
    </span>
  );
}

export function BrandLogo({ className, size = "md", href = "/", asLink = true }: BrandLogoProps) {
  if (asLink) {
    return (
      <Link href={href} className={cn("inline-flex items-center", className)} aria-label={brand.name}>
        <LogoMark size={size} />
      </Link>
    );
  }
  return <LogoMark size={size} className={className} />;
}
