-- =========================================================
-- LookKool — First-time Admin Setup
-- =========================================================
-- Run this ONCE to set up the first admin user.
--
-- Steps:
-- 1. Sign up normally on your app (email/password or Google)
-- 2. Go to Supabase Dashboard → Authentication → Users
-- 3. Copy the user's UUID
-- 4. Replace the UUID below and run this query
-- =========================================================

-- Replace 'YOUR-USER-UUID-HERE' with the actual UUID from Supabase Auth
UPDATE public.users
SET role = 'admin'
WHERE user_id = 'YOUR-USER-UUID-HERE';

-- Verify it worked:
-- SELECT user_id, name, email, role FROM public.users WHERE role = 'admin';
