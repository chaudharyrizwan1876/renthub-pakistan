"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  src: string;
  alt: string;
}

const INTERVAL_MS = 5000;

/**
 * Top-of-page hero image slider.
 * - The first slide renders immediately (priority, no fade-in delay) so it is what visitors see first.
 * - The rest then rotate automatically every 5s, with a soft crossfade.
 * - Pauses on hover/focus and when the tab is hidden; stays still for prefers-reduced-motion.
 */
const GRADIENTS = [
  "from-teal-700 to-emerald-500",
  "from-indigo-700 to-sky-500",
  "from-amber-700 to-orange-500",
  "from-rose-700 to-pink-500",
  "from-violet-700 to-fuchsia-500",
];

export function HeroSlider({ slides, className }: { slides: HeroSlide[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    if (paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onVisibility = () => {
      if (document.hidden) clear();
      else {
        clear();
        timer.current = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
      }
    };
    timer.current = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clear();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [slides.length, paused, clear]);

  if (slides.length === 0) return null;

  return (
    <div
      className={cn("group relative isolate overflow-hidden", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured properties"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          aria-hidden={i !== index}
          className={cn("absolute inset-0 transition-opacity duration-[1200ms] ease-out", i === index ? "opacity-100" : "opacity-0")}
        >
          {failed.has(slide.src) ? (
            // Placeholder shown until a real photo is added at this path (see the hero images guide)
            <div className={cn("size-full bg-gradient-to-br", GRADIENTS[i % GRADIENTS.length])} />
          ) : (
            <Image
              src={slide.src}
              alt={i === 0 ? slide.alt : ""}
              fill
              sizes="100vw"
              className="object-cover"
              onError={() => setFailed((s) => new Set(s).add(slide.src))}
              {...(i === 0 ? { preload: true } : { loading: "lazy" })}
            />
          )}
        </div>
      ))}
      {/* Readability gradient for text placed on top of the slider */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" />

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2" role="tablist" aria-label="Slides">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show slide ${i + 1} of ${slides.length}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
