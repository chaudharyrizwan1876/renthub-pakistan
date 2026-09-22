import "server-only";
import sharp from "sharp";

/**
 * Watermark drawn from vector paths (no fonts needed, so it renders identically on Vercel/Linux):
 * a small house + "RH" monogram in a translucent badge.
 */
function watermarkSvg(width: number, opacity: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" viewBox="0 0 120 40">
  <rect x="1" y="1" width="118" height="38" rx="9" fill="#000" fill-opacity="${opacity * 0.55}"/>
  <g fill="none" stroke="#fff" stroke-opacity="${Math.min(1, opacity * 1.6)}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 22 L20 12 L30 22 M13 20.5 V30 H27 V20.5"/>
    <path d="M45 30 V11 H54 a5.5 5.5 0 0 1 0 11 H45 M54 22 L60 30"/>
    <path d="M70 11 V30 M70 20.5 H84 M84 11 V30"/>
  </g>
</svg>`;
}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
}

/**
 * - rotate(): applies EXIF orientation so the picture looks right once metadata is gone
 * - sharp drops ALL metadata (EXIF/GPS/IPTC/XMP) unless withMetadata() is called - we never call it
 * - resizes to max 1920px, applies watermark, outputs WebP
 */
export async function processListingImage(input: Buffer): Promise<ProcessedImage> {
  const base = sharp(input, { failOn: "error", limitInputPixels: 60_000_000 }).rotate().resize({
    width: 1920,
    height: 1920,
    fit: "inside",
    withoutEnlargement: true,
  });
  const resized = await base.toBuffer({ resolveWithObject: true });
  const w = resized.info.width;
  const h = resized.info.height;

  const corner = await sharp(Buffer.from(watermarkSvg(Math.max(110, Math.round(w * 0.16)), 0.55))).png().toBuffer();
  const center = await sharp(Buffer.from(watermarkSvg(Math.max(160, Math.round(w * 0.32)), 0.16))).png().toBuffer();

  const out = await sharp(resized.data)
    .composite([
      { input: center, gravity: "centre" },
      { input: corner, gravity: "southeast", top: undefined, left: undefined },
    ])
    .webp({ quality: 82 })
    .toBuffer();

  return { buffer: out, width: w, height: h };
}

/** Verifies the real content type from magic bytes (never trust the client MIME / extension). */
export function sniffImageType(buf: Buffer): "jpeg" | "png" | "webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

export function sniffVideoType(buf: Buffer): "mp4" | "webm" | "mov" | null {
  if (buf.length < 12) return null;
  if (buf.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buf.subarray(8, 12).toString("ascii");
    return brand.startsWith("qt") ? "mov" : "mp4";
  }
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return "webm";
  return null;
}

/** Blog covers: orientation fix + metadata strip + resize, no watermark. */
export async function processBlogImage(input: Buffer): Promise<ProcessedImage> {
  const out = await sharp(input, { failOn: "error", limitInputPixels: 60_000_000 })
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: out.data, width: out.info.width, height: out.info.height };
}
