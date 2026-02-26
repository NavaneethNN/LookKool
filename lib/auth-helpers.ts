import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Get the current session (cached per request).
 * Returns null if not authenticated.
 */
export const getSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
});

/**
 * Require authentication — throws if not signed in.
 * Returns { userId, email }.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  return { userId: session.user.id, email: session.user.email };
}

/**
 * Require authentication — redirects to /sign-in if not authenticated.
 * Returns the full session.
 */
export async function requireAuthOrRedirect() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/sign-in");
  }
  return session;
}
