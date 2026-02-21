"use server";

import { db } from "@/db";
import {
  suppliers,
  purchaseOrders,
  purchaseOrderItems,
  stockAdjustments,
  billReturns,
  billPayments,
  productVariants,
  products,
  inStoreBills,
  orders,
  storeSettings,
  users,
} from "@/db/schema";
import { eq, desc, asc, sql, count, sum, and, gte, lte, ilike, or, ne, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireAdminOrCashier } from "@/lib/admin/require-admin";

// ── Valid enum values (runtime validation whitelists) ────────
const VALID_PO_STATUSES = ["Draft", "Ordered", "Partial", "Received", "Cancelled"] as const;

/** Escape ILIKE special characters */
function escapeIlike(str: string): string {
  return str.replace(/[%_\\]/g, (ch) => "\\" + ch);
}

// ═══════════════════════════════════════════════════════════════
// SUPPLIER MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export async function getSuppliers(params?: { page?: number; search?: string }) {
  await requireAdmin();
  const page = params?.page ?? 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params?.search) {
    const escaped = escapeIlike(params.search);
    conditions.push(
      or(
        ilike(suppliers.name, `%${escaped}%`),
        ilike(suppliers.phone, `%${escaped}%`),
        ilike(suppliers.city, `%${escaped}%`),
        ilike(suppliers.gstin, `%${escaped}%`)
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult] = await Promise.all([
    db.select().from(suppliers).where(where).orderBy(desc(suppliers.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(suppliers).where(where),
  ]);

  return {
    suppliers: rows,
    total: totalResult[0]?.count ?? 0,
    page,
    totalPages: Math.ceil((totalResult[0]?.count ?? 0) / limit),
  };
}

export async function getSupplier(supplierId: number) {
  await requireAdmin();
  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.supplierId, supplierId)).limit(1);
  return supplier ?? null;
}

export async function createSupplier(data: {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  notes?: string;
}) {
  await requireAdmin();

  const [supplier] = await db.insert(suppliers).values({
    name: data.name,
    contactPerson: data.contactPerson || null,
    phone: data.phone || null,
    email: data.email || null,
    gstin: data.gstin || null,
    pan: data.pan || null,
    addressLine1: data.addressLine1 || null,
    addressLine2: data.addressLine2 || null,
    city: data.city || null,
    state: data.state || null,
    pincode: data.pincode || null,
    notes: data.notes || null,
  }).returning();

  revalidatePath("/studio/suppliers");
  return supplier;
}

export async function updateSupplier(supplierId: number, data: {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  notes?: string;
  isActive?: boolean;
}) {
  await requireAdmin();

  await db.update(suppliers).set({ ...data, updatedAt: new Date() }).where(eq(suppliers.supplierId, supplierId));

  revalidatePath("/studio/suppliers");
  return { success: true };
}

export async function deleteSupplier(supplierId: number) {
  await requireAdmin();

  // Safety check: ensure no purchase orders reference this supplier
  const [poRef] = await db
    .select({ count: count() })
    .from(purchaseOrders)
    .where(eq(purchaseOrders.supplierId, supplierId));
  if (poRef && poRef.count > 0) {
    throw new Error("Cannot delete supplier with existing purchase orders. Deactivate instead.");
  }

  await db.delete(suppliers).where(eq(suppliers.supplierId, supplierId));
  revalidatePath("/studio/suppliers");
  return { success: true };
}

export async function getSuppliersList() {
  await requireAdmin();
  return db.select({ supplierId: suppliers.supplierId, name: suppliers.name }).from(suppliers).where(eq(suppliers.isActive, true)).orderBy(asc(suppliers.name));
}

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

  let subtotal = 0;
  let gstTotal = 0;
  const itemsWithAmount = data.items.map(item => {
    const amount = item.orderedQty * Number(item.costPrice);
    const gst = amount * Number(item.gstRate) / 100;
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
  return po;
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

// ═══════════════════════════════════════════════════════════════
// INVENTORY / STOCK MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export async function getInventoryOverview() {
  await requireAdmin();

  const [totalVariants] = await db.select({ count: count() }).from(productVariants);
  const [outOfStock] = await db.select({ count: count() }).from(productVariants).where(eq(productVariants.stockCount, 0));
  const [lowStock] = await db.select({ count: count() }).from(productVariants).where(and(gte(productVariants.stockCount, 1), lte(productVariants.stockCount, 5)));
  const [totalStockResult] = await db.select({ total: sum(productVariants.stockCount) }).from(productVariants);

  return {
    totalVariants: totalVariants?.count ?? 0,
    outOfStock: outOfStock?.count ?? 0,
    lowStock: lowStock?.count ?? 0,
    totalStock: Number(totalStockResult?.total ?? 0),
  };
}

export async function getLowStockItems(threshold = 5, page = 1) {
  await requireAdmin();
  const safeThreshold = Math.min(Math.max(0, threshold), 100);
  const limit = 30;
  const offset = (page - 1) * limit;

  const items = await db
    .select({
      variantId: productVariants.variantId,
      productName: products.productName,
      productCode: products.productCode,
      color: productVariants.color,
      size: productVariants.size,
      sku: productVariants.sku,
      barcode: productVariants.barcode,
      stockCount: productVariants.stockCount,
      costPrice: productVariants.costPrice,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.productId))
    .where(lte(productVariants.stockCount, safeThreshold))
    .orderBy(asc(productVariants.stockCount))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db.select({ count: count() }).from(productVariants).where(lte(productVariants.stockCount, safeThreshold));

  return { items, total: totalResult?.count ?? 0, page, totalPages: Math.ceil((totalResult?.count ?? 0) / limit) };
}

export async function getStockAdjustments(params?: { variantId?: number; page?: number }) {
  await requireAdmin();
  const page = params?.page ?? 1;
  const limit = 30;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params?.variantId) {
    conditions.push(eq(stockAdjustments.variantId, params.variantId));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult] = await Promise.all([
    db.select().from(stockAdjustments).where(where).orderBy(desc(stockAdjustments.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(stockAdjustments).where(where),
  ]);

  return { adjustments: rows, total: totalResult[0]?.count ?? 0, page, totalPages: Math.ceil((totalResult[0]?.count ?? 0) / limit) };
}

export async function createStockAdjustment(data: {
  variantId: number;
  type: "manual_add" | "manual_remove" | "damage" | "opening_stock";
  quantity: number;
  reason?: string;
}) {
  const admin = await requireAdmin();

  const isAdding = data.type === "manual_add" || data.type === "opening_stock";
  const change = isAdding ? data.quantity : -data.quantity;

  // Update variant stock
  await db.update(productVariants).set({
    stockCount: isAdding
      ? sql`${productVariants.stockCount} + ${data.quantity}`
      : sql`GREATEST(${productVariants.stockCount} - ${data.quantity}, 0)`,
    updatedAt: new Date(),
  }).where(eq(productVariants.variantId, data.variantId));

  const [updated] = await db.select({ stockCount: productVariants.stockCount }).from(productVariants).where(eq(productVariants.variantId, data.variantId));

  await db.insert(stockAdjustments).values({
    variantId: data.variantId,
    type: data.type,
    quantityChange: change,
    stockAfter: updated?.stockCount ?? 0,
    referenceType: "manual",
    reason: data.reason || null,
    createdBy: admin.email,
  });

  revalidatePath("/studio/inventory");
  revalidatePath("/studio/products");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// BARCODE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export async function updateVariantBarcode(variantId: number, barcode: string) {
  await requireAdmin();
  await db.update(productVariants).set({ barcode, updatedAt: new Date() }).where(eq(productVariants.variantId, variantId));
  revalidatePath("/studio/products");
  revalidatePath("/studio/barcode");
  return { success: true };
}

export async function searchByBarcode(barcode: string) {
  await requireAdminOrCashier();
  if (!barcode || barcode.length < 3) return null;

  const result = await db
    .select({
      variantId: productVariants.variantId,
      productId: products.productId,
      productName: products.productName,
      productCode: products.productCode,
      basePrice: products.basePrice,
      mrp: products.mrp,
      color: productVariants.color,
      size: productVariants.size,
      sku: productVariants.sku,
      barcode: productVariants.barcode,
      stockCount: productVariants.stockCount,
      priceModifier: productVariants.priceModifier,
      variantPrice: productVariants.price,
      variantMrp: productVariants.mrp,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.productId))
    .where(and(
      eq(products.isActive, true),
      or(
        eq(productVariants.barcode, barcode),
        eq(productVariants.sku, barcode)
      )
    ))
    .limit(1);

  return result[0] ?? null;
}

export async function getVariantsForBarcodes(params?: { page?: number; search?: string; onlyMissing?: boolean }) {
  await requireAdmin();
  const page = params?.page ?? 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  const conditions = [eq(products.isActive, true)];
  if (params?.search) {
    const escaped = escapeIlike(params.search);
    conditions.push(
      or(
        ilike(products.productName, `%${escaped}%`),
        ilike(products.productCode, `%${escaped}%`),
        ilike(productVariants.sku, `%${escaped}%`),
        ilike(productVariants.barcode, `%${escaped}%`)
      )!
    );
  }
  if (params?.onlyMissing) {
    conditions.push(
      or(
        sql`${productVariants.barcode} IS NULL`,
        eq(productVariants.barcode, "")
      )!
    );
  }

  const rows = await db
    .select({
      variantId: productVariants.variantId,
      productName: products.productName,
      productCode: products.productCode,
      color: productVariants.color,
      size: productVariants.size,
      sku: productVariants.sku,
      barcode: productVariants.barcode,
      basePrice: products.basePrice,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.productId))
    .where(and(...conditions))
    .orderBy(asc(products.productName), asc(productVariants.color), asc(productVariants.size))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: count() })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.productId))
    .where(and(...conditions));

  return { variants: rows, total: totalResult?.count ?? 0, page, totalPages: Math.ceil((totalResult?.count ?? 0) / limit) };
}

export async function bulkGenerateBarcodes(variantIds: number[]) {
  await requireAdmin();

  for (const variantId of variantIds) {
    // Generate EAN-13 compatible barcode from variant ID
    const baseCode = "200" + String(variantId).padStart(9, "0");
    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(baseCode[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const barcode = baseCode + checkDigit;

    await db.update(productVariants).set({ barcode, updatedAt: new Date() }).where(eq(productVariants.variantId, variantId));
  }

  revalidatePath("/studio/barcode");
  revalidatePath("/studio/products");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// BILL RETURNS & EXCHANGES
// ═══════════════════════════════════════════════════════════════

export async function createBillReturn(data: {
  originalBillId: number;
  returnType: "return" | "exchange";
  returnedItems: Array<{
    variantId: number;
    productName: string;
    variant: string;
    quantity: number;
    rate: number;
  }>;
  refundAmount: string;
  reason?: string;
  exchangeBillId?: number;
}) {
  const admin = await requireAdminOrCashier();

  // Validate originalBillId exists
  const [originalBill] = await db
    .select({ billId: inStoreBills.billId })
    .from(inStoreBills)
    .where(eq(inStoreBills.billId, data.originalBillId))
    .limit(1);
  if (!originalBill) {
    throw new Error("Original bill not found");
  }

  // Validate return type
  if (data.returnType !== "return" && data.returnType !== "exchange") {
    throw new Error("Invalid return type");
  }
  if (!data.returnedItems || data.returnedItems.length === 0) {
    throw new Error("At least one returned item is required");
  }
  if (isNaN(Number(data.refundAmount)) || Number(data.refundAmount) < 0) {
    throw new Error("Invalid refund amount");
  }

  const [billReturn] = await db.insert(billReturns).values({
    originalBillId: data.originalBillId,
    returnType: data.returnType,
    returnedItems: JSON.stringify(data.returnedItems),
    refundAmount: data.refundAmount,
    exchangeBillId: data.exchangeBillId || null,
    reason: data.reason || null,
    processedBy: admin.email,
  }).returning();

  // Restore stock for returned items
  for (const item of data.returnedItems) {
    if (item.variantId) {
      await db.update(productVariants).set({
        stockCount: sql`${productVariants.stockCount} + ${item.quantity}`,
        updatedAt: new Date(),
      }).where(eq(productVariants.variantId, item.variantId));

      const [updated] = await db.select({ stockCount: productVariants.stockCount }).from(productVariants).where(eq(productVariants.variantId, item.variantId));

      await db.insert(stockAdjustments).values({
        variantId: item.variantId,
        type: data.returnType === "exchange" ? "exchange_in" : "return_in",
        quantityChange: item.quantity,
        stockAfter: updated?.stockCount ?? 0,
        referenceType: "bill_return",
        referenceId: billReturn.billReturnId,
        reason: `${data.returnType} from bill #${data.originalBillId}`,
        createdBy: admin.email,
      });
    }
  }

  revalidatePath("/studio/billing");
  return billReturn;
}

export async function getBillReturns(billId?: number) {
  await requireAdminOrCashier();
  const conditions = billId ? [eq(billReturns.originalBillId, billId)] : [];
  return db.select().from(billReturns).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(billReturns.createdAt));
}

// ═══════════════════════════════════════════════════════════════
// SPLIT PAYMENTS
// ═══════════════════════════════════════════════════════════════

export async function createBillPayments(billId: number, payments: Array<{ paymentMode: string; amount: string; reference?: string }>) {
  await requireAdminOrCashier();
  for (const p of payments) {
    await db.insert(billPayments).values({
      billId,
      paymentMode: p.paymentMode,
      amount: p.amount,
      reference: p.reference || null,
    });
  }
  revalidatePath("/studio/billing");
  return { success: true };
}

export async function getBillPayments(billId: number) {
  await requireAdminOrCashier();
  return db.select().from(billPayments).where(eq(billPayments.billId, billId));
}

// ═══════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════

export async function getSalesReport(params: { from: string; to: string; groupBy?: "day" | "month" }) {
  await requireAdmin();

  const fromDate = new Date(params.from);
  const toDate = new Date(params.to);
  toDate.setHours(23, 59, 59, 999);

  // In-store sales
  const inStoreSales = await db
    .select({
      date: sql<string>`DATE(${inStoreBills.billDate})`.as("date"),
      count: count(),
      total: sum(inStoreBills.totalAmount),
      discount: sum(inStoreBills.discountAmount),
      gst: sql<string>`COALESCE(SUM(CAST(${inStoreBills.cgstAmount} AS NUMERIC) + CAST(${inStoreBills.sgstAmount} AS NUMERIC)), 0)`,
    })
    .from(inStoreBills)
    .where(and(gte(inStoreBills.billDate, fromDate), lte(inStoreBills.billDate, toDate)))
    .groupBy(sql`DATE(${inStoreBills.billDate})`)
    .orderBy(sql`DATE(${inStoreBills.billDate})`);

  // Online sales
  const onlineSales = await db
    .select({
      date: sql<string>`DATE(${orders.orderDate})`.as("date"),
      count: count(),
      total: sum(orders.totalAmount),
      discount: sum(orders.discountAmount),
    })
    .from(orders)
    .where(and(
      gte(orders.orderDate, fromDate),
      lte(orders.orderDate, toDate),
      eq(orders.paymentStatus, "Completed")
    ))
    .groupBy(sql`DATE(${orders.orderDate})`)
    .orderBy(sql`DATE(${orders.orderDate})`);

  // Totals
  const [inStoreTotals] = await db.select({
    count: count(),
    total: sum(inStoreBills.totalAmount),
    discount: sum(inStoreBills.discountAmount),
    cgst: sum(inStoreBills.cgstAmount),
    sgst: sum(inStoreBills.sgstAmount),
  }).from(inStoreBills).where(and(gte(inStoreBills.billDate, fromDate), lte(inStoreBills.billDate, toDate)));

  const [onlineTotals] = await db.select({
    count: count(),
    total: sum(orders.totalAmount),
    discount: sum(orders.discountAmount),
  }).from(orders).where(and(gte(orders.orderDate, fromDate), lte(orders.orderDate, toDate), eq(orders.paymentStatus, "Completed")));

  return {
    inStoreSales,
    onlineSales,
    summary: {
      inStoreCount: inStoreTotals?.count ?? 0,
      inStoreTotal: Number(inStoreTotals?.total ?? 0),
      inStoreDiscount: Number(inStoreTotals?.discount ?? 0),
      inStoreCgst: Number(inStoreTotals?.cgst ?? 0),
      inStoreSgst: Number(inStoreTotals?.sgst ?? 0),
      onlineCount: onlineTotals?.count ?? 0,
      onlineTotal: Number(onlineTotals?.total ?? 0),
      onlineDiscount: Number(onlineTotals?.discount ?? 0),
      grandTotal: Number(inStoreTotals?.total ?? 0) + Number(onlineTotals?.total ?? 0),
    },
  };
}

export async function getProfitReport(params: { from: string; to: string }) {
  await requireAdmin();

  const fromDate = new Date(params.from);
  const toDate = new Date(params.to);
  toDate.setHours(23, 59, 59, 999);

  // In-store bills — parse items JSON to calculate cost and profit
  const bills = await db.select({
    billId: inStoreBills.billId,
    totalAmount: inStoreBills.totalAmount,
    discountAmount: inStoreBills.discountAmount,
    items: inStoreBills.items,
    billDate: inStoreBills.billDate,
  }).from(inStoreBills).where(and(gte(inStoreBills.billDate, fromDate), lte(inStoreBills.billDate, toDate)));

  let totalRevenue = 0;
  let totalCost = 0;

  // Collect all variant IDs from all bills first (avoids N+1 queries)
  const allItemsParsed: Array<{ variantId: number; quantity: number }> = [];
  const variantIdSet = new Set<number>();

  for (const bill of bills) {
    totalRevenue += Number(bill.totalAmount);
    try {
      const items = JSON.parse(bill.items) as Array<{ variantId?: number; quantity: number; rate: number }>;
      for (const item of items) {
        if (item.variantId) {
          allItemsParsed.push({ variantId: item.variantId, quantity: item.quantity });
          variantIdSet.add(item.variantId);
        }
      }
    } catch { /* ignore parse errors */ }
  }

  // Single batch query for all variant cost prices
  if (variantIdSet.size > 0) {
    const variantCosts = await db
      .select({ variantId: productVariants.variantId, costPrice: productVariants.costPrice })
      .from(productVariants)
      .where(inArray(productVariants.variantId, Array.from(variantIdSet)));

    const costMap = new Map<number, number>();
    for (const v of variantCosts) {
      if (v.costPrice) costMap.set(v.variantId, Number(v.costPrice));
    }

    for (const item of allItemsParsed) {
      const cost = costMap.get(item.variantId);
      if (cost) totalCost += cost * item.quantity;
    }
  }

  // Purchase costs in period
  const [purchaseTotals] = await db.select({
    total: sum(purchaseOrders.totalAmount),
  }).from(purchaseOrders).where(and(
    gte(purchaseOrders.orderDate, fromDate),
    lte(purchaseOrders.orderDate, toDate),
    ne(purchaseOrders.status, "Cancelled")
  ));

  return {
    totalRevenue,
    totalCost,
    grossProfit: totalRevenue - totalCost,
    profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(1) : "0.0",
    totalPurchases: Number(purchaseTotals?.total ?? 0),
    billCount: bills.length,
  };
}

export async function getGstReport(params: { from: string; to: string }) {
  await requireAdmin();

  const fromDate = new Date(params.from);
  const toDate = new Date(params.to);
  toDate.setHours(23, 59, 59, 999);

  const bills = await db.select({
    billId: inStoreBills.billId,
    invoiceNumber: inStoreBills.invoiceNumber,
    customerName: inStoreBills.customerName,
    customerGstin: inStoreBills.customerGstin,
    taxableAmount: inStoreBills.taxableAmount,
    cgstRate: inStoreBills.cgstRate,
    cgstAmount: inStoreBills.cgstAmount,
    sgstRate: inStoreBills.sgstRate,
    sgstAmount: inStoreBills.sgstAmount,
    igstRate: inStoreBills.igstRate,
    igstAmount: inStoreBills.igstAmount,
    totalAmount: inStoreBills.totalAmount,
    billDate: inStoreBills.billDate,
  }).from(inStoreBills).where(and(
    gte(inStoreBills.billDate, fromDate),
    lte(inStoreBills.billDate, toDate)
  )).orderBy(asc(inStoreBills.billDate));

  const [totals] = await db.select({
    taxable: sum(inStoreBills.taxableAmount),
    cgst: sum(inStoreBills.cgstAmount),
    sgst: sum(inStoreBills.sgstAmount),
    igst: sum(inStoreBills.igstAmount),
    total: sum(inStoreBills.totalAmount),
    count: count(),
  }).from(inStoreBills).where(and(
    gte(inStoreBills.billDate, fromDate),
    lte(inStoreBills.billDate, toDate)
  ));

  return {
    bills,
    summary: {
      totalTaxable: Number(totals?.taxable ?? 0),
      totalCgst: Number(totals?.cgst ?? 0),
      totalSgst: Number(totals?.sgst ?? 0),
      totalIgst: Number(totals?.igst ?? 0),
      totalTax: Number(totals?.cgst ?? 0) + Number(totals?.sgst ?? 0) + Number(totals?.igst ?? 0),
      grandTotal: Number(totals?.total ?? 0),
      billCount: totals?.count ?? 0,
    },
  };
}

export async function getStockReport() {
  await requireAdmin();

  const items = await db
    .select({
      productId: products.productId,
      productName: products.productName,
      productCode: products.productCode,
      variantId: productVariants.variantId,
      color: productVariants.color,
      size: productVariants.size,
      sku: productVariants.sku,
      barcode: productVariants.barcode,
      stockCount: productVariants.stockCount,
      costPrice: productVariants.costPrice,
      basePrice: products.basePrice,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.productId))
    .where(eq(products.isActive, true))
    .orderBy(asc(products.productName), asc(productVariants.color), asc(productVariants.size));

  const totalItems = items.length;
  const totalStock = items.reduce((sum, i) => sum + (i.stockCount ?? 0), 0);
  const totalStockValue = items.reduce((sum, i) => sum + (Number(i.costPrice ?? i.basePrice) * (i.stockCount ?? 0)), 0);
  const outOfStock = items.filter(i => (i.stockCount ?? 0) === 0).length;
  const lowStock = items.filter(i => (i.stockCount ?? 0) > 0 && (i.stockCount ?? 0) <= 5).length;

  return {
    items,
    summary: {
      totalItems,
      totalStock,
      totalStockValue,
      outOfStock,
      lowStock,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// BACKUP
// ═══════════════════════════════════════════════════════════════

export async function getBackupData() {
  await requireAdmin();

  const [
    allProducts,
    allVariants,
    allOrders,
    allBills,
    allSuppliers,
    allPurchaseOrders,
    allCustomers,
    settings,
  ] = await Promise.all([
    db.select().from(products),
    db.select().from(productVariants),
    db.select().from(orders),
    db.select().from(inStoreBills),
    db.select().from(suppliers),
    db.select().from(purchaseOrders),
    // Only select non-sensitive fields for backup - exclude auth details
    db.select({
      userId: users.userId,
      name: users.name,
      phoneNumber: users.phoneNumber,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users),
    db.select().from(storeSettings).limit(1),
  ]);

  return {
    exportDate: new Date().toISOString(),
    products: allProducts,
    variants: allVariants,
    orders: allOrders,
    inStoreBills: allBills,
    suppliers: allSuppliers,
    purchaseOrders: allPurchaseOrders,
    customers: allCustomers,
    storeSettings: settings[0] ?? null,
  };
}

export async function getBackupStats() {
  await requireAdmin();

  const [productsCount, variantsCount, ordersCount, billsCount, customersCount, suppliersCount] = await Promise.all([
    db.select({ count: count() }).from(products),
    db.select({ count: count() }).from(productVariants),
    db.select({ count: count() }).from(orders),
    db.select({ count: count() }).from(inStoreBills),
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(suppliers),
  ]);

  return {
    products: productsCount[0]?.count ?? 0,
    variants: variantsCount[0]?.count ?? 0,
    orders: ordersCount[0]?.count ?? 0,
    bills: billsCount[0]?.count ?? 0,
    customers: customersCount[0]?.count ?? 0,
    suppliers: suppliersCount[0]?.count ?? 0,
  };
}
