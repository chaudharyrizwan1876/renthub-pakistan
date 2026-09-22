import "server-only";
import { headers } from "next/headers";

export function ipFromHeaders(h: Headers): string {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function getClientIp(): Promise<string> {
  return ipFromHeaders(await headers());
}

/** Basic CSRF defence for cookie-authenticated JSON/multipart route handlers: Origin must match Host. */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
