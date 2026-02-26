"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCartStore } from "@/lib/stores/cart-store";
import { getAddresses } from "@/lib/actions/account.actions";
import {
  createOrder,
  confirmPayment,
  confirmCodOrder,
  validateCoupon,
  cancelPendingOrder,
} from "@/lib/actions/checkout.actions";
import { UpsellWidget } from "@/components/product/upsell-widget";
import { AddressSelector } from "@/components/checkout/address-selector";
import type { Address } from "@/components/checkout/address-selector";
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector";
import type { PaymentMethod } from "@/components/checkout/payment-method-selector";
import { CouponInput } from "@/components/checkout/coupon-input";
import { OrderSummary } from "@/components/checkout/order-summary";

// ── Razorpay type declaration ───────────────────────────────

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; contact: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// ── Orchestrator ─────────────────────────────────────────────

export function CheckoutContent({
  storeName = "LookKool",
  brandColor = "#470B49",
  deliveryConfig = { freeAbove: 999, standardCharge: 79 },
  codEnabled = true,
}: {
  storeName?: string;
  brandColor?: string;
  deliveryConfig?: { freeAbove: number | null; standardCharge: number };
  codEnabled?: boolean;
}) {
  const { items, total, savings, clearCart } = useCartStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{
    discount: number;
    description: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAddresses = useCallback(async () => {
    try {
      const data = await getAddresses();
      setAddresses(data);
      // Auto-select default
      const defaultAddr = data.find((a) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.addressId);
      } else if (data.length > 0) {
        setSelectedAddressId(data[0].addressId);
      }
    } catch {
      // Not authenticated — handled by middleware redirect
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Load Razorpay script
  useEffect(() => {
    if (typeof window !== "undefined" && !document.getElementById("razorpay-script")) {
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const cartTotal = total();
  const cartSavings = savings();
  const { freeAbove, standardCharge } = deliveryConfig;
  const shippingFree = freeAbove !== null && cartTotal >= freeAbove;
  const deliveryCharge = shippingFree ? 0 : standardCharge;
  const discount = couponApplied?.discount || 0;
  const grandTotal = cartTotal + deliveryCharge - discount;

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    // Build per-product line items for scope-based coupon validation
    const cartItems = items.map((i) => ({
      productId: i.productId,
      lineTotal: i.price * i.quantity,
    }));
    const result = await validateCoupon(couponCode.trim(), cartTotal, cartItems);
    if (result.error) {
      toast.error(result.error);
      setCouponApplied(null);
    } else {
      setCouponApplied({
        discount: result.discount!,
        description: result.description!,
      });
      toast.success(`Coupon applied: ${result.description}`);
    }
    setCouponLoading(false);
  }

  function removeCoupon() {
    setCouponCode("");
    setCouponApplied(null);
  }

  async function handlePlaceOrder() {
    if (!selectedAddressId) {
      toast.error("Please select a shipping address");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setPlacing(true);

    try {
      // Create order in DB
      const orderResult = await createOrder({
        addressId: selectedAddressId,
        items: items.map((i) => ({
          variantId: i.variantId,
          productId: i.productId,
          productName: i.productName,
          color: i.color,
          size: i.size,
          price: i.price,
          quantity: i.quantity,
        })),
        couponCode: couponApplied ? couponCode.trim() : undefined,
        paymentMethod,
      });

      if (orderResult.error) {
        toast.error(orderResult.error);
        setPlacing(false);
        return;
      }

      const orderId = orderResult.orderId!;

      if (paymentMethod === "cod") {
        // COD — mark order and redirect
        await confirmCodOrder(orderId);
        clearCart();
        window.location.href = `/checkout/order-success?orderId=${orderId}`;
        return;
      }

      // Razorpay — create Razorpay order
      const rpRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!rpRes.ok) {
        toast.error("Failed to initiate payment. Please try again.");
        setPlacing(false);
        return;
      }

      const rpOrder = await rpRes.json();
      const selectedAddr = addresses.find((a) => a.addressId === selectedAddressId)!;

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        name: storeName,
        description: `Order #${orderId}`,
        order_id: rpOrder.id,
        handler: async (response: RazorpayResponse) => {
          // Verify signature + confirm payment server-side in one step
          const result = await confirmPayment(
            orderId,
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature
          );

          if (result.error) {
            toast.error(result.error);
            setPlacing(false);
          } else {
            clearCart();
            // Hard redirect — router.push can fail inside Razorpay's callback context
            window.location.href = `/checkout/order-success?orderId=${orderId}`;
          }
        },
        prefill: {
          name: selectedAddr.fullName,
          contact: selectedAddr.phoneNumber,
        },
        theme: { color: brandColor },
        modal: {
          ondismiss: () => {
            // Cancel the pending order to restore stock
            cancelPendingOrder(orderId).catch(() => {});
            toast.error("Payment cancelled");
            setPlacing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Something went wrong. Please try again.");
      setPlacing(false);
    }
  }

  // ── Empty cart state ──────────────────────────────────────

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Your cart is empty</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add some items before checking out.
          </p>
        </div>
        <Button asChild>
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Main checkout ─────────────────────────────────────────

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left: Address + Payment */}
      <div className="lg:col-span-2 space-y-6">
        {/* Back to cart */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>

        {/* Step 1: Shipping Address */}
        <AddressSelector
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          onSelectAddress={setSelectedAddressId}
          showAddressForm={showAddressForm}
          onShowAddressForm={setShowAddressForm}
          onAddressSaved={loadAddresses}
        />

        {/* Step 2: Payment Method */}
        <PaymentMethodSelector
          paymentMethod={paymentMethod}
          onChangePaymentMethod={setPaymentMethod}
          codEnabled={codEnabled}
        />

        {/* Step 3: Coupon */}
        <CouponInput
          couponCode={couponCode}
          onCouponCodeChange={setCouponCode}
          couponApplied={couponApplied}
          couponLoading={couponLoading}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={removeCoupon}
        />

        {/* Upsell – "Customers Also Added" */}
        <UpsellWidget variant="checkout" deliveryConfig={deliveryConfig} />
      </div>

      {/* Right: Order Summary */}
      <OrderSummary
        items={items}
        cartTotal={cartTotal}
        cartSavings={cartSavings}
        discount={discount}
        shippingFree={shippingFree}
        standardCharge={standardCharge}
        grandTotal={grandTotal}
        paymentMethod={paymentMethod}
        placing={placing}
        selectedAddressId={selectedAddressId}
        onPlaceOrder={handlePlaceOrder}
      />
    </div>
  );
}
