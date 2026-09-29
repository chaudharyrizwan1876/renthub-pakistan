"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Logo } from "@/components/layout/site-header";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

/** Root section pages (Overview / My listings) only highlight on an exact match; every other item also covers its own sub-pages (e.g. /admin/listings/[id]/edit). */
function isNavActive(href: string, pathname: string): boolean {
  if (href === "/admin" || href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

/** Shared chrome for /dashboard and /admin: top bar + nav (sidebar on desktop, scrollable tabs on mobile). */
export function DashboardShell({
  title,
  userName,
  nav,
  logoutTo,
  actions,
  children,
  wide,
}: {
  title: string;
  userName: string;
  nav: NavItem[];
  logoutTo: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const pathname = usePathname();
  const link = "flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg border-s-2 border-transparent px-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground";
  const linkActive = "border-primary bg-primary-soft font-semibold text-primary hover:bg-primary-soft hover:text-primary";
  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-foreground sm:inline">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <ThemeToggle />
            <span className="hidden max-w-40 truncate text-sm text-muted-foreground md:inline">{userName}</span>
            <form action={logoutAction.bind(null, logoutTo)}>
              <button type="submit" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium hover:bg-muted">
                <LogOut className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
                <span className="sr-only sm:hidden">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className={cn("mx-auto flex flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:gap-6 md:py-6", wide ? "max-w-[1500px]" : "max-w-7xl")}>
        <nav aria-label={`${title} navigation`} className="md:sticky md:top-20 md:h-fit md:w-56 md:shrink-0">
          <ul className="no-scrollbar flex gap-1 overflow-x-auto md:flex-col">
            {nav.map((n) => {
              const active = isNavActive(n.href, pathname);
              return (
                <li key={n.href}>
                  <Link href={n.href} aria-current={active ? "page" : undefined} className={cn(link, active && linkActive)}>
                    {n.icon}
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <main id="main" className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
