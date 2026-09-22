import { ForbiddenError, requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { DEAL_STATUS_LABEL } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(v: string | number): string {
  let s = String(v);
  // Neutralise spreadsheet formula injection
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    await requireRole("ADMIN");
  } catch (e) {
    if (e instanceof ForbiddenError) return new Response("Forbidden", { status: 403 });
    throw e;
  }
  const deals = await db.deal.findMany({
    orderBy: { createdAt: "desc" },
    include: { listing: { select: { publicId: true, title: true, city: true, area: true } } },
  });
  const header = ["Date", "Listing ID", "Listing", "City", "Area", "Tenant", "Tenant phone", "Commission (PKR)", "Status", "Notes"];
  const rows = deals.map((d) => [
    d.createdAt.toISOString(),
    d.listing.publicId,
    d.listing.title,
    d.listing.city,
    d.listing.area,
    d.tenantName,
    d.tenantPhone,
    d.commissionAmount,
    DEAL_STATUS_LABEL[d.status],
    d.notes ?? "",
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="deals-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
