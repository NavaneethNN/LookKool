"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Layers } from "lucide-react";
import { ImageColorPicker } from "../image-color-picker";

// ─── Types ────────────────────────────────────────────────────

export interface VariantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onBulkCreate: (form: BulkForm) => void;
  onSingleCreate: (form: SingleForm) => void;
}

export interface BulkForm {
  color: string;
  hexcode: string;
  skuPrefix: string;
  sizes: string;
  stockCount: number;
  priceModifier: string;
  price: string;
  mrp: string;
}

export interface SingleForm {
  color: string;
  hexcode: string;
  sku: string;
  size: string;
  stockCount: number;
  priceModifier: string;
  price: string;
  mrp: string;
}

// ─── Component ────────────────────────────────────────────────

export function VariantFormDialog({
  open,
  onOpenChange,
  isPending,
  onBulkCreate,
  onSingleCreate,
}: VariantFormDialogProps) {
  const [addMode, setAddMode] = useState<"bulk" | "single">("bulk");
  const [bulkForm, setBulkForm] = useState<BulkForm>({
    color: "",
    hexcode: "#000000",
    skuPrefix: "",
    sizes: "XS, S, M, L, XL, XXL",
    stockCount: 10,
    priceModifier: "0.00",
    price: "",
    mrp: "",
  });
  const [singleForm, setSingleForm] = useState<SingleForm>({
    color: "",
    hexcode: "#000000",
    sku: "",
    size: "",
    stockCount: 0,
    priceModifier: "0.00",
    price: "",
    mrp: "",
  });

  function handleBulkSubmit() {
    onBulkCreate(bulkForm);
    // Reset is handled by the parent after successful creation via onOpenChange(false)
  }

  function handleSingleSubmit() {
    onSingleCreate(singleForm);
  }

  // Reset forms when dialog closes
  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setBulkForm({
        color: "",
        hexcode: "#000000",
        skuPrefix: "",
        sizes: "XS, S, M, L, XL, XXL",
        stockCount: 10,
        priceModifier: "0.00",
        price: "",
        mrp: "",
      });
      setSingleForm({
        color: "",
        hexcode: "#000000",
        sku: "",
        size: "",
        stockCount: 0,
        priceModifier: "0.00",
        price: "",
        mrp: "",
      });
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Variants
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Variants</DialogTitle>
        </DialogHeader>

        {/* Mode Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1 gap-1">
          <button
            type="button"
            onClick={() => setAddMode("bulk")}
            className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-all ${
              addMode === "bulk"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Layers className="w-4 h-4 inline mr-1.5" />
            Bulk (Multiple Sizes)
          </button>
          <button
            type="button"
            onClick={() => setAddMode("single")}
            className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-all ${
              addMode === "single"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Plus className="w-4 h-4 inline mr-1.5" />
            Single Variant
          </button>
        </div>

        {/* Bulk Form */}
        {addMode === "bulk" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-500">
              Create multiple size variants for one color at once.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Color Name *
                </label>
                <Input
                  value={bulkForm.color}
                  onChange={(e) =>
                    setBulkForm((p) => ({
                      ...p,
                      color: e.target.value,
                    }))
                  }
                  placeholder="e.g. Black, Navy Blue"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Hex Color
                </label>
                <ImageColorPicker
                  value={bulkForm.hexcode}
                  onChange={(hex) =>
                    setBulkForm((p) => ({ ...p, hexcode: hex }))
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Sizes (comma-separated) *
              </label>
              <Input
                value={bulkForm.sizes}
                onChange={(e) =>
                  setBulkForm((p) => ({
                    ...p,
                    sizes: e.target.value,
                  }))
                }
                placeholder="XS, S, M, L, XL, XXL"
              />
              <p className="text-xs text-gray-400 mt-1">
                Each size becomes a separate variant
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  SKU Prefix
                </label>
                <Input
                  value={bulkForm.skuPrefix}
                  onChange={(e) =>
                    setBulkForm((p) => ({
                      ...p,
                      skuPrefix: e.target.value,
                    }))
                  }
                  placeholder="LK-001-BK"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Stock Each
                </label>
                <Input
                  type="number"
                  min={0}
                  value={bulkForm.stockCount}
                  onChange={(e) =>
                    setBulkForm((p) => ({
                      ...p,
                      stockCount: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Selling Price (₹)
                </label>
                <Input
                  value={bulkForm.price}
                  onChange={(e) =>
                    setBulkForm((p) => ({
                      ...p,
                      price: e.target.value,
                    }))
                  }
                  placeholder="Leave empty = product price"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  MRP (₹)
                </label>
                <Input
                  value={bulkForm.mrp}
                  onChange={(e) =>
                    setBulkForm((p) => ({
                      ...p,
                      mrp: e.target.value,
                    }))
                  }
                  placeholder="Leave empty = product MRP"
                />
              </div>
            </div>

            {/* Preview */}
            {bulkForm.color && bulkForm.sizes && (
              <div className="bg-gray-50 rounded-lg p-3 border">
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Preview — will create:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {bulkForm.sizes
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((size) => (
                      <span
                        key={size}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md border text-xs text-gray-700"
                      >
                        {bulkForm.hexcode && (
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-gray-200"
                            style={{
                              backgroundColor: bulkForm.hexcode,
                            }}
                          />
                        )}
                        {bulkForm.color} / {size}
                      </span>
                    ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={handleBulkSubmit}
                disabled={isPending || !bulkForm.color}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                {isPending
                  ? "Creating..."
                  : `Create ${
                      bulkForm.sizes
                        .split(",")
                        .filter((s) => s.trim()).length
                    } Variant(s)`}
              </Button>
            </div>
          </div>
        )}

        {/* Single Form */}
        {addMode === "single" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-500">
              Add a single color + size variant.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Color Name *
                </label>
                <Input
                  value={singleForm.color}
                  onChange={(e) =>
                    setSingleForm((p) => ({
                      ...p,
                      color: e.target.value,
                    }))
                  }
                  placeholder="e.g. Black"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Hex Color
                </label>
                <ImageColorPicker
                  value={singleForm.hexcode}
                  onChange={(hex) =>
                    setSingleForm((p) => ({ ...p, hexcode: hex }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Size *
                </label>
                <Input
                  value={singleForm.size}
                  onChange={(e) =>
                    setSingleForm((p) => ({
                      ...p,
                      size: e.target.value,
                    }))
                  }
                  placeholder="e.g. M, L, XL"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  SKU
                </label>
                <Input
                  value={singleForm.sku}
                  onChange={(e) =>
                    setSingleForm((p) => ({
                      ...p,
                      sku: e.target.value,
                    }))
                  }
                  placeholder="LK-001-BK-M"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Stock
                </label>
                <Input
                  type="number"
                  min={0}
                  value={singleForm.stockCount}
                  onChange={(e) =>
                    setSingleForm((p) => ({
                      ...p,
                      stockCount: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Selling Price (₹)
                </label>
                <Input
                  value={singleForm.price}
                  onChange={(e) =>
                    setSingleForm((p) => ({
                      ...p,
                      price: e.target.value,
                    }))
                  }
                  placeholder="Product price"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  MRP (₹)
                </label>
                <Input
                  value={singleForm.mrp}
                  onChange={(e) =>
                    setSingleForm((p) => ({
                      ...p,
                      mrp: e.target.value,
                    }))
                  }
                  placeholder="Product MRP"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={handleSingleSubmit}
                disabled={
                  isPending ||
                  !singleForm.color ||
                  !singleForm.size
                }
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                {isPending ? "Creating..." : "Create Variant"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
