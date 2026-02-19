"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { reviews, orderItems, orders } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function submitReview(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to leave a review" };
  }

  const productId = parseInt(formData.get("productId") as string);
  const rating = parseInt(formData.get("rating") as string);
  const reviewText = (formData.get("reviewText") as string)?.trim();
  const reviewerName = (formData.get("reviewerName") as string)?.trim();
  const slug = formData.get("slug") as string;

  if (!productId || !rating || !reviewText || !reviewerName) {
    return { error: "All fields are required" };
  }

  if (rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5" };
  }

  if (reviewText.length < 10) {
    return { error: "Review must be at least 10 characters" };
  }

  // Check if user has purchased this product (for verified badge)
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
    isApproved: true, // Auto-approve; admin can moderate via Supabase Dashboard
  });

  revalidatePath(`/products/${slug}`);
  return { success: true };
}
