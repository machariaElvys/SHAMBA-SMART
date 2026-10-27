const WIKI_ACTION_API = "https://en.wikipedia.org/w/api.php";
const WIKI_REST_API = "https://en.wikipedia.org/api/rest_v1";

const TOPIC_SEARCH_TERMS = {
  cultivation: "cultivation",
  soil: "soil",
  planting: "planting",
  irrigation: "irrigation",
  varieties: "varieties cultivar",
  pests: "plant disease",
  harvesting: "harvesting",
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
  return [cropName, topicTerms, place].filter(Boolean).join(" ");
}

export function isRelevantCropSummary(summary, { crop, topic = "cultivation" }) {
  if (!summary || !String(crop || "").trim()) return false;
  const articleText = normalize([summary.title, summary.description, summary.extract].filter(Boolean).join(" "));
  const searchContext = normalize(summary.searchSnippet || "");

  const cropName = normalize(crop);
  const cropVariants = [cropName, cropName.endsWith("s") ? cropName.slice(0, -1) : cropName];
  const cropMentioned = cropVariants.some((variant) => articleText.includes(variant));
  if (!cropMentioned) return false;

  const isAppleSearch = cropName === "apple" || cropName === "apples";
  if (/^apple (inc|computer|corporation)$/.test(cropName)) return false;
  const appleBusinessTerms = ["iphone", "ipad", "macintosh", "consumer electronics", "technology company", "apple inc"];
  if (isAppleSearch && appleBusinessTerms.some((term) => containsTerm(articleText, term))
    && !["fruit", "orchard", "malus", "tree", "cultivar"].some((term) => containsTerm(articleText, term))) return false;

  const hasAgricultureContext = AGRICULTURE_TERMS.some((term) => containsTerm(articleText, term));
  const relevantText = articleText + " " + searchContext;
  const topicTerms = TOPIC_RELEVANCE_TERMS[topic] || TOPIC_RELEVANCE_TERMS.cultivation;
  const hasTopicContext = topicTerms.some((term) => containsTerm(relevantText, term));
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

function cleanSearchSnippet(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  const matches = (data?.query?.search || []).slice(0, 5);
  const summaries = await Promise.allSettled(matches.map((match) => fetchWikipediaSummary(match.title, { signal })));
  if (matches.length > 0 && summaries.every((result) => result.status === "rejected")) {
    throw new Error("The search found pages, but their summaries could not be loaded. Try again or open a KALRO resource.");
  }
  const retrievedAt = new Date().toISOString();

  return summaries.flatMap((result, index) => {
    if (result.status !== "fulfilled") return [];
    const summary = { ...result.value, searchSnippet: cleanSearchSnippet(matches[index]?.snippet) };
    if (!isRelevantCropSummary(summary, { crop, topic })) return [];
    return [{
      ...summary,
      organization: "Wikipedia",
      recordType: "search-result",
      verificationStatus: "unverified",
      topic,
      query,
      retrievedAt,
    }];
  });
}
function isPrimaryCropArticle(result, crop) {
  const cropName = normalize(crop);
  if (!cropName) return false;
  const title = normalize(result.title);
  const singular = cropName.endsWith("s") ? cropName.slice(0, -1) : cropName;
  const names = [...new Set([cropName, singular])];
  if (names.some((name) => title === name || title.startsWith(name + " ("))) return true;

  const opening = normalize(String(result.extract || "").split(/[.!?]/, 1)[0]);
  return names.some((name) => [
    "commonly known as " + name,
    "also known as " + name,
    "known as " + name,
    "commonly called " + name,
    "also called " + name,
    "called " + name,
    ", the " + name + ",",
  ].some((phrase) => opening.includes(phrase)));
}
function wikiContentToPlainText(wikitext) {
  let text = String(wikitext || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<ref\b[^>]*\/\s*>/gi, " ")
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref\s*>/gi, " ")
    .replace(/\{\{\s*(?:convert|cvt)\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(?:to|[-–—])\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(?:°?\s*C|Celsius)(?:\s*\|[^{}]*)?\}\}/gi, "$1 to $2 °C")
    .replace(/\{\{\s*(?:convert|cvt)\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(?:°?\s*C|Celsius)(?:\s*\|[^{}]*)?\}\}/gi, "$1 °C")
    .replace(/\[\[(?:File|Image|Category):[^\]]+\]\]/gi, " ")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[(?:https?:\/\/\S+)\s+([^\]]+)\]/g, "$1")
    .replace(/<[^>]+>/g, " ");
  for (let pass = 0; pass < 5; pass += 1) text = text.replace(/\{\{[^{}]*\}\}/g, " ");
  return text
    .replace(/'{2,}/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&amp;/gi, "&")
    .replace(/\[[0-9]+\]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function extractNamedSection(wikitext, sectionTitle) {
  const lines = String(wikitext || "").split(/\r?\n/);
  let start = -1;
  let level = 0;
  const cleanTitle = String(sectionTitle || "").replace(/'{2,}/g, "").trim().toLocaleLowerCase();
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].trim().match(/^(={2,})\s*(.*?)\s*\1\s*$/);
    if (!heading) continue;
    const currentTitle = heading[2].replace(/'{2,}/g, "").trim().toLocaleLowerCase();
    if (currentTitle === cleanTitle) {
      start = index + 1;
      level = heading[1].length;
      break;
    }
  }
  if (start < 0) return "";
  let end = lines.length;
  for (let index = start; index < lines.length; index += 1) {
    const heading = lines[index].trim().match(/^(={2,})\s*.*?\s*\1\s*$/);
    if (heading && heading[1].length <= level) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

async function fetchWikipediaArticle(title, { signal } = {}) {
  const params = new URLSearchParams({
    origin: "*",
    action: "parse",
    format: "json",
    page: title,
    prop: "sections|wikitext",
  });
  const data = await fetchJson(WIKI_ACTION_API + "?" + params.toString(), { signal });
  const page = data?.parse;
  if (!page) return null;

  const wikitext = typeof page.wikitext === "string" ? page.wikitext : page.wikitext?.["*"] || "";
  const relevantSections = (page.sections || []).filter((section) =>
    /\b(cultivation|growing conditions|agronomy|crop management|growth requirements|soil|irrigation|water management|climate)\b/i.test(section.line || "")
  );
  const sections = relevantSections.flatMap((section) => {
    const text = wikiContentToPlainText(extractNamedSection(wikitext, section.line));
    return text ? [{ title: section.line, text }] : [];
  });

  return {
    title: page.title || title,
    sections,
    articleText: sections.map((section) => section.text).join("\n"),
    url: "https://en.wikipedia.org/wiki/" + encodeURIComponent((page.title || title).replaceAll(" ", "_")),
  };
}

const TEMPERATURE_CONTEXT = /\b(?:optimal|optimum|ideal|preferred|suitable|favorable|favourable|best|required|tolerated)\b.{0,120}\b(?:growing\s+)?temperatures?\b|\b(?:growing\s+)?temperatures?\b.{0,120}\b(?:optimal|optimum|ideal|preferred|suitable|favorable|favourable|best|range|required|between|from)\b|\b(?:growing|growth)\s+temperature\s+(?:range|requirement|requirements)\b/i;
const TEMPERATURE_RANGE = /(-?\d{1,2}(?:\.\d+)?)\s*(?:°\s*C|º\s*C|degrees?\s+Celsius)?\s*(?:to|and|[-–—])\s*(-?\d{1,2}(?:\.\d+)?)\s*(?:°\s*C|º\s*C|degrees?\s+Celsius)\b/gi;

function splitSentences(text) {
  return String(text || "").match(/[^.!?]+(?:[.!?](?!\d)|$)/g) || [String(text || "")];
}

export function extractExplicitGrowingTemperatureRanges(articleText) {
  const paragraphs = String(articleText || "").split(/\n+/).map((part) => part.trim()).filter(Boolean);
  const candidates = [];
  const seen = new Set();

  for (const paragraph of paragraphs) {
    for (const sentence of splitSentences(paragraph)) {
      if (!TEMPERATURE_CONTEXT.test(sentence)) continue;
      TEMPERATURE_RANGE.lastIndex = 0;
      let match;
      while ((match = TEMPERATURE_RANGE.exec(sentence)) !== null) {
        const min = Number(match[1]);
        const max = Number(match[2]);
        if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max > 60 || min >= max) continue;
        const key = String(min) + ":" + String(max) + ":°C";
        if (seen.has(key)) continue;
        seen.add(key);
        candidates.push({
          min,
          max,
          unit: "°C",
          label: "Explicitly stated suitable growing temperature range",
          measurementType: "crop growing air temperature",
          evidence: sentence.trim().slice(0, 360),
        });
      }
    }
  }
  return candidates;
}

export function extractExplicitGrowingTemperatureRange(articleText) {
  const candidates = extractExplicitGrowingTemperatureRanges(articleText);
  return candidates.length === 1 ? candidates[0] : null;
}

export function extractExplicitSoilMoistureSensorRanges(articleText) {
  const paragraphs = String(articleText || "").split(/\n+/).map((part) => part.trim()).filter(Boolean);
  const candidates = [];
  const seen = new Set();
  const sensorContext = /\bsoil[- ]moisture\s+(?:sensor|probe|meter|reading)|\b(?:sensor|probe|meter)\s+(?:reading|measurement)?\s*(?:of\s*)?(?:the\s*)?soil[- ]moisture\b/i;
  const percentRange = /(\d{1,3}(?:\.\d+)?)\s*(?:to|and|[-–—])\s*(\d{1,3}(?:\.\d+)?)\s*(?:%|percent\b)/gi;

  for (const paragraph of paragraphs) {
    for (const sentence of splitSentences(paragraph)) {
      if (!sensorContext.test(sentence)) continue;
      percentRange.lastIndex = 0;
      let match;
      while ((match = percentRange.exec(sentence)) !== null) {
        const min = Number(match[1]);
        const max = Number(match[2]);
        if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max > 100 || min >= max) continue;
        const key = String(min) + ":" + String(max) + ":%";
        if (seen.has(key)) continue;
        seen.add(key);
        candidates.push({
          min,
          max,
          unit: "%",
          label: "Explicit soil-moisture sensor range",
          measurementType: "soil-moisture sensor reading",
          evidence: sentence.trim().slice(0, 360),
        });
      }
    }
  }
  return candidates;
}

function distinctRanges(candidates) {
  return [...new Map(candidates.map((candidate) => [
    String(candidate.min) + ":" + String(candidate.max) + ":" + candidate.unit,
    candidate,
  ])).values()];
}

export async function searchCropGrowingRanges({ crop, variety = "", location = "", stage = "", signal }) {
  const cropName = String(crop || "").trim();
  if (!cropName) return [];
  const context = [variety, location, stage].filter(Boolean).join(" ");
  let searchResults = await searchCropKnowledge({
    crop: cropName,
    topic: "cultivation",
    location: context,
    signal,
  });
  let primaryResults = searchResults.filter((result) => isPrimaryCropArticle(result, cropName));
  if (primaryResults.length === 0 && context) {
    searchResults = await searchCropKnowledge({
      crop: cropName,
      topic: "cultivation",
      location: "",
      signal,
    });
    primaryResults = searchResults.filter((result) => isPrimaryCropArticle(result, cropName));
  }
  if (primaryResults.length === 0) return [];

  const pages = await Promise.allSettled(primaryResults.slice(0, 4).map(async (result) => {
    const article = await fetchWikipediaArticle(result.title, { signal });
    if (!article) return null;

    const temperatureCandidates = article.sections.flatMap((section) =>
      extractExplicitGrowingTemperatureRanges(section.text).map((candidate) => ({
        ...candidate,
        section: section.title,
      }))
    );
    const soilMoistureCandidates = article.sections.flatMap((section) =>
      extractExplicitSoilMoistureSensorRanges(section.text).map((candidate) => ({
        ...candidate,
        section: section.title,
      }))
    );
    const distinctTemperatureRanges = distinctRanges(temperatureCandidates);
    const distinctSensorRanges = distinctRanges(soilMoistureCandidates);

    return {
      ...result,
      title: article.title,
      url: article.url || result.url,
      articleText: article.articleText,
      temperatureCandidates,
      soilMoistureCandidates,
      temperatureRange: distinctTemperatureRanges.length === 1 ? distinctTemperatureRanges[0] : null,
      soilMoistureSensorRange: distinctSensorRanges.length === 1 ? distinctSensorRanges[0] : null,
      temperatureConflict: distinctTemperatureRanges.length > 1,
      soilMoistureConflict: distinctSensorRanges.length > 1,
    };
  }));
  if (pages.every((page) => page.status === "rejected")) {
    throw new Error("Wikipedia search results were found, but article content could not be loaded.");
  }
  const retrievedAt = new Date().toISOString();
  return pages.flatMap((page) => page.status === "fulfilled" && page.value
    ? [{
      ...page.value,
      retrievedAt,
      queryContext: { crop: cropName, variety, location, stage },
    }]
    : []);
}