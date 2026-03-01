"use client";

import { useState } from "react";

interface QueryHistoryItem {
  id: number;
  question: string;
  answer: string;
  language: "mr" | "hi" | "en";
  timestamp: Date;
}

interface QueryHistoryProps {
  history: QueryHistoryItem[];
  onSelectQuery: (question: string, language: "mr" | "hi" | "en") => void;
  onClear: () => void;
}

export function QueryHistory({ history, onSelectQuery, onClear }: QueryHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (history.length === 0) {
    return null;
  }

  const languageLabels: Record<"mr" | "hi" | "en", string> = {
    mr: "मराठी",
    hi: "हिंदी",
    en: "English"
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">
          Query History / प्रश्न इतिहास ({history.length})
        </h3>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={onClear}
              className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            {isExpanded ? "▼" : "▶"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {history.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => onSelectQuery(item.question, item.language)}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {languageLabels[item.language]}
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium line-clamp-2">
                {item.question}
              </p>
              <p className="text-[10px] text-slate-400 line-clamp-2">
                {item.answer.substring(0, 100)}...
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
