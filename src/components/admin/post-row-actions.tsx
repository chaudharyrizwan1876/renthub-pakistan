"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePostAction, togglePostAction } from "@/actions/blog";
import { Button } from "@/components/ui/button";

export function PostRowActions({ id, slug, published }: { id: string; slug: string; published: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {published && (
        <Button asChild variant="ghost" size="sm"><Link href={`/blog/${slug}`} target="_blank">View</Link></Button>
      )}
      <Button asChild variant="outline" size="sm"><Link href={`/admin/blog/${id}`}><Pencil className="size-4" aria-hidden="true" />Edit</Link></Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await togglePostAction(id);
            if (r.ok) {
              toast.success(published ? "Moved to drafts" : "Published");
              router.refresh();
            } else toast.error(r.error);
          })
        }
      >
        {published ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        {published ? "Unpublish" : "Publish"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-danger"
        disabled={pending}
        aria-label="Delete article"
        onClick={() => {
          if (!confirm("Delete this article permanently?")) return;
          start(async () => {
            const r = await deletePostAction(id);
            if (r.ok) {
              toast.success("Article deleted");
              router.refresh();
            } else toast.error(r.error);
          });
        }}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
