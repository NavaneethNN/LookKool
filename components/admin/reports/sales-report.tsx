"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  RefreshCcw,
  BarChart3,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSalesReport } from "@/lib/actions/report.actions";

type SalesData = Awaited<ReturnType<typeof getSalesReport>>;

export function SalesReport() {
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const result = await getSalesReport({ from: fromDate, to: toDate });
      setData(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load sales report");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!data) return;
    const s = data.summary;
    const rows = [
      ["Metric", "Value"],
      ["Period", `${fromDate} to ${toDate}`],
      ["In-Store Sales", `₹${s.inStoreTotal}`],
      ["In-Store Bill Count", s.inStoreCount.toString()],
      ["Online Sales", `₹${s.onlineTotal}`],
      ["Online Order Count", s.onlineCount.toString()],
      ["Grand Total", `₹${s.grandTotal}`],
      ["In-Store Discount", `₹${s.inStoreDiscount}`],
      [""],
      ["In-Store Daily Breakdown"],
      ["Date", "Count", "Total", "Discount", "GST"],
      ...data.inStoreSales.map((d) => [d.date, d.count.toString(), d.total ?? "0", d.discount ?? "0", d.gst]),
      [""],
      ["Online Daily Breakdown"],
      ["Date", "Count", "Total", "Discount"],
      ...data.onlineSales.map((d) => [d.date, d.count.toString(), d.total ?? "0", d.discount ?? "0"]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `sales-report-${fromDate}-to-${toDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">From</label><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40 h-9" /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">To</label><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40 h-9" /></div>
        <Button onClick={loadReport} disabled={loading} className="h-9 gap-1.5 bg-primary hover:bg-primary/90">
          {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />} Generate
        </Button>
        {data && <Button variant="outline" onClick={downloadCSV} className="h-9 gap-1.5"><Download className="w-4 h-4" /> CSV</Button>}
      </div>
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Grand Total</p>
              <p className="text-2xl font-bold text-gray-900">₹{data.summary.grandTotal.toLocaleString("en-IN")}</p>
              <p className="text-xs text-gray-400 mt-1">{data.summary.inStoreCount + data.summary.onlineCount} total</p>
            </div>
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Online Sales</p>
              <p className="text-2xl font-bold text-blue-600">₹{data.summary.onlineTotal.toLocaleString("en-IN")}</p>
              <p className="text-xs text-gray-400 mt-1">{data.summary.onlineCount} orders</p>
            </div>
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">In-Store Sales</p>
              <p className="text-2xl font-bold text-green-600">₹{data.summary.inStoreTotal.toLocaleString("en-IN")}</p>
              <p className="text-xs text-gray-400 mt-1">{data.summary.inStoreCount} bills</p>
            </div>
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">GST (In-Store)</p>
              <p className="text-2xl font-bold text-orange-600">₹{(data.summary.inStoreCgst + data.summary.inStoreSgst).toLocaleString("en-IN")}</p>
            </div>
          </div>

          {/* Daily breakdown tables */}
          {data.inStoreSales.length > 0 && (
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b"><h3 className="text-sm font-semibold text-gray-900">In-Store Daily Sales</h3></div>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50/50 text-left">
                  <th className="px-4 py-2 font-medium text-gray-700">Date</th>
                  <th className="px-4 py-2 font-medium text-gray-700 text-center">Bills</th>
                  <th className="px-4 py-2 font-medium text-gray-700 text-right">Total</th>
                  <th className="px-4 py-2 font-medium text-gray-700 text-right">Discount</th>
                  <th className="px-4 py-2 font-medium text-gray-700 text-right">GST</th>
                </tr></thead>
                <tbody className="divide-y">
                  {data.inStoreSales.map((d) => (
                    <tr key={d.date}><td className="px-4 py-2">{d.date}</td><td className="px-4 py-2 text-center">{d.count}</td>
                      <td className="px-4 py-2 text-right font-medium">₹{Number(d.total ?? 0).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2 text-right text-green-600">₹{Number(d.discount ?? 0).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2 text-right">₹{Number(d.gst).toLocaleString("en-IN")}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
