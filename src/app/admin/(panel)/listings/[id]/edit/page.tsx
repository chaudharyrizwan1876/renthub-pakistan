import { notFound } from "next/navigation";
import { ListingForm } from "@/components/dashboard/listing-form";
import { requireAdminPage } from "@/lib/authz";
import { getFullListing, listingToFormValues } from "@/lib/listings/private";

export const metadata = { title: "Edit listing" };

export default async function AdminEditListing({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const l = await getFullListing(id);
  if (!l) notFound();
  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">Edit <span className="font-mono text-primary">{l.publicId}</span> <span className="text-base font-normal text-muted-foreground">(as admin)</span></h1>
      <ListingForm mode="edit" isAdmin listingId={l.id} defaultValues={listingToFormValues(l)} successHref={`/admin/listings/${l.id}`} />
    </div>
  );
}
