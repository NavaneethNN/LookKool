"use server";

import { db } from "@/db";
import { newsletter } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function subscribeToNewsletter(email: string) {
  const normalised = email.trim().toLowerCase();

  // Basic format validation
  if (!normalised || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
    return { error: "Please enter a valid email address." };
  }

  try {
    // Check for existing record
    const [existing] = await db
      .select()
      .from(newsletter)
      .where(eq(newsletter.email, normalised))
      .limit(1);

    if (existing) {
      if (existing.isSubscribed) {
        return { error: "You are already subscribed." };
      }
      // Re-subscribe (they had unsubscribed before)
      await db
        .update(newsletter)
        .set({ isSubscribed: true, unsubscribedAt: null })
        .where(eq(newsletter.email, normalised));

      return { success: true };
    }

    // New subscriber
    await db.insert(newsletter).values({ email: normalised });

    return { success: true };
  } catch (err) {
    console.error("Newsletter subscribe error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}
