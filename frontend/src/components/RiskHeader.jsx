import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { safeGet, api } from "../lib/api";

function pillClass(level) {
  const base = "px-3 py-1 rounded-full text-sm font-semibold";
  if (level === "High") return `${base} bg-red-600/20 text-red-300 border border-red-600/40`;
  if (level === "Medium") return `${base} bg-amber-600/20 text-amber-300 border border-amber-600/40`;
  return `${base} bg-emerald-600/20 text-emerald-300 border border-emerald-600/40`;
}

export default function RiskHeader() {
  const [risk, setRisk] = useState({ level: "Low", score: 0 });

  useEffect(() => {
    let stop = false;

    async function load() {
      // expects {score: number (0-100), level: "Low|Medium|High"}
      const r = await safeGet("/api/risk/latest", { score: 0, level: "Low" });
      if (!stop) {
        setRisk(r);
        if (r.level === "High") toast.error(`⚠️ High risk detected (${r.score}%)`);
      }
    }

    load();
    const id = setInterval(load, 5000);
    return () => { stop = true; clearInterval(id); };
  }, []);

  async function runWhatIf() {
    // demo: 20mm/hr rain for 2h → backend computes scenario & returns risk
    const res = await safeGet("/api/whatif?rain_mmhr=20&hours=2", { score: 0, level: "Low" });
    toast(`What-if risk: ${res.level} (${res.score}%)`);
  }

  return (
    <div className="flex items-center justify-between w-full bg-[#0B1220] border border-white/5 rounded-2xl p-4 shadow">
      <div>
        <div className="text-2xl font-bold text-white">AI Rockfall Prediction Dashboard</div>
        <div className="text-sm text-white/60">Live digital-twin state • updates every 5s</div>
      </div>

      <div className="flex items-center gap-3">
        <span className={pillClass(risk.level)}>
          {risk.level} • {Math.round(risk.score)}%
        </span>
        <button
          onClick={runWhatIf}
          className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition"
        >
          ☔ What-if: Rain 20 mm/h (2h)
        </button>
      </div>
    </div>
  );
}
<div className="controls">
  <select value={country} onChange={e => setCountry(e.target.value)}>
    {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
  </select>
  <select value={region} onChange={e => setRegion(e.target.value)}>
    {regions.map(r => <option key={r} value={r}>{r}</option>)}
  </select>
  <span className={`risk-badge ${latestRisk?.color || 'green'}`}>
    {latestRisk?.level || 'Low'}
  </span>
</div>
