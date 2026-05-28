export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Cakery",
  tagline: "Handcrafted with love, delivered to your door",
  shortTagline: "Artisan Cakes & Pastries",
  currency: process.env.NEXT_PUBLIC_CURRENCY ?? "LKR",
  currencySymbol: "Rs.",
  phone: "+94 77 123 4567",
  whatsapp: "+94771234567",
  email: "hello@cakery.lk",
  address: {
    line1: "42 Flower Road",
    line2: "Colombo 03",
    city: "Colombo",
    country: "Sri Lanka",
  },
  mapUrl: "https://maps.google.com/?q=Colombo+Sri+Lanka",
  mapEmbedUrl:
    "https://www.openstreetmap.org/export/embed.html?bbox=79.848%2C6.889%2C79.868%2C6.914&layer=mapnik&marker=6.9014%2C79.8565",
  socials: {
    instagram: "https://instagram.com/cakery.lk",
    facebook: "https://facebook.com/cakery.lk",
  },
  businessHours: "Mon–Sat 8:00 AM – 8:00 PM",
  announcementBar: "Free delivery on orders over Rs. 10,000 · Order 24h in advance",
};

export type Brand = typeof brand;

export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${brand.whatsapp.replace(/\D/g, "")}`;
  if (message) return `${base}?text=${encodeURIComponent(message)}`;
  return base;
}
