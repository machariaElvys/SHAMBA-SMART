const BASE = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    let msg = "Request failed";
    try {
      const data = await res.json();
      msg = data?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  // handle empty responses
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  getCrops: () => request("/api/crops"),
  createCrop: (payload) => request("/api/crops", { method: "POST", body: JSON.stringify(payload) }),
  updateCrop: (id, patch) => request(`/api/crops/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteCrop: (id) => request(`/api/crops/${id}`, { method: "DELETE" }),
};