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
  returnRequests,
  reviews,
  coupons,
  newsletter,
  deliverySettings,
} from "@/db/schema";
import { eq, desc, asc, sql, count, sum, and, gte, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { sendShippingUpdate, sendReturnStatusEmail } from "@/lib/email/brevo";

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

  return db.query.orders.findMany({
    orderBy: [desc(orders.orderDate)],
    limit,
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
    conditions.push(eq(orders.status, params.status as typeof orders.status.enumValues[number]));
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
}) {
  await requireAdmin();

  const page = params?.page ?? 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params?.search) {
    conditions.push(
      or(
        ilike(products.productName, `%${params.search}%`),
        ilike(products.productCode, `%${params.search}%`)
      )
    );
  }
  if (params?.categoryId) {
    conditions.push(eq(products.categoryId, params.categoryId));
  }
  if (params?.active !== undefined) {
    conditions.push(eq(products.isActive, params.active));
  }

  const allProducts = await db.query.products.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [asc(products.priority), desc(products.createdAt)],
    limit,
    offset,
    with: {
      category: { columns: { categoryName: true } },
      variants: {
        columns: { variantId: true, color: true, size: true, stockCount: true },
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

  const [img] = await db
    .insert(productImages)
    .values({
      variantId,
      imagePath,
      isPrimary,
      altText: altText || null,
      sortOrder: 0,
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
    conditions.push(
      or(
        ilike(users.name, `%${params.search}%`),
        ilike(users.email, `%${params.search}%`)
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

export async function updateUserRole(userId: string, role: "customer" | "admin") {
  await requireAdmin();

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
