import AlertBanner from "./components/AlertBanner";
import KPIs from "./components/KPIs";
import TrendChart from "./components/TrendChart";
import TwinMap from "./components/TwinMap";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <AlertBanner />
      <div className="p-6 space-y-6">
        <KPIs />
        <TrendChart />
        <TwinMap />
      </div>
      <footer className="bg-gray-900 text-white text-center py-4 mt-6">
        Digital Twin Rockfall Prediction – Powered by OpenWeather & AI
      </footer>
    </div>
  );
}
