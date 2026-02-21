"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AuthUser {
  id: string;
  email?: string;
}

/**
 * Client-side auth hook.
 * Checks the current Supabase session and subscribes to auth changes.
 * Used by Navbar and ReviewForm so server components don't need cookies().
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Initial check
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ? { id: u.id, email: u.email ?? undefined } : null);
      setLoading(false);
    });

    // Subscribe to auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(
        session?.user
          ? { id: session.user.id, email: session.user.email ?? undefined }
          : null
      );
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
