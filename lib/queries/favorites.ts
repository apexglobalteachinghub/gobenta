import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { withSellerRatings } from "@/lib/queries/listings";
import type { ListingWithRelations } from "@/types/database";

function mapRow(row: Record<string, unknown>): ListingWithRelations {
  const tags = Array.isArray(row.tags) ? (row.tags as string[]) : [];
  const pay = Array.isArray(row.payment_options)
    ? (row.payment_options as ListingWithRelations["payment_options"])
    : [];
  return { ...(row as unknown as ListingWithRelations), tags, payment_options: pay };
}

export async function isListingFavorited(
  userId: string | null,
  listingId: string
): Promise<boolean> {
  if (!userId || !isSupabaseConfigured()) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle();
  return !!data;
}

export async function getSavedListings(
  userId: string
): Promise<ListingWithRelations[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select(
      `
      listing:listings (
        *,
        seller:users!listings_user_id_fkey(id, name, avatar_url, is_verified_live_seller),
        category:categories!listings_category_id_fkey(id, name),
        subcategory:categories!listings_subcategory_id_fkey(id, name),
        images(id, image_url, sort_order)
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getSavedListings", error);
    return [];
  }

  const rows = (data ?? []) as unknown as Array<{ listing: ListingWithRelations | null }>;
  const listings = rows
    .map((r) => r.listing)
    .filter((l): l is ListingWithRelations => l != null)
    .map((l) => mapRow(l as unknown as Record<string, unknown>));
  return withSellerRatings(listings);
}
