/**
 * EIGENLAB — Interactive 3D Robot Kinematics, Jacobians & IK Studio
 * Covers 2R Planar DH/MDH & Manipulability, 4-DOF SCARA (RRP Prismatic Quill),
 * 3R Spatial Product of Exponentials (SE(3)), Singularity & Damped Least Squares (DLS) IK,
 * and Redundant 3R Nullspace / QP-IK with Joint Limits & Obstacle Avoidance.
 * Spline-quality Three.js WebGL visualization module (ES Modules).
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ============================================================================
// 1. ROBOT KINEMATICS PRESETS
// ============================================================================

export const KINEMATICS_PRESETS = {
  'planar-2r': {
    id: 'planar-2r',
    name: '2R Planar (DH/MDH)',
    shortName: '2R DH',
    formulaLatex: 'T_2^0 = T_1^0(\\theta_1)\\,T_2^1(\\theta_2),\\;\\; \\det J = L_1 L_2 \\sin\\theta_2',
    paramALabel: 'Joint θ₁ (deg)',
    paramA: { min: -135, max: 135, step: 1, default: 32 },
    paramBLabel: 'Joint θ₂ (deg)',
    paramB: { min: -165, max: 165, step: 1, default: 62 },
  },
  'scara-rrp': {
    id: 'scara-rrp',
    name: 'SCARA (RRP)',
    shortName: 'SCARA',
    formulaLatex: 'z = d_1 - d_3,\\;\\; (x,y) = (L_1 c_1 + L_2 c_{12},\\; L_1 s_1 + L_2 s_{12})',
    paramALabel: 'Elbow θ₂ (deg)',
    paramA: { min: -140, max: 140, step: 1, default: 55 },
    paramBLabel: 'Quill d₃ (m)',
    paramB: { min: 0.1, max: 1.4, step: 0.05, default: 0.55 },
  },
  'poe-3r': {
    id: 'poe-3r',
    name: '3R Spatial (PoE)',
    shortName: 'PoE 3R',
    formulaLatex: 'T(\\theta) = e^{[\\mathcal{S}_1]\\theta_1}\\,e^{[\\mathcal{S}_2]\\theta_2}\\,e^{[\\mathcal{S}_3]\\theta_3}\\,M \\in SE(3)',
    paramALabel: 'Base Yaw θ₁ (°)',
    paramA: { min: -160, max: 160, step: 1, default: 35 },
    paramBLabel: 'Shoulder θ₂ (°)',
    paramB: { min: -75, max: 75, step: 1, default: 28 },
  },
  'ik-dls': {
    id: 'ik-dls',
    name: 'DLS Singularity IK',
    shortName: 'DLS IK',
    formulaLatex: '\\Delta\\theta = J^T(JJ^T + \\lambda^2 I)^{-1}\\,e',
    paramALabel: 'Target Reach r',
    paramA: { min: 0.9, max: 3.6, step: 0.05, default: 2.95 },
    paramBLabel: 'Damping λ',
    paramB: { min: 0.01, max: 0.80, step: 0.01, default: 0.18 },
  },
  'qp-ik-3r': {
    id: 'qp-ik-3r',
    name: 'QP-IK Redundant',
    shortName: 'QP-IK',
    formulaLatex: '\\min_{\\dot{q}}\\|J\\dot{q}-v^*\\|^2+\\lambda\\|\\dot{q}\\|^2 \\;\\text{s.t. } q_{\\min}\\le q+\\dot{q}\\Delta t\\le q_{\\max}',
    paramALabel: 'Target X',
    paramA: { min: -2.2, max: 2.6, step: 0.05, default: 1.55 },
    paramBLabel: 'Posture Weight w₀',
    paramB: { min: 0.0, max: 2.0, step: 0.05, default: 0.65 },
  },
};

// ============================================================================
// 2. PURE DETERMINISTIC ROBOTICS MATH ENGINE (DH, PoE SE(3), SVD, DLS, QP-IK)
// ============================================================================

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function easeOutCubic(t) {
  const inv = 1 - clamp(t, 0, 1);
  return 1 - inv * inv * inv;
}

function v3(x, y, z) {
  return { x, y, z };
}

function v3Add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function v3Sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function v3Scale(a, s) {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}

function v3Dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function v3Cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function v3Norm(a) {
  return Math.hypot(a.x, a.y, a.z);
}

function v3Normalize(a) {
  const n = v3Norm(a);
  if (n < 1e-12) return { x: 0, y: 0, z: 1 };
  return { x: a.x / n, y: a.y / n, z: a.z / n };
}

// Row-major 3x3 rotation matrix helpers
function mat3Identity() {
  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}

function mat3RotZ(theta) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

function mat3Mul(A, B) {
  const C = new Array(9);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      C[r * 3 + c] =
        A[r * 3 + 0] * B[0 * 3 + c] +
        A[r * 3 + 1] * B[1 * 3 + c] +
        A[r * 3 + 2] * B[2 * 3 + c];
    }
  }
  return C;
}

function mat3MulVec(R, p) {
  return {
    x: R[0] * p.x + R[1] * p.y + R[2] * p.z,
    y: R[3] * p.x + R[4] * p.y + R[5] * p.z,
    z: R[6] * p.x + R[7] * p.y + R[8] * p.z,
  };
}

function mat3FromSkew(w) {
  return [0, -w.z, w.y, w.z, 0, -w.x, -w.y, w.x, 0];
}

function mat3AddScaled(A, B, s) {
  const out = new Array(9);
  for (let i = 0; i < 9; i++) out[i] = A[i] + s * B[i];
  return out;
}

/**
 * Rodrigues' formula for SO(3) matrix exponential: exp([w] * theta)
 */
function expSO3(omega, theta) {
  const w = v3Normalize(omega);
  const K = mat3FromSkew(w);
  const K2 = mat3Mul(K, K);
  const I = mat3Identity();
  const s = Math.sin(theta);
  const omc = 1 - Math.cos(theta);
  const out = new Array(9);
  for (let i = 0; i < 9; i++) {
    out[i] = I[i] + s * K[i] + omc * K2[i];
  }
  return out;
}

/**
 * Exact SE(3) matrix exponential: exp([S] * theta) for revolute/helical screw S = (omega, v)
 * Returns { R: number[9], p: {x, y, z} }
 */
function expSE3(omega, v, theta) {
  const wn = v3Norm(omega);
  if (wn < 1e-10) {
    return {
      R: mat3Identity(),
      p: v3Scale(v, theta),
    };
  }
  const w = v3Scale(omega, 1 / wn);
  const th = theta * wn;
  const vUnit = v3Scale(v, 1 / wn);

  const K = mat3FromSkew(w);
  const K2 = mat3Mul(K, K);
  const I = mat3Identity();
  const s = Math.sin(th);
  const omc = 1 - Math.cos(th);

  const R = new Array(9);
  const G = new Array(9);
  for (let i = 0; i < 9; i++) {
    R[i] = I[i] + s * K[i] + omc * K2[i];
    G[i] = I[i] * th + omc * K[i] + (th - s) * K2[i];
  }
  return {
    R,
    p: mat3MulVec(G, vUnit),
  };
}

function se3Mul(T1, T2) {
  return {
    R: mat3Mul(T1.R, T2.R),
    p: v3Add(mat3MulVec(T1.R, T2.p), T1.p),
  };
}

function se3TransformPoint(T, pt) {
  return v3Add(mat3MulVec(T.R, pt), T.p);
}

/**
 * Adjoint transformation of a 6D spatial screw S = { w, v } by T = { R, p }
 */
function adjointSE3(T, screw) {
  const wPrime = mat3MulVec(T.R, screw.w);
  const Rv = mat3MulVec(T.R, screw.v);
  const pCrossW = v3Cross(T.p, wPrime);
  return {
    w: wPrime,
    v: v3Add(pCrossW, Rv),
  };
}

/**
 * Standard Denavit-Hartenberg transform T(theta, d, a, alpha)
 */
function dhTransform(theta, d, a, alpha) {
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const ca = Math.cos(alpha);
  const sa = Math.sin(alpha);
  return {
    R: [ct, -st * ca, st * sa, st, ct * ca, -ct * sa, 0, sa, ca],
    p: { x: a * ct, y: a * st, z: d },
  };
}

/**
 * Closed-form SVD of a 2 x N planar Jacobian J = [[j00, ...], [j10, ...]]
 * Returns { sigma1, sigma2, u1, u2, manipulability, conditionNumber, jjt }
 */
function svdPlanar2xN(J) {
  const row0 = J[0];
  const row1 = J[1];
  let m11 = 0;
  let m12 = 0;
  let m22 = 0;
  for (let k = 0; k < row0.length; k++) {
    m11 += row0[k] * row0[k];
    m12 += row0[k] * row1[k];
    m22 += row1[k] * row1[k];
  }

  const trHalf = 0.5 * (m11 + m22);
  const diffHalf = 0.5 * (m11 - m22);
  const rad = Math.hypot(diffHalf, m12);

  const lam1 = Math.max(0, trHalf + rad);
  const lam2 = Math.max(0, trHalf - rad);
  const sigma1 = Math.sqrt(lam1);
  const sigma2 = Math.sqrt(lam2);

  const angle = Math.abs(rad) > 1e-12 ? 0.5 * Math.atan2(2 * m12, m11 - m22) : 0;
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);

  const u1 = { x: ca, y: sa, z: 0 };
  const u2 = { x: -sa, y: ca, z: 0 };
  const manipulability = sigma1 * sigma2;
  const conditionNumber = sigma2 > 1e-4 ? sigma1 / sigma2 : 999.0;

  return {
    sigma1,
    sigma2,
    u1,
    u2,
    manipulability,
    conditionNumber,
    jjt: [m11, m12, m12, m22],
  };
}

/**
 * Cyclic Jacobi eigendecomposition for symmetric 3x3 matrix A (row-major 9 floats).
 * Used for exact 3D Manipulability Ellipsoid of 3R Spatial PoE arm (A = Jv * Jv^T).
 */
function eigenSym3x3(A) {
  const M = A.slice();
  const V = mat3Identity();

  const pairs = [
    [0, 1],
    [0, 2],
    [1, 2],
  ];

  for (let sweep = 0; sweep < 12; sweep++) {
    for (let pIdx = 0; pIdx < 3; pIdx++) {
      const p = pairs[pIdx][0];
      const q = pairs[pIdx][1];
      const apq = M[p * 3 + q];
      if (Math.abs(apq) < 1e-12) continue;

      const app = M[p * 3 + p];
      const aqq = M[q * 3 + q];
      const tau = (aqq - app) / (2 * apq);
      const t =
        tau >= 0
          ? 1 / (tau + Math.sqrt(1 + tau * tau))
          : -1 / (-tau + Math.sqrt(1 + tau * tau));
      const c = 1 / Math.sqrt(1 + t * t);
      const s = t * c;

      // Update M = G^T M G
      M[p * 3 + p] = app - t * apq;
      M[q * 3 + q] = aqq + t * apq;
      M[p * 3 + q] = 0;
      M[q * 3 + p] = 0;

      for (let r = 0; r < 3; r++) {
        if (r !== p && r !== q) {
          const arp = M[r * 3 + p];
          const arq = M[r * 3 + q];
          const nrp = c * arp - s * arq;
          const nrq = s * arp + c * arq;
          M[r * 3 + p] = nrp;
          M[p * 3 + r] = nrp;
          M[r * 3 + q] = nrq;
          M[q * 3 + r] = nrq;
        }
      }

      // Accumulate eigenvectors V = V * G
      for (let r = 0; r < 3; r++) {
        const vrp = V[r * 3 + p];
        const vrq = V[r * 3 + q];
        V[r * 3 + p] = c * vrp - s * vrq;
        V[r * 3 + q] = s * vrp + c * vrq;
      }
    }
  }

  const eig = [
    { val: Math.max(0, M[0]), vec: v3Normalize(v3(V[0], V[3], V[6])) },
    { val: Math.max(0, M[4]), vec: v3Normalize(v3(V[1], V[4], V[7])) },
    { val: Math.max(0, M[8]), vec: v3Normalize(v3(V[2], V[5], V[8])) },
  ];
  eig.sort((a, b) => b.val - a.val);

  // Enforce right-handed orthonormal basis
  const u1 = eig[0].vec;
  const u2 = eig[1].vec;
  const u3 = v3Normalize(v3Cross(u1, u2));

  return {
    sigma1: Math.sqrt(eig[0].val),
    sigma2: Math.sqrt(eig[1].val),
    sigma3: Math.sqrt(eig[2].val),
    axes: [u1, u2, u3],
  };
}

/**
 * Damped Least Squares 2xN step: dq = J^T (J J^T + lambda^2 I)^(-1) e
 */
function solveDlsStep2xN(J, ex, ey, lambda) {
  const row0 = J[0];
  const row1 = J[1];
  const n = row0.length;
  let a = lambda * lambda;
  let b = 0;
  let d = lambda * lambda;
  for (let k = 0; k < n; k++) {
    a += row0[k] * row0[k];
    b += row0[k] * row1[k];
    d += row1[k] * row1[k];
  }
  const det = Math.max(a * d - b * b, 1e-12);
  const invA = d / det;
  const invB = -b / det;
  const invD = a / det;

  const wx = invA * ex + invB * ey;
  const wy = invB * ex + invD * ey;

  const dq = new Array(n);
  for (let k = 0; k < n; k++) {
    dq[k] = row0[k] * wx + row1[k] * wy;
  }
  return dq;
}

/**
 * Closest distance from 2D point C to line segment AB (returns { dist, closest, t })
 */
function pointToSegment2D(cx, cy, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const len2 = abx * abx + aby * aby;
  let t = 0;
  if (len2 > 1e-12) {
    t = clamp(((cx - ax) * abx + (cy - ay) * aby) / len2, 0, 1);
  }
  const px = ax + t * abx;
  const py = ay + t * aby;
  return {
    dist: Math.hypot(cx - px, cy - py),
    closest: { x: px, y: py },
    t,
  };
}

// ----------------------------------------------------------------------------
// Preset 1: 2R Planar Arm (DH / MDH & Manipulability)
// ----------------------------------------------------------------------------

function analyzePlanar2R(paramA, paramB) {
  const p = KINEMATICS_PRESETS['planar-2r'];
  const deg1 = clamp(paramA, p.paramA.min, p.paramA.max);
  const deg2 = clamp(paramB, p.paramB.min, p.paramB.max);
  const th1 = deg1 * DEG2RAD;
  const th2 = deg2 * DEG2RAD;

  const L1 = 1.65;
  const L2 = 1.35;
  const z0 = 0.44;

  // Exact DH chain: T_0 = base pedestal, T_1^0 = DH(th1, 0, L1, 0), T_2^1 = DH(th2, 0, L2, 0)
  const T0 = { R: mat3Identity(), p: v3(0, 0, z0) };
  const T1_0 = se3Mul(T0, dhTransform(th1, 0, L1, 0));
  const T2_0 = se3Mul(T1_0, dhTransform(th2, 0, L2, 0));

  const p0 = v3(0, 0, z0);
  const p1 = T1_0.p;
  const p2 = T2_0.p;

  // Joint frames: Joint 1 rotates by th1 at p0, Joint 2 rotates by th1+th2 at p1, EE at p2
  const jointFrames = [
    { pos: p0, rot: mat3RotZ(th1) },
    { pos: p1, rot: mat3RotZ(th1 + th2) },
    { pos: p2, rot: mat3RotZ(th1 + th2) },
  ];

  // Analytical 2x2 Jacobian
  const s1 = Math.sin(th1);
  const c1 = Math.cos(th1);
  const s12 = Math.sin(th1 + th2);
  const c12 = Math.cos(th1 + th2);

  const J = [
    [-L1 * s1 - L2 * s12, -L2 * s12],
    [L1 * c1 + L2 * c12, L2 * c12],
  ];
  const svd = svdPlanar2xN(J);
  const detJ = L1 * L2 * Math.sin(th2);

  // Alternate geometric IK branch (elbow-down vs elbow-up) for identical EE (x, y)
  const th2Alt = -th2;
  const phiEE = Math.atan2(p2.y, p2.x);
  const th1Alt = phiEE - Math.atan2(L2 * Math.sin(th2Alt), L1 + L2 * Math.cos(th2Alt));
  const p1Alt = v3(L1 * Math.cos(th1Alt), L1 * Math.sin(th1Alt), z0);
  const p2Alt = v3(
    p1Alt.x + L2 * Math.cos(th1Alt + th2Alt),
    p1Alt.y + L2 * Math.sin(th1Alt + th2Alt),
    z0
  );

  // Static joint torques tau = J^T * F for 10 N planar end-effector load F = (0, -10, 0) N
  const F = v3(0, -10, 0);
  const tau1 = J[0][0] * F.x + J[1][0] * F.y;
  const tau2 = J[0][1] * F.x + J[1][1] * F.y;

  const w = Math.abs(detJ);
  const nearSingular = w < 0.35 || svd.sigma2 < 0.22;
  const elongated = !nearSingular && svd.conditionNumber > 5.5;

  return {
    presetId: 'planar-2r',
    paramA: deg1,
    paramB: deg2,
    metrics: {
      primaryLabel: 'Manipulability w',
      primaryValue: w.toFixed(2),
      secondaryLabel: 'Cond. Number κ',
      secondaryValue: svd.conditionNumber > 99 ? '>99' : svd.conditionNumber.toFixed(1),
      tertiaryLabel: 'EE (x, y)',
      tertiaryValue: `${p2.x.toFixed(2)}, ${p2.y.toFixed(2)}`,
      statusText: nearSingular
        ? 'NEAR SINGULARITY'
        : elongated
          ? 'ELONGATED ELLIPSOID'
          : 'WELL-CONDITIONED',
      statusColor: nearSingular ? '#FB7185' : elongated ? '#F59E0B' : '#34D399',
    },
    joints: [p0, p1, p2],
    q: [th1, th2],
    qDeg: [deg1, deg2],
    qAltDeg: [th1Alt * RAD2DEG, th2Alt * RAD2DEG],
    eePos: p2,
    manipulability: w,
    detJ,
    sigma1: svd.sigma1,
    sigma2: svd.sigma2,
    conditionNumber: svd.conditionNumber,
    torques: [tau1, tau2],
    ghostJoints: [p0, p1Alt, p2Alt],
    targetPos: null,
    jointFrames,
    jointAxes: [
      { origin: p0, dir: v3(0, 0, 1), isPrismatic: false },
      { origin: p1, dir: v3(0, 0, 1), isPrismatic: false },
    ],
    ellipsoid: {
      axes: [svd.u1, svd.u2, v3(0, 0, 1)],
      radii: [
        clamp(svd.sigma1 * 0.26, 0.04, 0.92),
        clamp(svd.sigma2 * 0.26, 0.015, 0.92),
        0.09,
      ],
    },
    payloadForce: F,
    workspace: { rMin: Math.abs(L1 - L2), rMax: L1 + L2, zPlane: z0 },
    linkLengths: [L1, L2],
  };
}

// ----------------------------------------------------------------------------
// Preset 2: 4-DOF SCARA (RRP Prismatic Quill)
// ----------------------------------------------------------------------------

function analyzeScaraRRP(paramA, paramB) {
  const p = KINEMATICS_PRESETS['scara-rrp'];
  const deg2 = clamp(paramA, p.paramA.min, p.paramA.max);
  const d3 = clamp(paramB, p.paramB.min, p.paramB.max);

  const deg1 = 22;
  const th1 = deg1 * DEG2RAD;
  const th2 = deg2 * DEG2RAD;
  const th4 = -(th1 + th2);

  const d1 = 1.88;
  const L1 = 1.55;
  const L2 = 1.25;

  const c1 = Math.cos(th1);
  const s1 = Math.sin(th1);
  const c12 = Math.cos(th1 + th2);
  const s12 = Math.sin(th1 + th2);

  const pBase = v3(0, 0, 0.12);
  const pShoulder = v3(0, 0, d1);
  const pElbow = v3(L1 * c1, L1 * s1, d1);
  const pQuillTop = v3(L1 * c1 + L2 * c12, L1 * s1 + L2 * s12, d1);
  const pEE = v3(pQuillTop.x, pQuillTop.y, d1 - d3);

  // Planar 2x2 block of 3x3 SCARA translational Jacobian (z-axis decouples as -1)
  const Jplanar = [
    [-L1 * s1 - L2 * s12, -L2 * s12],
    [L1 * c1 + L2 * c12, L2 * c12],
  ];
  const svd = svdPlanar2xN(Jplanar);

  // Full 3D manipulability w = sqrt(det(J J^T)) = L1 * L2 * |sin(th2)| * 1
  const w = Math.abs(L1 * L2 * Math.sin(th2));

  // Alternate elbow branch for identical (x, y, z)
  const th2Alt = -th2;
  const phi = Math.atan2(pQuillTop.y, pQuillTop.x);
  const th1Alt = phi - Math.atan2(L2 * Math.sin(th2Alt), L1 + L2 * Math.cos(th2Alt));
  const pElbowAlt = v3(L1 * Math.cos(th1Alt), L1 * Math.sin(th1Alt), d1);

  // 10 N 3D assembly load: 8 N vertical thrust + 6 N lateral assembly load (||F|| = 10 N)
  const F = v3(0, -6.0, -8.0);
  const tau1 = Jplanar[0][0] * F.x + Jplanar[1][0] * F.y;
  const tau2 = Jplanar[0][1] * F.x + Jplanar[1][1] * F.y;
  const forceQuill = -1.0 * F.z; // +8.0 N upward actuator force supporting downward load

  const jointFrames = [
    { pos: pShoulder, rot: mat3RotZ(th1) },
    { pos: pElbow, rot: mat3RotZ(th1 + th2) },
    { pos: pQuillTop, rot: mat3RotZ(th1 + th2) },
    { pos: pEE, rot: mat3RotZ(th1 + th2 + th4) },
  ];

  const nearSingular = Math.abs(Math.sin(th2)) < 0.14;

  return {
    presetId: 'scara-rrp',
    paramA: deg2,
    paramB: d3,
    metrics: {
      primaryLabel: 'EE (x, y, z)',
      primaryValue: `${pEE.x.toFixed(1)}, ${pEE.y.toFixed(1)}, ${pEE.z.toFixed(2)}`,
      secondaryLabel: 'Quill d₃ / Z',
      secondaryValue: `${d3.toFixed(2)}m / ${pEE.z.toFixed(2)}m`,
      tertiaryLabel: 'Planar w',
      tertiaryValue: w.toFixed(2),
      statusText: nearSingular ? 'ELBOW SINGULARITY' : '4-DOF RRP ACTIVE',
      statusColor: nearSingular ? '#FB7185' : '#34D399',
    },
    joints: [pBase, pShoulder, pElbow, pQuillTop, pEE],
    q: [th1, th2, d3, th4],
    qDeg: [deg1, deg2, d3, th4 * RAD2DEG],
    eePos: pEE,
    manipulability: w,
    sigma1: svd.sigma1,
    sigma2: svd.sigma2,
    sigma3: 1.0,
    conditionNumber: svd.conditionNumber,
    torques: [tau1, tau2, forceQuill],
    ghostJoints: [pShoulder, pElbowAlt, pQuillTop],
    targetPos: null,
    jointFrames,
    jointAxes: [
      { origin: pShoulder, dir: v3(0, 0, 1), isPrismatic: false },
      { origin: pElbow, dir: v3(0, 0, 1), isPrismatic: false },
      { origin: pQuillTop, dir: v3(0, 0, -1), isPrismatic: true },
    ],
    ellipsoid: {
      axes: [svd.u1, svd.u2, v3(0, 0, 1)],
      radii: [
        clamp(svd.sigma1 * 0.24, 0.04, 0.85),
        clamp(svd.sigma2 * 0.24, 0.015, 0.85),
        0.28,
      ],
    },
    payloadForce: F,
    workspace: { rMin: Math.abs(L1 - L2), rMax: L1 + L2, zPlane: 0.02 },
    scaraD1: d1,
    scaraD3: d3,
  };
}

// ----------------------------------------------------------------------------
// Preset 3: 3R Spatial Arm (Product of Exponentials SE(3))
// ----------------------------------------------------------------------------

function analyzePoe3R(paramA, paramB) {
  const p = KINEMATICS_PRESETS['poe-3r'];
  const deg1 = clamp(paramA, p.paramA.min, p.paramA.max);
  const deg2 = clamp(paramB, p.paramB.min, p.paramB.max);
  // Smoothly coupled elbow angle keeping the 3R spatial arm sculptural and above the plinth
  const deg3 = 32 - 0.45 * deg2;

  const th1 = deg1 * DEG2RAD;
  const th2 = deg2 * DEG2RAD;
  const th3 = deg3 * DEG2RAD;

  // Classic UR/PUMA-style spatial 3R dimensions
  const H0 = 0.96;
  const L1 = 1.35;
  const L2 = 1.20;

  // Home configuration M points: base -> shoulder (0,0,H0) -> elbow (0,0,H0+L1) -> EE (L2,0,H0+L1)
  const homeP0 = v3(0, 0, 0.10);
  const homeP1 = v3(0, 0, H0);
  const homeP2 = v3(0, 0, H0 + L1);
  const homeP3 = v3(L2, 0, H0 + L1);

  // Space-frame screw axes S_i = (w_i, v_i = -w_i x q_i) at Home Pose M
  const w1 = v3(0, 0, 1);
  const q1 = v3(0, 0, 0);
  const S1 = { w: w1, v: v3Scale(v3Cross(w1, q1), -1) };

  const w2 = v3(0, 1, 0);
  const q2 = homeP1;
  const S2 = { w: w2, v: v3Scale(v3Cross(w2, q2), -1) };

  const w3 = v3(0, 1, 0);
  const q3 = homeP2;
  const S3 = { w: w3, v: v3Scale(v3Cross(w3, q3), -1) };

  // Product of Exponentials: T1 = exp([S1]th1), T12 = T1 * exp([S2]th2), T123 = T12 * exp([S3]th3)
  const E1 = expSE3(S1.w, S1.v, th1);
  const E2 = expSE3(S2.w, S2.v, th2);
  const E3 = expSE3(S3.w, S3.v, th3);

  const T1 = E1;
  const T12 = se3Mul(T1, E2);
  const T123 = se3Mul(T12, E3);
  const M = { R: mat3Identity(), p: homeP3 };
  const T_ee = se3Mul(T123, M);

  const p0 = homeP0;
  const p1 = se3TransformPoint(T1, homeP1);
  const p2 = se3TransformPoint(T12, homeP2);
  const p3 = T_ee.p;

  // Exact Space Jacobian columns Js_i = Ad_{T_{i-1}}(S_i)
  const Js1 = S1;
  const Js2 = adjointSE3(T1, S2);
  const Js3 = adjointSE3(T12, S3);

  // Convert Space Jacobian (omega_s, v_s) to EE Linear Velocity Jacobian Jv:
  // v_ee = omega_s x p_ee + v_s
  const jvCol = (Js) => v3Add(v3Cross(Js.w, p3), Js.v);
  const c1 = jvCol(Js1);
  const c2 = jvCol(Js2);
  const c3 = jvCol(Js3);

  // Jv is 3x3 with columns [c1, c2, c3]
  const Jv = [
    [c1.x, c2.x, c3.x],
    [c1.y, c2.y, c3.y],
    [c1.z, c2.z, c3.z],
  ];

  // Compute symmetric 3x3 A = Jv * Jv^T and its exact eigendecomposition
  const A = new Array(9).fill(0);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      A[r * 3 + c] = Jv[r][0] * Jv[c][0] + Jv[r][1] * Jv[c][1] + Jv[r][2] * Jv[c][2];
    }
  }
  const eig = eigenSym3x3(A);
  const w = eig.sigma1 * eig.sigma2 * eig.sigma3;
  const cond = eig.sigma3 > 1e-4 ? eig.sigma1 / eig.sigma3 : 999.0;

  // Static torques tau = Jv^T * F for 10 N vertical gravity payload F = (0, 0, -10) N
  const F = v3(0, 0, -10.0);
  const tau1 = c1.x * F.x + c1.y * F.y + c1.z * F.z;
  const tau2 = c2.x * F.x + c2.y * F.y + c2.z * F.z;
  const tau3 = c3.x * F.x + c3.y * F.y + c3.z * F.z;
  const peakTorque = Math.max(Math.abs(tau1), Math.abs(tau2), Math.abs(tau3));

  const jointFrames = [
    { pos: p1, rot: T1.R },
    { pos: p2, rot: T12.R },
    { pos: p3, rot: T_ee.R },
  ];

  // Live transformed screw axis origins & directions for Violet PoE Screw Arrows
  const screwAxes = [
    { origin: p1, dir: v3Normalize(Js1.w), label: 'S1', isPrismatic: false },
    { origin: p1, dir: v3Normalize(Js2.w), label: 'S2', isPrismatic: false },
    { origin: p2, dir: v3Normalize(Js3.w), label: 'S3', isPrismatic: false },
  ];

  const nearBoundary = cond > 16 || eig.sigma3 < 0.18;

  return {
    presetId: 'poe-3r',
    paramA: deg1,
    paramB: deg2,
    metrics: {
      primaryLabel: 'EE SE(3) Pos',
      primaryValue: `${p3.x.toFixed(1)}, ${p3.y.toFixed(1)}, ${p3.z.toFixed(2)}`,
      secondaryLabel: 'Manipulability w',
      secondaryValue: w.toFixed(2),
      tertiaryLabel: 'Peak |τ|',
      tertiaryValue: `${peakTorque.toFixed(1)} N·m`,
      statusText: nearBoundary ? 'NEAR SINGULARITY' : 'SE(3) POE VALID',
      statusColor: nearBoundary ? '#F59E0B' : '#A78BFA',
    },
    joints: [p0, p1, p2, p3],
    q: [th1, th2, th3],
    qDeg: [deg1, deg2, deg3],
    eePos: p3,
    manipulability: w,
    sigma1: eig.sigma1,
    sigma2: eig.sigma2,
    sigma3: eig.sigma3,
    conditionNumber: cond,
    torques: [tau1, tau2, tau3],
    ghostJoints: [homeP0, homeP1, homeP2, homeP3], // Home Pose M silhouette!
    targetPos: null,
    jointFrames,
    jointAxes: screwAxes,
    ellipsoid: {
      axes: eig.axes,
      radii: [
        clamp(eig.sigma1 * 0.24, 0.05, 0.88),
        clamp(eig.sigma2 * 0.24, 0.03, 0.88),
        clamp(eig.sigma3 * 0.24, 0.02, 0.88),
      ],
    },
    payloadForce: F,
    workspace: { rMin: 0.25, rMax: L1 + L2, zPlane: 0.02 },
  };
}

// ----------------------------------------------------------------------------
// Preset 4: Singularity & Damped Least Squares (DLS) IK
// ----------------------------------------------------------------------------

function analyzeIkDls(paramA, paramB) {
  const p = KINEMATICS_PRESETS['ik-dls'];
  const rTarget = clamp(paramA, p.paramA.min, p.paramA.max);
  const lambda = clamp(paramB, p.paramB.min, p.paramB.max);

  const L1 = 1.65;
  const L2 = 1.35;
  const rMax = L1 + L2; // 3.00 m exact outer singularity boundary
  const rMin = Math.abs(L1 - L2); // 0.30 m inner boundary
  const z0 = 0.44;

  const targetAngle = 32 * DEG2RAD;
  const targetPos = v3(rTarget * Math.cos(targetAngle), rTarget * Math.sin(targetAngle), z0);

  // Iterative Damped Least Squares solver: dq = J^T (J J^T + lambda^2 I)^(-1) e
  let th1 = targetAngle - 0.38;
  let th2 = 0.78;

  for (let iter = 0; iter < 120; iter++) {
    const c1 = Math.cos(th1);
    const s1 = Math.sin(th1);
    const c12 = Math.cos(th1 + th2);
    const s12 = Math.sin(th1 + th2);

    const ex = targetPos.x - (L1 * c1 + L2 * c12);
    const ey = targetPos.y - (L1 * s1 + L2 * s12);
    const errNorm = Math.hypot(ex, ey);
    if (errNorm < 1e-6) break;

    const stepScale = errNorm > 0.45 ? 0.45 / errNorm : 1.0;
    const J = [
      [-L1 * s1 - L2 * s12, -L2 * s12],
      [L1 * c1 + L2 * c12, L2 * c12],
    ];
    const dq = solveDlsStep2xN(J, ex * stepScale, ey * stepScale, lambda);
    const dqNorm = Math.hypot(dq[0], dq[1]);
    const cap = dqNorm > 0.42 ? 0.42 / dqNorm : 1.0;
    th1 += dq[0] * cap;
    th2 += dq[1] * cap;
  }

  // Final FK & Jacobian at converged DLS pose
  const c1 = Math.cos(th1);
  const s1 = Math.sin(th1);
  const c12 = Math.cos(th1 + th2);
  const s12 = Math.sin(th1 + th2);

  const p0 = v3(0, 0, z0);
  const p1 = v3(L1 * c1, L1 * s1, z0);
  const p2 = v3(L1 * c1 + L2 * c12, L1 * s1 + L2 * s12, z0);

  const J = [
    [-L1 * s1 - L2 * s12, -L2 * s12],
    [L1 * c1 + L2 * c12, L2 * c12],
  ];
  const svd = svdPlanar2xN(J);
  const w = svd.manipulability;
  const eeError = Math.hypot(targetPos.x - p2.x, targetPos.y - p2.y);

  // Alternate geometric elbow-up ghost branch (clamped to rMax if unreachable)
  const rClamped = clamp(rTarget, rMin + 0.02, rMax - 1e-4);
  const cosTh2 = clamp((rClamped * rClamped - L1 * L1 - L2 * L2) / (2 * L1 * L2), -1, 1);
  const th2Ghost = -Math.acos(cosTh2);
  const th1Ghost =
    targetAngle - Math.atan2(L2 * Math.sin(th2Ghost), L1 + L2 * Math.cos(th2Ghost));
  const p1Ghost = v3(L1 * Math.cos(th1Ghost), L1 * Math.sin(th1Ghost), z0);
  const p2Ghost = v3(
    p1Ghost.x + L2 * Math.cos(th1Ghost + th2Ghost),
    p1Ghost.y + L2 * Math.sin(th1Ghost + th2Ghost),
    z0
  );

  // Compare bounded DLS velocity norm against undamped pseudoinverse velocity at exact target posture
  const vx = Math.cos(targetAngle);
  const vy = Math.sin(targetAngle);
  const dqDls = solveDlsStep2xN(J, vx, vy, lambda);
  const dlsVelNorm = Math.hypot(dqDls[0], dqDls[1]);

  const th2Exact = -th2Ghost;
  const th1Exact =
    targetAngle - Math.atan2(L2 * Math.sin(th2Exact), L1 + L2 * Math.cos(th2Exact));
  const Jexact = [
    [-L1 * Math.sin(th1Exact) - L2 * Math.sin(th1Exact + th2Exact), -L2 * Math.sin(th1Exact + th2Exact)],
    [L1 * Math.cos(th1Exact) + L2 * Math.cos(th1Exact + th2Exact), L2 * Math.cos(th1Exact + th2Exact)],
  ];
  const dqPinv = solveDlsStep2xN(Jexact, vx, vy, 1e-4);
  const pinvVelNorm = Math.min(Math.hypot(dqPinv[0], dqPinv[1]), 999.0);

  // Static torques for 10 N load
  const F = v3(0, -10, 0);
  const tau1 = J[0][0] * F.x + J[1][0] * F.y;
  const tau2 = J[0][1] * F.x + J[1][1] * F.y;

  const jointFrames = [
    { pos: p0, rot: mat3RotZ(th1) },
    { pos: p1, rot: mat3RotZ(th1 + th2) },
    { pos: p2, rot: mat3RotZ(th1 + th2) },
  ];

  const beyondBoundary = rTarget > rMax + 0.01;
  const nearBoundary = rTarget >= rMax - 0.25;

  return {
    presetId: 'ik-dls',
    paramA: rTarget,
    paramB: lambda,
    metrics: {
      primaryLabel: 'DLS |θ̇| Bound',
      primaryValue: `${dlsVelNorm.toFixed(2)} rad/s`,
      secondaryLabel: 'Pinv |θ̇| Spike',
      secondaryValue: pinvVelNorm > 99 ? '>99 rad/s' : `${pinvVelNorm.toFixed(1)} rad/s`,
      tertiaryLabel: 'Track Err |e|',
      tertiaryValue: `${eeError.toFixed(3)} m`,
      statusText: beyondBoundary
        ? 'OUT OF REACH (DLS)'
        : nearBoundary
          ? 'SINGULARITY DAMPED'
          : 'CONVERGED IK',
      statusColor: beyondBoundary ? '#FB7185' : nearBoundary ? '#F59E0B' : '#22D3EE',
    },
    joints: [p0, p1, p2],
    q: [th1, th2],
    qDeg: [th1 * RAD2DEG, th2 * RAD2DEG],
    eePos: p2,
    manipulability: w,
    sigma1: svd.sigma1,
    sigma2: svd.sigma2,
    conditionNumber: svd.conditionNumber,
    torques: [tau1, tau2],
    ghostJoints: [p0, p1Ghost, p2Ghost],
    targetPos,
    dlsVelNorm,
    pinvVelNorm,
    eeError,
    jointFrames,
    jointAxes: [
      { origin: p0, dir: v3(0, 0, 1), isPrismatic: false },
      { origin: p1, dir: v3(0, 0, 1), isPrismatic: false },
    ],
    ellipsoid: {
      axes: [svd.u1, svd.u2, v3(0, 0, 1)],
      radii: [
        clamp(svd.sigma1 * 0.26, 0.04, 0.92),
        clamp(svd.sigma2 * 0.26, 0.015, 0.92),
        0.09,
      ],
    },
    payloadForce: F,
    workspace: { rMin, rMax, zPlane: z0 },
  };
}

// ----------------------------------------------------------------------------
// Preset 5: Redundant 3R Arm (Nullspace & QP-IK + Joint Limits + Obstacle)
// ----------------------------------------------------------------------------

function analyzeQpIk3R(paramA, paramB) {
  const p = KINEMATICS_PRESETS['qp-ik-3r'];
  const targetX = clamp(paramA, p.paramA.min, p.paramA.max);
  const w0 = clamp(paramB, p.paramB.min, p.paramB.max);

  const L1 = 1.25;
  const L2 = 1.15;
  const L3 = 0.95;
  const rMax = L1 + L2 + L3; // 3.35 m
  const z0 = 0.44;

  const targetPos = v3(targetX, 1.35, z0);
  const obstacle = { x: 1.05, y: -0.32, radius: 0.28, safetyMargin: 0.65 };

  const qMin = [-135 * DEG2RAD, -125 * DEG2RAD, -125 * DEG2RAD];
  const qMax = [135 * DEG2RAD, 125 * DEG2RAD, 125 * DEG2RAD];

  const fk3R = (q) => {
    const a1 = q[0];
    const a12 = q[0] + q[1];
    const a123 = q[0] + q[1] + q[2];
    const p0 = v3(0, 0, z0);
    const p1 = v3(L1 * Math.cos(a1), L1 * Math.sin(a1), z0);
    const p2 = v3(p1.x + L2 * Math.cos(a12), p1.y + L2 * Math.sin(a12), z0);
    const p3 = v3(p2.x + L3 * Math.cos(a123), p2.y + L3 * Math.sin(a123), z0);
    return { p0, p1, p2, p3, a1, a12, a123 };
  };

  const jacobian3R = (q) => {
    const a1 = q[0];
    const a12 = q[0] + q[1];
    const a123 = q[0] + q[1] + q[2];
    const s1 = Math.sin(a1);
    const c1 = Math.cos(a1);
    const s12 = Math.sin(a12);
    const c12 = Math.cos(a12);
    const s123 = Math.sin(a123);
    const c123 = Math.cos(a123);

    return [
      [-L1 * s1 - L2 * s12 - L3 * s123, -L2 * s12 - L3 * s123, -L3 * s123],
      [L1 * c1 + L2 * c12 + L3 * c123, L2 * c12 + L3 * c123, L3 * c123],
    ];
  };

  // Smooth obstacle repulsive potential evaluated on all 3 arm segments
  const obstaclePotential = (q) => {
    const { p0, p1, p2, p3 } = fk3R(q);
    const dInf = obstacle.radius + obstacle.safetyMargin;
    const segs = [
      pointToSegment2D(obstacle.x, obstacle.y, p0.x, p0.y, p1.x, p1.y),
      pointToSegment2D(obstacle.x, obstacle.y, p1.x, p1.y, p2.x, p2.y),
      pointToSegment2D(obstacle.x, obstacle.y, p2.x, p2.y, p3.x, p3.y),
    ];
    let pot = 0;
    for (let i = 0; i < 3; i++) {
      if (segs[i].dist < dInf) {
        const pen = dInf - segs[i].dist;
        pot += 0.5 * pen * pen;
      }
    }
    return pot;
  };

  // Projected Nullspace / QP-IK Solver with Box Joint Limits
  const solveQpIk = (postureWeight, seedQ) => {
    const q = seedQ.slice();
    const phiT = Math.atan2(targetPos.y, targetPos.x);
    // Ergonomic preferred posture steering cleanly around the obstacle & away from hard stops
    const qPref = [
      clamp(phiT + 0.68, -1.65, 1.95),
      -0.82,
      -0.36,
    ];
    const lam = 0.05;
    const eps = 1e-3;

    for (let iter = 0; iter < 110; iter++) {
      const { p3 } = fk3R(q);
      const J = jacobian3R(q);
      const ex = targetPos.x - p3.x;
      const ey = targetPos.y - p3.y;
      const eNorm = Math.hypot(ex, ey);
      const eScale = eNorm > 0.36 ? 0.36 / eNorm : 1.0;

      // Primary task DLS step dqTask = J# * e
      const dqTask = solveDlsStep2xN(J, ex * eScale, ey * eScale, lam);

      // Secondary nullspace velocity: posture centering + obstacle repulsion
      let dqNull = [0, 0, 0];
      if (postureWeight > 1e-4) {
        const gradObs = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
          const qp = q.slice();
          const qm = q.slice();
          qp[i] += eps;
          qm[i] -= eps;
          gradObs[i] = (obstaclePotential(qp) - obstaclePotential(qm)) / (2 * eps);
        }

        const dq0 = [
          postureWeight * (0.55 * (qPref[0] - q[0]) - 3.8 * gradObs[0]),
          postureWeight * (0.55 * (qPref[1] - q[1]) - 3.8 * gradObs[1]),
          postureWeight * (0.55 * (qPref[2] - q[2]) - 3.8 * gradObs[2]),
        ];

        // Project dq0 into nullspace N = I - J# J -> dqNull = dq0 - J# (J dq0)
        const jdqx = J[0][0] * dq0[0] + J[0][1] * dq0[1] + J[0][2] * dq0[2];
        const jdqy = J[1][0] * dq0[0] + J[1][1] * dq0[1] + J[1][2] * dq0[2];
        const proj = solveDlsStep2xN(J, jdqx, jdqy, lam);
        dqNull = [dq0[0] - proj[0], dq0[1] - proj[1], dq0[2] - proj[2]];
      }

      const step = [dqTask[0] + dqNull[0], dqTask[1] + dqNull[1], dqTask[2] + dqNull[2]];
      const sNorm = Math.hypot(step[0], step[1], step[2]);
      const cap = sNorm > 0.28 ? 0.28 / sNorm : 1.0;

      for (let i = 0; i < 3; i++) {
        q[i] = clamp(q[i] + step[i] * cap, qMin[i], qMax[i]);
      }
    }
    return q;
  };

  const phiT = Math.atan2(targetPos.y, targetPos.x);
  const directSeed = [clamp(phiT - 0.16, -1.8, 1.8), 0.25, 0.12];
  // Active QP-IK arm (uses postureWeight w0 to bend around obstacle in nullspace)
  const qActive = solveQpIk(w0, directSeed);
  // Unregularized baseline ghost arm (w0 = 0, direct minimum-norm path near obstacle)
  const qGhost = solveQpIk(0.0, directSeed);

  const fk = fk3R(qActive);
  const fkGhost = fk3R(qGhost);
  const J = jacobian3R(qActive);
  const svd = svdPlanar2xN(J);
  const eeError = Math.hypot(targetPos.x - fk.p3.x, targetPos.y - fk.p3.y);

  // Compute exact minimum clearance between all 3 links and the Coral obstacle cylinder
  const segChecks = [
    pointToSegment2D(obstacle.x, obstacle.y, fk.p0.x, fk.p0.y, fk.p1.x, fk.p1.y),
    pointToSegment2D(obstacle.x, obstacle.y, fk.p1.x, fk.p1.y, fk.p2.x, fk.p2.y),
    pointToSegment2D(obstacle.x, obstacle.y, fk.p2.x, fk.p2.y, fk.p3.x, fk.p3.y),
  ];
  let closestCheck = segChecks[0];
  for (let i = 1; i < 3; i++) {
    if (segChecks[i].dist < closestCheck.dist) closestCheck = segChecks[i];
  }
  const clearance = closestCheck.dist - obstacle.radius;

  // Joint limit margin in degrees
  let minMarginRad = Infinity;
  for (let i = 0; i < 3; i++) {
    minMarginRad = Math.min(minMarginRad, qActive[i] - qMin[i], qMax[i] - qActive[i]);
  }
  const limitMarginDeg = Math.max(0, minMarginRad * RAD2DEG);
  const limitHit = limitMarginDeg < 2.0;

  // Static torques for 10 N load
  const F = v3(0, -10, 0);
  const tau1 = J[0][0] * F.x + J[1][0] * F.y;
  const tau2 = J[0][1] * F.x + J[1][1] * F.y;
  const tau3 = J[0][2] * F.x + J[1][2] * F.y;

  const jointFrames = [
    { pos: fk.p0, rot: mat3RotZ(fk.a1) },
    { pos: fk.p1, rot: mat3RotZ(fk.a12) },
    { pos: fk.p2, rot: mat3RotZ(fk.a123) },
    { pos: fk.p3, rot: mat3RotZ(fk.a123) },
  ];

  const obstacleContact = clearance < 0.04;

  return {
    presetId: 'qp-ik-3r',
    paramA: targetX,
    paramB: w0,
    metrics: {
      primaryLabel: 'Track Err |e|',
      primaryValue: `${eeError.toFixed(3)} m`,
      secondaryLabel: 'Obs Clearance',
      secondaryValue: `${clearance.toFixed(2)} m`,
      tertiaryLabel: 'Limit Margin',
      tertiaryValue: `${limitMarginDeg.toFixed(0)}°`,
      statusText: obstacleContact
        ? 'OBSTACLE PROXIMITY'
        : limitHit
          ? 'JOINT STOP CLAMP'
          : 'NULLSPACE CLEAR',
      statusColor: obstacleContact ? '#FB7185' : limitHit ? '#F59E0B' : '#34D399',
    },
    joints: [fk.p0, fk.p1, fk.p2, fk.p3],
    q: qActive,
    qDeg: qActive.map((a) => a * RAD2DEG),
    eePos: fk.p3,
    manipulability: svd.manipulability,
    sigma1: svd.sigma1,
    sigma2: svd.sigma2,
    conditionNumber: svd.conditionNumber,
    torques: [tau1, tau2, tau3],
    ghostJoints: [fkGhost.p0, fkGhost.p1, fkGhost.p2, fkGhost.p3],
    targetPos,
    obstacle,
    closestObstaclePoint: { x: closestCheck.closest.x, y: closestCheck.closest.y, z: z0 },
    clearance,
    jointLimits: { qMin, qMax },
    eeError,
    jointFrames,
    jointAxes: [
      { origin: fk.p0, dir: v3(0, 0, 1), isPrismatic: false },
      { origin: fk.p1, dir: v3(0, 0, 1), isPrismatic: false },
      { origin: fk.p2, dir: v3(0, 0, 1), isPrismatic: false },
    ],
    ellipsoid: {
      axes: [svd.u1, svd.u2, v3(0, 0, 1)],
      radii: [
        clamp(svd.sigma1 * 0.22, 0.04, 0.85),
        clamp(svd.sigma2 * 0.22, 0.015, 0.85),
        0.09,
      ],
    },
    payloadForce: F,
    workspace: { rMin: 0.15, rMax, zPlane: z0 },
  };
}

/**
 * Pure deterministic Robot Kinematics, Jacobians & IK analysis engine.
 * Used identically by the 3D WebGL Studio and HUD telemetry badges.
 */
export function analyzeKinematicsSystem({ presetId = 'planar-2r', paramA, paramB } = {}) {
  const key = KINEMATICS_PRESETS[presetId] ? presetId : 'planar-2r';
  const preset = KINEMATICS_PRESETS[key];
  const resolvedA = Number.isFinite(paramA) ? paramA : preset.paramA.default;
  const resolvedB = Number.isFinite(paramB) ? paramB : preset.paramB.default;

  let result;
  switch (key) {
    case 'scara-rrp':
      result = analyzeScaraRRP(resolvedA, resolvedB);
      break;
    case 'poe-3r':
      result = analyzePoe3R(resolvedA, resolvedB);
      break;
    case 'ik-dls':
      result = analyzeIkDls(resolvedA, resolvedB);
      break;
    case 'qp-ik-3r':
      result = analyzeQpIk3R(resolvedA, resolvedB);
      break;
    case 'planar-2r':
    default:
      result = analyzePlanar2R(resolvedA, resolvedB);
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
// 3. 3D STUDIO PALETTE, COORDINATE TRANSFORMS & GEOMETRY HELPERS
// ============================================================================

const COLORS = {
  studioBg: 0x0b0d12,
  plinthDark: 0x0e1422,
  plinthDeck: 0x111827,
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
  coralLight: 0xfda4af,
  coralDeep: 0xe11d48,
  anodizedSlate: 0x334155,
  anodizedLight: 0x64748b,
  gunmetal: 0x1e293b,
  chrome: 0xcbd5e1,
  white: 0xf8fafc,
};

/**
 * Right-handed SO(3) mapping from Robotics Base Frame (X right, Y depth-back, Z vertical UP)
 * to Three.js World Space (X right, Y vertical UP, Z toward viewer):
 *   worldX = robot.x
 *   worldY = robot.z
 *   worldZ = -robot.y
 */
function robotToWorld(p) {
  return new THREE.Vector3(p.x, p.z, -p.y);
}

function robotDirToWorld(d) {
  return new THREE.Vector3(d.x, d.z, -d.y).normalize();
}

/**
 * Converts a row-major 3x3 robotics rotation matrix R into a Three.js Matrix4 in world space
 * via M_world = P * R * P^T, where P maps (x, y, z) -> (x, z, -y).
 */
function robotBasisToQuaternion(R) {
  // Columns of R in robotics space are local x, y, z unit vectors
  const rx = robotDirToWorld({ x: R[0], y: R[3], z: R[6] });
  const ry = robotDirToWorld({ x: R[1], y: R[4], z: R[7] });
  const rz = robotDirToWorld({ x: R[2], y: R[5], z: R[8] });
  const m = new THREE.Matrix4().makeBasis(rx, ry, rz);
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

/**
 * Orient a cylinder/arrow whose local +Y axis points along unit vector `dir`.
 */
function quaternionFromUpToDir(dir) {
  const up = new THREE.Vector3(0, 1, 0);
  const d = dir.clone().normalize();
  const dot = up.dot(d);
  if (dot > 0.9999) return new THREE.Quaternion();
  if (dot < -0.9999) return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
  return new THREE.Quaternion().setFromUnitVectors(up, d);
}

/**
 * Sculpted circular beveled robotic workcell plinth using LatheGeometry.
 */
function createWorkcellPlinthGeometry(radius = 3.85, height = 0.28, bevel = 0.055) {
  const pts = [
    new THREE.Vector2(0.0, -height),
    new THREE.Vector2(radius - bevel * 1.4, -height),
    new THREE.Vector2(radius - bevel * 0.4, -height + bevel * 0.7),
    new THREE.Vector2(radius, -bevel),
    new THREE.Vector2(radius - bevel, 0.0),
    new THREE.Vector2(0.0, 0.0),
  ];
  const geom = new THREE.LatheGeometry(pts, 72);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Helper to create a 3D dashed circle on the horizontal plane (Three.js XZ).
 */
function createDashedRingLine(radius, yHeight, color, dashSize = 0.16, gapSize = 0.11, segments = 96) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, yHeight, Math.sin(a) * radius));
  }
  const geom = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineDashedMaterial({
    color,
    dashSize,
    gapSize,
    transparent: true,
    opacity: 0.88,
  });
  const line = new THREE.Line(geom, mat);
  line.computeLineDistances();
  return line;
}

/**
 * Helper to create a 3D solid glowing ring on the horizontal plane (Three.js XZ).
 */
function createFlatRingMesh(radius, tubeRadius, yHeight, material) {
  const geom = new THREE.TorusGeometry(radius, tubeRadius, 12, 84);
  const mesh = new THREE.Mesh(geom, material);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = yHeight;
  return mesh;
}

/**
 * Disposes all non-shared geometries, materials, and textures inside a Three.js Group.
 */
function disposeGroupChildren(group, sharedGeos, sharedMats) {
  if (!group) return;
  const disposedGeos = new Set();
  const disposedMats = new Set();

  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    child.traverse((node) => {
      if (node.geometry && !sharedGeos.has(node.geometry) && !disposedGeos.has(node.geometry)) {
        disposedGeos.add(node.geometry);
        node.geometry.dispose();
      }
      if (node.material) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        for (const m of mats) {
          if (m && !sharedMats.has(m) && !disposedMats.has(m)) {
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
// 4. KINEMATICS 3D STUDIO CLASS
// ============================================================================

export class Kinematics3DStudio {
  constructor(options = {}) {
    this.onTelemetry =
      typeof options.onTelemetry === 'function'
        ? options.onTelemetry
        : typeof options.onChange === 'function'
          ? options.onChange
          : null;

    this.presetId = KINEMATICS_PRESETS[options.presetId] ? options.presetId : 'planar-2r';
    const initPreset = KINEMATICS_PRESETS[this.presetId];
    this.paramA = Number.isFinite(options.paramA)
      ? clamp(options.paramA, initPreset.paramA.min, initPreset.paramA.max)
      : initPreset.paramA.default;
    this.paramB = Number.isFinite(options.paramB)
      ? clamp(options.paramB, initPreset.paramB.min, initPreset.paramB.max)
      : initPreset.paramB.default;

    this.mechatronicsLens = Boolean(options.mechatronicsLens);
    this.cameraPreset = '3d';

    this._analysis = analyzeKinematicsSystem({
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
    this._workspaceGroup = null;
    this._armGroup = null;
    this._ghostGroup = null;
    this._ellipsoidGroup = null;
    this._heroGroup = null;
    this._mechatronicsGroup = null;

    // Animated studio handles
    this._plinthRimMat = null;
    this._servoCollarMats = [];
    this._targetBeaconGroup = null;
    this._spikeHaloMesh = null;
    this._obstacleRingMesh = null;
    this._quillRingMeshes = [];
    this._forceArrowPulse = null;
    this._ellipsoidShellMat = null;

    // Shared GPU resources for leak-free disposal
    this._sharedGeometries = new Set();
    this._sharedMaterials = new Set();

    // Runtime animation state
    this._rafId = null;
    this._resizeObserver = null;
    this._clock = null;
    this._camTransition = null;
    this._initialized = false;
    this._disposed = false;

    this._onAnimate = this._animate.bind(this);
    this._onControlsStart = () => {
      this._camTransition = null;
    };
  }

  _getPreset() {
    return KINEMATICS_PRESETS[this.presetId] || KINEMATICS_PRESETS['planar-2r'];
  }

  _recomputeAnalysis() {
    this._analysis = analyzeKinematicsSystem({
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

    if (options.presetId && KINEMATICS_PRESETS[options.presetId]) {
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
    this.scene.fog = new THREE.FogExp2(COLORS.studioBg, 0.015);
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
    this.renderer.toneMappingExposure = 1.12;
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
    this.controls.minPolarAngle = 0.06;
    this.controls.minDistance = 3.8;
    this.controls.maxDistance = 22.0;
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
    this._workspaceGroup = new THREE.Group();
    this._ghostGroup = new THREE.Group();
    this._armGroup = new THREE.Group();
    this._ellipsoidGroup = new THREE.Group();
    this._heroGroup = new THREE.Group();
    this._mechatronicsGroup = new THREE.Group();

    this._stageGroup.add(
      this._plinthGroup,
      this._workspaceGroup,
      this._ghostGroup,
      this._armGroup,
      this._ellipsoidGroup,
      this._heroGroup,
      this._mechatronicsGroup
    );

    this._buildWorkcellPlinth();
    this._rebuildKinematicsScene();

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
    // Balanced studio lighting — crisp reflections, zero white washout
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.80);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xf8fafc, 1.30);
    key.position.set(7.2, 11.0, 8.0);
    this.scene.add(key);

    const rimCyan = new THREE.DirectionalLight(COLORS.cyan, 0.75);
    rimCyan.position.set(-8.5, 5.2, -6.5);
    this.scene.add(rimCyan);

    const warmAmber = new THREE.PointLight(COLORS.amber, 1.85, 18, 1.5);
    warmAmber.position.set(4.6, 3.8, 2.8);
    this.scene.add(warmAmber);

    const violetFill = new THREE.PointLight(COLORS.violet, 1.45, 16, 1.5);
    violetFill.position.set(-3.8, 3.2, -3.6);
    this.scene.add(violetFill);
  }

  _createSharedResources() {
    this._unitSphereGeo = new THREE.SphereGeometry(1, 28, 22);
    this._unitCylGeo = new THREE.CylinderGeometry(1, 1, 1, 24, 1);
    this._unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
    this._unitConeGeo = new THREE.ConeGeometry(1, 1, 18);
    this._unitTorusGeo = new THREE.TorusGeometry(1, 0.08, 12, 48);

    this._sharedGeometries.add(
      this._unitSphereGeo,
      this._unitCylGeo,
      this._unitBoxGeo,
      this._unitConeGeo,
      this._unitTorusGeo
    );

    // Anodized Metallic Robot Link Material (Spline-level clearcoat finish)
    this._matLinkBody = new THREE.MeshPhysicalMaterial({
      color: 0x3b485d,
      metalness: 0.74,
      roughness: 0.24,
      clearcoat: 0.58,
      clearcoatRoughness: 0.18,
    });

    // Dark Gunmetal Servo Stator Material
    this._matJointHousing = new THREE.MeshPhysicalMaterial({
      color: 0x1a2232,
      metalness: 0.82,
      roughness: 0.28,
      clearcoat: 0.42,
      clearcoatRoughness: 0.22,
    });

    // Brushed Titanium Accent / Gripper Jaw Material
    this._matMachinedTrim = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      metalness: 0.88,
      roughness: 0.18,
      clearcoat: 0.35,
    });

    // Luminous Cyan Servo Collar / Spine
    this._matCyanGlow = new THREE.MeshStandardMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.55,
      roughness: 0.16,
      metalness: 0.25,
    });

    // Luminous Amber Servo Collar / Target Beacon
    this._matAmberGlow = new THREE.MeshStandardMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.55,
      roughness: 0.16,
      metalness: 0.25,
    });

    // Luminous Emerald Quill / Y-Axis / Safe
    this._matEmeraldGlow = new THREE.MeshStandardMaterial({
      color: COLORS.emeraldLight,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.48,
      roughness: 0.16,
      metalness: 0.24,
    });

    // Luminous Violet Screw Axis / Ghost Rim
    this._matVioletGlow = new THREE.MeshStandardMaterial({
      color: COLORS.violetLight,
      emissive: COLORS.violet,
      emissiveIntensity: 1.58,
      roughness: 0.16,
      metalness: 0.26,
    });

    // Luminous Coral Singularity / Obstacle / X-Axis
    this._matCoralGlow = new THREE.MeshStandardMaterial({
      color: COLORS.coralLight,
      emissive: COLORS.coral,
      emissiveIntensity: 1.65,
      roughness: 0.16,
      metalness: 0.24,
    });

    // Translucent Violet Ghost Arm Material
    this._matGhostLink = new THREE.MeshPhysicalMaterial({
      color: COLORS.violet,
      emissive: COLORS.violetDeep,
      emissiveIntensity: 0.55,
      roughness: 0.22,
      metalness: 0.15,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });

    this._matGhostJoint = new THREE.MeshStandardMaterial({
      color: COLORS.violetLight,
      emissive: COLORS.violet,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });

    // Subtle Workspace Ring Material
    this._matWorkspaceRing = new THREE.MeshStandardMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      transparent: true,
      opacity: 0.45,
    });

    this._sharedMaterials.add(
      this._matLinkBody,
      this._matJointHousing,
      this._matMachinedTrim,
      this._matCyanGlow,
      this._matAmberGlow,
      this._matEmeraldGlow,
      this._matVioletGlow,
      this._matCoralGlow,
      this._matGhostLink,
      this._matGhostJoint,
      this._matWorkspaceRing
    );
  }

  // --------------------------------------------------------------------------
  // Workcell Plinth, Frosted Deck & Cartesian Grid
  // --------------------------------------------------------------------------

  _buildWorkcellPlinth() {
    const plinthR = 3.85;
    const plinthH = 0.28;

    // 1. Floating frosted dark-glass beveled cylindrical workcell plinth
    const slabGeo = createWorkcellPlinthGeometry(plinthR, plinthH, 0.055);
    const slabMat = new THREE.MeshPhysicalMaterial({
      color: COLORS.plinthDark,
      metalness: 0.28,
      roughness: 0.26,
      clearcoat: 0.82,
      clearcoatRoughness: 0.16,
      reflectivity: 0.85,
      transparent: true,
      opacity: 0.94,
    });
    const slabMesh = new THREE.Mesh(slabGeo, slabMat);
    this._plinthGroup.add(slabMesh);

    // 2. Luminous Cyan perimeter rim halo
    this._plinthRimMat = new THREE.MeshStandardMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.15,
      roughness: 0.2,
      metalness: 0.3,
    });
    const rimMesh = createFlatRingMesh(plinthR - 0.03, 0.016, -0.02, this._plinthRimMat);
    this._plinthGroup.add(rimMesh);

    // 3. Subtle secondary under-glow ring
    const underRingMat = new THREE.MeshStandardMaterial({
      color: COLORS.violet,
      emissive: COLORS.violetDeep,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.45,
    });
    const underRing = createFlatRingMesh(plinthR - 0.25, 0.012, -plinthH + 0.02, underRingMat);
    this._plinthGroup.add(underRing);

    // 4. Fine Cartesian Grid clipped to circular workcell deck (Y = 0.004)
    const gridPtsMinor = [];
    const gridPtsMajor = [];
    const gridMaxR = plinthR - 0.18;
    const step = 0.5;
    for (let v = -3.5; v <= 3.5 + 1e-6; v += step) {
      const halfSpan = Math.sqrt(Math.max(0, gridMaxR * gridMaxR - v * v));
      if (halfSpan < 0.05) continue;
      const isMajor = Math.abs(Math.round(v) - v) < 1e-4;
      const target = isMajor ? gridPtsMajor : gridPtsMinor;
      // Line along X
      target.push(new THREE.Vector3(-halfSpan, 0.004, v), new THREE.Vector3(halfSpan, 0.004, v));
      // Line along Z
      target.push(new THREE.Vector3(v, 0.004, -halfSpan), new THREE.Vector3(v, 0.004, halfSpan));
    }

    const minorGeo = new THREE.BufferGeometry().setFromPoints(gridPtsMinor);
    const minorMat = new THREE.LineBasicMaterial({
      color: COLORS.gridMinor,
      transparent: true,
      opacity: 0.52,
    });
    this._plinthGroup.add(new THREE.LineSegments(minorGeo, minorMat));

    const majorGeo = new THREE.BufferGeometry().setFromPoints(gridPtsMajor);
    const majorMat = new THREE.LineBasicMaterial({
      color: COLORS.gridMajor,
      transparent: true,
      opacity: 0.68,
    });
    this._plinthGroup.add(new THREE.LineSegments(majorGeo, majorMat));

    // 5. Workcell Base Pedestal Mounting Flange + 8 Socket Bolts
    const flange = new THREE.Mesh(this._unitCylGeo, this._matJointHousing);
    flange.scale.set(0.46, 0.12, 0.46);
    flange.position.y = 0.06;
    this._plinthGroup.add(flange);

    const flangeRing = createFlatRingMesh(0.46, 0.012, 0.115, this._matCyanGlow);
    this._plinthGroup.add(flangeRing);

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const bolt = new THREE.Mesh(this._unitCylGeo, this._matMachinedTrim);
      bolt.scale.set(0.028, 0.025, 0.028);
      bolt.position.set(Math.cos(a) * 0.37, 0.125, Math.sin(a) * 0.37);
      this._plinthGroup.add(bolt);
    }

    // 6. Base World Coordinate Triad at origin deck
    this._addCoordinateTriad(this._plinthGroup, new THREE.Vector3(0, 0.015, 0), new THREE.Quaternion(), 0.72, 0.016);
  }

  // --------------------------------------------------------------------------
  // Reusable Sculpted Robotics Builders
  // --------------------------------------------------------------------------

  /**
   * Adds a crisp RGB local coordinate triad:
   *   x = Coral, y = Emerald, z = Cyan
   */
  _addCoordinateTriad(parent, position, quaternion, length = 0.36, shaftR = 0.012) {
    const triad = new THREE.Group();
    triad.position.copy(position);
    triad.quaternion.copy(quaternion);

    const axes = [
      { dir: new THREE.Vector3(1, 0, 0), mat: this._matCoralGlow },
      { dir: new THREE.Vector3(0, 1, 0), mat: this._matEmeraldGlow },
      { dir: new THREE.Vector3(0, 0, 1), mat: this._matCyanGlow },
    ];

    const headLen = length * 0.28;
    const shaftLen = Math.max(length - headLen, 0.05);

    for (let i = 0; i < 3; i++) {
      const { dir, mat } = axes[i];
      const q = quaternionFromUpToDir(dir);

      const shaft = new THREE.Mesh(this._unitCylGeo, mat);
      shaft.scale.set(shaftR, shaftLen, shaftR);
      shaft.position.copy(dir).multiplyScalar(shaftLen * 0.5);
      shaft.quaternion.copy(q);
      triad.add(shaft);

      const cone = new THREE.Mesh(this._unitConeGeo, mat);
      cone.scale.set(shaftR * 2.5, headLen, shaftR * 2.5);
      cone.position.copy(dir).multiplyScalar(shaftLen + headLen * 0.5);
      cone.quaternion.copy(q);
      triad.add(cone);
    }

    parent.add(triad);
    return triad;
  }

  /**
   * Adds a sculpted 3D vector arrow between `origin` and `origin + dir * length`.
   */
  _addVectorArrow(parent, origin, dir, length, radius, material) {
    if (length < 1e-4) return null;
    const group = new THREE.Group();
    const d = dir.clone().normalize();
    const q = quaternionFromUpToDir(d);
    const headLen = Math.min(length * 0.28, radius * 5.2);
    const shaftLen = Math.max(length - headLen, 0.02);

    const shaft = new THREE.Mesh(this._unitCylGeo, material);
    shaft.scale.set(radius, shaftLen, radius);
    shaft.position.copy(origin).addScaledVector(d, shaftLen * 0.5);
    shaft.quaternion.copy(q);
    group.add(shaft);

    const cone = new THREE.Mesh(this._unitConeGeo, material);
    cone.scale.set(radius * 2.6, headLen, radius * 2.6);
    cone.position.copy(origin).addScaledVector(d, shaftLen + headLen * 0.5);
    cone.quaternion.copy(q);
    group.add(cone);

    parent.add(group);
    return group;
  }

  /**
   * Sculpted Anodized Robotic Arm Link between world points A and B.
   */
  _addSculptedLink(parent, pA, pB, width = 0.14, depth = 0.11, spineMat = this._matCyanGlow) {
    const delta = new THREE.Vector3().subVectors(pB, pA);
    const len = delta.length();
    if (len < 1e-4) return;

    const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
    const dir = delta.clone().normalize();
    const q = quaternionFromUpToDir(dir);

    const linkGroup = new THREE.Group();
    linkGroup.position.copy(mid);
    linkGroup.quaternion.copy(q);

    // Main anodized housing
    const body = new THREE.Mesh(this._unitBoxGeo, this._matLinkBody);
    body.scale.set(width, Math.max(len - 0.10, len * 0.78), depth);
    linkGroup.add(body);

    // Brushed machined side rails
    const railLen = Math.max(len - 0.18, len * 0.65);
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(this._unitCylGeo, this._matMachinedTrim);
      rail.scale.set(width * 0.16, railLen, width * 0.16);
      rail.position.set(side * width * 0.48, 0, 0);
      linkGroup.add(rail);
    }

    // Glowing telemetry spine strip along link face
    const spine = new THREE.Mesh(this._unitBoxGeo, spineMat);
    spine.scale.set(width * 0.18, Math.max(len - 0.24, len * 0.55), depth * 1.04);
    linkGroup.add(spine);

    parent.add(linkGroup);
  }

  /**
   * Sculpted Servo Joint Housing aligned with its rotation axis `axisWorld`.
   */
  _addServoJoint(parent, posWorld, axisWorld, radius = 0.16, height = 0.22, accentHex = COLORS.cyan) {
    const group = new THREE.Group();
    group.position.copy(posWorld);
    group.quaternion.copy(quaternionFromUpToDir(axisWorld));

    // Stator drum
    const drum = new THREE.Mesh(this._unitCylGeo, this._matJointHousing);
    drum.scale.set(radius, height, radius);
    group.add(drum);

    // Chamfered chrome end caps
    for (const sign of [-1, 1]) {
      const cap = new THREE.Mesh(this._unitCylGeo, this._matMachinedTrim);
      cap.scale.set(radius * 0.72, 0.024, radius * 0.72);
      cap.position.y = sign * (height * 0.5 + 0.012);
      group.add(cap);
    }

    // Luminous servo collar ring (tracks for subtle pulse animation)
    const collarMat = new THREE.MeshStandardMaterial({
      color: accentHex === COLORS.amber ? COLORS.amberLight : COLORS.cyanLight,
      emissive: accentHex,
      emissiveIntensity: 1.45,
      roughness: 0.18,
      metalness: 0.25,
    });
    this._servoCollarMats.push(collarMat);

    const collar = new THREE.Mesh(this._unitTorusGeo, collarMat);
    collar.rotation.x = Math.PI / 2;
    collar.scale.set(radius * 1.03, radius * 1.03, radius * 0.65);
    group.add(collar);

    parent.add(group);
  }

  /**
   * Sculpted Parallel-Jaw End-Effector Gripper mounted at EE frame.
   */
  _addEndEffectorGripper(parent, eePosWorld, eeQuat) {
    const grp = new THREE.Group();
    grp.position.copy(eePosWorld);
    grp.quaternion.copy(eeQuat);

    // Wrist collar
    const wrist = new THREE.Mesh(this._unitCylGeo, this._matJointHousing);
    wrist.rotation.z = Math.PI / 2;
    wrist.scale.set(0.085, 0.11, 0.085);
    grp.add(wrist);

    // Crossbar
    const bar = new THREE.Mesh(this._unitBoxGeo, this._matMachinedTrim);
    bar.scale.set(0.04, 0.18, 0.06);
    bar.position.set(0.06, 0, 0);
    grp.add(bar);

    // Dual parallel fingers
    for (const s of [-1, 1]) {
      const jaw = new THREE.Mesh(this._unitBoxGeo, this._matMachinedTrim);
      jaw.scale.set(0.14, 0.026, 0.036);
      jaw.position.set(0.13, s * 0.072, 0);
      grp.add(jaw);
    }

    // Glowing TCP Emitter Jewel right at the exact Tool Center Point (0,0,0)
    const tcp = new THREE.Mesh(this._unitSphereGeo, this._matCyanGlow);
    tcp.scale.setScalar(0.052);
    grp.add(tcp);

    parent.add(grp);
  }

  /**
   * Builds a translucent Violet Ghost Arm (elbow-up/down branch or unregularized QP baseline).
   */
  _addGhostArm(joints, isDashedSilhouette = false) {
    if (!joints || joints.length < 2) return;
    const worldPts = joints.map(robotToWorld);

    if (isDashedSilhouette) {
      // PoE Home Pose M crisp dashed silhouette + translucent rings
      const lineGeo = new THREE.BufferGeometry().setFromPoints(worldPts);
      const lineMat = new THREE.LineDashedMaterial({
        color: COLORS.violetLight,
        dashSize: 0.14,
        gapSize: 0.09,
        transparent: true,
        opacity: 0.78,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      this._ghostGroup.add(line);

      for (let i = 1; i < worldPts.length; i++) {
        const ring = new THREE.Mesh(this._unitTorusGeo, this._matGhostJoint);
        ring.position.copy(worldPts[i]);
        ring.scale.setScalar(i === worldPts.length - 1 ? 0.11 : 0.085);
        this._ghostGroup.add(ring);
      }
      return;
    }

    // Translucent Violet glass ghost links & joints
    for (let i = 0; i < worldPts.length - 1; i++) {
      const a = worldPts[i];
      const b = worldPts[i + 1];
      const delta = new THREE.Vector3().subVectors(b, a);
      const len = delta.length();
      if (len < 1e-4) continue;
      const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
      const seg = new THREE.Mesh(this._unitCylGeo, this._matGhostLink);
      seg.scale.set(0.058, len, 0.058);
      seg.position.copy(mid);
      seg.quaternion.copy(quaternionFromUpToDir(delta));
      this._ghostGroup.add(seg);
    }

    for (let i = 0; i < worldPts.length; i++) {
      const node = new THREE.Mesh(this._unitSphereGeo, this._matGhostJoint);
      node.scale.setScalar(i === worldPts.length - 1 ? 0.075 : 0.092);
      node.position.copy(worldPts[i]);
      this._ghostGroup.add(node);
    }
  }

  /**
   * Builds the 3D Manipulability Ellipsoid centered at the End-Effector.
   * Visibly stretches and flattens into a razor-thin pancake/needle near singularities!
   */
  _buildManipulabilityEllipsoid(analysis) {
    const { eePos, ellipsoid, conditionNumber, sigma2 } = analysis;
    if (!eePos || !ellipsoid) return;

    const eeWorld = robotToWorld(eePos);
    const u1 = robotDirToWorld(ellipsoid.axes[0]);
    const u2 = robotDirToWorld(ellipsoid.axes[1]);
    const u3 = robotDirToWorld(ellipsoid.axes[2]);
    // Ensure right-handed orthonormal basis
    const u3Ortho = new THREE.Vector3().crossVectors(u1, u2).normalize();
    if (u3Ortho.dot(u3) < 0) u3Ortho.negate();

    const basis = new THREE.Matrix4().makeBasis(u1, u2, u3Ortho);
    const quat = new THREE.Quaternion().setFromRotationMatrix(basis);

    const [r1, r2, r3] = ellipsoid.radii;

    // Color transitions Cyan -> Amber -> Coral as arm approaches singularity
    let accentHex = COLORS.cyan;
    let lightHex = COLORS.cyanLight;
    if (sigma2 < 0.22 || conditionNumber > 9.0) {
      accentHex = COLORS.coral;
      lightHex = COLORS.coralLight;
    } else if (conditionNumber > 3.5) {
      accentHex = COLORS.amber;
      lightHex = COLORS.amberLight;
    }

    const group = new THREE.Group();
    group.position.copy(eeWorld);
    group.quaternion.copy(quat);

    // Translucent frosted ellipsoid shell
    this._ellipsoidShellMat = new THREE.MeshPhysicalMaterial({
      color: lightHex,
      emissive: accentHex,
      emissiveIntensity: 0.52,
      roughness: 0.14,
      metalness: 0.08,
      clearcoat: 0.9,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const shell = new THREE.Mesh(this._unitSphereGeo, this._ellipsoidShellMat);
    shell.scale.set(r1, r2, r3);
    group.add(shell);

    // Crisp equatorial & meridian glowing wireframe loops
    const ringMat = new THREE.MeshStandardMaterial({
      color: lightHex,
      emissive: accentHex,
      emissiveIntensity: 1.45,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
    });

    const makeEllipseLoop = (a, b, plane) => {
      const pts = [];
      const segs = 56;
      for (let i = 0; i <= segs; i++) {
        const t = (i / segs) * Math.PI * 2;
        const ca = Math.cos(t) * a;
        const sb = Math.sin(t) * b;
        if (plane === 'xy') pts.push(new THREE.Vector3(ca, sb, 0));
        else if (plane === 'xz') pts.push(new THREE.Vector3(ca, 0, sb));
        else pts.push(new THREE.Vector3(0, ca, sb));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const lm = new THREE.LineBasicMaterial({
        color: lightHex,
        transparent: true,
        opacity: 0.85,
      });
      return new THREE.Line(g, lm);
    };

    group.add(makeEllipseLoop(r1, r2, 'xy'));
    group.add(makeEllipseLoop(r1, r3, 'xz'));
    group.add(makeEllipseLoop(r2, r3, 'yz'));

    // Principal semi-axis rods inside ellipsoid
    const ax1 = new THREE.Mesh(this._unitCylGeo, ringMat);
    ax1.rotation.z = Math.PI / 2;
    ax1.scale.set(0.009, r1 * 2, 0.009);
    group.add(ax1);

    const ax2 = new THREE.Mesh(this._unitCylGeo, ringMat);
    ax2.scale.set(0.009, r2 * 2, 0.009);
    group.add(ax2);

    this._ellipsoidGroup.add(group);
  }

  // --------------------------------------------------------------------------
  // Mechatronics Lens: Static Joint Torques tau = J^T F & 10 N Payload Vector
  // --------------------------------------------------------------------------

  _buildMechatronicsOverlay(analysis) {
    const { torques, jointAxes, eePos, payloadForce } = analysis;
    if (!torques || !jointAxes) return;

    // Color interpolation helper: Emerald -> Amber -> Coral as |tau| rises
    const torqueColor = (normLoad) => {
      if (normLoad > 0.72) return { main: COLORS.coral, light: COLORS.coralLight };
      if (normLoad > 0.36) return { main: COLORS.amber, light: COLORS.amberLight };
      return { main: COLORS.emerald, light: COLORS.emeraldLight };
    };

    for (let i = 0; i < Math.min(torques.length, jointAxes.length); i++) {
      const tau = torques[i];
      const axisInfo = jointAxes[i];
      const absTau = Math.abs(tau);
      const loadFrac = clamp(absTau / 24.0, 0.08, 1.0);
      const { main, light } = torqueColor(loadFrac);

      const mat = new THREE.MeshStandardMaterial({
        color: light,
        emissive: main,
        emissiveIntensity: 1.55,
        roughness: 0.16,
        metalness: 0.25,
      });

      const originWorld = robotToWorld(axisInfo.origin);
      const axisWorld = robotDirToWorld(axisInfo.dir);

      if (axisInfo.isPrismatic) {
        // Vertical glowing axial force bar for SCARA prismatic quill
        const barLen = clamp(absTau * 0.065, 0.18, 0.95);
        this._addVectorArrow(
          this._mechatronicsGroup,
          originWorld.clone().add(new THREE.Vector3(0.24, -0.15, 0)),
          new THREE.Vector3(0, 1, 0),
          barLen,
          0.026,
          mat
        );
      } else {
        // Glowing partial torus torque arc around servo joint proportional to |tau_i|
        const sweep = clamp(0.45 + loadFrac * Math.PI * 1.45, 0.45, Math.PI * 1.85);
        const arcRadius = 0.27 + (i === 0 ? 0.06 : 0);
        const arcGeo = new THREE.TorusGeometry(arcRadius, 0.022, 12, 42, sweep);
        const arcMesh = new THREE.Mesh(arcGeo, mat);

        const holder = new THREE.Group();
        holder.position.copy(originWorld);
        holder.quaternion.copy(quaternionFromUpToDir(axisWorld));
        // Torus lies in XY plane (normal along +Z); rotate so normal aligns with local +Y (axisWorld)
        arcMesh.rotation.x = Math.PI / 2;
        if (tau < 0) {
          arcMesh.scale.y = -1;
        }
        holder.add(arcMesh);

        // Arrowhead at the leading tip of the torque arc
        const tipAngle = tau >= 0 ? sweep : -sweep;
        const tipPos = new THREE.Vector3(
          Math.cos(tipAngle) * arcRadius,
          0,
          -Math.sin(tipAngle) * arcRadius
        );
        const tangent = new THREE.Vector3(
          -Math.sin(tipAngle) * (tau >= 0 ? 1 : -1),
          0,
          -Math.cos(tipAngle) * (tau >= 0 ? 1 : -1)
        ).normalize();
        const tipCone = new THREE.Mesh(this._unitConeGeo, mat);
        tipCone.scale.set(0.052, 0.11, 0.052);
        tipCone.position.copy(tipPos);
        tipCone.quaternion.copy(quaternionFromUpToDir(tangent));
        holder.add(tipCone);

        this._mechatronicsGroup.add(holder);
      }
    }

    // 10 N Payload Force Arrow F at End-Effector
    if (eePos && payloadForce) {
      const eeW = robotToWorld(eePos);
      const fDir = robotDirToWorld(payloadForce);
      const fLen = 0.92;
      this._addVectorArrow(this._mechatronicsGroup, eeW, fDir, fLen, 0.032, this._matCoralGlow);

      // Animated pulse ring sliding along force arrow
      const pulseRing = new THREE.Mesh(this._unitTorusGeo, this._matCoralGlow);
      pulseRing.scale.setScalar(0.11);
      pulseRing.position.copy(eeW).addScaledVector(fDir, fLen * 0.45);
      pulseRing.quaternion.copy(quaternionFromUpToDir(fDir));
      pulseRing.rotateX(Math.PI / 2);
      this._mechatronicsGroup.add(pulseRing);
      this._forceArrowPulse = { mesh: pulseRing, origin: eeW, dir: fDir, len: fLen };
    }
  }

  // --------------------------------------------------------------------------
  // Full Mode Scene Rebuilder (All 5 Presets)
  // --------------------------------------------------------------------------

  _rebuildKinematicsScene() {
    disposeGroupChildren(this._workspaceGroup, this._sharedGeometries, this._sharedMaterials);
    disposeGroupChildren(this._ghostGroup, this._sharedGeometries, this._sharedMaterials);
    disposeGroupChildren(this._armGroup, this._sharedGeometries, this._sharedMaterials);
    disposeGroupChildren(this._ellipsoidGroup, this._sharedGeometries, this._sharedMaterials);
    disposeGroupChildren(this._heroGroup, this._sharedGeometries, this._sharedMaterials);
    disposeGroupChildren(this._mechatronicsGroup, this._sharedGeometries, this._sharedMaterials);

    this._servoCollarMats = [];
    this._targetBeaconGroup = null;
    this._spikeHaloMesh = null;
    this._obstacleRingMesh = null;
    this._quillRingMeshes = [];
    this._forceArrowPulse = null;
    this._ellipsoidShellMat = null;

    const a = this._analysis;
    const { presetId, joints, jointFrames, workspace } = a;

    // 1. Workspace Annulus Rings on Workcell Plinth
    if (workspace) {
      const isDls = presetId === 'ik-dls';
      if (workspace.rMin > 0.05) {
        this._workspaceGroup.add(
          createFlatRingMesh(workspace.rMin, 0.008, 0.012, this._matWorkspaceRing)
        );
      }
      if (isDls) {
        // Red dashed outer singularity boundary ring at r = L1 + L2 = 3.00 m
        this._workspaceGroup.add(
          createDashedRingLine(workspace.rMax, 0.018, COLORS.coral, 0.18, 0.10, 120)
        );
        // Elevated translucent singularity boundary hoop at arm height
        this._workspaceGroup.add(
          createDashedRingLine(workspace.rMax, workspace.zPlane, COLORS.coral, 0.16, 0.12, 120)
        );
      } else {
        this._workspaceGroup.add(
          createFlatRingMesh(workspace.rMax, 0.010, 0.012, this._matWorkspaceRing)
        );
      }
    }

    // 2. Build Robot Arm Assembly by Preset
    if (presetId === 'scara-rrp') {
      this._buildScaraArm(a);
    } else if (presetId === 'poe-3r') {
      this._buildPoe3RArm(a);
    } else {
      this._buildPlanarArticulatedArm(a);
    }

    // 3. Local RGB Coordinate Triads at every Joint & EE
    if (jointFrames) {
      for (let i = 0; i < jointFrames.length; i++) {
        const f = jointFrames[i];
        const posW = robotToWorld(f.pos);
        const quat = robotBasisToQuaternion(f.rot);
        const isEE = i === jointFrames.length - 1;
        this._addCoordinateTriad(this._armGroup, posW, quat, isEE ? 0.42 : 0.30, isEE ? 0.013 : 0.010);
      }
    }

    // 4. Ghost Branch or PoE Home Pose M Silhouette
    if (a.ghostJoints) {
      this._addGhostArm(a.ghostJoints, presetId === 'poe-3r');
    }

    // 5. 3D Manipulability Ellipsoid at End-Effector
    this._buildManipulabilityEllipsoid(a);

    // 6. Mode-Specific Hero Visuals
    if (presetId === 'ik-dls') {
      this._buildDlsHeroVisuals(a);
    } else if (presetId === 'qp-ik-3r') {
      this._buildQpIkHeroVisuals(a);
    } else if (presetId === 'poe-3r') {
      this._buildPoeScrewArrows(a);
    }

    // 7. Mechatronics Torque & Payload Overlay
    this._buildMechatronicsOverlay(a);
    this._mechatronicsGroup.visible = this.mechatronicsLens;
  }

  _buildPlanarArticulatedArm(analysis) {
    const worldJoints = analysis.joints.map(robotToWorld);
    const zAxisW = new THREE.Vector3(0, 1, 0);

    // Base pedestal riser from workcell flange (Y=0.10) up to Joint 1 (Y=z0)
    const baseHeight = Math.max(worldJoints[0].y - 0.08, 0.16);
    const riser = new THREE.Mesh(this._unitCylGeo, this._matJointHousing);
    riser.scale.set(0.22, baseHeight, 0.22);
    riser.position.set(0, 0.08 + baseHeight * 0.5, 0);
    this._armGroup.add(riser);

    // Sculpted links + servo joints
    const numLinks = worldJoints.length - 1;
    for (let i = 0; i < numLinks; i++) {
      const width = 0.155 - i * 0.022;
      const depth = 0.115 - i * 0.015;
      const spineMat = i % 2 === 0 ? this._matCyanGlow : this._matAmberGlow;
      this._addSculptedLink(this._armGroup, worldJoints[i], worldJoints[i + 1], width, depth, spineMat);

      const jRadius = 0.175 - i * 0.024;
      const accent = i % 2 === 0 ? COLORS.cyan : COLORS.amber;
      this._addServoJoint(this._armGroup, worldJoints[i], zAxisW, jRadius, 0.24 - i * 0.025, accent);
    }

    // End-effector gripper aligned with last frame
    const eeFrame = analysis.jointFrames[analysis.jointFrames.length - 1];
    this._addEndEffectorGripper(
      this._armGroup,
      worldJoints[worldJoints.length - 1],
      robotBasisToQuaternion(eeFrame.rot)
    );
  }

  _buildScaraArm(analysis) {
    // joints = [pBase, pShoulder, pElbow, pQuillTop, pEE]
    const wPts = analysis.joints.map(robotToWorld);
    const [pBase, pShoulder, pElbow, pQuillTop, pEE] = wPts;
    const up = new THREE.Vector3(0, 1, 0);

    // 1. Vertical metallic SCARA base column with anodized cooling ribs
    const colH = pShoulder.y - 0.10;
    const column = new THREE.Mesh(this._unitCylGeo, this._matLinkBody);
    column.scale.set(0.22, colH, 0.22);
    column.position.set(0, 0.10 + colH * 0.5, 0);
    this._armGroup.add(column);

    for (let r = 0; r < 4; r++) {
      const rib = createFlatRingMesh(0.235, 0.012, 0.35 + r * 0.38, this._matMachinedTrim);
      this._armGroup.add(rib);
    }

    // 2. Two horizontal SCARA links at z = d1
    this._addSculptedLink(this._armGroup, pShoulder, pElbow, 0.18, 0.14, this._matCyanGlow);
    this._addSculptedLink(this._armGroup, pElbow, pQuillTop, 0.15, 0.12, this._matAmberGlow);

    // 3. Shoulder & Elbow servo turrets
    this._addServoJoint(this._armGroup, pShoulder, up, 0.23, 0.28, COLORS.cyan);
    this._addServoJoint(this._armGroup, pElbow, up, 0.18, 0.24, COLORS.amber);

    // 4. Prismatic Quill Housing at pQuillTop
    const housing = new THREE.Mesh(this._unitCylGeo, this._matJointHousing);
    housing.scale.set(0.14, 0.34, 0.14);
    housing.position.copy(pQuillTop);
    this._armGroup.add(housing);

    const housingCollar = createFlatRingMesh(0.148, 0.016, pQuillTop.y - 0.15, this._matEmeraldGlow);
    housingCollar.position.x = pQuillTop.x;
    housingCollar.position.z = pQuillTop.z;
    this._armGroup.add(housingCollar);

    // 5. Glowing Emerald Vertical Prismatic Lead-Screw Quill (d3)
    const quillLen = Math.max(pQuillTop.y - pEE.y, 0.08);
    const quillCore = new THREE.Mesh(this._unitCylGeo, this._matEmeraldGlow);
    quillCore.scale.set(0.042, quillLen, 0.042);
    quillCore.position.set(pQuillTop.x, pEE.y + quillLen * 0.5, pQuillTop.z);
    this._armGroup.add(quillCore);

    // Helical lead-screw thread rings along the Emerald quill
    const numRings = Math.max(3, Math.floor(quillLen / 0.14));
    for (let i = 0; i < numRings; i++) {
      const frac = (i + 0.5) / numRings;
      const y = pEE.y + frac * quillLen;
      const threadRing = new THREE.Mesh(this._unitTorusGeo, this._matMachinedTrim);
      threadRing.rotation.x = Math.PI / 2;
      threadRing.scale.set(0.062, 0.062, 0.04);
      threadRing.position.set(pQuillTop.x, y, pQuillTop.z);
      this._armGroup.add(threadRing);
      this._quillRingMeshes.push({ mesh: threadRing, baseY: y });
    }

    // Glowing vertical screw-axis guide arrow alongside the quill
    this._addVectorArrow(
      this._heroGroup,
      new THREE.Vector3(pQuillTop.x, pQuillTop.y + 0.45, pQuillTop.z),
      new THREE.Vector3(0, -1, 0),
      0.38,
      0.016,
      this._matVioletGlow
    );

    // Subtle Violet screw axes at Shoulder & Elbow
    this._addVectorArrow(
      this._heroGroup,
      new THREE.Vector3(0, pShoulder.y + 0.16, 0),
      up,
      0.52,
      0.015,
      this._matVioletGlow
    );
    this._addVectorArrow(
      this._heroGroup,
      new THREE.Vector3(pElbow.x, pElbow.y + 0.14, pElbow.z),
      up,
      0.46,
      0.015,
      this._matVioletGlow
    );

    // Tool tip chuck at pEE
    const toolChuck = new THREE.Mesh(this._unitConeGeo, this._matMachinedTrim);
    toolChuck.rotation.x = Math.PI;
    toolChuck.scale.set(0.075, 0.14, 0.075);
    toolChuck.position.copy(pEE).add(new THREE.Vector3(0, 0.05, 0));
    this._armGroup.add(toolChuck);

    const tcp = new THREE.Mesh(this._unitSphereGeo, this._matEmeraldGlow);
    tcp.scale.setScalar(0.048);
    tcp.position.copy(pEE);
    this._armGroup.add(tcp);

    // Drop line from EE to workcell deck
    const dropGeo = new THREE.BufferGeometry().setFromPoints([
      pEE,
      new THREE.Vector3(pEE.x, 0.01, pEE.z),
    ]);
    const dropMat = new THREE.LineDashedMaterial({
      color: COLORS.emeraldLight,
      dashSize: 0.08,
      gapSize: 0.06,
      transparent: true,
      opacity: 0.65,
    });
    const dropLine = new THREE.Line(dropGeo, dropMat);
    dropLine.computeLineDistances();
    this._heroGroup.add(dropLine);
  }

  _buildPoe3RArm(analysis) {
    // joints = [p0, p1 (shoulder), p2 (elbow), p3 (EE)]
    const wPts = analysis.joints.map(robotToWorld);
    const [p0, p1, p2, p3] = wPts;
    const axes = analysis.jointAxes;

    // Vertical yaw turret pedestal from plinth to shoulder p1
    const pedH = Math.max(p1.y - 0.10, 0.25);
    const ped = new THREE.Mesh(this._unitCylGeo, this._matJointHousing);
    ped.scale.set(0.24, pedH, 0.24);
    ped.position.set(0, 0.10 + pedH * 0.5, 0);
    this._armGroup.add(ped);

    // Base yaw servo collar near plinth
    this._addServoJoint(this._armGroup, new THREE.Vector3(0, 0.34, 0), new THREE.Vector3(0, 1, 0), 0.26, 0.18, COLORS.cyan);

    // Upper arm (shoulder -> elbow) and Forearm (elbow -> EE)
    this._addSculptedLink(this._armGroup, p1, p2, 0.155, 0.13, this._matCyanGlow);
    this._addSculptedLink(this._armGroup, p2, p3, 0.125, 0.105, this._matAmberGlow);

    // Shoulder pitch & Elbow pitch servo drums aligned with live screw axes S2, S3
    this._addServoJoint(this._armGroup, p1, robotDirToWorld(axes[1].dir), 0.19, 0.26, COLORS.amber);
    this._addServoJoint(this._armGroup, p2, robotDirToWorld(axes[2].dir), 0.155, 0.22, COLORS.cyan);

    // Sculpted gripper at EE
    const eeFrame = analysis.jointFrames[analysis.jointFrames.length - 1];
    this._addEndEffectorGripper(this._armGroup, p3, robotBasisToQuaternion(eeFrame.rot));
  }

  /**
   * 3 Glowing Violet Screw Axis arrows (S1, S2, S3) with right-hand twist curl rings!
   */
  _buildPoeScrewArrows(analysis) {
    const axes = analysis.jointAxes;
    if (!axes) return;

    for (let i = 0; i < axes.length; i++) {
      const originW = robotToWorld(axes[i].origin);
      const dirW = robotDirToWorld(axes[i].dir);

      const halfLen = i === 0 ? 1.15 : 0.78;
      const start = originW.clone().addScaledVector(dirW, -halfLen * 0.45);
      const totalLen = halfLen * 1.45;
      this._addVectorArrow(this._heroGroup, start, dirW, totalLen, 0.018, this._matVioletGlow);

      // Right-hand rotation curl ring around the screw axis tip
      const curlGeo = new THREE.TorusGeometry(0.14, 0.012, 10, 32, Math.PI * 1.45);
      const curlMesh = new THREE.Mesh(curlGeo, this._matVioletGlow);
      const curlHolder = new THREE.Group();
      curlHolder.position.copy(start).addScaledVector(dirW, totalLen * 0.72);
      curlHolder.quaternion.copy(quaternionFromUpToDir(dirW));
      curlMesh.rotation.x = Math.PI / 2;
      curlHolder.add(curlMesh);
      this._heroGroup.add(curlHolder);
    }
  }

  /**
   * Mode 4 (DLS Singularity IK): Glowing Amber target beacon + velocity-spike comparison halo.
   */
  _buildDlsHeroVisuals(analysis) {
    const { targetPos, eePos, dlsVelNorm, pinvVelNorm } = analysis;
    if (!targetPos) return;

    const tWorld = robotToWorld(targetPos);
    const eeWorld = robotToWorld(eePos);

    // 1. Glowing Amber Target Beacon Sphere + Dual Reticle Rings
    const beacon = new THREE.Group();
    beacon.position.copy(tWorld);

    const core = new THREE.Mesh(this._unitSphereGeo, this._matAmberGlow);
    core.scale.setScalar(0.115);
    beacon.add(core);

    const ringA = new THREE.Mesh(this._unitTorusGeo, this._matAmberGlow);
    ringA.scale.setScalar(0.22);
    ringA.rotation.x = Math.PI / 2;
    beacon.add(ringA);

    const ringB = new THREE.Mesh(this._unitTorusGeo, this._matAmberGlow);
    ringB.scale.setScalar(0.18);
    ringB.rotation.y = Math.PI / 3;
    beacon.add(ringB);

    this._heroGroup.add(beacon);
    this._targetBeaconGroup = beacon;

    // Vertical drop line from target beacon to plinth
    const dropGeo = new THREE.BufferGeometry().setFromPoints([
      tWorld,
      new THREE.Vector3(tWorld.x, 0.015, tWorld.z),
    ]);
    const dropMat = new THREE.LineDashedMaterial({
      color: COLORS.amberLight,
      dashSize: 0.08,
      gapSize: 0.06,
      transparent: true,
      opacity: 0.7,
    });
    const dropLine = new THREE.Line(dropGeo, dropMat);
    dropLine.computeLineDistances();
    this._heroGroup.add(dropLine);

    // 2. Error tether between EE and Target (visible when unreachable or heavily damped)
    if (eeWorld.distanceTo(tWorld) > 0.025) {
      const errGeo = new THREE.BufferGeometry().setFromPoints([eeWorld, tWorld]);
      const errMat = new THREE.LineBasicMaterial({
        color: COLORS.amberLight,
        transparent: true,
        opacity: 0.85,
      });
      this._heroGroup.add(new THREE.Line(errGeo, errMat));
    }

    // 3. Velocity-Spike Comparison Halo at Elbow Joint:
    //    - Compact Emerald/Cyan ring = bounded DLS velocity ||dq_dls||
    //    - Expanding glowing Coral halo = undamped pseudoinverse explosion ||dq_pinv||
    const elbowW = robotToWorld(analysis.joints[1]);
    const dlsRadius = clamp(0.20 + dlsVelNorm * 0.055, 0.22, 0.55);
    const pinvRadius = clamp(0.24 + Math.log1p(pinvVelNorm) * 0.16, 0.26, 1.18);

    const dlsRing = createFlatRingMesh(dlsRadius, 0.016, elbowW.y + 0.15, this._matEmeraldGlow);
    dlsRing.position.x = elbowW.x;
    dlsRing.position.z = elbowW.z;
    this._heroGroup.add(dlsRing);

    const spikeMat = new THREE.MeshStandardMaterial({
      color: COLORS.coralLight,
      emissive: COLORS.coral,
      emissiveIntensity: pinvVelNorm > 8 ? 1.85 : 1.25,
      roughness: 0.18,
      transparent: true,
      opacity: pinvVelNorm > 4 ? 0.82 : 0.42,
    });
    const spikeHalo = createFlatRingMesh(pinvRadius, 0.020, elbowW.y + 0.16, spikeMat);
    spikeHalo.position.x = elbowW.x;
    spikeHalo.position.z = elbowW.z;
    this._heroGroup.add(spikeHalo);
    this._spikeHaloMesh = spikeHalo;
  }

  /**
   * Mode 5 (QP-IK Redundant 3R): Glowing Coral obstacle cylinder + joint-stop limit arcs + Amber beacon.
   */
  _buildQpIkHeroVisuals(analysis) {
    const { targetPos, obstacle, closestObstaclePoint, jointLimits, joints, q } = analysis;

    // 1. Glowing Amber Target Beacon
    if (targetPos) {
      const tWorld = robotToWorld(targetPos);
      const beacon = new THREE.Group();
      beacon.position.copy(tWorld);

      const core = new THREE.Mesh(this._unitSphereGeo, this._matAmberGlow);
      core.scale.setScalar(0.11);
      beacon.add(core);

      const ring = new THREE.Mesh(this._unitTorusGeo, this._matAmberGlow);
      ring.scale.setScalar(0.21);
      ring.rotation.x = Math.PI / 2;
      beacon.add(ring);

      this._heroGroup.add(beacon);
      this._targetBeaconGroup = beacon;
    }

    // 2. Glowing Frosted Coral Obstacle Cylinder + Safety Margin Ring
    if (obstacle) {
      const obsW = robotToWorld(v3(obstacle.x, obstacle.y, 0));
      const cylH = 1.05;

      const obsGlassMat = new THREE.MeshPhysicalMaterial({
        color: COLORS.coral,
        emissive: COLORS.coralDeep,
        emissiveIntensity: 0.65,
        roughness: 0.18,
        metalness: 0.18,
        clearcoat: 0.85,
        transparent: true,
        opacity: 0.56,
      });
      const obsCyl = new THREE.Mesh(this._unitCylGeo, obsGlassMat);
      obsCyl.scale.set(obstacle.radius, cylH, obstacle.radius);
      obsCyl.position.set(obsW.x, cylH * 0.5 + 0.01, obsW.z);
      this._heroGroup.add(obsCyl);

      // Top & bottom luminous coral rings
      const topRim = createFlatRingMesh(obstacle.radius, 0.015, cylH + 0.01, this._matCoralGlow);
      topRim.position.x = obsW.x;
      topRim.position.z = obsW.z;
      this._heroGroup.add(topRim);

      // Pulsing safety clearance ring at arm height
      const safeRing = createFlatRingMesh(
        obstacle.radius + 0.14,
        0.012,
        joints[0].z,
        this._matCoralGlow
      );
      safeRing.position.x = obsW.x;
      safeRing.position.z = obsW.z;
      this._heroGroup.add(safeRing);
      this._obstacleRingMesh = safeRing;

      // Closest-point clearance tether between obstacle perimeter and arm
      if (closestObstaclePoint) {
        const obsCenterAtArm = new THREE.Vector3(obsW.x, joints[0].z, obsW.z);
        const armPt = robotToWorld(closestObstaclePoint);
        const tetherGeo = new THREE.BufferGeometry().setFromPoints([obsCenterAtArm, armPt]);
        const tetherMat = new THREE.LineDashedMaterial({
          color: COLORS.coralLight,
          dashSize: 0.06,
          gapSize: 0.05,
          transparent: true,
          opacity: 0.85,
        });
        const tether = new THREE.Line(tetherGeo, tetherMat);
        tether.computeLineDistances();
        this._heroGroup.add(tether);
      }
    }

    // 3. Joint-Stop Limit Arcs [qMin, qMax] around Joints 1, 2, 3
    if (jointLimits && joints && q) {
      let accumAngle = 0;
      for (let i = 0; i < 3; i++) {
        const jW = robotToWorld(joints[i]);
        const qMin = jointLimits.qMin[i];
        const qMax = jointLimits.qMax[i];
        const arcR = 0.25 - i * 0.02;

        // Allowed range arc in subtle Coral/Amber around parent link direction
        const pts = [];
        const steps = 36;
        for (let s = 0; s <= steps; s++) {
          const ang = accumAngle + qMin + (s / steps) * (qMax - qMin);
          pts.push(
            new THREE.Vector3(
              jW.x + Math.cos(ang) * arcR,
              jW.y + 0.125,
              jW.z - Math.sin(ang) * arcR
            )
          );
        }
        const arcGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const arcMat = new THREE.LineBasicMaterial({
          color: COLORS.coral,
          transparent: true,
          opacity: 0.58,
        });
        this._heroGroup.add(new THREE.Line(arcGeo, arcMat));

        // Glowing hard-stop ticks at qMin and qMax
        for (const lim of [qMin, qMax]) {
          const ang = accumAngle + lim;
          const tick = new THREE.Mesh(this._unitSphereGeo, this._matCoralGlow);
          tick.scale.setScalar(0.024);
          tick.position.set(
            jW.x + Math.cos(ang) * arcR,
            jW.y + 0.125,
            jW.z - Math.sin(ang) * arcR
          );
          this._heroGroup.add(tick);
        }

        accumAngle += q[i];
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
          pos: new THREE.Vector3(0.35, 2.35, 8.75),
          target: new THREE.Vector3(0.25, 1.05, 0.0),
        };
      case 'iso':
        return {
          pos: new THREE.Vector3(4.45, 7.85, 4.95),
          target: new THREE.Vector3(0.35, 0.55, -0.35),
        };
      case '3d':
      default:
        return {
          pos: new THREE.Vector3(5.65, 4.75, 6.45),
          target: new THREE.Vector3(0.35, 0.85, -0.25),
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
    if (!KINEMATICS_PRESETS[presetId]) return this.getTelemetry();
    this.presetId = presetId;
    const p = this._getPreset();
    this.paramA = p.paramA.default;
    this.paramB = p.paramB.default;

    this._recomputeAnalysis();
    if (this._initialized) {
      this._rebuildKinematicsScene();
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
      this._rebuildKinematicsScene();
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

    this._recomputeAnalysis();
    if (this._initialized) {
      this._rebuildKinematicsScene();
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
  // 60fps Living Studio Animation Loop
  // --------------------------------------------------------------------------

  _animate() {
    if (this._disposed) return;
    this._rafId = requestAnimationFrame(this._onAnimate);

    const now = performance.now();
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

    // 2. Subtle Living Robotic Studio Micro-Animations
    if (this._plinthRimMat) {
      this._plinthRimMat.emissiveIntensity = 1.12 + Math.sin(elapsed * 1.7) * 0.12;
    }

    for (let i = 0; i < this._servoCollarMats.length; i++) {
      this._servoCollarMats[i].emissiveIntensity = 1.40 + Math.sin(elapsed * 2.4 + i * 1.2) * 0.16;
    }

    if (this._targetBeaconGroup) {
      this._targetBeaconGroup.rotation.y = elapsed * 1.45;
      const s = 1.0 + Math.sin(elapsed * 3.8) * 0.06;
      this._targetBeaconGroup.scale.setScalar(s);
    }

    if (this._spikeHaloMesh) {
      const pulse = 1.0 + Math.sin(elapsed * 5.4) * 0.08;
      this._spikeHaloMesh.scale.set(pulse, pulse, 1.0);
    }

    if (this._obstacleRingMesh) {
      const pulse = 1.0 + Math.sin(elapsed * 3.2) * 0.05;
      this._obstacleRingMesh.scale.set(pulse, pulse, 1.0);
    }

    if (this._forceArrowPulse && this.mechatronicsLens) {
      const { mesh, origin, dir, len } = this._forceArrowPulse;
      const u = (elapsed * 0.85) % 1.0;
      mesh.position.copy(origin).addScaledVector(dir, u * len * 0.82);
      mesh.scale.setScalar(0.12 * (1 - 0.35 * u));
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

    this._plinthRimMat = null;
    this._servoCollarMats = [];
    this._targetBeaconGroup = null;
    this._spikeHaloMesh = null;
    this._obstacleRingMesh = null;
    this._quillRingMeshes = [];
    this._forceArrowPulse = null;
    this._ellipsoidShellMat = null;
    this.scene = null;
    this.camera = null;
    this.container = null;
  }
}
