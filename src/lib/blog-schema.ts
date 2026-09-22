import { z } from "zod";

const IMG = /^(https:\/\/res\.cloudinary\.com\/|\/uploads\/|\/samples\/)/;

export const postSchema = z.object({
  title: z.string().trim().min(8, "Title must be at least 8 characters").max(140),
  slug: z.string().trim().max(120).regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers and hyphens only"),
  excerpt: z.string().trim().min(30, "Write a short summary of at least 30 characters").max(300),
  content: z.string().trim().min(200, "The article needs at least 200 characters").max(60000),
  category: z.string().trim().min(2).max(40),
  authorName: z.string().trim().min(2).max(60),
  coverImage: z.string().trim().refine((v) => v === "" || IMG.test(v), "Invalid cover image"),
  metaTitle: z.string().trim().max(70, "Keep the SEO title under 70 characters"),
  metaDescription: z.string().trim().max(170, "Keep the SEO description under 170 characters"),
  published: z.boolean(),
});
export type PostFormValues = z.input<typeof postSchema>;
