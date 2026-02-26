"use server";

import { db } from "@/db";
import {
  suppliers,
  purchaseOrders,
  purchaseOrderItems,
  stockAdjustments,
  productVariants,
} from "@/db/schema";
import { eq, desc, sql, count, sum, and, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { escapeIlike } from "./_helpers";

// ── Valid enum values (runtime validation whitelists) ────────
const VALID_PO_STATUSES = ["Draft", "Ordered", "Partial", "Received", "Cancelled"] as const;

// ═══════════════════════════════════════════════════════════════
// PURCHASE ORDER MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export async function generatePONumber() {
  await requireAdmin();

  const [result] = await db.select({ count: count() }).from(purchaseOrders);
  const num = (result?.count ?? 0) + 1;
  return `PO-${String(num).padStart(6, "0")}`;
}

export async function getPurchaseOrders(params?: { page?: number; search?: string; status?: string }) {
  await requireAdmin();
  const page = params?.page ?? 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params?.search) {
    const escaped = escapeIlike(params.search);
    conditions.push(
      or(
        ilike(purchaseOrders.poNumber, `%${escaped}%`),
        ilike(purchaseOrders.supplierInvoiceNo, `%${escaped}%`)
      )
    );
  }
  if (params?.status && params.status !== "all") {
    if (!VALID_PO_STATUSES.includes(params.status as typeof VALID_PO_STATUSES[number])) {
      throw new Error("Invalid purchase order status filter");
    }
    conditions.push(eq(purchaseOrders.status, params.status as "Draft" | "Ordered" | "Partial" | "Received" | "Cancelled"));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult] = await Promise.all([
    db.query.purchaseOrders.findMany({
      where,
      orderBy: [desc(purchaseOrders.createdAt)],
      limit,
      offset,
      with: { supplier: { columns: { name: true } } },
    }),
    db.select({ count: count() }).from(purchaseOrders).where(where),
  ]);

  return {
    orders: rows,
    total: totalResult[0]?.count ?? 0,
    page,
    totalPages: Math.ceil((totalResult[0]?.count ?? 0) / limit),
  };
}

export async function getPurchaseOrder(id: number) {
  await requireAdmin();
  return db.query.purchaseOrders.findFirst({
    where: eq(purchaseOrders.purchaseOrderId, id),
    with: {
      supplier: true,
      items: true,
    },
  });
}

export async function createPurchaseOrder(data: {
  supplierId: number;
  orderDate?: string;
  expectedDate?: string;
  supplierInvoiceNo?: string;
  notes?: string;
  items: Array<{
    variantId: number;
    productName: string;
    variantInfo: string;
    sku?: string;
    orderedQty: number;
    costPrice: string;
    gstRate: string;
  }>;
}) {
  const admin = await requireAdmin();
  const poNumber = await generatePONumber();

  // Validate line items
  if (!data.items || data.items.length === 0) {
    throw new Error("At least one item is required");
  }
  for (const item of data.items) {
    if (!item.variantId || !Number.isInteger(item.variantId) || item.variantId < 1) {
      throw new Error("Each item must have a valid variant ID");
    }
    if (typeof item.orderedQty !== "number" || !Number.isInteger(item.orderedQty) || item.orderedQty < 1) {
      throw new Error("Each item must have a valid ordered quantity >= 1");
    }
    if (isNaN(Number(item.costPrice)) || Number(item.costPrice) < 0) {
      throw new Error("Each item must have a valid cost price");
    }
    if (isNaN(Number(item.gstRate)) || Number(item.gstRate) < 0) {
      throw new Error("Each item must have a valid GST rate");
    }
  }

  let subtotal = 0;
  let gstTotal = 0;
  const itemsWithAmount = data.items.map(item => {
    const costPrice = Number(item.costPrice) || 0;
    const gstRate = Number(item.gstRate) || 0;
    const amount = item.orderedQty * costPrice;
    const gst = amount * gstRate / 100;
    subtotal += amount;
    gstTotal += gst;
    return { ...item, amount: amount.toFixed(2) };
  });

  const totalAmount = subtotal + gstTotal;

  const [po] = await db.insert(purchaseOrders).values({
    poNumber,
    supplierId: data.supplierId,
    orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
    expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
    supplierInvoiceNo: data.supplierInvoiceNo || null,
    notes: data.notes || null,
    subtotal: subtotal.toFixed(2),
    gstAmount: gstTotal.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
    status: "Ordered",
    createdBy: admin.email,
  }).returning();

  // Insert line items
  for (const item of itemsWithAmount) {
    await db.insert(purchaseOrderItems).values({
      purchaseOrderId: po.purchaseOrderId,
      variantId: item.variantId,
      productName: item.productName,
      variantInfo: item.variantInfo,
      sku: item.sku || null,
      orderedQty: item.orderedQty,
      costPrice: item.costPrice,
      gstRate: item.gstRate,
      amount: item.amount,
    });
  }

  revalidatePath("/studio/purchases");
  return { purchaseOrderId: po.purchaseOrderId, poNumber: po.poNumber };
}

export async function receivePurchaseOrder(purchaseOrderId: number, receivedItems: Array<{ poItemId: number; receivedQty: number }>) {
  const admin = await requireAdmin();

  const po = await db.query.purchaseOrders.findFirst({
    where: eq(purchaseOrders.purchaseOrderId, purchaseOrderId),
    with: { items: true },
  });

  if (!po) throw new Error("Purchase order not found");

  let allReceived = true;
  let anyReceived = false;

  for (const ri of receivedItems) {
    const poItem = po.items.find(i => i.poItemId === ri.poItemId);
    if (!poItem) continue;

    const newReceivedQty = ri.receivedQty;
    if (newReceivedQty > 0) anyReceived = true;
    if (newReceivedQty < poItem.orderedQty) allReceived = false;

    // Update PO item
    await db.update(purchaseOrderItems).set({ receivedQty: newReceivedQty }).where(eq(purchaseOrderItems.poItemId, ri.poItemId));

    // Add stock to variant
    const qtyToAdd = newReceivedQty - (poItem.receivedQty ?? 0);
    if (qtyToAdd > 0) {
      // Update product variant stock
      await db.update(productVariants).set({
        stockCount: sql`${productVariants.stockCount} + ${qtyToAdd}`,
        costPrice: poItem.costPrice,
        updatedAt: new Date(),
      }).where(eq(productVariants.variantId, poItem.variantId));

      // Get updated stock count
      const [updatedVariant] = await db.select({ stockCount: productVariants.stockCount }).from(productVariants).where(eq(productVariants.variantId, poItem.variantId));

      // Log stock adjustment
      await db.insert(stockAdjustments).values({
        variantId: poItem.variantId,
        type: "purchase_in",
        quantityChange: qtyToAdd,
        stockAfter: updatedVariant?.stockCount ?? 0,
        referenceType: "purchase_order",
        referenceId: purchaseOrderId,
        reason: `PO ${po.poNumber} received`,
        createdBy: admin.email,
      });
    }
  }

  // Update PO status
  const newStatus = allReceived ? "Received" : anyReceived ? "Partial" : po.status;
  await db.update(purchaseOrders).set({
    status: newStatus,
    receivedDate: allReceived ? new Date() : null,
    updatedAt: new Date(),
  }).where(eq(purchaseOrders.purchaseOrderId, purchaseOrderId));

  revalidatePath("/studio/purchases");
  revalidatePath("/studio/inventory");
  return { success: true };
}

export async function updatePurchaseOrderPayment(poId: number, paidAmount: string) {
  await requireAdmin();

  if (isNaN(Number(paidAmount)) || Number(paidAmount) < 0) {
    throw new Error("Invalid paid amount");
  }

  await db.update(purchaseOrders).set({ paidAmount, updatedAt: new Date() }).where(eq(purchaseOrders.purchaseOrderId, poId));

  // Update supplier total paid
  const po = await getPurchaseOrder(poId);
  if (po) {
    const [totalPaid] = await db.select({ total: sum(purchaseOrders.paidAmount) }).from(purchaseOrders).where(eq(purchaseOrders.supplierId, po.supplierId));
    await db.update(suppliers).set({ totalPaid: totalPaid?.total ?? "0.00", updatedAt: new Date() }).where(eq(suppliers.supplierId, po.supplierId));
  }

  revalidatePath("/studio/purchases");
  return { success: true };
}
