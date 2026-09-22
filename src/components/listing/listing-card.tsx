import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, MapPin, Maximize } from "lucide-react";
import { AREA_UNIT_LABEL, PROPERTY_TYPE_BY_VALUE } from "@/lib/constants";
import type { PublicListing } from "@/lib/listings/public";
import { formatPKR } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { T } from "@/components/i18n/lang-provider";
import { Badge } from "@/components/ui/misc";
import { Reveal } from "@/components/ui/reveal";
import { WhatsAppButton } from "./whatsapp-button";

export function ListingCard({
  listing: l,
  priority = false,
  source = "card",
  headingLevel = 3,
}: {
  listing: PublicListing;
  priority?: boolean;
  source?: "card" | "similar";
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const cover = l.media.find((m) => m.type === "IMAGE");
  const type = PROPERTY_TYPE_BY_VALUE[l.propertyType];
  const href = `/listings/${l.slug}`;

  return (
    <article className="group lift flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-muted" tabIndex={-1} aria-hidden="true">
        {cover ? (
          <Image
            src={cover.url}
            alt=""
            fill
            sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, (min-width:640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            {...(priority ? { preload: true } : { loading: "lazy" })}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-4xl">🏠</div>
        )}
        <div className="absolute start-2 top-2 flex gap-1.5">
          <Badge className="bg-card/95 text-foreground shadow-sm">{type.plural.replace(/s$/, "")}</Badge>
          {l.featured && (
            <Badge className="bg-accent text-white shadow-sm dark:text-black">
              <T k="card.featured" />
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <p className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-primary">{formatPKR(l.rentPerMonth)}</span>
          <span className="text-sm text-muted-foreground"><T k="card.perMonth" /></span>
        </p>
        <Heading className="line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-snug">
          <Link href={href} className="hover:text-primary hover:underline">
            {l.title}
          </Link>
        </Heading>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {l.area}, {l.city}
          </span>
        </p>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground" aria-label="Property specs">
          {l.bedrooms != null && (
            <li className="flex items-center gap-1.5">
              <BedDouble className="size-4" aria-hidden="true" />
              {l.bedrooms} <span className="sr-only">bedrooms</span>
            </li>
          )}
          {l.bathrooms != null && (
            <li className="flex items-center gap-1.5">
              <Bath className="size-4" aria-hidden="true" />
              {l.bathrooms} <span className="sr-only">bathrooms</span>
            </li>
          )}
          {l.areaSize != null && l.areaUnit && (
            <li className="flex items-center gap-1.5">
              <Maximize className="size-4" aria-hidden="true" />
              {l.areaSize} {AREA_UNIT_LABEL[l.areaUnit]}
            </li>
          )}
        </ul>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground">
            <span className="sr-only"><T k="card.id" />: </span>
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-semibold text-foreground">{l.publicId}</span>
          </p>
        </div>
        <WhatsAppButton href={buildWhatsAppUrl(l)} publicId={l.publicId} source={source} className="w-full" />
      </div>
    </article>
  );
}

export function ListingGrid({ listings, source = "card", headingLevel = 3 }: { listings: PublicListing[]; source?: "card" | "similar"; headingLevel?: 2 | 3 }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((l, i) => (
        <Reveal as="li" key={l.publicId} delay={i >= 4 ? (i % 4) * 70 : 0} className={i < 4 ? "!opacity-100 !transform-none" : undefined}>
          <ListingCard listing={l} priority={i < 2} source={source} headingLevel={headingLevel} />
        </Reveal>
      ))}
    </ul>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Loading listings">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <div className="space-y-3 p-4">
            <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-11 animate-pulse rounded-lg bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}
