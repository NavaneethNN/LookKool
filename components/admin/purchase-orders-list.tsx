"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Truck,
  CheckCircle2,
  X,
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
import {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  receivePurchaseOrder,
  getSuppliersList,
} from "@/lib/actions/billing-actions";
import {
  searchProductsForBilling,
} from "@/lib/actions/admin-actions";

type PO = {
  purchaseOrderId: number;
  poNumber: string;
  status: string;
  orderDate: string | Date;
  totalAmount: string;
  paidAmount: string;
  supplierInvoiceNo: string | null;
  supplier: { name: string };
};

type Supplier = { supplierId: number; name: string };

type POItem = {
  poItemId: number;
  variantId: number;
  productName: string;
  variantInfo: string;
  sku: string | null;
  orderedQty: number;
  receivedQty: number;
  costPrice: string;
  amount: string;
};

type SearchProduct = {
  productId: number;
  productName: string;
  productCode: string;
  basePrice: string;
  variants: Array<{
    variantId: number;
    color: string;
    size: string;
    sku: string | null;
    stockCount: number;
  }>;
};

type NewPOItem = {
  variantId: number;
  productName: string;
  variantInfo: string;
  sku: string;
  orderedQty: number;
  costPrice: string;
  gstRate: string;
};

const statusColors: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Ordered: "bg-blue-100 text-blue-700",
  Partial: "bg-yellow-100 text-yellow-700",
  Received: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

export function PurchaseOrdersList() {
  const [orders, setOrders] = useState<PO[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Create PO state
  const [createOpen, setCreateOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [poItems, setPoItems] = useState<NewPOItem[]>([]);
  const [supplierInvoice, setSupplierInvoice] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<SearchProduct[]>([]);
  const [saving, setSaving] = useState(false);

  // Detail/Receive state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPO, setDetailPO] = useState<(PO & { items: POItem[] }) | null>(null);
  const [receiveQtys, setReceiveQtys] = useState<Record<number, number>>({});
  const [receiving, setReceiving] = useState(false);

  const loadOrders = useCallback(async (p: number, q?: string, status?: string) => {
    setLoading(true);
    try {
      const result = await getPurchaseOrders({ page: p, search: q, status });
      setOrders(result.orders as unknown as PO[]);
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch {
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadOrders(1, search || undefined, statusFilter), 400);
    return () => clearTimeout(t);
  }, [search, statusFilter, loadOrders]);

  // Load suppliers for create dialog
  const loadCreteData = async () => {
    try {
      const supList = await getSuppliersList();
      setSuppliers(supList);
    } catch {
      toast.error("Failed to load suppliers");
    }
  };

  const openCreate = () => {
    loadCreteData();
    setSelectedSupplier("");
    setPoItems([]);
    setSupplierInvoice("");
    setPoNotes("");
    setProductSearch("");
    setProductResults([]);
    setCreateOpen(true);
  };

  // Product search for PO
  const searchProducts = async (q: string) => {
    if (q.length < 2) { setProductResults([]); return; }
    try {
      const results = await searchProductsForBilling(q);
      setProductResults(results);
    } catch { /* ignore */ }
  };

  const addVariantToPO = (product: SearchProduct, variant: SearchProduct["variants"][0]) => {
    const exists = poItems.find(i => i.variantId === variant.variantId);
    if (exists) { toast.error("Already added"); return; }
    setPoItems(prev => [...prev, {
      variantId: variant.variantId,
      productName: product.productName,
      variantInfo: `${variant.color} / ${variant.size}`,
      sku: variant.sku || "",
      orderedQty: 1,
      costPrice: (Number(product.basePrice) * 0.6).toFixed(2), // default cost 60% of selling
      gstRate: "5",
    }]);
    setProductSearch("");
    setProductResults([]);
  };

  const handleCreatePO = async () => {
    if (!selectedSupplier) { toast.error("Select a supplier"); return; }
    if (poItems.length === 0) { toast.error("Add items"); return; }
    setSaving(true);
    try {
      await createPurchaseOrder({
        supplierId: Number(selectedSupplier),
        supplierInvoiceNo: supplierInvoice || undefined,
        notes: poNotes || undefined,
        items: poItems,
      });
      toast.success("Purchase order created");
      setCreateOpen(false);
      loadOrders(1, search || undefined, statusFilter);
    } catch {
      toast.error("Failed to create purchase order");
    } finally {
      setSaving(false);
    }
  };

  // View detail / Receive
  const openDetail = async (poId: number) => {
    try {
      const detail = await getPurchaseOrder(poId) as unknown as (PO & { items: POItem[] });
      setDetailPO(detail);
      if (detail?.items) {
        const qtys: Record<number, number> = {};
        detail.items.forEach(i => { qtys[i.poItemId] = i.receivedQty; });
        setReceiveQtys(qtys);
      }
      setDetailOpen(true);
    } catch {
      toast.error("Failed to load details");
    }
  };

  const handleReceive = async () => {
    if (!detailPO) return;
    setReceiving(true);
    try {
      const receivedItems = Object.entries(receiveQtys).map(([id, qty]) => ({
        poItemId: Number(id),
        receivedQty: qty,
      }));
      await receivePurchaseOrder(detailPO.purchaseOrderId, receivedItems);
      toast.success("Stock received and updated");
      setDetailOpen(false);
      loadOrders(page, search || undefined, statusFilter);
    } catch {
      toast.error("Failed to receive stock");
    } finally {
      setReceiving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search PO #..." className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Ordered">Ordered</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
              <SelectItem value="Received">Received</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4" /> New Purchase
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50 text-left">
              <th className="px-4 py-3 font-semibold text-gray-700">PO #</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Supplier</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Date</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">Amount</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">Paid</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No purchase orders found</td></tr>
            ) : (
              orders.map((po) => (
                <tr key={po.purchaseOrderId} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-primary">{po.poNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{po.supplier?.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{new Date(po.orderDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td className="px-4 py-3">
                    <Badge className={`${statusColors[po.status] || ""} text-xs`}>{po.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">₹{Number(po.totalAmount).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right text-gray-600">₹{Number(po.paidAmount).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(po.purchaseOrderId)} className="h-8 gap-1 text-primary hover:text-primary/90 hover:bg-purple-50">
                      <Eye className="w-3.5 h-3.5" /> View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadOrders(page - 1, search || undefined, statusFilter)}>
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => loadOrders(page + 1, search || undefined, statusFilter)}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ CREATE PURCHASE ORDER DIALOG ═══════ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Supplier *</label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger><SelectValue placeholder="Select supplier..." /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.supplierId} value={String(s.supplierId)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Supplier Invoice #</label>
                <Input value={supplierInvoice} onChange={(e) => setSupplierInvoice(e.target.value)} placeholder="Optional" />
              </div>
            </div>

            {/* Product search */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Add Products</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={productSearch}
                  onChange={(e) => { setProductSearch(e.target.value); searchProducts(e.target.value); }}
                  placeholder="Search products by name/code..."
                  className="pl-10"
                />
              </div>
              {productResults.length > 0 && (
                <div className="mt-1 rounded-lg border bg-white shadow-lg max-h-48 overflow-y-auto">
                  {productResults.map(p => (
                    <div key={p.productId} className="px-3 py-2 border-b last:border-b-0">
                      <p className="text-sm font-medium text-gray-900">{p.productName} ({p.productCode})</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.variants.map(v => (
                          <button key={v.variantId} onClick={() => addVariantToPO(p, v)}
                            className="text-xs px-2 py-1 rounded border hover:border-primary hover:bg-purple-50 transition-colors">
                            {v.color}/{v.size}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Items table */}
            {poItems.length > 0 && (
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
                    {poItems.map((item, idx) => (
                      <tr key={item.variantId}>
                        <td className="px-3 py-2">
                          <p className="text-xs font-medium">{item.productName}</p>
                          <p className="text-xs text-gray-500">{item.variantInfo}</p>
                        </td>
                        <td className="px-3 py-2">
                          <Input type="number" min={1} value={item.orderedQty} className="h-8 text-xs"
                            onChange={(e) => setPoItems(prev => prev.map((p, i) => i === idx ? { ...p, orderedQty: Number(e.target.value) || 1 } : p))} />
                        </td>
                        <td className="px-3 py-2">
                          <Input type="number" step="0.01" value={item.costPrice} className="h-8 text-xs"
                            onChange={(e) => setPoItems(prev => prev.map((p, i) => i === idx ? { ...p, costPrice: e.target.value } : p))} />
                        </td>
                        <td className="px-3 py-2">
                          <Input type="number" step="0.5" value={item.gstRate} className="h-8 text-xs"
                            onChange={(e) => setPoItems(prev => prev.map((p, i) => i === idx ? { ...p, gstRate: e.target.value } : p))} />
                        </td>
                        <td className="px-3 py-2 text-right text-xs font-medium">₹{(item.orderedQty * Number(item.costPrice)).toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => setPoItems(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-gray-50 px-3 py-2 text-right text-sm font-semibold text-gray-900">
                  Total: ₹{poItems.reduce((s, i) => s + i.orderedQty * Number(i.costPrice), 0).toFixed(2)}
                </div>
              </div>
            )}

            <Input value={poNotes} onChange={(e) => setPoNotes(e.target.value)} placeholder="Notes (optional)" />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreatePO} disabled={saving} className="bg-primary hover:bg-primary/90 gap-2">
                <Truck className="w-4 h-4" /> {saving ? "Creating..." : "Create PO"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════ DETAIL / RECEIVE DIALOG ═══════ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {detailPO?.poNumber}
              {detailPO && <Badge className={`${statusColors[detailPO.status] || ""} text-xs`}>{detailPO.status}</Badge>}
            </DialogTitle>
          </DialogHeader>
          {detailPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Supplier:</span>
                  <span className="ml-2 font-medium">{detailPO.supplier?.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>
                  <span className="ml-2">{new Date(detailPO.orderDate).toLocaleDateString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <span className="ml-2 font-semibold">₹{Number(detailPO.totalAmount).toLocaleString("en-IN")}</span>
                </div>
                {detailPO.supplierInvoiceNo && (
                  <div>
                    <span className="text-gray-500">Invoice:</span>
                    <span className="ml-2">{detailPO.supplierInvoiceNo}</span>
                  </div>
                )}
              </div>

              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-3 py-2 font-medium text-gray-700 text-xs">Product</th>
                      <th className="px-3 py-2 font-medium text-gray-700 text-xs text-center">Ordered</th>
                      <th className="px-3 py-2 font-medium text-gray-700 text-xs text-center">Received</th>
                      <th className="px-3 py-2 font-medium text-gray-700 text-xs text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(detailPO as unknown as { items: POItem[] }).items?.map((item: POItem) => (
                      <tr key={item.poItemId}>
                        <td className="px-3 py-2">
                          <p className="text-xs font-medium">{item.productName}</p>
                          <p className="text-xs text-gray-500">{item.variantInfo}</p>
                        </td>
                        <td className="px-3 py-2 text-center text-xs">{item.orderedQty}</td>
                        <td className="px-3 py-2 text-center">
                          {detailPO.status !== "Received" && detailPO.status !== "Cancelled" ? (
                            <Input type="number" min={0} max={item.orderedQty}
                              value={receiveQtys[item.poItemId] ?? 0}
                              onChange={(e) => setReceiveQtys(prev => ({ ...prev, [item.poItemId]: Number(e.target.value) }))}
                              className="h-7 w-16 text-xs text-center mx-auto" />
                          ) : (
                            <span className="text-xs">{item.receivedQty}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-xs">₹{Number(item.costPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {detailPO.status !== "Received" && detailPO.status !== "Cancelled" && (
                <div className="flex justify-end">
                  <Button onClick={handleReceive} disabled={receiving} className="gap-2 bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="w-4 h-4" /> {receiving ? "Updating..." : "Receive Stock"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
