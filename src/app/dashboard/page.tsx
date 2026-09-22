import Link from "next/link";
import { CheckCircle2, Clock, Plus } from "lucide-react";
import { OwnerListingActions } from "@/components/dashboard/owner-listing-actions";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { FormAlert } from "@/components/ui/form";
import { EmptyState, StatusBadge } from "@/components/ui/misc";
import { PROPERTY_TYPE_BY_VALUE } from "@/lib/constants";
import { requireOwnerPage } from "@/lib/authz";
import { db } from "@/lib/db";
import { formatDate, formatPKR } from "@/lib/utils";

export const metadata = { title: "My listings" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const user = await requireOwnerPage();
  const { submitted } = await searchParams;
  const listings = await db.listing.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, publicId: true, slug: true, title: true, propertyType: true, rentPerMonth: true, city: true, area: true, status: true,
      rejectionReason: true, createdAt: true, media: { take: 1, orderBy: { order: "asc" }, where: { type: "IMAGE" }, select: { url: true } },
    },
  });
  const counts = { live: listings.filter((l) => l.status === "APPROVED").length, pending: listings.filter((l) => l.status === "PENDING").length };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My listings</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {user.name.split(" ")[0]}.</p>
        </div>
        <Button asChild size="lg"><Link href="/dashboard/listings/new"><Plus className="size-4" aria-hidden="true" />Add listing</Link></Button>
      </div>

      {submitted && (
        <FormAlert tone="success">
          <strong>Listing {submitted} submitted.</strong> Our admin will review it shortly (usually within 24 hours). You will see its status here.
        </FormAlert>
      )}

      <dl className="grid grid-cols-3 gap-3">
        {[
          { k: "Total", v: listings.length, i: null },
          { k: "Live", v: counts.live, i: <CheckCircle2 className="size-4 text-primary" aria-hidden="true" /> },
          { k: "In review", v: counts.pending, i: <Clock className="size-4 text-amber-600" aria-hidden="true" /> },
        ].map((s) => (
          <div key={s.k} className="rounded-xl border border-border bg-card p-4">
            <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">{s.i}{s.k}</dt>
            <dd className="mt-1 text-2xl font-bold">{s.v}</dd>
          </div>
        ))}
      </dl>

      <DataTable
        caption="Your listings"
        rows={listings}
        rowKey={(l) => l.id}
        mobileTitle="title"
        empty={
          <EmptyState title="You have not listed a property yet" action={<Button asChild size="lg"><Link href="/dashboard/listings/new">Add your first listing</Link></Button>}>
            Add photos and details. It only takes a few minutes. Our team reviews it before it goes live.
          </EmptyState>
        }
        columns={[
          {
            key: "title",
            header: "Listing",
            cell: (l) => (
              <div className="flex items-start gap-3 text-start">
                {l.media[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.media[0].url} alt="" className="size-14 shrink-0 rounded-lg object-cover" loading="lazy" />
                ) : (
                  <div className="size-14 shrink-0 rounded-lg bg-muted" />
                )}
                <div className="min-w-0">
                  <p className="line-clamp-2 font-semibold">{l.title}</p>
                  <p className="text-xs text-muted-foreground"><span className="font-mono">{l.publicId}</span> · {l.area}, {l.city}</p>
                </div>
              </div>
            ),
          },
          { key: "type", header: "Type", cell: (l) => PROPERTY_TYPE_BY_VALUE[l.propertyType].label },
          { key: "rent", header: "Rent", cell: (l) => formatPKR(l.rentPerMonth) },
          {
            key: "status",
            header: "Status",
            cell: (l) => (
              <div className="space-y-1">
                <StatusBadge status={l.status} />
                {l.status === "REJECTED" && l.rejectionReason && <p className="max-w-56 text-xs text-danger">{l.rejectionReason}</p>}
                {l.status === "PENDING" && <p className="max-w-48 text-xs text-muted-foreground">Waiting for admin review</p>}
              </div>
            ),
          },
          { key: "date", header: "Added", cell: (l) => formatDate(l.createdAt), hideOnMobile: true },
          { key: "actions", header: "Actions", cell: (l) => <OwnerListingActions id={l.id} slug={l.slug} publicId={l.publicId} status={l.status} />, className: "min-w-64" },
        ]}
      />
    </div>
  );
}
