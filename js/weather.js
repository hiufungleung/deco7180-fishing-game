import spot_geo from "./spot_geo.js";

const WEATHER_DICT = {
    0: "sunny", 4: "cloudy", 5: "rainy", 6: "rainy",
    7: "snowy", 8: "snowy", 9: "thunderstorm"
};

async function getWeather(spotName) {
    if (!spot_geo[spotName]) return { weather: "unknown", temperature: "N/A" };

    const { lat, lng } = spot_geo[spotName];
    const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode`;
    const response = await fetch(API_URL);
    if (!response.ok) return { weather: "unknown", temperature: "N/A" };

    const data = await response.json();
    const weatherCode = data.current.weathercode;
    return { weather: WEATHER_DICT[Math.floor(weatherCode / 10)], temperature: data.current.temperature_2m };
}

export { getWeather };