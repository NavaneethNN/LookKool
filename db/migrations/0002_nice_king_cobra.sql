ALTER TABLE "return_requests" ADD COLUMN "razorpay_refund_id" varchar(255);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "return_policy" varchar(30) DEFAULT 'accept' NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "return_window_days" integer DEFAULT 7 NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "cancellation_policy" varchar(30) DEFAULT 'before_shipment' NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "cod_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "auto_refund_enabled" boolean DEFAULT true NOT NULL;