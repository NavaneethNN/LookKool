import {
  pgTable,
  pgEnum,
  serial,
  integer,
  varchar,
  text,
  boolean,
  decimal,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { products } from "./products";
import { categories } from "./categories";

// ─── Enums ─────────────────────────────────────────────────────
export const discountTypeEnum = pgEnum("discount_type", [
  "percentage",
  "fixed_amount",
]);

// ─── Tables ────────────────────────────────────────────────────

/**
 * coupons
 * Discount codes with flexible scope: can target all products,
 * specific categories, specific products, or specific customers.
 */
export const coupons = pgTable("coupons", {
  couponId: serial("coupon_id").primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  description: text("description"),
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minPurchaseAmount: decimal("min_purchase_amount", {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default("0.00"),
  // Cap on maximum discount for percentage coupons
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),
  validFrom: timestamp("valid_from", { withTimezone: true }),
  validTill: timestamp("valid_till", { withTimezone: true }),
  // null = unlimited total uses
  usageLimitTotal: integer("usage_limit_total"),
  // Cached total usage count — increment in coupon_usage trigger
  usageCount: integer("usage_count").notNull().default(0),
  // null = unlimited per customer
  usageLimitPerCustomer: integer("usage_limit_per_customer"),
  // If true, applies to entire store; ignore coupon_products / coupon_categories
  appliesToAllProducts: boolean("applies_to_all_products")
    .notNull()
    .default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Coupon ↔ Category (many-to-many) */
export const couponCategories = pgTable("coupon_categories", {
  couponId: integer("coupon_id")
    .notNull()
    .references(() => coupons.couponId, { onDelete: "cascade" }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.categoryId, { onDelete: "cascade" }),
});

/** Coupon ↔ Product (many-to-many) */
export const couponProducts = pgTable("coupon_products", {
  couponId: integer("coupon_id")
    .notNull()
    .references(() => coupons.couponId, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.productId, { onDelete: "cascade" }),
});

/** Coupon ↔ Customer restriction — limit a coupon to specific users */
export const couponCustomers = pgTable("coupon_customers", {
  couponId: integer("coupon_id")
    .notNull()
    .references(() => coupons.couponId, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

/**
 * coupon_usage
 * Audit log — one row per redemption event.
 */
export const couponUsage = pgTable("coupon_usage", {
  usageId: serial("usage_id").primaryKey(),
  couponId: integer("coupon_id")
    .notNull()
    .references(() => coupons.couponId, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  // FK to orders.order_id added in orders.ts to avoid circular import
  orderId: integer("order_id").notNull(),
  discountAmountApplied: decimal("discount_amount_applied", {
    precision: 10,
    scale: 2,
  }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Relations ─────────────────────────────────────────────────

export const couponsRelations = relations(coupons, ({ many }) => ({
  categories: many(couponCategories),
  products: many(couponProducts),
  customers: many(couponCustomers),
  usages: many(couponUsage),
}));
