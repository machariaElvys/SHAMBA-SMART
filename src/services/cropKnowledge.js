const WIKI_ACTION_API = "https://en.wikipedia.org/w/api.php";
const WIKI_REST_API = "https://en.wikipedia.org/api/rest_v1";

const TOPIC_SEARCH_TERMS = {
  cultivation: "crop cultivation agriculture farming production",
  soil: "agricultural soil fertility crop growing conditions",
  planting: "crop planting sowing seed agricultural practice",
  irrigation: "crop irrigation watering agriculture water management",
  varieties: "crop varieties cultivar agricultural Kenya",
  pests: "crop pests diseases plant pathology agriculture",
  harvesting: "crop harvesting maturity postharvest agriculture",
};

const TOPIC_RELEVANCE_TERMS = {
  cultivation: ["cultivation", "cultivate", "cultivated", "cultivating", "farming", "agriculture", "crop", "production", "orchard", "orchards", "plant", "plants", "grown", "growing"],
  soil: ["soil", "fertility", "drainage", "organic matter", "loam", "ph", "nutrient"],
  planting: ["planting", "sowing", "seed", "germination", "transplant", "spacing", "plant population"],
  irrigation: ["irrigation", "water", "rainfall", "drought", "drip", "watering", "moisture"],
  varieties: ["variety", "varieties", "cultivar", "cultivars", "landrace", "hybrid", "selection"],
  pests: ["pest", "disease", "pathogen", "insect", "fungus", "fungi", "blight", "virus"],
  harvesting: ["harvest", "harvesting", "maturity", "postharvest", "storage", "yield", "ripening"],
};

const AGRICULTURE_TERMS = [
  "agriculture", "agricultural", "crop", "cultivation", "cultivar", "farming", "farm", "fruit",
  "plant", "plants", "orchard", "orchards", "tree", "trees", "grown", "growing", "cultivated",
  "harvest", "soil", "irrigation", "seed", "variety", "pest", "disease",
];

function normalize(value) {
  return String(value || "").toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();
}

function containsTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

export function buildCropSearchQuery({ crop, topic = "cultivation", location = "" }) {
  const cropName = String(crop || "").trim();
  if (!cropName) return "";
  const topicTerms = TOPIC_SEARCH_TERMS[topic] || TOPIC_SEARCH_TERMS.cultivation;
  const place = String(location || "").trim();
  return [cropName, topicTerms, place, "agricultural crop farming"].filter(Boolean).join(" ");
}

export function isRelevantCropSummary(summary, { crop, topic = "cultivation" }) {
  if (!summary || !String(crop || "").trim()) return false;
  const title = normalize(summary.title);
  const text = normalize(`${summary.title || ""} ${summary.description || ""} ${summary.extract || ""}`);
  const cropName = normalize(crop);
  const cropParts = cropName.split(/[^a-z0-9]+/).filter((part) => part.length > 1);
  const cropMentioned = text.includes(cropName)
    || (cropParts.length > 1 && cropParts.every((part) => containsTerm(text, part)));
  if (!cropMentioned) return false;

  const isAppleSearch = cropName === "apple" || cropName === "apples";
  if (/^apple (inc|computer|corporation)$/.test(cropName)) return false;
  const appleBusinessTerms = ["iphone", "ipad", "macintosh", "consumer electronics", "technology company", "apple inc"];
  if (isAppleSearch && appleBusinessTerms.some((term) => containsTerm(`${title} ${text}`, term))
    && !["fruit", "orchard", "malus", "tree", "cultivar"].some((term) => containsTerm(text, term))) return false;

  const hasAgricultureContext = AGRICULTURE_TERMS.some((term) => containsTerm(text, term));
  const topicTerms = TOPIC_RELEVANCE_TERMS[topic] || TOPIC_RELEVANCE_TERMS.cultivation;
  const hasTopicContext = topicTerms.some((term) => containsTerm(text, term));
  return hasAgricultureContext && hasTopicContext;
}

async function fetchJson(url, { signal, timeoutMs = 10000 } = {}) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener("abort", abortFromCaller, { once: true });
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Search provider returned HTTP ${response.status}.`);
    return await response.json();
  } finally {
    globalThis.clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}

async function fetchWikipediaSummary(title, { signal } = {}) {
  const url = `${WIKI_REST_API}/page/summary/${encodeURIComponent(title)}`;
  const data = await fetchJson(url, { signal });
  return {
    title: data?.title || title,
    description: data?.description || "",
    extract: data?.extract || "",
    url: data?.content_urls?.desktop?.page || "",
    thumbnail: data?.thumbnail?.source || "",
  };
}

export async function searchCropKnowledge({ crop, topic = "cultivation", location = "", signal }) {
  const query = buildCropSearchQuery({ crop, topic, location });
  if (!query) return [];

  const params = new URLSearchParams({
    origin: "*",
    action: "query",
    format: "json",
    list: "search",
    srsearch: query,
    srlimit: "8",
    srnamespace: "0",
  });
  const data = await fetchJson(`${WIKI_ACTION_API}?${params.toString()}`, { signal });
  const matches = data?.query?.search || [];
  const summaries = await Promise.allSettled(matches.map((match) => fetchWikipediaSummary(match.title, { signal })));
  if (matches.length > 0 && summaries.every((result) => result.status === "rejected")) {
    throw new Error("The search found pages, but their summaries could not be loaded. Try again or open a KALRO resource.");
  }
  const retrievedAt = new Date().toISOString();

  return summaries.flatMap((result) => {
    if (result.status !== "fulfilled" || !isRelevantCropSummary(result.value, { crop, topic })) return [];
    return [{
      ...result.value,
      organization: "Wikipedia",
      recordType: "search-result",
      verificationStatus: "unverified",
      topic,
      query,
      retrievedAt,
    }];
  });
}
