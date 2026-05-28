import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { ContactForm } from "@/components/storefront/ContactForm";
import { brand, whatsappUrl } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Get in touch with ${brand.name}. We'd love to hear from you.`,
};

export default function ContactPage() {
  return (
    <>
      <div className="py-16 bg-cream-50 border-b border-border text-center">
        <p className="label-small text-wine mb-3">Say Hello</p>
        <h1 className="heading-lg">Contact Us</h1>
        <div className="ornament-line mt-4" />
      </div>

      <Container className="py-16">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact info */}
          <div>
            <h2 className="heading-sm mb-8">Get in Touch</h2>
            <ul className="space-y-5">
              {[
                {
                  icon: Phone,
                  label: "Phone",
                  value: brand.phone,
                  href: `tel:${brand.phone.replace(/\s/g, "")}`,
                },
                { icon: Mail, label: "Email", value: brand.email, href: `mailto:${brand.email}` },
                {
                  icon: MapPin,
                  label: "Address",
                  value: `${brand.address.line1}, ${brand.address.line2}, ${brand.address.city}`,
                  href: brand.mapUrl,
                },
                { icon: Clock, label: "Hours", value: brand.businessHours, href: undefined },
              ].map(({ icon: Icon, label, value, href }) => (
                <li key={label} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blush-light flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-wine" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs label-small mb-0.5">{label}</p>
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="font-body text-ink hover:text-wine transition-colors"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="font-body text-ink">{value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 mt-8 bg-[#25D366] text-white font-body font-medium px-6 py-3 rounded-md hover:bg-[#20ba5a] transition-colors"
            >
              <MessageCircle className="w-5 h-5" aria-hidden="true" />
              Chat on WhatsApp
            </a>
          </div>

          {/* Contact form */}
          <div>
            <h2 className="heading-sm mb-8">Send a Message</h2>
            <ContactForm />
          </div>
        </div>
      </Container>
    </>
  );
}
