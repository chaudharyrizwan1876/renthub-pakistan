import { Search } from "lucide-react";
import { ALL_KNOWN_AREAS, BUDGET_STEPS, CITIES, PROPERTY_TYPES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { T } from "@/components/i18n/lang-provider";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";

export function SearchForm() {
  return (
    <form action="/listings" method="get" role="search" aria-label="Search rentals" className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_1fr_1fr_auto] lg:items-end">
      <div>
        <Label htmlFor="h-city"><T k="search.city" /></Label>
        <Select id="h-city" name="city" defaultValue="">
          <option value="">Any city</option>
          {CITIES.map((c) => (
            <option key={c.name} value={slugify(c.name)}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="h-area"><T k="search.area" /></Label>
        <Input id="h-area" name="area" list="hero-areas" placeholder="e.g. I-8, DHA Phase 2" autoComplete="off" maxLength={80} />
        <datalist id="hero-areas">
          {ALL_KNOWN_AREAS.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
      </div>
      <div>
        <Label htmlFor="h-type"><T k="search.type" /></Label>
        <Select id="h-type" name="type" defaultValue="">
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="h-budget"><T k="search.budget" /></Label>
        <Select id="h-budget" name="maxPrice" defaultValue="">
          <option value="">Any budget</option>
          {BUDGET_STEPS.map((b) => (
            <option key={b} value={b}>Up to Rs. {new Intl.NumberFormat("en-PK").format(b)}</option>
          ))}
        </Select>
      </div>
      <Button type="submit" size="lg" className="sm:col-span-2 lg:col-span-1">
        <Search className="size-5" aria-hidden="true" />
        <T k="search.submit" />
      </Button>
    </form>
  );
}
