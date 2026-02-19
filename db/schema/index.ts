/**
 * db/schema/index.ts
 * ─────────────────────────────────────────────────────────────
 * Single entry-point that re-exports every table and relation.
 * Both the Drizzle ORM instance (db/index.ts) and drizzle-kit
 * (drizzle.config.ts) point here.
 *
 * Table map:
 *  users.ts          → users, userAddresses
 *  categories.ts     → categories
 *  products.ts       → products, productVariants, productImages
 *  shopping.ts       → reviews, wishlist, cart
 *  coupons.ts        → coupons, couponCategories, couponProducts, couponCustomers, couponUsage
 *  offers.ts         → offers, paymentIssues
 *  orders.ts         → orders, orderItems, returnRequests
 *  notifications.ts  → notifications, notificationPreferences
 *  misc.ts           → newsletter, deliverySettings
 */

// Users & addresses
export * from "./users";

// Catalogue
export * from "./categories";
export * from "./products";

// Shopping activity
export * from "./shopping";

// Promotions
export * from "./coupons";
export * from "./offers";

// Transactions
export * from "./orders";

// Communication
export * from "./notifications";

// Configuration & misc
export * from "./misc";
