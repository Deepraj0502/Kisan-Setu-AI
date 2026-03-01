"use client";

import { useState } from "react";

type LanguageCode = "mr" | "hi" | "en";

interface FarmerLandRecord {
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

interface EligibilityResult {
  scheme: {
    scheme_code: string;
    name_english: string;
    name_marathi?: string;
    name_hindi?: string;
    description_english?: string;
    description_marathi?: string;
    description_hindi?: string;
    benefits_summary?: string;
  };
  is_eligible: boolean;
  eligibility_score: number;
  reasons: string[];
  missing_requirements?: string[];
}

interface ApplicationStep {
  step_number: number;
  title: string;
  description: string;
  documents_required?: string[];
  action_url?: string;
  estimated_time?: string;
}

interface SarkariMitraResponse {
  farmer_profile: FarmerLandRecord;
  eligible_schemes: EligibilityResult[];
  application_guidance: {
    [scheme_code: string]: ApplicationStep[];
  };
  metadata: {
    language: string;
    checked_at: string;
    total_schemes_checked: number;
  };
}

interface SarkariMitraProps {
  language: LanguageCode;
}

export default function SarkariMitra({ language }: SarkariMitraProps) {
  const [phoneNumber, setPhoneNumber] = useState("+919876543210");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SarkariMitraResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedScheme, setExpandedScheme] = useState<string | null>(null);

  const checkEligibility = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("http://localhost:4000/agent/sarkari-mitra", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to check eligibility");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getSchemeName = (scheme: EligibilityResult["scheme"]) => {
    if (language === "mr" && scheme.name_marathi) return scheme.name_marathi;
    if (language === "hi" && scheme.name_hindi) return scheme.name_hindi;
    return scheme.name_english;
  };

  const getDescription = (scheme: EligibilityResult["scheme"]) => {
    if (language === "mr" && scheme.description_marathi) return scheme.description_marathi;
    if (language === "hi" && scheme.description_hindi) return scheme.description_hindi;
    return scheme.description_english || "";
  };

  const getLabels = () => {
    if (language === "mr") {
      return {
        title: "सरकारी-मित्र: योजना पात्रता तपास",
        subtitle: "तुमच्या जमीन माहितीवर आधारित योग्य योजना शोधा",
        phoneLabel: "फोन नंबर",
        checkButton: "पात्रता तपासा",
        eligibleSchemes: "पात्र योजना",
        noEligible: "तुम्ही कोणत्याही योजनेसाठी पात्र नाही",
        eligibilityScore: "पात्रता गुण",
        reasons: "कारणे",
        missing: "गहाळ आवश्यकता",
        benefits: "लाभ",
        applicationSteps: "अर्ज प्रक्रिया",
        step: "चरण",
        documents: "आवश्यक दस्तऐवज",
        estimatedTime: "अंदाजित वेळ",
        viewDetails: "तपशील पहा",
        hideDetails: "तपशील लपवा",
        applyNow: "आता अर्ज करा",
      };
    } else if (language === "hi") {
      return {
        title: "सरकारी-मित्र: योजना पात्रता जांच",
        subtitle: "अपनी जमीन की जानकारी के आधार पर उपयुक्त योजना खोजें",
        phoneLabel: "फोन नंबर",
        checkButton: "पात्रता जांचें",
        eligibleSchemes: "पात्र योजनाएं",
        noEligible: "आप किसी भी योजना के लिए पात्र नहीं हैं",
        eligibilityScore: "पात्रता स्कोर",
        reasons: "कारण",
        missing: "गायब आवश्यकताएं",
        benefits: "लाभ",
        applicationSteps: "आवेदन प्रक्रिया",
        step: "चरण",
        documents: "आवश्यक दस्तावेज",
        estimatedTime: "अनुमानित समय",
        viewDetails: "विवरण देखें",
        hideDetails: "विवरण छुपाएं",
        applyNow: "अभी आवेदन करें",
      };
    } else {
      return {
        title: "Sarkari-Mitra: Scheme Eligibility Check",
        subtitle: "Find suitable schemes based on your land records",
        phoneLabel: "Phone Number",
        checkButton: "Check Eligibility",
        eligibleSchemes: "Eligible Schemes",
        noEligible: "You are not eligible for any schemes",
        eligibilityScore: "Eligibility Score",
        reasons: "Reasons",
        missing: "Missing Requirements",
        benefits: "Benefits",
        applicationSteps: "Application Process",
        step: "Step",
        documents: "Required Documents",
        estimatedTime: "Estimated Time",
        viewDetails: "View Details",
        hideDetails: "Hide Details",
        applyNow: "Apply Now",
      };
    }
  };

  const labels = getLabels();

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2">{labels.title}</h2>
        <p className="text-green-50">{labels.subtitle}</p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {labels.phoneLabel}
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+919876543210"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={checkEligibility}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? "..." : labels.checkButton}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              {result.eligible_schemes.length > 0
                ? `${labels.eligibleSchemes}: ${result.eligible_schemes.length}`
                : labels.noEligible}
            </p>
          </div>

          {result.eligible_schemes.length > 0 && (
            <div className="space-y-4">
              {result.eligible_schemes.map((eligibility, index) => {
                const schemeCode = eligibility.scheme.scheme_code;
                const isExpanded = expandedScheme === schemeCode;
                const steps = result.application_guidance[schemeCode] || [];

                return (
                  <div
                    key={schemeCode}
                    className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-green-500"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {getSchemeName(eligibility.scheme)}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3">
                            {getDescription(eligibility.scheme)}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                              {labels.eligibilityScore}: {eligibility.eligibility_score}%
                            </span>
                            {eligibility.scheme.benefits_summary && (
                              <span className="text-gray-600">
                                💰 {eligibility.scheme.benefits_summary}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reasons */}
                      {eligibility.reasons.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            ✅ {labels.reasons}:
                          </h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {eligibility.reasons.map((reason, idx) => (
                              <li key={idx}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Missing Requirements */}
                      {eligibility.missing_requirements &&
                        eligibility.missing_requirements.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-red-700 mb-2">
                              ⚠️ {labels.missing}:
                            </h4>
                            <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                              {eligibility.missing_requirements.map((missing, idx) => (
                                <li key={idx}>{missing}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {/* Application Steps Toggle */}
                      {steps.length > 0 && (
                        <div className="mt-4">
                          <button
                            onClick={() =>
                              setExpandedScheme(isExpanded ? null : schemeCode)
                            }
                            className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-2"
                          >
                            {isExpanded ? (
                              <>
                                <span>▼</span> {labels.hideDetails}
                              </>
                            ) : (
                              <>
                                <span>▶</span> {labels.viewDetails} ({steps.length}{" "}
                                {labels.step.toLowerCase()}s)
                              </>
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-4 space-y-4 border-t pt-4">
                              <h4 className="font-semibold text-gray-900 mb-3">
                                📋 {labels.applicationSteps}:
                              </h4>
                              {steps.map((step) => (
                                <div
                                  key={step.step_number}
                                  className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-500"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                      {step.step_number}
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-semibold text-gray-900 mb-1">
                                        {step.title}
                                      </h5>
                                      <p className="text-sm text-gray-600 mb-2">
                                        {step.description}
                                      </p>
                                      {step.documents_required &&
                                        step.documents_required.length > 0 && (
                                          <div className="mb-2">
                                            <span className="text-xs font-semibold text-gray-700">
                                              📄 {labels.documents}:
                                            </span>
                                            <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                                              {step.documents_required.map((doc, idx) => (
                                                <li key={idx}>{doc}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      {step.estimated_time && (
                                        <p className="text-xs text-gray-500">
                                          ⏱️ {labels.estimatedTime}: {step.estimated_time}
                                        </p>
                                      )}
                                      {step.action_url && (
                                        <a
                                          href={step.action_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-block mt-2 px-4 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                        >
                                          {labels.applyNow} →
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
