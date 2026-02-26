"use server";

import { db } from "@/db";
import {
  stockAdjustments,
  productVariants,
  products,
} from "@/db/schema";
import { eq, desc, asc, sql, count, sum, and, gte, lte, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireAdminOrCashier } from "@/lib/admin/require-admin";
import { escapeIlike } from "./_helpers";

// ═══════════════════════════════════════════════════════════════
// INVENTORY / STOCK MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export async function getInventoryOverview() {
  await requireAdmin();

  const [totalVariants] = await db.select({ count: count() }).from(productVariants);
  const [outOfStock] = await db.select({ count: count() }).from(productVariants).where(eq(productVariants.stockCount, 0));
  const [lowStock] = await db.select({ count: count() }).from(productVariants).where(and(gte(productVariants.stockCount, 1), lte(productVariants.stockCount, 5)));
  const [totalStockResult] = await db.select({ total: sum(productVariants.stockCount) }).from(productVariants);

  return {
    totalVariants: totalVariants?.count ?? 0,
    outOfStock: outOfStock?.count ?? 0,
    lowStock: lowStock?.count ?? 0,
    totalStock: Number(totalStockResult?.total ?? 0),
  };
}

export async function getLowStockItems(threshold = 5, page = 1) {
  await requireAdmin();
  const safeThreshold = Math.min(Math.max(0, threshold), 100);
  const limit = 30;
  const offset = (page - 1) * limit;

  const items = await db
    .select({
      variantId: productVariants.variantId,
      productName: products.productName,
      productCode: products.productCode,
      color: productVariants.color,
      size: productVariants.size,
      sku: productVariants.sku,
      barcode: productVariants.barcode,
      stockCount: productVariants.stockCount,
      costPrice: productVariants.costPrice,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.productId))
    .where(lte(productVariants.stockCount, safeThreshold))
    .orderBy(asc(productVariants.stockCount))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db.select({ count: count() }).from(productVariants).where(lte(productVariants.stockCount, safeThreshold));

  return { items, total: totalResult?.count ?? 0, page, totalPages: Math.ceil((totalResult?.count ?? 0) / limit) };
}

export async function getStockAdjustments(params?: { variantId?: number; page?: number }) {
  await requireAdmin();
  const page = params?.page ?? 1;
  const limit = 30;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params?.variantId) {
    conditions.push(eq(stockAdjustments.variantId, params.variantId));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult] = await Promise.all([
    db.select().from(stockAdjustments).where(where).orderBy(desc(stockAdjustments.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(stockAdjustments).where(where),
  ]);

  return { adjustments: rows, total: totalResult[0]?.count ?? 0, page, totalPages: Math.ceil((totalResult[0]?.count ?? 0) / limit) };
}

export async function createStockAdjustment(data: {
  variantId: number;
  type: "manual_add" | "manual_remove" | "damage" | "opening_stock";
  quantity: number;
  reason?: string;
}) {
  const admin = await requireAdmin();

  const isAdding = data.type === "manual_add" || data.type === "opening_stock";
  const change = isAdding ? data.quantity : -data.quantity;

  // Update variant stock
  await db.update(productVariants).set({
    stockCount: isAdding
      ? sql`${productVariants.stockCount} + ${data.quantity}`
      : sql`GREATEST(${productVariants.stockCount} - ${data.quantity}, 0)`,
    updatedAt: new Date(),
  }).where(eq(productVariants.variantId, data.variantId));

  const [updated] = await db.select({ stockCount: productVariants.stockCount }).from(productVariants).where(eq(productVariants.variantId, data.variantId));

  await db.insert(stockAdjustments).values({
    variantId: data.variantId,
    type: data.type,
    quantityChange: change,
    stockAfter: updated?.stockCount ?? 0,
    referenceType: "manual",
    reason: data.reason || null,
    createdBy: admin.email,
  });

  revalidatePath("/studio/inventory");
  revalidatePath("/studio/products");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// BARCODE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export async function updateVariantBarcode(variantId: number, barcode: string) {
  await requireAdmin();
  await db.update(productVariants).set({ barcode, updatedAt: new Date() }).where(eq(productVariants.variantId, variantId));
  revalidatePath("/studio/products");
  revalidatePath("/studio/barcode");
  return { success: true };
}

export async function searchByBarcode(barcode: string) {
  await requireAdminOrCashier();
  if (!barcode || barcode.length < 3) return null;

  const result = await db
    .select({
      variantId: productVariants.variantId,
      productId: products.productId,
      productName: products.productName,
      productCode: products.productCode,
      basePrice: products.basePrice,
      mrp: products.mrp,
      color: productVariants.color,
      size: productVariants.size,
      sku: productVariants.sku,
      barcode: productVariants.barcode,
      stockCount: productVariants.stockCount,
      priceModifier: productVariants.priceModifier,
      variantPrice: productVariants.price,
      variantMrp: productVariants.mrp,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.productId))
    .where(and(
      eq(products.isActive, true),
      or(
        eq(productVariants.barcode, barcode),
        eq(productVariants.sku, barcode)
      )
    ))
    .limit(1);

  return result[0] ?? null;
}

export async function getVariantsForBarcodes(params?: { page?: number; search?: string; onlyMissing?: boolean }) {
  await requireAdmin();
  const page = params?.page ?? 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  const conditions = [eq(products.isActive, true)];
  if (params?.search) {
    const escaped = escapeIlike(params.search);
    conditions.push(
      or(
        ilike(products.productName, `%${escaped}%`),
        ilike(products.productCode, `%${escaped}%`),
        ilike(productVariants.sku, `%${escaped}%`),
        ilike(productVariants.barcode, `%${escaped}%`)
      )!
    );
  }
  if (params?.onlyMissing) {
    conditions.push(
      or(
        sql`${productVariants.barcode} IS NULL`,
        eq(productVariants.barcode, "")
      )!
    );
  }

  const rows = await db
    .select({
      variantId: productVariants.variantId,
      productName: products.productName,
      productCode: products.productCode,
      color: productVariants.color,
      size: productVariants.size,
      sku: productVariants.sku,
      barcode: productVariants.barcode,
      basePrice: products.basePrice,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.productId))
    .where(and(...conditions))
    .orderBy(asc(products.productName), asc(productVariants.color), asc(productVariants.size))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: count() })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.productId))
    .where(and(...conditions));

  return { variants: rows, total: totalResult?.count ?? 0, page, totalPages: Math.ceil((totalResult?.count ?? 0) / limit) };
}

export async function bulkGenerateBarcodes(variantIds: number[]) {
  await requireAdmin();

  for (const variantId of variantIds) {
    // Generate EAN-13 compatible barcode from variant ID
    const baseCode = "200" + String(variantId).padStart(9, "0");
    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(baseCode[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const barcode = baseCode + checkDigit;

    await db.update(productVariants).set({ barcode, updatedAt: new Date() }).where(eq(productVariants.variantId, variantId));
  }

  revalidatePath("/studio/barcode");
  revalidatePath("/studio/products");
  return { success: true };
}
