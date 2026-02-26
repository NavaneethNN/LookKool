"use server";

import { db } from "@/db";
import {
  inStoreBills,
  productVariants,
  storeSettings,
  stockAdjustments,
} from "@/db/schema";
import { eq, desc, sql, count, and, inArray, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdminOrCashier } from "@/lib/admin/require-admin";
import { escapeIlike } from "./_helpers";

export async function generateInvoiceNumber() {
  await requireAdminOrCashier();

  // Atomic increment to prevent race conditions with concurrent cashiers
  const [result] = await db
    .update(storeSettings)
    .set({
      nextInvoiceNumber: sql`${storeSettings.nextInvoiceNumber} + 1`,
      updatedAt: new Date(),
    })
    .returning({
      invoicePrefix: storeSettings.invoicePrefix,
      prevNumber: sql<number>`${storeSettings.nextInvoiceNumber} - 1`,
    });

  if (!result) {
    // No settings row exists yet — create one atomically
    const [created] = await db
      .insert(storeSettings)
      .values({
        businessName: "LookKool",
        city: "",
        state: "Tamil Nadu",
        stateCode: "33",
        gstRate: "5.00",
        hsnCode: "6104",
        enableGst: true,
        invoicePrefix: "LK",
        nextInvoiceNumber: 2, // 1 is used now
      })
      .returning({ invoicePrefix: storeSettings.invoicePrefix });
    return `${created?.invoicePrefix ?? "LK"}-000001`;
  }

  const prefix = result.invoicePrefix ?? "LK";
  const num = result.prevNumber ?? 1;
  return `${prefix}-${String(num).padStart(6, "0")}`;
}

export async function createInStoreBill(data: {
  customerName?: string;
  customerPhone?: string;
  customerGstin?: string;
  subtotal: string;
  discountAmount: string;
  taxableAmount: string;
  cgstRate: string;
  cgstAmount: string;
  sgstRate: string;
  sgstAmount: string;
  igstRate: string;
  igstAmount: string;
  roundOff: string;
  totalAmount: string;
  paymentMode: string;
  items: string; // JSON string of line items
  notes?: string;
}) {
  const admin = await requireAdminOrCashier();

  // Validate items JSON server-side
  let parsedItems: Array<{ variantId?: number; quantity: number; productName?: string; rate?: number; amount?: number }>;
  try {
    parsedItems = JSON.parse(data.items);
    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      throw new Error("Items must be a non-empty array");
    }
    for (const item of parsedItems) {
      if (typeof item.quantity !== "number" || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        throw new Error("Each item must have a valid integer quantity >= 1");
      }
    }
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error("Invalid items JSON");
    }
    throw e;
  }

  // Validate numeric fields
  const numericFields = ["subtotal", "discountAmount", "taxableAmount", "cgstRate", "cgstAmount", "sgstRate", "sgstAmount", "igstRate", "igstAmount", "roundOff", "totalAmount"] as const;
  for (const field of numericFields) {
    if (isNaN(Number(data[field]))) {
      throw new Error(`Invalid numeric value for ${field}`);
    }
  }

  // Prevent negative totals
  if (Number(data.totalAmount) < 0) {
    throw new Error("Total amount cannot be negative");
  }
  if (Number(data.taxableAmount) < 0) {
    throw new Error("Taxable amount cannot be negative");
  }

  // Validate stock availability BEFORE creating the bill
  const variantItems = parsedItems.filter(item => item.variantId);
  if (variantItems.length > 0) {
    const variantIds = variantItems.map(item => item.variantId!).filter(Boolean);
    const stocks = await db
      .select({ variantId: productVariants.variantId, stockCount: productVariants.stockCount })
      .from(productVariants)
      .where(inArray(productVariants.variantId, variantIds));

    const stockMap = new Map(stocks.map(s => [s.variantId, s.stockCount]));
    for (const item of variantItems) {
      const available = stockMap.get(item.variantId!) ?? 0;
      if (available < item.quantity) {
        throw new Error(`Insufficient stock for variant ${item.variantId} (available: ${available}, requested: ${item.quantity})`);
      }
    }
  }

  const invoiceNumber = await generateInvoiceNumber();

  const [bill] = await db
    .insert(inStoreBills)
    .values({
      invoiceNumber,
      customerName: data.customerName || null,
      customerPhone: data.customerPhone || null,
      customerGstin: data.customerGstin || null,
      subtotal: data.subtotal,
      discountAmount: data.discountAmount,
      taxableAmount: data.taxableAmount,
      cgstRate: data.cgstRate,
      cgstAmount: data.cgstAmount,
      sgstRate: data.sgstRate,
      sgstAmount: data.sgstAmount,
      igstRate: data.igstRate,
      igstAmount: data.igstAmount,
      roundOff: data.roundOff,
      totalAmount: data.totalAmount,
      paymentMode: data.paymentMode,
      items: data.items,
      createdBy: admin.email,
      notes: data.notes || null,
    })
    .returning();

  // Deduct stock for each sold item with audit trail
  for (const item of parsedItems) {
    if (item.variantId) {
      await db
        .update(productVariants)
        .set({
          stockCount: sql`GREATEST(${productVariants.stockCount} - ${item.quantity}, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.variantId, item.variantId));

      // Log stock movement for audit trail
      const [updated] = await db
        .select({ stockCount: productVariants.stockCount })
        .from(productVariants)
        .where(eq(productVariants.variantId, item.variantId));

      await db.insert(stockAdjustments).values({
        variantId: item.variantId,
        type: "sale_out",
        quantityChange: -item.quantity,
        stockAfter: updated?.stockCount ?? 0,
        referenceType: "bill",
        referenceId: bill.billId,
        reason: `In-store bill ${invoiceNumber}`,
        createdBy: admin.email,
      });
    }
  }

  revalidatePath("/studio/billing");
  revalidatePath("/studio/inventory");
  return { billId: bill.billId, invoiceNumber: bill.invoiceNumber };
}

export async function getInStoreBills(params?: { page?: number; search?: string }) {
  await requireAdminOrCashier();

  const page = params?.page ?? 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params?.search) {
    const escaped = escapeIlike(params.search);
    conditions.push(
      or(
        ilike(inStoreBills.invoiceNumber, `%${escaped}%`),
        ilike(inStoreBills.customerName, `%${escaped}%`),
        ilike(inStoreBills.customerPhone, `%${escaped}%`)
      )
    );
  }

  const bills = await db
    .select()
    .from(inStoreBills)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(inStoreBills.billDate))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: count() })
    .from(inStoreBills)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    bills,
    total: totalResult?.count ?? 0,
    page,
    totalPages: Math.ceil((totalResult?.count ?? 0) / limit),
  };
}

export async function getInStoreBill(billId: number) {
  await requireAdminOrCashier();

  const [bill] = await db
    .select()
    .from(inStoreBills)
    .where(eq(inStoreBills.billId, billId))
    .limit(1);

  return bill ?? null;
}
