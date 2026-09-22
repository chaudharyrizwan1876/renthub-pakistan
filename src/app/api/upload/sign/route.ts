import { NextResponse } from "next/server";
import { ForbiddenError, requireRole } from "@/lib/authz";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/request";
import { signVideoUpload, storageMode } from "@/lib/storage";

export const runtime = "nodejs";

/** Returns short-lived signed params for a direct browser -> Cloudinary video upload. */
export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const user = await requireRole("OWNER", "ADMIN");
    const limit = await rateLimit(`upload-sign:${user.id}`, 10, 10 * 60);
    if (!limit.ok) return NextResponse.json({ error: "Too many uploads." }, { status: 429 });
    if (storageMode() !== "cloudinary") return NextResponse.json({ direct: false });
    return NextResponse.json({ direct: true, ...signVideoUpload() });
  } catch (e) {
    if (e instanceof ForbiddenError) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    return NextResponse.json({ error: "Could not prepare upload." }, { status: 500 });
  }
}
