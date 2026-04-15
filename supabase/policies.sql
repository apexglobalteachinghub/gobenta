-- Row Level Security — run after schema.sql

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.images enable row level security;
alter table public.messages enable row level security;
alter table public.favorites enable row level security;

-- ---------------------------------------------------------------------------
-- users: readable by anyone (seller cards); users update only themselves
-- ---------------------------------------------------------------------------
drop policy if exists "users_select_public" on public.users;
create policy "users_select_public"
  on public.users for select
  using (true);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "users_insert_own" on public.users;
-- Profile row is created by trigger; allow insert if id matches (backup path)
create policy "users_insert_own"
  on public.users for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- categories: public read; no client writes (manage via SQL/dashboard)
-- ---------------------------------------------------------------------------
drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public"
  on public.categories for select
  using (true);

-- Optional: lock down writes to service role only (no policies = deny for authenticated)

-- ---------------------------------------------------------------------------
-- listings: public read; owners manage
-- ---------------------------------------------------------------------------
drop policy if exists "listings_select_public" on public.listings;
create policy "listings_select_public"
  on public.listings for select
  using (true);

drop policy if exists "listings_insert_authenticated" on public.listings;
create policy "listings_insert_authenticated"
  on public.listings for insert
  with check (auth.uid() = user_id);

drop policy if exists "listings_update_own" on public.listings;
create policy "listings_update_own"
  on public.listings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "listings_delete_own" on public.listings;
create policy "listings_delete_own"
  on public.listings for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- images: public read; listing owner inserts/updates/deletes
-- ---------------------------------------------------------------------------
drop policy if exists "images_select_public" on public.images;
create policy "images_select_public"
  on public.images for select
  using (true);

drop policy if exists "images_write_by_listing_owner" on public.images;
create policy "images_write_by_listing_owner"
  on public.images for insert
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.user_id = auth.uid()
    )
  );

drop policy if exists "images_update_by_listing_owner" on public.images;
create policy "images_update_by_listing_owner"
  on public.images for update
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.user_id = auth.uid()
    )
  );

drop policy if exists "images_delete_by_listing_owner" on public.images;
create policy "images_delete_by_listing_owner"
  on public.images for delete
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- messages: participants only; sender must be current user on insert
-- Realtime respects these SELECT rules.
-- ---------------------------------------------------------------------------
drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "messages_insert_as_sender" on public.messages;
create policy "messages_insert_as_sender"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and auth.uid() <> receiver_id
  );

-- No update/delete for simplicity (Messenger-style immutable messages)

-- ---------------------------------------------------------------------------
-- favorites: per-user
-- ---------------------------------------------------------------------------
drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
  on public.favorites for select
  using (auth.uid() = user_id);

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
  on public.favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Realtime: add messages (ignore if already added). Or enable in Dashboard → Realtime.
-- ---------------------------------------------------------------------------
do $pub$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end
$pub$;
