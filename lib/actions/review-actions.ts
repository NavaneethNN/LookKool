"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { reviews, orderItems, orders } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

// ─── Constants ─────────────────────────────────────────────────

const MAX_REVIEW_TEXT_LENGTH = 2000;
const MAX_REVIEWER_NAME_LENGTH = 100;
const MIN_REVIEW_TEXT_LENGTH = 10;

// ─── Sanitise text (strip HTML tags) ──────────────────────────

function sanitizeText(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

export async function submitReview(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to leave a review" };
  }

  const rawProductId = formData.get("productId") as string;
  const rawRating = formData.get("rating") as string;
  const rawReviewText = formData.get("reviewText") as string;
  const rawReviewerName = formData.get("reviewerName") as string;
  const slug = formData.get("slug") as string;

  // ─── Strict input validation ──────────────────────────────

  if (!rawProductId || !rawRating || !rawReviewText || !rawReviewerName || !slug) {
    return { error: "All fields are required" };
  }

  const productId = Number(rawProductId);
  const rating = Number(rawRating);

  if (!Number.isInteger(productId) || productId < 1) {
    return { error: "Invalid product" };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5" };
  }

  const reviewText = sanitizeText(rawReviewText);
  const reviewerName = sanitizeText(rawReviewerName);

  if (reviewerName.length < 2 || reviewerName.length > MAX_REVIEWER_NAME_LENGTH) {
    return { error: `Name must be 2–${MAX_REVIEWER_NAME_LENGTH} characters` };
  }
  if (reviewText.length < MIN_REVIEW_TEXT_LENGTH) {
    return { error: `Review must be at least ${MIN_REVIEW_TEXT_LENGTH} characters` };
  }
  if (reviewText.length > MAX_REVIEW_TEXT_LENGTH) {
    return { error: `Review must not exceed ${MAX_REVIEW_TEXT_LENGTH} characters` };
  }

  // ─── Duplicate review check ───────────────────────────────
  const [existingReview] = await db
    .select({ reviewId: reviews.reviewId })
    .from(reviews)
    .where(
      and(
        eq(reviews.userId, user.id),
        eq(reviews.productId, productId)
      )
    )
    .limit(1);

  if (existingReview) {
    return { error: "You have already reviewed this product" };
  }

  // ─── Check if user has purchased this product ─────────────
  const purchasedItems = await db
    .select()
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.orderId))
    .where(
      and(
        eq(orders.userId, user.id),
        eq(orderItems.productId, productId),
        eq(orders.paymentStatus, "Completed")
      )
    )
    .limit(1);

  const isVerified = purchasedItems.length > 0;

  await db.insert(reviews).values({
    productId,
    userId: user.id,
    reviewerName,
    rating,
    reviewText,
    isVerified,
    isApproved: isVerified, // Auto-approve only for verified purchases
  });

  revalidatePath(`/products/${slug}`);
  revalidateTag("products");
  return { success: true };
}
