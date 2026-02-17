

import { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import "../styles/dashboard.css";

function Dashboard() {

  // SENSOR STATES
  const [temperature, setTemperature] = useState(28);
  const [moisture, setMoisture] = useState(65);
  const [weather, setWeather] = useState("Sunny");
  const [alerts, setAlerts] = useState(0);

  // SIMULATE SENSORS
  useEffect(() => {

    const interval = setInterval(() => {

      // Random temperature (25 - 35)
      const newTemp = Math.floor(Math.random() * 11) + 25;

      // Random moisture (40 - 80)
      const newMoisture = Math.floor(Math.random() * 41) + 40;

      // Random weather
      const weathers = ["Sunny", "Cloudy", "Rainy"];
      const newWeather =
        weathers[Math.floor(Math.random() * weathers.length)];

      // Alert logic
      let newAlerts = 0;

      if (newTemp > 32) newAlerts++;
      if (newMoisture < 50) newAlerts++;

      // Update states
      setTemperature(newTemp);
      setMoisture(newMoisture);
      setWeather(newWeather);
      setAlerts(newAlerts);

    }, 3000); // Every 3 seconds

    return () => clearInterval(interval);

  }, []);

  return (
    <div className="dashboard">

      <h1>Farm Dashboard </h1>

      {/* STAT CARDS */}
      <div className="stats-grid">

        <StatCard
          title="Temperature"
          value={`${temperature}°C`}
          icon="🌡"
        />

        <StatCard
          title="Soil Moisture"
          value={`${moisture}%`}
          icon="💧"
        />

        <StatCard
          title="Weather"
          value={weather}
          icon="☀"
        />

        <StatCard
          title="Alerts"
          value={alerts}
          icon="🚨"
        />

      </div>

      {/* FARM STATUS */}
      <div className="farm-status">

        <h2>Current Crop</h2>

        <p><strong>Crop:</strong> Maize </p>
        <p><strong>Stage:</strong> Vegetative</p>
        <p><strong>Health:</strong> {alerts > 0 ? "Warning " : "Good "}</p>
        <p><strong>Last Watered:</strong> 3 hours ago</p>

      </div>

    </div>
  );
}

export default Dashboard;