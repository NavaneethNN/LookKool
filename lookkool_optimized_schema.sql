-- ============================================================
-- LookKool E-Commerce - Optimized Database Schema v2.0
-- MariaDB / MySQL (InnoDB, utf8mb4_unicode_ci)
-- Generated: February 2026
-- Changes from v1:
--   * Wallet system fully removed (wallets, wallet_transactions,
--     user_transfers, gift_coupons)
--   * users table redesigned (snake_case, proper lengths, role,
--     timestamps, email verification)
--   * user_addresses table added (multiple addresses per user)
--   * cart fixed to reference variant_id (not freetext color/size)
--   * orders improved: ENUM statuses, wallet fields removed,
--     snapshot columns for order items, tracking_number added
--   * order_items improved with denormalised name/color/size snapshot
--   * return_requests table added
--   * productvariants: added sku, price_modifier
--   * productimages: added sort_order, is_primary, alt_text
--   * categories: added slug, description, parent, is_active, timestamps
--   * products: added slug, timestamps
--   * reviews: added is_approved, is_verified, updated_at
--   * coupons: fixed duplicate discount_amount column,
--     added usage_count cache
--   * offers: linked to coupons via FK, added validity dates
--   * notifications: removed 'wallet' type
--   * notification_preferences: removed wallet_notifications
--   * payment_issues: removed wallet-specific fields
--   * newsletter: added is_subscribed, unsubscribed_at
--   * delivery_settings table added (replaces hardcoded charges)
--   * Consistent snake_case naming throughout
--   * All foreign keys properly defined
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE `users` (
  `user_id`             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `name`                VARCHAR(150)    NOT NULL,
  `email`               VARCHAR(150)    NOT NULL,
  `password_hash`       VARCHAR(512)    NOT NULL,
  `phone_number`        VARCHAR(20)     DEFAULT NULL,
  `role`                ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  `is_email_verified`   TINYINT(1)      NOT NULL DEFAULT 0,
  `profile_picture`     VARCHAR(512)    DEFAULT NULL,
  `last_login_at`       TIMESTAMP       NULL DEFAULT NULL,
  `created_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Stores customers and admin accounts. Role field differentiates admin from customer.';

-- ============================================================
-- 2. USER ADDRESSES
--    Separate table so each user can save multiple addresses.
--    Shipping info in orders is snapshotted from this table
--    but stored independently (so address changes do not affect
--    historical order data).
-- ============================================================

CREATE TABLE `user_addresses` (
  `address_id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `user_id`             INT UNSIGNED    NOT NULL,
  `label`               VARCHAR(50)     DEFAULT NULL        COMMENT 'e.g. Home, Work, Mom',
  `full_name`           VARCHAR(150)    NOT NULL,
  `phone_number`        VARCHAR(20)     NOT NULL,
  `address_line1`       VARCHAR(255)    NOT NULL,
  `address_line2`       VARCHAR(255)    DEFAULT NULL,
  `city`                VARCHAR(100)    NOT NULL,
  `state`               VARCHAR(100)    NOT NULL,
  `pincode`             VARCHAR(15)     NOT NULL            COMMENT 'Stored as VARCHAR to support leading zeros',
  `country_code`        CHAR(2)         NOT NULL DEFAULT 'IN',
  `is_default`          TINYINT(1)      NOT NULL DEFAULT 0,
  `created_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  KEY `idx_ua_user_id` (`user_id`),
  CONSTRAINT `fk_ua_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. CATEGORIES
-- ============================================================

CREATE TABLE `categories` (
  `category_id`         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `category_name`       VARCHAR(255)    NOT NULL,
  `slug`                VARCHAR(255)    NOT NULL            COMMENT 'URL-friendly name, e.g. full-maxi',
  `description`         TEXT            DEFAULT NULL,
  `image_url`           VARCHAR(512)    DEFAULT NULL,
  `parent_category_id`  INT UNSIGNED    DEFAULT NULL        COMMENT 'NULL = top-level category',
  `is_active`           TINYINT(1)      NOT NULL DEFAULT 1,
  `sort_order`          INT             NOT NULL DEFAULT 99,
  `created_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uq_categories_slug` (`slug`),
  KEY `idx_categories_parent` (`parent_category_id`),
  KEY `idx_categories_active` (`is_active`, `sort_order`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. PRODUCTS
-- ============================================================

CREATE TABLE `products` (
  `product_id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `product_name`        VARCHAR(255)    NOT NULL,
  `slug`                VARCHAR(255)    NOT NULL            COMMENT 'URL-friendly unique name for SEO',
  `description`         TEXT            DEFAULT NULL,
  `category_id`         INT UNSIGNED    NOT NULL,
  `base_price`          DECIMAL(10,2)   NOT NULL,
  `mrp`                 DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `product_code`        VARCHAR(50)     NOT NULL,
  `material`            VARCHAR(255)    DEFAULT NULL,
  `fabric_weight`       VARCHAR(100)    DEFAULT NULL,
  `care_instructions`   TEXT            DEFAULT NULL,
  `origin`              VARCHAR(100)    DEFAULT NULL,
  `label`               VARCHAR(50)     DEFAULT NULL        COMMENT 'Badge shown on card: Sale, Trending, New, etc.',
  `is_active`           TINYINT(1)      NOT NULL DEFAULT 1,
  `priority`            INT             NOT NULL DEFAULT 99  COMMENT 'Lower = shown first',
  `created_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `uq_products_slug` (`slug`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_active_priority` (`is_active`, `priority`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. PRODUCT VARIANTS
--    Each variant = one color + one size combination.
--    price_modifier handles plus-size surcharges, etc.
-- ============================================================

CREATE TABLE `productvariants` (
  `variant_id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `product_id`          INT UNSIGNED    NOT NULL,
  `sku`                 VARCHAR(100)    DEFAULT NULL        COMMENT 'Stock Keeping Unit (optional but recommended)',
  `color`               VARCHAR(100)    NOT NULL,
  `hexcode`             CHAR(7)         DEFAULT NULL        COMMENT 'CSS hex color e.g. #FFFFFF',
  `size`                VARCHAR(20)     NOT NULL,
  `stock_count`         INT             NOT NULL DEFAULT 0,
  `price_modifier`      DECIMAL(10,2)   NOT NULL DEFAULT 0.00 COMMENT 'Added to base_price; use for 3XL surcharge etc.',
  `created_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`variant_id`),
  KEY `idx_pv_product_id` (`product_id`),
  KEY `idx_pv_stock` (`stock_count`),
  CONSTRAINT `fk_pv_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. PRODUCT IMAGES
-- ============================================================

CREATE TABLE `productimages` (
  `image_id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `variant_id`          INT UNSIGNED    NOT NULL,
  `image_path`          VARCHAR(512)    NOT NULL,
  `alt_text`            VARCHAR(255)    DEFAULT NULL,
  `sort_order`          INT             NOT NULL DEFAULT 0   COMMENT 'Lower = displayed first',
  `is_primary`          TINYINT(1)      NOT NULL DEFAULT 0   COMMENT 'Main thumbnail image',
  `created_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`image_id`),
  KEY `idx_pi_variant_id` (`variant_id`),
  CONSTRAINT `fk_pi_variant` FOREIGN KEY (`variant_id`) REFERENCES `productvariants` (`variant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. REVIEWS
-- ============================================================

CREATE TABLE `reviews` (
  `review_id`           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `product_id`          INT UNSIGNED    NOT NULL,
  `user_id`             INT UNSIGNED    DEFAULT NULL,
  `reviewer_name`       VARCHAR(255)    NOT NULL,
  `rating`              TINYINT         NOT NULL            COMMENT '1 to 5',
  `review_text`         TEXT            NOT NULL,
  `is_verified`         TINYINT(1)      NOT NULL DEFAULT 0   COMMENT 'TRUE if reviewer actually purchased the product',
  `is_approved`         TINYINT(1)      NOT NULL DEFAULT 1   COMMENT 'Admin can hide inappropriate reviews',
  `created_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  KEY `idx_reviews_product_id` (`product_id`),
  KEY `idx_reviews_user_id` (`user_id`),
  CONSTRAINT `chk_reviews_rating` CHECK (`rating` BETWEEN 1 AND 5),
  CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. WISHLIST
-- ============================================================

CREATE TABLE `wishlist` (
  `wishlist_id`         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `user_id`             INT UNSIGNED    NOT NULL,
  `product_id`          INT UNSIGNED    NOT NULL,
  `added_at`            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`wishlist_id`),
  UNIQUE KEY `uq_wishlist_user_product` (`user_id`, `product_id`),
  KEY `idx_wl_product_id` (`product_id`),
  CONSTRAINT `fk_wl_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wl_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. CART
--    References variant_id directly (not freetext color/size).
--    One row per user per variant enforced by unique key.
-- ============================================================

CREATE TABLE `cart` (
  `cart_id`             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `user_id`             INT UNSIGNED    NOT NULL,
  `variant_id`          INT UNSIGNED    NOT NULL,
  `quantity`            INT             NOT NULL DEFAULT 1,
  `created_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_id`),
  UNIQUE KEY `uq_cart_user_variant` (`user_id`, `variant_id`)   COMMENT 'Prevents duplicate rows for same user + variant',
  KEY `idx_cart_variant_id` (`variant_id`),
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_variant` FOREIGN KEY (`variant_id`) REFERENCES `productvariants` (`variant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. COUPONS
-- ============================================================

CREATE TABLE `coupons` (
  `coupon_id`                 INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `code`                      VARCHAR(100)    NOT NULL,
  `description`               TEXT            DEFAULT NULL,
  `discount_type`             ENUM('percentage','fixed_amount') NOT NULL,
  `discount_value`            DECIMAL(10,2)   NOT NULL,
  `min_purchase_amount`       DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `max_discount_amount`       DECIMAL(10,2)   DEFAULT NULL,
  `valid_from`                DATETIME        DEFAULT NULL,
  `valid_till`                DATETIME        DEFAULT NULL,
  `usage_limit_total`         INT             DEFAULT NULL    COMMENT 'NULL = unlimited',
  `usage_count`               INT             NOT NULL DEFAULT 0 COMMENT 'Cached total times used (increment on coupon_usage insert)',
  `usage_limit_per_customer`  INT             DEFAULT NULL    COMMENT 'NULL = unlimited per customer',
  `applies_to_all_products`   TINYINT(1)      NOT NULL DEFAULT 1,
  `is_active`                 TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`                TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`coupon_id`),
  UNIQUE KEY `uq_coupons_code` (`code`),
  KEY `idx_coupons_active_valid` (`is_active`, `valid_till`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Coupon <-> Category (many-to-many)
CREATE TABLE `coupon_categories` (
  `coupon_id`       INT UNSIGNED    NOT NULL,
  `category_id`     INT UNSIGNED    NOT NULL,
  PRIMARY KEY (`coupon_id`, `category_id`),
  CONSTRAINT `fk_ccat_coupon`    FOREIGN KEY (`coupon_id`)    REFERENCES `coupons` (`coupon_id`)       ON DELETE CASCADE,
  CONSTRAINT `fk_ccat_category`  FOREIGN KEY (`category_id`)  REFERENCES `categories` (`category_id`)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Coupon <-> Product (many-to-many)
CREATE TABLE `coupon_products` (
  `coupon_id`       INT UNSIGNED    NOT NULL,
  `product_id`      INT UNSIGNED    NOT NULL,
  PRIMARY KEY (`coupon_id`, `product_id`),
  CONSTRAINT `fk_cprod_coupon`   FOREIGN KEY (`coupon_id`)   REFERENCES `coupons` (`coupon_id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_cprod_product`  FOREIGN KEY (`product_id`)  REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Coupon <-> Customer restriction (optional: limit coupon to specific users)
CREATE TABLE `coupon_customers` (
  `coupon_id`       INT UNSIGNED    NOT NULL,
  `user_id`         INT UNSIGNED    NOT NULL,
  PRIMARY KEY (`coupon_id`, `user_id`),
  CONSTRAINT `fk_ccust_coupon`  FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`coupon_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ccust_user`    FOREIGN KEY (`user_id`)   REFERENCES `users` (`user_id`)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usage log (one row per coupon redemption)
CREATE TABLE `coupon_usage` (
  `usage_id`                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `coupon_id`               INT UNSIGNED    NOT NULL,
  `user_id`                 INT UNSIGNED    NOT NULL,
  `order_id`                INT UNSIGNED    NOT NULL,
  `discount_amount_applied` DECIMAL(10,2)   NOT NULL,
  `used_at`                 TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`usage_id`),
  KEY `idx_cu_coupon_id` (`coupon_id`),
  KEY `idx_cu_user_id` (`user_id`),
  CONSTRAINT `fk_cu_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`coupon_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cu_user`   FOREIGN KEY (`user_id`)   REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. OFFERS (banner/badge on product cards)
-- ============================================================

CREATE TABLE `offers` (
  `offer_id`        INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `product_id`      INT UNSIGNED    NOT NULL,
  `offer_text`      VARCHAR(200)    NOT NULL,
  `coupon_id`       INT UNSIGNED    DEFAULT NULL            COMMENT 'Link to the coupon this offer promotes',
  `is_active`       TINYINT(1)      NOT NULL DEFAULT 1,
  `valid_from`      DATETIME        DEFAULT NULL,
  `valid_till`      DATETIME        DEFAULT NULL,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`offer_id`),
  KEY `idx_offers_product_id` (`product_id`),
  KEY `idx_offers_coupon_id` (`coupon_id`),
  CONSTRAINT `fk_offers_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_offers_coupon`  FOREIGN KEY (`coupon_id`)  REFERENCES `coupons` (`coupon_id`)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. ORDERS
--    Shipping address is SNAPSHOTTED at order time — intentional
--    denormalisation so historical orders are unaffected by
--    later address changes.
-- ============================================================

CREATE TABLE `orders` (
  `order_id`                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `user_id`                 INT UNSIGNED    NOT NULL,
  `order_date`              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Financials
  `subtotal`                DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `delivery_charge`         DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `platform_fee`            DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `coupon_code`             VARCHAR(100)    DEFAULT NULL,
  `discount_amount`         DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `total_amount`            DECIMAL(10,2)   NOT NULL,
  -- Status (ENUM prevents invalid values)
  `status`                  ENUM('Pending','Processing','Packed','Shipped','Delivered','Cancelled','Refunded') NOT NULL DEFAULT 'Pending',
  `payment_status`          ENUM('Pending','Completed','Failed','Refunded') NOT NULL DEFAULT 'Pending',
  `payment_method`          ENUM('razorpay','cod','stripe') NOT NULL DEFAULT 'razorpay',
  -- Payment gateway references
  `razorpay_payment_id`     VARCHAR(255)    DEFAULT NULL,
  `razorpay_order_id`       VARCHAR(255)    DEFAULT NULL,
  -- Shipping address snapshot
  `shipping_name`           VARCHAR(255)    NOT NULL,
  `shipping_phone`          VARCHAR(20)     NOT NULL,
  `shipping_address_line1`  VARCHAR(255)    NOT NULL,
  `shipping_address_line2`  VARCHAR(255)    DEFAULT NULL,
  `shipping_city`           VARCHAR(100)    NOT NULL,
  `shipping_state`          VARCHAR(100)    NOT NULL,
  `shipping_pincode`        VARCHAR(15)     NOT NULL,
  `shipping_country_code`   CHAR(2)         NOT NULL DEFAULT 'IN',
  -- Logistics
  `tracking_number`         VARCHAR(100)    DEFAULT NULL,
  -- Misc
  `notes`                   TEXT            DEFAULT NULL    COMMENT 'Customer instructions or admin notes',
  `created_at`              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  KEY `idx_orders_user_id` (`user_id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_payment_status` (`payment_status`),
  KEY `idx_orders_order_date` (`order_date`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. ORDER ITEMS
--    product_name, variant_color, variant_size are SNAPSHOTTED
--    so the line item record is correct even if the product
--    or variant is later renamed/deleted.
-- ============================================================

CREATE TABLE `order_items` (
  `order_item_id`   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `order_id`        INT UNSIGNED    NOT NULL,
  `product_id`      INT UNSIGNED    NOT NULL,
  `variant_id`      INT UNSIGNED    NOT NULL,
  `quantity`        INT             NOT NULL DEFAULT 1,
  `price_per_unit`  DECIMAL(10,2)   NOT NULL            COMMENT 'Actual price charged (after any variant modifier)',
  -- Denormalised snapshots (never join back to products for display)
  `product_name`    VARCHAR(255)    NOT NULL            COMMENT 'Snapshot of product name at time of order',
  `variant_color`   VARCHAR(100)    NOT NULL            COMMENT 'Snapshot of variant color',
  `variant_size`    VARCHAR(20)     NOT NULL            COMMENT 'Snapshot of variant size',
  PRIMARY KEY (`order_item_id`),
  KEY `idx_oi_order_id` (`order_id`),
  KEY `idx_oi_variant_id` (`variant_id`),
  CONSTRAINT `fk_oi_order`   FOREIGN KEY (`order_id`)   REFERENCES `orders` (`order_id`)          ON DELETE CASCADE,
  CONSTRAINT `fk_oi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`),
  CONSTRAINT `fk_oi_variant` FOREIGN KEY (`variant_id`) REFERENCES `productvariants` (`variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. RETURN REQUESTS
--    Tracks customer-initiated returns and refund status.
-- ============================================================

CREATE TABLE `return_requests` (
  `return_id`       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `order_id`        INT UNSIGNED    NOT NULL,
  `order_item_id`   INT UNSIGNED    NOT NULL,
  `user_id`         INT UNSIGNED    NOT NULL,
  `reason`          VARCHAR(255)    NOT NULL,
  `description`     TEXT            DEFAULT NULL,
  `status`          ENUM('Pending','Approved','Rejected','Refunded') NOT NULL DEFAULT 'Pending',
  `refund_amount`   DECIMAL(10,2)   DEFAULT NULL,
  `admin_notes`     TEXT            DEFAULT NULL,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`return_id`),
  KEY `idx_rr_order_id` (`order_id`),
  KEY `idx_rr_user_id` (`user_id`),
  CONSTRAINT `fk_rr_order`      FOREIGN KEY (`order_id`)      REFERENCES `orders` (`order_id`),
  CONSTRAINT `fk_rr_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`order_item_id`),
  CONSTRAINT `fk_rr_user`       FOREIGN KEY (`user_id`)       REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. PAYMENT ISSUES LOG
--    Records failed/problematic payments for admin resolution.
-- ============================================================

CREATE TABLE `payment_issues` (
  `issue_id`                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `user_id`                 INT UNSIGNED    NOT NULL,
  `razorpay_payment_id`     VARCHAR(255)    NOT NULL,
  `razorpay_order_id`       VARCHAR(255)    NOT NULL,
  `amount_paid`             DECIMAL(10,2)   NOT NULL,
  `issue_type`              ENUM('STOCK_UNAVAILABLE','ORDER_CREATION_FAILED','COUPON_INVALID','OTHER') NOT NULL,
  `issue_description`       TEXT            DEFAULT NULL,
  `cart_data`               JSON            DEFAULT NULL,
  `shipping_data`           JSON            DEFAULT NULL,
  `coupon_code`             VARCHAR(100)    DEFAULT NULL,
  `status`                  ENUM('PENDING','RESOLVED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `admin_notes`             TEXT            DEFAULT NULL,
  `created_at`              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at`             TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`issue_id`),
  KEY `idx_pi_user_id` (`user_id`),
  KEY `idx_pi_payment_id` (`razorpay_payment_id`),
  KEY `idx_pi_status` (`status`),
  KEY `idx_pi_created_at` (`created_at`),
  CONSTRAINT `fk_pi_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. NOTIFICATIONS
-- ============================================================

CREATE TABLE `notifications` (
  `notification_id` INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `user_id`         INT UNSIGNED    NOT NULL,
  `type`            ENUM('order','offer','system') NOT NULL,
  `title`           VARCHAR(255)    NOT NULL,
  `message`         TEXT            NOT NULL,
  `data`            JSON            DEFAULT NULL,
  `is_read`         TINYINT(1)      NOT NULL DEFAULT 0,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_notif_user_id` (`user_id`),
  KEY `idx_notif_type` (`type`),
  KEY `idx_notif_is_read` (`is_read`),
  KEY `idx_notif_created_at` (`created_at`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notification_preferences` (
  `pref_id`                 INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `user_id`                 INT UNSIGNED    NOT NULL,
  `order_notifications`     TINYINT(1)      NOT NULL DEFAULT 1,
  `offer_notifications`     TINYINT(1)      NOT NULL DEFAULT 1,
  `system_notifications`    TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`pref_id`),
  UNIQUE KEY `uq_np_user_id` (`user_id`),
  CONSTRAINT `fk_np_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. NEWSLETTER
-- ============================================================

CREATE TABLE `newsletter` (
  `newsletter_id`   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `email`           VARCHAR(150)    NOT NULL,
  `is_subscribed`   TINYINT(1)      NOT NULL DEFAULT 1,
  `subscribed_at`   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `unsubscribed_at` TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`newsletter_id`),
  UNIQUE KEY `uq_newsletter_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. DELIVERY SETTINGS
--    Replaces hardcoded delivery charge logic in PHP.
--    Admin can configure thresholds per state or globally.
-- ============================================================

CREATE TABLE `delivery_settings` (
  `setting_id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `label`               VARCHAR(100)    NOT NULL            COMMENT 'e.g. Standard Delivery, Free Delivery',
  `min_order_amount`    DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `delivery_charge`     DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `is_free_delivery`    TINYINT(1)      NOT NULL DEFAULT 0,
  `state_code`          VARCHAR(10)     DEFAULT NULL        COMMENT 'NULL = applies to all states',
  `is_active`           TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;

-- ============================================================
-- SUMMARY OF ALL TABLES
-- ============================================================
-- Core
--   users                     Customers + admins (role field)
--   user_addresses            Multiple saved addresses per user
--
-- Catalogue
--   categories                Hierarchical (parent_category_id)
--   products                  Main product with SEO slug
--   productvariants           Color + size combinations + stock
--   productimages             Images per variant with sort_order
--
-- Shopping
--   cart                      Active cart (variant_id based)
--   wishlist                  Saved products per user
--   reviews                   Verified + moderated reviews
--
-- Promotions
--   coupons                   Discount coupons
--   coupon_categories         Coupon scope: category restriction
--   coupon_products           Coupon scope: product restriction
--   coupon_customers          Coupon scope: user restriction
--   coupon_usage              Usage audit log
--   offers                    Promotional badges on product cards
--
-- Orders
--   orders                    Order header with ENUM statuses
--   order_items               Line items with denormalised snapshots
--   return_requests           Customer return / refund tracking
--
-- Payments
--   payment_issues            Failed payment audit log
--
-- Notifications
--   notifications             Per-user notification inbox
--   notification_preferences  User notification settings
--
-- Config
--   newsletter                Email subscription list
--   delivery_settings         Delivery charge configuration
--
-- REMOVED (wallet system):
--   wallets
--   wallet_transactions
--   user_transfers
--   gift_coupons
-- ============================================================
