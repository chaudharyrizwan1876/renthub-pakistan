import "server-only";
import type { Prisma, PropertyType } from "@prisma/client";
import { db } from "../db";
import { publicListingSelect, toPublicListing } from "./public";

export async function getSegment(where: Prisma.ListingWhereInput, take = 24) {
  const w: Prisma.ListingWhereInput = { ...where, status: "APPROVED" };
  const [rows, agg] = await Promise.all([
    db.listing.findMany({ where: w, orderBy: [{ featured: "desc" }, { approvedAt: "desc" }], take, select: publicListingSelect }),
    db.listing.aggregate({ where: w, _count: { _all: true }, _min: { rentPerMonth: true }, _max: { rentPerMonth: true }, _avg: { rentPerMonth: true } }),
  ]);
  return {
    items: rows.map(toPublicListing),
    total: agg._count._all,
    min: agg._min.rentPerMonth,
    max: agg._max.rentPerMonth,
    avg: agg._avg.rentPerMonth ? Math.round(agg._avg.rentPerMonth) : null,
  };
}

export async function getTypesInCity(citySlug: string): Promise<{ type: PropertyType; count: number }[]> {
  const g = await db.listing.groupBy({ by: ["propertyType"], where: { status: "APPROVED", citySlug }, _count: { _all: true } });
  return g.map((x) => ({ type: x.propertyType, count: x._count._all })).sort((a, b) => b.count - a.count);
}

export async function getTypesInArea(citySlug: string, areaSlug: string): Promise<{ type: PropertyType; count: number }[]> {
  const g = await db.listing.groupBy({ by: ["propertyType"], where: { status: "APPROVED", citySlug, areaSlug }, _count: { _all: true } });
  return g.map((x) => ({ type: x.propertyType, count: x._count._all })).sort((a, b) => b.count - a.count);
}
