import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { formatCurrency } from "@/lib/brand";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { InquiryDetailClient } from "./InquiryDetailClient";
import type { InquiryStatus } from "@/types/database";

const TZ = "Asia/Colombo";

interface PageProps { params: Promise<{ id: string }> }

export default async function InquiryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  const [inquiryRes, imagesRes] = await Promise.all([
    admin.from("custom_inquiries").select("*").eq("id", id).single(),
    admin.from("custom_inquiry_images").select("*").eq("inquiry_id", id),
  ]);

  if (!inquiryRes.data) notFound();

  const inq = inquiryRes.data as unknown as {
    id: string;
    name: string;
    email: string;
    phone: string;
    event_date: string | null;
    occasion: string | null;
    servings: number | null;
    description: string | null;
    budget_min: string | null;
    budget_max: string | null;
    special_requirements: string | null;
    status: InquiryStatus;
    quoted_amount: string | null;
    quote_message: string | null;
    payment_link: string | null;
    created_at: string;
  };

  const images = (imagesRes.data ?? []) as { id: string; url: string }[];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin/inquiries" className="text-sm text-ink-light hover:text-ink">← Inquiries</Link>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-ink">Inquiry from {inq.name}</h2>
        <StatusBadge type="inquiry" value={inq.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-border shadow-sm p-6">
            <h3 className="font-display text-lg text-ink mb-4">Inquiry Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-ink-light">Event Date</p><p className="font-medium">{inq.event_date ? formatInTimeZone(`${inq.event_date}T00:00:00`, TZ, "d MMMM yyyy") : "Not specified"}</p></div>
              <div><p className="text-ink-light">Occasion</p><p className="font-medium">{inq.occasion ?? "—"}</p></div>
              <div><p className="text-ink-light">Servings</p><p className="font-medium">{inq.servings ?? "—"}</p></div>
              <div><p className="text-ink-light">Budget</p><p className="font-medium">{inq.budget_min && inq.budget_max ? `${formatCurrency(parseFloat(inq.budget_min))} – ${formatCurrency(parseFloat(inq.budget_max))}` : "Not specified"}</p></div>
            </div>
            {inq.description && (
              <div className="mt-4">
                <p className="text-ink-light text-sm mb-1">Description</p>
                <p className="text-sm text-ink bg-gray-50 rounded-lg p-3">{inq.description}</p>
              </div>
            )}
            {inq.special_requirements && (
              <div className="mt-4">
                <p className="text-ink-light text-sm mb-1">Special Requirements</p>
                <p className="text-sm text-ink bg-amber-50 rounded-lg p-3">{inq.special_requirements}</p>
              </div>
            )}
          </div>

          {images.length > 0 && (
            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-display text-lg text-ink mb-4">Reference Images</h3>
              <div className="grid grid-cols-3 gap-3">
                {images.map((img) => (
                  <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-border hover:opacity-90">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="Reference" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <InquiryDetailClient
            inquiryId={inq.id}
            currentStatus={inq.status}
            existingQuote={{ amount: inq.quoted_amount, message: inq.quote_message, link: inq.payment_link }}
          />
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <h3 className="font-display text-base text-ink mb-3">Customer</h3>
            <p className="font-medium text-ink">{inq.name}</p>
            <a href={`mailto:${inq.email}`} className="text-sm text-wine hover:underline block">{inq.email}</a>
            <a href={`tel:${inq.phone}`} className="text-sm text-wine hover:underline block">{inq.phone}</a>
          </div>
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <h3 className="font-display text-base text-ink mb-1">Submitted</h3>
            <p className="text-sm text-ink-light">{formatInTimeZone(inq.created_at, TZ, "d MMMM yyyy, h:mm a")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
