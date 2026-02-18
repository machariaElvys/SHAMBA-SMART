
export function weatherCodeToText(code) {
  if (code === 0) return "Clear";
  if ([1, 2, 3].includes(code)) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Unknown";
}

export async function fetchCurrentWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code` +
    `&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather API failed");

  const data = await res.json();
  const temp = Math.round(data?.current?.temperature_2m);
  const code = data?.current?.weather_code;

  return {
    temperature: Number.isFinite(temp) ? temp : null,
    weather: typeof code === "number" ? weatherCodeToText(code) : "Unknown",
    weatherCode: code,
  };
}