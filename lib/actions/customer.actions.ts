"use server";

import { db } from "@/db";
import { users, userAddresses, orders } from "@/db/schema";
import { eq, desc, sql, count, and, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { escapeIlike } from "./_helpers";

// ═══════════════════════════════════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════════════════════════════════

export async function getAdminCustomers(params?: {
  page?: number;
  search?: string;
}) {
  await requireAdmin();

  const page = params?.page ?? 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params?.search) {
    const escaped = escapeIlike(params.search);
    conditions.push(
      or(
        ilike(users.name, `%${escaped}%`),
        ilike(users.email, `%${escaped}%`)
      )
    );
  }

  const allUsers = await db
    .select({
      userId: users.userId,
      name: users.name,
      email: users.email,
      phoneNumber: users.phoneNumber,
      role: users.role,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      orderCount: sql<number>`(SELECT COUNT(*) FROM orders o WHERE o.user_id = users.user_id)`,
      totalSpent: sql<number>`COALESCE((SELECT SUM(o.total_amount) FROM orders o WHERE o.user_id = users.user_id AND o.payment_status = 'Completed'), 0)`,
    })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: count() })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    customers: allUsers,
    total: totalResult?.count ?? 0,
    page,
    totalPages: Math.ceil((totalResult?.count ?? 0) / limit),
  };
}

export async function getAdminCustomerDetail(userId: string) {
  await requireAdmin();

  const [customer] = await db
    .select()
    .from(users)
    .where(eq(users.userId, userId))
    .limit(1);

  const addresses = await db
    .select()
    .from(userAddresses)
    .where(eq(userAddresses.userId, userId));

  const customerOrders = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: [desc(orders.orderDate)],
    with: { items: { columns: { orderItemId: true } } },
  });

  return { customer, addresses, orders: customerOrders };
}

export async function updateUserRole(userId: string, role: "customer" | "admin" | "cashier") {
  await requireAdmin();

  const validRoles = ["customer", "admin", "cashier"] as const;
  if (!validRoles.includes(role)) {
    throw new Error("Invalid role");
  }

  await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.userId, userId));

  revalidatePath("/studio/customers");
  revalidatePath(`/studio/customers/${userId}`);
  return { success: true };
}
