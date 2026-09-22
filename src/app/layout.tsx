import type { Metadata, Viewport } from "next";
import { Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import { LangProvider } from "@/components/i18n/lang-provider";
import { Suspense } from "react";
import { RouteProgress } from "@/components/ui/route-progress";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";
import "./globals.css";

// "optional": no late font-swap repaint (keeps LCP at first paint); Inter is used when it loads fast, e.g. on repeat visits.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "optional" });
// Only downloaded by browsers when Urdu glyphs are actually rendered.
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ["arabic"], variable: "--font-nastaliq", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: Property for Rent in Pakistan`, template: `%s | ${SITE.name}` },
  description: SITE.tagline,
  applicationName: SITE.name,
  keywords: [...SITE.keywords],
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE.name, locale: "en_PK", url: SITE.url },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f766e" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

// Before first paint: marks JS as available, applies the saved/system theme and the saved language (no flash).
const langScript = `try{var d=document.documentElement;d.classList.add("js");var t=localStorage.getItem("rh-theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.dataset.theme=t;var l=localStorage.getItem("rh-lang");if(l==="ur"){d.lang="ur";d.dir="rtl"}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" data-scroll-behavior="smooth" className={`${inter.variable} ${nastaliq.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: langScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:start-4 focus:top-4">
          Skip to content
        </a>
        <LangProvider>{children}</LangProvider>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      </body>
    </html>
  );
}
