-- Extra public-trust fields on user profiles. Run after schema.sql.
-- Shown on /u/[id] for legitimacy; never store full government ID numbers.

alter table public.users
  add column if not exists phone text;

alter table public.users
  add column if not exists address_public text;

alter table public.users
  add column if not exists government_id_type text;

alter table public.users
  add column if not exists government_id_last4 text;

alter table public.users
  add column if not exists bio text;

comment on column public.users.phone is 'Optional contact; visible on public profile.';
comment on column public.users.address_public is 'City/area or meet-up hint; visible on public profile.';
comment on column public.users.government_id_type is 'e.g. PhilSys, Driver license — type only.';
comment on column public.users.government_id_last4 is 'Last 4 characters only; never store full ID.';
