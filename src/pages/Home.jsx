import { Link } from "react-router-dom";
import "../styles/home.css";

function Home({ crops = [], currentCrop }) {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-copy">
          <p className="eyebrow home-eyebrow"><span className="eyebrow-stitch" /> MADE FOR THE RHYTHM OF THE SHAMBA</p>
          <h1>Know your crops.<br /><em>Tend your field.</em></h1>
          <p className="home-intro">A thoughtful field journal for tracking what you grow, noting what you see and planning the work ahead.</p>
          <div className="home-actions"><Link to="/dashboard" className="button button-gold">Open field journal</Link><Link to="/crops" className="home-text-link">Manage your crops</Link></div>
          <div className="home-local-note"><span className="home-note-mark" aria-hidden="true" /><p>Your crop records stay on this device.<br /><strong>No account or backend needed.</strong></p></div>
        </div>
        <figure className="home-landscape">
          <img src="/shamba-field.svg" alt="Illustration of cultivated field rows beneath the morning sun and highland hills" />
          <figcaption><span>FIELD NOTES, FOR REAL GROWING</span><span>01 / EVERY SEASON</span></figcaption>
          <div className="landscape-label"><small>YOUR FIELD TODAY</small><strong>{currentCrop ? currentCrop.name : "A fresh start"}</strong><span>{crops.length ? `${crops.length} ${crops.length === 1 ? "crop" : "crops"} in your register` : "Ready when you are"}</span></div>
        </figure>
      </section>

      <section className="home-principles">
        <p className="eyebrow">A LITTLE MORE CLARITY, EACH DAY</p>
        <div className="principle-grid">
          <article><span className="principle-index">01</span><h2>Keep a close record</h2><p>Track crops by name, growing stage and the conditions you want to maintain.</p></article>
          <article><span className="principle-index">02</span><h2>Notice what changes</h2><p>Record field observations and keep a clear history of watering and farm work.</p></article>
          <article><span className="principle-index">03</span><h2>Plan the next visit</h2><p>Make a simple task list so the work you mean to do is easy to find again.</p></article>
        </div>
      </section>

      <section className="home-journal-callout">
        <div className="callout-rule" />
        <div><p className="eyebrow">YOUR FIELD JOURNAL</p><h2>Start with what you’re growing now.</h2><p>Add any crop by name. Source-backed recommendations appear when available; missing values stay clear.</p></div>
        <Link to="/crops" className="button button-outline-light">Build your field list</Link>
      </section>
      <section className="home-library-link"><div><p className="eyebrow">A PRACTICAL REFERENCE</p><h2>Good questions grow good crops.</h2></div><p>Look up source-backed crop context, see its limits and find Kenyan agricultural references for crops still needing a guide.</p><Link to="/library" className="home-text-link">Browse the crop library</Link></section>
    </div>
  );
}

export default Home;
