import {
  pgTable,
  serial,
  integer,
  smallint,
  text,
  boolean,
  timestamp,
  uuid,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { users } from "./users";
import { products } from "./products";
import { productVariants } from "./products";

// ─── Tables ────────────────────────────────────────────────────

/**
 * reviews
 * Product reviews by customers. is_verified = customer actually purchased.
 */
export const reviews = pgTable(
  "reviews",
  {
    reviewId: serial("review_id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.productId, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.userId, {
      onDelete: "set null",
    }),
    reviewerName: text("reviewer_name").notNull(),
    // 1–5 star rating
    rating: smallint("rating").notNull(),
    reviewText: text("review_text").notNull(),
    // true if reviewer actually purchased the product
    isVerified: boolean("is_verified").notNull().default(false),
    // Admin can hide a review by setting false
    isApproved: boolean("is_approved").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [check("chk_reviews_rating", sql`${table.rating} BETWEEN 1 AND 5`)]
);

/**
 * wishlist
 * Products saved by a user. One entry per user per product.
 */
export const wishlist = pgTable("wishlist", {
  wishlistId: serial("wishlist_id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.productId, { onDelete: "cascade" }),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * cart
 * Active shopping cart. References variant_id directly — NOT freetext
 * color/size. One row per user per variant (unique constraint).
 */
export const cart = pgTable("cart", {
  cartId: serial("cart_id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  variantId: integer("variant_id")
    .notNull()
    .references(() => productVariants.variantId, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Relations ─────────────────────────────────────────────────

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.productId],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.userId],
  }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(users, {
    fields: [wishlist.userId],
    references: [users.userId],
  }),
  product: one(products, {
    fields: [wishlist.productId],
    references: [products.productId],
  }),
}));

export const cartRelations = relations(cart, ({ one }) => ({
  user: one(users, {
    fields: [cart.userId],
    references: [users.userId],
  }),
  variant: one(productVariants, {
    fields: [cart.variantId],
    references: [productVariants.variantId],
  }),
}));
