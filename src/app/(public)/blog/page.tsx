import Link from "next/link";
import { BlogCard } from "@/components/blog/blog-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Reveal } from "@/components/ui/reveal";
import { EmptyState } from "@/components/ui/misc";
import { BLOG_CATEGORIES, getPublishedPosts } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { cn, firstParam } from "@/lib/utils";

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }) {
  const cat = firstParam((await searchParams).category);
  return buildMetadata({
    title: cat ? `${cat} | Rental Blog` : "Rental Blog: Tips, Guides and Advice for Tenants and Owners",
    description: `Practical guides on renting flats, houses and shops in Pakistan. Agreements, deposits, area guides and tips for owners, from the ${SITE.shortName} team.`,
    path: "/blog",
    noindex: !!cat,
    keywords: ["rent tips Pakistan", "rental agreement Pakistan", "how to rent a flat", "property owner tips", "kiraya makan guide"],
  });
}

export default async function BlogIndex({ searchParams }: { searchParams: SP }) {
  const category = firstParam((await searchParams).category);
  const posts = await getPublishedPosts({ category: BLOG_CATEGORIES.includes(category as never) ? category : undefined });
  const chip = "inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]} />
      <header className="mt-4 max-w-2xl animate-fade-up">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">The renting blog</h1>
        <p className="mt-3 text-muted-foreground">
          Simple, practical advice for tenants and property owners. Learn how to find a good place, understand agreements and deposits, and get your property rented faster.
        </p>
      </header>

      <nav aria-label="Blog categories" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          <li><Link href="/blog" className={cn(chip, !category ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary")}>All</Link></li>
          {BLOG_CATEGORIES.map((c) => (
            <li key={c}>
              <Link href={`/blog?category=${encodeURIComponent(c)}`} className={cn(chip, category === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary")}>{c}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className="mt-8" aria-label="Articles">
        {posts.length === 0 ? (
          <EmptyState title="No articles here yet">New guides are on the way. Please check back soon.</EmptyState>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={(i % 3) * 80}>
                <BlogCard post={p} priority={i < 2} />
              </Reveal>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
