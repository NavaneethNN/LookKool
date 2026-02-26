"use client";

import { IndianRupee, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SplitPayment } from "./types";

// ─── Props ─────────────────────────────────────────────────────

export interface PaymentSectionProps {
  useSplitPayment: boolean;
  onToggleSplitPayment: () => void;
  paymentMode: string;
  onPaymentModeChange: (value: string) => void;
  splitPayments: SplitPayment[];
  onAddSplitPayment: () => void;
  onRemoveSplitPayment: (idx: number) => void;
  onUpdateSplitPayment: (idx: number, field: keyof SplitPayment, value: string) => void;
  splitPaymentTotal: number;
  roundedTotal: number;
  discount: string;
  onDiscountChange: (value: string) => void;
  discountType: "flat" | "percent";
  onDiscountTypeChange: (value: "flat" | "percent") => void;
  notes: string;
  onNotesChange: (value: string) => void;
}

// ─── Component ─────────────────────────────────────────────────

export function PaymentSection({
  useSplitPayment,
  onToggleSplitPayment,
  paymentMode,
  onPaymentModeChange,
  splitPayments,
  onAddSplitPayment,
  onRemoveSplitPayment,
  onUpdateSplitPayment,
  splitPaymentTotal,
  roundedTotal,
  discount,
  onDiscountChange,
  discountType,
  onDiscountTypeChange,
  notes,
  onNotesChange,
}: PaymentSectionProps) {
  return (
    <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <IndianRupee className="w-4 h-4" /> Payment
      </div>
      <div className="space-y-3">
        {/* Split payment toggle */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500">Split Payment</label>
          <button
            onClick={onToggleSplitPayment}
            className={`relative w-10 h-5 rounded-full transition-colors ${useSplitPayment ? "bg-primary" : "bg-gray-200"}`}
          >
            <span className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform ${useSplitPayment ? "left-5" : "left-0.5"}`} />
          </button>
        </div>

        {!useSplitPayment ? (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Payment Mode</label>
            <Select value={paymentMode} onValueChange={onPaymentModeChange}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            {splitPayments.map((sp, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Select value={sp.paymentMode} onValueChange={(v) => onUpdateSplitPayment(idx, "paymentMode", v)}>
                  <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number" min="0" step="0.01" placeholder="₹ Amount"
                  value={sp.amount}
                  onChange={(e) => onUpdateSplitPayment(idx, "amount", e.target.value)}
                  className="h-8 text-xs flex-1"
                />
                {splitPayments.length > 1 && (
                  <button onClick={() => onRemoveSplitPayment(idx)} className="text-red-400 hover:text-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={onAddSplitPayment} className="text-xs h-7">+ Add</Button>
              <span className={`text-xs font-medium ${Math.abs(splitPaymentTotal - roundedTotal) > 1 ? "text-red-500" : "text-green-600"}`}>
                ₹{splitPaymentTotal.toFixed(0)} / ₹{roundedTotal}
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Discount</label>
          <div className="flex gap-2">
            <Input
              value={discount}
              onChange={(e) => onDiscountChange(e.target.value)}
              placeholder="0"
              type="number"
              min="0"
              step="0.01"
              className="h-10 flex-1"
            />
            <Select value={discountType} onValueChange={(v) => onDiscountTypeChange(v as "flat" | "percent")}>
              <SelectTrigger className="h-10 w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">₹</SelectItem>
                <SelectItem value="percent">%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Notes</label>
          <Input value={notes} onChange={(e) => onNotesChange(e.target.value)} placeholder="Optional notes..." className="h-10" />
        </div>
      </div>
    </div>
  );
}
