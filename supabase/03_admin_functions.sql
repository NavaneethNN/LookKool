-- =========================================================
-- LookKool — Admin Database Functions
-- =========================================================
-- Callable from Supabase Dashboard → SQL Editor, or via
-- supabase.rpc('function_name', { params }) from code.
--
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =========================================================

-- ─────────────────────────────────────────────────────────
-- 1. UPDATE ORDER STATUS
-- Usage: SELECT admin_update_order_status(42, 'Shipped');
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  p_order_id integer,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.orders
  SET status = p_status::order_status,
      updated_at = now()
  WHERE order_id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 2. UPDATE PAYMENT STATUS
-- Usage: SELECT admin_update_payment_status(42, 'Completed');
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_update_payment_status(
  p_order_id integer,
  p_payment_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.orders
  SET payment_status = p_payment_status::payment_status,
      updated_at = now()
  WHERE order_id = p_order_id;
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 3. SET TRACKING NUMBER
-- Usage: SELECT admin_set_tracking('42', 'TRACK123456');
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_set_tracking(
  p_order_id integer,
  p_tracking_number text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.orders
  SET tracking_number = p_tracking_number,
      updated_at = now()
  WHERE order_id = p_order_id;
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 4. RESOLVE RETURN REQUEST
-- Usage: SELECT admin_resolve_return(7, 'Approved', 'Refund processed');
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_resolve_return(
  p_return_id integer,
  p_status text,
  p_admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.return_requests
  SET status = p_status::return_status,
      admin_notes = COALESCE(p_admin_notes, admin_notes),
      updated_at = now()
  WHERE return_id = p_return_id;
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 5. TOGGLE REVIEW APPROVAL
-- Usage: SELECT admin_toggle_review(15);
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_toggle_review(
  p_review_id integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_status boolean;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.reviews
  SET is_approved = NOT is_approved,
      updated_at = now()
  WHERE review_id = p_review_id
  RETURNING is_approved INTO v_new_status;

  RETURN v_new_status;
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 6. DELETE REVIEW
-- Usage: SELECT admin_delete_review(15);
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_delete_review(
  p_review_id integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  DELETE FROM public.reviews WHERE review_id = p_review_id;
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 7. UPDATE VARIANT STOCK
-- Usage: SELECT admin_update_stock(101, 50);
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_update_stock(
  p_variant_id integer,
  p_stock_count integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.productvariants
  SET stock_count = p_stock_count,
      updated_at = now()
  WHERE variant_id = p_variant_id;
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 8. TOGGLE PRODUCT ACTIVE
-- Usage: SELECT admin_toggle_product(5);
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_toggle_product(
  p_product_id integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_status boolean;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.products
  SET is_active = NOT is_active,
      updated_at = now()
  WHERE product_id = p_product_id
  RETURNING is_active INTO v_new_status;

  RETURN v_new_status;
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 9. TOGGLE COUPON ACTIVE
-- Usage: SELECT admin_toggle_coupon(3);
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_toggle_coupon(
  p_coupon_id integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_status boolean;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.coupons
  SET is_active = NOT is_active,
      updated_at = now()
  WHERE coupon_id = p_coupon_id
  RETURNING is_active INTO v_new_status;

  RETURN v_new_status;
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 10. PROMOTE USER TO ADMIN
-- Usage: SELECT admin_set_user_role('uuid-here', 'admin');
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id uuid,
  p_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.users
  SET role = p_role::user_role,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 11. CANCEL ORDER + RESTORE STOCK
-- Usage: SELECT admin_cancel_order(42);
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_cancel_order(
  p_order_id integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Restore stock for each item
  UPDATE public.productvariants pv
  SET stock_count = pv.stock_count + oi.quantity,
      updated_at = now()
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id
    AND pv.variant_id = oi.variant_id;

  -- Mark order as cancelled
  UPDATE public.orders
  SET status = 'Cancelled',
      updated_at = now()
  WHERE order_id = p_order_id;
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 12. DASHBOARD STATS (callable via RPC)
-- Usage: SELECT * FROM admin_dashboard_stats();
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT json_build_object(
    'total_orders',       (SELECT count(*) FROM public.orders),
    'total_revenue',      (SELECT COALESCE(sum(total_amount::numeric), 0) FROM public.orders WHERE payment_status = 'Completed'),
    'total_products',     (SELECT count(*) FROM public.products),
    'active_products',    (SELECT count(*) FROM public.products WHERE is_active = true),
    'total_users',        (SELECT count(*) FROM public.users),
    'total_reviews',      (SELECT count(*) FROM public.reviews),
    'pending_orders',     (SELECT count(*) FROM public.orders WHERE status = 'Pending'),
    'pending_returns',    (SELECT count(*) FROM public.return_requests WHERE status = 'Pending'),
    'unapproved_reviews', (SELECT count(*) FROM public.reviews WHERE is_approved = false),
    'low_stock_variants', (SELECT count(*) FROM public.productvariants v JOIN public.products p ON v.product_id = p.product_id WHERE v.stock_count <= 5 AND p.is_active = true),
    'today_orders',       (SELECT count(*) FROM public.orders WHERE order_date::date = CURRENT_DATE),
    'today_revenue',      (SELECT COALESCE(sum(total_amount::numeric), 0) FROM public.orders WHERE order_date::date = CURRENT_DATE AND payment_status = 'Completed')
  ) INTO result;

  RETURN result;
END;
$$;
