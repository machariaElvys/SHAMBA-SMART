import { useMemo, useState } from "react";
import "../styles/crops.css";
import { useToast } from "../components/useToast";
import { cropStorage } from "../services/cropStorage";
import { AGRICULTURAL_RESOURCES, CROP_GUIDES, DEFAULT_STAGES, findCropGuide, guideSnapshot, searchCropGuides } from "../data/cropGuides";

const NOTE_TYPES = ["Observation", "Watering", "Growth", "Pest or stress"];
const MISSING_GUIDE_MESSAGE = "No verified growing guide is available for this crop yet. You can still add and manage it. Shamba-Smart will not guess its growing conditions.";

function CropMark({ name }) {
  const initial = name.trim().charAt(0).toUpperCase() || "C";
  return <span className="crop-mark" aria-hidden="true">{initial}</span>;
}

function rangeText(range, suffix = "") {
  return range && Number.isFinite(range.min) && Number.isFinite(range.max)
    ? `${range.min}–${range.max}${suffix}`
    : "Not available";
}

function formatReferenceDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function Crops({ crops, setCrops, currentCropId, setCurrentCropId, notes = [], setNotes }) {
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [stage, setStage] = useState("Seedling");
  const [selectedGuideKey, setSelectedGuideKey] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState(NOTE_TYPES[0]);
  const selectedGuide = CROP_GUIDES.find((guide) => guide.key === selectedGuideKey) || findCropGuide(name);
  const matchingGuides = useMemo(() => searchCropGuides(name).slice(0, 5), [name]);
  const selectedCrop = crops.find((crop) => crop.id === currentCropId) || crops[0] || null;
  const cropNotes = useMemo(() => notes.filter((note) => note.cropId === selectedCrop?.id), [notes, selectedCrop?.id]);

  const addCrop = (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return notify("Enter a crop name to add it to your field list.", "warning");
    const guide = selectedGuide ? guideSnapshot(selectedGuide) : guideSnapshot(null);
    const created = cropStorage.create({ name: selectedGuide?.name || trimmed, stage, guide });
    setCrops((previous) => [created, ...previous]);
    setCurrentCropId(created.id);
    setName("");
    setStage("Seedling");
    setSelectedGuideKey("");
    notify(`${created.name} added to your field list.`, "success");
  };

  const updateCrop = (cropId, updates) => {
    setCrops((previous) => previous.map((crop) => crop.id === cropId ? { ...crop, ...updates } : crop));
  };

  const updateMonitoringRange = (crop, dimension, bound, rawValue) => {
    const nextRange = { ...(crop.monitoringTargets?.[dimension] || { min: null, max: null }) };
    nextRange[bound] = rawValue === "" ? null : Number(rawValue);
    updateCrop(crop.id, {
      monitoringTargets: { ...crop.monitoringTargets, [dimension]: nextRange },
      monitoringTargetSource: "farmer",
    });
  };

  const saveMonitoringTargets = (crop) => {
    const ranges = [crop.monitoringTargets?.soilMoisture, crop.monitoringTargets?.temperature];
    const incomplete = ranges.some((range) => range && ((range.min === null) !== (range.max === null)));
    const reversed = ranges.some((range) => range && range.min !== null && range.max !== null && range.min > range.max);
    if (incomplete || reversed) {
      notify("Enter both ends of each range, or leave both fields blank.", "warning");
      return;
    }
    setEditingId(null);
    notify("Your optional comparison ranges were saved on this device.", "success");
  };

  const confirmRemove = () => {
    if (!deleteTarget) return;
    const removed = deleteTarget;
    const index = crops.findIndex((crop) => crop.id === removed.id);
    const wasCurrent = removed.id === currentCropId;
    setCrops((previous) => previous.filter((crop) => crop.id !== removed.id));
    if (wasCurrent) setCurrentCropId(crops.find((crop) => crop.id !== removed.id)?.id || null);
    setDeleteTarget(null);
    notify(`${removed.name} removed from your field list.`, "info", {
      duration: 6500,
      actionLabel: "Undo",
      onAction: () => {
        setCrops((previous) => {
          const next = previous.slice();
          next.splice(Math.min(index, next.length), 0, removed);
          return next;
        });
        if (wasCurrent) setCurrentCropId(removed.id);
      },
    });
  };

  const addNote = (event) => {
    event.preventDefault();
    if (!selectedCrop || !noteText.trim()) return;
    const entry = {
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}`,
      cropId: selectedCrop.id,
      cropName: selectedCrop.name,
      category: noteType,
      text: noteText.trim(),
      createdAt: new Date().toISOString(),
    };
    setNotes((previous) => [entry, ...previous]);
    setNoteText("");
    notify("Field note saved.", "success");
  };

  const chooseGuide = (guide) => {
    setName(guide.name);
    setSelectedGuideKey(guide.key);
  };

  const selectedTemperature = selectedGuide?.recommendations?.preferredDayTemperature;

  return (
    <div className="crops-page">
      <header className="page-heading crops-heading">
        <div>
          <p className="eyebrow">FIELD REGISTER <span> / </span> YOUR SHAMBA</p>
          <h1>What’s growing?</h1>
          <p className="page-intro">Add any crop by name. Source-backed guidance appears when it is available.</p>
        </div>
        <div className="crop-count"><strong>{String(crops.length).padStart(2, "0")}</strong><span>tracked crops</span></div>
      </header>

      <section className="crop-add-section" aria-labelledby="add-crop-title">
        <div className="section-marker"><span className="section-number">01</span><div><h2 id="add-crop-title">Add to the field</h2><p>Search the local guide list, or enter a crop name to manage it without a guide.</p></div></div>
        <form className="crop-form" onSubmit={addCrop}>
          <label className="field crop-search-field"><span>Search crop guides or enter a crop name</span><input value={name} onChange={(event) => { setName(event.target.value); setSelectedGuideKey(""); }} placeholder="e.g. Maize, cassava, beans" autoComplete="off" aria-describedby="crop-guide-status" /></label>
          <label className="field"><span>Current stage</span><select value={stage} onChange={(event) => setStage(event.target.value)}>{DEFAULT_STAGES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <button className="button button-primary" type="submit">Add crop <span aria-hidden="true">+</span></button>

          {name.trim() && !selectedGuide && matchingGuides.length > 0 && <div className="guide-match-list" role="listbox" aria-label="Matching crop guides">{matchingGuides.map((guide) => <button className="guide-match-option" key={guide.key} type="button" role="option" aria-selected="false" onClick={() => chooseGuide(guide)}><span><strong>{guide.name}</strong><small>{guide.scientificName || "Crop entry"}</small></span><span className={`guide-match-status ${guide.verificationStatus}`}>{guide.verificationStatus === "verified" ? "KALRO source" : "Guide needed"}</span></button>)}</div>}

          <div className={`crop-guide-preview ${selectedGuide?.verificationStatus === "verified" ? "is-verified" : "is-missing"}`} id="crop-guide-status" aria-live="polite">
            {!name.trim() ? <><strong>Growing guidance is optional.</strong><span>Choose a source-backed guide or add a crop without entering technical ranges.</span></> : selectedGuide?.verificationStatus === "verified" ? <>
              <span className="guide-status-label">VERIFIED SOURCE · {selectedGuide.source.name}</span>
              <strong>{selectedGuide.recommendations.summary}</strong>
              <span>{selectedGuide.applicableRegion}</span>
              {selectedTemperature ? <span>Temperature reference: {selectedTemperature.min}–{selectedTemperature.max}{selectedTemperature.unit}. This is crop guidance, not a soil-sensor threshold.</span> : <span>Crop-specific soil-moisture and temperature thresholds: Not available in this source.</span>}
              <a href={selectedGuide.source.url} target="_blank" rel="noreferrer">Open source information ↗</a>
            </> : selectedGuide ? <>
              <span className="guide-status-label">UNVERIFIED ENTRY · NO SOURCE-BACKED THRESHOLDS</span>
              <strong>{MISSING_GUIDE_MESSAGE}</strong>
              <span>{selectedGuide.source.name}. Existing demo targets are not used.</span>
              <ResourceLinks />
            </> : matchingGuides.length === 0 ? <>
              <span className="guide-status-label">GUIDE NEEDED</span>
              <strong>{MISSING_GUIDE_MESSAGE}</strong>
              <ResourceLinks />
            </> : <>
              <span className="guide-status-label">POSSIBLE MATCHES</span>
              <strong>Select a matching entry to preview its source, or add “{name.trim()}” without a guide.</strong>
            </>}
          </div>
        </form>
      </section>

      <section className="field-list-section" aria-labelledby="field-list-title">
        <div className="section-marker section-marker-tight"><span className="section-number">02</span><div><h2 id="field-list-title">Your field list</h2><p>Choose a crop, update its growth stage, review source details or remove it.</p></div></div>
        {crops.length === 0 ? (
          <div className="empty-field"><span className="empty-seed" aria-hidden="true" /><h3>Your field list is ready to begin.</h3><p>Add the first crop above. It will be saved on this device for your next visit.</p></div>
        ) : (
          <div className="crop-list">
            {crops.map((crop, index) => {
              const editing = editingId === crop.id;
              const active = crop.id === currentCropId;
              const stageIndex = DEFAULT_STAGES.indexOf(crop.stage);
              const guide = crop.guide;
              const moistureTarget = crop.monitoringTargets?.soilMoisture;
              const temperatureTarget = crop.monitoringTargets?.temperature;
              const guideVerified = guide?.verificationStatus === "verified";
              const guideTemperature = guide?.recommendations?.preferredDayTemperature;
              return (
                <article className={`crop-row ${active ? "is-current" : ""}`} key={crop.id}>
                  <div className="crop-row-main">
                    <div className="crop-row-identity"><CropMark name={crop.name} /><div><span className="crop-row-index">PLOT {String(index + 1).padStart(2, "0")}{active && <span className="current-tag">CURRENT</span>}</span><h3>{crop.name}</h3><p>{guideVerified ? `Verified guide · ${guide.source?.name || "Agricultural source"}` : "Guide needed"}</p></div></div>
                    <div className="crop-stage-block"><div className="stage-title"><span>Growth stage</span><strong>{crop.stage}</strong></div><div className="stage-track" aria-label={`Stage ${crop.stage}`}>{DEFAULT_STAGES.map((item, itemIndex) => <span key={item} className={itemIndex <= stageIndex ? "stage-on" : ""} />)}</div><div className="stage-ends"><span>Planting</span><span>Harvest</span></div></div>
                    <div className="crop-profile-summary"><span>FIELD SENSOR TARGET</span><strong>{rangeText(moistureTarget, "%")}</strong></div>
                  </div>
                  <div className="crop-profile-line"><span>Temperature data <strong>{guideTemperature ? `${guideTemperature.min}–${guideTemperature.max}${guideTemperature.unit} · guide` : temperatureTarget ? `${rangeText(temperatureTarget, "°C")} · your range` : "Not available"}</strong></span><span className={`crop-guide-state ${guideVerified ? "verified" : "needed"}`}>{guideVerified ? "Guide available" : "Guide needed"}</span><label className="stage-picker"><span className="sr-only">Growth stage for {crop.name}</span><select value={crop.stage} onChange={(event) => updateCrop(crop.id, { stage: event.target.value })}>{DEFAULT_STAGES.map((item) => <option key={item}>{item}</option>)}</select></label></div>
                  {guideVerified && <div className="crop-source-detail"><span>{guide.recommendations?.summary}</span><span>Region: {guide.applicableRegion}</span><a href={guide.source.url} target="_blank" rel="noreferrer">View {guide.source.name} ↗</a></div>}
                  {!guideVerified && <div className="crop-source-detail"><span>{MISSING_GUIDE_MESSAGE}</span><ResourceLinks /></div>}
                  {crop.savedGuides?.length > 0 && <section className="crop-saved-guides" aria-label={`Saved source references for ${crop.name}`}><div className="crop-saved-guides-heading"><h4>Saved source references</h4><span>{crop.savedGuides.length} saved</span></div>{crop.savedGuides.map((reference) => <article className="crop-saved-reference" key={reference.id || reference.originalUrl}><div className="crop-saved-reference-meta"><span>IMPORTED REFERENCE · UNVERIFIED</span><time dateTime={reference.retrievedAt}>Retrieved {formatReferenceDate(reference.retrievedAt)}</time></div><h5>{reference.sourceTitle || "Saved crop reference"}</h5><p>{reference.summary || "No source summary was saved."}</p><div><span>{reference.sourceOrganization || "Source organization unavailable"} · not expert-reviewed</span>{reference.originalUrl && <a href={reference.originalUrl} target="_blank" rel="noreferrer">Open the original source</a>}</div></article>)}</section>}
                  {editing && <div className="profile-editor">
                    <p className="profile-editor-note">Optional farmer-entered comparison values. Use soil-moisture values only with a calibrated sensor. The dashboard's regional model estimate is never compared with these values.</p>
                    <label className="field"><span>Sensor moisture min (%)</span><input type="number" min="0" max="100" value={moistureTarget?.min ?? ""} onChange={(event) => updateMonitoringRange(crop, "soilMoisture", "min", event.target.value)} /></label>
                    <label className="field"><span>Sensor moisture max (%)</span><input type="number" min="0" max="100" value={moistureTarget?.max ?? ""} onChange={(event) => updateMonitoringRange(crop, "soilMoisture", "max", event.target.value)} /></label>
                    <label className="field"><span>Temperature min (°C)</span><input type="number" min="-10" max="60" value={temperatureTarget?.min ?? ""} onChange={(event) => updateMonitoringRange(crop, "temperature", "min", event.target.value)} /></label>
                    <label className="field"><span>Temperature max (°C)</span><input type="number" min="-10" max="60" value={temperatureTarget?.max ?? ""} onChange={(event) => updateMonitoringRange(crop, "temperature", "max", event.target.value)} /></label>
                    <button className="button button-primary" type="button" onClick={() => saveMonitoringTargets(crop)}>Save optional ranges</button>
                  </div>}
                  <div className="crop-row-actions">
                    <button className={`button ${active ? "button-selected" : "button-secondary"}`} type="button" onClick={() => { setCurrentCropId(crop.id); notify(`${crop.name} is now the selected crop.`, "success"); }}>{active ? "Selected crop" : "Select crop"}</button>
                    <button className="text-button" type="button" onClick={() => editing ? saveMonitoringTargets(crop) : setEditingId(crop.id)}>{editing ? "Close editor" : "Edit optional ranges"}</button>
                    <button className="text-button text-danger" type="button" onClick={() => setDeleteTarget(crop)}>Remove crop</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="field-notes-section" aria-labelledby="notes-title">
        <div className="section-marker"><span className="section-number">03</span><div><h2 id="notes-title">Field notes</h2><p>Keep the small observations that help explain how a crop is doing.</p></div></div>
        {!selectedCrop ? <div className="notes-empty">Add a crop before recording an observation.</div> : <div className="notes-layout">
          <form className="note-form" onSubmit={addNote}>
            <div className="note-form-top"><span className="note-label">NOTE FOR</span><strong>{selectedCrop.name}</strong></div>
            <label className="field"><span>Observation type</span><select value={noteType} onChange={(event) => setNoteType(event.target.value)}>{NOTE_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field"><span>Your observation</span><textarea rows="4" value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="What did you notice in the field?" /></label>
            <button className="button button-primary" type="submit" disabled={!noteText.trim()}>Save field note</button>
          </form>
          <div className="note-timeline">
            {cropNotes.length === 0 ? <div className="notes-empty"><strong>No notes for this crop yet.</strong><span>Observations are saved on this device and stay in date order.</span></div> : cropNotes.map((note) => <article className="note-entry" key={note.id}><span className="note-dot" /><div><div className="note-entry-meta"><span>{note.category}</span><time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</time></div><p>{note.text}</p></div><button className="note-remove" type="button" aria-label={`Delete note: ${note.text.slice(0, 24)}`} onClick={() => setNotes((previous) => previous.filter((item) => item.id !== note.id))}>×</button></article>)}
          </div>
        </div>}
      </section>

      {deleteTarget && <div className="dialog-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null); }}><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="remove-title"><p className="eyebrow">FIELD REGISTER</p><h2 id="remove-title">Remove {deleteTarget.name}?</h2><p>This crop will be removed from your field list. You can restore it from the message that appears next.</p><div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => setDeleteTarget(null)}>Keep crop</button><button className="button button-danger" type="button" onClick={confirmRemove}>Remove crop</button></div></section></div>}
    </div>
  );
}

function ResourceLinks() {
  return <div className="crop-resource-links">{AGRICULTURAL_RESOURCES.map((resource) => <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer">Find a growing guide at {resource.name} ↗</a>)}</div>;
}

export default Crops;
