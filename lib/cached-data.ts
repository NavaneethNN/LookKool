/**
 * lib/cached-data.ts
 * Centralized cross-request cache layer using unstable_cache.
 * Import these in server components / pages for efficient data access.
 * Original server actions remain uncached for client-side mutations.
 */

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db } from "@/db";
import {
  products,
  categories,
  deliverySettings,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

// Import recommendation functions from actions — they are regular async
// functions on the server side even though they live in a "use server" file.
import {
  getTrendingProducts,
  getNewArrivals,
  getTopRatedProducts,
  getBiggestDeals,
  getPopularProducts,
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getPopularInCategory,
} from "@/lib/actions/recommendation-actions";

// ═══════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════

/** Active categories — cached 120s, invalidated via "categories" tag */
export const getCachedCategories = unstable_cache(
  async () => {
    return db.query.categories.findMany({
      where: eq(categories.isActive, true),
      orderBy: categories.sortOrder,
    });
  },
  ["active-categories"],
  { revalidate: 120, tags: ["categories"] }
);

/** Slim category list for filters (id + name + slug only) */
export const getCachedCategoryList = unstable_cache(
  async () => {
    return db
      .select({
        categoryId: categories.categoryId,
        categoryName: categories.categoryName,
        slug: categories.slug,
      })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.sortOrder);
  },
  ["category-list"],
  { revalidate: 120, tags: ["categories"] }
);

// ═══════════════════════════════════════════════════════════════
// PRODUCT BY SLUG — request-level dedup via React cache()
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch a single product by slug.
 * Uses React cache() so generateMetadata + page body share one query per request.
 */
export const getProductBySlug = cache(async (slug: string) => {
  return db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.isActive, true)),
  });
});

/** Lightweight product lookup for metadata (any status) */
export const getProductMetaBySlug = cache(async (slug: string) => {
  return db.query.products.findFirst({
    where: eq(products.slug, slug),
  });
});

// ═══════════════════════════════════════════════════════════════
// DELIVERY CONFIG
// ═══════════════════════════════════════════════════════════════

/** Public delivery config — cached 300s */
export const getCachedDeliveryConfig = unstable_cache(
  async (): Promise<{ freeAbove: number | null; standardCharge: number }> => {
    const rules = await db
      .select()
      .from(deliverySettings)
      .where(eq(deliverySettings.isActive, true))
      .orderBy(asc(deliverySettings.settingId));

    const freeRule = rules.find((r) => r.isFreeDelivery);
    const paidRule = rules.find((r) => !r.isFreeDelivery);

    return {
      freeAbove: freeRule ? parseFloat(freeRule.minOrderAmount) : null,
      standardCharge: paidRule ? parseFloat(paidRule.deliveryCharge) : 79,
    };
  },
  ["delivery-config"],
  { revalidate: 300, tags: ["delivery-config"] }
);

// ═══════════════════════════════════════════════════════════════
// RECOMMENDATIONS — cross-request cache (120s)
// ═══════════════════════════════════════════════════════════════

export const getCachedTrending = unstable_cache(
  getTrendingProducts,
  ["rec-trending"],
  { revalidate: 120, tags: ["products"] }
);

export const getCachedNewArrivals = unstable_cache(
  getNewArrivals,
  ["rec-new-arrivals"],
  { revalidate: 120, tags: ["products"] }
);

export const getCachedTopRated = unstable_cache(
  getTopRatedProducts,
  ["rec-top-rated"],
  { revalidate: 300, tags: ["products"] }
);

export const getCachedBiggestDeals = unstable_cache(
  getBiggestDeals,
  ["rec-biggest-deals"],
  { revalidate: 120, tags: ["products"] }
);

export const getCachedPopular = unstable_cache(
  getPopularProducts,
  ["rec-popular"],
  { revalidate: 120, tags: ["products"] }
);

export const getCachedSimilar = unstable_cache(
  getSimilarProducts,
  ["rec-similar"],
  { revalidate: 120, tags: ["products"] }
);

export const getCachedFrequentlyBought = unstable_cache(
  getFrequentlyBoughtTogether,
  ["rec-frequently-bought"],
  { revalidate: 300, tags: ["products"] }
);

export const getCachedPopularInCategory = unstable_cache(
  getPopularInCategory,
  ["rec-popular-in-cat"],
  { revalidate: 120, tags: ["products"] }
);

// ═══════════════════════════════════════════════════════════════
// SITEMAP DATA
// ═══════════════════════════════════════════════════════════════

/** All product slugs — for generateStaticParams + sitemap */
export const getCachedProductSlugs = unstable_cache(
  async () => {
    return db
      .select({ slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.isActive, true));
  },
  ["product-slugs"],
  { revalidate: 120, tags: ["products"] }
);

/** All category slugs — for generateStaticParams + sitemap */
export const getCachedCategorySlugs = unstable_cache(
  async () => {
    return db
      .select({ slug: categories.slug, updatedAt: categories.updatedAt })
      .from(categories)
      .where(eq(categories.isActive, true));
  },
  ["category-slugs"],
  { revalidate: 120, tags: ["categories"] }
);
