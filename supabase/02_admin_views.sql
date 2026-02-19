-- =========================================================
-- LookKool — Admin Views for Supabase Dashboard
-- =========================================================
-- These views make it easy to browse data in the Supabase
-- Dashboard Table Editor. They join related tables so admins
-- see human-readable data without manual JOINs.
--
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =========================================================

-- ─────────────────────────────────────────────────────────
-- 1. ORDER OVERVIEW — one row per order with customer info
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.admin_orders_overview AS
SELECT
  o.order_id,
  o.order_date,
  o.status           AS order_status,
  o.payment_status,
  o.payment_method,
  o.subtotal,
  o.delivery_charge,
  o.discount_amount,
  o.coupon_code,
  o.total_amount,
  o.razorpay_order_id,
  o.razorpay_payment_id,
  o.tracking_number,
  o.shipping_name,
  o.shipping_phone,
  o.shipping_address_line1,
  o.shipping_address_line2,
  o.shipping_city,
  o.shipping_state,
  o.shipping_pincode,
  u.name              AS customer_name,
  u.email             AS customer_email,
  u.phone_number      AS customer_phone,
  (SELECT count(*) FROM public.order_items oi WHERE oi.order_id = o.order_id) AS item_count
FROM public.orders o
LEFT JOIN public.users u ON o.user_id = u.user_id
ORDER BY o.order_date DESC;

-- ─────────────────────────────────────────────────────────
-- 2. ORDER ITEMS DETAIL — each line item with product info
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.admin_order_items AS
SELECT
  oi.order_item_id,
  oi.order_id,
  oi.product_name,
  oi.variant_color,
  oi.variant_size,
  oi.quantity,
  oi.price_per_unit,
  (oi.quantity * oi.price_per_unit)  AS line_total,
  p.slug              AS product_slug,
  p.product_code,
  p.is_active         AS product_still_active,
  o.status            AS order_status,
  o.order_date
FROM public.order_items oi
JOIN public.orders o   ON oi.order_id   = o.order_id
LEFT JOIN public.products p ON oi.product_id = p.product_id
ORDER BY o.order_date DESC, oi.order_item_id;

-- ─────────────────────────────────────────────────────────
-- 3. PRODUCT CATALOGUE — products with category + stock
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.admin_products_overview AS
SELECT
  p.product_id,
  p.product_name,
  p.slug,
  p.product_code,
  p.base_price,
  p.mrp,
  p.label,
  p.is_active,
  p.priority,
  p.material,
  p.origin,
  c.category_name,
  c.slug AS category_slug,
  (SELECT count(*) FROM public.productvariants v WHERE v.product_id = p.product_id) AS variant_count,
  (SELECT COALESCE(sum(v.stock_count), 0) FROM public.productvariants v WHERE v.product_id = p.product_id) AS total_stock,
  (SELECT count(*) FROM public.reviews r WHERE r.product_id = p.product_id AND r.is_approved = true) AS review_count,
  (SELECT COALESCE(round(avg(r.rating), 1), 0) FROM public.reviews r WHERE r.product_id = p.product_id AND r.is_approved = true) AS avg_rating,
  p.created_at,
  p.updated_at
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.category_id
ORDER BY p.priority, p.product_name;

-- ─────────────────────────────────────────────────────────
-- 4. INVENTORY — every variant with stock levels
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.admin_inventory AS
SELECT
  v.variant_id,
  v.sku,
  p.product_name,
  p.product_code,
  v.color,
  v.hexcode,
  v.size,
  v.stock_count,
  v.price_modifier,
  (p.base_price::numeric + v.price_modifier::numeric) AS final_price,
  p.is_active AS product_active,
  CASE WHEN v.stock_count = 0 THEN 'OUT OF STOCK'
       WHEN v.stock_count <= 5 THEN 'LOW STOCK'
       ELSE 'IN STOCK'
  END AS stock_status,
  (SELECT count(*)
   FROM public.productimages pi
   WHERE pi.variant_id = v.variant_id) AS image_count
FROM public.productvariants v
JOIN public.products p ON v.product_id = p.product_id
ORDER BY v.stock_count ASC, p.product_name;

-- ─────────────────────────────────────────────────────────
-- 5. REVIEWS — with product name and customer
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.admin_reviews AS
SELECT
  r.review_id,
  r.rating,
  r.reviewer_name,
  r.review_text,
  r.is_verified,
  r.is_approved,
  r.created_at,
  p.product_name,
  p.slug AS product_slug,
  u.email AS reviewer_email
FROM public.reviews r
JOIN public.products p ON r.product_id = p.product_id
LEFT JOIN public.users u ON r.user_id = u.user_id
ORDER BY r.created_at DESC;

-- ─────────────────────────────────────────────────────────
-- 6. RETURN REQUESTS — with order and item info
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.admin_return_requests AS
SELECT
  rr.return_id,
  rr.order_id,
  rr.reason,
  rr.description,
  rr.status         AS return_status,
  rr.refund_amount,
  rr.admin_notes,
  rr.created_at,
  oi.product_name,
  oi.variant_color,
  oi.variant_size,
  oi.quantity,
  oi.price_per_unit,
  u.name            AS customer_name,
  u.email           AS customer_email,
  o.status          AS order_status,
  o.total_amount    AS order_total
FROM public.return_requests rr
JOIN public.order_items oi ON rr.order_item_id = oi.order_item_id
JOIN public.orders o       ON rr.order_id = o.order_id
JOIN public.users u        ON rr.user_id = u.user_id
ORDER BY rr.created_at DESC;

-- ─────────────────────────────────────────────────────────
-- 7. COUPON USAGE — with customer and order details
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.admin_coupon_usage AS
SELECT
  cu.usage_id,
  c.code              AS coupon_code,
  c.discount_type,
  c.discount_value,
  cu.discount_amount_applied,
  cu.used_at,
  cu.order_id,
  u.name              AS customer_name,
  u.email             AS customer_email,
  o.total_amount      AS order_total,
  c.usage_count,
  c.usage_limit_total,
  c.is_active         AS coupon_active
FROM public.coupon_usage cu
JOIN public.coupons c ON cu.coupon_id = c.coupon_id
JOIN public.users u   ON cu.user_id = u.user_id
LEFT JOIN public.orders o ON cu.order_id = o.order_id
ORDER BY cu.used_at DESC;

-- ─────────────────────────────────────────────────────────
-- 8. CUSTOMERS — overview with order stats
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.admin_customers AS
SELECT
  u.user_id,
  u.name,
  u.email,
  u.phone_number,
  u.role,
  u.is_email_verified,
  u.created_at       AS joined_at,
  u.last_login_at,
  (SELECT count(*) FROM public.orders o WHERE o.user_id = u.user_id) AS total_orders,
  (SELECT COALESCE(sum(o.total_amount::numeric), 0) FROM public.orders o WHERE o.user_id = u.user_id AND o.payment_status = 'Completed') AS lifetime_spend,
  (SELECT count(*) FROM public.user_addresses a WHERE a.user_id = u.user_id) AS saved_addresses
FROM public.users u
ORDER BY u.created_at DESC;

-- ─────────────────────────────────────────────────────────
-- 9. REVENUE SUMMARY — daily sales
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.admin_daily_revenue AS
SELECT
  date_trunc('day', o.order_date)::date AS sale_date,
  count(*)                              AS order_count,
  sum(o.total_amount::numeric)          AS total_revenue,
  sum(o.discount_amount::numeric)       AS total_discounts,
  sum(o.delivery_charge::numeric)       AS total_delivery_charges,
  count(*) FILTER (WHERE o.payment_method = 'razorpay') AS online_orders,
  count(*) FILTER (WHERE o.payment_method = 'cod')      AS cod_orders
FROM public.orders o
WHERE o.payment_status = 'Completed'
GROUP BY date_trunc('day', o.order_date)
ORDER BY sale_date DESC;

-- ─────────────────────────────────────────────────────────
-- 10. LOW STOCK ALERTS — variants with ≤5 items
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.admin_low_stock AS
SELECT
  v.variant_id,
  p.product_name,
  p.product_code,
  v.color,
  v.size,
  v.stock_count,
  v.sku,
  p.is_active
FROM public.productvariants v
JOIN public.products p ON v.product_id = p.product_id
WHERE v.stock_count <= 5 AND p.is_active = true
ORDER BY v.stock_count ASC;
