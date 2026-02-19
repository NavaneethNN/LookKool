"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { returnRequests, orders, orderItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Helpers ───────────────────────────────────────────────────

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

// ─── Submit return request ─────────────────────────────────────

export async function submitReturnRequest(formData: FormData) {
  const user = await getAuthUser();

  const orderId = parseInt(formData.get("orderId") as string);
  const orderItemId = parseInt(formData.get("orderItemId") as string);
  const reason = (formData.get("reason") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!orderId || !orderItemId || !reason) {
    return { error: "Order item and reason are required" };
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
