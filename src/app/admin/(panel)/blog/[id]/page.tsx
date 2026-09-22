import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";
import { requireAdminPage } from "@/lib/authz";
import { db } from "@/lib/db";

export const metadata = { title: "Edit article" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const p = await db.post.findUnique({ where: { id: (await params).id } });
  if (!p) notFound();
  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">Edit article</h1>
      <PostForm
        id={p.id}
        defaults={{
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          content: p.content,
          category: p.category,
          authorName: p.authorName,
          coverImage: p.coverImage ?? "",
          metaTitle: p.metaTitle ?? "",
          metaDescription: p.metaDescription ?? "",
          published: p.published,
        }}
      />
    </div>
  );
}
