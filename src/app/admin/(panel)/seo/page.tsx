import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { RefreshSitemapButton, RobotsForm } from "@/components/admin/seo-forms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { requireAdminPage } from "@/lib/authz";
import { DEFAULT_DISALLOW, getRobotsSettings } from "@/lib/robots-settings";
import { buildSitemapEntries, type SitemapKind } from "@/lib/sitemap";
import { SITE } from "@/lib/site";

export const metadata = { title: "SEO: sitemap and robots.txt" };

export default async function AdminSeoPage() {
  await requireAdminPage();
  const [entries, robots] = await Promise.all([buildSitemapEntries(), getRobotsSettings()]);
  const kinds: SitemapKind[] = ["Pages", "Listings", "Cities", "Areas", "Property types", "Blog"];
  const counts = kinds.map((k) => ({ k, n: entries.filter((e) => e.kind === k).length }));
  const preview = [
    "User-Agent: *",
    robots.blockAll ? "Disallow: /" : "Allow: /",
    ...(robots.blockAll ? [] : [...DEFAULT_DISALLOW, ...robots.disallow].map((d) => `Disallow: ${d}`)),
    "",
    `Sitemap: ${SITE.url}/sitemap.xml`,
    ...robots.sitemaps.map((s) => `Sitemap: ${s}`),
  ].join("\n");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">SEO: sitemap and robots.txt</h1>
          <p className="text-sm text-muted-foreground">Both files are generated automatically. New listings and blog posts are added without any work from you.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RefreshSitemapButton />
          <Button asChild variant="outline"><a href="/sitemap.xml" target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" aria-hidden="true" />Open sitemap.xml</a></Button>
          <Button asChild variant="outline"><a href="/robots.txt" target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" aria-hidden="true" />Open robots.txt</a></Button>
        </div>
      </div>

      <Card className="p-5">
        <h2 className="mb-1 font-semibold">Sitemap ({entries.length} URLs)</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          After you go live, submit <code className="rounded bg-muted px-1.5 py-0.5">{SITE.url}/sitemap.xml</code> in Google Search Console and Bing Webmaster Tools.
        </p>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {counts.map((c) => (
            <div key={c.k} className="rounded-lg border border-border p-3">
              <dt className="text-xs text-muted-foreground">{c.k}</dt>
              <dd className="text-xl font-bold">{c.n}</dd>
            </div>
          ))}
        </dl>
        <details className="mt-4 rounded-lg border border-border">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Show all URLs</summary>
          <ul className="max-h-80 divide-y divide-border overflow-auto text-sm">
            {entries.map((e) => (
              <li key={e.url} className="flex items-center justify-between gap-3 px-4 py-2">
                <a href={e.url.replace(SITE.url, "")} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-primary hover:underline">{e.url.replace(SITE.url, "") || "/"}</a>
                <span className="shrink-0 text-xs text-muted-foreground">{e.kind}</span>
              </li>
            ))}
          </ul>
        </details>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">robots.txt settings</h2>
          <RobotsForm initial={{ disallow: robots.disallow.join("\n"), sitemaps: robots.sitemaps.join("\n"), blockAll: robots.blockAll }} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Current robots.txt</h2>
          <pre className="overflow-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">{preview}</pre>
          <p className="mt-3 text-xs text-muted-foreground">
            Blog posts are managed in <Link href="/admin/blog" className="text-primary underline">Admin &gt; Blog</Link>. Each post has its own SEO title and description.
          </p>
        </Card>
      </div>
    </div>
  );
}
