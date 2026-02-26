import { NextRequest, NextResponse } from "next/server";
import { getInStoreBill } from "@/lib/actions/bill.actions";
import { getStoreSettings } from "@/lib/actions/settings.actions";
import { generateInvoiceHTML, buildLayoutConfig, type InvoiceData } from "@/lib/invoice-template";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ billId: string }> }
) {
  try {
    // Authenticate: must be admin or cashier
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const [profile] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    if (!profile || (profile.role !== "admin" && profile.role !== "cashier")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { billId: billIdParam } = await params;
    const billId = Number(billIdParam);
    if (isNaN(billId) || billId < 1) {
      return NextResponse.json({ error: "Invalid bill ID" }, { status: 400 });
    }

    const bill = await getInStoreBill(billId);
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const settings = await getStoreSettings();
    const layout = buildLayoutConfig(settings as unknown as Record<string, unknown>);

    const store = {
      businessName: settings?.businessName ?? "LookKool",
      businessTagline: settings?.businessTagline,
      gstin: settings?.gstin,
      pan: settings?.pan,
      addressLine1: settings?.addressLine1,
      addressLine2: settings?.addressLine2,
      city: settings?.city ?? "Chennai",
      state: settings?.state ?? "Tamil Nadu",
      stateCode: settings?.stateCode ?? "33",
      pincode: settings?.pincode,
      phone: settings?.phone,
      email: settings?.email,
      website: settings?.website,
      hsnCode: settings?.hsnCode ?? "6104",
      enableGst: settings?.enableGst ?? true,
      invoiceTerms: settings?.invoiceTerms,
      invoiceNotes: settings?.invoiceNotes,
      bankName: settings?.bankName,
      bankAccountNumber: settings?.bankAccountNumber,
      bankIfsc: settings?.bankIfsc,
      bankBranch: settings?.bankBranch,
      upiId: settings?.upiId,
    };

    let items: InvoiceData["items"] = [];
    try {
      const parsed = JSON.parse(bill.items);
      items = parsed.map((item: Record<string, unknown>) => ({
        name: String(item.productName || item.name || "Item"),
        variant: item.variant ? String(item.variant) : undefined,
        sku: item.sku ? String(item.sku) : null,
        hsn: String(item.hsn || store.hsnCode),
        quantity: Number(item.quantity) || 1,
        rate: Number(item.rate || item.price) || 0,
        amount: Number(item.amount || item.total) || 0,
      }));
    } catch {
      items = [{ name: "Items", hsn: store.hsnCode, quantity: 1, rate: Number(bill.subtotal), amount: Number(bill.subtotal) }];
    }

    const invoiceDate = new Date(bill.billDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const html = generateInvoiceHTML({
      layout,
      store,
      invoiceNumber: bill.invoiceNumber,
      invoiceDate,
      type: "in_store",
      customer: {
        name: bill.customerName || "Walk-in Customer",
        phone: bill.customerPhone,
        gstin: bill.customerGstin,
      },
      items,
      subtotal: Number(bill.subtotal),
      discount: Number(bill.discountAmount),
      deliveryCharge: 0,
      taxableAmount: Number(bill.taxableAmount),
      cgstRate: Number(bill.cgstRate),
      cgstAmount: Number(bill.cgstAmount),
      sgstRate: Number(bill.sgstRate),
      sgstAmount: Number(bill.sgstAmount),
      igstRate: Number(bill.igstRate),
      igstAmount: Number(bill.igstAmount),
      roundOff: Number(bill.roundOff),
      total: Number(bill.totalAmount),
      paymentMethod: bill.paymentMode,
    });

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Bill invoice generation failed:", error);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
