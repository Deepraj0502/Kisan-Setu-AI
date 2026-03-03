import { getPool } from "./client";
import * as fs from "fs";
import * as path from "path";

async function runMigration() {
  console.log("Running farmer profile migration...");

  const pool = getPool();

  try {
    const migrationPath = path.join(
      __dirname,
      "migrations",
      "003_farmer_profiles.sql"
    );

    const sql = fs.readFileSync(migrationPath, "utf-8");

    await pool.query(sql);

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
