import { notFound } from "next/navigation";
import { ListingForm } from "@/components/dashboard/listing-form";
import { requireOwnerPage } from "@/lib/authz";
import { getFullListing, listingToFormValues } from "@/lib/listings/private";

export const metadata = { title: "Edit listing" };

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireOwnerPage();
  const { id } = await params;
  const listing = await getFullListing(id);
  // Ownership check: owners can only ever open their own listing (404, not 403, to avoid leaking existence)
  if (!listing || listing.ownerId !== user.id) notFound();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Edit listing <span className="font-mono text-primary">{listing.publicId}</span></h1>
        {listing.status === "REJECTED" && listing.rejectionReason && (
          <p className="mt-2 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">Rejected: {listing.rejectionReason}</p>
        )}
      </div>
      <ListingForm mode="edit" listingId={listing.id} defaultValues={listingToFormValues(listing)} successHref="/dashboard" />
    </div>
  );
}
