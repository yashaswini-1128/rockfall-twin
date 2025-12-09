import { useEffect, useState } from "react";
import { getRoads, getLatestRisk } from "../lib/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function Dashboard() {
  const [roads, setRoads] = useState([]);
  const [risk, setRisk] = useState(null);

  useEffect(() => {
    getRoads().then(setRoads);
    getLatestRisk().then(setRisk);
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold">Rockfall Digital Twin Dashboard</h1>

      <MapContainer center={[12.9716, 77.5946]} zoom={7} style={{ height: "500px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {roads.map((road) => (
          <Marker key={road.id} position={[road.lat, road.lon]}>
            <Popup>
              <b>{road.name}</b> <br />
              Status: {road.status}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {risk && (
        <div className="mt-4 p-4 border rounded">
          <h2 className="font-bold">Latest Risk Alert 🚨</h2>
          <p>Road ID: {risk.road_id}</p>
          <p>Risk Level: {risk.risk_level}</p>
          <p>Rainfall: {risk.rainfall} mm</p>
          <p>Temp: {risk.temp} °C</p>
          <p>Humidity: {risk.humidity} %</p>
        </div>
      )}
    </div>
  );
}
