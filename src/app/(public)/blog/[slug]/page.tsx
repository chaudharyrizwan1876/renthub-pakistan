import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Clock, User } from "lucide-react";
import { BlogCard, BlogCover } from "@/components/blog/blog-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { Reveal } from "@/components/ui/reveal";
import { getPostBySlug, getRelatedPosts, readingMinutes, renderMarkdown } from "@/lib/blog";
import { articleJsonLd, buildMetadata, truncate } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { generalWhatsAppUrl } from "@/lib/whatsapp";

export const revalidate = 600;

const getPost = cache(getPostBySlug);

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getPost((await params).slug);
  if (!p) return { title: "Article not found", robots: { index: false } };
  return {
    ...buildMetadata({
      title: p.metaTitle || p.title,
      description: p.metaDescription || truncate(p.excerpt, 158),
      path: `/blog/${p.slug}`,
      image: p.coverImage ?? undefined,
      type: "article",
    }),
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getPost((await params).slug);
  if (!p) notFound();
  const html = renderMarkdown(p.content);
  const related = await getRelatedPosts(p.slug, p.category, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: p.title, path: `/blog/${p.slug}` }]} />
      <article className="mx-auto mt-6 max-w-3xl">
        <header className="animate-fade-up">
          <p className="text-sm font-semibold text-primary">{p.category}</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{p.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{p.excerpt}</p>
          <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><User className="size-4" aria-hidden="true" />{p.authorName}</span>
            <time dateTime={p.publishedAt?.toISOString()}>{formatDate(p.publishedAt)}</time>
            <span className="inline-flex items-center gap-1.5"><Clock className="size-4" aria-hidden="true" />{readingMinutes(p.content)} min read</span>
          </p>
        </header>

        <div className="group relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-muted animate-fade-up [animation-delay:80ms]">
          <BlogCover post={p} sizes="(min-width:768px) 768px, 100vw" priority />
        </div>

        <div className="prose-blog mt-8" dangerouslySetInnerHTML={{ __html: html }} />

        <aside className="mt-10 rounded-2xl border border-border bg-primary-soft/50 p-6" aria-label="Find a rental">
          <h2 className="text-xl font-bold">Looking for a place to rent?</h2>
          <p className="mt-1 text-muted-foreground">Browse reviewed listings with clear photos and prices, or tell us what you need on WhatsApp.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/listings" className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary-hover">Browse rentals</Link>
            <a href={generalWhatsAppUrl(`Assalam o Alaikum, I read your article "${p.title}" and need help finding a rental.`)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg bg-whatsapp px-5 font-semibold text-white hover:bg-whatsapp-hover">Ask on WhatsApp</a>
          </div>
        </aside>
      </article>

      {related.length > 0 && (
        <section className="mt-14" aria-labelledby="more-h">
          <h2 id="more-h" className="mb-5 text-2xl font-bold">More to read</h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r, i) => (
              <Reveal as="li" key={r.slug} delay={i * 80}>
                <BlogCard post={r} />
              </Reveal>
            ))}
          </ul>
        </section>
      )}
      <JsonLd data={articleJsonLd(p)} />
    </div>
  );
}
