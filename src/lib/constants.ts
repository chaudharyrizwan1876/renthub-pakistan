import type { AreaUnit, DealStatus, ListingStatus, PreferredTenant, PropertyType } from "@prisma/client";
import { slugify } from "./utils";

export const PROPERTY_TYPES: { value: PropertyType; label: string; plural: string; slug: string }[] = [
  { value: "FLAT", label: "Flat / Apartment", plural: "Flats", slug: "flats" },
  { value: "HOUSE", label: "House", plural: "Houses", slug: "houses" },
  { value: "PORTION", label: "Portion / Upper Portion", plural: "Portions", slug: "portions" },
  { value: "ROOM", label: "Room", plural: "Rooms", slug: "rooms" },
  { value: "SHOP", label: "Shop", plural: "Shops", slug: "shops" },
  { value: "OFFICE", label: "Office", plural: "Offices", slug: "offices" },
  { value: "WAREHOUSE", label: "Warehouse", plural: "Warehouses", slug: "warehouses" },
  { value: "PLOT", label: "Plot / Land", plural: "Plots", slug: "plots" },
  { value: "OTHER", label: "Other", plural: "Other Properties", slug: "other-properties" },
];

export const PROPERTY_TYPE_BY_VALUE = Object.fromEntries(PROPERTY_TYPES.map((t) => [t.value, t])) as Record<
  PropertyType,
  (typeof PROPERTY_TYPES)[number]
>;
export const PROPERTY_TYPE_BY_SLUG = Object.fromEntries(PROPERTY_TYPES.map((t) => [t.slug, t])) as Record<
  string,
  (typeof PROPERTY_TYPES)[number]
>;
/** Types where bedrooms/bathrooms are meaningful */
export const RESIDENTIAL_TYPES: PropertyType[] = ["FLAT", "HOUSE", "PORTION", "ROOM"];

export const AREA_UNITS: { value: AreaUnit; label: string }[] = [
  { value: "MARLA", label: "Marla" },
  { value: "KANAL", label: "Kanal" },
  { value: "SQFT", label: "Sq. Ft." },
];
export const AREA_UNIT_LABEL: Record<AreaUnit, string> = { MARLA: "Marla", KANAL: "Kanal", SQFT: "Sq. Ft." };

export const PREFERRED_TENANTS: { value: PreferredTenant; label: string }[] = [
  { value: "ANY", label: "Anyone" },
  { value: "FAMILY", label: "Family" },
  { value: "BACHELOR", label: "Bachelor" },
];

export const STATUS_META: Record<ListingStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending review", className: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200" },
  APPROVED: { label: "Approved", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200" },
  RENTED: { label: "Rented", className: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200" },
  INACTIVE: { label: "Inactive", className: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200" },
};

export const DEAL_STATUS_LABEL: Record<DealStatus, string> = {
  IN_PROGRESS: "In progress",
  COMMISSION_PENDING: "Commission pending",
  COMMISSION_RECEIVED: "Commission received",
  CANCELLED: "Cancelled",
};

export const FEATURES: { value: string; label: string }[] = [
  { value: "gas", label: "Gas" },
  { value: "electricity", label: "Electricity" },
  { value: "water", label: "Water supply" },
  { value: "parking", label: "Parking" },
  { value: "lift", label: "Lift" },
  { value: "security", label: "Security guard" },
  { value: "cctv", label: "CCTV" },
  { value: "generator", label: "Generator / UPS" },
  { value: "internet", label: "Internet ready" },
  { value: "ac", label: "Air conditioning" },
  { value: "balcony", label: "Balcony" },
  { value: "servant-quarter", label: "Servant quarter" },
  { value: "lawn", label: "Lawn / Garden" },
  { value: "separate-entrance", label: "Separate entrance" },
];
export const FEATURE_LABEL = Object.fromEntries(FEATURES.map((f) => [f.value, f.label])) as Record<string, string>;

export const CITIES: { name: string; areas: string[] }[] = [
  {
    name: "Islamabad",
    areas: ["I-8", "I-10", "I-11", "G-10", "G-11", "F-10", "F-11", "E-11", "D-12", "H-13", "DHA Phase 2", "Bahria Town", "Gulberg Greens", "PWD", "Bani Gala", "Saddar"],
  },
  {
    name: "Rawalpindi",
    areas: ["Bahria Town", "DHA Phase 1", "Satellite Town", "Saddar", "Chaklala Scheme 3", "Adiala Road", "Westridge", "Gulzar-e-Quaid", "Commercial Market"],
  },
  {
    name: "Lahore",
    areas: ["DHA Phase 5", "DHA Phase 6", "Gulberg", "Johar Town", "Model Town", "Bahria Town", "Wapda Town", "Faisal Town", "Iqbal Town", "Cantt", "Township"],
  },
  {
    name: "Karachi",
    areas: ["Clifton", "DHA Phase 6", "Gulshan-e-Iqbal", "Gulistan-e-Jauhar", "North Nazimabad", "PECHS", "Bahadurabad", "Nazimabad", "Saddar", "Korangi", "Scheme 33"],
  },
  { name: "Peshawar", areas: ["Hayatabad", "University Town", "Saddar", "Regi Model Town", "Gulbahar", "Ring Road"] },
  { name: "Faisalabad", areas: ["Peoples Colony", "D Ground", "Madina Town", "Susan Road", "Canal Road", "Millat Town"] },
  { name: "Multan", areas: ["Gulgasht Colony", "Bosan Road", "Cantt", "Shah Rukn-e-Alam Colony", "Model Town"] },
  { name: "Gujranwala", areas: ["Satellite Town", "Model Town", "Citi Housing", "GT Road"] },
  { name: "Sialkot", areas: ["Cantt", "Paris Road", "Defence Road", "Model Town"] },
  { name: "Quetta", areas: ["Satellite Town", "Jinnah Town", "Samungli Road", "Airport Road"] },
  { name: "Hyderabad", areas: ["Latifabad", "Qasimabad", "Auto Bhan Road", "Cantt"] },
  { name: "Abbottabad", areas: ["Mandian", "Jinnahabad", "Supply Bazar", "Mansehra Road"] },
];
export const CITY_NAMES = CITIES.map((c) => c.name);
export const CITY_BY_SLUG = Object.fromEntries(CITIES.map((c) => [slugify(c.name), c])) as Record<string, (typeof CITIES)[number]>;
export const ALL_KNOWN_AREAS = Array.from(new Set(CITIES.flatMap((c) => c.areas))).sort();

export const BUDGET_STEPS = [10000, 15000, 20000, 30000, 40000, 50000, 75000, 100000, 150000, 200000, 300000, 500000];

export const LIMITS = {
  maxImages: 15,
  maxVideos: 2,
  maxImageBytes: 4 * 1024 * 1024, // per request after client-side compression (Vercel body limit safe)
  maxVideoBytes: 60 * 1024 * 1024,
  pageSize: 12,
} as const;

export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_VIDEO_MIME = ["video/mp4", "video/webm", "video/quicktime"] as const;
