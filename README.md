# Pakistan Rents: rental listing marketplace

A production-ready rental marketplace for Pakistan built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma + PostgreSQL · Auth.js v5 · Zod · React Hook Form · Cloudinary**.

Tenants browse **without an account** and every enquiry goes to **one admin WhatsApp number**. Owners list properties (reviewed by the admin before going live). The admin sees everything — including private owner/address data — and connects tenant and owner in person.

| Role | Access |
| --- | --- |
| Visitor / tenant | Browse, filter, view listings, tap the WhatsApp button (logged as an *Inquiry*). No signup. |
| Owner (`OWNER`) | Sign up / log in at `/login`, manage own listings at `/dashboard`. |
| Admin (`ADMIN`) | Separate portal at `/admin/login` → `/admin`. Seeded from env, no public signup. |

---

## 1. Architecture

```
prisma/                 schema.prisma, migrations/, seed.ts
scripts/                dev-db.mjs (embedded Postgres), verify-privacy.ts (live leak audit)
tests/                  vitest: validation + privacy guarantees
src/
  proxy.ts              Next 16 "proxy" (ex-middleware): route gating for /admin, /dashboard, /login
  auth.ts, auth.config.ts   Auth.js (credentials, JWT). Rate-limited, separate owner/admin portals
  lib/
    listings/public.ts  ★ the ONLY data path for public pages: explicit select + PublicListing DTO
    listings/private.ts owner/admin-only reads (server-only)
    admin/queries.ts    admin-only queries (server-only)
    validation.ts       Zod schemas (shared by client forms and server actions) + contact-info detector
    storage.ts, image.ts  Cloudinary/local storage, sharp: EXIF strip, resize, watermark, magic-byte sniffing
    rate-limit.ts       Upstash Redis or in-memory fixed window
    authz.ts            requireRole() / requirePage helpers - re-checks role in the DB on every call
    seo.ts              metadata + JSON-LD builders
  actions/              Server Actions: auth, listings (owner), admin
  app/
    (public)/           home, listings, listings/[slug], rent/[city]/[segment], about, contact, terms, privacy
    (auth)/             login, signup, forgot/reset password
    dashboard/          owner area
    admin/(panel)/      admin dashboard;  admin/login is outside the group (public)
    api/                auth, inquiry, upload, upload/sign, admin/deals/export
  components/           ui/, listing/, layout/, dashboard/, admin/, seo/, i18n/
```

### Key design decisions
* **Private data lives in a separate table (`ListingPrivate`, 1:1).** `db.listing.findMany()` can never return an address or phone number; leaking requires an explicit join. Public queries use `publicListingSelect` and a whitelist mapper `toPublicListing()`.
* **Public pages are ISR-cached** (`revalidate`) and use no cookies/headers. The English/Urdu toggle is therefore client-side (localStorage + `<html dir>`), not cookie-based, so caching isn't lost.
* **Filters are a plain GET `<form>`** → shareable, crawlable, works without JavaScript. Filtered URLs are `noindex` with canonical `/listings`; SEO landing pages (`/rent/...`) are indexed.
* **Owner cannot be bypassed:** phone numbers, emails and links are rejected in titles/descriptions; photos are re-encoded with metadata removed and watermarked.
* **Role checks in 3 layers:** `proxy.ts` → page-level `requireAdminPage/requireOwnerPage` → every server action/route handler `requireRole()` (which re-reads the user's role from the DB, so a stale JWT can't keep access).
* **Edits by an owner to an approved/rejected listing return it to `PENDING`**; admin edits keep the status.
* Videos are **optional (0–2)**, photos 1–15. Videos upload direct to Cloudinary using a signed request (bypasses the 4.5 MB serverless body limit); photos are compressed in the browser, then processed by the server.

---

## 2. Local setup

Requirements: Node 20+ (tested on 24), npm. No Docker needed.

```bash
npm install
cp .env.example .env            # then edit (see below)
npm run db:local                # terminal 1: starts an embedded Postgres on :5433 (keep it running)
npx prisma migrate deploy       # terminal 2: create tables
npm run db:seed                 # creates the admin (+ sample data if SEED_SAMPLE_DATA=true)
npm run dev                     # http://localhost:3000
```

Minimum `.env` for local development: `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (≥10 chars). Everything else has a development fallback (uploads go to `public/uploads`, reset e-mails print to the console).

Using your own Postgres instead? Point `DATABASE_URL` at it and skip `db:local`.

**Logins** (with `SEED_SAMPLE_DATA=true`): admin → `/admin/login` with your `ADMIN_EMAIL`/`ADMIN_PASSWORD`; demo owner → `/login` with `ali.owner@example.com` / `Owner@12345`.

### Scripts
| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck`, `npm run lint` | TypeScript, ESLint |
| `npm test` | Unit tests (validation, anti-bypass, DTO privacy, client/server boundary) |
| `npm run verify:privacy` | Crawls the **running** site as an anonymous visitor (HTML + RSC payloads) and fails if any private DB value appears |
| `npm run db:migrate` / `db:deploy` / `db:seed` / `db:studio` | Prisma |

---

## 3. Deploying to Vercel

1. **Database** – create a Postgres DB (Neon, Supabase or Vercel Postgres). Copy the *pooled* connection string.
2. **Cloudinary** – create a free account; copy cloud name, API key and secret. (Optional but recommended: Settings → Upload → restrict formats, and set a max video size.)
3. **Upstash Redis** (optional but recommended) – create a database and copy the REST URL + token, so rate limits work across serverless instances.
4. **Resend** (optional) – for password-reset e-mails; verify your sending domain.
5. Push this repo to GitHub → **Import in Vercel**. Add every variable from `.env.example` (set `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`, a strong `AUTH_SECRET`, `SEED_SAMPLE_DATA=false`).
6. Run migrations and seed the admin **once** from your machine against the production DB:
   ```bash
   DATABASE_URL="<prod url>" npx prisma migrate deploy
   DATABASE_URL="<prod url>" ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed
   ```
   (or add `prisma migrate deploy` to the Vercel build command: `prisma migrate deploy && next build`).
7. Deploy. Submit `https://yourdomain.com/sitemap.xml` in Google Search Console.
8. Change the seeded admin password after first login if you used a temporary one (re-run seed with a new `ADMIN_PASSWORD` to reset it).

> **Set your real domain in `NEXT_PUBLIC_SITE_URL`** – it is used in canonical URLs, the sitemap, JSON-LD and the link inside every WhatsApp message.

---

## 4. Security notes
* Passwords: bcrypt (cost 12); rules enforced client + server. Sessions: signed JWT in HttpOnly, SameSite=Lax, `Secure` (on HTTPS) cookies.
* CSRF: Server Actions enforce same-origin; Auth.js has its own CSRF token; JSON/multipart route handlers require a matching `Origin` header.
* Rate limits: login (per IP and per identifier), signup, forgot/reset password, listing creation, uploads, inquiry logging.
* Uploads: type by **magic bytes** (not extension/MIME), size caps, pixel-count cap, EXIF/GPS stripped, re-encoded to WebP, watermarked; only URLs from your Cloudinary account (or `/uploads`, dev only) may be attached to a listing.
* No enumeration: forgot-password always answers identically; login errors are generic and constant-time.
* CSV export neutralises spreadsheet formula injection. JSON-LD escapes `<`.
* Security headers (HSTS, nosniff, frame, referrer, permissions policy) via `next.config.ts`. `/admin`, `/dashboard` are `no-store` + `noindex`.
* Logs never contain passwords, tokens or personal data.
* A strict Content-Security-Policy is **not** enabled (Next.js inline scripts require a nonce setup); add one if your threat model needs it.

---

## 5. Known limitations / next steps
* Without Upstash, rate limits are per-instance (fine locally, weaker on serverless).
* Owner phone/email are stored in plain text (needed operationally by the admin). Encrypt at rest at the DB level if required.
* Urdu covers the site chrome (navigation, hero, filters, buttons, footer). Listing text is shown as written by owners.
* Privacy Policy and Terms are templates – have them reviewed for your legal entity before launch.

---

## 6. Blog, SEO admin, theme and motion
* **Blog** (`/blog`, `/blog/[slug]`): articles are stored in the database (`Post`) and written in Markdown from **Admin > Blog** (draft / publish, cover image, own SEO title and description). Output is sanitised, has `BlogPosting` structured data, breadcrumbs, related posts and is added to the sitemap automatically. `npm run db:seed` adds 5 starter articles when the blog is empty.
* **Admin > SEO (sitemap)**: shows every URL in `sitemap.xml` grouped by type, a "Refresh sitemap" button, and lets you add extra `Disallow` paths, extra sitemap URLs or block the whole site (staging) in `robots.txt`. Settings live in the `SiteSetting` table.
* **Light / dark mode**: toggle in every header; remembers the choice, otherwise follows the device setting, and applies before first paint (no flash).
* **Loading feedback**: a top progress bar and a small "Loading" chip appear from the moment any link or search is clicked until the next page is ready; dashboards and admin have skeleton loaders.
* **Animations**: page fade, scroll reveal, card lift, button press. All are switched off automatically for visitors who prefer reduced motion.
* After pulling these changes run `npx prisma migrate deploy` (adds the `Post` and `SiteSetting` tables) and `npm run db:seed`.
