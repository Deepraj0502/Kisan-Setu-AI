import { WhatsAppSimulator } from "../components/WhatsAppSimulator";
import { SoilCardSample } from "../components/SoilCardSample";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-6xl w-full space-y-6 sm:space-y-8">
        <header className="space-y-2 text-center sm:text-left px-2 sm:px-0">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-slate-400">
            Kisan Setu AI
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-50 leading-tight">
            Agri-OS Farmer Console
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm lg:text-base leading-relaxed">
            Your multilingual virtual extension officer for{" "}
            <span className="font-semibold text-primary">Marathi</span>,{" "}
            <span className="font-semibold text-primary">Hindi</span> and{" "}
            <span className="font-semibold text-primary">English</span> farmers.
          </p>
        </header>

        <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/40 p-3 sm:p-4 space-y-2">
            <h2 className="text-xs sm:text-sm font-semibold text-slate-100">
              आवाजातून मदत (Marathi)
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-300 leading-relaxed">
              शेतातली समस्या, पिकांची अवस्था किंवा खतांचा गोंधळ – फक्त आवाजात
              सांगा. Kisan Setu तुमच्यासाठी योग्य सल्ला तयार करेल.
            </p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/40 p-3 sm:p-4 space-y-2">
            <h2 className="text-xs sm:text-sm font-semibold text-slate-100">
              आवाज से सलाह (Hindi)
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-300 leading-relaxed">
              खेत की समस्या, फसल की हालत या सब्सिडी का सवाल – बस बोलिए. Kisan
              Setu आपके लिए ज़मीन से जुड़ी, डेटा-आधारित सलाह तैयार करेगा।
            </p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/40 p-3 sm:p-4 space-y-2">
            <h2 className="text-xs sm:text-sm font-semibold text-slate-100">
              Voice Advice (English)
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-300 leading-relaxed">
              Field problems, crop condition or pest infestation – just speak. Kisan
              Setu will prepare data-based advice for you.
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2 items-start">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-center sm:justify-end px-2 sm:px-0 float-end">
              <a
                href="/whatsapp-demo"
                className="group relative inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs sm:text-sm font-medium hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 active:scale-95 mb-4"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className="whitespace-nowrap">Open Fullscreen</span>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
            <WhatsAppSimulator />
          </div>
          <div className="hidden lg:block">
            <SoilCardSample />
          </div>
        </section>

        {/* Mobile: Show Soil Card Sample below on small screens */}
        <section className="lg:hidden">
          <SoilCardSample />
        </section>
      </div>
    </main>
  );
}
