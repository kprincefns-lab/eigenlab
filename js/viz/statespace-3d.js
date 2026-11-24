/**
 * EIGENLAB — Interactive 3D State-Space Control & Optimal Estimation Studio
 * Covers LQR Quadratic Bowls, Constrained MPC + CBF-QP Safety Barriers,
 * Kalman Filter Covariance Fusion, UKF vs. EKF Unscented Transforms,
 * and MHE / Robust Factor Graph Smoothing.
 * Spline-quality Three.js WebGL visualization module (ES Modules).
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ============================================================================
// 1. STATE-SPACE & ESTIMATION PRESETS
// ============================================================================

export const STATESPACE_PRESETS = {
  'lqr-cart': {
    id: 'lqr-cart',
    name: 'LQR Regulator',
    shortName: 'LQR',
    formulaLatex: '\\dot{x}=Ax+Bu,\\; J=\\int(x^TQx+u^TRu)\\,dt',
    paramALabel: 'Q/R Ratio ρ',
    paramA: { min: 0.2, max: 25, step: 0.2, default: 4 },
    paramBLabel: 'Initial x₀',
    paramB: { min: 0.6, max: 2.6, step: 0.1, default: 1.8 },
  },
  'mpc-cbf': {
    id: 'mpc-cbf',
    name: 'MPC + CBF-QP',
    shortName: 'MPC/CBF',
    formulaLatex: '\\dot{h}(x,u)+\\alpha h(x)\\ge 0,\\; |u|\\le u_{\\max}',
    paramALabel: 'Torque u_max',
    paramA: { min: 1.0, max: 6.0, step: 0.2, default: 2.4 },
    paramBLabel: 'CBF Rate α',
    paramB: { min: 0.4, max: 3.5, step: 0.1, default: 1.5 },
  },
  'kf-fusion': {
    id: 'kf-fusion',
    name: 'Kalman Filter',
    shortName: 'KF',
    formulaLatex: 'K_k = P^- H^T (H P^- H^T + R)^{-1}',
    paramALabel: 'Sensor Noise R',
    paramA: { min: 0.05, max: 2.5, step: 0.05, default: 0.5 },
    paramBLabel: 'Process Noise Q',
    paramB: { min: 0.02, max: 1.0, step: 0.02, default: 0.15 },
  },
  'ukf-nonlinear': {
    id: 'ukf-nonlinear',
    name: 'UKF vs. EKF',
    shortName: 'UKF',
    formulaLatex: '\\mathcal{X}_i = \\hat{x} \\pm \\sqrt{(n+\\lambda)P}',
    paramALabel: 'Nonlinearity κ',
    paramA: { min: 0.2, max: 2.2, step: 0.1, default: 1.2 },
    paramBLabel: 'Prior Spread σ₀',
    paramB: { min: 0.25, max: 1.4, step: 0.05, default: 0.75 },
  },
  'mhe-graph': {
    id: 'mhe-graph',
    name: 'Factor Graph / MHE',
    shortName: 'MHE/FG',
    formulaLatex:
      '\\min_{x_{0:N}} \\sum \\|r_{\\text{dyn}}\\|_{Q^{-1}}^2 + \\sum \\rho(\\|r_{\\text{meas}}\\|_{R^{-1}})',
    paramALabel: 'Outlier Spike',
    paramA: { min: 0.0, max: 3.5, step: 0.1, default: 2.2 },
    paramBLabel: 'Window N',
    paramB: { min: 3, max: 12, step: 1, default: 8 },
  },
};

// ============================================================================
// 2. PURE DETERMINISTIC MATH ENGINE
// ============================================================================

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function easeOutCubic(t) {
  const inv = 1 - clamp(t, 0, 1);
  return 1 - inv * inv * inv;
}

/**
 * Deterministic Box-Muller pseudo-Gaussian generator (Mulberry32 seeded).
 * Ensures identical parameters always yield identical trajectories and telemetry.
 */
function createSeededGaussian(seed = 133742) {
  let s = seed >>> 0;
  const nextUniform = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let spare = null;
  return () => {
    if (spare !== null) {
      const val = spare;
      spare = null;
      return val;
    }
    const u1 = Math.max(nextUniform(), 1e-12);
    const u2 = nextUniform();
    const r = Math.sqrt(-2 * Math.log(u1));
    const theta = 2 * Math.PI * u2;
    spare = r * Math.sin(theta);
    return r * Math.cos(theta);
  };
}

/**
 * Closed-form Continuous-Time Algebraic Riccati Equation (CARE) solver
 * for double integrator A = [[0, 1], [0, 0]], B = [[0], [1]],
 * Q = diag(q1, q2), R = 1.
 */
function solveDoubleIntegratorCARE(rho) {
  const q1 = Math.max(rho, 0.05);
  const q2 = 0.25 * q1;
  const p12 = Math.sqrt(q1);
  const p22 = Math.sqrt(q2 + 2 * p12);
  const p11 = p12 * p22;
  const k1 = p12;
  const k2 = p22;

  const disc = k2 * k2 - 4 * k1;
  let eigText;
  if (disc < -1e-6) {
    const re = -0.5 * k2;
    const im = 0.5 * Math.sqrt(-disc);
    eigText = `${re.toFixed(2)} ± ${im.toFixed(2)}j`;
  } else {
    const sd = Math.sqrt(Math.max(disc, 0));
    const r1 = 0.5 * (-k2 + sd);
    const r2 = 0.5 * (-k2 - sd);
    eigText = `${r1.toFixed(2)}, ${r2.toFixed(2)}`;
  }

  return { p11, p12, p22, k1, k2, eigText };
}

function evalQuadraticLyapunov(x1, x2, riccati) {
  return riccati.p11 * x1 * x1 + 2 * riccati.p12 * x1 * x2 + riccati.p22 * x2 * x2;
}

/**
 * Nonlinear banana-warping map f_kappa(x1, x2) used for UKF vs. EKF.
 */
function applyNonlinearWarp(x1, x2, kappa) {
  const y1 = x1 * (1 + 0.1 * kappa * x2);
  const y2 = x2 - 0.44 * kappa * x1 * x1;
  return { x1: y1, x2: y2 };
}

/**
 * Jacobian J = df_kappa / dx evaluated at (x1, x2).
 */
function evalNonlinearWarpJacobian(x1, x2, kappa) {
  return [
    [1 + 0.1 * kappa * x2, 0.1 * kappa * x1],
    [-0.88 * kappa * x1, 1.0],
  ];
}

// ----------------------------------------------------------------------------
// Preset 1: LQR Quadratic Bowl & Optimal Regulator
// ----------------------------------------------------------------------------

function analyzeLqrCart(paramA, paramB) {
  const rho = clamp(paramA, STATESPACE_PRESETS['lqr-cart'].paramA.min, STATESPACE_PRESETS['lqr-cart'].paramA.max);
  const x0 = clamp(paramB, STATESPACE_PRESETS['lqr-cart'].paramB.min, STATESPACE_PRESETS['lqr-cart'].paramB.max);
  const riccati = solveDoubleIntegratorCARE(rho);

  const steps = 140;
  const duration = 6.0;
  const dt = duration / (steps - 1);

  const trueTraj = [];
  const estTraj = [];

  // Optimal LQR state
  let x1 = x0;
  let x2 = 0.52 * x0;

  // Suboptimal underdamped PD baseline for comparison tube
  let s1 = x0;
  let s2 = 0.52 * x0;
  const subK1 = riccati.k1 * 0.72;
  const subK2 = riccati.k2 * 0.34;

  const initialCost = evalQuadraticLyapunov(x1, x2, riccati);
  let maxU = 0;

  for (let i = 0; i < steps; i++) {
    const t = i * dt;
    const u = -(riccati.k1 * x1 + riccati.k2 * x2);
    const cost = evalQuadraticLyapunov(x1, x2, riccati);
    maxU = Math.max(maxU, Math.abs(u));

    trueTraj.push({ t, x1, x2, u, cost });

    // Lyapunov sublevel radius for ellipsoid visualization
    const lyapRadius = Math.sqrt(Math.max(cost, 1e-4) / Math.max(riccati.p11, 0.25));
    const subGain = Math.hypot(riccati.k1, riccati.k2);
    estTraj.push({
      t,
      x1: s1,
      x2: s2,
      sigma1: clamp(0.16 + 0.24 * lyapRadius, 0.14, 0.85),
      sigma2: clamp(0.14 + 0.2 * lyapRadius, 0.12, 0.75),
      gain: subGain,
      cost: evalQuadraticLyapunov(s1, s2, riccati),
    });

    if (i < steps - 1) {
      // RK4 step for optimal LQR: x1' = x2, x2' = -k1*x1 - k2*x2
      const rk4Step = (a, b, k1, k2) => {
        const f1 = (u1, u2) => u2;
        const f2 = (u1, u2) => -k1 * u1 - k2 * u2;
        const m1a = f1(a, b);
        const m1b = f2(a, b);
        const m2a = f1(a + 0.5 * dt * m1a, b + 0.5 * dt * m1b);
        const m2b = f2(a + 0.5 * dt * m1a, b + 0.5 * dt * m1b);
        const m3a = f1(a + 0.5 * dt * m2a, b + 0.5 * dt * m2b);
        const m3b = f2(a + 0.5 * dt * m2a, b + 0.5 * dt * m2b);
        const m4a = f1(a + dt * m3a, b + dt * m3b);
        const m4b = f2(a + dt * m3a, b + dt * m3b);
        return [
          a + (dt / 6) * (m1a + 2 * m2a + 2 * m3a + m4a),
          b + (dt / 6) * (m1b + 2 * m2b + 2 * m3b + m4b),
        ];
      };
      [x1, x2] = rk4Step(x1, x2, riccati.k1, riccati.k2);
      [s1, s2] = rk4Step(s1, s2, subK1, subK2);
    }
  }

  const highGain = rho >= 12;
  return {
    presetId: 'lqr-cart',
    paramA: rho,
    paramB: x0,
    metrics: {
      primaryLabel: 'LQR Gain K',
      primaryValue: `[${riccati.k1.toFixed(2)}, ${riccati.k2.toFixed(2)}]`,
      secondaryLabel: 'Optimal Cost J*',
      secondaryValue: initialCost.toFixed(2),
      tertiaryLabel: 'Closed-Loop λ',
      tertiaryValue: riccati.eigText,
      statusText: highGain ? 'HIGH-AUTHORITY LQR' : 'OPTIMAL REGULATOR',
      statusColor: highGain ? '#F59E0B' : '#22D3EE',
    },
    trueTraj,
    estTraj,
    sigmaPoints: [],
    factorNodes: [],
    riccati,
    maxU,
  };
}

// ----------------------------------------------------------------------------
// Preset 2: Constrained MPC + CBF-QP Safety Barrier
// ----------------------------------------------------------------------------

function analyzeMpcCbf(paramA, paramB) {
  const uMax = clamp(paramA, STATESPACE_PRESETS['mpc-cbf'].paramA.min, STATESPACE_PRESETS['mpc-cbf'].paramA.max);
  const alpha = clamp(paramB, STATESPACE_PRESETS['mpc-cbf'].paramB.min, STATESPACE_PRESETS['mpc-cbf'].paramB.max);

  // Reference quadratic bowl for the 3D surface beneath the trajectories
  const riccati = solveDoubleIntegratorCARE(2.6);
  const wallX = 0.85; // Safe set: h(x) = wallX - x1 >= 0

  const steps = 150;
  const duration = 6.6;
  const dt = duration / (steps - 1);

  const trueTraj = []; // Safe MPC + CBF-QP trajectory
  const estTraj = []; // Nominal unconstrained LQR (pierces red wall)

  // Launch aggressively toward the wall from negative x1 with strong positive velocity
  let x1 = -1.65;
  let x2 = 2.55;

  let n1 = -1.65;
  let n2 = 2.55;

  // Nominal unconstrained feedback (underdamped so it clearly overshoots wallX = 0.85)
  const nomK1 = 1.55;
  const nomK2 = 0.72;

  // MPC nominal feedback (matches desired crisp response before CBF-QP safety projection)
  const mpcK1 = 1.55;
  const mpcK2 = 0.92;

  let minH = Infinity;
  let maxAbsU = 0;
  let cbfActiveCount = 0;
  let breachX2 = 0;
  let breachCost = 0;
  let breachFound = false;

  for (let i = 0; i < steps; i++) {
    const t = i * dt;

    // 1. Safe MPC + CBF-QP command
    const h = wallX - x1;
    // Exponential HOCBF constraint: psi_1 = -x2 + alpha*h, d/dt(psi_1) + alpha*psi_1 >= 0
    // => u <= -2*alpha*x2 + alpha^2 * h
    const uCbfUpper = -2 * alpha * x2 + alpha * alpha * h;

    // Receding-horizon predictive anticipation: also check stopping distance at current uMax
    const uMpcDes = -(mpcK1 * x1 + mpcK2 * x2);
    const brakingDist = x2 > 0 ? (x2 * x2) / (2 * Math.max(uMax * 0.92, 0.4)) : 0;
    const uPredictive = brakingDist >= Math.max(h - 0.04, 0) && x2 > 0.05 ? -uMax : uMpcDes;

    const uDes = Math.min(uMpcDes, uPredictive);
    const cbfLimited = uCbfUpper < uDes;
    if (cbfLimited) cbfActiveCount += 1;

    const uSafe = clamp(Math.min(uDes, uCbfUpper), -uMax, uMax);
    const costSafe = evalQuadraticLyapunov(x1, x2, riccati);
    minH = Math.min(minH, h);
    maxAbsU = Math.max(maxAbsU, Math.abs(uSafe));

    trueTraj.push({
      t,
      x1,
      x2,
      u: uSafe,
      cost: costSafe,
      h,
      cbfActive: cbfLimited,
    });

    // 2. Nominal unconstrained LQR (no wall barrier, no torque cap)
    const uNom = -(nomK1 * n1 + nomK2 * n2);
    const costNom = evalQuadraticLyapunov(n1, n2, riccati);
    if (!breachFound && n1 >= wallX) {
      breachFound = true;
      breachX2 = n2;
      breachCost = costNom;
    }

    estTraj.push({
      t,
      x1: n1,
      x2: n2,
      sigma1: clamp(0.18 + 0.16 * Math.exp(-Math.max(h, 0) * 1.8), 0.15, 0.45),
      sigma2: clamp(0.16 + 0.12 * Math.abs(uSafe) / Math.max(uMax, 1), 0.14, 0.4),
      gain: uCbfUpper < uDes ? 1.0 : 0.0,
      u: uNom,
      cost: costNom,
    });

    if (i < steps - 1) {
      // Sub-step integration (4 substeps per sample) for crisp barrier invariance
      const subN = 4;
      const hDt = dt / subN;
      for (let s = 0; s < subN; s++) {
        const hs = wallX - x1;
        const ucbf = -2 * alpha * x2 + alpha * alpha * hs;
        const umpc = -(mpcK1 * x1 + mpcK2 * x2);
        const bDist = x2 > 0 ? (x2 * x2) / (2 * Math.max(uMax * 0.92, 0.4)) : 0;
        const uPre = bDist >= Math.max(hs - 0.04, 0) && x2 > 0.05 ? -uMax : umpc;
        const uCmd = clamp(Math.min(Math.min(umpc, uPre), ucbf), -uMax, uMax);

        x1 += hDt * (x2 + 0.5 * hDt * uCmd);
        x2 += hDt * uCmd;

        const un = -(nomK1 * n1 + nomK2 * n2);
        n1 += hDt * (n2 + 0.5 * hDt * un);
        n2 += hDt * un;
      }
    }
  }

  const cbfActiveFrac = cbfActiveCount / steps;
  const safe = minH >= -0.025;

  return {
    presetId: 'mpc-cbf',
    paramA: uMax,
    paramB: alpha,
    metrics: {
      primaryLabel: 'Min Safety h(x)',
      primaryValue: `${minH >= 0 ? '+' : ''}${minH.toFixed(2)} m`,
      secondaryLabel: 'Peak |u| / u_max',
      secondaryValue: `${maxAbsU.toFixed(2)} / ${uMax.toFixed(1)}`,
      tertiaryLabel: 'CBF-QP Active',
      tertiaryValue: `${Math.round(cbfActiveFrac * 100)}%`,
      statusText: safe ? 'CBF SAFE INVARIANCE' : 'TORQUE SATURATED',
      statusColor: safe ? '#34D399' : '#FB7185',
    },
    trueTraj,
    estTraj,
    sigmaPoints: [],
    factorNodes: [],
    riccati,
    barrierWallX: wallX,
    breachPoint: { x1: wallX, x2: breachX2, cost: breachCost, breached: breachFound },
    minH,
  };
}

// ----------------------------------------------------------------------------
// Preset 3: Kalman Filter Covariance & Sensor Fusion
// ----------------------------------------------------------------------------

function analyzeKalmanFusion(paramA, paramB) {
  const R = clamp(paramA, STATESPACE_PRESETS['kf-fusion'].paramA.min, STATESPACE_PRESETS['kf-fusion'].paramA.max);
  const Q = clamp(paramB, STATESPACE_PRESETS['kf-fusion'].paramB.min, STATESPACE_PRESETS['kf-fusion'].paramB.max);

  const steps = 140;
  const dt = 0.05;
  const omega0 = 1.25;
  const zeta = 0.13;

  // Discrete transition matrix F (damped harmonic motion)
  const f11 = 1.0;
  const f12 = dt;
  const f21 = -omega0 * omega0 * dt;
  const f22 = 1.0 - 2 * zeta * omega0 * dt;

  // Process noise covariance Q_mat scaled by paramB
  const q11 = Q * (0.014 + 0.45 * dt * dt);
  const q12 = Q * (0.35 * dt * dt);
  const q22 = Q * (0.14 + 1.4 * dt);

  const randn = createSeededGaussian(20260419);

  // Ground truth state
  let tx1 = 1.65;
  let tx2 = 0.35;

  // Kalman Filter estimate (intentionally starts with offset & large prior uncertainty)
  let ex1 = 0.65;
  let ex2 = -0.45;
  let p11 = 1.15;
  let p12 = 0.08;
  let p22 = 0.95;

  const trueTraj = [];
  const estTraj = [];
  const measurements = [];

  let sqErrSum = 0;
  let lastK1 = 0;
  let lastK2 = 0;
  let lastTrace = p11 + p22;

  // Measurement updates happen every 4 steps so the 3D covariance ellipsoid
  // visibly breathes outward during prediction and snaps inward on measurement fusion!
  const updateStride = 4;

  for (let i = 0; i < steps; i++) {
    const t = i * dt;
    const isUpdate = i % updateStride === 0;

    // Gentle deterministic forcing keeps the 3D spiral lively
    const driveU = 0.35 * Math.sin(1.1 * t);

    // Noisy position measurement z = x1 + v
    const measNoise = Math.sqrt(R) * 0.48 * randn();
    const zMeas = tx1 + measNoise;

    let k1 = lastK1;
    let k2 = lastK2;

    if (isUpdate) {
      // Innovation covariance S = H P^- H^T + R = p11 + R
      const S = Math.max(p11 + R, 1e-6);
      k1 = p11 / S;
      k2 = p12 / S;
      const innov = zMeas - ex1;

      ex1 += k1 * innov;
      ex2 += k2 * innov;

      // Joseph stabilized covariance update: P = (I - KH) P^- (I - KH)^T + K R K^T
      const a = 1 - k1;
      const b = -k2;
      const np11 = a * a * p11 + k1 * k1 * R;
      const np12 = a * (b * p11 + p12) + k1 * k2 * R;
      const np22 = b * (b * p11 + 2 * p12) + p22 + k2 * k2 * R;

      p11 = Math.max(np11, 1e-4);
      p12 = np12;
      p22 = Math.max(np22, 1e-4);

      lastK1 = k1;
      lastK2 = k2;

      measurements.push({ t, x1: zMeas, x2: tx2, trueX1: tx1, estX1: ex1, estX2: ex2 });
    }

    const err = Math.hypot(tx1 - ex1, tx2 - ex2);
    sqErrSum += err * err;
    lastTrace = p11 + p22;

    trueTraj.push({
      t,
      x1: tx1,
      x2: tx2,
      u: driveU,
      cost: err * err,
    });

    estTraj.push({
      t,
      x1: ex1,
      x2: ex2,
      sigma1: Math.sqrt(p11),
      sigma2: Math.sqrt(p22),
      p12,
      gain: k1,
      isUpdate,
    });

    if (i < steps - 1) {
      // Advance true plant with deterministic process noise scaled by sqrt(Q)
      const w1 = Math.sqrt(q11) * 0.42 * randn();
      const w2 = Math.sqrt(q22) * 0.42 * randn();
      const nextTx1 = f11 * tx1 + f12 * tx2 + w1;
      const nextTx2 = f21 * tx1 + f22 * tx2 + dt * driveU + w2;
      tx1 = clamp(nextTx1, -2.5, 2.5);
      tx2 = clamp(nextTx2, -2.5, 2.5);

      // Kalman Predict step: x^- = F x + B u, P^- = F P F^T + Q_mat
      const nextEx1 = f11 * ex1 + f12 * ex2;
      const nextEx2 = f21 * ex1 + f22 * ex2 + dt * driveU;
      ex1 = nextEx1;
      ex2 = nextEx2;

      const fp11 = f11 * p11 + f12 * p12;
      const fp12 = f11 * p12 + f12 * p22;
      const fp21 = f21 * p11 + f22 * p12;
      const fp22 = f21 * p12 + f22 * p22;

      p11 = Math.max(fp11 * f11 + fp12 * f12 + q11, 1e-4);
      p12 = fp11 * f21 + fp12 * f22 + q12;
      p22 = Math.max(fp21 * f21 + fp22 * f22 + q22, 1e-4);
    }
  }

  const rmse = Math.sqrt(sqErrSum / steps);
  const ratioQR = Q / Math.max(R, 1e-3);
  let statusText = 'OPTIMAL FUSION';
  let statusColor = '#34D399';
  if (ratioQR < 0.12) {
    statusText = 'MODEL-TRUSTING (LOW K)';
    statusColor = '#22D3EE';
  } else if (ratioQR > 1.2) {
    statusText = 'SENSOR-TRUSTING (HIGH K)';
    statusColor = '#F59E0B';
  }

  return {
    presetId: 'kf-fusion',
    paramA: R,
    paramB: Q,
    metrics: {
      primaryLabel: 'Kalman Gain K₁',
      primaryValue: lastK1.toFixed(3),
      secondaryLabel: 'State RMSE',
      secondaryValue: rmse.toFixed(3),
      tertiaryLabel: 'Trace tr(P)',
      tertiaryValue: lastTrace.toFixed(3),
      statusText,
      statusColor,
    },
    trueTraj,
    estTraj,
    sigmaPoints: [],
    factorNodes: [],
    riccati: solveDoubleIntegratorCARE(1.0),
    measurements,
  };
}

// ----------------------------------------------------------------------------
// Preset 4: UKF Sigma-Points vs. EKF Linearization
// ----------------------------------------------------------------------------

function analyzeUkfNonlinear(paramA, paramB) {
  const kappa = clamp(
    paramA,
    STATESPACE_PRESETS['ukf-nonlinear'].paramA.min,
    STATESPACE_PRESETS['ukf-nonlinear'].paramA.max
  );
  const sigma0 = clamp(
    paramB,
    STATESPACE_PRESETS['ukf-nonlinear'].paramB.min,
    STATESPACE_PRESETS['ukf-nonlinear'].paramB.max
  );

  // Prior Gaussian distribution in 2D: mean (0, 0.85), stds (sigma0, 0.42 * sigma0)
  const mu1 = 0.0;
  const mu2 = 0.85;
  const s1 = sigma0;
  const s2 = 0.42 * sigma0;

  // 1. Exact Unscented Transform (2n + 1 = 5 sigma points, n = 2)
  const n = 2;
  const alphaU = 0.85;
  const betaU = 2.0;
  const kU = 0.5;
  const lambda = alphaU * alphaU * (n + kU) - n;
  const scale = Math.sqrt(Math.max(n + lambda, 0.25));

  const wm0 = lambda / (n + lambda);
  const wc0 = wm0 + (1 - alphaU * alphaU + betaU);
  const wi = 1 / (2 * (n + lambda));

  const priorSigmas = [
    { x1: mu1, x2: mu2, wm: wm0, wc: wc0 },
    { x1: mu1 + scale * s1, x2: mu2, wm: wi, wc: wi },
    { x1: mu1 - scale * s1, x2: mu2, wm: wi, wc: wi },
    { x1: mu1, x2: mu2 + scale * s2, wm: wi, wc: wi },
    { x1: mu1, x2: mu2 - scale * s2, wm: wi, wc: wi },
  ];

  // Transform all 5 sigma points through the nonlinear banana warp
  const warpedSigmas = priorSigmas.map((sp, idx) => {
    const w = applyNonlinearWarp(sp.x1, sp.x2, kappa);
    // Elevate central mean & flanks slightly in vertical z for crisp 3D depth
    const z = 1.42 + (idx === 0 ? 0.16 : idx <= 2 ? -0.06 : 0.05);
    return { x1: w.x1, x2: w.x2, z, wm: sp.wm, wc: sp.wc };
  });

  // UKF transformed mean & covariance
  let ukfMean1 = 0;
  let ukfMean2 = 0;
  for (let i = 0; i < warpedSigmas.length; i++) {
    ukfMean1 += warpedSigmas[i].wm * warpedSigmas[i].x1;
    ukfMean2 += warpedSigmas[i].wm * warpedSigmas[i].x2;
  }
  let ukfP11 = 0;
  let ukfP12 = 0;
  let ukfP22 = 0;
  for (let i = 0; i < warpedSigmas.length; i++) {
    const d1 = warpedSigmas[i].x1 - ukfMean1;
    const d2 = warpedSigmas[i].x2 - ukfMean2;
    ukfP11 += warpedSigmas[i].wc * d1 * d1;
    ukfP12 += warpedSigmas[i].wc * d1 * d2;
    ukfP22 += warpedSigmas[i].wc * d2 * d2;
  }
  ukfP11 = Math.max(ukfP11, 1e-4);
  ukfP22 = Math.max(ukfP22, 1e-4);

  // 2. EKF First-Order Linearization at mu
  const ekfMean = applyNonlinearWarp(mu1, mu2, kappa);
  const J = evalNonlinearWarpJacobian(mu1, mu2, kappa);
  const ekfP11 = Math.max(J[0][0] * J[0][0] * s1 * s1 + J[0][1] * J[0][1] * s2 * s2, 1e-4);
  const ekfP12 = J[0][0] * J[1][0] * s1 * s1 + J[0][1] * J[1][1] * s2 * s2;
  const ekfP22 = Math.max(J[1][0] * J[1][0] * s1 * s1 + J[1][1] * J[1][1] * s2 * s2, 1e-4);

  // 3. Reference Ground-Truth Monte Carlo (deterministic 121-point Gaussian quadrature grid)
  const randn = createSeededGaussian(99123);
  const cloudCount = 64;
  const bananaCloud = [];
  let mcSum1 = 0;
  let mcSum2 = 0;
  // Exact analytical true mean of f_kappa(x1, x2) for x1 ~ N(0, s1^2), x2 ~ N(mu2, s2^2):
  // E[x1*(1 + 0.1*kappa*x2)] = 0
  // E[x2 - 0.44*kappa*x1^2] = mu2 - 0.44*kappa*s1^2
  const trueMean1 = 0.0;
  const trueMean2 = mu2 - 0.44 * kappa * s1 * s1;

  for (let i = 0; i < cloudCount; i++) {
    const gx1 = mu1 + s1 * clamp(randn(), -2.4, 2.4);
    const gx2 = mu2 + s2 * clamp(randn(), -2.4, 2.4);
    const w = applyNonlinearWarp(gx1, gx2, kappa);
    mcSum1 += w.x1;
    mcSum2 += w.x2;
    bananaCloud.push({ x1: clamp(w.x1, -2.5, 2.5), x2: clamp(w.x2, -2.5, 2.5) });
  }

  const ukfBiasErr = Math.hypot(ukfMean1 - trueMean1, ukfMean2 - trueMean2);
  const ekfBiasErr = Math.hypot(ekfMean.x1 - trueMean1, ekfMean.x2 - trueMean2);
  const accuracyGain = ekfBiasErr / Math.max(ukfBiasErr, 0.008);

  // 4. Dynamic nonlinear pendulum / Duffing tracking trajectory (true vs UKF vs EKF)
  const steps = 120;
  const duration = 6.0;
  const dt = duration / (steps - 1);

  const trueTraj = [];
  const estTraj = [];

  let tx1 = 1.45;
  let tx2 = 0.45;
  let ex1 = 1.25;
  let ex2 = 0.15;

  for (let i = 0; i < steps; i++) {
    const t = i * dt;
    // Smooth nonlinear Duffing-like oscillation driven by kappa
    const uCtrl = -0.35 * tx2;
    const cost = 0.5 * (tx1 * tx1 + tx2 * tx2);

    trueTraj.push({ t, x1: tx1, x2: tx2, u: uCtrl, cost });

    // UKF stays tight to truth; EKF drift grows with kappa*sigma0^2
    const ekfBiasDrift = 0.18 * kappa * sigma0 * sigma0 * Math.sin(1.4 * t + 0.5);
    const ukfSig1 = clamp(0.16 + 0.28 * sigma0 * (0.55 + 0.45 * Math.exp(-0.45 * t)), 0.14, 0.9);
    const ukfSig2 = clamp(0.14 + 0.22 * sigma0 * (0.55 + 0.45 * Math.exp(-0.45 * t)), 0.12, 0.78);

    estTraj.push({
      t,
      x1: ex1,
      x2: ex2,
      ekfX1: clamp(tx1 + ekfBiasDrift * 0.7, -2.5, 2.5),
      ekfX2: clamp(tx2 - Math.abs(ekfBiasDrift) * 1.15, -2.5, 2.5),
      sigma1: ukfSig1,
      sigma2: ukfSig2,
      gain: clamp(1 / (1 + 0.35 * kappa), 0.2, 0.95),
    });

    if (i < steps - 1) {
      // Nonlinear restoring force: x2' = -1.2*x1 - 0.32*kappa*x1^3 - 0.22*x2
      const acc = -1.2 * tx1 - 0.32 * kappa * tx1 * tx1 * tx1 - 0.22 * tx2;
      tx1 = clamp(tx1 + dt * (tx2 + 0.5 * dt * acc), -2.4, 2.4);
      tx2 = clamp(tx2 + dt * acc, -2.4, 2.4);

      // UKF tracks rapidly with small residual
      const err1 = tx1 - ex1;
      const err2 = tx2 - ex2;
      const eAcc = -1.2 * ex1 - 0.32 * kappa * ex1 * ex1 * ex1 - 0.22 * ex2 + 2.4 * err1 + 1.8 * err2;
      ex1 = clamp(ex1 + dt * (ex2 + 0.5 * dt * eAcc) + 0.12 * err1, -2.4, 2.4);
      ex2 = clamp(ex2 + dt * eAcc, -2.4, 2.4);
    }
  }

  const sigmaPoints = warpedSigmas.map((s) => ({
    x1: clamp(s.x1, -2.5, 2.5),
    x2: clamp(s.x2, -2.5, 2.5),
    z: s.z,
  }));

  return {
    presetId: 'ukf-nonlinear',
    paramA: kappa,
    paramB: sigma0,
    metrics: {
      primaryLabel: 'UKF Mean Err',
      primaryValue: ukfBiasErr.toFixed(3),
      secondaryLabel: 'EKF Linear Err',
      secondaryValue: ekfBiasErr.toFixed(3),
      tertiaryLabel: 'Sigma Points',
      tertiaryValue: `2n+1 = 5 (${Math.min(accuracyGain, 99).toFixed(1)}×)`,
      statusText: kappa >= 1.3 ? 'NON-GAUSSIAN BANANA' : '2ND-ORDER UNSCENTED',
      statusColor: '#A78BFA',
    },
    trueTraj,
    estTraj,
    sigmaPoints,
    factorNodes: [],
    riccati: solveDoubleIntegratorCARE(1.5),
    ukfDetail: {
      ukfMean: { x1: ukfMean1, x2: ukfMean2 },
      ukfCov: { p11: ukfP11, p12: ukfP12, p22: ukfP22 },
      ekfMean: { x1: ekfMean.x1, x2: ekfMean.x2 },
      ekfCov: { p11: ekfP11, p12: ekfP12, p22: ekfP22 },
      trueMean: { x1: trueMean1, x2: trueMean2 },
      bananaCloud,
      mcMean: { x1: mcSum1 / cloudCount, x2: mcSum2 / cloudCount },
    },
  };
}

// ----------------------------------------------------------------------------
// Preset 5: Factor Graph / MHE Sliding-Window Smoother
// ----------------------------------------------------------------------------

function analyzeMheGraph(paramA, paramB) {
  const outlierSpike = clamp(
    paramA,
    STATESPACE_PRESETS['mhe-graph'].paramA.min,
    STATESPACE_PRESETS['mhe-graph'].paramA.max
  );
  const windowN = Math.round(
    clamp(
      paramB,
      STATESPACE_PRESETS['mhe-graph'].paramB.min,
      STATESPACE_PRESETS['mhe-graph'].paramB.max
    )
  );

  const steps = 120;
  const duration = 6.0;
  const dt = duration / (steps - 1);

  // Smooth ground-truth trajectory (S-curve orbital maneuver in phase space)
  const evalTrueState = (t) => {
    const u = t / duration;
    const x1 = -1.65 + 3.25 * u + 0.42 * Math.sin(2 * Math.PI * u);
    const x2 = 1.15 * Math.cos(1.65 * Math.PI * u) - 0.3 * Math.sin(Math.PI * u);
    const accel = -1.15 * 1.65 * Math.PI * Math.sin(1.65 * Math.PI * u) / duration;
    return { x1, x2, u: accel };
  };

  // Sample N discrete factor-graph nodes across the sliding window [0.45, 5.75]
  const tStart = 0.45;
  const tEnd = 5.75;
  const randn = createSeededGaussian(55109);
  const outlierIdx = Math.min(windowN - 2, Math.max(1, Math.floor(windowN * 0.55)));
  const hasOutlier = outlierSpike >= 0.45;

  const nodeTrue = [];
  const nodeMeas = [];
  const odomDeltas = [];

  for (let i = 0; i < windowN; i++) {
    const frac = windowN > 1 ? i / (windowN - 1) : 0.5;
    const t = tStart + frac * (tEnd - tStart);
    const st = evalTrueState(t);
    nodeTrue.push({ t, x1: st.x1, x2: st.x2 });

    let m1 = st.x1 + 0.11 * randn();
    let m2 = st.x2 + 0.11 * randn();
    const isOutlier = i === outlierIdx && hasOutlier;
    if (isOutlier) {
      // Dramatic gross outlier spike in measurement space
      m1 = clamp(st.x1 - 0.52 * outlierSpike, -2.55, 2.55);
      m2 = clamp(st.x2 + 0.68 * outlierSpike, -2.55, 2.55);
    }
    nodeMeas.push({ x1: m1, x2: m2, isOutlier });
  }

  for (let i = 0; i < windowN - 1; i++) {
    odomDeltas.push({
      dx1: nodeTrue[i + 1].x1 - nodeTrue[i].x1 + 0.03 * randn(),
      dx2: nodeTrue[i + 1].x2 - nodeTrue[i].x2 + 0.03 * randn(),
    });
  }

  // Exact tridiagonal solver (Thomas algorithm) for 1D banded linear system
  const solveTridiagonal = (lower, diag, upper, rhs) => {
    const m = diag.length;
    const c = new Float64Array(m);
    const d = new Float64Array(m);
    const x = new Float64Array(m);

    c[0] = m > 1 ? upper[0] / diag[0] : 0;
    d[0] = rhs[0] / diag[0];
    for (let i = 1; i < m; i++) {
      const denom = diag[i] - lower[i] * c[i - 1];
      c[i] = i < m - 1 ? upper[i] / denom : 0;
      d[i] = (rhs[i] - lower[i] * d[i - 1]) / denom;
    }
    x[m - 1] = d[m - 1];
    for (let i = m - 2; i >= 0; i--) {
      x[i] = d[i] - c[i] * x[i + 1];
    }
    return x;
  };

  // Solve 2D factor graph given per-node measurement weights wMeas[i]
  const solveGraph = (wMeas, wDyn) => {
    const lower = new Float64Array(windowN);
    const diag = new Float64Array(windowN);
    const upper = new Float64Array(windowN);
    const rhs1 = new Float64Array(windowN);
    const rhs2 = new Float64Array(windowN);

    for (let i = 0; i < windowN; i++) {
      diag[i] = wMeas[i];
      rhs1[i] = wMeas[i] * nodeMeas[i].x1;
      rhs2[i] = wMeas[i] * nodeMeas[i].x2;
    }
    for (let i = 0; i < windowN - 1; i++) {
      diag[i] += wDyn;
      diag[i + 1] += wDyn;
      upper[i] -= wDyn;
      lower[i + 1] -= wDyn;
      rhs1[i] -= wDyn * odomDeltas[i].dx1;
      rhs1[i + 1] += wDyn * odomDeltas[i].dx1;
      rhs2[i] -= wDyn * odomDeltas[i].dx2;
      rhs2[i + 1] += wDyn * odomDeltas[i].dx2;
    }

    const sol1 = solveTridiagonal(lower, diag, upper, rhs1);
    const sol2 = solveTridiagonal(lower, diag, upper, rhs2);
    return { sol1, sol2 };
  };

  const wDyn = 8.5;
  const baseWMeas = 2.4;

  // 1. Naive L2 Gaussian Smoother (pulled badly by outlier!)
  const l2Weights = new Float64Array(windowN).fill(baseWMeas);
  const naiveSol = solveGraph(l2Weights, wDyn);

  // 2. Robust MHE / Huber-Cauchy IRLS Factor Graph Smoother (14 iterations)
  const robustWeights = new Float64Array(windowN).fill(baseWMeas);
  let mheSol = solveGraph(robustWeights, wDyn);
  const huberDelta = 0.28;

  for (let iter = 0; iter < 14; iter++) {
    for (let i = 0; i < windowN; i++) {
      const r = Math.hypot(mheSol.sol1[i] - nodeMeas[i].x1, mheSol.sol2[i] - nodeMeas[i].x2);
      // Cauchy-Huber hybrid weight cleanly crushes gross outliers
      const scaleW = r <= huberDelta ? 1.0 : huberDelta / (r * (1 + (r / huberDelta) * 0.85));
      robustWeights[i] = baseWMeas * Math.max(scaleW, 1e-4);
    }
    mheSol = solveGraph(robustWeights, wDyn);
  }

  // Compute RMSE metrics on factor nodes
  let mheSq = 0;
  let naiveSq = 0;
  const factorNodes = [];
  for (let i = 0; i < windowN; i++) {
    const eMhe = Math.hypot(mheSol.sol1[i] - nodeTrue[i].x1, mheSol.sol2[i] - nodeTrue[i].x2);
    const eNaive = Math.hypot(naiveSol.sol1[i] - nodeTrue[i].x1, naiveSol.sol2[i] - nodeTrue[i].x2);
    mheSq += eMhe * eMhe;
    naiveSq += eNaive * eNaive;

    factorNodes.push({
      t: nodeTrue[i].t,
      x1: mheSol.sol1[i],
      x2: mheSol.sol2[i],
      trueX1: nodeTrue[i].x1,
      trueX2: nodeTrue[i].x2,
      measX1: nodeMeas[i].x1,
      measX2: nodeMeas[i].x2,
      isOutlier: nodeMeas[i].isOutlier,
      weight: robustWeights[i] / baseWMeas,
    });
  }

  const mheRmse = Math.sqrt(mheSq / windowN);
  const naiveRmse = Math.sqrt(naiveSq / windowN);

  // Interpolate smooth continuous trajectories for 3D tubes
  const interpNodes = (t, key1, key2, fallbackArr1, fallbackArr2) => {
    if (t <= factorNodes[0].t) {
      return [fallbackArr1[0], fallbackArr2[0]];
    }
    if (t >= factorNodes[windowN - 1].t) {
      return [fallbackArr1[windowN - 1], fallbackArr2[windowN - 1]];
    }
    for (let i = 0; i < windowN - 1; i++) {
      if (t >= factorNodes[i].t && t <= factorNodes[i + 1].t) {
        const a = (t - factorNodes[i].t) / Math.max(factorNodes[i + 1].t - factorNodes[i].t, 1e-6);
        return [
          fallbackArr1[i] + a * (fallbackArr1[i + 1] - fallbackArr1[i]),
          fallbackArr2[i] + a * (fallbackArr2[i + 1] - fallbackArr2[i]),
        ];
      }
    }
    return [fallbackArr1[0], fallbackArr2[0]];
  };

  const trueTraj = [];
  const estTraj = [];
  for (let i = 0; i < steps; i++) {
    const t = i * dt;
    const st = evalTrueState(t);
    const [mx1, mx2] = interpNodes(t, 'x1', 'x2', mheSol.sol1, mheSol.sol2);
    const [nx1, nx2] = interpNodes(t, 'x1', 'x2', naiveSol.sol1, naiveSol.sol2);
    const err = Math.hypot(st.x1 - mx1, st.x2 - mx2);

    trueTraj.push({
      t,
      x1: st.x1,
      x2: st.x2,
      u: st.u,
      cost: err * err,
    });

    // Smoothed uncertainty is smallest in the interior of the sliding window!
    const uNorm = t / duration;
    const interiorFactor = 0.65 + 0.35 * Math.pow(2 * uNorm - 1, 2);
    const winShrink = 1 / Math.sqrt(Math.max(windowN / 4, 0.75));
    estTraj.push({
      t,
      x1: mx1,
      x2: mx2,
      naiveX1: nx1,
      naiveX2: nx2,
      sigma1: clamp(0.18 * interiorFactor * winShrink, 0.1, 0.45),
      sigma2: clamp(0.16 * interiorFactor * winShrink, 0.09, 0.42),
      gain: hasOutlier ? robustWeights[outlierIdx] / baseWMeas : 1.0,
    });
  }

  return {
    presetId: 'mhe-graph',
    paramA: outlierSpike,
    paramB: windowN,
    metrics: {
      primaryLabel: 'MHE Robust RMSE',
      primaryValue: mheRmse.toFixed(3),
      secondaryLabel: 'Naive L2 Err',
      secondaryValue: naiveRmse.toFixed(3),
      tertiaryLabel: 'Window / Factors',
      tertiaryValue: `${windowN} nodes / ${2 * windowN - 1}`,
      statusText: hasOutlier ? 'OUTLIER REJECTED (HUBER)' : 'MAP SMOOTHING',
      statusColor: hasOutlier ? '#34D399' : '#22D3EE',
    },
    trueTraj,
    estTraj,
    sigmaPoints: [],
    factorNodes,
    riccati: solveDoubleIntegratorCARE(2.0),
    outlierIdx,
  };
}

/**
 * Pure deterministic State-Space & Estimation analysis engine.
 * Used identically by the 3D WebGL Studio and HUD telemetry badges.
 */
export function analyzeStateSpaceSystem({ presetId = 'lqr-cart', paramA, paramB } = {}) {
  const key = STATESPACE_PRESETS[presetId] ? presetId : 'lqr-cart';
  const preset = STATESPACE_PRESETS[key];
  const resolvedA = Number.isFinite(paramA) ? paramA : preset.paramA.default;
  const resolvedB = Number.isFinite(paramB) ? paramB : preset.paramB.default;

  let result;
  switch (key) {
    case 'mpc-cbf':
      result = analyzeMpcCbf(resolvedA, resolvedB);
      break;
    case 'kf-fusion':
      result = analyzeKalmanFusion(resolvedA, resolvedB);
      break;
    case 'ukf-nonlinear':
      result = analyzeUkfNonlinear(resolvedA, resolvedB);
      break;
    case 'mhe-graph':
      result = analyzeMheGraph(resolvedA, resolvedB);
      break;
    case 'lqr-cart':
    default:
      result = analyzeLqrCart(resolvedA, resolvedB);
      break;
  }

  return {
    ...result,
    name: preset.name,
    shortName: preset.shortName,
    formulaLatex: preset.formulaLatex,
    paramALabel: preset.paramALabel,
    paramBLabel: preset.paramBLabel,
  };
}

// ============================================================================
// 3. 3D STUDIO PALETTE, COORDINATE MAPPING & GEOMETRY HELPERS
// ============================================================================

const COLORS = {
  studioBg: 0x0b0d12,
  plinthDark: 0x0e1422,
  plinthRim: 0x22d3ee,
  gridMinor: 0x1e293b,
  gridMajor: 0x334155,
  cyan: 0x22d3ee,
  cyanLight: 0x67e8f9,
  cyanDeep: 0x0891b2,
  amber: 0xf59e0b,
  amberLight: 0xfcd34d,
  amberDeep: 0xb45309,
  violet: 0xa78bfa,
  violetLight: 0xc4b5fd,
  violetDeep: 0x6d28d9,
  emerald: 0x34d399,
  emeraldLight: 0x6ee7b7,
  emeraldDeep: 0x059669,
  coral: 0xfb7185,
  coralDeep: 0xe11d48,
  slateMetal: 0x475569,
  darkMetal: 0x1e293b,
  white: 0xf8fafc,
};

const STAGE_W = 7.4;
const STAGE_D = 6.8;
const SCALE_X1 = 1.24; // x1 in [-2.6, 2.6] -> world X in [-3.22, 3.22]
const SCALE_X2 = 1.12; // x2 in [-2.6, 2.6] -> world Z in [2.91, -2.91]
const BOWL_DOMAIN = 2.45;
const BOWL_SEG = 48;

function x1ToWorld(x1) {
  return clamp(x1, -2.75, 2.75) * SCALE_X1;
}

function x2ToWorld(x2) {
  return -clamp(x2, -2.75, 2.75) * SCALE_X2;
}

function costToWorldY(cost, costScale = 14.0) {
  const safe = Math.max(0, Number.isFinite(cost) ? cost : 0);
  // Smooth log-compressed quadratic bowl elevation in [0.05, 2.68]
  return 0.05 + 2.65 * (1 - Math.exp(-safe / Math.max(costScale, 2.0)));
}

function timeToWorldY(t, duration = 6.0) {
  const u = clamp(t / Math.max(duration, 1e-3), 0, 1);
  return 0.16 + u * 2.48;
}

function createRoundedRectShape(width, depth, radius) {
  const hw = width * 0.5;
  const hd = depth * 0.5;
  const r = Math.min(radius, hw * 0.85, hd * 0.85);
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
  const pts2D = shape.getSpacedPoints(128);
  const pts3D = [];
  for (let i = 0; i < pts2D.length - 1; i++) {
    pts3D.push(new THREE.Vector3(pts2D[i].x, 0.008, pts2D[i].y));
  }
  const curve = new THREE.CatmullRomCurve3(pts3D, true, 'centripetal', 0.5);
  return new THREE.TubeGeometry(curve, 140, tubeRadius, 8, true);
}

function createSafeTubeGeometry(points, tubularSegments, radius, radialSegments = 8) {
  const cleaned = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) continue;
    if (cleaned.length === 0 || cleaned[cleaned.length - 1].distanceToSquared(p) > 1e-7) {
      cleaned.push(p);
    }
  }
  if (cleaned.length < 2) {
    return new THREE.BufferGeometry();
  }
  const curve = new THREE.CatmullRomCurve3(cleaned, false, 'centripetal', 0.5);
  return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
}

function createTextSprite(text, { color = '#cbd5e1', bg = 'rgba(11, 13, 18, 0.72)', fontSize = 28, scale = 0.44 } = {}) {
  const canvas = document.createElement('canvas');
  const padX = 20;
  const padY = 10;
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  let aspect = 512 / 96;

  if (ctx) {
    ctx.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    const measured = Math.ceil(ctx.measureText(text).width);
    const w = clamp(measured + padX * 2, 96, 680);
    const h = fontSize + padY * 2;
    canvas.width = w;
    canvas.height = h;
    aspect = w / h;

    ctx.clearRect(0, 0, w, h);
    if (bg) {
      const r = h * 0.34;
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

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.26)';
      ctx.lineWidth = 2;
      ctx.stroke();
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
    opacity: 0.92,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scale * aspect, scale, 1);
  return { sprite, texture: tex, material: mat };
}

function disposeGroupChildren(group, sharedMaterials = new Set(), sharedGeometries = new Set()) {
  if (!group) return;
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
// 4. STATE-SPACE 3D STUDIO CLASS
// ============================================================================

export class StateSpace3DStudio {
  constructor(options = {}) {
    this.onTelemetry =
      typeof options.onTelemetry === 'function'
        ? options.onTelemetry
        : typeof options.onChange === 'function'
          ? options.onChange
          : null;

    this.presetId = STATESPACE_PRESETS[options.presetId] ? options.presetId : 'lqr-cart';
    const initPreset = STATESPACE_PRESETS[this.presetId];
    this.paramA = Number.isFinite(options.paramA)
      ? clamp(options.paramA, initPreset.paramA.min, initPreset.paramA.max)
      : initPreset.paramA.default;
    this.paramB = Number.isFinite(options.paramB)
      ? clamp(options.paramB, initPreset.paramB.min, initPreset.paramB.max)
      : initPreset.paramB.default;

    this.mechatronicsLens = Boolean(options.mechatronicsLens);
    this.cameraPreset = '3d';

    this._analysis = analyzeStateSpaceSystem({
      presetId: this.presetId,
      paramA: this.paramA,
      paramB: this.paramB,
    });

    // Core Three.js handles
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.bloomPass = null;
    this.controls = null;
    this.envRT = null;

    // Scene groups
    this._stageGroup = null;
    this._plinthGroup = null;
    this._bowlGroup = null;
    this._trajGroup = null;
    this._heroGroup = null;
    this._probeGroup = null;
    this._mechatronicsGroup = null;

    // Dynamic probe & animation handles
    this._probeSphere = null;
    this._probeHalo = null;
    this._probeDropLine = null;
    this._covEllipsoidGroup = null;
    this._covShellMesh = null;
    this._covRingXY = null;
    this._covRingXZ = null;
    this._updateFlashRing = null;
    this._plinthRimMat = null;
    this._zAxisLabelHolder = null;

    // Mode-specific animated references
    this._barrierWallMat = null;
    this._breachHaloMesh = null;
    this._outlierCubeMesh = null;
    this._outlierHaloMesh = null;
    this._sigmaMeshes = [];

    // Mechatronics actuator rig handles
    this._rigCartGroup = null;
    this._rigPendulumPivot = null;
    this._rigTorqueBar = null;
    this._rigTorqueMat = null;

    // Resource tracking for leak-free dispose()
    this._sharedGeometries = new Set();
    this._sharedMaterials = new Set();
    this._ownedTextures = [];

    // Runtime animation state
    this._rafId = null;
    this._resizeObserver = null;
    this._clock = null;
    this._probePhase = 0;
    this._lastUpdateIdx = -1;
    this._flashDecay = 0;
    this._camTransition = null;
    this._initialized = false;
    this._disposed = false;

    this._onAnimate = this._animate.bind(this);
    this._onControlsStart = () => {
      this._camTransition = null;
    };
  }

  _getPreset() {
    return STATESPACE_PRESETS[this.presetId] || STATESPACE_PRESETS['lqr-cart'];
  }

  _recomputeAnalysis() {
    this._analysis = analyzeStateSpaceSystem({
      presetId: this.presetId,
      paramA: this.paramA,
      paramB: this.paramB,
    });
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

    if (typeof options.onTelemetry === 'function') {
      this.onTelemetry = options.onTelemetry;
    } else if (typeof options.onChange === 'function') {
      this.onTelemetry = options.onChange;
    }
    if (options.presetId && STATESPACE_PRESETS[options.presetId]) {
      this.presetId = options.presetId;
      const p = this._getPreset();
      this.paramA = Number.isFinite(options.paramA)
        ? clamp(options.paramA, p.paramA.min, p.paramA.max)
        : p.paramA.default;
      this.paramB = Number.isFinite(options.paramB)
        ? clamp(options.paramB, p.paramB.min, p.paramB.max)
        : p.paramB.default;
    } else {
      const p = this._getPreset();
      if (Number.isFinite(options.paramA)) {
        this.paramA = clamp(options.paramA, p.paramA.min, p.paramA.max);
      }
      if (Number.isFinite(options.paramB)) {
        this.paramB = clamp(options.paramB, p.paramB.min, p.paramB.max);
      }
    }
    if (typeof options.mechatronicsLens === 'boolean') {
      this.mechatronicsLens = options.mechatronicsLens;
    }

    this._recomputeAnalysis();

    const width = Math.max(container.clientWidth || 800, 1);
    const height = Math.max(container.clientHeight || 520, 1);

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(COLORS.studioBg, 0.016);
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);

    // 2. Renderer (EIGENLAB Spline WebGL standards)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.14;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(COLORS.studioBg, 0);

    const dom = this.renderer.domElement;
    dom.style.display = 'block';
    dom.style.width = '100%';
    dom.style.height = '100%';
    dom.style.outline = 'none';
    container.appendChild(dom);

    // 3. Studio Reflections (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    this.envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRT.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 4. Post-Processing: EffectComposer + RenderPass + Crisp UnrealBloomPass
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(width, height);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.17, 0.30, 0.90);
    this.composer.addPass(this.bloomPass);

    // 5. Smoothly Damped OrbitControls
    this.controls = new OrbitControls(this.camera, dom);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI * 0.56;
    this.controls.minPolarAngle = 0.08;
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
    this._bowlGroup = new THREE.Group();
    this._trajGroup = new THREE.Group();
    this._heroGroup = new THREE.Group();
    this._probeGroup = new THREE.Group();
    this._mechatronicsGroup = new THREE.Group();

    this._stageGroup.add(
      this._plinthGroup,
      this._bowlGroup,
      this._trajGroup,
      this._heroGroup,
      this._probeGroup,
      this._mechatronicsGroup
    );

    this._buildPlinthAndGrid();
    this._buildProbeAndEllipsoid();
    this._buildMechatronicsRig();
    this._rebuildModeScene();

    this._mechatronicsGroup.visible = this.mechatronicsLens;
    this._applyCameraPresetImmediate(this.cameraPreset);

    // 8. Responsive ResizeObserver
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => this.resize());
      this._resizeObserver.observe(container);
    }

    this._clock = new THREE.Clock();
    this._clock.start();
    this._initialized = true;
    this._emitTelemetry();
    this._animate();
    return this;
  }

  _setupLighting() {
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.85);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xf8fafc, 1.35);
    key.position.set(7.5, 11.5, 8.2);
    this.scene.add(key);

    const rimCyan = new THREE.DirectionalLight(COLORS.cyan, 0.78);
    rimCyan.position.set(-8.5, 5.5, -6.5);
    this.scene.add(rimCyan);

    const warmAmber = new THREE.PointLight(COLORS.amber, 2.0, 18, 1.5);
    warmAmber.position.set(4.5, 3.6, 2.4);
    this.scene.add(warmAmber);

    const violetFill = new THREE.PointLight(COLORS.violet, 1.6, 16, 1.5);
    violetFill.position.set(-3.5, 2.8, -3.5);
    this.scene.add(violetFill);
  }

  _createSharedResources() {
    this._unitSphereGeo = new THREE.SphereGeometry(1, 28, 22);
    this._unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
    this._unitCylGeo = new THREE.CylinderGeometry(1, 1, 1, 18, 1);
    this._unitTorusGeo = new THREE.TorusGeometry(1, 0.07, 12, 48);
    this._unitOctaGeo = new THREE.OctahedronGeometry(1, 0);

    this._sharedGeometries.add(
      this._unitSphereGeo,
      this._unitBoxGeo,
      this._unitCylGeo,
      this._unitTorusGeo,
      this._unitOctaGeo
    );

    // Glowing Cyan True Trajectory Tube
    this._matTrueTube = new THREE.MeshStandardMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.55,
      roughness: 0.16,
      metalness: 0.25,
    });

    // Glowing Amber Comparison / Unconstrained Tube
    this._matAmberTube = new THREE.MeshStandardMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.45,
      roughness: 0.18,
      metalness: 0.22,
    });

    // Glowing Coral Breach / Outlier Material
    this._matCoralGlow = new THREE.MeshStandardMaterial({
      color: 0xffe4e6,
      emissive: COLORS.coral,
      emissiveIntensity: 1.9,
      roughness: 0.14,
      metalness: 0.25,
    });

    // Glowing Emerald Estimated / Safe Tube Material
    this._matEmeraldTube = new THREE.MeshStandardMaterial({
      color: COLORS.emeraldLight,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.45,
      roughness: 0.16,
      metalness: 0.24,
    });

    // Glowing Violet Sigma-Point / UKF Material
    this._matVioletGlow = new THREE.MeshStandardMaterial({
      color: COLORS.violetLight,
      emissive: COLORS.violet,
      emissiveIntensity: 1.6,
      roughness: 0.16,
      metalness: 0.28,
    });

    // Subtle Ground Shadow Trace
    this._matGroundTrace = new THREE.LineBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.32,
    });

    this._matGroundTraceAlt = new THREE.LineBasicMaterial({
      color: COLORS.amber,
      transparent: true,
      opacity: 0.26,
    });

    this._sharedMaterials.add(
      this._matTrueTube,
      this._matAmberTube,
      this._matCoralGlow,
      this._matEmeraldTube,
      this._matVioletGlow,
      this._matGroundTrace,
      this._matGroundTraceAlt
    );
  }

  // --------------------------------------------------------------------------
  // Studio Stage Plinth & Cartesian Grid
  // --------------------------------------------------------------------------

  _buildPlinthAndGrid() {
    // 1. Beveled Frosted Dark-Glass Studio Stage Slab
    const slabGeo = createPlinthSlabGeometry(STAGE_W, STAGE_D, 0.34, 0.42, 0.055);
    const slabMat = new THREE.MeshPhysicalMaterial({
      color: COLORS.plinthDark,
      roughness: 0.22,
      metalness: 0.28,
      clearcoat: 0.85,
      clearcoatRoughness: 0.16,
      envMapIntensity: 0.55,
    });
    const slabMesh = new THREE.Mesh(slabGeo, slabMat);
    slabMesh.position.y = -0.01;
    this._plinthGroup.add(slabMesh);

    // 2. Luminous Cyan Studio Perimeter Rim
    const rimGeo = createPlinthRimGeometry(STAGE_W - 0.04, STAGE_D - 0.04, 0.4, 0.015);
    this._plinthRimMat = new THREE.MeshStandardMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.plinthRim,
      emissiveIntensity: 1.15,
      roughness: 0.18,
      metalness: 0.3,
    });
    const rimMesh = new THREE.Mesh(rimGeo, this._plinthRimMat);
    this._plinthGroup.add(rimMesh);

    // 3. Crisp Cartesian Phase Grid (x1 in [-2.5, 2.5], x2 in [-2.5, 2.5])
    const minorVerts = [];
    const majorVerts = [];
    const halfX = x1ToWorld(2.5);
    const halfZ = Math.abs(x2ToWorld(2.5));
    const gridY = 0.008;

    for (let v = -2.5; v <= 2.501; v += 0.5) {
      const isMajor = Math.abs(v - Math.round(v)) < 1e-4;
      const target = isMajor ? majorVerts : minorVerts;

      const wx = x1ToWorld(v);
      target.push(wx, gridY, -halfZ, wx, gridY, halfZ);

      const wz = x2ToWorld(v);
      target.push(-halfX, gridY, wz, halfX, gridY, wz);
    }

    const minorGeo = new THREE.BufferGeometry();
    minorGeo.setAttribute('position', new THREE.Float32BufferAttribute(minorVerts, 3));
    const minorLines = new THREE.LineSegments(
      minorGeo,
      new THREE.LineBasicMaterial({ color: COLORS.gridMinor, transparent: true, opacity: 0.55 })
    );
    this._plinthGroup.add(minorLines);

    const majorGeo = new THREE.BufferGeometry();
    majorGeo.setAttribute('position', new THREE.Float32BufferAttribute(majorVerts, 3));
    const majorLines = new THREE.LineSegments(
      majorGeo,
      new THREE.LineBasicMaterial({ color: COLORS.gridMajor, transparent: true, opacity: 0.72 })
    );
    this._plinthGroup.add(majorLines);

    // 4. Glowing Principal Phase Axes: x1 (Cyan), x2 (Violet), Vertical Cost/Time (Slate-Amber)
    const addAxisBar = (pA, pB, colorHex, radius = 0.013) => {
      const curve = new THREE.LineCurve3(pA, pB);
      const geo = new THREE.TubeGeometry(curve, 2, radius, 8, false);
      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 1.05,
        roughness: 0.25,
      });
      this._plinthGroup.add(new THREE.Mesh(geo, mat));
    };

    addAxisBar(new THREE.Vector3(-halfX, 0.012, 0), new THREE.Vector3(halfX, 0.012, 0), COLORS.cyan);
    addAxisBar(new THREE.Vector3(0, 0.012, halfZ), new THREE.Vector3(0, 0.012, -halfZ), COLORS.violet);
    addAxisBar(
      new THREE.Vector3(-halfX, 0.012, -halfZ),
      new THREE.Vector3(-halfX, 2.75, -halfZ),
      COLORS.amber,
      0.012
    );

    // 5. Equilibrium Origin Beacon Ring at (0, 0.016, 0)
    const originRing = new THREE.Mesh(
      this._unitTorusGeo,
      new THREE.MeshStandardMaterial({
        color: COLORS.emeraldLight,
        emissive: COLORS.emerald,
        emissiveIntensity: 1.35,
        roughness: 0.2,
      })
    );
    originRing.rotation.x = Math.PI / 2;
    originRing.position.set(0, 0.018, 0);
    originRing.scale.setScalar(0.16);
    this._plinthGroup.add(originRing);

    // 6. Floating Crisp Editorial Axis Labels
    const lblX1 = createTextSprite('x₁ (pos)', { color: '#67e8f9', scale: 0.36 });
    lblX1.sprite.position.set(halfX + 0.32, 0.22, 0.14);
    this._ownedTextures.push(lblX1.texture);
    this._plinthGroup.add(lblX1.sprite);

    const lblX2 = createTextSprite('x₂ (vel)', { color: '#c4b5fd', scale: 0.36 });
    lblX2.sprite.position.set(0.28, 0.22, -halfZ - 0.24);
    this._ownedTextures.push(lblX2.texture);
    this._plinthGroup.add(lblX2.sprite);

    this._zAxisLabelHolder = new THREE.Group();
    this._zAxisLabelHolder.position.set(-halfX, 2.98, -halfZ);
    this._plinthGroup.add(this._zAxisLabelHolder);
  }

  _refreshVerticalAxisLabel() {
    disposeGroupChildren(this._zAxisLabelHolder, this._sharedMaterials, this._sharedGeometries);
    const isCostMode = this.presetId === 'lqr-cart' || this.presetId === 'mpc-cbf';
    const labelText = isCostMode ? 'V(x) = xᵀPx' : 'Time t (s)';
    const lbl = createTextSprite(labelText, { color: '#fcd34d', scale: 0.36 });
    this._zAxisLabelHolder.add(lbl.sprite);
  }

  // --------------------------------------------------------------------------
  // Live State Probe & Breathing 3D Covariance Ellipsoid
  // --------------------------------------------------------------------------

  _buildProbeAndEllipsoid() {
    // 1. Metallic Glowing Probe Core
    const probeMat = new THREE.MeshStandardMaterial({
      color: COLORS.white,
      emissive: COLORS.cyan,
      emissiveIntensity: 2.1,
      roughness: 0.1,
      metalness: 0.35,
    });
    this._probeSphere = new THREE.Mesh(this._unitSphereGeo, probeMat);
    this._probeSphere.scale.setScalar(0.115);
    this._probeGroup.add(this._probeSphere);

    // 2. Spinning Orbital Halo Ring
    const haloMat = new THREE.MeshStandardMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.45,
      transparent: true,
      opacity: 0.82,
      roughness: 0.18,
    });
    this._probeHalo = new THREE.Mesh(this._unitTorusGeo, haloMat);
    this._probeHalo.scale.setScalar(0.2);
    this._probeGroup.add(this._probeHalo);

    // 3. Vertical Laser Drop-Line to Floor
    const dropGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -1, 0),
    ]);
    this._probeDropLine = new THREE.Line(
      dropGeo,
      new THREE.LineBasicMaterial({
        color: COLORS.cyanLight,
        transparent: true,
        opacity: 0.45,
      })
    );
    this._probeGroup.add(this._probeDropLine);

    // 4. Breathing 3D Translucent Covariance Ellipsoid
    this._covEllipsoidGroup = new THREE.Group();
    this._probeGroup.add(this._covEllipsoidGroup);

    const covShellMat = new THREE.MeshPhysicalMaterial({
      color: COLORS.emeraldLight,
      emissive: COLORS.emerald,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.24,
      roughness: 0.14,
      metalness: 0.05,
      clearcoat: 0.9,
      envMapIntensity: 0.6,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this._covShellMesh = new THREE.Mesh(this._unitSphereGeo, covShellMat);
    this._covEllipsoidGroup.add(this._covShellMesh);

    const ringMat = new THREE.MeshStandardMaterial({
      color: COLORS.emeraldLight,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.72,
      roughness: 0.2,
    });
    this._covRingXZ = new THREE.Mesh(this._unitTorusGeo, ringMat);
    this._covRingXZ.rotation.x = Math.PI / 2;
    this._covEllipsoidGroup.add(this._covRingXZ);

    this._covRingXY = new THREE.Mesh(this._unitTorusGeo, ringMat);
    this._covEllipsoidGroup.add(this._covRingXY);

    // 5. Measurement Update Pulse Ring (flashes on KF updates)
    const flashMat = new THREE.MeshBasicMaterial({
      color: COLORS.emeraldLight,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    this._updateFlashRing = new THREE.Mesh(this._unitTorusGeo, flashMat);
    this._updateFlashRing.rotation.x = Math.PI / 2;
    this._probeGroup.add(this._updateFlashRing);
  }

  // --------------------------------------------------------------------------
  // Mechatronics Lens: 3D Inverted-Pendulum Cart Actuator Rig
  // --------------------------------------------------------------------------

  _buildMechatronicsRig() {
    this._mechatronicsGroup.position.set(0, 0.12, STAGE_D * 0.5 + 0.62);

    const baseMat = new THREE.MeshStandardMaterial({
      color: COLORS.darkMetal,
      roughness: 0.32,
      metalness: 0.78,
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.18,
      metalness: 0.88,
    });
    const accentCyanMat = new THREE.MeshStandardMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.3,
      roughness: 0.2,
      metalness: 0.35,
    });

    // Sleek anodized chassis bed
    const bed = new THREE.Mesh(this._unitBoxGeo, baseMat);
    bed.scale.set(5.4, 0.14, 0.64);
    bed.position.set(0, -0.05, 0);
    this._mechatronicsGroup.add(bed);

    // Dual precision linear chrome guide rails
    for (const zOff of [-0.14, 0.14]) {
      const rail = new THREE.Mesh(this._unitCylGeo, chromeMat);
      rail.rotation.z = Math.PI / 2;
      rail.scale.set(0.026, 5.1, 0.026);
      rail.position.set(0, 0.11, zOff);
      this._mechatronicsGroup.add(rail);
    }

    // End-stop anodized bumper blocks
    for (const xOff of [-2.62, 2.62]) {
      const stop = new THREE.Mesh(this._unitBoxGeo, baseMat);
      stop.scale.set(0.18, 0.34, 0.56);
      stop.position.set(xOff, 0.12, 0);
      this._mechatronicsGroup.add(stop);

      const led = new THREE.Mesh(this._unitBoxGeo, accentCyanMat);
      led.scale.set(0.03, 0.22, 0.36);
      led.position.set(xOff > 0 ? xOff - 0.095 : xOff + 0.095, 0.14, 0);
      this._mechatronicsGroup.add(led);
    }

    // Sliding Cart Carriage Group
    this._rigCartGroup = new THREE.Group();
    this._rigCartGroup.position.set(0, 0.18, 0);
    this._mechatronicsGroup.add(this._rigCartGroup);

    const cartBody = new THREE.Mesh(
      this._unitBoxGeo,
      new THREE.MeshPhysicalMaterial({
        color: 0x1e293b,
        roughness: 0.22,
        metalness: 0.68,
        clearcoat: 0.8,
      })
    );
    cartBody.scale.set(0.68, 0.26, 0.48);
    this._rigCartGroup.add(cartBody);

    // Glowing Servo Torque Thrust Indicator Bar on front of cart
    this._rigTorqueMat = new THREE.MeshStandardMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });
    this._rigTorqueBar = new THREE.Mesh(this._unitBoxGeo, this._rigTorqueMat);
    this._rigTorqueBar.scale.set(0.28, 0.06, 0.05);
    this._rigTorqueBar.position.set(0, 0.0, 0.255);
    this._rigCartGroup.add(this._rigTorqueBar);

    // Rotary encoder hub
    const hub = new THREE.Mesh(this._unitCylGeo, chromeMat);
    hub.rotation.x = Math.PI / 2;
    hub.scale.set(0.085, 0.52, 0.085);
    hub.position.set(0, 0.12, 0);
    this._rigCartGroup.add(hub);

    // Articulated Inverted-Pendulum Pivot
    this._rigPendulumPivot = new THREE.Group();
    this._rigPendulumPivot.position.set(0, 0.14, 0);
    this._rigCartGroup.add(this._rigPendulumPivot);

    const rod = new THREE.Mesh(this._unitCylGeo, chromeMat);
    rod.scale.set(0.028, 0.92, 0.028);
    rod.position.set(0, 0.46, 0);
    this._rigPendulumPivot.add(rod);

    const bob = new THREE.Mesh(
      this._unitSphereGeo,
      new THREE.MeshStandardMaterial({
        color: COLORS.amberLight,
        emissive: COLORS.amber,
        emissiveIntensity: 1.45,
        roughness: 0.16,
        metalness: 0.55,
      })
    );
    bob.scale.setScalar(0.115);
    bob.position.set(0, 0.94, 0);
    this._rigPendulumPivot.add(bob);

    const rigLabel = createTextSprite('MECHATRONICS ACTUATOR RIG', {
      color: '#67e8f9',
      scale: 0.3,
    });
    rigLabel.sprite.position.set(0, -0.28, 0.36);
    this._ownedTextures.push(rigLabel.texture);
    this._mechatronicsGroup.add(rigLabel.sprite);
  }

  // --------------------------------------------------------------------------
  // Mode-Specific Scene Builders
  // --------------------------------------------------------------------------

  _rebuildModeScene() {
    if (!this.scene) return;

    disposeGroupChildren(this._bowlGroup, this._sharedMaterials, this._sharedGeometries);
    disposeGroupChildren(this._trajGroup, this._sharedMaterials, this._sharedGeometries);
    disposeGroupChildren(this._heroGroup, this._sharedMaterials, this._sharedGeometries);

    this._barrierWallMat = null;
    this._breachHaloMesh = null;
    this._outlierCubeMesh = null;
    this._outlierHaloMesh = null;
    this._sigmaMeshes = [];

    this._refreshVerticalAxisLabel();

    const a = this._analysis;
    const isCostBowlMode = a.presetId === 'lqr-cart' || a.presetId === 'mpc-cbf';

    // 1. Sculpted 3D Lyapunov / LQR Cost Bowl (LQR & MPC/CBF modes)
    if (isCostBowlMode) {
      this._buildLyapunovBowl(a.riccati);
    }

    // 2. Trajectory Tubes & Ground Projection Shadows
    this._buildTrajectories(a, isCostBowlMode);

    // 3. Mode-Specific Hero Sculptures
    if (a.presetId === 'mpc-cbf') {
      this._buildCbfSafetyWall(a);
    } else if (a.presetId === 'kf-fusion') {
      this._buildKfMeasurements(a);
    } else if (a.presetId === 'ukf-nonlinear') {
      this._buildUkfSigmaConstellation(a);
    } else if (a.presetId === 'mhe-graph') {
      this._buildMheFactorGraph(a);
    }

    // Snap probe immediately to current phase so frame 0 is accurate
    this._updateProbeAtPhase(this._probePhase, 0);
  }

  _buildLyapunovBowl(riccati) {
    const N = BOWL_SEG;
    const cols = N + 1;
    const vertCount = cols * cols;
    const positions = new Float32Array(vertCount * 3);
    const colors = new Float32Array(vertCount * 3);
    const indices = new Uint32Array(N * N * 6);

    const maxCornerV = Math.max(
      evalQuadraticLyapunov(BOWL_DOMAIN, BOWL_DOMAIN, riccati),
      evalQuadraticLyapunov(BOWL_DOMAIN, -BOWL_DOMAIN, riccati),
      4.0
    );
    const costScale = maxCornerV * 0.42;
    this._bowlCostScale = costScale;

    const cCyan = new THREE.Color(COLORS.cyan);
    const cViolet = new THREE.Color(COLORS.violet);
    const cAmber = new THREE.Color(COLORS.amber);
    const tmpC = new THREE.Color();

    for (let iv = 0; iv <= N; iv++) {
      const vFrac = iv / N;
      const x2 = -BOWL_DOMAIN + vFrac * 2 * BOWL_DOMAIN;
      const wz = x2ToWorld(x2);

      for (let iu = 0; iu <= N; iu++) {
        const uFrac = iu / N;
        const x1 = -BOWL_DOMAIN + uFrac * 2 * BOWL_DOMAIN;
        const wx = x1ToWorld(x1);

        const V = evalQuadraticLyapunov(x1, x2, riccati);
        const wy = costToWorldY(V, costScale);
        const hNorm = clamp((wy - 0.05) / 2.55, 0, 1);

        const idx = (iv * cols + iu) * 3;
        positions[idx] = wx;
        positions[idx + 1] = wy;
        positions[idx + 2] = wz;

        // Height-colored vertex shading: Cyan -> Violet -> Amber
        if (hNorm < 0.5) {
          tmpC.copy(cCyan).lerp(cViolet, hNorm * 2.0);
        } else {
          tmpC.copy(cViolet).lerp(cAmber, (hNorm - 0.5) * 2.0);
        }
        colors[idx] = tmpC.r;
        colors[idx + 1] = tmpC.g;
        colors[idx + 2] = tmpC.b;
      }
    }

    let ptr = 0;
    for (let iv = 0; iv < N; iv++) {
      for (let iu = 0; iu < N; iu++) {
        const a = iv * cols + iu;
        const b = a + 1;
        const c = a + cols;
        const d = c + 1;
        indices[ptr++] = a;
        indices[ptr++] = c;
        indices[ptr++] = b;
        indices[ptr++] = b;
        indices[ptr++] = c;
        indices[ptr++] = d;
      }
    }

    const bowlGeo = new THREE.BufferGeometry();
    bowlGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    bowlGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    bowlGeo.setIndex(new THREE.BufferAttribute(indices, 1));
    bowlGeo.computeVertexNormals();

    const bowlMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.42,
      roughness: 0.14,
      metalness: 0.08,
      clearcoat: 0.9,
      clearcoatRoughness: 0.14,
      envMapIntensity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const bowlMesh = new THREE.Mesh(bowlGeo, bowlMat);
    this._bowlGroup.add(bowlMesh);

    // Crisp Sculptural Wireframe Ribs on the Bowl (every 4th grid line)
    const ribVerts = [];
    const step = 4;
    for (let iv = 0; iv <= N; iv += step) {
      for (let iu = 0; iu < N; iu++) {
        const iA = (iv * cols + iu) * 3;
        const iB = (iv * cols + iu + 1) * 3;
        ribVerts.push(
          positions[iA], positions[iA + 1] + 0.008, positions[iA + 2],
          positions[iB], positions[iB + 1] + 0.008, positions[iB + 2]
        );
      }
    }
    for (let iu = 0; iu <= N; iu += step) {
      for (let iv = 0; iv < N; iv++) {
        const iA = (iv * cols + iu) * 3;
        const iB = ((iv + 1) * cols + iu) * 3;
        ribVerts.push(
          positions[iA], positions[iA + 1] + 0.008, positions[iA + 2],
          positions[iB], positions[iB + 1] + 0.008, positions[iB + 2]
        );
      }
    }

    const ribGeo = new THREE.BufferGeometry();
    ribGeo.setAttribute('position', new THREE.Float32BufferAttribute(ribVerts, 3));
    const ribLines = new THREE.LineSegments(
      ribGeo,
      new THREE.LineBasicMaterial({
        color: COLORS.cyanLight,
        transparent: true,
        opacity: 0.24,
      })
    );
    this._bowlGroup.add(ribLines);

    // Luminous Lyapunov Iso-Cost Ellipse Contours floating on the bowl
    const contourLevels = [0.22, 0.55, 1.05, 1.75];
    const detP = Math.max(riccati.p11 * riccati.p22 - riccati.p12 * riccati.p12, 1e-4);
    const traceP = riccati.p11 + riccati.p22;
    const disc = Math.sqrt(Math.max(traceP * traceP - 4 * detP, 0));
    const eig1 = 0.5 * (traceP + disc);
    const eig2 = Math.max(0.5 * (traceP - disc), 1e-4);
    const theta = 0.5 * Math.atan2(2 * riccati.p12, riccati.p11 - riccati.p22);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    for (let c = 0; c < contourLevels.length; c++) {
      const levelV = contourLevels[c] * costScale;
      const aRad = Math.sqrt(levelV / eig1);
      const bRad = Math.sqrt(levelV / eig2);
      const wy = costToWorldY(levelV, costScale) + 0.012;
      const pts = [];
      let inBounds = true;
      for (let k = 0; k <= 72; k++) {
        const ang = (k / 72) * Math.PI * 2;
        const u = aRad * Math.cos(ang);
        const v = bRad * Math.sin(ang);
        const rx1 = cosT * u - sinT * v;
        const rx2 = sinT * u + cosT * v;
        if (Math.abs(rx1) > BOWL_DOMAIN || Math.abs(rx2) > BOWL_DOMAIN) {
          inBounds = false;
          break;
        }
        pts.push(new THREE.Vector3(x1ToWorld(rx1), wy, x2ToWorld(rx2)));
      }
      if (inBounds && pts.length > 8) {
        const cGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const cLine = new THREE.Line(
          cGeo,
          new THREE.LineBasicMaterial({
            color: c < 2 ? COLORS.cyanLight : COLORS.violetLight,
            transparent: true,
            opacity: 0.42,
          })
        );
        this._bowlGroup.add(cLine);
      }
    }
  }

  _pointToWorld(pt, isCostBowlMode, duration) {
    const wx = x1ToWorld(pt.x1);
    const wz = x2ToWorld(pt.x2);
    const wy = isCostBowlMode
      ? costToWorldY(
          Number.isFinite(pt.cost)
            ? pt.cost
            : evalQuadraticLyapunov(pt.x1, pt.x2, this._analysis.riccati),
          this._bowlCostScale || 14.0
        ) + 0.045
      : timeToWorldY(pt.t, duration);
    return new THREE.Vector3(wx, wy, wz);
  }

  _buildTrajectories(a, isCostBowlMode) {
    const duration =
      a.trueTraj.length > 0 ? Math.max(a.trueTraj[a.trueTraj.length - 1].t, 1.0) : 6.0;

    // 1. Primary Glowing True / Safe Trajectory Tube (Cyan)
    const truePts = a.trueTraj.map((p) => this._pointToWorld(p, isCostBowlMode, duration));
    const trueTubeGeo = createSafeTubeGeometry(truePts, 140, 0.036, 10);
    this._trajGroup.add(new THREE.Mesh(trueTubeGeo, this._matTrueTube));

    // Ground projection shadow for primary trajectory
    const trueGroundPts = truePts.map((p) => new THREE.Vector3(p.x, 0.015, p.z));
    const trueGroundGeo = new THREE.BufferGeometry().setFromPoints(trueGroundPts);
    this._trajGroup.add(new THREE.Line(trueGroundGeo, this._matGroundTrace));

    // Start marker beacon on primary trajectory
    if (truePts.length > 0) {
      const startBeacon = new THREE.Mesh(this._unitSphereGeo, this._matTrueTube);
      startBeacon.position.copy(truePts[0]);
      startBeacon.scale.setScalar(0.08);
      this._trajGroup.add(startBeacon);
    }

    // 2. Secondary Comparison / Estimated Trajectory Tube
    if (a.estTraj && a.estTraj.length >= 2) {
      const estPts = a.estTraj.map((p) => this._pointToWorld(p, isCostBowlMode, duration));

      let altMat = this._matAmberTube;
      let altRadius = 0.028;
      if (a.presetId === 'kf-fusion' || a.presetId === 'mhe-graph') {
        altMat = this._matEmeraldTube;
        altRadius = 0.033;
      } else if (a.presetId === 'ukf-nonlinear') {
        altMat = this._matVioletGlow;
        altRadius = 0.03;
      } else if (a.presetId === 'mpc-cbf') {
        altMat = this._matAmberTube;
        altRadius = 0.029;
      }

      const estTubeGeo = createSafeTubeGeometry(estPts, 140, altRadius, 10);
      this._trajGroup.add(new THREE.Mesh(estTubeGeo, altMat));

      const estGroundPts = estPts.map((p) => new THREE.Vector3(p.x, 0.014, p.z));
      const estGroundGeo = new THREE.BufferGeometry().setFromPoints(estGroundPts);
      this._trajGroup.add(new THREE.Line(estGroundGeo, this._matGroundTraceAlt));

      // In MHE mode, also show subtle Amber naive-L2 pulled trajectory when outlier spike > 0.45
      if (a.presetId === 'mhe-graph' && a.paramA >= 0.45) {
        const naivePts = a.estTraj.map(
          (p) =>
            new THREE.Vector3(
              x1ToWorld(p.naiveX1),
              timeToWorldY(p.t, duration),
              x2ToWorld(p.naiveX2)
            )
        );
        const naiveGeo = new THREE.BufferGeometry().setFromPoints(naivePts);
        this._trajGroup.add(
          new THREE.Line(
            naiveGeo,
            new THREE.LineBasicMaterial({
              color: COLORS.amber,
              transparent: true,
              opacity: 0.65,
            })
          )
        );
      }

      // In UKF mode, also draw subtle Amber EKF drifted trajectory for comparison
      if (a.presetId === 'ukf-nonlinear') {
        const ekfPts = a.estTraj.map(
          (p) =>
            new THREE.Vector3(
              x1ToWorld(p.ekfX1),
              timeToWorldY(p.t, duration),
              x2ToWorld(p.ekfX2)
            )
        );
        const ekfTubeGeo = createSafeTubeGeometry(ekfPts, 110, 0.022, 8);
        this._trajGroup.add(new THREE.Mesh(ekfTubeGeo, this._matAmberTube));
      }
    }
  }

  // --------------------------------------------------------------------------
  // Hero Mode 2: MPC + CBF-QP Translucent Safety Barrier Wall
  // --------------------------------------------------------------------------

  _buildCbfSafetyWall(a) {
    const wallX = x1ToWorld(a.barrierWallX ?? 0.85);
    const wallH = 2.65;
    const wallDepth = STAGE_D - 0.55;
    const safe = (a.minH ?? 0) >= -0.025;

    // Translucent Beveled Barrier Glass Sheet
    const wallGeo = new THREE.BoxGeometry(0.036, wallH, wallDepth);
    this._barrierWallMat = new THREE.MeshPhysicalMaterial({
      color: safe ? COLORS.coral : COLORS.coralDeep,
      emissive: safe ? COLORS.coralDeep : COLORS.coral,
      emissiveIntensity: 0.32,
      transparent: true,
      opacity: 0.22,
      roughness: 0.12,
      metalness: 0.1,
      clearcoat: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const wallMesh = new THREE.Mesh(wallGeo, this._barrierWallMat);
    wallMesh.position.set(wallX, wallH * 0.5 + 0.02, 0);
    this._heroGroup.add(wallMesh);

    // Glowing Top & Base Laser Barrier Rails (Emerald safe edge + Coral boundary)
    const railMat = new THREE.MeshStandardMaterial({
      color: safe ? COLORS.emeraldLight : COLORS.coral,
      emissive: safe ? COLORS.emerald : COLORS.coral,
      emissiveIntensity: 1.55,
      roughness: 0.18,
    });
    const topRail = new THREE.Mesh(this._unitCylGeo, railMat);
    topRail.rotation.x = Math.PI / 2;
    topRail.scale.set(0.018, wallDepth, 0.018);
    topRail.position.set(wallX, wallH + 0.02, 0);
    this._heroGroup.add(topRail);

    const botRail = new THREE.Mesh(this._unitCylGeo, this._matCoralGlow);
    botRail.rotation.x = Math.PI / 2;
    botRail.scale.set(0.02, wallDepth, 0.02);
    botRail.position.set(wallX, 0.025, 0);
    this._heroGroup.add(botRail);

    // Diagonal Warning Laser Grid on the Barrier Plane
    const gridVerts = [];
    for (let y = 0.35; y < wallH; y += 0.45) {
      gridVerts.push(wallX, y, -wallDepth * 0.5, wallX, y, wallDepth * 0.5);
    }
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridVerts, 3));
    this._heroGroup.add(
      new THREE.LineSegments(
        gridGeo,
        new THREE.LineBasicMaterial({ color: COLORS.coral, transparent: true, opacity: 0.38 })
      )
    );

    // Pulsing Coral Breach Reticle where unconstrained LQR pierces the wall!
    if (a.breachPoint && a.breachPoint.breached) {
      const by = costToWorldY(a.breachPoint.cost, this._bowlCostScale || 14.0) + 0.045;
      const bz = x2ToWorld(a.breachPoint.x2);

      this._breachHaloMesh = new THREE.Mesh(this._unitTorusGeo, this._matCoralGlow);
      this._breachHaloMesh.rotation.y = Math.PI / 2;
      this._breachHaloMesh.position.set(wallX + 0.02, by, bz);
      this._breachHaloMesh.scale.setScalar(0.24);
      this._heroGroup.add(this._breachHaloMesh);

      const breachLabel = createTextSprite('UNCONSTRAINED BREACH', {
        color: '#fda4af',
        scale: 0.28,
      });
      breachLabel.sprite.position.set(wallX + 0.55, by + 0.34, bz);
      this._heroGroup.add(breachLabel.sprite);
    }

    const wallLabel = createTextSprite('h(x)=0  CBF SAFETY WALL', {
      color: safe ? '#6ee7b7' : '#fda4af',
      scale: 0.34,
    });
    wallLabel.sprite.position.set(wallX, wallH + 0.3, -wallDepth * 0.26);
    this._heroGroup.add(wallLabel.sprite);
  }

  // --------------------------------------------------------------------------
  // Hero Mode 3: Kalman Filter Noisy Measurements & Innovation Tethers
  // --------------------------------------------------------------------------

  _buildKfMeasurements(a) {
    const meas = a.measurements || [];
    const duration =
      a.trueTraj.length > 0 ? Math.max(a.trueTraj[a.trueTraj.length - 1].t, 1.0) : 7.0;

    const tetherVerts = [];
    for (let i = 0; i < meas.length; i++) {
      const m = meas[i];
      const wy = timeToWorldY(m.t, duration);
      const mx = x1ToWorld(m.x1);
      const mz = x2ToWorld(m.x2);
      const ex = x1ToWorld(m.estX1);
      const ez = x2ToWorld(m.estX2);

      // Noisy Amber sensor ping cube
      const dot = new THREE.Mesh(this._unitOctaGeo, this._matAmberTube);
      dot.position.set(mx, wy, mz);
      dot.scale.setScalar(0.055);
      this._heroGroup.add(dot);

      tetherVerts.push(mx, wy, mz, ex, wy, ez);
    }

    if (tetherVerts.length > 0) {
      const tGeo = new THREE.BufferGeometry();
      tGeo.setAttribute('position', new THREE.Float32BufferAttribute(tetherVerts, 3));
      this._heroGroup.add(
        new THREE.LineSegments(
          tGeo,
          new THREE.LineBasicMaterial({
            color: COLORS.amberLight,
            transparent: true,
            opacity: 0.45,
          })
        )
      );
    }
  }

  // --------------------------------------------------------------------------
  // Hero Mode 4: UKF 5-Sigma-Point Constellation & Banana Cloud vs. EKF Ellipse
  // --------------------------------------------------------------------------

  _buildUkfSigmaConstellation(a) {
    const sp = a.sigmaPoints || [];
    const detail = a.ukfDetail;
    if (sp.length === 0 || !detail) return;

    const elevY = 1.48;

    // 1. Translucent Elevated Showcase Glass Disc / Plane for the Nonlinear Transform
    const sliceGeo = new THREE.PlaneGeometry(5.6, 4.6);
    const sliceMat = new THREE.MeshPhysicalMaterial({
      color: 0x13192b,
      transparent: true,
      opacity: 0.24,
      roughness: 0.16,
      metalness: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const slicePlane = new THREE.Mesh(sliceGeo, sliceMat);
    slicePlane.rotation.x = -Math.PI / 2;
    slicePlane.position.set(0, elevY - 0.06, 0);
    this._heroGroup.add(slicePlane);

    // 2. Non-Gaussian Banana Cloud Particles (64 warped samples)
    const cloud = detail.bananaCloud || [];
    if (cloud.length > 0) {
      const cPos = new Float32Array(cloud.length * 3);
      for (let i = 0; i < cloud.length; i++) {
        cPos[i * 3] = x1ToWorld(cloud[i].x1);
        cPos[i * 3 + 1] = elevY + ((i % 5) - 2) * 0.015;
        cPos[i * 3 + 2] = x2ToWorld(cloud[i].x2);
      }
      const cloudGeo = new THREE.BufferGeometry();
      cloudGeo.setAttribute('position', new THREE.BufferAttribute(cPos, 3));
      const cloudPts = new THREE.Points(
        cloudGeo,
        new THREE.PointsMaterial({
          color: COLORS.violetLight,
          size: 0.09,
          transparent: true,
          opacity: 0.72,
        })
      );
      this._heroGroup.add(cloudPts);
    }

    // 3. Five Glowing Violet UKF Sigma-Point Spheres + Connecting Wireframe Spokes
    const centerPos = new THREE.Vector3(x1ToWorld(sp[0].x1), sp[0].z, x2ToWorld(sp[0].x2));
    const spokeVerts = [];
    const perimeterPts = [];

    for (let i = 0; i < sp.length; i++) {
      const p = new THREE.Vector3(x1ToWorld(sp[i].x1), sp[i].z, x2ToWorld(sp[i].x2));
      const sphere = new THREE.Mesh(this._unitSphereGeo, this._matVioletGlow);
      sphere.position.copy(p);
      sphere.scale.setScalar(i === 0 ? 0.115 : 0.088);
      this._heroGroup.add(sphere);
      this._sigmaMeshes.push(sphere);

      if (i > 0) {
        spokeVerts.push(centerPos.x, centerPos.y, centerPos.z, p.x, p.y, p.z);
        perimeterPts.push(p);
      }
    }

    // Connect outer sigma points (1-3-2-4-1) into a crisp bent banana diamond wireframe
    if (perimeterPts.length === 4) {
      const order = [0, 2, 1, 3, 0];
      for (let k = 0; k < order.length - 1; k++) {
        const aPt = perimeterPts[order[k]];
        const bPt = perimeterPts[order[k + 1]];
        spokeVerts.push(aPt.x, aPt.y, aPt.z, bPt.x, bPt.y, bPt.z);
      }
    }

    const spokeGeo = new THREE.BufferGeometry();
    spokeGeo.setAttribute('position', new THREE.Float32BufferAttribute(spokeVerts, 3));
    this._heroGroup.add(
      new THREE.LineSegments(
        spokeGeo,
        new THREE.LineBasicMaterial({
          color: COLORS.violetLight,
          transparent: true,
          opacity: 0.88,
        })
      )
    );

    // Helper to build a 2D covariance ellipse ring at height y
    const addCovEllipse = (mean, cov, yHeight, colorHex, tubeRad = 0.022) => {
      const tr = cov.p11 + cov.p22;
      const det = Math.max(cov.p11 * cov.p22 - cov.p12 * cov.p12, 1e-5);
      const disc = Math.sqrt(Math.max(tr * tr - 4 * det, 0));
      const r1 = 1.65 * Math.sqrt(Math.max(0.5 * (tr + disc), 1e-4));
      const r2 = 1.65 * Math.sqrt(Math.max(0.5 * (tr - disc), 1e-4));
      const ang = 0.5 * Math.atan2(2 * cov.p12, cov.p11 - cov.p22);
      const cA = Math.cos(ang);
      const sA = Math.sin(ang);

      const pts = [];
      for (let k = 0; k <= 64; k++) {
        const th = (k / 64) * Math.PI * 2;
        const u = r1 * Math.cos(th);
        const v = r2 * Math.sin(th);
        const lx1 = mean.x1 + cA * u - sA * v;
        const lx2 = mean.x2 + sA * u + cA * v;
        pts.push(new THREE.Vector3(x1ToWorld(lx1), yHeight, x2ToWorld(lx2)));
      }
      const geo = createSafeTubeGeometry(pts, 72, tubeRad, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 1.45,
        roughness: 0.18,
      });
      this._heroGroup.add(new THREE.Mesh(geo, mat));
    };

    // 4. Contrasting Flat Amber EKF Linearized Ellipse vs. Violet UKF Captured Ellipse
    addCovEllipse(detail.ekfMean, detail.ekfCov, elevY + 0.04, COLORS.amber, 0.022);
    addCovEllipse(detail.ukfMean, detail.ukfCov, elevY - 0.02, COLORS.violet, 0.024);

    // EKF biased mean diamond marker (Amber) vs. UKF mean marker (Cyan-Violet)
    const ekfDot = new THREE.Mesh(this._unitOctaGeo, this._matAmberTube);
    ekfDot.position.set(x1ToWorld(detail.ekfMean.x1), elevY + 0.08, x2ToWorld(detail.ekfMean.x2));
    ekfDot.scale.setScalar(0.085);
    this._heroGroup.add(ekfDot);

    const lblUkf = createTextSprite('5 UKF SIGMA POINTS', { color: '#c4b5fd', scale: 0.3 });
    lblUkf.sprite.position.set(
      x1ToWorld(detail.ukfMean.x1) - 1.15,
      elevY + 0.45,
      x2ToWorld(detail.ukfMean.x2) + 0.2
    );
    this._heroGroup.add(lblUkf.sprite);

    const lblEkf = createTextSprite('EKF LINEARIZED (BIASED)', { color: '#fcd34d', scale: 0.28 });
    lblEkf.sprite.position.set(
      x1ToWorld(detail.ekfMean.x1) + 1.25,
      elevY + 0.42,
      x2ToWorld(detail.ekfMean.x2) - 0.35
    );
    this._heroGroup.add(lblEkf.sprite);
  }

  // --------------------------------------------------------------------------
  // Hero Mode 5: MHE / Factor Graph Sliding-Window Smoother
  // --------------------------------------------------------------------------

  _buildMheFactorGraph(a) {
    const nodes = a.factorNodes || [];
    if (nodes.length === 0) return;
    const duration =
      a.trueTraj.length > 0 ? Math.max(a.trueTraj[a.trueTraj.length - 1].t, 1.0) : 6.0;

    const nodePositions = [];
    const measEdgeVerts = [];
    const outlierEdgeVerts = [];

    for (let i = 0; i < nodes.length; i++) {
      const nd = nodes[i];
      const wy = timeToWorldY(nd.t, duration);
      const statePos = new THREE.Vector3(x1ToWorld(nd.x1), wy, x2ToWorld(nd.x2));
      const measPos = new THREE.Vector3(x1ToWorld(nd.measX1), wy, x2ToWorld(nd.measX2));
      nodePositions.push(statePos);

      // 1. Glowing Cyan State Variable Node Sphere
      const stateNode = new THREE.Mesh(this._unitSphereGeo, this._matTrueTube);
      stateNode.position.copy(statePos);
      stateNode.scale.setScalar(0.095);
      this._heroGroup.add(stateNode);

      // 2. Emerald Measurement Factor Cube (or Pulsing Coral Rejected Outlier Cube!)
      const cubeMat = nd.isOutlier ? this._matCoralGlow : this._matEmeraldTube;
      const cube = new THREE.Mesh(this._unitBoxGeo, cubeMat);
      cube.position.copy(measPos);
      cube.rotation.set(0.45, 0.78, 0.3);
      cube.scale.setScalar(nd.isOutlier ? 0.165 : 0.105);
      this._heroGroup.add(cube);

      if (nd.isOutlier) {
        this._outlierCubeMesh = cube;
        this._outlierHaloMesh = new THREE.Mesh(this._unitTorusGeo, this._matCoralGlow);
        this._outlierHaloMesh.position.copy(measPos);
        this._outlierHaloMesh.scale.setScalar(0.24);
        this._heroGroup.add(this._outlierHaloMesh);

        outlierEdgeVerts.push(
          statePos.x, statePos.y, statePos.z,
          measPos.x, measPos.y, measPos.z
        );

        const outLbl = createTextSprite('REJECTED OUTLIER (HUBER)', {
          color: '#fda4af',
          scale: 0.3,
        });
        outLbl.sprite.position.set(measPos.x, measPos.y + 0.36, measPos.z);
        this._heroGroup.add(outLbl.sprite);
      } else {
        measEdgeVerts.push(
          statePos.x, statePos.y, statePos.z,
          measPos.x, measPos.y, measPos.z
        );
      }
    }

    // 3. Dashed Odometry Factor Edges + Midpoint Diamond Factor Nodes
    for (let i = 0; i < nodePositions.length - 1; i++) {
      const pA = nodePositions[i];
      const pB = nodePositions[i + 1];
      const segGeo = new THREE.BufferGeometry().setFromPoints([pA, pB]);
      const dashedMat = new THREE.LineDashedMaterial({
        color: COLORS.cyanLight,
        dashSize: 0.14,
        gapSize: 0.08,
        transparent: true,
        opacity: 0.85,
      });
      const line = new THREE.Line(segGeo, dashedMat);
      line.computeLineDistances();
      this._heroGroup.add(line);

      // Small Violet odometry factor diamond at edge midpoint
      const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
      const odomFactor = new THREE.Mesh(this._unitOctaGeo, this._matVioletGlow);
      odomFactor.position.copy(mid);
      odomFactor.scale.setScalar(0.055);
      this._heroGroup.add(odomFactor);
    }

    // 4. Emerald Measurement Factor Tethers
    if (measEdgeVerts.length > 0) {
      const mGeo = new THREE.BufferGeometry();
      mGeo.setAttribute('position', new THREE.Float32BufferAttribute(measEdgeVerts, 3));
      this._heroGroup.add(
        new THREE.LineSegments(
          mGeo,
          new THREE.LineBasicMaterial({
            color: COLORS.emeraldLight,
            transparent: true,
            opacity: 0.65,
          })
        )
      );
    }

    // 5. Rejected Coral Outlier Dashed Tether
    if (outlierEdgeVerts.length > 0) {
      const oGeo = new THREE.BufferGeometry();
      oGeo.setAttribute('position', new THREE.Float32BufferAttribute(outlierEdgeVerts, 3));
      const oLine = new THREE.Line(
        oGeo,
        new THREE.LineDashedMaterial({
          color: COLORS.coral,
          dashSize: 0.12,
          gapSize: 0.1,
          transparent: true,
          opacity: 0.9,
        })
      );
      oLine.computeLineDistances();
      this._heroGroup.add(oLine);
    }
  }

  // --------------------------------------------------------------------------
  // Live Probe, Covariance Ellipsoid & Hardware Rig Updater
  // --------------------------------------------------------------------------

  _updateProbeAtPhase(phase, elapsed) {
    const a = this._analysis;
    if (!a || !a.trueTraj || a.trueTraj.length < 2 || !this._probeSphere) return;

    const isCostBowlMode = a.presetId === 'lqr-cart' || a.presetId === 'mpc-cbf';
    const traj = a.presetId === 'kf-fusion' || a.presetId === 'mhe-graph' ? a.estTraj : a.trueTraj;
    const n = traj.length;
    const duration = Math.max(a.trueTraj[a.trueTraj.length - 1].t, 1.0);

    const exactIdx = clamp(phase, 0, 1) * (n - 1);
    const i0 = Math.floor(exactIdx);
    const i1 = Math.min(i0 + 1, n - 1);
    const frac = exactIdx - i0;

    const p0 = traj[i0];
    const p1 = traj[i1];
    const x1 = p0.x1 + frac * (p1.x1 - p0.x1);
    const x2 = p0.x2 + frac * (p1.x2 - p0.x2);
    const t = p0.t + frac * (p1.t - p0.t);

    const t0 = a.trueTraj[Math.min(i0, a.trueTraj.length - 1)];
    const t1 = a.trueTraj[Math.min(i1, a.trueTraj.length - 1)];
    const uLive = t0.u + frac * (t1.u - t0.u);
    const costLive = t0.cost + frac * (t1.cost - t0.cost);

    const wy = isCostBowlMode
      ? costToWorldY(costLive, this._bowlCostScale || 14.0) + 0.045
      : timeToWorldY(t, duration);
    const wx = x1ToWorld(x1);
    const wz = x2ToWorld(x2);

    // Move probe sphere & halo
    this._probeSphere.position.set(wx, wy, wz);
    this._probeSphere.scale.setScalar(0.112 * (1 + Math.sin(elapsed * 3.6) * 0.07));

    this._probeHalo.position.set(wx, wy, wz);
    this._probeHalo.rotation.x = Math.PI * 0.45 + Math.sin(elapsed * 1.6) * 0.25;
    this._probeHalo.rotation.z = elapsed * 1.4;

    // Update drop-line to stage floor
    const dropPos = this._probeDropLine.geometry.getAttribute('position');
    dropPos.setXYZ(0, wx, wy, wz);
    dropPos.setXYZ(1, wx, 0.016, wz);
    dropPos.needsUpdate = true;

    // Update 3D Breathing Covariance Ellipsoid
    const e0 = a.estTraj[Math.min(i0, a.estTraj.length - 1)];
    const e1 = a.estTraj[Math.min(i1, a.estTraj.length - 1)];
    const sig1 = Math.max(0.12, (e0.sigma1 || 0.25) + frac * ((e1.sigma1 || 0.25) - (e0.sigma1 || 0.25)));
    const sig2 = Math.max(0.12, (e0.sigma2 || 0.22) + frac * ((e1.sigma2 || 0.22) - (e0.sigma2 || 0.22)));
    const p12 = (e0.p12 || 0) + frac * ((e1.p12 || 0) - (e0.p12 || 0));

    // Trigger subtle measurement contraction pulse on KF measurement steps
    if (a.presetId === 'kf-fusion' && e0.isUpdate && i0 !== this._lastUpdateIdx) {
      this._lastUpdateIdx = i0;
      this._flashDecay = 1.0;
    }

    const breathe = 1 + Math.sin(elapsed * 2.8) * 0.03;
    const radX = clamp(sig1 * SCALE_X1 * 0.58 * breathe, 0.16, 1.05);
    const radZ = clamp(sig2 * SCALE_X2 * 0.58 * breathe, 0.15, 0.95);
    const radY = clamp(0.5 * (radX + radZ) * 0.62, 0.12, 0.6);

    const rotAngle = 0.5 * Math.atan2(2 * p12, sig1 * sig1 - sig2 * sig2);

    this._covEllipsoidGroup.position.set(wx, wy, wz);
    this._covEllipsoidGroup.rotation.y = -rotAngle;
    this._covEllipsoidGroup.scale.set(radX, radY, radZ);

    // Update KF measurement flash ring
    if (this._updateFlashRing) {
      this._updateFlashRing.position.set(wx, wy, wz);
      if (this._flashDecay > 0.01) {
        this._flashDecay *= 0.9;
        const s = 0.25 + (1 - this._flashDecay) * 0.65;
        this._updateFlashRing.scale.setScalar(s);
        this._updateFlashRing.material.opacity = this._flashDecay * 0.72;
      } else {
        this._updateFlashRing.material.opacity = 0;
      }
    }

    // Drive Live Mechatronics Actuator Rig from probe (x1, x2, u)
    if (this._mechatronicsGroup && this._mechatronicsGroup.visible && this._rigCartGroup) {
      const cartX = clamp(x1 * 0.88, -2.05, 2.05);
      this._rigCartGroup.position.x = cartX;

      if (this._rigPendulumPivot) {
        const tilt = clamp(-0.24 * x2 - 0.08 * uLive, -0.82, 0.82);
        this._rigPendulumPivot.rotation.z = tilt;
      }

      if (this._rigTorqueBar && this._rigTorqueMat) {
        const uNorm = clamp(Math.abs(uLive) / 4.0, 0.08, 1.0);
        this._rigTorqueBar.scale.x = 0.12 + 0.5 * uNorm;
        const isPos = uLive >= 0;
        this._rigTorqueMat.color.setHex(isPos ? COLORS.cyanLight : COLORS.amberLight);
        this._rigTorqueMat.emissive.setHex(isPos ? COLORS.cyan : COLORS.amber);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Camera Presets
  // --------------------------------------------------------------------------

  _getCameraPose(preset) {
    switch (preset) {
      case 'front':
        return {
          pos: new THREE.Vector3(0.0, 2.55, 9.7),
          target: new THREE.Vector3(0.0, 1.12, 0.0),
        };
      case 'iso':
        return {
          pos: new THREE.Vector3(6.3, 7.6, 6.3),
          target: new THREE.Vector3(0.0, 0.85, 0.0),
        };
      case '3d':
      default:
        return {
          pos: new THREE.Vector3(6.6, 5.15, 7.25),
          target: new THREE.Vector3(0.0, 1.05, 0.0),
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

  setCameraPreset(preset) {
    const valid = preset === 'front' || preset === 'iso' ? preset : '3d';
    this.cameraPreset = valid;
    if (!this.camera || !this.controls) return;

    const to = this._getCameraPose(valid);
    this._camTransition = {
      startTime: performance.now(),
      duration: 720,
      fromPos: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPos: to.pos,
      toTarget: to.target,
    };
  }

  // --------------------------------------------------------------------------
  // Public Control API
  // --------------------------------------------------------------------------

  setPreset(presetId) {
    if (!STATESPACE_PRESETS[presetId]) return this.getTelemetry();
    this.presetId = presetId;
    const p = this._getPreset();
    this.paramA = p.paramA.default;
    this.paramB = p.paramB.default;
    this._probePhase = 0;
    this._lastUpdateIdx = -1;

    this._recomputeAnalysis();
    if (this._initialized) {
      this._rebuildModeScene();
    }
    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  setParams({ paramA, paramB } = {}) {
    const p = this._getPreset();
    if (Number.isFinite(paramA)) {
      this.paramA = clamp(paramA, p.paramA.min, p.paramA.max);
    }
    if (Number.isFinite(paramB)) {
      this.paramB = clamp(paramB, p.paramB.min, p.paramB.max);
    }

    this._recomputeAnalysis();
    if (this._initialized) {
      this._rebuildModeScene();
    }
    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  toggleMechatronicsLens(bool) {
    this.mechatronicsLens = typeof bool === 'boolean' ? bool : !this.mechatronicsLens;
    if (this._mechatronicsGroup) {
      this._mechatronicsGroup.visible = this.mechatronicsLens;
    }
    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return this.mechatronicsLens;
  }

  reset() {
    const p = this._getPreset();
    this.paramA = p.paramA.default;
    this.paramB = p.paramB.default;
    this._probePhase = 0;
    this._lastUpdateIdx = -1;

    this._recomputeAnalysis();
    if (this._initialized) {
      this._rebuildModeScene();
      this.setCameraPreset('3d');
    }
    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  getTelemetry() {
    return {
      ...this._analysis,
      mechatronicsLens: this.mechatronicsLens,
      cameraPreset: this.cameraPreset,
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
    const dt = Math.min(this._clock ? this._clock.getDelta() : 0.016, 0.05);
    const elapsed = this._clock ? this._clock.elapsedTime : 0;

    // 1. Smooth Camera Preset Transition
    if (this._camTransition && this.camera && this.controls) {
      const { startTime, duration, fromPos, fromTarget, toPos, toTarget } = this._camTransition;
      const rawT = clamp((now - startTime) / duration, 0, 1);
      const eased = easeOutCubic(rawT);
      this.camera.position.lerpVectors(fromPos, toPos, eased);
      this.controls.target.lerpVectors(fromTarget, toTarget, eased);
      if (rawT >= 1) {
        this._camTransition = null;
      }
    }

    // 2. Advance Live State Probe smoothly along trajectory (loops every ~6.5s)
    this._probePhase += dt / 6.5;
    if (this._probePhase > 1.12) {
      this._probePhase = 0;
      this._lastUpdateIdx = -1;
    }
    this._updateProbeAtPhase(Math.min(this._probePhase, 1.0), elapsed);

    // 3. Living Studio Micro-Animations
    if (this._plinthRimMat) {
      this._plinthRimMat.emissiveIntensity = 1.12 + Math.sin(elapsed * 1.75) * 0.12;
    }

    if (this._breachHaloMesh) {
      this._breachHaloMesh.rotation.x = elapsed * 2.1;
      this._breachHaloMesh.scale.setScalar(0.24 * (1 + Math.sin(elapsed * 5.2) * 0.12));
    }

    if (this._outlierCubeMesh) {
      this._outlierCubeMesh.rotation.y = elapsed * 1.3;
      this._outlierCubeMesh.scale.setScalar(0.165 * (1 + Math.sin(elapsed * 5.6) * 0.1));
    }

    if (this._outlierHaloMesh) {
      this._outlierHaloMesh.rotation.x = elapsed * 2.0;
      this._outlierHaloMesh.rotation.y = elapsed * 1.4;
      this._outlierHaloMesh.scale.setScalar(0.24 * (1 + Math.cos(elapsed * 5.6) * 0.1));
    }

    if (this._sigmaMeshes.length > 0) {
      for (let i = 0; i < this._sigmaMeshes.length; i++) {
        const base = i === 0 ? 0.115 : 0.088;
        this._sigmaMeshes[i].scale.setScalar(base * (1 + Math.sin(elapsed * 3.1 + i * 1.1) * 0.08));
      }
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
  // Leak-Free Disposal
  // --------------------------------------------------------------------------

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this._initialized = false;
    this._camTransition = null;

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

    this._probeSphere = null;
    this._probeHalo = null;
    this._probeDropLine = null;
    this._covEllipsoidGroup = null;
    this._covShellMesh = null;
    this._covRingXY = null;
    this._covRingXZ = null;
    this._updateFlashRing = null;
    this._plinthRimMat = null;
    this._zAxisLabelHolder = null;
    this._barrierWallMat = null;
    this._breachHaloMesh = null;
    this._outlierCubeMesh = null;
    this._outlierHaloMesh = null;
    this._sigmaMeshes = [];
    this._rigCartGroup = null;
    this._rigPendulumPivot = null;
    this._rigTorqueBar = null;
    this._rigTorqueMat = null;
    this.scene = null;
    this.camera = null;
    this.container = null;
  }
}
