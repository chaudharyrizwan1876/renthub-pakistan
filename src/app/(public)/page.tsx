import Link from "next/link";
import { BadgeCheck, Lock, MessageCircle, Search, Handshake, Wallet } from "lucide-react";
import { T } from "@/components/i18n/lang-provider";
import { SearchForm } from "@/components/layout/search-hero";
import { HeroSlider, type HeroSlide } from "@/components/layout/hero-slider";
import { BlogCard } from "@/components/blog/blog-card";
import { Reveal } from "@/components/ui/reveal";
import { getPublishedPosts } from "@/lib/blog";
import { ListingGrid } from "@/components/listing/listing-card";
import { JsonLd } from "@/components/seo/json-ld";
import { CITIES, PROPERTY_TYPES } from "@/lib/constants";
import { HOME_FAQS, HOW_STEPS } from "@/lib/content";
import { getFeaturedListings, getLatestListings, getPlatformStats, getPopularAreas } from "@/lib/listings/public";
import { buildMetadata, faqJsonLd, itemListJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { slugify } from "@/lib/utils";
import { generalWhatsAppUrl } from "@/lib/whatsapp";

export const revalidate = 300;

export const metadata = {
  ...buildMetadata({
    title: `${SITE.name}: Flats, Houses, Shops & Offices for Rent in Pakistan`,
    description:
      "Find verified flats, houses, portions, rooms, shops and offices for rent in Islamabad, Lahore, Karachi, Rawalpindi and more. Browse free with no sign-up and enquire on WhatsApp.",
    path: "/",
  }),
  title: { absolute: `${SITE.name}: Flats, Houses, Shops & Offices for Rent in Pakistan` },
};

const HOW_ICONS = [Search, MessageCircle, Handshake];

/** Put your 5 hero images at public/hero/1.jpg .. 5.jpg (see the "Hero slider images" guide). */
const HERO_SLIDES: HeroSlide[] = [
  { src: "/hero/1.jpg", alt: "Modern living room in a rental flat" },
  { src: "/hero/2.jpg", alt: "Bright bedroom in a rented apartment" },
  { src: "/hero/3.jpg", alt: "House exterior with a lawn" },
  { src: "/hero/4.jpg", alt: "Contemporary kitchen in a rental home" },
  { src: "/hero/5.jpg", alt: "City skyline view from an apartment" },
];

export default async function HomePage() {
  const [featured, latest, areas, stats, posts] = await Promise.all([
    getFeaturedListings(4),
    getLatestListings(8),
    getPopularAreas(12),
    getPlatformStats(),
    getPublishedPosts({ take: 3 }),
  ]);
  const featuredIds = new Set(featured.map((l) => l.publicId));
  const latestFiltered = latest.filter((l) => !featuredIds.has(l.publicId)).slice(0, 8);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <HeroSlider slides={HERO_SLIDES} className="absolute inset-0" />
        <div className="relative mx-auto flex min-h-[520px] max-w-7xl flex-col justify-center px-4 py-10 sm:min-h-[600px] sm:px-6 sm:py-16">
          <div className="animate-fade-up mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm sm:text-5xl">
              <T k="hero.title" />
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 drop-shadow-sm sm:text-lg">
              <T k="hero.subtitle" />
            </p>
          </div>
          <div className="animate-fade-up mx-auto mt-8 max-w-6xl [animation-delay:120ms]">
            <SearchForm />
          </div>
          <ul className="animate-fade-up mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2 [animation-delay:220ms]" aria-label="Browse by property type">
            {PROPERTY_TYPES.slice(0, 6).map((t) => (
              <li key={t.value}>
                <Link href={`/listings?type=${t.value}`} className="inline-flex min-h-9 items-center rounded-full border border-border bg-card px-4 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-md">
                  {t.plural}
                </Link>
              </li>
            ))}
          </ul>
          {stats.listings > 0 && (
            <p className="mt-5 text-center text-sm text-white/90 drop-shadow-sm">
              <strong className="text-white">{stats.listings}+</strong> live rentals in <strong className="text-white">{stats.cities}</strong> {stats.cities === 1 ? "city" : "cities"}
            </p>
          )}
        </div>
      </section>

      {featured.length > 0 && (
        <Reveal as="section" aria-labelledby="featured-h" className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><div>
          <SectionHeading id="featured-h" href="/listings"><T k="section.featured" /></SectionHeading>
          <ListingGrid listings={featured} />
        </div></Reveal>
      )}

      <Reveal as="section" aria-labelledby="latest-h" className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><div>
        <SectionHeading id="latest-h" href="/listings"><T k="section.latest" /></SectionHeading>
        {latestFiltered.length > 0 ? (
          <ListingGrid listings={latestFiltered} />
        ) : (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">New rentals are being added. Please check back soon.</p>
        )}
      </div></Reveal>

      <section className="border-y border-border bg-muted/50" aria-labelledby="areas-h">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 id="areas-h" className="text-2xl font-bold"><T k="section.areas" /></h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(areas.length > 0
              ? areas.map((a) => ({ key: `${a.citySlug}/${a.areaSlug}`, href: `/rent/${a.citySlug}/${a.areaSlug}`, name: a.area, city: a.city, count: a.count }))
              : CITIES.slice(0, 8).map((c) => ({ key: c.name, href: `/rent/${slugify(c.name)}`, name: c.name, city: "Pakistan", count: 0 }))
            ).map((a, i) => (
              <Reveal as="li" key={a.key} delay={(i % 4) * 60}>
                <Link href={a.href} className="lift flex min-h-16 flex-col justify-center rounded-xl border border-border bg-card px-4 py-3 hover:border-primary">
                  <span className="font-semibold">{a.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {a.city}
                    {a.count > 0 ? ` · ${a.count} ${a.count === 1 ? "rental" : "rentals"}` : ""}
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" aria-labelledby="how-h">
        <h2 id="how-h" className="text-center text-2xl font-bold"><T k="section.how" /></h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {HOW_STEPS.map((s, i) => {
            const Icon = HOW_ICONS[i]!;
            return (
              <Reveal as="li" key={s.t} delay={i * 110} className="lift rounded-xl border border-border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Icon className="size-6" aria-hidden="true" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Step {i + 1}</p>
                <h3 className="mt-1 text-lg font-semibold"><T k={s.t} /></h3>
                <p className="mt-2 text-sm text-muted-foreground"><T k={s.d} /></p>
              </Reveal>
            );
          })}
        </ol>
      </section>

      <section className="bg-primary text-primary-foreground" aria-labelledby="trust-h">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 id="trust-h" className="text-center text-2xl font-bold"><T k="section.trust" /></h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BadgeCheck, t: "Reviewed listings", d: "Every property is checked by our team before it goes live." },
              { icon: Lock, t: "Owner privacy", d: "Addresses and phone numbers stay private. We connect you in person." },
              { icon: Wallet, t: "Fair, upfront fee", d: "No hidden charges. Service fee only when your deal is completed." },
              { icon: MessageCircle, t: "Real human support", d: "Reach a real person on WhatsApp for questions, visits and paperwork." },
            ].map(({ icon: Icon, t, d }) => (
              <Reveal as="li" key={t} className="flex gap-3">
                <Icon className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-1 text-sm opacity-90">{d}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6" aria-labelledby="faq-h">
        <h2 id="faq-h" className="text-center text-2xl font-bold"><T k="section.faq" /></h2>
        <div className="mt-6 divide-y divide-border rounded-xl border border-border bg-card">
          {HOME_FAQS.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:hidden">
                {f.q}
                <span aria-hidden="true" className="text-xl text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {posts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6" aria-labelledby="blog-h">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 id="blog-h" className="text-2xl font-bold">From the blog</h2>
            <Link href="/blog" className="text-sm font-semibold text-primary hover:underline">All articles →</Link>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={i * 90}>
                <BlogCard post={p} />
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <Reveal className="flex flex-col items-center gap-4 rounded-2xl bg-muted px-6 py-10 text-center md:flex-row md:justify-between md:text-start">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl"><T k="cta.owner" /></h2>
            <p className="mt-1 text-muted-foreground"><T k="cta.ownerBody" /></p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="inline-flex min-h-12 items-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary-hover"><T k="nav.addListing" /></Link>
            <a href={generalWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center rounded-lg border border-border bg-card px-6 font-semibold hover:bg-background">Talk to us</a>
          </div>
        </Reveal>
      </section>

      <JsonLd data={faqJsonLd(HOME_FAQS)} />
      {latest.length > 0 && <JsonLd data={itemListJsonLd("Latest rentals", latest)} />}
    </>
  );
}

function SectionHeading({ id, href, children }: { id: string; href: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 id={id} className="text-2xl font-bold">{children}</h2>
      <Link href={href} className="text-sm font-semibold text-primary hover:underline"><T k="section.viewAll" /> →</Link>
    </div>
  );
}
