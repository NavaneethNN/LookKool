/**
 * types/supabase.ts
 *
 * This file is a placeholder. Replace it with the auto-generated types
 * from the Supabase CLI by running:
 *
 *   bunx supabase gen types typescript --project-id <your-project-ref> > types/supabase.ts
 *
 * Or, after linking your project:
 *   bunx supabase gen types typescript --linked > types/supabase.ts
 *
 * Until then, the `Database` type is set to `unknown` to avoid TS errors.
 */

export type Database = {
  public: {
    Tables: Record<string, unknown>;
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
};
