"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  ImageIcon,
} from "lucide-react";

interface ProductVariant {
  variantId: number;
  color: string;
  hexcode: string | null;
  size: string;
  stockCount: number;
  images: { imagePath: string }[];
}

interface Product {
  productId: number;
  productName: string;
  slug: string;
  productCode: string;
  basePrice: string;
  mrp: string;
  label: string | null;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  category: { categoryName: string } | null;
  variants: ProductVariant[];
}

interface ProductTableRowProps {
  product: Product;
  isSelected: boolean;
  deleteConfirm: number | null;
  isPending: boolean;
  onToggleSelect: (id: number) => void;
  onToggleActive: (id: number, currentActive: boolean) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onSetDeleteConfirm: (id: number | null) => void;
}

function getThumb(product: Product) {
  for (const v of product.variants) {
    if (v.images?.length > 0) return v.images[0].imagePath;
  }
  return null;
}

function getStockInfo(product: Product) {
  const total = product.variants.reduce((s, v) => s + v.stockCount, 0);
  const outOfStock = product.variants.filter(
    (v) => v.stockCount === 0
  ).length;
  return { total, outOfStock, variantCount: product.variants.length };
}

function discountPct(base: string, mrp: string) {
  const b = Number(base);
  const m = Number(mrp);
  if (m <= b || m === 0) return 0;
  return Math.round(((m - b) / m) * 100);
}

export function ProductTableRow({
  product,
  isSelected,
  deleteConfirm,
  isPending,
  onToggleSelect,
  onToggleActive,
  onDelete,
  onDuplicate,
  onSetDeleteConfirm,
}: ProductTableRowProps) {
  const thumb = getThumb(product);
  const stock = getStockInfo(product);
  const disc = discountPct(product.basePrice, product.mrp);

  return (
    <tr
      className={`group transition-colors ${
        isSelected
          ? "bg-primary/[0.03]"
          : "hover:bg-gray-50/50"
      } ${deleteConfirm === product.productId ? "bg-red-50/50" : ""}`}
    >
      {/* Checkbox */}
      <td className="px-4 py-3">
        <button onClick={() => onToggleSelect(product.productId)}>
          {isSelected ? (
            <CheckSquare className="w-4 h-4 text-primary" />
          ) : (
            <Square className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
          )}
        </button>
      </td>

      {/* Product Name + Thumbnail + Code */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Thumbnail */}
          <div className="w-11 h-11 rounded-lg bg-gray-100 border overflow-hidden flex-shrink-0 flex items-center justify-center">
            {thumb ? (
              <Image
                src={thumb}
                alt={product.productName}
                width={44}
                height={44}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-5 h-5 text-gray-300" />
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/studio/products/${product.productId}`}
              className="text-sm font-medium text-gray-900 hover:text-primary truncate block max-w-[240px]"
            >
              {product.productName}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400 font-mono">
                {product.productCode}
              </span>
              {product.label && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4 bg-purple-50 text-purple-700 border-0"
                >
                  {product.label}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3">
        <span className="text-sm text-gray-600">
          {product.category?.categoryName ?? "\u2014"}
        </span>
      </td>

      {/* Price */}
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-gray-900">
          \u20B9{Number(product.basePrice).toLocaleString("en-IN")}
        </p>
        {disc > 0 && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs text-gray-400 line-through">
              \u20B9{Number(product.mrp).toLocaleString("en-IN")}
            </p>
            <Badge
              variant="secondary"
              className="text-[10px] px-1 py-0 h-4 bg-green-50 text-green-700 border-0"
            >
              {disc}% off
            </Badge>
          </div>
        )}
      </td>

      {/* Variants */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-gray-600">
            {stock.variantCount}
          </span>
          {/* Color dots */}
          {product.variants.length > 0 && (
            <div className="flex -space-x-1">
              {Array.from(
                new Set(
                  product.variants
                    .filter((v) => v.color)
                    .map((v) => v.color)
                )
              )
                .slice(0, 4)
                .map((color, i) => {
                  const hex =
                    product.variants.find(
                      (v) => v.color === color
                    )?.hexcode ?? "#ccc";
                  return (
                    <div
                      key={i}
                      className="w-3.5 h-3.5 rounded-full border border-white shadow-sm"
                      style={{
                        backgroundColor: hex.startsWith("#")
                          ? hex
                          : "#ccc",
                      }}
                      title={color}
                    />
                  );
                })}
            </div>
          )}
        </div>
      </td>

      {/* Stock */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-sm font-medium ${
              stock.total === 0
                ? "text-red-600"
                : stock.total <= 10
                ? "text-amber-600"
                : "text-green-600"
            }`}
          >
            {stock.total}
          </span>
          {stock.outOfStock > 0 &&
            stock.variantCount > 0 && (
              <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                {stock.outOfStock} OOS
              </span>
            )}
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <button
          onClick={() =>
            onToggleActive(product.productId, product.isActive)
          }
          disabled={isPending}
          className="cursor-pointer"
          title="Click to toggle"
        >
          <StatusBadge
            status={
              product.isActive ? "Active" : "Inactive"
            }
          />
        </button>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        {deleteConfirm === product.productId ? (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-red-600 font-medium">
              Delete?
            </span>
            <Button
              size="sm"
              onClick={() =>
                onDelete(product.productId)
              }
              disabled={isPending}
              className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSetDeleteConfirm(null)}
              className="h-7 text-xs"
            >
              No
            </Button>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link
                  href={`/studio/products/${product.productId}`}
                  className="flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Product
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  onDuplicate(product.productId)
                }
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  onToggleActive(product.productId, product.isActive)
                }
              >
                {product.isActive ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/products/${product.slug}`}
                  target="_blank"
                  className="flex items-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View on Store
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  onSetDeleteConfirm(product.productId)
                }
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  );
}
