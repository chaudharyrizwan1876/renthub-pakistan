"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ForbiddenError, requireRole } from "@/lib/authz";
import { saveRobotsSettings } from "@/lib/robots-settings";
import { fail, flattenZod, type ActionResult } from "./result";

const schema = z.object({
  disallow: z.string().max(2000),
  sitemaps: z.string().max(2000),
  blockAll: z.boolean(),
});

const lines = (s: string) => s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

export async function saveRobotsAction(raw: unknown): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const p = schema.safeParse(raw);
    if (!p.success) return fail("Invalid input.", flattenZod(p.error.issues));
    const disallow = lines(p.data.disallow);
    const bad = disallow.find((d) => !/^\/[A-Za-z0-9\-._~!$&'()*+,;=:@%/]*$/.test(d));
    if (bad) return fail("Each blocked path must start with / and contain no spaces.", { disallow: `Invalid path: ${bad}` });
    const sitemaps = lines(p.data.sitemaps);
    const badMap = sitemaps.find((u) => !/^https?:\/\/\S+$/.test(u));
    if (badMap) return fail("Sitemap URLs must start with http:// or https://", { sitemaps: `Invalid URL: ${badMap}` });
    await saveRobotsSettings({ disallow: Array.from(new Set(disallow)), sitemaps: Array.from(new Set(sitemaps)), blockAll: p.data.blockAll });
    revalidatePath("/robots.txt");
    revalidatePath("/admin/seo");
    return { ok: true };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail(e.message);
    return fail("Could not save. Please try again.");
  }
}

export async function refreshSitemapAction(): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    revalidatePath("/sitemap.xml");
    revalidatePath("/robots.txt");
    revalidatePath("/admin/seo");
    return { ok: true };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail(e.message);
    return fail("Could not refresh.");
  }
}
