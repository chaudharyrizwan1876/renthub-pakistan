import Link from "next/link";
import { CITIES, PROPERTY_TYPES } from "@/lib/constants";
import { SITE } from "@/lib/site";
import { slugify } from "@/lib/utils";
import { generalWhatsAppUrl } from "@/lib/whatsapp";
import { T } from "@/components/i18n/lang-provider";
import { Logo } from "./site-header";

export function SiteFooter() {
  const h = "mb-3 text-sm font-semibold uppercase tracking-wide text-foreground";
  const a = "text-sm text-muted-foreground hover:text-foreground hover:underline";
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground"><T k="footer.tagline" /></p>
          <a href={generalWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
            WhatsApp: +{SITE.adminWhatsapp.replace(/^(\d{2})(\d{3})(\d{7})$/, "$1 $2 $3")}
          </a>
        </div>
        <nav aria-label="Rentals by city">
          <h2 className={h}><T k="footer.explore" /></h2>
          <ul className="space-y-2">
            {CITIES.slice(0, 6).map((c) => (
              <li key={c.name}>
                <Link href={`/rent/${slugify(c.name)}`} className={a}>Rent in {c.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Property types">
          <h2 className={h}>Property types</h2>
          <ul className="space-y-2">
            {PROPERTY_TYPES.slice(0, 6).map((t) => (
              <li key={t.value}>
                <Link href={`/listings?type=${t.value}`} className={a}>{t.plural} for rent</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Company">
          <h2 className={h}><T k="footer.owners" /></h2>
          <ul className="space-y-2">
            <li><Link href="/signup" className={a}><T k="nav.addListing" /></Link></li>
            <li><Link href="/login" className={a}><T k="nav.login" /></Link></li>
            <li><Link href="/blog" className={a}><T k="nav.blog" /></Link></li>
            <li><Link href="/about" className={a}><T k="nav.about" /></Link></li>
            <li><Link href="/contact" className={a}><T k="nav.contact" /></Link></li>
            <li><Link href="/privacy-policy" className={a}>Privacy Policy</Link></li>
            <li><Link href="/terms" className={a}>Terms &amp; Conditions</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {SITE.name}. All rights reserved.
      </div>
    </footer>
  );
}
