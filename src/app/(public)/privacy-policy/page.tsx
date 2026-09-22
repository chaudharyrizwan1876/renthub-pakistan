import { StaticPage } from "@/components/layout/static-page";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: `How ${SITE.name} collects, uses and protects personal information of owners and visitors.`,
  path: "/privacy-policy",
});

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" path="/privacy-policy" updated="1 January 2026">
      <p>This policy explains what information {SITE.name} collects and how it is used. Please have it reviewed by a legal professional before launch.</p>
      <h2>Visitors and tenants</h2>
      <p>You can browse without an account. When you tap the WhatsApp button we record an anonymous count of the click against the listing so we can measure interest. We do not store your name, number or IP address with that click. Any conversation happens on WhatsApp and is subject to WhatsApp&apos;s own policy.</p>
      <h2>Property owners</h2>
      <ul>
        <li>Account data: name, email, phone number and a securely hashed password.</li>
        <li>Listing data: property details, photos and videos, and private contact and address details.</li>
      </ul>
      <p>Owners&apos; phone numbers, email addresses and exact addresses are private: they are visible only to the owner and to our administrators and are never shown on public pages.</p>
      <h2>Photos and location data</h2>
      <p>Uploaded photos have embedded metadata (including GPS location) removed, and a small watermark is added.</p>
      <h2>Cookies</h2>
      <p>We use only essential cookies for owner and admin sign-in and a local preference for your language. We do not use advertising cookies.</p>
      <h2>Data retention and your rights</h2>
      <p>You may edit or delete your listings at any time from your dashboard, and you can ask us to delete your account by contacting us on WhatsApp.</p>
      <h2>Security</h2>
      <p>Passwords are hashed, sessions use secure cookies, and access to private data is restricted by role.</p>
    </StaticPage>
  );
}
