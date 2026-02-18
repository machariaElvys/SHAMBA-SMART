import { useEffect, useMemo, useState } from "react";
import "../styles/cropLibrary.css";
import { useToast } from "../components/ToastProvider";
import {
  fetchWikidataScientificName,
  fetchWikipediaSummary,
  searchWikipediaTitles,
} from "../services/cropKnowledge";

function normalize(v) {
  return String(v ?? "").toLowerCase().trim();
}

/**
 * These targets are for your app dashboard logic (not a public API).
 * Keep them as "recommended targets", and users can customize in Crops page.
 */
const TARGETS = {
  maize: { label: "Recommended (Maize)", idealMoisture: { min: 60, max: 75 }, idealTemp: { min: 26, max: 32 } },
  tomato: { label: "Recommended (Tomato)", idealMoisture: { min: 55, max: 70 }, idealTemp: { min: 22, max: 30 } },
  beans: { label: "Recommended (Beans)", idealMoisture: { min: 50, max: 65 }, idealTemp: { min: 18, max: 28 } },
  sukuma: { label: "Recommended (Sukuma wiki)", idealMoisture: { min: 55, max: 70 }, idealTemp: { min: 18, max: 28 } },
};

const DEFAULT_TARGETS = {
  label: "Generic profile",
  idealMoisture: { min: 55, max: 70 },
  idealTemp: { min: 24, max: 32 },
};

function targetsForTitle(title) {
  const key = normalize(title);
  return TARGETS[key] || DEFAULT_TARGETS;
}

function CropLibrary({ crops = [], setCrops, currentCropId }) {
  const { notify } = useToast();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [info, setInfo] = useState(null);
  const [scientificName, setScientificName] = useState("");

  const [loadingList, setLoadingList] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [error, setError] = useState("");

  const currentCrop = useMemo(() => {
    if (!currentCropId) return null;
    return crops.find((c) => c.id === currentCropId) || null;
  }, [crops, currentCropId]);

  const selectedTargets = useMemo(() => {
    if (!selectedTitle) return DEFAULT_TARGETS;
    return targetsForTitle(selectedTitle);
  }, [selectedTitle]);

  useEffect(() => {
    const q = query.trim();
    setError("");

    if (!q) {
      setSuggestions([
        { title: "Maize" },
        { title: "Beans" },
        { title: "Tomato" },
        { title: "Sukuma wiki" },
      ]);
      setSelectedTitle("");
      setInfo(null);
      setScientificName("");
      return;
    }

    const id = window.setTimeout(async () => {
      try {
        setLoadingList(true);
        const results = await searchWikipediaTitles(q, 8);
        setSuggestions(results);

        if (results.length > 0) {
          setSelectedTitle(results[0].title);
        } else {
          setSelectedTitle("");
          setInfo(null);
          setScientificName("");
        }
      } catch (e) {
        setSuggestions([]);
        setSelectedTitle("");
        setInfo(null);
        setScientificName("");
        setError("Could not fetch results. Check your internet connection.");
      } finally {
        setLoadingList(false);
      }
    }, 350);

    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      const t = selectedTitle.trim();
      if (!t) return;

      try {
        setLoadingInfo(true);
        setError("");

        const summary = await fetchWikipediaSummary(t);
        if (cancelled) return;

        setInfo(summary || null);

        const sci = await fetchWikidataScientificName(summary?.wikibaseItem || "");
        if (cancelled) return;

        setScientificName(sci || "");
      } catch (e) {
        if (!cancelled) {
          setInfo(null);
          setScientificName("");
          setError("Could not load crop details right now.");
        }
      } finally {
        if (!cancelled) setLoadingInfo(false);
      }
    }

    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [selectedTitle]);

  const applyToCurrentCrop = () => {
    if (!currentCropId || !currentCrop) {
      notify("Add a crop and set it as current first.", "warning");
      return;
    }

    if (!selectedTitle) {
      notify("Search and select a crop first.", "warning");
      return;
    }

    setCrops((prev) =>
      prev.map((c) =>
        c.id === currentCropId
          ? {
              ...c,
              profileLabel: selectedTargets.label,
              idealMoisture: selectedTargets.idealMoisture,
              idealTemp: selectedTargets.idealTemp,
            }
          : c
      )
    );

    notify(`Applied profile to current crop: ${currentCrop.name}.`, "success");
  };

  return (
    <div className="lib-page">
      <header className="lib-hero">
        <p className="lib-kicker">Crop Library</p>
        <h1 className="lib-title">Search a crop and get reliable facts.</h1>
        <p className="lib-subtitle">
          Crop details come from Wikipedia and Wikidata. Dashboard targets can be applied as a profile.
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
            placeholder="Type a crop name"
          />

          <div className="lib-suggestions">
            <p className="lib-small-title">
              {loadingList ? "Searching..." : query.trim() ? "Matches" : "Popular"}
            </p>

            <div className="lib-chip-wrap">
              {suggestions.map((c) => (
                <button
                  key={c.title}
                  className={`lib-chip ${c.title === selectedTitle ? "active" : ""}`}
                  type="button"
                  onClick={() => {
                    setSelectedTitle(c.title);
                    setQuery(c.title);
                  }}
                >
                  {c.title}
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

          {error && (
            <div className="lib-empty">
              <p className="lib-empty-title">Notice</p>
              <p className="lib-empty-text">{error}</p>
            </div>
          )}
        </aside>

        <main className="lib-result">
          {!query.trim() && (
            <div className="lib-placeholder">
              <h2>Start typing a crop name</h2>
              <p>We will fetch a short description and show references. Then you can apply targets to your dashboard.</p>
            </div>
          )}

          {loadingInfo && query.trim() && (
            <div className="lib-placeholder">
              <h2>Loading crop details</h2>
              <p>Please wait a moment.</p>
            </div>
          )}

          {info && !loadingInfo && (
            <div className="lib-card">
              <div className="lib-card-head">
                <div>
                  <h2 className="lib-crop-name">{info.title}</h2>

                  <p className="lib-meta">
                    {info.description ? <span className="lib-meta-item">{info.description}</span> : null}
                    {scientificName ? (
                      <span className="lib-meta-item">Scientific name: {scientificName}</span>
                    ) : null}
                  </p>
                </div>

                <button
                  type="button"
                  className="lib-btn-outline"
                  onClick={applyToCurrentCrop}
                  disabled={!currentCropId}
                  title={!currentCropId ? "Add a crop first and set it as current." : "Apply targets to your current crop."}
                >
                  Apply to Current Crop
                </button>
              </div>

              <div className="lib-top">
                {info.thumbnail ? (
                  <img className="lib-thumb" src={info.thumbnail} alt={info.title} />
                ) : null}

                <div className="lib-text">
                  {info.extract ? <p className="lib-overview">{info.extract}</p> : null}

                  {info.pageUrl ? (
                    <a className="lib-link" href={info.pageUrl} target="_blank" rel="noreferrer">
                      Open reference
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="lib-grid">
                <div className="lib-panel">
                  <h3>Dashboard target soil moisture</h3>
                  <p className="lib-range">
                    {selectedTargets.idealMoisture.min}–{selectedTargets.idealMoisture.max}%
                  </p>
                  <p className="lib-note">
                    This is a recommended target profile for your dashboard logic. You can customize per crop in Crops.
                  </p>
                </div>

                <div className="lib-panel">
                  <h3>Dashboard target temperature</h3>
                  <p className="lib-range">
                    {selectedTargets.idealTemp.min}–{selectedTargets.idealTemp.max}°C
                  </p>
                  <p className="lib-note">
                    This is a recommended target profile for your dashboard logic. You can customize per crop in Crops.
                  </p>
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