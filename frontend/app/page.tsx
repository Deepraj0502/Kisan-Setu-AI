import { WhatsAppSimulator } from "../components/WhatsAppSimulator";
import { SoilCardSample } from "../components/SoilCardSample";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-6">
      <div className="max-w-6xl w-full space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Kisan Setu AI
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-50">
            Agri-OS Farmer Console
          </h1>
          <p className="text-slate-300 text-sm sm:text-base">
            Your multilingual virtual extension officer for{" "}
            <span className="font-semibold text-primary">Marathi</span>,{" "}
            <span className="font-semibold text-primary">Hindi</span> and{" "}
            <span className="font-semibold text-primary">English</span> farmers.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">
              आवाजातून मदत (Marathi)
            </h2>
            <p className="text-xs text-slate-300">
              शेतातली समस्या, पिकांची अवस्था किंवा खतांचा गोंधळ – फक्त आवाजात
              सांगा. Kisan Setu तुमच्यासाठी योग्य सल्ला तयार करेल.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">
              आवाज से सलाह (Hindi)
            </h2>
            <p className="text-xs text-slate-300">
              खेत की समस्या, फसल की हालत या सब्सिडी का सवाल – बस बोलिए. Kisan
              Setu आपके लिए ज़मीन से जुड़ी, डेटा-आधारित सलाह तैयार करेगा।
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">
              Voice Advice (English)
            </h2>
            <p className="text-xs text-slate-300">
              Field problems, crop condition or pest infestation – just speak. Kisan
              Setu will prepare data-based advice for you.
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2 items-start">
          <div className="space-y-4">
            <div className="flex justify-end sm:hidden">
              <a
                href="/whatsapp-demo"
                className="text-xs text-emerald-400 hover:text-emerald-300 underline"
              >
                Open WhatsApp UI →
              </a>
            </div>
            <WhatsAppSimulator />
          </div>
          <SoilCardSample />
        </section>
      </div>
    </main>
  );
}

