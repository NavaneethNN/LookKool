"use client";

import {
  Plus,
  Minus,
  Trash2,
  X,
  ShoppingBag,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CartItem } from "./types";

// ─── Cart Items Props ──────────────────────────────────────────

export interface CartItemsListProps {
  cart: CartItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onUpdateItemDiscount: (id: string, discountVal: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

// ─── Cart Items Component (left column) ────────────────────────

export function CartItemsList({
  cart,
  onUpdateQty,
  onUpdateItemDiscount,
  onRemoveItem,
  onClearCart,
}: CartItemsListProps) {
  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50/50 rounded-t-xl">
        <h3 className="text-sm font-semibold text-gray-900">Cart ({cart.length} items)</h3>
        {cart.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearCart} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </Button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <ShoppingBag className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">Cart is empty</p>
          <p className="text-xs mt-1">Scan barcode or search products above</p>
        </div>
      ) : (
        <div className="divide-y">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">{item.color} / {item.size}</span>
                  {item.sku && <span className="text-xs text-gray-400">SKU: {item.sku}</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">₹{item.price.toLocaleString("en-IN")} × {item.quantity}</span>
                  {/* Per-item discount */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">Disc:</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={item.itemDiscount || ""}
                      onChange={(e) => onUpdateItemDiscount(item.id, Number(e.target.value) || 0)}
                      className="w-14 h-5 text-xs border rounded px-1 text-center"
                      placeholder="₹0"
                    />
                  </div>
                </div>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateQty(item.id, -1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border hover:bg-gray-100 transition-colors"
                  disabled={item.quantity <= 1}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQty(item.id, 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border hover:bg-gray-100 transition-colors"
                  disabled={item.quantity >= item.maxStock}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Amount */}
              <div className="text-right shrink-0 w-20">
                <p className="text-sm font-semibold text-gray-900">₹{((item.price - item.itemDiscount) * item.quantity).toLocaleString("en-IN")}</p>
                {item.itemDiscount > 0 && (
                  <p className="text-xs text-green-600 line-through">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                )}
              </div>

              {/* Remove */}
              <button onClick={() => onRemoveItem(item.id)} className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Bill Summary Props ────────────────────────────────────────

export interface BillSummaryProps {
  cart: CartItem[];
  subtotal: number;
  totalItemDiscount: number;
  billDiscountAmt: number;
  discount: string;
  discountType: "flat" | "percent";
  enableGst: boolean;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  roundOff: number;
  roundedTotal: number;
  submitting: boolean;
  onCreateBill: () => void;
  isDesktop: boolean;
}

// ─── Bill Summary Component (right column) ─────────────────────

export function BillSummary({
  cart,
  subtotal,
  totalItemDiscount,
  billDiscountAmt,
  discount,
  discountType,
  enableGst,
  taxableAmount,
  cgstRate,
  cgstAmount,
  sgstRate,
  sgstAmount,
  roundOff,
  roundedTotal,
  submitting,
  onCreateBill,
  isDesktop,
}: BillSummaryProps) {
  return (
    <div className="rounded-xl border bg-white shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Bill Summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({cart.reduce((s, c) => s + c.quantity, 0)} items)</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        {totalItemDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Item Discounts</span>
            <span>−₹{totalItemDiscount.toFixed(2)}</span>
          </div>
        )}
        {billDiscountAmt > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Bill Discount {discountType === "percent" ? `(${discount}%)` : ""}</span>
            <span>−₹{billDiscountAmt.toFixed(2)}</span>
          </div>
        )}
        {enableGst && (
          <>
            <Separator />
            <div className="flex justify-between text-gray-500">
              <span>Taxable Amount</span>
              <span>₹{taxableAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>CGST @ {cgstRate}%</span>
              <span>₹{cgstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>SGST @ {sgstRate}%</span>
              <span>₹{sgstAmount.toFixed(2)}</span>
            </div>
          </>
        )}
        {roundOff !== 0 && (
          <div className="flex justify-between text-gray-400 text-xs">
            <span>Round Off</span>
            <span>{roundOff >= 0 ? "+" : ""}₹{roundOff.toFixed(2)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between text-lg font-bold text-primary">
          <span>Total</span>
          <span>₹{roundedTotal.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <Button
        onClick={onCreateBill}
        disabled={cart.length === 0 || submitting}
        className="w-full mt-5 h-12 text-base font-semibold bg-primary hover:bg-primary/90 gap-2"
      >
        <Receipt className="w-5 h-5" />
        {submitting ? "Creating Bill..." : "Generate Bill"}
      </Button>

      {/* Keyboard shortcuts strip */}
      {isDesktop && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-400">
          <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">F2</kbd> Search</span>
          <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">F3</kbd> Barcode</span>
          <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">F5</kbd> New Bill</span>
          <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">F9</kbd> Held Bills</span>
        </div>
      )}
    </div>
  );
}
