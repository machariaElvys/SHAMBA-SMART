const WIKI_ACTION_API = "https://en.wikipedia.org/w/api.php";
const WIKI_REST_API = "https://en.wikipedia.org/api/rest_v1";
const WIKIDATA_ENTITY = "https://www.wikidata.org/wiki/Special:EntityData";

function withTimeout(ms = 8000) {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), ms);
  return { controller, id };
}

async function fetchJson(url, { timeoutMs = 8000 } = {}) {
  const { controller, id } = withTimeout(timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return await res.json();
  } finally {
    window.clearTimeout(id);
  }
}

export async function searchWikipediaTitles(query, limit = 8) {
  const q = String(query || "").trim();
  if (!q) return [];

  const url =
    `${WIKI_ACTION_API}?origin=*` +
    `&action=query&format=json&list=search` +
    `&srsearch=${encodeURIComponent(q)}` +
    `&srlimit=${limit}`;

  const data = await fetchJson(url);
  const items = data?.query?.search || [];

  return items.map((x) => ({
    title: x.title,
    pageid: x.pageid,
  }));
}

export async function fetchWikipediaSummary(title) {
  const t = String(title || "").trim();
  if (!t) return null;

  const url = `${WIKI_REST_API}/page/summary/${encodeURIComponent(t)}`;
  const data = await fetchJson(url);

  return {
    title: data?.title || t,
    description: data?.description || "",
    extract: data?.extract || "",
    thumbnail: data?.thumbnail?.source || "",
    pageUrl: data?.content_urls?.desktop?.page || "",
    wikibaseItem: data?.wikibase_item || "",
  };
}

export async function fetchWikidataScientificName(wikibaseItem) {
  const qid = String(wikibaseItem || "").trim();
  if (!qid) return "";

  const url = `${WIKIDATA_ENTITY}/${encodeURIComponent(qid)}.json`;
  const data = await fetchJson(url);

  const entity = data?.entities?.[qid];
  const claims = entity?.claims;

  // P225 = taxon name
  const p225 = claims?.P225?.[0]?.mainsnak?.datavalue?.value;
  return typeof p225 === "string" ? p225 : "";
}