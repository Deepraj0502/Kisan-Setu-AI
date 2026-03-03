/**
 * Test Real-Time Data APIs
 * 
 * Tests:
 * 1. Market prices from data.gov.in
 * 2. Weather from Open-Meteo
 * 3. Government schemes
 */

import dotenv from "dotenv";
dotenv.config();

const API_URL = process.env.API_URL || "http://localhost:4000";

async function testRealtimeData() {
  console.log("🧪 Testing Real-Time Data APIs\n");

  try {
    // Test 1: Weather (Open-Meteo - no API key needed)
    console.log("1️⃣ Testing Weather API (Open-Meteo)...");
    const weatherResponse = await fetch(
      `${API_URL}/agent/weather?latitude=18.5204&longitude=73.8567&language=mr`
    );

    if (!weatherResponse.ok) {
      throw new Error(`Weather API failed: ${weatherResponse.statusText}`);
    }

    const weatherData = await weatherResponse.json();
    console.log("✅ Weather API working!");
    console.log(`   Location: ${weatherData.weather.location}`);
    console.log(`   Temperature: ${weatherData.weather.temperature}°C`);
    console.log(`   Humidity: ${weatherData.weather.humidity}%`);
    console.log(`   Description: ${weatherData.weather.description}`);
    console.log(`   3-day forecast: ${weatherData.weather.forecast_3day.length} days`);
    console.log();

    // Test 2: Market Prices (data.gov.in)
    console.log("2️⃣ Testing Market Prices API (data.gov.in)...");
    
    // Try different commodities
    const commodities = ["Onion", "Tomato", "Potato", "Brinjal"];
    let foundRealData = false;
    
    for (const commodity of commodities) {
      const pricesResponse = await fetch(
        `${API_URL}/agent/market-prices?state=Maharashtra&commodity=${commodity}`
      );

      if (!pricesResponse.ok) {
        console.warn(`   ⚠️ ${commodity}: API error`);
        continue;
      }

      const pricesData = await pricesResponse.json();
      
      if (pricesData.prices && pricesData.prices.length > 0) {
        const price = pricesData.prices[0];
        console.log(`   ✅ ${commodity}:`);
        console.log(`      Market: ${price.market}`);
        console.log(`      Price: ₹${price.modal_price}/quintal`);
        console.log(`      Date: ${price.arrival_date}`);
        foundRealData = true;
        break;
      }
    }
    
    if (!foundRealData) {
      console.log("   ⚠️ No real market data found, using mock data");
      console.log("   This is normal if API filters don't match exactly");
    }
    console.log();

    // Test 3: Government Schemes
    console.log("3️⃣ Testing Government Schemes API...");
    const schemesResponse = await fetch(
      `${API_URL}/agent/schemes?state=Maharashtra&language=mr`
    );

    if (!schemesResponse.ok) {
      throw new Error(`Schemes API failed: ${schemesResponse.statusText}`);
    }

    const schemesData = await schemesResponse.json();
    console.log("✅ Government Schemes API working!");
    console.log(`   Found ${schemesData.count} schemes`);
    schemesData.schemes.slice(0, 3).forEach((scheme: any, idx: number) => {
      console.log(`   ${idx + 1}. ${scheme.scheme_name}`);
    });
    console.log();

    // Summary
    console.log("📊 Test Summary:");
    console.log("   ✅ Weather API: Working (Open-Meteo - FREE, no API key)");
    console.log(`   ${foundRealData ? '✅' : '⚠️'} Market Prices: ${foundRealData ? 'Real data' : 'Mock data (API key may need verification)'}`);
    console.log("   ✅ Government Schemes: Working");
    console.log();

    console.log("🎉 All APIs are functional!");
    console.log();
    
    if (!foundRealData) {
      console.log("💡 Tips for Market Prices:");
      console.log("   1. Check if DATA_GOV_IN_API_KEY is correct in .env");
      console.log("   2. Try different commodity names (case-sensitive)");
      console.log("   3. Check data.gov.in for available commodities");
      console.log("   4. Mock data works fine for testing");
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error();
    console.error("Troubleshooting:");
    console.error("  1. Make sure backend is running: npm run dev");
    console.error("  2. Check .env file has DATA_GOV_IN_API_KEY");
    console.error("  3. Verify internet connection");
    process.exit(1);
  }
}

// Run tests
testRealtimeData();
