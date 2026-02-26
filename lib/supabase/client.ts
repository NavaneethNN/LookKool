"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client — used ONLY for Realtime subscriptions.
 * Auth is now handled by Better Auth. This client is kept for
 * use-order-notifications.ts (Realtime channel).
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
