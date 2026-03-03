"use server";

import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq, desc, count, and } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";

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
  revalidateTag("products", "default");
  return { success: true };
}

export async function deleteReview(reviewId: number) {
  await requireAdmin();

  await db.delete(reviews).where(eq(reviews.reviewId, reviewId));

  revalidatePath("/studio/reviews");
  revalidateTag("products", "default");
  return { success: true };
}
