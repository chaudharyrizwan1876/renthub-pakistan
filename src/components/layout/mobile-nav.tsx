"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useLang } from "@/components/i18n/lang-provider";
import { generalWhatsAppUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/listing/whatsapp-button";

export function MobileNav() {
  const pathname = usePathname();
  // The menu is "open for" a specific path, so it closes automatically after any navigation.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const setOpen = (fn: (o: boolean) => boolean) => setOpenPath(fn(open) ? pathname : null);
  const { t } = useLang();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const item = "flex min-h-12 items-center rounded-lg px-3 text-base font-medium transition-colors hover:bg-muted aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary";
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : t("nav.menu")}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-11 items-center justify-center rounded-lg transition-colors hover:bg-muted"
      >
        <span key={open ? "x" : "menu"} className="animate-pop-in">
          {open ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
        </span>
      </button>
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="animate-sheet-down fixed inset-x-0 top-16 z-40 h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-background p-4">
          <ul className="stagger space-y-1">
            <li><Link href="/" className={item} aria-current={pathname === "/" ? "page" : undefined}>{t("nav.home")}</Link></li>
            <li><Link href="/listings" className={item} aria-current={pathname === "/listings" ? "page" : undefined}>{t("nav.listings")}</Link></li>
            <li><Link href="/blog" className={item} aria-current={pathname === "/blog" ? "page" : undefined}>{t("nav.blog")}</Link></li>
            <li><Link href="/about" className={item} aria-current={pathname === "/about" ? "page" : undefined}>{t("nav.about")}</Link></li>
            <li><Link href="/contact" className={item} aria-current={pathname === "/contact" ? "page" : undefined}>{t("nav.contact")}</Link></li>
            <li><Link href="/login" className={item} aria-current={pathname === "/login" ? "page" : undefined}>{t("nav.login")}</Link></li>
          </ul>
          <div className="stagger mt-4 space-y-3">
            <Link href="/signup" className="flex min-h-12 items-center justify-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground">
              {t("nav.addListing")}
            </Link>
            <a href={generalWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-whatsapp px-4 font-semibold text-white">
              <WhatsAppIcon /> WhatsApp
            </a>
          </div>
        </nav>
      )}
    </div>
  );
}
