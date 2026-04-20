-- Executive dashboard access, visit tracking, and KPI RPC.
-- Run in Supabase SQL Editor after schema.sql, profile_fields.sql, and policies.sql.

-- ---------------------------------------------------------------------------
-- Executive flag on profiles (never overwritten by OAuth trigger)
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists is_executive boolean not null default false;

comment on column public.users.is_executive is 'Internal dashboard access; set only via SQL or trusted admin tooling.';

create index if not exists idx_users_is_executive on public.users (is_executive) where is_executive;

-- ---------------------------------------------------------------------------
-- Site visits (anonymous inserts for traffic; executives read)
-- ---------------------------------------------------------------------------
create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid (),
  created_at timestamptz not null default now(),
  path text not null default '/',
  constraint site_visits_path_len check (char_length (path) <= 2048)
);

comment on table public.site_visits is 'Lightweight page-view log; one row per beacon fire from the browser.';

create index if not exists idx_site_visits_created on public.site_visits (created_at desc);
create index if not exists idx_site_visits_created_day on public.site_visits (((
  created_at at time zone 'Asia/Manila'
)::date));

grant insert on public.site_visits to anon, authenticated;
grant select on public.site_visits to authenticated;

alter table public.site_visits enable row level security;

drop policy if exists "site_visits_insert_public" on public.site_visits;
create policy "site_visits_insert_public"
  on public.site_visits for insert
  to anon, authenticated
  with check (true);

drop policy if exists "site_visits_select_executive" on public.site_visits;
create policy "site_visits_select_executive"
  on public.site_visits for select
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = (select auth.uid ())
        and coalesce (u.is_executive, false)
    )
  );

-- ---------------------------------------------------------------------------
-- Preserve is_executive when auth metadata syncs profiles
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Dashboard metrics (executives only; efficient single round-trip)
-- ---------------------------------------------------------------------------
create or replace function public.get_executive_dashboard ()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ok boolean;
  v_start date := (current_date - interval '59 days')::date;
  tz text := 'Asia/Manila';
begin
  if (select auth.uid ()) is null then
    raise exception 'not authenticated';
  end if;

  select exists (
    select 1
    from public.users u
    where u.id = (select auth.uid ())
      and coalesce (u.is_executive, false)
  )
  into v_ok;

  if not v_ok then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'timezone', tz,
    'generated_at', to_jsonb (now ()),
    'total_listings', to_jsonb ((select count(*)::int from public.listings)),
    'total_users', to_jsonb ((select count(*)::int from public.users)),
    'total_site_visits', to_jsonb ((select count(*)::int from public.site_visits)),
    'avg_listing_price',
      to_jsonb (
        coalesce(
          (
            select round(avg (l.price)::numeric, 2)
            from public.listings l
          ),
          0::numeric
        )
      ),
    'listings_by_category',
      coalesce(
        (
          select jsonb_agg (row_json order by cnt desc nulls last)
          from (
            select
              jsonb_build_object(
                'category_id', c.id,
                'name', c.name,
                'count', x.cnt
              ) as row_json,
              x.cnt
            from (
              select l.category_id, count(*)::int as cnt
              from public.listings l
              group by l.category_id
            ) x
            join public.categories c on c.id = x.category_id
          ) s
        ),
        '[]'::jsonb
      ),
    'listings_by_province',
      coalesce(
        (
          select jsonb_agg (row_json order by cnt desc nulls last)
          from (
            select
              jsonb_build_object(
                'province', prov,
                'count', cnt
              ) as row_json,
              cnt
            from (
              select
                coalesce (nullif (trim (l.province), ''), 'Not specified') as prov,
                count(*)::int as cnt
              from public.listings l
              group by 1
            ) p
          ) q
        ),
        '[]'::jsonb
      ),
    'payment_mix',
      coalesce(
        (
          select jsonb_agg (row_json order by cnt desc nulls last)
          from (
            select
              jsonb_build_object(
                'option', opt,
                'count', cnt
              ) as row_json,
              cnt
            from (
              select
                lower (elem.val) as opt,
                count(*)::int as cnt
              from public.listings l,
              lateral jsonb_array_elements_text (
                coalesce (l.payment_options, '[]'::jsonb)
              ) as elem (val)
              group by 1
            ) p
          ) q
        ),
        '[]'::jsonb
      ),
    'user_locations',
      coalesce(
        (
          select jsonb_agg (row_json order by cnt desc nulls last)
          from (
            select
              jsonb_build_object(
                'label', lbl,
                'count', cnt
              ) as row_json,
              cnt
            from (
              select
                case
                  when u.address_public is null
                  or btrim(u.address_public) = '' then 'Not specified'
                  else left (btrim(u.address_public), 120)
                end as lbl,
                count(*)::int as cnt
              from public.users u
              group by 1
            ) p
            order by cnt desc
            limit 15
          ) q
        ),
        '[]'::jsonb
      ),
    'daily',
      coalesce(
        (
          select jsonb_agg (z.payload order by z.sort_d)
          from (
            select
              days.d as sort_d,
              jsonb_build_object(
                'date', days.d::text,
                'new_users', coalesce (nu.c, 0),
                'new_listings', coalesce (nl.c, 0),
                'visits', coalesce (nv.c, 0),
                'pct_user_growth',
                  case
                    when coalesce (pu.prev_c, 0) = 0
                    and coalesce (nu.c, 0) > 0 then 100::numeric
                    when coalesce (pu.prev_c, 0) = 0 then 0::numeric
                    else round(
                      (
                        (coalesce (nu.c, 0)::numeric - pu.prev_c::numeric)
                        / nullif (pu.prev_c::numeric, 0)
                      ) * 100,
                      2
                    )
                  end,
                'pct_listing_growth',
                  case
                    when coalesce (pl.prev_c, 0) = 0
                    and coalesce (nl.c, 0) > 0 then 100::numeric
                    when coalesce (pl.prev_c, 0) = 0 then 0::numeric
                    else round(
                      (
                        (coalesce (nl.c, 0)::numeric - pl.prev_c::numeric)
                        / nullif (pl.prev_c::numeric, 0)
                      ) * 100,
                      2
                    )
                  end,
                'pct_visit_growth',
                  case
                    when coalesce (pv.prev_c, 0) = 0
                    and coalesce (nv.c, 0) > 0 then 100::numeric
                    when coalesce (pv.prev_c, 0) = 0 then 0::numeric
                    else round(
                      (
                        (coalesce (nv.c, 0)::numeric - pv.prev_c::numeric)
                        / nullif (pv.prev_c::numeric, 0)
                      ) * 100,
                      2
                    )
                  end
              ) as payload
            from (
              select generate_series (v_start, current_date, interval '1 day')::date as d
            ) days
            left join lateral (
              select count(*)::int as c
              from public.users u
              where (u.created_at at time zone tz)::date = days.d
            ) nu on true
            left join lateral (
              select count(*)::int as c
              from public.listings l
              where (l.created_at at time zone tz)::date = days.d
            ) nl on true
            left join lateral (
              select count(*)::int as c
              from public.site_visits v
              where (v.created_at at time zone tz)::date = days.d
            ) nv on true
            left join lateral (
              select count(*)::int as prev_c
              from public.users u
              where (u.created_at at time zone tz)::date = days.d - 1
            ) pu on true
            left join lateral (
              select count(*)::int as prev_c
              from public.listings l
              where (l.created_at at time zone tz)::date = days.d - 1
            ) pl on true
            left join lateral (
              select count(*)::int as prev_c
              from public.site_visits v
              where (v.created_at at time zone tz)::date = days.d - 1
            ) pv on true
          ) z
        ),
        '[]'::jsonb
      )
  );
end;
$$;

revoke all on function public.get_executive_dashboard () from public;
grant execute on function public.get_executive_dashboard () to authenticated;

comment on function public.get_executive_dashboard is 'Returns KPI JSON for executive dashboards; auth.uid() must have users.is_executive.';

-- ---------------------------------------------------------------------------
-- Promote / demote executives (run manually in SQL editor)
-- ---------------------------------------------------------------------------
-- Promote one account by email:
-- update public.users u
-- set is_executive = true
-- from auth.users au
-- where u.id = au.id
--   and lower(au.email) = lower('exec@yourcompany.com');
--
-- Promote by user id:
-- update public.users set is_executive = true where id = '00000000-0000-0000-0000-000000000000';
--
-- Demote:
-- update public.users set is_executive = false where id = '...';
