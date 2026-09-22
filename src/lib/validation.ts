import { z } from "zod";
import { LIMITS } from "./constants";

/* ---------- shared helpers ---------- */

/** Returns the phone in local format 03XXXXXXXXX (or null if it doesn't look like a Pakistani number). */
export function toLocalPhone(input: string): string | null {
  let d = input.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("0092")) d = d.slice(4);
  else if (d.startsWith("92")) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  if (!/^\d{9,10}$/.test(d)) return null;
  return `0${d}`;
}

/**
 * Detects attempts to smuggle contact details into public text
 * (phone numbers, emails, links, "whatsapp me" etc.) so owners can't bypass the platform.
 */
export function containsContactInfo(text: string): boolean {
  const t = text.toLowerCase();
  if (/[a-z0-9._%+-]+\s?(@|\(at\)|\[at\])\s?[a-z0-9.-]+\.[a-z]{2,}/i.test(t)) return true;
  if (/(https?:\/\/|www\.|wa\.me|\.com\b|\.pk\b|\.net\b)/i.test(t)) return true;
  // digits with optional separators: 9+ digits in total within a short run
  const compact = t.replace(/[\s\-().]/g, "");
  if (/(\+?92|0)3\d{9}/.test(compact)) return true;
  if (/\d{9,}/.test(compact)) return true;
  // digit words e.g. "zero three zero zero"
  if (/(zero|one|two|three|four|five|six|seven|eight|nine|sifar|teen|char|panch|chay|saat|aath|nau)(\W+(zero|one|two|three|four|five|six|seven|eight|nine|sifar|teen|char|panch|chay|saat|aath|nau)){6,}/.test(t)) return true;
  if (/\b(whats\s?app|watsapp|call me|contact me|phone number)\b.{0,20}\d/.test(t)) return true;
  return false;
}

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Password is too long")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/\d/, "Add a number");

const phoneField = z
  .string()
  .trim()
  .refine((v) => toLocalPhone(v) !== null, "Enter a valid Pakistani phone number, e.g. 0300 1234567");

/* ---------- auth ---------- */

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(80),
    email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
    phone: phoneField,
    whatsapp: z.string().trim().refine((v) => v === "" || toLocalPhone(v) !== null, "Enter a valid WhatsApp number"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
export type SignupInput = z.input<typeof signupSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your email or phone").max(120),
  password: z.string().min(1, "Enter your password").max(72),
});
export type LoginInput = z.input<typeof loginSchema>;

export const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
});
export const resetSchema = z
  .object({ token: z.string().min(20).max(200), password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

/* ---------- listing ---------- */

const MEDIA_URL = /^(https:\/\/res\.cloudinary\.com\/|\/uploads\/|\/samples\/)/;

const mediaItem = z.object({
  url: z.string().max(600).regex(MEDIA_URL, "Invalid media URL"),
  type: z.enum(["IMAGE", "VIDEO"]),
});

const intString = (max: number, label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) <= max), `${label}: enter a whole number up to ${max}`);

const decimalString = (max: number, label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+(\.\d+)?$/.test(v) && Number(v) <= max), `${label}: enter a valid number`);

const publicText = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`)
    .refine((v) => !containsContactInfo(v), `${label} must not contain phone numbers, emails or links. Contact details are shared by our team.`);

const PROPERTY_TYPE_VALUES = ["FLAT", "HOUSE", "PORTION", "ROOM", "SHOP", "OFFICE", "WAREHOUSE", "PLOT", "OTHER"] as const;

/**
 * Form schema: inputs are strings (as HTML inputs produce), output is fully typed.
 * The same schema is used by React Hook Form on the client and by the server action.
 */
export const listingSchema = z
  .object({
    // basic
    title: publicText(10, 100, "Title"),
    description: publicText(30, 3000, "Description"),
    propertyType: z.enum(PROPERTY_TYPE_VALUES),
    rentPerMonth: z
      .string()
      .trim()
      .regex(/^\d+$/, "Enter the monthly rent in rupees")
      .refine((v) => Number(v) >= 500 && Number(v) <= 100_000_000, "Rent must be between Rs. 500 and Rs. 100,000,000"),
    securityDeposit: intString(1_000_000_000, "Security deposit"),
    // details
    bedrooms: intString(30, "Bedrooms"),
    bathrooms: intString(30, "Bathrooms"),
    areaSize: decimalString(1_000_000, "Area size"),
    areaUnit: z.enum(["", "MARLA", "KANAL", "SQFT"]),
    floor: z.string().trim().max(30),
    furnished: z.boolean(),
    features: z.array(z.string().max(40)).max(30),
    availableFrom: z.string().trim().refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Enter a valid date"),
    preferredTenant: z.enum(["ANY", "FAMILY", "BACHELOR"]),
    // public location
    city: z.string().trim().min(2, "Select or type a city").max(60),
    area: z
      .string()
      .trim()
      .min(2, "Enter the area / sector / society")
      .max(80)
      .refine((v) => !containsContactInfo(v), "Area must not contain contact details"),
    // private
    fullAddress: z.string().trim().min(10, "Enter the complete address").max(300),
    streetNo: z.string().trim().max(40),
    houseNo: z.string().trim().max(40),
    ownerPhone: phoneField,
    ownerWhatsapp: z.string().trim().refine((v) => v === "" || toLocalPhone(v) !== null, "Enter a valid WhatsApp number"),
    ownerEmail: z.string().trim().refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email"),
    latitude: z.string().trim().refine((v) => v === "" || (!Number.isNaN(Number(v)) && Math.abs(Number(v)) <= 90), "Latitude must be -90 to 90"),
    longitude: z.string().trim().refine((v) => v === "" || (!Number.isNaN(Number(v)) && Math.abs(Number(v)) <= 180), "Longitude must be -180 to 180"),
    // media
    media: z
      .array(mediaItem)
      .refine((m) => m.filter((x) => x.type === "IMAGE").length >= 1, "Add at least one photo")
      .refine((m) => m.filter((x) => x.type === "IMAGE").length <= LIMITS.maxImages, `You can add up to ${LIMITS.maxImages} photos`)
      .refine((m) => m.filter((x) => x.type === "VIDEO").length <= LIMITS.maxVideos, `You can add up to ${LIMITS.maxVideos} videos`),
  })
  .transform((v) => {
    const optInt = (s: string) => (s === "" ? null : Number.parseInt(s, 10));
    const optNum = (s: string) => (s === "" ? null : Number(s));
    return {
      title: v.title,
      description: v.description,
      propertyType: v.propertyType,
      rentPerMonth: Number.parseInt(v.rentPerMonth, 10),
      securityDeposit: optInt(v.securityDeposit),
      bedrooms: optInt(v.bedrooms),
      bathrooms: optInt(v.bathrooms),
      areaSize: optNum(v.areaSize),
      areaUnit: v.areaUnit === "" ? null : v.areaUnit,
      floor: v.floor === "" ? null : v.floor,
      furnished: v.furnished,
      features: Array.from(new Set(v.features)),
      availableFrom: v.availableFrom === "" ? null : new Date(v.availableFrom),
      preferredTenant: v.preferredTenant,
      city: v.city,
      area: v.area,
      fullAddress: v.fullAddress,
      streetNo: v.streetNo === "" ? null : v.streetNo,
      houseNo: v.houseNo === "" ? null : v.houseNo,
      ownerPhone: toLocalPhone(v.ownerPhone) as string,
      ownerWhatsapp: v.ownerWhatsapp === "" ? null : toLocalPhone(v.ownerWhatsapp),
      ownerEmail: v.ownerEmail === "" ? null : v.ownerEmail.toLowerCase(),
      latitude: optNum(v.latitude),
      longitude: optNum(v.longitude),
      media: v.media,
    };
  });
export type ListingFormValues = z.input<typeof listingSchema>;
export type ListingInput = z.output<typeof listingSchema>;

/* ---------- admin ---------- */

export const dealSchema = z.object({
  listingId: z.string().min(1, "Select a listing"),
  tenantName: z.string().trim().min(2, "Enter tenant name").max(80),
  tenantPhone: phoneField,
  commissionAmount: z.string().trim().regex(/^\d+$/, "Enter commission in rupees"),
  status: z.enum(["IN_PROGRESS", "COMMISSION_PENDING", "COMMISSION_RECEIVED", "CANCELLED"]),
  notes: z.string().trim().max(1000).optional().default(""),
});

export const rejectSchema = z.object({
  reason: z.string().trim().min(5, "Give the owner a short reason").max(500),
});

export const inquirySchema = z.object({
  publicId: z.string().trim().regex(/^[A-Z]{2}-\d{4,10}$/),
  source: z.enum(["card", "detail", "sticky", "similar", "other"]).default("other"),
});
