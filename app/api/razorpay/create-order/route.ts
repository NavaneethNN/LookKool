import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // ─── Authentication check ──────────────────────────────
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay keys missing from environment");
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    const { orderId } = await request.json();

    // ─── Validate orderId ──────────────────────────────────
    if (!orderId || !Number.isInteger(orderId) || orderId < 1) {
      return NextResponse.json(
        { error: "Invalid order ID" },
        { status: 400 }
      );
    }

    // ─── Fetch order from DB — NEVER trust client amount ───
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.orderId, orderId),
          eq(orders.userId, session.user.id),
          eq(orders.paymentStatus, "Pending"),
          eq(orders.paymentMethod, "razorpay")
        )
      )
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or already processed" },
        { status: 404 }
      );
    }

    const amount = parseFloat(order.totalAmount);
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid order amount" },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: "INR",
      receipt: `order_${orderId}`,
      notes: {
        orderId: String(orderId),
      },
    });

    // Store Razorpay order ID on our DB order for verification lookup
    await db
      .update(orders)
      .set({ razorpayOrderId: razorpayOrder.id, updatedAt: new Date() })
      .where(eq(orders.orderId, orderId));

    return NextResponse.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
