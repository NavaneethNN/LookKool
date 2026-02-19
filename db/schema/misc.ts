import {
  pgTable,
  serial,
  varchar,
  boolean,
  decimal,
  timestamp,
} from "drizzle-orm/pg-core";

// ─── Tables ────────────────────────────────────────────────────

/**
 * newsletter
 * Simple email subscription list with GDPR-friendly unsubscribe tracking.
 */
export const newsletter = pgTable("newsletter", {
  newsletterId: serial("newsletter_id").primaryKey(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  isSubscribed: boolean("is_subscribed").notNull().default(true),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
});

/**
 * delivery_settings
 * Admin-configurable delivery charge rules, replacing hardcoded logic.
 * Rules are evaluated in order: first matching rule wins.
 * - null state_code = applies globally
 * - is_free_delivery = override to ₹0 when order qualifies
 */
export const deliverySettings = pgTable("delivery_settings", {
  settingId: serial("setting_id").primaryKey(),
  label: varchar("label", { length: 100 }).notNull(),
  // Minimum order subtotal for this rule to apply
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  deliveryCharge: decimal("delivery_charge", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  isFreeDelivery: boolean("is_free_delivery").notNull().default(false),
  // null = applies to all states
  stateCode: varchar("state_code", { length: 10 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
