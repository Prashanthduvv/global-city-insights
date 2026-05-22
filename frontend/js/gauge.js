/**
 * SVG Arc Temperature Gauge
 * Renders a semicircular gauge for temperature display
 */
const Gauge = (() => {
  const MIN_TEMP = -20;
  const MAX_TEMP = 50;

  const getTempColor = (temp) => {
    if (temp <= 0)  return '#60a5fa';   // icy blue
    if (temp <= 10) return '#93c5fd';   // light blue
    if (temp <= 20) return '#34d399';   // green
    if (temp <= 28) return '#fbbf24';   // amber
    if (temp <= 35) return '#f97316';   // orange
    return '#ef4444';                   // red
  };

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const s = polarToCartesian(cx, cy, r, startAngle);
    const e = polarToCartesian(cx, cy, r, endAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  /**
   * Renders gauge into a container element
   * @param {HTMLElement} container
   * @param {number} temp - temperature in °C
   */
  const render = (container, temp) => {
    const clamped = Math.max(MIN_TEMP, Math.min(MAX_TEMP, temp ?? 0));
    const pct = (clamped - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);
    const startAngle = 135;
    const endAngle = 405;
    const fillAngle = startAngle + pct * (endAngle - startAngle);
    const color = getTempColor(clamped);

    const cx = 100, cy = 90, r = 70;
    const bgArc = describeArc(cx, cy, r, startAngle, endAngle);
    const fillArc = fillAngle > startAngle + 1 ? describeArc(cx, cy, r, startAngle, Math.min(fillAngle, endAngle - 0.1)) : '';

    container.innerHTML = `
      <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" class="gauge-svg">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#60a5fa"/>
            <stop offset="40%"  stop-color="#34d399"/>
            <stop offset="70%"  stop-color="#fbbf24"/>
            <stop offset="100%" stop-color="#ef4444"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <!-- Background track -->
        <path d="${bgArc}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="14" stroke-linecap="round"/>
        <!-- Value arc -->
        ${fillArc ? `<path d="${fillArc}" fill="none" stroke="url(#gaugeGrad)" stroke-width="14" stroke-linecap="round" filter="url(#glow)"/>` : ''}
        <!-- Center value -->
        <text x="${cx}" y="${cy - 5}" text-anchor="middle" font-size="28" font-weight="700" fill="${color}" font-family="Inter,sans-serif">${temp != null ? clamped.toFixed(1) : '--'}</text>
        <text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="13" fill="#94a3b8" font-family="Inter,sans-serif">°C</text>
        <!-- Min/Max labels -->
        <text x="20" y="140" text-anchor="middle" font-size="10" fill="#64748b" font-family="Inter,sans-serif">${MIN_TEMP}°</text>
        <text x="180" y="140" text-anchor="middle" font-size="10" fill="#64748b" font-family="Inter,sans-serif">${MAX_TEMP}°</text>
      </svg>`;
  };

  return { render };
})();
