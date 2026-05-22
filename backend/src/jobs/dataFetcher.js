const cron = require('node-cron');
const CITIES = require('../config/cities');
const CitySnapshot = require('../models/CitySnapshot');
const { fetchCityWeatherAndAQI } = require('../services/weatherService');
const { getCurrencyRate } = require('../services/currencyService');

/**
 * Fetch data for a single city and save to MongoDB
 */
const fetchAndSaveCity = async (city) => {
  try {
    const [{ weather, aqi, error }, currencyRate] = await Promise.all([
      fetchCityWeatherAndAQI(city),
      getCurrencyRate(city.currency.code).catch((e) => {
        console.error(`Currency error for ${city.name}: ${e.message}`);
        return { rateToINR: null, rateFrom1INR: null, lastUpdated: new Date() };
      }),
    ]);

    if (error || !weather || !aqi) {
      console.warn(`⚠️  Skipping ${city.name} — weather/AQI fetch failed`);
      return null;
    }

    const snapshot = new CitySnapshot({
      cityId: city.id,
      cityName: city.name,
      country: city.country,
      flag: city.flag,
      coordinates: { lat: city.lat, lon: city.lon },
      timestamp: new Date(),
      weather,
      aqi,
      population: city.population,
      currency: {
        code: city.currency.code,
        symbol: city.currency.symbol,
        name: city.currency.name,
        rateToINR: currencyRate.rateToINR,
        rateFrom1INR: currencyRate.rateFrom1INR,
        lastUpdated: currencyRate.lastUpdated,
      },
    });

    await snapshot.save();
    console.log(`✅ Saved snapshot for ${city.name} (AQI: ${aqi.value}, Temp: ${weather.temperature}°C)`);
    return snapshot;
  } catch (err) {
    console.error(`❌ Failed to save snapshot for ${city.name}: ${err.message}`);
    return null;
  }
};

/**
 * Fetch all 10 cities in parallel (with concurrency limit of 5)
 */
const fetchAllCities = async () => {
  console.log(`\n🌍 Starting data fetch for all ${CITIES.length} cities at ${new Date().toISOString()}`);

  // Process in batches of 5 to avoid rate limiting
  const batchSize = 5;
  const results = [];

  for (let i = 0; i < CITIES.length; i += batchSize) {
    const batch = CITIES.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map((city) => fetchAndSaveCity(city)));
    results.push(...batchResults);

    // Small delay between batches to respect API rate limits
    if (i + batchSize < CITIES.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const successful = results.filter((r) => r.status === 'fulfilled' && r.value).length;
  console.log(`✅ Data fetch complete: ${successful}/${CITIES.length} cities updated\n`);
};

/**
 * Start the cron job — fetches every 1 hour
 * Frontend polls every 30s and gets fresh data from DB
 */
const startDataFetcher = () => {
  // Fetch immediately on startup
  fetchAllCities().catch((e) => console.error('Initial fetch error:', e));

  // Schedule every 1 hour (stays within OpenWeatherMap 1000 req/day free tier)
  cron.schedule('0 * * * *', () => {
    fetchAllCities().catch((e) => console.error('Cron fetch error:', e));
  });

  console.log('⏰ Data fetcher scheduled: every 1 hour');
};

module.exports = { startDataFetcher, fetchAllCities, fetchAndSaveCity };
