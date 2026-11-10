const DEFAULT_STAGES = ["Seedling", "Vegetative", "Flowering", "Fruiting", "Harvest"];

export const CROP_GUIDES = [
  {
    key: "maize",
    name: "Maize",
    scientificName: "Zea mays",
    aliases: ["mahindi", "oduma", "bando", "madumwa", "corn"],
    verificationStatus: "unverified",
    supportedGrowthStages: null,
    source: { name: "No source-backed guide attached", url: null },
    applicableRegion: null,
    recommendations: null,
    limitations: [
      "No source-backed sensor threshold, irrigation schedule or temperature range is available in this entry.",
      "Use Wikipedia search for general crop information; it does not establish farm-specific growing targets.",
    ],
    localNotes: "No verified growing guide is attached to this crop yet. Wikipedia search can provide general background, but not verified growing targets.",
  },
  {
    key: "cassava",
    name: "Cassava",
    scientificName: "Manihot esculenta",
    aliases: ["muhogo", "omuogo", "mariwa", "marieba"],
    verificationStatus: "unverified",
    supportedGrowthStages: null,
    source: { name: "No source-backed guide attached", url: null },
    applicableRegion: null,
    recommendations: null,
    limitations: [
      "No source-backed sensor threshold, irrigation schedule or temperature range is available in this entry.",
      "Use Wikipedia search for general crop information; it does not establish farm-specific growing targets.",
    ],
    localNotes: "No verified growing guide is attached to this crop yet. Wikipedia search can provide general background, but not verified growing targets.",
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
