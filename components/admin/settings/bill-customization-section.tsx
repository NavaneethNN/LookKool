"use client";

import { useState } from "react";
import {
  FileText,
  Palette,
  Eye,
  Type,
  ToggleLeft,
  Printer,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SectionProps, StoreSettingsData } from "./types";

const PAPER_SIZE_OPTIONS = [
  { value: "A4", label: "A4 — Standard (210 × 297 mm)", icon: "📄" },
  { value: "A5", label: "A5 — Half Sheet (148 × 210 mm)", icon: "📋" },
  { value: "thermal-80mm", label: "Thermal 80mm — Receipt Printer", icon: "🧾" },
  { value: "thermal-58mm", label: "Thermal 58mm — Compact Receipt", icon: "🧾" },
];

function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="pt-0.5">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`
            relative inline-flex h-5 w-9 shrink-0 items-center rounded-full
            transition-colors duration-200 focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            ${checked ? "bg-primary" : "bg-gray-200"}
          `}
        >
          <span
            className={`
              pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white
              shadow-sm transition-transform duration-200
              ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}
            `}
          />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
          {label}
        </span>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </label>
  );
}

/* ─── Mini Bill Preview ──────────────────────────────────────── */
function BillPreview({ form }: { form: StoreSettingsData }) {
  const isThermal = form.billPaperSize.startsWith("thermal");
  const containerWidth = isThermal
    ? form.billPaperSize === "thermal-58mm"
      ? "200px"
      : "260px"
    : form.billPaperSize === "A5"
    ? "260px"
    : "320px";

  const scale = Number(form.billFontScale) || 1;
  const baseFontSize = isThermal ? 8 : 9;
  const fontSize = baseFontSize * scale;

  if (isThermal) {
    return (
      <div
        className="bg-white border rounded-lg shadow-inner mx-auto overflow-hidden"
        style={{
          width: containerWidth,
          fontFamily: "'Courier New', monospace",
          fontSize: `${fontSize}px`,
          padding: "8px",
        }}
      >
        <div className="text-center font-bold" style={{ fontSize: `${fontSize + 2}px` }}>
          {form.businessName}
        </div>
        {form.businessTagline && (
          <div className="text-center text-gray-600" style={{ fontSize: `${fontSize - 1}px` }}>
            {form.businessTagline}
          </div>
        )}
        {form.billHeaderText && (
          <div className="text-center text-gray-500 mt-1" style={{ fontSize: `${fontSize - 1}px` }}>
            {form.billHeaderText}
          </div>
        )}
        <div className="border-t border-dashed border-gray-400 my-1.5" />
        <div className="font-bold text-center">{form.billTitle}</div>
        <div className="border-t border-dashed border-gray-400 my-1.5" />
        {form.billShowCustomerSection && (
          <>
            <div className="text-gray-500">Customer: Walk-in</div>
            <div className="border-t border-dashed border-gray-400 my-1.5" />
          </>
        )}
        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span>Kurta Set x2</span>
            <span>₹1,200</span>
          </div>
          <div className="flex justify-between">
            <span>Dupatta x1</span>
            <span>₹450</span>
          </div>
        </div>
        <div className="border-t border-dashed border-gray-400 my-1.5" />
        {form.billShowGstSummary && form.enableGst && (
          <div className="text-gray-600 space-y-0.5">
            <div className="flex justify-between"><span>CGST 2.5%</span><span>₹39.29</span></div>
            <div className="flex justify-between"><span>SGST 2.5%</span><span>₹39.29</span></div>
          </div>
        )}
        <div className="flex justify-between font-bold mt-1">
          <span>TOTAL</span><span>₹1,650</span>
        </div>
        {form.billShowAmountWords && (
          <div className="text-gray-500 mt-1" style={{ fontSize: `${fontSize - 2}px` }}>
            Rupees One Thousand Six Hundred Fifty Only
          </div>
        )}
        <div className="border-t border-dashed border-gray-400 my-1.5" />
        {form.billGreeting && (
          <div className="text-center text-gray-600">{form.billGreeting}</div>
        )}
        {form.billFooterText && (
          <div className="text-center text-gray-500" style={{ fontSize: `${fontSize - 2}px` }}>
            {form.billFooterText}
          </div>
        )}
      </div>
    );
  }

  // A4 / A5 preview
  return (
    <div
      className="bg-white border rounded-lg shadow-inner mx-auto overflow-hidden"
      style={{ width: containerWidth, fontSize: `${fontSize}px`, padding: "12px" }}
    >
      {/* Header */}
      <div
        className="rounded-t-md p-2 text-white text-center"
        style={{ backgroundColor: form.billAccentColor }}
      >
        {form.billShowLogo && form.billLogoUrl && (
          <div className="mb-1">
            <div className="w-6 h-6 bg-white/30 rounded mx-auto flex items-center justify-center text-[8px]">
              Logo
            </div>
          </div>
        )}
        <div className="font-bold" style={{ fontSize: `${fontSize + 3}px` }}>
          {form.businessName}
        </div>
        {form.businessTagline && (
          <div style={{ fontSize: `${fontSize - 1}px` }} className="opacity-90">
            {form.businessTagline}
          </div>
        )}
      </div>
      {form.billHeaderText && (
        <div
          className="text-center text-gray-500 py-1 border-b"
          style={{ fontSize: `${fontSize - 1}px` }}
        >
          {form.billHeaderText}
        </div>
      )}

      {/* Title */}
      <div
        className="text-center font-bold py-1.5 border-b"
        style={{ color: form.billAccentColor, fontSize: `${fontSize + 1}px` }}
      >
        {form.billTitle}
      </div>

      {/* Customer + Details */}
      <div className="py-1.5 border-b">
        <div className="grid grid-cols-2 gap-x-2" style={{ fontSize: `${fontSize - 1}px` }}>
          <div>
            <span className="text-gray-500">Invoice:</span>{" "}
            <span className="font-mono">LK-000001</span>
          </div>
          <div>
            <span className="text-gray-500">Date:</span> 01-Jan-2025
          </div>
          {form.billShowCustomerSection && (
            <>
              <div className="col-span-2 mt-0.5">
                <span className="text-gray-500">Customer:</span> Walk-in Customer
              </div>
            </>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="py-1">
        <table className="w-full" style={{ fontSize: `${fontSize - 1}px` }}>
          <thead>
            <tr
              className="text-white"
              style={{ backgroundColor: form.billAccentColor }}
            >
              <th className="text-left px-1 py-0.5">Item</th>
              {form.billShowHsn && <th className="px-1 py-0.5 text-center">HSN</th>}
              <th className="text-center px-1 py-0.5">Qty</th>
              <th className="text-right px-1 py-0.5">Amt</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="px-1 py-0.5">
                Kurta Set
                {form.billShowSku && (
                  <span className="text-gray-400 text-[7px] block">SKU: KS001</span>
                )}
              </td>
              {form.billShowHsn && <td className="text-center px-1">6104</td>}
              <td className="text-center px-1">2</td>
              <td className="text-right px-1">₹1,200</td>
            </tr>
            <tr className="border-b">
              <td className="px-1 py-0.5">Dupatta</td>
              {form.billShowHsn && <td className="text-center px-1">6104</td>}
              <td className="text-center px-1">1</td>
              <td className="text-right px-1">₹450</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="py-1 border-t space-y-0.5" style={{ fontSize: `${fontSize - 1}px` }}>
        <div className="flex justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span>₹1,650</span>
        </div>
        {form.billShowGstSummary && form.enableGst && (
          <>
            <div className="flex justify-between text-gray-500">
              <span>CGST @ 2.5%</span><span>₹39.29</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>SGST @ 2.5%</span><span>₹39.29</span>
            </div>
          </>
        )}
        <div
          className="flex justify-between font-bold pt-0.5 border-t"
          style={{ fontSize: `${fontSize + 1}px` }}
        >
          <span>Total</span><span>₹1,650</span>
        </div>
      </div>

      {form.billShowAmountWords && (
        <div className="text-gray-500 italic border-t py-1" style={{ fontSize: `${fontSize - 2}px` }}>
          Rupees One Thousand Six Hundred Fifty Only
        </div>
      )}

      {/* Bank Details */}
      {form.billShowBankDetails && form.bankName && (
        <div className="border-t py-1" style={{ fontSize: `${fontSize - 2}px` }}>
          <div className="text-gray-500 font-semibold mb-0.5">Bank Details</div>
          <div className="text-gray-400">{form.bankName} • A/C: xxxxxxxx</div>
        </div>
      )}

      {/* Signatory */}
      {form.billShowSignatory && (
        <div className="text-right pt-2 border-t mt-1" style={{ fontSize: `${fontSize - 2}px` }}>
          <div className="text-gray-400">Authorised Signatory</div>
          <div className="font-medium text-gray-600">{form.businessName}</div>
        </div>
      )}

      {/* Footer */}
      <div
        className="mt-2 rounded-b-md p-1 text-white text-center"
        style={{
          backgroundColor: form.billAccentColor,
          fontSize: `${fontSize - 2}px`,
        }}
      >
        {form.billGreeting && <div>{form.billGreeting}</div>}
        <div className="opacity-80">
          {form.billFooterText || "Computer generated bill"}
        </div>
      </div>
    </div>
  );
}

export function BillCustomizationSection({ form, update }: SectionProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <Separator className="my-4" />

      {/* ══════════════════════════════════════════════════════
          BILL LAYOUT & CUSTOMIZATION
          ══════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-gray-900">Bill Layout & Customization</h2>
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
          Applies to all bills & invoices
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Customise how your printed bills and invoices look. Changes apply to both
        in-store POS receipts and online order invoices.
      </p>

      {/* ── Paper & Printing ──────────────────────── */}
      <section className="rounded-xl border bg-white shadow-sm p-6 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Printer className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">
            Paper Size & Printing
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              Paper / Receipt Size
            </label>
            <Select
              value={form.billPaperSize}
              onValueChange={(v) => update("billPaperSize", v)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select paper size" />
              </SelectTrigger>
              <SelectContent>
                {PAPER_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400 mt-1.5">
              {form.billPaperSize.startsWith("thermal")
                ? "Thermal sizes use monospace font with dashed separators for receipt printers."
                : "Standard sizes use a full-colour table layout with accent colours."}
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              Font Scale
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.70"
                max="1.50"
                step="0.05"
                value={form.billFontScale}
                onChange={(e) => update("billFontScale", e.target.value)}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded min-w-[48px] text-center">
                {Number(form.billFontScale).toFixed(2)}×
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Scale text on the invoice. 1.00 = default, 0.80 = compact, 1.20 = large.
            </p>
          </div>
        </div>
      </section>

      {/* ── Appearance ────────────────────────────── */}
      <section className="rounded-xl border bg-white shadow-sm p-6 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">
            Appearance
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              Accent Colour
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.billAccentColor}
                onChange={(e) => update("billAccentColor", e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
              />
              <Input
                value={form.billAccentColor}
                onChange={(e) => update("billAccentColor", e.target.value)}
                placeholder="#470B49"
                maxLength={7}
                className="h-10 font-mono max-w-[140px]"
              />
              <div
                className="h-10 flex-1 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
                style={{ backgroundColor: form.billAccentColor }}
              >
                Preview
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Used for header, footer bars and table headers on A4/A5 bills.
            </p>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              Logo URL
            </label>
            <Input
              value={form.billLogoUrl ?? ""}
              onChange={(e) => update("billLogoUrl", e.target.value)}
              placeholder="https://yourdomain.com/logo.png"
              className="h-10"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Paste a direct image URL. Enable &quot;Show Logo&quot; toggle below to display it.
            </p>
          </div>
        </div>
      </section>

      {/* ── Custom Text ───────────────────────────── */}
      <section className="rounded-xl border bg-white shadow-sm p-6 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Type className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">
            Custom Text
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              Invoice Title
            </label>
            <Input
              value={form.billTitle}
              onChange={(e) => update("billTitle", e.target.value)}
              placeholder="TAX INVOICE"
              className="h-10 font-semibold"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              e.g. &quot;TAX INVOICE&quot;, &quot;RETAIL BILL&quot;, &quot;ESTIMATE&quot;, &quot;PROFORMA&quot;
            </p>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              Greeting / Thank You Message
            </label>
            <Input
              value={form.billGreeting ?? ""}
              onChange={(e) => update("billGreeting", e.target.value)}
              placeholder="Thank you for shopping with us!"
              className="h-10"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              Header Text
              <span className="text-gray-400 ml-1">(below business name)</span>
            </label>
            <textarea
              value={form.billHeaderText ?? ""}
              onChange={(e) => update("billHeaderText", e.target.value)}
              rows={2}
              placeholder="e.g. Wholesale & Retail • Since 2010"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              Footer Text
              <span className="text-gray-400 ml-1">(replaces default footer)</span>
            </label>
            <textarea
              value={form.billFooterText ?? ""}
              onChange={(e) => update("billFooterText", e.target.value)}
              rows={2}
              placeholder="e.g. This is a computer-generated bill. No signature required."
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </section>

      {/* ── Section Toggles ───────────────────────── */}
      <section className="rounded-xl border bg-white shadow-sm p-6 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <ToggleLeft className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">
            Show / Hide Sections
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ToggleSwitch
            label="Show Logo"
            description="Display your business logo at the top of the invoice"
            checked={form.billShowLogo}
            onChange={(v) => update("billShowLogo", v)}
          />
          <ToggleSwitch
            label="Show Customer Section"
            description="Display customer name, phone, and address on the bill"
            checked={form.billShowCustomerSection}
            onChange={(v) => update("billShowCustomerSection", v)}
          />
          <ToggleSwitch
            label="Show HSN Code"
            description="Display HSN code column in the items table"
            checked={form.billShowHsn}
            onChange={(v) => update("billShowHsn", v)}
          />
          <ToggleSwitch
            label="Show SKU"
            description="Display product SKU below item name"
            checked={form.billShowSku}
            onChange={(v) => update("billShowSku", v)}
          />
          <ToggleSwitch
            label="Show GST Summary"
            description="Display CGST/SGST breakdown in the totals section"
            checked={form.billShowGstSummary}
            onChange={(v) => update("billShowGstSummary", v)}
          />
          <ToggleSwitch
            label="Show Amount in Words"
            description='e.g. "Rupees One Thousand Five Hundred Only"'
            checked={form.billShowAmountWords}
            onChange={(v) => update("billShowAmountWords", v)}
          />
          <ToggleSwitch
            label="Show Bank Details"
            description="Display bank account info for NEFT/RTGS payments"
            checked={form.billShowBankDetails}
            onChange={(v) => update("billShowBankDetails", v)}
          />
          <ToggleSwitch
            label="Show Authorised Signatory"
            description="Display signatory line at the bottom of the invoice"
            checked={form.billShowSignatory}
            onChange={(v) => update("billShowSignatory", v)}
          />
        </div>
      </section>

      {/* ── Live Preview ──────────────────────────── */}
      <section className="rounded-xl border bg-white shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900">
              Live Preview
            </h3>
            <span className="text-xs text-gray-400">
              (sample data — updates in real-time)
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
        </div>
        {showPreview && (
          <div className="bg-gray-50 rounded-lg p-6 overflow-auto">
            <BillPreview form={form} />
          </div>
        )}
        {!showPreview && (
          <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-400 text-sm">
            Click &quot;Show Preview&quot; to see a live preview of your bill layout with sample data.
          </div>
        )}
      </section>
    </>
  );
}
