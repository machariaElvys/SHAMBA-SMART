import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/learn.css";

const TOPICS = [
  { id: "start", title: "Start your journal", number: "01", text: "A simple way to get your field record ready.", body: <ol className="guide-steps"><li><strong>Add a crop.</strong><span>Choose a name and growth stage. A verified source guide is attached only when one is available.</span></li><li><strong>Review its source.</strong><span>Read the source, region and limitations. Shamba-Smart leaves unsupported recommendations blank.</span></li><li><strong>Check the field view.</strong><span>The dashboard shows available weather information and a clearly marked regional soil estimate.</span></li><li><strong>Record the work.</strong><span>Add field notes, plan a task or log when watering took place.</span></li></ol> },
  { id: "conditions", title: "Read conditions", number: "02", text: "What the dashboard can and cannot tell you.", body: <div className="learn-reading"><p>Weather information comes from Open-Meteo for the location shown on the dashboard. Soil moisture comes from a regional model estimate. Neither value comes from a sensor installed in your field.</p><div className="reading-key"><article><span className="reading-swatch weather-swatch" /><div><h3>Weather</h3><p>Forecast service data for the selected location. It can help add context to a field check.</p></div></article><article><span className="reading-swatch soil-swatch" /><div><h3>Soil moisture</h3><p>A model estimate for the area. It is not compared with crop or farmer-entered sensor thresholds.</p></div></article><article><span className="reading-swatch crop-swatch" /><div><h3>Crop guidance</h3><p>Source-backed notes show their region and limits. Missing sensor or temperature recommendations say “Not available.”</p></div></article></div></div> },
  { id: "records", title: "Keep field records", number: "03", text: "Use notes and tasks to remember what happened.", body: <div className="learn-two-up"><article><span className="learn-illustration note-illustration" aria-hidden="true" /><h3>Field notes</h3><p>Write an observation for a crop and choose a topic such as growth, watering or pest stress. Notes are ordered by date and saved in this browser.</p></article><article><span className="learn-illustration task-illustration" aria-hidden="true" /><h3>Farm tasks</h3><p>Add a task, connect it to a crop and set a due date. Complete it when the work is done, or remove it if plans change.</p></article></div> },
  { id: "targets", title: "Understand crop guides", number: "04", text: "Recommendations depend on the source and the growing context.", body: <div className="learn-targets"><p>Adding a crop never requires ideal moisture or temperature values. Verified entries identify their agricultural source and applicable context; unknown or unverified crops remain manageable with no guessed thresholds.</p><p>Crop-water guidance and soil-moisture sensor readings are different measurements. The regional soil estimate in this dashboard is not compared with crop targets or used to trigger watering.</p><blockquote>Use the source to guide your questions, then check advice for your local variety, soil, season and growth stage.</blockquote><Link to="/library" className="learn-inline-link">Explore the crop guide index</Link></div> },
];

const FAQS = [
  { question: "Does the dashboard measure my field?", answer: "No. Weather is fetched for the selected location. Soil moisture is a regional model estimate, not a sensor reading. Confirm conditions in the field before making irrigation decisions." },
  { question: "Does Log watering turn on a pump?", answer: "No. It records a watering event in your local field journal. This demonstration is not connected to irrigation equipment." },
  { question: "Where are my crops, tasks and notes saved?", answer: "They are stored in localStorage in this browser on this device. Clearing browser site data removes those local records." },
  { question: "Do I need to enter technical values when adding a crop?", answer: "No. You can add and manage any crop without temperature or moisture values. Optional comparison ranges are separate from the source guide and are never compared with the regional model estimate." },
];

function Learn() {
  const [activeId, setActiveId] = useState(TOPICS[0].id);
  const [openFaq, setOpenFaq] = useState(0);
  const active = TOPICS.find((item) => item.id === activeId) || TOPICS[0];

  return (
    <div className="learn-page">
      <header className="learn-heading"><div><p className="eyebrow">FIELD GUIDE <span> / </span> HOW IT WORKS</p><h1>Make a little more sense<br /><em>of the things you see.</em></h1><p className="page-intro">A straightforward guide to setting up your field journal and reading its records with care.</p></div><span className="learn-heading-mark" aria-hidden="true"><i /><i /><i /><i /></span></header>
      <section className="learning-layout"><nav className="learning-nav" aria-label="Learning topics"><p className="eyebrow">IN THIS GUIDE</p>{TOPICS.map((topic) => <button key={topic.id} type="button" className={activeId === topic.id ? "topic-active" : ""} onClick={() => setActiveId(topic.id)}><span>{topic.number}</span><strong>{topic.title}</strong><small>{topic.text}</small></button>)}</nav><article className="learning-article"><div className="learning-article-top"><span>FIELD GUIDE / {active.number}</span><span>{TOPICS.length} TOPICS</span></div><h2>{active.title}</h2><p className="learning-lede">{active.text}</p><div className="learning-body">{active.body}</div></article></section>
      <section className="learn-faq"><div className="faq-heading"><p className="eyebrow">GOOD TO KNOW</p><h2>Questions from the field.</h2><p>Clear answers about what this journal records.</p></div><div className="faq-list">{FAQS.map((item, index) => <article className={`faq-item ${openFaq === index ? "is-open" : ""}`} key={item.question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span>{item.question}</span><i aria-hidden="true">{openFaq === index ? "−" : "+"}</i></button>{openFaq === index && <p>{item.answer}</p>}</article>)}</div></section>
    </div>
  );
}

export default Learn;
