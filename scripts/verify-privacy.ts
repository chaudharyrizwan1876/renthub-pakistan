/**
 * Live privacy audit. Crawls the RUNNING site as an anonymous visitor (HTML + RSC payloads + JSON APIs)
 * and asserts that no private value stored in the database appears anywhere in the responses.
 *
 *   npm run dev   (in one terminal)
 *   npm run verify:privacy            # BASE_URL defaults to http://localhost:3000
 *   BASE_URL=https://yoursite.com npm run verify:privacy
 */
import { PrismaClient } from "@prisma/client";

try {
  process.loadEnvFile?.(".env");
} catch {
  /* env provided */
}

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const db = new PrismaClient();

async function main() {
  const rows = await db.listing.findMany({ include: { private: true, owner: true } });
  const secrets = new Set<string>();
  for (const l of rows) {
    const p = l.private;
    if (p) {
      for (const v of [p.fullAddress, p.streetNo, p.houseNo, p.ownerPhone, p.ownerWhatsapp, p.ownerEmail]) if (v && v.length >= 4) secrets.add(v);
      if (p.ownerPhone) secrets.add(p.ownerPhone.replace(/^0/, "92")); // international form
      if (p.latitude != null) secrets.add(String(p.latitude));
      if (p.longitude != null) secrets.add(String(p.longitude));
    }
    for (const v of [l.owner.email, l.owner.phone, l.owner.whatsapp, l.adminNotes, l.rejectionReason]) if (v && v.length >= 6) secrets.add(v);
  }
  // A private value that is identical to public text (e.g. street "Bosan Road" == public area) is not a leak signal.
  const publicText = new Set(rows.flatMap((l) => [l.area, l.city, l.title].map((v) => v.toLowerCase())));
  for (const s of [...secrets]) if (publicText.has(s.toLowerCase())) secrets.delete(s);
  // Phones are also allowed in the admin WhatsApp number - never treat the platform number as a secret
  secrets.delete(process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "923295780676");

  const pages = new Set<string>(["/", "/listings", "/listings?page=2", "/about", "/contact", "/sitemap.xml", "/robots.txt", "/rent/islamabad", "/rent/lahore/flats"]);
  for (const l of rows) {
    pages.add(`/listings/${l.slug}`);
    pages.add(`/rent/${l.citySlug}/${l.areaSlug}`);
  }
  for (const t of ["FLAT", "HOUSE", "SHOP", "OFFICE"]) pages.add(`/listings?type=${t}`);

  let failures = 0;
  let checked = 0;
  for (const p of pages) {
    for (const mode of ["html", "rsc"] as const) {
      const res = await fetch(BASE + p, { headers: mode === "rsc" ? { RSC: "1" } : {}, redirect: "manual" });
      const body = await res.text();
      checked++;
      for (const s of secrets) {
        if (body.includes(s)) {
          failures++;
          console.error(`✖ LEAK on ${mode.toUpperCase()} ${p}: found private value "${s}"`);
        }
      }
    }
  }

  // Non-approved listings must not be reachable at all
  for (const l of rows.filter((x) => x.status !== "APPROVED")) {
    const res = await fetch(`${BASE}/listings/${l.slug}`, { redirect: "manual" });
    checked++;
    if (res.status !== 404) {
      failures++;
      console.error(`✖ ${l.status} listing ${l.publicId} is publicly reachable (HTTP ${res.status})`);
    }
  }

  // Private areas must reject anonymous visitors
  for (const p of ["/admin", "/admin/listings", "/dashboard", "/api/admin/deals/export"]) {
    const res = await fetch(BASE + p, { redirect: "manual" });
    checked++;
    const ok = (res.status >= 300 && res.status < 400) || res.status === 401 || res.status === 403;
    if (!ok) {
      failures++;
      console.error(`✖ ${p} answered anonymous request with HTTP ${res.status}`);
    }
  }

  console.log(`\nChecked ${checked} responses against ${secrets.size} private values across ${rows.length} listings.`);
  if (failures) {
    console.error(`FAILED: ${failures} privacy problem(s).`);
    process.exit(1);
  }
  console.log("✔ PASS: no private data leaked to anonymous visitors; private routes are protected.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
