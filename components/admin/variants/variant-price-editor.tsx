"use client";

import { Input } from "@/components/ui/input";
import { Check, X, Hash } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

export interface VariantPriceEditorProps {
  variantId: number;
  sku: string | null;
  price: string | null;
  mrp: string | null;
  isEditing: boolean;
  editForm: {
    sku: string;
    priceModifier: string;
    price: string;
    mrp: string;
  };
  isPending: boolean;
  onEditFormChange: (
    updater: (prev: { sku: string; priceModifier: string; price: string; mrp: string }) => {
      sku: string;
      priceModifier: string;
      price: string;
      mrp: string;
    }
  ) => void;
  onSave: (variantId: number) => void;
  onCancel: () => void;
}

// ─── Component ────────────────────────────────────────────────

export function VariantPriceEditor({
  variantId,
  sku,
  price,
  mrp,
  isEditing,
  editForm,
  isPending,
  onEditFormChange,
  onSave,
  onCancel,
}: VariantPriceEditorProps) {
  if (isEditing) {
    return (
      <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
        <div>
          <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
            SKU
          </label>
          <Input
            value={editForm.sku}
            onChange={(e) =>
              onEditFormChange((p) => ({
                ...p,
                sku: e.target.value,
              }))
            }
            placeholder="SKU"
            className="h-7 text-xs mt-0.5"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
            Price (₹)
          </label>
          <Input
            value={editForm.price}
            onChange={(e) =>
              onEditFormChange((p) => ({
                ...p,
                price: e.target.value,
              }))
            }
            placeholder="Product price"
            className="h-7 text-xs mt-0.5"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
            MRP (₹)
          </label>
          <Input
            value={editForm.mrp}
            onChange={(e) =>
              onEditFormChange((p) => ({
                ...p,
                mrp: e.target.value,
              }))
            }
            placeholder="Product MRP"
            className="h-7 text-xs mt-0.5"
          />
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onSave(variantId)}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Check className="w-3 h-3" />
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-1 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            <X className="w-3 h-3" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Metadata (non-editing)
  return (
    <div className="mt-2 pt-2 border-t border-gray-100">
      {sku && (
        <p
          className="text-[10px] text-gray-400 font-mono truncate flex items-center gap-0.5"
          title={sku}
        >
          <Hash className="w-2.5 h-2.5 flex-shrink-0" />
          {sku}
        </p>
      )}
      {price && (
        <p className="text-[10px] text-gray-700 mt-0.5 font-semibold">
          ₹{parseFloat(price).toLocaleString("en-IN")}
          {mrp && parseFloat(mrp) > parseFloat(price) && (
            <span className="text-gray-400 line-through ml-1 font-normal">
              ₹{parseFloat(mrp).toLocaleString("en-IN")}
            </span>
          )}
        </p>
      )}
      {!sku && !price && (
        <p className="text-[10px] text-gray-300 italic">
          Uses product price
        </p>
      )}
    </div>
  );
}
