"use server";

import { db } from "@/db";
import {
  notifications,
  notificationPreferences,
  users,
} from "@/db/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

// ─── Helpers ──────────────────────────────────────────────────

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─── Read notifications (customer-facing) ──────────────────────

export async function getMyNotifications(params?: {
  page?: number;
  limit?: number;
}) {
  const userId = await getAuthUserId();
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const offset = (page - 1) * limit;

  const [items, [total]] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(notifications)
      .where(eq(notifications.userId, userId)),
  ]);

  return {
    notifications: items,
    total: total?.count ?? 0,
    page,
    totalPages: Math.ceil((total?.count ?? 0) / limit),
  };
}

export async function getUnreadNotificationCount() {
  const userId = await getAuthUserId();

  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );

  return result?.count ?? 0;
}

// ─── Mark as read ──────────────────────────────────────────────

export async function markNotificationRead(notificationId: number) {
  const userId = await getAuthUserId();

  await db
    .update(notifications)
    .set({ isRead: true, updatedAt: new Date() })
    .where(
      and(
        eq(notifications.notificationId, notificationId),
        eq(notifications.userId, userId)
      )
    );

  return { success: true };
}

export async function markAllNotificationsRead() {
  const userId = await getAuthUserId();

  await db
    .update(notifications)
    .set({ isRead: true, updatedAt: new Date() })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );

  return { success: true };
}

// ─── Notification preferences ──────────────────────────────────

export async function getNotificationPreferences() {
  const userId = await getAuthUserId();

  const [pref] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (pref) return pref;

  // Create default preferences if not exists
  const [created] = await db
    .insert(notificationPreferences)
    .values({ userId })
    .onConflictDoNothing()
    .returning();

  return (
    created ?? {
      orderNotifications: true,
      offerNotifications: true,
      systemNotifications: true,
    }
  );
}

export async function updateNotificationPreferences(prefs: {
  orderNotifications?: boolean;
  offerNotifications?: boolean;
  systemNotifications?: boolean;
}) {
  const userId = await getAuthUserId();

  // Upsert preferences
  await db
    .insert(notificationPreferences)
    .values({
      userId,
      orderNotifications: prefs.orderNotifications ?? true,
      offerNotifications: prefs.offerNotifications ?? true,
      systemNotifications: prefs.systemNotifications ?? true,
    })
    .onConflictDoUpdate({
      target: notificationPreferences.userId,
      set: {
        ...(prefs.orderNotifications !== undefined && {
          orderNotifications: prefs.orderNotifications,
        }),
        ...(prefs.offerNotifications !== undefined && {
          offerNotifications: prefs.offerNotifications,
        }),
        ...(prefs.systemNotifications !== undefined && {
          systemNotifications: prefs.systemNotifications,
        }),
        updatedAt: new Date(),
      },
    });

  return { success: true };
}

// ─── Create notifications (internal, called by other actions) ──

/**
 * Creates a notification for a specific user.
 * This is called internally by server actions (order status updates, etc.)
 * NOT exported as a user-facing action.
 */
export async function createNotification(data: {
  userId: string;
  type: "order" | "offer" | "system";
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  // Check user preferences before creating
  const [pref] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, data.userId))
    .limit(1);

  if (pref) {
    if (data.type === "order" && !pref.orderNotifications) return;
    if (data.type === "offer" && !pref.offerNotifications) return;
    if (data.type === "system" && !pref.systemNotifications) return;
  }

  await db.insert(notifications).values({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    data: data.data ?? null,
  });
}

/**
 * Create notifications for all admin users (e.g. new order placed).
 */
export async function notifyAdmins(data: {
  type: "order" | "offer" | "system";
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  const admins = await db
    .select({ userId: users.userId })
    .from(users)
    .where(
      sql`${users.role} IN ('admin', 'cashier')`
    );

  if (admins.length === 0) return;

  await db.insert(notifications).values(
    admins.map((admin) => ({
      userId: admin.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data ?? null,
    }))
  );
}

// ─── Delete old notifications (cleanup) ────────────────────────

export async function deleteOldNotifications() {
  const userId = await getAuthUserId();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, true),
        sql`${notifications.createdAt} < ${thirtyDaysAgo}`
      )
    );

  return { success: true };
}
