import { useEffect, useState } from "react";
import { safeGet } from "../lib/api";

export default function AlertBanner() {
  const [risk, setRisk] = useState(null);

  useEffect(() => {
    const tick = async () => {
      // expects { risk: 0..100, level: "low|medium|high", location:"..." }
      const data = await safeGet("/api/risk/latest", null);
      setRisk(data);
    };
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  if (!risk) return null;

  const cls =
    risk.level === "high" ? "banner high" :
    risk.level === "medium" ? "banner med" : "banner low";

  const icon =
    risk.level === "high" ? "🚨" :
    risk.level === "medium" ? "⚠️" : "✅";

  return (
    <div className={cls}>
      <div style={{fontSize:"1.1rem"}}>{icon}</div>
      <div>
        <div style={{fontWeight:700}}>
          {risk.level.toUpperCase()} RISK — {Math.round(risk.risk)}%
        </div>
        <small>
          Location: {risk.location || "Selected area"} •
          &nbsp;Auto alerts enabled (SMS/Email)
        </small>
      </div>
    </div>
  );
}
