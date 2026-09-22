import "server-only";
import type { AreaUnit, MediaType, Prisma, PreferredTenant, PropertyType } from "@prisma/client";
import { db } from "../db";
import { LIMITS } from "../constants";

/**
 * PUBLIC LISTING DTO
 * ------------------
 * This is the ONLY shape that public pages / public APIs / client components may receive.
 * Private data (address, owner contact, coordinates, admin notes, owner id) is stored in a
 * separate table (ListingPrivate) and is deliberately absent from this select + mapper.
 */
export const publicListingSelect = {
  publicId: true,
  slug: true,
  title: true,
  description: true,
  propertyType: true,
  rentPerMonth: true,
  securityDeposit: true,
  bedrooms: true,
  bathrooms: true,
  areaSize: true,
  areaUnit: true,
  floor: true,
  furnished: true,
  features: true,
  availableFrom: true,
  preferredTenant: true,
  city: true,
  citySlug: true,
  area: true,
  areaSlug: true,
  featured: true,
  createdAt: true,
  approvedAt: true,
  media: { select: { url: true, type: true }, orderBy: { order: "asc" } },
} satisfies Prisma.ListingSelect;

export interface PublicMedia {
  url: string;
  type: MediaType;
}

export interface PublicListing {
  publicId: string;
  slug: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  rentPerMonth: number;
  securityDeposit: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSize: number | null;
  areaUnit: AreaUnit | null;
  floor: string | null;
  furnished: boolean;
  features: string[];
  availableFrom: Date | null;
  preferredTenant: PreferredTenant;
  city: string;
  citySlug: string;
  area: string;
  areaSlug: string;
  featured: boolean;
  createdAt: Date;
  approvedAt: Date | null;
  media: PublicMedia[];
}

/** Explicit whitelist mapper: even if the select is widened by mistake, nothing else gets through. */
export function toPublicListing(row: Record<string, unknown> & { media?: { url: string; type: MediaType }[] }): PublicListing {
  const r = row as unknown as PublicListing;
  return {
    publicId: r.publicId,
    slug: r.slug,
    title: r.title,
    description: r.description,
    propertyType: r.propertyType,
    rentPerMonth: r.rentPerMonth,
    securityDeposit: r.securityDeposit,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    areaSize: r.areaSize,
    areaUnit: r.areaUnit,
    floor: r.floor,
    furnished: r.furnished,
    features: r.features,
    availableFrom: r.availableFrom,
    preferredTenant: r.preferredTenant,
    city: r.city,
    citySlug: r.citySlug,
    area: r.area,
    areaSlug: r.areaSlug,
    featured: r.featured,
    createdAt: r.createdAt,
    approvedAt: r.approvedAt,
    media: (r.media ?? []).map((m) => ({ url: m.url, type: m.type })),
  };
}

/** Names that must never appear in any public payload. Used by tests and the runtime guard. */
export const PRIVATE_FIELD_NAMES = [
  "fullAddress",
  "streetNo",
  "houseNo",
  "ownerPhone",
  "ownerWhatsapp",
  "ownerEmail",
  "latitude",
  "longitude",
  "adminNotes",
  "rejectionReason",
  "ownerId",
  "passwordHash",
  "private",
] as const;

/* ------------------------------ filters ------------------------------ */

export type SortKey = "newest" | "price_asc" | "price_desc";

export interface ListingFilters {
  citySlug?: string;
  areaSlug?: string; // exact (landing pages)
  areaText?: string; // free text from the search form
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  furnished?: boolean;
  sort: SortKey;
  page: number;
}

function buildWhere(f: Omit<ListingFilters, "sort" | "page">): Prisma.ListingWhereInput {
  return {
    status: "APPROVED",
    ...(f.citySlug ? { citySlug: f.citySlug } : {}),
    ...(f.areaSlug ? { areaSlug: f.areaSlug } : {}),
    ...(f.areaText ? { area: { contains: f.areaText, mode: "insensitive" } } : {}),
    ...(f.type ? { propertyType: f.type } : {}),
    ...(f.minPrice != null || f.maxPrice != null
      ? { rentPerMonth: { ...(f.minPrice != null ? { gte: f.minPrice } : {}), ...(f.maxPrice != null ? { lte: f.maxPrice } : {}) } }
      : {}),
    ...(f.beds != null ? { bedrooms: { gte: f.beds } } : {}),
    ...(f.furnished != null ? { furnished: f.furnished } : {}),
  };
}

const ORDER: Record<SortKey, Prisma.ListingOrderByWithRelationInput[]> = {
  newest: [{ featured: "desc" }, { approvedAt: "desc" }, { createdAt: "desc" }],
  price_asc: [{ rentPerMonth: "asc" }, { createdAt: "desc" }],
  price_desc: [{ rentPerMonth: "desc" }, { createdAt: "desc" }],
};

export async function searchListings(filters: ListingFilters) {
  const where = buildWhere(filters);
  const [rows, total] = await Promise.all([
    db.listing.findMany({
      where,
      orderBy: ORDER[filters.sort],
      skip: (filters.page - 1) * LIMITS.pageSize,
      take: LIMITS.pageSize,
      select: publicListingSelect,
    }),
    db.listing.count({ where }),
  ]);
  return {
    items: rows.map(toPublicListing),
    total,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(total / LIMITS.pageSize)),
  };
}

/** Parses untrusted URL params into safe filters (never throws). */
export function parseFilters(sp: Record<string, string | string[] | undefined>): ListingFilters {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const int = (k: string, max = 1_000_000_000) => {
    const v = one(k);
    if (!v || !/^\d{1,10}$/.test(v)) return undefined;
    const n = Number(v);
    return n <= max ? n : undefined;
  };
  const types = ["FLAT", "HOUSE", "PORTION", "ROOM", "SHOP", "OFFICE", "WAREHOUSE", "PLOT", "OTHER"] as const;
  const type = one("type")?.toUpperCase();
  const sort = one("sort");
  const furnished = one("furnished");
  return {
    citySlug: one("city")?.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60) || undefined,
    areaText: one("area")?.slice(0, 80),
    type: (types as readonly string[]).includes(type ?? "") ? (type as PropertyType) : undefined,
    minPrice: int("minPrice"),
    maxPrice: int("maxPrice"),
    beds: int("beds", 20),
    furnished: furnished === "yes" ? true : furnished === "no" ? false : undefined,
    sort: sort === "price_asc" || sort === "price_desc" ? sort : "newest",
    page: Math.max(1, Math.min(int("page", 10_000) ?? 1, 10_000)),
  };
}

/* ------------------------------ single reads ------------------------------ */

export async function getPublicListingBySlug(slug: string): Promise<PublicListing | null> {
  const row = await db.listing.findFirst({ where: { slug, status: "APPROVED" }, select: publicListingSelect });
  return row ? toPublicListing(row) : null;
}

export async function getSimilarListings(l: PublicListing, take = 4): Promise<PublicListing[]> {
  const rows = await db.listing.findMany({
    where: {
      status: "APPROVED",
      publicId: { not: l.publicId },
      citySlug: l.citySlug,
      OR: [{ areaSlug: l.areaSlug }, { propertyType: l.propertyType }],
    },
    orderBy: [{ approvedAt: "desc" }],
    take,
    select: publicListingSelect,
  });
  return rows.map(toPublicListing);
}

export async function getFeaturedListings(take = 6): Promise<PublicListing[]> {
  const rows = await db.listing.findMany({
    where: { status: "APPROVED", featured: true },
    orderBy: { approvedAt: "desc" },
    take,
    select: publicListingSelect,
  });
  return rows.map(toPublicListing);
}

export async function getLatestListings(take = 8): Promise<PublicListing[]> {
  const rows = await db.listing.findMany({
    where: { status: "APPROVED" },
    orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
    take,
    select: publicListingSelect,
  });
  return rows.map(toPublicListing);
}

/* ------------------------------ facets / SEO ------------------------------ */

export async function getPopularAreas(take = 12) {
  const groups = await db.listing.groupBy({
    by: ["city", "citySlug", "area", "areaSlug"],
    where: { status: "APPROVED" },
    _count: { _all: true },
    orderBy: { _count: { areaSlug: "desc" } },
    take,
  });
  return groups.map((g) => ({ city: g.city, citySlug: g.citySlug, area: g.area, areaSlug: g.areaSlug, count: g._count._all }));
}

export async function getCityCounts() {
  const groups = await db.listing.groupBy({
    by: ["city", "citySlug"],
    where: { status: "APPROVED" },
    _count: { _all: true },
    orderBy: { _count: { citySlug: "desc" } },
  });
  return groups.map((g) => ({ city: g.city, citySlug: g.citySlug, count: g._count._all }));
}

export async function getCityInfo(citySlug: string) {
  const row = await db.listing.findFirst({ where: { citySlug, status: "APPROVED" }, select: { city: true } });
  return row?.city ?? null;
}

export async function getAreaInfo(citySlug: string, areaSlug: string) {
  const row = await db.listing.findFirst({
    where: { citySlug, areaSlug, status: "APPROVED" },
    select: { city: true, area: true },
  });
  return row ?? null;
}

export async function getAreasInCity(citySlug: string, take = 24) {
  const groups = await db.listing.groupBy({
    by: ["area", "areaSlug"],
    where: { status: "APPROVED", citySlug },
    _count: { _all: true },
    orderBy: { _count: { areaSlug: "desc" } },
    take,
  });
  return groups.map((g) => ({ area: g.area, areaSlug: g.areaSlug, count: g._count._all }));
}

export async function getSitemapData() {
  const [listings, areas, cityTypes] = await Promise.all([
    db.listing.findMany({ where: { status: "APPROVED" }, select: { slug: true, updatedAt: true } }),
    db.listing.groupBy({ by: ["citySlug", "areaSlug"], where: { status: "APPROVED" }, _count: { _all: true } }),
    db.listing.groupBy({ by: ["citySlug", "propertyType"], where: { status: "APPROVED" }, _count: { _all: true } }),
  ]);
  return { listings, areas, cityTypes };
}

export async function getPlatformStats() {
  const [listings, cities] = await Promise.all([
    db.listing.count({ where: { status: "APPROVED" } }),
    db.listing.groupBy({ by: ["citySlug"], where: { status: "APPROVED" } }),
  ]);
  return { listings, cities: cities.length };
}
