import { useEffect, useMemo, useState } from "react";
import StatCard from "../components/StatCard";
import "../styles/dashboard.css";

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function healthLabel(score) {
  if (score >= 80) return { text: "Excellent ✅", cls: "health-good" };
  if (score >= 60) return { text: "Good 🙂", cls: "health-mid" };
  if (score >= 40) return { text: "Warning ⚠", cls: "health-warn" };
  return { text: "Critical 🚨", cls: "health-critical" };
}

function Dashboard() {
  // ✅ Sensor states (alive)
  const [temperature, setTemperature] = useState(28); // °C
  const [moisture, setMoisture] = useState(65); // %
  const [weather, setWeather] = useState("Sunny");

  // ✅ Farm / crop state (this is what user will later add to)
  const [currentCrop, setCurrentCrop] = useState({
    name: "Maize",
    stage: "Vegetative",
    health: 78, // 0–100
    lastWateredMinutes: 180, // 3 hours ago
    autoWater: false,
  });

  // --- SENSOR SIMULATION LOOP ---
  useEffect(() => {
    const interval = setInterval(() => {
      const newTemp = Math.floor(Math.random() * 11) + 25; // 25–35
      const newMoisture = Math.floor(Math.random() * 41) + 40; // 40–80
      const weathers = ["Sunny", "Cloudy", "Rainy"];
      const newWeather = weathers[Math.floor(Math.random() * weathers.length)];

      setTemperature(newTemp);
      setMoisture(newMoisture);
      setWeather(newWeather);

      // time passes
      setCurrentCrop((prev) => ({
        ...prev,
        lastWateredMinutes: prev.lastWateredMinutes + 3, // because interval is 3 sec; pretend it's 3 minutes
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // --- SMART LOGIC: sensors affect crop health ---
  useEffect(() => {
    setCurrentCrop((prev) => {
      let delta = 0;

      // moisture stress
      if (moisture < 50) delta -= 3;
      else if (moisture < 60) delta -= 1;
      else if (moisture > 75) delta -= 1; // too wet can also be bad

      // temperature stress
      if (temperature > 32) delta -= 2;
      else if (temperature < 26) delta -= 1;

      // rain can help moisture stress slightly
      if (weather === "Rainy" && moisture < 60) delta += 1;

      // small natural recovery if conditions are good
      const goodConditions =
        moisture >= 60 && moisture <= 75 && temperature >= 26 && temperature <= 32;
      if (goodConditions) delta += 1;

      const nextHealth = clamp(prev.health + delta, 0, 100);
      return { ...prev, health: nextHealth };
    });
  }, [temperature, moisture, weather]);

  // --- AUTO WATER LOGIC ---
  useEffect(() => {
    if (!currentCrop.autoWater) return;

    // If moisture too low, auto-water (raise moisture + reset lastWatered)
    if (moisture < 52) {
      setMoisture((m) => clamp(m + 15, 0, 100));
      setCurrentCrop((prev) => ({
        ...prev,
        lastWateredMinutes: 0,
        health: clamp(prev.health + 4, 0, 100),
      }));
    }
  }, [moisture, currentCrop.autoWater]);

  // manual water button
  function waterNow() {
    setMoisture((m) => clamp(m + 12, 0, 100));
    setCurrentCrop((prev) => ({
      ...prev,
      lastWateredMinutes: 0,
      health: clamp(prev.health + 3, 0, 100),
    }));
  }

  function toggleAutoWater() {
    setCurrentCrop((prev) => ({ ...prev, autoWater: !prev.autoWater }));
  }

  // --- ALERTS derived from current state ---
  const alerts = useMemo(() => {
    let a = 0;
    if (temperature > 32) a++;
    if (moisture < 50) a++;
    if (currentCrop.health < 40) a++;
    return a;
  }, [temperature, moisture, currentCrop.health]);

  const stats = [
    { id: 1, title: "Temperature", value: `${temperature}°C`, icon: "🌡" },
    { id: 2, title: "Soil Moisture", value: `${moisture}%`, icon: "💧" },
    { id: 3, title: "Weather", value: weather, icon: "☀" },
    { id: 4, title: "Alerts", value: alerts, icon: "🚨" },
  ];

  const hl = healthLabel(currentCrop.health);

  return (
    <div className="dashboard">
      <h1>Farm Dashboard </h1>

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="farm-status">
        <div className="farm-status-top">
          <div>
            <h2>Current Crop</h2>
            <p>
              <strong>Crop:</strong> {currentCrop.name} 
            </p>
            <p>
              <strong>Stage:</strong> {currentCrop.stage}
            </p>
            <p>
              <strong>Health:</strong>{" "}
              <span className={hl.cls}>
                {hl.text} ({currentCrop.health}/100)
              </span>
            </p>
            <p>
              <strong>Last Watered:</strong>{" "}
              {currentCrop.lastWateredMinutes} minutes ago
            </p>
          </div>

          <div className="actions">
            <button className="btn" onClick={waterNow}>
              Water Now !
            </button>

            <button className="btn btn-outline" onClick={toggleAutoWater}>
              Auto Water: {currentCrop.autoWater ? "ON " : "OFF "}
            </button>

            <p className="hint">
              Auto-water triggers when moisture drops below ~52%.
            </p>
          </div>
        </div>

        <div className="smart-notes">
          <h3>Smart Insights</h3>
          <ul>
            {moisture < 50 && <li>Moisture is low — irrigation recommended.</li>}
            {temperature > 32 && <li>High temperature — risk of heat stress.</li>}
            {weather === "Rainy" && <li>Rain detected — moisture may improve.</li>}
            {alerts === 0 && <li>Conditions look stable. Keep monitoring.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;