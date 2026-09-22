"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export interface GalleryItem {
  url: string;
  type: "IMAGE" | "VIDEO";
}

export function Lightbox({
  items,
  index,
  setIndex,
  open,
  onOpenChange,
  title,
  onClose,
}: {
  items: GalleryItem[];
  index: number;
  setIndex: (i: number) => void;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  onClose: (i: number) => void;
}) {
  const touchX = useRef<number | null>(null);
  const item = items[index];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex(Math.min(items.length - 1, index + 1));
      if (e.key === "ArrowLeft") setIndex(Math.max(0, index - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, items.length, setIndex]);

  if (!item) return null;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) onClose(index);
      }}
    >
      <DialogContent
        overlayClassName="bg-black/95"
        className="h-[100dvh] w-screen max-w-none rounded-none border-0 bg-transparent p-0 shadow-none"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          Photo {index + 1} of {items.length}. Use arrow keys or swipe to navigate.
        </DialogDescription>
        <div
          className="relative size-full"
          onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            const start = touchX.current;
            touchX.current = null;
            if (start == null) return;
            const dx = (e.changedTouches[0]?.clientX ?? start) - start;
            if (Math.abs(dx) > 50) setIndex(dx < 0 ? Math.min(items.length - 1, index + 1) : Math.max(0, index - 1));
          }}
        >
          {item.type === "IMAGE" ? (
            <Image src={item.url} alt={`${title}, photo ${index + 1}`} fill sizes="100vw" className="object-contain" />
          ) : (
            <video src={item.url} controls autoPlay playsInline className="size-full object-contain" />
          )}
          {items.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous"
                onClick={() => setIndex(Math.max(0, index - 1))}
                disabled={index === 0}
                className="absolute start-3 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 disabled:opacity-30"
              >
                <ChevronLeft className="rtl-flip size-7" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={() => setIndex(Math.min(items.length - 1, index + 1))}
                disabled={index === items.length - 1}
                className="absolute end-3 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 disabled:opacity-30"
              >
                <ChevronRight className="rtl-flip size-7" aria-hidden="true" />
              </button>
            </>
          )}
          <p className="absolute bottom-4 start-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
            {index + 1} / {items.length}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
