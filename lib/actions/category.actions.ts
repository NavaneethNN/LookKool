"use server";

import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq, asc, count } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";

export async function getAdminCategories() {
  await requireAdmin();

  const rows = await db.query.categories.findMany({
    orderBy: [asc(categories.sortOrder), asc(categories.categoryName)],
    with: {
      parent: { columns: { categoryName: true } },
    },
  });

  // Strip Date fields before returning to Server Component → Client Component boundary
  return rows.map((cat) => ({
    categoryId: cat.categoryId,
    categoryName: cat.categoryName,
    slug: cat.slug,
    description: cat.description,
    imageUrl: cat.imageUrl,
    parentCategoryId: cat.parentCategoryId,
    isActive: cat.isActive,
    sortOrder: cat.sortOrder,
    parent: cat.parent ? { categoryName: cat.parent.categoryName } : null,
  }));
}

/** Lightweight list of active categories (for dropdowns / selectors). */
export async function getActiveCategoryList() {
  await requireAdmin();

  return db
    .select({
      categoryId: categories.categoryId,
      categoryName: categories.categoryName,
      slug: categories.slug,
    })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder));
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

  await db
    .insert(categories)
    .values({
      categoryName: data.categoryName,
      slug: data.slug,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      parentCategoryId: data.parentCategoryId ?? null,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 99,
    });

  revalidatePath("/studio/categories");
  revalidateTag("categories");
  return { success: true };
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

  const cleaned: Record<string, unknown> = { updatedAt: new Date() };
  if (data.categoryName !== undefined) cleaned.categoryName = data.categoryName;
  if (data.slug !== undefined) cleaned.slug = data.slug;
  if (data.description !== undefined) cleaned.description = data.description || null;
  if (data.imageUrl !== undefined) cleaned.imageUrl = data.imageUrl || null;
  if (data.parentCategoryId !== undefined) cleaned.parentCategoryId = data.parentCategoryId ?? null;
  if (data.isActive !== undefined) cleaned.isActive = data.isActive;
  if (data.sortOrder !== undefined) cleaned.sortOrder = data.sortOrder;

  await db
    .update(categories)
    .set(cleaned)
    .where(eq(categories.categoryId, categoryId));

  revalidatePath("/studio/categories");
  revalidateTag("categories");
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
  revalidateTag("categories");
  return { success: true };
}
