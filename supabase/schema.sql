-- Everything Marketplace — core schema (PostgreSQL / Supabase)
-- Run in Supabase SQL Editor before policies.sql and storage.sql

-- ---------------------------------------------------------------------------
-- Public user profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  avatar_url text,
  role text not null default 'buyer' check (role in ('buyer', 'seller')),
  is_executive boolean not null default false,
  banned_at timestamptz,
  is_verified_live_seller boolean not null default false,
  live_seller_suspended_until timestamptz,
  live_buyer_claim_strikes int not null default 0,
  live_seller_violation_count int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.users is 'App profile; rows created on signup via trigger.';
comment on column public.users.banned_at is 'When set, middleware blocks the session (executive tooling).';

-- Auto-create profile when a new auth user registers
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r text;
  meta jsonb;
  v_name text;
  v_avatar text;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  r := lower(trim(coalesce(meta ->> 'role', '')));
  if r not in ('buyer', 'seller') then
    r := 'buyer';
  end if;

  v_name := coalesce(
    nullif(trim(meta ->> 'name'), ''),
    nullif(trim(meta ->> 'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  v_avatar := nullif(trim(meta ->> 'avatar_url'), '');
  if v_avatar is null or v_avatar = '' then
    if jsonb_typeof(meta -> 'picture') = 'object' then
      v_avatar := nullif(trim(meta #>> '{picture,data,url}'), '');
      if v_avatar is null or v_avatar = '' then
        v_avatar := nullif(trim(meta #>> '{picture,url}'), '');
      end if;
    elsif jsonb_typeof(meta -> 'picture') = 'string' then
      v_avatar := nullif(trim(meta ->> 'picture'), '');
    end if;
  end if;

  insert into public.users (id, name, avatar_url, role)
  values (new.id, v_name, v_avatar, r)
  on conflict (id) do update
    set name = excluded.name,
        avatar_url = coalesce(
          nullif(excluded.avatar_url, ''),
          public.users.avatar_url
        ),
        role = case
          when excluded.role in ('buyer', 'seller') then excluded.role
          else public.users.role
        end,
        is_executive = public.users.is_executive,
        banned_at = public.users.banned_at,
        is_verified_live_seller = public.users.is_verified_live_seller;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user ();

drop trigger if exists on_auth_user_updated on auth.users;

create trigger on_auth_user_updated
  after update on auth.users
  for each row
  when (old.raw_user_meta_data is distinct from new.raw_user_meta_data)
  execute function public.handle_new_user ();

-- ---------------------------------------------------------------------------
-- Categories (self-referential: parent = main category, child = subcategory)
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  icon text not null default '',
  parent_id uuid references public.categories (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (name, parent_id)
);

create index if not exists idx_categories_parent on public.categories (parent_id);

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid (),
  title text not null,
  description text not null default '',
  price numeric(14, 2) not null check (price >= 0),
  category_id uuid not null references public.categories (id) on delete restrict,
  subcategory_id uuid references public.categories (id) on delete set null,
  user_id uuid not null references public.users (id) on delete cascade,
  location text not null default '',
  condition text not null default 'used' check (condition in ('new', 'like_new', 'used', 'for_parts')),
  tags jsonb not null default '[]'::jsonb,
  -- Philippines-specific fields
  barangay text,
  city text,
  province text,
  payment_options jsonb not null default '[]'::jsonb,
  pasabuy_available boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listings_category on public.listings (category_id);
create index if not exists idx_listings_subcategory on public.listings (subcategory_id);
create index if not exists idx_listings_user on public.listings (user_id);
create index if not exists idx_listings_created on public.listings (created_at desc);
create index if not exists idx_listings_city on public.listings (city);
create index if not exists idx_listings_barangay on public.listings (barangay);
create index if not exists idx_listings_tags on public.listings using gin (tags);

-- Full-text style search helper: generated column alternative = simple ILIKE in app
-- Keep tags as jsonb array of strings, e.g. ["motorcycle","honda"]

create or replace function public.set_listings_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_listings_updated on public.listings;

create trigger trg_listings_updated
  before update on public.listings
  for each row
  execute function public.set_listings_updated_at ();

-- ---------------------------------------------------------------------------
-- Listing images
-- ---------------------------------------------------------------------------
create table if not exists public.images (
  id uuid primary key default gen_random_uuid (),
  listing_id uuid not null references public.listings (id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_images_listing on public.images (listing_id, sort_order);

-- ---------------------------------------------------------------------------
-- Messages (buyer/seller chat, tied to a listing)
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid (),
  sender_id uuid not null references public.users (id) on delete cascade,
  receiver_id uuid not null references public.users (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  content text not null check (char_length(content) > 0),
  created_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create index if not exists idx_messages_listing on public.messages (listing_id);
create index if not exists idx_messages_sender on public.messages (sender_id);
create index if not exists idx_messages_receiver on public.messages (receiver_id);
create index if not exists idx_messages_created on public.messages (created_at desc);

-- ---------------------------------------------------------------------------
-- Favorites
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.users (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

create index if not exists idx_favorites_user on public.favorites (user_id);
