"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  IndianRupee,
  Download,
  RefreshCcw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getProfitReport } from "@/lib/actions/report.actions";

type ProfitData = Awaited<ReturnType<typeof getProfitReport>>;

export function ProfitReport() {
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<ProfitData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const result = await getProfitReport({ from: fromDate, to: toDate });
      setData(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load profit report");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!data) return;
    const rows = [
      ["Metric", "Value"],
      ["Period", `${fromDate} to ${toDate}`],
      ["Total Revenue", data.totalRevenue.toFixed(2)],
      ["Total Cost (from variants)", data.totalCost.toFixed(2)],
      ["Gross Profit", data.grossProfit.toFixed(2)],
      ["Profit Margin %", data.profitMargin],
      ["Total Purchases (POs)", data.totalPurchases.toFixed(2)],
      ["Bill Count", data.billCount.toString()],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `profit-report-${fromDate}-to-${toDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">From</label><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40 h-9" /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">To</label><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40 h-9" /></div>
        <Button onClick={loadReport} disabled={loading} className="h-9 gap-1.5 bg-primary hover:bg-primary/90">
          {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <IndianRupee className="w-4 h-4" />} Generate
        </Button>
        {data && <Button variant="outline" onClick={downloadCSV} className="h-9 gap-1.5"><Download className="w-4 h-4" /> CSV</Button>}
      </div>
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-white shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">₹{data.totalRevenue.toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-400 mt-1">{data.billCount} bills</p>
          </div>
          <div className="rounded-xl border bg-white shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Total Cost</p>
            <p className="text-2xl font-bold text-red-600">₹{data.totalCost.toLocaleString("en-IN")}</p>
          </div>
          <div className="rounded-xl border bg-white shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Gross Profit</p>
            <p className={`text-2xl font-bold ${data.grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>₹{data.grossProfit.toLocaleString("en-IN")}</p>
            <div className="flex items-center gap-1 mt-1">
              {Number(data.profitMargin) >= 0 ? <ArrowUpRight className="w-3 h-3 text-green-600" /> : <ArrowDownRight className="w-3 h-3 text-red-600" />}
              <span className={`text-xs font-medium ${Number(data.profitMargin) >= 0 ? "text-green-600" : "text-red-600"}`}>{data.profitMargin}% margin</span>
            </div>
          </div>
          <div className="rounded-xl border bg-white shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Purchase Orders</p>
            <p className="text-2xl font-bold text-blue-600">₹{data.totalPurchases.toLocaleString("en-IN")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
