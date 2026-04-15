import type { ListingWithRelations } from "@/types/database";
import { ListingCard } from "@/components/listing/listing-card";
import { PackageOpen } from "lucide-react";

type GridProps = {
  listings: ListingWithRelations[];
  /** Mark the first N card images as high priority (above-the-fold LCP). */
  lcpImageCount?: number;
};

export function ListingGrid({ listings, lcpImageCount = 0 }: GridProps) {
  if (!listings.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-20 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
        <PackageOpen className="mb-3 h-12 w-12 text-zinc-400" />
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-200">
          No listings match your filters
        </p>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">
          Try clearing filters or search — new items are posted every day across
          the Philippines.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {listings.map((l, i) => (
        <ListingCard
          key={l.id}
          listing={l}
          lcpImage={i < lcpImageCount}
        />
      ))}
    </div>
  );
}
