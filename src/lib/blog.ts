import "server-only";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { db } from "./db";

import { BLOG_CATEGORY_LIST } from "./blog-utils";

export const BLOG_CATEGORIES = BLOG_CATEGORY_LIST;

const publicSelect = {
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  category: true,
  authorName: true,
  publishedAt: true,
  updatedAt: true,
  content: true,
  metaTitle: true,
  metaDescription: true,
} as const;

export type BlogPost = NonNullable<Awaited<ReturnType<typeof getPostBySlug>>>;

export async function getPublishedPosts(opts: { category?: string; take?: number } = {}) {
  return db.post.findMany({
    where: { published: true, ...(opts.category ? { category: opts.category } : {}) },
    orderBy: { publishedAt: "desc" },
    take: opts.take,
    select: { slug: true, title: true, excerpt: true, coverImage: true, category: true, authorName: true, publishedAt: true, content: true },
  });
}

export async function getPostBySlug(slug: string) {
  return db.post.findFirst({ where: { slug, published: true }, select: publicSelect });
}

export async function getRelatedPosts(slug: string, category: string, take = 3) {
  const rows = await db.post.findMany({
    where: { published: true, slug: { not: slug } },
    orderBy: { publishedAt: "desc" },
    take: 12,
    select: { slug: true, title: true, excerpt: true, coverImage: true, category: true, authorName: true, publishedAt: true, content: true },
  });
  return [...rows.filter((r) => r.category === category), ...rows.filter((r) => r.category !== category)].slice(0, take);
}

export { readingMinutes } from "./blog-utils";

/** Markdown -> sanitised HTML (admin-authored, but still sanitised so nothing can inject scripts). */
export function renderMarkdown(markdown: string): string {
  const raw = marked.parse(markdown, { async: false, gfm: true }) as string;
  return sanitizeHtml(raw, {
    allowedTags: ["h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "a", "blockquote", "img", "code", "pre", "hr", "br", "table", "thead", "tbody", "tr", "th", "td"],
    allowedAttributes: { a: ["href", "title", "rel", "target"], img: ["src", "alt", "title"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (tag, attribs) => ({
        tagName: "a",
        attribs: { ...attribs, ...(attribs.href?.startsWith("http") ? { rel: "noopener noreferrer", target: "_blank" } : {}) },
      }),
    },
  });
}
