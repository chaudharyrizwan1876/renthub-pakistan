import { BarChart3, Building2, Globe, Handshake, Inbox, LayoutDashboard, PenSquare, Search, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Toaster } from "@/components/ui/toaster";
import { requireAdminPage } from "@/lib/authz";

export const metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ic = "size-4";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  return (
    <DashboardShell
      title="Admin"
      userName={user.name}
      logoutTo="/admin/login"
      wide
      actions={
        <form action="/admin/search" method="get" role="search" className="hidden items-center sm:flex">
          <label htmlFor="admin-search" className="sr-only">Search by Listing ID</label>
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="admin-search"
              name="q"
              placeholder="Listing ID e.g. RH-10245"
              className="min-h-10 w-56 rounded-lg border border-border bg-card ps-9 pe-3 text-sm placeholder:text-muted-foreground"
              autoComplete="off"
            />
          </div>
        </form>
      }
      nav={[
        { href: "/admin", label: "Overview", icon: <LayoutDashboard className={ic} aria-hidden="true" /> },
        { href: "/admin/listings", label: "Listings", icon: <Building2 className={ic} aria-hidden="true" /> },
        { href: "/admin/owners", label: "Owners", icon: <Users className={ic} aria-hidden="true" /> },
        { href: "/admin/inquiries", label: "Inquiries", icon: <Inbox className={ic} aria-hidden="true" /> },
        { href: "/admin/deals", label: "Deals", icon: <Handshake className={ic} aria-hidden="true" /> },
        { href: "/admin/blog", label: "Blog", icon: <PenSquare className={ic} aria-hidden="true" /> },
        { href: "/admin/seo", label: "SEO (sitemap)", icon: <Globe className={ic} aria-hidden="true" /> },
        { href: "/admin/search", label: "Search by ID", icon: <BarChart3 className={ic} aria-hidden="true" /> },
      ]}
    >
      {children}
      <Toaster />
    </DashboardShell>
  );
}
