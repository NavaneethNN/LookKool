-- =========================================================
-- LookKool — Supabase Admin Setup
-- =========================================================
-- Run this SQL in Supabase Dashboard → SQL Editor → New Query
-- This sets up:
--   1. RLS policies for all tables
--   2. Admin-friendly views for Dashboard usage
--   3. Database functions for common admin operations
--   4. Triggers for auto-sync and timestamps
-- =========================================================

-- ─────────────────────────────────────────────────────────
-- 0. HELPER: Check if current user is admin
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- ─────────────────────────────────────────────────────────
-- 1. ROW LEVEL SECURITY (RLS) POLICIES
-- ─────────────────────────────────────────────────────────

-- ── users ──────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own profile (on sign-up)
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins have full access to users"
  ON public.users FOR ALL
  USING (public.is_admin());

-- ── user_addresses ─────────────────────────────────────

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses"
  ON public.user_addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins have full access to addresses"
  ON public.user_addresses FOR ALL
  USING (public.is_admin());

-- ── categories ─────────────────────────────────────────

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public read for active categories
CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins have full access to categories"
  ON public.categories FOR ALL
  USING (public.is_admin());

-- ── products ───────────────────────────────────────────

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins have full access to products"
  ON public.products FOR ALL
  USING (public.is_admin());

-- ── productvariants ────────────────────────────────────

ALTER TABLE public.productvariants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view variants"
  ON public.productvariants FOR SELECT
  USING (true);

CREATE POLICY "Admins have full access to variants"
  ON public.productvariants FOR ALL
  USING (public.is_admin());

-- ── productimages ──────────────────────────────────────

ALTER TABLE public.productimages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view images"
  ON public.productimages FOR SELECT
  USING (true);

CREATE POLICY "Admins have full access to images"
  ON public.productimages FOR ALL
  USING (public.is_admin());

-- ── orders ─────────────────────────────────────────────

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins have full access to orders"
  ON public.orders FOR ALL
  USING (public.is_admin());

-- ── order_items ────────────────────────────────────────

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.order_id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.order_id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to order items"
  ON public.order_items FOR ALL
  USING (public.is_admin());

-- ── return_requests ────────────────────────────────────

ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own returns"
  ON public.return_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own returns"
  ON public.return_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins have full access to returns"
  ON public.return_requests FOR ALL
  USING (public.is_admin());

-- ── reviews ────────────────────────────────────────────

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved reviews
CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews FOR SELECT
  USING (is_approved = true);

-- Users can insert reviews
CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can do everything (moderate)
CREATE POLICY "Admins have full access to reviews"
  ON public.reviews FOR ALL
  USING (public.is_admin());

-- ── coupons ────────────────────────────────────────────

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
  ON public.coupons FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins have full access to coupons"
  ON public.coupons FOR ALL
  USING (public.is_admin());

-- ── coupon_usage ───────────────────────────────────────

ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coupon usage"
  ON public.coupon_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coupon usage"
  ON public.coupon_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins have full access to coupon usage"
  ON public.coupon_usage FOR ALL
  USING (public.is_admin());

-- ── coupon_categories / coupon_products / coupon_customers

ALTER TABLE public.coupon_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read coupon_categories"
  ON public.coupon_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage coupon_categories"
  ON public.coupon_categories FOR ALL USING (public.is_admin());

ALTER TABLE public.coupon_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read coupon_products"
  ON public.coupon_products FOR SELECT USING (true);
CREATE POLICY "Admins manage coupon_products"
  ON public.coupon_products FOR ALL USING (public.is_admin());

ALTER TABLE public.coupon_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage coupon_customers"
  ON public.coupon_customers FOR ALL USING (public.is_admin());

-- ── offers ─────────────────────────────────────────────

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active offers"
  ON public.offers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins have full access to offers"
  ON public.offers FOR ALL
  USING (public.is_admin());

-- ── payment_issues ─────────────────────────────────────

ALTER TABLE public.payment_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to payment issues"
  ON public.payment_issues FOR ALL
  USING (public.is_admin());

-- ── wishlist ───────────────────────────────────────────

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlist"
  ON public.wishlist FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── cart ───────────────────────────────────────────────

ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart"
  ON public.cart FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all carts"
  ON public.cart FOR SELECT
  USING (public.is_admin());

-- ── notifications ──────────────────────────────────────

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications (mark read)"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to notifications"
  ON public.notifications FOR ALL
  USING (public.is_admin());

-- ── notification_preferences ───────────────────────────

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification prefs"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── newsletter ─────────────────────────────────────────

ALTER TABLE public.newsletter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.newsletter FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins have full access to newsletter"
  ON public.newsletter FOR ALL
  USING (public.is_admin());

-- ── delivery_settings ──────────────────────────────────

ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read delivery settings"
  ON public.delivery_settings FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins have full access to delivery settings"
  ON public.delivery_settings FOR ALL
  USING (public.is_admin());
