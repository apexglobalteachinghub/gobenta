-- Optional one-time fix if image_url values point at local Supabase (127.0.0.1 / localhost)
-- while production uses hosted Supabase. The app now normalizes these at runtime, but
-- updating the DB keeps OG shares, emails, and raw SQL exports correct.
--
-- 1) Replace YOUR_PROJECT_REF with your Supabase project ref (from Project URL).
-- 2) Run in Supabase SQL Editor, then verify a few rows.

/*
update public.images
set image_url =
  regexp_replace(
    image_url,
    '^https?://(?:127\.0\.0\.1|localhost)(?::54321)?',
    'https://YOUR_PROJECT_REF.supabase.co',
    'i'
  )
where image_url ~* 'https?://(127\.0\.0\.1|localhost)';
*/
