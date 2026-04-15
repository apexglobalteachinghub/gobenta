import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ReceivedReviewDisplay, UserRatingStats } from "@/types/database";

export async function getUserRatingStats(
  revieweeId: string
): Promise<UserRatingStats> {
  if (!isSupabaseConfigured()) return { avg: 0, count: 0 };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_reviews")
    .select("rating")
    .eq("reviewee_id", revieweeId);

  if (error) {
    console.error("getUserRatingStats", error.message);
    return { avg: 0, count: 0 };
  }
  if (!data?.length) {
    return { avg: 0, count: 0 };
  }
  const sum = data.reduce((acc, r) => acc + Number(r.rating), 0);
  return { avg: sum / data.length, count: data.length };
}

/** One query for many sellers (e.g. listing cards). */
export async function getUserRatingStatsBatch(
  revieweeIds: string[]
): Promise<Map<string, UserRatingStats>> {
  const out = new Map<string, UserRatingStats>();
  if (!isSupabaseConfigured() || revieweeIds.length === 0) return out;

  const unique = [...new Set(revieweeIds)];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_reviews")
    .select("reviewee_id, rating")
    .in("reviewee_id", unique);

  if (error) {
    console.error("getUserRatingStatsBatch", error.message);
    return out;
  }

  const sums = new Map<string, { sum: number; count: number }>();
  for (const row of data ?? []) {
    const id = String(row.reviewee_id);
    const prev = sums.get(id) ?? { sum: 0, count: 0 };
    prev.sum += Number(row.rating);
    prev.count += 1;
    sums.set(id, prev);
  }

  for (const [id, { sum, count }] of sums) {
    out.set(id, { avg: sum / count, count });
  }
  return out;
}

export type ListingReviewBrief = {
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string | null;
};

export async function getReviewsForListing(
  listingId: string
): Promise<ListingReviewBrief[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_reviews")
    .select("reviewer_id, reviewee_id, rating, comment")
    .eq("listing_id", listingId);

  if (error) {
    console.error("getReviewsForListing", error.message);
    return [];
  }
  if (!data) return [];
  return data as ListingReviewBrief[];
}

export async function getReceivedReviews(
  revieweeId: string
): Promise<ReceivedReviewDisplay[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("user_reviews")
    .select("id, rating, comment, created_at, listing_id, reviewer_id")
    .eq("reviewee_id", revieweeId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !rows?.length) {
    if (error) console.error("getReceivedReviews", error.message);
    return [];
  }

  const reviewerIds = [...new Set(rows.map((r) => r.reviewer_id as string))];
  const listingIds = [...new Set(rows.map((r) => r.listing_id as string))];

  const [{ data: reviewers }, { data: listings }] = await Promise.all([
    supabase.from("users").select("id, name").in("id", reviewerIds),
    supabase.from("listings").select("id, title").in("id", listingIds),
  ]);

  const nameById = new Map((reviewers ?? []).map((u) => [u.id, u.name ?? "Member"]));
  const titleById = new Map((listings ?? []).map((l) => [l.id, l.title]));

  return rows.map((r) => ({
    id: r.id as string,
    rating: Number(r.rating),
    comment: (r.comment as string | null) ?? null,
    created_at: r.created_at as string,
    listing_title: titleById.get(r.listing_id as string) ?? null,
    reviewer_name: nameById.get(r.reviewer_id as string) ?? "Member",
  }));
}

export type MessagedPeer = { id: string; name: string };

export async function getMessagedPeersForListing(
  listingId: string,
  ownerId: string
): Promise<MessagedPeer[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data: msgs, error } = await supabase
    .from("messages")
    .select("sender_id, receiver_id")
    .eq("listing_id", listingId);

  if (error || !msgs?.length) return [];

  const peerIds = new Set<string>();
  for (const m of msgs) {
    if (m.sender_id !== ownerId) peerIds.add(m.sender_id);
    if (m.receiver_id !== ownerId) peerIds.add(m.receiver_id);
  }

  const ids = [...peerIds];
  if (!ids.length) return [];

  const { data: users } = await supabase
    .from("users")
    .select("id, name")
    .in("id", ids);

  return (users ?? []).map((u) => ({
    id: u.id,
    name: u.name || "Member",
  }));
}
