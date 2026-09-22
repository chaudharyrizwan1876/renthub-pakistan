import type { MetadataRoute } from "next";
import { DEFAULT_DISALLOW, getRobotsSettings } from "@/lib/robots-settings";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

/** Base rules plus whatever the admin added under Admin > SEO. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const s = await getRobotsSettings();
  const sitemaps = [absoluteUrl("/sitemap.xml"), ...s.sitemaps];
  if (s.blockAll) return { rules: [{ userAgent: "*", disallow: "/" }], sitemap: sitemaps };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...DEFAULT_DISALLOW, ...s.disallow] }],
    sitemap: sitemaps,
    host: absoluteUrl("/"),
  };
}
