import type { Metadata } from "next";
import Link from "next/link";
import { Filters, countActiveFilters } from "@/components/listing/filters";
import { ListingGrid } from "@/components/listing/listing-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { CITY_BY_SLUG, PROPERTY_TYPE_BY_VALUE } from "@/lib/constants";
import { parseFilters, searchListings } from "@/lib/listings/public";
import { buildMetadata, itemListJsonLd } from "@/lib/seo";
import { generalWhatsAppUrl } from "@/lib/whatsapp";

type SP = Promise<Record<string, string | string[] | undefined>>;

function titleFor(f: ReturnType<typeof parseFilters>) {
  const type = f.type ? PROPERTY_TYPE_BY_VALUE[f.type].plural : "Properties";
  const city = f.citySlug ? CITY_BY_SLUG[f.citySlug]?.name : undefined;
  const where = [f.areaText, city].filter(Boolean).join(", ");
  return `${type} for Rent${where ? ` in ${where}` : " in Pakistan"}`;
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  const active = countActiveFilters(f) > 0 || f.page > 1;
  return buildMetadata({
    title: titleFor(f),
    description: `Browse ${titleFor(f).toLowerCase()} with photos, rent and details. Contact us on WhatsApp with the Listing ID. No sign-up required.`,
    path: "/listings", // canonical always points to the unfiltered page; filtered variants are noindex
    noindex: active,
  });
}

export default async function ListingsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const { items, total, page, pageCount } = await searchListings(filters);
  const active = countActiveFilters(filters);

  const hrefFor = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      const val = Array.isArray(v) ? v[0] : v;
      if (val && k !== "page") qs.set(k, val);
    }
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `/listings?${s}` : "/listings";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Rentals", path: "/listings" }]} />
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{titleFor(filters)}</h1>
      <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
        {total === 0 ? "No rentals found" : `${total} ${total === 1 ? "rental" : "rentals"} found`}
        {pageCount > 1 ? ` · page ${page} of ${pageCount}` : ""}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside aria-label="Filters">
          <Filters filters={filters} activeCount={active} />
        </aside>
        <section aria-label="Search results">
          {items.length > 0 ? (
            <>
              <ListingGrid listings={items} headingLevel={2} />
              <Pagination page={page} pageCount={pageCount} hrefFor={hrefFor} />
              <JsonLd data={itemListJsonLd(titleFor(filters), items)} />
            </>
          ) : (
            <EmptyState
              title="No rentals match your search"
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <Button asChild variant="outline"><Link href="/listings">Clear filters</Link></Button>
                  <Button asChild variant="whatsapp">
                    <a href={generalWhatsAppUrl("Assalam o Alaikum, I could not find a suitable rental on the website. Please help me find one.")} target="_blank" rel="noopener noreferrer">Ask us on WhatsApp</a>
                  </Button>
                </div>
              }
            >
              Try removing a filter or searching another area. Tell us what you need and we will find something for you.
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
