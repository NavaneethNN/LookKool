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
} from "@/lib/actions/product.actions";
import { toast } from "sonner";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
  Package,
  AlertTriangle,
} from "lucide-react";

import { ProductFilters } from "./product-filters";
import { BulkActionsToolbar } from "./bulk-actions-toolbar";
import { ProductTableRow } from "./product-table-row";

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
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update status");
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
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete product");
      }
    });
  }

  function handleDuplicate(id: number) {
    startTransition(async () => {
      try {
        const p = await duplicateProduct(id);
        toast.success("Product duplicated");
        router.push(`/studio/products/${p.productId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to duplicate product");
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
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Bulk action failed");
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
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Bulk delete failed");
      }
    });
  }

  function handleBulkCategory(catId: number) {
    startTransition(async () => {
      try {
        await bulkUpdateProductCategory(Array.from(selected), catId);
        setSelected(new Set());
        toast.success("Category updated for selected products");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update category");
      }
    });
  }

  // ── Filter Handlers ─────────────────────────────────────
  function handleSearchSubmit() {
    router.push(
      buildUrl({
        search: searchInput || undefined,
        page: "1",
      })
    );
  }

  function handleSearchClear() {
    setSearchInput("");
    router.push(buildUrl({ search: undefined, page: "1" }));
  }

  function handleCategoryChange(value: string) {
    router.push(
      buildUrl({
        category: value || undefined,
        page: "1",
      })
    );
  }

  function handleStatusChange(value: string) {
    router.push(
      buildUrl({
        status: value || undefined,
        page: "1",
      })
    );
  }

  function handleSortChange(value: string) {
    if (!value) {
      router.push(
        buildUrl({
          sort: undefined,
          order: undefined,
          page: "1",
        })
      );
    } else {
      const [sort, order] = value.split("-");
      router.push(buildUrl({ sort, order, page: "1" }));
    }
  }

  function handleClearFilters() {
    router.push(
      buildUrl({
        search: undefined,
        category: undefined,
        status: undefined,
        page: "1",
      })
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Toolbar ────────────────────────────────────── */}
      <ProductFilters
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
        onSearchClear={handleSearchClear}
        currentFilters={currentFilters}
        categories={categories}
        onCategoryChange={handleCategoryChange}
        onStatusChange={handleStatusChange}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
      />

      {/* ── Bulk Action Bar ────────────────────────────── */}
      <BulkActionsToolbar
        selectedCount={selected.size}
        isPending={isPending}
        bulkDeleteConfirm={bulkDeleteConfirm}
        categories={categories}
        onBulkActivate={handleBulkActivate}
        onBulkCategory={handleBulkCategory}
        onBulkDeleteRequest={() => setBulkDeleteConfirm(true)}
        onBulkDeleteConfirm={handleBulkDelete}
        onBulkDeleteCancel={() => setBulkDeleteConfirm(false)}
        onClearSelection={() => {
          setSelected(new Set());
          setBulkDeleteConfirm(false);
        }}
      />

      {/* ── Stats Strip ────────────────────────────────── */}
      <div className="flex gap-4 text-sm text-gray-500">
        <span>
          <span className="font-medium text-gray-900">{total}</span> products
        </span>
        <span>&middot;</span>
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
            <span>&middot;</span>
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
              {products.map((product) => (
                <ProductTableRow
                  key={product.productId}
                  product={product}
                  isSelected={selected.has(product.productId)}
                  deleteConfirm={deleteConfirm}
                  isPending={isPending}
                  onToggleSelect={toggleOne}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onSetDeleteConfirm={setDeleteConfirm}
                />
              ))}

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
                          ...
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
