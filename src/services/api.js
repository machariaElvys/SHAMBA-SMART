const TOKEN_KEY = "shambaSmart.token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // The API remains usable in browsers that block local storage for this tab.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore storage restrictions while logging out.
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.body !== undefined) headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`/api${path}`, { ...options, headers });
  } catch {
    throw new Error("Could not reach the Shamba-Smart server. Start the backend and try again.");
  }

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    const error = new Error(body?.error || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return body;
}

async function authenticate(path, credentials) {
  const result = await request(path, {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  setToken(result.access_token);
  return { token: result.access_token, user: result.user };
}

export const api = {
  login(credentials) {
    return authenticate("/auth/login", credentials);
  },

  register(credentials) {
    return authenticate("/auth/register", credentials);
  },

  async me() {
    return request("/auth/me");
  },

  getCrops() {
    return request("/crops");
  },

  createCrop(payload) {
    return request("/crops", { method: "POST", body: JSON.stringify(payload) });
  },

  updateCrop(id, updates) {
    return request(`/crops/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  deleteCrop(id) {
    return request(`/crops/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  getIrrigationLog(cropId) {
    return request(`/crops/${encodeURIComponent(cropId)}/irrigation`);
  },

  recordIrrigation(cropId, event) {
    return request(`/crops/${encodeURIComponent(cropId)}/irrigation`, {
      method: "POST",
      body: JSON.stringify(event),
    });
  },
};
