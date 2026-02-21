"use server";

import { db } from "@/db";
import {
  users,
  userAddresses,
  categories,
  products,
  productVariants,
  productImages,
  orders,
  orderItems,
  returnRequests,
  reviews,
  coupons,
  newsletter,
  deliverySettings,
  storeSettings,
  inStoreBills,
} from "@/db/schema";
import { eq, desc, asc, sql, count, sum, and, gte, ilike, or, inArray, max, type AnyColumn } from "drizzle-orm";

// ── Valid enum values (runtime validation whitelists) ────────
const VALID_ORDER_STATUSES = ["Pending", "Processing", "Packed", "Shipped", "Delivered", "Cancelled", "Refunded"] as const;
const VALID_PAYMENT_STATUSES = ["Pending", "Completed", "Failed", "Refunded"] as const;
const VALID_RETURN_STATUSES = ["Pending", "Approved", "Rejected", "Refunded"] as const;

/** Escape ILIKE special characters */
function escapeIlike(str: string): string {
  return str.replace(/[%_\\]/g, (ch) => "\\" + ch);
}
import { revalidatePath } from "next/cache";
import { requireAdmin, requireAdminOrCashier } from "@/lib/admin/require-admin";
import { sendShippingUpdate, sendReturnStatusEmail } from "@/lib/email/brevo";
import { createNotification } from "@/lib/actions/notification-actions";

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

export async function getDashboardStats() {
  await requireAdmin();

  const [
    totalOrdersResult,
    totalRevenueResult,
    totalCustomersResult,
    totalProductsResult,
    pendingOrdersResult,
    pendingReturnsResult,
    pendingReviewsResult,
    todayOrdersResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(orders),
    db.select({ total: sum(orders.totalAmount) }).from(orders).where(eq(orders.paymentStatus, "Completed")),
    db.select({ count: count() }).from(users).where(eq(users.role, "customer")),
    db.select({ count: count() }).from(products),
    db.select({ count: count() }).from(orders).where(eq(orders.status, "Pending")),
    db.select({ count: count() }).from(returnRequests).where(eq(returnRequests.status, "Pending")),
    db.select({ count: count() }).from(reviews),
    db.select({ count: count() }).from(orders).where(
      gte(orders.orderDate, sql`NOW() - INTERVAL '24 hours'`)
    ),
  ]);

  return {
    totalOrders: totalOrdersResult[0]?.count ?? 0,
    totalRevenue: Number(totalRevenueResult[0]?.total ?? 0),
    totalCustomers: totalCustomersResult[0]?.count ?? 0,
    totalProducts: totalProductsResult[0]?.count ?? 0,
    pendingOrders: pendingOrdersResult[0]?.count ?? 0,
    pendingReturns: pendingReturnsResult[0]?.count ?? 0,
    totalReviews: pendingReviewsResult[0]?.count ?? 0,
    todayOrders: todayOrdersResult[0]?.count ?? 0,
  };
}

export async function getRecentOrders(limit = 10) {
  await requireAdmin();

  const safeLimit = Math.min(Math.max(1, limit), 100);

  return db.query.orders.findMany({
    orderBy: [desc(orders.orderDate)],
    limit: safeLimit,
    with: {
      user: { columns: { name: true, email: true } },
      items: { columns: { orderItemId: true } },
    },
  });
}

export async function getRevenueChart() {
  await requireAdmin();

  const result = await db
    .select({
      date: sql<string>`TO_CHAR(${orders.orderDate}, 'YYYY-MM-DD')`,
      revenue: sum(orders.totalAmount),
      count: count(),
    })
    .from(orders)
    .where(
      and(
        eq(orders.paymentStatus, "Completed"),
        gte(orders.orderDate, sql`NOW() - INTERVAL '30 days'`)
      )
    )
    .groupBy(sql`TO_CHAR(${orders.orderDate}, 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${orders.orderDate}, 'YYYY-MM-DD')`);

  return result.map((r) => ({
    date: r.date,
    revenue: Number(r.revenue ?? 0),
    orders: r.count,
  }));
}

// ═══════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════

export async function getAdminOrders(params?: {
  status?: string;
  page?: number;
  search?: string;
}) {
  await requireAdmin();

  const page = params?.page ?? 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params?.status && params.status !== "all") {
    if (!VALID_ORDER_STATUSES.includes(params.status as typeof VALID_ORDER_STATUSES[number])) {
      throw new Error("Invalid order status filter");
    }
    conditions.push(eq(orders.status, params.status as typeof orders.status.enumValues[number]));
  }
  if (params?.search) {
    const escaped = escapeIlike(params.search);
    conditions.push(
      or(
        ilike(orders.shippingName, `%${escaped}%`),
        sql`CAST(${orders.orderId} AS TEXT) ILIKE ${`%${escaped}%`}`
      )
    );
  }

  const allOrders = await db.query.orders.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(orders.orderDate)],
    limit,
    offset,
    with: {
      user: { columns: { name: true, email: true } },
      items: { columns: { orderItemId: true } },
    },
  });

  const [totalResult] = await db
    .select({ count: count() })
    .from(orders)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    orders: allOrders,
    total: totalResult?.count ?? 0,
    page,
    totalPages: Math.ceil((totalResult?.count ?? 0) / limit),
  };
}

export async function getAdminOrderDetail(orderId: number) {
  await requireAdmin();

  const order = await db.query.orders.findFirst({
    where: eq(orders.orderId, orderId),
    with: {
      user: {
        columns: { userId: true, name: true, email: true, phoneNumber: true },
      },
      items: {
        with: {
          product: { columns: { productId: true, slug: true } },
          variant: {
            columns: { variantId: true, sku: true },
            with: { images: { where: eq(productImages.isPrimary, true), limit: 1 } },
          },
        },
      },
      returns: true,
    },
  });

  return order;
}

export async function updateOrderStatus(orderId: number, status: string) {
  await requireAdmin();

  if (!VALID_ORDER_STATUSES.includes(status as typeof VALID_ORDER_STATUSES[number])) {
    throw new Error("Invalid order status");
  }

  await db
    .update(orders)
    .set({
      status: status as typeof orders.status.enumValues[number],
      updatedAt: new Date(),
    })
    .where(eq(orders.orderId, orderId));

  // Send shipping/status email for relevant statuses
  const emailStatuses = ["Shipped", "Out for Delivery", "Delivered", "Cancelled"];
  if (emailStatuses.includes(status)) {
    try {
      const [order] = await db
        .select({
          userId: orders.userId,
          trackingNumber: orders.trackingNumber,
        })
        .from(orders)
        .where(eq(orders.orderId, orderId))
        .limit(1);

      if (order) {
        const [dbUser] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.userId, order.userId))
          .limit(1);

        if (dbUser?.email) {
          sendShippingUpdate({
            customerName: dbUser.name,
            customerEmail: dbUser.email,
            orderId,
            status,
            trackingNumber: order.trackingNumber,
          }).catch((err) => console.error("Shipping email failed:", err));
        }

        // Create in-app notification for the customer
        const statusMessages: Record<string, string> = {
          Shipped: "Your order has been shipped!",
          "Out for Delivery": "Your order is out for delivery today!",
          Delivered: "Your order has been delivered. Enjoy!",
          Cancelled: "Your order has been cancelled.",
        };
        createNotification({
          userId: order.userId,
          type: "order",
          title: `Order #${orderId} ${status}`,
          message: statusMessages[status] || `Order status updated to ${status}`,
          data: { orderId, status },
        }).catch((err) => console.error("Notification creation failed:", err));
      }
    } catch (err) {
      console.error("Failed to send status email:", err);
    }
  }

  revalidatePath("/studio/orders");
  revalidatePath(`/studio/orders/${orderId}`);
  return { success: true };
}

export async function updatePaymentStatus(orderId: number, status: string) {
  await requireAdmin();

  if (!VALID_PAYMENT_STATUSES.includes(status as typeof VALID_PAYMENT_STATUSES[number])) {
    throw new Error("Invalid payment status");
  }

  await db
    .update(orders)
    .set({
      paymentStatus: status as typeof orders.paymentStatus.enumValues[number],
      updatedAt: new Date(),
    })
    .where(eq(orders.orderId, orderId));

  revalidatePath("/studio/orders");
  revalidatePath(`/studio/orders/${orderId}`);
  return { success: true };
}

export async function updateTrackingNumber(orderId: number, trackingNumber: string) {
  await requireAdmin();

  await db
    .update(orders)
    .set({
      trackingNumber,
      updatedAt: new Date(),
    })
    .where(eq(orders.orderId, orderId));

  revalidatePath(`/studio/orders/${orderId}`);
  return { success: true };
}

export async function updateOrderNotes(orderId: number, notes: string) {
  await requireAdmin();

  await db
    .update(orders)
    .set({
      notes,
      updatedAt: new Date(),
    })
    .where(eq(orders.orderId, orderId));

  revalidatePath(`/studio/orders/${orderId}`);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════

export async function getAdminProducts(params?: {
  page?: number;
  search?: string;
  categoryId?: number;
  active?: boolean;
  sort?: string;
  order?: "asc" | "desc";
}) {
  await requireAdmin();

  const page = params?.page ?? 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params?.search) {
    const escaped = escapeIlike(params.search);
    conditions.push(
      or(
        ilike(products.productName, `%${escaped}%`),
        ilike(products.productCode, `%${escaped}%`)
      )
    );
  }
  if (params?.categoryId) {
    conditions.push(eq(products.categoryId, params.categoryId));
  }
  if (params?.active !== undefined) {
    conditions.push(eq(products.isActive, params.active));
  }

  // Determine sort order
  const sortField = params?.sort ?? "priority";
  const sortDir = params?.order ?? "asc";
  const orderClauses = [];
  const sortMap: Record<string, AnyColumn> = {
    name: products.productName,
    price: products.basePrice,
    date: products.createdAt,
    priority: products.priority,
    code: products.productCode,
  };
  const col = sortMap[sortField] ?? products.priority;
  orderClauses.push(sortDir === "desc" ? desc(col) : asc(col));
  if (sortField !== "date") orderClauses.push(desc(products.createdAt));

  const allProducts = await db.query.products.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: orderClauses,
    limit,
    offset,
    with: {
      category: { columns: { categoryName: true } },
      variants: {
        columns: { variantId: true, color: true, size: true, stockCount: true },
        with: {
          images: {
            where: eq(productImages.isPrimary, true),
            limit: 1,
            columns: { imagePath: true },
          },
        },
      },
    },
  });

  const [totalResult] = await db
    .select({ count: count() })
    .from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    products: allProducts,
    total: totalResult?.count ?? 0,
    page,
    totalPages: Math.ceil((totalResult?.count ?? 0) / limit),
  };
}

export async function getAdminProduct(productId: number) {
  await requireAdmin();

  return db.query.products.findFirst({
    where: eq(products.productId, productId),
    with: {
      category: true,
      variants: {
        with: {
          images: { orderBy: [asc(productImages.sortOrder)] },
        },
      },
    },
  });
}

export async function createProduct(data: {
  productName: string;
  slug: string;
  description?: string;
  categoryId: number;
  basePrice: string;
  mrp: string;
  productCode: string;
  material?: string;
  fabricWeight?: string;
  careInstructions?: string;
  origin?: string;
  detailHtml?: string;
  label?: string;
  isActive?: boolean;
  priority?: number;
}) {
  await requireAdmin();

  const [newProduct] = await db
    .insert(products)
    .values({
      productName: data.productName,
      slug: data.slug,
      description: data.description || null,
      categoryId: data.categoryId,
      basePrice: data.basePrice,
      mrp: data.mrp,
      productCode: data.productCode,
      material: data.material || null,
      fabricWeight: data.fabricWeight || null,
      careInstructions: data.careInstructions || null,
      origin: data.origin || null,
      detailHtml: data.detailHtml || null,
      label: data.label || null,
      isActive: data.isActive ?? true,
      priority: data.priority ?? 99,
    })
    .returning();

  revalidatePath("/studio/products");
  return newProduct;
}

export async function updateProduct(
  productId: number,
  data: {
    productName?: string;
    slug?: string;
    description?: string;
    categoryId?: number;
    basePrice?: string;
    mrp?: string;
    productCode?: string;
    material?: string;
    fabricWeight?: string;
    careInstructions?: string;
    origin?: string;
    detailHtml?: string;
    label?: string;
    isActive?: boolean;
    priority?: number;
  }
) {
  await requireAdmin();

  await db
    .update(products)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(products.productId, productId));

  revalidatePath("/studio/products");
  revalidatePath(`/studio/products/${productId}`);
  return { success: true };
}

export async function deleteProduct(productId: number) {
  await requireAdmin();

  // Safety check: ensure no order items reference this product
  const [orderItemRef] = await db
    .select({ count: count() })
    .from(orderItems)
    .where(eq(orderItems.productId, productId));
  if (orderItemRef && orderItemRef.count > 0) {
    throw new Error("Cannot delete product with existing order items. Deactivate it instead.");
  }

  await db.delete(products).where(eq(products.productId, productId));

  revalidatePath("/studio/products");
  return { success: true };
}

export async function toggleProductActive(productId: number, isActive: boolean) {
  await requireAdmin();

  await db
    .update(products)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(products.productId, productId));

  revalidatePath("/studio/products");
  return { success: true };
}

// ─── Bulk Variant Operations ───────────────────────────────────

export async function bulkCreateVariants(
  productId: number,
  variants: {
    sku?: string;
    color: string;
    hexcode?: string;
    sizes: string[];
    stockCount: number;
    priceModifier?: string;
    price?: string;
    mrp?: string;
  }[]
) {
  await requireAdmin();

  const created: { variantId: number; color: string; size: string }[] = [];
  for (const v of variants) {
    for (const size of v.sizes) {
      const [row] = await db
        .insert(productVariants)
        .values({
          productId,
          sku: v.sku ? `${v.sku}-${size}` : null,
          color: v.color,
          hexcode: v.hexcode || null,
          size,
          stockCount: v.stockCount,
          priceModifier: v.priceModifier || "0.00",
          price: v.price || null,
          mrp: v.mrp || null,
        })
        .returning({ variantId: productVariants.variantId, color: productVariants.color, size: productVariants.size });
      created.push(row);
    }
  }

  revalidatePath(`/studio/products/${productId}`);
  return { created: created.length, variants: created };
}

export async function bulkUpdateStock(
  updates: { variantId: number; stockCount: number }[]
) {
  await requireAdmin();

  for (const u of updates) {
    await db
      .update(productVariants)
      .set({ stockCount: u.stockCount, updatedAt: new Date() })
      .where(eq(productVariants.variantId, u.variantId));
  }

  revalidatePath("/studio/products");
  return { success: true, updated: updates.length };
}

// ─── Variants ──────────────────────────────────────────────────

export async function createVariant(data: {
  productId: number;
  sku?: string;
  color: string;
  hexcode?: string;
  size: string;
  stockCount: number;
  priceModifier?: string;
  price?: string;
  mrp?: string;
}) {
  await requireAdmin();

  const [variant] = await db
    .insert(productVariants)
    .values({
      productId: data.productId,
      sku: data.sku || null,
      color: data.color,
      hexcode: data.hexcode || null,
      size: data.size,
      stockCount: data.stockCount,
      priceModifier: data.priceModifier || "0.00",
      price: data.price || null,
      mrp: data.mrp || null,
    })
    .returning();

  revalidatePath(`/studio/products/${data.productId}`);
  return variant;
}

export async function updateVariant(
  variantId: number,
  data: {
    sku?: string;
    color?: string;
    hexcode?: string;
    size?: string;
    stockCount?: number;
    priceModifier?: string;
    price?: string | null;
    mrp?: string | null;
  }
) {
  await requireAdmin();

  await db
    .update(productVariants)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(productVariants.variantId, variantId));

  revalidatePath("/studio/products");
  return { success: true };
}

export async function deleteVariant(variantId: number) {
  await requireAdmin();

  // Safety check: ensure no order items reference this variant
  const [orderItemRef] = await db
    .select({ count: count() })
    .from(orderItems)
    .where(eq(orderItems.variantId, variantId));
  if (orderItemRef && orderItemRef.count > 0) {
    throw new Error("Cannot delete variant with existing order items.");
  }

  await db.delete(productVariants).where(eq(productVariants.variantId, variantId));

  revalidatePath("/studio/products");
  return { success: true };
}

export async function updateStock(variantId: number, stockCount: number) {
  await requireAdmin();

  await db
    .update(productVariants)
    .set({ stockCount, updatedAt: new Date() })
    .where(eq(productVariants.variantId, variantId));

  revalidatePath("/studio/products");
  return { success: true };
}

// ── Variant Images ──────────────────────────────────────────

export async function addVariantImage(
  variantId: number,
  imagePath: string,
  isPrimary: boolean = false,
  altText?: string
) {
  await requireAdmin();

  // If setting as primary, unset existing primary
  if (isPrimary) {
    await db
      .update(productImages)
      .set({ isPrimary: false })
      .where(eq(productImages.variantId, variantId));
  }

  // Get next sortOrder
  const [maxSort] = await db
    .select({ maxOrder: max(productImages.sortOrder) })
    .from(productImages)
    .where(eq(productImages.variantId, variantId));
  const nextSort = (maxSort?.maxOrder ?? -1) + 1;

  const [img] = await db
    .insert(productImages)
    .values({
      variantId,
      imagePath,
      isPrimary,
      altText: altText || null,
      sortOrder: nextSort,
    })
    .returning();

  revalidatePath("/studio/products");
  return img;
}

export async function removeVariantImage(imageId: number) {
  await requireAdmin();

  await db.delete(productImages).where(eq(productImages.imageId, imageId));

  revalidatePath("/studio/products");
  return { success: true };
}

export async function setVariantPrimaryImage(
  variantId: number,
  imageId: number
) {
  await requireAdmin();

  // Verify image belongs to this variant
  const [image] = await db
    .select({ variantId: productImages.variantId })
    .from(productImages)
    .where(eq(productImages.imageId, imageId))
    .limit(1);
  if (!image || image.variantId !== variantId) {
    throw new Error("Image does not belong to this variant");
  }

  await db
    .update(productImages)
    .set({ isPrimary: false })
    .where(eq(productImages.variantId, variantId));

  await db
    .update(productImages)
    .set({ isPrimary: true })
    .where(eq(productImages.imageId, imageId));

  revalidatePath("/studio/products");
  return { success: true };
}

// ── Bulk Product Operations ────────────────────────────────────

export async function bulkDeleteProducts(productIds: number[]) {
  await requireAdmin();

  if (productIds.length === 0) return { success: true, deleted: 0 };
  if (productIds.length > 100) throw new Error("Too many products to delete at once (max 100)");

  // Safety check: ensure no order items reference these products
  const [orderItemRef] = await db
    .select({ count: count() })
    .from(orderItems)
    .where(inArray(orderItems.productId, productIds));
  if (orderItemRef && orderItemRef.count > 0) {
    throw new Error("Cannot delete products with existing order items. Deactivate them instead.");
  }

  for (const id of productIds) {
    await db.delete(products).where(eq(products.productId, id));
  }

  revalidatePath("/studio/products");
  return { success: true, deleted: productIds.length };
}

export async function bulkToggleProductsActive(
  productIds: number[],
  isActive: boolean
) {
  await requireAdmin();

  if (productIds.length === 0) return { success: true, updated: 0 };

  for (const id of productIds) {
    await db
      .update(products)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(products.productId, id));
  }

  revalidatePath("/studio/products");
  return { success: true, updated: productIds.length };
}

export async function bulkUpdateProductCategory(
  productIds: number[],
  categoryId: number
) {
  await requireAdmin();

  for (const id of productIds) {
    await db
      .update(products)
      .set({ categoryId, updatedAt: new Date() })
      .where(eq(products.productId, id));
  }

  revalidatePath("/studio/products");
  return { success: true, updated: productIds.length };
}

export async function duplicateProduct(productId: number) {
  await requireAdmin();

  const original = await db.query.products.findFirst({
    where: eq(products.productId, productId),
    with: {
      variants: {
        with: { images: true },
      },
    },
  });

  if (!original) throw new Error("Product not found");

  // Create new product with "(Copy)" suffix
  const [newProduct] = await db
    .insert(products)
    .values({
      productName: `${original.productName} (Copy)`,
      slug: `${original.slug}-copy-${Date.now()}`,
      description: original.description,
      categoryId: original.categoryId,
      basePrice: original.basePrice,
      mrp: original.mrp,
      productCode: `${original.productCode}-COPY`,
      material: original.material,
      fabricWeight: original.fabricWeight,
      careInstructions: original.careInstructions,
      origin: original.origin,
      detailHtml: original.detailHtml,
      label: original.label,
      isActive: false, // Start as inactive
      priority: original.priority,
    })
    .returning();

  // Duplicate variants and their images
  for (const variant of original.variants) {
    const [newVariant] = await db
      .insert(productVariants)
      .values({
        productId: newProduct.productId,
        sku: variant.sku ? `${variant.sku}-COPY` : null,
        color: variant.color,
        hexcode: variant.hexcode,
        size: variant.size,
        stockCount: 0, // Start with 0 stock
        priceModifier: variant.priceModifier,
        price: variant.price,
        mrp: variant.mrp,
      })
      .returning();

    // Duplicate images (reuse same image paths)
    for (const img of variant.images) {
      await db.insert(productImages).values({
        variantId: newVariant.variantId,
        imagePath: img.imagePath,
        altText: img.altText,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
      });
    }
  }

  revalidatePath("/studio/products");
  return newProduct;
}

export async function getProductStockSummary(productId: number) {
  await requireAdmin();

  const variants = await db
    .select({
      variantId: productVariants.variantId,
      color: productVariants.color,
      size: productVariants.size,
      stockCount: productVariants.stockCount,
      sku: productVariants.sku,
    })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  const totalStock = variants.reduce((sum, v) => sum + v.stockCount, 0);
  const outOfStock = variants.filter((v) => v.stockCount === 0).length;
  const lowStock = variants.filter(
    (v) => v.stockCount > 0 && v.stockCount <= 5
  ).length;

  return {
    variants,
    totalStock,
    outOfStock,
    lowStock,
    totalVariants: variants.length,
  };
}

export async function getLowStockProducts(threshold: number = 5) {
  await requireAdmin();

  const safeThreshold = Math.min(Math.max(0, threshold), 100);

  const allProducts = await db.query.products.findMany({
    where: eq(products.isActive, true),
    with: {
      category: { columns: { categoryName: true } },
      variants: {
        columns: { variantId: true, color: true, size: true, stockCount: true, sku: true },
      },
    },
    orderBy: [asc(products.productName)],
  });

  return allProducts
    .filter((p) =>
      p.variants.some((v) => v.stockCount <= safeThreshold)
    )
    .map((p) => ({
      productId: p.productId,
      productName: p.productName,
      productCode: p.productCode,
      category: p.category?.categoryName ?? "—",
      variants: p.variants.filter((v) => v.stockCount <= safeThreshold),
      totalVariants: p.variants.length,
      lowStockCount: p.variants.filter((v) => v.stockCount > 0 && v.stockCount <= safeThreshold).length,
      outOfStockCount: p.variants.filter((v) => v.stockCount === 0).length,
    }));
}

// ═══════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════

export async function getAdminCategories() {
  await requireAdmin();

  return db.query.categories.findMany({
    orderBy: [asc(categories.sortOrder), asc(categories.categoryName)],
    with: {
      parent: { columns: { categoryName: true } },
    },
  });
}

export async function createCategory(data: {
  categoryName: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentCategoryId?: number | null;
  isActive?: boolean;
  sortOrder?: number;
}) {
  await requireAdmin();

  const [cat] = await db
    .insert(categories)
    .values({
      categoryName: data.categoryName,
      slug: data.slug,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      parentCategoryId: data.parentCategoryId || null,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 99,
    })
    .returning();

  revalidatePath("/studio/categories");
  return cat;
}

export async function updateCategory(
  categoryId: number,
  data: {
    categoryName?: string;
    slug?: string;
    description?: string;
    imageUrl?: string;
    parentCategoryId?: number | null;
    isActive?: boolean;
    sortOrder?: number;
  }
) {
  await requireAdmin();

  await db
    .update(categories)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(categories.categoryId, categoryId));

  revalidatePath("/studio/categories");
  return { success: true };
}

export async function deleteCategory(categoryId: number) {
  await requireAdmin();

  // Safety check: ensure no products reference this category
  const [productRef] = await db
    .select({ count: count() })
    .from(products)
    .where(eq(products.categoryId, categoryId));
  if (productRef && productRef.count > 0) {
    throw new Error("Cannot delete category with existing products. Move or delete them first.");
  }

  // Safety check: ensure no child categories reference this category
  const [childRef] = await db
    .select({ count: count() })
    .from(categories)
    .where(eq(categories.parentCategoryId, categoryId));
  if (childRef && childRef.count > 0) {
    throw new Error("Cannot delete category with subcategories. Delete subcategories first.");
  }

  await db.delete(categories).where(eq(categories.categoryId, categoryId));

  revalidatePath("/studio/categories");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════════════════════════════════

export async function getAdminCustomers(params?: {
  page?: number;
  search?: string;
}) {
  await requireAdmin();

  const page = params?.page ?? 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params?.search) {
    const escaped = escapeIlike(params.search);
    conditions.push(
      or(
        ilike(users.name, `%${escaped}%`),
        ilike(users.email, `%${escaped}%`)
      )
    );
  }

  const allUsers = await db
    .select({
      userId: users.userId,
      name: users.name,
      email: users.email,
      phoneNumber: users.phoneNumber,
      role: users.role,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      orderCount: sql<number>`(SELECT COUNT(*) FROM orders WHERE orders.user_id = ${users.userId})`,
      totalSpent: sql<number>`COALESCE((SELECT SUM(total_amount) FROM orders WHERE orders.user_id = ${users.userId} AND payment_status = 'Completed'), 0)`,
    })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: count() })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    customers: allUsers,
    total: totalResult?.count ?? 0,
    page,
    totalPages: Math.ceil((totalResult?.count ?? 0) / limit),
  };
}

export async function getAdminCustomerDetail(userId: string) {
  await requireAdmin();

  const [customer] = await db
    .select()
    .from(users)
    .where(eq(users.userId, userId))
    .limit(1);

  const addresses = await db
    .select()
    .from(userAddresses)
    .where(eq(userAddresses.userId, userId));

  const customerOrders = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: [desc(orders.orderDate)],
    with: { items: { columns: { orderItemId: true } } },
  });

  return { customer, addresses, orders: customerOrders };
}

export async function updateUserRole(userId: string, role: "customer" | "admin" | "cashier") {
  await requireAdmin();

  const validRoles = ["customer", "admin", "cashier"] as const;
  if (!validRoles.includes(role)) {
    throw new Error("Invalid role");
  }

  await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.userId, userId));

  revalidatePath("/studio/customers");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════════════════════════

export async function getAdminReviews(params?: {
  page?: number;
  approved?: boolean;
}) {
  await requireAdmin();

  const page = params?.page ?? 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params?.approved !== undefined) {
    conditions.push(eq(reviews.isApproved, params.approved));
  }

  const allReviews = await db.query.reviews.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(reviews.createdAt)],
    limit,
    offset,
    with: {
      product: { columns: { productId: true, productName: true, slug: true } },
      user: { columns: { name: true, email: true } },
    },
  });

  const [totalResult] = await db
    .select({ count: count() })
    .from(reviews)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    reviews: allReviews,
    total: totalResult?.count ?? 0,
    page,
    totalPages: Math.ceil((totalResult?.count ?? 0) / limit),
  };
}

export async function toggleReviewApproval(reviewId: number, isApproved: boolean) {
  await requireAdmin();

  await db
    .update(reviews)
    .set({ isApproved, updatedAt: new Date() })
    .where(eq(reviews.reviewId, reviewId));

  revalidatePath("/studio/reviews");
  return { success: true };
}

export async function deleteReview(reviewId: number) {
  await requireAdmin();

  await db.delete(reviews).where(eq(reviews.reviewId, reviewId));

  revalidatePath("/studio/reviews");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// COUPONS
// ═══════════════════════════════════════════════════════════════

export async function getAdminCoupons() {
  await requireAdmin();

  return db.query.coupons.findMany({
    orderBy: [desc(coupons.createdAt)],
  });
}

export async function createCoupon(data: {
  code: string;
  description?: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: string;
  minPurchaseAmount?: string;
  maxDiscountAmount?: string;
  validFrom?: string;
  validTill?: string;
  usageLimitTotal?: number;
  usageLimitPerCustomer?: number;
  appliesToAllProducts?: boolean;
  isActive?: boolean;
}) {
  await requireAdmin();

  // Validate discount bounds
  const discountVal = Number(data.discountValue);
  if (isNaN(discountVal) || discountVal <= 0) {
    throw new Error("Discount value must be a positive number");
  }
  if (data.discountType === "percentage" && discountVal > 100) {
    throw new Error("Percentage discount cannot exceed 100%");
  }
  if (data.code.trim().length === 0) {
    throw new Error("Coupon code is required");
  }
  if (data.code.trim().length > 50) {
    throw new Error("Coupon code too long (max 50 chars)");
  }

  const [coupon] = await db
    .insert(coupons)
    .values({
      code: data.code.toUpperCase(),
      description: data.description || null,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minPurchaseAmount: data.minPurchaseAmount || "0.00",
      maxDiscountAmount: data.maxDiscountAmount || null,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validTill: data.validTill ? new Date(data.validTill) : null,
      usageLimitTotal: data.usageLimitTotal ?? null,
      usageLimitPerCustomer: data.usageLimitPerCustomer ?? null,
      appliesToAllProducts: data.appliesToAllProducts ?? true,
      isActive: data.isActive ?? true,
    })
    .returning();

  revalidatePath("/studio/coupons");
  return coupon;
}

export async function updateCoupon(
  couponId: number,
  data: {
    code?: string;
    description?: string;
    discountType?: "percentage" | "fixed_amount";
    discountValue?: string;
    minPurchaseAmount?: string;
    maxDiscountAmount?: string | null;
    validFrom?: string | null;
    validTill?: string | null;
    usageLimitTotal?: number | null;
    usageLimitPerCustomer?: number | null;
    appliesToAllProducts?: boolean;
    isActive?: boolean;
  }
) {
  await requireAdmin();

  // Validate discount bounds if provided
  if (data.discountValue !== undefined) {
    const discountVal = Number(data.discountValue);
    if (isNaN(discountVal) || discountVal <= 0) {
      throw new Error("Discount value must be a positive number");
    }
    const resolvedType = data.discountType;
    if (resolvedType === "percentage" && discountVal > 100) {
      throw new Error("Percentage discount cannot exceed 100%");
    }
  }
  if (data.code !== undefined && data.code.trim().length === 0) {
    throw new Error("Coupon code is required");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = { updatedAt: new Date() };
  if (data.code !== undefined) updateData.code = data.code.toUpperCase();
  if (data.description !== undefined) updateData.description = data.description;
  if (data.discountType !== undefined) updateData.discountType = data.discountType;
  if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
  if (data.minPurchaseAmount !== undefined) updateData.minPurchaseAmount = data.minPurchaseAmount;
  if (data.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = data.maxDiscountAmount;
  if (data.validFrom !== undefined) updateData.validFrom = data.validFrom ? new Date(data.validFrom) : null;
  if (data.validTill !== undefined) updateData.validTill = data.validTill ? new Date(data.validTill) : null;
  if (data.usageLimitTotal !== undefined) updateData.usageLimitTotal = data.usageLimitTotal;
  if (data.usageLimitPerCustomer !== undefined) updateData.usageLimitPerCustomer = data.usageLimitPerCustomer;
  if (data.appliesToAllProducts !== undefined) updateData.appliesToAllProducts = data.appliesToAllProducts;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  await db
    .update(coupons)
    .set(updateData)
    .where(eq(coupons.couponId, couponId));

  revalidatePath("/studio/coupons");
  return { success: true };
}

export async function deleteCoupon(couponId: number) {
  await requireAdmin();

  await db.delete(coupons).where(eq(coupons.couponId, couponId));

  revalidatePath("/studio/coupons");
  return { success: true };
}

export async function toggleCouponActive(couponId: number, isActive: boolean) {
  await requireAdmin();

  await db
    .update(coupons)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(coupons.couponId, couponId));

  revalidatePath("/studio/coupons");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// RETURNS
// ═══════════════════════════════════════════════════════════════

export async function getAdminReturns(params?: {
  status?: string;
  page?: number;
}) {
  await requireAdmin();

  const page = params?.page ?? 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params?.status && params.status !== "all") {
    if (!VALID_RETURN_STATUSES.includes(params.status as typeof VALID_RETURN_STATUSES[number])) {
      throw new Error("Invalid return status filter");
    }
    conditions.push(eq(returnRequests.status, params.status as typeof returnRequests.status.enumValues[number]));
  }

  const allReturns = await db.query.returnRequests.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(returnRequests.createdAt)],
    limit,
    offset,
    with: {
      order: { columns: { orderId: true, totalAmount: true } },
      orderItem: {
        columns: { productName: true, variantColor: true, variantSize: true, pricePerUnit: true, quantity: true },
      },
      user: { columns: { name: true, email: true } },
    },
  });

  const [totalResult] = await db
    .select({ count: count() })
    .from(returnRequests)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    returns: allReturns,
    total: totalResult?.count ?? 0,
    page,
    totalPages: Math.ceil((totalResult?.count ?? 0) / limit),
  };
}

export async function resolveReturn(
  returnId: number,
  status: string,
  adminNotes?: string,
) {
  await requireAdmin();

  if (!VALID_RETURN_STATUSES.includes(status as typeof VALID_RETURN_STATUSES[number])) {
    throw new Error("Invalid return status");
  }

  await db
    .update(returnRequests)
    .set({
      status: status as typeof returnRequests.status.enumValues[number],
      adminNotes: adminNotes || null,
      updatedAt: new Date(),
    })
    .where(eq(returnRequests.returnId, returnId));

  // Send return status email
  try {
    const returnReq = await db.query.returnRequests.findFirst({
      where: eq(returnRequests.returnId, returnId),
      columns: { userId: true, orderId: true },
    });

    if (returnReq) {
      const [dbUser] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.userId, returnReq.userId))
        .limit(1);

      if (dbUser?.email) {
        sendReturnStatusEmail({
          customerName: dbUser.name,
          customerEmail: dbUser.email,
          orderId: returnReq.orderId,
          returnStatus: status,
          adminNotes: adminNotes,
        }).catch((err) => console.error("Return email failed:", err));
      }

      // Create in-app notification for the customer
      createNotification({
        userId: returnReq.userId,
        type: "order",
        title: `Return Request ${status}`,
        message: `Your return request for order #${returnReq.orderId} has been ${status.toLowerCase()}.`,
        data: { orderId: returnReq.orderId, returnId, status },
      }).catch((err) => console.error("Notification creation failed:", err));
    }
  } catch (err) {
    console.error("Failed to send return email:", err);
  }

  revalidatePath("/studio/returns");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// NEWSLETTER
// ═══════════════════════════════════════════════════════════════

export async function getNewsletterSubscribers() {
  await requireAdmin();

  return db
    .select()
    .from(newsletter)
    .where(eq(newsletter.isSubscribed, true))
    .orderBy(desc(newsletter.subscribedAt));
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS (Delivery)
// ═══════════════════════════════════════════════════════════════

export async function getDeliverySettings() {
  await requireAdmin();

  return db.select().from(deliverySettings).orderBy(asc(deliverySettings.settingId));
}

export async function upsertDeliverySetting(data: {
  settingId?: number;
  label: string;
  minOrderAmount: string;
  deliveryCharge: string;
  isFreeDelivery: boolean;
  stateCode?: string;
  isActive: boolean;
}) {
  await requireAdmin();

  if (data.settingId) {
    await db
      .update(deliverySettings)
      .set({
        label: data.label,
        minOrderAmount: data.minOrderAmount,
        deliveryCharge: data.deliveryCharge,
        isFreeDelivery: data.isFreeDelivery,
        stateCode: data.stateCode || null,
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(deliverySettings.settingId, data.settingId));
  } else {
    await db.insert(deliverySettings).values({
      label: data.label,
      minOrderAmount: data.minOrderAmount,
      deliveryCharge: data.deliveryCharge,
      isFreeDelivery: data.isFreeDelivery,
      stateCode: data.stateCode || null,
      isActive: data.isActive,
    });
  }

  revalidatePath("/studio/settings");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// STORE SETTINGS (Billing / GST)
// ═══════════════════════════════════════════════════════════════

export async function getStoreSettings() {
  await requireAdmin();

  const [settings] = await db.select().from(storeSettings).limit(1);
  return settings ?? null;
}

export async function upsertStoreSettings(data: {
  businessName: string;
  businessTagline?: string;
  gstin?: string;
  pan?: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  stateCode: string;
  pincode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  gstRate: string;
  hsnCode: string;
  enableGst: boolean;
  invoicePrefix: string;
  nextInvoiceNumber?: number;
  invoiceTerms?: string;
  invoiceNotes?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankBranch?: string;
  upiId?: string;
  // Bill layout customization
  billPaperSize?: string;
  billAccentColor?: string;
  billTitle?: string;
  billHeaderText?: string;
  billFooterText?: string;
  billGreeting?: string;
  billLogoUrl?: string;
  billShowLogo?: boolean;
  billShowHsn?: boolean;
  billShowSku?: boolean;
  billShowGstSummary?: boolean;
  billShowBankDetails?: boolean;
  billShowSignatory?: boolean;
  billShowAmountWords?: boolean;
  billShowCustomerSection?: boolean;
  billFontScale?: string;
  billExtraConfig?: Record<string, unknown>;
}) {
  await requireAdmin();

  const nullableFields = {
    businessTagline: data.businessTagline || null,
    gstin: data.gstin || null,
    pan: data.pan || null,
    addressLine1: data.addressLine1 || null,
    addressLine2: data.addressLine2 || null,
    pincode: data.pincode || null,
    country: data.country || "India",
    phone: data.phone || null,
    email: data.email || null,
    website: data.website || null,
    invoiceTerms: data.invoiceTerms || null,
    invoiceNotes: data.invoiceNotes || null,
    bankName: data.bankName || null,
    bankAccountNumber: data.bankAccountNumber || null,
    bankIfsc: data.bankIfsc || null,
    bankBranch: data.bankBranch || null,
    upiId: data.upiId || null,
    billHeaderText: data.billHeaderText || null,
    billFooterText: data.billFooterText || null,
    billGreeting: data.billGreeting || null,
    billLogoUrl: data.billLogoUrl || null,
    billExtraConfig: data.billExtraConfig || null,
  };

  const [existing] = await db.select({ settingId: storeSettings.settingId }).from(storeSettings).limit(1);

  if (existing) {
    await db
      .update(storeSettings)
      .set({
        ...data,
        ...nullableFields,
        nextInvoiceNumber: data.nextInvoiceNumber ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(storeSettings.settingId, existing.settingId));
  } else {
    await db.insert(storeSettings).values({
      ...data,
      ...nullableFields,
      nextInvoiceNumber: data.nextInvoiceNumber ?? 1,
    });
  }

  revalidatePath("/studio/settings");
  // Bust cached site config so storefront picks up changes immediately
  const { revalidateTag } = await import("next/cache");
  revalidateTag("site-config");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// BILLING (In-Store POS)
// ═══════════════════════════════════════════════════════════════

export async function searchProductsForBilling(query: string) {
  await requireAdminOrCashier();

  if (!query || query.length < 2) return [];

  const escaped = escapeIlike(query);

  const results = await db.query.products.findMany({
    where: and(
      eq(products.isActive, true),
      or(
        ilike(products.productName, `%${escaped}%`),
        ilike(products.productCode, `%${escaped}%`)
      )
    ),
    limit: 10,
    with: {
      variants: {
        columns: {
          variantId: true,
          color: true,
          size: true,
          stockCount: true,
          sku: true,
          priceModifier: true,
          price: true,
          mrp: true,
        },
      },
    },
  });

  return results.map((p) => ({
    productId: p.productId,
    productName: p.productName,
    productCode: p.productCode,
    basePrice: p.basePrice,
    mrp: p.mrp,
    variants: p.variants,
  }));
}

// ═══════════════════════════════════════════════════════════════
// SITE APPEARANCE
// ═══════════════════════════════════════════════════════════════

export async function upsertSiteAppearance(data: {
  siteLogoUrl?: string | null;
  sitePrimaryColor?: string;
  siteDescription?: string | null;
  footerTagline?: string | null;
  navLinksConfig?: { label: string; href: string; enabled: boolean }[] | null;
  footerQuickLinks?: { label: string; href: string }[] | null;
  footerHelpLinks?: { label: string; href: string }[] | null;
  footerLegalLinks?: { label: string; href: string }[] | null;
  footerContactPhone?: string | null;
  footerContactEmail?: string | null;
  footerShowMadeInIndia?: boolean;
  // SEO
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogImageUrl?: string | null;
  // Social
  socialInstagram?: string | null;
  socialFacebook?: string | null;
  socialTwitter?: string | null;
  socialYoutube?: string | null;
  // Hero
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroBadgeText?: string | null;
  heroCtaText?: string | null;
  heroCtaLink?: string | null;
  heroSecondaryCtaText?: string | null;
  heroSecondaryCtaLink?: string | null;
}) {
  await requireAdmin();

  const payload = {
    siteLogoUrl: data.siteLogoUrl || null,
    sitePrimaryColor: data.sitePrimaryColor || "#470B49",
    siteDescription: data.siteDescription || null,
    footerTagline: data.footerTagline || null,
    navLinksConfig: data.navLinksConfig ?? null,
    footerQuickLinks: data.footerQuickLinks ?? null,
    footerHelpLinks: data.footerHelpLinks ?? null,
    footerLegalLinks: data.footerLegalLinks ?? null,
    footerContactPhone: data.footerContactPhone || null,
    footerContactEmail: data.footerContactEmail || null,
    footerShowMadeInIndia: data.footerShowMadeInIndia ?? true,
    // SEO
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
    seoKeywords: data.seoKeywords || null,
    ogImageUrl: data.ogImageUrl || null,
    // Social
    socialInstagram: data.socialInstagram || null,
    socialFacebook: data.socialFacebook || null,
    socialTwitter: data.socialTwitter || null,
    socialYoutube: data.socialYoutube || null,
    // Hero
    heroTitle: data.heroTitle || null,
    heroSubtitle: data.heroSubtitle || null,
    heroBadgeText: data.heroBadgeText || null,
    heroCtaText: data.heroCtaText || null,
    heroCtaLink: data.heroCtaLink || null,
    heroSecondaryCtaText: data.heroSecondaryCtaText || null,
    heroSecondaryCtaLink: data.heroSecondaryCtaLink || null,
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ settingId: storeSettings.settingId })
    .from(storeSettings)
    .limit(1);

  if (existing) {
    await db
      .update(storeSettings)
      .set(payload)
      .where(eq(storeSettings.settingId, existing.settingId));
  } else {
    // Create a minimal row if none exists yet
    await db.insert(storeSettings).values({
      businessName: "LookKool",
      city: "",
      state: "Tamil Nadu",
      stateCode: "33",
      gstRate: "5.00",
      hsnCode: "6104",
      enableGst: true,
      invoicePrefix: "LK",
      ...payload,
    });
  }

  // Revalidate storefront and admin settings
  revalidatePath("/", "layout");
  revalidatePath("/studio/settings");
  const { revalidateTag } = await import("next/cache");
  revalidateTag("site-config");
  return { success: true };
}

export async function generateInvoiceNumber() {
  await requireAdminOrCashier();

  // Atomic increment to prevent race conditions with concurrent cashiers
  const [result] = await db
    .update(storeSettings)
    .set({
      nextInvoiceNumber: sql`${storeSettings.nextInvoiceNumber} + 1`,
      updatedAt: new Date(),
    })
    .returning({
      invoicePrefix: storeSettings.invoicePrefix,
      prevNumber: sql<number>`${storeSettings.nextInvoiceNumber} - 1`,
    });

  if (!result) {
    // No settings row exists yet — create one atomically
    const [created] = await db
      .insert(storeSettings)
      .values({
        businessName: "LookKool",
        city: "",
        state: "Tamil Nadu",
        stateCode: "33",
        gstRate: "5.00",
        hsnCode: "6104",
        enableGst: true,
        invoicePrefix: "LK",
        nextInvoiceNumber: 2, // 1 is used now
      })
      .returning({ invoicePrefix: storeSettings.invoicePrefix });
    return `${created?.invoicePrefix ?? "LK"}-000001`;
  }

  const prefix = result.invoicePrefix ?? "LK";
  const num = result.prevNumber ?? 1;
  return `${prefix}-${String(num).padStart(6, "0")}`;
}

export async function createInStoreBill(data: {
  customerName?: string;
  customerPhone?: string;
  customerGstin?: string;
  subtotal: string;
  discountAmount: string;
  taxableAmount: string;
  cgstRate: string;
  cgstAmount: string;
  sgstRate: string;
  sgstAmount: string;
  igstRate: string;
  igstAmount: string;
  roundOff: string;
  totalAmount: string;
  paymentMode: string;
  items: string; // JSON string of line items
  notes?: string;
}) {
  const admin = await requireAdminOrCashier();

  // Validate items JSON server-side
  let parsedItems: Array<{ variantId?: number; quantity: number; productName?: string; rate?: number; amount?: number }>;
  try {
    parsedItems = JSON.parse(data.items);
    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      throw new Error("Items must be a non-empty array");
    }
    for (const item of parsedItems) {
      if (typeof item.quantity !== "number" || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        throw new Error("Each item must have a valid integer quantity >= 1");
      }
    }
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error("Invalid items JSON");
    }
    throw e;
  }

  // Validate numeric fields
  const numericFields = ["subtotal", "discountAmount", "taxableAmount", "cgstAmount", "sgstAmount", "igstAmount", "totalAmount"] as const;
  for (const field of numericFields) {
    if (isNaN(Number(data[field]))) {
      throw new Error(`Invalid numeric value for ${field}`);
    }
  }

  // Validate stock availability BEFORE creating the bill
  const variantItems = parsedItems.filter(item => item.variantId);
  if (variantItems.length > 0) {
    const variantIds = variantItems.map(item => item.variantId!).filter(Boolean);
    const stocks = await db
      .select({ variantId: productVariants.variantId, stockCount: productVariants.stockCount })
      .from(productVariants)
      .where(inArray(productVariants.variantId, variantIds));

    const stockMap = new Map(stocks.map(s => [s.variantId, s.stockCount]));
    for (const item of variantItems) {
      const available = stockMap.get(item.variantId!) ?? 0;
      if (available < item.quantity) {
        throw new Error(`Insufficient stock for variant ${item.variantId} (available: ${available}, requested: ${item.quantity})`);
      }
    }
  }

  const invoiceNumber = await generateInvoiceNumber();

  const [bill] = await db
    .insert(inStoreBills)
    .values({
      invoiceNumber,
      customerName: data.customerName || null,
      customerPhone: data.customerPhone || null,
      customerGstin: data.customerGstin || null,
      subtotal: data.subtotal,
      discountAmount: data.discountAmount,
      taxableAmount: data.taxableAmount,
      cgstRate: data.cgstRate,
      cgstAmount: data.cgstAmount,
      sgstRate: data.sgstRate,
      sgstAmount: data.sgstAmount,
      igstRate: data.igstRate,
      igstAmount: data.igstAmount,
      roundOff: data.roundOff,
      totalAmount: data.totalAmount,
      paymentMode: data.paymentMode,
      items: data.items,
      createdBy: admin.email,
      notes: data.notes || null,
    })
    .returning();

  // Deduct stock for each sold item — errors here are critical, not silently swallowed
  for (const item of parsedItems) {
    if (item.variantId) {
      await db
        .update(productVariants)
        .set({
          stockCount: sql`GREATEST(${productVariants.stockCount} - ${item.quantity}, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.variantId, item.variantId));
    }
  }

  revalidatePath("/studio/billing");
  return bill;
}

export async function getInStoreBills(params?: { page?: number; search?: string }) {
  await requireAdminOrCashier();

  const page = params?.page ?? 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params?.search) {
    const escaped = escapeIlike(params.search);
    conditions.push(
      or(
        ilike(inStoreBills.invoiceNumber, `%${escaped}%`),
        ilike(inStoreBills.customerName, `%${escaped}%`),
        ilike(inStoreBills.customerPhone, `%${escaped}%`)
      )
    );
  }

  const bills = await db
    .select()
    .from(inStoreBills)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(inStoreBills.billDate))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: count() })
    .from(inStoreBills)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    bills,
    total: totalResult?.count ?? 0,
    page,
    totalPages: Math.ceil((totalResult?.count ?? 0) / limit),
  };
}

export async function getInStoreBill(billId: number) {
  await requireAdminOrCashier();

  const [bill] = await db
    .select()
    .from(inStoreBills)
    .where(eq(inStoreBills.billId, billId))
    .limit(1);

  return bill ?? null;
}

// Get invoice data for online orders (for PDF generation)
export async function getOrderInvoiceData(orderId: number) {
  await requireAdmin();

  const order = await db.query.orders.findFirst({
    where: eq(orders.orderId, orderId),
    with: {
      user: {
        columns: { name: true, email: true, phoneNumber: true },
      },
      items: {
        with: {
          variant: {
            columns: { sku: true },
          },
        },
      },
    },
  });

  const [settings] = await db.select().from(storeSettings).limit(1);

  return { order, storeSettings: settings ?? null };
}
