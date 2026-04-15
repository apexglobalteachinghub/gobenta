import type { Metadata } from "next";
import Link from "next/link";
import { ListingGrid } from "@/components/listing/listing-grid";
import { getPurchasedListings } from "@/lib/queries/listings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Purchased",
};

export default async function ProfilePurchasedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const listings = await getPurchasedListings(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Purchased
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Items where the seller marked the transaction complete and you were
            the buyer.
          </p>
        </div>
        <Link
          href="/profile"
          className="text-sm font-medium text-brand hover:underline"
        >
          ← Profile settings
        </Link>
      </div>
      {listings.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No completed purchases yet. After a seller confirms the sale, the
          item appears here.
        </p>
      ) : (
        <ListingGrid listings={listings} />
      )}
    </div>
  );
}
