"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Download,
  RefreshCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getGstReport } from "@/lib/actions/report.actions";

type GstData = Awaited<ReturnType<typeof getGstReport>>;

export function GstReport() {
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<GstData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const result = await getGstReport({ from: fromDate, to: toDate });
      setData(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load GST report");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!data) return;
    const s = data.summary;
    const rows = [
      ["GST Report", `${fromDate} to ${toDate}`],
      [""],
      ["Summary"],
      ["Taxable Amount", s.totalTaxable.toFixed(2)],
      ["CGST", s.totalCgst.toFixed(2)],
      ["SGST", s.totalSgst.toFixed(2)],
      ["IGST", s.totalIgst.toFixed(2)],
      ["Total Tax", s.totalTax.toFixed(2)],
      ["Grand Total", s.grandTotal.toFixed(2)],
      ["Bill Count", s.billCount.toString()],
      [""],
      ["Bill-wise Detail"],
      ["Invoice #", "Customer", "GSTIN", "Taxable", "CGST", "SGST", "IGST", "Total", "Date"],
      ...data.bills.map((b) => [
        b.invoiceNumber, b.customerName ?? "Walk-in", b.customerGstin ?? "—",
        b.taxableAmount, b.cgstAmount, b.sgstAmount, b.igstAmount, b.totalAmount,
        new Date(b.billDate).toLocaleDateString("en-IN"),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `gst-report-${fromDate}-to-${toDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">From</label><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40 h-9" /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">To</label><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40 h-9" /></div>
        <Button onClick={loadReport} disabled={loading} className="h-9 gap-1.5 bg-primary hover:bg-primary/90">
          {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />} Generate
        </Button>
        {data && <Button variant="outline" onClick={downloadCSV} className="h-9 gap-1.5"><Download className="w-4 h-4" /> CSV</Button>}
      </div>
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Taxable Amount</p>
              <p className="text-xl font-bold text-gray-900">₹{data.summary.totalTaxable.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">CGST</p>
              <p className="text-xl font-bold text-blue-600">₹{data.summary.totalCgst.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">SGST</p>
              <p className="text-xl font-bold text-blue-600">₹{data.summary.totalSgst.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Total Tax</p>
              <p className="text-xl font-bold text-orange-600">₹{data.summary.totalTax.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-white shadow-sm p-4 text-sm">
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-gray-900">Grand Total</span>
              <span className="font-bold text-primary text-lg">₹{data.summary.grandTotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Total Invoices</span>
              <span>{data.summary.billCount}</span>
            </div>
          </div>

          {data.bills.length > 0 && (
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b"><h3 className="text-sm font-semibold text-gray-900">Invoice-wise GST Detail</h3></div>
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white"><tr className="bg-gray-50/80 text-left border-b">
                    <th className="px-3 py-2 font-medium text-gray-700 text-xs">Invoice</th>
                    <th className="px-3 py-2 font-medium text-gray-700 text-xs">Customer</th>
                    <th className="px-3 py-2 font-medium text-gray-700 text-xs text-right">Taxable</th>
                    <th className="px-3 py-2 font-medium text-gray-700 text-xs text-right">CGST</th>
                    <th className="px-3 py-2 font-medium text-gray-700 text-xs text-right">SGST</th>
                    <th className="px-3 py-2 font-medium text-gray-700 text-xs text-right">Total</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {data.bills.map((b) => (
                      <tr key={b.billId}>
                        <td className="px-3 py-2 font-mono text-xs">{b.invoiceNumber}</td>
                        <td className="px-3 py-2 text-xs">{b.customerName || "Walk-in"}{b.customerGstin && <span className="text-gray-400 ml-1">({b.customerGstin})</span>}</td>
                        <td className="px-3 py-2 text-right text-xs">₹{Number(b.taxableAmount).toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2 text-right text-xs">₹{Number(b.cgstAmount).toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2 text-right text-xs">₹{Number(b.sgstAmount).toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2 text-right text-xs font-semibold">₹{Number(b.totalAmount).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
