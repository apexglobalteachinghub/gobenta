import type { Metadata } from "next";
import { ListingGrid } from "@/components/listing/listing-grid";
import { getSavedListings } from "@/lib/queries/favorites";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Saved listings",
};

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const listings = await getSavedListings(user.id);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Saved
      </h1>
      <ListingGrid listings={listings} />
    </div>
  );
}
