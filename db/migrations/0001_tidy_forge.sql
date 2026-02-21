CREATE TYPE "public"."loyalty_transaction_type" AS ENUM('earned', 'redeemed', 'credit_added', 'credit_used', 'adjustment', 'expired');--> statement-breakpoint
CREATE TYPE "public"."purchase_order_status" AS ENUM('Draft', 'Ordered', 'Partial', 'Received', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."stock_adjustment_type" AS ENUM('purchase_in', 'sale_out', 'return_in', 'exchange_out', 'exchange_in', 'manual_add', 'manual_remove', 'damage', 'opening_stock');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'cashier';--> statement-breakpoint
CREATE TABLE "loyalty_transactions" (
	"transaction_id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "loyalty_transaction_type" NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"credit_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"description" varchar(255) NOT NULL,
	"reference_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_payments" (
	"payment_id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"payment_mode" varchar(30) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"reference" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_returns" (
	"bill_return_id" serial PRIMARY KEY NOT NULL,
	"original_bill_id" integer NOT NULL,
	"return_type" varchar(20) DEFAULT 'return' NOT NULL,
	"returned_items" text NOT NULL,
	"refund_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"exchange_bill_id" integer,
	"reason" text,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"processed_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"po_item_id" serial PRIMARY KEY NOT NULL,
	"purchase_order_id" integer NOT NULL,
	"variant_id" integer NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"variant_info" varchar(100) NOT NULL,
	"sku" varchar(100),
	"ordered_qty" integer DEFAULT 0 NOT NULL,
	"received_qty" integer DEFAULT 0 NOT NULL,
	"cost_price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"gst_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"amount" numeric(12, 2) DEFAULT '0.00' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"purchase_order_id" serial PRIMARY KEY NOT NULL,
	"po_number" varchar(50) NOT NULL,
	"supplier_id" integer NOT NULL,
	"status" "purchase_order_status" DEFAULT 'Draft' NOT NULL,
	"order_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_date" timestamp with time zone,
	"received_date" timestamp with time zone,
	"subtotal" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"gst_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"discount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"supplier_invoice_no" varchar(100),
	"notes" text,
	"created_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_orders_po_number_unique" UNIQUE("po_number")
);
--> statement-breakpoint
CREATE TABLE "stock_adjustments" (
	"adjustment_id" serial PRIMARY KEY NOT NULL,
	"variant_id" integer NOT NULL,
	"type" "stock_adjustment_type" NOT NULL,
	"quantity_change" integer NOT NULL,
	"stock_after" integer NOT NULL,
	"reference_type" varchar(50),
	"reference_id" integer,
	"reason" text,
	"created_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"supplier_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"phone" varchar(20),
	"email" varchar(150),
	"gstin" varchar(15),
	"pan" varchar(10),
	"address_line1" varchar(255),
	"address_line2" varchar(255),
	"city" varchar(100),
	"state" varchar(100),
	"pincode" varchar(10),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"total_purchases" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total_paid" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "loyalty_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "credit_balance" numeric(10, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "total_spent" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "productvariants" ADD COLUMN "barcode" varchar(100);--> statement-breakpoint
ALTER TABLE "productvariants" ADD COLUMN "cost_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "productvariants" ADD COLUMN "price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "productvariants" ADD COLUMN "mrp" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "seo_title" varchar(255);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "seo_keywords" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "og_image_url" varchar(500);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "social_instagram" varchar(255);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "social_facebook" varchar(255);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "social_twitter" varchar(255);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "social_youtube" varchar(255);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "hero_title" varchar(255);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "hero_subtitle" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "hero_badge_text" varchar(100);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "hero_cta_text" varchar(100);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "hero_cta_link" varchar(255);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "hero_secondary_cta_text" varchar(100);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "hero_secondary_cta_link" varchar(255);--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("purchase_order_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("supplier_id") ON DELETE no action ON UPDATE no action;