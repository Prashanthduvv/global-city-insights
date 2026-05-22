/**
 * App Bootstrap — orchestrates all modules
 */
const App = (() => {
  let initialized = false;
  let lastRefreshTime = null;
  let pollCountdown = CONFIG.POLL_INTERVAL_MS / 1000;
  let countdownTimer = null;

  // ─── Toast ────────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'info') => {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast toast-${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3500);
  };

  // ─── Countdown ticker ────────────────────────────────────────────────────
  const startCountdown = () => {
    clearInterval(countdownTimer);
    pollCountdown = CONFIG.POLL_INTERVAL_MS / 1000;
    const el = document.getElementById('next-refresh');
    countdownTimer = setInterval(() => {
      pollCountdown--;
      if (el) el.textContent = `Next refresh in ${pollCountdown}s`;
      if (pollCountdown <= 0) pollCountdown = CONFIG.POLL_INTERVAL_MS / 1000;
    }, 1000);
  };

  // ─── Update "last refreshed" display ────────────────────────────────────
  const updateRefreshDisplay = () => {
    lastRefreshTime = new Date();
    const el = document.getElementById('last-refresh');
    if (el) el.textContent = `Last synced: ${lastRefreshTime.toLocaleTimeString()}`;
  };

  // ─── Handle data updates from poll ───────────────────────────────────────
  const onDataUpdate = (cities) => {
    MapService.updateMarkers(cities);
    Modal.refresh(cities);
    updateRefreshDisplay();
    startCountdown();
    showToast('Data refreshed ✓', 'success');
    console.log(`🔄 Poll update: ${cities.length} cities refreshed`);
  };

  const onPollError = (err) => {
    console.error('Poll error:', err);
    showToast('Refresh failed — retrying…', 'error');
  };

  // ─── Loading overlay ─────────────────────────────────────────────────────
  const showLoading = () => document.getElementById('loading-overlay')?.classList.remove('hidden');
  const hideLoading = () => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.classList.add('hidden'), 600);
    }
  };

  // ─── City list sidebar ────────────────────────────────────────────────────
  const renderCityList = (cities) => {
    const list = document.getElementById('city-list');
    if (!list) return;
    list.innerHTML = '';
    cities
      .sort((a, b) => a.cityName.localeCompare(b.cityName))
      .forEach((snap) => {
        const aqi = snap.aqi?.value;
        const aqiInfo = AQI_LEVELS[aqi] || { color: '#64748b', label: '—' };
        const temp = snap.weather?.temperature;

        const item = document.createElement('div');
        item.className = 'city-list-item';
        item.setAttribute('data-city-id', snap.cityId);
        item.innerHTML = `
          <span class="city-list-flag">${snap.flag || '🌍'}</span>
          <div class="city-list-info">
            <span class="city-list-name">${snap.cityName}</span>
            <span class="city-list-country">${snap.country}</span>
          </div>
          <div class="city-list-stats">
            <span class="city-list-temp">${temp != null ? Math.round(temp) + '°C' : '—'}</span>
            <span class="city-list-aqi" style="color:${aqiInfo.color}">${aqiInfo.label}</span>
          </div>`;

        item.addEventListener('click', () => {
          closeSidebar();
          Modal.open(snap.cityId, snap);
          MapService.highlightMarker(snap.cityId);
        });
        list.appendChild(item);
      });
  };

  // ─── Sidebar toggle ───────────────────────────────────────────────────────
  const openSidebar  = () => document.getElementById('sidebar')?.classList.add('open');
  const closeSidebar = () => document.getElementById('sidebar')?.classList.remove('open');

  // ─── Main init ────────────────────────────────────────────────────────────
  const init = async () => {
    if (initialized) return;
    initialized = true;

    showLoading();

    // Init map
    MapService.init('map', (cityId) => {
      const snap = MapService.getSnapshot(cityId);
      if (snap) Modal.open(cityId, snap);
    });

    // Wire up UI events
    document.getElementById('modal-close')?.addEventListener('click', Modal.close);
    document.getElementById('modal-overlay')?.addEventListener('click', Modal.close);
    document.getElementById('sidebar-toggle')?.addEventListener('click', openSidebar);
    document.getElementById('sidebar-close')?.addEventListener('click', closeSidebar);

    // Chart tab buttons
    document.querySelectorAll('.chart-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => Modal.switchTab(btn.dataset.tab));
    });

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') Modal.close();
    });

    // Load initial data
    try {
      const cities = await ApiService.fetchAllCities();
      MapService.addCityMarkers(cities);
      renderCityList(cities);
      updateRefreshDisplay();
      hideLoading();

      if (cities.every((c) => c._loading)) {
        showToast('Fetching live data for the first time…', 'info');
      } else {
        showToast(`${cities.length} cities loaded ✓`, 'success');
      }

      // Start polling + countdown
      ApiService.startPolling(
        (updated) => { onDataUpdate(updated); renderCityList(updated); },
        onPollError
      );
      startCountdown();

    } catch (err) {
      hideLoading();
      console.error('Init error:', err);
      showToast('Failed to connect to API. Is the backend running?', 'error');
      document.getElementById('next-refresh').textContent = 'Connection failed';
    }
  };

  return { init, showToast };
})();

// ─── Start app on DOM ready ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
