"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CouponScopeSelector } from "./coupon-scope-selector";

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

interface CouponFormProps {
  coupon?: Coupon;
  loading: boolean;
  scope: "all" | "restricted";
  onScopeChange: (scope: "all" | "restricted") => void;
  allProducts: ProductOption[];
  allCategories: CategoryOption[];
  selectedProductIds: number[];
  selectedCategoryIds: number[];
  selectorLoading: boolean;
  onToggleProduct: (productId: number) => void;
  onToggleCategory: (categoryId: number) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export function CouponForm({
  coupon,
  loading,
  scope,
  onScopeChange,
  allProducts,
  allCategories,
  selectedProductIds,
  selectedCategoryIds,
  selectorLoading,
  onToggleProduct,
  onToggleCategory,
  onSubmit,
  onCancel,
}: CouponFormProps) {
  const isEdit = !!coupon;

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-2">
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
          onValueChange={(v) => onScopeChange(v as "all" | "restricted")}
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

      {/* Product / Category selector */}
      {scope === "restricted" && (
        <CouponScopeSelector
          allProducts={allProducts}
          allCategories={allCategories}
          selectedProductIds={selectedProductIds}
          selectedCategoryIds={selectedCategoryIds}
          selectorLoading={selectorLoading}
          onToggleProduct={onToggleProduct}
          onToggleCategory={onToggleCategory}
        />
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
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
  );
}
