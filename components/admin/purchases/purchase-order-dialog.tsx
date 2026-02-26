"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Truck,
  CheckCircle2,
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
  createPurchaseOrder,
  receivePurchaseOrder,
} from "@/lib/actions/purchase-order.actions";
import { getSuppliersList } from "@/lib/actions/supplier.actions";
import { searchProductsForBilling } from "@/lib/actions/product.actions";
import { POItemEditor } from "./po-item-editor";

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

type Supplier = { supplierId: number; name: string };

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

// ═══════ CREATE PURCHASE ORDER DIALOG ═══════

interface CreatePODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreatePODialog({ open, onOpenChange, onCreated }: CreatePODialogProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [poItems, setPoItems] = useState<NewPOItem[]>([]);
  const [supplierInvoice, setSupplierInvoice] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<SearchProduct[]>([]);
  const [saving, setSaving] = useState(false);
  const [suppliersLoaded, setSuppliersLoaded] = useState(false);

  // Load suppliers when dialog opens
  const loadSuppliers = async () => {
    if (suppliersLoaded) return;
    try {
      const supList = await getSuppliersList();
      setSuppliers(supList);
      setSuppliersLoaded(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load suppliers");
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      loadSuppliers();
      setSelectedSupplier("");
      setPoItems([]);
      setSupplierInvoice("");
      setPoNotes("");
      setProductSearch("");
      setProductResults([]);
    }
    onOpenChange(isOpen);
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
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create purchase order");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = (index: number, updates: Partial<NewPOItem>) => {
    setPoItems(prev => prev.map((p, i) => i === index ? { ...p, ...updates } : p));
  };

  const handleRemoveItem = (index: number) => {
    setPoItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          <POItemEditor
            items={poItems}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />

          <Input value={poNotes} onChange={(e) => setPoNotes(e.target.value)} placeholder="Notes (optional)" />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleCreatePO} disabled={saving} className="bg-primary hover:bg-primary/90 gap-2">
              <Truck className="w-4 h-4" /> {saving ? "Creating..." : "Create PO"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════ DETAIL / RECEIVE DIALOG ═══════

interface DetailPODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detailPO: (PO & { items: POItem[] }) | null;
  onReceived: () => void;
}

export function DetailPODialog({ open, onOpenChange, detailPO, onReceived }: DetailPODialogProps) {
  const [receiveQtys, setReceiveQtys] = useState<Record<number, number>>({});
  const [receiving, setReceiving] = useState(false);

  // Sync receive qtys when detailPO changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && detailPO?.items) {
      const qtys: Record<number, number> = {};
      detailPO.items.forEach(i => { qtys[i.poItemId] = i.receivedQty; });
      setReceiveQtys(qtys);
    }
    onOpenChange(isOpen);
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
      onOpenChange(false);
      onReceived();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to receive stock");
    } finally {
      setReceiving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
  );
}
