/**
 * lib/invoice-template.ts
 * ─────────────────────────────────────────────────────────────
 * Shared HTML invoice / bill generator used by both:
 *   /api/invoice/[orderId]   (online orders)
 *   /api/invoice/bill/[billId] (in-store bills)
 *
 * All layout decisions are driven by the store_settings row so
 * the admin can customise paper size, sections, colours, text, etc.
 */

// ─── Number → Indian-English words ────────────────────────────
const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
  "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
  "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const tens_ = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty",
  "Sixty", "Seventy", "Eighty", "Ninety",
];

function numberToWords(n: number): string {
  if (n === 0) return "Zero";
  if (n < 0) return "Minus " + numberToWords(-n);
  let w = "";
  if (Math.floor(n / 10000000) > 0) { w += numberToWords(Math.floor(n / 10000000)) + " Crore "; n %= 10000000; }
  if (Math.floor(n / 100000) > 0) { w += numberToWords(Math.floor(n / 100000)) + " Lakh "; n %= 100000; }
  if (Math.floor(n / 1000) > 0) { w += numberToWords(Math.floor(n / 1000)) + " Thousand "; n %= 1000; }
  if (Math.floor(n / 100) > 0) { w += numberToWords(Math.floor(n / 100)) + " Hundred "; n %= 100; }
  if (n > 0) {
    if (n < 20) w += ones[n];
    else { w += tens_[Math.floor(n / 10)]; if (n % 10 > 0) w += " " + ones[n % 10]; }
  }
  return w.trim();
}

function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let r = "Rupees " + numberToWords(rupees);
  if (paise > 0) r += " and " + numberToWords(paise) + " Paise";
  return r + " Only";
}

// ─── Paper-size CSS ───────────────────────────────────────────
const PAPER_SIZES: Record<string, { css: string; maxWidth: string; padding: string; bodyFont: string }> = {
  A4: {
    css: "@page { size: A4; margin: 15mm; }",
    maxWidth: "800px",
    padding: "20px",
    bodyFont: "13px",
  },
  A5: {
    css: "@page { size: A5; margin: 10mm; }",
    maxWidth: "560px",
    padding: "16px",
    bodyFont: "12px",
  },
  "thermal-80mm": {
    css: "@page { size: 80mm auto; margin: 3mm; }",
    maxWidth: "76mm",
    padding: "4px",
    bodyFont: "11px",
  },
  "thermal-58mm": {
    css: "@page { size: 58mm auto; margin: 2mm; }",
    maxWidth: "54mm",
    padding: "3px",
    bodyFont: "10px",
  },
};

const isThermal = (size: string) => size.startsWith("thermal");

// ─── Types ────────────────────────────────────────────────────

export type BillLayoutConfig = {
  paperSize: string;
  accentColor: string;
  title: string;
  headerText: string | null;
  footerText: string | null;
  greeting: string | null;
  logoUrl: string | null;
  showLogo: boolean;
  showHsn: boolean;
  showSku: boolean;
  showGstSummary: boolean;
  showBankDetails: boolean;
  showSignatory: boolean;
  showAmountWords: boolean;
  showCustomerSection: boolean;
  fontScale: number;
};

export type InvoiceData = {
  // Layout
  layout: BillLayoutConfig;
  // Store
  store: {
    businessName: string;
    businessTagline?: string | null;
    gstin?: string | null;
    pan?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city: string;
    state: string;
    stateCode: string;
    pincode?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    hsnCode: string;
    enableGst: boolean;
    invoiceTerms?: string | null;
    invoiceNotes?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankIfsc?: string | null;
    bankBranch?: string | null;
    upiId?: string | null;
  };
  // Document
  invoiceNumber: string;
  invoiceDate: string;
  type: "online" | "in_store";
  orderStatus?: string;
  // Customer
  customer: {
    name: string;
    phone?: string | null;
    email?: string | null;
    gstin?: string | null;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  // Items
  items: Array<{
    name: string;
    variant?: string;
    sku?: string | null;
    hsn?: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  // Financials
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  roundOff: number;
  total: number;
  paymentMethod?: string;
  paymentId?: string | null;
  couponCode?: string | null;
};

// ─── Helpers for store settings → layout config ───────────────

export function buildLayoutConfig(settings: Record<string, unknown> | null): BillLayoutConfig {
  return {
    paperSize: (settings?.billPaperSize as string) ?? "A4",
    accentColor: (settings?.billAccentColor as string) ?? "#470B49",
    title: (settings?.billTitle as string) ?? "TAX INVOICE",
    headerText: (settings?.billHeaderText as string) ?? null,
    footerText: (settings?.billFooterText as string) ?? null,
    greeting: (settings?.billGreeting as string) ?? null,
    logoUrl: (settings?.billLogoUrl as string) ?? null,
    showLogo: (settings?.billShowLogo as boolean) ?? false,
    showHsn: (settings?.billShowHsn as boolean) ?? true,
    showSku: (settings?.billShowSku as boolean) ?? true,
    showGstSummary: (settings?.billShowGstSummary as boolean) ?? true,
    showBankDetails: (settings?.billShowBankDetails as boolean) ?? true,
    showSignatory: (settings?.billShowSignatory as boolean) ?? true,
    showAmountWords: (settings?.billShowAmountWords as boolean) ?? true,
    showCustomerSection: (settings?.billShowCustomerSection as boolean) ?? true,
    fontScale: Number(settings?.billFontScale) || 1,
  };
}

// ─── Main HTML generator ──────────────────────────────────────

export function generateInvoiceHTML(data: InvoiceData): string {
  const { layout: L, store: S, customer: C } = data;
  const paper = PAPER_SIZES[L.paperSize] || PAPER_SIZES.A4;
  const thermal = isThermal(L.paperSize);
  const fs = L.fontScale;
  const accent = L.accentColor;

  // Scale helper
  const sz = (base: number) => `${(base * fs).toFixed(1)}px`;

  // Item rows
  const itemRows = data.items
    .map((item, i) => {
      if (thermal) {
        return `<tr>
          <td style="padding:3px 0;font-size:${sz(11)};color:#111827;">
            ${item.name}${item.variant ? ` <span style="color:#6b7280;">(${item.variant})</span>` : ""}
            <br><span style="color:#6b7280;">${item.quantity} × ₹${item.rate.toFixed(2)}</span>
          </td>
          <td style="padding:3px 0;text-align:right;font-size:${sz(11)};font-weight:600;">₹${item.amount.toFixed(2)}</td>
        </tr>`;
      }
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:${sz(13)};color:#374151;">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:${sz(13)};color:#111827;">
          <strong>${item.name}</strong>
          ${item.variant ? `<br><span style="font-size:${sz(11)};color:#6b7280;">${item.variant}</span>` : ""}
          ${L.showSku && item.sku ? `<br><span style="font-size:${sz(11)};color:#9ca3af;">SKU: ${item.sku}</span>` : ""}
        </td>
        ${L.showHsn ? `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:${sz(13)};color:#374151;">${item.hsn || S.hsnCode}</td>` : ""}
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:${sz(13)};color:#374151;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:${sz(13)};color:#374151;">₹${item.rate.toFixed(2)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:${sz(13)};color:#111827;font-weight:600;">₹${item.amount.toFixed(2)}</td>
      </tr>`;
    })
    .join("");

  // Column count for table header
  const colCount = 4 + (L.showHsn ? 1 : 0); // #, Item, (HSN), Qty, Rate, Amount => always has #, Item, Qty, Rate, Amount = 5, + HSN optional

  if (thermal) return generateThermalHTML(data, paper, fs, accent);

  // ── Full-size (A4 / A5) layout ─────────────────────────────
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  ${paper.css}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #111827; line-height: 1.5; background: white; font-size: ${paper.bodyFont}; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div style="max-width:${paper.maxWidth};margin:0 auto;padding:${paper.padding};">

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:${sz(20)};border-bottom:3px solid ${accent};">
    <div>
      ${L.showLogo && L.logoUrl ? `<img src="${L.logoUrl}" alt="${S.businessName}" style="max-height:60px;max-width:200px;margin-bottom:8px;">` : ""}
      <h1 style="font-size:${sz(28)};font-weight:800;color:${accent};letter-spacing:-0.5px;">${S.businessName}</h1>
      ${S.businessTagline ? `<p style="font-size:${sz(12)};color:#6b7280;margin-top:2px;">${S.businessTagline}</p>` : ""}
      ${L.headerText ? `<p style="font-size:${sz(12)};color:#374151;margin-top:4px;white-space:pre-line;">${L.headerText}</p>` : ""}
      <div style="margin-top:8px;font-size:${sz(12)};color:#374151;line-height:1.6;">
        ${S.addressLine1 ? `${S.addressLine1}<br>` : ""}
        ${S.addressLine2 ? `${S.addressLine2}<br>` : ""}
        ${S.city}, ${S.state} ${S.pincode || ""}<br>
        ${S.phone ? `Phone: ${S.phone}<br>` : ""}
        ${S.email ? `Email: ${S.email}<br>` : ""}
        ${S.website ? `Web: ${S.website}` : ""}
      </div>
    </div>
    <div style="text-align:right;">
      <h2 style="font-size:${sz(20)};font-weight:700;color:${accent};text-transform:uppercase;">${L.title}</h2>
      <div style="margin-top:10px;font-size:${sz(13)};color:#374151;">
        <strong>${data.type === "online" ? "Invoice" : "Bill"} #:</strong> ${data.invoiceNumber}<br>
        <strong>Date:</strong> ${data.invoiceDate}<br>
        ${data.orderStatus ? `<strong>Status:</strong> ${data.orderStatus}<br>` : ""}
      </div>
      ${S.gstin ? `<div style="margin-top:8px;padding:6px 12px;background:${accent}15;border-radius:6px;font-size:${sz(12)};"><strong>GSTIN:</strong> ${S.gstin}</div>` : ""}
      ${S.pan ? `<div style="margin-top:4px;font-size:${sz(12)};color:#6b7280;"><strong>PAN:</strong> ${S.pan}</div>` : ""}
    </div>
  </div>

  ${L.showCustomerSection ? `
  <!-- Customer Details -->
  <div style="display:flex;gap:20px;margin-top:20px;">
    <div style="flex:1;background:#f9fafb;border-radius:8px;padding:16px;border:1px solid #e5e7eb;">
      <h3 style="font-size:${sz(11)};text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;margin-bottom:8px;font-weight:600;">Bill To</h3>
      <p style="font-size:${sz(14)};font-weight:600;color:#111827;">${C.name || "Walk-in Customer"}</p>
      ${C.phone ? `<p style="font-size:${sz(12)};color:#374151;">Phone: ${C.phone}</p>` : ""}
      ${C.email ? `<p style="font-size:${sz(12)};color:#374151;">Email: ${C.email}</p>` : ""}
      ${C.address ? `<p style="font-size:${sz(12)};color:#374151;margin-top:4px;">${C.address}</p>` : ""}
      ${C.city ? `<p style="font-size:${sz(12)};color:#374151;">${C.city}${C.state ? `, ${C.state}` : ""} ${C.pincode || ""}</p>` : ""}
      ${C.gstin ? `<p style="font-size:${sz(12)};color:#374151;margin-top:4px;"><strong>GSTIN:</strong> ${C.gstin}</p>` : ""}
    </div>
    ${data.type === "online" ? `
    <div style="flex:1;background:#f9fafb;border-radius:8px;padding:16px;border:1px solid #e5e7eb;">
      <h3 style="font-size:${sz(11)};text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;margin-bottom:8px;font-weight:600;">Ship To</h3>
      <p style="font-size:${sz(14)};font-weight:600;color:#111827;">${C.name}</p>
      ${C.address ? `<p style="font-size:${sz(12)};color:#374151;">${C.address}</p>` : ""}
      ${C.city ? `<p style="font-size:${sz(12)};color:#374151;">${C.city}${C.state ? `, ${C.state}` : ""} ${C.pincode || ""}</p>` : ""}
      ${C.phone ? `<p style="font-size:${sz(12)};color:#374151;">Phone: ${C.phone}</p>` : ""}
    </div>` : `
    <div style="flex:1;background:#f9fafb;border-radius:8px;padding:16px;border:1px solid #e5e7eb;">
      <h3 style="font-size:${sz(11)};text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;margin-bottom:8px;font-weight:600;">Payment</h3>
      <p style="font-size:${sz(14)};font-weight:600;color:#111827;text-transform:capitalize;">${data.paymentMethod || "Cash"}</p>
      ${data.paymentId ? `<p style="font-size:${sz(12)};color:#374151;margin-top:4px;"><strong>Txn ID:</strong> ${data.paymentId}</p>` : ""}
    </div>`}
  </div>` : ""}

  <!-- Items Table -->
  <div style="margin-top:24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:${accent};">
          <th style="padding:10px 12px;text-align:center;font-size:${sz(11)};font-weight:600;color:white;text-transform:uppercase;width:40px;">#</th>
          <th style="padding:10px 12px;text-align:left;font-size:${sz(11)};font-weight:600;color:white;text-transform:uppercase;">Item</th>
          ${L.showHsn ? `<th style="padding:10px 12px;text-align:center;font-size:${sz(11)};font-weight:600;color:white;text-transform:uppercase;width:70px;">HSN</th>` : ""}
          <th style="padding:10px 12px;text-align:center;font-size:${sz(11)};font-weight:600;color:white;text-transform:uppercase;width:50px;">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:${sz(11)};font-weight:600;color:white;text-transform:uppercase;width:90px;">Rate</th>
          <th style="padding:10px 12px;text-align:right;font-size:${sz(11)};font-weight:600;color:white;text-transform:uppercase;width:100px;">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>

  <!-- Totals -->
  <div style="display:flex;justify-content:flex-end;margin-top:16px;">
    <div style="width:320px;">
      <table style="width:100%;font-size:${sz(13)};">
        <tr>
          <td style="padding:6px 0;color:#374151;">Subtotal</td>
          <td style="padding:6px 0;text-align:right;color:#111827;">₹${data.subtotal.toFixed(2)}</td>
        </tr>
        ${data.discount > 0 ? `<tr>
          <td style="padding:6px 0;color:#059669;">Discount${data.couponCode ? ` (${data.couponCode})` : ""}</td>
          <td style="padding:6px 0;text-align:right;color:#059669;">-₹${data.discount.toFixed(2)}</td>
        </tr>` : ""}
        ${data.deliveryCharge > 0 ? `<tr>
          <td style="padding:6px 0;color:#374151;">Delivery</td>
          <td style="padding:6px 0;text-align:right;">₹${data.deliveryCharge.toFixed(2)}</td>
        </tr>` : ""}
        ${S.enableGst ? `
        <tr style="border-top:1px solid #e5e7eb;">
          <td style="padding:6px 0;color:#374151;">Taxable Amount</td>
          <td style="padding:6px 0;text-align:right;font-weight:500;">₹${data.taxableAmount.toFixed(2)}</td>
        </tr>
        ${data.cgstAmount > 0 ? `<tr>
          <td style="padding:6px 0;color:#374151;">CGST @ ${data.cgstRate}%</td>
          <td style="padding:6px 0;text-align:right;">₹${data.cgstAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#374151;">SGST @ ${data.sgstRate}%</td>
          <td style="padding:6px 0;text-align:right;">₹${data.sgstAmount.toFixed(2)}</td>
        </tr>` : ""}
        ${data.igstAmount > 0 ? `<tr>
          <td style="padding:6px 0;color:#374151;">IGST @ ${data.igstRate}%</td>
          <td style="padding:6px 0;text-align:right;">₹${data.igstAmount.toFixed(2)}</td>
        </tr>` : ""}` : ""}
        ${data.roundOff !== 0 ? `<tr>
          <td style="padding:6px 0;color:#6b7280;">Round Off</td>
          <td style="padding:6px 0;text-align:right;color:#6b7280;">${data.roundOff >= 0 ? "+" : ""}₹${data.roundOff.toFixed(2)}</td>
        </tr>` : ""}
        <tr style="border-top:2px solid ${accent};">
          <td style="padding:10px 0;font-size:${sz(16)};font-weight:700;color:${accent};">Grand Total</td>
          <td style="padding:10px 0;text-align:right;font-size:${sz(16)};font-weight:700;color:${accent};">₹${data.total.toFixed(2)}</td>
        </tr>
      </table>
    </div>
  </div>

  ${L.showAmountWords ? `
  <div style="margin-top:12px;padding:10px 16px;background:${accent}08;border-radius:6px;border:1px solid ${accent}25;">
    <p style="font-size:${sz(12)};color:#6b7280;">Amount in Words:</p>
    <p style="font-size:${sz(13)};font-weight:600;color:${accent};">${amountInWords(data.total)}</p>
  </div>` : ""}

  ${S.enableGst && L.showGstSummary ? `
  <div style="margin-top:20px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;font-size:${sz(12)};">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:8px 12px;text-align:left;font-weight:600;">HSN/SAC</th>
          <th style="padding:8px 12px;text-align:right;font-weight:600;">Taxable</th>
          <th style="padding:8px 12px;text-align:center;font-weight:600;">CGST %</th>
          <th style="padding:8px 12px;text-align:right;font-weight:600;">CGST</th>
          <th style="padding:8px 12px;text-align:center;font-weight:600;">SGST %</th>
          <th style="padding:8px 12px;text-align:right;font-weight:600;">SGST</th>
          <th style="padding:8px 12px;text-align:right;font-weight:600;">Tax</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:8px 12px;border-top:1px solid #e5e7eb;">${S.hsnCode}</td>
          <td style="padding:8px 12px;border-top:1px solid #e5e7eb;text-align:right;">₹${data.taxableAmount.toFixed(2)}</td>
          <td style="padding:8px 12px;border-top:1px solid #e5e7eb;text-align:center;">${data.cgstRate}%</td>
          <td style="padding:8px 12px;border-top:1px solid #e5e7eb;text-align:right;">₹${data.cgstAmount.toFixed(2)}</td>
          <td style="padding:8px 12px;border-top:1px solid #e5e7eb;text-align:center;">${data.sgstRate}%</td>
          <td style="padding:8px 12px;border-top:1px solid #e5e7eb;text-align:right;">₹${data.sgstAmount.toFixed(2)}</td>
          <td style="padding:8px 12px;border-top:1px solid #e5e7eb;text-align:right;font-weight:600;">₹${(data.cgstAmount + data.sgstAmount).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>` : ""}

  ${L.showBankDetails && (S.bankName || S.upiId) ? `
  <div style="display:flex;gap:20px;margin-top:24px;">
    <div style="flex:1;font-size:${sz(12)};color:#374151;">
      <h4 style="font-size:${sz(11)};text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;margin-bottom:6px;font-weight:600;">Bank Details</h4>
      ${S.bankName ? `<p><strong>Bank:</strong> ${S.bankName}</p>` : ""}
      ${S.bankAccountNumber ? `<p><strong>A/C No:</strong> ${S.bankAccountNumber}</p>` : ""}
      ${S.bankIfsc ? `<p><strong>IFSC:</strong> ${S.bankIfsc}</p>` : ""}
      ${S.bankBranch ? `<p><strong>Branch:</strong> ${S.bankBranch}</p>` : ""}
      ${S.upiId ? `<p style="margin-top:6px;"><strong>UPI:</strong> ${S.upiId}</p>` : ""}
    </div>
    ${S.invoiceTerms ? `
    <div style="flex:1;font-size:${sz(12)};color:#374151;">
      <h4 style="font-size:${sz(11)};text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;margin-bottom:6px;font-weight:600;">Terms & Conditions</h4>
      <p style="white-space:pre-line;color:#6b7280;font-size:${sz(11)};">${S.invoiceTerms}</p>
    </div>` : ""}
  </div>` : `
  ${S.invoiceTerms ? `
  <div style="margin-top:20px;font-size:${sz(12)};color:#374151;">
    <h4 style="font-size:${sz(11)};text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;margin-bottom:6px;font-weight:600;">Terms & Conditions</h4>
    <p style="white-space:pre-line;color:#6b7280;font-size:${sz(11)};">${S.invoiceTerms}</p>
  </div>` : ""}`}

  ${S.invoiceNotes ? `
  <div style="margin-top:16px;padding:10px 16px;background:#f9fafb;border-radius:6px;border:1px solid #e5e7eb;font-size:${sz(11)};color:#6b7280;">
    <strong>Note:</strong> ${S.invoiceNotes}
  </div>` : ""}

  ${L.greeting ? `
  <div style="margin-top:20px;text-align:center;font-size:${sz(14)};color:${accent};font-weight:600;padding:12px 0;">
    ${L.greeting}
  </div>` : ""}

  <!-- Footer -->
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:flex-end;">
    <div style="font-size:${sz(11)};color:#9ca3af;">
      <p>${L.footerText || "This is a computer-generated document."}</p>
      ${S.enableGst ? `<p>Subject to ${S.city} jurisdiction.</p>` : ""}
    </div>
    ${L.showSignatory ? `
    <div style="text-align:right;">
      <p style="font-size:${sz(12)};color:#374151;font-weight:600;">For ${S.businessName}</p>
      <div style="margin-top:40px;border-top:1px solid #374151;padding-top:4px;width:180px;margin-left:auto;">
        <p style="font-size:${sz(11)};color:#6b7280;">Authorised Signatory</p>
      </div>
    </div>` : ""}
  </div>

</div>
</body>
</html>`;
}

// ─── Thermal receipt layout ───────────────────────────────────

function generateThermalHTML(
  data: InvoiceData,
  paper: (typeof PAPER_SIZES)[string],
  fs: number,
  accent: string,
): string {
  const S = data.store;
  const C = data.customer;
  const L = data.layout;
  const sz = (base: number) => `${(base * fs).toFixed(1)}px`;

  const itemRows = data.items
    .map(
      (item) => `<tr>
      <td style="padding:3px 0;font-size:${sz(11)};color:#111;">
        ${item.name}${item.variant ? ` <span style="color:#666;">(${item.variant})</span>` : ""}
        <br><span style="color:#666;">${item.quantity} × ₹${item.rate.toFixed(2)}</span>
      </td>
      <td style="padding:3px 0;text-align:right;font-size:${sz(11)};font-weight:700;">₹${item.amount.toFixed(2)}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  ${paper.css}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; color: #111; line-height: 1.4; background: white; font-size: ${paper.bodyFont}; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  hr { border: none; border-top: 1px dashed #999; margin: 6px 0; }
</style>
</head>
<body>
<div style="max-width:${paper.maxWidth};margin:0 auto;padding:${paper.padding};">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:6px;">
    ${L.showLogo && L.logoUrl ? `<img src="${L.logoUrl}" alt="" style="max-height:40px;max-width:90%;margin-bottom:4px;">` : ""}
    <div style="font-size:${sz(14)};font-weight:700;">${S.businessName}</div>
    ${S.businessTagline ? `<div style="font-size:${sz(9)};color:#666;">${S.businessTagline}</div>` : ""}
    ${L.headerText ? `<div style="font-size:${sz(9)};color:#333;">${L.headerText}</div>` : ""}
    ${S.addressLine1 ? `<div style="font-size:${sz(9)};color:#666;">${S.addressLine1}</div>` : ""}
    <div style="font-size:${sz(9)};color:#666;">${S.city}, ${S.state} ${S.pincode || ""}</div>
    ${S.phone ? `<div style="font-size:${sz(9)};color:#666;">Ph: ${S.phone}</div>` : ""}
    ${S.gstin ? `<div style="font-size:${sz(9)};color:#333;font-weight:600;">GSTIN: ${S.gstin}</div>` : ""}
  </div>

  <hr>
  <div style="text-align:center;font-size:${sz(11)};font-weight:700;margin:4px 0;">${L.title}</div>
  <div style="font-size:${sz(9)};color:#666;">
    Bill #: ${data.invoiceNumber}<br>
    Date: ${data.invoiceDate}
    ${data.paymentMethod ? `<br>Pay: ${data.paymentMethod}` : ""}
  </div>

  ${L.showCustomerSection && C.name && C.name !== "Walk-in Customer" ? `
  <hr>
  <div style="font-size:${sz(9)};color:#333;">
    <strong>${C.name}</strong>
    ${C.phone ? ` | ${C.phone}` : ""}
    ${C.gstin ? `<br>GSTIN: ${C.gstin}` : ""}
  </div>` : ""}

  <hr>

  <!-- Items -->
  <table style="width:100%;border-collapse:collapse;">
    <tbody>${itemRows}</tbody>
  </table>

  <hr>

  <!-- Totals -->
  <table style="width:100%;font-size:${sz(10)};">
    <tr>
      <td>Subtotal</td>
      <td style="text-align:right;">₹${data.subtotal.toFixed(2)}</td>
    </tr>
    ${data.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right;">-₹${data.discount.toFixed(2)}</td></tr>` : ""}
    ${S.enableGst && data.cgstAmount > 0 ? `
    <tr><td>CGST @${data.cgstRate}%</td><td style="text-align:right;">₹${data.cgstAmount.toFixed(2)}</td></tr>
    <tr><td>SGST @${data.sgstRate}%</td><td style="text-align:right;">₹${data.sgstAmount.toFixed(2)}</td></tr>` : ""}
    ${data.roundOff !== 0 ? `<tr><td>Round Off</td><td style="text-align:right;">${data.roundOff >= 0 ? "+" : ""}₹${data.roundOff.toFixed(2)}</td></tr>` : ""}
    <tr style="border-top:1px solid #111;">
      <td style="font-weight:700;font-size:${sz(12)};padding-top:4px;">TOTAL</td>
      <td style="text-align:right;font-weight:700;font-size:${sz(12)};padding-top:4px;">₹${data.total.toFixed(2)}</td>
    </tr>
  </table>

  ${L.showAmountWords ? `<div style="font-size:${sz(8)};color:#666;margin-top:4px;">${amountInWords(data.total)}</div>` : ""}

  <hr>

  <div style="text-align:center;font-size:${sz(9)};color:#666;">
    ${L.greeting || "Thank you for your purchase!"}
  </div>
  <div style="text-align:center;font-size:${sz(8)};color:#999;margin-top:4px;">
    ${L.footerText || "Computer generated receipt"}
  </div>

</div>
</body>
</html>`;
}
