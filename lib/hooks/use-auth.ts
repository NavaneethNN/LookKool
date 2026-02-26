"use client";

import { authClient } from "@/lib/auth-client";

interface AuthUser {
  id: string;
  email?: string;
}

/**
 * Client-side auth hook.
 * Uses Better Auth's useSession() hook.
 * Returns same { user, loading } interface as the old Supabase hook.
 */
export function useAuth() {
  const { data: session, isPending } = authClient.useSession();

  const user: AuthUser | null = session?.user
    ? { id: session.user.id, email: session.user.email ?? undefined }
    : null;

  return { user, loading: isPending };
}
