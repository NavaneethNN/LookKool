"use server";

import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/db";
import { returnRequests, orders, orderItems, storeSettings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Helpers ───────────────────────────────────────────────────

async function getAuthUser() {
  const { userId } = await requireAuth();
  return { id: userId };
}

// ─── Submit return request ─────────────────────────────────────

export async function submitReturnRequest(formData: FormData) {
  const user = await getAuthUser();

  const rawOrderId = formData.get("orderId") as string;
  const rawOrderItemId = formData.get("orderItemId") as string;
  const reason = (formData.get("reason") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  // ─── Strict input validation ──────────────────────────────

  if (!rawOrderId || !rawOrderItemId || !reason) {
    return { error: "Order item and reason are required" };
  }

  const orderId = Number(rawOrderId);
  const orderItemId = Number(rawOrderItemId);

  if (!Number.isInteger(orderId) || orderId < 1) {
    return { error: "Invalid order" };
  }
  if (!Number.isInteger(orderItemId) || orderItemId < 1) {
    return { error: "Invalid order item" };
  }
  if (reason.length < 5 || reason.length > 500) {
    return { error: "Reason must be 5–500 characters" };
  }
  if (description && description.length > 2000) {
    return { error: "Description must not exceed 2000 characters" };
  }

  // Verify the order belongs to this user and is Delivered
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.orderId, orderId), eq(orders.userId, user.id)))
    .limit(1);

  if (!order) return { error: "Order not found" };
  if (order.status !== "Delivered") {
    return { error: "Returns can only be requested for delivered orders" };
  }

  // ─── Check if returns are accepted ──────────────────────
  const [policyRow] = await db
    .select({
      returnPolicy: storeSettings.returnPolicy,
      returnWindowDays: storeSettings.returnWindowDays,
    })
    .from(storeSettings)
    .limit(1);

  const returnPolicy = policyRow?.returnPolicy ?? "accept";
  const returnWindowDays = policyRow?.returnWindowDays ?? 7;

  if (returnPolicy === "no_returns") {
    return { error: "Returns are not accepted at this time" };
  }

  // ─── Return window check ─────────────────────────────────
  const deliveredAt = order.updatedAt || order.createdAt;
  if (deliveredAt) {
    const daysSinceDelivery = Math.floor(
      (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceDelivery > returnWindowDays) {
      return {
        error: `Return window has expired. Returns must be requested within ${returnWindowDays} days of delivery.`,
      };
    }
  }

  // Verify item belongs to this order
  const [item] = await db
    .select()
    .from(orderItems)
    .where(
      and(
        eq(orderItems.orderItemId, orderItemId),
        eq(orderItems.orderId, orderId)
      )
    )
    .limit(1);

  if (!item) return { error: "Order item not found" };

  // Check for existing return request on this item
  const [existing] = await db
    .select()
    .from(returnRequests)
    .where(
      and(
        eq(returnRequests.orderItemId, orderItemId),
        eq(returnRequests.userId, user.id)
      )
    )
    .limit(1);

  if (existing) {
    return { error: "A return request already exists for this item" };
  }

  const refundAmount = (parseFloat(item.pricePerUnit) * item.quantity).toFixed(2);

  await db.insert(returnRequests).values({
    orderId,
    orderItemId,
    userId: user.id,
    reason,
    description,
    refundAmount,
  });

  revalidatePath(`/account/orders/${orderId}`);
  return { success: true };
}

// ─── Get return requests for an order ──────────────────────────

export async function getReturnRequestsForOrder(orderId: number) {
  const user = await getAuthUser();

  if (!Number.isInteger(orderId) || orderId < 1) return [];

  const requests = await db
    .select()
    .from(returnRequests)
    .where(
      and(
        eq(returnRequests.orderId, orderId),
        eq(returnRequests.userId, user.id)
      )
    );

  return requests;
}

// ─── Get all return requests for user ──────────────────────────

export async function getMyReturnRequests() {
  const user = await getAuthUser();

  const requests = await db
    .select({
      returnId: returnRequests.returnId,
      orderId: returnRequests.orderId,
      orderItemId: returnRequests.orderItemId,
      reason: returnRequests.reason,
      status: returnRequests.status,
      refundAmount: returnRequests.refundAmount,
      createdAt: returnRequests.createdAt,
      // Snapshot data from order item
      productName: orderItems.productName,
      variantColor: orderItems.variantColor,
      variantSize: orderItems.variantSize,
    })
    .from(returnRequests)
    .innerJoin(orderItems, eq(returnRequests.orderItemId, orderItems.orderItemId))
    .where(eq(returnRequests.userId, user.id))
    .orderBy(returnRequests.createdAt);

  return requests;
}
