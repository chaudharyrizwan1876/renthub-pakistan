import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "../db";
import type { ListingFormValues } from "../validation";

/**
 * PRIVATE reads. Only import from owner/admin pages, actions and route handlers that have
 * already run an authorization check (requireOwnerPage / requireAdminPage / requireRole).
 */
export const fullListingInclude = {
  private: true,
  media: { orderBy: { order: "asc" } },
  owner: { select: { id: true, name: true, email: true, phone: true, whatsapp: true } },
  _count: { select: { inquiries: true, deals: true } },
} satisfies Prisma.ListingInclude;

export type FullListing = Prisma.ListingGetPayload<{ include: typeof fullListingInclude }>;

export async function getFullListing(id: string): Promise<FullListing | null> {
  return db.listing.findUnique({ where: { id }, include: fullListingInclude });
}

export function listingToFormValues(l: FullListing): ListingFormValues {
  return {
    title: l.title,
    description: l.description,
    propertyType: l.propertyType,
    rentPerMonth: String(l.rentPerMonth),
    securityDeposit: l.securityDeposit != null ? String(l.securityDeposit) : "",
    bedrooms: l.bedrooms != null ? String(l.bedrooms) : "",
    bathrooms: l.bathrooms != null ? String(l.bathrooms) : "",
    areaSize: l.areaSize != null ? String(l.areaSize) : "",
    areaUnit: l.areaUnit ?? "",
    floor: l.floor ?? "",
    furnished: l.furnished,
    features: l.features,
    availableFrom: l.availableFrom ? l.availableFrom.toISOString().slice(0, 10) : "",
    preferredTenant: l.preferredTenant,
    city: l.city,
    area: l.area,
    fullAddress: l.private?.fullAddress ?? "",
    streetNo: l.private?.streetNo ?? "",
    houseNo: l.private?.houseNo ?? "",
    ownerPhone: l.private?.ownerPhone ?? "",
    ownerWhatsapp: l.private?.ownerWhatsapp ?? "",
    ownerEmail: l.private?.ownerEmail ?? "",
    latitude: l.private?.latitude != null ? String(l.private.latitude) : "",
    longitude: l.private?.longitude != null ? String(l.private.longitude) : "",
    media: l.media.map((m) => ({ url: m.url, type: m.type })),
  };
}
