const DEFAULT_STAGES = ["Seedling", "Vegetative", "Flowering", "Fruiting", "Harvest"];

export const AGRICULTURAL_RESOURCES = [
  { name: "KALRO Good Agricultural Practices", url: "https://kalrogaps.info/" },
  { name: "Kenya Digital Agriculture Platform (KALRO)", url: "https://keep.kalro.org/" },
];

export const CROP_GUIDES = [
  {
    key: "maize",
    name: "Maize",
    scientificName: "Zea mays",
    aliases: ["mahindi", "oduma", "bando", "madumwa", "corn"],
    verificationStatus: "verified",
    supportedGrowthStages: null,
    source: {
      name: "Kenya Digital Agriculture Platform (KALRO) · Maize",
      url: "https://keep.kalro.org/good-agricultural-practices/Maize",
    },
    applicableRegion: "Kenya. KALRO notes that suitable varieties and performance differ by agro-ecological zone, soil and maturity period.",
    recommendations: {
      summary: "KALRO describes maize as adaptable across a range of Kenyan agro-ecological zones and soil types. It identifies deep, well-drained, well-aerated soils with organic matter as suitable conditions.",
      cropWater: null,
      soilMoistureSensorRange: null,
      preferredDayTemperature: null,
    },
    limitations: [
      "The reviewed page does not provide a soil-moisture sensor threshold, irrigation schedule or temperature range.",
      "It is a general value-chain overview; choose guidance for the local variety, zone and growth stage.",
    ],
    localNotes: null,
  },
  {
    key: "cassava",
    name: "Cassava",
    scientificName: "Manihot esculenta",
    aliases: ["muhogo", "omuogo", "mariwa", "marieba"],
    verificationStatus: "verified",
    supportedGrowthStages: null,
    source: {
      name: "KALRO Good Agricultural Practices · Cassava",
      url: "https://www.kalrogaps.info/index.php/gaps-by-value-chain/cassava",
    },
    applicableRegion: "Kenyan smallholder context. Local rainfall distribution, soil, variety and altitude affect suitability.",
    recommendations: {
      summary: "KALRO describes cassava as drought tolerant, while noting that well-distributed rainfall and deep, well-drained soil support production and root development.",
      cropWater: "The KALRO page gives annual rainfall context (generally 1,000–1,500 mm, with production possible from about 500 mm when rainfall is well distributed). This is rainfall guidance, not a sensor percentage or irrigation schedule.",
      soilMoistureSensorRange: null,
      preferredDayTemperature: {
        min: 25,
        max: 29,
        unit: "°C",
        label: "Preferred day temperature during the growing period",
      },
    },
    limitations: [
      "The rainfall guidance is not a soil-moisture sensor threshold and does not account for this farm's soil or irrigation system.",
      "The page does not provide stage-specific recommendations; check local variety and site advice.",
    ],
    localNotes: null,
  },
  {
    key: "beans",
    name: "Beans",
    scientificName: "Phaseolus vulgaris",
    aliases: ["common bean", "maharagwe"],
    verificationStatus: "unverified",
    supportedGrowthStages: null,
    source: { name: "Legacy Shamba-Smart demo entry; no source supplied", url: null },
    applicableRegion: null,
    recommendations: null,
    limitations: ["The earlier demo entry had no traceable agricultural source. Its old numerical targets are not used."],
    localNotes: "No verified growing guide is attached to this legacy entry yet.",
  },
  {
    key: "tomato",
    name: "Tomato",
    scientificName: "Solanum lycopersicum",
    aliases: ["nyanya"],
    verificationStatus: "unverified",
    supportedGrowthStages: null,
    source: { name: "Legacy Shamba-Smart demo entry; no source supplied", url: null },
    applicableRegion: null,
    recommendations: null,
    limitations: ["The earlier demo entry had no traceable agricultural source. Its old numerical targets are not used."],
    localNotes: "No verified growing guide is attached to this legacy entry yet.",
  },
  {
    key: "sukuma",
    name: "Sukuma Wiki",
    scientificName: "Brassica oleracea (kale group)",
    aliases: ["kale", "collard greens"],
    verificationStatus: "unverified",
    supportedGrowthStages: null,
    source: { name: "Legacy Shamba-Smart demo entry; no source supplied", url: null },
    applicableRegion: null,
    recommendations: null,
    limitations: ["The earlier demo entry had no traceable agricultural source. Its old numerical targets are not used."],
    localNotes: "No verified growing guide is attached to this legacy entry yet.",
  },
];

export function guideSnapshot(guide) {
  if (!guide) return { key: null, verificationStatus: "missing" };
  return {
    key: guide.key,
    name: guide.name,
    scientificName: guide.scientificName,
    verificationStatus: guide.verificationStatus,
    supportedGrowthStages: guide.supportedGrowthStages,
    source: guide.source,
    applicableRegion: guide.applicableRegion,
    recommendations: guide.recommendations,
    limitations: guide.limitations,
    localNotes: guide.localNotes,
  };
}

export function findCropGuide(value) {
  const search = String(value || "").trim().toLocaleLowerCase();
  if (!search) return null;
  return CROP_GUIDES.find((guide) => [guide.key, guide.name, guide.scientificName, ...guide.aliases]
    .some((entry) => entry.toLocaleLowerCase() === search)) || null;
}

export function searchCropGuides(value) {
  const search = String(value || "").trim().toLocaleLowerCase();
  if (!search) return CROP_GUIDES;
  return CROP_GUIDES.filter((guide) => [guide.name, guide.scientificName, ...guide.aliases]
    .join(" ").toLocaleLowerCase().includes(search));
}

export { DEFAULT_STAGES };
