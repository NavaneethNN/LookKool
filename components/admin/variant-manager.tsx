"use client";

import { useState, useTransition } from "react";
import {
  createVariant,
  deleteVariant,
  bulkCreateVariants,
  bulkUpdateStock,
  addVariantImage,
  removeVariantImage,
  setVariantPrimaryImage,
} from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Package,
  ChevronDown,
  ChevronUp,
  Save,
  Layers,
} from "lucide-react";
import Image from "next/image";
import { MultiImageUpload } from "./image-upload";
import { ImageColorPicker } from "./image-color-picker";

interface Variant {
  variantId: number;
  sku: string | null;
  color: string;
  hexcode: string | null;
  size: string;
  stockCount: number;
  priceModifier: string;
  images?: { imageId: number; imagePath: string; isPrimary: boolean }[];
}

interface VariantManagerProps {
  productId: number;
  variants: Variant[];
}

export function VariantManager({ productId, variants }: VariantManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [expandedVariant, setExpandedVariant] = useState<number | null>(null);

  // ── Single variant form ──
  const [showSingle, setShowSingle] = useState(false);
  const [newVariant, setNewVariant] = useState({
    sku: "",
    color: "",
    hexcode: "#000000",
    size: "",
    stockCount: 0,
    priceModifier: "0.00",
  });

  // ── Bulk variant form ──
  const [showBulk, setShowBulk] = useState(false);
  const [bulkColor, setBulkColor] = useState("");
  const [bulkHexcode, setBulkHexcode] = useState("#000000");
  const [bulkSku, setBulkSku] = useState("");
  const [bulkSizes, setBulkSizes] = useState("XS, S, M, L, XL, XXL");
  const [bulkStock, setBulkStock] = useState(10);
  const [bulkPriceMod, setBulkPriceMod] = useState("0.00");

  // ── Bulk stock update ──
  const [stockEdits, setStockEdits] = useState<Record<number, string>>({});

  // ── Handlers ──────────────────────────────────────────

  function handleCreateSingle() {
    if (!newVariant.color || !newVariant.size) {
      toast.error("Color and size are required");
      return;
    }
    startTransition(async () => {
      try {
        await createVariant({
          productId,
          sku: newVariant.sku || undefined,
          color: newVariant.color,
          hexcode: newVariant.hexcode || undefined,
          size: newVariant.size,
          stockCount: newVariant.stockCount,
          priceModifier: newVariant.priceModifier,
        });
        toast.success("Variant created");
        setShowSingle(false);
        setNewVariant({ sku: "", color: "", hexcode: "#000000", size: "", stockCount: 0, priceModifier: "0.00" });
      } catch {
        toast.error("Failed to create variant");
      }
    });
  }

  function handleBulkCreate() {
    const sizes = bulkSizes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!bulkColor || sizes.length === 0) {
      toast.error("Color and at least one size are required");
      return;
    }
    startTransition(async () => {
      try {
        const result = await bulkCreateVariants(productId, [
          {
            sku: bulkSku || undefined,
            color: bulkColor,
            hexcode: bulkHexcode || undefined,
            sizes,
            stockCount: bulkStock,
            priceModifier: bulkPriceMod,
          },
        ]);
        toast.success(`${result.created} variants created`);
        setShowBulk(false);
        setBulkColor("");
        setBulkSku("");
        setBulkSizes("XS, S, M, L, XL, XXL");
        setBulkStock(10);
      } catch {
        toast.error("Bulk create failed");
      }
    });
  }

  function handleDelete(variantId: number) {
    if (!confirm("Delete this variant?")) return;
    startTransition(async () => {
      try {
        await deleteVariant(variantId);
        toast.success("Variant deleted");
      } catch {
        toast.error("Failed to delete");
      }
    });
  }

  function handleSaveAllStock() {
    const updates = Object.entries(stockEdits)
      .map(([id, val]) => ({
        variantId: Number(id),
        stockCount: Number(val),
      }))
      .filter((u) => !isNaN(u.stockCount) && u.stockCount >= 0);

    if (updates.length === 0) {
      toast.info("No stock changes to save");
      return;
    }

    startTransition(async () => {
      try {
        await bulkUpdateStock(updates);
        toast.success(`${updates.length} stock values updated`);
        setStockEdits({});
      } catch {
        toast.error("Bulk stock update failed");
      }
    });
  }

  const hasStockEdits = Object.keys(stockEdits).length > 0;

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-6 border-b">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Variants ({variants.length})
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Color + size combinations with individual stock
          </p>
        </div>
        <div className="flex gap-2">
          {hasStockEdits && (
            <Button
              onClick={handleSaveAllStock}
              disabled={isPending}
              size="sm"
              variant="outline"
              className="text-green-700 border-green-300 hover:bg-green-50"
            >
              <Save className="w-4 h-4 mr-1" />
              Save All Stock ({Object.keys(stockEdits).length})
            </Button>
          )}
          <Button
            onClick={() => {
              setShowBulk(!showBulk);
              setShowSingle(false);
            }}
            size="sm"
            variant="outline"
          >
            <Layers className="w-4 h-4 mr-1" />
            Bulk Add
          </Button>
          <Button
            onClick={() => {
              setShowSingle(!showSingle);
              setShowBulk(false);
            }}
            size="sm"
            className="bg-[#470B49] hover:bg-[#5a1060]"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add One
          </Button>
        </div>
      </div>

      {/* ── Bulk Create Form ─────────────────────────────── */}
      {showBulk && (
        <div className="p-6 border-b bg-purple-50/40">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">
            Bulk Add — one color, multiple sizes at once
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Color *
              </label>
              <Input
                value={bulkColor}
                onChange={(e) => setBulkColor(e.target.value)}
                placeholder="Black"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Hex Color
              </label>
              <ImageColorPicker
                value={bulkHexcode}
                onChange={setBulkHexcode}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                SKU prefix
              </label>
              <Input
                value={bulkSku}
                onChange={(e) => setBulkSku(e.target.value)}
                placeholder="LK-001-BK"
                className="h-9 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Sizes (comma-separated) *
              </label>
              <Input
                value={bulkSizes}
                onChange={(e) => setBulkSizes(e.target.value)}
                placeholder="XS, S, M, L, XL, XXL"
                className="h-9 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 md:col-span-1">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Stock each
                </label>
                <Input
                  type="number"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(Number(e.target.value))}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Price +/-
                </label>
                <Input
                  value={bulkPriceMod}
                  onChange={(e) => setBulkPriceMod(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleBulkCreate}
              disabled={isPending}
              size="sm"
              className="bg-[#470B49] hover:bg-[#5a1060]"
            >
              {isPending ? "Creating..." : `Create ${bulkSizes.split(",").filter((s) => s.trim()).length} Variants`}
            </Button>
            <Button onClick={() => setShowBulk(false)} variant="outline" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── Single Create Form ───────────────────────────── */}
      {showSingle && (
        <div className="p-6 border-b bg-gray-50/50">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                SKU
              </label>
              <Input
                value={newVariant.sku}
                onChange={(e) => setNewVariant((p) => ({ ...p, sku: e.target.value }))}
                placeholder="LK-001-BK-S"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Color *
              </label>
              <Input
                value={newVariant.color}
                onChange={(e) => setNewVariant((p) => ({ ...p, color: e.target.value }))}
                placeholder="Black"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Hex Color
              </label>
              <ImageColorPicker
                value={newVariant.hexcode}
                onChange={(hex) => setNewVariant((p) => ({ ...p, hexcode: hex }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Size *
              </label>
              <Input
                value={newVariant.size}
                onChange={(e) => setNewVariant((p) => ({ ...p, size: e.target.value }))}
                placeholder="M"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Stock
              </label>
              <Input
                type="number"
                value={newVariant.stockCount}
                onChange={(e) => setNewVariant((p) => ({ ...p, stockCount: Number(e.target.value) }))}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Price +/-
              </label>
              <Input
                value={newVariant.priceModifier}
                onChange={(e) => setNewVariant((p) => ({ ...p, priceModifier: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleCreateSingle}
              disabled={isPending}
              size="sm"
              className="bg-[#470B49] hover:bg-[#5a1060]"
            >
              {isPending ? "Creating..." : "Create Variant"}
            </Button>
            <Button onClick={() => setShowSingle(false)} variant="outline" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── Variants Table ───────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50/50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Color
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Size
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                SKU
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Price Mod
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Stock
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Images
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {variants.map((variant) => {
              const isExpanded = expandedVariant === variant.variantId;
              const variantImageUrls =
                variant.images?.map((img) => img.imagePath) ?? [];

              return (
                <tr key={variant.variantId} className="group">
                  <td colSpan={7} className="p-0">
                    {/* Main row */}
                    <div className="flex items-center hover:bg-gray-50/50">
                      <div className="px-6 py-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {variant.hexcode && (
                            <div
                              className="w-5 h-5 rounded-full border border-gray-200 flex-shrink-0"
                              style={{ backgroundColor: variant.hexcode }}
                            />
                          )}
                          <span className="text-sm text-gray-900">
                            {variant.color}
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-3 w-16 text-sm text-gray-600">
                        {variant.size}
                      </div>
                      <div className="px-4 py-3 w-28 text-sm text-gray-500 font-mono">
                        {variant.sku ?? "—"}
                      </div>
                      <div className="px-4 py-3 w-24 text-sm text-gray-600">
                        {Number(variant.priceModifier) !== 0
                          ? `₹${variant.priceModifier}`
                          : "—"}
                      </div>
                      <div className="px-4 py-3 w-28">
                        <Input
                          type="number"
                          defaultValue={variant.stockCount}
                          onChange={(e) =>
                            setStockEdits((prev) => ({
                              ...prev,
                              [variant.variantId]: e.target.value,
                            }))
                          }
                          className="h-8 w-20 text-sm"
                        />
                      </div>
                      <div className="px-4 py-3 w-24">
                        <div className="flex gap-1">
                          {variant.images?.slice(0, 3).map((img) => (
                            <div
                              key={img.imageId}
                              className="w-8 h-8 rounded bg-gray-100 overflow-hidden"
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
                          {(variant.images?.length ?? 0) === 0 && (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                        </div>
                      </div>
                      <div className="px-4 py-3 w-20 flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedVariant(
                              isExpanded ? null : variant.variantId
                            )
                          }
                          className="p-1.5 text-gray-400 hover:text-[#470B49] rounded transition-colors"
                          title={isExpanded ? "Collapse" : "Manage images"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(variant.variantId)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                          title="Delete variant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded: Images + Color Picker */}
                    {isExpanded && (
                      <div className="px-6 py-4 bg-gray-50/80 border-t space-y-4">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Variant Images
                            </h4>
                            <MultiImageUpload
                              images={
                                variant.images?.map((img) => ({
                                  url: img.imagePath,
                                  isPrimary: img.isPrimary,
                                  id: img.imageId,
                                })) ?? []
                              }
                              onChange={async (action) => {
                                startTransition(async () => {
                                  try {
                                    if (action.type === "add") {
                                      await addVariantImage(
                                        variant.variantId,
                                        action.url,
                                        (variant.images?.length ?? 0) === 0
                                      );
                                      toast.success("Image added");
                                    } else if (
                                      action.type === "remove" &&
                                      action.id
                                    ) {
                                      await removeVariantImage(action.id);
                                      toast.success("Image removed");
                                    } else if (
                                      action.type === "primary" &&
                                      action.id
                                    ) {
                                      await setVariantPrimaryImage(
                                        variant.variantId,
                                        action.id
                                      );
                                      toast.success("Primary image set");
                                    }
                                  } catch {
                                    toast.error("Image action failed");
                                  }
                                });
                              }}
                              folder={`products/${productId}/variants/${variant.variantId}`}
                            />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Pick Color from Image
                            </h4>
                            <ImageColorPicker
                              value={variant.hexcode ?? "#000000"}
                              onChange={(hex) => {
                                toast.info(`Selected color ${hex}`);
                              }}
                              imageUrls={variantImageUrls}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {variants.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-sm text-gray-400"
                >
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No variants yet. Use &ldquo;Bulk Add&rdquo; to create multiple at once.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
