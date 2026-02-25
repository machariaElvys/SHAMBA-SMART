// src/services/api.js

const TOKEN_KEY = "shambaSmart.token";
const USER_KEY = "shambaSmart.user";
const CROPS_KEY = "shambaSmart.crops.v1";

// --------------------
// token helpers
// --------------------
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
  } catch {}
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

// --------------------
// local helpers
// --------------------
function readCrops() {
  try {
    const raw = localStorage.getItem(CROPS_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeCrops(crops) {
  try {
    localStorage.setItem(CROPS_KEY, JSON.stringify(crops));
  } catch {}
}

function makeId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// --------------------
// fake frontend-only API
// --------------------
export const api = {
  // auth (mock)
  async login({ email, password } = {}) {
    if (!email || !password) {
      throw new Error("email and password are required");
    }

    const token = "demo-token";
    const user = { id: "demo", email };

    setToken(token);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}

    return { token, user };
  },

  async register({ email, password } = {}) {
    if (!email || !password) {
      throw new Error("email and password are required");
    }

    // frontend-only demo register = auto login
    const token = "demo-token";
    const user = { id: "demo", email };

    setToken(token);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}

    return { token, user };
  },

  // crops
  async getCrops() {
    return readCrops();
  },

  async addCrop(payload = {}) {
    const crops = readCrops();

    const newCrop = {
      id: makeId(),
      name: payload.name || "New Crop",
      stage: payload.stage || "Seedling",
      health: typeof payload.health === "number" ? payload.health : 80,
      ...payload,
    };

    crops.push(newCrop);
    writeCrops(crops);

    return newCrop;
  },

  // alias in case your page calls createCrop instead of addCrop
  async createCrop(payload = {}) {
    return this.addCrop(payload);
  },

  async updateCrop(id, updates = {}) {
    const crops = readCrops();

    const index = crops.findIndex((c) => String(c.id) === String(id));
    if (index === -1) throw new Error("Crop not found");

    const updated = { ...crops[index], ...updates };
    crops[index] = updated;

    writeCrops(crops);
    return updated;
  },

  async deleteCrop(id) {
    const crops = readCrops();
    const next = crops.filter((c) => String(c.id) !== String(id));

    writeCrops(next);

    return { ok: true };
  },
};