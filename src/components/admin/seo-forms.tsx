"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { refreshSitemapAction, saveRobotsAction } from "@/actions/seo";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Textarea } from "@/components/ui/form";

export function RefreshSitemapButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await refreshSitemapAction();
          if (r.ok) {
            toast.success("Sitemap refreshed");
            router.refresh();
          } else toast.error(r.error);
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
      Refresh sitemap
    </Button>
  );
}

export function RobotsForm({ initial }: { initial: { disallow: string; sitemaps: string; blockAll: boolean } }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setFormError(null);
        setErrors({});
        start(async () => {
          const r = await saveRobotsAction(v);
          if (!r.ok) {
            setErrors(r.fieldErrors ?? {});
            return setFormError(r.error);
          }
          toast.success("robots.txt updated");
          router.refresh();
        });
      }}
    >
      {formError && <FormAlert>{formError}</FormAlert>}
      <Field label="Extra paths to block (one per line)" htmlFor="disallow" error={errors.disallow} hint="Example: /private-page. The admin, dashboard, API and login pages are always blocked.">
        <Textarea id="disallow" rows={4} value={v.disallow} onChange={(e) => setV({ ...v, disallow: e.target.value })} aria-invalid={!!errors.disallow} placeholder="/old-page" />
      </Field>
      <Field label="Extra sitemap URLs (one per line)" htmlFor="sitemaps" error={errors.sitemaps} hint="Optional. Your main sitemap is always included.">
        <Textarea id="sitemaps" rows={3} value={v.sitemaps} onChange={(e) => setV({ ...v, sitemaps: e.target.value })} aria-invalid={!!errors.sitemaps} placeholder="https://example.com/other-sitemap.xml" />
      </Field>
      <label className="flex min-h-11 cursor-pointer items-start gap-3">
        <input type="checkbox" className="mt-1 size-5 accent-[var(--primary)]" checked={v.blockAll} onChange={(e) => setV({ ...v, blockAll: e.target.checked })} />
        <span>
          <span className="font-medium">Block search engines from the whole site</span>
          <span className="block text-sm text-muted-foreground">Only for a test or staging site. Turn this off for the live website, or Google will not list you.</span>
        </span>
      </label>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}Save robots.txt
      </Button>
    </form>
  );
}
