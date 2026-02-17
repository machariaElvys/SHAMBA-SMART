import { useMemo, useState } from "react";
import "../styles/cropLibrary.css";
import { CROP_DICTIONARY } from "../data/cropDictionary";

function normalize(s) {
  return (s ?? "").toLowerCase().trim();
}

function matchesCrop(crop, query) {
  const q = normalize(query);
  if (!q) return false;

  const name = normalize(crop.name);
  const key = normalize(crop.key);
  const aliases = (crop.aliases ?? []).map(normalize);

  return (
    name.includes(q) ||
    key.includes(q) ||
    aliases.some((a) => a.includes(q))
  );
}

function getBestMatch(query) {
  const q = normalize(query);
  if (!q) return null;

  // 1) exact match first
  const exact = CROP_DICTIONARY.find((c) => {
    const name = normalize(c.name);
    const key = normalize(c.key);
    const aliases = (c.aliases ?? []).map(normalize);
    return q === name || q === key || aliases.includes(q);
  });
  if (exact) return exact;

  // 2) partial match
  return CROP_DICTIONARY.find((c) => matchesCrop(c, q)) ?? null;
}

export default function CropLibrary() {
  const [query, setQuery] = useState("");

  const selected = useMemo(() => getBestMatch(query), [query]);

  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q) return CROP_DICTIONARY.slice(0, 6);
    return CROP_DICTIONARY.filter((c) => matchesCrop(c, q)).slice(0, 6);
  }, [query]);

  return (
    <div className="lib-page">
      <header className="lib-hero">
        <p className="lib-kicker">Crop Library</p>
        <h1 className="lib-title">Search a crop and get practical insights.</h1>
        <p className="lib-subtitle">
          A clean crop dictionary for moisture/temperature ranges, watering guidance, and common issues.
        </p>
      </header>

      <section className="lib-shell">
        {/* LEFT: Search */}
        <aside className="lib-search">
          <label className="lib-label">Search crop</label>
          <input
            className="lib-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Maize, Beans, Tomato, Sukuma"
          />

          <div className="lib-suggestions">
            <p className="lib-small-title">
              {normalize(query) ? "Matches" : "Popular"}
            </p>

            <div className="lib-chip-wrap">
              {suggestions.map((c) => (
                <button
                  key={c.key}
                  className="lib-chip"
                  type="button"
                  onClick={() => setQuery(c.name)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {normalize(query) && !selected && (
            <div className="lib-empty">
              <p className="lib-empty-title">No match found</p>
              <p className="lib-empty-text">
                Try another name. Example: <strong>corn</strong> for maize, <strong>kale</strong> for sukuma.
              </p>
            </div>
          )}
        </aside>

        {/* RIGHT: Result */}
        <main className="lib-result">
          {!normalize(query) && (
            <div className="lib-placeholder">
              <h2>Start typing a crop name</h2>
              <p>
                You’ll see ideal ranges and clear advice. Keep it practical, calm, and readable.
              </p>
            </div>
          )}

          {selected && (
            <div className="lib-card">
              <div className="lib-card-head">
                <div>
                  <h2 className="lib-crop-name">{selected.name}</h2>
                  <p className="lib-meta">
                    {selected.scientificName && (
                      <span className="lib-meta-item">{selected.scientificName}</span>
                    )}
                    {selected.aliases?.length ? (
                      <span className="lib-meta-item">
                        Also: {selected.aliases.join(", ")}
                      </span>
                    ) : null}
                  </p>
                </div>

                {/* future button placeholder (not wired yet) */}
                <button className="lib-btn-outline" type="button" disabled title="We can wire this later">
                  Apply to Profile (soon)
                </button>
              </div>

              <p className="lib-overview">{selected.overview}</p>

              <div className="lib-grid">
                <div className="lib-panel">
                  <h3>Ideal Soil Moisture</h3>
                  <p className="lib-range">
                    {selected.idealMoisture.min}–{selected.idealMoisture.max}%
                  </p>
                  {selected.idealMoisture.note && (
                    <p className="lib-note">{selected.idealMoisture.note}</p>
                  )}
                </div>

                <div className="lib-panel">
                  <h3>Ideal Temperature</h3>
                  <p className="lib-range">
                    {selected.idealTemp.min}–{selected.idealTemp.max}°C
                  </p>
                  {selected.idealTemp.note && (
                    <p className="lib-note">{selected.idealTemp.note}</p>
                  )}
                </div>
              </div>

              <div className="lib-split">
                <div className="lib-panel">
                  <h3>Watering Tips</h3>
                  <ul className="lib-list">
                    {selected.wateringTips.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div className="lib-panel">
                  <h3>Growth Notes</h3>
                  <ul className="lib-list">
                    {selected.growthNotes.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="lib-panel">
                <h3>Common Issues</h3>
                <div className="lib-tags">
                  {selected.commonIssues.map((x) => (
                    <span className="lib-tag" key={x}>
                      {x}
                    </span>
                  ))}
                </div>
              </div>

              <p className="lib-footer">
                This is a local knowledge base for now. Later we can plug in real agronomy sources or APIs and expand the dataset.
              </p>
            </div>
          )}
        </main>
      </section>
    </div>
  );
}
