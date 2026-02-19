"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

/**
 * createClient
 * Browser-side Supabase client.
 * Use this in Client Components, hooks, and browser-side event handlers.
 * The client re-uses a shared instance across renders thanks to React's module cache.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
