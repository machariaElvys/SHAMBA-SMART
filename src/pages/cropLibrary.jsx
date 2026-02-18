import { useMemo, useState } from "react";
import "../styles/cropLibrary.css";
import { CROP_DICTIONARY } from "../data/cropDictionary";
import { useToast } from "../components/ToastProvider";

function normalize(v) {
  return String(v ?? "").toLowerCase().trim();
}

function matchesCrop(crop, query) {
  const q = normalize(query);
  if (!q) return false;

  const name = normalize(crop.name);
  const key = normalize(crop.key);
  const scientificName = normalize(crop.scientificName);

  const aliases = Array.isArray(crop.aliases) ? crop.aliases.map(normalize) : [];

  return (
    name.includes(q) ||
    key.includes(q) ||
    scientificName.includes(q) ||
    aliases.some((a) => a.includes(q))
  );
}

function getBestMatch(query) {
  const q = normalize(query);
  if (!q) return null;

  // exact match first
  const exact = CROP_DICTIONARY.find((c) => {
    const name = normalize(c.name);
    const key = normalize(c.key);
    const aliases = Array.isArray(c.aliases) ? c.aliases.map(normalize) : [];
    return q === name || q === key || aliases.includes(q);
  });
  if (exact) return exact;

  // partial match
  return CROP_DICTIONARY.find((c) => matchesCrop(c, q)) ?? null;
}

function CropLibrary({ crops = [], setCrops, currentCropId }) {
  const { notify } = useToast();

  const [query, setQuery] = useState("");

  const selected = useMemo(() => getBestMatch(query), [query]);

  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q) return CROP_DICTIONARY.slice(0, 8);
    return CROP_DICTIONARY.filter((c) => matchesCrop(c, q)).slice(0, 8);
  }, [query]);

  const currentCrop = useMemo(() => {
    if (!currentCropId) return null;
    return crops.find((c) => c.id === currentCropId) || null;
  }, [crops, currentCropId]);

  const applyToCurrentCrop = () => {
    if (!selected) {
      notify("Search and select a crop first.", "warning");
      return;
    }

    if (!currentCropId || !currentCrop) {
      notify("Add a crop and set it as current first.", "warning");
      return;
    }

    if (typeof setCrops !== "function") {
      notify("Cannot apply profile. setCrops is missing.", "error");
      return;
    }

    // Build a clean profile object from dictionary item
    const profileLabel = selected.label || `${selected.name} profile`;
    const idealMoisture = selected.idealMoisture ?? { min: 55, max: 70 };
    const idealTemp = selected.idealTemp ?? { min: 24, max: 32 };

    setCrops((prev) =>
      prev.map((c) =>
        c.id === currentCropId
          ? { ...c, profileLabel, idealMoisture, idealTemp }
          : c
      )
    );

    notify(`Applied profile to current crop: ${currentCrop.name}.`, "success");
  };

  return (
    <div className="lib-page">
      <header className="lib-hero">
        <p className="lib-kicker">Crop Library</p>
        <h1 className="lib-title">Search a crop and get practical insights.</h1>
        <p className="lib-subtitle">
          Use this dictionary to learn ideal ranges and apply a profile to your current crop.
        </p>
      </header>

      <section className="lib-shell">
        <aside className="lib-search">
          <label className="lib-label" htmlFor="crop-search">
            Search crop
          </label>

          <input
            id="crop-search"
            className="lib-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Maize, Beans, Tomato, Sukuma"
          />

          <div className="lib-suggestions">
            <p className="lib-small-title">{normalize(query) ? "Matches" : "Popular"}</p>

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

          <div className="lib-current">
            <p className="lib-small-title">Current crop</p>
            <p className="lib-current-text">
              {currentCrop ? (
                <>
                  <strong>{currentCrop.name}</strong>{" "}
                  <span className="lib-current-muted">
                    ({currentCrop.profileLabel ?? "Generic profile"})
                  </span>
                </>
              ) : (
                <span className="lib-current-muted">
                  None selected. Add a crop in Crops, then set it as current.
                </span>
              )}
            </p>
          </div>

          {normalize(query) && !selected && (
            <div className="lib-empty">
              <p className="lib-empty-title">No match found</p>
              <p className="lib-empty-text">
                Try a different name or choose from the suggestions.
              </p>
            </div>
          )}
        </aside>

        <main className="lib-result">
          {!normalize(query) && (
            <div className="lib-placeholder">
              <h2>Start typing a crop name</h2>
              <p>
                You will see ideal ranges, watering guidance, and you can apply a profile to your
                current crop.
              </p>
            </div>
          )}

          {selected && (
            <div className="lib-card">
              <div className="lib-card-head">
                <div>
                  <h2 className="lib-crop-name">{selected.name}</h2>

                  <p className="lib-meta">
                    {selected.scientificName ? (
                      <span className="lib-meta-item">{selected.scientificName}</span>
                    ) : null}

                    {Array.isArray(selected.aliases) && selected.aliases.length ? (
                      <span className="lib-meta-item">
                        Also known as: {selected.aliases.join(", ")}
                      </span>
                    ) : null}
                  </p>
                </div>

                <button
                  type="button"
                  className="lib-btn-outline"
                  onClick={applyToCurrentCrop}
                  disabled={!currentCropId}
                  title={
                    !currentCropId
                      ? "Add a crop first and set it as current."
                      : "Apply this profile to your current crop."
                  }
                >
                  Apply to Current Crop
                </button>
              </div>

              {selected.overview ? <p className="lib-overview">{selected.overview}</p> : null}

              <div className="lib-grid">
                <div className="lib-panel">
                  <h3>Ideal Soil Moisture</h3>
                  <p className="lib-range">
                    {selected.idealMoisture?.min ?? 55}–{selected.idealMoisture?.max ?? 70}%
                  </p>
                  {selected.idealMoisture?.note ? (
                    <p className="lib-note">{selected.idealMoisture.note}</p>
                  ) : null}
                </div>

                <div className="lib-panel">
                  <h3>Ideal Temperature</h3>
                  <p className="lib-range">
                    {selected.idealTemp?.min ?? 24}–{selected.idealTemp?.max ?? 32}°C
                  </p>
                  {selected.idealTemp?.note ? (
                    <p className="lib-note">{selected.idealTemp.note}</p>
                  ) : null}
                </div>
              </div>

              <div className="lib-split">
                <div className="lib-panel">
                  <h3>Watering Tips</h3>
                  <ul className="lib-list">
                    {(selected.wateringTips ?? []).map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div className="lib-panel">
                  <h3>Growth Notes</h3>
                  <ul className="lib-list">
                    {(selected.growthNotes ?? []).map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="lib-panel">
                <h3>Common Issues</h3>
                <div className="lib-tags">
                  {(selected.commonIssues ?? []).map((x) => (
                    <span className="lib-tag" key={x}>
                      {x}
                    </span>
                  ))}
                </div>
              </div>

              <p className="lib-footer">
                Applying a profile updates your current crop targets on the dashboard.
              </p>
            </div>
          )}
        </main>
      </section>
    </div>
  );
}

export default CropLibrary;