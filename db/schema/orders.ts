import {
  pgTable,
  pgEnum,
  serial,
  integer,
  varchar,
  text,
  decimal,
  char,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { products } from "./products";
import { productVariants } from "./products";

// ─── Enums ─────────────────────────────────────────────────────
export const orderStatusEnum = pgEnum("order_status", [
  "Pending",
  "Processing",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Refunded",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "Pending",
  "Completed",
  "Failed",
  "Refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "razorpay",
  "cod",
  "stripe",
]);

export const returnStatusEnum = pgEnum("return_status", [
  "Pending",
  "Approved",
  "Rejected",
  "Refunded",
]);

// ─── Tables ────────────────────────────────────────────────────

/**
 * orders
 * Shipping address is SNAPSHOTTED here at checkout so that
 * historical orders remain correct even if the user changes their address.
 */
export const orders = pgTable("orders", {
  orderId: serial("order_id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  orderDate: timestamp("order_date", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // ── Financials ──
  subtotal: decimal("subtotal", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  deliveryCharge: decimal("delivery_charge", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  couponCode: varchar("coupon_code", { length: 100 }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  // ── Status ──
  status: orderStatusEnum("status").notNull().default("Pending"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("Pending"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("razorpay"),
  // ── Payment Gateway ──
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
  razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),
  // ── Shipping Address Snapshot ──
  shippingName: varchar("shipping_name", { length: 255 }).notNull(),
  shippingPhone: varchar("shipping_phone", { length: 20 }).notNull(),
  shippingAddressLine1: varchar("shipping_address_line1", { length: 255 }).notNull(),
  shippingAddressLine2: varchar("shipping_address_line2", { length: 255 }),
  shippingCity: varchar("shipping_city", { length: 100 }).notNull(),
  shippingState: varchar("shipping_state", { length: 100 }).notNull(),
  shippingPincode: varchar("shipping_pincode", { length: 15 }).notNull(),
  shippingCountryCode: char("shipping_country_code", { length: 2 })
    .notNull()
    .default("IN"),
  // ── Logistics ──
  trackingNumber: varchar("tracking_number", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * order_items
 * product_name, variant_color, variant_size are SNAPSHOTTED at order time
 * so the line item is always accurate even if the product is later renamed.
 */
export const orderItems = pgTable("order_items", {
  orderItemId: serial("order_item_id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.orderId, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.productId),
  variantId: integer("variant_id")
    .notNull()
    .references(() => productVariants.variantId),
  quantity: integer("quantity").notNull().default(1),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  // ── Snapshots ── (denormalised — do NOT change after insert)
  productName: varchar("product_name", { length: 255 }).notNull(),
  variantColor: varchar("variant_color", { length: 100 }).notNull(),
  variantSize: varchar("variant_size", { length: 20 }).notNull(),
});

/**
 * return_requests
 * Customer-initiated return / refund tracking.
 */
export const returnRequests = pgTable("return_requests", {
  returnId: serial("return_id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.orderId),
  orderItemId: integer("order_item_id")
    .notNull()
    .references(() => orderItems.orderItemId),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  reason: varchar("reason", { length: 255 }).notNull(),
  description: text("description"),
  status: returnStatusEnum("status").notNull().default("Pending"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  razorpayRefundId: varchar("razorpay_refund_id", { length: 255 }),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Relations ─────────────────────────────────────────────────

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  returns: many(returnRequests),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.orderId],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.productId],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.variantId],
  }),
}));

export const returnRequestsRelations = relations(returnRequests, ({ one }) => ({
  order: one(orders, {
    fields: [returnRequests.orderId],
    references: [orders.orderId],
  }),
  orderItem: one(orderItems, {
    fields: [returnRequests.orderItemId],
    references: [orderItems.orderItemId],
  }),
  user: one(users, {
    fields: [returnRequests.userId],
    references: [users.id],
  }),
}));
