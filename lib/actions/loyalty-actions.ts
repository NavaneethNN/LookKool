"use server";

import { db } from "@/db";
import {
  users,
  loyaltyTransactions,
} from "@/db/schema";
import { eq, desc, sql, and, gte, lte, count, sum } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin/require-admin";
import { revalidatePath } from "next/cache";

// ─── Loyalty configuration ────────────────────────────────────

/** Points earned per ₹100 spent */
const POINTS_PER_100 = 5;
/** Value of 1 point in ₹ (for redemption) */
const POINT_VALUE = 0.5;

// ─── Admin: Get customer loyalty info ──────────────────────────

export async function getCustomerLoyalty(userId: string) {
  await requireAdmin();

  const [user] = await db
    .select({
      userId: users.userId,
      name: users.name,
      email: users.email,
      loyaltyPoints: users.loyaltyPoints,
      creditBalance: users.creditBalance,
      totalSpent: users.totalSpent,
    })
    .from(users)
    .where(eq(users.userId, userId))
    .limit(1);

  if (!user) throw new Error("Customer not found");

  const transactions = await db
    .select()
    .from(loyaltyTransactions)
    .where(eq(loyaltyTransactions.userId, userId))
    .orderBy(desc(loyaltyTransactions.createdAt))
    .limit(50);

  return { user, transactions };
}

// ─── Admin: Add loyalty points ─────────────────────────────────

export async function addLoyaltyPoints(params: {
  userId: string;
  points: number;
  description: string;
}) {
  await requireAdmin();

  if (!params.userId || !params.points || params.points <= 0) {
    throw new Error("Invalid parameters");
  }
  if (!params.description?.trim()) {
    throw new Error("Description is required");
  }

  await db
    .update(users)
    .set({
      loyaltyPoints: sql`${users.loyaltyPoints} + ${params.points}`,
      updatedAt: new Date(),
    })
    .where(eq(users.userId, params.userId));

  await db.insert(loyaltyTransactions).values({
    userId: params.userId,
    type: "earned",
    points: params.points,
    description: params.description.trim().slice(0, 255),
  });

  revalidatePath("/studio/customers");
  return { success: true };
}

// ─── Admin: Deduct loyalty points ──────────────────────────────

export async function deductLoyaltyPoints(params: {
  userId: string;
  points: number;
  description: string;
}) {
  await requireAdmin();

  if (!params.userId || !params.points || params.points <= 0) {
    throw new Error("Invalid parameters");
  }

  // Check current balance
  const [user] = await db
    .select({ loyaltyPoints: users.loyaltyPoints })
    .from(users)
    .where(eq(users.userId, params.userId))
    .limit(1);

  if (!user || user.loyaltyPoints < params.points) {
    throw new Error("Insufficient loyalty points");
  }

  await db
    .update(users)
    .set({
      loyaltyPoints: sql`${users.loyaltyPoints} - ${params.points}`,
      updatedAt: new Date(),
    })
    .where(eq(users.userId, params.userId));

  await db.insert(loyaltyTransactions).values({
    userId: params.userId,
    type: "adjustment",
    points: -params.points,
    description: params.description.trim().slice(0, 255),
  });

  revalidatePath("/studio/customers");
  return { success: true };
}

// ─── Admin: Add store credit ───────────────────────────────────

export async function addStoreCredit(params: {
  userId: string;
  amount: number;
  description: string;
}) {
  await requireAdmin();

  if (!params.userId || !params.amount || params.amount <= 0) {
    throw new Error("Invalid parameters");
  }
  if (!params.description?.trim()) {
    throw new Error("Description is required");
  }

  await db
    .update(users)
    .set({
      creditBalance: sql`${users.creditBalance} + ${params.amount.toFixed(2)}`,
      updatedAt: new Date(),
    })
    .where(eq(users.userId, params.userId));

  await db.insert(loyaltyTransactions).values({
    userId: params.userId,
    type: "credit_added",
    creditAmount: params.amount.toFixed(2),
    description: params.description.trim().slice(0, 255),
  });

  revalidatePath("/studio/customers");
  return { success: true };
}

// ─── Admin: Deduct store credit ────────────────────────────────

export async function deductStoreCredit(params: {
  userId: string;
  amount: number;
  description: string;
}) {
  await requireAdmin();

  if (!params.userId || !params.amount || params.amount <= 0) {
    throw new Error("Invalid parameters");
  }

  const [user] = await db
    .select({ creditBalance: users.creditBalance })
    .from(users)
    .where(eq(users.userId, params.userId))
    .limit(1);

  if (!user || Number(user.creditBalance) < params.amount) {
    throw new Error("Insufficient store credit");
  }

  await db
    .update(users)
    .set({
      creditBalance: sql`${users.creditBalance} - ${params.amount.toFixed(2)}`,
      updatedAt: new Date(),
    })
    .where(eq(users.userId, params.userId));

  await db.insert(loyaltyTransactions).values({
    userId: params.userId,
    type: "credit_used",
    creditAmount: (-params.amount).toFixed(2),
    description: params.description.trim().slice(0, 255),
  });

  revalidatePath("/studio/customers");
  return { success: true };
}

// ─── Auto-earn points on bill creation ─────────────────────────

/**
 * Awards loyalty points automatically based on bill total.
 * Called internally after bill creation (not a user-facing action).
 */
export async function awardPointsForPurchase(params: {
  userId: string;
  billTotal: number;
  referenceId: string;
}) {
  const points = Math.floor((params.billTotal / 100) * POINTS_PER_100);
  if (points <= 0) return;

  await db
    .update(users)
    .set({
      loyaltyPoints: sql`${users.loyaltyPoints} + ${points}`,
      totalSpent: sql`${users.totalSpent} + ${params.billTotal.toFixed(2)}`,
      updatedAt: new Date(),
    })
    .where(eq(users.userId, params.userId));

  await db.insert(loyaltyTransactions).values({
    userId: params.userId,
    type: "earned",
    points,
    description: `Earned from purchase (₹${params.billTotal.toFixed(0)})`,
    referenceId: params.referenceId,
  });
}

// ─── Redeem points on bill ─────────────────────────────────────

/**
 * Redeems loyalty points as discount.
 * Returns the discount amount applied.
 */
export async function redeemLoyaltyPoints(params: {
  userId: string;
  points: number;
  referenceId: string;
}) {
  const [user] = await db
    .select({ loyaltyPoints: users.loyaltyPoints })
    .from(users)
    .where(eq(users.userId, params.userId))
    .limit(1);

  if (!user || user.loyaltyPoints < params.points) {
    throw new Error("Insufficient loyalty points");
  }

  const discountAmount = params.points * POINT_VALUE;

  await db
    .update(users)
    .set({
      loyaltyPoints: sql`${users.loyaltyPoints} - ${params.points}`,
      updatedAt: new Date(),
    })
    .where(eq(users.userId, params.userId));

  await db.insert(loyaltyTransactions).values({
    userId: params.userId,
    type: "redeemed",
    points: -params.points,
    creditAmount: (-discountAmount).toFixed(2),
    description: `Redeemed ${params.points} points for ₹${discountAmount.toFixed(0)} discount`,
    referenceId: params.referenceId,
  });

  return { discountAmount };
}

// ─── Use store credit on bill ──────────────────────────────────

export async function useStoreCredit(params: {
  userId: string;
  amount: number;
  referenceId: string;
}) {
  const [user] = await db
    .select({ creditBalance: users.creditBalance })
    .from(users)
    .where(eq(users.userId, params.userId))
    .limit(1);

  if (!user || Number(user.creditBalance) < params.amount) {
    throw new Error("Insufficient store credit");
  }

  await db
    .update(users)
    .set({
      creditBalance: sql`${users.creditBalance} - ${params.amount.toFixed(2)}`,
      updatedAt: new Date(),
    })
    .where(eq(users.userId, params.userId));

  await db.insert(loyaltyTransactions).values({
    userId: params.userId,
    type: "credit_used",
    creditAmount: (-params.amount).toFixed(2),
    description: `Store credit applied on bill`,
    referenceId: params.referenceId,
  });

  return { applied: params.amount };
}

// ─── Loyalty config (for client display) ─────────────────────

export async function getLoyaltyConfig() {
  return {
    pointsPer100: POINTS_PER_100,
    pointValue: POINT_VALUE,
  };
}
