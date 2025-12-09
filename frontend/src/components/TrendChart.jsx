import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { safeGet } from "../lib/api";

export default function TrendChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      const rain = await safeGet("/api/timeseries?metric=rain&hours=24", []);
      const temp = await safeGet("/api/timeseries?metric=temp&hours=24", []);
      const hum  = await safeGet("/api/timeseries?metric=humidity&hours=24", []);
      const map = new Map();
      const add = (arr, key) => arr.forEach(d => {
        const t = d.t || d.ts;
        if (!map.has(t)) map.set(t, { t });
        map.get(t)[key] = d.value ?? d[key];
      });
      add(rain, "rain"); add(temp, "temp"); add(hum, "humidity");
      !stop && setData([...map.values()].sort((a,b)=>new Date(a.t)-new Date(b.t)));
    };
    load(); const id = setInterval(load, 10000);
    return () => { stop = true; clearInterval(id); };
  }, []);

  return (
    <div className="panel" style={{height:340}}>
      <h3 style={{margin:"6px 0"}}>Trends (24h)</h3>
      <div style={{width:"100%", height:280}}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="t" tickFormatter={(v)=>new Date(v).toLocaleTimeString()}/>
            <YAxis/>
            <Tooltip labelFormatter={(v)=>new Date(v).toLocaleString()}/>
            <Line type="monotone" dataKey="rain" stroke="#60A5FA" dot={false}/>
            <Line type="monotone" dataKey="temp" stroke="#F59E0B" dot={false}/>
            <Line type="monotone" dataKey="humidity" stroke="#34D399" dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
