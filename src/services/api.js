async function request(path, options = {}) {
  const res = await fetch(path, {
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

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  getCrops: () => request("/api/crops"),
  createCrop: (payload) =>
    request("/api/crops", { method: "POST", body: JSON.stringify(payload) }),
  updateCrop: (id, patch) =>
    request(`/api/crops/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteCrop: (id) => request(`/api/crops/${id}`, { method: "DELETE" }),

  createIrrigationLog: (payload) =>
    request("/api/irrigation-logs", { method: "POST", body: JSON.stringify(payload) }),
  getIrrigationLogs: (cropId) =>
    request(`/api/irrigation-logs${cropId ? `?crop_id=${encodeURIComponent(cropId)}` : ""}`),
};