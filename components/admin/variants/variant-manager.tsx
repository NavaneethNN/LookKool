"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import {
  createVariant,
  deleteVariant,
  bulkDeleteVariants,
  updateVariant,
  bulkCreateVariants,
  bulkUpdateStock,
  addVariantImage,
  removeVariantImage,
  setVariantPrimaryImage,
} from "@/lib/actions/product.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Package,
  Save,
  AlertTriangle,
  Palette,
} from "lucide-react";
import { ColorGroupCard } from "./color-group-card";
import { VariantFormDialog } from "./variant-form-dialog";
import type { BulkForm, SingleForm } from "./variant-form-dialog";

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
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update stock");
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
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update variant");
      }
    });
  }

  // ── Create variants ────────────────────────────────────────

  function handleBulkCreate(bulkForm: BulkForm) {
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
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create variants");
      }
    });
  }

  function handleSingleCreate(singleForm: SingleForm) {
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
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create variant");
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
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete variant");
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
        await bulkDeleteVariants(group.variants.map((v) => v.variantId));
        toast.success(`Deleted all "${group.color}" variants`);
        setExpandedColors((prev) => {
          const next = new Set(prev);
          next.delete(group.color);
          return next;
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete variants");
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
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Image action failed");
      }
    });
  }

  function handleHexUpdate(variantId: number, hex: string) {
    startTransition(async () => {
      try {
        await updateVariant(variantId, { hexcode: hex });
        toast.success("Color updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update color");
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
            <VariantFormDialog
              open={addDialogOpen}
              onOpenChange={setAddDialogOpen}
              isPending={isPending}
              onBulkCreate={handleBulkCreate}
              onSingleCreate={handleSingleCreate}
            />
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
        {colorGroups.map((group) => (
          <ColorGroupCard
            key={group.color}
            group={group}
            isExpanded={expandedColors.has(group.color)}
            productId={productId}
            isPending={isPending}
            stockEdits={stockEdits}
            editingVariant={editingVariant}
            editForm={editForm}
            onToggleColor={toggleColor}
            onStockChange={handleStockChange}
            onStartEditing={startEditing}
            onSaveVariantEdit={handleSaveVariantEdit}
            onCancelEditing={() => setEditingVariant(null)}
            onEditFormChange={setEditForm}
            onDeleteVariant={handleDeleteVariant}
            onDeleteColorGroup={handleDeleteColorGroup}
            onImageAction={handleImageAction}
            onHexUpdate={handleHexUpdate}
            startTransition={startTransition}
          />
        ))}

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
