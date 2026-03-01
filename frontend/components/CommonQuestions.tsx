"use client";

interface CommonQuestionsProps {
  language: "mr" | "hi" | "en";
  onSelect: (question: string) => void;
}

export function CommonQuestions({ language, onSelect }: CommonQuestionsProps) {
  const questions: Record<"mr" | "hi" | "en", string[]> = {
    mr: [
      "माझ्या पिकावर रोग दिसतो, काय करावे?",
      "मृदा आरोग्य कार्ड कसे मिळवायचे?",
      "सब्सिडी योजना कोणत्या आहेत?",
      "खत कधी आणि कसे द्यावे?",
      "पिकाची किंमत कशी मिळवायची?"
    ],
    hi: [
      "मेरी फसल में रोग लग गया है, क्या करूं?",
      "मिट्टी स्वास्थ्य कार्ड कैसे मिलेगा?",
      "सब्सिडी योजनाएं क्या हैं?",
      "खाद कब और कैसे दें?",
      "फसल की कीमत कैसे पता करें?"
    ],
    en: [
      "My crop has a disease, what should I do?",
      "How to get a Soil Health Card?",
      "What subsidy schemes are available?",
      "When and how to apply fertilizers?",
      "How to check crop prices?"
    ]
  };

  const currentQuestions = questions[language];

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 font-medium">
        Common Questions / सामान्य प्रश्न:
      </p>
      <div className="flex flex-wrap gap-2">
        {currentQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(q)}
            className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/60 text-[11px] text-slate-200 hover:border-primary/50 hover:bg-primary/10 transition-all hover:scale-105"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
