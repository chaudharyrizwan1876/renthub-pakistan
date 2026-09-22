import Link from "next/link";
import { Home } from "lucide-react";
import { SITE } from "@/lib/site";
import { LanguageToggle, T } from "@/components/i18n/lang-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MobileNav } from "./mobile-nav";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={className ?? "flex items-center gap-2 text-lg font-extrabold tracking-tight"} aria-label={`${SITE.shortName}.pk home`}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Home className="size-[18px]" aria-hidden="true" />
      </span>
      <span>
        {SITE.shortName}
        <span className="text-primary">.pk</span>
      </span>
    </Link>
  );
}

const linkCls = "rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground";

/** Static links only (no session read) so public pages stay statically cacheable; /login redirects signed-in owners to the dashboard. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <Link href="/listings" className={linkCls}><T k="nav.listings" /></Link>
          <Link href="/blog" className={linkCls}><T k="nav.blog" /></Link>
          <Link href="/about" className={linkCls}><T k="nav.about" /></Link>
          <Link href="/contact" className={linkCls}><T k="nav.contact" /></Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle className="min-h-10 rounded-md px-3 text-sm font-semibold text-foreground/80 hover:bg-muted" />
          <Link href="/login" className="hidden min-h-10 items-center rounded-lg border border-border px-3.5 text-sm font-semibold hover:bg-muted md:inline-flex"><T k="nav.login" /></Link>
          <Link href="/signup" className="hidden min-h-10 items-center rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover md:inline-flex"><T k="nav.addListing" /></Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

