"use server";

import { revalidatePath } from "next/cache";
import { ForbiddenError, requireRole } from "@/lib/authz";
import { postSchema } from "@/lib/blog-schema";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { fail, flattenZod, type ActionResult } from "./result";

function refresh(slug?: string) {
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blog");
}

async function uniqueSlug(base: string, ignoreId?: string) {
  let slug = base || "post";
  for (let i = 2; ; i++) {
    const hit = await db.post.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === ignoreId) return slug;
    slug = `${base}-${i}`;
  }
}

async function guard<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    await requireRole("ADMIN");
    return await fn();
  } catch (e) {
    if (e instanceof ForbiddenError) return fail(e.message) as ActionResult<T>;
    console.error("blog action failed", (e as Error).message);
    return fail("Something went wrong. Please try again.") as ActionResult<T>;
  }
}

export async function savePostAction(id: string | null, raw: unknown): Promise<ActionResult<{ id: string }>> {
  return guard(async () => {
    const parsed = postSchema.safeParse(raw);
    if (!parsed.success) return fail("Please fix the highlighted fields.", flattenZod(parsed.error.issues));
    const v = parsed.data;
    const slug = await uniqueSlug(v.slug || slugify(v.title), id ?? undefined);
    const existing = id ? await db.post.findUnique({ where: { id }, select: { published: true, publishedAt: true, slug: true } }) : null;
    const data = {
      slug,
      title: v.title,
      excerpt: v.excerpt,
      content: v.content,
      category: v.category,
      authorName: v.authorName,
      coverImage: v.coverImage || null,
      metaTitle: v.metaTitle || null,
      metaDescription: v.metaDescription || null,
      published: v.published,
      publishedAt: v.published ? (existing?.publishedAt ?? new Date()) : null,
    };
    const saved = id ? await db.post.update({ where: { id }, data }) : await db.post.create({ data });
    refresh(slug);
    if (existing && existing.slug !== slug) revalidatePath(`/blog/${existing.slug}`);
    return { ok: true, id: saved.id };
  });
}

export async function togglePostAction(id: string): Promise<ActionResult> {
  return guard(async () => {
    const p = await db.post.findUnique({ where: { id }, select: { published: true, publishedAt: true, slug: true } });
    if (!p) return fail("Post not found.");
    await db.post.update({ where: { id }, data: { published: !p.published, publishedAt: !p.published ? (p.publishedAt ?? new Date()) : p.publishedAt } });
    refresh(p.slug);
    return { ok: true };
  });
}

export async function deletePostAction(id: string): Promise<ActionResult> {
  return guard(async () => {
    const p = await db.post.delete({ where: { id }, select: { slug: true } });
    refresh(p.slug);
    return { ok: true };
  });
}
