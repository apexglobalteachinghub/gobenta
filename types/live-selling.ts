export type LiveSellerApplicationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "changes_requested";

export type LiveStreamStatus = "scheduled" | "live" | "ended";

export type LiveClaimStatus = "pending" | "confirmed" | "expired" | "cancelled";

export type LiveClaimFulfilment =
  | "unconfirmed"
  | "confirmed"
  | "shipped"
  | "completed";

export type LiveSellerApplicationRow = {
  id: string;
  user_id: string;
  store_name: string;
  contact_phone: string;
  contact_email: string | null;
  contact_messenger: string | null;
  valid_id_storage_path: string;
  category_labels: string[];
  sample_listing_ids: string[];
  experience_text: string | null;
  status: LiveSellerApplicationStatus;
  review_note: string | null;
  internal_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LiveStreamRow = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  status: LiveStreamStatus;
  scheduled_start_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  playback_url: string | null;
  pinned_listing_id: string | null;
  viewer_count: number;
  created_at: string;
  updated_at: string;
};

export type LiveClaimRow = {
  id: string;
  stream_id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  slot_code: string | null;
  status: LiveClaimStatus;
  fulfilment: LiveClaimFulfilment;
  claimed_at: string;
  expires_at: string;
  confirmed_at: string | null;
  courier: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
};
