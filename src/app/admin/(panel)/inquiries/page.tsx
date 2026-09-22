import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, StatusBadge } from "@/components/ui/misc";
import { getInquiryStats } from "@/lib/admin/queries";
import { requireAdminPage } from "@/lib/authz";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Inquiries" };

export default async function InquiriesPage() {
  await requireAdminPage();
  const rows = await getInquiryStats();
  const total = rows.reduce((n, r) => n + r.total, 0);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Inquiries</h1>
        <p className="text-sm text-muted-foreground">{total} WhatsApp contact clicks across {rows.length} listings</p>
      </div>
      <p className="text-sm text-muted-foreground">Each row counts how many visitors tapped the WhatsApp button on that listing.</p>
      <DataTable
        caption="Contact clicks per listing"
        rows={rows}
        rowKey={(r) => r.listing.id}
        mobileTitle="listing"
        empty={<EmptyState title="No inquiries yet">Clicks on the WhatsApp button will be counted here.</EmptyState>}
        columns={[
          { key: "listing", header: "Listing", cell: (r) => <Link href={`/admin/listings/${r.listing.id}`} className="text-start hover:underline"><span className="font-mono font-semibold text-primary">{r.listing.publicId}</span><span className="block max-w-72 truncate text-xs text-muted-foreground">{r.listing.title}</span></Link> },
          { key: "area", header: "Area", cell: (r) => `${r.listing.area}, ${r.listing.city}` },
          { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.listing.status} /> },
          { key: "today", header: "Today", cell: (r) => r.today },
          { key: "week", header: "7 days", cell: (r) => r.week },
          { key: "total", header: "Total clicks", cell: (r) => <span className="font-bold">{r.total}</span> },
          { key: "last", header: "Last click", cell: (r) => <span className="whitespace-nowrap text-xs">{formatDate(r.last, true)}</span> },
        ]}
      />
    </div>
  );
}
