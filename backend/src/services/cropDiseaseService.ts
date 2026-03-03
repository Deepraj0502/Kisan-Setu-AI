import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
});

interface CropDiseaseRequest {
  imageBase64: string;
  language: "mr" | "hi" | "en";
  cropType?: string;
}

interface CropDiseaseResponse {
  disease_name: string;
  confidence: string;
  symptoms: string[];
  causes: string[];
  treatment: string[];
  prevention: string[];
  severity: "low" | "medium" | "high";
  full_analysis: string;
}

const SYSTEM_PROMPTS = {
  mr: `तुम्ही एक तज्ञ कृषी रोग निदान सहाय्यक आहात. तुमचे काम पीक रोगांचे विश्लेषण करणे आणि शेतकऱ्यांना मराठीत मदत करणे आहे.

प्रतिमा विश्लेषण करा आणि खालील माहिती द्या:
1. रोगाचे नाव (मराठी आणि वैज्ञानिक नाव)
2. आत्मविश्वास पातळी (उच्च/मध्यम/कमी)
3. लक्षणे (काय दिसते)
4. कारणे (रोग का होतो)
5. उपचार (काय करावे)
6. प्रतिबंध (भविष्यात कसे टाळावे)
7. तीव्रता (कमी/मध्यम/उच्च)

व्यावहारिक, स्पष्ट आणि शेतकऱ्यांना समजेल अशी भाषा वापरा.`,

  hi: `आप एक विशेषज्ञ कृषि रोग निदान सहायक हैं। आपका काम फसल रोगों का विश्लेषण करना और किसानों की हिंदी में मदद करना है।

छवि का विश्लेषण करें और निम्नलिखित जानकारी दें:
1. रोग का नाम (हिंदी और वैज्ञानिक नाम)
2. विश्वास स्तर (उच्च/मध्यम/कम)
3. लक्षण (क्या दिखाई देता है)
4. कारण (रोग क्यों होता है)
5. उपचार (क्या करना चाहिए)
6. रोकथाम (भविष्य में कैसे बचें)
7. गंभीरता (कम/मध्यम/उच्च)

व्यावहारिक, स्पष्ट और किसानों को समझ में आने वाली भाषा का उपयोग करें।`,

  en: `You are an expert agricultural disease diagnosis assistant. Your job is to analyze crop diseases and help farmers in English.

Analyze the image and provide the following information:
1. Disease name (common and scientific name)
2. Confidence level (high/medium/low)
3. Symptoms (what is visible)
4. Causes (why the disease occurs)
5. Treatment (what to do)
6. Prevention (how to avoid in future)
7. Severity (low/medium/high)

Use practical, clear language that farmers can understand.`,
};

const USER_PROMPTS = {
  mr: (cropType?: string) =>
    `कृपया या ${cropType || "पीक"} प्रतिमेचे विश्लेषण करा आणि रोग ओळखा. संपूर्ण तपशील द्या.`,
  hi: (cropType?: string) =>
    `कृपया इस ${cropType || "फसल"} की छवि का विश्लेषण करें और रोग की पहचान करें। पूरी जानकारी दें।`,
  en: (cropType?: string) =>
    `Please analyze this ${cropType || "crop"} image and identify the disease. Provide complete details.`,
};

export async function analyzeCropDisease(
  request: CropDiseaseRequest
): Promise<CropDiseaseResponse> {
  const { imageBase64, language, cropType } = request;

  // Use inference profile ARN for Claude 3.5 Sonnet
  // Default to the same inference profile used for chat
  const modelId =
    process.env.BEDROCK_VISION_MODEL_ID ||
    process.env.BEDROCK_CHAT_MODEL_ID ||
    "arn:aws:bedrock:ap-south-1:624664026362:inference-profile/apac.anthropic.claude-sonnet-4-20250514-v1:0";

  const systemPrompt = SYSTEM_PROMPTS[language];
  const userPrompt = USER_PROMPTS[language](cropType);

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 2000,
    temperature: 0.3,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: userPrompt,
          },
        ],
      },
    ],
  };

  try {
    const command = new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const analysisText = responseBody.content[0].text;

    // Parse the response to extract structured information
    const parsed = parseAnalysis(analysisText, language);

    return {
      ...parsed,
      full_analysis: analysisText,
    };
  } catch (error) {
    console.error("Error analyzing crop disease:", error);
    throw error;
  }
}

function parseAnalysis(
  text: string,
  language: "mr" | "hi" | "en"
): Omit<CropDiseaseResponse, "full_analysis"> {
  // Extract disease name (first line or heading)
  const lines = text.split("\n").filter((l) => l.trim());
  const diseaseName = lines[0]?.replace(/^#+\s*/, "").trim() || "Unknown Disease";

  // Determine confidence based on keywords
  const lowerText = text.toLowerCase();
  let confidence = "medium";
  if (
    lowerText.includes("clearly") ||
    lowerText.includes("definitely") ||
    lowerText.includes("स्पष्ट") ||
    lowerText.includes("निश्चित")
  ) {
    confidence = "high";
  } else if (
    lowerText.includes("possibly") ||
    lowerText.includes("might") ||
    lowerText.includes("शक्यतो") ||
    lowerText.includes("संभवतः")
  ) {
    confidence = "low";
  }

  // Extract sections based on language
  const sections = extractSections(text, language);

  // Determine severity
  let severity: "low" | "medium" | "high" = "medium";
  if (
    lowerText.includes("severe") ||
    lowerText.includes("critical") ||
    lowerText.includes("तीव्र") ||
    lowerText.includes("गंभीर")
  ) {
    severity = "high";
  } else if (
    lowerText.includes("mild") ||
    lowerText.includes("minor") ||
    lowerText.includes("हलका") ||
    lowerText.includes("कम")
  ) {
    severity = "low";
  }

  return {
    disease_name: diseaseName,
    confidence,
    symptoms: sections.symptoms,
    causes: sections.causes,
    treatment: sections.treatment,
    prevention: sections.prevention,
    severity,
  };
}

function extractSections(text: string, language: "mr" | "hi" | "en") {
  const sections = {
    symptoms: [] as string[],
    causes: [] as string[],
    treatment: [] as string[],
    prevention: [] as string[],
  };

  // Keywords for different sections in different languages
  const keywords = {
    symptoms: {
      mr: ["लक्षण", "दिसते", "चिन्हे"],
      hi: ["लक्षण", "दिखाई", "संकेत"],
      en: ["symptom", "visible", "sign", "appear"],
    },
    causes: {
      mr: ["कारण", "होते", "कारणे"],
      hi: ["कारण", "होता", "वजह"],
      en: ["cause", "reason", "due to", "because"],
    },
    treatment: {
      mr: ["उपचार", "उपाय", "करावे"],
      hi: ["उपचार", "इलाज", "करना"],
      en: ["treatment", "remedy", "solution", "control"],
    },
    prevention: {
      mr: ["प्रतिबंध", "टाळावे", "रोखणे"],
      hi: ["रोकथाम", "बचाव", "रोकना"],
      en: ["prevention", "prevent", "avoid", "protect"],
    },
  };

  // Simple extraction: split by lines and categorize
  const lines = text.split("\n").filter((l) => l.trim());
  let currentSection: keyof typeof sections | null = null;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Check which section this line belongs to
    for (const [section, langs] of Object.entries(keywords)) {
      const sectionKeywords = langs[language] || langs.en;
      if (sectionKeywords.some((kw) => lowerLine.includes(kw.toLowerCase()))) {
        currentSection = section as keyof typeof sections;
        break;
      }
    }

    // Add line to current section if it's a bullet point or numbered item
    if (
      currentSection &&
      (line.match(/^[\d\-\*•]/) || line.trim().startsWith("-"))
    ) {
      const cleanLine = line.replace(/^[\d\-\*•.\s]+/, "").trim();
      if (cleanLine) {
        sections[currentSection].push(cleanLine);
      }
    }
  }

  // If sections are empty, extract from full text
  if (sections.symptoms.length === 0) {
    sections.symptoms = ["See full analysis for details"];
  }
  if (sections.treatment.length === 0) {
    sections.treatment = ["See full analysis for treatment recommendations"];
  }

  return sections;
}
