import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
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

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment parameters" },
        { status: 400 }
      );
    }

    // Validate parameter types
    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid payment parameters" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    // Timing-safe comparison
    const sigBuffer = Buffer.from(razorpay_signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    const isValid =
      sigBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // ─── Update order status after successful verification ──
    // Look up the order by razorpayOrderId (stored during create-order)
    const [order] = await db
      .select({ orderId: orders.orderId, paymentStatus: orders.paymentStatus })
      .from(orders)
      .where(
        and(
          eq(orders.razorpayOrderId, razorpay_order_id),
          eq(orders.userId, session.user.id)
        )
      )
      .limit(1);

    if (order && order.paymentStatus === "Pending") {
      // Atomic update: only transition from Pending to prevent double-processing
      await db
        .update(orders)
        .set({
          paymentStatus: "Completed",
          status: "Processing",
          razorpayPaymentId: razorpay_payment_id,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(orders.orderId, order.orderId),
            eq(orders.paymentStatus, "Pending")
          )
        );
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
