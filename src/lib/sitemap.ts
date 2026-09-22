import "server-only";
import type { MetadataRoute } from "next";
import { db } from "./db";
import { PROPERTY_TYPE_BY_VALUE } from "./constants";
import { getSitemapData } from "./listings/public";
import { absoluteUrl } from "./site";

export type SitemapKind = "Pages" | "Listings" | "Cities" | "Areas" | "Property types" | "Blog";
export interface SitemapEntry {
  kind: SitemapKind;
  url: string;
  lastModified: Date;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}

/** Single source of truth for the sitemap: used by /sitemap.xml and by the admin SEO page. */
export async function buildSitemapEntries(): Promise<SitemapEntry[]> {
  const now = new Date();
  const e: SitemapEntry[] = [
    { kind: "Pages", url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { kind: "Pages", url: absoluteUrl("/listings"), lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { kind: "Pages", url: absoluteUrl("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...["/about", "/contact", "/privacy-policy", "/terms"].map((p) => ({ kind: "Pages" as const, url: absoluteUrl(p), lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
  try {
    const [{ listings, areas, cityTypes }, posts] = await Promise.all([
      getSitemapData(),
      db.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    ]);
    const cities = new Set<string>();
    for (const a of areas) {
      cities.add(a.citySlug);
      e.push({ kind: "Areas", url: absoluteUrl(`/rent/${a.citySlug}/${a.areaSlug}`), lastModified: now, changeFrequency: "daily", priority: 0.7 });
    }
    for (const t of cityTypes) {
      cities.add(t.citySlug);
      e.push({ kind: "Property types", url: absoluteUrl(`/rent/${t.citySlug}/${PROPERTY_TYPE_BY_VALUE[t.propertyType].slug}`), lastModified: now, changeFrequency: "daily", priority: 0.7 });
    }
    for (const c of cities) e.push({ kind: "Cities", url: absoluteUrl(`/rent/${c}`), lastModified: now, changeFrequency: "daily", priority: 0.8 });
    for (const l of listings) e.push({ kind: "Listings", url: absoluteUrl(`/listings/${l.slug}`), lastModified: l.updatedAt, changeFrequency: "weekly", priority: 0.6 });
    for (const p of posts) e.push({ kind: "Blog", url: absoluteUrl(`/blog/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly", priority: 0.6 });
  } catch {
    /* database unavailable (e.g. during build): static pages only */
  }
  return e;
}
