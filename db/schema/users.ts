import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  char,
  boolean,
  integer,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ─────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);

// ─── Tables ────────────────────────────────────────────────────

/**
 * users (profiles)
 * Primary key is a UUID that matches the id in Supabase Auth's auth.users table.
 * Row Level Security (RLS) should be enabled on this table in Supabase.
 */
export const users = pgTable("users", {
  userId: uuid("user_id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  // Mirror of auth.users.email — kept in sync via trigger
  email: varchar("email", { length: 150 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  role: userRoleEnum("role").notNull().default("customer"),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  profilePicture: varchar("profile_picture", { length: 512 }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * user_addresses
 * Separate table so each user can save multiple shipping addresses.
 * Shipping info is snapshotted on the orders table at checkout — address
 * changes here do NOT affect historical order data.
 */
export const userAddresses = pgTable("user_addresses", {
  addressId: serial("address_id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  label: varchar("label", { length: 50 }), // e.g. Home, Work
  fullName: varchar("full_name", { length: 150 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  addressLine1: varchar("address_line1", { length: 255 }).notNull(),
  addressLine2: varchar("address_line2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  pincode: varchar("pincode", { length: 15 }).notNull(),
  countryCode: char("country_code", { length: 2 }).notNull().default("IN"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Relations ─────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(userAddresses),
}));

export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
  user: one(users, {
    fields: [userAddresses.userId],
    references: [users.userId],
  }),
}));
