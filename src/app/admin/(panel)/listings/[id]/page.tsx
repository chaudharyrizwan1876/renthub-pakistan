import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Lock, MapPin, Phone } from "lucide-react";
import { AdminListingActions, AdminNotesForm } from "@/components/admin/admin-listing-actions";
import { WhatsAppIcon } from "@/components/listing/whatsapp-button";
import { Button } from "@/components/ui/button";
import { Badge, Card, StatusBadge } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/authz";
import { AREA_UNIT_LABEL, DEAL_STATUS_LABEL, FEATURE_LABEL, PREFERRED_TENANTS, PROPERTY_TYPE_BY_VALUE } from "@/lib/constants";
import { getFullListing } from "@/lib/listings/private";
import { formatDate, formatPKR } from "@/lib/utils";
import { whatsappLinkTo } from "@/lib/whatsapp";

export const metadata = { title: "Listing detail" };

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-end font-medium">{v || "-"}</dd>
    </div>
  );
}

export default async function AdminListingDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const l = await getFullListing(id);
  if (!l) notFound();
  const deals = await db.deal.findMany({ where: { listingId: l.id }, orderBy: { createdAt: "desc" } });
  const p = l.private;
  const ownerPhone = p?.ownerPhone ?? l.owner.phone;
  const ownerWa = p?.ownerWhatsapp ?? l.owner.whatsapp ?? ownerPhone;
  const waMsg = `Assalam o Alaikum ${l.owner.name}, regarding your property listing ${l.publicId} (${l.title}).`;
  const tenant = PREFERRED_TENANTS.find((t) => t.value === l.preferredTenant)?.label;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm"><Link href="/admin/listings" className="text-muted-foreground hover:underline">← Listings</Link></p>
          <h1 className="mt-1 text-2xl font-bold">
            <span className="font-mono text-primary">{l.publicId}</span> · {l.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={l.status} />
            {l.featured && <Badge className="bg-amber-100 text-amber-900">Featured</Badge>}
            <span className="text-sm text-muted-foreground">Listed {formatDate(l.createdAt, true)} · {l._count.inquiries} WhatsApp clicks</span>
          </div>
          {l.status === "REJECTED" && l.rejectionReason && <p className="mt-2 text-sm text-danger">Rejected: {l.rejectionReason}</p>}
        </div>
        {l.status === "APPROVED" && (
          <Button asChild variant="outline"><Link href={`/listings/${l.slug}`} target="_blank"><ExternalLink className="size-4" aria-hidden="true" />View public page</Link></Button>
        )}
      </div>

      <Card className="p-4"><AdminListingActions id={l.id} publicId={l.publicId} status={l.status} featured={l.featured} /></Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Media ({l.media.length})</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {l.media.map((m) => (
                <li key={m.id} className="overflow-hidden rounded-lg border border-border bg-muted">
                  {m.type === "IMAGE" ? (
                    <div className="relative aspect-[4/3]"><Image src={m.url} alt={`${l.publicId} photo`} fill sizes="(min-width:640px) 200px, 45vw" className="object-cover" /></div>
                  ) : (
                    <video src={m.url} controls preload="metadata" className="aspect-[4/3] w-full bg-black" />
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="mb-2 font-semibold">Public details</h2>
            <dl>
              <Row k="Type" v={PROPERTY_TYPE_BY_VALUE[l.propertyType].label} />
              <Row k="Rent / month" v={formatPKR(l.rentPerMonth)} />
              <Row k="Security deposit" v={l.securityDeposit != null ? formatPKR(l.securityDeposit) : null} />
              <Row k="Bedrooms / baths" v={l.bedrooms != null || l.bathrooms != null ? `${l.bedrooms ?? "-"} / ${l.bathrooms ?? "-"}` : null} />
              <Row k="Area size" v={l.areaSize != null && l.areaUnit ? `${l.areaSize} ${AREA_UNIT_LABEL[l.areaUnit]}` : null} />
              <Row k="Floor" v={l.floor} />
              <Row k="Furnished" v={l.furnished ? "Yes" : "No"} />
              <Row k="Preferred tenant" v={tenant} />
              <Row k="Available from" v={l.availableFrom ? formatDate(l.availableFrom) : null} />
              <Row k="Public location" v={`${l.area}, ${l.city}`} />
            </dl>
            {l.features.length > 0 && (
              <p className="mt-3 flex flex-wrap gap-1.5">{l.features.map((f) => <Badge key={f}>{FEATURE_LABEL[f] ?? f}</Badge>)}</p>
            )}
            <h3 className="mb-1 mt-4 text-sm font-semibold">Description</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed">{l.description}</p>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Deals for this listing</h2>
            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deals recorded. <Link href="/admin/deals" className="text-primary underline">Record a deal</Link></p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {deals.map((d) => (
                  <li key={d.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <span>{d.tenantName} · {d.tenantPhone}</span>
                    <span className="font-medium">{formatPKR(d.commissionAmount)} · {DEAL_STATUS_LABEL[d.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="border-amber-300/70 p-5 dark:border-amber-700/70">
            <h2 className="mb-1 flex items-center gap-2 font-semibold"><Lock className="size-4" aria-hidden="true" />Private: owner &amp; address</h2>
            <p className="mb-3 text-xs text-muted-foreground">Never shown publicly.</p>
            <dl>
              <Row k="Full address" v={<span className="block max-w-56 whitespace-pre-line">{p?.fullAddress}</span>} />
              <Row k="House no." v={p?.houseNo} />
              <Row k="Street no." v={p?.streetNo} />
              <Row k="Coordinates" v={p?.latitude != null && p?.longitude != null ? (
                <a className="text-primary underline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}><MapPin className="me-1 inline size-3.5" aria-hidden="true" />Open map</a>
              ) : null} />
              <Row k="Owner" v={l.owner.name} />
              <Row k="Owner phone" v={ownerPhone} />
              <Row k="Owner WhatsApp" v={ownerWa} />
              <Row k="Owner email" v={<span className="break-all">{p?.ownerEmail ?? l.owner.email}</span>} />
              <Row k="Account email" v={<span className="break-all">{l.owner.email}</span>} />
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button asChild variant="default"><a href={`tel:${ownerPhone}`}><Phone className="size-4" aria-hidden="true" />Call owner</a></Button>
              <Button asChild variant="whatsapp"><a href={whatsappLinkTo(ownerWa, waMsg)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="size-4" />WhatsApp</a></Button>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Admin notes</h2>
            <AdminNotesForm id={l.id} initial={l.adminNotes ?? ""} />
          </Card>
        </div>
      </div>
    </div>
  );
}
