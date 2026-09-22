import { Phone } from "lucide-react";
import { StaticPage } from "@/components/layout/static-page";
import { WhatsAppIcon } from "@/components/listing/whatsapp-button";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { generalWhatsAppUrl } from "@/lib/whatsapp";

export const metadata = buildMetadata({
  title: "Contact Us",
  description: `Contact ${SITE.name} on WhatsApp for rental enquiries, listing help and support.`,
  path: "/contact",
});

export default function ContactPage() {
  const pretty = `+${SITE.adminWhatsapp.replace(/^(\d{2})(\d{3})(\d{7})$/, "$1 $2 $3")}`;
  return (
    <StaticPage title="Contact Us" path="/contact">
      <p>The fastest way to reach us is WhatsApp. Include the Listing ID (for example {SITE.idPrefix}-10245) if you are asking about a property.</p>
      <div className="not-prose flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="whatsapp" size="lg">
          <a href={generalWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon /> Chat on WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href={`tel:+${SITE.adminWhatsapp}`}>
            <Phone className="size-5" aria-hidden="true" /> Call {pretty}
          </a>
        </Button>
      </div>
      <h2>Support hours</h2>
      <p>We reply to messages every day, usually within a few hours between 9:00 am and 9:00 pm (PKT).</p>
    </StaticPage>
  );
}
