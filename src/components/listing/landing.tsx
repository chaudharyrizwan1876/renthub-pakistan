import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import type { PublicListing } from "@/lib/listings/public";
import { faqJsonLd, itemListJsonLd } from "@/lib/seo";
import { generalWhatsAppUrl } from "@/lib/whatsapp";
import { ListingGrid } from "./listing-card";

export interface RelatedLink {
  href: string;
  label: string;
}

/** Shared layout for SEO landing pages: /rent/[city], /rent/[city]/[area], /rent/[city]/[type] */
export function LandingPage({
  h1,
  intro,
  breadcrumbs,
  listings,
  total,
  viewAllHref,
  related,
  relatedTitle,
  faqs,
  waText,
}: {
  h1: string;
  intro: string[];
  breadcrumbs: { name: string; path: string }[];
  listings: PublicListing[];
  total: number;
  viewAllHref: string;
  related: RelatedLink[];
  relatedTitle: string;
  faqs: { q: string; a: string }[];
  waText: string;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-4xl">{h1}</h1>
      <div className="mt-3 max-w-3xl space-y-3 text-muted-foreground">
        {intro.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <section className="mt-8" aria-label="Listings">
        {listings.length > 0 ? (
          <>
            <ListingGrid listings={listings} headingLevel={2} />
            {total > listings.length && (
              <div className="mt-8 text-center">
                <Button asChild size="lg">
                  <Link href={viewAllHref}>View all {total} rentals</Link>
                </Button>
              </div>
            )}
            <JsonLd data={itemListJsonLd(h1, listings)} />
          </>
        ) : (
          <EmptyState
            title="No rentals listed here yet"
            action={
              <Button asChild variant="whatsapp">
                <a href={generalWhatsAppUrl(waText)} target="_blank" rel="noopener noreferrer">Tell us what you need</a>
              </Button>
            }
          >
            New properties are added daily. Message us and we will notify you as soon as one matches.
          </EmptyState>
        )}
      </section>

      {related.length > 0 && (
        <nav className="mt-12" aria-label={relatedTitle}>
          <h2 className="text-xl font-semibold">{relatedTitle}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {related.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="inline-flex min-h-10 items-center rounded-full border border-border bg-card px-4 text-sm font-medium hover:border-primary hover:text-primary">
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {faqs.length > 0 && (
        <section className="mt-12 max-w-3xl" aria-labelledby="landing-faq">
          <h2 id="landing-faq" className="text-xl font-semibold">Frequently asked questions</h2>
          <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
            {faqs.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:hidden">
                  {f.q}
                  <span aria-hidden="true" className="text-xl text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
          <JsonLd data={faqJsonLd(faqs)} />
        </section>
      )}
    </div>
  );
}
