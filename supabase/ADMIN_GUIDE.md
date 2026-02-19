# LookKool — Supabase Admin Setup Guide

## Overview

LookKool uses **Supabase Dashboard** as the admin panel. No custom admin UI is needed — everything is managed directly at [app.supabase.com](https://app.supabase.com).

---

## Quick Start (Run in Order)

Go to **Supabase Dashboard → SQL Editor → New Query** and run each file:

| # | File | What it does |
|---|------|-------------|
| 1 | `01_rls_policies.sql` | Enables Row Level Security on all 18 tables with proper read/write policies |
| 2 | `02_admin_views.sql` | Creates 10 admin views (orders overview, inventory, reviews, revenue, etc.) |
| 3 | `03_admin_functions.sql` | Creates 12 admin functions (update order status, cancel order, manage stock, etc.) |
| 4 | `04_triggers.sql` | Auto-update timestamps, auto-create profile on signup, coupon usage counter, login sync |
| 5 | `05_setup_first_admin.sql` | Promotes your user to `admin` role (edit UUID first) |
| 6 | `06_storage_policies.sql` | Public read / admin-only write for the `products` storage bucket |

---

## Setting Up Your First Admin

1. Sign up on your site normally (email/password or Google)
2. Go to **Authentication → Users** in Supabase Dashboard
3. Copy your User UID
4. Go to **SQL Editor**, paste:
   ```sql
   UPDATE public.users SET role = 'admin' WHERE user_id = 'paste-uuid-here';
   ```
5. Run it. You're now an admin.

---

## Daily Admin Tasks via Supabase Dashboard

### Managing Orders

1. Go to **Table Editor → `admin_orders_overview`** (view)
2. See all orders with customer name, email, totals, status
3. To update an order, go to **SQL Editor** and run:
   ```sql
   -- Update order status
   SELECT admin_update_order_status(42, 'Shipped');

   -- Add tracking number
   SELECT admin_set_tracking(42, 'DTDC123456789');

   -- Mark payment as completed (for COD after delivery)
   SELECT admin_update_payment_status(42, 'Completed');

   -- Cancel order and restore stock
   SELECT admin_cancel_order(42);
   ```
4. Or edit directly: **Table Editor → orders** → click a row → edit fields

### Managing Products & Stock

1. **Table Editor → `admin_products_overview`** — see all products with category, stock, rating
2. **Table Editor → `admin_inventory`** — see all variants with stock status (OUT OF STOCK / LOW STOCK / IN STOCK)
3. **Table Editor → `admin_low_stock`** — see only variants with ≤ 5 items
4. To update stock:
   ```sql
   SELECT admin_update_stock(101, 50);  -- variant_id, new stock count
   ```
5. To toggle product visibility:
   ```sql
   SELECT admin_toggle_product(5);  -- toggles is_active
   ```
6. Or edit directly: **Table Editor → products** / **productvariants** → click row → edit

### Uploading Product Images

1. Go to **Storage → products** bucket
2. Upload images into organized folders (e.g., `variant_101/main.jpg`)
3. Copy the public URL
4. Go to **Table Editor → productimages** → Insert Row:
   - `variant_id`: the variant ID
   - `image_path`: the public URL from Storage
   - `is_primary`: true for the main image
   - `sort_order`: 0 for first image

### Moderating Reviews

1. **Table Editor → `admin_reviews`** — see all reviews with product name, rating, approval status
2. To approve/reject:
   ```sql
   SELECT admin_toggle_review(15);   -- toggles is_approved
   SELECT admin_delete_review(15);   -- permanently delete
   ```
3. Or edit directly: **Table Editor → reviews** → click row → toggle `is_approved`

### Handling Returns

1. **Table Editor → `admin_return_requests`** — see all returns with customer, product, reason
2. To resolve:
   ```sql
   -- Approve return
   SELECT admin_resolve_return(7, 'Approved', 'Refund will be processed in 3-5 days');

   -- Reject return
   SELECT admin_resolve_return(7, 'Rejected', 'Item was used');

   -- Mark as refunded
   SELECT admin_resolve_return(7, 'Refunded', 'Refund processed via Razorpay');
   ```

### Managing Coupons

1. **Table Editor → coupons** — view/edit all coupons
2. **Table Editor → `admin_coupon_usage`** — see who used which coupon
3. To create a coupon: **Table Editor → coupons → Insert Row**:
   - `code`: `SUMMER20` (will be matched case-insensitively)
   - `discount_type`: `percentage` or `fixed_amount`
   - `discount_value`: `20` (means 20% or ₹20)
   - `min_purchase_amount`: `999`
   - `max_discount_amount`: `500` (caps percentage discounts)
   - `valid_from` / `valid_till`: date range
   - `usage_limit_total`: max total uses (null = unlimited)
   - `usage_limit_per_customer`: max per customer (null = unlimited)
4. To toggle:
   ```sql
   SELECT admin_toggle_coupon(3);
   ```

### Managing Categories

1. **Table Editor → categories** — view/edit all categories
2. Edit `sort_order` to change display order
3. Toggle `is_active` to show/hide categories

### Viewing Customers

1. **Table Editor → `admin_customers`** — see all users with order count, lifetime spend, join date

### Revenue Dashboard

1. **Table Editor → `admin_daily_revenue`** — daily revenue breakdown
2. For full stats:
   ```sql
   SELECT * FROM admin_dashboard_stats();
   ```

---

## Important Views Reference

| View | Purpose |
|------|---------|
| `admin_orders_overview` | Orders with customer info, item count |
| `admin_order_items` | Line items with product details |
| `admin_products_overview` | Products with category, stock totals, ratings |
| `admin_inventory` | All variants with stock status flags |
| `admin_low_stock` | Variants with ≤ 5 stock (alerts) |
| `admin_reviews` | Reviews with product name and reviewer email |
| `admin_return_requests` | Returns with order and customer details |
| `admin_coupon_usage` | Coupon redemption log with customer info |
| `admin_customers` | Users with order stats and lifetime spend |
| `admin_daily_revenue` | Daily sales aggregation |

## Important Functions Reference

| Function | Usage |
|----------|-------|
| `admin_update_order_status(order_id, status)` | Change order status |
| `admin_update_payment_status(order_id, status)` | Change payment status |
| `admin_set_tracking(order_id, tracking_number)` | Add tracking number |
| `admin_cancel_order(order_id)` | Cancel + restore stock |
| `admin_resolve_return(return_id, status, notes)` | Approve/reject return |
| `admin_toggle_review(review_id)` | Toggle review visibility |
| `admin_delete_review(review_id)` | Delete a review |
| `admin_update_stock(variant_id, count)` | Set variant stock |
| `admin_toggle_product(product_id)` | Toggle product active |
| `admin_toggle_coupon(coupon_id)` | Toggle coupon active |
| `admin_set_user_role(user_id, role)` | Promote/demote user |
| `admin_dashboard_stats()` | Full dashboard JSON stats |

---

## RLS Summary

All tables have Row Level Security enabled:
- **Customers** can only read/write their own data (orders, addresses, cart, wishlist, reviews)
- **Public** can read active products, categories, offers, and approved reviews
- **Admins** (users with `role = 'admin'`) have full read/write access to everything
- **Database functions** use `SECURITY DEFINER` — they run with elevated privileges but check `is_admin()` internally

---

## Storage Setup

1. Go to **Storage** → Create bucket named `products` → Set as **Public**
2. Run `06_storage_policies.sql` to set up:
   - Public read for anyone (product images are public)
   - Only admins can upload/update/delete images
