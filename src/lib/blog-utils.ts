/** Client-safe helpers (no database access). */
export function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export const BLOG_CATEGORY_LIST = ["Guides", "Legal tips", "Money", "Areas", "For owners"] as const;
