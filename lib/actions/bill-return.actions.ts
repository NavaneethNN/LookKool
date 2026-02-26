"use server";

import { db } from "@/db";
import {
  billReturns,
  billPayments,
  productVariants,
  inStoreBills,
  stockAdjustments,
} from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdminOrCashier } from "@/lib/admin/require-admin";

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
  return { billReturnId: billReturn.billReturnId, success: true };
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

  if (!payments || payments.length === 0) {
    throw new Error("At least one payment is required");
  }

  for (const p of payments) {
    if (!p.paymentMode || typeof p.paymentMode !== "string" || p.paymentMode.trim().length === 0) {
      throw new Error("Each payment must have a valid payment mode");
    }
    if (isNaN(Number(p.amount)) || Number(p.amount) < 0) {
      throw new Error("Each payment must have a valid amount");
    }
    await db.insert(billPayments).values({
      billId,
      paymentMode: p.paymentMode.trim(),
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
