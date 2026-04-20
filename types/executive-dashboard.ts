export type ExecutiveCategoryCount = {
  category_id: string;
  name: string;
  count: number;
};

export type ExecutiveProvinceCount = {
  province: string;
  count: number;
};

export type ExecutivePaymentCount = {
  option: string;
  count: number;
};

export type ExecutiveLocationCount = {
  label: string;
  count: number;
};

export type ExecutiveDailyRow = {
  date: string;
  new_users: number;
  new_listings: number;
  visits: number;
  pct_user_growth: number;
  pct_listing_growth: number;
  pct_visit_growth: number;
};

export type ExecutiveDashboardPayload = {
  timezone: string;
  generated_at: string;
  total_listings: number;
  total_users: number;
  /** Present after supabase/executive.sql adds total_site_visits to the RPC. */
  total_site_visits?: number;
  avg_listing_price: number;
  listings_by_category: ExecutiveCategoryCount[];
  listings_by_province: ExecutiveProvinceCount[];
  payment_mix: ExecutivePaymentCount[];
  user_locations: ExecutiveLocationCount[];
  daily: ExecutiveDailyRow[];
};
