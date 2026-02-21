"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  toggleProductActive,
  deleteProduct,
  duplicateProduct,
  bulkDeleteProducts,
  bulkToggleProductsActive,
  bulkUpdateProductCategory,
} from "@/lib/actions/admin-actions";
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
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Search,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
  X,
  Filter,
  Package,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";

interface ProductVariant {
  variantId: number;
  color: string;
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

interface Category {
  categoryId: number;
  categoryName: string;
}

interface ProductsListProps {
  products: Product[];
  categories: Category[];
  total: number;
  page: number;
  totalPages: number;
  currentFilters: {
    search?: string;
    category?: string;
    status?: string;
    sort?: string;
    order?: string;
  };
}

export function ProductsList({
  products,
  categories,
  total,
  page,
  totalPages,
  currentFilters,
}: ProductsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [searchInput, setSearchInput] = useState(currentFilters.search ?? "");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // ── URL Navigation Helpers ──────────────────────────────
  const buildUrl = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams();
      const merged = { ...currentFilters, ...overrides };

      if (merged.search) params.set("search", merged.search);
      if (merged.category) params.set("category", merged.category);
      if (merged.status) params.set("status", merged.status);
      if (merged.sort) params.set("sort", merged.sort);
      if (merged.order) params.set("order", merged.order);
      if (overrides.page && overrides.page !== "1")
        params.set("page", overrides.page);

      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [currentFilters, pathname]
  );

  // ── Selection ───────────────────────────────────────────
  const allSelected =
    products.length > 0 && selected.size === products.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p.productId)));
    }
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Product Image Thumbnail ─────────────────────────────
  function getThumb(product: Product) {
    for (const v of product.variants) {
      if (v.images?.length > 0) return v.images[0].imagePath;
    }
    return null;
  }

  // ── Stock Info ──────────────────────────────────────────
  function getStockInfo(product: Product) {
    const total = product.variants.reduce(
      (s, v) => s + v.stockCount,
      0
    );
    const outOfStock = product.variants.filter(
      (v) => v.stockCount === 0
    ).length;
    return { total, outOfStock, variantCount: product.variants.length };
  }

  // ── Sort Header ─────────────────────────────────────────
  function SortHeader({
    label,
    field,
  }: {
    label: string;
    field: string;
  }) {
    const active = currentFilters.sort === field;
    const dir = active ? currentFilters.order : undefined;

    return (
      <button
        onClick={() =>
          router.push(
            buildUrl({
              sort: field,
              order: active && dir === "asc" ? "desc" : "asc",
              page: "1",
            })
          )
        }
        className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-900 transition-colors"
      >
        {label}
        {active ? (
          dir === "desc" ? (
            <ArrowDown className="w-3.5 h-3.5" />
          ) : (
            <ArrowUp className="w-3.5 h-3.5" />
          )
        ) : (
          <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />
        )}
      </button>
    );
  }

  // ── Actions ─────────────────────────────────────────────
  function handleToggleActive(id: number, currentActive: boolean) {
    startTransition(async () => {
      try {
        await toggleProductActive(id, !currentActive);
        toast.success("Status updated");
      } catch {
        toast.error("Failed to update status");
      }
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      try {
        await deleteProduct(id);
        setDeleteConfirm(null);
        setSelected((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
        toast.success("Product deleted");
      } catch {
        toast.error("Failed to delete product");
      }
    });
  }

  function handleDuplicate(id: number) {
    startTransition(async () => {
      try {
        const p = await duplicateProduct(id);
        toast.success("Product duplicated");
        router.push(`/studio/products/${p.productId}`);
      } catch {
        toast.error("Failed to duplicate product");
      }
    });
  }

  function handleBulkActivate(active: boolean) {
    startTransition(async () => {
      try {
        await bulkToggleProductsActive(Array.from(selected), active);
        setSelected(new Set());
        toast.success(
          `${selected.size} products ${active ? "activated" : "deactivated"}`
        );
      } catch {
        toast.error("Bulk action failed");
      }
    });
  }

  function handleBulkDelete() {
    startTransition(async () => {
      try {
        await bulkDeleteProducts(Array.from(selected));
        setSelected(new Set());
        setBulkDeleteConfirm(false);
        toast.success("Products deleted");
      } catch {
        toast.error("Bulk delete failed");
      }
    });
  }

  function handleBulkCategory(catId: number) {
    startTransition(async () => {
      try {
        await bulkUpdateProductCategory(Array.from(selected), catId);
        setSelected(new Set());
        toast.success("Category updated for selected products");
      } catch {
        toast.error("Failed to update category");
      }
    });
  }

  // Discount percentage
  function discountPct(base: string, mrp: string) {
    const b = Number(base);
    const m = Number(mrp);
    if (m <= b || m === 0) return 0;
    return Math.round(((m - b) / m) * 100);
  }

  return (
    <div className="space-y-4">
      {/* ── Toolbar ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                router.push(
                  buildUrl({
                    search: searchInput || undefined,
                    page: "1",
                  })
                );
              }
            }}
            placeholder="Search by name or code..."
            className="w-full h-10 rounded-lg border border-input bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                router.push(buildUrl({ search: undefined, page: "1" }));
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={currentFilters.category ?? ""}
            onChange={(e) =>
              router.push(
                buildUrl({
                  category: e.target.value || undefined,
                  page: "1",
                })
              )
            }
            className="h-9 rounded-lg border border-input bg-white px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.categoryName}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={currentFilters.status ?? ""}
            onChange={(e) =>
              router.push(
                buildUrl({
                  status: e.target.value || undefined,
                  page: "1",
                })
              )
            }
            className="h-9 rounded-lg border border-input bg-white px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Active filters indicator */}
          {(currentFilters.search ||
            currentFilters.category ||
            currentFilters.status) && (
            <button
              onClick={() =>
                router.push(
                  buildUrl({
                    search: undefined,
                    category: undefined,
                    status: undefined,
                    page: "1",
                  })
                )
              }
              className="inline-flex items-center gap-1.5 h-9 px-3 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              Clear filters
            </button>
          )}

          {/* Sort */}
          <select
            value={
              currentFilters.sort
                ? `${currentFilters.sort}-${currentFilters.order || "asc"}`
                : ""
            }
            onChange={(e) => {
              if (!e.target.value) {
                router.push(
                  buildUrl({
                    sort: undefined,
                    order: undefined,
                    page: "1",
                  })
                );
              } else {
                const [sort, order] = e.target.value.split("-");
                router.push(buildUrl({ sort, order, page: "1" }));
              }
            }}
            className="h-9 rounded-lg border border-input bg-white px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Sort: Priority</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="code-asc">Code A–Z</option>
          </select>
        </div>
      </div>

      {/* ── Bulk Action Bar ────────────────────────────── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-5 py-3 animate-in slide-in-from-top-2">
          <span className="text-sm font-medium text-primary">
            {selected.size} selected
          </span>
          <div className="h-5 w-px bg-primary/20" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkActivate(true)}
            disabled={isPending}
            className="h-8 text-xs"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Activate
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkActivate(false)}
            disabled={isPending}
            className="h-8 text-xs"
          >
            <EyeOff className="w-3.5 h-3.5 mr-1" />
            Deactivate
          </Button>

          {/* Bulk Category Change */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                className="h-8 text-xs"
              >
                Move to category
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
              {categories.map((cat) => (
                <DropdownMenuItem
                  key={cat.categoryId}
                  onClick={() => handleBulkCategory(cat.categoryId)}
                >
                  {cat.categoryName}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto" />
          {!bulkDeleteConfirm ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkDeleteConfirm(true)}
              disabled={isPending}
              className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-medium">
                Delete {selected.size} products?
              </span>
              <Button
                size="sm"
                onClick={handleBulkDelete}
                disabled={isPending}
                className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkDeleteConfirm(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          )}
          <button
            onClick={() => {
              setSelected(new Set());
              setBulkDeleteConfirm(false);
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Stats Strip ────────────────────────────────── */}
      <div className="flex gap-4 text-sm text-gray-500">
        <span>
          <span className="font-medium text-gray-900">{total}</span> products
        </span>
        <span>·</span>
        <span>
          <span className="font-medium text-gray-900">
            {products.filter((p) => p.isActive).length}
          </span>{" "}
          active on this page
        </span>
        {products.some(
          (p) =>
            p.variants.length > 0 &&
            p.variants.reduce((s, v) => s + v.stockCount, 0) === 0
        ) && (
          <>
            <span>·</span>
            <span className="text-red-500 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Some products are out of stock
            </span>
          </>
        )}
      </div>

      {/* ── Products Table ─────────────────────────────── */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="w-10 px-4 py-3">
                  <button onClick={toggleAll} className="text-gray-400 hover:text-gray-600">
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : someSelected ? (
                      <div className="w-4 h-4 border-2 border-primary rounded-sm bg-primary/20" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <SortHeader label="Product" field="name" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-4 py-3">
                  <SortHeader label="Price" field="price" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variants
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => {
                const thumb = getThumb(product);
                const stock = getStockInfo(product);
                const disc = discountPct(product.basePrice, product.mrp);
                const isSelected = selected.has(product.productId);

                return (
                  <tr
                    key={product.productId}
                    className={`group transition-colors ${
                      isSelected
                        ? "bg-primary/[0.03]"
                        : "hover:bg-gray-50/50"
                    } ${deleteConfirm === product.productId ? "bg-red-50/50" : ""}`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <button onClick={() => toggleOne(product.productId)}>
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
                        {product.category?.categoryName ?? "—"}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        ₹{Number(product.basePrice).toLocaleString("en-IN")}
                      </p>
                      {disc > 0 && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-xs text-gray-400 line-through">
                            ₹{Number(product.mrp).toLocaleString("en-IN")}
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
                                  )?.color ?? "#ccc";
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
                          handleToggleActive(product.productId, product.isActive)
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
                              handleDelete(product.productId)
                            }
                            disabled={isPending}
                            className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                          >
                            Yes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteConfirm(null)}
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
                                handleDuplicate(product.productId)
                              }
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleActive(product.productId, product.isActive)
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
                                setDeleteConfirm(product.productId)
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
              })}

              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center"
                  >
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 mb-1">
                      No products found
                    </p>
                    <p className="text-xs text-gray-300">
                      Try adjusting your search or filters
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ───────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50/50">
            <p className="text-sm text-gray-500">
              Page <span className="font-medium">{page}</span> of{" "}
              <span className="font-medium">{totalPages}</span>{" "}
              <span className="text-gray-400">({total} total)</span>
            </p>
            <div className="flex gap-1">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Link>
              )}

              {/* Page numbers */}
              <div className="hidden sm:flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - page) <= 1
                  )
                  .map((p, i, arr) => (
                    <span key={p} className="flex items-center">
                      {i > 0 && arr[i - 1] !== p - 1 && (
                        <span className="px-1 text-gray-400 text-xs">
                          …
                        </span>
                      )}
                      <Link
                        href={buildUrl({ page: String(p) })}
                        className={`w-8 h-8 flex items-center justify-center text-sm rounded-lg transition-colors ${
                          p === page
                            ? "bg-primary text-white"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p}
                      </Link>
                    </span>
                  ))}
              </div>

              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
