"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponActive,
  getProductListForSelector,
  getCouponScope,
} from "@/lib/actions/coupon.actions";
import { getActiveCategoryList } from "@/lib/actions/category.actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import { toast } from "sonner";
import { CouponForm } from "./coupon-form";

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
      // Reset selections on close (will reload on next open if edit)
      if (!isEdit) {
        setSelectedProductIds([]);
        setSelectedCategoryIds([]);
        setScope("all");
      }
    }
  }, [open, isEdit]);

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
          <CouponForm
            coupon={coupon}
            loading={loading}
            scope={scope}
            onScopeChange={setScope}
            allProducts={allProducts}
            allCategories={allCategories}
            selectedProductIds={selectedProductIds}
            selectedCategoryIds={selectedCategoryIds}
            selectorLoading={selectorLoading}
            onToggleProduct={toggleProduct}
            onToggleCategory={toggleCategory}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
