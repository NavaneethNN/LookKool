import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";

/**
 * Checks if the current user is an admin.
 * Redirects to "/" if not authenticated or not an admin.
 * Wrapped with React cache() so multiple calls within the same request are deduped.
 */
export const requireAdmin = cache(async () => {
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

  return { userId: user.id, email: user.email ?? "" };
});

/**
 * Same as requireAdmin but returns null instead of redirecting.
 * Useful for conditional rendering in layouts.
 */
export const checkAdmin = cache(async () => {
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

  return { userId: user.id, email: user.email ?? "" };
});

/**
 * Checks if the current user is an admin or cashier.
 * Redirects to "/" if not authenticated or not authorized.
 * Returns the user's role alongside userId and email.
 * Wrapped with React cache() so multiple calls within the same request are deduped.
 */
export const requireAdminOrCashier = cache(async () => {
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

  if (!profile || (profile.role !== "admin" && profile.role !== "cashier")) {
    redirect("/");
  }

  return { userId: user.id, email: user.email ?? "", role: profile.role as "admin" | "cashier" };
});
