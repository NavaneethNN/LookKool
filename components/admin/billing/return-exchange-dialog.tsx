"use client";

import { RotateCcw, ArrowLeftRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InStoreBill } from "./types";

// ─── Props ─────────────────────────────────────────────────────

export type ReturnBillItem = {
  variantId: number;
  productName: string;
  variant: string;
  quantity: number;
  maxQty: number;
  rate: number;
  selected: boolean;
  returnQty: number;
};

export interface ReturnExchangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnBillSearch: string;
  onReturnBillSearchChange: (value: string) => void;
  onSearchReturnBill: () => void;
  returnBill: InStoreBill | null;
  returnBillItems: ReturnBillItem[];
  onReturnBillItemsChange: (items: ReturnBillItem[]) => void;
  returnType: "return" | "exchange";
  onReturnTypeChange: (type: "return" | "exchange") => void;
  returnReason: string;
  onReturnReasonChange: (value: string) => void;
  processingReturn: boolean;
  onProcessReturn: () => void;
}

// ─── Component ─────────────────────────────────────────────────

export function ReturnExchangeDialog({
  open,
  onOpenChange,
  returnBillSearch,
  onReturnBillSearchChange,
  onSearchReturnBill,
  returnBill,
  returnBillItems,
  onReturnBillItemsChange,
  returnType,
  onReturnTypeChange,
  returnReason,
  onReturnReasonChange,
  processingReturn,
  onProcessReturn,
}: ReturnExchangeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-orange-600" /> Return / Exchange
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Search original bill */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Find Original Bill</label>
            <div className="flex gap-2">
              <Input value={returnBillSearch} onChange={(e) => onReturnBillSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearchReturnBill()}
                placeholder="Enter invoice # or phone..." className="flex-1" />
              <Button onClick={onSearchReturnBill} className="bg-primary hover:bg-primary/90">Search</Button>
            </div>
          </div>

          {returnBill && (
            <>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-primary font-mono font-medium">{returnBill.invoiceNumber}</span>
                  <span className="font-semibold">₹{Number(returnBill.totalAmount).toLocaleString("en-IN")}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {returnBill.customerName || "Walk-in"} · {new Date(returnBill.billDate).toLocaleDateString("en-IN")}
                </p>
              </div>

              {/* Return type */}
              <div className="flex gap-3">
                <button onClick={() => onReturnTypeChange("return")}
                  className={`flex-1 p-3 rounded-lg border text-center text-sm font-medium transition-colors ${returnType === "return" ? "border-orange-500 bg-orange-50 text-orange-700" : "hover:bg-gray-50"}`}>
                  <RotateCcw className="w-4 h-4 mx-auto mb-1" /> Refund Return
                </button>
                <button onClick={() => onReturnTypeChange("exchange")}
                  className={`flex-1 p-3 rounded-lg border text-center text-sm font-medium transition-colors ${returnType === "exchange" ? "border-blue-500 bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}>
                  <ArrowLeftRight className="w-4 h-4 mx-auto mb-1" /> Exchange
                </button>
              </div>

              {/* Select items to return */}
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-3 py-2 w-8"></th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700">Product</th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 text-center">Bought</th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 text-center">Return Qty</th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {returnBillItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={item.selected}
                            onChange={(e) => onReturnBillItemsChange(returnBillItems.map((p, i) => i === idx ? { ...p, selected: e.target.checked, returnQty: e.target.checked ? 1 : 0 } : p))} />
                        </td>
                        <td className="px-3 py-2">
                          <p className="text-xs font-medium">{item.productName}</p>
                          <p className="text-xs text-gray-500">{item.variant}</p>
                        </td>
                        <td className="px-3 py-2 text-center text-xs">{item.maxQty}</td>
                        <td className="px-3 py-2 text-center">
                          {item.selected ? (
                            <Input type="number" min={1} max={item.maxQty}
                              value={item.returnQty}
                              onChange={(e) => onReturnBillItemsChange(returnBillItems.map((p, i) => i === idx ? { ...p, returnQty: Math.min(Number(e.target.value), item.maxQty) } : p))}
                              className="h-7 w-14 text-xs text-center mx-auto" />
                          ) : <span className="text-xs text-gray-400">-</span>}
                        </td>
                        <td className="px-3 py-2 text-right text-xs font-medium">
                          {item.selected && item.returnQty > 0 ? `₹${(item.rate * item.returnQty).toFixed(2)}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Refund summary */}
              {returnBillItems.some(i => i.selected && i.returnQty > 0) && (
                <div className="bg-orange-50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between font-semibold">
                    <span>{returnType === "exchange" ? "Exchange Credit" : "Refund Amount"}</span>
                    <span className="text-orange-700">
                      ₹{returnBillItems.filter(i => i.selected && i.returnQty > 0).reduce((s, i) => s + i.rate * i.returnQty, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <Input value={returnReason} onChange={(e) => onReturnReasonChange(e.target.value)} placeholder="Reason for return/exchange (optional)" />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={onProcessReturn} disabled={processingReturn}
                  className={returnType === "exchange" ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-600 hover:bg-orange-700"}>
                  {processingReturn ? "Processing..." : returnType === "exchange" ? "Process Exchange" : "Process Return"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
