/* Seeds the admin user (from env) and, optionally, demo owners + listings.
 *   npm run db:seed
 * Env: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_PHONE, SEED_SAMPLE_DATA=true|false
 */
import { PrismaClient, type AreaUnit, type PropertyType, type ListingStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { SEED_POSTS } from "./blog-posts";

try {
  process.loadEnvFile?.(".env");
} catch {
  /* env already provided */
}

const db = new PrismaClient();

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < 10) {
    throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 10 characters before seeding.");
  }
  const admin = await db.user.upsert({
    where: { email },
    update: { role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
    create: {
      email,
      name: process.env.ADMIN_NAME || "Site Admin",
      phone: process.env.ADMIN_PHONE || "03000000000",
      passwordHash: await bcrypt.hash(password, 12),
      role: "ADMIN",
    },
  });
  console.log(`✔ Admin ready: ${admin.email}`);
}

/** Generates simple vector-style JPEG placeholders so the demo works without any external image host. */
async function makeSamplePhotos(): Promise<string[]> {
  const dir = path.join(process.cwd(), "public", "samples");
  fs.mkdirSync(dir, { recursive: true });
  const palettes = [
    ["#0f766e", "#5eead4"],
    ["#1d4ed8", "#93c5fd"],
    ["#b45309", "#fcd34d"],
    ["#7c3aed", "#c4b5fd"],
    ["#be123c", "#fda4af"],
    ["#166534", "#86efac"],
    ["#334155", "#cbd5e1"],
    ["#0e7490", "#67e8f9"],
  ];
  const urls: string[] = [];
  for (let i = 0; i < palettes.length; i++) {
    const [a, b] = palettes[i]!;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="853" viewBox="0 0 1280 853">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
      <rect width="1280" height="853" fill="url(#g)"/>
      <g fill="#fff" fill-opacity=".9">
        <rect x="330" y="360" width="620" height="330" rx="10"/>
        <path d="M290 372 L640 130 L990 372 Z" fill-opacity=".95"/>
        <rect x="590" y="500" width="100" height="190" fill="${a}"/>
        <rect x="390" y="430" width="120" height="100" fill="${a}" fill-opacity=".75"/>
        <rect x="770" y="430" width="120" height="100" fill="${a}" fill-opacity=".75"/>
      </g>
      <rect y="690" width="1280" height="163" fill="#000" fill-opacity=".18"/>
    </svg>`;
    const file = path.join(dir, `sample-${i + 1}.jpg`);
    await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toFile(file);
    urls.push(`/samples/sample-${i + 1}.jpg`);
  }
  return urls;
}

interface Demo {
  title: string;
  description: string;
  type: PropertyType;
  rent: number;
  deposit?: number;
  beds?: number;
  baths?: number;
  size?: number;
  unit?: AreaUnit;
  floor?: string;
  furnished?: boolean;
  features: string[];
  tenant?: "FAMILY" | "BACHELOR" | "ANY";
  city: string;
  area: string;
  status: ListingStatus;
  featured?: boolean;
  address: string;
  house: string;
  street: string;
  phone: string;
}

const DEMOS: Demo[] = [
  { title: "Modern 2-bed flat near market, family only", description: "Bright, well-ventilated apartment in a quiet block with all utilities. Close to schools, mosque and daily-needs market. Tiled floors, wooden wardrobes and a spacious lounge with attached kitchen. Covered parking available.", type: "FLAT", rent: 55000, deposit: 110000, beds: 2, baths: 2, size: 950, unit: "SQFT", floor: "2nd", features: ["gas", "electricity", "parking", "lift", "security"], tenant: "FAMILY", city: "Islamabad", area: "I-8", status: "APPROVED", featured: true, address: "Flat 4-B, Al-Noor Apartments, Street 14, I-8/3, Islamabad", house: "4-B", street: "14", phone: "03011234567" },
  { title: "Spacious upper portion with separate entrance", description: "Upper portion of a double-storey house in a peaceful sector. Three bedrooms with attached baths, drawing and dining, large terrace. Separate gate and meter. Ideal for a small family.", type: "PORTION", rent: 75000, deposit: 150000, beds: 3, baths: 3, size: 1, unit: "KANAL", floor: "First", features: ["gas", "electricity", "water", "parking", "separate-entrance", "balcony"], tenant: "FAMILY", city: "Islamabad", area: "G-11", status: "APPROVED", featured: true, address: "House 22, Street 7, G-11/2, Islamabad", house: "22", street: "7", phone: "03021234568" },
  { title: "Fully furnished studio apartment for bachelors", description: "Compact furnished studio with AC, fridge, bed, wardrobe and high-speed internet ready. Secure building with CCTV and lift. Walking distance to metro and offices. Utilities can be arranged.", type: "FLAT", rent: 42000, deposit: 42000, beds: 1, baths: 1, size: 520, unit: "SQFT", floor: "5th", furnished: true, features: ["electricity", "lift", "cctv", "ac", "internet", "security"], tenant: "BACHELOR", city: "Islamabad", area: "F-11", status: "APPROVED", address: "Suite 503, Markaz Heights, F-11 Markaz, Islamabad", house: "503", street: "Markaz", phone: "03031234569" },
  { title: "10 Marla house in prime location with lawn", description: "Beautiful double-unit house with lawn, porch and servant quarter. Marble flooring, modern kitchen and imported fittings. Located near park and market with 24/7 security.", type: "HOUSE", rent: 180000, deposit: 360000, beds: 4, baths: 4, size: 10, unit: "MARLA", floor: "Ground + First", features: ["gas", "electricity", "water", "parking", "security", "lawn", "servant-quarter", "generator"], tenant: "FAMILY", city: "Lahore", area: "DHA Phase 5", status: "APPROVED", featured: true, address: "House 118, Block D, DHA Phase 5, Lahore", house: "118", street: "D-Block", phone: "03041234570" },
  { title: "5 Marla house, three bed, near Johar Town park", description: "Well-maintained double-storey house with new paint and woodwork. Three bedrooms with attached bathrooms, TV lounge and open kitchen. Quiet street, easy access to main boulevard.", type: "HOUSE", rent: 65000, deposit: 130000, beds: 3, baths: 3, size: 5, unit: "MARLA", floor: "Ground + First", features: ["gas", "electricity", "water", "parking"], tenant: "ANY", city: "Lahore", area: "Johar Town", status: "APPROVED", address: "House 45, Block R2, Johar Town, Lahore", house: "45", street: "R2", phone: "03051234571" },
  { title: "Prime commercial shop on main Gulberg road", description: "Ground-floor shop with high footfall and large glass frontage. Ideal for boutique, bakery or clinic. Attached washroom, shutter and mezzanine storage. Ample road-side parking.", type: "SHOP", rent: 250000, deposit: 750000, size: 450, unit: "SQFT", floor: "Ground", features: ["electricity", "cctv", "parking"], tenant: "ANY", city: "Lahore", area: "Gulberg", status: "APPROVED", address: "Shop 9, Main Boulevard, Gulberg III, Lahore", house: "9", street: "Main Boulevard", phone: "03061234572" },
  { title: "Sea-facing 3 bed apartment in Clifton", description: "Premium apartment with sea view, built-in wardrobes, modular kitchen and two reserved parking slots. Building has generator backup, lift and round-the-clock security.", type: "FLAT", rent: 140000, deposit: 280000, beds: 3, baths: 3, size: 2100, unit: "SQFT", floor: "9th", features: ["gas", "electricity", "lift", "parking", "generator", "security", "cctv", "balcony", "ac"], tenant: "FAMILY", city: "Karachi", area: "Clifton", status: "APPROVED", featured: true, address: "Apartment 903, Sea View Towers, Block 4, Clifton, Karachi", house: "903", street: "Block 4", phone: "03071234573" },
  { title: "Office space 1200 sqft with reception area", description: "Ready-to-use office on the first floor with reception, two cabins, conference room and pantry. Fibre internet available, lift and backup power in building. Great for IT or consultancy firms.", type: "OFFICE", rent: 120000, deposit: 240000, size: 1200, unit: "SQFT", floor: "First", features: ["electricity", "lift", "generator", "cctv", "internet", "ac", "parking"], tenant: "ANY", city: "Karachi", area: "PECHS", status: "APPROVED", address: "Office 12, Business Plaza, Tariq Road, PECHS, Karachi", house: "12", street: "Tariq Road", phone: "03081234574" },
  { title: "Warehouse 8000 sqft with loading dock", description: "Industrial warehouse with high ceiling, truck-friendly access, loading dock and office space. Three-phase electricity and security cabin. Suitable for storage and light assembly.", type: "WAREHOUSE", rent: 320000, deposit: 960000, size: 8000, unit: "SQFT", floor: "Ground", features: ["electricity", "security", "cctv", "parking", "water"], tenant: "ANY", city: "Rawalpindi", area: "Adiala Road", status: "APPROVED", address: "Plot 31, Industrial Estate, Adiala Road, Rawalpindi", house: "31", street: "Industrial Estate", phone: "03091234575" },
  { title: "Bahria Town 1 bed apartment, brand-new", description: "Never-used apartment in a gated community with 24/7 electricity backup, wide roads and parks. Open kitchen, marble floor and balcony overlooking greenery.", type: "FLAT", rent: 38000, deposit: 76000, beds: 1, baths: 1, size: 650, unit: "SQFT", floor: "3rd", features: ["electricity", "lift", "security", "balcony", "parking"], tenant: "ANY", city: "Rawalpindi", area: "Bahria Town", status: "APPROVED", address: "Apartment 302, Sector C, Bahria Town Phase 7, Rawalpindi", house: "302", street: "Sector C", phone: "03101234576" },
  { title: "Single room with attached bath for working women", description: "Clean, safe room in a well-run house with shared kitchen and lounge. Wi-Fi included, near main road and public transport. Preference to working professionals.", type: "ROOM", rent: 18000, deposit: 18000, beds: 1, baths: 1, floor: "Ground", furnished: true, features: ["electricity", "internet", "gas", "security"], tenant: "ANY", city: "Peshawar", area: "Hayatabad", status: "APPROVED", address: "House 5, Phase 3, Sector N-1, Hayatabad, Peshawar", house: "5", street: "N-1", phone: "03111234577" },
  { title: "Newly listed 7 marla portion (awaiting review)", description: "Ground portion with three bedrooms, two baths and lawn. Gas and electricity available. Close to market and school.", type: "PORTION", rent: 48000, beds: 3, baths: 2, size: 7, unit: "MARLA", floor: "Ground", features: ["gas", "electricity", "lawn"], tenant: "FAMILY", city: "Faisalabad", area: "Peoples Colony", status: "PENDING", address: "House 77, Street 3, Peoples Colony No. 1, Faisalabad", house: "77", street: "3", phone: "03121234578" },
  { title: "Corner plot for commercial rent (rejected sample)", description: "Corner plot on main road suitable for showroom or petrol pump. Clear documents and easy road access on two sides.", type: "PLOT", rent: 90000, size: 2, unit: "KANAL", features: ["electricity", "water"], tenant: "ANY", city: "Multan", area: "Bosan Road", status: "REJECTED", address: "Plot 4, Bosan Road, Multan", house: "4", street: "Bosan Road", phone: "03131234579" },
  { title: "3 bed flat already rented (sample)", description: "Comfortable three bedroom apartment with car parking, gas and lift. Recently rented out via our team.", type: "FLAT", rent: 60000, deposit: 120000, beds: 3, baths: 2, size: 1400, unit: "SQFT", floor: "4th", features: ["gas", "electricity", "lift", "parking"], tenant: "FAMILY", city: "Islamabad", area: "I-10", status: "RENTED", address: "Flat 12, Green Heights, I-10/4, Islamabad", house: "12", street: "I-10/4", phone: "03141234580" },
];

async function seedSamples() {
  if ((await db.listing.count()) > 0) {
    console.log("• Listings already exist, skipping sample data");
    return;
  }
  const photos = await makeSamplePhotos();
  const pw = await bcrypt.hash("Owner@12345", 12);
  const owners = await Promise.all(
    [
      { name: "Ali Raza", email: "ali.owner@example.com", phone: "03211234561" },
      { name: "Sana Khan", email: "sana.owner@example.com", phone: "03221234562" },
    ].map((o) =>
      db.user.upsert({ where: { email: o.email }, update: {}, create: { ...o, whatsapp: o.phone, passwordHash: pw, role: "OWNER" } }),
    ),
  );

  let idx = 0;
  const created: { id: string; status: ListingStatus }[] = [];
  for (const d of DEMOS) {
    const owner = owners[idx % owners.length]!;
    const l = await db.listing.create({
      data: {
        publicId: `tmp-${idx}-${Date.now()}`,
        slug: `tmp-${idx}-${Date.now()}`,
        title: d.title,
        description: d.description,
        propertyType: d.type,
        rentPerMonth: d.rent,
        securityDeposit: d.deposit,
        bedrooms: d.beds,
        bathrooms: d.baths,
        areaSize: d.size,
        areaUnit: d.unit,
        floor: d.floor,
        furnished: !!d.furnished,
        features: d.features,
        preferredTenant: d.tenant ?? "ANY",
        city: d.city,
        citySlug: slugify(d.city),
        area: d.area,
        areaSlug: slugify(d.area),
        status: d.status,
        featured: !!d.featured,
        rejectionReason: d.status === "REJECTED" ? "Photos are missing key rooms. Please add clear interior photos." : null,
        approvedAt: d.status === "APPROVED" || d.status === "RENTED" ? new Date(Date.now() - (idx + 1) * 86400000) : null,
        ownerId: owner.id,
        createdAt: new Date(Date.now() - (idx + 2) * 86400000),
        private: {
          create: {
            fullAddress: d.address,
            houseNo: d.house,
            streetNo: d.street,
            ownerPhone: d.phone,
            ownerWhatsapp: d.phone,
            ownerEmail: owner.email,
            latitude: 33.6844 + idx * 0.01,
            longitude: 73.0479 + idx * 0.01,
          },
        },
        media: {
          create: [0, 1, 2].map((k) => ({ url: photos[(idx + k * 3) % photos.length]!, type: "IMAGE" as const, order: k })),
        },
      },
      select: { id: true, seq: true },
    });
    const publicId = `RH-${10000 + l.seq}`;
    const typeSlug = slugify(d.type.toLowerCase());
    await db.listing.update({
      where: { id: l.id },
      data: { publicId, slug: `${typeSlug}-for-rent-in-${slugify(d.area)}-${slugify(d.city)}-${publicId.toLowerCase()}` },
    });
    created.push({ id: l.id, status: d.status });
    idx++;
  }

  // Inquiry clicks spread over the last 10 days
  const live = created.filter((c) => c.status === "APPROVED" || c.status === "RENTED");
  const inquiries = Array.from({ length: 45 }, (_, i) => ({
    listingId: live[i % live.length]!.id,
    source: ["card", "detail", "sticky"][i % 3]!,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 10 * 86400000)),
  }));
  await db.inquiry.createMany({ data: inquiries });

  const rented = created.find((c) => c.status === "RENTED");
  if (rented) {
    await db.deal.createMany({
      data: [
        { listingId: rented.id, tenantName: "Bilal Ahmed", tenantPhone: "03331234567", commissionAmount: 60000, status: "COMMISSION_RECEIVED", notes: "Paid in cash at signing." },
        { listingId: live[0]!.id, tenantName: "Hina Malik", tenantPhone: "03341234568", commissionAmount: 27500, status: "COMMISSION_PENDING", notes: "Agreement being finalised." },
      ],
    });
  }
  console.log(`✔ Sample data: ${DEMOS.length} listings, ${inquiries.length} inquiries, owners ali.owner@example.com / Owner@12345`);
}

async function seedPosts() {
  if ((await db.post.count()) > 0) return;
  for (const p of SEED_POSTS) {
    const at = new Date(Date.now() - p.daysAgo * 86400000);
    await db.post.create({
      data: { slug: p.slug, title: p.title, excerpt: p.excerpt, content: p.content, category: p.category, metaTitle: p.metaTitle, metaDescription: p.metaDescription, published: true, publishedAt: at, createdAt: at },
    });
  }
  console.log(`✔ Blog: ${SEED_POSTS.length} starter articles`);
}

async function main() {
  await seedAdmin();
  await seedPosts();
  if (process.env.SEED_SAMPLE_DATA === "true") await seedSamples();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
