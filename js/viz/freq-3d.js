/**
 * EIGENLAB — Interactive 3D Complex Laplace Magnitude Surface |G(s)|, Root Locus & Bode Slice Studio
 * Spline-quality Three.js WebGL visualization module (ES Modules).
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ============================================================================
// 1. ICONIC CONTROL SYSTEM PRESETS & EXACT COMPLEX-DOMAIN ANALYTICAL ENGINE
// ============================================================================

export const FREQ_PRESETS = {
  'rl-2pole': {
    id: 'rl-2pole',
    key: 'rl-2pole',
    label: '2-Pole Servo',
    mechatronicsLabel: 'DC Servo + Integrator',
    defaultK: 4.0,
    kMax: 16,
    defaultParam: 2.0,
    paramLabel: 'Pole Location p',
    paramMin: 0.6,
    paramMax: 4.0,
    paramStep: 0.1,
  },
  'rl-3pole': {
    id: 'rl-3pole',
    key: 'rl-3pole',
    label: '3-Pole Cubic Locus',
    mechatronicsLabel: '3-Stage Hydraulic Loop',
    defaultK: 8.0,
    kMax: 36,
    defaultParam: 2.0,
    paramLabel: '3rd Pole p₃',
    paramMin: 1.5,
    paramMax: 5.0,
    paramStep: 0.1,
  },
  'rl-lead': {
    id: 'rl-lead',
    key: 'rl-lead',
    label: 'Lead Compensated',
    mechatronicsLabel: 'PD / Lead-Stabilized Arm',
    defaultK: 5.0,
    kMax: 20,
    defaultParam: 1.5,
    paramLabel: 'Lead Zero z',
    paramMin: 0.4,
    paramMax: 3.5,
    paramStep: 0.1,
  },
  'bode-resonant': {
    id: 'bode-resonant',
    key: 'bode-resonant',
    label: 'Resonant Peak Mr',
    mechatronicsLabel: 'Flexible Beam Resonance',
    defaultK: 4.0,
    kMax: 12,
    defaultParam: 0.25,
    paramLabel: 'Damping ζ',
    paramMin: 0.08,
    paramMax: 1.2,
    paramStep: 0.02,
  },
  'non-min-phase': {
    id: 'non-min-phase',
    key: 'non-min-phase',
    label: 'RHP Zero (NMP)',
    mechatronicsLabel: 'Inverted Pendulum / NMP Zero',
    defaultK: 1.5,
    kMax: 8,
    defaultParam: 2.0,
    paramLabel: 'RHP Zero +z',
    paramMin: 0.8,
    paramMax: 4.0,
    paramStep: 0.1,
  },
};

const BODE_WN = 2.4;
const RAD_TO_DEG = 180 / Math.PI;
const LOG10_INV = 1 / Math.LN10;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function easeOutCubic(t) {
  const inv = 1 - clamp(t, 0, 1);
  return 1 - inv * inv * inv;
}

function easeInOutSine(t) {
  const u = clamp(t, 0, 1);
  return 0.5 - 0.5 * Math.cos(Math.PI * u);
}

function normalizeZero(v) {
  return Math.abs(v) < 1e-12 ? 0 : v;
}

function toDb(mag) {
  return 20 * Math.log(Math.max(mag, 1e-12)) * LOG10_INV;
}

// ----------------------------------------------------------------------------
// Complex Arithmetic & Machine-Precision Quadratic / Cubic Solvers
// ----------------------------------------------------------------------------

function cAbs(re, im) {
  return Math.hypot(re, im);
}

function cMul(ar, ai, br, bi) {
  return {
    re: ar * br - ai * bi,
    im: ar * bi + ai * br,
  };
}

function cDiv(ar, ai, br, bi) {
  const denom = br * br + bi * bi;
  if (denom < 1e-24) {
    return { re: 1e12, im: 0 };
  }
  return {
    re: (ar * br + ai * bi) / denom,
    im: (ai * br - ar * bi) / denom,
  };
}

/**
 * Exact quadratic solver for monic s^2 + b*s + c = 0.
 */
function solveMonicQuadratic(b, c) {
  const disc = b * b - 4 * c;
  if (disc >= 0) {
    const sqrtD = Math.sqrt(disc);
    const signB = b >= 0 ? 1 : -1;
    const q = -0.5 * (b + signB * sqrtD);
    let r1;
    let r2;
    if (Math.abs(q) > 1e-14) {
      r1 = q;
      r2 = c / q;
    } else {
      r1 = -0.5 * b;
      r2 = -0.5 * b;
    }
    if (r1 < r2) {
      const tmp = r1;
      r1 = r2;
      r2 = tmp;
    }
    return [
      { re: normalizeZero(r1), im: 0 },
      { re: normalizeZero(r2), im: 0 },
    ];
  }
  const sigma = normalizeZero(-0.5 * b);
  const omega = 0.5 * Math.sqrt(-disc);
  return [
    { re: sigma, im: omega },
    { re: sigma, im: -omega },
  ];
}

/**
 * Exact cubic solver for monic s^3 + a*s^2 + b*s + c = 0.
 * Uses Cardano / Viète closed-form solution followed by Newton-Raphson polishing
 * on the best-conditioned real root and exact quadratic deflation (< 1e-13 residual).
 */
function solveMonicCubic(a, b, c) {
  const evalCubic = (x) => ((x + a) * x + b) * x + c;
  const evalDeriv = (x) => (3 * x + 2 * a) * x + b;

  const a3 = a / 3;
  const p = b - (a * a) / 3;
  const q = (2 * a * a * a) / 27 - (a * b) / 3 + c;
  const halfQ = 0.5 * q;
  const thirdP = p / 3;
  const disc = halfQ * halfQ + thirdP * thirdP * thirdP;

  let rReal;
  if (disc > 1e-15) {
    const sqrtD = Math.sqrt(disc);
    const u = Math.cbrt(-halfQ + sqrtD);
    const v = Math.cbrt(-halfQ - sqrtD);
    rReal = u + v - a3;
  } else if (Math.abs(p) < 1e-14) {
    rReal = -Math.cbrt(q) - a3;
  } else {
    const r = 2 * Math.sqrt(Math.max(-thirdP, 0));
    const denom = Math.sqrt(Math.max(-(thirdP * thirdP * thirdP), 1e-30));
    const cosPhi = clamp(-halfQ / denom, -1, 1);
    const phi = Math.acos(cosPhi);
    const candidates = [
      r * Math.cos(phi / 3) - a3,
      r * Math.cos((phi + 2 * Math.PI) / 3) - a3,
      r * Math.cos((phi + 4 * Math.PI) / 3) - a3,
    ];
    // Pick the real root with the largest |f'(r)| for optimal deflation conditioning
    rReal = candidates[0];
    let bestSlope = Math.abs(evalDeriv(rReal));
    for (let i = 1; i < 3; i++) {
      const slope = Math.abs(evalDeriv(candidates[i]));
      if (slope > bestSlope) {
        bestSlope = slope;
        rReal = candidates[i];
      }
    }
  }

  // Polish real root with up to 4 Newton-Raphson iterations
  for (let iter = 0; iter < 4; iter++) {
    const f = evalCubic(rReal);
    const df = evalDeriv(rReal);
    if (Math.abs(df) < 1e-13) break;
    const step = f / df;
    rReal -= step;
    if (Math.abs(step) < 1e-14) break;
  }

  // Exact synthetic deflation: (s - rReal)(s^2 + b2*s + c2) = 0
  const b2 = a + rReal;
  const c2 = b + rReal * b2;
  const quadRoots = solveMonicQuadratic(b2, c2);

  return [
    { re: normalizeZero(rReal), im: 0 },
    quadRoots[0],
    quadRoots[1],
  ];
}

function solveMonicPoly(coeffs) {
  if (coeffs.length === 3) {
    return solveMonicQuadratic(coeffs[1], coeffs[2]);
  }
  if (coeffs.length === 4) {
    return solveMonicCubic(coeffs[1], coeffs[2], coeffs[3]);
  }
  return [];
}

// ----------------------------------------------------------------------------
// Preset Transfer Function Model Builder
// ----------------------------------------------------------------------------

function buildSystemModel(presetId, rawK, rawParam) {
  const key = FREQ_PRESETS[presetId] ? presetId : 'rl-3pole';
  const preset = FREQ_PRESETS[key];
  const k = clamp(Number.isFinite(rawK) ? rawK : preset.defaultK, 0, preset.kMax);
  const param = clamp(
    Number.isFinite(rawParam) ? rawParam : preset.defaultParam,
    preset.paramMin,
    preset.paramMax
  );

  let openLoopPoles = [];
  let openLoopZeros = [];
  let hasIntegrator = false;
  let criticalGainKu = Infinity;
  let exactPhaseCrossover = null;
  let charPolyForK;
  let evalG;
  let evalPhaseDeg;
  let olLatex;

  switch (key) {
    case 'rl-2pole': {
      // G(s) = 1 / (s * (s + p))
      const p = param;
      hasIntegrator = true;
      openLoopPoles = [
        { re: 0, im: 0 },
        { re: -p, im: 0 },
      ];
      openLoopZeros = [];
      charPolyForK = (gain) => [1, p, gain];
      evalG = (re, im) => {
        // s * (s + p)
        const d = cMul(re, im, re + p, im);
        return cDiv(1, 0, d.re, d.im);
      };
      evalPhaseDeg = (w) => -90 - Math.atan2(w, p) * RAD_TO_DEG;
      olLatex = `L(s) = \\frac{${k.toFixed(2)}}{s(s + ${p.toFixed(2)})}`;
      break;
    }

    case 'rl-3pole': {
      // G(s) = 1 / (s * (s + 1) * (s + p3))
      const p3 = param;
      hasIntegrator = true;
      openLoopPoles = [
        { re: 0, im: 0 },
        { re: -1, im: 0 },
        { re: -p3, im: 0 },
      ];
      openLoopZeros = [];
      criticalGainKu = p3 * (1 + p3);
      exactPhaseCrossover = Math.sqrt(p3);
      charPolyForK = (gain) => [1, 1 + p3, p3, gain];
      evalG = (re, im) => {
        const d1 = cMul(re, im, re + 1, im);
        const d2 = cMul(d1.re, d1.im, re + p3, im);
        return cDiv(1, 0, d2.re, d2.im);
      };
      evalPhaseDeg = (w) =>
        -90 - Math.atan2(w, 1) * RAD_TO_DEG - Math.atan2(w, p3) * RAD_TO_DEG;
      olLatex = `L(s) = \\frac{${k.toFixed(2)}}{s(s + 1)(s + ${p3.toFixed(2)})}`;
      break;
    }

    case 'rl-lead': {
      // G(s) = (s + z) / (s * (s + 0.5))
      const z = param;
      hasIntegrator = true;
      openLoopPoles = [
        { re: 0, im: 0 },
        { re: -0.5, im: 0 },
      ];
      openLoopZeros = [{ re: -z, im: 0 }];
      charPolyForK = (gain) => [1, 0.5 + gain, gain * z];
      evalG = (re, im) => {
        const d = cMul(re, im, re + 0.5, im);
        return cDiv(re + z, im, d.re, d.im);
      };
      evalPhaseDeg = (w) =>
        Math.atan2(w, z) * RAD_TO_DEG - 90 - Math.atan2(w, 0.5) * RAD_TO_DEG;
      olLatex = `L(s) = \\frac{${k.toFixed(2)}(s + ${z.toFixed(2)})}{s(s + 0.5)}`;
      break;
    }

    case 'bode-resonant': {
      // G(s) = wn^2 / (s^2 + 2*zeta*wn*s + wn^2), wn = 2.4
      const zeta = param;
      const wn = BODE_WN;
      const wn2 = wn * wn;
      const c1 = 2 * zeta * wn;
      hasIntegrator = false;
      openLoopPoles = solveMonicQuadratic(c1, wn2);
      openLoopZeros = [];
      charPolyForK = (gain) => [1, c1, (1 + gain) * wn2];
      evalG = (re, im) => {
        const s2 = cMul(re, im, re, im);
        const dr = s2.re + c1 * re + wn2;
        const di = s2.im + c1 * im;
        return cDiv(wn2, 0, dr, di);
      };
      evalPhaseDeg = (w) => -Math.atan2(c1 * w, wn2 - w * w) * RAD_TO_DEG;
      olLatex = `L(s) = ${k.toFixed(2)} \\cdot \\frac{${wn2.toFixed(2)}}{s^2 + ${c1.toFixed(2)}s + ${wn2.toFixed(2)}}`;
      break;
    }

    case 'non-min-phase': {
      // G(s) = (z - s) / ((s + 1)(s + 2))
      // Closed-loop char eq: s^2 + (3 - K)s + (2 + K*z) = 0
      const z = param;
      hasIntegrator = false;
      openLoopPoles = [
        { re: -1, im: 0 },
        { re: -2, im: 0 },
      ];
      openLoopZeros = [{ re: z, im: 0 }];
      criticalGainKu = 3.0;
      exactPhaseCrossover = Math.sqrt(2 + 3 * z);
      charPolyForK = (gain) => [1, 3 - gain, 2 + gain * z];
      evalG = (re, im) => {
        const d = cMul(re + 1, im, re + 2, im);
        return cDiv(z - re, -im, d.re, d.im);
      };
      evalPhaseDeg = (w) =>
        -Math.atan2(w, z) * RAD_TO_DEG -
        Math.atan2(w, 1) * RAD_TO_DEG -
        Math.atan2(w, 2) * RAD_TO_DEG;
      olLatex = `L(s) = \\frac{${k.toFixed(2)}(${z.toFixed(2)} - s)}{(s + 1)(s + 2)}`;
      break;
    }

    default:
      break;
  }

  return {
    presetId: key,
    preset,
    k,
    param,
    hasIntegrator,
    openLoopPoles,
    openLoopZeros,
    criticalGainKu,
    exactPhaseCrossover,
    charPolyForK,
    evalG,
    evalPhaseDeg,
    olLatex,
  };
}

// ----------------------------------------------------------------------------
// Continuous Root Locus Branch Tracking (Permutation-Matched Across K)
// ----------------------------------------------------------------------------

const PERMS_2 = [
  [0, 1],
  [1, 0],
];
const PERMS_3 = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

function matchRootsToPrevious(prevRoots, nextRoots) {
  const n = prevRoots.length;
  const perms = n === 3 ? PERMS_3 : PERMS_2;
  let bestPerm = perms[0];
  let bestCost = Infinity;

  for (let p = 0; p < perms.length; p++) {
    const perm = perms[p];
    let cost = 0;
    for (let i = 0; i < n; i++) {
      const dr = nextRoots[perm[i]].re - prevRoots[i].re;
      const di = nextRoots[perm[i]].im - prevRoots[i].im;
      cost += dr * dr + di * di;
    }
    if (cost < bestCost) {
      bestCost = cost;
      bestPerm = perm;
    }
  }

  const ordered = new Array(n);
  for (let i = 0; i < n; i++) {
    ordered[i] = nextRoots[bestPerm[i]];
  }
  return ordered;
}

function buildLocusGainGrid(model) {
  const kMax = model.preset.kMax;
  const samples = new Set([0, kMax]);

  // Smooth power-spaced baseline sweep (dense near K = 0 where breakaways happen)
  const N = 150;
  for (let i = 1; i < N; i++) {
    const u = i / N;
    const gain = kMax * Math.pow(u, 1.55);
    samples.add(gain);
  }

  // Inject extra resolution around known breakaway / critical crossover points
  const keyGains = [];
  if (model.presetId === 'rl-2pole') {
    keyGains.push(0.25 * model.param * model.param);
  } else if (model.presetId === 'rl-3pole') {
    // Breakaway between 0 and -1: d/ds(s^3 + (1+p3)s^2 + p3*s) = 3s^2 + 2(1+p3)s + p3 = 0
    const a = 3;
    const b = 2 * (1 + model.param);
    const c = model.param;
    const sBreak = (-b + Math.sqrt(Math.max(b * b - 4 * a * c, 0))) / (2 * a);
    const kBreak = -sBreak * (sBreak + 1) * (sBreak + model.param);
    keyGains.push(kBreak, model.criticalGainKu);
  } else if (model.presetId === 'rl-lead') {
    const z = model.param;
    if (z > 0.5) {
      const r = Math.sqrt(z * (z - 0.5));
      const s1 = -z + r;
      const s2 = -z - r;
      keyGains.push((-s1 * (s1 + 0.5)) / (s1 + z), (-s2 * (s2 + 0.5)) / (s2 + z));
    }
  } else if (model.presetId === 'non-min-phase') {
    keyGains.push(model.criticalGainKu);
    const z = model.param;
    // Break-in on positive real axis where (3-K)^2 = 4(2+Kz) => K^2 - (6+4z)K + 1 = 0
    const B = 6 + 4 * z;
    const disc = B * B - 4;
    if (disc >= 0) {
      keyGains.push(0.5 * (B - Math.sqrt(disc)), 0.5 * (B + Math.sqrt(disc)));
    }
  }

  for (const kg of keyGains) {
    if (Number.isFinite(kg) && kg > 0 && kg < kMax) {
      samples.add(kg);
      const epsList = [-0.08, -0.025, -0.005, 0.005, 0.025, 0.08];
      for (const eps of epsList) {
        const val = kg + eps * Math.max(1, kg * 0.2);
        if (val > 0 && val < kMax) samples.add(val);
      }
    }
  }

  return Array.from(samples).sort((x, y) => x - y);
}

function computeRootLocusBranches(model) {
  const kGrid = buildLocusGainGrid(model);
  const startRoots = solveMonicPoly(model.charPolyForK(0));
  const n = startRoots.length;
  const branches = Array.from({ length: n }, () => []);

  let prev = startRoots;
  for (let i = 0; i < n; i++) {
    branches[i].push({ k: 0, re: prev[i].re, im: prev[i].im });
  }

  for (let step = 1; step < kGrid.length; step++) {
    const gain = kGrid[step];
    const rawRoots = solveMonicPoly(model.charPolyForK(gain));
    const ordered = matchRootsToPrevious(prev, rawRoots);
    for (let i = 0; i < n; i++) {
      branches[i].push({ k: gain, re: ordered[i].re, im: ordered[i].im });
    }
    prev = ordered;
  }

  return branches;
}

// ----------------------------------------------------------------------------
// Exact Bode Analysis: Gain/Phase Crossovers, Margins & Resonant Peak Mr
// ----------------------------------------------------------------------------

function computeBodeMetrics(model) {
  const { k, evalG, evalPhaseDeg, exactPhaseCrossover, presetId, param } = model;

  const evalLoopMag = (w) => {
    const g = evalG(0, w);
    return k * cAbs(g.re, g.im);
  };

  const evalClosedLoopMag = (w) => {
    const g = evalG(0, w);
    const lr = k * g.re;
    const li = k * g.im;
    const cl = cDiv(lr, li, 1 + lr, li);
    return cAbs(cl.re, cl.im);
  };

  // 1. Standard Bode frequency sweep omega in [0.1, 10] (220 log-spaced points)
  const SWEEP_N = 220;
  const wMin = 0.1;
  const wMax = 10.0;
  const logMin = Math.log(wMin);
  const logMax = Math.log(wMax);
  const bodeSweep = new Array(SWEEP_N);

  let maxOlMag = 0;
  let maxOlFreq = wMin;
  let maxClMag = 0;
  let maxClFreq = wMin;

  for (let i = 0; i < SWEEP_N; i++) {
    const u = i / (SWEEP_N - 1);
    const omega = Math.exp(logMin + u * (logMax - logMin));
    const mag = evalLoopMag(omega);
    const magDb = toDb(mag);
    const phaseDeg = evalPhaseDeg(omega);
    const clMag = evalClosedLoopMag(omega);
    const clMagDb = toDb(clMag);

    bodeSweep[i] = { omega, mag, magDb, phaseDeg, clMag, clMagDb };

    if (mag > maxOlMag) {
      maxOlMag = mag;
      maxOlFreq = omega;
    }
    if (clMag > maxClMag) {
      maxClMag = clMag;
      maxClFreq = omega;
    }
  }

  // 2. Exact Gain Crossover omega_gc where |K*G(j*omega)| = 1 (downward crossing preferred)
  let gainCrossover = null;
  if (k > 1e-9) {
    const SCAN_N = 480;
    const scanLogMin = Math.log(1e-3);
    const scanLogMax = Math.log(1e3);
    let prevW = Math.exp(scanLogMin);
    let prevDiff = evalLoopMag(prevW) - 1;
    let bestBracket = null;

    for (let i = 1; i <= SCAN_N; i++) {
      const w = Math.exp(scanLogMin + (i / SCAN_N) * (scanLogMax - scanLogMin));
      const diff = evalLoopMag(w) - 1;
      if (prevDiff >= 0 && diff <= 0) {
        // Downward crossing through 0 dB (primary gain crossover)
        bestBracket = [prevW, w];
      } else if (!bestBracket && prevDiff <= 0 && diff >= 0) {
        bestBracket = [prevW, w];
      }
      prevW = w;
      prevDiff = diff;
    }

    if (bestBracket) {
      let lo = bestBracket[0];
      let hi = bestBracket[1];
      let fLo = evalLoopMag(lo) - 1;
      for (let iter = 0; iter < 42; iter++) {
        const mid = 0.5 * (lo + hi);
        const fMid = evalLoopMag(mid) - 1;
        if (Math.abs(fMid) < 1e-12) {
          lo = mid;
          hi = mid;
          break;
        }
        if ((fLo >= 0 && fMid >= 0) || (fLo <= 0 && fMid <= 0)) {
          lo = mid;
          fLo = fMid;
        } else {
          hi = mid;
        }
      }
      gainCrossover = 0.5 * (lo + hi);
    }
  }

  const phaseMarginDeg =
    gainCrossover !== null ? 180 + evalPhaseDeg(gainCrossover) : Infinity;

  // 3. Exact Phase Crossover omega_pc where angle(K*G(j*omega)) = -180 deg & Gain Margin
  let phaseCrossover = exactPhaseCrossover;
  if (phaseCrossover === null) {
    const SCAN_N = 360;
    const scanLogMin = Math.log(1e-3);
    const scanLogMax = Math.log(1e3);
    let prevW = Math.exp(scanLogMin);
    let prevVal = evalPhaseDeg(prevW) + 180;
    for (let i = 1; i <= SCAN_N; i++) {
      const w = Math.exp(scanLogMin + (i / SCAN_N) * (scanLogMax - scanLogMin));
      const val = evalPhaseDeg(w) + 180;
      if ((prevVal > 0 && val <= 0) || (prevVal < 0 && val >= 0)) {
        let lo = prevW;
        let hi = w;
        let fLo = prevVal;
        for (let iter = 0; iter < 40; iter++) {
          const mid = 0.5 * (lo + hi);
          const fMid = evalPhaseDeg(mid) + 180;
          if ((fLo >= 0 && fMid >= 0) || (fLo <= 0 && fMid <= 0)) {
            lo = mid;
            fLo = fMid;
          } else {
            hi = mid;
          }
        }
        phaseCrossover = 0.5 * (lo + hi);
        break;
      }
      prevW = w;
      prevVal = val;
    }
  }

  let gainMarginDb = Infinity;
  if (phaseCrossover !== null && k > 1e-9) {
    const magAtPc = evalLoopMag(phaseCrossover);
    gainMarginDb = magAtPc > 1e-12 ? -toDb(magAtPc) : Infinity;
  }

  // 4. Resonant Peak Mr (in dB) & exact resonant frequency omega_r
  let resonantPeakDb;
  let resonantFreq;
  if (presetId === 'bode-resonant') {
    // Exact open-loop Bode resonant peak matching the towering Amber Bode slice
    if (param < Math.SQRT1_2) {
      const wr = BODE_WN * Math.sqrt(1 - 2 * param * param);
      const peakMag = evalLoopMag(wr);
      resonantPeakDb = toDb(peakMag);
      resonantFreq = wr;
    } else {
      resonantPeakDb = toDb(maxOlMag);
      resonantFreq = maxOlFreq;
    }
  } else {
    // Closed-loop resonant peak Mr = max |T(jw)| over omega in [0.1, 10]
    // Refine locally around maxClFreq using golden-section search for high precision
    let a = Math.max(wMin, maxClFreq * 0.85);
    let b = Math.min(wMax, maxClFreq * 1.15);
    const phi = 0.6180339887498949;
    for (let iter = 0; iter < 24; iter++) {
      const c = b - phi * (b - a);
      const d = a + phi * (b - a);
      if (evalClosedLoopMag(c) > evalClosedLoopMag(d)) {
        b = d;
      } else {
        a = c;
      }
    }
    const refinedFreq = 0.5 * (a + b);
    const refinedMag = Math.max(maxClMag, evalClosedLoopMag(refinedFreq));
    resonantPeakDb = Math.min(60, toDb(refinedMag));
    resonantFreq = refinedFreq;
  }

  return {
    bodeSweep,
    gainCrossover,
    phaseCrossover,
    phaseMarginDeg,
    gainMarginDb,
    resonantPeakDb,
    resonantFreq,
  };
}

function formatClosedLoopPolesLatex(poles) {
  const realPoles = [];
  const complexUpper = [];

  for (let i = 0; i < poles.length; i++) {
    const p = poles[i];
    if (Math.abs(p.im) < 1e-4) {
      realPoles.push(normalizeZero(p.re));
    } else if (p.im > 0) {
      complexUpper.push({ re: normalizeZero(p.re), im: Math.abs(p.im) });
    }
  }

  realPoles.sort((a, b) => b - a);
  complexUpper.sort((a, b) => b.re - a.re);

  const parts = [];
  let idx = 1;

  for (let i = 0; i < realPoles.length; i++) {
    parts.push(`s_{${idx}} = ${realPoles[i].toFixed(2)}`);
    idx += 1;
  }
  for (let i = 0; i < complexUpper.length; i++) {
    const c = complexUpper[i];
    parts.push(`s_{${idx},${idx + 1}} = ${c.re.toFixed(2)} \\pm ${c.im.toFixed(2)}j`);
    idx += 2;
  }

  return parts.join(',\\; ');
}

/**
 * Full exact analysis of the selected frequency-domain / Root Locus control system.
 */
export function analyzeFreqSystem({ presetId = 'rl-3pole', k, param } = {}) {
  const key = FREQ_PRESETS[presetId] ? presetId : 'rl-3pole';
  const preset = FREQ_PRESETS[key];
  const resolvedK = Number.isFinite(k) ? k : preset.defaultK;
  const resolvedParam = Number.isFinite(param) ? param : preset.defaultParam;

  const model = buildSystemModel(key, resolvedK, resolvedParam);
  const charPoly = model.charPolyForK(model.k);
  const closedLoopPoles = solveMonicPoly(charPoly);
  const locusBranches = computeRootLocusBranches(model);
  const bode = computeBodeMetrics(model);

  const maxReal = closedLoopPoles.reduce((acc, p) => Math.max(acc, p.re), -Infinity);
  let stability = 'STABLE';
  if (maxReal > 1e-4) {
    stability = 'UNSTABLE';
  } else if (maxReal >= -1e-4) {
    stability = 'MARGINAL';
  }

  return {
    presetId: model.presetId,
    label: preset.label,
    mechatronicsLabel: preset.mechatronicsLabel,
    k: model.k,
    kMax: preset.kMax,
    param: model.param,
    paramLabel: preset.paramLabel,
    paramMin: preset.paramMin,
    paramMax: preset.paramMax,
    paramStep: preset.paramStep,
    openLoopPoles: model.openLoopPoles,
    openLoopZeros: model.openLoopZeros,
    closedLoopPoles,
    charPoly,
    locusBranches,
    bodeSweep: bode.bodeSweep,
    gainCrossover: bode.gainCrossover,
    phaseCrossover: bode.phaseCrossover,
    phaseMarginDeg: bode.phaseMarginDeg,
    gainMarginDb: bode.gainMarginDb,
    resonantPeakDb: bode.resonantPeakDb,
    resonantFreq: bode.resonantFreq,
    criticalGainKu: model.criticalGainKu,
    stability,
    olLatex: model.olLatex,
    clPolesLatex: formatClosedLoopPolesLatex(closedLoopPoles),
  };
}

// ============================================================================
// 2. SPATIAL CONSTANTS, STUDIO PALETTE & PROCEDURAL GEOMETRY UTILITIES
// ============================================================================

const SIGMA_MIN = -4.5;
const SIGMA_MAX = 1.5;
const SIGMA_CENTER = -1.5; // (SIGMA_MIN + SIGMA_MAX) / 2
const OMEGA_MIN = -4.2;
const OMEGA_MAX = 4.2;

const SCALE_SIGMA = 1.12; // 6.0 span -> x in [-3.36, +3.36]; sigma = 0 -> x = +1.68
const SCALE_OMEGA = 0.72; // 8.4 span -> z in [-3.024, +3.024]; +omega maps to -Z so front view runs left-to-right!

const PLINTH_WIDTH = 7.45;
const PLINTH_DEPTH = 6.65;
const PLINTH_HEIGHT = 0.28;
const PLINTH_TOP_Y = -0.02;

const SURFACE_H_SCALE = 0.88;
const SURFACE_SOFT_KNEE = 2.25;
const SURFACE_SOFT_CAP = 0.9; // Smooth crown ceiling at 2.25 + 0.90 = 3.15
const WALL_HEIGHT = 3.35;

const GRID_U = 96; // Exact column aligns with sigma = 0 (u = 72 when span is 6.0 and 0 is at 75%!)
const GRID_V = 96;

const COLORS = {
  studioBg: 0x0b0d12,
  cyan: 0x22d3ee,
  cyanLight: 0x67e8f9,
  cyanDeep: 0x0891b2,
  amber: 0xf59e0b,
  amberLight: 0xfcd34d,
  amberDeep: 0xd97706,
  violet: 0xa78bfa,
  violetLight: 0xc4b5fd,
  violetDeep: 0x7c3aed,
  emerald: 0x34d399,
  emeraldLight: 0x6ee7b7,
  emeraldDeep: 0x059669,
  coral: 0xfb7185,
  coralDeep: 0xe11d48,
  slateGlass: 0x0d1526,
  white: 0xf8fafc,
};

const UP_VEC = new THREE.Vector3(0, 1, 0);
const _tmpDelta = new THREE.Vector3();
const _tmpMid = new THREE.Vector3();
const _tmpDir = new THREE.Vector3();
const _tmpQuat = new THREE.Quaternion();

function sigmaToX(sigma) {
  return (sigma - SIGMA_CENTER) * SCALE_SIGMA;
}

function omegaToZ(omega) {
  return -omega * SCALE_OMEGA;
}

function magToY(mag) {
  const safeMag = Number.isFinite(mag) ? Math.max(0, mag) : 1e6;
  const raw = SURFACE_H_SCALE * Math.log1p(safeMag);
  if (raw <= SURFACE_SOFT_KNEE) return raw;
  return SURFACE_SOFT_KNEE + SURFACE_SOFT_CAP * Math.tanh((raw - SURFACE_SOFT_KNEE) / SURFACE_SOFT_CAP);
}

const UNITY_GAIN_Y = magToY(1.0); // 0 dB line height = 0.88 * ln(2) ≈ 0.610
const JW_WALL_X = sigmaToX(0); // +1.68

function alignCylinderBetween(mesh, pA, pB, radius) {
  _tmpDelta.subVectors(pB, pA);
  const len = _tmpDelta.length();
  if (!Number.isFinite(len) || len < 1e-4 || radius <= 0) {
    mesh.visible = false;
    return false;
  }
  _tmpDir.copy(_tmpDelta).divideScalar(len);
  _tmpMid.addVectors(pA, pB).multiplyScalar(0.5);
  _tmpQuat.setFromUnitVectors(UP_VEC, _tmpDir);

  mesh.visible = true;
  mesh.position.copy(_tmpMid);
  mesh.quaternion.copy(_tmpQuat);
  mesh.scale.set(radius, len, radius);
  return true;
}

function createRoundedRectShape(width, depth, radius) {
  const hw = width * 0.5;
  const hd = depth * 0.5;
  const r = Math.min(radius, hw * 0.9, hd * 0.9);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);
  shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  return shape;
}

function createPlinthSlabGeometry(width, depth, height, cornerRadius, bevel) {
  const innerW = Math.max(width - bevel * 2, 0.2);
  const innerD = Math.max(depth - bevel * 2, 0.2);
  const coreH = Math.max(height - bevel * 2, 0.04);
  const shape = createRoundedRectShape(innerW, innerD, Math.max(cornerRadius - bevel, 0.05));
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: coreH,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 16,
  });
  geom.rotateX(Math.PI / 2);
  geom.computeBoundingBox();
  if (geom.boundingBox) {
    geom.translate(0, -geom.boundingBox.max.y, 0);
  }
  geom.computeVertexNormals();
  return geom;
}

function createPlinthRimGeometry(width, depth, cornerRadius, tubeRadius = 0.015) {
  const shape = createRoundedRectShape(width, depth, cornerRadius);
  const pts2D = shape.getSpacedPoints(132);
  const pts3D = [];
  for (let i = 0; i < pts2D.length - 1; i++) {
    pts3D.push(new THREE.Vector3(pts2D[i].x, 0.006, pts2D[i].y));
  }
  const curve = new THREE.CatmullRomCurve3(pts3D, true, 'centripetal', 0.5);
  return new THREE.TubeGeometry(curve, 144, tubeRadius, 8, true);
}

function createVerticalGlassPlateGeometry(widthZ, heightY, thicknessX, cornerRadius, bevel) {
  const innerW = Math.max(widthZ - bevel * 2, 0.2);
  const innerH = Math.max(heightY - bevel * 2, 0.2);
  const coreT = Math.max(thicknessX - bevel * 2, 0.01);
  const shape = createRoundedRectShape(innerW, innerH, Math.max(cornerRadius - bevel, 0.04));
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: coreT,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 14,
  });
  geom.center();
  geom.rotateY(Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

function createVerticalRimGeometry(widthZ, heightY, cornerRadius, tubeRadius = 0.014) {
  const shape = createRoundedRectShape(widthZ, heightY, cornerRadius);
  const pts2D = shape.getSpacedPoints(116);
  const pts3D = [];
  for (let i = 0; i < pts2D.length - 1; i++) {
    pts3D.push(new THREE.Vector3(0, pts2D[i].y, pts2D[i].x));
  }
  const curve = new THREE.CatmullRomCurve3(pts3D, true, 'centripetal', 0.5);
  return new THREE.TubeGeometry(curve, 128, tubeRadius, 8, true);
}

function createSafeTubeGeometry(points, tubularSegments, radius, radialSegments) {
  const cleaned = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) continue;
    if (cleaned.length === 0 || cleaned[cleaned.length - 1].distanceToSquared(p) > 1e-8) {
      cleaned.push(p);
    }
  }
  if (cleaned.length < 2) {
    return new THREE.BufferGeometry();
  }
  const curve = new THREE.CatmullRomCurve3(cleaned, false, 'centripetal', 0.5);
  return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
}

/**
 * Create a smooth Root Locus TubeGeometry colored by stability half-plane
 * (Luminous Emerald/Violet in LHP -> Urgent Coral in RHP).
 */
function createColoredLocusTubeGeometry(points, radius = 0.024, radialSegments = 8) {
  const cleaned = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) continue;
    if (cleaned.length === 0 || cleaned[cleaned.length - 1].distanceToSquared(p) > 1e-6) {
      cleaned.push(p);
    }
  }
  if (cleaned.length < 2) {
    return new THREE.BufferGeometry();
  }

  const tubularSegments = clamp(cleaned.length * 2, 28, 160);
  const curve = new THREE.CatmullRomCurve3(cleaned, false, 'centripetal', 0.5);
  const geom = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);

  const posAttr = geom.getAttribute('position');
  const count = posAttr.count;
  const colors = new Float32Array(count * 3);

  const cEmerald = new THREE.Color(COLORS.emerald);
  const cViolet = new THREE.Color(COLORS.violetLight);
  const cCoral = new THREE.Color(COLORS.coral);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const wx = posAttr.getX(i);
    const wz = posAttr.getZ(i);
    const sigma = wx / SCALE_SIGMA + SIGMA_CENTER;
    const absOmega = Math.abs(wz / SCALE_OMEGA);

    if (sigma > 0.02) {
      const rhpMix = clamp(sigma / 0.5, 0.35, 1.0);
      tmpColor.copy(cEmerald).lerp(cCoral, rhpMix);
    } else if (sigma > -0.08) {
      const edgeMix = clamp((sigma + 0.08) / 0.1, 0, 1);
      tmpColor.copy(cEmerald).lerp(cCoral, edgeMix * 0.65);
    } else {
      // Subtle Emerald-to-Violet gradient as branches rise into complex conjugate space
      const complexMix = clamp(absOmega / 3.2, 0, 0.55);
      tmpColor.copy(cEmerald).lerp(cViolet, complexMix);
    }

    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }

  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geom;
}

/**
 * Translucent glowing Amber vertical curtain dropping from the Bode slice curve down to y = 0.
 */
function createBodeCurtainGeometry(points, baseY = 0.005) {
  const n = points.length;
  if (n < 2) return new THREE.BufferGeometry();

  const positions = new Float32Array(n * 2 * 3);
  const colors = new Float32Array(n * 2 * 3);
  const indices = new Uint32Array((n - 1) * 6);

  const cBase = new THREE.Color(0x451a03);
  const cMid = new THREE.Color(COLORS.amber);
  const cTop = new THREE.Color(COLORS.amberLight);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < n; i++) {
    const p = points[i];
    const idx = i * 6;

    positions[idx] = p.x;
    positions[idx + 1] = baseY;
    positions[idx + 2] = p.z;
    colors[idx] = cBase.r;
    colors[idx + 1] = cBase.g;
    colors[idx + 2] = cBase.b;

    positions[idx + 3] = p.x;
    positions[idx + 4] = p.y;
    positions[idx + 5] = p.z;

    const hFrac = clamp(p.y / 2.6, 0, 1);
    tmpColor.copy(cMid).lerp(cTop, hFrac);
    const glow = 0.45 + 0.55 * hFrac;
    colors[idx + 3] = tmpColor.r * glow;
    colors[idx + 4] = tmpColor.g * glow;
    colors[idx + 5] = tmpColor.b * glow;
  }

  let ptr = 0;
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices[ptr++] = a;
    indices[ptr++] = b;
    indices[ptr++] = c;
    indices[ptr++] = b;
    indices[ptr++] = d;
    indices[ptr++] = c;
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));
  geom.computeVertexNormals();
  return geom;
}

function createRadialGlowTexture(innerRgba, midRgba, outerRgba) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
    grad.addColorStop(0, innerRgba);
    grad.addColorStop(0.45, midRgba);
    grad.addColorStop(1, outerRgba);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Crisp high-DPI floating editorial typography badge sprite.
 */
function createTextSprite(text, { color = '#cbd5e1', bg = null, fontSize = 30, scale = 0.5 } = {}) {
  const canvas = document.createElement('canvas');
  const padX = 22;
  const padY = 12;
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  let aspect = 512 / 96;

  if (ctx) {
    ctx.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    const measured = Math.ceil(ctx.measureText(text).width);
    const w = clamp(measured + padX * 2, 96, 640);
    const h = fontSize + padY * 2;
    canvas.width = w;
    canvas.height = h;
    aspect = w / h;

    ctx.clearRect(0, 0, w, h);
    if (bg) {
      const r = h * 0.35;
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(w - r, 0);
      ctx.quadraticCurveTo(w, 0, w, r);
      ctx.lineTo(w, h - r);
      ctx.quadraticCurveTo(w, h, w - r, h);
      ctx.lineTo(r, h);
      ctx.quadraticCurveTo(0, h, 0, h - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.fill();
    }

    ctx.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w * 0.5, h * 0.52);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    opacity: 0.9,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scale * aspect, scale, 1);
  return { sprite, texture: tex, material: mat };
}

function disposeGroupChildren(group, sharedMaterials = new Set(), sharedGeometries = new Set()) {
  const disposedGeos = new Set();
  const disposedMats = new Set();
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    child.traverse((node) => {
      if (node.geometry && !sharedGeometries.has(node.geometry) && !disposedGeos.has(node.geometry)) {
        disposedGeos.add(node.geometry);
        node.geometry.dispose();
      }
      if (node.material) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        for (const m of mats) {
          if (m && !sharedMaterials.has(m) && !disposedMats.has(m)) {
            disposedMats.add(m);
            if (m.map) m.map.dispose();
            m.dispose();
          }
        }
      }
    });
  }
}

// ============================================================================
// 3. FREQ 3D STUDIO CLASS
// ============================================================================

export class Freq3DStudio {
  constructor(options = {}) {
    this.onTelemetry =
      typeof options.onTelemetry === 'function'
        ? options.onTelemetry
        : typeof options.onChange === 'function'
          ? options.onChange
          : null;

    this.presetId = FREQ_PRESETS[options.presetId] ? options.presetId : 'rl-3pole';
    const initPreset = FREQ_PRESETS[this.presetId];

    this.k = Number.isFinite(options.k)
      ? clamp(options.k, 0, initPreset.kMax)
      : initPreset.defaultK;
    this.param = Number.isFinite(options.param)
      ? clamp(options.param, initPreset.paramMin, initPreset.paramMax)
      : initPreset.defaultParam;

    this.showLocus = options.showLocus ?? true;
    this.mechatronicsLens = options.mechatronicsLens ?? false;
    this.cameraPreset = '3d';

    // Cached analysis & normalized |G(s)| grid for ultra-fast 60fps gain scrubs
    this._analysis = null;
    this._model = null;
    this._baseMagGrid = new Float32Array((GRID_U + 1) * (GRID_V + 1));
    this._gridSigmas = new Float32Array(GRID_U + 1);
    this._gridOmegas = new Float32Array(GRID_V + 1);
    for (let iu = 0; iu <= GRID_U; iu++) {
      this._gridSigmas[iu] = SIGMA_MIN + (iu / GRID_U) * (SIGMA_MAX - SIGMA_MIN);
    }
    for (let iv = 0; iv <= GRID_V; iv++) {
      this._gridOmegas[iv] = OMEGA_MIN + (iv / GRID_V) * (OMEGA_MAX - OMEGA_MIN);
    }

    // Three.js core handles
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.bloomPass = null;
    this.controls = null;
    this.envRT = null;

    // Scene hierarchy groups
    this._stageGroup = null;
    this._plinthGroup = null;
    this._sliceWallGroup = null;
    this._surfaceGroup = null;
    this._bodeGroup = null;
    this._olMarkersGroup = null;
    this._locusGroup = null;
    this._clPolesGroup = null;
    this._mechatronicsGroup = null;

    // Persistent high-frequency dynamic meshes
    this._surfaceMesh = null;
    this._surfaceGeom = null;
    this._wireframeLines = null;
    this._wireframeGeom = null;
    this._wireVertexMap = null;

    // Animated micro-detail handles
    this._plinthRimMat = null;
    this._sliceRimMat = null;
    this._clPoleEntries = [];
    this._pmReticleMesh = null;
    this._stabilityBarMat = null;

    // Shared resource registries for leak-free cleanup
    this._sharedGeometries = new Set();
    this._sharedMaterials = new Set();
    this._ownedTextures = [];

    // Animation & lifecycle handles
    this._rafId = null;
    this._resizeObserver = null;
    this._clock = new THREE.Clock();
    this._initialized = false;
    this._disposed = false;

    this._camTransition = null;
    this._sweepAnim = null;

    this._onAnimate = this._animate.bind(this);
    this._onControlsStart = () => {
      this._camTransition = null;
    };

    this._recomputeModelAndAnalysis(true);
  }

  _getPreset() {
    return FREQ_PRESETS[this.presetId] || FREQ_PRESETS['rl-3pole'];
  }

  _applyOptions(options = {}) {
    if (typeof options.onTelemetry === 'function') {
      this.onTelemetry = options.onTelemetry;
    } else if (typeof options.onChange === 'function') {
      this.onTelemetry = options.onChange;
    }

    if (options.presetId && FREQ_PRESETS[options.presetId]) {
      this.presetId = options.presetId;
      const p = FREQ_PRESETS[this.presetId];
      this.k = Number.isFinite(options.k) ? clamp(options.k, 0, p.kMax) : p.defaultK;
      this.param = Number.isFinite(options.param)
        ? clamp(options.param, p.paramMin, p.paramMax)
        : p.defaultParam;
    } else {
      const p = this._getPreset();
      if (Number.isFinite(options.k)) this.k = clamp(options.k, 0, p.kMax);
      if (Number.isFinite(options.param)) this.param = clamp(options.param, p.paramMin, p.paramMax);
    }

    if (typeof options.showLocus === 'boolean') {
      this.showLocus = options.showLocus;
    }
    if (typeof options.mechatronicsLens === 'boolean') {
      this.mechatronicsLens = options.mechatronicsLens;
    }
  }

  _recomputeModelAndAnalysis(recomputeBaseGrid = true) {
    this._model = buildSystemModel(this.presetId, this.k, this.param);
    this._analysis = analyzeFreqSystem({
      presetId: this.presetId,
      k: this.k,
      param: this.param,
    });

    if (recomputeBaseGrid) {
      const evalG = this._model.evalG;
      const cols = GRID_U + 1;
      for (let iv = 0; iv <= GRID_V; iv++) {
        const w = this._gridOmegas[iv];
        const rowOffset = iv * cols;
        for (let iu = 0; iu <= GRID_U; iu++) {
          const s = this._gridSigmas[iu];
          const g = evalG(s, w);
          this._baseMagGrid[rowOffset + iu] = cAbs(g.re, g.im);
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  init(container, options = {}) {
    if (!container) return this;
    if (this._initialized) {
      this.dispose();
    }
    this._disposed = false;
    this.container = container;

    if (options && Object.keys(options).length > 0) {
      this._applyOptions(options);
    }
    this._recomputeModelAndAnalysis(true);

    const width = Math.max(container.clientWidth || 800, 1);
    const height = Math.max(container.clientHeight || 520, 1);

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(COLORS.studioBg, 0.017);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);

    // 2. Renderer (Spline-quality physical rendering standards)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(COLORS.studioBg, 0);

    const dom = this.renderer.domElement;
    dom.style.display = 'block';
    dom.style.width = '100%';
    dom.style.height = '100%';
    dom.style.outline = 'none';
    container.appendChild(dom);

    // 3. Studio Reflections via PMREMGenerator + RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    this.envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRT.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 4. Post-Processing: EffectComposer + RenderPass + UnrealBloomPass
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.composer.setSize(width, height);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.24, 0.35, 0.88);
    this.composer.addPass(this.bloomPass);

    // 5. Damped OrbitControls
    this.controls = new OrbitControls(this.camera, dom);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI * 0.58;
    this.controls.minPolarAngle = 0.08;
    this.controls.minDistance = 4.6;
    this.controls.maxDistance = 24.0;
    this.controls.rotateSpeed = 0.78;
    this.controls.zoomSpeed = 0.85;
    this.controls.panSpeed = 0.65;
    this.controls.addEventListener('start', this._onControlsStart);

    // 6. Lighting & Shared GPU Resources
    this._setupLighting();
    this._createSharedResources();

    // 7. Build Scene Hierarchy
    this._stageGroup = new THREE.Group();
    this.scene.add(this._stageGroup);

    this._plinthGroup = new THREE.Group();
    this._sliceWallGroup = new THREE.Group();
    this._surfaceGroup = new THREE.Group();
    this._bodeGroup = new THREE.Group();
    this._olMarkersGroup = new THREE.Group();
    this._locusGroup = new THREE.Group();
    this._clPolesGroup = new THREE.Group();
    this._mechatronicsGroup = new THREE.Group();

    this._stageGroup.add(
      this._plinthGroup,
      this._sliceWallGroup,
      this._surfaceGroup,
      this._bodeGroup,
      this._olMarkersGroup,
      this._locusGroup,
      this._clPolesGroup,
      this._mechatronicsGroup
    );

    this._buildPlinthAndAxes();
    this._buildJwSliceWall();
    this._buildPersistentSurfaceMesh();
    this._updateSurfaceGeometry();
    this._rebuildBodeSlice();
    this._rebuildOpenLoopMarkers();
    this._rebuildRootLocusBranches();
    this._rebuildClosedLoopPoleSpheres();
    this._rebuildMechatronicsOverlay();

    this._locusGroup.visible = this.showLocus;
    this._clPolesGroup.visible = this.showLocus;
    this._mechatronicsGroup.visible = this.mechatronicsLens;

    this._applyCameraPresetImmediate(this.cameraPreset);

    // 8. Responsive ResizeObserver
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => this.resize());
      this._resizeObserver.observe(container);
    }

    this._initialized = true;
    this._clock.start();
    this._emitTelemetry();
    this._animate();
    return this;
  }

  _setupLighting() {
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.85);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xf8fafc, 1.85);
    key.position.set(7.5, 11.0, 8.5);
    this.scene.add(key);

    const rimCyan = new THREE.DirectionalLight(COLORS.cyan, 1.1);
    rimCyan.position.set(-8.5, 5.5, -6.5);
    this.scene.add(rimCyan);

    const warmAmber = new THREE.PointLight(COLORS.amber, 2.2, 18, 1.5);
    warmAmber.position.set(4.5, 3.2, 2.2);
    this.scene.add(warmAmber);

    const violetUnder = new THREE.PointLight(COLORS.violet, 1.5, 16, 1.6);
    violetUnder.position.set(-3.2, 2.4, -3.5);
    this.scene.add(violetUnder);
  }

  _createSharedResources() {
    this._unitCylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 16, 1);
    this._unitSphereGeo = new THREE.SphereGeometry(1, 24, 24);
    this._unitTorusGeo = new THREE.TorusGeometry(1, 0.14, 12, 36);
    this._unitConeGeo = new THREE.ConeGeometry(1, 1, 14);
    this._sharedGeometries.add(
      this._unitCylinderGeo,
      this._unitSphereGeo,
      this._unitTorusGeo,
      this._unitConeGeo
    );

    // Metallic Cyan Open-Loop Pole 'x' Material
    this._matOlPole = new THREE.MeshStandardMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.35,
      roughness: 0.18,
      metalness: 0.6,
    });

    // Translucent Spire Core Filament Material
    this._matSpireCore = new THREE.MeshBasicMaterial({
      color: COLORS.cyanLight,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });

    // Luminous Violet-White Open-Loop Zero 'o' Material
    this._matOlZero = new THREE.MeshStandardMaterial({
      color: COLORS.white,
      emissive: COLORS.violetLight,
      emissiveIntensity: 1.45,
      roughness: 0.15,
      metalness: 0.35,
    });

    // Luminous Amber Bode Positive-Frequency Tube Material
    this._matBodePos = new THREE.MeshStandardMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.75,
      roughness: 0.14,
      metalness: 0.2,
    });

    // Softer Mirror Amber Negative-Frequency Tube Material
    this._matBodeNeg = new THREE.MeshStandardMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amberDeep,
      emissiveIntensity: 0.95,
      roughness: 0.25,
      metalness: 0.15,
      transparent: true,
      opacity: 0.56,
    });

    // Bode Translucent Curtain Material
    this._matBodeCurtain = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Vertex-Colored Root Locus Tube Material
    this._matLocusTube = new THREE.MeshStandardMaterial({
      vertexColors: true,
      emissive: 0x10b981,
      emissiveIntensity: 0.62,
      roughness: 0.22,
      metalness: 0.18,
    });

    // Directional Gain Arrow Chevron Material
    this._matChevronLhp = new THREE.MeshStandardMaterial({
      color: COLORS.emeraldLight,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.15,
      roughness: 0.22,
      metalness: 0.3,
    });
    this._matChevronRhp = new THREE.MeshStandardMaterial({
      color: COLORS.coral,
      emissive: COLORS.coralDeep,
      emissiveIntensity: 1.35,
      roughness: 0.22,
      metalness: 0.3,
    });

    // Closed-Loop Pole Core & Halo Materials (LHP Gold, Marginal White-Amber, RHP Coral)
    this._matClGold = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: COLORS.amber,
      emissiveIntensity: 1.85,
      roughness: 0.12,
      metalness: 0.3,
    });
    this._matClGoldHalo = new THREE.MeshStandardMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.4,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2,
    });
    this._matClCoral = new THREE.MeshStandardMaterial({
      color: 0xffe4e6,
      emissive: COLORS.coral,
      emissiveIntensity: 2.05,
      roughness: 0.12,
      metalness: 0.25,
    });
    this._matClCoralHalo = new THREE.MeshStandardMaterial({
      color: COLORS.coral,
      emissive: COLORS.coralDeep,
      emissiveIntensity: 1.6,
      transparent: true,
      opacity: 0.9,
      roughness: 0.2,
    });
    this._matClStem = new THREE.MeshBasicMaterial({
      color: COLORS.amberLight,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });

    // Mechatronics Caliper Materials
    this._matCaliperEmerald = new THREE.MeshStandardMaterial({
      color: COLORS.emeraldLight,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.5,
      roughness: 0.18,
      metalness: 0.25,
    });
    this._matCaliperAmber = new THREE.MeshStandardMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.65,
      roughness: 0.16,
      metalness: 0.25,
    });
    this._matCaliperCoral = new THREE.MeshStandardMaterial({
      color: COLORS.coral,
      emissive: COLORS.coralDeep,
      emissiveIntensity: 1.65,
      roughness: 0.16,
      metalness: 0.25,
    });
    this._matCaliperCyan = new THREE.MeshStandardMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.45,
      roughness: 0.18,
      metalness: 0.25,
    });

    this._sharedMaterials.add(
      this._matOlPole,
      this._matSpireCore,
      this._matOlZero,
      this._matBodePos,
      this._matBodeNeg,
      this._matBodeCurtain,
      this._matLocusTube,
      this._matChevronLhp,
      this._matChevronRhp,
      this._matClGold,
      this._matClGoldHalo,
      this._matClCoral,
      this._matClCoralHalo,
      this._matClStem,
      this._matCaliperEmerald,
      this._matCaliperAmber,
      this._matCaliperCoral,
      this._matCaliperCyan
    );
  }

  // --------------------------------------------------------------------------
  // Scene Construction: Complex s-Plane Studio Plinth & Precision Grid
  // --------------------------------------------------------------------------

  _buildPlinthAndAxes() {
    // 1. Thick Bevelled Frosted-Glass Plinth Slab (top surface at y = PLINTH_TOP_Y)
    const slabGeo = createPlinthSlabGeometry(PLINTH_WIDTH, PLINTH_DEPTH, PLINTH_HEIGHT, 0.36, 0.045);
    const slabMat = new THREE.MeshPhysicalMaterial({
      color: COLORS.slateGlass,
      roughness: 0.24,
      metalness: 0.14,
      clearcoat: 0.92,
      clearcoatRoughness: 0.14,
      transmission: 0.24,
      thickness: 0.55,
      ior: 1.48,
      transparent: true,
      opacity: 0.92,
    });
    const slabMesh = new THREE.Mesh(slabGeo, slabMat);
    slabMesh.position.set(0, PLINTH_TOP_Y, 0);
    this._plinthGroup.add(slabMesh);

    // 2. Glowing Perimeter Rim Tube around plinth top chamfer
    const rimGeo = createPlinthRimGeometry(PLINTH_WIDTH - 0.06, PLINTH_DEPTH - 0.06, 0.34, 0.014);
    this._plinthRimMat = new THREE.MeshStandardMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.12,
      roughness: 0.2,
      metalness: 0.3,
    });
    const rimMesh = new THREE.Mesh(rimGeo, this._plinthRimMat);
    rimMesh.position.set(0, PLINTH_TOP_Y, 0);
    this._plinthGroup.add(rimMesh);

    // 3. Ambient Floating Radial Glow Pool beneath the plinth
    const glowTex = createRadialGlowTexture(
      'rgba(34, 211, 238, 0.22)',
      'rgba(139, 92, 246, 0.11)',
      'rgba(11, 13, 18, 0)'
    );
    this._ownedTextures.push(glowTex);
    const poolGeo = new THREE.PlaneGeometry(PLINTH_WIDTH * 1.45, PLINTH_DEPTH * 1.45);
    poolGeo.rotateX(-Math.PI / 2);
    const poolMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const poolMesh = new THREE.Mesh(poolGeo, poolMat);
    poolMesh.position.set(0, PLINTH_TOP_Y - PLINTH_HEIGHT - 0.08, 0);
    this._plinthGroup.add(poolMesh);

    // 4. LHP Emerald Tint Deck (sigma in [-4.5, 0]) & RHP Coral Danger Deck (sigma in [0, 1.5])
    const xMin = sigmaToX(SIGMA_MIN);
    const xMax = sigmaToX(SIGMA_MAX);
    const zSpan = (OMEGA_MAX - OMEGA_MIN) * SCALE_OMEGA;

    const lhpWidth = JW_WALL_X - xMin;
    const lhpGeo = new THREE.PlaneGeometry(lhpWidth, zSpan);
    lhpGeo.rotateX(-Math.PI / 2);
    const lhpMat = new THREE.MeshBasicMaterial({
      color: COLORS.emerald,
      transparent: true,
      opacity: 0.075,
      depthWrite: false,
    });
    const lhpDeck = new THREE.Mesh(lhpGeo, lhpMat);
    lhpDeck.position.set(xMin + lhpWidth * 0.5, 0.002, 0);
    this._plinthGroup.add(lhpDeck);

    const rhpWidth = xMax - JW_WALL_X;
    const rhpGeo = new THREE.PlaneGeometry(rhpWidth, zSpan);
    rhpGeo.rotateX(-Math.PI / 2);
    const rhpMat = new THREE.MeshBasicMaterial({
      color: COLORS.coral,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    const rhpDeck = new THREE.Mesh(rhpGeo, rhpMat);
    rhpDeck.position.set(JW_WALL_X + rhpWidth * 0.5, 0.003, 0);
    this._plinthGroup.add(rhpDeck);

    // Subtle Coral Diagonal Hazard Hatch Lines inside the RHP Deck
    const hatchPts = [];
    const zMin = omegaToZ(OMEGA_MAX); // -3.024
    const zMax = omegaToZ(OMEGA_MIN); // +3.024
    for (let zStart = zMin - rhpWidth; zStart <= zMax + rhpWidth; zStart += 0.42) {
      // Clip segment (JW_WALL_X, zStart) -> (xMax, zStart + rhpWidth) to [zMin, zMax]
      const x1 = JW_WALL_X;
      const z1 = zStart;
      const x2 = xMax;
      const z2 = zStart + rhpWidth;
      const tLo = Math.max(0, (zMin - z1) / (z2 - z1));
      const tHi = Math.min(1, (zMax - z1) / (z2 - z1));
      if (tHi > tLo + 1e-3) {
        hatchPts.push(
          x1 + (x2 - x1) * tLo,
          0.005,
          z1 + (z2 - z1) * tLo,
          x1 + (x2 - x1) * tHi,
          0.005,
          z1 + (z2 - z1) * tHi
        );
      }
    }
    const hatchGeo = new THREE.BufferGeometry();
    hatchGeo.setAttribute('position', new THREE.Float32BufferAttribute(hatchPts, 3));
    const hatchMat = new THREE.LineBasicMaterial({
      color: COLORS.coral,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });
    this._plinthGroup.add(new THREE.LineSegments(hatchGeo, hatchMat));

    // 5. Crisp Complex s-Plane Coordinate Grid
    const gridPts = [];
    for (let s = -4; s <= 1; s += 1) {
      if (s === 0) continue;
      const wx = sigmaToX(s);
      gridPts.push(wx, 0.006, zMin, wx, 0.006, zMax);
    }
    for (let w = -4; w <= 4; w += 1) {
      if (w === 0) continue;
      const wz = omegaToZ(w);
      gridPts.push(xMin, 0.006, wz, xMax, 0.006, wz);
    }
    // Outer boundary hairline of the active complex domain
    gridPts.push(
      xMin, 0.007, zMin, xMax, 0.007, zMin,
      xMax, 0.007, zMin, xMax, 0.007, zMax,
      xMax, 0.007, zMax, xMin, 0.007, zMax,
      xMin, 0.007, zMax, xMin, 0.007, zMin
    );
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3));
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    });
    this._plinthGroup.add(new THREE.LineSegments(gridGeo, gridMat));

    // 6. Luminous Real Axis (w = 0) & Imaginary Axis (sigma = 0) Rods
    const realAxisMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      emissive: 0x475569,
      emissiveIntensity: 0.65,
      roughness: 0.3,
    });
    const realAxisRod = new THREE.Mesh(this._unitCylinderGeo, realAxisMat);
    alignCylinderBetween(
      realAxisRod,
      new THREE.Vector3(xMin, 0.012, 0),
      new THREE.Vector3(xMax, 0.012, 0),
      0.011
    );
    this._plinthGroup.add(realAxisRod);

    const imagAxisMat = new THREE.MeshStandardMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.05,
      roughness: 0.22,
    });
    const imagAxisRod = new THREE.Mesh(this._unitCylinderGeo, imagAxisMat);
    alignCylinderBetween(
      imagAxisRod,
      new THREE.Vector3(JW_WALL_X, 0.014, zMin),
      new THREE.Vector3(JW_WALL_X, 0.014, zMax),
      0.014
    );
    this._plinthGroup.add(imagAxisRod);

    // 7. Editorial Floating Axis Badges
    const badges = [
      {
        text: 'LHP · STABLE (σ < 0)',
        pos: [sigmaToX(-2.9), 0.14, omegaToZ(-3.85)],
        opts: { color: '#6ee7b7', bg: 'rgba(6, 78, 59, 0.55)', fontSize: 24, scale: 0.34 },
      },
      {
        text: 'RHP · UNSTABLE (σ > 0)',
        pos: [sigmaToX(0.78), 0.14, omegaToZ(-3.85)],
        opts: { color: '#fda4af', bg: 'rgba(136, 19, 55, 0.6)', fontSize: 24, scale: 0.34 },
      },
      {
        text: 'Re(s) = σ',
        pos: [sigmaToX(1.32), 0.16, 0.28],
        opts: { color: '#cbd5e1', fontSize: 26, scale: 0.34 },
      },
      {
        text: '+jω',
        pos: [JW_WALL_X, 0.18, omegaToZ(4.02)],
        opts: { color: '#fcd34d', fontSize: 28, scale: 0.36 },
      },
      {
        text: 'jω BODE SLICE (σ = 0)',
        pos: [JW_WALL_X, WALL_HEIGHT + 0.22, omegaToZ(2.2)],
        opts: { color: '#fcd34d', bg: 'rgba(120, 53, 15, 0.55)', fontSize: 24, scale: 0.34 },
      },
      {
        text: '0 dB (|L|=1)',
        pos: [JW_WALL_X + 0.06, UNITY_GAIN_Y + 0.14, omegaToZ(3.65)],
        opts: { color: '#6ee7b7', fontSize: 22, scale: 0.29 },
      },
    ];

    for (const b of badges) {
      const { sprite, texture } = createTextSprite(b.text, b.opts);
      this._ownedTextures.push(texture);
      sprite.position.set(b.pos[0], b.pos[1], b.pos[2]);
      this._plinthGroup.add(sprite);
    }
  }

  // --------------------------------------------------------------------------
  // Scene Construction: Glowing Vertical jω-Axis Glass Slice Plane (σ = 0)
  // --------------------------------------------------------------------------

  _buildJwSliceWall() {
    const wallWidthZ = (OMEGA_MAX - OMEGA_MIN) * SCALE_OMEGA;
    const wallCenterY = WALL_HEIGHT * 0.5;

    this._sliceWallGroup.position.set(JW_WALL_X, 0, 0);

    // 1. Ultra-Clear Bevelled Vertical Glass Slice Pane
    const plateGeo = createVerticalGlassPlateGeometry(wallWidthZ, WALL_HEIGHT, 0.032, 0.14, 0.012);
    const plateMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.09,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.set(0, wallCenterY, 0);
    this._sliceWallGroup.add(plateMesh);

    // 2. Luminous Perimeter Frame Tube
    const rimGeo = createVerticalRimGeometry(wallWidthZ, WALL_HEIGHT, 0.14, 0.013);
    this._sliceRimMat = new THREE.MeshStandardMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.05,
      roughness: 0.18,
      metalness: 0.3,
    });
    const rimMesh = new THREE.Mesh(rimGeo, this._sliceRimMat);
    rimMesh.position.set(0, wallCenterY, 0);
    this._sliceWallGroup.add(rimMesh);

    // 3. 0 dB Unity Gain Reference Rail (|K*G(jw)| = 1 -> y = UNITY_GAIN_Y)
    const zMin = omegaToZ(OMEGA_MAX);
    const zMax = omegaToZ(OMEGA_MIN);
    const unityMat = new THREE.MeshStandardMaterial({
      color: COLORS.emeraldLight,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.15,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2,
    });
    const unityRail = new THREE.Mesh(this._unitCylinderGeo, unityMat);
    alignCylinderBetween(
      unityRail,
      new THREE.Vector3(0.02, UNITY_GAIN_Y, zMin + 0.08),
      new THREE.Vector3(0.02, UNITY_GAIN_Y, zMax - 0.08),
      0.0085
    );
    this._sliceWallGroup.add(unityRail);

    // 4. Subtle Etched dB Reference Hairlines (+6 dB, +12 dB, +18 dB) & Frequency Ticks
    const etchPts = [];
    const dbLevels = [6, 12, 18];
    for (const db of dbLevels) {
      const mag = Math.pow(10, db / 20);
      const y = magToY(mag);
      if (y < WALL_HEIGHT - 0.1) {
        etchPts.push(0.018, y, zMin + 0.1, 0.018, y, zMax - 0.1);
      }
    }
    for (let w = -4; w <= 4; w += 1) {
      const wz = omegaToZ(w);
      etchPts.push(0.018, 0.03, wz, 0.018, WALL_HEIGHT - 0.06, wz);
    }
    const etchGeo = new THREE.BufferGeometry();
    etchGeo.setAttribute('position', new THREE.Float32BufferAttribute(etchPts, 3));
    const etchMat = new THREE.LineBasicMaterial({
      color: COLORS.amberLight,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    });
    this._sliceWallGroup.add(new THREE.LineSegments(etchGeo, etchMat));
  }

  // --------------------------------------------------------------------------
  // Scene Construction: Persistent 96x96 Glowing 3D |K*G(s)| Surface + Wireframe
  // --------------------------------------------------------------------------

  _buildPersistentSurfaceMesh() {
    const cols = GRID_U + 1;
    const rows = GRID_V + 1;
    const vCount = cols * rows;

    const positions = new Float32Array(vCount * 3);
    const colors = new Float32Array(vCount * 3);
    const indices = new Uint32Array(GRID_U * GRID_V * 6);

    for (let iv = 0; iv <= GRID_V; iv++) {
      const wz = omegaToZ(this._gridOmegas[iv]);
      for (let iu = 0; iu <= GRID_U; iu++) {
        const idx = (iv * cols + iu) * 3;
        positions[idx] = sigmaToX(this._gridSigmas[iu]);
        positions[idx + 1] = 0;
        positions[idx + 2] = wz;
      }
    }

    let ptr = 0;
    for (let iv = 0; iv < GRID_V; iv++) {
      for (let iu = 0; iu < GRID_U; iu++) {
        const a = iv * cols + iu;
        const b = a + 1;
        const c = a + cols;
        const d = c + 1;
        indices[ptr++] = a;
        indices[ptr++] = b;
        indices[ptr++] = c;
        indices[ptr++] = b;
        indices[ptr++] = d;
        indices[ptr++] = c;
      }
    }

    this._surfaceGeom = new THREE.BufferGeometry();
    this._surfaceGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._surfaceGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this._surfaceGeom.setIndex(new THREE.BufferAttribute(indices, 1));

    const surfaceMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.54,
      roughness: 0.26,
      metalness: 0.06,
      clearcoat: 0.55,
      clearcoatRoughness: 0.2,
      envMapIntensity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this._surfaceMesh = new THREE.Mesh(this._surfaceGeom, surfaceMat);
    this._surfaceMesh.renderOrder = 2;
    this._surfaceGroup.add(this._surfaceMesh);

    // Subtle Parametric Contour Wireframe (every 6th row & col) sharing exact vertex map
    const step = 6;
    const wireMap = [];
    for (let iv = 0; iv <= GRID_V; iv += step) {
      for (let iu = 0; iu < GRID_U; iu++) {
        wireMap.push(iv * cols + iu, iv * cols + iu + 1);
      }
    }
    for (let iu = 0; iu <= GRID_U; iu += step) {
      for (let iv = 0; iv < GRID_V; iv++) {
        wireMap.push(iv * cols + iu, (iv + 1) * cols + iu);
      }
    }
    this._wireVertexMap = new Uint32Array(wireMap);
    const wirePos = new Float32Array(wireMap.length * 3);

    this._wireframeGeom = new THREE.BufferGeometry();
    this._wireframeGeom.setAttribute('position', new THREE.BufferAttribute(wirePos, 3));
    const wireMat = new THREE.LineBasicMaterial({
      color: COLORS.cyanLight,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    });
    this._wireframeLines = new THREE.LineSegments(this._wireframeGeom, wireMat);
    this._wireframeLines.renderOrder = 3;
    this._surfaceGroup.add(this._wireframeLines);
  }

  /**
   * Ultra-fast in-place update of the 96x96 |K*G(s)| surface & contour wireframe (< 0.5ms).
   */
  _updateSurfaceGeometry() {
    if (!this._surfaceGeom || !this._wireframeGeom) return;

    const posAttr = this._surfaceGeom.getAttribute('position');
    const colAttr = this._surfaceGeom.getAttribute('color');
    const posArr = posAttr.array;
    const colArr = colAttr.array;
    const baseGrid = this._baseMagGrid;
    const gain = this.k;
    const cols = GRID_U + 1;

    // Precomputed RGB stops for rich Spline volcanic-spire elevation shading
    const cValley = new THREE.Color(0x0b1630);
    const cCyan = new THREE.Color(COLORS.cyan);
    const cViolet = new THREE.Color(COLORS.violet);
    const cCrown = new THREE.Color(0xe0f2fe);
    const cRhpTint = new THREE.Color(COLORS.coral);
    const tmp = new THREE.Color();

    for (let iv = 0; iv <= GRID_V; iv++) {
      const rowOffset = iv * cols;
      for (let iu = 0; iu <= GRID_U; iu++) {
        const vIdx = rowOffset + iu;
        const mag = gain * baseGrid[vIdx];
        const y = magToY(mag);
        const p3 = vIdx * 3;
        posArr[p3 + 1] = y;

        // Elevation palette: midnight valley -> luminous cyan -> electric violet -> bright crown
        const normH = clamp(y / 3.05, 0, 1);
        if (normH < 0.35) {
          tmp.copy(cValley).lerp(cCyan, normH / 0.35);
        } else if (normH < 0.78) {
          tmp.copy(cCyan).lerp(cViolet, (normH - 0.35) / 0.43);
        } else {
          tmp.copy(cViolet).lerp(cCrown, (normH - 0.78) / 0.22);
        }

        // Subtle warm Coral tint on the RHP side (sigma > 0)
        const sigma = this._gridSigmas[iu];
        if (sigma > 0) {
          tmp.lerp(cRhpTint, clamp(sigma / 1.5, 0.12, 0.36));
        }

        // Crisp subtle highlight right along the 0 dB unity contour (|L| ≈ 1)
        const distToUnity = Math.abs(y - UNITY_GAIN_Y);
        if (distToUnity < 0.032) {
          const boost = 1 - distToUnity / 0.032;
          tmp.lerp(cCrown, boost * 0.42);
        }

        colArr[p3] = tmp.r;
        colArr[p3 + 1] = tmp.g;
        colArr[p3 + 2] = tmp.b;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    this._surfaceGeom.computeVertexNormals();

    // Update parametric contour wireframe positions directly from surface positions
    const wirePosAttr = this._wireframeGeom.getAttribute('position');
    const wireArr = wirePosAttr.array;
    const map = this._wireVertexMap;
    for (let i = 0; i < map.length; i++) {
      const src = map[i] * 3;
      const dst = i * 3;
      wireArr[dst] = posArr[src];
      wireArr[dst + 1] = posArr[src + 1] + 0.011;
      wireArr[dst + 2] = posArr[src + 2];
    }
    wirePosAttr.needsUpdate = true;
  }

  // --------------------------------------------------------------------------
  // Scene Construction: Luminous Amber 3D Bode Magnitude Slice Curve (σ = 0)
  // --------------------------------------------------------------------------

  _rebuildBodeSlice() {
    disposeGroupChildren(this._bodeGroup, this._sharedMaterials, this._sharedGeometries);
    if (!this._model) return;

    const { evalG, hasIntegrator } = this._model;
    const gain = this.k;
    const xSlice = JW_WALL_X + 0.028;

    const sampleBranch = (wStart, wEnd, count) => {
      const pts = [];
      for (let i = 0; i <= count; i++) {
        const u = i / count;
        const w = wStart + u * (wEnd - wStart);
        const g = evalG(0, w);
        const y = magToY(gain * cAbs(g.re, g.im));
        pts.push(new THREE.Vector3(xSlice, Math.max(0.025, y), omegaToZ(w)));
      }
      return pts;
    };

    const wZeroGap = hasIntegrator ? 0.045 : 0.0;

    // 1. Primary Positive-Frequency Bode Slice (w in [wZeroGap, OMEGA_MAX])
    const posPts = sampleBranch(wZeroGap, OMEGA_MAX, 130);
    const posTubeGeo = createSafeTubeGeometry(posPts, 148, 0.036, 10);
    const posTube = new THREE.Mesh(posTubeGeo, this._matBodePos);
    posTube.renderOrder = 5;
    this._bodeGroup.add(posTube);

    // Translucent luminous Amber curtain under positive-frequency Bode curve
    const curtainGeo = createBodeCurtainGeometry(posPts, 0.008);
    const curtainMesh = new THREE.Mesh(curtainGeo, this._matBodeCurtain);
    curtainMesh.renderOrder = 4;
    this._bodeGroup.add(curtainMesh);

    // 2. Conjugate Negative-Frequency Mirror Slice (w in [-OMEGA_MAX, -wZeroGap])
    const negPts = sampleBranch(-OMEGA_MAX, -wZeroGap, 110);
    const negTubeGeo = createSafeTubeGeometry(negPts, 120, 0.022, 8);
    const negTube = new THREE.Mesh(negTubeGeo, this._matBodeNeg);
    negTube.renderOrder = 5;
    this._bodeGroup.add(negTube);
  }

  // --------------------------------------------------------------------------
  // Scene Construction: Open-Loop Pole '×' & Zero '○' Markers + Spire Filaments
  // --------------------------------------------------------------------------

  _rebuildOpenLoopMarkers() {
    disposeGroupChildren(this._olMarkersGroup, this._sharedMaterials, this._sharedGeometries);
    if (!this._analysis) return;

    const { openLoopPoles, openLoopZeros } = this._analysis;

    // 1. Open-Loop Poles: Sculptural 3D Metallic Cyan '×' + Vertical Spire Core Filament
    for (const pole of openLoopPoles) {
      if (
        pole.re < SIGMA_MIN - 0.1 ||
        pole.re > SIGMA_MAX + 0.1 ||
        pole.im < OMEGA_MIN - 0.1 ||
        pole.im > OMEGA_MAX + 0.1
      ) {
        continue;
      }
      const wx = sigmaToX(pole.re);
      const wz = omegaToZ(pole.im);
      const armLen = 0.25;
      const yBase = 0.048;

      const poleGroup = new THREE.Group();
      poleGroup.position.set(wx, yBase, wz);

      const barA = new THREE.Mesh(this._unitCylinderGeo, this._matOlPole);
      barA.scale.set(0.024, armLen, 0.024);
      barA.rotation.set(0, Math.PI / 4, Math.PI / 2);

      const barB = new THREE.Mesh(this._unitCylinderGeo, this._matOlPole);
      barB.scale.set(0.024, armLen, 0.024);
      barB.rotation.set(0, -Math.PI / 4, Math.PI / 2);

      poleGroup.add(barA, barB);
      this._olMarkersGroup.add(poleGroup);

      // Luminous vertical core filament shooting up inside the volcanic pole spire
      const filament = new THREE.Mesh(this._unitCylinderGeo, this._matSpireCore);
      alignCylinderBetween(
        filament,
        new THREE.Vector3(wx, 0.05, wz),
        new THREE.Vector3(wx, SURFACE_SOFT_KNEE + SURFACE_SOFT_CAP - 0.06, wz),
        0.011
      );
      this._olMarkersGroup.add(filament);
    }

    // 2. Open-Loop Zeros: Sculptural 3D Luminous Violet-White Torus Rings '○'
    for (const zero of openLoopZeros) {
      if (
        zero.re < SIGMA_MIN - 0.1 ||
        zero.re > SIGMA_MAX + 0.1 ||
        zero.im < OMEGA_MIN - 0.1 ||
        zero.im > OMEGA_MAX + 0.1
      ) {
        continue;
      }
      const wx = sigmaToX(zero.re);
      const wz = omegaToZ(zero.im);
      const ring = new THREE.Mesh(this._unitTorusGeo, this._matOlZero);
      ring.rotation.x = Math.PI / 2;
      ring.scale.setScalar(0.115);
      ring.position.set(wx, 0.052, wz);
      this._olMarkersGroup.add(ring);
    }
  }

  // --------------------------------------------------------------------------
  // Scene Construction: Glowing Root Locus Branches + Directional Chevrons
  // --------------------------------------------------------------------------

  _rebuildRootLocusBranches() {
    disposeGroupChildren(this._locusGroup, this._sharedMaterials, this._sharedGeometries);
    if (!this._analysis) return;

    const { locusBranches } = this._analysis;
    const yLocus = 0.042;

    for (let b = 0; b < locusBranches.length; b++) {
      const branch = locusBranches[b];
      const segments = [];
      let current = [];

      for (let i = 0; i < branch.length; i++) {
        const pt = branch[i];
        const inBounds =
          pt.re >= SIGMA_MIN - 0.05 &&
          pt.re <= SIGMA_MAX + 0.05 &&
          pt.im >= OMEGA_MIN - 0.05 &&
          pt.im <= OMEGA_MAX + 0.05;

        if (inBounds) {
          current.push(
            new THREE.Vector3(
              sigmaToX(clamp(pt.re, SIGMA_MIN, SIGMA_MAX)),
              yLocus,
              omegaToZ(clamp(pt.im, OMEGA_MIN, OMEGA_MAX))
            )
          );
        } else if (current.length >= 2) {
          segments.push(current);
          current = [];
        } else {
          current = [];
        }
      }
      if (current.length >= 2) {
        segments.push(current);
      }

      for (const pts of segments) {
        const tubeGeo = createColoredLocusTubeGeometry(pts, 0.023, 8);
        const tubeMesh = new THREE.Mesh(tubeGeo, this._matLocusTube);
        tubeMesh.renderOrder = 6;
        this._locusGroup.add(tubeMesh);

        // Add subtle directional gain chevrons along the branch (40% & 75% along visible span)
        const chevronFracs = [0.42, 0.76];
        for (const frac of chevronFracs) {
          const idx = Math.floor(frac * (pts.length - 1));
          const p0 = pts[Math.max(0, idx - 1)];
          const p1 = pts[Math.min(pts.length - 1, idx + 1)];
          const dir = new THREE.Vector3().subVectors(p1, p0);
          if (dir.lengthSq() > 1e-4) {
            dir.normalize();
            const pos = pts[idx];
            const sigmaAtPos = pos.x / SCALE_SIGMA + SIGMA_CENTER;
            const cone = new THREE.Mesh(
              this._unitConeGeo,
              sigmaAtPos > 0 ? this._matChevronRhp : this._matChevronLhp
            );
            cone.scale.set(0.055, 0.13, 0.055);
            cone.position.copy(pos);
            cone.quaternion.setFromUnitVectors(UP_VEC, dir);
            this._locusGroup.add(cone);
          }
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // Scene Construction: Pulsing Gold / Coral Closed-Loop Pole Spheres
  // --------------------------------------------------------------------------

  _rebuildClosedLoopPoleSpheres() {
    disposeGroupChildren(this._clPolesGroup, this._sharedMaterials, this._sharedGeometries);
    this._clPoleEntries = [];
    if (!this._analysis) return;

    const poles = this._analysis.closedLoopPoles;
    for (let i = 0; i < poles.length; i++) {
      const pole = poles[i];
      const inBounds =
        pole.re >= SIGMA_MIN - 0.12 &&
        pole.re <= SIGMA_MAX + 0.12 &&
        pole.im >= OMEGA_MIN - 0.12 &&
        pole.im <= OMEGA_MAX + 0.12;

      const isUnstable = pole.re > 1e-4;
      const wx = sigmaToX(clamp(pole.re, SIGMA_MIN, SIGMA_MAX));
      const wz = omegaToZ(clamp(pole.im, OMEGA_MIN, OMEGA_MAX));
      const yOrb = 0.125;

      const holder = new THREE.Group();
      holder.position.set(wx, yOrb, wz);
      holder.visible = inBounds;

      const core = new THREE.Mesh(
        this._unitSphereGeo,
        isUnstable ? this._matClCoral : this._matClGold
      );
      core.scale.setScalar(0.115);

      const halo = new THREE.Mesh(
        this._unitTorusGeo,
        isUnstable ? this._matClCoralHalo : this._matClGoldHalo
      );
      halo.scale.setScalar(0.195);
      halo.rotation.x = Math.PI * 0.42;

      holder.add(core, halo);
      this._clPolesGroup.add(holder);

      // Sleek luminous vertical pin linking closed-loop pole orb to the |K*G(s)| surface height
      const gAtPole = this._model ? this._model.evalG(pole.re, pole.im) : { re: 0, im: 0 };
      const surfY = magToY(this.k * cAbs(gAtPole.re, gAtPole.im));
      const stem = new THREE.Mesh(this._unitCylinderGeo, this._matClStem);
      if (inBounds && surfY > yOrb + 0.18) {
        alignCylinderBetween(
          stem,
          new THREE.Vector3(wx, yOrb + 0.1, wz),
          new THREE.Vector3(wx, surfY, wz),
          0.009
        );
      } else {
        stem.visible = false;
      }
      this._clPolesGroup.add(stem);

      this._clPoleEntries.push({
        holder,
        core,
        halo,
        stem,
        isUnstable,
        phaseOffset: i * 1.35,
      });
    }
  }

  /**
   * Fast update of existing closed-loop pole orbs & stems during 60fps gain scrubs.
   */
  _updateClosedLoopPoleSpheres() {
    if (!this._analysis) return;
    const poles = this._analysis.closedLoopPoles;
    if (poles.length !== this._clPoleEntries.length) {
      this._rebuildClosedLoopPoleSpheres();
      return;
    }

    const yOrb = 0.125;
    for (let i = 0; i < poles.length; i++) {
      const pole = poles[i];
      const entry = this._clPoleEntries[i];
      const inBounds =
        pole.re >= SIGMA_MIN - 0.12 &&
        pole.re <= SIGMA_MAX + 0.12 &&
        pole.im >= OMEGA_MIN - 0.12 &&
        pole.im <= OMEGA_MAX + 0.12;

      const isUnstable = pole.re > 1e-4;
      const wx = sigmaToX(clamp(pole.re, SIGMA_MIN, SIGMA_MAX));
      const wz = omegaToZ(clamp(pole.im, OMEGA_MIN, OMEGA_MAX));

      entry.holder.visible = inBounds;
      entry.holder.position.set(wx, yOrb, wz);
      entry.isUnstable = isUnstable;
      entry.core.material = isUnstable ? this._matClCoral : this._matClGold;
      entry.halo.material = isUnstable ? this._matClCoralHalo : this._matClGoldHalo;

      const gAtPole = this._model ? this._model.evalG(pole.re, pole.im) : { re: 0, im: 0 };
      const surfY = magToY(this.k * cAbs(gAtPole.re, gAtPole.im));
      if (inBounds && surfY > yOrb + 0.18) {
        alignCylinderBetween(
          entry.stem,
          new THREE.Vector3(wx, yOrb + 0.1, wz),
          new THREE.Vector3(wx, surfY, wz),
          0.009
        );
      } else {
        entry.stem.visible = false;
      }
    }
  }

  // --------------------------------------------------------------------------
  // Scene Construction: Mechatronics Engineering Lens Overlay (on σ = 0 Wall)
  // --------------------------------------------------------------------------

  _rebuildMechatronicsOverlay() {
    disposeGroupChildren(this._mechatronicsGroup, this._sharedMaterials, this._sharedGeometries);
    this._pmReticleMesh = null;
    this._stabilityBarMat = null;

    if (!this._analysis || !this._model) return;

    const {
      stability,
      gainCrossover,
      phaseCrossover,
      phaseMarginDeg,
      resonantFreq,
    } = this._analysis;
    const { evalG } = this._model;
    const xFace = JW_WALL_X + 0.042;
    const zMin = omegaToZ(OMEGA_MAX);
    const zMax = omegaToZ(OMEGA_MIN);

    // 1. Stability Wall Top Luminous Status Beacon Bar (σ = 0)
    const statusHex =
      stability === 'UNSTABLE'
        ? COLORS.coral
        : stability === 'MARGINAL'
          ? COLORS.amber
          : COLORS.emerald;
    this._stabilityBarMat = new THREE.MeshStandardMaterial({
      color: COLORS.white,
      emissive: statusHex,
      emissiveIntensity: 1.75,
      roughness: 0.15,
    });
    const statusBar = new THREE.Mesh(this._unitCylinderGeo, this._stabilityBarMat);
    alignCylinderBetween(
      statusBar,
      new THREE.Vector3(JW_WALL_X, WALL_HEIGHT + 0.015, zMin + 0.18),
      new THREE.Vector3(JW_WALL_X, WALL_HEIGHT + 0.015, zMax - 0.18),
      0.022
    );
    this._mechatronicsGroup.add(statusBar);

    // 2. Phase Margin Target Beacon & Bandwidth Caliper at ω_gc (on the 0 dB rail)
    if (gainCrossover !== null && gainCrossover <= OMEGA_MAX) {
      const zGc = omegaToZ(gainCrossover);
      const pmMat =
        phaseMarginDeg < 15
          ? this._matCaliperCoral
          : phaseMarginDeg < 45
            ? this._matCaliperAmber
            : this._matCaliperEmerald;

      // Glowing beacon orb right at (σ=0, |L|=1, ω=ω_gc)
      const beaconOrb = new THREE.Mesh(this._unitSphereGeo, pmMat);
      beaconOrb.scale.setScalar(0.088);
      beaconOrb.position.set(xFace, UNITY_GAIN_Y, zGc);
      this._mechatronicsGroup.add(beaconOrb);

      // Rotating precision reticle ring around the Phase Margin beacon
      const reticle = new THREE.Mesh(this._unitTorusGeo, pmMat);
      reticle.scale.setScalar(0.17);
      reticle.rotation.y = Math.PI / 2;
      reticle.position.set(xFace + 0.008, UNITY_GAIN_Y, zGc);
      this._mechatronicsGroup.add(reticle);
      this._pmReticleMesh = reticle;

      // 3D Phase Margin Arc Gauge (sweeps proportional to clamped PM in [0°, 90°])
      const pmArcFrac = clamp(Math.abs(phaseMarginDeg) / 90, 0.08, 1.0);
      const arcAngle = pmArcFrac * Math.PI * 1.25;
      const arcGeo = new THREE.TorusGeometry(0.28, 0.018, 10, 32, arcAngle);
      const arcMesh = new THREE.Mesh(arcGeo, pmMat);
      arcMesh.rotation.y = Math.PI / 2;
      arcMesh.position.set(xFace + 0.012, UNITY_GAIN_Y, zGc);
      this._mechatronicsGroup.add(arcMesh);

      // Vertical frequency drop-stem from beacon down to ω-axis
      const dropStem = new THREE.Mesh(this._unitCylinderGeo, pmMat);
      alignCylinderBetween(
        dropStem,
        new THREE.Vector3(xFace, 0.03, zGc),
        new THREE.Vector3(xFace, UNITY_GAIN_Y - 0.08, zGc),
        0.011
      );
      this._mechatronicsGroup.add(dropStem);

      // Horizontal Bandwidth Caliper bar from ω = 0 to ω = ω_gc along the jω floor
      if (gainCrossover > 0.15) {
        const bwBar = new THREE.Mesh(this._unitCylinderGeo, this._matCaliperCyan);
        alignCylinderBetween(
          bwBar,
          new THREE.Vector3(xFace + 0.02, 0.09, 0),
          new THREE.Vector3(xFace + 0.02, 0.09, zGc),
          0.014
        );
        this._mechatronicsGroup.add(bwBar);

        const cap0 = new THREE.Mesh(this._unitCylinderGeo, this._matCaliperCyan);
        alignCylinderBetween(
          cap0,
          new THREE.Vector3(xFace + 0.02, 0.02, 0),
          new THREE.Vector3(xFace + 0.02, 0.17, 0),
          0.012
        );
        const cap1 = new THREE.Mesh(this._unitCylinderGeo, this._matCaliperCyan);
        alignCylinderBetween(
          cap1,
          new THREE.Vector3(xFace + 0.02, 0.02, zGc),
          new THREE.Vector3(xFace + 0.02, 0.17, zGc),
          0.012
        );
        this._mechatronicsGroup.add(cap0, cap1);
      }
    }

    // 3. Resonant Peak Mr Vertical Precision Caliper right on the jω slice
    const mrFreq = clamp(resonantFreq || 0, 0.08, OMEGA_MAX - 0.05);
    const gAtMr = evalG(0, mrFreq);
    const mrY = magToY(this.k * cAbs(gAtMr.re, gAtMr.im));
    if (mrY > UNITY_GAIN_Y + 0.16 && mrFreq <= OMEGA_MAX) {
      const zMr = omegaToZ(mrFreq);
      const mrStem = new THREE.Mesh(this._unitCylinderGeo, this._matCaliperAmber);
      alignCylinderBetween(
        mrStem,
        new THREE.Vector3(xFace + 0.015, UNITY_GAIN_Y, zMr),
        new THREE.Vector3(xFace + 0.015, mrY, zMr),
        0.013
      );
      this._mechatronicsGroup.add(mrStem);

      // Crisp horizontal laser caliper end-caps at top peak and 0 dB base
      const topCap = new THREE.Mesh(this._unitCylinderGeo, this._matCaliperAmber);
      alignCylinderBetween(
        topCap,
        new THREE.Vector3(xFace + 0.015, mrY, zMr - 0.12),
        new THREE.Vector3(xFace + 0.015, mrY, zMr + 0.12),
        0.013
      );
      const peakDot = new THREE.Mesh(this._unitSphereGeo, this._matCaliperAmber);
      peakDot.scale.setScalar(0.068);
      peakDot.position.set(xFace + 0.015, mrY, zMr);
      this._mechatronicsGroup.add(topCap, peakDot);
    }

    // 4. Gain Margin Vertical Caliper at ω_pc (when finite and visible, e.g. rl-3pole & non-min-phase)
    if (phaseCrossover !== null && phaseCrossover > 0.05 && phaseCrossover <= OMEGA_MAX) {
      const zPc = omegaToZ(phaseCrossover);
      const gAtPc = evalG(0, phaseCrossover);
      const pcY = magToY(this.k * cAbs(gAtPc.re, gAtPc.im));
      const gmMat = pcY <= UNITY_GAIN_Y ? this._matCaliperEmerald : this._matCaliperCoral;

      if (Math.abs(pcY - UNITY_GAIN_Y) > 0.05) {
        const gmBar = new THREE.Mesh(this._unitCylinderGeo, gmMat);
        alignCylinderBetween(
          gmBar,
          new THREE.Vector3(xFace + 0.018, Math.min(pcY, UNITY_GAIN_Y), zPc),
          new THREE.Vector3(xFace + 0.018, Math.max(pcY, UNITY_GAIN_Y), zPc),
          0.014
        );
        this._mechatronicsGroup.add(gmBar);
      }

      const pcOrb = new THREE.Mesh(this._unitSphereGeo, gmMat);
      pcOrb.scale.setScalar(0.065);
      pcOrb.position.set(xFace + 0.018, pcY, zPc);
      this._mechatronicsGroup.add(pcOrb);
    }
  }

  // --------------------------------------------------------------------------
  // Camera Presets ('3d' | 'front' | 'iso')
  // --------------------------------------------------------------------------

  _getCameraPose(preset) {
    switch (preset) {
      case 'front':
        // Head-on view of the jω-axis Bode Slice glass wall (+ω runs left-to-right!)
        return {
          pos: new THREE.Vector3(10.35, 1.55, 0.0),
          target: new THREE.Vector3(JW_WALL_X, 1.12, 0.0),
        };
      case 'iso':
        // Elevated architectural top-isometric Root Locus s-plane view
        return {
          pos: new THREE.Vector3(0.25, 9.65, 5.35),
          target: new THREE.Vector3(0.0, 0.12, 0.0),
        };
      case '3d':
      default:
        // Hero Spline studio angle showcasing mountain + jω Bode slice + Root Locus
        return {
          pos: new THREE.Vector3(4.95, 4.15, 7.35),
          target: new THREE.Vector3(0.18, 0.72, 0.0),
        };
    }
  }

  _applyCameraPresetImmediate(preset) {
    if (!this.camera || !this.controls) return;
    const pose = this._getCameraPose(preset);
    this.camera.position.copy(pose.pos);
    this.controls.target.copy(pose.target);
    this.controls.update();
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  setPreset(presetId) {
    if (!FREQ_PRESETS[presetId]) return this.getTelemetry();
    this._cancelSweepAnimation();

    this.presetId = presetId;
    const preset = FREQ_PRESETS[presetId];
    this.k = preset.defaultK;
    this.param = preset.defaultParam;

    this._recomputeModelAndAnalysis(true);

    if (this._initialized) {
      this._updateSurfaceGeometry();
      this._rebuildBodeSlice();
      this._rebuildOpenLoopMarkers();
      this._rebuildRootLocusBranches();
      this._rebuildClosedLoopPoleSpheres();
      this._rebuildMechatronicsOverlay();
    }

    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  setGainK(k) {
    const num = Number(k);
    if (!Number.isFinite(num)) return this.getTelemetry();
    this._cancelSweepAnimation();

    const preset = this._getPreset();
    this.k = clamp(num, 0, preset.kMax);
    this._applyGainUpdate();

    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  _applyGainUpdate() {
    // Base |G(s)| grid and Root Locus branches are invariant to K — fast update path!
    this._recomputeModelAndAnalysis(false);
    if (this._initialized) {
      this._updateSurfaceGeometry();
      this._rebuildBodeSlice();
      this._updateClosedLoopPoleSpheres();
      if (this.mechatronicsLens) {
        this._rebuildMechatronicsOverlay();
      }
    }
  }

  setParam(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return this.getTelemetry();
    this._cancelSweepAnimation();

    const preset = this._getPreset();
    this.param = clamp(num, preset.paramMin, preset.paramMax);
    this._recomputeModelAndAnalysis(true);

    if (this._initialized) {
      this._updateSurfaceGeometry();
      this._rebuildBodeSlice();
      this._rebuildOpenLoopMarkers();
      this._rebuildRootLocusBranches();
      this._rebuildClosedLoopPoleSpheres();
      this._rebuildMechatronicsOverlay();
    }

    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  toggleLocus(bool) {
    this.showLocus = Boolean(bool);
    if (this._locusGroup) this._locusGroup.visible = this.showLocus;
    if (this._clPolesGroup) this._clPolesGroup.visible = this.showLocus;

    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  toggleMechatronicsLens(bool) {
    this.mechatronicsLens = Boolean(bool);
    if (this._mechatronicsGroup) {
      this._mechatronicsGroup.visible = this.mechatronicsLens;
      if (this.mechatronicsLens && this._initialized) {
        this._rebuildMechatronicsOverlay();
      }
    }

    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  setCameraPreset(preset) {
    const valid = preset === 'front' || preset === 'iso' ? preset : '3d';
    this.cameraPreset = valid;
    if (!this._initialized || !this.camera || !this.controls) return;

    const to = this._getCameraPose(valid);
    this._camTransition = {
      startTime: performance.now(),
      duration: 760,
      fromPos: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPos: to.pos,
      toTarget: to.target,
    };
  }

  animateGainSweep(onDone) {
    this._cancelSweepAnimation();

    const preset = this._getPreset();
    const kStart = 0.2;
    const kEnd = preset.kMax * 0.85;

    this._sweepAnim = {
      startTime: performance.now(),
      duration: 2600,
      kStart,
      kEnd,
      onDone: typeof onDone === 'function' ? onDone : null,
    };

    this.k = kStart;
    this._applyGainUpdate();
    const initTelemetry = this.getTelemetry();
    this._emitTelemetry(initTelemetry);

    return () => this._cancelSweepAnimation();
  }

  _cancelSweepAnimation() {
    this._sweepAnim = null;
  }

  getTelemetry() {
    const a =
      this._analysis ||
      analyzeFreqSystem({
        presetId: this.presetId,
        k: this.k,
        param: this.param,
      });

    return {
      presetId: a.presetId,
      label: a.label,
      mechatronicsLabel: a.mechatronicsLabel,
      k: a.k,
      kMax: a.kMax,
      param: a.param,
      paramLabel: a.paramLabel,
      paramMin: a.paramMin,
      paramMax: a.paramMax,
      paramStep: a.paramStep,
      showLocus: this.showLocus,
      mechatronicsLens: this.mechatronicsLens,
      closedLoopPoles: a.closedLoopPoles,
      openLoopPoles: a.openLoopPoles,
      openLoopZeros: a.openLoopZeros,
      gainCrossover: a.gainCrossover,
      phaseCrossover: a.phaseCrossover,
      phaseMarginDeg: a.phaseMarginDeg,
      gainMarginDb: a.gainMarginDb,
      resonantPeakDb: a.resonantPeakDb,
      resonantFreq: a.resonantFreq,
      stability: a.stability,
      olLatex: a.olLatex,
      clPolesLatex: a.clPolesLatex,
    };
  }

  _emitTelemetry(telemetry = this.getTelemetry()) {
    if (this.onTelemetry) {
      this.onTelemetry(telemetry);
    }
  }

  resize() {
    if (!this._initialized || !this.container || !this.renderer || !this.camera) return;
    const width = Math.max(this.container.clientWidth || 1, 1);
    const height = Math.max(this.container.clientHeight || 1, 1);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height);

    if (this.composer) {
      this.composer.setPixelRatio(dpr);
      this.composer.setSize(width, height);
    }
    if (this.bloomPass) {
      this.bloomPass.resolution.set(width, height);
    }
  }

  // --------------------------------------------------------------------------
  // Animation Loop (60fps)
  // --------------------------------------------------------------------------

  _animate() {
    if (this._disposed) return;
    this._rafId = requestAnimationFrame(this._onAnimate);

    const now = performance.now();
    const elapsed = this._clock.getElapsedTime();

    // 1. Live Gain Sweep Animation (~2.6s from 0.2 -> kMax * 0.85)
    if (this._sweepAnim) {
      const { startTime, duration, kStart, kEnd, onDone } = this._sweepAnim;
      const rawU = clamp((now - startTime) / duration, 0, 1);
      const eased = easeInOutSine(rawU);
      this.k = rawU >= 1 ? kEnd : kStart + eased * (kEnd - kStart);

      this._applyGainUpdate();
      const telemetry = this.getTelemetry();
      this._emitTelemetry(telemetry);

      if (rawU >= 1) {
        this._sweepAnim = null;
        if (onDone) onDone(telemetry);
      }
    }

    // 2. Smooth Cubic Ease-Out Camera Preset Transition
    if (this._camTransition && this.camera && this.controls) {
      const { startTime, duration, fromPos, fromTarget, toPos, toTarget } = this._camTransition;
      const rawT = clamp((now - startTime) / duration, 0, 1);
      const t = easeOutCubic(rawT);
      this.camera.position.lerpVectors(fromPos, toPos, t);
      this.controls.target.lerpVectors(fromTarget, toTarget, t);
      if (rawT >= 1) {
        this._camTransition = null;
      }
    }

    // 3. Living Spline Micro-Animations (Closed-Loop Orbs, Halos & Studio Rim Breathing)
    for (let i = 0; i < this._clPoleEntries.length; i++) {
      const entry = this._clPoleEntries[i];
      if (!entry.holder.visible) continue;
      const pulseSpeed = entry.isUnstable ? 6.2 : 3.2;
      const spinSpeed = entry.isUnstable ? 2.4 : 1.15;
      const pulse = 1 + Math.sin(elapsed * pulseSpeed + entry.phaseOffset) * (entry.isUnstable ? 0.12 : 0.075);

      entry.core.scale.setScalar(0.115 * pulse);
      entry.halo.rotation.z = elapsed * spinSpeed + entry.phaseOffset;
      entry.halo.rotation.x = Math.PI * 0.42 + Math.sin(elapsed * 1.4 + entry.phaseOffset) * 0.25;
      entry.halo.scale.setScalar(0.195 * (1 + Math.cos(elapsed * pulseSpeed + entry.phaseOffset) * 0.08));
    }

    if (this._pmReticleMesh) {
      this._pmReticleMesh.rotation.x = elapsed * 1.45;
      this._pmReticleMesh.scale.setScalar(0.17 * (1 + Math.sin(elapsed * 3.0) * 0.08));
    }

    if (this._stabilityBarMat) {
      const isUnstable = this._analysis && this._analysis.stability === 'UNSTABLE';
      this._stabilityBarMat.emissiveIntensity = isUnstable
        ? 1.55 + Math.sin(elapsed * 6.5) * 0.65
        : 1.45 + Math.sin(elapsed * 2.2) * 0.2;
    }

    if (this._plinthRimMat) {
      this._plinthRimMat.emissiveIntensity = 1.12 + Math.sin(elapsed * 1.8) * 0.12;
    }

    if (this._sliceRimMat) {
      this._sliceRimMat.emissiveIntensity = 1.05 + Math.cos(elapsed * 1.65) * 0.12;
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.composer) {
      this.composer.render();
    } else if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // --------------------------------------------------------------------------
  // Full GPU & DOM Resource Cleanup (Zero WebGL Leaks)
  // --------------------------------------------------------------------------

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this._initialized = false;
    this._camTransition = null;
    this._sweepAnim = null;

    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }

    if (this.controls) {
      this.controls.removeEventListener('start', this._onControlsStart);
      this.controls.dispose();
      this.controls = null;
    }

    if (this.scene) {
      const disposedGeos = new Set();
      const disposedMats = new Set();
      this.scene.traverse((obj) => {
        if (obj.geometry && !disposedGeos.has(obj.geometry)) {
          disposedGeos.add(obj.geometry);
          obj.geometry.dispose();
        }
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) {
            if (m && !disposedMats.has(m)) {
              disposedMats.add(m);
              if (m.map) m.map.dispose();
              m.dispose();
            }
          }
        }
      });
    }

    for (const geo of this._sharedGeometries) {
      geo.dispose();
    }
    this._sharedGeometries.clear();

    for (const mat of this._sharedMaterials) {
      mat.dispose();
    }
    this._sharedMaterials.clear();

    for (const tex of this._ownedTextures) {
      tex.dispose();
    }
    this._ownedTextures.length = 0;

    if (this.envRT) {
      this.envRT.dispose();
      this.envRT = null;
    }

    if (this.bloomPass && typeof this.bloomPass.dispose === 'function') {
      this.bloomPass.dispose();
      this.bloomPass = null;
    }

    if (this.composer && typeof this.composer.dispose === 'function') {
      this.composer.dispose();
      this.composer = null;
    }

    if (this.renderer) {
      const dom = this.renderer.domElement;
      this.renderer.dispose();
      if (dom && dom.parentNode) {
        dom.parentNode.removeChild(dom);
      }
      this.renderer = null;
    }

    this._surfaceMesh = null;
    this._surfaceGeom = null;
    this._wireframeLines = null;
    this._wireframeGeom = null;
    this._clPoleEntries = [];
    this._pmReticleMesh = null;
    this._stabilityBarMat = null;
    this._plinthRimMat = null;
    this._sliceRimMat = null;
    this.scene = null;
    this.camera = null;
    this.container = null;
  }
}
