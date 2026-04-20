-- Add buyer/seller role to profiles (run once if you already applied schema.sql without this column)

alter table public.users
  add column if not exists role text not null default 'buyer'
  check (role in ('buyer', 'seller'));

alter table public.users
  add column if not exists is_executive boolean not null default false;

comment on column public.users.role is 'Account intent: buyer or seller (set at registration).';
comment on column public.users.is_executive is 'Internal dashboard access; set via supabase/executive.sql promote snippet.';

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
        is_executive = public.users.is_executive;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;

create trigger on_auth_user_updated
  after update on auth.users
  for each row
  when (old.raw_user_meta_data is distinct from new.raw_user_meta_data)
  execute function public.handle_new_user ();
