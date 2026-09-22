import Link from "next/link";
import { Phone } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input, Label, Select } from "@/components/ui/form";
import { EmptyState, StatusBadge } from "@/components/ui/misc";
import { WhatsAppIcon } from "@/components/listing/whatsapp-button";
import { ADMIN_PAGE_SIZE, getAdminCities, getAdminListings, parseAdminListingQuery } from "@/lib/admin/queries";
import { requireAdminPage } from "@/lib/authz";
import { PROPERTY_TYPES, PROPERTY_TYPE_BY_VALUE, STATUS_META } from "@/lib/constants";
import { formatDate, formatPKR } from "@/lib/utils";
import { whatsappLinkTo } from "@/lib/whatsapp";

export const metadata = { title: "Listings" };

export default async function AdminListingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const q = parseAdminListingQuery(sp);
  const [{ rows, total, pageCount }, cities] = await Promise.all([getAdminListings(q), getAdminCities()]);

  const base = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val && k !== "page") base.set(k, val);
  }
  const hrefWith = (over: Record<string, string>) => {
    const p = new URLSearchParams(base);
    for (const [k, v] of Object.entries(over)) p.set(k, v);
    return `/admin/listings?${p.toString()}`;
  };

  const raw = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) ?? "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Listings</h1>
        <p className="text-sm text-muted-foreground">{total} total · showing {Math.min(ADMIN_PAGE_SIZE, rows.length)} per page</p>
      </div>

      <form method="get" action="/admin/listings" className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8" role="search" aria-label="Filter listings">
        <div className="sm:col-span-2">
          <Label htmlFor="q">Search</Label>
          <Input id="q" name="q" defaultValue={raw("q")} placeholder="ID, title, owner, phone, address" />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={raw("status")}>
            <option value="">All</option>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Select id="city" name="city" defaultValue={raw("city")}>
            <option value="">All</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select id="type" name="type" defaultValue={raw("type")}>
            <option value="">All</option>
            {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.plural}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="from">From date</Label>
          <Input id="from" name="from" type="date" defaultValue={raw("from")} />
        </div>
        <div>
          <Label htmlFor="to">To date</Label>
          <Input id="to" name="to" type="date" defaultValue={raw("to")} />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" className="flex-1">Apply</Button>
          <Button asChild variant="outline"><Link href="/admin/listings">Reset</Link></Button>
        </div>
      </form>

      <DataTable
        caption="Listings with private owner details"
        rows={rows}
        rowKey={(l) => l.id}
        mobileTitle="id"
        sort={{ key: q.sort, dir: q.dir }}
        sortHref={(key, dir) => hrefWith({ sort: key, dir })}
        empty={<EmptyState title="No listings match these filters"><Link href="/admin/listings" className="text-primary underline">Clear filters</Link></EmptyState>}
        columns={[
          {
            key: "id",
            header: "Listing ID",
            sortKey: "publicId",
            cell: (l) => (
              <Link href={`/admin/listings/${l.id}`} className="font-mono font-semibold text-primary hover:underline">{l.publicId}</Link>
            ),
          },
          {
            key: "title",
            header: "Title",
            cell: (l) => (
              <div className="max-w-56 text-start">
                <p className="line-clamp-2 font-medium">{l.title}</p>
                <p className="text-xs text-muted-foreground">{PROPERTY_TYPE_BY_VALUE[l.propertyType].label} · {formatPKR(l.rentPerMonth)}</p>
              </div>
            ),
          },
          { key: "area", header: "Area", sortKey: "city", cell: (l) => `${l.area}, ${l.city}` },
          {
            key: "address",
            header: "Address (private)",
            cell: (l) => <span className="block max-w-56 text-start text-xs">{l.private?.fullAddress ?? "-"}</span>,
          },
          { key: "owner", header: "Owner", cell: (l) => l.owner.name },
          {
            key: "phone",
            header: "Owner phone",
            cell: (l) => (
              <a href={`tel:${l.private?.ownerPhone ?? l.owner.phone}`} className="inline-flex items-center gap-1 whitespace-nowrap font-medium hover:underline">
                <Phone className="size-3.5" aria-hidden="true" />{l.private?.ownerPhone ?? l.owner.phone}
              </a>
            ),
          },
          {
            key: "wa",
            header: "Owner WhatsApp",
            cell: (l) => {
              const n = l.private?.ownerWhatsapp ?? l.owner.whatsapp;
              return n ? (
                <a href={whatsappLinkTo(n)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-whatsapp hover:underline">
                  <WhatsAppIcon className="size-3.5" />{n}
                </a>
              ) : "-";
            },
          },
          { key: "email", header: "Owner email", cell: (l) => <span className="break-all text-xs">{l.private?.ownerEmail ?? l.owner.email}</span> },
          { key: "date", header: "Listed", sortKey: "createdAt", cell: (l) => <span className="whitespace-nowrap text-xs">{formatDate(l.createdAt, true)}</span> },
          { key: "inq", header: "Clicks", cell: (l) => l._count.inquiries },
          { key: "status", header: "Status", sortKey: "status", cell: (l) => <StatusBadge status={l.status} /> },
        ]}
      />

      <Pagination page={q.page} pageCount={pageCount} hrefFor={(p) => hrefWith({ page: String(p) })} />
    </div>
  );
}
