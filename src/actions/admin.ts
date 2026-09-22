"use server";

import { revalidatePath } from "next/cache";
import { ForbiddenError, requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { dealSchema, rejectSchema, toLocalPhone } from "@/lib/validation";
import { fail, flattenZod, type ActionResult } from "./result";

function refresh(id?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  if (id) revalidatePath(`/admin/listings/${id}`);
}

async function guard<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    await requireRole("ADMIN");
    return await fn();
  } catch (e) {
    if (e instanceof ForbiddenError) return fail(e.message) as ActionResult<T>;
    console.error("admin action failed", (e as Error).message);
    return fail("Something went wrong. Please try again.") as ActionResult<T>;
  }
}

export async function approveListingAction(id: string): Promise<ActionResult> {
  return guard(async () => {
    await db.listing.update({ where: { id }, data: { status: "APPROVED", approvedAt: new Date(), rejectionReason: null } });
    refresh(id);
    return { ok: true };
  });
}

export async function rejectListingAction(id: string, raw: unknown): Promise<ActionResult> {
  return guard(async () => {
    const parsed = rejectSchema.safeParse(raw);
    if (!parsed.success) return fail("Please give a reason.", flattenZod(parsed.error.issues));
    await db.listing.update({ where: { id }, data: { status: "REJECTED", rejectionReason: parsed.data.reason, approvedAt: null } });
    refresh(id);
    return { ok: true };
  });
}

export async function setListingStatusAction(id: string, status: "RENTED" | "INACTIVE" | "PENDING" | "APPROVED"): Promise<ActionResult> {
  return guard(async () => {
    if (!["RENTED", "INACTIVE", "PENDING", "APPROVED"].includes(status)) return fail("Invalid status.");
    await db.listing.update({
      where: { id },
      data: { status, ...(status === "APPROVED" ? { approvedAt: new Date(), rejectionReason: null } : {}) },
    });
    refresh(id);
    return { ok: true };
  });
}

export async function saveAdminNotesAction(id: string, notes: string): Promise<ActionResult> {
  return guard(async () => {
    await db.listing.update({ where: { id }, data: { adminNotes: notes.trim().slice(0, 4000) || null } });
    refresh(id);
    return { ok: true };
  });
}

export async function toggleFeaturedAction(id: string): Promise<ActionResult> {
  return guard(async () => {
    const l = await db.listing.findUnique({ where: { id }, select: { featured: true } });
    if (!l) return fail("Listing not found.");
    await db.listing.update({ where: { id }, data: { featured: !l.featured } });
    refresh(id);
    return { ok: true };
  });
}

export async function createDealAction(raw: unknown): Promise<ActionResult> {
  return guard(async () => {
    const parsed = dealSchema.safeParse(raw);
    if (!parsed.success) return fail("Please fix the highlighted fields.", flattenZod(parsed.error.issues));
    const v = parsed.data;
    // Accept either the internal id or the human-friendly Listing ID (RH-10245).
    const listing = await db.listing.findFirst({
      where: { OR: [{ id: v.listingId }, { publicId: v.listingId.trim().toUpperCase() }] },
      select: { id: true },
    });
    if (!listing) return fail("Listing not found.", { listingId: "No listing with this ID" });
    await db.deal.create({
      data: {
        listingId: listing.id,
        tenantName: v.tenantName,
        tenantPhone: toLocalPhone(v.tenantPhone)!,
        commissionAmount: Number(v.commissionAmount),
        status: v.status,
        notes: v.notes || null,
      },
    });
    revalidatePath("/admin", "layout");
    return { ok: true };
  });
}

export async function updateDealStatusAction(id: string, status: string): Promise<ActionResult> {
  return guard(async () => {
    if (!["IN_PROGRESS", "COMMISSION_PENDING", "COMMISSION_RECEIVED", "CANCELLED"].includes(status)) return fail("Invalid status.");
    await db.deal.update({ where: { id }, data: { status: status as "IN_PROGRESS" } });
    revalidatePath("/admin", "layout");
    return { ok: true };
  });
}

export async function deleteDealAction(id: string): Promise<ActionResult> {
  return guard(async () => {
    await db.deal.delete({ where: { id } });
    revalidatePath("/admin", "layout");
    return { ok: true };
  });
}
