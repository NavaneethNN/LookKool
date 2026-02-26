"use server";

import { db } from "@/db";
import {
  purchaseOrders,
  productVariants,
  products,
  inStoreBills,
  orders,
} from "@/db/schema";
import { eq, asc, sql, count, sum, and, gte, lte, ne, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin/require-admin";

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
