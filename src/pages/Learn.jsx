import { useMemo, useState } from "react";
import "../styles/learn.css";

const SECTIONS = [
  {
    key: "quickstart",
    title: "Quick Start",
    body: (
      <>
        <ol className="learn-steps">
          <li>
            Go to <strong>Crops</strong> and add at least one crop.
          </li>
          <li>
            Set a <strong>Current Crop</strong> (this is what the dashboard monitors).
          </li>
          <li>
            Open <strong>Dashboard</strong> to see live readings and crop health.
          </li>
          <li>
            Use <strong>Water Now</strong> to log/manual irrigate, or turn <strong>Auto Water</strong> ON.
          </li>
        </ol>
        <p className="learn-note">
          Tip: Shamba-Smart is a simulation demo for now, but the concepts match real smart-farm dashboards.
        </p>
      </>
    ),
  },
  {
    key: "concepts",
    title: "Core Concepts",
    body: (
      <div className="learn-grid">
        <div className="learn-card">
          <h3>Soil Moisture</h3>
          <p>
            Represents how wet the soil is. If moisture is below your crop’s target range,
            the crop becomes stressed and health drops.
          </p>
        </div>

        <div className="learn-card">
          <h3>Temperature</h3>
          <p>
            Represents heat/cold stress. If the temperature falls outside the crop’s ideal range,
            crop health decreases.
          </p>
        </div>

        <div className="learn-card">
          <h3>Weather</h3>
          <p>
            Gives context (e.g., Rainy can help conditions). Later, this is where real weather data can plug in.
          </p>
        </div>

        <div className="learn-card">
          <h3>Crop Health</h3>
          <p>
            A simple score (0–100) that summarizes how the crop is doing based on conditions.
            It’s the “plant well-being” indicator.
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "irrigation",
    title: "Irrigation Modes",
    body: (
      <div className="learn-two-col">
        <div className="learn-panel">
          <h3>Water Now</h3>
          <p className="learn-muted">
            Manual irrigation tracking.
          </p>
          <ul className="learn-list">
            <li>You press it when you irrigate (or to simulate that you irrigated).</li>
            <li>Moisture increases, last-watered resets, health improves.</li>
            <li>Works best when Auto Water is OFF.</li>
          </ul>
        </div>

        <div className="learn-panel">
          <h3>Auto Water</h3>
          <p className="learn-muted">
            Automatic irrigation simulation.
          </p>
          <ul className="learn-list">
            <li>If moisture drops below a crop threshold, the system “waters” automatically.</li>
            <li>Useful to demonstrate smart irrigation logic.</li>
            <li>In real IoT, this would control a pump/valve.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    key: "profiles",
    title: "Crop Profiles",
    body: (
      <>
        <p className="learn-paragraph">
          A crop profile defines the <strong>ideal moisture</strong> and <strong>ideal temperature</strong> range.
          Different crops have different tolerances — that’s why the same environment may be “good” for maize but “bad” for beans.
        </p>

        <div className="learn-grid">
          <div className="learn-card">
            <h3>Recommended Profile</h3>
            <p>
              If a crop name matches a known preset (e.g. maize, tomato), the app assigns recommended ranges.
            </p>
          </div>

          <div className="learn-card">
            <h3>Generic Profile</h3>
            <p>
              If a crop name is unknown, the app uses a safe default profile. You can edit it.
            </p>
          </div>

          <div className="learn-card">
            <h3>Custom Profile</h3>
            <p>
              You edit moisture/temp ranges to match your farm environment or research values.
            </p>
          </div>

          <div className="learn-card">
            <h3>Why it matters</h3>
            <p>
              Profiles make the dashboard “crop-aware”, not just a random sensor display.
            </p>
          </div>
        </div>
      </>
    ),
  },
];

const FAQS = [
  {
    q: "Is the data real-time from the real world?",
    a: "Right now it’s simulated real-time (values update automatically). Later, temperature/weather can be replaced with a real weather API, and soil moisture can come from sensors or a model.",
  },
  {
    q: "Why does health change even if I don’t press anything?",
    a: "Because environmental conditions change. If moisture/temperature move outside the crop’s ideal range, health drops. If conditions are optimal, health improves.",
  },
  {
    q: "What happens if I remove all crops?",
    a: "The dashboard shows a friendly “No crops yet” message. Add a crop in the Crops page to resume monitoring.",
  },
  {
    q: "Should farmers press Water Now every time they irrigate?",
    a: "In manual mode, yes — the button represents logging/triggering an irrigation event. If Auto Water is ON, the system handles watering automatically.",
  },
];

function Learn() {
  const [activeKey, setActiveKey] = useState("quickstart");
  const [openFaq, setOpenFaq] = useState(0);

  const active = useMemo(
    () => SECTIONS.find((s) => s.key === activeKey) || SECTIONS[0],
    [activeKey]
  );

  return (
    <div className="learn-page">
      <header className="learn-hero">
        <p className="learn-kicker">Learn</p>
        <h1 className="learn-title">Understand the dashboard, the logic, and the meaning.</h1>
        <p className="learn-subtitle">
          This page explains how Shamba-Smart works — from crop profiles to irrigation modes — in a clear, practical way.
        </p>
      </header>

      <section className="learn-shell">
        <aside className="learn-nav">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              className={`learn-nav-btn ${s.key === activeKey ? "active" : ""}`}
              onClick={() => setActiveKey(s.key)}
              type="button"
            >
              {s.title}
            </button>
          ))}
        </aside>

        <main className="learn-content">
          <div className="learn-content-head">
            <h2>{active.title}</h2>
            <p className="learn-muted">
              Move through the topics on the left. Keep it simple — you’re building a real system.
            </p>
          </div>

          <div className="learn-content-body">{active.body}</div>
        </main>
      </section>

      <section className="learn-faq">
        <div className="learn-faq-head">
          <h2>FAQ</h2>
          <p className="learn-muted">Common questions that explain the “why” behind the features.</p>
        </div>

        <div className="faq-list">
          {FAQS.map((f, idx) => {
            const opened = openFaq === idx;
            return (
              <div key={f.q} className={`faq-item ${opened ? "open" : ""}`}>
                <button
                  className="faq-q"
                  onClick={() => setOpenFaq(opened ? -1 : idx)}
                  type="button"
                >
                  <span>{f.q}</span>
                  <span className="faq-icon">{opened ? "—" : "+"}</span>
                </button>
                {opened && <div className="faq-a">{f.a}</div>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Learn;
