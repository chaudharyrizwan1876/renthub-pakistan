import fs from "node:fs/promises";
import path from "node:path";
import { storageMode } from "@/lib/storage";

export const runtime = "nodejs";

const TYPES: Record<string, string> = {
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

/**
 * Serves locally stored uploads (development / self-hosted fallback only).
 * `next start` does not serve files added to /public after the build, so this covers that case.
 * Disabled entirely when Cloudinary is configured. Strict filename pattern prevents path traversal.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const m = /^[a-f0-9-]{36}\.(webp|mp4|webm|mov)$/.exec(name);
  if (!m || storageMode() === "cloudinary") return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(process.cwd(), "public", "uploads", name));
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": TYPES[m[1]!]!, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
