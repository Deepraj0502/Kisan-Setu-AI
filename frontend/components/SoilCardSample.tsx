"use client";

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

interface SoilCardSampleProps {
  compact?: boolean; // If true, render in compact mode for WhatsApp
  data?: SoilCardData; // Optional random data
}

// Default data if none provided
const defaultData: SoilCardData = {
  farmerName: "Shri Ram Patil",
  village: "Nashik (Rural)",
  sampleId: "MH-NSK-2026-0142",
  date: "12 Feb 2026",
  ph: 5.8,
  oc: 0.85,
  n: 280,
  p: 9,
  k: 210,
  phStatus: "low",
  pStatus: "low",
  advisory: "pH कमी, P कमी - चुना आणि P खतांची गरज"
};

function getColorClass(value: number, status: "low" | "good" | "high", type: "ph" | "p" | "other"): string {
  if (type === "ph") {
    if (status === "low") return "text-amber-600";
    if (status === "high") return "text-red-600";
    return "text-emerald-600";
  }
  if (type === "p") {
    if (status === "low") return "text-red-600";
    return "text-emerald-600";
  }
  // For N, K, OC - check if in ideal range
  if (type === "other") {
    // N: 200-300, K: 150-250, OC: 0.5-0.75
    return "text-emerald-600";
  }
  return "text-emerald-600";
}

export function SoilCardSample({ compact = false, data }: SoilCardSampleProps) {
  const cardData = data || defaultData;
  
  const phColor = getColorClass(cardData.ph, cardData.phStatus, "ph");
  const pColor = getColorClass(cardData.p, cardData.pStatus, "p");
  const nColor = cardData.n >= 200 && cardData.n <= 300 ? "text-emerald-600" : "text-amber-600";
  const kColor = cardData.k >= 150 && cardData.k <= 250 ? "text-emerald-600" : "text-amber-600";
  const ocColor = cardData.oc >= 0.5 && cardData.oc <= 0.75 ? "text-emerald-600" : "text-amber-600";

  if (compact) {
    // Compact version for WhatsApp chat
    return (
      <div className="space-y-2 text-[10px]">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[9px] text-slate-500">Farmer</p>
            <p className="text-[10px] font-medium text-slate-800">{cardData.farmerName}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-500">Village</p>
            <p className="text-[10px] font-medium text-slate-800">{cardData.village}</p>
          </div>
        </div>
        <div className="rounded border border-slate-300 bg-slate-50 overflow-hidden">
          <table className="w-full text-[9px]">
            <thead className="bg-slate-200 text-slate-700">
              <tr>
                <th className="px-1.5 py-0.5 text-left">Parameter</th>
                <th className="px-1.5 py-0.5 text-left">Result</th>
                <th className="px-1.5 py-0.5 text-left">Ideal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="px-1.5 py-0.5 text-slate-700">pH</td>
                <td className={`px-1.5 py-0.5 ${phColor} font-medium`}>{cardData.ph}</td>
                <td className="px-1.5 py-0.5 text-slate-500">6.5-7.5</td>
              </tr>
              <tr>
                <td className="px-1.5 py-0.5 text-slate-700">OC %</td>
                <td className={`px-1.5 py-0.5 ${ocColor} font-medium`}>{cardData.oc}</td>
                <td className="px-1.5 py-0.5 text-slate-500">0.5-0.75</td>
              </tr>
              <tr>
                <td className="px-1.5 py-0.5 text-slate-700">N (kg/ha)</td>
                <td className={`px-1.5 py-0.5 ${nColor} font-medium`}>{cardData.n}</td>
                <td className="px-1.5 py-0.5 text-slate-500">200-300</td>
              </tr>
              <tr>
                <td className="px-1.5 py-0.5 text-slate-700">P (kg/ha)</td>
                <td className={`px-1.5 py-0.5 ${pColor} font-medium`}>{cardData.p}</td>
                <td className="px-1.5 py-0.5 text-slate-500">10-25</td>
              </tr>
              <tr>
                <td className="px-1.5 py-0.5 text-slate-700">K (kg/ha)</td>
                <td className={`px-1.5 py-0.5 ${kColor} font-medium`}>{cardData.k}</td>
                <td className="px-1.5 py-0.5 text-slate-500">150-250</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[9px] text-slate-600 italic">
          {cardData.advisory}
        </p>
      </div>
    );
  }

  // Full version for standalone display
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 text-xs">
      <header className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
            Demo Only
          </p>
          <h2 className="text-sm font-semibold text-slate-100">
            Sample Soil Health Card
          </h2>
        </div>
        <div className="text-right text-[10px] text-slate-400">
          <p>मृदा आरोग्य कार्ड (DEMO)</p>
          <p>मिट्टी स्वास्थ्य कार्ड (DEMO)</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400">Farmer Name / शेतकरी</p>
          <p className="text-xs font-medium text-slate-100">{cardData.farmerName}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400">Village / गाव</p>
          <p className="text-xs font-medium text-slate-100">{cardData.village}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400">Soil Sample ID</p>
          <p className="text-xs font-medium text-slate-100">{cardData.sampleId}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400">Sample Date</p>
          <p className="text-xs font-medium text-slate-100">{cardData.date}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead className="bg-slate-900/80 text-slate-300">
            <tr>
              <th className="px-2 py-1 text-left">Parameter</th>
              <th className="px-2 py-1 text-left">Result</th>
              <th className="px-2 py-1 text-left">Ideal Range</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            <tr>
              <td className="px-2 py-1">pH</td>
              <td className={`px-2 py-1 ${phColor.replace("600", "300")} font-medium`}>{cardData.ph}</td>
              <td className="px-2 py-1 text-slate-400">6.5 – 7.5</td>
            </tr>
            <tr>
              <td className="px-2 py-1">
                Organic Carbon
                <span className="block text-[10px] text-slate-500">
                  सेंद्रिय कार्बन
                </span>
              </td>
              <td className={`px-2 py-1 ${ocColor.replace("600", "300")} font-medium`}>{cardData.oc} %</td>
              <td className="px-2 py-1 text-slate-400">0.5 – 0.75 %</td>
            </tr>
            <tr>
              <td className="px-2 py-1">
                Available N
                <span className="block text-[10px] text-slate-500">
                  नायट्रोजन (kg/ha)
                </span>
              </td>
              <td className={`px-2 py-1 ${nColor.replace("600", "300")} font-medium`}>{cardData.n}</td>
              <td className="px-2 py-1 text-slate-400">200 – 300</td>
            </tr>
            <tr>
              <td className="px-2 py-1">
                Available P
                <span className="block text-[10px] text-slate-500">
                  फॉस्फरस (kg/ha)
                </span>
              </td>
              <td className={`px-2 py-1 ${pColor.replace("600", "300")} font-medium`}>{cardData.p}</td>
              <td className="px-2 py-1 text-slate-400">10 – 25</td>
            </tr>
            <tr>
              <td className="px-2 py-1">
                Available K
                <span className="block text-[10px] text-slate-500">
                  पोटॅश (kg/ha)
                </span>
              </td>
              <td className={`px-2 py-1 ${kColor.replace("600", "300")} font-medium`}>{cardData.k}</td>
              <td className="px-2 py-1 text-slate-400">150 – 250</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* <div className="space-y-1">
        <p className="text-[10px] text-slate-400">Advisory (DEMO)</p>
        <p className="text-[11px] text-slate-200">
          pH थोडा कमी असल्याने चुना / लाइमिंगची गरज, फॉस्फरस कमी असल्याने P
          खतांची भर घालणे फायदेशीर. प्रत्यक्ष सल्ला स्थानिक कृषी अधिकारी व
          अधिकृत मार्गदर्शक सूचनांवर आधारित घ्या.
        </p>
      </div>

      <p className="text-[9px] text-slate-500">
        This is a demo visualization. In the full system, this card image will
        be read using Amazon Textract + RAG to auto-generate personalized
        fertilizer plans.
      </p> */}
    </section>
  );
}

