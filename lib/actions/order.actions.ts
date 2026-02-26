"use server";

import { db } from "@/db";
import {
  users,
  productImages,
  orders,
  returnRequests,
  newsletter,
  storeSettings,
} from "@/db/schema";
import { eq, desc, sql, count, and, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { sendShippingUpdate, sendReturnStatusEmail } from "@/lib/email/brevo";
import { createNotification } from "@/lib/actions/notification.actions";
import { escapeIlike } from "./_helpers";
import { getPolicySettings } from "./settings.actions";

// ── Valid enum values (runtime validation whitelists) ────────
const VALID_ORDER_STATUSES = ["Pending", "Processing", "Packed", "Shipped", "Delivered", "Cancelled", "Refunded"] as const;
const VALID_PAYMENT_STATUSES = ["Pending", "Completed", "Failed", "Refunded"] as const;
const VALID_RETURN_STATUSES = ["Pending", "Approved", "Rejected", "Refunded"] as const;

// ═══════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════

export async function getAdminOrders(params?: {
  status?: string;
  page?: number;
  search?: string;
}) {
  await requireAdmin();

  const page = params?.page ?? 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params?.status && params.status !== "all") {
    if (!VALID_ORDER_STATUSES.includes(params.status as typeof VALID_ORDER_STATUSES[number])) {
      throw new Error("Invalid order status filter");
    }
    conditions.push(eq(orders.status, params.status as typeof orders.status.enumValues[number]));
  }
  if (params?.search) {
    const escaped = escapeIlike(params.search);
    conditions.push(
      or(
        ilike(orders.shippingName, `%${escaped}%`),
        sql`CAST(${orders.orderId} AS TEXT) ILIKE ${`%${escaped}%`}`
      )
    );
  }

  const allOrders = await db.query.orders.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(orders.orderDate)],
    limit,
    offset,
    with: {
      user: { columns: { name: true, email: true } },
      items: { columns: { orderItemId: true } },
    },
  });

  const [totalResult] = await db
    .select({ count: count() })
    .from(orders)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    orders: allOrders,
    total: totalResult?.count ?? 0,
    page,
    totalPages: Math.ceil((totalResult?.count ?? 0) / limit),
  };
}

export async function getAdminOrderDetail(orderId: number) {
  await requireAdmin();

  const order = await db.query.orders.findFirst({
    where: eq(orders.orderId, orderId),
    with: {
      user: {
        columns: { userId: true, name: true, email: true, phoneNumber: true },
      },
      items: {
        with: {
          product: { columns: { productId: true, slug: true } },
          variant: {
            columns: { variantId: true, sku: true },
            with: { images: { where: eq(productImages.isPrimary, true), limit: 1 } },
          },
        },
      },
      returns: true,
    },
  });

  return order;
}

export async function updateOrderStatus(orderId: number, status: string) {
  await requireAdmin();

  if (!VALID_ORDER_STATUSES.includes(status as typeof VALID_ORDER_STATUSES[number])) {
    throw new Error("Invalid order status");
  }

  await db
    .update(orders)
    .set({
      status: status as typeof orders.status.enumValues[number],
      updatedAt: new Date(),
    })
    .where(eq(orders.orderId, orderId));

  // Send shipping/status email for relevant statuses
  const emailStatuses = ["Shipped", "Out for Delivery", "Delivered", "Cancelled"];
  if (emailStatuses.includes(status)) {
    try {
      const [order] = await db
        .select({
          userId: orders.userId,
          trackingNumber: orders.trackingNumber,
        })
        .from(orders)
        .where(eq(orders.orderId, orderId))
        .limit(1);

      if (order) {
        const [dbUser] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.userId, order.userId))
          .limit(1);

        if (dbUser?.email) {
          sendShippingUpdate({
            customerName: dbUser.name,
            customerEmail: dbUser.email,
            orderId,
            status,
            trackingNumber: order.trackingNumber,
          }).catch((err) => console.error("Shipping email failed:", err));
        }

        // Create in-app notification for the customer
        const statusMessages: Record<string, string> = {
          Shipped: "Your order has been shipped!",
          "Out for Delivery": "Your order is out for delivery today!",
          Delivered: "Your order has been delivered. Enjoy!",
          Cancelled: "Your order has been cancelled.",
        };
        createNotification({
          userId: order.userId,
          type: "order",
          title: `Order #${orderId} ${status}`,
          message: statusMessages[status] || `Order status updated to ${status}`,
          data: { orderId, status },
        }).catch((err) => console.error("Notification creation failed:", err));
      }
    } catch (err) {
      console.error("Failed to send status email:", err);
    }
  }

  revalidatePath("/studio/orders");
  revalidatePath(`/studio/orders/${orderId}`);
  return { success: true };
}

export async function updatePaymentStatus(orderId: number, status: string) {
  await requireAdmin();

  if (!VALID_PAYMENT_STATUSES.includes(status as typeof VALID_PAYMENT_STATUSES[number])) {
    throw new Error("Invalid payment status");
  }

  await db
    .update(orders)
    .set({
      paymentStatus: status as typeof orders.paymentStatus.enumValues[number],
      updatedAt: new Date(),
    })
    .where(eq(orders.orderId, orderId));

  revalidatePath("/studio/orders");
  revalidatePath(`/studio/orders/${orderId}`);
  return { success: true };
}

export async function updateTrackingNumber(orderId: number, trackingNumber: string) {
  await requireAdmin();

  await db
    .update(orders)
    .set({
      trackingNumber,
      updatedAt: new Date(),
    })
    .where(eq(orders.orderId, orderId));

  revalidatePath(`/studio/orders/${orderId}`);
  return { success: true };
}

export async function updateOrderNotes(orderId: number, notes: string) {
  await requireAdmin();

  await db
    .update(orders)
    .set({
      notes,
      updatedAt: new Date(),
    })
    .where(eq(orders.orderId, orderId));

  revalidatePath(`/studio/orders/${orderId}`);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// RETURNS
// ═══════════════════════════════════════════════════════════════

export async function getAdminReturns(params?: {
  status?: string;
  page?: number;
}) {
  await requireAdmin();

  const page = params?.page ?? 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params?.status && params.status !== "all") {
    if (!VALID_RETURN_STATUSES.includes(params.status as typeof VALID_RETURN_STATUSES[number])) {
      throw new Error("Invalid return status filter");
    }
    conditions.push(eq(returnRequests.status, params.status as typeof returnRequests.status.enumValues[number]));
  }

  const allReturns = await db.query.returnRequests.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(returnRequests.createdAt)],
    limit,
    offset,
    with: {
      order: { columns: { orderId: true, totalAmount: true } },
      orderItem: {
        columns: { productName: true, variantColor: true, variantSize: true, pricePerUnit: true, quantity: true },
      },
      user: { columns: { name: true, email: true } },
    },
  });

  const [totalResult] = await db
    .select({ count: count() })
    .from(returnRequests)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    returns: allReturns,
    total: totalResult?.count ?? 0,
    page,
    totalPages: Math.ceil((totalResult?.count ?? 0) / limit),
  };
}

export async function resolveReturn(
  returnId: number,
  status: string,
  adminNotes?: string,
) {
  await requireAdmin();

  if (!VALID_RETURN_STATUSES.includes(status as typeof VALID_RETURN_STATUSES[number])) {
    throw new Error("Invalid return status");
  }

  await db
    .update(returnRequests)
    .set({
      status: status as typeof returnRequests.status.enumValues[number],
      adminNotes: adminNotes || null,
      updatedAt: new Date(),
    })
    .where(eq(returnRequests.returnId, returnId));

  // ── Auto-refund via Razorpay when marking as "Refunded" ───
  let refundResult: { success: boolean; refundId?: string; reason?: string } | null = null;
  if (status === "Refunded") {
    try {
      const policySettings = await getPolicySettings();
      if (policySettings.autoRefundEnabled) {
        const returnReqForRefund = await db.query.returnRequests.findFirst({
          where: eq(returnRequests.returnId, returnId),
          columns: { orderId: true, refundAmount: true },
        });
        if (returnReqForRefund?.refundAmount) {
          refundResult = await processRazorpayRefund(
            returnReqForRefund.orderId,
            parseFloat(returnReqForRefund.refundAmount),
            returnId,
          );
        }
      }
    } catch (err) {
      console.error("Auto-refund failed:", err);
      refundResult = { success: false, reason: String(err) };
    }
  }

  // Send return status email
  try {
    const returnReq = await db.query.returnRequests.findFirst({
      where: eq(returnRequests.returnId, returnId),
      columns: { userId: true, orderId: true },
    });

    if (returnReq) {
      const [dbUser] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.userId, returnReq.userId))
        .limit(1);

      if (dbUser?.email) {
        sendReturnStatusEmail({
          customerName: dbUser.name,
          customerEmail: dbUser.email,
          orderId: returnReq.orderId,
          returnStatus: status,
          adminNotes: adminNotes,
        }).catch((err) => console.error("Return email failed:", err));
      }

      // Create in-app notification for the customer
      createNotification({
        userId: returnReq.userId,
        type: "order",
        title: `Return Request ${status}`,
        message: `Your return request for order #${returnReq.orderId} has been ${status.toLowerCase()}.`,
        data: { orderId: returnReq.orderId, returnId, status },
      }).catch((err) => console.error("Notification creation failed:", err));
    }
  } catch (err) {
    console.error("Failed to send return email:", err);
  }

  revalidatePath("/studio/returns");
  return { success: true, refundResult };
}

// ═══════════════════════════════════════════════════════════════
// NEWSLETTER
// ═══════════════════════════════════════════════════════════════

export async function getNewsletterSubscribers() {
  await requireAdmin();

  return db
    .select()
    .from(newsletter)
    .where(eq(newsletter.isSubscribed, true))
    .orderBy(desc(newsletter.subscribedAt));
}

// ═══════════════════════════════════════════════════════════════
// RAZORPAY REFUND
// ═══════════════════════════════════════════════════════════════

/**
 * Process refund through Razorpay for an online-paid order.
 * Called when admin marks a return as "Refunded" (if auto-refund enabled)
 * or when admin cancels an order that was paid via Razorpay.
 */
export async function processRazorpayRefund(
  orderId: number,
  amount: number,
  returnId?: number,
) {
  await requireAdmin();

  // Get the order to find the Razorpay payment ID
  const [order] = await db
    .select({
      razorpayPaymentId: orders.razorpayPaymentId,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
    })
    .from(orders)
    .where(eq(orders.orderId, orderId))
    .limit(1);

  if (!order) throw new Error("Order not found");
  if (order.paymentMethod !== "razorpay") {
    return { success: false, reason: "Not a Razorpay payment — manual refund needed" };
  }
  if (!order.razorpayPaymentId) {
    return { success: false, reason: "No Razorpay payment ID on record" };
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured");
  }

  // Call Razorpay Refund API
  const refundRes = await fetch(
    `https://api.razorpay.com/v1/payments/${order.razorpayPaymentId}/refund`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to paise
        notes: {
          orderId: String(orderId),
          returnId: returnId ? String(returnId) : undefined,
          reason: returnId ? "Return approved" : "Order cancellation",
        },
      }),
    }
  );

  if (!refundRes.ok) {
    const err = await refundRes.json().catch(() => ({}));
    console.error("Razorpay refund failed:", err);
    return {
      success: false,
      reason: err?.error?.description || "Razorpay refund API failed",
    };
  }

  const refund = await refundRes.json();

  // Store refund ID on the return request if applicable
  if (returnId) {
    await db
      .update(returnRequests)
      .set({ razorpayRefundId: refund.id, updatedAt: new Date() })
      .where(eq(returnRequests.returnId, returnId));
  }

  // Update order payment status
  await db
    .update(orders)
    .set({ paymentStatus: "Refunded", updatedAt: new Date() })
    .where(eq(orders.orderId, orderId));

  return { success: true, refundId: refund.id };
}

// ═══════════════════════════════════════════════════════════════
// ORDER INVOICE
// ═══════════════════════════════════════════════════════════════

// Get invoice data for online orders (for PDF generation)
export async function getOrderInvoiceData(orderId: number) {
  await requireAdmin();

  const order = await db.query.orders.findFirst({
    where: eq(orders.orderId, orderId),
    with: {
      user: {
        columns: { name: true, email: true, phoneNumber: true },
      },
      items: {
        with: {
          variant: {
            columns: { sku: true },
          },
        },
      },
    },
  });

  const [settings] = await db.select().from(storeSettings).limit(1);

  return { order, storeSettings: settings ?? null };
}
