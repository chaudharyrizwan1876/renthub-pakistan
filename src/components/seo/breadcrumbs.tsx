import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "./json-ld";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((it, i) => {
            const last = i === items.length - 1;
            return (
              <li key={it.path} className="flex items-center gap-1">
                {last ? (
                  <span aria-current="page" className="font-medium text-foreground">
                    {it.name}
                  </span>
                ) : (
                  <Link href={it.path} className="hover:text-foreground hover:underline">
                    {it.name}
                  </Link>
                )}
                {!last && <ChevronRight className="rtl-flip size-3.5" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items)} />
    </>
  );
}
