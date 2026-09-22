import Link from "next/link";
import { StaticPage } from "@/components/layout/static-page";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = buildMetadata({
  title: "About Us",
  description: `${SITE.name} connects property owners and tenants across Pakistan. Learn how our verified, privacy-first rental marketplace works.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <StaticPage title="About Us" path="/about">
      <p>
        {SITE.name} is a rental marketplace built for Pakistan. We help owners of flats, houses, portions, rooms, shops, offices and warehouses find reliable tenants, and we help tenants find the right place without chasing dozens of dealers.
      </p>
      <h2>How we work</h2>
      <ul>
        <li>Owners list their property and our team reviews every listing before it goes live.</li>
        <li>Tenants browse freely, with no account needed, and message us on WhatsApp with the Listing ID.</li>
        <li>We share the exact address, arrange the visit and connect tenant and owner in person.</li>
        <li>A service fee applies only when a rental deal is completed, agreed upfront.</li>
      </ul>
      <h2>Privacy first</h2>
      <p>
        Owners&apos; phone numbers and exact addresses are never shown publicly. Photos are stripped of location data before they are published. This protects owners and keeps every enquiry properly handled.
      </p>
      <p>
        Ready to list your property? <Link href="/signup">Create a free owner account</Link>.
      </p>
    </StaticPage>
  );
}
