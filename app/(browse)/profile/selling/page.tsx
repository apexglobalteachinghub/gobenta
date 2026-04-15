import type { Metadata } from "next";
import Link from "next/link";
import { ListingGrid } from "@/components/listing/listing-grid";
import { getListingsForUser } from "@/lib/queries/listings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Selling",
};

export default async function ProfileSellingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const listings = await getListingsForUser(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Selling
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Active and sold listings you posted. Sold items stay here for your
            records and no longer appear in search.
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
        <p className="text-sm text-zinc-500">You have not posted anything yet.</p>
      ) : (
        <ListingGrid listings={listings} />
      )}
    </div>
  );
}
