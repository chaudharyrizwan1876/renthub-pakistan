"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Shows a top progress bar (and, if it takes a moment, a small "Loading" chip) from the click on any
 * internal link / GET form until the next page has actually rendered.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const here = `${pathname}?${search}`;
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const loading = pendingFrom === here;

  useEffect(() => {
    const begin = () => setPendingFrom(`${location.pathname}?${location.search.replace(/^\?/, "")}`);

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(a.href, location.href);
      } catch {
        return;
      }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      begin();
    };
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement | null;
      if (!form || e.defaultPrevented) return;
      if ((form.method || "get").toLowerCase() === "get" && form.action.startsWith(location.origin)) begin();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
    };
  }, []);

  if (!loading) return null;
  return (
    <>
      <div role="progressbar" aria-label="Page loading" className="fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-primary/15">
        <div className="h-full w-1/3 rounded-full bg-primary [animation:progress-indeterminate_1.1s_ease-in-out_infinite]" />
      </div>
      <div
        role="status"
        className="fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium opacity-0 shadow-lg [animation:pop-in_0.25s_ease-out_0.35s_forwards]"
      >
        <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
        Loading...
      </div>
    </>
  );
}
