import "server-only";
import type { ListingStatus, Prisma, PropertyType } from "@prisma/client";
import { db } from "../db";
import { firstParam } from "../utils";

/** ADMIN-ONLY queries: they return private fields. Call only after requireAdminPage()/requireRole("ADMIN"). */

const DAY = 86_400_000;
const startOfDayPK = (d = new Date()) => {
  // Pakistan is UTC+5 all year (no DST)
  const pk = new Date(d.getTime() + 5 * 3_600_000);
  pk.setUTCHours(0, 0, 0, 0);
  return new Date(pk.getTime() - 5 * 3_600_000);
};

export async function getOverview() {
  const today = startOfDayPK();
  const weekAgo = new Date(today.getTime() - 6 * DAY);
  const fourteen = new Date(today.getTime() - 13 * DAY);
  const sixMonths = new Date();
  sixMonths.setMonth(sixMonths.getMonth() - 5, 1);
  sixMonths.setHours(0, 0, 0, 0);

  const [statusGroups, owners, inqToday, inqWeek, inqTotal, dealsAll, recentInq, dealsRecent, topListings, pendingList] = await Promise.all([
    db.listing.groupBy({ by: ["status"], _count: { _all: true } }),
    db.user.count({ where: { role: "OWNER" } }),
    db.inquiry.count({ where: { createdAt: { gte: today } } }),
    db.inquiry.count({ where: { createdAt: { gte: weekAgo } } }),
    db.inquiry.count(),
    db.deal.groupBy({ by: ["status"], _count: { _all: true }, _sum: { commissionAmount: true } }),
    db.inquiry.findMany({ where: { createdAt: { gte: fourteen } }, select: { createdAt: true } }),
    db.deal.findMany({ where: { createdAt: { gte: sixMonths }, status: { not: "CANCELLED" } }, select: { createdAt: true, commissionAmount: true, status: true } }),
    db.inquiry.groupBy({ by: ["listingId"], _count: { _all: true }, orderBy: { _count: { listingId: "desc" } }, take: 5 }),
    db.listing.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 5, select: { id: true, publicId: true, title: true, city: true, area: true, createdAt: true } }),
  ]);

  const byStatus = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all])) as Partial<Record<ListingStatus, number>>;
  const total = statusGroups.reduce((n, g) => n + g._count._all, 0);

  // Inquiries per day (14d)
  const days = Array.from({ length: 14 }, (_, i) => new Date(today.getTime() - (13 - i) * DAY));
  const perDay = days.map((d) => ({
    label: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Karachi" }).format(d),
    value: recentInq.filter((q) => q.createdAt >= d && q.createdAt < new Date(d.getTime() + DAY)).length,
  }));

  // Commission per month (6m)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: new Intl.DateTimeFormat("en-GB", { month: "short" }).format(d), value: 0 };
  });
  for (const d of dealsRecent) {
    const m = months.find((x) => x.key === `${d.createdAt.getFullYear()}-${d.createdAt.getMonth()}`);
    if (m) m.value += d.commissionAmount;
  }

  const received = dealsAll.find((d) => d.status === "COMMISSION_RECEIVED");
  const pending = dealsAll.find((d) => d.status === "COMMISSION_PENDING");
  const dealCount = dealsAll.filter((d) => d.status !== "CANCELLED").reduce((n, d) => n + d._count._all, 0);

  const topIds = topListings.map((t) => t.listingId);
  const topInfo = await db.listing.findMany({ where: { id: { in: topIds } }, select: { id: true, publicId: true, title: true } });
  const top = topListings.map((t) => ({ ...topInfo.find((i) => i.id === t.listingId)!, count: t._count._all })).filter((t) => t.id);

  return {
    total,
    byStatus,
    owners,
    inquiries: { today: inqToday, week: inqWeek, total: inqTotal },
    deals: { count: dealCount, received: received?._sum.commissionAmount ?? 0, pending: pending?._sum.commissionAmount ?? 0 },
    perDay,
    commissionPerMonth: months,
    top,
    pendingList,
  };
}

export interface AdminListingQuery {
  q?: string;
  status?: ListingStatus;
  city?: string;
  type?: PropertyType;
  from?: Date;
  to?: Date;
  sort: string;
  dir: "asc" | "desc";
  page: number;
}

const STATUSES: ListingStatus[] = ["PENDING", "APPROVED", "REJECTED", "RENTED", "INACTIVE"];
const TYPES: PropertyType[] = ["FLAT", "HOUSE", "PORTION", "ROOM", "SHOP", "OFFICE", "WAREHOUSE", "PLOT", "OTHER"];

export function parseAdminListingQuery(sp: Record<string, string | string[] | undefined>): AdminListingQuery {
  const s = (k: string) => firstParam(sp[k])?.trim() || undefined;
  const date = (k: string) => {
    const v = s(k);
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
    const d = new Date(`${v}T00:00:00+05:00`);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };
  const status = s("status");
  const type = s("type");
  const to = date("to");
  return {
    q: s("q")?.slice(0, 100),
    status: STATUSES.includes(status as ListingStatus) ? (status as ListingStatus) : undefined,
    city: s("city")?.slice(0, 60),
    type: TYPES.includes(type as PropertyType) ? (type as PropertyType) : undefined,
    from: date("from"),
    to: to ? new Date(to.getTime() + DAY) : undefined,
    sort: ["createdAt", "rentPerMonth", "status", "publicId", "city"].includes(s("sort") ?? "") ? (s("sort") as string) : "createdAt",
    dir: s("dir") === "asc" ? "asc" : "desc",
    page: Math.max(1, Number.parseInt(s("page") ?? "1", 10) || 1),
  };
}

export const ADMIN_PAGE_SIZE = 20;

export async function getAdminListings(q: AdminListingQuery) {
  const where: Prisma.ListingWhereInput = {
    ...(q.status ? { status: q.status } : {}),
    ...(q.type ? { propertyType: q.type } : {}),
    ...(q.city ? { city: { equals: q.city, mode: "insensitive" } } : {}),
    ...(q.from || q.to ? { createdAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lt: q.to } : {}) } } : {}),
    ...(q.q
      ? {
          OR: [
            { publicId: { contains: q.q, mode: "insensitive" } },
            { title: { contains: q.q, mode: "insensitive" } },
            { area: { contains: q.q, mode: "insensitive" } },
            { owner: { name: { contains: q.q, mode: "insensitive" } } },
            { private: { fullAddress: { contains: q.q, mode: "insensitive" } } },
            // Phone matching only when the search contains digits (never send an empty/NUL string to Postgres)
            ...(q.q.replace(/[^0-9]/g, "").length >= 3
              ? [{ owner: { phone: { contains: q.q.replace(/[^0-9]/g, "") } } }, { private: { ownerPhone: { contains: q.q.replace(/[^0-9]/g, "") } } }]
              : []),
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.listing.findMany({
      where,
      orderBy: { [q.sort]: q.dir },
      skip: (q.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: { private: true, owner: { select: { name: true, email: true, phone: true, whatsapp: true } }, _count: { select: { inquiries: true } } },
    }),
    db.listing.count({ where }),
  ]);
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getAdminCities() {
  const g = await db.listing.groupBy({ by: ["city"], orderBy: { city: "asc" } });
  return g.map((x) => x.city);
}

export async function getOwnersWithListings(page: number, q?: string) {
  const where: Prisma.UserWhereInput = {
    role: "OWNER",
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true, name: true, email: true, phone: true, whatsapp: true, createdAt: true,
        listings: { orderBy: { createdAt: "desc" }, select: { id: true, publicId: true, title: true, status: true } },
      },
    }),
    db.user.count({ where }),
  ]);
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getInquiryStats() {
  const today = startOfDayPK();
  const weekAgo = new Date(today.getTime() - 6 * DAY);
  const [all, week, dayCount] = await Promise.all([
    db.inquiry.groupBy({ by: ["listingId"], _count: { _all: true }, _max: { createdAt: true } }),
    db.inquiry.groupBy({ by: ["listingId"], where: { createdAt: { gte: weekAgo } }, _count: { _all: true } }),
    db.inquiry.groupBy({ by: ["listingId"], where: { createdAt: { gte: today } }, _count: { _all: true } }),
  ]);
  const listings = await db.listing.findMany({
    where: { id: { in: all.map((a) => a.listingId) } },
    select: { id: true, publicId: true, title: true, city: true, area: true, status: true },
  });
  const rows = all
    .map((a) => ({
      listing: listings.find((l) => l.id === a.listingId)!,
      total: a._count._all,
      week: week.find((w) => w.listingId === a.listingId)?._count._all ?? 0,
      today: dayCount.find((w) => w.listingId === a.listingId)?._count._all ?? 0,
      last: a._max.createdAt,
    }))
    .filter((r) => r.listing)
    .sort((a, b) => b.total - a.total);
  return rows;
}
