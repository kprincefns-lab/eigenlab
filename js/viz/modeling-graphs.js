/**
 * EIGENLAB — Interactive Physical Parameters ↔ s-Plane Pole Locus & Analogy Lab
 *            + 6-Challenge Visual Intuition Quiz Engine
 *
 * Exports:
 *   - ModelingSPlaneLab        : Synchronized 2-panel high-DPI HTML5 canvas lab linking
 *                                physical parameters (m, c, k ↔ L, R, 1/C) and draggable
 *                                complex s-Plane poles (constant-ω_n semicircle + critical
 *                                breakaway at -ω_n + overdamped real-axis split) directly
 *                                to the coupled unit-step response y(t) / v_C(t) with
 *                                setpoint r=1, ±2% settling band, overshoot M_p marker,
 *                                settling time T_s ≈ 4/σ guide, and Mechatronics Lens.
 *   - ModelingVisualQuizEngine : Brilliant.org-style 6-challenge visual intuition quiz
 *                                (mod-quiz-1 .. mod-quiz-6) with mobile zero-scroll layout,
 *                                s-plane / step / RLC / feedback-loop target visuals,
 *                                3-column A/B/C candidate canvases, geometric proof
 *                                overlays, KaTeX explanations, and store/sound persistence.
 */

import { store, sound, renderKatex, renderInlineMathText } from '../store.js';

// ---------------------------------------------------------------------------
// Palette & Visual Constants (EIGENLAB Dark Engineering Studio)
// ---------------------------------------------------------------------------
const COLORS = {
  bg: '#0B0D12',
  bgPanel: '#0F131C',
  gridMinor: 'rgba(148, 163, 184, 0.065)',
  gridMajor: 'rgba(148, 163, 184, 0.115)',
  axis: 'rgba(148, 163, 184, 0.34)',
  axisLabel: 'rgba(148, 163, 184, 0.65)',
  cyan: '#22D3EE',
  cyanGlow: 'rgba(34, 211, 238, 0.44)',
  violet: '#A78BFA',
  violetGlow: 'rgba(167, 139, 250, 0.44)',
  amber: '#F59E0B',
  amberLight: '#FCD34D',
  amberGlow: 'rgba(245, 158, 11, 0.48)',
  emerald: '#34D399',
  emeraldGlow: 'rgba(52, 211, 153, 0.44)',
  emeraldLhpNear: 'rgba(52, 211, 153, 0.04)',
  emeraldLhpFar: 'rgba(52, 211, 153, 0.10)',
  coral: '#FB7185',
  coralGlow: 'rgba(251, 113, 133, 0.46)',
  coralRhpNear: 'rgba(251, 113, 133, 0.055)',
  coralRhpFar: 'rgba(251, 113, 133, 0.13)',
  pillBg: 'rgba(11, 13, 18, 0.92)',
  pillBorder: 'rgba(148, 163, 184, 0.28)',
};

const TWO_PI = Math.PI * 2;
const FONT_MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const FONT_SANS = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';

const LAB_SPLANE_BOUNDS = {
  sigmaMin: -9.0,
  sigmaMax: 0.9,
  omegaMin: -4.6,
  omegaMax: 4.6,
};

const QUIZ_TARGET_PAD = { left: 40, right: 14, top: 16, bottom: 20 };
const QUIZ_OPTION_PAD = { left: 26, right: 10, top: 10, bottom: 15 };

function getLabPad(width) {
  if (width < 430) {
    return { left: 36, right: 12, top: 14, bottom: 20 };
  }
  return { left: 46, right: 18, top: 18, bottom: 22 };
}

// ---------------------------------------------------------------------------
// Scoped Component Styles (injected once into <head>)
// ---------------------------------------------------------------------------
function injectStylesOnce() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('eigenlab-modeling-graphs-styles')) return;

  const style = document.createElement('style');
  style.id = 'eigenlab-modeling-graphs-styles';
  style.textContent = `
    @keyframes eigenlabModShakeGentle {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(5px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(3px); }
    }
    .shake-gentle {
      animation: eigenlabModShakeGentle 0.42s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .el-mod-canvas {
      display: block;
      width: 100%;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }
    .el-mod-pill {
      transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease, transform 120ms ease;
    }
    .el-mod-pill:active {
      transform: scale(0.97);
    }
    .el-mod-slider {
      -webkit-appearance: none;
      appearance: none;
      height: 5px;
      border-radius: 9999px;
      background: linear-gradient(90deg, rgba(245, 158, 11, 0.45) 0%, rgba(34, 211, 238, 0.55) 35%, rgba(52, 211, 153, 0.85) 50%, rgba(167, 139, 250, 0.65) 100%);
      outline: none;
      cursor: pointer;
      touch-action: none;
    }
    .el-mod-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 15px;
      height: 15px;
      border-radius: 9999px;
      background: #22D3EE;
      border: 2px solid #F8FAFC;
      box-shadow: 0 0 10px rgba(34, 211, 238, 0.65);
      cursor: grab;
      transition: transform 120ms ease, background-color 150ms ease;
    }
    .el-mod-slider::-webkit-slider-thumb:active {
      transform: scale(1.16);
      cursor: grabbing;
    }
    .el-mod-slider::-moz-range-thumb {
      width: 15px;
      height: 15px;
      border-radius: 9999px;
      background: #22D3EE;
      border: 2px solid #F8FAFC;
      box-shadow: 0 0 10px rgba(34, 211, 238, 0.65);
      cursor: grab;
    }
    .el-mvq-card {
      transition: border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease, transform 160ms ease;
      cursor: pointer;
    }
    .el-mvq-card:hover:not([data-locked="true"]) {
      transform: translateY(-2px);
      border-color: rgba(34, 211, 238, 0.55);
      box-shadow: 0 10px 30px -12px rgba(34, 211, 238, 0.25);
    }
    .el-mvq-card[data-state="correct"] {
      border-color: rgba(52, 211, 153, 0.85) !important;
      background: linear-gradient(180deg, rgba(52, 211, 153, 0.12), rgba(15, 19, 28, 0.92)) !important;
      box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.35), 0 12px 32px -12px rgba(52, 211, 153, 0.35) !important;
    }
    .el-mvq-card[data-state="wrong"] {
      border-color: rgba(251, 113, 133, 0.72) !important;
      background: linear-gradient(180deg, rgba(251, 113, 133, 0.09), rgba(15, 19, 28, 0.92)) !important;
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Safe Store, Sound, KaTeX & Math Helpers
// ---------------------------------------------------------------------------
function safeSound(method, ...args) {
  try {
    if (sound && typeof sound[method] === 'function') {
      sound[method](...args);
    }
  } catch (_) {
    // Optional audio; never block interaction
  }
}

function safeStore(method, ...args) {
  try {
    if (store && typeof store[method] === 'function') {
      return store[method](...args);
    }
  } catch (_) {
    // Graceful fallback
  }
  return undefined;
}

function isQuizSolvedInStore(challengeId) {
  try {
    if (!store) return false;
    if (typeof store.isQuizSolved === 'function') return Boolean(store.isQuizSolved(challengeId));
    const st = typeof store.getState === 'function' ? store.getState() : store.state;
    const list = st?.solvedQuizzes || st?.quizzesSolved || store.solvedQuizzes;
    if (Array.isArray(list)) return list.includes(challengeId);
    if (list instanceof Set) return list.has(challengeId);
  } catch (_) {
    // Ignore
  }
  return false;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatKatex(tex, displayMode = false) {
  try {
    if (typeof window !== 'undefined' && window.katex && typeof window.katex.renderToString === 'function') {
      return window.katex.renderToString(tex, {
        displayMode: Boolean(displayMode),
        throwOnError: false,
        strict: false,
      });
    }
  } catch (_) {
    // Fall through to renderKatex helper
  }
  try {
    if (typeof renderKatex === 'function' && typeof document !== 'undefined') {
      const span = document.createElement('span');
      renderKatex(span, tex, Boolean(displayMode));
      if (span.innerHTML) return span.innerHTML;
    }
  } catch (_) {
    // Fall back to monospace
  }
  return `<code class="font-mono text-cyan-200/90">${escapeHtml(tex)}</code>`;
}

function formatInlineMath(text) {
  if (typeof text !== 'string') return '';
  try {
    if (typeof renderInlineMathText === 'function') {
      const result = renderInlineMathText(text);
      if (typeof result === 'string' && result.length > 0) return result;
    }
  } catch (_) {
    // Fall back to regex KaTeX substitution
  }
  return text.replace(/\$([^$]+)\$/g, (_, expr) => formatKatex(expr, false));
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function fmtPlain(val, decimals = 2) {
  if (!Number.isFinite(val)) return '0.00';
  const cleaned = Math.abs(val) < 0.0005 ? 0 : val;
  return cleaned.toFixed(decimals);
}

function fmtSigned(val, decimals = 2) {
  if (!Number.isFinite(val)) return '0.00';
  const cleaned = Math.abs(val) < 0.0005 ? 0 : val;
  const sign = cleaned > 0 ? '+' : '';
  return `${sign}${cleaned.toFixed(decimals)}`;
}

function niceStep(span, targetTicks = 5) {
  const rough = span / Math.max(2, targetTicks);
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(rough, 1e-6))));
  const norm = rough / mag;
  let step;
  if (norm < 1.5) step = 1;
  else if (norm < 3.2) step = 2;
  else if (norm < 7.2) step = 5;
  else step = 10;
  return step * mag;
}

function formatTickValue(v) {
  if (Math.abs(v) < 1e-6) return '0';
  if (Math.abs(v - Math.round(v)) < 1e-4) return String(Math.round(v));
  return v.toFixed(1);
}

// ---------------------------------------------------------------------------
// Second-Order Physical System Math & Step Response Engine
// ---------------------------------------------------------------------------
function classifyDampingRegime(zeta) {
  if (zeta <= 0.015) return 'undamped';
  if (Math.abs(zeta - 1.0) <= 0.018) return 'critical';
  if (zeta < 1.0) return 'underdamped';
  return 'overdamped';
}

function getRegimeTheme(regime) {
  switch (regime) {
    case 'undamped':
      return {
        label: 'UNDAMPED',
        color: COLORS.amberLight,
        glow: COLORS.amberGlow,
        badgeClass:
          'bg-amber-400/15 border-amber-400/60 text-amber-200',
        pillActiveClass:
          'bg-amber-400/15 border-amber-400/70 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.22)]',
      };
    case 'critical':
      return {
        label: 'CRITICAL',
        color: COLORS.emerald,
        glow: COLORS.emeraldGlow,
        badgeClass:
          'bg-emerald-400/15 border-emerald-400/60 text-emerald-200',
        pillActiveClass:
          'bg-emerald-400/15 border-emerald-400/70 text-emerald-200 shadow-[0_0_14px_rgba(52,211,153,0.22)]',
      };
    case 'overdamped':
      return {
        label: 'OVERDAMPED',
        color: COLORS.violet,
        glow: COLORS.violetGlow,
        badgeClass:
          'bg-violet-400/15 border-violet-400/60 text-violet-200',
        pillActiveClass:
          'bg-violet-400/15 border-violet-400/70 text-violet-200 shadow-[0_0_14px_rgba(167,139,250,0.24)]',
      };
    case 'underdamped':
    default:
      return {
        label: 'UNDERDAMPED',
        color: COLORS.cyan,
        glow: COLORS.cyanGlow,
        badgeClass:
          'bg-cyan-400/15 border-cyan-400/55 text-cyan-200',
        pillActiveClass:
          'bg-cyan-400/15 border-cyan-400/70 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.22)]',
      };
  }
}

/**
 * Computes exact poles, damping angle θ, overshoot M_p, peak time t_p,
 * dominant decay σ_dom, and settling time T_s ≈ 4/σ_dom for (m, c, k).
 */
function analyzeSecondOrder(m, c, k) {
  const safeM = Math.max(0.05, Number(m) || 1);
  const safeK = Math.max(0.1, Number(k) || 9);
  const safeC = Math.max(0, Number(c) || 0);

  const wn = Math.sqrt(safeK / safeM);
  const zeta = safeC / (2 * Math.sqrt(safeM * safeK));
  const regime = classifyDampingRegime(zeta);
  const sigmaCenter = zeta * wn; // magnitude of real center c/(2m)

  let poles = [];
  let wd = 0;
  let sigmaDom = sigmaCenter;
  let thetaDeg = 0;
  let mpPct = 0;
  let tp = Infinity;
  let yPeak = 1.0;

  if (regime === 'undamped') {
    wd = wn;
    sigmaDom = 0;
    thetaDeg = 90;
    mpPct = 100;
    tp = Math.PI / wn;
    yPeak = 2.0;
    poles = [
      { sigma: 0, omega: wn, role: 'conjugate-pos' },
      { sigma: 0, omega: -wn, role: 'conjugate-neg' },
    ];
  } else if (regime === 'underdamped') {
    const zClamped = clamp(zeta, 0.0001, 0.9999);
    const root = Math.sqrt(1 - zClamped * zClamped);
    wd = wn * root;
    sigmaDom = zClamped * wn;
    thetaDeg = (Math.acos(zClamped) * 180) / Math.PI;
    const overshoot = Math.exp((-Math.PI * zClamped) / root);
    mpPct = overshoot * 100;
    tp = Math.PI / wd;
    yPeak = 1 + overshoot;
    poles = [
      { sigma: -sigmaDom, omega: wd, role: 'conjugate-pos' },
      { sigma: -sigmaDom, omega: -wd, role: 'conjugate-neg' },
    ];
  } else if (regime === 'critical') {
    wd = 0;
    sigmaDom = wn;
    thetaDeg = 0;
    mpPct = 0;
    tp = Infinity;
    yPeak = 1.0;
    poles = [
      { sigma: -wn, omega: 0, role: 'critical-double' },
      { sigma: -wn, omega: 0, role: 'critical-double' },
    ];
  } else {
    const zOver = Math.max(1.0001, zeta);
    const disc = Math.sqrt(zOver * zOver - 1);
    const sSlow = -wn * (zOver - disc); // closer to origin (dominant)
    const sFast = -wn * (zOver + disc); // further left (fast)
    wd = 0;
    sigmaDom = Math.abs(sSlow);
    thetaDeg = 0;
    mpPct = 0;
    tp = Infinity;
    yPeak = 1.0;
    poles = [
      { sigma: sSlow, omega: 0, role: 'dominant-slow' },
      { sigma: sFast, omega: 0, role: 'fast-real' },
    ];
  }

  const ts = sigmaDom > 1e-4 ? 4 / sigmaDom : Infinity;

  return {
    m: safeM,
    c: safeC,
    k: safeK,
    wn,
    zeta,
    regime,
    sigmaCenter,
    sigmaDom,
    wd,
    thetaDeg,
    mpPct,
    tp,
    yPeak,
    ts,
    poles,
  };
}

/**
 * Exact normalized unit-step response y(t) for H(s) = ω_n² / (s² + 2ζω_n s + ω_n²).
 */
function evalSecondOrderStep(t, wn, zeta) {
  if (t <= 0) return 0;
  if (zeta <= 0.001) {
    return 1 - Math.cos(wn * t);
  }
  if (zeta < 0.996) {
    const root = Math.sqrt(Math.max(1e-8, 1 - zeta * zeta));
    const wd = wn * root;
    const sigma = zeta * wn;
    return 1 - Math.exp(-sigma * t) * (Math.cos(wd * t) + (zeta / root) * Math.sin(wd * t));
  }
  if (zeta <= 1.004) {
    return 1 - Math.exp(-wn * t) * (1 + wn * t);
  }
  const disc = Math.sqrt(zeta * zeta - 1);
  const s1 = -wn * (zeta - disc);
  const s2 = -wn * (zeta + disc);
  return 1 + (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s1 - s2);
}

/**
 * Exact unit-step response for two arbitrary real LHP poles s1, s2 (s1 ≠ s2).
 */
function evalTwoRealPolesStep(t, s1, s2) {
  if (t <= 0) return 0;
  if (Math.abs(s1 - s2) < 1e-4) {
    const a = Math.abs(s1);
    return 1 - Math.exp(-a * t) * (1 + a * t);
  }
  return 1 + (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s1 - s2);
}

// ---------------------------------------------------------------------------
// Canvas Drawing Primitives (High-DPI Safe)
// ---------------------------------------------------------------------------
function drawRoundedRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function createPlotMapper(width, height, pad, xMin, xMax, yMin, yMax) {
  const plotLeft = pad.left;
  const plotRight = Math.max(plotLeft + 10, width - pad.right);
  const plotTop = pad.top;
  const plotBottom = Math.max(plotTop + 10, height - pad.bottom);
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;
  const scaleX = plotW / (xMax - xMin);
  const scaleY = plotH / (yMax - yMin);

  return {
    plotLeft,
    plotRight,
    plotTop,
    plotBottom,
    plotW,
    plotH,
    scaleX,
    scaleY,
    xToPx: (x) => plotLeft + (x - xMin) * scaleX,
    pxToX: (px) => xMin + (px - plotLeft) / scaleX,
    yToPx: (y) => plotBottom - (y - yMin) * scaleY,
    pxToY: (py) => yMin + (plotBottom - py) / scaleY,
  };
}

function drawEngineeringGrid(ctx, width, height, map, xMin, xMax, yMin, yMax, opts = {}) {
  const { showXLabels = true, showYLabels = true, xUnit = '', compact = false } = opts;
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);

  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, 'rgba(30, 41, 59, 0.22)');
  bgGrad.addColorStop(1, 'rgba(11, 13, 18, 0.0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(map.plotLeft, map.plotTop, map.plotW, map.plotH);

  const xStep = niceStep(xMax - xMin, compact ? 4 : 6);
  const firstX = Math.ceil(xMin / xStep) * xStep;
  ctx.lineWidth = 1;
  ctx.font = `500 ${compact ? 9 : 10}px ${FONT_MONO}`;

  for (let gx = firstX; gx <= xMax + 1e-6; gx += xStep) {
    const px = Math.round(map.xToPx(gx)) + 0.5;
    if (px < map.plotLeft - 1 || px > map.plotRight + 1) continue;
    ctx.strokeStyle = Math.abs(gx) < 1e-5 ? COLORS.axis : COLORS.gridMajor;
    ctx.beginPath();
    ctx.moveTo(px, map.plotTop);
    ctx.lineTo(px, map.plotBottom);
    ctx.stroke();

    if (showXLabels) {
      ctx.fillStyle = COLORS.axisLabel;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const txt = formatTickValue(gx) + (xUnit && Math.abs(gx - xMax) < xStep * 0.55 ? xUnit : '');
      ctx.fillText(txt, px, map.plotBottom + 4);
    }
  }

  const yStep = niceStep(yMax - yMin, compact ? 3 : 4);
  const firstY = Math.ceil(yMin / yStep) * yStep;
  for (let gy = firstY; gy <= yMax + 1e-6; gy += yStep) {
    const py = Math.round(map.yToPx(gy)) + 0.5;
    if (py < map.plotTop - 1 || py > map.plotBottom + 1) continue;
    const isZero = Math.abs(gy) < 1e-5;
    ctx.strokeStyle = isZero ? COLORS.axis : COLORS.gridMinor;
    ctx.lineWidth = isZero ? 1.2 : 1;
    ctx.beginPath();
    ctx.moveTo(map.plotLeft, py);
    ctx.lineTo(map.plotRight, py);
    ctx.stroke();

    if (showYLabels) {
      ctx.fillStyle = isZero ? 'rgba(203, 213, 225, 0.85)' : COLORS.axisLabel;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatTickValue(gy), map.plotLeft - 5, py);
    }
  }

  if (yMin <= 0 && yMax >= 0) {
    const y0 = Math.round(map.yToPx(0)) + 0.5;
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(map.plotLeft, y0);
    ctx.lineTo(map.plotRight, y0);
    ctx.stroke();
  }
  if (xMin <= 0 && xMax >= 0) {
    const x0 = Math.round(map.xToPx(0)) + 0.5;
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(x0, map.plotTop);
    ctx.lineTo(x0, map.plotBottom);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 1;
  ctx.strokeRect(map.plotLeft + 0.5, map.plotTop + 0.5, map.plotW - 1, map.plotH - 1);
}

function drawGlowingCurve(ctx, map, fn, xStart, xEnd, color, glowColor, lineWidth = 2.35, samples = 260, dash = null) {
  if (Math.abs(xEnd - xStart) < 1e-6) return;
  const lo = Math.min(xStart, xEnd);
  const hi = Math.max(xStart, xEnd);

  ctx.save();
  ctx.beginPath();
  ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
  ctx.clip();

  const dx = (hi - lo) / samples;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i <= samples; i++) {
    const x = lo + i * dx;
    const y = fn(x);
    if (!Number.isFinite(y) || Math.abs(y) > 1e5) {
      started = false;
      continue;
    }
    const px = map.xToPx(x);
    const py = map.yToPx(y);
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }

  if (dash) ctx.setLineDash(dash);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = dash ? 6 : 10;
  }
  ctx.stroke();

  if (glowColor && !dash) {
    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(1.3, lineWidth - 0.55);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

function drawSPlaneBackdrop(ctx, width, height, map, bounds, opts = {}) {
  const {
    compact = false,
    minimal = false,
    highlightWn = null,
    highlightZetaRay = null,
    flashBreakaway = 0,
    showRegionLabels = true,
  } = opts;
  const { sigmaMin, sigmaMax, omegaMin, omegaMax } = bounds;

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);

  const x0 = map.xToPx(0);
  const y0 = map.yToPx(0);

  // Translucent Emerald LHP & Coral RHP shading
  const lhpW = Math.max(0, Math.min(x0, map.plotRight) - map.plotLeft);
  if (lhpW > 1) {
    const lhpGrad = ctx.createLinearGradient(map.plotLeft, 0, map.plotLeft + lhpW, 0);
    lhpGrad.addColorStop(0, COLORS.emeraldLhpFar);
    lhpGrad.addColorStop(1, COLORS.emeraldLhpNear);
    ctx.fillStyle = lhpGrad;
    ctx.fillRect(map.plotLeft, map.plotTop, lhpW, map.plotH);
  }

  const rhpLeft = Math.max(map.plotLeft, x0);
  const rhpW = Math.max(0, map.plotRight - rhpLeft);
  if (rhpW > 1) {
    const rhpGrad = ctx.createLinearGradient(rhpLeft, 0, map.plotRight, 0);
    rhpGrad.addColorStop(0, COLORS.coralRhpNear);
    rhpGrad.addColorStop(1, COLORS.coralRhpFar);
    ctx.fillStyle = rhpGrad;
    ctx.fillRect(rhpLeft, map.plotTop, rhpW, map.plotH);
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
  ctx.clip();

  // Cartesian grid lines
  const sStep = niceStep(sigmaMax - sigmaMin, compact ? 4 : 6);
  const wStep = niceStep(omegaMax - omegaMin, compact ? 3 : 4);
  ctx.lineWidth = 1;
  ctx.strokeStyle = COLORS.gridMinor;

  for (let s = Math.ceil(sigmaMin / sStep) * sStep; s <= sigmaMax + 1e-6; s += sStep) {
    if (Math.abs(s) < 1e-5) continue;
    const px = Math.round(map.xToPx(s)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(px, map.plotTop);
    ctx.lineTo(px, map.plotBottom);
    ctx.stroke();
  }
  for (let w = Math.ceil(omegaMin / wStep) * wStep; w <= omegaMax + 1e-6; w += wStep) {
    if (Math.abs(w) < 1e-5) continue;
    const py = Math.round(map.yToPx(w)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(map.plotLeft, py);
    ctx.lineTo(map.plotRight, py);
    ctx.stroke();
  }

  // LHP polar grid (concentric ω_n circles & ζ rays)
  ctx.save();
  ctx.beginPath();
  ctx.rect(map.plotLeft, map.plotTop, Math.max(0, x0 - map.plotLeft), map.plotH);
  ctx.clip();

  if (!minimal) {
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.11)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    const radii = [1.5, 3, 4.5, 6];
    for (const r of radii) {
      if (highlightWn && Math.abs(r - highlightWn) < 0.25) continue;
      const rx = r * map.scaleX;
      const ry = r * map.scaleY;
      if (rx < 4 || ry < 4) continue;
      ctx.beginPath();
      ctx.ellipse(x0, y0, rx, ry, 0, Math.PI / 2, (3 * Math.PI) / 2);
      ctx.stroke();
    }

    const zetas = compact ? [0.35, 0.707] : [0.25, 0.5, 0.707, 0.85];
    const rayLen = Math.hypot(Math.abs(sigmaMin) + 2, Math.max(Math.abs(omegaMin), Math.abs(omegaMax)) + 2);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.setLineDash([2, 4]);
    for (const z of zetas) {
      const sinT = Math.sqrt(Math.max(0, 1 - z * z));
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(map.xToPx(-z * rayLen), map.yToPx(sinT * rayLen));
      ctx.moveTo(x0, y0);
      ctx.lineTo(map.xToPx(-z * rayLen), map.yToPx(-sinT * rayLen));
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Highlighted Constant-ω_n Semicircle
  if (highlightWn && highlightWn > 0.1) {
    const rx = highlightWn * map.scaleX;
    const ry = highlightWn * map.scaleY;
    ctx.save();
    ctx.strokeStyle =
      flashBreakaway > 0.05
        ? `rgba(52, 211, 153, ${(0.55 + 0.4 * flashBreakaway).toFixed(2)})`
        : 'rgba(34, 211, 238, 0.42)';
    ctx.lineWidth = minimal ? 1.35 : 1.75;
    ctx.setLineDash([5, 4]);
    ctx.shadowColor = COLORS.cyanGlow;
    ctx.shadowBlur = minimal ? 4 : 8;
    ctx.beginPath();
    ctx.ellipse(x0, y0, rx, ry, 0, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Optional Highlighted Constant-ζ Ray (used in Quiz #3)
  if (highlightZetaRay && highlightZetaRay > 0 && highlightZetaRay < 1) {
    const sinT = Math.sqrt(1 - highlightZetaRay * highlightZetaRay);
    const rayLen = Math.hypot(Math.abs(sigmaMin) + 2, Math.max(Math.abs(omegaMin), Math.abs(omegaMax)) + 2);
    ctx.save();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.46)';
    ctx.lineWidth = minimal ? 1.25 : 1.65;
    ctx.setLineDash([4, 3.5]);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(map.xToPx(-highlightZetaRay * rayLen), map.yToPx(sinT * rayLen));
    ctx.moveTo(x0, y0);
    ctx.lineTo(map.xToPx(-highlightZetaRay * rayLen), map.yToPx(-sinT * rayLen));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  ctx.restore();

  // Real axis (ω = 0)
  const y0Snap = Math.round(y0) + 0.5;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.44)';
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(map.plotLeft, y0Snap);
  ctx.lineTo(map.plotRight, y0Snap);
  ctx.stroke();

  // Amber Imaginary Axis (σ = 0)
  const x0Snap = Math.round(x0) + 0.5;
  ctx.save();
  ctx.strokeStyle = COLORS.amber;
  ctx.lineWidth = minimal ? 1.5 : 1.9;
  ctx.shadowColor = COLORS.amberGlow;
  ctx.shadowBlur = minimal ? 5 : 9;
  ctx.beginPath();
  ctx.moveTo(x0Snap, map.plotTop);
  ctx.lineTo(x0Snap, map.plotBottom);
  ctx.stroke();
  ctx.restore();

  // Region & axis tags
  if (showRegionLabels && !minimal) {
    ctx.font = `700 ${compact ? 8 : 9.5}px ${FONT_MONO}`;
    ctx.textBaseline = 'top';
    if (lhpW > 52) {
      ctx.fillStyle = 'rgba(52, 211, 153, 0.68)';
      ctx.textAlign = 'left';
      ctx.fillText('STABLE LHP', map.plotLeft + 6, map.plotTop + 5);
    }
    ctx.font = `600 ${compact ? 8.5 : 9.5}px ${FONT_MONO}`;
    ctx.fillStyle = 'rgba(252, 211, 77, 0.85)';
    ctx.textAlign = 'left';
    if (x0Snap + 4 < map.plotRight - 14) {
      ctx.fillText('jω', x0Snap + 4, map.plotTop + 5);
    }
    ctx.fillStyle = 'rgba(148, 163, 184, 0.72)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('σ', map.plotRight - 5, y0Snap - 3);
  } else if (minimal) {
    ctx.font = `600 8px ${FONT_MONO}`;
    ctx.fillStyle = 'rgba(252, 211, 77, 0.75)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    if (x0Snap + 3 < map.plotRight - 10) {
      ctx.fillText('jω', x0Snap + 3, map.plotTop + 3);
    }
    ctx.fillStyle = 'rgba(148, 163, 184, 0.68)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('σ', map.plotLeft + 4, y0Snap - 2);
  }

  ctx.restore();

  // Outer tick labels
  if (!minimal) {
    ctx.font = `500 ${compact ? 8.5 : 9.5}px ${FONT_MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let s = Math.ceil(sigmaMin / sStep) * sStep; s <= sigmaMax + 1e-6; s += sStep) {
      const px = map.xToPx(s);
      if (px < map.plotLeft - 2 || px > map.plotRight + 2) continue;
      ctx.fillStyle = Math.abs(s) < 1e-5 ? COLORS.amberLight : COLORS.axisLabel;
      ctx.fillText(formatTickValue(s), px, map.plotBottom + 4);
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let w = Math.ceil(omegaMin / wStep) * wStep; w <= omegaMax + 1e-6; w += wStep) {
      const py = map.yToPx(w);
      if (py < map.plotTop - 2 || py > map.plotBottom + 2) continue;
      ctx.fillStyle = Math.abs(w) < 1e-5 ? 'rgba(203, 213, 225, 0.85)' : COLORS.axisLabel;
      const lbl = Math.abs(w) < 1e-5 ? '0' : `${w > 0 ? '+' : ''}${formatTickValue(w)}j`;
      ctx.fillText(lbl, map.plotLeft - 5, py);
    }
  }

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
  ctx.lineWidth = 1;
  ctx.strokeRect(map.plotLeft + 0.5, map.plotTop + 0.5, map.plotW - 1, map.plotH - 1);
}

function drawPoleMarker(ctx, map, sigma, omega, opts = {}) {
  const {
    pulse = 0.5,
    color = COLORS.cyan,
    glow = COLORS.cyanGlow,
    size = 6.5,
    isDragging = false,
    isDouble = false,
    faded = false,
  } = opts;

  const px = map.xToPx(sigma);
  const py = map.yToPx(omega);

  ctx.save();
  ctx.beginPath();
  ctx.rect(map.plotLeft - 2, map.plotTop - 2, map.plotW + 4, map.plotH + 4);
  ctx.clip();

  if (faded) {
    ctx.globalAlpha = 0.42;
  }

  // Pulsing outer ring
  const ringR = size + (isDouble ? 6.5 : 4.5) + pulse * 3.5 + (isDragging ? 2.5 : 0);
  ctx.beginPath();
  ctx.arc(px, py, ringR, 0, TWO_PI);
  ctx.strokeStyle = color;
  ctx.globalAlpha = faded ? 0.25 : isDragging ? 0.58 : 0.28 + 0.26 * (1 - pulse);
  ctx.lineWidth = isDragging ? 1.7 : 1.25;
  ctx.stroke();

  if (isDouble) {
    ctx.beginPath();
    ctx.arc(px, py, size + 2.5, 0, TWO_PI);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  // Translucent core halo
  ctx.globalAlpha = faded ? 0.1 : 0.16;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, py, size + 3, 0, TWO_PI);
  ctx.fill();

  // Crisp glowing × cross
  ctx.globalAlpha = faded ? 0.55 : 1;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = isDragging ? 3.2 : 2.6;
  ctx.shadowColor = glow;
  ctx.shadowBlur = isDragging ? 15 : 10;
  ctx.beginPath();
  ctx.moveTo(px - size, py - size);
  ctx.lineTo(px + size, py + size);
  ctx.moveTo(px + size, py - size);
  ctx.lineTo(px - size, py + size);
  ctx.stroke();

  // Bright inner white stroke
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#F8FAFC';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(px - size * 0.68, py - size * 0.68);
  ctx.lineTo(px + size * 0.68, py + size * 0.68);
  ctx.moveTo(px + size * 0.68, py - size * 0.68);
  ctx.lineTo(px - size * 0.68, py + size * 0.68);
  ctx.stroke();

  ctx.restore();
}

function drawArrowHead(ctx, fromX, fromY, toX, toY, color, size = 6.5) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - size * Math.cos(angle - Math.PI / 6), toY - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - size * Math.cos(angle + Math.PI / 6), toY - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFloatingPill(ctx, map, anchorX, anchorY, text, accentColor, preferAbove = true, compact = false) {
  ctx.save();
  ctx.font = `600 ${compact ? 9 : 10}px ${FONT_MONO}`;
  const metrics = ctx.measureText(text);
  const padX = compact ? 5 : 6.5;
  const pillW = Math.ceil(metrics.width + padX * 2 + 5);
  const pillH = compact ? 16 : 18;

  let x = anchorX + 9;
  if (x + pillW > map.plotRight - 4) {
    x = anchorX - pillW - 9;
  }
  x = clamp(x, map.plotLeft + 4, Math.max(map.plotLeft + 4, map.plotRight - pillW - 4));

  let y = preferAbove ? anchorY - pillH - 7 : anchorY + 7;
  if (y < map.plotTop + 3) y = anchorY + 8;
  if (y + pillH > map.plotBottom - 3) y = map.plotBottom - pillH - 3;

  drawRoundedRect(ctx, x, y, pillW, pillH, 4.5);
  ctx.fillStyle = COLORS.pillBg;
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = accentColor;
  drawRoundedRect(ctx, x + 3, y + 3.5, 2.5, pillH - 7, 1.5);
  ctx.fill();

  ctx.fillStyle = '#F8FAFC';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + (compact ? 8 : 9), y + pillH / 2 + 0.5);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 5 Physical Damping Regime Presets for ModelingSPlaneLab
// ---------------------------------------------------------------------------
const MODELING_PRESETS = [
  {
    key: 'underdamped',
    label: 'Underdamped (ζ=0.25)',
    m: 1.0,
    c: 1.5,
    k: 9.0,
    isElectrical: false,
  },
  {
    key: 'optimal',
    label: 'Optimal (ζ=0.71)',
    m: 1.0,
    c: 4.24,
    k: 9.0,
    isElectrical: false,
  },
  {
    key: 'critical',
    label: 'Critical (ζ=1.0)',
    m: 1.0,
    c: 6.0,
    k: 9.0,
    isElectrical: false,
  },
  {
    key: 'overdamped',
    label: 'Overdamped (ζ=1.6)',
    m: 1.0,
    c: 9.6,
    k: 9.0,
    isElectrical: false,
  },
  {
    key: 'rlc-resonant',
    label: 'RLC Resonant',
    m: 0.5, // L = 0.5 H
    c: 0.8, // R = 0.8 Ω
    k: 8.0, // 1/C = 8.0 F⁻¹ (C = 0.125 F)
    isElectrical: true,
  },
];

// ===========================================================================
// PART 1: ModelingSPlaneLab (Physical Parameters ↔ s-Plane & Step Response)
// ===========================================================================
export class ModelingSPlaneLab {
  constructor(containerOrOptions = {}, maybeOptions = {}) {
    const isElement =
      containerOrOptions &&
      typeof containerOrOptions === 'object' &&
      containerOrOptions.nodeType === 1;
    const autoMountContainer = isElement ? containerOrOptions : null;
    const options = isElement ? maybeOptions || {} : containerOrOptions || {};

    const {
      lens = 'math',
      mechatronicsLens = lens === 'mechatronics',
      initialPreset = 'underdamped',
      onInteract = null,
      onOpenQuiz = null,
      onParamChange = null,
    } = options;

    this._presetMap = new Map(MODELING_PRESETS.map((p) => [p.key, p]));
    const startPreset = this._presetMap.get(initialPreset) || MODELING_PRESETS[0];

    this.m = startPreset.m;
    this.c = startPreset.c;
    this.k = startPreset.k;
    this.mechatronicsLens = Boolean(mechatronicsLens);
    this._electricalPresetMode = Boolean(startPreset.isElectrical);

    this.onInteract = typeof onInteract === 'function' ? onInteract : null;
    this.onOpenQuiz = typeof onOpenQuiz === 'function' ? onOpenQuiz : null;
    this.onParamChange = typeof onParamChange === 'function' ? onParamChange : null;

    this._hasInteracted = false;
    this._isDragging = false;
    this._activePointerId = null;
    this._activePoleSign = 1;

    this._container = null;
    this._root = null;
    this._canvases = [];
    this._ctxs = [];
    this._sizes = [
      { w: 0, h: 135 },
      { w: 0, h: 125 },
    ];
    this._panelMetaEls = [];
    this._presetButtons = new Map();
    this._badgeEls = {};
    this._sliderEl = null;
    this._sliderLabelEl = null;
    this._sliderValueEl = null;

    this._resizeObserver = null;
    this._abortController = null;
    this._rafId = null;
    this._pulsePhase = 0;
    this._lastFrameTs = 0;
    this._lastTickMs = 0;
    this._breakawayFlashTs = 0;
    this._disposed = false;

    if (autoMountContainer) {
      this.mount(autoMountContainer);
    }
  }

  static get PRESETS() {
    return MODELING_PRESETS;
  }

  _isElectricalView() {
    return this.mechatronicsLens || this._electricalPresetMode;
  }

  _getAnalysis() {
    return analyzeSecondOrder(this.m, this.c, this.k);
  }

  mount(container) {
    if (!container) return this;
    injectStylesOnce();
    this.dispose();
    this._disposed = false;
    this._container = container;
    this._abortController = new AbortController();
    const { signal } = this._abortController;

    container.innerHTML = '';

    const root = document.createElement('div');
    root.className =
      'w-full rounded-2xl border border-slate-800/90 bg-[#0B0D12]/95 shadow-2xl overflow-hidden backdrop-blur-md';
    this._root = root;

    // --- 1. Mobile-Compact Top Control & Telemetry Strip ---
    const topBar = document.createElement('div');
    topBar.className =
      'px-2.5 py-2 sm:px-3.5 sm:py-2.5 border-b border-slate-800/80 bg-[#0F131C]/90 flex flex-col gap-1.5 sm:gap-2';

    // Row 1: Scrollable 5 physical damping preset pills
    const pillGroup = document.createElement('div');
    pillGroup.className =
      'flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap sm:flex-wrap pb-0.5 sm:pb-0';
    this._presetButtons.clear();

    for (const preset of MODELING_PRESETS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.presetKey = preset.key;
      btn.className =
        'el-mod-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer';
      btn.textContent = preset.label;
      btn.addEventListener(
        'click',
        () => {
          safeSound('playTick');
          this.setPreset(preset.key);
          this._markInteracted();
        },
        { signal }
      );
      pillGroup.appendChild(btn);
      this._presetButtons.set(preset.key, btn);
    }

    // Row 2: Live compact telemetry pills + Mechanical↔Electrical analogy readout
    const telemetryRow = document.createElement('div');
    telemetryRow.className = 'flex flex-wrap items-center justify-between gap-1 sm:gap-2';

    const badgesWrap = document.createElement('div');
    badgesWrap.className = 'flex flex-wrap items-center gap-1 sm:gap-1.5';

    const poleBadge = document.createElement('span');
    poleBadge.className =
      'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-cyan-500/10 border border-cyan-400/45 text-cyan-200';

    const zetaBadge = document.createElement('span');
    zetaBadge.className =
      'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-slate-900/90 border border-slate-700/80 text-slate-100';

    const wnBadge = document.createElement('span');
    wnBadge.className =
      'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-slate-900/90 border border-slate-700/80 text-slate-200';

    const regimeBadge = document.createElement('span');
    regimeBadge.className =
      'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wide border transition-colors';

    badgesWrap.append(poleBadge, zetaBadge, wnBadge, regimeBadge);

    const analogyBadge = document.createElement('div');
    analogyBadge.className =
      'px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono bg-slate-950/85 border border-slate-800/90 text-slate-300 flex items-center gap-1.5 max-w-full overflow-x-auto no-scrollbar whitespace-nowrap';

    this._badgeEls = { poleBadge, zetaBadge, wnBadge, regimeBadge, analogyBadge };
    telemetryRow.append(badgesWrap, analogyBadge);
    topBar.append(pillGroup, telemetryRow);
    root.appendChild(topBar);

    // --- 2. Synchronized 2-Panel Canvas Stack + Compact Damping Scrubber ---
    const stackWrap = document.createElement('div');
    stackWrap.className = 'divide-y divide-slate-800/80 bg-[#0B0D12]';
    stackWrap.tabIndex = 0;
    stackWrap.setAttribute(
      'aria-label',
      'Interactive Physical Modeling s-Plane and Step Response Lab; drag pole or scrub damping slider to sweep zeta from 0 to 2'
    );

    const panelHeights = ['h-[135px] sm:h-[180px]', 'h-[125px] sm:h-[168px]'];
    const panelCursors = ['cursor-grab', 'cursor-default'];
    const panelDots = [COLORS.cyan, COLORS.emerald];

    this._canvases = [];
    this._ctxs = [];
    this._panelMetaEls = [];

    for (let i = 0; i < 2; i++) {
      const panel = document.createElement('div');
      panel.className = 'relative bg-[#0B0D12]';

      const header = document.createElement('div');
      header.className =
        'px-2.5 py-1 sm:px-3.5 sm:py-1.5 flex items-center justify-between gap-2 bg-[#0E121B]/95 border-b border-slate-800/50';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'flex items-center gap-1.5 min-w-0';

      const dot = document.createElement('span');
      dot.className = 'w-2 h-2 rounded-full shrink-0';
      dot.style.backgroundColor = panelDots[i];
      dot.style.boxShadow = `0 0 8px ${panelDots[i]}`;

      const titleEl = document.createElement('span');
      titleEl.className = 'text-[11px] sm:text-xs font-semibold tracking-tight text-slate-200 truncate';

      titleWrap.append(dot, titleEl);

      const readoutEl = document.createElement('span');
      readoutEl.className =
        'px-1.5 py-0.5 sm:px-2 rounded-md text-[10px] sm:text-[11px] font-mono font-semibold bg-slate-900/90 border border-slate-800 text-slate-100 shrink-0';

      header.append(titleWrap, readoutEl);
      panel.appendChild(header);

      const canvasWrap = document.createElement('div');
      canvasWrap.className = `relative w-full ${panelCursors[i]} ${panelHeights[i]}`;

      const canvas = document.createElement('canvas');
      canvas.className = 'el-mod-canvas h-full';
      canvas.style.touchAction = 'none';
      canvasWrap.appendChild(canvas);
      panel.appendChild(canvasWrap);

      stackWrap.appendChild(panel);

      this._canvases.push(canvas);
      this._ctxs.push(canvas.getContext('2d'));
      this._sizes[i] = { w: 0, h: i === 0 ? 135 : 125 };
      this._panelMetaEls.push({ titleEl, readoutEl, canvasWrap, dot });

      // Insert Compact Damping Sweep Slider directly below Panel 1 (s-Plane)
      if (i === 0) {
        const scrubberBar = document.createElement('div');
        scrubberBar.className =
          'px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-[#0F131C]/95 flex items-center gap-2 sm:gap-3';

        const sliderLabel = document.createElement('label');
        sliderLabel.className =
          'text-[10px] sm:text-[11px] font-mono font-semibold text-cyan-200 shrink-0 whitespace-nowrap';
        sliderLabel.textContent = 'Sweep ζ';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '2';
        slider.step = '0.01';
        slider.value = fmtPlain(this._getAnalysis().zeta, 2);
        slider.className = 'el-mod-slider flex-1 min-w-[90px]';
        slider.setAttribute('aria-label', 'Sweep damping ratio zeta from 0 to 2');

        slider.addEventListener(
          'input',
          (e) => {
            const val = Number(e.target.value);
            this._applySweptZeta(val, true);
          },
          { signal }
        );

        const sliderVal = document.createElement('span');
        sliderVal.className =
          'text-[10px] sm:text-[11px] font-mono font-semibold text-slate-200 bg-slate-900/90 border border-slate-800 rounded-md px-1.5 py-0.5 shrink-0 whitespace-nowrap';

        this._sliderEl = slider;
        this._sliderLabelEl = sliderLabel;
        this._sliderValueEl = sliderVal;

        scrubberBar.append(sliderLabel, slider, sliderVal);
        stackWrap.appendChild(scrubberBar);
      }
    }

    // Bind direct pointer/touch dragging on Panel 1 (s-Plane)
    this._bindSPlanePointerEvents(this._canvases[0], this._panelMetaEls[0].canvasWrap, signal);

    // Keyboard micro-nudging when focused
    stackWrap.addEventListener(
      'keydown',
      (e) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault();
        const analysis = this._getAnalysis();
        const delta = e.shiftKey ? 0.1 : 0.04;
        let nextZeta = analysis.zeta;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') nextZeta -= delta;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') nextZeta += delta;
        this._applySweptZeta(nextZeta, true);
      },
      { signal }
    );

    root.appendChild(stackWrap);

    // --- 3. Compact Bottom CTA Button (wired to onOpenQuiz when provided) ---
    if (this.onOpenQuiz) {
      const footer = document.createElement('div');
      footer.className =
        'px-2.5 py-2 sm:px-3.5 sm:py-2.5 border-t border-slate-800/80 bg-[#0E121B]/95 flex items-center justify-between gap-2';

      const footerNote = document.createElement('span');
      footerNote.className = 'hidden sm:inline text-[11px] text-slate-400';
      footerNote.textContent = 'Drag the Cyan pole along the ωₙ semicircle or past -ωₙ to see critical breakaway.';

      const ctaBtn = document.createElement('button');
      ctaBtn.type = 'button';
      ctaBtn.className =
        'el-mod-pill w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-100 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(34,211,238,0.16)]';
      ctaBtn.textContent = 'Test Your Intuition: Modeling & s-Plane Quiz →';
      ctaBtn.addEventListener(
        'click',
        () => {
          safeSound('playTick');
          try {
            this.onOpenQuiz?.();
          } catch (_) {
            // Ignore consumer errors
          }
        },
        { signal }
      );

      footer.append(footerNote, ctaBtn);
      root.appendChild(footer);
    }

    container.appendChild(root);

    this._syncControlUI();
    this._resizeAll();
    this._drawAll();

    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => {
        if (this._disposed) return;
        this._resizeAll();
        this._drawAll();
      });
      this._resizeObserver.observe(root);
    }

    this._startAnimationLoop();
    return this;
  }

  _bindSPlanePointerEvents(canvas, wrap, signal) {
    const pointerToComplex = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return null;
      const pad = getLabPad(rect.width);
      const map = createPlotMapper(
        rect.width,
        rect.height,
        pad,
        LAB_SPLANE_BOUNDS.sigmaMin,
        LAB_SPLANE_BOUNDS.sigmaMax,
        LAB_SPLANE_BOUNDS.omegaMin,
        LAB_SPLANE_BOUNDS.omegaMax
      );
      return {
        sigma: clamp(map.pxToX(clientX - rect.left), LAB_SPLANE_BOUNDS.sigmaMin, LAB_SPLANE_BOUNDS.sigmaMax),
        rawOmega: clamp(map.pxToY(clientY - rect.top), LAB_SPLANE_BOUNDS.omegaMin, LAB_SPLANE_BOUNDS.omegaMax),
      };
    };

    const complexToSweptZeta = (sigma, rawOmega) => {
      const analysis = this._getAnalysis();
      const wn = analysis.wn;
      const absW = Math.abs(rawOmega);

      // Dragged to or past the imaginary axis -> undamped
      if (sigma >= -0.05) {
        return 0;
      }

      // Dragged past the critical breakaway point -ω_n on the real axis -> overdamped fast pole s2
      if (sigma < -wn * 1.02 && absW < wn * 0.62) {
        const s2Mag = Math.max(wn, Math.abs(sigma));
        return clamp(0.5 * (s2Mag / wn + wn / s2Mag), 1.0, 2.0);
      }

      // Already overdamped and dragging dominant slow pole s1 right along the real axis
      if (analysis.zeta >= 0.98 && absW < wn * 0.38 && sigma < -0.15 * wn && sigma > -wn * 0.98) {
        const s1Mag = clamp(Math.abs(sigma), wn * 0.268, wn);
        return clamp(0.5 * (wn / s1Mag + s1Mag / wn), 1.0, 2.0);
      }

      // Near the breakaway point (-ω_n, 0) -> snap cleanly to critical damping
      if (Math.hypot(sigma + wn, absW) < wn * 0.16) {
        return 1.0;
      }

      // Otherwise project directly onto the constant-ω_n semicircle by damping angle θ
      const mag = Math.hypot(sigma, absW);
      if (mag < 1e-4) return 0.5;
      return clamp(-sigma / mag, 0, 1.0);
    };

    canvas.addEventListener(
      'pointerdown',
      (e) => {
        const pt = pointerToComplex(e.clientX, e.clientY);
        if (!pt) return;
        this._isDragging = true;
        this._activePointerId = e.pointerId;
        this._activePoleSign = pt.rawOmega < 0 ? -1 : 1;
        wrap.classList.remove('cursor-grab');
        wrap.classList.add('cursor-grabbing');
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {
          // Ignore synthetic events
        }
        const z = complexToSweptZeta(pt.sigma, pt.rawOmega);
        this._applySweptZeta(z, true);
      },
      { signal }
    );

    canvas.addEventListener(
      'pointermove',
      (e) => {
        if (!this._isDragging || e.pointerId !== this._activePointerId) return;
        const pt = pointerToComplex(e.clientX, e.clientY);
        if (!pt) return;
        this._activePoleSign = pt.rawOmega < 0 ? -1 : 1;
        const z = complexToSweptZeta(pt.sigma, pt.rawOmega);
        this._applySweptZeta(z, true);
      },
      { signal }
    );

    const endDrag = (e) => {
      if (this._activePointerId === e.pointerId) {
        this._isDragging = false;
        this._activePointerId = null;
        wrap.classList.remove('cursor-grabbing');
        wrap.classList.add('cursor-grab');
        try {
          if (canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId);
          }
        } catch (_) {
          // Ignore
        }
        this._drawAll();
      }
    };

    canvas.addEventListener('pointerup', endDrag, { signal });
    canvas.addEventListener('pointercancel', endDrag, { signal });
  }

  _playThrottledTick() {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this._lastTickMs > 75) {
      this._lastTickMs = now;
      safeSound('playTick');
    }
  }

  _applySweptZeta(rawZeta, allowAudio) {
    const prev = this._getAnalysis();
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    let nextZeta = clamp(Number(rawZeta), 0, 2.0);

    // Subtle tactile magnetic detents at ζ = 0 and critical breakaway ζ = 1.0
    if (nextZeta < 0.02) nextZeta = 0;
    else if (Math.abs(nextZeta - 1.0) <= 0.025) nextZeta = 1.0;

    this.c = 2 * nextZeta * Math.sqrt(this.m * this.k);

    if (allowAudio) {
      const crossedCritical =
        (prev.zeta < 0.99 && nextZeta >= 0.99) ||
        (prev.zeta > 1.01 && nextZeta <= 1.01) ||
        (prev.zeta !== 1.0 && nextZeta === 1.0);
      if (crossedCritical) {
        this._breakawayFlashTs = now;
        this._playThrottledTick();
      } else if (Math.abs(nextZeta - prev.zeta) >= 0.04) {
        this._playThrottledTick();
      }
    }

    this._syncControlUI();
    this._drawAll();
    this._emitParamChange();
    if (allowAudio) this._markInteracted();
  }

  _markInteracted() {
    if (!this._hasInteracted) {
      this._hasInteracted = true;
      try {
        const a = this._getAnalysis();
        this.onInteract?.({ m: a.m, c: a.c, k: a.k, zeta: a.zeta, wn: a.wn, regime: a.regime });
      } catch (_) {
        // Ignore consumer errors
      }
    }
  }

  _emitParamChange() {
    if (!this.onParamChange) return;
    try {
      this.onParamChange(this._getAnalysis());
    } catch (_) {
      // Ignore consumer errors
    }
  }

  setPreset(key) {
    const preset = this._presetMap.get(key);
    if (!preset) return;
    this.m = preset.m;
    this.c = preset.c;
    this.k = preset.k;
    this._electricalPresetMode = Boolean(preset.isElectrical);
    if (Math.abs(this._getAnalysis().zeta - 1.0) < 0.02) {
      this._breakawayFlashTs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    }
    this._syncControlUI();
    this._drawAll();
    this._emitParamChange();
  }

  setDampingRatio(zeta) {
    this._applySweptZeta(zeta, false);
  }

  setMechatronicsLens(bool) {
    const next = Boolean(bool);
    this._electricalPresetMode = false;
    if (next === this.mechatronicsLens) {
      this._syncControlUI();
      this._drawAll();
      return;
    }
    this.mechatronicsLens = next;
    this._syncControlUI();
    this._drawAll();
  }

  setLens(lens) {
    this.setMechatronicsLens(lens === 'mechatronics');
  }

  _getMatchingPresetKey() {
    for (const p of MODELING_PRESETS) {
      if (
        Math.abs(this.m - p.m) < 0.04 &&
        Math.abs(this.k - p.k) < 0.1 &&
        Math.abs(this.c - p.c) < 0.14
      ) {
        return p.key;
      }
    }
    return null;
  }

  _syncControlUI() {
    if (!this._root) return;
    const a = this._getAnalysis();
    const theme = getRegimeTheme(a.regime);
    const isElec = this._isElectricalView();

    const activePresetKey = this._getMatchingPresetKey();
    for (const [key, btn] of this._presetButtons.entries()) {
      const isActive = key === activePresetKey;
      if (isActive) {
        const activeTheme = key === 'rlc-resonant' ? getRegimeTheme('undamped') : theme;
        const activeStyle =
          key === 'rlc-resonant'
            ? 'bg-cyan-400/15 border-cyan-400/75 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.24)]'
            : activeTheme.pillActiveClass;
        btn.className =
          `el-mod-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border cursor-pointer ${activeStyle}`;
      } else {
        btn.className =
          'el-mod-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700';
      }
    }

    // Telemetry Badges
    const { poleBadge, zetaBadge, wnBadge, regimeBadge, analogyBadge } = this._badgeEls;

    if (poleBadge) {
      if (a.regime === 'undamped') {
        poleBadge.textContent = `s = ±${fmtPlain(a.wn, 2)}j`;
      } else if (a.regime === 'underdamped') {
        poleBadge.textContent = `s = -${fmtPlain(a.sigmaDom, 2)}±${fmtPlain(a.wd, 2)}j`;
      } else if (a.regime === 'critical') {
        poleBadge.textContent = `s = -${fmtPlain(a.wn, 2)} (×2)`;
      } else {
        poleBadge.textContent = `s = ${fmtPlain(a.poles[0].sigma, 2)}, ${fmtPlain(a.poles[1].sigma, 2)}`;
      }
    }

    if (zetaBadge) {
      zetaBadge.textContent = `ζ = ${fmtPlain(a.zeta, 2)}`;
    }

    if (wnBadge) {
      wnBadge.textContent = `ωₙ = ${fmtPlain(a.wn, 2)}`;
    }

    if (regimeBadge) {
      regimeBadge.textContent = `● ${theme.label}`;
      regimeBadge.className =
        `px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wide border transition-colors ${theme.badgeClass}`;
    }

    if (analogyBadge) {
      if (isElec) {
        analogyBadge.innerHTML =
          `<span class="text-cyan-300 font-semibold">RLC</span>` +
          `<span class="text-slate-300">L=${fmtPlain(a.m, 1)} R=${fmtPlain(a.c, 2)} 1/C=${fmtPlain(a.k, 1)}</span>` +
          `<span class="text-slate-600">|</span>` +
          `<span class="text-amber-300/90">L↔m, R↔c, 1/C↔k</span>`;
      } else {
        analogyBadge.innerHTML =
          `<span class="text-emerald-300 font-semibold">Mech</span>` +
          `<span class="text-slate-300">m=${fmtPlain(a.m, 1)} c=${fmtPlain(a.c, 2)} k=${fmtPlain(a.k, 1)}</span>` +
          `<span class="text-slate-600">|</span>` +
          `<span class="text-cyan-300/90">m↔L, c↔R, k↔1/C</span>`;
      }
    }

    // Damping Scrubber Sync
    if (this._sliderEl) {
      this._sliderEl.value = fmtPlain(a.zeta, 2);
    }
    if (this._sliderLabelEl) {
      this._sliderLabelEl.textContent = isElec ? 'Resistor R (ζ)' : 'Damper c (ζ)';
    }
    if (this._sliderValueEl) {
      const dampSym = isElec ? 'R' : 'c';
      const unit = isElec ? 'Ω' : '';
      this._sliderValueEl.textContent = `ζ=${fmtPlain(a.zeta, 2)} • ${dampSym}=${fmtPlain(a.c, 2)}${unit}`;
    }

    // Panel Headers
    const titles = isElec
      ? ['Series RLC s-Plane Pole Locus (L↔m, R↔c, 1/C↔k)', 'Series RLC Capacitor Voltage v_C(t)']
      : ['Complex s-Plane Pole Locus (Constant-ωₙ Sweep)', 'Mass-Spring-Damper Step Response x(t)'];

    if (this._panelMetaEls.length === 2) {
      this._panelMetaEls[0].titleEl.textContent = titles[0];
      this._panelMetaEls[1].titleEl.textContent = titles[1];
      this._panelMetaEls[0].dot.style.backgroundColor = theme.color;
      this._panelMetaEls[0].dot.style.boxShadow = `0 0 8px ${theme.color}`;
      this._panelMetaEls[1].dot.style.backgroundColor = theme.color;
      this._panelMetaEls[1].dot.style.boxShadow = `0 0 8px ${theme.color}`;

      this._panelMetaEls[0].readoutEl.textContent =
        a.regime === 'underdamped'
          ? `θ=${Math.round(a.thetaDeg)}° • σ=-${fmtPlain(a.sigmaDom, 2)}`
          : a.regime === 'critical'
          ? `Breakaway -ωₙ=-${fmtPlain(a.wn, 2)}`
          : a.regime === 'undamped'
          ? `θ=90° • σ=0 (Lossless)`
          : `s₁=${fmtPlain(a.poles[0].sigma, 2)} (slow)`;

      const tsTxt = Number.isFinite(a.ts) ? `Tₛ≈${fmtPlain(a.ts, 2)}s` : 'Tₛ=∞';
      const mpTxt = a.mpPct >= 0.4 ? `Mₚ=${fmtPlain(a.mpPct, 1)}%` : 'Mₚ=0%';
      this._panelMetaEls[1].readoutEl.textContent = `${mpTxt} • ${tsTxt}`;
    }
  }

  _resizeAll() {
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 3);
    for (let i = 0; i < this._canvases.length; i++) {
      const canvas = this._canvases[i];
      const wrap = this._panelMetaEls[i]?.canvasWrap;
      if (!canvas || !wrap) continue;
      const rect = wrap.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) continue;

      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (this._sizes[i].w !== w || this._sizes[i].h !== h || canvas.width !== Math.round(w * dpr)) {
        this._sizes[i] = { w, h };
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
    }
  }

  _startAnimationLoop() {
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    const tick = (ts) => {
      if (this._disposed) return;
      if (this._lastFrameTs === 0) this._lastFrameTs = ts;
      const dt = Math.min(0.05, (ts - this._lastFrameTs) / 1000);
      this._lastFrameTs = ts;
      this._pulsePhase = (this._pulsePhase + dt * 2.7) % TWO_PI;

      if (this._sizes[0] && this._sizes[0].w >= 20) {
        this._drawAll();
      }
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  _drawAll() {
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 3);
    const pulse = 0.5 + 0.5 * Math.sin(this._pulsePhase);
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const analysis = this._getAnalysis();

    for (let i = 0; i < 2; i++) {
      const ctx = this._ctxs[i];
      const { w, h } = this._sizes[i];
      if (!ctx || w < 20 || h < 20) continue;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (i === 0) this._drawSPlanePanel(ctx, w, h, analysis, pulse, now);
      else this._drawStepResponsePanel(ctx, w, h, analysis, pulse);
    }
  }

  _drawSPlanePanel(ctx, w, h, a, pulse, now) {
    const compact = w < 430;
    const pad = getLabPad(w);
    const map = createPlotMapper(
      w,
      h,
      pad,
      LAB_SPLANE_BOUNDS.sigmaMin,
      LAB_SPLANE_BOUNDS.sigmaMax,
      LAB_SPLANE_BOUNDS.omegaMin,
      LAB_SPLANE_BOUNDS.omegaMax
    );

    const flashBreakaway =
      this._breakawayFlashTs > 0 ? clamp(1 - (now - this._breakawayFlashTs) / 450, 0, 1) : 0;

    drawSPlaneBackdrop(ctx, w, h, map, LAB_SPLANE_BOUNDS, {
      compact,
      highlightWn: a.wn,
      flashBreakaway,
      showRegionLabels: true,
    });

    const theme = getRegimeTheme(a.regime);
    const x0 = map.xToPx(0);
    const y0 = map.yToPx(0);
    const pxBreak = map.xToPx(-a.wn);

    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    // Critical Damping Breakaway Point marker (-ω_n, 0)
    const breakR = a.regime === 'critical' ? 6.5 : 4.2;
    ctx.save();
    ctx.strokeStyle =
      a.regime === 'critical' || flashBreakaway > 0.1
        ? COLORS.emerald
        : 'rgba(52, 211, 153, 0.58)';
    ctx.fillStyle = 'rgba(52, 211, 153, 0.18)';
    ctx.lineWidth = a.regime === 'critical' ? 1.8 : 1.2;
    ctx.beginPath();
    ctx.moveTo(pxBreak, y0 - breakR);
    ctx.lineTo(pxBreak + breakR, y0);
    ctx.lineTo(pxBreak, y0 + breakR);
    ctx.lineTo(pxBreak - breakR, y0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (a.regime !== 'critical') {
      ctx.font = `600 ${compact ? 8 : 9}px ${FONT_MONO}`;
      ctx.fillStyle = 'rgba(52, 211, 153, 0.78)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`-ωₙ`, pxBreak, y0 + 7);
    }
    ctx.restore();

    // Geometry overlays by regime
    if (a.regime === 'underdamped' || a.regime === 'undamped') {
      const pTop = a.poles[0];
      const pxS = map.xToPx(pTop.sigma);
      const pyPos = map.yToPx(pTop.omega);
      const pyNeg = map.yToPx(-pTop.omega);

      // Radius vector from origin to upper pole (distance = ω_n)
      ctx.save();
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(pxS, pyPos);
      ctx.stroke();

      // Damping cone angle θ = arccos(ζ) arc in screen coordinates
      if (a.regime === 'underdamped') {
        const screenAngle = Math.atan2(pyPos - y0, pxS - x0); // between -π and -π/2
        const arcR = Math.min(26, Math.hypot(pxS - x0, pyPos - y0) * 0.45);
        if (arcR > 8) {
          ctx.beginPath();
          ctx.arc(x0, y0, arcR, Math.PI, screenAngle, false);
          ctx.strokeStyle = 'rgba(252, 211, 77, 0.8)';
          ctx.lineWidth = 1.35;
          ctx.stroke();

          const midA = (Math.PI + screenAngle) / 2;
          const lx = x0 + (arcR + (compact ? 11 : 13)) * Math.cos(midA);
          const ly = y0 + (arcR + (compact ? 10 : 12)) * Math.sin(midA);
          ctx.font = `600 ${compact ? 8 : 9}px ${FONT_MONO}`;
          ctx.fillStyle = COLORS.amberLight;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`θ=${Math.round(a.thetaDeg)}°`, lx, ly);
        }

        // Real decay σ = ζω_n dashed horizontal bracket from jω-axis to pole
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = 1.15;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x0, pyPos);
        ctx.lineTo(pxS, pyPos);
        ctx.stroke();

        // Conjugate vertical connector
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.25)';
        ctx.beginPath();
        ctx.moveTo(pxS, pyPos);
        ctx.lineTo(pxS, pyNeg);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    } else if (a.regime === 'overdamped') {
      // Split trajectory line along negative real axis with outward arrows from -ω_n
      const sSlow = a.poles[0].sigma;
      const sFast = a.poles[1].sigma;
      const pxSlow = map.xToPx(sSlow);
      const pxFast = map.xToPx(Math.max(LAB_SPLANE_BOUNDS.sigmaMin + 0.15, sFast));

      ctx.save();
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.58)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(pxFast, y0);
      ctx.lineTo(pxSlow, y0);
      ctx.stroke();

      // Outward split arrows from breakaway point -ω_n
      if (pxSlow - pxBreak > 14) {
        drawArrowHead(ctx, pxBreak, y0, pxSlow - 8, y0, COLORS.violet, 5.5);
      }
      if (pxBreak - pxFast > 14) {
        drawArrowHead(ctx, pxBreak, y0, pxFast + 8, y0, COLORS.violet, 5.5);
      }
      ctx.restore();
    }

    ctx.restore();

    // Draw glowing pole markers
    const mSize = compact ? 6 : 7;
    if (a.regime === 'underdamped' || a.regime === 'undamped') {
      drawPoleMarker(ctx, map, a.poles[0].sigma, a.poles[0].omega, {
        pulse,
        color: theme.color,
        glow: theme.glow,
        size: mSize,
        isDragging: this._isDragging && this._activePoleSign >= 0,
      });
      drawPoleMarker(ctx, map, a.poles[1].sigma, a.poles[1].omega, {
        pulse,
        color: theme.color,
        glow: theme.glow,
        size: mSize,
        isDragging: this._isDragging && this._activePoleSign < 0,
      });

      const pillTxt =
        a.regime === 'undamped'
          ? `±${fmtPlain(a.wn, 1)}j`
          : `σ=-${fmtPlain(a.sigmaDom, 2)} ωₙ=${fmtPlain(a.wn, 1)}`;
      drawFloatingPill(ctx, map, map.xToPx(a.poles[0].sigma), map.yToPx(a.poles[0].omega), pillTxt, theme.color, true, compact);
    } else if (a.regime === 'critical') {
      drawPoleMarker(ctx, map, -a.wn, 0, {
        pulse,
        color: COLORS.emerald,
        glow: COLORS.emeraldGlow,
        size: mSize + 0.5,
        isDragging: this._isDragging,
        isDouble: true,
      });
      drawFloatingPill(
        ctx,
        map,
        pxBreak,
        y0,
        `×2 Breakaway (-${fmtPlain(a.wn, 1)})`,
        COLORS.emerald,
        true,
        compact
      );
    } else {
      // Overdamped: dominant slow pole s1 + fast pole s2
      const sSlow = a.poles[0].sigma;
      const sFast = a.poles[1].sigma;

      drawPoleMarker(ctx, map, sSlow, 0, {
        pulse,
        color: COLORS.violet,
        glow: COLORS.violetGlow,
        size: mSize + 0.5,
        isDragging: this._isDragging,
      });
      drawFloatingPill(
        ctx,
        map,
        map.xToPx(sSlow),
        y0,
        `s₁=${fmtPlain(sSlow, 2)} (slow)`,
        COLORS.violet,
        true,
        compact
      );

      if (sFast >= LAB_SPLANE_BOUNDS.sigmaMin + 0.15) {
        drawPoleMarker(ctx, map, sFast, 0, {
          pulse: 1 - pulse,
          color: COLORS.cyan,
          glow: COLORS.cyanGlow,
          size: mSize - 0.8,
        });
        drawFloatingPill(
          ctx,
          map,
          map.xToPx(sFast),
          y0,
          `s₂=${fmtPlain(sFast, 1)} (fast)`,
          COLORS.cyan,
          false,
          compact
        );
      } else {
        // Off-left fast pole indicator pinned cleanly at left plot edge
        drawFloatingPill(
          ctx,
          map,
          map.plotLeft + 4,
          y0,
          `← s₂=${fmtPlain(sFast, 1)} (fast)`,
          COLORS.cyan,
          false,
          compact
        );
      }
    }

    // Subtle drag prompt until user interacts
    if (!this._hasInteracted) {
      ctx.save();
      const hintTxt = compact ? 'Drag × pole' : 'Drag × pole along ωₙ semicircle';
      ctx.font = `600 ${compact ? 8.5 : 9.5}px ${FONT_SANS}`;
      const tw = ctx.measureText(hintTxt).width + 12;
      const hx = map.plotLeft + 6;
      const hy = map.plotBottom - 20;
      drawRoundedRect(ctx, hx, hy, tw, 16, 4.5);
      ctx.fillStyle = 'rgba(15, 19, 28, 0.86)';
      ctx.fill();
      ctx.strokeStyle = `rgba(34, 211, 238, ${(0.35 + 0.3 * pulse).toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#BAE6FD';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(hintTxt, hx + 6, hy + 8.5);
      ctx.restore();
    }
  }

  _drawStepResponsePanel(ctx, w, h, a, pulse) {
    const compact = w < 430;
    const pad = getLabPad(w);
    const tMin = 0;
    const tMax = 6.0;
    const yMin = -0.1;
    const yMax = a.zeta < 0.08 ? 2.15 : Math.max(1.56, a.yPeak + 0.18);

    const map = createPlotMapper(w, h, pad, tMin, tMax, yMin, yMax);
    drawEngineeringGrid(ctx, w, h, map, tMin, tMax, yMin, yMax, {
      showXLabels: true,
      showYLabels: true,
      xUnit: 's',
      compact,
    });

    const theme = getRegimeTheme(a.regime);
    const stepFn = (t) => evalSecondOrderStep(t, a.wn, a.zeta);

    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    // 1. ±2% Settling Band [0.98, 1.02]
    const pyBandTop = map.yToPx(1.02);
    const pyBandBot = map.yToPx(0.98);
    ctx.fillStyle = 'rgba(52, 211, 153, 0.14)';
    ctx.fillRect(map.plotLeft, pyBandTop, map.plotW, Math.max(2, pyBandBot - pyBandTop));

    // Setpoint r = 1 dashed reference line
    const pyOne = Math.round(map.yToPx(1.0)) + 0.5;
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.62)';
    ctx.lineWidth = 1.15;
    ctx.setLineDash([4, 3.5]);
    ctx.beginPath();
    ctx.moveTo(map.plotLeft, pyOne);
    ctx.lineTo(map.plotRight, pyOne);
    ctx.stroke();
    ctx.setLineDash([]);

    // Subtle r=1 ±2% tag on right edge
    ctx.font = `600 ${compact ? 8 : 9}px ${FONT_MONO}`;
    ctx.fillStyle = 'rgba(110, 231, 183, 0.82)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('r=1 (±2%)', map.plotRight - 5, pyBandTop - 2);

    // Subtle shaded wash under step curve
    const yZero = clamp(map.yToPx(0), map.plotTop, map.plotBottom);
    const fillSamples = 180;
    ctx.beginPath();
    ctx.moveTo(map.xToPx(tMin), yZero);
    for (let i = 0; i <= fillSamples; i++) {
      const t = tMin + ((tMax - tMin) * i) / fillSamples;
      ctx.lineTo(map.xToPx(t), map.yToPx(stepFn(t)));
    }
    ctx.lineTo(map.xToPx(tMax), yZero);
    ctx.closePath();
    ctx.fillStyle =
      a.regime === 'underdamped'
        ? 'rgba(34, 211, 238, 0.08)'
        : a.regime === 'critical'
        ? 'rgba(52, 211, 153, 0.09)'
        : a.regime === 'overdamped'
        ? 'rgba(167, 139, 250, 0.09)'
        : 'rgba(245, 158, 11, 0.09)';
    ctx.fill();

    // 2. Settling Time T_s ≈ 4/σ dashed vertical guide
    if (Number.isFinite(a.ts) && a.ts >= 0.15 && a.ts <= tMax - 0.1) {
      const pxTs = Math.round(map.xToPx(a.ts)) + 0.5;
      ctx.strokeStyle = `rgba(52, 211, 153, ${(0.45 + 0.25 * pulse).toFixed(2)})`;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([3.5, 3]);
      ctx.beginPath();
      ctx.moveTo(pxTs, map.plotTop);
      ctx.lineTo(pxTs, map.plotBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pill for T_s
      const tsTxt = `Tₛ≈${fmtPlain(a.ts, 2)}s`;
      ctx.font = `600 ${compact ? 8.5 : 9.5}px ${FONT_MONO}`;
      const tw = ctx.measureText(tsTxt).width + 8;
      const lx = clamp(pxTs + 4, map.plotLeft + 4, map.plotRight - tw - 4);
      const ly = map.plotBottom - 19;
      drawRoundedRect(ctx, lx, ly, tw, 15, 3.5);
      ctx.fillStyle = 'rgba(11, 13, 18, 0.88)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
      ctx.lineWidth = 0.85;
      ctx.stroke();
      ctx.fillStyle = '#A7F3D0';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(tsTxt, lx + 4, ly + 8);
    }

    ctx.restore();

    // 3. Main Glowing Step Response Curve
    drawGlowingCurve(ctx, map, stepFn, tMin, tMax, theme.color, theme.glow, 2.45, 320);

    // 4. Overshoot Peak M_p Marker (when underdamped/undamped with visible peak)
    if (a.mpPct >= 0.5 && Number.isFinite(a.tp) && a.tp <= tMax - 0.05) {
      const pxTp = map.xToPx(a.tp);
      const pyPeak = map.yToPx(a.yPeak);
      const pySet = map.yToPx(1.0);

      ctx.save();
      ctx.strokeStyle = COLORS.amberLight;
      ctx.lineWidth = 1.3;
      ctx.setLineDash([2.5, 2.5]);
      ctx.beginPath();
      ctx.moveTo(pxTp, pySet);
      ctx.lineTo(pxTp, pyPeak);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(pxTp, pyPeak, 3.6 + pulse * 1.4, 0, TWO_PI);
      ctx.strokeStyle = `rgba(252, 211, 77, ${(0.7 - pulse * 0.35).toFixed(2)})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pxTp, pyPeak, 3.0, 0, TWO_PI);
      ctx.fillStyle = COLORS.amberLight;
      ctx.fill();
      ctx.restore();

      drawFloatingPill(
        ctx,
        map,
        pxTp,
        pyPeak,
        `Mₚ=${fmtPlain(a.mpPct, 1)}%`,
        COLORS.amberLight,
        true,
        compact
      );
    }
  }

  dispose() {
    this._disposed = true;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    this._canvases = [];
    this._ctxs = [];
    this._panelMetaEls = [];
    this._presetButtons.clear();
    this._badgeEls = {};
    this._sliderEl = null;
    this._sliderLabelEl = null;
    this._sliderValueEl = null;
    this._root = null;
  }
}

// ===========================================================================
// PART 2: ModelingVisualQuizEngine (6 Deep Visual Intuition Challenges)
// ===========================================================================
const MODELING_QUIZ_CHALLENGES = [
  // Challenge 1: Identify Critical Damping on the s-Plane
  {
    id: 'mod-quiz-1',
    badge: 'Critical Damping',
    title: 'Identify Critical Damping on the s-Plane',
    targetKind: 'step',
    optionKind: 'splane',
    targetLabelMath: 'Target Step Response (ωₙ = 3)',
    targetLabelMech: 'Target RLC Step v_C(t) (ωₙ = 3)',
    targetFormulaMath: '\\omega_n = 3,\\quad \\zeta = 1\\ (0\\%\\text{ Overshoot})',
    targetFormulaMech: '\\omega_n = 1/\\sqrt{LC} = 3,\\quad \\zeta = 1',
    promptMath:
      'A mass-spring-damper has $\\omega_n = 3$. Which $s$-plane plot shows **critical damping ($\\zeta = 1$, fastest zero-overshoot response)**?',
    promptMech:
      'A series RLC filter with $\\omega_n = 3\\text{ rad/s}$ is tuned for **critical damping ($\\zeta = 1$, fastest rise with zero ringing)**. Which $s$-plane plot matches?',
    targetStep: {
      tDomain: [0, 3.8],
      yBounds: [-0.08, 1.48],
      fn: (t) => evalSecondOrderStep(t, 3.0, 1.0),
      ghostUnder: (t) => evalSecondOrderStep(t, 3.0, 0.35),
      ghostOver: (t) => evalSecondOrderStep(t, 3.0, 1.65),
      callout: 'Fastest 0% Overshoot (ζ=1)',
    },
    proofTextMath:
      'Critical damping ($\\zeta = 1$) occurs at the exact **breakaway point** where the conjugate pair collides on the negative real axis into a repeated double pole $s_{1,2} = -\\omega_n = -3$.',
    proofTextMech:
      'At $R = 2\\sqrt{L/C}$ ($\\zeta = 1$), the two poles merge into a repeated double pole at $s = -\\omega_n = -3\\text{ s}^{-1}$, giving the fastest possible rise without ringing.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        sBounds: { sigmaMin: -6.5, sigmaMax: 0.8, omegaMin: -4.2, omegaMax: 4.2 },
        highlightWn: 3.0,
        poles: [
          { sigma: -1.2, omega: 2.75, color: COLORS.cyan, glow: COLORS.cyanGlow },
          { sigma: -1.2, omega: -2.75, color: COLORS.cyan, glow: COLORS.cyanGlow },
        ],
        tag: '-1.2±2.8j',
        wrongHintMath:
          'Complex conjugate poles off the real axis ($\\omega_d \\neq 0$) have $\\zeta < 1$ (underdamped), which always introduces sinusoidal overshoot!',
        wrongHintMech:
          'Poles with nonzero imaginary parts ($\\pm 2.75j$) ring past the setpoint. Zero overshoot requires poles directly on the negative real axis.',
      },
      {
        letter: 'B',
        isCorrect: true,
        sBounds: { sigmaMin: -6.5, sigmaMax: 0.8, omegaMin: -4.2, omegaMax: 4.2 },
        highlightWn: 3.0,
        poles: [
          { sigma: -3.0, omega: 0, color: COLORS.emerald, glow: COLORS.emeraldGlow, isDouble: true },
        ],
        tag: 's=-3 (×2)',
        proof: { kind: 'critical-double', wn: 3.0 },
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        sBounds: { sigmaMin: -10.0, sigmaMax: 0.8, omegaMin: -4.2, omegaMax: 4.2 },
        highlightWn: 3.0,
        poles: [
          { sigma: -1.0, omega: 0, color: COLORS.violet, glow: COLORS.violetGlow },
          { sigma: -9.0, omega: 0, color: COLORS.violet, glow: COLORS.violetGlow },
        ],
        tag: '-1, -9',
        wrongHintMath:
          'Two split real poles ($s = -1, -9$) mean **overdamped** ($\\zeta > 1$). The slow pole near $-1$ drags out settling compared to the double pole at $-3$!',
        wrongHintMech:
          'Splitting the poles along the real axis creates a sluggish dominant pole at $s = -1$, making the circuit settle slower than critical damping at $-3$.',
      },
    ],
  },

  // Challenge 2: Effect of Increasing Damper c (or Resistance R)
  {
    id: 'mod-quiz-2',
    badge: 'Constant-ωₙ Locus',
    title: 'Effect of Increasing Damper c (or Resistance R)',
    targetKind: 'splane',
    optionKind: 'splane-trajectory',
    targetLabelMath: 'Initial Underdamped Poles (m, k Fixed)',
    targetLabelMech: 'Initial RLC Poles (L, C Fixed)',
    targetFormulaMath: 'c \\to 2c \\quad (\\omega_n = \\sqrt{k/m} = 3\\text{ fixed})',
    targetFormulaMech: 'R \\to 2R \\quad (\\omega_n = 1/\\sqrt{LC} = 3\\text{ fixed})',
    promptMath:
      'Starting from $s = -0.6 \\pm 2.94j$ ($\\omega_n = 3$), you **double damper $c$** while keeping $m$ and $k$ fixed. Which $s$-plane path do the poles trace?',
    promptMech:
      'Starting from RLC poles at $s = -0.6 \\pm 2.94j$, you **double resistance $R$** while keeping $L$ and $C$ fixed. Which $s$-plane trajectory do the poles follow?',
    targetSPlane: {
      sBounds: { sigmaMin: -4.6, sigmaMax: 0.7, omegaMin: -4.0, omegaMax: 4.0 },
      highlightWn: 3.0,
      poles: [
        { sigma: -0.6, omega: 2.94, color: COLORS.cyan, glow: COLORS.cyanGlow },
        { sigma: -0.6, omega: -2.94, color: COLORS.cyan, glow: COLORS.cyanGlow },
      ],
      callout: 'Start: -0.6±2.9j (c → 2c)',
    },
    proofTextMath:
      'Because $|s| = \\omega_n = \\sqrt{k/m}$ depends ONLY on $k$ and $m$, increasing $c$ slides the poles **along the constant-$\\omega_n$ semicircle** toward the negative real axis — never horizontally left!',
    proofTextMech:
      'Since $L$ and $C$ are fixed, radius $\\omega_n = 1/\\sqrt{LC} = 3$ stays locked! Increasing $R$ sweeps the poles clockwise along the constant-$\\omega_n$ circle toward $-3$.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        sBounds: { sigmaMin: -4.6, sigmaMax: 0.7, omegaMin: -4.2, omegaMax: 4.2 },
        highlightWn: 3.0,
        trajectory: {
          kind: 'horizontal-left',
          start: { sigma: -0.6, omega: 2.94 },
          end: { sigma: -2.8, omega: 2.94 },
        },
        wrongHintMath:
          'Moving straight left horizontally increases distance $|s| = \\omega_n$ from the origin, which would require stiffening $k$ too! Changing only $c$ preserves $\\omega_n = \\sqrt{k/m}$.',
        wrongHintMech:
          'A horizontal path leaves the $\\omega_n = 3$ circle, implying $1/\\sqrt{LC}$ changed. Raising only $R$ keeps the pole distance from the origin strictly constant.',
      },
      {
        letter: 'B',
        isCorrect: false,
        sBounds: { sigmaMin: -4.6, sigmaMax: 0.7, omegaMin: -4.5, omegaMax: 4.5 },
        highlightWn: 3.0,
        trajectory: {
          kind: 'vertical-out',
          start: { sigma: -0.6, omega: 2.4 },
          end: { sigma: -0.6, omega: 4.1 },
        },
        wrongHintMath:
          'Moving vertically outward keeps $\\sigma = -c/(2m)$ constant while raising $\\omega_d$ — that comes from stiffening spring $k$, not increasing damper $c$!',
        wrongHintMech:
          'Vertical motion changes $\\omega_d$ at fixed $R/(2L)$. Increasing resistance $R$ pulls poles more negative in $\\sigma$ and lowers ringing frequency $\\omega_d$.',
      },
      {
        letter: 'C',
        isCorrect: true,
        sBounds: { sigmaMin: -4.6, sigmaMax: 0.7, omegaMin: -4.2, omegaMax: 4.2 },
        highlightWn: 3.0,
        trajectory: {
          kind: 'arc-const-wn',
          wn: 3.0,
          zStart: 0.2,
          zEnd: 0.78,
        },
        proof: { kind: 'const-wn-radius', wn: 3.0, zEnd: 0.78 },
        wrongHintMath: '',
        wrongHintMech: '',
      },
    ],
  },

  // Challenge 3: Faster Settling Time (T_s ≈ 4/σ) vs. Lower Overshoot
  {
    id: 'mod-quiz-3',
    badge: 'Settling Time',
    title: 'Faster Settling Time (Tₛ ≈ 4/σ) at Fixed ζ',
    targetKind: 'splane',
    optionKind: 'splane',
    targetLabelMath: 'Constant-ζ Cone (Same % Overshoot)',
    targetLabelMech: 'Servo Overshoot Constraint (ζ = 0.5)',
    targetFormulaMath: '\\zeta = 0.5\\ (\\theta = 60^\\circ),\\quad T_s \\approx \\frac{4}{\\sigma}',
    targetFormulaMech: 'M_p = 16\\%\\text{ fixed},\\quad \\min T_s \\iff \\max |\\sigma|',
    promptMath:
      'All three pole pairs sit on the **same damping ray $\\zeta = 0.5$** ($\\theta = 60^\\circ$, identical overshoot). Which pair **settles fastest** ($T_s \\approx 4/\\sigma$)?',
    promptMech:
      'Three motor controllers have identical $16\\%$ overshoot ($\\zeta = 0.5$, same angle $\\theta = 60^\\circ$). Which pole pair gives the **fastest settling time $T_s \\approx 4/\\sigma$**?',
    targetSPlane: {
      sBounds: { sigmaMin: -3.2, sigmaMax: 0.6, omegaMin: -4.4, omegaMax: 4.4 },
      highlightZetaRay: 0.5,
      poles: [],
      callout: 'Same ζ=0.5 ray → Minimize Tₛ ≈ 4/σ',
    },
    proofTextMath:
      'Along a fixed-$\\zeta$ ray, overshoot is identical, while settling time $T_s \\approx 4/|\\sigma|$ shrinks as poles move **farther left in the LHP**! Option A ($\\sigma = -2.2$) settles in $1.8\\text{ s}$ — over $4\\times$ faster than B.',
    proofTextMech:
      'Pushing the closed-loop poles deeper into the LHP along $\\theta = 60^\\circ$ scales bandwidth $\\omega_n$ up while preserving $16\\%$ overshoot, cutting $T_s = 4/2.2 \\approx 1.8\\text{ s}$.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        sBounds: { sigmaMin: -3.2, sigmaMax: 0.6, omegaMin: -4.4, omegaMax: 4.4 },
        highlightZetaRay: 0.5,
        poles: [
          { sigma: -2.2, omega: 3.81, color: COLORS.emerald, glow: COLORS.emeraldGlow },
          { sigma: -2.2, omega: -3.81, color: COLORS.emerald, glow: COLORS.emeraldGlow },
        ],
        tag: 'σ=-2.2',
        proof: { kind: 'sigma-bracket', sigma: -2.2, omega: 3.81, ts: '1.8s' },
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        sBounds: { sigmaMin: -3.2, sigmaMax: 0.6, omegaMin: -4.4, omegaMax: 4.4 },
        highlightZetaRay: 0.5,
        poles: [
          { sigma: -0.5, omega: 0.87, color: COLORS.cyan, glow: COLORS.cyanGlow },
          { sigma: -0.5, omega: -0.87, color: COLORS.cyan, glow: COLORS.cyanGlow },
        ],
        tag: 'σ=-0.5',
        wrongHintMath:
          'Poles close to the $j\\omega$-axis have small $|\\sigma| = 0.5$, giving a slow settling time $T_s \\approx 4/0.5 = 8.0\\text{ s}$. Look for the largest $|\\sigma|$ (furthest left)!',
        wrongHintMech:
          'With $\\sigma = -0.5\\text{ s}^{-1}$ near the origin, this servo takes $8\\text{ s}$ to settle. Faster settling demands poles further left in the LHP.',
      },
      {
        letter: 'C',
        isCorrect: false,
        sBounds: { sigmaMin: -3.2, sigmaMax: 0.6, omegaMin: -4.4, omegaMax: 4.4 },
        highlightZetaRay: 0.5,
        poles: [
          { sigma: -1.1, omega: 1.91, color: COLORS.cyan, glow: COLORS.cyanGlow },
          { sigma: -1.1, omega: -1.91, color: COLORS.cyan, glow: COLORS.cyanGlow },
        ],
        tag: 'σ=-1.1',
        wrongHintMath:
          'Here $|\\sigma| = 1.1$ settles in $T_s \\approx 3.6\\text{ s}$ — faster than B, but Option A sits twice as far left ($|\\sigma| = 2.2$) and settles in $1.8\\text{ s}$!',
        wrongHintMech:
          'Option C is mid-speed ($3.6\\text{ s}$). Look farther left along the $\\zeta = 0.5$ ray for the highest decay rate $|\\sigma|$.',
      },
    ],
  },

  // Challenge 4: Match Overdamped Dominant Pole to Step Response
  {
    id: 'mod-quiz-4',
    badge: 'Dominant Pole',
    title: 'Match Overdamped Dominant Pole to Step Response',
    targetKind: 'splane',
    optionKind: 'step',
    targetLabelMath: 'Overdamped Real Poles (s₁ = -0.5, s₂ = -6)',
    targetLabelMech: 'Overdamped Actuator Poles (s₁ = -0.5, s₂ = -6)',
    targetFormulaMath: 's_1 = -0.5\\text{ (slow)},\\quad s_2 = -6.0\\text{ (fast)}',
    targetFormulaMech: '\\tau_1 = 2.0\\text{ s (dominant)},\\quad \\tau_2 = 0.17\\text{ s}',
    promptMath:
      'An overdamped system has two real poles at **$s_1 = -0.5$** and **$s_2 = -6.0$**. Which unit-step response $y(t)$ matches?',
    promptMech:
      'An overdamped hydraulic valve has poles at **$s_1 = -0.5\\text{ s}^{-1}$** and **$s_2 = -6.0\\text{ s}^{-1}$**. Which step response $x(t)$ matches?',
    targetSPlane: {
      sBounds: { sigmaMin: -7.0, sigmaMax: 0.7, omegaMin: -3.0, omegaMax: 3.0 },
      poles: [
        { sigma: -0.5, omega: 0, color: COLORS.violet, glow: COLORS.violetGlow },
        { sigma: -6.0, omega: 0, color: COLORS.cyan, glow: COLORS.cyanGlow },
      ],
      callout: 'Dominant slow s₁=-0.5 • Fast s₂=-6',
    },
    proofTextMath:
      'Both poles are real ($\\omega_d = 0$), so overshoot is strictly $0\\%$. The fast mode $e^{-6t}$ vanishes in $0.5\\text{ s}$, leaving the **dominant slow pole $s_1 = -0.5$** ($T_s \\approx 4/0.5 = 8\\text{ s}$) to govern the rise!',
    proofTextMech:
      'The pole closest to the $j\\omega$-axis ($s_1 = -0.5$, $\\tau_1 = 2\\text{ s}$) bottlenecks the entire step response with zero overshoot, while the fast $s_2 = -6$ transient disappears almost instantly.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        tDomain: [0, 8.0],
        yBounds: [-0.08, 1.55],
        fn: (t) => evalSecondOrderStep(t, 3.0, 0.22),
        wrongHintMath:
          'Ringing and overshoot require complex conjugate poles ($\\omega_d \\neq 0$). Here both $s_1 = -0.5$ and $s_2 = -6$ lie squarely on the real axis!',
        wrongHintMech:
          'Real LHP poles never oscillate. An overdamped valve rises smoothly toward $r = 1$ with zero overshoot.',
      },
      {
        letter: 'B',
        isCorrect: true,
        tDomain: [0, 8.0],
        yBounds: [-0.08, 1.35],
        fn: (t) => evalTwoRealPolesStep(t, -0.5, -6.0),
        proof: { kind: 'dominant-step', tau: 2.0, sDom: -0.5 },
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        tDomain: [0, 8.0],
        yBounds: [-0.08, 1.35],
        fn: (t) => evalSecondOrderStep(t, 6.0, 1.0),
        wrongHintMath:
          'That fast rise settles in $< 1\\text{ s}$ (as if both poles were at $-6$). Remember: the **slowest** pole ($s_1 = -0.5$, $\\tau = 2\\text{ s}$) dominates settling!',
        wrongHintMech:
          'Don’t let the fast pole $s_2 = -6$ fool you — the slow pole at $s_1 = -0.5$ acts like a bottleneck, stretching rise time out to several seconds.',
      },
    ],
  },

  // Challenge 5: Mechanical ↔ Electrical RLC Analogy
  {
    id: 'mod-quiz-5',
    badge: 'RLC Analogy',
    title: 'Mechanical ↔ Electrical RLC Analogy',
    targetKind: 'rlc-schematic',
    optionKind: 'step',
    targetLabelMath: 'Series RLC Circuit (L↔m, R↔c, 1/C↔k)',
    targetLabelMech: 'Low-Resistance Series RLC Filter',
    targetFormulaMath: 'R \\ll 2\\sqrt{L/C} \\implies \\zeta \\approx 0.12',
    targetFormulaMech: 'L\\ddot{v}_C + R\\dot{v}_C + \\frac{1}{C}v_C = \\frac{1}{C}v_{\\text{in}}',
    promptMath:
      'In a Series RLC circuit ($m \\leftrightarrow L,\\ c \\leftrightarrow R,\\ k \\leftrightarrow 1/C$), resistance is **very low** ($R \\ll 2\\sqrt{L/C}$). Which capacitor voltage $v_C(t)$ step response matches?',
    promptMech:
      'A Series RLC power filter has **very low resistance** $R \\ll 2\\sqrt{L/C}$ ($\\zeta \\approx 0.12$). Which capacitor voltage step response $v_C(t)$ appears on the scope?',
    targetRlc: {
      subtitle: 'R ≪ 2√(L/C) ⇒ Lightly Damped (ζ ≈ 0.12)',
    },
    proofTextMath:
      'Resistance $R$ plays the exact role of mechanical damper $c$. When $R \\ll 2\\sqrt{L/C}$, damping ratio $\\zeta = \\frac{R}{2}\\sqrt{C/L} \\ll 1$ — so energy sloshes between $L$ and $C$, causing large overshoot ($M_p \\approx 68\\%$) and sustained ringing around $v_C = 1$!',
    proofTextMech:
      'Tiny resistance $R$ dissipates very little energy per cycle: inductor $L$ (inertia) overshoots capacitor $C$ (spring) up to $\\approx 1.68\\times v_{\\text{in}}$ before slowly ringing down to $1$.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        tDomain: [0, 6.0],
        yBounds: [-0.1, 1.9],
        fn: (t) => evalSecondOrderStep(t, 4.0, 0.12),
        proof: { kind: 'ringing-envelope', wn: 4.0, zeta: 0.12 },
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        tDomain: [0, 6.0],
        yBounds: [-0.1, 1.4],
        fn: (t) => evalSecondOrderStep(t, 4.0, 1.8),
        wrongHintMath:
          'That sluggish overdamped rise occurs when resistance $R$ is **large** ($R > 2\\sqrt{L/C}$). Here $R$ is tiny, so damping $\\zeta$ is near zero!',
        wrongHintMech:
          'Overdamped charging requires high resistance $R$ to absorb inductor energy. With $R \\ll 2\\sqrt{L/C}$, $v_C(t)$ rings strongly past the target voltage.',
      },
      {
        letter: 'C',
        isCorrect: false,
        tDomain: [0, 6.0],
        yBounds: [-0.1, 1.4],
        fn: (t) => Math.exp(-1.5 * t),
        wrongHintMath:
          'A unit step input charges $v_C(t)$ toward steady-state $1$ (not decaying to $0$), and the inductor $L$ causes 2nd-order ringing rather than 1st-order decay!',
        wrongHintMech:
          'That curve discharges to $0$. Under a step input $v_{\\text{in}} = 1$, $v_C(t)$ rises toward $1$ and overshoots due to magnetic energy stored in $L$.',
      },
    ],
  },

  // Challenge 6: Closing the Feedback Loop Shifts Stiffness & Poles
  {
    id: 'mod-quiz-6',
    badge: 'Closed-Loop Poles',
    title: 'Proportional Feedback Shifts Stiffness & Poles',
    targetKind: 'feedback-loop',
    optionKind: 'splane-trajectory',
    targetLabelMath: 'Unity Proportional Feedback (k_eff = k + K_p)',
    targetLabelMech: 'Closed-Loop P-Controller Root Locus',
    targetFormulaMath: 'm\\ddot{x} + c\\dot{x} + (k + K_p)x = K_p r',
    targetFormulaMech: '\\sigma = -\\frac{c}{2m} = \\text{const},\\quad \\omega_n = \\sqrt{\\frac{k+K_p}{m}} \\uparrow',
    promptMath:
      'Adding proportional feedback $K_p$ around a damped mass raises effective stiffness $k_{\\text{eff}} = k + K_p$ while keeping **$\\sigma = -c/(2m)$ constant**! Which $s$-plane path do the poles follow as $K_p$ increases?',
    promptMech:
      'Increasing proportional gain $K_p$ on a damped servo stiffens $k_{\\text{eff}} = k + K_p$ without adding damping $c$. Which closed-loop pole trajectory results?',
    targetFeedback: {
      sigma: -1.2,
    },
    proofTextMath:
      'Because the real part $\\sigma = -c/(2m)$ is independent of $K_p$, raising $K_p$ moves the complex poles **straight vertically up and down** along the line $\\text{Re}(s) = -c/(2m)$ — increasing $\\omega_d$ (faster oscillation) while lowering $\\zeta$!',
    proofTextMech:
      'Proportional gain $K_p$ acts purely like a virtual spring: it locks $\\sigma = -c/(2m)$ and shoots the closed-loop poles vertically outward, increasing speed at the cost of higher overshoot.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        sBounds: { sigmaMin: -4.2, sigmaMax: 0.7, omegaMin: -4.4, omegaMax: 4.4 },
        trajectory: {
          kind: 'horizontal-left',
          start: { sigma: -0.9, omega: 2.2 },
          end: { sigma: -3.2, omega: 2.2 },
        },
        wrongHintMath:
          'Shifting $\\sigma = -c/(2m)$ horizontally left requires increasing damping $c$ (or adding derivative feedback $K_d$), not proportional stiffness $K_p$!',
        wrongHintMech:
          'Moving poles left increases decay rate $|\\sigma|$ — that requires derivative damping $K_d$, whereas proportional $K_p$ leaves $\\sigma = -c/(2m)$ unchanged.',
      },
      {
        letter: 'B',
        isCorrect: true,
        sBounds: { sigmaMin: -4.2, sigmaMax: 0.7, omegaMin: -4.4, omegaMax: 4.4 },
        trajectory: {
          kind: 'vertical-out',
          start: { sigma: -1.2, omega: 1.2 },
          end: { sigma: -1.2, omega: 3.7 },
        },
        proof: { kind: 'const-sigma-line', sigma: -1.2 },
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        sBounds: { sigmaMin: -4.2, sigmaMax: 0.7, omegaMin: -4.4, omegaMax: 4.4 },
        highlightWn: 3.0,
        trajectory: {
          kind: 'arc-const-wn',
          wn: 3.0,
          zStart: 0.25,
          zEnd: 0.85,
        },
        wrongHintMath:
          'A constant-$\\omega_n$ semicircle happens when varying damper $c$ at fixed stiffness $k$. Here $K_p$ raises $k_{\\text{eff}} = k + K_p$, increasing $\\omega_n$!',
        wrongHintMech:
          'Sweeping along a semicircle keeps $\\omega_n$ fixed by tuning damping. Raising $K_p$ increases $\\omega_n = \\sqrt{(k+K_p)/m}$ along a vertical line of constant $\\sigma$.',
      },
    ],
  },
];

export class ModelingVisualQuizEngine {
  constructor(containerOrOptions = {}, maybeOptions = {}) {
    const isElement =
      containerOrOptions &&
      typeof containerOrOptions === 'object' &&
      containerOrOptions.nodeType === 1;
    const autoMountContainer = isElement ? containerOrOptions : null;
    const options = isElement ? maybeOptions || {} : containerOrOptions || {};

    const {
      lens = 'math',
      mechatronicsLens = lens === 'mechatronics',
      onProgress = null,
      onAnswer = null,
      onComplete = null,
    } = options;

    this.mechatronicsLens = Boolean(mechatronicsLens);
    this.onProgress = typeof onProgress === 'function' ? onProgress : null;
    this.onAnswer = typeof onAnswer === 'function' ? onAnswer : null;
    this.onComplete = typeof onComplete === 'function' ? onComplete : null;

    this._challenges = MODELING_QUIZ_CHALLENGES;
    this._currentIndex = 0;
    this._solvedIds = new Set();
    for (const ch of this._challenges) {
      if (isQuizSolvedInStore(ch.id)) {
        this._solvedIds.add(ch.id);
      }
    }

    this._wrongSelection = null;
    this._container = null;
    this._root = null;
    this._targetCanvas = null;
    this._targetCtx = null;
    this._targetWrap = null;
    this._targetSize = null;
    this._optionCanvases = [];
    this._optionCtxs = [];
    this._optionCards = [];
    this._optionSizes = [];
    this._feedbackSlot = null;

    this._resizeObserver = null;
    this._abortController = null;
    this._rafId = null;
    this._pulsePhase = 0;
    this._lastFrameTs = 0;
    this._disposed = false;

    if (autoMountContainer) {
      this.mount(autoMountContainer);
    }
  }

  static get CHALLENGES() {
    return MODELING_QUIZ_CHALLENGES;
  }

  mount(container) {
    if (!container) return this;
    injectStylesOnce();
    this.dispose();
    this._disposed = false;
    this._container = container;
    this._abortController = new AbortController();

    this._renderChallengeView();

    if (typeof ResizeObserver !== 'undefined' && this._root) {
      this._resizeObserver = new ResizeObserver(() => {
        if (this._disposed) return;
        this._resizeCanvases();
        this._drawCanvases();
      });
      this._resizeObserver.observe(this._root);
    }

    this._startAnimationLoop();
    return this;
  }

  setMechatronicsLens(bool) {
    const next = Boolean(bool);
    if (next === this.mechatronicsLens) return;
    this.mechatronicsLens = next;
    if (this._container && !this._disposed) {
      this._renderChallengeView();
    }
  }

  setLens(lens) {
    this.setMechatronicsLens(lens === 'mechatronics');
  }

  _getCurrentChallenge() {
    return this._challenges[this._currentIndex];
  }

  _isCurrentSolved() {
    return this._solvedIds.has(this._getCurrentChallenge().id);
  }

  _renderChallengeView() {
    if (!this._container) return;
    const ch = this._getCurrentChallenge();
    const solved = this._isCurrentSolved();
    const { signal } = this._abortController;

    if (!this._root) {
      this._root = document.createElement('div');
      this._root.className =
        'w-full rounded-2xl border border-slate-800/90 bg-[#0B0D12]/95 shadow-2xl overflow-hidden backdrop-blur-md';
      this._container.innerHTML = '';
      this._container.appendChild(this._root);
    }

    this._root.innerHTML = '';
    this._optionCanvases = [];
    this._optionCtxs = [];
    this._optionCards = [];

    // --- 1. Compact Header & 1–6 Challenge Stepper ---
    const header = document.createElement('div');
    header.className =
      'px-3 py-2 sm:px-4 sm:py-3 border-b border-slate-800/80 bg-[#0F131C]/90 flex flex-wrap items-center justify-between gap-2 sm:gap-3';

    const titleBlock = document.createElement('div');
    titleBlock.className = 'flex items-center gap-2 min-w-0';
    titleBlock.innerHTML = `
      <span class="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider bg-cyan-500/15 border border-cyan-400/35 text-cyan-300">
        ${escapeHtml(ch.badge)}
      </span>
      <span class="text-xs sm:text-sm font-semibold text-slate-100 truncate">${escapeHtml(ch.title)}</span>
      <span class="hidden sm:inline text-xs font-mono text-slate-400">${this._currentIndex + 1} / ${this._challenges.length}</span>
    `;

    const stepper = document.createElement('div');
    stepper.className = 'flex items-center gap-1 sm:gap-1.5 shrink-0';

    this._challenges.forEach((item, idx) => {
      const isSolved = this._solvedIds.has(item.id);
      const isActive = idx === this._currentIndex;
      const stepBtn = document.createElement('button');
      stepBtn.type = 'button';
      stepBtn.title = `${idx + 1}. ${item.title}`;
      stepBtn.className =
        'el-mod-pill w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[11px] sm:text-xs font-mono font-semibold flex items-center justify-center border cursor-pointer ' +
        (isActive
          ? isSolved
            ? 'bg-emerald-400/20 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.35)]'
            : 'bg-cyan-400/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
          : isSolved
          ? 'bg-emerald-500/15 border-emerald-500/45 text-emerald-300 hover:border-emerald-400'
          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600');
      stepBtn.textContent = isSolved ? '✓' : String(idx + 1);
      stepBtn.addEventListener(
        'click',
        () => {
          if (idx === this._currentIndex) return;
          safeSound('playTick');
          this._currentIndex = idx;
          this._wrongSelection = null;
          this._renderChallengeView();
        },
        { signal }
      );
      stepper.appendChild(stepBtn);
    });

    const solvedPill = document.createElement('span');
    solvedPill.className =
      'ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-slate-900 border border-slate-800 text-emerald-300';
    solvedPill.textContent = `${this._solvedIds.size}/${this._challenges.length}`;
    stepper.appendChild(solvedPill);

    header.append(titleBlock, stepper);
    this._root.appendChild(header);

    // --- 2. Compact Prompt & Target Visual Canvas ---
    const body = document.createElement('div');
    body.className = 'p-2.5 sm:p-4 flex flex-col gap-2.5 sm:gap-3.5';

    const promptBox = document.createElement('div');
    promptBox.className = 'flex flex-col gap-1.5 sm:gap-2';

    const promptText = document.createElement('p');
    promptText.className = 'text-xs sm:text-[14.5px] leading-snug sm:leading-relaxed text-slate-200';
    const rawPrompt = this.mechatronicsLens ? ch.promptMech : ch.promptMath;
    promptText.innerHTML = formatInlineMath(rawPrompt).replace(
      /\*\*([^*]+)\*\*/g,
      '<strong class="text-cyan-200 font-semibold">$1</strong>'
    );
    promptBox.appendChild(promptText);

    const targetFrame = document.createElement('div');
    targetFrame.className =
      'relative rounded-xl border border-slate-800/90 bg-[#0B0D12] overflow-hidden';

    const targetTopBar = document.createElement('div');
    targetTopBar.className =
      'px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#0E121B]/95 border-b border-slate-800/60 flex items-center justify-between gap-2';

    const targetFormula = this.mechatronicsLens ? ch.targetFormulaMech : ch.targetFormulaMath;
    const targetLabel = this.mechatronicsLens ? ch.targetLabelMech : ch.targetLabelMath;
    targetTopBar.innerHTML = `
      <span class="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-cyan-200 truncate">
        <span class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE] shrink-0"></span>
        <span class="truncate">${escapeHtml(targetLabel)}</span>
      </span>
      <span class="text-[10px] sm:text-xs text-slate-200 shrink-0">${formatKatex(targetFormula, false)}</span>
    `;
    targetFrame.appendChild(targetTopBar);

    const targetCanvasWrap = document.createElement('div');
    targetCanvasWrap.className = 'relative w-full h-[120px] sm:h-[180px]';

    const targetCanvas = document.createElement('canvas');
    targetCanvas.className = 'el-mod-canvas h-full';
    targetCanvasWrap.appendChild(targetCanvas);
    targetFrame.appendChild(targetCanvasWrap);

    this._targetCanvas = targetCanvas;
    this._targetCtx = targetCanvas.getContext('2d');
    this._targetWrap = targetCanvasWrap;

    promptBox.appendChild(targetFrame);
    body.appendChild(promptBox);

    // --- 3. 3-Column Side-by-Side A/B/C Candidate Canvases (Mobile Zero-Scroll!) ---
    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'grid grid-cols-3 gap-1.5 sm:gap-3';

    const optKindLabel =
      ch.optionKind === 'step'
        ? this.mechatronicsLens
          ? 'Step'
          : 'y(t)'
        : 's-Plane';

    ch.options.forEach((opt) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className =
        'el-mvq-card text-left rounded-xl border border-slate-800/90 bg-[#0F131C]/80 overflow-hidden flex flex-col focus:outline-none focus:ring-2 focus:ring-cyan-400/50';

      if (solved && opt.isCorrect) {
        card.dataset.state = 'correct';
        card.dataset.locked = 'true';
      } else if (solved) {
        card.dataset.locked = 'true';
        card.className += ' opacity-60';
      } else if (this._wrongSelection && this._wrongSelection.letter === opt.letter) {
        card.dataset.state = 'wrong';
      }

      const cardHeader = document.createElement('div');
      cardHeader.className =
        'px-2 py-1 sm:px-3 sm:py-1.5 border-b border-slate-800/60 flex items-center justify-between gap-1 bg-[#0E121B]/90';

      const badgeColor =
        solved && opt.isCorrect
          ? 'bg-emerald-400/20 border-emerald-400/70 text-emerald-200'
          : this._wrongSelection?.letter === opt.letter
          ? 'bg-rose-400/20 border-rose-400/70 text-rose-200'
          : 'bg-slate-800/90 border-slate-700 text-slate-200';

      const rightBadge =
        solved && opt.isCorrect
          ? `<span class="text-[10px] sm:text-[11px] font-semibold text-emerald-300">✓<span class="hidden sm:inline"> Match</span></span>`
          : solved
          ? `<span class="hidden sm:inline text-[10px] font-mono text-slate-500">Distractor</span>`
          : `<span class="hidden sm:inline text-[10px] font-mono text-slate-400">Select</span>`;

      cardHeader.innerHTML = `
        <span class="inline-flex items-center gap-1.5">
          <span class="w-5 h-5 rounded-md text-[11px] font-mono font-bold border flex items-center justify-center ${badgeColor}">
            ${opt.letter}
          </span>
          <span class="hidden sm:inline text-xs font-medium text-slate-300">${optKindLabel} ${opt.letter}</span>
        </span>
        ${rightBadge}
      `;
      card.appendChild(cardHeader);

      const canvasWrap = document.createElement('div');
      canvasWrap.className = 'relative w-full bg-[#0B0D12] h-[88px] sm:h-[136px]';

      const canvas = document.createElement('canvas');
      canvas.className = 'el-mod-canvas h-full';
      canvasWrap.appendChild(canvas);
      card.appendChild(canvasWrap);

      card.addEventListener('click', () => this._handleOptionClick(opt), { signal });

      optionsGrid.appendChild(card);
      this._optionCards.push({ card, canvasWrap, opt });
      this._optionCanvases.push(canvas);
      this._optionCtxs.push(canvas.getContext('2d'));
    });

    body.appendChild(optionsGrid);

    // --- 4. Feedback Banner (Geometric Proof OR Targeted Misconception Hint) ---
    const feedbackSlot = document.createElement('div');
    this._feedbackSlot = feedbackSlot;

    if (solved) {
      this._renderSolvedFeedback(feedbackSlot, ch);
    } else if (this._wrongSelection) {
      this._renderWrongFeedback(feedbackSlot, this._wrongSelection);
    }

    body.appendChild(feedbackSlot);
    this._root.appendChild(body);

    this._resizeCanvases();
    this._drawCanvases();
  }

  _handleOptionClick(opt) {
    const ch = this._getCurrentChallenge();
    if (this._isCurrentSolved()) return;

    const isCorrect = Boolean(opt.isCorrect);
    safeStore('recordAttempt', isCorrect);

    if (isCorrect) {
      this._wrongSelection = null;
      this._solvedIds.add(ch.id);
      safeSound('playSuccess');
      safeStore('markQuizSolved', ch.id);

      this._renderChallengeView();

      const payload = {
        solvedCount: this._solvedIds.size,
        total: this._challenges.length,
        challengeId: ch.id,
        isCorrect: true,
      };
      try {
        this.onAnswer?.(payload);
        this.onProgress?.(payload);
        if (this._solvedIds.size === this._challenges.length) {
          this.onComplete?.(payload);
        }
      } catch (_) {
        // Ignore consumer errors
      }
    } else {
      safeSound('playGentleError');
      const hint = this.mechatronicsLens ? opt.wrongHintMech : opt.wrongHintMath;
      this._wrongSelection = { letter: opt.letter, hint };

      for (const item of this._optionCards) {
        if (item.opt.letter === opt.letter) {
          item.card.dataset.state = 'wrong';
          item.card.classList.remove('shake-gentle');
          void item.card.offsetWidth;
          item.card.classList.add('shake-gentle');
        } else {
          delete item.card.dataset.state;
        }
      }

      if (this._feedbackSlot) {
        this._renderWrongFeedback(this._feedbackSlot, this._wrongSelection);
      }

      const payload = {
        solvedCount: this._solvedIds.size,
        total: this._challenges.length,
        challengeId: ch.id,
        isCorrect: false,
      };
      try {
        this.onAnswer?.(payload);
        this.onProgress?.(payload);
      } catch (_) {
        // Ignore consumer errors
      }
    }
  }

  _renderSolvedFeedback(slot, ch) {
    const rawProof = this.mechatronicsLens ? ch.proofTextMech : ch.proofTextMath;
    const proofHtml = formatInlineMath(rawProof).replace(
      /\*\*([^*]+)\*\*/g,
      '<strong class="text-emerald-200 font-semibold">$1</strong>'
    );
    const isLast = this._currentIndex === this._challenges.length - 1;
    const allSolved = this._solvedIds.size === this._challenges.length;

    slot.innerHTML = '';
    const box = document.createElement('div');
    box.className =
      'rounded-xl border border-emerald-400/45 bg-emerald-500/10 p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3';

    const left = document.createElement('div');
    left.className = 'flex flex-col gap-1';
    left.innerHTML = `
      <div class="flex items-center gap-2 text-xs font-semibold text-emerald-300">
        <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-400/20 border border-emerald-400/60 text-[10px]">✓</span>
        Geometric s-Plane Proof Unlocked
      </div>
      <p class="text-xs sm:text-[13px] leading-relaxed text-slate-200">
        ${proofHtml}
      </p>
    `;

    const actionWrap = document.createElement('div');
    actionWrap.className = 'shrink-0 flex items-center gap-2';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className =
      'el-mod-pill px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-400/60 text-emerald-100 cursor-pointer whitespace-nowrap';

    if (!isLast) {
      nextBtn.textContent = 'Next Challenge →';
      nextBtn.addEventListener(
        'click',
        () => {
          safeSound('playTick');
          this._currentIndex += 1;
          this._wrongSelection = null;
          this._renderChallengeView();
        },
        { signal: this._abortController.signal }
      );
    } else if (allSolved) {
      nextBtn.textContent = `All ${this._challenges.length} Mastered • Review 1 →`;
      nextBtn.addEventListener(
        'click',
        () => {
          safeSound('playTick');
          this._currentIndex = 0;
          this._wrongSelection = null;
          this._renderChallengeView();
        },
        { signal: this._abortController.signal }
      );
    } else {
      const nextUnsolved = this._challenges.findIndex((c) => !this._solvedIds.has(c.id));
      nextBtn.textContent = `Go to Challenge ${nextUnsolved + 1} →`;
      nextBtn.addEventListener(
        'click',
        () => {
          safeSound('playTick');
          this._currentIndex = nextUnsolved >= 0 ? nextUnsolved : 0;
          this._wrongSelection = null;
          this._renderChallengeView();
        },
        { signal: this._abortController.signal }
      );
    }

    actionWrap.appendChild(nextBtn);
    box.append(left, actionWrap);
    slot.appendChild(box);
  }

  _renderWrongFeedback(slot, wrongSelection) {
    slot.innerHTML = '';
    const box = document.createElement('div');
    box.className =
      'rounded-xl border border-rose-400/40 bg-rose-500/10 p-2.5 sm:p-3 flex items-start gap-2.5';
    const hintHtml = formatInlineMath(wrongSelection.hint).replace(
      /\*\*([^*]+)\*\*/g,
      '<strong class="text-rose-200 font-semibold">$1</strong>'
    );
    box.innerHTML = `
      <span class="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-rose-400/20 border border-rose-400/60 text-rose-300 text-xs font-bold flex items-center justify-center">!</span>
      <div class="text-xs sm:text-[13px] leading-relaxed text-rose-100/95">
        <span class="font-semibold text-rose-300">Not Option ${escapeHtml(wrongSelection.letter)}:</span>
        ${hintHtml}
      </div>
    `;
    slot.appendChild(box);
  }

  _resizeCanvases() {
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 3);

    if (this._targetCanvas && this._targetWrap) {
      const r = this._targetWrap.getBoundingClientRect();
      if (r.width >= 20 && r.height >= 20) {
        this._targetSize = { w: Math.floor(r.width), h: Math.floor(r.height) };
        this._targetCanvas.width = Math.round(this._targetSize.w * dpr);
        this._targetCanvas.height = Math.round(this._targetSize.h * dpr);
      }
    }

    this._optionSizes = this._optionCanvases.map((canvas, idx) => {
      const wrap = this._optionCards[idx]?.canvasWrap;
      if (!canvas || !wrap) return { w: 0, h: 88 };
      const r = wrap.getBoundingClientRect();
      if (r.width < 20 || r.height < 20) return { w: 0, h: 88 };
      const size = { w: Math.floor(r.width), h: Math.floor(r.height) };
      canvas.width = Math.round(size.w * dpr);
      canvas.height = Math.round(size.h * dpr);
      return size;
    });
  }

  _startAnimationLoop() {
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    const tick = (ts) => {
      if (this._disposed) return;
      if (this._lastFrameTs === 0) this._lastFrameTs = ts;
      const dt = Math.min(0.05, (ts - this._lastFrameTs) / 1000);
      this._lastFrameTs = ts;
      this._pulsePhase = (this._pulsePhase + dt * 2.8) % TWO_PI;

      if (this._targetSize && this._targetSize.w >= 20) {
        this._drawCanvases();
      }
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  _drawCanvases() {
    const ch = this._getCurrentChallenge();
    const solved = this._isCurrentSolved();
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 3);
    const pulse = 0.5 + 0.5 * Math.sin(this._pulsePhase);

    // --- Target Canvas ---
    if (this._targetCtx && this._targetSize && this._targetSize.w >= 20) {
      const { w, h } = this._targetSize;
      const ctx = this._targetCtx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this._drawTargetCanvas(ctx, w, h, ch, pulse);
    }

    // --- 3-Column Candidate Canvases ---
    const optionSizes = this._optionSizes || [];
    ch.options.forEach((opt, idx) => {
      const ctx = this._optionCtxs[idx];
      const size = optionSizes[idx];
      if (!ctx || !size || size.w < 20) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const isSolvedCorrect = solved && opt.isCorrect;
      if (ch.optionKind === 'step') {
        this._drawOptionStepCanvas(ctx, size.w, size.h, opt, isSolvedCorrect, pulse);
      } else if (ch.optionKind === 'splane-trajectory') {
        this._drawOptionTrajectoryCanvas(ctx, size.w, size.h, opt, isSolvedCorrect, pulse);
      } else {
        this._drawOptionSPlaneCanvas(ctx, size.w, size.h, opt, isSolvedCorrect, pulse);
      }
    });
  }

  _drawTargetCanvas(ctx, w, h, ch, pulse) {
    const compact = w < 430;

    if (ch.targetKind === 'step' && ch.targetStep) {
      const cfg = ch.targetStep;
      const [tMin, tMax] = cfg.tDomain;
      const [yMin, yMax] = cfg.yBounds;
      const pad = compact ? { left: 32, right: 10, top: 12, bottom: 18 } : QUIZ_TARGET_PAD;
      const map = createPlotMapper(w, h, pad, tMin, tMax, yMin, yMax);

      drawEngineeringGrid(ctx, w, h, map, tMin, tMax, yMin, yMax, {
        showXLabels: true,
        showYLabels: true,
        xUnit: 's',
        compact,
      });

      // Setpoint r=1 dashed line
      const pyOne = Math.round(map.yToPx(1.0)) + 0.5;
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.48)';
      ctx.lineWidth = 1.1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(map.plotLeft, pyOne);
      ctx.lineTo(map.plotRight, pyOne);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Faint ghost underdamped & overdamped references for contrast
      if (cfg.ghostUnder) {
        drawGlowingCurve(ctx, map, cfg.ghostUnder, tMin, tMax, 'rgba(34, 211, 238, 0.25)', null, 1.2, 160, [3, 3]);
      }
      if (cfg.ghostOver) {
        drawGlowingCurve(ctx, map, cfg.ghostOver, tMin, tMax, 'rgba(167, 139, 250, 0.28)', null, 1.2, 160, [3, 3]);
      }

      // Main glowing critical target step curve
      drawGlowingCurve(ctx, map, cfg.fn, tMin, tMax, COLORS.emerald, COLORS.emeraldGlow, 2.5, 220);

      if (cfg.callout) {
        drawFloatingPill(ctx, map, map.xToPx(tMax * 0.42), map.yToPx(1.0), cfg.callout, COLORS.emerald, true, compact);
      }
      return;
    }

    if (ch.targetKind === 'splane' && ch.targetSPlane) {
      const cfg = ch.targetSPlane;
      const pad = compact ? { left: 34, right: 12, top: 12, bottom: 18 } : QUIZ_TARGET_PAD;
      const map = createPlotMapper(
        w,
        h,
        pad,
        cfg.sBounds.sigmaMin,
        cfg.sBounds.sigmaMax,
        cfg.sBounds.omegaMin,
        cfg.sBounds.omegaMax
      );

      drawSPlaneBackdrop(ctx, w, h, map, cfg.sBounds, {
        compact,
        highlightWn: cfg.highlightWn || null,
        highlightZetaRay: cfg.highlightZetaRay || null,
        showRegionLabels: true,
      });

      const mSize = compact ? 5.8 : 7.0;
      for (const p of cfg.poles || []) {
        drawPoleMarker(ctx, map, p.sigma, p.omega, {
          pulse,
          color: p.color || COLORS.cyan,
          glow: p.glow || COLORS.cyanGlow,
          size: mSize,
          isDouble: Boolean(p.isDouble),
        });
      }

      if (cfg.callout) {
        const anchorX = cfg.poles && cfg.poles.length > 0 ? map.xToPx(cfg.poles[0].sigma) : map.plotLeft + map.plotW * 0.3;
        const anchorY = cfg.poles && cfg.poles.length > 0 ? map.yToPx(cfg.poles[0].omega) : map.plotTop + 26;
        drawFloatingPill(ctx, map, anchorX, anchorY, cfg.callout, COLORS.cyan, true, compact);
      }
      return;
    }

    if (ch.targetKind === 'rlc-schematic') {
      this._drawRlcSchematicCanvas(ctx, w, h, ch.targetRlc, pulse, compact);
      return;
    }

    if (ch.targetKind === 'feedback-loop') {
      this._drawFeedbackLoopCanvas(ctx, w, h, ch.targetFeedback, pulse, compact);
    }
  }

  _drawRlcSchematicCanvas(ctx, w, h, cfg, pulse, compact) {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, w * 0.55);
    grad.addColorStop(0, 'rgba(34, 211, 238, 0.08)');
    grad.addColorStop(1, 'rgba(11, 13, 18, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const padX = compact ? 22 : 44;
    const topY = h * 0.34;
    const botY = h * 0.78;
    const leftX = padX + 26;
    const rightX = w - padX - 24;
    const span = rightX - leftX;

    const rStart = leftX + span * 0.12;
    const rEnd = leftX + span * 0.34;
    const lStart = leftX + span * 0.44;
    const lEnd = leftX + span * 0.70;
    const cX = rightX;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Wires
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.72)';
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    // Bottom return wire
    ctx.moveTo(leftX, botY);
    ctx.lineTo(cX, botY);
    // Left source wire
    ctx.moveTo(leftX, botY);
    ctx.lineTo(leftX, topY);
    ctx.lineTo(rStart, topY);
    // Between R and L
    ctx.moveTo(rEnd, topY);
    ctx.lineTo(lStart, topY);
    // From L to C top
    ctx.moveTo(lEnd, topY);
    ctx.lineTo(cX, topY);
    ctx.lineTo(cX, (topY + botY) / 2 - 5);
    // C bottom wire
    ctx.moveTo(cX, (topY + botY) / 2 + 5);
    ctx.lineTo(cX, botY);
    ctx.stroke();

    // Voltage source circle on left
    const srcY = (topY + botY) / 2;
    ctx.fillStyle = '#0F131C';
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.arc(leftX, srcY, compact ? 11 : 13, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.cyan;
    ctx.font = `700 ${compact ? 9 : 10}px ${FONT_MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('vᵢₙ', leftX, srcY + 0.5);

    // Resistor R zigzag (Amber — very small!)
    ctx.strokeStyle = COLORS.amberLight;
    ctx.shadowColor = COLORS.amberGlow;
    ctx.shadowBlur = 7;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(rStart, topY);
    const zigN = 5;
    const zigW = (rEnd - rStart) / zigN;
    for (let i = 0; i < zigN; i++) {
      const mx = rStart + (i + 0.5) * zigW;
      const my = topY + (i % 2 === 0 ? -6 : 6);
      ctx.lineTo(mx, my);
    }
    ctx.lineTo(rEnd, topY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inductor L coils (Cyan)
    ctx.strokeStyle = COLORS.cyan;
    ctx.shadowColor = COLORS.cyanGlow;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.1;
    const loops = 4;
    const loopR = (lEnd - lStart) / (loops * 2);
    ctx.beginPath();
    for (let i = 0; i < loops; i++) {
      const cxLoop = lStart + (2 * i + 1) * loopR;
      ctx.arc(cxLoop, topY, loopR, Math.PI, 0, false);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Capacitor C plates (Emerald — glowing output v_C)
    const capMid = (topY + botY) / 2;
    ctx.strokeStyle = COLORS.emerald;
    ctx.shadowColor = COLORS.emeraldGlow;
    ctx.shadowBlur = 8 + pulse * 4;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cX - 11, capMid - 5);
    ctx.lineTo(cX + 11, capMid - 5);
    ctx.moveTo(cX - 11, capMid + 5);
    ctx.lineTo(cX + 11, capMid + 5);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Component labels
    ctx.font = `700 ${compact ? 9 : 10.5}px ${FONT_MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = COLORS.amberLight;
    ctx.fillText('R (tiny) ↔ c', (rStart + rEnd) / 2, topY - 9);
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText('L ↔ m', (lStart + lEnd) / 2, topY - 10);
    ctx.fillStyle = COLORS.emerald;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('C ↔ 1/k', cX - 16, capMid);

    // Output v_C(t) label
    ctx.textAlign = 'left';
    ctx.fillStyle = '#A7F3D0';
    ctx.font = `700 ${compact ? 9 : 10}px ${FONT_MONO}`;
    ctx.fillText('v_C', cX + 14, capMid);

    // Bottom analogy pill
    const pillTxt = cfg?.subtitle || 'R ≪ 2√(L/C) ⇒ ζ ≈ 0.12';
    ctx.font = `600 ${compact ? 9 : 10}px ${FONT_MONO}`;
    const pw = ctx.measureText(pillTxt).width + 16;
    const px = (w - pw) / 2;
    const py = h - 22;
    drawRoundedRect(ctx, px, py, pw, 17, 5);
    ctx.fillStyle = 'rgba(15, 19, 28, 0.92)';
    ctx.fill();
    ctx.strokeStyle = `rgba(34, 211, 238, ${(0.45 + 0.3 * pulse).toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#E0F2FE';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pillTxt, w / 2, py + 9);
    ctx.restore();
  }

  _drawFeedbackLoopCanvas(ctx, w, h, cfg, pulse, compact) {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    const midY = h * 0.42;
    const fbY = h * 0.78;
    const leftX = compact ? 18 : 34;
    const sumX = compact ? 52 : 78;
    const kpX = compact ? w * 0.30 : w * 0.31;
    const kpW = compact ? 42 : 56;
    const plantX = compact ? w * 0.54 : w * 0.54;
    const plantW = compact ? 96 : 138;
    const outX = Math.min(w - (compact ? 18 : 32), plantX + plantW + (compact ? 26 : 44));
    const tapX = plantX + plantW + (compact ? 12 : 20);
    const boxH = compact ? 28 : 34;

    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.75)';
    ctx.lineWidth = 1.6;

    // Input r -> Summer
    ctx.beginPath();
    ctx.moveTo(leftX, midY);
    ctx.lineTo(sumX - 11, midY);
    ctx.stroke();
    drawArrowHead(ctx, leftX, midY, sumX - 10, midY, COLORS.cyan, 5.5);

    // Summer -> Kp
    ctx.beginPath();
    ctx.moveTo(sumX + 10, midY);
    ctx.lineTo(kpX - 2, midY);
    ctx.stroke();
    drawArrowHead(ctx, sumX + 10, midY, kpX - 1, midY, COLORS.cyan, 5.5);

    // Kp -> Plant
    ctx.beginPath();
    ctx.moveTo(kpX + kpW, midY);
    ctx.lineTo(plantX - 2, midY);
    ctx.stroke();
    drawArrowHead(ctx, kpX + kpW, midY, plantX - 1, midY, COLORS.cyan, 5.5);

    // Plant -> Output x
    ctx.beginPath();
    ctx.moveTo(plantX + plantW, midY);
    ctx.lineTo(outX, midY);
    ctx.stroke();
    drawArrowHead(ctx, plantX + plantW, midY, outX, midY, COLORS.emerald, 5.5);

    // Negative feedback loop
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.75)';
    ctx.beginPath();
    ctx.moveTo(tapX, midY);
    ctx.lineTo(tapX, fbY);
    ctx.lineTo(sumX, fbY);
    ctx.lineTo(sumX, midY + 11);
    ctx.stroke();
    drawArrowHead(ctx, sumX, fbY, sumX, midY + 10, COLORS.violet, 5.5);

    // Summing junction
    ctx.fillStyle = '#0F131C';
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(sumX, midY, 10, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F8FAFC';
    ctx.font = `700 10px ${FONT_MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Σ', sumX, midY + 0.5);

    ctx.fillStyle = COLORS.violet;
    ctx.font = `700 10px ${FONT_MONO}`;
    ctx.fillText('−', sumX - 12, midY + 13);

    // Kp Gain Block (glowing Amber/Cyan)
    drawRoundedRect(ctx, kpX, midY - boxH / 2, kpW, boxH, 7);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
    ctx.fill();
    ctx.strokeStyle = `rgba(252, 211, 77, ${(0.65 + 0.3 * pulse).toFixed(2)})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = COLORS.amberLight;
    ctx.font = `700 ${compact ? 10.5 : 12}px ${FONT_MONO}`;
    ctx.fillText('Kₚ ↑', kpX + kpW / 2, midY + 0.5);

    // Plant Block 1 / (ms² + cs + k)
    drawRoundedRect(ctx, plantX, midY - boxH / 2, plantW, boxH, 7);
    ctx.fillStyle = 'rgba(34, 211, 238, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#E0F2FE';
    ctx.font = `600 ${compact ? 8.5 : 10}px ${FONT_MONO}`;
    ctx.fillText('1/(ms²+cs+k)', plantX + plantW / 2, midY + 0.5);

    // Signal labels
    ctx.fillStyle = COLORS.cyan;
    ctx.font = `700 ${compact ? 9.5 : 10.5}px ${FONT_MONO}`;
    ctx.fillText('r', leftX + 4, midY - 10);
    ctx.fillStyle = COLORS.emerald;
    ctx.fillText('x', outX - 6, midY - 10);

    // Bottom closed-loop insight pill
    const sigmaVal = cfg?.sigma ?? -1.2;
    const pillTxt = `σ = -c/(2m) = ${fmtPlain(sigmaVal, 1)} (fixed) • k_eff = k + Kₚ ↑`;
    ctx.font = `600 ${compact ? 8.5 : 10}px ${FONT_MONO}`;
    const pw = Math.min(w - 16, ctx.measureText(pillTxt).width + 14);
    const px = (w - pw) / 2;
    const py = h - 20;
    drawRoundedRect(ctx, px, py, pw, 16, 4.5);
    ctx.fillStyle = 'rgba(15, 19, 28, 0.94)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#A7F3D0';
    ctx.fillText(pillTxt, w / 2, py + 8.5);

    ctx.restore();
  }

  _drawOptionSPlaneCanvas(ctx, w, h, opt, isSolvedCorrect, pulse) {
    const isNarrow = w < 175;
    const pad = isNarrow ? { left: 6, right: 6, top: 6, bottom: 8 } : QUIZ_OPTION_PAD;
    const map = createPlotMapper(
      w,
      h,
      pad,
      opt.sBounds.sigmaMin,
      opt.sBounds.sigmaMax,
      opt.sBounds.omegaMin,
      opt.sBounds.omegaMax
    );

    drawSPlaneBackdrop(ctx, w, h, map, opt.sBounds, {
      compact: true,
      minimal: isNarrow,
      highlightWn: opt.highlightWn || null,
      highlightZetaRay: opt.highlightZetaRay || null,
      showRegionLabels: !isNarrow,
    });

    // Geometric proof overlay when solved
    if (isSolvedCorrect && opt.proof) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
      ctx.clip();

      if (opt.proof.kind === 'critical-double') {
        const pxB = map.xToPx(-opt.proof.wn);
        const py0 = map.yToPx(0);
        ctx.strokeStyle = COLORS.amberLight;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([3, 2.5]);
        ctx.beginPath();
        ctx.moveTo(map.xToPx(0), py0);
        ctx.lineTo(pxB, py0);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (opt.proof.kind === 'sigma-bracket') {
        const px0 = map.xToPx(0);
        const pxS = map.xToPx(opt.proof.sigma);
        const pyW = map.yToPx(opt.proof.omega);
        ctx.strokeStyle = COLORS.amberLight;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([3, 2.5]);
        ctx.beginPath();
        ctx.moveTo(px0, pyW);
        ctx.lineTo(pxS, pyW);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    const mSize = isNarrow ? 4.6 : 6.0;
    for (const p of opt.poles || []) {
      drawPoleMarker(ctx, map, p.sigma, p.omega, {
        pulse,
        color: isSolvedCorrect ? COLORS.emerald : p.color || COLORS.cyan,
        glow: isSolvedCorrect ? COLORS.emeraldGlow : p.glow || COLORS.cyanGlow,
        size: mSize,
        isDouble: Boolean(p.isDouble),
      });
    }

    // Compact corner tag
    if (opt.tag) {
      ctx.save();
      ctx.font = `600 ${isNarrow ? 8 : 9}px ${FONT_MONO}`;
      const tw = ctx.measureText(opt.tag).width + 8;
      const lx = map.plotLeft + 4;
      const ly = map.plotBottom - (isNarrow ? 15 : 17);
      drawRoundedRect(ctx, lx, ly, tw, isNarrow ? 13 : 15, 3.5);
      ctx.fillStyle = 'rgba(11, 13, 18, 0.88)';
      ctx.fill();
      ctx.strokeStyle = isSolvedCorrect ? 'rgba(52, 211, 153, 0.65)' : 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.fillStyle = isSolvedCorrect ? '#A7F3D0' : '#E2E8F0';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(opt.tag, lx + 4, ly + (isNarrow ? 6.8 : 7.8));
      ctx.restore();
    }
  }

  _drawOptionTrajectoryCanvas(ctx, w, h, opt, isSolvedCorrect, pulse) {
    const isNarrow = w < 175;
    const pad = isNarrow ? { left: 6, right: 6, top: 6, bottom: 8 } : QUIZ_OPTION_PAD;
    const map = createPlotMapper(
      w,
      h,
      pad,
      opt.sBounds.sigmaMin,
      opt.sBounds.sigmaMax,
      opt.sBounds.omegaMin,
      opt.sBounds.omegaMax
    );

    drawSPlaneBackdrop(ctx, w, h, map, opt.sBounds, {
      compact: true,
      minimal: isNarrow,
      highlightWn: opt.highlightWn || null,
      showRegionLabels: !isNarrow,
    });

    const traj = opt.trajectory;
    const mainColor = isSolvedCorrect ? COLORS.emerald : COLORS.violet;
    const mainGlow = isSolvedCorrect ? COLORS.emeraldGlow : COLORS.violetGlow;
    const mSize = isNarrow ? 4.2 : 5.4;

    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    if (traj.kind === 'arc-const-wn') {
      const wn = traj.wn;
      const x0 = map.xToPx(0);
      const y0 = map.yToPx(0);
      const rx = wn * map.scaleX;
      const ry = wn * map.scaleY;

      // Draw upper and lower circular arcs along constant ω_n
      for (const sign of [1, -1]) {
        const sStart = -wn * traj.zStart;
        const wStart = sign * wn * Math.sqrt(1 - traj.zStart * traj.zStart);
        const sEnd = -wn * traj.zEnd;
        const wEnd = sign * wn * Math.sqrt(1 - traj.zEnd * traj.zEnd);

        ctx.strokeStyle = mainColor;
        ctx.shadowColor = mainGlow;
        ctx.shadowBlur = 8;
        ctx.lineWidth = isNarrow ? 2.0 : 2.5;
        ctx.beginPath();
        const steps = 28;
        for (let i = 0; i <= steps; i++) {
          const z = traj.zStart + ((traj.zEnd - traj.zStart) * i) / steps;
          const px = map.xToPx(-wn * z);
          const py = map.yToPx(sign * wn * Math.sqrt(Math.max(0, 1 - z * z)));
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        const prevZ = traj.zEnd - 0.06;
        const prevPx = map.xToPx(-wn * prevZ);
        const prevPy = map.yToPx(sign * wn * Math.sqrt(Math.max(0, 1 - prevZ * prevZ)));
        const endPx = map.xToPx(sEnd);
        const endPy = map.yToPx(wEnd);
        drawArrowHead(ctx, prevPx, prevPy, endPx, endPy, mainColor, isNarrow ? 5.5 : 6.8);

        drawPoleMarker(ctx, map, sStart, wStart, { pulse: 0.2, color: COLORS.cyan, glow: COLORS.cyanGlow, size: mSize * 0.85, faded: true });
        drawPoleMarker(ctx, map, sEnd, wEnd, { pulse, color: mainColor, glow: mainGlow, size: mSize });
      }

      // Geometric Proof Overlay: glowing radius vector r = ω_n
      if (isSolvedCorrect && opt.proof?.kind === 'const-wn-radius') {
        const sEnd = -wn * opt.proof.zEnd;
        const wEnd = wn * Math.sqrt(1 - opt.proof.zEnd * opt.proof.zEnd);
        ctx.strokeStyle = COLORS.amberLight;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([3, 2.5]);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(map.xToPx(sEnd), map.yToPx(wEnd));
        ctx.stroke();
        ctx.setLineDash([]);
        // Ensure rx/ry reference keeps arc crisp
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.32)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(x0, y0, rx, ry, 0, Math.PI / 2, (3 * Math.PI) / 2);
        ctx.stroke();
      }
    } else {
      // Straight trajectory (horizontal-left or vertical-out) for upper & lower conjugates
      for (const sign of [1, -1]) {
        const sx = map.xToPx(traj.start.sigma);
        const sy = map.yToPx(sign * traj.start.omega);
        const ex = map.xToPx(traj.end.sigma);
        const ey = map.yToPx(sign * traj.end.omega);

        ctx.strokeStyle = mainColor;
        ctx.shadowColor = mainGlow;
        ctx.shadowBlur = 8;
        ctx.lineWidth = isNarrow ? 2.0 : 2.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.shadowBlur = 0;

        drawArrowHead(ctx, sx, sy, ex, ey, mainColor, isNarrow ? 5.5 : 6.8);
        drawPoleMarker(ctx, map, traj.start.sigma, sign * traj.start.omega, {
          pulse: 0.2,
          color: COLORS.cyan,
          glow: COLORS.cyanGlow,
          size: mSize * 0.85,
          faded: true,
        });
        drawPoleMarker(ctx, map, traj.end.sigma, sign * traj.end.omega, {
          pulse,
          color: mainColor,
          glow: mainGlow,
          size: mSize,
        });
      }

      // Geometric Proof Overlay: vertical dashed σ = const line
      if (isSolvedCorrect && opt.proof?.kind === 'const-sigma-line') {
        const pxSig = Math.round(map.xToPx(opt.proof.sigma)) + 0.5;
        ctx.strokeStyle = COLORS.amberLight;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3.5, 3]);
        ctx.beginPath();
        ctx.moveTo(pxSig, map.plotTop);
        ctx.lineTo(pxSig, map.plotBottom);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.restore();
  }

  _drawOptionStepCanvas(ctx, w, h, opt, isSolvedCorrect, pulse) {
    const [tMin, tMax] = opt.tDomain;
    const [yMin, yMax] = opt.yBounds;
    const isNarrow = w < 175;
    const pad = isNarrow ? { left: 8, right: 8, top: 8, bottom: 10 } : QUIZ_OPTION_PAD;
    const map = createPlotMapper(w, h, pad, tMin, tMax, yMin, yMax);

    drawEngineeringGrid(ctx, w, h, map, tMin, tMax, yMin, yMax, {
      showXLabels: !isNarrow,
      showYLabels: !isNarrow,
      xUnit: !isNarrow ? 's' : '',
      compact: true,
    });

    // Reference setpoint y = 1 line
    const pyOne = Math.round(map.yToPx(1.0)) + 0.5;
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.36)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(map.plotLeft, pyOne);
    ctx.lineTo(map.plotRight, pyOne);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Proof overlay on correct option once solved
    if (isSolvedCorrect && opt.proof) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
      ctx.clip();

      if (opt.proof.kind === 'dominant-step') {
        const domEnv = (t) => 1 - Math.exp(opt.proof.sDom * t);
        drawGlowingCurve(ctx, map, domEnv, tMin, tMax, COLORS.amberLight, COLORS.amberGlow, 1.4, 140, [4, 3]);

        const pxTau = Math.round(map.xToPx(opt.proof.tau)) + 0.5;
        ctx.strokeStyle = `rgba(252, 211, 77, ${(0.45 + 0.35 * pulse).toFixed(2)})`;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(pxTau, map.plotTop);
        ctx.lineTo(pxTau, map.plotBottom);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (opt.proof.kind === 'ringing-envelope') {
        const sig = opt.proof.zeta * opt.proof.wn;
        const envTop = (t) => 1 + Math.exp(-sig * t);
        const envBot = (t) => 1 - Math.exp(-sig * t);
        drawGlowingCurve(ctx, map, envTop, tMin, tMax, COLORS.amberLight, COLORS.amberGlow, 1.35, 140, [4, 3]);
        drawGlowingCurve(ctx, map, envBot, tMin, tMax, COLORS.amberLight, COLORS.amberGlow, 1.35, 140, [4, 3]);
      }

      ctx.restore();
    }

    const strokeColor = isSolvedCorrect ? COLORS.emerald : COLORS.violet;
    const glowColor = isSolvedCorrect ? COLORS.emeraldGlow : COLORS.violetGlow;
    drawGlowingCurve(ctx, map, opt.fn, tMin, tMax, strokeColor, glowColor, isNarrow ? 2.0 : 2.3, 200);
  }

  dispose() {
    this._disposed = true;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    this._targetCanvas = null;
    this._targetCtx = null;
    this._targetWrap = null;
    this._optionCanvases = [];
    this._optionCtxs = [];
    this._optionCards = [];
    this._feedbackSlot = null;
    this._root = null;
  }
}
