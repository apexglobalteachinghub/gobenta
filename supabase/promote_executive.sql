-- Promote an existing marketplace account to executive (run in Supabase SQL editor).
-- Replace the email with the account that should access https://yoursite.com/executive

update public.users u
set is_executive = true
from auth.users au
where u.id = au.id
  and lower(au.email) = lower('executive@yourcompany.com');

-- Verify:
-- select u.id, u.name, u.is_executive, au.email
-- from public.users u
-- join auth.users au on au.id = u.id
-- where u.is_executive;

-- Demote:
-- update public.users set is_executive = false where id = '<uuid>';
