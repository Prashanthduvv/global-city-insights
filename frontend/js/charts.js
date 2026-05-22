/**
 * Chart.js Trend Charts — Temperature & AQI over last 7 days
 */
const Charts = (() => {
  let tempChart = null;
  let aqiChart = null;

  const CHART_DEFAULTS = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10,14,30,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#64748b', maxTicksLimit: 7, font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
    },
  };

  const formatLabel = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const destroyAll = () => {
    if (tempChart) { tempChart.destroy(); tempChart = null; }
    if (aqiChart)  { aqiChart.destroy();  aqiChart = null;  }
  };

  /**
   * Render temperature trend chart
   */
  const renderTempChart = (canvasId, historyData) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const labels = historyData.map((d) => formatLabel(d.timestamp));
    const temps  = historyData.map((d) => d.weather?.temperature ?? null);

    if (tempChart) tempChart.destroy();

    tempChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Temperature (°C)',
          data: temps,
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0,212,255,0.08)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#00d4ff',
          pointBorderColor: 'transparent',
          fill: true,
          tension: 0.4,
          spanGaps: true,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          ...CHART_DEFAULTS.plugins,
          tooltip: {
            ...CHART_DEFAULTS.plugins.tooltip,
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y?.toFixed(1) ?? '--'}°C`,
            },
          },
        },
        scales: {
          ...CHART_DEFAULTS.scales,
          y: {
            ...CHART_DEFAULTS.scales.y,
            ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: (v) => `${v}°` },
          },
        },
      },
    });
  };

  /**
   * Render AQI trend chart
   */
  const renderAqiChart = (canvasId, historyData) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const labels = historyData.map((d) => formatLabel(d.timestamp));
    const aqis   = historyData.map((d) => d.aqi?.value ?? null);

    const pointColors = aqis.map((v) => (v ? AQI_LEVELS[v]?.color : '#64748b'));

    if (aqiChart) aqiChart.destroy();

    aqiChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'AQI Level (1–5)',
          data: aqis,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.08)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: pointColors,
          pointBorderColor: 'transparent',
          fill: true,
          tension: 0.3,
          spanGaps: true,
          stepped: 'middle',
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          ...CHART_DEFAULTS.plugins,
          tooltip: {
            ...CHART_DEFAULTS.plugins.tooltip,
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed.y;
                return ` AQI ${v} — ${AQI_LEVELS[v]?.label ?? 'Unknown'}`;
              },
            },
          },
        },
        scales: {
          ...CHART_DEFAULTS.scales,
          y: {
            ...CHART_DEFAULTS.scales.y,
            min: 0,
            max: 6,
            ticks: {
              ...CHART_DEFAULTS.scales.y.ticks,
              stepSize: 1,
              callback: (v) => {
                const labels = { 1:'Good',2:'Fair',3:'Moderate',4:'Poor',5:'Very Poor' };
                return labels[v] || '';
              },
            },
          },
        },
      },
    });
  };

  /**
   * Render a "No data available" placeholder
   */
  const renderNoData = (canvasId, message = 'Collecting data…') => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#334155';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
  };

  return { renderTempChart, renderAqiChart, renderNoData, destroyAll };
})();
