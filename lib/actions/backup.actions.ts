"use server";

import { db } from "@/db";
import {
  suppliers,
  purchaseOrders,
  productVariants,
  products,
  inStoreBills,
  orders,
  storeSettings,
  users,
} from "@/db/schema";
import { count } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin/require-admin";

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
      userId: users.id,
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
