"use server";

import { db } from "@/db";
import {
  products,
  productVariants,
  productImages,
  orderItems,
  orders,
  reviews,
} from "@/db/schema";
import { eq, and, desc, asc, sql, ne, count, avg, gte, notInArray } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

// ─── Constants ─────────────────────────────────────────────────

const MAX_LIMIT = 50;

/** Clamp any user-supplied limit to safe range */
function clampLimit(limit: number, defaultVal: number = 8): number {
  if (!Number.isInteger(limit) || limit < 1) return defaultVal;
  return Math.min(limit, MAX_LIMIT);
}

// ─── Shared Helpers ────────────────────────────────────────────

/** Fetch primary image for a list of product IDs → Record<productId, imagePath> */
async function getPrimaryImages(
  productIds: number[]
): Promise<Record<number, string>> {
  if (productIds.length === 0) return {};

  const images = await db
    .select({
      productId: productVariants.productId,
      imagePath: productImages.imagePath,
    })
    .from(productImages)
    .innerJoin(
      productVariants,
      eq(productImages.variantId, productVariants.variantId)
    )
    .where(
      and(
        sql`${productVariants.productId} IN (${sql.join(
          productIds.map((id) => sql`${id}`),
          sql`, `
        )})`,
        eq(productImages.isPrimary, true)
      )
    );

  const map: Record<number, string> = {};
  images.forEach((img) => {
    if (!map[img.productId]) map[img.productId] = img.imagePath;
  });
  return map;
}

/** Fetch avg rating for a list of product IDs */
async function getRatings(
  productIds: number[]
): Promise<Record<number, { avg: number; count: number }>> {
  if (productIds.length === 0) return {};

  const rows = await db
    .select({
      productId: reviews.productId,
      avgRating: avg(reviews.rating),
      reviewCount: count(),
    })
    .from(reviews)
    .where(
      and(
        sql`${reviews.productId} IN (${sql.join(
          productIds.map((id) => sql`${id}`),
          sql`, `
        )})`,
        eq(reviews.isApproved, true)
      )
    )
    .groupBy(reviews.productId);

  const map: Record<number, { avg: number; count: number }> = {};
  rows.forEach((r) => {
    map[r.productId] = {
      avg: r.avgRating ? parseFloat(r.avgRating) : 0,
      count: r.reviewCount,
    };
  });
  return map;
}

export interface RecommendedProduct {
  productId: number;
  productName: string;
  slug: string;
  basePrice: number;
  mrp: number;
  label: string | null;
  image: string;
  rating?: number;
  reviewCount?: number;
}

/** Shape raw product rows + images + ratings into RecommendedProduct[] */
function shapeProducts(
  rows: {
    productId: number;
    productName: string;
    slug: string;
    basePrice: string;
    mrp: string;
    label: string | null;
  }[],
  images: Record<number, string>,
  ratings: Record<number, { avg: number; count: number }>
): RecommendedProduct[] {
  return rows.map((p) => ({
    productId: p.productId,
    productName: p.productName,
    slug: p.slug,
    basePrice: parseFloat(p.basePrice),
    mrp: parseFloat(p.mrp),
    label: p.label,
    image: images[p.productId] ?? "",
    rating: ratings[p.productId]?.avg,
    reviewCount: ratings[p.productId]?.count,
  }));
}

// ═══════════════════════════════════════════════════════════════
// 1. SIMILAR PRODUCTS (same category, different product)
// ═══════════════════════════════════════════════════════════════

export async function getSimilarProducts(
  productId: number,
  categoryId: number,
  limit: number = 8
): Promise<RecommendedProduct[]> {
  limit = clampLimit(limit);
  const rows = await db
    .select({
      productId: products.productId,
      productName: products.productName,
      slug: products.slug,
      basePrice: products.basePrice,
      mrp: products.mrp,
      label: products.label,
    })
    .from(products)
    .where(
      and(
        eq(products.categoryId, categoryId),
        eq(products.isActive, true),
        ne(products.productId, productId)
      )
    )
    .orderBy(asc(products.priority), desc(products.createdAt))
    .limit(limit);

  const ids = rows.map((r) => r.productId);
  const [images, ratings] = await Promise.all([
    getPrimaryImages(ids),
    getRatings(ids),
  ]);

  return shapeProducts(rows, images, ratings);
}

// ═══════════════════════════════════════════════════════════════
// 2. FREQUENTLY BOUGHT TOGETHER (co-occurrence in orders)
// ═══════════════════════════════════════════════════════════════

export async function getFrequentlyBoughtTogether(
  productIds: number[],
  limit: number = 6
): Promise<RecommendedProduct[]> {
  limit = clampLimit(limit, 6);
  if (productIds.length === 0) return [];
  // Sanitize input IDs
  productIds = productIds.filter(id => Number.isInteger(id) && id > 0).slice(0, 50);
  if (productIds.length === 0) return [];

  // Find orders containing any of the given products
  const ordersWithProduct = db
    .selectDistinct({ orderId: orderItems.orderId })
    .from(orderItems)
    .where(
      sql`${orderItems.productId} IN (${sql.join(
        productIds.map((id) => sql`${id}`),
        sql`, `
      )})`
    )
    .as("orders_with_product");

  // Find other products frequently ordered with them
  const frequencyExpr = sql<number>`count(*)`.as("frequency");
  const coProducts = await db
    .select({
      productId: orderItems.productId,
      frequency: frequencyExpr,
    })
    .from(orderItems)
    .innerJoin(
      ordersWithProduct,
      eq(orderItems.orderId, ordersWithProduct.orderId)
    )
    .where(
      sql`${orderItems.productId} NOT IN (${sql.join(
        productIds.map((id) => sql`${id}`),
        sql`, `
      )})`
    )
    .groupBy(orderItems.productId)
    .orderBy(desc(frequencyExpr))
    .limit(limit);

  if (coProducts.length === 0) return [];

  const coIds = coProducts.map((c) => c.productId);
  const rows = await db
    .select({
      productId: products.productId,
      productName: products.productName,
      slug: products.slug,
      basePrice: products.basePrice,
      mrp: products.mrp,
      label: products.label,
    })
    .from(products)
    .where(
      and(
        sql`${products.productId} IN (${sql.join(
          coIds.map((id) => sql`${id}`),
          sql`, `
        )})`,
        eq(products.isActive, true)
      )
    );

  const [images, ratings] = await Promise.all([
    getPrimaryImages(coIds),
    getRatings(coIds),
  ]);

  // Maintain frequency order
  const shaped = shapeProducts(rows, images, ratings);
  const orderMap = new Map(coProducts.map((c, i) => [c.productId, i]));
  shaped.sort(
    (a, b) =>
      (orderMap.get(a.productId) ?? 99) - (orderMap.get(b.productId) ?? 99)
  );

  return shaped;
}

// ═══════════════════════════════════════════════════════════════
// 3. TRENDING PRODUCTS (most ordered in last 30 days)
// ═══════════════════════════════════════════════════════════════

export async function getTrendingProducts(
  limit: number = 8
): Promise<RecommendedProduct[]> {
  limit = clampLimit(limit);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const orderCountExpr = sql<number>`count(*)`.as("order_count");
  const trending = await db
    .select({
      productId: orderItems.productId,
      orderCount: orderCountExpr,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.orderId))
    .where(
      and(
        gte(orders.orderDate, thirtyDaysAgo),
        notInArray(orders.status, ["Cancelled", "Refunded"])
      )
    )
    .groupBy(orderItems.productId)
    .orderBy(desc(orderCountExpr))
    .limit(limit);

  if (trending.length === 0) {
    // Fallback: highest priority active products
    return getPopularProducts(limit);
  }

  const ids = trending.map((t) => t.productId);
  const rows = await db
    .select({
      productId: products.productId,
      productName: products.productName,
      slug: products.slug,
      basePrice: products.basePrice,
      mrp: products.mrp,
      label: products.label,
    })
    .from(products)
    .where(
      and(
        sql`${products.productId} IN (${sql.join(
          ids.map((id) => sql`${id}`),
          sql`, `
        )})`,
        eq(products.isActive, true)
      )
    );

  const [images, ratings] = await Promise.all([
    getPrimaryImages(ids),
    getRatings(ids),
  ]);

  const shaped = shapeProducts(rows, images, ratings);
  const orderMap = new Map(trending.map((t, i) => [t.productId, i]));
  shaped.sort(
    (a, b) =>
      (orderMap.get(a.productId) ?? 99) - (orderMap.get(b.productId) ?? 99)
  );

  return shaped;
}

// ═══════════════════════════════════════════════════════════════
// 4. NEW ARRIVALS (most recently created active products)
// ═══════════════════════════════════════════════════════════════

export async function getNewArrivals(
  limit: number = 8
): Promise<RecommendedProduct[]> {
  limit = clampLimit(limit);
  const rows = await db
    .select({
      productId: products.productId,
      productName: products.productName,
      slug: products.slug,
      basePrice: products.basePrice,
      mrp: products.mrp,
      label: products.label,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt))
    .limit(limit);

  const ids = rows.map((r) => r.productId);
  const [images, ratings] = await Promise.all([
    getPrimaryImages(ids),
    getRatings(ids),
  ]);

  return shapeProducts(rows, images, ratings);
}

// ═══════════════════════════════════════════════════════════════
// 5. POPULAR PRODUCTS (priority + rating based)
// ═══════════════════════════════════════════════════════════════

export async function getPopularProducts(
  limit: number = 8
): Promise<RecommendedProduct[]> {
  limit = clampLimit(limit);
  const rows = await db
    .select({
      productId: products.productId,
      productName: products.productName,
      slug: products.slug,
      basePrice: products.basePrice,
      mrp: products.mrp,
      label: products.label,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(asc(products.priority), desc(products.createdAt))
    .limit(limit);

  const ids = rows.map((r) => r.productId);
  const [images, ratings] = await Promise.all([
    getPrimaryImages(ids),
    getRatings(ids),
  ]);

  return shapeProducts(rows, images, ratings);
}

// ═══════════════════════════════════════════════════════════════
// 6. TOP RATED PRODUCTS
// ═══════════════════════════════════════════════════════════════

export async function getTopRatedProducts(
  limit: number = 8
): Promise<RecommendedProduct[]> {
  limit = clampLimit(limit);
  const avgRatingExpr = avg(reviews.rating).as("avg_rating");
  const reviewCountExpr = count().as("review_count");
  const topRated = await db
    .select({
      productId: reviews.productId,
      avgRating: avgRatingExpr,
      reviewCount: reviewCountExpr,
    })
    .from(reviews)
    .where(eq(reviews.isApproved, true))
    .groupBy(reviews.productId)
    .having(sql`count(*) >= 1`)
    .orderBy(desc(avgRatingExpr), desc(reviewCountExpr))
    .limit(limit);

  if (topRated.length === 0) return getPopularProducts(limit);

  const ids = topRated.map((t) => t.productId);
  const rows = await db
    .select({
      productId: products.productId,
      productName: products.productName,
      slug: products.slug,
      basePrice: products.basePrice,
      mrp: products.mrp,
      label: products.label,
    })
    .from(products)
    .where(
      and(
        sql`${products.productId} IN (${sql.join(
          ids.map((id) => sql`${id}`),
          sql`, `
        )})`,
        eq(products.isActive, true)
      )
    );

  const images = await getPrimaryImages(ids);
  const ratingMap: Record<number, { avg: number; count: number }> = {};
  topRated.forEach((t) => {
    ratingMap[t.productId] = {
      avg: t.avgRating ? parseFloat(t.avgRating) : 0,
      count: t.reviewCount,
    };
  });

  return shapeProducts(rows, images, ratingMap);
}

// ═══════════════════════════════════════════════════════════════
// 7. DEALS / BIGGEST DISCOUNTS
// ═══════════════════════════════════════════════════════════════

export async function getBiggestDeals(
  limit: number = 8
): Promise<RecommendedProduct[]> {
  limit = clampLimit(limit);
  const rows = await db
    .select({
      productId: products.productId,
      productName: products.productName,
      slug: products.slug,
      basePrice: products.basePrice,
      mrp: products.mrp,
      label: products.label,
    })
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        sql`${products.mrp} > ${products.basePrice}`,
        sql`${products.mrp} > 0`
      )
    )
    .orderBy(
      desc(
        sql`(${products.mrp} - ${products.basePrice}) / ${products.mrp}`
      )
    )
    .limit(limit);

  const ids = rows.map((r) => r.productId);
  const [images, ratings] = await Promise.all([
    getPrimaryImages(ids),
    getRatings(ids),
  ]);

  return shapeProducts(rows, images, ratings);
}

// ═══════════════════════════════════════════════════════════════
// 8. PERSONALIZED — based on a user's past orders
// ═══════════════════════════════════════════════════════════════

export async function getPersonalizedPicks(
  userId: string,
  limit: number = 8
): Promise<RecommendedProduct[]> {
  limit = clampLimit(limit);

  // Use authenticated userId — ignore any client-supplied userId
  // If called from a server component, the passed userId is trusted.
  // But we verify auth if possible to prevent IDOR.
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id; // Always use the authenticated user's ID
    }
  } catch {
    // If auth fails, fall back to the provided userId (for SSR contexts)
  }

  // Get categories the user has purchased from
  const freqExpr = sql<number>`count(*)`.as("freq");
  const purchasedCategories = await db
    .select({
      categoryId: products.categoryId,
      freq: freqExpr,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.orderId))
    .innerJoin(products, eq(orderItems.productId, products.productId))
    .where(eq(orders.userId, userId))
    .groupBy(products.categoryId)
    .orderBy(desc(freqExpr))
    .limit(5);

  if (purchasedCategories.length === 0) {
    // No order history — fall back to trending
    return getTrendingProducts(limit);
  }

  // Get products the user has already bought
  const boughtProductIds = await db
    .selectDistinct({ productId: orderItems.productId })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.orderId))
    .where(eq(orders.userId, userId));

  const boughtIds = boughtProductIds.map((r) => r.productId);
  const catIds = purchasedCategories.map((c) => c.categoryId);

  // Recommend from the same categories, excluding already purchased
  const rows = await db
    .select({
      productId: products.productId,
      productName: products.productName,
      slug: products.slug,
      basePrice: products.basePrice,
      mrp: products.mrp,
      label: products.label,
    })
    .from(products)
    .where(
      and(
        sql`${products.categoryId} IN (${sql.join(
          catIds.map((id) => sql`${id}`),
          sql`, `
        )})`,
        eq(products.isActive, true),
        boughtIds.length > 0
          ? sql`${products.productId} NOT IN (${sql.join(
              boughtIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          : undefined
      )
    )
    .orderBy(asc(products.priority), desc(products.createdAt))
    .limit(limit);

  if (rows.length === 0) return getTrendingProducts(limit);

  const ids = rows.map((r) => r.productId);
  const [images, ratings] = await Promise.all([
    getPrimaryImages(ids),
    getRatings(ids),
  ]);

  return shapeProducts(rows, images, ratings);
}

// ═══════════════════════════════════════════════════════════════
// 9. PRODUCTS FROM SPECIFIC CATEGORY (for category page recs)
// ═══════════════════════════════════════════════════════════════

export async function getPopularInCategory(
  categoryId: number,
  excludeIds: number[] = [],
  limit: number = 8
): Promise<RecommendedProduct[]> {
  limit = clampLimit(limit);
  // Sanitize excludeIds
  excludeIds = excludeIds.filter(id => Number.isInteger(id) && id > 0).slice(0, 50);
  const rows = await db
    .select({
      productId: products.productId,
      productName: products.productName,
      slug: products.slug,
      basePrice: products.basePrice,
      mrp: products.mrp,
      label: products.label,
    })
    .from(products)
    .where(
      and(
        eq(products.categoryId, categoryId),
        eq(products.isActive, true),
        excludeIds.length > 0
          ? sql`${products.productId} NOT IN (${sql.join(
              excludeIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          : undefined
      )
    )
    .orderBy(asc(products.priority), desc(products.createdAt))
    .limit(limit);

  const ids = rows.map((r) => r.productId);
  const [images, ratings] = await Promise.all([
    getPrimaryImages(ids),
    getRatings(ids),
  ]);

  return shapeProducts(rows, images, ratings);
}

// ═══════════════════════════════════════════════════════════════
// 10. PRODUCTS BY IDS (for recently viewed — client sends IDs)
// ═══════════════════════════════════════════════════════════════

export async function getProductsByIds(
  productIds: number[]
): Promise<RecommendedProduct[]> {
  if (productIds.length === 0) return [];
  // Sanitize: only positive integers, cap at 50
  productIds = productIds.filter(id => Number.isInteger(id) && id > 0).slice(0, MAX_LIMIT);
  if (productIds.length === 0) return [];

  const rows = await db
    .select({
      productId: products.productId,
      productName: products.productName,
      slug: products.slug,
      basePrice: products.basePrice,
      mrp: products.mrp,
      label: products.label,
    })
    .from(products)
    .where(
      and(
        sql`${products.productId} IN (${sql.join(
          productIds.map((id) => sql`${id}`),
          sql`, `
        )})`,
        eq(products.isActive, true)
      )
    );

  const [images, ratings] = await Promise.all([
    getPrimaryImages(productIds),
    getRatings(productIds),
  ]);

  // Maintain the original order (most recently viewed first)
  const shaped = shapeProducts(rows, images, ratings);
  const orderMap = new Map(productIds.map((id, i) => [id, i]));
  shaped.sort(
    (a, b) =>
      (orderMap.get(a.productId) ?? 99) - (orderMap.get(b.productId) ?? 99)
  );

  return shaped;
}
