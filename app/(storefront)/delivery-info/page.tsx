import type { Metadata } from "next";
import { Truck, Clock, MapPin, AlertCircle } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Delivery Information",
  description: `Delivery zones, fees, and timings for ${brand.name}.`,
};

export default function DeliveryInfoPage() {
  return (
    <>
      <div className="py-16 bg-cream-50 border-b border-border text-center">
        <p className="label-small text-wine mb-3">Getting to You</p>
        <h1 className="heading-lg">Delivery Information</h1>
        <div className="ornament-line mt-4" />
      </div>

      <Container narrow className="py-16 space-y-12">
        {[
          {
            icon: Truck,
            title: "Delivery Zones & Fees",
            content: (
              <table className="w-full text-sm font-body border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-ink font-medium">Zone</th>
                    <th className="text-left py-2 pr-4 text-ink font-medium">Fee</th>
                    <th className="text-left py-2 text-ink font-medium">Estimated Time</th>
                  </tr>
                </thead>
                <tbody className="text-ink-light">
                  {[
                    ["Colombo 1–7", "Rs. 500", "2–4 hours"],
                    ["Colombo 8–15", "Rs. 700", "3–5 hours"],
                    ["Suburbs", "Rs. 900", "4–6 hours"],
                  ].map(([zone, fee, time]) => (
                    <tr key={zone} className="border-b border-border/50">
                      <td className="py-3 pr-4">{zone}</td>
                      <td className="py-3 pr-4 text-wine font-medium">{fee}</td>
                      <td className="py-3">{time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ),
          },
          {
            icon: Clock,
            title: "Delivery Time Slots",
            content: (
              <ul className="space-y-2 text-sm font-body text-ink-light">
                <li className="flex gap-2"><span className="text-wine">•</span> Morning: 10:00 AM – 12:00 PM</li>
                <li className="flex gap-2"><span className="text-wine">•</span> Afternoon: 2:00 PM – 4:00 PM</li>
                <li className="flex gap-2"><span className="text-wine">•</span> Evening: 6:00 PM – 8:00 PM</li>
              </ul>
            ),
          },
          {
            icon: MapPin,
            title: "Self Pickup",
            content: (
              <p className="text-sm font-body text-ink-light leading-relaxed">
                You&apos;re welcome to collect your order from our kitchen at{" "}
                <strong className="text-ink">{brand.address.line1}, {brand.address.line2}</strong>. Select
                &ldquo;Pickup&rdquo; at checkout and choose your preferred time. Pickup is always free.
              </p>
            ),
          },
          {
            icon: AlertCircle,
            title: "Important Notes",
            content: (
              <ul className="space-y-2 text-sm font-body text-ink-light">
                <li className="flex gap-2"><span className="text-wine">•</span> Minimum order of Rs. 2,000 for delivery.</li>
                <li className="flex gap-2"><span className="text-wine">•</span> Orders must be placed at least 24 hours in advance.</li>
                <li className="flex gap-2"><span className="text-wine">•</span> Someone must be available to receive the delivery.</li>
                <li className="flex gap-2"><span className="text-wine">•</span> Free delivery on orders over Rs. 10,000 within Colombo 1–7.</li>
              </ul>
            ),
          },
        ].map(({ icon: Icon, title, content }) => (
          <div key={title} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-blush-light flex items-center justify-center">
                <Icon className="w-5 h-5 text-wine" aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl text-ink">{title}</h2>
            </div>
            {content}
          </div>
        ))}
      </Container>
    </>
  );
}
