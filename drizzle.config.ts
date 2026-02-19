import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_DIRECT_URL) {
  throw new Error("DATABASE_DIRECT_URL is required for Drizzle Kit migrations");
}

export default defineConfig({
  // Schema files location
  schema: "./db/schema/index.ts",

  // Generated migrations output directory
  out: "./db/migrations",

  // PostgreSQL dialect (Supabase runs on PostgreSQL)
  dialect: "postgresql",

  dbCredentials: {
    // Always use the DIRECT URL for drizzle-kit (not the pooler)
    url: process.env.DATABASE_DIRECT_URL,
  },

  // Log all SQL statements during migrations
  verbose: true,

  // Strict mode: errors on unsupported features
  strict: true,
});
