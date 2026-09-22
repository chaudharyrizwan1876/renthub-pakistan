import { describe, expect, it } from "vitest";
import { containsContactInfo, listingSchema, signupSchema, toLocalPhone } from "@/lib/validation";

const validListing = {
  title: "Modern 2-bed flat near market",
  description: "Bright and spacious apartment with all utilities, close to schools and shops in a quiet block.",
  propertyType: "FLAT",
  rentPerMonth: "55000",
  securityDeposit: "",
  bedrooms: "2",
  bathrooms: "2",
  areaSize: "950",
  areaUnit: "SQFT",
  floor: "2nd",
  furnished: false,
  features: ["gas", "gas", "parking"],
  availableFrom: "",
  preferredTenant: "ANY",
  city: "Islamabad",
  area: "I-8",
  fullAddress: "Flat 4-B, Al-Noor Apartments, Street 14, I-8/3",
  streetNo: "14",
  houseNo: "4-B",
  ownerPhone: "0301 1234567",
  ownerWhatsapp: "",
  ownerEmail: "",
  latitude: "",
  longitude: "",
  media: [{ url: "/samples/sample-1.jpg", type: "IMAGE" }],
};

describe("toLocalPhone", () => {
  it("normalises Pakistani formats", () => {
    expect(toLocalPhone("0300-1234567")).toBe("03001234567");
    expect(toLocalPhone("+92 300 1234567")).toBe("03001234567");
    expect(toLocalPhone("923001234567")).toBe("03001234567");
    expect(toLocalPhone("300 1234567")).toBe("03001234567");
  });
  it("rejects junk", () => {
    expect(toLocalPhone("abc")).toBeNull();
    expect(toLocalPhone("123")).toBeNull();
  });
});

describe("containsContactInfo (anti-bypass)", () => {
  it.each([
    "call me on 03001234567",
    "contact 0300 123 4567 now",
    "+92 300 1234567",
    "0300-123-4567",
    "mail me at owner@gmail.com",
    "owner at gmail dot com owner(at)gmail.com",
    "visit www.mysite.com",
    "wa.me/923001234567",
    "https://example.pk/x",
    "zero three zero zero one two three four five six seven",
  ])("flags: %s", (t) => expect(containsContactInfo(t)).toBe(true));

  it.each([
    "2 bed flat, 950 sqft on the 2nd floor",
    "Rent Rs. 55,000 per month, deposit 110,000",
    "Near Street 14, sector I-8/3 market",
    "Available from 1 March, gas and electricity included",
  ])("allows: %s", (t) => expect(containsContactInfo(t)).toBe(false));
});

describe("listingSchema", () => {
  it("parses and transforms a valid form", () => {
    const r = listingSchema.safeParse(validListing);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.rentPerMonth).toBe(55000);
    expect(r.data.bedrooms).toBe(2);
    expect(r.data.securityDeposit).toBeNull();
    expect(r.data.features).toEqual(["gas", "parking"]);
    expect(r.data.ownerPhone).toBe("03011234567");
    expect(r.data.availableFrom).toBeNull();
  });

  it("rejects contact info in title or description", () => {
    expect(listingSchema.safeParse({ ...validListing, title: "Flat call 03001234567 now" }).success).toBe(false);
    expect(listingSchema.safeParse({ ...validListing, description: `${validListing.description} email me a@b.com` }).success).toBe(false);
  });

  it("requires a photo and caps media", () => {
    expect(listingSchema.safeParse({ ...validListing, media: [] }).success).toBe(false);
    const many = Array.from({ length: 16 }, (_, i) => ({ url: `/samples/s-${i}.jpg`, type: "IMAGE" }));
    expect(listingSchema.safeParse({ ...validListing, media: many }).success).toBe(false);
    const vids = [...validListing.media, ...Array.from({ length: 3 }, (_, i) => ({ url: `/uploads/v-${i}.mp4`, type: "VIDEO" }))];
    expect(listingSchema.safeParse({ ...validListing, media: vids }).success).toBe(false);
  });

  it("rejects untrusted media hosts", () => {
    expect(listingSchema.safeParse({ ...validListing, media: [{ url: "https://evil.example/x.jpg", type: "IMAGE" }] }).success).toBe(false);
  });

  it("validates numbers and phone", () => {
    expect(listingSchema.safeParse({ ...validListing, rentPerMonth: "abc" }).success).toBe(false);
    expect(listingSchema.safeParse({ ...validListing, rentPerMonth: "100" }).success).toBe(false);
    expect(listingSchema.safeParse({ ...validListing, ownerPhone: "12345" }).success).toBe(false);
  });
});

describe("signupSchema password rules", () => {
  const base = { name: "Ali Raza", email: "Ali@Example.com", phone: "03001234567", whatsapp: "", password: "Abcdef12", confirmPassword: "Abcdef12" };
  it("accepts a strong password and lowercases email", () => {
    const r = signupSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("ali@example.com");
  });
  it.each(["short1A", "alllowercase1", "ALLUPPERCASE1", "NoNumbersHere"])("rejects weak password %s", (password) => {
    expect(signupSchema.safeParse({ ...base, password, confirmPassword: password }).success).toBe(false);
  });
  it("rejects mismatched confirmation", () => {
    expect(signupSchema.safeParse({ ...base, confirmPassword: "Different12" }).success).toBe(false);
  });
});
