import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function windowed(page: number, count: number): (number | "…")[] {
  const pages = new Set<number>([1, count, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push("…");
    out.push(p);
  });
  return out;
}

/** Server-rendered, crawlable pagination. `hrefFor` builds the URL for a page number. */
export function Pagination({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (p: number) => string }) {
  if (pageCount <= 1) return null;
  const item = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted sm:min-h-10 sm:min-w-10";
  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={item} aria-label="Previous page">
          <ChevronLeft className="rtl-flip size-4" aria-hidden="true" />
        </Link>
      ) : null}
      {windowed(page, pageCount).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-muted-foreground" aria-hidden="true">…</span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(item, p === page && "border-primary bg-primary text-primary-foreground hover:bg-primary")}
          >
            {p}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} rel="next" className={item} aria-label="Next page">
          <ChevronRight className="rtl-flip size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
