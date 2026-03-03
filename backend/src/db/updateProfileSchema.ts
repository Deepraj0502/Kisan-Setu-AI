import { getPool } from "./client";
import * as fs from "fs";
import * as path from "path";

async function updateSchema() {
  console.log("Updating farmer profile schema...");

  const pool = getPool();

  try {
    const migrationPath = path.join(
      __dirname,
      "migrations",
      "004_update_farmer_profiles.sql"
    );

    const sql = fs.readFileSync(migrationPath, "utf-8");

    await pool.query(sql);

    console.log("✅ Schema update completed successfully!");
    
    // Verify columns
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'farmer_profiles'
      ORDER BY ordinal_position
    `);
    
    console.log("\n✅ Current columns:");
    result.rows.forEach((row: any) => console.log(`   - ${row.column_name}`));
    
  } catch (error) {
    console.error("❌ Schema update failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

updateSchema();
