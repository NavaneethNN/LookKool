"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────

interface ColorVariant {
  color: string;
  hexcode: string | null;
}

interface SizeVariant {
  variantId: number;
  size: string;
  stockCount: number;
}

interface VariantSelectorProps {
  colorVariants: ColorVariant[];
  selectedColor: string;
  onColorChange: (color: string) => void;
  sizes: SizeVariant[];
  selectedSize: string;
  onSizeChange: (size: string) => void;
}

// ── Component ────────────────────────────────────────────────

export function VariantSelector({
  colorVariants,
  selectedColor,
  onColorChange,
  sizes,
  selectedSize,
  onSizeChange,
}: VariantSelectorProps) {
  return (
    <>
      {/* Color Selector */}
      {colorVariants.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">
            Color: <span className="text-muted-foreground">{selectedColor}</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {colorVariants.map((cv) => (
              <button
                key={cv.color}
                onClick={() => onColorChange(cv.color)}
                className={cn(
                  "flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-medium transition",
                  selectedColor === cv.color
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                )}
              >
                {cv.hexcode && (
                  <span
                    className="h-4 w-4 rounded-full border"
                    style={{ backgroundColor: cv.hexcode }}
                  />
                )}
                {cv.color}
                {selectedColor === cv.color && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Selector */}
      {sizes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Size</h3>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s.variantId}
                onClick={() => onSizeChange(s.size)}
                disabled={s.stockCount === 0}
                className={cn(
                  "h-10 min-w-[3rem] rounded-lg border-2 px-3 text-sm font-medium transition",
                  selectedSize === s.size
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-muted hover:border-muted-foreground/30",
                  s.stockCount === 0 &&
                    "cursor-not-allowed opacity-40 line-through"
                )}
              >
                {s.size}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
