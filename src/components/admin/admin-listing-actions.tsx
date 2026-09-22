"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, Check, CheckCircle2, Loader2, Pencil, RotateCcw, Star, X } from "lucide-react";
import { toast } from "sonner";
import { approveListingAction, rejectListingAction, saveAdminNotesAction, setListingStatusAction, toggleFeaturedAction } from "@/actions/admin";
import { deleteListingAction } from "@/actions/listings";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/form";
import type { ListingStatus } from "@prisma/client";

type R = { ok: boolean; error?: string; fieldErrors?: Record<string, string> };

export function AdminListingActions({ id, publicId, status, featured }: { id: string; publicId: string; status: ListingStatus; featured: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  function run(fn: () => Promise<R>, okMsg: string, after?: () => void) {
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        if (res.fieldErrors?.reason) setReasonError(res.fieldErrors.reason);
        toast.error(res.error ?? "Something went wrong");
        return;
      }
      toast.success(okMsg);
      after?.();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "APPROVED" && (
        <Button disabled={pending} onClick={() => run(() => approveListingAction(id), `${publicId} approved`)}>
          <Check className="size-4" aria-hidden="true" />Approve
        </Button>
      )}
      {status !== "REJECTED" && (
        <Button variant="outline" disabled={pending} onClick={() => setRejectOpen(true)}>
          <X className="size-4" aria-hidden="true" />Reject
        </Button>
      )}
      {status === "APPROVED" && (
        <Button variant="secondary" disabled={pending} onClick={() => run(() => setListingStatusAction(id, "RENTED"), "Marked as rented")}>
          <CheckCircle2 className="size-4" aria-hidden="true" />Mark rented
        </Button>
      )}
      {status === "RENTED" && (
        <Button variant="secondary" disabled={pending} onClick={() => run(() => setListingStatusAction(id, "APPROVED"), "Back to live")}>
          <RotateCcw className="size-4" aria-hidden="true" />Re-open
        </Button>
      )}
      {status !== "INACTIVE" && status !== "PENDING" && (
        <Button variant="ghost" disabled={pending} onClick={() => run(() => setListingStatusAction(id, "INACTIVE"), "Deactivated")}>
          <Ban className="size-4" aria-hidden="true" />Deactivate
        </Button>
      )}
      <Button variant="ghost" disabled={pending} onClick={() => run(() => toggleFeaturedAction(id), featured ? "Removed from featured" : "Marked featured")} aria-pressed={featured}>
        <Star className={`size-4 ${featured ? "fill-current text-amber-500" : ""}`} aria-hidden="true" />{featured ? "Featured" : "Feature"}
      </Button>
      <Button asChild variant="outline"><Link href={`/admin/listings/${id}/edit`}><Pencil className="size-4" aria-hidden="true" />Edit</Link></Button>
      <Button variant="ghost" className="text-danger" disabled={pending} onClick={() => setDeleteOpen(true)}>Delete</Button>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogTitle className="text-lg font-bold">Reject {publicId}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">The owner will see this reason on their dashboard.</DialogDescription>
          <label htmlFor="reject-reason" className="mt-4 block text-sm font-medium">Reason</label>
          <Textarea id="reject-reason" value={reason} onChange={(e) => { setReason(e.target.value); setReasonError(null); }} rows={4} maxLength={500} aria-invalid={!!reasonError} className="mt-1.5" placeholder="e.g. Photos are blurry. Please upload clear photos of every room." />
          {reasonError && <p role="alert" className="mt-1 text-xs font-medium text-danger">{reasonError}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" disabled={pending} onClick={() => run(() => rejectListingAction(id, { reason }), `${publicId} rejected`, () => { setRejectOpen(false); setReason(""); })}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}Reject listing
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogTitle className="text-lg font-bold">Delete {publicId}?</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">This permanently deletes the listing, its media, inquiries and deals. This cannot be undone.</DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" disabled={pending} onClick={() => start(async () => {
              const res = await deleteListingAction(id);
              if (!res.ok) return void toast.error(res.error);
              toast.success("Listing deleted");
              router.replace("/admin/listings");
              router.refresh();
            })}>Delete permanently</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AdminNotesForm({ id, initial }: { id: string; initial: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveAdminNotesAction(id, notes);
          if (res.ok) {
            toast.success("Notes saved");
            router.refresh();
          } else toast.error(res.error);
        });
      }}
      className="space-y-2"
    >
      <label htmlFor="admin-notes" className="sr-only">Admin notes</label>
      <Textarea id="admin-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} maxLength={4000} placeholder="Private notes, visible to admins only" />
      <Button type="submit" size="sm" disabled={pending || notes === initial}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}Save notes
      </Button>
    </form>
  );
}
