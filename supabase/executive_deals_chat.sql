-- Executive console: deal / negotiation / messaging insights.
-- Requires: public.listings (buyer_id, transaction_completed_at from reviews.sql), public.messages, public.users.
-- Run in Supabase SQL Editor after reviews.sql and executive.sql.

create or replace function public.get_executive_deal_insights ()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'marked_sold_count',
    (
      select count(*)::int
      from public.listings
      where transaction_completed_at is not null
    ),
    'under_negotiation_count',
    (
      select count(distinct l.id)::int
      from public.listings l
      where l.transaction_completed_at is null
        and exists (
          select 1
          from public.messages m
          where m.listing_id = l.id
        )
    ),
    'listings_with_chat_count',
    (
      select count(distinct m.listing_id)::int
      from public.messages m
    ),
    'total_messages_count',
    (select count(*)::int from public.messages)
  );
$$;

create or replace function public.get_executive_listing_chat_activity (
  p_limit int default 50,
  p_offset int default 0
)
returns table (
  listing_id uuid,
  title text,
  seller_id uuid,
  seller_name text,
  message_count bigint,
  participant_count bigint,
  last_message_at timestamptz,
  transaction_completed_at timestamptz,
  buyer_id uuid,
  buyer_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.id,
    l.title,
    l.user_id,
    coalesce(usr.name, ''),
    count(distinct m.id) as message_count,
    count(distinct p.uid) as participant_count,
    max(m.created_at) as last_message_at,
    l.transaction_completed_at,
    l.buyer_id,
    coalesce(buyer.name, '')
  from public.listings l
  join public.users usr on usr.id = l.user_id
  left join public.users buyer on buyer.id = l.buyer_id
  join public.messages m on m.listing_id = l.id
  cross join lateral (
    select unnest(array[m.sender_id, m.receiver_id]) as uid
  ) p
  group by
    l.id,
    l.title,
    l.user_id,
    usr.name,
    l.transaction_completed_at,
    l.buyer_id,
    buyer.name
  order by max(m.created_at) desc
  limit greatest(1, least(coalesce(p_limit, 50), 200))
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.get_executive_deal_insights () from public;
revoke all on function public.get_executive_listing_chat_activity (int, int) from public;

grant execute on function public.get_executive_deal_insights () to service_role;
grant execute on function public.get_executive_listing_chat_activity (int, int) to service_role;

comment on function public.get_executive_deal_insights is
  'KPIs for executive deal-chat page; call only with service role from trusted API.';
comment on function public.get_executive_listing_chat_activity is
  'Listings with message activity; call only with service role from trusted API.';
