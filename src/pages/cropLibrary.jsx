import { useMemo, useRef, useState } from "react";
import "../styles/cropLibrary.css";
import { useToast } from "../components/useToast";
import { cropStorage } from "../services/cropStorage";
import { AGRICULTURAL_RESOURCES, CROP_GUIDES, findCropGuide, guideSnapshot } from "../data/cropGuides";
import { searchCropKnowledge } from "../services/cropKnowledge";

const GROUPS = ["All crops", "Cereals", "Roots", "Legumes", "Vegetables"];
const TOPICS = [
  { value: "cultivation", label: "Cultivation" },
  { value: "soil", label: "Soil" },
  { value: "planting", label: "Planting" },
  { value: "irrigation", label: "Irrigation" },
  { value: "varieties", label: "Crop varieties" },
  { value: "pests", label: "Pests and diseases" },
  { value: "harvesting", label: "Harvesting" },
];
const NEW_CROP_TARGET = "__new_crop__";

const groupFor = (key) => key === "maize" ? "Cereals" : key === "cassava" ? "Roots" : key === "beans" ? "Legumes" : "Vegetables";
const normalize = (value) => String(value || "").trim().toLocaleLowerCase();

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function CropLibrary({ crops = [], setCrops, currentCropId, setCurrentCropId }) {
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All crops");
  const [selectedKey, setSelectedKey] = useState(CROP_GUIDES[0]?.key || "");
  const [searchCrop, setSearchCrop] = useState("");
  const [topic, setTopic] = useState(TOPICS[0].value);
  const [location, setLocation] = useState("");
  const [saveTarget, setSaveTarget] = useState(NEW_CROP_TARGET);
  const [searchState, setSearchState] = useState("idle");
  const [searchResults, setSearchResults] = useState([]);
  const [searchedCrop, setSearchedCrop] = useState("");
  const [searchedTopic, setSearchedTopic] = useState(TOPICS[0].value);
  const [searchedLocation, setSearchedLocation] = useState("");
  const [pendingSave, setPendingSave] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const requestNumber = useRef(0);
  const controllerRef = useRef(null);

  const currentCrop = crops.find((crop) => crop.id === currentCropId) || null;
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return CROP_GUIDES.filter((crop) => (group === "All crops" || groupFor(crop.key) === group)
      && (!search || [crop.name, crop.scientificName, ...crop.aliases].join(" ").toLocaleLowerCase().includes(search)));
  }, [group, query]);
  const selected = CROP_GUIDES.find((crop) => crop.key === selectedKey) || filtered[0] || null;
  const currentGuide = findCropGuide(currentCrop?.name);
  const canLinkSelected = Boolean(currentCrop && selected?.verificationStatus === "verified" && currentGuide?.key === selected.key);
  const selectedSaveCrop = crops.find((crop) => String(crop.id) === String(saveTarget)) || null;
  const selectedTopicLabel = TOPICS.find((item) => item.value === searchedTopic)?.label || "Cultivation";
  const alreadyTrackedSearchCrop = crops.find((crop) => normalize(crop.name) === normalize(searchedCrop)) || null;

  const applyGuide = () => {
    if (!canLinkSelected || !currentCrop || !selected) return notify("Select a crop with the same name before linking this guide.", "warning");
    const guide = guideSnapshot(selected);
    setCrops((previous) => previous.map((crop) => crop.id === currentCrop.id
      ? { ...crop, guide, guideKey: guide.key, guideStatus: guide.verificationStatus, profileLabel: `KALRO guide · ${guide.name}` }
      : crop));
    notify(`The ${selected.name} source guide is linked to ${currentCrop.name}.`, "success");
  };

  const runSearch = async (event) => {
    event.preventDefault();
    const cropName = searchCrop.trim();
    if (!cropName) return;
    const requestId = requestNumber.current + 1;
    requestNumber.current = requestId;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setSearchedCrop(cropName);
    setSearchedTopic(topic);
    setSearchedLocation(location.trim());
    setSearchResults([]);
    setErrorMessage("");
    setSearchState("loading");
    const existingCrop = crops.find((crop) => normalize(crop.name) === normalize(cropName));
    setSaveTarget(existingCrop ? String(existingCrop.id) : NEW_CROP_TARGET);

    try {
      const results = await searchCropKnowledge({ crop: cropName, topic, location, signal: controller.signal });
      if (requestNumber.current !== requestId) return;
      setSearchResults(results);
      setSearchState("success");
    } catch (error) {
      if (controller.signal.aborted || requestNumber.current !== requestId) return;
      setErrorMessage(error instanceof Error ? error.message : "The search service could not be reached.");
      setSearchState("error");
    }
  };

  const confirmSave = () => {
    if (!pendingSave) return;
    const savedAt = new Date().toISOString();
    const record = {
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      recordType: "imported-reference",
      sourceTitle: pendingSave.title,
      originalUrl: pendingSave.url,
      sourceOrganization: pendingSave.organization,
      summary: pendingSave.extract || pendingSave.description || "No summary was supplied by the search provider.",
      summaryType: "encyclopedia-summary",
      cropQuery: searchedCrop,
      topic: searchedTopic,
      location: searchedLocation,
      retrievedAt: pendingSave.retrievedAt,
      savedAt,
      verificationStatus: "unverified",
      expertReviewed: false,
    };

    if (saveTarget === NEW_CROP_TARGET) {
      const localGuide = findCropGuide(searchedCrop);
      const created = cropStorage.create({
        name: localGuide?.name || searchedCrop,
        stage: "Seedling",
        guide: guideSnapshot(localGuide),
        savedGuides: [record],
      });
      setCrops((previous) => [created, ...previous]);
      setCurrentCropId?.(created.id);
      notify(`${created.name} was added with this saved reference. No growing thresholds were filled in.`, "success");
      setPendingSave(null);
      return;
    }

    const target = crops.find((crop) => String(crop.id) === String(saveTarget));
    if (!target) {
      notify("Choose an existing crop or add this search crop as new.", "warning");
      setPendingSave(null);
      return;
    }
    if ((target.savedGuides || []).some((guide) => guide.originalUrl === record.originalUrl)) {
      notify("This source is already saved with that crop.", "info");
      setPendingSave(null);
      return;
    }
    setCrops((previous) => previous.map((crop) => String(crop.id) === String(target.id)
      ? { ...crop, savedGuides: [...(crop.savedGuides || []), record] }
      : crop));
    notify(`The reference was added to ${target.name}. Existing crop details were kept.`, "success");
    setPendingSave(null);
  };

  const addSearchCropWithoutGuide = () => {
    if (alreadyTrackedSearchCrop) {
      setCurrentCropId?.(alreadyTrackedSearchCrop.id);
      return notify(`${alreadyTrackedSearchCrop.name} is already in your field list. Its saved crop information was not changed.`, "info");
    }
    const localGuide = findCropGuide(searchedCrop);
    const created = cropStorage.create({
      name: localGuide?.name || searchedCrop,
      stage: "Seedling",
      guide: guideSnapshot(localGuide),
    });
    setCrops((previous) => [created, ...previous]);
    setCurrentCropId?.(created.id);
    notify(`${created.name} was added without inventing growing conditions.`, "success");
  };

  return (
    <div className="library-page">
      <header className="library-heading"><div><p className="eyebrow">FIELD REFERENCE <span> / </span> CROP GUIDE</p><h1>Know the crop.<br /><em>Know what to watch.</em></h1><p className="page-intro">Source-backed crop context, with unavailable targets clearly marked.</p></div><div className="library-index"><span>LOCAL INDEX</span><strong>{String(CROP_GUIDES.length).padStart(2, "0")}</strong><small>CROP ENTRIES</small></div></header>

      <section className="knowledge-search" aria-labelledby="knowledge-search-title">
        <div className="knowledge-search-heading"><div><p className="eyebrow">ONLINE FIELD REFERENCE</p><h2 id="knowledge-search-title">Find growing guidance</h2><p>Search by crop and farming topic, including crops outside the local index.</p></div><span className="knowledge-search-index">SEARCH / 01</span></div>
        <form className="knowledge-search-form" onSubmit={runSearch}>
          <label className="field"><span>Crop name</span><input value={searchCrop} onChange={(event) => setSearchCrop(event.target.value)} placeholder="For example, apple or avocado" autoComplete="off" required /></label>
          <label className="field"><span>Agricultural topic</span><select value={topic} onChange={(event) => setTopic(event.target.value)}>{TOPICS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="field"><span>County or location <small>(optional)</small></span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="For example, Kiambu" /></label>
          <button className="button button-primary knowledge-search-button" type="submit" disabled={!searchCrop.trim() || searchState === "loading"}>{searchState === "loading" ? "Searching" : "Search sources"}</button>
        </form>
        <p className="knowledge-search-disclosure">Search uses the recovered Wikipedia public search service. It cannot filter results by source domain, so Shamba-Smart adds crop and agriculture context and screens the summaries for topic relevance. Results are unverified references, not expert advice. Use the KALRO links below for Kenyan agricultural resources.</p>

        {searchState === "loading" && <div className="knowledge-search-state" role="status"><span className="search-loading-mark" aria-hidden="true" /><div><strong>Searching for {searchedCrop} · {selectedTopicLabel}</strong><p>Checking returned summaries for crop and topic relevance.</p></div></div>}
        {searchState === "error" && <div className="knowledge-search-state search-error" role="alert"><strong>Search could not be completed.</strong><p>{errorMessage || "Check your connection and try again."}</p></div>}
        {searchState === "success" && searchResults.length === 0 && <div className="knowledge-search-state knowledge-no-results" role="status"><div><strong>No suitable summaries found for {searchedCrop} · {selectedTopicLabel}.</strong><p>Try another agricultural topic or county. You can still add the crop without entering moisture or temperature values.</p></div><button className="button button-secondary" type="button" onClick={addSearchCropWithoutGuide}>{alreadyTrackedSearchCrop ? `Select ${searchedCrop}` : `Add ${searchedCrop} without a guide`}</button></div>}
        {searchState === "success" && searchResults.length > 0 && <div className="knowledge-search-results" aria-live="polite">
          <div className="knowledge-results-heading"><div><span>SEARCH RESULTS</span><h3>{searchResults.length} relevant {searchResults.length === 1 ? "summary" : "summaries"} for {searchedCrop}</h3><small>{selectedTopicLabel}{searchedLocation ? ` · ${searchedLocation}` : ""}</small></div><label className="field"><span>Save reference to</span><select value={saveTarget} onChange={(event) => setSaveTarget(event.target.value)}><option value={NEW_CROP_TARGET}>Add “{searchedCrop}” as a new crop</option>{crops.map((crop) => <option key={crop.id} value={String(crop.id)}>{crop.name}{crop.id === currentCropId ? " · current" : ""}</option>)}</select></label></div>
          <div className="knowledge-result-list">{searchResults.map((result) => <article className="knowledge-result" key={result.url || result.title}>
            <div className="knowledge-result-meta"><span>SEARCH RESULT · UNVERIFIED</span><time dateTime={result.retrievedAt}>Retrieved {formatDate(result.retrievedAt)}</time></div>
            <h4><a href={result.url} target="_blank" rel="noreferrer">{result.title}</a></h4>
            {result.description && <p className="knowledge-result-description">{result.description}</p>}
            <p className="knowledge-result-summary">{result.extract || "The source did not provide a summary. Open the original page to review its content."}</p>
            <div className="knowledge-result-source"><span>Source organization</span><strong>{result.organization}</strong><a href={result.url} target="_blank" rel="noreferrer">Read the original source</a></div>
            <p className="knowledge-result-note">This is an encyclopedia summary, not the full article and not expert-reviewed growing guidance.</p>
            <button className="button button-secondary knowledge-save-button" type="button" onClick={() => setPendingSave(result)}>Review and save this reference</button>
          </article>)}</div>
        </div>}
      </section>

      <div className="library-tools"><label className="library-search"><span className="search-mark" aria-hidden="true" /><span className="sr-only">Search local crop entries</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a crop in the local guide list" /></label><div className="library-filters" aria-label="Crop categories">{GROUPS.map((item) => <button key={item} type="button" className={group === item ? "filter-active" : ""} onClick={() => setGroup(item)}>{item}</button>)}</div></div>

      <div className="library-layout">
        <section className="library-list" aria-label="Crops">
          <div className="library-list-head"><span>{filtered.length} {filtered.length === 1 ? "crop" : "crops"}</span><span>SELECT AN ENTRY</span></div>
          {filtered.length ? filtered.map((crop, index) => <button key={crop.key} className={`library-crop-row ${selected?.key === crop.key ? "selected" : ""}`} type="button" onClick={() => setSelectedKey(crop.key)}><span className={`crop-initial crop-${crop.key}`}>{crop.name.charAt(0)}</span><span className="library-crop-copy"><strong>{crop.name}</strong><small>{groupFor(crop.key)} · {crop.scientificName}</small></span><span className={`library-row-status ${crop.verificationStatus}`}>{crop.verificationStatus === "verified" ? "Verified" : "Guide needed"}</span><span className="library-row-number">{String(index + 1).padStart(2, "0")}</span></button>) : <div className="library-no-results"><h2>No crop entries match.</h2><p>Try another name or browse the external agricultural resources below.</p><ResourceLinks /></div>}
          <p className="library-source-note">External links open agricultural resources. Shamba-Smart does not fetch or verify their live content when you open them.</p>
          <ResourceLinks />
        </section>

        {selected ? <article className="crop-guide"><header className="guide-heading"><div><p className="eyebrow">{groupFor(selected.key)} <span> / </span> {selected.verificationStatus === "verified" ? "SOURCE GUIDE" : "GUIDE NEEDED"}</p><h2>{selected.name}</h2><p className="guide-scientific">{selected.scientificName}</p></div><span className={`guide-stamp crop-${selected.key}`}>{selected.name.slice(0, 1)}</span></header>
          {selected.verificationStatus === "verified" ? <>
            <div className="guide-verification"><strong>Verified against a named source</strong><span>{selected.source.name}</span><a href={selected.source.url} target="_blank" rel="noreferrer">Open external source</a></div>
            <p className="guide-overview">{selected.recommendations.summary}</p>
            <div className="guide-context-grid">
              <div><span>APPLICABLE REGION</span><p>{selected.applicableRegion || "Not available"}</p></div>
              <div><span>GROWTH STAGES COVERED</span><p>{selected.supportedGrowthStages?.length ? selected.supportedGrowthStages.join(", ") : "Not specified in the reviewed source."}</p></div>
            </div>
            <div className="guide-targets"><div><span>CROP-WATER GUIDANCE</span><strong>{selected.recommendations.cropWater ? "Available" : "Not available"}</strong><small>{selected.recommendations.cropWater || "Not available in the reviewed source."}</small></div><div><span>SOIL-MOISTURE SENSOR TARGET</span><strong>{selected.recommendations.soilMoistureSensorRange ? `${selected.recommendations.soilMoistureSensorRange.min}–${selected.recommendations.soilMoistureSensorRange.max}%` : "Not available"}</strong><small>A crop-water recommendation is not a sensor percentage. Sensor readings need local calibration.</small></div><div><span>TEMPERATURE REFERENCE</span><strong>{selected.recommendations.preferredDayTemperature ? `${selected.recommendations.preferredDayTemperature.min}–${selected.recommendations.preferredDayTemperature.max}${selected.recommendations.preferredDayTemperature.unit}` : "Not available"}</strong><small>{selected.recommendations.preferredDayTemperature?.label || "Not available in the reviewed source."}</small></div></div>
            <div className="guide-issues"><h3>Limitations</h3><ul>{selected.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <footer className="guide-footer"><div><strong>{currentCrop ? `Current crop: ${currentCrop.name}` : "No current crop selected"}</strong><span>{canLinkSelected ? "Linking keeps source context with this crop. It does not create missing thresholds." : "Select a crop with the same name before linking this guide."}</span></div><button className="button button-primary" type="button" disabled={!canLinkSelected} onClick={applyGuide}>Link this guide</button></footer>
          </> : <>
            <div className="guide-missing-message"><strong>No verified growing guide is available for this crop yet. You can still add and manage it. Shamba-Smart will not guess its growing conditions.</strong><p>{selected.localNotes}</p><span>Entry status: unverified. Its earlier demo targets are not used.</span></div>
            <div className="guide-context-grid"><div><span>SOURCE</span><p>{selected.source.name}</p></div><div><span>REGION &amp; STAGES</span><p>Not available</p></div></div>
            <div className="guide-issues"><h3>Find external guidance</h3><p>These links open KALRO resources. Shamba-Smart has not automatically retrieved their content.</p><ResourceLinks /></div>
            <footer className="guide-footer"><div><strong>{currentCrop ? `Current crop: ${currentCrop.name}` : "No current crop selected"}</strong><span>No source-backed guide is available to link from this entry.</span></div><button className="button button-primary" type="button" disabled>Guide needed</button></footer>
          </>}
        </article> : <article className="crop-guide guide-empty"><p className="eyebrow">CROP GUIDE</p><h2>Choose a crop to begin.</h2><p>Source information and its limitations will appear here.</p></article>}
      </div>

      {pendingSave && <div className="dialog-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingSave(null); }}><section className="confirm-dialog knowledge-save-dialog" role="dialog" aria-modal="true" aria-labelledby="save-reference-title"><p className="eyebrow">SOURCE REFERENCE</p><h2 id="save-reference-title">Review before saving</h2><div className="save-preview"><strong>{pendingSave.title}</strong><span>{pendingSave.organization} · retrieved {formatDate(pendingSave.retrievedAt)}</span><p>{pendingSave.extract || pendingSave.description || "No summary was supplied. The saved record will retain the source link and title."}</p><a href={pendingSave.url} target="_blank" rel="noreferrer">Read the original page</a></div><p>{saveTarget === NEW_CROP_TARGET ? `This will add ${searchedCrop} as a crop and attach the reference. Its guide will remain unavailable, and no sensor or temperature values will be created.` : selectedSaveCrop ? `This will append the reference to ${selectedSaveCrop.name}. Its existing guide, field ranges and saved references will be kept.` : "Choose a crop before saving this reference."}</p><p className="save-status-note">The saved item is an imported encyclopedia reference marked unverified. It is not expert-reviewed guidance.</p><div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => setPendingSave(null)}>Back to results</button><button className="button button-primary" type="button" disabled={saveTarget !== NEW_CROP_TARGET && !selectedSaveCrop} onClick={confirmSave}>Confirm and save</button></div></section></div>}
    </div>
  );
}

function ResourceLinks() {
  return <div className="library-resource-links">{AGRICULTURAL_RESOURCES.map((resource) => <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer">{resource.name}</a>)}</div>;
}

export default CropLibrary;
