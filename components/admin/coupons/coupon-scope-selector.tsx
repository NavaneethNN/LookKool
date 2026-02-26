"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

type ProductOption = { productId: number; productName: string; productCode: string | null };
type CategoryOption = { categoryId: number; categoryName: string; slug: string };

interface CouponScopeSelectorProps {
  allProducts: ProductOption[];
  allCategories: CategoryOption[];
  selectedProductIds: number[];
  selectedCategoryIds: number[];
  selectorLoading: boolean;
  onToggleProduct: (productId: number) => void;
  onToggleCategory: (categoryId: number) => void;
}

export function CouponScopeSelector({
  allProducts,
  allCategories,
  selectedProductIds,
  selectedCategoryIds,
  selectorLoading,
  onToggleProduct,
  onToggleCategory,
}: CouponScopeSelectorProps) {
  const [productSearch, setProductSearch] = useState("");

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    const q = productSearch.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        (p.productCode && p.productCode.toLowerCase().includes(q))
    );
  }, [allProducts, productSearch]);

  return (
    <div className="space-y-3 rounded-lg border p-3 bg-gray-50/50">
      {selectorLoading ? (
        <p className="text-sm text-gray-500 text-center py-2">Loading products &amp; categories...</p>
      ) : (
        <>
          {/* Categories */}
          {allCategories.length > 0 && (
            <div>
              <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                Categories ({selectedCategoryIds.length} selected)
              </Label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {allCategories.map((cat) => {
                  const sel = selectedCategoryIds.includes(cat.categoryId);
                  return (
                    <button
                      key={cat.categoryId}
                      type="button"
                      onClick={() => onToggleCategory(cat.categoryId)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        sel
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {cat.categoryName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Products */}
          <div>
            <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">
              Products ({selectedProductIds.length} selected)
            </Label>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Selected chips */}
            {selectedProductIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedProductIds.map((pid) => {
                  const prod = allProducts.find((p) => p.productId === pid);
                  return (
                    <span
                      key={pid}
                      className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                    >
                      {prod?.productName ?? `#${pid}`}
                      <button
                        type="button"
                        onClick={() => onToggleProduct(pid)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            <div className="max-h-40 overflow-y-auto border rounded-md bg-white divide-y">
              {filteredProducts.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">No products found</p>
              ) : (
                filteredProducts.map((p) => {
                  const sel = selectedProductIds.includes(p.productId);
                  return (
                    <label
                      key={p.productId}
                      className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-gray-50 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={() => onToggleProduct(p.productId)}
                        className="accent-primary rounded"
                      />
                      <span className="flex-1 truncate">{p.productName}</span>
                      {p.productCode && (
                        <span className="text-xs text-gray-400">{p.productCode}</span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
