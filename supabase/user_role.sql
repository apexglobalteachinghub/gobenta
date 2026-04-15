-- Add buyer/seller role to profiles (run once if you already applied schema.sql without this column)

alter table public.users
  add column if not exists role text not null default 'buyer'
  check (role in ('buyer', 'seller'));

comment on column public.users.role is 'Account intent: buyer or seller (set at registration).';

create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r text;
begin
  r := lower(trim(coalesce(new.raw_user_meta_data ->> 'role', '')));
  if r not in ('buyer', 'seller') then
    r := 'buyer';
  end if;

  insert into public.users (id, name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    r
  )
  on conflict (id) do update
    set name = excluded.name,
        avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
        role = case
          when excluded.role in ('buyer', 'seller') then excluded.role
          else public.users.role
        end;
  return new;
end;
$$;
