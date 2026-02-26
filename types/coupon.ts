// Shared coupon types

export type DiscountType = "percentage" | "fixed_amount";

export interface Coupon {
  couponId: number;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: string;
  minPurchaseAmount: string;
  maxDiscountAmount: string | null;
  validFrom: Date | string | null;
  validTill: Date | string | null;
  usageLimitTotal: number | null;
  usageLimitPerCustomer: number | null;
  usedCount: number;
  appliesToAllProducts: boolean;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CouponScope {
  productIds: number[];
  categoryIds: number[];
}
