import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { isNcrFilterLabel } from "@/lib/ph-geo/ncr";
import { getUserRatingStatsBatch } from "@/lib/queries/reviews";
import type { ListingWithRelations } from "@/types/database";

export type ListingFilters = {
  q?: string;
  categoryId?: string;
  subcategoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  /** Legacy free-text area (URL: loc) */
  location?: string;
  province?: string;
  city?: string;
  barangay?: string;
  condition?: string;
  tag?: string;
};

function parseTagsJson(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  return [];
}

function parsePaymentJson(raw: unknown): ListingWithRelations["payment_options"] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is ListingWithRelations["payment_options"][number] =>
    ["gcash", "maya", "cod", "pasabuy"].includes(String(x))
  );
}

function mapListing(row: Record<string, unknown>): ListingWithRelations {
  return {
    ...(row as unknown as ListingWithRelations),
    buyer_id: (row.buyer_id as string | null | undefined) ?? null,
    transaction_completed_at:
      (row.transaction_completed_at as string | null | undefined) ?? null,
    tags: parseTagsJson(row.tags),
    payment_options: parsePaymentJson(row.payment_options),
  };
}

export async function withSellerRatings(
  listings: ListingWithRelations[]
): Promise<ListingWithRelations[]> {
  if (!listings.length) return listings;
  const ids = [...new Set(listings.map((l) => l.seller?.id ?? l.user_id))];
  const stats = await getUserRatingStatsBatch(ids);
  return listings.map((l) => {
    const sid = l.seller?.id ?? l.user_id;
    return {
      ...l,
      sellerRating: stats.get(sid) ?? { avg: 0, count: 0 },
    };
  });
}

export async function getListings(
  filters: ListingFilters
): Promise<ListingWithRelations[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  let q = supabase
    .from("listings")
    .select(
      `
      *,
      seller:users!listings_user_id_fkey(id, name, avatar_url),
      category:categories!listings_category_id_fkey(id, name),
      subcategory:categories!listings_subcategory_id_fkey(id, name),
      images(id, image_url, sort_order)
    `
    )
    .is("transaction_completed_at", null)
    .order("created_at", { ascending: false });

  if (filters.q?.trim()) {
    q = q.ilike("title", `%${filters.q.trim()}%`);
  }
  if (filters.categoryId) {
    q = q.eq("category_id", filters.categoryId);
  }
  if (filters.subcategoryId) {
    q = q.eq("subcategory_id", filters.subcategoryId);
  }
  if (filters.minPrice != null && !Number.isNaN(filters.minPrice)) {
    q = q.gte("price", filters.minPrice);
  }
  if (filters.maxPrice != null && !Number.isNaN(filters.maxPrice)) {
    q = q.lte("price", filters.maxPrice);
  }
  const prov = filters.province?.trim();
  const city = filters.city?.trim();
  const brgy = filters.barangay?.trim();

  if (isNcrFilterLabel(prov)) {
    if (city) {
      q = q.ilike("city", `%${city}%`);
    }
  } else if (prov) {
    q = q.ilike("province", `%${prov}%`);
    if (city) {
      q = q.ilike("city", `%${city}%`);
    }
  } else if (city) {
    q = q.ilike("city", `%${city}%`);
  }

  if (brgy) {
    q = q.ilike("barangay", `%${brgy}%`);
  }

  if (filters.location?.trim()) {
    q = q.ilike("location", `%${filters.location.trim()}%`);
  }
  if (
    filters.condition &&
    ["new", "like_new", "used", "for_parts"].includes(filters.condition)
  ) {
    q = q.eq("condition", filters.condition);
  }
  if (filters.tag?.trim()) {
    q = q.contains("tags", [filters.tag.trim().toLowerCase()]);
  }

  const { data, error } = await q.limit(60);

  if (error) {
    console.error("getListings", error.message, error.details, error.hint);
    return [];
  }

  const listings = (data ?? []).map((row) =>
    mapListing(row as unknown as Record<string, unknown>)
  );
  return withSellerRatings(listings);
}

/** Listings the user bought (seller marked transaction complete). */
export async function getPurchasedListings(
  buyerId: string
): Promise<ListingWithRelations[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      seller:users!listings_user_id_fkey(id, name, avatar_url),
      category:categories!listings_category_id_fkey(id, name),
      subcategory:categories!listings_subcategory_id_fkey(id, name),
      images(id, image_url, sort_order)
    `
    )
    .eq("buyer_id", buyerId)
    .not("transaction_completed_at", "is", null)
    .order("transaction_completed_at", { ascending: false });

  if (error) {
    console.error("getPurchasedListings", error);
    return [];
  }

  const listings = (data ?? []).map((row) =>
    mapListing(row as unknown as Record<string, unknown>)
  );
  return withSellerRatings(listings);
}

/** Listings still for sale (not marked sold). */
export async function getActiveListingsForUser(
  userId: string
): Promise<ListingWithRelations[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      seller:users!listings_user_id_fkey(id, name, avatar_url),
      category:categories!listings_category_id_fkey(id, name),
      subcategory:categories!listings_subcategory_id_fkey(id, name),
      images(id, image_url, sort_order)
    `
    )
    .eq("user_id", userId)
    .is("transaction_completed_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getActiveListingsForUser", error);
    return [];
  }

  const listings = (data ?? []).map((row) =>
    mapListing(row as unknown as Record<string, unknown>)
  );
  return withSellerRatings(listings);
}

export async function getListingById(
  id: string
): Promise<ListingWithRelations | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      seller:users!listings_user_id_fkey(id, name, avatar_url),
      category:categories!listings_category_id_fkey(id, name),
      subcategory:categories!listings_subcategory_id_fkey(id, name),
      images(id, image_url, sort_order)
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("getListingById", error);
    return null;
  }

  const listing = mapListing(data as unknown as Record<string, unknown>);
  listing.images = [...(listing.images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  return listing;
}

export async function getListingsForUser(
  userId: string
): Promise<ListingWithRelations[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      seller:users!listings_user_id_fkey(id, name, avatar_url),
      category:categories!listings_category_id_fkey(id, name),
      subcategory:categories!listings_subcategory_id_fkey(id, name),
      images(id, image_url, sort_order)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getListingsForUser", error);
    return [];
  }

  const listings = (data ?? []).map((row) =>
    mapListing(row as unknown as Record<string, unknown>)
  );
  return withSellerRatings(listings);
}
