/**
 * Global City Insights — Frontend Configuration
 * Update PROD_API_URL after deploying backend to Render.com
 */
const CONFIG = {
  // ⚠️ Update this URL after you deploy backend to Render
  PROD_API_URL: 'https://global-city-insights-api-dasg.onrender.com',
  DEV_API_URL: 'http://localhost:5000',

  get API_BASE_URL() {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    return isLocal ? this.DEV_API_URL : this.PROD_API_URL;
  },

  POLL_INTERVAL_MS: 30000,   // 30 seconds frontend polling
  HISTORY_DAYS: 7,           // Days of historical data for charts
  MAP_CENTER: [20, 10],      // Initial map center [lat, lon]
  MAP_ZOOM: 2,               // Initial zoom level
  MAP_MIN_ZOOM: 2,
  MAP_MAX_ZOOM: 10,
};

// AQI metadata
const AQI_LEVELS = {
  1: { label: 'Good',      color: '#10b981', bg: 'rgba(16,185,129,0.15)',  icon: '😊' },
  2: { label: 'Fair',      color: '#84cc16', bg: 'rgba(132,204,22,0.15)', icon: '🙂' },
  3: { label: 'Moderate',  color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '😐' },
  4: { label: 'Poor',      color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  icon: '😷' },
  5: { label: 'Very Poor', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', icon: '⚠️' },
};

// Wind direction helper
const windDirection = (deg) => {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
};

// Format large numbers
const formatPop = (n) => {
  if (!n) return 'N/A';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toString();
};

// Time ago helper
const timeAgo = (dateStr) => {
  if (!dateStr) return 'No data yet';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};
