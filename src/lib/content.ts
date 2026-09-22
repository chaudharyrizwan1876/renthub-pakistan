import { SITE } from "./site";

export const HOME_FAQS = [
  {
    q: "Do I need an account to browse or contact about a property?",
    a: "No. Tenants can search, filter and view every listing without signing up. To ask about a property, tap the WhatsApp button and our team replies with details.",
  },
  {
    q: "Why can't I see the exact address or the owner's number?",
    a: "To protect owners and to make sure every visit is properly arranged, exact addresses and owner contact details are shared only by our team once you have contacted us on WhatsApp.",
  },
  {
    q: "How much does it cost?",
    a: "Browsing and enquiring are free. Our team charges a service fee only when a rental deal is successfully completed. The amount is discussed and agreed with you before any commitment.",
  },
  {
    q: "How do I list my property for rent?",
    a: "Create a free owner account, add your property with photos and details, and submit it. Our team reviews every listing, usually within 24 hours, before it goes live.",
  },
  {
    q: "Which cities do you cover?",
    a: "We list properties in Islamabad, Rawalpindi, Lahore, Karachi, Peshawar, Faisalabad, Multan and other major cities across Pakistan, and we are adding more every week.",
  },
  {
    q: "How can I mention a Listing ID?",
    a: `Every property has a unique Listing ID such as ${SITE.idPrefix}-10245. Sending it to us on WhatsApp helps us find the property instantly.`,
  },
];

export const HOW_STEPS = [
  { t: "how.1.t", d: "how.1.d" },
  { t: "how.2.t", d: "how.2.d" },
  { t: "how.3.t", d: "how.3.d" },
] as const;
