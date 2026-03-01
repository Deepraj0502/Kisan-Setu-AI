"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { SoilCardSample } from "./SoilCardSample";

type Sender = "farmer" | "agent";

interface SoilCardData {
  farmerName: string;
  village: string;
  sampleId: string;
  date: string;
  ph: number;
  oc: number;
  n: number;
  p: number;
  k: number;
  phStatus: "low" | "good" | "high";
  pStatus: "low" | "good";
  advisory: string;
}

interface ChatMessage {
  id: number;
  sender: Sender;
  text: string;
  kind: "text" | "voice" | "image";
  showSoilCard?: boolean; // If true, render SoilCardSample component
  soilCardData?: SoilCardData; // Random soil card data
}

interface SarkariMitraScheme {
  scheme: {
    scheme_code: string;
    name_english: string;
    name_marathi?: string;
    name_hindi?: string;
    benefits_summary?: string;
  };
  eligibility_score: number;
  reasons: string[];
  missing_requirements?: string[];
}

interface SarkariMitraResponse {
  eligible_schemes: SarkariMitraScheme[];
  application_guidance: {
    [scheme_code: string]: {
      step_number: number;
      title: string;
      description: string;
    }[];
  };
}

interface DemoStep {
  delay: number; // milliseconds before this step
  sender: Sender;
  text: string;
  kind: "text" | "voice" | "image";
  shouldCallAPI?: boolean; // If true, calls backend API
  action?: "sarkari-mitra";
}

export interface WhatsAppSimulatorProps {
  /** "embedded" = card in console; "fullscreen" = full-screen Web/Mobile layout */
  variant?: "embedded" | "fullscreen";
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export function WhatsAppSimulator({ variant = "embedded" }: WhatsAppSimulatorProps) {
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<"mr" | "hi" | "en">("mr");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: "farmer",
      kind: "text",
      text: "नमस्कार, माझ्या कांद्याच्या पिकावर रोग दिसतोय.",
    },
    {
      id: 2,
      sender: "agent",
      kind: "text",
      text: "नमस्कार 👋, मी Kisan Setu AI आहे. फोटो / आवाज पाठवल्यास मी अधिक चांगला सल्ला देऊ शकतो.",
    },
  ]);
  const [sending, setSending] = useState(false);
  const [checkingSchemes, setCheckingSchemes] = useState(false);
  const [showSarkariForm, setShowSarkariForm] = useState(false);
  const [sarkariState, setSarkariState] = useState("MH");
  const [sarkariLandSize, setSarkariLandSize] = useState<"small" | "medium" | "large">("small");
  const [sarkariLandType, setSarkariLandType] = useState<"irrigated" | "rainfed" | "both">("irrigated");
  const [sarkariRegistered, setSarkariRegistered] = useState<"yes" | "no">("yes");
  const [sarkariBank, setSarkariBank] = useState<"yes" | "no">("yes");
  const [sarkariAadhaar, setSarkariAadhaar] = useState<"yes" | "no">("yes");
  const [nextId, setNextId] = useState(3);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [canUseSpeech, setCanUseSpeech] = useState(false);
  const demoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const pathname = usePathname();

  function addMessage(partial: Omit<ChatMessage, "id">) {
    setMessages((prev) => [...prev, { id: nextId, ...partial }]);
    setNextId((id) => id + 1);
  }

  async function handleSarkariMitra() {
    // First open mini profile form instead of calling directly
    setShowSarkariForm((prev) => !prev);
  }

  async function submitSarkariMitra() {
    setShowSarkariForm(false);

    // Map land size bucket to approximate hectares
    const landSizeHectares =
      sarkariLandSize === "small" ? 0.5 : sarkariLandSize === "medium" ? 2 : 5;

    // Simulate farmer asking about schemes (with their profile)
    const farmerText =
      language === "mr"
        ? `🏛️ माझ्यासाठी कोणत्या सरकारी योजना लागू होतील? (राज्य: ${sarkariState}, जमीन: ${landSizeHectares} ha)`
        : language === "hi"
          ? `🏛️ मेरे लिए कौन-कौन सी सरकारी योजनाएं लागू होंगी? (राज्य: ${sarkariState}, जमीन: ${landSizeHectares} ha)`
          : `🏛️ Which government schemes am I eligible for? (State: ${sarkariState}, land: ${landSizeHectares} ha)`;

    addMessage({ sender: "farmer", text: farmerText, kind: "text" });
    setCheckingSchemes(true);

    try {
      const res = await fetch(`${API_BASE_URL}/agent/sarkari-mitra`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmer_profile: {
            phone_number: "+910000000000",
            state: sarkariState,
            district: "",
            land_ownership: true,
            land_size_hectares: landSizeHectares,
            land_type: sarkariLandType,
            is_registered_farmer: sarkariRegistered === "yes",
            bank_account: sarkariBank === "yes",
            aadhaar_linked: sarkariAadhaar === "yes",
          },
          language,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as SarkariMitraResponse;
      const schemes = data.eligible_schemes || [];

      if (schemes.length === 0) {
        const noText =
          language === "mr"
            ? "सध्या तुमच्यासाठी कोणतीही योजना पात्र दिसत नाही. कृपया स्थानिक कृषी अधिकारीशी संपर्क करा."
            : language === "hi"
              ? "अभी आपके लिए कोई योजना पात्र नहीं दिख रही है। कृपया नज़दीकी कृषि अधिकारी से संपर्क करें।"
              : "Currently no schemes appear eligible for your profile. Please contact your local agriculture officer.";

        addMessage({
          sender: "agent",
          text: noText,
          kind: "text",
        });
        return;
      }

      const headerText =
        language === "mr"
          ? "🏛️ सरकारी-मित्रने तुमच्यासाठी काही योजना निवडल्या आहेत:"
          : language === "hi"
            ? "🏛️ सरकारी-मित्र ने आपके लिए कुछ योजनाएं चुनी हैं:"
            : "🏛️ Sarkari-Mitra has found some schemes for you:";

      const lines: string[] = [headerText, ""];

      schemes.slice(0, 3).forEach((item, idx) => {
        const s = item.scheme;
        const name =
          language === "mr"
            ? s.name_marathi || s.name_english
            : language === "hi"
              ? s.name_hindi || s.name_english
              : s.name_english;

        lines.push(
          `${idx + 1}) ${name} (${s.scheme_code}) — ${item.eligibility_score}%`
        );

        if (s.benefits_summary) {
          lines.push(
            language === "mr"
              ? `   लाभ: ${s.benefits_summary}`
              : language === "hi"
                ? `   लाभ: ${s.benefits_summary}`
                : `   Benefits: ${s.benefits_summary}`
          );
        }

        if (item.reasons && item.reasons.length > 0) {
          const reasonsText = item.reasons.slice(0, 2).join("; ");
          lines.push(
            language === "mr"
              ? `   कारणे: ${reasonsText}`
              : language === "hi"
                ? `   कारण: ${reasonsText}`
                : `   Why: ${reasonsText}`
          );
        }

        const steps = data.application_guidance?.[s.scheme_code];
        if (steps && steps.length > 0) {
          const firstStep = steps[0];
          lines.push(
            language === "mr"
              ? `   पुढील पाऊल: ${firstStep.title}`
              : language === "hi"
                ? `   अगला कदम: ${firstStep.title}`
                : `   Next step: ${firstStep.title}`
          );
        }

        lines.push("");
      });

      const footer =
        language === "mr"
          ? "ℹ️ अधिकृत माहिती व अर्जासाठी नेहमी सरकारी पोर्टलचा वापर करा."
          : language === "hi"
            ? "ℹ️ आधिकारिक जानकारी और आवेदन के लिए हमेशा सरकारी पोर्टल का उपयोग करें।"
            : "ℹ️ For official details and application, always use the government portal.";

      lines.push(footer);

      addMessage({
        sender: "agent",
        text: lines.join("\n"),
        kind: "text",
      });
    } catch (error) {
      console.error(error);
      const errText =
        language === "mr"
          ? "सध्या योजना तपासणी सेवा उपलब्ध नाही. कृपया नंतर पुन्हा प्रयत्न करा."
          : language === "hi"
            ? "अभी योजना जांच सेवा उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।"
            : "Scheme eligibility service is not available right now. Please try again later.";

      addMessage({
        sender: "agent",
        text: errText,
        kind: "text",
      });
    } finally {
      setCheckingSchemes(false);
    }
  }

  // Auto Sarkari-Mitra run for demo (uses a fixed but realistic profile)
  async function runSarkariMitraDemo() {
    if (checkingSchemes) return;

    const landSizeHectares = 2; // medium farmer
    const demoState = "MH";

    const farmerText =
      language === "mr"
        ? `🏛️ माझ्यासाठी कोणत्या सरकारी योजना लागू होतील? (राज्य: ${demoState}, जमीन: ${landSizeHectares} ha)`
        : language === "hi"
          ? `🏛️ मेरे लिए कौन-कौन सी सरकारी योजनाएं लागू होंगी? (राज्य: ${demoState}, जमीन: ${landSizeHectares} ha)`
          : `🏛️ Which government schemes am I eligible for? (State: ${demoState}, land: ${landSizeHectares} ha)`;

    addMessage({ sender: "farmer", text: farmerText, kind: "text" });
    setCheckingSchemes(true);

    try {
      const res = await fetch("http://localhost:4000/agent/sarkari-mitra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmer_profile: {
            phone_number: "+910000000001",
            state: demoState,
            district: "Pune",
            land_ownership: true,
            land_size_hectares: landSizeHectares,
            land_type: "irrigated",
            is_registered_farmer: true,
            bank_account: true,
            aadhaar_linked: true,
          },
          language,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as SarkariMitraResponse;
      const schemes = data.eligible_schemes || [];

      if (schemes.length === 0) {
        const noText =
          language === "mr"
            ? "सध्या तुमच्यासाठी कोणतीही योजना पात्र दिसत नाही. कृपया स्थानिक कृषी अधिकारीशी संपर्क करा."
            : language === "hi"
              ? "अभी आपके लिए कोई योजना पात्र नहीं दिख रही है। कृपया नज़दीकी कृषि अधिकारी से संपर्क करें।"
              : "Currently no schemes appear eligible for your profile. Please contact your local agriculture officer.";

        addMessage({
          sender: "agent",
          text: noText,
          kind: "text",
        });
        return;
      }

      const headerText =
        language === "mr"
          ? "🏛️ सरकारी-मित्रने तुमच्यासाठी काही योजना निवडल्या आहेत:"
          : language === "hi"
            ? "🏛️ सरकारी-मित्र ने आपके लिए कुछ योजनाएं चुनी हैं:"
            : "🏛️ Sarkari-Mitra has found some schemes for you:";

      const lines: string[] = [headerText, ""];

      schemes.slice(0, 3).forEach((item, idx) => {
        const s = item.scheme;
        const name =
          language === "mr"
            ? s.name_marathi || s.name_english
            : language === "hi"
              ? s.name_hindi || s.name_english
              : s.name_english;

        lines.push(
          `${idx + 1}) ${name} (${s.scheme_code}) — ${item.eligibility_score}%`
        );

        if (s.benefits_summary) {
          lines.push(
            language === "mr"
              ? `   लाभ: ${s.benefits_summary}`
              : language === "hi"
                ? `   लाभ: ${s.benefits_summary}`
                : `   Benefits: ${s.benefits_summary}`
          );
        }

        if (item.reasons && item.reasons.length > 0) {
          const reasonsText = item.reasons.slice(0, 2).join("; ");
          lines.push(
            language === "mr"
              ? `   कारणे: ${reasonsText}`
              : language === "hi"
                ? `   कारण: ${reasonsText}`
                : `   Why: ${reasonsText}`
          );
        }

        const steps = data.application_guidance?.[s.scheme_code];
        if (steps && steps.length > 0) {
          const firstStep = steps[0];
          lines.push(
            language === "mr"
              ? `   पुढील पाऊल: ${firstStep.title}`
              : language === "hi"
                ? `   अगला कदम: ${firstStep.title}`
                : `   Next step: ${firstStep.title}`
          );
        }

        lines.push("");
      });

      const footer =
        language === "mr"
          ? "ℹ️ अधिकृत माहिती व अर्जासाठी नेहमी सरकारी पोर्टलचा वापर करा."
          : language === "hi"
            ? "ℹ️ आधिकारिक जानकारी और आवेदन के लिए हमेशा सरकारी पोर्टल का उपयोग करें।"
            : "ℹ️ For official details and application, always use the government portal.";

      lines.push(footer);

      addMessage({
        sender: "agent",
        text: lines.join("\n"),
        kind: "text",
      });
    } catch (error) {
      console.error(error);
      const errText =
        language === "mr"
          ? "सध्या योजना तपासणी सेवा उपलब्ध नाही. कृपया नंतर पुन्हा प्रयत्न करा."
          : language === "hi"
            ? "अभी योजना जांच सेवा उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।"
            : "Scheme eligibility service is not available right now. Please try again later.";

      addMessage({
        sender: "agent",
        text: errText,
        kind: "text",
      });
    } finally {
      setCheckingSchemes(false);
    }
  }

  async function sendToAgent(text: string, kind: ChatMessage["kind"]) {
    addMessage({ sender: "farmer", text, kind });
    setSending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/agent/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, language }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as { answer?: string };
      addMessage({
        sender: "agent",
        text: data.answer || "Agent reply unavailable.",
        kind: "text",
      });
    } catch (error) {
      console.error(error);
      addMessage({
        sender: "agent",
        text: "Backend not reachable. Try again later.",
        kind: "text",
      });
    } finally {
      setSending(false);
    }
  }

  function handleSendText() {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    void sendToAgent(text, "text");
  }

  function handleRealVoice() {
    if (isDemoRunning) return;

    // If browser doesn't support speech recognition, show an informative message
    if (!canUseSpeech || !recognitionRef.current) {
      const infoText =
        language === "mr"
          ? "तुमच्या ब्राउझरमध्ये थेट व्हॉइस ओळख (speech recognition) उपलब्ध नाही. कृपया टायपिंग वापरा किंवा डेस्कटॉप Chrome सारखा ब्राउझर वापरा."
          : language === "hi"
            ? "आपके ब्राउज़र में सीधा वॉइस रिकग्निशन (speech recognition) उपलब्ध नहीं है। कृपया टाइप करें या डेस्कटॉप Chrome जैसा ब्राउज़र इस्तेमाल करें।"
            : "Your browser does not support direct speech recognition. Please type your question or use a desktop Chrome-like browser.";

      addMessage({
        sender: "agent",
        text: infoText,
        kind: "text",
      });
      return;
    }

    try {
      setIsRecording(true);
      // Ensure language stays in sync
      recognitionRef.current.lang =
        language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-IN";
      recognitionRef.current.start();
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setIsRecording(false);
      const errText =
        language === "mr"
          ? "मायक्रोफोन सुरू करण्यात समस्या आली. कृपया ब्राउझरची परवानगी तपासा किंवा नंतर पुन्हा प्रयत्न करा."
          : language === "hi"
            ? "माइक्रोफोन शुरू करने में समस्या आई। कृपया ब्राउज़र की परमिशन जांचें या बाद में पुनः प्रयास करें।"
            : "There was a problem starting the microphone. Please check browser permissions or try again later.";
      addMessage({
        sender: "agent",
        text: errText,
        kind: "text",
      });
    }
  }

  function handleMockVoice() {
    // Multiple voice message variations
    const voiceMessages = {
      mr: [
        "🎙️ [Voice] हवामानामुळे माझ्या सोयाबीन पिकाची पानं पिवळी पडत आहेत.",
        "🎙️ [Voice] माझ्या टोमॅटो पिकावर काळे डाग दिसत आहेत, काय करावे?",
        "🎙️ [Voice] माझ्या गहू पिकावर रस्ट रोग दिसतो, लगेच सल्ला हवा.",
        "🎙️ [Voice] माझ्या कांद्याच्या पिकावर बुरशी आली आहे, आता काय करावे?",
        "🎙️ [Voice] पावसाची कमतरता आहे, सिंचन कधी करावे?",
        "🎙️ [Voice] माझ्या पिकावर माहू (aphids) दिसत आहेत, कसे नियंत्रित करावे?"
      ],
      hi: [
        "🎙️ [Voice] मौसम की वजह से मेरी सोयाबीन की पत्तियां पीली हो रही हैं.",
        "🎙️ [Voice] मेरे टमाटर की फसल में काले धब्बे दिख रहे हैं, क्या करूं?",
        "🎙️ [Voice] मेरी गेहूं की फसल में रस्ट रोग लग गया है, तुरंत सलाह चाहिए.",
        "🎙️ [Voice] मेरी प्याज की फसल में फफूंदी लग गई है, अब क्या करूं?",
        "🎙️ [Voice] बारिश की कमी है, सिंचाई कब करें?",
        "🎙️ [Voice] मेरी फसल में माहू (aphids) दिख रहे हैं, कैसे नियंत्रित करें?"
      ],
      en: [
        "🎙️ [Voice] Due to weather, my soybean leaves are turning yellow.",
        "🎙️ [Voice] My tomato crop has black spots, what should I do?",
        "🎙️ [Voice] My wheat crop has rust disease, need immediate advice.",
        "🎙️ [Voice] My onion crop has fungal disease, what should I do now?",
        "🎙️ [Voice] There's less rainfall, when should I irrigate?",
        "🎙️ [Voice] I see aphids on my crop, how to control them?"
      ]
    };

    const messages = voiceMessages[language];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    void sendToAgent(randomMessage, "voice");
  }

  function handleMockImage() {
    // Generate random soil card data
    const soilCardData = generateRandomSoilCard();

    // Add message showing the soil card component with random data
    addMessage({
      sender: "farmer",
      text:
        language === "mr"
          ? "🖼️ मृदा आरोग्य कार्ड"
          : language === "hi"
            ? "🖼️ मिट्टी स्वास्थ्य कार्ड"
            : "🖼️ Soil Health Card",
      kind: "image",
      showSoilCard: true,
      soilCardData: soilCardData
    });

    // Then send to agent for analysis
    const text =
      language === "mr"
        ? "मृदा आरोग्य कार्डाचा फोटो पाठवला आहे. कृपया सल्ला द्या."
        : language === "hi"
          ? "मिट्टी स्वास्थ्य कार्ड की फोटो भेजी है. कृपया सलाह दें।"
          : "Sent a photo of the Soil Health Card. Please provide advice.";

    // Wait a bit before sending to agent (to show the card first)
    setTimeout(() => {
      void sendToAgent(text, "text");
    }, 500);
  }

  function generateRandomSoilCard(): SoilCardData {
    // Multiple farmer names
    const farmers = [
      { name: "Shri Ram Patil", village: "Nashik (Rural)" },
      { name: "Shri Suresh Deshmukh", village: "Pune (Rural)" },
      { name: "Shri Prakash Jadhav", village: "Aurangabad (Rural)" },
      { name: "Shri Vijay More", village: "Kolhapur (Rural)" },
      { name: "Shri Ashok Gaikwad", village: "Sangli (Rural)" }
    ];

    // Multiple soil test scenarios
    const scenarios: Array<{
      ph: number;
      oc: number;
      n: number;
      p: number;
      k: number;
      phStatus: "low" | "good" | "high";
      pStatus: "low" | "good";
      advisory: string;
    }> = [
        {
          ph: 5.8,
          oc: 0.85,
          n: 280,
          p: 9,
          k: 210,
          phStatus: "low" as const,
          pStatus: "low" as const,
          advisory: "pH कमी, P कमी - चुना आणि P खतांची गरज"
        },
        {
          ph: 7.2,
          oc: 0.65,
          n: 220,
          p: 18,
          k: 180,
          phStatus: "good" as const,
          pStatus: "good" as const,
          advisory: "pH आदर्श, P चांगले - संतुलित खत वापरा"
        },
        {
          ph: 6.1,
          oc: 0.72,
          n: 195,
          p: 12,
          k: 165,
          phStatus: "low" as const,
          pStatus: "low" as const,
          advisory: "pH थोडा कमी, N आणि P कमी - चुना + NPK खत"
        },
        {
          ph: 7.8,
          oc: 0.58,
          n: 250,
          p: 22,
          k: 195,
          phStatus: "high" as const,
          pStatus: "good" as const,
          advisory: "pH जास्त, Gypsum वापरा, N खत कमी करा"
        },
        {
          ph: 6.5,
          oc: 0.95,
          n: 310,
          p: 15,
          k: 240,
          phStatus: "good" as const,
          pStatus: "low" as const,
          advisory: "pH आदर्श, OC चांगले, P कमी - फॉस्फरस खत"
        }
      ];

    const farmer = farmers[Math.floor(Math.random() * farmers.length)];
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const sampleId = `MH-${["NSK", "PUN", "AUR", "KOL", "SNG"][Math.floor(Math.random() * 5)]}-2026-${String(Math.floor(Math.random() * 9999) + 1000).padStart(4, "0")}`;
    const date = new Date(2026, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

    return {
      farmerName: farmer.name,
      village: farmer.village,
      sampleId,
      date: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      ph: scenario.ph,
      oc: scenario.oc,
      n: scenario.n,
      p: scenario.p,
      k: scenario.k,
      phStatus: scenario.phStatus,
      pStatus: scenario.pStatus,
      advisory: scenario.advisory
    };
  }

  function getRandomAlertMessage(): string {
    const alerts = {
      mr: [
        "🔔 अलर्ट: पुढील 3 दिवसांत तुमच्या भागात जोरदार पावसाची शक्यता आहे. रोगाचा धोका कमी करण्यासाठी आज फवारणी टाळा.",
        "🔔 अलर्ट: आज पुणे APMC मध्ये कांद्याचा दर मागील आठवड्यापेक्षा ~15% जास्त आहे. काही माल विक्रीचा विचार करा.",
        "🔔 अलर्ट: उपग्रह डेटा नुसार तुमच्या भागात कमी माती आर्द्रता दिसते. सिंचनाची वेळ समायोजित करा.",
        "🔔 अलर्ट: शेजारच्या भागात अळीचा प्रादुर्भाव नोंदवला आहे. तुमच्या शेतात नियमित निरीक्षण करा."
      ],
      hi: [
        "🔔 अलर्ट: अगले 3 दिनों में आपके क्षेत्र में तेज बारिश की संभावना है. रोग के खतरे को कम करने के लिए आज स्प्रे टालें.",
        "🔔 अलर्ट: आज पुणे APMC में प्याज का भाव पिछले हफ्ते से ~15% ज़्यादा है. थोड़ा माल बेचने पर विचार करें.",
        "🔔 अलर्ट: सैटेलाइट डेटा के अनुसार आपके क्षेत्र में मिट्टी की नमी कम दिख रही है. सिंचाई का समय समायोजित करें.",
        "🔔 अलर्ट: नज़दीकी क्षेत्र में कीट प्रकोप दर्ज हुआ है. अपने खेत में नियमित निगरानी रखें."
      ],
      en: [
        "🔔 Alert: Heavy rainfall is expected in your region over the next 3 days. Avoid spraying fungicides today to reduce disease risk.",
        "🔔 Alert: Onion prices at Pune APMC are ~15% higher than last week. Consider selling part of your stock.",
        "🔔 Alert: Satellite data indicates low soil moisture in your area. Adjust your irrigation schedule.",
        "🔔 Alert: Pest outbreak reported in nearby blocks. Inspect your field regularly for early symptoms."
      ]
    };

    const key = language === "mr" ? "mr" : language === "hi" ? "hi" : "en";
    const options = alerts[key];
    return options[Math.floor(Math.random() * options.length)];
  }

  // Multiple demo script variations - randomly selected
  function getDemoScripts(): DemoStep[][] {
    if (language === "mr") {
      return [
        // Demo 1: Disease → Soil Card → Subsidy → Sarkari-Mitra
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] माझ्या कांद्याच्या पिकावर बुरशी आली आहे. काय करावे?",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ मृदा आरोग्य कार्ड",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "सब्सिडी योजना काय आहेत?",
            kind: "text",
            shouldCallAPI: true,
          },
          {
            delay: 2500,
            sender: "farmer",
            text: "🏛️ Sarkari-Mitra – माझ्यासाठी कोणत्या योजना आहेत?",
            kind: "text",
            action: "sarkari-mitra",
          },
          {
            delay: 3000,
            sender: "farmer",
            text: "सध्या कांद्याचा मंडी भाव काय आहे?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
        // Demo 2: Pest → Soil Card → Fertilizer
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] माझ्या पिकावर माहू (aphids) दिसत आहेत, कसे नियंत्रित करावे?",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ मृदा आरोग्य कार्ड",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "खत कधी आणि कसे द्यावे?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
        // Demo 3: Weather → Soil Card → Irrigation
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] पावसाची कमतरता आहे, सिंचन कधी करावे?",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ मृदा आरोग्य कार्ड",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "सिंचनाची वेळ आणि पद्धत काय आहे?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
        // Demo 4: Tomato Disease → Soil Card → Crop Rotation
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] माझ्या टोमॅटो पिकावर काळे डाग दिसत आहेत, काय करावे?",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ मृदा आरोग्य कार्ड",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "पीक फेरपालट काय आहे आणि कसे करावे?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
        // Demo 5: Wheat Rust → Soil Card → Seed Selection
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] माझ्या गहू पिकावर रस्ट रोग दिसतो, लगेच सल्ला हवा.",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ मृदा आरोग्य कार्ड",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "चांगले बीज कसे निवडावे?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
        // Demo 6: Soybean → Soil Card → Mandi Prices
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] हवामानामुळे माझ्या सोयाबीन पिकाची पानं पिवळी पडत आहेत.",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ मृदा आरोग्य कार्ड",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "मंडी किंमत कशी मिळवायची?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
      ];
    } else if (language === "hi") {
      return [
        // Demo 1: Disease → Soil Card → Subsidy → Sarkari-Mitra
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] मेरी सोयाबीन की फसल में रोग लग गया है. क्या करूं?",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ मिट्टी स्वास्थ्य कार्ड",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "सब्सिडी योजनाएं क्या हैं?",
            kind: "text",
            shouldCallAPI: true,
          },
          {
            delay: 2500,
            sender: "farmer",
            text: "🏛️ Sarkari-Mitra – मेरे लिए कौन-कौन सी योजनाएं हैं?",
            kind: "text",
            action: "sarkari-mitra",
          },
          {
            delay: 3000,
            sender: "farmer",
            text: "अभी प्याज का मंडी भाव क्या चल रहा है?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
        // Demo 2: Pest → Soil Card → Fertilizer
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] मेरी फसल में माहू (aphids) दिख रहे हैं, कैसे नियंत्रित करें?",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ मिट्टी स्वास्थ्य कार्ड",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "खाद कब और कैसे दें?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
        // Demo 3: Weather → Soil Card → Irrigation
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] बारिश की कमी है, सिंचाई कब करें?",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ मिट्टी स्वास्थ्य कार्ड",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "सिंचाई का समय और तरीका क्या है?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
        // Demo 4: Tomato Disease → Soil Card → Crop Rotation
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] मेरे टमाटर की फसल में काले धब्बे दिख रहे हैं, क्या करूं?",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ मिट्टी स्वास्थ्य कार्ड",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "फसल चक्र क्या है और कैसे करें?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
        // Demo 5: Wheat Rust → Soil Card → Seed Selection
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] मेरी गेहूं की फसल में रस्ट रोग लग गया है, तुरंत सलाह चाहिए.",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ मिट्टी स्वास्थ्य कार्ड",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "अच्छे बीज कैसे चुनें?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
        // Demo 6: Onion → Soil Card → Mandi Prices
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] मेरी प्याज की फसल में फफूंदी लग गई है, अब क्या करूं?",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ मिट्टी स्वास्थ्य कार्ड",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "मंडी भाव कैसे पता करें?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
      ];
    } else {
      return [
        // Demo 1: Disease → Soil Card → Subsidy → Sarkari-Mitra
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] My onion crop has a fungal disease. What should I do?",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ Soil Health Card",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "What subsidy schemes are available?",
            kind: "text",
            shouldCallAPI: true,
          },
          {
            delay: 2500,
            sender: "farmer",
            text: "🏛️ Sarkari-Mitra – which schemes am I eligible for?",
            kind: "text",
            action: "sarkari-mitra",
          },
          {
            delay: 3000,
            sender: "farmer",
            text: "What is the current market rate for onions in my mandi?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
        // Demo 2: Pest → Soil Card → Fertilizer
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] I see aphids on my crop, how to control them?",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ Soil Health Card",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "When and how to apply fertilizers?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
        // Demo 3: Weather → Soil Card → Irrigation
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] There's less rainfall, when should I irrigate?",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ Soil Health Card",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "What is the right time and method for irrigation?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
        // Demo 4: Tomato Disease → Soil Card → Crop Rotation
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] My tomato crop has black spots, what should I do?",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ Soil Health Card",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "What is crop rotation and how to do it?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
        // Demo 5: Wheat Rust → Soil Card → Seed Selection
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] My wheat crop has rust disease, need immediate advice.",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ Soil Health Card",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "How to select good seeds?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
        // Demo 6: Soybean → Soil Card → Mandi Prices
        [
          {
            delay: 500,
            sender: "farmer",
            text: "🎙️ [Voice] Due to weather, my soybean leaves are turning yellow.",
            kind: "voice",
            shouldCallAPI: true,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "🖼️ Soil Health Card",
            kind: "image",
            shouldCallAPI: false,
          },
          {
            delay: 2000,
            sender: "farmer",
            text: "How to check mandi prices?",
            kind: "text",
            shouldCallAPI: true,
          },
        ],
      ];
    }
  }

  function getDemoScript(): DemoStep[] {
    const scripts = getDemoScripts();
    // For demo reliability, always use the first script (which includes
    // disease → soil card → subsidy → Sarkari-Mitra → mandi prices).
    return scripts[0];
  }

  async function playDemo() {
    if (isDemoRunning) return;

    // Random initial greetings
    const initialGreetings = {
      mr: [
        "नमस्कार, माझ्या कांद्याच्या पिकावर रोग दिसतोय.",
        "नमस्कार, माझ्या पिकावर समस्या आहे.",
        "नमस्कार, मला शेती संबंधी सल्ला हवा आहे.",
        "नमस्कार, माझ्या सोयाबीन पिकावर काहीतरी चुकत आहे.",
        "नमस्कार, माझ्या टोमॅटो पिकाची काळजी करायची आहे.",
        "नमस्कार, माझ्या गहू पिकावर रोग दिसतो.",
      ],
      hi: [
        "नमस्कार, मेरी फसल में समस्या है.",
        "नमस्कार, मुझे खेती की सलाह चाहिए.",
        "नमस्कार, मेरी प्याज की फसल में रोग लग गया है.",
        "नमस्कार, मेरी सोयाबीन की फसल में कुछ गड़बड़ है.",
        "नमस्कार, मेरे टमाटर की फसल की देखभाल करनी है.",
        "नमस्कार, मेरी गेहूं की फसल में रोग दिख रहा है.",
      ],
      en: [
        "Hello, I have a problem with my crop.",
        "Hello, I need farming advice.",
        "Hello, my onion crop has a disease.",
        "Hello, something is wrong with my soybean crop.",
        "Hello, I need to take care of my tomato crop.",
        "Hello, my wheat crop shows signs of disease.",
      ],
    };

    const langKey = language === "mr" ? "mr" : language === "hi" ? "hi" : "en";
    const randomGreeting = initialGreetings[langKey][
      Math.floor(Math.random() * initialGreetings[langKey].length)
    ];

    // Clear existing messages except initial ones
    setMessages([
      {
        id: 1,
        sender: "farmer",
        kind: "text",
        text: randomGreeting,
      },
      {
        id: 2,
        sender: "agent",
        kind: "text",
        text:
          language === "mr"
            ? "नमस्कार 👋, मी Kisan Setu AI आहे. फोटो / आवाज पाठवल्यास मी अधिक चांगला सल्ला देऊ शकतो."
            : language === "hi"
              ? "नमस्कार 👋, मैं Kisan Setu AI हूं। फोटो / आवाज भेजने पर मैं बेहतर सलाह दे सकता हूं।"
              : "Hello 👋, I'm Kisan Setu AI. Send a photo or voice for better advice.",
      },
    ]);
    setNextId(3);
    setIsDemoRunning(true);

    const script = getDemoScript();
    let cumulativeDelay = 0;

    for (const step of script) {
      cumulativeDelay += step.delay;

      demoTimeoutRef.current = setTimeout(() => {
        if (step.action === "sarkari-mitra") {
          void runSarkariMitraDemo();
        } else if (step.shouldCallAPI) {
          void sendToAgent(step.text, step.kind);
        } else if (step.kind === "image") {
          // Show soil card in demo with random data
          const soilCardData = generateRandomSoilCard();
          addMessage({
            sender: step.sender,
            text: step.text,
            kind: step.kind,
            showSoilCard: true,
            soilCardData: soilCardData
          });
          // Then send analysis request
          setTimeout(() => {
            const analysisText =
              language === "mr"
                ? "मृदा आरोग्य कार्डाचा फोटो पाठवला आहे. कृपया सल्ला द्या."
                : language === "hi"
                  ? "मिट्टी स्वास्थ्य कार्ड की फोटो भेजी है. कृपया सलाह दें।"
                  : "Sent a photo of the Soil Health Card. Please provide advice.";
            void sendToAgent(analysisText, "text");
          }, 500);
        } else {
          addMessage({
            sender: step.sender,
            text: step.text,
            kind: step.kind,
          });
        }
      }, cumulativeDelay);
    }

    // Schedule a random proactive alert near the end of the demo
    const alertDelay = Math.max(1500, cumulativeDelay - 1000);
    demoTimeoutRef.current = setTimeout(() => {
      const alertText = getRandomAlertMessage();
      addMessage({
        sender: "agent",
        text: alertText,
        kind: "text",
      });
    }, alertDelay);

    // End demo after last step + response time
    demoTimeoutRef.current = setTimeout(() => {
      setIsDemoRunning(false);
    }, cumulativeDelay + 5000);
  }

  function stopDemo() {
    if (demoTimeoutRef.current) {
      clearTimeout(demoTimeoutRef.current);
      demoTimeoutRef.current = null;
    }
    setIsDemoRunning(false);
  }

  useEffect(() => {
    return () => {
      if (demoTimeoutRef.current) {
        clearTimeout(demoTimeoutRef.current);
      }
    };
  }, []);

  // Browser speech recognition setup (for real voice input where supported)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SR) {
      setCanUseSpeech(false);
      recognitionRef.current = null;
      return;
    }

    setCanUseSpeech(true);

    const rec = new SR();
    rec.lang = language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      setIsRecording(false);
      const transcript =
        event?.results?.[0]?.[0]?.transcript &&
        String(event.results[0][0].transcript);

      if (transcript && transcript.trim()) {
        const textPrefix =
          language === "mr"
            ? "🎙️ [Voice] "
            : language === "hi"
              ? "🎙️ [Voice] "
              : "🎙️ [Voice] ";

        const finalText = `${textPrefix}${transcript.trim()}`;
        void sendToAgent(finalText, "voice");
      }
    };

    rec.onerror = () => {
      setIsRecording(false);
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
      setIsRecording(false);
    };
  }, [language]);

  // Auto-scroll to latest message
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, sending]);

  const isFullscreen = variant === "fullscreen";

  return (
    <section
      className={
        isFullscreen
          ? "flex flex-col flex-1 min-h-0 w-full bg-[#0b141a] overflow-hidden"
          : "rounded-3xl border border-slate-800 bg-slate-900/80 p-3 sm:p-4 flex flex-col h-[420px] sm:h-[460px] lg:h-[520px] max-h-[55vh] w-full !mt-0"
      }
    >
      <header
        className={
          isFullscreen
            ? "flex items-center justify-between gap-2 px-4 py-3 bg-[#202c33] border-b border-slate-700/50 shrink-0"
            : "flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2"
        }
      >
        <div className="flex items-center gap-2">
          <div
            className={
              isFullscreen
                ? "h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-semibold"
                : "h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-semibold"
            }
          >
            KS
          </div>
          <div className={isFullscreen ? "text-sm" : "text-xs"}>
            <p className="font-semibold text-slate-100">Kisan Setu WhatsApp</p>
            <p className={`${isFullscreen ? "text-xs" : "text-[10px]"} text-emerald-400`}>
              {isDemoRunning ? "demo mode • running" : "online • prototype"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* {isDemoRunning ? (
            <button
              onClick={stopDemo}
              className="px-2 py-1 rounded-full bg-red-600/80 text-[10px] text-white font-semibold"
            >
              Stop Demo
            </button>
          ) : (
            <button
              onClick={playDemo}
              className="px-2 py-1 rounded-full bg-accent text-[10px] text-white font-semibold"
            >
              ▶️ Play Demo
            </button>
          )} */}
          {pathname !== "/whatsapp-demo" && (
            <a
              href="/whatsapp-demo"
              className={`${isFullscreen ? "flex" : "hidden sm:flex"} flex-1 items-center justify-center gap-1 rounded-full border border-emerald-700 text-[11px] text-emerald-200 px-2 py-1 bg-emerald-900/40 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span>🏛️</span>
              <span>Full Whatsapp UI</span>
            </a>
          )}
          <select
            className="bg-slate-900 border border-slate-700 rounded-full px-3 py-1 text-[10px] text-slate-200"
            value={language}
            onChange={(e) => setLanguage(e.target.value as "mr" | "hi" | "en")}
            disabled={isDemoRunning}
          >
            <option value="mr">Marathi</option>
            <option value="hi">Hindi</option>
            <option value="en">English</option>
          </select>
        </div>
      </header>

      <div
        ref={scrollContainerRef}
        className={
          isFullscreen
            ? "flex-1 flex flex-col gap-2 overflow-y-auto p-4 bg-[#0b141a] scrollbar-thin min-h-0"
            : "flex-1 flex flex-col gap-1 overflow-y-auto rounded-2xl bg-slate-950/60 p-2 scrollbar-thin"
        }
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "farmer" ? "justify-end" : "justify-start"
              }`}
          >
            {msg.showSoilCard ? (
              <div className="max-w-[85%] sm:max-w-[75%]">
                <div className="rounded-2xl bg-emerald-600 text-emerald-50 rounded-br-sm overflow-hidden">
                  <div className="px-2 py-1.5 text-[10px] font-medium border-b border-emerald-700/50">
                    {msg.text}
                  </div>
                  <div className="bg-white p-2 max-h-[280px] overflow-y-auto scrollbar-thin">
                    <SoilCardSample compact={true} data={msg.soilCardData} />
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 leading-snug ${isFullscreen ? "text-sm px-4 py-2.5" : "text-[11px]"
                  } ${msg.sender === "farmer"
                    ? "bg-emerald-600 text-emerald-50 rounded-br-sm"
                    : isFullscreen
                      ? "bg-[#202c33] text-slate-100 rounded-bl-sm"
                      : "bg-slate-800 text-slate-100 rounded-bl-sm"
                  }`}
              >
                <p>{msg.text}</p>
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="max-w-[60%] rounded-2xl px-3 py-2 text-[11px] bg-slate-800 text-slate-300 italic">
              Typing…
            </div>
          </div>
        )}
      </div>

      <div className={`mt-2 flex flex-col gap-2 ${isFullscreen ? "p-4 pb-6 sm:pb-4" : ""}`}>
        {isDemoRunning && (
          <div className="text-center py-1 px-2 rounded-lg bg-accent/20 border border-accent/40">
            <p className="text-[10px] text-accent font-semibold">
              🎬 Demo Mode Active - Watch the conversation unfold automatically
            </p>
          </div>
        )}
        {showSarkariForm && !isDemoRunning && (
          <div className="rounded-2xl border border-emerald-700 bg-emerald-950/60 p-3 space-y-2 text-[10px] text-emerald-50">
            <p className="font-semibold mb-1">
              {language === "mr"
                ? "सरकारी-मित्र: तुमची मूलभूत माहिती निवडा"
                : language === "hi"
                  ? "सरकारी-मित्र: अपनी बुनियादी जानकारी चुनें"
                  : "Sarkari-Mitra: Select your basic details"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-emerald-100/80">
                  {language === "mr"
                    ? "राज्य (code)"
                    : language === "hi"
                      ? "राज्य (code)"
                      : "State (code)"}
                </label>
                <select
                  className="w-full rounded-lg bg-slate-950/70 border border-emerald-700 px-2 py-1"
                  value={sarkariState}
                  onChange={(e) => setSarkariState(e.target.value)}
                >
                  <option value="MH">MH</option>
                  <option value="UP">UP</option>
                  <option value="MP">MP</option>
                  <option value="RJ">RJ</option>
                  <option value="GJ">GJ</option>
                  <option value="KA">KA</option>
                  <option value="TN">TN</option>
                  <option value="AP">AP</option>
                  <option value="TS">TS</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-emerald-100/80">
                  {language === "mr"
                    ? "जमीन आकार"
                    : language === "hi"
                      ? "जमीन आकार"
                      : "Land size"}
                </label>
                <select
                  className="w-full rounded-lg bg-slate-950/70 border border-emerald-700 px-2 py-1"
                  value={sarkariLandSize}
                  onChange={(e) =>
                    setSarkariLandSize(e.target.value as "small" | "medium" | "large")
                  }
                >
                  <option value="small">
                    {language === "mr"
                      ? "लहान (~0.5 ha)"
                      : language === "hi"
                        ? "छोटा (~0.5 ha)"
                        : "Small (~0.5 ha)"}
                  </option>
                  <option value="medium">
                    {language === "mr"
                      ? "मध्यम (~2 ha)"
                      : language === "hi"
                        ? "मध्यम (~2 ha)"
                        : "Medium (~2 ha)"}
                  </option>
                  <option value="large">
                    {language === "mr"
                      ? "मोठा (~5 ha)"
                      : language === "hi"
                        ? "बड़ा (~5 ha)"
                        : "Large (~5 ha)"}
                  </option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-emerald-100/80">
                  {language === "mr"
                    ? "जमीन प्रकार"
                    : language === "hi"
                      ? "जमीन प्रकार"
                      : "Land type"}
                </label>
                <select
                  className="w-full rounded-lg bg-slate-950/70 border border-emerald-700 px-2 py-1"
                  value={sarkariLandType}
                  onChange={(e) =>
                    setSarkariLandType(
                      e.target.value as "irrigated" | "rainfed" | "both"
                    )
                  }
                >
                  <option value="irrigated">
                    {language === "mr"
                      ? "सिंचित"
                      : language === "hi"
                        ? "सिंचित"
                        : "Irrigated"}
                  </option>
                  <option value="rainfed">
                    {language === "mr"
                      ? "जैविक / पावसावर"
                      : language === "hi"
                        ? "वर्षा आधारित"
                        : "Rainfed"}
                  </option>
                  <option value="both">
                    {language === "mr"
                      ? "दोन्ही"
                      : language === "hi"
                        ? "दोनों"
                        : "Both"}
                  </option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-emerald-100/80">
                  {language === "mr"
                    ? "शेतकरी नोंदणी"
                    : language === "hi"
                      ? "किसान पंजीकरण"
                      : "Farmer registration"}
                </label>
                <select
                  className="w-full rounded-lg bg-slate-950/70 border border-emerald-700 px-2 py-1"
                  value={sarkariRegistered}
                  onChange={(e) =>
                    setSarkariRegistered(e.target.value as "yes" | "no")
                  }
                >
                  <option value="yes">
                    {language === "mr"
                      ? "होय"
                      : language === "hi"
                        ? "हाँ"
                        : "Yes"}
                  </option>
                  <option value="no">
                    {language === "mr"
                      ? "नाही"
                      : language === "hi"
                        ? "नहीं"
                        : "No"}
                  </option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-emerald-100/80">
                  {language === "mr"
                    ? "बँक खाते"
                    : language === "hi"
                      ? "बैंक खाता"
                      : "Bank account"}
                </label>
                <select
                  className="w-full rounded-lg bg-slate-950/70 border border-emerald-700 px-2 py-1"
                  value={sarkariBank}
                  onChange={(e) => setSarkariBank(e.target.value as "yes" | "no")}
                >
                  <option value="yes">
                    {language === "mr"
                      ? "होय"
                      : language === "hi"
                        ? "हाँ"
                        : "Yes"}
                  </option>
                  <option value="no">
                    {language === "mr"
                      ? "नाही"
                      : language === "hi"
                        ? "नहीं"
                        : "No"}
                  </option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-emerald-100/80">
                  {language === "mr"
                    ? "आधार लिंक"
                    : language === "hi"
                      ? "आधार लिंक"
                      : "Aadhaar linked"}
                </label>
                <select
                  className="w-full rounded-lg bg-slate-950/70 border border-emerald-700 px-2 py-1"
                  value={sarkariAadhaar}
                  onChange={(e) =>
                    setSarkariAadhaar(e.target.value as "yes" | "no")
                  }
                >
                  <option value="yes">
                    {language === "mr"
                      ? "होय"
                      : language === "hi"
                        ? "हाँ"
                        : "Yes"}
                  </option>
                  <option value="no">
                    {language === "mr"
                      ? "नाही"
                      : language === "hi"
                        ? "नहीं"
                        : "No"}
                  </option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                className="px-3 py-1 rounded-full border border-emerald-700 text-emerald-100"
                onClick={() => setShowSarkariForm(false)}
              >
                {language === "mr"
                  ? "रद्द"
                  : language === "hi"
                    ? "रद्द"
                    : "Cancel"}
              </button>
              <button
                type="button"
                className="px-3 py-1 rounded-full bg-emerald-600 text-emerald-50 font-semibold"
                onClick={submitSarkariMitra}
                disabled={checkingSchemes}
              >
                {language === "mr"
                  ? "योजना दाखवा"
                  : language === "hi"
                    ? "योजनाएं दिखाएं"
                    : "Show schemes"}
              </button>
            </div>
          </div>
        )}
        <div className={`flex items-center gap-2 ${isFullscreen ? "flex-wrap" : ""}`}>
          <button
            type="button"
            onClick={handleRealVoice}
            disabled={isDemoRunning}
            className="flex-1 flex items-center justify-center gap-1 rounded-full border border-slate-700 text-[11px] text-slate-200 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{canUseSpeech ? (isRecording ? "⏺️" : "🎤") : "🎙️"}</span>
            <span>
              {canUseSpeech
                ? isRecording
                  ? language === "mr"
                    ? "ऐकतोय..."
                    : language === "hi"
                      ? "सुन रहे हैं..."
                      : "Listening..."
                  : language === "mr"
                    ? "Voice"
                    : language === "hi"
                      ? "Voice"
                      : "Voice"
                : "Mock Voice"}
            </span>
          </button>
          <button
            type="button"
            onClick={handleMockImage}
            disabled={isDemoRunning}
            className="flex-1 flex items-center justify-center gap-1 rounded-full border border-slate-700 text-[11px] text-slate-200 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>🖼️</span>
            <span>Mock Soil Card</span>
          </button>
          {/* <button
            type="button"
            onClick={handleSarkariMitra}
            disabled={isDemoRunning || checkingSchemes}
            className={`${isFullscreen ? "flex" : "hidden sm:flex"} flex-1 items-center justify-center gap-1 rounded-full border border-emerald-700 text-[11px] text-emerald-200 px-2 py-1 bg-emerald-900/40 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span>🏛️</span>
            <span>
              {language === "mr"
                ? "Sarkari-Mitra"
                : language === "hi"
                ? "Sarkari-Mitra"
                : "Sarkari-Mitra"}
            </span>
          </button> */}
        </div>
        <div className="flex items-center gap-2">
          <input
            className={`flex-1 rounded-full bg-slate-950/70 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 ${isFullscreen ? "px-4 py-2.5 text-sm" : "px-3 py-1.5 text-[11px]"
              }`}
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isDemoRunning}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isDemoRunning) {
                e.preventDefault();
                handleSendText();
              }
            }}
          />
          <button
            type="button"
            onClick={handleSendText}
            disabled={sending || isDemoRunning}
            className={`rounded-full bg-emerald-600 text-emerald-50 font-semibold disabled:opacity-60 ${isFullscreen ? "px-4 py-2.5 text-sm" : "px-3 py-1.5 text-[11px]"
              }`}
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}

