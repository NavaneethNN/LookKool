"use client";

import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

export interface VariantStockEditorProps {
  variantId: number;
  size: string;
  stockCount: number;
  currentStock: number;
  hasEdit: boolean;
  onStockChange: (variantId: number, value: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────

function getStockColor(stock: number): string {
  if (stock === 0) return "text-red-600 bg-red-50 border-red-200";
  if (stock <= 5) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-green-700 bg-green-50 border-green-200";
}

// ─── Component ────────────────────────────────────────────────

export function VariantStockEditor({
  variantId,
  stockCount,
  currentStock,
  hasEdit,
  onStockChange,
}: VariantStockEditorProps) {
  return (
    <>
      {/* Stock input */}
      <div className="mb-1.5">
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
          Stock
        </label>
        <Input
          type="number"
          min={0}
          value={currentStock}
          onChange={(e) =>
            onStockChange(variantId, e.target.value)
          }
          className="h-8 text-sm font-semibold mt-0.5 text-center"
        />
      </div>

      {/* Stock status indicator */}
      <div className="text-center">
        {stockCount === 0 && !hasEdit && (
          <span className="text-[10px] font-semibold text-red-600 flex items-center justify-center gap-0.5">
            <AlertTriangle className="w-2.5 h-2.5" />
            OUT OF STOCK
          </span>
        )}
        {stockCount > 0 &&
          stockCount <= 5 &&
          !hasEdit && (
            <span className="text-[10px] font-medium text-amber-600">
              LOW STOCK
            </span>
          )}
        {stockCount > 5 && !hasEdit && (
          <span className="text-[10px] text-green-600">
            In Stock
          </span>
        )}
        {hasEdit && (
          <span className="text-[10px] font-medium text-green-600">
            ✓ Modified
          </span>
        )}
      </div>
    </>
  );
}

// Re-export helper for use by color-group-card
export { getStockColor };
