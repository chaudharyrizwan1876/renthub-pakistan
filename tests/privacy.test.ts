import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PRIVATE_FIELD_NAMES, publicListingSelect, toPublicListing } from "@/lib/listings/public";
import { listingJsonLd } from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/** A full DB row as an ADMIN query would return it, including every private field. */
const PRIVATE = {
  fullAddress: "House 12, Street 5, I-8/3 SECRET-ADDRESS",
  streetNo: "SECRET-STREET-5",
  houseNo: "SECRET-HOUSE-12",
  ownerPhone: "03001234567",
  ownerWhatsapp: "03007654321",
  ownerEmail: "secret.owner@example.com",
  latitude: 33.123456,
  longitude: 73.654321,
  adminNotes: "SECRET-ADMIN-NOTE",
  rejectionReason: "SECRET-REASON",
  ownerId: "cuid-owner-secret",
  passwordHash: "$2b$12$secret",
  private: { fullAddress: "SECRET-NESTED" },
  owner: { name: "Secret Owner", phone: "03009998887" },
};

const fullRow = {
  publicId: "RH-10245",
  slug: "flat-for-rent-in-i-8-islamabad-rh-10245",
  title: "Nice flat",
  description: "A nice flat in a quiet block.",
  propertyType: "FLAT" as const,
  rentPerMonth: 55000,
  securityDeposit: null,
  bedrooms: 2,
  bathrooms: 2,
  areaSize: 950,
  areaUnit: "SQFT" as const,
  floor: "2nd",
  furnished: false,
  features: ["gas"],
  availableFrom: null,
  preferredTenant: "ANY" as const,
  city: "Islamabad",
  citySlug: "islamabad",
  area: "I-8",
  areaSlug: "i-8",
  featured: false,
  createdAt: new Date("2026-01-01"),
  approvedAt: new Date("2026-01-02"),
  media: [{ url: "/samples/sample-1.jpg", type: "IMAGE" as const, id: "m1", listingId: "secret-listing-id", order: 0 }],
  ...PRIVATE,
};

const SECRETS = ["SECRET", "03001234567", "03007654321", "secret.owner@example.com", "33.123456", "73.654321", "$2b$12$", "cuid-owner", "03009998887"];

describe("public listing DTO", () => {
  it("public select never contains a private field", () => {
    const keys = Object.keys(publicListingSelect);
    for (const f of PRIVATE_FIELD_NAMES) expect(keys).not.toContain(f);
  });

  it("toPublicListing drops everything not whitelisted, even if the query was over-selected", () => {
    const dto = toPublicListing(fullRow);
    const json = JSON.stringify(dto);
    for (const s of SECRETS) expect(json).not.toContain(s);
    for (const f of PRIVATE_FIELD_NAMES) expect(Object.keys(dto)).not.toContain(f);
    expect(dto.media[0]).toEqual({ url: "/samples/sample-1.jpg", type: "IMAGE" });
  });

  it("JSON-LD and WhatsApp URLs are built from public data only", () => {
    const dto = toPublicListing(fullRow);
    const ld = JSON.stringify(listingJsonLd(dto));
    const wa = decodeURIComponent(buildWhatsAppUrl(dto));
    for (const s of SECRETS) {
      expect(ld).not.toContain(s);
      expect(wa).not.toContain(s);
    }
    expect(wa).toContain("RH-10245");
    expect(wa).toContain("https://wa.me/923295780676?text=");
    expect(ld).toContain("I-8");
  });
});

/** Static guard: client bundles must never import server-only / private data modules. */
function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

describe("client/server boundary", () => {
  const files = walk(path.join(process.cwd(), "src"));
  const clientFiles = files.filter((f) => /^\s*["']use client["']/.test(fs.readFileSync(f, "utf8").slice(0, 200)));

  it("finds client components", () => expect(clientFiles.length).toBeGreaterThan(5));

  it("no client component imports private/server-only modules", () => {
    const forbidden = [/lib\/listings\/private/, /lib\/admin\/queries/, /lib\/db["']/, /@prisma\/client["'].*PrismaClient/, /lib\/authz/, /lib\/storage/, /lib\/email/, /lib\/rate-limit/, /from "@\/auth"/];
    for (const f of clientFiles) {
      const src = fs.readFileSync(f, "utf8");
      for (const re of forbidden) expect(re.test(src), `${path.relative(process.cwd(), f)} matches ${re}`).toBe(false);
    }
  });

  it("every data-layer module that returns private data is marked server-only", () => {
    for (const rel of ["lib/listings/private.ts", "lib/admin/queries.ts", "lib/listings/public.ts", "lib/authz.ts", "lib/storage.ts"]) {
      expect(fs.readFileSync(path.join(process.cwd(), "src", rel), "utf8")).toContain('import "server-only"');
    }
  });

  it("public pages never import the private/admin modules", () => {
    const publicFiles = files.filter((f) => /src[\\/]app[\\/]\(public\)/.test(f));
    expect(publicFiles.length).toBeGreaterThan(5);
    for (const f of publicFiles) {
      const src = fs.readFileSync(f, "utf8");
      expect(src, path.relative(process.cwd(), f)).not.toMatch(/listings\/private|admin\/queries|ListingPrivate|\.private\b/);
    }
  });
});
