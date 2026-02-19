"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  CreditCard,
  Banknote,
  Tag,
  Truck,
  ShoppingBag,
  Loader2,
  ArrowLeft,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useCartStore } from "@/lib/stores/cart-store";
import { getAddresses } from "@/lib/actions/account-actions";
import {
  createOrder,
  confirmPayment,
  confirmCodOrder,
  validateCoupon,
} from "@/lib/actions/checkout-actions";
import { AddressForm } from "@/app/account/addresses/address-form";

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

// ── Types ───────────────────────────────────────────────────

interface Address {
  addressId: number;
  label: string | null;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  countryCode: string;
  isDefault: boolean;
}

export function CheckoutContent() {
  const router = useRouter();
  const { items, total, savings, clearCart } = useCartStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
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
  const shippingFree = cartTotal >= 999;
  const deliveryCharge = shippingFree ? 0 : 79;
  const discount = couponApplied?.discount || 0;
  const grandTotal = cartTotal + deliveryCharge - discount;

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const result = await validateCoupon(couponCode.trim(), cartTotal);
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
      const orderTotal = orderResult.totalAmount!;

      if (paymentMethod === "cod") {
        // COD — mark order and redirect
        await confirmCodOrder(orderId);
        clearCart();
        router.push(`/checkout/order-success?orderId=${orderId}`);
        return;
      }

      // Razorpay — create Razorpay order
      const rpRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: orderTotal, orderId }),
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
        name: "LookKool",
        description: `Order #${orderId}`,
        order_id: rpOrder.id,
        handler: async (response: RazorpayResponse) => {
          // Verify on server
          const verifyRes = await fetch("/api/razorpay/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });

          if (verifyRes.ok) {
            await confirmPayment(
              orderId,
              response.razorpay_payment_id,
              response.razorpay_order_id
            );
            clearCart();
            router.push(`/checkout/order-success?orderId=${orderId}`);
          } else {
            toast.error("Payment verification failed. Contact support.");
            setPlacing(false);
          }
        },
        prefill: {
          name: selectedAddr.fullName,
          contact: selectedAddr.phoneNumber,
        },
        theme: { color: "#470B49" },
        modal: {
          ondismiss: () => {
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {addresses.length === 0 && !showAddressForm ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">
                  No saved addresses. Add one to continue.
                </p>
                <Button size="sm" onClick={() => setShowAddressForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Address
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.addressId}
                      className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all ${
                        selectedAddressId === addr.addressId
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "hover:border-muted-foreground/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.addressId}
                        checked={selectedAddressId === addr.addressId}
                        onChange={() => setSelectedAddressId(addr.addressId)}
                        className="mt-0.5 h-4 w-4 accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{addr.fullName}</span>
                          {addr.label && (
                            <Badge variant="secondary" className="text-xs">
                              {addr.label}
                            </Badge>
                          )}
                          {addr.isDefault && (
                            <Badge className="text-xs">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {addr.addressLine1}
                          {addr.addressLine2 && `, ${addr.addressLine2}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {addr.phoneNumber}
                        </p>
                      </div>
                      {selectedAddressId === addr.addressId && (
                        <Check className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </label>
                  ))}
                </div>

                {!showAddressForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddressForm(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Address
                  </Button>
                )}
              </>
            )}

            {showAddressForm && (
              <AddressForm
                onClose={() => setShowAddressForm(false)}
                onSaved={() => {
                  setShowAddressForm(false);
                  loadAddresses();
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Step 2: Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label
              className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-all ${
                paymentMethod === "razorpay"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "hover:border-muted-foreground/30"
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="razorpay"
                checked={paymentMethod === "razorpay"}
                onChange={() => setPaymentMethod("razorpay")}
                className="h-4 w-4 accent-primary"
              />
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <span className="font-medium text-sm">Pay Online</span>
                <p className="text-xs text-muted-foreground">
                  UPI, Credit/Debit Card, Net Banking, Wallets
                </p>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-all ${
                paymentMethod === "cod"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "hover:border-muted-foreground/30"
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
                className="h-4 w-4 accent-primary"
              />
              <Banknote className="h-5 w-5 text-muted-foreground" />
              <div>
                <span className="font-medium text-sm">Cash on Delivery</span>
                <p className="text-xs text-muted-foreground">
                  Pay when you receive your order
                </p>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Step 3: Coupon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Tag className="h-5 w-5 text-primary" />
              Coupon Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            {couponApplied ? (
              <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {couponApplied.description}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    -₹{couponApplied.discount.toLocaleString("en-IN")}
                  </Badge>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-muted-foreground hover:text-destructive transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <Button
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                >
                  {couponLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: Order Summary */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 rounded-xl border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <Separator />

          {/* Item list */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div key={item.variantId} className="flex gap-3">
                <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-clamp-1">
                    {item.productName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.color} / {item.size} × {item.quantity}
                  </p>
                </div>
                <span className="text-xs font-semibold whitespace-nowrap">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} items)
              </span>
              <span>
                ₹{(cartTotal + cartSavings).toLocaleString("en-IN")}
              </span>
            </div>

            {cartSavings > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Product Discount</span>
                <span>-₹{cartSavings.toLocaleString("en-IN")}</span>
              </div>
            )}

            {discount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Coupon Discount</span>
                <span>-₹{discount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Truck className="h-3.5 w-3.5" />
                Shipping
              </span>
              <span
                className={shippingFree ? "text-green-700 font-medium" : ""}
              >
                {shippingFree ? "FREE" : "₹79"}
              </span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{grandTotal.toLocaleString("en-IN")}</span>
          </div>

          {/* Place Order */}
          <Button
            size="lg"
            className="w-full h-12 text-base shadow-lg shadow-primary/25"
            onClick={handlePlaceOrder}
            disabled={placing || !selectedAddressId}
          >
            {placing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : paymentMethod === "cod" ? (
              <>
                <Banknote className="mr-2 h-5 w-5" />
                Place Order (COD)
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Pay ₹{grandTotal.toLocaleString("en-IN")}
              </>
            )}
          </Button>

          {!selectedAddressId && (
            <p className="text-xs text-center text-amber-600 flex items-center justify-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Please select a shipping address
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
