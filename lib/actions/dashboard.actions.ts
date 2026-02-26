"use server";

import { db } from "@/db";
import { orders, users, products, returnRequests, reviews } from "@/db/schema";
import { eq, count, sum, gte, sql, desc, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin/require-admin";

export async function getDashboardStats() {
  await requireAdmin();

  const [
    totalOrdersResult,
    totalRevenueResult,
    totalCustomersResult,
    totalProductsResult,
    pendingOrdersResult,
    pendingReturnsResult,
    pendingReviewsResult,
    todayOrdersResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(orders),
    db.select({ total: sum(orders.totalAmount) }).from(orders).where(eq(orders.paymentStatus, "Completed")),
    db.select({ count: count() }).from(users).where(eq(users.role, "customer")),
    db.select({ count: count() }).from(products),
    db.select({ count: count() }).from(orders).where(eq(orders.status, "Pending")),
    db.select({ count: count() }).from(returnRequests).where(eq(returnRequests.status, "Pending")),
    db.select({ count: count() }).from(reviews),
    db.select({ count: count() }).from(orders).where(
      gte(orders.orderDate, sql`NOW() - INTERVAL '24 hours'`)
    ),
  ]);

  return {
    totalOrders: totalOrdersResult[0]?.count ?? 0,
    totalRevenue: Number(totalRevenueResult[0]?.total ?? 0),
    totalCustomers: totalCustomersResult[0]?.count ?? 0,
    totalProducts: totalProductsResult[0]?.count ?? 0,
    pendingOrders: pendingOrdersResult[0]?.count ?? 0,
    pendingReturns: pendingReturnsResult[0]?.count ?? 0,
    totalReviews: pendingReviewsResult[0]?.count ?? 0,
    todayOrders: todayOrdersResult[0]?.count ?? 0,
  };
}

export async function getRecentOrders(limit = 10) {
  await requireAdmin();

  const safeLimit = Math.min(Math.max(1, limit), 100);

  return db.query.orders.findMany({
    orderBy: [desc(orders.orderDate)],
    limit: safeLimit,
    with: {
      user: { columns: { name: true, email: true } },
      items: { columns: { orderItemId: true } },
    },
  });
}

export async function getRevenueChart() {
  await requireAdmin();

  const result = await db
    .select({
      date: sql<string>`TO_CHAR(${orders.orderDate}, 'YYYY-MM-DD')`,
      revenue: sum(orders.totalAmount),
      count: count(),
    })
    .from(orders)
    .where(
      and(
        eq(orders.paymentStatus, "Completed"),
        gte(orders.orderDate, sql`NOW() - INTERVAL '30 days'`)
      )
    )
    .groupBy(sql`TO_CHAR(${orders.orderDate}, 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${orders.orderDate}, 'YYYY-MM-DD')`);

  return result.map((r) => ({
    date: r.date,
    revenue: Number(r.revenue ?? 0),
    orders: r.count,
  }));
}
