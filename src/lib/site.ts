export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Pakistan Rents",
  shortName: "Pakistan Rents",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  adminWhatsapp: (process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "923295780676").replace(/\D/g, ""),
  idPrefix: "RH",
  tagline: "Verified rental properties across Pakistan: flats, houses, shops, offices and more.",
  keywords: [
    "property for rent in Pakistan",
    "flat for rent",
    "house for rent",
    "kiraye par makan",
    "makan kiraya",
    "dukan kiraye ke liye",
    "portion for rent",
    "office for rent",
    "rent property Islamabad Lahore Karachi",
  ],
} as const;

export function absoluteUrl(path = "/"): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
