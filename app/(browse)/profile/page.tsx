import type { Metadata } from "next";
import Link from "next/link";
import { EditProfileForm, type ProfileFormInitial } from "@/components/profile/edit-profile-form";
import { ListingGrid } from "@/components/listing/listing-grid";
import { ProfileLiveSellerStatus } from "@/components/profile/profile-live-seller-status";
import { ProfileReviewsList } from "@/components/profile/profile-reviews-list";
import { StarDisplay } from "@/components/listing/star-display";
import { getActiveListingsForUser } from "@/lib/queries/listings";
import { getReceivedReviews, getUserRatingStats } from "@/lib/queries/reviews";
import { getUserById } from "@/lib/queries/users";
import { createClient } from "@/lib/supabase/server";
import type { LiveSellerApplicationRow } from "@/types/live-selling";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, myRatings, received, activeListings, appRes] =
    await Promise.all([
      getUserById(user.id),
      getUserRatingStats(user.id),
      getReceivedReviews(user.id),
      getActiveListingsForUser(user.id),
      supabase
        .from("live_seller_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const liveApplication = appRes.error
    ? null
    : (appRes.data as LiveSellerApplicationRow | null);

  const initial: ProfileFormInitial = {
    name: profile?.name ?? "",
    avatar_url: profile?.avatar_url ?? null,
    phone: profile?.phone ?? "",
    address_public: profile?.address_public ?? "",
    government_id_type: profile?.government_id_type ?? "",
    government_id_last4: profile?.government_id_last4 ?? "",
    bio: profile?.bio ?? "",
  };

  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Your profile
        </h1>
        <p className="mb-2 text-sm text-zinc-500">{user.email}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href={`/u/${user.id}`}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            View public profile
          </Link>
          <Link
            href="/profile/selling"
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Selling
          </Link>
          <Link
            href="/profile/purchased"
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Purchased
          </Link>
        </div>
        <ProfileLiveSellerStatus
          isVerifiedLiveSeller={Boolean(profile?.is_verified_live_seller)}
          suspendedUntil={profile?.live_seller_suspended_until ?? null}
          application={liveApplication}
        />
        <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Your rating
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Average from buyers and sellers after completed deals
          </p>
          <StarDisplay
            avg={myRatings.avg}
            count={myRatings.count}
            className="mt-2"
          />
        </div>
        <EditProfileForm initial={initial} />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Reviews about you
        </h2>
        <ProfileReviewsList reviews={received} />
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Active listings
          </h2>
          <Link
            href="/profile/selling"
            className="text-sm font-medium text-brand hover:underline"
          >
            All selling (incl. sold) →
          </Link>
        </div>
        {activeListings.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nothing active.{" "}
            <Link href="/listing/new" className="font-medium text-brand hover:underline">
              Post a listing
            </Link>
          </p>
        ) : (
          <ListingGrid listings={activeListings} />
        )}
      </section>
    </div>
  );
}
