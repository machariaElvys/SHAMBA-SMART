export async function fetchSoilMoisturePercent(lat, lon) {
  const url =
    "https://api.open-meteo.com/v1/ecmwf" +
    `?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lon)}` +
    "&hourly=soil_moisture_0_to_7cm" +
    "&timezone=auto" +
    "&forecast_days=1";

  const res = await fetch(url);
  if (!res.ok) throw new Error("Soil moisture API failed");

  const data = await res.json();
  const arr = data?.hourly?.soil_moisture_0_to_7cm;

  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error("No soil moisture data returned");
  }

  // Open-Meteo returns m³/m³ (typically 0.0–0.6-ish for many soils)
  // We normalize to 0–100 for your UI and existing crop thresholds.
  const vwc = arr[arr.length - 1]; // latest value
  const normalized = Math.round((vwc / 0.6) * 100);

  return {
    vwc,
    percent: Math.max(0, Math.min(100, normalized)),
  };
}