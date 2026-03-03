/**
 * Test Chatbot Real-Time Data Integration
 * 
 * Tests that weather, market prices, and schemes are automatically
 * included in chatbot responses when relevant queries are detected.
 */

import "dotenv/config";

const API_URL = process.env.API_URL || "http://localhost:4000";

// Test phone number with profile
const TEST_PHONE = "+919876543210";

interface TestCase {
  name: string;
  question: string;
  language: "mr" | "hi" | "en";
  expectedKeywords: string[];
}

const testCases: TestCase[] = [
  // Weather queries
  {
    name: "Weather Query (Marathi)",
    question: "आज हवामान कसे आहे?",
    language: "mr",
    expectedKeywords: ["तापमान", "आर्द्रता", "हवामान"]
  },
  {
    name: "Weather Query (Hindi)",
    question: "आज मौसम कैसा है?",
    language: "hi",
    expectedKeywords: ["तापमान", "मौसम"]
  },
  {
    name: "Weather Query (English)",
    question: "What's the weather today?",
    language: "en",
    expectedKeywords: ["temperature", "weather"]
  },
  
  // Market price queries
  {
    name: "Market Price Query (Marathi)",
    question: "कांद्याचा भाव किती आहे?",
    language: "mr",
    expectedKeywords: ["भाव", "मंडी", "बाजार"]
  },
  {
    name: "Market Price Query (Hindi)",
    question: "प्याज का दाम क्या है?",
    language: "hi",
    expectedKeywords: ["दाम", "मंडी"]
  },
  {
    name: "Market Price Query (English)",
    question: "What's the onion price?",
    language: "en",
    expectedKeywords: ["price", "market"]
  },
  
  // Scheme queries
  {
    name: "Scheme Query (Marathi)",
    question: "शेतकऱ्यांसाठी काय योजना आहेत?",
    language: "mr",
    expectedKeywords: ["योजना", "सरकार"]
  },
  {
    name: "Scheme Query (Hindi)",
    question: "किसानों के लिए क्या योजनाएं हैं?",
    language: "hi",
    expectedKeywords: ["योजना", "सरकार"]
  },
  {
    name: "Scheme Query (English)",
    question: "What schemes are available for farmers?",
    language: "en",
    expectedKeywords: ["scheme", "government"]
  },
  
  // General query (should not fetch real-time data)
  {
    name: "General Query (Marathi)",
    question: "टोमॅटोचे रोग कसे ओळखावे?",
    language: "mr",
    expectedKeywords: ["टोमॅटो", "रोग"]
  }
];

async function testChatbotIntegration() {
  console.log("🧪 Testing Chatbot Real-Time Data Integration\n");
  console.log("=" .repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`   Question: ${testCase.question}`);
    console.log(`   Language: ${testCase.language}`);
    
    try {
      const response = await fetch(`${API_URL}/agent/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: testCase.question,
          language: testCase.language,
          phone_number: TEST_PHONE
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log(`   ✅ Response received`);
      console.log(`   Engine: ${data.metadata?.engine || "unknown"}`);
      console.log(`   Has Real-Time Data: ${data.metadata?.has_realtime_data ? "Yes" : "No"}`);
      
      // Check if answer contains expected keywords
      const answerLower = data.answer.toLowerCase();
      const foundKeywords = testCase.expectedKeywords.filter(keyword => 
        answerLower.includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length > 0) {
        console.log(`   ✅ Found keywords: ${foundKeywords.join(", ")}`);
        passed++;
      } else {
        console.log(`   ⚠️  No expected keywords found`);
        console.log(`   Expected: ${testCase.expectedKeywords.join(", ")}`);
        failed++;
      }
      
      // Show first 200 chars of answer
      const preview = data.answer.substring(0, 200);
      console.log(`   Answer preview: ${preview}...`);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      failed++;
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failed}/${testCases.length}`);
  console.log(`   Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log("\n🎉 All tests passed!");
  } else {
    console.log("\n⚠️  Some tests failed. Check the output above for details.");
  }
}

// Run tests
testChatbotIntegration().catch(console.error);
