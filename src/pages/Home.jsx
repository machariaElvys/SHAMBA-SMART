import { Link } from "react-router-dom";
import "../styles/home.css";

function Home() {
  return (
    <div className="home">
      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-content">
          <p className="home-kicker">Shamba-Smart</p>

          <h1 className="home-title">
            Smart crop monitoring, <span className="home-title-accent">simplified</span>.
          </h1>

          <p className="home-subtitle">
            Track crop conditions, record irrigation actions, and get clear insights from
            simulated real-time moisture and temperature data — built for future sensor/API integration.
          </p>

          <div className="home-cta">
            <Link className="btn" to="/dashboard">
              Open Dashboard
            </Link>
            <Link className="btn btn-outline" to="/crops">
              Manage Crops
            </Link>
          </div>

          <div className="home-proof">
            <span className="pill">Responsive UI</span>
            <span className="pill">Crop Profiles</span>
            <span className="pill">Auto / Manual Watering</span>
            <span className="pill">Smart Insights</span>
          </div>
        </div>

        <div className="home-hero-panel">
          <div className="panel-card">
            <div className="panel-row">
              <span className="panel-label">Current Crop</span>
              <span className="panel-value">Maize</span>
            </div>
            <div className="panel-row">
              <span className="panel-label">Soil Moisture</span>
              <span className="panel-value">64%</span>
            </div>
            <div className="panel-row">
              <span className="panel-label">Temperature</span>
              <span className="panel-value">29°C</span>
            </div>
            <div className="panel-row">
              <span className="panel-label">Irrigation</span>
              <span className="panel-value">Auto: OFF</span>
            </div>

            <div className="panel-divider" />

            <p className="panel-note">
              This dashboard models how environmental conditions affect crop health and irrigation decisions.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="home-section">
        <div className="section-head">
          <h2 className="section-title">What you can do</h2>
          <p className="section-subtitle">
            Practical tools for monitoring crops and making irrigation decisions — without noise.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>Monitor conditions</h3>
            <p>View moisture, temperature and weather signals in a clean dashboard layout.</p>
          </div>

          <div className="feature-card">
            <h3>Crop profiles</h3>
            <p>Use recommended ranges for common crops or customize your own thresholds.</p>
          </div>

          <div className="feature-card">
            <h3>Irrigation tracking</h3>
            <p>Log manual watering events or use auto-water based on crop moisture targets.</p>
          </div>

          <div className="feature-card">
            <h3>Smart insights</h3>
            <p>Get simple explanations when conditions drift outside the target range.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="home-section home-how">
        <div className="section-head">
          <h2 className="section-title">How it works</h2>
          <p className="section-subtitle">
            A simple model: environment affects crop health, irrigation helps recovery.
          </p>
        </div>

        <div className="how-grid">
          <div className="how-step">
            <p className="how-number">01</p>
            <h3>Environment</h3>
            <p>Moisture and temperature update over time (simulated real-time).</p>
          </div>

          <div className="how-step">
            <p className="how-number">02</p>
            <h3>Crop response</h3>
            <p>Health adjusts based on your crop’s ideal moisture and temperature ranges.</p>
          </div>

          <div className="how-step">
            <p className="how-number">03</p>
            <h3>Decision support</h3>
            <p>Alerts and insights indicate stress, and irrigation actions improve conditions.</p>
          </div>
        </div>

        <div className="model-line">
          <span>Environment</span>
          <span className="arrow">→</span>
          <span>Crop</span>
          <span className="arrow">→</span>
          <span>Irrigation</span>
          <span className="arrow">→</span>
          <span>Health</span>
        </div>
      </section>

      {/* CTA FOOT */}
      <section className="home-cta-foot">
        <div className="cta-foot-inner">
          <div>
            <h2 className="cta-foot-title">Ready to monitor your farm?</h2>
            <p className="cta-foot-subtitle">
              Start with crops, then switch to the dashboard for live monitoring and irrigation controls.
            </p>
          </div>
          <div className="cta-foot-actions">
            <Link className="btn" to="/crops">Add Crops</Link>
            <Link className="btn btn-outline" to="/dashboard">View Dashboard</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
