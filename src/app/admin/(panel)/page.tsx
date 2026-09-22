import Link from "next/link";
import { BarChart } from "@/components/admin/bar-chart";
import { HBar } from "@/components/admin/bar-chart";
import { Card } from "@/components/ui/misc";
import { STATUS_META } from "@/lib/constants";
import { getOverview } from "@/lib/admin/queries";
import { requireAdminPage } from "@/lib/authz";
import { formatDate, formatPKR } from "@/lib/utils";

export const metadata = { title: "Overview" };

function Stat({ label, value, href, tone }: { label: string; value: string | number; href?: string; tone?: string }) {
  const body = (
    <Card className="p-4 transition-colors hover:border-primary">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone ?? ""}`}>{value}</p>
    </Card>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

export default async function AdminOverview() {
  await requireAdminPage();
  const o = await getOverview();
  const s = o.byStatus;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total listings" value={o.total} href="/admin/listings" />
        <Stat label="Pending approval" value={s.PENDING ?? 0} href="/admin/listings?status=PENDING" tone={(s.PENDING ?? 0) > 0 ? "text-amber-600 dark:text-amber-400" : ""} />
        <Stat label="Approved (live)" value={s.APPROVED ?? 0} href="/admin/listings?status=APPROVED" />
        <Stat label="Rented" value={s.RENTED ?? 0} href="/admin/listings?status=RENTED" />
        <Stat label="Total owners" value={o.owners} href="/admin/owners" />
        <Stat label="Inquiries today" value={o.inquiries.today} href="/admin/inquiries" />
        <Stat label="Inquiries (7 days)" value={o.inquiries.week} href="/admin/inquiries" />
        <Stat label="Deals" value={o.deals.count} href="/admin/deals" />
      </section>

      <section aria-label="Commission" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Stat label="Commission received" value={formatPKR(o.deals.received)} tone="text-primary" href="/admin/deals" />
        <Stat label="Commission pending" value={formatPKR(o.deals.pending)} href="/admin/deals" />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">WhatsApp inquiries in the last 14 days</h2>
          <BarChart title="Inquiries per day" data={o.perDay} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Commission per month (PKR)</h2>
          <BarChart title="Commission per month" data={o.commissionPerMonth} format={(n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n))} color="var(--accent)" />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Listings by status</h2>
          <HBar
            items={(Object.keys(STATUS_META) as (keyof typeof STATUS_META)[]).map((k) => ({
              label: STATUS_META[k].label,
              value: s[k] ?? 0,
              className: { PENDING: "bg-amber-500", APPROVED: "bg-emerald-600", REJECTED: "bg-red-500", RENTED: "bg-sky-500", INACTIVE: "bg-slate-400" }[k],
            }))}
          />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Most contacted listings</h2>
          {o.top.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inquiries yet.</p>
          ) : (
            <ol className="space-y-2.5">
              {o.top.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                  <Link href={`/admin/listings/${t.id}`} className="min-w-0 truncate hover:underline">
                    <span className="font-mono font-semibold">{t.publicId}</span> · {t.title}
                  </Link>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-semibold">{t.count}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Awaiting your review</h2>
          <Link href="/admin/listings?status=PENDING" className="text-sm font-semibold text-primary hover:underline">View all →</Link>
        </div>
        {o.pendingList.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing pending. 🎉</p>
        ) : (
          <ul className="divide-y divide-border">
            {o.pendingList.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <Link href={`/admin/listings/${l.id}`} className="font-medium hover:underline">
                  <span className="font-mono">{l.publicId}</span> · {l.title}
                </Link>
                <span className="text-muted-foreground">{l.area}, {l.city} · {formatDate(l.createdAt, true)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
