
export async function reverseGeocodeLabel(lat, lon) {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client` +
    `?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lon)}` +
    `&localityLanguage=en`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Reverse geocode failed");

  const data = await res.json();

  // Prefer city/locality, otherwise use region (principalSubdivision)
  const city =
    data.city ||
    data.locality ||
    data.principalSubdivision ||
    data.localityInfo?.administrative?.[0]?.name;

  const country = data.countryName;

  const label = [city, country].filter(Boolean).join(", ");
  return label || "My location";
}