"use client";

import { Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { SectionProps } from "./types";

export function InvoiceSection({ form, update }: SectionProps) {
  return (
    <section className="rounded-xl border bg-white shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <Receipt className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-gray-900">
          GST & Invoice Configuration
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.enableGst}
              onChange={(e) => update("enableGst", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">
                Enable GST on invoices
              </span>
              <p className="text-xs text-gray-500">
                Show CGST/SGST breakdown in bills and invoices
              </p>
            </div>
          </label>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            GST Rate (%)
          </label>
          <Input
            value={form.gstRate}
            onChange={(e) => update("gstRate", e.target.value)}
            type="number"
            min="0"
            max="28"
            step="0.01"
            className="h-10 font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            Will be split as {(Number(form.gstRate) / 2).toFixed(2)}% CGST +{" "}
            {(Number(form.gstRate) / 2).toFixed(2)}% SGST
          </p>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            HSN Code
          </label>
          <Input
            value={form.hsnCode}
            onChange={(e) => update("hsnCode", e.target.value)}
            placeholder="6104"
            className="h-10 font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            Default HSN code for clothing items
          </p>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Invoice Prefix
          </label>
          <Input
            value={form.invoicePrefix}
            onChange={(e) => update("invoicePrefix", e.target.value.toUpperCase())}
            placeholder="LK"
            maxLength={10}
            className="h-10 font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Next Invoice Number
          </label>
          <Input
            value={form.nextInvoiceNumber}
            onChange={(e) => update("nextInvoiceNumber", Number(e.target.value))}
            type="number"
            min="1"
            className="h-10 font-mono"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">
            Invoice Terms & Conditions
          </label>
          <textarea
            value={form.invoiceTerms ?? ""}
            onChange={(e) => update("invoiceTerms", e.target.value)}
            rows={3}
            placeholder="e.g. Goods once sold cannot be returned. Exchange within 7 days with bill."
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">
            Invoice Notes
          </label>
          <textarea
            value={form.invoiceNotes ?? ""}
            onChange={(e) => update("invoiceNotes", e.target.value)}
            rows={2}
            placeholder="e.g. Thank you for shopping with us!"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </section>
  );
}
