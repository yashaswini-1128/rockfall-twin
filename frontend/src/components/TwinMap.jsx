// src/components/TwinMap.jsx
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { safeGet } from "../lib/api";

// Turn leaflet LatLngBounds into bbox string: minLon,minLat,maxLon,maxLat
function boundsToBbox(bounds) {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  // leaflet gives (lat, lng); API wants (lon, lat)
  const minLon = sw.lng, minLat = sw.lat, maxLon = ne.lng, maxLat = ne.lat;
  return `${minLon},${minLat},${maxLon},${maxLat}`;
}

function colorByRisk(v) {
  const x = Number(v || 0);
  if (x >= 70) return "#ef4444";   // high
  if (x >= 40) return "#f59e0b";   // medium
  return "#22c55e";                // low
}

/** Internal control to subscribe to map moveend and notify parent */
function ViewWatcher({ onViewChange }) {
  const map = useMap();

  // debounced notifier
  const handler = useMemo(() => {
    let t = null;
    return () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        const b = map.getBounds();
        onViewChange(b);
      }, 250);
    };
  }, [map, onViewChange]);

  useEffect(() => {
    // initial fire on mount
    handler();
    map.on("moveend", handler);
    return () => {
      map.off("moveend", handler);
    };
  }, [map, handler]);

  return null;
}

export default function TwinMap() {
  const [roads, setRoads] = useState(null);   // GeoJSON
  const [zones, setZones] = useState(null);   // GeoJSON with properties.risk
  const [sensors, setSensors] = useState([]); // [{id, lat, lon, risk, ts}]
  const [bbox, setBbox] = useState(null);     // string
  const mapRef = useRef();

  const onViewChange = useCallback((bounds) => {
    setBbox(boundsToBbox(bounds));
  }, []);

  // Load roads/zones whenever bbox changes
  useEffect(() => {
    let stop = false;
    if (!bbox) return;

    (async () => {
      const [r, z] = await Promise.all([
        safeGet(`/api/roads?bbox=${encodeURIComponent(bbox)}`, null),
        safeGet(`/api/zones?bbox=${encodeURIComponent(bbox)}`, null),
      ]);
      if (!stop) { setRoads(r); setZones(z); }
    })();

    return () => { stop = true; };
  }, [bbox]);

  // Load sensors every 5s in current bbox
  useEffect(() => {
    let stop = false;
    if (!bbox) return;

    const load = async () => {
      const pts = await safeGet(`/api/sensors/latest?bbox=${encodeURIComponent(bbox)}`, []);
      if (!stop) setSensors(pts || []);
    };
    load();
    const id = setInterval(load, 5000);
    return () => { stop = true; clearInterval(id); };
  }, [bbox]);

  return (
    <div style={styles.panel}>
      <div style={styles.headerRow}>
        <h3 style={styles.h3}>Digital Twin Map (global)</h3>
        <div style={styles.hint}>
          Pan/zoom anywhere. Data loads for the current view.
        </div>
      </div>

      <div style={styles.mapWrap}>
        <MapContainer
          ref={(m)=> (mapRef.current = m)}
          center={[20, 0]}     // world
          zoom={2}
          worldCopyJump
          style={{ height:"100%", width:"100%" }}
        >
          {/* Professional road tiles (CARTO Voyager) */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap &copy; CARTO"
          />

          {/* watch view changes */}
          <ViewWatcher onViewChange={onViewChange} />

          {/* Roads (LineString) */}
          {roads && <GeoJSON data={roads} style={{ color:"#2970ff", weight:2 }} />}

          {/* Risk zones (Polygon) with risk property */}
          {zones && (
            <GeoJSON
              data={zones}
              style={(feature) => {
                const r = feature?.properties?.risk ?? 0;
                const c = colorByRisk(r);
                return { color:c, fillColor:c, weight:1, fillOpacity:.25 };
              }}
            />
          )}

          {/* Sensor bubbles */}
          {Array.isArray(sensors) && sensors.map((s) => (
            (s.lat != null && s.lon != null) ? (
              <CircleMarker
                key={s.id || `${s.lat},${s.lon},${s.ts || ""}`}
                center={[s.lat, s.lon]}
                radius={7}
                pathOptions={{
                  color: colorByRisk(s.risk),
                  fillColor: colorByRisk(s.risk),
                  fillOpacity: 0.95,
                }}
              >
                <Tooltip>
                  <b>{s.id || "sensor"}</b><br/>
                  Risk: {s.risk ?? "—"}%<br/>
                  <span style={{opacity:.7, fontSize:12}}>
                    {s.ts ? new Date(s.ts).toLocaleString() : ""}
                  </span>
                </Tooltip>
              </CircleMarker>
            ) : null
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

const styles = {
  panel:{ background:"#0f172a", border:"1px solid rgba(255,255,255,.08)", borderRadius:14, padding:12 },
  headerRow:{ display:"flex", alignItems:"baseline", gap:12, justifyContent:"space-between" },
  h3:{ margin:"6px 0" },
  hint:{ color:"#9ca3af", fontSize:12 },
  mapWrap:{ height:520, borderRadius:14, overflow:"hidden", border:"1px solid rgba(255,255,255,.08)" }
};
