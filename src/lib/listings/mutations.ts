import "server-only";
import type { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { CITY_NAMES, PROPERTY_TYPE_BY_VALUE } from "../constants";
import { db } from "../db";
import { SITE } from "../site";
import { slugify } from "../utils";
import type { ListingInput } from "../validation";

function canonicalCity(city: string): string {
  const hit = CITY_NAMES.find((c) => c.toLowerCase() === city.trim().toLowerCase());
  return hit ?? city.trim().replace(/\s+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function publicData(input: ListingInput) {
  const city = canonicalCity(input.city);
  const area = input.area.replace(/\s+/g, " ").trim();
  return {
    title: input.title,
    description: input.description,
    propertyType: input.propertyType,
    rentPerMonth: input.rentPerMonth,
    securityDeposit: input.securityDeposit,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    areaSize: input.areaSize,
    areaUnit: input.areaUnit,
    floor: input.floor,
    furnished: input.furnished,
    features: input.features,
    availableFrom: input.availableFrom,
    preferredTenant: input.preferredTenant,
    city,
    citySlug: slugify(city),
    area,
    areaSlug: slugify(area),
  } satisfies Prisma.ListingUncheckedUpdateInput;
}

function privateData(input: ListingInput) {
  return {
    fullAddress: input.fullAddress,
    streetNo: input.streetNo,
    houseNo: input.houseNo,
    ownerPhone: input.ownerPhone,
    ownerWhatsapp: input.ownerWhatsapp,
    ownerEmail: input.ownerEmail,
    latitude: input.latitude,
    longitude: input.longitude,
  };
}

function mediaData(media: ListingInput["media"]) {
  // Photos first, then videos; keep the owner's order inside each group.
  const images = media.filter((m) => m.type === "IMAGE");
  const videos = media.filter((m) => m.type === "VIDEO");
  return [...images, ...videos].map((m, order) => ({ url: m.url, type: m.type, order }));
}

export function buildSlug(input: { propertyType: keyof typeof PROPERTY_TYPE_BY_VALUE; area: string; city: string }, publicId: string) {
  const type = slugify(PROPERTY_TYPE_BY_VALUE[input.propertyType].label.split("/")[0]!.trim());
  return `${type}-for-rent-in-${slugify(input.area)}-${slugify(input.city)}-${publicId.toLowerCase()}`;
}

export async function createListingRecord(ownerId: string, input: ListingInput) {
  const pub = publicData(input);
  return db.$transaction(async (tx) => {
    const created = await tx.listing.create({
      data: {
        ...(pub as Omit<typeof pub, never> as Prisma.ListingUncheckedCreateInput),
        // temporary unique values; replaced below once the sequence number is known
        publicId: `tmp-${randomUUID()}`,
        slug: `tmp-${randomUUID()}`,
        ownerId,
        status: "PENDING",
        private: { create: privateData(input) },
        media: { create: mediaData(input.media) },
      } as Prisma.ListingUncheckedCreateInput,
      select: { id: true, seq: true },
    });
    const publicId = `${SITE.idPrefix}-${10000 + created.seq}`;
    return tx.listing.update({
      where: { id: created.id },
      data: { publicId, slug: buildSlug({ propertyType: input.propertyType, area: pub.area, city: pub.city }, publicId) },
      select: { id: true, publicId: true, slug: true },
    });
  });
}

/** Replaces listing content. Returns media rows that were removed (for storage cleanup). */
export async function updateListingRecord(id: string, input: ListingInput, opts: { resetToPending: boolean }) {
  const pub = publicData(input);
  return db.$transaction(async (tx) => {
    const before = await tx.media.findMany({ where: { listingId: id }, select: { url: true, type: true } });
    await tx.media.deleteMany({ where: { listingId: id } });
    await tx.listing.update({
      where: { id },
      data: {
        ...pub,
        ...(opts.resetToPending ? { status: "PENDING", approvedAt: null, rejectionReason: null } : {}),
        private: {
          upsert: { create: privateData(input), update: privateData(input) },
        },
        media: { create: mediaData(input.media) },
      },
    });
    const keep = new Set(input.media.map((m) => m.url));
    return before.filter((m) => !keep.has(m.url));
  });
}
