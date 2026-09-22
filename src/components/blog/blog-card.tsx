import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { readingMinutes } from "@/lib/blog-utils";
import { formatDate } from "@/lib/utils";

export interface BlogCardData {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  category: string;
  authorName: string;
  publishedAt: Date | null;
  content: string;
}

const GRADIENTS = [
  "from-teal-600 to-emerald-400",
  "from-indigo-600 to-sky-400",
  "from-amber-600 to-orange-400",
  "from-rose-600 to-pink-400",
  "from-violet-600 to-fuchsia-400",
];

export function gradientFor(text: string) {
  let h = 0;
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length]!;
}

export function BlogCover({ post, sizes, priority }: { post: Pick<BlogCardData, "coverImage" | "title" | "category">; sizes: string; priority?: boolean }) {
  return post.coverImage ? (
    <Image src={post.coverImage} alt="" fill sizes={sizes} className="object-cover transition-transform duration-500 group-hover:scale-105" {...(priority ? { preload: true } : { loading: "lazy" })} />
  ) : (
    <div className={`flex size-full items-center justify-center bg-gradient-to-br ${gradientFor(post.category + post.title)} text-white`}>
      <BookOpen className="size-12 opacity-90 transition-transform duration-500 group-hover:scale-110" aria-hidden="true" />
    </div>
  );
}

export function BlogCard({ post, priority = false }: { post: BlogCardData; priority?: boolean }) {
  return (
    <article className="group lift flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-muted" tabIndex={-1} aria-hidden="true">
        <BlogCover post={post} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" priority={priority} />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 font-semibold text-foreground">{post.category}</span>
          <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden="true" />{readingMinutes(post.content)} min read</span>
        </p>
        <h2 className="text-lg font-bold leading-snug">
          <Link href={`/blog/${post.slug}`} className="hover:text-primary">{post.title}</Link>
        </h2>
        <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <span className="text-muted-foreground">{formatDate(post.publishedAt)}</span>
          <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-1 font-semibold text-primary" aria-label={`Read: ${post.title}`}>
            Read more <ArrowRight className="rtl-flip size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
