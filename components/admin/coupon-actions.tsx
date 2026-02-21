"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponActive,
  getProductListForSelector,
  getActiveCategoryList,
  getCouponScope,
} from "@/lib/actions/admin-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Power, Search, X } from "lucide-react";
import { toast } from "sonner";

type Coupon = {
  couponId: number;
  code: string;
  description: string | null;
  discountType: "percentage" | "fixed_amount";
  discountValue: string;
  minPurchaseAmount: string;
  maxDiscountAmount: string | null;
  validFrom: Date | null;
  validTill: Date | null;
  usageLimitTotal: number | null;
  usageLimitPerCustomer: number | null;
  appliesToAllProducts: boolean;
  isActive: boolean;
  [key: string]: unknown;
};

type ProductOption = { productId: number; productName: string; productCode: string | null };
type CategoryOption = { categoryId: number; categoryName: string; slug: string };

function toDateInput(d: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 16);
}

export function CouponActions({ coupon }: { coupon?: Coupon }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!coupon;

  // Scope state
  const [scope, setScope] = useState<"all" | "restricted">(
    coupon?.appliesToAllProducts !== false ? "all" : "restricted"
  );
  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryOption[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectorLoading, setSelectorLoading] = useState(false);

  // Load product/category lists when dialog opens with "restricted" scope
  useEffect(() => {
    if (!open) return;
    if (scope !== "restricted") return;
    if (allProducts.length > 0) return; // already loaded

    setSelectorLoading(true);
    Promise.all([getProductListForSelector(), getActiveCategoryList()])
      .then(([prods, cats]) => {
        setAllProducts(prods);
        setAllCategories(cats);
      })
      .catch(() => toast.error("Failed to load product/category list"))
      .finally(() => setSelectorLoading(false));
  }, [open, scope, allProducts.length]);

  // Load existing scope when editing a restricted coupon
  useEffect(() => {
    if (!open || !isEdit || coupon.appliesToAllProducts !== false) return;

    getCouponScope(coupon.couponId)
      .then(({ productIds, categoryIds }) => {
        setSelectedProductIds(productIds);
        setSelectedCategoryIds(categoryIds);
      })
      .catch(() => {});
  }, [open, isEdit, coupon?.couponId, coupon?.appliesToAllProducts]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setProductSearch("");
      // Reset selections on close (will reload on next open if edit)
      if (!isEdit) {
        setSelectedProductIds([]);
        setSelectedCategoryIds([]);
        setScope("all");
      }
    }
  }, [open, isEdit]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    const q = productSearch.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        (p.productCode && p.productCode.toLowerCase().includes(q))
    );
  }, [allProducts, productSearch]);

  function toggleProduct(productId: number) {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }

  function toggleCategory(categoryId: number) {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const isRestricted = scope === "restricted";

    if (isRestricted && selectedProductIds.length === 0 && selectedCategoryIds.length === 0) {
      toast.error("Please select at least one product or category for restricted scope");
      setLoading(false);
      return;
    }

    const data = {
      code: fd.get("code") as string,
      description: (fd.get("description") as string) || undefined,
      discountType: fd.get("discountType") as "percentage" | "fixed_amount",
      discountValue: fd.get("discountValue") as string,
      minPurchaseAmount: (fd.get("minPurchaseAmount") as string) || "0",
      maxDiscountAmount: (fd.get("maxDiscountAmount") as string) || undefined,
      validFrom: fd.get("validFrom")
        ? (fd.get("validFrom") as string)
        : undefined,
      validTill: fd.get("validTill")
        ? (fd.get("validTill") as string)
        : undefined,
      usageLimitTotal: fd.get("usageLimitTotal")
        ? Number(fd.get("usageLimitTotal"))
        : undefined,
      usageLimitPerCustomer: fd.get("usageLimitPerCustomer")
        ? Number(fd.get("usageLimitPerCustomer"))
        : undefined,
      appliesToAllProducts: !isRestricted,
      isActive: true,
      productIds: isRestricted ? selectedProductIds : [],
      categoryIds: isRestricted ? selectedCategoryIds : [],
    };

    try {
      if (isEdit) {
        await updateCoupon(coupon.couponId, data);
        toast.success("Coupon updated");
      } else {
        await createCoupon(data);
        toast.success("Coupon created");
      }
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!coupon || !confirm("Delete this coupon permanently?")) return;
    setLoading(true);
    try {
      await deleteCoupon(coupon.couponId);
      toast.success("Coupon deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete coupon");
    }
    setLoading(false);
  }

  async function handleToggle() {
    if (!coupon) return;
    setLoading(true);
    try {
      await toggleCouponActive(coupon.couponId, !coupon.isActive);
      toast.success(coupon.isActive ? "Coupon deactivated" : "Coupon activated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle coupon");
    }
    setLoading(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-1">
          <DialogTrigger asChild>
            {isEdit ? (
              <Button variant="ghost" size="icon" title="Edit coupon">
                <Pencil className="w-4 h-4" />
              </Button>
            ) : (
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-1" /> Add Coupon
              </Button>
            )}
          </DialogTrigger>
          {isEdit && (
            <>
              <Button
                variant="ghost"
                size="icon"
                disabled={loading}
                onClick={handleToggle}
                title={coupon.isActive ? "Deactivate" : "Activate"}
              >
                <Power
                  className={`w-4 h-4 ${
                    coupon.isActive ? "text-green-600" : "text-gray-400"
                  }`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={loading}
                onClick={handleDelete}
                title="Delete coupon"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Coupon" : "Create Coupon"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code *</Label>
                <Input
                  name="code"
                  required
                  defaultValue={coupon?.code}
                  placeholder="SUMMER20"
                  className="uppercase"
                />
              </div>
              <div>
                <Label>Discount Type *</Label>
                <Select
                  name="discountType"
                  defaultValue={coupon?.discountType ?? "percentage"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                name="description"
                defaultValue={coupon?.description ?? ""}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Discount Value *</Label>
                <Input
                  name="discountValue"
                  required
                  type="number"
                  step="0.01"
                  defaultValue={coupon?.discountValue ?? ""}
                />
              </div>
              <div>
                <Label>Min Purchase</Label>
                <Input
                  name="minPurchaseAmount"
                  type="number"
                  step="0.01"
                  defaultValue={coupon?.minPurchaseAmount ?? "0"}
                />
              </div>
              <div>
                <Label>Max Discount</Label>
                <Input
                  name="maxDiscountAmount"
                  type="number"
                  step="0.01"
                  defaultValue={coupon?.maxDiscountAmount ?? ""}
                  placeholder="No cap"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valid From</Label>
                <Input
                  name="validFrom"
                  type="datetime-local"
                  defaultValue={toDateInput(coupon?.validFrom ?? null)}
                />
              </div>
              <div>
                <Label>Valid Till</Label>
                <Input
                  name="validTill"
                  type="datetime-local"
                  defaultValue={toDateInput(coupon?.validTill ?? null)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Usage Limit</Label>
                <Input
                  name="usageLimitTotal"
                  type="number"
                  defaultValue={coupon?.usageLimitTotal ?? ""}
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <Label>Per Customer Limit</Label>
                <Input
                  name="usageLimitPerCustomer"
                  type="number"
                  defaultValue={coupon?.usageLimitPerCustomer ?? ""}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div>
              <Label>Scope</Label>
              <Select
                name="scope"
                value={scope}
                onValueChange={(v) => setScope(v as "all" | "restricted")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="restricted">Specific Products / Categories</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ── Product / Category selector ── */}
            {scope === "restricted" && (
              <div className="space-y-3 rounded-lg border p-3 bg-gray-50/50">
                {selectorLoading ? (
                  <p className="text-sm text-gray-500 text-center py-2">Loading products &amp; categories…</p>
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
                                onClick={() => toggleCategory(cat.categoryId)}
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
                          placeholder="Search products…"
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
                                  onClick={() => toggleProduct(pid)}
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
                                  onChange={() => toggleProduct(p.productId)}
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
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90"
              >
                {loading
                  ? "Saving..."
                  : isEdit
                  ? "Update Coupon"
                  : "Create Coupon"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
