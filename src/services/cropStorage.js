import { findCropGuide, guideSnapshot } from "../data/cropGuides.js";

const CROPS_KEY = "shambaSmart.crops.v1";

function validRange(value) {
  if (!value || typeof value !== "object") return null;
  const readNumber = (bound) => typeof bound === "number" && Number.isFinite(bound)
    ? bound
    : typeof bound === "string" && bound.trim() !== "" && Number.isFinite(Number(bound))
      ? Number(bound)
      : null;
  const min = readNumber(value.min);
  const max = readNumber(value.max);
  return min === null && max === null ? null : { min, max };
}

function normalizeCrop(crop) {
  const { idealMoisture, idealTemp, ...savedFields } = crop;
  const sourceLabel = String(crop.profileLabel || "").toLowerCase();
  const isFarmerProfile = sourceLabel.includes("custom field profile") || crop.monitoringTargetSource === "farmer";
  const guide = findCropGuide(crop.guide?.key || crop.guideKey || crop.name);
  const savedMoisture = crop.monitoringTargets?.soilMoisture
    || (isFarmerProfile ? idealMoisture : null);
  const savedTemperature = crop.monitoringTargets?.temperature
    || (isFarmerProfile ? idealTemp : null);
  const moistureRange = validRange(savedMoisture);
  const temperatureRange = validRange(savedTemperature);
  const legacyValues = crop.legacyProfileValues || ((!isFarmerProfile && (idealMoisture || idealTemp))
    ? { idealMoisture: idealMoisture || null, idealTemp: idealTemp || null, profileLabel: crop.profileLabel || null }
    : null);

  return {
    ...savedFields,
    guide: crop.guide?.verificationStatus
      ? { ...guideSnapshot(guide), ...crop.guide }
      : guideSnapshot(guide),
    guideKey: guide?.key || null,
    guideStatus: guide?.verificationStatus || "missing",
    monitoringTargets: {
      soilMoisture: moistureRange,
      temperature: temperatureRange,
    },
    monitoringTargetSource: (moistureRange || temperatureRange) ? "farmer" : null,
    legacyProfileValues: legacyValues,
    profileLabel: guide?.verificationStatus === "verified"
      ? `KALRO guide · ${guide.name}`
      : guide?.verificationStatus === "unverified" ? "Guide needed · unverified entry" : "Guide needed",
    autoWater: false,
  };
}

function readStoredCrops() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CROPS_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((crop) => crop && typeof crop === "object").map(normalizeCrop)
      : [];
  } catch {
    return [];
  }
}

function writeStoredCrops(crops) {
  try {
    localStorage.setItem(CROPS_KEY, JSON.stringify(crops.map(normalizeCrop)));
    return true;
  } catch {
    return false;
  }
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export const cropStorage = {
  key: CROPS_KEY,

  getAll() {
    return readStoredCrops();
  },

  saveAll(crops) {
    return writeStoredCrops(crops);
  },

  create(payload) {
    const crops = readStoredCrops();
    const crop = normalizeCrop({
      id: createId(),
      name: payload.name || "New crop",
      stage: payload.stage || "Seedling",
      health: typeof payload.health === "number" ? payload.health : null,
      lastWateredMinutes: null,
      autoWater: false,
      monitoringTargets: { soilMoisture: null, temperature: null },
      ...payload,
    });
    writeStoredCrops([...crops, crop]);
    return crop;
  },

  update(id, updates) {
    const crops = readStoredCrops();
    let updated = null;
    const next = crops.map((crop) => {
      if (String(crop.id) !== String(id)) return crop;
      updated = normalizeCrop({ ...crop, ...updates });
      return updated;
    });
    if (updated) writeStoredCrops(next);
    return updated;
  },

  remove(id) {
    const crops = readStoredCrops();
    const next = crops.filter((crop) => String(crop.id) !== String(id));
    writeStoredCrops(next);
    return crops.length !== next.length;
  },
};
