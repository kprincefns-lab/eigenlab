/**
 * EIGENLAB — Interactive 3D Differential Equations & Dynamical Systems Studio
 * Spline-quality Three.js WebGL visualization module (ES Modules).
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ============================================================================
// 1. ANALYTICAL ODE PRESETS & EXACT STEP-RESPONSE SOLVER
// ============================================================================

export const DIFFEQ_PRESETS = {
  underdamped: {
    key: 'underdamped',
    label: 'Underdamped Servo',
    mechatronicsLabel: 'Underdamped Servo Step Ringing',
    order: 2,
    defaultZeta: 0.25,
    defaultOmega: 2.6,
    odeLatex: '\\ddot{y} + 2\\zeta\\omega_n\\dot{y} + \\omega_n^2 y = \\omega_n^2 u(t)',
    transferLatex: 'G(s) = \\frac{\\omega_n^2}{s^2 + 2\\zeta\\omega_n s + \\omega_n^2}',
  },
  critical: {
    key: 'critical',
    label: 'Critically Damped',
    mechatronicsLabel: 'Fastest Zero-Overshoot Servo',
    order: 2,
    defaultZeta: 1.0,
    defaultOmega: 2.2,
    odeLatex: '\\ddot{y} + 2\\omega_n\\dot{y} + \\omega_n^2 y = \\omega_n^2 u(t)',
    transferLatex: 'G(s) = \\frac{\\omega_n^2}{(s + \\omega_n)^2}',
  },
  overdamped: {
    key: 'overdamped',
    label: 'Overdamped Actuator',
    mechatronicsLabel: 'Heavy Hydraulic Actuator',
    order: 2,
    defaultZeta: 1.65,
    defaultOmega: 2.2,
    odeLatex: '\\ddot{y} + 2\\zeta\\omega_n\\dot{y} + \\omega_n^2 y = \\omega_n^2 u(t)',
    transferLatex: 'G(s) = \\frac{\\omega_n^2}{(s - r_1)(s - r_2)}',
  },
  harmonic: {
    key: 'harmonic',
    label: 'Harmonic Oscillator',
    mechatronicsLabel: 'Undamped Spring-Mass Resonance',
    order: 2,
    defaultZeta: 0.0,
    defaultOmega: 2.4,
    odeLatex: '\\ddot{y} + \\omega_n^2 y = \\omega_n^2 u(t)',
    transferLatex: 'G(s) = \\frac{\\omega_n^2}{s^2 + \\omega_n^2}',
  },
  'rc-decay': {
    key: 'rc-decay',
    label: '1st-Order RC / Thermal',
    mechatronicsLabel: '1st-Order RC / Thermal Step',
    order: 1,
    defaultZeta: 1.0,
    defaultOmega: 1.4,
    odeLatex: '\\tau\\dot{y} + y = u(t),\\quad \\tau = \\frac{1}{\\omega_n}',
    transferLatex: 'G(s) = \\frac{\\omega_n}{s + \\omega_n}',
  },
};

const T_MIN = 0;
const T_MAX = 8;
const ZETA_MIN = 0.0;
const ZETA_MAX = 2.0;
const OMEGA_MIN = 0.8;
const OMEGA_MAX = 4.0;
const LN_50 = Math.log(50); // -ln(0.02) = 3.912023005428146 (2% settling threshold)
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

/**
 * Exact analytical unit-step response y(t) and velocity y'(t) from rest (y(0) = 0, y'(0) = 0).
 * Supports 1st-order exponential systems and all four 2nd-order damping regimes.
 */
export function evaluateStepResponse(order, zeta, omega, t) {
  const time = Math.max(0, t);
  const wn = clamp(omega, OMEGA_MIN, OMEGA_MAX);
  const z = clamp(zeta, ZETA_MIN, ZETA_MAX);

  if (order === 1) {
    const e = Math.exp(-wn * time);
    return {
      y: normalizeZero(1 - e),
      dydt: normalizeZero(wn * e),
    };
  }

  // 2nd-order: y'' + 2*z*wn*y' + wn^2*y = wn^2, y(0) = 0, y'(0) = 0
  if (z < 1e-4) {
    // Undamped harmonic oscillator
    const wt = wn * time;
    return {
      y: normalizeZero(1 - Math.cos(wt)),
      dydt: normalizeZero(wn * Math.sin(wt)),
    };
  }

  if (z < 0.995) {
    // Underdamped oscillatory decay
    const sqrtTerm = Math.sqrt(1 - z * z);
    const omegaD = wn * sqrtTerm;
    const decay = Math.exp(-z * wn * time);
    const cosD = Math.cos(omegaD * time);
    const sinD = Math.sin(omegaD * time);
    const y = 1 - decay * (cosD + (z / sqrtTerm) * sinD);
    const dydt = (wn / sqrtTerm) * decay * sinD;
    return {
      y: normalizeZero(y),
      dydt: normalizeZero(dydt),
    };
  }

  if (z <= 1.005) {
    // Critically damped (repeated real pole s = -wn)
    const decay = Math.exp(-wn * time);
    const y = 1 - (1 + wn * time) * decay;
    const dydt = wn * wn * time * decay;
    return {
      y: normalizeZero(y),
      dydt: normalizeZero(dydt),
    };
  }

  // Overdamped (distinct real negative poles r1, r2)
  const alpha = wn * Math.sqrt(z * z - 1);
  const r1 = -z * wn + alpha;
  const r2 = -z * wn - alpha;
  const denom = r1 - r2; // 2 * alpha > 0
  const e1 = Math.exp(r1 * time);
  const e2 = Math.exp(r2 * time);
  const y = 1 + (r2 * e1 - r1 * e2) / denom;
  const dydt = (r1 * r2 * (e1 - e2)) / denom;
  return {
    y: normalizeZero(y),
    dydt: normalizeZero(dydt),
  };
}

/**
 * Compute exact 2% settling time for overdamped 2nd-order step response via monotonic bisection.
 */
function computeOverdampedSettlingTime(zeta, omega) {
  const alpha = omega * Math.sqrt(zeta * zeta - 1);
  const r1 = -zeta * omega + alpha; // slower pole (< 0)
  const r2 = -zeta * omega - alpha; // faster pole (< r1)
  const denom = r1 - r2;

  const evalErr = (t) => -(r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / denom;

  let lo = 0;
  let hi = Math.max(8, (LN_50 + 2.5) / Math.max(Math.abs(r1), 1e-4));
  while (evalErr(hi) > 0.02 && hi < 500) {
    hi *= 1.6;
  }
  for (let i = 0; i < 28; i++) {
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
 * Compute poles, regime classification, overshoot %, settling time, and dynamic KaTeX strings.
 */
function analyzeSystem(order, zeta, omega) {
  const wn = clamp(omega, OMEGA_MIN, OMEGA_MAX);
  const z = clamp(zeta, ZETA_MIN, ZETA_MAX);

  if (order === 1) {
    const tau = 1 / wn;
    const poles = [{ re: normalizeZero(-wn), im: 0 }];
    return {
      regime: '1st-Order Decay',
      overshootPct: 0,
      settlingTime: LN_50 / wn,
      poles,
      polesLatex: `s_1 = ${(-wn).toFixed(2)}`,
      odeLatex: `${tau.toFixed(2)}\\dot{y} + y = u(t)`,
      transferLatex: `G(s) = \\frac{${wn.toFixed(2)}}{s + ${wn.toFixed(2)}}`,
    };
  }

  const w2 = wn * wn;
  const c1 = 2 * z * wn;

  if (z < 1e-4) {
    const poles = [
      { re: 0, im: wn },
      { re: 0, im: -wn },
    ];
    return {
      regime: 'Undamped Harmonic',
      overshootPct: 100,
      settlingTime: Infinity,
      poles,
      polesLatex: `s_{1,2} = \\pm ${wn.toFixed(2)}j`,
      odeLatex: `\\ddot{y} + ${w2.toFixed(2)}y = ${w2.toFixed(2)}u(t)`,
      transferLatex: `G(s) = \\frac{${w2.toFixed(2)}}{s^2 + ${w2.toFixed(2)}}`,
    };
  }

  if (z < 0.995) {
    const sigma = -z * wn;
    const omegaD = wn * Math.sqrt(1 - z * z);
    const overshootPct = 100 * Math.exp((-Math.PI * z) / Math.sqrt(1 - z * z));
    const settlingTime = 4 / (z * wn);
    const poles = [
      { re: normalizeZero(sigma), im: omegaD },
      { re: normalizeZero(sigma), im: -omegaD },
    ];
    return {
      regime: 'Underdamped',
      overshootPct,
      settlingTime,
      poles,
      polesLatex: `s_{1,2} = ${sigma.toFixed(2)} \\pm ${omegaD.toFixed(2)}j`,
      odeLatex: `\\ddot{y} + ${c1.toFixed(2)}\\dot{y} + ${w2.toFixed(2)}y = ${w2.toFixed(2)}u(t)`,
      transferLatex: `G(s) = \\frac{${w2.toFixed(2)}}{s^2 + ${c1.toFixed(2)}s + ${w2.toFixed(2)}}`,
    };
  }

  if (z <= 1.005) {
    const poles = [
      { re: normalizeZero(-wn), im: 0 },
      { re: normalizeZero(-wn), im: 0 },
    ];
    return {
      regime: 'Critically Damped',
      overshootPct: 0,
      settlingTime: CRIT_SETTLE_CONST / wn,
      poles,
      polesLatex: `s_{1,2} = ${(-wn).toFixed(2)}`,
      odeLatex: `\\ddot{y} + ${(2 * wn).toFixed(2)}\\dot{y} + ${w2.toFixed(2)}y = ${w2.toFixed(2)}u(t)`,
      transferLatex: `G(s) = \\frac{${w2.toFixed(2)}}{(s + ${wn.toFixed(2)})^2}`,
    };
  }

  const alpha = wn * Math.sqrt(z * z - 1);
  const r1 = -z * wn + alpha;
  const r2 = -z * wn - alpha;
  const poles = [
    { re: normalizeZero(r1), im: 0 },
    { re: normalizeZero(r2), im: 0 },
  ];
  return {
    regime: 'Overdamped',
    overshootPct: 0,
    settlingTime: computeOverdampedSettlingTime(z, wn),
    poles,
    polesLatex: `s_1 = ${r1.toFixed(2)},\\; s_2 = ${r2.toFixed(2)}`,
    odeLatex: `\\ddot{y} + ${c1.toFixed(2)}\\dot{y} + ${w2.toFixed(2)}y = ${w2.toFixed(2)}u(t)`,
    transferLatex: `G(s) = \\frac{${w2.toFixed(2)}}{s^2 + ${c1.toFixed(2)}s + ${w2.toFixed(2)}}`,
  };
}

// ============================================================================
// 2. SPATIAL CONSTANTS, PALETTE & GEOMETRY UTILITIES
// ============================================================================

const T_ORIGIN_X = -2.85;
const T_SPAN_X = 5.5; // t in [0, 8] maps cleanly to x in [-2.85, +2.65]
const Y_ZERO_WORLD = -1.02;
const SCALE_Y = 1.32; // y = 0 -> -1.02, y = 1 (setpoint) -> +0.30, y = 2 -> +1.62
const SCALE_V = 0.92; // normalized velocity (dy/dt)/wn in [-1, 1] maps cleanly to z in [-0.92, +0.92]

const PHASE_WALL_X = -3.15;
const RIG_X = 3.45;
const PLINTH_Y = -1.66;
const PLINTH_WIDTH = 9.0;
const PLINTH_DEPTH = 3.55;
const PLINTH_HEIGHT = 0.26;
const PLINTH_OFFSET_X = 0.25;

// Spring-mass-damper rig vertical architecture (collision-free across y in [0, 2])
const RIG_TOP_PLATE_Y = 2.48;
const RIG_SPRING_TOP_Y = 2.38;
const RIG_BASE_TOP_Y = -1.56;
const RIG_MASS_HALF_H = 0.15;
const RIG_MASS_LOCAL_X = -0.05;
const RIG_DAMPER_LOCAL_X = 0.45;

const CURVE_SAMPLES = 280;

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
  slateGlass: 0x0d1526,
  aluminum: 0x94a3b8,
  anodized: 0x1e293b,
};

const UP_VEC = new THREE.Vector3(0, 1, 0);
const _tmpDelta = new THREE.Vector3();
const _tmpMid = new THREE.Vector3();
const _tmpDir = new THREE.Vector3();
const _tmpQuat = new THREE.Quaternion();

/**
 * Safely align a unit-height (1.0), unit-radius (1.0) cylinder mesh between pA and pB.
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
 * Filter near-duplicate consecutive vertices and construct a smooth TubeGeometry.
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
 * Build a translucent vertical time-response curtain on z = 0 dropping from y(t) down to y = 0.
 * Highlights overshoot above y = 1.0 with subtle luminous emerald/amber accents.
 */
function createStepCurtainGeometry(samples, baseWorldY, setpointWorldY) {
  const n = samples.length;
  if (n < 2) return new THREE.BufferGeometry();

  const positions = new Float32Array(n * 2 * 3);
  const colors = new Float32Array(n * 2 * 3);
  const indices = new Uint32Array((n - 1) * 6);

  const cBase = new THREE.Color(0x064e63);
  const cTop = new THREE.Color(COLORS.cyan);
  const cOvershoot = new THREE.Color(COLORS.amberLight);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < n; i++) {
    const s = samples[i];
    const baseIdx = i * 6;

    // Bottom vertex at y = 0 (z = 0)
    positions[baseIdx] = s.wx;
    positions[baseIdx + 1] = baseWorldY;
    positions[baseIdx + 2] = 0;
    colors[baseIdx] = cBase.r;
    colors[baseIdx + 1] = cBase.g;
    colors[baseIdx + 2] = cBase.b;

    // Top vertex at y = y(t) (z = 0)
    positions[baseIdx + 3] = s.wx;
    positions[baseIdx + 4] = s.wy;
    positions[baseIdx + 5] = 0;

    const overAmount = clamp((s.wy - setpointWorldY) / (SCALE_Y * 0.65), 0, 1);
    tmpColor.copy(cTop).lerp(cOvershoot, overAmount * 0.72);
    const heightGlow = clamp(Math.abs(s.wy - baseWorldY) / (SCALE_Y * 1.1), 0.35, 1.0);

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
 * Create a rounded-rectangle 2D THREE.Shape centered at (0, 0).
 */
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

/**
 * Create a bevelled frosted-glass plinth geometry whose top surface sits at y = 0.
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
  const pts2D = shape.getSpacedPoints(120);
  const pts3D = [];
  for (let i = 0; i < pts2D.length - 1; i++) {
    pts3D.push(new THREE.Vector3(pts2D[i].x, 0.008, pts2D[i].y));
  }
  const curve = new THREE.CatmullRomCurve3(pts3D, true, 'centripetal', 0.5);
  return new THREE.TubeGeometry(curve, 140, tubeRadius, 8, true);
}

/**
 * Create a vertical bevelled glass plate centered at origin, lying in the YZ plane (normal along +X).
 */
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

/**
 * Create a closed glowing perimeter tube lying in the YZ plane around the Phase-Portrait glass wall.
 */
function createVerticalRimGeometry(widthZ, heightY, cornerRadius, tubeRadius = 0.015) {
  const shape = createRoundedRectShape(widthZ, heightY, cornerRadius);
  const pts2D = shape.getSpacedPoints(110);
  const pts3D = [];
  for (let i = 0; i < pts2D.length - 1; i++) {
    pts3D.push(new THREE.Vector3(0.025, pts2D[i].y, pts2D[i].x));
  }
  const curve = new THREE.CatmullRomCurve3(pts3D, true, 'centripetal', 0.5);
  return new THREE.TubeGeometry(curve, 128, tubeRadius, 8, true);
}

/**
 * Create a dynamic 3D helical coil spring TubeGeometry stretching vertically from topY down to botY.
 */
function createHelicalSpringGeometry(centerX, centerZ, topY, botY, coilRadius = 0.148, turns = 7.5) {
  const span = Math.max(topY - botY, 0.22);
  const lead = Math.min(0.06, span * 0.12);
  const helixTop = topY - lead;
  const helixBot = botY + lead;
  const helixSpan = Math.max(helixTop - helixBot, 0.1);

  const pts = [];
  // Top mounting stem
  pts.push(new THREE.Vector3(centerX, topY, centerZ));
  pts.push(new THREE.Vector3(centerX, topY - lead * 0.65, centerZ));

  // Smooth lead-in to coil radius, helical coils, smooth lead-out to bottom stem
  const totalSteps = 120;
  for (let i = 0; i <= totalSteps; i++) {
    const u = i / totalSteps;
    const angle = u * turns * Math.PI * 2;
    // Ease radial envelope smoothly at both ends so the wire meets the central seats cleanly
    const endFade = Math.min(u / 0.06, (1 - u) / 0.06, 1);
    const r = coilRadius * (endFade * endFade * (3 - 2 * endFade));
    const y = helixTop - u * helixSpan;
    pts.push(new THREE.Vector3(centerX + Math.cos(angle) * r, y, centerZ + Math.sin(angle) * r));
  }

  // Bottom mounting stem
  pts.push(new THREE.Vector3(centerX, botY + lead * 0.65, centerZ));
  pts.push(new THREE.Vector3(centerX, botY, centerZ));

  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  return new THREE.TubeGeometry(curve, 112, 0.021, 8, false);
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
    grad.addColorStop(0.42, midRgba);
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
 * Dispose all geometries and materials inside a temporary group without touching shared assets.
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
// 3. DIFFEQ 3D STUDIO CLASS
// ============================================================================

export class DiffEq3DStudio {
  constructor(options = {}) {
    this.onChange = typeof options.onChange === 'function' ? options.onChange : null;

    this.presetKey = DIFFEQ_PRESETS[options.presetKey] ? options.presetKey : 'underdamped';
    const initPreset = DIFFEQ_PRESETS[this.presetKey];

    this.zeta = Number.isFinite(options.zeta)
      ? clamp(options.zeta, ZETA_MIN, ZETA_MAX)
      : initPreset.defaultZeta;
    this.omega = Number.isFinite(options.omega)
      ? clamp(options.omega, OMEGA_MIN, OMEGA_MAX)
      : initPreset.defaultOmega;
    this.t = Number.isFinite(options.t) ? clamp(options.t, T_MIN, T_MAX) : 1.35;

    this.showPhaseWall = options.showPhaseWall ?? true;
    this.showMechatronics = options.showMechatronics ?? true;
    this.cameraPreset = '3d';

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
    this._axesGroup = null;
    this._curveGroup = null;
    this._phaseWallGroup = null;
    this._phaseCurveGroup = null;
    this._probeGroup = null;
    this._rigGroup = null;

    // Shared resource registries for leak-free cleanup
    this._sharedGeometries = new Set();
    this._sharedMaterials = new Set();
    this._ownedTextures = [];

    // Cached spring height to avoid redundant TubeGeometry rebuilds
    this._lastSpringBotY = NaN;

    // Animation & lifecycle handles
    this._rafId = null;
    this._resizeObserver = null;
    this._clock = new THREE.Clock();
    this._initialized = false;
    this._disposed = false;

    // Smooth transitions & live response sweep
    this._camTransition = null;
    this._sweepAnim = null;

    // Bound handlers
    this._onAnimate = this._animate.bind(this);
    this._onControlsStart = () => {
      this._camTransition = null;
    };
  }

  // --------------------------------------------------------------------------
  // Coordinate Mapping: (t, y(t), y'(t)) -> 3D Studio Space
  // --------------------------------------------------------------------------

  _getPreset() {
    return DIFFEQ_PRESETS[this.presetKey] || DIFFEQ_PRESETS.underdamped;
  }

  _tToWorldX(t) {
    return T_ORIGIN_X + ((t - T_MIN) / (T_MAX - T_MIN)) * T_SPAN_X;
  }

  _yToWorldY(y) {
    return Y_ZERO_WORLD + y * SCALE_Y;
  }

  _vToWorldZ(dydt) {
    // Normalize by omega_n so |(dy/dt)/omega_n| <= 1 across all omega_n & regimes,
    // turning harmonic motion into a pure circular helix with crisp phase-wall framing.
    const normV = dydt / Math.max(this.omega, OMEGA_MIN);
    return clamp(normV, -1.2, 1.2) * SCALE_V;
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  init(container) {
    if (!container) return this;
    if (this._initialized) {
      this.dispose();
    }
    this._disposed = false;
    this.container = container;

    const width = Math.max(container.clientWidth || 800, 1);
    const height = Math.max(container.clientHeight || 520, 1);

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(COLORS.studioBg, 0.019);

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

    // 3. Studio Reflections via PMREMGenerator + RoomEnvironment (disposed immediately after RT)
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

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.44, 0.55, 0.72);
    this.composer.addPass(this.bloomPass);

    // 5. Smoothly Damped OrbitControls
    this.controls = new OrbitControls(this.camera, dom);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI * 0.65;
    this.controls.minPolarAngle = 0.1;
    this.controls.minDistance = 4.4;
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
    this._axesGroup = new THREE.Group();
    this._curveGroup = new THREE.Group();
    this._phaseWallGroup = new THREE.Group();
    this._phaseCurveGroup = new THREE.Group();
    this._probeGroup = new THREE.Group();
    this._rigGroup = new THREE.Group();

    this._phaseWallGroup.add(this._phaseCurveGroup);
    this._stageGroup.add(
      this._plinthGroup,
      this._axesGroup,
      this._curveGroup,
      this._phaseWallGroup,
      this._probeGroup,
      this._rigGroup
    );

    this._buildPlinth();
    this._buildAxesGridAndSetpoint();
    this._buildPhasePortraitWall();
    this._buildTimeProbe();
    this._buildMechatronicsRig();

    // Build dynamic curves & sync live probes + spring-mass-damper state
    this._rebuildTrajectoryCurves();
    this._updateInteractiveElements();

    // Snap initial camera preset
    this._applyCameraPresetImmediate(this.cameraPreset);

    // Observe container resize
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => this.resize());
      this._resizeObserver.observe(container);
    }

    this._initialized = true;
    this._clock.start();
    this._rafId = requestAnimationFrame(this._onAnimate);
    this._emitChange();

    return this;
  }

  _setupLighting() {
    const hemi = new THREE.HemisphereLight(0xcbd5e1, 0x0b1120, 0.56);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.35);
    keyLight.position.set(5.4, 9.6, 8.0);
    this.scene.add(keyLight);

    const cyanRim = new THREE.PointLight(COLORS.cyan, 2.0, 24, 1.5);
    cyanRim.position.set(5.8, 3.0, 3.4);
    this.scene.add(cyanRim);

    const violetFill = new THREE.PointLight(COLORS.violet, 2.1, 22, 1.5);
    violetFill.position.set(-5.8, 2.4, 3.6);
    this.scene.add(violetFill);

    const emeraldBack = new THREE.PointLight(COLORS.emerald, 1.35, 22, 1.6);
    emeraldBack.position.set(0.2, 3.8, -5.8);
    this.scene.add(emeraldBack);
  }

  _createSharedResources() {
    this._unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 18, 1, false);
    this._unitCone = new THREE.ConeGeometry(1, 1, 20);
    this._unitBox = new THREE.BoxGeometry(1, 1, 1);
    this._unitSphere = new THREE.SphereGeometry(1, 18, 18);
    this._sharedGeometries.add(
      this._unitCylinder,
      this._unitCone,
      this._unitBox,
      this._unitSphere
    );

    // Sculpted Cyan 3D Time-Position-Velocity Helix material
    this._matHelixTube = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.02,
      roughness: 0.13,
      metalness: 0.24,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.48,
    });

    // Crisp 2D Time-Response projection trace on z = 0 plane
    this._matTimeTraceTube = new THREE.MeshPhysicalMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 0.85,
      roughness: 0.16,
      metalness: 0.2,
      clearcoat: 0.9,
      transparent: true,
      opacity: 0.78,
    });

    // Translucent Time-Response Curtain on z = 0
    this._matStepCurtain = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Glowing Violet Phase-Portrait Loop material
    this._matPhaseLoop = new THREE.MeshPhysicalMaterial({
      color: COLORS.violetLight,
      emissive: 0x8b5cf6,
      emissiveIntensity: 1.18,
      roughness: 0.14,
      metalness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.4,
    });

    // Specular metallic Cartesian axes
    this._matSpecularAxis = new THREE.MeshPhysicalMaterial({
      color: 0xcbd5e1,
      emissive: 0x1e3a5f,
      emissiveIntensity: 0.35,
      roughness: 0.18,
      metalness: 0.85,
      clearcoat: 0.9,
      envMapIntensity: 1.4,
    });

    this._matAxisTick = new THREE.MeshPhysicalMaterial({
      color: 0x64748b,
      roughness: 0.25,
      metalness: 0.75,
    });

    // Glowing Emerald Setpoint Reference material (y = 1.0)
    this._matSetpointDash = new THREE.MeshStandardMaterial({
      color: COLORS.emeraldLight,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.38,
      roughness: 0.16,
      metalness: 0.2,
    });

    this._sharedMaterials.add(
      this._matHelixTube,
      this._matTimeTraceTube,
      this._matStepCurtain,
      this._matPhaseLoop,
      this._matSpecularAxis,
      this._matAxisTick,
      this._matSetpointDash
    );
  }

  // --------------------------------------------------------------------------
  // Floating Bevelled Frosted-Glass Studio Plinth
  // --------------------------------------------------------------------------

  _buildPlinth() {
    this._plinthGroup.position.set(PLINTH_OFFSET_X, PLINTH_Y, 0);

    // 1. Bevelled dark frosted-glass slab (top sits at local y = 0)
    const slabGeom = createPlinthSlabGeometry(
      PLINTH_WIDTH,
      PLINTH_DEPTH,
      PLINTH_HEIGHT,
      0.34,
      0.05
    );
    const slabMat = new THREE.MeshPhysicalMaterial({
      color: COLORS.slateGlass,
      roughness: 0.16,
      metalness: 0.18,
      transmission: 0.32,
      thickness: 0.55,
      ior: 1.46,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
      envMapIntensity: 1.35,
      transparent: true,
      opacity: 0.9,
    });
    this._plinthGroup.add(new THREE.Mesh(slabGeom, slabMat));

    // 2. Inset anodized dark metallic sub-chassis
    const chassisGeom = createPlinthSlabGeometry(
      PLINTH_WIDTH - 0.36,
      PLINTH_DEPTH - 0.36,
      0.09,
      0.24,
      0.02
    );
    const chassisMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.32,
      metalness: 0.85,
      clearcoat: 0.4,
      envMapIntensity: 1.1,
    });
    const chassisMesh = new THREE.Mesh(chassisGeom, chassisMat);
    chassisMesh.position.y = -PLINTH_HEIGHT + 0.01;
    this._plinthGroup.add(chassisMesh);

    // 3. Crisp glowing perimeter rim tube
    const rimGeom = createPlinthRimGeometry(PLINTH_WIDTH - 0.08, PLINTH_DEPTH - 0.08, 0.32, 0.014);
    this._plinthRimMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.22,
      roughness: 0.2,
      metalness: 0.3,
    });
    this._plinthGroup.add(new THREE.Mesh(rimGeom, this._plinthRimMat));

    // 4. Subtle etched surface grid & center lane guide on plinth deck
    const floorPts = [];
    const halfW = PLINTH_WIDTH * 0.5 - 0.42;
    const halfD = PLINTH_DEPTH * 0.5 - 0.34;
    const ySurf = 0.005;

    for (let gx = -Math.floor(halfW); gx <= Math.floor(halfW); gx += 0.6875) {
      floorPts.push(gx, ySurf, -halfD, gx, ySurf, halfD);
    }
    for (let gz = -1.2; gz <= 1.21; gz += 0.6) {
      floorPts.push(-halfW, ySurf, gz, halfW, ySurf, gz);
    }
    const floorGridGeom = new THREE.BufferGeometry();
    floorGridGeom.setAttribute('position', new THREE.Float32BufferAttribute(floorPts, 3));
    const floorGridMat = new THREE.LineBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    this._plinthGroup.add(new THREE.LineSegments(floorGridGeom, floorGridMat));

    // Luminous center time-axis track strip on deck
    const laneCyan = new THREE.Mesh(
      new THREE.BoxGeometry(T_SPAN_X + 0.4, 0.006, 0.018),
      new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        transparent: true,
        opacity: 0.42,
      })
    );
    laneCyan.position.set(-0.35, 0.008, 0);
    this._plinthGroup.add(laneCyan);

    // 5. Soft studio under-glow pool beneath floating plinth
    const glowTex = createRadialGlowTexture(
      'rgba(34, 211, 238, 0.22)',
      'rgba(167, 139, 250, 0.11)',
      'rgba(11, 13, 18, 0.0)'
    );
    this._ownedTextures.push(glowTex);
    const glowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(PLINTH_WIDTH * 1.25, PLINTH_DEPTH * 1.45),
      new THREE.MeshBasicMaterial({
        map: glowTex,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    glowPlane.rotation.x = -Math.PI / 2;
    glowPlane.position.y = -PLINTH_HEIGHT - 0.14;
    this._plinthGroup.add(glowPlane);
  }

  // --------------------------------------------------------------------------
  // Glowing Cartesian Grid, Specular 3D Axes & Emerald y = 1.0 Setpoint Plane
  // --------------------------------------------------------------------------

  _buildAxesGridAndSetpoint() {
    const xStart = this._tToWorldX(T_MIN);
    const xEnd = this._tToWorldX(T_MAX);
    const y0 = this._yToWorldY(0);
    const y1 = this._yToWorldY(1);
    const yMax = this._yToWorldY(2.2);
    const yMinGrid = this._yToWorldY(-0.2);
    const zBack = -1.08;

    // 1. Back-plane Cartesian grid (behind the 3D helix so curves stay crisp)
    const majorPts = [];
    const minorPts = [];

    for (let t = 0; t <= T_MAX + 1e-6; t += 0.5) {
      const wx = this._tToWorldX(t);
      const isMajor = Math.abs(t - Math.round(t)) < 1e-3;
      (isMajor ? majorPts : minorPts).push(wx, yMinGrid, zBack, wx, yMax, zBack);
    }

    for (let y = 0; y <= 2.25; y += 0.25) {
      const wy = this._yToWorldY(y);
      const isMajor = Math.abs(y * 2 - Math.round(y * 2)) < 1e-3;
      (isMajor ? majorPts : minorPts).push(xStart, wy, zBack, xEnd + 0.15, wy, zBack);
    }

    const majorGeom = new THREE.BufferGeometry();
    majorGeom.setAttribute('position', new THREE.Float32BufferAttribute(majorPts, 3));
    this._axesGroup.add(
      new THREE.LineSegments(
        majorGeom,
        new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
        })
      )
    );

    const minorGeom = new THREE.BufferGeometry();
    minorGeom.setAttribute('position', new THREE.Float32BufferAttribute(minorPts, 3));
    this._axesGroup.add(
      new THREE.LineSegments(
        minorGeom,
        new THREE.LineBasicMaterial({
          color: 0x475569,
          transparent: true,
          opacity: 0.09,
          depthWrite: false,
        })
      )
    );

    // 2. Specular Metallic Time Axis (t: 0..8 at y = 0, z = 0)
    const tAxis = new THREE.Mesh(this._unitCylinder, this._matSpecularAxis);
    alignCylinderBetween(
      tAxis,
      new THREE.Vector3(xStart, y0, 0),
      new THREE.Vector3(xEnd + 0.26, y0, 0),
      0.015
    );
    this._axesGroup.add(tAxis);

    const tTip = new THREE.Mesh(this._unitCone, this._matSpecularAxis);
    tTip.position.set(xEnd + 0.32, y0, 0);
    tTip.rotation.z = -Math.PI / 2;
    tTip.scale.set(0.044, 0.135, 0.044);
    this._axesGroup.add(tTip);

    // 3. Specular Metallic Position Axis (y: 0..2.2 at t = 0, z = 0)
    const yAxis = new THREE.Mesh(this._unitCylinder, this._matSpecularAxis);
    alignCylinderBetween(
      yAxis,
      new THREE.Vector3(xStart, yMinGrid, 0),
      new THREE.Vector3(xStart, yMax + 0.1, 0),
      0.015
    );
    this._axesGroup.add(yAxis);

    const yTip = new THREE.Mesh(this._unitCone, this._matSpecularAxis);
    yTip.position.set(xStart, yMax + 0.16, 0);
    yTip.scale.set(0.044, 0.135, 0.044);
    this._axesGroup.add(yTip);

    // 4. Specular Velocity Depth Axis (dy/dt along Z at t = 0, y = 0)
    const vAxis = new THREE.Mesh(this._unitCylinder, this._matAxisTick);
    alignCylinderBetween(
      vAxis,
      new THREE.Vector3(xStart, y0, -SCALE_V - 0.18),
      new THREE.Vector3(xStart, y0, SCALE_V + 0.18),
      0.011
    );
    this._axesGroup.add(vAxis);

    const vTipPos = new THREE.Mesh(this._unitCone, this._matAxisTick);
    vTipPos.position.set(xStart, y0, SCALE_V + 0.23);
    vTipPos.rotation.x = Math.PI / 2;
    vTipPos.scale.set(0.036, 0.11, 0.036);
    this._axesGroup.add(vTipPos);

    // 5. Fine Cartesian ticks along t (every 1s) and y (0.5, 1.0, 1.5, 2.0)
    const tickGeoT = new THREE.BoxGeometry(0.015, 0.085, 0.015);
    const tickGeoY = new THREE.BoxGeometry(0.085, 0.015, 0.015);

    for (let t = 1; t <= T_MAX; t++) {
      const tick = new THREE.Mesh(tickGeoT, this._matAxisTick);
      tick.position.set(this._tToWorldX(t), y0, 0);
      this._axesGroup.add(tick);
    }

    for (let y = 0.5; y <= 2.01; y += 0.5) {
      const isSetpoint = Math.abs(y - 1.0) < 1e-4;
      const tick = new THREE.Mesh(tickGeoY, isSetpoint ? this._matSetpointDash : this._matAxisTick);
      tick.position.set(xStart, this._yToWorldY(y), 0);
      this._axesGroup.add(tick);
    }

    // 6. Emerald Setpoint Reference Plane & Dashed Target Line at y = 1.0
    // Translucent frosted emerald horizontal setpoint sheet so 3D overshoot above y = 1.0 pops visually
    const setpointPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(T_SPAN_X + 0.18, SCALE_V * 2.05),
      new THREE.MeshBasicMaterial({
        color: COLORS.emerald,
        transparent: true,
        opacity: 0.055,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    setpointPlane.rotation.x = -Math.PI / 2;
    setpointPlane.position.set(0.5 * (xStart + xEnd) + 0.06, y1, 0);
    this._axesGroup.add(setpointPlane);

    // Crisp glowing Emerald dashed line along y = 1.0, z = 0 (3D capsules so bloom catches cleanly!)
    const dashCount = 26;
    const totalLen = T_SPAN_X + 0.16;
    const stride = totalLen / dashCount;
    const dashLen = stride * 0.56;
    const dashGeo = new THREE.CylinderGeometry(0.012, 0.012, dashLen, 8);
    dashGeo.rotateZ(Math.PI / 2);

    const dashInst = new THREE.InstancedMesh(dashGeo, this._matSetpointDash, dashCount);
    const mat4 = new THREE.Matrix4();
    for (let i = 0; i < dashCount; i++) {
      const cx = xStart + (i + 0.5) * stride;
      mat4.makeTranslation(cx, y1, 0);
      dashInst.setMatrixAt(i, mat4);
    }
    dashInst.instanceMatrix.needsUpdate = true;
    this._axesGroup.add(dashInst);

    // Subtle Emerald setpoint border rails along front & back of the setpoint plane
    const railPts = [
      xStart, y1, SCALE_V, xEnd + 0.16, y1, SCALE_V,
      xStart, y1, -SCALE_V, xEnd + 0.16, y1, -SCALE_V,
    ];
    const railGeo = new THREE.BufferGeometry();
    railGeo.setAttribute('position', new THREE.Float32BufferAttribute(railPts, 3));
    this._axesGroup.add(
      new THREE.LineSegments(
        railGeo,
        new THREE.LineBasicMaterial({
          color: COLORS.emerald,
          transparent: true,
          opacity: 0.24,
          depthWrite: false,
        })
      )
    );
  }

  // --------------------------------------------------------------------------
  // Toggleable Violet 3D Phase-Portrait Wall (x = -3.15)
  // --------------------------------------------------------------------------

  _buildPhasePortraitWall() {
    this._phaseWallGroup.position.set(PHASE_WALL_X, 0, 0);
    this._phaseWallGroup.visible = this.showPhaseWall;

    const wallCenterY = this._yToWorldY(1.0); // centered vertically on equilibrium y = 1.0 (+0.30)
    const wallHeight = 3.22; // spans y in [-1.31, +1.91] -> comfortably frames y in [0, 2.0]
    const wallWidthZ = 2.48; // spans z in [-1.24, +1.24] -> frames normalized velocity in [-1, +1]
    const wallThickX = 0.044;

    // 1. Frosted translucent glass plate
    const plateGeom = createVerticalGlassPlateGeometry(
      wallWidthZ,
      wallHeight,
      wallThickX,
      0.16,
      0.014
    );
    const plateMat = new THREE.MeshPhysicalMaterial({
      color: 0x131129,
      emissive: 0x2e1065,
      emissiveIntensity: 0.18,
      roughness: 0.14,
      metalness: 0.12,
      transmission: 0.42,
      thickness: 0.35,
      ior: 1.48,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.92,
      envMapIntensity: 1.4,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    });
    const plateMesh = new THREE.Mesh(plateGeom, plateMat);
    plateMesh.position.set(0, wallCenterY, 0);
    plateMesh.renderOrder = 1;
    this._phaseWallGroup.add(plateMesh);

    // 2. Glowing Violet perimeter chamfer rim tube
    const rimGeom = createVerticalRimGeometry(wallWidthZ - 0.04, wallHeight - 0.04, 0.15, 0.015);
    this._phaseWallRimMat = new THREE.MeshStandardMaterial({
      color: COLORS.violetLight,
      emissive: COLORS.violet,
      emissiveIntensity: 1.25,
      roughness: 0.18,
      metalness: 0.25,
    });
    const rimMesh = new THREE.Mesh(rimGeom, this._phaseWallRimMat);
    rimMesh.position.set(0, wallCenterY, 0);
    this._phaseWallGroup.add(rimMesh);

    // 3. Anodized mounting standoffs anchoring glass wall cleanly to the plinth deck
    const matAnodized = new THREE.MeshPhysicalMaterial({
      color: COLORS.anodized,
      roughness: 0.3,
      metalness: 0.85,
      clearcoat: 0.5,
    });
    const wallBottomY = wallCenterY - wallHeight * 0.5;
    const legH = Math.max(wallBottomY - PLINTH_Y, 0.08);
    for (const zSign of [-0.82, 0.82]) {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.14, legH + 0.06, 0.14), matAnodized);
      foot.position.set(0, PLINTH_Y + (legH + 0.06) * 0.5, zSign);
      this._phaseWallGroup.add(foot);
    }

    // 4. Etched phase-space coordinate grid & axes on inner face (local x = +0.028)
    const faceX = 0.028;
    const y0 = this._yToWorldY(0);
    const y1 = this._yToWorldY(1);
    const yTop = wallCenterY + wallHeight * 0.5 - 0.16;
    const yBot = wallCenterY - wallHeight * 0.5 + 0.16;
    const zMax = wallWidthZ * 0.5 - 0.16;

    const gridPts = [];
    // Vertical lines (constant velocity)
    for (let v = -1.0; v <= 1.01; v += 0.5) {
      const wz = v * SCALE_V;
      gridPts.push(faceX, yBot, wz, faceX, yTop, wz);
    }
    // Horizontal lines (constant position)
    for (let y = 0; y <= 2.01; y += 0.5) {
      const wy = this._yToWorldY(y);
      gridPts.push(faceX, wy, -zMax, faceX, wy, zMax);
    }
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3));
    this._phaseWallGroup.add(
      new THREE.LineSegments(
        gridGeo,
        new THREE.LineBasicMaterial({
          color: COLORS.violet,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
        })
      )
    );

    // Primary Phase Axes: y-axis (z = 0) & dy/dt-axis (y = y1 equilibrium)
    const yAxisWall = new THREE.Mesh(this._unitCylinder, this._matSpecularAxis);
    alignCylinderBetween(
      yAxisWall,
      new THREE.Vector3(faceX, yBot, 0),
      new THREE.Vector3(faceX, yTop, 0),
      0.009
    );
    this._phaseWallGroup.add(yAxisWall);

    const vAxisWall = new THREE.Mesh(this._unitCylinder, this._matSetpointDash);
    alignCylinderBetween(
      vAxisWall,
      new THREE.Vector3(faceX, y1, -zMax),
      new THREE.Vector3(faceX, y1, zMax),
      0.008
    );
    this._phaseWallGroup.add(vAxisWall);

    // Subtle y = 0 datum line on wall
    const y0LineGeo = new THREE.BufferGeometry();
    y0LineGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([faceX, y0, -zMax, faceX, y0, zMax], 3)
    );
    this._phaseWallGroup.add(
      new THREE.LineSegments(
        y0LineGeo,
        new THREE.LineBasicMaterial({
          color: COLORS.cyan,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
        })
      )
    );

    // Glowing Emerald Equilibrium Attractor Target Ring at (y = 1.0, dy/dt = 0)
    const eqRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.115, 0.011, 10, 32),
      this._matSetpointDash
    );
    eqRing.rotation.y = Math.PI / 2;
    eqRing.position.set(faceX + 0.008, y1, 0);
    this._phaseWallGroup.add(eqRing);

    const eqCore = new THREE.Mesh(this._unitSphere, this._matSetpointDash);
    eqCore.scale.setScalar(0.032);
    eqCore.position.set(faceX + 0.008, y1, 0);
    this._phaseWallGroup.add(eqCore);

    // 5. Synced Violet Phase Probe (sphere + rotating halo) on the phase wall face
    this._phaseProbe = new THREE.Mesh(
      new THREE.SphereGeometry(0.088, 24, 24),
      new THREE.MeshPhysicalMaterial({
        color: COLORS.violetLight,
        emissive: COLORS.violet,
        emissiveIntensity: 1.75,
        roughness: 0.08,
        metalness: 0.16,
        clearcoat: 1.0,
      })
    );

    this._phaseProbeHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.155, 0.013, 10, 36),
      new THREE.MeshBasicMaterial({
        color: COLORS.violetLight,
        transparent: true,
        opacity: 0.88,
      })
    );
    this._phaseProbeHalo.rotation.y = Math.PI / 2;
    this._phaseProbe.add(this._phaseProbeHalo);
    this._phaseWallGroup.add(this._phaseProbe);

    // Translucent Violet projection beam linking the live Amber Time Probe to the Violet Phase Probe
    this._phaseBeam = new THREE.Mesh(
      this._unitCylinder,
      new THREE.MeshBasicMaterial({
        color: COLORS.violet,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this._phaseWallGroup.add(this._phaseBeam);
  }

  // --------------------------------------------------------------------------
  // Movable Glowing Amber Time Probe at (t, y(t), y'(t))
  // --------------------------------------------------------------------------

  _buildTimeProbe() {
    // 1. Primary Glowing Amber Probe Sphere + Halo Ring
    this._matAmberProbe = new THREE.MeshPhysicalMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.78,
      roughness: 0.08,
      metalness: 0.14,
      clearcoat: 1.0,
    });
    this._timeProbe = new THREE.Mesh(new THREE.SphereGeometry(0.112, 28, 28), this._matAmberProbe);

    this._timeProbeHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.195, 0.015, 12, 48),
      new THREE.MeshBasicMaterial({
        color: COLORS.amber,
        transparent: true,
        opacity: 0.92,
      })
    );
    this._timeProbe.add(this._timeProbeHalo);
    this._probeGroup.add(this._timeProbe);

    // 2. Synced Projection Bead on z = 0 Time-Response Plane at (t, y(t), 0)
    this._timePlaneBead = new THREE.Mesh(
      new THREE.SphereGeometry(0.056, 18, 18),
      new THREE.MeshStandardMaterial({
        color: COLORS.cyanLight,
        emissive: COLORS.cyan,
        emissiveIntensity: 1.5,
        roughness: 0.12,
        metalness: 0.2,
      })
    );
    this._probeGroup.add(this._timePlaneBead);

    // 3. Velocity Depth Arm connecting (t, y(t), 0) -> (t, y(t), v) showing instantaneous y'(t)
    this._velocityArm = new THREE.Mesh(
      this._unitCylinder,
      new THREE.MeshStandardMaterial({
        color: COLORS.amberLight,
        emissive: COLORS.amber,
        emissiveIntensity: 1.35,
        roughness: 0.18,
        metalness: 0.2,
        transparent: true,
        opacity: 0.85,
      })
    );
    this._probeGroup.add(this._velocityArm);

    // 4. Vertical Drop Pillar on z = 0 from (t, y(t), 0) to (t, 0, 0) + Base Time Ring
    this._dropPillar = new THREE.Mesh(
      this._unitCylinder,
      new THREE.MeshStandardMaterial({
        color: COLORS.amberLight,
        emissive: COLORS.amber,
        emissiveIntensity: 1.2,
        roughness: 0.2,
        metalness: 0.2,
        transparent: true,
        opacity: 0.72,
      })
    );
    this._probeGroup.add(this._dropPillar);

    this._baseTimeRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.082, 0.013, 10, 32),
      this._matAmberProbe
    );
    this._baseTimeRing.rotation.x = Math.PI / 2;
    this._probeGroup.add(this._baseTimeRing);
  }

  // --------------------------------------------------------------------------
  // Miniature 3D Mechatronics Spring-Mass-Damper Rig (Right Edge, x = 3.45)
  // --------------------------------------------------------------------------

  _buildMechatronicsRig() {
    this._rigGroup.position.set(RIG_X, 0, 0);
    this._rigGroup.visible = this.showMechatronics;

    const matAnodized = new THREE.MeshPhysicalMaterial({
      color: COLORS.anodized,
      roughness: 0.28,
      metalness: 0.86,
      clearcoat: 0.55,
      envMapIntensity: 1.35,
    });

    const matBrushedAlum = new THREE.MeshPhysicalMaterial({
      color: COLORS.aluminum,
      roughness: 0.22,
      metalness: 0.9,
      clearcoat: 0.6,
      envMapIntensity: 1.55,
    });

    const matStainless = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      roughness: 0.14,
      metalness: 0.94,
      clearcoat: 0.85,
      envMapIntensity: 1.65,
    });

    const matGlassSleeve = new THREE.MeshPhysicalMaterial({
      color: 0xcbd5e1,
      roughness: 0.08,
      metalness: 0.06,
      transmission: 0.56,
      thickness: 0.3,
      ior: 1.48,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.6,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    });

    // 1. Anodized Top Mounting Plate + Brushed Hardware Bolts
    const topPlate = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.14, 0.62), matAnodized);
    topPlate.position.set(0.14, RIG_TOP_PLATE_Y, 0);
    this._rigGroup.add(topPlate);

    const topAccentStrip = new THREE.Mesh(
      new THREE.BoxGeometry(1.16, 0.022, 0.635),
      new THREE.MeshStandardMaterial({
        color: COLORS.cyanLight,
        emissive: COLORS.cyan,
        emissiveIntensity: 1.05,
        roughness: 0.2,
        metalness: 0.3,
      })
    );
    topAccentStrip.position.set(0.14, RIG_TOP_PLATE_Y + 0.065, 0);
    this._rigGroup.add(topAccentStrip);

    // Top spring retainer boss
    const topSpringSeat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.19, 0.07, 24),
      matBrushedAlum
    );
    topSpringSeat.position.set(RIG_MASS_LOCAL_X, RIG_SPRING_TOP_Y + 0.03, 0);
    this._rigGroup.add(topSpringSeat);

    // 2. Anodized Base Pedestal anchored cleanly on the plinth deck
    const basePedestal = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.12, 0.66), matAnodized);
    basePedestal.position.set(0.14, PLINTH_Y + 0.06, 0);
    this._rigGroup.add(basePedestal);

    // 3. Twin Precision Vertical Stainless Guide Rails behind the CNC mass carriage
    const railH = RIG_TOP_PLATE_Y - 0.07 - RIG_BASE_TOP_Y;
    const railMidY = 0.5 * (RIG_TOP_PLATE_Y - 0.07 + RIG_BASE_TOP_Y);
    for (const rx of [RIG_MASS_LOCAL_X - 0.24, RIG_MASS_LOCAL_X + 0.24]) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, railH, 16), matStainless);
      rail.position.set(rx, railMidY, -0.2);
      this._rigGroup.add(rail);
    }

    // Glowing Emerald Setpoint Datum Collar at y = 1.0 (+0.30) spanning the guide rails
    const setpointMarkerY = this._yToWorldY(1.0);
    const setpointBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.024, 0.035),
      this._matSetpointDash
    );
    setpointBar.position.set(RIG_MASS_LOCAL_X, setpointMarkerY, -0.2);
    this._rigGroup.add(setpointBar);

    for (const rx of [RIG_MASS_LOCAL_X - 0.24, RIG_MASS_LOCAL_X + 0.24]) {
      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(0.042, 0.01, 8, 20),
        this._matSetpointDash
      );
      collar.rotation.x = Math.PI / 2;
      collar.position.set(rx, setpointMarkerY, -0.2);
      this._rigGroup.add(collar);
    }

    // 4. Dynamically Deforming 3D Glowing Helical Coil Spring (TubeGeometry updated with y(t))
    this._matSpring = new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      emissive: COLORS.cyan,
      emissiveIntensity: 0.92,
      roughness: 0.15,
      metalness: 0.72,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.55,
    });
    const initSpringGeo = createHelicalSpringGeometry(
      RIG_MASS_LOCAL_X,
      0,
      RIG_SPRING_TOP_Y,
      this._yToWorldY(1.0) + RIG_MASS_HALF_H
    );
    this._springMesh = new THREE.Mesh(initSpringGeo, this._matSpring);
    this._rigGroup.add(this._springMesh);

    // 5. Hydraulic Viscous Damper Sleeve + Translucent Fluid + Internal Piston + Rod
    const damperTopY = RIG_SPRING_TOP_Y;
    const damperBotY = -1.36;
    const damperH = damperTopY - damperBotY;
    const damperMidY = 0.5 * (damperTopY + damperBotY);

    // Outer borosilicate glass sleeve
    const damperGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.145, 0.145, damperH, 28, 1, true),
      matGlassSleeve
    );
    damperGlass.position.set(RIG_DAMPER_LOCAL_X, damperMidY, 0);
    damperGlass.renderOrder = 6;
    this._rigGroup.add(damperGlass);

    // Damper top & bottom anodized sealing caps
    const capGeo = new THREE.CylinderGeometry(0.162, 0.162, 0.09, 24);
    const damperTopCap = new THREE.Mesh(capGeo, matAnodized);
    damperTopCap.position.set(RIG_DAMPER_LOCAL_X, damperTopY, 0);
    this._rigGroup.add(damperTopCap);

    const damperBotCap = new THREE.Mesh(capGeo, matAnodized);
    damperBotCap.position.set(RIG_DAMPER_LOCAL_X, damperBotY, 0);
    this._rigGroup.add(damperBotCap);

    // Support strut under damper bottom cap down to base pedestal
    const damperFoot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, damperBotY - RIG_BASE_TOP_Y, 16),
      matBrushedAlum
    );
    damperFoot.position.set(RIG_DAMPER_LOCAL_X, 0.5 * (damperBotY + RIG_BASE_TOP_Y), 0);
    this._rigGroup.add(damperFoot);

    // Translucent Violet viscous hydraulic fluid inside sleeve (glows stronger with higher zeta)
    this._matDamperFluid = new THREE.MeshPhysicalMaterial({
      color: COLORS.violet,
      emissive: COLORS.violetDeep,
      emissiveIntensity: 0.65,
      roughness: 0.14,
      metalness: 0.08,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    });
    const damperFluid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.118, 0.118, damperH - 0.12, 24),
      this._matDamperFluid
    );
    damperFluid.position.set(RIG_DAMPER_LOCAL_X, damperMidY, 0);
    damperFluid.renderOrder = 3;
    this._rigGroup.add(damperFluid);

    // Moving internal damper piston head (tracks y(t) inside the glass sleeve)
    this._damperPiston = new THREE.Group();
    const pistonCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.122, 0.122, 0.11, 24),
      matBrushedAlum
    );
    this._damperPiston.add(pistonCore);

    this._matDamperRing = new THREE.MeshStandardMaterial({
      color: COLORS.violetLight,
      emissive: COLORS.violet,
      emissiveIntensity: 1.35,
      roughness: 0.16,
      metalness: 0.25,
    });
    const pistonSealRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.124, 0.013, 8, 28),
      this._matDamperRing
    );
    pistonSealRing.rotation.x = Math.PI / 2;
    this._damperPiston.add(pistonSealRing);
    this._damperPiston.position.set(RIG_DAMPER_LOCAL_X, setpointMarkerY, 0);
    this._rigGroup.add(this._damperPiston);

    // Precision stainless piston rod linking piston head upward through the top wiper seal
    this._damperRod = new THREE.Mesh(this._unitCylinder, matStainless);
    this._rigGroup.add(this._damperRod);

    // 6. Frosted-Cyan CNC Mass Block tracking y(t) vertically
    this._massCarriage = new THREE.Group();
    this._massCarriage.position.set(RIG_MASS_LOCAL_X, setpointMarkerY, 0);

    // Frosted-Cyan translucent machined core block
    const massBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x164e63,
      emissive: COLORS.cyanDeep,
      emissiveIntensity: 0.45,
      roughness: 0.14,
      metalness: 0.24,
      transmission: 0.34,
      thickness: 0.45,
      ior: 1.48,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.5,
      transparent: true,
      opacity: 0.88,
    });
    const massCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, RIG_MASS_HALF_H * 2, 0.36),
      massBodyMat
    );
    this._massCarriage.add(massCore);

    // Brushed aluminum top & bottom CNC clamping plates
    const clampPlateGeo = new THREE.BoxGeometry(0.6, 0.036, 0.39);
    const massTopPlate = new THREE.Mesh(clampPlateGeo, matBrushedAlum);
    massTopPlate.position.y = RIG_MASS_HALF_H - 0.01;
    this._massCarriage.add(massTopPlate);

    const massBotPlate = new THREE.Mesh(clampPlateGeo, matBrushedAlum);
    massBotPlate.position.y = -RIG_MASS_HALF_H + 0.01;
    this._massCarriage.add(massBotPlate);

    // Lower spring seat boss mounted on top of mass block
    const botSpringSeat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.18, 0.04, 24),
      matAnodized
    );
    botSpringSeat.position.y = RIG_MASS_HALF_H + 0.018;
    this._massCarriage.add(botSpringSeat);

    // Glowing Cyan LED waist indicator band around mass block
    this._matMassLed = new THREE.MeshStandardMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.55,
      roughness: 0.14,
      metalness: 0.2,
    });
    const massLedBand = new THREE.Mesh(
      new THREE.BoxGeometry(0.585, 0.032, 0.385),
      this._matMassLed
    );
    this._massCarriage.add(massLedBand);

    // Rear linear bearing bushings gripping the twin stainless guide rails
    const bushingGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.22, 16);
    for (const bx of [-0.24, 0.24]) {
      const bushing = new THREE.Mesh(bushingGeo, matAnodized);
      bushing.position.set(bx, 0, -0.2);
      this._massCarriage.add(bushing);
    }

    // Horizontal CNC clevis yoke arm linking mass carriage right shoulder to damper piston
    const clevisSpan = RIG_DAMPER_LOCAL_X - RIG_MASS_LOCAL_X - 0.28;
    const clevisArm = new THREE.Mesh(
      new THREE.BoxGeometry(clevisSpan + 0.06, 0.055, 0.075),
      matBrushedAlum
    );
    clevisArm.position.set(0.28 + clevisSpan * 0.5 - 0.02, 0, 0);
    this._massCarriage.add(clevisArm);

    // Left optical telemetry receiver port (target of live laser beam from Time Probe)
    const portHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.068, 0.06, 18),
      matAnodized
    );
    portHousing.rotation.z = Math.PI / 2;
    portHousing.position.set(-0.31, 0, 0);
    this._massCarriage.add(portHousing);

    this._matPortLens = new THREE.MeshBasicMaterial({
      color: COLORS.amberLight,
    });
    const portLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.02, 16),
      this._matPortLens
    );
    portLens.rotation.z = Math.PI / 2;
    portLens.position.set(-0.338, 0, 0);
    this._massCarriage.add(portLens);

    this._rigGroup.add(this._massCarriage);

    // 7. Glowing Laser Telemetry Beam linking live Amber Time Probe -> CNC Mass Block
    this._matLaserBeam = new THREE.MeshBasicMaterial({
      color: COLORS.amber,
      transparent: true,
      opacity: 0.56,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this._laserBeam = new THREE.Mesh(this._unitCylinder, this._matLaserBeam);
    this._rigGroup.add(this._laserBeam);
  }

  // --------------------------------------------------------------------------
  // Dynamic Curve Rebuilding (3D Cyan Helix + Step Curtain + Violet Phase Loop)
  // --------------------------------------------------------------------------

  _rebuildTrajectoryCurves() {
    if (!this._curveGroup || !this._phaseCurveGroup) return;

    disposeGroupChildren(this._curveGroup, this._sharedMaterials, this._sharedGeometries);
    disposeGroupChildren(this._phaseCurveGroup, this._sharedMaterials, this._sharedGeometries);

    const preset = this._getPreset();
    const order = preset.order;
    const zeta = this.zeta;
    const omega = this.omega;

    const helixPts = [];
    const timePlanePts = [];
    const phasePts = [];
    const curtainSamples = [];

    const phaseLocalX = 0.038;

    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      const t = T_MIN + (i / CURVE_SAMPLES) * (T_MAX - T_MIN);
      const { y, dydt } = evaluateStepResponse(order, zeta, omega, t);
      const wx = this._tToWorldX(t);
      const wy = this._yToWorldY(y);
      const wz = this._vToWorldZ(dydt);

      helixPts.push(new THREE.Vector3(wx, wy, wz));
      timePlanePts.push(new THREE.Vector3(wx, wy, 0));
      phasePts.push(new THREE.Vector3(phaseLocalX, wy, wz));
      curtainSamples.push({ wx, wy });
    }

    // 1. Primary Sculpted 3D Cyan Time-Position-Velocity Helix (TubeGeometry)
    const helixGeo = createSafeTubeGeometry(helixPts, 260, 0.042, 12);
    const helixMesh = new THREE.Mesh(helixGeo, this._matHelixTube);
    this._curveGroup.add(helixMesh);

    // 2. Crisp 2D Time-Response Trace on z = 0 plane (for razor-sharp Front 2D reading)
    const timeTraceGeo = createSafeTubeGeometry(timePlanePts, 200, 0.015, 8);
    const timeTraceMesh = new THREE.Mesh(timeTraceGeo, this._matTimeTraceTube);
    this._curveGroup.add(timeTraceMesh);

    // 3. Translucent Time-Response Curtain dropping from y(t) down to y = 0 (z = 0 plane)
    const curtainGeo = createStepCurtainGeometry(
      curtainSamples,
      this._yToWorldY(0),
      this._yToWorldY(1)
    );
    const curtainMesh = new THREE.Mesh(curtainGeo, this._matStepCurtain);
    curtainMesh.renderOrder = 2;
    this._curveGroup.add(curtainMesh);

    // 4. Glowing Violet Phase-Portrait Loop projected cleanly onto Phase Wall (x = -3.15)
    const phaseLoopGeo = createSafeTubeGeometry(phasePts, 220, 0.026, 10);
    const phaseLoopMesh = new THREE.Mesh(phaseLoopGeo, this._matPhaseLoop);
    this._phaseCurveGroup.add(phaseLoopMesh);

    // Subtle start-point Cyan beacon at t = 0 on the Phase Wall
    const startPt = phasePts[0];
    if (startPt) {
      const startDot = new THREE.Mesh(this._unitSphere, this._matHelixTube);
      startDot.scale.setScalar(0.042);
      startDot.position.copy(startPt);
      this._phaseCurveGroup.add(startDot);
    }

    // Update damper fluid opacity/glow to physically reflect damping ratio zeta
    if (this._matDamperFluid) {
      const dampNorm = order === 1 ? 0.55 : clamp(zeta / 1.8, 0, 1);
      this._matDamperFluid.opacity = 0.1 + dampNorm * 0.44;
      this._matDamperFluid.emissiveIntensity = 0.18 + dampNorm * 0.95;
    }
  }

  // --------------------------------------------------------------------------
  // Live Interactive Probe, Phase Projection & Spring-Mass-Damper Updates
  // --------------------------------------------------------------------------

  _updateInteractiveElements() {
    const preset = this._getPreset();
    const { y, dydt } = evaluateStepResponse(preset.order, this.zeta, this.omega, this.t);

    const wx = this._tToWorldX(this.t);
    const wy = this._yToWorldY(y);
    const wz = this._vToWorldZ(dydt);
    const y0 = this._yToWorldY(0);

    // 1. Glowing Amber Time Probe at (t, y(t), y'(t))
    if (this._timeProbe) {
      this._timeProbe.position.set(wx, wy, wz);
    }
    if (this._timePlaneBead) {
      this._timePlaneBead.position.set(wx, wy, 0);
    }
    if (this._baseTimeRing) {
      this._baseTimeRing.position.set(wx, y0, 0);
    }

    // Velocity depth arm from (t, y(t), 0) -> (t, y(t), wz)
    if (this._velocityArm) {
      if (Math.abs(wz) > 0.03) {
        alignCylinderBetween(
          this._velocityArm,
          new THREE.Vector3(wx, wy, 0),
          new THREE.Vector3(wx, wy, wz),
          0.012
        );
      } else {
        this._velocityArm.visible = false;
      }
    }

    // Vertical drop pillar on z = 0 from (t, 0, 0) -> (t, y(t), 0)
    if (this._dropPillar) {
      if (Math.abs(wy - y0) > 0.04) {
        alignCylinderBetween(
          this._dropPillar,
          new THREE.Vector3(wx, y0, 0),
          new THREE.Vector3(wx, wy, 0),
          0.013
        );
      } else {
        this._dropPillar.visible = false;
      }
    }

    // 2. Synced Violet Phase Probe + Projection Beam on Phase-Portrait Wall (x = -3.15)
    if (this._phaseProbe && this._phaseBeam) {
      const localFaceX = 0.042;
      this._phaseProbe.position.set(localFaceX, wy, wz);

      // Beam in _phaseWallGroup local space from probe (wx - PHASE_WALL_X, wy, wz) to wall face
      const pStartLocal = new THREE.Vector3(wx - PHASE_WALL_X, wy, wz);
      const pEndLocal = new THREE.Vector3(localFaceX, wy, wz);
      alignCylinderBetween(this._phaseBeam, pStartLocal, pEndLocal, 0.009);
    }

    // 3. Miniature 3D Mechatronics Spring-Mass-Damper Rig (x = 3.45)
    if (this._massCarriage && this._springMesh) {
      // Clamp physical carriage softly inside rail limits while tracking true y(t)
      const massY = clamp(wy, RIG_BASE_TOP_Y + RIG_MASS_HALF_H + 0.08, RIG_SPRING_TOP_Y - 0.56);
      this._massCarriage.position.set(RIG_MASS_LOCAL_X, massY, 0);

      // Update LED color subtly when overshooting above y = 1.0 vs settled near setpoint
      const overshoot = y - 1.0;
      if (this._matMassLed) {
        if (overshoot > 0.04) {
          this._matMassLed.color.setHex(COLORS.amberLight);
          this._matMassLed.emissive.setHex(COLORS.amber);
        } else if (Math.abs(overshoot) <= 0.025 && Math.abs(dydt) < 0.08) {
          this._matMassLed.color.setHex(COLORS.emeraldLight);
          this._matMassLed.emissive.setHex(COLORS.emerald);
        } else {
          this._matMassLed.color.setHex(COLORS.cyanLight);
          this._matMassLed.emissive.setHex(COLORS.cyan);
        }
      }

      // Dynamically deform 3D glowing helical coil spring TubeGeometry cleanly
      const springBotY = massY + RIG_MASS_HALF_H + 0.02;
      if (!Number.isFinite(this._lastSpringBotY) || Math.abs(springBotY - this._lastSpringBotY) > 1e-4) {
        const oldGeo = this._springMesh.geometry;
        this._springMesh.geometry = createHelicalSpringGeometry(
          RIG_MASS_LOCAL_X,
          0,
          RIG_SPRING_TOP_Y,
          springBotY
        );
        if (oldGeo) oldGeo.dispose();
        this._lastSpringBotY = springBotY;

        // Subtle spring strain emissive feedback
        if (this._matSpring) {
          const restLen = RIG_SPRING_TOP_Y - (this._yToWorldY(1.0) + RIG_MASS_HALF_H + 0.02);
          const curLen = RIG_SPRING_TOP_Y - springBotY;
          const strain = clamp(Math.abs(curLen - restLen) / 1.4, 0, 1);
          this._matSpring.emissiveIntensity = 0.72 + strain * 0.75;
        }
      }

      // Move internal hydraulic damper piston & align stainless piston rod
      if (this._damperPiston && this._damperRod) {
        this._damperPiston.position.set(RIG_DAMPER_LOCAL_X, massY, 0);
        alignCylinderBetween(
          this._damperRod,
          new THREE.Vector3(RIG_DAMPER_LOCAL_X, massY + 0.05, 0),
          new THREE.Vector3(RIG_DAMPER_LOCAL_X, RIG_TOP_PLATE_Y + 0.04, 0),
          0.022
        );
      }

      // Glowing laser telemetry beam linking Amber Time Probe -> Mass Block optical port
      if (this._laserBeam) {
        const beamStartLocal = new THREE.Vector3(wx - RIG_X, wy, wz);
        const beamEndLocal = new THREE.Vector3(RIG_MASS_LOCAL_X - 0.34, massY, 0);
        alignCylinderBetween(this._laserBeam, beamStartLocal, beamEndLocal, 0.01);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Camera Presets ('3d' | 'front' | 'iso')
  // --------------------------------------------------------------------------

  _getCameraPose(preset) {
    switch (preset) {
      case 'front':
        return {
          pos: new THREE.Vector3(0.2, 0.35, 12.2),
          target: new THREE.Vector3(0.2, 0.35, 0),
        };
      case 'iso':
        return {
          pos: new THREE.Vector3(5.8, 4.7, 8.6),
          target: new THREE.Vector3(0.15, 0.1, 0),
        };
      case '3d':
      default:
        return {
          pos: new THREE.Vector3(2.45, 2.15, 10.6),
          target: new THREE.Vector3(0.15, 0.2, 0),
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

  setPreset(key) {
    if (!DIFFEQ_PRESETS[key]) return this.getMetrics();
    this._cancelSweepAnimation();

    this.presetKey = key;
    const preset = DIFFEQ_PRESETS[key];
    this.zeta = preset.defaultZeta;
    this.omega = preset.defaultOmega;
    this.t = clamp(this.t, T_MIN, T_MAX);

    if (this._initialized) {
      this._rebuildTrajectoryCurves();
      this._updateInteractiveElements();
    }

    const metrics = this.getMetrics();
    this._emitChange(metrics);
    return metrics;
  }

  setDamping(zeta) {
    const num = Number(zeta);
    if (!Number.isFinite(num)) return this.getMetrics();
    this.zeta = clamp(num, ZETA_MIN, ZETA_MAX);

    if (this._initialized) {
      this._rebuildTrajectoryCurves();
      this._updateInteractiveElements();
    }

    const metrics = this.getMetrics();
    this._emitChange(metrics);
    return metrics;
  }

  setOmega(wn) {
    const num = Number(wn);
    if (!Number.isFinite(num)) return this.getMetrics();
    this.omega = clamp(num, OMEGA_MIN, OMEGA_MAX);

    if (this._initialized) {
      this._rebuildTrajectoryCurves();
      this._updateInteractiveElements();
    }

    const metrics = this.getMetrics();
    this._emitChange(metrics);
    return metrics;
  }

  setTime(t) {
    const num = Number(t);
    if (!Number.isFinite(num)) return this.getMetrics();
    this._cancelSweepAnimation();

    this.t = clamp(num, T_MIN, T_MAX);
    if (this._initialized) {
      this._updateInteractiveElements();
    }

    const metrics = this.getMetrics();
    this._emitChange(metrics);
    return metrics;
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

  togglePhaseWall(bool) {
    this.showPhaseWall = Boolean(bool);
    if (this._phaseWallGroup) {
      this._phaseWallGroup.visible = this.showPhaseWall;
    }
  }

  toggleMechatronicsLens(bool) {
    this.showMechatronics = Boolean(bool);
    if (this._rigGroup) {
      this._rigGroup.visible = this.showMechatronics;
    }
  }

  animateResponse(onFrame) {
    this._cancelSweepAnimation();

    this._sweepAnim = {
      startTime: performance.now(),
      duration: 3200,
      onFrame: typeof onFrame === 'function' ? onFrame : null,
    };

    this.t = T_MIN;
    if (this._initialized) {
      this._updateInteractiveElements();
    }
    const initMetrics = this.getMetrics();
    this._emitChange(initMetrics);
    if (this._sweepAnim.onFrame) {
      this._sweepAnim.onFrame(initMetrics);
    }

    return () => this._cancelSweepAnimation();
  }

  _cancelSweepAnimation() {
    this._sweepAnim = null;
  }

  getMetrics() {
    const preset = this._getPreset();
    const order = preset.order;
    const zeta = this.zeta;
    const omega = this.omega;
    const t = this.t;

    const { y: yt, dydt } = evaluateStepResponse(order, zeta, omega, t);
    const analysis = analyzeSystem(order, zeta, omega);

    return {
      presetKey: this.presetKey,
      preset,
      order,
      zeta,
      omega,
      t,
      yt,
      dydt,
      regime: analysis.regime,
      overshootPct: analysis.overshootPct,
      settlingTime: analysis.settlingTime,
      polesLatex: analysis.polesLatex,
      poles: analysis.poles,
      transferLatex: analysis.transferLatex,
      odeLatex: analysis.odeLatex,
    };
  }

  _emitChange(metrics = this.getMetrics()) {
    if (this.onChange) {
      this.onChange(metrics);
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

    // 1. Real-time step-response time sweep (t: 0 -> 8 over ~3.2s)
    if (this._sweepAnim) {
      const { startTime, duration, onFrame } = this._sweepAnim;
      const rawU = clamp((now - startTime) / duration, 0, 1);
      this.t = rawU >= 1 ? T_MAX : T_MIN + rawU * (T_MAX - T_MIN);

      this._updateInteractiveElements();
      const metrics = this.getMetrics();
      this._emitChange(metrics);
      if (onFrame) onFrame(metrics);

      if (rawU >= 1) {
        this._sweepAnim = null;
      }
    }

    // 2. Smooth cubic ease-out camera preset transition
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

    // 3. Living Spline micro-animations (probe halos & studio rim breathing)
    if (this._timeProbeHalo) {
      this._timeProbeHalo.rotation.z = -elapsed * 1.1;
      this._timeProbeHalo.rotation.x = Math.cos(elapsed * 1.55) * 0.45;
      this._timeProbeHalo.scale.setScalar(1 + Math.sin(elapsed * 3.1) * 0.075);
    }

    if (this._phaseProbeHalo) {
      this._phaseProbeHalo.rotation.x = elapsed * 1.2;
      this._phaseProbeHalo.scale.setScalar(1 + Math.sin(elapsed * 2.9 + 0.6) * 0.07);
    }

    if (this._plinthRimMat) {
      this._plinthRimMat.emissiveIntensity = 1.16 + Math.sin(elapsed * 1.8) * 0.12;
    }

    if (this._phaseWallRimMat) {
      this._phaseWallRimMat.emissiveIntensity = 1.18 + Math.cos(elapsed * 1.65) * 0.12;
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

    // Traverse scene and dispose every unique geometry, material, and texture map
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
