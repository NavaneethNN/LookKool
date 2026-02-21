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
    }).catch(() => {
      // Network or cookie error — treat as unauthenticated
      setUser(null);
      setLoading(false);
    });

    // Subscribe to meaningful auth changes only (ignore token refreshes)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return; // silent refresh — no re-render
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
