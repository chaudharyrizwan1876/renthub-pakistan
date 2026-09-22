import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { ipFromHeaders, isSameOrigin } from "@/lib/request";
import { inquirySchema } from "@/lib/validation";

export const runtime = "nodejs";

/** Logs a WhatsApp-contact click. Public, lightweight, rate limited, same-origin only. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 });
  const ip = ipFromHeaders(req.headers);
  const limit = await rateLimit(`inquiry:${ip}`, 40, 10 * 60);
  if (!limit.ok) return NextResponse.json({ ok: false }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const listing = await db.listing.findFirst({ where: { publicId: parsed.data.publicId, status: "APPROVED" }, select: { id: true } });
  if (!listing) return NextResponse.json({ ok: false }, { status: 404 });
  await db.inquiry.create({ data: { listingId: listing.id, source: parsed.data.source } });
  return NextResponse.json({ ok: true });
}
