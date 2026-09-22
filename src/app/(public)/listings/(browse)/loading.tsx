import { ListingGridSkeleton } from "@/components/listing/listing-card";
import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6" role="status" aria-label="Loading rentals">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-4 h-9 w-2/3 max-w-md" />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Skeleton className="h-12 lg:h-[560px]" />
        <ListingGridSkeleton count={6} />
      </div>
    </div>
  );
}
