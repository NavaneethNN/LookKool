"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Package,
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  BarChart3,
  History,
  TrendingDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getInventoryOverview,
  getLowStockItems,
  getStockAdjustments,
  createStockAdjustment,
} from "@/lib/actions/inventory.actions";
import { searchProductsForBilling } from "@/lib/actions/product.actions";

// Types matching actual server action returns
type OverviewData = Awaited<ReturnType<typeof getInventoryOverview>>;
type LowStockResult = Awaited<ReturnType<typeof getLowStockItems>>;
type AdjustmentsResult = Awaited<ReturnType<typeof getStockAdjustments>>;

type Props = {
  initialOverview: OverviewData;
  initialLowStock: LowStockResult;
  initialAdjustments: AdjustmentsResult;
};

export function InventoryManager({ initialOverview, initialLowStock, initialAdjustments }: Props) {
  const [overview, setOverview] = useState(initialOverview);
  const [lowStockResult, setLowStockResult] = useState(initialLowStock);
  const [adjustmentsResult, setAdjustmentsResult] = useState(initialAdjustments);

  // Stock adjustment dialog
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjSearch, setAdjSearch] = useState("");
  const [adjSearchResults, setAdjSearchResults] = useState<Array<{
    productId: number;
    productName: string;
    variants: Array<{
      variantId: number;
      color: string;
      size: string;
      stockCount: number;
      sku: string | null;
    }>;
  }>>([]);
  const [selectedVariant, setSelectedVariant] = useState<{
    variantId: number;
    productName: string;
    color: string;
    size: string;
    currentStock: number;
  } | null>(null);
  const [adjType, setAdjType] = useState<"manual_add" | "manual_remove" | "damage" | "opening_stock">("manual_add");
  const [adjQty, setAdjQty] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [submittingAdj, setSubmittingAdj] = useState(false);

  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const [o, ls, adj] = await Promise.all([
        getInventoryOverview(),
        getLowStockItems(lowStockThreshold),
        getStockAdjustments({ page: 1 }),
      ]);
      setOverview(o);
      setLowStockResult(ls);
      setAdjustmentsResult(adj);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const loadAdjustmentsPage = async (page: number) => {
    try {
      const result = await getStockAdjustments({ page });
      setAdjustmentsResult(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load adjustments");
    }
  };

  const handleAdjSearchProduct = async () => {
    if (adjSearch.length < 2) return;
    try {
      const results = await searchProductsForBilling(adjSearch);
      setAdjSearchResults(results as unknown as typeof adjSearchResults);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    }
  };

  const handleSelectVariantForAdjust = (product: typeof adjSearchResults[0], variant: typeof adjSearchResults[0]["variants"][0]) => {
    setSelectedVariant({
      variantId: variant.variantId,
      productName: product.productName,
      color: variant.color,
      size: variant.size,
      currentStock: variant.stockCount,
    });
    setAdjSearchResults([]);
    setAdjSearch("");
  };

  const handleSubmitAdjustment = async () => {
    if (!selectedVariant) return;
    const qty = Number(adjQty);
    if (!qty || qty <= 0) { toast.error("Enter valid quantity"); return; }

    setSubmittingAdj(true);
    try {
      await createStockAdjustment({
        variantId: selectedVariant.variantId,
        type: adjType,
        quantity: qty,
        reason: adjReason || undefined,
      });
      toast.success("Stock adjusted successfully");
      setAdjustOpen(false);
      setSelectedVariant(null);
      setAdjQty("");
      setAdjReason("");
      refreshData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to adjust stock");
    } finally {
      setSubmittingAdj(false);
    }
  };

  const getAdjTypeColor = (type: string) => {
    if (type.includes("in") || type === "manual_add" || type === "opening_stock") return "text-green-600 bg-green-50";
    if (type.includes("out") || type === "manual_remove" || type === "damage") return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
  };

  const getAdjTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      purchase_in: "Purchase In", sale_out: "Sale Out", return_in: "Return In",
      exchange_out: "Exchange Out", exchange_in: "Exchange In", manual_add: "Manual Add",
      manual_remove: "Manual Remove", damage: "Damage", opening_stock: "Opening Stock",
    };
    return map[type] || type;
  };

  const items = lowStockResult.items;
  const adjustments = adjustmentsResult.adjustments;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><BarChart3 className="w-4 h-4" /><span className="text-xs font-medium">Total SKUs</span></div>
          <p className="text-2xl font-bold text-gray-900">{overview.totalVariants}</p>
        </div>
        <div className="rounded-xl border bg-white shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><Package className="w-4 h-4" /><span className="text-xs font-medium">Total Stock</span></div>
          <p className="text-2xl font-bold text-gray-900">{overview.totalStock.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl border bg-white shadow-sm p-4">
          <div className="flex items-center gap-2 text-orange-500 mb-1"><AlertTriangle className="w-4 h-4" /><span className="text-xs font-medium">Low Stock</span></div>
          <p className="text-2xl font-bold text-orange-600">{overview.lowStock}</p>
        </div>
        <div className="rounded-xl border bg-white shadow-sm p-4">
          <div className="flex items-center gap-2 text-red-500 mb-1"><TrendingDown className="w-4 h-4" /><span className="text-xs font-medium">Out of Stock</span></div>
          <p className="text-2xl font-bold text-red-600">{overview.outOfStock}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={refreshData} disabled={refreshing} className="gap-1.5">
          <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </Button>
        <Button onClick={() => setAdjustOpen(true)} className="gap-1.5 bg-primary hover:bg-primary/90" size="sm">
          <ArrowUpDown className="w-4 h-4" /> Stock Adjustment
        </Button>
      </div>

      <Tabs defaultValue="low-stock">
        <TabsList>
          <TabsTrigger value="low-stock" className="gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Low Stock Alerts</TabsTrigger>
          <TabsTrigger value="adjustments" className="gap-1.5"><History className="w-3.5 h-3.5" /> Stock Adjustments</TabsTrigger>
        </TabsList>

        <TabsContent value="low-stock" className="mt-4">
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-gray-600">Threshold:</label>
            <Input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(Number(e.target.value) || 10)} className="w-20 h-8" min={1} />
            <Button variant="outline" size="sm" onClick={async () => { const ls = await getLowStockItems(lowStockThreshold); setLowStockResult(ls); }}>Apply</Button>
          </div>
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50/50 text-left">
                <th className="px-4 py-3 font-semibold text-gray-700">Product</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Variant</th>
                <th className="px-4 py-3 font-semibold text-gray-700">SKU</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-center">Stock</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
              </tr></thead>
              <tbody className="divide-y">
                {items.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">No low-stock items</td></tr>
                ) : items.map((item) => (
                  <tr key={item.variantId} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border" style={{ backgroundColor: item.color }} /><span className="text-gray-600">{item.color} / {item.size}</span></div></td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.sku || "—"}</td>
                    <td className="px-4 py-3 text-center font-bold"><span className={item.stockCount === 0 ? "text-red-600" : "text-orange-600"}>{item.stockCount}</span></td>
                    <td className="px-4 py-3">{item.stockCount === 0 ? <Badge variant="destructive" className="text-xs">Out of Stock</Badge> : <Badge className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-100">Low Stock</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="adjustments" className="mt-4">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50/50 text-left">
                <th className="px-4 py-3 font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Type</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-center">Qty Change</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-center">Stock After</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Reason</th>
              </tr></thead>
              <tbody className="divide-y">
                {adjustments.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">No adjustments recorded</td></tr>
                ) : adjustments.map((adj) => (
                  <tr key={adj.adjustmentId} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {new Date(adj.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      <br />{new Date(adj.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3"><Badge className={`text-xs ${getAdjTypeColor(adj.type)}`}>{getAdjTypeLabel(adj.type)}</Badge></td>
                    <td className="px-4 py-3 text-center font-mono font-bold"><span className={adj.quantityChange > 0 ? "text-green-600" : "text-red-600"}>{adj.quantityChange > 0 ? "+" : ""}{adj.quantityChange}</span></td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">{adj.stockAfter}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{adj.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {adjustmentsResult.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
              <span>Page {adjustmentsResult.page} of {adjustmentsResult.totalPages} ({adjustmentsResult.total} records)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={adjustmentsResult.page <= 1} onClick={() => loadAdjustmentsPage(adjustmentsResult.page - 1)} className="gap-1"><ChevronLeft className="w-4 h-4" /> Prev</Button>
                <Button variant="outline" size="sm" disabled={adjustmentsResult.page >= adjustmentsResult.totalPages} onClick={() => loadAdjustmentsPage(adjustmentsResult.page + 1)} className="gap-1">Next <ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowUpDown className="w-5 h-5" /> Stock Adjustment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!selectedVariant ? (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Search Product</label>
                  <div className="flex gap-2">
                    <Input value={adjSearch} onChange={(e) => setAdjSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdjSearchProduct()} placeholder="Search by name or code..." className="flex-1" />
                    <Button onClick={handleAdjSearchProduct} className="bg-primary hover:bg-primary/90">Search</Button>
                  </div>
                </div>
                {adjSearchResults.length > 0 && (
                  <div className="rounded-lg border bg-white max-h-60 overflow-y-auto">
                    {adjSearchResults.map((product) => (
                      <div key={product.productId} className="border-b last:border-b-0">
                        <p className="px-3 py-2 text-xs font-medium text-gray-900 bg-gray-50">{product.productName}</p>
                        {product.variants.map((v) => (
                          <button key={v.variantId} onClick={() => handleSelectVariantForAdjust(product, v)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-blue-50 transition-colors text-left">
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border" style={{ backgroundColor: v.color }} /><span className="text-xs">{v.color} / {v.size}</span>{v.sku && <span className="text-xs text-gray-400">SKU: {v.sku}</span>}</div>
                            <span className="text-xs font-bold">Stock: {v.stockCount}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium text-gray-900">{selectedVariant.productName}</p><p className="text-xs text-gray-500">{selectedVariant.color} / {selectedVariant.size}</p></div>
                    <div className="text-right"><p className="text-xs text-gray-500">Current Stock</p><p className="text-lg font-bold text-gray-900">{selectedVariant.currentStock}</p></div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedVariant(null)} className="mt-2 text-xs h-7">← Change product</Button>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Adjustment Type</label>
                  <Select value={adjType} onValueChange={(v) => setAdjType(v as typeof adjType)}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual_add">Manual Add (+)</SelectItem>
                      <SelectItem value="manual_remove">Manual Remove (−)</SelectItem>
                      <SelectItem value="damage">Damage (−)</SelectItem>
                      <SelectItem value="opening_stock">Opening Stock (+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><label className="text-xs font-medium text-gray-600 mb-1 block">Quantity</label><Input type="number" min="1" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} placeholder="Enter quantity" /></div>
                <div><label className="text-xs font-medium text-gray-600 mb-1 block">Reason</label><Input value={adjReason} onChange={(e) => setAdjReason(e.target.value)} placeholder="Reason for adjustment (optional)" /></div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setAdjustOpen(false); setSelectedVariant(null); }}>Cancel</Button>
                  <Button onClick={handleSubmitAdjustment} disabled={submittingAdj} className="bg-primary hover:bg-primary/90">{submittingAdj ? "Adjusting..." : "Apply Adjustment"}</Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
