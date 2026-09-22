import Link from "next/link";
import { Download } from "lucide-react";
import { DealForm, DealRowActions } from "@/components/admin/deal-forms";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, EmptyState } from "@/components/ui/misc";
import { requireAdminPage } from "@/lib/authz";
import { db } from "@/lib/db";
import { formatDate, formatPKR } from "@/lib/utils";

export const metadata = { title: "Deals" };

export default async function DealsPage() {
  await requireAdminPage();
  const [deals, listings] = await Promise.all([
    db.deal.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { listing: { select: { id: true, publicId: true, title: true } } } }),
    db.listing.findMany({ orderBy: { createdAt: "desc" }, take: 300, select: { id: true, publicId: true, title: true } }),
  ]);
  const sum = (s: string) => deals.filter((d) => d.status === s).reduce((n, d) => n + d.commissionAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Deals &amp; commission</h1>
        <Button asChild variant="outline">
          {/* plain anchor: file download, must not be client-routed */}
          <a href="/api/admin/deals/export" download><Download className="size-4" aria-hidden="true" />Export CSV</a>
        </Button>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><dt className="text-sm text-muted-foreground">Commission received</dt><dd className="mt-1 text-2xl font-bold text-primary">{formatPKR(sum("COMMISSION_RECEIVED"))}</dd></Card>
        <Card className="p-4"><dt className="text-sm text-muted-foreground">Commission pending</dt><dd className="mt-1 text-2xl font-bold">{formatPKR(sum("COMMISSION_PENDING"))}</dd></Card>
        <Card className="p-4"><dt className="text-sm text-muted-foreground">Deals in progress</dt><dd className="mt-1 text-2xl font-bold">{deals.filter((d) => d.status === "IN_PROGRESS").length}</dd></Card>
      </dl>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Record a deal</h2>
        <DealForm listings={listings} />
      </Card>

      <DataTable
        caption="All deals"
        rows={deals}
        rowKey={(d) => d.id}
        mobileTitle="listing"
        empty={<EmptyState title="No deals recorded yet">When a tenant and owner are connected, record the deal and your commission here.</EmptyState>}
        columns={[
          { key: "listing", header: "Listing", cell: (d) => <Link href={`/admin/listings/${d.listing.id}`} className="font-mono font-semibold text-primary hover:underline">{d.listing.publicId}</Link> },
          { key: "tenant", header: "Tenant", cell: (d) => <span className="text-start"><span className="block font-medium">{d.tenantName}</span><a href={`tel:${d.tenantPhone}`} className="text-xs text-muted-foreground hover:underline">{d.tenantPhone}</a></span> },
          { key: "commission", header: "Commission", cell: (d) => <span className="font-semibold">{formatPKR(d.commissionAmount)}</span> },
          { key: "notes", header: "Notes", cell: (d) => <span className="block max-w-56 text-start text-xs text-muted-foreground">{d.notes ?? "-"}</span>, hideOnMobile: true },
          { key: "date", header: "Date", cell: (d) => <span className="whitespace-nowrap text-xs">{formatDate(d.createdAt, true)}</span> },
          { key: "status", header: "Status", cell: (d) => <DealRowActions id={d.id} status={d.status} />, className: "min-w-64" },
        ]}
      />
    </div>
  );
}
