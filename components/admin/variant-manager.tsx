"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import {
  createVariant,
  deleteVariant,
  updateVariant,
  bulkCreateVariants,
  bulkUpdateStock,
  addVariantImage,
  removeVariantImage,
  setVariantPrimaryImage,
} from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Package,
  ChevronDown,
  ChevronRight,
  Save,
  Layers,
  ImageIcon,
  AlertTriangle,
  Edit2,
  Check,
  X,
  Palette,
  Hash,
} from "lucide-react";
import Image from "next/image";
import { MultiImageUpload } from "./image-upload";
import { ImageColorPicker } from "./image-color-picker";

// ─── Types ────────────────────────────────────────────────────

interface VariantImage {
  imageId: number;
  imagePath: string;
  isPrimary: boolean;
}

interface Variant {
  variantId: number;
  sku: string | null;
  color: string;
  hexcode: string | null;
  size: string;
  stockCount: number;
  priceModifier: string;
  price: string | null;
  mrp: string | null;
  images?: VariantImage[];
}

interface VariantManagerProps {
  productId: number;
  variants: Variant[];
}

// Group variants by color
interface ColorGroup {
  color: string;
  hexcode: string | null;
  variants: Variant[];
  totalStock: number;
  outOfStockCount: number;
  images: VariantImage[];
}

// ─── Helpers ──────────────────────────────────────────────────

function getStockColor(stock: number): string {
  if (stock === 0) return "text-red-600 bg-red-50 border-red-200";
  if (stock <= 5) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-green-700 bg-green-50 border-green-200";
}

function getStockBadge(stock: number): string {
  if (stock === 0) return "bg-red-100 text-red-700 border-red-200";
  if (stock <= 5) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-green-100 text-green-700 border-green-200";
}

const SIZE_ORDER = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
];

function sortSizes(a: string, b: string) {
  const ia = SIZE_ORDER.indexOf(a.toUpperCase());
  const ib = SIZE_ORDER.indexOf(b.toUpperCase());
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.localeCompare(b);
}

// ─── Main Component ───────────────────────────────────────────

export function VariantManager({ productId, variants }: VariantManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [expandedColors, setExpandedColors] = useState<Set<string>>(
    new Set(
      variants.length <= 12
        ? Array.from(new Set(variants.map((v) => v.color)))
        : []
    )
  );
  const [stockEdits, setStockEdits] = useState<Record<number, number>>({});
  const [editingVariant, setEditingVariant] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    sku: string;
    priceModifier: string;
    price: string;
    mrp: string;
  }>({ sku: "", priceModifier: "0.00", price: "", mrp: "" });

  // Add color dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addMode, setAddMode] = useState<"bulk" | "single">("bulk");
  const [bulkForm, setBulkForm] = useState({
    color: "",
    hexcode: "#000000",
    skuPrefix: "",
    sizes: "XS, S, M, L, XL, XXL",
    stockCount: 10,
    priceModifier: "0.00",
    price: "",
    mrp: "",
  });
  const [singleForm, setSingleForm] = useState({
    color: "",
    hexcode: "#000000",
    sku: "",
    size: "",
    stockCount: 0,
    priceModifier: "0.00",
    price: "",
    mrp: "",
  });

  // ── Group variants by color ────────────────────────────────

  const colorGroups = useMemo<ColorGroup[]>(() => {
    const map = new Map<string, ColorGroup>();
    for (const v of variants) {
      const key = v.color;
      if (!map.has(key)) {
        map.set(key, {
          color: v.color,
          hexcode: v.hexcode,
          variants: [],
          totalStock: 0,
          outOfStockCount: 0,
          images: [],
        });
      }
      const group = map.get(key)!;
      group.variants.push(v);
      group.totalStock += v.stockCount;
      if (v.stockCount === 0) group.outOfStockCount++;
      // Collect unique images from all variants of this color
      if (v.images) {
        for (const img of v.images) {
          if (!group.images.some((i) => i.imageId === img.imageId)) {
            group.images.push(img);
          }
        }
      }
    }
    // Sort variants within each group by size
    for (const group of Array.from(map.values())) {
      group.variants.sort((a: { size: string }, b: { size: string }) => sortSizes(a.size, b.size));
    }
    return Array.from(map.values());
  }, [variants]);

  // ── Summary stats ──────────────────────────────────────────

  const stats = useMemo(() => {
    const total = variants.length;
    const outOfStock = variants.filter((v) => v.stockCount === 0).length;
    const lowStock = variants.filter(
      (v) => v.stockCount > 0 && v.stockCount <= 5
    ).length;
    const totalStock = variants.reduce((sum, v) => sum + v.stockCount, 0);
    return {
      total,
      outOfStock,
      lowStock,
      totalStock,
      colorCount: colorGroups.length,
    };
  }, [variants, colorGroups]);

  const hasStockEdits = Object.keys(stockEdits).length > 0;

  // ── Toggle color group ─────────────────────────────────────

  const toggleColor = useCallback((color: string) => {
    setExpandedColors((prev) => {
      const next = new Set(prev);
      if (next.has(color)) next.delete(color);
      else next.add(color);
      return next;
    });
  }, []);

  // ── Stock editing ──────────────────────────────────────────

  function handleStockChange(variantId: number, value: string) {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setStockEdits((prev) => ({ ...prev, [variantId]: num }));
  }

  function handleSaveAllStock() {
    const updates = Object.entries(stockEdits).map(([id, val]) => ({
      variantId: Number(id),
      stockCount: val,
    }));
    if (updates.length === 0) return;

    startTransition(async () => {
      try {
        await bulkUpdateStock(updates);
        toast.success(`${updates.length} stock value(s) updated`);
        setStockEdits({});
      } catch {
        toast.error("Failed to update stock");
      }
    });
  }

  // ── Inline variant editing ─────────────────────────────────

  function startEditing(variant: Variant) {
    setEditingVariant(variant.variantId);
    setEditForm({
      sku: variant.sku || "",
      priceModifier: variant.priceModifier || "0.00",
      price: variant.price || "",
      mrp: variant.mrp || "",
    });
  }

  function handleSaveVariantEdit(variantId: number) {
    startTransition(async () => {
      try {
        await updateVariant(variantId, {
          sku: editForm.sku || undefined,
          priceModifier: editForm.priceModifier,
          price: editForm.price || null,
          mrp: editForm.mrp || null,
        });
        toast.success("Variant updated");
        setEditingVariant(null);
      } catch {
        toast.error("Failed to update variant");
      }
    });
  }

  // ── Create variants ────────────────────────────────────────

  function handleBulkCreate() {
    const sizes = bulkForm.sizes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!bulkForm.color || sizes.length === 0) {
      toast.error("Color and at least one size are required");
      return;
    }
    startTransition(async () => {
      try {
        const result = await bulkCreateVariants(productId, [
          {
            sku: bulkForm.skuPrefix || undefined,
            color: bulkForm.color,
            hexcode: bulkForm.hexcode || undefined,
            sizes,
            stockCount: bulkForm.stockCount,
            priceModifier: bulkForm.priceModifier,
            price: bulkForm.price || undefined,
            mrp: bulkForm.mrp || undefined,
          },
        ]);
        toast.success(`${result.created} variant(s) created`);
        setAddDialogOpen(false);
        // Auto-expand the new color group
        setExpandedColors((prev) => new Set(Array.from(prev).concat(bulkForm.color)));
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
      } catch {
        toast.error("Failed to create variants");
      }
    });
  }

  function handleSingleCreate() {
    if (!singleForm.color || !singleForm.size) {
      toast.error("Color and size are required");
      return;
    }
    startTransition(async () => {
      try {
        await createVariant({
          productId,
          sku: singleForm.sku || undefined,
          color: singleForm.color,
          hexcode: singleForm.hexcode || undefined,
          size: singleForm.size,
          stockCount: singleForm.stockCount,
          priceModifier: singleForm.priceModifier,
          price: singleForm.price || undefined,
          mrp: singleForm.mrp || undefined,
        });
        toast.success("Variant created");
        setAddDialogOpen(false);
        setExpandedColors((prev) => new Set(Array.from(prev).concat(singleForm.color)));
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
      } catch {
        toast.error("Failed to create variant");
      }
    });
  }

  // ── Delete ─────────────────────────────────────────────────

  function handleDeleteVariant(variantId: number) {
    if (!confirm("Delete this variant? This cannot be undone.")) return;
    startTransition(async () => {
      try {
        await deleteVariant(variantId);
        toast.success("Variant deleted");
      } catch {
        toast.error("Failed to delete variant");
      }
    });
  }

  function handleDeleteColorGroup(group: ColorGroup) {
    if (
      !confirm(
        `Delete all ${group.variants.length} variant(s) for "${group.color}"? This cannot be undone.`
      )
    )
      return;
    startTransition(async () => {
      try {
        for (const v of group.variants) {
          await deleteVariant(v.variantId);
        }
        toast.success(`Deleted all "${group.color}" variants`);
        setExpandedColors((prev) => {
          const next = new Set(prev);
          next.delete(group.color);
          return next;
        });
      } catch {
        toast.error("Failed to delete some variants");
      }
    });
  }

  // ── Image handlers ─────────────────────────────────────────

  function handleImageAction(
    variant: Variant,
    action:
      | { type: "add"; url: string }
      | { type: "remove"; id?: number; url: string }
      | { type: "primary"; id?: number; url: string }
  ) {
    startTransition(async () => {
      try {
        if (action.type === "add") {
          await addVariantImage(
            variant.variantId,
            action.url,
            (variant.images?.length ?? 0) === 0
          );
          toast.success("Image added");
        } else if (action.type === "remove" && action.id) {
          await removeVariantImage(action.id);
          toast.success("Image removed");
        } else if (action.type === "primary" && action.id) {
          await setVariantPrimaryImage(variant.variantId, action.id);
          toast.success("Primary image set");
        }
      } catch {
        toast.error("Image action failed");
      }
    });
  }

  function handleHexUpdate(variantId: number, hex: string) {
    startTransition(async () => {
      try {
        await updateVariant(variantId, { hexcode: hex });
        toast.success("Color updated");
      } catch {
        toast.error("Failed to update color");
      }
    });
  }

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="p-6 border-b">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Variants
              <Badge variant="secondary" className="ml-1 text-xs">
                {stats.total}
              </Badge>
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" />
                {stats.colorCount} color{stats.colorCount !== 1 ? "s" : ""}
              </span>
              <span>·</span>
              <span>{stats.totalStock} total stock</span>
              {stats.outOfStock > 0 && (
                <>
                  <span>·</span>
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {stats.outOfStock} out of stock
                  </span>
                </>
              )}
              {stats.lowStock > 0 && (
                <>
                  <span>·</span>
                  <span className="text-amber-600">
                    {stats.lowStock} low stock
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Save Stock Button */}
            {hasStockEdits && (
              <Button
                onClick={handleSaveAllStock}
                disabled={isPending}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white animate-in fade-in slide-in-from-right-2"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Save Stock ({Object.keys(stockEdits).length})
              </Button>
            )}

            {/* Add Variants Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Variants
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
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
                        onClick={handleBulkCreate}
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
                        onClick={handleSingleCreate}
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
          </div>
        </div>
      </div>

      {/* ── Floating save bar ──────────────────────────────── */}
      {hasStockEdits && (
        <div className="sticky top-0 z-10 bg-green-50 border-b border-green-200 px-6 py-3 flex items-center justify-between">
          <p className="text-sm text-green-800">
            <strong>{Object.keys(stockEdits).length}</strong> stock value
            {Object.keys(stockEdits).length > 1 ? "s" : ""} modified — save
            to apply changes
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setStockEdits({})}
              variant="outline"
              size="sm"
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              Discard
            </Button>
            <Button
              onClick={handleSaveAllStock}
              disabled={isPending}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {isPending ? "Saving..." : "Save All Stock"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Color Groups ───────────────────────────────────── */}
      <div className="divide-y">
        {colorGroups.map((group) => {
          const isExpanded = expandedColors.has(group.color);
          // Use first variant for image management
          const primaryVariant = group.variants[0];
          const variantImageUrls = group.images.map((img) => img.imagePath);

          return (
            <div key={group.color}>
              {/* ── Color Header ────────────────────────── */}
              <button
                type="button"
                onClick={() => toggleColor(group.color)}
                className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50/80 transition-colors text-left"
              >
                {/* Expand icon */}
                <span className="text-gray-400 flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </span>

                {/* Color swatch */}
                {group.hexcode ? (
                  <span
                    className="w-6 h-6 rounded-full border-2 border-gray-200 flex-shrink-0 shadow-inner"
                    style={{ backgroundColor: group.hexcode }}
                  />
                ) : (
                  <span className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex-shrink-0" />
                )}

                {/* Color name + info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {group.color}
                    </span>
                    {group.hexcode && (
                      <span className="text-xs text-gray-400 font-mono">
                        {group.hexcode}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">
                      {group.variants.length} size
                      {group.variants.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-500">
                      {group.totalStock} in stock
                    </span>
                    {group.images.length > 0 && (
                      <>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-500 flex items-center gap-0.5">
                          <ImageIcon className="w-3 h-3" />
                          {group.images.length}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Image thumbnails preview */}
                {group.images.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1 flex-shrink-0 mr-2">
                    {group.images.slice(0, 4).map((img) => (
                      <div
                        key={img.imageId}
                        className="w-8 h-8 rounded bg-gray-100 overflow-hidden border"
                      >
                        <Image
                          src={img.imagePath}
                          alt=""
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {group.images.length > 4 && (
                      <span className="text-xs text-gray-400">
                        +{group.images.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Stock status badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {group.outOfStockCount > 0 && (
                    <Badge
                      className={`text-[10px] ${getStockBadge(0)}`}
                      variant="outline"
                    >
                      {group.outOfStockCount} out of stock
                    </Badge>
                  )}
                  {group.outOfStockCount === 0 && (
                    <Badge
                      className="text-[10px] bg-green-50 text-green-700 border-green-200"
                      variant="outline"
                    >
                      All in stock
                    </Badge>
                  )}
                </div>
              </button>

              {/* ── Expanded Content ─────────────────────── */}
              {isExpanded && (
                <div className="bg-gray-50/60 border-t">
                  {/* Images section */}
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="grid md:grid-cols-[1fr_auto] gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                          Images for {group.color}
                        </h4>
                        <MultiImageUpload
                          images={
                            primaryVariant.images?.map((img) => ({
                              url: img.imagePath,
                              isPrimary: img.isPrimary,
                              id: img.imageId,
                            })) ?? []
                          }
                          onChange={(action) =>
                            handleImageAction(primaryVariant, action)
                          }
                          folder={`products/${productId}/variants/${primaryVariant.variantId}`}
                        />
                      </div>
                      <div className="md:border-l md:pl-6 border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                          <Palette className="w-4 h-4 text-gray-400" />
                          Pick Hex from Image
                        </h4>
                        <ImageColorPicker
                          value={group.hexcode ?? "#000000"}
                          onChange={(hex) => {
                            // Update all variants in this color group
                            for (const v of group.variants) {
                              handleHexUpdate(v.variantId, hex);
                            }
                          }}
                          imageUrls={variantImageUrls}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Size Grid ─────────────────────────── */}
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Sizes &amp; Stock
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleDeleteColorGroup(group)}
                        disabled={isPending}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete All {group.color}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {group.variants.map((variant) => {
                        const currentStock =
                          stockEdits[variant.variantId] ??
                          variant.stockCount;
                        const isEditing =
                          editingVariant === variant.variantId;
                        const hasEdit =
                          variant.variantId in stockEdits;

                        return (
                          <div
                            key={variant.variantId}
                            className={`relative rounded-lg border-2 p-3 transition-all ${
                              hasEdit
                                ? "border-green-400 bg-green-50/50 ring-1 ring-green-200"
                                : getStockColor(variant.stockCount)
                            }`}
                          >
                            {/* Size label */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-gray-900">
                                {variant.size}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {!isEditing && (
                                  <button
                                    type="button"
                                    onClick={() => startEditing(variant)}
                                    className="p-1 text-gray-400 hover:text-primary rounded transition-colors"
                                    title="Edit SKU & price"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteVariant(variant.variantId)
                                  }
                                  className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

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
                                  handleStockChange(
                                    variant.variantId,
                                    e.target.value
                                  )
                                }
                                className="h-8 text-sm font-semibold mt-0.5 text-center"
                              />
                            </div>

                            {/* Stock status indicator */}
                            <div className="text-center">
                              {variant.stockCount === 0 && !hasEdit && (
                                <span className="text-[10px] font-semibold text-red-600 flex items-center justify-center gap-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  OUT OF STOCK
                                </span>
                              )}
                              {variant.stockCount > 0 &&
                                variant.stockCount <= 5 &&
                                !hasEdit && (
                                  <span className="text-[10px] font-medium text-amber-600">
                                    LOW STOCK
                                  </span>
                                )}
                              {variant.stockCount > 5 && !hasEdit && (
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

                            {/* Inline edit panel */}
                            {isEditing && (
                              <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                                <div>
                                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                                    SKU
                                  </label>
                                  <Input
                                    value={editForm.sku}
                                    onChange={(e) =>
                                      setEditForm((p) => ({
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
                                      setEditForm((p) => ({
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
                                      setEditForm((p) => ({
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
                                    onClick={() =>
                                      handleSaveVariantEdit(
                                        variant.variantId
                                      )
                                    }
                                    disabled={isPending}
                                    className="flex-1 flex items-center justify-center gap-1 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                                  >
                                    <Check className="w-3 h-3" />
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingVariant(null)
                                    }
                                    className="flex-1 flex items-center justify-center gap-1 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Metadata (non-editing) */}
                            {!isEditing && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                {variant.sku && (
                                  <p
                                    className="text-[10px] text-gray-400 font-mono truncate flex items-center gap-0.5"
                                    title={variant.sku}
                                  >
                                    <Hash className="w-2.5 h-2.5 flex-shrink-0" />
                                    {variant.sku}
                                  </p>
                                )}
                                {variant.price && (
                                  <p className="text-[10px] text-gray-700 mt-0.5 font-semibold">
                                    ₹{parseFloat(variant.price).toLocaleString("en-IN")}
                                    {variant.mrp && parseFloat(variant.mrp) > parseFloat(variant.price) && (
                                      <span className="text-gray-400 line-through ml-1 font-normal">
                                        ₹{parseFloat(variant.mrp).toLocaleString("en-IN")}
                                      </span>
                                    )}
                                  </p>
                                )}
                                {!variant.sku && !variant.price && (
                                  <p className="text-[10px] text-gray-300 italic">
                                    Uses product price
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add size to this color */}
                      <AddSizeCard
                        color={group.color}
                        hexcode={group.hexcode}
                        productId={productId}
                        isPending={isPending}
                        startTransition={startTransition}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ── Empty State ──────────────────────────────────── */}
        {variants.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <h4 className="text-sm font-medium text-gray-700 mb-1">
              No variants yet
            </h4>
            <p className="text-sm text-gray-400 mb-4 max-w-sm mx-auto">
              Add color + size combinations. Use &quot;Add Variants&quot; to
              bulk-create multiple sizes for a color at once.
            </p>
            <Button
              onClick={() => setAddDialogOpen(true)}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Your First Variants
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Size Mini-Card ───────────────────────────────────────
// Inline card to quickly add a new size to an existing color group

function AddSizeCard({
  color,
  hexcode,
  productId,
  isPending,
  startTransition,
}: {
  color: string;
  hexcode: string | null;
  productId: number;
  isPending: boolean;
  startTransition: (callback: () => Promise<void>) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [size, setSize] = useState("");
  const [stock, setStock] = useState(10);

  function handleAdd() {
    if (!size.trim()) {
      toast.error("Size is required");
      return;
    }
    startTransition(async () => {
      try {
        await createVariant({
          productId,
          color,
          hexcode: hexcode || undefined,
          size: size.trim(),
          stockCount: stock,
        });
        toast.success(`Added ${color} / ${size}`);
        setIsAdding(false);
        setSize("");
        setStock(10);
      } catch {
        toast.error("Failed to add size");
      }
    });
  }

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="rounded-lg border-2 border-dashed border-gray-200 p-3 flex flex-col items-center justify-center gap-1 hover:border-primary/40 hover:bg-white transition-all min-h-[120px] cursor-pointer"
      >
        <Plus className="w-5 h-5 text-gray-400" />
        <span className="text-xs text-gray-400">Add Size</span>
      </button>
    );
  }

  return (
    <div className="rounded-lg border-2 border-primary/30 bg-white p-3 space-y-2">
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
          Size
        </label>
        <Input
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="e.g. 3XL"
          className="h-7 text-xs mt-0.5"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
      </div>
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
          Stock
        </label>
        <Input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          className="h-7 text-xs mt-0.5"
        />
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending || !size.trim()}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Check className="w-3 h-3" />
          Add
        </button>
        <button
          type="button"
          onClick={() => setIsAdding(false)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
