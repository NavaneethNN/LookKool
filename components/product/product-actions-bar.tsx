"use client";

import {
  Heart,
  ShoppingBag,
  Truck,
  RotateCcw,
  ShieldCheck,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────

interface ProductActionsBarProps {
  /** Currently selected variant (null if no size selected) */
  selectedVariant: {
    stockCount: number;
  } | null;
  isOutOfStock: boolean;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
  onWishlistToggle: () => void;
  wishlisted: boolean;
}

// ── Component ────────────────────────────────────────────────

export function ProductActionsBar({
  selectedVariant,
  isOutOfStock,
  quantity,
  onQuantityChange,
  onAddToCart,
  onWishlistToggle,
  wishlisted,
}: ProductActionsBarProps) {
  return (
    <>
      {/* Quantity */}
      {selectedVariant && !isOutOfStock && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Quantity</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border">
              <button
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center hover:bg-accent transition rounded-l-lg"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex h-10 w-12 items-center justify-center border-x text-sm font-medium">
                {quantity}
              </span>
              <button
                onClick={() =>
                  onQuantityChange(
                    Math.min(selectedVariant.stockCount, quantity + 1)
                  )
                }
                className="flex h-10 w-10 items-center justify-center hover:bg-accent transition rounded-r-lg"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {selectedVariant.stockCount <= 5 && (
              <span className="text-xs text-orange-600 font-medium">
                Only {selectedVariant.stockCount} left!
              </span>
            )}
          </div>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          size="lg"
          className="flex-1 h-12 text-base shadow-lg shadow-primary/25"
          onClick={onAddToCart}
          disabled={!selectedVariant || isOutOfStock}
        >
          <ShoppingBag className="mr-2 h-5 w-5" />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-12 w-12 shrink-0"
          onClick={onWishlistToggle}
        >
          <Heart
            className={cn(
              "h-5 w-5",
              wishlisted && "fill-primary text-primary"
            )}
          />
        </Button>
      </div>

      {/* Trust Strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Truck, text: "Free Shipping" },
          { icon: RotateCcw, text: "Easy Returns" },
          { icon: ShieldCheck, text: "Secure Payment" },
        ].map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex flex-col items-center gap-1.5 rounded-xl border bg-muted/30 p-3 text-center"
          >
            <Icon className="h-4.5 w-4.5 text-primary" />
            <span className="text-xs font-medium">{text}</span>
          </div>
        ))}
      </div>
    </>
  );
}
