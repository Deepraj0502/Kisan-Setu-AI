/**
 * Migration Runner
 * Executes SQL migration files in order
 */

import { readFileSync } from "fs";
import { join } from "path";
import { getPool } from "../client";

const MIGRATIONS_DIR = join(__dirname);

async function runMigrations() {
  const pool = getPool();
  
  console.log("🚀 Starting RAG schema migrations...\n");
  
  try {
    // Migration 1: Core RAG schema
    console.log("📋 Running migration 001_rag_schema.sql...");
    const schemaSQL = readFileSync(
      join(MIGRATIONS_DIR, "001_rag_schema.sql"),
      "utf-8"
    );
    await pool.query(schemaSQL);
    console.log("✅ Schema migration completed\n");
    
    // Migration 2: Sample seed data (optional, can skip if needed)
    console.log("🌱 Running migration 002_seed_sample_data.sql...");
    const seedSQL = readFileSync(
      join(MIGRATIONS_DIR, "002_seed_sample_data.sql"),
      "utf-8"
    );
    await pool.query(seedSQL);
    console.log("✅ Seed data migration completed\n");
    
    console.log("🎉 All migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { runMigrations };
