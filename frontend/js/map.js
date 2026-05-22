/**
 * Leaflet Map — initializes map, manages custom city markers
 */
const MapService = (() => {
  let map = null;
  let markers = {};       // cityId -> L.Marker
  let cityData = {};      // cityId -> latest snapshot
  let onCityClick = null; // callback

  /**
   * Initialize the Leaflet map
   */
  const init = (containerId, clickCallback) => {
    onCityClick = clickCallback;

    map = L.map(containerId, {
      center: CONFIG.MAP_CENTER,
      zoom: CONFIG.MAP_ZOOM,
      minZoom: CONFIG.MAP_MIN_ZOOM,
      maxZoom: CONFIG.MAP_MAX_ZOOM,
      zoomControl: false,
      attributionControl: true,
    });

    // CartoDB Dark Matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://carto.com/">CARTO</a> | © <a href="https://openstreetmap.org">OSM</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    // Custom zoom controls (top-right)
    L.control.zoom({ position: 'topright' }).addTo(map);

    console.log('🗺 Map initialized');
    return map;
  };

  /**
   * Build custom HTML marker icon colored by AQI
   */
  const buildIcon = (city, snap) => {
    const aqi = snap?.aqi?.value;
    const temp = snap?.weather?.temperature;
    const aqiInfo = AQI_LEVELS[aqi] || { color: '#64748b', label: 'Loading' };

    return L.divIcon({
      className: '',
      html: `
        <div class="city-marker" style="--aqi-color:${aqiInfo.color}">
          <div class="marker-pulse"></div>
          <div class="marker-dot">
            <span class="marker-temp">${temp != null ? Math.round(temp) + '°' : '…'}</span>
          </div>
          <div class="marker-label">${city.flag} ${city.name}</div>
        </div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  };

  /**
   * Place markers for all cities (initial render)
   */
  const addCityMarkers = (cities) => {
    cities.forEach((snap) => {
      if (!snap.coordinates) return;
      const { lat, lon } = snap.coordinates;
      const city = { id: snap.cityId, name: snap.cityName, flag: snap.flag || '🌍' };

      const icon = buildIcon(city, snap);
      const marker = L.marker([lat, lon], { icon })
        .addTo(map)
        .on('click', () => {
          if (onCityClick) onCityClick(snap.cityId);
          highlightMarker(snap.cityId);
        });

      markers[snap.cityId] = { marker, lat, lon };
      cityData[snap.cityId] = snap;
    });
  };

  /**
   * Update existing markers with fresh data (no flicker)
   */
  const updateMarkers = (cities) => {
    cities.forEach((snap) => {
      if (!snap.coordinates || !markers[snap.cityId]) return;
      const { lat, lon } = snap.coordinates;
      const city = { id: snap.cityId, name: snap.cityName, flag: snap.flag || '🌍' };

      const icon = buildIcon(city, snap);
      markers[snap.cityId].marker.setIcon(icon);
      cityData[snap.cityId] = snap;
    });
  };

  /**
   * Add a glowing ring to the selected marker
   */
  const highlightMarker = (cityId) => {
    // Remove highlight from all
    document.querySelectorAll('.city-marker').forEach((el) => el.classList.remove('selected'));
    // Highlight clicked
    const markerEl = markers[cityId]?.marker?.getElement();
    if (markerEl) {
      markerEl.querySelector('.city-marker')?.classList.add('selected');
    }
  };

  const clearHighlight = () => {
    document.querySelectorAll('.city-marker').forEach((el) => el.classList.remove('selected'));
  };

  const getSnapshot = (cityId) => cityData[cityId] || null;
  const getAllSnapshots = () => Object.values(cityData);
  const flyTo = (cityId) => {
    const m = markers[cityId];
    if (m && map) map.flyTo([m.lat, m.lon], 5, { duration: 1.2 });
  };

  return { init, addCityMarkers, updateMarkers, highlightMarker, clearHighlight, getSnapshot, getAllSnapshots, flyTo };
})();
