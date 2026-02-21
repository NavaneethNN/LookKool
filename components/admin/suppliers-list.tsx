"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/lib/actions/billing-actions";

type Supplier = {
  supplierId: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  pan: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  notes: string | null;
  isActive: boolean;
  totalPurchases: string;
  totalPaid: string;
};

export function SuppliersList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "", contactPerson: "", phone: "", email: "", gstin: "", pan: "",
    addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const loadSuppliers = useCallback(async (p: number, q?: string) => {
    setLoading(true);
    try {
      const result = await getSuppliers({ page: p, search: q });
      setSuppliers(result.suppliers as unknown as Supplier[]);
      setTotal(result.total);
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadSuppliers(1, search || undefined), 400);
    return () => clearTimeout(t);
  }, [search, loadSuppliers]);

  const openCreate = () => {
    setEditingSupplier(null);
    setForm({ name: "", contactPerson: "", phone: "", email: "", gstin: "", pan: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setForm({
      name: s.name, contactPerson: s.contactPerson || "", phone: s.phone || "",
      email: s.email || "", gstin: s.gstin || "", pan: s.pan || "",
      addressLine1: s.addressLine1 || "", addressLine2: "", city: s.city || "",
      state: s.state || "", pincode: s.pincode || "", notes: s.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.supplierId, form);
        toast.success("Supplier updated");
      } else {
        await createSupplier(form);
        toast.success("Supplier created");
      }
      setDialogOpen(false);
      loadSuppliers(page, search || undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save supplier");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this supplier?")) return;
    try {
      await deleteSupplier(id);
      toast.success("Supplier deleted");
      loadSuppliers(page, search || undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete supplier");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers..." className="pl-10" />
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Supplier
        </Button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50 text-left">
              <th className="px-4 py-3 font-semibold text-gray-700">Supplier</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Contact</th>
              <th className="px-4 py-3 font-semibold text-gray-700">GSTIN</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Location</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">Purchases</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No suppliers found</td></tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.supplierId} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{s.name}</p>
                    {s.contactPerson && <p className="text-xs text-gray-500">{s.contactPerson}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {s.phone && <p className="text-xs text-gray-600 flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</p>}
                    {s.email && <p className="text-xs text-gray-600 flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{s.gstin || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{[s.city, s.state].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">₹{Number(s.totalPurchases).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)} className="h-8 w-8 p-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(s.supplierId)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Page {page} of {totalPages} ({total} suppliers)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadSuppliers(page - 1, search || undefined)} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => loadSuppliers(page + 1, search || undefined)} className="gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Name *</label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Supplier name" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Contact Person</label>
                <Input value={form.contactPerson} onChange={(e) => setForm(f => ({ ...f, contactPerson: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Phone</label>
                <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
                <Input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">GSTIN</label>
                <Input value={form.gstin} onChange={(e) => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))} maxLength={15} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">PAN</label>
                <Input value={form.pan} onChange={(e) => setForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))} maxLength={10} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Address</label>
                <Input value={form.addressLine1} onChange={(e) => setForm(f => ({ ...f, addressLine1: e.target.value }))} placeholder="Address line" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">City</label>
                <Input value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">State</label>
                <Input value={form.state} onChange={(e) => setForm(f => ({ ...f, state: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Pincode</label>
                <Input value={form.pincode} onChange={(e) => setForm(f => ({ ...f, pincode: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
                <Input value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
                {saving ? "Saving..." : editingSupplier ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
