import type { Metadata } from "next";
import Link from "next/link";
import { ListingGrid } from "@/components/listing/listing-grid";
import { ProfileSellingLiveHub } from "@/components/live/profile-selling-live-hub";
import { getMainCategories } from "@/lib/queries/categories";
import {
  getActiveListingsForUser,
  getListingsForUser,
} from "@/lib/queries/listings";
import { createClient } from "@/lib/supabase/server";
import type { LiveSellerApplicationRow } from "@/types/live-selling";

export const metadata: Metadata = {
  title: "Selling",
};

export default async function ProfileSellingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    listings,
    categories,
    activeListings,
    profileRes,
    appRes,
    liveRes,
  ] = await Promise.all([
    getListingsForUser(user.id),
    getMainCategories(),
    getActiveListingsForUser(user.id),
    supabase
      .from("users")
      .select("is_verified_live_seller, live_seller_suspended_until")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("live_seller_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("live_streams")
      .select("id")
      .eq("seller_id", user.id)
      .eq("status", "live")
      .maybeSingle(),
  ]);

  const profile = profileRes.data;
  const initialApplication = appRes.error
    ? null
    : (appRes.data as LiveSellerApplicationRow | null);
  const activeStreamId = liveRes.error ? null : (liveRes.data?.id ?? null);

  return (
    <div className="space-y-10">
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

      <ProfileSellingLiveHub
        userId={user.id}
        isVerifiedLiveSeller={Boolean(profile?.is_verified_live_seller)}
        suspendedUntil={profile?.live_seller_suspended_until ?? null}
        initialApplication={initialApplication}
        activeStreamId={activeStreamId}
        activeListings={activeListings.map((l) => ({
          id: l.id,
          title: l.title,
          price: Number(l.price),
        }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          All listings
        </h2>
        {listings.length === 0 ? (
          <p className="text-sm text-zinc-500">You have not posted anything yet.</p>
        ) : (
          <ListingGrid listings={listings} />
        )}
      </div>
    </div>
  );
}
