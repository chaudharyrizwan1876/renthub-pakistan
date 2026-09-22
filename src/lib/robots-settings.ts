import "server-only";
import { db } from "./db";

export interface RobotsSettings {
  /** Extra paths to block, e.g. /private */
  disallow: string[];
  /** Extra sitemap URLs to advertise */
  sitemaps: string[];
  /** Blocks the whole site (use for staging only) */
  blockAll: boolean;
}

export const DEFAULT_DISALLOW = ["/admin", "/dashboard", "/api", "/login", "/signup", "/forgot-password", "/reset-password"];
const KEY = "robots";
const EMPTY: RobotsSettings = { disallow: [], sitemaps: [], blockAll: false };

export async function getRobotsSettings(): Promise<RobotsSettings> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: KEY } });
    if (!row) return EMPTY;
    const v = JSON.parse(row.value) as Partial<RobotsSettings>;
    return {
      disallow: Array.isArray(v.disallow) ? v.disallow.filter((x) => typeof x === "string") : [],
      sitemaps: Array.isArray(v.sitemaps) ? v.sitemaps.filter((x) => typeof x === "string") : [],
      blockAll: !!v.blockAll,
    };
  } catch {
    return EMPTY;
  }
}

export async function saveRobotsSettings(s: RobotsSettings) {
  await db.siteSetting.upsert({ where: { key: KEY }, update: { value: JSON.stringify(s) }, create: { key: KEY, value: JSON.stringify(s) } });
}
