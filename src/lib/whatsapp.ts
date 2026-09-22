import type { PropertyType } from "@prisma/client";
import { PROPERTY_TYPE_BY_VALUE } from "./constants";
import { SITE } from "./site";
import { formatPKR } from "./utils";

interface WhatsAppListing {
  publicId: string;
  slug: string;
  propertyType: PropertyType;
  area: string;
  city: string;
  rentPerMonth: number;
}

export function buildWhatsAppMessage(l: WhatsAppListing, url: string): string {
  const type = PROPERTY_TYPE_BY_VALUE[l.propertyType].label;
  return `Assalam o Alaikum, I am interested in the property with Listing ID: ${l.publicId} (${type}, ${l.area}, ${l.city}, ${formatPKR(
    l.rentPerMonth,
  )}). Link: ${url}. Please share more details.`;
}

export function buildWhatsAppUrl(l: WhatsAppListing): string {
  const url = `${SITE.url}/listings/${l.slug}`;
  return `https://wa.me/${SITE.adminWhatsapp}?text=${encodeURIComponent(buildWhatsAppMessage(l, url))}`;
}

export function generalWhatsAppUrl(text = "Assalam o Alaikum, I need help finding a rental property."): string {
  return `https://wa.me/${SITE.adminWhatsapp}?text=${encodeURIComponent(text)}`;
}

/** wa.me link to a specific number (used by the admin to reach owners). */
export function whatsappLinkTo(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("92") ? digits : digits.startsWith("0") ? `92${digits.slice(1)}` : `92${digits}`;
  return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
