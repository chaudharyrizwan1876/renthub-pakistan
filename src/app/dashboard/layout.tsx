import { ExternalLink, List, PlusCircle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Toaster } from "@/components/ui/toaster";
import { requireOwnerPage } from "@/lib/authz";

export const metadata = { title: { default: "Owner dashboard", template: "%s | Owner dashboard" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOwnerPage();
  return (
    <DashboardShell
      title="Owner"
      userName={user.name}
      logoutTo="/"
      nav={[
        { href: "/dashboard", label: "My listings", icon: <List className="size-4" aria-hidden="true" /> },
        { href: "/dashboard/listings/new", label: "Add listing", icon: <PlusCircle className="size-4" aria-hidden="true" /> },
        { href: "/", label: "View website", icon: <ExternalLink className="size-4" aria-hidden="true" /> },
      ]}
    >
      {children}
      <Toaster />
    </DashboardShell>
  );
}
