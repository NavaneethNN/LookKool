import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// ─────────────────────────────────────────────────────────────────
// Database client singleton
// Uses the Transaction Pooler URL at runtime (connection pooling)
// Uses the Direct URL only for drizzle-kit migrations (drizzle.config.ts)
// ─────────────────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL environment variable is not set. " +
      "Add it to .env.local — see .env.example for the format."
  );
}

// postgres-js client
// max: 1 is required for the transaction pooler (pgBouncer)
const client = postgres(connectionString, { prepare: false });

// Drizzle ORM instance with full schema (enables relational queries)
export const db = drizzle(client, { schema });

export type DB = typeof db;
