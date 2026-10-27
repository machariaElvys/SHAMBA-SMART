import { Link } from "react-router-dom";
import "../styles/about.css";

function About() {
  return (
    <div className="about-page">
      <section className="about-intro"><div className="about-intro-copy"><p className="eyebrow">ABOUT SHAMBA-SMART <span> / </span> A FIELD JOURNAL CONCEPT</p><h1>Technology should help you pay closer attention.</h1><p>Shamba-Smart is a small crop-management project shaped around a practical idea: keep crop information, field observations and planned work where they are easy to use.</p><Link to="/dashboard" className="button button-gold">Open the field journal</Link></div><div className="about-line-art" aria-hidden="true"><span className="about-sun" /><span className="about-hill hill-one" /><span className="about-hill hill-two" /><span className="about-rows" /></div></section>

      <section className="about-story"><div className="about-side-label"><span>THE IDEA</span><i /></div><div className="about-story-main"><h2>Give good decisions a place to grow.</h2><p>Farming asks for attention to many connected things: what is planted, how it is progressing, what the soil feels like, what work is due and what changed since the last visit. A useful digital tool should make those details easier to keep in view.</p><p>This project explores that idea through a local-first crop register, a field journal and a small crop reference. It is a frontend demonstration, not a deployed farm-monitoring service.</p></div><div className="about-story-note"><span>DESIGNED AROUND</span><strong>Observation<br />Seasonality<br />Everyday work</strong></div></section>

      <section className="about-pillars"><div className="about-pillars-head"><p className="eyebrow">WHAT YOU CAN DO</p><h2>Tools for a more considered field visit.</h2></div><div className="about-pillar-list"><article><span>01</span><div><h3>Keep a crop register</h3><p>Save any crop, its growth stage and optional field notes without guessing growing ranges.</p></div><Link to="/crops">Crops</Link></article><article><span>02</span><div><h3>Record what you notice</h3><p>Write dated observations and connect simple tasks to your crops.</p></div><Link to="/dashboard">Field journal</Link></article><article><span>03</span><div><h3>Check a source-backed guide</h3><p>See the source, region and limitations; unavailable recommendations stay marked as unavailable.</p></div><Link to="/library">Crop library</Link></article></div></section>

      <section className="about-boundaries"><div><p className="eyebrow">CLEAR ABOUT THE LIMITS</p><h2>A useful record begins with honest data.</h2></div><div><p>Weather is fetched from Open-Meteo for a selected location. Soil moisture is a regional model estimate, not a sensor reading. The dashboard does not compare it with crop targets or trigger watering decisions.</p><p>Source-backed crop context links to external agricultural resources. Shamba-Smart does not fetch their live content. Crop records, field notes and tasks are saved in this browser and are not synced to an account or server.</p></div></section>

      <footer className="about-footer"><p>Built as a practical exploration of crop management and clear farm interfaces.</p><div><a href="https://github.com/machariaElvys" target="_blank" rel="noopener noreferrer">GitHub profile</a><a href="mailto:machariaelvys@gmail.com">Contact</a></div></footer>
    </div>
  );
}

export default About;
