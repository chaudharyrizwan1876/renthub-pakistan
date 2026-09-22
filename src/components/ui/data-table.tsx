import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** When set the header becomes a sort link */
  sortKey?: string;
  hideOnMobile?: boolean;
}

/**
 * Server-rendered, accessible data table. On small screens each row becomes a card
 * (label/value pairs) so nothing needs horizontal scrolling on a 360px phone.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  sort,
  sortHref,
  caption,
  mobileTitle,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: React.ReactNode;
  sort?: { key?: string; dir?: "asc" | "desc" };
  sortHref?: (key: string, nextDir: "asc" | "desc") => string;
  caption: string;
  /** Column key rendered as the card heading on mobile */
  mobileTitle?: string;
}) {
  if (rows.length === 0) return <>{empty}</>;
  return (
    <div>
      {/* Desktop table */}
      <div className="relative hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
        <table className="w-full min-w-[720px] text-start text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.sortKey;
                const next = active && sort?.dir === "asc" ? "desc" : "asc";
                return (
                  <th key={c.key} scope="col" aria-sort={active ? (sort?.dir === "asc" ? "ascending" : "descending") : undefined} className={cn("px-4 py-3 text-start font-semibold", c.className)}>
                    {c.sortKey && sortHref ? (
                      <Link href={sortHref(c.sortKey, next)} className="inline-flex items-center gap-1 hover:text-foreground">
                        {c.header}
                        {active ? sort?.dir === "asc" ? <ArrowUp className="size-3.5" aria-hidden="true" /> : <ArrowDown className="size-3.5" aria-hidden="true" /> : <ChevronsUpDown className="size-3.5 opacity-50" aria-hidden="true" />}
                      </Link>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="align-top hover:bg-muted/30">
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3", c.className)}>{c.cell(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden" aria-label={caption}>
        {rows.map((row) => {
          const title = columns.find((c) => c.key === mobileTitle);
          return (
            <li key={rowKey(row)} className="rounded-xl border border-border bg-card p-4">
              {title && <div className="mb-3 font-semibold">{title.cell(row)}</div>}
              <dl className="space-y-2 text-sm">
                {columns
                  .filter((c) => c.key !== mobileTitle && !c.hideOnMobile)
                  .map((c) => (
                    <div key={c.key} className="flex items-start justify-between gap-4">
                      <dt className="shrink-0 text-muted-foreground">{c.header}</dt>
                      <dd className="min-w-0 text-end">{c.cell(row)}</dd>
                    </div>
                  ))}
              </dl>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
