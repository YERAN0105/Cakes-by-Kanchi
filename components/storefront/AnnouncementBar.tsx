import { brand } from "@/lib/brand";

export function AnnouncementBar() {
  return (
    <div
      role="banner"
      className="bg-wine text-cream text-xs font-body text-center py-2 px-4 tracking-wide"
    >
      {brand.announcementBar}
    </div>
  );
}
