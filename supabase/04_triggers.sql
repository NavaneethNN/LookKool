-- =========================================================
-- LookKool — Triggers & Auto-sync
-- =========================================================
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =========================================================

-- ─────────────────────────────────────────────────────────
-- 1. AUTO-UPDATE updated_at TIMESTAMPS
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at column
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'updated_at'
      AND table_name NOT LIKE 'admin_%'
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I; '
      'CREATE TRIGGER set_updated_at '
      'BEFORE UPDATE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 2. AUTO-CREATE USER PROFILE ON AUTH SIGNUP
-- ─────────────────────────────────────────────────────────
-- This trigger fires when a new user signs up via Supabase Auth.
-- It inserts a row into public.users with data from auth.users.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name);

  RETURN NEW;
END;
$$;

-- Drop if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────
-- 3. INCREMENT COUPON USAGE COUNT
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_coupon_usage_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.coupons
  SET usage_count = usage_count + 1
  WHERE coupon_id = NEW.coupon_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_coupon_used ON public.coupon_usage;
CREATE TRIGGER on_coupon_used
  AFTER INSERT ON public.coupon_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_coupon_usage_insert();

-- ─────────────────────────────────────────────────────────
-- 4. SYNC last_login_at ON AUTH SIGN-IN
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET last_login_at = now()
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_login();
