import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingDetail } from "@/components/listing/listing-detail";
import { isListingFavorited } from "@/lib/queries/favorites";
import { getListingById } from "@/lib/queries/listings";
import {
  getMessagedPeersForListing,
  getReviewsForListing,
  getUserRatingStats,
} from "@/lib/queries/reviews";
import { createClient } from "@/lib/supabase/server";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!UUID.test(id)) return { title: "Listing" };
  const listing = await getListingById(id);
  if (!listing) return { title: "Listing" };
  return {
    title: listing.title,
    description: listing.description.slice(0, 160),
    openGraph: {
      title: listing.title,
      description: listing.description.slice(0, 200),
      type: "website",
    },
  };
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const listing = await getListingById(id);
  if (!listing) notFound();

  const favorited = await isListingFavorited(user?.id ?? null, id);

  const sellerId = listing.seller?.id ?? listing.user_id;
  const sellerRating = await getUserRatingStats(sellerId);
  const listingReviews = await getReviewsForListing(id);
  const messagedPeers = await getMessagedPeersForListing(id, listing.user_id);

  let buyerDisplayName: string | null = null;
  if (listing.buyer_id) {
    const supabase = await createClient();
    const { data: buyerRow } = await supabase
      .from("users")
      .select("name")
      .eq("id", listing.buyer_id)
      .maybeSingle();
    buyerDisplayName = buyerRow?.name ?? null;
  }

  return (
    <ListingDetail
      listing={listing}
      favorited={favorited}
      currentUserId={user?.id ?? null}
      sellerRating={sellerRating}
      listingReviews={listingReviews}
      messagedPeers={messagedPeers}
      buyerDisplayName={buyerDisplayName}
    />
  );
}
