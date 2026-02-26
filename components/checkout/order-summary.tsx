"use client";

import Image from "next/image";
import {
  CreditCard,
  Banknote,
  Truck,
  ShoppingBag,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CartItem } from "@/lib/stores/cart-store";
import type { PaymentMethod } from "@/components/checkout/payment-method-selector";

// ── Types ───────────────────────────────────────────────────

interface OrderSummaryProps {
  items: CartItem[];
  cartTotal: number;
  cartSavings: number;
  discount: number;
  shippingFree: boolean;
  standardCharge: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  placing: boolean;
  selectedAddressId: number | null;
  onPlaceOrder: () => void;
}

// ── Component ───────────────────────────────────────────────

export function OrderSummary({
  items,
  cartTotal,
  cartSavings,
  discount,
  shippingFree,
  standardCharge,
  grandTotal,
  paymentMethod,
  placing,
  selectedAddressId,
  onPlaceOrder,
}: OrderSummaryProps) {
  return (
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
              ₹{cartTotal.toLocaleString("en-IN")}
            </span>
          </div>

          {cartSavings > 0 && (
            <div className="flex justify-between text-green-700">
              <span>You Save</span>
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
              {shippingFree ? "FREE" : `₹${standardCharge.toLocaleString("en-IN")}`}
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
          onClick={onPlaceOrder}
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
  );
}
