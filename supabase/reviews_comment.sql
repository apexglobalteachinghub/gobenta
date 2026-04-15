-- Optional written feedback on peer reviews. Run after reviews.sql.

alter table public.user_reviews
  add column if not exists comment text;

comment on column public.user_reviews.comment is 'Optional note from reviewer after completed deal.';
