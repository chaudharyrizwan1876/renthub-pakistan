import type { Metadata } from "next";
import { PROPERTY_TYPE_BY_VALUE } from "./constants";
import type { PublicListing } from "./listings/public";
import { SITE, absoluteUrl } from "./site";

export function buildMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
  keywords?: string[];
  type?: "website" | "article";
}): Metadata {
  const url = absoluteUrl(opts.path);
  const images = opts.image ? [{ url: opts.image.startsWith("http") ? opts.image : absoluteUrl(opts.image), alt: opts.title }] : undefined;
  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords ?? [...SITE.keywords],
    alternates: { canonical: url },
    robots: opts.noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: opts.type ?? "website",
      url,
      title: opts.title,
      description: opts.description,
      siteName: SITE.name,
      locale: "en_PK",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: opts.title,
      description: opts.description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}

export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: absoluteUrl("/icon.svg"),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: `+${SITE.adminWhatsapp}`,
        areaServed: "PK",
        availableLanguage: ["English", "Urdu"],
      },
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    inLanguage: ["en", "ur"],
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/listings?area={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

/** Listing structured data built from PUBLIC data only (area + city, never the address). */
export function listingJsonLd(l: PublicListing) {
  const url = absoluteUrl(`/listings/${l.slug}`);
  const images = l.media.filter((m) => m.type === "IMAGE").map((m) => (m.url.startsWith("http") ? m.url : absoluteUrl(m.url)));
  const typeLabel = PROPERTY_TYPE_BY_VALUE[l.propertyType].label;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateListing",
        "@id": `${url}#listing`,
        url,
        name: l.title,
        description: truncate(l.description, 300),
        datePosted: (l.approvedAt ?? l.createdAt).toISOString(),
        image: images,
        inLanguage: "en",
        about: {
          "@type": "Accommodation",
          name: `${typeLabel} in ${l.area}, ${l.city}`,
          ...(l.bedrooms != null ? { numberOfBedrooms: l.bedrooms } : {}),
          ...(l.bathrooms != null ? { numberOfBathroomsTotal: l.bathrooms } : {}),
          ...(l.areaSize != null && l.areaUnit === "SQFT"
            ? { floorSize: { "@type": "QuantitativeValue", value: l.areaSize, unitCode: "FTK" } }
            : {}),
          address: { "@type": "PostalAddress", addressLocality: l.city, addressRegion: l.area, addressCountry: "PK" },
        },
      },
      {
        "@type": "Product",
        "@id": `${url}#product`,
        name: l.title,
        sku: l.publicId,
        description: truncate(l.description, 300),
        image: images,
        category: `${typeLabel} for rent`,
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: "PKR",
          price: l.rentPerMonth,
          priceSpecification: { "@type": "UnitPriceSpecification", price: l.rentPerMonth, priceCurrency: "PKR", unitText: "MONTH" },
          availability: "https://schema.org/InStock",
          seller: { "@type": "Organization", name: SITE.name, url: SITE.url },
        },
      },
    ],
  };
}

export function itemListJsonLd(name: string, listings: PublicListing[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: listings.map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/listings/${l.slug}`),
      name: l.title,
    })),
  };
}

export function articleJsonLd(p: { slug: string; title: string; excerpt: string; coverImage: string | null; authorName: string; publishedAt: Date | null; updatedAt: Date; category: string }) {
  const url = absoluteUrl(`/blog/${p.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: url,
    headline: p.title,
    description: p.excerpt,
    articleSection: p.category,
    ...(p.coverImage ? { image: [p.coverImage.startsWith("http") ? p.coverImage : absoluteUrl(p.coverImage)] } : {}),
    datePublished: (p.publishedAt ?? p.updatedAt).toISOString(),
    dateModified: p.updatedAt.toISOString(),
    author: { "@type": "Organization", name: p.authorName },
    publisher: { "@type": "Organization", name: SITE.name, logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") } },
  };
}
