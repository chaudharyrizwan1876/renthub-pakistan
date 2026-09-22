import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { StatusBadge } from "@/components/ui/misc";
import { requireAdminPage } from "@/lib/authz";
import { db } from "@/lib/db";

export const metadata = { title: "Search by Listing ID" };

export default async function AdminSearch({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdminPage();
  const raw = ((await searchParams).q ?? "").trim().slice(0, 40);
  // "10245", "rh10245", "RH-10245" all resolve to RH-10245
  const digits = raw.replace(/\D/g, "");
  const normalized = /^[a-z]{2}-?\d+$/i.test(raw) ? raw.toUpperCase().replace(/^([A-Z]{2})-?/, "$1-") : digits.length >= 4 ? `RH-${digits}` : raw.toUpperCase();

  let matches: { id: string; publicId: string; title: string; status: Parameters<typeof StatusBadge>[0]["status"]; city: string; area: string }[] = [];
  if (raw) {
    const exact = await db.listing.findUnique({ where: { publicId: normalized }, select: { id: true } });
    if (exact) redirect(`/admin/listings/${exact.id}`);
    matches = await db.listing.findMany({
      where: { OR: [{ publicId: { contains: raw, mode: "insensitive" } }, { title: { contains: raw, mode: "insensitive" } }] },
      take: 20,
      select: { id: true, publicId: true, title: true, status: true, city: true, area: true },
    });
  }

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold">Search by Listing ID</h1>
      <form method="get" className="flex gap-2" role="search">
        <label htmlFor="sq" className="sr-only">Listing ID</label>
        <Input id="sq" name="q" defaultValue={raw} placeholder="RH-10245" autoFocus autoComplete="off" />
        <Button type="submit"><Search className="size-4" aria-hidden="true" />Find</Button>
      </form>
      {raw && matches.length === 0 && <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">No listing found for “{raw}”.</p>}
      {matches.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {matches.map((m) => (
            <li key={m.id}>
              <Link href={`/admin/listings/${m.id}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-muted/50">
                <span><span className="font-mono font-semibold text-primary">{m.publicId}</span> · {m.title}<span className="block text-xs text-muted-foreground">{m.area}, {m.city}</span></span>
                <StatusBadge status={m.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
