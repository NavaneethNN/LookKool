"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  TrendingUp,
  IndianRupee,
  FileSpreadsheet,
  Package,
  Download,
  RefreshCcw,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getSalesReport,
  getProfitReport,
  getGstReport,
  getStockReport,
} from "@/lib/actions/billing-actions";

// Infer types from actual server actions
type SalesData = Awaited<ReturnType<typeof getSalesReport>>;
type ProfitData = Awaited<ReturnType<typeof getProfitReport>>;
type GstData = Awaited<ReturnType<typeof getGstReport>>;
type StockData = Awaited<ReturnType<typeof getStockReport>>;

// ─── Sales Report ──────────────────────────────────────────

function SalesReport() {
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

// ─── Profit Report ─────────────────────────────────────────

function ProfitReport() {
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

// ─── GST Report ────────────────────────────────────────────

function GstReport() {
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

// ─── Stock Report ──────────────────────────────────────────

function StockReport() {
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

// ─── Main Reports Dashboard ────────────────────────────────

export function ReportsDashboard() {
  return (
    <Tabs defaultValue="sales" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="sales" className="gap-1.5"><TrendingUp className="w-4 h-4" /> Sales</TabsTrigger>
        <TabsTrigger value="profit" className="gap-1.5"><IndianRupee className="w-4 h-4" /> Profit</TabsTrigger>
        <TabsTrigger value="gst" className="gap-1.5"><FileSpreadsheet className="w-4 h-4" /> GST</TabsTrigger>
        <TabsTrigger value="stock" className="gap-1.5"><Package className="w-4 h-4" /> Stock</TabsTrigger>
      </TabsList>
      <TabsContent value="sales"><SalesReport /></TabsContent>
      <TabsContent value="profit"><ProfitReport /></TabsContent>
      <TabsContent value="gst"><GstReport /></TabsContent>
      <TabsContent value="stock"><StockReport /></TabsContent>
    </Tabs>
  );
}
