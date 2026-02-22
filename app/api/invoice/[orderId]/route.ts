import { NextRequest, NextResponse } from "next/server";
import { getOrderInvoiceData, getStoreSettings } from "@/lib/actions/admin-actions";
import { generateInvoiceHTML, buildLayoutConfig } from "@/lib/invoice-template";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Authenticate: must be admin or cashier
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const [profile] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.userId, user.id))
      .limit(1);
    if (!profile || (profile.role !== "admin" && profile.role !== "cashier")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { orderId: orderIdParam } = await params;
    const orderId = Number(orderIdParam);
    if (isNaN(orderId) || orderId < 1) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const { order, storeSettings: settings } = await getOrderInvoiceData(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const allSettings = await getStoreSettings();
    const layout = buildLayoutConfig(allSettings as unknown as Record<string, unknown>);

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

    // Calculate GST
    const subtotal = Number(order.subtotal);
    const discount = Number(order.discountAmount);
    const deliveryCharge = Number(order.deliveryCharge);
    const total = Number(order.totalAmount);
    const taxableAmount = subtotal - discount;
    const gstRate = Number(store.enableGst ? (settings?.gstRate ?? "5.00") : "0");
    const halfRate = gstRate / 2;
    const totalTax = store.enableGst ? (taxableAmount * gstRate) / (100 + gstRate) : 0;
    const cgstAmount = totalTax / 2;
    const sgstAmount = totalTax / 2;

    const items = (order.items ?? []).map((item) => ({
      name: item.productName,
      variant: `${item.variantColor} / ${item.variantSize}`,
      sku: item.variant?.sku,
      hsn: store.hsnCode,
      quantity: item.quantity,
      rate: Number(item.pricePerUnit),
      amount: Number(item.pricePerUnit) * item.quantity,
    }));

    const invoiceNumber = `INV-${String(order.orderId).padStart(6, "0")}`;
    const invoiceDate = new Date(order.orderDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const html = generateInvoiceHTML({
      layout,
      store,
      invoiceNumber,
      invoiceDate,
      type: "online",
      orderStatus: order.status,
      customer: {
        name: order.shippingName,
        phone: order.shippingPhone,
        email: order.user?.email,
        address: [order.shippingAddressLine1, order.shippingAddressLine2]
          .filter(Boolean)
          .join(", "),
        city: order.shippingCity,
        state: order.shippingState,
        pincode: order.shippingPincode,
      },
      items,
      subtotal,
      discount,
      deliveryCharge,
      taxableAmount,
      cgstRate: halfRate,
      cgstAmount,
      sgstRate: halfRate,
      sgstAmount,
      igstRate: 0,
      igstAmount: 0,
      roundOff: 0,
      total,
      paymentMethod: order.paymentMethod,
      paymentId: order.razorpayPaymentId,
      couponCode: order.couponCode,
    });

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Invoice generation failed:", error);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
