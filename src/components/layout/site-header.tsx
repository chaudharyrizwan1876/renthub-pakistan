import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { LanguageToggle, T } from "@/components/i18n/lang-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MobileNav } from "./mobile-nav";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={className ?? "group/logo flex items-center gap-2 text-lg font-extrabold tracking-tight"} aria-label={`${SITE.name} home`}>
      <Image
        src="/logo.png"
        alt=""
        width={32}
        height={32}
        priority
        className="size-8 shrink-0 rounded-lg object-contain transition-transform duration-300 group-hover/logo:scale-110"
      />
      <span>
        Pakistan <span className="text-primary">Rents</span>
      </span>
    </Link>
  );
}

const linkCls = "relative rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100";

/** Static links only (no session read) so public pages stay statically cacheable; /login redirects signed-in owners to the dashboard. */
export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-40 border-b transition-shadow duration-300 border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
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

