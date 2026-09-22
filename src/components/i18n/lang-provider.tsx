"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { dict, type DictKey, type Lang } from "@/lib/i18n/dict";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
}

const LangContext = createContext<LangContextValue | null>(null);
const STORAGE_KEY = "rh-lang";
const listeners = new Set<() => void>();
let memoryLang: Lang | null = null; // fallback when localStorage is blocked

function readLang(): Lang {
  if (memoryLang) return memoryLang;
  try {
    return localStorage.getItem(STORAGE_KEY) === "ur" ? "ur" : "en";
  } catch {
    return "en";
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function apply(lang: Lang) {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === "ur" ? "rtl" : "ltr";
}

/**
 * Client-side language toggle. It deliberately does NOT use cookies/headers so public pages stay
 * statically cached (ISR). Server-rendered HTML is English; the tiny inline script in <head>
 * sets lang/dir before paint and this provider swaps the UI strings after hydration.
 */
export function LangProvider({ children }: { children: React.ReactNode }) {
  // Server + hydration render "en"; the real value is read from localStorage right after hydration.
  const lang = useSyncExternalStore(subscribe, readLang, () => "en" as Lang);

  const setLang = useCallback((l: Lang) => {
    memoryLang = l;
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage unavailable: language applies for this page view only */
    }
    listeners.forEach((cb) => cb());
  }, []);

  // Keep <html lang/dir> in sync (also covers the initial hydration of an Urdu user)
  useEffect(() => apply(lang), [lang]);

  const value = useMemo<LangContextValue>(() => ({ lang, setLang, t: (key) => dict[lang][key] ?? dict.en[key] }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}

/** Inline translated text usable from Server Components: <T k="hero.title" /> */
export function T({ k }: { k: DictKey }) {
  return <>{useLang().t(k)}</>;
}

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useLang();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "ur" : "en")}
      className={className}
      aria-label={`${t("lang.toggle")}: ${lang === "en" ? "switch to Urdu" : "switch to English"}`}
      lang={lang === "en" ? "ur" : "en"}
    >
      {t("lang.toggle")}
    </button>
  );
}
