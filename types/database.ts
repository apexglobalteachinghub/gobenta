export type ListingCondition = "new" | "like_new" | "used" | "for_parts";

export type PaymentOption = "gcash" | "maya" | "cod" | "pasabuy";

export type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  parent_id: string | null;
  created_at: string;
};

export type UserRole = "buyer" | "seller";

export type UserRow = {
  id: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  /** Set only in Supabase; gates /executive. */
  is_executive?: boolean;
  /** When set, the account is blocked (executive tooling + middleware). */
  banned_at?: string | null;
  /** Executive-approved live selling access. */
  is_verified_live_seller?: boolean;
  live_seller_suspended_until?: string | null;
  live_buyer_claim_strikes?: number;
  live_seller_violation_count?: number;
  created_at: string;
  phone?: string | null;
  address_public?: string | null;
  government_id_type?: string | null;
  government_id_last4?: string | null;
  bio?: string | null;
};

export type ListingRow = {
  id: string;
  title: string;
  description: string;
  price: number;
  category_id: string;
  subcategory_id: string | null;
  user_id: string;
  /** Set when seller marks the deal complete; enables mutual reviews. */
  buyer_id: string | null;
  transaction_completed_at: string | null;
  location: string;
  condition: ListingCondition;
  tags: string[];
  barangay: string | null;
  city: string | null;
  province: string | null;
  payment_options: PaymentOption[];
  pasabuy_available: boolean;
  created_at: string;
  updated_at: string;
};

export type UserReviewRow = {
  id: string;
  listing_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type ReceivedReviewDisplay = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  listing_title: string | null;
  reviewer_name: string;
};

export type UserRatingStats = {
  avg: number;
  count: number;
};

export type ImageRow = {
  id: string;
  listing_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
};

export type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id: string;
  content: string;
  created_at: string;
};

export type ListingWithRelations = ListingRow & {
  seller:
    | (Pick<UserRow, "id" | "name" | "avatar_url"> & {
        is_verified_live_seller?: boolean;
      })
    | null;
  /** Filled when listings are loaded for grids (home, saved, profile). */
  sellerRating?: UserRatingStats;
  category: Pick<CategoryRow, "id" | "name"> | null;
  subcategory: Pick<CategoryRow, "id" | "name"> | null;
  images: Pick<ImageRow, "id" | "image_url" | "sort_order">[];
};
