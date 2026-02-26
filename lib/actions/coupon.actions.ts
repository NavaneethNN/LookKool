"use server";

import { db } from "@/db";
import { coupons, couponProducts, couponCategories, products } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";

// ═══════════════════════════════════════════════════════════════
// COUPONS
// ═══════════════════════════════════════════════════════════════

export async function getAdminCoupons() {
  await requireAdmin();

  return db.query.coupons.findMany({
    orderBy: [desc(coupons.createdAt)],
  });
}

/** Lightweight product list for coupon product picker. */
export async function getProductListForSelector() {
  await requireAdmin();

  return db
    .select({
      productId: products.productId,
      productName: products.productName,
      productCode: products.productCode,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(asc(products.productName));
}

/** Get the product/category IDs currently assigned to a coupon. */
export async function getCouponScope(couponId: number) {
  await requireAdmin();

  const productRows = await db
    .select({ productId: couponProducts.productId })
    .from(couponProducts)
    .where(eq(couponProducts.couponId, couponId));

  const categoryRows = await db
    .select({ categoryId: couponCategories.categoryId })
    .from(couponCategories)
    .where(eq(couponCategories.couponId, couponId));

  return {
    productIds: productRows.map((r) => r.productId),
    categoryIds: categoryRows.map((r) => r.categoryId),
  };
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
  productIds?: number[];
  categoryIds?: number[];
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

  // Save product/category scope if restricted
  if (!coupon.appliesToAllProducts) {
    if (data.productIds && data.productIds.length > 0) {
      await db.insert(couponProducts).values(
        data.productIds.map((pid) => ({
          couponId: coupon.couponId,
          productId: pid,
        }))
      );
    }
    if (data.categoryIds && data.categoryIds.length > 0) {
      await db.insert(couponCategories).values(
        data.categoryIds.map((cid) => ({
          couponId: coupon.couponId,
          categoryId: cid,
        }))
      );
    }
  }

  revalidatePath("/studio/coupons");
  return { success: true };
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
    productIds?: number[];
    categoryIds?: number[];
  }
) {
  await requireAdmin();

  // Validate discount bounds if provided
  if (data.discountValue !== undefined) {
    const discountVal = Number(data.discountValue);
    if (isNaN(discountVal) || discountVal <= 0) {
      throw new Error("Discount value must be a positive number");
    }
    // Resolve type from input or DB to validate percentage cap
    let resolvedType = data.discountType;
    if (!resolvedType) {
      const [existing] = await db
        .select({ discountType: coupons.discountType })
        .from(coupons)
        .where(eq(coupons.couponId, couponId))
        .limit(1);
      resolvedType = existing?.discountType;
    }
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
  if (data.minPurchaseAmount !== undefined) updateData.minPurchaseAmount = data.minPurchaseAmount || "0.00";
  if (data.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = data.maxDiscountAmount || null;
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

  // Sync product/category scope when the flag or scope arrays are provided
  const shouldSyncScope =
    data.appliesToAllProducts !== undefined ||
    data.productIds !== undefined ||
    data.categoryIds !== undefined;

  if (shouldSyncScope) {
    // Resolve whether coupon applies to all products
    let appliesToAll = data.appliesToAllProducts;
    if (appliesToAll === undefined) {
      // Fetch current value from DB if not provided
      const [existing] = await db
        .select({ appliesToAllProducts: coupons.appliesToAllProducts })
        .from(coupons)
        .where(eq(coupons.couponId, couponId))
        .limit(1);
      appliesToAll = existing?.appliesToAllProducts ?? true;
    }

    // Clear old junction rows
    await db.delete(couponProducts).where(eq(couponProducts.couponId, couponId));
    await db.delete(couponCategories).where(eq(couponCategories.couponId, couponId));

    if (!appliesToAll) {
      if (data.productIds && data.productIds.length > 0) {
        await db.insert(couponProducts).values(
          data.productIds.map((pid) => ({
            couponId,
            productId: pid,
          }))
        );
      }
      if (data.categoryIds && data.categoryIds.length > 0) {
        await db.insert(couponCategories).values(
          data.categoryIds.map((cid) => ({
            couponId,
            categoryId: cid,
          }))
        );
      }
    }
  }

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
