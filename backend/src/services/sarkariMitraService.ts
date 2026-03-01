/**
 * Sarkari-Mitra Service
 * 
 * This service actively checks farmer eligibility for government schemes
 * based on their land records and provides real-time application guidance.
 */

import type { GovernmentScheme, EligibilityCriteria, LanguageCode } from "../types/rag";

// Extended farmer profile with land records
export interface FarmerLandRecord {
  phone_number: string;
  name?: string;
  age?: number;
  state?: string;
  district?: string;
  land_ownership: boolean;
  land_size_hectares: number;
  land_type?: "irrigated" | "rainfed" | "both";
  crops_grown?: string[];
  is_registered_farmer?: boolean;
  is_government_employee?: boolean;
  is_tax_payer?: boolean;
  bank_account?: boolean;
  aadhaar_linked?: boolean;
}

export interface EligibilityResult {
  scheme: GovernmentScheme;
  is_eligible: boolean;
  eligibility_score: number; // 0-100
  reasons: string[]; // Why eligible/not eligible
  missing_requirements?: string[]; // What's missing if not eligible
}

export interface ApplicationStep {
  step_number: number;
  title: string;
  description: string;
  documents_required?: string[];
  action_url?: string;
  estimated_time?: string;
}

export interface SchemeEligibilityResponse {
  farmer_profile: FarmerLandRecord;
  eligible_schemes: EligibilityResult[];
  application_guidance: {
    [scheme_code: string]: ApplicationStep[];
  };
}

// Mock schemes database (in production, this would come from PostgreSQL)
const MOCK_SCHEMES: GovernmentScheme[] = [
  {
    id: "1",
    scheme_code: "PM-KISAN-2026",
    name_english: "PM Kisan Samman Nidhi",
    name_marathi: "पीएम किसान सम्मान निधी",
    name_hindi: "पीएम किसान सम्मान निधी",
    description_english: "Direct income support of ₹6,000 per year to all landholding farmers",
    description_marathi: "सर्व जमीनधारक शेतकऱ्यांना दरवर्षी ₹६,००० चे थेट उत्पन्न समर्थन",
    description_hindi: "सभी जमीनधारक किसानों को प्रति वर्ष ₹६,००० का प्रत्यक्ष आय सहायता",
    eligibility_criteria: {
      land_ownership: true,
      age_min: 18,
      exclusions: ["government_employees", "tax_payers"]
    },
    benefits_summary: "₹6,000 per year in 3 installments of ₹2,000 each",
    eligible_states: ["MH", "UP", "MP", "RJ", "GJ", "KA", "TN", "AP", "TS"],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: "2",
    scheme_code: "SOIL-HEALTH-CARD-2026",
    name_english: "Soil Health Card Scheme",
    name_marathi: "मृदा आरोग्य कार्ड योजना",
    name_hindi: "मिट्टी स्वास्थ्य कार्ड योजना",
    description_english: "Free soil testing and health cards for farmers",
    description_marathi: "शेतकऱ्यांसाठी मोफत मृदा चाचणी आणि आरोग्य कार्ड",
    description_hindi: "किसानों के लिए मुफ्त मिट्टी परीक्षण और स्वास्थ्य कार्ड",
    eligibility_criteria: {
      farmer_status: true
    },
    benefits_summary: "Free soil testing, personalized fertilizer recommendations",
    eligible_states: ["MH", "UP", "MP", "RJ", "GJ", "KA", "TN", "AP", "TS"],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: "3",
    scheme_code: "SUBSIDY-FERTILIZER-2026",
    name_english: "Fertilizer Subsidy Scheme",
    name_marathi: "खत सबसिडी योजना",
    name_hindi: "उर्वरक सब्सिडी योजना",
    description_english: "Subsidized fertilizers for registered farmers",
    description_marathi: "नोंदणीकृत शेतकऱ्यांसाठी सबसिडी असलेले खत",
    description_hindi: "पंजीकृत किसानों के लिए सब्सिडी वाले उर्वरक",
    eligibility_criteria: {
      registration_required: true,
      land_size_min_hectares: 0.1
    },
    benefits_summary: "Up to 50% subsidy on fertilizers",
    eligible_states: ["MH", "UP", "MP", "RJ", "GJ"],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: "4",
    scheme_code: "PM-FASAL-BIMA-2026",
    name_english: "PM Fasal Bima Yojana",
    name_marathi: "पीएम फसल बीमा योजना",
    name_hindi: "पीएम फसल बीमा योजना",
    description_english: "Crop insurance scheme for farmers",
    description_marathi: "शेतकऱ्यांसाठी पीक बीमा योजना",
    description_hindi: "किसानों के लिए फसल बीमा योजना",
    eligibility_criteria: {
      land_ownership: true,
      land_size_min_hectares: 0.1,
      bank_account: true,
      aadhaar_linked: true
    },
    benefits_summary: "Crop insurance coverage with premium subsidy up to 90%",
    eligible_states: ["MH", "UP", "MP", "RJ", "GJ", "KA", "TN", "AP", "TS", "PB", "HR"],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: "5",
    scheme_code: "KISAN-CREDIT-CARD-2026",
    name_english: "Kisan Credit Card",
    name_marathi: "किसान क्रेडिट कार्ड",
    name_hindi: "किसान क्रेडिट कार्ड",
    description_english: "Credit card for farmers with interest subvention",
    description_marathi: "व्याज सबसिडीसह शेतकऱ्यांसाठी क्रेडिट कार्ड",
    description_hindi: "ब्याज सब्सिडी के साथ किसानों के लिए क्रेडिट कार्ड",
    eligibility_criteria: {
      farmer_status: true,
      land_size_min_hectares: 0.1,
      bank_account: true
    },
    benefits_summary: "Credit up to ₹3 lakhs with 2% interest subvention",
    eligible_states: ["MH", "UP", "MP", "RJ", "GJ", "KA", "TN", "AP", "TS", "PB", "HR", "WB"],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: "6",
    scheme_code: "MICRO-IRRIGATION-2026",
    name_english: "Micro Irrigation Scheme",
    name_marathi: "सूक्ष्म सिंचन योजना",
    name_hindi: "सूक्ष्म सिंचन योजना",
    description_english: "Subsidy for drip and sprinkler irrigation systems",
    description_marathi: "ड्रिप आणि स्प्रिंकलर सिंचन प्रणालीसाठी सबसिडी",
    description_hindi: "ड्रिप और स्प्रिंकलर सिंचन प्रणाली के लिए सब्सिडी",
    eligibility_criteria: {
      land_ownership: true,
      land_size_min_hectares: 0.5,
      land_type: "irrigated"
    },
    benefits_summary: "Up to 55% subsidy on micro-irrigation equipment",
    eligible_states: ["MH", "UP", "MP", "RJ", "GJ", "KA", "TN", "AP", "TS"],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Application guidance steps for each scheme
export const APPLICATION_GUIDANCE: Record<string, (lang: LanguageCode) => ApplicationStep[]> = {
  "PM-KISAN-2026": (lang: LanguageCode) => {
    if (lang === "mr") {
      return [
        {
          step_number: 1,
          title: "ऑनलाइन नोंदणी",
          description: "https://pmkisan.gov.in वर जा आणि 'Farmer Corner' > 'New Farmer Registration' वर क्लिक करा",
          documents_required: ["आधार कार्ड", "बँक खाते तपशील", "जमीन मालकी दस्तऐवज"],
          action_url: "https://pmkisan.gov.in",
          estimated_time: "15-20 मिनिटे"
        },
        {
          step_number: 2,
          title: "तपशील भरा",
          description: "तुमचे नाव, फोन नंबर, जमीन मालकी क्रमांक, बँक खाते क्रमांक इ. तपशील भरा",
          documents_required: ["आधार कार्ड", "बँक पासबुक"],
          estimated_time: "10 मिनिटे"
        },
        {
          step_number: 3,
          title: "दस्तऐवज अपलोड करा",
          description: "आधार कार्ड, जमीन मालकी दस्तऐवज आणि बँक खाते तपशील अपलोड करा",
          documents_required: ["आधार PDF", "जमीन दस्तऐवज PDF", "बँक पासबुक PDF"],
          estimated_time: "5 मिनिटे"
        },
        {
          step_number: 4,
          title: "अर्ज सबमिट करा",
          description: "सर्व तपशील तपासून 'Submit' बटण दाबा. तुम्हाला Application ID मिळेल",
          estimated_time: "2 मिनिटे"
        },
        {
          step_number: 5,
          title: "अर्ज स्थिती तपासा",
          description: "Application ID वापरून तुमच्या अर्जाची स्थिती तपासा. मंजुरी नंतर ₹2,000 तुमच्या खात्यात जमा होईल",
          action_url: "https://pmkisan.gov.in/Status",
          estimated_time: "5 मिनिटे"
        }
      ];
    } else if (lang === "hi") {
      return [
        {
          step_number: 1,
          title: "ऑनलाइन पंजीकरण",
          description: "https://pmkisan.gov.in पर जाएं और 'Farmer Corner' > 'New Farmer Registration' पर क्लिक करें",
          documents_required: ["आधार कार्ड", "बैंक खाता विवरण", "जमीन मालिकाना दस्तावेज"],
          action_url: "https://pmkisan.gov.in",
          estimated_time: "15-20 मिनट"
        },
        {
          step_number: 2,
          title: "विवरण भरें",
          description: "अपना नाम, फोन नंबर, जमीन मालिकाना नंबर, बैंक खाता नंबर आदि विवरण भरें",
          documents_required: ["आधार कार्ड", "बैंक पासबुक"],
          estimated_time: "10 मिनट"
        },
        {
          step_number: 3,
          title: "दस्तावेज अपलोड करें",
          description: "आधार कार्ड, जमीन मालिकाना दस्तावेज और बैंक खाता विवरण अपलोड करें",
          documents_required: ["आधार PDF", "जमीन दस्तावेज PDF", "बैंक पासबुक PDF"],
          estimated_time: "5 मिनट"
        },
        {
          step_number: 4,
          title: "आवेदन सबमिट करें",
          description: "सभी विवरण जांचकर 'Submit' बटन दबाएं। आपको Application ID मिलेगा",
          estimated_time: "2 मिनट"
        },
        {
          step_number: 5,
          title: "आवेदन स्थिति जांचें",
          description: "Application ID का उपयोग करके अपने आवेदन की स्थिति जांचें। मंजूरी के बाद ₹2,000 आपके खाते में जमा होगा",
          action_url: "https://pmkisan.gov.in/Status",
          estimated_time: "5 मिनट"
        }
      ];
    } else {
      return [
        {
          step_number: 1,
          title: "Online Registration",
          description: "Visit https://pmkisan.gov.in and click on 'Farmer Corner' > 'New Farmer Registration'",
          documents_required: ["Aadhaar Card", "Bank Account Details", "Land Ownership Documents"],
          action_url: "https://pmkisan.gov.in",
          estimated_time: "15-20 minutes"
        },
        {
          step_number: 2,
          title: "Fill Details",
          description: "Enter your name, phone number, land ownership number, bank account number, etc.",
          documents_required: ["Aadhaar Card", "Bank Passbook"],
          estimated_time: "10 minutes"
        },
        {
          step_number: 3,
          title: "Upload Documents",
          description: "Upload Aadhaar card, land ownership documents, and bank account details",
          documents_required: ["Aadhaar PDF", "Land Document PDF", "Bank Passbook PDF"],
          estimated_time: "5 minutes"
        },
        {
          step_number: 4,
          title: "Submit Application",
          description: "Review all details and click 'Submit'. You will receive an Application ID",
          estimated_time: "2 minutes"
        },
        {
          step_number: 5,
          title: "Check Application Status",
          description: "Check your application status using the Application ID. After approval, ₹2,000 will be credited to your account",
          action_url: "https://pmkisan.gov.in/Status",
          estimated_time: "5 minutes"
        }
      ];
    }
  },
  "SOIL-HEALTH-CARD-2026": (lang: LanguageCode) => {
    if (lang === "mr") {
      return [
        {
          step_number: 1,
          title: "कृषी सेवा केंद्राशी संपर्क",
          description: "तुमच्या जवळच्या कृषी सेवा केंद्र किंवा कृषी अधिकारीशी संपर्क करा",
          documents_required: ["आधार कार्ड", "जमीन मालकी दस्तऐवज"],
          estimated_time: "1 दिवस"
        },
        {
          step_number: 2,
          title: "जमीन नमुना द्या",
          description: "कृषी अधिकारी तुमच्या शेतात येऊन जमीन नमुना घेईल",
          estimated_time: "30 मिनिटे"
        },
        {
          step_number: 3,
          title: "प्रयोगशाळा तपासणी",
          description: "नमुना प्रयोगशाळेत पाठवला जाईल आणि 15-20 दिवसांत तपासणी पूर्ण होईल",
          estimated_time: "15-20 दिवस"
        },
        {
          step_number: 4,
          title: "मृदा आरोग्य कार्ड मिळवा",
          description: "तपासणी पूर्ण झाल्यानंतर तुम्हाला मृदा आरोग्य कार्ड मिळेल ज्यात खताची शिफारस असेल",
          estimated_time: "5 दिवस"
        }
      ];
    } else if (lang === "hi") {
      return [
        {
          step_number: 1,
          title: "कृषि सेवा केंद्र से संपर्क करें",
          description: "अपने नजदीकी कृषि सेवा केंद्र या कृषि अधिकारी से संपर्क करें",
          documents_required: ["आधार कार्ड", "जमीन मालिकाना दस्तावेज"],
          estimated_time: "1 दिन"
        },
        {
          step_number: 2,
          title: "मिट्टी का नमूना दें",
          description: "कृषि अधिकारी आपके खेत में आकर मिट्टी का नमूना लेगा",
          estimated_time: "30 मिनट"
        },
        {
          step_number: 3,
          title: "प्रयोगशाला जांच",
          description: "नमूना प्रयोगशाला में भेजा जाएगा और 15-20 दिनों में जांच पूरी होगी",
          estimated_time: "15-20 दिन"
        },
        {
          step_number: 4,
          title: "मिट्टी स्वास्थ्य कार्ड प्राप्त करें",
          description: "जांच पूरी होने के बाद आपको मिट्टी स्वास्थ्य कार्ड मिलेगा जिसमें उर्वरक की सिफारिश होगी",
          estimated_time: "5 दिन"
        }
      ];
    } else {
      return [
        {
          step_number: 1,
          title: "Contact Agriculture Service Center",
          description: "Contact your nearest agriculture service center or agriculture officer",
          documents_required: ["Aadhaar Card", "Land Ownership Documents"],
          estimated_time: "1 day"
        },
        {
          step_number: 2,
          title: "Provide Soil Sample",
          description: "Agriculture officer will visit your farm and collect soil sample",
          estimated_time: "30 minutes"
        },
        {
          step_number: 3,
          title: "Laboratory Testing",
          description: "Sample will be sent to laboratory and testing will complete in 15-20 days",
          estimated_time: "15-20 days"
        },
        {
          step_number: 4,
          title: "Receive Soil Health Card",
          description: "After testing is complete, you will receive soil health card with fertilizer recommendations",
          estimated_time: "5 days"
        }
      ];
    }
  },
  "SUBSIDY-FERTILIZER-2026": (lang: LanguageCode) => {
    const base = lang === "mr" 
      ? { step1: "कृषी सेवा केंद्रात नोंदणी करा", step2: "खत कार्ड मिळवा", step3: "सबसिडी असलेले खत खरेदी करा" }
      : lang === "hi"
      ? { step1: "कृषि सेवा केंद्र में पंजीकरण करें", step2: "उर्वरक कार्ड प्राप्त करें", step3: "सब्सिडी वाले उर्वरक खरीदें" }
      : { step1: "Register at Agriculture Service Center", step2: "Get Fertilizer Card", step3: "Purchase subsidized fertilizers" };
    
    return [
      { step_number: 1, title: base.step1, description: base.step1, documents_required: ["आधार कार्ड", "जमीन दस्तऐवज"], estimated_time: "1 दिवस" },
      { step_number: 2, title: base.step2, description: base.step2, estimated_time: "7 दिवस" },
      { step_number: 3, title: base.step3, description: base.step3, estimated_time: "1 दिवस" }
    ];
  },
  "PM-FASAL-BIMA-2026": (lang: LanguageCode) => {
    const base = lang === "mr"
      ? { step1: "बँक किंवा कृषी सेवा केंद्रात संपर्क", step2: "पीक बीमा फॉर्म भरा", step3: "प्रीमियम भरा", step4: "बीमा पॉलिसी मिळवा" }
      : lang === "hi"
      ? { step1: "बैंक या कृषि सेवा केंद्र से संपर्क करें", step2: "फसल बीमा फॉर्म भरें", step3: "प्रीमियम जमा करें", step4: "बीमा पॉलिसी प्राप्त करें" }
      : { step1: "Contact bank or Agriculture Service Center", step2: "Fill crop insurance form", step3: "Pay premium", step4: "Receive insurance policy" };
    
    return [
      { step_number: 1, title: base.step1, description: base.step1, documents_required: ["आधार", "बँक खाते", "जमीन दस्तऐवज"], estimated_time: "1 दिवस" },
      { step_number: 2, title: base.step2, description: base.step2, estimated_time: "30 मिनिटे" },
      { step_number: 3, title: base.step3, description: base.step3, estimated_time: "10 मिनिटे" },
      { step_number: 4, title: base.step4, description: base.step4, estimated_time: "15 दिवस" }
    ];
  },
  "KISAN-CREDIT-CARD-2026": (lang: LanguageCode) => {
    const base = lang === "mr"
      ? { step1: "बँकेत संपर्क", step2: "KCC अर्ज भरा", step3: "दस्तऐवज सबमिट करा", step4: "KCC कार्ड मिळवा" }
      : lang === "hi"
      ? { step1: "बैंक से संपर्क करें", step2: "KCC आवेदन भरें", step3: "दस्तावेज जमा करें", step4: "KCC कार्ड प्राप्त करें" }
      : { step1: "Contact bank", step2: "Fill KCC application", step3: "Submit documents", step4: "Receive KCC card" };
    
    return [
      { step_number: 1, title: base.step1, description: base.step1, documents_required: ["आधार", "जमीन दस्तऐवज", "बँक खाते"], estimated_time: "1 दिवस" },
      { step_number: 2, title: base.step2, description: base.step2, estimated_time: "20 मिनिटे" },
      { step_number: 3, title: base.step3, description: base.step3, estimated_time: "5 मिनिटे" },
      { step_number: 4, title: base.step4, description: base.step4, estimated_time: "15-30 दिवस" }
    ];
  },
  "MICRO-IRRIGATION-2026": (lang: LanguageCode) => {
    const base = lang === "mr"
      ? { step1: "कृषी अधिकारीशी संपर्क", step2: "सिंचन प्रणाली निवडा", step3: "सबसिडी अर्ज करा", step4: "सिंचन प्रणाली स्थापित करा" }
      : lang === "hi"
      ? { step1: "कृषि अधिकारी से संपर्क करें", step2: "सिंचन प्रणाली चुनें", step3: "सब्सिडी आवेदन करें", step4: "सिंचन प्रणाली स्थापित करें" }
      : { step1: "Contact agriculture officer", step2: "Select irrigation system", step3: "Apply for subsidy", step4: "Install irrigation system" };
    
    return [
      { step_number: 1, title: base.step1, description: base.step1, documents_required: ["जमीन दस्तऐवज"], estimated_time: "1 दिवस" },
      { step_number: 2, title: base.step2, description: base.step2, estimated_time: "3 दिवस" },
      { step_number: 3, title: base.step3, description: base.step3, estimated_time: "7 दिवस" },
      { step_number: 4, title: base.step4, description: base.step4, estimated_time: "30 दिवस" }
    ];
  }
};

/**
 * Check eligibility for a single scheme
 */
function checkSchemeEligibility(
  farmer: FarmerLandRecord,
  scheme: GovernmentScheme
): EligibilityResult {
  const criteria = scheme.eligibility_criteria;
  const reasons: string[] = [];
  const missing: string[] = [];
  let score = 0;
  let eligible = true;

  // Check state eligibility
  if (scheme.eligible_states && scheme.eligible_states.length > 0) {
    const stateCode = farmer.state?.toUpperCase().substring(0, 2);
    if (!stateCode || !scheme.eligible_states.includes(stateCode)) {
      eligible = false;
      missing.push(`State not eligible (${farmer.state || "Unknown"})`);
    } else {
      score += 20;
      reasons.push(`Eligible state: ${farmer.state}`);
    }
  }

  // Check land ownership
  if (criteria.land_ownership !== undefined) {
    if (criteria.land_ownership && !farmer.land_ownership) {
      eligible = false;
      missing.push("Land ownership required");
    } else if (farmer.land_ownership) {
      score += 20;
      reasons.push("Has land ownership");
    }
  }

  // Check age
  if (criteria.age_min !== undefined && farmer.age !== undefined) {
    if (farmer.age < criteria.age_min) {
      eligible = false;
      missing.push(`Minimum age ${criteria.age_min} years required`);
    } else {
      score += 15;
      reasons.push(`Age ${farmer.age} meets requirement (min ${criteria.age_min})`);
    }
  }

  // Check land size
  if (criteria.land_size_min_hectares !== undefined) {
    if (farmer.land_size_hectares < criteria.land_size_min_hectares) {
      eligible = false;
      missing.push(`Minimum land size ${criteria.land_size_min_hectares} hectares required`);
    } else {
      score += 15;
      reasons.push(`Land size ${farmer.land_size_hectares} hectares meets requirement`);
    }
  }

  // Check registration
  if (criteria.registration_required && !farmer.is_registered_farmer) {
    eligible = false;
    missing.push("Farmer registration required");
  } else if (farmer.is_registered_farmer) {
    score += 10;
    reasons.push("Registered farmer");
  }

  // Check exclusions
  if (criteria.exclusions) {
    for (const exclusion of criteria.exclusions) {
      if (exclusion === "government_employees" && farmer.is_government_employee) {
        eligible = false;
        missing.push("Government employees are excluded");
      }
      if (exclusion === "tax_payers" && farmer.is_tax_payer) {
        eligible = false;
        missing.push("Tax payers are excluded");
      }
    }
  }

  // Check bank account
  if (criteria.bank_account && !farmer.bank_account) {
    eligible = false;
    missing.push("Bank account required");
  } else if (farmer.bank_account) {
    score += 10;
    reasons.push("Has bank account");
  }

  // Check Aadhaar
  if (criteria.aadhaar_linked && !farmer.aadhaar_linked) {
    eligible = false;
    missing.push("Aadhaar linked bank account required");
  } else if (farmer.aadhaar_linked) {
    score += 10;
    reasons.push("Aadhaar linked");
  }

  // Check land type
  if (criteria.land_type && farmer.land_type !== criteria.land_type) {
    if (criteria.land_type === "irrigated" && farmer.land_type !== "irrigated") {
      eligible = false;
      missing.push("Irrigated land required");
    }
  } else if (farmer.land_type === criteria.land_type) {
    score += 10;
    reasons.push(`Land type matches: ${criteria.land_type}`);
  }

  return {
    scheme,
    is_eligible: eligible && score >= 50,
    eligibility_score: Math.min(100, score),
    reasons,
    missing_requirements: missing.length > 0 ? missing : undefined
  };
}

/**
 * Check eligibility for all schemes
 */
export function checkEligibilityForAllSchemes(
  farmer: FarmerLandRecord,
  language: LanguageCode = "en"
): SchemeEligibilityResponse {
  const eligible_schemes: EligibilityResult[] = [];

  for (const scheme of MOCK_SCHEMES) {
    if (!scheme.is_active) continue;
    
    const result = checkSchemeEligibility(farmer, scheme);
    if (result.is_eligible) {
      eligible_schemes.push(result);
    }
  }

  // Sort by eligibility score (highest first)
  eligible_schemes.sort((a, b) => b.eligibility_score - a.eligibility_score);

  // Build application guidance
  const application_guidance: { [scheme_code: string]: ApplicationStep[] } = {};
  for (const result of eligible_schemes) {
    const guidance = APPLICATION_GUIDANCE[result.scheme.scheme_code];
    if (guidance) {
      application_guidance[result.scheme.scheme_code] = guidance(language);
    }
  }

  return {
    farmer_profile: farmer,
    eligible_schemes,
    application_guidance
  };
}

/**
 * Get mock farmer profile (for demo purposes)
 * In production, this would fetch from database
 */
export function getMockFarmerProfile(phone_number: string): FarmerLandRecord | null {
  // Mock profiles for demo
  const mockProfiles: Record<string, FarmerLandRecord> = {
    "+919876543210": {
      phone_number: "+919876543210",
      name: "राम पाटील",
      age: 45,
      state: "Maharashtra",
      district: "Pune",
      land_ownership: true,
      land_size_hectares: 2.5,
      land_type: "irrigated",
      crops_grown: ["onion", "tomato", "wheat"],
      is_registered_farmer: true,
      is_government_employee: false,
      is_tax_payer: false,
      bank_account: true,
      aadhaar_linked: true
    },
    "+919876543211": {
      phone_number: "+919876543211",
      name: "श्याम सिंह",
      age: 35,
      state: "Uttar Pradesh",
      district: "Lucknow",
      land_ownership: true,
      land_size_hectares: 1.2,
      land_type: "rainfed",
      crops_grown: ["wheat", "rice"],
      is_registered_farmer: false,
      is_government_employee: false,
      is_tax_payer: false,
      bank_account: true,
      aadhaar_linked: false
    },
    "+919876543212": {
      phone_number: "+919876543212",
      name: "कृष्ण रेड्डी",
      age: 50,
      state: "Telangana",
      district: "Hyderabad",
      land_ownership: true,
      land_size_hectares: 5.0,
      land_type: "irrigated",
      crops_grown: ["cotton", "rice", "sugarcane"],
      is_registered_farmer: true,
      is_government_employee: false,
      is_tax_payer: false,
      bank_account: true,
      aadhaar_linked: true
    }
  };

  return mockProfiles[phone_number] || null;
}
