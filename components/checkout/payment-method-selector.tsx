"use client";

import { CreditCard, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Types ───────────────────────────────────────────────────

export type PaymentMethod = "razorpay" | "cod";

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  onChangePaymentMethod: (method: PaymentMethod) => void;
  codEnabled: boolean;
}

// ── Component ───────────────────────────────────────────────

export function PaymentMethodSelector({
  paymentMethod,
  onChangePaymentMethod,
  codEnabled,
}: PaymentMethodSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-primary" />
          Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label
          className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-all ${
            paymentMethod === "razorpay"
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "hover:border-muted-foreground/30"
          }`}
        >
          <input
            type="radio"
            name="payment"
            value="razorpay"
            checked={paymentMethod === "razorpay"}
            onChange={() => onChangePaymentMethod("razorpay")}
            className="h-4 w-4 accent-primary"
          />
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <div>
            <span className="font-medium text-sm">Pay Online</span>
            <p className="text-xs text-muted-foreground">
              UPI, Credit/Debit Card, Net Banking, Wallets
            </p>
          </div>
        </label>

        {codEnabled && (
          <label
            className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-all ${
              paymentMethod === "cod"
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "hover:border-muted-foreground/30"
            }`}
          >
            <input
              type="radio"
              name="payment"
              value="cod"
              checked={paymentMethod === "cod"}
              onChange={() => onChangePaymentMethod("cod")}
              className="h-4 w-4 accent-primary"
            />
            <Banknote className="h-5 w-5 text-muted-foreground" />
            <div>
              <span className="font-medium text-sm">Cash on Delivery</span>
              <p className="text-xs text-muted-foreground">
                Pay when you receive your order
              </p>
            </div>
          </label>
        )}
      </CardContent>
    </Card>
  );
}
