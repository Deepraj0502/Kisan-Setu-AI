"use client";

import { useState } from "react";
import { CommonQuestions } from "./CommonQuestions";
import { QueryHistory } from "./QueryHistory";
import { AnswerSkeleton } from "./LoadingSkeleton";

type LanguageCode = "mr" | "hi" | "en";

interface HistoryItem {
  id: number;
  question: string;
  answer: string;
  language: LanguageCode;
  timestamp: Date;
}

export function AgentConsole() {
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState<LanguageCode>("mr");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [nextHistoryId, setNextHistoryId] = useState(1);

  async function handleAsk() {
    if (!question.trim()) {
      setError(
        "कृपया आधी तुमचा प्रश्न लिहा / अपना सवाल लिखिए / Please type your question."
      );
      return;
    }
    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const res = await fetch("http://localhost:4000/agent/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question, language })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as { answer?: string };
      const answerText = data.answer || "";
      setAnswer(answerText);
      
      // Add to history
      setHistory((prev) => [
        {
          id: nextHistoryId,
          question: question.trim(),
          answer: answerText,
          language,
          timestamp: new Date()
        },
        ...prev
      ]);
      setNextHistoryId((id) => id + 1);
    } catch (err) {
      console.error(err);
      setError(
        "Backend शी संपर्क झाला नाही. नंतर पुन्हा प्रयत्न करा. / Backend not reachable. Try again later."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSelectQuestion(selectedQuestion: string, selectedLanguage: LanguageCode) {
    setQuestion(selectedQuestion);
    setLanguage(selectedLanguage);
    // Optionally auto-submit
    // handleAsk();
  }

  function handleClearHistory() {
    setHistory([]);
    setNextHistoryId(1);
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Ask Agri-OS / Agri-OS ला प्रश्न विचारा
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span>Language:</span>
          <select
            className="bg-slate-900 border border-slate-700 rounded-full px-3 py-1 text-xs"
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            disabled={loading}
          >
            <option value="mr">Marathi</option>
            <option value="hi">Hindi</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <CommonQuestions language={language} onSelect={(q) => setQuestion(q)} />

      <textarea
        className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/70 transition-all disabled:opacity-50"
        rows={3}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder='उदा: माझ्या कांद्याच्या पिकावर बुरशी आली आहे, आता काय करावे? / e.g., My soybean crop is turning yellow, what should I do?'
        disabled={loading}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleAsk();
          }
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
              <span>Thinking...</span>
            </>
          ) : (
            "Get advice / सल्ला घ्या"
          )}
        </button>
        {error && (
          <p className="text-xs text-red-400 animate-pulse">{error}</p>
        )}
      </div>

      {loading && <AnswerSkeleton />}

      {answer && !loading && (
        <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-xs text-slate-100 whitespace-pre-line leading-relaxed">
            {answer}
          </p>
        </div>
      )}

      {history.length > 0 && (
        <QueryHistory
          history={history}
          onSelectQuery={handleSelectQuestion}
          onClear={handleClearHistory}
        />
      )}
    </section>
  );
}

