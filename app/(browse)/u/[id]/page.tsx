import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingGrid } from "@/components/listing/listing-grid";
import { ProfileReviewsList } from "@/components/profile/profile-reviews-list";
import { StarDisplay } from "@/components/listing/star-display";
import { getActiveListingsForUser } from "@/lib/queries/listings";
import { getReceivedReviews, getUserRatingStats } from "@/lib/queries/reviews";
import { getUserById } from "@/lib/queries/users";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) return { title: "Member" };
  return {
    title: user.name?.trim() ? `${user.name} · GoBenta` : "Member · GoBenta",
  };
}

export default async function PublicUserPage({ params }: Props) {
  const { id } = await params;
  const profile = await getUserById(id);
  if (!profile) notFound();

  const [stats, reviews, activeListings, supabase] = await Promise.all([
    getUserRatingStats(id),
    getReceivedReviews(id),
    getActiveListingsForUser(id),
    createClient(),
  ]);

  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  const isSelf = me?.id === id;

  const initial = (profile.name ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-3 py-8">
      {isSelf ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          This is how others see your profile.{" "}
          <Link href="/profile" className="font-semibold underline">
            Edit your profile
          </Link>
        </p>
      ) : null}

      <header className="flex flex-wrap items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-zinc-500">
              {initial}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {profile.name?.trim() || "Member"}
          </h1>
          <StarDisplay avg={stats.avg} count={stats.count} className="mt-2" />
          {profile.bio?.trim() ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {profile.bio.trim()}
            </p>
          ) : null}
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Public trust details
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Optional fields the member chose to show. Never share full ID numbers
          in chat.
        </p>
        <dl className="mt-4 space-y-2 text-sm">
          {profile.phone?.trim() ? (
            <div>
              <dt className="text-xs font-medium text-zinc-500">Phone</dt>
              <dd className="text-zinc-900 dark:text-zinc-100">
                {profile.phone.trim()}
              </dd>
            </div>
          ) : null}
          {profile.address_public?.trim() ? (
            <div>
              <dt className="text-xs font-medium text-zinc-500">City / area</dt>
              <dd className="text-zinc-900 dark:text-zinc-100">
                {profile.address_public.trim()}
              </dd>
            </div>
          ) : null}
          {profile.government_id_type?.trim() ||
          profile.government_id_last4?.trim() ? (
            <div>
              <dt className="text-xs font-medium text-zinc-500">ID (verified label)</dt>
              <dd className="text-zinc-900 dark:text-zinc-100">
                {[profile.government_id_type?.trim(), profile.government_id_last4?.trim() ? `···${profile.government_id_last4}` : null]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </dd>
            </div>
          ) : null}
          {!profile.phone?.trim() &&
          !profile.address_public?.trim() &&
          !profile.government_id_type?.trim() &&
          !profile.government_id_last4?.trim() ? (
            <p className="text-sm text-zinc-500">No extra details shared yet.</p>
          ) : null}
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Reviews from buyers and sellers
        </h2>
        <ProfileReviewsList reviews={reviews} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Listed now
        </h2>
        {activeListings.length === 0 ? (
          <p className="text-sm text-zinc-500">No active listings right now.</p>
        ) : (
          <ListingGrid listings={activeListings} />
        )}
      </section>
    </div>
  );
}
