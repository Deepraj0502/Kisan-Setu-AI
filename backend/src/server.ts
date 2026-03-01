import express from "express";
import cors from "cors";
import { getMockAnswer } from "./services/mockKnowledgeBase";
import { checkEligibilityForAllSchemes, getMockFarmerProfile, type FarmerLandRecord } from "./services/sarkariMitraService";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: false
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/agent/query", async (req, res) => {
  const { question, language } = req.body as {
    question?: string;
    language?: "mr" | "hi" | "en";
  };

  if (!question?.trim()) {
    return res.status(400).json({
      error: "Question is required"
    });
  }

  const lang: "mr" | "hi" | "en" = language || "en";

  // For now, always use mock KB. Later we can switch to real RAG when AWS is ready.
  const answer = getMockAnswer(question.trim(), lang);

  res.json({
    answer,
    metadata: {
      language: lang,
      engine: "mock-knowledge-base"
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

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Agri-OS backend listening on http://localhost:${PORT}`);
});

