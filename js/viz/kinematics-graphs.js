/**
 * EIGENLAB — Interactive 2D Kinematics Graph Lab + Visual Intuition Quiz Engine
 *
 * Exports:
 *   - KinematicsGraphLab         : Synchronized 3-panel high-DPI HTML5 canvas inspector with a
 *                                  unified draggable trajectory scrubber (t), Play/Pause, 5
 *                                  kinematics presets (planar-2r, scara-rrp, poe-3r, ik-dls,
 *                                  qp-ik-3r), 1 compact tuning slider per preset, live
 *                                  Yoshikawa Manipulability Ellipses, and Mechatronics Lens
 *                                  servo torque (tau = J^T F) & actuator saturation overlays.
 *   - KinematicsVisualQuizEngine : 6-challenge high-DPI visual intuition quiz (kin-quiz-1..6)
 *                                  covering Standard vs. Modified DH (Craig), PoE vs. DH on
 *                                  nearly parallel axes, geometric IK multiplicity & workspace
 *                                  annulus, collapsed manipulability ellipse, naive J^+ vs.
 *                                  Damped Least Squares, and nullspace projection / QP-IK.
 */

import { store, sound, renderKatex, renderInlineMathText } from '../store.js';

// ---------------------------------------------------------------------------
// Palette & Visual Constants (EIGENLAB Dark Engineering Studio)
// ---------------------------------------------------------------------------
const COLORS = {
  bg: '#0B0D12',
  bgPanel: '#0F131C',
  gridMinor: 'rgba(148, 163, 184, 0.065)',
  gridMajor: 'rgba(148, 163, 184, 0.13)',
  axis: 'rgba(148, 163, 184, 0.36)',
  axisLabel: 'rgba(148, 163, 184, 0.72)',
  cyan: '#22D3EE',
  cyanSoft: 'rgba(34, 211, 238, 0.20)',
  cyanGlow: 'rgba(34, 211, 238, 0.45)',
  violet: '#A78BFA',
  violetSoft: 'rgba(167, 139, 250, 0.22)',
  violetGlow: 'rgba(167, 139, 250, 0.45)',
  amber: '#F59E0B',
  amberLight: '#FCD34D',
  amberSoft: 'rgba(245, 158, 11, 0.20)',
  amberGlow: 'rgba(245, 158, 11, 0.48)',
  emerald: '#34D399',
  emeraldSoft: 'rgba(52, 211, 153, 0.18)',
  emeraldFill: 'rgba(52, 211, 153, 0.085)',
  emeraldGlow: 'rgba(52, 211, 153, 0.48)',
  coral: '#FB7185',
  coralSoft: 'rgba(251, 113, 133, 0.20)',
  coralFill: 'rgba(251, 113, 133, 0.14)',
  coralGlow: 'rgba(251, 113, 133, 0.50)',
  slate: '#94A3B8',
  slateMuted: 'rgba(148, 163, 184, 0.45)',
  white: '#F8FAFC',
  pillBg: 'rgba(11, 13, 18, 0.92)',
  pillBorder: 'rgba(148, 163, 184, 0.28)',
  rgbX: '#F43F5E',
  rgbY: '#34D399',
  rgbZ: '#38BDF8',
};

const TWO_PI = Math.PI * 2;
const RAD_TO_DEG = 180 / Math.PI;
const FONT_MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const FONT_SANS = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';

// ---------------------------------------------------------------------------
// Scoped Component Styles (injected once into <head>)
// ---------------------------------------------------------------------------
function injectStylesOnce() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('eigenlab-kinematics-graphs-styles')) return;

  const style = document.createElement('style');
  style.id = 'eigenlab-kinematics-graphs-styles';
  style.textContent = `
    @keyframes eigenlabKinShakeGentle {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(5px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(3px); }
    }
    .el-kin-shake {
      animation: eigenlabKinShakeGentle 0.42s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .el-kin-canvas {
      display: block;
      width: 100%;
      max-width: 100%;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }
    .el-kin-pill {
      transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease, transform 120ms ease;
    }
    .el-kin-pill:active {
      transform: scale(0.97);
    }
    .el-kin-slider {
      -webkit-appearance: none;
      appearance: none;
      height: 5px;
      border-radius: 9999px;
      background: linear-gradient(90deg, rgba(52, 211, 153, 0.45), rgba(34, 211, 238, 0.55), rgba(167, 139, 250, 0.55));
      outline: none;
      cursor: pointer;
    }
    .el-kin-slider::-webkit-slider-thumb {
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
    .el-kin-slider::-webkit-slider-thumb:active {
      transform: scale(1.14);
      box-shadow: 0 0 14px rgba(52, 211, 153, 0.85);
    }
    .el-kin-slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 9999px;
      background: #F8FAFC;
      border: 2px solid #22D3EE;
      box-shadow: 0 0 10px rgba(34, 211, 238, 0.65);
      cursor: pointer;
    }
    .el-kin-slider-param {
      background: linear-gradient(90deg, rgba(245, 158, 11, 0.45), rgba(167, 139, 250, 0.55), rgba(251, 113, 133, 0.52));
    }
    .el-kin-slider-param::-webkit-slider-thumb {
      border-color: #A78BFA;
      box-shadow: 0 0 10px rgba(167, 139, 250, 0.65);
    }
    .el-kin-slider-param::-moz-range-thumb {
      border-color: #A78BFA;
      box-shadow: 0 0 10px rgba(167, 139, 250, 0.65);
    }
    .el-kinq-btn {
      transition: border-color 170ms ease, background-color 170ms ease, box-shadow 170ms ease, transform 140ms ease;
      cursor: pointer;
    }
    .el-kinq-btn:hover:not([data-locked="true"]) {
      transform: translateY(-1px);
      border-color: rgba(34, 211, 238, 0.55);
      background-color: rgba(15, 23, 42, 0.95);
      box-shadow: 0 8px 24px -10px rgba(34, 211, 238, 0.25);
    }
    .el-kinq-btn[data-state="correct"] {
      border-color: rgba(52, 211, 153, 0.85) !important;
      background: linear-gradient(180deg, rgba(52, 211, 153, 0.14), rgba(15, 19, 28, 0.94)) !important;
      box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.35), 0 10px 26px -10px rgba(52, 211, 153, 0.32) !important;
    }
    .el-kinq-btn[data-state="wrong"] {
      border-color: rgba(251, 113, 133, 0.72) !important;
      background: linear-gradient(180deg, rgba(251, 113, 133, 0.10), rgba(15, 19, 28, 0.94)) !important;
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

function recordQuizAttemptInStore(challengeId, isCorrect) {
  try {
    if (store && typeof store.recordQuizAttempt === 'function') {
      store.recordQuizAttempt(challengeId, Boolean(isCorrect));
      return;
    }
  } catch (_) {
    // Fall through to standard store methods
  }
  safeStore('recordAttempt', Boolean(isCorrect));
  if (isCorrect) {
    safeStore('markQuizSolved', challengeId);
  }
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

function smooth5(u) {
  const x = clamp(u, 0, 1);
  return x * x * x * (10 + x * (-15 + 6 * x));
}

function fmtPlain(val, decimals = 2) {
  if (!Number.isFinite(val)) return '∞';
  const cleaned = Math.abs(val) < 0.0005 ? 0 : val;
  return cleaned.toFixed(decimals);
}

function fmtSigned(val, decimals = 2) {
  if (!Number.isFinite(val)) return '+∞';
  const cleaned = Math.abs(val) < 0.0005 ? 0 : val;
  return `${cleaned > 0 ? '+' : ''}${cleaned.toFixed(decimals)}`;
}

function fmtDeg(rad) {
  if (!Number.isFinite(rad)) return '0°';
  const d = rad * RAD_TO_DEG;
  const cleaned = Math.abs(d) < 0.05 ? 0 : d;
  return `${cleaned > 0 ? '+' : ''}${cleaned.toFixed(0)}°`;
}

function unwrapAngle(prev, curr) {
  let diff = curr - prev;
  while (diff > Math.PI) diff -= TWO_PI;
  while (diff < -Math.PI) diff += TWO_PI;
  return prev + diff;
}

// ---------------------------------------------------------------------------
// Core Kinematics & Linear Algebra Math Engine (SE(2) PoE, Jacobians, SVD/Ellipse)
// ---------------------------------------------------------------------------

/**
 * Exact SE(2) matrix exponential for a planar revolute screw axis located at (px, py)
 * with unit angular axis omega = +1 (about +z) and linear screw v = (py, -px).
 */
function se2ExpRevolute(px, py, theta) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const tx = (1 - c) * px + s * py;
  const ty = -s * px + (1 - c) * py;
  return [
    [c, -s, tx],
    [s, c, ty],
    [0, 0, 1],
  ];
}

function mat3Mul(A, B) {
  const out = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 1],
  ];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      out[r][c] = A[r][0] * B[0][c] + A[r][1] * B[1][c] + A[r][2] * B[2][c];
    }
  }
  return out;
}

function se2ApplyPoint(T, x, y) {
  return {
    x: T[0][0] * x + T[0][1] * y + T[0][2],
    y: T[1][0] * x + T[1][1] * y + T[1][2],
  };
}

/**
 * Forward kinematics + 2x2 Jacobian for Planar 2R manipulator.
 */
function fk2R(q1, q2, L1, L2) {
  const c1 = Math.cos(q1);
  const s1 = Math.sin(q1);
  const q12 = q1 + q2;
  const c12 = Math.cos(q12);
  const s12 = Math.sin(q12);

  const p0 = { x: 0, y: 0 };
  const p1 = { x: L1 * c1, y: L1 * s1 };
  const p2 = { x: p1.x + L2 * c12, y: p1.y + L2 * s12 };

  const J = [
    [-L1 * s1 - L2 * s12, -L2 * s12],
    [L1 * c1 + L2 * c12, L2 * c12],
  ];

  return { joints: [p0, p1, p2], ee: p2, eeAngle: q12, J };
}

/**
 * Closed-form geometric IK for Planar 2R returning both elbow-down (+1) and elbow-up (-1).
 */
function ik2R(x, y, L1, L2, branch = 1) {
  const r2 = x * x + y * y;
  const denom = 2 * L1 * L2;
  const rawD = (r2 - L1 * L1 - L2 * L2) / Math.max(1e-9, denom);
  const D = clamp(rawD, -0.99999, 0.99999);
  const q2 = (branch >= 0 ? 1 : -1) * Math.acos(D);
  const k1 = L1 + L2 * Math.cos(q2);
  const k2 = L2 * Math.sin(q2);
  const q1 = Math.atan2(y, x) - Math.atan2(k2, k1);
  return { q1, q2, reachable: Math.abs(rawD) <= 1.0, rawD };
}

/**
 * Forward kinematics + 2x3 translational Jacobian for Planar 3R manipulator.
 * Computes joint positions strictly via SE(2) Product of Exponentials when requested.
 */
function fk3RPoE(q1, q2, q3, L1, L2, L3) {
  const E1 = se2ExpRevolute(0, 0, q1);
  const E2 = se2ExpRevolute(L1, 0, q2);
  const E3 = se2ExpRevolute(L1 + L2, 0, q3);

  const T1 = E1;
  const T12 = mat3Mul(T1, E2);
  const T123 = mat3Mul(T12, E3);

  const M = [
    [1, 0, L1 + L2 + L3],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const Tee = mat3Mul(T123, M);

  const p0 = { x: 0, y: 0 };
  const p1 = se2ApplyPoint(T1, L1, 0);
  const p2 = se2ApplyPoint(T12, L1 + L2, 0);
  const p3 = { x: Tee[0][2], y: Tee[1][2] };
  const eeAngle = Math.atan2(Tee[1][0], Tee[0][0]);

  // Space-frame translational Jacobian columns: J_i = z_hat x (p_ee - p_{i-1})
  const J = [
    [-(p3.y - p0.y), -(p3.y - p1.y), -(p3.y - p2.y)],
    [p3.x - p0.x, p3.x - p1.x, p3.x - p2.x],
  ];

  return { joints: [p0, p1, p2, p3], ee: p3, eeAngle, J, Tee };
}

/**
 * Compute Yoshikawa manipulability ellipse parameters from J (2 x n):
 *   A = J * J^T (2x2 symmetric PSD)
 * Returns { sigma1, sigma2, angle, w, cond, A }
 */
function manipulabilityFromJ(J) {
  const cols = J[0].length;
  let a11 = 0;
  let a12 = 0;
  let a22 = 0;
  for (let c = 0; c < cols; c++) {
    const j0 = J[0][c];
    const j1 = J[1][c];
    a11 += j0 * j0;
    a12 += j0 * j1;
    a22 += j1 * j1;
  }

  const tr = a11 + a22;
  const diff = a11 - a22;
  const disc = Math.sqrt(Math.max(0, diff * diff + 4 * a12 * a12));
  const lam1 = Math.max(0, 0.5 * (tr + disc));
  const lam2 = Math.max(0, 0.5 * (tr - disc));
  const sigma1 = Math.sqrt(lam1);
  const sigma2 = Math.sqrt(lam2);
  const w = sigma1 * sigma2;
  const angle = Math.abs(a12) < 1e-12 && Math.abs(diff) < 1e-12 ? 0 : 0.5 * Math.atan2(2 * a12, diff);
  const cond = sigma2 > 1e-6 ? sigma1 / sigma2 : 999;

  return { sigma1, sigma2, angle, w, cond, a11, a12, a22 };
}

/**
 * Compute J^T (J J^T + damping^2 I)^{-1} * v for a 2 x n Jacobian J.
 */
function solveDlsStep(J, vx, vy, lambda) {
  const cols = J[0].length;
  let a11 = lambda * lambda;
  let a12 = 0;
  let a22 = lambda * lambda;

  for (let c = 0; c < cols; c++) {
    const j0 = J[0][c];
    const j1 = J[1][c];
    a11 += j0 * j0;
    a12 += j0 * j1;
    a22 += j1 * j1;
  }

  const det = a11 * a22 - a12 * a12;
  const safeDet = Math.abs(det) < 1e-12 ? (det >= 0 ? 1e-12 : -1e-12) : det;
  const inv11 = a22 / safeDet;
  const inv12 = -a12 / safeDet;
  const inv22 = a11 / safeDet;

  // y = (J J^T + lam^2 I)^{-1} v
  const y0 = inv11 * vx + inv12 * vy;
  const y1 = inv12 * vx + inv22 * vy;

  const dq = new Array(cols);
  for (let c = 0; c < cols; c++) {
    dq[c] = J[0][c] * y0 + J[1][c] * y1;
  }
  return { dq, inv11, inv12, inv22 };
}

/**
 * Nullspace projection N * dq0 = (I - J# J) * dq0 for 2 x n Jacobian.
 */
function projectNullspace(J, dq0, lambda) {
  const cols = J[0].length;
  // v0 = J * dq0
  let v0x = 0;
  let v0y = 0;
  for (let c = 0; c < cols; c++) {
    v0x += J[0][c] * dq0[c];
    v0y += J[1][c] * dq0[c];
  }
  const { dq: proj } = solveDlsStep(J, v0x, v0y, lambda);
  const out = new Array(cols);
  for (let c = 0; c < cols; c++) {
    out[c] = dq0[c] - proj[c];
  }
  return out;
}

/**
 * Static joint torques tau = J^T F for a tip force F = [fx, fy].
 */
function staticTorques(J, fx, fy) {
  const cols = J[0].length;
  const tau = new Array(cols);
  for (let c = 0; c < cols; c++) {
    tau[c] = J[0][c] * fx + J[1][c] * fy;
  }
  return tau;
}

function vecNorm(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i] * arr[i];
  return Math.sqrt(sum);
}

/**
 * Distance & gradient from a point p to obstacle center (cx, cy).
 */
function pointToSegmentClosest(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const ab2 = abx * abx + aby * aby;
  const t = ab2 > 1e-12 ? clamp(((px - ax) * abx + (py - ay) * aby) / ab2, 0, 1) : 0;
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  const dx = px - cx;
  const dy = py - cy;
  return { dist: Math.hypot(dx, dy), t, cx, cy };
}

// ---------------------------------------------------------------------------
// 5 Kinematics Presets Definition & Deterministic Simulation Engine
// ---------------------------------------------------------------------------
const LAB_PRESETS = [
  {
    key: 'planar-2r',
    label: 'Planar 2R IK',
    paramLabel: 'L₂',
    paramUnit: 'm',
    paramMin: 0.65,
    paramMax: 1.45,
    paramDefault: 1.10,
    paramStep: 0.05,
    paramLog: false,
    formulaTex:
      '\\cos\\theta_2 = \\frac{x^2 + y^2 - L_1^2 - L_2^2}{2 L_1 L_2}, \\quad w(\\theta) = L_1 L_2 |\\sin\\theta_2|',
    insightMath: 'Every interior annulus point has 2 exact IK branches: Elbow-Down (θ₂ > 0) & Elbow-Up (θ₂ < 0).',
    insightMech: 'Mechatronics Lens: Compare joint torques τ = JᵀF and workspace dead-zone r < |L₁−L₂| as L₂ changes.',
  },
  {
    key: 'scara-rrp',
    label: 'SCARA R-R-P',
    paramLabel: 'Stroke',
    paramUnit: 'm',
    paramMin: 0.20,
    paramMax: 0.80,
    paramDefault: 0.55,
    paramStep: 0.05,
    paramLog: false,
    formulaTex:
      'J_{\\text{SCARA}} = \\begin{bmatrix} J_{xy}(\\theta_1,\\theta_2) & 0 \\\\ 0 & 1 \\end{bmatrix}, \\quad z = z_0 - d_3',
    insightMath: 'SCARA decouples vertical quill stroke d₃ from planar R-R kinematics for ultra-fast pick-and-place.',
    insightMech: 'Mechatronics Lens: Planar belt servos handle X-Y slew while ballscrew quill carries vertical Z payload.',
  },
  {
    key: 'poe-3r',
    label: 'PoE 3R Screw',
    paramLabel: 'Twist γ',
    paramUnit: '',
    paramMin: -1.40,
    paramMax: 1.40,
    paramDefault: 0.90,
    paramStep: 0.10,
    paramLog: false,
    formulaTex:
      'T(\\theta) = e^{[\\mathcal{S}_1]\\theta_1} e^{[\\mathcal{S}_2]\\theta_2} e^{[\\mathcal{S}_3]\\theta_3} M',
    insightMath: 'Product of Exponentials maps Home M via base-frame screw axes Sᵢ without fragile DH frame jumps.',
    insightMech: 'Mechatronics Lens: One base-frame screw table eliminates calibration discontinuities on near-parallel axes.',
  },
  {
    key: 'ik-dls',
    label: 'Singularity & DLS',
    paramLabel: 'Damp λ',
    paramUnit: '',
    paramMin: 0.02,
    paramMax: 0.55,
    paramDefault: 0.16,
    paramStep: 0.01,
    paramLog: true,
    formulaTex:
      '\\dot{q}_{\\text{DLS}} = J^T (J J^T + \\lambda^2 I)^{-1} \\dot{x}_d, \\quad \\sigma_i \\mapsto \\frac{\\sigma_i}{\\sigma_i^2 + \\lambda^2}',
    insightMath: 'At r = L₁+L₂ the manipulability ellipse flattens to 1D; naive J⁺ explodes while DLS stays bounded.',
    insightMech: 'Mechatronics Lens: Raise λ to clamp peak servo velocity & prevent amplifier over-current trip near boundary.',
  },
  {
    key: 'qp-ik-3r',
    label: 'QP-IK 3R Nullspace',
    paramLabel: 'k_null',
    paramUnit: '',
    paramMin: 0.0,
    paramMax: 4.0,
    paramDefault: 2.4,
    paramStep: 0.1,
    paramLog: false,
    formulaTex:
      '\\dot{q} = J^\\# \\dot{x}_d + (I - J^\\# J)\\dot{q}_0 \\quad \\text{s.t. } |q_i| \\le q_{\\max},\\; |\\dot{q}_i| \\le \\dot{q}_{\\max}',
    insightMath: 'Nullspace projection dodges the Coral obstacle with zero EE drift while QP-IK enforces hard joint limits.',
    insightMech: 'Mechatronics Lens: Modern solvers (Pink/Mink) solve task tracking + collision + servo limits in one convex QP.',
  },
];

function simulatePreset(key, paramVal) {
  const N = 180;
  const T = 6.0;
  const dt = T / (N - 1);
  const t = new Float64Array(N);
  for (let i = 0; i < N; i++) t[i] = i * dt;

  const q1 = new Float64Array(N);
  const q2 = new Float64Array(N);
  const q3 = new Float64Array(N);
  const q2Alt = new Float64Array(N); // Optional alternate IK branch for planar-2r
  const wArr = new Float64Array(N);
  const dqNaiveNorm = new Float64Array(N);
  const dqSafeNorm = new Float64Array(N);
  const tauNorm = new Float64Array(N);
  const eeErr = new Float64Array(N);
  const minClearance = new Float64Array(N);

  const frames = new Array(N);
  const targets = new Array(N);
  const ellipses = new Array(N);
  const torques = new Array(N);

  const qLimit = 2.55; // rad (±146°)
  const dqLimit = 3.4; // rad/s
  const tauSatLimit = 28.0; // N·m servo peak torque threshold

  // Tip load vector for Mechatronics Lens (N)
  const tipFx = 0;
  const tipFy = -12.0;

  if (key === 'planar-2r') {
    const L1 = 1.55;
    const L2 = clamp(paramVal, 0.65, 1.45);
    const rMin = Math.abs(L1 - L2);
    const rMax = L1 + L2;
    const rMid = 0.5 * (rMin + rMax);
    const rAmp = 0.37 * (rMax - rMin);

    const altFrames = new Array(N);
    for (let i = 0; i < N; i++) {
      const s = i / (N - 1);
      const r = rMid + rAmp * Math.sin(TWO_PI * s - 0.55);
      const phi = 0.18 + 0.92 * Math.sin(Math.PI * s) - 0.16 * Math.cos(TWO_PI * s);
      const xd = r * Math.cos(phi);
      const yd = r * Math.sin(phi);
      targets[i] = { x: xd, y: yd };

      const solDown = ik2R(xd, yd, L1, L2, +1);
      const solUp = ik2R(xd, yd, L1, L2, -1);

      q1[i] = i === 0 ? solDown.q1 : unwrapAngle(q1[i - 1], solDown.q1);
      q2[i] = i === 0 ? solDown.q2 : unwrapAngle(q2[i - 1], solDown.q2);
      q2Alt[i] = i === 0 ? solUp.q2 : unwrapAngle(q2Alt[i - 1], solUp.q2);
      q3[i] = 0;

      const fkDown = fk2R(q1[i], q2[i], L1, L2);
      const fkUp = fk2R(solUp.q1, solUp.q2, L1, L2);
      frames[i] = fkDown;
      altFrames[i] = fkUp;

      const ell = manipulabilityFromJ(fkDown.J);
      ellipses[i] = ell;
      wArr[i] = ell.w;

      const tau = staticTorques(fkDown.J, tipFx, tipFy);
      torques[i] = tau;
      tauNorm[i] = vecNorm(tau);
      eeErr[i] = Math.hypot(fkDown.ee.x - xd, fkDown.ee.y - yd);
      minClearance[i] = 1.0;
    }

    // Compute velocities via central differences
    for (let i = 0; i < N; i++) {
      const i0 = Math.max(0, i - 1);
      const i1 = Math.min(N - 1, i + 1);
      const span = Math.max(1e-6, t[i1] - t[i0]);
      const vx = (targets[i1].x - targets[i0].x) / span;
      const vy = (targets[i1].y - targets[i0].y) / span;
      const naive = solveDlsStep(frames[i].J, vx, vy, 1e-3);
      const safe = solveDlsStep(frames[i].J, vx, vy, 0.14);
      dqNaiveNorm[i] = Math.min(24, vecNorm(naive.dq));
      dqSafeNorm[i] = Math.min(24, vecNorm(safe.dq));
    }

    return {
      presetKey: key,
      N,
      T,
      t,
      q1,
      q2,
      q3,
      q2Alt,
      hasQ3: false,
      q3Label: '',
      qLimit,
      dqLimit,
      tauSatLimit,
      w: wArr,
      dqNaive: dqNaiveNorm,
      dqSafe: dqSafeNorm,
      tauNorm,
      torques,
      eeErr,
      minClearance,
      frames,
      altFrames,
      targets,
      ellipses,
      L: [L1, L2],
      rMin,
      rMax,
      worldBounds: { xMin: -2.6, xMax: 3.3, yMin: -1.35, yMax: 3.15 },
      singularityIdx: argMin(wArr),
      wCrit: 0.35,
      velYMax: 6.5,
      wYMax: Math.max(2.4, L1 * L2 * 1.15),
    };
  }

  if (key === 'scara-rrp') {
    const L1 = 1.35;
    const L2 = 1.05;
    const rMin = Math.abs(L1 - L2);
    const rMax = L1 + L2;
    const stroke = clamp(paramVal, 0.20, 0.80);

    const pickPos = { x: 1.55, y: -0.95 };
    const placePos = { x: 1.05, y: 1.50 };
    const zBoom = 0.95;

    for (let i = 0; i < N; i++) {
      const s = i / (N - 1);
      let xd;
      let yd;
      let d3;

      if (s < 0.18) {
        // Descend at pick
        const u = smooth5(s / 0.18);
        xd = pickPos.x;
        yd = pickPos.y;
        d3 = 0.08 + stroke * u;
      } else if (s < 0.33) {
        // Retract from pick
        const u = smooth5((s - 0.18) / 0.15);
        xd = pickPos.x;
        yd = pickPos.y;
        d3 = 0.08 + stroke * (1 - u);
      } else if (s < 0.67) {
        // Rapid planar slew curving slightly toward outer reach so w(theta) dips nicely
        const u = smooth5((s - 0.33) / 0.34);
        const bulge = Math.sin(Math.PI * u);
        xd = pickPos.x + (placePos.x - pickPos.x) * u + 0.88 * bulge;
        yd = pickPos.y + (placePos.y - pickPos.y) * u + 0.12 * bulge;
        d3 = 0.08;
      } else if (s < 0.84) {
        // Descend at place
        const u = smooth5((s - 0.67) / 0.17);
        xd = placePos.x;
        yd = placePos.y;
        d3 = 0.08 + stroke * u;
      } else {
        // Retract from place
        const u = smooth5((s - 0.84) / 0.16);
        xd = placePos.x;
        yd = placePos.y;
        d3 = 0.08 + stroke * (1 - u);
      }

      targets[i] = { x: xd, y: yd, z: zBoom - d3, d3 };
      const sol = ik2R(xd, yd, L1, L2, +1);
      q1[i] = i === 0 ? sol.q1 : unwrapAngle(q1[i - 1], sol.q1);
      q2[i] = i === 0 ? sol.q2 : unwrapAngle(q2[i - 1], sol.q2);
      q3[i] = d3;

      const fk = fk2R(q1[i], q2[i], L1, L2);
      fk.d3 = d3;
      fk.zEE = zBoom - d3;
      frames[i] = fk;

      const ell = manipulabilityFromJ(fk.J);
      ellipses[i] = ell;
      wArr[i] = ell.w;

      // Planar lateral drag + 15N vertical payload on ballscrew
      const tauPlanar = staticTorques(fk.J, 0, -8.5);
      const fQuill = 15.0; // N vertical load
      torques[i] = [tauPlanar[0], tauPlanar[1], fQuill];
      tauNorm[i] = Math.hypot(tauPlanar[0], tauPlanar[1], fQuill * 0.45);
      eeErr[i] = Math.hypot(fk.ee.x - xd, fk.ee.y - yd);
      minClearance[i] = 1.0;
    }

    for (let i = 0; i < N; i++) {
      const i0 = Math.max(0, i - 1);
      const i1 = Math.min(N - 1, i + 1);
      const span = Math.max(1e-6, t[i1] - t[i0]);
      const vx = (targets[i1].x - targets[i0].x) / span;
      const vy = (targets[i1].y - targets[i0].y) / span;
      const vd3 = (q3[i1] - q3[i0]) / span;
      const naive = solveDlsStep(frames[i].J, vx, vy, 1e-3);
      const safe = solveDlsStep(frames[i].J, vx, vy, 0.16);
      dqNaiveNorm[i] = Math.min(24, Math.hypot(naive.dq[0], naive.dq[1], vd3));
      dqSafeNorm[i] = Math.min(24, Math.hypot(safe.dq[0], safe.dq[1], vd3));
    }

    return {
      presetKey: key,
      N,
      T,
      t,
      q1,
      q2,
      q3,
      hasQ3: true,
      q3IsPrismatic: true,
      q3Label: 'd₃ (m)',
      qLimit,
      dqLimit,
      tauSatLimit,
      w: wArr,
      dqNaive: dqNaiveNorm,
      dqSafe: dqSafeNorm,
      tauNorm,
      torques,
      eeErr,
      minClearance,
      frames,
      targets,
      ellipses,
      L: [L1, L2],
      rMin,
      rMax,
      pickPos,
      placePos,
      zBoom,
      stroke,
      worldBounds: { xMin: -1.4, xMax: 2.75, yMin: -1.65, yMax: 2.15 },
      singularityIdx: argMin(wArr),
      wCrit: 0.35,
      velYMax: 9.0,
      wYMax: 1.75,
    };
  }

  if (key === 'poe-3r') {
    const L1 = 1.05;
    const L2 = 0.90;
    const L3 = 0.70;
    const rMax = L1 + L2 + L3;
    const rMin = 0;
    const gamma = clamp(paramVal, -1.40, 1.40);

    const homeJoints = [
      { x: 0, y: 0 },
      { x: L1, y: 0 },
      { x: L1 + L2, y: 0 },
      { x: L1 + L2 + L3, y: 0 },
    ];

    for (let i = 0; i < N; i++) {
      const s = i / (N - 1);
      q1[i] = 0.18 + 0.95 * Math.sin(TWO_PI * s - 0.5);
      q2[i] = 0.85 * Math.sin(TWO_PI * s + 0.45) + 0.28 * Math.cos(2 * TWO_PI * s);
      q3[i] = gamma * (0.90 * Math.cos(TWO_PI * s - 0.25) - 0.22 * Math.sin(2 * TWO_PI * s));

      const fk = fk3RPoE(q1[i], q2[i], q3[i], L1, L2, L3);
      frames[i] = fk;
      targets[i] = { x: fk.ee.x, y: fk.ee.y };

      const ell = manipulabilityFromJ(fk.J);
      ellipses[i] = ell;
      wArr[i] = ell.w;

      const tau = staticTorques(fk.J, tipFx, tipFy);
      torques[i] = tau;
      tauNorm[i] = vecNorm(tau);
      eeErr[i] = 0;
      minClearance[i] = 1.0;
    }

    for (let i = 0; i < N; i++) {
      const i0 = Math.max(0, i - 1);
      const i1 = Math.min(N - 1, i + 1);
      const span = Math.max(1e-6, t[i1] - t[i0]);
      const vx = (targets[i1].x - targets[i0].x) / span;
      const vy = (targets[i1].y - targets[i0].y) / span;
      const naive = solveDlsStep(frames[i].J, vx, vy, 1e-3);
      const safe = solveDlsStep(frames[i].J, vx, vy, 0.16);
      dqNaiveNorm[i] = Math.min(24, vecNorm(naive.dq));
      dqSafeNorm[i] = Math.min(24, vecNorm(safe.dq));
    }

    return {
      presetKey: key,
      N,
      T,
      t,
      q1,
      q2,
      q3,
      hasQ3: true,
      q3IsPrismatic: false,
      q3Label: 'θ₃',
      qLimit,
      dqLimit,
      tauSatLimit,
      w: wArr,
      dqNaive: dqNaiveNorm,
      dqSafe: dqSafeNorm,
      tauNorm,
      torques,
      eeErr,
      minClearance,
      frames,
      homeJoints,
      targets,
      ellipses,
      L: [L1, L2, L3],
      rMin,
      rMax,
      worldBounds: { xMin: -1.85, xMax: 3.15, yMin: -2.15, yMax: 2.35 },
      singularityIdx: argMin(wArr),
      wCrit: 0.45,
      velYMax: 7.5,
      wYMax: 3.0,
    };
  }

  if (key === 'ik-dls') {
    const L1 = 1.45;
    const L2 = 1.15;
    const rMin = Math.abs(L1 - L2);
    const rMax = L1 + L2; // 2.60
    const lambda = clamp(paramVal, 0.02, 0.55);

    const phiBase = 0.34; // ~19.5°
    const cosP = Math.cos(phiBase);
    const sinP = Math.sin(phiBase);

    for (let i = 0; i < N; i++) {
      const s = i / (N - 1);
      // Sweep from comfortable interior (1.35) straight past outer boundary (2.86 > 2.60) and back
      const rSweep = 1.35 + 1.51 * Math.pow(Math.sin(Math.PI * s), 1.85);
      const lat = 0.18 * Math.sin(TWO_PI * s);
      const xd = rSweep * cosP - lat * sinP;
      const yd = rSweep * sinP + lat * cosP;
      targets[i] = { x: xd, y: yd };
    }

    // Initialize arm exactly at target[0] (elbow-down)
    const initSol = ik2R(targets[0].x, targets[0].y, L1, L2, +1);
    let curQ1 = initSol.q1;
    let curQ2 = initSol.q2;

    for (let i = 0; i < N; i++) {
      q1[i] = curQ1;
      q2[i] = curQ2;
      q3[i] = 0;

      const fk = fk2R(curQ1, curQ2, L1, L2);
      frames[i] = fk;
      const ell = manipulabilityFromJ(fk.J);
      ellipses[i] = ell;
      wArr[i] = ell.w;

      const tau = staticTorques(fk.J, tipFx, tipFy);
      torques[i] = tau;
      tauNorm[i] = vecNorm(tau);

      const ex = targets[i].x - fk.ee.x;
      const ey = targets[i].y - fk.ee.y;
      eeErr[i] = Math.hypot(ex, ey);
      minClearance[i] = 1.0;

      // Feedforward + proportional tracking velocity
      const i0 = Math.max(0, i - 1);
      const i1 = Math.min(N - 1, i + 1);
      const span = Math.max(1e-6, t[i1] - t[i0]);
      const vfx = (targets[i1].x - targets[i0].x) / span;
      const vfy = (targets[i1].y - targets[i0].y) / span;
      const kp = 5.2;
      const vx = vfx + kp * ex;
      const vy = vfy + kp * ey;

      // Compare naive pseudoinverse (tiny floor 1e-4 only to avoid NaN) vs. DLS(lambda)
      const naiveStep = solveDlsStep(fk.J, vx, vy, 0.008);
      const dlsStep = solveDlsStep(fk.J, vx, vy, lambda);

      dqNaiveNorm[i] = Math.min(48, vecNorm(naiveStep.dq));
      dqSafeNorm[i] = Math.min(48, vecNorm(dlsStep.dq));

      // Integrate DLS trajectory with sub-stepping for crisp stability even at small lambda
      if (i < N - 1) {
        const subSteps = 3;
        const h = dt / subSteps;
        let sq1 = curQ1;
        let sq2 = curQ2;
        for (let st = 0; st < subSteps; st++) {
          const sfk = fk2R(sq1, sq2, L1, L2);
          const alpha = (st + 1) / subSteps;
          const tx = targets[i].x + (targets[i + 1].x - targets[i].x) * alpha;
          const ty = targets[i].y + (targets[i + 1].y - targets[i].y) * alpha;
          const svx = (targets[i + 1].x - targets[i].x) / dt + kp * (tx - sfk.ee.x);
          const svy = (targets[i + 1].y - targets[i].y) / dt + kp * (ty - sfk.ee.y);
          const step = solveDlsStep(sfk.J, svx, svy, lambda);
          sq1 = clamp(sq1 + clamp(step.dq[0], -18, 18) * h, -qLimit, qLimit);
          sq2 = clamp(sq2 + clamp(step.dq[1], -18, 18) * h, -qLimit, qLimit);
        }
        curQ1 = sq1;
        curQ2 = sq2;
      }
    }

    return {
      presetKey: key,
      N,
      T,
      t,
      q1,
      q2,
      q3,
      hasQ3: false,
      q3Label: '',
      qLimit,
      dqLimit,
      tauSatLimit,
      lambda,
      w: wArr,
      dqNaive: dqNaiveNorm,
      dqSafe: dqSafeNorm,
      tauNorm,
      torques,
      eeErr,
      minClearance,
      frames,
      targets,
      ellipses,
      L: [L1, L2],
      rMin,
      rMax,
      worldBounds: { xMin: -0.95, xMax: 3.25, yMin: -0.85, yMax: 2.35 },
      singularityIdx: argMin(wArr),
      wCrit: 0.30,
      velYMax: 12.0,
      wYMax: 1.9,
    };
  }

  // Default: 'qp-ik-3r' — 3R redundant arm dodging a Coral obstacle via Nullspace / QP-IK
  const L1 = 1.15;
  const L2 = 1.00;
  const L3 = 0.85;
  const rMax = L1 + L2 + L3;
  const rMin = 0;
  const kNull = clamp(paramVal, 0.0, 4.0);

  const obstacle = { x: 1.05, y: 1.15, r: 0.26, margin: 0.35 };
  const seamX = 1.65;
  const yStart = -0.65;
  const yEnd = 0.85;

  for (let i = 0; i < N; i++) {
    const s = smooth5(i / (N - 1));
    targets[i] = { x: seamX, y: yStart + (yEnd - yStart) * s };
  }

  // Converge initial 3R posture smoothly onto targets[0] with elbow-up arch clear of obstacle
  let curQ = [0.55, -1.15, -0.35];
  for (let iter = 0; iter < 60; iter++) {
    const fk = fk3RPoE(curQ[0], curQ[1], curQ[2], L1, L2, L3);
    const ex = targets[0].x - fk.ee.x;
    const ey = targets[0].y - fk.ee.y;
    const { dq } = solveDlsStep(fk.J, 4.0 * ex, 4.0 * ey, 0.08);
    curQ[0] = clamp(curQ[0] + dq[0] * 0.25, -qLimit, qLimit);
    curQ[1] = clamp(curQ[1] + dq[1] * 0.25, -qLimit, qLimit);
    curQ[2] = clamp(curQ[2] + dq[2] * 0.25, -qLimit, qLimit);
  }

  // Helper to compute repulsive + joint-centering nullspace gradient dq0
  const computeNullspaceGrad = (qVec) => {
    const eps = 1e-3;
    const cost = (qv) => {
      const fk = fk3RPoE(qv[0], qv[1], qv[2], L1, L2, L3);
      const pts = fk.joints;
      // Check distances from obstacle center to link 1, link 2, link 3 (elbow + wrist segments)
      const d1 = pointToSegmentClosest(obstacle.x, obstacle.y, pts[0].x, pts[0].y, pts[1].x, pts[1].y).dist;
      const d2 = pointToSegmentClosest(obstacle.x, obstacle.y, pts[1].x, pts[1].y, pts[2].x, pts[2].y).dist;
      const d3 = pointToSegmentClosest(obstacle.x, obstacle.y, pts[2].x, pts[2].y, pts[3].x, pts[3].y).dist;
      const rSafe = obstacle.r + obstacle.margin;
      let c = 0;
      for (const d of [d1, d2, d3]) {
        if (d < rSafe) {
          const pen = rSafe - d;
          c += 22.0 * pen * pen;
        }
      }
      // Gentle posture preference keeping elbow comfortably away from extreme limits
      for (let j = 0; j < 3; j++) {
        const u = qv[j] / qLimit;
        c += 0.14 * u * u;
      }
      return c;
    };

    const c0 = cost(qVec);
    const dq0 = [0, 0, 0];
    for (let j = 0; j < 3; j++) {
      const qPert = [qVec[0], qVec[1], qVec[2]];
      qPert[j] += eps;
      const grad = (cost(qPert) - c0) / eps;
      dq0[j] = -kNull * grad;
    }
    return dq0;
  };

  const computeArmClearance = (fk) => {
    const pts = fk.joints;
    const d1 = pointToSegmentClosest(obstacle.x, obstacle.y, pts[0].x, pts[0].y, pts[1].x, pts[1].y).dist;
    const d2 = pointToSegmentClosest(obstacle.x, obstacle.y, pts[1].x, pts[1].y, pts[2].x, pts[2].y).dist;
    const d3 = pointToSegmentClosest(obstacle.x, obstacle.y, pts[2].x, pts[2].y, pts[3].x, pts[3].y).dist;
    return Math.min(d1, d2, d3) - obstacle.r;
  };

  for (let i = 0; i < N; i++) {
    q1[i] = curQ[0];
    q2[i] = curQ[1];
    q3[i] = curQ[2];

    const fk = fk3RPoE(curQ[0], curQ[1], curQ[2], L1, L2, L3);
    frames[i] = fk;
    const ell = manipulabilityFromJ(fk.J);
    ellipses[i] = ell;
    wArr[i] = ell.w;

    const tau = staticTorques(fk.J, tipFx, tipFy);
    torques[i] = tau;
    tauNorm[i] = vecNorm(tau);

    const ex = targets[i].x - fk.ee.x;
    const ey = targets[i].y - fk.ee.y;
    eeErr[i] = Math.hypot(ex, ey);
    minClearance[i] = computeArmClearance(fk);

    const i0 = Math.max(0, i - 1);
    const i1 = Math.min(N - 1, i + 1);
    const span = Math.max(1e-6, t[i1] - t[i0]);
    const vfx = (targets[i1].x - targets[i0].x) / span;
    const vfy = (targets[i1].y - targets[i0].y) / span;
    const kp = 7.5;
    const vx = vfx + kp * ex;
    const vy = vfy + kp * ey;

    // Naive unconstrained J^+ + unprojected obstacle push vs. QP-IK box-constrained nullspace
    const naivePrimary = solveDlsStep(fk.J, vx, vy, 0.008).dq;
    const dq0 = computeNullspaceGrad(curQ);
    const nullTerm = projectNullspace(fk.J, dq0, 0.09);
    const dlsPrimary = solveDlsStep(fk.J, vx, vy, 0.09).dq;

    // QP-IK velocity box constraints: |dq_j| <= dqLimit and position barrier q_min <= q + dq*h <= q_max
    const dqQP = [0, 0, 0];
    for (let j = 0; j < 3; j++) {
      const raw = dlsPrimary[j] + nullTerm[j];
      const loVel = Math.max(-dqLimit, (-qLimit - curQ[j]) / Math.max(dt, 0.02));
      const hiVel = Math.min(dqLimit, (qLimit - curQ[j]) / Math.max(dt, 0.02));
      dqQP[j] = clamp(raw, loVel, hiVel);
    }

    dqNaiveNorm[i] = Math.min(20, vecNorm([
      naivePrimary[0] + dq0[0] * 1.45,
      naivePrimary[1] + dq0[1] * 1.45,
      naivePrimary[2] + dq0[2] * 1.45,
    ]));
    dqSafeNorm[i] = Math.min(20, vecNorm(dqQP));

    if (i < N - 1) {
      const subSteps = 3;
      const h = dt / subSteps;
      let sq = [curQ[0], curQ[1], curQ[2]];
      for (let st = 0; st < subSteps; st++) {
        const sfk = fk3RPoE(sq[0], sq[1], sq[2], L1, L2, L3);
        const alpha = (st + 1) / subSteps;
        const tx = targets[i].x + (targets[i + 1].x - targets[i].x) * alpha;
        const ty = targets[i].y + (targets[i + 1].y - targets[i].y) * alpha;
        const svx = (targets[i + 1].x - targets[i].x) / dt + kp * (tx - sfk.ee.x);
        const svy = (targets[i + 1].y - targets[i].y) / dt + kp * (ty - sfk.ee.y);

        const prim = solveDlsStep(sfk.J, svx, svy, 0.09).dq;
        const g0 = computeNullspaceGrad(sq);
        const nt = projectNullspace(sfk.J, g0, 0.09);

        for (let j = 0; j < 3; j++) {
          const loV = Math.max(-dqLimit, (-qLimit - sq[j]) / Math.max(h, 0.01));
          const hiV = Math.min(dqLimit, (qLimit - sq[j]) / Math.max(h, 0.01));
          const vel = clamp(prim[j] + nt[j], loV, hiV);
          sq[j] = clamp(sq[j] + vel * h, -qLimit, qLimit);
        }
      }
      curQ = sq;
    }
  }

  return {
    presetKey: 'qp-ik-3r',
    N,
    T,
    t,
    q1,
    q2,
    q3,
    hasQ3: true,
    q3IsPrismatic: false,
    q3Label: 'θ₃',
    qLimit,
    dqLimit,
    tauSatLimit,
    kNull,
    obstacle,
    w: wArr,
    dqNaive: dqNaiveNorm,
    dqSafe: dqSafeNorm,
    tauNorm,
    torques,
    eeErr,
    minClearance,
    frames,
    targets,
    ellipses,
    L: [L1, L2, L3],
    rMin,
    rMax,
    worldBounds: { xMin: -0.95, xMax: 2.55, yMin: -1.05, yMax: 1.85 },
    singularityIdx: argMin(wArr),
    wCrit: 0.45,
    velYMax: 8.5,
    wYMax: 2.9,
  };
}

function argMin(arr) {
  let idx = 0;
  let best = Infinity;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < best) {
      best = arr[i];
      idx = i;
    }
  }
  return idx;
}

// ---------------------------------------------------------------------------
// High-DPI Canvas Primitive Helpers
// ---------------------------------------------------------------------------
function makePlotMapper(w, h, xMin, xMax, yMin, yMax, pad = {}) {
  const compact = w < 440;
  const pLeft = pad.left ?? (compact ? 34 : 44);
  const pRight = pad.right ?? (compact ? 12 : 16);
  const pTop = pad.top ?? (compact ? 12 : 14);
  const pBottom = pad.bottom ?? (compact ? 20 : 24);
  const plotW = Math.max(20, w - pLeft - pRight);
  const plotH = Math.max(20, h - pTop - pBottom);

  const xSpan = Math.max(1e-6, xMax - xMin);
  const ySpan = Math.max(1e-6, yMax - yMin);

  return {
    w,
    h,
    compact,
    plotLeft: pLeft,
    plotRight: pLeft + plotW,
    plotTop: pTop,
    plotBottom: pTop + plotH,
    plotW,
    plotH,
    xMin,
    xMax,
    yMin,
    yMax,
    xToPx: (x) => pLeft + ((x - xMin) / xSpan) * plotW,
    yToPx: (y) => pTop + (1 - (y - yMin) / ySpan) * plotH,
    pxToX: (px) => xMin + ((px - pLeft) / plotW) * xSpan,
  };
}

/**
 * Aspect-preserving 2D world-to-canvas mapper for articulated manipulator geometry.
 */
function makeWorldMapper(x0, y0, w, h, bounds, padding = 16) {
  const innerW = Math.max(24, w - padding * 2);
  const innerH = Math.max(24, h - padding * 2);
  const spanX = Math.max(1e-6, bounds.xMax - bounds.xMin);
  const spanY = Math.max(1e-6, bounds.yMax - bounds.yMin);
  const scale = Math.min(innerW / spanX, innerH / spanY);
  const cxWorld = 0.5 * (bounds.xMin + bounds.xMax);
  const cyWorld = 0.5 * (bounds.yMin + bounds.yMax);
  const cxPx = x0 + w * 0.5;
  const cyPx = y0 + h * 0.5;

  return {
    x0,
    y0,
    w,
    h,
    scale,
    toPx: (wx, wy) => ({
      x: cxPx + (wx - cxWorld) * scale,
      y: cyPx - (wy - cyWorld) * scale,
    }),
  };
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawCompactBadge(ctx, x, y, text, borderColor, textColor, compact = false) {
  ctx.save();
  ctx.font = `600 ${compact ? 9.5 : 10.5}px ${FONT_MONO}`;
  const tw = ctx.measureText(text).width;
  const pw = tw + (compact ? 10 : 12);
  const ph = compact ? 16 : 18;
  drawRoundedRect(ctx, x, y, pw, ph, 5);
  ctx.fillStyle = COLORS.pillBg;
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, x + (compact ? 5 : 6), y + ph * 0.5 + 0.5);
  ctx.restore();
}

function drawGrid(ctx, map, xTicks, yTicks, xFmt, yFmt) {
  ctx.save();
  ctx.strokeStyle = COLORS.gridMinor;
  ctx.lineWidth = 1;

  for (const xv of xTicks) {
    const px = map.xToPx(xv);
    if (px < map.plotLeft - 1 || px > map.plotRight + 1) continue;
    ctx.beginPath();
    ctx.moveTo(px, map.plotTop);
    ctx.lineTo(px, map.plotBottom);
    ctx.stroke();
  }

  for (const yv of yTicks) {
    const py = map.yToPx(yv);
    if (py < map.plotTop - 1 || py > map.plotBottom + 1) continue;
    ctx.strokeStyle = Math.abs(yv) < 1e-6 ? COLORS.axis : COLORS.gridMajor;
    ctx.beginPath();
    ctx.moveTo(map.plotLeft, py);
    ctx.lineTo(map.plotRight, py);
    ctx.stroke();
  }

  // Labels
  ctx.fillStyle = COLORS.axisLabel;
  ctx.font = `500 ${map.compact ? 9 : 10}px ${FONT_MONO}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const yv of yTicks) {
    const py = map.yToPx(yv);
    if (py < map.plotTop + 4 || py > map.plotBottom - 3) continue;
    ctx.fillText(yFmt ? yFmt(yv) : fmtPlain(yv, 1), map.plotLeft - 5, py);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const xv of xTicks) {
    const px = map.xToPx(xv);
    if (px < map.plotLeft + 6 || px > map.plotRight - 6) continue;
    ctx.fillText(xFmt ? xFmt(xv) : fmtPlain(xv, 1), px, map.plotBottom + 4);
  }
  ctx.restore();
}

function drawCursorLine(ctx, map, xVal, pulse) {
  const px = map.xToPx(xVal);
  ctx.save();
  const grad = ctx.createLinearGradient(0, map.plotTop, 0, map.plotBottom);
  grad.addColorStop(0, 'rgba(34, 211, 238, 0.25)');
  grad.addColorStop(0.5, `rgba(34, 211, 238, ${0.7 + 0.15 * Math.sin(pulse)})`);
  grad.addColorStop(1, 'rgba(34, 211, 238, 0.25)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(px, map.plotTop);
  ctx.lineTo(px, map.plotBottom);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawGlowingDot(ctx, x, y, r, color, glowColor, pulse = 0) {
  ctx.save();
  if (pulse > 0) {
    ctx.beginPath();
    ctx.arc(x, y, r + 3.2 + 1.4 * Math.sin(pulse), 0, TWO_PI);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 9;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TWO_PI);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.restore();
}

function drawArrowHead(ctx, x1, y1, x2, y2, color, headLen = 7, lineWidth = 1.8) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - 0.42), y2 - headLen * Math.sin(angle - 0.42));
  ctx.lineTo(x2 - headLen * Math.cos(angle + 0.42), y2 - headLen * Math.sin(angle + 0.42));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Draw an RGB 2D/3D coordinate frame (Red +x, Green +y, Blue z-dot) at pixel (px, py) with world angle theta.
 */
function drawRgbFrame(ctx, px, py, theta, len = 18, label = '') {
  ctx.save();
  // World +x axis -> (cos theta, -sin theta) in canvas px
  const xx = px + Math.cos(theta) * len;
  const xy = py - Math.sin(theta) * len;
  // World +y axis -> (-sin theta, -cos theta) in canvas px
  const yx = px - Math.sin(theta) * len;
  const yy = py - Math.cos(theta) * len;

  drawArrowHead(ctx, px, py, xx, xy, COLORS.rgbX, 5.5, 1.8);
  drawArrowHead(ctx, px, py, yx, yy, COLORS.rgbY, 5.5, 1.8);

  // Blue Z-axis out-of-plane dot
  ctx.fillStyle = COLORS.rgbZ;
  ctx.beginPath();
  ctx.arc(px, py, 2.7, 0, TWO_PI);
  ctx.fill();

  if (label) {
    ctx.font = `600 9.5px ${FONT_MONO}`;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, px + 6, py + 11);
  }
  ctx.restore();
}

/**
 * Draw the live Yoshikawa Manipulability Ellipse (J J^T) at the end-effector.
 */
function drawManipulabilityEllipse(ctx, wm, ee, ell, scaleFactor = 0.28, isSingular = false) {
  const c = wm.toPx(ee.x, ee.y);
  const rx = Math.max(1.6, ell.sigma1 * scaleFactor * wm.scale);
  const ry = Math.max(1.2, ell.sigma2 * scaleFactor * wm.scale);

  ctx.save();
  ctx.translate(c.x, c.y);
  // Canvas Y is inverted relative to world Y
  ctx.rotate(-ell.angle);

  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TWO_PI);
  ctx.fillStyle = isSingular ? 'rgba(251, 113, 133, 0.16)' : 'rgba(52, 211, 153, 0.15)';
  ctx.fill();
  ctx.strokeStyle = isSingular ? COLORS.coral : COLORS.emerald;
  ctx.shadowColor = isSingular ? COLORS.coralGlow : COLORS.emeraldGlow;
  ctx.shadowBlur = 8;
  ctx.lineWidth = isSingular ? 2.1 : 1.7;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Principal semi-axes (major = Emerald/Cyan, minor = Coral when collapsed)
  ctx.strokeStyle = isSingular ? 'rgba(251, 113, 133, 0.85)' : 'rgba(52, 211, 153, 0.65)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-rx, 0);
  ctx.lineTo(rx, 0);
  ctx.moveTo(0, -ry);
  ctx.lineTo(0, ry);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw articulated manipulator links & joint circles.
 */
function drawArticulatedArm(ctx, wm, joints, opts = {}) {
  const {
    linkColors = [COLORS.cyan, COLORS.amber, COLORS.emerald],
    dashed = false,
    alpha = 1.0,
    lineWidth = 4.6,
    jointRadius = 4.8,
  } = opts;

  ctx.save();
  ctx.globalAlpha = alpha;
  if (dashed) ctx.setLineDash([6, 4]);

  for (let i = 0; i < joints.length - 1; i++) {
    const a = wm.toPx(joints[i].x, joints[i].y);
    const b = wm.toPx(joints[i + 1].x, joints[i + 1].y);
    const col = linkColors[i % linkColors.length];

    // Outer casing glow
    ctx.strokeStyle = col;
    ctx.lineCap = 'round';
    ctx.lineWidth = lineWidth;
    if (!dashed) {
      ctx.shadowColor = col;
      ctx.shadowBlur = 7;
    }
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner mechanical highlight core
    if (!dashed) {
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.35)';
      ctx.lineWidth = Math.max(1.2, lineWidth * 0.25);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);

  // Base pedestal
  const basePx = wm.toPx(joints[0].x, joints[0].y);
  if (!dashed) {
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = COLORS.slate;
    ctx.lineWidth = 1.3;
    drawRoundedRect(ctx, basePx.x - 10, basePx.y - 6, 20, 12, 3);
    ctx.fill();
    ctx.stroke();
  }

  // Revolute joint bearings
  for (let i = 0; i < joints.length; i++) {
    const p = wm.toPx(joints[i].x, joints[i].y);
    const isEE = i === joints.length - 1;
    const r = isEE ? jointRadius * 0.9 : jointRadius;
    ctx.fillStyle = isEE ? COLORS.white : '#0F172A';
    ctx.strokeStyle = isEE ? COLORS.emerald : linkColors[Math.min(i, linkColors.length - 1)];
    ctx.lineWidth = dashed ? 1.4 : 2.1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawWorldGrid(ctx, wm, bounds) {
  ctx.save();
  ctx.strokeStyle = COLORS.gridMinor;
  ctx.lineWidth = 1;
  const xStart = Math.ceil(bounds.xMin);
  const xEnd = Math.floor(bounds.xMax);
  const yStart = Math.ceil(bounds.yMin);
  const yEnd = Math.floor(bounds.yMax);

  for (let x = xStart; x <= xEnd; x++) {
    const p1 = wm.toPx(x, bounds.yMin);
    const p2 = wm.toPx(x, bounds.yMax);
    ctx.strokeStyle = x === 0 ? COLORS.axis : COLORS.gridMinor;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
  for (let y = yStart; y <= yEnd; y++) {
    const p1 = wm.toPx(bounds.xMin, y);
    const p2 = wm.toPx(bounds.xMax, y);
    ctx.strokeStyle = y === 0 ? COLORS.axis : COLORS.gridMinor;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
  ctx.restore();
}

// ===========================================================================
// PART 1: KinematicsGraphLab (Synchronized 3-Panel High-DPI Inspector)
// ===========================================================================
export class KinematicsGraphLab {
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
    this._paramValues = new Map();
    for (const p of LAB_PRESETS) {
      this._paramValues.set(p.key, p.paramDefault);
    }

    this._sim = simulatePreset(this._preset.key, this._getParamVal());
    this.cursorIdx = this._defaultCursorForPreset(this._preset.key, this._sim);
    this._isPlaying = false;
    this._playAccum = 0;

    this._hasInteracted = false;
    this._isDraggingPanel = -1;
    this._activePointerId = null;

    this._container = null;
    this._root = null;
    this._canvases = [];
    this._ctxs = [];
    this._sizes = [
      { w: 0, h: 188 },
      { w: 0, h: 112 },
      { w: 0, h: 112 },
    ];
    this._panelMetaEls = [];
    this._presetButtons = new Map();
    this._telemetryEls = {};
    this._timeSliderEl = null;
    this._timeValEl = null;
    this._playBtnEl = null;
    this._paramLabelEl = null;
    this._paramSliderEl = null;
    this._paramValEl = null;

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

  _getParamVal() {
    return this._paramValues.get(this._preset.key) ?? this._preset.paramDefault;
  }

  _defaultCursorForPreset(key, sim) {
    if (key === 'ik-dls') return Math.round(sim.N * 0.49); // Right at outer singularity
    if (key === 'qp-ik-3r') return Math.round(sim.N * 0.66); // Peak obstacle dodge around Coral circle
    if (key === 'scara-rrp') return Math.round(sim.N * 0.50); // Mid-slew
    if (key === 'poe-3r') return Math.round(sim.N * 0.34);
    return Math.round(sim.N * 0.30);
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
      'w-full max-w-full rounded-2xl border border-slate-800/90 bg-[#0B0D12]/95 shadow-2xl overflow-hidden backdrop-blur-md';
    this._root = root;

    // --- 1. Compact Mobile-First Top Control & Telemetry Strip ---
    const topBar = document.createElement('div');
    topBar.className =
      'px-2.5 py-2 sm:px-3.5 sm:py-2.5 border-b border-slate-800/80 bg-[#0F131C]/90 flex flex-col gap-1.5 sm:gap-2';

    // Row 1: 5 Scrollable Preset Pills
    const pillRow = document.createElement('div');
    pillRow.className =
      'flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap sm:flex-wrap pb-0.5 sm:pb-0';
    this._presetButtons.clear();

    for (const preset of LAB_PRESETS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.presetKey = preset.key;
      btn.className =
        'el-kin-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer';
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

    // Row 2: Live Telemetry Pill Strip
    const telemetryRow = document.createElement('div');
    telemetryRow.className =
      'flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap sm:flex-wrap';

    const makePill = (extra) => {
      const el = document.createElement('span');
      el.className = `shrink-0 whitespace-nowrap px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border ${extra}`;
      return el;
    };

    const tPill = makePill('bg-cyan-500/10 border-cyan-400/45 text-cyan-200');
    const posePill = makePill('bg-slate-900/90 border-slate-700 text-slate-200');
    const manipPill = makePill('bg-emerald-500/10 border-emerald-400/45 text-emerald-200');
    const effortPill = makePill('bg-violet-500/10 border-violet-400/45 text-violet-200');
    const statusPill = makePill('font-bold tracking-wide');

    telemetryRow.append(tPill, posePill, manipPill, effortPill, statusPill);

    // Row 3: Unified Time Scrubber + Preset Parameter Slider
    const slidersGrid = document.createElement('div');
    slidersGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-3';

    // Unified Scrubber + Play/Pause
    const timeRow = document.createElement('div');
    timeRow.className = 'flex items-center gap-1.5 sm:gap-2 min-w-0';

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className =
      'el-kin-pill shrink-0 w-7 h-6 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 text-[11px] font-bold flex items-center justify-center cursor-pointer';
    playBtn.setAttribute('aria-label', 'Play or pause trajectory scrubber');
    playBtn.textContent = '▶';
    playBtn.addEventListener(
      'click',
      () => {
        safeSound('playTick');
        this._isPlaying = !this._isPlaying;
        if (this._isPlaying && this.cursorIdx >= this._sim.N - 1) {
          this.cursorIdx = 0;
        }
        this._syncControlUI();
        this._markInteracted();
      },
      { signal }
    );
    this._playBtnEl = playBtn;

    const timeSlider = document.createElement('input');
    timeSlider.type = 'range';
    timeSlider.className = 'el-kin-slider flex-1 min-w-0';
    timeSlider.min = '0';
    timeSlider.max = String(this._sim.N - 1);
    timeSlider.step = '1';
    timeSlider.setAttribute('aria-label', 'Trajectory progress scrubber t');
    timeSlider.addEventListener(
      'input',
      () => {
        this._isPlaying = false;
        this._applyCursorIndex(Number(timeSlider.value), true);
      },
      { signal }
    );
    this._timeSliderEl = timeSlider;

    const timeVal = document.createElement('span');
    timeVal.className =
      'shrink-0 min-w-[54px] text-right text-[10px] sm:text-[11px] font-mono font-bold text-cyan-200 bg-slate-900/90 border border-slate-800 px-1.5 py-0.5 rounded-md';
    this._timeValEl = timeVal;

    timeRow.append(playBtn, timeSlider, timeVal);

    // Preset Tuning Slider
    const paramRow = document.createElement('div');
    paramRow.className = 'flex items-center gap-1.5 sm:gap-2 min-w-0';

    const paramLabel = document.createElement('label');
    paramLabel.className =
      'shrink-0 text-[10px] sm:text-[11px] font-mono font-semibold text-violet-200/90 tracking-tight';
    this._paramLabelEl = paramLabel;

    const paramSlider = document.createElement('input');
    paramSlider.type = 'range';
    paramSlider.className = 'el-kin-slider el-kin-slider-param flex-1 min-w-0';
    paramSlider.min = '0';
    paramSlider.max = '1000';
    paramSlider.step = '1';
    paramSlider.setAttribute('aria-label', 'Preset kinematics parameter');
    paramSlider.addEventListener(
      'input',
      () => {
        const nextVal = this._sliderPosToParam(Number(paramSlider.value));
        this._applyParamValue(nextVal, true);
      },
      { signal }
    );
    this._paramSliderEl = paramSlider;

    const paramVal = document.createElement('span');
    paramVal.className =
      'shrink-0 min-w-[54px] text-right text-[10px] sm:text-[11px] font-mono font-bold text-violet-200 bg-slate-900/90 border border-slate-800 px-1.5 py-0.5 rounded-md';
    this._paramValEl = paramVal;

    paramRow.append(paramLabel, paramSlider, paramVal);
    slidersGrid.append(timeRow, paramRow);

    // Row 4 (Desktop/tablet only): Live KaTeX formula + concise insight
    const desktopRow = document.createElement('div');
    desktopRow.className = 'hidden sm:flex flex-wrap items-center justify-between gap-2 text-xs';

    const formulaEl = document.createElement('div');
    formulaEl.className = 'text-cyan-200/95 font-medium flex items-center gap-2';

    const insightEl = document.createElement('div');
    insightEl.className = 'text-[11px] text-slate-400 truncate';

    desktopRow.append(formulaEl, insightEl);

    this._telemetryEls = {
      tPill,
      posePill,
      manipPill,
      effortPill,
      statusPill,
      formulaEl,
      insightEl,
    };

    topBar.append(pillRow, telemetryRow, slidersGrid, desktopRow);
    root.appendChild(topBar);

    // --- 2. Synchronized 3-Panel High-DPI Canvas Stack ---
    const stackWrap = document.createElement('div');
    stackWrap.className = 'divide-y divide-slate-800/80 bg-[#0B0D12]';
    stackWrap.tabIndex = 0;
    stackWrap.setAttribute(
      'aria-label',
      'Synchronized 3-panel kinematics inspector: Articulated Arm Geometry, Joint Angles vs Limits, and Manipulability & Velocity Norm; drag any panel or use arrow keys to scrub trajectory'
    );

    const panelDots = [COLORS.emerald, COLORS.cyan, COLORS.amber];
    const panelHeights = [
      'h-[188px] sm:h-[236px]',
      'h-[112px] sm:h-[140px]',
      'h-[112px] sm:h-[140px]',
    ];
    const panelCursors = ['cursor-ew-resize', 'cursor-ew-resize', 'cursor-ew-resize'];

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
        'px-1.5 py-0.5 sm:px-2 rounded-md text-[10px] sm:text-[11px] font-mono font-semibold bg-slate-900/90 border border-slate-800 text-slate-200 shrink-0';

      header.append(titleWrap, readoutEl);
      panel.appendChild(header);

      const canvasWrap = document.createElement('div');
      canvasWrap.className = `relative w-full max-w-full ${panelCursors[i]} ${panelHeights[i]}`;

      const canvas = document.createElement('canvas');
      canvas.className = 'el-kin-canvas h-full';
      canvas.style.touchAction = 'none';
      canvasWrap.appendChild(canvas);
      panel.appendChild(canvasWrap);

      stackWrap.appendChild(panel);

      this._canvases.push(canvas);
      this._ctxs.push(canvas.getContext('2d'));
      this._sizes[i] = { w: 0, h: i === 0 ? 188 : 112 };
      this._panelMetaEls.push({ titleEl, readoutEl, canvasWrap });
    }

    this._bindScrubPointerEvents(this._canvases[0], 0, signal);
    this._bindScrubPointerEvents(this._canvases[1], 1, signal);
    this._bindScrubPointerEvents(this._canvases[2], 2, signal);

    stackWrap.addEventListener(
      'keydown',
      (e) => {
        if (e.key === ' ') {
          e.preventDefault();
          this._isPlaying = !this._isPlaying;
          this._syncControlUI();
          return;
        }
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        this._isPlaying = false;
        const delta = (e.shiftKey ? 5 : 1) * (e.key === 'ArrowRight' ? 1 : -1);
        this._applyCursorIndex(this.cursorIdx + delta, true);
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
      footerNote.textContent = 'Drag any canvas or scrub t to inspect arm geometry, manipulability ellipses & joint limits.';

      const ctaBtn = document.createElement('button');
      ctaBtn.type = 'button';
      ctaBtn.className =
        'el-kin-pill w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-100 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(34,211,238,0.16)]';
      ctaBtn.textContent = 'Test Your Intuition: Kinematics Visual Quiz →';
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

  setPreset(key) {
    const found = LAB_PRESETS.find((p) => p.key === key);
    if (!found) return;
    this._preset = found;
    this._sim = simulatePreset(found.key, this._getParamVal());
    this.cursorIdx = this._defaultCursorForPreset(found.key, this._sim);
    this._syncControlUI();
    this._drawAll();
  }

  toggleMechatronicsLens(bool) {
    const next = typeof bool === 'boolean' ? bool : !this.mechatronicsLens;
    if (next === this.mechatronicsLens) return;
    this.mechatronicsLens = next;
    this._syncControlUI();
    this._drawAll();
  }

  setMechatronicsLens(bool) {
    this.toggleMechatronicsLens(Boolean(bool));
  }

  setLens(lens) {
    this.toggleMechatronicsLens(lens === 'mechatronics');
  }

  _paramToSliderPos(val) {
    const p = this._preset;
    const clamped = clamp(val, p.paramMin, p.paramMax);
    let u;
    if (p.paramLog) {
      u = (Math.log(clamped) - Math.log(p.paramMin)) / (Math.log(p.paramMax) - Math.log(p.paramMin));
    } else {
      u = (clamped - p.paramMin) / (p.paramMax - p.paramMin);
    }
    return Math.round(clamp(u, 0, 1) * 1000);
  }

  _sliderPosToParam(pos) {
    const p = this._preset;
    const u = clamp(pos / 1000, 0, 1);
    let v;
    if (p.paramLog) {
      v = Math.exp(Math.log(p.paramMin) + u * (Math.log(p.paramMax) - Math.log(p.paramMin)));
    } else {
      v = p.paramMin + u * (p.paramMax - p.paramMin);
    }
    if (p.paramStep) {
      v = Math.round(v / p.paramStep) * p.paramStep;
    }
    return clamp(v, p.paramMin, p.paramMax);
  }

  _applyParamValue(val, fromUser = false) {
    this._paramValues.set(this._preset.key, val);
    this._sim = simulatePreset(this._preset.key, val);
    this.cursorIdx = clamp(this.cursorIdx, 0, this._sim.N - 1);
    this._syncControlUI();
    this._drawAll();
    if (fromUser) {
      const now = performance.now();
      if (now - this._lastTickMs > 70) {
        safeSound('playTick');
        this._lastTickMs = now;
      }
      this._markInteracted();
    }
  }

  _applyCursorIndex(nextIdx, fromUser = false) {
    const clamped = clamp(Math.round(nextIdx), 0, this._sim.N - 1);
    if (clamped === this.cursorIdx && !fromUser) return;
    this.cursorIdx = clamped;
    this._syncControlUI();
    this._drawAll();
    if (fromUser) {
      const now = performance.now();
      if (now - this._lastTickMs > 65) {
        safeSound('playTick');
        this._lastTickMs = now;
      }
      this._markInteracted();
    }
  }

  _markInteracted() {
    if (this._hasInteracted) return;
    this._hasInteracted = true;
    try {
      this.onInteract?.({ preset: this._preset.key });
    } catch (_) {
      // Ignore consumer callback errors
    }
  }

  _bindScrubPointerEvents(canvas, panelIdx, signal) {
    const mapClientXToIdx = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      if (panelIdx === 0) {
        const u = clamp(x / Math.max(1, rect.width), 0, 1);
        return Math.round(u * (this._sim.N - 1));
      }
      const w = this._sizes[panelIdx]?.w || rect.width || 300;
      const h = this._sizes[panelIdx]?.h || rect.height || 112;
      const map = makePlotMapper(w, h, 0, this._sim.T, -1, 1);
      const tVal = clamp(map.pxToX(x), 0, this._sim.T);
      return Math.round((tVal / this._sim.T) * (this._sim.N - 1));
    };

    canvas.addEventListener(
      'pointerdown',
      (e) => {
        this._isPlaying = false;
        this._isDraggingPanel = panelIdx;
        this._activePointerId = e.pointerId;
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {
          // Ignore
        }
        this._applyCursorIndex(mapClientXToIdx(e.clientX), true);
      },
      { signal }
    );

    canvas.addEventListener(
      'pointermove',
      (e) => {
        if (this._isDraggingPanel !== panelIdx || this._activePointerId !== e.pointerId) return;
        this._applyCursorIndex(mapClientXToIdx(e.clientX), true);
      },
      { signal }
    );

    const endDrag = (e) => {
      if (this._isDraggingPanel !== panelIdx) return;
      this._isDraggingPanel = -1;
      this._activePointerId = null;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (_) {
        // Ignore
      }
    };

    canvas.addEventListener('pointerup', endDrag, { signal });
    canvas.addEventListener('pointercancel', endDrag, { signal });
  }

  _syncControlUI() {
    if (!this._root) return;
    const p = this._preset;
    const sim = this._sim;
    const k = clamp(this.cursorIdx, 0, sim.N - 1);
    const mech = this.mechatronicsLens;

    // Preset pills active highlight
    for (const [key, btn] of this._presetButtons.entries()) {
      const active = key === p.key;
      btn.className =
        'el-kin-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer ' +
        (active
          ? 'bg-cyan-400/15 border-cyan-400/70 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.22)]'
          : 'bg-slate-900/75 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600');
    }

    // Play/Pause + Sliders
    if (this._playBtnEl) {
      this._playBtnEl.textContent = this._isPlaying ? '⏸' : '▶';
    }
    if (this._timeSliderEl) {
      this._timeSliderEl.max = String(sim.N - 1);
      this._timeSliderEl.value = String(k);
    }
    if (this._timeValEl) {
      this._timeValEl.textContent = `t=${fmtPlain(sim.t[k], 2)}s`;
    }
    if (this._paramLabelEl) {
      this._paramLabelEl.textContent = p.paramLabel;
    }
    if (this._paramSliderEl) {
      this._paramSliderEl.value = String(this._paramToSliderPos(this._getParamVal()));
    }
    if (this._paramValEl) {
      const v = this._getParamVal();
      this._paramValEl.textContent = `${fmtPlain(v, 2)}${p.paramUnit}`;
    }

    // Telemetry strip
    const { tPill, posePill, manipPill, effortPill, statusPill, formulaEl, insightEl } = this._telemetryEls;
    const fk = sim.frames[k];
    const ell = sim.ellipses[k];
    const w = sim.w[k];
    const dqS = sim.dqSafe[k];
    const tauN = sim.tauNorm[k];
    const isSingular = w < sim.wCrit;
    const isSat = tauN > sim.tauSatLimit || dqS > sim.dqLimit * 0.96;
    const isObsHit = sim.presetKey === 'qp-ik-3r' && sim.minClearance[k] < 0.01;

    if (tPill) tPill.textContent = `t = ${fmtPlain(sim.t[k], 2)}s`;
    if (posePill) {
      if (sim.presetKey === 'scara-rrp') {
        posePill.textContent = `EE (${fmtPlain(fk.ee.x, 2)}, ${fmtPlain(fk.ee.y, 2)}, z=${fmtPlain(fk.zEE, 2)})`;
      } else {
        posePill.textContent = `EE (${fmtPlain(fk.ee.x, 2)}, ${fmtPlain(fk.ee.y, 2)})`;
      }
    }
    if (manipPill) {
      manipPill.textContent = `w=${fmtPlain(w, 2)} • σ₂=${fmtPlain(ell.sigma2, 2)}`;
    }
    if (effortPill) {
      effortPill.textContent = mech
        ? `‖τ‖=${fmtPlain(tauN, 1)} N·m`
        : `‖q̇‖=${fmtPlain(dqS, 2)} rad/s`;
    }

    if (statusPill) {
      let label = 'WELL-CONDITIONED';
      let cls = 'bg-emerald-500/12 border-emerald-400/50 text-emerald-200';
      if (isObsHit) {
        label = 'OBSTACLE COLLISION';
        cls = 'bg-rose-500/15 border-rose-400/65 text-rose-200';
      } else if (isSingular) {
        label = sim.presetKey === 'ik-dls' ? 'SINGULARITY • DLS CLAMP' : 'NEAR SINGULARITY';
        cls = 'bg-rose-500/15 border-rose-400/65 text-rose-200';
      } else if (mech && isSat) {
        label = 'ACTUATOR SATURATION';
        cls = 'bg-amber-500/15 border-amber-400/65 text-amber-200';
      } else if (sim.presetKey === 'qp-ik-3r') {
        label = `CLEAR +${fmtPlain(sim.minClearance[k], 2)}m`;
        cls = 'bg-emerald-500/12 border-emerald-400/50 text-emerald-200';
      }
      statusPill.className = `shrink-0 whitespace-nowrap px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wide border ${cls}`;
      statusPill.textContent = label;
    }

    if (formulaEl) {
      formulaEl.innerHTML = formatKatex(p.formulaTex, false);
    }
    if (insightEl) {
      insightEl.textContent = mech ? p.insightMech : p.insightMath;
    }

    // Panel headers & dynamic readouts
    if (this._panelMetaEls.length === 3) {
      const m0 = this._panelMetaEls[0];
      const m1 = this._panelMetaEls[1];
      const m2 = this._panelMetaEls[2];

      const p1Titles = {
        'planar-2r': mech
          ? '1. Planar 2R Servo Geometry, Workspace & Static Torque τ = JᵀF'
          : '1. Planar 2R Geometry, Dual IK Branches & Manipulability Ellipse',
        'scara-rrp': mech
          ? '1. SCARA R-R-P Top/Side View & Quill Payload Actuators'
          : '1. SCARA R-R-P (Top X-Y Arm + Side X-Z Prismatic Quill)',
        'poe-3r': mech
          ? '1. PoE 3R Screw Kinematics, Home M & Joint Torque Load'
          : '1. Product of Exponentials 3R: Home M vs. Live Screw Pose',
        'ik-dls': mech
          ? '1. Outer Boundary Singularity, Collapsed Ellipse & DLS Servo Load'
          : '1. Outer Singularity Sweep & Collapsing Manipulability Ellipse',
        'qp-ik-3r': mech
          ? '1. 3R Redundant QP-IK Obstacle Dodge & Actuator Torque Margin'
          : '1. 3R Redundant Arm: Nullspace / QP-IK Obstacle Avoidance',
      };
      m0.titleEl.textContent = p1Titles[p.key] || p1Titles['planar-2r'];
      m0.readoutEl.textContent = mech
        ? `τ=[${sim.torques[k].map((v) => fmtPlain(v, 1)).join(', ')}]`
        : `κ=${ell.cond > 50 ? '>50' : fmtPlain(ell.cond, 1)} • e=${fmtPlain(sim.eeErr[k], 3)}m`;

      m1.titleEl.textContent = mech
        ? '2. Servo Encoder Angles θᵢ(t) vs. Hard-Stop Limits (±q_max)'
        : '2. Joint Coordinates θᵢ(t) vs. Hardware Joint Limits (±q_max)';
      const qRead = sim.hasQ3
        ? sim.q3IsPrismatic
          ? `θ₁=${fmtDeg(sim.q1[k])} θ₂=${fmtDeg(sim.q2[k])} d₃=${fmtPlain(sim.q3[k], 2)}m`
          : `θ₁=${fmtDeg(sim.q1[k])} θ₂=${fmtDeg(sim.q2[k])} θ₃=${fmtDeg(sim.q3[k])}`
        : `θ₁=${fmtDeg(sim.q1[k])} • θ₂=${fmtDeg(sim.q2[k])}`;
      m1.readoutEl.textContent = qRead;

      m2.titleEl.textContent = mech
        ? '3. Manipulability w(θ) & Actuator Velocity Demand (Naive J⁺ vs. DLS/QP)'
        : '3. Manipulability w(θ) = √det(JJᵀ) & Velocity Norm ‖q̇‖ (J⁺ vs. DLS/QP)';
      m2.readoutEl.textContent = `J⁺=${fmtPlain(sim.dqNaive[k], 1)} • Safe=${fmtPlain(sim.dqSafe[k], 2)} rad/s`;
    }
  }

  _resizeAll() {
    if (typeof window === 'undefined') return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    for (let i = 0; i < this._canvases.length; i++) {
      const canvas = this._canvases[i];
      const wrap = this._panelMetaEls[i]?.canvasWrap;
      if (!canvas || !wrap) continue;
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(120, Math.floor(rect.width));
      const h = Math.max(80, Math.floor(rect.height));
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      this._sizes[i] = { w, h, dpr };
    }
  }

  _startAnimationLoop() {
    if (typeof requestAnimationFrame === 'undefined') return;
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    this._lastFrameTs = performance.now();

    const loop = (ts) => {
      if (this._disposed) return;
      const dtSec = Math.min(0.05, Math.max(0.001, (ts - this._lastFrameTs) / 1000));
      this._lastFrameTs = ts;
      this._pulsePhase = (this._pulsePhase + dtSec * 3.1) % TWO_PI;

      if (this._isPlaying) {
        this._playAccum += dtSec * 34; // ~5.2s full trajectory playback
        if (this._playAccum >= 1) {
          const steps = Math.floor(this._playAccum);
          this._playAccum -= steps;
          let next = this.cursorIdx + steps;
          if (next >= this._sim.N) next = 0;
          this.cursorIdx = next;
          this._syncControlUI();
        }
      }

      this._drawAll();
      this._rafId = requestAnimationFrame(loop);
    };

    this._rafId = requestAnimationFrame(loop);
  }

  _drawAll() {
    if (!this._ctxs.length) return;
    this._drawPanel1Geometry();
    this._drawPanel2Joints();
    this._drawPanel3ManipulabilityAndVel();
  }

  // -------------------------------------------------------------------------
  // PANEL 1: Articulated Arm Geometry, Workspace & Manipulability Ellipse
  // -------------------------------------------------------------------------
  _drawPanel1Geometry() {
    const ctx = this._ctxs[0];
    const sz = this._sizes[0];
    if (!ctx || !sz || sz.w <= 0) return;
    const { w, h, dpr = 1 } = sz;
    const sim = this._sim;
    const k = clamp(this.cursorIdx, 0, sim.N - 1);
    const compact = w < 440;
    const mech = this.mechatronicsLens;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    if (sim.presetKey === 'scara-rrp') {
      this._drawScaraSplitView(ctx, w, h, sim, k, compact, mech);
      ctx.restore();
      return;
    }

    const wm = makeWorldMapper(0, 0, w, h, sim.worldBounds, compact ? 12 : 18);

    // Subtle Cartesian background grid
    drawWorldGrid(ctx, wm, sim.worldBounds);

    // Reachable Workspace Annulus
    const originPx = wm.toPx(0, 0);
    const rMaxPx = sim.rMax * wm.scale;
    const rMinPx = sim.rMin * wm.scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(originPx.x, originPx.y, rMaxPx, 0, TWO_PI);
    if (rMinPx > 2) {
      ctx.arc(originPx.x, originPx.y, rMinPx, 0, TWO_PI, true);
    }
    ctx.fillStyle = 'rgba(34, 211, 238, 0.045)';
    ctx.fill('evenodd');

    // Outer singularity circle
    ctx.strokeStyle =
      sim.presetKey === 'ik-dls' ? 'rgba(251, 113, 133, 0.55)' : 'rgba(34, 211, 238, 0.25)';
    ctx.lineWidth = sim.presetKey === 'ik-dls' ? 1.5 : 1.1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(originPx.x, originPx.y, rMaxPx, 0, TWO_PI);
    ctx.stroke();

    // Inner dead-zone ring
    if (rMinPx > 2) {
      ctx.fillStyle = 'rgba(251, 113, 133, 0.07)';
      ctx.beginPath();
      ctx.arc(originPx.x, originPx.y, rMinPx, 0, TWO_PI);
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.35)';
      ctx.beginPath();
      ctx.arc(originPx.x, originPx.y, rMinPx, 0, TWO_PI);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    // Mode-specific pre-arm overlays
    if (sim.presetKey === 'qp-ik-3r' && sim.obstacle) {
      const obsPx = wm.toPx(sim.obstacle.x, sim.obstacle.y);
      const rObsPx = sim.obstacle.r * wm.scale;
      const rSafePx = (sim.obstacle.r + sim.obstacle.margin) * wm.scale;

      // Safety buffer halo
      ctx.save();
      ctx.beginPath();
      ctx.arc(obsPx.x, obsPx.y, rSafePx, 0, TWO_PI);
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.32)';
      ctx.lineWidth = 1.1;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Solid Coral obstacle
      ctx.beginPath();
      ctx.arc(obsPx.x, obsPx.y, rObsPx, 0, TWO_PI);
      ctx.fillStyle = sim.minClearance[k] < 0.01 ? 'rgba(251, 113, 133, 0.45)' : 'rgba(251, 113, 133, 0.24)';
      ctx.fill();
      ctx.strokeStyle = COLORS.coral;
      ctx.shadowColor = COLORS.coralGlow;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.font = `700 ${compact ? 9 : 10}px ${FONT_MONO}`;
      ctx.fillStyle = '#FFE4E6';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OBS', obsPx.x, obsPx.y);
      ctx.restore();
    }

    if (sim.presetKey === 'poe-3r' && sim.homeJoints) {
      // Ghosted Home Configuration M
      drawArticulatedArm(ctx, wm, sim.homeJoints, {
        linkColors: ['rgba(167, 139, 250, 0.55)'],
        dashed: true,
        alpha: 0.72,
        lineWidth: 2.5,
        jointRadius: 3.4,
      });
      const mTip = wm.toPx(sim.homeJoints[3].x, sim.homeJoints[3].y);
      drawRgbFrame(ctx, mTip.x, mTip.y, 0, compact ? 13 : 16, '{M}');

      // Screw-axis rotation markers S1, S2, S3 at home screw axes
      const screwLabels = ['S₁', 'S₂', 'S₃'];
      for (let i = 0; i < 3; i++) {
        const sp = wm.toPx(sim.homeJoints[i].x, sim.homeJoints[i].y);
        ctx.save();
        ctx.strokeStyle = COLORS.violet;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, compact ? 8 : 10, -0.5, 1.35 * Math.PI);
        ctx.stroke();
        ctx.font = `700 ${compact ? 8.5 : 9.5}px ${FONT_MONO}`;
        ctx.fillStyle = COLORS.violet;
        ctx.textAlign = 'center';
        ctx.fillText(screwLabels[i], sp.x, sp.y + (compact ? 17 : 19));
        ctx.restore();
      }
    }

    // Desired Target Path curve
    ctx.save();
    ctx.strokeStyle =
      sim.presetKey === 'qp-ik-3r' ? 'rgba(34, 211, 238, 0.55)' : 'rgba(148, 163, 184, 0.34)';
    ctx.lineWidth = sim.presetKey === 'qp-ik-3r' ? 2.0 : 1.3;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    for (let i = 0; i < sim.N; i++) {
      const tp = wm.toPx(sim.targets[i].x, sim.targets[i].y);
      if (i === 0) ctx.moveTo(tp.x, tp.y);
      else ctx.lineTo(tp.x, tp.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Actual EE trail up to cursor k
    ctx.save();
    ctx.strokeStyle = COLORS.emerald;
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    for (let i = 0; i <= k; i++) {
      const ep = wm.toPx(sim.frames[i].ee.x, sim.frames[i].ee.y);
      if (i === 0) ctx.moveTo(ep.x, ep.y);
      else ctx.lineTo(ep.x, ep.y);
    }
    ctx.stroke();
    ctx.restore();

    // Alternate Elbow-Up IK branch (planar-2r)
    if (sim.presetKey === 'planar-2r' && sim.altFrames) {
      drawArticulatedArm(ctx, wm, sim.altFrames[k].joints, {
        linkColors: [COLORS.violet, COLORS.violet],
        dashed: true,
        alpha: 0.78,
        lineWidth: 2.8,
        jointRadius: 3.6,
      });
    }

    // Live Manipulability Ellipse at End-Effector
    const fk = sim.frames[k];
    const ell = sim.ellipses[k];
    const isSingular = sim.w[k] < sim.wCrit;
    drawManipulabilityEllipse(ctx, wm, fk.ee, ell, sim.presetKey === 'poe-3r' ? 0.25 : 0.28, isSingular);

    // Primary Articulated Arm
    drawArticulatedArm(ctx, wm, fk.joints, {
      linkColors: [COLORS.cyan, COLORS.amber, COLORS.emerald],
      lineWidth: compact ? 4.2 : 5.2,
      jointRadius: compact ? 4.2 : 5.0,
    });

    // Base & End-Effector RGB Coordinate Frames
    drawRgbFrame(ctx, originPx.x, originPx.y, 0, compact ? 15 : 19, '{s}');
    const eePx = wm.toPx(fk.ee.x, fk.ee.y);
    drawRgbFrame(ctx, eePx.x, eePx.y, fk.eeAngle, compact ? 14 : 18, '{ee}');

    // Target reticle + tracking residual vector (especially visible in ik-dls beyond r_max)
    const tgtPx = wm.toPx(sim.targets[k].x, sim.targets[k].y);
    if (sim.eeErr[k] > 0.03) {
      ctx.save();
      ctx.strokeStyle = COLORS.coral;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(eePx.x, eePx.y);
      ctx.lineTo(tgtPx.x, tgtPx.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    drawGlowingDot(ctx, tgtPx.x, tgtPx.y, 3.6, COLORS.amberLight, COLORS.amberGlow, this._pulsePhase);

    // Mechatronics Lens: Servo Torque τ = J^T F labels at joints + tip force vector
    if (mech) {
      drawArrowHead(ctx, eePx.x, eePx.y, eePx.x, eePx.y + (compact ? 22 : 28), COLORS.coral, 6, 1.8);
      ctx.save();
      ctx.font = `600 ${compact ? 8.5 : 9.5}px ${FONT_MONO}`;
      ctx.fillStyle = COLORS.coral;
      ctx.textAlign = 'left';
      ctx.fillText('F=-12N', eePx.x + 5, eePx.y + (compact ? 20 : 25));

      const tau = sim.torques[k];
      for (let j = 0; j < tau.length; j++) {
        const jp = wm.toPx(fk.joints[j].x, fk.joints[j].y);
        const sat = Math.abs(tau[j]) > 18;
        drawCompactBadge(
          ctx,
          clamp(jp.x - 24, 6, w - 78),
          clamp(jp.y - 24, 6, h - 22),
          `τ${j + 1}=${fmtPlain(tau[j], 1)}Nm`,
          sat ? COLORS.coral : COLORS.amber,
          sat ? '#FECDD3' : '#FDE68A',
          true
        );
      }
      ctx.restore();
    }

    // Legend / mode callout badge in top-right
    const badgeInfo = {
      'planar-2r': { txt: 'Down (Cyan) vs Up (Violet)', col: COLORS.violet },
      'poe-3r': { txt: 'Home {M} → PoE T(θ)', col: COLORS.violet },
      'ik-dls': {
        txt: isSingular ? 'Ellipse Collapsed (σ₂→0)' : `Boundary r=${fmtPlain(sim.rMax, 2)}m`,
        col: isSingular ? COLORS.coral : COLORS.emerald,
      },
      'qp-ik-3r': {
        txt: sim.minClearance[k] < 0.01 ? 'Collision! Raise k_null' : 'Nullspace Dodge + Locked EE',
        col: sim.minClearance[k] < 0.01 ? COLORS.coral : COLORS.emerald,
      },
    }[sim.presetKey];

    if (badgeInfo) {
      const estW = badgeInfo.txt.length * (compact ? 5.9 : 6.5) + 14;
      drawCompactBadge(ctx, Math.max(8, w - estW - 8), 8, badgeInfo.txt, badgeInfo.col, COLORS.white, compact);
    }

    ctx.restore();
  }

  /**
   * Dedicated Top (X-Y) + Side (X-Z) split view for SCARA R-R-P preset.
   */
  _drawScaraSplitView(ctx, w, h, sim, k, compact, mech) {
    const splitX = Math.floor(w * 0.56);
    const fk = sim.frames[k];
    const ell = sim.ellipses[k];

    // --- Left Half: Top X-Y Plane ---
    const wm = makeWorldMapper(0, 0, splitX, h, sim.worldBounds, compact ? 10 : 14);
    drawWorldGrid(ctx, wm, sim.worldBounds);

    // Workspace annulus
    const orig = wm.toPx(0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.arc(orig.x, orig.y, sim.rMax * wm.scale, 0, TWO_PI);
    ctx.arc(orig.x, orig.y, sim.rMin * wm.scale, 0, TWO_PI, true);
    ctx.fillStyle = 'rgba(34, 211, 238, 0.045)';
    ctx.fill('evenodd');
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.26)';
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(orig.x, orig.y, sim.rMax * wm.scale, 0, TWO_PI);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Pick & Place pads
    const drawPad = (pos, lbl, col) => {
      const p = wm.toPx(pos.x, pos.y);
      ctx.save();
      drawRoundedRect(ctx, p.x - 10, p.y - 10, 20, 20, 4);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.font = `700 8.5px ${FONT_MONO}`;
      ctx.fillStyle = col;
      ctx.textAlign = 'center';
      ctx.fillText(lbl, p.x, p.y + 18);
      ctx.restore();
    };
    drawPad(sim.pickPos, 'PICK', COLORS.amber);
    drawPad(sim.placePos, 'PLACE', COLORS.emerald);

    // Planar trajectory
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1.3;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (let i = 0; i < sim.N; i++) {
      const tp = wm.toPx(sim.targets[i].x, sim.targets[i].y);
      if (i === 0) ctx.moveTo(tp.x, tp.y);
      else ctx.lineTo(tp.x, tp.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    drawManipulabilityEllipse(ctx, wm, fk.ee, ell, 0.26, sim.w[k] < sim.wCrit);
    drawArticulatedArm(ctx, wm, fk.joints, {
      linkColors: [COLORS.cyan, COLORS.amber],
      lineWidth: compact ? 3.8 : 4.6,
      jointRadius: compact ? 3.8 : 4.5,
    });
    drawRgbFrame(ctx, orig.x, orig.y, 0, compact ? 13 : 16, '{s}');
    const eeTop = wm.toPx(fk.ee.x, fk.ee.y);
    drawRgbFrame(ctx, eeTop.x, eeTop.y, fk.eeAngle, compact ? 12 : 15, '');

    drawCompactBadge(ctx, 8, 7, 'TOP X-Y (R-R)', COLORS.cyan, COLORS.cyan, true);

    // Divider line
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.24)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(splitX + 0.5, 0);
    ctx.lineTo(splitX + 0.5, h);
    ctx.stroke();
    ctx.restore();

    // --- Right Half: Side Elevation (Radial Reach vs. Vertical Quill d3) ---
    const rx0 = splitX + 12;
    const rw = Math.max(60, w - splitX - 20);
    const baseY = h - 22;
    const topY = 30;
    const colX = rx0 + 18;
    const zToPy = (z) => baseY - (z / 1.15) * (baseY - topY);

    // Worktable floor
    ctx.save();
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(rx0, baseY);
    ctx.lineTo(rx0 + rw, baseY);
    ctx.stroke();

    // Vertical SCARA pedestal column
    const boomY = zToPy(sim.zBoom);
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = COLORS.slate;
    ctx.lineWidth = 1.4;
    drawRoundedRect(ctx, colX - 8, boomY - 6, 16, baseY - boomY + 6, 3);
    ctx.fill();
    ctx.stroke();

    // Horizontal cantilever R-R boom extending to radial distance r = hypot(x,y)
    const reach = Math.hypot(fk.ee.x, fk.ee.y);
    const reachFrac = clamp(reach / sim.rMax, 0.18, 1.0);
    const quillX = colX + 18 + reachFrac * Math.max(36, rw - 46);

    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(colX, boomY);
    ctx.lineTo(quillX, boomY);
    ctx.stroke();

    // Vertical prismatic quill housing
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = COLORS.amber;
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, quillX - 7, boomY - 12, 14, 24, 3);
    ctx.fill();
    ctx.stroke();

    // Prismatic shaft descending by d3
    const tipY = zToPy(Math.max(0.03, fk.zEE));
    ctx.strokeStyle = COLORS.emerald;
    ctx.shadowColor = COLORS.emeraldGlow;
    ctx.shadowBlur = 7;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(quillX, boomY + 12);
    ctx.lineTo(quillX, tipY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Gripper tip
    drawGlowingDot(ctx, quillX, tipY, 3.8, COLORS.emerald, COLORS.emeraldGlow, this._pulsePhase);

    // Dimension arrow for d3
    const dimX = Math.min(w - 14, quillX + 16);
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
    ctx.lineWidth = 1.1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(dimX, boomY);
    ctx.lineTo(dimX, tipY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = `600 ${compact ? 9 : 10}px ${FONT_MONO}`;
    ctx.fillStyle = COLORS.emerald;
    ctx.textAlign = 'left';
    ctx.fillText(`d₃=${fmtPlain(fk.d3, 2)}m`, Math.min(w - 64, quillX - 20), Math.min(baseY - 6, tipY + 12));

    if (mech) {
      drawCompactBadge(ctx, splitX + 10, h - 22, `F_z=15N • τ₁=${fmtPlain(sim.torques[k][0], 1)}Nm`, COLORS.amber, '#FDE68A', true);
    }

    drawCompactBadge(ctx, splitX + 10, 7, 'SIDE X-Z (PRISMATIC d₃)', COLORS.emerald, COLORS.emerald, true);
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // PANEL 2: Joint Angles θᵢ(t) vs. Hardware Joint Limits (±q_max)
  // -------------------------------------------------------------------------
  _drawPanel2Joints() {
    const ctx = this._ctxs[1];
    const sz = this._sizes[1];
    if (!ctx || !sz || sz.w <= 0) return;
    const { w, h, dpr = 1 } = sz;
    const sim = this._sim;
    const k = clamp(this.cursorIdx, 0, sim.N - 1);
    const compact = w < 440;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    const yLim = 3.1;
    const map = makePlotMapper(w, h, 0, sim.T, -yLim, yLim);
    drawGrid(
      ctx,
      map,
      [0, 1.5, 3.0, 4.5, 6.0],
      [-2.5, 0, 2.5],
      (v) => `${fmtPlain(v, 1)}s`,
      (v) => (Math.abs(v) < 0.01 ? '0' : `${fmtSigned(v, 1)}`)
    );

    // Hardware joint-limit forbidden bands & dashed Coral rails (±q_max)
    const yTopLim = map.yToPx(sim.qLimit);
    const yBotLim = map.yToPx(-sim.qLimit);
    ctx.fillStyle = COLORS.coralFill;
    ctx.fillRect(map.plotLeft, map.plotTop, map.plotW, Math.max(0, yTopLim - map.plotTop));
    ctx.fillRect(map.plotLeft, yBotLim, map.plotW, Math.max(0, map.plotBottom - yBotLim));

    ctx.strokeStyle = COLORS.coral;
    ctx.lineWidth = 1.25;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(map.plotLeft, yTopLim);
    ctx.lineTo(map.plotRight, yTopLim);
    ctx.moveTo(map.plotLeft, yBotLim);
    ctx.lineTo(map.plotRight, yBotLim);
    ctx.stroke();
    ctx.setLineDash([]);

    // Alternate Elbow-Up θ₂ curve (planar-2r)
    if (sim.presetKey === 'planar-2r' && sim.q2Alt) {
      ctx.strokeStyle = COLORS.violet;
      ctx.lineWidth = 1.35;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      for (let i = 0; i < sim.N; i++) {
        const px = map.xToPx(sim.t[i]);
        const py = map.yToPx(clamp(sim.q2Alt[i], -yLim, yLim));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const plotSeries = (arr, color, glow, scale = 1) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 6;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      for (let i = 0; i < sim.N; i++) {
        const px = map.xToPx(sim.t[i]);
        const py = map.yToPx(clamp(arr[i] * scale, -yLim, yLim));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    };

    // θ1 (Cyan), θ2 (Amber), θ3 or d3 (Emerald)
    plotSeries(sim.q1, COLORS.cyan, COLORS.cyanGlow, 1);
    plotSeries(sim.q2, COLORS.amber, COLORS.amberGlow, 1);
    if (sim.hasQ3) {
      // Scale prismatic d3 (0..0.85m) by 2.4 for visual clarity alongside rad angles
      const scale3 = sim.q3IsPrismatic ? 2.4 : 1.0;
      plotSeries(sim.q3, COLORS.emerald, COLORS.emeraldGlow, scale3);
    }

    // Cursor & glowing trace markers
    drawCursorLine(ctx, map, sim.t[k], this._pulsePhase);
    const cx = map.xToPx(sim.t[k]);
    drawGlowingDot(ctx, cx, map.yToPx(clamp(sim.q1[k], -yLim, yLim)), 3.8, COLORS.cyan, COLORS.cyanGlow, 0);
    drawGlowingDot(ctx, cx, map.yToPx(clamp(sim.q2[k], -yLim, yLim)), 3.8, COLORS.amber, COLORS.amberGlow, 0);
    if (sim.hasQ3) {
      const s3 = sim.q3IsPrismatic ? 2.4 : 1.0;
      drawGlowingDot(ctx, cx, map.yToPx(clamp(sim.q3[k] * s3, -yLim, yLim)), 3.8, COLORS.emerald, COLORS.emeraldGlow, 0);
    }

    // Compact legend badge
    const leg = sim.hasQ3
      ? sim.q3IsPrismatic
        ? 'θ₁ • θ₂ • d₃(×2.4) • ±q_max'
        : 'θ₁ • θ₂ • θ₃ • ±q_max'
      : sim.presetKey === 'planar-2r'
      ? 'θ₁ • θ₂(Down) • θ₂(Up) • ±q_max'
      : 'θ₁ • θ₂ • ±q_max';
    const estW = leg.length * (compact ? 5.6 : 6.1) + 12;
    drawCompactBadge(ctx, Math.max(map.plotLeft + 4, map.plotRight - estW - 4), map.plotTop + 4, leg, COLORS.pillBorder, COLORS.slate, compact);

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // PANEL 3: Manipulability w(θ) & Velocity Norm ‖q̇‖ (Naive J⁺ vs. DLS / QP-IK)
  // -------------------------------------------------------------------------
  _drawPanel3ManipulabilityAndVel() {
    const ctx = this._ctxs[2];
    const sz = this._sizes[2];
    if (!ctx || !sz || sz.w <= 0) return;
    const { w, h, dpr = 1 } = sz;
    const sim = this._sim;
    const k = clamp(this.cursorIdx, 0, sim.N - 1);
    const compact = w < 440;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    // Normalize both curves cleanly onto [0, 1] display axis with left ticks showing velocity norm
    const velMax = sim.velYMax;
    const wMax = sim.wYMax;
    const map = makePlotMapper(w, h, 0, sim.T, 0, velMax);

    drawGrid(
      ctx,
      map,
      [0, 1.5, 3.0, 4.5, 6.0],
      [0, velMax * 0.5, velMax],
      (v) => `${fmtPlain(v, 1)}s`,
      (v) => `${fmtPlain(v, 0)}`
    );

    // Highlight exact singularity regions where w(θ) < wCrit with translucent Coral vertical bands
    ctx.save();
    ctx.fillStyle = 'rgba(251, 113, 133, 0.13)';
    let inSing = false;
    let singStart = 0;
    for (let i = 0; i < sim.N; i++) {
      const sNow = sim.w[i] < sim.wCrit;
      if (sNow && !inSing) {
        inSing = true;
        singStart = map.xToPx(sim.t[i]);
      } else if ((!sNow || i === sim.N - 1) && inSing) {
        inSing = false;
        const singEnd = map.xToPx(sim.t[i]);
        ctx.fillRect(singStart, map.plotTop, Math.max(3, singEnd - singStart), map.plotH);
      }
    }
    ctx.restore();

    // Manipulability w(θ) scaled to plot height (Cyan area + glowing trace)
    const wToY = (wVal) => map.yToPx((wVal / wMax) * velMax * 0.85);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(map.xToPx(sim.t[0]), map.plotBottom);
    for (let i = 0; i < sim.N; i++) {
      ctx.lineTo(map.xToPx(sim.t[i]), wToY(sim.w[i]));
    }
    ctx.lineTo(map.xToPx(sim.t[sim.N - 1]), map.plotBottom);
    ctx.closePath();
    ctx.fillStyle = 'rgba(34, 211, 238, 0.09)';
    ctx.fill();

    ctx.strokeStyle = COLORS.cyan;
    ctx.shadowColor = COLORS.cyanGlow;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    for (let i = 0; i < sim.N; i++) {
      const px = map.xToPx(sim.t[i]);
      const py = wToY(sim.w[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    // Naive J^+ velocity norm (dashed Coral — visibly spikes off top at singularity!)
    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    ctx.strokeStyle = COLORS.coral;
    ctx.lineWidth = 1.7;
    ctx.setLineDash([4.5, 3]);
    ctx.beginPath();
    for (let i = 0; i < sim.N; i++) {
      const px = map.xToPx(sim.t[i]);
      const py = map.yToPx(Math.min(velMax * 1.15, sim.dqNaive[i]));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Regularized DLS / QP-IK velocity norm (solid Emerald — smooth and bounded!)
    ctx.strokeStyle = COLORS.emerald;
    ctx.shadowColor = COLORS.emeraldGlow;
    ctx.shadowBlur = 7;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    for (let i = 0; i < sim.N; i++) {
      const px = map.xToPx(sim.t[i]);
      const py = map.yToPx(Math.min(velMax * 0.98, sim.dqSafe[i]));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Cursor + live dots
    drawCursorLine(ctx, map, sim.t[k], this._pulsePhase);
    const cx = map.xToPx(sim.t[k]);
    drawGlowingDot(ctx, cx, wToY(sim.w[k]), 3.8, COLORS.cyan, COLORS.cyanGlow, 0);
    drawGlowingDot(
      ctx,
      cx,
      map.yToPx(Math.min(velMax * 0.97, sim.dqSafe[k])),
      4.0,
      COLORS.emerald,
      COLORS.emeraldGlow,
      this._pulsePhase
    );
    if (sim.dqNaive[k] <= velMax) {
      drawGlowingDot(ctx, cx, map.yToPx(sim.dqNaive[k]), 3.2, COLORS.coral, COLORS.coralGlow, 0);
    }

    // Singularity callout annotation when w dips near 0
    if (sim.w[sim.singularityIdx] < sim.wCrit) {
      const sx = map.xToPx(sim.t[sim.singularityIdx]);
      drawCompactBadge(
        ctx,
        clamp(sx - 44, map.plotLeft + 4, map.plotRight - 102),
        map.plotTop + 4,
        'w→0 • J⁺ spike!',
        COLORS.coral,
        '#FECDD3',
        true
      );
    }

    const rightLbl = sim.presetKey === 'qp-ik-3r' ? 'w(θ) • J⁺ vs QP-IK' : 'w(θ) • J⁺ vs DLS';
    const estW = rightLbl.length * (compact ? 5.8 : 6.4) + 14;
    drawCompactBadge(ctx, Math.max(map.plotLeft + 4, map.plotRight - estW - 4), map.plotTop + 4, rightLbl, COLORS.emerald, COLORS.emerald, compact);

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
    this._canvases = [];
    this._ctxs = [];
    this._panelMetaEls = [];
    this._presetButtons.clear();
    this._telemetryEls = {};
    this._timeSliderEl = null;
    this._timeValEl = null;
    this._playBtnEl = null;
    this._paramLabelEl = null;
    this._paramSliderEl = null;
    this._paramValEl = null;
    this._root = null;
  }
}

// ===========================================================================
// PART 2: KinematicsVisualQuizEngine (6 High-DPI Visual Intuition Scenarios)
// ===========================================================================
const KIN_QUIZ_CHALLENGES = [
  {
    id: 'kin-quiz-1',
    badge: 'DH Frames',
    title: 'Standard DH vs. Modified DH (Craig)',
    headerMath: 'Frame Attachment: Distal {i} vs. Proximal {i}',
    headerMech: 'CAD Link Frame Placement: Distal vs. Proximal Joint',
    formulaTex: '^{i-1}T_i = \\operatorname{Rot}_x(\\alpha_{i-1})\\,\\operatorname{Trans}_x(a_{i-1})\\,\\operatorname{Rot}_z(\\theta_i)\\,\\operatorname{Trans}_z(d_i)',
    promptMath:
      'Compare the two conventions above. In **Modified DH (Craig)** (right), frame $\\{i\\}$ sits at **proximal** joint $i$ instead of distal joint $i+1$. Which transform order maps frame $\\{i-1\\}$ to $\\{i\\}$?',
    promptMech:
      'Your URDF/Craig kinematics table attaches link frame $\\{i\\}$ directly to the **proximal** motor axis $i$ (right diagram). Which ordered chain of 4 elementary transforms builds $^{i-1}T_i$?',
    proofMath:
      'In **Modified DH (Craig)**, you first walk across link $i-1$ using twist $\\alpha_{i-1}$ and length $a_{i-1}$ along $x_{i-1}$, then actuate joint $i$ via $\\theta_i$ and $d_i$ along $z_i$: $\\operatorname{Rot}_x(\\alpha_{i-1})\\operatorname{Trans}_x(a_{i-1})\\operatorname{Rot}_z(\\theta_i)\\operatorname{Trans}_z(d_i)$.',
    proofMech:
      'Attaching frame $\\{i\\}$ to proximal motor $i$ makes joint angle $\\theta_i$ the final rotation around local $z_i$, matching how URDF/Craig link chains and branching tree manipulators are parameterized.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        textMath: '$\\operatorname{Rot}_x(\\alpha_{i-1})\\,\\operatorname{Trans}_x(a_{i-1})\\,\\operatorname{Rot}_z(\\theta_i)\\,\\operatorname{Trans}_z(d_i)$',
        textMech: '$\\operatorname{Rot}_x(\\alpha_{i-1})\\,\\operatorname{Trans}_x(a_{i-1})\\,\\operatorname{Rot}_z(\\theta_i)\\,\\operatorname{Trans}_z(d_i)$ (link $i-1$ first, then joint $i$)',
        hintMath: '',
        hintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        textMath: '$\\operatorname{Rot}_z(\\theta_i)\\,\\operatorname{Trans}_z(d_i)\\,\\operatorname{Trans}_x(a_i)\\,\\operatorname{Rot}_x(\\alpha_i)$',
        textMech: '$\\operatorname{Rot}_z(\\theta_i)\\,\\operatorname{Trans}_z(d_i)\\,\\operatorname{Trans}_x(a_i)\\,\\operatorname{Rot}_x(\\alpha_i)$ (joint $i$ first, then distal link)',
        hintMath: 'That is **Standard DH** (left diagram), where frame $\\{i\\}$ lives at the distal joint $i+1$. Look at which parameters carry index $i-1$ in Craig’s diagram.',
        hintMech: 'That order places frame $\\{i\\}$ at the distal end of link $i$ (Standard DH). Craig’s Modified DH steps across link $i-1$ first.',
      },
      {
        letter: 'C',
        isCorrect: false,
        textMath: '$\\operatorname{Trans}_z(d_i)\\,\\operatorname{Trans}_x(a_{i-1})\\,\\operatorname{Rot}_x(\\alpha_{i-1})\\,\\operatorname{Rot}_z(\\theta_i)$',
        textMech: 'All translations ($d_i, a_{i-1}$) before all rotations ($\\alpha_{i-1}, \\theta_i$)',
        hintMath: 'Rotations and translations around different axes do **not** commute! Translating along $z$ before twisting by $\\alpha_{i-1}$ moves along $z_{i-1}$ instead of $z_i$.',
        hintMech: 'Translations do not commute with link twist $\\alpha_{i-1}$—$d_i$ must slide along the *new* joint axis $z_i$, after $\\operatorname{Rot}_x(\\alpha_{i-1})$.',
      },
      {
        letter: 'D',
        isCorrect: false,
        textMath: '$\\operatorname{Rot}_z(\\theta_{i-1})\\,\\operatorname{Rot}_x(\\alpha_i)\\,\\operatorname{Trans}_x(a_i)\\,\\operatorname{Trans}_z(d_{i-1})$',
        textMech: 'Rotate joint $i-1$ first, then twist by $\\alpha_i$ and translate $a_i$',
        hintMath: 'Joint $i-1$ was already applied when moving into frame $\\{i-1\\}$. Moving to $\\{i\\}$ requires link geometry $(\\alpha_{i-1}, a_{i-1})$ followed by joint $i$ variables $(\\theta_i, d_i)$.',
        hintMech: 'Motor $i-1$ is already accounted for in frame $\\{i-1\\}$; stepping to frame $\\{i\\}$ applies link $i-1$ geometry then motor $i$.',
      },
    ],
  },
  {
    id: 'kin-quiz-2',
    badge: 'PoE vs. DH',
    title: 'Nearly Parallel Axes & Screw Continuity',
    headerMath: '0.2° Axis Misalignment: DH Common Normal vs. PoE Screws',
    headerMech: 'Calibration Robustness: 0.2° Machining Tolerance',
    formulaTex: 'T(\\theta) = e^{[\\mathcal{S}_1]\\theta_1}\\,e^{[\\mathcal{S}_2]\\theta_2}\\,M, \\quad \\mathcal{S}_i = (\\omega_i, v_i)',
    promptMath:
      'Two nominally parallel revolute axes are tilted by just $0.2^\\circ$ due to machining tolerance. Why does **Product of Exponentials (PoE)** beat DH here?',
    promptMech:
      'On a calibrated factory robot, a $0.2^\\circ$ bearing misalignment between two parallel shoulder/elbow axes breaks DH calibration. Why does **PoE** remain numerically smooth?',
    proofMath:
      'In DH, the common normal between two axes tilted by $\\varepsilon = 0.2^\\circ$ jumps by $\\Delta z \\approx a / \\sin\\varepsilon \\approx 286\\,a$ meters away—a violent singularity in the parameter table! In PoE, $\\mathcal{S}_i = (\\omega_i, -\\omega_i \\times q_i)$ varies smoothly with $\\varepsilon$ in a single fixed base frame.',
    proofMech:
      'Kinematic calibration uses gradient descent on parameters. DH’s $d_i$ jumps by hundreds of meters for a $0.2^\\circ$ tilt, wrecking least-squares convergence; PoE screw axes $(\\omega_i, v_i)$ stay bounded and differentiable everywhere.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        textMath: 'PoE screw axes $(\\omega_i, v_i)$ vary smoothly with tiny tilts, whereas DH’s common normal jumps meters away toward infinity',
        textMech: 'PoE screws $(\\omega_i, v_i)$ stay smooth and well-conditioned, while DH’s common-normal origin jumps hundreds of meters',
        hintMath: '',
        hintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        textMath: 'PoE uses fewer total numbers than DH by ignoring link twist angles altogether',
        textMech: 'PoE drops 3D twist angles completely so tolerances cannot affect the arm',
        hintMath: 'PoE actually uses 6-vectors $\\mathcal{S}_i \\in \\mathbb{R}^6$ per joint (more numbers than 4 DH scalars), precisely so it never suffers a coordinate-chart singularity!',
        hintMech: 'PoE captures full 3D twists via unit axis $\\omega_i$ and moment $v_i$; its win is **smoothness**, not ignoring twist.',
      },
      {
        letter: 'C',
        isCorrect: false,
        textMath: 'DH cannot represent revolute joints unless consecutive axes intersect at $90^\\circ$',
        textMech: 'DH only works for orthogonal $90^\\circ$ industrial joints',
        hintMath: 'DH can represent arbitrary skew axes—the problem is *discontinuity* when two skew axes become nearly parallel ($\\alpha \\to 0$).',
        hintMech: 'DH represents any skew angle mathematically, but its common-normal origin becomes wildly ill-conditioned as axes approach parallel.',
      },
      {
        letter: 'D',
        isCorrect: false,
        textMath: 'PoE eliminates the need to measure the home pose $M$ of the end-effector',
        textMech: 'PoE removes the tool-flange home transform $M$ from forward kinematics',
        hintMath: 'Look at the formula $T(\\theta) = e^{[\\mathcal{S}_1]\\theta_1} e^{[\\mathcal{S}_2]\\theta_2} M$: you still define a single home pose $M$ at $\\theta=0$, just no intermediate link frames!',
        hintMech: 'You still specify the zero-pose flange transform $M$, which is easy to read straight from CAD without inventing intermediate DH frames.',
      },
    ],
  },
  {
    id: 'kin-quiz-3',
    badge: 'Geometric IK',
    title: 'IK Multiplicity & Workspace Annulus',
    headerMath: '2R Annulus ($L_1=3,\\; L_2=1$): Interior vs. Inner Dead-Zone',
    headerMech: 'Reachable Envelope ($r \\in [2, 4]$) & Branch Selection',
    formulaTex: 'r_{\\min} = |L_1 - L_2| = 2, \\quad r_{\\max} = L_1 + L_2 = 4',
    promptMath:
      'For the 2R arm ($L_1=3, L_2=1$) shown above, how many **real IK solutions** exist at interior annulus target $P_{\\text{ann}}$ ($r=3.1$) versus inner dead-zone target $P_{\\text{in}}$ ($r=1.2$)?',
    promptMech:
      'Your pick-and-place arm has $L_1=3, L_2=1$. How many valid joint configurations reach $P_{\\text{ann}}$ ($r=3.1$) vs. $P_{\\text{in}}$ ($r=1.2$ inside the central hole)?',
    proofMath:
      'By the Law of Cosines, $\\cos\\theta_2 = D = \\frac{r^2 - L_1^2 - L_2^2}{2 L_1 L_2}$. Strictly inside the annulus ($2 < r < 4$), $|D| < 1$ yields **2 distinct solutions**: $\\theta_2 = +\\arccos D$ (elbow-down) and $\\theta_2 = -\\arccos D$ (elbow-up). Inside the dead-zone ($r < 2$), $D < -1$, giving **0 real solutions**.',
    proofMech:
      'Any interior target in the annulus has 2 branches (elbow-down / elbow-up)—your planner picks the branch closest to current encoder state or farthest from fixtures. Inside $r < |L_1-L_2|$, the links cannot fold tight enough to reach.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        textMath: '**2 solutions** at $P_{\\text{ann}}$ (elbow-up & elbow-down) and **0 real solutions** at $P_{\\text{in}}$',
        textMech: '**2 configurations** at $P_{\\text{ann}}$ (elbow-up & elbow-down) and **0 reachable solutions** at $P_{\\text{in}}$',
        hintMath: '',
        hintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        textMath: '**1 unique solution** at $P_{\\text{ann}}$ and **1 folded solution** at $P_{\\text{in}}$',
        textMech: '**1 unique pose** at $P_{\\text{ann}}$ and **1 folded pose** at $P_{\\text{in}}$',
        hintMath: 'Look closely at the Cyan and dashed Violet arms both touching $P_{\\text{ann}}$, and notice the minimum folded reach is $|3 - 1| = 2 > 1.2$.',
        hintMech: 'Because $L_1 \\ne L_2$, folding $\\theta_2 = 180^\\circ$ still leaves a dead-zone hole of radius $|3-1| = 2$, and interior points have two mirror branches.',
      },
      {
        letter: 'C',
        isCorrect: false,
        textMath: '**Infinitely many solutions** at $P_{\\text{ann}}$ because both $\\theta_1$ and $\\theta_2$ can vary',
        textMech: '**Continuous nullspace** at $P_{\\text{ann}}$ because the arm has 2 motors',
        hintMath: 'A 2R arm has 2 DOF solving 2 planar coordinates $(x,y)$—it is **non-redundant** ($n = m = 2$), so interior targets have isolated discrete solutions, not a continuum.',
        hintMech: 'Two motors tracking 2 coordinates $(x,y)$ leave zero nullspace; infinite solutions require $n > m$ (like a 3R planar arm) or a special $L_1=L_2$ origin singularity.',
      },
      {
        letter: 'D',
        isCorrect: false,
        textMath: '**2 solutions** at both $P_{\\text{ann}}$ and $P_{\\text{in}}$ because $r < L_1 + L_2$ for both',
        textMech: '**2 configurations** at both targets since both lie inside the outer circle $r = 4$',
        hintMath: 'Being inside $r_{\\max} = L_1 + L_2$ is necessary but not sufficient! When $L_1 \\ne L_2$, you must also satisfy $r \\ge |L_1 - L_2|$.',
        hintMech: 'Check the Coral inner dead-zone circle: with $L_1=3, L_2=1$, the arm can never pull closer than $3 - 1 = 2$ from the base.',
      },
    ],
  },
  {
    id: 'kin-quiz-4',
    badge: 'Singularities',
    title: 'Reading a Collapsed Manipulability Ellipse',
    headerMath: 'Fully Extended 2R ($\\theta_2 = 0^\\circ$): Ellipse Collapses to 1D',
    headerMech: 'Outstretched Arm Singularity: Lost Velocity vs. Rigid Force Axis',
    formulaTex: 'w(\\theta) = \\sqrt{\\det(J J^T)} = \\sigma_1 \\sigma_2 \\to 0',
    promptMath:
      'At $\\theta_2 = 0^\\circ$, the 2R arm is fully outstretched along $+x$ and its manipulability ellipse collapses into a **vertical 1D line segment**. Which Cartesian velocity direction is **lost**?',
    promptMech:
      'With the elbow locked straight ($\\theta_2 = 0^\\circ$), the velocity ellipse flattens into a vertical bar. Which instantaneous end-effector motion can the motors **no longer generate**?',
    proofMath:
      'When $\\theta_2 = 0^\\circ$, both Jacobian columns point purely along $\\pm\\hat{y}$ (tangential). Thus $\\sigma_{\\min} = 0$ along the **radial axis** ($\\pm\\hat{x}$): no finite joint velocities can pull or push radially! By duality ($\\tau = J^T F$), the arm simultaneously gains infinite static stiffness along that exact radial line.',
    proofMech:
      'Radial velocity ($\\pm x$) vanishes because moving either joint swings the tip vertically ($\\pm y$). Conversely, a purely radial push goes straight through the joint bearings ($\\tau = J^T F = 0$), so structure—not servo torque—bears the load.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        textMath: '**Radial pull/push along the arm ($\\pm x$)** — both joint velocities only generate tangential ($\\pm y$) tip motion',
        textMech: '**Radial in/out velocity ($\\pm x$)** — the collapsed ellipse has zero width along the arm axis',
        hintMath: '',
        hintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        textMath: '**Tangential swing perpendicular to the arm ($\\pm y$)** — the arm can only extend along $+x$',
        textMech: '**Vertical tangential motion ($\\pm y$)** — the vertical segment marks the blocked axis',
        hintMath: 'The manipulability ellipse shows the set of **achievable** unit-norm velocities $\\{\\dot{x} = J\\dot{q} : \\|\\dot{q}\\| \\le 1\\}$. The surviving vertical line is the *only* direction you can still move!',
        hintMech: 'Remember what the ellipse represents: long axis = fast, easy velocity; zero-width axis = lost velocity. Here the vertical axis is long, and the radial width is zero.',
      },
      {
        letter: 'C',
        isCorrect: false,
        textMath: '**All Cartesian directions** — both $\\sigma_1$ and $\\sigma_2$ drop to zero simultaneously',
        textMech: 'Complete motor lockup — neither $x$ nor $y$ velocity is possible',
        hintMath: 'Look at the vertical glowing bar: $\\sigma_1 > 0$ (shoulder + elbow can still swing the tip vertically!), while only $\\sigma_2 = 0$ collapses.',
        hintMech: 'Only rank drops from 2 to 1 ($\\sigma_2 = 0$, $\\sigma_1 > 0$). Swinging the shoulder still moves the tool vertically.',
      },
      {
        letter: 'D',
        isCorrect: false,
        textMath: '**Radial force support** — the arm cannot resist a push straight back into its base',
        textMech: 'Radial structural load capacity drops to zero when straight',
        hintMath: 'Velocity and force ellipses are **reciprocal** ($\\tau = J^T F$). Where velocity collapses ($\\sigma_2 \\to 0$), static force capacity blows up—just like locking your knee straight to stand effortlessly!',
        hintMech: 'Think of a straight column or locked human knee: you lose radial *velocity*, but static radial *force* passes directly into the bearing with zero motor torque!',
      },
    ],
  },
  {
    id: 'kin-quiz-5',
    badge: 'DLS Control',
    title: 'Naive J⁺ Explosion vs. Damped Least Squares',
    headerMath: 'Singular Value Inversion: $1/\\sigma_i$ vs. $\\sigma_i/(\\sigma_i^2 + \\lambda^2)$',
    headerMech: 'Actuator Protection Near Singularity: J⁺ Spike vs. DLS Floor',
    formulaTex: '\\dot{q}_{\\text{DLS}} = J^T(J J^T + \\lambda^2 I)^{-1}\\dot{x}_d',
    promptMath:
      'Near a singularity ($\\sigma_{\\min} \\to 0$), naive pseudoinverse $J^+$ sends $\\|\\dot{q}\\|$ to infinity. How does **Damped Least Squares (DLS)** prevent runaway?',
    promptMech:
      'Your Cartesian velocity controller trips over-speed faults near the workspace edge under $J^+$. How does adding $\\lambda^2 I$ inside **DLS** keep servo commands bounded?',
    proofMath:
      'SVD reveals that $J^+$ multiplies each mode by $1/\\sigma_i \\to \\infty$, whereas DLS replaces $1/\\sigma_i$ with $\\frac{\\sigma_i}{\\sigma_i^2 + \\lambda^2}$. This filter peaks smoothly at $\\frac{1}{2\\lambda}$ (when $\\sigma_i = \\lambda$) and drops cleanly to $0$ as $\\sigma_i \\to 0$, trading tiny tracking error along the singular direction for guaranteed finite joint velocities.',
    proofMech:
      'DLS solves $\\min_{\\dot{q}} \\|J\\dot{q} - \\dot{x}_d\\|^2 + \\lambda^2 \\|\\dot{q}\\|^2$. Near $\\sigma_{\\min} \\to 0$, the $\\lambda^2$ penalty gracefully sacrifices impossible radial velocity so servo speed and amplifier current stay safely inside limits.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        textMath: 'It replaces $1/\\sigma_i$ with $\\frac{\\sigma_i}{\\sigma_i^2 + \\lambda^2}$ (bounded by $\\frac{1}{2\\lambda}$ and $\\to 0$ at $\\sigma_i=0$), trading tiny tracking error for bounded $\\dot{q}$',
        textMech: 'It filters singular gains via $\\frac{\\sigma_i}{\\sigma_i^2 + \\lambda^2} \\le \\frac{1}{2\\lambda}$, trading small tracking error for smooth, finite motor speeds',
        hintMath: '',
        hintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        textMath: 'It boosts $\\sigma_{\\min}$ physically so the arm achieves **zero** tracking error even outside its workspace',
        textMech: 'It eliminates tracking error completely while keeping joint velocities small',
        hintMath: 'No math trick can move a robot outside its physical reach! DLS intentionally accepts a small tracking error $\\|J\\dot{q}-\\dot{x}_d\\|$ when $\\sigma_i \\lesssim \\lambda$.',
        hintMech: 'There is always a trade-off: larger $\\lambda$ gives smoother, safer motor speeds at the cost of slight Cartesian tracking lag near the singularity.',
      },
      {
        letter: 'C',
        isCorrect: false,
        textMath: 'It freezes every joint to $\\dot{q} = 0$ whenever $\\det(JJ^T)$ drops below $1$',
        textMech: 'It triggers an emergency E-stop across all joints as soon as $\\sigma_{\\min}$ shrinks',
        hintMath: 'Look at the Emerald DLS curve: well-conditioned directions ($\\sigma_1 \\gg \\lambda$) still invert cleanly as $\\frac{\\sigma_1}{\\sigma_1^2 + \\lambda^2} \\approx \\frac{1}{\\sigma_1}$!',
        hintMech: 'DLS only damps the *collapsed* singular direction while keeping tangential motion responsive—far smoother than an abrupt E-stop.',
      },
      {
        letter: 'D',
        isCorrect: false,
        textMath: 'It adds $\\lambda^2$ to the numerator so $\\dot{q}$ stays strictly proportional to $1/\\sigma_i$',
        textMech: 'It scales up the gain near $\\sigma_{\\min} \\to 0$ to overpower friction',
        hintMath: 'Check the denominator in $J^T(JJ^T + \\lambda^2 I)^{-1}$: $\\lambda^2$ sits in the *denominator* $\\sigma_i^2 + \\lambda^2$, preventing division by zero.',
        hintMech: 'Adding gain at $\\sigma_{\\min} \\to 0$ would worsen the explosion! $\\lambda^2$ regularizes the denominator $\\sigma_i^2 + \\lambda^2$.',
      },
    ],
  },
  {
    id: 'kin-quiz-6',
    badge: 'QP-IK & Nullspace',
    title: 'Nullspace Self-Motion & Modern QP-IK',
    headerMath: 'Redundant 3R/7-DOF Arm: $\\ker(J)$ Dodge + Box Constraints',
    headerMech: 'Production Solvers (Pink / Mink): Nullspace + Hard Servo Limits',
    formulaTex: '\\dot{q} = J^+\\dot{x}_d + (I - J^+ J)\\dot{q}_0, \\quad J(I - J^+ J) = 0',
    promptMath:
      'Why does adding $(I - J^+ J)\\dot{q}_0$ swing the redundant arm’s elbow clear of the Coral obstacle with **zero** instantaneous end-effector motion, and why do modern solvers (`Pink`/`Mink`) upgrade it to a **QP**?',
    promptMech:
      'On a 7-DOF cobot holding a tool steady on a seam while dodging a fixture, why is $(I - J^+ J)\\dot{q}_0$ invisible to the tool tip—and why do `Pink`/`Mink` formulate IK as a **Quadratic Program**?',
    proofMath:
      'Multiplying on the left by $J$ gives $J(I - J^+ J)\\dot{q}_0 = (J - J J^+ J)\\dot{q}_0 = (J - J)\\dot{q}_0 = 0$, so the projected velocity lies strictly in $\\ker(J)$. However, classic nullspace projection cannot guarantee **hard inequalities** ($q_{\\min} \\le q \\le q_{\\max}$, $|\\dot{q}| \\le \\dot{q}_{\\max}$, collision barriers)—whereas QP-IK (`Pink`/`Mink`) enforces them directly inside one convex solve!',
    proofMech:
      'Because $J(I - J^+J) = 0$, elbow self-motion never disturbs the tool pose. Upgrading to QP-IK (`Pink`/`Mink`) lets you stack weighted tasks alongside *guaranteed* hard joint-stop, velocity, and collision inequality constraints at 1 kHz.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        textMath: '$J(I - J^+ J) = J - J = 0$ projects $\\dot{q}_0$ into $\\ker(J)$ (zero EE velocity), and QP-IK adds **hard inequality limits** directly',
        textMech: '$J(I - J^+ J) = 0$ keeps tool velocity zero, and QP-IK enforces **hard joint, speed & obstacle inequalities** directly',
        hintMath: '',
        hintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        textMath: '$(I - J^+ J)$ scales $\\dot{q}_0$ down by $10^{-3}$ so end-effector error is too small to notice',
        textMech: 'The projector simply shrinks $\\dot{q}_0$ to near zero so the tool barely drifts',
        hintMath: 'It is **exact** orthogonality, not a small gain! Even for large $\\dot{q}_0$, $J(I - J^+ J)\\dot{q}_0 = 0$ identically to first order.',
        hintMech: 'The elbow can swing briskly at full speed while the tool remains mathematically stationary because $(I-J^+J)$ projects onto $\\ker(J)$.',
      },
      {
        letter: 'C',
        isCorrect: false,
        textMath: 'QP-IK is required because $J(I - J^+ J) = 0$ only works for non-redundant 2R arms',
        textMech: 'Nullspace projection only exists when DOF equals task dimension ($n = m$)',
        hintMath: 'When $n = m$ and $J$ is invertible, $J^+ = J^{-1}$, so $I - J^{-1}J = 0$—the nullspace is trivial! Redundancy ($n > m$) is *required* for non-zero nullspace motion.',
        hintMech: 'A 2R planar arm has zero nullspace ($I - J^{-1}J = 0$); you need extra DOF ($n > m$, like 3R planar or 7-DOF cobot) to get self-motion.',
      },
      {
        letter: 'D',
        isCorrect: false,
        textMath: 'QP-IK replaces the Jacobian $J$ with random sampling so it never uses derivatives',
        textMech: 'Modern solvers like Pink/Mink abandon Jacobians in favor of brute-force grid search',
        hintMath: 'QP-IK is still Jacobian-based differential IK—it minimizes $\\|J\\dot{q} - \\dot{x}_d\\|_W^2$ subject to linear inequalities $G\\dot{q} \\le h$ using fast convex QP solvers.',
        hintMech: '`Pink` and `Mink` build fast 1 kHz convex Quadratic Programs directly from task Jacobians $J$ and linearized joint/collision bounds.',
      },
    ],
  },
];

export class KinematicsVisualQuizEngine {
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

    this._challenges = KIN_QUIZ_CHALLENGES;
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
    this._canvas = null;
    this._ctx = null;
    this._canvasWrap = null;
    this._canvasSize = { w: 0, h: 162, dpr: 1 };
    this._optionButtons = [];
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
    return KIN_QUIZ_CHALLENGES;
  }

  getChallenges() {
    return KIN_QUIZ_CHALLENGES;
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
        this._resizeCanvas();
        this._drawCanvas();
      });
      this._resizeObserver.observe(this._root);
    }

    this._startAnimationLoop();
    return this;
  }

  toggleMechatronicsLens(bool) {
    const next = typeof bool === 'boolean' ? bool : !this.mechatronicsLens;
    if (next === this.mechatronicsLens) return;
    this.mechatronicsLens = next;
    if (this._container && !this._disposed) {
      this._renderChallengeView();
    }
  }

  setMechatronicsLens(bool) {
    this.toggleMechatronicsLens(Boolean(bool));
  }

  setLens(lens) {
    this.toggleMechatronicsLens(lens === 'mechatronics');
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
    const mech = this.mechatronicsLens;
    const { signal } = this._abortController;

    if (!this._root) {
      this._root = document.createElement('div');
      this._root.className =
        'w-full max-w-full rounded-2xl border border-slate-800/90 bg-[#0B0D12]/95 shadow-2xl overflow-hidden backdrop-blur-md';
      this._container.innerHTML = '';
      this._container.appendChild(this._root);
    }

    this._root.innerHTML = '';
    this._optionButtons = [];

    // --- 1. Compact Header & 1–6 Stepper Pills ---
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
        'el-kin-pill w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[11px] sm:text-xs font-mono font-semibold flex items-center justify-center border cursor-pointer ' +
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

    // --- 2. Prompt + Custom Live High-DPI Diagram Canvas ---
    const body = document.createElement('div');
    body.className = 'p-2.5 sm:p-4 flex flex-col gap-2.5 sm:gap-3.5';

    const promptText = document.createElement('p');
    promptText.className = 'text-xs sm:text-[14.5px] leading-snug sm:leading-relaxed text-slate-200';
    promptText.innerHTML = formatInlineMath(mech ? ch.promptMech : ch.promptMath);
    body.appendChild(promptText);

    const frame = document.createElement('div');
    frame.className = 'relative rounded-xl border border-slate-800/90 bg-[#0B0D12] overflow-hidden';

    const topStrip = document.createElement('div');
    topStrip.className =
      'px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#0E121B]/95 border-b border-slate-800/60 flex items-center justify-between gap-2 overflow-hidden';
    topStrip.innerHTML = `
      <span class="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-cyan-200 truncate">
        <span class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE] shrink-0"></span>
        ${escapeHtml(mech ? ch.headerMech : ch.headerMath)}
      </span>
      <span class="hidden sm:inline text-[11px] text-slate-200 shrink-0">${formatKatex(ch.formulaTex, false)}</span>
    `;
    frame.appendChild(topStrip);

    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'relative w-full max-w-full h-[156px] sm:h-[204px]';

    const canvas = document.createElement('canvas');
    canvas.className = 'el-kin-canvas h-full';
    canvasWrap.appendChild(canvas);
    frame.appendChild(canvasWrap);

    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._canvasWrap = canvasWrap;

    body.appendChild(frame);

    // --- 3. 4 Answer Buttons (A / B / C / D) ---
    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2.5';

    ch.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'el-kinq-btn w-full text-left rounded-xl border border-slate-800/90 bg-[#0F131C]/85 px-2.5 py-2 sm:px-3 sm:py-2.5 flex items-start gap-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-400/50';

      if (solved && opt.isCorrect) {
        btn.dataset.state = 'correct';
        btn.dataset.locked = 'true';
      } else if (solved) {
        btn.dataset.locked = 'true';
        btn.className += ' opacity-55';
      } else if (this._wrongSelection && this._wrongSelection.letter === opt.letter) {
        btn.dataset.state = 'wrong';
      }

      const badgeColor =
        solved && opt.isCorrect
          ? 'bg-emerald-400/20 border-emerald-400/70 text-emerald-200'
          : this._wrongSelection?.letter === opt.letter
          ? 'bg-rose-400/20 border-rose-400/70 text-rose-200'
          : 'bg-slate-800/90 border-slate-700 text-slate-200';

      const optText = mech ? opt.textMech : opt.textMath;
      btn.innerHTML = `
        <span class="mt-0.5 shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-md text-[11px] font-mono font-bold border flex items-center justify-center ${badgeColor}">
          ${solved && opt.isCorrect ? '✓' : opt.letter}
        </span>
        <span class="text-xs sm:text-[13px] leading-snug text-slate-200 min-w-0 break-words">
          ${formatInlineMath(optText)}
        </span>
      `;

      btn.addEventListener('click', () => this._handleOptionClick(opt), { signal });
      optionsGrid.appendChild(btn);
      this._optionButtons.push({ btn, opt });
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

    this._resizeCanvas();
    this._drawCanvas();
  }

  _handleOptionClick(opt) {
    const ch = this._getCurrentChallenge();
    if (this._isCurrentSolved()) return;

    const isCorrect = Boolean(opt.isCorrect);
    recordQuizAttemptInStore(ch.id, isCorrect);

    if (isCorrect) {
      this._wrongSelection = null;
      this._solvedIds.add(ch.id);
      safeSound('playSuccess');

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
      const hint = this.mechatronicsLens ? opt.hintMech : opt.hintMath;
      this._wrongSelection = { letter: opt.letter, hint };

      for (const item of this._optionButtons) {
        if (item.opt.letter === opt.letter) {
          item.btn.dataset.state = 'wrong';
          item.btn.classList.remove('el-kin-shake');
          void item.btn.offsetWidth;
          item.btn.classList.add('el-kin-shake');
        } else {
          delete item.btn.dataset.state;
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
    const proofText = this.mechatronicsLens ? ch.proofMech : ch.proofMath;
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
        Kinematics Insight Unlocked
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
      'el-kin-pill px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-400/60 text-emerald-100 cursor-pointer whitespace-nowrap';

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
    box.className = 'rounded-xl border border-rose-400/40 bg-rose-500/10 p-2.5 sm:p-3 flex flex-col gap-1';
    box.innerHTML = `
      <div class="flex items-center gap-2 text-xs font-semibold text-rose-300">
        <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-400/20 border border-rose-400/60 text-[10px]">!</span>
        Not quite (Option ${escapeHtml(wrongSelection.letter)}) — Visual Hint
      </div>
      <p class="text-xs sm:text-[13px] leading-relaxed text-slate-200">
        ${formatInlineMath(wrongSelection.hint)}
      </p>
    `;
    slot.appendChild(box);
  }

  _resizeCanvas() {
    if (typeof window === 'undefined' || !this._canvas || !this._canvasWrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const rect = this._canvasWrap.getBoundingClientRect();
    const w = Math.max(120, Math.floor(rect.width));
    const h = Math.max(96, Math.floor(rect.height));
    if (this._canvas.width !== Math.round(w * dpr) || this._canvas.height !== Math.round(h * dpr)) {
      this._canvas.width = Math.round(w * dpr);
      this._canvas.height = Math.round(h * dpr);
    }
    this._canvasSize = { w, h, dpr };
  }

  _startAnimationLoop() {
    if (typeof requestAnimationFrame === 'undefined') return;
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    this._lastFrameTs = performance.now();

    const loop = (ts) => {
      if (this._disposed) return;
      const dt = Math.min(0.05, Math.max(0.001, (ts - this._lastFrameTs) / 1000));
      this._lastFrameTs = ts;
      this._pulsePhase = (this._pulsePhase + dt * 2.4) % TWO_PI;
      this._drawCanvas();
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  }

  _drawCanvas() {
    const ctx = this._ctx;
    const { w, h, dpr = 1 } = this._canvasSize;
    if (!ctx || w <= 0 || h <= 0) return;
    const ch = this._getCurrentChallenge();
    const compact = w < 440;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    switch (ch.id) {
      case 'kin-quiz-1':
        this._drawQuiz1DHComparison(ctx, w, h, compact);
        break;
      case 'kin-quiz-2':
        this._drawQuiz2PoeVsDhParallel(ctx, w, h, compact);
        break;
      case 'kin-quiz-3':
        this._drawQuiz3AnnulusMultiplicity(ctx, w, h, compact);
        break;
      case 'kin-quiz-4':
        this._drawQuiz4CollapsedEllipse(ctx, w, h, compact);
        break;
      case 'kin-quiz-5':
        this._drawQuiz5DlsFilter(ctx, w, h, compact);
        break;
      case 'kin-quiz-6':
        this._drawQuiz6NullspaceQpIk(ctx, w, h, compact);
        break;
      default:
        break;
    }
    ctx.restore();
  }

  // --- Quiz 1: Standard DH (distal {i}) vs. Modified DH / Craig (proximal {i}) ---
  _drawQuiz1DHComparison(ctx, w, h, compact) {
    const midX = w * 0.5;
    const cy = h * 0.56;

    // Split divider
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(midX, 8);
    ctx.lineTo(midX, h - 8);
    ctx.stroke();

    const drawLinkScene = (x0, spanW, isModified) => {
      const jA = { x: x0 + spanW * 0.22, y: cy + 8 };
      const jB = { x: x0 + spanW * 0.70, y: cy - 10 };

      // Header badge
      drawCompactBadge(
        ctx,
        x0 + 8,
        8,
        isModified ? 'MODIFIED DH (CRAIG)' : 'STANDARD DH',
        isModified ? COLORS.cyan : COLORS.slateMuted,
        isModified ? COLORS.cyan : COLORS.slate,
        compact
      );

      // Link bar between Joint i and Joint i+1 (Standard) or Link i-1 between Joint i-1 and Joint i (Modified)
      ctx.strokeStyle = isModified ? 'rgba(148, 163, 184, 0.75)' : COLORS.amber;
      ctx.lineWidth = compact ? 5 : 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(jA.x, jA.y);
      ctx.lineTo(jB.x, jB.y);
      ctx.stroke();

      // In Modified DH, draw Link i continuing distally from Joint i so {i} is clearly proximal on Link i
      if (isModified) {
        ctx.strokeStyle = COLORS.cyan;
        ctx.lineWidth = compact ? 5 : 6;
        ctx.beginPath();
        ctx.moveTo(jB.x, jB.y);
        ctx.lineTo(x0 + spanW * 0.94, cy - 16);
        ctx.stroke();
      }

      // Joint cylinders (z axes vertical)
      for (const [idx, j] of [jA, jB].entries()) {
        ctx.strokeStyle = COLORS.rgbZ;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(j.x, j.y - 32);
        ctx.lineTo(j.x, j.y + 24);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = COLORS.white;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(j.x, j.y, compact ? 5.5 : 6.5, 0, TWO_PI);
        ctx.fill();
        ctx.stroke();

        ctx.font = `600 ${compact ? 9 : 10}px ${FONT_MONO}`;
        ctx.fillStyle = COLORS.slate;
        ctx.textAlign = 'center';
        const jLbl = isModified ? (idx === 0 ? 'Joint i−1' : 'Joint i') : (idx === 0 ? 'Joint i' : 'Joint i+1');
        ctx.fillText(jLbl, j.x, j.y + 36);
      }

      // Highlight where frame {i} attaches (jB is Joint i proximal to Link i in Modified DH, or Joint i+1 distal on Link i in Standard DH)
      const pulseR = (compact ? 11 : 13) + 2 * Math.sin(this._pulsePhase);
      ctx.strokeStyle = isModified ? COLORS.emerald : COLORS.amber;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(jB.x, jB.y, pulseR, 0, TWO_PI);
      ctx.stroke();

      drawRgbFrame(ctx, jB.x, jB.y, 0.14, compact ? 16 : 20, '{i}');
      drawRgbFrame(ctx, jA.x, jA.y, 0.14, compact ? 13 : 16, '{i−1}');

      // Link parameter label
      const mx = 0.5 * (jA.x + jB.x);
      const my = 0.5 * (jA.y + jB.y) - 14;
      ctx.font = `700 ${compact ? 9 : 10.5}px ${FONT_MONO}`;
      ctx.fillStyle = isModified ? COLORS.cyan : COLORS.amberLight;
      ctx.textAlign = 'center';
      ctx.fillText(isModified ? 'a_{i−1}, α_{i−1} → θ_i, d_i' : 'θ_i, d_i → a_i, α_i', mx, my);

      // Sub-caption
      ctx.font = `500 ${compact ? 8.5 : 9.5}px ${FONT_SANS}`;
      ctx.fillStyle = isModified ? COLORS.emerald : COLORS.slate;
      ctx.fillText(
        isModified ? 'Frame {i} at proximal joint i' : 'Frame {i} at distal joint i+1',
        x0 + spanW * 0.5,
        h - 10
      );
    };

    drawLinkScene(0, midX, false);
    drawLinkScene(midX, w - midX, true);
  }

  // --- Quiz 2: PoE vs. DH on 0.2° Nearly Parallel Axes ---
  _drawQuiz2PoeVsDhParallel(ctx, w, h, compact) {
    const midX = w * 0.5;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(midX, 8);
    ctx.lineTo(midX, h - 8);
    ctx.stroke();

    // Left: DH Common Normal Flying Away
    drawCompactBadge(ctx, 8, 8, 'DH: 0.2° TILT', COLORS.coral, '#FECDD3', compact);
    const lx1 = midX * 0.34;
    const lx2 = midX * 0.68;
    const topY = 34;
    const botY = h - 22;
    const tiltDx = 5 + 2.5 * Math.sin(this._pulsePhase);

    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(lx1, botY);
    ctx.lineTo(lx1, topY);
    ctx.stroke();

    ctx.strokeStyle = COLORS.amber;
    ctx.beginPath();
    ctx.moveTo(lx2, botY);
    ctx.lineTo(lx2 + tiltDx, topY);
    ctx.stroke();

    // Common normal flying off-screen upward
    const jumpY = topY + 6 - 3 * Math.abs(Math.sin(this._pulsePhase));
    drawArrowHead(ctx, lx1, botY - 22, lx1, jumpY, COLORS.coral, 7, 2.0);
    ctx.strokeStyle = COLORS.coral;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(lx1, jumpY);
    ctx.lineTo(lx2 + tiltDx * 0.85, jumpY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = `700 ${compact ? 8.5 : 10}px ${FONT_MONO}`;
    ctx.fillStyle = COLORS.coral;
    ctx.textAlign = 'center';
    ctx.fillText('Common normal jumps 286m ↑', midX * 0.5, h - 9);
    ctx.fillStyle = COLORS.slate;
    ctx.fillText('z₁', lx1 - 11, botY - 8);
    ctx.fillText('z₂ (+0.2°)', lx2 + 22, botY - 8);

    // Right: PoE Smooth Screw Axes
    drawCompactBadge(ctx, midX + 8, 8, 'PoE: SMOOTH SCREWS', COLORS.emerald, COLORS.emerald, compact);
    const rx1 = midX + (w - midX) * 0.30;
    const rx2 = midX + (w - midX) * 0.68;
    const baseY = h * 0.62;

    drawRgbFrame(ctx, midX + 24, baseY + 18, 0, 14, '{s}');

    for (const [idx, rx] of [rx1, rx2].entries()) {
      const dx = idx === 1 ? tiltDx : 0;
      ctx.strokeStyle = idx === 0 ? COLORS.cyan : COLORS.emerald;
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(rx, botY - 4);
      ctx.lineTo(rx + dx, topY + 6);
      ctx.stroke();

      // Smooth screw rotation ring
      ctx.strokeStyle = COLORS.violet;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(rx + dx * 0.5, baseY - 12, 13, 5, 0, 0.2, 1.75 * Math.PI);
      ctx.stroke();

      ctx.font = `700 ${compact ? 9 : 10}px ${FONT_MONO}`;
      ctx.fillStyle = idx === 0 ? COLORS.cyan : COLORS.emerald;
      ctx.textAlign = 'center';
      ctx.fillText(idx === 0 ? 'S₁=(ω₁,v₁)' : 'S₂=(ω₂,v₂)', rx + 2, topY + 4);
    }

    ctx.font = `700 ${compact ? 8.5 : 10}px ${FONT_MONO}`;
    ctx.fillStyle = COLORS.emerald;
    ctx.textAlign = 'center';
    ctx.fillText('Zero frame jump • C∞ smooth', midX + (w - midX) * 0.5, h - 9);
  }

  // --- Quiz 3: 2R Workspace Annulus (L1=3, L2=1) & Dual IK Branches ---
  _drawQuiz3AnnulusMultiplicity(ctx, w, h, compact) {
    const L1 = 3.0;
    const L2 = 1.0;
    const wm = makeWorldMapper(0, 0, w, h, { xMin: -4.4, xMax: 4.8, yMin: -2.2, yMax: 4.3 }, compact ? 8 : 12);
    const orig = wm.toPx(0, 0);

    // Reachable Annulus (r in [2, 4])
    ctx.beginPath();
    ctx.arc(orig.x, orig.y, 4 * wm.scale, 0, TWO_PI);
    ctx.arc(orig.x, orig.y, 2 * wm.scale, 0, TWO_PI, true);
    ctx.fillStyle = 'rgba(34, 211, 238, 0.08)';
    ctx.fill('evenodd');

    // Outer boundary r=4
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
    ctx.lineWidth = 1.3;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(orig.x, orig.y, 4 * wm.scale, 0, TWO_PI);
    ctx.stroke();

    // Inner dead-zone r=2
    ctx.fillStyle = 'rgba(251, 113, 133, 0.12)';
    ctx.beginPath();
    ctx.arc(orig.x, orig.y, 2 * wm.scale, 0, TWO_PI);
    ctx.fill();
    ctx.strokeStyle = COLORS.coral;
    ctx.beginPath();
    ctx.arc(orig.x, orig.y, 2 * wm.scale, 0, TWO_PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // Interior target P_ann (r = 3.1)
    const pAnn = { x: 2.55, y: 1.76 };
    const solD = ik2R(pAnn.x, pAnn.y, L1, L2, +1);
    const solU = ik2R(pAnn.x, pAnn.y, L1, L2, -1);
    const fkD = fk2R(solD.q1, solD.q2, L1, L2);
    const fkU = fk2R(solU.q1, solU.q2, L1, L2);

    drawArticulatedArm(ctx, wm, fkU.joints, {
      linkColors: [COLORS.violet, COLORS.violet],
      dashed: true,
      alpha: 0.85,
      lineWidth: 2.8,
      jointRadius: 3.4,
    });
    drawArticulatedArm(ctx, wm, fkD.joints, {
      linkColors: [COLORS.cyan, COLORS.amber],
      lineWidth: 3.8,
      jointRadius: 4.0,
    });

    const annPx = wm.toPx(pAnn.x, pAnn.y);
    drawGlowingDot(ctx, annPx.x, annPx.y, 4.4, COLORS.emerald, COLORS.emeraldGlow, this._pulsePhase);
    ctx.font = `700 ${compact ? 9 : 10.5}px ${FONT_MONO}`;
    ctx.fillStyle = COLORS.emerald;
    ctx.textAlign = 'left';
    ctx.fillText('P_ann (r=3.1)', annPx.x + 8, annPx.y - 4);

    // Dead-zone target P_in (r = 1.2)
    const inPx = wm.toPx(-0.95, 0.72);
    ctx.strokeStyle = COLORS.coral;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(inPx.x - 5, inPx.y - 5);
    ctx.lineTo(inPx.x + 5, inPx.y + 5);
    ctx.moveTo(inPx.x + 5, inPx.y - 5);
    ctx.lineTo(inPx.x - 5, inPx.y + 5);
    ctx.stroke();

    ctx.fillStyle = COLORS.coral;
    ctx.textAlign = 'right';
    ctx.fillText('P_in (r=1.2)', inPx.x - 7, inPx.y - 4);

    drawCompactBadge(ctx, 8, 8, 'L₁=3, L₂=1 • Dead-Zone r<2', COLORS.coral, '#FECDD3', compact);
    drawCompactBadge(ctx, Math.max(8, w - (compact ? 132 : 154)), 8, 'Down (Cyan) / Up (Violet)', COLORS.violet, COLORS.violet, compact);
  }

  // --- Quiz 4: Collapsed Manipulability Ellipse at θ₂ = 0° ---
  _drawQuiz4CollapsedEllipse(ctx, w, h, compact) {
    const wm = makeWorldMapper(0, 0, w, h, { xMin: -0.6, xMax: 3.6, yMin: -1.35, yMax: 1.35 }, compact ? 10 : 14);
    drawWorldGrid(ctx, wm, { xMin: -0.6, xMax: 3.6, yMin: -1.35, yMax: 1.35 });

    const fk = fk2R(0, 0, 1.45, 1.15);
    const orig = wm.toPx(0, 0);

    // Outer singularity boundary arc passing right through EE
    ctx.strokeStyle = 'rgba(251, 113, 133, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(orig.x, orig.y, 2.6 * wm.scale, -0.58, 0.58);
    ctx.stroke();
    ctx.setLineDash([]);

    // Fully outstretched arm along +x
    drawArticulatedArm(ctx, wm, fk.joints, {
      linkColors: [COLORS.cyan, COLORS.amber],
      lineWidth: compact ? 4.8 : 5.6,
      jointRadius: compact ? 4.5 : 5.2,
    });

    const eePx = wm.toPx(fk.ee.x, fk.ee.y);
    const barHalf = (compact ? 40 : 52) + 3 * Math.sin(this._pulsePhase);

    // Collapsed 1D Manipulability Ellipse (pure vertical line along ±y)
    ctx.save();
    ctx.strokeStyle = COLORS.emerald;
    ctx.shadowColor = COLORS.emeraldGlow;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(eePx.x, eePx.y - barHalf);
    ctx.lineTo(eePx.x, eePx.y + barHalf);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Tangential achievable arrow (+y)
    drawArrowHead(ctx, eePx.x, eePx.y - barHalf + 6, eePx.x, eePx.y - barHalf - 10, COLORS.emerald, 6, 2.0);
    // Radial lost arrow (+x) with Coral X
    drawArrowHead(ctx, eePx.x + 8, eePx.y, eePx.x + (compact ? 42 : 56), eePx.y, COLORS.coral, 6.5, 2.0);
    const xMark = eePx.x + (compact ? 25 : 32);
    ctx.strokeStyle = COLORS.coral;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(xMark - 6, eePx.y - 6);
    ctx.lineTo(xMark + 6, eePx.y + 6);
    ctx.moveTo(xMark + 6, eePx.y - 6);
    ctx.lineTo(xMark - 6, eePx.y + 6);
    ctx.stroke();

    ctx.font = `700 ${compact ? 9 : 10.5}px ${FONT_MONO}`;
    ctx.fillStyle = COLORS.emerald;
    ctx.textAlign = 'left';
    ctx.fillText('σ₁ > 0 (±y OK)', eePx.x + 10, eePx.y - barHalf + 6);
    ctx.fillStyle = COLORS.coral;
    ctx.fillText('σ₂ = 0 (±x ?)', eePx.x + 10, eePx.y + 18);
    ctx.restore();

    drawCompactBadge(ctx, 8, 8, 'θ₂ = 0° • w(θ) = 0', COLORS.coral, '#FECDD3', compact);
  }

  // --- Quiz 5: Naive 1/σ vs. DLS Filter σ / (σ² + λ²) ---
  _drawQuiz5DlsFilter(ctx, w, h, compact) {
    const map = makePlotMapper(w, h, 0, 1.0, 0, 6.2, {
      left: compact ? 34 : 44,
      right: 16,
      top: 24,
      bottom: 24,
    });
    drawGrid(
      ctx,
      map,
      [0, 0.25, 0.5, 0.75, 1.0],
      [0, 2, 4, 6],
      (v) => `σ=${fmtPlain(v, 2)}`,
      (v) => `${fmtPlain(v, 0)}`
    );

    const lambda = 0.20;
    const peakDls = 1 / (2 * lambda); // 2.5

    // Shaded singularity zone σ < λ
    ctx.fillStyle = 'rgba(251, 113, 133, 0.11)';
    ctx.fillRect(map.plotLeft, map.plotTop, map.xToPx(lambda) - map.plotLeft, map.plotH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    // Naive 1/σ curve (dashed Coral shooting to +∞ as σ → 0)
    ctx.strokeStyle = COLORS.coral;
    ctx.lineWidth = 2.0;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    const steps = 120;
    for (let i = 1; i <= steps; i++) {
      const sig = i / steps;
      const val = Math.min(8.0, 1 / sig);
      const px = map.xToPx(sig);
      const py = map.yToPx(val);
      if (i === 1) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // DLS Filter σ / (σ² + λ²) (solid glowing Emerald peaking at 1/(2λ) and dropping to 0!)
    ctx.strokeStyle = COLORS.emerald;
    ctx.shadowColor = COLORS.emeraldGlow;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const sig = i / steps;
      const val = sig / (sig * sig + lambda * lambda);
      const px = map.xToPx(sig);
      const py = map.yToPx(val);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Highlight DLS peak at σ = λ
    const peakPx = map.xToPx(lambda);
    const peakPy = map.yToPx(peakDls);
    drawGlowingDot(ctx, peakPx, peakPy, 4.2, COLORS.emerald, COLORS.emeraldGlow, this._pulsePhase);

    ctx.font = `700 ${compact ? 9 : 10}px ${FONT_MONO}`;
    ctx.fillStyle = COLORS.emerald;
    ctx.textAlign = 'left';
    ctx.fillText('DLS peak 1/(2λ)', peakPx + 8, peakPy - 2);

    ctx.fillStyle = COLORS.coral;
    ctx.fillText('Naive J⁺: 1/σ → ∞', map.xToPx(0.18), map.plotTop + 12);

    drawCompactBadge(ctx, Math.max(8, w - (compact ? 116 : 138)), 4, 'λ = 0.20 Regularized', COLORS.emerald, COLORS.emerald, compact);
  }

  // --- Quiz 6: Redundant 3R Nullspace Elbow Swing + Fixed EE + QP Box Rails ---
  _drawQuiz6NullspaceQpIk(ctx, w, h, compact) {
    const wm = makeWorldMapper(0, 0, w, h, { xMin: -0.5, xMax: 2.85, yMin: -1.15, yMax: 1.35 }, compact ? 10 : 14);
    drawWorldGrid(ctx, wm, { xMin: -0.5, xMax: 2.85, yMin: -1.15, yMax: 1.35 });

    const L1 = 1.05;
    const L2 = 0.95;
    const L3 = 0.78;
    const eeTarget = { x: 1.85, y: 0.12 };

    // Obstacle near lower elbow zone
    const obs = { x: 0.92, y: -0.28, r: 0.28 };
    const obsPx = wm.toPx(obs.x, obs.y);
    ctx.beginPath();
    ctx.arc(obsPx.x, obsPx.y, obs.r * wm.scale, 0, TWO_PI);
    ctx.fillStyle = 'rgba(251, 113, 133, 0.24)';
    ctx.fill();
    ctx.strokeStyle = COLORS.coral;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.font = `700 ${compact ? 8.5 : 9.5}px ${FONT_MONO}`;
    ctx.fillStyle = '#FFE4E6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OBS', obsPx.x, obsPx.y);

    // Compute two postures reaching the EXACT same eeTarget (ghosted lower posture vs live animated self-motion posture)
    const solveFixedEE = (q1Seed) => {
      const p1x = L1 * Math.cos(q1Seed);
      const p1y = L1 * Math.sin(q1Seed);
      const dx = eeTarget.x - p1x;
      const dy = eeTarget.y - p1y;
      const sol23 = ik2R(dx, dy, L2, L3, -1);
      const q2 = sol23.q1 - q1Seed;
      const q3 = sol23.q2;
      return fk3RPoE(q1Seed, q2, q3, L1, L2, L3);
    };

    const ghostFk = solveFixedEE(-0.22);
    const liveQ1 = 0.42 + 0.26 * Math.sin(this._pulsePhase);
    const liveFk = solveFixedEE(liveQ1);

    // Ghosted colliding elbow posture
    drawArticulatedArm(ctx, wm, ghostFk.joints, {
      linkColors: [COLORS.violet, COLORS.violet, COLORS.violet],
      dashed: true,
      alpha: 0.55,
      lineWidth: 2.6,
      jointRadius: 3.2,
    });

    // Live nullspace self-motion arm clearing obstacle while keeping EE locked!
    drawArticulatedArm(ctx, wm, liveFk.joints, {
      linkColors: [COLORS.cyan, COLORS.amber, COLORS.emerald],
      lineWidth: compact ? 4.0 : 4.8,
      jointRadius: compact ? 4.0 : 4.6,
    });

    // Self-motion curved arrow between ghost elbow and live elbow
    const e1 = wm.toPx(ghostFk.joints[1].x, ghostFk.joints[1].y);
    const e2 = wm.toPx(liveFk.joints[1].x, liveFk.joints[1].y);
    drawArrowHead(ctx, e1.x + 2, e1.y - 6, e2.x + 2, e2.y + 8, COLORS.emerald, 6, 1.8);

    // Locked End-Effector pin
    const eePx = wm.toPx(eeTarget.x, eeTarget.y);
    drawGlowingDot(ctx, eePx.x, eePx.y, 5.0, COLORS.amberLight, COLORS.amberGlow, this._pulsePhase);
    ctx.font = `700 ${compact ? 9 : 10}px ${FONT_MONO}`;
    ctx.fillStyle = COLORS.amberLight;
    ctx.textAlign = 'left';
    ctx.fillText('p* LOCKED (v_ee = 0)', eePx.x + 9, eePx.y + 3);

    drawCompactBadge(ctx, 8, 8, 'ker(J) Self-Motion + Hard QP Limits', COLORS.cyan, COLORS.cyan, compact);
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
    this._canvas = null;
    this._ctx = null;
    this._canvasWrap = null;
    this._optionButtons = [];
    this._feedbackSlot = null;
    this._root = null;
  }
}
