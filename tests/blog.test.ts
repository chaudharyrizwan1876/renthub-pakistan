import { describe, expect, it } from "vitest";
import { renderMarkdown } from "@/lib/blog";
import { postSchema } from "@/lib/blog-schema";
import { SEED_POSTS } from "../prisma/blog-posts";

describe("blog markdown rendering", () => {
  it("renders headings, lists and links", () => {
    const html = renderMarkdown("## Title\n\n- one\n- two\n\n[site](https://example.com)");
    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("strips scripts, event handlers and javascript: links", () => {
    const html = renderMarkdown('Hello <script>alert(1)</script> <img src=x onerror="alert(2)"> [x](javascript:alert(3))');
    expect(html).not.toMatch(/<script|onerror|javascript:/i);
  });
});

describe("blog post schema", () => {
  const ok = {
    title: "A valid article title",
    slug: "a-valid-article",
    excerpt: "A short summary that is comfortably longer than thirty characters.",
    content: "x".repeat(250),
    category: "Guides",
    authorName: "Team",
    coverImage: "",
    metaTitle: "",
    metaDescription: "",
    published: true,
  };
  it("accepts valid input", () => expect(postSchema.safeParse(ok).success).toBe(true));
  it("rejects bad slug, short content and foreign cover URLs", () => {
    expect(postSchema.safeParse({ ...ok, slug: "Bad Slug!" }).success).toBe(false);
    expect(postSchema.safeParse({ ...ok, content: "too short" }).success).toBe(false);
    expect(postSchema.safeParse({ ...ok, coverImage: "https://evil.example/x.jpg" }).success).toBe(false);
  });
});

describe("seed articles", () => {
  it("have unique slugs and no em or en dashes (human-written feel)", () => {
    expect(new Set(SEED_POSTS.map((p) => p.slug)).size).toBe(SEED_POSTS.length);
    for (const p of SEED_POSTS) {
      const text = `${p.title} ${p.excerpt} ${p.content} ${p.metaTitle ?? ""} ${p.metaDescription ?? ""}`;
      expect(text, p.slug).not.toMatch(/[–—]/);
    }
  });
});
