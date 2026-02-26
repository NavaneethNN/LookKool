"use server";

import { db } from "@/db";
import {
  suppliers,
  purchaseOrders,
} from "@/db/schema";
import { eq, desc, asc, count, and, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { escapeIlike } from "./_helpers";

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
  return { supplierId: supplier.supplierId, name: supplier.name };
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
