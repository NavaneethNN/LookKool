"use client";

import { Tag, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Types ───────────────────────────────────────────────────

export interface CouponApplied {
  discount: number;
  description: string;
}

interface CouponInputProps {
  couponCode: string;
  onCouponCodeChange: (code: string) => void;
  couponApplied: CouponApplied | null;
  couponLoading: boolean;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
}

// ── Component ───────────────────────────────────────────────

export function CouponInput({
  couponCode,
  onCouponCodeChange,
  couponApplied,
  couponLoading,
  onApplyCoupon,
  onRemoveCoupon,
}: CouponInputProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Tag className="h-5 w-5 text-primary" />
          Coupon Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        {couponApplied ? (
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {couponApplied.description}
              </span>
              <Badge variant="secondary" className="text-xs">
                -₹{couponApplied.discount.toLocaleString("en-IN")}
              </Badge>
            </div>
            <button
              onClick={onRemoveCoupon}
              className="text-muted-foreground hover:text-destructive transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
              className="uppercase"
            />
            <Button
              variant="outline"
              onClick={onApplyCoupon}
              disabled={couponLoading || !couponCode.trim()}
            >
              {couponLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Apply"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
