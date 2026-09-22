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

  const item = "flex min-h-12 items-center rounded-lg px-3 text-base font-medium hover:bg-muted";
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : t("nav.menu")}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted"
      >
        {open ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
      </button>
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="fixed inset-x-0 top-16 z-40 h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-background p-4">
          <ul className="space-y-1">
            <li><Link href="/" className={item}>{t("nav.home")}</Link></li>
            <li><Link href="/listings" className={item}>{t("nav.listings")}</Link></li>
            <li><Link href="/blog" className={item}>{t("nav.blog")}</Link></li>
            <li><Link href="/about" className={item}>{t("nav.about")}</Link></li>
            <li><Link href="/contact" className={item}>{t("nav.contact")}</Link></li>
            <li><Link href="/login" className={item}>{t("nav.login")}</Link></li>
          </ul>
          <div className="mt-4 space-y-3">
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
