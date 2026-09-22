# Launch checklist — verified results

Everything marked ✅ was verified on this codebase (production build, local Postgres). Items marked ⚠️ need action on **your** side before/after launch.

## Privacy
| | Requirement | How it is enforced / verified |
| --- | --- | --- |
| ✅ | Private fields never reach public HTML / JSON / client bundle | Private data is in a separate table (`ListingPrivate`); public reads use `publicListingSelect` + whitelist mapper `toPublicListing()` |
| ✅ | Proven by test | `tests/privacy.test.ts` (DTO, JSON-LD, WhatsApp URL, client/server import boundary) — 34 tests pass |
| ✅ | Proven on the running site | `npm run verify:privacy` crawls 93 responses (HTML **and** RSC payloads) as an anonymous visitor against 87 private DB values → **PASS** |
| ✅ | Unapproved listings not public | PENDING / REJECTED / RENTED listing URLs return a real **404** (audited) |
| ✅ | Only admin (and the owner for own data) can read private data | Page guards + `requireRole()` in every action/route; owners get 404 for other owners' listings; DB role re-checked on each call |
| ✅ | Owners can't smuggle contact info | Phone/email/link/"digits in words" rejected in title, description, area (unit-tested) |
| ✅ | EXIF/GPS stripped, watermark applied | Verified on an uploaded image: WebP, 1920px, no EXIF/ICC/XMP, corner + faint centre watermark |
| ✅ | Privacy of inquiry logging | An `Inquiry` stores only listing, source and time — no IP, name or number |

## Security
| | |
| --- | --- |
| ✅ | Role gating in `proxy.ts` **and** pages **and** every server action/route (owner blocked from `/admin`, `/api/admin/*` → 403; owner rejected at admin portal) |
| ✅ | Same-origin check on JSON/multipart routes (cross-origin & missing-Origin POST → 403, tested) |
| ✅ | Rate limits: login (IP + identifier), signup, forgot/reset, create-listing, upload, inquiry |
| ✅ | Uploads validated by magic bytes + size + pixel cap; media URLs restricted to your Cloudinary / local path |
| ✅ | Passwords bcrypt(12), strength rules; reset tokens hashed, single-use, 1 h expiry; no user enumeration |
| ✅ | Security headers (HSTS, nosniff, frame, referrer, permissions); `/admin` & `/dashboard` `no-store` + `noindex` |
| ⚠️ | Set a strong `AUTH_SECRET` and a long admin password; keep `SEED_SAMPLE_DATA=false` in production |
| ⚠️ | Configure Upstash Redis so rate limits are shared across serverless instances |
| ⚠️ | Strict CSP not enabled (needs nonce setup) — add if required |

## SEO
| | |
| --- | --- |
| ✅ | Server-rendered + ISR (`revalidate`) home, listing, landing pages; exactly **one `<h1>`** per page (checked on 14 pages × 4 widths) |
| ✅ | `generateMetadata` on every public page: unique title/description, canonical, Open Graph, Twitter cards (listing cover image) |
| ✅ | JSON-LD: Organization, WebSite+SearchAction, BreadcrumbList, FAQPage, ItemList, RealEstateListing + Product/Offer (public data only) |
| ✅ | Dynamic `sitemap.xml` (listings, cities, areas, city×type) and `robots.txt` (disallows `/admin /dashboard /api` + auth pages) |
| ✅ | Landing pages `/rent/[city]`, `/rent/[city]/[area]`, `/rent/[city]/[type]` with unique title/H1/intro/stats/internal links; empty ones are `noindex` |
| ✅ | Filtered `/listings?…` URLs are `noindex` with canonical to `/listings` (no duplicate-content) |
| ✅ | Clean slugs (`flat-for-rent-in-g-13-islamabad-rh-10015`), breadcrumbs, `next/image` (AVIF/WebP, `sizes`, lazy), `next/font` |
| ✅ | Roman-Urdu/Urdu-friendly keywords; English/Urdu toggle with RTL and Noto Nastaliq Urdu |
| ✅ | **Lighthouse (production build, local):** SEO 100, Accessibility 100, Best Practices 100 on home / listings / detail / landing (mobile & desktop). Performance: desktop 98–100; mobile 82–96 (varies run-to-run under Lighthouse's simulated slow-4G, CLS 0, TBT < 220 ms) |
| ⚠️ | Set `NEXT_PUBLIC_SITE_URL` to your real domain (canonicals, sitemap, WhatsApp link); submit sitemap in Search Console; re-run Lighthouse on your deployed URL (results on a CDN will differ) |

## Responsive & UX
| | |
| --- | --- |
| ✅ | 14 pages × 360 / 768 / 1024 / 1440 px = 56 checks: **no horizontal overflow** |
| ✅ | Mobile-first: sticky WhatsApp bar on listing pages, CSS-only filter drawer, swipeable scroll-snap gallery + lightbox, tables collapse to cards |
| ✅ | Skeleton loaders, empty states, error boundary, 404 page, toasts, inline field errors (`aria-invalid`/`aria-describedby`/`role=alert`) |
| ✅ | Accessible: skip link, landmarks, keyboard-operable gallery/menus/forms, visible focus, ≥44px touch targets, reduced-motion respected, AA colour contrast (light + dark) |
| ✅ | Contact button on **every** card and detail page → `wa.me/923295780676?text=…` with the required message; click logged as an Inquiry |

## Functional walkthrough (done end-to-end in a browser)
Owner login → 6-step Add Listing (validation blocked a phone number in the title, blocked submit with no photo, uploaded 3 large images) → `RH-10015` created as PENDING → admin login → global ID search → admin sees private address/phone with Call/WhatsApp buttons → Approve → public page live, with no private data.

## Before you go live
1. Create Postgres + Cloudinary (+ Upstash, Resend) and fill in the Vercel environment variables (`.env.example`).
2. `prisma migrate deploy`, then seed the admin with your own credentials.
3. Have the Privacy Policy and Terms pages reviewed for your legal entity.
4. Replace `public/icon.svg` / add an Open Graph default image with your brand if desired.
