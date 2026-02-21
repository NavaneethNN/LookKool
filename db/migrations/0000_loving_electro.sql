CREATE TYPE "public"."user_role" AS ENUM('customer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed_amount');--> statement-breakpoint
CREATE TYPE "public"."payment_issue_status" AS ENUM('PENDING', 'RESOLVED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."payment_issue_type" AS ENUM('STOCK_UNAVAILABLE', 'ORDER_CREATION_FAILED', 'COUPON_INVALID', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('Pending', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('razorpay', 'cod', 'stripe');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('Pending', 'Completed', 'Failed', 'Refunded');--> statement-breakpoint
CREATE TYPE "public"."return_status" AS ENUM('Pending', 'Approved', 'Rejected', 'Refunded');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('order', 'offer', 'system');--> statement-breakpoint
CREATE TYPE "public"."bill_type" AS ENUM('online', 'in_store');--> statement-breakpoint
CREATE TABLE "user_addresses" (
	"address_id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"label" varchar(50),
	"full_name" varchar(150) NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"pincode" varchar(15) NOT NULL,
	"country_code" char(2) DEFAULT 'IN' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(150) NOT NULL,
	"phone_number" varchar(20),
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"profile_picture" varchar(512),
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"category_id" serial PRIMARY KEY NOT NULL,
	"category_name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"image_url" varchar(512),
	"parent_category_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 99 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "productimages" (
	"image_id" serial PRIMARY KEY NOT NULL,
	"variant_id" integer NOT NULL,
	"image_path" varchar(512) NOT NULL,
	"alt_text" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productvariants" (
	"variant_id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"sku" varchar(100),
	"color" varchar(100) NOT NULL,
	"hexcode" char(7),
	"size" varchar(20) NOT NULL,
	"stock_count" integer DEFAULT 0 NOT NULL,
	"price_modifier" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"product_id" serial PRIMARY KEY NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"category_id" integer NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"mrp" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"product_code" varchar(50) NOT NULL,
	"material" varchar(255),
	"fabric_weight" varchar(100),
	"care_instructions" text,
	"origin" varchar(100),
	"detail_html" text,
	"label" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 99 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cart" (
	"cart_id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"variant_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"review_id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"user_id" uuid,
	"reviewer_name" text NOT NULL,
	"rating" smallint NOT NULL,
	"review_text" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_approved" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_reviews_rating" CHECK ("reviews"."rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "wishlist" (
	"wishlist_id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_categories" (
	"coupon_id" integer NOT NULL,
	"category_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_customers" (
	"coupon_id" integer NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_products" (
	"coupon_id" integer NOT NULL,
	"product_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_usage" (
	"usage_id" serial PRIMARY KEY NOT NULL,
	"coupon_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" integer NOT NULL,
	"discount_amount_applied" numeric(10, 2) NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"coupon_id" serial PRIMARY KEY NOT NULL,
	"code" varchar(100) NOT NULL,
	"description" text,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"min_purchase_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"max_discount_amount" numeric(10, 2),
	"valid_from" timestamp with time zone,
	"valid_till" timestamp with time zone,
	"usage_limit_total" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"usage_limit_per_customer" integer,
	"applies_to_all_products" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"offer_id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"offer_text" varchar(200) NOT NULL,
	"coupon_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_till" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_issues" (
	"issue_id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"razorpay_payment_id" varchar(255) NOT NULL,
	"razorpay_order_id" varchar(255) NOT NULL,
	"amount_paid" numeric(10, 2) NOT NULL,
	"issue_type" "payment_issue_type" NOT NULL,
	"issue_description" text,
	"cart_data" json,
	"shipping_data" json,
	"coupon_code" varchar(100),
	"status" "payment_issue_status" DEFAULT 'PENDING' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"order_item_id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"variant_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_per_unit" numeric(10, 2) NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"variant_color" varchar(100) NOT NULL,
	"variant_size" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"order_id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"order_date" timestamp with time zone DEFAULT now() NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"delivery_charge" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"platform_fee" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"coupon_code" varchar(100),
	"discount_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" "order_status" DEFAULT 'Pending' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'Pending' NOT NULL,
	"payment_method" "payment_method" DEFAULT 'razorpay' NOT NULL,
	"razorpay_payment_id" varchar(255),
	"razorpay_order_id" varchar(255),
	"shipping_name" varchar(255) NOT NULL,
	"shipping_phone" varchar(20) NOT NULL,
	"shipping_address_line1" varchar(255) NOT NULL,
	"shipping_address_line2" varchar(255),
	"shipping_city" varchar(100) NOT NULL,
	"shipping_state" varchar(100) NOT NULL,
	"shipping_pincode" varchar(15) NOT NULL,
	"shipping_country_code" char(2) DEFAULT 'IN' NOT NULL,
	"tracking_number" varchar(100),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "return_requests" (
	"return_id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"order_item_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"reason" varchar(255) NOT NULL,
	"description" text,
	"status" "return_status" DEFAULT 'Pending' NOT NULL,
	"refund_amount" numeric(10, 2),
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"pref_id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"order_notifications" boolean DEFAULT true NOT NULL,
	"offer_notifications" boolean DEFAULT true NOT NULL,
	"system_notifications" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"notification_id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"data" json,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_settings" (
	"setting_id" serial PRIMARY KEY NOT NULL,
	"label" varchar(100) NOT NULL,
	"min_order_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"delivery_charge" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"is_free_delivery" boolean DEFAULT false NOT NULL,
	"state_code" varchar(10),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "in_store_bills" (
	"bill_id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"customer_name" varchar(255),
	"customer_phone" varchar(20),
	"customer_gstin" varchar(15),
	"subtotal" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"taxable_amount" numeric(10, 2) NOT NULL,
	"cgst_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"cgst_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"sgst_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"sgst_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"igst_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"igst_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"round_off" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"payment_mode" varchar(30) DEFAULT 'cash' NOT NULL,
	"items" text NOT NULL,
	"created_by" varchar(255),
	"notes" text,
	"bill_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "in_store_bills_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "newsletter" (
	"newsletter_id" serial PRIMARY KEY NOT NULL,
	"email" varchar(150) NOT NULL,
	"is_subscribed" boolean DEFAULT true NOT NULL,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	CONSTRAINT "newsletter_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "store_settings" (
	"setting_id" serial PRIMARY KEY NOT NULL,
	"business_name" varchar(255) DEFAULT 'LookKool' NOT NULL,
	"business_tagline" varchar(255),
	"gstin" varchar(15),
	"pan" varchar(10),
	"address_line1" varchar(255),
	"address_line2" varchar(255),
	"city" varchar(100) DEFAULT '' NOT NULL,
	"state" varchar(100) DEFAULT 'Tamil Nadu' NOT NULL,
	"state_code" varchar(5) DEFAULT '33' NOT NULL,
	"pincode" varchar(10),
	"country" varchar(100) DEFAULT 'India' NOT NULL,
	"phone" varchar(20),
	"email" varchar(150),
	"website" varchar(255),
	"gst_rate" numeric(5, 2) DEFAULT '5.00' NOT NULL,
	"hsn_code" varchar(20) DEFAULT '6104' NOT NULL,
	"enable_gst" boolean DEFAULT true NOT NULL,
	"invoice_prefix" varchar(20) DEFAULT 'LK' NOT NULL,
	"next_invoice_number" integer DEFAULT 1 NOT NULL,
	"invoice_terms" text,
	"invoice_notes" text,
	"bank_name" varchar(255),
	"bank_account_number" varchar(50),
	"bank_ifsc" varchar(20),
	"bank_branch" varchar(255),
	"upi_id" varchar(100),
	"bill_paper_size" varchar(20) DEFAULT 'A4' NOT NULL,
	"bill_accent_color" varchar(10) DEFAULT '#470B49' NOT NULL,
	"bill_title" varchar(100) DEFAULT 'TAX INVOICE' NOT NULL,
	"bill_header_text" text,
	"bill_footer_text" text,
	"bill_greeting" text,
	"bill_logo_url" varchar(500),
	"bill_show_logo" boolean DEFAULT false NOT NULL,
	"bill_show_hsn" boolean DEFAULT true NOT NULL,
	"bill_show_sku" boolean DEFAULT true NOT NULL,
	"bill_show_gst_summary" boolean DEFAULT true NOT NULL,
	"bill_show_bank_details" boolean DEFAULT true NOT NULL,
	"bill_show_signatory" boolean DEFAULT true NOT NULL,
	"bill_show_amount_words" boolean DEFAULT true NOT NULL,
	"bill_show_customer_section" boolean DEFAULT true NOT NULL,
	"bill_font_scale" numeric(3, 2) DEFAULT '1.00' NOT NULL,
	"bill_extra_config" jsonb,
	"site_logo_url" varchar(500),
	"site_primary_color" varchar(20) DEFAULT '#470B49' NOT NULL,
	"site_description" text,
	"footer_tagline" text,
	"nav_links_config" jsonb,
	"footer_quick_links" jsonb,
	"footer_help_links" jsonb,
	"footer_legal_links" jsonb,
	"footer_contact_phone" varchar(30),
	"footer_contact_email" varchar(150),
	"footer_show_made_in_india" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productimages" ADD CONSTRAINT "productimages_variant_id_productvariants_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."productvariants"("variant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productvariants" ADD CONSTRAINT "productvariants_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_variant_id_productvariants_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."productvariants"("variant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_categories" ADD CONSTRAINT "coupon_categories_coupon_id_coupons_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("coupon_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_categories" ADD CONSTRAINT "coupon_categories_category_id_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_customers" ADD CONSTRAINT "coupon_customers_coupon_id_coupons_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("coupon_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_customers" ADD CONSTRAINT "coupon_customers_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_products" ADD CONSTRAINT "coupon_products_coupon_id_coupons_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("coupon_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_products" ADD CONSTRAINT "coupon_products_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_coupon_id_coupons_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("coupon_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_coupon_id_coupons_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("coupon_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_issues" ADD CONSTRAINT "payment_issues_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_productvariants_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."productvariants"("variant_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_orders_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_item_id_order_items_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("order_item_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;