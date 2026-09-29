"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * - Adds data-scrolled to the site header once the page moves (CSS gives it a shadow).
 * - Shows a "back to top" button after scrolling down a screen or so.
 */
export function ScrollEffects() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      document.querySelector(".site-header")?.setAttribute("data-scrolled", y > 8 ? "true" : "false");
      setShowTop(y > 900);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      tabIndex={showTop ? 0 : -1}
      className={cn(
        // sits above the sticky mobile WhatsApp bar on listing pages
        "fixed bottom-24 end-4 z-30 flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:text-primary lg:bottom-6",
        showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <ArrowUp className="size-5" aria-hidden="true" />
    </button>
  );
}
