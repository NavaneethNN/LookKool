"use client";

import { ImageIcon, Palette } from "lucide-react";
import { MultiImageUpload } from "../image-upload";
import { ImageColorPicker } from "../image-color-picker";

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

export interface VariantImageManagerProps {
  group: ColorGroup;
  primaryVariant: Variant;
  variantImageUrls: string[];
  productId: number;
  onImageAction: (
    variant: Variant,
    action:
      | { type: "add"; url: string }
      | { type: "remove"; id?: number; url: string }
      | { type: "primary"; id?: number; url: string }
  ) => void;
  onHexUpdate: (variantId: number, hex: string) => void;
}

// ─── Component ────────────────────────────────────────────────

export function VariantImageManager({
  group,
  primaryVariant,
  variantImageUrls,
  productId,
  onImageAction,
  onHexUpdate,
}: VariantImageManagerProps) {
  return (
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
              onImageAction(primaryVariant, action)
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
                onHexUpdate(v.variantId, hex);
              }
            }}
            imageUrls={variantImageUrls}
          />
        </div>
      </div>
    </div>
  );
}
