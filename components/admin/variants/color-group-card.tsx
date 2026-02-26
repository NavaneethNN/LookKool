"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ImageIcon,
  Edit2,
  Check,
  X,
} from "lucide-react";
import Image from "next/image";
import { createVariant } from "@/lib/actions/product.actions";
import { VariantImageManager } from "./variant-image-manager";
import { VariantStockEditor, getStockColor } from "./variant-stock-editor";
import { VariantPriceEditor } from "./variant-price-editor";

// ─── Types ────────────────────────────────────────────────────

export interface VariantImage {
  imageId: number;
  imagePath: string;
  isPrimary: boolean;
}

export interface Variant {
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

export interface ColorGroup {
  color: string;
  hexcode: string | null;
  variants: Variant[];
  totalStock: number;
  outOfStockCount: number;
  images: VariantImage[];
}

function getStockBadge(stock: number): string {
  if (stock === 0) return "bg-red-100 text-red-700 border-red-200";
  if (stock <= 5) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-green-100 text-green-700 border-green-200";
}

export interface ColorGroupCardProps {
  group: ColorGroup;
  isExpanded: boolean;
  productId: number;
  isPending: boolean;
  stockEdits: Record<number, number>;
  editingVariant: number | null;
  editForm: {
    sku: string;
    priceModifier: string;
    price: string;
    mrp: string;
  };
  onToggleColor: (color: string) => void;
  onStockChange: (variantId: number, value: string) => void;
  onStartEditing: (variant: Variant) => void;
  onSaveVariantEdit: (variantId: number) => void;
  onCancelEditing: () => void;
  onEditFormChange: (
    updater: (prev: { sku: string; priceModifier: string; price: string; mrp: string }) => {
      sku: string;
      priceModifier: string;
      price: string;
      mrp: string;
    }
  ) => void;
  onDeleteVariant: (variantId: number) => void;
  onDeleteColorGroup: (group: ColorGroup) => void;
  onImageAction: (
    variant: Variant,
    action:
      | { type: "add"; url: string }
      | { type: "remove"; id?: number; url: string }
      | { type: "primary"; id?: number; url: string }
  ) => void;
  onHexUpdate: (variantId: number, hex: string) => void;
  startTransition: (callback: () => Promise<void>) => void;
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
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add size");
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

// ─── Main Component ───────────────────────────────────────────

export function ColorGroupCard({
  group,
  isExpanded,
  productId,
  isPending,
  stockEdits,
  editingVariant,
  editForm,
  onToggleColor,
  onStockChange,
  onStartEditing,
  onSaveVariantEdit,
  onCancelEditing,
  onEditFormChange,
  onDeleteVariant,
  onDeleteColorGroup,
  onImageAction,
  onHexUpdate,
  startTransition,
}: ColorGroupCardProps) {
  // Use first variant for image management
  const primaryVariant = group.variants[0];
  const variantImageUrls = group.images.map((img) => img.imagePath);

  return (
    <div key={group.color}>
      {/* ── Color Header ────────────────────────── */}
      <button
        type="button"
        onClick={() => onToggleColor(group.color)}
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
          <VariantImageManager
            group={group}
            primaryVariant={primaryVariant}
            variantImageUrls={variantImageUrls}
            productId={productId}
            onImageAction={onImageAction}
            onHexUpdate={onHexUpdate}
          />

          {/* ── Size Grid ─────────────────────────── */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">
                Sizes &amp; Stock
              </h4>
              <button
                type="button"
                onClick={() => onDeleteColorGroup(group)}
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
                            onClick={() => onStartEditing(variant)}
                            className="p-1 text-gray-400 hover:text-primary rounded transition-colors"
                            title="Edit SKU & price"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            onDeleteVariant(variant.variantId)
                          }
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Stock editor */}
                    <VariantStockEditor
                      variantId={variant.variantId}
                      size={variant.size}
                      stockCount={variant.stockCount}
                      currentStock={currentStock}
                      hasEdit={hasEdit}
                      onStockChange={onStockChange}
                    />

                    {/* Price editor / metadata */}
                    <VariantPriceEditor
                      variantId={variant.variantId}
                      sku={variant.sku}
                      price={variant.price}
                      mrp={variant.mrp}
                      isEditing={isEditing}
                      editForm={editForm}
                      isPending={isPending}
                      onEditFormChange={onEditFormChange}
                      onSave={onSaveVariantEdit}
                      onCancel={onCancelEditing}
                    />
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
}
