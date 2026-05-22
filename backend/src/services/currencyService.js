const axios = require('axios');

const API_KEY = process.env.EXCHANGERATE_API_KEY;

// In-memory cache for rates (refresh every 1 hour)
let ratesCache = null;
let lastFetched = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch exchange rates with INR as base currency.
 * Response: { "conversion_rates": { "USD": 0.012, "GBP": 0.0094, ... } }
 * So 1 INR = rate[code], meaning 1 [code] = 1/rate[code] INR
 */
const fetchRates = async () => {
  const now = Date.now();
  if (ratesCache && lastFetched && now - lastFetched < CACHE_DURATION_MS) {
    return ratesCache;
  }

  try {
    const { data } = await axios.get(
      `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/INR`,
      { timeout: 10000 }
    );

    if (data.result === 'success') {
      ratesCache = data.conversion_rates;
      lastFetched = now;
      console.log('✅ Currency rates refreshed');
      return ratesCache;
    }
    throw new Error(`ExchangeRate API error: ${data['error-type']}`);
  } catch (error) {
    console.error(`❌ Currency fetch failed: ${error.message}`);
    // Return cached rates if available even if stale
    if (ratesCache) return ratesCache;
    throw error;
  }
};

/**
 * Get rate for a currency relative to INR
 * Returns: { rateToINR, rateFrom1INR, lastUpdated }
 * rateToINR = how many INR does 1 unit of [code] cost
 */
const getCurrencyRate = async (currencyCode) => {
  if (currencyCode === 'INR') {
    return {
      rateToINR: 1,
      rateFrom1INR: 1,
      lastUpdated: new Date(),
    };
  }

  const rates = await fetchRates();
  const rateFrom1INR = rates[currencyCode]; // 1 INR = X [code]

  if (!rateFrom1INR || rateFrom1INR === 0) {
    throw new Error(`Rate not found for ${currencyCode}`);
  }

  const rateToINR = Math.round((1 / rateFrom1INR) * 100) / 100;

  return {
    rateToINR,
    rateFrom1INR: Math.round(rateFrom1INR * 10000) / 10000,
    lastUpdated: new Date(lastFetched),
  };
};

module.exports = { getCurrencyRate };
