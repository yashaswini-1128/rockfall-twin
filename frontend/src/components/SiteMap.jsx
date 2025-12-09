import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { safeGet } from "../lib/api";

const WORLD_CENTER = [20, 0]; // show entire world initially
const WORLD_ZOOM = 2;

export default function SiteMap() {
  const [country, setCountry] = useState("IN");
  const [state, setState] = useState("");
  const [area, setArea] = useState("");
  const [roads, setRoads] = useState(null);
  const [zones, setZones] = useState(null);

  const mapRef = useRef();

  // Basic country list (ISO2) – keep short but global
  const countries = [
    { code: "IN", name: "India" },
    { code: "US", name: "United States" },
    { code: "AU", name: "Australia" },
    { code: "BR", name: "Brazil" },
    { code: "ZA", name: "South Africa" },
    { code: "CN", name: "China" },
    { code: "JP", name: "Japan" },
    { code: "GB", name: "United Kingdom" },
    { code: "FR", name: "France" },
    { code: "IT", name: "Italy" },
  ];

  async function loadLayers() {
    // compute bbox from map view
    const map = mapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    const bbox = [
      bounds.getSouthWest().lng,
      bounds.getSouthWest().lat,
      bounds.getNorthEast().lng,
      bounds.getNorthEast().lat,
    ].join(",");

    const r = await safeGet(`/api/roads?country=${country}&state=${encodeURIComponent(state)}&area=${encodeURIComponent(area)}&bbox=${bbox}`, null);
    const z = await safeGet(`/api/risk/zones?bbox=${bbox}`, null);
    setRoads(r);
    setZones(z);
  }

  useEffect(() => {
    // initial load after first render
    const t = setTimeout(loadLayers, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, []);

  return (
    <>
      <div className="map-toolbar">
        <select className="select" value={country} onChange={(e)=>setCountry(e.target.value)}>
          {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        <input
          className="input"
          placeholder="State/Province (optional)"
          value={state}
          onChange={(e)=>setState(e.target.value)}
        />
        <input
          className="input"
          placeholder="Area/City (optional)"
          value={area}
          onChange={(e)=>setArea(e.target.value)}
        />
        <button className="btn" onClick={loadLayers}>Go</button>
      </div>

      <div className="map-container" style={{height:"520px"}}>
        <MapContainer
          center={WORLD_CENTER}
          zoom={WORLD_ZOOM}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(m)=> (mapRef.current = m)}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Roads (GeoJSON LineStrings) */}
          {roads && (
            <GeoJSON
              data={roads}
              style={() => ({ color: "#38bdf8", weight: 2 })}
            />
          )}

          {/* Risk zones (GeoJSON Polygons) */}
          {zones && (
            <GeoJSON
              data={zones}
              style={(feat) => {
                const lvl = feat?.properties?.level || "low";
                return {
                  color: lvl === "high" ? "#ef4444" : lvl === "medium" ? "#f59e0b" : "#22c55e",
                  weight: 1,
                  fillOpacity: 0.2,
                };
              }}
            />
          )}
        </MapContainer>
      </div>
    </>
  );
}
