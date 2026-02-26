"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  Tag,
  Truck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/stores/cart-store";
import { validateCartStock } from "@/lib/actions/checkout.actions";
import { toast } from "sonner";

export function CartContent({
  deliveryConfig = { freeAbove: 999, standardCharge: 79 },
}: {
  deliveryConfig?: { freeAbove: number | null; standardCharge: number };
}) {
  const { items, removeItem, updateQuantity, total, savings, clearCart } =
    useCartStore();

  // Stock validation state
  const [stockMap, setStockMap] = useState<Record<number, number>>({});
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);

  // Validate stock on mount and whenever items change
  const validate = useCallback(async () => {
    if (items.length === 0) {
      setValidated(true);
      return;
    }
    setValidating(true);
    try {
      const variantIds = items.map((i) => i.variantId);
      const result = await validateCartStock(variantIds);
      setStockMap(result);

      // Auto-fix: cap quantities to available stock, remove items with 0 stock
      let hadIssues = false;
      for (const item of items) {
        const available = result[item.variantId] ?? 0;
        if (available === 0) {
          removeItem(item.variantId);
          hadIssues = true;
        } else if (item.quantity > available) {
          updateQuantity(item.variantId, available);
          hadIssues = true;
        }
      }
      if (hadIssues) {
        toast.warning("Some items were adjusted due to stock changes", {
          description:
            "Quantities have been updated or out-of-stock items removed.",
        });
      }
    } catch {
      // Silently ignore — stock will be validated again at checkout
    }
    setValidating(false);
    setValidated(true);
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    validate();
  }, [validate]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Your cart is empty</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Looks like you haven&apos;t added anything yet.
          </p>
        </div>
        <Button asChild>
          <Link href="/">
            Start Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  const cartTotal = total();
  const cartSavings = savings();
  const { freeAbove, standardCharge } = deliveryConfig;
  const shippingFree = freeAbove !== null && cartTotal >= freeAbove;

  // Check if any item has stock issues (after validation)
  const hasStockIssues =
    validated &&
    items.some((item) => {
      const available = stockMap[item.variantId];
      return available !== undefined && (available === 0 || item.quantity > available);
    });

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Stock validation banner */}
      {validating && (
        <div className="lg:col-span-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking stock availability…
        </div>
      )}
      {hasStockIssues && (
        <div className="lg:col-span-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Some items have limited stock. Please review the highlighted items below.
        </div>
      )}

      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-4">
        {items.map((item) => {
          const liveStock = stockMap[item.variantId];
          const isOutOfStock = validated && liveStock !== undefined && liveStock === 0;
          const isLowStock =
            validated &&
            liveStock !== undefined &&
            liveStock > 0 &&
            liveStock <= 5;
          const overQuantity =
            validated &&
            liveStock !== undefined &&
            liveStock > 0 &&
            item.quantity > liveStock;

          return (
          <div
            key={item.variantId}
            className={`flex gap-4 rounded-xl border p-4 transition-all hover:shadow-sm ${
              isOutOfStock
                ? "border-red-300 bg-red-50/40 opacity-70"
                : overQuantity
                ? "border-amber-300 bg-amber-50/30"
                : ""
            }`}
          >
            {/* Image */}
            <Link
              href={`/products/${item.slug}`}
              className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-28 sm:w-24"
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.productName}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
                </div>
              )}
            </Link>

            {/* Details */}
            <div className="flex flex-1 flex-col justify-between min-w-0">
              <div>
                <Link
                  href={`/products/${item.slug}`}
                  className="text-sm font-medium leading-tight hover:text-primary transition-colors line-clamp-2"
                >
                  {item.productName}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {item.hexcode && (
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="inline-block h-3 w-3 rounded-full border"
                        style={{ backgroundColor: item.hexcode }}
                      />
                      {item.color}
                    </span>
                  )}
                  {!item.hexcode && item.color && (
                    <span>{item.color}</span>
                  )}
                  <span>Size: {item.size}</span>
                </div>

                {/* Stock warnings */}
                {isOutOfStock && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    Out of stock — please remove
                  </p>
                )}
                {overQuantity && liveStock !== undefined && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    Only {liveStock} left — reduce quantity
                  </p>
                )}
                {isLowStock && !overQuantity && liveStock !== undefined && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    Only {liveStock} left in stock
                  </p>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between">
                {/* Quantity */}
                <div className="flex items-center rounded-lg border">
                  <button
                    onClick={() =>
                      updateQuantity(item.variantId, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1 || isOutOfStock}
                    className="flex h-8 w-8 items-center justify-center hover:bg-accent transition disabled:opacity-40 rounded-l-lg"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="flex h-8 w-10 items-center justify-center border-x text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.variantId, item.quantity + 1)
                    }
                    disabled={
                      isOutOfStock ||
                      item.quantity >= (liveStock !== undefined ? liveStock : item.stock)
                    }
                    className="flex h-8 w-8 items-center justify-center hover:bg-accent transition disabled:opacity-40 rounded-r-lg"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Price & Remove */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                    {item.mrp > item.price && (
                      <p className="text-xs text-muted-foreground line-through">
                        ₹{(item.mrp * item.quantity).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          );
        })}

        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={clearCart}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Cart
          </Button>
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 rounded-xl border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} items)
              </span>
              <span>₹{cartTotal.toLocaleString("en-IN")}</span>
            </div>
            {cartSavings > 0 && (
              <div className="flex justify-between text-green-700">
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  You Save
                </span>
                <span>-₹{cartSavings.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Truck className="h-3.5 w-3.5" />
                Shipping
              </span>
              <span className={shippingFree ? "text-green-700 font-medium" : ""}>
                {shippingFree ? "FREE" : `₹${standardCharge.toLocaleString("en-IN")}`}
              </span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>
              ₹{(cartTotal + (shippingFree ? 0 : standardCharge)).toLocaleString("en-IN")}
            </span>
          </div>

          {cartSavings > 0 && (
            <p className="text-xs text-green-700 text-center font-medium">
              You&apos;re saving ₹{cartSavings.toLocaleString("en-IN")} on this order!
            </p>
          )}

          {!shippingFree && freeAbove !== null && cartTotal < freeAbove && (
            <p className="text-xs text-muted-foreground text-center">
              Add ₹{(freeAbove - cartTotal).toLocaleString("en-IN")} more for
              free shipping
            </p>
          )}

          <Button
            asChild={!hasStockIssues && !validating}
            size="lg"
            className="w-full h-12 text-base shadow-lg shadow-primary/25"
            disabled={hasStockIssues || validating}
          >
            {hasStockIssues || validating ? (
              <span className="flex items-center justify-center gap-2">
                {validating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Checking stock…
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5" />
                    Fix stock issues to continue
                  </>
                )}
              </span>
            ) : (
              <Link href="/checkout">
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
