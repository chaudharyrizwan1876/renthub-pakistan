import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/listing/landing";
import { CITY_BY_SLUG, PROPERTY_TYPE_BY_VALUE } from "@/lib/constants";
import { getSegment, getTypesInCity } from "@/lib/listings/landing";
import { getAreasInCity, getCityInfo } from "@/lib/listings/public";
import { buildMetadata } from "@/lib/seo";
import { formatPKR } from "@/lib/utils";

export const revalidate = 600;

export async function generateStaticParams() {
  return [];
}

async function resolveCity(slug: string) {
  return CITY_BY_SLUG[slug]?.name ?? (await getCityInfo(slug));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city: slug } = await params;
  const city = await resolveCity(slug);
  if (!city) return { title: "Not found", robots: { index: false } };
  const seg = await getSegment({ citySlug: slug }, 1);
  return buildMetadata({
    title: `Property for Rent in ${city}: Flats, Houses, Shops & Offices`,
    description: `${seg.total > 0 ? `${seg.total} verified ${seg.total === 1 ? "rental" : "rentals"} in ${city}${seg.min ? ` from ${formatPKR(seg.min)}/month` : ""}. ` : ""}Browse flats, houses, portions, shops and offices for rent in ${city}. Free to browse, enquire on WhatsApp.`,
    path: `/rent/${slug}`,
    noindex: seg.total === 0,
    keywords: [`property for rent in ${city}`, `flat for rent in ${city}`, `house for rent in ${city}`, `${city} kiraye par makan`],
  });
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = await resolveCity(slug);
  if (!city) notFound();
  const [seg, types, areas] = await Promise.all([getSegment({ citySlug: slug }, 12), getTypesInCity(slug), getAreasInCity(slug, 18)]);

  const intro = [
    seg.total > 0
      ? `Explore ${seg.total} ${seg.total === 1 ? "property" : "properties"} for rent in ${city}${seg.min && seg.max ? `, with monthly rents from ${formatPKR(seg.min)} to ${formatPKR(seg.max)}` : ""}. Every listing is reviewed by our team and carries a unique Listing ID.`
      : `Looking for a rental in ${city}? We are adding new flats, houses, shops and offices every day.`,
    `Pick an area or property type below, then tap WhatsApp on any listing and we will share the exact address and arrange a visit with the owner.`,
  ];

  return (
    <LandingPage
      h1={`Property for Rent in ${city}`}
      intro={intro}
      breadcrumbs={[{ name: "Home", path: "/" }, { name: `${city} rentals`, path: `/rent/${slug}` }]}
      listings={seg.items}
      total={seg.total}
      viewAllHref={`/listings?city=${slug}`}
      relatedTitle={`Browse ${city} by area & type`}
      related={[
        ...types.map((t) => ({ href: `/listings?city=${slug}&type=${t.type}`, label: `${PROPERTY_TYPE_BY_VALUE[t.type].plural} for rent (${t.count})` })),
        ...areas.map((a) => ({ href: `/rent/${slug}/${a.areaSlug}`, label: `${a.area} (${a.count})` })),
      ]}
      faqs={[
        { q: `How do I rent a property in ${city}?`, a: `Browse listings, note the Listing ID of the property you like and message us on WhatsApp. Our team shares details, arranges a visit and connects you with the owner.` },
        { q: `Do I pay anything to browse rentals in ${city}?`, a: `No. Browsing and enquiring are free. A service fee applies only when a deal is completed, and it is agreed with you upfront.` },
      ]}
      waText={`Assalam o Alaikum, I am looking for a rental in ${city}. Please help me.`}
    />
  );
}
