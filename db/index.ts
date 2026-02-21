import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// ─────────────────────────────────────────────────────────────────
// Database client singleton (lazy — only connects on first use)
// Uses the Transaction Pooler URL at runtime (connection pooling)
// Uses the Direct URL only for drizzle-kit migrations (drizzle.config.ts)
// ─────────────────────────────────────────────────────────────────

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb() {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Add it to .env.local — see .env.example for the format."
    );
  }

  // postgres-js client
  // prepare: false is required for the transaction pooler (pgBouncer/Supavisor)
  const client = postgres(connectionString, { prepare: false });

  // Drizzle ORM instance with full schema (enables relational queries)
  _db = drizzle(client, { schema });
  return _db;
}

// Proxy that lazily initializes the DB on first property access
// This prevents the connection from being created at build/import time
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    const realDb = getDb();
    const value = Reflect.get(realDb, prop, receiver);
    return typeof value === "function" ? value.bind(realDb) : value;
  },
});

export type DB = typeof db;
