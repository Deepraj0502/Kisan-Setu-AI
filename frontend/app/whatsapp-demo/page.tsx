"use client";

import Link from "next/link";
import { WhatsAppSimulator } from "../../components/WhatsAppSimulator";

export default function WhatsAppDemoPage() {
  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Top bar - back link; on mobile: minimal, on desktop: full */}
      <div className="shrink-0 flex items-center justify-between px-3 sm:px-4 py-2 bg-slate-900/80 border-b border-slate-800">
        <Link
          href="/"
          className="text-sm text-slate-300 hover:text-white flex items-center gap-1"
        >
          ← Back
        </Link>
        <span className="text-xs text-slate-500 hidden sm:inline">
          Kisan Setu AI • WhatsApp Bot Demo
        </span>
      </div>

      {/* Main layout: sidebar + chat on desktop, full chat on mobile */}
      <div className="flex-1 flex min-h-0">
        {/* WhatsApp Web sidebar - desktop only (lg+) */}
        <aside className="hidden lg:flex lg:w-72 xl:w-80 flex-col bg-[#111b21] border-r border-slate-800 shrink-0">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-slate-100 font-semibold text-lg">Chats</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Agri-OS WhatsApp prototype
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {/* Single chat item - Kisan Setu (active) */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#202c33] cursor-default">
              <div className="h-12 w-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold shrink-0">
                KS
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-100 truncate">
                  Kisan Setu AI
                </p>
                <p className="text-xs text-emerald-400 truncate">
                  online • prototype
                </p>
              </div>
            </div>
            <p className="text-slate-500 text-xs px-3 py-4">
              Voice, soil card & scheme queries supported
            </p>
          </div>
        </aside>

        {/* Chat area - full width on mobile, flex-1 on desktop */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#0b141a]">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <WhatsAppSimulator variant="fullscreen" />
          </div>
        </main>
      </div>
    </div>
  );
}
