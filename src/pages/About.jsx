import { Link } from "react-router-dom";
import "../styles/about.css";

function About() {
  return (
    <div className="about-page">
      {/* Hero */}
      <section className="about-hero">
        <p className="about-kicker">About</p>

        <h1 className="about-title">
          Built from real farm experience — designed as a smart monitoring demo.
        </h1>

        <p className="about-subtitle">
          Shamba-Smart started as a practical idea inspired by our farm: keeping crops healthy
          depends on understanding conditions and making timely irrigation decisions. This project
          turns that thinking into a clean, modern dashboard experience.
        </p>

        <div className="about-actions">
          <Link className="btn" to="/dashboard">Open Dashboard</Link>
          <Link className="btn btn-outline" to="/library">Crop Library</Link>
        </div>
      </section>

      {/* Story + Purpose */}
      <section className="about-grid">
        <div className="about-card">
          <h2>The Story</h2>
          <p>
            I didn’t want to build “just another dashboard.” The inspiration came from the
            day-to-day reality of farming — deciding when to water, noticing stress early,
            and learning which crops perform best under specific conditions.
          </p>
          <p className="about-muted">
            This is a prototype today, built to be expanded into a real system tomorrow.
          </p>
        </div>

        <div className="about-card">
          <h2>The Vision</h2>
          <p>
            The goal is simple: make crop monitoring understandable. A farmer should be able to
            check conditions, see what’s changing, and take action without complicated screens.
          </p>

          <div className="about-highlight">
            <p className="about-highlight-title">Core idea</p>
            <p className="about-highlight-text">
              Environment → Irrigation decisions → Crop health.
            </p>
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="about-section">
        <div className="about-section-head">
          <h2>What Shamba-Smart does</h2>
          <p className="about-muted">
            A focused set of features that demonstrate smart-farm logic, even before real sensors are connected.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature">
            <h3>Crop profiles</h3>
            <p>Each crop can have ideal moisture and temperature targets.</p>
          </div>
          <div className="feature">
            <h3>Live monitoring (simulated)</h3>
            <p>Moisture/temperature/weather update like a real monitoring dashboard.</p>
          </div>
          <div className="feature">
            <h3>Manual irrigation</h3>
            <p>“Water Now” represents a real irrigation action and updates crop health.</p>
          </div>
          <div className="feature">
            <h3>Auto-water logic</h3>
            <p>Demonstrates automatic irrigation when moisture drops below a safe level.</p>
          </div>
          <div className="feature">
            <h3>Insights & alerts</h3>
            <p>Simple explanations when conditions drift outside crop targets.</p>
          </div>
          <div className="feature">
            <h3>Crop Library</h3>
            <p>A built-in crop dictionary to guide decisions and educate farmers.</p>
          </div>
        </div>
      </section>

      {/* Tech + Roadmap */}
      <section className="about-grid">
        <div className="about-card">
          <h2>Tech Stack</h2>
          <ul className="about-list">
            <li><strong>React</strong> — component-based UI</li>
            <li><strong>React Router</strong> — navigation</li>
            <li><strong>CSS</strong> — clean, responsive styling</li>
          </ul>
          <p className="about-muted">
            The structure is kept simple on purpose so it’s easy to expand later.
          </p>
        </div>

        <div className="about-card">
          <h2>Roadmap</h2>
          <ul className="about-list">
            <li>Replace simulated temperature/weather with real weather data (API)</li>
            <li>Improve moisture realism (rain + evaporation model)</li>
            <li>IoT phase: connect soil sensors and irrigation control hardware</li>
            <li>Data storage + farm reports (watering history, yield notes)</li>
          </ul>
        </div>
      </section>

      {/* Personal footer */}
      <section className="about-footer">
        <div className="about-footer-inner">
          <div>
            <h2 className="about-footer-title">Made  for real farmers</h2>
            <p className="about-muted">
              This project is personal: it’s inspired by our farm and built as a professional portfolio piece
              with real-world direction.
            </p>
          </div>

          <div className="about-footer-actions">
            
            <a 
            className="btn btn-outline"
             href="https://github.com/machariaElvys"
             target= "_blank"
             rel="noopener noreferrer"
             
             >
              GitHub 
            </a>
            <a
             className="btn" href="mailto:machariaelvys@gmail.com">
             
              Email
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
