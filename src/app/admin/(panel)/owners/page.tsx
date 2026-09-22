import Link from "next/link";
import { Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/listing/whatsapp-button";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/form";
import { EmptyState, StatusBadge } from "@/components/ui/misc";
import { getOwnersWithListings } from "@/lib/admin/queries";
import { requireAdminPage } from "@/lib/authz";
import { firstParam, formatDate } from "@/lib/utils";
import { whatsappLinkTo } from "@/lib/whatsapp";

export const metadata = { title: "Owners" };

export default async function OwnersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const q = firstParam(sp.q)?.trim().slice(0, 80);
  const page = Math.max(1, Number.parseInt(firstParam(sp.page) ?? "1", 10) || 1);
  const { rows, total, pageCount } = await getOwnersWithListings(page, q);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Owners</h1>
        <p className="text-sm text-muted-foreground">{total} registered</p>
      </div>
      <form method="get" role="search" className="flex max-w-lg gap-2">
        <label htmlFor="oq" className="sr-only">Search owners</label>
        <Input id="oq" name="q" defaultValue={q} placeholder="Name, email or phone" />
        <Button type="submit">Search</Button>
      </form>

      <DataTable
        caption="Registered owners and their listings"
        rows={rows}
        rowKey={(o) => o.id}
        mobileTitle="name"
        empty={<EmptyState title="No owners found" />}
        columns={[
          { key: "name", header: "Owner", cell: (o) => <span className="font-semibold">{o.name}</span> },
          { key: "phone", header: "Phone", cell: (o) => <a href={`tel:${o.phone}`} className="inline-flex items-center gap-1 whitespace-nowrap hover:underline"><Phone className="size-3.5" aria-hidden="true" />{o.phone}</a> },
          { key: "wa", header: "WhatsApp", cell: (o) => o.whatsapp ? <a href={whatsappLinkTo(o.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 whitespace-nowrap text-whatsapp hover:underline"><WhatsAppIcon className="size-3.5" />{o.whatsapp}</a> : "-" },
          { key: "email", header: "Email", cell: (o) => <span className="break-all text-xs">{o.email}</span> },
          { key: "joined", header: "Joined", cell: (o) => <span className="whitespace-nowrap text-xs">{formatDate(o.createdAt)}</span> },
          {
            key: "listings",
            header: "Listings",
            className: "min-w-64",
            cell: (o) =>
              o.listings.length === 0 ? (
                <span className="text-muted-foreground">None</span>
              ) : (
                <ul className="space-y-1.5 text-start">
                  {o.listings.map((l) => (
                    <li key={l.id} className="flex items-center gap-2 text-xs">
                      <Link href={`/admin/listings/${l.id}`} className="font-mono font-semibold text-primary hover:underline">{l.publicId}</Link>
                      <StatusBadge status={l.status} />
                    </li>
                  ))}
                </ul>
              ),
          },
        ]}
      />
      <Pagination page={page} pageCount={pageCount} hrefFor={(p) => `/admin/owners?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`} />
    </div>
  );
}
