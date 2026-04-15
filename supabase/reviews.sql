-- Peer reviews (1–5 stars) after a completed deal on a listing.
-- Run in Supabase SQL Editor after schema.sql and policies.sql

-- ---------------------------------------------------------------------------
-- Listings: record buyer when seller marks transaction complete
-- ---------------------------------------------------------------------------
alter table public.listings
  add column if not exists buyer_id uuid references public.users (id) on delete set null;

alter table public.listings
  add column if not exists transaction_completed_at timestamptz null;

create index if not exists idx_listings_buyer on public.listings (buyer_id);

comment on column public.listings.buyer_id is 'Buyer chosen by seller when marking this listing sold; enables mutual reviews.';
comment on column public.listings.transaction_completed_at is 'When set, seller and buyer may each submit one review for this listing.';

-- ---------------------------------------------------------------------------
-- Reviews: one row per reviewer per listing (review the counterparty)
-- ---------------------------------------------------------------------------
create table if not exists public.user_reviews (
  id uuid primary key default gen_random_uuid (),
  listing_id uuid not null references public.listings (id) on delete cascade,
  reviewer_id uuid not null references public.users (id) on delete cascade,
  reviewee_id uuid not null references public.users (id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  created_at timestamptz not null default now (),
  unique (listing_id, reviewer_id),
  check (reviewer_id <> reviewee_id)
);

create index if not exists idx_user_reviews_reviewee on public.user_reviews (reviewee_id);
create index if not exists idx_user_reviews_listing on public.user_reviews (listing_id);

comment on table public.user_reviews is 'Post-deal rating; reviewer must be seller or buyer on listing with transaction_completed_at set.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.user_reviews enable row level security;

drop policy if exists "user_reviews_select_public" on public.user_reviews;
create policy "user_reviews_select_public"
  on public.user_reviews for select
  using (true);

drop policy if exists "user_reviews_insert_participant" on public.user_reviews;
create policy "user_reviews_insert_participant"
  on public.user_reviews for insert
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and l.transaction_completed_at is not null
        and l.buyer_id is not null
        and (
          (auth.uid() = l.user_id and reviewee_id = l.buyer_id)
          or (auth.uid() = l.buyer_id and reviewee_id = l.user_id)
        )
    )
  );

-- No updates/deletes (integrity of ratings)
