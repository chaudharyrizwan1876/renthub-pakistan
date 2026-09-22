import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/sitemap";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return (await buildSitemapEntries()).map(({ url, lastModified, changeFrequency, priority }) => ({ url, lastModified, changeFrequency, priority }));
}
