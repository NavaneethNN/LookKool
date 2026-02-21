"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Search,
  Barcode,
  Printer,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Save,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getVariantsForBarcodes,
  updateVariantBarcode,
  bulkGenerateBarcodes,
} from "@/lib/actions/billing-actions";

type VariantRow = {
  variantId: number;
  productName: string;
  productCode: string;
  color: string;
  size: string;
  sku: string | null;
  barcode: string | null;
  basePrice: string;
};

// ─── Simple Code128-like barcode SVG generation ─────────────
function generateBarcodeSVG(value: string, width = 200, height = 60): string {
  if (!value) return "";
  // Simple barcode representation using alternating bars
  const bars: number[] = [];
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    // Generate bar pattern from character code
    for (let b = 0; b < 8; b++) {
      bars.push((code >> (7 - b)) & 1);
    }
    bars.push(0); // gap between characters
  }

  const barWidth = width / bars.length;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height + 16}" width="${width}" height="${height + 16}">`;
  svg += `<rect width="${width}" height="${height + 16}" fill="white"/>`;

  bars.forEach((bar, i) => {
    if (bar === 1) {
      svg += `<rect x="${i * barWidth}" y="0" width="${barWidth}" height="${height}" fill="black"/>`;
    }
  });

  // Text below barcode
  svg += `<text x="${width / 2}" y="${height + 12}" text-anchor="middle" font-size="10" font-family="monospace">${value}</text>`;
  svg += `</svg>`;
  return svg;
}

export function BarcodeManager() {
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [search, setSearch] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editingBarcode, setEditingBarcode] = useState<Record<number, string>>({});
  const [generating, setGenerating] = useState(false);

  const loadVariants = useCallback(async (p: number, q?: string, missing?: boolean) => {
    setLoading(true);
    try {
      const result = await getVariantsForBarcodes({ page: p, search: q, onlyMissing: missing });
      setVariants(result.variants as unknown as VariantRow[]);
      setTotal(result.total);
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load variants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadVariants(1, search || undefined, onlyMissing), 400);
    return () => clearTimeout(t);
  }, [search, onlyMissing, loadVariants]);

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const selectAll = () => {
    if (selected.size === variants.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(variants.map(v => v.variantId)));
    }
  };

  const handleBulkGenerate = async () => {
    const ids = selected.size > 0 ? Array.from(selected) : variants.filter(v => !v.barcode).map(v => v.variantId);
    if (ids.length === 0) { toast.error("No variants to generate barcodes for"); return; }
    setGenerating(true);
    try {
      await bulkGenerateBarcodes(ids);
      toast.success(`Generated ${ids.length} barcodes`);
      loadVariants(page, search || undefined, onlyMissing);
      setSelected(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate barcodes");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveBarcode = async (variantId: number) => {
    const barcode = editingBarcode[variantId];
    if (!barcode?.trim()) return;
    try {
      await updateVariantBarcode(variantId, barcode.trim());
      toast.success("Barcode updated");
      setEditingBarcode(prev => { const n = { ...prev }; delete n[variantId]; return n; });
      loadVariants(page, search || undefined, onlyMissing);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update barcode");
    }
  };

  const printBarcodes = () => {
    const toPrint = selected.size > 0
      ? variants.filter(v => selected.has(v.variantId) && v.barcode)
      : variants.filter(v => v.barcode);

    if (toPrint.length === 0) { toast.error("No barcodes to print"); return; }

    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Popup blocked"); return; }

    const html = `<!DOCTYPE html>
<html><head><title>Barcode Labels</title>
<style>
  @page { size: 50mm 25mm; margin: 2mm; }
  body { font-family: monospace; margin: 0; padding: 0; }
  .label { page-break-after: always; padding: 2mm; text-align: center; width: 46mm; height: 21mm; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .label:last-child { page-break-after: auto; }
  .name { font-size: 7px; font-weight: bold; margin-bottom: 1mm; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 44mm; }
  .variant { font-size: 6px; color: #666; margin-bottom: 1mm; }
  .price { font-size: 8px; font-weight: bold; margin-top: 1mm; }
  svg { max-width: 44mm; }
</style></head><body>
${toPrint.map(v => `
<div class="label">
  <div class="name">${v.productName}</div>
  <div class="variant">${v.color} / ${v.size}${v.sku ? ` | ${v.sku}` : ""}</div>
  ${generateBarcodeSVG(v.barcode!, 180, 35)}
  <div class="price">₹${Number(v.basePrice).toFixed(0)}</div>
</div>
`).join("")}
</body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product name, code, SKU, barcode..." className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant={onlyMissing ? "default" : "outline"} size="sm" onClick={() => setOnlyMissing(!onlyMissing)} className={onlyMissing ? "bg-yellow-500 hover:bg-yellow-600" : ""}>
            Missing Only
          </Button>
          <Button onClick={handleBulkGenerate} disabled={generating} className="gap-2 bg-primary hover:bg-primary/90" size="sm">
            <Wand2 className="w-4 h-4" /> {generating ? "Generating..." : "Auto-Generate"}
          </Button>
          <Button onClick={printBarcodes} variant="outline" className="gap-2" size="sm">
            <Printer className="w-4 h-4" /> Print Labels
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50 text-left">
              <th className="px-4 py-3 w-10">
                <button onClick={selectAll} className="text-gray-500 hover:text-gray-900">
                  {selected.size === variants.length && variants.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>
              </th>
              <th className="px-4 py-3 font-semibold text-gray-700">Product</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Variant</th>
              <th className="px-4 py-3 font-semibold text-gray-700">SKU</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Barcode</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : variants.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No variants found</td></tr>
            ) : (
              variants.map((v) => (
                <tr key={v.variantId} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <button onClick={() => toggleSelect(v.variantId)} className="text-gray-500 hover:text-gray-900">
                      {selected.has(v.variantId) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 text-xs">{v.productName}</p>
                    <p className="text-xs text-gray-500">{v.productCode}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">{v.color} / {v.size}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 font-mono">{v.sku || "—"}</td>
                  <td className="px-4 py-3">
                    {v.variantId in editingBarcode ? (
                      <div className="flex items-center gap-1">
                        <Input value={editingBarcode[v.variantId]} onChange={(e) => setEditingBarcode(prev => ({ ...prev, [v.variantId]: e.target.value }))} className="h-7 text-xs w-36" placeholder="Enter barcode" />
                        <Button size="sm" variant="ghost" onClick={() => handleSaveBarcode(v.variantId)} className="h-7 w-7 p-0">
                          <Save className="w-3.5 h-3.5 text-green-600" />
                        </Button>
                      </div>
                    ) : v.barcode ? (
                      <button onClick={() => setEditingBarcode(prev => ({ ...prev, [v.variantId]: v.barcode! }))} className="font-mono text-xs text-primary hover:underline flex items-center gap-1">
                        <Barcode className="w-3.5 h-3.5" /> {v.barcode}
                      </button>
                    ) : (
                      <button onClick={() => setEditingBarcode(prev => ({ ...prev, [v.variantId]: "" }))} className="text-xs text-gray-400 hover:text-gray-600">
                        + Add barcode
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {v.barcode && (
                      <div className="inline-block" dangerouslySetInnerHTML={{ __html: generateBarcodeSVG(v.barcode, 100, 30) }} />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Showing page {page} of {totalPages} ({total} variants)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadVariants(page - 1, search || undefined, onlyMissing)}>
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => loadVariants(page + 1, search || undefined, onlyMissing)}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
