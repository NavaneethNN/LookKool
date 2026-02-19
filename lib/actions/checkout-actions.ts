"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  orders,
  orderItems,
  userAddresses,
  productVariants,
  coupons,
  couponUsage,
  users,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendOrderConfirmation } from "@/lib/email/brevo";

// ─── Types ─────────────────────────────────────────────────────

interface CheckoutItem {
  variantId: number;
  productId: number;
  productName: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
}

interface CreateOrderInput {
  addressId: number;
  items: CheckoutItem[];
  couponCode?: string;
  paymentMethod: "razorpay" | "cod";
}

// ─── Helpers ───────────────────────────────────────────────────

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

// ─── Coupon validation ─────────────────────────────────────────

export async function validateCoupon(code: string, subtotal: number) {
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(
      and(
        eq(coupons.code, code.toUpperCase()),
        eq(coupons.isActive, true)
      )
    )
    .limit(1);

  if (!coupon) return { error: "Invalid coupon code" };

  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom)
    return { error: "Coupon is not yet active" };
  if (coupon.validTill && now > coupon.validTill)
    return { error: "Coupon has expired" };

  if (
    coupon.usageLimitTotal &&
    coupon.usageCount >= coupon.usageLimitTotal
  ) {
    return { error: "Coupon usage limit reached" };
  }

  const minPurchase = parseFloat(coupon.minPurchaseAmount);
  if (subtotal < minPurchase) {
    return {
      error: `Minimum purchase of ₹${minPurchase.toLocaleString("en-IN")} required`,
    };
  }

  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = (subtotal * parseFloat(coupon.discountValue)) / 100;
    if (coupon.maxDiscountAmount) {
      discount = Math.min(discount, parseFloat(coupon.maxDiscountAmount));
    }
  } else {
    discount = parseFloat(coupon.discountValue);
  }

  discount = Math.min(discount, subtotal); // Never more than subtotal

  return {
    valid: true,
    discount: Math.round(discount * 100) / 100,
    couponId: coupon.couponId,
    description: coupon.description || `${coupon.discountType === "percentage" ? coupon.discountValue + "%" : "₹" + coupon.discountValue} off`,
  };
}

// ─── Order creation ────────────────────────────────────────────

export async function createOrder(input: CreateOrderInput) {
  const user = await getAuthUser();
  const { addressId, items, couponCode, paymentMethod } = input;

  if (!items || items.length === 0) {
    return { error: "Cart is empty" };
  }

  // Fetch shipping address
  const [address] = await db
    .select()
    .from(userAddresses)
    .where(
      and(
        eq(userAddresses.addressId, addressId),
        eq(userAddresses.userId, user.id)
      )
    )
    .limit(1);

  if (!address) {
    return { error: "Invalid shipping address" };
  }

  // Validate stock for each item
  for (const item of items) {
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.variantId, item.variantId))
      .limit(1);

    if (!variant || variant.stockCount < item.quantity) {
      return {
        error: `"${item.productName}" (${item.color} / ${item.size}) is out of stock or has insufficient quantity`,
      };
    }
  }

  // Calculate totals
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingFree = subtotal >= 999;
  const deliveryCharge = shippingFree ? 0 : 79;
  let discountAmount = 0;
  let appliedCouponCode: string | null = null;

  // Apply coupon if provided
  if (couponCode) {
    const couponResult = await validateCoupon(couponCode, subtotal);
    if (couponResult.error) {
      return { error: couponResult.error };
    }
    discountAmount = couponResult.discount!;
    appliedCouponCode = couponCode.toUpperCase();
  }

  const totalAmount = subtotal + deliveryCharge - discountAmount;

  // Create order
  const [order] = await db
    .insert(orders)
    .values({
      userId: user.id,
      subtotal: subtotal.toFixed(2),
      deliveryCharge: deliveryCharge.toFixed(2),
      couponCode: appliedCouponCode,
      discountAmount: discountAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      status: "Pending",
      paymentStatus: paymentMethod === "cod" ? "Pending" : "Pending",
      paymentMethod,
      shippingName: address.fullName,
      shippingPhone: address.phoneNumber,
      shippingAddressLine1: address.addressLine1,
      shippingAddressLine2: address.addressLine2,
      shippingCity: address.city,
      shippingState: address.state,
      shippingPincode: address.pincode,
      shippingCountryCode: address.countryCode,
    })
    .returning({ orderId: orders.orderId });

  // Insert order items
  for (const item of items) {
    await db.insert(orderItems).values({
      orderId: order.orderId,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      pricePerUnit: item.price.toFixed(2),
      productName: item.productName,
      variantColor: item.color,
      variantSize: item.size,
    });

    // Decrement stock
    await db
      .update(productVariants)
      .set({
        stockCount: sql`${productVariants.stockCount} - ${item.quantity}`,
      })
      .where(eq(productVariants.variantId, item.variantId));
  }

  // Record coupon usage
  if (appliedCouponCode && discountAmount > 0) {
    const couponResult = await validateCoupon(appliedCouponCode, subtotal);
    if (couponResult.couponId) {
      await db.insert(couponUsage).values({
        couponId: couponResult.couponId,
        userId: user.id,
        orderId: order.orderId,
        discountAmountApplied: discountAmount.toFixed(2),
      });
      // Increment coupon usage count
      await db
        .update(coupons)
        .set({ usageCount: sql`${coupons.usageCount} + 1` })
        .where(eq(coupons.couponId, couponResult.couponId));
    }
  }

  revalidatePath("/account/orders");

  // Send order confirmation email (fire-and-forget)
  try {
    const [dbUser] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.userId, user.id))
      .limit(1);

    if (dbUser?.email) {
      sendOrderConfirmation({
        orderId: order.orderId,
        customerName: dbUser.name || address.fullName,
        customerEmail: dbUser.email,
        items: items.map((i) => ({
          productName: i.productName,
          color: i.color,
          size: i.size,
          quantity: i.quantity,
          price: i.price,
        })),
        subtotal,
        deliveryCharge,
        discountAmount,
        totalAmount,
        paymentMethod,
        shippingAddress: {
          name: address.fullName,
          line1: address.addressLine1,
          line2: address.addressLine2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
      }).catch((err) => console.error("Order email failed:", err));
    }
  } catch (emailErr) {
    console.error("Failed to send order email:", emailErr);
  }

  return { success: true, orderId: order.orderId, totalAmount };
}

// ─── Payment confirmation ──────────────────────────────────────

export async function confirmPayment(
  orderId: number,
  razorpayPaymentId: string,
  razorpayOrderId: string
) {
  const user = await getAuthUser();

  // Verify the order belongs to this user
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(eq(orders.orderId, orderId), eq(orders.userId, user.id))
    )
    .limit(1);

  if (!order) {
    return { error: "Order not found" };
  }

  await db
    .update(orders)
    .set({
      paymentStatus: "Completed",
      status: "Processing",
      razorpayPaymentId,
      razorpayOrderId,
      updatedAt: new Date(),
    })
    .where(eq(orders.orderId, orderId));

  revalidatePath("/account/orders");
  return { success: true };
}

// ─── Confirm COD order ─────────────────────────────────────────

export async function confirmCodOrder(orderId: number) {
  const user = await getAuthUser();

  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(eq(orders.orderId, orderId), eq(orders.userId, user.id))
    )
    .limit(1);

  if (!order) {
    return { error: "Order not found" };
  }

  await db
    .update(orders)
    .set({
      status: "Processing",
      updatedAt: new Date(),
    })
    .where(eq(orders.orderId, orderId));

  revalidatePath("/account/orders");
  return { success: true };
}

// ─── Get orders ────────────────────────────────────────────────

export async function getOrders() {
  const user = await getAuthUser();

  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, user.id),
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    with: {
      items: true,
    },
  });

  return userOrders;
}

export async function getOrderById(orderId: number) {
  const user = await getAuthUser();

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.orderId, orderId), eq(orders.userId, user.id)),
    with: {
      items: {
        with: {
          product: true,
          variant: {
            with: {
              images: true,
            },
          },
        },
      },
    },
  });

  return order || null;
}
