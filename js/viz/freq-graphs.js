/**
 * EIGENLAB — Interactive Root Locus ↔ Bode Magnitude/Phase Lab & Visual Quiz Engine
 *
 * Exports:
 *   - RootBodeLab          : Synchronized 2-panel high-DPI HTML5 canvas lab linking
 *                            closed-loop pole migration along the complex s-Plane Root Locus
 *                            directly to the coupled Bode Magnitude (dB) & Phase (deg)
 *                            dual-overlay plot with live Gain Margin (GM) and Phase Margin (PM)
 *                            calipers, Loop Gain K slider, 5 classic control topologies,
 *                            and Mechatronics Lens relabeling.
 *   - FreqVisualQuizEngine : Brilliant.org-style 6-challenge visual intuition quiz covering
 *                            real-axis Root Locus rules, Lead-zero stabilization, Phase Margin
 *                            interpretation, resonant peaking vs. damping ζ, Lead vs. Lag
 *                            phase signatures, and negative Gain Margin instability.
 */

import { store, sound, renderKatex, renderInlineMathText } from '../store.js';

// ---------------------------------------------------------------------------
// Palette & Visual Constants (EIGENLAB Dark Engineering Studio)
// ---------------------------------------------------------------------------
const COLORS = {
  bg: '#0B0D12',
  bgPanel: '#0F131C',
  gridMinor: 'rgba(148, 163, 184, 0.065)',
  gridMajor: 'rgba(148, 163, 184, 0.12)',
  axis: 'rgba(148, 163, 184, 0.36)',
  axisLabel: 'rgba(148, 163, 184, 0.68)',
  cyan: '#22D3EE',
  cyanGlow: 'rgba(34, 211, 238, 0.45)',
  violet: '#A78BFA',
  violetGlow: 'rgba(167, 139, 250, 0.44)',
  amber: '#F59E0B',
  amberLight: '#FCD34D',
  amberGlow: 'rgba(245, 158, 11, 0.48)',
  emerald: '#34D399',
  emeraldGlow: 'rgba(52, 211, 153, 0.48)',
  emeraldLhpNear: 'rgba(52, 211, 153, 0.04)',
  emeraldLhpFar: 'rgba(52, 211, 153, 0.105)',
  coral: '#FB7185',
  coralGlow: 'rgba(251, 113, 133, 0.5)',
  coralRhpNear: 'rgba(251, 113, 133, 0.055)',
  coralRhpFar: 'rgba(251, 113, 133, 0.155)',
  pillBg: 'rgba(11, 13, 18, 0.92)',
  pillBorder: 'rgba(148, 163, 184, 0.28)',
};

const TWO_PI = Math.PI * 2;
const RAD_TO_DEG = 180 / Math.PI;
const FONT_MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const FONT_SANS = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';

const BODE_W_MIN = 0.1;
const BODE_W_MAX = 20.0;
const BODE_DB_MIN = -42;
const BODE_DB_MAX = 42;
const BODE_DEG_MIN = -270;
const BODE_DEG_MAX = 0;

function getSPlanePad(width) {
  if (width < 430) {
    return { left: 34, right: 12, top: 14, bottom: 20 };
  }
  return { left: 44, right: 18, top: 16, bottom: 22 };
}

function getBodePad(width) {
  if (width < 430) {
    return { left: 36, right: 34, top: 14, bottom: 20 };
  }
  return { left: 44, right: 42, top: 16, bottom: 22 };
}

// ---------------------------------------------------------------------------
// Scoped Component Styles (injected once into <head>)
// ---------------------------------------------------------------------------
function injectStylesOnce() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('eigenlab-freq-graphs-styles')) return;

  const style = document.createElement('style');
  style.id = 'eigenlab-freq-graphs-styles';
  style.textContent = `
    @keyframes eigenlabFreqShakeGentle {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(5px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(3px); }
    }
    .shake-gentle {
      animation: eigenlabFreqShakeGentle 0.42s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .el-fr-canvas {
      display: block;
      width: 100%;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }
    .el-fr-pill {
      transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease, transform 120ms ease;
    }
    .el-fr-pill:active {
      transform: scale(0.97);
    }
    .el-fr-slider {
      -webkit-appearance: none;
      appearance: none;
      height: 5px;
      border-radius: 9999px;
      background: linear-gradient(90deg, rgba(52, 211, 153, 0.45), rgba(34, 211, 238, 0.55), rgba(251, 113, 133, 0.55));
      outline: none;
      cursor: pointer;
    }
    .el-fr-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 9999px;
      background: #F8FAFC;
      border: 2px solid #22D3EE;
      box-shadow: 0 0 10px rgba(34, 211, 238, 0.65);
      cursor: pointer;
      transition: transform 120ms ease, box-shadow 120ms ease;
    }
    .el-fr-slider::-webkit-slider-thumb:active {
      transform: scale(1.14);
      box-shadow: 0 0 14px rgba(52, 211, 153, 0.85);
    }
    .el-fr-slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 9999px;
      background: #F8FAFC;
      border: 2px solid #22D3EE;
      box-shadow: 0 0 10px rgba(34, 211, 238, 0.65);
      cursor: pointer;
    }
    .el-fvq-card {
      transition: border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease, transform 160ms ease;
      cursor: pointer;
    }
    .el-fvq-card:hover:not([data-locked="true"]) {
      transform: translateY(-2px);
      border-color: rgba(34, 211, 238, 0.55);
      box-shadow: 0 10px 30px -12px rgba(34, 211, 238, 0.25);
    }
    .el-fvq-card[data-state="correct"] {
      border-color: rgba(52, 211, 153, 0.85) !important;
      background: linear-gradient(180deg, rgba(52, 211, 153, 0.12), rgba(15, 19, 28, 0.92)) !important;
      box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.35), 0 12px 32px -12px rgba(52, 211, 153, 0.35) !important;
    }
    .el-fvq-card[data-state="wrong"] {
      border-color: rgba(251, 113, 133, 0.72) !important;
      background: linear-gradient(180deg, rgba(251, 113, 133, 0.09), rgba(15, 19, 28, 0.92)) !important;
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Safe Store, Sound, Math & Formatting Helpers
// ---------------------------------------------------------------------------
function safeSound(method, ...args) {
  try {
    if (sound && typeof sound[method] === 'function') {
      sound[method](...args);
    }
  } catch (_) {
    // Audio playback is optional
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
    // Fall through
  }
  try {
    if (typeof renderKatex === 'function' && typeof document !== 'undefined') {
      const span = document.createElement('span');
      renderKatex(span, tex, Boolean(displayMode));
      if (span.innerHTML) return span.innerHTML;
    }
  } catch (_) {
    // Fall back
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
    // Fall back
  }
  return text.replace(/\$([^$]+)\$/g, (_, expr) => formatKatex(expr, false));
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function fmtPlain(val, decimals = 2) {
  if (!Number.isFinite(val)) return '∞';
  const cleaned = Math.abs(val) < 0.004 ? 0 : val;
  return cleaned.toFixed(decimals);
}

function fmtSigned(val, decimals = 1) {
  if (!Number.isFinite(val)) return '+∞';
  const cleaned = Math.abs(val) < 0.004 ? 0 : val;
  const sign = cleaned > 0 ? '+' : '';
  return `${sign}${cleaned.toFixed(decimals)}`;
}

// ---------------------------------------------------------------------------
// Complex Polynomial, Root-Locus Solver & Bode Frequency Analysis Engine
// ---------------------------------------------------------------------------

/**
 * Adds D(s) + K * N(s) for descending-power real polynomials.
 */
function charPolyCoeffs(num, den, K) {
  const n = Math.max(num.length, den.length);
  const out = new Array(n).fill(0);
  const denOff = n - den.length;
  const numOff = n - num.length;
  for (let i = 0; i < den.length; i++) out[denOff + i] += den[i];
  for (let i = 0; i < num.length; i++) out[numOff + i] += K * num[i];
  // Trim leading near-zeros
  let first = 0;
  while (first < out.length - 1 && Math.abs(out[first]) < 1e-12) first++;
  return out.slice(first);
}

function polyEvalComplex(coeffs, re, im) {
  let pr = coeffs[0];
  let pi = 0;
  for (let i = 1; i < coeffs.length; i++) {
    const nr = pr * re - pi * im + coeffs[i];
    const ni = pr * im + pi * re;
    pr = nr;
    pi = ni;
  }
  return { re: pr, im: pi };
}

/**
 * Finds all complex roots of a real polynomial with descending coefficients
 * using exact degree 1/2 formulas and Durand-Kerner for degree >= 3.
 */
function solvePolyRoots(rawCoeffs) {
  if (!rawCoeffs || rawCoeffs.length <= 1) return [];
  const lead = rawCoeffs[0];
  if (Math.abs(lead) < 1e-14) return solvePolyRoots(rawCoeffs.slice(1));
  const c = rawCoeffs.map((v) => v / lead);
  const deg = c.length - 1;

  if (deg === 1) {
    return [{ re: -c[1], im: 0 }];
  }
  if (deg === 2) {
    const b = c[1];
    const d = c[2];
    const disc = b * b - 4 * d;
    if (disc >= 0) {
      const sd = Math.sqrt(disc);
      return [
        { re: (-b + sd) / 2, im: 0 },
        { re: (-b - sd) / 2, im: 0 },
      ];
    }
    const sd = Math.sqrt(-disc);
    return [
      { re: -b / 2, im: sd / 2 },
      { re: -b / 2, im: -sd / 2 },
    ];
  }

  // Cauchy radius bound for deterministic asymmetric Durand-Kerner initialization
  let maxCoeff = 0;
  for (let i = 1; i <= deg; i++) {
    maxCoeff = Math.max(maxCoeff, Math.abs(c[i]));
  }
  const radius = Math.max(0.5, 1 + maxCoeff);
  const roots = [];
  for (let k = 0; k < deg; k++) {
    const ang = (TWO_PI * k) / deg + 0.317;
    roots.push({
      re: radius * Math.cos(ang),
      im: radius * Math.sin(ang),
    });
  }

  for (let iter = 0; iter < 90; iter++) {
    let maxStep = 0;
    for (let i = 0; i < deg; i++) {
      const ri = roots[i];
      const pv = polyEvalComplex(c, ri.re, ri.im);
      let dr = 1;
      let di = 0;
      for (let j = 0; j < deg; j++) {
        if (i === j) continue;
        const diffR = ri.re - roots[j].re;
        const diffI = ri.im - roots[j].im;
        const nr = dr * diffR - di * diffI;
        const ni = dr * diffI + di * diffR;
        dr = nr;
        di = ni;
      }
      const denom = dr * dr + di * di;
      if (denom < 1e-24) continue;
      const stepR = (pv.re * dr + pv.im * di) / denom;
      const stepI = (pv.im * dr - pv.re * di) / denom;
      ri.re -= stepR;
      ri.im -= stepI;
      maxStep = Math.max(maxStep, Math.hypot(stepR, stepI));
    }
    if (maxStep < 1e-11) break;
  }

  // Clean tiny imaginary numerical dust
  return roots.map((r) => ({
    re: Math.abs(r.re) < 1e-9 ? 0 : r.re,
    im: Math.abs(r.im) < 1e-6 ? 0 : r.im,
  }));
}

/**
 * Optimal minimum-distance permutation matching between consecutive root sets (n <= 4).
 */
function matchRootsToPrevious(prevRoots, nextRoots) {
  const n = prevRoots.length;
  if (n !== nextRoots.length || n === 0) return nextRoots;
  if (n === 1) return [nextRoots[0]];

  // Generate permutations for small n (n <= 4 => <= 24 permutations)
  const indices = Array.from({ length: n }, (_, i) => i);
  let bestPerm = indices.slice();
  let bestCost = Infinity;

  const permute = (arr, start) => {
    if (start === n) {
      let cost = 0;
      for (let i = 0; i < n; i++) {
        const a = prevRoots[i];
        const b = nextRoots[arr[i]];
        cost += Math.hypot(a.re - b.re, a.im - b.im);
      }
      if (cost < bestCost) {
        bestCost = cost;
        bestPerm = arr.slice();
      }
      return;
    }
    for (let i = start; i < n; i++) {
      [arr[start], arr[i]] = [arr[i], arr[start]];
      permute(arr, start + 1);
      [arr[start], arr[i]] = [arr[i], arr[start]];
    }
  };

  permute(indices, 0);
  return bestPerm.map((idx) => nextRoots[idx]);
}

/**
 * Evaluates open-loop L(jω) = K * N(jω) / D(jω):
 * returns exact magnitude, dB, and continuous unwrapped phase in degrees.
 */
function evalOpenLoopFreq(topology, K, w) {
  const nv = polyEvalComplex(topology.num, 0, w);
  const dv = polyEvalComplex(topology.den, 0, w);
  const nMag = Math.hypot(nv.re, nv.im);
  const dMag = Math.hypot(dv.re, dv.im);
  const mag = dMag > 1e-12 ? (K * nMag) / dMag : 1e12;
  const db = 20 * Math.log10(Math.max(mag, 1e-12));

  // Exact wrap-free phase from factored open-loop zeros & poles
  let phaseRad = 0;
  for (const z of topology.zeros) {
    // Factor (jω - z) = (-z.re) + j(ω - z.im)
    phaseRad += Math.atan2(w - z.im, -z.re);
  }
  for (const p of topology.poles) {
    if (Math.abs(p.re) < 1e-9 && Math.abs(p.im) < 1e-9) {
      // Pure integrator 1/(jω) => exact -90°
      phaseRad -= Math.PI / 2;
    } else if (Math.abs(p.im) < 1e-9) {
      // Real pole at p.re < 0 => (jω - p.re) = |p.re| + jω
      phaseRad -= Math.atan2(w, -p.re);
    } else if (p.im > 0) {
      // Complex conjugate pole pair: (s - p)(s - p*) = s^2 - 2*re*s + (re^2 + im^2)
      const wn2 = p.re * p.re + p.im * p.im;
      const twoZetaWn = -2 * p.re;
      phaseRad -= Math.atan2(twoZetaWn * w, wn2 - w * w);
    }
  }

  return {
    mag,
    db,
    phaseDeg: phaseRad * RAD_TO_DEG,
  };
}

/**
 * Computes closed-loop poles, gain/phase crossovers, PM, GM, and stability status.
 */
function analyzeClosedLoop(topology, K) {
  const charCoeffs = charPolyCoeffs(topology.num, topology.den, K);
  const poles = solvePolyRoots(charCoeffs);
  const maxSigma = poles.length > 0 ? Math.max(...poles.map((p) => p.re)) : -1;
  const stability = maxSigma < -0.015 ? 'stable' : maxSigma > 0.015 ? 'unstable' : 'marginal';

  // Find dominant pole (largest real part, preferring upper-half-plane if complex pair)
  let dominantPole = poles[0] || { re: 0, im: 0 };
  for (const p of poles) {
    if (
      p.re > dominantPole.re + 1e-4 ||
      (Math.abs(p.re - dominantPole.re) <= 1e-4 && p.im > dominantPole.im)
    ) {
      dominantPole = p;
    }
  }

  // Fine log-frequency scan for gain crossover ω_gc (|L|=0 dB) and phase crossover ω_pc (∠L=-180°)
  const wScanMin = 0.008;
  const wScanMax = 120;
  const steps = 420;
  const logMin = Math.log10(wScanMin);
  const logMax = Math.log10(wScanMax);

  let wgc = null;
  let wpc = null;
  let prevW = wScanMin;
  let prev = evalOpenLoopFreq(topology, K, prevW);

  for (let i = 1; i <= steps; i++) {
    const w = Math.pow(10, logMin + ((logMax - logMin) * i) / steps);
    const cur = evalOpenLoopFreq(topology, K, w);

    // Downward 0 dB crossing (take the highest-frequency crossing for resonant systems)
    if ((prev.db >= 0 && cur.db <= 0) || (prev.db <= 0 && cur.db >= 0)) {
      let lo = prevW;
      let hi = w;
      let loVal = prev.db;
      for (let b = 0; b < 24; b++) {
        const mid = 0.5 * (lo + hi);
        const mv = evalOpenLoopFreq(topology, K, mid).db;
        if ((loVal >= 0 && mv >= 0) || (loVal <= 0 && mv <= 0)) {
          lo = mid;
          loVal = mv;
        } else {
          hi = mid;
        }
      }
      const cand = 0.5 * (lo + hi);
      if (prev.db >= cur.db || wgc === null) {
        wgc = cand;
      }
    }

    // -180° phase crossing
    if ((prev.phaseDeg >= -180 && cur.phaseDeg <= -180) || (prev.phaseDeg <= -180 && cur.phaseDeg >= -180)) {
      let lo = prevW;
      let hi = w;
      let loVal = prev.phaseDeg + 180;
      for (let b = 0; b < 24; b++) {
        const mid = 0.5 * (lo + hi);
        const mv = evalOpenLoopFreq(topology, K, mid).phaseDeg + 180;
        if ((loVal >= 0 && mv >= 0) || (loVal <= 0 && mv <= 0)) {
          lo = mid;
          loVal = mv;
        } else {
          hi = mid;
        }
      }
      wpc = 0.5 * (lo + hi);
    }

    prevW = w;
    prev = cur;
  }

  let pmDeg = null;
  let phaseAtWgc = null;
  if (wgc !== null) {
    phaseAtWgc = evalOpenLoopFreq(topology, K, wgc).phaseDeg;
    pmDeg = 180 + phaseAtWgc;
  }

  let gmDb = Infinity;
  let magDbAtWpc = null;
  if (wpc !== null) {
    magDbAtWpc = evalOpenLoopFreq(topology, K, wpc).db;
    gmDb = -magDbAtWpc;
  }

  return {
    K,
    poles,
    dominantPole,
    maxSigma,
    stability,
    wgc,
    phaseAtWgc,
    pmDeg,
    wpc,
    magDbAtWpc,
    gmDb,
  };
}

/**
 * Precomputes smooth continuous Root Locus branches + asymptote geometry for a topology.
 */
function buildRootLocusTrace(topology) {
  const n = topology.poles.length;
  const m = topology.zeros.length;
  const relDeg = n - m;

  let centroid = null;
  const asymptoteAngles = [];
  if (relDeg >= 1) {
    const sumP = topology.poles.reduce((acc, p) => acc + p.re, 0);
    const sumZ = topology.zeros.reduce((acc, z) => acc + z.re, 0);
    centroid = (sumP - sumZ) / relDeg;
    for (let k = 0; k < relDeg; k++) {
      asymptoteAngles.push(((2 * k + 1) * Math.PI) / relDeg);
    }
  }

  // Dense K sampling: very fine near K=0 and breakaways, extending past kMax so curves reach frame edges
  const kSamples = [0];
  const kPeak = Math.max(topology.kTraceMax || topology.kMax * 3.5, 20);
  const numLog = 180;
  for (let i = 0; i <= numLog; i++) {
    const t = i / numLog;
    const kv = 0.002 * Math.pow(kPeak / 0.002, t);
    kSamples.push(kv);
  }
  // Extra dense samples inside slider range for silky interactive dragging
  const numLin = 70;
  for (let i = 1; i <= numLin; i++) {
    kSamples.push(topology.kMin + ((topology.kMax - topology.kMin) * i) / numLin);
  }
  kSamples.sort((a, b) => a - b);

  // Deduplicate close K values
  const uniqueK = [];
  for (const kv of kSamples) {
    if (uniqueK.length === 0 || kv - uniqueK[uniqueK.length - 1] > 1e-5) {
      uniqueK.push(kv);
    }
  }

  const branches = Array.from({ length: n }, () => []);
  let prevRoots = topology.poles.map((p) => ({ re: p.re, im: p.im }));
  for (let b = 0; b < n; b++) {
    branches[b].push({ re: prevRoots[b].re, im: prevRoots[b].im, K: 0 });
  }

  for (let idx = 1; idx < uniqueK.length; idx++) {
    const kv = uniqueK[idx];
    const raw = solvePolyRoots(charPolyCoeffs(topology.num, topology.den, kv));
    const matched = matchRootsToPrevious(prevRoots, raw);
    for (let b = 0; b < n; b++) {
      if (matched[b]) {
        branches[b].push({ re: matched[b].re, im: matched[b].im, K: kv });
      }
    }
    prevRoots = matched;
  }

  return {
    relDeg,
    centroid,
    asymptoteAngles,
    branches,
  };
}

// ---------------------------------------------------------------------------
// 5 Classic Frequency / Root-Locus Topologies for RootBodeLab
// ---------------------------------------------------------------------------
const LAB_PRESETS = [
  {
    key: '3-pole-locus',
    label: '3-Pole Locus',
    num: [1],
    den: [1, 3, 2, 0], // s(s+1)(s+2)
    poles: [
      { re: 0, im: 0 },
      { re: -1, im: 0 },
      { re: -2, im: 0 },
    ],
    zeros: [],
    kMin: 0.1,
    kMax: 12.0,
    kDefault: 1.5,
    kUltimate: 6.0,
    kTraceMax: 30,
    sBounds: { sigmaMin: -3.6, sigmaMax: 1.4, omegaMin: -3.6, omegaMax: 3.6 },
    formulaTex: 'L(s) = \\frac{K}{s(s+1)(s+2)}',
    insightMath: '3 poles ⇒ ±60° asymptotes cross jω at Kᵤ = 6 (ω_pc = √2)',
    insightMech: '3-lag servo goes unstable above Kᵤ = 6 when phase hits −180°',
  },
  {
    key: 'lead-zero',
    label: 'Lead Zero',
    num: [1, 1.5], // (s + 1.5)
    den: [1, 4.5, 2, 0], // s(s+0.5)(s+4)
    poles: [
      { re: 0, im: 0 },
      { re: -0.5, im: 0 },
      { re: -4.0, im: 0 },
    ],
    zeros: [{ re: -1.5, im: 0 }],
    kMin: 0.15,
    kMax: 18.0,
    kDefault: 3.2,
    kUltimate: null,
    kTraceMax: 45,
    sBounds: { sigmaMin: -4.6, sigmaMax: 1.0, omegaMin: -4.2, omegaMax: 4.2 },
    formulaTex: 'L(s) = \\frac{K(s+1.5)}{s(s+0.5)(s+4)}',
    insightMath: 'LHP zero bends locus safely left (σₐ = −1.5) & lifts Phase Margin!',
    insightMech: 'PD/Lead zero injects positive phase near crossover for robust tracking',
  },
  {
    key: '2-pole-servo',
    label: '2-Pole Servo',
    num: [1],
    den: [1, 2, 0], // s(s+2)
    poles: [
      { re: 0, im: 0 },
      { re: -2, im: 0 },
    ],
    zeros: [],
    kMin: 0.2,
    kMax: 24.0,
    kDefault: 4.0,
    kUltimate: null,
    kTraceMax: 50,
    sBounds: { sigmaMin: -3.2, sigmaMax: 1.0, omegaMin: -4.8, omegaMax: 4.8 },
    formulaTex: 'L(s) = \\frac{K}{s(s+2)}',
    insightMath: 'Always LHP stable (GM = ∞), but PM shrinks as K drives ω_gc up',
    insightMech: 'DC motor servo never blows up, yet high gain shrinks PM → heavy ringing',
  },
  {
    key: 'resonant-plant',
    label: 'Resonant Plant',
    num: [5.76],
    den: [1, 1.2, 5.76], // ω_n = 2.4, ζ = 0.25
    poles: [
      { re: -0.6, im: Math.sqrt(5.4) },
      { re: -0.6, im: -Math.sqrt(5.4) },
    ],
    zeros: [],
    kMin: 0.15,
    kMax: 10.0,
    kDefault: 1.2,
    kUltimate: null,
    kTraceMax: 25,
    sBounds: { sigmaMin: -3.0, sigmaMax: 1.0, omegaMin: -6.2, omegaMax: 6.2 },
    formulaTex: 'L(s) = \\frac{5.76K}{s^2 + 1.2s + 5.76}',
    insightMath: 'Light damping (ζ = 0.25) spikes Bode peak +6.3 dB near ω_n = 2.4',
    insightMech: 'Flexible robot arm resonance amplifies disturbances right at ω_r',
  },
  {
    key: 'lag-boost',
    label: 'Lag Boost',
    num: [1, 0.4], // (s + 0.4)
    den: [1, 2.05, 0.1, 0], // s(s+0.05)(s+2)
    poles: [
      { re: 0, im: 0 },
      { re: -0.05, im: 0 },
      { re: -2.0, im: 0 },
    ],
    zeros: [{ re: -0.4, im: 0 }],
    kMin: 0.1,
    kMax: 16.0,
    kDefault: 2.4,
    kUltimate: null,
    kTraceMax: 40,
    sBounds: { sigmaMin: -3.2, sigmaMax: 1.0, omegaMin: -4.2, omegaMax: 4.2 },
    formulaTex: 'L(s) = K\\frac{s+0.4}{s+0.05}\\frac{1}{s(s+2)}',
    insightMath: 'Low-freq dipole boosts DC gain +18 dB while preserving high-freq PM!',
    insightMech: 'Lag compensator crushes steady-state error without destabilizing crossover',
  },
];

// Precompute Root Locus traces once for instant switching
const PRESET_TRACES = new Map();
for (const preset of LAB_PRESETS) {
  PRESET_TRACES.set(preset.key, buildRootLocusTrace(preset));
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

function createLogBodeMapper(width, height, pad, wMin, wMax, dbMin, dbMax, degMin, degMax) {
  const plotLeft = pad.left;
  const plotRight = Math.max(plotLeft + 10, width - pad.right);
  const plotTop = pad.top;
  const plotBottom = Math.max(plotTop + 10, height - pad.bottom);
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;
  const logMin = Math.log10(wMin);
  const logMax = Math.log10(wMax);
  const logSpan = logMax - logMin;

  return {
    plotLeft,
    plotRight,
    plotTop,
    plotBottom,
    plotW,
    plotH,
    wMin,
    wMax,
    dbMin,
    dbMax,
    degMin,
    degMax,
    wToPx: (w) => plotLeft + ((Math.log10(Math.max(w, 1e-6)) - logMin) / logSpan) * plotW,
    pxToW: (px) => Math.pow(10, logMin + ((px - plotLeft) / plotW) * logSpan),
    dbToPx: (db) => plotBottom - ((db - dbMin) / (dbMax - dbMin)) * plotH,
    pxToDb: (py) => dbMin + ((plotBottom - py) / plotH) * (dbMax - dbMin),
    degToPx: (deg) => plotBottom - ((deg - degMin) / (degMax - degMin)) * plotH,
  };
}

function drawSPlaneBackdrop(ctx, width, height, map, bounds, opts = {}) {
  const { compact = false, showLabels = true, showRegionBadges = true } = opts;
  const { sigmaMin, sigmaMax, omegaMin, omegaMax } = bounds;

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);

  const x0 = map.xToPx(0);
  const y0 = map.yToPx(0);

  // Translucent LHP (Emerald) and RHP (Coral) fills
  const lhpW = Math.max(0, Math.min(x0, map.plotRight) - map.plotLeft);
  if (lhpW > 1) {
    const grad = ctx.createLinearGradient(map.plotLeft, 0, map.plotLeft + lhpW, 0);
    grad.addColorStop(0, COLORS.emeraldLhpFar);
    grad.addColorStop(1, COLORS.emeraldLhpNear);
    ctx.fillStyle = grad;
    ctx.fillRect(map.plotLeft, map.plotTop, lhpW, map.plotH);
  }

  const rhpLeft = Math.max(map.plotLeft, x0);
  const rhpW = Math.max(0, map.plotRight - rhpLeft);
  if (rhpW > 1) {
    const grad = ctx.createLinearGradient(rhpLeft, 0, map.plotRight, 0);
    grad.addColorStop(0, COLORS.coralRhpNear);
    grad.addColorStop(1, COLORS.coralRhpFar);
    ctx.fillStyle = grad;
    ctx.fillRect(rhpLeft, map.plotTop, rhpW, map.plotH);
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
  ctx.clip();

  // Cartesian σ & jω minor grid
  ctx.lineWidth = 1;
  ctx.strokeStyle = COLORS.gridMinor;
  for (let s = Math.ceil(sigmaMin); s <= Math.floor(sigmaMax); s += 1) {
    if (s === 0) continue;
    const px = Math.round(map.xToPx(s)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(px, map.plotTop);
    ctx.lineTo(px, map.plotBottom);
    ctx.stroke();
  }
  const wStep = omegaMax - omegaMin > 9 ? 3 : 2;
  for (let w = Math.ceil(omegaMin / wStep) * wStep; w <= omegaMax; w += wStep) {
    if (Math.abs(w) < 1e-5) continue;
    const py = Math.round(map.yToPx(w)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(map.plotLeft, py);
    ctx.lineTo(map.plotRight, py);
    ctx.stroke();
  }

  // Real axis (ω = 0)
  const y0Snap = Math.round(y0) + 0.5;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.42)';
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(map.plotLeft, y0Snap);
  ctx.lineTo(map.plotRight, y0Snap);
  ctx.stroke();

  // Glowing Amber imaginary axis (σ = 0 — stability boundary)
  const x0Snap = Math.round(x0) + 0.5;
  ctx.save();
  ctx.strokeStyle = COLORS.amber;
  ctx.lineWidth = 1.85;
  ctx.shadowColor = COLORS.amberGlow;
  ctx.shadowBlur = 9;
  ctx.beginPath();
  ctx.moveTo(x0Snap, map.plotTop);
  ctx.lineTo(x0Snap, map.plotBottom);
  ctx.stroke();
  ctx.restore();

  if (showRegionBadges) {
    ctx.font = `700 ${compact ? 8 : 9.5}px ${FONT_MONO}`;
    ctx.textBaseline = 'top';
    if (lhpW > 46) {
      ctx.fillStyle = 'rgba(52, 211, 153, 0.72)';
      ctx.textAlign = 'left';
      ctx.fillText(lhpW > 76 ? 'STABLE LHP' : 'LHP', map.plotLeft + 6, map.plotTop + 5);
    }
    if (rhpW > 30) {
      ctx.fillStyle = 'rgba(251, 113, 133, 0.8)';
      ctx.textAlign = 'right';
      ctx.fillText(rhpW > 82 ? 'UNSTABLE RHP' : 'RHP', map.plotRight - 5, map.plotTop + 5);
    }
  }

  ctx.restore();

  if (showLabels) {
    ctx.font = `500 ${compact ? 8.5 : 9.5}px ${FONT_MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let s = Math.ceil(sigmaMin); s <= Math.floor(sigmaMax); s += 1) {
      const px = map.xToPx(s);
      if (px < map.plotLeft - 2 || px > map.plotRight + 2) continue;
      ctx.fillStyle = s === 0 ? COLORS.amberLight : COLORS.axisLabel;
      ctx.fillText(s > 0 ? `+${s}` : String(s), px, map.plotBottom + 4);
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let w = Math.ceil(omegaMin / wStep) * wStep; w <= omegaMax; w += wStep) {
      const py = map.yToPx(w);
      if (py < map.plotTop - 2 || py > map.plotBottom + 2) continue;
      ctx.fillStyle = Math.abs(w) < 1e-5 ? 'rgba(203, 213, 225, 0.85)' : COLORS.axisLabel;
      ctx.fillText(Math.abs(w) < 1e-5 ? '0' : `${w > 0 ? '+' : ''}${w}j`, map.plotLeft - 5, py);
    }
  }

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
  ctx.lineWidth = 1;
  ctx.strokeRect(map.plotLeft + 0.5, map.plotTop + 0.5, map.plotW - 1, map.plotH - 1);
}

function drawOpenLoopPoleX(ctx, px, py, size = 5.5, color = COLORS.cyan, glow = COLORS.cyanGlow) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(px - size, py - size);
  ctx.lineTo(px + size, py + size);
  ctx.moveTo(px + size, py - size);
  ctx.lineTo(px - size, py + size);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#E0F2FE';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(px - size * 0.72, py - size * 0.72);
  ctx.lineTo(px + size * 0.72, py + size * 0.72);
  ctx.moveTo(px + size * 0.72, py - size * 0.72);
  ctx.lineTo(px - size * 0.72, py + size * 0.72);
  ctx.stroke();
  ctx.restore();
}

function drawOpenLoopZeroO(ctx, px, py, radius = 5.5, color = COLORS.amberLight, glow = COLORS.amberGlow) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, TWO_PI);
  ctx.fillStyle = COLORS.bg;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 9;
  ctx.stroke();
  ctx.restore();
}

function drawClosedLoopPoleDot(ctx, px, py, pulse, color, glow, compact = false) {
  const r = compact ? 4.2 : 5.0;
  ctx.save();

  // Pulsing outer ring
  ctx.beginPath();
  ctx.arc(px, py, r + 3.5 + pulse * 3.5, 0, TWO_PI);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.28 + 0.35 * (1 - pulse);
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Glowing body
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(px, py, r, 0, TWO_PI);
  ctx.fillStyle = color;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 12;
  ctx.fill();

  // Crisp bright center core
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(px, py, r * 0.42, 0, TWO_PI);
  ctx.fillStyle = '#F8FAFC';
  ctx.fill();
  ctx.restore();
}

function drawCompactBadge(ctx, x, y, text, borderColor, textColor, compact = false) {
  ctx.save();
  ctx.font = `600 ${compact ? 8.5 : 9.5}px ${FONT_MONO}`;
  const tw = ctx.measureText(text).width + (compact ? 10 : 12);
  const bh = compact ? 15 : 17;
  drawRoundedRect(ctx, x, y, tw, bh, 4);
  ctx.fillStyle = COLORS.pillBg;
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + tw / 2, y + bh / 2 + 0.5);
  ctx.restore();
}

function drawRootLocusCurves(ctx, map, trace, opts = {}) {
  const { lineWidth = 2.2, showAsymptotes = true, compact = false } = opts;
  ctx.save();
  ctx.beginPath();
  ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
  ctx.clip();

  // Dashed asymptotes & centroid σₐ
  if (showAsymptotes && trace.centroid !== null && trace.asymptoteAngles.length > 0) {
    const cx = map.xToPx(trace.centroid);
    const cy = map.yToPx(0);
    const span = 18;
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.34)';
    ctx.lineWidth = 1.1;
    ctx.setLineDash([4, 4]);
    for (const ang of trace.asymptoteAngles) {
      const ex = map.xToPx(trace.centroid + span * Math.cos(ang));
      const ey = map.yToPx(span * Math.sin(ang));
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Small Amber diamond at centroid σₐ
    if (cx >= map.plotLeft + 4 && cx <= map.plotRight - 4) {
      const d = compact ? 3.2 : 4;
      ctx.fillStyle = COLORS.amberLight;
      ctx.beginPath();
      ctx.moveTo(cx, cy - d);
      ctx.lineTo(cx + d, cy);
      ctx.lineTo(cx, cy + d);
      ctx.lineTo(cx - d, cy);
      ctx.closePath();
      ctx.fill();

      if (!compact) {
        ctx.font = `600 8.5px ${FONT_MONO}`;
        ctx.fillStyle = 'rgba(252, 211, 77, 0.8)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`σₐ=${fmtPlain(trace.centroid, 1)}`, cx, cy + 7);
      }
    }
    ctx.restore();
  }

  // Glowing Emerald Root Locus branches (turning Coral glow inside RHP)
  for (const branch of trace.branches) {
    if (branch.length < 2) continue;

    // Pass 1: LHP segments in glowing Emerald
    ctx.save();
    ctx.strokeStyle = COLORS.emerald;
    ctx.shadowColor = COLORS.emeraldGlow;
    ctx.shadowBlur = 9;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    let drawing = false;
    for (let i = 0; i < branch.length; i++) {
      const pt = branch[i];
      if (pt.re > 0.02) {
        drawing = false;
        continue;
      }
      const px = map.xToPx(pt.re);
      const py = map.yToPx(pt.im);
      if (!drawing) {
        ctx.moveTo(px, py);
        drawing = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();

    // Pass 2: RHP segments in glowing Coral
    ctx.save();
    ctx.strokeStyle = COLORS.coral;
    ctx.shadowColor = COLORS.coralGlow;
    ctx.shadowBlur = 9;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    drawing = false;
    for (let i = 0; i < branch.length; i++) {
      const pt = branch[i];
      if (pt.re < -0.02) {
        drawing = false;
        continue;
      }
      const px = map.xToPx(pt.re);
      const py = map.yToPx(pt.im);
      if (!drawing) {
        ctx.moveTo(px, py);
        drawing = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawBodeDualPlot(ctx, width, height, map, topology, K, analysis, opts = {}) {
  const { compact = false, pulse = 0.5, showCalipers = true, showRightLabels = true, showLeftLabels = true, showXLabels = true } = opts;

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);

  // Subtle vertical background depth gradient
  const bgGrad = ctx.createLinearGradient(0, map.plotTop, 0, map.plotBottom);
  bgGrad.addColorStop(0, 'rgba(30, 41, 59, 0.22)');
  bgGrad.addColorStop(1, 'rgba(11, 13, 18, 0.0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(map.plotLeft, map.plotTop, map.plotW, map.plotH);

  // Subtle Coral danger band below -180° phase stability floor
  const y180 = map.degToPx(-180);
  if (y180 < map.plotBottom) {
    ctx.fillStyle = 'rgba(251, 113, 133, 0.065)';
    ctx.fillRect(map.plotLeft, y180, map.plotW, map.plotBottom - y180);
  }

  // Log-frequency vertical grid lines
  const decades = [0.1, 1, 10];
  const minorMults = [2, 3, 4, 5, 6, 7, 8, 9];
  ctx.lineWidth = 1;
  for (const dec of decades) {
    if (dec >= map.wMin && dec <= map.wMax) {
      const px = Math.round(map.wToPx(dec)) + 0.5;
      ctx.strokeStyle = COLORS.gridMajor;
      ctx.beginPath();
      ctx.moveTo(px, map.plotTop);
      ctx.lineTo(px, map.plotBottom);
      ctx.stroke();
    }
    for (const m of minorMults) {
      const w = dec * m;
      if (w < map.wMin || w > map.wMax) continue;
      const px = Math.round(map.wToPx(w)) + 0.5;
      ctx.strokeStyle = COLORS.gridMinor;
      ctx.beginPath();
      ctx.moveTo(px, map.plotTop);
      ctx.lineTo(px, map.plotBottom);
      ctx.stroke();
    }
  }

  // Horizontal magnitude grid lines (every 20 dB)
  const dbTicks = [-40, -20, 0, 20, 40];
  for (const db of dbTicks) {
    if (db < map.dbMin || db > map.dbMax) continue;
    const py = Math.round(map.dbToPx(db)) + 0.5;
    ctx.strokeStyle = db === 0 ? 'rgba(34, 211, 238, 0.45)' : COLORS.gridMinor;
    ctx.lineWidth = db === 0 ? 1.25 : 1;
    if (db === 0) ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(map.plotLeft, py);
    ctx.lineTo(map.plotRight, py);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Glowing -180° phase stability floor
  const y180Snap = Math.round(y180) + 0.5;
  ctx.save();
  ctx.strokeStyle = 'rgba(251, 113, 133, 0.72)';
  ctx.shadowColor = COLORS.coralGlow;
  ctx.shadowBlur = 7;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(map.plotLeft, y180Snap);
  ctx.lineTo(map.plotRight, y180Snap);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Plot curves clipped to plot box
  ctx.save();
  ctx.beginPath();
  ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
  ctx.clip();

  const samples = 220;
  const logMin = Math.log10(map.wMin);
  const logMax = Math.log10(map.wMax);
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const w = Math.pow(10, logMin + ((logMax - logMin) * i) / samples);
    const ev = evalOpenLoopFreq(topology, K, w);
    pts.push({
      px: map.wToPx(w),
      pyDb: map.dbToPx(ev.db),
      pyDeg: map.degToPx(ev.phaseDeg),
    });
  }

  // 1. Dashed Violet Phase Curve ∠L(jω)
  ctx.save();
  ctx.strokeStyle = COLORS.violet;
  ctx.shadowColor = COLORS.violetGlow;
  ctx.shadowBlur = 7;
  ctx.lineWidth = compact ? 1.7 : 2.0;
  ctx.setLineDash([5, 3.5]);
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) ctx.moveTo(pts[i].px, pts[i].pyDeg);
    else ctx.lineTo(pts[i].px, pts[i].pyDeg);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 2. Solid Glowing Cyan Magnitude Curve |L(jω)|_dB
  ctx.save();
  ctx.strokeStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyanGlow;
  ctx.shadowBlur = 10;
  ctx.lineWidth = compact ? 2.2 : 2.55;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) ctx.moveTo(pts[i].px, pts[i].pyDb);
    else ctx.lineTo(pts[i].px, pts[i].pyDb);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = '#CFFAFE';
  ctx.stroke();
  ctx.restore();

  // 3. Glowing Phase Margin (PM) & Gain Margin (GM) Calipers!
  if (showCalipers && analysis) {
    // Phase Margin Caliper at ω_gc
    if (analysis.wgc !== null && analysis.wgc >= map.wMin && analysis.wgc <= map.wMax && analysis.pmDeg !== null) {
      const pxGc = map.wToPx(analysis.wgc);
      const py0dB = map.dbToPx(0);
      const pyPhase = clamp(map.degToPx(analysis.phaseAtWgc), map.plotTop + 2, map.plotBottom - 2);
      const pmColor = analysis.pmDeg > 3 ? COLORS.emerald : analysis.pmDeg < -3 ? COLORS.coral : COLORS.amberLight;
      const pmGlow = analysis.pmDeg > 3 ? COLORS.emeraldGlow : analysis.pmDeg < -3 ? COLORS.coralGlow : COLORS.amberGlow;

      // Vertical dotted drop from 0 dB crossing down to phase curve
      ctx.save();
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
      ctx.lineWidth = 1.1;
      ctx.setLineDash([2.5, 2.5]);
      ctx.beginPath();
      ctx.moveTo(pxGc, py0dB);
      ctx.lineTo(pxGc, pyPhase);
      ctx.stroke();
      ctx.setLineDash([]);

      // Bold glowing PM caliper bracket between -180° and ∠L(jω_gc)
      ctx.strokeStyle = pmColor;
      ctx.shadowColor = pmGlow;
      ctx.shadowBlur = 9 + pulse * 4;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(pxGc, y180);
      ctx.lineTo(pxGc, pyPhase);
      // Caliper end ticks
      ctx.moveTo(pxGc - 4.5, y180);
      ctx.lineTo(pxGc + 4.5, y180);
      ctx.moveTo(pxGc - 4.5, pyPhase);
      ctx.lineTo(pxGc + 4.5, pyPhase);
      ctx.stroke();

      // Crossover dots
      ctx.shadowBlur = 0;
      ctx.fillStyle = COLORS.cyan;
      ctx.beginPath();
      ctx.arc(pxGc, py0dB, 3.6, 0, TWO_PI);
      ctx.fill();
      ctx.fillStyle = pmColor;
      ctx.beginPath();
      ctx.arc(pxGc, pyPhase, 3.4, 0, TWO_PI);
      ctx.fill();
      ctx.restore();

      const pmTxt = `PM ${fmtSigned(analysis.pmDeg, 0)}°`;
      const lx = clamp(pxGc + 7, map.plotLeft + 4, map.plotRight - (compact ? 56 : 66));
      const ly = clamp(0.5 * (y180 + pyPhase) - 8, map.plotTop + 4, map.plotBottom - 19);
      drawCompactBadge(ctx, lx, ly, pmTxt, pmColor, pmColor, compact);
    }

    // Gain Margin Caliper at ω_pc
    if (
      analysis.wpc !== null &&
      analysis.wpc >= map.wMin &&
      analysis.wpc <= map.wMax &&
      Number.isFinite(analysis.gmDb)
    ) {
      const pxPc = map.wToPx(analysis.wpc);
      const py0dB = map.dbToPx(0);
      const pyMag = clamp(map.dbToPx(analysis.magDbAtWpc), map.plotTop + 2, map.plotBottom - 2);
      const gmColor = analysis.gmDb > 0.5 ? COLORS.amberLight : analysis.gmDb < -0.5 ? COLORS.coral : COLORS.amber;
      const gmGlow = analysis.gmDb > 0.5 ? COLORS.amberGlow : COLORS.coralGlow;

      // Dotted guide from -180° crossing up to magnitude curve
      ctx.save();
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.36)';
      ctx.lineWidth = 1.1;
      ctx.setLineDash([2.5, 2.5]);
      ctx.beginPath();
      ctx.moveTo(pxPc, y180);
      ctx.lineTo(pxPc, pyMag);
      ctx.stroke();
      ctx.setLineDash([]);

      // Bold glowing GM caliper bracket between |L(jω_pc)|_dB and 0 dB
      ctx.strokeStyle = gmColor;
      ctx.shadowColor = gmGlow;
      ctx.shadowBlur = 9 + pulse * 4;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(pxPc, py0dB);
      ctx.lineTo(pxPc, pyMag);
      ctx.moveTo(pxPc - 4.5, py0dB);
      ctx.lineTo(pxPc + 4.5, py0dB);
      ctx.moveTo(pxPc - 4.5, pyMag);
      ctx.lineTo(pxPc + 4.5, pyMag);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = COLORS.violet;
      ctx.beginPath();
      ctx.arc(pxPc, y180, 3.4, 0, TWO_PI);
      ctx.fill();
      ctx.fillStyle = gmColor;
      ctx.beginPath();
      ctx.arc(pxPc, pyMag, 3.4, 0, TWO_PI);
      ctx.fill();
      ctx.restore();

      const gmTxt = `GM ${fmtSigned(analysis.gmDb, 1)}dB`;
      const pillW = compact ? 64 : 74;
      let gx = pxPc + 7;
      if (gx + pillW > map.plotRight - 4) gx = pxPc - pillW - 7;
      gx = clamp(gx, map.plotLeft + 4, map.plotRight - pillW - 4);
      const gy = clamp(Math.min(py0dB, pyMag) - 18, map.plotTop + 4, map.plotBottom - 19);
      drawCompactBadge(ctx, gx, gy, gmTxt, gmColor, gmColor, compact);
    }
  }

  ctx.restore();

  // Axis labels
  ctx.font = `500 ${compact ? 8.5 : 9.5}px ${FONT_MONO}`;
  if (showXLabels) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xTicks = [0.1, 1, 10, 20];
    for (const wt of xTicks) {
      if (wt < map.wMin || wt > map.wMax) continue;
      const px = map.wToPx(wt);
      ctx.fillStyle = COLORS.axisLabel;
      ctx.fillText(wt === 20 ? '20' : String(wt), px, map.plotBottom + 4);
    }
  }

  if (showLeftLabels) {
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const db of [-40, -20, 0, 20, 40]) {
      if (db < map.dbMin || db > map.dbMax) continue;
      const py = map.dbToPx(db);
      ctx.fillStyle = db === 0 ? COLORS.cyan : 'rgba(34, 211, 238, 0.65)';
      ctx.fillText(db === 0 ? '0dB' : `${db > 0 ? '+' : ''}${db}`, map.plotLeft - 4, py);
    }
  }

  if (showRightLabels) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (const deg of [0, -90, -180, -270]) {
      if (deg < map.degMin || deg > map.degMax) continue;
      const py = map.degToPx(deg);
      ctx.fillStyle = deg === -180 ? COLORS.coral : 'rgba(167, 139, 250, 0.72)';
      ctx.fillText(`${deg}°`, map.plotRight + 4, py);
    }
  }

  // Frame border
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
  ctx.lineWidth = 1;
  ctx.strokeRect(map.plotLeft + 0.5, map.plotTop + 0.5, map.plotW - 1, map.plotH - 1);
}

// ===========================================================================
// PART 1: RootBodeLab (2-Panel Synchronized Root Locus ↔ Bode Lab)
// ===========================================================================
export class RootBodeLab {
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
      initialPreset = LAB_PRESETS[0].key,
      onInteract = null,
      onOpenQuiz = null,
    } = options;

    this.mechatronicsLens = Boolean(mechatronicsLens);
    this.onInteract = typeof onInteract === 'function' ? onInteract : null;
    this.onOpenQuiz = typeof onOpenQuiz === 'function' ? onOpenQuiz : null;

    this._preset = LAB_PRESETS.find((p) => p.key === initialPreset) || LAB_PRESETS[0];
    this.gainK = this._preset.kDefault;
    this._analysis = analyzeClosedLoop(this._preset, this.gainK);

    this._hasInteracted = false;
    this._isDraggingPanel = -1;
    this._activePointerId = null;
    this._dragStartY = 0;
    this._dragStartK = this.gainK;

    this._container = null;
    this._root = null;
    this._canvases = [];
    this._ctxs = [];
    this._sizes = [
      { w: 0, h: 130 },
      { w: 0, h: 132 },
    ];
    this._panelMetaEls = [];
    this._presetButtons = new Map();
    this._telemetryEls = {};
    this._sliderEl = null;
    this._sliderValEl = null;

    this._resizeObserver = null;
    this._abortController = null;
    this._rafId = null;
    this._pulsePhase = 0;
    this._lastFrameTs = 0;
    this._lastTickMs = 0;
    this._disposed = false;

    if (autoMountContainer) {
      this.mount(autoMountContainer);
    }
  }

  static get PRESETS() {
    return LAB_PRESETS;
  }

  getPresets() {
    return LAB_PRESETS;
  }

  getAnalysis() {
    return this._analysis;
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

    // --- 1. Compact Mobile-First Top Control & Live Telemetry Strip ---
    const topBar = document.createElement('div');
    topBar.className =
      'px-2.5 py-2 sm:px-3.5 sm:py-2.5 border-b border-slate-800/80 bg-[#0F131C]/90 flex flex-col gap-1.5 sm:gap-2';

    // Row 1: 5 Scrollable Topology Preset Pills
    const pillRow = document.createElement('div');
    pillRow.className =
      'flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap sm:flex-wrap pb-0.5 sm:pb-0';
    this._presetButtons.clear();

    for (const preset of LAB_PRESETS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.presetKey = preset.key;
      btn.className =
        'el-fr-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer';
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
      pillRow.appendChild(btn);
      this._presetButtons.set(preset.key, btn);
    }

    // Row 2: Live Telemetry Pill Strip (K, PM, GM, ω_gc, Stability)
    const telemetryRow = document.createElement('div');
    telemetryRow.className =
      'flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap sm:flex-wrap';

    const makePill = (extra) => {
      const el = document.createElement('span');
      el.className = `shrink-0 whitespace-nowrap px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border ${extra}`;
      return el;
    };

    const kPill = makePill('bg-cyan-500/10 border-cyan-400/45 text-cyan-200');
    const pmPill = makePill('bg-emerald-500/10 border-emerald-400/45 text-emerald-200');
    const gmPill = makePill('bg-amber-500/10 border-amber-400/45 text-amber-200');
    const wgcPill = makePill('bg-violet-500/10 border-violet-400/45 text-violet-200');
    const stabPill = makePill('font-bold tracking-wide');

    telemetryRow.append(kPill, pmPill, gmPill, wgcPill, stabPill);

    // Row 3: Compact Integrated Loop Gain K Slider
    const sliderRow = document.createElement('div');
    sliderRow.className = 'flex items-center gap-2 sm:gap-3';

    const sliderLabel = document.createElement('label');
    sliderLabel.className =
      'shrink-0 text-[10px] sm:text-[11px] font-mono font-semibold text-slate-300 uppercase tracking-wide';
    sliderLabel.textContent = 'Loop Gain K';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'el-fr-slider flex-1 min-w-0';
    slider.min = '0';
    slider.max = '1000';
    slider.step = '1';
    slider.setAttribute('aria-label', 'Loop Gain K');
    this._sliderEl = slider;

    const sliderVal = document.createElement('span');
    sliderVal.className =
      'shrink-0 min-w-[54px] text-right text-[11px] font-mono font-bold text-cyan-200 bg-slate-900/90 border border-slate-800 px-1.5 py-0.5 rounded-md';
    this._sliderValEl = sliderVal;

    slider.addEventListener(
      'input',
      () => {
        const nextK = this._sliderPosToK(Number(slider.value));
        this._applyGain(nextK, true);
      },
      { signal }
    );

    sliderRow.append(sliderLabel, slider, sliderVal);

    // Row 4 (Desktop/tablet only): Live KaTeX transfer function + insight
    const desktopRow = document.createElement('div');
    desktopRow.className = 'hidden sm:flex flex-wrap items-center justify-between gap-2 text-xs';

    const formulaEl = document.createElement('div');
    formulaEl.className = 'text-cyan-200/95 font-medium flex items-center gap-2';

    const insightEl = document.createElement('div');
    insightEl.className = 'text-[11px] text-slate-400 truncate';

    desktopRow.append(formulaEl, insightEl);

    this._telemetryEls = {
      kPill,
      pmPill,
      gmPill,
      wgcPill,
      stabPill,
      formulaEl,
      insightEl,
    };

    topBar.append(pillRow, telemetryRow, sliderRow, desktopRow);
    root.appendChild(topBar);

    // --- 2. Synchronized 2-Panel Canvas Stack ---
    const stackWrap = document.createElement('div');
    stackWrap.className = 'divide-y divide-slate-800/80 bg-[#0B0D12]';
    stackWrap.tabIndex = 0;
    stackWrap.setAttribute(
      'aria-label',
      'Interactive Root Locus and coupled Bode magnitude and phase lab; drag canvases or use arrow keys to adjust loop gain K'
    );

    const panelDots = [COLORS.emerald, COLORS.cyan];
    const panelHeights = ['h-[130px] sm:h-[172px]', 'h-[132px] sm:h-[175px]'];
    const panelCursors = ['cursor-grab', 'cursor-ns-resize'];

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
        'px-1.5 py-0.5 sm:px-2 rounded-md text-[10px] sm:text-[11px] font-mono font-semibold bg-slate-900/90 border border-slate-800 text-slate-200 shrink-0';

      header.append(titleWrap, readoutEl);
      panel.appendChild(header);

      const canvasWrap = document.createElement('div');
      canvasWrap.className = `relative w-full ${panelCursors[i]} ${panelHeights[i]}`;

      const canvas = document.createElement('canvas');
      canvas.className = 'el-fr-canvas h-full';
      canvas.style.touchAction = 'none';
      canvasWrap.appendChild(canvas);
      panel.appendChild(canvasWrap);

      stackWrap.appendChild(panel);

      this._canvases.push(canvas);
      this._ctxs.push(canvas.getContext('2d'));
      this._sizes[i] = { w: 0, h: i === 0 ? 130 : 132 };
      this._panelMetaEls.push({ titleEl, readoutEl, canvasWrap });
    }

    this._bindRootLocusPointerEvents(this._canvases[0], this._panelMetaEls[0].canvasWrap, signal);
    this._bindBodePointerEvents(this._canvases[1], signal);

    stackWrap.addEventListener(
      'keydown',
      (e) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault();
        const factor = e.shiftKey ? 1.25 : 1.08;
        const nextK =
          e.key === 'ArrowRight' || e.key === 'ArrowUp' ? this.gainK * factor : this.gainK / factor;
        this._applyGain(nextK, true);
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
      footerNote.textContent = 'Sweep gain K or drag either canvas to watch poles & margins couple live.';

      const ctaBtn = document.createElement('button');
      ctaBtn.type = 'button';
      ctaBtn.className =
        'el-fr-pill w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-100 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(34,211,238,0.16)]';
      ctaBtn.textContent = 'Test Your Intuition: Root Locus & Bode Quiz →';
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

  _kToSliderPos(k) {
    const p = this._preset;
    const lo = Math.log(p.kMin);
    const hi = Math.log(p.kMax);
    const t = clamp((Math.log(clamp(k, p.kMin, p.kMax)) - lo) / (hi - lo), 0, 1);
    return Math.round(t * 1000);
  }

  _sliderPosToK(pos) {
    const p = this._preset;
    const lo = Math.log(p.kMin);
    const hi = Math.log(p.kMax);
    const t = clamp(pos / 1000, 0, 1);
    return Math.exp(lo + t * (hi - lo));
  }

  _bindRootLocusPointerEvents(canvas, wrap, signal) {
    const snapPointerToGain = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return null;
      const pad = getSPlanePad(rect.width);
      const b = this._preset.sBounds;
      const map = createPlotMapper(rect.width, rect.height, pad, b.sigmaMin, b.sigmaMax, b.omegaMin, b.omegaMax);
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;

      const trace = PRESET_TRACES.get(this._preset.key);
      if (!trace) return null;
      let bestK = this.gainK;
      let bestDist = Infinity;
      for (const branch of trace.branches) {
        for (const pt of branch) {
          if (pt.K < this._preset.kMin || pt.K > this._preset.kMax) continue;
          const d = Math.hypot(map.xToPx(pt.re) - localX, map.yToPx(pt.im) - localY);
          if (d < bestDist) {
            bestDist = d;
            bestK = pt.K;
          }
        }
      }
      return bestK;
    };

    canvas.addEventListener(
      'pointerdown',
      (e) => {
        const k = snapPointerToGain(e.clientX, e.clientY);
        if (k === null) return;
        this._isDraggingPanel = 0;
        this._activePointerId = e.pointerId;
        wrap.classList.remove('cursor-grab');
        wrap.classList.add('cursor-grabbing');
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {
          // Ignore
        }
        this._applyGain(k, true);
      },
      { signal }
    );

    canvas.addEventListener(
      'pointermove',
      (e) => {
        if (this._isDraggingPanel !== 0 || e.pointerId !== this._activePointerId) return;
        const k = snapPointerToGain(e.clientX, e.clientY);
        if (k !== null) this._applyGain(k, true);
      },
      { signal }
    );

    const endDrag = (e) => {
      if (this._activePointerId === e.pointerId && this._isDraggingPanel === 0) {
        this._isDraggingPanel = -1;
        this._activePointerId = null;
        wrap.classList.remove('cursor-grabbing');
        wrap.classList.add('cursor-grab');
        try {
          if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
        } catch (_) {
          // Ignore
        }
      }
    };
    canvas.addEventListener('pointerup', endDrag, { signal });
    canvas.addEventListener('pointercancel', endDrag, { signal });
  }

  _bindBodePointerEvents(canvas, signal) {
    canvas.addEventListener(
      'pointerdown',
      (e) => {
        this._isDraggingPanel = 1;
        this._activePointerId = e.pointerId;
        this._dragStartY = e.clientY;
        this._dragStartK = this.gainK;
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {
          // Ignore
        }
      },
      { signal }
    );

    canvas.addEventListener(
      'pointermove',
      (e) => {
        if (this._isDraggingPanel !== 1 || e.pointerId !== this._activePointerId) return;
        const rect = canvas.getBoundingClientRect();
        if (rect.height < 20) return;
        // Dragging up raises dB => increases K
        const dy = this._dragStartY - e.clientY;
        const dbDelta = (dy / rect.height) * (BODE_DB_MAX - BODE_DB_MIN) * 0.9;
        const nextK = this._dragStartK * Math.pow(10, dbDelta / 20);
        this._applyGain(nextK, true);
      },
      { signal }
    );

    const endDrag = (e) => {
      if (this._activePointerId === e.pointerId && this._isDraggingPanel === 1) {
        this._isDraggingPanel = -1;
        this._activePointerId = null;
        try {
          if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
        } catch (_) {
          // Ignore
        }
      }
    };
    canvas.addEventListener('pointerup', endDrag, { signal });
    canvas.addEventListener('pointercancel', endDrag, { signal });
  }

  _playThrottledTick() {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this._lastTickMs > 80) {
      this._lastTickMs = now;
      safeSound('playTick');
    }
  }

  _applyGain(rawK, allowAudio = false) {
    const prevStab = this._analysis.stability;
    let nextK = clamp(Number(rawK), this._preset.kMin, this._preset.kMax);

    // Subtle detent near ultimate gain K_u so user can feel the exact jω boundary
    if (this._preset.kUltimate && Math.abs(nextK - this._preset.kUltimate) < 0.14) {
      nextK = this._preset.kUltimate;
    }

    this.gainK = nextK;
    this._analysis = analyzeClosedLoop(this._preset, this.gainK);

    if (allowAudio) {
      if (prevStab !== this._analysis.stability) {
        this._playThrottledTick();
      }
      this._markInteracted();
    }

    this._syncControlUI();
    this._drawAll();
  }

  _markInteracted() {
    if (!this._hasInteracted) {
      this._hasInteracted = true;
      try {
        this.onInteract?.({ preset: this._preset.key, K: this.gainK, analysis: this._analysis });
      } catch (_) {
        // Ignore consumer errors
      }
    }
  }

  setPreset(key) {
    const found = LAB_PRESETS.find((p) => p.key === key);
    if (!found) return;
    this._preset = found;
    this.gainK = found.kDefault;
    this._analysis = analyzeClosedLoop(this._preset, this.gainK);
    this._syncControlUI();
    this._drawAll();
  }

  setGain(k) {
    if (!Number.isFinite(Number(k))) return;
    this._applyGain(Number(k), false);
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

    // Active preset pill highlighting
    for (const [key, btn] of this._presetButtons.entries()) {
      const isActive = key === this._preset.key;
      if (isActive) {
        btn.className =
          'el-fr-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border cursor-pointer bg-cyan-400/15 border-cyan-400/70 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.22)]';
      } else {
        btn.className =
          'el-fr-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700';
      }
    }

    // Panel titles (Mechatronics Lens relabeling)
    const titles = this.mechatronicsLens
      ? ['Closed-Loop Pole Migration', 'Servo Loop Gain/Phase Robustness Margins']
      : ['Root Locus 1+KG(s)=0', 'Bode |L(jω)| dB & ∠L(jω)'];
    for (let i = 0; i < 2; i++) {
      if (this._panelMetaEls[i]) {
        this._panelMetaEls[i].titleEl.textContent = titles[i];
      }
    }

    // Sync slider
    if (this._sliderEl) {
      this._sliderEl.value = String(this._kToSliderPos(this.gainK));
    }
    if (this._sliderValEl) {
      this._sliderValEl.textContent = `K=${fmtPlain(this.gainK, 2)}`;
    }

    // Sync telemetry pills
    const a = this._analysis;
    const { kPill, pmPill, gmPill, wgcPill, stabPill, formulaEl, insightEl } = this._telemetryEls;

    if (kPill) kPill.textContent = `K = ${fmtPlain(this.gainK, 2)}`;
    if (pmPill) {
      const pmStr = a.pmDeg !== null ? `${fmtSigned(a.pmDeg, 1)}°` : '—';
      pmPill.textContent = `PM = ${pmStr}`;
      pmPill.className =
        'shrink-0 whitespace-nowrap px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border ' +
        (a.pmDeg === null || a.pmDeg > 3
          ? 'bg-emerald-500/10 border-emerald-400/45 text-emerald-200'
          : a.pmDeg < -3
          ? 'bg-rose-500/15 border-rose-400/55 text-rose-200'
          : 'bg-amber-500/15 border-amber-400/55 text-amber-200');
    }
    if (gmPill) {
      const gmStr = Number.isFinite(a.gmDb) ? `${fmtSigned(a.gmDb, 1)} dB` : '∞ dB';
      gmPill.textContent = `GM = ${gmStr}`;
      gmPill.className =
        'shrink-0 whitespace-nowrap px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border ' +
        (!Number.isFinite(a.gmDb) || a.gmDb > 0.5
          ? 'bg-amber-500/10 border-amber-400/45 text-amber-200'
          : 'bg-rose-500/15 border-rose-400/55 text-rose-200');
    }
    if (wgcPill) {
      wgcPill.textContent = a.wgc !== null ? `ω_gc = ${fmtPlain(a.wgc, 2)}` : 'ω_gc = —';
    }
    if (stabPill) {
      if (a.stability === 'stable') {
        stabPill.textContent = '● STABLE';
        stabPill.className =
          'shrink-0 whitespace-nowrap px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wide border bg-emerald-400/15 border-emerald-400/55 text-emerald-300';
      } else if (a.stability === 'marginal') {
        stabPill.textContent = '● MARGINAL';
        stabPill.className =
          'shrink-0 whitespace-nowrap px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wide border bg-amber-400/15 border-amber-400/60 text-amber-200';
      } else {
        stabPill.textContent = '▲ UNSTABLE';
        stabPill.className =
          'shrink-0 whitespace-nowrap px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wide border bg-rose-500/15 border-rose-400/60 text-rose-300';
      }
    }

    // Panel readouts
    if (this._panelMetaEls.length === 2) {
      const dp = a.dominantPole;
      this._panelMetaEls[0].readoutEl.textContent =
        Math.abs(dp.im) > 0.04
          ? `s* = ${fmtSigned(dp.re, 2)} ± ${fmtPlain(Math.abs(dp.im), 2)}j`
          : `s* = ${fmtSigned(dp.re, 2)}`;
      const pmShort = a.pmDeg !== null ? `PM ${fmtSigned(a.pmDeg, 0)}°` : 'PM —';
      const gmShort = Number.isFinite(a.gmDb) ? `GM ${fmtSigned(a.gmDb, 1)}dB` : 'GM ∞';
      this._panelMetaEls[1].readoutEl.textContent = `${pmShort} • ${gmShort}`;
    }

    if (formulaEl) {
      formulaEl.innerHTML = `
        <span class="text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
          ${this.mechatronicsLens ? 'Open-Loop' : 'Transfer Fn'}
        </span>
        <span>${formatKatex(this._preset.formulaTex, false)}</span>
      `;
    }
    if (insightEl) {
      insightEl.textContent = this.mechatronicsLens ? this._preset.insightMech : this._preset.insightMath;
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

  _resizeCanvases() {
    this._resizeAll();
  }

  _startAnimationLoop() {
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    const tick = (ts) => {
      if (this._disposed) return;
      if (this._lastFrameTs === 0) this._lastFrameTs = ts;
      const dt = Math.min(0.05, (ts - this._lastFrameTs) / 1000);
      this._lastFrameTs = ts;
      this._pulsePhase = (this._pulsePhase + dt * 2.8) % TWO_PI;

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

    for (let i = 0; i < 2; i++) {
      const ctx = this._ctxs[i];
      const { w, h } = this._sizes[i];
      if (!ctx || w < 20 || h < 20) continue;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (i === 0) this._drawRootLocusPanel(ctx, w, h, pulse);
      else this._drawBodePanel(ctx, w, h, pulse);
    }
  }

  _drawCanvases() {
    this._drawAll();
  }

  _drawRootLocusPanel(ctx, w, h, pulse) {
    const compact = w < 430;
    const pad = getSPlanePad(w);
    const b = this._preset.sBounds;
    const map = createPlotMapper(w, h, pad, b.sigmaMin, b.sigmaMax, b.omegaMin, b.omegaMax);

    drawSPlaneBackdrop(ctx, w, h, map, b, { compact, showLabels: true, showRegionBadges: true });

    const trace = PRESET_TRACES.get(this._preset.key);
    if (trace) {
      drawRootLocusCurves(ctx, map, trace, {
        lineWidth: compact ? 2.0 : 2.35,
        showAsymptotes: true,
        compact,
      });
    }

    // Clipped markers for open-loop poles × (Cyan), open-loop zeros ○ (Amber), and closed-loop dots
    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft - 2, map.plotTop - 2, map.plotW + 4, map.plotH + 4);
    ctx.clip();

    const markSz = compact ? 5.0 : 6.0;
    for (const p of this._preset.poles) {
      drawOpenLoopPoleX(ctx, map.xToPx(p.re), map.yToPx(p.im), markSz, COLORS.cyan, COLORS.cyanGlow);
    }
    for (const z of this._preset.zeros) {
      drawOpenLoopZeroO(ctx, map.xToPx(z.re), map.yToPx(z.im), markSz, COLORS.amberLight, COLORS.amberGlow);
    }

    const anyRhp = this._analysis.stability === 'unstable';
    const isMarginal = this._analysis.stability === 'marginal';
    for (const cp of this._analysis.poles) {
      const px = map.xToPx(cp.re);
      const py = map.yToPx(cp.im);
      const isPoleRhp = cp.re > 0.015;
      const dotColor = anyRhp || isPoleRhp ? COLORS.coral : isMarginal ? COLORS.amberLight : COLORS.emerald;
      const dotGlow = anyRhp || isPoleRhp ? COLORS.coralGlow : isMarginal ? COLORS.amberGlow : COLORS.emeraldGlow;
      drawClosedLoopPoleDot(ctx, px, py, pulse, dotColor, dotGlow, compact);
    }
    ctx.restore();

    // Compact legend badge bottom-left
    const legTxt = this._preset.zeros.length > 0 ? '× OL Pole  ○ Zero  ● CL(K)' : '× OL Pole  ● CL Pole(K)';
    drawCompactBadge(
      ctx,
      map.plotLeft + 5,
      map.plotBottom - (compact ? 18 : 20),
      legTxt,
      'rgba(148, 163, 184, 0.25)',
      'rgba(226, 232, 240, 0.85)',
      compact
    );
  }

  _drawBodePanel(ctx, w, h, pulse) {
    const compact = w < 430;
    const pad = getBodePad(w);
    const map = createLogBodeMapper(
      w,
      h,
      pad,
      BODE_W_MIN,
      BODE_W_MAX,
      BODE_DB_MIN,
      BODE_DB_MAX,
      BODE_DEG_MIN,
      BODE_DEG_MAX
    );

    drawBodeDualPlot(ctx, w, h, map, this._preset, this.gainK, this._analysis, {
      compact,
      pulse,
      showCalipers: true,
      showLeftLabels: true,
      showRightLabels: true,
      showXLabels: true,
    });

    // Subtle inline legend top-right
    const legTxt = '— |L| dB   -- ∠L°';
    const pillW = compact ? 92 : 106;
    drawCompactBadge(
      ctx,
      map.plotRight - pillW - 5,
      map.plotTop + 4,
      legTxt,
      'rgba(34, 211, 238, 0.3)',
      '#E2E8F0',
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
    this._presetButtons.clear();
    this._telemetryEls = {};
    this._sliderEl = null;
    this._sliderValEl = null;
    this._root = null;
  }
}

// ===========================================================================
// PART 2: FreqVisualQuizEngine (6-Challenge Root Locus & Bode Intuition Quiz)
// ===========================================================================

// Precomputed Root Locus traces for Quiz #2 (before & after Lead zero vs distractors)
const Q2_TARGET_TOPOLOGY = {
  num: [1],
  den: [1, 3, 2, 0],
  poles: [
    { re: 0, im: 0 },
    { re: -1, im: 0 },
    { re: -2, im: 0 },
  ],
  zeros: [],
  kMin: 0.1,
  kMax: 12,
  kTraceMax: 28,
};
const Q2_LEAD_ZERO_TOPOLOGY = {
  num: [1, 1.5],
  den: [1, 3, 2, 0], // same poles 0, -1, -2 + Lead zero at -1.5!
  poles: [
    { re: 0, im: 0 },
    { re: -1, im: 0 },
    { re: -2, im: 0 },
  ],
  zeros: [{ re: -1.5, im: 0 }],
  kMin: 0.1,
  kMax: 16,
  kTraceMax: 40,
};
const Q2_EXTRA_POLE_TOPOLOGY = {
  num: [1],
  den: [1, 5.5, 9.5, 5, 0], // s(s+1)(s+2)(s+2.5)
  poles: [
    { re: 0, im: 0 },
    { re: -1, im: 0 },
    { re: -2, im: 0 },
    { re: -2.5, im: 0 },
  ],
  zeros: [],
  kMin: 0.1,
  kMax: 12,
  kTraceMax: 30,
};
const Q2_RHP_ZERO_TOPOLOGY = {
  num: [1, -1.0], // non-minimum phase RHP zero at +1
  den: [1, 3, 2, 0],
  poles: [
    { re: 0, im: 0 },
    { re: -1, im: 0 },
    { re: -2, im: 0 },
  ],
  zeros: [{ re: 1.0, im: 0 }],
  kMin: 0.1,
  kMax: 12,
  kTraceMax: 25,
};

const Q2_TRACES = {
  target: buildRootLocusTrace(Q2_TARGET_TOPOLOGY),
  leadZero: buildRootLocusTrace(Q2_LEAD_ZERO_TOPOLOGY),
  extraPole: buildRootLocusTrace(Q2_EXTRA_POLE_TOPOLOGY),
  rhpZero: buildRootLocusTrace(Q2_RHP_ZERO_TOPOLOGY),
};

// Topologies for Quiz #3 (PM = +45°) & Quiz #6 (GM = -6 dB)
const Q3_BODE_TOPOLOGY = {
  num: [1],
  den: [1, 1, 0], // L(s) = K / (s(s+1)): at w_gc = 1, K = sqrt(2) => phase = -90 - 45 = -135°, PM = +45°!
  poles: [
    { re: 0, im: 0 },
    { re: -1, im: 0 },
  ],
  zeros: [],
};
const Q3_BODE_K = Math.SQRT2;
const Q3_BODE_ANALYSIS = analyzeClosedLoop(Q3_BODE_TOPOLOGY, Q3_BODE_K);

const Q6_BODE_TOPOLOGY = LAB_PRESETS[0]; // 3-Pole Locus K / (s(s+1)(s+2)), K_u = 6
const Q6_BODE_K = 12.0; // Double ultimate gain => at ω_pc = √2, |L| = 2 => +6.02 dB => GM = -6.0 dB!
const Q6_BODE_ANALYSIS = analyzeClosedLoop(Q6_BODE_TOPOLOGY, Q6_BODE_K);

const FREQ_QUIZ_CHALLENGES = [
  {
    id: 'freq-quiz-1',
    badge: 'Real-Axis Rule',
    title: 'Root Locus Real-Axis Rule',
    targetHeaderMath: 'Open-Loop Poles on Real Axis',
    targetHeaderMech: 'Open-Loop Actuator Poles',
    targetFormulaMath: 's = 0,\\ -1,\\ -3',
    targetFormulaMech: 'p = 0,\\ -1,\\ -3\\text{ s}^{-1}',
    promptMath:
      'Open-loop poles sit at $s = 0, -1, -3$. Using the odd-count real-axis rule, which $s$-plane highlights the exact valid real-axis Root Locus segments?',
    promptMech:
      'A 3-pole plant has open-loop poles at $0, -1, -3\\text{ s}^{-1}$. Which $s$-plane highlights the exact real-axis intervals where closed-loop poles can exist?',
    targetSpec: {
      kind: 'splane-open-poles',
      bounds: { sigmaMin: -4.5, sigmaMax: 1.2, omegaMin: -2.4, omegaMax: 2.4 },
      poles: [
        { re: 0, im: 0 },
        { re: -1, im: 0 },
        { re: -3, im: 0 },
      ],
      zeros: [],
    },
    proofTextMath:
      'A real-axis interval belongs to the Root Locus iff an **odd** number of open-loop poles + zeros lie to its right: $(-1, 0)$ has $1$ pole to the right, and $(-\\infty, -3)$ has $3$.',
    proofTextMech:
      'Counting poles to the right gives $1$ (odd) on $(-1, 0)$ and $3$ (odd) on $(-\\infty, -3)$. The gap $(-3, -1)$ has $2$ (even), so no closed-loop pole can ever land there.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        kind: 'splane-segments',
        bounds: { sigmaMin: -4.5, sigmaMax: 1.2, omegaMin: -2.2, omegaMax: 2.2 },
        poles: [
          { re: 0, im: 0 },
          { re: -1, im: 0 },
          { re: -3, im: 0 },
        ],
        segments: [
          [-3, -1],
          [0, 1.2],
        ],
        wrongHintMath:
          'Those are the **even**-count intervals! On $(-3, -1)$ there are $2$ poles to the right, and on $(0, +\\infty)$ there are $0$. Real-axis locus requires an **odd** count.',
        wrongHintMech:
          'Between $-3$ and $-1$ there are $2$ poles to the right (even), and in the RHP there are $0$. Real-axis branches only exist where the right-hand count is odd.',
      },
      {
        letter: 'B',
        isCorrect: true,
        kind: 'splane-segments',
        bounds: { sigmaMin: -4.5, sigmaMax: 1.2, omegaMin: -2.2, omegaMax: 2.2 },
        poles: [
          { re: 0, im: 0 },
          { re: -1, im: 0 },
          { re: -3, im: 0 },
        ],
        segments: [
          [-1, 0],
          [-4.5, -3],
        ],
        proofBadges: [
          { x: -0.5, label: '1 (odd)' },
          { x: -3.75, label: '3 (odd)' },
        ],
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        kind: 'splane-segments',
        bounds: { sigmaMin: -4.5, sigmaMax: 1.2, omegaMin: -2.2, omegaMax: 2.2 },
        poles: [
          { re: 0, im: 0 },
          { re: -1, im: 0 },
          { re: -3, im: 0 },
        ],
        segments: [[-3, 0]],
        wrongHintMath:
          'The locus does not fill $(-3, -1)$ (even count = $2$), and it must continue left to $-\\infty$ past $s = -3$ where $3$ (odd) poles lie to the right!',
        wrongHintMech:
          'Check to the left of $s = -3$: all $3$ poles lie to the right (odd!), so the leftmost pole travels smoothly toward $-\\infty$ instead of stopping.',
      },
    ],
  },
  {
    id: 'freq-quiz-2',
    badge: 'Lead Zero',
    title: 'Effect of Adding an LHP Lead Zero',
    targetHeaderMath: 'Uncompensated 3-Pole Locus',
    targetHeaderMech: 'Uncompensated 3-Pole Servo',
    targetFormulaMath: 'L(s) = \\frac{K}{s(s+1)(s+2)}',
    targetFormulaMech: 'K_u = 6\\ \\text{(Crosses to RHP)}',
    promptMath:
      'This 3-pole locus curves into the Coral RHP at high $K$. Which Root Locus shows the stabilizing effect of adding an LHP **Lead zero** $s = -1.5$?',
    promptMech:
      'This servo loop goes unstable at high gain. Adding a PD/Lead compensator places an Amber zero at $s = -1.5$. Which locus shows how it stabilizes the loop?',
    targetSpec: {
      kind: 'splane-locus',
      bounds: { sigmaMin: -3.5, sigmaMax: 1.5, omegaMin: -3.5, omegaMax: 3.5 },
      topology: Q2_TARGET_TOPOLOGY,
      trace: Q2_TRACES.target,
    },
    proofTextMath:
      'Adding an LHP zero reduces the pole-zero excess from $3$ to $2$ ($\\pm 90^\\circ$ asymptotes at $\\sigma_a = -0.75$), pulling the branches safely leftward so the loop stays stable for **all** $K > 0$.',
    proofTextMech:
      'The LHP Lead zero acts like a magnetic anchor in the stable half-plane: it bends the branches away from the $j\\omega$-axis, eliminating high-gain RHP instability.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        kind: 'splane-locus',
        bounds: { sigmaMin: -3.5, sigmaMax: 1.5, omegaMin: -3.5, omegaMax: 3.5 },
        topology: Q2_LEAD_ZERO_TOPOLOGY,
        trace: Q2_TRACES.leadZero,
        proofLabel: 'Pulled LHP!',
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        kind: 'splane-locus',
        bounds: { sigmaMin: -3.5, sigmaMax: 1.5, omegaMin: -3.5, omegaMax: 3.5 },
        topology: Q2_EXTRA_POLE_TOPOLOGY,
        trace: Q2_TRACES.extraPole,
        wrongHintMath:
          'That adds a 4th pole (not a zero!), bending asymptotes to $\\pm 45^\\circ$ and pushing the locus into the RHP even faster.',
        wrongHintMech:
          'Adding another lag pole worsens phase lag and destabilizes the loop earlier. A Lead zero (Amber ○) pulls the locus **left**, not right.',
      },
      {
        letter: 'C',
        isCorrect: false,
        kind: 'splane-locus',
        bounds: { sigmaMin: -3.5, sigmaMax: 1.5, omegaMin: -3.5, omegaMax: 3.5 },
        topology: Q2_RHP_ZERO_TOPOLOGY,
        trace: Q2_TRACES.rhpZero,
        wrongHintMath:
          'That zero sits in the **Right Half-Plane** ($s = +1$), pulling a closed-loop branch straight into instability! A Lead zero must lie in the LHP.',
        wrongHintMech:
          'An RHP zero ($s = +1$) creates non-minimum-phase instability by dragging a branch into the Coral RHP. A stabilizing Lead zero always sits in the LHP.',
      },
    ],
  },
  {
    id: 'freq-quiz-3',
    badge: 'Phase Margin',
    title: 'Read Phase Margin from Bode Plot',
    targetHeaderMath: 'Open-Loop Bode at 0 dB Crossover',
    targetHeaderMech: 'Servo Loop Bode Margins',
    targetFormulaMath: '\\angle L(j\\omega_{gc}) = -135^\\circ \\Rightarrow \\text{PM} = +45^\\circ',
    targetFormulaMech: '\\text{PM} = +45^\\circ\\ (\\zeta \\approx 0.45)',
    promptMath:
      'At the $0\\text{ dB}$ gain crossover $\\omega_{gc}$, the phase is $-135^\\circ$ (giving $\\text{PM} = +45^\\circ$). Which closed-loop step response matches this healthy margin?',
    promptMech:
      'Your servo crosses $0\\text{ dB}$ with phase $-135^\\circ$, leaving $+45^\\circ$ of Phase Margin above $-180^\\circ$. Which step response matches this robustness?',
    targetSpec: {
      kind: 'bode-dual',
      topology: Q3_BODE_TOPOLOGY,
      K: Q3_BODE_K,
      analysis: Q3_BODE_ANALYSIS,
    },
    proofTextMath:
      'Since $\\text{PM} = 180^\\circ + (-135^\\circ) = +45^\\circ > 0$, the closed-loop damping ratio is roughly $\\zeta \\approx \\text{PM}/100 \\approx 0.45$ — producing a crisp, stable step response with moderate ~$20\\%$ overshoot.',
    proofTextMech:
      'A $+45^\\circ$ Phase Margin is the classic servo sweet spot: fast rise time, modest ~$20\\%$ overshoot, and quick settling with plenty of safety buffer from $-180^\\circ$.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        kind: 'step-response',
        tDomain: [0, 8],
        yBounds: [-2.4, 3.6],
        fn: (t) => 1 - 0.55 * Math.exp(0.22 * t) * Math.cos(2.6 * t),
        wrongHintMath:
          'Growing oscillations mean **negative** Phase Margin ($\\angle L < -180^\\circ$ at $0\\text{ dB}$). Here $-135^\\circ$ still has $+45^\\circ$ of headroom above $-180^\\circ$!',
        wrongHintMech:
          'Runaway oscillation only occurs when phase drops past $-180^\\circ$ (negative PM). With $+45^\\circ$ of margin, the servo settles cleanly.',
      },
      {
        letter: 'B',
        isCorrect: false,
        kind: 'step-response',
        tDomain: [0, 8],
        yBounds: [-0.2, 2.05],
        fn: (t) => 1 - Math.exp(-0.18 * t) * Math.cos(3.4 * t),
        wrongHintMath:
          'Nearly undamped ringing ($>80\\%$ overshoot) indicates a tiny margin ($\\text{PM} \\approx 8^\\circ$). A healthy $+45^\\circ$ PM damps out in 1–2 cycles!',
        wrongHintMech:
          'Violent long-lasting ringing happens when PM is dangerously narrow ($<15^\\circ$). At $+45^\\circ$ PM, damping $\\zeta \\approx 0.45$ quenches oscillation quickly.',
      },
      {
        letter: 'C',
        isCorrect: true,
        kind: 'step-response',
        tDomain: [0, 8],
        yBounds: [-0.15, 1.55],
        fn: (t) => 1 - Math.exp(-0.85 * t) * (Math.cos(1.68 * t) + 0.5 * Math.sin(1.68 * t)),
        proofKind: 'healthy-step',
        wrongHintMath: '',
        wrongHintMech: '',
      },
    ],
  },
  {
    id: 'freq-quiz-4',
    badge: 'Resonance Mᵣ',
    title: 'Bode Resonant Peak vs. Damping ζ',
    targetHeaderMath: 'Lightly Damped Complex Poles',
    targetHeaderMech: 'Flexible Mechanical Resonance',
    targetFormulaMath: '\\zeta = 0.15,\\ \\omega_n = 2.5\\text{ rad/s}',
    targetFormulaMech: '\\zeta = 0.15\\ (M_r \\approx +10.6\\text{ dB})',
    promptMath:
      'A 2nd-order system has lightly damped poles ($\\zeta = 0.15$) hugging the $j\\omega$-axis. Which Bode magnitude plot $|G(j\\omega)|_{\\text{dB}}$ matches this resonance?',
    promptMech:
      'A lightly damped mechanical structure ($\\zeta = 0.15, \\omega_n = 2.5$) sits close to the $j\\omega$-axis. Which Bode magnitude signature belongs to it?',
    targetSpec: {
      kind: 'splane-open-poles',
      bounds: { sigmaMin: -3.2, sigmaMax: 1.0, omegaMin: -3.6, omegaMax: 3.6 },
      poles: [
        { re: -0.375, im: 2.47 },
        { re: -0.375, im: -2.47 },
      ],
      zeros: [],
      extraTag: 'ζ = 0.15',
    },
    proofTextMath:
      'Because the poles sit close to $s = j\\omega_n$, $|j\\omega - p|$ becomes tiny near $\\omega_r \\approx 2.44$, creating a sharp resonant peak $M_r \\approx \\frac{1}{2\\zeta} \\approx +10.6\\text{ dB}$ followed by a $-40\\text{ dB/dec}$ roll-off.',
    proofTextMech:
      'Low structural damping ($\\zeta = 0.15$) amplifies excitation right near $\\omega_n$ by $+10.6\\text{ dB}$ ($>3\\times$ amplitude!) before rolling off steeply at $-40\\text{ dB/dec}$.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        kind: 'bode-mag',
        dbFn: (w) => {
          const r = w / 2.5;
          const mag = 1 / Math.hypot(1 - r * r, 2 * 1.0 * r); // ζ = 1.0
          return 20 * Math.log10(Math.max(mag, 1e-6));
        },
        wrongHintMath:
          'That flat knee with zero hump is **critically damped** ($\\zeta = 1.0$). Whenever $\\zeta < 0.707$, a clear resonant peak rises above $0\\text{ dB}$!',
        wrongHintMech:
          'A critically damped plant ($\\zeta = 1.0$) never amplifies vibrations above $0\\text{ dB}$. Light damping ($\\zeta = 0.15$) produces a dramatic spike at $\\omega_r$.',
      },
      {
        letter: 'B',
        isCorrect: true,
        kind: 'bode-mag',
        dbFn: (w) => {
          const r = w / 2.5;
          const mag = 1 / Math.hypot(1 - r * r, 2 * 0.15 * r); // ζ = 0.15 => +10.6 dB peak!
          return 20 * Math.log10(Math.max(mag, 1e-6));
        },
        proofPeakW: 2.44,
        proofPeakDb: 10.6,
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        kind: 'bode-mag',
        dbFn: (w) => {
          const mag = 1 / Math.hypot(1, w / 2.5); // 1st-order roll-off
          return 20 * Math.log10(Math.max(mag, 1e-6));
        },
        wrongHintMath:
          'That gentle $-20\\text{ dB/dec}$ curve is a **1st-order** low-pass filter (one real pole). Complex poles at $\\zeta = 0.15$ create a sharp peak and $-40\\text{ dB/dec}$ drop.',
        wrongHintMech:
          'A 1st-order RC roll-off ($-20\\text{ dB/dec}$) has no energy-storing resonance. A 2nd-order lightly damped mode spikes sharply before dropping at $-40\\text{ dB/dec}$.',
      },
    ],
  },
  {
    id: 'freq-quiz-5',
    badge: 'Lead vs. Lag',
    title: 'Lead vs. Lag Compensator Phase Signature',
    targetHeaderMath: 'Phase-Lead Pole-Zero Map',
    targetHeaderMech: 'Lead Filter Pole-Zero Pair',
    targetFormulaMath: 'C(s) = \\frac{s+0.8}{s+6.0}\\quad (z < p)',
    targetFormulaMech: 'z = 0.8 < p = 6.0\\ (\\omega_m = \\sqrt{zp})',
    promptMath:
      'A **Phase-Lead Compensator** $C(s) = \\frac{s+z}{s+p}$ has its zero closer to the origin than its pole ($z < p$). Which Bode phase curve $\\angle C(j\\omega)$ matches?',
    promptMech:
      'This Lead compensator places its zero at $0.8$ and pole at $6.0$ ($z < p$) to rescue Phase Margin. Which phase signature $\\angle C(j\\omega)$ does it inject?',
    targetSpec: {
      kind: 'splane-open-poles',
      bounds: { sigmaMin: -7.0, sigmaMax: 1.0, omegaMin: -2.4, omegaMax: 2.4 },
      poles: [{ re: -6.0, im: 0 }],
      zeros: [{ re: -0.8, im: 0 }],
      extraTag: 'z < p (Lead)',
    },
    proofTextMath:
      'Because $z < p$, the zero’s $+\\arctan(\\omega/z)$ rises **first**, lifting phase into a positive hump peaking at $\\omega_m = \\sqrt{zp} \\approx 2.19\\text{ rad/s}$ before the pole pulls it back to $0^\\circ$.',
    proofTextMech:
      'Placing the zero closer to the origin injects a positive phase boost ($+49^\\circ$ peak at $\\omega_m = \\sqrt{zp}$) right around gain crossover, directly enlarging your servo’s Phase Margin!',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        kind: 'bode-phase',
        degBounds: [-100, 75],
        degFn: (w) => (Math.atan(w / 0.8) - Math.atan(w / 6.0)) * RAD_TO_DEG,
        proofPeakW: Math.sqrt(0.8 * 6.0),
        proofPeakDeg: (Math.atan(Math.sqrt(6 / 0.8)) - Math.atan(Math.sqrt(0.8 / 6))) * RAD_TO_DEG,
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        kind: 'bode-phase',
        degBounds: [-100, 75],
        degFn: (w) => (Math.atan(w / 6.0) - Math.atan(w / 0.8)) * RAD_TO_DEG,
        wrongHintMath:
          'A negative phase dip belongs to a **Phase-Lag** compensator ($p < z$), where the pole acts first. Here $z < p$, so the zero leads with **positive** phase!',
        wrongHintMech:
          'That downward dip is a **Lag** network ($p < z$). A **Lead** network ($z < p$) boosts phase **above** $0^\\circ$ to add damping and margin.',
      },
      {
        letter: 'C',
        isCorrect: false,
        kind: 'bode-phase',
        degBounds: [-100, 75],
        degFn: (w) => -Math.atan(w / 2.2) * RAD_TO_DEG,
        wrongHintMath:
          'Monotonic drop to $-90^\\circ$ comes from a single lag pole with no zero. A Lead compensator has both a zero and a pole, returning to $0^\\circ$ at high $\\omega$.',
        wrongHintMech:
          'A simple low-pass pole drags phase down to $-90^\\circ$ permanently. Lead compensation lifts phase positive in a localized mid-frequency hump.',
      },
    ],
  },
  {
    id: 'freq-quiz-6',
    badge: 'Gain Margin',
    title: 'Gain Margin = Headroom Before Instability',
    targetHeaderMath: 'Over-Gained Bode (GM = −6 dB)',
    targetHeaderMech: 'Exceeded Stability Limit (2× Kᵤ)',
    targetFormulaMath: '|L(j\\omega_{pc})| = +6\\text{ dB} \\Rightarrow \\text{GM} = -6\\text{ dB}',
    targetFormulaMech: '\\text{GM} = -6\\text{ dB}\\ (\\text{Negative Headroom!})',
    promptMath:
      'At the $-180^\\circ$ phase crossover $\\omega_{pc}$, the magnitude is already **$+6\\text{ dB}$ above $0\\text{ dB}$** ($\\text{GM} = -6\\text{ dB}$). Which closed-loop step response results?',
    promptMech:
      'At $-180^\\circ$ phase lag, loop gain is $+6\\text{ dB}$ ($2\\times$) above unity — negative Gain Margin! What happens to the closed-loop actuator step response?',
    targetSpec: {
      kind: 'bode-dual',
      topology: Q6_BODE_TOPOLOGY,
      K: Q6_BODE_K,
      analysis: Q6_BODE_ANALYSIS,
    },
    proofTextMath:
      'When $|L(j\\omega_{pc})| > 0\\text{ dB}$ at $-180^\\circ$, negative feedback flips into **amplifying positive feedback** ($\\text{GM} = -6\\text{ dB} < 0$), pushing closed-loop poles into the RHP and driving exponentially growing oscillations!',
    proofTextMech:
      'A negative Gain Margin ($-6\\text{ dB}$) means you have zero vertical headroom left: at $-180^\\circ$ inversion, every cycle returns at $2\\times$ amplitude and spirals out of control.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        kind: 'step-response',
        tDomain: [0, 7],
        yBounds: [-0.2, 1.45],
        fn: (t) => 1 - (1 + 1.4 * t) * Math.exp(-1.4 * t),
        wrongHintMath:
          'Smooth settling requires positive Gain Margin ($|L(j\\omega_{pc})| < 0\\text{ dB}$). Here loop gain at $-180^\\circ$ is already $+6\\text{ dB}$ ($2\\times$), which is unstable!',
        wrongHintMech:
          'You only get clean settling with positive headroom below $0\\text{ dB}$. Crossing $-180^\\circ$ at $+6\\text{ dB}$ guarantees unstable runaway.',
      },
      {
        letter: 'B',
        isCorrect: false,
        kind: 'step-response',
        tDomain: [0, 7],
        yBounds: [-0.35, 2.35],
        fn: (t) => 1 - Math.cos(2.4 * t),
        wrongHintMath:
          'Constant-amplitude oscillation only occurs at exact **marginal stability** ($|L(j\\omega_{pc})| = 0\\text{ dB}$, $\\text{GM} = 0\\text{ dB}$). At $+6\\text{ dB}$, the waves **grow** every cycle!',
        wrongHintMech:
          'Sustained constant ringing happens right at $0\\text{ dB}$ ($K = K_u$). Being $+6\\text{ dB}$ above $0\\text{ dB}$ pumps energy into every swing so amplitude explodes.',
      },
      {
        letter: 'C',
        isCorrect: true,
        kind: 'step-response',
        tDomain: [0, 7],
        yBounds: [-3.2, 4.4],
        fn: (t) => 1 - 0.52 * Math.exp(0.32 * t) * Math.cos(2.35 * t),
        proofKind: 'unstable-step',
        wrongHintMath: '',
        wrongHintMech: '',
      },
    ],
  },
];

export class FreqVisualQuizEngine {
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

    this._challenges = FREQ_QUIZ_CHALLENGES;
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
    return FREQ_QUIZ_CHALLENGES;
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

    // --- 1. Compact Header & 1–6 Stepper Pills + X/6 ---
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
        'el-fr-pill w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[11px] sm:text-xs font-mono font-semibold flex items-center justify-center border cursor-pointer ' +
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

    // --- 2. Compact Prompt & Target Canvas ---
    const body = document.createElement('div');
    body.className = 'p-2.5 sm:p-4 flex flex-col gap-2.5 sm:gap-3.5';

    const promptBox = document.createElement('div');
    promptBox.className = 'flex flex-col gap-1.5 sm:gap-2';

    const promptText = document.createElement('p');
    promptText.className = 'text-xs sm:text-[15px] leading-snug sm:leading-relaxed text-slate-200';
    promptText.innerHTML = formatInlineMath(this.mechatronicsLens ? ch.promptMech : ch.promptMath);
    promptBox.appendChild(promptText);

    const targetFrame = document.createElement('div');
    targetFrame.className = 'relative rounded-xl border border-slate-800/90 bg-[#0B0D12] overflow-hidden';

    const targetTopBar = document.createElement('div');
    targetTopBar.className =
      'px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#0E121B]/95 border-b border-slate-800/60 flex items-center justify-between gap-2';

    const targetFormula = this.mechatronicsLens ? ch.targetFormulaMech : ch.targetFormulaMath;
    const targetTitle = this.mechatronicsLens ? ch.targetHeaderMech : ch.targetHeaderMath;
    targetTopBar.innerHTML = `
      <span class="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-cyan-200 truncate">
        <span class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE] shrink-0"></span>
        ${escapeHtml(targetTitle)}
      </span>
      <span class="text-[11px] sm:text-xs text-slate-200 shrink-0">${formatKatex(targetFormula, false)}</span>
    `;
    targetFrame.appendChild(targetTopBar);

    const targetCanvasWrap = document.createElement('div');
    targetCanvasWrap.className = 'relative w-full h-[124px] sm:h-[184px]';

    const targetCanvas = document.createElement('canvas');
    targetCanvas.className = 'el-fr-canvas h-full';
    targetCanvasWrap.appendChild(targetCanvas);
    targetFrame.appendChild(targetCanvasWrap);

    this._targetCanvas = targetCanvas;
    this._targetCtx = targetCanvas.getContext('2d');
    this._targetWrap = targetCanvasWrap;

    promptBox.appendChild(targetFrame);
    body.appendChild(promptBox);

    // --- 3. 3-Column A/B/C Candidate Grid (Mobile Zero-Scroll) ---
    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'grid grid-cols-3 gap-1.5 sm:gap-3';

    ch.options.forEach((opt) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className =
        'el-fvq-card text-left rounded-xl border border-slate-800/90 bg-[#0F131C]/80 overflow-hidden flex flex-col focus:outline-none focus:ring-2 focus:ring-cyan-400/50';

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
        <span class="inline-flex items-center gap-1.5 sm:gap-2">
          <span class="w-5 h-5 rounded-md text-[11px] font-mono font-bold border flex items-center justify-center ${badgeColor}">
            ${opt.letter}
          </span>
          <span class="hidden sm:inline text-xs font-medium text-slate-300">Option ${opt.letter}</span>
        </span>
        ${rightBadge}
      `;
      card.appendChild(cardHeader);

      const canvasWrap = document.createElement('div');
      canvasWrap.className = 'relative w-full bg-[#0B0D12] h-[86px] sm:h-[132px]';

      const canvas = document.createElement('canvas');
      canvas.className = 'el-fr-canvas h-full';
      canvasWrap.appendChild(canvas);
      card.appendChild(canvasWrap);

      card.addEventListener('click', () => this._handleOptionClick(opt), { signal });

      optionsGrid.appendChild(card);
      this._optionCards.push({ card, canvasWrap, opt });
      this._optionCanvases.push(canvas);
      this._optionCtxs.push(canvas.getContext('2d'));
    });

    body.appendChild(optionsGrid);

    // --- 4. Feedback Banner ---
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
        // Ignore
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
      'rounded-xl border border-emerald-400/45 bg-emerald-500/10 p-2.5 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3';

    const left = document.createElement('div');
    left.className = 'flex flex-col gap-1';
    left.innerHTML = `
      <div class="flex items-center gap-2 text-xs font-semibold text-emerald-300">
        <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-400/20 border border-emerald-400/60 text-[10px]">✓</span>
        Geometric Proof Unlocked
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
      'el-fr-pill px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-400/60 text-emerald-100 cursor-pointer whitespace-nowrap';

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

  _resizeAll() {
    this._resizeCanvases();
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

    // --- 1. Target Canvas ---
    if (this._targetCtx && this._targetSize && this._targetSize.w >= 20) {
      const { w, h } = this._targetSize;
      const ctx = this._targetCtx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this._drawTargetSpec(ctx, w, h, ch.targetSpec, pulse);
    }

    // --- 2. 3-Column Candidate Canvases ---
    const optionSizes = this._optionSizes || [];
    ch.options.forEach((opt, idx) => {
      const ctx = this._optionCtxs[idx];
      const size = optionSizes[idx];
      if (!ctx || !size || size.w < 20) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const isSolvedCorrect = solved && opt.isCorrect;
      this._drawCandidateOption(ctx, size.w, size.h, opt, isSolvedCorrect, pulse);
    });
  }

  _drawAll() {
    this._drawCanvases();
  }

  _drawTargetSpec(ctx, w, h, spec, pulse) {
    const compact = w < 430;

    if (spec.kind === 'splane-open-poles') {
      const pad = getSPlanePad(w);
      const map = createPlotMapper(
        w,
        h,
        pad,
        spec.bounds.sigmaMin,
        spec.bounds.sigmaMax,
        spec.bounds.omegaMin,
        spec.bounds.omegaMax
      );
      drawSPlaneBackdrop(ctx, w, h, map, spec.bounds, { compact, showLabels: true, showRegionBadges: true });

      const sz = compact ? 5.5 : 7;
      for (const p of spec.poles) {
        const px = map.xToPx(p.re);
        const py = map.yToPx(p.im);
        drawOpenLoopPoleX(ctx, px, py, sz, COLORS.cyan, COLORS.cyanGlow);
      }
      for (const z of spec.zeros || []) {
        const px = map.xToPx(z.re);
        const py = map.yToPx(z.im);
        drawOpenLoopZeroO(ctx, px, py, sz, COLORS.amberLight, COLORS.amberGlow);
      }
      if (spec.extraTag) {
        drawCompactBadge(ctx, map.plotLeft + 6, map.plotBottom - 20, spec.extraTag, COLORS.amberLight, COLORS.amberLight, compact);
      }
      return;
    }

    if (spec.kind === 'splane-locus') {
      const pad = getSPlanePad(w);
      const map = createPlotMapper(
        w,
        h,
        pad,
        spec.bounds.sigmaMin,
        spec.bounds.sigmaMax,
        spec.bounds.omegaMin,
        spec.bounds.omegaMax
      );
      drawSPlaneBackdrop(ctx, w, h, map, spec.bounds, { compact, showLabels: true, showRegionBadges: true });
      drawRootLocusCurves(ctx, map, spec.trace, { lineWidth: compact ? 2.0 : 2.3, showAsymptotes: true, compact });
      const sz = compact ? 5 : 6;
      for (const p of spec.topology.poles) {
        drawOpenLoopPoleX(ctx, map.xToPx(p.re), map.yToPx(p.im), sz, COLORS.cyan, COLORS.cyanGlow);
      }
      for (const z of spec.topology.zeros) {
        drawOpenLoopZeroO(ctx, map.xToPx(z.re), map.yToPx(z.im), sz, COLORS.amberLight, COLORS.amberGlow);
      }
      return;
    }

    if (spec.kind === 'bode-dual') {
      const pad = getBodePad(w);
      const map = createLogBodeMapper(
        w,
        h,
        pad,
        BODE_W_MIN,
        BODE_W_MAX,
        BODE_DB_MIN,
        BODE_DB_MAX,
        BODE_DEG_MIN,
        BODE_DEG_MAX
      );
      drawBodeDualPlot(ctx, w, h, map, spec.topology, spec.K, spec.analysis, {
        compact,
        pulse,
        showCalipers: true,
        showLeftLabels: true,
        showRightLabels: true,
        showXLabels: true,
      });
    }
  }

  _drawCandidateOption(ctx, w, h, opt, isSolvedCorrect, pulse) {
    const isNarrow = w < 175;
    const pad = isNarrow ? { left: 8, right: 8, top: 8, bottom: 10 } : { left: 26, right: 10, top: 12, bottom: 16 };

    if (opt.kind === 'splane-segments') {
      const map = createPlotMapper(
        w,
        h,
        pad,
        opt.bounds.sigmaMin,
        opt.bounds.sigmaMax,
        opt.bounds.omegaMin,
        opt.bounds.omegaMax
      );
      drawSPlaneBackdrop(ctx, w, h, map, opt.bounds, {
        compact: true,
        showLabels: !isNarrow,
        showRegionBadges: false,
      });

      const y0 = map.yToPx(0);
      ctx.save();
      ctx.beginPath();
      ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
      ctx.clip();

      // Highlighted real-axis Root Locus segments
      const segColor = isSolvedCorrect ? COLORS.emerald : COLORS.violet;
      const segGlow = isSolvedCorrect ? COLORS.emeraldGlow : COLORS.violetGlow;
      ctx.strokeStyle = segColor;
      ctx.shadowColor = segGlow;
      ctx.shadowBlur = 10;
      ctx.lineWidth = isNarrow ? 3.8 : 4.6;
      ctx.lineCap = 'round';
      for (const [x1, x2] of opt.segments) {
        ctx.beginPath();
        ctx.moveTo(map.xToPx(x1), y0);
        ctx.lineTo(map.xToPx(x2), y0);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // Open-loop poles
      const sz = isNarrow ? 4.2 : 5.2;
      for (const p of opt.poles) {
        drawOpenLoopPoleX(ctx, map.xToPx(p.re), map.yToPx(p.im), sz, COLORS.cyan, COLORS.cyanGlow);
      }

      // Geometric proof badges on solved correct option
      if (isSolvedCorrect && opt.proofBadges) {
        for (const b of opt.proofBadges) {
          const px = map.xToPx(b.x);
          ctx.beginPath();
          ctx.arc(px, y0, 3.2 + pulse * 1.5, 0, TWO_PI);
          ctx.fillStyle = COLORS.amberLight;
          ctx.fill();
          if (!isNarrow) {
            drawCompactBadge(ctx, clamp(px - 22, map.plotLeft + 2, map.plotRight - 46), y0 - 22, b.label, COLORS.amberLight, COLORS.amberLight, true);
          }
        }
      }
      ctx.restore();
      return;
    }

    if (opt.kind === 'splane-locus') {
      const map = createPlotMapper(
        w,
        h,
        pad,
        opt.bounds.sigmaMin,
        opt.bounds.sigmaMax,
        opt.bounds.omegaMin,
        opt.bounds.omegaMax
      );
      drawSPlaneBackdrop(ctx, w, h, map, opt.bounds, {
        compact: true,
        showLabels: !isNarrow,
        showRegionBadges: false,
      });
      drawRootLocusCurves(ctx, map, opt.trace, {
        lineWidth: isNarrow ? 1.8 : 2.1,
        showAsymptotes: isSolvedCorrect,
        compact: true,
      });
      const sz = isNarrow ? 4 : 5;
      for (const p of opt.topology.poles) {
        drawOpenLoopPoleX(ctx, map.xToPx(p.re), map.yToPx(p.im), sz, COLORS.cyan, COLORS.cyanGlow);
      }
      for (const z of opt.topology.zeros) {
        drawOpenLoopZeroO(ctx, map.xToPx(z.re), map.yToPx(z.im), sz, COLORS.amberLight, COLORS.amberGlow);
      }
      if (isSolvedCorrect && opt.proofLabel && !isNarrow) {
        drawCompactBadge(ctx, map.plotLeft + 4, map.plotTop + 4, opt.proofLabel, COLORS.emerald, COLORS.emerald, true);
      }
      return;
    }

    if (opt.kind === 'step-response') {
      const [tMin, tMax] = opt.tDomain;
      const [yMin, yMax] = opt.yBounds;
      const map = createPlotMapper(w, h, pad, tMin, tMax, yMin, yMax);

      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, w, h);

      // Subtle grid + y=0 and y=1 reference lines
      ctx.save();
      ctx.beginPath();
      ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
      ctx.clip();

      const y0 = Math.round(map.yToPx(0)) + 0.5;
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(map.plotLeft, y0);
      ctx.lineTo(map.plotRight, y0);
      ctx.stroke();

      const y1 = Math.round(map.yToPx(1)) + 0.5;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.42)';
      ctx.lineWidth = 1.1;
      ctx.setLineDash([3.5, 3]);
      ctx.beginPath();
      ctx.moveTo(map.plotLeft, y1);
      ctx.lineTo(map.plotRight, y1);
      ctx.stroke();
      ctx.setLineDash([]);

      // Proof envelope overlay when solved
      if (isSolvedCorrect && opt.proofKind === 'unstable-step') {
        ctx.strokeStyle = COLORS.amberLight;
        ctx.lineWidth = 1.3;
        ctx.setLineDash([3.5, 3]);
        for (const sign of [1, -1]) {
          ctx.beginPath();
          for (let i = 0; i <= 90; i++) {
            const t = tMin + ((tMax - tMin) * i) / 90;
            const py = map.yToPx(1 + sign * 0.52 * Math.exp(0.32 * t));
            if (i === 0) ctx.moveTo(map.xToPx(t), py);
            else ctx.lineTo(map.xToPx(t), py);
          }
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // Main step curve
      const strokeColor = isSolvedCorrect
        ? opt.proofKind === 'unstable-step'
          ? COLORS.coral
          : COLORS.emerald
        : COLORS.violet;
      const glowColor = isSolvedCorrect
        ? opt.proofKind === 'unstable-step'
          ? COLORS.coralGlow
          : COLORS.emeraldGlow
        : COLORS.violetGlow;

      ctx.strokeStyle = strokeColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 9;
      ctx.lineWidth = isNarrow ? 2.0 : 2.3;
      ctx.beginPath();
      for (let i = 0; i <= 180; i++) {
        const t = tMin + ((tMax - tMin) * i) / 180;
        const y = opt.fn(t);
        const px = map.xToPx(t);
        const py = map.yToPx(y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = 1;
      ctx.strokeRect(map.plotLeft + 0.5, map.plotTop + 0.5, map.plotW - 1, map.plotH - 1);
      return;
    }

    if (opt.kind === 'bode-mag') {
      const map = createLogBodeMapper(w, h, pad, 0.2, 20, -32, 16, -180, 0);
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, w, h);

      // 0 dB line
      const y0 = Math.round(map.dbToPx(0)) + 0.5;
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.42)';
      ctx.lineWidth = 1.1;
      ctx.setLineDash([3.5, 3]);
      ctx.beginPath();
      ctx.moveTo(map.plotLeft, y0);
      ctx.lineTo(map.plotRight, y0);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.save();
      ctx.beginPath();
      ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
      ctx.clip();

      const strokeColor = isSolvedCorrect ? COLORS.emerald : COLORS.cyan;
      const glowColor = isSolvedCorrect ? COLORS.emeraldGlow : COLORS.cyanGlow;
      ctx.strokeStyle = strokeColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 9;
      ctx.lineWidth = isNarrow ? 2.0 : 2.3;
      ctx.beginPath();
      const lMin = Math.log10(0.2);
      const lMax = Math.log10(20);
      for (let i = 0; i <= 150; i++) {
        const wv = Math.pow(10, lMin + ((lMax - lMin) * i) / 150);
        const px = map.wToPx(wv);
        const py = map.dbToPx(opt.dbFn(wv));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Proof resonant peak caliper when solved
      if (isSolvedCorrect && opt.proofPeakW) {
        const pxPk = map.wToPx(opt.proofPeakW);
        const pyPk = map.dbToPx(opt.proofPeakDb);
        ctx.shadowColor = COLORS.amberGlow;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = COLORS.amberLight;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pxPk, y0);
        ctx.lineTo(pxPk, pyPk);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(pxPk, pyPk, 3.2 + pulse * 1.2, 0, TWO_PI);
        ctx.fillStyle = COLORS.amberLight;
        ctx.fill();
      }
      ctx.restore();

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = 1;
      ctx.strokeRect(map.plotLeft + 0.5, map.plotTop + 0.5, map.plotW - 1, map.plotH - 1);
      return;
    }

    if (opt.kind === 'bode-phase') {
      const [degMin, degMax] = opt.degBounds;
      const map = createLogBodeMapper(w, h, pad, 0.1, 30, -20, 20, degMin, degMax);
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, w, h);

      // 0° phase reference line
      const y0 = Math.round(map.degToPx(0)) + 0.5;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.48)';
      ctx.lineWidth = 1.1;
      ctx.setLineDash([3.5, 3]);
      ctx.beginPath();
      ctx.moveTo(map.plotLeft, y0);
      ctx.lineTo(map.plotRight, y0);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.save();
      ctx.beginPath();
      ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
      ctx.clip();

      const strokeColor = isSolvedCorrect ? COLORS.emerald : COLORS.violet;
      const glowColor = isSolvedCorrect ? COLORS.emeraldGlow : COLORS.violetGlow;
      ctx.strokeStyle = strokeColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 9;
      ctx.lineWidth = isNarrow ? 2.0 : 2.3;
      ctx.beginPath();
      const lMin = Math.log10(0.1);
      const lMax = Math.log10(30);
      for (let i = 0; i <= 150; i++) {
        const wv = Math.pow(10, lMin + ((lMax - lMin) * i) / 150);
        const px = map.wToPx(wv);
        const py = map.degToPx(opt.degFn(wv));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Proof positive phase hump peak caliper when solved
      if (isSolvedCorrect && opt.proofPeakW) {
        const pxPk = map.wToPx(opt.proofPeakW);
        const pyPk = map.degToPx(opt.proofPeakDeg);
        ctx.shadowColor = COLORS.amberGlow;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = COLORS.amberLight;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pxPk, y0);
        ctx.lineTo(pxPk, pyPk);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(pxPk, pyPk, 3.2 + pulse * 1.2, 0, TWO_PI);
        ctx.fillStyle = COLORS.amberLight;
        ctx.fill();
      }
      ctx.restore();

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = 1;
      ctx.strokeRect(map.plotLeft + 0.5, map.plotTop + 0.5, map.plotW - 1, map.plotH - 1);
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
