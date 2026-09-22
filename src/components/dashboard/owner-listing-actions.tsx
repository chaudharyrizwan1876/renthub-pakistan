"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, Loader2, Pencil, RotateCcw, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { deleteListingAction, ownerSetStatusAction } from "@/actions/listings";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { ListingStatus } from "@prisma/client";

export function OwnerListingActions({ id, slug, publicId, status }: { id: string; slug: string; publicId: string; status: ListingStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error ?? "Something went wrong");
        return;
      }
      toast.success(okMsg);
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {status === "APPROVED" && (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/listings/${slug}`} target="_blank"><Eye className="size-4" aria-hidden="true" />View</Link>
        </Button>
      )}
      <Button asChild variant="outline" size="sm">
        <Link href={`/dashboard/listings/${id}/edit`}><Pencil className="size-4" aria-hidden="true" />Edit</Link>
      </Button>
      {status === "APPROVED" && (
        <Button variant="secondary" size="sm" disabled={pending} onClick={() => run(() => ownerSetStatusAction(id, "rented"), "Marked as rented")}>
          <CheckCircle2 className="size-4" aria-hidden="true" />Mark rented
        </Button>
      )}
      {(status === "RENTED" || status === "INACTIVE") && (
        <Button variant="secondary" size="sm" disabled={pending} onClick={() => run(() => ownerSetStatusAction(id, "relist"), "Sent for review")}>
          <RotateCcw className="size-4" aria-hidden="true" />Re-list
        </Button>
      )}
      <Button variant="ghost" size="sm" className="text-danger" disabled={pending} onClick={() => setConfirmOpen(true)} aria-label={`Delete listing ${publicId}`}>
        <Trash2 className="size-4" aria-hidden="true" />Delete
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle className="text-lg font-bold">Delete listing {publicId}?</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted-foreground">
            This permanently removes the listing and its photos. This cannot be undone.
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" disabled={pending} onClick={() => run(() => deleteListingAction(id), "Listing deleted")}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
