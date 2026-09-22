import Link from "next/link";
import { Plus } from "lucide-react";
import { PostRowActions } from "@/components/admin/post-row-actions";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge, EmptyState } from "@/components/ui/misc";
import { requireAdminPage } from "@/lib/authz";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Blog" };

export default async function AdminBlogPage() {
  await requireAdminPage();
  const posts = await db.post.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, slug: true, title: true, category: true, published: true, publishedAt: true, updatedAt: true } });
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-sm text-muted-foreground">{posts.filter((p) => p.published).length} published, {posts.filter((p) => !p.published).length} drafts</p>
        </div>
        <Button asChild size="lg"><Link href="/admin/blog/new"><Plus className="size-4" aria-hidden="true" />New article</Link></Button>
      </div>
      <DataTable
        caption="Blog articles"
        rows={posts}
        rowKey={(p) => p.id}
        mobileTitle="title"
        empty={<EmptyState title="No articles yet" action={<Button asChild><Link href="/admin/blog/new">Write the first article</Link></Button>}>Helpful guides bring free visitors from Google.</EmptyState>}
        columns={[
          { key: "title", header: "Title", cell: (p) => <span className="block max-w-md text-start font-semibold">{p.title}<span className="block font-mono text-xs font-normal text-muted-foreground">/blog/{p.slug}</span></span> },
          { key: "cat", header: "Category", cell: (p) => p.category },
          { key: "status", header: "Status", cell: (p) => (p.published ? <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200">Published</Badge> : <Badge>Draft</Badge>) },
          { key: "date", header: "Date", cell: (p) => <span className="whitespace-nowrap text-xs">{formatDate(p.publishedAt ?? p.updatedAt)}</span> },
          { key: "actions", header: "Actions", className: "min-w-72", cell: (p) => <PostRowActions id={p.id} slug={p.slug} published={p.published} /> },
        ]}
      />
    </div>
  );
}
