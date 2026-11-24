/**
 * EIGENLAB — Interactive 3D Physical System Modeling & Laplace s-Plane Studio
 * Spline-quality Three.js WebGL visualization module (ES Modules).
 *
 * Bridges first-principles physical hardware (Mass-Spring-Damper, Series RLC
 * Circuit, DC Motor Closed-Loop, Suspension) with exact analytical step
 * responses y(t) and live Complex Laplace s-Plane pole dynamics.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ============================================================================
// 1. FIRST-PRINCIPLES PHYSICAL PRESETS & EXACT ANALYTICAL SOLVER
// ============================================================================

export const MODELING_PRESETS = {
  'msd-underdamped': {
    id: 'msd-underdamped',
    key: 'msd-underdamped',
    label: 'Mass-Spring-Damper',
    domain: 'mechanical',
    defaults: { m: 1.0, c: 1.2, k: 9.0, kp: 0.0 },
    paramLabels: {
      m: 'Mass m (kg)',
      c: 'Damper c (N·s/m)',
      k: 'Spring k (N/m)',
    },
  },
  'rlc-series': {
    id: 'rlc-series',
    key: 'rlc-series',
    label: 'Series RLC Circuit',
    domain: 'electrical',
    defaults: { m: 0.5, c: 2.0, k: 8.0, kp: 0.0 },
    paramLabels: {
      m: 'Inductance L (H)',
      c: 'Resistance R (Ω)',
      k: 'Elastance 1/C (F⁻¹)',
    },
  },
  'msd-critical': {
    id: 'msd-critical',
    key: 'msd-critical',
    label: 'Critical Damping (ζ=1)',
    domain: 'mechanical',
    defaults: { m: 1.0, c: 6.0, k: 9.0, kp: 0.0 },
    paramLabels: {
      m: 'Mass m (kg)',
      c: 'Damper c (N·s/m)',
      k: 'Spring k (N/m)',
    },
  },
  'dc-motor': {
    id: 'dc-motor',
    key: 'dc-motor',
    label: 'DC Motor Closed-Loop',
    domain: 'electromechanical',
    defaults: { m: 0.5, c: 1.5, k: 2.0, kp: 6.0 },
    paramLabels: {
      m: 'Inertia J',
      c: 'Friction b',
      k: 'Load Stiff k',
    },
  },
  'overdamped-heavy': {
    id: 'overdamped-heavy',
    key: 'overdamped-heavy',
    label: 'Overdamped Suspension',
    domain: 'mechanical',
    defaults: { m: 1.0, c: 8.0, k: 7.0, kp: 0.0 },
    paramLabels: {
      m: 'Chassis Mass m',
      c: 'Shock Damper c',
      k: 'Coil Spring k',
    },
  },
};

const M_MIN = 0.1;
const M_MAX = 10.0;
const C_MIN = 0.0;
const C_MAX = 20.0;
const K_MIN = 0.2;
const K_MAX = 30.0;
const KP_MIN = 0.0;
const KP_MAX = 30.0;

const T_MIN = 0.0;
const T_MAX_DEFAULT = 6.0;
const SAMPLE_COUNT = 260;

const LN_50 = Math.log(50); // -ln(0.02) = 3.912023005428146
const CRIT_SETTLE_CONST = 5.833919; // exact root of (1 + u) * exp(-u) = 0.02

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function easeOutCubic(t) {
  const inv = 1 - clamp(t, 0, 1);
  return 1 - inv * inv * inv;
}

function normalizeZero(v) {
  return Math.abs(v) < 1e-12 ? 0 : v;
}

function fmtNum(val) {
  const n = Math.abs(val) < 1e-9 ? 0 : val;
  if (Math.abs(n - Math.round(n)) < 1e-6) return Math.round(n).toFixed(1);
  return Number(n.toFixed(2)).toString();
}

/**
 * Exact 2% settling time for an overdamped 2nd-order step response via bisection.
 */
function computeOverdampedSettlingTime(r1, r2) {
  // r1 > r2, both < 0; error e(t) = -(r2 * exp(r1 * t) - r1 * exp(r2 * t)) / (r1 - r2)
  const denom = r1 - r2;
  if (denom <= 1e-12) return CRIT_SETTLE_CONST / Math.max(Math.abs(r1), 1e-4);

  const evalErr = (t) => -(r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / denom;

  let lo = 0;
  let hi = Math.max(4, (LN_50 + 2.5) / Math.max(Math.abs(r1), 1e-4));
  while (evalErr(hi) > 0.02 && hi < 500) {
    hi *= 1.6;
  }
  for (let i = 0; i < 32; i++) {
    const mid = 0.5 * (lo + hi);
    if (evalErr(mid) > 0.02) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return 0.5 * (lo + hi);
}

/**
 * Exact closed-form analytical evaluation of:
 *   m * y'' + c * y' + kEff * y = kEff * yInf,   y(0) = 0,  y'(0) = 0
 * Zero numerical integration error across all four damping regimes.
 */
function evaluateExactStepAt(wn, zeta, sigma, yInf, t) {
  const time = Math.max(0, t);
  const w2 = wn * wn;

  // 1. Undamped harmonic oscillator (zeta === 0)
  if (zeta < 1e-8) {
    const wt = wn * time;
    const cosW = Math.cos(wt);
    const sinW = Math.sin(wt);
    return {
      t: time,
      y: normalizeZero(yInf * (1 - cosW)),
      yd: normalizeZero(yInf * wn * sinW),
      ydd: normalizeZero(yInf * w2 * cosW),
    };
  }

  // 2. Underdamped oscillatory decay (0 < zeta < 1)
  if (zeta < 1 - 1e-7) {
    const sqrtTerm = Math.sqrt(1 - zeta * zeta);
    const wd = wn * sqrtTerm;
    const decay = Math.exp(-sigma * time);
    const cosD = Math.cos(wd * time);
    const sinD = Math.sin(wd * time);
    const ratio = sigma / wd;

    const y = yInf * (1 - decay * (cosD + ratio * sinD));
    const yd = yInf * (w2 / wd) * decay * sinD;
    const ydd = yInf * w2 * decay * (cosD - ratio * sinD);
    return {
      t: time,
      y: normalizeZero(y),
      yd: normalizeZero(yd),
      ydd: normalizeZero(ydd),
    };
  }

  // 3. Critically damped double pole (|zeta - 1| <= 1e-7)
  if (zeta <= 1 + 1e-7) {
    const wt = wn * time;
    const decay = Math.exp(-wt);
    const y = yInf * (1 - (1 + wt) * decay);
    const yd = yInf * w2 * time * decay;
    const ydd = yInf * w2 * (1 - wt) * decay;
    return {
      t: time,
      y: normalizeZero(y),
      yd: normalizeZero(yd),
      ydd: normalizeZero(ydd),
    };
  }

  // 4. Overdamped two distinct real negative poles (zeta > 1)
  const alpha = wn * Math.sqrt(zeta * zeta - 1);
  const r1 = -sigma + alpha; // slower dominant pole (< 0)
  const r2 = -sigma - alpha; // faster pole (< r1)
  const denom = r1 - r2; // 2 * alpha > 0
  const e1 = Math.exp(r1 * time);
  const e2 = Math.exp(r2 * time);
  const r1r2 = r1 * r2; // equals wn^2

  const y = yInf * (1 + (r2 * e1 - r1 * e2) / denom);
  const yd = yInf * ((r1r2 * (e1 - e2)) / denom);
  const ydd = yInf * ((r1r2 * (r1 * e1 - r2 * e2)) / denom);
  return {
    t: time,
    y: normalizeZero(y),
    yd: normalizeZero(yd),
    ydd: normalizeZero(ydd),
  };
}

/**
 * Build domain-authentic ODE and Transfer Function LaTeX strings.
 */
function buildDomainLatex(domain, m, c, k, kp, kEff) {
  const closedLoop = kp > 1e-6;
  const ms = fmtNum(m);
  const cs = fmtNum(c);
  const ks = fmtNum(k);
  const kps = fmtNum(kp);
  const kes = fmtNum(kEff);

  let sym = 'x';
  let inSym = closedLoop ? 'r(t)' : 'u(t)';
  let tfPrefix = closedLoop ? 'T(s) = ' : 'G(s) = ';

  if (domain === 'electrical') {
    sym = 'v_C';
    inSym = closedLoop ? 'v_{\\text{ref}}(t)' : 'v_{\\text{in}}(t)';
    tfPrefix = closedLoop
      ? 'T(s) = \\frac{V_C(s)}{V_{\\text{ref}}(s)} = '
      : 'G(s) = \\frac{V_C(s)}{V_{\\text{in}}(s)} = ';
  } else if (domain === 'electromechanical') {
    sym = '\\theta';
    inSym = closedLoop ? '\\theta_r(t)' : 'u(t)';
    tfPrefix = closedLoop
      ? 'T(s) = \\frac{\\Theta(s)}{\\Theta_r(s)} = '
      : 'G(s) = \\frac{\\Theta(s)}{U(s)} = ';
  }

  const stiffTerm = closedLoop ? `(${ks}+${kps})` : ks;
  const odeLatex =
    c > 1e-6
      ? `${ms}\\ddot{${sym}} + ${cs}\\dot{${sym}} + ${stiffTerm}${sym} = ${kes}\\,${inSym}`
      : `${ms}\\ddot{${sym}} + ${stiffTerm}${sym} = ${kes}\\,${inSym}`;

  const denomLatex =
    c > 1e-6 ? `${ms}s^2 + ${cs}s + ${kes}` : `${ms}s^2 + ${kes}`;
  const tfLatex = `${tfPrefix}\\frac{${kes}}{${denomLatex}}`;

  return { odeLatex, tfLatex };
}

/**
 * First-principles Laplace s-plane and analytical time-domain analysis
 * for a second-order physical system with optional unity proportional feedback Kp.
 */
export function analyzePhysicalSystem(options = {}) {
  const presetId =
    options && MODELING_PRESETS[options.presetId]
      ? options.presetId
      : 'msd-underdamped';
  const preset = MODELING_PRESETS[presetId];

  const m = clamp(
    Number.isFinite(options.m) ? options.m : preset.defaults.m,
    M_MIN,
    M_MAX
  );
  const c = clamp(
    Number.isFinite(options.c) ? options.c : preset.defaults.c,
    C_MIN,
    C_MAX
  );
  const k = clamp(
    Number.isFinite(options.k) ? options.k : preset.defaults.k,
    K_MIN,
    K_MAX
  );
  const kp = clamp(
    Number.isFinite(options.kp) ? options.kp : preset.defaults.kp,
    KP_MIN,
    KP_MAX
  );
  const tMax =
    Number.isFinite(options.tMax) && options.tMax > 0
      ? options.tMax
      : T_MAX_DEFAULT;

  const kEff = k + kp;
  const yInf = 1.0; // Normalized unity-DC reference step target
  const wn = Math.sqrt(kEff / m);
  const zeta = c / (2 * Math.sqrt(m * kEff));
  const sigma = c / (2 * m); // Positive attenuation rate (pole real part = -sigma)

  let regime;
  let wd = 0;
  let poles;
  let overshootPct = 0;
  let settlingTime = Infinity;
  let peakTime = Infinity;
  let polesLatex = '';

  if (zeta < 1e-4) {
    regime = 'UNDAMPED';
    wd = wn;
    poles = [
      { re: 0, im: normalizeZero(wn) },
      { re: 0, im: normalizeZero(-wn) },
    ];
    overshootPct = 100.0;
    settlingTime = Infinity;
    peakTime = Math.PI / wn;
    polesLatex = `s_{1,2} = \\pm ${wn.toFixed(2)}j`;
  } else if (zeta < 1 - 1e-3) {
    regime = 'UNDERDAMPED';
    const sqrtTerm = Math.sqrt(1 - zeta * zeta);
    wd = wn * sqrtTerm;
    poles = [
      { re: normalizeZero(-sigma), im: normalizeZero(wd) },
      { re: normalizeZero(-sigma), im: normalizeZero(-wd) },
    ];
    overshootPct = 100 * Math.exp((-Math.PI * zeta) / sqrtTerm);
    settlingTime = 4 / sigma;
    peakTime = Math.PI / wd;
    polesLatex = `s_{1,2} = ${(-sigma).toFixed(2)} \\pm ${wd.toFixed(2)}j`;
  } else if (Math.abs(zeta - 1) <= 1e-3) {
    regime = 'CRITICAL';
    wd = 0;
    const pReal = normalizeZero(-wn);
    poles = [
      { re: pReal, im: 0 },
      { re: pReal, im: 0 },
    ];
    overshootPct = 0.0;
    settlingTime = CRIT_SETTLE_CONST / wn;
    peakTime = Infinity;
    polesLatex = `s_{1,2} = ${pReal.toFixed(2)}\\;(\\text{double})`;
  } else {
    regime = 'OVERDAMPED';
    wd = 0;
    const alpha = wn * Math.sqrt(zeta * zeta - 1);
    const r1 = normalizeZero(-sigma + alpha); // dominant slower pole
    const r2 = normalizeZero(-sigma - alpha); // faster pole
    poles = [
      { re: r1, im: 0 },
      { re: r2, im: 0 },
    ];
    overshootPct = 0.0;
    settlingTime = computeOverdampedSettlingTime(r1, r2);
    peakTime = Infinity;
    polesLatex = `s_1 = ${r1.toFixed(2)},\\; s_2 = ${r2.toFixed(2)}`;
  }

  const { odeLatex, tfLatex } = buildDomainLatex(
    preset.domain,
    m,
    c,
    k,
    kp,
    kEff
  );

  // Generate exact closed-form analytical step samples
  const samples = new Array(SAMPLE_COUNT + 1);
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const t = i === SAMPLE_COUNT ? tMax : (i / SAMPLE_COUNT) * tMax;
    samples[i] = evaluateExactStepAt(wn, zeta, sigma, yInf, t);
  }

  const peakY =
    regime === 'UNDAMPED' || regime === 'UNDERDAMPED'
      ? yInf * (1 + overshootPct / 100)
      : yInf;

  return {
    presetId,
    label: preset.label,
    domain: preset.domain,
    paramLabels: { ...preset.paramLabels },
    m,
    c,
    k,
    kp,
    kEff,
    yInf,
    dcGain: 1 / kEff,
    closedLoop: kp > 1e-6,
    wn,
    zeta,
    sigma,
    wd,
    regime,
    poles,
    overshootPct,
    settlingTime,
    peakTime,
    peakY,
    odeLatex,
    tfLatex,
    polesLatex,
    tMax,
    samples,
  };
}

// ============================================================================
// 2. SPATIAL CONSTANTS, PALETTE & PROCEDURAL GEOMETRY UTILITIES
// ============================================================================

const PLINTH_Y = -1.66;
const PLINTH_WIDTH = 9.5;
const PLINTH_DEPTH = 3.8;
const PLINTH_HEIGHT = 0.26;
const PLINTH_OFFSET_X = 0.22;

// Left Side: Glowing Vertical 3D Complex s-Plane Glass Panel
const SPLANE_POS_X = -3.28;
const SPLANE_POS_Y = 0.16;
const SPLANE_POS_Z = 0.12;
const SPLANE_ROT_Y = 0.36; // Gently angled toward viewer for crisp readability
const SPLANE_WIDTH = 2.48;
const SPLANE_HEIGHT = 2.66;
const SPLANE_THICKNESS = 0.055;
const SPLANE_ORIGIN_U = 0.62; // Imaginary axis (sigma = 0) toward right third -> wide LHP
const SPLANE_SCALE = 0.175; // Isotropic units per rad/s (true circular constant-wn semicircles)
const SPLANE_SIGMA_MIN = -10.0;
const SPLANE_SIGMA_MAX = 2.8;
const SPLANE_OMEGA_MAX = 6.8;

// Center: Sculpted 3D Step Response Curve y(t)
const T_ORIGIN_X = -1.85;
const T_SPAN_X = 4.25; // t in [0, 6] maps cleanly to x in [-1.85, +2.40]
const Y_ZERO_WORLD = -0.96;
const SCALE_Y = 1.24; // y = 0 -> -0.96, y = 1.0 -> +0.28, y = 2.0 -> +1.52
const Y_VIS_MIN = -0.25;
const Y_VIS_MAX = 2.25;

// Right Side: Live 3D Physical Hardware Rig (Mechanical MSD / Electrical RLC)
const RIG_X = 3.58;
const RIG_TOP_PLATE_Y = 2.24;
const RIG_SPRING_TOP_Y = 2.14;
const RIG_BASE_TOP_Y = -1.55;
const RIG_MASS_LOCAL_X = -0.06;
const RIG_DAMPER_LOCAL_X = 0.44;

const COLORS = {
  studioBg: 0x0b0d12,
  cyan: 0x22d3ee,
  cyanLight: 0x67e8f9,
  cyanDeep: 0x0891b2,
  amber: 0xf59e0b,
  amberLight: 0xfcd34d,
  violet: 0xa78bfa,
  violetLight: 0xc4b5fd,
  violetDeep: 0x7c3aed,
  emerald: 0x34d399,
  emeraldLight: 0x6ee7b7,
  emeraldDeep: 0x059669,
  coral: 0xfb7185,
  copper: 0xd97706,
  copperBright: 0xfbbf24,
  slateGlass: 0x0d1526,
  aluminum: 0x94a3b8,
  anodized: 0x1e293b,
  pcbDark: 0x0f172a,
};

const UP_VEC = new THREE.Vector3(0, 1, 0);
const _tmpDelta = new THREE.Vector3();
const _tmpMid = new THREE.Vector3();
const _tmpDir = new THREE.Vector3();
const _tmpQuat = new THREE.Quaternion();

/**
 * Align a unit-height (1.0), unit-radius (1.0) cylinder mesh between points pA and pB.
 */
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

/**
 * Construct a smooth TubeGeometry after filtering near-duplicate consecutive vertices.
 */
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
 * Create a rounded-rectangle 2D THREE.Shape centered at (0, 0).
 */
function createRoundedRectShape(width, height, radius) {
  const hw = width * 0.5;
  const hh = height * 0.5;
  const r = Math.min(radius, hw * 0.9, hh * 0.9);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return shape;
}

/**
 * Create a bevelled frosted-glass horizontal plinth slab whose top surface sits at y = 0.
 */
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

/**
 * Create a closed glowing perimeter tube around the top chamfer of the plinth.
 */
function createPlinthRimGeometry(width, depth, cornerRadius, tubeRadius = 0.015) {
  const shape = createRoundedRectShape(width, depth, cornerRadius);
  const pts2D = shape.getSpacedPoints(128);
  const pts3D = [];
  for (let i = 0; i < pts2D.length - 1; i++) {
    pts3D.push(new THREE.Vector3(pts2D[i].x, 0.008, pts2D[i].y));
  }
  const curve = new THREE.CatmullRomCurve3(pts3D, true, 'centripetal', 0.5);
  return new THREE.TubeGeometry(curve, 148, tubeRadius, 8, true);
}

/**
 * Create a vertical bevelled glass plate centered at origin lying in the XY plane (normal along +Z).
 */
function createFrontGlassPlateGeometry(widthX, heightY, thicknessZ, cornerRadius, bevel) {
  const innerW = Math.max(widthX - bevel * 2, 0.2);
  const innerH = Math.max(heightY - bevel * 2, 0.2);
  const coreT = Math.max(thicknessZ - bevel * 2, 0.01);
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
  geom.computeVertexNormals();
  return geom;
}

/**
 * Create a closed glowing perimeter tube in the XY plane around the s-plane glass panel.
 */
function createFrontRimGeometry(widthX, heightY, cornerRadius, tubeRadius = 0.015, zOffset = 0.028) {
  const shape = createRoundedRectShape(widthX, heightY, cornerRadius);
  const pts2D = shape.getSpacedPoints(112);
  const pts3D = [];
  for (let i = 0; i < pts2D.length - 1; i++) {
    pts3D.push(new THREE.Vector3(pts2D[i].x, pts2D[i].y, zOffset));
  }
  const curve = new THREE.CatmullRomCurve3(pts3D, true, 'centripetal', 0.5);
  return new THREE.TubeGeometry(curve, 128, tubeRadius, 8, true);
}

/**
 * Create a dynamic 3D helical coil spring TubeGeometry stretching vertically from topY to botY.
 */
function createHelicalSpringGeometry(
  centerX,
  centerZ,
  topY,
  botY,
  coilRadius = 0.145,
  turns = 7.5,
  wireRadius = 0.022
) {
  const span = Math.max(topY - botY, 0.22);
  const lead = Math.min(0.06, span * 0.12);
  const helixTop = topY - lead;
  const helixBot = botY + lead;
  const helixSpan = Math.max(helixTop - helixBot, 0.1);

  const pts = [];
  pts.push(new THREE.Vector3(centerX, topY, centerZ));
  pts.push(new THREE.Vector3(centerX, topY - lead * 0.65, centerZ));

  const totalSteps = 120;
  for (let i = 0; i <= totalSteps; i++) {
    const u = i / totalSteps;
    const angle = u * turns * Math.PI * 2;
    const endFade = Math.min(u / 0.06, (1 - u) / 0.06, 1);
    const r = coilRadius * (endFade * endFade * (3 - 2 * endFade));
    const y = helixTop - u * helixSpan;
    pts.push(new THREE.Vector3(centerX + Math.cos(angle) * r, y, centerZ + Math.sin(angle) * r));
  }

  pts.push(new THREE.Vector3(centerX, botY + lead * 0.65, centerZ));
  pts.push(new THREE.Vector3(centerX, botY, centerZ));

  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  return new THREE.TubeGeometry(curve, 112, wireRadius, 8, false);
}

/**
 * Create a wound copper toroidal inductor coil geometry (toroidal spiral around a ring).
 */
function createToroidalCoilGeometry(majorR = 0.22, minorR = 0.078, windings = 18, wireRadius = 0.014) {
  const pts = [];
  const totalSteps = windings * 16;
  for (let i = 0; i <= totalSteps; i++) {
    const u = i / totalSteps;
    const phi = u * Math.PI * 2;
    const theta = u * windings * Math.PI * 2;
    const r = majorR + minorR * Math.cos(theta);
    const x = r * Math.cos(phi);
    const y = minorR * Math.sin(theta);
    const z = r * Math.sin(phi);
    pts.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.5);
  return new THREE.TubeGeometry(curve, 240, wireRadius, 7, true);
}

/**
 * Build a translucent vertical step-response curtain from y(t) down to y = 0.
 * Highlights overshoot above setpoint y = 1.0 in warm luminous Amber.
 */
function createStepCurtainGeometry(worldSamples, baseWorldY, setpointWorldY, regime) {
  const n = worldSamples.length;
  if (n < 2) return new THREE.BufferGeometry();

  const positions = new Float32Array(n * 2 * 3);
  const colors = new Float32Array(n * 2 * 3);
  const indices = new Uint32Array((n - 1) * 6);

  const cBase = new THREE.Color(0x064e63);
  const cTop = new THREE.Color(
    regime === 'CRITICAL'
      ? COLORS.emerald
      : regime === 'OVERDAMPED'
      ? COLORS.violetLight
      : regime === 'UNDAMPED'
      ? COLORS.amber
      : COLORS.cyan
  );
  const cOvershoot = new THREE.Color(COLORS.amberLight);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < n; i++) {
    const s = worldSamples[i];
    const baseIdx = i * 6;

    positions[baseIdx] = s.wx;
    positions[baseIdx + 1] = baseWorldY;
    positions[baseIdx + 2] = 0;
    colors[baseIdx] = cBase.r;
    colors[baseIdx + 1] = cBase.g;
    colors[baseIdx + 2] = cBase.b;

    positions[baseIdx + 3] = s.wx;
    positions[baseIdx + 4] = s.wy;
    positions[baseIdx + 5] = 0;

    const overAmount = clamp((s.wy - setpointWorldY) / (SCALE_Y * 0.6), 0, 1);
    tmpColor.copy(cTop).lerp(cOvershoot, overAmount * 0.78);
    const heightGlow = clamp(Math.abs(s.wy - baseWorldY) / (SCALE_Y * 1.05), 0.35, 1.0);

    colors[baseIdx + 3] = tmpColor.r * heightGlow;
    colors[baseIdx + 4] = tmpColor.g * heightGlow;
    colors[baseIdx + 5] = tmpColor.b * heightGlow;
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

/**
 * Procedural radial glow texture for studio floor ambient light pool.
 */
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
 * Create a crisp floating canvas-badge texture for 3D axis/plane annotations.
 */
function createTextBadgeTexture(text, { color = '#e2e8f0', bg = 'rgba(13,21,38,0.65)', border = 'rgba(34,211,238,0.45)', fontSize = 26 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bg) {
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(6, 8, canvas.width - 12, canvas.height - 16, 14);
      ctx.fill();
    }
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(6, 8, canvas.width - 12, canvas.height - 16, 14);
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Dispose all geometries and materials inside a dynamic group without touching shared assets.
 */
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
// 3. MODELING 3D STUDIO CLASS
// ============================================================================

export class Modeling3DStudio {
  constructor(options = {}) {
    this._applyOptions(options, true);

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
    this._sPlaneGroup = null;
    this._sPlaneDynamicGroup = null;
    this._axesGroup = null;
    this._curveGroup = null;
    this._lensGroup = null;
    this._probeGroup = null;
    this._rigGroup = null;
    this._mechRigGroup = null;
    this._rlcRigGroup = null;

    // Resource registries for zero-leak cleanup
    this._sharedGeometries = new Set();
    this._sharedMaterials = new Set();
    this._ownedTextures = [];

    // Cached analysis state
    this._analysis = null;
    this._runAnalysis();

    // Cached spring state to avoid redundant TubeGeometry rebuilds
    this._lastSpringBotY = NaN;
    this._lastSpringWireR = NaN;

    // Critical damping collision pulse timer
    this._criticalFlashTimer = 0;
    this._prevRegime = this._analysis ? this._analysis.regime : null;

    // Lifecycle & animation handles
    this._rafId = null;
    this._resizeObserver = null;
    this._clock = null;
    this._initialized = false;
    this._disposed = false;

    this._camTransition = null;
    this._sweepAnim = null;

    // Bound callbacks
    this._onAnimate = this._animate.bind(this);
    this._onControlsStart = () => {
      this._camTransition = null;
    };
  }

  _applyOptions(options = {}, isConstructor = false) {
    if (typeof options.onTelemetry === 'function') {
      this.onTelemetry = options.onTelemetry;
    } else if (typeof options.onChange === 'function') {
      this.onTelemetry = options.onChange;
    } else if (isConstructor) {
      this.onTelemetry = null;
    }

    const chosenPresetId = MODELING_PRESETS[options.presetId]
      ? options.presetId
      : isConstructor
      ? 'msd-underdamped'
      : this.presetId || 'msd-underdamped';
    this.presetId = chosenPresetId;
    const preset = MODELING_PRESETS[this.presetId];

    if (Number.isFinite(options.m)) {
      this.m = clamp(options.m, M_MIN, M_MAX);
    } else if (isConstructor || options.presetId) {
      this.m = preset.defaults.m;
    }

    if (Number.isFinite(options.c)) {
      this.c = clamp(options.c, C_MIN, C_MAX);
    } else if (isConstructor || options.presetId) {
      this.c = preset.defaults.c;
    }

    if (Number.isFinite(options.k)) {
      this.k = clamp(options.k, K_MIN, K_MAX);
    } else if (isConstructor || options.presetId) {
      this.k = preset.defaults.k;
    }

    if (Number.isFinite(options.kp)) {
      this.kp = clamp(options.kp, KP_MIN, KP_MAX);
    } else if (isConstructor || options.presetId) {
      this.kp = preset.defaults.kp;
    }

    if (typeof options.showSPlane === 'boolean') {
      this.showSPlane = options.showSPlane;
    } else if (isConstructor) {
      this.showSPlane = true;
    }

    if (typeof options.mechatronicsLens === 'boolean') {
      this.mechatronicsLens = options.mechatronicsLens;
    } else if (isConstructor) {
      this.mechatronicsLens = false;
    }

    if (Number.isFinite(options.t)) {
      this.t = clamp(options.t, T_MIN, T_MAX_DEFAULT);
    } else if (isConstructor) {
      this.t = 1.15;
    }

    if (isConstructor) {
      this.tMax = T_MAX_DEFAULT;
      this.cameraPreset = '3d';
    }
  }

  // --------------------------------------------------------------------------
  // Analysis & Coordinate Mapping
  // --------------------------------------------------------------------------

  _getPreset() {
    return MODELING_PRESETS[this.presetId] || MODELING_PRESETS['msd-underdamped'];
  }

  _runAnalysis() {
    const prevRegime = this._analysis ? this._analysis.regime : null;
    this._analysis = analyzePhysicalSystem({
      presetId: this.presetId,
      m: this.m,
      c: this.c,
      k: this.k,
      kp: this.kp,
      tMax: this.tMax || T_MAX_DEFAULT,
    });
    if (this._analysis.regime === 'CRITICAL' && prevRegime !== 'CRITICAL') {
      this._criticalFlashTimer = 1.0;
    }
    this._prevRegime = this._analysis.regime;
  }

  _evalAtTime(t) {
    const a = this._analysis;
    return evaluateExactStepAt(a.wn, a.zeta, a.sigma, a.yInf, clamp(t, T_MIN, this.tMax));
  }

  _tToWorldX(t) {
    return T_ORIGIN_X + ((t - T_MIN) / (this.tMax - T_MIN)) * T_SPAN_X;
  }

  _yToWorldY(y) {
    return Y_ZERO_WORLD + clamp(y, Y_VIS_MIN, Y_VIS_MAX) * SCALE_Y;
  }

  /**
   * Map complex s = re + j*im to local (u, v) coordinates on the 3D s-Plane Glass Panel.
   */
  _sToPanelLocal(re, im) {
    const clampedRe = clamp(re, SPLANE_SIGMA_MIN, SPLANE_SIGMA_MAX);
    const clampedIm = clamp(im, -SPLANE_OMEGA_MAX, SPLANE_OMEGA_MAX);
    return {
      u: clamp(SPLANE_ORIGIN_U + clampedRe * SPLANE_SCALE, -SPLANE_WIDTH * 0.45, SPLANE_WIDTH * 0.45),
      v: clamp(clampedIm * SPLANE_SCALE, -SPLANE_HEIGHT * 0.43, SPLANE_HEIGHT * 0.43),
    };
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
      this._applyOptions(options, false);
      this._runAnalysis();
    }

    const width = Math.max(container.clientWidth || 800, 1);
    const height = Math.max(container.clientHeight || 520, 1);

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(COLORS.studioBg, 0.017);
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);

    // 2. Renderer (Spline-quality physical rendering)
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

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.42, 0.55, 0.72);
    this.composer.addPass(this.bloomPass);

    // 5. Damped OrbitControls
    this.controls = new OrbitControls(this.camera, dom);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI * 0.65;
    this.controls.minPolarAngle = 0.1;
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
    this._sPlaneGroup = new THREE.Group();
    this._axesGroup = new THREE.Group();
    this._curveGroup = new THREE.Group();
    this._lensGroup = new THREE.Group();
    this._probeGroup = new THREE.Group();
    this._rigGroup = new THREE.Group();

    this._stageGroup.add(
      this._plinthGroup,
      this._sPlaneGroup,
      this._axesGroup,
      this._curveGroup,
      this._lensGroup,
      this._probeGroup,
      this._rigGroup
    );

    this._buildPlinth();
    this._buildSPlanePanel();
    this._buildAxesAndSetpoint();
    this._buildProbe();
    this._buildPhysicalRigs();

    this._sPlaneGroup.visible = this.showSPlane;
    this._lensGroup.visible = this.mechatronicsLens;

    // Populate dynamic curve, s-plane poles, and live hardware rig
    this._rebuildDynamicGeometry();
    this._updateLiveVisuals();

    // Snap initial camera preset
    this._applyCameraPresetImmediate(this.cameraPreset);

    // Observe container resize
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => this.resize());
      this._resizeObserver.observe(container);
    }

    this._clock = new THREE.Clock();
    this._clock.start();
    this._initialized = true;
    this._rafId = requestAnimationFrame(this._onAnimate);
    this._emitTelemetry();

    return this;
  }

  _setupLighting() {
    const hemi = new THREE.HemisphereLight(0xcbd5e1, 0x0b1120, 0.58);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.38);
    keyLight.position.set(5.2, 9.6, 8.2);
    this.scene.add(keyLight);

    const cyanRim = new THREE.PointLight(COLORS.cyan, 2.0, 24, 1.5);
    cyanRim.position.set(5.8, 3.0, 3.6);
    this.scene.add(cyanRim);

    const violetFill = new THREE.PointLight(COLORS.violet, 1.85, 22, 1.5);
    violetFill.position.set(-5.8, 2.5, 3.8);
    this.scene.add(violetFill);

    const amberBack = new THREE.PointLight(COLORS.amber, 1.35, 22, 1.6);
    amberBack.position.set(0.2, 3.5, -5.6);
    this.scene.add(amberBack);

    const emeraldAccent = new THREE.PointLight(COLORS.emerald, 1.15, 20, 1.6);
    emeraldAccent.position.set(-2.8, 1.2, 4.4);
    this.scene.add(emeraldAccent);
  }

  _createSharedResources() {
    this._unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 18, 1, false);
    this._unitCone = new THREE.ConeGeometry(1, 1, 20);
    this._unitBox = new THREE.BoxGeometry(1, 1, 1);
    this._unitSphere = new THREE.SphereGeometry(1, 20, 20);
    this._unitTorus = new THREE.TorusGeometry(1, 0.08, 12, 42);
    this._unitOcta = new THREE.OctahedronGeometry(1, 0);
    this._sharedGeometries.add(
      this._unitCylinder,
      this._unitCone,
      this._unitBox,
      this._unitSphere,
      this._unitTorus,
      this._unitOcta
    );

    // Sculpted Step Response Tube Material (color/emissive updated by regime)
    this._matResponseTube = new THREE.MeshPhysicalMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.08,
      roughness: 0.12,
      metalness: 0.24,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.5,
    });

    // Translucent Step Response Curtain Material
    this._matStepCurtain = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Anodized Aluminum & Brushed Steel Materials
    this._matAnodized = new THREE.MeshStandardMaterial({
      color: COLORS.anodized,
      roughness: 0.36,
      metalness: 0.82,
      envMapIntensity: 1.2,
    });

    this._matSteel = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.18,
      metalness: 0.92,
      envMapIntensity: 1.5,
    });

    this._matBrass = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.24,
      metalness: 0.88,
      envMapIntensity: 1.4,
    });

    this._matCopperCoil = new THREE.MeshPhysicalMaterial({
      color: 0xea7a2e,
      emissive: 0x92400e,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.92,
      clearcoat: 0.8,
      envMapIntensity: 1.6,
    });

    // Spring Wire Material
    this._matSpring = new THREE.MeshPhysicalMaterial({
      color: 0x7dd3fc,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.16,
      metalness: 0.86,
      clearcoat: 1.0,
      envMapIntensity: 1.5,
    });

    // Translucent Glass Cylinder (Damper & Capacitor)
    this._matBorosilicate = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.72,
      thickness: 0.25,
      transparent: true,
      opacity: 0.42,
      clearcoat: 1.0,
      depthWrite: false,
    });

    // Hydraulic Damper Fluid
    this._matDamperFluid = new THREE.MeshPhysicalMaterial({
      color: COLORS.amber,
      emissive: COLORS.amber,
      emissiveIntensity: 0.55,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    });

    // Mass Block Material
    this._matMassBlock = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      emissive: 0x0e7490,
      emissiveIntensity: 0.25,
      roughness: 0.22,
      metalness: 0.78,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.45,
    });

    // Luminous LED / Accent Materials
    this._matCyanGlow = new THREE.MeshStandardMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.35,
      roughness: 0.12,
      metalness: 0.2,
    });

    this._matAmberGlow = new THREE.MeshStandardMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.35,
      roughness: 0.12,
      metalness: 0.2,
    });

    this._matEmeraldGlow = new THREE.MeshStandardMaterial({
      color: COLORS.emeraldLight,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.4,
      roughness: 0.12,
      metalness: 0.2,
    });

    this._matVioletGlow = new THREE.MeshStandardMaterial({
      color: COLORS.violetLight,
      emissive: COLORS.violet,
      emissiveIntensity: 1.25,
      roughness: 0.14,
      metalness: 0.2,
    });

    this._matPolePrimary = new THREE.MeshPhysicalMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.7,
      roughness: 0.08,
      metalness: 0.15,
      clearcoat: 1.0,
    });

    this._matPoleSecondary = new THREE.MeshPhysicalMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.7,
      roughness: 0.08,
      metalness: 0.15,
      clearcoat: 1.0,
    });

    this._matCapacitorGlow = new THREE.MeshPhysicalMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.15,
      roughness: 0.12,
      metalness: 0.15,
      transparent: true,
      opacity: 0.72,
      clearcoat: 1.0,
    });

    this._matResistorGlow = new THREE.MeshStandardMaterial({
      color: 0xd6d3d1,
      emissive: COLORS.amber,
      emissiveIntensity: 0.2,
      roughness: 0.32,
      metalness: 0.28,
    });

    this._matInductorFlux = new THREE.MeshBasicMaterial({
      color: COLORS.violetLight,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this._matLaserLine = new THREE.MeshBasicMaterial({
      color: COLORS.cyanLight,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this._sharedMaterials.add(
      this._matResponseTube,
      this._matStepCurtain,
      this._matAnodized,
      this._matSteel,
      this._matBrass,
      this._matCopperCoil,
      this._matSpring,
      this._matBorosilicate,
      this._matDamperFluid,
      this._matMassBlock,
      this._matCyanGlow,
      this._matAmberGlow,
      this._matEmeraldGlow,
      this._matVioletGlow,
      this._matPolePrimary,
      this._matPoleSecondary,
      this._matCapacitorGlow,
      this._matResistorGlow,
      this._matInductorFlux,
      this._matLaserLine
    );
  }

  // --------------------------------------------------------------------------
  // Scene Construction: Floating Studio Plinth
  // --------------------------------------------------------------------------

  _buildPlinth() {
    this._plinthGroup.position.set(PLINTH_OFFSET_X, PLINTH_Y, 0);

    // Frosted dark glass slab
    const slabGeo = createPlinthSlabGeometry(PLINTH_WIDTH, PLINTH_DEPTH, PLINTH_HEIGHT, 0.34, 0.045);
    const slabMat = new THREE.MeshPhysicalMaterial({
      color: COLORS.slateGlass,
      roughness: 0.22,
      metalness: 0.34,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.92,
      envMapIntensity: 1.35,
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    this._plinthGroup.add(slab);

    // Subtle glowing chamfer perimeter rim
    const rimGeo = createPlinthRimGeometry(PLINTH_WIDTH - 0.06, PLINTH_DEPTH - 0.06, 0.32, 0.015);
    this._plinthRimMat = new THREE.MeshStandardMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.15,
      roughness: 0.15,
      metalness: 0.25,
    });
    const rim = new THREE.Mesh(rimGeo, this._plinthRimMat);
    this._plinthGroup.add(rim);

    // Precision etched top-surface grid
    const gridVerts = [];
    const halfW = PLINTH_WIDTH * 0.47;
    const halfD = PLINTH_DEPTH * 0.45;
    const yG = 0.004;
    for (let x = -4.2; x <= 4.21; x += 0.6) {
      gridVerts.push(x, yG, -halfD, x, yG, halfD);
    }
    for (let z = -1.5; z <= 1.51; z += 0.5) {
      gridVerts.push(-halfW, yG, z, halfW, yG, z);
    }
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridVerts, 3));
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.11,
    });
    this._plinthGroup.add(new THREE.LineSegments(gridGeo, gridMat));

    // Ambient floor light pool beneath floating plinth
    const glowTex = createRadialGlowTexture(
      'rgba(34,211,238,0.22)',
      'rgba(124,58,237,0.09)',
      'rgba(11,13,18,0.0)'
    );
    this._ownedTextures.push(glowTex);
    const floorGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(PLINTH_WIDTH * 1.45, PLINTH_DEPTH * 1.9),
      new THREE.MeshBasicMaterial({
        map: glowTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    floorGlow.rotation.x = -Math.PI / 2;
    floorGlow.position.y = -PLINTH_HEIGHT - 0.16;
    this._plinthGroup.add(floorGlow);

    // Subtle Inverse Laplace signal conduit trace along plinth deck (s-plane -> y(t) origin)
    const conduitPts = [
      new THREE.Vector3(-3.0 - PLINTH_OFFSET_X, 0.016, 0.18),
      new THREE.Vector3(-2.55 - PLINTH_OFFSET_X, 0.016, 0.1),
      new THREE.Vector3(T_ORIGIN_X - PLINTH_OFFSET_X, 0.016, 0.0),
    ];
    const conduitGeo = createSafeTubeGeometry(conduitPts, 28, 0.011, 8);
    const conduitMat = new THREE.MeshStandardMaterial({
      color: COLORS.violetLight,
      emissive: COLORS.violet,
      emissiveIntensity: 1.0,
      roughness: 0.2,
    });
    this._plinthGroup.add(new THREE.Mesh(conduitGeo, conduitMat));
  }

  // --------------------------------------------------------------------------
  // Scene Construction: Left 3D Complex s-Plane Glass Panel
  // --------------------------------------------------------------------------

  _buildSPlanePanel() {
    this._sPlaneGroup.position.set(SPLANE_POS_X, SPLANE_POS_Y, SPLANE_POS_Z);
    this._sPlaneGroup.rotation.y = SPLANE_ROT_Y;

    // 1. Bevelled frosted-glass panel plate
    const plateGeo = createFrontGlassPlateGeometry(
      SPLANE_WIDTH,
      SPLANE_HEIGHT,
      SPLANE_THICKNESS,
      0.16,
      0.02
    );
    const plateMat = new THREE.MeshPhysicalMaterial({
      color: 0x0b1324,
      roughness: 0.16,
      metalness: 0.18,
      transmission: 0.36,
      thickness: 0.18,
      transparent: true,
      opacity: 0.78,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.4,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    this._sPlaneGroup.add(plate);

    // 2. Glowing perimeter rim tube (shifts to Emerald on Critical Damping!)
    const rimGeo = createFrontRimGeometry(SPLANE_WIDTH - 0.03, SPLANE_HEIGHT - 0.03, 0.15, 0.014, 0.03);
    this._sPlaneRimMat = new THREE.MeshStandardMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.15,
      roughness: 0.15,
      metalness: 0.25,
    });
    this._sPlaneGroup.add(new THREE.Mesh(rimGeo, this._sPlaneRimMat));

    // 3. Two machined aluminum mounting stanchions anchoring the panel into the plinth
    const stanchionTopY = -SPLANE_HEIGHT * 0.5;
    const stanchionBotY = PLINTH_Y - SPLANE_POS_Y;
    const stanchionH = Math.max(stanchionTopY - stanchionBotY, 0.12);
    for (const sx of [-0.78, 0.78]) {
      const post = new THREE.Mesh(this._unitCylinder, this._matAnodized);
      post.scale.set(0.045, stanchionH, 0.045);
      post.position.set(sx, stanchionBotY + stanchionH * 0.5, 0);
      this._sPlaneGroup.add(post);

      const foot = new THREE.Mesh(this._unitCylinder, this._matSteel);
      foot.scale.set(0.085, 0.035, 0.085);
      foot.position.set(sx, stanchionBotY + 0.018, 0);
      this._sPlaneGroup.add(foot);
    }

    // 4. LHP (Stable cool tint) & RHP (Unstable coral warning strip) overlay planes
    const zFace = SPLANE_THICKNESS * 0.5 + 0.006;
    const innerLeft = -SPLANE_WIDTH * 0.46;
    const innerRight = SPLANE_WIDTH * 0.46;
    const innerH = SPLANE_HEIGHT * 0.88;

    const lhpW = SPLANE_ORIGIN_U - innerLeft;
    const lhpMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(lhpW, innerH),
      new THREE.MeshBasicMaterial({
        color: 0x0891b2,
        transparent: true,
        opacity: 0.075,
        depthWrite: false,
      })
    );
    lhpMesh.position.set(innerLeft + lhpW * 0.5, 0, zFace);
    this._sPlaneGroup.add(lhpMesh);

    const rhpW = innerRight - SPLANE_ORIGIN_U;
    const rhpMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(rhpW, innerH),
      new THREE.MeshBasicMaterial({
        color: COLORS.coral,
        transparent: true,
        opacity: 0.095,
        depthWrite: false,
      })
    );
    rhpMesh.position.set(SPLANE_ORIGIN_U + rhpW * 0.5, 0, zFace);
    this._sPlaneGroup.add(rhpMesh);

    // 5. Fine Complex Plane Grid (2 rad/s spacing)
    const sGridVerts = [];
    const halfH = innerH * 0.5;
    for (let sig = -8; sig <= 2; sig += 2) {
      const u = SPLANE_ORIGIN_U + sig * SPLANE_SCALE;
      if (u > innerLeft && u < innerRight) {
        sGridVerts.push(u, -halfH, zFace + 0.002, u, halfH, zFace + 0.002);
      }
    }
    for (let om = -6; om <= 6; om += 2) {
      const v = om * SPLANE_SCALE;
      if (Math.abs(v) < halfH) {
        sGridVerts.push(innerLeft, v, zFace + 0.002, innerRight, v, zFace + 0.002);
      }
    }
    const sGridGeo = new THREE.BufferGeometry();
    sGridGeo.setAttribute('position', new THREE.Float32BufferAttribute(sGridVerts, 3));
    this._sPlaneGroup.add(
      new THREE.LineSegments(
        sGridGeo,
        new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.16 })
      )
    );

    // 6. Real (sigma) & Imaginary (j*omega) Glowing Axes
    const axisZ = zFace + 0.014;
    const realAxis = new THREE.Mesh(this._unitCylinder, this._matSteel);
    alignCylinderBetween(
      realAxis,
      new THREE.Vector3(innerLeft, 0, axisZ),
      new THREE.Vector3(innerRight, 0, axisZ),
      0.011
    );
    this._sPlaneGroup.add(realAxis);

    const imagAxis = new THREE.Mesh(this._unitCylinder, this._matCyanGlow);
    alignCylinderBetween(
      imagAxis,
      new THREE.Vector3(SPLANE_ORIGIN_U, -halfH, axisZ),
      new THREE.Vector3(SPLANE_ORIGIN_U, halfH, axisZ),
      0.013
    );
    this._sPlaneGroup.add(imagAxis);

    // Axis Arrowheads
    const realTip = new THREE.Mesh(this._unitCone, this._matSteel);
    realTip.scale.set(0.032, 0.085, 0.032);
    realTip.rotation.z = -Math.PI / 2;
    realTip.position.set(innerRight + 0.02, 0, axisZ);
    this._sPlaneGroup.add(realTip);

    const imagTip = new THREE.Mesh(this._unitCone, this._matCyanGlow);
    imagTip.scale.set(0.034, 0.09, 0.034);
    imagTip.position.set(SPLANE_ORIGIN_U, halfH + 0.025, axisZ);
    this._sPlaneGroup.add(imagTip);

    // 7. Floating Canvas Header & Axis Badges on the s-Plane Panel
    const addBadge = (text, x, y, z, w, h, styleOpts) => {
      const tex = createTextBadgeTexture(text, styleOpts);
      this._ownedTextures.push(tex);
      const badge = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          depthWrite: false,
        })
      );
      badge.position.set(x, y, z);
      this._sPlaneGroup.add(badge);
    };

    addBadge('LAPLACE s-PLANE', -0.22, SPLANE_HEIGHT * 0.5 + 0.19, 0.03, 1.38, 0.32, {
      color: '#67e8f9',
      border: 'rgba(34,211,238,0.55)',
      fontSize: 22,
    });
    addBadge('LHP · STABLE', -0.35, -halfH + 0.14, axisZ + 0.01, 0.86, 0.21, {
      color: '#34d399',
      bg: 'rgba(6,78,59,0.45)',
      border: 'rgba(52,211,153,0.4)',
      fontSize: 21,
    });
    addBadge('jω', SPLANE_ORIGIN_U + 0.22, halfH - 0.1, axisZ + 0.01, 0.34, 0.19, {
      color: '#67e8f9',
      bg: 'rgba(13,21,38,0.45)',
      border: null,
      fontSize: 26,
    });
    addBadge('σ', innerRight - 0.14, -0.14, axisZ + 0.01, 0.28, 0.18, {
      color: '#cbd5e1',
      bg: 'rgba(13,21,38,0.45)',
      border: null,
      fontSize: 26,
    });

    // 8. Persistent Pole Spheres, 3D '×' Markers, Orbital Halos & Critical Collision Ring
    this._poleGroupA = this._createPoleMarker(this._matPolePrimary);
    this._poleGroupB = this._createPoleMarker(this._matPoleSecondary);
    this._sPlaneGroup.add(this._poleGroupA, this._poleGroupB);

    // Critical Damping Emerald Collision Ring (flashes when poles collide at s = -wn!)
    this._criticalRingMat = new THREE.MeshBasicMaterial({
      color: COLORS.emeraldLight,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this._sharedMaterials.add(this._criticalRingMat);
    this._criticalRingMesh = new THREE.Mesh(this._unitTorus, this._criticalRingMat);
    this._criticalRingMesh.visible = false;
    this._sPlaneGroup.add(this._criticalRingMesh);

    // Dynamic group for constant-wn dashed semicircle, damping rays & root-locus guide
    this._sPlaneDynamicGroup = new THREE.Group();
    this._sPlaneGroup.add(this._sPlaneDynamicGroup);
  }

  _createPoleMarker(material) {
    const g = new THREE.Group();

    // Glowing core sphere
    const core = new THREE.Mesh(this._unitSphere, material);
    core.scale.setScalar(0.068);
    g.add(core);

    // Precision 3D '×' cross bars tilted at ±45° in front of the sphere
    const bar1 = new THREE.Mesh(this._unitBox, material);
    bar1.scale.set(0.22, 0.026, 0.026);
    bar1.rotation.z = Math.PI / 4;
    bar1.position.z = 0.036;
    g.add(bar1);

    const bar2 = new THREE.Mesh(this._unitBox, material);
    bar2.scale.set(0.22, 0.026, 0.026);
    bar2.rotation.z = -Math.PI / 4;
    bar2.position.z = 0.036;
    g.add(bar2);

    // Pulsing orbital bloom ring
    const halo = new THREE.Mesh(this._unitTorus, material);
    halo.scale.setScalar(0.13);
    halo.position.z = 0.015;
    g.add(halo);
    g.userData.halo = halo;
    g.userData.core = core;

    return g;
  }

  // --------------------------------------------------------------------------
  // Scene Construction: Center Time-Domain Axes & Setpoint Rail
  // --------------------------------------------------------------------------

  _buildAxesAndSetpoint() {
    const xStart = T_ORIGIN_X;
    const xEnd = T_ORIGIN_X + T_SPAN_X;
    const yZero = Y_ZERO_WORLD;
    const ySet = this._yToWorldY(1.0);
    const yTop = this._yToWorldY(2.05);

    // Time axis rail (x)
    const tAxis = new THREE.Mesh(this._unitCylinder, this._matSteel);
    alignCylinderBetween(
      tAxis,
      new THREE.Vector3(xStart, yZero, 0),
      new THREE.Vector3(xEnd + 0.18, yZero, 0),
      0.014
    );
    this._axesGroup.add(tAxis);

    const tTip = new THREE.Mesh(this._unitCone, this._matSteel);
    tTip.scale.set(0.038, 0.1, 0.038);
    tTip.rotation.z = -Math.PI / 2;
    tTip.position.set(xEnd + 0.21, yZero, 0);
    this._axesGroup.add(tTip);

    // Output axis rail (y)
    const yAxis = new THREE.Mesh(this._unitCylinder, this._matSteel);
    alignCylinderBetween(
      yAxis,
      new THREE.Vector3(xStart, yZero - 0.1, 0),
      new THREE.Vector3(xStart, yTop, 0),
      0.014
    );
    this._axesGroup.add(yAxis);

    const yTip = new THREE.Mesh(this._unitCone, this._matSteel);
    yTip.scale.set(0.038, 0.1, 0.038);
    yTip.position.set(xStart, yTop + 0.03, 0);
    this._axesGroup.add(yTip);

    // Time axis tick marks (t = 1..6s)
    for (let sec = 1; sec <= 6; sec++) {
      const tx = this._tToWorldX(sec);
      const tick = new THREE.Mesh(this._unitBox, this._matSteel);
      tick.scale.set(0.016, 0.08, 0.016);
      tick.position.set(tx, yZero - 0.02, 0);
      this._axesGroup.add(tick);
    }

    // Glowing dashed Setpoint Rail at y = 1.0
    const dashCount = 24;
    for (let i = 0; i < dashCount; i++) {
      const u0 = i / dashCount;
      const u1 = (i + 0.56) / dashCount;
      const seg = new THREE.Mesh(this._unitCylinder, this._matEmeraldGlow);
      alignCylinderBetween(
        seg,
        new THREE.Vector3(xStart + u0 * T_SPAN_X, ySet, 0),
        new THREE.Vector3(xStart + u1 * T_SPAN_X, ySet, 0),
        0.01
      );
      this._axesGroup.add(seg);
    }

    // Subtle ±2% Settling Band Ribbon (Mechatronics Lens group)
    const bandHalfH = 0.02 * SCALE_Y * 2.2; // visually crisp tolerance band
    const bandGeo = new THREE.PlaneGeometry(T_SPAN_X, bandHalfH * 2);
    const bandMat = new THREE.MeshBasicMaterial({
      color: COLORS.emerald,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const bandMesh = new THREE.Mesh(bandGeo, bandMat);
    bandMesh.position.set(xStart + T_SPAN_X * 0.5, ySet, -0.02);
    this._lensGroup.add(bandMesh);

    // Subtle Y-axis tick at y = 1.0 & y = 2.0
    for (const yVal of [1.0, 2.0]) {
      const wy = this._yToWorldY(yVal);
      const yTick = new THREE.Mesh(this._unitBox, yVal === 1.0 ? this._matEmeraldGlow : this._matSteel);
      yTick.scale.set(0.09, 0.018, 0.018);
      yTick.position.set(xStart - 0.03, wy, 0);
      this._axesGroup.add(yTick);
    }

    // Compact Axis Badges
    const addCenterBadge = (text, x, y, z, w, h, styleOpts) => {
      const tex = createTextBadgeTexture(text, styleOpts);
      this._ownedTextures.push(tex);
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
      );
      mesh.position.set(x, y, z);
      this._axesGroup.add(mesh);
    };

    addCenterBadge('STEP RESPONSE y(t)', xStart + T_SPAN_X * 0.5, yTop + 0.18, 0, 1.62, 0.3, {
      color: '#e2e8f0',
      border: 'rgba(56,189,248,0.4)',
      fontSize: 20,
    });
    addCenterBadge('r = 1.0', xStart - 0.3, ySet, 0.02, 0.54, 0.2, {
      color: '#6ee7b7',
      bg: 'rgba(6,78,59,0.5)',
      border: 'rgba(52,211,153,0.45)',
      fontSize: 22,
    });
    addCenterBadge('t (s)', xEnd + 0.22, yZero - 0.22, 0.02, 0.44, 0.19, {
      color: '#94a3b8',
      bg: 'rgba(13,21,38,0.45)',
      border: null,
      fontSize: 22,
    });
  }

  // --------------------------------------------------------------------------
  // Scene Construction: Animated Time Probe & Horizontal Rig Sync Laser
  // --------------------------------------------------------------------------

  _buildProbe() {
    this._probeCore = new THREE.Mesh(this._unitSphere, this._matCyanGlow);
    this._probeCore.scale.setScalar(0.088);
    this._probeGroup.add(this._probeCore);

    this._probeHalo = new THREE.Mesh(this._unitTorus, this._matCyanGlow);
    this._probeHalo.scale.setScalar(0.165);
    this._probeGroup.add(this._probeHalo);

    this._probeDropLine = new THREE.Mesh(this._unitCylinder, this._matLaserLine);
    this._probeGroup.add(this._probeDropLine);

    this._probeBaseDot = new THREE.Mesh(this._unitSphere, this._matCyanGlow);
    this._probeBaseDot.scale.setScalar(0.036);
    this._probeGroup.add(this._probeBaseDot);

    this._syncLaserBeam = new THREE.Mesh(this._unitCylinder, this._matLaserLine);
    this._probeGroup.add(this._syncLaserBeam);
  }

  // --------------------------------------------------------------------------
  // Scene Construction: Right-Side Dual-Domain Live 3D Physical Hardware Rigs
  // --------------------------------------------------------------------------

  _buildPhysicalRigs() {
    this._rigGroup.position.set(RIG_X, 0, 0);

    this._mechRigGroup = new THREE.Group();
    this._rlcRigGroup = new THREE.Group();
    this._rigGroup.add(this._mechRigGroup, this._rlcRigGroup);

    this._buildMechanicalRig();
    this._buildRLCCircuitRig();
  }

  /**
   * 3D Helical Spring + Translucent Hydraulic Damper + Anodized Mass Block + Servo Collar
   */
  _buildMechanicalRig() {
    const g = this._mechRigGroup;

    // 1. Machined base mounting plate sitting cleanly on plinth
    const basePlate = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 0.12, 1.05),
      this._matAnodized
    );
    basePlate.position.set(0.16, RIG_BASE_TOP_Y - 0.05, 0);
    g.add(basePlate);

    // 2. Top cross-head gantry plate
    const topPlate = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 0.11, 0.96),
      this._matAnodized
    );
    topPlate.position.set(0.16, RIG_TOP_PLATE_Y, 0);
    g.add(topPlate);

    // 3. Precision vertical brushed-steel guide columns (left & right back)
    const colH = RIG_TOP_PLATE_Y - RIG_BASE_TOP_Y;
    const colMidY = 0.5 * (RIG_TOP_PLATE_Y + RIG_BASE_TOP_Y);
    for (const [cx, cz] of [
      [-0.46, -0.34],
      [0.78, -0.34],
      [-0.46, 0.34],
      [0.78, 0.34],
    ]) {
      const rod = new THREE.Mesh(this._unitCylinder, this._matSteel);
      rod.scale.set(0.026, colH, 0.026);
      rod.position.set(cx, colMidY, cz);
      g.add(rod);
    }

    // Setpoint reference tick on front-left guide column
    const refTick = new THREE.Mesh(this._unitBox, this._matEmeraldGlow);
    refTick.scale.set(0.16, 0.026, 0.06);
    refTick.position.set(-0.46, this._yToWorldY(1.0), 0.34);
    g.add(refTick);

    // 4. Dynamic 3D Helical Coil Spring (rebuilt live on displacement / stiffness change)
    this._springMesh = new THREE.Mesh(new THREE.BufferGeometry(), this._matSpring);
    g.add(this._springMesh);

    // Top spring seat cap
    const springCap = new THREE.Mesh(this._unitCylinder, this._matSteel);
    springCap.scale.set(0.18, 0.05, 0.18);
    springCap.position.set(RIG_MASS_LOCAL_X, RIG_SPRING_TOP_Y + 0.02, 0);
    g.add(springCap);

    // 5. Parallel Hydraulic Dashpot / Damper Assembly
    const cylH = 1.62;
    const cylBotY = RIG_BASE_TOP_Y + 0.02;
    const cylCenterY = cylBotY + cylH * 0.5;

    // Outer translucent borosilicate damper housing
    const damperGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.145, 0.145, cylH, 24, 1, false),
      this._matBorosilicate
    );
    damperGlass.position.set(RIG_DAMPER_LOCAL_X, cylCenterY, 0);
    g.add(damperGlass);

    // Damper bottom & top metallic end-caps
    const damperFoot = new THREE.Mesh(this._unitCylinder, this._matAnodized);
    damperFoot.scale.set(0.168, 0.07, 0.168);
    damperFoot.position.set(RIG_DAMPER_LOCAL_X, cylBotY + 0.02, 0);
    g.add(damperFoot);

    const damperCollar = new THREE.Mesh(this._unitTorus, this._matSteel);
    damperCollar.rotation.x = Math.PI / 2;
    damperCollar.scale.setScalar(0.155);
    damperCollar.position.set(RIG_DAMPER_LOCAL_X, cylBotY + cylH, 0);
    g.add(damperCollar);

    // Luminous hydraulic damping fluid inside cylinder
    this._damperFluidMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.122, 0.122, cylH * 0.86, 20),
      this._matDamperFluid
    );
    this._damperFluidMesh.position.set(RIG_DAMPER_LOCAL_X, cylBotY + cylH * 0.45, 0);
    g.add(this._damperFluidMesh);

    // Reciprocating piston head & chrome connecting rod (moves with mass block!)
    this._damperPistonHead = new THREE.Mesh(this._unitCylinder, this._matBrass);
    this._damperPistonHead.scale.set(0.118, 0.075, 0.118);
    g.add(this._damperPistonHead);

    this._damperPistonRod = new THREE.Mesh(this._unitCylinder, this._matSteel);
    g.add(this._damperPistonRod);

    // 6. Anodized Mass Block Assembly (moves vertically with y(t))
    this._massAssembly = new THREE.Group();
    g.add(this._massAssembly);

    this._massCoreMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.3, 0.56),
      this._matMassBlock
    );
    this._massCoreMesh.position.set(RIG_MASS_LOCAL_X, 0, 0);
    this._massAssembly.add(this._massCoreMesh);

    // Glowing telemetry LED strip embedded in front face of mass block
    this._massLedStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.045, 0.025),
      this._matCyanGlow
    );
    this._massLedStrip.position.set(RIG_MASS_LOCAL_X, 0, 0.285);
    this._massAssembly.add(this._massLedStrip);

    // Crossbar arm linking Mass Block cleanly to the parallel Damper rod
    const yokeArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.06, 0.14),
      this._matSteel
    );
    yokeArm.position.set(0.24, 0, 0);
    this._massAssembly.add(yokeArm);

    // Live sync receptor pin on left edge of mass block (target for sync laser)
    const syncPin = new THREE.Mesh(this._unitSphere, this._matCyanGlow);
    syncPin.scale.setScalar(0.048);
    syncPin.position.set(-0.46, 0, 0);
    this._massAssembly.add(syncPin);

    // 7. Closed-Loop Proportional Feedback Servo Halo Ring (active when kp > 0)
    this._servoRingMat = new THREE.MeshStandardMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.4,
      roughness: 0.15,
      metalness: 0.4,
    });
    this._sharedMaterials.add(this._servoRingMat);
    this._servoRingMesh = new THREE.Mesh(this._unitTorus, this._servoRingMat);
    this._servoRingMesh.rotation.x = Math.PI / 2;
    this._servoRingMesh.scale.setScalar(0.48);
    this._servoRingMesh.position.set(RIG_MASS_LOCAL_X, 0, 0);
    this._massAssembly.add(this._servoRingMesh);

    // Hardware Rig Header Badge
    const mechTex = createTextBadgeTexture('PHYSICAL PLANT', {
      color: '#e2e8f0',
      border: 'rgba(34,211,238,0.45)',
      fontSize: 21,
    });
    this._ownedTextures.push(mechTex);
    const mechBadge = new THREE.Mesh(
      new THREE.PlaneGeometry(1.32, 0.28),
      new THREE.MeshBasicMaterial({ map: mechTex, transparent: true, depthWrite: false })
    );
    mechBadge.position.set(0.16, RIG_TOP_PLATE_Y + 0.26, 0.05);
    g.add(mechBadge);
  }

  /**
   * 3D Glowing Series RLC Circuit Module:
   * Copper Toroidal Inductor (L) + Precision Glowing Resistor (R) + Charging Capacitor Plates (C)
   */
  _buildRLCCircuitRig() {
    const g = this._rlcRigGroup;

    // 1. Dark PCB / Frosted Instrumentation Chassis elevated slightly above plinth
    const boardY = RIG_BASE_TOP_Y + 0.06;
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.56, 0.1, 1.18),
      new THREE.MeshPhysicalMaterial({
        color: COLORS.pcbDark,
        roughness: 0.28,
        metalness: 0.42,
        clearcoat: 1.0,
        envMapIntensity: 1.3,
      })
    );
    board.position.set(0.16, boardY, 0);
    g.add(board);

    // 4 Brass mounting standoffs
    for (const [sx, sz] of [
      [-0.52, -0.48],
      [0.84, -0.48],
      [-0.52, 0.48],
      [0.84, 0.48],
    ]) {
      const standoff = new THREE.Mesh(this._unitCylinder, this._matBrass);
      standoff.scale.set(0.036, 0.14, 0.036);
      standoff.position.set(sx, boardY - 0.08, sz);
      g.add(standoff);
    }

    // Glowing copper series busbar trace rectangle on top of PCB
    const traceY = boardY + 0.065;
    const tracePts = [
      new THREE.Vector3(-0.46, traceY, -0.38),
      new THREE.Vector3(0.78, traceY, -0.38),
      new THREE.Vector3(0.78, traceY, 0.38),
      new THREE.Vector3(-0.46, traceY, 0.38),
      new THREE.Vector3(-0.46, traceY, -0.38),
    ];
    const traceGeo = createSafeTubeGeometry(tracePts, 48, 0.015, 8);
    g.add(new THREE.Mesh(traceGeo, this._matCopperCoil));

    // 2. 3D Copper Toroidal Inductor Coil (L) — Front-Right Component
    const inductorGroup = new THREE.Group();
    inductorGroup.position.set(0.56, boardY + 0.32, 0.24);
    g.add(inductorGroup);

    const ferriteCore = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.058, 16, 36),
      this._matAnodized
    );
    ferriteCore.rotation.x = Math.PI / 2;
    inductorGroup.add(ferriteCore);

    const copperWindings = new THREE.Mesh(
      createToroidalCoilGeometry(0.2, 0.074, 18, 0.013),
      this._matCopperCoil
    );
    inductorGroup.add(copperWindings);

    // Pulsing Magnetic Flux Halo around Inductor (responds to live current i(t) ~ |yd|)
    this._inductorFluxHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.032, 12, 36),
      this._matInductorFlux
    );
    this._inductorFluxHalo.rotation.x = Math.PI / 2;
    inductorGroup.add(this._inductorFluxHalo);

    // 3. 3D Precision Axial Resistor (R) — Back-Right Component
    const resistorGroup = new THREE.Group();
    resistorGroup.position.set(0.56, boardY + 0.3, -0.3);
    g.add(resistorGroup);

    const resBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.088, 0.088, 0.52, 20),
      this._matResistorGlow
    );
    resBody.rotation.z = Math.PI / 2;
    resistorGroup.add(resBody);

    // Precision metallic end caps + color-code bands
    for (const ex of [-0.26, 0.26]) {
      const cap = new THREE.Mesh(this._unitCylinder, this._matSteel);
      cap.scale.set(0.098, 0.06, 0.098);
      cap.rotation.z = Math.PI / 2;
      cap.position.x = ex;
      resistorGroup.add(cap);

      const lead = new THREE.Mesh(this._unitCylinder, this._matCopperCoil);
      lead.scale.set(0.016, 0.28, 0.016);
      lead.position.set(ex, -0.14, 0);
      resistorGroup.add(lead);
    }

    const bandColors = [COLORS.amber, COLORS.cyan, COLORS.violet, COLORS.copperBright];
    const bandOffsets = [-0.14, -0.04, 0.06, 0.16];
    for (let i = 0; i < bandColors.length; i++) {
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.092, 0.092, 0.034, 20),
        new THREE.MeshStandardMaterial({
          color: bandColors[i],
          emissive: bandColors[i],
          emissiveIntensity: 0.7,
          roughness: 0.2,
          metalness: 0.5,
        })
      );
      band.rotation.z = Math.PI / 2;
      band.position.x = bandOffsets[i];
      resistorGroup.add(band);
    }

    // 4. 3D Translucent Charging Capacitor Column (C) — Left Vertical Tower (synced to v_C(t) = y(t))
    const capX = -0.22;
    const capBotY = boardY + 0.12;
    const capTopY = 1.98;
    const capSpan = capTopY - capBotY;
    const capMidY = 0.5 * (capBotY + capTopY);

    // Two tall precision brushed-aluminum parallel capacitor plates
    for (const pz of [-0.24, 0.24]) {
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.54, capSpan, 0.042),
        this._matSteel
      );
      plate.position.set(capX, capMidY, pz);
      g.add(plate);

      // Luminous edge trim along each capacitor plate
      const edgeTrim = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, capSpan, 0.012),
        this._matCyanGlow
      );
      edgeTrim.position.set(capX, capMidY, pz > 0 ? pz + 0.024 : pz - 0.024);
      g.add(edgeTrim);
    }

    // Translucent sapphire dielectric chamber between plates
    const dielectric = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, capSpan - 0.06, 0.42),
      this._matBorosilicate
    );
    dielectric.position.set(capX, capMidY, 0);
    g.add(dielectric);

    // Live Volumetric Charge Column inside capacitor dielectric (grows from y=0 to v_C(t)!)
    this._capChargeColumn = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 1.0, 0.34),
      this._matCapacitorGlow
    );
    this._capChargeColumn.position.set(capX, Y_ZERO_WORLD, 0);
    g.add(this._capChargeColumn);

    // Live Voltage Indicator Bar & Sync Receptor Pin (moves directly to _yToWorldY(v_C))
    this._capVoltageBar = new THREE.Group();
    g.add(this._capVoltageBar);

    const vBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.64, 0.048, 0.56),
      this._matCyanGlow
    );
    vBar.position.set(capX, 0, 0);
    this._capVoltageBar.add(vBar);

    const vSyncPin = new THREE.Mesh(this._unitSphere, this._matCyanGlow);
    vSyncPin.scale.setScalar(0.052);
    vSyncPin.position.set(-0.56, 0, 0);
    this._capVoltageBar.add(vSyncPin);

    // Setpoint reference ring on capacitor tower at v_C = 1.0
    const capRefTick = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.022, 0.54),
      this._matEmeraldGlow
    );
    capRefTick.position.set(capX, this._yToWorldY(1.0), 0);
    g.add(capRefTick);

    // RLC Circuit Header Badge
    const rlcTex = createTextBadgeTexture('SERIES RLC CIRCUIT', {
      color: '#fcd34d',
      border: 'rgba(245,158,11,0.55)',
      fontSize: 20,
    });
    this._ownedTextures.push(rlcTex);
    const rlcBadge = new THREE.Mesh(
      new THREE.PlaneGeometry(1.44, 0.28),
      new THREE.MeshBasicMaterial({ map: rlcTex, transparent: true, depthWrite: false })
    );
    rlcBadge.position.set(0.16, RIG_TOP_PLATE_Y + 0.26, 0.05);
    g.add(rlcBadge);
  }

  // --------------------------------------------------------------------------
  // Dynamic Geometry Rebuilds (Step Tube, Curtain, Overshoot Beacon, s-Plane Loci)
  // --------------------------------------------------------------------------

  _rebuildDynamicGeometry() {
    if (!this._initialized && !this._curveGroup) return;
    const a = this._analysis;

    // 1. Update Step Response Curve Tube & Translucent Curtain
    disposeGroupChildren(this._curveGroup, this._sharedMaterials, this._sharedGeometries);

    const regimeColor =
      a.regime === 'CRITICAL'
        ? { c: COLORS.emeraldLight, e: COLORS.emerald }
        : a.regime === 'OVERDAMPED'
        ? { c: COLORS.violetLight, e: COLORS.violet }
        : a.regime === 'UNDAMPED'
        ? { c: COLORS.amberLight, e: COLORS.amber }
        : { c: COLORS.cyanLight, e: COLORS.cyan };

    this._matResponseTube.color.setHex(regimeColor.c);
    this._matResponseTube.emissive.setHex(regimeColor.e);

    const worldSamples = [];
    const tubePts = [];
    for (let i = 0; i < a.samples.length; i++) {
      const s = a.samples[i];
      const wx = this._tToWorldX(s.t);
      const wy = this._yToWorldY(s.y);
      worldSamples.push({ wx, wy, t: s.t, y: s.y });
      tubePts.push(new THREE.Vector3(wx, wy, 0));
    }

    const tubeGeo = createSafeTubeGeometry(tubePts, 240, 0.036, 12);
    this._curveGroup.add(new THREE.Mesh(tubeGeo, this._matResponseTube));

    const curtainGeo = createStepCurtainGeometry(
      worldSamples,
      Y_ZERO_WORLD,
      this._yToWorldY(1.0),
      a.regime
    );
    this._curveGroup.add(new THREE.Mesh(curtainGeo, this._matStepCurtain));

    // Peak Overshoot Beacon (when overshoot > 0.5% and peakTime inside horizon)
    if (a.overshootPct > 0.5 && Number.isFinite(a.peakTime) && a.peakTime <= this.tMax) {
      const px = this._tToWorldX(a.peakTime);
      const py = this._yToWorldY(a.peakY);
      const ySet = this._yToWorldY(1.0);

      const diamond = new THREE.Mesh(this._unitOcta, this._matAmberGlow);
      diamond.scale.set(0.075, 0.11, 0.075);
      diamond.position.set(px, py + 0.14, 0);
      this._curveGroup.add(diamond);

      const stem = new THREE.Mesh(this._unitCylinder, this._matAmberGlow);
      alignCylinderBetween(
        stem,
        new THREE.Vector3(px, ySet, 0),
        new THREE.Vector3(px, py, 0),
        0.011
      );
      this._curveGroup.add(stem);
    }

    // Settling Time Vertical Gate inside _lensGroup (highlighted in Mechatronics Lens)
    // Rebuild only dynamic settling gate marker cleanly
    if (this._settlingGateGroup) {
      disposeGroupChildren(this._settlingGateGroup, this._sharedMaterials, this._sharedGeometries);
    } else {
      this._settlingGateGroup = new THREE.Group();
      this._lensGroup.add(this._settlingGateGroup);
    }
    if (Number.isFinite(a.settlingTime) && a.settlingTime <= this.tMax) {
      const sx = this._tToWorldX(a.settlingTime);
      const gatePole = new THREE.Mesh(this._unitCylinder, this._matEmeraldGlow);
      alignCylinderBetween(
        gatePole,
        new THREE.Vector3(sx, Y_ZERO_WORLD, -0.02),
        new THREE.Vector3(sx, this._yToWorldY(1.22), -0.02),
        0.012
      );
      this._settlingGateGroup.add(gatePole);

      const gateDot = new THREE.Mesh(this._unitSphere, this._matEmeraldGlow);
      gateDot.scale.setScalar(0.052);
      gateDot.position.set(sx, this._yToWorldY(1.0), 0);
      this._settlingGateGroup.add(gateDot);
    }

    // 2. Rebuild Dynamic s-Plane Loci (constant-wn dashed semicircle, damping rays, root locus)
    this._rebuildSPlaneLoci();

    // 3. Switch Active Hardware Domain Rig (Mechanical vs. Electrical RLC)
    const isElectrical = a.domain === 'electrical';
    if (this._mechRigGroup) this._mechRigGroup.visible = !isElectrical;
    if (this._rlcRigGroup) this._rlcRigGroup.visible = isElectrical;
  }

  _rebuildSPlaneLoci() {
    if (!this._sPlaneDynamicGroup) return;
    disposeGroupChildren(this._sPlaneDynamicGroup, this._sharedMaterials, this._sharedGeometries);

    const a = this._analysis;
    const zLoci = SPLANE_THICKNESS * 0.5 + 0.022;
    const innerLeft = -SPLANE_WIDTH * 0.45;
    const halfH = SPLANE_HEIGHT * 0.43;

    // 1. Constant-wn Dashed Semicircle in the LHP centered at (SPLANE_ORIGIN_U, 0)
    const radius = a.wn * SPLANE_SCALE;
    const dashSegments = 26;
    const semiVerts = [];
    for (let i = 0; i < dashSegments; i++) {
      const a0 = Math.PI * 0.5 + (i / dashSegments) * Math.PI;
      const a1 = Math.PI * 0.5 + ((i + 0.55) / dashSegments) * Math.PI;
      const u0 = SPLANE_ORIGIN_U + Math.cos(a0) * radius;
      const v0 = Math.sin(a0) * radius;
      const u1 = SPLANE_ORIGIN_U + Math.cos(a1) * radius;
      const v1 = Math.sin(a1) * radius;
      if (
        u0 >= innerLeft &&
        u1 >= innerLeft &&
        Math.abs(v0) <= halfH &&
        Math.abs(v1) <= halfH
      ) {
        semiVerts.push(u0, v0, zLoci, u1, v1, zLoci);
      }
    }
    if (semiVerts.length >= 6) {
      const semiGeo = new THREE.BufferGeometry();
      semiGeo.setAttribute('position', new THREE.Float32BufferAttribute(semiVerts, 3));
      const semiMat = new THREE.LineBasicMaterial({
        color: a.regime === 'CRITICAL' ? COLORS.emeraldLight : COLORS.cyanLight,
        transparent: true,
        opacity: 0.72,
      });
      this._sPlaneDynamicGroup.add(new THREE.LineSegments(semiGeo, semiMat));
    }

    // 2. Position the Two 3D Pole Spheres & Update Pole Colors by Regime
    const p0 = a.poles[0];
    const p1 = a.poles[1];
    const loc0 = this._sToPanelLocal(p0.re, p0.im);
    const loc1 = this._sToPanelLocal(p1.re, p1.im);
    const zPole = zLoci + 0.036;

    this._poleGroupA.position.set(loc0.u, loc0.v, zPole);
    this._poleGroupB.position.set(loc1.u, loc1.v, zPole);

    if (a.regime === 'CRITICAL') {
      this._matPolePrimary.color.setHex(COLORS.emeraldLight);
      this._matPolePrimary.emissive.setHex(COLORS.emerald);
      this._matPoleSecondary.color.setHex(COLORS.emeraldLight);
      this._matPoleSecondary.emissive.setHex(COLORS.emerald);
      this._sPlaneRimMat.color.setHex(COLORS.emeraldLight);
      this._sPlaneRimMat.emissive.setHex(COLORS.emerald);

      // Show Emerald collision resonance ring right at s = -wn
      this._criticalRingMesh.visible = true;
      this._criticalRingMesh.position.set(loc0.u, 0, zPole + 0.01);
    } else if (a.regime === 'OVERDAMPED') {
      // Dominant slow pole in luminous Amber, fast pole in Violet
      this._matPolePrimary.color.setHex(COLORS.amberLight);
      this._matPolePrimary.emissive.setHex(COLORS.amber);
      this._matPoleSecondary.color.setHex(COLORS.violetLight);
      this._matPoleSecondary.emissive.setHex(COLORS.violet);
      this._sPlaneRimMat.color.setHex(COLORS.violetLight);
      this._sPlaneRimMat.emissive.setHex(COLORS.violet);
      this._criticalRingMesh.visible = false;

      // Glowing real-axis split bridge between slow & fast poles
      const bridge = new THREE.Mesh(this._unitCylinder, this._matAmberGlow);
      alignCylinderBetween(
        bridge,
        new THREE.Vector3(loc0.u, 0, zLoci + 0.008),
        new THREE.Vector3(loc1.u, 0, zLoci + 0.008),
        0.012
      );
      this._sPlaneDynamicGroup.add(bridge);
    } else if (a.regime === 'UNDAMPED') {
      this._matPolePrimary.color.setHex(COLORS.amberLight);
      this._matPolePrimary.emissive.setHex(COLORS.amber);
      this._matPoleSecondary.color.setHex(COLORS.amberLight);
      this._matPoleSecondary.emissive.setHex(COLORS.amber);
      this._sPlaneRimMat.color.setHex(COLORS.amberLight);
      this._sPlaneRimMat.emissive.setHex(COLORS.amber);
      this._criticalRingMesh.visible = false;
    } else {
      // UNDERDAMPED conjugate pair in luminous Cyan
      this._matPolePrimary.color.setHex(COLORS.cyanLight);
      this._matPolePrimary.emissive.setHex(COLORS.cyan);
      this._matPoleSecondary.color.setHex(COLORS.cyanLight);
      this._matPoleSecondary.emissive.setHex(COLORS.cyan);
      this._sPlaneRimMat.color.setHex(COLORS.cyanLight);
      this._sPlaneRimMat.emissive.setHex(COLORS.cyan);
      this._criticalRingMesh.visible = false;
    }

    // 3. Damping-Angle Radial Vectors from origin (0, 0) to each pole
    const originVec = new THREE.Vector3(SPLANE_ORIGIN_U, 0, zLoci + 0.004);
    const rayMat = new THREE.LineBasicMaterial({
      color: a.regime === 'CRITICAL' ? COLORS.emeraldLight : COLORS.cyanLight,
      transparent: true,
      opacity: this.mechatronicsLens ? 0.65 : 0.34,
    });
    const rayGeo = new THREE.BufferGeometry().setFromPoints([
      originVec,
      new THREE.Vector3(loc0.u, loc0.v, zLoci + 0.004),
      originVec,
      new THREE.Vector3(loc1.u, loc1.v, zLoci + 0.004),
    ]);
    this._sPlaneDynamicGroup.add(new THREE.LineSegments(rayGeo, rayMat));

    // 4. Vertical Root-Locus Asymptote Guide (Re(s) = -sigma) when closed-loop kp > 0 or Mechatronics Lens ON
    if (a.closedLoop || this.mechatronicsLens) {
      const sigU = clamp(
        SPLANE_ORIGIN_U - a.sigma * SPLANE_SCALE,
        innerLeft,
        SPLANE_WIDTH * 0.44
      );
      const rlGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(sigU, -halfH * 0.92, zLoci + 0.006),
        new THREE.Vector3(sigU, halfH * 0.92, zLoci + 0.006),
      ]);
      const rlMat = new THREE.LineBasicMaterial({
        color: COLORS.amberLight,
        transparent: true,
        opacity: a.closedLoop ? 0.52 : 0.25,
      });
      this._sPlaneDynamicGroup.add(new THREE.Line(rlGeo, rlMat));
    }
  }

  // --------------------------------------------------------------------------
  // Live Frame Sync: Time Probe, Sync Laser, Mechanical Rig & Electrical RLC Rig
  // --------------------------------------------------------------------------

  _updateLiveVisuals() {
    if (!this._probeCore) return;
    const a = this._analysis;
    const sample = this._evalAtTime(this.t);
    const wx = this._tToWorldX(sample.t);
    const wy = this._yToWorldY(sample.y);

    // 1. Update Time Probe & Drop Laser
    this._probeCore.position.set(wx, wy, 0);
    this._probeHalo.position.set(wx, wy, 0);
    this._probeBaseDot.position.set(wx, Y_ZERO_WORLD, 0);
    alignCylinderBetween(
      this._probeDropLine,
      new THREE.Vector3(wx, Y_ZERO_WORLD, 0),
      new THREE.Vector3(wx, wy, 0),
      0.01
    );

    // 2. Sync Active Hardware Rig & Horizontal Laser Beam
    const isElectrical = a.domain === 'electrical';
    const rigTargetX = isElectrical ? RIG_X - 0.56 : RIG_X - 0.46;

    alignCylinderBetween(
      this._syncLaserBeam,
      new THREE.Vector3(wx + 0.08, wy, 0),
      new THREE.Vector3(rigTargetX, wy, 0),
      0.009
    );

    if (!isElectrical) {
      this._updateMechanicalRig(sample, wy);
    } else {
      this._updateRLCCircuitRig(sample, wy);
    }
  }

  _updateMechanicalRig(sample, wy) {
    const a = this._analysis;

    // Mass block scales subtly with mass m without colliding with gantry
    const massScaleY = clamp(0.76 + Math.sqrt(a.m) * 0.26, 0.8, 1.38);
    const massHalfH = 0.15 * massScaleY;
    const clampedWy = clamp(wy, RIG_BASE_TOP_Y + massHalfH + 0.18, RIG_SPRING_TOP_Y - massHalfH - 0.24);

    this._massAssembly.position.y = clampedWy;
    this._massCoreMesh.scale.y = massScaleY;

    // Update dynamic 3D helical spring geometry if displacement or stiffness changed
    const springBotY = clampedWy + massHalfH;
    const wireR = clamp(0.017 + Math.sqrt(a.kEff) * 0.0022, 0.017, 0.032);
    if (
      Math.abs(springBotY - this._lastSpringBotY) > 0.004 ||
      Math.abs(wireR - this._lastSpringWireR) > 0.0005
    ) {
      const oldGeo = this._springMesh.geometry;
      this._springMesh.geometry = createHelicalSpringGeometry(
        RIG_MASS_LOCAL_X,
        0,
        RIG_SPRING_TOP_Y,
        springBotY,
        0.145,
        7.5,
        wireR
      );
      if (oldGeo) oldGeo.dispose();
      this._lastSpringBotY = springBotY;
      this._lastSpringWireR = wireR;
    }

    // Spring sheen responds to closed-loop feedback kp
    if (a.closedLoop) {
      this._matSpring.color.setHex(COLORS.amberLight);
      this._matSpring.emissive.setHex(COLORS.amber);
      this._matSpring.emissiveIntensity = 0.55 + clamp(a.kp / 20, 0, 0.45);
    } else {
      this._matSpring.color.setHex(0x7dd3fc);
      this._matSpring.emissive.setHex(0x0284c7);
      this._matSpring.emissiveIntensity = 0.42;
    }

    // Hydraulic damper piston & fluid glow intensity
    const pistonY = clamp(clampedWy - 0.52, RIG_BASE_TOP_Y + 0.16, RIG_BASE_TOP_Y + 1.48);
    this._damperPistonHead.position.set(RIG_DAMPER_LOCAL_X, pistonY, 0);
    alignCylinderBetween(
      this._damperPistonRod,
      new THREE.Vector3(RIG_DAMPER_LOCAL_X, pistonY, 0),
      new THREE.Vector3(RIG_DAMPER_LOCAL_X, clampedWy, 0),
      0.022
    );

    const dampForce = Math.abs(a.c * sample.yd);
    this._matDamperFluid.emissiveIntensity = clamp(0.28 + a.c * 0.06 + dampForce * 0.09, 0.2, 1.5);
    this._matDamperFluid.opacity = clamp(0.25 + a.c * 0.045, 0.22, 0.72);

    // Closed-loop feedback servo collar halo
    const showServo = a.closedLoop || a.domain === 'electromechanical';
    this._servoRingMesh.visible = showServo;
    if (showServo) {
      const errForce = Math.abs(a.kp * (a.yInf - sample.y));
      this._servoRingMat.emissiveIntensity = clamp(0.75 + errForce * 0.16, 0.65, 2.2);
    }
  }

  _updateRLCCircuitRig(sample, wy) {
    const a = this._analysis;
    const clampedWy = clamp(wy, Y_ZERO_WORLD - 0.15, 1.88);

    // 1. Live Charging Capacitor Column & Voltage Indicator Bar
    this._capVoltageBar.position.y = clampedWy;
    const colBot = Y_ZERO_WORLD - 0.24;
    const colH = Math.max(clampedWy - colBot, 0.04);
    this._capChargeColumn.scale.y = colH;
    this._capChargeColumn.position.y = colBot + colH * 0.5;

    const voltageRatio = clamp(sample.y, 0, 2);
    this._matCapacitorGlow.emissiveIntensity = 0.55 + voltageRatio * 0.85;
    if (sample.y > 1.04) {
      this._matCapacitorGlow.color.setHex(COLORS.amberLight);
      this._matCapacitorGlow.emissive.setHex(COLORS.amber);
    } else {
      this._matCapacitorGlow.color.setHex(COLORS.cyanLight);
      this._matCapacitorGlow.emissive.setHex(COLORS.cyan);
    }

    // 2. Inductor Magnetic Flux Halo pulses with live current i(t) ~ |yd|
    const currentMag = Math.abs(sample.yd);
    const fluxScale = 1.0 + clamp(currentMag * 0.14, 0, 0.55);
    this._inductorFluxHalo.scale.setScalar(fluxScale);
    this._matInductorFlux.opacity = clamp(0.12 + currentMag * 0.18, 0.1, 0.72);
    this._matCopperCoil.emissiveIntensity = clamp(0.25 + currentMag * 0.22, 0.2, 1.2);

    // 3. Resistor Thermal Glow proportional to R * i(t)^2
    const powerGlow = clamp(0.12 + a.c * currentMag * currentMag * 0.06, 0.12, 1.4);
    this._matResistorGlow.emissiveIntensity = powerGlow;
  }

  // --------------------------------------------------------------------------
  // Camera Presets
  // --------------------------------------------------------------------------

  _getCameraPose(preset) {
    switch (preset) {
      case 'front':
        return {
          pos: new THREE.Vector3(0.2, 0.35, 11.4),
          target: new THREE.Vector3(0.2, 0.22, 0.0),
        };
      case 'iso':
        return {
          pos: new THREE.Vector3(6.2, 4.85, 8.9),
          target: new THREE.Vector3(0.15, 0.12, 0.0),
        };
      case '3d':
      default:
        return {
          pos: new THREE.Vector3(1.85, 2.05, 10.65),
          target: new THREE.Vector3(0.18, 0.24, 0.0),
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
    if (!MODELING_PRESETS[presetId]) return this.getTelemetry();
    this._cancelSweepAnimation();

    this.presetId = presetId;
    const preset = MODELING_PRESETS[presetId];
    this.m = preset.defaults.m;
    this.c = preset.defaults.c;
    this.k = preset.defaults.k;
    this.kp = preset.defaults.kp;

    this._runAnalysis();
    if (this._initialized) {
      this._rebuildDynamicGeometry();
      this._updateLiveVisuals();
    }

    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  setParams({ m, c, k, kp } = {}) {
    let changed = false;
    if (Number.isFinite(m)) {
      this.m = clamp(m, M_MIN, M_MAX);
      changed = true;
    }
    if (Number.isFinite(c)) {
      this.c = clamp(c, C_MIN, C_MAX);
      changed = true;
    }
    if (Number.isFinite(k)) {
      this.k = clamp(k, K_MIN, K_MAX);
      changed = true;
    }
    if (Number.isFinite(kp)) {
      this.kp = clamp(kp, KP_MIN, KP_MAX);
      changed = true;
    }
    if (!changed) return this.getTelemetry();

    this._runAnalysis();
    if (this._initialized) {
      this._rebuildDynamicGeometry();
      this._updateLiveVisuals();
    }

    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  toggleSPlane(bool) {
    this.showSPlane = Boolean(bool);
    if (this._sPlaneGroup) {
      this._sPlaneGroup.visible = this.showSPlane;
    }

    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  toggleMechatronicsLens(bool) {
    this.mechatronicsLens = Boolean(bool);
    if (this._lensGroup) {
      this._lensGroup.visible = this.mechatronicsLens;
    }
    if (this._initialized) {
      this._rebuildSPlaneLoci();
      this._updateLiveVisuals();
    }

    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  setTime(t) {
    const num = Number(t);
    if (!Number.isFinite(num)) return this.getTelemetry();
    this._cancelSweepAnimation();

    this.t = clamp(num, T_MIN, this.tMax);
    if (this._initialized) {
      this._updateLiveVisuals();
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
      duration: 740,
      fromPos: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPos: to.pos,
      toTarget: to.target,
    };
  }

  animateResponse(onDone) {
    this._cancelSweepAnimation();

    this._sweepAnim = {
      startTime: performance.now(),
      duration: 2400, // ~2.4s smooth probe & hardware rig animation
      onDone: typeof onDone === 'function' ? onDone : null,
    };

    this.t = T_MIN;
    if (this._initialized) {
      this._updateLiveVisuals();
    }
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
      analyzePhysicalSystem({
        presetId: this.presetId,
        m: this.m,
        c: this.c,
        k: this.k,
        kp: this.kp,
        tMax: this.tMax,
      });
    const sample = this._evalAtTime(this.t);

    return {
      presetId: a.presetId,
      label: a.label,
      domain: a.domain,
      paramLabels: { ...a.paramLabels },
      m: a.m,
      c: a.c,
      k: a.k,
      kp: a.kp,
      wn: a.wn,
      zeta: a.zeta,
      sigma: a.sigma,
      wd: a.wd,
      regime: a.regime,
      poles: a.poles.map((p) => ({ re: p.re, im: p.im })),
      overshootPct: a.overshootPct,
      settlingTime: a.settlingTime,
      peakTime: a.peakTime,
      odeLatex: a.odeLatex,
      tfLatex: a.tfLatex,
      polesLatex: a.polesLatex,
      showSPlane: this.showSPlane,
      mechatronicsLens: this.mechatronicsLens,
      t: this.t,
      yt: sample.y,
      yd: sample.yd,
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
    const dt = this._clock ? Math.min(this._clock.getDelta(), 0.05) : 0.016;
    const elapsed = this._clock ? this._clock.elapsedTime : 0;

    // 1. Live step-response probe & physical rig sweep (~2.4s)
    if (this._sweepAnim) {
      const { startTime, duration, onDone } = this._sweepAnim;
      const rawU = clamp((now - startTime) / duration, 0, 1);
      this.t = rawU >= 1 ? this.tMax : T_MIN + rawU * (this.tMax - T_MIN);

      this._updateLiveVisuals();
      const telemetry = this.getTelemetry();
      this._emitTelemetry(telemetry);

      if (rawU >= 1) {
        this._sweepAnim = null;
        if (onDone) onDone(telemetry);
      }
    }

    // 2. Smooth cubic ease-out camera transition
    if (this._camTransition && this.camera && this.controls) {
      const { startTime, duration, fromPos, fromTarget, toPos, toTarget } = this._camTransition;
      const rawT = clamp((now - startTime) / duration, 0, 1);
      const ease = easeOutCubic(rawT);
      this.camera.position.lerpVectors(fromPos, toPos, ease);
      this.controls.target.lerpVectors(fromTarget, toTarget, ease);
      if (rawT >= 1) {
        this._camTransition = null;
      }
    }

    // 3. Living Spline micro-animations (pulsing 3D pole spheres, critical emerald flash, probe halo)
    if (this._probeHalo) {
      this._probeHalo.rotation.z = -elapsed * 1.15;
      this._probeHalo.rotation.x = Math.cos(elapsed * 1.6) * 0.45;
      this._probeHalo.scale.setScalar(0.165 * (1 + Math.sin(elapsed * 3.1) * 0.08));
    }

    for (const [idx, pg] of [
      [0, this._poleGroupA],
      [1, this._poleGroupB],
    ]) {
      if (pg && pg.userData.halo) {
        const phase = idx * 1.4;
        pg.userData.halo.rotation.z = elapsed * (idx === 0 ? 1.35 : -1.35);
        pg.userData.halo.scale.setScalar(0.13 * (1 + Math.sin(elapsed * 3.4 + phase) * 0.1));
      }
    }

    // Critical damping Emerald collision pulse
    if (this._criticalRingMesh && this._criticalRingMesh.visible) {
      if (this._criticalFlashTimer > 0) {
        this._criticalFlashTimer = Math.max(0, this._criticalFlashTimer - dt * 1.2);
      }
      const pulsePhase = (elapsed * 1.1) % 1;
      const ringScale = 0.14 + pulsePhase * 0.34 + this._criticalFlashTimer * 0.18;
      this._criticalRingMesh.scale.setScalar(ringScale);
      this._criticalRingMat.opacity = clamp((1 - pulsePhase) * 0.78 + this._criticalFlashTimer * 0.35, 0, 1);
    }

    if (this._plinthRimMat) {
      this._plinthRimMat.emissiveIntensity = 1.14 + Math.sin(elapsed * 1.75) * 0.12;
    }

    if (this._sPlaneRimMat) {
      this._sPlaneRimMat.emissiveIntensity = 1.18 + Math.cos(elapsed * 1.9) * 0.14;
    }

    if (this._servoRingMesh && this._servoRingMesh.visible) {
      this._servoRingMesh.rotation.z = elapsed * 1.8;
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
  // Complete GPU & DOM Resource Cleanup (Zero WebGL Leaks)
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

    this.scene = null;
    this.camera = null;
    this.container = null;
  }
}
