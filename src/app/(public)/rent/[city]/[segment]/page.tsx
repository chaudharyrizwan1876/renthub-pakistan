import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/listing/landing";
import { CITY_BY_SLUG, PROPERTY_TYPE_BY_SLUG, PROPERTY_TYPE_BY_VALUE } from "@/lib/constants";
import { getSegment, getTypesInArea } from "@/lib/listings/landing";
import { getAreaInfo, getAreasInCity, getCityInfo } from "@/lib/listings/public";
import { buildMetadata } from "@/lib/seo";
import { formatPKR } from "@/lib/utils";

export const revalidate = 600;

export async function generateStaticParams() {
  return [];
}

type Params = Promise<{ city: string; segment: string }>;

/** /rent/[city]/[segment]: segment is either a property-type slug (flats, houses…) or an area slug (i-8, dha-phase-2). */
async function resolve(p: { city: string; segment: string }) {
  const city = CITY_BY_SLUG[p.city]?.name ?? (await getCityInfo(p.city));
  if (!city) return null;
  const typeMeta = PROPERTY_TYPE_BY_SLUG[p.segment];
  if (typeMeta) {
    const seg = await getSegment({ citySlug: p.city, propertyType: typeMeta.value });
    return { kind: "type" as const, city, typeMeta, seg };
  }
  const area = await getAreaInfo(p.city, p.segment);
  if (!area) return null;
  const seg = await getSegment({ citySlug: p.city, areaSlug: p.segment });
  return { kind: "area" as const, city, area: area.area, seg };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const r = await resolve(p);
  if (!r) return { title: "Not found", robots: { index: false } };
  const price = r.seg.min ? ` from ${formatPKR(r.seg.min)}/month` : "";
  if (r.kind === "type") {
    return buildMetadata({
      title: `${r.typeMeta.plural} for Rent in ${r.city}`,
      description: `${r.seg.total > 0 ? `${r.seg.total} ${r.typeMeta.plural.toLowerCase()} for rent in ${r.city}${price}. ` : ""}Browse photos, rents and details. Enquire on WhatsApp, no sign-up needed.`,
      path: `/rent/${p.city}/${p.segment}`,
      noindex: r.seg.total === 0,
      keywords: [`${r.typeMeta.plural.toLowerCase()} for rent in ${r.city}`, `${r.typeMeta.label.toLowerCase()} kiraye par ${r.city}`],
    });
  }
  return buildMetadata({
    title: `Property for Rent in ${r.area}, ${r.city}`,
    description: `${r.seg.total > 0 ? `${r.seg.total} ${r.seg.total === 1 ? "rental" : "rentals"} in ${r.area}, ${r.city}${price}. ` : ""}Flats, houses, portions and more. Browse free and contact us on WhatsApp.`,
    path: `/rent/${p.city}/${p.segment}`,
    noindex: r.seg.total === 0,
    keywords: [`property for rent in ${r.area} ${r.city}`, `${r.area} ${r.city} rent`, `house for rent in ${r.area}`, `flat for rent in ${r.area}`],
  });
}

export default async function SegmentPage({ params }: { params: Params }) {
  const p = await params;
  const r = await resolve(p);
  if (!r) notFound();
  const { seg, city } = r;
  const stats = seg.total > 0 && seg.min && seg.max ? ` Rents range from ${formatPKR(seg.min)} to ${formatPKR(seg.max)} per month${seg.avg ? `, with an average of ${formatPKR(seg.avg)}` : ""}.` : "";

  if (r.kind === "type") {
    const areas = await getAreasInCity(p.city, 12);
    return (
      <LandingPage
        h1={`${r.typeMeta.plural} for Rent in ${city}`}
        intro={[
          `Find ${r.typeMeta.plural.toLowerCase()} for rent in ${city}: ${seg.total > 0 ? `${seg.total} reviewed ${seg.total === 1 ? "listing is" : "listings are"} available right now.` : "new listings are added every day."}${stats}`,
          `Each property shows its public area, photos and a unique Listing ID. Tap WhatsApp to get the full address and arrange a viewing with our team.`,
        ]}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: `${city} rentals`, path: `/rent/${p.city}` },
          { name: r.typeMeta.plural, path: `/rent/${p.city}/${p.segment}` },
        ]}
        listings={seg.items}
        total={seg.total}
        viewAllHref={`/listings?city=${p.city}&type=${r.typeMeta.value}`}
        relatedTitle={`More rentals in ${city}`}
        related={areas.map((a) => ({ href: `/rent/${p.city}/${a.areaSlug}`, label: `${a.area} (${a.count})` }))}
        faqs={[
          { q: `What is the average rent for ${r.typeMeta.plural.toLowerCase()} in ${city}?`, a: seg.avg ? `Based on our current listings, the average monthly rent for ${r.typeMeta.plural.toLowerCase()} in ${city} is about ${formatPKR(seg.avg)}.` : `Rents vary by area and size. Browse the listings above or message us with your budget.` },
        ]}
        waText={`Assalam o Alaikum, I am looking for a ${r.typeMeta.label.toLowerCase()} for rent in ${city}.`}
      />
    );
  }

  const [types, areas] = await Promise.all([getTypesInArea(p.city, p.segment), getAreasInCity(p.city, 12)]);
  return (
    <LandingPage
      h1={`Property for Rent in ${r.area}, ${city}`}
      intro={[
        `Looking to rent in ${r.area}, ${city}? ${seg.total > 0 ? `There ${seg.total === 1 ? "is" : "are"} ${seg.total} reviewed ${seg.total === 1 ? "listing" : "listings"} available right now.` : "New listings are added every day."}${stats}`,
        `All exact addresses and owner details are kept private. Send us the Listing ID on WhatsApp and we will arrange a visit and connect you with the owner.`,
      ]}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: `${city} rentals`, path: `/rent/${p.city}` },
        { name: r.area, path: `/rent/${p.city}/${p.segment}` },
      ]}
      listings={seg.items}
      total={seg.total}
      viewAllHref={`/listings?city=${p.city}&area=${encodeURIComponent(r.area)}`}
      relatedTitle={`Explore ${city}`}
      related={[
        ...types.map((t) => ({ href: `/rent/${p.city}/${PROPERTY_TYPE_BY_VALUE[t.type].slug}`, label: `${PROPERTY_TYPE_BY_VALUE[t.type].plural} in ${city} (${t.count})` })),
        ...areas.filter((a) => a.areaSlug !== p.segment).map((a) => ({ href: `/rent/${p.city}/${a.areaSlug}`, label: `${a.area} (${a.count})` })),
      ]}
      faqs={[
        { q: `How do I get the exact address of a property in ${r.area}?`, a: `Message us on WhatsApp with the Listing ID. Our team shares the exact address when a visit is arranged.` },
      ]}
      waText={`Assalam o Alaikum, I am looking for a rental in ${r.area}, ${city}.`}
    />
  );
}
