import { useEffect, useState } from "react";
import { safeGet } from "../lib/api";

export default function KPIs() {
  const [kpi, setKpi] = useState({
    rainfall: 0, temp: 0, humidity: 0, activeAlerts: 0
  });

  useEffect(() => {
    const load = async () => {
      // expects { rainfall_mm_24h, temp_c, humidity, active_alerts }
      const d = await safeGet("/api/kpis", null);
      if (d) {
        setKpi({
          rainfall: d.rainfall_mm_24h ?? 0,
          temp: d.temp_c ?? 0,
          humidity: d.humidity ?? 0,
          activeAlerts: d.active_alerts ?? 0
        });
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="kpis">
      <div className="kpi">
        <h4>Rain (24h)</h4>
        <p>{kpi.rainfall.toFixed(1)} mm</p>
      </div>
      <div className="kpi">
        <h4>Temperature</h4>
        <p>{kpi.temp.toFixed(1)} °C</p>
      </div>
      <div className="kpi">
        <h4>Humidity</h4>
        <p>{kpi.humidity.toFixed(0)} %</p>
      </div>
      <div className="kpi">
        <h4>Active Alerts</h4>
        <p>{kpi.activeAlerts}</p>
      </div>
    </div>
  );
}
