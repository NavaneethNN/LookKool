import {
  pgTable,
  pgEnum,
  serial,
  integer,
  varchar,
  text,
  boolean,
  decimal,
  json,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { products } from "./products";
import { coupons } from "./coupons";

// ─── Enums ─────────────────────────────────────────────────────
export const paymentIssueTypeEnum = pgEnum("payment_issue_type", [
  "STOCK_UNAVAILABLE",
  "ORDER_CREATION_FAILED",
  "COUPON_INVALID",
  "OTHER",
]);

export const paymentIssueStatusEnum = pgEnum("payment_issue_status", [
  "PENDING",
  "RESOLVED",
  "REFUNDED",
]);

// ─── Tables ────────────────────────────────────────────────────

/**
 * offers
 * Promotional badges shown on product cards (e.g. "40% OFF – Use NEWYEAR26").
 * Linked to a coupon so the code is always accurate.
 */
export const offers = pgTable("offers", {
  offerId: serial("offer_id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.productId, { onDelete: "cascade" }),
  offerText: varchar("offer_text", { length: 200 }).notNull(),
  couponId: integer("coupon_id").references(() => coupons.couponId, {
    onDelete: "set null",
  }),
  isActive: boolean("is_active").notNull().default(true),
  validFrom: timestamp("valid_from", { withTimezone: true }),
  validTill: timestamp("valid_till", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * payment_issues
 * Audit log for failed / problematic payments — admin resolves these manually.
 */
export const paymentIssues = pgTable("payment_issues", {
  issueId: serial("issue_id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.userId),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }).notNull(),
  razorpayOrderId: varchar("razorpay_order_id", { length: 255 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull(),
  issueType: paymentIssueTypeEnum("issue_type").notNull(),
  issueDescription: text("issue_description"),
  // Snapshot of cart at the time of the failed payment
  cartData: json("cart_data"),
  shippingData: json("shipping_data"),
  couponCode: varchar("coupon_code", { length: 100 }),
  status: paymentIssueStatusEnum("status").notNull().default("PENDING"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

// ─── Relations ─────────────────────────────────────────────────

export const offersRelations = relations(offers, ({ one }) => ({
  product: one(products, {
    fields: [offers.productId],
    references: [products.productId],
  }),
  coupon: one(coupons, {
    fields: [offers.couponId],
    references: [coupons.couponId],
  }),
}));
