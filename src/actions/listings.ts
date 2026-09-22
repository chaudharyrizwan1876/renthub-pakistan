"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ForbiddenError, requireRole, type SessionUser } from "@/lib/authz";
import { createListingRecord, updateListingRecord } from "@/lib/listings/mutations";
import { rateLimit } from "@/lib/rate-limit";
import { deleteStoredMedia, isTrustedMediaUrl, verifyCloudinaryVideo } from "@/lib/storage";
import { listingSchema, type ListingInput } from "@/lib/validation";
import { fail, flattenZod, type ActionResult } from "./result";

function revalidatePublic() {
  revalidatePath("/", "layout");
}

async function loadOwned(user: SessionUser, id: string) {
  const listing = await db.listing.findUnique({ where: { id }, select: { id: true, ownerId: true, status: true, slug: true } });
  if (!listing) return null;
  if (user.role !== "ADMIN" && listing.ownerId !== user.id) throw new ForbiddenError();
  return listing;
}

type Validated = { data: ListingInput; error?: undefined } | { data?: undefined; error: ReturnType<typeof fail> };

async function validate(raw: unknown): Promise<Validated> {
  const parsed = listingSchema.safeParse(raw);
  if (!parsed.success) return { error: fail("Please fix the highlighted fields.", flattenZod(parsed.error.issues)) };
  for (const m of parsed.data.media) {
    if (!isTrustedMediaUrl(m.url)) return { error: fail("One of the uploaded files is not valid. Please re-upload it.") };
    if (m.type === "VIDEO" && !(await verifyCloudinaryVideo(m.url))) {
      return { error: fail("A video is too large or has an unsupported format (max 60 MB, MP4/WebM/MOV).") };
    }
  }
  return { data: parsed.data };
}

export async function createListingAction(raw: unknown): Promise<ActionResult<{ publicId: string }>> {
  try {
    const user = await requireRole("OWNER", "ADMIN");
    const limit = await rateLimit(`listing:create:${user.id}`, 10, 60 * 60);
    if (!limit.ok) return fail("You are creating listings too quickly. Please try again later.");
    const v = await validate(raw);
    if (v.error) return v.error;
    const created = await createListingRecord(user.id, v.data);
    revalidatePath("/dashboard");
    return { ok: true, publicId: created.publicId };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail(e.message);
    console.error("createListingAction failed", (e as Error).message);
    return fail("Could not save the listing. Please try again.");
  }
}

export async function updateListingAction(id: string, raw: unknown): Promise<ActionResult<{ publicId: string }>> {
  try {
    const user = await requireRole("OWNER", "ADMIN");
    const existing = await loadOwned(user, id);
    if (!existing) return fail("Listing not found.");
    const v = await validate(raw);
    if (v.error) return v.error;
    // Owner edits of live/rejected listings go back to review; admin edits keep the status.
    const resetToPending = user.role === "OWNER" && (existing.status === "APPROVED" || existing.status === "REJECTED");
    const removed = await updateListingRecord(id, v.data, { resetToPending });
    void deleteStoredMedia(removed);
    const fresh = await db.listing.findUnique({ where: { id }, select: { publicId: true } });
    revalidatePublic();
    revalidatePath("/dashboard");
    revalidatePath("/admin/listings");
    return { ok: true, publicId: fresh!.publicId };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail(e.message);
    console.error("updateListingAction failed", (e as Error).message);
    return fail("Could not update the listing. Please try again.");
  }
}

export async function deleteListingAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireRole("OWNER", "ADMIN");
    const existing = await loadOwned(user, id);
    if (!existing) return fail("Listing not found.");
    const media = await db.media.findMany({ where: { listingId: id }, select: { url: true, type: true } });
    await db.listing.delete({ where: { id } });
    void deleteStoredMedia(media);
    revalidatePublic();
    revalidatePath("/dashboard");
    revalidatePath("/admin/listings");
    return { ok: true };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail(e.message);
    return fail("Could not delete the listing.");
  }
}

/** Owner: APPROVED -> RENTED, or RENTED/INACTIVE -> PENDING (re-list for review). */
export async function ownerSetStatusAction(id: string, action: "rented" | "relist"): Promise<ActionResult> {
  try {
    const user = await requireRole("OWNER", "ADMIN");
    const existing = await loadOwned(user, id);
    if (!existing) return fail("Listing not found.");
    if (action === "rented") {
      if (existing.status !== "APPROVED") return fail("Only live listings can be marked as rented.");
      await db.listing.update({ where: { id }, data: { status: "RENTED" } });
    } else {
      if (existing.status !== "RENTED" && existing.status !== "INACTIVE") return fail("This listing cannot be re-listed.");
      await db.listing.update({ where: { id }, data: { status: "PENDING", approvedAt: null } });
    }
    revalidatePublic();
    revalidatePath("/dashboard");
    revalidatePath("/admin/listings");
    return { ok: true };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail(e.message);
    return fail("Could not update the listing.");
  }
}
