/**
 * Test Geospatial Monitoring Feature
 * 
 * This script tests the complete geospatial monitoring flow:
 * 1. Register a test land parcel
 * 2. Verify parcel was created
 * 3. Check database tables
 */

import dotenv from "dotenv";
dotenv.config();

const API_URL = process.env.API_URL || "http://localhost:4000";

// Test land parcel in Pune, Maharashtra
const testParcel = {
  farmer_id: "test-farmer-uuid-123",
  parcel_name: "Test Field - Pune",
  boundary: {
    type: "Polygon",
    coordinates: [
      [
        [73.8567, 18.5204], // Southwest corner
        [73.8577, 18.5204], // Southeast corner
        [73.8577, 18.5214], // Northeast corner
        [73.8567, 18.5214], // Northwest corner
        [73.8567, 18.5204], // Close the polygon
      ],
    ],
  },
  area_hectares: 2.5,
  current_crop: "onion",
  planting_date: "2026-02-01",
};

async function testGeospatialFeature() {
  console.log("🧪 Testing Geospatial Monitoring Feature\n");

  try {
    // Test 1: Register land parcel
    console.log("1️⃣ Registering test land parcel...");
    const registerResponse = await fetch(`${API_URL}/agent/land-parcel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testParcel),
    });

    if (!registerResponse.ok) {
      throw new Error(`Registration failed: ${registerResponse.statusText}`);
    }

    const registerData = await registerResponse.json();
    console.log("✅ Land parcel registered successfully!");
    console.log(`   Parcel ID: ${registerData.parcel.id}`);
    console.log(`   Area: ${registerData.parcel.area_hectares} hectares`);
    console.log(`   Monitoring: ${registerData.parcel.monitoring_enabled ? "Enabled" : "Disabled"}\n`);

    const parcelId = registerData.parcel.id;
    const farmerId = registerData.parcel.farmer_id;

    // Test 2: Get farmer's parcels
    console.log("2️⃣ Retrieving farmer's land parcels...");
    const parcelsResponse = await fetch(`${API_URL}/agent/land-parcels/${farmerId}`);

    if (!parcelsResponse.ok) {
      throw new Error(`Get parcels failed: ${parcelsResponse.statusText}`);
    }

    const parcelsData = await parcelsResponse.json();
    console.log(`✅ Found ${parcelsData.parcels.length} parcel(s) for farmer`);
    parcelsData.parcels.forEach((p: any, idx: number) => {
      console.log(`   ${idx + 1}. ${p.parcel_name || "Unnamed"} - ${p.area_hectares} ha`);
    });
    console.log();

    // Test 3: Check for alerts (should be empty initially)
    console.log("3️⃣ Checking for geospatial alerts...");
    const alertsResponse = await fetch(`${API_URL}/agent/geospatial-alerts/${farmerId}?language=mr`);

    if (!alertsResponse.ok) {
      throw new Error(`Get alerts failed: ${alertsResponse.statusText}`);
    }

    const alertsData = await alertsResponse.json();
    console.log(`✅ Found ${alertsData.count} pending alert(s)`);
    if (alertsData.count > 0) {
      alertsData.alerts.forEach((alert: any, idx: number) => {
        console.log(`   ${idx + 1}. ${alert.alert_type} (${alert.severity})`);
        console.log(`      ${alert.title}`);
      });
    } else {
      console.log("   (No alerts yet - monitoring job needs to run)");
    }
    console.log();

    // Test 4: Information about monitoring
    console.log("4️⃣ Next Steps:");
    console.log("   To start monitoring, run:");
    console.log("   • Manual: curl -X POST http://localhost:4000/agent/run-monitoring");
    console.log("   • Or enable automatic monitoring in .env:");
    console.log("     GEOSPATIAL_MONITORING_ENABLED=true");
    console.log();

    console.log("📊 Test Summary:");
    console.log("   ✅ Land parcel registration: Working");
    console.log("   ✅ Parcel retrieval: Working");
    console.log("   ✅ Alert system: Working");
    console.log("   ⏳ Satellite monitoring: Ready (needs to be triggered)");
    console.log();

    console.log("🎉 All tests passed! Geospatial monitoring is ready to use.");
    console.log();
    console.log("📍 Test Parcel Location:");
    console.log(`   Coordinates: ${testParcel.boundary.coordinates[0][0]}`);
    console.log("   Area: Pune, Maharashtra");
    console.log("   View on map: https://www.google.com/maps?q=18.5204,73.8567");
    console.log();

  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error();
    console.error("Troubleshooting:");
    console.error("  1. Make sure backend is running: npm run dev");
    console.error("  2. Check DATABASE_URL in .env");
    console.error("  3. Verify migration ran: npm run migrate:geospatial");
    process.exit(1);
  }
}

// Run tests
testGeospatialFeature();
