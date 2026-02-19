import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/**
 * createClient
 * Server-side Supabase client for:
 *  - Server Components
 *  - Server Actions
 *  - Route Handlers
 *
 * Reads the session from the HTTP cookie jar.
 * IMPORTANT: Each call creates a new client; do NOT share across requests.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from a Server Component — cookies are read-only.
            // Middleware handles refreshing the session token.
          }
        },
      },
    }
  );
}
