/**
 * City Detail Modal — renders full city data with gauge, AQI, charts
 */
const Modal = (() => {
  let currentCityId = null;
  let activeTab = 'temp';

  const el = (id) => document.getElementById(id);

  const open = async (cityId, snapshot) => {
    currentCityId = cityId;
    activeTab = 'temp';

    const modal = el('city-modal');
    const overlay = el('modal-overlay');
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      modal.classList.add('open');
      overlay.classList.add('open');
    });

    render(snapshot);
    MapService.flyTo(cityId);

    // Load history for charts
    loadHistory(cityId);
  };

  const close = () => {
    const modal = el('city-modal');
    const overlay = el('modal-overlay');
    modal.classList.remove('open');
    overlay.classList.remove('open');
    setTimeout(() => {
      modal.classList.add('hidden');
      overlay.classList.add('hidden');
    }, 320);
    Charts.destroyAll();
    MapService.clearHighlight();
    currentCityId = null;
  };

  const render = (snap) => {
    if (!snap) return;
    const w = snap.weather;
    const aqi = snap.aqi;
    const cur = snap.currency;
    const aqiInfo = AQI_LEVELS[aqi?.value] || { color: '#64748b', label: 'No Data', icon: '❓', bg: 'transparent' };

    // Header
    el('modal-flag').textContent = snap.flag || '🌍';
    el('modal-city-name').textContent = snap.cityName || '—';
    el('modal-country').textContent = snap.country || '';
    el('modal-updated').textContent = `Updated ${timeAgo(snap.timestamp)}`;

    // Temperature Gauge
    const gaugeEl = el('gauge-container');
    Gauge.render(gaugeEl, w?.temperature ?? null);
    el('gauge-feels').textContent = w ? `Feels like ${w.feelsLike}°C` : '—';

    // AQI Badge
    el('aqi-value-num').textContent = aqi?.value ?? '—';
    el('aqi-label').textContent = aqiInfo.label;
    el('aqi-icon').textContent = aqiInfo.icon;
    el('aqi-badge').style.setProperty('--aqi-col', aqiInfo.color);
    el('aqi-badge').style.setProperty('--aqi-bg', aqiInfo.bg);
    el('aqi-badge').style.borderColor = aqiInfo.color;

    // Weather metrics table
    el('m-humidity').textContent    = w ? `${w.humidity}%` : '—';
    el('m-wind').textContent        = w ? `${w.windSpeed} m/s ${windDirection(w.windDeg)}` : '—';
    el('m-pressure').textContent    = w ? `${w.pressure} hPa` : '—';
    el('m-visibility').textContent  = w ? `${(w.visibility / 1000).toFixed(1)} km` : '—';
    el('m-cloud').textContent       = w ? `${w.cloudiness}%` : '—';
    el('m-desc').textContent        = w ? w.description.replace(/\b\w/g, c => c.toUpperCase()) : '—';

    // AQI components
    el('m-pm25').textContent  = aqi ? `${aqi.pm25} μg/m³` : '—';
    el('m-pm10').textContent  = aqi ? `${aqi.pm10} μg/m³` : '—';
    el('m-o3').textContent    = aqi ? `${aqi.o3} μg/m³` : '—';
    el('m-no2').textContent   = aqi ? `${aqi.no2} μg/m³` : '—';
    el('m-so2').textContent   = aqi ? `${aqi.so2} μg/m³` : '—';
    el('m-co').textContent    = aqi ? `${aqi.co} μg/m³` : '—';

    // Population
    el('m-pop').textContent = formatPop(snap.population);

    // Currency card
    if (cur) {
      el('cur-code').textContent   = `${cur.symbol} ${cur.code}`;
      el('cur-name').textContent   = cur.name;
      const isINR = cur.code === 'INR';
      el('cur-rate-to').textContent   = isINR ? '1 ₹ = 1 ₹' : `1 ${cur.symbol} = ₹${cur.rateToINR?.toLocaleString('en-IN') ?? '—'}`;
      el('cur-rate-from').textContent = isINR ? 'Home currency' : `1 ₹ = ${cur.rateFrom1INR?.toFixed(4) ?? '—'} ${cur.code}`;
      el('cur-updated').textContent   = cur.lastUpdated ? `Rate updated ${timeAgo(cur.lastUpdated)}` : '';
    }

    // Activate default tab
    switchTab('temp');
  };

  const loadHistory = async (cityId) => {
    try {
      el('charts-loading').classList.remove('hidden');
      const history = await ApiService.fetchHistory(cityId);

      el('charts-loading').classList.add('hidden');

      if (!history || history.length === 0) {
        Charts.renderNoData('temp-chart', 'Collecting data — check back in 1 hour');
        Charts.renderNoData('aqi-chart',  'Collecting data — check back in 1 hour');
        return;
      }

      Charts.renderTempChart('temp-chart', history);
      Charts.renderAqiChart('aqi-chart',  history);
    } catch (err) {
      console.error('History fetch error:', err);
      el('charts-loading').classList.add('hidden');
      Charts.renderNoData('temp-chart', 'Failed to load history');
      Charts.renderNoData('aqi-chart',  'Failed to load history');
    }
  };

  const switchTab = (tab) => {
    activeTab = tab;
    document.querySelectorAll('.chart-tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.chart-panel').forEach((p) => p.classList.add('hidden'));
    el(`tab-${tab}`)?.classList.add('active');
    el(`panel-${tab}`)?.classList.remove('hidden');
  };

  // Refresh modal if same city is open
  const refresh = (cities) => {
    if (!currentCityId) return;
    const snap = cities.find((c) => c.cityId === currentCityId);
    if (snap) {
      render(snap);
      loadHistory(currentCityId);
    }
  };

  return { open, close, render, refresh, switchTab };
})();
