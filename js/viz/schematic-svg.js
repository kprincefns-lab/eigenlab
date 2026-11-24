/**
 * EIGENLAB — Dark-Studio Engineering Schematic SVG Generator
 * Renders crisp, Apple/Linear/Spline dark-glass engineering schematics
 * for the paperless control systems step solver (viewBox="0 0 420 148").
 */

const FONT_MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

const COLORS = {
  wall: '#64748B',
  wire: '#94A3B8',
  cyan: '#22D3EE',
  amber: '#F59E0B',
  emerald: '#34D399',
  violet: '#A78BFA',
  rose: '#FB7185',
  text: '#F3F6FC',
  muted: '#94A3B8',
  bgHalo: '#070A10',
};

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmt(value, fallback = '') {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value);
}

function fitFontSize(text, maxWidthPx, baseSize = 10, minSize = 7.5) {
  const str = String(text ?? '');
  if (!str.length) return baseSize;
  const estWidth = str.length * baseSize * 0.62;
  if (estWidth <= maxWidthPx) return baseSize;
  const scaled = (maxWidthPx / (str.length * 0.62));
  return Math.max(minSize, Math.round(scaled * 10) / 10);
}

function buildDefs(prefix) {
  const markers = [
    ['arrow-cyan', COLORS.cyan],
    ['arrow-amber', COLORS.amber],
    ['arrow-emerald', COLORS.emerald],
    ['arrow-violet', COLORS.violet],
    ['arrow-slate', COLORS.wire],
  ]
    .map(
      ([id, color]) =>
        `<marker id="${prefix}${id}" viewBox="0 0 10 8" refX="8.2" refY="4" markerWidth="7.5" markerHeight="6" orient="auto-start-reverse">` +
        `<path d="M0.8,1 L9,4 L0.8,7 L2.6,4 Z" fill="${color}"/>` +
        `</marker>`
    )
    .join('');

  return (
    `<defs>` +
    `<pattern id="${prefix}grid" width="14" height="14" patternUnits="userSpaceOnUse">` +
    `<path d="M 14 0 L 0 0 0 14" fill="none" stroke="rgba(148,163,184,0.06)" stroke-width="0.6"/>` +
    `<circle cx="14" cy="14" r="0.65" fill="rgba(148,163,184,0.16)"/>` +
    `</pattern>` +
    `<pattern id="${prefix}hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
    `<line x1="0" y1="0" x2="0" y2="6" stroke="${COLORS.wall}" stroke-width="1.15" stroke-opacity="0.78"/>` +
    `</pattern>` +
    `<linearGradient id="${prefix}glass-cyan" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="#12303E" stop-opacity="0.92"/>` +
    `<stop offset="100%" stop-color="#091520" stop-opacity="0.96"/>` +
    `</linearGradient>` +
    `<linearGradient id="${prefix}glass-emerald" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="#0D3326" stop-opacity="0.92"/>` +
    `<stop offset="100%" stop-color="#071913" stop-opacity="0.96"/>` +
    `</linearGradient>` +
    `<linearGradient id="${prefix}glass-amber" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="#31210C" stop-opacity="0.92"/>` +
    `<stop offset="100%" stop-color="#171008" stop-opacity="0.96"/>` +
    `</linearGradient>` +
    `<linearGradient id="${prefix}glass-violet" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="#241B3C" stop-opacity="0.92"/>` +
    `<stop offset="100%" stop-color="#110D20" stop-opacity="0.96"/>` +
    `</linearGradient>` +
    `<linearGradient id="${prefix}glass-node" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="#182032" stop-opacity="0.95"/>` +
    `<stop offset="100%" stop-color="#0B0F19" stop-opacity="0.98"/>` +
    `</linearGradient>` +
    `<linearGradient id="${prefix}shaft" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="#CBD5E1"/>` +
    `<stop offset="45%" stop-color="#64748B"/>` +
    `<stop offset="100%" stop-color="#334155"/>` +
    `</linearGradient>` +
    `<linearGradient id="${prefix}disk-rim" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="#1B4657"/>` +
    `<stop offset="50%" stop-color="#0D2330"/>` +
    `<stop offset="100%" stop-color="#08141E"/>` +
    `</linearGradient>` +
    `<filter id="${prefix}glow-soft" x="-25%" y="-25%" width="150%" height="150%">` +
    `<feGaussianBlur stdDeviation="1.35" result="blur"/>` +
    `<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>` +
    `</filter>` +
    `<filter id="${prefix}glow-boost" x="-35%" y="-35%" width="170%" height="170%">` +
    `<feGaussianBlur stdDeviation="2.2" result="blur"/>` +
    `<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>` +
    `</filter>` +
    markers +
    `</defs>`
  );
}

function wrapSVG(prefix, ariaLabel, body) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 148" width="100%" role="img" aria-label="${esc(ariaLabel)}" style="display:block;width:100%;height:auto;">` +
    buildDefs(prefix) +
    `<rect x="1" y="1" width="418" height="146" rx="10" fill="url(#${prefix}grid)" stroke="rgba(148,163,184,0.12)" stroke-width="0.75"/>` +
    body +
    `</svg>`
  );
}

function labelText(x, y, content, opts = {}) {
  const {
    color = COLORS.text,
    size = 10,
    weight = '600',
    anchor = 'middle',
    filter = '',
    opacity = '1',
    letterSpacing = '',
    raw = false,
  } = opts;
  const fAttr = filter ? ` filter="url(#${filter})"` : '';
  const lsAttr = letterSpacing ? ` letter-spacing="${letterSpacing}"` : '';
  const body = raw ? content : esc(content);
  return (
    `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" fill-opacity="${opacity}" ` +
    `font-family='${FONT_MONO}' font-size="${size}" font-weight="${weight}"${lsAttr}${fAttr} ` +
    `paint-order="stroke" stroke="${COLORS.bgHalo}" stroke-width="2.6" stroke-linejoin="round">${body}</text>`
  );
}

function pillBadge(cx, cy, text, accentColor, opts = {}) {
  const { size = 9.5, padX = 7, h = 16, bg = 'rgba(7,10,16,0.88)', textColor = accentColor, filter = '' } = opts;
  const str = String(text);
  const w = Math.max(36, Math.round(str.length * size * 0.62 + padX * 2));
  const x = Math.round((cx - w / 2) * 10) / 10;
  const y = Math.round((cy - h / 2) * 10) / 10;
  const fAttr = filter ? ` filter="url(#${filter})"` : '';
  return (
    `<g${fAttr}>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${bg}" stroke="${accentColor}" stroke-opacity="0.45" stroke-width="0.9"/>` +
    `<text x="${cx}" y="${cy + size * 0.34}" text-anchor="middle" fill="${textColor}" font-family='${FONT_MONO}' font-size="${size}" font-weight="600">${esc(str)}</text>` +
    `</g>`
  );
}

function renderSubtitle(subtitle, x = 14, y = 142) {
  if (!subtitle) return '';
  return labelText(x, y, subtitle, {
    color: COLORS.muted,
    size: 8.5,
    weight: '500',
    anchor: 'start',
    opacity: '0.82',
  });
}

function hZigzagPath(x1, x2, y, peaks = 6, amp = 6.5) {
  const span = x2 - x1;
  const step = span / (peaks * 2);
  let d = `M ${x1},${y}`;
  for (let i = 0; i < peaks * 2; i++) {
    const nx = x1 + step * (i + 0.5);
    const ny = i % 2 === 0 ? y - amp : y + amp;
    d += ` L ${nx.toFixed(1)},${ny.toFixed(1)}`;
  }
  d += ` L ${x2},${y}`;
  return d;
}

function vZigzagPath(x, y1, y2, peaks = 6, amp = 6) {
  const span = y2 - y1;
  const step = span / (peaks * 2);
  let d = `M ${x},${y1}`;
  for (let i = 0; i < peaks * 2; i++) {
    const ny = y1 + step * (i + 0.5);
    const nx = i % 2 === 0 ? x - amp : x + amp;
    d += ` L ${nx.toFixed(1)},${ny.toFixed(1)}`;
  }
  d += ` L ${x},${y2}`;
  return d;
}

function hInductorPath(x1, x2, y, bumps = 4, ry = 8.5) {
  const w = (x2 - x1) / bumps;
  const rx = w / 2;
  let d = `M ${x1},${y}`;
  for (let i = 0; i < bumps; i++) {
    const nx = x1 + w * (i + 1);
    d += ` A ${rx.toFixed(2)},${ry} 0 0,1 ${nx.toFixed(1)},${y}`;
  }
  return d;
}

function vInductorPath(x, y1, y2, bumps = 4, rx = 7.5) {
  const h = (y2 - y1) / bumps;
  const ry = h / 2;
  let d = `M ${x},${y1}`;
  for (let i = 0; i < bumps; i++) {
    const ny = y1 + h * (i + 1);
    d += ` A ${rx},${ry.toFixed(2)} 0 0,1 ${x},${ny.toFixed(1)}`;
  }
  return d;
}

function groundSymbol(x, y, color = COLORS.wall) {
  return (
    `<g stroke="${color}" stroke-linecap="round">` +
    `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 7}" stroke-width="1.5"/>` +
    `<line x1="${x - 9}" y1="${y + 7}" x2="${x + 9}" y2="${y + 7}" stroke-width="1.6"/>` +
    `<line x1="${x - 5.5}" y1="${y + 10.5}" x2="${x + 5.5}" y2="${y + 10.5}" stroke-width="1.4"/>` +
    `<line x1="${x - 2.5}" y1="${y + 14}" x2="${x + 2.5}" y2="${y + 14}" stroke-width="1.2"/>` +
    `</g>`
  );
}

/* ==========================================================================
   1. Mass-Spring-Damper (msd)
   ========================================================================== */
function renderMSD(d, p, isSetup) {
  const mVal = fmt(d.m, 'm');
  const cVal = fmt(d.c, 'c');
  const kVal = fmt(d.k, 'k');
  const inputLabel = fmt(d.input, 'f(t)');
  const outputLabel = fmt(d.output, 'x(t)');

  const arrowFilter = isSetup ? `${p}glow-boost` : '';
  const cueFilter = isSetup ? `${p}glow-soft` : '';
  const cueOp = isSetup ? '1' : '0.78';
  const arrowSw = isSetup ? '2.2' : '1.85';

  const springD = hZigzagPath(56, 188, 62, 7, 8);

  const body =
    // Left fixed vertical wall + hatch
    `<rect x="18" y="26" width="12" height="100" fill="url(#${p}hatch)"/>` +
    `<line x1="30" y1="24" x2="30" y2="126" stroke="${COLORS.wire}" stroke-width="2" stroke-linecap="round"/>` +
    // Frictionless hatched floor
    `<rect x="30" y="126" width="352" height="7" fill="url(#${p}hatch)" opacity="0.6"/>` +
    `<line x1="30" y1="126" x2="382" y2="126" stroke="${COLORS.wall}" stroke-width="1.5"/>` +

    // Upper branch: Emerald helical spring
    `<line x1="30" y1="62" x2="56" y2="62" stroke="${COLORS.wire}" stroke-width="1.8"/>` +
    `<path d="${springD}" fill="none" stroke="${COLORS.emerald}" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<line x1="188" y1="62" x2="216" y2="62" stroke="${COLORS.wire}" stroke-width="1.8"/>` +
    `<circle cx="216" cy="62" r="2.6" fill="${COLORS.emerald}"/>` +
    labelText(104, 44, `k = ${kVal}`, { color: COLORS.emerald, size: 10.5 }) +
    // Opposing spring force cue (-kx)
    `<g opacity="${cueOp}"${cueFilter ? ` filter="url(#${cueFilter})"` : ''}>` +
    `<line x1="208" y1="44" x2="176" y2="44" stroke="${COLORS.emerald}" stroke-width="1.5" marker-end="url(#${p}arrow-emerald)"/>` +
    labelText(192, 36, '−kx', { color: COLORS.emerald, size: 9.5, weight: '600' }) +
    `</g>` +

    // Lower branch: Amber hydraulic dashpot damper
    `<line x1="30" y1="96" x2="86" y2="96" stroke="${COLORS.wire}" stroke-width="1.8"/>` +
    `<rect x="87" y="87" width="46" height="18" fill="rgba(245,158,11,0.12)"/>` +
    `<path d="M 148,86 L 86,86 L 86,106 L 148,106" fill="none" stroke="${COLORS.amber}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<line x1="216" y1="96" x2="122" y2="96" stroke="${COLORS.amber}" stroke-width="2"/>` +
    `<line x1="122" y1="89.5" x2="122" y2="102.5" stroke="${COLORS.amber}" stroke-width="2.5" stroke-linecap="round"/>` +
    `<circle cx="216" cy="96" r="2.6" fill="${COLORS.amber}"/>` +
    labelText(92, 119, `c = ${cVal}`, { color: COLORS.amber, size: 10.5 }) +
    // Opposing damping force cue (-cx_dot)
    `<g opacity="${cueOp}"${cueFilter ? ` filter="url(#${cueFilter})"` : ''}>` +
    `<line x1="208" y1="115.5" x2="176" y2="115.5" stroke="${COLORS.amber}" stroke-width="1.5" marker-end="url(#${p}arrow-amber)"/>` +
    labelText(158, 119, '−cẋ', { color: COLORS.amber, size: 9.5, weight: '600' }) +
    `</g>` +

    // Center-right: Cyan dark-glass mass block + rollers
    `<rect x="216" y="46" width="84" height="68" rx="9" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.8"/>` +
    `<line x1="224" y1="47.3" x2="292" y2="47.3" stroke="rgba(255,255,255,0.24)" stroke-width="1"/>` +
    labelText(258, 66, 'MASS', { color: COLORS.cyan, size: 8, weight: '600', opacity: '0.68', letterSpacing: '1.2' }) +
    labelText(258, 86, `m = ${mVal}`, { color: COLORS.text, size: 11.5, weight: '700' }) +
    `<circle cx="235" cy="120.5" r="4.5" fill="#0B0F19" stroke="${COLORS.cyan}" stroke-width="1.5"/>` +
    `<circle cx="235" cy="120.5" r="1.2" fill="${COLORS.cyan}"/>` +
    `<circle cx="281" cy="120.5" r="4.5" fill="#0B0F19" stroke="${COLORS.cyan}" stroke-width="1.5"/>` +
    `<circle cx="281" cy="120.5" r="1.2" fill="${COLORS.cyan}"/>` +

    // Top coordinate dimension arrow: Cyan x(t) ->
    `<line x1="258" y1="46" x2="258" y2="22" stroke="${COLORS.cyan}" stroke-width="1.1" stroke-dasharray="2.5 2.5" stroke-opacity="0.7"/>` +
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<line x1="258" y1="28" x2="338" y2="28" stroke="${COLORS.cyan}" stroke-width="${arrowSw}" marker-end="url(#${p}arrow-cyan)"/>` +
    labelText(298, 20, `${outputLabel} →`, { color: COLORS.cyan, size: 11, weight: '700' }) +
    labelText(347, 31, '+', { color: COLORS.cyan, size: 10, weight: '700', opacity: cueOp }) +
    `</g>` +

    // Right side applied force arrow: Emerald f(t) ->
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<circle cx="300" cy="80" r="2.6" fill="${COLORS.emerald}"/>` +
    `<line x1="300" y1="80" x2="378" y2="80" stroke="${COLORS.emerald}" stroke-width="${arrowSw}" marker-end="url(#${p}arrow-emerald)"/>` +
    labelText(344, 69, `${inputLabel} →`, { color: COLORS.emerald, size: 11, weight: '700' }) +
    labelText(387, 83, '+', { color: COLORS.emerald, size: 10, weight: '700', opacity: cueOp }) +
    `</g>` +

    renderSubtitle(d.subtitle, 14, 143);

  return wrapSVG(p, `Mass-spring-damper schematic: m=${mVal}, c=${cVal}, k=${kVal}`, body);
}

/* ==========================================================================
   2. Rotational Inertia-Damper-Spring (rotational)
   ========================================================================== */
function renderRotational(d, p, isSetup) {
  const jVal = fmt(d.J, 'J');
  const bVal = fmt(d.b, 'b');
  const kThetaVal = fmt(d.kTheta, 'k_θ');
  const inputLabel = fmt(d.input, 'τ(t)');
  const outputLabel = fmt(d.output, 'θ(t)');

  const arrowFilter = isSetup ? `${p}glow-boost` : '';
  const cueFilter = isSetup ? `${p}glow-soft` : '';
  const cueOp = isSetup ? '1' : '0.78';
  const arrowSw = isSetup ? '2.15' : '1.8';

  // Build helical torsional spring coils wrapping around the horizontal shaft (x=54..126, cy=74)
  let springBack = '';
  let springFront = '';
  const coilCount = 5;
  const xStart = 54;
  const coilStep = 14;
  for (let i = 0; i < coilCount; i++) {
    const cx = xStart + i * coilStep;
    springBack += `<path d="M ${cx},59 C ${cx + 4},59 ${cx + 5},89 ${cx + 9},89" fill="none" stroke="${COLORS.emerald}" stroke-opacity="0.34" stroke-width="1.6"/>`;
    springFront += `<path d="M ${cx - 3},89 C ${cx + 1},89 ${cx + 3},59 ${cx + 7},59" fill="none" stroke="${COLORS.emerald}" stroke-width="2.1" stroke-linecap="round"/>`;
  }

  const body =
    // Left fixed vertical wall + hatch
    `<rect x="18" y="28" width="12" height="92" fill="url(#${p}hatch)"/>` +
    `<line x1="30" y1="26" x2="30" y2="122" stroke="${COLORS.wire}" stroke-width="2" stroke-linecap="round"/>` +

    // Back half of torsional spring (behind shaft)
    springBack +

    // Horizontal torsional shaft passing through spring & damper into flywheel
    `<rect x="30" y="71" width="248" height="6" rx="1.5" fill="url(#${p}shaft)"/>` +
    `<line x1="30" y1="71.6" x2="278" y2="71.6" stroke="rgba(255,255,255,0.28)" stroke-width="0.7"/>` +

    // Front half of Emerald torsional spring
    springFront +
    `<line x1="48" y1="74" x2="51" y2="89" stroke="${COLORS.emerald}" stroke-width="1.8" stroke-linecap="round"/>` +
    `<line x1="120" y1="59" x2="124" y2="74" stroke="${COLORS.emerald}" stroke-width="1.8" stroke-linecap="round"/>` +
    labelText(86, 42, `k<tspan dy="2" font-size="7.5">θ</tspan><tspan dy="-2"> = ${esc(kThetaVal)}</tspan>`, {
      color: COLORS.emerald,
      size: 10.5,
      raw: true,
    }) +
    labelText(86, 108, '−kθ·θ', { color: COLORS.emerald, size: 9, opacity: cueOp, filter: cueFilter }) +

    // Amber rotational viscous damper sleeve
    `<rect x="154" y="54" width="60" height="40" rx="6" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.7"/>` +
    `<line x1="160" y1="55.3" x2="208" y2="55.3" stroke="rgba(255,255,255,0.2)" stroke-width="0.9"/>` +
    // Internal viscous shear lines around shaft
    `<line x1="162" y1="64" x2="206" y2="64" stroke="${COLORS.amber}" stroke-opacity="0.45" stroke-width="1.1" stroke-dasharray="4 3"/>` +
    `<line x1="162" y1="84" x2="206" y2="84" stroke="${COLORS.amber}" stroke-opacity="0.45" stroke-width="1.1" stroke-dasharray="4 3"/>` +
    // Stationary damper ground bracket
    `<line x1="184" y1="94" x2="184" y2="105" stroke="${COLORS.wall}" stroke-width="1.6"/>` +
    `<rect x="168" y="105" width="32" height="5.5" fill="url(#${p}hatch)"/>` +
    `<line x1="168" y1="105" x2="200" y2="105" stroke="${COLORS.wire}" stroke-width="1.4"/>` +
    labelText(184, 42, `b = ${bVal}`, { color: COLORS.amber, size: 10.5 }) +
    labelText(184, 122, '−bθ̇', { color: COLORS.amber, size: 9, opacity: cueOp, filter: cueFilter }) +

    // Sculpted Cyan Flywheel Inertia Disk (isometric cylinder)
    `<path d="M 272,33 L 288,33 A 19,41 0 0,1 288,115 L 272,115 A 19,41 0 0,1 272,33 Z" fill="url(#${p}disk-rim)" stroke="${COLORS.cyan}" stroke-width="1.7"/>` +
    `<ellipse cx="288" cy="74" rx="19" ry="41" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.9"/>` +
    // Specular rim & inner precision ring
    `<path d="M 281,38 A 14,35 0 0,1 296,44" fill="none" stroke="rgba(255,255,255,0.42)" stroke-width="1.2" stroke-linecap="round"/>` +
    `<ellipse cx="288" cy="74" rx="11.5" ry="25" fill="none" stroke="${COLORS.cyan}" stroke-opacity="0.32" stroke-width="1"/>` +
    `<ellipse cx="288" cy="74" rx="4.2" ry="8.5" fill="#0B1320" stroke="${COLORS.cyan}" stroke-width="1.4"/>` +
    labelText(282, 132, `J = ${jVal}`, { color: COLORS.cyan, size: 10.5, weight: '700' }) +

    // Right stub shaft + centerline
    `<rect x="288" y="71.2" width="48" height="5.6" rx="1.5" fill="url(#${p}shaft)"/>` +
    `<line x1="338" y1="74" x2="366" y2="74" stroke="${COLORS.wall}" stroke-width="1" stroke-dasharray="3 3"/>` +

    // Curved Cyan angle arrow theta(t)
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<path d="M 301,27 A 28,28 0 0,1 329,51" fill="none" stroke="${COLORS.cyan}" stroke-width="${arrowSw}" stroke-linecap="round" marker-end="url(#${p}arrow-cyan)"/>` +
    labelText(334, 34, outputLabel, { color: COLORS.cyan, size: 11, weight: '700', anchor: 'start' }) +
    labelText(336, 52, '+', { color: COLORS.cyan, size: 9.5, weight: '700', opacity: cueOp }) +
    `</g>` +

    // Curved Emerald applied torque arrow tau(t)
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<path d="M 340,56 A 14,22 0 0,1 342,95" fill="none" stroke="${COLORS.emerald}" stroke-width="${arrowSw}" stroke-linecap="round" marker-end="url(#${p}arrow-emerald)"/>` +
    labelText(355, 81, inputLabel, { color: COLORS.emerald, size: 11, weight: '700', anchor: 'start' }) +
    labelText(350, 100, '+', { color: COLORS.emerald, size: 9.5, weight: '700', opacity: cueOp }) +
    `</g>` +

    renderSubtitle(d.subtitle, 14, 143);

  return wrapSVG(p, `Rotational system schematic: J=${jVal}, b=${bVal}, k_theta=${kThetaVal}`, body);
}

/* ==========================================================================
   3. Series RLC Circuit (rlc-series)
   ========================================================================== */
function renderRLCSeries(d, p, isSetup) {
  const rVal = fmt(d.R, 'R');
  const lVal = fmt(d.L, 'L');
  const cVal = fmt(d.C, 'C');
  const inputLabel = fmt(d.input, 'v_in(t)');
  const outputLabel = fmt(d.output, 'v_C(t)');
  const currentLabel = fmt(d.current, 'i(t)');

  const arrowFilter = isSetup ? `${p}glow-boost` : '';
  const cueFilter = isSetup ? `${p}glow-soft` : '';
  const cueOp = isSetup ? '1' : '0.8';

  const resD = hZigzagPath(122, 182, 34, 6, 6.5);
  const indD = hInductorPath(214, 278, 34, 4, 8.5);

  const body =
    // Outer circuit loop wires
    `<g stroke="${COLORS.wire}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M 88,57 L 88,34 L 122,34"/>` +
    `<line x1="182" y1="34" x2="214" y2="34"/>` +
    `<path d="M 278,34 L 314,34 L 314,69"/>` +
    `<path d="M 314,80 L 314,116 L 88,116 L 88,93"/>` +
    `</g>` +
    // Corner junction dots
    `<circle cx="88" cy="34" r="2.2" fill="${COLORS.wire}"/>` +
    `<circle cx="314" cy="34" r="2.2" fill="${COLORS.wire}"/>` +
    `<circle cx="314" cy="116" r="2.2" fill="${COLORS.wire}"/>` +
    `<circle cx="88" cy="116" r="2.2" fill="${COLORS.wire}"/>` +

    // Left branch: Circular Voltage Source
    `<circle cx="88" cy="75" r="18" fill="url(#${p}glass-node)" stroke="${COLORS.emerald}" stroke-width="1.8"/>` +
    labelText(88, 70, '+', { color: COLORS.emerald, size: 11, weight: '700', filter: cueFilter }) +
    labelText(88, 86, '−', { color: COLORS.wire, size: 11, weight: '700', opacity: cueOp }) +
    labelText(63, 78, inputLabel, { color: COLORS.emerald, size: 10.5, weight: '700', anchor: 'end', filter: arrowFilter }) +

    // Top-left: Amber zigzag Resistor
    `<path d="${resD}" fill="none" stroke="${COLORS.amber}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
    labelText(152, 20, `R = ${rVal}`, { color: COLORS.amber, size: 10.5 }) +

    // Top-right: Cyan 4-bump Inductor coil
    `<path d="${indD}" fill="none" stroke="${COLORS.cyan}" stroke-width="2" stroke-linecap="round"/>` +
    labelText(246, 20, `L = ${lVal}`, { color: COLORS.cyan, size: 10.5 }) +

    // Clockwise loop current arrow i(t) ->
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<path d="M 134,64 L 194,64 Q 208,64 208,78 L 208,88" fill="none" stroke="${COLORS.amber}" stroke-width="${isSetup ? '2.1' : '1.75'}" stroke-linecap="round" marker-end="url(#${p}arrow-amber)"/>` +
    labelText(169, 81, `${currentLabel} →`, { color: COLORS.amber, size: 10.5, weight: '700' }) +
    `</g>` +

    // Right branch: Emerald Parallel-Plate Capacitor
    `<rect x="301" y="70" width="26" height="9" fill="rgba(52,211,153,0.14)"/>` +
    `<line x1="299" y1="69" x2="329" y2="69" stroke="${COLORS.emerald}" stroke-width="2.5" stroke-linecap="round"/>` +
    `<line x1="299" y1="80" x2="329" y2="80" stroke="${COLORS.emerald}" stroke-width="2.5" stroke-linecap="round"/>` +
    labelText(293, 78, `C = ${cVal}`, { color: COLORS.emerald, size: 10, anchor: 'end' }) +
    // Capacitor polarity + output voltage label
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    labelText(339, 64, '+', { color: COLORS.emerald, size: 11, weight: '700' }) +
    labelText(339, 92, '−', { color: COLORS.wire, size: 11, weight: '700', opacity: cueOp }) +
    labelText(351, 78, outputLabel, { color: COLORS.emerald, size: 10.5, weight: '700', anchor: 'start' }) +
    `</g>` +

    // Bottom return wire ground symbol
    groundSymbol(201, 116) +
    labelText(218, 130, 'GND', { color: COLORS.wall, size: 8.5, weight: '600', anchor: 'start' }) +

    renderSubtitle(d.subtitle, 14, 143);

  return wrapSVG(p, `Series RLC circuit schematic: R=${rVal}, L=${lVal}, C=${cVal}`, body);
}

/* ==========================================================================
   4. Parallel RLC Circuit (rlc-parallel)
   ========================================================================== */
function renderRLCParallel(d, p, isSetup) {
  const rVal = fmt(d.R, 'R');
  const lVal = fmt(d.L, 'L');
  const cVal = fmt(d.C, 'C');
  const inputLabel = fmt(d.input, 'i_in(t)');
  const outputLabel = fmt(d.output, 'v(t)');

  const arrowFilter = isSetup ? `${p}glow-boost` : '';
  const cueFilter = isSetup ? `${p}glow-soft` : '';
  const cueOp = isSetup ? '1' : '0.8';

  const xSrc = 76;
  const xR = 160;
  const xL = 248;
  const xC = 336;

  const resD = vZigzagPath(xR, 54, 94, 5, 6);
  const indD = vInductorPath(xL, 54, 94, 4, 7.5);

  const body =
    // Top Cyan bus rail (Node v(t), +)
    `<line x1="${xSrc}" y1="32" x2="${xC}" y2="32" stroke="${COLORS.cyan}" stroke-width="2.1" stroke-linecap="round"/>` +
    `<circle cx="${xSrc}" cy="32" r="2.7" fill="${COLORS.cyan}"/>` +
    `<circle cx="${xR}" cy="32" r="2.7" fill="${COLORS.cyan}"/>` +
    `<circle cx="${xL}" cy="32" r="2.7" fill="${COLORS.cyan}"/>` +
    `<circle cx="${xC}" cy="32" r="2.7" fill="${COLORS.cyan}"/>` +
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    labelText(206, 20, `Node ${outputLabel}  (+)`, { color: COLORS.cyan, size: 10.5, weight: '700' }) +
    `</g>` +

    // Bottom Ground rail (GND, -)
    `<line x1="${xSrc}" y1="114" x2="${xC}" y2="114" stroke="${COLORS.wall}" stroke-width="1.8" stroke-linecap="round"/>` +
    `<circle cx="${xSrc}" cy="114" r="2.2" fill="${COLORS.wire}"/>` +
    `<circle cx="${xR}" cy="114" r="2.2" fill="${COLORS.wire}"/>` +
    `<circle cx="${xL}" cy="114" r="2.2" fill="${COLORS.wire}"/>` +
    `<circle cx="${xC}" cy="114" r="2.2" fill="${COLORS.wire}"/>` +
    groundSymbol(206, 114) +
    labelText(223, 129, 'GND (−)', { color: COLORS.muted, size: 8.5, weight: '600', anchor: 'start', opacity: cueOp }) +

    // Left branch: Emerald Current Source
    `<line x1="${xSrc}" y1="32" x2="${xSrc}" y2="56" stroke="${COLORS.wire}" stroke-width="1.7"/>` +
    `<line x1="${xSrc}" y1="90" x2="${xSrc}" y2="114" stroke="${COLORS.wire}" stroke-width="1.7"/>` +
    `<circle cx="${xSrc}" cy="73" r="17" fill="url(#${p}glass-node)" stroke="${COLORS.emerald}" stroke-width="1.8"/>` +
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<line x1="${xSrc}" y1="84" x2="${xSrc}" y2="62" stroke="${COLORS.emerald}" stroke-width="2" marker-end="url(#${p}arrow-emerald)"/>` +
    labelText(xSrc - 23, 76, inputLabel, { color: COLORS.emerald, size: 10, weight: '700', anchor: 'end' }) +
    `</g>` +

    // Branch 1: Amber Resistor (R, i_R)
    `<line x1="${xR}" y1="32" x2="${xR}" y2="54" stroke="${COLORS.wire}" stroke-width="1.7"/>` +
    `<line x1="${xR}" y1="94" x2="${xR}" y2="114" stroke="${COLORS.wire}" stroke-width="1.7"/>` +
    `<path d="${resD}" fill="none" stroke="${COLORS.amber}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
    labelText(xR + 11, 77, `R = ${rVal}`, { color: COLORS.amber, size: 10, anchor: 'start' }) +
    `<g opacity="${cueOp}"${cueFilter ? ` filter="url(#${cueFilter})"` : ''}>` +
    `<line x1="${xR - 14}" y1="39" x2="${xR - 14}" y2="53" stroke="${COLORS.amber}" stroke-width="1.5" marker-end="url(#${p}arrow-amber)"/>` +
    labelText(xR - 21, 49, 'i<tspan dy="2" font-size="7.5">R</tspan>', { color: COLORS.amber, size: 9.5, anchor: 'end', raw: true }) +
    `</g>` +

    // Branch 2: Cyan Inductor coil (L, i_L)
    `<line x1="${xL}" y1="32" x2="${xL}" y2="54" stroke="${COLORS.wire}" stroke-width="1.7"/>` +
    `<line x1="${xL}" y1="94" x2="${xL}" y2="114" stroke="${COLORS.wire}" stroke-width="1.7"/>` +
    `<path d="${indD}" fill="none" stroke="${COLORS.cyan}" stroke-width="2" stroke-linecap="round"/>` +
    labelText(xL + 13, 77, `L = ${lVal}`, { color: COLORS.cyan, size: 10, anchor: 'start' }) +
    `<g opacity="${cueOp}"${cueFilter ? ` filter="url(#${cueFilter})"` : ''}>` +
    `<line x1="${xL - 14}" y1="39" x2="${xL - 14}" y2="53" stroke="${COLORS.cyan}" stroke-width="1.5" marker-end="url(#${p}arrow-cyan)"/>` +
    labelText(xL - 21, 49, 'i<tspan dy="2" font-size="7.5">L</tspan>', { color: COLORS.cyan, size: 9.5, anchor: 'end', raw: true }) +
    `</g>` +

    // Branch 3: Emerald Capacitor (C, i_C)
    `<line x1="${xC}" y1="32" x2="${xC}" y2="68" stroke="${COLORS.wire}" stroke-width="1.7"/>` +
    `<line x1="${xC}" y1="78" x2="${xC}" y2="114" stroke="${COLORS.wire}" stroke-width="1.7"/>` +
    `<rect x="${xC - 13}" y="69" width="26" height="8" fill="rgba(52,211,153,0.14)"/>` +
    `<line x1="${xC - 14}" y1="68" x2="${xC + 14}" y2="68" stroke="${COLORS.emerald}" stroke-width="2.4" stroke-linecap="round"/>` +
    `<line x1="${xC - 14}" y1="78" x2="${xC + 14}" y2="78" stroke="${COLORS.emerald}" stroke-width="2.4" stroke-linecap="round"/>` +
    labelText(xC + 18, 77, `C = ${cVal}`, { color: COLORS.emerald, size: 10, anchor: 'start' }) +
    `<g opacity="${cueOp}"${cueFilter ? ` filter="url(#${cueFilter})"` : ''}>` +
    `<line x1="${xC - 14}" y1="39" x2="${xC - 14}" y2="53" stroke="${COLORS.emerald}" stroke-width="1.5" marker-end="url(#${p}arrow-emerald)"/>` +
    labelText(xC - 21, 49, 'i<tspan dy="2" font-size="7.5">C</tspan>', { color: COLORS.emerald, size: 9.5, anchor: 'end', raw: true }) +
    `</g>` +

    renderSubtitle(d.subtitle, 14, 143);

  return wrapSVG(p, `Parallel RLC circuit schematic: R=${rVal}, L=${lVal}, C=${cVal}`, body);
}

/* ==========================================================================
   5. Buffered 2-Stage RC Cascade (rc-cascade)
   ========================================================================== */
function renderRCCascade(d, p, isSetup) {
  const tau1Val = fmt(d.tau1, 'τ₁');
  const tau2Val = fmt(d.tau2, 'τ₂');
  const inputLabel = fmt(d.input, 'v_in');
  const midLabel = fmt(d.mid, 'v₁');
  const outputLabel = fmt(d.output, 'v_out');

  const arrowFilter = isSetup ? `${p}glow-boost` : '';
  const cueFilter = isSetup ? `${p}glow-soft` : '';
  const cueOp = isSetup ? '1' : '0.8';

  const r1D = hZigzagPath(56, 102, 56, 5, 5.5);
  const r2D = hZigzagPath(260, 306, 64, 5, 5.5);

  const body =
    // Stage time-constant badges
    pillBadge(88, 20, `τ₁ = ${tau1Val}`, COLORS.cyan, { size: 9.5 }) +
    pillBadge(318, 20, `τ₂ = ${tau2Val}`, COLORS.cyan, { size: 9.5 }) +

    // Input terminal + Stage 1 R1 -> node v1 -> C1 -> GND
    `<circle cx="30" cy="56" r="3" fill="${COLORS.bgHalo}" stroke="${COLORS.emerald}" stroke-width="1.8"/>` +
    labelText(30, 43, inputLabel, { color: COLORS.emerald, size: 10, weight: '700', filter: arrowFilter }) +
    `<line x1="33" y1="56" x2="56" y2="56" stroke="${COLORS.wire}" stroke-width="1.7"/>` +
    `<path d="${r1D}" fill="none" stroke="${COLORS.amber}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
    labelText(79, 44, 'R₁', { color: COLORS.amber, size: 9.5 }) +
    `<line x1="102" y1="56" x2="178" y2="56" stroke="${COLORS.wire}" stroke-width="1.7"/>` +
    `<circle cx="126" cy="56" r="2.8" fill="${COLORS.cyan}"/>` +
    labelText(126, 44, midLabel, { color: COLORS.cyan, size: 10.5, weight: '700', filter: arrowFilter }) +
    // Stage 1 C1
    `<line x1="126" y1="56" x2="126" y2="83" stroke="${COLORS.wire}" stroke-width="1.6"/>` +
    `<rect x="114" y="83.5" width="24" height="7" fill="rgba(52,211,153,0.14)"/>` +
    `<line x1="113" y1="83" x2="139" y2="83" stroke="${COLORS.emerald}" stroke-width="2.3" stroke-linecap="round"/>` +
    `<line x1="113" y1="91" x2="139" y2="91" stroke="${COLORS.emerald}" stroke-width="2.3" stroke-linecap="round"/>` +
    `<line x1="126" y1="91" x2="126" y2="115" stroke="${COLORS.wire}" stroke-width="1.6"/>` +
    labelText(108, 90, 'C₁', { color: COLORS.emerald, size: 9.5, anchor: 'end' }) +
    groundSymbol(126, 115) +

    // Center: Violet Unity-Gain Op-Amp Buffer
    `<polygon points="178,42 178,86 224,64" fill="url(#${p}glass-violet)" stroke="${COLORS.violet}" stroke-width="1.8" stroke-linejoin="round"/>` +
    labelText(187, 59, '+', { color: COLORS.violet, size: 10.5, weight: '700', filter: cueFilter }) +
    labelText(187, 76, '−', { color: COLORS.wire, size: 10.5, weight: '700', opacity: cueOp }) +
    labelText(205, 67, '×1', { color: '#E9D5FF', size: 9.5, weight: '700' }) +
    // Unity feedback path
    `<path d="M 235,64 L 235,98 L 165,98 L 165,73 L 178,73" fill="none" stroke="${COLORS.violet}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<circle cx="235" cy="64" r="2.5" fill="${COLORS.violet}"/>` +
    labelText(200, 112, 'i_buf = 0', { color: COLORS.violet, size: 9, weight: '600', opacity: cueOp, filter: cueFilter }) +
    // Tiny zero-current cue on buffer input
    `<line x1="147" y1="50" x2="164" y2="50" stroke="${COLORS.violet}" stroke-width="1.2" stroke-dasharray="2 2" opacity="${cueOp}"/>` +

    // Stage 2: R2 -> output node -> C2 -> GND
    `<line x1="224" y1="64" x2="260" y2="64" stroke="${COLORS.wire}" stroke-width="1.7"/>` +
    `<path d="${r2D}" fill="none" stroke="${COLORS.amber}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
    labelText(283, 52, 'R₂', { color: COLORS.amber, size: 9.5 }) +
    `<line x1="306" y1="64" x2="379" y2="64" stroke="${COLORS.wire}" stroke-width="1.7"/>` +
    `<circle cx="342" cy="64" r="2.8" fill="${COLORS.emerald}"/>` +
    `<circle cx="382" cy="64" r="3" fill="${COLORS.bgHalo}" stroke="${COLORS.emerald}" stroke-width="1.8"/>` +
    labelText(382, 50, outputLabel, { color: COLORS.emerald, size: 10.5, weight: '700', filter: arrowFilter }) +
    // Stage 2 C2
    `<line x1="342" y1="64" x2="342" y2="87" stroke="${COLORS.wire}" stroke-width="1.6"/>` +
    `<rect x="330" y="87.5" width="24" height="7" fill="rgba(52,211,153,0.14)"/>` +
    `<line x1="329" y1="87" x2="355" y2="87" stroke="${COLORS.emerald}" stroke-width="2.3" stroke-linecap="round"/>` +
    `<line x1="329" y1="95" x2="355" y2="95" stroke="${COLORS.emerald}" stroke-width="2.3" stroke-linecap="round"/>` +
    `<line x1="342" y1="95" x2="342" y2="115" stroke="${COLORS.wire}" stroke-width="1.6"/>` +
    labelText(324, 94, 'C₂', { color: COLORS.emerald, size: 9.5, anchor: 'end' }) +
    groundSymbol(342, 115) +

    renderSubtitle(d.subtitle, 14, 143);

  return wrapSVG(p, `Buffered 2-stage RC cascade schematic: tau1=${tau1Val}, tau2=${tau2Val}`, body);
}

/* ==========================================================================
   6. Electromechanical DC Motor (dc-motor)
   ========================================================================== */
function renderDCMotor(d, p, isSetup) {
  const raVal = fmt(d.Ra, 'R_a');
  const laVal = fmt(d.La, '');
  const keVal = fmt(d.Ke, 'K_e');
  const ktVal = fmt(d.Kt, 'K_t');
  const jVal = fmt(d.J, 'J');
  const bVal = fmt(d.b, 'b');
  const inputLabel = fmt(d.input, 'v_a(t)');
  const outputLabel = fmt(d.output, 'θ, ω');

  const arrowFilter = isSetup ? `${p}glow-boost` : '';
  const cueFilter = isSetup ? `${p}glow-soft` : '';
  const cueOp = isSetup ? '1' : '0.8';

  const raD = hZigzagPath(78, 120, 34, 5, 5.5);
  const laD = hInductorPath(134, 174, 34, 3, 7.5);
  const laLabel =
    laVal === ''
      ? 'L_a'
      : /^L(?:_a|a)\b/i.test(laVal)
        ? laVal.replace(/^La/i, 'L_a')
        : `L_a=${laVal}`;

  const body =
    // Electrical armature loop wires
    `<g stroke="${COLORS.wire}" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M 62,59 L 62,34 L 78,34"/>` +
    `<line x1="120" y1="34" x2="134" y2="34"/>` +
    `<path d="M 174,34 L 198,34 L 198,53"/>` +
    `<path d="M 198,95 L 198,113 L 62,113 L 62,89"/>` +
    `</g>` +

    // Armature voltage source
    `<circle cx="62" cy="74" r="15" fill="url(#${p}glass-node)" stroke="${COLORS.emerald}" stroke-width="1.7"/>` +
    labelText(62, 70, '+', { color: COLORS.emerald, size: 10, weight: '700', filter: cueFilter }) +
    labelText(62, 83, '−', { color: COLORS.wire, size: 10, weight: '700', opacity: cueOp }) +
    labelText(43, 77, inputLabel, { color: COLORS.emerald, size: 9.5, weight: '700', anchor: 'end', filter: arrowFilter }) +

    // Armature Resistor R_a
    `<path d="${raD}" fill="none" stroke="${COLORS.amber}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
    labelText(99, 21, `R_a=${raVal}`, { color: COLORS.amber, size: 9.5 }) +

    // Armature Inductor L_a
    `<path d="${laD}" fill="none" stroke="${COLORS.cyan}" stroke-width="2" stroke-linecap="round"/>` +
    labelText(155, 21, laLabel, { color: COLORS.cyan, size: 9.5 }) +

    // Loop current i(t)
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<line x1="94" y1="58" x2="146" y2="58" stroke="${COLORS.amber}" stroke-width="${isSetup ? '2' : '1.7'}" marker-end="url(#${p}arrow-amber)"/>` +
    labelText(120, 72, 'i(t)', { color: COLORS.amber, size: 9.5, weight: '700' }) +
    `</g>` +

    // Rotating Violet Armature Circle + carbon brushes + back-EMF
    `<rect x="193" y="52" width="10" height="5" rx="1" fill="${COLORS.violet}"/>` +
    `<rect x="193" y="91" width="10" height="5" rx="1" fill="${COLORS.violet}"/>` +
    `<circle cx="198" cy="74" r="17" fill="url(#${p}glass-violet)" stroke="${COLORS.violet}" stroke-width="1.8"/>` +
    labelText(198, 67, '+', { color: COLORS.violet, size: 9, weight: '700', filter: cueFilter }) +
    labelText(198, 77, 'e_b', { color: '#E9D5FF', size: 9, weight: '700' }) +
    labelText(198, 87, '−', { color: COLORS.wire, size: 9, weight: '700', opacity: cueOp }) +
    labelText(130, 128, `e_b = K_e ω (K_e=${keVal})`, {
      color: COLORS.violet,
      size: 9,
      opacity: cueOp,
      filter: cueFilter,
    }) +

    // Center dashed mechanical coupling shaft
    `<line x1="215" y1="74" x2="318" y2="74" stroke="${COLORS.violet}" stroke-width="2" stroke-dasharray="5 3.5"/>` +
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    labelText(252, 55, 'τ_m = K_t i', { color: COLORS.emerald, size: 9.5, weight: '700' }) +
    `<line x1="238" y1="64" x2="266" y2="64" stroke="${COLORS.emerald}" stroke-width="1.5" marker-end="url(#${p}arrow-emerald)"/>` +
    `</g>` +
    labelText(246, 95, `K_t=${ktVal}`, { color: COLORS.violet, size: 9.5 }) +

    // Amber viscous bearing drag collar
    `<rect x="284" y="64" width="18" height="20" rx="3" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.6"/>` +
    `<line x1="293" y1="84" x2="293" y2="95" stroke="${COLORS.wall}" stroke-width="1.5"/>` +
    `<rect x="282" y="95" width="22" height="5" fill="url(#${p}hatch)"/>` +
    `<line x1="282" y1="95" x2="304" y2="95" stroke="${COLORS.wire}" stroke-width="1.3"/>` +
    labelText(293, 112, `b=${bVal}`, { color: COLORS.amber, size: 9.5 }) +

    // Right: Cyan Rotor Inertia Disk
    `<path d="M 326,42 L 338,42 A 15,32 0 0,1 338,106 L 326,106 A 15,32 0 0,1 326,42 Z" fill="url(#${p}disk-rim)" stroke="${COLORS.cyan}" stroke-width="1.6"/>` +
    `<ellipse cx="338" cy="74" rx="15" ry="32" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.8"/>` +
    `<ellipse cx="338" cy="74" rx="8.5" ry="18.5" fill="none" stroke="${COLORS.cyan}" stroke-opacity="0.34" stroke-width="1"/>` +
    `<ellipse cx="338" cy="74" rx="3.2" ry="6.5" fill="#0B1320" stroke="${COLORS.cyan}" stroke-width="1.3"/>` +
    `<rect x="338" y="71.6" width="38" height="4.8" rx="1.4" fill="url(#${p}shaft)"/>` +
    labelText(334, 122, `J=${jVal}`, { color: COLORS.cyan, size: 10, weight: '700' }) +

    // Curved Cyan output arrow (theta, omega)
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<path d="M 358,48 A 18,22 0 0,1 372,88" fill="none" stroke="${COLORS.cyan}" stroke-width="${isSetup ? '2.1' : '1.8'}" stroke-linecap="round" marker-end="url(#${p}arrow-cyan)"/>` +
    labelText(408, 35, outputLabel, { color: COLORS.cyan, size: 10.5, weight: '700', anchor: 'end' }) +
    labelText(384, 88, '+', { color: COLORS.cyan, size: 9.5, weight: '700', opacity: cueOp }) +
    `</g>` +

    renderSubtitle(d.subtitle, 14, 143);

  return wrapSVG(p, `DC motor electromechanical schematic: Ra=${raVal}, Ke=${keVal}, Kt=${ktVal}, J=${jVal}, b=${bVal}`, body);
}

/* ==========================================================================
   7. Two-Zone Thermal RC Network (thermal-2zone)
   ========================================================================== */
function renderThermal2Zone(d, p, isSetup) {
  const c1Val = fmt(d.C1, 'C₁');
  const c2Val = fmt(d.C2, 'C₂');
  const r12Val = fmt(d.R12, 'R₁₂');
  const raVal = fmt(d.Ra, 'R_a');
  const inputLabel = fmt(d.input, 'q(t)');
  const t1Label = fmt(d.t1, 'T₁');
  const t2Label = fmt(d.t2, 'T₂');

  const arrowFilter = isSetup ? `${p}glow-boost` : '';
  const cueFilter = isSetup ? `${p}glow-soft` : '';
  const cueOp = isSetup ? '1' : '0.8';

  const r12D = hZigzagPath(166, 214, 74, 5, 6.5);
  const raD = hZigzagPath(322, 368, 74, 5, 6.5);

  const body =
    // Left Emerald Heat Flux Arrow q(t) ->
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<line x1="14" y1="74" x2="68" y2="74" stroke="${COLORS.emerald}" stroke-width="${isSetup ? '2.4' : '2'}" marker-end="url(#${p}arrow-emerald)"/>` +
    labelText(40, 61, `${inputLabel} →`, { color: COLORS.emerald, size: 10.5, weight: '700' }) +
    labelText(40, 88, '+', { color: COLORS.emerald, size: 9.5, weight: '700', opacity: cueOp }) +
    `</g>` +

    // Zone 1: Cyan Thermal Block
    `<rect x="74" y="42" width="78" height="64" rx="9" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.8"/>` +
    `<line x1="82" y1="43.3" x2="144" y2="43.3" stroke="rgba(255,255,255,0.24)" stroke-width="1"/>` +
    labelText(113, 56, 'ZONE 1', { color: COLORS.cyan, size: 7.5, opacity: '0.68', letterSpacing: '1.1' }) +
    labelText(113, 76, t1Label, { color: COLORS.text, size: 12, weight: '700', filter: cueFilter }) +
    labelText(113, 95, `C₁=${c1Val}`, { color: COLORS.cyan, size: 10 }) +

    // Horizontal Amber Thermal Resistor R12 + q12 arrow
    `<line x1="152" y1="74" x2="166" y2="74" stroke="${COLORS.wire}" stroke-width="1.7"/>` +
    `<path d="${r12D}" fill="none" stroke="${COLORS.amber}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<line x1="214" y1="74" x2="230" y2="74" stroke="${COLORS.wire}" stroke-width="1.7"/>` +
    labelText(191, 56, `R₁₂=${r12Val}`, { color: COLORS.amber, size: 9.5 }) +
    `<g opacity="${cueOp}"${cueFilter ? ` filter="url(#${cueFilter})"` : ''}>` +
    `<line x1="172" y1="95" x2="208" y2="95" stroke="${COLORS.amber}" stroke-width="1.6" marker-end="url(#${p}arrow-amber)"/>` +
    labelText(191, 111, 'q₁₂', { color: COLORS.amber, size: 9.5 }) +
    `</g>` +

    // Zone 2: Violet Payload Thermal Block
    `<rect x="230" y="42" width="78" height="64" rx="9" fill="url(#${p}glass-violet)" stroke="${COLORS.violet}" stroke-width="1.8"/>` +
    `<line x1="238" y1="43.3" x2="300" y2="43.3" stroke="rgba(255,255,255,0.24)" stroke-width="1"/>` +
    labelText(269, 56, 'ZONE 2', { color: COLORS.violet, size: 7.5, opacity: '0.72', letterSpacing: '1.1' }) +
    labelText(269, 76, t2Label, { color: COLORS.text, size: 12, weight: '700', filter: cueFilter }) +
    labelText(269, 95, `C₂=${c2Val}`, { color: COLORS.violet, size: 10 }) +

    // Right Amber Ambient Resistor R_a + q_a arrow
    `<line x1="308" y1="74" x2="322" y2="74" stroke="${COLORS.wire}" stroke-width="1.7"/>` +
    `<path d="${raD}" fill="none" stroke="${COLORS.amber}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<line x1="368" y1="74" x2="384" y2="74" stroke="${COLORS.wire}" stroke-width="1.7"/>` +
    labelText(345, 56, `R_a=${raVal}`, { color: COLORS.amber, size: 9.5 }) +
    `<g opacity="${cueOp}"${cueFilter ? ` filter="url(#${cueFilter})"` : ''}>` +
    `<line x1="327" y1="95" x2="362" y2="95" stroke="${COLORS.amber}" stroke-width="1.6" marker-end="url(#${p}arrow-amber)"/>` +
    labelText(345, 111, 'q_a', { color: COLORS.amber, size: 9.5 }) +
    `</g>` +

    // Right hatched ambient thermal sink
    `<rect x="384" y="38" width="12" height="72" fill="url(#${p}hatch)"/>` +
    `<line x1="384" y1="36" x2="384" y2="112" stroke="${COLORS.wire}" stroke-width="2" stroke-linecap="round"/>` +
    labelText(408, 26, 'T_amb = 0', { color: COLORS.muted, size: 9, anchor: 'end' }) +

    renderSubtitle(d.subtitle, 14, 143);

  return wrapSVG(p, `Two-zone thermal network schematic: C1=${c1Val}, C2=${c2Val}, R12=${r12Val}, Ra=${raVal}`, body);
}

/* ==========================================================================
   8. Unity-Feedback Control Block Diagram (feedback-pd)
   ========================================================================== */
function renderFeedbackPD(d, p, isSetup) {
  const controllerVal = fmt(d.controller, 'K_p + K_d s');
  const plantVal = fmt(d.plant, 'G(s)');
  const inputLabel = fmt(d.input, 'R(s)');
  const outputLabel = fmt(d.output, 'Y(s)');
  const specTag = fmt(d.specTag, '');

  const arrowFilter = isSetup ? `${p}glow-boost` : '';
  const cueFilter = isSetup ? `${p}glow-soft` : '';
  const cueOp = isSetup ? '1' : '0.82';

  const ctrlSize = fitFontSize(controllerVal, 80, 10, 7.5);
  const plantSize = fitFontSize(plantVal, 80, 10, 7.5);

  let specBadge = '';
  if (specTag) {
    const badgeSize = 8.8;
    const w = Math.min(206, Math.max(66, Math.round(specTag.length * badgeSize * 0.62 + 16)));
    const x = 408 - w;
    specBadge =
      `<g>` +
      `<rect x="${x}" y="10" width="${w}" height="17" rx="8.5" fill="rgba(167,139,250,0.14)" stroke="${COLORS.violet}" stroke-opacity="0.55" stroke-width="0.95"/>` +
      `<text x="${x + w / 2}" y="21.5" text-anchor="middle" fill="#DDD6FE" font-family='${FONT_MONO}' font-size="${badgeSize}" font-weight="600">${esc(specTag)}</text>` +
      `</g>`;
  }

  const body =
    // Optional top-left subtitle & top-right Violet specTag
    renderSubtitle(d.subtitle, 14, 21) +
    specBadge +

    // Input arrow R(s) -> Summing Junction
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<line x1="14" y1="68" x2="62" y2="68" stroke="${COLORS.emerald}" stroke-width="${isSetup ? '2.15' : '1.85'}" marker-end="url(#${p}arrow-emerald)"/>` +
    labelText(37, 56, inputLabel, { color: COLORS.emerald, size: 10.5, weight: '700' }) +
    `</g>` +

    // Summing Junction Sigma
    `<circle cx="76" cy="68" r="12" fill="url(#${p}glass-node)" stroke="${COLORS.wire}" stroke-width="1.65"/>` +
    labelText(76, 72, 'Σ', { color: COLORS.text, size: 12, weight: '700' }) +
    labelText(58, 61, '+', { color: COLORS.emerald, size: 10.5, weight: '700', filter: cueFilter }) +
    labelText(65, 91, '−', { color: COLORS.amber, size: 11.5, weight: '700', filter: cueFilter }) +

    // Error arrow E(s) -> Controller
    `<g${cueFilter ? ` filter="url(#${cueFilter})"` : ''}>` +
    `<line x1="88" y1="68" x2="127" y2="68" stroke="${COLORS.violet}" stroke-width="1.75" marker-end="url(#${p}arrow-violet)"/>` +
    labelText(107, 56, 'E(s)', { color: COLORS.violet, size: 9.5, weight: '700', opacity: cueOp }) +
    `</g>` +

    // Amber Controller Box C(s)
    `<rect x="131" y="46" width="88" height="44" rx="8" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.75"/>` +
    `<line x1="138" y1="47.3" x2="212" y2="47.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.95"/>` +
    labelText(175, 59, 'C(s)', { color: COLORS.amber, size: 8.5, opacity: '0.88' }) +
    labelText(175, 77, controllerVal, { color: COLORS.text, size: ctrlSize, weight: '700' }) +

    // Control signal U(s) -> Plant
    `<line x1="219" y1="68" x2="255" y2="68" stroke="${COLORS.amber}" stroke-width="1.75" marker-end="url(#${p}arrow-amber)"/>` +
    labelText(237, 56, 'U(s)', { color: COLORS.amber, size: 9.5, weight: '600', opacity: cueOp }) +

    // Cyan Plant Box G(s)
    `<rect x="259" y="46" width="88" height="44" rx="8" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.75"/>` +
    `<line x1="266" y1="47.3" x2="340" y2="47.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.95"/>` +
    labelText(303, 59, 'G(s)', { color: COLORS.cyan, size: 8.5, opacity: '0.88' }) +
    labelText(303, 77, plantVal, { color: COLORS.text, size: plantSize, weight: '700' }) +

    // Output arrow Y(s)
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<line x1="347" y1="68" x2="404" y2="68" stroke="${COLORS.emerald}" stroke-width="${isSetup ? '2.15' : '1.85'}" marker-end="url(#${p}arrow-emerald)"/>` +
    labelText(387, 56, outputLabel, { color: COLORS.emerald, size: 10.5, weight: '700' }) +
    `</g>` +
    `<circle cx="368" cy="68" r="2.8" fill="${COLORS.emerald}"/>` +

    // Negative unity feedback return path
    `<path d="M 368,68 L 368,116 Q 368,120 364,120 L 80,120 Q 76,120 76,116 L 76,82" fill="none" stroke="${COLORS.wire}" stroke-width="1.65" stroke-linejoin="round" marker-end="url(#${p}arrow-amber)"/>` +
    labelText(222, 134, 'Unity Feedback (H = 1)', { color: COLORS.wall, size: 8.5, weight: '500' });

  return wrapSVG(p, `Unity-feedback block diagram: C(s)=${controllerVal}, G(s)=${plantVal}`, body);
}

/* ==========================================================================
   9. Complex s-Plane Pole-Zero Map (pole-zero)
   ========================================================================== */
function resolveSymbolicAccent(accent, idx, p) {
  const palette = ['cyan', 'emerald', 'violet', 'amber'];
  const key = typeof accent === 'string' && accent.trim() ? accent.trim().toLowerCase() : palette[idx % palette.length];
  if (key === 'cyan') return { color: COLORS.cyan, fill: `url(#${p}glass-cyan)` };
  if (key === 'emerald' || key === 'green') return { color: COLORS.emerald, fill: `url(#${p}glass-emerald)` };
  if (key === 'violet' || key === 'purple') return { color: COLORS.violet, fill: `url(#${p}glass-violet)` };
  if (key === 'amber' || key === 'orange') return { color: COLORS.amber, fill: `url(#${p}glass-amber)` };
  if (key === 'rose' || key === 'coral' || key === 'red') return { color: COLORS.rose, fill: `url(#${p}glass-node)` };
  if (/^#[0-9a-f]{3,8}$/i.test(key)) return { color: accent.trim(), fill: `url(#${p}glass-node)` };
  return { color: COLORS.cyan, fill: `url(#${p}glass-cyan)` };
}

function renderPoleZeroSymbolic(d, p, stepIdx) {
  const revealZerosStep = typeof d.revealZerosStep === 'number' ? d.revealZerosStep : 1;
  const revealPolesStep = typeof d.revealPolesStep === 'number' ? d.revealPolesStep : 1;
  const revealStep = typeof d.revealStep === 'number' ? d.revealStep : Math.min(revealZerosStep, revealPolesStep);
  const revealed = stepIdx >= revealStep;

  let body = '';

  if (!revealed) {
    const hint = fmt(d.setupHint, 'L(s) = N_L / D_L → S(s), T(s)');
    const hintSize = fitFontSize(hint, 294, 10.5, 7.8);
    const subHint = fmt(d.setupSubHint, 'Map loop numerator N_L & denominator D_L to closed-loop S(s), T(s)');
    const subSize = fitFontSize(subHint, 294, 8.2, 6.8);

    body =
      `<rect x="26" y="16" width="368" height="110" rx="7" fill="rgba(7,11,20,0.68)" stroke="rgba(148,163,184,0.2)" stroke-width="0.9"/>` +
      `<rect x="48" y="34" width="324" height="62" rx="9" fill="url(#${p}glass-node)" stroke="${COLORS.cyan}" stroke-opacity="0.5" stroke-width="1.2"/>` +
      `<line x1="56" y1="35.3" x2="364" y2="35.3" stroke="rgba(255,255,255,0.2)" stroke-width="0.9"/>` +
      labelText(210, 48, 'SYMBOLIC LOOP ARCHITECTURE', {
        color: COLORS.cyan,
        size: 7.5,
        weight: '600',
        opacity: '0.78',
        letterSpacing: '1.1',
      }) +
      labelText(210, 68, hint, { color: COLORS.text, size: hintSize, weight: '700' }) +
      labelText(210, 84, subHint, { color: COLORS.muted, size: subSize, weight: '500' }) +
      labelText(
        210,
        113,
        `<tspan fill="${COLORS.emerald}">○ N_L Zeros</tspan>` +
          `<tspan fill="${COLORS.muted}">  ·  </tspan>` +
          `<tspan fill="${COLORS.cyan}">× D_L Poles</tspan>` +
          `<tspan fill="${COLORS.muted}">  ·  </tspan>` +
          `<tspan fill="${COLORS.violet}">S(s) + T(s) = 1</tspan>`,
        { size: 8, weight: '600', raw: true }
      ) +
      renderSubtitle(d.subtitle, 14, 143);

    return wrapSVG(p, d.subtitle ? `${d.subtitle} (symbolic setup)` : 'Symbolic loop pole-zero architecture (setup)', body);
  }

  const rawBadges =
    Array.isArray(d.symbolicBadges) && d.symbolicBadges.length > 0
      ? d.symbolicBadges
      : [
          { title: 'Sensitivity S(s)', expr: 'D_L / (D_L + N_L)', accent: 'cyan' },
          { title: 'Complementary T(s)', expr: 'N_L / (D_L + N_L)', accent: 'emerald' },
        ];

  const n = rawBadges.length;
  const gap = n > 2 ? 8 : 12;
  const totalW = 376;
  const startX = 22;
  const cardW = (totalW - gap * (n - 1)) / n;
  const cardY = 34;
  const cardH = 82;

  const cards = rawBadges
    .map((item, idx) => {
      const isObj = item && typeof item === 'object';
      const title = isObj ? fmt(item.title ?? item.label ?? item.name ?? item.tag, '') : '';
      const expr = isObj ? fmt(item.expr ?? item.formula ?? item.value ?? item.text, '') : fmt(item, '');
      const sub = isObj ? fmt(item.sub ?? item.note ?? item.hint, '') : '';
      const accent = resolveSymbolicAccent(isObj ? item.accent ?? item.color : '', idx, p);

      const x = Math.round((startX + idx * (cardW + gap)) * 10) / 10;
      const cx = Math.round((x + cardW / 2) * 10) / 10;
      const innerW = Math.max(48, cardW - 16);

      let textNodes = '';
      if (title && expr && sub) {
        textNodes =
          labelText(cx, cardY + 19, title, {
            color: accent.color,
            size: fitFontSize(title, innerW, 8.2, 6.8),
            weight: '600',
            opacity: '0.9',
          }) +
          labelText(cx, cardY + 46, expr, {
            color: COLORS.text,
            size: fitFontSize(expr, innerW, 11, 7.5),
            weight: '700',
          }) +
          labelText(cx, cardY + 67, sub, {
            color: accent.color,
            size: fitFontSize(sub, innerW, 7.8, 6.5),
            weight: '500',
            opacity: '0.86',
          });
      } else if (title && expr) {
        textNodes =
          labelText(cx, cardY + 25, title, {
            color: accent.color,
            size: fitFontSize(title, innerW, 8.6, 7),
            weight: '600',
            opacity: '0.9',
          }) +
          labelText(cx, cardY + 55, expr, {
            color: COLORS.text,
            size: fitFontSize(expr, innerW, 11.5, 7.5),
            weight: '700',
          });
      } else {
        const display = expr || title;
        textNodes = labelText(cx, cardY + 45, display, {
          color: COLORS.text,
          size: fitFontSize(display, innerW, 10.5, 7.5),
          weight: '700',
        });
      }

      return (
        `<g>` +
        `<rect x="${x}" y="${cardY}" width="${cardW.toFixed(1)}" height="${cardH}" rx="9" fill="${accent.fill}" stroke="${accent.color}" stroke-opacity="0.78" stroke-width="1.45"/>` +
        `<line x1="${(x + 8).toFixed(1)}" y1="${cardY + 1.3}" x2="${(x + cardW - 8).toFixed(1)}" y2="${cardY + 1.3}" stroke="rgba(255,255,255,0.22)" stroke-width="0.95"/>` +
        textNodes +
        `</g>`
      );
    })
    .join('');

  const topBadge = d.summaryBadge
    ? pillBadge(210, 16, d.summaryBadge, COLORS.violet, {
        size: fitFontSize(d.summaryBadge, 340, 8.4, 7.2),
        padX: 9,
        h: 16,
        bg: 'rgba(7,11,20,0.92)',
        textColor: '#EDE9FE',
      })
    : '';

  body = topBadge + cards + renderSubtitle(d.subtitle, 14, 143);

  return wrapSVG(p, d.subtitle ? `Symbolic loop map: ${d.subtitle}` : 'Symbolic loop pole-zero map', body);
}

function renderPoleZeroMap(d, p, isSetup, activeStepIndex) {
  const stepIdx = typeof activeStepIndex === 'number' ? activeStepIndex : isSetup ? 0 : 1;

  if (d.mode === 'symbolic') {
    return renderPoleZeroSymbolic(d, p, stepIdx);
  }

  const b = d.bounds && typeof d.bounds === 'object' ? d.bounds : {};
  const minRe = typeof b.minRe === 'number' && Number.isFinite(b.minRe) ? b.minRe : -6;
  const maxRe = typeof b.maxRe === 'number' && Number.isFinite(b.maxRe) ? b.maxRe : 3;
  const minIm = typeof b.minIm === 'number' && Number.isFinite(b.minIm) ? b.minIm : -4;
  const maxIm = typeof b.maxIm === 'number' && Number.isFinite(b.maxIm) ? b.maxIm : 4;
  const reSpan = maxRe > minRe ? maxRe - minRe : 1;
  const imSpan = maxIm > minIm ? maxIm - minIm : 1;

  const plotX = 26;
  const plotY = 16;
  const plotW = 368;
  const plotH = 110;

  const clamp = (val, lo, hi) => Math.max(lo, Math.min(hi, val));
  const rawMapX = (re) => plotX + ((re - minRe) / reSpan) * plotW;
  const rawMapY = (im) => plotY + (1 - (im - minIm) / imSpan) * plotH;
  const mapX = (re) => Math.round(clamp(rawMapX(re), plotX + 10, plotX + plotW - 10) * 10) / 10;
  const mapY = (im) => Math.round(clamp(rawMapY(im), plotY + 10, plotY + plotH - 10) * 10) / 10;

  const revealZerosStep = typeof d.revealZerosStep === 'number' ? d.revealZerosStep : 1;
  const revealPolesStep = typeof d.revealPolesStep === 'number' ? d.revealPolesStep : 1;
  const showZeros = stepIdx >= revealZerosStep;
  const showPoles = stepIdx >= revealPolesStep;

  const poles = Array.isArray(d.poles) ? d.poles : [];
  const zeros = Array.isArray(d.zeros) ? d.zeros : [];
  const hasTarget = Boolean(d.target && typeof d.target === 'object');

  const isCoincidentWith = (item, list) => {
    const r1 = Number(item.re ?? 0);
    const i1 = Number(item.im ?? 0);
    return list.some((other) => Math.hypot(r1 - Number(other.re ?? 0), i1 - Number(other.im ?? 0)) < 1e-3);
  };

  // Clip path for RHP fill inside rounded plot frame
  let body =
    `<clipPath id="${p}pz-clip"><rect x="${plotX}" y="${plotY}" width="${plotW}" height="${plotH}" rx="7"/></clipPath>` +
    `<rect x="${plotX}" y="${plotY}" width="${plotW}" height="${plotH}" rx="7" fill="rgba(7,11,20,0.68)"/>`;

  const hasXZero = minRe <= 0 && maxRe >= 0;
  const hasYZero = minIm <= 0 && maxIm >= 0;
  const xZero = clamp(rawMapX(0), plotX + 4, plotX + plotW - 4);
  const yZero = clamp(rawMapY(0), plotY + 4, plotY + plotH - 4);

  // Shaded RHP unstable zone & LHP/RHP region micro-labels
  if (maxRe > 0) {
    const rhpStart = clamp(rawMapX(0), plotX, plotX + plotW);
    const rhpW = plotX + plotW - rhpStart;
    if (rhpW > 1) {
      body += `<rect x="${rhpStart.toFixed(1)}" y="${plotY}" width="${rhpW.toFixed(1)}" height="${plotH}" fill="rgba(244,63,94,0.11)" clip-path="url(#${p}pz-clip)"/>`;
    }
    if (rhpW >= 54) {
      body += labelText(plotX + plotW - 6, plotY + 11, 'RHP (σ>0)', {
        color: COLORS.rose,
        size: 7.5,
        weight: '600',
        anchor: 'end',
        opacity: '0.88',
      });
    } else if (rhpW >= 24) {
      body += labelText(plotX + plotW - 5, plotY + 11, 'RHP', {
        color: COLORS.rose,
        size: 7.5,
        weight: '600',
        anchor: 'end',
        opacity: '0.88',
      });
    }
    if (minRe < 0 && rhpStart - plotX >= 56) {
      body += labelText(plotX + 7, plotY + 11, 'LHP (σ<0)', {
        color: '#6EE7B7',
        size: 7.5,
        weight: '600',
        anchor: 'start',
        opacity: '0.65',
      });
    }
  } else if (minRe < 0) {
    body += labelText(plotX + 7, plotY + 11, 'LHP (σ<0)', {
      color: '#6EE7B7',
      size: 7.5,
      weight: '600',
      anchor: 'start',
      opacity: '0.65',
    });
  }

  // Real axis (sigma) & clean integer reference ticks
  if (hasYZero) {
    body += `<line x1="${plotX + 4}" y1="${yZero.toFixed(1)}" x2="${plotX + plotW - 4}" y2="${yZero.toFixed(1)}" stroke="${COLORS.wire}" stroke-opacity="0.58" stroke-width="1.2" marker-end="url(#${p}arrow-slate)"/>`;
    const sigmaY = yZero - 6 < plotY + 18 ? yZero + 11 : yZero - 6;
    body += labelText(plotX + plotW - 6, sigmaY.toFixed(1), 'σ', {
      color: COLORS.muted,
      size: 9,
      weight: '600',
      anchor: 'end',
    });

    // Track real-axis marker positions so tick numerals never clutter or collide
    const realMarkerXs = [];
    if (showPoles) {
      for (const pl of poles) {
        if (Math.abs(Number(pl.im ?? 0)) <= 0.6) realMarkerXs.push(mapX(Number(pl.re ?? 0)));
      }
    }
    if (showZeros) {
      for (const z of zeros) {
        if (Math.abs(Number(z.im ?? 0)) <= 0.6) realMarkerXs.push(mapX(Number(z.re ?? 0)));
      }
    }
    if (hasTarget && Math.abs(Number(d.target.im ?? 0)) <= 0.6) {
      realMarkerXs.push(mapX(Number(d.target.re ?? 0)));
    }

    const tickStep = reSpan <= 6 ? 1 : reSpan <= 14 ? 2 : reSpan <= 28 ? 5 : 10;
    const firstTick = Math.ceil(minRe / tickStep) * tickStep;
    const lastTick = Math.floor(maxRe / tickStep) * tickStep;
    const tickLabelY = yZero + 10.5 > plotY + plotH - 4 ? yZero - 5.5 : yZero + 10.5;

    for (let t = firstTick; t <= lastTick; t += tickStep) {
      const tx = rawMapX(t);
      if (tx < plotX + 14 || tx > plotX + plotW - 18) continue;
      body += `<line x1="${tx.toFixed(1)}" y1="${(yZero - 2.5).toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(yZero + 2.5).toFixed(1)}" stroke="rgba(148,163,184,0.34)" stroke-width="0.9"/>`;

      const collides = realMarkerXs.some((mx) => Math.abs(tx - mx) < 16);
      if (collides) continue;

      if (t === 0) {
        body += labelText((tx - 4.5).toFixed(1), tickLabelY.toFixed(1), '0', {
          color: COLORS.muted,
          size: 7,
          weight: '500',
          anchor: 'end',
          opacity: '0.52',
        });
      } else {
        body += labelText(tx.toFixed(1), tickLabelY.toFixed(1), String(t), {
          color: COLORS.muted,
          size: 7,
          weight: '500',
          anchor: 'middle',
          opacity: '0.46',
        });
      }
    }
  }

  // Imaginary axis (j*omega) & subtle tick marks
  if (hasXZero) {
    body += `<line x1="${xZero.toFixed(1)}" y1="${plotY + plotH - 3}" x2="${xZero.toFixed(1)}" y2="${plotY + 4}" stroke="${COLORS.amber}" stroke-opacity="0.55" stroke-width="1.25" stroke-dasharray="3.5 2.5" marker-end="url(#${p}arrow-amber)"/>`;
    const jwOnLeft = xZero > plotX + plotW - 76;
    const jwX = jwOnLeft ? xZero - 6 : xZero + 6;
    const jwAnchor = jwOnLeft ? 'end' : 'start';
    body += labelText(jwX.toFixed(1), plotY + 11, 'jω', {
      color: COLORS.amber,
      size: 8.5,
      weight: '600',
      anchor: jwAnchor,
      opacity: '0.88',
    });

    const imStep = imSpan <= 6 ? 1 : imSpan <= 14 ? 2 : 5;
    const firstIm = Math.ceil(minIm / imStep) * imStep;
    const lastIm = Math.floor(maxIm / imStep) * imStep;
    for (let imTick = firstIm; imTick <= lastIm; imTick += imStep) {
      if (imTick === 0) continue;
      const ty = rawMapY(imTick);
      if (ty < plotY + 14 || ty > plotY + plotH - 10) continue;
      body += `<line x1="${(xZero - 2.2).toFixed(1)}" y1="${ty.toFixed(1)}" x2="${(xZero + 2.2).toFixed(1)}" y2="${ty.toFixed(1)}" stroke="rgba(245,158,11,0.34)" stroke-width="0.9"/>`;
    }
  }

  // Crisp outer plot border
  body += `<rect x="${plotX}" y="${plotY}" width="${plotW}" height="${plotH}" rx="7" fill="none" stroke="rgba(148,163,184,0.22)" stroke-width="0.9"/>`;

  // Smart non-overlapping marker label placement helper
  const placeMarkerLabel = (mx, my, im, kind, text, color, explicitPos) => {
    const labelStr = fmt(text, '');
    if (!labelStr) return '';
    const fontSize = 8.4;

    let pos = explicitPos;
    if (!pos) {
      if (im > 1e-6) {
        pos = my - 10 < plotY + 14 ? (mx > plotX + plotW - 74 ? 'left' : 'right') : 'above';
      } else if (im < -1e-6) {
        pos = my + 14 > plotY + plotH - 3 ? (mx > plotX + plotW - 74 ? 'left' : 'right') : 'below';
      } else if (kind === 'zero') {
        pos = 'above';
      } else if (kind === 'target') {
        pos = my - 10 < plotY + 14 ? 'below' : 'above';
      } else {
        pos = 'below';
      }
    }

    let lx = mx;
    let ly = my;
    let anchor = 'middle';

    if (pos === 'above') {
      ly = Math.max(plotY + 10, my - 10);
    } else if (pos === 'below') {
      const dy = kind === 'pole' && Math.abs(im) <= 1e-6 ? 15 : 14;
      ly = Math.min(plotY + plotH - 4, my + dy);
    } else if (pos === 'left') {
      lx = mx - 9;
      ly = clamp(my + 3, plotY + 10, plotY + plotH - 4);
      anchor = 'end';
    } else if (pos === 'right') {
      lx = mx + 9;
      ly = clamp(my + 3, plotY + 10, plotY + plotH - 4);
      anchor = 'start';
    }

    const estW = labelStr.length * fontSize * 0.62;
    const minEdge = plotX + 6;
    const maxEdge = plotX + plotW - 6;

    if (anchor === 'middle') {
      if (lx - estW / 2 < minEdge) {
        lx = Math.max(minEdge, mx - 5);
        anchor = 'start';
      } else if (lx + estW / 2 > maxEdge) {
        lx = Math.min(maxEdge, mx + 5);
        anchor = 'end';
      }
    } else if (anchor === 'start' && lx + estW > maxEdge) {
      lx = Math.min(maxEdge, mx - 9);
      anchor = 'end';
    } else if (anchor === 'end' && lx - estW < minEdge) {
      lx = Math.max(minEdge, mx + 9);
      anchor = 'start';
    }

    return labelText(lx.toFixed(1), ly.toFixed(1), labelStr, {
      color,
      size: fontSize,
      weight: '600',
      anchor,
    });
  };

  // Progressive zero-spoiler rendering
  if (!showZeros && !showPoles) {
    const hint = fmt(d.setupHint, 'Find Zeros N(s)=0 (○) & Poles D(s)=0 (×)');
    const hintSize = fitFontSize(hint, 286, 9.2, 7.2);
    body +=
      `<g>` +
      `<rect x="58" y="51" width="304" height="42" rx="9" fill="rgba(7,11,20,0.88)" stroke="rgba(34,211,238,0.44)" stroke-width="1"/>` +
      `<line x1="66" y1="52.2" x2="354" y2="52.2" stroke="rgba(255,255,255,0.16)" stroke-width="0.8"/>` +
      labelText(210, 66.5, hint, { color: '#E0F2FE', size: hintSize, weight: '600' }) +
      labelText(
        210,
        82.5,
        `<tspan fill="${COLORS.emerald}">○ Zero</tspan>` +
          `<tspan fill="${COLORS.muted}">  ·  </tspan>` +
          `<tspan fill="${COLORS.cyan}">× LHP Pole</tspan>` +
          `<tspan fill="${COLORS.muted}">  ·  </tspan>` +
          `<tspan fill="${COLORS.rose}">×/○ RHP Trap</tspan>`,
        { size: 7.8, weight: '600', raw: true }
      ) +
      `</g>`;
  } else {
    // Draw Zeros first (so coincident pole x draws crisply inside larger dashed zero ring)
    if (showZeros) {
      for (const z of zeros) {
        const re = Number(z.re ?? 0);
        const im = Number(z.im ?? 0);
        const zx = mapX(re);
        const zy = mapY(im);
        const isRHP = re > 1e-6;
        const coincident = showPoles && isCoincidentWith(z, poles);
        const r = coincident ? 6.5 : 5.2;
        const ringColor = isRHP ? (coincident ? COLORS.amber : COLORS.rose) : COLORS.emerald;
        const dashAttr = coincident ? ' stroke-dasharray="3.2 1.8"' : '';

        body += `<circle cx="${zx}" cy="${zy}" r="${r}" fill="#070B14" stroke="${ringColor}" stroke-width="2"${dashAttr} filter="url(#${p}glow-soft)"/>`;
        if (isRHP && !coincident) {
          body += `<circle cx="${zx}" cy="${zy}" r="2.9" fill="none" stroke="${COLORS.amber}" stroke-width="1.05"/>`;
        }
        if (z.mult && Number(z.mult) > 1) {
          body += labelText((zx + r + 2).toFixed(1), (zy - 4).toFixed(1), `×${z.mult}`, {
            color: isRHP ? COLORS.amber : COLORS.emerald,
            size: 7.5,
            weight: '700',
            anchor: 'start',
          });
        }
        if (z.label) {
          body += placeMarkerLabel(zx, zy, im, 'zero', z.label, isRHP ? COLORS.amber : COLORS.emerald, z.labelPos);
        }
      }
    }

    // Draw Poles on top
    if (showPoles) {
      for (const pl of poles) {
        const re = Number(pl.re ?? 0);
        const im = Number(pl.im ?? 0);
        const px = mapX(re);
        const py = mapY(im);
        const color = re > 1e-6 ? COLORS.rose : Math.abs(re) <= 1e-6 ? COLORS.amber : COLORS.cyan;
        const coincident = showZeros && isCoincidentWith(pl, zeros);
        const arm = coincident ? 3.8 : 4.5;

        body +=
          `<g stroke="${color}" stroke-width="2.1" stroke-linecap="round" filter="url(#${p}glow-soft)">` +
          `<line x1="${(px - arm).toFixed(1)}" y1="${(py - arm).toFixed(1)}" x2="${(px + arm).toFixed(1)}" y2="${(py + arm).toFixed(1)}"/>` +
          `<line x1="${(px - arm).toFixed(1)}" y1="${(py + arm).toFixed(1)}" x2="${(px + arm).toFixed(1)}" y2="${(py - arm).toFixed(1)}"/>` +
          `</g>`;

        if (pl.mult && Number(pl.mult) > 1) {
          body += labelText((px + 6.5).toFixed(1), (py - 4.5).toFixed(1), `×${pl.mult}`, {
            color,
            size: 7.5,
            weight: '700',
            anchor: 'start',
          });
        }
        if (pl.label) {
          body += placeMarkerLabel(px, py, im, 'pole', pl.label, color, pl.labelPos);
        }
      }
    }
  }

  // Optional desired CL pole target marker (Violet diamond — always visible, including Step 0)
  if (hasTarget) {
    const tre = Number(d.target.re ?? 0);
    const tim = Number(d.target.im ?? 0);
    const tx = mapX(tre);
    const ty = mapY(tim);
    const dr = 5.5;
    body +=
      `<polygon points="${tx},${(ty - dr).toFixed(1)} ${(tx + dr).toFixed(1)},${ty} ${tx},${(ty + dr).toFixed(1)} ${(tx - dr).toFixed(1)},${ty}" ` +
      `fill="rgba(167,139,250,0.22)" stroke="${COLORS.violet}" stroke-width="1.8" stroke-linejoin="round" filter="url(#${p}glow-boost)"/>` +
      `<circle cx="${tx}" cy="${ty}" r="1.4" fill="#EDE9FE"/>` +
      placeMarkerLabel(tx, ty, tim, 'target', fmt(d.target.label, 's_d'), '#DDD6FE', d.target.labelPos);
  }

  // Top progress / summary pills (placed at y=11 so they never collide with LHP/RHP micro-labels at y=27)
  if (showZeros && !showPoles) {
    body += pillBadge(210, 11, 'Zeros ○ locked · Solve D(s)=0 for Poles ×', COLORS.emerald, {
      size: 7.8,
      padX: 8,
      h: 15,
      bg: 'rgba(7,11,20,0.92)',
      textColor: '#A7F3D0',
    });
  } else if (!showZeros && showPoles) {
    body += pillBadge(210, 11, 'Poles × locked · Solve N(s)=0 for Zeros ○', COLORS.cyan, {
      size: 7.8,
      padX: 8,
      h: 15,
      bg: 'rgba(7,11,20,0.92)',
      textColor: '#A5F3FC',
    });
  } else if (showPoles && showZeros && d.summaryBadge) {
    body += pillBadge(210, 11, d.summaryBadge, COLORS.cyan, {
      size: fitFontSize(d.summaryBadge, 336, 8.4, 7.2),
      padX: 9,
      h: 15.5,
      bg: 'rgba(7,11,20,0.92)',
      textColor: '#E0F2FE',
    });
  }

  body += renderSubtitle(d.subtitle, 14, 143);

  const ariaLabel =
    !showZeros && !showPoles
      ? d.subtitle
        ? `${d.subtitle} (s-plane setup)`
        : 'Complex s-plane pole-zero map (setup)'
      : d.subtitle
        ? `Complex s-plane pole-zero map: ${d.subtitle}`
        : 'Complex s-plane pole-zero map';

  return wrapSVG(p, ariaLabel, body);
}

/* ==========================================================================
   10. State-Space Control & Observer Loops (state-space-loop)
   ========================================================================== */
function renderStateSpaceLoop(d, p, isSetup, _activeStepIndex) {
  const variant = String(d.variant || 'lqr').trim().toLowerCase();
  const arrowFilter = isSetup ? `${p}glow-boost` : '';
  const cueFilter = isSetup ? `${p}glow-soft` : '';
  const cueOp = isSetup ? '1' : '0.84';

  const aVal = fmt(d.A, 'A');
  const bVal = fmt(d.B, 'B');
  const cVal = fmt(d.C, 'C');

  if (variant === 'pbh') {
    const aSize = fitFontSize(aVal, 40, 11, 7.2);
    const bSize = fitFontSize(bVal, 38, 11, 7.2);
    const cSize = fitFontSize(cVal, 38, 11, 7.2);

    const body =
      labelText(14, 17, 'STATE-SPACE REALIZATION', {
        color: COLORS.cyan,
        size: 7.4,
        weight: '700',
        anchor: 'start',
        opacity: '0.84',
        letterSpacing: '0.8',
      }) +
      pillBadge(362, 16, '(A, B, C, D)', COLORS.violet, {
        size: 8.2,
        padX: 8,
        h: 15,
        bg: 'rgba(167,139,250,0.14)',
        textColor: '#DDD6FE',
      }) +

      // Input u(t) -> [B]
      `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
      `<line x1="14" y1="58" x2="60" y2="58" stroke="${COLORS.emerald}" stroke-width="${isSetup ? '2.15' : '1.85'}" marker-end="url(#${p}arrow-emerald)"/>` +
      labelText(34, 47, 'u(t)', { color: COLORS.emerald, size: 10, weight: '700' }) +
      `</g>` +

      // Input Matrix [B]
      `<rect x="64" y="42" width="46" height="32" rx="7" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.7"/>` +
      `<line x1="70" y1="43.3" x2="104" y2="43.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>` +
      labelText(87, 62, bVal, { color: COLORS.text, size: bSize, weight: '700' }) +

      // [B] -> Sigma
      `<line x1="110" y1="58" x2="135" y2="58" stroke="${COLORS.amber}" stroke-width="1.65" marker-end="url(#${p}arrow-amber)"/>` +

      // Summing Junction Sigma
      `<circle cx="149" cy="58" r="11.5" fill="url(#${p}glass-node)" stroke="${COLORS.wire}" stroke-width="1.6"/>` +
      labelText(149, 62, 'Σ', { color: COLORS.text, size: 12, weight: '700' }) +
      labelText(131, 51, '+', { color: COLORS.amber, size: 10, weight: '700', filter: cueFilter }) +
      labelText(139, 78, '+', { color: COLORS.cyan, size: 10, weight: '700', filter: cueFilter }) +

      // Sigma -> Integrator [∫]
      `<g${cueFilter ? ` filter="url(#${cueFilter})"` : ''}>` +
      `<line x1="160.5" y1="58" x2="196" y2="58" stroke="${COLORS.cyan}" stroke-width="1.75" marker-end="url(#${p}arrow-cyan)"/>` +
      labelText(178, 47, 'ẋ(t)', { color: COLORS.cyan, size: 9.2, weight: '700', opacity: cueOp }) +
      `</g>` +

      // Integrator Block [∫]
      `<rect x="200" y="40" width="50" height="36" rx="8" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.8"/>` +
      `<line x1="207" y1="41.3" x2="243" y2="41.3" stroke="rgba(255,255,255,0.24)" stroke-width="0.95"/>` +
      labelText(225, 63.5, '∫', { color: '#E0F2FE', size: 16, weight: '700', filter: cueFilter }) +

      // Integrator -> [C] (with tap to [A])
      `<line x1="250" y1="58" x2="304" y2="58" stroke="${COLORS.cyan}" stroke-width="1.8" marker-end="url(#${p}arrow-cyan)"/>` +
      labelText(278, 47, 'x(t)', { color: COLORS.cyan, size: 9.6, weight: '700' }) +
      `<circle cx="278" cy="58" r="2.8" fill="${COLORS.cyan}"/>` +

      // Output Matrix [C]
      `<rect x="308" y="42" width="46" height="32" rx="7" fill="url(#${p}glass-violet)" stroke="${COLORS.violet}" stroke-width="1.7"/>` +
      `<line x1="314" y1="43.3" x2="348" y2="43.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>` +
      labelText(331, 62, cVal, { color: COLORS.text, size: cSize, weight: '700' }) +

      // Output y(t)
      `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
      `<line x1="354" y1="58" x2="404" y2="58" stroke="${COLORS.emerald}" stroke-width="${isSetup ? '2.15' : '1.85'}" marker-end="url(#${p}arrow-emerald)"/>` +
      labelText(384, 47, 'y(t)', { color: COLORS.emerald, size: 10, weight: '700' }) +
      `</g>` +

      // Feedback branch through [A]
      `<path d="M 278,58 L 278,104 Q 278,108 274,108 L 250,108" fill="none" stroke="${COLORS.cyan}" stroke-width="1.65" stroke-linejoin="round" marker-end="url(#${p}arrow-cyan)"/>` +
      `<rect x="198" y="93" width="48" height="30" rx="7" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.65"/>` +
      `<line x1="204" y1="94.3" x2="240" y2="94.3" stroke="rgba(255,255,255,0.2)" stroke-width="0.9"/>` +
      labelText(222, 112, aVal, { color: COLORS.text, size: aSize, weight: '700' }) +
      `<path d="M 198,108 L 153,108 Q 149,108 149,104 L 149,71.5" fill="none" stroke="${COLORS.cyan}" stroke-width="1.65" stroke-linejoin="round" marker-end="url(#${p}arrow-cyan)"/>` +
      labelText(171, 101, 'Ax', { color: COLORS.cyan, size: 8.6, weight: '600', opacity: cueOp }) +

      // Right compact modal summary box
      `<rect x="296" y="92" width="110" height="32" rx="7" fill="rgba(7,11,20,0.74)" stroke="rgba(148,163,184,0.22)" stroke-width="0.9"/>` +
      labelText(351, 105, 'ẋ = Ax + Bu', { color: '#A5F3FC', size: 8.4, weight: '600' }) +
      labelText(351, 117.5, 'y = Cx + Du', { color: '#A7F3D0', size: 8.2, weight: '500', opacity: '0.88' }) +

      renderSubtitle(d.subtitle, 14, 142);

    return wrapSVG(p, `State-space signal-flow schematic (${aVal}, ${bVal}, ${cVal})`, body);
  }

  if (variant === 'observer') {
    const ctrlVal = fmt(d.controller, '−K');
    const obsVal = fmt(d.observer, 'L');
    const ctrlSize = fitFontSize(ctrlVal, 48, 11, 7.5);
    const obsSize = fitFontSize(obsVal, 30, 11, 7.5);

    const body =
      labelText(14, 15.5, 'OBSERVER-BASED FEEDBACK', {
        color: COLORS.cyan,
        size: 7.3,
        weight: '700',
        anchor: 'start',
        opacity: '0.84',
        letterSpacing: '0.7',
      }) +
      pillBadge(342, 14.5, 'Separation Principle', COLORS.violet, {
        size: 7.8,
        padX: 8,
        h: 14.5,
        bg: 'rgba(167,139,250,0.14)',
        textColor: '#DDD6FE',
      }) +

      // Left Controller Box [-K]
      `<rect x="20" y="39" width="58" height="38" rx="7.5" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.7"/>` +
      `<line x1="27" y1="40.3" x2="71" y2="40.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>` +
      labelText(49, 51, 'CTRL', { color: COLORS.amber, size: 7.2, weight: '700', opacity: '0.86' }) +
      labelText(49, 67, ctrlVal, { color: '#FEF3C7', size: ctrlSize, weight: '700' }) +

      // Control u -> Plant (top) and -> Observer (bottom branch)
      `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
      `<line x1="78" y1="54" x2="132" y2="54" stroke="${COLORS.amber}" stroke-width="${isSetup ? '2' : '1.75'}" marker-end="url(#${p}arrow-amber)"/>` +
      labelText(96, 45, 'u', { color: COLORS.amber, size: 9.8, weight: '700' }) +
      `</g>` +
      `<circle cx="106" cy="54" r="2.6" fill="${COLORS.amber}"/>` +
      `<path d="M 106,54 L 106,94 Q 106,98 110,98 L 132,98" fill="none" stroke="${COLORS.amber}" stroke-width="1.6" stroke-linejoin="round" marker-end="url(#${p}arrow-amber)"/>` +

      // Top Plant Box
      `<rect x="136" y="29" width="140" height="42" rx="8" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.75"/>` +
      `<line x1="143" y1="30.3" x2="269" y2="30.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.95"/>` +
      labelText(206, 41, 'PLANT', { color: COLORS.cyan, size: 7.6, weight: '700', opacity: '0.9', letterSpacing: '0.6' }) +
      labelText(206, 54, 'ẋ = Ax + Bu', { color: COLORS.text, size: 9.5, weight: '700' }) +
      labelText(206, 65.5, 'y = Cx', { color: '#A5F3FC', size: 8.5, weight: '600' }) +

      // Plant output y + tap down to Residual Sigma
      `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
      `<line x1="276" y1="50" x2="404" y2="50" stroke="${COLORS.emerald}" stroke-width="${isSetup ? '2.05' : '1.8'}" marker-end="url(#${p}arrow-emerald)"/>` +
      labelText(390, 41, 'y', { color: COLORS.emerald, size: 10, weight: '700' }) +
      `</g>` +
      `<circle cx="320" cy="50" r="2.6" fill="${COLORS.emerald}"/>` +
      `<line x1="320" y1="50" x2="320" y2="66" stroke="${COLORS.emerald}" stroke-width="1.55" marker-end="url(#${p}arrow-emerald)"/>` +
      labelText(311, 61, '+', { color: COLORS.emerald, size: 9.5, weight: '700' }) +

      // Residual Summing Junction Sigma
      `<circle cx="320" cy="78" r="9.5" fill="url(#${p}glass-node)" stroke="${COLORS.wire}" stroke-width="1.5"/>` +
      labelText(320, 81.5, 'Σ', { color: COLORS.text, size: 10.5, weight: '700' }) +

      // Observer output ŷ -> Sigma (-)
      `<path d="M 276,99 L 316,99 Q 320,99 320,95 L 320,89.5" fill="none" stroke="${COLORS.violet}" stroke-width="1.55" stroke-linejoin="round" marker-end="url(#${p}arrow-violet)"/>` +
      labelText(298, 93, 'ŷ', { color: COLORS.violet, size: 9, weight: '700' }) +
      labelText(310, 94.5, '−', { color: COLORS.rose, size: 10.5, weight: '700' }) +

      // Residual y - ŷ -> Observer Gain [L] -> Observer
      `<line x1="329.5" y1="78" x2="356" y2="78" stroke="${COLORS.violet}" stroke-width="1.6" marker-end="url(#${p}arrow-violet)"/>` +
      labelText(343, 69, 'y−ŷ', { color: '#DDD6FE', size: 7.8, weight: '600' }) +
      `<rect x="360" y="65" width="38" height="26" rx="6.5" fill="url(#${p}glass-violet)" stroke="${COLORS.violet}" stroke-width="1.65"/>` +
      `<line x1="365" y1="66.3" x2="393" y2="66.3" stroke="rgba(255,255,255,0.2)" stroke-width="0.85"/>` +
      labelText(379, 82, obsVal, { color: '#EDE9FE', size: obsSize, weight: '700' }) +
      `<path d="M 379,91 L 379,112 Q 379,116 375,116 L 279,116" fill="none" stroke="${COLORS.violet}" stroke-width="1.6" stroke-linejoin="round" marker-end="url(#${p}arrow-violet)"/>` +
      labelText(334, 125.5, 'L(y−ŷ)', { color: COLORS.violet, size: 7.8, weight: '600' }) +

      // Bottom Luenberger Observer Box
      `<rect x="136" y="86" width="140" height="41" rx="8" fill="url(#${p}glass-violet)" stroke="${COLORS.violet}" stroke-width="1.75"/>` +
      `<line x1="143" y1="87.3" x2="269" y2="87.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.95"/>` +
      labelText(206, 97.5, 'LUENBERGER OBSERVER', { color: COLORS.violet, size: 7.2, weight: '700', opacity: '0.92', letterSpacing: '0.4' }) +
      labelText(206, 110.5, 'x̂̇ = Ax̂+Bu + L(y−ŷ)', { color: COLORS.text, size: 8.5, weight: '700' }) +
      labelText(206, 122, 'eig(A−BK) ∪ eig(A−LC)', { color: '#C4B5FD', size: 7.1, weight: '500', opacity: '0.88' }) +

      // Estimated state x̂ feedback -> [-K]
      `<path d="M 136,114 L 53,114 Q 49,114 49,110 L 49,79" fill="none" stroke="${COLORS.cyan}" stroke-width="1.65" stroke-linejoin="round" marker-end="url(#${p}arrow-cyan)"/>` +
      labelText(84, 107, 'x̂', { color: COLORS.cyan, size: 10, weight: '700', filter: cueFilter }) +

      renderSubtitle(d.subtitle, 14, 142);

    return wrapSVG(p, `Luenberger observer and separation principle schematic: controller ${ctrlVal}, observer ${obsVal}`, body);
  }

  // Default variant: 'lqr' (Full-State Feedback Loop)
  const costText = fmt(d.controller, 'J = ∫(xᵀQx+uᵀRu)');
  const costSize = fitFontSize(costText, 128, 8.0, 6.6);

  const body =
    labelText(14, 16.5, 'FULL-STATE FEEDBACK (LQR)', {
      color: COLORS.cyan,
      size: 7.4,
      weight: '700',
      anchor: 'start',
      opacity: '0.86',
      letterSpacing: '0.7',
    }) +
    pillBadge(352, 15.5, 'K = R⁻¹BᵀP', COLORS.amber, {
      size: 8.0,
      padX: 8,
      h: 15,
      bg: 'rgba(245,158,11,0.13)',
      textColor: '#FDE68A',
    }) +

    // Reference r -> Pre-compensator [N̄]
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<line x1="12" y1="60" x2="43" y2="60" stroke="${COLORS.emerald}" stroke-width="${isSetup ? '2.1' : '1.8'}" marker-end="url(#${p}arrow-emerald)"/>` +
    labelText(25, 49, 'r', { color: COLORS.emerald, size: 10.5, weight: '700' }) +
    `</g>` +

    // [N̄] Reference Gain Box
    `<rect x="47" y="45" width="34" height="30" rx="7" fill="url(#${p}glass-emerald)" stroke="${COLORS.emerald}" stroke-width="1.55"/>` +
    `<line x1="52" y1="46.3" x2="76" y2="46.3" stroke="rgba(255,255,255,0.2)" stroke-width="0.85"/>` +
    labelText(64, 64, 'N̄', { color: '#D1FAE5', size: 11, weight: '700' }) +

    // [N̄] -> Sigma
    `<line x1="81" y1="60" x2="107" y2="60" stroke="${COLORS.emerald}" stroke-width="1.65" marker-end="url(#${p}arrow-emerald)"/>` +

    // Summing Junction Sigma (+/-)
    `<circle cx="121" cy="60" r="11.5" fill="url(#${p}glass-node)" stroke="${COLORS.wire}" stroke-width="1.6"/>` +
    labelText(121, 64, 'Σ', { color: COLORS.text, size: 12, weight: '700' }) +
    labelText(103, 52, '+', { color: COLORS.emerald, size: 10.5, weight: '700', filter: cueFilter }) +
    labelText(111, 80, '−', { color: COLORS.amber, size: 11.5, weight: '700', filter: cueFilter }) +

    // Control Signal u = -Kx -> Plant
    `<g${cueFilter ? ` filter="url(#${cueFilter})"` : ''}>` +
    `<line x1="132.5" y1="60" x2="206" y2="60" stroke="${COLORS.amber}" stroke-width="${isSetup ? '2.1' : '1.85'}" marker-end="url(#${p}arrow-amber)"/>` +
    labelText(169, 48, 'u = −Kx', { color: COLORS.amber, size: 9.6, weight: '700', opacity: cueOp }) +
    `</g>` +

    // Cyan State-Space Plant Box
    `<rect x="210" y="36" width="138" height="48" rx="8.5" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.8"/>` +
    `<line x1="217" y1="37.3" x2="341" y2="37.3" stroke="rgba(255,255,255,0.24)" stroke-width="0.95"/>` +
    labelText(279, 48, 'STATE-SPACE PLANT', { color: COLORS.cyan, size: 7.3, weight: '700', opacity: '0.88', letterSpacing: '0.5' }) +
    labelText(279, 62.5, 'ẋ = Ax + Bu', { color: COLORS.text, size: 10.8, weight: '700' }) +
    labelText(279, 76.5, costText, { color: '#DDD6FE', size: costSize, weight: '600' }) +

    // State Output x(t)
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<line x1="348" y1="60" x2="404" y2="60" stroke="${COLORS.cyan}" stroke-width="${isSetup ? '2.1' : '1.85'}" marker-end="url(#${p}arrow-cyan)"/>` +
    labelText(387, 48, 'x(t)', { color: COLORS.cyan, size: 10, weight: '700' }) +
    `</g>` +
    `<circle cx="368" cy="60" r="2.8" fill="${COLORS.cyan}"/>` +

    // Lower State-Feedback Return via Amber [K]
    `<path d="M 368,60 L 368,107 Q 368,111 364,111 L 269,111" fill="none" stroke="${COLORS.amber}" stroke-width="1.65" stroke-linejoin="round" marker-end="url(#${p}arrow-amber)"/>` +
    `<rect x="215" y="96" width="50" height="30" rx="7.5" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.75"/>` +
    `<line x1="221" y1="97.3" x2="259" y2="97.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>` +
    labelText(240, 115, 'K', { color: '#FEF3C7', size: 12.5, weight: '700' }) +
    `<path d="M 215,111 L 125,111 Q 121,111 121,107 L 121,73.5" fill="none" stroke="${COLORS.amber}" stroke-width="1.65" stroke-linejoin="round" marker-end="url(#${p}arrow-amber)"/>` +
    labelText(168, 103, 'Kx', { color: COLORS.amber, size: 9, weight: '600', opacity: cueOp }) +

    renderSubtitle(d.subtitle, 14, 142);

  return wrapSVG(p, `Full-state feedback LQR control loop schematic: ${costText}`, body);
}

/* ==========================================================================
   11. Model Predictive Control & CBF Safety Filter (mpc-cbf)
   ========================================================================== */
function renderMpcCbf(d, p, isSetup, _activeStepIndex) {
  const variant = String(d.variant || 'mpc').trim().toLowerCase();
  const arrowFilter = isSetup ? `${p}glow-boost` : '';
  const cueFilter = isSetup ? `${p}glow-soft` : '';

  if (variant === 'cbf') {
    const costStr = fmt(d.cost, 'min ½‖u−u_nom‖²');
    const barrierStr = fmt(d.barrier, 's.t. ḣ + αh ≥ 0');
    const safeSetStr = fmt(d.constraint, 'C = {x : h(x) ≥ 0}');
    const safeFont = fitFontSize(safeSetStr, 152, 8.2, 7.0);
    const safeW = Math.max(76, Math.round(safeSetStr.length * safeFont * 0.62 + 16));
    const safeCx = Math.round((408 - safeW / 2) * 10) / 10;

    const body =
      labelText(14, 17, 'CBF-QP SAFETY FILTER', {
        color: COLORS.emerald,
        size: 7.5,
        weight: '700',
        anchor: 'start',
        opacity: '0.9',
        letterSpacing: '0.8',
      }) +
      pillBadge(safeCx, 16, safeSetStr, COLORS.emerald, {
        size: safeFont,
        padX: 8,
        h: 16,
        bg: 'rgba(52,211,153,0.12)',
        textColor: '#A7F3D0',
      }) +

      // Left: Nominal Policy (Cyan)
      `<rect x="14" y="42" width="88" height="52" rx="8" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.65"/>` +
      `<line x1="21" y1="43.3" x2="95" y2="43.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>` +
      labelText(58, 56, 'NOMINAL', { color: COLORS.cyan, size: 7.4, weight: '700', opacity: '0.88', letterSpacing: '0.5' }) +
      labelText(58, 66.5, 'POLICY', { color: COLORS.cyan, size: 7.4, weight: '700', opacity: '0.88', letterSpacing: '0.5' }) +
      labelText(58, 83.5, 'LQR / MPC / RL', { color: COLORS.text, size: 8.3, weight: '600' }) +

      // Arrow u_nom -> CBF-QP Shield
      `<line x1="102" y1="68" x2="135" y2="68" stroke="${COLORS.amber}" stroke-width="1.75" marker-end="url(#${p}arrow-amber)"/>` +
      labelText(119, 57, 'u_nom', { color: COLORS.amber, size: 8.6, weight: '700' }) +

      // Center: Double-Bordered Emerald/Amber CBF-QP Shield
      `<rect x="139" y="34" width="142" height="68" rx="10" fill="rgba(245,158,11,0.06)" stroke="${COLORS.amber}" stroke-opacity="0.7" stroke-width="1.35"/>` +
      `<rect x="143" y="38" width="134" height="60" rx="7.5" fill="url(#${p}glass-emerald)" stroke="${COLORS.emerald}" stroke-width="1.8"/>` +
      `<line x1="150" y1="39.3" x2="270" y2="39.3" stroke="rgba(255,255,255,0.24)" stroke-width="0.95"/>` +
      // Vector shield emblem
      `<path d="M 157,44.5 L 162,46.5 L 162,50.5 C 162,53.6 159.5,55.4 157,56.5 C 154.5,55.4 152,53.6 152,50.5 L 152,46.5 Z" fill="rgba(52,211,153,0.22)" stroke="${COLORS.emerald}" stroke-width="1.15"/>` +
      labelText(216, 53, 'CBF-QP SHIELD', { color: COLORS.emerald, size: 8.0, weight: '700', letterSpacing: '0.6' }) +
      labelText(210, 70, costStr, {
        color: COLORS.text,
        size: fitFontSize(costStr, 124, 9.0, 6.8),
        weight: '700',
      }) +
      labelText(210, 86.5, barrierStr, {
        color: '#FDE68A',
        size: fitFontSize(barrierStr, 124, 8.6, 6.8),
        weight: '600',
      }) +

      // Arrow u* (safe) -> Robot Plant
      `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
      `<line x1="281" y1="68" x2="315" y2="68" stroke="${COLORS.emerald}" stroke-width="${isSetup ? '2.2' : '1.9'}" marker-end="url(#${p}arrow-emerald)"/>` +
      labelText(298, 57, 'u*', { color: COLORS.emerald, size: 10.5, weight: '700' }) +
      `</g>` +
      labelText(298, 80, 'safe', { color: '#6EE7B7', size: 7.2, weight: '600', opacity: '0.9' }) +

      // Right: Robot Plant (Cyan)
      `<rect x="319" y="42" width="87" height="52" rx="8" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.7"/>` +
      `<line x1="326" y1="43.3" x2="399" y2="43.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>` +
      labelText(362.5, 56, 'ROBOT PLANT', { color: COLORS.cyan, size: 7.4, weight: '700', opacity: '0.9', letterSpacing: '0.4' }) +
      labelText(362.5, 72, 'ẋ = f(x)+g(x)u', { color: COLORS.text, size: 8.2, weight: '700' }) +
      labelText(362.5, 86, 'x(t) ∈ C', { color: COLORS.emerald, size: 8.4, weight: '700' }) +

      // State feedback return to Nominal Policy & CBF-QP Shield
      `<path d="M 362.5,94 L 362.5,115 Q 362.5,119 358.5,119 L 62,119 Q 58,119 58,115 L 58,96" fill="none" stroke="${COLORS.cyan}" stroke-width="1.55" stroke-linejoin="round" marker-end="url(#${p}arrow-cyan)"/>` +
      `<circle cx="210" cy="119" r="2.6" fill="${COLORS.cyan}"/>` +
      `<line x1="210" y1="119" x2="210" y2="104" stroke="${COLORS.emerald}" stroke-width="1.55" marker-end="url(#${p}arrow-emerald)"/>` +
      labelText(286, 113, 'state x(t) → h(x)', { color: COLORS.cyan, size: 7.8, weight: '600', filter: cueFilter }) +

      renderSubtitle(d.subtitle, 14, 143);

    return wrapSVG(p, `Safety-critical CBF-QP safety filter schematic: ${costStr}, ${barrierStr}`, body);
  }

  // Default variant: 'mpc' (Receding-Horizon MPC Loop)
  const horizonRaw = fmt(d.horizon, 'N');
  const horizonLabel = /^k\s*[→\-]/i.test(horizonRaw)
    ? horizonRaw
    : /^N\s*=\s*(.+)$/i.test(horizonRaw)
      ? `k → k+${horizonRaw.replace(/^N\s*=\s*/i, '').trim()}`
      : `k → k+${horizonRaw}`;
  const costStr = fmt(d.cost, 'min Σ xᵀQx+uᵀRu');
  const constrStr = fmt(d.constraint, '|u| ≤ u_max');

  const body =
    labelText(14, 17, 'RECEDING-HORIZON MPC', {
      color: COLORS.violet,
      size: 7.5,
      weight: '700',
      anchor: 'start',
      opacity: '0.9',
      letterSpacing: '0.8',
    }) +

    // Sleek Top-Right Receding-Horizon Sparkline Preview Pill (k -> k+N)
    `<g>` +
    `<rect x="208" y="7" width="198" height="28" rx="8" fill="rgba(11,15,25,0.9)" stroke="${COLORS.violet}" stroke-opacity="0.52" stroke-width="1"/>` +
    `<line x1="215" y1="8.2" x2="399" y2="8.2" stroke="rgba(255,255,255,0.16)" stroke-width="0.8"/>` +
    labelText(216, 17.5, 'HORIZON', { color: COLORS.violet, size: 6.7, weight: '700', anchor: 'start', opacity: '0.88', letterSpacing: '0.5' }) +
    labelText(216, 29.5, horizonLabel, {
      color: '#EDE9FE',
      size: fitFontSize(horizonLabel, 74, 8.2, 6.8),
      weight: '700',
      anchor: 'start',
    }) +
    // Applied first-step Emerald highlight band
    `<rect x="296" y="10.5" width="18" height="21" rx="3" fill="rgba(52,211,153,0.16)" stroke="${COLORS.emerald}" stroke-opacity="0.4" stroke-width="0.75"/>` +
    // Reference dashed line
    `<line x1="296" y1="15" x2="398" y2="15" stroke="${COLORS.emerald}" stroke-opacity="0.48" stroke-width="0.9" stroke-dasharray="2.5 2"/>` +
    // Predicted trajectory sparkline curve
    `<path d="M 300,29 C 320,28 336,16.5 396,15" fill="none" stroke="${COLORS.cyan}" stroke-width="1.5" stroke-linecap="round"/>` +
    // Receding horizon discrete nodes (u0* emerald + future violet)
    `<circle cx="300" cy="29" r="2.6" fill="${COLORS.emerald}" filter="url(#${p}glow-soft)"/>` +
    `<circle cx="322" cy="24.5" r="1.9" fill="${COLORS.violet}"/>` +
    `<circle cx="344" cy="18.8" r="1.9" fill="${COLORS.violet}" fill-opacity="0.85"/>` +
    `<circle cx="368" cy="16.2" r="1.8" fill="${COLORS.violet}" fill-opacity="0.7"/>` +
    `<circle cx="392" cy="15.2" r="1.7" fill="${COLORS.violet}" fill-opacity="0.55"/>` +
    `</g>` +

    // Left Box: Convex QP Solver (Violet/Amber)
    `<rect x="14" y="42" width="146" height="56" rx="8.5" fill="url(#${p}glass-violet)" stroke="${COLORS.violet}" stroke-width="1.75"/>` +
    `<line x1="22" y1="43.3" x2="152" y2="43.3" stroke="${COLORS.amber}" stroke-opacity="0.82" stroke-width="1.25"/>` +
    labelText(87, 54.5, 'CONVEX QP SOLVER', { color: COLORS.amber, size: 7.5, weight: '700', letterSpacing: '0.6' }) +
    labelText(87, 70.5, costStr, {
      color: COLORS.text,
      size: fitFontSize(costStr, 134, 9.2, 6.8),
      weight: '700',
    }) +
    labelText(87, 86.5, constrStr, {
      color: '#FDE68A',
      size: fitFontSize(constrStr, 132, 8.4, 6.8),
      weight: '600',
    }) +

    // Center Arrow: apply u0* only (Emerald)
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<line x1="160" y1="70" x2="252" y2="70" stroke="${COLORS.emerald}" stroke-width="${isSetup ? '2.15' : '1.85'}" marker-end="url(#${p}arrow-emerald)"/>` +
    labelText(206, 58, 'u₀*', { color: COLORS.emerald, size: 10.5, weight: '700' }) +
    `</g>` +
    labelText(206, 84, 'apply u₀* only', { color: '#A7F3D0', size: 7.8, weight: '600' }) +

    // Right Box: Discrete Plant (Cyan)
    `<rect x="256" y="45" width="150" height="50" rx="8.5" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.75"/>` +
    `<line x1="263" y1="46.3" x2="399" y2="46.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.95"/>` +
    labelText(331, 58, 'DISCRETE PLANT', { color: COLORS.cyan, size: 7.5, weight: '700', opacity: '0.9', letterSpacing: '0.6' }) +
    labelText(
      331,
      73.5,
      'x<tspan dy="2.2" font-size="6.8">k+1</tspan><tspan dy="-2.2"> = A</tspan><tspan dy="2.2" font-size="6.8">d</tspan><tspan dy="-2.2">x</tspan><tspan dy="2.2" font-size="6.8">k</tspan><tspan dy="-2.2"> + B</tspan><tspan dy="2.2" font-size="6.8">d</tspan><tspan dy="-2.2">u</tspan><tspan dy="2.2" font-size="6.8">k</tspan>',
      { color: COLORS.text, size: 9.2, weight: '700', raw: true }
    ) +
    labelText(331, 87, 'Zero-Order Hold (k → k+1)', { color: '#A5F3FC', size: 7.2, weight: '500', opacity: '0.84' }) +

    // Feedback return path: measure x_k
    `<path d="M 331,95 L 331,116 Q 331,120 327,120 L 91,120 Q 87,120 87,116 L 87,100" fill="none" stroke="${COLORS.cyan}" stroke-width="1.65" stroke-linejoin="round" marker-end="url(#${p}arrow-cyan)"/>` +
    pillBadge(209, 120, 'measure x_k', COLORS.cyan, {
      size: 8.0,
      padX: 9,
      h: 15,
      bg: 'rgba(7,11,20,0.94)',
      textColor: '#A5F3FC',
      filter: cueFilter,
    }) +

    renderSubtitle(d.subtitle, 14, 143);

  return wrapSVG(p, `Receding-horizon MPC loop schematic: ${costStr}, ${constrStr}, horizon ${horizonRaw}`, body);
}

/* ==========================================================================
   12. State Estimation & Sensor Fusion Architectures (estimator-arch)
   ========================================================================== */
function renderEstimatorArch(d, p, isSetup, _activeStepIndex) {
  const variant = String(d.variant || 'kf').trim().toLowerCase();
  const arrowFilter = isSetup ? `${p}glow-boost` : '';
  const cueFilter = isSetup ? `${p}glow-soft` : '';

  if (variant === 'ukf') {
    const warpExpr = fmt(d.model, 'yᵢ = f(χᵢ)');
    const highlightText = fmt(d.highlight, 'No Jacobians!');

    const body =
      labelText(14, 16, 'UNSCENTED TRANSFORM (UKF)', {
        color: COLORS.violet,
        size: 7.4,
        weight: '700',
        anchor: 'start',
        opacity: '0.9',
        letterSpacing: '0.7',
      }) +
      pillBadge(354, 15.5, highlightText, COLORS.emerald, {
        size: fitFontSize(highlightText, 92, 8.0, 6.8),
        padX: 8,
        h: 15,
        bg: 'rgba(52,211,153,0.14)',
        textColor: '#A7F3D0',
      }) +

      // Left Panel: Prior Ellipse + 5 Glowing Violet Sigma Points (2n+1)
      `<rect x="14" y="29" width="112" height="92" rx="9" fill="rgba(7,11,20,0.74)" stroke="rgba(34,211,238,0.32)" stroke-width="1"/>` +
      labelText(70, 41, 'PRIOR (x̂, P)', { color: COLORS.cyan, size: 7.3, weight: '700', opacity: '0.88' }) +
      `<ellipse cx="70" cy="74" rx="34" ry="18" transform="rotate(-22 70 74)" fill="rgba(34,211,238,0.12)" stroke="${COLORS.cyan}" stroke-width="1.5"/>` +
      `<ellipse cx="70" cy="74" rx="18" ry="9.5" transform="rotate(-22 70 74)" fill="none" stroke="${COLORS.cyan}" stroke-opacity="0.35" stroke-width="0.9" stroke-dasharray="2.5 2"/>` +
      // 5 glowing Violet sigma-point dots (center + 4 principal endpoints)
      `<g filter="url(#${p}glow-soft)">` +
      `<circle cx="40" cy="86" r="2.9" fill="${COLORS.violet}"/>` +
      `<circle cx="100" cy="62" r="2.9" fill="${COLORS.violet}"/>` +
      `<circle cx="63.5" cy="58" r="2.9" fill="${COLORS.violet}"/>` +
      `<circle cx="76.5" cy="90" r="2.9" fill="${COLORS.violet}"/>` +
      `</g>` +
      `<circle cx="70" cy="74" r="3.6" fill="#DDD6FE" stroke="${COLORS.violet}" stroke-width="1.4" filter="url(#${p}glow-boost)"/>` +
      labelText(70, 112.5, '2n+1 Sigma Pts', { color: COLORS.violet, size: 7.9, weight: '700' }) +

      // Arrow 1: true f(.), h(.) -> Nonlinear Warp
      `<line x1="126" y1="75" x2="165" y2="75" stroke="${COLORS.amber}" stroke-width="1.8" marker-end="url(#${p}arrow-amber)"/>` +
      labelText(146, 56, 'true', { color: COLORS.amber, size: 7.6, weight: '600' }) +
      labelText(146, 66.5, 'f(·), h(·)', { color: '#FDE68A', size: 7.6, weight: '700' }) +
      labelText(146, 87.5, 'χᵢ', { color: COLORS.violet, size: 8.6, weight: '700' }) +

      // Center Block: Nonlinear Warp (Amber)
      `<rect x="169" y="42" width="82" height="66" rx="9" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.75"/>` +
      `<line x1="176" y1="43.3" x2="244" y2="43.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>` +
      labelText(210, 55, 'NONLINEAR', { color: COLORS.amber, size: 7.3, weight: '700', opacity: '0.92', letterSpacing: '0.4' }) +
      `<path d="M 183,80 C 194,80 198,64 210,72 C 222,80 226,64 237,64" fill="none" stroke="${COLORS.amber}" stroke-width="1.8" stroke-linecap="round" filter="url(#${p}glow-soft)"/>` +
      labelText(210, 98.5, warpExpr, {
        color: '#FEF3C7',
        size: fitFontSize(warpExpr, 72, 8.6, 6.8),
        weight: '700',
      }) +

      // Arrow 2: weights W_i -> Posterior Cloud
      `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
      `<line x1="251" y1="75" x2="286" y2="75" stroke="${COLORS.emerald}" stroke-width="${isSetup ? '2.05' : '1.8'}" marker-end="url(#${p}arrow-emerald)"/>` +
      labelText(269, 65.5, 'Wᵢ', { color: COLORS.emerald, size: 8.8, weight: '700' }) +
      `</g>` +

      // Right Panel: Curved Banana Posterior Cloud + Emerald Weighted Mean & Cov
      `<rect x="290" y="29" width="116" height="92" rx="9" fill="rgba(7,11,20,0.74)" stroke="rgba(52,211,153,0.36)" stroke-width="1"/>` +
      labelText(348, 41, 'POSTERIOR CLOUD', { color: COLORS.emerald, size: 7.3, weight: '700', opacity: '0.9' }) +
      // Curved banana-shaped posterior distribution
      `<path d="M 306,86 C 312,61 340,48 383,55 C 394,57 396,67 386,70 C 355,66 333,74 323,90 C 318,97 304,94 306,86 Z" fill="rgba(167,139,250,0.18)" stroke="${COLORS.violet}" stroke-opacity="0.74" stroke-width="1.25"/>` +
      // Warped sigma-point dots inside banana
      `<g filter="url(#${p}glow-soft)">` +
      `<circle cx="315" cy="86" r="2.4" fill="${COLORS.violet}"/>` +
      `<circle cx="329" cy="70" r="2.4" fill="${COLORS.violet}"/>` +
      `<circle cx="348" cy="61.5" r="2.4" fill="${COLORS.violet}"/>` +
      `<circle cx="368" cy="59.5" r="2.4" fill="${COLORS.violet}"/>` +
      `<circle cx="385" cy="63" r="2.4" fill="${COLORS.violet}"/>` +
      `</g>` +
      // Emerald fitted weighted mean & covariance ellipse
      `<ellipse cx="349" cy="69" rx="34" ry="12.5" transform="rotate(-18 349 69)" fill="none" stroke="${COLORS.emerald}" stroke-width="1.5" stroke-dasharray="3.2 2"/>` +
      `<circle cx="349" cy="69" r="3.4" fill="${COLORS.emerald}" filter="url(#${p}glow-boost)"/>` +
      labelText(348, 112.5, 'Σ Wᵢ yᵢ , P_y', { color: COLORS.emerald, size: 8.0, weight: '700' }) +

      renderSubtitle(d.subtitle, 14, 143);

    return wrapSVG(p, `Unscented Transform UKF sigma-point pipeline schematic (${highlightText})`, body);
  }

  if (variant === 'factor-graph') {
    const windowTitle = fmt(d.highlight, 'MHE SLIDING WINDOW');

    const body =
      // Translucent MHE Sliding Window Bracket
      `<rect x="46" y="14" width="328" height="109" rx="11" fill="rgba(34,211,238,0.04)" stroke="${COLORS.cyan}" stroke-opacity="0.34" stroke-width="1" stroke-dasharray="5 3.5"/>` +
      // Solid corner bracket accents
      `<path d="M 46,27 L 46,18 Q 46,14 50,14 L 59,14" fill="none" stroke="${COLORS.cyan}" stroke-width="1.8" stroke-linecap="round"/>` +
      `<path d="M 361,14 L 370,14 Q 374,14 374,18 L 374,27" fill="none" stroke="${COLORS.cyan}" stroke-width="1.8" stroke-linecap="round"/>` +
      `<path d="M 46,110 L 46,119 Q 46,123 50,123 L 59,123" fill="none" stroke="${COLORS.cyan}" stroke-width="1.8" stroke-linecap="round"/>` +
      `<path d="M 361,123 L 370,123 Q 374,123 374,119 L 374,110" fill="none" stroke="${COLORS.cyan}" stroke-width="1.8" stroke-linecap="round"/>` +
      pillBadge(210, 14, windowTitle, COLORS.cyan, {
        size: fitFontSize(windowTitle, 180, 7.5, 6.8),
        padX: 9,
        h: 14.5,
        bg: 'rgba(7,11,20,0.95)',
        textColor: '#A5F3FC',
      }) +

      // Left Prior Factor into x0
      `<line x1="29" y1="68" x2="82" y2="68" stroke="${COLORS.violet}" stroke-width="1.5" stroke-dasharray="3 2"/>` +
      `<rect x="16" y="61" width="14" height="14" rx="2.5" fill="url(#${p}glass-violet)" stroke="${COLORS.violet}" stroke-width="1.45"/>` +
      labelText(23, 86, 'prior', { color: COLORS.violet, size: 7.4, weight: '600' }) +

      // Dashed Violet Loop-Closure / Prior Arc (x0 <-> x2)
      `<path d="M 96,54 Q 210,16 324,54" fill="none" stroke="${COLORS.violet}" stroke-width="1.55" stroke-dasharray="4 2.8"/>` +
      `<rect x="204" y="29" width="12" height="12" rx="2.5" fill="url(#${p}glass-violet)" stroke="${COLORS.violet}" stroke-width="1.45" filter="url(#${p}glow-soft)"/>` +
      labelText(267, 36.5, 'loop-closure', { color: '#DDD6FE', size: 7.6, weight: '600' }) +

      // Motion Factor Connectors (Amber)
      `<line x1="110" y1="68" x2="196" y2="68" stroke="${COLORS.amber}" stroke-width="1.7"/>` +
      `<line x1="224" y1="68" x2="310" y2="68" stroke="${COLORS.amber}" stroke-width="1.7"/>` +

      // Amber Square Motion Factors (f_dyn)
      `<rect x="145" y="60" width="16" height="16" rx="3" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.55"/>` +
      labelText(153, 71, 'f', { color: '#FEF3C7', size: 8.5, weight: '700' }) +
      labelText(153, 88, 'f_dyn', { color: COLORS.amber, size: 7.8, weight: '600' }) +
      `<rect x="259" y="60" width="16" height="16" rx="3" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.55"/>` +
      labelText(267, 71, 'f', { color: '#FEF3C7', size: 8.5, weight: '700' }) +
      labelText(267, 88, 'f_dyn', { color: COLORS.amber, size: 7.8, weight: '600' }) +

      // Hanging Emerald Measurement Factors (z_0, z_1, z_2)
      `<line x1="96" y1="81.5" x2="96" y2="98" stroke="${COLORS.emerald}" stroke-width="1.55"/>` +
      `<rect x="88.5" y="98" width="15" height="15" rx="3" fill="url(#${p}glass-emerald)" stroke="${COLORS.emerald}" stroke-width="1.5"/>` +
      labelText(96, 108.5, 'z', { color: '#D1FAE5', size: 8.2, weight: '700' }) +
      labelText(109, 109, 'z_0', { color: COLORS.emerald, size: 8.2, weight: '700', anchor: 'start' }) +

      `<line x1="210" y1="81.5" x2="210" y2="98" stroke="${COLORS.emerald}" stroke-width="1.55"/>` +
      `<rect x="202.5" y="98" width="15" height="15" rx="3" fill="url(#${p}glass-emerald)" stroke="${COLORS.emerald}" stroke-width="1.5"/>` +
      labelText(210, 108.5, 'z', { color: '#D1FAE5', size: 8.2, weight: '700' }) +
      labelText(223, 109, 'z_1', { color: COLORS.emerald, size: 8.2, weight: '700', anchor: 'start' }) +

      `<line x1="324" y1="81.5" x2="324" y2="98" stroke="${COLORS.emerald}" stroke-width="1.55"/>` +
      `<rect x="316.5" y="98" width="15" height="15" rx="3" fill="url(#${p}glass-emerald)" stroke="${COLORS.emerald}" stroke-width="1.5"/>` +
      labelText(324, 108.5, 'z', { color: '#D1FAE5', size: 8.2, weight: '700' }) +
      labelText(337, 109, 'z_2', { color: COLORS.emerald, size: 8.2, weight: '700', anchor: 'start' }) +

      // Three Glowing Cyan State Variable Circles (x0, x1, x2)
      `<g filter="url(#${p}glow-soft)">` +
      `<circle cx="96" cy="68" r="13.5" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.85"/>` +
      `<circle cx="210" cy="68" r="13.5" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.85"/>` +
      `<circle cx="324" cy="68" r="13.5" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.85"/>` +
      `</g>` +
      labelText(96, 72, 'x₀', { color: COLORS.text, size: 10.5, weight: '700' }) +
      labelText(210, 72, 'x₁', { color: COLORS.text, size: 10.5, weight: '700' }) +
      labelText(324, 72, 'x₂', { color: COLORS.text, size: 10.5, weight: '700' }) +

      // Right horizon continuation dots
      `<circle cx="388" cy="68" r="1.6" fill="${COLORS.muted}" fill-opacity="0.7"/>` +
      `<circle cx="395" cy="68" r="1.6" fill="${COLORS.muted}" fill-opacity="0.5"/>` +
      `<circle cx="402" cy="68" r="1.6" fill="${COLORS.muted}" fill-opacity="0.32"/>` +

      renderSubtitle(d.subtitle, 14, 143);

    return wrapSVG(p, 'Bipartite factor graph and MHE sliding window schematic', body);
  }

  if (variant === 'inekf') {
    const errEq = fmt(d.model, 'ξ̇ = A_t ξ');
    const badgeText = fmt(d.highlight, 'State-Independent!');

    const body =
      labelText(14, 16, 'INVARIANT EKF ON LIE GROUP', {
        color: COLORS.cyan,
        size: 7.3,
        weight: '700',
        anchor: 'start',
        opacity: '0.86',
        letterSpacing: '0.7',
      }) +

      // Left: 3D-Like Curved Translucent Cyan Manifold Surface SE_2(3)
      `<path d="M 20,94 Q 112,68 206,88 L 194,117 Q 106,96 32,119 Z" fill="url(#${p}glass-cyan)" fill-opacity="0.74" stroke="${COLORS.cyan}" stroke-width="1.55"/>` +
      // Curved wireframe iso-lines on manifold
      `<path d="M 24,103 Q 110,78 202,98" fill="none" stroke="${COLORS.cyan}" stroke-opacity="0.25" stroke-width="0.85"/>` +
      `<path d="M 28,111 Q 108,87 198,108" fill="none" stroke="${COLORS.cyan}" stroke-opacity="0.22" stroke-width="0.85"/>` +
      `<path d="M 66,84 Q 72,97 76,111" fill="none" stroke="${COLORS.cyan}" stroke-opacity="0.22" stroke-width="0.85"/>` +
      `<path d="M 114,80 Q 116,94 118,107" fill="none" stroke="${COLORS.cyan}" stroke-opacity="0.22" stroke-width="0.85"/>` +
      `<path d="M 162,83 Q 160,96 158,109" fill="none" stroke="${COLORS.cyan}" stroke-opacity="0.22" stroke-width="0.85"/>` +

      // Geodesic error arc on manifold between X̂ and X
      `<path d="M 95,91 Q 123,85 147,95" fill="none" stroke="${COLORS.emerald}" stroke-width="1.5" stroke-dasharray="3 2"/>` +
      `<circle cx="92" cy="92" r="3.4" fill="${COLORS.cyan}" filter="url(#${p}glow-soft)"/>` +
      labelText(80, 102, 'X̂', { color: COLORS.cyan, size: 8.8, weight: '700' }) +
      `<circle cx="150" cy="96" r="3.4" fill="${COLORS.emerald}" filter="url(#${p}glow-boost)"/>` +
      labelText(162, 104, 'X', { color: COLORS.emerald, size: 8.8, weight: '700' }) +
      labelText(113, 129, 'Lie Group SE₂(3) (X, X̂)', { color: COLORS.cyan, size: 8.0, weight: '700' }) +

      // Floating Tangent Plane (Tangent Space 𝔤) above manifold
      `<line x1="92" y1="56" x2="92" y2="88" stroke="${COLORS.cyan}" stroke-opacity="0.48" stroke-width="1.1" stroke-dasharray="2.5 2"/>` +
      `<polygon points="44,44 164,30 198,54 78,68" fill="rgba(52,211,153,0.11)" stroke="${COLORS.emerald}" stroke-opacity="0.72" stroke-width="1.25"/>` +
      labelText(115, 40, 'Tangent Space 𝔤', { color: '#A7F3D0', size: 7.8, weight: '700' }) +
      `<circle cx="92" cy="54" r="2.4" fill="${COLORS.cyan}"/>` +
      `<line x1="94.5" y1="53.6" x2="140" y2="48.5" stroke="${COLORS.violet}" stroke-width="1.65" marker-end="url(#${p}arrow-violet)"/>` +
      labelText(117, 59, 'ξ', { color: '#DDD6FE', size: 9.0, weight: '700' }) +

      // Glowing Emerald Exponential Map Arrow exp(ξ∧)
      `<g filter="url(#${p}glow-boost)">` +
      `<path d="M 145,50 Q 162,68 152,90" fill="none" stroke="${COLORS.emerald}" stroke-width="1.95" marker-end="url(#${p}arrow-emerald)"/>` +
      `</g>` +
      labelText(179, 69, 'exp(ξ∧)', { color: COLORS.emerald, size: 8.4, weight: '700' }) +

      // Connecting Arrow -> Log-Linear Error Box
      `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
      `<line x1="208" y1="76" x2="246" y2="76" stroke="${COLORS.violet}" stroke-width="1.85" marker-end="url(#${p}arrow-violet)"/>` +
      `</g>` +
      labelText(227, 65, 'η = X̂⁻¹X', { color: '#DDD6FE', size: 7.4, weight: '600' }) +

      // Right Violet Glass Box: Log-Linear Error
      `<rect x="250" y="32" width="156" height="86" rx="9" fill="url(#${p}glass-violet)" stroke="${COLORS.violet}" stroke-width="1.8"/>` +
      `<line x1="257" y1="33.3" x2="399" y2="33.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.95"/>` +
      labelText(328, 47, 'LOG-LINEAR ERROR', { color: COLORS.violet, size: 7.7, weight: '700', letterSpacing: '0.6' }) +
      labelText(328, 69, errEq, {
        color: COLORS.text,
        size: fitFontSize(errEq, 140, 12.5, 8.5),
        weight: '700',
      }) +
      labelText(328, 85, 'η = exp(ξ∧)', { color: '#A7F3D0', size: 8.4, weight: '600' }) +
      pillBadge(328, 103.5, badgeText, COLORS.emerald, {
        size: fitFontSize(badgeText, 130, 7.7, 6.6),
        padX: 8,
        h: 15,
        bg: 'rgba(52,211,153,0.14)',
        textColor: '#A7F3D0',
      }) +

      renderSubtitle(d.subtitle, 14, 143);

    return wrapSVG(p, `Matrix Lie Group SE2(3) Invariant EKF schematic: ${errEq} (${badgeText})`, body);
  }

  // Default variant: 'kf' (Kalman Filter Predict <-> Update Cycle)
  const modelStr = fmt(d.model, 'x̂⁻ = Fx̂ + Bu');
  const measStr = fmt(d.meas, 'z_k (H, R)');
  const noiseTag = fmt(d.noise, '');
  const bottomBadge = fmt(d.highlight, 'x̂_k, P_k  ·  Joseph PSD');

  const body =
    labelText(14, 16, 'KALMAN FILTER RECURSION', {
      color: COLORS.cyan,
      size: 7.4,
      weight: '700',
      anchor: 'start',
      opacity: '0.86',
      letterSpacing: '0.7',
    }) +
    (noiseTag
      ? pillBadge(96, 29, noiseTag, COLORS.cyan, {
          size: fitFontSize(noiseTag, 110, 7.4, 6.6),
          padX: 7,
          h: 13.5,
          bg: 'rgba(34,211,238,0.12)',
          textColor: '#A5F3FC',
        })
      : '') +

    // Top Sensor Measurement Arrow z_k (H, R) (Amber)
    pillBadge(324, 15.5, measStr, COLORS.amber, {
      size: fitFontSize(measStr, 128, 8.2, 7.0),
      padX: 8,
      h: 15.5,
      bg: 'rgba(245,158,11,0.12)',
      textColor: '#FDE68A',
    }) +
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<line x1="324" y1="23.5" x2="324" y2="40" stroke="${COLORS.amber}" stroke-width="1.8" marker-end="url(#${p}arrow-amber)"/>` +
    `</g>` +

    // Left Cyan Glass Box: PREDICT
    `<rect x="18" y="43" width="156" height="58" rx="9" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.8"/>` +
    `<line x1="25" y1="44.3" x2="167" y2="44.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.95"/>` +
    labelText(96, 56, '1. PREDICT (TIME UPDATE)', { color: COLORS.cyan, size: 7.4, weight: '700', opacity: '0.92', letterSpacing: '0.4' }) +
    labelText(96, 73.5, modelStr, {
      color: COLORS.text,
      size: fitFontSize(modelStr, 142, 9.8, 7.2),
      weight: '700',
    }) +
    labelText(96, 90, 'P⁻ = FPFᵀ + Q', { color: '#A5F3FC', size: 9.2, weight: '600' }) +

    // Forward Arrow: prior (x̂⁻, P⁻)
    `<line x1="174" y1="72" x2="242" y2="72" stroke="${COLORS.cyan}" stroke-width="1.85" marker-end="url(#${p}arrow-cyan)"/>` +
    labelText(208, 61, 'prior', { color: COLORS.cyan, size: 9.0, weight: '700', filter: cueFilter }) +
    labelText(208, 85, 'x̂⁻, P⁻', { color: '#A5F3FC', size: 8.2, weight: '600' }) +

    // Right Emerald Glass Box: UPDATE
    `<rect x="246" y="43" width="156" height="58" rx="9" fill="url(#${p}glass-emerald)" stroke="${COLORS.emerald}" stroke-width="1.8"/>` +
    `<line x1="253" y1="44.3" x2="395" y2="44.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.95"/>` +
    labelText(324, 56, '2. UPDATE (MEASUREMENT)', { color: COLORS.emerald, size: 7.4, weight: '700', opacity: '0.92', letterSpacing: '0.4' }) +
    labelText(324, 73.5, 'K = P⁻HᵀS⁻¹', { color: COLORS.text, size: 9.8, weight: '700' }) +
    labelText(324, 90, 'x̂ = x̂⁻ + Kỹ', { color: '#A7F3D0', size: 9.4, weight: '600' }) +

    // Bottom Feedback Return Loop + Joseph PSD Badge
    `<path d="M 324,101 L 324,117 Q 324,121 320,121 L 100,121 Q 96,121 96,117 L 96,103" fill="none" stroke="${COLORS.emerald}" stroke-width="1.65" stroke-linejoin="round" marker-end="url(#${p}arrow-emerald)"/>` +
    pillBadge(210, 121, bottomBadge, COLORS.violet, {
      size: fitFontSize(bottomBadge, 180, 7.8, 6.8),
      padX: 9,
      h: 15.5,
      bg: 'rgba(7,11,20,0.94)',
      textColor: '#DDD6FE',
    }) +

    renderSubtitle(d.subtitle, 14, 143);

  return wrapSVG(p, `Kalman filter predict-update cycle schematic: ${modelStr}, ${measStr}`, body);
}

/* ==========================================================================
   Robotics Kinematics Helpers
   ========================================================================== */
function pickSpecItem(val, idx, fallback) {
  if (Array.isArray(val) && val[idx] !== undefined && val[idx] !== null && val[idx] !== '') {
    return String(val[idx]);
  }
  if (typeof val === 'string' && val.includes(',')) {
    const parts = val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts[idx]) return parts[idx];
  }
  return fallback;
}

function isoTriad(p, x, y, size, color, markerId, labels = null) {
  const s = size;
  const xEndX = (x + s * 1.05).toFixed(1);
  const xEndY = (y + s * 0.28).toFixed(1);
  const yEndX = (x + s * 0.78).toFixed(1);
  const yEndY = (y - s * 0.56).toFixed(1);
  const zEndX = x.toFixed(1);
  const zEndY = (y - s * 1.05).toFixed(1);

  let out =
    `<g>` +
    `<line x1="${x}" y1="${y}" x2="${xEndX}" y2="${xEndY}" stroke="${color}" stroke-width="1.45" marker-end="url(#${p}${markerId})"/>` +
    `<line x1="${x}" y1="${y}" x2="${yEndX}" y2="${yEndY}" stroke="${color}" stroke-opacity="0.78" stroke-width="1.3" marker-end="url(#${p}${markerId})"/>` +
    `<line x1="${x}" y1="${y}" x2="${zEndX}" y2="${zEndY}" stroke="${color}" stroke-width="1.5" marker-end="url(#${p}${markerId})"/>` +
    `<circle cx="${x}" cy="${y}" r="2.6" fill="${color}"/>` +
    `</g>`;

  if (labels) {
    out +=
      (labels[0] ? labelText(Number(xEndX) + 6, Number(xEndY) + 3, labels[0], { color, size: 7.4, weight: '700' }) : '') +
      (labels[1] ? labelText(Number(yEndX) + 6, Number(yEndY) - 1, labels[1], { color, size: 7.4, weight: '600', opacity: '0.88' }) : '') +
      (labels[2] ? labelText(Number(zEndX), Number(zEndY) - 5, labels[2], { color, size: 7.4, weight: '700' }) : '');
  }
  return out;
}

/* ==========================================================================
   13. Robot Manipulator Kinematic Chains (robot-chain)
   ========================================================================== */
function renderRobotChain(d, p, isSetup, activeStepIndex) {
  const variant = fmt(d.variant, '2r-dh').toLowerCase();
  const arrowFilter = isSetup ? `${p}glow-boost` : '';
  const cueFilter = isSetup ? `${p}glow-soft` : '';
  const cueOp = isSetup ? '1' : '0.82';

  if (variant === '3r-mdh') {
    const convLabel = fmt(d.convention, 'Craig Proximal');
    const l2Label = pickSpecItem(d.links, 1, pickSpecItem(d.links, 0, 'L₂'));
    const l3Label = pickSpecItem(d.links, 2, pickSpecItem(d.links, 1, 'L₃'));
    const j1Label = pickSpecItem(d.joints, 0, 'θ₁');
    const j2Label = pickSpecItem(d.joints, 1, 'θ₂');
    const j3Label = pickSpecItem(d.joints, 2, 'θ₃');

    const body =
      labelText(14, 16, '3R SPATIAL ARM · MODIFIED DH', {
        color: COLORS.cyan,
        size: 7.2,
        weight: '700',
        anchor: 'start',
        opacity: '0.88',
        letterSpacing: '0.7',
      }) +
      pillBadge(352, 16, convLabel, COLORS.violet, {
        size: fitFontSize(convLabel, 108, 7.5, 6.6),
        padX: 8,
        h: 15,
        bg: 'rgba(167,139,250,0.13)',
        textColor: '#DDD6FE',
      }) +

      // Isometric base floor ellipse + vertical cylindrical pedestal
      `<ellipse cx="76" cy="120" rx="30" ry="8" fill="url(#${p}hatch)" fill-opacity="0.55" stroke="${COLORS.wall}" stroke-width="1.2"/>` +
      `<path d="M 62,92 L 62,118 A 14,4.8 0 0,0 90,118 L 90,92 Z" fill="url(#${p}glass-node)" stroke="${COLORS.wire}" stroke-width="1.35"/>` +
      `<ellipse cx="76" cy="92" rx="14" ry="4.8" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.3"/>` +
      // Pedestal riser column to shoulder
      `<rect x="69" y="62" width="14" height="30" fill="url(#${p}glass-node)" stroke="${COLORS.cyan}" stroke-opacity="0.65" stroke-width="1.15"/>` +

      // Offset d1 dimension bracket on left
      `<line x1="36" y1="62" x2="36" y2="120" stroke="${COLORS.muted}" stroke-width="1.05" stroke-dasharray="2.5 2"/>` +
      `<line x1="32" y1="62" x2="40" y2="62" stroke="${COLORS.muted}" stroke-width="1.2"/>` +
      `<line x1="32" y1="120" x2="40" y2="120" stroke="${COLORS.muted}" stroke-width="1.2"/>` +
      labelText(24, 94, 'd₁', { color: COLORS.muted, size: 8.6, weight: '700' }) +

      // Vertical z1 axis + yaw arc theta1
      `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
      `<line x1="76" y1="118" x2="76" y2="29" stroke="${COLORS.cyan}" stroke-width="1.65" stroke-dasharray="3.5 2.2" marker-end="url(#${p}arrow-cyan)"/>` +
      `</g>` +
      labelText(65, 34, 'z₁', { color: COLORS.cyan, size: 9.0, weight: '700' }) +
      `<path d="M 55,83 A 21,6.2 0 1,0 97,83" fill="none" stroke="${COLORS.cyan}" stroke-width="1.5" marker-end="url(#${p}arrow-cyan)" opacity="${cueOp}"/>` +
      labelText(107, 87, j1Label, { color: COLORS.cyan, size: 8.6, weight: '700', filter: cueFilter }) +

      // Link L2 (Shoulder -> Elbow)
      `<g transform="translate(76,62) rotate(-8.5)">` +
      `<rect x="-6" y="-7.5" width="132" height="15" rx="7.5" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.5"/>` +
      `<line x1="4" y1="-5.8" x2="116" y2="-5.8" stroke="rgba(255,255,255,0.22)" stroke-width="0.85"/>` +
      `<line x1="0" y1="0" x2="121" y2="0" stroke="${COLORS.cyan}" stroke-opacity="0.34" stroke-width="0.85" stroke-dasharray="3 2.5"/>` +
      `</g>` +
      labelText(136, 43, l2Label, { color: '#A5F3FC', size: 9.2, weight: '700' }) +

      // Link L3 (Elbow -> EE)
      `<g transform="translate(196,44) rotate(19.0)">` +
      `<rect x="-6" y="-6.8" width="134" height="13.6" rx="6.8" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.5"/>` +
      `<line x1="4" y1="-5.2" x2="118" y2="-5.2" stroke="rgba(255,255,255,0.2)" stroke-width="0.85"/>` +
      `<line x1="0" y1="0" x2="123" y2="0" stroke="${COLORS.amber}" stroke-opacity="0.34" stroke-width="0.85" stroke-dasharray="3 2.5"/>` +
      `</g>` +
      labelText(262, 55, l3Label, { color: '#FDE68A', size: 9.2, weight: '700' }) +

      // Shoulder Joint 2 (proximal frame {2}, horizontal z2, twist alpha1=90)
      `<circle cx="76" cy="62" r="11.5" fill="none" stroke="${COLORS.violet}" stroke-opacity="0.7" stroke-width="1.1" stroke-dasharray="2.5 2"/>` +
      `<circle cx="76" cy="62" r="7.5" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.75" filter="url(#${p}glow-soft)"/>` +
      `<circle cx="76" cy="62" r="2.7" fill="${COLORS.amber}"/>` +
      `<line x1="76" y1="62" x2="49" y2="76" stroke="${COLORS.amber}" stroke-width="1.65" marker-end="url(#${p}arrow-amber)"/>` +
      labelText(40, 79, 'z₂', { color: COLORS.amber, size: 8.8, weight: '700' }) +
      `<path d="M 96,60 A 20,20 0 0,0 91,48" fill="none" stroke="${COLORS.amber}" stroke-width="1.35" marker-end="url(#${p}arrow-amber)"/>` +
      labelText(104, 52, j2Label, { color: COLORS.amber, size: 8.4, weight: '700' }) +
      labelText(92, 74, '{2}', { color: COLORS.violet, size: 7.8, weight: '700' }) +

      // Alpha1 = 90° twist cue between z1 & z2
      `<path d="M 76,44 Q 62,48 59,66" fill="none" stroke="${COLORS.violet}" stroke-width="1.25" stroke-dasharray="2.2 1.8"/>` +
      pillBadge(126, 31, 'α₁ = 90°', COLORS.violet, {
        size: 7.4,
        padX: 6,
        h: 13.5,
        bg: 'rgba(167,139,250,0.14)',
        textColor: '#EDE9FE',
      }) +

      // Elbow Joint 3 (proximal frame {3}, z3 parallel to z2)
      `<circle cx="196" cy="44" r="11" fill="none" stroke="${COLORS.violet}" stroke-opacity="0.7" stroke-width="1.1" stroke-dasharray="2.5 2"/>` +
      `<circle cx="196" cy="44" r="7.2" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.75" filter="url(#${p}glow-soft)"/>` +
      `<circle cx="196" cy="44" r="2.6" fill="${COLORS.amber}"/>` +
      `<line x1="196" y1="44" x2="170" y2="58" stroke="${COLORS.amber}" stroke-width="1.6" marker-end="url(#${p}arrow-amber)"/>` +
      labelText(161, 61, 'z₃', { color: COLORS.amber, size: 8.8, weight: '700' }) +
      `<path d="M 218,45 A 22,22 0 0,1 215,56" fill="none" stroke="${COLORS.amber}" stroke-width="1.35" marker-end="url(#${p}arrow-amber)"/>` +
      labelText(228, 52, j3Label, { color: COLORS.amber, size: 8.4, weight: '700' }) +
      labelText(205, 31, '{3}', { color: COLORS.violet, size: 7.8, weight: '700' }) +

      // Proximal frame highlight badge at bottom center
      pillBadge(204, 121, 'Craig Proximal: {i} Attached to Joint i', COLORS.violet, {
        size: 7.4,
        padX: 8,
        h: 15,
        bg: 'rgba(7,11,20,0.92)',
        textColor: '#DDD6FE',
      }) +

      // End-Effector 3D Triad {e}
      `<g filter="url(#${p}glow-soft)">` +
      isoTriad(p, 312, 84, 24, COLORS.emerald, 'arrow-emerald', ['xₑ', 'yₑ', 'zₑ']) +
      `</g>` +
      labelText(366, 98, 'EE {e}', { color: COLORS.emerald, size: 8.8, weight: '700' }) +

      renderSubtitle(d.subtitle, 14, 143);

    return wrapSVG(p, `3R spatial articulated robot schematic with Craig Modified DH proximal frames (${convLabel})`, body);
  }

  if (variant === 'scara-rrp') {
    const convLabel = fmt(d.convention, 'SCARA RRP');
    const l1Label = pickSpecItem(d.links, 0, 'L₁');
    const l2Label = pickSpecItem(d.links, 1, 'L₂');
    const j1Label = pickSpecItem(d.joints, 0, 'θ₁');
    const j2Label = pickSpecItem(d.joints, 1, 'θ₂');
    const j3Label = pickSpecItem(d.joints, 2, 'd₃ ↓');

    const body =
      labelText(14, 16, '4-DOF SCARA · RRP(R)', {
        color: COLORS.cyan,
        size: 7.2,
        weight: '700',
        anchor: 'start',
        opacity: '0.88',
        letterSpacing: '0.7',
      }) +
      pillBadge(358, 16, convLabel, COLORS.violet, {
        size: fitFontSize(convLabel, 100, 7.5, 6.6),
        padX: 8,
        h: 15,
        bg: 'rgba(167,139,250,0.13)',
        textColor: '#DDD6FE',
      }) +

      // Isometric PCB Workplane on bottom-right
      `<polygon points="184,126 234,96 398,96 348,126" fill="rgba(52,211,153,0.08)" stroke="${COLORS.emerald}" stroke-opacity="0.58" stroke-width="1.2"/>` +
      // Subtle PCB copper trace pattern
      `<path d="M 218,118 L 246,118 L 258,111 L 284,111" fill="none" stroke="${COLORS.emerald}" stroke-opacity="0.34" stroke-width="0.9"/>` +
      `<path d="M 284,111 L 316,111 L 328,104 L 364,104" fill="none" stroke="${COLORS.emerald}" stroke-opacity="0.34" stroke-width="0.9"/>` +
      `<circle cx="284" cy="111" r="4.5" fill="rgba(52,211,153,0.18)" stroke="${COLORS.emerald}" stroke-width="1.1"/>` +
      `<circle cx="284" cy="111" r="1.6" fill="${COLORS.emerald}"/>` +
      labelText(334, 121, 'PCB WORKPLANE', { color: COLORS.emerald, size: 6.8, weight: '700', opacity: '0.86', letterSpacing: '0.5' }) +

      // Base Pedestal & Vertical Column
      `<ellipse cx="68" cy="122" rx="26" ry="7.2" fill="url(#${p}hatch)" fill-opacity="0.6" stroke="${COLORS.wall}" stroke-width="1.2"/>` +
      `<path d="M 55,48 L 55,120 A 13,4.2 0 0,0 81,120 L 81,48 Z" fill="url(#${p}glass-node)" stroke="${COLORS.wire}" stroke-width="1.4"/>` +
      `<ellipse cx="68" cy="48" rx="13" ry="4.4" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.45"/>` +
      // Upward z0 axis + yaw arc theta1
      `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
      `<line x1="68" y1="48" x2="68" y2="23" stroke="${COLORS.cyan}" stroke-width="1.7" marker-end="url(#${p}arrow-cyan)"/>` +
      `</g>` +
      labelText(48, 30, 'z₀ ↑', { color: COLORS.cyan, size: 8.8, weight: '700' }) +
      `<path d="M 48,54 A 20,6.2 0 1,0 88,54" fill="none" stroke="${COLORS.cyan}" stroke-width="1.4" marker-end="url(#${p}arrow-cyan)" opacity="${cueOp}"/>` +
      labelText(38, 59, j1Label, { color: COLORS.cyan, size: 8.6, weight: '700', filter: cueFilter }) +

      // Horizontal Link 1 (extruded 3D-like plate)
      `<path d="M 68,42 L 174,34 L 174,47 L 68,55 Z" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.5" stroke-linejoin="round"/>` +
      `<line x1="74" y1="43.5" x2="168" y2="36.2" stroke="rgba(255,255,255,0.22)" stroke-width="0.85"/>` +
      labelText(121, 30, l1Label, { color: '#A5F3FC', size: 9.2, weight: '700' }) +

      // Joint 2 Vertical Revolute Drum + theta2 arc
      `<path d="M 164,34 L 164,49 A 10,3.6 0 0,0 184,49 L 184,34 Z" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.4"/>` +
      `<ellipse cx="174" cy="34" rx="10" ry="3.6" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.5"/>` +
      `<path d="M 159,28 A 15,4.8 0 1,1 189,28" fill="none" stroke="${COLORS.amber}" stroke-width="1.35" marker-end="url(#${p}arrow-amber)"/>` +
      labelText(174, 21, j2Label, { color: COLORS.amber, size: 8.6, weight: '700' }) +

      // Horizontal Link 2 (extruded isometric arm plate)
      `<path d="M 174,35 L 284,50 L 284,63 L 174,48 Z" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.5" stroke-linejoin="round"/>` +
      `<line x1="181" y1="37.2" x2="278" y2="50.8" stroke="rgba(255,255,255,0.2)" stroke-width="0.85"/>` +
      labelText(231, 36, l2Label, { color: '#FDE68A', size: 9.2, weight: '700' }) +

      // Glowing Emerald Vertical Prismatic Quill
      `<ellipse cx="284" cy="54" rx="11" ry="4" fill="url(#${p}glass-emerald)" stroke="${COLORS.emerald}" stroke-width="1.55"/>` +
      `<g filter="url(#${p}glow-soft)">` +
      `<rect x="280.2" y="54" width="7.6" height="46" rx="2.5" fill="url(#${p}glass-emerald)" stroke="${COLORS.emerald}" stroke-width="1.5"/>` +
      `<polygon points="280.5,100 287.5,100 284,106" fill="${COLORS.emerald}"/>` +
      `</g>` +
      // Spline thread notches on quill
      `<line x1="281" y1="65" x2="287" y2="67" stroke="#A7F3D0" stroke-opacity="0.55" stroke-width="0.85"/>` +
      `<line x1="281" y1="74" x2="287" y2="76" stroke="#A7F3D0" stroke-opacity="0.55" stroke-width="0.85"/>` +
      `<line x1="281" y1="83" x2="287" y2="85" stroke="#A7F3D0" stroke-opacity="0.55" stroke-width="0.85"/>` +
      // Dashed alignment drop line to PCB pad
      `<line x1="284" y1="106" x2="284" y2="111" stroke="${COLORS.emerald}" stroke-width="1.15" stroke-dasharray="2 1.8"/>` +
      // Subtle theta4 wrist spin arc
      `<path d="M 271,94 A 13,4.2 0 1,0 297,94" fill="none" stroke="${COLORS.emerald}" stroke-opacity="0.65" stroke-width="1.1"/>` +

      // Double-headed vertical prismatic arrow d3 ↓ & alpha2=180° flip cue
      `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
      `<line x1="306" y1="60" x2="306" y2="99" stroke="${COLORS.emerald}" stroke-width="1.75" marker-start="url(#${p}arrow-emerald)" marker-end="url(#${p}arrow-emerald)"/>` +
      `</g>` +
      labelText(327, 82, j3Label, { color: COLORS.emerald, size: 9.2, weight: '700' }) +
      pillBadge(362, 56, 'α₂ = 180°', COLORS.violet, {
        size: 7.6,
        padX: 7,
        h: 15,
        bg: 'rgba(167,139,250,0.14)',
        textColor: '#EDE9FE',
      }) +
      labelText(362, 70, 'z₃ ↓ opp. z₀ ↑', { color: COLORS.muted, size: 7.0, weight: '600' }) +

      renderSubtitle(d.subtitle, 14, 143);

    return wrapSVG(p, `4-DOF SCARA RRP robot schematic with vertical prismatic quill (${convLabel})`, body);
  }

  if (variant === 'pieper-6dof') {
    const convLabel = fmt(d.convention, 'Pieper Decoupling');

    const body =
      labelText(14, 16, '6-DOF PIEPER KINEMATIC DECOUPLING', {
        color: COLORS.cyan,
        size: 7.2,
        weight: '700',
        anchor: 'start',
        opacity: '0.88',
        letterSpacing: '0.65',
      }) +
      pillBadge(346, 16, convLabel, COLORS.violet, {
        size: fitFontSize(convLabel, 118, 7.5, 6.6),
        padX: 8,
        h: 15,
        bg: 'rgba(167,139,250,0.13)',
        textColor: '#DDD6FE',
      }) +

      // Region 1 (Left): Luminous Dashed Cyan Box — Regional Arm (theta1, theta2, theta3)
      `<rect x="14" y="27" width="186" height="99" rx="9" fill="rgba(34,211,238,0.05)" stroke="${COLORS.cyan}" stroke-opacity="0.52" stroke-width="1.15" stroke-dasharray="4.5 3"/>` +
      labelText(107, 38, 'REGIONAL ARM (θ₁, θ₂, θ₃)', { color: COLORS.cyan, size: 7.2, weight: '700', letterSpacing: '0.35' }) +

      // Region 2 (Right): Luminous Dashed Amber Box — Spherical Wrist (theta4, theta5, theta6)
      `<rect x="208" y="27" width="198" height="99" rx="9" fill="rgba(245,158,11,0.05)" stroke="${COLORS.amber}" stroke-opacity="0.52" stroke-width="1.15" stroke-dasharray="4.5 3"/>` +
      labelText(307, 38, 'SPHERICAL WRIST (θ₄, θ₅, θ₆)', { color: COLORS.amber, size: 7.2, weight: '700', letterSpacing: '0.35' }) +

      // Base pedestal & theta1 yaw inside Region 1
      `<rect x="24" y="106" width="38" height="5.5" fill="url(#${p}hatch)" opacity="0.7"/>` +
      `<line x1="22" y1="106" x2="64" y2="106" stroke="${COLORS.wall}" stroke-width="1.3"/>` +
      `<rect x="35" y="84" width="16" height="22" rx="3" fill="url(#${p}glass-node)" stroke="${COLORS.cyan}" stroke-width="1.3"/>` +
      `<path d="M 27,97 A 16,4.8 0 1,0 59,97" fill="none" stroke="${COLORS.cyan}" stroke-width="1.25" marker-end="url(#${p}arrow-cyan)"/>` +
      labelText(24, 91, 'θ₁', { color: COLORS.cyan, size: 8.2, weight: '700' }) +

      // Upper arm (Shoulder -> Elbow) & Forearm (Elbow -> Wrist Center p_wc)
      `<line x1="43" y1="84" x2="108" y2="54" stroke="${COLORS.cyan}" stroke-width="6.5" stroke-linecap="round" stroke-opacity="0.28"/>` +
      `<line x1="43" y1="84" x2="108" y2="54" stroke="${COLORS.cyan}" stroke-width="2.1" stroke-linecap="round"/>` +
      `<line x1="108" y1="54" x2="256" y2="76" stroke="${COLORS.cyan}" stroke-width="5.5" stroke-linecap="round" stroke-opacity="0.24"/>` +
      `<line x1="108" y1="54" x2="256" y2="76" stroke="${COLORS.cyan}" stroke-width="1.9" stroke-linecap="round"/>` +

      // Shoulder & Elbow joints
      `<circle cx="43" cy="84" r="5.5" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.65"/>` +
      labelText(60, 88, 'θ₂', { color: COLORS.cyan, size: 8.2, weight: '700' }) +
      `<circle cx="108" cy="54" r="5.5" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.65"/>` +
      labelText(108, 46, 'θ₃', { color: COLORS.cyan, size: 8.2, weight: '700' }) +

      // Decoupling position equation inside Region 1 bottom
      labelText(107, 118, 'p_wc = p_e − d₆ z_e', { color: '#A5F3FC', size: 7.9, weight: '700' }) +

      // Spherical Wrist Center p_wc (Glowing Amber, 3 intersecting axes z4, z5, z6)
      `<circle cx="256" cy="76" r="19" fill="rgba(245,158,11,0.09)" stroke="${COLORS.amber}" stroke-opacity="0.58" stroke-width="1.2" stroke-dasharray="3 2.2"/>` +
      // Axis z4 (incoming)
      `<line x1="219" y1="85" x2="252" y2="77" stroke="${COLORS.amber}" stroke-width="1.5" marker-end="url(#${p}arrow-amber)"/>` +
      labelText(224, 74, 'z₄', { color: COLORS.amber, size: 8.0, weight: '700' }) +
      // Axis z5 (vertical-tilted)
      `<line x1="249" y1="102" x2="263" y2="49" stroke="${COLORS.amber}" stroke-width="1.5" marker-end="url(#${p}arrow-amber)"/>` +
      labelText(267, 48, 'z₅', { color: COLORS.amber, size: 8.0, weight: '700' }) +
      // Axis z6 (outgoing toward EE)
      `<line x1="256" y1="76" x2="305" y2="76" stroke="${COLORS.amber}" stroke-width="1.5" marker-end="url(#${p}arrow-amber)"/>` +
      labelText(286, 68, 'z₆', { color: COLORS.amber, size: 8.0, weight: '700' }) +
      // Glowing p_wc intersection point
      `<circle cx="256" cy="76" r="4.6" fill="${COLORS.amber}" filter="url(#${p}glow-boost)"/>` +
      labelText(256, 116, 'p_wc', { color: COLORS.amber, size: 9.0, weight: '700' }) +

      // Offset d6 z_e -> Emerald EE Pose (p_e, R_e)
      `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
      `<line x1="261" y1="76" x2="342" y2="76" stroke="${COLORS.emerald}" stroke-width="1.8" stroke-dasharray="3.2 2" marker-end="url(#${p}arrow-emerald)"/>` +
      `</g>` +
      labelText(308, 90, 'd₆ z_e', { color: COLORS.emerald, size: 8.1, weight: '700' }) +

      // Emerald EE Triad
      `<g filter="url(#${p}glow-soft)">` +
      isoTriad(p, 348, 76, 22, COLORS.emerald, 'arrow-emerald', ['xₑ', 'yₑ', 'zₑ']) +
      `</g>` +
      labelText(360, 116, '(p_e, R_e)', { color: COLORS.emerald, size: 8.6, weight: '700' }) +

      renderSubtitle(d.subtitle, 14, 143);

    return wrapSVG(p, `6-DOF industrial robot Pieper kinematic decoupling schematic (${convLabel})`, body);
  }

  // Default variant: '2r-dh' (2-Link Planar Robotic Arm)
  const convLabel = fmt(d.convention, 'Standard DH');
  const l1Label = pickSpecItem(d.links, 0, 'L₁');
  const l2Label = pickSpecItem(d.links, 1, 'L₂');
  const j1Label = pickSpecItem(d.joints, 0, 'θ₁');
  const j2Label = pickSpecItem(d.joints, 1, 'θ₂');

  const body =
    labelText(14, 16, '2R PLANAR MANIPULATOR', {
      color: COLORS.cyan,
      size: 7.3,
      weight: '700',
      anchor: 'start',
      opacity: '0.88',
      letterSpacing: '0.7',
    }) +
    pillBadge(354, 16, convLabel, COLORS.violet, {
      size: fitFontSize(convLabel, 108, 7.6, 6.6),
      padX: 8,
      h: 15,
      bg: 'rgba(167,139,250,0.13)',
      textColor: '#DDD6FE',
    }) +

    // Hatched Base Floor & Trapezoidal Pedestal on Left
    `<rect x="26" y="122" width="80" height="8" fill="url(#${p}hatch)" opacity="0.72"/>` +
    `<line x1="24" y1="122" x2="108" y2="122" stroke="${COLORS.wall}" stroke-width="1.6"/>` +
    `<path d="M 46,122 L 54,100 L 78,100 L 86,122 Z" fill="url(#${p}glass-node)" stroke="${COLORS.wire}" stroke-width="1.4"/>` +

    // Base Frame {0} axes (x0 right, y0 up, z0 out/in)
    `<line x1="66" y1="98" x2="132" y2="98" stroke="${COLORS.wire}" stroke-width="1.25" stroke-dasharray="3.2 2.2" marker-end="url(#${p}arrow-slate)"/>` +
    `<line x1="66" y1="98" x2="66" y2="40" stroke="${COLORS.wire}" stroke-width="1.25" stroke-dasharray="3.2 2.2" marker-end="url(#${p}arrow-slate)"/>` +
    labelText(139, 101, 'x₀', { color: COLORS.muted, size: 8.6, weight: '700' }) +
    labelText(66, 33, 'y₀', { color: COLORS.muted, size: 8.6, weight: '700' }) +
    labelText(34, 86, '{0}', { color: COLORS.cyan, size: 8.6, weight: '700' }) +
    labelText(34, 99, 'z₀⊗', { color: COLORS.muted, size: 8.0, weight: '600' }) +

    // Link 1 Extension Reference Ray x1 (from Joint 2 along -20.77 deg)
    `<line x1="182" y1="54" x2="229" y2="36.2" stroke="${COLORS.wire}" stroke-width="1.15" stroke-dasharray="3 2.2" marker-end="url(#${p}arrow-slate)"/>` +
    labelText(237, 35, 'x₁', { color: COLORS.muted, size: 8.4, weight: '700' }) +
    labelText(171, 37, '{1}', { color: COLORS.amber, size: 8.4, weight: '700' }) +

    // Anodized Glass Link 1 (J1=(66,98) -> J2=(182,54), angle=-20.77 deg, len=124.1)
    `<g transform="translate(66,98) rotate(-20.77)">` +
    `<rect x="-8" y="-8.5" width="140" height="17" rx="8.5" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.55"/>` +
    `<line x1="5" y1="-6.8" x2="120" y2="-6.8" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>` +
    `<line x1="0" y1="0" x2="124" y2="0" stroke="${COLORS.cyan}" stroke-opacity="0.34" stroke-width="0.9" stroke-dasharray="3 2.5"/>` +
    `</g>` +
    labelText(118, 59, l1Label, { color: '#A5F3FC', size: 9.8, weight: '700' }) +

    // Anodized Glass Link 2 (J2=(182,54) -> EE=(304,78), angle=+11.13 deg, len=124.3)
    `<g transform="translate(182,54) rotate(11.13)">` +
    `<rect x="-7" y="-7.5" width="138" height="15" rx="7.5" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.55"/>` +
    `<line x1="5" y1="-5.8" x2="119" y2="-5.8" stroke="rgba(255,255,255,0.2)" stroke-width="0.85"/>` +
    `<line x1="0" y1="0" x2="124" y2="0" stroke="${COLORS.amber}" stroke-opacity="0.34" stroke-width="0.9" stroke-dasharray="3 2.5"/>` +
    `</g>` +
    labelText(242, 89, l2Label, { color: '#FDE68A', size: 9.8, weight: '700' }) +

    // Joint 1 angle arc theta1 (Cyan)
    `<g opacity="${cueOp}"${cueFilter ? ` filter="url(#${cueFilter})"` : ''}>` +
    `<path d="M 103,98 A 37,37 0 0,0 100.6,84.9" fill="none" stroke="${COLORS.cyan}" stroke-width="1.55" marker-end="url(#${p}arrow-cyan)"/>` +
    labelText(114, 89, j1Label, { color: COLORS.cyan, size: 9.2, weight: '700' }) +
    `</g>` +

    // Joint 2 angle arc theta2 (Amber)
    `<g opacity="${cueOp}"${cueFilter ? ` filter="url(#${cueFilter})"` : ''}>` +
    `<path d="M 214.7,41.6 A 35,35 0 0,1 216.3,60.8" fill="none" stroke="${COLORS.amber}" stroke-width="1.55" marker-end="url(#${p}arrow-amber)"/>` +
    labelText(230, 52, j2Label, { color: COLORS.amber, size: 9.2, weight: '700' }) +
    `</g>` +

    // Glowing Cyan Joint 1 Pin
    `<g filter="url(#${p}glow-soft)">` +
    `<circle cx="66" cy="98" r="8.5" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.85"/>` +
    `<circle cx="66" cy="98" r="3.2" fill="${COLORS.cyan}"/>` +
    `</g>` +

    // Glowing Amber Joint 2 Pin
    `<g filter="url(#${p}glow-soft)">` +
    `<circle cx="182" cy="54" r="7.8" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.85"/>` +
    `<circle cx="182" cy="54" r="3.0" fill="${COLORS.amber}"/>` +
    `</g>` +

    // End-Effector Emerald Triad {2} (x, y)
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<line x1="304" y1="78" x2="346" y2="86.2" stroke="${COLORS.emerald}" stroke-width="1.75" marker-end="url(#${p}arrow-emerald)"/>` +
    `<line x1="304" y1="78" x2="312.2" y2="39" stroke="${COLORS.emerald}" stroke-width="1.75" marker-end="url(#${p}arrow-emerald)"/>` +
    `<circle cx="304" cy="78" r="5.0" fill="url(#${p}glass-emerald)" stroke="${COLORS.emerald}" stroke-width="1.75"/>` +
    `<circle cx="304" cy="78" r="2.0" fill="${COLORS.emerald}"/>` +
    `</g>` +
    labelText(355, 89, 'x₂', { color: COLORS.emerald, size: 8.8, weight: '700' }) +
    labelText(315, 34, 'y₂', { color: COLORS.emerald, size: 8.8, weight: '700' }) +
    pillBadge(356, 112, '{2} (x, y)', COLORS.emerald, {
      size: 8.2,
      padX: 8,
      h: 16,
      bg: 'rgba(52,211,153,0.12)',
      textColor: '#A7F3D0',
    }) +

    renderSubtitle(d.subtitle, 14, 143);

  return wrapSVG(p, `2R planar robot manipulator schematic (${convLabel}): links ${l1Label}, ${l2Label}`, body);
}

/* ==========================================================================
   14. Screw Theory & Product of Exponentials (screw-poe)
   ========================================================================== */
function renderScrewPoE(d, p, isSetup, activeStepIndex) {
  const variant = fmt(d.variant, 'poe-3r').toLowerCase();
  const arrowFilter = isSetup ? `${p}glow-boost` : '';
  const cueFilter = isSetup ? `${p}glow-soft` : '';

  if (variant === 'rodrigues') {
    const screwLabel = fmt(d.screw, 'S = (ω, v)');
    const mapLabel = fmt(d.map, 'exp([S]θ)');
    const poseLabel = fmt(d.formula, 'R ∈ SO(3), p ∈ ℝ³');

    const body =
      labelText(14, 15, 'EXPONENTIAL MAP · SCREW MOTION', {
        color: COLORS.cyan,
        size: 7.2,
        weight: '700',
        anchor: 'start',
        opacity: '0.88',
        letterSpacing: '0.7',
      }) +

      // Left Dark-Glass Card: Lie Algebra se(3)
      `<rect x="14" y="23" width="178" height="106" rx="9" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.65"/>` +
      `<line x1="21" y1="24.3" x2="185" y2="24.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>` +
      labelText(103, 35.5, 'LIE ALGEBRA  se(3)', { color: COLORS.cyan, size: 7.3, weight: '700', letterSpacing: '0.55' }) +
      labelText(52, 51, screwLabel, {
        color: '#A5F3FC',
        size: fitFontSize(screwLabel, 68, 7.8, 6.6),
        weight: '700',
      }) +

      // Origin O and offset vector q to point q on screw axis
      `<circle cx="36" cy="110" r="2.6" fill="${COLORS.wire}"/>` +
      labelText(27, 114, 'O', { color: COLORS.muted, size: 8.2, weight: '700' }) +
      `<line x1="38.5" y1="109" x2="88" y2="87.5" stroke="${COLORS.wire}" stroke-width="1.35" stroke-dasharray="3 2" marker-end="url(#${p}arrow-slate)"/>` +
      labelText(62, 108, 'q', { color: COLORS.muted, size: 8.5, weight: '700' }) +

      // Glowing Cyan Screw Axis omega passing through q=(92,86)
      `<g filter="url(#${p}glow-soft)">` +
      `<line x1="75" y1="115" x2="122" y2="42" stroke="${COLORS.cyan}" stroke-width="2.0" marker-end="url(#${p}arrow-cyan)"/>` +
      `</g>` +
      labelText(133, 47, 'ω', { color: COLORS.cyan, size: 9.6, weight: '700' }) +

      // Helical twist arc theta wrapping around axis
      `<path d="M 94,63 C 90,54 114,52 121,62 C 125,68 117,74 109,73" fill="none" stroke="${COLORS.violet}" stroke-width="1.5" marker-end="url(#${p}arrow-violet)"/>` +
      labelText(135, 67, 'θ', { color: '#DDD6FE', size: 9.0, weight: '700' }) +

      // Point q on axis + Amber tangential vector v = -omega x q
      `<circle cx="92" cy="86" r="3.4" fill="${COLORS.amber}" filter="url(#${p}glow-soft)"/>` +
      `<line x1="94.5" y1="86.7" x2="145" y2="98" stroke="${COLORS.amber}" stroke-width="1.75" marker-end="url(#${p}arrow-amber)"/>` +
      labelText(144, 114, 'v = −ω × q', { color: COLORS.amber, size: 7.9, weight: '700' }) +

      // Center Exponential Map Bridge: exp([S]theta)
      `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
      `<line x1="196" y1="76" x2="255" y2="76" stroke="${COLORS.emerald}" stroke-width="2.05" marker-end="url(#${p}arrow-emerald)"/>` +
      `</g>` +
      labelText(226, 65, mapLabel, {
        color: COLORS.emerald,
        size: fitFontSize(mapLabel, 64, 8.8, 7.0),
        weight: '700',
      }) +
      labelText(226, 90, 'Rodrigues', { color: COLORS.violet, size: 7.4, weight: '600' }) +

      // Right Dark-Glass Card: Lie Group SE(3)
      `<rect x="260" y="23" width="146" height="106" rx="9" fill="url(#${p}glass-emerald)" stroke="${COLORS.emerald}" stroke-width="1.65"/>` +
      `<line x1="267" y1="24.3" x2="399" y2="24.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>` +
      labelText(333, 35.5, 'LIE GROUP  SE(3)', { color: COLORS.emerald, size: 7.3, weight: '700', letterSpacing: '0.55' }) +

      // Rigid-body displacement arc from initial frame to transformed frame
      `<g opacity="0.52">` +
      isoTriad(p, 282, 82, 16, COLORS.wire, 'arrow-slate') +
      `</g>` +
      `<path d="M 285,78 Q 315,49 343,65" fill="none" stroke="${COLORS.emerald}" stroke-width="1.35" stroke-dasharray="3 2" marker-end="url(#${p}arrow-emerald)"/>` +
      `<g filter="url(#${p}glow-soft)">` +
      isoTriad(p, 348, 68, 20, COLORS.emerald, 'arrow-emerald') +
      `</g>` +
      labelText(378, 72, 'T', { color: COLORS.emerald, size: 9.0, weight: '700' }) +

      // SE(3) Rigid-body pose summary
      labelText(333, 102, poseLabel, {
        color: COLORS.text,
        size: fitFontSize(poseLabel, 134, 8.4, 6.8),
        weight: '700',
      }) +
      labelText(333, 118, 'T(θ) = e^[S]θ ∈ SE(3)', { color: '#A7F3D0', size: 7.6, weight: '600' }) +

      renderSubtitle(d.subtitle, 14, 143);

    return wrapSVG(p, `Screw motion exponential map schematic from Lie algebra se(3) to Lie group SE(3): ${mapLabel}`, body);
  }

  if (variant === 'body-adjoint') {
    const mapLabel = fmt(d.map, 'Ad_T / Ad_Tᵀ');
    const bodyFormula = fmt(d.formula, 'T = M·e^[B₁]θ₁…');
    const bottomNote = fmt(d.screw, 'Bᵢ = Ad_{M⁻¹} Sᵢ  ·  Power Invariant');

    const body =
      labelText(14, 15, 'SPACE ↔ BODY ADJOINT DUALITY', {
        color: COLORS.cyan,
        size: 7.2,
        weight: '700',
        anchor: 'start',
        opacity: '0.88',
        letterSpacing: '0.7',
      }) +
      pillBadge(340, 15, bodyFormula, COLORS.emerald, {
        size: fitFontSize(bodyFormula, 126, 7.6, 6.6),
        padX: 8,
        h: 15,
        bg: 'rgba(52,211,153,0.12)',
        textColor: '#A7F3D0',
      }) +

      // Left Cyan Card: Space Frame {s}
      `<rect x="16" y="28" width="132" height="80" rx="9" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.65"/>` +
      `<line x1="23" y1="29.3" x2="141" y2="29.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>` +
      labelText(82, 41, 'SPACE FRAME  {s}', { color: COLORS.cyan, size: 7.4, weight: '700', letterSpacing: '0.45' }) +
      isoTriad(p, 35, 72, 13, COLORS.cyan, 'arrow-cyan') +
      labelText(96, 66, 'Sᵢ ,  V_s', { color: COLORS.text, size: 10.6, weight: '700' }) +
      labelText(96, 84, 'Wrench: F_s', { color: '#FDE68A', size: 8.1, weight: '600' }) +
      labelText(82, 99, 'Fixed Base', { color: COLORS.muted, size: 7.1, weight: '500' }) +

      // Right Emerald Card: Body Frame {b}
      `<rect x="272" y="28" width="132" height="80" rx="9" fill="url(#${p}glass-emerald)" stroke="${COLORS.emerald}" stroke-width="1.65"/>` +
      `<line x1="279" y1="29.3" x2="397" y2="29.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>` +
      labelText(338, 41, 'BODY FRAME  {b}', { color: COLORS.emerald, size: 7.4, weight: '700', letterSpacing: '0.45' }) +
      isoTriad(p, 291, 72, 13, COLORS.emerald, 'arrow-emerald') +
      labelText(352, 66, 'Bᵢ ,  V_b', { color: COLORS.text, size: 10.6, weight: '700' }) +
      labelText(352, 84, 'Wrench: F_b', { color: '#FDE68A', size: 8.1, weight: '600' }) +
      labelText(338, 99, 'End-Effector', { color: COLORS.muted, size: 7.1, weight: '500' }) +

      // Center Top Bidirectional Adjoint Twist Channel
      `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
      `<line x1="154" y1="54" x2="266" y2="54" stroke="${COLORS.violet}" stroke-width="1.85" marker-start="url(#${p}arrow-cyan)" marker-end="url(#${p}arrow-emerald)"/>` +
      `</g>` +
      labelText(210, 42, mapLabel, {
        color: COLORS.violet,
        size: fitFontSize(mapLabel, 112, 8.6, 7.0),
        weight: '700',
      }) +
      labelText(210, 66, 'V_s = Ad_T V_b', { color: '#DDD6FE', size: 7.8, weight: '600' }) +

      // Center Bottom Dual Wrench Arrow: F_b = Ad^T F_s
      `<line x1="154" y1="90" x2="266" y2="90" stroke="${COLORS.amber}" stroke-width="1.75" marker-end="url(#${p}arrow-amber)"/>` +
      labelText(210, 82, 'F_b = Adᵀ F_s', { color: COLORS.amber, size: 8.4, weight: '700', filter: cueFilter }) +
      labelText(210, 102, 'V_sᵀ F_s = V_bᵀ F_b', { color: COLORS.muted, size: 7.0, weight: '600' }) +

      // Bottom Summary Pill
      pillBadge(210, 124, bottomNote, COLORS.violet, {
        size: fitFontSize(bottomNote, 260, 7.5, 6.6),
        padX: 9,
        h: 15,
        bg: 'rgba(7,11,20,0.92)',
        textColor: '#DDD6FE',
      }) +

      renderSubtitle(d.subtitle, 14, 143);

    return wrapSVG(p, `Space and Body frame Adjoint duality schematic: ${mapLabel}, ${bodyFormula}`, body);
  }

  // Default variant: 'poe-3r' (Zero-Intermediate-Frame PoE Spatial Chain)
  const poeBadge = fmt(d.map, 'Only 2 Frames: {s} & {b}');
  const poeFormula = fmt(d.formula, 'T(θ) = e^[S₁]θ₁ · e^[S₂]θ₂ · e^[S₃]θ₃ · M');

  const body =
    labelText(14, 16, 'PRODUCT OF EXPONENTIALS (PoE)', {
      color: COLORS.cyan,
      size: 7.2,
      weight: '700',
      anchor: 'start',
      opacity: '0.88',
      letterSpacing: '0.7',
    }) +
    pillBadge(334, 16, poeBadge, COLORS.violet, {
      size: fitFontSize(poeBadge, 142, 7.4, 6.5),
      padX: 8,
      h: 15,
      bg: 'rgba(167,139,250,0.13)',
      textColor: '#DDD6FE',
    }) +

    // Base Frame {s} (Cyan 3D Triad)
    `<g filter="url(#${p}glow-soft)">` +
    isoTriad(p, 46, 104, 21, COLORS.cyan, 'arrow-cyan', ['xₛ', 'yₛ', 'zₛ']) +
    `</g>` +
    labelText(24, 106, '{s}', { color: COLORS.cyan, size: 9.4, weight: '700' }) +

    // Sleek dark-glass spatial chain links (zero intermediate coordinate frames!)
    `<line x1="46" y1="104" x2="88" y2="92" stroke="${COLORS.wire}" stroke-width="2.2" stroke-dasharray="3 2" stroke-opacity="0.7"/>` +
    // Link 1: J1=(88,92) -> J2=(174,64)
    `<line x1="88" y1="92" x2="174" y2="64" stroke="${COLORS.wire}" stroke-width="8" stroke-linecap="round" stroke-opacity="0.22"/>` +
    `<line x1="88" y1="92" x2="174" y2="64" stroke="${COLORS.wire}" stroke-width="2.2" stroke-linecap="round"/>` +
    // Link 2: J2=(174,64) -> J3=(264,68)
    `<line x1="174" y1="64" x2="264" y2="68" stroke="${COLORS.wire}" stroke-width="7.5" stroke-linecap="round" stroke-opacity="0.22"/>` +
    `<line x1="174" y1="64" x2="264" y2="68" stroke="${COLORS.wire}" stroke-width="2.2" stroke-linecap="round"/>` +
    // Link 3: J3=(264,68) -> Home Pose {b}=(348,86)
    `<line x1="264" y1="68" x2="348" y2="86" stroke="${COLORS.wire}" stroke-width="7" stroke-linecap="round" stroke-opacity="0.22"/>` +
    `<line x1="264" y1="68" x2="348" y2="86" stroke="${COLORS.wire}" stroke-width="2.2" stroke-linecap="round"/>` +

    // Three dark-glass joint rings (no intermediate frames attached)
    `<circle cx="88" cy="92" r="6.8" fill="url(#${p}glass-node)" stroke="${COLORS.violet}" stroke-width="1.6"/>` +
    `<circle cx="174" cy="64" r="6.8" fill="url(#${p}glass-node)" stroke="${COLORS.violet}" stroke-width="1.6"/>` +
    `<circle cx="264" cy="68" r="6.8" fill="url(#${p}glass-node)" stroke="${COLORS.violet}" stroke-width="1.6"/>` +

    // Glowing Violet Helical Screw Axis S1 piercing Joint 1
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<line x1="88" y1="115" x2="88" y2="38" stroke="${COLORS.violet}" stroke-width="1.85" marker-end="url(#${p}arrow-violet)"/>` +
    `</g>` +
    `<path d="M 75,65 A 13,4.5 0 1,0 101,65" fill="none" stroke="${COLORS.violet}" stroke-width="1.35" marker-end="url(#${p}arrow-violet)"/>` +
    labelText(88, 31, 'S₁', { color: COLORS.violet, size: 9.2, weight: '700' }) +

    // Glowing Violet Helical Screw Axis S2 piercing Joint 2
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<line x1="152" y1="90" x2="196" y2="39" stroke="${COLORS.violet}" stroke-width="1.85" marker-end="url(#${p}arrow-violet)"/>` +
    `</g>` +
    `<path d="M 176,52 C 172,44 190,44 193,52 C 195,58 187,62 181,60" fill="none" stroke="${COLORS.violet}" stroke-width="1.3" marker-end="url(#${p}arrow-violet)"/>` +
    labelText(206, 37, 'S₂', { color: COLORS.violet, size: 9.2, weight: '700' }) +

    // Glowing Violet Helical Screw Axis S3 piercing Joint 3
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<line x1="244" y1="94" x2="284" y2="43" stroke="${COLORS.violet}" stroke-width="1.85" marker-end="url(#${p}arrow-violet)"/>` +
    `</g>` +
    `<path d="M 265,56 C 261,48 279,48 282,56 C 284,62 276,66 270,64" fill="none" stroke="${COLORS.violet}" stroke-width="1.3" marker-end="url(#${p}arrow-violet)"/>` +
    labelText(294, 41, 'S₃', { color: COLORS.violet, size: 9.2, weight: '700' }) +

    // Home Pose Frame {b} M (Emerald 3D Triad)
    `<g filter="url(#${p}glow-soft)">` +
    isoTriad(p, 348, 86, 22, COLORS.emerald, 'arrow-emerald', ['x_b', 'y_b', 'z_b']) +
    `</g>` +
    labelText(384, 72, '{b}  M', { color: COLORS.emerald, size: 9.0, weight: '700' }) +

    // Bottom Centered PoE Formula Pill
    pillBadge(210, 124, poeFormula, COLORS.violet, {
      size: fitFontSize(poeFormula, 330, 8.2, 6.8),
      padX: 10,
      h: 16,
      bg: 'rgba(7,11,20,0.94)',
      textColor: '#EDE9FE',
    }) +

    renderSubtitle(d.subtitle, 14, 143);

  return wrapSVG(p, `3R Product of Exponentials (PoE) screw-axis schematic: ${poeFormula}`, body);
}

/* ==========================================================================
   15. Inverse Kinematics & Differential Solver Architectures (ik-solver-arch)
   ========================================================================== */
function renderIkSolverArch(d, p, isSetup, activeStepIndex) {
  const variant = fmt(d.variant, 'jacobian-ellipsoid').toLowerCase();
  const arrowFilter = isSetup ? `${p}glow-boost` : '';
  const cueFilter = isSetup ? `${p}glow-soft` : '';

  if (variant === 'dls-nullspace') {
    const dlsLaw = fmt(d.law, 'Jᵀ(JJᵀ + λ²I)⁻¹');
    const badgeText = fmt(d.badge, 'J·N = 0');

    const body =
      labelText(14, 15, 'DAMPED LEAST SQUARES + NULLSPACE IK', {
        color: COLORS.cyan,
        size: 7.2,
        weight: '700',
        anchor: 'start',
        opacity: '0.88',
        letterSpacing: '0.65',
      }) +
      pillBadge(366, 15, badgeText, COLORS.violet, {
        size: fitFontSize(badgeText, 92, 7.6, 6.6),
        padX: 8,
        h: 14.5,
        bg: 'rgba(167,139,250,0.14)',
        textColor: '#DDD6FE',
      }) +

      // Top Primary Task Branch: e -> DLS Inverse -> Sum
      `<circle cx="22" cy="49" r="3" fill="${COLORS.cyan}" filter="url(#${p}glow-soft)"/>` +
      labelText(22, 40, 'e', { color: COLORS.cyan, size: 9.6, weight: '700' }) +
      labelText(34, 62, 'task', { color: COLORS.muted, size: 7.0, weight: '600' }) +
      `<line x1="25" y1="49" x2="60" y2="49" stroke="${COLORS.cyan}" stroke-width="1.75" marker-end="url(#${p}arrow-cyan)"/>` +

      // Cyan Glass Box: DLS Inverse
      `<rect x="64" y="27" width="186" height="44" rx="8" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.7"/>` +
      `<line x1="71" y1="28.3" x2="243" y2="28.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>` +
      labelText(157, 39, 'PRIMARY · DLS INVERSE', { color: COLORS.cyan, size: 7.1, weight: '700', letterSpacing: '0.45' }) +
      labelText(157, 57, dlsLaw, {
        color: COLORS.text,
        size: fitFontSize(dlsLaw, 170, 10.2, 7.5),
        weight: '700',
      }) +

      // Top Branch to Summing Junction
      `<path d="M 250,49 L 310,49 Q 314,49 314,53 L 314,61" fill="none" stroke="${COLORS.cyan}" stroke-width="1.7" stroke-linejoin="round" marker-end="url(#${p}arrow-cyan)"/>` +
      labelText(282, 42, 'q̇_task', { color: '#A5F3FC', size: 7.8, weight: '700' }) +

      // Bottom Secondary Task Branch: qdot_0 -> Nullspace Projector -> Sum
      `<circle cx="22" cy="104" r="3" fill="${COLORS.violet}" filter="url(#${p}glow-soft)"/>` +
      labelText(22, 95, 'q̇₀', { color: COLORS.violet, size: 9.4, weight: '700' }) +
      labelText(34, 118, 'posture', { color: COLORS.muted, size: 7.0, weight: '600' }) +
      `<line x1="25" y1="104" x2="60" y2="104" stroke="${COLORS.violet}" stroke-width="1.75" marker-end="url(#${p}arrow-violet)"/>` +

      // Violet Glass Box: Nullspace Projector
      `<rect x="64" y="82" width="186" height="44" rx="8" fill="url(#${p}glass-violet)" stroke="${COLORS.violet}" stroke-width="1.7"/>` +
      `<line x1="71" y1="83.3" x2="243" y2="83.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>` +
      labelText(157, 94, 'SECONDARY · NULLSPACE N', { color: COLORS.violet, size: 7.1, weight: '700', letterSpacing: '0.45' }) +
      labelText(157, 112, 'N = I − J⁺J', { color: COLORS.text, size: 10.4, weight: '700' }) +

      // Bottom Branch to Summing Junction + J*N = 0 tag
      `<path d="M 250,104 L 310,104 Q 314,104 314,100 L 314,91" fill="none" stroke="${COLORS.violet}" stroke-width="1.7" stroke-linejoin="round" marker-end="url(#${p}arrow-violet)"/>` +
      labelText(282, 116, 'N·q̇₀', { color: '#DDD6FE', size: 7.8, weight: '700' }) +
      labelText(282, 94, 'J·N = 0', { color: COLORS.violet, size: 7.3, weight: '700', filter: cueFilter }) +

      // Summing Junction Sigma
      `<circle cx="314" cy="76" r="13" fill="url(#${p}glass-node)" stroke="${COLORS.emerald}" stroke-width="1.8" filter="url(#${p}glow-soft)"/>` +
      labelText(314, 80, 'Σ', { color: COLORS.text, size: 11.5, weight: '700' }) +
      labelText(303, 62, '+', { color: COLORS.cyan, size: 8.6, weight: '700' }) +
      labelText(303, 94, '+', { color: COLORS.violet, size: 8.6, weight: '700' }) +

      // Output Arrow -> Emerald qdot
      `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
      `<line x1="327" y1="76" x2="368" y2="76" stroke="${COLORS.emerald}" stroke-width="2.0" marker-end="url(#${p}arrow-emerald)"/>` +
      `</g>` +
      `<rect x="372" y="61" width="34" height="30" rx="7" fill="url(#${p}glass-emerald)" stroke="${COLORS.emerald}" stroke-width="1.7"/>` +
      `<line x1="377" y1="62.2" x2="401" y2="62.2" stroke="rgba(255,255,255,0.22)" stroke-width="0.85"/>` +
      labelText(389, 80, 'q̇', { color: COLORS.text, size: 11.8, weight: '700' }) +

      renderSubtitle(d.subtitle, 14, 143);

    return wrapSVG(p, `Damped Least Squares and Nullspace Projector IK block diagram (${dlsLaw}, ${badgeText})`, body);
  }

  if (variant === 'qp-ik-se3') {
    const qpObj = fmt(d.law, 'min Σ wᵢ‖Jᵢq̇−vᵢ*‖² + λ‖q̇‖²');
    const badgeText = fmt(d.badge, 'SE(3) Diff-IK');

    const body =
      labelText(14, 15, 'PINK / MINK · DIFFERENTIAL QP-IK', {
        color: COLORS.cyan,
        size: 7.2,
        weight: '700',
        anchor: 'start',
        opacity: '0.88',
        letterSpacing: '0.65',
      }) +
      pillBadge(358, 15, badgeText, COLORS.emerald, {
        size: fitFontSize(badgeText, 102, 7.5, 6.6),
        padX: 8,
        h: 14.5,
        bg: 'rgba(52,211,153,0.12)',
        textColor: '#A7F3D0',
      }) +

      // Left Cyan Box: SE(3) Log Error
      `<rect x="14" y="28" width="96" height="62" rx="8" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.65"/>` +
      `<line x1="20" y1="29.3" x2="104" y2="29.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.85"/>` +
      labelText(62, 41, 'SE(3) LOG ERR', { color: COLORS.cyan, size: 7.0, weight: '700', letterSpacing: '0.4' }) +
      labelText(62, 58, 'e = log(T⁻¹T_d)∨', { color: COLORS.text, size: 7.9, weight: '700' }) +
      labelText(62, 74, 'v* = (α/Δt) e', { color: '#A5F3FC', size: 7.4, weight: '600' }) +

      // Arrow 1: v*
      `<line x1="110" y1="59" x2="129" y2="59" stroke="${COLORS.cyan}" stroke-width="1.75" marker-end="url(#${p}arrow-cyan)"/>` +
      labelText(120, 50, 'v*', { color: COLORS.cyan, size: 8.4, weight: '700' }) +

      // Center Double-Bordered Violet/Emerald Box: Real-Time QP Solver
      `<rect x="133" y="25" width="168" height="68" rx="9" fill="url(#${p}glass-violet)" stroke="${COLORS.violet}" stroke-width="1.7"/>` +
      `<rect x="136.5" y="28.5" width="161" height="61" rx="6.5" fill="none" stroke="${COLORS.emerald}" stroke-opacity="0.62" stroke-width="0.95"/>` +
      `<line x1="142" y1="26.3" x2="292" y2="26.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>` +
      labelText(217, 39, 'REAL-TIME QP SOLVER', { color: COLORS.violet, size: 7.2, weight: '700', letterSpacing: '0.5' }) +
      labelText(217, 56, qpObj, {
        color: COLORS.text,
        size: fitFontSize(qpObj, 152, 7.6, 6.4),
        weight: '700',
      }) +
      `<line x1="146" y1="64" x2="288" y2="64" stroke="rgba(167,139,250,0.3)" stroke-width="0.8"/>` +
      labelText(217, 78, 's.t. q_min ≤ q+q̇Δt ≤ q_max', { color: '#A7F3D0', size: 7.1, weight: '600' }) +

      // Arrow 2: qdot*
      `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
      `<line x1="301" y1="59" x2="323" y2="59" stroke="${COLORS.emerald}" stroke-width="1.95" marker-end="url(#${p}arrow-emerald)"/>` +
      `</g>` +
      labelText(312, 50, 'q̇*', { color: COLORS.emerald, size: 9.0, weight: '700' }) +

      // Right Emerald Box: Robot / MuJoCo
      `<rect x="327" y="28" width="79" height="62" rx="8" fill="url(#${p}glass-emerald)" stroke="${COLORS.emerald}" stroke-width="1.65"/>` +
      `<line x1="333" y1="29.3" x2="400" y2="29.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.85"/>` +
      labelText(366.5, 42, 'ROBOT', { color: COLORS.emerald, size: 7.4, weight: '700', letterSpacing: '0.45' }) +
      labelText(366.5, 53.5, '/ MuJoCo', { color: '#A7F3D0', size: 7.5, weight: '600' }) +
      labelText(366.5, 71, 'q ← q + q̇*Δt', { color: COLORS.text, size: 7.3, weight: '700' }) +
      labelText(366.5, 83, 'FK(q)', { color: COLORS.muted, size: 6.9, weight: '600' }) +

      // Feedback Loop: q, T_curr(q) -> SE(3) Log Error & QP Solver tap
      `<path d="M 366.5,90 L 366.5,113 Q 366.5,117 362.5,117 L 66,117 Q 62,117 62,113 L 62,92" fill="none" stroke="${COLORS.cyan}" stroke-width="1.6" stroke-linejoin="round" marker-end="url(#${p}arrow-cyan)"/>` +
      `<line x1="217" y1="109" x2="217" y2="95" stroke="${COLORS.violet}" stroke-width="1.35" stroke-dasharray="2.5 2" marker-end="url(#${p}arrow-violet)"/>` +
      pillBadge(217, 117, 'q,  T_curr(q)', COLORS.cyan, {
        size: 7.8,
        padX: 10,
        h: 15,
        bg: 'rgba(7,11,20,0.95)',
        textColor: '#A5F3FC',
      }) +

      renderSubtitle(d.subtitle, 14, 143);

    return wrapSVG(p, `Pink and Mink Differential SE(3) QP-IK closed-loop architecture schematic (${badgeText})`, body);
  }

  // Default variant: 'jacobian-ellipsoid' (Manipulability Ellipsoid + Velocity/Force Duality)
  const metricText = fmt(d.metric, fmt(d.badge, 'w = √det(JJᵀ)'));
  const velLaw = fmt(d.law, 'v = J(θ) θ̇');

  const body =
    labelText(14, 15, 'JACOBIAN ELLIPSOID & FORCE DUALITY', {
      color: COLORS.cyan,
      size: 7.2,
      weight: '700',
      anchor: 'start',
      opacity: '0.88',
      letterSpacing: '0.65',
    }) +
    pillBadge(350, 15, metricText, COLORS.violet, {
      size: fitFontSize(metricText, 114, 7.6, 6.6),
      padX: 8,
      h: 14.5,
      bg: 'rgba(167,139,250,0.13)',
      textColor: '#DDD6FE',
    }) +

    // Left Panel: Isometric Manipulability Ellipsoid
    `<rect x="14" y="24" width="190" height="106" rx="9" fill="rgba(7,11,20,0.74)" stroke="rgba(34,211,238,0.34)" stroke-width="1"/>` +
    labelText(109, 36, 'MANIPULABILITY ELLIPSOID', { color: COLORS.cyan, size: 7.1, weight: '700', letterSpacing: '0.45' }) +

    // Subtle task-space axes
    `<line x1="28" y1="78" x2="188" y2="78" stroke="${COLORS.wire}" stroke-opacity="0.22" stroke-width="0.9"/>` +
    `<line x1="104" y1="42" x2="104" y2="112" stroke="${COLORS.wire}" stroke-opacity="0.22" stroke-width="0.9"/>` +

    // Healthy Manipulability Ellipsoid (isometric tilted ellipse + equator ring)
    `<ellipse cx="104" cy="78" rx="54" ry="25" transform="rotate(-22 104 78)" fill="rgba(34,211,238,0.12)" stroke="${COLORS.cyan}" stroke-width="1.65"/>` +
    `<ellipse cx="104" cy="78" rx="54" ry="8.5" transform="rotate(-22 104 78)" fill="none" stroke="${COLORS.cyan}" stroke-opacity="0.3" stroke-width="0.9" stroke-dasharray="2.5 2"/>` +

    // Dashed flattened singular line (Rose)
    `<line x1="56" y1="97.4" x2="152" y2="58.6" stroke="${COLORS.rose}" stroke-width="1.35" stroke-dasharray="3.5 2.4" stroke-opacity="0.9"/>` +

    // Semi-axes sigma1 (Cyan) and sigma2 (Emerald)
    `<g${arrowFilter ? ` filter="url(#${arrowFilter})"` : ''}>` +
    `<line x1="104" y1="78" x2="150" y2="59.4" stroke="${COLORS.cyan}" stroke-width="1.85" marker-end="url(#${p}arrow-cyan)"/>` +
    `<line x1="104" y1="78" x2="95.2" y2="56.2" stroke="${COLORS.emerald}" stroke-width="1.85" marker-end="url(#${p}arrow-emerald)"/>` +
    `</g>` +
    `<circle cx="104" cy="78" r="2.8" fill="${COLORS.text}"/>` +
    labelText(156, 54, 'σ₁', { color: COLORS.cyan, size: 9.0, weight: '700' }) +
    labelText(84, 55, 'σ₂', { color: COLORS.emerald, size: 9.0, weight: '700' }) +
    labelText(109, 121, 'σ₂ → 0 : Singular (rank drop)', { color: COLORS.rose, size: 7.2, weight: '600' }) +

    // Right Stacked Duality Cards (Velocity Map & Static Force Duality)
    // Top Card: Velocity Map (Cyan)
    `<rect x="218" y="26" width="188" height="46" rx="8" fill="url(#${p}glass-cyan)" stroke="${COLORS.cyan}" stroke-width="1.65"/>` +
    `<line x1="225" y1="27.3" x2="399" y2="27.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>` +
    labelText(228, 38.5, 'VELOCITY MAP', { color: COLORS.cyan, size: 7.1, weight: '700', anchor: 'start', letterSpacing: '0.45' }) +
    labelText(396, 38.5, '‖θ̇‖ ≤ 1', { color: '#A5F3FC', size: 7.1, weight: '600', anchor: 'end' }) +
    labelText(312, 58, velLaw, {
      color: COLORS.text,
      size: fitFontSize(velLaw, 170, 11.4, 8.2),
      weight: '700',
    }) +

    // Virtual Work Duality Link between cards
    labelText(312, 80.5, 'Fᵀv = τᵀθ̇  ·  Virtual Work', { color: COLORS.violet, size: 7.1, weight: '600', filter: cueFilter }) +

    // Bottom Card: Static Force Duality (Amber)
    `<rect x="218" y="85" width="188" height="45" rx="8" fill="url(#${p}glass-amber)" stroke="${COLORS.amber}" stroke-width="1.65"/>` +
    `<line x1="225" y1="86.3" x2="399" y2="86.3" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>` +
    labelText(228, 97.5, 'STATIC FORCE DUALITY', { color: COLORS.amber, size: 7.1, weight: '700', anchor: 'start', letterSpacing: '0.45' }) +
    labelText(396, 97.5, 'J ↔ Jᵀ', { color: '#FDE68A', size: 7.1, weight: '600', anchor: 'end' }) +
    labelText(312, 117, 'τ = Jᵀ(θ) F', { color: COLORS.text, size: 11.4, weight: '700' }) +

    renderSubtitle(d.subtitle, 14, 143);

  return wrapSVG(p, `Jacobian manipulability ellipsoid and velocity-force duality schematic (${metricText})`, body);
}

const RENDERERS = {
  msd: renderMSD,
  rotational: renderRotational,
  'rlc-series': renderRLCSeries,
  'rlc-parallel': renderRLCParallel,
  'rc-cascade': renderRCCascade,
  'dc-motor': renderDCMotor,
  'thermal-2zone': renderThermal2Zone,
  'feedback-pd': renderFeedbackPD,
  'pole-zero': renderPoleZeroMap,
  'state-space-loop': renderStateSpaceLoop,
  'mpc-cbf': renderMpcCbf,
  'estimator-arch': renderEstimatorArch,
  'robot-chain': renderRobotChain,
  'screw-poe': renderScrewPoE,
  'ik-solver-arch': renderIkSolverArch,
};

/**
 * Render an engineering schematic SVG string for the given diagram specification.
 *
 * @param {object} diagram - Diagram specification with `type` and schematic parameters.
 * @param {object} [options] - Rendering options.
 * @param {number} [options.activeStepIndex=0] - Active solver step index; step 0 highlights sign conventions & variable arrows.
 * @returns {string} Self-contained `<svg viewBox="0 0 420 148" ...>` HTML string, or `''` if invalid.
 */
export function renderSystemSchematicSVG(diagram, options = {}) {
  if (!diagram || typeof diagram !== 'object' || !diagram.type) {
    return '';
  }

  const renderer = RENDERERS[diagram.type];
  if (!renderer) {
    return '';
  }

  const activeStepIndex = options && typeof options.activeStepIndex === 'number' ? options.activeStepIndex : 0;
  const isSetup = activeStepIndex === 0;
  const prefix = `sch-${String(diagram.type).replace(/[^a-z0-9-]/gi, '')}-`;

  return renderer(diagram, prefix, isSetup, activeStepIndex);
}
