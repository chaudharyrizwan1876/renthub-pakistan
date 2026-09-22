"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createDealAction, deleteDealAction, updateDealStatusAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/form";
import { DEAL_STATUS_LABEL } from "@/lib/constants";
import { dealSchema } from "@/lib/validation";
import type { z } from "zod";

type DealValues = z.input<typeof dealSchema>;

export function DealForm({ listings }: { listings: { id: string; publicId: string; title: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<DealValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: { listingId: "", tenantName: "", tenantPhone: "", commissionAmount: "", status: "IN_PROGRESS", notes: "" },
  });
  const inv = (k: keyof DealValues) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${k}-error` : undefined });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((v) =>
        start(async () => {
          setFormError(null);
          const res = await createDealAction(v);
          if (!res.ok) {
            for (const [k, m] of Object.entries(res.fieldErrors ?? {})) setError(k as keyof DealValues, { message: m });
            return setFormError(res.error);
          }
          toast.success("Deal recorded");
          reset();
          router.refresh();
        }),
      )}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {formError && <div className="sm:col-span-2 lg:col-span-3"><FormAlert>{formError}</FormAlert></div>}
      <Field label="Listing (ID or select)" htmlFor="listingId" error={errors.listingId?.message} required>
        <Input id="listingId" list="deal-listings" placeholder="RH-10245" autoComplete="off" {...inv("listingId")} {...register("listingId")} />
        <datalist id="deal-listings">
          {listings.map((l) => <option key={l.id} value={l.publicId}>{l.title}</option>)}
        </datalist>
      </Field>
      <Field label="Tenant name" htmlFor="tenantName" error={errors.tenantName?.message} required>
        <Input id="tenantName" {...inv("tenantName")} {...register("tenantName")} />
      </Field>
      <Field label="Tenant phone" htmlFor="tenantPhone" error={errors.tenantPhone?.message} required>
        <Input id="tenantPhone" type="tel" inputMode="tel" {...inv("tenantPhone")} {...register("tenantPhone")} />
      </Field>
      <Field label="Commission (Rs.)" htmlFor="commissionAmount" error={errors.commissionAmount?.message} required>
        <Input id="commissionAmount" inputMode="numeric" {...inv("commissionAmount")} {...register("commissionAmount")} />
      </Field>
      <Field label="Status" htmlFor="status" error={errors.status?.message}>
        <Select id="status" {...register("status")}>
          {Object.entries(DEAL_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </Field>
      <Field label="Notes" htmlFor="notes" error={errors.notes?.message} className="sm:col-span-2 lg:col-span-3">
        <Textarea id="notes" rows={2} className="min-h-16" {...register("notes")} />
      </Field>
      <div className="sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending}>{pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}Record deal</Button>
      </div>
    </form>
  );
}

export function DealRowActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-end gap-2">
      <label className="sr-only" htmlFor={`deal-status-${id}`}>Deal status</label>
      <Select
        id={`deal-status-${id}`}
        defaultValue={status}
        disabled={pending}
        className="min-h-9 w-44 text-xs sm:min-h-9"
        onChange={(e) =>
          start(async () => {
            const res = await updateDealStatusAction(id, e.target.value);
            if (res.ok) {
              toast.success("Status updated");
              router.refresh();
            } else toast.error(res.error);
          })
        }
      >
        {Object.entries(DEAL_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </Select>
      <Button
        variant="ghost"
        size="icon"
        className="size-9 text-danger sm:size-9"
        aria-label="Delete deal"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this deal record?")) return;
          start(async () => {
            const res = await deleteDealAction(id);
            if (res.ok) {
              toast.success("Deal deleted");
              router.refresh();
            } else toast.error(res.error);
          });
        }}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
