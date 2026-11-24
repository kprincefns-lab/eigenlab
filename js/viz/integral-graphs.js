/**
 * EIGENLAB — Synchronized Integral Accumulation Graphs & Visual Intuition Quiz Engine
 *
 * Exports:
 *   - StackedIntegralLab       : Two synchronized high-DPI HTML5 canvases (f(x) & F(x) = ∫_a^x f(t) dt)
 *                                with unified draggable/touchable cursor b, Emerald/Coral signed area
 *                                shading, pulsing f(x)=0 -> Peak/Valley alignment guides, live tangent
 *                                slope segment F'(b) = f(b), and Mechatronics Lens relabeling.
 *   - IntegralVisualQuizEngine : Brilliant.org-style 6-challenge "Match the Accumulation / Antiderivative"
 *                                visual intuition quiz with mobile-first 3-column zero-scroll layout,
 *                                Emerald/Coral signed-area geometric proof overlays, conceptual hints,
 *                                and store/sound integration.
 */

import { store, sound, renderKatex, renderInlineMathText } from '../store.js';
import { INTEGRAL_PRESETS } from './integral-3d.js';

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
  cyanGlow: 'rgba(34, 211, 238, 0.40)',
  violet: '#A78BFA',
  violetGlow: 'rgba(167, 139, 250, 0.42)',
  violetPreview: 'rgba(167, 139, 250, 0.30)',
  amber: '#F59E0B',
  amberLight: '#FCD34D',
  amberGlow: 'rgba(245, 158, 11, 0.44)',
  emerald: '#34D399',
  emeraldFillTop: 'rgba(52, 211, 153, 0.32)',
  emeraldFillBot: 'rgba(52, 211, 153, 0.09)',
  emeraldFill: 'rgba(52, 211, 153, 0.22)',
  coral: '#FB7185',
  coralFillTop: 'rgba(251, 113, 133, 0.09)',
  coralFillBot: 'rgba(251, 113, 133, 0.34)',
  coralFill: 'rgba(251, 113, 133, 0.22)',
  pillBg: 'rgba(11, 13, 18, 0.92)',
  pillBorder: 'rgba(148, 163, 184, 0.28)',
};

const QUIZ_TARGET_PAD = { left: 42, right: 16, top: 20, bottom: 22 };
const QUIZ_OPTION_PAD = { left: 30, right: 10, top: 14, bottom: 18 };

const FONT_MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const FONT_SANS = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';

function getStackedPad(width) {
  if (width < 430) {
    return { left: 38, right: 14, top: 18, bottom: 22 };
  }
  return { left: 48, right: 20, top: 22, bottom: 24 };
}

// ---------------------------------------------------------------------------
// Scoped Component Styles (injected once into <head>)
// ---------------------------------------------------------------------------
function injectStylesOnce() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('eigenlab-integral-graphs-styles')) return;

  const style = document.createElement('style');
  style.id = 'eigenlab-integral-graphs-styles';
  style.textContent = `
    @keyframes eigenlabIntegralShakeGentle {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(5px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(3px); }
    }
    .shake-gentle {
      animation: eigenlabIntegralShakeGentle 0.42s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .el-ig-canvas {
      display: block;
      width: 100%;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }
    .el-ig-pill {
      transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease, transform 120ms ease;
    }
    .el-ig-pill:active {
      transform: scale(0.97);
    }
    .el-ivq-card {
      transition: border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease, transform 160ms ease;
      cursor: pointer;
    }
    .el-ivq-card:hover:not([data-locked="true"]) {
      transform: translateY(-2px);
      border-color: rgba(34, 211, 238, 0.55);
      box-shadow: 0 10px 30px -12px rgba(34, 211, 238, 0.25);
    }
    .el-ivq-card[data-state="correct"] {
      border-color: rgba(52, 211, 153, 0.85) !important;
      background: linear-gradient(180deg, rgba(52, 211, 153, 0.12), rgba(15, 19, 28, 0.92)) !important;
      box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.35), 0 12px 32px -12px rgba(52, 211, 153, 0.35) !important;
    }
    .el-ivq-card[data-state="wrong"] {
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
// Numerical Integration, Differentiation & Root-Finding Helpers
// ---------------------------------------------------------------------------
const GL8_NODES = [
  -0.9602898564975363,
  -0.7966664774136267,
  -0.525532409916329,
  -0.1834346424956498,
  0.1834346424956498,
  0.525532409916329,
  0.7966664774136267,
  0.9602898564975363,
];
const GL8_WEIGHTS = [
  0.1012285362903763,
  0.2223810344533745,
  0.3137066458778873,
  0.362683783378362,
  0.362683783378362,
  0.3137066458778873,
  0.2223810344533745,
  0.1012285362903763,
];

/**
 * High-precision composite 8-point Gauss-Legendre definite integral from a to x.
 * Exact to ~13 significant digits on smooth integrands and naturally handles x < a.
 */
function integrateGL(fn, a, x, panels = 4) {
  if (!Number.isFinite(x) || !Number.isFinite(a) || Math.abs(x - a) < 1e-12) return 0;
  const step = (x - a) / panels;
  let total = 0;
  for (let p = 0; p < panels; p++) {
    const x0 = a + p * step;
    const x1 = x0 + step;
    const half = 0.5 * (x1 - x0);
    const mid = 0.5 * (x0 + x1);
    let sum = 0;
    for (let k = 0; k < 8; k++) {
      const val = fn(mid + half * GL8_NODES[k]);
      if (Number.isFinite(val)) {
        sum += GL8_WEIGHTS[k] * val;
      }
    }
    total += half * sum;
  }
  return total;
}

function numericDeriv1(fn) {
  const h = 1e-3;
  return (x) => (-fn(x + 2 * h) + 8 * fn(x + h) - 8 * fn(x - h) + fn(x - 2 * h)) / (12 * h);
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
  const edgeMargin = (xMax - xMin) * 0.014;

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
      let lo = prevX;
      let hi = curX;
      let flo = prevY;
      for (let iter = 0; iter < 24; iter++) {
        const mid = 0.5 * (lo + hi);
        const fm = fn(mid);
        if (!Number.isFinite(fm)) break;
        if (Math.abs(fm) < 1e-9) {
          lo = mid;
          hi = mid;
          break;
        }
        if (flo * fm <= 0) {
          hi = mid;
        } else {
          lo = mid;
          flo = fm;
        }
      }
      const r = 0.5 * (lo + hi);
      if (r > xMin + edgeMargin && r < xMax - edgeMargin) {
        roots.push(r);
      }
    }

    prevX = curX;
    prevY = curY;
  }

  roots.sort((u, v) => u - v);
  const unique = [];
  for (const r of roots) {
    if (unique.length === 0 || Math.abs(r - unique[unique.length - 1]) > 0.02) {
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
// Integral Function Presets (Syncs cleanly with INTEGRAL_PRESETS + local fallback)
// ---------------------------------------------------------------------------
const TWO_PI = Math.PI * 2;

const DEFAULT_INTEGRAL_PRESETS = [
  {
    key: 'quadratic',
    aliases: ['quadratic', 'quad', 'quadraticRamp', 'quadratic_ramp', 'ramp', 'parabola', 'poly'],
    label: 'Quadratic Ramp',
    latex: 'f(x) = 0.4x^2 + 0.3',
    mechatronicsLatex: 'v(t) = 0.4t^2 + 0.3',
    domain: [0, 3.6],
    a: 0,
    defaultB: 2.35,
    f: (x) => 0.4 * x * x + 0.3,
    F: (x) => (0.4 / 3) * x * x * x + 0.3 * x,
    df: (x) => 0.8 * x,
  },
  {
    key: 'sine',
    aliases: ['sine', 'sin', 'sineWave', 'sine_wave', 'harmonic', 'oscillator'],
    label: 'Sine Wave',
    latex: 'f(x) = 2\\sin(x)',
    mechatronicsLatex: 'v(t) = 2\\sin(t)',
    domain: [0, TWO_PI],
    a: 0,
    defaultB: 4.15,
    f: (x) => 2 * Math.sin(x),
    F: (x) => 2 * (1 - Math.cos(x)),
    df: (x) => 2 * Math.cos(x),
  },
  {
    key: 'exp',
    aliases: ['exp', 'exponential', 'expImpulse', 'exp_impulse', 'impulse', 'decay', 'rc'],
    label: 'Exp Impulse',
    latex: 'f(x) = 2.6e^{-0.6x}',
    mechatronicsLatex: 'v(t) = 2.6e^{-0.6t}',
    domain: [0, 5.0],
    a: 0,
    defaultB: 2.2,
    f: (x) => 2.6 * Math.exp(-0.6 * x),
    F: (x) => (2.6 / 0.6) * (1 - Math.exp(-0.6 * x)),
    df: (x) => -1.56 * Math.exp(-0.6 * x),
  },
  {
    key: 'signed',
    aliases: ['signed', 'signedWave', 'signed_wave', 'cancellation', 'cancel', 'cubic', 'damped', 'signedOsc'],
    label: 'Signed Wave',
    latex: 'f(x) = 2.2\\cos(1.2x)',
    mechatronicsLatex: 'v(t) = 2.2\\cos(1.2t)',
    domain: [0, 5.2],
    a: 0,
    defaultB: 3.1,
    f: (x) => 2.2 * Math.cos(1.2 * x),
    F: (x) => (2.2 / 1.2) * Math.sin(1.2 * x),
    df: (x) => -2.64 * Math.sin(1.2 * x),
  },
  {
    key: 'gaussian',
    aliases: ['gaussian', 'gauss', 'gaussianPulse', 'gaussian_pulse', 'bell', 'pulse'],
    label: 'Gaussian Pulse',
    latex: 'f(x) = 2.8e^{-0.65(x - 2.5)^2}',
    mechatronicsLatex: 'v(t) = 2.8e^{-0.65(t - 2.5)^2}',
    domain: [0, 5.0],
    a: 0,
    defaultB: 2.85,
    f: (x) => 2.8 * Math.exp(-0.65 * (x - 2.5) * (x - 2.5)),
    F: null, // Computed to 13-digit accuracy via composite Gauss-Legendre
    df: (x) => -3.64 * (x - 2.5) * Math.exp(-0.65 * (x - 2.5) * (x - 2.5)),
  },
];

function extractDomain(raw, fallback) {
  if (!raw) return fallback;
  const candidate = raw.domain || raw.xRange || raw.range;
  if (Array.isArray(candidate) && candidate.length >= 2) {
    const lo = Number(candidate[0]);
    const hi = Number(candidate[1]);
    if (Number.isFinite(lo) && Number.isFinite(hi) && hi > lo) return [lo, hi];
  }
  if (candidate && typeof candidate === 'object') {
    const lo = Number(candidate.min ?? candidate.xMin);
    const hi = Number(candidate.max ?? candidate.xMax);
    if (Number.isFinite(lo) && Number.isFinite(hi) && hi > lo) return [lo, hi];
  }
  if (Number.isFinite(raw.xMin) && Number.isFinite(raw.xMax) && raw.xMax > raw.xMin) {
    return [raw.xMin, raw.xMax];
  }
  return fallback;
}

function extractLowerLimit(raw, domain, fallbackA) {
  if (raw) {
    const candidates = [
      raw.defaultA,
      raw.a,
      raw.lower,
      raw.start,
      Array.isArray(raw.defaultLimits) ? raw.defaultLimits[0] : undefined,
      Array.isArray(raw.limits) ? raw.limits[0] : undefined,
    ];
    for (const c of candidates) {
      if (Number.isFinite(Number(c))) {
        return clamp(Number(c), domain[0], domain[1]);
      }
    }
  }
  return clamp(fallbackA, domain[0], domain[1]);
}

function extractDefaultB(raw, domain, a, fallbackB) {
  if (raw) {
    const candidates = [
      raw.defaultB,
      raw.b,
      raw.upper,
      Array.isArray(raw.defaultLimits) ? raw.defaultLimits[1] : undefined,
      Array.isArray(raw.limits) ? raw.limits[1] : undefined,
    ];
    for (const c of candidates) {
      if (Number.isFinite(Number(c))) {
        const val = clamp(Number(c), domain[0], domain[1]);
        if (Math.abs(val - a) > (domain[1] - domain[0]) * 0.08) return val;
      }
    }
  }
  return clamp(fallbackB, domain[0] + 0.1 * (domain[1] - domain[0]), domain[1] - 0.06 * (domain[1] - domain[0]));
}

function buildAccumulationFn(f, rawAnti, a, domain) {
  // Verify candidate antiderivative matches F'(x) = f(x) before trusting it
  if (typeof rawAnti === 'function') {
    const testX = 0.5 * (domain[0] + domain[1]);
    const h = 1e-4;
    const numSlope = (rawAnti(testX + h) - rawAnti(testX - h)) / (2 * h);
    const fx = f(testX);
    if (Number.isFinite(numSlope) && Number.isFinite(fx) && Math.abs(numSlope - fx) < 1e-2) {
      const base = rawAnti(a);
      if (Number.isFinite(base)) {
        return (x) => rawAnti(x) - base;
      }
    }
  }
  return (x) => integrateGL(f, a, x, 6);
}

function toMechatronicsLatex(latex, fallback) {
  if (!latex) return fallback;
  return String(latex)
    .replace(/f\s*\(\s*x\s*\)/g, 'v(t)')
    .replace(/(?<![a-zA-Z\\])x(?![a-zA-Z(])/g, 't');
}

function buildIntegralPresetCatalog() {
  const externalMap = new Map();
  try {
    if (INTEGRAL_PRESETS) {
      if (Array.isArray(INTEGRAL_PRESETS)) {
        for (const item of INTEGRAL_PRESETS) {
          if (item && (item.id || item.key)) {
            externalMap.set(String(item.id || item.key), item);
          }
        }
      } else if (typeof INTEGRAL_PRESETS === 'object') {
        for (const [k, v] of Object.entries(INTEGRAL_PRESETS)) {
          if (v && typeof v === 'object') {
            externalMap.set(k, v);
          }
        }
      }
    }
  } catch (_) {
    // Clean fallback to DEFAULT_INTEGRAL_PRESETS
  }

  const ordered = [];
  const lookup = new Map();

  for (const def of DEFAULT_INTEGRAL_PRESETS) {
    let matchedKey = null;
    let ext = null;

    for (const alias of def.aliases) {
      if (externalMap.has(alias)) {
        matchedKey = alias;
        ext = externalMap.get(alias);
        break;
      }
      for (const [ek, ev] of externalMap.entries()) {
        if (ek.toLowerCase() === alias.toLowerCase()) {
          matchedKey = ek;
          ext = ev;
          break;
        }
      }
      if (ext) break;
    }

    const rawF = ext && (ext.f || ext.fn || ext.eval || ext.integrand);
    const f = typeof rawF === 'function' ? rawF : def.f;
    const domain = extractDomain(ext, def.domain);
    const a = extractLowerLimit(ext, domain, def.a);
    const defaultB = extractDefaultB(ext, domain, a, def.defaultB);
    const rawAnti =
      ext && (ext.antideriv || ext.F || ext.antiderivative || ext.anti || ext.integral || ext.primitive);
    const F = buildAccumulationFn(f, typeof rawF === 'function' ? rawAnti : def.F, a, domain);
    const rawDf = ext && (ext.df || ext.fPrime || ext.derivative);
    const df =
      typeof rawDf === 'function'
        ? rawDf
        : typeof rawF === 'function'
        ? numericDeriv1(f)
        : def.df || numericDeriv1(f);

    const latex = (ext && (ext.latex || ext.formula)) || def.latex;
    const mechatronicsLatex =
      (ext && ext.mechatronicsLatex) ||
      (ext && (ext.latex || ext.formula)
        ? toMechatronicsLatex(ext.latex || ext.formula, def.mechatronicsLatex)
        : def.mechatronicsLatex);

    const preset = {
      key: matchedKey || def.key,
      canonicalKey: def.key,
      label: def.label,
      latex,
      mechatronicsLatex,
      domain,
      a,
      defaultB,
      f,
      F,
      df,
    };

    ordered.push(preset);
    lookup.set(preset.key, preset);
    lookup.set(def.key, preset);
    for (const alias of def.aliases) {
      lookup.set(alias, preset);
      lookup.set(alias.toLowerCase(), preset);
    }
  }

  // Register any extra external keys so setFunction() never fails
  for (const [ek, ext] of externalMap.entries()) {
    const rawF = ext && (ext.f || ext.fn || ext.eval || ext.integrand);
    if (!lookup.has(ek) && typeof rawF === 'function') {
      const domain = extractDomain(ext, [0, 5]);
      const a = extractLowerLimit(ext, domain, domain[0]);
      const defaultB = extractDefaultB(ext, domain, a, a + 0.65 * (domain[1] - a));
      const rawAnti = ext.antideriv || ext.F || ext.antiderivative || ext.anti || ext.integral;
      const preset = {
        key: ek,
        canonicalKey: ek,
        label: ext.label || ext.name || ek,
        latex: ext.latex || ext.formula || 'f(x)',
        mechatronicsLatex: ext.mechatronicsLatex || toMechatronicsLatex(ext.latex || ext.formula, 'v(t)'),
        domain,
        a,
        defaultB,
        f: rawF,
        F: buildAccumulationFn(rawF, rawAnti, a, domain),
        df: typeof (ext.df || ext.fPrime) === 'function' ? ext.df || ext.fPrime : numericDeriv1(rawF),
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

  // Subtle top-down studio depth gradient
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
      ctx.fillText(formatTickValue(gy), map.plotLeft - 6, py);
    }
  }

  // Crisp explicit zero axes
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

function drawGlowingCurve(ctx, map, fn, xStart, xEnd, color, glowColor, lineWidth = 2.4, samples = 240, dash = null) {
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

  if (dash) ctx.setLineDash(dash);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
  }
  ctx.stroke();

  if (glowColor && !dash) {
    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(1.4, lineWidth - 0.55);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

/**
 * Draws lush gradient-filled signed area shading between xStart and xEnd.
 * When xEnd >= xStart: f > 0 is Emerald (positive contribution), f < 0 is Coral (negative).
 * When xEnd < xStart: signs flip cleanly to respect reversed integration bounds.
 */
function drawSignedAreaBetween(ctx, map, fn, xStart, xEnd, samples = 220) {
  if (Math.abs(xEnd - xStart) < 1e-5) return;
  const reversed = xEnd < xStart;
  const lo = Math.min(xStart, xEnd);
  const hi = Math.max(xStart, xEnd);

  const yZero = clamp(map.yToPx(0), map.plotTop, map.plotBottom);
  const dx = (hi - lo) / samples;

  const traceClosedArea = () => {
    ctx.beginPath();
    ctx.moveTo(map.xToPx(lo), yZero);
    for (let i = 0; i <= samples; i++) {
      const x = lo + i * dx;
      const y = fn(x);
      const py = Number.isFinite(y) ? map.yToPx(y) : yZero;
      ctx.lineTo(map.xToPx(x), py);
    }
    ctx.lineTo(map.xToPx(hi), yZero);
    ctx.closePath();
  };

  // Above yZero (f > 0)
  if (yZero > map.plotTop) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, yZero - map.plotTop);
    ctx.clip();
    traceClosedArea();
    const gradPos = ctx.createLinearGradient(0, map.plotTop, 0, yZero);
    if (!reversed) {
      gradPos.addColorStop(0, COLORS.emeraldFillTop);
      gradPos.addColorStop(1, COLORS.emeraldFillBot);
    } else {
      gradPos.addColorStop(0, COLORS.coralFillBot);
      gradPos.addColorStop(1, COLORS.coralFillTop);
    }
    ctx.fillStyle = gradPos;
    ctx.fill();
    ctx.restore();
  }

  // Below yZero (f < 0)
  if (yZero < map.plotBottom) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, yZero, map.plotW, map.plotBottom - yZero);
    ctx.clip();
    traceClosedArea();
    const gradNeg = ctx.createLinearGradient(0, yZero, 0, map.plotBottom);
    if (!reversed) {
      gradNeg.addColorStop(0, COLORS.coralFillTop);
      gradNeg.addColorStop(1, COLORS.coralFillBot);
    } else {
      gradNeg.addColorStop(0, COLORS.emeraldFillBot);
      gradNeg.addColorStop(1, COLORS.emeraldFillTop);
    }
    ctx.fillStyle = gradNeg;
    ctx.fill();
    ctx.restore();
  }
}

function drawShadedLobeLabels(ctx, map, fn, roots, xStart, xEnd, posLabel = '+Area', negLabel = '−Area') {
  if (Math.abs(xEnd - xStart) < 1e-4) return;
  const reversed = xEnd < xStart;
  const lo = Math.min(xStart, xEnd);
  const hi = Math.max(xStart, xEnd);
  const edges = [lo, ...roots.filter((r) => r > lo + 1e-3 && r < hi - 1e-3), hi];
  const yZero = clamp(map.yToPx(0), map.plotTop, map.plotBottom);

  ctx.save();
  ctx.font = `600 9.5px ${FONT_SANS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < edges.length - 1; i++) {
    const segA = edges[i];
    const segB = edges[i + 1];
    const pxWidth = map.xToPx(segB) - map.xToPx(segA);
    if (pxWidth < 46) continue;

    let bestX = 0.5 * (segA + segB);
    let bestVal = fn(bestX);
    for (let s = 1; s <= 5; s++) {
      const sx = segA + ((segB - segA) * s) / 6;
      const sv = fn(sx);
      if (Math.abs(sv) > Math.abs(bestVal)) {
        bestVal = sv;
        bestX = sx;
      }
    }
    if (Math.abs(bestVal) < 0.12) continue;

    const effectivePos = reversed ? bestVal < 0 : bestVal > 0;
    const isAbove = bestVal > 0;
    const text = effectivePos ? posLabel : negLabel;
    const px = map.xToPx(0.5 * (segA + segB) * 0.55 + bestX * 0.45);
    const curvePy = clamp(map.yToPx(bestVal), map.plotTop + 10, map.plotBottom - 10);
    if (Math.abs(curvePy - yZero) < 18) continue;

    const midPy = 0.5 * (yZero + curvePy);
    const textW = ctx.measureText(text).width;
    const clampedPx = clamp(px, map.plotLeft + textW / 2 + 6, map.plotRight - textW / 2 - 6);
    const clampedPy = isAbove
      ? clamp(midPy, map.plotTop + 11, Math.max(map.plotTop + 11, yZero - 10))
      : clamp(midPy, Math.min(map.plotBottom - 11, yZero + 10), map.plotBottom - 11);

    drawRoundedRect(ctx, clampedPx - textW / 2 - 4, clampedPy - 7.5, textW + 8, 15, 4);
    ctx.fillStyle = 'rgba(11, 13, 18, 0.56)';
    ctx.fill();

    ctx.fillStyle = effectivePos ? '#6EE7B7' : '#FDA4AF';
    ctx.fillText(text, clampedPx, clampedPy + 0.5);
  }
  ctx.restore();
}

function drawFloatingPill(ctx, map, anchorX, anchorY, text, accentColor, preferAbove = true, compact = false) {
  ctx.save();
  ctx.font = `600 ${compact ? 10 : 11}px ${FONT_MONO}`;
  const metrics = ctx.measureText(text);
  const padX = compact ? 6 : 8;
  const pillW = Math.ceil(metrics.width + padX * 2 + 6);
  const pillH = compact ? 20 : 22;

  let x = anchorX + 10;
  if (x + pillW > map.plotRight - 4) {
    x = anchorX - pillW - 10;
  }
  x = clamp(x, map.plotLeft + 4, Math.max(map.plotLeft + 4, map.plotRight - pillW - 4));

  let y = preferAbove ? anchorY - pillH - 9 : anchorY + 9;
  if (y < map.plotTop + 4) y = anchorY + 10;
  if (y + pillH > map.plotBottom - 4) y = map.plotBottom - pillH - 4;

  drawRoundedRect(ctx, x, y, pillW, pillH, 6);
  ctx.fillStyle = COLORS.pillBg;
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Accent indicator bar
  ctx.fillStyle = accentColor;
  drawRoundedRect(ctx, x + 4, y + 4.5, 2.5, pillH - 9, 1.5);
  ctx.fill();

  ctx.fillStyle = '#F8FAFC';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + (compact ? 9.5 : 11), y + pillH / 2 + 0.5);
  ctx.restore();
}

// ===========================================================================
// PART 1: StackedIntegralLab (2-Panel Synchronized FTC Explorer)
// ===========================================================================
export class StackedIntegralLab {
  constructor(containerOrOptions = {}, maybeOptions = {}) {
    const isElement =
      containerOrOptions &&
      typeof containerOrOptions === 'object' &&
      containerOrOptions.nodeType === 1;
    const autoMountContainer = isElement ? containerOrOptions : null;
    const options = isElement ? maybeOptions || {} : containerOrOptions || {};

    const {
      initialFnKey = 'sine',
      mechatronicsLens = options.lens === 'mechatronics',
      onCursorChange = null,
      onInteract = null,
      onComplete = null,
    } = options;

    const { ordered, lookup } = buildIntegralPresetCatalog();
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

    this.b = initPreset.defaultB;
    this._isDragging = false;
    this._activePointerId = null;

    this._container = null;
    this._root = null;
    this._canvases = [];
    this._ctxs = [];
    this._sizes = [
      { w: 0, h: 160 },
      { w: 0, h: 160 },
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
    this._zeroCrossings = findRoots(this._preset.f, xMin, xMax);
    this._bounds = [
      computeYBounds(this._preset.f, xMin, xMax, true),
      computeYBounds(this._preset.F, xMin, xMax, true),
    ];
    this.b = clamp(this.b, xMin, xMax);
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

    // --- Top Control Strip (mobile-compact!) ---
    const topBar = document.createElement('div');
    topBar.className =
      'px-2.5 py-2 sm:px-3.5 sm:py-3 border-b border-slate-800/80 bg-[#0F131C]/90 flex flex-col gap-1.5 sm:gap-2.5';

    // Row 1: Single-row swipeable preset pills + live compact badges
    const row1 = document.createElement('div');
    row1.className = 'flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-1.5 sm:gap-2.5';

    const pillGroup = document.createElement('div');
    pillGroup.className =
      'flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap sm:flex-wrap pb-0.5 sm:pb-0';
    this._fnButtons.clear();

    for (const preset of this._presets) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.fnKey = preset.key;
      btn.className =
        'el-ig-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer';
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
      'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-amber-500/10 border border-amber-400/45 text-amber-200';

    const areaBadge = document.createElement('span');
    areaBadge.className =
      'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-colors';

    const stateBadge = document.createElement('span');
    stateBadge.className =
      'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold border transition-colors';

    badgesWrap.append(cursorBadge, areaBadge, stateBadge);
    this._badgeEls = { cursorBadge, areaBadge, stateBadge };

    row1.append(pillGroup, badgesWrap);

    // Row 2: Active equation & FTC visual legend (desktop / tablet)
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

    // --- Synchronized 2-Panel Canvas Stack ---
    const stackWrap = document.createElement('div');
    stackWrap.className = 'divide-y divide-slate-800/80 bg-[#0B0D12]';
    stackWrap.tabIndex = 0;
    stackWrap.setAttribute(
      'aria-label',
      'Synchronized Fundamental Theorem of Calculus graphs; drag or use arrow keys to sweep upper bound b'
    );

    const panelDots = [COLORS.cyan, COLORS.violet];
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
      canvasWrap.className = 'relative w-full cursor-ew-resize h-[128px] sm:h-[185px]';

      const canvas = document.createElement('canvas');
      canvas.className = 'el-ig-canvas h-full';
      canvasWrap.appendChild(canvas);
      panel.appendChild(canvasWrap);

      stackWrap.appendChild(panel);

      this._canvases.push(canvas);
      this._ctxs.push(canvas.getContext('2d'));
      this._sizes[i] = { w: 0, h: 128 };
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
        const next = e.key === 'ArrowRight' ? this.b + step : this.b - step;
        this._scrubToB(next, true);
      },
      { signal }
    );

    root.appendChild(stackWrap);
    container.appendChild(root);

    this._syncControlUI();
    this._resizeAll();

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
      const pad = getStackedPad(rect.width);
      const plotW = Math.max(10, rect.width - pad.left - pad.right);
      const frac = clamp((localPx - pad.left) / plotW, 0, 1);
      const newB = xMin + frac * (xMax - xMin);
      this._scrubToB(newB, playAudio);
    };

    canvas.addEventListener(
      'pointerdown',
      (e) => {
        this._isDragging = true;
        this._activePointerId = e.pointerId;
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {
          // Ignore synthetic events
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
          // Smooth desktop hover scrubbing
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

  _scrubToB(val, allowTick) {
    const [xMin, xMax] = this._preset.domain;
    const prevB = this.b;
    const nextB = clamp(Number(val), xMin, xMax);
    if (!Number.isFinite(nextB)) return;

    this.b = nextB;

    if (allowTick && Math.abs(nextB - prevB) > 1e-5) {
      this._checkZeroCrossing(prevB, nextB);
    }

    this._updateLiveBadgesAndReadouts();
    this._drawAll();

    if (this.onCursorChange) {
      try {
        this.onCursorChange({
          b: this.b,
          x: this.b,
          a: this._preset.a,
          fb: this._preset.f(this.b),
          Fb: this._preset.F(this.b),
          fnKey: this.fnKey,
        });
      } catch (_) {
        // Protect internal loop from consumer errors
      }
    }

    if (allowTick && !this._hasInteracted) {
      this._hasInteracted = true;
      try {
        this.onInteract?.({ b: this.b, fnKey: this.fnKey });
      } catch (_) {
        // Ignore
      }
    }
  }

  _checkZeroCrossing(prevB, nextB) {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    for (const r of this._zeroCrossings) {
      if ((prevB - r) * (nextB - r) <= 0) {
        if (now - this._lastTickMs > 85) {
          this._lastTickMs = now;
          this._flashRoot = { x: r, ts: now };
          safeSound('playTick');
        }
        break;
      }
    }
  }

  setFunction(fnKey) {
    const nextPreset =
      this._presetLookup.get(fnKey) ||
      this._presetLookup.get(String(fnKey || '').toLowerCase());
    if (!nextPreset) return;

    this._preset = nextPreset;
    this.fnKey = nextPreset.key;
    this.b = nextPreset.defaultB;
    this._flashRoot = null;
    this._recomputeMathCache();
    this._syncControlUI();
    this._drawAll();

    if (this.onCursorChange) {
      try {
        this.onCursorChange({
          b: this.b,
          x: this.b,
          a: this._preset.a,
          fb: this._preset.f(this.b),
          Fb: this._preset.F(this.b),
          fnKey: this.fnKey,
        });
      } catch (_) {
        // Ignore
      }
    }
  }

  setB(val) {
    if (!Number.isFinite(Number(val))) return;
    const [xMin, xMax] = this._preset.domain;
    this.b = clamp(Number(val), xMin, xMax);
    this._updateLiveBadgesAndReadouts();
    this._drawAll();
  }

  setX(val) {
    this.setB(val);
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

    for (const [key, btn] of this._fnButtons.entries()) {
      const isActive = key === this._preset.key;
      if (isActive) {
        btn.className =
          'el-ig-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border cursor-pointer bg-cyan-400/15 border-cyan-400/70 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.22)]';
      } else {
        btn.className =
          'el-ig-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700';
      }
    }

    const titles = this.mechatronicsLens
      ? ['Velocity v(t) [mm/s]', 'Displacement x(t) [mm]']
      : ['Rate / Integrand f(x)', 'Accumulation F(x) = ∫ f(t) dt'];

    for (let i = 0; i < 2; i++) {
      if (this._panelMetaEls[i]) {
        this._panelMetaEls[i].titleEl.textContent = titles[i];
      }
    }

    if (this._badgeEls.formulaEl) {
      const tex = this.mechatronicsLens ? this._preset.mechatronicsLatex : this._preset.latex;
      const ftcTex = this.mechatronicsLens
        ? "x'(b) = v(b)"
        : "F'(b) = f(b)";
      this._badgeEls.formulaEl.innerHTML = `
        <span class="text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">
          ${this.mechatronicsLens ? 'Actuator FTC' : 'FTC Live'}
        </span>
        <span>${formatKatex(tex, false)}</span>
        <span class="text-slate-500">•</span>
        <span class="text-violet-300">${formatKatex(ftcTex, false)}</span>
      `;
    }

    if (this._badgeEls.hintEl) {
      this._badgeEls.hintEl.innerHTML = `
        <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-emerald-400/70 inline-block"></span>+Area</span>
        <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-rose-400/70 inline-block"></span>−Area</span>
        <span class="inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>${this.mechatronicsLens ? 'v = 0 → Peak/Valley' : 'f = 0 → Peak/Valley'}</span>
      `;
    }

    this._updateLiveBadgesAndReadouts();
  }

  _updateLiveBadgesAndReadouts() {
    if (!this._root) return;
    const b = this.b;
    const fb = this._preset.f(b);
    const Fb = this._preset.F(b);
    const dfb = this._preset.df(b);

    const { cursorBadge, areaBadge, stateBadge } = this._badgeEls;

    if (cursorBadge) {
      cursorBadge.textContent = this.mechatronicsLens
        ? `t = ${fmtPlain(b, 2)} s`
        : `x = ${fmtPlain(b, 2)}`;
    }

    if (areaBadge) {
      const label = this.mechatronicsLens
        ? `Δx = ${fmtSigned(Fb, 2)} mm`
        : `Net Area = ${fmtSigned(Fb, 2)}`;
      areaBadge.textContent = label;
      if (Math.abs(Fb) < 0.03) {
        areaBadge.className =
          'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border bg-slate-900/90 border-slate-700 text-slate-200';
      } else if (Fb > 0) {
        areaBadge.className =
          'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border bg-violet-500/15 border-violet-400/50 text-violet-200';
      } else {
        areaBadge.className =
          'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border bg-rose-500/15 border-rose-400/50 text-rose-200';
      }
    }

    // Accumulation state badge: Accumulating (+) / Canceling (−) / Peak-Valley
    const fSpan = Math.max(1, this._bounds[0][1] - this._bounds[0][0]);
    const zeroEps = Math.max(0.06, fSpan * 0.025);
    if (stateBadge) {
      if (Math.abs(fb) <= zeroEps) {
        const kind = dfb < -0.05 ? 'Peak' : dfb > 0.05 ? 'Valley' : 'Peak-Valley';
        stateBadge.textContent = `● ${kind}`;
        stateBadge.className =
          'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold border bg-cyan-400/15 border-cyan-400/65 text-cyan-200';
      } else if (fb > 0) {
        stateBadge.textContent = '▲ Accumulating (+)';
        stateBadge.className =
          'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold border bg-emerald-400/15 border-emerald-400/50 text-emerald-300';
      } else {
        stateBadge.textContent = '▼ Canceling (−)';
        stateBadge.className =
          'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold border bg-rose-400/15 border-rose-400/50 text-rose-300';
      }
    }

    if (this._panelMetaEls.length === 2) {
      if (this.mechatronicsLens) {
        this._panelMetaEls[0].readoutEl.textContent = `v(b) = ${fmtSigned(fb)} mm/s`;
        this._panelMetaEls[1].readoutEl.textContent = `x(b) = ${fmtSigned(Fb)} mm`;
      } else {
        this._panelMetaEls[0].readoutEl.textContent = `f(b) = ${fmtSigned(fb)}`;
        this._panelMetaEls[1].readoutEl.textContent = `F(b) = ${fmtSigned(Fb)}`;
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
      this._pulsePhase = (this._pulsePhase + dt * 2.6) % TWO_PI;

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

    for (let i = 0; i < 2; i++) {
      const ctx = this._ctxs[i];
      const { w, h } = this._sizes[i];
      if (!ctx || w < 20 || h < 20) continue;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (i === 0) this._drawRatePanel(ctx, w, h, pulse, now);
      else this._drawAccumulationPanel(ctx, w, h, pulse, now);
    }
  }

  _drawZeroCrossingGuides(ctx, map, pulse, now) {
    ctx.save();
    for (const r of this._zeroCrossings) {
      const px = Math.round(map.xToPx(r)) + 0.5;
      if (px < map.plotLeft || px > map.plotRight) continue;

      let boost = 0;
      if (this._flashRoot && Math.abs(this._flashRoot.x - r) < 1e-3) {
        const elapsed = now - this._flashRoot.ts;
        if (elapsed < 420) {
          boost = (1 - elapsed / 420) * 0.42;
        }
      }

      const alpha = Math.min(0.95, 0.34 + 0.34 * pulse + boost);
      ctx.strokeStyle = `rgba(52, 211, 153, ${alpha.toFixed(3)})`;
      ctx.lineWidth = boost > 0.05 ? 1.85 : 1.25;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px, map.plotTop);
      ctx.lineTo(px, map.plotBottom);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  _drawAnchorLimitA(ctx, map) {
    const px = Math.round(map.xToPx(this._preset.a)) + 0.5;
    if (px < map.plotLeft - 1 || px > map.plotRight + 1) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2.5, 3.5]);
    ctx.beginPath();
    ctx.moveTo(px, map.plotTop);
    ctx.lineTo(px, map.plotBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Small 'a' anchor pill on top of line
    ctx.font = `600 9px ${FONT_MONO}`;
    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const labelX = clamp(px + 3, map.plotLeft + 3, map.plotRight - 20);
    ctx.fillText(`a=${formatTickValue(this._preset.a)}`, labelX, map.plotTop + 3);
    ctx.restore();
  }

  _drawAmberSweepCursor(ctx, map, yVal, dotColor, compact = false) {
    const px = map.xToPx(this.b);
    const py = clamp(map.yToPx(yVal), map.plotTop, map.plotBottom);

    ctx.save();
    // Soft amber aura glow along sweep beam
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.24)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(px, map.plotTop);
    ctx.lineTo(px, map.plotBottom);
    ctx.stroke();

    // Crisp glowing Amber vertical sweep line
    ctx.strokeStyle = COLORS.amber;
    ctx.lineWidth = 1.75;
    ctx.shadowColor = COLORS.amberGlow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(px, map.plotTop);
    ctx.lineTo(px, map.plotBottom);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Small top sweep handle triangle
    ctx.fillStyle = COLORS.amber;
    ctx.beginPath();
    ctx.moveTo(px, map.plotTop + 6);
    ctx.lineTo(px - 4.5, map.plotTop);
    ctx.lineTo(px + 4.5, map.plotTop);
    ctx.closePath();
    ctx.fill();

    // Bottom axis cursor pill (b = ...)
    const tagTxt = this.mechatronicsLens
      ? `b=${fmtPlain(this.b, 2)}s`
      : `b=${fmtPlain(this.b, 2)}`;
    ctx.font = `600 ${compact ? 8.5 : 9.5}px ${FONT_MONO}`;
    const tagW = ctx.measureText(tagTxt).width + 8;
    const tagX = clamp(px - tagW / 2, map.plotLeft, map.plotRight - tagW);
    drawRoundedRect(ctx, tagX, map.plotBottom + 2, tagW, 15, 3.5);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.72)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.fillStyle = '#FEF3C7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagTxt, tagX + tagW / 2, map.plotBottom + 10);

    // Glowing point on active curve
    ctx.beginPath();
    ctx.arc(px, py, 8.5, 0, TWO_PI);
    ctx.fillStyle = dotColor + '38';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(px, py, 4.6, 0, TWO_PI);
    ctx.fillStyle = dotColor;
    ctx.fill();
    ctx.strokeStyle = '#0B0D12';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
  }

  _drawRatePanel(ctx, width, height, pulse, now) {
    const [xMin, xMax] = this._preset.domain;
    const [yMin, yMax] = this._bounds[0];
    const compact = width < 430;
    const pad = getStackedPad(width);
    const map = createPlotMapper(width, height, pad, xMin, xMax, yMin, yMax);

    drawEngineeringGrid(ctx, width, height, map, xMin, xMax, yMin, yMax, {
      showXLabels: true,
      showYLabels: true,
      xUnit: this.mechatronicsLens ? 's' : '',
      compact,
    });

    // Emerald (+) & Coral (−) signed area shading from fixed start a to draggable cursor b
    drawSignedAreaBetween(ctx, map, this._preset.f, this._preset.a, this.b, 220);

    // Subtle lobe labels (+Area / −Area)
    drawShadedLobeLabels(
      ctx,
      map,
      this._preset.f,
      this._zeroCrossings,
      this._preset.a,
      this.b,
      this.mechatronicsLens ? '+Δx' : '+Area',
      this.mechatronicsLens ? '−Δx' : '−Area'
    );

    // Anchor lower limit a
    this._drawAnchorLimitA(ctx, map);

    // Pulsing vertical dashed guides at f(x) = 0 extending down into Panel 2
    this._drawZeroCrossingGuides(ctx, map, pulse, now);

    // Glowing Cyan curve f(x)
    drawGlowingCurve(ctx, map, this._preset.f, xMin, xMax, COLORS.cyan, COLORS.cyanGlow, 2.5);

    // Pulsing Emerald beacon dots at zero crossings f(x) = 0
    const yZero = map.yToPx(0);
    for (const r of this._zeroCrossings) {
      const px = map.xToPx(r);
      if (px < map.plotLeft || px > map.plotRight) continue;
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, yZero, 5.5 + pulse * 3, 0, TWO_PI);
      ctx.strokeStyle = `rgba(52, 211, 153, ${(0.62 - pulse * 0.36).toFixed(2)})`;
      ctx.lineWidth = 1.25;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, yZero, 3.6, 0, TWO_PI);
      ctx.fillStyle = COLORS.emerald;
      ctx.fill();
      ctx.strokeStyle = '#0B0D12';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      if (!compact) {
        ctx.font = `600 8.5px ${FONT_MONO}`;
        ctx.fillStyle = 'rgba(167, 243, 208, 0.90)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(this.mechatronicsLens ? 'v=0' : 'f=0', px, Math.max(map.plotTop + 11, yZero - 9));
      }
      ctx.restore();
    }

    // Glowing Amber vertical sweep line at x = b
    const fb = this._preset.f(this.b);
    const Fb = this._preset.F(this.b);
    const cpx = map.xToPx(this.b);
    const cpy = map.yToPx(fb);
    this._drawAmberSweepCursor(ctx, map, fb, COLORS.cyan, compact);

    // Floating readout pill showing f(b) and net shaded area ∫_a^b f(t) dt
    const pillText = this.mechatronicsLens
      ? compact
        ? `v=${fmtSigned(fb)} · Δx=${fmtSigned(Fb)}`
        : `v(b)=${fmtSigned(fb)} · ∫v dt=${fmtSigned(Fb)} mm`
      : compact
      ? `f=${fmtSigned(fb)} · ∫=${fmtSigned(Fb)}`
      : `f(b)=${fmtSigned(fb)} · ∫f dt=${fmtSigned(Fb)}`;
    drawFloatingPill(
      ctx,
      map,
      cpx,
      clamp(cpy, map.plotTop + 14, map.plotBottom - 14),
      pillText,
      COLORS.amber,
      fb >= 0,
      compact
    );
  }

  _drawAccumulationPanel(ctx, width, height, pulse, now) {
    const [xMin, xMax] = this._preset.domain;
    const [yMin, yMax] = this._bounds[1];
    const compact = width < 430;
    const pad = getStackedPad(width);
    const map = createPlotMapper(width, height, pad, xMin, xMax, yMin, yMax);

    drawEngineeringGrid(ctx, width, height, map, xMin, xMax, yMin, yMax, {
      showXLabels: true,
      showYLabels: true,
      xUnit: this.mechatronicsLens ? 's' : '',
      compact,
    });

    // Anchor lower limit a where F(a) = 0
    this._drawAnchorLimitA(ctx, map);

    // Pulsing vertical dashed guides aligned 1-to-1 with f(x) = 0 in Panel 1
    this._drawZeroCrossingGuides(ctx, map, pulse, now);

    // Faint preview curve F(x) across full domain (beyond cursor b)
    drawGlowingCurve(
      ctx,
      map,
      this._preset.F,
      xMin,
      xMax,
      COLORS.violetPreview,
      null,
      1.75,
      200,
      [5, 4]
    );

    // Solid bright glowing Violet curve F(x) accumulated from a up to b
    drawGlowingCurve(
      ctx,
      map,
      this._preset.F,
      this._preset.a,
      this.b,
      COLORS.violet,
      COLORS.violetGlow,
      2.7,
      220
    );

    // Origin anchor dot at (a, F(a) = 0)
    const ax = map.xToPx(this._preset.a);
    const ay = map.yToPx(0);
    if (ax >= map.plotLeft - 2 && ax <= map.plotRight + 2 && ay >= map.plotTop && ay <= map.plotBottom) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(ax, ay, 3.2, 0, TWO_PI);
      ctx.fillStyle = '#E2E8F0';
      ctx.fill();
      ctx.strokeStyle = '#0B0D12';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }

    // Extremum beacon dots on F(x) aligned with zero crossings of f(x)
    for (const r of this._zeroCrossings) {
      const px = map.xToPx(r);
      const py = map.yToPx(this._preset.F(r));
      if (px < map.plotLeft || px > map.plotRight || py < map.plotTop || py > map.plotBottom) continue;

      const d2 = this._preset.df(r);
      const isMax = d2 < 0;
      const reached = (this.b - this._preset.a) * (r - this._preset.a) >= 0 && Math.abs(r - this._preset.a) <= Math.abs(this.b - this._preset.a) + 0.05;

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, 5.5 + pulse * 3, 0, TWO_PI);
      ctx.strokeStyle = `rgba(52, 211, 153, ${((reached ? 0.65 : 0.35) - pulse * 0.25).toFixed(2)})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, py, 3.6, 0, TWO_PI);
      ctx.fillStyle = reached ? COLORS.emerald : 'rgba(52, 211, 153, 0.55)';
      ctx.fill();
      ctx.strokeStyle = '#0B0D12';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      const tag = Math.abs(d2) < 0.05 ? 'flat' : isMax ? 'max' : 'min';
      ctx.font = `600 9px ${FONT_MONO}`;
      ctx.fillStyle = reached ? 'rgba(167, 243, 208, 0.95)' : 'rgba(167, 243, 208, 0.58)';
      ctx.textAlign = 'center';
      ctx.textBaseline = isMax ? 'bottom' : 'top';
      const labelY = isMax ? Math.max(map.plotTop + 11, py - 8) : Math.min(map.plotBottom - 11, py + 8);
      ctx.fillText(tag, px, labelY);
      ctx.restore();
    }

    // Glowing live tangent segment at (b, F(b)) with slope F'(b) = f(b)
    const fb = this._preset.f(this.b);
    const Fb = this._preset.F(this.b);
    const cpx = map.xToPx(this.b);
    const cpy = map.yToPx(Fb);

    const vx = map.scaleX;
    const vy = -fb * map.scaleY;
    const len = Math.hypot(vx, vy) || 1;
    const ux = vx / len;
    const uy = vy / len;
    const halfLen = compact ? 38 : 52;

    const fSpan = Math.max(1, this._bounds[0][1] - this._bounds[0][0]);
    const isFlat = Math.abs(fb) <= Math.max(0.06, fSpan * 0.025);
    const tangentColor = isFlat ? COLORS.cyan : fb > 0 ? COLORS.emerald : COLORS.coral;

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

    ctx.shadowBlur = 0;
    ctx.fillStyle = tangentColor;
    ctx.beginPath();
    ctx.arc(x1, y1, 2.3, 0, TWO_PI);
    ctx.arc(x2, y2, 2.3, 0, TWO_PI);
    ctx.fill();
    ctx.restore();

    // Glowing Amber vertical sweep line synchronized with Panel 1
    this._drawAmberSweepCursor(ctx, map, Fb, COLORS.violet, compact);

    // Floating slope readout pill proving F'(b) = f(b)
    const slopeText = this.mechatronicsLens
      ? compact
        ? `x'(b)=v(b)=${fmtSigned(fb)}`
        : `slope x'(b) = v(b) = ${fmtSigned(fb)} mm/s`
      : compact
      ? `F'(b)=f(b)=${fmtSigned(fb)}`
      : `slope F'(b) = f(b) = ${fmtSigned(fb)}`;
    drawFloatingPill(
      ctx,
      map,
      cpx,
      clamp(cpy, map.plotTop + 14, map.plotBottom - 14),
      slopeText,
      tangentColor,
      true,
      compact
    );
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
// PART 2: IntegralVisualQuizEngine ("Match the Accumulation / Antiderivative")
// ===========================================================================
const INTEGRAL_QUIZ_CHALLENGES = [
  {
    id: 'integral-quiz-constant-linear',
    badge: 'Constant Rate',
    title: 'Constant Velocity → Linear Displacement',
    domain: [0, 4],
    targetFormulaMath: 'f(x) = 1.5',
    targetFormulaMech: 'v(t) = 1.5\\text{ mm/s}',
    promptMath:
      'Given the constant rate $f(x) = 1.5$ on $[0, 4]$, which graph below represents its accumulation $F(x) = \\int_0^x f(t)\\,dt$?',
    promptMech:
      'An actuator cruises at constant velocity $v(t) = 1.5\\text{ mm/s}$ on $[0, 4]\\text{ s}$. Which graph below is its displacement $x(t) = \\int_0^t v(\\tau)\\,d\\tau$?',
    targetFn: () => 1.5,
    proofPoints: [
      { x: 2, label: 'const +1.5 → steady slope', isExtremum: false },
      { x: 3.98, label: 'Area = 6', isExtremum: false },
    ],
    proofTextMath:
      'A constant positive rate $f(x) = 1.5$ adds equal area ($+1.5$ per unit) at every step. Starting from $F(0) = 0$, the accumulated area grows along the straight ramp $F(x) = 1.5x$ with constant slope $+1.5$, reaching $6$ at $x = 4$.',
    proofTextMech:
      'Cruising at a steady $1.5\\text{ mm/s}$ advances displacement linearly: $x(t) = 1.5t$. Every second adds $+1.5\\text{ mm}$, giving a straight ramp from $0$ to $6\\text{ mm}$.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        formula: 'y = 1.5',
        fn: () => 1.5,
        wrongHintMath:
          'A flat line has zero slope — that is the original rate $f(x)$ itself, not its accumulated area! Because $f(x) = 1.5 > 0$, the total area $F(x)$ must steadily climb from $0$.',
        wrongHintMech:
          'This flat line says position never changes ($v = 0$), contradicting a constant $1.5\\text{ mm/s}$ cruising velocity. Displacement must rise steadily from $0$.',
      },
      {
        letter: 'B',
        isCorrect: true,
        formula: 'F(x) = 1.5x',
        fn: (x) => 1.5 * x,
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        formula: '6 - 0.375x^2',
        fn: (x) => 6 - 0.375 * x * x,
        wrongHintMath:
          'Check both the start and slope: $F(0) = \\int_0^0 f(t)\\,dt$ must begin at $0$, and since $f(x) > 0$, $F(x)$ must rise — not start at $6$ and fall downward.',
        wrongHintMech:
          'Displacement starts at $x(0) = 0$ and moves forward when velocity is positive, whereas this downward parabola starts at $6\\text{ mm}$ and retracts.',
      },
    ],
  },
  {
    id: 'integral-quiz-linear-parabola',
    badge: 'Growing Rate',
    title: 'Linear Acceleration → Parabolic Velocity',
    domain: [0, 3],
    targetFormulaMath: 'f(x) = x',
    targetFormulaMech: 'a(t) = t\\text{ mm/s}^2',
    promptMath:
      'Given the linear ramp $f(x) = x$ on $[0, 3]$, which graph below represents its accumulation $F(x) = \\int_0^x t\\,dt$?',
    promptMech:
      'Given a linear acceleration ramp $a(t) = t$ on $[0, 3]\\text{ s}$, which graph below is the resulting velocity $v(t) = \\int_0^t a(\\tau)\\,d\\tau$?',
    targetFn: (x) => x,
    proofPoints: [
      { x: 0.02, label: 'f=0 → flat start', isExtremum: false },
      { x: 2.98, label: 'Area = 4.5', isExtremum: false },
    ],
    proofTextMath:
      'Since $f(x) = x$ starts at $0$ and grows linearly, $F(x)$ begins with a flat tangent ($F\'(0) = 0$) and bends concave-up as area accumulates faster each step — forming the upward parabola $F(x) = \\frac{1}{2}x^2$ (triangle area $\\frac{1}{2}(3)(3) = 4.5$).',
    proofTextMech:
      'With linearly ramping acceleration $a(t) = t$, velocity starts smoothly from $0$ with zero initial slope and curves upward as $v(t) = \\frac{1}{2}t^2$, reaching $4.5\\text{ mm/s}$ at $t = 3\\text{ s}$.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        formula: 'F(x) = \\tfrac{1}{2}x^2',
        fn: (x) => 0.5 * x * x,
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        formula: 'y = 1',
        fn: () => 1,
        wrongHintMath:
          'Careful — $y = 1$ is the *derivative* $f\'(x)$ of $x$, not its integral! Integrating a growing positive ramp builds a rising parabola starting from $0$.',
        wrongHintMech:
          'That constant horizontal line is the *jerk* $da/dt = 1$ (the derivative), not the integral! Integrating growing acceleration produces a parabolic speed curve.',
      },
      {
        letter: 'C',
        isCorrect: false,
        formula: 'y = 1.5x',
        fn: (x) => 1.5 * x,
        wrongHintMath:
          'A straight ramp has a *constant* slope, which would require a flat constant integrand. Because $f(x) = x$ gets larger as $x$ increases, the slope of $F(x)$ must steepen (concave up).',
        wrongHintMech:
          'A straight velocity line means constant acceleration. Here acceleration $a(t) = t$ grows over time, so velocity must bend concave-up.',
      },
    ],
  },
  {
    id: 'integral-quiz-signed-cancel',
    badge: 'Signed Area',
    title: 'Signed Area Cancellation (Velocity Reversal)',
    domain: [0, 4],
    targetFormulaMath: 'f(x) = 2 - x',
    targetFormulaMech: 'v(t) = 2 - t\\text{ mm/s}',
    promptMath:
      'Given $f(x) = 2 - x$ on $[0, 4]$ (positive on $[0, 2]$, negative on $[2, 4]$), which graph is $F(x) = \\int_0^x (2 - t)\\,dt$?',
    promptMech:
      'An actuator slows to a stop at $t = 2\\text{ s}$ then reverses with $v(t) = 2 - t$ on $[0, 4]\\text{ s}$. Which graph is its net displacement $x(t)$?',
    targetFn: (x) => 2 - x,
    proofPoints: [
      { x: 2, label: 'f=0 → peak', isExtremum: true },
      { x: 3.98, label: 'net = 0', isExtremum: false },
    ],
    proofTextMath:
      'On $[0, 2]$, $f(x) > 0$ adds $+2$ units of Emerald area so $F(x)$ climbs to a peak at $x = 2$ (where $f(2) = 0$). On $[2, 4]$, the symmetric Coral lobe subtracts $-2$ units, returning $F(4) = 0$ along the arch $2x - \\frac{1}{2}x^2$.',
    proofTextMech:
      'Advancing forward for $2\\text{ s}$ reaches peak displacement $+2\\text{ mm}$ at $t = 2\\text{ s}$ ($v = 0$). Reversing symmetrically over $[2, 4]\\text{ s}$ cancels the gain, returning the actuator to $x(4) = 0$.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        formula: '1.8(1 - e^{-0.8x}) + 0.4x',
        fn: (x) => 1.8 * (1 - Math.exp(-0.8 * x)) + 0.4 * x,
        wrongHintMath:
          'Look at $[2, 4]$: $f(x) = 2 - x$ drops below zero, contributing *negative* signed area that pulls $F(x)$ back down. A monotonically rising curve ignores that cancellation.',
        wrongHintMech:
          'After $t = 2\\text{ s}$, velocity turns negative (retracting), so displacement must decrease back toward zero instead of climbing forever.',
      },
      {
        letter: 'B',
        isCorrect: false,
        formula: '\\tfrac{1}{2}x^2 - 2x',
        fn: (x) => 0.5 * x * x - 2 * x,
        wrongHintMath:
          'Check the sign on $[0, 2]$: $f(x) = 2 - x$ is *positive*, so accumulated area $F(x)$ must climb above zero first — not dip into negative territory.',
        wrongHintMech:
          'Velocity is positive during the first $2\\text{ s}$, so the actuator advances into positive displacement first rather than retracting negative.',
      },
      {
        letter: 'C',
        isCorrect: true,
        formula: 'F(x) = 2x - \\tfrac{1}{2}x^2',
        fn: (x) => 2 * x - 0.5 * x * x,
        wrongHintMath: '',
        wrongHintMech: '',
      },
    ],
  },
  {
    id: 'integral-quiz-cosine-sine',
    badge: 'Trig Phase',
    title: 'Cosine Rate → Sine Accumulation',
    domain: [0, TWO_PI],
    targetFormulaMath: 'f(x) = \\cos(x)',
    targetFormulaMech: 'v(t) = \\cos(t)\\text{ mm/s}',
    promptMath:
      'Given $f(x) = \\cos(x)$ on $[0, 2\\pi]$, which graph below represents $F(x) = \\int_0^x \\cos(t)\\,dt$?',
    promptMech:
      'Given harmonic velocity $v(t) = \\cos(t)$ on $[0, 2\\pi]\\text{ s}$, which graph below is the actuator displacement $x(t) = \\int_0^t \\cos(\\tau)\\,d\\tau$?',
    targetFn: (x) => Math.cos(x),
    proofPoints: [
      { x: Math.PI / 2, label: 'f=0 → max', isExtremum: true },
      { x: (3 * Math.PI) / 2, label: 'f=0 → min', isExtremum: true },
    ],
    proofTextMath:
      'Starting at $F(0) = 0$, positive area on $[0, \\pi/2]$ drives $F(x)$ up to a maximum at $x = \\pi/2$ (where $\\cos = 0$). Negative area on $[\\pi/2, 3\\pi/2]$ pulls it down to a minimum at $3\\pi/2$, tracing $F(x) = \\sin(x)$.',
    proofTextMech:
      'Launching at peak positive speed $v(0) = +1\\text{ mm/s}$, displacement climbs from $0$ to max extension at $t = \\pi/2$ ($v = 0$), reverses to min at $3\\pi/2$, and returns to $0$ — matching $x(t) = \\sin(t)$.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        formula: 'F(x) = \\sin(x)',
        fn: (x) => Math.sin(x),
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        formula: '-\\sin(x)',
        fn: (x) => -Math.sin(x),
        wrongHintMath:
          'Watch the direction! $-\\sin(x)$ is the *derivative* of $\\cos(x)$. Because $\\cos(x) > 0$ on $[0, \\pi/2]$, the integral must rise positive first, not drop below zero.',
        wrongHintMech:
          'You picked the *acceleration* $v\'(t) = -\\sin(t)$! Since velocity is positive on $[0, \\pi/2]$, displacement must move positive first.',
      },
      {
        letter: 'C',
        isCorrect: false,
        formula: '\\cos(x)',
        fn: (x) => Math.cos(x),
        wrongHintMath:
          'Remember $F(0) = \\int_0^0 \\cos(t)\\,dt = 0$. This curve starts at $+1$ and immediately drops even though $\\cos(x) > 0$ near $x = 0$.',
        wrongHintMech:
          'Displacement starts at $x(0) = 0$ and rises while $v(t) > 0$. This cosine starts at $+1$ and decreases right away.',
      },
    ],
  },
  {
    id: 'integral-quiz-exp-saturation',
    badge: 'Saturation',
    title: 'Exponential Decay → Saturation Curve',
    domain: [0, 5],
    targetFormulaMath: 'f(x) = 2e^{-0.8x}',
    targetFormulaMech: 'i(t) = 2e^{-0.8t}\\text{ A}',
    promptMath:
      'Given the decaying rate $f(x) = 2e^{-0.8x}$ on $[0, 5]$, which graph below represents the accumulated total $F(x) = \\int_0^x 2e^{-0.8t}\\,dt$?',
    promptMech:
      'A capacitor charges with decaying current $i(t) = 2e^{-0.8t}\\text{ A}$ on $[0, 5]\\text{ s}$. Which graph below shows accumulated charge $q(t) = \\int_0^t i(\\tau)\\,d\\tau$?',
    targetFn: (x) => 2 * Math.exp(-0.8 * x),
    proofPoints: [
      { x: 0.04, label: 'steepest +2', isExtremum: false },
      { x: 4.3, label: 'saturates → 2.5', isExtremum: false },
    ],
    proofTextMath:
      'Because $f(x) = 2e^{-0.8x}$ stays strictly positive while fading toward $0$, $F(x)$ starts at $0$ with steepest slope $+2$ and climbs ever more gently (concave down) toward its horizontal asymptote $2.5$: $F(x) = 2.5(1 - e^{-0.8x})$.',
    proofTextMech:
      'Positive charging current keeps adding charge even as it decays toward zero, so total charge $q(t) = 2.5(1 - e^{-0.8t})\\text{ C}$ rises concave-down and saturates smoothly at $2.5\\text{ C}$.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        formula: '2.4e^{-0.7x}',
        fn: (x) => 2.4 * Math.exp(-0.7 * x),
        wrongHintMath:
          'Even though $f(x)$ decays toward zero, it stays *positive* everywhere — so accumulated area $F(x)$ can only grow and can never decrease back to zero.',
        wrongHintMech:
          'Positive current only adds charge to the capacitor; total charge cannot drop to zero unless current reverses negative.',
      },
      {
        letter: 'B',
        isCorrect: true,
        formula: 'F(x) = 2.5(1 - e^{-0.8x})',
        fn: (x) => 2.5 * (1 - Math.exp(-0.8 * x)),
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        formula: '0.25(e^{0.52x} - 1)',
        fn: (x) => 0.25 * (Math.exp(0.52 * x) - 1),
        wrongHintMath:
          'This concave-up curve gets steeper over time, which would require a *growing* rate. Because $f(x) = 2e^{-0.8x}$ shrinks toward $0$, the slope of $F(x)$ must flatten out (concave down).',
        wrongHintMech:
          'As charging current drops toward zero, the charge rate must flatten out — not explode exponentially steeper.',
      },
    ],
  },
  {
    id: 'integral-quiz-sine-netzero',
    badge: 'Net Zero',
    title: 'Full-Cycle Odd Wave → Net Zero Signed Area',
    domain: [0, TWO_PI],
    targetFormulaMath: 'f(x) = \\sin(x)',
    targetFormulaMech: 'v(t) = \\sin(t)\\text{ mm/s}',
    promptMath:
      'Given the full sine cycle $f(x) = \\sin(x)$ on $[0, 2\\pi]$, which graph below is $F(x) = \\int_0^x \\sin(t)\\,dt$?',
    promptMech:
      'An actuator executes one full velocity cycle $v(t) = \\sin(t)$ on $[0, 2\\pi]\\text{ s}$. Which graph below is its net displacement $x(t) = \\int_0^t \\sin(\\tau)\\,d\\tau$?',
    targetFn: (x) => Math.sin(x),
    proofPoints: [
      { x: Math.PI, label: 'f=0 → peak 2', isExtremum: true },
      { x: TWO_PI - 0.02, label: 'net = 0', isExtremum: false },
    ],
    proofTextMath:
      'On $[0, \\pi]$, positive sine area accumulates from $0$ up to peak $F(\\pi) = 2$ (where $\\sin(\\pi) = 0$). On $[\\pi, 2\\pi]$, the equal negative lobe cancels it completely back to $F(2\\pi) = 0$, giving $F(x) = 1 - \\cos(x)$.',
    proofTextMech:
      'Forward motion on $[0, \\pi]$ carries the actuator from $0$ to $+2\\text{ mm}$ at $t = \\pi$ ($v = 0$); the symmetric reverse stroke on $[\\pi, 2\\pi]$ returns it cleanly to $0$ via $x(t) = 1 - \\cos(t)$.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        formula: '\\cos(x)',
        fn: (x) => Math.cos(x),
        wrongHintMath:
          'Check $x = 0$: $F(0) = \\int_0^0 \\sin(t)\\,dt$ must start at $0$, not $+1$. Worse, $\\cos(x)$ falls on $[0, \\pi]$ even though $\\sin(x) > 0$ adds positive area there!',
        wrongHintMech:
          'Displacement begins at $x(0) = 0$ and increases while velocity is positive on $[0, \\pi]$, whereas $\\cos(t)$ starts at $+1$ and immediately decreases.',
      },
      {
        letter: 'B',
        isCorrect: false,
        formula: '\\tfrac{x}{\\pi} + 0.32\\sin(x)',
        fn: (x) => x / Math.PI + 0.32 * Math.sin(x),
        wrongHintMath:
          'On $[\\pi, 2\\pi]$, $\\sin(x) < 0$ contributes *negative* signed area that cancels the positive lobe from $[0, \\pi]$. A curve that keeps climbing adds unsigned area instead of signed area.',
        wrongHintMech:
          'During the second half-cycle $[\\pi, 2\\pi]$, velocity is negative (retracting), so net displacement must drop back to $0$ rather than continuing to climb.',
      },
      {
        letter: 'C',
        isCorrect: true,
        formula: 'F(x) = 1 - \\cos(x)',
        fn: (x) => 1 - Math.cos(x),
        wrongHintMath: '',
        wrongHintMech: '',
      },
    ],
  },
];

export class IntegralVisualQuizEngine {
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

    this._challenges = INTEGRAL_QUIZ_CHALLENGES;
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
      <span class="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider bg-violet-500/15 border border-violet-400/35 text-violet-300">
        Match the Integral
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
        'el-ig-pill w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[11px] sm:text-xs font-mono font-semibold flex items-center justify-center border cursor-pointer ' +
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

    // --- 2. Compact Prompt & Target Rate Canvas ---
    const body = document.createElement('div');
    body.className = 'p-2.5 sm:p-4 flex flex-col gap-2.5 sm:gap-4';

    const promptBox = document.createElement('div');
    promptBox.className = 'flex flex-col gap-1.5 sm:gap-2';

    const promptText = document.createElement('p');
    promptText.className = 'text-xs sm:text-[15px] leading-snug sm:leading-relaxed text-slate-200';
    promptText.innerHTML = formatInlineMath(this.mechatronicsLens ? ch.promptMech : ch.promptMath);
    promptBox.appendChild(promptText);

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
        ${this.mechatronicsLens ? 'Given Rate Signal' : 'Given Rate f(x)'}
      </span>
      <span class="text-[11px] sm:text-xs text-slate-200">${formatKatex(targetFormula, false)}</span>
    `;
    targetFrame.appendChild(targetTopBar);

    const targetCanvasWrap = document.createElement('div');
    targetCanvasWrap.className = 'relative w-full h-[126px] sm:h-[192px]';

    const targetCanvas = document.createElement('canvas');
    targetCanvas.className = 'el-ig-canvas h-full';
    targetCanvasWrap.appendChild(targetCanvas);
    targetFrame.appendChild(targetCanvasWrap);

    this._targetCanvas = targetCanvas;
    this._targetCtx = targetCanvas.getContext('2d');
    this._targetWrap = targetCanvasWrap;

    promptBox.appendChild(targetFrame);
    body.appendChild(promptBox);

    // --- 3. 3-Column Side-by-Side Candidate Grid (Even on Mobile!) ---
    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'grid grid-cols-3 gap-1.5 sm:gap-3';

    ch.options.forEach((opt) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className =
        'el-ivq-card text-left rounded-xl border border-slate-800/90 bg-[#0F131C]/80 overflow-hidden flex flex-col focus:outline-none focus:ring-2 focus:ring-cyan-400/50';

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
          <span class="hidden sm:inline text-xs font-medium text-slate-300">F(x) Option ${opt.letter}</span>
        </span>
        ${rightBadge}
      `;
      card.appendChild(cardHeader);

      const canvasWrap = document.createElement('div');
      canvasWrap.className = 'relative w-full bg-[#0B0D12] h-[86px] sm:h-[136px]';

      const canvas = document.createElement('canvas');
      canvas.className = 'el-ig-canvas h-full';
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

    // --- 4. Feedback Banner (Signed-Area Proof OR Targeted Misconception Hint) ---
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
      'rounded-xl border border-emerald-400/45 bg-emerald-500/10 p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3';

    const left = document.createElement('div');
    left.className = 'flex flex-col gap-1';
    left.innerHTML = `
      <div class="flex items-center gap-2 text-xs font-semibold text-emerald-300">
        <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-400/20 border border-emerald-400/60 text-[10px]">✓</span>
        Signed Area Proof Unlocked — Accumulation Matches Rate
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
      'el-ig-pill px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-400/60 text-emerald-100 cursor-pointer whitespace-nowrap';

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
    box.className = 'rounded-xl border border-rose-400/40 bg-rose-500/10 p-2.5 sm:p-3 flex items-start gap-2.5';
    box.innerHTML = `
      <span class="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-rose-400/20 border border-rose-400/60 text-rose-300 text-xs font-bold flex items-center justify-center">!</span>
      <div class="text-xs sm:text-[13px] leading-relaxed text-rose-100/95">
        <span class="font-semibold text-rose-300">Not Option ${escapeHtml(wrongSelection.letter)}:</span>
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
      if (!canvas || !wrap) return { w: 0, h: 86 };
      const r = wrap.getBoundingClientRect();
      if (r.width < 20 || r.height < 20) return { w: 0, h: 86 };
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

    // --- Target Rate Canvas f(x) ---
    if (this._targetCtx && this._targetSize && this._targetSize.w >= 20) {
      const { w, h } = this._targetSize;
      const ctx = this._targetCtx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const [yMin, yMax] = computeYBounds(ch.targetFn, xMin, xMax, true);
      const compact = w < 430;
      const targetPad = compact ? { left: 34, right: 12, top: 16, bottom: 20 } : QUIZ_TARGET_PAD;
      const map = createPlotMapper(w, h, targetPad, xMin, xMax, yMin, yMax);

      drawEngineeringGrid(ctx, w, h, map, xMin, xMax, yMin, yMax, {
        showXLabels: true,
        showYLabels: true,
        xUnit: this.mechatronicsLens ? 's' : '',
        compact,
      });

      if (solved) {
        // Glowing Emerald (+) & Coral (−) signed area proof shading on target rate graph!
        drawSignedAreaBetween(ctx, map, ch.targetFn, xMin, xMax, 200);
        const roots = findRoots(ch.targetFn, xMin, xMax);
        drawShadedLobeLabels(ctx, map, ch.targetFn, roots, xMin, xMax, '+Area', '−Area');
        this._drawTargetProofGuides(ctx, map, ch, pulse);
      }

      drawGlowingCurve(ctx, map, ch.targetFn, xMin, xMax, COLORS.cyan, COLORS.cyanGlow, 2.6, 220);

      if (solved) {
        this._drawTargetProofBeacons(ctx, map, ch, pulse);
      }
    }

    // --- Candidate Accumulation Option Canvases F(x) ---
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
        this._drawOptionProofGuides(ctx, map, ch, pulse);
      }

      const strokeColor = isSolvedCorrect ? COLORS.emerald : COLORS.violet;
      const glowColor = isSolvedCorrect ? 'rgba(52, 211, 153, 0.45)' : COLORS.violetGlow;
      drawGlowingCurve(ctx, map, opt.fn, xMin, xMax, strokeColor, glowColor, 2.25, 180);

      if (isSolvedCorrect) {
        this._drawOptionProofBeacons(ctx, map, ch, opt.fn, pulse, isNarrow);
      }
    });
  }

  _drawTargetProofGuides(ctx, map, ch, pulse) {
    ctx.save();
    for (const pt of ch.proofPoints) {
      const px = Math.round(map.xToPx(pt.x)) + 0.5;
      if (px < map.plotLeft || px > map.plotRight) continue;
      ctx.strokeStyle = `rgba(52, 211, 153, ${(0.40 + 0.36 * pulse).toFixed(2)})`;
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
      const py = clamp(map.yToPx(ch.targetFn(pt.x)), map.plotTop + 6, map.plotBottom - 6);
      if (px < map.plotLeft - 2 || px > map.plotRight + 2) continue;

      ctx.beginPath();
      ctx.arc(px, py, 5.5 + pulse * 3, 0, TWO_PI);
      ctx.strokeStyle = `rgba(52, 211, 153, ${(0.68 - pulse * 0.35).toFixed(2)})`;
      ctx.lineWidth = 1.25;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, py, 3.6, 0, TWO_PI);
      ctx.fillStyle = COLORS.emerald;
      ctx.fill();
      ctx.strokeStyle = '#0B0D12';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      ctx.font = `600 9px ${FONT_MONO}`;
      const tw = ctx.measureText(pt.label).width + 10;
      const pillX = clamp(px - tw / 2, map.plotLeft + 4, map.plotRight - tw - 4);
      const above = py > map.plotTop + 26;
      const pillY = above ? py - 23 : py + 9;

      drawRoundedRect(ctx, pillX, pillY, tw, 16, 4);
      ctx.fillStyle = 'rgba(11, 13, 18, 0.88)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.62)';
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
      if (px < map.plotLeft || px > map.plotRight) continue;
      ctx.strokeStyle = `rgba(52, 211, 153, ${(0.42 + 0.36 * pulse).toFixed(2)})`;
      ctx.lineWidth = 1.3;
      ctx.setLineDash([3.5, 3.5]);
      ctx.beginPath();
      ctx.moveTo(px, map.plotTop);
      ctx.lineTo(px, map.plotBottom);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  _drawOptionProofBeacons(ctx, map, ch, optFn, pulse, isNarrow) {
    ctx.save();
    for (const pt of ch.proofPoints) {
      const px = map.xToPx(pt.x);
      const py = clamp(map.yToPx(optFn(pt.x)), map.plotTop + 4, map.plotBottom - 4);
      if (px < map.plotLeft - 2 || px > map.plotRight + 2) continue;

      // Horizontal tangent indicator at peaks/valleys of F(x)
      if (pt.isExtremum) {
        const half = isNarrow ? 11 : 18;
        ctx.strokeStyle = COLORS.amberLight;
        ctx.lineWidth = 1.9;
        ctx.shadowColor = COLORS.amberGlow;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(clamp(px - half, map.plotLeft, map.plotRight), py);
        ctx.lineTo(clamp(px + half, map.plotLeft, map.plotRight), py);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.arc(px, py, (isNarrow ? 4.2 : 5.2) + pulse * 2.4, 0, TWO_PI);
      ctx.strokeStyle = `rgba(52, 211, 153, ${(0.72 - pulse * 0.35).toFixed(2)})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, py, isNarrow ? 3.0 : 3.5, 0, TWO_PI);
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
    this._targetWrap = null;
    this._optionCanvases = [];
    this._optionCtxs = [];
    this._optionCards = [];
    this._root = null;
  }
}
