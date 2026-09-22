"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { Check, ChevronLeft, ChevronRight, Loader2, Lock, Globe } from "lucide-react";
import { toast } from "sonner";
import { createListingAction, updateListingAction } from "@/actions/listings";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/form";
import { ALL_KNOWN_AREAS, AREA_UNITS, CITY_NAMES, FEATURES, PREFERRED_TENANTS, PROPERTY_TYPES, RESIDENTIAL_TYPES } from "@/lib/constants";
import { cn, formatPKR } from "@/lib/utils";
import { listingSchema, type ListingFormValues, type ListingInput } from "@/lib/validation";
import { MediaUploader } from "./media-uploader";

type Name = FieldPath<ListingFormValues>;

const STEPS: { title: string; fields: Name[] }[] = [
  { title: "Basic info", fields: ["title", "propertyType", "rentPerMonth", "securityDeposit", "description"] },
  { title: "Details", fields: ["bedrooms", "bathrooms", "areaSize", "areaUnit", "floor", "furnished", "features", "availableFrom", "preferredTenant"] },
  { title: "Location", fields: ["city", "area", "fullAddress", "streetNo", "houseNo", "latitude", "longitude"] },
  { title: "Contact", fields: ["ownerPhone", "ownerWhatsapp", "ownerEmail"] },
  { title: "Photos & video", fields: ["media"] },
  { title: "Review", fields: [] },
];

function PrivateNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
      <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function ListingForm({
  mode,
  listingId,
  defaultValues,
  successHref,
  isAdmin = false,
}: {
  mode: "create" | "edit";
  listingId?: string;
  defaultValues: ListingFormValues;
  successHref: string;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ListingFormValues, unknown, ListingInput>({
    resolver: zodResolver(listingSchema),
    defaultValues,
    mode: "onTouched",
  });
  const {
    register,
    control,
    watch,
    trigger,
    getValues,
    setError,
    setFocus,
    formState: { errors },
  } = form;

  const propertyType = watch("propertyType");
  const residential = RESIDENTIAL_TYPES.includes(propertyType);
  const last = step === STEPS.length - 1;

  const e = (n: Name) => (errors as Record<string, { message?: string } | undefined>)[n]?.message;
  const a11y = (n: Name) => ({ "aria-invalid": !!e(n), "aria-describedby": e(n) ? `${n}-error` : undefined });

  async function next() {
    const ok = await trigger(STEPS[step]!.fields);
    if (!ok) {
      const first = STEPS[step]!.fields.find((f) => e(f));
      if (first && first !== "media") setFocus(first);
      toast.error("Please fix the highlighted fields to continue.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit() {
    setFormError(null);
    start(async () => {
      // Full validation before sending; jump to the first step with an error.
      const valid = await trigger();
      if (!valid) {
        const idx = STEPS.findIndex((s) => s.fields.some((f) => e(f)));
        if (idx >= 0) setStep(idx);
        return setFormError("Some fields need attention. Please review the highlighted steps.");
      }
      const raw = getValues(); // raw (string) form values; the server validates them again
      const res = mode === "create" ? await createListingAction(raw) : await updateListingAction(listingId!, raw);
      if (!res.ok) {
        for (const [k, msg] of Object.entries(res.fieldErrors ?? {})) setError(k as Name, { message: msg });
        const idx = STEPS.findIndex((s) => s.fields.some((f) => res.fieldErrors?.[f]));
        if (idx >= 0) setStep(idx);
        return setFormError(res.error);
      }
      toast.success(mode === "create" ? `Listing ${res.publicId} submitted for review` : "Listing updated");
      router.push(mode === "create" ? `${successHref}?submitted=${res.publicId}` : successHref);
      router.refresh();
    });
  }

  const values = watch();

  return (
    <form
      noValidate
      onSubmit={(ev) => {
        ev.preventDefault();
        if (last) submit();
        else void next();
      }}
      className="space-y-6"
    >
      {/* Progress */}
      <nav aria-label="Progress">
        <ol className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {STEPS.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={s.title} className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={i > step}
                  onClick={() => setStep(i)}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium",
                    current && "border-primary bg-primary text-primary-foreground",
                    done && "border-primary/40 bg-primary-soft text-foreground",
                    !current && !done && "border-border text-muted-foreground",
                  )}
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-black/10 text-xs dark:bg-white/15">{done ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}</span>
                  <span className={cn(!current && "hidden sm:inline")}>{s.title}</span>
                </button>
                {i < STEPS.length - 1 && <span aria-hidden="true" className="h-px w-3 bg-border sm:w-5" />}
              </li>
            );
          })}
        </ol>
        <div className="mt-2 h-1.5 overflow-hidden rounded bg-muted" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </nav>

      {formError && <FormAlert>{formError}</FormAlert>}

      <section className="space-y-5 rounded-xl border border-border bg-card p-4 sm:p-6" aria-labelledby="step-title">
        <h2 id="step-title" className="text-lg font-bold">
          Step {step + 1}: {STEPS[step]!.title}
        </h2>

        {step === 0 && (
          <>
            <Field label="Listing title" htmlFor="title" error={e("title")} required hint="e.g. 2-bed furnished flat near market. Do not include phone numbers.">
              <Input id="title" maxLength={100} {...a11y("title")} {...register("title")} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Property type" htmlFor="propertyType" error={e("propertyType")} required>
                <Select id="propertyType" {...register("propertyType")}>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Rent per month (Rs.)" htmlFor="rentPerMonth" error={e("rentPerMonth")} required>
                <Input id="rentPerMonth" inputMode="numeric" placeholder="55000" {...a11y("rentPerMonth")} {...register("rentPerMonth")} />
              </Field>
            </div>
            <Field label="Security deposit (Rs.)" htmlFor="securityDeposit" error={e("securityDeposit")} hint="Optional">
              <Input id="securityDeposit" inputMode="numeric" {...a11y("securityDeposit")} {...register("securityDeposit")} />
            </Field>
            <Field label="Description" htmlFor="description" error={e("description")} required hint="Describe the property, surroundings and rules. No phone numbers, emails or links.">
              <Textarea id="description" rows={6} maxLength={3000} {...a11y("description")} {...register("description")} />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            {residential && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Bedrooms" htmlFor="bedrooms" error={e("bedrooms")}>
                  <Input id="bedrooms" inputMode="numeric" {...a11y("bedrooms")} {...register("bedrooms")} />
                </Field>
                <Field label="Bathrooms" htmlFor="bathrooms" error={e("bathrooms")}>
                  <Input id="bathrooms" inputMode="numeric" {...a11y("bathrooms")} {...register("bathrooms")} />
                </Field>
              </div>
            )}
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Area size" htmlFor="areaSize" error={e("areaSize")}>
                <Input id="areaSize" inputMode="decimal" {...a11y("areaSize")} {...register("areaSize")} />
              </Field>
              <Field label="Unit" htmlFor="areaUnit" error={e("areaUnit")}>
                <Select id="areaUnit" {...register("areaUnit")}>
                  <option value="">Select</option>
                  {AREA_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Floor" htmlFor="floor" error={e("floor")} hint="e.g. Ground, 2nd">
                <Input id="floor" maxLength={30} {...register("floor")} />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Preferred tenant" htmlFor="preferredTenant" error={e("preferredTenant")}>
                <Select id="preferredTenant" {...register("preferredTenant")}>
                  {PREFERRED_TENANTS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Available from" htmlFor="availableFrom" error={e("availableFrom")}>
                <Input id="availableFrom" type="date" {...register("availableFrom")} />
              </Field>
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-3">
              <input type="checkbox" className="size-5 accent-[var(--primary)]" {...register("furnished")} />
              <span className="font-medium">Furnished</span>
            </label>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Features &amp; amenities</legend>
              <Controller
                control={control}
                name="features"
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                    {FEATURES.map((f) => {
                      const checked = field.value.includes(f.value);
                      return (
                        <label key={f.value} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
                          <input
                            type="checkbox"
                            className="size-5 accent-[var(--primary)]"
                            checked={checked}
                            onChange={() => field.onChange(checked ? field.value.filter((v) => v !== f.value) : [...field.value, f.value])}
                          />
                          {f.label}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            </fieldset>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-4 rounded-lg border border-primary/30 bg-primary-soft/40 p-4">
              <h3 className="flex items-center gap-2 font-semibold"><Globe className="size-4" aria-hidden="true" /> Public location (shown on the website)</h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="City" htmlFor="city" error={e("city")} required>
                  <Input id="city" list="city-list" autoComplete="off" {...a11y("city")} {...register("city")} />
                  <datalist id="city-list">{CITY_NAMES.map((c) => <option key={c} value={c} />)}</datalist>
                </Field>
                <Field label="Area / sector / society" htmlFor="area" error={e("area")} required hint="e.g. I-8, DHA Phase 2, Johar Town">
                  <Input id="area" list="area-list" autoComplete="off" {...a11y("area")} {...register("area")} />
                  <datalist id="area-list">{ALL_KNOWN_AREAS.map((c) => <option key={c} value={c} />)}</datalist>
                </Field>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-amber-300/70 p-4 dark:border-amber-700/70">
              <h3 className="flex items-center gap-2 font-semibold"><Lock className="size-4" aria-hidden="true" /> Private address</h3>
              <PrivateNote>
                <strong>This will not be shown publicly.</strong> Only our admin team can see the full address; it is shared with a tenant only when a visit is arranged.
              </PrivateNote>
              <Field label="Complete address" htmlFor="fullAddress" error={e("fullAddress")} required>
                <Textarea id="fullAddress" rows={3} maxLength={300} className="min-h-20" {...a11y("fullAddress")} {...register("fullAddress")} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Street no." htmlFor="streetNo" error={e("streetNo")}>
                  <Input id="streetNo" maxLength={40} {...register("streetNo")} />
                </Field>
                <Field label="House / flat no." htmlFor="houseNo" error={e("houseNo")}>
                  <Input id="houseNo" maxLength={40} {...register("houseNo")} />
                </Field>
                <Field label="Latitude (optional)" htmlFor="latitude" error={e("latitude")} hint="From Google Maps, e.g. 33.6844">
                  <Input id="latitude" inputMode="decimal" {...a11y("latitude")} {...register("latitude")} />
                </Field>
                <Field label="Longitude (optional)" htmlFor="longitude" error={e("longitude")} hint="e.g. 73.0479">
                  <Input id="longitude" inputMode="decimal" {...a11y("longitude")} {...register("longitude")} />
                </Field>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <PrivateNote>
              <strong>This will not be shown publicly.</strong> Tenants only ever contact our team. Your details are used by our admin to reach you about enquiries and viewings.
            </PrivateNote>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Owner phone" htmlFor="ownerPhone" error={e("ownerPhone")} required hint="e.g. 0300 1234567">
                <Input id="ownerPhone" type="tel" inputMode="tel" {...a11y("ownerPhone")} {...register("ownerPhone")} />
              </Field>
              <Field label="Owner WhatsApp" htmlFor="ownerWhatsapp" error={e("ownerWhatsapp")} hint="Leave empty if same as phone">
                <Input id="ownerWhatsapp" type="tel" inputMode="tel" {...a11y("ownerWhatsapp")} {...register("ownerWhatsapp")} />
              </Field>
            </div>
            <Field label="Owner email (optional)" htmlFor="ownerEmail" error={e("ownerEmail")}>
              <Input id="ownerEmail" type="email" {...a11y("ownerEmail")} {...register("ownerEmail")} />
            </Field>
          </>
        )}

        {step === 4 && (
          <Controller
            control={control}
            name="media"
            render={({ field }) => <MediaUploader value={field.value} onChange={field.onChange} error={e("media")} />}
          />
        )}

        {step === 5 && <ReviewStep values={values} />}
      </section>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" size="lg" disabled={step === 0 || pending} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          <ChevronLeft className="rtl-flip size-4" aria-hidden="true" /> Back
        </Button>
        {last ? (
          <Button type="submit" size="lg" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {mode === "create" ? "Submit for review" : "Save changes"}
          </Button>
        ) : (
          <Button type="submit" size="lg">
            Next <ChevronRight className="rtl-flip size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      {last && mode === "edit" && !isAdmin && (
        <p className="text-center text-sm text-muted-foreground">Saving changes to a live listing sends it back to our team for a quick re-review.</p>
      )}
    </form>
  );
}

function ReviewStep({ values }: { values: ListingFormValues }) {
  const cover = values.media.find((m) => m.type === "IMAGE");
  const row = (k: string, v: string) => (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-end font-medium">{v || "-"}</dd>
    </div>
  );
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-primary/30 p-4">
          <h3 className="flex items-center gap-2 font-semibold"><Globe className="size-4" aria-hidden="true" /> What tenants will see</h3>
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.url} alt="Cover" className="aspect-[4/3] w-full rounded-lg object-cover" />
          )}
          <dl className="text-sm">
            {row("Title", values.title)}
            {row("Type", PROPERTY_TYPES.find((t) => t.value === values.propertyType)?.label ?? "")}
            {row("Rent", values.rentPerMonth ? formatPKR(Number(values.rentPerMonth)) : "")}
            {row("Location", [values.area, values.city].filter(Boolean).join(", "))}
            {row("Photos / videos", `${values.media.filter((m) => m.type === "IMAGE").length} / ${values.media.filter((m) => m.type === "VIDEO").length}`)}
          </dl>
        </div>
        <div className="space-y-3 rounded-lg border border-amber-300/70 p-4 dark:border-amber-700/70">
          <h3 className="flex items-center gap-2 font-semibold"><Lock className="size-4" aria-hidden="true" /> Private (admin only)</h3>
          <dl className="text-sm">
            {row("Address", values.fullAddress)}
            {row("House / street", [values.houseNo, values.streetNo].filter(Boolean).join(" / "))}
            {row("Phone", values.ownerPhone)}
            {row("WhatsApp", values.ownerWhatsapp)}
            {row("Email", values.ownerEmail)}
          </dl>
        </div>
      </div>
      <FormAlert tone="info">After you submit, your listing is reviewed by our team (usually within 24 hours) and appears on the website once approved.</FormAlert>
    </div>
  );
}
