import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Check, MapPin } from "lucide-react";
import { T } from "@/components/i18n/lang-provider";
import { Gallery } from "@/components/listing/gallery";
import { ListingGrid } from "@/components/listing/listing-card";
import { WhatsAppButton } from "@/components/listing/whatsapp-button";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/misc";
import { AREA_UNIT_LABEL, FEATURE_LABEL, PREFERRED_TENANTS, PROPERTY_TYPE_BY_VALUE } from "@/lib/constants";
import { getPublicListingBySlug, getSimilarListings } from "@/lib/listings/public";
import { buildMetadata, listingJsonLd, truncate } from "@/lib/seo";
import { formatDate, formatPKR } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const revalidate = 300;

const getListing = cache(getPublicListingBySlug);

export async function generateStaticParams() {
  return []; // rendered on first request, then cached and revalidated (ISR)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const l = await getListing(slug);
  if (!l) return { title: "Listing not found", robots: { index: false } };
  const type = PROPERTY_TYPE_BY_VALUE[l.propertyType].label;
  const cover = l.media.find((m) => m.type === "IMAGE")?.url;
  return buildMetadata({
    title: `${l.title}: ${type} for Rent in ${l.area}, ${l.city} (${l.publicId})`,
    description: truncate(
      `${type} for rent in ${l.area}, ${l.city} at ${formatPKR(l.rentPerMonth)}/month. ${l.bedrooms ? `${l.bedrooms} bed. ` : ""}${l.description}`,
      158,
    ),
    path: `/listings/${l.slug}`,
    image: cover,
    keywords: [`${type} for rent in ${l.area}`, `${type} for rent in ${l.city}`, `${l.area} ${l.city} rent`, l.publicId, "kiraye par"],
  });
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = await getListing(slug);
  if (!l) notFound();
  const similar = await getSimilarListings(l, 4);
  const type = PROPERTY_TYPE_BY_VALUE[l.propertyType];
  const wa = buildWhatsAppUrl(l);
  const tenant = PREFERRED_TENANTS.find((t) => t.value === l.preferredTenant)?.label;

  const specs: { label: string; value: string }[] = [
    l.bedrooms != null ? { label: "Bedrooms", value: String(l.bedrooms) } : null,
    l.bathrooms != null ? { label: "Bathrooms", value: String(l.bathrooms) } : null,
    l.areaSize != null && l.areaUnit ? { label: "Area", value: `${l.areaSize} ${AREA_UNIT_LABEL[l.areaUnit]}` } : null,
    l.floor ? { label: "Floor", value: l.floor } : null,
    { label: "Furnished", value: l.furnished ? "Yes" : "No" },
    tenant ? { label: "Preferred tenant", value: tenant } : null,
    l.availableFrom ? { label: "Available from", value: formatDate(l.availableFrom) } : null,
    l.securityDeposit != null ? { label: "Security deposit", value: formatPKR(l.securityDeposit) } : null,
  ].filter((x): x is { label: string; value: string } => x !== null);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: `${l.city} rentals`, path: `/rent/${l.citySlug}` },
          { name: l.area, path: `/rent/${l.citySlug}/${l.areaSlug}` },
          { name: l.publicId, path: `/listings/${l.slug}` },
        ]}
      />

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-8">
          <Gallery items={l.media} title={l.title} />

          <header>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">
                <span className="sr-only">Listing ID: </span>
                {l.publicId}
              </Badge>
              <Badge>{type.label}</Badge>
              {l.featured && <Badge className="bg-accent text-white dark:text-black"><T k="card.featured" /></Badge>}
            </div>
            <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">{l.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4" aria-hidden="true" />
              {l.area}, {l.city}
            </p>
            <p className="mt-3 text-3xl font-extrabold text-primary">
              {formatPKR(l.rentPerMonth)} <span className="text-base font-medium text-muted-foreground"><T k="card.perMonth" /></span>
            </p>
          </header>

          <section aria-labelledby="details-h">
            <h2 id="details-h" className="mb-3 text-xl font-semibold"><T k="detail.details" /></h2>
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
              <div className="flex justify-between gap-4 bg-card px-4 py-3"><dt className="text-muted-foreground">Property type</dt><dd className="font-medium">{type.label}</dd></div>
              {specs.map((s) => (
                <div key={s.label} className="flex justify-between gap-4 bg-card px-4 py-3">
                  <dt className="text-muted-foreground">{s.label}</dt>
                  <dd className="text-end font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="desc-h">
            <h2 id="desc-h" className="mb-3 text-xl font-semibold"><T k="detail.description" /></h2>
            <p className="whitespace-pre-line leading-relaxed text-foreground/90">{l.description}</p>
          </section>

          {l.features.length > 0 && (
            <section aria-labelledby="feat-h">
              <h2 id="feat-h" className="mb-3 text-xl font-semibold"><T k="detail.features" /></h2>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                {l.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    {FEATURE_LABEL[f] ?? f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="loc-h">
            <h2 id="loc-h" className="mb-3 text-xl font-semibold"><T k="detail.location" /></h2>
            <p className="flex items-center gap-2 rounded-xl border border-border bg-card p-4">
              <MapPin className="size-5 text-primary" aria-hidden="true" />
              <span className="font-medium">{l.area}, {l.city}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground"><T k="detail.locationNote" /></p>
          </section>
        </div>

        <aside className="hidden lg:block" aria-label="Contact">
          <div className="sticky top-20 space-y-4 rounded-xl border border-border bg-card p-5">
            <p className="text-2xl font-extrabold text-primary">{formatPKR(l.rentPerMonth)}<span className="text-sm font-medium text-muted-foreground"> <T k="card.perMonth" /></span></p>
            <p className="text-sm"><span className="text-muted-foreground"><T k="card.id" />: </span><strong className="font-mono">{l.publicId}</strong></p>
            <WhatsAppButton href={wa} publicId={l.publicId} source="detail" size="lg" className="w-full" label="Chat on WhatsApp" />
            <p className="text-sm text-muted-foreground"><T k="detail.contactNote" /></p>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-12" aria-labelledby="sim-h">
          <h2 id="sim-h" className="mb-5 text-2xl font-bold"><T k="detail.similar" /></h2>
          <ListingGrid listings={similar} source="similar" />
        </section>
      )}

      {/* Sticky contact bar on mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold text-primary">{formatPKR(l.rentPerMonth)}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">{l.publicId}</p>
          </div>
          <WhatsAppButton href={wa} publicId={l.publicId} source="sticky" size="lg" label="WhatsApp" />
        </div>
      </div>

      <JsonLd data={listingJsonLd(l)} />
    </div>
  );
}
