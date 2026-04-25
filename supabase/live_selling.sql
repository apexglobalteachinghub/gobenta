-- Live selling: applications, streams, claim-based purchases (no in-app checkout).
-- Run after schema.sql, policies.sql, storage.sql, reviews.sql, executive.sql.
-- Preserves is_verified_live_seller on auth profile sync — merge into handle_new_user (see bottom).

-- ---------------------------------------------------------------------------
-- Users: verification & light anti-abuse counters
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists is_verified_live_seller boolean not null default false;

alter table public.users
  add column if not exists live_seller_suspended_until timestamptz;

alter table public.users
  add column if not exists live_buyer_claim_strikes int not null default 0;

alter table public.users
  add column if not exists live_seller_violation_count int not null default 0;

comment on column public.users.is_verified_live_seller is 'Executive-approved live seller; required to start streams.';
comment on column public.users.live_seller_suspended_until is 'When set and in the future, seller cannot go live.';
comment on column public.users.live_buyer_claim_strikes is 'Expired/unconfirmed live claims (buyer no-shows).';
comment on column public.users.live_seller_violation_count is 'Executive enforcement counter.';

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------
create table if not exists public.live_seller_applications (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.users (id) on delete cascade,
  store_name text not null,
  contact_phone text not null,
  contact_email text,
  contact_messenger text,
  valid_id_storage_path text not null,
  category_labels text[] not null default '{}'::text[],
  sample_listing_ids uuid[] not null default '{}'::uuid[],
  experience_text text,
  status text not null default 'pending'
    check (
      status in (
        'pending',
        'under_review',
        'approved',
        'rejected',
        'changes_requested'
      )
    ),
  review_note text,
  internal_notes text,
  reviewed_by uuid references public.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_live_seller_apps_user on public.live_seller_applications (user_id);
create index if not exists idx_live_seller_apps_status on public.live_seller_applications (status);
create index if not exists idx_live_seller_apps_created on public.live_seller_applications (created_at desc);

-- ---------------------------------------------------------------------------
-- Streams
-- ---------------------------------------------------------------------------
create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid (),
  seller_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'ended')),
  scheduled_start_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  playback_url text,
  pinned_listing_id uuid references public.listings (id) on delete set null,
  viewer_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_live_streams_seller on public.live_streams (seller_id);
create index if not exists idx_live_streams_status on public.live_streams (status);
create index if not exists idx_live_streams_live on public.live_streams (status, started_at desc);

-- ---------------------------------------------------------------------------
-- Products attached to a stream (from existing listings)
-- ---------------------------------------------------------------------------
create table if not exists public.live_stream_listings (
  stream_id uuid not null references public.live_streams (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  slot_code text,
  sort_order int not null default 0,
  primary key (stream_id, listing_id)
);

create index if not exists idx_live_stream_listings_stream on public.live_stream_listings (stream_id, sort_order);

-- ---------------------------------------------------------------------------
-- Claims (first-come, timed confirmation)
-- ---------------------------------------------------------------------------
create table if not exists public.live_claims (
  id uuid primary key default gen_random_uuid (),
  stream_id uuid not null references public.live_streams (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references public.users (id) on delete cascade,
  seller_id uuid not null references public.users (id) on delete cascade,
  slot_code text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'expired', 'cancelled')),
  fulfilment text not null default 'unconfirmed'
    check (
      fulfilment in ('unconfirmed', 'confirmed', 'shipped', 'completed')
    ),
  claimed_at timestamptz not null default now(),
  expires_at timestamptz not null,
  confirmed_at timestamptz,
  courier text,
  tracking_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);

create unique index if not exists live_claims_one_pending_per_listing
  on public.live_claims (stream_id, listing_id)
  where status = 'pending';

create index if not exists idx_live_claims_stream on public.live_claims (stream_id);
create index if not exists idx_live_claims_buyer on public.live_claims (buyer_id);
create index if not exists idx_live_claims_seller on public.live_claims (seller_id);

-- ---------------------------------------------------------------------------
-- In-app notifications (live + future)
-- ---------------------------------------------------------------------------
create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_notifications_user on public.app_notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers: updated_at
-- ---------------------------------------------------------------------------
create or replace function public.touch_live_row_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_live_apps_updated on public.live_seller_applications;
create trigger trg_live_apps_updated
  before update on public.live_seller_applications
  for each row execute function public.touch_live_row_updated_at ();

drop trigger if exists trg_live_streams_updated on public.live_streams;
create trigger trg_live_streams_updated
  before update on public.live_streams
  for each row execute function public.touch_live_row_updated_at ();

drop trigger if exists trg_live_claims_updated on public.live_claims;
create trigger trg_live_claims_updated
  before update on public.live_claims
  for each row execute function public.touch_live_row_updated_at ();

-- ---------------------------------------------------------------------------
-- Storage: ID documents (private bucket)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('live-seller-docs', 'live-seller-docs', false)
on conflict (id) do nothing;

drop policy if exists "live_seller_docs_select_own" on storage.objects;
create policy "live_seller_docs_select_own"
  on storage.objects for select
  using (
    bucket_id = 'live-seller-docs'
    and auth.role() = 'authenticated'
    and (storage.foldername (name))[1] = auth.uid()::text
  );

drop policy if exists "live_seller_docs_insert_own" on storage.objects;
create policy "live_seller_docs_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'live-seller-docs'
    and auth.role() = 'authenticated'
    and (storage.foldername (name))[1] = auth.uid()::text
  );

drop policy if exists "live_seller_docs_update_own" on storage.objects;
create policy "live_seller_docs_update_own"
  on storage.objects for update
  using (
    bucket_id = 'live-seller-docs'
    and auth.role() = 'authenticated'
    and (storage.foldername (name))[1] = auth.uid()::text
  );

drop policy if exists "live_seller_docs_delete_own" on storage.objects;
create policy "live_seller_docs_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'live-seller-docs'
    and auth.role() = 'authenticated'
    and (storage.foldername (name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.live_seller_applications enable row level security;
alter table public.live_streams enable row level security;
alter table public.live_stream_listings enable row level security;
alter table public.live_claims enable row level security;
alter table public.app_notifications enable row level security;

-- Applications: own rows
drop policy if exists "live_apps_select_own" on public.live_seller_applications;
create policy "live_apps_select_own"
  on public.live_seller_applications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "live_apps_insert_own" on public.live_seller_applications;
create policy "live_apps_insert_own"
  on public.live_seller_applications for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "live_apps_update_resubmit" on public.live_seller_applications;
create policy "live_apps_update_resubmit"
  on public.live_seller_applications for update
  to authenticated
  using (
    auth.uid() = user_id
    and status = 'changes_requested'
  )
  with check (
    auth.uid() = user_id
    and status in ('pending', 'changes_requested')
  );

-- Streams: public discovery (verified sellers only)
drop policy if exists "live_streams_select_discovery" on public.live_streams;
create policy "live_streams_select_discovery"
  on public.live_streams for select
  using (
    status in ('live', 'scheduled')
    and exists (
      select 1
      from public.users u
      where u.id = live_streams.seller_id
        and u.is_verified_live_seller = true
        and (
          u.live_seller_suspended_until is null
          or u.live_seller_suspended_until <= now()
        )
    )
  );

drop policy if exists "live_streams_write_seller_verified" on public.live_streams;
create policy "live_streams_write_seller_verified"
  on public.live_streams for insert
  to authenticated
  with check (
    auth.uid() = seller_id
    and exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.is_verified_live_seller = true
        and (
          u.live_seller_suspended_until is null
          or u.live_seller_suspended_until <= now()
        )
    )
  );

drop policy if exists "live_streams_update_own" on public.live_streams;
create policy "live_streams_update_own"
  on public.live_streams for update
  to authenticated
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

-- Stream listings
drop policy if exists "live_stream_listings_select" on public.live_stream_listings;
create policy "live_stream_listings_select"
  on public.live_stream_listings for select
  using (
    exists (
      select 1 from public.live_streams s where s.id = stream_id
    )
  );

drop policy if exists "live_stream_listings_write_seller" on public.live_stream_listings;
create policy "live_stream_listings_write_seller"
  on public.live_stream_listings for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.live_streams s
      where s.id = stream_id
        and s.seller_id = auth.uid()
    )
  );

drop policy if exists "live_stream_listings_delete_seller" on public.live_stream_listings;
create policy "live_stream_listings_delete_seller"
  on public.live_stream_listings for delete
  to authenticated
  using (
    exists (
      select 1
      from public.live_streams s
      where s.id = stream_id
        and s.seller_id = auth.uid()
    )
  );

-- Claims
drop policy if exists "live_claims_select_parties" on public.live_claims;
create policy "live_claims_select_parties"
  on public.live_claims for select
  to authenticated
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Anyone can see claim rows during an active live (transparency for FCFS).
drop policy if exists "live_claims_select_during_live" on public.live_claims;
create policy "live_claims_select_during_live"
  on public.live_claims for select
  using (
    exists (
      select 1
      from public.live_streams s
      where s.id = live_claims.stream_id
        and s.status = 'live'
    )
  );

drop policy if exists "live_claims_insert_buyer" on public.live_claims;
create policy "live_claims_insert_buyer"
  on public.live_claims for insert
  to authenticated
  with check (auth.uid() = buyer_id);

drop policy if exists "live_claims_update_buyer" on public.live_claims;
create policy "live_claims_update_buyer"
  on public.live_claims for update
  to authenticated
  using (auth.uid() = buyer_id)
  with check (auth.uid() = buyer_id);

drop policy if exists "live_claims_update_seller_fulfil" on public.live_claims;
create policy "live_claims_update_seller_fulfil"
  on public.live_claims for update
  to authenticated
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

-- Anyone authenticated may mark overdue pending claims as expired (FCFS unlock).
drop policy if exists "live_claims_expire_stale" on public.live_claims;
create policy "live_claims_expire_stale"
  on public.live_claims for update
  to authenticated
  using (status = 'pending' and expires_at < now())
  with check (status = 'expired');

create or replace function public.bump_buyer_strike_on_live_claim_expire ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'expired' and old.status = 'pending' then
    update public.users
    set live_buyer_claim_strikes = live_buyer_claim_strikes + 1
    where id = new.buyer_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_live_claims_expire_strike on public.live_claims;
create trigger trg_live_claims_expire_strike
  after update on public.live_claims
  for each row
  when (old.status is distinct from new.status)
  execute function public.bump_buyer_strike_on_live_claim_expire ();

create or replace function public.notify_on_live_claim_insert ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_notifications (user_id, kind, title, body, data)
  values
    (
      new.buyer_id,
      'live_claim',
      'Claim recorded',
      'Confirm your order before the timer ends.',
      jsonb_build_object('claim_id', new.id, 'stream_id', new.stream_id, 'listing_id', new.listing_id)
    ),
    (
      new.seller_id,
      'live_claim',
      'New live claim',
      'A buyer claimed a product during your live.',
      jsonb_build_object('claim_id', new.id, 'stream_id', new.stream_id, 'listing_id', new.listing_id)
    );
  return new;
end;
$$;

drop trigger if exists trg_live_claims_notify on public.live_claims;
create trigger trg_live_claims_notify
  after insert on public.live_claims
  for each row
  execute function public.notify_on_live_claim_insert ();

-- Seller sees all their streams (including ended) for dashboard.
drop policy if exists "live_streams_select_own_seller" on public.live_streams;
create policy "live_streams_select_own_seller"
  on public.live_streams for select
  to authenticated
  using (auth.uid() = seller_id);

-- Notifications: own
drop policy if exists "app_notifications_select_own" on public.app_notifications;
create policy "app_notifications_select_own"
  on public.app_notifications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "app_notifications_update_own" on public.app_notifications;
create policy "app_notifications_update_own"
  on public.app_notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Realtime (Supabase) — run once; ignore error if tables are already in publication.
-- alter publication supabase_realtime add table public.live_streams;
-- alter publication supabase_realtime add table public.live_claims;

-- ---------------------------------------------------------------------------
-- Merge into public.handle_new_user (run in SQL editor if your trigger differs)
-- Add to ON CONFLICT DO UPDATE:
--   is_verified_live_seller = public.users.is_verified_live_seller,
-- ---------------------------------------------------------------------------
