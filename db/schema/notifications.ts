import {
  pgTable,
  pgEnum,
  serial,
  integer,
  varchar,
  text,
  boolean,
  json,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

// ─── Enums ─────────────────────────────────────────────────────
export const notificationTypeEnum = pgEnum("notification_type", [
  "order",
  "offer",
  "system",
]);

// ─── Tables ────────────────────────────────────────────────────

/**
 * notifications
 * Per-user inbox. data column stores contextual JSON payload
 * (e.g. { order_id: 51, status: "Packed" }).
 */
export const notifications = pgTable("notifications", {
  notificationId: serial("notification_id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  data: json("data"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * notification_preferences
 * One row per user — created automatically on signup.
 */
export const notificationPreferences = pgTable("notification_preferences", {
  prefId: serial("pref_id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  orderNotifications: boolean("order_notifications").notNull().default(true),
  offerNotifications: boolean("offer_notifications").notNull().default(true),
  systemNotifications: boolean("system_notifications").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Relations ─────────────────────────────────────────────────

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(
  notificationPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationPreferences.userId],
      references: [users.id],
    }),
  })
);
