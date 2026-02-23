const TOKEN_KEY = "shambaSmart.token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let msg = "Request failed";

    try {
      const data = await res.json();
      msg = data?.error || data?.msg || msg;
    } catch {
      // ignore JSON parse error
    }

    // Optional: auto logout on expired/invalid token
    if (res.status === 401) {
      clearToken();
    }

    throw new Error(msg);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  // Auth
  login: (email, password) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // Crops
  getCrops: () => request("/api/crops"),
  createCrop: (payload) =>
    request("/api/crops", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCrop: (id, patch) =>
    request(`/api/crops/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteCrop: (id) =>
    request(`/api/crops/${id}`, {
      method: "DELETE",
    }),

  // Irrigation (optional now, useful next)
  getIrrigationLogs: () => request("/api/irrigation-logs"),
  createIrrigationLog: (payload) =>
    request("/api/irrigation-logs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};