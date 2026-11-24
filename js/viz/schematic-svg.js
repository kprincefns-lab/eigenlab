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
