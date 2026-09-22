import { NextResponse } from "next/server";
import { ForbiddenError, requireRole } from "@/lib/authz";
import { LIMITS } from "@/lib/constants";
import { processBlogImage, processListingImage, sniffImageType, sniffVideoType } from "@/lib/image";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/request";
import { storageMode, storeImage, storeVideoLocal } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Image upload: validates type by magic bytes + size, strips EXIF/GPS, resizes, watermarks, stores.
 * Videos: in production they are uploaded straight to Cloudinary using /api/upload/sign
 * (serverless body limits); in local dev mode they are accepted here.
 */
export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const user = await requireRole("OWNER", "ADMIN");
    const limit = await rateLimit(`upload:${user.id}`, 80, 10 * 60);
    if (!limit.ok) return NextResponse.json({ error: "Too many uploads. Please wait a few minutes." }, { status: 429 });

    if (storageMode() === "none") {
      return NextResponse.json({ error: "Media storage is not configured on the server." }, { status: 503 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });

    const isVideoRequest = form.get("kind") === "video";
    const maxBytes = isVideoRequest ? LIMITS.maxVideoBytes : LIMITS.maxImageBytes;
    if (file.size === 0 || file.size > maxBytes) {
      return NextResponse.json({ error: `File must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB.` }, { status: 413 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());

    if (isVideoRequest) {
      const kind = sniffVideoType(buffer);
      if (!kind) return NextResponse.json({ error: "Unsupported video. Use MP4, WebM or MOV." }, { status: 415 });
      const url = await storeVideoLocal(buffer, kind);
      return NextResponse.json({ url, type: "VIDEO" });
    }

    if (!sniffImageType(buffer)) return NextResponse.json({ error: "Unsupported image. Use JPG, PNG or WebP." }, { status: 415 });
    // Blog covers (admin only) are not watermarked
    const isBlog = form.get("purpose") === "blog";
    if (isBlog && user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const processed = isBlog ? await processBlogImage(buffer) : await processListingImage(buffer);
    const url = await storeImage(processed.buffer);
    return NextResponse.json({ url, type: "IMAGE", width: processed.width, height: processed.height });
  } catch (e) {
    if (e instanceof ForbiddenError) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    console.error("upload failed", (e as Error).message);
    return NextResponse.json({ error: "Upload failed. The file may be corrupted." }, { status: 500 });
  }
}
