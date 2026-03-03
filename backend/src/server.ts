import express from "express";
import cors from "cors";
import { getMockAnswer } from "./services/mockKnowledgeBase";
import {
  checkEligibilityForAllSchemes,
  getMockFarmerProfile,
  type FarmerLandRecord
} from "./services/sarkariMitraService";
import { performRAGQuery } from "./services/rag/ragService";
import { synthesizeSpeech } from "./services/ttsService";
import { analyzeCropDisease } from "./services/cropDiseaseService";
import {
  getFarmerProfile,
  createFarmerProfile,
  updateFarmerProfile,
  saveConversation,
  getConversationHistory,
  getPersonalizedContext,
  getOnboardingQuestion,
  parseOnboardingResponse,
  type FarmerProfile,
} from "./services/farmerProfileService";
import {
  registerLandParcel,
  getFarmerLandParcels,
  getPendingAlerts,
} from "./services/geospatialService";
import { runGeospatialMonitoringJob } from "./services/geospatialMonitoringJob";
import { RealtimeDataService } from "./services/realtimeDataService";
import "dotenv/config";

const app = express();

// Allow Vercel frontend + localhost. Override via CORS_ORIGIN (comma-separated).
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "https://kisan-setu-ai.vercel.app"];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(null, false);
    },
    credentials: false
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/agent/query", async (req, res) => {
  const { question, language, phone_number } = req.body as {
    question?: string;
    language?: "mr" | "hi" | "en";
    phone_number?: string;
  };

  if (!question?.trim()) {
    return res.status(400).json({
      error: "Question is required"
    });
  }

  const lang: "mr" | "hi" | "en" = language || "en";
  const trimmedQuestion = question.trim();

  // Handle user session and onboarding
  if (phone_number) {
    try {
      let profile = await getFarmerProfile(phone_number);

      // New user - start onboarding
      if (!profile) {
        profile = await createFarmerProfile({
          phone_number,
          language: lang,
          onboarding_step: 0,
          onboarding_completed: false,
        });

        // Save user message
        await saveConversation({
          phone_number,
          message_type: "user",
          message_text: trimmedQuestion,
          message_kind: "text",
        });

        // Send first onboarding question
        const onboardingQuestion = getOnboardingQuestion(0, lang);

        await saveConversation({
          phone_number,
          message_type: "agent",
          message_text: onboardingQuestion,
          message_kind: "text",
        });

        return res.json({
          answer: onboardingQuestion,
          metadata: {
            language: lang,
            engine: "onboarding",
            onboarding_step: 0,
            onboarding_completed: false,
          },
        });
      }

      // User in onboarding process
      if (!profile.onboarding_completed && profile.onboarding_step !== undefined && profile.onboarding_step < 6) {
        // Save user response
        await saveConversation({
          phone_number,
          message_type: "user",
          message_text: trimmedQuestion,
          message_kind: "text",
        });

        // Parse response and update profile
        const updates = parseOnboardingResponse(
          profile.onboarding_step,
          trimmedQuestion,
          profile
        );

        await updateFarmerProfile(phone_number, updates);

        // Get next question
        const nextStep = updates.onboarding_step || 0;
        const nextQuestion = getOnboardingQuestion(nextStep, lang);

        await saveConversation({
          phone_number,
          message_type: "agent",
          message_text: nextQuestion,
          message_kind: "text",
        });

        return res.json({
          answer: nextQuestion,
          metadata: {
            language: lang,
            engine: "onboarding",
            onboarding_step: nextStep,
            onboarding_completed: updates.onboarding_completed || false,
          },
        });
      }

      // User onboarding complete - normal query with context
      await saveConversation({
        phone_number,
        message_type: "user",
        message_text: trimmedQuestion,
        message_kind: "text",
      });

      // Get personalized context
      const personalizedContext = await getPersonalizedContext(phone_number);

      // Detect query intent and fetch real-time data if needed
      const realtimeContext = await fetchRealtimeDataForQuery(
        trimmedQuestion,
        profile,
        lang
      );

      // Build context-aware query with real-time data
      let contextualQuestion = personalizedContext
        ? `Context: ${personalizedContext}\n\nQuestion: ${trimmedQuestion}`
        : trimmedQuestion;

      if (realtimeContext) {
        contextualQuestion += `\n\nReal-time data:\n${realtimeContext}`;
      }

      const useRag = process.env.USE_BEDROCK_RAG === "true";

      let answer: string;

      if (useRag) {
        try {
          const ragResult = await performRAGQuery({
            question: contextualQuestion,
            language: lang,
          });

          answer = ragResult.answer;

          await saveConversation({
            phone_number,
            message_type: "agent",
            message_text: answer,
            message_kind: "text",
            metadata: {
              engine: "bedrock-rag",
              context_count: ragResult.retrieved_contexts.length,
              has_realtime_data: !!realtimeContext,
            },
          });

          return res.json({
            answer,
            metadata: {
              language: lang,
              engine: "bedrock-rag",
              context_count: ragResult.retrieved_contexts.length,
              personalized: true,
              has_realtime_data: !!realtimeContext,
            },
          });
        } catch (error) {
          console.error("RAG query failed, falling back to mock KB:", error);
          answer = getMockAnswer(trimmedQuestion, lang);
        }
      } else {
        answer = getMockAnswer(trimmedQuestion, lang);
      }

      await saveConversation({
        phone_number,
        message_type: "agent",
        message_text: answer,
        message_kind: "text",
      });

      return res.json({
        answer,
        metadata: {
          language: lang,
          engine: useRag ? "mock-fallback" : "mock-knowledge-base",
          personalized: true,
          has_realtime_data: !!realtimeContext,
        },
      });
    } catch (error) {
      console.error("Session management error:", error);
      // Fall through to non-session query
    }
  }

  // No phone number - regular query without session
  const useRag = process.env.USE_BEDROCK_RAG === "true";

  if (useRag) {
    try {
      const ragResult = await performRAGQuery({
        question: trimmedQuestion,
        language: lang
      });

      return res.json({
        answer: ragResult.answer,
        metadata: {
          ...(ragResult.metadata || {}),
          engine: "bedrock-rag",
          language: lang,
          context_count: ragResult.retrieved_contexts.length
        }
      });
    } catch (error) {
      console.error("RAG query failed, falling back to mock KB:", error);
      // Fall through to mock KB below
    }
  }

  const answer = getMockAnswer(trimmedQuestion, lang);

  return res.json({
    answer,
    metadata: {
      language: lang,
      engine: useRag ? "mock-fallback" : "mock-knowledge-base"
    }
  });
});

// Sarkari-Mitra: Eligibility checking endpoint
app.post("/agent/sarkari-mitra", async (req, res) => {
  const { phone_number, farmer_profile, language } = req.body as {
    phone_number?: string;
    farmer_profile?: FarmerLandRecord;
    language?: "mr" | "hi" | "en";
  };

  const lang: "mr" | "hi" | "en" = language || "en";

  // Get farmer profile - either from request or mock data
  let farmer: FarmerLandRecord;
  
  if (farmer_profile) {
    farmer = farmer_profile;
  } else if (phone_number) {
    const mockFarmer = getMockFarmerProfile(phone_number);
    if (!mockFarmer) {
      return res.status(404).json({
        error: "Farmer profile not found. Please provide farmer_profile in request body."
      });
    }
    farmer = mockFarmer;
  } else {
    return res.status(400).json({
      error: "Either phone_number or farmer_profile is required"
    });
  }

  // Check eligibility for all schemes
  const result = checkEligibilityForAllSchemes(farmer, lang);

  res.json({
    ...result,
    metadata: {
      language: lang,
      checked_at: new Date().toISOString(),
      total_schemes_checked: result.eligible_schemes.length
    }
  });
});

// Text-to-Speech endpoint using AWS Polly
app.post("/agent/tts", async (req, res) => {
  const { text, language } = req.body as {
    text?: string;
    language?: "mr" | "hi" | "en";
  };

  if (!text?.trim()) {
    return res.status(400).json({
      error: "Text is required"
    });
  }

  const lang: "mr" | "hi" | "en" = language || "en";

  try {
    const audioBuffer = await synthesizeSpeech({
      text: text.trim(),
      language: lang
    });

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
    });

    res.send(audioBuffer);
  } catch (error) {
    console.error("TTS error:", error);
    res.status(500).json({
      error: "Failed to synthesize speech"
    });
  }
});

// Crop Disease Detection endpoint using AWS Bedrock Vision
app.post("/agent/crop-disease", async (req, res) => {
  const { image, language, cropType } = req.body as {
    image?: string;
    language?: "mr" | "hi" | "en";
    cropType?: string;
  };

  if (!image) {
    return res.status(400).json({
      error: "Image is required (base64 encoded)"
    });
  }

  const lang: "mr" | "hi" | "en" = language || "en";

  try {
    // Remove data URL prefix if present
    const base64Image = image.replace(/^data:image\/[a-z]+;base64,/, "");

    const result = await analyzeCropDisease({
      imageBase64: base64Image,
      language: lang,
      cropType,
    });

    res.json({
      ...result,
      metadata: {
        language: lang,
        analyzed_at: new Date().toISOString(),
        crop_type: cropType || "unknown",
      },
    });
  } catch (error) {
    console.error("Crop disease detection error:", error);
    res.status(500).json({
      error: "Failed to analyze crop disease"
    });
  }
});

// Get farmer profile
app.get("/agent/profile/:phone_number", async (req, res) => {
  const { phone_number } = req.params;

  try {
    const profile = await getFarmerProfile(phone_number);

    if (!profile) {
      return res.status(404).json({
        error: "Profile not found"
      });
    }

    res.json(profile);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: "Failed to get profile"
    });
  }
});

// Update farmer profile
app.put("/agent/profile/:phone_number", async (req, res) => {
  const { phone_number } = req.params;
  const updates = req.body;

  try {
    const profile = await updateFarmerProfile(phone_number, updates);
    res.json(profile);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      error: "Failed to update profile"
    });
  }
});

// Get conversation history
app.get("/agent/history/:phone_number", async (req, res) => {
  const { phone_number } = req.params;
  const limit = parseInt(req.query.limit as string) || 20;

  try {
    const history = await getConversationHistory(phone_number, limit);
    res.json({ history });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({
      error: "Failed to get conversation history"
    });
  }
});

// ============================================
// Geospatial Monitoring Endpoints
// ============================================

// Register land parcel for monitoring
app.post("/agent/land-parcel", async (req, res) => {
  const { farmer_id, parcel_name, boundary, area_hectares, current_crop, planting_date } = req.body;

  if (!farmer_id || !boundary || !area_hectares) {
    return res.status(400).json({
      error: "farmer_id, boundary (GeoJSON polygon), and area_hectares are required"
    });
  }

  try {
    const parcel = await registerLandParcel({
      farmer_id,
      parcel_name,
      boundary,
      area_hectares,
      current_crop,
      planting_date: planting_date ? new Date(planting_date) : undefined,
    });

    res.json({
      parcel,
      message: "Land parcel registered for satellite monitoring"
    });
  } catch (error) {
    console.error("Register parcel error:", error);
    res.status(500).json({
      error: "Failed to register land parcel"
    });
  }
});

// Get farmer's land parcels
app.get("/agent/land-parcels/:farmer_id", async (req, res) => {
  const { farmer_id } = req.params;

  try {
    const parcels = await getFarmerLandParcels(farmer_id);
    res.json({ parcels });
  } catch (error) {
    console.error("Get parcels error:", error);
    res.status(500).json({
      error: "Failed to get land parcels"
    });
  }
});

// Get pending geospatial alerts for farmer
app.get("/agent/geospatial-alerts/:farmer_id", async (req, res) => {
  const { farmer_id } = req.params;
  const { language } = req.query as { language?: "mr" | "hi" | "en" };
  const lang: "mr" | "hi" | "en" = language || "en";

  try {
    const alerts = await getPendingAlerts(farmer_id);

    // Format alerts with localized content
    const formattedAlerts = alerts.map((alert) => ({
      id: alert.id,
      alert_type: alert.alert_type,
      severity: alert.severity,
      title: alert[`title_${lang}` as keyof typeof alert] || alert.title_english,
      message: alert[`message_${lang}` as keyof typeof alert] || alert.message_english,
      recommendations: alert[`recommendations_${lang}` as keyof typeof alert] || alert.recommendations_english,
      trigger_data: alert.trigger_data,
      created_at: alert.created_at,
    }));

    res.json({
      alerts: formattedAlerts,
      count: formattedAlerts.length
    });
  } catch (error) {
    console.error("Get alerts error:", error);
    res.status(500).json({
      error: "Failed to get geospatial alerts"
    });
  }
});

// Trigger monitoring job manually (for testing)
app.post("/agent/run-monitoring", async (req, res) => {
  try {
    const result = await runGeospatialMonitoringJob();
    res.json({
      message: "Monitoring job completed",
      result
    });
  } catch (error) {
    console.error("Monitoring job error:", error);
    res.status(500).json({
      error: "Failed to run monitoring job"
    });
  }
});

// ============================================
// Real-Time Data Endpoints
// ============================================

const realtimeDataService = new RealtimeDataService();

// ============================================
// Helper: Detect query intent and fetch real-time data
// ============================================

/**
 * Analyze user query and fetch relevant real-time data
 * Returns formatted context string to include in RAG query
 */
async function fetchRealtimeDataForQuery(
  question: string,
  profile: FarmerProfile | null,
  language: "mr" | "hi" | "en"
): Promise<string | null> {
  const lowerQuestion = question.toLowerCase();
  const contextParts: string[] = [];

  // Weather keywords in multiple languages
  const weatherKeywords = [
    "weather", "temperature", "rain", "forecast", "climate",
    "हवामान", "तापमान", "पाऊस", "अंदाज", "वातावरण",
    "मौसम", "तापमान", "बारिश", "पूर्वानुमान", "जलवायु"
  ];

  // Market price keywords
  const marketKeywords = [
    "price", "rate", "mandi", "market", "sell", "cost",
    "भाव", "किंमत", "मंडी", "बाजार", "विक्री",
    "दाम", "कीमत", "मंडी", "बाजार", "बेचना"
  ];

  // Scheme keywords
  const schemeKeywords = [
    "scheme", "yojana", "subsidy", "government", "benefit",
    "योजना", "सबसिडी", "सरकार", "लाभ",
    "योजना", "सब्सिडी", "सरकार", "लाभ"
  ];

  // Check for weather query
  const isWeatherQuery = weatherKeywords.some(keyword => 
    lowerQuestion.includes(keyword.toLowerCase())
  );

  // Check for market price query
  const isMarketQuery = marketKeywords.some(keyword => 
    lowerQuestion.includes(keyword.toLowerCase())
  );

  // Check for scheme query
  const isSchemeQuery = schemeKeywords.some(keyword => 
    lowerQuestion.includes(keyword.toLowerCase())
  );

  try {
    // Fetch weather data if relevant
    if (isWeatherQuery && profile?.district) {
      // Get approximate coordinates for district (you can enhance this with a geocoding service)
      const coordinates = getDistrictCoordinates(profile.district.toLowerCase());
      // console.log("cord",coordinates);
      
      if (coordinates) {
        const weather = await realtimeDataService.getWeather(
          coordinates.latitude,
          coordinates.longitude
        );

        const weatherText = formatWeatherContext(weather, language);
        contextParts.push(weatherText);
      }
    }

    // Fetch market prices if relevant
    if (isMarketQuery && profile?.state && profile?.primary_crops) {
      // Get prices for farmer's primary crops
      const crop = profile.primary_crops[0]; // Use first crop
      if (crop) {
        const prices = await realtimeDataService.getMarketPrices(
          profile.state,
          crop,
          profile.district
        );

        if (prices.length > 0) {
          const priceText = formatMarketPriceContext(prices, language);
          contextParts.push(priceText);
        }
      }
    }

    // Fetch schemes if relevant
    if (isSchemeQuery && profile?.state) {
      const schemes = await realtimeDataService.getGovernmentSchemes(
        profile.state,
        "agriculture"
      );

      if (schemes.length > 0) {
        const schemeText = formatSchemeContext(schemes.slice(0, 3), language);
        contextParts.push(schemeText);
      }
    }

    return contextParts.length > 0 ? contextParts.join("\n\n") : null;
  } catch (error) {
    console.error("Error fetching real-time data:", error);
    return null;
  }
}

/**
 * Get approximate coordinates for Indian districts
 * Covers all major districts across India
 */
function getDistrictCoordinates(district: string): { latitude: number; longitude: number } | null {
  const districtCoords: Record<string, { latitude: number; longitude: number }> = {
    // Andhra Pradesh
    "visakhapatnam": { latitude: 17.6869, longitude: 83.2185 },
    "vijayawada": { latitude: 16.5062, longitude: 80.6480 },
    "guntur": { latitude: 16.3067, longitude: 80.4365 },
    "nellore": { latitude: 14.4426, longitude: 79.9865 },
    "kurnool": { latitude: 15.8281, longitude: 78.0373 },
    "kakinada": { latitude: 16.9891, longitude: 82.2475 },
    "rajahmundry": { latitude: 17.0005, longitude: 81.8040 },
    "tirupati": { latitude: 13.6288, longitude: 79.4192 },
    "anantapur": { latitude: 14.6819, longitude: 77.6006 },
    "kadapa": { latitude: 14.4674, longitude: 78.8241 },
    
    // Arunachal Pradesh
    "itanagar": { latitude: 27.0844, longitude: 93.6053 },
    "tawang": { latitude: 27.5860, longitude: 91.8590 },
    "pasighat": { latitude: 28.0660, longitude: 95.3260 },
    
    // Assam
    "guwahati": { latitude: 26.1445, longitude: 91.7362 },
    "silchar": { latitude: 24.8333, longitude: 92.7789 },
    "dibrugarh": { latitude: 27.4728, longitude: 94.9120 },
    "jorhat": { latitude: 26.7509, longitude: 94.2037 },
    "nagaon": { latitude: 26.3484, longitude: 92.6856 },
    "tinsukia": { latitude: 27.4900, longitude: 95.3600 },
    
    // Bihar
    "patna": { latitude: 25.5941, longitude: 85.1376 },
    "gaya": { latitude: 24.7955, longitude: 84.9994 },
    "bhagalpur": { latitude: 25.2425, longitude: 86.9842 },
    "muzaffarpur": { latitude: 26.1225, longitude: 85.3906 },
    "darbhanga": { latitude: 26.1542, longitude: 85.8918 },
    "purnia": { latitude: 25.7771, longitude: 87.4753 },
    "arrah": { latitude: 25.5562, longitude: 84.6644 },
    "begusarai": { latitude: 25.4182, longitude: 86.1336 },
    "katihar": { latitude: 25.5394, longitude: 87.5678 },
    
    // Chhattisgarh
    "raipur": { latitude: 21.2514, longitude: 81.6296 },
    "bhilai": { latitude: 21.2095, longitude: 81.3784 },
    "bilaspur": { latitude: 22.0797, longitude: 82.1409 },
    "korba": { latitude: 22.3595, longitude: 82.7501 },
    "durg": { latitude: 21.1905, longitude: 81.2849 },
    "rajnandgaon": { latitude: 21.0974, longitude: 81.0379 },
    
    // Goa
    "panaji": { latitude: 15.4909, longitude: 73.8278 },
    "margao": { latitude: 15.2832, longitude: 73.9667 },
    "vasco": { latitude: 15.3989, longitude: 73.8154 },
    
    // Gujarat
    "ahmedabad": { latitude: 23.0225, longitude: 72.5714 },
    "surat": { latitude: 21.1702, longitude: 72.8311 },
    "vadodara": { latitude: 22.3072, longitude: 73.1812 },
    "rajkot": { latitude: 22.3039, longitude: 70.8022 },
    "bhavnagar": { latitude: 21.7645, longitude: 72.1519 },
    "jamnagar": { latitude: 22.4707, longitude: 70.0577 },
    "junagadh": { latitude: 21.5222, longitude: 70.4579 },
    "gandhinagar": { latitude: 23.2156, longitude: 72.6369 },
    "anand": { latitude: 22.5645, longitude: 72.9289 },
    "mehsana": { latitude: 23.5880, longitude: 72.3693 },
    
    // Haryana
    "faridabad": { latitude: 28.4089, longitude: 77.3178 },
    "gurgaon": { latitude: 28.4595, longitude: 77.0266 },
    "gurugram": { latitude: 28.4595, longitude: 77.0266 },
    "rohtak": { latitude: 28.8955, longitude: 76.6066 },
    "hisar": { latitude: 29.1492, longitude: 75.7217 },
    "panipat": { latitude: 29.3909, longitude: 76.9635 },
    "karnal": { latitude: 29.6857, longitude: 76.9905 },
    "sonipat": { latitude: 28.9931, longitude: 77.0151 },
    "ambala": { latitude: 30.3782, longitude: 76.7767 },
    
    // Himachal Pradesh
    "shimla": { latitude: 31.1048, longitude: 77.1734 },
    "dharamshala": { latitude: 32.2190, longitude: 76.3234 },
    "kullu": { latitude: 31.9578, longitude: 77.1093 },
    "manali": { latitude: 32.2396, longitude: 77.1887 },
    "solan": { latitude: 30.9045, longitude: 77.0967 },
    "mandi": { latitude: 31.7084, longitude: 76.9318 },
    
    // Jharkhand
    "ranchi": { latitude: 23.3441, longitude: 85.3096 },
    "jamshedpur": { latitude: 22.8046, longitude: 86.2029 },
    "dhanbad": { latitude: 23.7957, longitude: 86.4304 },
    "bokaro": { latitude: 23.6693, longitude: 86.1511 },
    "deoghar": { latitude: 24.4854, longitude: 86.6947 },
    "hazaribagh": { latitude: 23.9929, longitude: 85.3615 },
    
    // Karnataka
    "bangalore": { latitude: 12.9716, longitude: 77.5946 },
    "bengaluru": { latitude: 12.9716, longitude: 77.5946 },
    "mysore": { latitude: 12.2958, longitude: 76.6394 },
    "mysuru": { latitude: 12.2958, longitude: 76.6394 },
    "hubli": { latitude: 15.3647, longitude: 75.1240 },
    "mangalore": { latitude: 12.9141, longitude: 74.8560 },
    "belgaum": { latitude: 15.8497, longitude: 74.4977 },
    "gulbarga": { latitude: 17.3297, longitude: 76.8343 },
    "davanagere": { latitude: 14.4644, longitude: 75.9218 },
    "bellary": { latitude: 15.1394, longitude: 76.9214 },
    
    // Kerala
    "thiruvananthapuram": { latitude: 8.5241, longitude: 76.9366 },
    "kochi": { latitude: 9.9312, longitude: 76.2673 },
    "kozhikode": { latitude: 11.2588, longitude: 75.7804 },
    "thrissur": { latitude: 10.5276, longitude: 76.2144 },
    "kollam": { latitude: 8.8932, longitude: 76.6141 },
    "palakkad": { latitude: 10.7867, longitude: 76.6548 },
    "alappuzha": { latitude: 9.4981, longitude: 76.3388 },
    "kannur": { latitude: 11.8745, longitude: 75.3704 },
    
    // Madhya Pradesh
    "indore": { latitude: 22.7196, longitude: 75.8577 },
    "bhopal": { latitude: 23.2599, longitude: 77.4126 },
    "jabalpur": { latitude: 23.1815, longitude: 79.9864 },
    "gwalior": { latitude: 26.2183, longitude: 78.1828 },
    "ujjain": { latitude: 23.1765, longitude: 75.7885 },
    "sagar": { latitude: 23.8388, longitude: 78.7378 },
    "dewas": { latitude: 22.9676, longitude: 76.0534 },
    "satna": { latitude: 24.6005, longitude: 80.8322 },
    "ratlam": { latitude: 23.3315, longitude: 75.0367 },
    
    // Maharashtra
    "mumbai": { latitude: 19.0760, longitude: 72.8777 },
    "pune": { latitude: 18.5204, longitude: 73.8567 },
    "nagpur": { latitude: 21.1458, longitude: 79.0882 },
    "nashik": { latitude: 19.9975, longitude: 73.7898 },
    "aurangabad": { latitude: 19.8762, longitude: 75.3433 },
    "solapur": { latitude: 17.6599, longitude: 75.9064 },
    "thane": { latitude: 19.2183, longitude: 72.9781 },
    "kolhapur": { latitude: 16.7050, longitude: 74.2433 },
    "amravati": { latitude: 20.9374, longitude: 77.7796 },
    "nanded": { latitude: 19.1383, longitude: 77.3210 },
    "akola": { latitude: 20.7002, longitude: 77.0082 },
    "latur": { latitude: 18.3984, longitude: 76.5604 },
    "dhule": { latitude: 20.9042, longitude: 74.7749 },
    "ahmednagar": { latitude: 19.0948, longitude: 74.7480 },
    "chandrapur": { latitude: 19.9615, longitude: 79.2961 },
    "jalgaon": { latitude: 21.0077, longitude: 75.5626 },
    "sangli": { latitude: 16.8524, longitude: 74.5815 },
    "satara": { latitude: 17.6805, longitude: 73.9903 },
    "raigad": { latitude: 18.2376, longitude: 73.4445 },
    
    // Manipur
    "imphal": { latitude: 24.8170, longitude: 93.9368 },
    "thoubal": { latitude: 24.6333, longitude: 94.0167 },
    
    // Meghalaya
    "shillong": { latitude: 25.5788, longitude: 91.8933 },
    "tura": { latitude: 25.5138, longitude: 90.2036 },
    
    // Mizoram
    "aizawl": { latitude: 23.7271, longitude: 92.7176 },
    "lunglei": { latitude: 22.8833, longitude: 92.7333 },
    
    // Nagaland
    "kohima": { latitude: 25.6747, longitude: 94.1086 },
    "dimapur": { latitude: 25.9067, longitude: 93.7267 },
    
    // Odisha
    "bhubaneswar": { latitude: 20.2961, longitude: 85.8245 },
    "cuttack": { latitude: 20.4625, longitude: 85.8830 },
    "rourkela": { latitude: 22.2604, longitude: 84.8536 },
    "berhampur": { latitude: 19.3150, longitude: 84.7941 },
    "sambalpur": { latitude: 21.4669, longitude: 83.9812 },
    "puri": { latitude: 19.8135, longitude: 85.8312 },
    "balasore": { latitude: 21.4934, longitude: 86.9336 },
    
    // Punjab
    "ludhiana": { latitude: 30.9010, longitude: 75.8573 },
    "amritsar": { latitude: 31.6340, longitude: 74.8723 },
    "jalandhar": { latitude: 31.3260, longitude: 75.5762 },
    "patiala": { latitude: 30.3398, longitude: 76.3869 },
    "bathinda": { latitude: 30.2110, longitude: 74.9455 },
    "mohali": { latitude: 30.7046, longitude: 76.7179 },
    "hoshiarpur": { latitude: 31.5332, longitude: 75.9119 },
    "batala": { latitude: 31.8089, longitude: 75.2025 },
    
    // Rajasthan
    "jaipur": { latitude: 26.9124, longitude: 75.7873 },
    "jodhpur": { latitude: 26.2389, longitude: 73.0243 },
    "kota": { latitude: 25.2138, longitude: 75.8648 },
    "bikaner": { latitude: 28.0229, longitude: 73.3119 },
    "udaipur": { latitude: 24.5854, longitude: 73.7125 },
    "ajmer": { latitude: 26.4499, longitude: 74.6399 },
    "bhilwara": { latitude: 25.3467, longitude: 74.6405 },
    "alwar": { latitude: 27.5530, longitude: 76.6346 },
    "bharatpur": { latitude: 27.2152, longitude: 77.4909 },
    "sikar": { latitude: 27.6119, longitude: 75.1397 },
    
    // Sikkim
    "gangtok": { latitude: 27.3389, longitude: 88.6065 },
    "namchi": { latitude: 27.1667, longitude: 88.3667 },
    
    // Tamil Nadu
    "chennai": { latitude: 13.0827, longitude: 80.2707 },
    "coimbatore": { latitude: 11.0168, longitude: 76.9558 },
    "madurai": { latitude: 9.9252, longitude: 78.1198 },
    "tiruchirappalli": { latitude: 10.7905, longitude: 78.7047 },
    "trichy": { latitude: 10.7905, longitude: 78.7047 },
    "salem": { latitude: 11.6643, longitude: 78.1460 },
    "tirunelveli": { latitude: 8.7139, longitude: 77.7567 },
    "tiruppur": { latitude: 11.1085, longitude: 77.3411 },
    "vellore": { latitude: 12.9165, longitude: 79.1325 },
    "erode": { latitude: 11.3410, longitude: 77.7172 },
    "thoothukkudi": { latitude: 8.7642, longitude: 78.1348 },
    "thanjavur": { latitude: 10.7870, longitude: 79.1378 },
    "dindigul": { latitude: 10.3673, longitude: 77.9803 },
    "kanchipuram": { latitude: 12.8342, longitude: 79.7036 },
    
    // Telangana
    "hyderabad": { latitude: 17.3850, longitude: 78.4867 },
    "warangal": { latitude: 17.9689, longitude: 79.5941 },
    "nizamabad": { latitude: 18.6725, longitude: 78.0941 },
    "khammam": { latitude: 17.2473, longitude: 80.1514 },
    "karimnagar": { latitude: 18.4386, longitude: 79.1288 },
    "ramagundam": { latitude: 18.7553, longitude: 79.4747 },
    "mahbubnagar": { latitude: 16.7488, longitude: 77.9882 },
    "nalgonda": { latitude: 17.0501, longitude: 79.2678 },
    
    // Tripura
    "agartala": { latitude: 23.8315, longitude: 91.2868 },
    
    // Uttar Pradesh
    "lucknow": { latitude: 26.8467, longitude: 80.9462 },
    "kanpur": { latitude: 26.4499, longitude: 80.3319 },
    "ghaziabad": { latitude: 28.6692, longitude: 77.4538 },
    "agra": { latitude: 27.1767, longitude: 78.0081 },
    "meerut": { latitude: 28.9845, longitude: 77.7064 },
    "varanasi": { latitude: 25.3176, longitude: 82.9739 },
    "allahabad": { latitude: 25.4358, longitude: 81.8463 },
    "prayagraj": { latitude: 25.4358, longitude: 81.8463 },
    "bareilly": { latitude: 28.3670, longitude: 79.4304 },
    "aligarh": { latitude: 27.8974, longitude: 78.0880 },
    "moradabad": { latitude: 28.8389, longitude: 78.7378 },
    "saharanpur": { latitude: 29.9680, longitude: 77.5460 },
    "gorakhpur": { latitude: 26.7606, longitude: 83.3732 },
    "noida": { latitude: 28.5355, longitude: 77.3910 },
    "firozabad": { latitude: 27.1591, longitude: 78.3957 },
    "jhansi": { latitude: 25.4484, longitude: 78.5685 },
    "muzaffarnagar": { latitude: 29.4727, longitude: 77.7085 },
    "mathura": { latitude: 27.4924, longitude: 77.6737 },
    "rampur": { latitude: 28.8152, longitude: 79.0256 },
    
    // Uttarakhand
    "dehradun": { latitude: 30.3165, longitude: 78.0322 },
    "haridwar": { latitude: 29.9457, longitude: 78.1642 },
    "roorkee": { latitude: 29.8543, longitude: 77.8880 },
    "haldwani": { latitude: 29.2183, longitude: 79.5130 },
    "rudrapur": { latitude: 28.9845, longitude: 79.4004 },
    "kashipur": { latitude: 29.2155, longitude: 78.9570 },
    "rishikesh": { latitude: 30.0869, longitude: 78.2676 },
    
    // West Bengal
    "kolkata": { latitude: 22.5726, longitude: 88.3639 },
    "howrah": { latitude: 22.5958, longitude: 88.2636 },
    "durgapur": { latitude: 23.5204, longitude: 87.3119 },
    "asansol": { latitude: 23.6739, longitude: 86.9524 },
    "siliguri": { latitude: 26.7271, longitude: 88.3953 },
    "bardhaman": { latitude: 23.2324, longitude: 87.8615 },
    "burdwan": { latitude: 23.2324, longitude: 87.8615 },
    "malda": { latitude: 25.0096, longitude: 88.1406 },
    "baharampur": { latitude: 24.1000, longitude: 88.2500 },
    "kharagpur": { latitude: 22.3460, longitude: 87.2320 },
    
    // Union Territories
    "delhi": { latitude: 28.7041, longitude: 77.1025 },
    "new delhi": { latitude: 28.6139, longitude: 77.2090 },
    "chandigarh": { latitude: 30.7333, longitude: 76.7794 },
    "puducherry": { latitude: 11.9416, longitude: 79.8083 },
    "pondicherry": { latitude: 11.9416, longitude: 79.8083 },
    "port blair": { latitude: 11.6234, longitude: 92.7265 },
    "silvassa": { latitude: 20.2737, longitude: 73.0135 },
    "daman": { latitude: 20.4283, longitude: 72.8397 },
    "diu": { latitude: 20.7144, longitude: 70.9873 },
    "kavaratti": { latitude: 10.5669, longitude: 72.6420 },
    "leh": { latitude: 34.1526, longitude: 77.5771 },
    "kargil": { latitude: 34.5539, longitude: 76.1313 },
    "jammu": { latitude: 32.7266, longitude: 74.8570 },
    "srinagar": { latitude: 34.0837, longitude: 74.7973 },
  };

  const key = district.toLowerCase().trim();
  return districtCoords[key] || null;
}

/**
 * Format weather data for context
 */
function formatWeatherContext(weather: any, language: "mr" | "hi" | "en"): string {
  const labels = {
    mr: {
      current: "सध्याचे हवामान",
      temp: "तापमान",
      humidity: "आर्द्रता",
      wind: "वारा",
      forecast: "पुढील 3 दिवसांचा अंदाज"
    },
    hi: {
      current: "वर्तमान मौसम",
      temp: "तापमान",
      humidity: "आर्द्रता",
      wind: "हवा",
      forecast: "अगले 3 दिनों का पूर्वानुमान"
    },
    en: {
      current: "Current Weather",
      temp: "Temperature",
      humidity: "Humidity",
      wind: "Wind",
      forecast: "3-Day Forecast"
    }
  };

  const l = labels[language];
  
  let text = `${l.current} (${weather.location}):\n`;
  text += `${l.temp}: ${weather.temperature}°C, ${l.humidity}: ${weather.humidity}%, ${l.wind}: ${weather.wind_speed} km/h\n`;
  
  if (weather.forecast_3day && weather.forecast_3day.length > 0) {
    text += `\n${l.forecast}:\n`;
    weather.forecast_3day.forEach((day: any) => {
      text += `${day.date}: ${day.temp_min}°C - ${day.temp_max}°C, ${day.description}\n`;
    });
  }

  return text;
}

/**
 * Format market price data for context
 */
function formatMarketPriceContext(prices: any[], language: "mr" | "hi" | "en"): string {
  const labels = {
    mr: {
      title: "बाजार भाव",
      market: "मंडी",
      price: "भाव"
    },
    hi: {
      title: "बाजार दाम",
      market: "मंडी",
      price: "दाम"
    },
    en: {
      title: "Market Prices",
      market: "Market",
      price: "Price"
    }
  };

  const l = labels[language];
  
  let text = `${l.title}:\n`;
  prices.slice(0, 3).forEach((price: any) => {
    text += `${l.market}: ${price.market}, ${price.commodity}: ₹${price.modal_price}/${price.unit}\n`;
  });

  return text;
}

/**
 * Format scheme data for context
 */
function formatSchemeContext(schemes: any[], language: "mr" | "hi" | "en"): string {
  const labels = {
    mr: {
      title: "सरकारी योजना"
    },
    hi: {
      title: "सरकारी योजनाएं"
    },
    en: {
      title: "Government Schemes"
    }
  };

  const l = labels[language];
  
  let text = `${l.title}:\n`;
  schemes.forEach((scheme: any) => {
    const name = scheme[`scheme_name_${language}`] || scheme.scheme_name;
    const desc = scheme[`description_${language}`] || scheme.description;
    text += `• ${name}: ${desc}\n`;
  });

  return text;
}

// Get market prices (mandi rates)
app.get("/agent/market-prices", async (req, res) => {
  const { state, commodity, district, language } = req.query as {
    state?: string;
    commodity?: string;
    district?: string;
    language?: "mr" | "hi" | "en";
  };

  if (!state || !commodity) {
    return res.status(400).json({
      error: "state and commodity are required"
    });
  }

  try {
    const prices = await realtimeDataService.getMarketPrices(
      state,
      commodity,
      district
    );

    res.json({
      prices,
      count: prices.length,
      metadata: {
        state,
        commodity,
        district,
        language: language || "en",
        fetched_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Market prices error:", error);
    res.status(500).json({
      error: "Failed to fetch market prices"
    });
  }
});

// Get weather data
app.get("/agent/weather", async (req, res) => {
  const { latitude, longitude, language } = req.query as {
    latitude?: string;
    longitude?: string;
    language?: "mr" | "hi" | "en";
  };

  if (!latitude || !longitude) {
    return res.status(400).json({
      error: "latitude and longitude are required"
    });
  }

  try {
    const weather = await realtimeDataService.getWeather(
      parseFloat(latitude),
      parseFloat(longitude)
    );

    res.json({
      weather,
      metadata: {
        language: language || "en",
        fetched_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Weather error:", error);
    res.status(500).json({
      error: "Failed to fetch weather data"
    });
  }
});

// Get government schemes
app.get("/agent/schemes", async (req, res) => {
  const { state, category, language } = req.query as {
    state?: string;
    category?: string;
    language?: "mr" | "hi" | "en";
  };

  if (!state) {
    return res.status(400).json({
      error: "state is required"
    });
  }

  try {
    const schemes = await realtimeDataService.getGovernmentSchemes(
      state,
      category || "agriculture"
    );

    // Filter by language if specified
    const lang: "mr" | "hi" | "en" = language || "en";
    const localizedSchemes = schemes.map((scheme) => ({
      scheme_id: scheme.scheme_id,
      scheme_code: scheme.scheme_code,
      scheme_name: scheme[`scheme_name_${lang}` as keyof typeof scheme] || scheme.scheme_name,
      description: scheme[`description_${lang}` as keyof typeof scheme] || scheme.description,
      benefits: scheme.benefits,
      eligibility: scheme.eligibility,
      application_url: scheme.application_url,
      department: scheme.department,
      state: scheme.state,
      category: scheme.category,
      is_active: scheme.is_active
    }));

    res.json({
      schemes: localizedSchemes,
      count: localizedSchemes.length,
      metadata: {
        state,
        category: category || "agriculture",
        language: lang,
        fetched_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Schemes error:", error);
    res.status(500).json({
      error: "Failed to fetch government schemes"
    });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Agri-OS backend listening on http://localhost:${PORT}`);
});

