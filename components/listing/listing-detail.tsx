import Image from "next/image";
import Link from "next/link";
import { MapPin, MessageCircle, Tag } from "lucide-react";
import { formatPhp } from "@/lib/format";
import type { ListingReviewBrief, MessagedPeer } from "@/lib/queries/reviews";
import type { ListingWithRelations, UserRatingStats } from "@/types/database";
import { ListingGallery } from "@/components/listing/listing-gallery";
import { PaymentBadges } from "@/components/listing/payment-badges";
import { FavoriteButton } from "@/components/listing/favorite-button";
import { CompleteTransactionPanel } from "@/components/listing/complete-transaction";
import { ListingReviewPanel } from "@/components/listing/listing-review-panel";
import { StarDisplay } from "@/components/listing/star-display";
import { VerifiedLiveSellerBadge } from "@/components/live/verified-live-seller-badge";

type Props = {
  listing: ListingWithRelations;
  favorited: boolean;
  currentUserId: string | null;
  sellerRating: UserRatingStats;
  listingReviews: ListingReviewBrief[];
  messagedPeers: MessagedPeer[];
  buyerDisplayName: string | null;
};

export function ListingDetail({
  listing,
  favorited,
  currentUserId,
  sellerRating,
  listingReviews,
  messagedPeers,
  buyerDisplayName,
}: Props) {
  const seller = listing.seller;
  const isOwner = currentUserId === listing.user_id;
  const isBuyer =
    !!currentUserId &&
    !!listing.buyer_id &&
    currentUserId === listing.buyer_id;
  const chatHref = `/messages/${listing.id}/${listing.user_id}`;
  const loginChatHref = `/login?next=${encodeURIComponent(chatHref)}`;

  const ukay =
    listing.subcategory?.name?.toLowerCase().includes("ukay") ||
    listing.tags?.some((t) => t.toLowerCase().includes("ukay"));

  const locLine = [listing.barangay, listing.city, listing.province, listing.location]
    .filter(Boolean)
    .join(" · ");

  const dealDone =
    !!listing.transaction_completed_at && !!listing.buyer_id;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-3 py-6 lg:grid-cols-5 lg:px-4">
      <div className="lg:col-span-3">
        <ListingGallery images={listing.images ?? []} title={listing.title} />
      </div>

      <div className="space-y-4 lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatPhp(Number(listing.price))}
            </p>
            <h1 className="mt-2 text-xl font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
              {listing.title}
            </h1>
          </div>
          <FavoriteButton
            listingId={listing.id}
            initialFavorited={favorited}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {listing.category && (
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {listing.category.name}
              {listing.subcategory ? ` · ${listing.subcategory.name}` : ""}
            </span>
          )}
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium capitalize text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {listing.condition.replace("_", " ")}
          </span>
          {listing.pasabuy_available && (
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800 dark:bg-violet-950/60 dark:text-violet-200">
              Pasabuy
            </span>
          )}
          {ukay && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
              Ukay-ukay
            </span>
          )}
        </div>

        <PaymentBadges options={listing.payment_options} className="gap-2" />

        <p className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
          {locLine}
        </p>

        {listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Tag className="h-4 w-4 text-zinc-400" />
            {listing.tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Seller
          </p>
          <div className="mt-2 flex items-center gap-3">
            {seller?.avatar_url ? (
              <Link
                href={`/u/${seller.id}`}
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white dark:ring-zinc-900"
              >
                <Image
                  src={seller.avatar_url}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 object-cover"
                />
              </Link>
            ) : seller ? (
              <Link
                href={`/u/${seller.id}`}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-white"
              >
                {(seller.name ?? "?").slice(0, 1).toUpperCase()}
              </Link>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
                ?
              </div>
            )}
            <div className="min-w-0 flex-1">
              {seller ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/u/${seller.id}`}
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                  >
                    {seller.name ?? "Seller"}
                  </Link>
                  {seller.is_verified_live_seller ? (
                    <VerifiedLiveSellerBadge compact />
                  ) : null}
                </div>
              ) : (
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  Seller
                </p>
              )}
              <StarDisplay
                avg={sellerRating.avg}
                count={sellerRating.count}
                size="sm"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {isOwner ? (
          <CompleteTransactionPanel
            listingId={listing.id}
            peers={messagedPeers}
            buyerId={listing.buyer_id}
            buyerName={buyerDisplayName}
            completedAt={listing.transaction_completed_at}
          />
        ) : null}

        {dealDone && isOwner && seller ? (
          <ListingReviewPanel
            listingId={listing.id}
            sellerId={listing.user_id}
            buyerId={listing.buyer_id}
            completedAt={listing.transaction_completed_at}
            currentUserId={currentUserId}
            reviews={listingReviews}
            counterpartyLabel="buyer"
            counterpartyName={buyerDisplayName ?? "Buyer"}
          />
        ) : null}

        {dealDone && isBuyer && seller ? (
          <ListingReviewPanel
            listingId={listing.id}
            sellerId={listing.user_id}
            buyerId={listing.buyer_id}
            completedAt={listing.transaction_completed_at}
            currentUserId={currentUserId}
            reviews={listingReviews}
            counterpartyLabel="seller"
            counterpartyName={seller.name ?? "Seller"}
          />
        ) : null}

        {isOwner ? (
          <p className="rounded-xl bg-zinc-100 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            This is your listing. Buyers can message you from their account.
          </p>
        ) : (
          <Link
            href={currentUserId ? chatHref : loginChatHref}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-accent py-3 text-sm font-semibold text-white hover:bg-brand-accent-hover"
          >
            <MessageCircle className="h-5 w-5" />
            Message seller
          </Link>
        )}

        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Description
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {listing.description}
          </p>
        </section>
      </div>
    </div>
  );
}
