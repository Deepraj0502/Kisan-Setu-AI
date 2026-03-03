import { Pool } from "pg";
import { getPool } from "../db/client";

export interface FarmerProfile {
  phone_number: string;
  name?: string;
  village?: string;
  district?: string;
  state?: string;
  language?: "mr" | "hi" | "en";
  land_size_hectares?: number;
  land_type?: "irrigated" | "rainfed" | "both";
  soil_type?: string;
  primary_crops?: string[];
  current_season_crops?: string[];
  preferred_notification_time?: string;
  notification_enabled?: boolean;
  onboarding_completed?: boolean;
  onboarding_step?: number;
}

export interface ConversationMessage {
  phone_number: string;
  message_type: "user" | "agent";
  message_text: string;
  message_kind?: "text" | "voice" | "image";
  metadata?: any;
}

let pool: Pool | null = null;

async function getDbPool(): Promise<Pool> {
  if (!pool) {
    pool = getPool();
  }
  return pool;
}

export async function getFarmerProfile(
  phoneNumber: string
): Promise<FarmerProfile | null> {
  const db = await getPool();

  const result = await db.query(
    `SELECT * FROM farmer_profiles WHERE phone_number = $1`,
    [phoneNumber]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function createFarmerProfile(
  profile: FarmerProfile
): Promise<FarmerProfile> {
  const db = await getPool();

  const result = await db.query(
    `INSERT INTO farmer_profiles (
      phone_number, name, village, district, state, language,
      land_size_hectares, land_type, soil_type,
      primary_crops, current_season_crops,
      onboarding_step, onboarding_completed
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      profile.phone_number,
      profile.name || null,
      profile.village || null,
      profile.district || null,
      profile.state || null,
      profile.language || "mr",
      profile.land_size_hectares || null,
      profile.land_type || null,
      profile.soil_type || null,
      profile.primary_crops || [],
      profile.current_season_crops || [],
      profile.onboarding_step || 0,
      profile.onboarding_completed || false,
    ]
  );

  // Create default preferences
  await db.query(
    `INSERT INTO user_preferences (phone_number) VALUES ($1)
     ON CONFLICT (phone_number) DO NOTHING`,
    [profile.phone_number]
  );

  return result.rows[0];
}

export async function updateFarmerProfile(
  phoneNumber: string,
  updates: Partial<FarmerProfile>
): Promise<FarmerProfile> {
  const db = await getPool();

  // Build dynamic update query
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(updates).forEach(([key, value]) => {
    // Skip phone_number and last_active_at (we'll set it separately)
    if (key !== "phone_number" && key !== "last_active_at" && value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  values.push(phoneNumber);

  const query = `
    UPDATE farmer_profiles 
    SET ${fields.join(", ")}, last_active_at = CURRENT_TIMESTAMP
    WHERE phone_number = $${paramIndex}
    RETURNING *
  `;

  const result = await db.query(query, values);
  return result.rows[0];
}

export async function saveConversation(
  message: ConversationMessage
): Promise<void> {
  const db = await getPool();

  await db.query(
    `INSERT INTO conversations (
      phone_number, message_type, message_text, message_kind, metadata
    ) VALUES ($1, $2, $3, $4, $5)`,
    [
      message.phone_number,
      message.message_type,
      message.message_text,
      message.message_kind || "text",
      message.metadata ? JSON.stringify(message.metadata) : null,
    ]
  );

  // Update last active
  await db.query(
    `UPDATE farmer_profiles 
     SET last_active_at = CURRENT_TIMESTAMP 
     WHERE phone_number = $1`,
    [message.phone_number]
  );
}

export async function getConversationHistory(
  phoneNumber: string,
  limit: number = 10
): Promise<any[]> {
  const db = await getPool();

  const result = await db.query(
    `SELECT * FROM conversations 
     WHERE phone_number = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [phoneNumber, limit]
  );

  return result.rows.reverse(); // Return in chronological order
}

export async function saveNotification(
  phoneNumber: string,
  notificationType: string,
  notificationText: string,
  priority: string = "medium"
): Promise<void> {
  const db = await getPool();

  await db.query(
    `INSERT INTO notifications_sent (
      phone_number, notification_type, notification_text, priority
    ) VALUES ($1, $2, $3, $4)`,
    [phoneNumber, notificationType, notificationText, priority]
  );
}

export async function getPersonalizedContext(
  phoneNumber: string
): Promise<string> {
  const profile = await getFarmerProfile(phoneNumber);

  if (!profile || !profile.onboarding_completed) {
    return "";
  }

  const contextParts: string[] = [];

  if (profile.name) {
    contextParts.push(`Farmer: ${profile.name}`);
  }

  if (profile.village && profile.district) {
    contextParts.push(`Location: ${profile.village}, ${profile.district}, ${profile.state || ""}`);
  }

  if (profile.land_size_hectares) {
    contextParts.push(`Land: ${profile.land_size_hectares} hectares (${profile.land_type || "unknown"})`);
  }

  if (profile.primary_crops && profile.primary_crops.length > 0) {
    contextParts.push(`Primary crops: ${profile.primary_crops.join(", ")}`);
  }

  if (profile.current_season_crops && profile.current_season_crops.length > 0) {
    contextParts.push(`Current season: ${profile.current_season_crops.join(", ")}`);
  }

  return contextParts.join(" | ");
}

export function getOnboardingQuestion(
  step: number,
  language: "mr" | "hi" | "en"
): string {
  const questions = {
    mr: [
      "नमस्कार! 🙏 मी Kisan Setu AI आहे. मी तुम्हाला शेतीसाठी मदत करू शकतो.\n\nसुरुवात करण्यासाठी, कृपया तुमचे नाव सांगा.",
      "धन्यवाद! तुमचे गाव आणि जिल्हा काय आहे?\n(उदा: नाशिक, नाशिक जिल्हा)",
      "तुमच्याकडे किती जमीन आहे? (हेक्टरमध्ये)\n(उदा: 2.5)",
      "तुमची जमीन कोणत्या प्रकारची आहे?\n1️⃣ सिंचित\n2️⃣ पावसावर अवलंबून\n3️⃣ दोन्ही",
      "तुम्ही मुख्यतः कोणती पिके घेता?\n(उदा: कांदा, टोमॅटो, गहू)\nएकापेक्षा जास्त असल्यास स्वल्पविरामाने विभक्त करा.",
      "सध्या या हंगामात कोणती पिके आहेत?\n(उदा: कांदा, मिरची)",
      "✅ नोंदणी पूर्ण! आता मी तुम्हाला वैयक्तिक सल्ला देऊ शकतो.\n\nतुम्ही मला काहीही विचारू शकता:\n• पीक रोग ओळख\n• हवामान सल्ला\n• बाजार भाव\n• सरकारी योजना\n• सिंचन सल्ला",
    ],
    hi: [
      "नमस्कार! 🙏 मैं Kisan Setu AI हूं। मैं आपकी खेती में मदद कर सकता हूं।\n\nशुरू करने के लिए, कृपया अपना नाम बताएं।",
      "धन्यवाद! आपका गांव और जिला क्या है?\n(उदा: नासिक, नासिक जिला)",
      "आपके पास कितनी जमीन है? (हेक्टेयर में)\n(उदा: 2.5)",
      "आपकी जमीन किस प्रकार की है?\n1️⃣ सिंचित\n2️⃣ वर्षा आधारित\n3️⃣ दोनों",
      "आप मुख्य रूप से कौन सी फसलें उगाते हैं?\n(उदा: प्याज, टमाटर, गेहूं)\nएक से अधिक हो तो अल्पविराम से अलग करें।",
      "इस मौसम में कौन सी फसलें हैं?\n(उदा: प्याज, मिर्च)",
      "✅ पंजीकरण पूर्ण! अब मैं आपको व्यक्तिगत सलाह दे सकता हूं।\n\nआप मुझसे कुछ भी पूछ सकते हैं:\n• फसल रोग पहचान\n• मौसम सलाह\n• बाजार भाव\n• सरकारी योजनाएं\n• सिंचाई सलाह",
    ],
    en: [
      "Hello! 🙏 I'm Kisan Setu AI. I can help you with farming.\n\nTo get started, please tell me your name.",
      "Thank you! What is your village and district?\n(e.g., Nashik, Nashik District)",
      "How much land do you have? (in hectares)\n(e.g., 2.5)",
      "What type of land do you have?\n1️⃣ Irrigated\n2️⃣ Rainfed\n3️⃣ Both",
      "What crops do you primarily grow?\n(e.g., Onion, Tomato, Wheat)\nSeparate with commas if multiple.",
      "What crops are in this season?\n(e.g., Onion, Chili)",
      "✅ Registration complete! Now I can give you personalized advice.\n\nYou can ask me anything:\n• Crop disease identification\n• Weather advice\n• Market prices\n• Government schemes\n• Irrigation advice",
    ],
  };

  return questions[language][step] || questions[language][0];
}

export function parseOnboardingResponse(
  step: number,
  response: string,
  currentProfile: Partial<FarmerProfile>
): Partial<FarmerProfile> {
  const updates: Partial<FarmerProfile> = { ...currentProfile };

  switch (step) {
    case 0: // Name
      updates.name = response.trim();
      updates.onboarding_step = 1;
      break;

    case 1: // Village and district
      const parts = response.split(",").map((s) => s.trim());
      if (parts.length >= 2) {
        updates.village = parts[0];
        updates.district = parts[1];
        if (parts.length >= 3) {
          updates.state = parts[2];
        }
      } else {
        updates.village = response.trim();
      }
      updates.onboarding_step = 2;
      break;

    case 2: // Land size
      const landSize = parseFloat(response.replace(/[^\d.]/g, ""));
      if (!isNaN(landSize)) {
        updates.land_size_hectares = landSize;
      }
      updates.onboarding_step = 3;
      break;

    case 3: // Land type
      const landTypeMap: { [key: string]: "irrigated" | "rainfed" | "both" } = {
        "1": "irrigated",
        "2": "rainfed",
        "3": "both",
        irrigated: "irrigated",
        rainfed: "rainfed",
        both: "both",
        सिंचित: "irrigated",
        पावसावर: "rainfed",
        दोन्ही: "both",
        वर्षा: "rainfed",
      };
      const landType = Object.keys(landTypeMap).find((key) =>
        response.toLowerCase().includes(key.toLowerCase())
      );
      if (landType) {
        updates.land_type = landTypeMap[landType];
      }
      updates.onboarding_step = 4;
      break;

    case 4: // Primary crops
      updates.primary_crops = response
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      updates.onboarding_step = 5;
      break;

    case 5: // Current season crops
      updates.current_season_crops = response
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      updates.onboarding_step = 6;
      updates.onboarding_completed = true;
      break;
  }

  return updates;
}
