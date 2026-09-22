import "server-only";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { LIMITS } from "./constants";

const FOLDER = "renthub/listings";

export type StorageMode = "cloudinary" | "local" | "none";

export function storageMode(): StorageMode {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) return "cloudinary";
  if (process.env.NODE_ENV !== "production") return "local"; // dev fallback: public/uploads
  return "none";
}

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function storeImage(buffer: Buffer): Promise<string> {
  const mode = storageMode();
  if (mode === "cloudinary") {
    configure();
    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: FOLDER, resource_type: "image", format: "webp", overwrite: false },
        (err, res) => (err || !res ? reject(err ?? new Error("Upload failed")) : resolve(res.secure_url)),
      );
      stream.end(buffer);
    });
  }
  if (mode === "local") return writeLocal(buffer, "webp");
  throw new Error("Media storage is not configured (set CLOUDINARY_* env vars).");
}

/** Local (development-only) video storage. In production videos go straight to Cloudinary with a signed request. */
export async function storeVideoLocal(buffer: Buffer, ext: string): Promise<string> {
  if (storageMode() !== "local") throw new Error("Direct video upload is only available in local mode.");
  return writeLocal(buffer, ext);
}

async function writeLocal(buffer: Buffer, ext: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(dir, name), buffer);
  return `/uploads/${name}`;
}

/** Signed parameters so the browser can upload a video straight to Cloudinary (bypasses serverless body limits). */
export function signVideoUpload() {
  configure();
  const timestamp = Math.round(Date.now() / 1000);
  const params = { folder: `${FOLDER}/video`, timestamp, allowed_formats: "mp4,webm,mov" };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET as string);
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    ...params,
    signature,
  };
}

/** Is this URL one we could have produced? Blocks arbitrary external URLs being attached to listings. */
export function isTrustedMediaUrl(url: string): boolean {
  if (url.startsWith("/uploads/") || url.startsWith("/samples/")) return storageMode() !== "cloudinary" || url.startsWith("/samples/");
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  return !!cloud && url.startsWith(`https://res.cloudinary.com/${cloud}/`);
}

function publicIdFromUrl(url: string): string | null {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
  return m ? m[1]! : null;
}

/** Checks a Cloudinary video after upload: size + format. Deletes it if it violates limits. */
export async function verifyCloudinaryVideo(url: string): Promise<boolean> {
  if (storageMode() !== "cloudinary" || !url.startsWith("https://")) return true;
  const id = publicIdFromUrl(url);
  if (!id) return false;
  configure();
  try {
    const res = await cloudinary.api.resource(id, { resource_type: "video" });
    if (res.bytes > LIMITS.maxVideoBytes) {
      await cloudinary.uploader.destroy(id, { resource_type: "video" });
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Best-effort cleanup; never throws. */
export async function deleteStoredMedia(items: { url: string; type: "IMAGE" | "VIDEO" }[]): Promise<void> {
  await Promise.allSettled(
    items.map(async ({ url, type }) => {
      if (url.startsWith("/uploads/")) {
        await fs.unlink(path.join(process.cwd(), "public", url));
        return;
      }
      if (storageMode() !== "cloudinary") return;
      const id = publicIdFromUrl(url);
      if (!id) return;
      configure();
      await cloudinary.uploader.destroy(id, { resource_type: type === "VIDEO" ? "video" : "image" });
    }),
  );
}
