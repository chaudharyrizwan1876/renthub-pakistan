import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { ALL_KNOWN_AREAS, BUDGET_STEPS, CITIES, PROPERTY_TYPES } from "@/lib/constants";
import type { ListingFilters } from "@/lib/listings/public";
import { slugify } from "@/lib/utils";
import { T } from "@/components/i18n/lang-provider";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";

const fmt = (n: number) => `Rs. ${new Intl.NumberFormat("en-PK").format(n)}`;

/**
 * Pure GET <form>: works without JavaScript, produces shareable/crawlable URLs.
 * On mobile it is collapsed behind a CSS-only toggle (checkbox hack, no client JS).
 */
export function Filters({ filters, activeCount }: { filters: ListingFilters; activeCount: number }) {
  return (
    <div className="lg:sticky lg:top-20">
      <input type="checkbox" id="filters-toggle" aria-label="Show or hide filters" className="peer sr-only lg:hidden" />
      <label
        htmlFor="filters-toggle"
        className="flex min-h-11 cursor-pointer items-center justify-between rounded-lg border border-border bg-card px-4 text-sm font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          <T k="filters.title" />
          {activeCount > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{activeCount}</span>}
        </span>
      </label>

      <form
        action="/listings"
        method="get"
        aria-label="Filter listings"
        className="mt-3 hidden space-y-4 rounded-xl border border-border bg-card p-4 peer-checked:block lg:mt-0 lg:block"
      >
        <h2 className="hidden text-base font-semibold lg:block"><T k="filters.title" /></h2>

        <div>
          <Label htmlFor="f-city"><T k="search.city" /></Label>
          <Select id="f-city" name="city" defaultValue={filters.citySlug ?? ""}>
            <option value="">Any city</option>
            {CITIES.map((c) => (
              <option key={c.name} value={slugify(c.name)}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="f-area"><T k="search.area" /></Label>
          <Input id="f-area" name="area" list="area-suggestions" defaultValue={filters.areaText ?? ""} placeholder="e.g. I-8, Gulberg" autoComplete="off" maxLength={80} />
          <datalist id="area-suggestions">
            {ALL_KNOWN_AREAS.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>
        <div>
          <Label htmlFor="f-type"><T k="search.type" /></Label>
          <Select id="f-type" name="type" defaultValue={filters.type ?? ""}>
            <option value="">Any type</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="f-min"><T k="filters.minPrice" /></Label>
            <Select id="f-min" name="minPrice" defaultValue={filters.minPrice?.toString() ?? ""}>
              <option value="">No min</option>
              {BUDGET_STEPS.map((b) => (
                <option key={b} value={b}>{fmt(b)}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="f-max"><T k="filters.maxPrice" /></Label>
            <Select id="f-max" name="maxPrice" defaultValue={filters.maxPrice?.toString() ?? ""}>
              <option value="">No max</option>
              {BUDGET_STEPS.map((b) => (
                <option key={b} value={b}>{fmt(b)}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="f-beds"><T k="filters.beds" /></Label>
            <Select id="f-beds" name="beds" defaultValue={filters.beds?.toString() ?? ""}>
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}+</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="f-furn"><T k="filters.furnished" /></Label>
            <Select id="f-furn" name="furnished" defaultValue={filters.furnished === undefined ? "" : filters.furnished ? "yes" : "no"}>
              <option value="">Any</option>
              <option value="yes">Furnished</option>
              <option value="no">Unfurnished</option>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="f-sort"><T k="filters.sort" /></Label>
          <Select id="f-sort" name="sort" defaultValue={filters.sort}>
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </Select>
        </div>
        <div className="flex gap-2 pt-1">
          <Button type="submit" className="flex-1"><T k="filters.apply" /></Button>
          <Button asChild variant="outline">
            <Link href="/listings"><T k="filters.reset" /></Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

export function countActiveFilters(f: ListingFilters): number {
  return [f.citySlug, f.areaText, f.type, f.minPrice, f.maxPrice, f.beds, f.furnished].filter((v) => v !== undefined).length;
}
