"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

/**
 * Checks if the current user is an admin.
 * Redirects to "/" if not authenticated or not an admin.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const [profile] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.userId, user.id))
    .limit(1);

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return { userId: user.id, email: user.email! };
}

/**
 * Same as requireAdmin but returns null instead of redirecting.
 * Useful for conditional rendering in layouts.
 */
export async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profile] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.userId, user.id))
    .limit(1);

  if (!profile || profile.role !== "admin") return null;

  return { userId: user.id, email: user.email! };
}
