/**
 * Run Geospatial Monitoring Migration
 * 
 * Creates tables for satellite monitoring:
 * - land_parcels
 * - satellite_observations
 * - geospatial_alerts
 * - regional_pest_outbreaks
 * - alert_delivery_log
 */

import { getPool } from "./client";
import { readFileSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";

dotenv.config();

async function runMigration() {
  console.log("🛰️ Running geospatial monitoring migration...");

  const pool = getPool();

  try {
    // Read the SQL migration file
    const migrationPath = join(__dirname, "migrations", "005_geospatial_monitoring.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    // Execute the migration
    await pool.query(migrationSQL);

    console.log("✅ Geospatial monitoring migration completed successfully!");
    console.log("\nCreated tables:");
    console.log("  • land_parcels");
    console.log("  • satellite_observations");
    console.log("  • geospatial_alerts");
    console.log("  • regional_pest_outbreaks");
    console.log("  • alert_delivery_log");
    console.log("\nYou can now:");
    console.log("  1. Register land parcels: POST /agent/land-parcel");
    console.log("  2. Start monitoring: POST /agent/run-monitoring");
    console.log("  3. Get alerts: GET /agent/geospatial-alerts/:farmer_id");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { runMigration };
