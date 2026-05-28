import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${brand.name}.`,
};

export default function PrivacyPage() {
  return (
    <>
      <div className="py-16 bg-cream-50 border-b border-border text-center">
        <p className="label-small text-wine mb-3">Legal</p>
        <h1 className="heading-lg">Privacy Policy</h1>
        <div className="ornament-line mt-4" />
      </div>

      <Container narrow className="py-16">
        <div className="space-y-8 font-body text-ink-light leading-relaxed">
          <p className="text-sm">Last updated: {new Date().toLocaleDateString("en-LK", { year: "numeric", month: "long", day: "numeric" })}</p>

          {[
            {
              title: "1. Information We Collect",
              body: "We collect information you provide when creating an account, placing an order, or contacting us — including your name, email address, phone number, and delivery address.",
            },
            {
              title: "2. How We Use Your Information",
              body: "We use your information to process orders, send order updates via email and WhatsApp, and occasionally send promotional offers (which you can opt out of at any time).",
            },
            {
              title: "3. Data Storage",
              body: "Your data is securely stored using Supabase (PostgreSQL) with row-level security. Passwords are hashed and never stored in plain text.",
            },
            {
              title: "4. Sharing Your Data",
              body: "We do not sell or share your personal data with third parties except as required to fulfil your order (e.g., delivery partners) or as required by law.",
            },
            {
              title: "5. Cookies",
              body: "We use essential session cookies for authentication. We may use analytics cookies to understand how visitors use our site. You can disable cookies in your browser settings.",
            },
            {
              title: "6. Your Rights",
              body: "You have the right to access, correct, or delete your personal data. Contact us at the email below to exercise these rights.",
            },
          ].map(({ title, body }) => (
            <section key={title}>
              <h2 className="font-display text-xl text-ink mb-3">{title}</h2>
              <p>{body}</p>
            </section>
          ))}

          <p className="text-sm">
            Questions? Contact our privacy team at{" "}
            <a href={`mailto:${brand.email}`} className="text-wine hover:underline">
              {brand.email}
            </a>
            .
          </p>
        </div>
      </Container>
    </>
  );
}
