"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/lib/actions/purchase-order.actions";
import { CreatePODialog, DetailPODialog } from "./purchase-order-dialog";

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

  // Detail/Receive state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPO, setDetailPO] = useState<(PO & { items: POItem[] }) | null>(null);

  const loadOrders = useCallback(async (p: number, q?: string, status?: string) => {
    setLoading(true);
    try {
      const result = await getPurchaseOrders({ page: p, search: q, status });
      setOrders(result.orders as unknown as PO[]);
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadOrders(1, search || undefined, statusFilter), 400);
    return () => clearTimeout(t);
  }, [search, statusFilter, loadOrders]);

  // View detail / Receive
  const openDetail = async (poId: number) => {
    try {
      const detail = await getPurchaseOrder(poId) as unknown as (PO & { items: POItem[] });
      setDetailPO(detail);
      setDetailOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load details");
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
          <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
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

      {/* Create PO Dialog */}
      <CreatePODialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => loadOrders(1, search || undefined, statusFilter)}
      />

      {/* Detail / Receive Dialog */}
      <DetailPODialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        detailPO={detailPO}
        onReceived={() => loadOrders(page, search || undefined, statusFilter)}
      />
    </div>
  );
}
