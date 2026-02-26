"use client";

import {
  Search,
  Printer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { printBill } from "@/lib/tauri-print";
import type { InStoreBill } from "./types";

// ─── Props ─────────────────────────────────────────────────────

export interface BillHistoryProps {
  bills: InStoreBill[];
  billSearch: string;
  onBillSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loadingBills: boolean;
  billsPage: number;
  billsTotalPages: number;
  billsTotal: number;
  onLoadBills: (page: number, search?: string) => void;
}

// ─── Component ─────────────────────────────────────────────────

export function BillHistory({
  bills,
  billSearch,
  onBillSearchChange,
  loadingBills,
  billsPage,
  billsTotalPages,
  billsTotal,
  onLoadBills,
}: BillHistoryProps) {
  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input value={billSearch} onChange={onBillSearchChange} placeholder="Search by invoice #, name, or phone..." className="pl-10" />
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50 text-left">
              <th className="px-4 py-3 font-semibold text-gray-700">Invoice #</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Customer</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Date</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">Amount</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Payment</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loadingBills ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading bills...</td></tr>
            ) : bills.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No bills found</td></tr>
            ) : (
              bills.map((bill) => (
                <tr key={bill.billId} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-primary">{bill.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{bill.customerName || "Walk-in"}</p>
                    {bill.customerPhone && <p className="text-xs text-gray-500">{bill.customerPhone}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {new Date(bill.billDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    <br />{new Date(bill.billDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{Number(bill.totalAmount).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="capitalize text-xs">{bill.paymentMode.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary hover:text-primary/90 hover:bg-purple-50"
                        onClick={() => printBill(bill.billId)}>
                        <Printer className="w-3.5 h-3.5" /> Print
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {billsTotalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Page {billsPage} of {billsTotalPages} ({billsTotal} bills)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={billsPage <= 1} onClick={() => onLoadBills(billsPage - 1, billSearch || undefined)} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={billsPage >= billsTotalPages} onClick={() => onLoadBills(billsPage + 1, billSearch || undefined)} className="gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
