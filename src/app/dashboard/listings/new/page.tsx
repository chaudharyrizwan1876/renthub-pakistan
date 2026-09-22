import { ListingForm } from "@/components/dashboard/listing-form";
import { EMPTY_LISTING } from "@/lib/listing-defaults";
import { requireOwnerPage } from "@/lib/authz";
import { db } from "@/lib/db";

export const metadata = { title: "Add listing" };

export default async function NewListingPage() {
  const user = await requireOwnerPage();
  const profile = await db.user.findUnique({ where: { id: user.id }, select: { phone: true, whatsapp: true, email: true } });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Add a listing</h1>
        <p className="text-sm text-muted-foreground">Complete the steps below. Your phone and address stay private.</p>
      </div>
      <ListingForm
        mode="create"
        successHref="/dashboard"
        defaultValues={{ ...EMPTY_LISTING, ownerPhone: profile?.phone ?? "", ownerWhatsapp: profile?.whatsapp ?? "", ownerEmail: profile?.email ?? "" }}
      />
    </div>
  );
}
