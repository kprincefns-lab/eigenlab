/**
 * EIGENLAB — Interactive 3D PID Control & Closed-Loop Feedback Stability Studio
 * Spline-quality Three.js WebGL visualization module (ES Modules).
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ============================================================================
// 1. ENGINEERING PLANT PRESETS & RK4 CLOSED-LOOP PID STEP SIMULATOR
// ============================================================================

export const PID_PRESETS = {
  'dc-servo': {
    id: 'dc-servo',
    key: 'dc-servo',
    label: 'DC Servo Position',
    mechatronicsLabel: 'DC Servo Motor Loop',
    plant: { a2: 0.4, a1: 1.0, a0: 0.0, b0: 1.0 },
    defaultKp: 4.0,
    defaultKi: 0.8,
    defaultKd: 1.2,
    defaultDisturbance: false,
    plantLatex: 'G(s) = \\frac{1}{s(0.4s + 1)}',
  },
  'quad-hover': {
    id: 'quad-hover',
    key: 'quad-hover',
    label: 'Quadcopter Hold',
    mechatronicsLabel: 'Quadrotor Altitude Hold',
    plant: { a2: 1.0, a1: 0.25, a0: 0.0, b0: 1.0 },
    defaultKp: 3.5,
    defaultKi: 0.6,
    defaultKd: 2.4,
    defaultDisturbance: true,
    plantLatex: 'G(s) = \\frac{1}{s(s + 0.25)}',
  },
  'p-only-droop': {
    id: 'p-only-droop',
    key: 'p-only-droop',
    label: 'P-Only Droop',
    mechatronicsLabel: 'Gravity-Loaded Arm (Droop)',
    plant: { a2: 1.0, a1: 1.2, a0: 1.0, b0: 1.0 },
    defaultKp: 3.0,
    defaultKi: 0.0,
    defaultKd: 0.8,
    defaultDisturbance: false,
    plantLatex: 'G(s) = \\frac{1}{s^2 + 1.2s + 1}',
  },
  'thermal-oven': {
    id: 'thermal-oven',
    key: 'thermal-oven',
    label: 'Thermal Chamber',
    mechatronicsLabel: 'Reflow Oven Thermal Loop',
    plant: { a2: 0.48, a1: 1.6, a0: 1.0, b0: 1.0 },
    defaultKp: 2.8,
    defaultKi: 1.6,
    defaultKd: 0.3,
    defaultDisturbance: false,
    plantLatex: 'G(s) = \\frac{1}{(1.2s + 1)(0.4s + 1)}',
  },
  'unstable-ring': {
    id: 'unstable-ring',
    key: 'unstable-ring',
    label: 'Over-Gained Ring',
    mechatronicsLabel: 'Marginal / Ringing Loop',
    plant: { a2: 0.5, a1: 0.6, a0: 1.0, b0: 1.0 },
    defaultKp: 9.0,
    defaultKi: 4.5,
    defaultKd: 0.1,
    defaultDisturbance: false,
    plantLatex: 'G(s) = \\frac{1}{0.5s^2 + 0.6s + 1}',
  },
};

const T_MIN = 0.0;
const T_MAX_DEFAULT = 8.0;
const DISTURBANCE_TIME = 3.5;
const DISTURBANCE_MAG = 1.2;
const ACTUATOR_LIMIT = 18.0;
const RUNAWAY_Y_CLAMP = 12.0;
const SETPOINT = 1.0;

const KP_MIN = 0.0;
const KP_MAX = 15.0;
const KI_MIN = 0.0;
const KI_MAX = 8.0;
const KD_MIN = 0.0;
const KD_MAX = 6.0;

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

function formatGain(val) {
  const n = Math.abs(val) < 1e-9 ? 0 : val;
  return Number.isInteger(n) ? n.toFixed(1) : Number(n.toFixed(2)).toString();
}

function buildControllerLatex(kp, ki, kd) {
  return `C(s) = ${formatGain(kp)} + \\frac{${formatGain(ki)}}{s} + ${formatGain(kd)}s`;
}

/**
 * Simulate a closed-loop unity-feedback PID unit-step response via 4th-order Runge-Kutta (RK4).
 *
 * Plant: a2 * y'' + a1 * y' + a0 * y = b0 * (u(t) - d(t))
 * Controller (derivative-on-measurement):
 *   e = 1.0 - y
 *   u_raw = kp * e + ki * I - kd * y'
 *   u = clamp(u_raw, -18, 18)
 *   I' = 0 if saturated and pushing deeper into saturation, else e (anti-windup)
 * Optional step load disturbance: d(t) = 1.2 for t >= 3.5 when disturbance === true.
 */
export function simulatePIDStep({
  presetId = 'dc-servo',
  kp = 4.0,
  ki = 0.8,
  kd = 1.2,
  disturbance = false,
  tMax = T_MAX_DEFAULT,
  dt = 0.01,
} = {}) {
  const preset = PID_PRESETS[presetId] || PID_PRESETS['dc-servo'];
  const { a2, a1, a0, b0 } = preset.plant;

  const Kp = Number.isFinite(kp) ? Math.max(0, kp) : preset.defaultKp;
  const Ki = Number.isFinite(ki) ? Math.max(0, ki) : preset.defaultKi;
  const Kd = Number.isFinite(kd) ? Math.max(0, kd) : preset.defaultKd;
  const useDist = Boolean(disturbance);
  const horizon = Math.max(0.5, Number.isFinite(tMax) ? tMax : T_MAX_DEFAULT);
  const h = clamp(Number.isFinite(dt) && dt > 0 ? dt : 0.01, 0.001, 0.05);
  const steps = Math.max(1, Math.round(horizon / h));

  const evalControl = (t, y, yd, I) => {
    const e = SETPOINT - y;
    const uP = Kp * e;
    const uI = Ki * I;
    const uD = -Kd * yd;
    const uRaw = uP + uI + uD;
    const u = clamp(uRaw, -ACTUATOR_LIMIT, ACTUATOR_LIMIT);
    const d = useDist && t >= DISTURBANCE_TIME - 1e-9 ? DISTURBANCE_MAG : 0.0;

    // Soft anti-windup clamping: freeze integrator when saturated and error pushes further into limit
    const saturatedHigh = uRaw > ACTUATOR_LIMIT && e > 0;
    const saturatedLow = uRaw < -ACTUATOR_LIMIT && e < 0;
    const dIdt = saturatedHigh || saturatedLow ? 0.0 : e;

    return { e, uP, uI, uD, uRaw, u, d, dIdt };
  };

  const derivatives = (t, y, yd, I) => {
    const ctrl = evalControl(t, y, yd, I);
    const ydd = (b0 * (ctrl.u - ctrl.d) - a1 * yd - a0 * y) / a2;
    return [yd, ydd, ctrl.dIdt];
  };

  const samples = new Array(steps + 1);

  let y = 0.0;
  let yd = 0.0;
  let I = 0.0;
  let diverged = false;

  let maxY = 0.0;
  let peakAbsY = 0.0;
  let maxEffort = 0.0;

  for (let i = 0; i <= steps; i++) {
    const t = i === steps ? horizon : i * h;
    const ctrl = evalControl(t, y, yd, I);

    samples[i] = {
      t,
      y: normalizeZero(y),
      yd: normalizeZero(yd),
      u: normalizeZero(ctrl.u),
      uP: normalizeZero(ctrl.uP),
      uI: normalizeZero(ctrl.uI),
      uD: normalizeZero(ctrl.uD),
      d: ctrl.d,
      e: normalizeZero(ctrl.e),
    };

    if (y > maxY) maxY = y;
    const absY = Math.abs(y);
    if (absY > peakAbsY) peakAbsY = absY;
    const absU = Math.abs(ctrl.u);
    if (absU > maxEffort) maxEffort = absU;

    if (i === steps) break;

    const stepH = i === steps - 1 ? horizon - t : h;
    const halfH = 0.5 * stepH;

    const k1 = derivatives(t, y, yd, I);
    const k2 = derivatives(
      t + halfH,
      y + halfH * k1[0],
      yd + halfH * k1[1],
      I + halfH * k1[2]
    );
    const k3 = derivatives(
      t + halfH,
      y + halfH * k2[0],
      yd + halfH * k2[1],
      I + halfH * k2[2]
    );
    const k4 = derivatives(
      t + stepH,
      y + stepH * k3[0],
      yd + stepH * k3[1],
      I + stepH * k3[2]
    );

    let nextY = y + (stepH / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    let nextYd = yd + (stepH / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    let nextI = I + (stepH / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);

    if (!Number.isFinite(nextY) || !Number.isFinite(nextYd) || !Number.isFinite(nextI)) {
      diverged = true;
      nextY = clamp(y >= 0 ? RUNAWAY_Y_CLAMP : -RUNAWAY_Y_CLAMP, -RUNAWAY_Y_CLAMP, RUNAWAY_Y_CLAMP);
      nextYd = 0;
      nextI = clamp(I, -60, 60);
    } else if (Math.abs(nextY) > RUNAWAY_Y_CLAMP) {
      diverged = true;
      nextY = clamp(nextY, -RUNAWAY_Y_CLAMP, RUNAWAY_Y_CLAMP);
      nextYd = clamp(nextYd, -60, 60);
      nextI = clamp(nextI, -60, 60);
    } else {
      nextYd = clamp(nextYd, -120, 120);
      nextI = clamp(nextI, -120, 120);
    }

    y = nextY;
    yd = nextYd;
    I = nextI;
  }

  // --- Metrics Computation ---
  const lastSample = samples[samples.length - 1];
  const yEnd = lastSample.y;

  // Overshoot % relative to unit setpoint r = 1.0
  const overshootPct = Math.max(0, (maxY - SETPOINT) * 100);

  // Rise time (10% -> 90% of setpoint 1.0, with linear interpolation;
  // for stable P-only droop that never reaches 0.9, measure 10% -> 90% of final plateau)
  const computeCrossingTime = (threshold) => {
    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1];
      const curr = samples[i];
      if (prev.y < threshold && curr.y >= threshold) {
        const span = curr.y - prev.y;
        const frac = span > 1e-12 ? (threshold - prev.y) / span : 0;
        return prev.t + frac * (curr.t - prev.t);
      }
    }
    return null;
  };

  let riseTime = Infinity;
  const t10Unit = computeCrossingTime(0.1);
  const t90Unit = computeCrossingTime(0.9);
  if (t10Unit !== null && t90Unit !== null && t90Unit >= t10Unit) {
    riseTime = t90Unit - t10Unit;
  } else if (yEnd > 0.25 && maxY < 0.9) {
    const t10Sub = computeCrossingTime(0.1 * yEnd);
    const t90Sub = computeCrossingTime(0.9 * yEnd);
    if (t10Sub !== null && t90Sub !== null && t90Sub >= t10Sub) {
      riseTime = t90Sub - t10Sub;
    }
  }

  // Stability & late-horizon oscillation diagnostics over [0, horizon]
  let earlyMin = Infinity;
  let earlyMax = -Infinity;
  let lateMin = Infinity;
  let lateMax = -Infinity;
  let lateExtremaCount = 0;

  const earlyStart = useDist ? DISTURBANCE_TIME + 0.05 : 1.0;
  const earlyEnd = useDist ? Math.min(5.5, horizon * 0.72) : Math.min(3.5, horizon * 0.5);
  const lateStart = Math.min(5.5, horizon * 0.68);

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    if (s.t >= earlyStart && s.t <= earlyEnd) {
      if (s.y < earlyMin) earlyMin = s.y;
      if (s.y > earlyMax) earlyMax = s.y;
    }
    if (s.t >= lateStart) {
      if (s.y < lateMin) lateMin = s.y;
      if (s.y > lateMax) lateMax = s.y;
      if (i > 0 && samples[i - 1].t >= lateStart) {
        const prevYd = samples[i - 1].yd;
        if ((prevYd > 0 && s.yd <= 0) || (prevYd < 0 && s.yd >= 0)) {
          lateExtremaCount++;
        }
      }
    }
  }

  const earlyAmp = earlyMax > earlyMin ? 0.5 * (earlyMax - earlyMin) : 0;
  const lateSpan = lateMax > lateMin ? lateMax - lateMin : 0;
  const lateAmp = 0.5 * lateSpan;

  // Distinguish genuine late oscillatory ripple from smooth monotonic settling
  const hasLateOscillation = lateExtremaCount >= 1;
  const lateRipple = hasLateOscillation ? lateAmp : 0;

  const oscillationGrowsLate =
    hasLateOscillation &&
    lateAmp > 0.1 &&
    earlyAmp > 0.01 &&
    lateAmp > earlyAmp * 1.06;

  let stability = 'STABLE';
  if (
    diverged ||
    peakAbsY > 3.2 ||
    oscillationGrowsLate ||
    Math.abs(yEnd - SETPOINT) > 1.5
  ) {
    stability = 'UNSTABLE';
  } else if (overshootPct > 35.0 || lateRipple > 0.08) {
    stability = 'OSCILLATORY';
  }

  // Continue exact RK4 tail up to tDiag = max(horizon, 16s) for accurate asymptotic
  // steady-state error & post-horizon ±2% settling time on smoothly converging loops
  let yAsymptotic = yEnd;
  let settlingTime = Infinity;

  let lastOutsideT = -1;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i].y - SETPOINT) > 0.02) {
      lastOutsideT = samples[i].t;
    }
  }

  const diagHorizon = Math.max(horizon, 16.0);
  if (stability !== 'UNSTABLE' && diagHorizon > horizon + 1e-6) {
    let ty = y;
    let tyd = yd;
    let tI = I;
    let tt = horizon;
    const tailH = Math.max(h, 0.02);
    const tailSteps = Math.ceil((diagHorizon - horizon) / tailH);

    for (let i = 0; i < tailSteps; i++) {
      const stepH = i === tailSteps - 1 ? diagHorizon - tt : tailH;
      const halfH = 0.5 * stepH;

      const k1 = derivatives(tt, ty, tyd, tI);
      const k2 = derivatives(
        tt + halfH,
        ty + halfH * k1[0],
        tyd + halfH * k1[1],
        tI + halfH * k1[2]
      );
      const k3 = derivatives(
        tt + halfH,
        ty + halfH * k2[0],
        tyd + halfH * k2[1],
        tI + halfH * k2[2]
      );
      const k4 = derivatives(
        tt + stepH,
        ty + stepH * k3[0],
        tyd + stepH * k3[1],
        tI + stepH * k3[2]
      );

      ty += (stepH / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
      tyd += (stepH / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      tI += (stepH / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
      tt += stepH;

      if (!Number.isFinite(ty) || Math.abs(ty) > RUNAWAY_Y_CLAMP) {
        stability = 'UNSTABLE';
        ty = clamp(Number.isFinite(ty) ? ty : RUNAWAY_Y_CLAMP, -RUNAWAY_Y_CLAMP, RUNAWAY_Y_CLAMP);
        break;
      }
      if (Math.abs(ty - SETPOINT) > 0.02) {
        lastOutsideT = tt;
      }
    }
    yAsymptotic = normalizeZero(ty);
  }

  if (stability !== 'UNSTABLE' && Math.abs(yAsymptotic - SETPOINT) <= 0.02) {
    settlingTime = lastOutsideT < 0 ? 0 : Math.min(lastOutsideT + h, diagHorizon);
  }

  // Steady-state error: asymptotic offset for converging loops; include ripple if oscillating
  const terminalError = Math.abs(SETPOINT - yAsymptotic);
  const steadyStateError =
    stability === 'UNSTABLE'
      ? Math.abs(SETPOINT - yEnd)
      : hasLateOscillation && lateAmp > 0.05
      ? Math.max(terminalError, lateAmp)
      : terminalError;

  return {
    samples,
    overshootPct,
    settlingTime,
    riseTime,
    steadyStateError,
    stability,
    maxEffort,
    controllerLatex: buildControllerLatex(Kp, Ki, Kd),
    plantLatex: preset.plantLatex,
  };
}

// ============================================================================
// 2. SPATIAL CONSTANTS, PALETTE & GEOMETRY UTILITIES
// ============================================================================

const T_ORIGIN_X = -3.15;
const T_SPAN_X = 5.55; // t in [0, 8] -> x in [-3.15, +2.40]
const Y_ZERO_WORLD = -1.04;
const SCALE_Y = 1.24; // y = 0 -> -1.04, y = 1.0 (setpoint) -> +0.20, y = 2.0 -> +1.44
const Y_VIS_MIN = -0.52;
const Y_VIS_MAX = 2.32;

const EFFORT_Z = -0.84;
const EFFORT_ZERO_Y = -0.10;
const EFFORT_SCALE_Y = 0.98 / ACTUATOR_LIMIT; // u in [-18, +18] -> +/-0.98 around EFFORT_ZERO_Y

const RIG_X = 3.38;
const PLINTH_Y = -1.70;
const PLINTH_WIDTH = 9.15;
const PLINTH_DEPTH = 3.65;
const PLINTH_HEIGHT = 0.26;
const PLINTH_OFFSET_X = 0.14;

// Actuator rig vertical frame bounds (collision-free across y in [-0.4, 2.2])
const RIG_TOP_PLATE_Y = 2.18;
const RIG_BASE_TOP_Y = -1.58;
const RIG_CARRIAGE_HALF_H = 0.16;
const RIG_CARRIAGE_LOCAL_X = -0.02;

const COLORS = {
  studioBg: 0x0b0d12,
  cyan: 0x22d3ee,
  cyanLight: 0x67e8f9,
  cyanDeep: 0x0891b2,
  emerald: 0x34d399,
  emeraldLight: 0x6ee7b7,
  emeraldDeep: 0x059669,
  amber: 0xf59e0b,
  amberLight: 0xfcd34d,
  amberDeep: 0xb45309,
  violet: 0xa78bfa,
  violetLight: 0xc4b5fd,
  violetDeep: 0x7c3aed,
  coral: 0xfb7185,
  coralLight: 0xfda4af,
  coralDeep: 0xe11d48,
  slateGlass: 0x0d1526,
  aluminum: 0x94a3b8,
  anodized: 0x1e293b,
};

function getVecUp() {
  return new THREE.Vector3(0, 1, 0);
}

/**
 * Safely align a unit-height (1.0), unit-radius (1.0) cylinder mesh between pA and pB.
 */
function alignCylinderBetween(mesh, pA, pB, radius) {
  const delta = new THREE.Vector3().subVectors(pB, pA);
  const len = delta.length();
  if (!Number.isFinite(len) || len < 1e-4 || radius <= 0) {
    mesh.visible = false;
    return false;
  }
  const dir = delta.clone().divideScalar(len);
  const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(getVecUp(), dir);

  mesh.visible = true;
  mesh.position.copy(mid);
  mesh.quaternion.copy(quat);
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
 * Build a translucent vertical Error Curtain spanning between setpoint y = 1.0 and y(t).
 * Below setpoint -> luminous Cyan/Violet droop tint; Above setpoint -> Amber/Coral overshoot tint.
 */
function createErrorCurtainGeometry(points, setpointWorldY, isUnstable) {
  const n = points.length;
  if (n < 2) return new THREE.BufferGeometry();

  const positions = new Float32Array(n * 2 * 3);
  const colors = new Float32Array(n * 2 * 3);
  const indices = new Uint32Array((n - 1) * 6);

  const cSetpoint = new THREE.Color(COLORS.emerald);
  const cUnder = new THREE.Color(COLORS.cyan);
  const cDroop = new THREE.Color(COLORS.violet);
  const cOver = new THREE.Color(COLORS.amber);
  const cCoral = new THREE.Color(COLORS.coral);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < n; i++) {
    const p = points[i];
    const baseIdx = i * 6;

    // Anchor vertex on setpoint line (y = 1.0)
    positions[baseIdx] = p.wx;
    positions[baseIdx + 1] = setpointWorldY;
    positions[baseIdx + 2] = 0;
    colors[baseIdx] = cSetpoint.r * 0.45;
    colors[baseIdx + 1] = cSetpoint.g * 0.45;
    colors[baseIdx + 2] = cSetpoint.b * 0.45;

    // Curve vertex at y(t)
    positions[baseIdx + 3] = p.wx;
    positions[baseIdx + 4] = p.wy;
    positions[baseIdx + 5] = 0;

    const dy = p.wy - setpointWorldY;
    if (isUnstable && Math.abs(dy) > SCALE_Y * 0.45) {
      tmpColor.copy(cCoral);
    } else if (dy >= 0) {
      const overAmt = clamp(dy / (SCALE_Y * 0.7), 0, 1);
      tmpColor.copy(cOver).lerp(cCoral, overAmt * 0.75);
    } else {
      const underAmt = clamp(-dy / (SCALE_Y * 0.9), 0, 1);
      tmpColor.copy(cUnder).lerp(cDroop, underAmt * 0.42);
    }

    const intensity = clamp(Math.abs(dy) / (SCALE_Y * 0.65), 0.25, 1.0);
    colors[baseIdx + 3] = tmpColor.r * intensity;
    colors[baseIdx + 4] = tmpColor.g * intensity;
    colors[baseIdx + 5] = tmpColor.b * intensity;
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
 * Build a translucent vertical Control Effort Ribbon curtain on z = EFFORT_Z from u = 0 to u(t).
 */
function createEffortCurtainGeometry(points, effortZeroY, effortZ) {
  const n = points.length;
  if (n < 2) return new THREE.BufferGeometry();

  const positions = new Float32Array(n * 2 * 3);
  const colors = new Float32Array(n * 2 * 3);
  const indices = new Uint32Array((n - 1) * 6);

  const cBase = new THREE.Color(COLORS.amberDeep);
  const cPeak = new THREE.Color(COLORS.amberLight);
  const cSat = new THREE.Color(COLORS.coral);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < n; i++) {
    const p = points[i];
    const baseIdx = i * 6;

    // Datum vertex at u = 0
    positions[baseIdx] = p.wx;
    positions[baseIdx + 1] = effortZeroY;
    positions[baseIdx + 2] = effortZ;
    colors[baseIdx] = cBase.r * 0.35;
    colors[baseIdx + 1] = cBase.g * 0.35;
    colors[baseIdx + 2] = cBase.b * 0.35;

    // Effort vertex at u(t)
    positions[baseIdx + 3] = p.wx;
    positions[baseIdx + 4] = p.uy;
    positions[baseIdx + 5] = effortZ;

    const satRatio = clamp(Math.abs(p.u) / ACTUATOR_LIMIT, 0, 1);
    tmpColor.copy(cPeak);
    if (satRatio > 0.9) {
      tmpColor.lerp(cSat, (satRatio - 0.9) * 10);
    }
    const glow = clamp(satRatio * 1.15, 0.25, 1.0);
    colors[baseIdx + 3] = tmpColor.r * glow;
    colors[baseIdx + 4] = tmpColor.g * glow;
    colors[baseIdx + 5] = tmpColor.b * glow;
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
// 3. PID 3D STUDIO CLASS
// ============================================================================

export class Pid3DStudio {
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
    this._axesGroup = null;
    this._curveGroup = null;
    this._effortGroup = null;
    this._disturbanceGroup = null;
    this._probeGroup = null;
    this._rigGroup = null;
    this._lensHighlightsGroup = null;

    // Shared resource registries for zero-leak cleanup
    this._sharedGeometries = new Set();
    this._sharedMaterials = new Set();
    this._ownedTextures = [];

    // Latest simulation cache
    this._sim = null;
    this._runSimulation();

    // Animation & lifecycle handles
    this._rafId = null;
    this._resizeObserver = null;
    this._clock = null;
    this._initialized = false;
    this._disposed = false;

    // Smooth camera transitions & live response sweep
    this._camTransition = null;
    this._sweepAnim = null;

    // Bound handlers
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

    const chosenPresetId = PID_PRESETS[options.presetId]
      ? options.presetId
      : isConstructor
      ? 'dc-servo'
      : this.presetId || 'dc-servo';
    this.presetId = chosenPresetId;
    const preset = PID_PRESETS[this.presetId];

    if (Number.isFinite(options.kp)) {
      this.kp = clamp(options.kp, KP_MIN, KP_MAX);
    } else if (isConstructor || options.presetId) {
      this.kp = preset.defaultKp;
    }

    if (Number.isFinite(options.ki)) {
      this.ki = clamp(options.ki, KI_MIN, KI_MAX);
    } else if (isConstructor || options.presetId) {
      this.ki = preset.defaultKi;
    }

    if (Number.isFinite(options.kd)) {
      this.kd = clamp(options.kd, KD_MIN, KD_MAX);
    } else if (isConstructor || options.presetId) {
      this.kd = preset.defaultKd;
    }

    if (typeof options.disturbance === 'boolean') {
      this.disturbance = options.disturbance;
    } else if (isConstructor || options.presetId) {
      this.disturbance = preset.defaultDisturbance;
    }

    if (typeof options.showEffort === 'boolean') {
      this.showEffort = options.showEffort;
    } else if (isConstructor) {
      this.showEffort = true;
    }

    if (typeof options.mechatronicsLens === 'boolean') {
      this.mechatronicsLens = options.mechatronicsLens;
    } else if (isConstructor) {
      this.mechatronicsLens = false;
    }

    if (Number.isFinite(options.t)) {
      this.t = clamp(options.t, T_MIN, T_MAX_DEFAULT);
    } else if (isConstructor) {
      this.t = 1.85;
    }

    if (isConstructor) {
      this.tMax = T_MAX_DEFAULT;
      this.cameraPreset = '3d';
    }
  }

  // --------------------------------------------------------------------------
  // Simulation & Coordinate Mapping
  // --------------------------------------------------------------------------

  _getPreset() {
    return PID_PRESETS[this.presetId] || PID_PRESETS['dc-servo'];
  }

  _runSimulation() {
    this._sim = simulatePIDStep({
      presetId: this.presetId,
      kp: this.kp,
      ki: this.ki,
      kd: this.kd,
      disturbance: this.disturbance,
      tMax: this.tMax || T_MAX_DEFAULT,
      dt: 0.01,
    });
  }

  _sampleAtTime(t) {
    if (!this._sim || !this._sim.samples.length) {
      return { t: 0, y: 0, yd: 0, u: 0, uP: 0, uI: 0, uD: 0, d: 0, e: 1 };
    }
    const samples = this._sim.samples;
    const clampedT = clamp(t, T_MIN, this.tMax);
    const exactIdx = (clampedT / this.tMax) * (samples.length - 1);
    const idx0 = Math.floor(exactIdx);
    const idx1 = Math.min(idx0 + 1, samples.length - 1);
    const frac = exactIdx - idx0;
    const s0 = samples[idx0];
    const s1 = samples[idx1];
    if (idx0 === idx1 || frac < 1e-6) return s0;
    return {
      t: clampedT,
      y: s0.y + (s1.y - s0.y) * frac,
      yd: s0.yd + (s1.yd - s0.yd) * frac,
      u: s0.u + (s1.u - s0.u) * frac,
      uP: s0.uP + (s1.uP - s0.uP) * frac,
      uI: s0.uI + (s1.uI - s0.uI) * frac,
      uD: s0.uD + (s1.uD - s0.uD) * frac,
      d: s1.d,
      e: s0.e + (s1.e - s0.e) * frac,
    };
  }

  _tToWorldX(t) {
    return T_ORIGIN_X + ((t - T_MIN) / (this.tMax - T_MIN)) * T_SPAN_X;
  }

  _yToWorldY(y) {
    const yClamped = clamp(y, Y_VIS_MIN, Y_VIS_MAX);
    return Y_ZERO_WORLD + yClamped * SCALE_Y;
  }

  _uToWorldY(u) {
    return EFFORT_ZERO_Y + clamp(u, -ACTUATOR_LIMIT, ACTUATOR_LIMIT) * EFFORT_SCALE_Y;
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
      this._runSimulation();
    }

    const width = Math.max(container.clientWidth || 800, 1);
    const height = Math.max(container.clientHeight || 520, 1);

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(COLORS.studioBg, 0.018);

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

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.42, 0.55, 0.72);
    this.composer.addPass(this.bloomPass);

    // 5. Damped OrbitControls
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
    this._effortGroup = new THREE.Group();
    this._disturbanceGroup = new THREE.Group();
    this._probeGroup = new THREE.Group();
    this._rigGroup = new THREE.Group();

    this._stageGroup.add(
      this._plinthGroup,
      this._axesGroup,
      this._curveGroup,
      this._effortGroup,
      this._disturbanceGroup,
      this._probeGroup,
      this._rigGroup
    );

    this._buildPlinth();
    this._buildAxesSetpointAndCorridor();
    this._buildDisturbanceGate();
    this._buildProbe();
    this._buildActuatorRig();

    // Build dynamic curves & sync live probes + actuator rig
    this._rebuildCurves();
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
    const hemi = new THREE.HemisphereLight(0xcbd5e1, 0x0b1120, 0.56);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.35);
    keyLight.position.set(5.4, 9.6, 8.0);
    this.scene.add(keyLight);

    const cyanRim = new THREE.PointLight(COLORS.cyan, 2.0, 24, 1.5);
    cyanRim.position.set(5.8, 3.0, 3.4);
    this.scene.add(cyanRim);

    const violetFill = new THREE.PointLight(COLORS.violet, 1.85, 22, 1.5);
    violetFill.position.set(-5.8, 2.4, 3.6);
    this.scene.add(violetFill);

    const amberBack = new THREE.PointLight(COLORS.amber, 1.35, 22, 1.6);
    amberBack.position.set(0.0, 3.6, -5.6);
    this.scene.add(amberBack);

    const emeraldRim = new THREE.PointLight(COLORS.emerald, 1.15, 20, 1.6);
    emeraldRim.position.set(-2.4, 1.2, 4.5);
    this.scene.add(emeraldRim);
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

    // Sculpted Cyan Closed-Loop Output Tube y(t)
    this._matResponseTube = new THREE.MeshPhysicalMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.05,
      roughness: 0.12,
      metalness: 0.24,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.5,
    });

    // Translucent Error Curtain between y(t) and Setpoint r = 1.0
    this._matErrorCurtain = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.26,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Sculpted Amber Control Effort Ribbon Tube u(t)
    this._matEffortTube = new THREE.MeshPhysicalMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.08,
      roughness: 0.14,
      metalness: 0.26,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.4,
    });

    // Translucent Amber Control Effort Curtain
    this._matEffortCurtain = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Subtle Violet Integral Action Trace u_I(t)
    this._matIntegralTube = new THREE.MeshPhysicalMaterial({
      color: COLORS.violetLight,
      emissive: COLORS.violet,
      emissiveIntensity: 0.95,
      roughness: 0.16,
      metalness: 0.22,
      clearcoat: 0.9,
      transparent: true,
      opacity: 0.68,
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

    // Glowing Emerald Setpoint Reference material (r = 1.0)
    this._matSetpoint = new THREE.MeshStandardMaterial({
      color: COLORS.emeraldLight,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.38,
      roughness: 0.16,
      metalness: 0.2,
    });

    // Glowing Coral Disturbance / Warning material
    this._matCoralGlow = new THREE.MeshStandardMaterial({
      color: COLORS.coralLight,
      emissive: COLORS.coral,
      emissiveIntensity: 1.5,
      roughness: 0.14,
      metalness: 0.2,
    });

    // Glowing Amber Thrust / Effort material
    this._matAmberGlow = new THREE.MeshStandardMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.45,
      roughness: 0.14,
      metalness: 0.22,
    });

    // Glowing Violet Integral / Phase material
    this._matVioletGlow = new THREE.MeshStandardMaterial({
      color: COLORS.violetLight,
      emissive: COLORS.violet,
      emissiveIntensity: 1.3,
      roughness: 0.16,
      metalness: 0.22,
    });

    this._sharedMaterials.add(
      this._matResponseTube,
      this._matErrorCurtain,
      this._matEffortTube,
      this._matEffortCurtain,
      this._matIntegralTube,
      this._matSpecularAxis,
      this._matAxisTick,
      this._matSetpoint,
      this._matCoralGlow,
      this._matAmberGlow,
      this._matVioletGlow
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

    // 3. Crisp glowing perimeter rim tube (shifts subtly with stability state)
    const rimGeom = createPlinthRimGeometry(PLINTH_WIDTH - 0.08, PLINTH_DEPTH - 0.08, 0.32, 0.014);
    this._plinthRimMat = new THREE.MeshStandardMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.3,
    });
    this._plinthGroup.add(new THREE.Mesh(rimGeom, this._plinthRimMat));

    // 4. Subtle etched surface grid & luminous lane guides on plinth deck
    const floorPts = [];
    const halfW = PLINTH_WIDTH * 0.5 - 0.42;
    const halfD = PLINTH_DEPTH * 0.5 - 0.34;
    const ySurf = 0.005;

    for (let gx = -Math.floor(halfW); gx <= Math.floor(halfW); gx += 0.69375) {
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

    // Luminous Cyan center time-axis track strip on deck (z = 0)
    const laneCyan = new THREE.Mesh(
      new THREE.BoxGeometry(T_SPAN_X + 0.36, 0.006, 0.018),
      new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        transparent: true,
        opacity: 0.44,
      })
    );
    laneCyan.position.set(-0.52, 0.008, 0);
    this._plinthGroup.add(laneCyan);

    // Luminous Amber effort lane strip on deck (z = EFFORT_Z)
    this._effortDeckLane = new THREE.Mesh(
      new THREE.BoxGeometry(T_SPAN_X + 0.36, 0.006, 0.014),
      new THREE.MeshBasicMaterial({
        color: COLORS.amber,
        transparent: true,
        opacity: 0.32,
      })
    );
    this._effortDeckLane.position.set(-0.52, 0.008, EFFORT_Z);
    this._plinthGroup.add(this._effortDeckLane);

    // 5. Soft studio under-glow pool beneath floating plinth
    const glowTex = createRadialGlowTexture(
      'rgba(34, 211, 238, 0.22)',
      'rgba(52, 211, 153, 0.11)',
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
  // Cartesian Grid, Specular 3D Axes, Emerald Setpoint Plane & ±2% Corridor
  // --------------------------------------------------------------------------

  _buildAxesSetpointAndCorridor() {
    const xStart = this._tToWorldX(T_MIN);
    const xEnd = this._tToWorldX(this.tMax);
    const xMid = 0.5 * (xStart + xEnd);
    const y0 = this._yToWorldY(0);
    const y1 = this._yToWorldY(SETPOINT);
    const yMax = this._yToWorldY(2.15);
    const yMinGrid = this._yToWorldY(-0.35);
    const zBack = -1.26;

    // 1. Subtle Cartesian back-plane grid
    const majorPts = [];
    const minorPts = [];

    for (let t = 0; t <= this.tMax + 1e-6; t += 0.5) {
      const wx = this._tToWorldX(t);
      const isMajor = Math.abs(t - Math.round(t)) < 1e-3;
      (isMajor ? majorPts : minorPts).push(wx, yMinGrid, zBack, wx, yMax, zBack);
    }

    for (let y = -0.25; y <= 2.25; y += 0.25) {
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
          opacity: 0.15,
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
          opacity: 0.08,
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

    // 3. Specular Metallic Output Axis (y at t = 0, z = 0)
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

    // 4. Fine Cartesian ticks along t (every 1s) and y (0.5, 1.0, 1.5, 2.0)
    const tickGeoT = new THREE.BoxGeometry(0.015, 0.085, 0.015);
    const tickGeoY = new THREE.BoxGeometry(0.085, 0.015, 0.015);

    for (let t = 1; t <= this.tMax; t++) {
      const tick = new THREE.Mesh(tickGeoT, this._matAxisTick);
      tick.position.set(this._tToWorldX(t), y0, 0);
      this._axesGroup.add(tick);
    }

    for (let y = 0.5; y <= 2.01; y += 0.5) {
      const isSetpoint = Math.abs(y - SETPOINT) < 1e-4;
      const tick = new THREE.Mesh(tickGeoY, isSetpoint ? this._matSetpoint : this._matAxisTick);
      tick.position.set(xStart, this._yToWorldY(y), 0);
      this._axesGroup.add(tick);
    }

    // 5. Glowing Emerald Horizontal Setpoint Plane (r = 1.0)
    const setpointPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(T_SPAN_X + 0.2, 1.15),
      new THREE.MeshBasicMaterial({
        color: COLORS.emerald,
        transparent: true,
        opacity: 0.06,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    setpointPlane.rotation.x = -Math.PI / 2;
    setpointPlane.position.set(xMid + 0.06, y1, -0.1);
    this._axesGroup.add(setpointPlane);

    // Crisp glowing Emerald dashed Target Rail along y = 1.0, z = 0 (3D capsules catch bloom cleanly)
    const dashCount = 28;
    const totalLen = T_SPAN_X + 0.18;
    const stride = totalLen / dashCount;
    const dashLen = stride * 0.58;
    const dashGeo = new THREE.CylinderGeometry(0.012, 0.012, dashLen, 8);
    dashGeo.rotateZ(Math.PI / 2);

    const dashInst = new THREE.InstancedMesh(dashGeo, this._matSetpoint, dashCount);
    const mat4 = new THREE.Matrix4();
    for (let i = 0; i < dashCount; i++) {
      const cx = xStart + (i + 0.5) * stride;
      mat4.makeTranslation(cx, y1, 0);
      dashInst.setMatrixAt(i, mat4);
    }
    dashInst.instanceMatrix.needsUpdate = true;
    this._axesGroup.add(dashInst);

    // 6. Subtle Translucent ±2% Settling Corridor Band (y in [0.98, 1.02])
    const yBandHi = this._yToWorldY(1.02);
    const yBandLo = this._yToWorldY(0.98);
    const bandHeight = Math.max(yBandHi - yBandLo, 0.048);

    const corridorBand = new THREE.Mesh(
      new THREE.PlaneGeometry(T_SPAN_X + 0.16, bandHeight),
      new THREE.MeshBasicMaterial({
        color: COLORS.emerald,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    corridorBand.position.set(xMid + 0.05, y1, -0.025);
    corridorBand.renderOrder = 1;
    this._axesGroup.add(corridorBand);

    // Crisp ±2% boundary hairlines + front/back setpoint plane edge rails
    const corridorPts = [
      xStart, yBandHi, -0.02, xEnd + 0.14, yBandHi, -0.02,
      xStart, yBandLo, -0.02, xEnd + 0.14, yBandLo, -0.02,
      xStart, y1, 0.45, xEnd + 0.14, y1, 0.45,
      xStart, y1, -0.65, xEnd + 0.14, y1, -0.65,
    ];
    const corridorGeo = new THREE.BufferGeometry();
    corridorGeo.setAttribute('position', new THREE.Float32BufferAttribute(corridorPts, 3));
    this._axesGroup.add(
      new THREE.LineSegments(
        corridorGeo,
        new THREE.LineBasicMaterial({
          color: COLORS.emeraldLight,
          transparent: true,
          opacity: 0.34,
          depthWrite: false,
        })
      )
    );

    // 7. Static Control Effort Reference Frame (visible when showEffort === true)
    this._effortFrameGroup = new THREE.Group();
    const uZeroY = EFFORT_ZERO_Y;
    const uSatHiY = this._uToWorldY(ACTUATOR_LIMIT);
    const uSatLoY = this._uToWorldY(-ACTUATOR_LIMIT);

    const effortRefPts = [
      // u = 0 baseline
      xStart, uZeroY, EFFORT_Z, xEnd + 0.14, uZeroY, EFFORT_Z,
      // u = +18 saturation ceiling
      xStart, uSatHiY, EFFORT_Z, xEnd + 0.14, uSatHiY, EFFORT_Z,
      // u = -18 saturation floor
      xStart, uSatLoY, EFFORT_Z, xEnd + 0.14, uSatLoY, EFFORT_Z,
      // Vertical left effort axis at t = 0
      xStart, uSatLoY, EFFORT_Z, xStart, uSatHiY, EFFORT_Z,
    ];
    const effortRefGeo = new THREE.BufferGeometry();
    effortRefGeo.setAttribute('position', new THREE.Float32BufferAttribute(effortRefPts, 3));
    this._effortFrameGroup.add(
      new THREE.LineSegments(
        effortRefGeo,
        new THREE.LineBasicMaterial({
          color: COLORS.amber,
          transparent: true,
          opacity: 0.25,
          depthWrite: false,
        })
      )
    );

    // Subtle frosted translucent effort backing strip
    const effortBackdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(T_SPAN_X + 0.16, uSatHiY - uSatLoY),
      new THREE.MeshBasicMaterial({
        color: COLORS.amber,
        transparent: true,
        opacity: 0.032,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    effortBackdrop.position.set(xMid + 0.05, uZeroY, EFFORT_Z - 0.015);
    this._effortFrameGroup.add(effortBackdrop);

    this._effortFrameGroup.visible = this.showEffort;
    this._axesGroup.add(this._effortFrameGroup);
  }

  // --------------------------------------------------------------------------
  // Coral Disturbance Beacon Gate at t = 3.5 s
  // --------------------------------------------------------------------------

  _buildDisturbanceGate() {
    const xDist = this._tToWorldX(DISTURBANCE_TIME);
    const yBot = PLINTH_Y + 0.02;
    const yTop = this._yToWorldY(1.92);
    const gateH = yTop - yBot;
    const gateMidY = 0.5 * (yBot + yTop);

    this._disturbanceGroup.position.set(xDist, 0, 0);
    this._disturbanceGroup.visible = this.disturbance;

    // 1. Translucent Coral vertical pulse gate plane
    this._matDistGatePlane = new THREE.MeshBasicMaterial({
      color: COLORS.coral,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const gatePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.18, gateH), this._matDistGatePlane);
    gatePlane.position.set(0, gateMidY, 0);
    gatePlane.renderOrder = 2;
    this._disturbanceGroup.add(gatePlane);

    // 2. Crisp glowing Coral vertical beacon rod at t = 3.5 s
    this._matDistBeacon = new THREE.MeshStandardMaterial({
      color: COLORS.coralLight,
      emissive: COLORS.coral,
      emissiveIntensity: 1.45,
      roughness: 0.16,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const beaconPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, gateH, 12),
      this._matDistBeacon
    );
    beaconPillar.position.set(0, gateMidY, 0);
    this._disturbanceGroup.add(beaconPillar);

    // 3. Base pulse emitter pad sitting cleanly on plinth deck
    const baseRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.016, 10, 32),
      this._matDistBeacon
    );
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.set(0, PLINTH_Y + 0.02, 0);
    this._disturbanceGroup.add(baseRing);

    // 4. Downward External Load Force Arrow hitting the curve at t = 3.5 s
    this._distCurveArrowGroup = new THREE.Group();

    const arrowShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.44, 16),
      this._matDistBeacon
    );
    arrowShaft.position.y = 0.42;
    this._distCurveArrowGroup.add(arrowShaft);

    const arrowHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.088, 0.22, 20),
      this._matDistBeacon
    );
    arrowHead.rotation.x = Math.PI; // points downward (-Y)
    arrowHead.position.y = 0.12;
    this._distCurveArrowGroup.add(arrowHead);

    // Animated Coral shockwave impact torus right where the load hits y(3.5)
    this._distShockRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.135, 0.015, 10, 36),
      new THREE.MeshBasicMaterial({
        color: COLORS.coralLight,
        transparent: true,
        opacity: 0.88,
      })
    );
    this._distShockRing.rotation.x = Math.PI / 2;
    this._distShockRing.position.y = 0.0;
    this._distCurveArrowGroup.add(this._distShockRing);

    this._distCurveArrowGroup.position.set(0, this._yToWorldY(1.0), 0);
    this._disturbanceGroup.add(this._distCurveArrowGroup);
  }

  // --------------------------------------------------------------------------
  // Animated Glowing Probe Sphere & Live Error Drop-Line to Setpoint r = 1.0
  // --------------------------------------------------------------------------

  _buildProbe() {
    // 1. Primary Glowing Probe Sphere on (t, y(t), 0)
    this._matProbeCore = new THREE.MeshPhysicalMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.75,
      roughness: 0.08,
      metalness: 0.14,
      clearcoat: 1.0,
    });
    this._probeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.105, 28, 28), this._matProbeCore);

    this._probeHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.185, 0.014, 12, 48),
      new THREE.MeshBasicMaterial({
        color: COLORS.cyanLight,
        transparent: true,
        opacity: 0.9,
      })
    );
    this._probeSphere.add(this._probeHalo);
    this._probeGroup.add(this._probeSphere);

    // 2. Live Error Drop-Line from (t, y(t), 0) -> Setpoint (t, 1.0, 0)
    this._matErrorLine = new THREE.MeshStandardMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.4,
      roughness: 0.16,
      metalness: 0.2,
      transparent: true,
      opacity: 0.9,
    });
    this._errorDropLine = new THREE.Mesh(this._unitCylinder, this._matErrorLine);
    this._probeGroup.add(this._errorDropLine);

    // Emerald Setpoint Target Anchor Ring at (t, 1.0, 0)
    this._setpointAnchorRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.072, 0.012, 10, 28),
      this._matSetpoint
    );
    this._setpointAnchorRing.rotation.x = Math.PI / 2;
    this._probeGroup.add(this._setpointAnchorRing);

    // 3. Subtle Time-Axis Reference Stem & Base Ring at (t, 0, 0)
    this._timeAxisStem = new THREE.Mesh(
      this._unitCylinder,
      new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this._probeGroup.add(this._timeAxisStem);

    this._baseTimeRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.074, 0.011, 10, 28),
      this._matProbeCore
    );
    this._baseTimeRing.rotation.x = Math.PI / 2;
    this._probeGroup.add(this._baseTimeRing);

    // 4. Synced Amber Effort Probe Bead on (t, u(t), EFFORT_Z) + Depth Connector
    this._effortProbeBead = new THREE.Mesh(
      new THREE.SphereGeometry(0.068, 20, 20),
      this._matAmberGlow
    );
    this._probeGroup.add(this._effortProbeBead);

    this._effortDepthLink = new THREE.Mesh(
      this._unitCylinder,
      new THREE.MeshBasicMaterial({
        color: COLORS.amber,
        transparent: true,
        opacity: 0.38,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this._probeGroup.add(this._effortDepthLink);
  }

  // --------------------------------------------------------------------------
  // 3D Physical Mechatronics Servo Actuator / Gimbal Carriage Rig (Right Edge)
  // --------------------------------------------------------------------------

  _buildActuatorRig() {
    this._rigGroup.position.set(RIG_X, 0, 0);

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

    // 1. Anodized Base Pedestal anchored cleanly on plinth deck
    const basePedestal = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.12, 0.72), matAnodized);
    basePedestal.position.set(0.06, PLINTH_Y + 0.06, 0);
    this._rigGroup.add(basePedestal);

    // 2. Top Servo Motor Drive Head & Encoder Housing
    const topPlate = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.13, 0.66), matAnodized);
    topPlate.position.set(0.06, RIG_TOP_PLATE_Y, 0);
    this._rigGroup.add(topPlate);

    // Cylindrical brushless servo motor stator mounted above top plate
    const motorCan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.28, 28),
      matBrushedAlum
    );
    motorCan.position.set(RIG_CARRIAGE_LOCAL_X, RIG_TOP_PLATE_Y + 0.2, 0);
    this._rigGroup.add(motorCan);

    // Rotating servo encoder rotor cap on top of motor
    this._servoRotor = new THREE.Group();
    this._servoRotor.position.set(RIG_CARRIAGE_LOCAL_X, RIG_TOP_PLATE_Y + 0.36, 0);
    const rotorHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.06, 24),
      matAnodized
    );
    this._servoRotor.add(rotorHub);
    const rotorNotch = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.04, 0.045),
      this._matResponseTube
    );
    rotorNotch.position.y = 0.025;
    this._servoRotor.add(rotorNotch);
    this._rigGroup.add(this._servoRotor);

    // 3. Twin Precision Vertical Stainless Guide Rails + Central Ball-Screw Shaft
    const railH = RIG_TOP_PLATE_Y - 0.06 - RIG_BASE_TOP_Y;
    const railMidY = 0.5 * (RIG_TOP_PLATE_Y - 0.06 + RIG_BASE_TOP_Y);

    for (const rx of [RIG_CARRIAGE_LOCAL_X - 0.32, RIG_CARRIAGE_LOCAL_X + 0.32]) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, railH, 16), matStainless);
      rail.position.set(rx, railMidY, -0.18);
      this._rigGroup.add(rail);
    }

    // Central anodized lead-screw shaft
    const leadScrew = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, railH, 16),
      matBrushedAlum
    );
    leadScrew.position.set(RIG_CARRIAGE_LOCAL_X, railMidY, -0.18);
    this._rigGroup.add(leadScrew);

    // 4. Glowing Emerald Setpoint Target Bracket at y = 1.0
    const y1 = this._yToWorldY(SETPOINT);
    const bracketGroup = new THREE.Group();
    bracketGroup.position.set(RIG_CARRIAGE_LOCAL_X, y1, 0);

    const backBar = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.028, 0.04), this._matSetpoint);
    backBar.position.set(0, 0, -0.18);
    bracketGroup.add(backBar);

    // Twin protruding Emerald target jaw fingers framing the carriage's target level
    for (const sx of [-0.41, 0.41]) {
      const sideFinger = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.028, 0.38),
        this._matSetpoint
      );
      sideFinger.position.set(sx, 0, -0.01);
      bracketGroup.add(sideFinger);

      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(0.044, 0.011, 8, 20),
        this._matSetpoint
      );
      collar.rotation.x = Math.PI / 2;
      collar.position.set(sx * 0.78, 0, -0.18);
      bracketGroup.add(collar);
    }
    this._rigGroup.add(bracketGroup);

    // 5. Sculpted Metallic + Cyan Actuator Carriage & Rotary Gimbal Arm
    this._carriage = new THREE.Group();
    this._carriage.position.set(RIG_CARRIAGE_LOCAL_X, y1, 0);

    // Frosted-Cyan CNC core body
    const carriageBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x164e63,
      emissive: COLORS.cyanDeep,
      emissiveIntensity: 0.45,
      roughness: 0.14,
      metalness: 0.28,
      transmission: 0.32,
      thickness: 0.42,
      ior: 1.48,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.5,
      transparent: true,
      opacity: 0.88,
    });
    const carriageCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, RIG_CARRIAGE_HALF_H * 2, 0.34),
      carriageBodyMat
    );
    this._carriage.add(carriageCore);

    // Brushed aluminum CNC clamping plates
    const plateGeo = new THREE.BoxGeometry(0.66, 0.036, 0.37);
    const topClamp = new THREE.Mesh(plateGeo, matBrushedAlum);
    topClamp.position.y = RIG_CARRIAGE_HALF_H - 0.01;
    this._carriage.add(topClamp);

    const botClamp = new THREE.Mesh(plateGeo, matBrushedAlum);
    botClamp.position.y = -RIG_CARRIAGE_HALF_H + 0.01;
    this._carriage.add(botClamp);

    // Glowing Status LED Band around carriage waist
    this._matCarriageLed = new THREE.MeshStandardMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.55,
      roughness: 0.14,
      metalness: 0.2,
    });
    const ledBand = new THREE.Mesh(
      new THREE.BoxGeometry(0.645, 0.034, 0.365),
      this._matCarriageLed
    );
    this._carriage.add(ledBand);

    // Rear linear bearing bushings on guide rails
    const bushingGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.24, 16);
    for (const bx of [-0.32, 0.32]) {
      const bushing = new THREE.Mesh(bushingGeo, matAnodized);
      bushing.position.set(bx, 0, -0.18);
      this._carriage.add(bushing);
    }

    // Front Rotary Gimbal Hub + Integral Accumulator Violet Ring + Articulated Arm
    const gimbalBoss = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.12, 0.09, 24),
      matBrushedAlum
    );
    gimbalBoss.rotation.x = Math.PI / 2;
    gimbalBoss.position.set(0, 0, 0.19);
    this._carriage.add(gimbalBoss);

    // Violet Integral Action Ring glowing proportionally to |uI|
    this._matIntegralRing = new THREE.MeshStandardMaterial({
      color: COLORS.violetLight,
      emissive: COLORS.violet,
      emissiveIntensity: 0.4,
      roughness: 0.16,
      metalness: 0.25,
    });
    const integralRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.118, 0.015, 10, 32),
      this._matIntegralRing
    );
    integralRing.position.set(0, 0, 0.23);
    this._carriage.add(integralRing);

    // Articulated Rotary Gimbal Arm (tilts smoothly with live actuator velocity / response)
    this._gimbalArm = new THREE.Group();
    this._gimbalArm.position.set(0, 0, 0.255);

    const armBeam = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.044, 0.04), matStainless);
    armBeam.position.x = 0.12;
    this._gimbalArm.add(armBeam);

    const armTipLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.038, 16, 16),
      this._matCarriageLed
    );
    armTipLed.position.x = 0.35;
    this._gimbalArm.add(armTipLed);

    const counterWeight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.048, 0.055, 16),
      matAnodized
    );
    counterWeight.rotation.x = Math.PI / 2;
    counterWeight.position.x = -0.11;
    this._gimbalArm.add(counterWeight);

    this._carriage.add(this._gimbalArm);

    // Left optical telemetry receiver port (target of laser link from live curve probe)
    const portHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.066, 0.06, 18),
      matAnodized
    );
    portHousing.rotation.z = Math.PI / 2;
    portHousing.position.set(-0.34, 0, 0);
    this._carriage.add(portHousing);

    const portLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.02, 16),
      new THREE.MeshBasicMaterial({ color: COLORS.cyanLight })
    );
    portLens.rotation.z = Math.PI / 2;
    portLens.position.set(-0.368, 0, 0);
    this._carriage.add(portLens);

    this._rigGroup.add(this._carriage);

    // 6. Glowing Amber Actuator Thrust / Torque Vector Arrow (proportional to u(t))
    this._thrustArrowGroup = new THREE.Group();
    this._thrustShaft = new THREE.Mesh(this._unitCylinder, this._matAmberGlow);
    this._thrustHead = new THREE.Mesh(this._unitCone, this._matAmberGlow);
    this._thrustArrowGroup.add(this._thrustShaft, this._thrustHead);
    this._rigGroup.add(this._thrustArrowGroup);

    // 7. Glowing Coral Load Disturbance Arrow above carriage (flashes when t >= 3.5 & disturbance)
    this._rigDistArrowGroup = new THREE.Group();
    this._matRigDistArrow = new THREE.MeshStandardMaterial({
      color: COLORS.coralLight,
      emissive: COLORS.coral,
      emissiveIntensity: 1.75,
      roughness: 0.14,
      metalness: 0.2,
    });
    const distShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.034, 0.42, 16),
      this._matRigDistArrow
    );
    distShaft.position.y = 0.41;
    this._rigDistArrowGroup.add(distShaft);

    const distHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.098, 0.22, 20),
      this._matRigDistArrow
    );
    distHead.rotation.x = Math.PI;
    distHead.position.y = 0.12;
    this._rigDistArrowGroup.add(distHead);

    const distImpactHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.145, 0.016, 10, 32),
      this._matRigDistArrow
    );
    distImpactHalo.rotation.x = Math.PI / 2;
    distImpactHalo.position.y = 0.0;
    this._rigDistArrowGroup.add(distImpactHalo);

    this._rigDistArrowGroup.visible = false;
    this._rigGroup.add(this._rigDistArrowGroup);

    // 8. Translucent Telemetry Laser Link from live Probe -> Carriage Receiver Port
    this._matLaserLink = new THREE.MeshBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this._laserLink = new THREE.Mesh(this._unitCylinder, this._matLaserLink);
    this._rigGroup.add(this._laserLink);

    // 9. Mechatronics Lens Extra Engineering Highlights (torque collar, saturation rails, error caliper)
    this._lensHighlightsGroup = new THREE.Group();
    this._lensHighlightsGroup.visible = this.mechatronicsLens;

    // 9a. Glowing Amber Torque Collar Ring around top servo motor shaft
    this._matTorqueCollar = new THREE.MeshStandardMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.65,
      roughness: 0.14,
      metalness: 0.3,
    });
    this._torqueCollarRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.285, 0.024, 12, 42),
      this._matTorqueCollar
    );
    this._torqueCollarRing.rotation.x = Math.PI / 2;
    this._torqueCollarRing.position.set(RIG_CARRIAGE_LOCAL_X, RIG_TOP_PLATE_Y + 0.18, 0);
    this._lensHighlightsGroup.add(this._torqueCollarRing);

    const secondaryTorqueCollar = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.012, 10, 42),
      this._matVioletGlow
    );
    secondaryTorqueCollar.rotation.x = Math.PI / 2;
    secondaryTorqueCollar.position.set(RIG_CARRIAGE_LOCAL_X, RIG_TOP_PLATE_Y + 0.27, 0);
    this._lensHighlightsGroup.add(secondaryTorqueCollar);

    // 9b. Glowing Saturation / Mechanical Limit Rails (top & bottom glowing limit gates)
    const limitHiY = RIG_TOP_PLATE_Y - 0.24;
    const limitLoY = RIG_BASE_TOP_Y + 0.22;
    for (const ly of [limitHiY, limitLoY]) {
      const limitBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.96, 0.026, 0.05),
        this._matCoralGlow
      );
      limitBar.position.set(RIG_CARRIAGE_LOCAL_X, ly, -0.18);
      this._lensHighlightsGroup.add(limitBar);

      for (const sx of [-0.46, 0.46]) {
        const endCap = new THREE.Mesh(
          new THREE.BoxGeometry(0.032, 0.09, 0.22),
          this._matCoralGlow
        );
        endCap.position.set(RIG_CARRIAGE_LOCAL_X + sx, ly, -0.1);
        this._lensHighlightsGroup.add(endCap);
      }
    }

    // Side vertical saturation gauge rails
    const satRailH = limitHiY - limitLoY;
    const satRailMidY = 0.5 * (limitHiY + limitLoY);
    for (const sx of [-0.48, 0.48]) {
      const satRail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, satRailH, 10),
        new THREE.MeshBasicMaterial({
          color: COLORS.amber,
          transparent: true,
          opacity: 0.42,
        })
      );
      satRail.position.set(RIG_CARRIAGE_LOCAL_X + sx, satRailMidY, -0.18);
      this._lensHighlightsGroup.add(satRail);
    }

    // 9c. Precision Glowing Live Error Caliper (measuring e(t) between Setpoint Bracket & Carriage)
    this._caliperStem = new THREE.Mesh(this._unitCylinder, this._matVioletGlow);
    this._lensHighlightsGroup.add(this._caliperStem);

    this._caliperTopJaw = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.022, 0.05),
      this._matSetpoint
    );
    this._caliperTopJaw.position.set(RIG_CARRIAGE_LOCAL_X - 0.46, y1, 0.14);
    this._lensHighlightsGroup.add(this._caliperTopJaw);

    this._caliperBotJaw = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.022, 0.05),
      this._matVioletGlow
    );
    this._caliperBotJaw.position.set(RIG_CARRIAGE_LOCAL_X - 0.46, y1, 0.14);
    this._lensHighlightsGroup.add(this._caliperBotJaw);

    this._rigGroup.add(this._lensHighlightsGroup);
  }

  // --------------------------------------------------------------------------
  // Dynamic 3D Curve Rebuilding (Zero Memory Leaks via Dispose)
  // --------------------------------------------------------------------------

  _rebuildCurves() {
    if (!this._curveGroup || !this._effortGroup || !this._sim) return;

    disposeGroupChildren(this._curveGroup, this._sharedMaterials, this._sharedGeometries);
    disposeGroupChildren(this._effortGroup, this._sharedMaterials, this._sharedGeometries);

    const samples = this._sim.samples;
    const total = samples.length;
    if (total < 2) return;

    // Decimate cleanly to ~260 points for smooth TubeGeometry without over-tessellating
    const targetPts = 260;
    const stride = Math.max(1, Math.floor((total - 1) / targetPts));

    const responsePts = [];
    const curtainPts = [];
    const effortPts = [];
    const effortCurtainPts = [];
    const integralPts = [];

    for (let i = 0; i < total; i += stride) {
      const s = samples[i];
      const wx = this._tToWorldX(s.t);
      const wy = this._yToWorldY(s.y);
      const uy = this._uToWorldY(s.u);
      const uiy = this._uToWorldY(s.uI);

      responsePts.push(new THREE.Vector3(wx, wy, 0));
      curtainPts.push({ wx, wy });
      effortPts.push(new THREE.Vector3(wx, uy, EFFORT_Z));
      effortCurtainPts.push({ wx, uy, u: s.u });
      integralPts.push(new THREE.Vector3(wx, uiy, EFFORT_Z + 0.16));
    }

    // Ensure exact terminal point at t = tMax is always included
    const last = samples[total - 1];
    const lastWx = this._tToWorldX(last.t);
    const lastWy = this._yToWorldY(last.y);
    const lastUy = this._uToWorldY(last.u);
    const lastUiy = this._uToWorldY(last.uI);
    if (responsePts[responsePts.length - 1].x < lastWx - 1e-4) {
      responsePts.push(new THREE.Vector3(lastWx, lastWy, 0));
      curtainPts.push({ wx: lastWx, wy: lastWy });
      effortPts.push(new THREE.Vector3(lastWx, lastUy, EFFORT_Z));
      effortCurtainPts.push({ wx: lastWx, uy: lastUy, u: last.u });
      integralPts.push(new THREE.Vector3(lastWx, lastUiy, EFFORT_Z + 0.16));
    }

    const isUnstable = this._sim.stability === 'UNSTABLE';
    const isOscillatory = this._sim.stability === 'OSCILLATORY';

    // Update primary response tube accent color subtly for unstable runaway vs healthy loops
    if (isUnstable) {
      this._matResponseTube.color.setHex(COLORS.coralLight);
      this._matResponseTube.emissive.setHex(COLORS.coral);
      this._matResponseTube.emissiveIntensity = 1.18;
    } else {
      this._matResponseTube.color.setHex(COLORS.cyanLight);
      this._matResponseTube.emissive.setHex(COLORS.cyan);
      this._matResponseTube.emissiveIntensity = 1.05;
    }

    // Update studio plinth rim ambient stability color cue
    if (this._plinthRimMat) {
      if (isUnstable) {
        this._plinthRimMat.color.setHex(COLORS.coralLight);
        this._plinthRimMat.emissive.setHex(COLORS.coral);
      } else if (isOscillatory) {
        this._plinthRimMat.color.setHex(COLORS.amberLight);
        this._plinthRimMat.emissive.setHex(COLORS.amber);
      } else {
        this._plinthRimMat.color.setHex(COLORS.cyanLight);
        this._plinthRimMat.emissive.setHex(COLORS.cyan);
      }
    }

    // 1. Primary Glowing Cyan 3D Closed-Loop Step Response Tube y(t)
    const responseGeo = createSafeTubeGeometry(responsePts, 240, 0.044, 12);
    const responseMesh = new THREE.Mesh(responseGeo, this._matResponseTube);
    this._curveGroup.add(responseMesh);

    // 2. Translucent Vertical Error Curtain between y(t) and setpoint r = 1.0
    const errorCurtainGeo = createErrorCurtainGeometry(
      curtainPts,
      this._yToWorldY(SETPOINT),
      isUnstable
    );
    const errorCurtainMesh = new THREE.Mesh(errorCurtainGeo, this._matErrorCurtain);
    errorCurtainMesh.renderOrder = 2;
    this._curveGroup.add(errorCurtainMesh);

    // 3. Toggleable Amber 3D Control Effort Ribbon u(t) on depth plane z = EFFORT_Z
    const effortTubeGeo = createSafeTubeGeometry(effortPts, 220, 0.028, 10);
    const effortTubeMesh = new THREE.Mesh(effortTubeGeo, this._matEffortTube);
    this._effortGroup.add(effortTubeMesh);

    const effortCurtainGeo = createEffortCurtainGeometry(
      effortCurtainPts,
      EFFORT_ZERO_Y,
      EFFORT_Z
    );
    const effortCurtainMesh = new THREE.Mesh(effortCurtainGeo, this._matEffortCurtain);
    effortCurtainMesh.renderOrder = 1;
    this._effortGroup.add(effortCurtainMesh);

    // Subtle Violet integral effort component filament u_I(t) when Ki > 0
    if (this.ki > 0.01) {
      const intTubeGeo = createSafeTubeGeometry(integralPts, 180, 0.014, 8);
      const intTubeMesh = new THREE.Mesh(intTubeGeo, this._matIntegralTube);
      this._effortGroup.add(intTubeMesh);
    }

    this._effortGroup.visible = this.showEffort;
    if (this._effortFrameGroup) this._effortFrameGroup.visible = this.showEffort;
    if (this._effortDeckLane) this._effortDeckLane.visible = this.showEffort;

    // Reposition Coral disturbance impact arrow onto exact curve height at t = 3.5s
    if (this._distCurveArrowGroup) {
      const distSample = this._sampleAtTime(DISTURBANCE_TIME);
      this._distCurveArrowGroup.position.set(0, this._yToWorldY(distSample.y) + 0.04, 0);
    }
    if (this._disturbanceGroup) {
      this._disturbanceGroup.visible = this.disturbance;
    }
  }

  // --------------------------------------------------------------------------
  // Live Interactive Probe & Physical Servo Actuator Rig Sync
  // --------------------------------------------------------------------------

  _updateLiveVisuals() {
    const s = this._sampleAtTime(this.t);
    const wx = this._tToWorldX(s.t);
    const wy = this._yToWorldY(s.y);
    const uy = this._uToWorldY(s.u);
    const y0 = this._yToWorldY(0);
    const y1 = this._yToWorldY(SETPOINT);

    const isUnstable = this._sim && this._sim.stability === 'UNSTABLE';
    const absErr = Math.abs(s.e);

    // 1. Live Probe Sphere on (t, y(t), 0)
    if (this._probeSphere) {
      this._probeSphere.position.set(wx, wy, 0);
      if (this._matProbeCore) {
        if (isUnstable && Math.abs(s.y) > 2.0) {
          this._matProbeCore.color.setHex(COLORS.coralLight);
          this._matProbeCore.emissive.setHex(COLORS.coral);
        } else if (absErr <= 0.025) {
          this._matProbeCore.color.setHex(COLORS.emeraldLight);
          this._matProbeCore.emissive.setHex(COLORS.emerald);
        } else {
          this._matProbeCore.color.setHex(COLORS.cyanLight);
          this._matProbeCore.emissive.setHex(COLORS.cyan);
        }
      }
    }

    // 2. Live Error Drop-Line from (t, y(t), 0) -> Setpoint (t, 1.0, 0)
    if (this._setpointAnchorRing) {
      this._setpointAnchorRing.position.set(wx, y1, 0);
    }
    if (this._errorDropLine) {
      if (Math.abs(wy - y1) > 0.03) {
        alignCylinderBetween(
          this._errorDropLine,
          new THREE.Vector3(wx, y1, 0),
          new THREE.Vector3(wx, wy, 0),
          0.015
        );
        if (this._matErrorLine) {
          if (isUnstable && absErr > 0.8) {
            this._matErrorLine.color.setHex(COLORS.coralLight);
            this._matErrorLine.emissive.setHex(COLORS.coral);
          } else if (s.y > SETPOINT + 0.02) {
            this._matErrorLine.color.setHex(COLORS.amberLight);
            this._matErrorLine.emissive.setHex(COLORS.amber);
          } else if (absErr <= 0.025) {
            this._matErrorLine.color.setHex(COLORS.emeraldLight);
            this._matErrorLine.emissive.setHex(COLORS.emerald);
          } else {
            this._matErrorLine.color.setHex(COLORS.violetLight);
            this._matErrorLine.emissive.setHex(COLORS.violet);
          }
        }
      } else {
        this._errorDropLine.visible = false;
      }
    }

    // 3. Base Time Ring & Stem on t-axis
    if (this._baseTimeRing) {
      this._baseTimeRing.position.set(wx, y0, 0);
    }
    if (this._timeAxisStem) {
      if (Math.abs(wy - y0) > 0.04) {
        alignCylinderBetween(
          this._timeAxisStem,
          new THREE.Vector3(wx, y0, 0),
          new THREE.Vector3(wx, wy, 0),
          0.008
        );
      } else {
        this._timeAxisStem.visible = false;
      }
    }

    // 4. Effort Probe Bead & Depth Connector (visible when showEffort === true)
    if (this._effortProbeBead && this._effortDepthLink) {
      this._effortProbeBead.visible = this.showEffort;
      if (this.showEffort) {
        this._effortProbeBead.position.set(wx, uy, EFFORT_Z);
        alignCylinderBetween(
          this._effortDepthLink,
          new THREE.Vector3(wx, wy, 0),
          new THREE.Vector3(wx, uy, EFFORT_Z),
          0.008
        );
      } else {
        this._effortDepthLink.visible = false;
      }
    }

    // 5. 3D Physical Mechatronics Servo Actuator / Gimbal Carriage Rig
    if (this._carriage) {
      const carriageMinY = RIG_BASE_TOP_Y + RIG_CARRIAGE_HALF_H + 0.24;
      const carriageMaxY = RIG_TOP_PLATE_Y - RIG_CARRIAGE_HALF_H - 0.26;
      const carriageY = clamp(wy, carriageMinY, carriageMaxY);
      this._carriage.position.set(RIG_CARRIAGE_LOCAL_X, carriageY, 0);

      // Rotate top servo rotor smoothly proportional to position y(t)
      if (this._servoRotor) {
        this._servoRotor.rotation.y = s.y * Math.PI * 1.4;
      }

      // Tilt articulated gimbal arm proportionally to velocity yd / thrust
      if (this._gimbalArm) {
        const tilt = clamp(s.yd * 0.22 + (s.y - SETPOINT) * 0.18, -0.72, 0.72);
        this._gimbalArm.rotation.z = tilt;
      }

      // Update carriage status LED color
      if (this._matCarriageLed) {
        if (isUnstable || Math.abs(s.u) >= ACTUATOR_LIMIT * 0.96) {
          this._matCarriageLed.color.setHex(COLORS.coralLight);
          this._matCarriageLed.emissive.setHex(COLORS.coral);
        } else if (s.y > SETPOINT + 0.04) {
          this._matCarriageLed.color.setHex(COLORS.amberLight);
          this._matCarriageLed.emissive.setHex(COLORS.amber);
        } else if (absErr <= 0.025 && Math.abs(s.yd) < 0.08) {
          this._matCarriageLed.color.setHex(COLORS.emeraldLight);
          this._matCarriageLed.emissive.setHex(COLORS.emerald);
        } else {
          this._matCarriageLed.color.setHex(COLORS.cyanLight);
          this._matCarriageLed.emissive.setHex(COLORS.cyan);
        }
      }

      // Update Violet Integral Accumulator Ring glow proportional to |uI|
      if (this._matIntegralRing) {
        const intNorm = clamp(Math.abs(s.uI) / 6.0, 0, 1);
        this._matIntegralRing.emissiveIntensity = 0.25 + intNorm * 1.65;
      }

      // 6. Glowing Amber Actuator Thrust / Torque Vector Arrow proportional to u(t)
      if (this._thrustArrowGroup && this._thrustShaft && this._thrustHead) {
        const uNorm = clamp(s.u / ACTUATOR_LIMIT, -1, 1);
        const arrowLen = Math.abs(uNorm) * 1.15;
        if (arrowLen > 0.04) {
          this._thrustArrowGroup.visible = true;
          const sign = uNorm >= 0 ? 1 : -1;
          const arrowX = RIG_CARRIAGE_LOCAL_X + 0.54;
          const baseY = carriageY + sign * 0.06;
          const shaftLen = Math.max(arrowLen - 0.16, 0.04);
          const tipBaseY = baseY + sign * shaftLen;

          alignCylinderBetween(
            this._thrustShaft,
            new THREE.Vector3(arrowX, baseY, 0.04),
            new THREE.Vector3(arrowX, tipBaseY, 0.04),
            0.028
          );

          this._thrustHead.position.set(arrowX, tipBaseY + sign * 0.09, 0.04);
          this._thrustHead.rotation.x = sign >= 0 ? 0 : Math.PI;
          this._thrustHead.scale.set(0.078, 0.18, 0.078);

          // Tint toward Coral when actuator is saturating
          const sat = Math.abs(uNorm) > 0.94;
          this._matAmberGlow.color.setHex(sat ? COLORS.coralLight : COLORS.amberLight);
          this._matAmberGlow.emissive.setHex(sat ? COLORS.coral : COLORS.amber);
          this._matAmberGlow.emissiveIntensity = sat ? 1.8 : 1.3 + Math.abs(uNorm) * 0.45;
        } else {
          this._thrustArrowGroup.visible = false;
        }
      }

      // 7. Glowing Coral Load Disturbance Arrow above carriage when active (t >= 3.5)
      if (this._rigDistArrowGroup) {
        const distActive = this.disturbance && s.t >= DISTURBANCE_TIME - 1e-4;
        this._rigDistArrowGroup.visible = distActive;
        if (distActive) {
          this._rigDistArrowGroup.position.set(
            RIG_CARRIAGE_LOCAL_X,
            carriageY + RIG_CARRIAGE_HALF_H + 0.08,
            0.02
          );
        }
      }

      // 8. Telemetry Laser Link from live Probe -> Carriage Receiver Port
      if (this._laserLink) {
        const startLocal = new THREE.Vector3(wx - RIG_X, wy, 0);
        const endLocal = new THREE.Vector3(RIG_CARRIAGE_LOCAL_X - 0.37, carriageY, 0);
        alignCylinderBetween(
          this._laserLink,
          startLocal,
          endLocal,
          this.mechatronicsLens ? 0.012 : 0.0085
        );
        if (this._matLaserLink) {
          this._matLaserLink.opacity = this.mechatronicsLens ? 0.65 : 0.42;
        }
      }

      // 9. Mechatronics Lens Extra Highlights: Torque Collar + Error Caliper
      if (this._lensHighlightsGroup) {
        this._lensHighlightsGroup.visible = this.mechatronicsLens;
        if (this.mechatronicsLens) {
          const calX = RIG_CARRIAGE_LOCAL_X - 0.48;
          if (this._caliperBotJaw) {
            this._caliperBotJaw.position.set(calX, carriageY, 0.14);
          }
          if (this._caliperTopJaw) {
            this._caliperTopJaw.position.set(calX, y1, 0.14);
          }
          if (this._caliperStem) {
            if (Math.abs(carriageY - y1) > 0.03) {
              alignCylinderBetween(
                this._caliperStem,
                new THREE.Vector3(calX - 0.05, y1, 0.14),
                new THREE.Vector3(calX - 0.05, carriageY, 0.14),
                0.013
              );
            } else {
              this._caliperStem.visible = false;
            }
          }
          if (this._matTorqueCollar) {
            const effortFrac = clamp(Math.abs(s.u) / ACTUATOR_LIMIT, 0, 1);
            this._matTorqueCollar.emissiveIntensity = 1.15 + effortFrac * 1.1;
          }
        }
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
          pos: new THREE.Vector3(0.15, 0.22, 12.1),
          target: new THREE.Vector3(0.15, 0.22, 0),
        };
      case 'iso':
        return {
          pos: new THREE.Vector3(5.6, 4.55, 8.6),
          target: new THREE.Vector3(0.12, 0.08, -0.15),
        };
      case '3d':
      default:
        return {
          pos: new THREE.Vector3(1.85, 2.05, 10.65),
          target: new THREE.Vector3(0.12, 0.15, -0.15),
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
    if (!PID_PRESETS[presetId]) return this.getTelemetry();
    this._cancelSweepAnimation();

    this.presetId = presetId;
    const preset = PID_PRESETS[presetId];
    this.kp = preset.defaultKp;
    this.ki = preset.defaultKi;
    this.kd = preset.defaultKd;
    this.disturbance = preset.defaultDisturbance;

    this._runSimulation();
    if (this._initialized) {
      this._rebuildCurves();
      this._updateLiveVisuals();
    }

    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  setGains({ kp, ki, kd } = {}) {
    let changed = false;
    if (Number.isFinite(kp)) {
      this.kp = clamp(kp, KP_MIN, KP_MAX);
      changed = true;
    }
    if (Number.isFinite(ki)) {
      this.ki = clamp(ki, KI_MIN, KI_MAX);
      changed = true;
    }
    if (Number.isFinite(kd)) {
      this.kd = clamp(kd, KD_MIN, KD_MAX);
      changed = true;
    }
    if (!changed) return this.getTelemetry();

    this._runSimulation();
    if (this._initialized) {
      this._rebuildCurves();
      this._updateLiveVisuals();
    }

    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  setDisturbance(bool) {
    this.disturbance = Boolean(bool);
    this._runSimulation();
    if (this._initialized) {
      this._rebuildCurves();
      this._updateLiveVisuals();
    }

    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  toggleEffort(bool) {
    this.showEffort = Boolean(bool);
    if (this._effortGroup) this._effortGroup.visible = this.showEffort;
    if (this._effortFrameGroup) this._effortFrameGroup.visible = this.showEffort;
    if (this._effortDeckLane) this._effortDeckLane.visible = this.showEffort;
    if (this._initialized) {
      this._updateLiveVisuals();
    }

    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  toggleMechatronicsLens(bool) {
    this.mechatronicsLens = Boolean(bool);
    if (this._lensHighlightsGroup) {
      this._lensHighlightsGroup.visible = this.mechatronicsLens;
    }
    if (this._initialized) {
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
      duration: 760,
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
      duration: 2600,
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
    const preset = this._getPreset();
    const sim = this._sim || simulatePIDStep({
      presetId: this.presetId,
      kp: this.kp,
      ki: this.ki,
      kd: this.kd,
      disturbance: this.disturbance,
      tMax: this.tMax,
    });
    const sample = this._sampleAtTime(this.t);

    return {
      presetId: this.presetId,
      label: preset.label,
      mechatronicsLabel: preset.mechatronicsLabel,
      kp: this.kp,
      ki: this.ki,
      kd: this.kd,
      disturbance: this.disturbance,
      showEffort: this.showEffort,
      mechatronicsLens: this.mechatronicsLens,
      t: this.t,
      yt: sample.y,
      ut: sample.u,
      overshootPct: sim.overshootPct,
      settlingTime: sim.settlingTime,
      riseTime: sim.riseTime,
      steadyStateError: sim.steadyStateError,
      stability: sim.stability,
      maxEffort: sim.maxEffort,
      controllerLatex: sim.controllerLatex,
      plantLatex: sim.plantLatex,
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
    const elapsed = this._clock ? this._clock.getElapsedTime() : 0;

    // 1. Live closed-loop step sweep (t: 0 -> 8s over ~2.6s)
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

    // 2. Smooth cubic ease-out camera preset transition
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

    // 3. Living Spline micro-animations
    if (this._probeHalo) {
      this._probeHalo.rotation.z = -elapsed * 1.15;
      this._probeHalo.rotation.x = Math.cos(elapsed * 1.55) * 0.42;
      this._probeHalo.scale.setScalar(1 + Math.sin(elapsed * 3.1) * 0.075);
    }

    if (this._plinthRimMat) {
      const baseIntensity = this._sim && this._sim.stability === 'UNSTABLE' ? 1.45 : 1.18;
      this._plinthRimMat.emissiveIntensity = baseIntensity + Math.sin(elapsed * 2.0) * 0.14;
    }

    if (this.disturbance && this._distShockRing) {
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 5.2);
      this._distShockRing.scale.setScalar(0.88 + pulse * 0.34);
      if (this._matDistGatePlane) {
        const hitBoost = this.t >= DISTURBANCE_TIME ? 0.08 : 0.0;
        this._matDistGatePlane.opacity = 0.08 + hitBoost + pulse * 0.04;
      }
    }

    if (this._rigDistArrowGroup && this._rigDistArrowGroup.visible && this._matRigDistArrow) {
      this._matRigDistArrow.emissiveIntensity = 1.5 + Math.sin(elapsed * 9.0) * 0.45;
    }

    if (this.mechatronicsLens && this._torqueCollarRing) {
      this._torqueCollarRing.rotation.z = elapsed * 1.4;
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

    this.scene = null;
    this.camera = null;
    this.container = null;
  }
}
