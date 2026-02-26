"use client";

import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

type NewPOItem = {
  variantId: number;
  productName: string;
  variantInfo: string;
  sku: string;
  orderedQty: number;
  costPrice: string;
  gstRate: string;
};

interface POItemEditorProps {
  items: NewPOItem[];
  onUpdateItem: (index: number, updates: Partial<NewPOItem>) => void;
  onRemoveItem: (index: number) => void;
}

export function POItemEditor({ items, onUpdateItem, onRemoveItem }: POItemEditorProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="px-3 py-2 font-medium text-gray-700 text-xs">Product</th>
            <th className="px-3 py-2 font-medium text-gray-700 text-xs w-20">Qty</th>
            <th className="px-3 py-2 font-medium text-gray-700 text-xs w-28">Cost Price</th>
            <th className="px-3 py-2 font-medium text-gray-700 text-xs w-16">GST%</th>
            <th className="px-3 py-2 font-medium text-gray-700 text-xs text-right w-24">Amount</th>
            <th className="px-3 py-2 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item, idx) => (
            <tr key={item.variantId}>
              <td className="px-3 py-2">
                <p className="text-xs font-medium">{item.productName}</p>
                <p className="text-xs text-gray-500">{item.variantInfo}</p>
              </td>
              <td className="px-3 py-2">
                <Input type="number" min={1} value={item.orderedQty} className="h-8 text-xs"
                  onChange={(e) => onUpdateItem(idx, { orderedQty: Number(e.target.value) || 1 })} />
              </td>
              <td className="px-3 py-2">
                <Input type="number" step="0.01" value={item.costPrice} className="h-8 text-xs"
                  onChange={(e) => onUpdateItem(idx, { costPrice: e.target.value })} />
              </td>
              <td className="px-3 py-2">
                <Input type="number" step="0.5" value={item.gstRate} className="h-8 text-xs"
                  onChange={(e) => onUpdateItem(idx, { gstRate: e.target.value })} />
              </td>
              <td className="px-3 py-2 text-right text-xs font-medium">₹{(item.orderedQty * Number(item.costPrice)).toFixed(2)}</td>
              <td className="px-3 py-2">
                <button onClick={() => onRemoveItem(idx)} className="text-red-400 hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-gray-50 px-3 py-2 text-right text-sm font-semibold text-gray-900">
        Total: ₹{items.reduce((s, i) => s + i.orderedQty * Number(i.costPrice), 0).toFixed(2)}
      </div>
    </div>
  );
}
