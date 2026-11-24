/**
 * EIGENLAB — Stacked Synchronized Derivative Graphs & Visual Intuition Quiz Engine
 *
 * Exports:
 *   - StackedDerivativeLab : Three synchronized high-DPI HTML5 canvases (f, f', f'')
 *                            with unified pointer/touch cursor scrubbing, tangent line,
 *                            sign/concavity shading, pulsing root alignment guides,
 *                            and Mechatronics Lens relabeling.
 *   - VisualQuizEngine     : Brilliant.org-style 8-challenge "Match the Derivative"
 *                            visual intuition engine with animated geometric proof
 *                            overlays, conceptual hints, and store/sound integration.
 */

import { store, sound, renderKatex, renderInlineMathText } from '../store.js';
import { FUNCTION_PRESETS } from './derivative-3d.js';

// ---------------------------------------------------------------------------
// Palette & Visual Constants (EIGENLAB Dark Engineering Studio)
// ---------------------------------------------------------------------------
const COLORS = {
  bg: '#0B0D12',
  bgPanel: '#0F131C',
  gridMinor: 'rgba(148, 163, 184, 0.065)',
  gridMajor: 'rgba(148, 163, 184, 0.11)',
  axis: 'rgba(148, 163, 184, 0.30)',
  axisLabel: 'rgba(148, 163, 184, 0.62)',
  cyan: '#22D3EE',
  cyanGlow: 'rgba(34, 211, 238, 0.38)',
  violet: '#A78BFA',
  violetGlow: 'rgba(167, 139, 250, 0.38)',
  amber: '#F59E0B',
  amberGlow: 'rgba(245, 158, 11, 0.38)',
  emerald: '#34D399',
  emeraldFill: 'rgba(52, 211, 153, 0.18)',
  emeraldSoft: 'rgba(52, 211, 153, 0.12)',
  coral: '#FB7185',
  coralFill: 'rgba(251, 113, 133, 0.18)',
  amberFill: 'rgba(245, 158, 11, 0.16)',
  concaveDownFill: 'rgba(167, 139, 250, 0.15)',
  cursorLine: 'rgba(226, 232, 240, 0.78)',
  pillBg: 'rgba(11, 13, 18, 0.90)',
  pillBorder: 'rgba(148, 163, 184, 0.28)',
};

const STACKED_PLOT_PAD = { left: 48, right: 20, top: 22, bottom: 24 };
const QUIZ_TARGET_PAD = { left: 44, right: 18, top: 20, bottom: 24 };
const QUIZ_OPTION_PAD = { left: 32, right: 12, top: 14, bottom: 18 };

const FONT_MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const FONT_SANS = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';

// ---------------------------------------------------------------------------
// Scoped Component Styles (injected once into <head>)
// ---------------------------------------------------------------------------
function injectStylesOnce() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('eigenlab-stacked-graphs-styles')) return;

  const style = document.createElement('style');
  style.id = 'eigenlab-stacked-graphs-styles';
  style.textContent = `
    @keyframes eigenlabShakeGentle {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(5px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(3px); }
    }
    .shake-gentle {
      animation: eigenlabShakeGentle 0.42s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
    .el-sg-canvas {
      display: block;
      width: 100%;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }
    .el-sg-pill {
      transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease, transform 120ms ease;
    }
    .el-sg-pill:active {
      transform: scale(0.97);
    }
    .el-vq-card {
      transition: border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease, transform 160ms ease;
      cursor: pointer;
    }
    .el-vq-card:hover:not([data-locked="true"]) {
      transform: translateY(-2px);
      border-color: rgba(34, 211, 238, 0.55);
      box-shadow: 0 10px 30px -12px rgba(34, 211, 238, 0.25);
    }
    .el-vq-card[data-state="correct"] {
      border-color: rgba(52, 211, 153, 0.85) !important;
      background: linear-gradient(180deg, rgba(52, 211, 153, 0.11), rgba(15, 19, 28, 0.92)) !important;
      box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.35), 0 12px 32px -12px rgba(52, 211, 153, 0.35) !important;
    }
    .el-vq-card[data-state="wrong"] {
      border-color: rgba(251, 113, 133, 0.72) !important;
      background: linear-gradient(180deg, rgba(251, 113, 133, 0.09), rgba(15, 19, 28, 0.92)) !important;
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Safe Store, Sound, and Math Rendering Helpers
// ---------------------------------------------------------------------------
function safeSound(method, ...args) {
  try {
    if (sound && typeof sound[method] === 'function') {
      sound[method](...args);
    }
  } catch (_) {
    // Audio playback is optional; never block interaction
  }
}

function safeStore(method, ...args) {
  try {
    if (store && typeof store[method] === 'function') {
      return store[method](...args);
    }
  } catch (_) {
    // Graceful fallback if store method differs
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
    // Fall back to clean monospace
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

// ---------------------------------------------------------------------------
// Numerical & Analytic Math Helpers
// ---------------------------------------------------------------------------
function numericDeriv1(fn) {
  const h = 1e-3;
  return (x) => (-fn(x + 2 * h) + 8 * fn(x + h) - 8 * fn(x - h) + fn(x - 2 * h)) / (12 * h);
}

function numericDeriv2(fn) {
  const h = 1e-3;
  return (x) =>
    (-fn(x + 2 * h) + 16 * fn(x + h) - 30 * fn(x) + 16 * fn(x - h) - fn(x - 2 * h)) / (12 * h * h);
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function fmtSigned(val, decimals = 2) {
  if (!Number.isFinite(val)) return '0.00';
  const cleaned = Math.abs(val) < 0.004 ? 0 : val;
  const sign = cleaned > 0 ? '+' : '';
  return `${sign}${cleaned.toFixed(decimals)}`;
}

function fmtPlain(val, decimals = 2) {
  if (!Number.isFinite(val)) return '0.00';
  const cleaned = Math.abs(val) < 0.004 ? 0 : val;
  return cleaned.toFixed(decimals);
}

function findRoots(fn, xMin, xMax, samples = 420) {
  const roots = [];
  const dx = (xMax - xMin) / samples;
  const edgeMargin = (xMax - xMin) * 0.012;

  let prevX = xMin;
  let prevY = fn(prevX);

  for (let i = 1; i <= samples; i++) {
    const curX = xMin + i * dx;
    const curY = fn(curX);
    if (!Number.isFinite(prevY) || !Number.isFinite(curY)) {
      prevX = curX;
      prevY = curY;
      continue;
    }

    if (Math.abs(curY) < 1e-7) {
      if (curX > xMin + edgeMargin && curX < xMax - edgeMargin) {
        roots.push(curX);
      }
    } else if (prevY * curY < 0) {
      // Bisection refinement
      let a = prevX;
      let b = curX;
      let fa = prevY;
      for (let iter = 0; iter < 24; iter++) {
        const mid = 0.5 * (a + b);
        const fm = fn(mid);
        if (!Number.isFinite(fm)) break;
        if (Math.abs(fm) < 1e-9) {
          a = mid;
          b = mid;
          break;
        }
        if (fa * fm <= 0) {
          b = mid;
        } else {
          a = mid;
          fa = fm;
        }
      }
      const r = 0.5 * (a + b);
      if (r > xMin + edgeMargin && r < xMax - edgeMargin) {
        roots.push(r);
      }
    }

    prevX = curX;
    prevY = curY;
  }

  // Deduplicate roots within 1e-2
  roots.sort((a, b) => a - b);
  const unique = [];
  for (const r of roots) {
    if (unique.length === 0 || Math.abs(r - unique[unique.length - 1]) > 0.015) {
      unique.push(r);
    }
  }
  return unique;
}

function computeYBounds(fn, xMin, xMax, includeZero = true, samples = 240) {
  let yMin = Infinity;
  let yMax = -Infinity;
  const dx = (xMax - xMin) / samples;
  for (let i = 0; i <= samples; i++) {
    const y = fn(xMin + i * dx);
    if (Number.isFinite(y)) {
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
  }
  if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) {
    return [-2, 2];
  }
  if (includeZero) {
    yMin = Math.min(yMin, 0);
    yMax = Math.max(yMax, 0);
  }
  let span = yMax - yMin;
  if (span < 0.8) {
    const mid = 0.5 * (yMin + yMax);
    yMin = mid - 1.0;
    yMax = mid + 1.0;
    span = 2.0;
  }
  const pad = span * 0.2;
  return [yMin - pad, yMax + pad];
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
// Function Presets (Syncs cleanly with FUNCTION_PRESETS from derivative-3d.js)
// ---------------------------------------------------------------------------
const DEFAULT_PRESETS = [
  {
    key: 'cubic',
    aliases: ['cubic', 'cubicWave', 'cubic_wave'],
    label: 'Cubic Wave',
    latex: 'f(x) = 0.25x^3 - 1.5x',
    mechatronicsLatex: 'x(t) = 0.25t^3 - 1.5t',
    domain: [-3.2, 3.2],
    defaultX: 0.75,
    f: (x) => 0.25 * x * x * x - 1.5 * x,
    df: (x) => 0.75 * x * x - 1.5,
    d2f: (x) => 1.5 * x,
  },
  {
    key: 'sine',
    aliases: ['sine', 'sin', 'sineOscillator', 'oscillator', 'harmonic'],
    label: 'Sine Oscillator',
    latex: 'f(x) = 2\\sin(x)',
    mechatronicsLatex: 'x(t) = 2\\sin(t)',
    domain: [-3.5, 3.5],
    defaultX: 0.65,
    f: (x) => 2 * Math.sin(x),
    df: (x) => 2 * Math.cos(x),
    d2f: (x) => -2 * Math.sin(x),
  },
  {
    key: 'damped',
    aliases: ['damped', 'dampedServo', 'damped_servo', 'servo'],
    label: 'Damped Servo',
    latex: 'f(x) = 2.5e^{-0.25x}\\sin(2x)',
    mechatronicsLatex: 'x(t) = 2.5e^{-0.25t}\\sin(2t)',
    domain: [0, 6.0],
    defaultX: 1.15,
    f: (x) => 2.5 * Math.exp(-0.25 * x) * Math.sin(2 * x),
    df: (x) => 2.5 * Math.exp(-0.25 * x) * (-0.25 * Math.sin(2 * x) + 2 * Math.cos(2 * x)),
    d2f: (x) => 2.5 * Math.exp(-0.25 * x) * (-3.9375 * Math.sin(2 * x) - Math.cos(2 * x)),
  },
  {
    key: 'gaussian',
    aliases: ['gaussian', 'gauss', 'gaussianBell', 'bell'],
    label: 'Gaussian Bell',
    latex: 'f(x) = 3e^{-0.4x^2}',
    mechatronicsLatex: 'x(t) = 3e^{-0.4t^2}',
    domain: [-3.8, 3.8],
    defaultX: -0.95,
    f: (x) => 3 * Math.exp(-0.4 * x * x),
    df: (x) => -2.4 * x * Math.exp(-0.4 * x * x),
    d2f: (x) => (1.92 * x * x - 2.4) * Math.exp(-0.4 * x * x),
  },
  {
    key: 'polytrig',
    aliases: ['polytrig', 'polyTrig', 'poly_trig', 'poly-trig', 'hybrid'],
    label: 'Poly + Trig',
    latex: 'f(x) = 0.15x^3 - 0.8x + 1.1\\sin(1.8x)',
    mechatronicsLatex: 'x(t) = 0.15t^3 - 0.8t + 1.1\\sin(1.8t)',
    domain: [-3.2, 3.2],
    defaultX: 0.55,
    f: (x) => 0.15 * x * x * x - 0.8 * x + 1.1 * Math.sin(1.8 * x),
    df: (x) => 0.45 * x * x - 0.8 + 1.98 * Math.cos(1.8 * x),
    d2f: (x) => 0.9 * x - 3.564 * Math.sin(1.8 * x),
  },
];

function extractDomain(raw, fallback) {
  if (!raw) return fallback;
  const candidate = raw.domain || raw.xRange || raw.range;
  if (Array.isArray(candidate) && candidate.length >= 2) {
    const a = Number(candidate[0]);
    const b = Number(candidate[1]);
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) return [a, b];
  }
  if (candidate && typeof candidate === 'object') {
    const a = Number(candidate.min ?? candidate.xMin);
    const b = Number(candidate.max ?? candidate.xMax);
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) return [a, b];
  }
  if (Number.isFinite(raw.xMin) && Number.isFinite(raw.xMax) && raw.xMax > raw.xMin) {
    return [raw.xMin, raw.xMax];
  }
  return fallback;
}

function buildPresetCatalog() {
  const externalMap = new Map();
  if (FUNCTION_PRESETS) {
    if (Array.isArray(FUNCTION_PRESETS)) {
      for (const item of FUNCTION_PRESETS) {
        if (item && (item.id || item.key)) {
          externalMap.set(String(item.id || item.key), item);
        }
      }
    } else if (typeof FUNCTION_PRESETS === 'object') {
      for (const [k, v] of Object.entries(FUNCTION_PRESETS)) {
        if (v && typeof v === 'object') {
          externalMap.set(k, v);
        }
      }
    }
  }

  const ordered = [];
  const lookup = new Map();

  for (const def of DEFAULT_PRESETS) {
    let matchedKey = null;
    let ext = null;
    for (const alias of def.aliases) {
      if (externalMap.has(alias)) {
        matchedKey = alias;
        ext = externalMap.get(alias);
        break;
      }
      // Case-insensitive match
      for (const [ek, ev] of externalMap.entries()) {
        if (ek.toLowerCase() === alias.toLowerCase()) {
          matchedKey = ek;
          ext = ev;
          break;
        }
      }
      if (ext) break;
    }

    const rawF = ext && (ext.f || ext.fn || ext.eval);
    const f = typeof rawF === 'function' ? rawF : def.f;
    const rawDf = ext && (ext.df || ext.fPrime || ext.fp || ext.d1 || ext.derivative);
    const df = typeof rawDf === 'function' ? rawDf : typeof rawF === 'function' ? numericDeriv1(f) : def.df;
    const rawD2f = ext && (ext.d2f || ext.ddf || ext.fDoublePrime || ext.fpp || ext.d2 || ext.secondDerivative);
    const d2f = typeof rawD2f === 'function' ? rawD2f : typeof rawF === 'function' ? numericDeriv2(f) : def.d2f;
    const domain = extractDomain(ext, def.domain);
    const label = def.label;
    const latex = (ext && (ext.latex || ext.formula)) || def.latex;
    const mechatronicsLatex =
      (ext && ext.mechatronicsLatex) ||
      (ext && (ext.latex || ext.formula)
        ? String(ext.latex || ext.formula)
            .replace(/f\s*\(\s*x\s*\)/g, 'x(t)')
            .replace(/(?<![a-zA-Z\\])x(?![a-zA-Z(])/g, 't')
        : def.mechatronicsLatex);
    const defaultX = clamp(
      Number.isFinite(ext?.defaultX) ? ext.defaultX : def.defaultX,
      domain[0] + 0.1 * (domain[1] - domain[0]),
      domain[1] - 0.1 * (domain[1] - domain[0])
    );

    const preset = {
      key: matchedKey || def.key,
      canonicalKey: def.key,
      label,
      latex,
      mechatronicsLatex,
      domain,
      defaultX,
      f,
      df,
      d2f,
    };

    ordered.push(preset);
    lookup.set(preset.key, preset);
    lookup.set(def.key, preset);
    for (const alias of def.aliases) {
      lookup.set(alias, preset);
      lookup.set(alias.toLowerCase(), preset);
    }
  }

  // Register any additional external keys so setFunction() never fails
  for (const [ek, ext] of externalMap.entries()) {
    if (!lookup.has(ek) && typeof (ext.f || ext.fn) === 'function') {
      const f = ext.f || ext.fn;
      const df = typeof (ext.df || ext.fPrime || ext.fp) === 'function' ? ext.df || ext.fPrime || ext.fp : numericDeriv1(f);
      const d2f =
        typeof (ext.d2f || ext.ddf || ext.fDoublePrime || ext.fpp) === 'function'
          ? ext.d2f || ext.ddf || ext.fDoublePrime || ext.fpp
          : numericDeriv2(f);
      const domain = extractDomain(ext, [-3.2, 3.2]);
      const preset = {
        key: ek,
        canonicalKey: ek,
        label: ext.label || ext.name || ek,
        latex: ext.latex || ext.formula || 'f(x)',
        mechatronicsLatex: ext.mechatronicsLatex || 'x(t)',
        domain,
        defaultX: 0.5 * (domain[0] + domain[1]),
        f,
        df,
        d2f,
      };
      lookup.set(ek, preset);
      lookup.set(ek.toLowerCase(), preset);
    }
  }

  return { ordered, lookup };
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
  };
}

function drawEngineeringGrid(ctx, width, height, map, xMin, xMax, yMin, yMax, opts = {}) {
  const { showXLabels = true, showYLabels = true, xUnit = '', compact = false } = opts;
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);

  // Subtle top-left studio ambient glow
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, 'rgba(30, 41, 59, 0.22)');
  bgGrad.addColorStop(1, 'rgba(11, 13, 18, 0.0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(map.plotLeft, map.plotTop, map.plotW, map.plotH);

  // Vertical grid lines
  const xStep = niceStep(xMax - xMin, compact ? 4 : 7);
  const firstX = Math.ceil(xMin / xStep) * xStep;
  ctx.lineWidth = 1;
  ctx.font = `500 ${compact ? 9.5 : 10.5}px ${FONT_MONO}`;

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
      ctx.fillText(txt, px, map.plotBottom + 5);
    }
  }

  // Horizontal grid lines
  const yStep = niceStep(yMax - yMin, compact ? 3 : 4);
  const firstY = Math.ceil(yMin / yStep) * yStep;
  for (let gy = firstY; gy <= yMax + 1e-6; gy += yStep) {
    const py = Math.round(map.yToPx(gy)) + 0.5;
    if (py < map.plotTop - 1 || py > map.plotBottom + 1) continue;
    const isZero = Math.abs(gy) < 1e-5;
    ctx.strokeStyle = isZero ? COLORS.axis : COLORS.gridMinor;
    ctx.lineWidth = isZero ? 1.25 : 1;
    ctx.beginPath();
    ctx.moveTo(map.plotLeft, py);
    ctx.lineTo(map.plotRight, py);
    ctx.stroke();

    if (showYLabels) {
      ctx.fillStyle = isZero ? 'rgba(203, 213, 225, 0.85)' : COLORS.axisLabel;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatTickValue(gy), map.plotLeft - 7, py);
    }
  }

  // Explicit zero axes if inside bounds (ensures exact crispness)
  if (yMin <= 0 && yMax >= 0) {
    const y0 = Math.round(map.yToPx(0)) + 0.5;
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.25;
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

  // Subtle plot frame border
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 1;
  ctx.strokeRect(map.plotLeft + 0.5, map.plotTop + 0.5, map.plotW - 1, map.plotH - 1);
}

function drawGlowingCurve(ctx, map, fn, xMin, xMax, color, glowColor, lineWidth = 2.4, samples = 260) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
  ctx.clip();

  const dx = (xMax - xMin) / samples;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i <= samples; i++) {
    const x = xMin + i * dx;
    const y = fn(x);
    if (!Number.isFinite(y)) {
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

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;
  ctx.stroke();

  // Crisp core pass without blur
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(1.4, lineWidth - 0.5);
  ctx.stroke();
  ctx.restore();
}

function drawSignedAreaShading(ctx, map, fn, xMin, xMax, posFill, negFill, samples = 240) {
  const yZero = clamp(map.yToPx(0), map.plotTop, map.plotBottom);
  const dx = (xMax - xMin) / samples;

  const traceClosedArea = () => {
    ctx.beginPath();
    ctx.moveTo(map.xToPx(xMin), yZero);
    for (let i = 0; i <= samples; i++) {
      const x = xMin + i * dx;
      const y = fn(x);
      const py = Number.isFinite(y) ? map.yToPx(y) : yZero;
      ctx.lineTo(map.xToPx(x), py);
    }
    ctx.lineTo(map.xToPx(xMax), yZero);
    ctx.closePath();
  };

  // Positive region (above yZero)
  if (yZero > map.plotTop) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, yZero - map.plotTop);
    ctx.clip();
    traceClosedArea();
    ctx.fillStyle = posFill;
    ctx.fill();
    ctx.restore();
  }

  // Negative region (below yZero)
  if (yZero < map.plotBottom) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, yZero, map.plotW, map.plotBottom - yZero);
    ctx.clip();
    traceClosedArea();
    ctx.fillStyle = negFill;
    ctx.fill();
    ctx.restore();
  }
}

function drawRegionLabels(ctx, map, fn, roots, xMin, xMax, posLabel, negLabel, posColor, negColor) {
  const edges = [xMin, ...roots.filter((r) => r > xMin && r < xMax), xMax];
  const intervals = [];

  for (let i = 0; i < edges.length - 1; i++) {
    const a = edges[i];
    const b = edges[i + 1];
    const pxWidth = map.xToPx(b) - map.xToPx(a);
    if (pxWidth < 54) continue;
    const mid = 0.5 * (a + b);
    // Find peak magnitude inside interval for optimal label placement
    let bestX = mid;
    let bestVal = fn(mid);
    for (let s = 1; s <= 7; s++) {
      const sx = a + ((b - a) * s) / 8;
      const sv = fn(sx);
      if (Math.abs(sv) > Math.abs(bestVal)) {
        bestVal = sv;
        bestX = sx;
      }
    }
    if (Math.abs(bestVal) < 0.08) continue;
    intervals.push({
      x: 0.45 * mid + 0.55 * bestX,
      val: bestVal,
      isPos: bestVal > 0,
      score: pxWidth * Math.abs(bestVal),
      pxWidth,
    });
  }

  // Pick up to 2 most prominent positive lobes and 2 most prominent negative lobes
  const posList = intervals.filter((iv) => iv.isPos).sort((a, b) => b.score - a.score).slice(0, 2);
  const negList = intervals.filter((iv) => !iv.isPos).sort((a, b) => b.score - a.score).slice(0, 2);
  const chosen = [...posList, ...negList];

  const yZero = clamp(map.yToPx(0), map.plotTop, map.plotBottom);
  ctx.save();
  ctx.font = `600 10px ${FONT_SANS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const iv of chosen) {
    const text = iv.isPos ? posLabel : negLabel;
    const px = map.xToPx(iv.x);
    const curvePy = clamp(map.yToPx(iv.val), map.plotTop + 10, map.plotBottom - 10);
    const midPy = 0.5 * (yZero + curvePy);
    const textW = ctx.measureText(text).width;
    const clampedPx = clamp(px, map.plotLeft + textW / 2 + 8, map.plotRight - textW / 2 - 8);
    const clampedPy = iv.isPos
      ? clamp(midPy, map.plotTop + 12, Math.max(map.plotTop + 12, yZero - 11))
      : clamp(midPy, Math.min(map.plotBottom - 12, yZero + 11), map.plotBottom - 12);

    // Subtle frosted backing for legibility
    drawRoundedRect(ctx, clampedPx - textW / 2 - 5, clampedPy - 8, textW + 10, 16, 4);
    ctx.fillStyle = 'rgba(11, 13, 18, 0.58)';
    ctx.fill();

    ctx.fillStyle = iv.isPos ? posColor : negColor;
    ctx.fillText(text, clampedPx, clampedPy + 0.5);
  }
  ctx.restore();
}

function drawFloatingPill(ctx, map, anchorX, anchorY, text, accentColor, preferAbove = true) {
  ctx.save();
  ctx.font = `600 11px ${FONT_MONO}`;
  const metrics = ctx.measureText(text);
  const padX = 8;
  const pillW = Math.ceil(metrics.width + padX * 2 + 6);
  const pillH = 22;

  let x = anchorX + 12;
  if (x + pillW > map.plotRight - 4) {
    x = anchorX - pillW - 12;
  }
  x = clamp(x, map.plotLeft + 4, map.plotRight - pillW - 4);

  let y = preferAbove ? anchorY - pillH - 10 : anchorY + 10;
  if (y < map.plotTop + 4) y = anchorY + 12;
  if (y + pillH > map.plotBottom - 4) y = map.plotBottom - pillH - 4;

  drawRoundedRect(ctx, x, y, pillW, pillH, 6);
  ctx.fillStyle = COLORS.pillBg;
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Small accent indicator bar
  ctx.fillStyle = accentColor;
  drawRoundedRect(ctx, x + 4, y + 5, 2.5, pillH - 10, 1.5);
  ctx.fill();

  ctx.fillStyle = '#F8FAFC';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 11, y + pillH / 2 + 0.5);
  ctx.restore();
}

function drawDiamond(ctx, cx, cy, radius) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(cx + radius, cy);
  ctx.lineTo(cx, cy + radius);
  ctx.lineTo(cx - radius, cy);
  ctx.closePath();
}

// ===========================================================================
// PART 1: StackedDerivativeLab
// ===========================================================================
export class StackedDerivativeLab {
  constructor(containerOrOptions = {}, maybeOptions = {}) {
    const isElement =
      containerOrOptions &&
      typeof containerOrOptions === 'object' &&
      containerOrOptions.nodeType === 1;
    const autoMountContainer = isElement ? containerOrOptions : null;
    const options = isElement ? maybeOptions || {} : containerOrOptions || {};

    const {
      initialFnKey = 'cubic',
      mechatronicsLens = options.lens === 'mechatronics',
      onCursorChange = null,
      onInteract = null,
      onComplete = null,
    } = options;

    const { ordered, lookup } = buildPresetCatalog();
    this._presets = ordered;
    this._presetLookup = lookup;

    const initPreset =
      lookup.get(initialFnKey) ||
      lookup.get(String(initialFnKey).toLowerCase()) ||
      ordered[0];

    this._preset = initPreset;
    this.fnKey = initPreset.key;
    this.mechatronicsLens = Boolean(mechatronicsLens);
    this.onCursorChange = typeof onCursorChange === 'function' ? onCursorChange : null;
    this.onInteract = typeof onInteract === 'function' ? onInteract : null;
    this.onComplete = typeof onComplete === 'function' ? onComplete : null;
    this._hasInteracted = false;

    this.x = initPreset.defaultX;
    this._isDragging = false;
    this._activePointerId = null;

    this._container = null;
    this._root = null;
    this._canvases = [];
    this._ctxs = [];
    this._sizes = [
      { w: 0, h: 172 },
      { w: 0, h: 156 },
      { w: 0, h: 146 },
    ];
    this._panelMetaEls = [];
    this._fnButtons = new Map();
    this._badgeEls = {};

    this._resizeObserver = null;
    this._abortController = null;
    this._rafId = null;
    this._pulsePhase = 0;
    this._lastFrameTs = 0;
    this._lastTickMs = 0;
    this._flashRoot = null;
    this._disposed = false;

    this._recomputeMathCache();

    if (autoMountContainer) {
      this.mount(autoMountContainer);
    }
  }

  _recomputeMathCache() {
    const [xMin, xMax] = this._preset.domain;
    this._criticalPoints = findRoots(this._preset.df, xMin, xMax);
    this._inflectionPoints = findRoots(this._preset.d2f, xMin, xMax);
    this._bounds = [
      computeYBounds(this._preset.f, xMin, xMax, true),
      computeYBounds(this._preset.df, xMin, xMax, true),
      computeYBounds(this._preset.d2f, xMin, xMax, true),
    ];
    this.x = clamp(this.x, xMin, xMax);
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

    // --- Top Control Strip ---
    const topBar = document.createElement('div');
    topBar.className =
      'px-2.5 py-2 sm:px-3.5 sm:py-3 border-b border-slate-800/80 bg-[#0F131C]/90 flex flex-col gap-1.5 sm:gap-2.5';

    // Row 1: Function selector pills + live badges
    const row1 = document.createElement('div');
    row1.className = 'flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-1.5 sm:gap-2.5';

    const pillGroup = document.createElement('div');
    pillGroup.className = 'flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:flex-wrap pb-0.5 sm:pb-0';
    this._fnButtons.clear();

    for (const preset of this._presets) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.fnKey = preset.key;
      btn.className =
        'el-sg-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer';
      btn.textContent = preset.label;
      btn.addEventListener(
        'click',
        () => {
          safeSound('playTick');
          this.setFunction(preset.key);
        },
        { signal }
      );
      pillGroup.appendChild(btn);
      this._fnButtons.set(preset.key, btn);
    }

    const badgesWrap = document.createElement('div');
    badgesWrap.className = 'flex flex-wrap items-center gap-1 sm:gap-1.5';

    const cursorBadge = document.createElement('span');
    cursorBadge.className =
      'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-slate-900/90 border border-slate-700/80 text-slate-200';

    const slopeBadge = document.createElement('span');
    slopeBadge.className =
      'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold border transition-colors';

    const curvBadge = document.createElement('span');
    curvBadge.className =
      'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold border transition-colors';

    badgesWrap.append(cursorBadge, slopeBadge, curvBadge);
    this._badgeEls = { cursorBadge, slopeBadge, curvBadge };

    row1.append(pillGroup, badgesWrap);

    // Row 2: Active equation & interactive scrub hint
    const row2 = document.createElement('div');
    row2.className = 'hidden sm:flex flex-wrap items-center justify-between gap-2 text-xs';

    const formulaEl = document.createElement('div');
    formulaEl.className = 'text-cyan-200/95 font-medium flex items-center gap-2';
    this._badgeEls.formulaEl = formulaEl;

    const hintEl = document.createElement('div');
    hintEl.className = 'text-[11px] text-slate-400 flex items-center gap-3';
    this._badgeEls.hintEl = hintEl;

    row2.append(formulaEl, hintEl);
    topBar.append(row1, row2);
    root.appendChild(topBar);

    // --- Stacked 3-Panel Canvas Column ---
    const stackWrap = document.createElement('div');
    stackWrap.className = 'divide-y divide-slate-800/80 bg-[#0B0D12]';
    stackWrap.tabIndex = 0;
    stackWrap.setAttribute('aria-label', 'Synchronized derivative graphs; drag or use arrow keys to scrub');

    const panelHeightClasses = [
      'h-[104px] sm:h-[176px]',
      'h-[96px] sm:h-[158px]',
      'h-[92px] sm:h-[148px]',
    ];
    const panelDots = [COLORS.cyan, COLORS.violet, COLORS.amber];
    this._canvases = [];
    this._ctxs = [];
    this._panelMetaEls = [];

    for (let i = 0; i < 3; i++) {
      const panel = document.createElement('div');
      panel.className = 'relative bg-[#0B0D12]';

      const header = document.createElement('div');
      header.className =
        'px-2.5 py-1 sm:px-3.5 sm:py-1.5 flex items-center justify-between gap-2 bg-[#0E121B]/95 border-b border-slate-800/50';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'flex items-center gap-1.5 sm:gap-2 min-w-0';

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
      canvasWrap.className = `relative w-full cursor-ew-resize ${panelHeightClasses[i]}`;

      const canvas = document.createElement('canvas');
      canvas.className = 'el-sg-canvas h-full';
      canvasWrap.appendChild(canvas);
      panel.appendChild(canvasWrap);

      stackWrap.appendChild(panel);

      this._canvases.push(canvas);
      this._ctxs.push(canvas.getContext('2d'));
      this._sizes[i] = { w: 0, h: 100 };
      this._panelMetaEls.push({ titleEl, readoutEl, canvasWrap });

      this._bindCanvasPointerEvents(canvas, signal);
    }

    // Keyboard scrubbing when focused
    stackWrap.addEventListener(
      'keydown',
      (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        const [xMin, xMax] = this._preset.domain;
        const step = (xMax - xMin) * (e.shiftKey ? 0.04 : 0.012);
        const next = e.key === 'ArrowRight' ? this.x + step : this.x - step;
        this._scrubToX(next, true);
      },
      { signal }
    );

    root.appendChild(stackWrap);
    container.appendChild(root);

    this._syncControlUI();
    this._resizeAll();

    // Responsive ResizeObserver
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

  _bindCanvasPointerEvents(canvas, signal) {
    const updateFromClientX = (clientX, playAudio) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 20) return;
      const localPx = clientX - rect.left;
      const [xMin, xMax] = this._preset.domain;
      const plotW = Math.max(10, rect.width - STACKED_PLOT_PAD.left - STACKED_PLOT_PAD.right);
      const frac = clamp((localPx - STACKED_PLOT_PAD.left) / plotW, 0, 1);
      const newX = xMin + frac * (xMax - xMin);
      this._scrubToX(newX, playAudio);
    };

    canvas.addEventListener(
      'pointerdown',
      (e) => {
        this._isDragging = true;
        this._activePointerId = e.pointerId;
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {
          // Ignore if synthetic event
        }
        updateFromClientX(e.clientX, true);
      },
      { signal }
    );

    canvas.addEventListener(
      'pointermove',
      (e) => {
        if (this._isDragging && e.pointerId === this._activePointerId) {
          updateFromClientX(e.clientX, true);
        } else if (e.pointerType === 'mouse' && e.buttons === 0) {
          // Smooth hover scrubbing on desktop
          updateFromClientX(e.clientX, true);
        }
      },
      { signal }
    );

    const endDrag = (e) => {
      if (this._activePointerId === e.pointerId) {
        this._isDragging = false;
        this._activePointerId = null;
        try {
          if (canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId);
          }
        } catch (_) {
          // Ignore
        }
      }
    };

    canvas.addEventListener('pointerup', endDrag, { signal });
    canvas.addEventListener('pointercancel', endDrag, { signal });
  }

  _scrubToX(val, allowTick) {
    const [xMin, xMax] = this._preset.domain;
    const prevX = this.x;
    const nextX = clamp(Number(val), xMin, xMax);
    if (!Number.isFinite(nextX)) return;

    this.x = nextX;

    if (allowTick && Math.abs(nextX - prevX) > 1e-5) {
      this._checkFeatureCrossing(prevX, nextX);
    }

    this._updateLiveBadgesAndReadouts();
    this._drawAll();

    if (this.onCursorChange) {
      try {
        this.onCursorChange({
          x: this.x,
          fx: this._preset.f(this.x),
          dfx: this._preset.df(this.x),
          d2fx: this._preset.d2f(this.x),
          fnKey: this.fnKey,
        });
      } catch (_) {
        // Protect internal loop from consumer callback errors
      }
    }

    if (allowTick && !this._hasInteracted) {
      this._hasInteracted = true;
      try {
        this.onInteract?.({ x: this.x, fnKey: this.fnKey });
      } catch (_) {
        // Ignore
      }
    }
  }

  _checkFeatureCrossing(prevX, nextX) {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const crossed = (root) => (prevX - root) * (nextX - root) <= 0;

    let hit = null;
    for (const r of this._criticalPoints) {
      if (crossed(r)) {
        hit = { x: r, kind: 'critical' };
        break;
      }
    }
    if (!hit) {
      for (const r of this._inflectionPoints) {
        if (crossed(r)) {
          hit = { x: r, kind: 'inflection' };
          break;
        }
      }
    }

    if (hit && now - this._lastTickMs > 85) {
      this._lastTickMs = now;
      this._flashRoot = { ...hit, ts: now };
      safeSound('playTick');
    }
  }

  setFunction(fnKey) {
    const nextPreset =
      this._presetLookup.get(fnKey) ||
      this._presetLookup.get(String(fnKey || '').toLowerCase());
    if (!nextPreset) return;

    this._preset = nextPreset;
    this.fnKey = nextPreset.key;
    this.x = nextPreset.defaultX;
    this._flashRoot = null;
    this._recomputeMathCache();
    this._syncControlUI();
    this._drawAll();

    if (this.onCursorChange) {
      try {
        this.onCursorChange({
          x: this.x,
          fx: this._preset.f(this.x),
          dfx: this._preset.df(this.x),
          d2fx: this._preset.d2f(this.x),
          fnKey: this.fnKey,
        });
      } catch (_) {
        // Ignore
      }
    }
  }

  setX(val) {
    if (!Number.isFinite(Number(val))) return;
    const [xMin, xMax] = this._preset.domain;
    this.x = clamp(Number(val), xMin, xMax);
    this._updateLiveBadgesAndReadouts();
    this._drawAll();
  }

  setMechatronicsLens(bool) {
    const next = Boolean(bool);
    if (next === this.mechatronicsLens) return;
    this.mechatronicsLens = next;
    this._syncControlUI();
    this._drawAll();
  }

  setLens(lens) {
    this.setMechatronicsLens(lens === 'mechatronics');
  }

  _syncControlUI() {
    if (!this._root) return;

    // Active preset button styling
    for (const [key, btn] of this._fnButtons.entries()) {
      const isActive = key === this._preset.key;
      if (isActive) {
        btn.className =
          'el-sg-pill px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer bg-cyan-400/15 border-cyan-400/70 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.22)]';
      } else {
        btn.className =
          'el-sg-pill px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700';
      }
    }

    // Panel Titles (Mechatronics Lens dynamic relabeling)
    const titles = this.mechatronicsLens
      ? [
          'Position x(t) [mm]',
          'Velocity v(t) = dx/dt [mm/s]',
          'Acceleration a(t) = dv/dt [mm/s²]',
        ]
      : [
          'Function f(x)',
          "1st Derivative f'(x) — Slope",
          "2nd Derivative f''(x) — Curvature",
        ];

    for (let i = 0; i < 3; i++) {
      if (this._panelMetaEls[i]) {
        this._panelMetaEls[i].titleEl.textContent = titles[i];
      }
    }

    // Formula & Legend Strip
    if (this._badgeEls.formulaEl) {
      const tex = this.mechatronicsLens ? this._preset.mechatronicsLatex : this._preset.latex;
      this._badgeEls.formulaEl.innerHTML = `
        <span class="text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">
          ${this.mechatronicsLens ? 'Actuator Profile' : 'Active Curve'}
        </span>
        <span>${formatKatex(tex, false)}</span>
      `;
    }

    if (this._badgeEls.hintEl) {
      this._badgeEls.hintEl.innerHTML = `
        <span class="inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>${this.mechatronicsLens ? 'v = 0 Turn' : "f' = 0 Turn"}</span>
        <span class="inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rotate-45 bg-amber-400 inline-block"></span>${this.mechatronicsLens ? 'a = 0 Inflection' : "f'' = 0 Inflection"}</span>
        <span class="hidden sm:inline text-slate-500">• Scrub any graph</span>
      `;
    }

    this._updateLiveBadgesAndReadouts();
  }

  _updateLiveBadgesAndReadouts() {
    if (!this._root) return;
    const x = this.x;
    const fx = this._preset.f(x);
    const dfx = this._preset.df(x);
    const d2fx = this._preset.d2f(x);

    const { cursorBadge, slopeBadge, curvBadge } = this._badgeEls;

    if (cursorBadge) {
      cursorBadge.textContent = this.mechatronicsLens
        ? `t = ${fmtPlain(x, 2)} s`
        : `x = ${fmtSigned(x, 2)}`;
    }

    // Slope state badge (Rising / Falling / Turning Point)
    const dfSpan = Math.max(1, this._bounds[1][1] - this._bounds[1][0]);
    const turnEps = Math.max(0.06, dfSpan * 0.022);
    if (slopeBadge) {
      if (Math.abs(dfx) <= turnEps) {
        slopeBadge.textContent = '● Turning Point';
        slopeBadge.className =
          'px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-cyan-400/15 border-cyan-400/60 text-cyan-200';
      } else if (dfx > 0) {
        slopeBadge.textContent = this.mechatronicsLens ? '↗ Advancing (+v)' : '↗ Rising';
        slopeBadge.className =
          'px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-emerald-400/15 border-emerald-400/50 text-emerald-300';
      } else {
        slopeBadge.textContent = this.mechatronicsLens ? '↘ Retracting (−v)' : '↘ Falling';
        slopeBadge.className =
          'px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-rose-400/15 border-rose-400/50 text-rose-300';
      }
    }

    // Curvature state badge (Concave Up ∪ / Concave Down ∩ / Inflection)
    const d2fSpan = Math.max(1, this._bounds[2][1] - this._bounds[2][0]);
    const inflEps = Math.max(0.08, d2fSpan * 0.024);
    if (curvBadge) {
      if (Math.abs(d2fx) <= inflEps) {
        curvBadge.textContent = '◆ Inflection';
        curvBadge.className =
          'px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-amber-400/20 border-amber-400/70 text-amber-200';
      } else if (d2fx > 0) {
        curvBadge.textContent = '∪ Concave Up';
        curvBadge.className =
          'px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-amber-400/15 border-amber-400/45 text-amber-300';
      } else {
        curvBadge.textContent = '∩ Concave Down';
        curvBadge.className =
          'px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-violet-400/15 border-violet-400/45 text-violet-300';
      }
    }

    // Panel live readouts
    if (this._panelMetaEls.length === 3) {
      if (this.mechatronicsLens) {
        this._panelMetaEls[0].readoutEl.textContent = `x(t) = ${fmtSigned(fx)} mm`;
        this._panelMetaEls[1].readoutEl.textContent = `v(t) = ${fmtSigned(dfx)} mm/s`;
        this._panelMetaEls[2].readoutEl.textContent = `a(t) = ${fmtSigned(d2fx)} mm/s²`;
      } else {
        this._panelMetaEls[0].readoutEl.textContent = `f(x) = ${fmtSigned(fx)}`;
        this._panelMetaEls[1].readoutEl.textContent = `f'(x) = ${fmtSigned(dfx)}`;
        this._panelMetaEls[2].readoutEl.textContent = `f''(x) = ${fmtSigned(d2fx)}`;
      }
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
      this._pulsePhase = (this._pulsePhase + dt * 2.6) % (Math.PI * 2);

      // Only draw when canvases are visible & sized
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

    for (let i = 0; i < 3; i++) {
      const ctx = this._ctxs[i];
      const { w, h } = this._sizes[i];
      if (!ctx || w < 20 || h < 20) continue;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (i === 0) this._drawPanel1(ctx, w, h, pulse, now);
      else if (i === 1) this._drawPanel2(ctx, w, h, pulse, now);
      else this._drawPanel3(ctx, w, h, pulse, now);
    }
  }

  _drawAlignmentGuides(ctx, map, roots, colorRgb, pulse, now, kind, alphaMin = 0.28, alphaMax = 0.56) {
    ctx.save();
    for (const r of roots) {
      const px = Math.round(map.xToPx(r)) + 0.5;
      if (px < map.plotLeft || px > map.plotRight) continue;

      let boost = 0;
      if (this._flashRoot && this._flashRoot.kind === kind && Math.abs(this._flashRoot.x - r) < 1e-3) {
        const elapsed = now - this._flashRoot.ts;
        if (elapsed < 420) {
          boost = (1 - elapsed / 420) * 0.4;
        }
      }

      const alpha = Math.min(0.95, alphaMin + (alphaMax - alphaMin) * pulse + boost);
      ctx.strokeStyle = `rgba(${colorRgb}, ${alpha.toFixed(3)})`;
      ctx.lineWidth = boost > 0.05 ? 1.8 : 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px, map.plotTop);
      ctx.lineTo(px, map.plotBottom);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  _drawCursorVerticalLine(ctx, map, yVal, dotColor) {
    const px = map.xToPx(this.x);
    const py = clamp(map.yToPx(yVal), map.plotTop, map.plotBottom);

    ctx.save();
    // Vertical glowing scrubber hairline
    ctx.strokeStyle = COLORS.cursorLine;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(px, map.plotTop);
    ctx.lineTo(px, map.plotBottom);
    ctx.stroke();

    // Subtle cursor x tag on bottom axis
    const tagTxt = this.mechatronicsLens ? `${fmtPlain(this.x, 2)}s` : fmtPlain(this.x, 2);
    ctx.font = `600 9.5px ${FONT_MONO}`;
    const tagW = ctx.measureText(tagTxt).width + 8;
    const tagX = clamp(px - tagW / 2, map.plotLeft, map.plotRight - tagW);
    drawRoundedRect(ctx, tagX, map.plotBottom + 2, tagW, 15, 3.5);
    ctx.fillStyle = 'rgba(34, 211, 238, 0.18)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.fillStyle = '#E0F2FE';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagTxt, tagX + tagW / 2, map.plotBottom + 10);

    // Glowing point on curve
    ctx.beginPath();
    ctx.arc(px, py, 8.5, 0, Math.PI * 2);
    ctx.fillStyle = dotColor + '33';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = dotColor;
    ctx.fill();
    ctx.strokeStyle = '#0B0D12';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
  }

  _drawPanel1(ctx, width, height, pulse, now) {
    const [xMin, xMax] = this._preset.domain;
    const [yMin, yMax] = this._bounds[0];
    const map = createPlotMapper(width, height, STACKED_PLOT_PAD, xMin, xMax, yMin, yMax);

    drawEngineeringGrid(ctx, width, height, map, xMin, xMax, yMin, yMax, {
      showXLabels: true,
      showYLabels: true,
      xUnit: this.mechatronicsLens ? 's' : '',
    });

    // Subtle inflection alignment guides
    this._drawAlignmentGuides(ctx, map, this._inflectionPoints, '245, 158, 11', pulse, now, 'inflection', 0.14, 0.28);
    // Strong pulsing critical-point alignment guides linking Panel 1 <-> Panel 2
    this._drawAlignmentGuides(ctx, map, this._criticalPoints, '52, 211, 153', pulse, now, 'critical', 0.34, 0.66);

    // Main f(x) curve
    drawGlowingCurve(ctx, map, this._preset.f, xMin, xMax, COLORS.cyan, COLORS.cyanGlow, 2.6);

    // Inflection point subtle amber hollow rings on f(x)
    for (const r of this._inflectionPoints) {
      const px = map.xToPx(r);
      const py = map.yToPx(this._preset.f(r));
      if (py < map.plotTop || py > map.plotBottom) continue;
      ctx.save();
      drawDiamond(ctx, px, py, 4.2);
      ctx.fillStyle = '#0B0D12';
      ctx.fill();
      ctx.strokeStyle = COLORS.amber;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }

    // Critical point beacon dots (local max / min)
    for (const r of this._criticalPoints) {
      const px = map.xToPx(r);
      const py = map.yToPx(this._preset.f(r));
      if (py < map.plotTop || py > map.plotBottom) continue;
      const d2 = this._preset.d2f(r);
      const isMax = d2 < 0;

      ctx.save();
      // Pulsing beacon halo
      ctx.beginPath();
      ctx.arc(px, py, 6 + pulse * 3.5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(52, 211, 153, ${(0.55 - pulse * 0.35).toFixed(2)})`;
      ctx.lineWidth = 1.25;
      ctx.stroke();

      // Core beacon dot
      ctx.beginPath();
      ctx.arc(px, py, 3.8, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.emerald;
      ctx.fill();
      ctx.strokeStyle = '#0B0D12';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Tiny max/min pill
      const tag = Math.abs(d2) < 0.05 ? 'flat' : isMax ? 'max' : 'min';
      ctx.font = `600 9px ${FONT_MONO}`;
      ctx.fillStyle = 'rgba(167, 243, 208, 0.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = isMax ? 'bottom' : 'top';
      const labelY = isMax ? Math.max(map.plotTop + 11, py - 9) : Math.min(map.plotBottom - 11, py + 9);
      ctx.fillText(tag, px, labelY);
      ctx.restore();
    }

    // Glowing live Tangent Line Segment at cursor x
    const fx = this._preset.f(this.x);
    const slope = this._preset.df(this.x);
    const cpx = map.xToPx(this.x);
    const cpy = map.yToPx(fx);

    const vx = map.scaleX;
    const vy = -slope * map.scaleY;
    const len = Math.hypot(vx, vy) || 1;
    const ux = vx / len;
    const uy = vy / len;
    const halfLen = 52;

    const dfSpan = Math.max(1, this._bounds[1][1] - this._bounds[1][0]);
    const isFlat = Math.abs(slope) <= Math.max(0.06, dfSpan * 0.022);
    const tangentColor = isFlat ? COLORS.cyan : slope > 0 ? COLORS.emerald : COLORS.coral;

    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    const x1 = cpx - ux * halfLen;
    const y1 = cpy - uy * halfLen;
    const x2 = cpx + ux * halfLen;
    const y2 = cpy + uy * halfLen;

    ctx.strokeStyle = tangentColor;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.shadowColor = tangentColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Tangent segment endpoints
    ctx.shadowBlur = 0;
    ctx.fillStyle = tangentColor;
    ctx.beginPath();
    ctx.arc(x1, y1, 2.3, 0, Math.PI * 2);
    ctx.arc(x2, y2, 2.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Unified cursor & active dot
    this._drawCursorVerticalLine(ctx, map, fx, COLORS.cyan);

    // Floating slope readout pill
    const slopeText = this.mechatronicsLens
      ? `v(t) = ${fmtSigned(slope)} mm/s`
      : `m = f'(x) = ${fmtSigned(slope)}`;
    drawFloatingPill(ctx, map, cpx, clamp(cpy, map.plotTop + 14, map.plotBottom - 14), slopeText, tangentColor, true);
  }

  _drawPanel2(ctx, width, height, pulse, now) {
    const [xMin, xMax] = this._preset.domain;
    const [yMin, yMax] = this._bounds[1];
    const map = createPlotMapper(width, height, STACKED_PLOT_PAD, xMin, xMax, yMin, yMax);

    drawEngineeringGrid(ctx, width, height, map, xMin, xMax, yMin, yMax, {
      showXLabels: true,
      showYLabels: true,
      xUnit: this.mechatronicsLens ? 's' : '',
    });

    // Signed area shading: positive Emerald (f rising) vs negative Coral (f falling)
    drawSignedAreaShading(ctx, map, this._preset.df, xMin, xMax, COLORS.emeraldFill, COLORS.coralFill);

    // Region labels
    drawRegionLabels(
      ctx,
      map,
      this._preset.df,
      this._criticalPoints,
      xMin,
      xMax,
      this.mechatronicsLens ? 'x rising (v > 0)' : 'f rising',
      this.mechatronicsLens ? 'x falling (v < 0)' : 'f falling',
      '#6EE7B7',
      '#FDA4AF'
    );

    // Inflection guides (subtle on Panel 2) & strong Critical-Point guides (Panel 1 <-> Panel 2)
    this._drawAlignmentGuides(ctx, map, this._inflectionPoints, '245, 158, 11', pulse, now, 'inflection', 0.22, 0.42);
    this._drawAlignmentGuides(ctx, map, this._criticalPoints, '52, 211, 153', pulse, now, 'critical', 0.36, 0.70);

    // Violet f'(x) curve
    drawGlowingCurve(ctx, map, this._preset.df, xMin, xMax, COLORS.violet, COLORS.violetGlow, 2.4);

    // Zero-crossing markers where f'(x) = 0
    const yZero = map.yToPx(0);
    for (const r of this._criticalPoints) {
      const px = map.xToPx(r);
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, yZero, 5.5 + pulse * 3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(52, 211, 153, ${(0.6 - pulse * 0.35).toFixed(2)})`;
      ctx.lineWidth = 1.25;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, yZero, 3.6, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.emerald;
      ctx.fill();
      ctx.strokeStyle = '#0B0D12';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }

    // Unified cursor & value pill
    const dfx = this._preset.df(this.x);
    const cpx = map.xToPx(this.x);
    const cpy = map.yToPx(dfx);
    this._drawCursorVerticalLine(ctx, map, dfx, COLORS.violet);

    const pillTxt = this.mechatronicsLens
      ? `v = ${fmtSigned(dfx)} mm/s`
      : `f'(x) = ${fmtSigned(dfx)}`;
    drawFloatingPill(ctx, map, cpx, clamp(cpy, map.plotTop + 14, map.plotBottom - 14), pillTxt, COLORS.violet, dfx >= 0);
  }

  _drawPanel3(ctx, width, height, pulse, now) {
    const [xMin, xMax] = this._preset.domain;
    const [yMin, yMax] = this._bounds[2];
    const map = createPlotMapper(width, height, STACKED_PLOT_PAD, xMin, xMax, yMin, yMax);

    drawEngineeringGrid(ctx, width, height, map, xMin, xMax, yMin, yMax, {
      showXLabels: true,
      showYLabels: true,
      xUnit: this.mechatronicsLens ? 's' : '',
    });

    // Concave Up (f'' > 0) vs Concave Down (f'' < 0) shading
    drawSignedAreaShading(ctx, map, this._preset.d2f, xMin, xMax, COLORS.amberFill, COLORS.concaveDownFill);

    drawRegionLabels(
      ctx,
      map,
      this._preset.d2f,
      this._inflectionPoints,
      xMin,
      xMax,
      '∪ concave up',
      '∩ concave down',
      '#FCD34D',
      '#C4B5FD'
    );

    // Subtle critical guides + strong pulsing amber Inflection guides
    this._drawAlignmentGuides(ctx, map, this._criticalPoints, '52, 211, 153', pulse, now, 'critical', 0.12, 0.24);
    this._drawAlignmentGuides(ctx, map, this._inflectionPoints, '245, 158, 11', pulse, now, 'inflection', 0.38, 0.72);

    // Amber f''(x) curve
    drawGlowingCurve(ctx, map, this._preset.d2f, xMin, xMax, COLORS.amber, COLORS.amberGlow, 2.4);

    // Glowing amber diamonds at Inflection Points (f''(x) = 0)
    const yZero = map.yToPx(0);
    for (const r of this._inflectionPoints) {
      const px = map.xToPx(r);
      ctx.save();
      // Pulsing outer diamond
      drawDiamond(ctx, px, yZero, 6.5 + pulse * 3);
      ctx.strokeStyle = `rgba(245, 158, 11, ${(0.65 - pulse * 0.38).toFixed(2)})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Solid glowing amber diamond
      drawDiamond(ctx, px, yZero, 4.6);
      ctx.fillStyle = COLORS.amber;
      ctx.shadowColor = COLORS.amberGlow;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#0B0D12';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Crisp tag
      ctx.font = `600 9px ${FONT_MONO}`;
      ctx.fillStyle = 'rgba(253, 230, 138, 0.92)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('inflection', px, Math.max(map.plotTop + 12, yZero - 10));
      ctx.restore();
    }

    // Unified cursor & value pill
    const d2fx = this._preset.d2f(this.x);
    const cpx = map.xToPx(this.x);
    const cpy = map.yToPx(d2fx);
    this._drawCursorVerticalLine(ctx, map, d2fx, COLORS.amber);

    const pillTxt = this.mechatronicsLens
      ? `a = ${fmtSigned(d2fx)} mm/s²`
      : `f''(x) = ${fmtSigned(d2fx)}`;
    drawFloatingPill(ctx, map, cpx, clamp(cpy, map.plotTop + 14, map.plotBottom - 14), pillTxt, COLORS.amber, d2fx >= 0);
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
    this._fnButtons.clear();
    this._root = null;
  }
}

// ===========================================================================
// PART 2: VisualQuizEngine ("Match the Derivative")
// ===========================================================================
const QUIZ_CHALLENGES = [
  {
    id: 'visual-quiz-cubic-turning',
    badge: 'Turning Points',
    title: 'Cubic Turning Points',
    domain: [-3.0, 3.0],
    targetFormulaMath: 'f(x) = 0.25x^3 - 1.5x',
    targetFormulaMech: 'x(t) = 0.25t^3 - 1.5t',
    promptMath:
      'Given the cubic curve $f(x) = 0.25x^3 - 1.5x$ with two turning points near $x \\approx \\pm 1.41$, which graph below represents its derivative $f\'(x)$?',
    promptMech:
      'Given actuator position $x(t) = 0.25t^3 - 1.5t$ with two reversals at $t \\approx \\pm 1.41\\text{ s}$, which graph below is its velocity $v(t) = x\'(t)$?',
    targetFn: (x) => 0.25 * x * x * x - 1.5 * x,
    targetDeriv: (x) => 0.75 * x * x - 1.5,
    proofPoints: [
      { x: -Math.SQRT2, label: 'max → 0' },
      { x: Math.SQRT2, label: 'min → 0' },
    ],
    proofTextMath:
      'Turning points at $x = \\pm\\sqrt{2} \\approx \\pm 1.41$ have horizontal tangents ($f\'(x) = 0$). Between them, $f(x)$ falls so $f\'(x) < 0$; outside them, $f(x)$ rises so $f\'(x) > 0$ — uniquely matching the upward parabola $0.75x^2 - 1.5$.',
    proofTextMech:
      'At $t \\approx \\pm 1.41\\text{ s}$, the actuator momentarily stops ($v(t) = 0$) to reverse direction. Between those stops it retracts ($v < 0$), and outside them it advances ($v > 0$) — giving the upward parabolic velocity profile $v(t) = 0.75t^2 - 1.5$.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        formula: "f'(x) = 0.75x^2 - 1.5",
        fn: (x) => 0.75 * x * x - 1.5,
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        formula: '-0.75x^2 + 1.5',
        fn: (x) => -0.75 * x * x + 1.5,
        wrongHintMath:
          'Look at $x = 0$: the original cubic is sloping steeply downward (negative slope), but this inverted parabola is positive at $x = 0$.',
        wrongHintMech:
          'Check $t = 0$: the actuator position is rapidly retracting (negative velocity), yet this graph shows peak positive velocity at $t = 0$.',
      },
      {
        letter: 'C',
        isCorrect: false,
        formula: '1.5x',
        fn: (x) => 1.5 * x,
        wrongHintMath:
          'Count the turning points: the cubic flattens twice (at $x \\approx \\pm 1.41$), so $f\'(x)$ must cross zero twice. This straight line only crosses zero once — that is actually the 2nd derivative $f\'\'(x)$!',
        wrongHintMech:
          'The actuator reverses twice (at $t \\approx \\pm 1.41\\text{ s}$), so velocity $v(t)$ must hit zero twice. This linear ramp only crosses zero once (it is actually the acceleration $a(t)$!).',
      },
    ],
  },
  {
    id: 'visual-quiz-sine-phase',
    badge: 'Phase Shift',
    title: 'Harmonic Phase Shift',
    domain: [-3.4, 3.4],
    targetFormulaMath: 'f(x) = 2\\sin(x)',
    targetFormulaMech: 'x(t) = 2\\sin(t)',
    promptMath:
      'Given the harmonic oscillation $f(x) = 2\\sin(x)$, which graph below is its rate of change $f\'(x)$?',
    promptMech:
      'Given harmonic servo motion $x(t) = 2\\sin(t)$, which graph below represents its velocity $v(t) = x\'(t)$?',
    targetFn: (x) => 2 * Math.sin(x),
    targetDeriv: (x) => 2 * Math.cos(x),
    proofPoints: [
      { x: -Math.PI / 2, label: 'min → 0' },
      { x: Math.PI / 2, label: 'max → 0' },
    ],
    proofTextMath:
      'At $x = 0$, $2\\sin(x)$ climbs at its steepest positive slope ($+2$). At the extrema $x = \\pm\\pi/2 \\approx \\pm 1.57$, the tangent is flat ($f\' = 0$). That $90^\\circ$ phase lead produces $f\'(x) = 2\\cos(x)$.',
    proofTextMech:
      'Passing through center $t = 0$, the oscillator reaches maximum positive velocity ($+2\\text{ mm/s}$). At peak displacement $t = \\pm\\pi/2$, velocity momentarily hits zero — yielding $v(t) = 2\\cos(t)$.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        formula: '-2\\cos(x)',
        fn: (x) => -2 * Math.cos(x),
        wrongHintMath:
          'Inspect $x = 0$: the sine wave climbs steeply upward through the origin (positive slope $+2$), whereas this graph sits at $-2$ at $x = 0$.',
        wrongHintMech:
          'Check $t = 0$: the oscillator moves forward at peak positive speed through zero, but this candidate shows $-2\\text{ mm/s}$ at $t = 0$.',
      },
      {
        letter: 'B',
        isCorrect: true,
        formula: "f'(x) = 2\\cos(x)",
        fn: (x) => 2 * Math.cos(x),
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        formula: '2\\sin(x)',
        fn: (x) => 2 * Math.sin(x),
        wrongHintMath:
          'At the peaks $x = \\pm\\pi/2$, the original curve has a flat horizontal tangent (slope $= 0$), yet this unchanged sine wave reaches its peak value there instead of zero.',
        wrongHintMech:
          'At maximum excursion ($t = \\pm\\pi/2$), velocity must drop to zero before reversing — this graph peaks there instead of crossing zero.',
      },
    ],
  },
  {
    id: 'visual-quiz-gaussian-bell',
    badge: 'Bell & Inflection',
    title: 'Gaussian Thermal Pulse',
    domain: [-3.6, 3.6],
    targetFormulaMath: 'f(x) = 3e^{-0.4x^2}',
    targetFormulaMech: 'T(t) = 3e^{-0.4t^2}',
    promptMath:
      'Given the Gaussian bell curve $f(x) = 3e^{-0.4x^2}$, which graph represents its derivative $f\'(x)$?',
    promptMech:
      'Given a symmetric thermal pulse $T(t) = 3e^{-0.4t^2}$, which graph represents its heating/cooling rate $T\'(t)$?',
    targetFn: (x) => 3 * Math.exp(-0.4 * x * x),
    targetDeriv: (x) => -2.4 * x * Math.exp(-0.4 * x * x),
    proofPoints: [{ x: 0, label: 'peak → 0' }],
    proofTextMath:
      'Left of the peak ($x < 0$) the bell rises ($f\' > 0$); right at the apex ($x = 0$) the tangent is horizontal ($f\' = 0$); to the right ($x > 0$) it decays ($f\' < 0$). Its steepest slopes occur at the inflection points $x \\approx \\pm 1.12$, forming the odd S-wave $-2.4xe^{-0.4x^2}$.',
    proofTextMech:
      'Before $t = 0$ the pulse heats up ($T\' > 0$), pauses at peak temperature at $t = 0$ ($T\' = 0$), and cools for $t > 0$ ($T\' < 0$), with peak heating/cooling rates at $t \\approx \\pm 1.12\\text{ s}$.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        formula: '2.6e^{-0.4x^2}',
        fn: (x) => 2.6 * Math.exp(-0.4 * x * x),
        wrongHintMath:
          'Look at the right half ($x > 0$): the bell curve is strictly falling (negative slope), but this candidate stays positive everywhere.',
        wrongHintMech:
          'For $t > 0$ the thermal pulse is cooling down (negative rate of change), yet this graph never drops below zero.',
      },
      {
        letter: 'B',
        isCorrect: false,
        formula: '2.4xe^{-0.4x^2}',
        fn: (x) => 2.4 * x * Math.exp(-0.4 * x * x),
        wrongHintMath:
          'Check the left side ($x < 0$): the bell climbs uphill (positive slope), but this reversed S-wave is negative for $x < 0$.',
        wrongHintMech:
          'Before $t = 0$, temperature is rising (positive rate), yet this candidate is negative for $t < 0$ and positive for $t > 0$.',
      },
      {
        letter: 'C',
        isCorrect: true,
        formula: "f'(x) = -2.4xe^{-0.4x^2}",
        fn: (x) => -2.4 * x * Math.exp(-0.4 * x * x),
        wrongHintMath: '',
        wrongHintMech: '',
      },
    ],
  },
  {
    id: 'visual-quiz-damped-servo',
    badge: 'Damped Settling',
    title: 'Damped Servo Step Response',
    domain: [0, 6.0],
    targetFormulaMath: 'f(x) = 2.5e^{-0.25x}\\sin(2x)',
    targetFormulaMech: 'x(t) = 2.5e^{-0.25t}\\sin(2t)',
    promptMath:
      'Given the damped oscillation $f(x) = 2.5e^{-0.25x}\\sin(2x)$ on $[0, 6]$, which graph below is its derivative $f\'(x)$?',
    promptMech:
      'Given a damped servo settling response $x(t) = 2.5e^{-0.25t}\\sin(2t)$ on $[0, 6]\\text{ s}$, which graph is its velocity $v(t) = x\'(t)$?',
    targetFn: (x) => 2.5 * Math.exp(-0.25 * x) * Math.sin(2 * x),
    targetDeriv: (x) => 2.5 * Math.exp(-0.25 * x) * (-0.25 * Math.sin(2 * x) + 2 * Math.cos(2 * x)),
    proofPoints: [
      { x: 0.723, label: 'peak 1 → 0' },
      { x: 2.294, label: 'valley → 0' },
      { x: 3.865, label: 'peak 2 → 0' },
    ],
    proofTextMath:
      'At $x = 0$, the curve shoots upward with steep initial slope $f\'(0) = +5$. Then at every overshoot peak and undershoot valley ($x \\approx 0.72, 2.29, 3.87$), the derivative hits zero while its envelope decays exponentially.',
    proofTextMech:
      'At $t = 0$, the servo launches with maximum positive velocity $v(0) = +5\\text{ mm/s}$. At every overshoot peak and undershoot valley, velocity reverses through $0$ as damping dissipates energy.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        formula: '2.5e^{-0.25x}\\sin(2x)',
        fn: (x) => 2.5 * Math.exp(-0.25 * x) * Math.sin(2 * x),
        wrongHintMath:
          'Look at $x = 0$: the original curve launches steeply upward (slope $= +5$), whereas this same-phase wave starts at $0$ and peaks right where the original curve actually turns around.',
        wrongHintMech:
          'At $t = 0$, the servo has high initial velocity ($+5\\text{ mm/s}$), not zero. Also, this curve peaks where the servo actually comes to a momentary stop.',
      },
      {
        letter: 'B',
        isCorrect: true,
        formula: "f'(x) = 2.5e^{-0.25x}(2\\cos 2x - 0.25\\sin 2x)",
        fn: (x) => 2.5 * Math.exp(-0.25 * x) * (-0.25 * Math.sin(2 * x) + 2 * Math.cos(2 * x)),
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        formula: '4.5e^{-0.45x}',
        fn: (x) => 4.5 * Math.exp(-0.45 * x),
        wrongHintMath:
          'The original curve oscillates up and down repeatedly, so its slope must alternate between positive and negative — this pure exponential decay never crosses below zero.',
        wrongHintMech:
          'Because the servo overshoots and swings back, its velocity must reverse sign (go negative) after each peak — this decaying exponential stays positive forever.',
      },
    ],
  },
  {
    id: 'visual-quiz-velocity-to-accel',
    badge: '2nd Derivative',
    title: 'Parabolic Velocity to Acceleration',
    domain: [-3.0, 3.0],
    targetFormulaMath: 'v(t) = 2 - 0.5t^2',
    targetFormulaMech: 'v(t) = 2 - 0.5t^2',
    promptMath:
      'Given the parabolic velocity profile $v(t) = 2 - 0.5t^2$, which graph below is its acceleration $a(t) = v\'(t)$?',
    promptMech:
      'Given an actuator velocity profile $v(t) = 2 - 0.5t^2\\text{ mm/s}$, which graph below represents its acceleration $a(t) = dv/dt$?',
    targetFn: (t) => 2 - 0.5 * t * t,
    targetDeriv: (t) => -t,
    proofPoints: [{ x: 0, label: 'peak v → a=0' }],
    proofTextMath:
      'For $t < 0$, $v(t)$ rises with steadily shrinking positive slope ($a > 0$). At $t = 0$, $v(t)$ reaches its vertex ($a = 0$). For $t > 0$, $v(t)$ falls faster and faster ($a < 0$), matching the downward line $a(t) = -t$.',
    proofTextMech:
      'The actuator accelerates up to peak speed at $t = 0$ ($a > 0$), reaches zero acceleration at the apex ($a(0) = 0$), and then decelerates linearly for $t > 0$ ($a(t) = -t\\text{ mm/s}^2$).',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        formula: 'a(t) = -t',
        fn: (t) => -t,
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        formula: 'a(t) = -1.2',
        fn: () => -1.2,
        wrongHintMath:
          'A parabolic curve changes slope continuously — rising for $t < 0$ (positive slope) and falling for $t > 0$ (negative slope). A constant horizontal line cannot change sign at $t = 0$.',
        wrongHintMech:
          'Velocity increases for $t < 0$ ($a > 0$) and decreases for $t > 0$ ($a < 0$), so acceleration must cross from positive to negative at $t = 0$, not remain constant.',
      },
      {
        letter: 'C',
        isCorrect: false,
        formula: 'a(t) = +t',
        fn: (t) => t,
        wrongHintMath:
          'Look at $t > 0$: $v(t) = 2 - 0.5t^2$ slopes downward (decreasing), so its derivative $v\'(t)$ must be negative for $t > 0$, not positive.',
        wrongHintMech:
          'For $t > 0$ the actuator is slowing down (negative acceleration), yet this upward-sloping line predicts positive acceleration for $t > 0$.',
      },
    ],
  },
  {
    id: 'visual-quiz-double-well',
    badge: 'Quartic Wells',
    title: 'Double-Well Potential',
    domain: [-2.6, 2.6],
    targetFormulaMath: 'f(x) = 0.25x^4 - 1.5x^2',
    targetFormulaMech: 'U(x) = 0.25x^4 - 1.5x^2',
    promptMath:
      'Given the double-well quartic $f(x) = 0.25x^4 - 1.5x^2$ with three turning points at $x = 0$ and $x = \\pm\\sqrt{3} \\approx \\pm 1.73$, which graph below represents its derivative $f\'(x)$?',
    promptMech:
      'Given a bistable actuator potential energy $U(x) = 0.25x^4 - 1.5x^2$ with equilibria at $x = 0$ and $x = \\pm 1.73$, which graph below represents its slope $U\'(x)$?',
    targetFn: (x) => 0.25 * x ** 4 - 1.5 * x * x,
    targetDeriv: (x) => x ** 3 - 3 * x,
    proofPoints: [
      { x: -Math.sqrt(3), label: 'min → 0' },
      { x: 0, label: 'max → 0' },
      { x: Math.sqrt(3), label: 'min → 0' },
    ],
    proofTextMath:
      'Three turning points at $x = -\\sqrt{3}, 0, +\\sqrt{3}$ force $f\'(x)$ to cross zero three times. The curve falls into the left well ($f\' < 0$), climbs to the center peak ($f\' > 0$), falls into the right well ($f\' < 0$), and rises steeply for $x > \\sqrt{3}$ ($f\' > 0$) — matching $f\'(x) = x^3 - 3x$.',
    proofTextMech:
      'Three zero-force equilibria ($x = \\pm\\sqrt{3}$ stable wells and $x = 0$ unstable crest) align with the three roots of $U\'(x) = x^3 - 3x$, flipping from negative to positive across each stable well.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        formula: '-x^3 + 3x',
        fn: (x) => -(x ** 3) + 3 * x,
        wrongHintMath:
          'Check the far right ($x > 1.73$): the quartic climbs steeply upward (positive slope), yet this inverted cubic plunges negative for $x > 1.73$.',
        wrongHintMech:
          'For $x > 1.73$, the potential energy rises steeply ($U\' > 0$), but this inverted cubic turns negative on the far right.',
      },
      {
        letter: 'B',
        isCorrect: false,
        formula: '3x^2 - 3',
        fn: (x) => 3 * x * x - 3,
        wrongHintMath:
          'Count the turning points: the double-well flattens THREE times ($x = -\\sqrt{3}, 0, +\\sqrt{3}$), so $f\'(x)$ must cross zero three times. This parabola only crosses zero twice — that is actually $f\'\'(x)$!',
        wrongHintMech:
          'There are three equilibria where $U\'(x) = 0$, so the derivative needs three roots — this parabola only crosses zero twice (that is the stiffness $U\'\'(x)$!).',
      },
      {
        letter: 'C',
        isCorrect: true,
        formula: "f'(x) = x^3 - 3x",
        fn: (x) => x ** 3 - 3 * x,
        wrongHintMath: '',
        wrongHintMech: '',
      },
    ],
  },
  {
    id: 'visual-quiz-sigmoid-tanh',
    badge: 'Soft Saturation',
    title: 'Sigmoid Actuator Saturation',
    domain: [-3.0, 3.0],
    targetFormulaMath: 'f(x) = 2\\tanh(x)',
    targetFormulaMech: 'u(e) = 2\\tanh(e)',
    promptMath:
      'Given the soft-saturation S-curve $f(x) = 2\\tanh(x)$ (always rising, steepest at $x = 0$, flattening at both ends), which graph below is its derivative $f\'(x)$?',
    promptMech:
      'Given a soft-saturating actuator curve $u(e) = 2\\tanh(e)$ (always rising, highest gain at $e = 0$, saturated at both ends), which graph below is its local gain $u\'(e)$?',
    targetFn: (x) => 2 * Math.tanh(x),
    targetDeriv: (x) => {
      const c = Math.cosh(x);
      return 2 / (c * c);
    },
    proofHeading: 'Geometric Proof Unlocked — Inflection Slope Peaks While Saturated Ends Approach Zero',
    proofPoints: [
      { x: -2.2, label: 'flat → ~0' },
      { x: 0, label: 'steepest → peak' },
      { x: 2.2, label: 'flat → ~0' },
    ],
    proofTextMath:
      'Because $2\\tanh(x)$ rises everywhere, $f\'(x) = 2\\operatorname{sech}^2(x)$ stays strictly positive. It peaks at the steepest inflection point $x = 0$ ($f\'(0) = +2$) and tapers symmetrically toward $0$ where the S-curve flattens out.',
    proofTextMech:
      'Actuator gain $u\'(e) = 2\\operatorname{sech}^2(e)$ stays strictly positive, peaking at $+2$ near $e = 0$ and decaying smoothly toward $0$ as the output saturates at large $|e|$.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        formula: '-2\\operatorname{sech}^2(x)',
        fn: (x) => {
          const c = Math.cosh(x);
          return -2 / (c * c);
        },
        wrongHintMath:
          'Watch the sign of the slope: $2\\tanh(x)$ rises left-to-right everywhere (positive slope), so $f\'(x)$ must stay strictly above zero, not below the x-axis.',
        wrongHintMech:
          'The command $u(e)$ increases monotonically with error $e$ (positive gain everywhere), whereas this inverted bell stays negative.',
      },
      {
        letter: 'B',
        isCorrect: true,
        formula: "f'(x) = 2\\operatorname{sech}^2(x)",
        fn: (x) => {
          const c = Math.cosh(x);
          return 2 / (c * c);
        },
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        formula: '-4\\operatorname{sech}^2(x)\\tanh(x)',
        fn: (x) => {
          const c = Math.cosh(x);
          return (-4 * Math.tanh(x)) / (c * c);
        },
        wrongHintMath:
          'At $x = 0$, $2\\tanh(x)$ has its STEEPEST positive slope ($+2$), not zero slope! This odd wave crosses zero at $x = 0$ — that is actually the 2nd derivative $f\'\'(x)$.',
        wrongHintMech:
          'At $e = 0$ the actuator has maximum gain ($+2$), not zero gain. This curve hits zero at $e = 0$ and goes negative for $e > 0$ — that is the curvature $u\'\'(e)$!',
      },
    ],
  },
  {
    id: 'visual-quiz-exp-decay',
    badge: 'Exponential Decay',
    title: 'Capacitor Discharge Decay',
    domain: [0, 4.0],
    targetFormulaMath: 'f(x) = 3e^{-0.7x}',
    targetFormulaMech: 'V(t) = 3e^{-0.7t}',
    promptMath:
      'Given the exponential decay curve $f(x) = 3e^{-0.7x}$ on $[0, 4]$ (always falling, steepest at $x = 0$, flattening toward $0$), which graph below represents its derivative $f\'(x)$?',
    promptMech:
      'Given an RC capacitor discharge voltage $V(t) = 3e^{-0.7t}\\text{ V}$ on $[0, 4]\\text{ s}$ (steepest drop at $t = 0$, settling toward $0$), which graph below is its rate $V\'(t) = dV/dt$?',
    targetFn: (x) => 3 * Math.exp(-0.7 * x),
    targetDeriv: (x) => -2.1 * Math.exp(-0.7 * x),
    proofHeading: 'Geometric Proof Unlocked — Falling Curve Gives Negative Slopes Decaying Toward Zero',
    proofPoints: [
      { x: 0.25, label: 'steep drop → min' },
      { x: 3.1, label: 'flattening → ~0' },
    ],
    proofTextMath:
      'Because $3e^{-0.7x}$ falls across the entire interval, its derivative $f\'(x) = -2.1e^{-0.7x}$ stays strictly negative. Its slope is steepest at $x = 0$ ($f\'(0) = -2.1$) and rises smoothly toward $0$ from below as the curve flattens.',
    proofTextMech:
      'Voltage drops fastest right at $t = 0$ ($V\'(0) = -2.1\\text{ V/s}$), and the negative discharge rate decays exponentially toward $0$ from below as the capacitor empties.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        formula: "f'(x) = -2.1e^{-0.7x}",
        fn: (x) => -2.1 * Math.exp(-0.7 * x),
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        formula: '2.1e^{-0.7x}',
        fn: (x) => 2.1 * Math.exp(-0.7 * x),
        wrongHintMath:
          'Check the slope sign! $3e^{-0.7x}$ falls downward across the entire domain, so its derivative must be NEGATIVE everywhere — this candidate stays positive.',
        wrongHintMech:
          'The capacitor voltage is dropping (negative $dV/dt$), yet this graph stays positive everywhere above zero.',
      },
      {
        letter: 'C',
        isCorrect: false,
        formula: '-2.1(1 - e^{-0.7x})',
        fn: (x) => -2.1 * (1 - Math.exp(-0.7 * x)),
        wrongHintMath:
          'Compare both ends: $3e^{-0.7x}$ is steepest at $x = 0$ and nearly flat at $x = 4$, whereas this candidate starts at $0$ and gets MORE negative as $x$ increases!',
        wrongHintMech:
          'Discharge rate is strongest at $t = 0$ and weakens toward $0$ over time — this curve does the reverse, starting at $0$ and growing more negative.',
      },
    ],
  },
];

export class VisualQuizEngine {
  constructor(containerOrOptions = {}, maybeOptions = {}) {
    const isElement =
      containerOrOptions &&
      typeof containerOrOptions === 'object' &&
      containerOrOptions.nodeType === 1;
    const autoMountContainer = isElement ? containerOrOptions : null;
    const options = isElement ? maybeOptions || {} : containerOrOptions || {};

    const {
      mechatronicsLens = options.lens === 'mechatronics',
      onProgress = null,
      onAnswer = null,
      onComplete = null,
    } = options;

    this.mechatronicsLens = Boolean(mechatronicsLens);
    this.onProgress = typeof onProgress === 'function' ? onProgress : null;
    this.onAnswer = typeof onAnswer === 'function' ? onAnswer : null;
    this.onComplete = typeof onComplete === 'function' ? onComplete : null;

    this._challenges = QUIZ_CHALLENGES;
    this._currentIndex = 0;
    this._solvedIds = new Set();
    for (const ch of this._challenges) {
      if (isQuizSolvedInStore(ch.id)) {
        this._solvedIds.add(ch.id);
      }
    }

    this._wrongSelection = null; // { letter, hint }
    this._container = null;
    this._root = null;
    this._targetCanvas = null;
    this._targetCtx = null;
    this._optionCanvases = [];
    this._optionCtxs = [];
    this._optionCards = [];

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

    // Preserve root observer if re-rendering inside existing root
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

    // --- 1. Header & Challenge Stepper ---
    const header = document.createElement('div');
    header.className =
      'px-3 py-2 sm:px-4 sm:py-3 border-b border-slate-800/80 bg-[#0F131C]/90 flex flex-wrap items-center justify-between gap-2 sm:gap-3';

    const titleBlock = document.createElement('div');
    titleBlock.className = 'flex items-center gap-2 min-w-0';
    titleBlock.innerHTML = `
      <span class="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider bg-violet-500/15 border border-violet-400/35 text-violet-300">
        Match the Derivative
      </span>
      <span class="text-xs sm:text-sm font-semibold text-slate-100 truncate">${escapeHtml(ch.title)}</span>
      <span class="hidden sm:inline text-xs font-mono text-slate-400">${this._currentIndex + 1} / ${this._challenges.length}</span>
    `;

    const stepper = document.createElement('div');
    stepper.className = 'flex items-center flex-wrap sm:flex-nowrap gap-1 sm:gap-1.5 max-w-full';

    this._challenges.forEach((item, idx) => {
      const isSolved = this._solvedIds.has(item.id);
      const isActive = idx === this._currentIndex;
      const stepBtn = document.createElement('button');
      stepBtn.type = 'button';
      stepBtn.title = `${idx + 1}. ${item.title}`;
      stepBtn.className =
        'el-sg-pill w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-full text-[11px] sm:text-xs font-mono font-semibold flex items-center justify-center border cursor-pointer ' +
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
      'ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 shrink-0 whitespace-nowrap rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-slate-900 border border-slate-800 text-emerald-300';
    solvedPill.textContent = `${this._solvedIds.size}/${this._challenges.length}`;
    stepper.appendChild(solvedPill);

    header.append(titleBlock, stepper);
    this._root.appendChild(header);

    // --- 2. Prompt & Target Curve Canvas ---
    const body = document.createElement('div');
    body.className = 'p-2.5 sm:p-4 flex flex-col gap-2.5 sm:gap-4';

    const promptBox = document.createElement('div');
    promptBox.className = 'flex flex-col gap-1.5 sm:gap-2';

    const promptText = document.createElement('p');
    promptText.className = 'text-xs sm:text-[15px] leading-snug sm:leading-relaxed text-slate-200';
    promptText.innerHTML = formatInlineMath(this.mechatronicsLens ? ch.promptMech : ch.promptMath);
    promptBox.appendChild(promptText);

    // Target graph frame
    const targetFrame = document.createElement('div');
    targetFrame.className =
      'relative rounded-xl border border-slate-800/90 bg-[#0B0D12] overflow-hidden';

    const targetTopBar = document.createElement('div');
    targetTopBar.className =
      'px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#0E121B]/95 border-b border-slate-800/60 flex items-center justify-between gap-2';

    const targetFormula = this.mechatronicsLens ? ch.targetFormulaMech : ch.targetFormulaMath;
    targetTopBar.innerHTML = `
      <span class="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-cyan-200">
        <span class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE]"></span>
        ${this.mechatronicsLens ? 'Given Signal' : 'Given Function'}
      </span>
      <span class="text-[11px] sm:text-xs text-slate-200">${formatKatex(targetFormula, false)}</span>
    `;
    targetFrame.appendChild(targetTopBar);

    const targetCanvasWrap = document.createElement('div');
    targetCanvasWrap.className = 'relative w-full h-[126px] sm:h-[196px]';

    const targetCanvas = document.createElement('canvas');
    targetCanvas.className = 'el-sg-canvas h-full';
    targetCanvasWrap.appendChild(targetCanvas);
    targetFrame.appendChild(targetCanvasWrap);

    this._targetCanvas = targetCanvas;
    this._targetCtx = targetCanvas.getContext('2d');
    this._targetWrap = targetCanvasWrap;

    promptBox.appendChild(targetFrame);
    body.appendChild(promptBox);

    // --- 3. Three Tactile Glass Option Cards (A, B, C) Side-by-Side Even on Mobile ---
    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'grid grid-cols-3 gap-1.5 sm:gap-3';

    ch.options.forEach((opt, optIdx) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className =
        'el-vq-card text-left rounded-xl border border-slate-800/90 bg-[#0F131C]/80 overflow-hidden flex flex-col focus:outline-none focus:ring-2 focus:ring-cyan-400/50';

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
        'px-2 py-1 sm:px-3 sm:py-2 border-b border-slate-800/60 flex items-center justify-between gap-1 bg-[#0E121B]/90';

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
        <span class="inline-flex items-center gap-1.5 sm:gap-2">
          <span class="w-5 h-5 rounded-md text-[11px] font-mono font-bold border flex items-center justify-center ${badgeColor}">
            ${opt.letter}
          </span>
          <span class="hidden sm:inline text-xs font-medium text-slate-300">Candidate ${opt.letter}</span>
        </span>
        ${rightBadge}
      `;
      card.appendChild(cardHeader);

      const canvasWrap = document.createElement('div');
      canvasWrap.className = 'relative w-full bg-[#0B0D12] h-[86px] sm:h-[136px]';

      const canvas = document.createElement('canvas');
      canvas.className = 'el-sg-canvas h-full';
      canvasWrap.appendChild(canvas);
      card.appendChild(canvasWrap);

      card.addEventListener(
        'click',
        () => this._handleOptionClick(opt, card),
        { signal }
      );

      optionsGrid.appendChild(card);
      this._optionCards.push({ card, canvasWrap, opt });
      this._optionCanvases.push(canvas);
      this._optionCtxs.push(canvas.getContext('2d'));
    });

    body.appendChild(optionsGrid);

    // --- 4. Feedback Banner (Proof Overlay Explanation OR Conceptual Hint) ---
    const feedbackSlot = document.createElement('div');
    this._feedbackSlot = feedbackSlot;

    if (solved) {
      this._renderSolvedFeedback(feedbackSlot, ch);
    } else if (this._wrongSelection) {
      this._renderWrongFeedback(feedbackSlot, this._wrongSelection);
    }

    body.appendChild(feedbackSlot);
    this._root.appendChild(body);

    // Measure & draw immediately
    this._resizeCanvases();
    this._drawCanvases();
  }

  _handleOptionClick(opt, cardEl) {
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
        // Ignore consumer error
      }
    } else {
      safeSound('playGentleError');
      const hint = this.mechatronicsLens ? opt.wrongHintMech : opt.wrongHintMath;
      this._wrongSelection = { letter: opt.letter, hint };

      // Reset all cards' wrong state, then shake the clicked card cleanly
      for (const item of this._optionCards) {
        if (item.opt.letter === opt.letter) {
          item.card.dataset.state = 'wrong';
          item.card.classList.remove('shake-gentle');
          void item.card.offsetWidth; // force reflow to replay shake
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
        // Ignore
      }
    }
  }

  _renderSolvedFeedback(slot, ch) {
    const proofText = this.mechatronicsLens ? ch.proofTextMech : ch.proofTextMath;
    const isLast = this._currentIndex === this._challenges.length - 1;
    const allSolved = this._solvedIds.size === this._challenges.length;

    slot.innerHTML = '';
    const box = document.createElement('div');
    box.className =
      'rounded-xl border border-emerald-400/45 bg-emerald-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3';

    const left = document.createElement('div');
    left.className = 'flex flex-col gap-1';
    const proofHeading = ch.proofHeading || 'Geometric Proof Unlocked — Turning Points Align With Zeros';
    left.innerHTML = `
      <div class="flex items-center gap-2 text-xs font-semibold text-emerald-300">
        <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-400/20 border border-emerald-400/60 text-[10px]">✓</span>
        ${escapeHtml(proofHeading)}
      </div>
      <p class="text-xs sm:text-[13px] leading-relaxed text-slate-200">
        ${formatInlineMath(proofText)}
      </p>
    `;

    const actionWrap = document.createElement('div');
    actionWrap.className = 'shrink-0 flex items-center gap-2';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className =
      'el-sg-pill px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-400/60 text-emerald-100 cursor-pointer whitespace-nowrap';

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
      // Jump to first unsolved challenge
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
    box.className = 'rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 flex items-start gap-2.5';
    box.innerHTML = `
      <span class="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-rose-400/20 border border-rose-400/60 text-rose-300 text-xs font-bold flex items-center justify-center">!</span>
      <div class="text-xs sm:text-[13px] leading-relaxed text-rose-100/95">
        <span class="font-semibold text-rose-300">Not Candidate ${escapeHtml(wrongSelection.letter)}:</span>
        ${formatInlineMath(wrongSelection.hint)}
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
      if (!canvas || !wrap) return { w: 0, h: 136 };
      const r = wrap.getBoundingClientRect();
      if (r.width < 20 || r.height < 20) return { w: 0, h: 136 };
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
      this._pulsePhase = (this._pulsePhase + dt * 2.8) % (Math.PI * 2);

      // Animate continuously when proof overlay is active (pulsing guides)
      if (this._isCurrentSolved() && this._targetSize && this._targetSize.w >= 20) {
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
    const [xMin, xMax] = ch.domain;

    // --- Target Canvas ---
    if (this._targetCtx && this._targetSize && this._targetSize.w >= 20) {
      const { w, h } = this._targetSize;
      const ctx = this._targetCtx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const [yMin, yMax] = computeYBounds(ch.targetFn, xMin, xMax, true);
      const map = createPlotMapper(w, h, QUIZ_TARGET_PAD, xMin, xMax, yMin, yMax);

      drawEngineeringGrid(ctx, w, h, map, xMin, xMax, yMin, yMax, {
        showXLabels: true,
        showYLabels: true,
        xUnit: this.mechatronicsLens ? 's' : '',
      });

      if (solved) {
        this._drawTargetProofOverlay(ctx, map, ch, pulse);
      }

      drawGlowingCurve(ctx, map, ch.targetFn, xMin, xMax, COLORS.cyan, COLORS.cyanGlow, 2.6);

      if (solved) {
        this._drawTargetProofBeacons(ctx, map, ch, pulse);
      }
    }

    // --- Candidate Option Canvases ---
    const optionSizes = this._optionSizes || [];
    ch.options.forEach((opt, idx) => {
      const ctx = this._optionCtxs[idx];
      const size = optionSizes[idx];
      if (!ctx || !size || size.w < 20) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const [yMin, yMax] = computeYBounds(opt.fn, xMin, xMax, true);
      const isNarrow = size.w < 175;
      const optPad = isNarrow ? { left: 8, right: 8, top: 8, bottom: 10 } : QUIZ_OPTION_PAD;
      const map = createPlotMapper(size.w, size.h, optPad, xMin, xMax, yMin, yMax);

      drawEngineeringGrid(ctx, size.w, size.h, map, xMin, xMax, yMin, yMax, {
        showXLabels: !isNarrow,
        showYLabels: !isNarrow,
        compact: true,
      });

      const isSolvedCorrect = solved && opt.isCorrect;

      if (isSolvedCorrect) {
        drawSignedAreaShading(ctx, map, opt.fn, xMin, xMax, COLORS.emeraldFill, COLORS.coralFill, 160);
        this._drawOptionProofGuides(ctx, map, ch, pulse);
      }

      const strokeColor = isSolvedCorrect ? COLORS.emerald : COLORS.violet;
      const glowColor = isSolvedCorrect ? 'rgba(52, 211, 153, 0.42)' : COLORS.violetGlow;
      drawGlowingCurve(ctx, map, opt.fn, xMin, xMax, strokeColor, glowColor, 2.25, 180);

      if (isSolvedCorrect) {
        this._drawOptionProofZeros(ctx, map, ch, pulse);
      }
    });
  }

  _drawTargetProofOverlay(ctx, map, ch, pulse) {
    ctx.save();
    for (const pt of ch.proofPoints) {
      const px = Math.round(map.xToPx(pt.x)) + 0.5;
      ctx.strokeStyle = `rgba(52, 211, 153, ${(0.38 + 0.35 * pulse).toFixed(2)})`;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px, map.plotTop);
      ctx.lineTo(px, map.plotBottom);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  _drawTargetProofBeacons(ctx, map, ch, pulse) {
    ctx.save();
    for (const pt of ch.proofPoints) {
      const px = map.xToPx(pt.x);
      const py = map.yToPx(ch.targetFn(pt.x));
      const slope = typeof ch.targetDeriv === 'function' ? ch.targetDeriv(pt.x) : 0;
      const vx = map.scaleX;
      const vy = -slope * map.scaleY;
      const mag = Math.hypot(vx, vy) || 1;
      const ux = (vx / mag) * 22;
      const uy = (vy / mag) * 22;

      // Exact tangent segment at proof point (horizontal when slope = 0)
      ctx.save();
      ctx.beginPath();
      ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
      ctx.clip();
      ctx.strokeStyle = COLORS.emerald;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = 'rgba(52, 211, 153, 0.55)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(px - ux, py - uy);
      ctx.lineTo(px + ux, py + uy);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Pulsing ring + dot
      ctx.beginPath();
      ctx.arc(px, py, 6 + pulse * 3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(52, 211, 153, ${(0.65 - pulse * 0.35).toFixed(2)})`;
      ctx.lineWidth = 1.25;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, py, 3.8, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.emerald;
      ctx.fill();
      ctx.strokeStyle = '#0B0D12';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // Proof pill
      ctx.font = `600 9.5px ${FONT_MONO}`;
      const tw = ctx.measureText(pt.label).width + 10;
      const pillX = clamp(px - tw / 2, map.plotLeft + 4, map.plotRight - tw - 4);
      const above = py > map.plotTop + 28;
      const pillY = above ? py - 24 : py + 10;

      drawRoundedRect(ctx, pillX, pillY, tw, 16, 4);
      ctx.fillStyle = 'rgba(11, 13, 18, 0.88)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.fillStyle = '#A7F3D0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pt.label, pillX + tw / 2, pillY + 8.5);
    }
    ctx.restore();
  }

  _drawOptionProofGuides(ctx, map, ch, pulse) {
    ctx.save();
    for (const pt of ch.proofPoints) {
      const px = Math.round(map.xToPx(pt.x)) + 0.5;
      ctx.strokeStyle = `rgba(52, 211, 153, ${(0.42 + 0.35 * pulse).toFixed(2)})`;
      ctx.lineWidth = 1.35;
      ctx.setLineDash([3.5, 3.5]);
      ctx.beginPath();
      ctx.moveTo(px, map.plotTop);
      ctx.lineTo(px, map.plotBottom);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  _drawOptionProofZeros(ctx, map, ch, pulse) {
    ctx.save();
    for (const pt of ch.proofPoints) {
      const px = map.xToPx(pt.x);
      const derivVal = typeof ch.targetDeriv === 'function' ? ch.targetDeriv(pt.x) : 0;
      const py = map.yToPx(Math.abs(derivVal) < 1e-6 ? 0 : derivVal);
      ctx.beginPath();
      ctx.arc(px, py, 5.2 + pulse * 2.8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(52, 211, 153, ${(0.7 - pulse * 0.35).toFixed(2)})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, py, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.emerald;
      ctx.fill();
      ctx.strokeStyle = '#0B0D12';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
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
    this._optionCanvases = [];
    this._optionCtxs = [];
    this._optionCards = [];
    this._root = null;
  }
}
