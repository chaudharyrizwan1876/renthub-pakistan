"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Play } from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

import type { GalleryItem } from "./lightbox";
export type { GalleryItem } from "./lightbox";

// The lightbox (and Radix Dialog) is only downloaded when a visitor opens a photo.
const Lightbox = dynamic(() => import("./lightbox").then((m) => m.Lightbox), { ssr: false });

/**
 * Swipeable gallery: native CSS scroll-snap (smooth touch swipe, zero JS gesture code),
 * thumbnail strip, keyboard arrows, and a full-screen lightbox. Videos use the native player.
 */
export function Gallery({ items, title }: { items: GalleryItem[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const goTo = useCallback((i: number) => {
    const el = scroller.current;
    if (!el) return;
    const next = Math.max(0, Math.min(items.length - 1, i));
    el.scrollTo({ left: next * el.clientWidth * (document.documentElement.dir === "rtl" ? -1 : 1), behavior: "smooth" });
    setIndex(next);
  }, [items.length]);

  function onScroll() {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = scroller.current;
      if (!el || !el.clientWidth) return;
      setIndex(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
    });
  }

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  if (items.length === 0) {
    return <div className="flex aspect-[16/10] items-center justify-center rounded-xl bg-muted text-5xl">🏠</div>;
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-muted">
        <div
          ref={scroller}
          onScroll={onScroll}
          role="group"
          aria-roledescription="carousel"
          aria-label={`${title}, photos and videos`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") goTo(index + (document.documentElement.dir === "rtl" ? -1 : 1));
            if (e.key === "ArrowLeft") goTo(index + (document.documentElement.dir === "rtl" ? 1 : -1));
          }}
          className="no-scrollbar flex aspect-[16/10] snap-x snap-mandatory overflow-x-auto scroll-smooth"
        >
          {items.map((it, i) => (
            <div
              key={it.url}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${items.length}`}
              className="relative size-full shrink-0 basis-full snap-center"
            >
              {it.type === "IMAGE" ? (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="relative block size-full cursor-zoom-in"
                  aria-label={`Open photo ${i + 1} full screen`}
                >
                  <Image
                    src={it.url}
                    alt={`${title}, photo ${i + 1}`}
                    fill
                    sizes="(min-width:1024px) 66vw, 100vw"
                    className="object-cover"
                    {...(i === 0 ? { preload: true } : { loading: "lazy" })}
                  />
                </button>
              ) : (
                <video src={it.url} controls preload="metadata" playsInline className="size-full bg-black object-contain" aria-label={`${title}, video`} />
              )}
            </div>
          ))}
        </div>

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous photo"
              disabled={index === 0}
              className="absolute start-2 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75 disabled:opacity-30 sm:flex"
            >
              <ChevronLeft className="rtl-flip size-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next photo"
              disabled={index === items.length - 1}
              className="absolute end-2 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75 disabled:opacity-30 sm:flex"
            >
              <ChevronRight className="rtl-flip size-6" aria-hidden="true" />
            </button>
          </>
        )}
        <div className="pointer-events-none absolute bottom-2 end-2 flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-xs font-medium text-white">
          <Maximize2 className="size-3.5" aria-hidden="true" />
          {index + 1} / {items.length}
        </div>
      </div>

      {items.length > 1 && (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto pb-1" aria-label="Thumbnails">
          {items.map((it, i) => (
            <li key={it.url} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show ${it.type === "VIDEO" ? "video" : "photo"} ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "relative block h-14 w-20 overflow-hidden rounded-lg border-2 bg-muted sm:h-16 sm:w-24",
                  i === index ? "border-primary" : "border-transparent opacity-75 hover:opacity-100",
                )}
              >
                {it.type === "IMAGE" ? (
                  <Image src={it.url} alt="" fill sizes="96px" className="object-cover" loading="lazy" />
                ) : (
                  <span className="flex size-full items-center justify-center bg-black text-white">
                    <Play className="size-6" aria-hidden="true" />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && <Lightbox items={items} index={index} setIndex={setIndex} open={open} onOpenChange={setOpen} title={title} onClose={(i) => goTo(i)} />}
    </div>
  );
}
