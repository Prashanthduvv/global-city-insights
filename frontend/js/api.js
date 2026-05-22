/**
 * API Service — handles all backend calls and 30-second polling
 */
const ApiService = (() => {
  let pollTimer = null;
  let onUpdateCallback = null;
  let onErrorCallback = null;

  const get = async (path) => {
    const url = `${CONFIG.API_BASE_URL}${path}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
    return res.json();
  };

  /**
   * Fetch all 10 cities (latest snapshot each)
   */
  const fetchAllCities = async () => {
    const json = await get('/api/cities');
    if (!json.success) throw new Error(json.error || 'API error');
    return json.data;
  };

  /**
   * Fetch a single city's latest snapshot
   */
  const fetchCity = async (cityId) => {
    const json = await get(`/api/cities/${cityId}`);
    if (!json.success) throw new Error(json.error || 'API error');
    return json.data;
  };

  /**
   * Fetch historical data for charts
   */
  const fetchHistory = async (cityId, days = CONFIG.HISTORY_DAYS) => {
    const json = await get(`/api/cities/${cityId}/history?days=${days}`);
    if (!json.success) throw new Error(json.error || 'API error');
    return json.data;
  };

  /**
   * Health check
   */
  const checkHealth = async () => {
    const json = await get('/api/health');
    return json;
  };

  /**
   * Start 30-second polling loop
   */
  const startPolling = (onUpdate, onError) => {
    onUpdateCallback = onUpdate;
    onErrorCallback = onError;
    stopPolling();

    const poll = async () => {
      try {
        const cities = await fetchAllCities();
        if (onUpdateCallback) onUpdateCallback(cities);
      } catch (err) {
        console.warn('Poll error:', err.message);
        if (onErrorCallback) onErrorCallback(err);
      }
      pollTimer = setTimeout(poll, CONFIG.POLL_INTERVAL_MS);
    };

    pollTimer = setTimeout(poll, CONFIG.POLL_INTERVAL_MS);
    console.log(`⏱ Polling started every ${CONFIG.POLL_INTERVAL_MS / 1000}s`);
  };

  const stopPolling = () => {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
  };

  return { fetchAllCities, fetchCity, fetchHistory, checkHealth, startPolling, stopPolling };
})();
