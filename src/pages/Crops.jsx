import { useMemo, useRef, useState } from "react";
import { searchCropKnowledge, searchCropGrowingRanges } from "../services/cropKnowledge";
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

function completeRange(range) {
  return Boolean(range && Number.isFinite(range.min) && Number.isFinite(range.max) && range.min < range.max);
}

function cropGuidanceRanges(crop) {
  return {
    temperature: crop.growingGuidance?.ranges?.temperature || crop.guide?.recommendations?.preferredDayTemperature || null,
    soilMoistureSensor: crop.growingGuidance?.ranges?.soilMoistureSensor || crop.guide?.recommendations?.soilMoistureSensorRange || null,
  };
}

function guidanceStatus(ranges) {
  const hasTemperature = completeRange(ranges.temperature);
  const hasSensorRange = completeRange(ranges.soilMoistureSensor);
  if (hasTemperature && hasSensorRange) return "complete";
  return hasTemperature || hasSensorRange ? "partial" : "incomplete";
}

function guidanceField(range, source, confidence, retrievedAt, evidence = "") {
  if (!completeRange(range)) return null;
  return {
    min: range.min,
    max: range.max,
    unit: range.unit || "°C",
    label: range.label || "",
    measurementType: range.measurementType || "crop growing temperature",
    source: { organization: source.organization, title: source.title, url: source.url },
    confidence,
    verificationStatus: source.verificationStatus || (confidence === 'locally-reviewed' ? 'verified' : 'unverified'),
    retrievedAt,
    evidence: evidence || range.evidence || "",
  };
}

function uniqueSources(sources) {
  const seen = new Set();
  return sources.filter((source) => {
    const key = source.url || source.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function normalizedCropName(value) {
  return String(value || "").trim().toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

function candidateRangeKey(candidate) {
  return [candidate.min, candidate.max, candidate.unit || ""].join(":");
}

function candidateMatchesCropVariety(candidate, crop) {
  const variety = normalizedCropName(crop.variety);
  const evidence = normalizedCropName(candidate.evidence);
  if (!variety || !/\b(?:variety|cultivar|hybrid)\b/i.test(evidence)) return true;
  return evidence.includes(variety);
}

function guidanceCandidates(results, field, crop) {
  return results.flatMap((result) => {
    const items = field === "temperature"
      ? (result.temperatureCandidates?.length ? result.temperatureCandidates : result.temperatureRange ? [result.temperatureRange] : [])
      : (result.soilMoistureCandidates?.length ? result.soilMoistureCandidates : result.soilMoistureSensorRange ? [result.soilMoistureSensorRange] : []);
    return items.map((candidate) => ({
      ...candidate,
      source: {
        organization: result.organization || "Wikipedia",
        title: result.title,
        url: result.url,
        confidence: "externally-retrieved-unverified",
        verificationStatus: "unverified",
        retrievedAt: result.retrievedAt,
      },
      varietyMatches: candidateMatchesCropVariety(candidate, crop),
    }));
  });
}

function distinctGuidanceRanges(candidates) {
  return [...new Map(candidates.map((candidate) => [candidateRangeKey(candidate), candidate])).values()];
}

function conflictOption(candidate) {
  return {
    min: candidate.min,
    max: candidate.max,
    unit: candidate.unit,
    section: candidate.section || "",
    evidence: candidate.evidence || "",
    source: candidate.source,
    reason: candidate.varietyMatches ? "" : "The source names a different or unspecified variety context.",
  };
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
  const [referencePreview, setReferencePreview] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState(NOTE_TYPES[0]);
  const selectedGuide = CROP_GUIDES.find((guide) => guide.key === selectedGuideKey) || findCropGuide(name);
  const matchingGuides = useMemo(() => searchCropGuides(name).slice(0, 5), [name]);
  const selectedCrop = crops.find((crop) => crop.id === currentCropId) || crops[0] || null;
  const cropNotes = useMemo(() => notes.filter((note) => note.cropId === selectedCrop?.id), [notes, selectedCrop?.id]);

  const lookupIdsRef = useRef(new Set());
  const [loadingGuidanceIds, setLoadingGuidanceIds] = useState(() => new Set());

  const updateCrop = (cropId, updates) => {
    setCrops((previous) => previous.map((crop) => crop.id === cropId ? { ...crop, ...updates } : crop));
  };

  const lookupAndApply = async (crop) => {
    if (!crop?.id || lookupIdsRef.current.has(crop.id)) return;
    lookupIdsRef.current.add(crop.id);
    setLoadingGuidanceIds((previous) => new Set(previous).add(crop.id));

    const checkedAt = new Date().toISOString();
    const previousGuidance = crop.growingGuidance || {};
    const ranges = { ...(previousGuidance.ranges || {}) };
    const sources = Array.isArray(previousGuidance.sources) ? [...previousGuidance.sources] : [];
    const ambiguities = { ...(previousGuidance.ambiguities || {}) };
    const applied = { temperature: false, soilMoistureSensor: false };
    const localGuide = findCropGuide(crop.guide?.key || crop.guideKey || crop.name);
    const localSource = localGuide?.verificationStatus === "verified" ? {
      organization: localGuide.source?.name || "Agricultural source",
      title: localGuide.source?.name || localGuide.name,
      url: localGuide.source?.url || "",
      confidence: "locally-reviewed",
      verificationStatus: "verified",
      appliedAt: checkedAt,
    } : null;

    if (localSource) {
      sources.push(localSource);
      const recommendations = localGuide.recommendations || {};
      if (!completeRange(ranges.temperature) && completeRange(recommendations.preferredDayTemperature)) {
        ranges.temperature = guidanceField(recommendations.preferredDayTemperature, localSource, "locally-reviewed", null);
        applied.temperature = true;
        delete ambiguities.temperature;
      }
      if (!completeRange(ranges.soilMoistureSensor) && completeRange(recommendations.soilMoistureSensorRange)) {
        ranges.soilMoistureSensor = guidanceField(
          { ...recommendations.soilMoistureSensorRange, unit: recommendations.soilMoistureSensorRange.unit || "%", measurementType: "soil-moisture sensor reading" },
          localSource,
          "locally-reviewed",
          null,
          "The reviewed source explicitly identifies this as a soil-moisture sensor range."
        );
        applied.soilMoistureSensor = true;
        delete ambiguities.soilMoistureSensor;
      }
    }

    let lookupStatus = localSource ? "local-guide" : "no-match";
    let externalResults = [];
    let lookupError = null;
    try {
      if (!completeRange(ranges.temperature) || !completeRange(ranges.soilMoistureSensor)) {
        externalResults = await searchCropGrowingRanges({
          crop: localGuide?.name || crop.name,
          variety: crop.variety || "",
          location: crop.region || crop.county || "",
          stage: crop.stage || "",
        });
      }

      const temperatureCandidates = guidanceCandidates(externalResults, "temperature", crop);
      const applicableTemperature = temperatureCandidates.filter((candidate) => candidate.varietyMatches);
      const distinctTemperatures = distinctGuidanceRanges(applicableTemperature);
      const varietyMismatchTemperatures = temperatureCandidates.filter((candidate) => !candidate.varietyMatches);

      if (!completeRange(ranges.temperature)) {
        if (distinctTemperatures.length === 1 && varietyMismatchTemperatures.length === 0) {
          const candidate = distinctTemperatures[0];
          const source = candidate.source;
          sources.push(source);
          ranges.temperature = guidanceField(candidate, source, "externally-retrieved-unverified", source.retrievedAt, candidate.evidence);
          applied.temperature = true;
          delete ambiguities.temperature;
        } else if (distinctTemperatures.length > 1 || varietyMismatchTemperatures.length > 0) {
          ambiguities.temperature = temperatureCandidates.map(conflictOption);
        }
      }

      const moistureCandidates = guidanceCandidates(externalResults, "soilMoistureSensor", crop);
      const applicableMoisture = moistureCandidates.filter((candidate) => candidate.varietyMatches);
      const distinctMoisture = distinctGuidanceRanges(applicableMoisture);
      const varietyMismatchMoisture = moistureCandidates.filter((candidate) => !candidate.varietyMatches);
      if (!completeRange(ranges.soilMoistureSensor)) {
        if (distinctMoisture.length === 1 && varietyMismatchMoisture.length === 0) {
          const candidate = distinctMoisture[0];
          const source = candidate.source;
          sources.push(source);
          ranges.soilMoistureSensor = guidanceField(candidate, source, "externally-retrieved-unverified", source.retrievedAt, candidate.evidence);
          applied.soilMoistureSensor = true;
          delete ambiguities.soilMoistureSensor;
        } else if (distinctMoisture.length > 1 || varietyMismatchMoisture.length > 0) {
          ambiguities.soilMoistureSensor = moistureCandidates.map(conflictOption);
        }
      }

      if (ambiguities.temperature?.length || ambiguities.soilMoistureSensor?.length) {
        lookupStatus = "conflict";
      } else if (applied.temperature || applied.soilMoistureSensor) {
        lookupStatus = "applied";
      } else if (externalResults.length > 0) {
        lookupStatus = "source-found";
      } else {
        lookupStatus = "no-match";
      }
    } catch (error) {
      lookupError = error;
      lookupStatus = "error";
    }

    const retrievedSources = externalResults.filter((result) => result.url).map((result) => ({
      organization: result.organization || "Wikipedia",
      title: result.title,
      url: result.url,
      confidence: "externally-retrieved-unverified",
      verificationStatus: "unverified",
      retrievedAt: result.retrievedAt || checkedAt,
    }));
    sources.push(...retrievedSources);

    const guidance = {
      ...previousGuidance,
      cropName: crop.name,
      variety: crop.variety || previousGuidance.variety || null,
      region: crop.region || crop.county || localGuide?.applicableRegion || previousGuidance.region || null,
      growthStage: crop.stage || null,
      checkedAt,
      status: guidanceStatus(ranges),
      ranges,
      sources: uniqueSources(sources),
      ambiguities,
      missing: [
        ...(!completeRange(ranges.temperature) ? ["temperature"] : []),
        ...(!completeRange(ranges.soilMoistureSensor) ? ["soil-moisture sensor range"] : []),
      ],
      lookupStatus,
      message: lookupError ? "The external source could not be reached. Existing crop values were preserved." : "",
    };

    const updates = { growingGuidance: guidance };
    const referenceResult = externalResults.find((result) => result.url) || null;
    if (referenceResult) {
      const accessedAt = referenceResult.retrievedAt || checkedAt;
      const reference = {
        id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
        sourceTitle: referenceResult.title,
        sourceOrganization: referenceResult.organization || "Wikipedia",
        originalUrl: referenceResult.url,
        summary: (referenceResult.extract || referenceResult.description || "").slice(0, 1200),
        evidence: [...(referenceResult.temperatureCandidates || []), ...(referenceResult.soilMoistureCandidates || [])]
          .map((candidate) => candidate.evidence)
          .filter(Boolean)
          .slice(0, 3)
          .join(" "),
        accessedAt,
        retrievedAt: accessedAt,
        cropName: crop.name,
        topic: "cultivation",
        verificationStatus: "unverified",
        expertReviewed: false,
      };
      if (!crop.savedGuides?.some((item) => item.originalUrl === reference.originalUrl)) {
        updates.savedGuides = [...(Array.isArray(crop.savedGuides) ? crop.savedGuides : []), reference];
      }
    }

    updateCrop(crop.id, updates);

    const appliedParts = [];
    if (applied.temperature) {
      const range = ranges.temperature;
      appliedParts.push("temperature " + range.min + "–" + range.max + range.unit);
    }
    if (applied.soilMoistureSensor) {
      const range = ranges.soilMoistureSensor;
      appliedParts.push("soil-moisture sensor " + range.min + "–" + range.max + range.unit);
    }
    const unavailableParts = [
      ...(!completeRange(ranges.temperature) ? ["no suitable crop temperature range was established"] : []),
      ...(!completeRange(ranges.soilMoistureSensor) ? ["no suitable soil-moisture sensor threshold was found"] : []),
    ];
    const conflictParts = Object.keys(ambiguities).filter((field) => ambiguities[field]?.length)
      .map((field) => (field === "temperature" ? "temperature" : "soil-moisture sensor") + " options conflict and were left unapplied");
    let message = crop.name + (appliedParts.length ? " growing guidance updated. Applied " + appliedParts.join(" and ") + "." : " growing guidance checked. No new numerical range was applied.");

    if (conflictParts.length) message += " " + conflictParts.join("; ") + ".";
    if (unavailableParts.length) message += " " + unavailableParts.join(". ") + ".";
    if (lookupError) message += " The external lookup failed; existing values were kept.";
    notify(message, lookupError || conflictParts.length ? "warning" : appliedParts.length ? "success" : "info");

    lookupIdsRef.current.delete(crop.id);
    setLoadingGuidanceIds((previous) => {
      const next = new Set(previous);
      next.delete(crop.id);
      return next;
    });
  };

  const addCrop = (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return notify("Enter a crop name to add it to your field list.", "warning");

    const findRanges = event.nativeEvent?.submitter?.value === "lookup";
    const selected = selectedGuide || findCropGuide(trimmed);
    const cropName = selected?.name || trimmed;
    const normalizedName = normalizedCropName(cropName);
    const existingCrop = crops.find((crop) => normalizedCropName(crop.name) === normalizedName
      || (selected && findCropGuide(crop.name)?.key === selected.key));

    if (existingCrop) {
      setCurrentCropId(existingCrop.id);
      setName("");
      setStage("Seedling");
      setSelectedGuideKey("");
      if (findRanges) {
        notify(existingCrop.name + " is already in your field list. Looking up its growing ranges now.", "info");
        void lookupAndApply(existingCrop);
      } else {
        notify(existingCrop.name + " is already in your field list. It has been selected; no duplicate was added.", "info");
      }
      return;
    }

    const guide = guideSnapshot(selected);
    const created = cropStorage.create({ name: cropName, stage, guide });
    setCrops((previous) => [created, ...previous]);
    setCurrentCropId(created.id);
    setName("");
    setStage("Seedling");
    setSelectedGuideKey("");
    notify(findRanges ? created.name + " added. Looking up growing ranges now." : created.name + " added to your field list.", "success");
    if (findRanges) void lookupAndApply(created);
  };
  const requestSaveReference = (crop, result, topic) => {
    setReferencePreview({ cropId: crop.id, cropName: crop.name, result, topic });
  };

  const confirmSaveReference = () => {
    if (!referencePreview) return;
    const crop = crops.find((item) => item.id === referencePreview.cropId);
    if (!crop) {
      setReferencePreview(null);
      notify("That crop is no longer in your field list.", "warning");
      return;
    }
    if (crop.savedGuides?.some((item) => item.originalUrl === referencePreview.result.url)) {
      setReferencePreview(null);
      notify("That Wikipedia article is already saved for this crop.", "info");
      return;
    }
    const accessedAt = referencePreview.result.retrievedAt || new Date().toISOString();
    const reference = {
      id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
      sourceTitle: referencePreview.result.title,
      sourceOrganization: "Wikipedia",
      originalUrl: referencePreview.result.url,
      summary: referencePreview.result.extract || referencePreview.result.description || "",
      accessedAt,
      retrievedAt: accessedAt,
      cropName: referencePreview.cropName,
      topic: referencePreview.topic,
      verificationStatus: "unverified",
      expertReviewed: false,
    };
    setCrops((previous) => previous.map((item) => item.id === referencePreview.cropId
      ? { ...item, savedGuides: [...(Array.isArray(item.savedGuides) ? item.savedGuides : []), reference] }
      : item));
    setReferencePreview(null);
    notify("Wikipedia reference saved to " + referencePreview.cropName + ". Verified growing targets were not changed.", "success");
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
    const reversed = ranges.some((range) => range && range.min !== null && range.max !== null && range.min >= range.max);
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
          <div className="crop-form-actions"><button className="button button-secondary" type="submit" name="intent" value="lookup" disabled={!name.trim()}>Find &amp; Apply Growing Ranges</button><button className="button button-primary" type="submit" name="intent" value="add">Add crop <span aria-hidden="true">+</span></button></div>

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
              const guidedRanges = cropGuidanceRanges(crop);
              const guideTemperature = guidedRanges.temperature;
              const moistureGuidance = guidedRanges.soilMoistureSensor;
              const rangeState = guidanceStatus(guidedRanges);
              const isLookingUp = loadingGuidanceIds.has(crop.id);
              return (
                <article className={`crop-row ${active ? "is-current" : ""}`} key={crop.id}>
                  <div className="crop-row-main">
                    <div className="crop-row-identity"><CropMark name={crop.name} /><div><span className="crop-row-index">PLOT {String(index + 1).padStart(2, "0")}{active && <span className="current-tag">CURRENT</span>}</span><h3>{crop.name}</h3><p>{guideVerified ? `Verified guide · ${guide.source?.name || "Agricultural source"}` : "Guide needed"}</p></div></div>
                    <div className="crop-stage-block"><div className="stage-title"><span>Growth stage</span><strong>{crop.stage}</strong></div><div className="stage-track" aria-label={`Stage ${crop.stage}`}>{DEFAULT_STAGES.map((item, itemIndex) => <span key={item} className={itemIndex <= stageIndex ? "stage-on" : ""} />)}</div><div className="stage-ends"><span>Planting</span><span>Harvest</span></div></div>
                    <div className="crop-profile-summary"><span>{moistureGuidance?.confidence === "externally-retrieved-unverified" ? "SENSOR RANGE · UNVERIFIED SOURCE" : completeRange(moistureGuidance) ? "SOURCE SENSOR RANGE" : "FARMER SENSOR RANGE"}</span><strong>{rangeText(moistureGuidance || moistureTarget, "%")}</strong>{completeRange(moistureGuidance) && completeRange(moistureTarget) && <small className="saved-farmer-range">Your range: {rangeText(moistureTarget, "%")}</small>}</div>
                  </div>
                  <div className="crop-profile-line"><span>Temperature guidance <strong>{completeRange(guideTemperature) ? rangeText(guideTemperature, guideTemperature.unit || "°C") + (guideTemperature?.confidence === "externally-retrieved-unverified" ? " · unverified source" : crop.growingGuidance?.ranges?.temperature ? " · source" : " · guide") : temperatureTarget ? rangeText(temperatureTarget, "°C") + " · your range" : "Not available"}</strong>{completeRange(guideTemperature) && completeRange(temperatureTarget) && <small className="saved-farmer-range">Your range: {rangeText(temperatureTarget, "°C")}</small>}</span><span className={"crop-guide-state " + (rangeState === "complete" ? "verified" : "needed")}>{rangeState === "complete" ? "Ranges complete" : rangeState === "partial" ? "Partial ranges" : "Ranges needed"}</span><label className="stage-picker"><span className="sr-only">Growth stage for {crop.name}</span><select value={crop.stage} onChange={(event) => updateCrop(crop.id, { stage: event.target.value })}>{DEFAULT_STAGES.map((item) => <option key={item}>{item}</option>)}</select></label></div>
                  {guideVerified && <div className="crop-source-detail"><span>{guide.recommendations?.summary}</span><span>Region: {guide.applicableRegion}</span><a href={guide.source.url} target="_blank" rel="noreferrer">View {guide.source.name} ↗</a></div>}
                  {!guideVerified && <div className="crop-source-detail"><span>{MISSING_GUIDE_MESSAGE}</span><ResourceLinks /></div>}
                  <CropWikipediaSearch crop={crop} onSaveReference={requestSaveReference} />
                  {crop.savedGuides?.length > 0 && <section className="crop-saved-guides" aria-label={`Saved source references for ${crop.name}`}><div className="crop-saved-guides-heading"><h4>Saved source references</h4><span>{crop.savedGuides.length} saved</span></div>{crop.savedGuides.map((reference) => <article className="crop-saved-reference" key={reference.id || reference.originalUrl}><div className="crop-saved-reference-meta"><span>SAVED REFERENCE · UNVERIFIED</span><time dateTime={reference.accessedAt || reference.retrievedAt}>{reference.accessedAt ? "Accessed " : "Retrieved "}{formatReferenceDate(reference.accessedAt || reference.retrievedAt)}</time></div><h5>{reference.sourceTitle || "Saved crop reference"}</h5><p>{reference.summary || "No source summary was saved."}</p><div><span>{reference.sourceOrganization || "Source organization unavailable"} · not expert-reviewed</span>{reference.originalUrl && <a href={reference.originalUrl} target="_blank" rel="noreferrer">Open the original source</a>}</div></article>)}</section>}
                  {editing && <div className="profile-editor">
                    <p className="profile-editor-note">Optional farmer-entered comparison values. Use soil-moisture values only with a calibrated sensor. The dashboard's regional model estimate is never compared with these values.</p>
                    <label className="field"><span>Sensor moisture min (%)</span><input type="number" min="0" max="100" value={moistureTarget?.min ?? ""} onChange={(event) => updateMonitoringRange(crop, "soilMoisture", "min", event.target.value)} /></label>
                    <label className="field"><span>Sensor moisture max (%)</span><input type="number" min="0" max="100" value={moistureTarget?.max ?? ""} onChange={(event) => updateMonitoringRange(crop, "soilMoisture", "max", event.target.value)} /></label>
                    <label className="field"><span>Temperature min (°C)</span><input type="number" min="-10" max="60" value={temperatureTarget?.min ?? ""} onChange={(event) => updateMonitoringRange(crop, "temperature", "min", event.target.value)} /></label>
                    <label className="field"><span>Temperature max (°C)</span><input type="number" min="-10" max="60" value={temperatureTarget?.max ?? ""} onChange={(event) => updateMonitoringRange(crop, "temperature", "max", event.target.value)} /></label>
                    <button className="button button-primary" type="button" onClick={() => saveMonitoringTargets(crop)}>Save optional ranges</button>
                  </div>}
                  {crop.growingGuidance && <div className="growing-range-detail" aria-live="polite">
                    <div className="growing-range-heading"><strong>GROWING RANGES · {crop.growingGuidance.status || "incomplete"}</strong>{crop.growingGuidance.checkedAt && <time dateTime={crop.growingGuidance.checkedAt}>Checked {formatReferenceDate(crop.growingGuidance.checkedAt)}</time>}</div>
                    <p><span>Temperature:</span> {completeRange(guidedRanges.temperature) ? rangeText(guidedRanges.temperature, guidedRanges.temperature.unit || "°C") : "not established"}</p>
                    {guidedRanges.temperature?.evidence && <blockquote className="growing-range-evidence">{guidedRanges.temperature.evidence}</blockquote>}
                    <p><span>Soil-moisture sensor:</span> {completeRange(guidedRanges.soilMoistureSensor) ? rangeText(guidedRanges.soilMoistureSensor, guidedRanges.soilMoistureSensor.unit || "%") + (guidedRanges.soilMoistureSensor.confidence === "externally-retrieved-unverified" ? " · unverified source" : " · reviewed source") : "not established by the available source"}</p>
                    <p><span>Context at lookup:</span> {crop.growingGuidance.region || "No growing region provided"} · {crop.growingGuidance.growthStage || crop.stage} stage; the source may not be stage-specific.</p>
                    {crop.growingGuidance.missing?.length > 0 && <p>Still unavailable: {crop.growingGuidance.missing.join(", ")}. General rainfall or water-use guidance is not converted into a sensor threshold.</p>}
                    {crop.growingGuidance.lookupStatus === "error" && <p className="growing-range-message is-error">{crop.growingGuidance.message || "The external search failed. Existing ranges were kept; you can retry."}</p>}
                    {crop.growingGuidance.lookupStatus === "no-match" && <p className="growing-range-message">No relevant article was found. Unsupported ranges remain blank.</p>}{crop.growingGuidance.lookupStatus === "conflict" && <p className="growing-range-message">Sources disagree or refer to different contexts. No conflicting range was applied.</p>}{Object.entries(crop.growingGuidance.ambiguities || {}).map(([field, options]) => options?.length ? <section className="growing-range-conflicts" key={field}><strong>{field === "temperature" ? "Temperature" : "Soil-moisture sensor"} source options</strong><ul>{options.map((option, optionIndex) => <li key={(option.source?.url || "option") + optionIndex}><span>{option.min}–{option.max}{option.unit} · {option.section || "growing guidance"}</span>{option.source?.url && <> · <a href={option.source.url} target="_blank" rel="noreferrer">{option.source.title}</a></>}{option.reason && <span> · {option.reason}</span>}{option.evidence && <blockquote>{option.evidence}</blockquote>}</li>)}</ul></section> : null)}
                    {crop.growingGuidance.sources?.length > 0 && <div className="growing-range-sources">{crop.growingGuidance.sources.map((source) => <span key={source.url || source.title}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.title || source.organization}</a> : source.title || source.organization} · {source.confidence === "locally-reviewed" ? "locally reviewed" : "external, unverified"} · {source.retrievedAt ? "Retrieved " : source.appliedAt ? "Applied " : ""}{formatReferenceDate(source.retrievedAt || source.appliedAt)}</span>)}</div>}
                  </div>}
                  <div className="crop-row-actions">
                    {rangeState !== "complete" && <button className="button button-secondary growing-range-button" type="button" onClick={() => lookupAndApply(crop)} disabled={isLookingUp}>{isLookingUp ? "Searching sources…" : "Find & Apply Growing Ranges"}</button>}
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
      {referencePreview && <div className="dialog-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReferencePreview(null); }}>
        <section className="confirm-dialog reference-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="reference-preview-title">
          <p className="eyebrow">WIKIPEDIA REFERENCE · {referencePreview.cropName.toUpperCase()}</p>
          <h2 id="reference-preview-title">Save this article?</h2>
          <h3>{referencePreview.result.title}</h3>
          <p>{referencePreview.result.extract || referencePreview.result.description || "No summary is available for this article."}</p>
          <a className="reference-preview-link" href={referencePreview.result.url} target="_blank" rel="noreferrer">Open the original Wikipedia article</a>
          <p className="reference-preview-date">Date accessed: {formatReferenceDate(referencePreview.result.retrievedAt)}</p>
          <p className="reference-preview-note">This will be stored as an unverified source reference for {referencePreview.cropName}. It will not change growing targets.</p>
          <div className="dialog-actions">
            <button className="button button-secondary" type="button" onClick={() => setReferencePreview(null)}>Cancel</button>
            <button className="button button-primary" type="button" onClick={confirmSaveReference}>Save to {referencePreview.cropName}</button>
          </div>
        </section>
      </div>}
    </div>
  );
}

function ResourceLinks() {
  return <div className="crop-resource-links">{AGRICULTURAL_RESOURCES.map((resource) => <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer">Find a growing guide at {resource.name} ↗</a>)}</div>;
}

const WIKIPEDIA_TOPICS = [
  { value: "cultivation", label: "Cultivation" },
  { value: "soil", label: "Soil" },
  { value: "planting", label: "Planting" },
  { value: "irrigation", label: "Irrigation" },
  { value: "varieties", label: "Varieties" },
  { value: "pests", label: "Pests and Diseases" },
  { value: "harvesting", label: "Harvesting" },
];

function CropWikipediaSearch({ crop, onSaveReference }) {
  const [topic, setTopic] = useState("cultivation");
  const [searchState, setSearchState] = useState({ status: "idle", results: [], error: "" });

  const search = async (event) => {
    event.preventDefault();
    setSearchState({ status: "loading", results: [], error: "" });
    try {
      const results = await searchCropKnowledge({ crop: crop.name, topic });
      setSearchState({ status: "complete", results, error: "" });
    } catch {
      setSearchState({
        status: "error",
        results: [],
        error: "Wikipedia could not be reached. Check your connection and try again. No crop guidance was generated.",
      });
    }
  };

  return (
    <section className="crop-wiki-search" aria-labelledby={"wiki-search-heading-" + crop.id}>
      <div className="crop-wiki-heading">
        <div>
          <span className="crop-wiki-kicker">WIKIPEDIA · GENERAL INFORMATION</span>
          <h4 id={"wiki-search-heading-" + crop.id}>Explore {crop.name}</h4>
          <p>Search is tied to this crop. Review the source before applying advice in your field.</p>
        </div>
        <span className="crop-wiki-subject"><small>SELECTED CROP</small><strong>{crop.name}</strong></span>
      </div>
      <form className="crop-wiki-form" onSubmit={search}>
        <label className="field">
          <span>Agricultural topic</span>
          <select value={topic} onChange={(event) => {
            setTopic(event.target.value);
            setSearchState({ status: "idle", results: [], error: "" });
          }}>
            {WIKIPEDIA_TOPICS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
          </select>
        </label>
        <button className="button button-primary" type="submit" disabled={searchState.status === "loading"}>
          {searchState.status === "loading" ? "Searching Wikipedia…" : "Search Wikipedia"}
        </button>
      </form>
      <p className="crop-wiki-disclaimer">Wikipedia is a general encyclopedia. It is not a verified local growing guide, and its search summaries never set crop targets.</p>
      <div className="crop-wiki-results" aria-live="polite">
        {searchState.status === "loading" && <p className="crop-wiki-state">Searching Wikipedia for {crop.name}…</p>}
        {searchState.status === "error" && <div className="crop-wiki-state is-error"><p>{searchState.error}</p><ResourceLinks /></div>}
        {searchState.status === "complete" && searchState.results.length === 0 && (
          <div className="crop-wiki-state">
            <p>No article could be confidently matched to {crop.name} and this topic. Try another agricultural topic or check a local KALRO resource.</p>
            <ResourceLinks />
          </div>
        )}
        {searchState.status === "complete" && searchState.results.length > 0 && (
          <div className="crop-wiki-result-list">
            {searchState.results.map((result, index) => (
              <article className="crop-wiki-result" key={result.url || result.title + index}>
                <div className="crop-wiki-result-copy">
                  <span className="crop-wiki-source-label">WIKIPEDIA · UNVERIFIED</span>
                  <h5>{result.title}</h5>
                  <p>{result.extract || result.description || "Wikipedia did not provide a summary for this article."}</p>
                </div>
                <div className="crop-wiki-result-actions">
                  {result.url && <a href={result.url} target="_blank" rel="noreferrer">Open Wikipedia article</a>}
                  <button className="text-button" type="button" disabled={!result.url} onClick={() => onSaveReference(crop, result, topic)}>Save reference to {crop.name}</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
export default Crops;
