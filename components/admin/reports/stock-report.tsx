"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Package,
  Download,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStockReport } from "@/lib/actions/report.actions";

type StockData = Awaited<ReturnType<typeof getStockReport>>;

export function StockReport() {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const result = await getStockReport();
      setData(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load stock report");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!data) return;
    const rows = [
      ["Product", "Code", "Color", "Size", "SKU", "Barcode", "Stock", "Cost Price", "Base Price"],
      ...data.items.map((i) => [
        i.productName, i.productCode, i.color, i.size, i.sku || "", i.barcode || "",
        (i.stockCount ?? 0).toString(), i.costPrice ?? "N/A", i.basePrice,
      ]),
      [""],
      ["Summary"],
      ["Total Items", data.summary.totalItems.toString()],
      ["Total Stock Units", data.summary.totalStock.toString()],
      ["Total Stock Value", data.summary.totalStockValue.toFixed(2)],
      ["Out of Stock", data.summary.outOfStock.toString()],
      ["Low Stock", data.summary.lowStock.toString()],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `stock-report-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Button onClick={loadReport} disabled={loading} className="h-9 gap-1.5 bg-primary hover:bg-primary/90">
          {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />} Generate Stock Report
        </Button>
        {data && <Button variant="outline" onClick={downloadCSV} className="h-9 gap-1.5"><Download className="w-4 h-4" /> CSV</Button>}
      </div>
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Total SKUs</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalItems}</p>
            </div>
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Total Stock</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalStock.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Stock Value</p>
              <p className="text-2xl font-bold text-blue-600">₹{data.summary.totalStockValue.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{data.summary.outOfStock}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10"><tr className="bg-gray-50/80 text-left border-b">
                  <th className="px-4 py-3 font-semibold text-gray-700">Product</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Variant</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">SKU</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-center">Stock</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-right">Cost</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-right">Price</th>
                </tr></thead>
                <tbody className="divide-y">
                  {data.items.map((item) => (
                    <tr key={item.variantId} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2 font-medium text-gray-900 text-xs">{item.productName}</td>
                      <td className="px-4 py-2"><div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: item.color }} /><span className="text-xs text-gray-600">{item.color} / {item.size}</span></div></td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-500">{item.sku || "—"}</td>
                      <td className="px-4 py-2 text-center"><span className={`font-bold ${(item.stockCount ?? 0) === 0 ? "text-red-600" : (item.stockCount ?? 0) < 10 ? "text-orange-600" : "text-gray-900"}`}>{item.stockCount ?? 0}</span></td>
                      <td className="px-4 py-2 text-right text-xs">{item.costPrice ? `₹${item.costPrice}` : "—"}</td>
                      <td className="px-4 py-2 text-right text-xs">₹{item.basePrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
