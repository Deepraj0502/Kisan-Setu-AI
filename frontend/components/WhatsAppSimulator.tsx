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
  imageUrl?: string; // For displaying uploaded images
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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // Load saved phone number and verification status on mount
  useEffect(() => {
    const savedPhone = localStorage.getItem("kisan_setu_phone");
    const savedVerified = localStorage.getItem("kisan_setu_verified");
    const savedLanguage = localStorage.getItem("kisan_setu_language");
    
    if (savedPhone && savedVerified === "true") {
      setPhoneNumber(savedPhone);
      setIsPhoneVerified(true);
      
      if (savedLanguage) {
        setLanguage(savedLanguage as "mr" | "hi" | "en");
      }
      
      // Fetch profile to show personalized welcome message
      const loadProfile = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/agent/profile/${savedPhone}`);
          if (response.ok) {
            const profile = await response.json();
            const lang = (savedLanguage as "mr" | "hi" | "en") || "mr";
            
            setMessages([{
              id: 1,
              text: lang === "mr" 
                ? `नमस्कार ${profile.name || ""}! तुमचा पुन्हा स्वागत आहे. 🙏\n\nमी तुम्हाला कशी मदत करू शकतो?`
                : lang === "hi"
                ? `नमस्ते ${profile.name || ""}! आपका फिर से स्वागत है। 🙏\n\nमैं आपकी कैसे मदद कर सकता हूं?`
                : `Hello ${profile.name || ""}! Welcome back. 🙏\n\nHow can I help you?`,
              sender: "agent",
              kind: 'text'
            }]);
          }
        } catch (error) {
          console.log("Failed to load profile:", error);
          // Show generic welcome message
          const lang = (savedLanguage as "mr" | "hi" | "en") || "mr";
          setMessages([{
            id: 1,
            text: lang === "mr" 
              ? `नमस्कार! तुमचा पुन्हा स्वागत आहे. मी तुम्हाला कशी मदत करू शकतो?`
              : lang === "hi"
              ? `नमस्ते! आपका फिर से स्वागत है। मैं आपकी कैसे मदद कर सकता हूं?`
              : `Hello! Welcome back. How can I help you?`,
            sender: "agent",
            kind: 'text'
          }]);
        }
      };
      
      loadProfile();
    }
  }, []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [checkingSchemes, setCheckingSchemes] = useState(false);
  const [showSarkariForm, setShowSarkariForm] = useState(false);
  const [sarkariState, setSarkariState] = useState("MH");
  const [sarkariLandSize, setSarkariLandSize] = useState<"small" | "medium" | "large">("small");
  const [sarkariLandType, setSarkariLandType] = useState<"irrigated" | "rainfed" | "both">("irrigated");
  const [sarkariRegistered, setSarkariRegistered] = useState<"yes" | "no">("yes");
  const [sarkariBank, setSarkariBank] = useState<"yes" | "no">("yes");
  const [sarkariAadhaar, setSarkariAadhaar] = useState<"yes" | "no">("yes");
  const [nextId, setNextId] = useState(1);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [canUseSpeech, setCanUseSpeech] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const demoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pathname = usePathname();

  function formatMessageText(text: string) {
    // Split by newlines
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      // Skip empty lines
      if (!line.trim()) {
        return <br key={index} />;
      }

      // Check for bullet points
      if (line.trim().startsWith('•')) {
        const content = line.replace(/^[\s•]+/, '');
        return (
          <div key={index} className="flex gap-2 my-0.5">
            <span className="text-emerald-400">•</span>
            <span>{formatInlineText(content)}</span>
          </div>
        );
      }

      // Check for numbered lists
      if (/^\d+[.)]\s/.test(line.trim())) {
        const match = line.match(/^(\d+[.)]\s)(.+)$/);
        if (match) {
          return (
            <div key={index} className="flex gap-2 my-0.5">
              <span className="text-emerald-400 font-semibold">{match[1]}</span>
              <span>{formatInlineText(match[2])}</span>
            </div>
          );
        }
      }

      // Regular line
      return (
        <div key={index} className="my-0.5">
          {formatInlineText(line)}
        </div>
      );
    });
  }

  function formatInlineText(text: string) {
    // Handle bold text (**text**)
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-semibold text-emerald-300">{boldText}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  }

  function addMessage(partial: Omit<ChatMessage, "id">) {
    setMessages((prev) => [...prev, { id: nextId, ...partial }]);
    setNextId((id) => id + 1);
  }

  async function handlePhoneSubmit() {
    // Simple validation
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.length !== 10) {
      alert(
        language === "mr"
          ? "कृपया वैध 10 अंकी मोबाइल नंबर टाका"
          : language === "hi"
            ? "कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें"
            : "Please enter a valid 10-digit mobile number"
      );
      return;
    }

    // Save to localStorage for persistence
    const fullPhone = `+91${cleaned}`;
    localStorage.setItem("kisan_setu_phone", fullPhone);
    localStorage.setItem("kisan_setu_verified", "true");
    localStorage.setItem("kisan_setu_language", language);

    setPhoneNumber(fullPhone);
    setIsPhoneVerified(true);

    // Check if profile exists and is complete
    try {
      const response = await fetch(`${API_BASE_URL}/agent/profile/${fullPhone}`);
      
      if (response.ok) {
        const profile = await response.json();
        
        // If profile exists and onboarding is complete, show welcome back message
        if (profile.onboarding_completed) {
          addMessage({
            sender: "agent",
            text:
              language === "mr"
                ? `नमस्कार ${profile.name || ""}! तुमचा पुन्हा स्वागत आहे. 🙏\n\nमी तुम्हाला कशी मदत करू शकतो?`
                : language === "hi"
                ? `नमस्ते ${profile.name || ""}! आपका फिर से स्वागत है। 🙏\n\nमैं आपकी कैसे मदद कर सकता हूं?`
                : `Hello ${profile.name || ""}! Welcome back. 🙏\n\nHow can I help you?`,
            kind: "text",
          });
          return;
        }
      }
    } catch (error) {
      console.log("Profile check failed, backend will handle onboarding:", error);
    }

    // For new users, don't add any message here
    // The backend will send the first onboarding question when user sends their first message
    // Add a prompt message to encourage them to start typing
    addMessage({
      sender: "agent",
      text:
        language === "mr"
          ? "✅ नोंदणी यशस्वी!\n\nआता तुमचे नाव टाइप करा आणि सुरू करा."
          : language === "hi"
          ? "✅ पंजीकरण सफल!\n\nअब अपना नाम टाइप करें और शुरू करें।"
          : "✅ Registration successful!\n\nNow type your name to get started.",
      kind: "text",
    });
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

      const text = lines.join("\n");
      addMessage({
        sender: "agent",
        text,
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
      const res = await fetch(`${API_BASE_URL}/agent/sarkari-mitra`, {
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
        body: JSON.stringify({ 
          question: text, 
          language,
          phone_number: isPhoneVerified ? phoneNumber : undefined
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as { answer?: string };
      const answerText = data.answer || "Agent reply unavailable.";
      addMessage({
        sender: "agent",
        text: answerText,
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

  function playMessageAudio(text: string, messageId: number) {
    if (typeof window === "undefined") return;

    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setPlayingMessageId(messageId);

    // Try AWS Polly first, fallback to browser speech synthesis
    const useAwsPolly = process.env.NEXT_PUBLIC_USE_AWS_POLLY === "true";
    
    if (useAwsPolly) {
      const audioUrl = `${API_BASE_URL}/agent/tts`;
      
      fetch(audioUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          const audio = new Audio(URL.createObjectURL(blob));
          currentAudioRef.current = audio;
          
          audio.onended = () => {
            setPlayingMessageId(null);
            currentAudioRef.current = null;
          };
          
          audio.onerror = () => {
            setPlayingMessageId(null);
            currentAudioRef.current = null;
          };
          
          audio.play().catch((err) => {
            console.error("Audio playback failed:", err);
            setPlayingMessageId(null);
            fallbackToWebSpeech(text, messageId);
          });
        })
        .catch((err) => {
          console.error("TTS request failed, using browser fallback:", err);
          fallbackToWebSpeech(text, messageId);
        });
    } else {
      // Use browser speech synthesis directly
      fallbackToWebSpeech(text, messageId);
    }
  }

  function stopMessageAudio() {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    
    setPlayingMessageId(null);
  }

  function fallbackToWebSpeech(text: string, messageId: number) {
    if (!speechSupported) {
      setPlayingMessageId(null);
      return;
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setPlayingMessageId(null);
      return;
    }

    const synth = window.speechSynthesis;
    if (synth.speaking) synth.cancel();

    const utter = new SpeechSynthesisUtterance(text.replace(/\s+/g, " "));
    const targetLang = language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-IN";
    const langPrefix = targetLang.split("-")[0];
    const voices = voicesRef.current || synth.getVoices();

    let voice =
      voices.find((v) => v.lang === targetLang) ||
      voices.find((v) => v.lang.startsWith(langPrefix + "-")) ||
      voices.find((v) => v.lang === langPrefix) ||
      voices.find((v) => v.lang.toLowerCase().includes(langPrefix));

    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    } else {
      utter.lang = targetLang;
    }

    utter.rate = 1;
    utter.pitch = 1;
    
    utter.onend = () => {
      setPlayingMessageId(null);
    };
    
    utter.onerror = () => {
      setPlayingMessageId(null);
    };
    
    synth.speak(utter);
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
      // Error message will be shown by onerror handler if it's a real error
      // Only show message here if it's a synchronous error
      const error = err as any;
      if (error && error.message && !error.message.includes("already started")) {
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

  function handleMockNotification() {
    if (isDemoRunning) return;

    // Generate a random notification
    const notification = generateRandomNotification();

    addMessage({
      sender: "agent",
      text: notification,
      kind: "text",
    });
  }

  function generateRandomNotification(): string {
    const notificationTypes = [
      "weather",
      "market",
      "pest",
      "scheme",
      "irrigation",
      "harvest",
    ] as const;

    type NotificationType = typeof notificationTypes[number];

    const type: NotificationType =
      notificationTypes[Math.floor(Math.random() * notificationTypes.length)];

    const notifications: Record<NotificationType, Record<"mr" | "hi" | "en", string[]>> = {
      weather: {
        mr: [
          "🌧️ हवामान अलर्ट: पुढील 48 तासांत तुमच्या भागात मध्यम ते जोरदार पाऊस अपेक्षित आहे. फवारणी टाळा आणि जलनिकास तपासा.",
          "☀️ हवामान अपडेट: पुढील 5 दिवस उष्ण आणि कोरडे राहतील. सिंचनाची योजना करा. तापमान 35-38°C अपेक्षित.",
          "🌪️ वादळ चेतावणी: आज संध्याकाळी वादळी वारे (40-50 km/h) शक्य आहेत. पिकांना आधार द्या आणि सैल वस्तू सुरक्षित करा.",
          "🌡️ उष्णता लाट: पुढील 3 दिवस अत्यधिक उष्णता (40°C+). पिकांना सकाळी/संध्याकाळी पाणी द्या. दुपारी फवारणी टाळा.",
          "❄️ थंडी चेतावणी: रात्रीचे तापमान 10°C खाली जाणार. संवेदनशील पिकांचे संरक्षण करा.",
        ],
        hi: [
          "🌧️ मौसम अलर्ट: अगले 48 घंटों में आपके क्षेत्र में मध्यम से भारी बारिश की संभावना। स्प्रे न करें और जल निकासी जांचें।",
          "☀️ मौसम अपडेट: अगले 5 दिन गर्म और शुष्क रहेंगे। सिंचाई की योजना बनाएं। तापमान 35-38°C अपेक्षित।",
          "🌪️ तूफान चेतावनी: आज शाम तेज हवाएं (40-50 km/h) संभव हैं। फसलों को सहारा दें और ढीली वस्तुएं सुरक्षित करें।",
          "🌡️ गर्मी की लहर: अगले 3 दिन अत्यधिक गर्मी (40°C+)। फसलों को सुबह/शाम पानी दें। दोपहर में स्प्रे न करें।",
          "❄️ ठंड चेतावनी: रात का तापमान 10°C से नीचे जाएगा। संवेदनशील फसलों की सुरक्षा करें।",
        ],
        en: [
          "🌧️ Weather Alert: Moderate to heavy rainfall expected in your area in next 48 hours. Avoid spraying and check drainage.",
          "☀️ Weather Update: Next 5 days will be hot and dry. Plan irrigation accordingly. Temperature expected 35-38°C.",
          "🌪️ Storm Warning: Strong winds (40-50 km/h) possible this evening. Support crops and secure loose items.",
          "🌡️ Heat Wave: Extreme heat (40°C+) for next 3 days. Water crops in morning/evening. Avoid afternoon spraying.",
          "❄️ Cold Warning: Night temperature will drop below 10°C. Protect sensitive crops.",
        ],
      },
      market: {
        mr: [
          "📈 मंडी भाव: पुणे APMC मध्ये कांद्याचा भाव आज ₹25/kg वर पोहोचला (+18% मागील आठवड्यापेक्षा). विक्रीचा विचार करा.",
          "💰 किंमत अलर्ट: टोमॅटोची किंमत ₹40/kg (↑ ₹8). मागणी जास्त आहे. आजच्या बाजारात विक्री करा.",
          "📊 बाजार अपडेट: सोयाबीनचा भाव स्थिर ₹4,200/quintal. पुढील आठवड्यात वाढ अपेक्षित. थोडा वेळ थांबा.",
          "🌾 गहू भाव: MSP ₹2,275/quintal घोषित. सरकारी खरेदी केंद्र 15 मार्च पासून सुरू होणार.",
          "🥔 बटाटा किंमत: ₹18/kg (↓ ₹5). जास्त पुरवठा. आवश्यक असल्यास लवकर विका.",
        ],
        hi: [
          "📈 मंडी भाव: पुणे APMC में प्याज का भाव आज ₹25/kg पर पहुंचा (+18% पिछले सप्ताह से)। बिक्री पर विचार करें।",
          "💰 कीमत अलर्ट: टमाटर की कीमत ₹40/kg (↑ ₹8)। मांग अधिक है। आज के बाजार में बेचें।",
          "📊 बाजार अपडेट: सोयाबीन का भाव स्थिर ₹4,200/quintal। अगले सप्ताह वृद्धि अपेक्षित। थोड़ा इंतजार करें।",
          "🌾 गेहूं भाव: MSP ₹2,275/quintal घोषित। सरकारी खरीद केंद्र 15 मार्च से शुरू होंगे।",
          "🥔 आलू कीमत: ₹18/kg (↓ ₹5)। अधिक आपूर्ति। जरूरत हो तो जल्दी बेचें।",
        ],
        en: [
          "📈 Mandi Rates: Onion price reached ₹25/kg today at Pune APMC (+18% from last week). Consider selling.",
          "💰 Price Alert: Tomato price at ₹40/kg (↑ ₹8). High demand. Sell in today's market.",
          "📊 Market Update: Soybean price stable at ₹4,200/quintal. Increase expected next week. Hold for now.",
          "🌾 Wheat Price: MSP announced at ₹2,275/quintal. Government procurement centers opening from March 15.",
          "🥔 Potato Price: ₹18/kg (↓ ₹5). Oversupply. Sell quickly if needed.",
        ],
      },
      pest: {
        mr: [
          "🐛 कीटक अलर्ट: तुमच्या तालुक्यात पांढरी माशी (whitefly) प्रादुर्भाव नोंदवला. टोमॅटो/मिरची पिकांची तपासणी करा.",
          "🦗 टोळधाड चेतावणी: शेजारच्या जिल्ह्यात टोळांचे थवे दिसले. स्थानिक कृषी विभागाशी संपर्क साधा.",
          "🐌 गोगलगाय समस्या: पावसानंतर गोगलगाय वाढ. भाजीपाला पिकांभोवती राख/चुना पसरवा.",
          "🦟 रोग वाहक: माहू (aphids) संख्या वाढली. नीम तेल फवारणी करा किंवा इमिडाक्लोप्रिड वापरा.",
          "🪲 बीटल हल्ला: बैंगन शूट बोरर सक्रिय. फेरोमोन सापळे लावा आणि संक्रमित फांद्या काढा.",
        ],
        hi: [
          "🐛 कीट अलर्ट: आपके तालुका में सफेद मक्खी (whitefly) प्रकोप दर्ज। टमाटर/मिर्च फसलों की जांच करें।",
          "🦗 टिड्डी चेतावनी: पड़ोसी जिले में टिड्डियों के झुंड देखे गए। स्थानीय कृषि विभाग से संपर्क करें।",
          "🐌 घोंघा समस्या: बारिश के बाद घोंघे बढ़े। सब्जी फसलों के चारों ओर राख/चूना फैलाएं।",
          "🦟 रोग वाहक: माहू (aphids) संख्या बढ़ी। नीम तेल स्प्रे करें या इमिडाक्लोप्रिड उपयोग करें।",
          "🪲 बीटल हमला: बैंगन शूट बोरर सक्रिय। फेरोमोन ट्रैप लगाएं और संक्रमित शाखाएं हटाएं।",
        ],
        en: [
          "🐛 Pest Alert: Whitefly infestation reported in your taluka. Check tomato/chili crops immediately.",
          "🦗 Locust Warning: Locust swarms spotted in neighboring district. Contact local agriculture department.",
          "🐌 Snail Problem: Snails increased after rain. Spread ash/lime around vegetable crops.",
          "🦟 Disease Vector: Aphid numbers increased. Spray neem oil or use imidacloprid.",
          "🪲 Beetle Attack: Brinjal shoot borer active. Install pheromone traps and remove infected shoots.",
        ],
      },
      scheme: {
        mr: [
          "🏛️ नवीन योजना: 'प्रधानमंत्री सूक्ष्म सिंचन योजना' अंतर्गत 90% सबसिडी. अर्ज करण्याची शेवटची तारीख: 31 मार्च.",
          "💳 थेट लाभ हस्तांतरण: PM-KISAN चा ₹2,000 हप्ता तुमच्या खात्यात जमा झाला. तपासा.",
          "🌱 बियाणे सबसिडी: प्रमाणित बियाण्यांवर 50% सबसिडी उपलब्ध. नजीकच्या कृषी केंद्रावर अर्ज करा.",
          "🚜 यंत्रसामग्री सबसिडी: ट्रॅक्टर/कृषी उपकरणांवर 40% सबसिडी. ऑनलाइन अर्ज सुरू: agrimachinery.nic.in",
          "📚 मोफत प्रशिक्षण: जैविक शेती प्रशिक्षण शिबिर 10-12 मार्च. नोंदणी: 1800-180-1551",
        ],
        hi: [
          "🏛️ नई योजना: 'प्रधानमंत्री सूक्ष्म सिंचाई योजना' के तहत 90% सब्सिडी। आवेदन की अंतिम तिथि: 31 मार्च।",
          "💳 प्रत्यक्ष लाभ हस्तांतरण: PM-KISAN की ₹2,000 किस्त आपके खाते में जमा हुई। जांचें।",
          "🌱 बीज सब्सिडी: प्रमाणित बीजों पर 50% सब्सिडी उपलब्ध। नजदीकी कृषि केंद्र पर आवेदन करें।",
          "🚜 मशीनरी सब्सिडी: ट्रैक्टर/कृषि उपकरणों पर 40% सब्सिडी। ऑनलाइन आवेदन शुरू: agrimachinery.nic.in",
          "📚 मुफ्त प्रशिक्षण: जैविक खेती प्रशिक्षण शिविर 10-12 मार्च। पंजीकरण: 1800-180-1551",
        ],
        en: [
          "🏛️ New Scheme: 90% subsidy under 'PM Micro Irrigation Scheme'. Last date to apply: March 31.",
          "💳 Direct Benefit Transfer: PM-KISAN installment of ₹2,000 credited to your account. Check now.",
          "🌱 Seed Subsidy: 50% subsidy on certified seeds available. Apply at nearest agriculture center.",
          "🚜 Machinery Subsidy: 40% subsidy on tractors/farm equipment. Online application open: agrimachinery.nic.in",
          "📚 Free Training: Organic farming training camp March 10-12. Register: 1800-180-1551",
        ],
      },
      irrigation: {
        mr: [
          "💧 सिंचन सल्ला: उपग्रह डेटा नुसार तुमच्या शेतात माती आर्द्रता 40% आहे. 2-3 दिवसांत सिंचन करा.",
          "⏰ पाणी वेळापत्रक: तुमच्या भागात पाणी पुरवठा उद्या सकाळी 6-10 AM. तयारी ठेवा.",
          "🌊 पाणी बचत: ड्रिप सिंचनाने 60% पाणी वाचवा. सबसिडी उपलब्ध. संपर्क: जिल्हा कृषी कार्यालय.",
          "📉 जलस्तर: भूजल पातळी कमी होत आहे. पाणी बचत करा. पर्यायी पिके विचारात घ्या.",
          "🚰 पाणी गुणवत्ता: तुमच्या विहिरीचे पाणी तपासणी करा. मोफत चाचणी शिबिर 5 मार्च रोजी.",
        ],
        hi: [
          "💧 सिंचाई सलाह: उपग्रह डेटा के अनुसार आपके खेत में मिट्टी की नमी 40% है। 2-3 दिनों में सिंचाई करें।",
          "⏰ पानी शेड्यूल: आपके क्षेत्र में पानी की आपूर्ति कल सुबह 6-10 AM। तैयार रहें।",
          "🌊 पानी बचत: ड्रिप सिंचाई से 60% पानी बचाएं। सब्सिडी उपलब्ध। संपर्क: जिला कृषि कार्यालय।",
          "📉 जल स्तर: भूजल स्तर कम हो रहा है। पानी बचाएं। वैकल्पिक फसलें विचार करें।",
          "🚰 पानी गुणवत्ता: अपने कुएं का पानी जांचें। मुफ्त परीक्षण शिविर 5 मार्च को।",
        ],
        en: [
          "💧 Irrigation Advisory: Satellite data shows soil moisture at 40% in your field. Irrigate in 2-3 days.",
          "⏰ Water Schedule: Water supply in your area tomorrow morning 6-10 AM. Be prepared.",
          "🌊 Water Saving: Save 60% water with drip irrigation. Subsidy available. Contact: District Agriculture Office.",
          "📉 Water Level: Groundwater level declining. Conserve water. Consider alternative crops.",
          "🚰 Water Quality: Test your well water. Free testing camp on March 5.",
        ],
      },
      harvest: {
        mr: [
          "🌾 कापणी सल्ला: तुमचे गहू पीक 85% परिपक्व आहे. 7-10 दिवसांत कापणी करा. हवामान अनुकूल आहे.",
          "📅 कापणी वेळापत्रक: सोयाबीन कापणीसाठी तयार. आर्द्रता 12-14% आहे. यंत्रसामग्री बुक करा.",
          "🚜 हार्वेस्टर उपलब्ध: कस्टम हायरिंग सेंटरवर कंबाईन हार्वेस्टर उपलब्ध. बुकिंग: 9876543210",
          "📦 साठवण सल्ला: कापणीनंतर धान्य 48 तासांत वाळवा. आर्द्रता 12% खाली आणा.",
          "🏪 खरेदी केंद्र: सरकारी खरेदी केंद्र तुमच्या गावापासून 5 km. MSP वर विक्री करा.",
        ],
        hi: [
          "🌾 कटाई सलाह: आपकी गेहूं की फसल 85% परिपक्व है। 7-10 दिनों में कटाई करें। मौसम अनुकूल है।",
          "📅 कटाई शेड्यूल: सोयाबीन कटाई के लिए तैयार। नमी 12-14% है। मशीनरी बुक करें।",
          "🚜 हार्वेस्टर उपलब्ध: कस्टम हायरिंग सेंटर पर कंबाइन हार्वेस्टर उपलब्ध। बुकिंग: 9876543210",
          "📦 भंडारण सलाह: कटाई के बाद अनाज 48 घंटों में सुखाएं। नमी 12% से नीचे लाएं।",
          "🏪 खरीद केंद्र: सरकारी खरीद केंद्र आपके गांव से 5 km। MSP पर बेचें।",
        ],
        en: [
          "🌾 Harvest Advisory: Your wheat crop is 85% mature. Harvest in 7-10 days. Weather is favorable.",
          "📅 Harvest Schedule: Soybean ready for harvest. Moisture at 12-14%. Book machinery.",
          "🚜 Harvester Available: Combine harvester available at Custom Hiring Center. Booking: 9876543210",
          "📦 Storage Advice: Dry grain within 48 hours after harvest. Bring moisture below 12%.",
          "🏪 Procurement Center: Government procurement center 5 km from your village. Sell at MSP.",
        ],
      },
    };

    const langKey = language === "mr" ? "mr" : language === "hi" ? "hi" : "en";
    const typeNotifications = notifications[type][langKey];
    const notification =
      typeNotifications[Math.floor(Math.random() * typeNotifications.length)];

    return notification;
  }

  function handleRealImageUpload() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  async function handleImageFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Image = e.target?.result as string;

      // Show image in chat with preview
      addMessage({
        sender: "farmer",
        text: language === "mr"
          ? "🖼️ पीक रोग प्रतिमा"
          : language === "hi"
            ? "🖼️ फसल रोग छवि"
            : "🖼️ Crop Disease Image",
        kind: "image",
        imageUrl: base64Image, // Store the image URL for display
      });

      setSending(true);

      try {
        const res = await fetch(`${API_BASE_URL}/agent/crop-disease`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64Image,
            language,
            cropType: "general",
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        // Format the response
        const responseText = formatDiseaseResponse(data, language);

        addMessage({
          sender: "agent",
          text: responseText,
          kind: "text",
        });
      } catch (error) {
        console.error(error);
        addMessage({
          sender: "agent",
          text:
            language === "mr"
              ? "प्रतिमा विश्लेषण करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा."
              : language === "hi"
                ? "छवि विश्लेषण विफल। कृपया पुनः प्रयास करें।"
                : "Failed to analyze image. Please try again.",
          kind: "text",
        });
      } finally {
        setSending(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.readAsDataURL(file);
  }

  function formatDiseaseResponse(data: any, lang: "mr" | "hi" | "en"): string {
    const lines: string[] = [];

    // Disease name and confidence
    lines.push(
      `🔍 ${lang === "mr" ? "रोग" : lang === "hi" ? "रोग" : "Disease"}: ${data.disease_name}`
    );
    lines.push(
      `📊 ${lang === "mr" ? "आत्मविश्वास" : lang === "hi" ? "विश्वास" : "Confidence"}: ${data.confidence}`
    );
    lines.push(
      `⚠️ ${lang === "mr" ? "तीव्रता" : lang === "hi" ? "गंभीरता" : "Severity"}: ${data.severity}`
    );
    lines.push("");

    // Symptoms
    if (data.symptoms && data.symptoms.length > 0) {
      lines.push(
        `${lang === "mr" ? "🔸 लक्षणे:" : lang === "hi" ? "🔸 लक्षण:" : "🔸 Symptoms:"}`
      );
      data.symptoms.forEach((s: string) => lines.push(`  • ${s}`));
      lines.push("");
    }

    // Treatment
    if (data.treatment && data.treatment.length > 0) {
      lines.push(
        `${lang === "mr" ? "💊 उपचार:" : lang === "hi" ? "💊 उपचार:" : "💊 Treatment:"}`
      );
      data.treatment.forEach((t: string) => lines.push(`  • ${t}`));
      lines.push("");
    }

    // Prevention
    if (data.prevention && data.prevention.length > 0) {
      lines.push(
        `${lang === "mr" ? "🛡️ प्रतिबंध:" : lang === "hi" ? "🛡️ रोकथाम:" : "🛡️ Prevention:"}`
      );
      data.prevention.forEach((p: string) => lines.push(`  • ${p}`));
    }

    return lines.join("\n");
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
      // Cleanup audio on unmount
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Browser speech recognition + speech synthesis setup (for real voice input/output where supported)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SR) {
      setCanUseSpeech(false);
      recognitionRef.current = null;
    } else {
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

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        
        // Only show error message for actual errors, not for "no-speech" or "aborted"
        if (event.error && event.error !== "no-speech" && event.error !== "aborted") {
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
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }

    // Speech synthesis support check
    if ("speechSynthesis" in window) {
      const synth = window.speechSynthesis;
      const loadVoices = () => {
        const voices = synth.getVoices();
        if (voices && voices.length > 0) {
          voicesRef.current = voices;
          setSpeechSupported(true);
        }
      };
      loadVoices();
      synth.onvoiceschanged = loadVoices;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      setIsRecording(false);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        (window as any).speechSynthesis.onvoiceschanged = null;
      }
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
          {isPhoneVerified && (
            <>
              <div className="hidden sm:flex flex-col items-end mr-2">
                <p className="text-xs text-slate-300 font-medium">
                  {phoneNumber}
                </p>
                <p className="text-[10px] text-slate-400">
                  {language === "mr" ? "लॉग इन" : language === "hi" ? "लॉग इन" : "Logged in"}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm(
                    language === "mr"
                      ? "तुम्हाला खात्री आहे की तुम्ही लॉग आउट करू इच्छिता?"
                      : language === "hi"
                      ? "क्या आप वाकई लॉग आउट करना चाहते हैं?"
                      : "Are you sure you want to logout?"
                  )) {
                    localStorage.removeItem("kisan_setu_phone");
                    localStorage.removeItem("kisan_setu_verified");
                    localStorage.removeItem("kisan_setu_language");
                    setPhoneNumber("");
                    setIsPhoneVerified(false);
                    setMessages([]);
                  }
                }}
                className="flex items-center gap-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-red-600/30"
                title={language === "mr" ? "लॉग आउट" : language === "hi" ? "लॉग आउट" : "Logout"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">
                  {language === "mr" ? "लॉग आउट" : language === "hi" ? "लॉग आउट" : "Logout"}
                </span>
              </button>
            </>
          )}
          <select
            className="bg-slate-900 border border-slate-700 rounded-full px-3 py-1 text-[10px] text-slate-200"
            value={language}
            onChange={(e) => {
              const newLang = e.target.value as "mr" | "hi" | "en";
              setLanguage(newLang);
              if (isPhoneVerified) {
                localStorage.setItem("kisan_setu_language", newLang);
              }
            }}
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
        {!isPhoneVerified ? (
          // Login flow as chat messages
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto p-4">
              {/* Welcome message from bot */}
              <div className="flex justify-start">
                <div className="max-w-[85%] sm:max-w-[75%]">
                  <div className="rounded-2xl bg-slate-800 text-slate-100 px-3 py-2 text-sm rounded-tl-sm">
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {language === "mr"
                        ? "नमस्कार! 🙏 मी Kisan Setu AI आहे.\n\nमी तुम्हाला शेतीसाठी मदत करू शकतो.\n\nसुरुवात करण्यासाठी कृपया तुमचा मोबाइल नंबर टाका."
                        : language === "hi"
                        ? "नमस्कार! 🙏 मैं Kisan Setu AI हूं।\n\nमैं आपकी खेती में मदद कर सकता हूं।\n\nशुरू करने के लिए कृपया अपना मोबाइल नंबर दर्ज करें।"
                        : "Hello! 🙏 I'm Kisan Setu AI.\n\nI can help you with farming.\n\nPlease enter your mobile number to get started."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Phone input at bottom */}
            <div className="p-4 border-t border-slate-800">
              <div className="flex gap-2 mb-2">
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
                  +91
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  className="flex-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handlePhoneSubmit();
                    }
                  }}
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={handlePhoneSubmit}
                disabled={phoneNumber.length !== 10}
                className="w-full rounded-lg bg-emerald-600 text-emerald-50 font-semibold px-4 py-2.5 text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {language === "mr"
                  ? "सुरू करा"
                  : language === "hi"
                  ? "शुरू करें"
                  : "Start"}
              </button>
            </div>
          </div>
        ) : (
          <>
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
            ) : msg.imageUrl ? (
              <div className="max-w-[85%] sm:max-w-[75%]">
                <div className="rounded-2xl bg-emerald-600 text-emerald-50 rounded-br-sm overflow-hidden">
                  <div className="px-2 py-1.5 text-[10px] font-medium border-b border-emerald-700/50">
                    {msg.text}
                  </div>
                  <div className="bg-slate-900 p-2">
                    <img 
                      src={msg.imageUrl} 
                      alt="Uploaded crop image" 
                      className="w-full h-auto rounded-lg max-h-[400px] object-contain"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className={`flex items-start ${msg.sender === "farmer"
                      ? "justify-end"
                      : "justify-start"
                    } gap-1.5`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 leading-relaxed ${isFullscreen ? "text-sm px-4 py-2.5" : "text-[11px]"
                    } ${msg.sender === "farmer"
                      ? "bg-emerald-600 text-emerald-50 rounded-br-sm"
                      : isFullscreen
                        ? "bg-[#202c33] text-slate-100 rounded-bl-sm"
                        : "bg-slate-800 text-slate-100 rounded-bl-sm"
                    }`}
                >
                  <div className="whitespace-pre-wrap">
                    {formatMessageText(msg.text)}
                  </div>
                </div>
                {msg.sender === "agent" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (playingMessageId === msg.id) {
                        stopMessageAudio();
                      } else {
                        playMessageAudio(msg.text, msg.id);
                      }
                    }}
                    className={`mt-1 p-1 rounded-full hover:bg-slate-700/50 transition-colors ${
                      playingMessageId === msg.id ? "text-emerald-400" : "text-slate-400"
                    }`}
                    title={playingMessageId === msg.id ? "Stop" : "Play voice"}
                  >
                    {playingMessageId === msg.id ? (
                      <span className="text-xs">⏸️</span>
                    ) : (
                      <span className="text-xs">🔊</span>
                    )}
                  </button>
                )}
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
          </>
        )}
      </div>

      {isPhoneVerified && (
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
                    ? "आवाज"
                    : language === "hi"
                      ? "आवाज़"
                      : "Voice"
                : "Mock Voice"}
            </span>
          </button>
          <button
            type="button"
            onClick={handleRealImageUpload}
            disabled={isDemoRunning || sending}
            className="flex-1 flex items-center justify-center gap-1 rounded-full border border-slate-700 text-[11px] text-slate-200 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>📸</span>
            <span>
              {language === "mr"
                ? "पीक फोटो"
                : language === "hi"
                  ? "फसल फोटो"
                  : "Crop Photo"}
            </span>
          </button>
          <button
            type="button"
            onClick={handleMockNotification}
            disabled={isDemoRunning}
            className="flex-1 flex items-center justify-center gap-1 rounded-full border border-slate-700 text-[11px] text-slate-200 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>🔔</span>
            <span>
              {language === "mr"
                ? "मॉक अलर्ट"
                : language === "hi"
                  ? "मॉक अलर्ट"
                  : "Mock Alert"}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFile}
            className="hidden"
          />
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
      )}
    </section>
  );
}

