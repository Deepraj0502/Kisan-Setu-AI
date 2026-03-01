"use client";

export function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-slate-800 rounded w-3/4"></div>
      <div className="h-4 bg-slate-800 rounded w-full"></div>
      <div className="h-4 bg-slate-800 rounded w-5/6"></div>
    </div>
  );
}

export function AnswerSkeleton() {
  return (
    <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2 animate-pulse">
      <div className="h-3 bg-slate-800 rounded w-full"></div>
      <div className="h-3 bg-slate-800 rounded w-full"></div>
      <div className="h-3 bg-slate-800 rounded w-4/5"></div>
    </div>
  );
}

export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
      <span>Agri-OS is thinking...</span>
    </div>
  );
}
