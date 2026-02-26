"use server";

import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/db";
import {
  orders,
  orderItems,
  userAddresses,
  productVariants,
  products,
  coupons,
  couponUsage,
  couponProducts,
  couponCategories,
  users,
  deliverySettings,
  storeSettings,
} from "@/db/schema";
import { eq, and, sql, asc, count, inArray } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { sendOrderConfirmation } from "@/lib/email";
import { createNotification, notifyAdmins } from "@/lib/actions/notification.actions";
import crypto from "crypto";

// ─── Types ─────────────────────────────────────────────────────

/**
 * Client-provided cart items — ONLY variantId + quantity are trusted.
 * All prices are re-fetched from the DB to prevent price manipulation.
 */
interface CheckoutItem {
  variantId: number;
  productId: number;
  productName: string;
  color: string;
  size: string;
  price: number; // Ignored in server — recalculated from DB
  quantity: number;
}

interface CreateOrderInput {
  addressId: number;
  items: CheckoutItem[];
  couponCode?: string;
  paymentMethod: "razorpay" | "cod";
}

// ─── Constants ─────────────────────────────────────────────────

const MAX_ITEMS_PER_ORDER = 50;
const MAX_QUANTITY_PER_ITEM = 10;
const MAX_COUPON_CODE_LENGTH = 100;
const MAX_COD_ORDER_AMOUNT = 25000; // ₹25,000 COD limit

// ─── Stock validation (used by cart page) ──────────────────────

/**
 * Takes an array of variant IDs from the cart and returns
 * the current stock count for each from the DB.
 */
export async function validateCartStock(
  variantIds: number[]
): Promise<Record<number, number>> {
  if (!Array.isArray(variantIds) || variantIds.length === 0) return {};

  // Sanitize: only accept positive integers, cap at 100 IDs
  const safeIds = variantIds
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, 100);

  if (safeIds.length === 0) return {};

  const rows = await db
    .select({
      variantId: productVariants.variantId,
      stockCount: productVariants.stockCount,
    })
    .from(productVariants)
    .where(
      sql`${productVariants.variantId} IN (${sql.join(
        safeIds.map((id) => sql`${id}`),
        sql`, `
      )})`
    );

  const map: Record<number, number> = {};
  for (const r of rows) {
    map[r.variantId] = r.stockCount;
  }
  // Variants not found → stock = 0
  for (const id of safeIds) {
    if (!(id in map)) map[id] = 0;
  }
  return map;
}

// ─── Delivery config ───────────────────────────────────────────

/**
 * Public summary of delivery rules — used by cart & checkout UI.
 */
export async function getPublicDeliveryConfig(): Promise<{
  freeAbove: number | null;
  standardCharge: number;
}> {
  const rules = await db
    .select()
    .from(deliverySettings)
    .where(eq(deliverySettings.isActive, true))
    .orderBy(asc(deliverySettings.settingId));

  const freeRule = rules.find((r) => r.isFreeDelivery);
  const paidRule = rules.find((r) => !r.isFreeDelivery);

  return {
    freeAbove: freeRule ? parseFloat(freeRule.minOrderAmount) : null,
    standardCharge: paidRule ? parseFloat(paidRule.deliveryCharge) : 79,
  };
}

/**
 * Compute delivery charge for a given subtotal and optional state code.
 */
async function computeDeliveryCharge(
  subtotal: number,
  stateCode?: string | null
): Promise<number> {
  const rules = await db
    .select()
    .from(deliverySettings)
    .where(eq(deliverySettings.isActive, true))
    .orderBy(asc(deliverySettings.settingId));

  for (const rule of rules) {
    const minAmount = parseFloat(rule.minOrderAmount);
    const stateMatches =
      !rule.stateCode || !stateCode || rule.stateCode === stateCode;

    if (subtotal >= minAmount && stateMatches) {
      return rule.isFreeDelivery ? 0 : parseFloat(rule.deliveryCharge);
    }
  }

  return 79;
}

// ─── Helpers ───────────────────────────────────────────────────

async function getAuthUser() {
  const { userId, email } = await requireAuth();
  return { id: userId, email };
}

// ─── Coupon validation (secured) ───────────────────────────────

/**
 * Validate a coupon code against the cart.
 * @param code       - coupon code
 * @param subtotal   - full cart subtotal
 * @param cartItems  - optional per-product line items for scope-based coupons
 *                     (each { productId, lineTotal } where lineTotal = price * qty)
 */
export async function validateCoupon(
  code: string,
  subtotal: number,
  cartItems?: { productId: number; lineTotal: number }[]
) {
  // Require authentication for coupon validation to prevent brute-force
  const user = await getAuthUser();

  // Input validation
  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return { error: "Please enter a coupon code" };
  }
  if (code.length > MAX_COUPON_CODE_LENGTH) {
    return { error: "Invalid coupon code" };
  }
  if (typeof subtotal !== "number" || !isFinite(subtotal) || subtotal < 0) {
    return { error: "Invalid cart total" };
  }

  const sanitizedCode = code.trim().toUpperCase();

  const [coupon] = await db
    .select()
    .from(coupons)
    .where(
      and(
        eq(coupons.code, sanitizedCode),
        eq(coupons.isActive, true)
      )
    )
    .limit(1);

  // Generic error to prevent coupon code enumeration
  if (!coupon) return { error: "This coupon code is invalid or has expired" };

  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom)
    return { error: "This coupon code is invalid or has expired" };
  if (coupon.validTill && now > coupon.validTill)
    return { error: "This coupon code is invalid or has expired" };

  // Check total usage limit
  if (
    coupon.usageLimitTotal &&
    coupon.usageCount >= coupon.usageLimitTotal
  ) {
    return { error: "This coupon code is invalid or has expired" };
  }

  // Check per-customer usage limit
  if (coupon.usageLimitPerCustomer) {
    const [usageRow] = await db
      .select({ usageCount: count() })
      .from(couponUsage)
      .where(
        and(
          eq(couponUsage.couponId, coupon.couponId),
          eq(couponUsage.userId, user.id)
        )
      );

    if (usageRow && usageRow.usageCount >= coupon.usageLimitPerCustomer) {
      return { error: "You have already used this coupon the maximum number of times" };
    }
  }

  const minPurchase = parseFloat(coupon.minPurchaseAmount);
  if (subtotal < minPurchase) {
    return {
      error: `Minimum purchase of ₹${minPurchase.toLocaleString("en-IN")} required`,
    };
  }

  // ─── Determine eligible subtotal based on coupon scope ────
  let eligibleSubtotal = subtotal;

  if (!coupon.appliesToAllProducts && cartItems && cartItems.length > 0) {
    // Fetch product IDs directly assigned to this coupon
    const scopeProductRows = await db
      .select({ productId: couponProducts.productId })
      .from(couponProducts)
      .where(eq(couponProducts.couponId, coupon.couponId));
    const scopeProductIds = new Set(scopeProductRows.map((r) => r.productId));

    // Fetch category IDs assigned to this coupon
    const scopeCategoryRows = await db
      .select({ categoryId: couponCategories.categoryId })
      .from(couponCategories)
      .where(eq(couponCategories.couponId, coupon.couponId));
    const scopeCategoryIds = scopeCategoryRows.map((r) => r.categoryId);

    // If coupon has category scope, find which cart products fall in those categories
    let categoryProductIds = new Set<number>();
    if (scopeCategoryIds.length > 0) {
      const cartProductIds = cartItems.map((i) => i.productId);
      if (cartProductIds.length > 0) {
        const matchingProducts = await db
          .select({ productId: products.productId })
          .from(products)
          .where(
            and(
              inArray(products.productId, cartProductIds),
              inArray(products.categoryId, scopeCategoryIds)
            )
          );
        categoryProductIds = new Set(matchingProducts.map((r) => r.productId));
      }
    }

    // Calculate eligible amount from items matching product or category scope
    eligibleSubtotal = cartItems.reduce((sum, item) => {
      if (scopeProductIds.has(item.productId) || categoryProductIds.has(item.productId)) {
        return sum + item.lineTotal;
      }
      return sum;
    }, 0);

    if (eligibleSubtotal <= 0) {
      return { error: "This coupon doesn't apply to any items in your cart" };
    }
  }

  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = (eligibleSubtotal * parseFloat(coupon.discountValue)) / 100;
    if (coupon.maxDiscountAmount) {
      discount = Math.min(discount, parseFloat(coupon.maxDiscountAmount));
    }
  } else {
    discount = parseFloat(coupon.discountValue);
  }

  // Never more than eligible subtotal, and ensure non-negative
  discount = Math.max(0, Math.min(discount, eligibleSubtotal));
  discount = Math.round(discount * 100) / 100;

  return {
    valid: true,
    discount,
    couponId: coupon.couponId,
    description: coupon.description || `${coupon.discountType === "percentage" ? coupon.discountValue + "%" : "₹" + coupon.discountValue} off`,
  };
}

// ─── Server-side price lookup ──────────────────────────────────

/**
 * Fetches the authoritative price for a variant from the database.
 * Priority: variant.price > (product.basePrice + variant.priceModifier)
 */
async function getServerPrice(variantId: number): Promise<{
  price: number;
  productId: number;
  productName: string;
  color: string;
  size: string;
  stockCount: number;
} | null> {
  const rows = await db
    .select({
      variantId: productVariants.variantId,
      productId: productVariants.productId,
      color: productVariants.color,
      size: productVariants.size,
      stockCount: productVariants.stockCount,
      variantPrice: productVariants.price,
      priceModifier: productVariants.priceModifier,
      productName: products.productName,
      basePrice: products.basePrice,
      isActive: products.isActive,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.productId))
    .where(eq(productVariants.variantId, variantId))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  if (!row.isActive) return null;

  // Variant-level price takes precedence; fall back to basePrice + priceModifier
  const price = row.variantPrice
    ? parseFloat(row.variantPrice)
    : parseFloat(row.basePrice) + parseFloat(row.priceModifier);

  return {
    price,
    productId: row.productId,
    productName: row.productName,
    color: row.color,
    size: row.size,
    stockCount: row.stockCount,
  };
}

// ─── Order creation (SECURED) ──────────────────────────────────

export async function createOrder(input: CreateOrderInput) {
  const user = await getAuthUser();
  const { addressId, items, couponCode, paymentMethod } = input;

  // ─── Input validation ─────────────────────────────────────
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { error: "Cart is empty" };
  }
  if (items.length > MAX_ITEMS_PER_ORDER) {
    return { error: `Maximum ${MAX_ITEMS_PER_ORDER} items per order` };
  }
  if (!Number.isInteger(addressId) || addressId < 1) {
    return { error: "Invalid shipping address" };
  }
  if (paymentMethod !== "razorpay" && paymentMethod !== "cod") {
    return { error: "Invalid payment method" };
  }

  // Validate every item's quantity
  for (const item of items) {
    if (!Number.isInteger(item.variantId) || item.variantId < 1) {
      return { error: "Invalid item in cart" };
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return { error: "Invalid quantity — must be at least 1" };
    }
    if (item.quantity > MAX_QUANTITY_PER_ITEM) {
      return { error: `Maximum ${MAX_QUANTITY_PER_ITEM} units per item` };
    }
  }

  // Check for duplicate variant IDs (prevent quantity-split attacks)
  const variantIds = items.map((i) => i.variantId);
  if (new Set(variantIds).size !== variantIds.length) {
    return { error: "Duplicate items detected — please refresh your cart" };
  }

  // ─── Fetch shipping address ───────────────────────────────
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

  // ─── Fetch authoritative prices from DB ───────────────────
  // CRITICAL: Never trust client-supplied prices.
  const verifiedItems: {
    variantId: number;
    productId: number;
    productName: string;
    color: string;
    size: string;
    price: number;
    quantity: number;
    stockCount: number;
  }[] = [];

  for (const item of items) {
    const serverData = await getServerPrice(item.variantId);

    if (!serverData) {
      return { error: `Product not found or no longer available` };
    }

    if (serverData.price <= 0) {
      return { error: `Invalid pricing for "${serverData.productName}" — please contact support` };
    }

    verifiedItems.push({
      variantId: item.variantId,
      productId: serverData.productId,
      productName: serverData.productName,
      color: serverData.color,
      size: serverData.size,
      price: serverData.price,
      quantity: item.quantity,
      stockCount: serverData.stockCount,
    });
  }

  // ─── Atomic stock check & decrement ───────────────────────
  // Use atomic UPDATE ... WHERE stock_count >= qty to prevent race conditions.
  // We decrement stock for ALL payment methods at order creation time,
  // and restore it if payment fails (for Razorpay) via a cleanup mechanism.
  const stockResults: { variantId: number; success: boolean; productName: string }[] = [];

  for (const item of verifiedItems) {
    // Atomic: only decrements if sufficient stock exists
    const result = await db
      .update(productVariants)
      .set({
        stockCount: sql`${productVariants.stockCount} - ${item.quantity}`,
      })
      .where(
        and(
          eq(productVariants.variantId, item.variantId),
          sql`${productVariants.stockCount} >= ${item.quantity}`
        )
      )
      .returning({ variantId: productVariants.variantId });

    stockResults.push({
      variantId: item.variantId,
      success: result.length > 0,
      productName: item.productName,
    });
  }

  // If any stock decrement failed, roll back the ones that succeeded
  const failedItems = stockResults.filter((r) => !r.success);
  if (failedItems.length > 0) {
    // Restore stock for items that were decremented
    const succeededItems = stockResults.filter((r) => r.success);
    for (const s of succeededItems) {
      const original = verifiedItems.find((v) => v.variantId === s.variantId)!;
      await db
        .update(productVariants)
        .set({
          stockCount: sql`${productVariants.stockCount} + ${original.quantity}`,
        })
        .where(eq(productVariants.variantId, s.variantId));
    }

    const failedName = failedItems[0].productName;
    return {
      error: `"${failedName}" is out of stock or has insufficient quantity. Please update your cart.`,
    };
  }

  // ─── Calculate totals (using DB prices) ───────────────────
  const subtotal = verifiedItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  const deliveryCharge = await computeDeliveryCharge(subtotal);
  let discountAmount = 0;
  let appliedCouponCode: string | null = null;
  let couponId: number | null = null;

  // Apply coupon if provided (single validation, capture couponId)
  if (couponCode) {
    // Build per-product line items for scope-based validation
    const couponCartItems = verifiedItems.map((v) => ({
      productId: v.productId,
      lineTotal: v.price * v.quantity,
    }));
    const couponResult = await validateCoupon(couponCode, subtotal, couponCartItems);
    if (couponResult.error) {
      // Roll back stock before returning error
      for (const item of verifiedItems) {
        await db
          .update(productVariants)
          .set({
            stockCount: sql`${productVariants.stockCount} + ${item.quantity}`,
          })
          .where(eq(productVariants.variantId, item.variantId));
      }
      return { error: couponResult.error };
    }
    discountAmount = couponResult.discount!;
    appliedCouponCode = couponCode.trim().toUpperCase();
    couponId = couponResult.couponId!;
  }

  const totalAmount = Math.max(0, subtotal + deliveryCharge - discountAmount);

  // ─── COD limit check ──────────────────────────────────────
  if (paymentMethod === "cod" && totalAmount > MAX_COD_ORDER_AMOUNT) {
    // Roll back stock
    for (const item of verifiedItems) {
      await db
        .update(productVariants)
        .set({
          stockCount: sql`${productVariants.stockCount} + ${item.quantity}`,
        })
        .where(eq(productVariants.variantId, item.variantId));
    }
    return {
      error: `Cash on Delivery is available for orders up to ₹${MAX_COD_ORDER_AMOUNT.toLocaleString("en-IN")}. Please use online payment.`,
    };
  }

  // ─── Create order ─────────────────────────────────────────
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
      paymentStatus: "Pending",
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

  // ─── Insert order items (with DB-verified prices) ─────────
  for (const item of verifiedItems) {
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
  }

  // ─── Record coupon usage (single atomic operation) ────────
  if (couponId && discountAmount > 0) {
    await db.insert(couponUsage).values({
      couponId,
      userId: user.id,
      orderId: order.orderId,
      discountAmountApplied: discountAmount.toFixed(2),
    });
    // Atomic increment
    await db
      .update(coupons)
      .set({ usageCount: sql`${coupons.usageCount} + 1` })
      .where(eq(coupons.couponId, couponId));
  }

  revalidatePath("/account/orders");
  revalidateTag("products");

  // ─── Send order confirmation email (non-blocking) ─────────
  try {
    const [dbUser] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (dbUser?.email) {
      sendOrderConfirmation({
        orderId: order.orderId,
        customerName: dbUser.name || address.fullName,
        customerEmail: dbUser.email,
        items: verifiedItems.map((i) => ({
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
      }).catch((err) => console.error("[Order Email] Failed:", err));
    }
  } catch (emailErr) {
    console.error("[Order Email] Error:", emailErr);
  }

  // ─── In-app notifications (non-blocking) ─────────────────
  createNotification({
    userId: user.id,
    type: "order",
    title: `Order #${order.orderId} Placed`,
    message: `Your order of ₹${totalAmount.toFixed(0)} has been placed successfully!`,
    data: { orderId: order.orderId, totalAmount },
  }).catch(() => {});

  notifyAdmins({
    type: "order",
    title: `New Order #${order.orderId}`,
    message: `${address.fullName} placed an order for ₹${totalAmount.toFixed(0)} (${paymentMethod.toUpperCase()})`,
    data: { orderId: order.orderId, totalAmount, paymentMethod },
  }).catch(() => {});

  return { success: true, orderId: order.orderId, totalAmount };
}

// ─── Payment confirmation (SECURED) ────────────────────────────

/**
 * Confirms a Razorpay payment. Now requires the Razorpay signature and
 * performs server-side verification before marking the order as paid.
 */
export async function confirmPayment(
  orderId: number,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string
) {
  const user = await getAuthUser();

  // ─── Input validation ─────────────────────────────────────
  if (!Number.isInteger(orderId) || orderId < 1) {
    return { error: "Invalid order" };
  }
  if (!razorpayPaymentId || typeof razorpayPaymentId !== "string") {
    return { error: "Invalid payment reference" };
  }
  if (!razorpayOrderId || typeof razorpayOrderId !== "string") {
    return { error: "Invalid payment reference" };
  }
  if (!razorpaySignature || typeof razorpaySignature !== "string") {
    return { error: "Invalid payment signature" };
  }

  // ─── Verify Razorpay signature server-side ────────────────
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    console.error("[Payment] RAZORPAY_KEY_SECRET not configured");
    return { error: "Payment gateway not configured. Contact support." };
  }

  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  // Timing-safe comparison to prevent timing attacks
  const sigBuffer = Buffer.from(razorpaySignature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    console.warn(`[Payment] Invalid signature for order ${orderId}`);
    return { error: "Payment verification failed. Contact support." };
  }

  // ─── Fetch and validate order ─────────────────────────────
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

  // Guard against double-confirmation
  if (order.paymentStatus === "Completed") {
    return { success: true };
  }

  // Only pending orders can be confirmed
  if (order.paymentStatus !== "Pending") {
    return { error: "Order cannot be confirmed in its current state" };
  }

  // Only Razorpay orders can use this flow
  if (order.paymentMethod !== "razorpay") {
    return { error: "Invalid payment method for this order" };
  }

  // ─── Mark order as paid ───────────────────────────────────
  // Stock was already decremented atomically during createOrder,
  // so we don't need to touch stock here.
  await db
    .update(orders)
    .set({
      paymentStatus: "Completed",
      status: "Processing",
      razorpayPaymentId,
      razorpayOrderId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(orders.orderId, orderId),
        eq(orders.paymentStatus, "Pending") // Double-check to prevent race
      )
    );

  revalidatePath("/account/orders");
  return { success: true };
}

// ─── Confirm COD order (SECURED) ───────────────────────────────

export async function confirmCodOrder(orderId: number) {
  const user = await getAuthUser();

  if (!Number.isInteger(orderId) || orderId < 1) {
    return { error: "Invalid order" };
  }

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

  // Only Pending orders can be confirmed
  if (order.status !== "Pending") {
    return { error: "Order cannot be confirmed in its current state" };
  }

  // Only COD orders use this flow
  if (order.paymentMethod !== "cod") {
    return { error: "Invalid confirmation method for this order" };
  }

  await db
    .update(orders)
    .set({
      status: "Processing",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(orders.orderId, orderId),
        eq(orders.status, "Pending") // Atomic guard against race
      )
    );

  revalidatePath("/account/orders");
  return { success: true };
}

// ─── Restore stock for failed/expired Razorpay payments ────────

/**
 * Called when a Razorpay payment window is dismissed or fails.
 * Restores stock for the order if it's still in Pending state.
 */
export async function cancelPendingOrder(orderId: number) {
  const user = await getAuthUser();

  if (!Number.isInteger(orderId) || orderId < 1) {
    return { error: "Invalid order" };
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.orderId, orderId),
        eq(orders.userId, user.id),
        eq(orders.paymentStatus, "Pending"),
        eq(orders.paymentMethod, "razorpay")
      )
    )
    .limit(1);

  if (!order) {
    return { error: "Order not found or already processed" };
  }

  // Restore stock
  const items = await db
    .select({
      variantId: orderItems.variantId,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  for (const item of items) {
    await db
      .update(productVariants)
      .set({
        stockCount: sql`${productVariants.stockCount} + ${item.quantity}`,
      })
      .where(eq(productVariants.variantId, item.variantId));
  }

  // Mark order as cancelled
  await db
    .update(orders)
    .set({
      status: "Cancelled",
      paymentStatus: "Failed",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(orders.orderId, orderId),
        eq(orders.paymentStatus, "Pending") // Atomic guard
      )
    );

  // Reverse coupon usage if a coupon was applied
  if (order.couponCode) {
    const [usage] = await db
      .select({ usageId: couponUsage.usageId, couponId: couponUsage.couponId })
      .from(couponUsage)
      .where(eq(couponUsage.orderId, orderId))
      .limit(1);

    if (usage) {
      await db.delete(couponUsage).where(eq(couponUsage.usageId, usage.usageId));
      await db
        .update(coupons)
        .set({ usageCount: sql`GREATEST(${coupons.usageCount} - 1, 0)` })
        .where(eq(coupons.couponId, usage.couponId));
    }
  }

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

  if (!Number.isInteger(orderId) || orderId < 1) return null;

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

// ─── Cancel confirmed order (customer-initiated) ──────────────

/**
 * Customer cancels an order based on the store's cancellation policy.
 * - "anytime" → can cancel unless Delivered/Cancelled/Refunded
 * - "before_shipment" → can cancel only if Pending/Processing/Packed
 * - "no_cancellation" → not allowed
 * Also triggers Razorpay refund for online-paid orders.
 */
export async function cancelConfirmedOrder(orderId: number) {
  const user = await getAuthUser();

  if (!Number.isInteger(orderId) || orderId < 1) {
    return { error: "Invalid order" };
  }

  // Get store cancellation policy
  const [policyRow] = await db
    .select({
      cancellationPolicy: storeSettings.cancellationPolicy,
    })
    .from(storeSettings)
    .limit(1);

  const policy = policyRow?.cancellationPolicy ?? "before_shipment";

  if (policy === "no_cancellation") {
    return { error: "Order cancellations are not allowed" };
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.orderId, orderId),
        eq(orders.userId, user.id),
      )
    )
    .limit(1);

  if (!order) return { error: "Order not found" };

  const terminalStatuses = ["Delivered", "Cancelled", "Refunded"];
  if (terminalStatuses.includes(order.status)) {
    return { error: "This order cannot be cancelled" };
  }

  if (policy === "before_shipment" && order.status === "Shipped") {
    return { error: "Cannot cancel an order that has already been shipped" };
  }

  // Restore stock
  const items = await db
    .select({
      variantId: orderItems.variantId,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  for (const item of items) {
    await db
      .update(productVariants)
      .set({
        stockCount: sql`${productVariants.stockCount} + ${item.quantity}`,
      })
      .where(eq(productVariants.variantId, item.variantId));
  }

  // Mark order as cancelled
  await db
    .update(orders)
    .set({
      status: "Cancelled",
      updatedAt: new Date(),
    })
    .where(eq(orders.orderId, orderId));

  // Auto-refund via Razorpay for online-paid orders
  if (
    order.paymentMethod === "razorpay" &&
    order.paymentStatus === "Completed" &&
    order.razorpayPaymentId
  ) {
    try {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (keyId && keySecret) {
        const refundRes = await fetch(
          `https://api.razorpay.com/v1/payments/${order.razorpayPaymentId}/refund`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
            },
            body: JSON.stringify({
              amount: Math.round(parseFloat(order.totalAmount) * 100),
              notes: { orderId: String(orderId), reason: "Customer cancellation" },
            }),
          }
        );
        if (refundRes.ok) {
          await db
            .update(orders)
            .set({ paymentStatus: "Refunded", updatedAt: new Date() })
            .where(eq(orders.orderId, orderId));
        }
      }
    } catch (err) {
      console.error("Auto-refund on cancellation failed:", err);
    }
  }

  // Update COD order payment status
  if (order.paymentMethod === "cod") {
    await db
      .update(orders)
      .set({ paymentStatus: "Failed", updatedAt: new Date() })
      .where(eq(orders.orderId, orderId));
  }

  // Reverse coupon usage if a coupon was applied
  if (order.couponCode) {
    const [usage] = await db
      .select({ usageId: couponUsage.usageId, couponId: couponUsage.couponId })
      .from(couponUsage)
      .where(eq(couponUsage.orderId, orderId))
      .limit(1);

    if (usage) {
      await db.delete(couponUsage).where(eq(couponUsage.usageId, usage.usageId));
      await db
        .update(coupons)
        .set({ usageCount: sql`GREATEST(${coupons.usageCount} - 1, 0)` })
        .where(eq(coupons.couponId, usage.couponId));
    }
  }

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  return { success: true };
}
