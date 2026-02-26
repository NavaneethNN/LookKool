"use server";

import { db } from "@/db";
import {
  products,
  productVariants,
  productImages,
  orderItems,
} from "@/db/schema";
import { eq, desc, asc, count, and, ilike, or, inArray, max, type AnyColumn } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin, requireAdminOrCashier } from "@/lib/admin/require-admin";
import { escapeIlike } from "./_helpers";

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
        columns: { variantId: true, color: true, hexcode: true, size: true, stockCount: true },
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
      basePrice: data.basePrice !== "" ? data.basePrice : "0.00",
      mrp: data.mrp !== "" ? data.mrp : data.basePrice !== "" ? data.basePrice : "0.00",
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
    .returning({ productId: products.productId });

  revalidatePath("/studio/products");
    revalidateTag("products");
  return { productId: newProduct.productId };
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

  const cleaned = { ...data } as Record<string, unknown>;
  // Nullable text fields: empty string → null
  for (const key of ["description", "material", "fabricWeight", "careInstructions", "origin", "detailHtml", "label"] as const) {
    if (key in cleaned && cleaned[key] === "") cleaned[key] = null;
  }
  // NOT NULL decimal fields: empty string → remove (don't update)
  for (const key of ["basePrice", "mrp"] as const) {
    if (key in cleaned && cleaned[key] === "") delete cleaned[key];
  }
  // Integer fields: coerce to number
  for (const key of ["categoryId", "priority"] as const) {
    if (key in cleaned) {
      const val = cleaned[key];
      if (val === "" || val === null || val === undefined) delete cleaned[key];
      else cleaned[key] = Number(val);
    }
  }

  await db
    .update(products)
    .set({
      ...cleaned,
      updatedAt: new Date(),
    })
    .where(eq(products.productId, productId));

  revalidatePath("/studio/products");
    revalidateTag("products");
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
    revalidateTag("products");
  return { success: true };
}

export async function toggleProductActive(productId: number, isActive: boolean) {
  await requireAdmin();

  await db
    .update(products)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(products.productId, productId));

  revalidatePath("/studio/products");
    revalidateTag("products");
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
    revalidateTag("products");
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

  await db
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
    });

  revalidatePath(`/studio/products/${data.productId}`);
  return { success: true };
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

  const cleaned = { ...data } as Record<string, unknown>;
  // Nullable decimal fields: empty string → null
  for (const key of ["price", "mrp", "costPrice"] as const) {
    if (key in cleaned && cleaned[key] === "") cleaned[key] = null;
  }
  // NOT NULL decimal field: empty string → default
  if ("priceModifier" in cleaned && cleaned.priceModifier === "") cleaned.priceModifier = "0.00";
  // Nullable text fields: empty string → null
  for (const key of ["sku", "hexcode", "barcode"] as const) {
    if (key in cleaned && cleaned[key] === "") cleaned[key] = null;
  }
  // Integer field: coerce
  if ("stockCount" in cleaned) cleaned.stockCount = Number(cleaned.stockCount) || 0;

  await db
    .update(productVariants)
    .set({ ...cleaned, updatedAt: new Date() })
    .where(eq(productVariants.variantId, variantId));

  revalidatePath("/studio/products");
    revalidateTag("products");
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
    revalidateTag("products");
  return { success: true };
}

/**
 * Atomically delete multiple variants (e.g. an entire color group).
 * Pre-checks ALL variants for order item references before deleting any.
 */
export async function bulkDeleteVariants(variantIds: number[]) {
  await requireAdmin();

  if (variantIds.length === 0) return { success: true, deleted: 0 };

  // Safety check: ensure no order items reference ANY of these variants
  const [orderItemRef] = await db
    .select({ count: count() })
    .from(orderItems)
    .where(inArray(orderItems.variantId, variantIds));
  if (orderItemRef && orderItemRef.count > 0) {
    throw new Error(
      "Cannot delete variants with existing order items. Some sizes in this color have been ordered."
    );
  }

  // Single atomic delete — cascades handle images, cart entries
  await db.delete(productVariants).where(inArray(productVariants.variantId, variantIds));

  revalidatePath("/studio/products");
    revalidateTag("products");
  return { success: true, deleted: variantIds.length };
}

export async function updateStock(variantId: number, stockCount: number) {
  await requireAdmin();

  await db
    .update(productVariants)
    .set({ stockCount, updatedAt: new Date() })
    .where(eq(productVariants.variantId, variantId));

  revalidatePath("/studio/products");
    revalidateTag("products");
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

  await db
    .insert(productImages)
    .values({
      variantId,
      imagePath,
      isPrimary,
      altText: altText || null,
      sortOrder: nextSort,
    });

  revalidatePath("/studio/products");
    revalidateTag("products");
  return { success: true };
}

export async function removeVariantImage(imageId: number) {
  await requireAdmin();

  await db.delete(productImages).where(eq(productImages.imageId, imageId));

  revalidatePath("/studio/products");
    revalidateTag("products");
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
    revalidateTag("products");
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

  // Single atomic delete — cascades handle variants, images, reviews, wishlist, cart
  await db.delete(products).where(inArray(products.productId, productIds));

  revalidatePath("/studio/products");
    revalidateTag("products");
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
    revalidateTag("products");
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
    revalidateTag("products");
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
    .returning({ productId: products.productId });

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
      .returning({ variantId: productVariants.variantId });

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
    revalidateTag("products");
  return { productId: newProduct.productId };
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
