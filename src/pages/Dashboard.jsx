import { useEffect, useMemo, useState } from "react";
import StatCard from "../components/StatCard";
import "../styles/dashboard.css";

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function healthLabel(score) {
  if (score >= 80) return { text: "Excellent", cls: "health-good" };
  if (score >= 60) return { text: "Good", cls: "health-mid" };
  if (score >= 40) return { text: "Warning", cls: "health-warn" };
  return { text: "Critical", cls: "health-critical" };
}

function trend(current, previous) {
  if (previous === undefined || previous === null) return "";
  if (current > previous) return "↑";
  if (current < previous) return "↓";
  return "→";
}

function Dashboard({ currentCrop, setCrops }) {
  // ✅ Guard: if user removed all crops
  if (!currentCrop) {
    return (
      <div className="dashboard">
        <h1>Farm Dashboard</h1>

        <div className="farm-status">
          <h2>No crops yet</h2>
          <p>Go to the Crops page and add your first crop to start monitoring.</p>
        </div>
      </div>
    );
  }

  // Sensors
  const [temperature, setTemperature] = useState(28);
  const [moisture, setMoisture] = useState(65);
  const [weather, setWeather] = useState("Sunny");

  // ✅ History (store last 10 readings)
  const [history, setHistory] = useState([]);

  // ✅ Irrigation log (store last 5 events) - NOT persisted, just session
  const [irrigationLog, setIrrigationLog] = useState([]);

  // ✅ Controls
  const [paused, setPaused] = useState(false);
  const [tickMs, setTickMs] = useState(3000);

  // ✅ Crop profile ranges (safe fallbacks)
  const idealMoisture = currentCrop.idealMoisture ?? { min: 55, max: 70 };
  const idealTemp = currentCrop.idealTemp ?? { min: 24, max: 32 };
  const profileLabel = currentCrop.profileLabel ?? "Generic profile";

  // helper to update only current crop in crops array
  const updateCurrentCrop = (patchOrFn) => {
    setCrops((prev) =>
      prev.map((c) => {
        if (c.id !== currentCrop.id) return c;
        const patch = typeof patchOrFn === "function" ? patchOrFn(c) : patchOrFn;
        return { ...c, ...patch };
      })
    );
  };

  // ✅ push irrigation event to log
  const pushLog = (type, before, after) => {
    setIrrigationLog((prev) => {
      const next = [
        { id: crypto.randomUUID(), t: Date.now(), type, before, after },
        ...prev,
      ];
      return next.slice(0, 5);
    });
  };

  // ✅ Simulate sensors + time passing
  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      const newTemp = Math.floor(Math.random() * 11) + 25; // 25–35
      const newMoisture = Math.floor(Math.random() * 41) + 40; // 40–80
      const weathers = ["Sunny", "Cloudy", "Rainy"];
      const newWeather = weathers[Math.floor(Math.random() * weathers.length)];

      setTemperature(newTemp);
      setMoisture(newMoisture);
      setWeather(newWeather);

      // Save reading to history (keep last 10)
      setHistory((prev) => {
        const next = [
          { t: Date.now(), temperature: newTemp, moisture: newMoisture, weather: newWeather },
          ...prev,
        ];
        return next.slice(0, 10);
      });

      // time passing
      updateCurrentCrop((c) => ({
        lastWateredMinutes: (c.lastWateredMinutes ?? 0) + Math.round(tickMs / 1000),
      }));
    }, tickMs);

    return () => clearInterval(interval);
  }, [currentCrop.id, tickMs, paused]);

  // ✅ Crop-aware health logic
  useEffect(() => {
    let delta = 0;

    if (moisture < idealMoisture.min) delta -= 3;
    else if (moisture > idealMoisture.max) delta -= 2;
    else delta += 1;

    if (temperature < idealTemp.min) delta -= 1;
    else if (temperature > idealTemp.max) delta -= 2;
    else delta += 1;

    if (weather === "Rainy" && moisture < idealMoisture.min) delta += 1;

    updateCurrentCrop((c) => ({
      health: clamp((c.health ?? 70) + delta, 0, 100),
    }));
  }, [temperature, moisture, weather, currentCrop.id]);

  // ✅ Auto-water + logging
  useEffect(() => {
    if (!currentCrop.autoWater) return;

    const trigger = idealMoisture.min - 3;
    if (moisture < trigger) {
      const before = moisture;
      const after = clamp(moisture + 15, 0, 100);

      setMoisture(after);
      pushLog("Auto", before, after);

      updateCurrentCrop((c) => ({
        lastWateredMinutes: 0,
        health: clamp((c.health ?? 70) + 4, 0, 100),
      }));
    }
  }, [moisture, currentCrop.autoWater, currentCrop.id]);

  // ✅ Manual water + logging
  const waterNow = () => {
    const before = moisture;

    setMoisture((m) => {
      const after = clamp(m + 12, 0, 100);
      pushLog("Manual", before, after);
      return after;
    });

    updateCurrentCrop((c) => ({
      lastWateredMinutes: 0,
      health: clamp((c.health ?? 70) + 3, 0, 100),
    }));
  };

  const toggleAutoWater = () => {
    updateCurrentCrop((c) => ({ autoWater: !c.autoWater }));
  };

  // Alerts derived from crop-aware logic
  const alerts = useMemo(() => {
    let a = 0;
    if (temperature > idealTemp.max) a++;
    if (temperature < idealTemp.min) a++;
    if (moisture < idealMoisture.min) a++;
    if (moisture > idealMoisture.max) a++;
    if ((currentCrop.health ?? 70) < 40) a++;
    return a;
  }, [temperature, moisture, currentCrop.health, idealMoisture, idealTemp]);

  // Trends
  const prevTemp = history[1]?.temperature;
  const prevMoist = history[1]?.moisture;
  const tempTrend = trend(temperature, prevTemp);
  const moistTrend = trend(moisture, prevMoist);

  const stats = [
    { id: 1, title: "Temperature", value: `${temperature}°C ${tempTrend}` },
    { id: 2, title: "Soil Moisture", value: `${moisture}% ${moistTrend}` },
    { id: 3, title: "Weather", value: weather },
    { id: 4, title: "Alerts", value: alerts },
  ];

  const hl = healthLabel(currentCrop.health ?? 70);

  return (
    <div className="dashboard">
      <h1>Farm Dashboard</h1>

      <div className="stats-grid">
        {stats.map((s) => (
          <StatCard key={s.id} title={s.title} value={s.value} />
        ))}
      </div>

      {/* ✅ Simulation Controls */}
      <div className="controls">
        <div className="controls-left">
          <h3>Simulation Controls</h3>
          <p>Adjust update speed or pause the live readings.</p>
        </div>

        <div className="controls-right">
          <label>
            Update interval
            <select value={tickMs} onChange={(e) => setTickMs(Number(e.target.value))}>
              <option value={3000}>3 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
            </select>
          </label>

          <button className="btn btn-outline" onClick={() => setPaused((p) => !p)}>
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
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
              <strong>Profile:</strong> {profileLabel}
            </p>
            <p>
              <strong>Target moisture:</strong> {idealMoisture.min}–{idealMoisture.max}%
            </p>
            <p>
              <strong>Target temp:</strong> {idealTemp.min}–{idealTemp.max}°C
            </p>

            <p>
              <strong>Health:</strong>{" "}
              <span className={hl.cls}>
                {hl.text} ({currentCrop.health}/100)
              </span>
            </p>

            <p>
              <strong>Last Watered:</strong> {currentCrop.lastWateredMinutes} minutes ago
            </p>
          </div>

          <div className="actions">
            <button className="btn" onClick={waterNow}>
              Water Now!
            </button>

            <button className="btn btn-outline" onClick={toggleAutoWater}>
              Auto Water: {currentCrop.autoWater ? "ON" : "OFF"}
            </button>

            <p className="hint">Auto-water triggers slightly below the crop’s target minimum.</p>
          </div>
        </div>

        <div className="smart-notes">
          <h3>Smart Insights</h3>
          <ul>
            {moisture < idealMoisture.min && (
              <li>
                Moisture is below target for {currentCrop.name} (min {idealMoisture.min}%).
              </li>
            )}
            {moisture > idealMoisture.max && (
              <li>
                Moisture is above target for {currentCrop.name} (max {idealMoisture.max}%).
              </li>
            )}
            {temperature > idealTemp.max && (
              <li>
                Temperature is too high for {currentCrop.name} (max {idealTemp.max}°C).
              </li>
            )}
            {temperature < idealTemp.min && (
              <li>
                Temperature is too low for {currentCrop.name} (min {idealTemp.min}°C).
              </li>
            )}
            {weather === "Rainy" && <li>Rain detected — moisture may improve.</li>}
            {alerts === 0 && <li>Conditions look stable. Keep monitoring.</li>}
          </ul>
        </div>
      </div>

      {/* ✅ Recent Readings (store 10, show 5) */}
      {history.length > 0 && (
        <div className="history">
          <h3>Recent Readings</h3>
          <div className="history-list">
            {history.slice(0, 5).map((h) => (
              <div className="history-item" key={h.t}>
                <span className="history-time">
                  {new Date(h.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="history-val">{h.moisture}%</span>
                <span className="history-val">{h.temperature}°C</span>
                <span className="history-weather">{h.weather}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ Irrigation Log */}
      <div className="irrigation">
        <h3>Irrigation Log</h3>

        {irrigationLog.length === 0 ? (
          <p className="irrigation-empty">No irrigation events yet.</p>
        ) : (
          <div className="irrigation-list">
            {irrigationLog.map((x) => (
              <div className="irrigation-item" key={x.id}>
                <span className="irrigation-time">
                  {new Date(x.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="irrigation-type">{x.type}</span>
                <span className="irrigation-change">
                  {x.before}% → {x.after}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
