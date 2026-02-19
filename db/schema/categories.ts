import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Tables ────────────────────────────────────────────────────

/**
 * categories
 * Supports hierarchical nesting via parent_category_id self-reference.
 */
export const categories = pgTable("categories", {
  categoryId: serial("category_id").primaryKey(),
  categoryName: varchar("category_name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 512 }),
  parentCategoryId: integer("parent_category_id"), // FK added below via relations
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(99),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Relations ─────────────────────────────────────────────────

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentCategoryId],
    references: [categories.categoryId],
    relationName: "subcategories",
  }),
  subcategories: many(categories, { relationName: "subcategories" }),
}));
