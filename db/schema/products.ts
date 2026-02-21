import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  decimal,
  char,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { categories } from "./categories";

// ─── Tables ────────────────────────────────────────────────────

/**
 * products
 * Master product record. Actual purchasable items are productvariants
 * (each variant = one color + one size combination).
 */
export const products = pgTable("products", {
  productId: serial("product_id").primaryKey(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  // URL-friendly unique identifier for SEO
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.categoryId),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  mrp: decimal("mrp", { precision: 10, scale: 2 }).notNull().default("0.00"),
  productCode: varchar("product_code", { length: 50 }).notNull(),
  material: varchar("material", { length: 255 }),
  fabricWeight: varchar("fabric_weight", { length: 100 }),
  careInstructions: text("care_instructions"),
  origin: varchar("origin", { length: 100 }),
  // Rich-text product details (replaces material/fabric/care individual fields)
  detailHtml: text("detail_html"),
  // Badge shown on product card: Sale, Trending, New, etc.
  label: varchar("label", { length: 50 }),
  isActive: boolean("is_active").notNull().default(true),
  // Lower value = shown first in listings
  priority: integer("priority").notNull().default(99),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * productvariants
 * Each row represents one (color + size) combination of a product.
 * price_modifier handles surcharges like +₹100 for 3XL.
 */
export const productVariants = pgTable("productvariants", {
  variantId: serial("variant_id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.productId, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 100 }),
  barcode: varchar("barcode", { length: 100 }),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  color: varchar("color", { length: 100 }).notNull(),
  // CSS hex color code, e.g. #FFFFFF
  hexcode: char("hexcode", { length: 7 }),
  size: varchar("size", { length: 20 }).notNull(),
  stockCount: integer("stock_count").notNull().default(0),
  // Variant-level price — overrides product.basePrice when set
  price: decimal("price", { precision: 10, scale: 2 }),
  // Variant-level MRP — overrides product.mrp when set
  mrp: decimal("mrp", { precision: 10, scale: 2 }),
  // Legacy: added to base_price (kept for backward compat, prefer price/mrp)
  priceModifier: decimal("price_modifier", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * productimages
 * Multiple images per variant, ordered by sort_order.
 */
export const productImages = pgTable("productimages", {
  imageId: serial("image_id").primaryKey(),
  variantId: integer("variant_id")
    .notNull()
    .references(() => productVariants.variantId, { onDelete: "cascade" }),
  // Supabase Storage path, e.g. products/variant_123/main.jpg
  imagePath: varchar("image_path", { length: 512 }).notNull(),
  altText: varchar("alt_text", { length: 255 }),
  // Lower = displayed first
  sortOrder: integer("sort_order").notNull().default(0),
  // True = this is the thumbnail/primary image for the variant
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Relations ─────────────────────────────────────────────────

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.categoryId],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.productId],
    }),
    images: many(productImages),
  })
);

export const productImagesRelations = relations(productImages, ({ one }) => ({
  variant: one(productVariants, {
    fields: [productImages.variantId],
    references: [productVariants.variantId],
  }),
}));
