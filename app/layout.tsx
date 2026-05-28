import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Great_Vibes } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { brand } from "@/lib/brand";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const accentFont = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-accent",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — ${brand.shortTagline}`,
    template: `%s | ${brand.name}`,
  },
  description: brand.tagline,
  keywords: ["cake", "bakery", "custom cakes", "wedding cakes", "Sri Lanka", "Colombo", "artisan"],
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: `${brand.name} — ${brand.shortTagline}`,
    description: brand.tagline,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${accentFont.variable}`}
    >
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "font-body text-sm",
              success: "!bg-card !text-ink !border-border",
              error: "!bg-card !text-destructive !border-destructive/30",
            },
          }}
        />
      </body>
    </html>
  );
}
