const axios = require('axios');

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Maps OpenWeatherMap AQI integer (1–5) to human-readable category
 */
const AQI_CATEGORIES = {
  1: 'Good',
  2: 'Fair',
  3: 'Moderate',
  4: 'Poor',
  5: 'Very Poor',
};

/**
 * Fetch current weather data for a city by lat/lon
 */
const fetchWeather = async (lat, lon) => {
  const { data } = await axios.get(`${BASE_URL}/weather`, {
    params: { lat, lon, appid: API_KEY, units: 'metric' },
    timeout: 10000,
  });

  return {
    temperature: Math.round(data.main.temp * 10) / 10,
    feelsLike: Math.round(data.main.feels_like * 10) / 10,
    tempMin: Math.round(data.main.temp_min * 10) / 10,
    tempMax: Math.round(data.main.temp_max * 10) / 10,
    humidity: data.main.humidity,
    windSpeed: data.wind ? Math.round(data.wind.speed * 10) / 10 : 0,
    windDeg: data.wind ? data.wind.deg : 0,
    pressure: data.main.pressure,
    visibility: data.visibility || 0,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    cloudiness: data.clouds ? data.clouds.all : 0,
  };
};

/**
 * Fetch air quality index data for a city by lat/lon
 */
const fetchAQI = async (lat, lon) => {
  const { data } = await axios.get(`${BASE_URL}/air_pollution`, {
    params: { lat, lon, appid: API_KEY },
    timeout: 10000,
  });

  const item = data.list[0];
  const aqiValue = item.main.aqi;
  const comp = item.components;

  return {
    value: aqiValue,
    category: AQI_CATEGORIES[aqiValue] || 'Unknown',
    pm25: Math.round(comp.pm2_5 * 100) / 100,
    pm10: Math.round(comp.pm10 * 100) / 100,
    o3: Math.round(comp.o3 * 100) / 100,
    no2: Math.round(comp.no2 * 100) / 100,
    so2: Math.round(comp.so2 * 100) / 100,
    co: Math.round(comp.co * 100) / 100,
    nh3: Math.round((comp.nh3 || 0) * 100) / 100,
  };
};

/**
 * Fetch both weather and AQI concurrently for a city
 */
const fetchCityWeatherAndAQI = async (city) => {
  const { lat, lon } = city;
  try {
    const [weather, aqi] = await Promise.all([
      fetchWeather(lat, lon),
      fetchAQI(lat, lon),
    ]);
    return { weather, aqi, error: null };
  } catch (error) {
    console.error(`❌ Weather/AQI fetch failed for ${city.name}: ${error.message}`);
    return { weather: null, aqi: null, error: error.message };
  }
};

module.exports = { fetchCityWeatherAndAQI };
