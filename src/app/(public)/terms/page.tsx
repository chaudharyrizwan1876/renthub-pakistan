import { StaticPage } from "@/components/layout/static-page";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Terms & Conditions",
  description: `The terms for using ${SITE.name} as a tenant or property owner.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <StaticPage title="Terms & Conditions" path="/terms" updated="1 January 2026">
      <p>By using {SITE.name} you agree to these terms. Please have them reviewed by a legal professional before launch.</p>
      <h2>Our role</h2>
      <p>{SITE.name} is a listing and introduction service. We are not a party to any tenancy agreement between owner and tenant.</p>
      <h2>Listings</h2>
      <ul>
        <li>Owners must be the owner of, or authorised to rent out, the property they list, and must provide accurate information and genuine photos.</li>
        <li>We may approve, reject, edit or remove any listing at our discretion.</li>
        <li>Phone numbers, email addresses and links must not be placed in titles, descriptions or photos.</li>
      </ul>
      <h2>Introductions and service fee</h2>
      <p>Enquiries are handled by our team. Where we introduce a tenant and an owner and a tenancy results, a service fee is payable as agreed with the parties before the introduction. Owners and tenants agree not to bypass {SITE.name} to avoid this fee for introductions we facilitated.</p>
      <h2>Tenants</h2>
      <p>Please verify the property, the owner&apos;s ownership documents and all terms before paying any money. Rent, deposits and agreement terms are between tenant and owner.</p>
      <h2>Limitation of liability</h2>
      <p>We make reasonable efforts to review listings but do not guarantee their accuracy or availability, and we are not liable for disputes between owners and tenants.</p>
      <h2>Changes</h2>
      <p>We may update these terms from time to time. Continued use means you accept the updated terms.</p>
    </StaticPage>
  );
}
