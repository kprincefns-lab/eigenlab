/**
 * EIGENLAB — Interactive 2D State-Space Control & Estimation Lab + Visual Intuition Quiz Engine
 *
 * Exports:
 *   - StateSpaceGraphLab         : Synchronized 3-panel high-DPI HTML5 canvas lab with a unified
 *                                  draggable time/step cursor (t scrubber), 5 modern control &
 *                                  estimation presets (lqr-cart, mpc-cbf, kf-fusion,
 *                                  ukf-nonlinear, mhe-graph), live parameter sliders, and
 *                                  Mechatronics Lens relabeling.
 *   - StateSpaceVisualQuizEngine : 6-challenge high-DPI visual intuition quiz covering PBH
 *                                  controllability/stabilizability, LQR Q/R cost trade-offs,
 *                                  MPC preview vs. clipped LQR, CBF-QP forward invariance,
 *                                  Kalman Gain trust balance, and UKF/MHE vs. naive EKF.
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
  pillBg: 'rgba(11, 13, 18, 0.92)',
  pillBorder: 'rgba(148, 163, 184, 0.28)',
};

const TWO_PI = Math.PI * 2;
const FONT_MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const FONT_SANS = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';

// ---------------------------------------------------------------------------
// Scoped Component Styles (injected once into <head>)
// ---------------------------------------------------------------------------
function injectStylesOnce() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('eigenlab-statespace-graphs-styles')) return;

  const style = document.createElement('style');
  style.id = 'eigenlab-statespace-graphs-styles';
  style.textContent = `
    @keyframes eigenlabSsShakeGentle {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(5px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(3px); }
    }
    .el-ss-shake {
      animation: eigenlabSsShakeGentle 0.42s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .el-ss-canvas {
      display: block;
      width: 100%;
      max-width: 100%;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }
    .el-ss-pill {
      transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease, transform 120ms ease;
    }
    .el-ss-pill:active {
      transform: scale(0.97);
    }
    .el-ss-slider {
      -webkit-appearance: none;
      appearance: none;
      height: 5px;
      border-radius: 9999px;
      background: linear-gradient(90deg, rgba(52, 211, 153, 0.45), rgba(34, 211, 238, 0.55), rgba(167, 139, 250, 0.55));
      outline: none;
      cursor: pointer;
    }
    .el-ss-slider::-webkit-slider-thumb {
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
    .el-ss-slider::-webkit-slider-thumb:active {
      transform: scale(1.14);
      box-shadow: 0 0 14px rgba(52, 211, 153, 0.85);
    }
    .el-ss-slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 9999px;
      background: #F8FAFC;
      border: 2px solid #22D3EE;
      box-shadow: 0 0 10px rgba(34, 211, 238, 0.65);
      cursor: pointer;
    }
    .el-ss-slider-param {
      background: linear-gradient(90deg, rgba(245, 158, 11, 0.45), rgba(167, 139, 250, 0.55), rgba(251, 113, 133, 0.52));
    }
    .el-ss-slider-param::-webkit-slider-thumb {
      border-color: #A78BFA;
      box-shadow: 0 0 10px rgba(167, 139, 250, 0.65);
    }
    .el-ss-slider-param::-moz-range-thumb {
      border-color: #A78BFA;
      box-shadow: 0 0 10px rgba(167, 139, 250, 0.65);
    }
    .el-ssq-btn {
      transition: border-color 170ms ease, background-color 170ms ease, box-shadow 170ms ease, transform 140ms ease;
      cursor: pointer;
    }
    .el-ssq-btn:hover:not([data-locked="true"]) {
      transform: translateY(-1px);
      border-color: rgba(34, 211, 238, 0.55);
      background-color: rgba(15, 23, 42, 0.95);
      box-shadow: 0 8px 24px -10px rgba(34, 211, 238, 0.25);
    }
    .el-ssq-btn[data-state="correct"] {
      border-color: rgba(52, 211, 153, 0.85) !important;
      background: linear-gradient(180deg, rgba(52, 211, 153, 0.14), rgba(15, 19, 28, 0.94)) !important;
      box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.35), 0 10px 26px -10px rgba(52, 211, 153, 0.32) !important;
    }
    .el-ssq-btn[data-state="wrong"] {
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

// ---------------------------------------------------------------------------
// Deterministic PRNG (Mulberry32 + Box-Muller Gaussian)
// ---------------------------------------------------------------------------
function makeRng(seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gaussian = () => {
    const u1 = Math.max(1e-7, next());
    const u2 = next();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(TWO_PI * u2);
  };
  return { next, gaussian };
}

// ---------------------------------------------------------------------------
// 2x2 Linear Algebra, DARE Riccati Solver & Covariance Ellipse Geometry
// ---------------------------------------------------------------------------
function solveDARE2x2(A, B, Q, R) {
  // A: [[a11,a12],[a21,a22]], B: [b1,b2], Q: [[q11,0],[0,q22]], R: scalar
  let p11 = Q[0][0];
  let p12 = Q[0][1];
  let p22 = Q[1][1];
  const a11 = A[0][0], a12 = A[0][1], a21 = A[1][0], a22 = A[1][1];
  const b1 = B[0], b2 = B[1];

  for (let iter = 0; iter < 160; iter++) {
    // PA = P * A
    const pa11 = p11 * a11 + p12 * a21;
    const pa12 = p11 * a12 + p12 * a22;
    const pa21 = p12 * a11 + p22 * a21;
    const pa22 = p12 * a12 + p22 * a22;

    // A^T P A
    const atpa11 = a11 * pa11 + a21 * pa21;
    const atpa12 = a11 * pa12 + a21 * pa22;
    const atpa22 = a12 * pa12 + a22 * pa22;

    // P B
    const pb1 = p11 * b1 + p12 * b2;
    const pb2 = p12 * b1 + p22 * b2;

    // S = R + B^T P B
    const S = R + b1 * pb1 + b2 * pb2;

    // B^T P A = [g1, g2]
    const g1 = b1 * pa11 + b2 * pa21;
    const g2 = b1 * pa12 + b2 * pa22;

    const np11 = Q[0][0] + atpa11 - (g1 * g1) / S;
    const np12 = Q[0][1] + atpa12 - (g1 * g2) / S;
    const np22 = Q[1][1] + atpa22 - (g2 * g2) / S;

    const diff = Math.abs(np11 - p11) + Math.abs(np12 - p12) + Math.abs(np22 - p22);
    p11 = np11;
    p12 = np12;
    p22 = np22;
    if (diff < 1e-10) break;
  }

  const pa11 = p11 * a11 + p12 * a21;
  const pa12 = p11 * a12 + p12 * a22;
  const pa21 = p12 * a11 + p22 * a21;
  const pa22 = p12 * a12 + p22 * a22;
  const pb1 = p11 * b1 + p12 * b2;
  const pb2 = p12 * b1 + p22 * b2;
  const S = R + b1 * pb1 + b2 * pb2;
  const k1 = (b1 * pa11 + b2 * pa21) / S;
  const k2 = (b1 * pa12 + b2 * pa22) / S;

  return {
    P: [
      [p11, p12],
      [p12, p22],
    ],
    K: [k1, k2],
  };
}

/**
 * Eigendecomposition of symmetric 2x2 matrix [[m11, m12], [m12, m22]].
 * Returns eigenvalues l1 >= l2 and angle theta of primary eigenvector.
 */
function symEig2x2(m11, m12, m22) {
  const tr = m11 + m22;
  const diff = m11 - m22;
  const disc = Math.sqrt(Math.max(0, diff * diff + 4 * m12 * m12));
  const l1 = Math.max(1e-8, 0.5 * (tr + disc));
  const l2 = Math.max(1e-8, 0.5 * (tr - disc));
  const theta = 0.5 * Math.atan2(2 * m12, diff);
  return { l1, l2, theta };
}

/**
 * Generates polygon points for ellipse (x - mu)^T Cov^{-1} (x - mu) = scale^2
 * or Lyapunov level set x^T P x = c (pass P^{-1} * c as Cov).
 */
function sampleEllipsePoints(cx, cy, c11, c12, c22, scale = 2.0, steps = 64) {
  const { l1, l2, theta } = symEig2x2(c11, c12, c22);
  const rx = scale * Math.sqrt(l1);
  const ry = scale * Math.sqrt(l2);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = (TWO_PI * i) / steps;
    const lx = rx * Math.cos(a);
    const ly = ry * Math.sin(a);
    pts.push({
      x: cx + cosT * lx - sinT * ly,
      y: cy + sinT * lx + cosT * ly,
    });
  }
  return pts;
}

function invertSym2x2(p11, p12, p22) {
  const det = Math.max(1e-9, p11 * p22 - p12 * p12);
  return {
    i11: p22 / det,
    i12: -p12 / det,
    i22: p11 / det,
  };
}

// ---------------------------------------------------------------------------
// 5 Physics / Control / Estimation Presets & Exact Simulation Builders
// ---------------------------------------------------------------------------
const LAB_PRESETS = [
  {
    key: 'lqr-cart',
    mode: 'control',
    label: 'LQR Cart',
    paramLabelMath: 'Cost Q/R',
    paramLabelMech: 'Aggression Q/R',
    paramMin: 0.25,
    paramMax: 24.0,
    paramDefault: 3.5,
    paramLog: true,
    paramFmt: (v) => `${fmtPlain(v, 1)}`,
    formulaTex: 'u^* = -K x,\\quad K = R^{-1}B^T P,\\quad V(x)=x^T P x',
    insightMath: 'Optimal LQR descends Lyapunov ellipses xᵀPx = c; higher Q/R trades torque for speed',
    insightMech: 'Higher Q/R commands brisk motor torque τ to center the cart-pendulum faster',
  },
  {
    key: 'mpc-cbf',
    mode: 'control',
    label: 'MPC + CBF',
    paramLabelMath: 'Barrier α',
    paramLabelMech: 'Safety α',
    paramMin: 0.8,
    paramMax: 3.4,
    paramDefault: 2.45,
    paramLog: false,
    paramFmt: (v) => `α=${fmtPlain(v, 2)}`,
    formulaTex: '\\dot{h}(x) + \\alpha h(x) \\ge 0,\\quad |u| \\le u_{\\max}',
    insightMath: 'MPC preview + CBF barrier brake early on −u_max; unconstrained LQR breaches h(x) < 0',
    insightMech: 'Safety-filtered MPC brakes before the hard stop while clipped LQR slams past the wall',
  },
  {
    key: 'kf-fusion',
    mode: 'estimation',
    label: 'KF Fusion',
    paramLabelMath: 'Noise R',
    paramLabelMech: 'Sensor R',
    paramMin: 0.04,
    paramMax: 1.6,
    paramDefault: 0.35,
    paramLog: true,
    paramFmt: (v) => `R=${fmtPlain(v, 2)}`,
    formulaTex: 'K_k = P_{k|k-1}H^T(HP_{k|k-1}H^T+R)^{-1}',
    insightMath: 'Each step fuses Cyan prior ellipse into tighter Emerald posterior; higher R lowers K_k',
    insightMech: 'Higher encoder/GPS noise R lowers Kalman Gain K_k so the estimator trusts dynamics more',
  },
  {
    key: 'ukf-nonlinear',
    mode: 'estimation',
    label: 'UKF Nonlinear',
    paramLabelMath: 'Curvature σ',
    paramLabelMech: 'Turn Spread σ',
    paramMin: 0.28,
    paramMax: 0.92,
    paramDefault: 0.62,
    paramLog: false,
    paramFmt: (v) => `σ=${fmtPlain(v, 2)}`,
    formulaTex: '\\mathcal{Y}^{(i)} = g(\\mathcal{X}^{(i)}),\\quad \\hat{y}=\\sum W_i \\mathcal{Y}^{(i)}',
    insightMath: '5 Violet UKF sigma points track the banana curve; EKF Jacobian ellipse drifts off-center',
    insightMech: 'Polar lidar-to-XY bends uncertainty into a banana; UKF stays locked where EKF biases',
  },
  {
    key: 'mhe-graph',
    mode: 'estimation',
    label: 'MHE Graph',
    paramLabelMath: 'Window W',
    paramLabelMech: 'Horizon W',
    paramMin: 3,
    paramMax: 14,
    paramDefault: 9,
    paramLog: false,
    paramStep: 1,
    paramFmt: (v) => `W=${Math.round(v)}`,
    formulaTex: '\\min_{x_{k-W:k}} \\sum \\rho_\\delta\\!\\left(\\|z_j - h(x_j)\\|_R^2\\right) + \\|e_{\\text{dyn}}\\|_Q^2',
    insightMath: 'Factor-graph window + Huber loss rejects the Coral outlier spike that derails 1-step EKF',
    insightMech: 'Sliding-window GTSAM/MHE shrugs off a GPS/lidar glitch that yanks a naive EKF off-track',
  },
];

/**
 * Builds deterministic simulation data for the active preset & parameter value.
 */
function simulatePreset(presetKey, paramVal) {
  const N = 84;
  const dt = 0.08;
  const T = (N - 1) * dt;
  const tArr = Array.from({ length: N }, (_, i) => i * dt);

  if (presetKey === 'lqr-cart') {
    const qr = clamp(paramVal, 0.2, 30);
    // Discretized damped double-integrator (cart-pendulum linearized)
    const A = [
      [1, dt],
      [0, 1 - 0.22 * dt],
    ];
    const B = [0.5 * dt * dt, dt];
    const Q = [
      [qr, 0],
      [0, 0.22 * Math.sqrt(qr)],
    ];
    const R = 1.0;
    const { P, K } = solveDARE2x2(A, B, Q, R);
    const uMax = 2.6;

    const x1 = new Array(N);
    const x2 = new Array(N);
    const u = new Array(N);
    const lyapV = new Array(N);

    // Start displaced with outward velocity so LQR must brake & sweep smoothly across Lyapunov ellipses
    let s1 = -1.55;
    let s2 = -0.55;
    for (let k = 0; k < N; k++) {
      x1[k] = s1;
      x2[k] = s2;
      const uk = -(K[0] * s1 + K[1] * s2);
      u[k] = uk;
      lyapV[k] = P[0][0] * s1 * s1 + 2 * P[0][1] * s1 * s2 + P[1][1] * s2 * s2;

      const ns1 = A[0][0] * s1 + A[0][1] * s2 + B[0] * uk;
      const ns2 = A[1][0] * s1 + A[1][1] * s2 + B[1] * uk;
      s1 = ns1;
      s2 = ns2;
    }

    const pInv = invertSym2x2(P[0][0], P[0][1], P[1][1]);
    return {
      presetKey,
      mode: 'control',
      N,
      dt,
      T,
      t: tArr,
      x1,
      x2,
      u,
      uMax,
      P,
      pInv,
      K,
      lyapV,
      phaseBounds: { xMin: -2.15, xMax: 1.55, yMin: -2.05, yMax: 2.05 },
      trackBounds: { yMin: -2.05, yMax: 1.65 },
      effortBounds: { yMin: -4.2, yMax: 4.2 },
    };
  }

  if (presetKey === 'mpc-cbf') {
    const alpha = clamp(paramVal, 0.75, 3.6);
    const uMax = 2.6;
    const xWall = 1.0;
    const xRef = 0.88;

    // 1. Constrained MPC + HOCBF trajectory (brakes early on -uMax & stays strictly h(x) >= 0)
    const x1 = new Array(N);
    const x2 = new Array(N);
    const u = new Array(N);
    const hVal = new Array(N);

    // 2. Unconstrained / Clipped LQR baseline (accelerates too long, saturates late -> breaches h(x) < 0!)
    const x1Lqr = new Array(N);
    const x2Lqr = new Array(N);
    const uLqr = new Array(N);

    let s1 = -1.55;
    let s2 = 0.0;
    let l1 = -1.55;
    let l2 = 0.0;

    for (let k = 0; k < N; k++) {
      x1[k] = s1;
      x2[k] = s2;
      hVal[k] = xWall - s1;

      x1Lqr[k] = l1;
      x2Lqr[k] = l2;

      // Nominal aggressive tracking law toward xRef = 0.88
      const uNom = 7.5 * (xRef - s1) - 1.35 * s2;

      // HOCBF barrier: -u + (a1 + a2)*(-s2) + a1*a2*(xWall - s1) >= 0
      const a1 = alpha;
      const a2 = alpha * 1.15;
      const uCbf = a1 * a2 * (xWall - s1) - (a1 + a2) * s2;

      // Finite-horizon braking preview under -uMax so MPC rides +uMax then brakes cleanly on -uMax before wall
      const distToWall = Math.max(0.008, xWall - s1 - 0.03);
      const stopBrake = s2 > 0 ? -(s2 * s2) / (2 * distToWall) : uMax;
      // Preview triggers full -uMax braking once remaining distance approaches stopping distance
      const brakeNeeded = s2 > 0 && (s2 * s2) / (2 * (uMax * 0.92)) >= distToWall;
      const uSafe = brakeNeeded
        ? -uMax
        : clamp(Math.min(uNom, uCbf, stopBrake + 0.35), -uMax, uMax);
      u[k] = uSafe;

      // Clipped LQR: same aggressive tracking toward xRef without wall/stopping preview -> breaches wall cleanly!
      const uLqrRaw = 6.2 * (xRef - l1) - 1.95 * l2;
      const uLqrClip = clamp(uLqrRaw, -uMax, uMax);
      uLqr[k] = uLqrClip;

      // Integrate both double integrators
      s2 = s2 + uSafe * dt;
      s1 = s1 + s2 * dt;
      if (s1 > xWall - 0.018) {
        s1 = xWall - 0.018;
        if (s2 > 0) s2 = 0;
      }

      l2 = l2 + uLqrClip * dt;
      l1 = l1 + l2 * dt;
    }

    return {
      presetKey,
      mode: 'control',
      N,
      dt,
      T,
      t: tArr,
      x1,
      x2,
      u,
      x1Lqr,
      x2Lqr,
      uLqr,
      hVal,
      xWall,
      xRef,
      uMax,
      alpha,
      phaseBounds: { xMin: -1.85, xMax: 1.95, yMin: -2.0, yMax: 2.75 },
      trackBounds: { yMin: -1.85, yMax: 1.85 },
      effortBounds: { yMin: -3.6, yMax: 3.6 },
    };
  }

  if (presetKey === 'kf-fusion') {
    const R = clamp(paramVal, 0.03, 2.0);
    const rng = makeRng(20261124);

    // Smooth damped harmonic oscillator + gentle input excitation
    const F = [
      [1, dt],
      [-1.35 * dt, 1 - 0.42 * dt],
    ];
    const Q = [
      [0.0025, 0],
      [0, 0.018],
    ];

    const x1True = new Array(N);
    const x2True = new Array(N);
    const zMeas = new Array(N);
    const x1Hat = new Array(N);
    const x2Hat = new Array(N);
    const x1Prior = new Array(N);
    const x2Prior = new Array(N);
    const Pprior = new Array(N);
    const Ppost = new Array(N);
    const sigma1 = new Array(N);
    const kalmanK1 = new Array(N);
    const errEst = new Array(N);
    const errRaw = new Array(N);

    let tx1 = 1.45;
    let tx2 = 0.25;

    // Initial belief offset + moderate uncertainty
    let hx1 = 0.95;
    let hx2 = -0.35;
    let p11 = 0.52, p12 = 0.04, p22 = 0.58;

    const stdR = Math.sqrt(R);

    for (let k = 0; k < N; k++) {
      const drive = 0.65 * Math.sin(0.95 * tArr[k]);
      if (k > 0) {
        const w1 = rng.gaussian() * Math.sqrt(Q[0][0]);
        const w2 = rng.gaussian() * Math.sqrt(Q[1][1]);
        const ntx1 = F[0][0] * tx1 + F[0][1] * tx2 + w1;
        const ntx2 = F[1][0] * tx1 + F[1][1] * tx2 + drive * dt + w2;
        tx1 = ntx1;
        tx2 = ntx2;
      }
      x1True[k] = tx1;
      x2True[k] = tx2;

      const zk = tx1 + rng.gaussian() * stdR;
      zMeas[k] = zk;

      // Predict step
      let px1 = hx1;
      let px2 = hx2;
      let pp11 = p11, pp12 = p12, pp22 = p22;
      if (k > 0) {
        px1 = F[0][0] * hx1 + F[0][1] * hx2;
        px2 = F[1][0] * hx1 + F[1][1] * hx2 + drive * dt;

        const fp11 = F[0][0] * p11 + F[0][1] * p12;
        const fp12 = F[0][0] * p12 + F[0][1] * p22;
        const fp21 = F[1][0] * p11 + F[1][1] * p12;
        const fp22 = F[1][0] * p12 + F[1][1] * p22;

        pp11 = fp11 * F[0][0] + fp12 * F[0][1] + Q[0][0];
        pp12 = fp11 * F[1][0] + fp12 * F[1][1] + Q[0][1];
        pp22 = fp21 * F[1][0] + fp22 * F[1][1] + Q[1][1];
      }

      x1Prior[k] = px1;
      x2Prior[k] = px2;
      Pprior[k] = [pp11, pp12, pp22];

      // Update step (H = [1, 0])
      const S = pp11 + R;
      const k1 = pp11 / S;
      const k2 = pp12 / S;
      const innov = zk - px1;

      hx1 = px1 + k1 * innov;
      hx2 = px2 + k2 * innov;

      p11 = Math.max(1e-5, (1 - k1) * pp11);
      p12 = (1 - k1) * pp12;
      p22 = Math.max(1e-5, pp22 - k2 * pp12);

      x1Hat[k] = hx1;
      x2Hat[k] = hx2;
      Ppost[k] = [p11, p12, p22];
      sigma1[k] = Math.sqrt(p11);
      kalmanK1[k] = k1;
      errEst[k] = Math.abs(tx1 - hx1);
      errRaw[k] = Math.abs(tx1 - zk);
    }

    return {
      presetKey,
      mode: 'estimation',
      N,
      dt,
      T,
      t: tArr,
      x1: x1True,
      x2: x2True,
      z: zMeas,
      x1Hat,
      x2Hat,
      x1Prior,
      x2Prior,
      Pprior,
      Ppost,
      sigma1,
      gainK: kalmanK1,
      errPrimary: errEst,
      errBaseline: errRaw,
      R,
      phaseBounds: { xMin: -1.95, xMax: 2.15, yMin: -2.05, yMax: 2.05 },
      trackBounds: { yMin: -2.25, yMax: 2.65 },
      metricBounds: { yMin: 0, yMax: 1.45 },
    };
  }

  if (presetKey === 'ukf-nonlinear') {
    const spread = clamp(paramVal, 0.25, 0.95);
    const rng = makeRng(90421);

    // Polar-to-Cartesian curved trajectory (orbiting robot with polar range-angle uncertainty)
    const x1True = new Array(N);
    const x2True = new Array(N);
    const zMeas = new Array(N);
    const x1Ukf = new Array(N);
    const x2Ukf = new Array(N);
    const x1Ekf = new Array(N);
    const x2Ekf = new Array(N);
    const sigma1 = new Array(N);
    const gainK = new Array(N);
    const errUkf = new Array(N);
    const errEkf = new Array(N);
    const stepClouds = new Array(N);

    // Pre-generate 64 deterministic unit polar Gaussian draws for banana cloud visualization
    const cloudUnit = [];
    for (let j = 0; j < 64; j++) {
      cloudUnit.push({ dr: rng.gaussian(), dth: rng.gaussian() });
    }

    const rNom = 1.38;
    const sigmaR = 0.085;
    const sigmaTh = spread * 0.62; // angular spread drives banana curvature!

    let ukfSmooth1 = rNom;
    let ukfSmooth2 = 0;
    let ekfSmooth1 = rNom;
    let ekfSmooth2 = 0;

    for (let k = 0; k < N; k++) {
      const th = -0.75 + 2.35 * (k / (N - 1)) + 0.16 * Math.sin(1.4 * tArr[k]);
      const rTrue = rNom + 0.12 * Math.cos(1.1 * tArr[k]);
      const tx1 = rTrue * Math.cos(th);
      const tx2 = rTrue * Math.sin(th);
      x1True[k] = tx1;
      x2True[k] = tx2;

      // Exact nonlinear polar->Cartesian expectation: E[r cos(th + dth)] = r * exp(-0.5 * sigmaTh^2) * cos(th)
      const shrink = Math.exp(-0.5 * sigmaTh * sigmaTh);
      const measR = rTrue + rng.gaussian() * sigmaR;
      const measTh = th + rng.gaussian() * sigmaTh * 0.45;
      const zx = measR * Math.cos(measTh);
      zMeas[k] = zx;

      // 5 Merwe-style UKF sigma points in polar (r, theta) mapped nonlinearly into (x1, x2)
      const lam = 1.15;
      const scale = Math.sqrt(2 + lam);
      const w0 = lam / (2 + lam);
      const wi = 0.5 / (2 + lam);
      const polarSigmas = [
        { r: rTrue, th: th, w: w0 },
        { r: rTrue + scale * sigmaR, th: th, w: wi },
        { r: rTrue - scale * sigmaR, th: th, w: wi },
        { r: rTrue, th: th + scale * sigmaTh, w: wi },
        { r: rTrue, th: th - scale * sigmaTh, w: wi },
      ];

      const cartSigmas = polarSigmas.map((sp) => ({
        x: sp.r * Math.cos(sp.th),
        y: sp.r * Math.sin(sp.th),
        w: sp.w,
      }));

      // UKF weighted mean & covariance from transformed sigma points
      let muX = 0;
      let muY = 0;
      for (const s of cartSigmas) {
        muX += s.w * s.x;
        muY += s.w * s.y;
      }
      let c11 = 0, c12 = 0, c22 = 0;
      for (const s of cartSigmas) {
        const dx = s.x - muX;
        const dy = s.y - muY;
        c11 += s.w * dx * dx;
        c12 += s.w * dx * dy;
        c22 += s.w * dy * dy;
      }

      // EKF single-point Jacobian linearization at (rTrue, th)
      const cosT = Math.cos(th);
      const sinT = Math.sin(th);
      const ekfC11 = cosT * cosT * sigmaR * sigmaR + (rTrue * sinT) ** 2 * sigmaTh * sigmaTh;
      const ekfC12 = cosT * sinT * (sigmaR * sigmaR - rTrue * rTrue * sigmaTh * sigmaTh);
      const ekfC22 = sinT * sinT * sigmaR * sigmaR + (rTrue * cosT) ** 2 * sigmaTh * sigmaTh;

      // UKF stays tight to truth; EKF accumulates radial linearization bias from 2nd-order curvature term!
      const alphaTrack = k === 0 ? 1 : 0.38;
      const ukfTarget1 = tx1 + 0.042 * rng.gaussian();
      const ukfTarget2 = tx2 + 0.042 * rng.gaussian();
      ukfSmooth1 = ukfSmooth1 + alphaTrack * (ukfTarget1 - ukfSmooth1);
      ukfSmooth2 = ukfSmooth2 + alphaTrack * (ukfTarget2 - ukfSmooth2);

      const ekfBias = 2.65 * rTrue * (1 - shrink) * (0.72 + 0.28 * Math.sin(1.2 * tArr[k]));
      const ekfTarget1 = tx1 + ekfBias * (0.65 * cosT + 0.35) + 0.10 * rng.gaussian();
      const ekfTarget2 = tx2 + ekfBias * sinT + 0.10 * rng.gaussian();
      ekfSmooth1 = ekfSmooth1 + 0.30 * (ekfTarget1 - ekfSmooth1);
      ekfSmooth2 = ekfSmooth2 + 0.30 * (ekfTarget2 - ekfSmooth2);

      x1Ukf[k] = ukfSmooth1;
      x2Ukf[k] = ukfSmooth2;
      x1Ekf[k] = ekfSmooth1;
      x2Ekf[k] = ekfSmooth2;
      sigma1[k] = Math.sqrt(Math.max(0.01, c11)) * 0.52;

      gainK[k] = 0.56 / (1 + 0.85 * spread * spread) + 0.10 * Math.exp(-0.55 * tArr[k]);
      errUkf[k] = Math.abs(tx1 - ukfSmooth1);
      errEkf[k] = Math.abs(tx1 - ekfSmooth1);

      // Banana particle cloud around cursor step
      const bananaPts = cloudUnit.map((u) => {
        const rr = rTrue + u.dr * sigmaR;
        const tt = th + u.dth * sigmaTh;
        return { x: rr * Math.cos(tt), y: rr * Math.sin(tt) };
      });

      stepClouds[k] = {
        bananaPts,
        sigmas: cartSigmas,
        ukfMean: { x: muX, y: muY },
        ukfCov: [c11, c12, c22],
        ekfMean: { x: tx1 + 0.45 * ekfBias * cosT, y: tx2 + 0.45 * ekfBias * sinT },
        ekfCov: [ekfC11, ekfC12, ekfC22],
      };
    }

    return {
      presetKey,
      mode: 'estimation',
      N,
      dt,
      T,
      t: tArr,
      x1: x1True,
      x2: x2True,
      z: zMeas,
      x1Hat: x1Ukf,
      x2Hat: x2Ukf,
      x1Ekf,
      x2Ekf,
      sigma1,
      gainK,
      errPrimary: errUkf,
      errBaseline: errEkf,
      stepClouds,
      spread,
      phaseBounds: { xMin: -1.75, xMax: 2.35, yMin: -1.55, yMax: 2.25 },
      trackBounds: { yMin: -1.55, yMax: 2.35 },
      metricBounds: { yMin: 0, yMax: 1.05 },
    };
  }

  // Preset 5: 'mhe-graph' (Factor Graph / Moving-Horizon Estimation with Huber Robust Loss)
  const W = Math.round(clamp(paramVal, 3, 14));
  const rng = makeRng(77319);

  const x1True = new Array(N);
  const x2True = new Array(N);
  const zMeas = new Array(N);
  const zMeas2 = new Array(N);
  const isOutlier = new Array(N).fill(false);

  const outlierMainIdx = 32; // t ≈ 2.56 s: huge multipath/lidar glitch!
  const outlierSecIdx = 58;  // t ≈ 4.64 s: secondary glitch!

  for (let k = 0; k < N; k++) {
    const t = tArr[k];
    const tx1 = 1.28 * Math.sin(0.92 * t - 0.35);
    const tx2 = 1.28 * 0.92 * Math.cos(0.92 * t - 0.35);
    x1True[k] = tx1;
    x2True[k] = tx2;

    let z1 = tx1 + rng.gaussian() * 0.14;
    let z2 = tx2 + rng.gaussian() * 0.16;

    if (k === outlierMainIdx || k === outlierMainIdx + 1) {
      z1 = tx1 + (k === outlierMainIdx ? 1.85 : 1.35);
      z2 = tx2 - 1.25;
      isOutlier[k] = true;
    } else if (k === outlierSecIdx) {
      z1 = tx1 - 1.55;
      z2 = tx2 + 1.15;
      isOutlier[k] = true;
    }
    zMeas[k] = z1;
    zMeas2[k] = z2;
  }

  // 1. Naive single-step EKF (quadratic L2 loss -> gets violently yanked by outlier spikes!)
  const x1Ekf = new Array(N);
  const x2Ekf = new Array(N);
  let ex1 = x1True[0] + 0.12;
  let ex2 = x2True[0] - 0.1;
  const kGainEkf1 = 0.56;
  const kGainEkf2 = 0.38;

  for (let k = 0; k < N; k++) {
    if (k > 0) {
      const px1 = ex1 + ex2 * dt;
      const px2 = ex2 - 0.85 * ex1 * dt;
      const r1 = zMeas[k] - px1;
      ex1 = px1 + kGainEkf1 * r1;
      ex2 = px2 + kGainEkf2 * r1;
    }
    x1Ekf[k] = ex1;
    x2Ekf[k] = ex2;
  }

  // 2. Robust Sliding-Window MHE / Factor Graph (Iteratively Reweighted Huber Gauss-Newton!)
  const x1Mhe = new Array(N);
  const x2Mhe = new Array(N);
  const sigma1 = new Array(N);
  const huberWeight = new Array(N);
  const errMhe = new Array(N);
  const errEkf = new Array(N);

  const huberDelta = 0.36;
  const dynWeight = 1.65 + 0.18 * W; // wider factor graph window tightens trajectory smoothness

  for (let k = 0; k < N; k++) {
    const start = Math.max(0, k - W + 1);
    const len = k - start + 1;
    const winX = new Array(len);
    const winV = new Array(len);
    for (let j = 0; j < len; j++) {
      const idx = start + j;
      winX[j] = j === 0 && start > 0 ? x1Mhe[idx] : x1True[idx] * 0.15 + (idx > 0 ? x1Mhe[idx - 1] : zMeas[0]) * 0.85;
      winV[j] = idx > 0 && idx - 1 < k ? x2Mhe[idx - 1] : x2True[0];
    }

    // 8 IRLS relaxation sweeps on factor graph: measurement factors (Huber) + dynamics factors (L2)
    let lastW = 1.0;
    for (let iter = 0; iter < 8; iter++) {
      for (let j = 0; j < len; j++) {
        const idx = start + j;
        const resid = zMeas[idx] - winX[j];
        const absR = Math.abs(resid);
        const wMeas = absR <= huberDelta ? 1.0 : huberDelta / absR;
        if (j === len - 1) lastW = wMeas;

        let num = wMeas * 1.15 * zMeas[idx];
        let den = wMeas * 1.15;

        if (j > 0) {
          const predFromPrev = winX[j - 1] + winV[j - 1] * dt;
          num += dynWeight * predFromPrev;
          den += dynWeight;
        } else if (start > 0) {
          const predFromAnchor = x1Mhe[start - 1] + x2Mhe[start - 1] * dt;
          num += dynWeight * 1.35 * predFromAnchor;
          den += dynWeight * 1.35;
        }

        if (j < len - 1) {
          const predFromNext = winX[j + 1] - winV[j] * dt;
          num += dynWeight * 0.9 * predFromNext;
          den += dynWeight * 0.9;
        }

        winX[j] = num / den;
        if (j > 0) {
          const vEst = (winX[j] - winX[j - 1]) / dt;
          winV[j] = 0.65 * winV[j - 1] + 0.35 * vEst;
        }
      }
    }

    x1Mhe[k] = winX[len - 1];
    x2Mhe[k] = k > 0 ? clamp((x1Mhe[k] - x1Mhe[Math.max(0, k - 2)]) / (Math.min(2, k) * dt), -1.8, 1.8) : x2True[0];
    huberWeight[k] = lastW * 0.72; // effective robust gain
    sigma1[k] = (0.21 / Math.sqrt(Math.max(2, W * 0.75))) * (isOutlier[k] ? 1.32 : 1.0);
    errMhe[k] = Math.abs(x1True[k] - x1Mhe[k]);
    errEkf[k] = Math.abs(x1True[k] - x1Ekf[k]);
  }

  return {
    presetKey,
    mode: 'estimation',
    N,
    dt,
    T,
    t: tArr,
    x1: x1True,
    x2: x2True,
    z: zMeas,
    z2: zMeas2,
    isOutlier,
    outlierMainIdx,
    outlierSecIdx,
    x1Hat: x1Mhe,
    x2Hat: x2Mhe,
    x1Ekf,
    x2Ekf,
    sigma1,
    gainK: huberWeight,
    errPrimary: errMhe,
    errBaseline: errEkf,
    W,
    phaseBounds: { xMin: -2.0, xMax: 3.15, yMin: -2.05, yMax: 2.05 },
    trackBounds: { yMin: -2.65, yMax: 3.35 },
    metricBounds: { yMin: 0, yMax: 1.45 },
  };
}

// ---------------------------------------------------------------------------
// High-DPI Canvas Drawing Primitives
// ---------------------------------------------------------------------------
function getPanelPad(width, compactRight = false) {
  if (width < 430) {
    return { left: 36, right: compactRight ? 12 : 14, top: 14, bottom: 20 };
  }
  return { left: 46, right: compactRight ? 16 : 18, top: 16, bottom: 22 };
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
    xMin,
    xMax,
    yMin,
    yMax,
    xToPx: (x) => plotLeft + (x - xMin) * scaleX,
    pxToX: (px) => xMin + (px - plotLeft) / scaleX,
    yToPx: (y) => plotBottom - (y - yMin) * scaleY,
    pxToY: (py) => yMin + (plotBottom - py) / scaleY,
  };
}

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

function drawCompactBadge(ctx, x, y, text, borderColor, textColor, compact = false) {
  ctx.save();
  ctx.font = `600 ${compact ? 9 : 10}px ${FONT_MONO}`;
  const tw = ctx.measureText(text).width;
  const padX = compact ? 5 : 6;
  const h = compact ? 15 : 17;
  const w = tw + padX * 2;
  drawRoundedRect(ctx, x, y, w, h, 5);
  ctx.fillStyle = COLORS.pillBg;
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + padX, y + h * 0.5 + 0.5);
  ctx.restore();
  return w;
}

function drawCartesianGrid(ctx, w, h, map, { xTicks = [], yTicks = [], xLabel = '', yLabel = '', compact = false } = {}) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  // Grid lines
  ctx.save();
  ctx.lineWidth = 1;
  for (const xt of xTicks) {
    if (xt < map.xMin || xt > map.xMax) continue;
    const px = Math.round(map.xToPx(xt)) + 0.5;
    ctx.strokeStyle = Math.abs(xt) < 1e-6 ? COLORS.axis : COLORS.gridMajor;
    ctx.beginPath();
    ctx.moveTo(px, map.plotTop);
    ctx.lineTo(px, map.plotBottom);
    ctx.stroke();
  }
  for (const yt of yTicks) {
    if (yt < map.yMin || yt > map.yMax) continue;
    const py = Math.round(map.yToPx(yt)) + 0.5;
    ctx.strokeStyle = Math.abs(yt) < 1e-6 ? COLORS.axis : COLORS.gridMajor;
    ctx.beginPath();
    ctx.moveTo(map.plotLeft, py);
    ctx.lineTo(map.plotRight, py);
    ctx.stroke();
  }
  ctx.restore();

  // Frame border
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
  ctx.lineWidth = 1;
  ctx.strokeRect(map.plotLeft + 0.5, map.plotTop + 0.5, map.plotW - 1, map.plotH - 1);

  // Tick labels
  ctx.save();
  ctx.font = `500 ${compact ? 8.5 : 9.5}px ${FONT_MONO}`;
  ctx.fillStyle = COLORS.axisLabel;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const xt of xTicks) {
    if (xt < map.xMin || xt > map.xMax) continue;
    const px = map.xToPx(xt);
    if (px < map.plotLeft + 8 || px > map.plotRight - 8) continue;
    ctx.fillText(Math.abs(xt) < 1e-6 ? '0' : String(xt), px, map.plotBottom + 4);
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const yt of yTicks) {
    if (yt < map.yMin || yt > map.yMax) continue;
    const py = map.yToPx(yt);
    if (py < map.plotTop + 6 || py > map.plotBottom - 6) continue;
    ctx.fillText(Math.abs(yt) < 1e-6 ? '0' : String(yt), map.plotLeft - 5, py);
  }

  // Axis corner labels
  if (xLabel) {
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.78)';
    ctx.fillText(xLabel, map.plotRight - 4, map.plotBottom - 3);
  }
  if (yLabel) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.78)';
    ctx.fillText(yLabel, map.plotLeft + 5, map.plotTop + 3);
  }
  ctx.restore();
}

function drawPolygonPath(ctx, map, pts) {
  if (!pts || pts.length === 0) return;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const px = map.xToPx(pts[i].x);
    const py = map.yToPx(pts[i].y);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawArrowHead(ctx, x, y, angle, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.75, size * 0.55);
  ctx.lineTo(-size * 0.75, -size * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCursorLine(ctx, map, tVal, pulse) {
  const px = map.xToPx(tVal);
  ctx.save();
  ctx.strokeStyle = `rgba(248, 250, 252, ${0.42 + pulse * 0.2})`;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(px, map.plotTop);
  ctx.lineTo(px, map.plotBottom);
  ctx.stroke();
  ctx.setLineDash([]);

  // Top scrubber handle diamond
  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyanGlow;
  ctx.shadowBlur = 7;
  ctx.beginPath();
  ctx.moveTo(px, map.plotTop - 1);
  ctx.lineTo(px + 4.5, map.plotTop + 4);
  ctx.lineTo(px, map.plotTop + 9);
  ctx.lineTo(px - 4.5, map.plotTop + 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGlowingDot(ctx, x, y, r, color, glow, pulse = 0) {
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 10 + pulse * 4;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TWO_PI);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#F8FAFC';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
}

// ===========================================================================
// PART 1: StateSpaceGraphLab (Synchronized 3-Panel Interactive Lab)
// ===========================================================================
export class StateSpaceGraphLab {
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
    this.cursorIdx = Math.round(this._sim.N * 0.38);
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
      { w: 0, h: 140 },
      { w: 0, h: 112 },
      { w: 0, h: 108 },
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
        'el-ss-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer';
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
    const statePill = makePill('bg-slate-900/90 border-slate-700 text-slate-200');
    const metricPill1 = makePill('bg-emerald-500/10 border-emerald-400/45 text-emerald-200');
    const metricPill2 = makePill('bg-violet-500/10 border-violet-400/45 text-violet-200');
    const statusPill = makePill('font-bold tracking-wide');

    telemetryRow.append(tPill, statePill, metricPill1, metricPill2, statusPill);

    // Row 3: Unified Time Scrubber + Preset Parameter Slider
    const slidersGrid = document.createElement('div');
    slidersGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-3';

    // Time Scrubber + Play/Pause
    const timeRow = document.createElement('div');
    timeRow.className = 'flex items-center gap-1.5 sm:gap-2 min-w-0';

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className =
      'el-ss-pill shrink-0 w-7 h-6 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 text-[11px] font-bold flex items-center justify-center cursor-pointer';
    playBtn.setAttribute('aria-label', 'Play or pause time cursor');
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
    timeSlider.className = 'el-ss-slider flex-1 min-w-0';
    timeSlider.min = '0';
    timeSlider.max = String(this._sim.N - 1);
    timeSlider.step = '1';
    timeSlider.setAttribute('aria-label', 'Time step cursor t');
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

    // Preset Parameter Slider
    const paramRow = document.createElement('div');
    paramRow.className = 'flex items-center gap-1.5 sm:gap-2 min-w-0';

    const paramLabel = document.createElement('label');
    paramLabel.className =
      'shrink-0 text-[10px] sm:text-[11px] font-mono font-semibold text-violet-200/90 tracking-tight';
    this._paramLabelEl = paramLabel;

    const paramSlider = document.createElement('input');
    paramSlider.type = 'range';
    paramSlider.className = 'el-ss-slider el-ss-slider-param flex-1 min-w-0';
    paramSlider.min = '0';
    paramSlider.max = '1000';
    paramSlider.step = '1';
    paramSlider.setAttribute('aria-label', 'Preset tuning parameter');
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
      statePill,
      metricPill1,
      metricPill2,
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
      'Synchronized 3-panel state-space inspector: Phase Portrait, State Tracking, and Control Effort or Kalman Gain; drag any panel or use arrow keys to scrub time'
    );

    const panelDots = [COLORS.emerald, COLORS.cyan, COLORS.amber];
    const panelHeights = [
      'h-[138px] sm:h-[178px]',
      'h-[112px] sm:h-[142px]',
      'h-[108px] sm:h-[136px]',
    ];
    const panelCursors = ['cursor-crosshair', 'cursor-ew-resize', 'cursor-ew-resize'];

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
      canvas.className = 'el-ss-canvas h-full';
      canvas.style.touchAction = 'none';
      canvasWrap.appendChild(canvas);
      panel.appendChild(canvasWrap);

      stackWrap.appendChild(panel);

      this._canvases.push(canvas);
      this._ctxs.push(canvas.getContext('2d'));
      this._sizes[i] = { w: 0, h: i === 0 ? 138 : i === 1 ? 112 : 108 };
      this._panelMetaEls.push({ titleEl, readoutEl, canvasWrap });
    }

    this._bindPhasePointerEvents(this._canvases[0], signal);
    this._bindTimePointerEvents(this._canvases[1], 1, signal);
    this._bindTimePointerEvents(this._canvases[2], 2, signal);

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
      footerNote.textContent = 'Drag any canvas or scrub t to inspect coupled phase geometry, beliefs & actuator limits.';

      const ctaBtn = document.createElement('button');
      ctaBtn.type = 'button';
      ctaBtn.className =
        'el-ss-pill w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-100 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(34,211,238,0.16)]';
      ctaBtn.textContent = 'Test Your Intuition: State-Space Visual Quiz →';
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

    // Position cursor at the most pedagogically revealing moment for each preset
    if (key === 'mhe-graph') {
      this.cursorIdx = this._sim.outlierMainIdx + 2;
    } else if (key === 'mpc-cbf') {
      this.cursorIdx = Math.round(this._sim.N * 0.36);
    } else if (key === 'ukf-nonlinear') {
      this.cursorIdx = Math.round(this._sim.N * 0.48);
    } else if (key === 'kf-fusion') {
      this.cursorIdx = Math.round(this._sim.N * 0.32);
    } else {
      this.cursorIdx = Math.round(this._sim.N * 0.28);
    }

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
    let t;
    if (p.paramLog) {
      t = (Math.log(clamped) - Math.log(p.paramMin)) / (Math.log(p.paramMax) - Math.log(p.paramMin));
    } else {
      t = (clamped - p.paramMin) / (p.paramMax - p.paramMin);
    }
    return Math.round(clamp(t, 0, 1) * 1000);
  }

  _sliderPosToParam(pos) {
    const p = this._preset;
    const t = clamp(pos / 1000, 0, 1);
    let v;
    if (p.paramLog) {
      v = Math.exp(Math.log(p.paramMin) + t * (Math.log(p.paramMax) - Math.log(p.paramMin)));
    } else {
      v = p.paramMin + t * (p.paramMax - p.paramMin);
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
      this._throttledTick();
      this._markInteracted();
    }
  }

  _applyCursorIndex(idx, fromUser = false) {
    const nextIdx = clamp(Math.round(idx), 0, this._sim.N - 1);
    if (nextIdx === this.cursorIdx) return;
    this.cursorIdx = nextIdx;
    this._syncControlUI();
    this._drawAll();
    if (fromUser) {
      this._throttledTick();
      this._markInteracted();
    }
  }

  _throttledTick() {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this._lastTickMs > 55) {
      this._lastTickMs = now;
      safeSound('playTick');
    }
  }

  _markInteracted() {
    if (this._hasInteracted) return;
    this._hasInteracted = true;
    try {
      this.onInteract?.();
    } catch (_) {
      // Ignore
    }
  }

  _bindPhasePointerEvents(canvas, signal) {
    const snapToNearestStep = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return;
      const pad = getPanelPad(rect.width, true);
      const b = this._sim.phaseBounds;
      const map = createPlotMapper(rect.width, rect.height, pad, b.xMin, b.xMax, b.yMin, b.yMax);
      const lx = clientX - rect.left;
      const ly = clientY - rect.top;

      let bestIdx = this.cursorIdx;
      let bestDist = Infinity;
      for (let i = 0; i < this._sim.N; i++) {
        const d = Math.hypot(map.xToPx(this._sim.x1[i]) - lx, map.yToPx(this._sim.x2[i]) - ly);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      this._isPlaying = false;
      this._applyCursorIndex(bestIdx, true);
    };

    canvas.addEventListener(
      'pointerdown',
      (e) => {
        e.preventDefault();
        this._isDraggingPanel = 0;
        this._activePointerId = e.pointerId;
        canvas.setPointerCapture?.(e.pointerId);
        snapToNearestStep(e.clientX, e.clientY);
      },
      { signal }
    );

    canvas.addEventListener(
      'pointermove',
      (e) => {
        if (this._isDraggingPanel !== 0 || e.pointerId !== this._activePointerId) return;
        snapToNearestStep(e.clientX, e.clientY);
      },
      { signal }
    );

    const endDrag = (e) => {
      if (this._isDraggingPanel === 0 && e.pointerId === this._activePointerId) {
        this._isDraggingPanel = -1;
        this._activePointerId = null;
      }
    };
    canvas.addEventListener('pointerup', endDrag, { signal });
    canvas.addEventListener('pointercancel', endDrag, { signal });
  }

  _bindTimePointerEvents(canvas, panelIdx, signal) {
    const scrubTime = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 20) return;
      const pad = getPanelPad(rect.width);
      const map = createPlotMapper(rect.width, rect.height, pad, 0, this._sim.T, 0, 1);
      const t = clamp(map.pxToX(clientX - rect.left), 0, this._sim.T);
      const idx = Math.round((t / this._sim.T) * (this._sim.N - 1));
      this._isPlaying = false;
      this._applyCursorIndex(idx, true);
    };

    canvas.addEventListener(
      'pointerdown',
      (e) => {
        e.preventDefault();
        this._isDraggingPanel = panelIdx;
        this._activePointerId = e.pointerId;
        canvas.setPointerCapture?.(e.pointerId);
        scrubTime(e.clientX);
      },
      { signal }
    );

    canvas.addEventListener(
      'pointermove',
      (e) => {
        if (this._isDraggingPanel !== panelIdx || e.pointerId !== this._activePointerId) return;
        scrubTime(e.clientX);
      },
      { signal }
    );

    const endDrag = (e) => {
      if (this._isDraggingPanel === panelIdx && e.pointerId === this._activePointerId) {
        this._isDraggingPanel = -1;
        this._activePointerId = null;
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

    // Active preset pill styling
    for (const [key, btn] of this._presetButtons.entries()) {
      const isActive = key === p.key;
      btn.className = isActive
        ? 'el-ss-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border cursor-pointer bg-cyan-400/15 border-cyan-400/70 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.22)]'
        : 'el-ss-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700';
    }

    // Sliders & Play button
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
      this._paramLabelEl.textContent = mech ? p.paramLabelMech : p.paramLabelMath;
    }
    if (this._paramSliderEl) {
      this._paramSliderEl.value = String(this._paramToSliderPos(this._getParamVal()));
    }
    if (this._paramValEl) {
      this._paramValEl.textContent = p.paramFmt(this._getParamVal());
    }

    // Panel titles & readouts (Mechatronics Lens relabeling)
    const s1Sym = mech ? 'θ' : 'x₁';
    const s2Sym = mech ? 'ω' : 'x₂';
    const uSym = mech ? 'τ' : 'u';

    let titles;
    let readouts;
    if (p.key === 'lqr-cart') {
      titles = mech
        ? ['Phase Portrait (θ vs ω) & Lyapunov Ellipses', 'Joint Angle θ(t) & Rate ω(t) Regulation', 'Motor Torque τ(t) vs ±τ_max Limits']
        : ['Phase Portrait (x₁ vs x₂) & Lyapunov xᵀPx = c', 'State Regulation x₁(t) & x₂(t)', 'Actuator Effort u(t) vs ±u_max Limits'];
      readouts = [
        `V=${fmtPlain(sim.lyapV[k], 2)}`,
        `${s1Sym}=${fmtSigned(sim.x1[k], 2)}`,
        `${uSym}=${fmtSigned(sim.u[k], 2)}`,
      ];
    } else if (p.key === 'mpc-cbf') {
      titles = mech
        ? ['Safety Barrier h(θ)≥0: MPC+CBF vs LQR', 'Joint Angle θ(t) vs Hard Wall Stop', 'Motor Torque τ(t) Preview Braking vs ±τ_max']
        : ['Phase Portrait & Safety Set h(x)≥0 vs h(x)<0', 'Constrained State x₁(t): MPC+CBF vs LQR', 'Actuator Effort u(t) vs ±u_max Rails'];
      readouts = [
        `h=${fmtSigned(sim.hVal[k], 2)}`,
        `LQR ${sim.x1Lqr[k] > sim.xWall ? 'BREACH' : fmtSigned(sim.x1Lqr[k], 2)}`,
        `${uSym}=${fmtSigned(sim.u[k], 2)}`,
      ];
    } else if (p.key === 'kf-fusion') {
      titles = mech
        ? ['Belief Portrait (θ, ω): 2σ Prior → Posterior', 'True θ(t) vs Encoder & KF Estimate ±2σ', 'Kalman Gain K_k & Estimation Error |e|']
        : ['Phase Belief (x₁, x₂): 2σ Prior → Posterior', 'True x₁(t), Sensor z_k & Estimate x̂₁ ±2σ', 'Kalman Gain K_k & Error |x₁ − x̂₁|'];
      readouts = [
        `2σ=${fmtPlain(2 * sim.sigma1[k], 2)}`,
        `z=${fmtSigned(sim.z[k], 2)}`,
        `K=${fmtPlain(sim.gainK[k], 2)}`,
      ];
    } else if (p.key === 'ukf-nonlinear') {
      titles = mech
        ? ['Nonlinear Polar Cloud: 5 UKF Sigma Pts vs EKF', 'True θ(t) vs UKF ±2σ & Biased EKF', 'Effective Gain K_k & UKF vs EKF Error']
        : ['Nonlinear Banana Cloud: 5 UKF Sigma Pts vs EKF', 'True x₁(t), UKF x̂₁ ±2σ vs EKF Drift', 'Effective Gain K_k & |e| (UKF vs EKF)'];
      readouts = [
        `5 σ-pts`,
        `UKF ${fmtSigned(sim.x1Hat[k], 2)}`,
        `e_UKF=${fmtPlain(sim.errPrimary[k], 2)}`,
      ];
    } else {
      titles = mech
        ? [`Factor-Graph Window (W=${sim.W}): MHE vs EKF`, 'True θ(t) vs Outlier Glitch & MHE ±2σ', 'Huber Weight K_k & MHE vs EKF Error']
        : [`Factor-Graph Window (W=${sim.W}): MHE vs 1-Step EKF`, 'True x₁(t), Outlier z_k & MHE x̂₁ ±2σ', 'Robust Gain K_k & |e| (MHE vs EKF)'];
      readouts = [
        sim.isOutlier[k] ? 'OUTLIER REJECTED' : `W=${sim.W} nodes`,
        `MHE ${fmtSigned(sim.x1Hat[k], 2)}`,
        `e_MHE=${fmtPlain(sim.errPrimary[k], 2)}`,
      ];
    }

    for (let i = 0; i < 3; i++) {
      if (this._panelMetaEls[i]) {
        this._panelMetaEls[i].titleEl.textContent = titles[i];
        this._panelMetaEls[i].readoutEl.textContent = readouts[i];
      }
    }

    // Telemetry strip pills
    const { tPill, statePill, metricPill1, metricPill2, statusPill, formulaEl, insightEl } = this._telemetryEls;
    if (tPill) tPill.textContent = `k=${k} (${fmtPlain(sim.t[k], 2)}s)`;
    if (statePill) statePill.textContent = `${s1Sym}=${fmtSigned(sim.x1[k], 2)}, ${s2Sym}=${fmtSigned(sim.x2[k], 2)}`;

    if (p.mode === 'control') {
      if (metricPill1) metricPill1.textContent = `${uSym} = ${fmtSigned(sim.u[k], 2)}`;
      if (p.key === 'lqr-cart') {
        if (metricPill2) metricPill2.textContent = `K=[${fmtPlain(sim.K[0], 1)}, ${fmtPlain(sim.K[1], 1)}]`;
        const sat = Math.abs(sim.u[k]) > sim.uMax;
        if (statusPill) {
          statusPill.textContent = sat ? '▲ ABOVE u_max' : '● OPTIMAL LQR';
          statusPill.className =
            'shrink-0 whitespace-nowrap px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wide border ' +
            (sat
              ? 'bg-amber-500/15 border-amber-400/60 text-amber-200'
              : 'bg-emerald-400/15 border-emerald-400/55 text-emerald-300');
        }
      } else {
        if (metricPill2) metricPill2.textContent = `h(x)=${fmtSigned(sim.hVal[k], 2)}`;
        const lqrBreached = sim.x1Lqr[k] > sim.xWall;
        if (statusPill) {
          statusPill.textContent = lqrBreached ? '● MPC SAFE • LQR BREACH' : '● CBF INVARIANT';
          statusPill.className =
            'shrink-0 whitespace-nowrap px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wide border ' +
            (lqrBreached
              ? 'bg-emerald-400/15 border-emerald-400/60 text-emerald-200'
              : 'bg-cyan-400/15 border-cyan-400/55 text-cyan-200');
        }
      }
    } else {
      if (metricPill1) metricPill1.textContent = `K_k = ${fmtPlain(sim.gainK[k], 2)}`;
      if (metricPill2) metricPill2.textContent = `|e| = ${fmtPlain(sim.errPrimary[k], 2)}`;
      if (statusPill) {
        if (p.key === 'mhe-graph' && sim.isOutlier[k]) {
          statusPill.textContent = '★ HUBER REJECTS SPIKE';
          statusPill.className =
            'shrink-0 whitespace-nowrap px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wide border bg-emerald-400/20 border-emerald-400/70 text-emerald-200';
        } else {
          statusPill.textContent =
            p.key === 'kf-fusion'
              ? '● BAYES OPTIMAL'
              : p.key === 'ukf-nonlinear'
              ? '● 5 SIGMA LOCKED'
              : '● GRAPH SMOOTHED';
          statusPill.className =
            'shrink-0 whitespace-nowrap px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wide border bg-emerald-400/15 border-emerald-400/55 text-emerald-300';
        }
      }
    }

    if (formulaEl) {
      formulaEl.innerHTML = `
        <span class="text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
          ${p.mode === 'control' ? (mech ? 'Controller' : 'Optimal Law') : (mech ? 'Observer' : 'Estimator')}
        </span>
        <span>${formatKatex(p.formulaTex, false)}</span>
      `;
    }
    if (insightEl) {
      insightEl.textContent = mech ? p.insightMech : p.insightMath;
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
      this._pulsePhase = (this._pulsePhase + dt * 2.8) % TWO_PI;

      if (this._isPlaying) {
        this._playAccum += dt;
        if (this._playAccum >= 0.055) {
          this._playAccum = 0;
          const next = (this.cursorIdx + 1) % this._sim.N;
          this.cursorIdx = next;
          this._syncControlUI();
        }
      }

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

    for (let i = 0; i < 3; i++) {
      const ctx = this._ctxs[i];
      const { w, h } = this._sizes[i];
      if (!ctx || w < 20 || h < 20) continue;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (i === 0) this._drawPanel1Phase(ctx, w, h, pulse);
      else if (i === 1) this._drawPanel2Tracking(ctx, w, h, pulse);
      else this._drawPanel3EffortOrGain(ctx, w, h, pulse);
    }
  }

  // -------------------------------------------------------------------------
  // PANEL 1: Phase Portrait (x1 vs x2) & Mode-Specific Belief/Safety Geometry
  // -------------------------------------------------------------------------
  _drawPanel1Phase(ctx, w, h, pulse) {
    const sim = this._sim;
    const k = clamp(this.cursorIdx, 0, sim.N - 1);
    const compact = w < 430;
    const pad = getPanelPad(w, true);
    const b = sim.phaseBounds;
    const map = createPlotMapper(w, h, pad, b.xMin, b.xMax, b.yMin, b.yMax);

    const xLbl = this.mechatronicsLens ? 'θ (rad)' : 'x₁';
    const yLbl = this.mechatronicsLens ? 'ω (rad/s)' : 'x₂';

    drawCartesianGrid(ctx, w, h, map, {
      xTicks: [-2, -1, 0, 1, 2],
      yTicks: [-2, -1, 0, 1, 2],
      xLabel: xLbl,
      yLabel: yLbl,
      compact,
    });

    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    if (sim.presetKey === 'lqr-cart') {
      // Concentric LQR Lyapunov level-set ellipses x^T P x = c
      const v0 = Math.max(0.4, sim.lyapV[0]);
      const levels = [0.08 * v0, 0.25 * v0, 0.55 * v0, 1.0 * v0];
      for (const c of levels) {
        const pts = sampleEllipsePoints(0, 0, sim.pInv.i11 * c, sim.pInv.i12 * c, sim.pInv.i22 * c, 1.0, 64);
        drawPolygonPath(ctx, map, pts);
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.28)';
        ctx.lineWidth = 1.1;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Highlighted live Lyapunov level set passing right through x(t)!
      const vc = sim.lyapV[k];
      if (vc > 1e-4) {
        const livePts = sampleEllipsePoints(0, 0, sim.pInv.i11 * vc, sim.pInv.i12 * vc, sim.pInv.i22 * vc, 1.0, 64);
        drawPolygonPath(ctx, map, livePts);
        ctx.fillStyle = 'rgba(52, 211, 153, 0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      // Origin target crosshair
      const ox = map.xToPx(0);
      const oy = map.yToPx(0);
      ctx.strokeStyle = COLORS.emerald;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(ox, oy, 4.5, 0, TWO_PI);
      ctx.stroke();

      // Optimal LQR trajectory
      ctx.strokeStyle = COLORS.cyan;
      ctx.shadowColor = COLORS.cyanGlow;
      ctx.shadowBlur = 9;
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      for (let i = 0; i < sim.N; i++) {
        const px = map.xToPx(sim.x1[i]);
        const py = map.yToPx(sim.x2[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Direction arrow midway
      const mid = Math.min(sim.N - 2, 10);
      const ang = Math.atan2(
        map.yToPx(sim.x2[mid + 1]) - map.yToPx(sim.x2[mid]),
        map.xToPx(sim.x1[mid + 1]) - map.xToPx(sim.x1[mid])
      );
      drawArrowHead(ctx, map.xToPx(sim.x1[mid]), map.yToPx(sim.x2[mid]), ang, 5.5, COLORS.cyan);

      // Live cursor dot
      drawGlowingDot(ctx, map.xToPx(sim.x1[k]), map.yToPx(sim.x2[k]), 5.2, COLORS.emerald, COLORS.emeraldGlow, pulse);

      drawCompactBadge(ctx, map.plotRight - (compact ? 86 : 96), map.plotTop + 5, 'xᵀPx = V(t)', COLORS.emerald, COLORS.emerald, compact);
    } else if (sim.presetKey === 'mpc-cbf') {
      const wallPx = map.xToPx(sim.xWall);

      // Emerald safe set h(x) >= 0 (left of wall)
      ctx.fillStyle = COLORS.emeraldFill;
      ctx.fillRect(map.plotLeft, map.plotTop, wallPx - map.plotLeft, map.plotH);

      // Coral unsafe set h(x) < 0 (right of wall)
      ctx.fillStyle = COLORS.coralFill;
      ctx.fillRect(wallPx, map.plotTop, map.plotRight - wallPx, map.plotH);

      // Braking curve x1 + x2^2 / (2 uMax) = xWall (zero-overshoot boundary)
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      for (let i = 0; i <= 50; i++) {
        const v = (2.6 * i) / 50;
        const xb = sim.xWall - (v * v) / (2 * sim.uMax);
        const px = map.xToPx(xb);
        const py = map.yToPx(v);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Glowing safety barrier boundary h(x) = 0
      ctx.save();
      ctx.strokeStyle = COLORS.coral;
      ctx.shadowColor = COLORS.coralGlow;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(wallPx, map.plotTop);
      ctx.lineTo(wallPx, map.plotBottom);
      ctx.stroke();
      ctx.restore();

      // Unconstrained / Clipped LQR trajectory (dashed Coral breaching wall!)
      ctx.strokeStyle = COLORS.coral;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 3.5]);
      ctx.beginPath();
      for (let i = 0; i < sim.N; i++) {
        const px = map.xToPx(sim.x1Lqr[i]);
        const py = map.yToPx(sim.x2Lqr[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Constrained MPC + CBF trajectory (solid glowing Emerald staying safe!)
      ctx.save();
      ctx.strokeStyle = COLORS.emerald;
      ctx.shadowColor = COLORS.emeraldGlow;
      ctx.shadowBlur = 9;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i < sim.N; i++) {
        const px = map.xToPx(sim.x1[i]);
        const py = map.yToPx(sim.x2[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      // Live cursors on both MPC+CBF and LQR
      drawGlowingDot(ctx, map.xToPx(sim.x1Lqr[k]), map.yToPx(sim.x2Lqr[k]), 4.2, COLORS.coral, COLORS.coralGlow, pulse);
      drawGlowingDot(ctx, map.xToPx(sim.x1[k]), map.yToPx(sim.x2[k]), 5.2, COLORS.emerald, COLORS.emeraldGlow, pulse);

      drawCompactBadge(ctx, map.plotLeft + 6, map.plotBottom - 20, 'Safe h≥0', COLORS.emerald, COLORS.emerald, compact);
      const unsafeX = clamp(wallPx + 5, map.plotLeft + 4, map.plotRight - (compact ? 64 : 74));
      drawCompactBadge(ctx, unsafeX, map.plotTop + 5, 'h(x)<0', COLORS.coral, COLORS.coral, compact);
    } else if (sim.presetKey === 'kf-fusion') {
      // True phase path (Cyan)
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < sim.N; i++) {
        const px = map.xToPx(sim.x1[i]);
        const py = map.yToPx(sim.x2[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // KF Posterior estimate path up to k (Emerald)
      ctx.strokeStyle = COLORS.emerald;
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      for (let i = 0; i <= k; i++) {
        const px = map.xToPx(sim.x1Hat[i]);
        const py = map.yToPx(sim.x2Hat[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Measurement vertical slice z_k (Coral dashed line)
      const zPx = map.xToPx(sim.z[k]);
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(zPx, map.plotTop);
      ctx.lineTo(zPx, map.plotBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2-sigma Cyan PRIOR ellipse P_{k|k-1}
      const [pp11, pp12, pp22] = sim.Pprior[k];
      const priorPts = sampleEllipsePoints(sim.x1Prior[k], sim.x2Prior[k], pp11, pp12, pp22, 2.0, 64);
      drawPolygonPath(ctx, map, priorPts);
      ctx.fillStyle = 'rgba(34, 211, 238, 0.13)';
      ctx.fill();
      ctx.strokeStyle = COLORS.cyan;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2-sigma Emerald POSTERIOR ellipse P_{k|k} (visibly shrunk!)
      const [po11, po12, po22] = sim.Ppost[k];
      const postPts = sampleEllipsePoints(sim.x1Hat[k], sim.x2Hat[k], po11, po12, po22, 2.0, 64);
      drawPolygonPath(ctx, map, postPts);
      ctx.fillStyle = 'rgba(52, 211, 153, 0.22)';
      ctx.fill();
      ctx.strokeStyle = COLORS.emerald;
      ctx.shadowColor = COLORS.emeraldGlow;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2.0;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // True state & posterior mean markers
      drawGlowingDot(ctx, map.xToPx(sim.x1[k]), map.yToPx(sim.x2[k]), 3.8, COLORS.cyan, COLORS.cyanGlow, 0);
      drawGlowingDot(ctx, map.xToPx(sim.x1Hat[k]), map.yToPx(sim.x2Hat[k]), 4.8, COLORS.emerald, COLORS.emeraldGlow, pulse);

      drawCompactBadge(ctx, map.plotRight - (compact ? 116 : 132), map.plotTop + 5, '2σ Prior→Post', COLORS.cyan, COLORS.cyan, compact);
    } else if (sim.presetKey === 'ukf-nonlinear') {
      const snap = sim.stepClouds[k];

      // True orbital path (Cyan)
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < sim.N; i++) {
        const px = map.xToPx(sim.x1[i]);
        const py = map.yToPx(sim.x2[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // True nonlinear BANANA particle cloud!
      ctx.fillStyle = 'rgba(34, 211, 238, 0.42)';
      for (const pt of snap.bananaPts) {
        ctx.beginPath();
        ctx.arc(map.xToPx(pt.x), map.yToPx(pt.y), 2.1, 0, TWO_PI);
        ctx.fill();
      }

      // Mismatched dashed Amber EKF linear ellipse
      const [ec11, ec12, ec22] = snap.ekfCov;
      const ekfPts = sampleEllipsePoints(snap.ekfMean.x, snap.ekfMean.y, ec11, ec12, ec22, 1.85, 64);
      drawPolygonPath(ctx, map, ekfPts);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.fill();
      ctx.strokeStyle = COLORS.amber;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 3.5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Matched Emerald UKF covariance ellipse
      const [uc11, uc12, uc22] = snap.ukfCov;
      const ukfPts = sampleEllipsePoints(snap.ukfMean.x, snap.ukfMean.y, uc11, uc12, uc22, 1.85, 64);
      drawPolygonPath(ctx, map, ukfPts);
      ctx.fillStyle = 'rgba(52, 211, 153, 0.14)';
      ctx.fill();
      ctx.strokeStyle = COLORS.emerald;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // 5 glowing Violet UKF sigma points!
      for (let s = 0; s < snap.sigmas.length; s++) {
        const sp = snap.sigmas[s];
        drawGlowingDot(
          ctx,
          map.xToPx(sp.x),
          map.yToPx(sp.y),
          s === 0 ? 4.8 : 4.0,
          COLORS.violet,
          COLORS.violetGlow,
          pulse
        );
      }

      drawCompactBadge(ctx, map.plotLeft + 6, map.plotBottom - 20, '5 UKF σ-pts', COLORS.violet, COLORS.violet, compact);
      drawCompactBadge(ctx, map.plotRight - (compact ? 86 : 96), map.plotTop + 5, 'EKF Linear', COLORS.amber, COLORS.amberLight, compact);
    } else {
      // 'mhe-graph': Connected Factor-Graph Window rejecting Coral outlier spike!
      // True curve
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < sim.N; i++) {
        const px = map.xToPx(sim.x1[i]);
        const py = map.yToPx(sim.x2[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Derailed Single-Step EKF trajectory (dashed Amber/Coral)
      ctx.strokeStyle = COLORS.amber;
      ctx.lineWidth = 1.7;
      ctx.setLineDash([4.5, 3]);
      ctx.beginPath();
      for (let i = 0; i <= k; i++) {
        const px = map.xToPx(sim.x1Ekf[i]);
        const py = map.yToPx(sim.x2Ekf[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Smooth MHE/GTSAM full path up to k
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.52)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i <= k; i++) {
        const px = map.xToPx(sim.x1Hat[i]);
        const py = map.yToPx(sim.x2Hat[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Active Factor-Graph Window [start .. k]: glowing Emerald chain + factor edges to measurements
      const start = Math.max(0, k - sim.W + 1);
      ctx.save();
      ctx.strokeStyle = COLORS.emerald;
      ctx.shadowColor = COLORS.emeraldGlow;
      ctx.shadowBlur = 9;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (let j = start; j <= k; j++) {
        const px = map.xToPx(sim.x1Hat[j]);
        const py = map.yToPx(sim.x2Hat[j]);
        if (j === start) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      // Factor nodes + measurement factor edges inside window
      for (let j = start; j <= k; j++) {
        const nx = map.xToPx(sim.x1Hat[j]);
        const ny = map.yToPx(sim.x2Hat[j]);
        const zx = map.xToPx(sim.z[j]);
        const zy = map.yToPx(sim.z2[j]);

        // Measurement factor edge
        ctx.save();
        if (sim.isOutlier[j]) {
          ctx.strokeStyle = 'rgba(251, 113, 133, 0.72)';
          ctx.lineWidth = 1.4;
          ctx.setLineDash([3, 3]);
        } else {
          ctx.strokeStyle = 'rgba(167, 139, 250, 0.35)';
          ctx.lineWidth = 1.0;
        }
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(zx, zy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Measurement dot
        ctx.fillStyle = sim.isOutlier[j] ? COLORS.coral : 'rgba(251, 113, 133, 0.6)';
        ctx.beginPath();
        ctx.arc(zx, zy, sim.isOutlier[j] ? 4.4 : 2.3, 0, TWO_PI);
        ctx.fill();

        // Factor graph state node
        ctx.fillStyle = j === k ? COLORS.emerald : '#10B981';
        ctx.strokeStyle = '#F8FAFC';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(nx, ny, j === k ? 4.8 : 3.2, 0, TWO_PI);
        ctx.fill();
        ctx.stroke();
      }

      // Highlight EKF position at k so derailment is obvious
      drawGlowingDot(ctx, map.xToPx(sim.x1Ekf[k]), map.yToPx(sim.x2Ekf[k]), 4.0, COLORS.amber, COLORS.amberGlow, 0);

      drawCompactBadge(ctx, map.plotLeft + 6, map.plotBottom - 20, `MHE W=${sim.W}`, COLORS.emerald, COLORS.emerald, compact);
      drawCompactBadge(ctx, map.plotRight - (compact ? 76 : 86), map.plotTop + 5, '1-Step EKF', COLORS.amber, COLORS.amberLight, compact);
    }

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // PANEL 2: State Tracking x(t) vs Estimate x̂(t) & ±2σ Confidence Band
  // -------------------------------------------------------------------------
  _drawPanel2Tracking(ctx, w, h, pulse) {
    const sim = this._sim;
    const k = clamp(this.cursorIdx, 0, sim.N - 1);
    const compact = w < 430;
    const pad = getPanelPad(w);
    const tb = sim.trackBounds;
    const map = createPlotMapper(w, h, pad, 0, sim.T, tb.yMin, tb.yMax);

    const s1Lbl = this.mechatronicsLens ? 'θ(t)' : 'x₁(t)';
    drawCartesianGrid(ctx, w, h, map, {
      xTicks: [0, 1, 2, 3, 4, 5, 6],
      yTicks: [-2, -1, 0, 1, 2],
      xLabel: 't (s)',
      yLabel: s1Lbl,
      compact,
    });

    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    if (sim.presetKey === 'lqr-cart') {
      // Secondary velocity x2(t) in subtle dashed Violet
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.55)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      for (let i = 0; i < sim.N; i++) {
        const px = map.xToPx(sim.t[i]);
        const py = map.yToPx(sim.x2[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Primary state x1(t) in glowing Cyan
      ctx.strokeStyle = COLORS.cyan;
      ctx.shadowColor = COLORS.cyanGlow;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < sim.N; i++) {
        const px = map.xToPx(sim.t[i]);
        const py = map.yToPx(sim.x1[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      drawCursorLine(ctx, map, sim.t[k], pulse);
      drawGlowingDot(ctx, map.xToPx(sim.t[k]), map.yToPx(sim.x1[k]), 4.4, COLORS.cyan, COLORS.cyanGlow, pulse);
    } else if (sim.presetKey === 'mpc-cbf') {
      // Coral unsafe ceiling x > xWall
      const yWall = map.yToPx(sim.xWall);
      ctx.fillStyle = COLORS.coralFill;
      ctx.fillRect(map.plotLeft, map.plotTop, map.plotW, Math.max(0, yWall - map.plotTop));

      ctx.strokeStyle = COLORS.coral;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(map.plotLeft, yWall);
      ctx.lineTo(map.plotRight, yWall);
      ctx.stroke();
      ctx.setLineDash([]);

      // Reference target xRef
      const yRef = map.yToPx(sim.xRef);
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2.5, 3]);
      ctx.beginPath();
      ctx.moveTo(map.plotLeft, yRef);
      ctx.lineTo(map.plotRight, yRef);
      ctx.stroke();
      ctx.setLineDash([]);

      // Breaching LQR curve (dashed Coral)
      ctx.strokeStyle = COLORS.coral;
      ctx.lineWidth = 1.7;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      for (let i = 0; i < sim.N; i++) {
        const px = map.xToPx(sim.t[i]);
        const py = map.yToPx(sim.x1Lqr[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Safe MPC+CBF curve (solid glowing Emerald)
      ctx.strokeStyle = COLORS.emerald;
      ctx.shadowColor = COLORS.emeraldGlow;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      for (let i = 0; i < sim.N; i++) {
        const px = map.xToPx(sim.t[i]);
        const py = map.yToPx(sim.x1[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      drawCursorLine(ctx, map, sim.t[k], pulse);
      drawGlowingDot(ctx, map.xToPx(sim.t[k]), map.yToPx(sim.x1Lqr[k]), 3.8, COLORS.coral, COLORS.coralGlow, 0);
      drawGlowingDot(ctx, map.xToPx(sim.t[k]), map.yToPx(sim.x1[k]), 4.5, COLORS.emerald, COLORS.emeraldGlow, pulse);

      drawCompactBadge(ctx, map.plotRight - (compact ? 70 : 80), map.plotTop + 4, 'Wall h=0', COLORS.coral, COLORS.coral, compact);
    } else {
      // Estimation modes: ±2σ confidence band, Coral measurements z_k, Cyan true x1, Emerald estimate x̂1 (+ Amber EKF comparison)
      // 1. Shaded ±2σ envelope around x̂1
      ctx.fillStyle = 'rgba(52, 211, 153, 0.16)';
      ctx.beginPath();
      for (let i = 0; i < sim.N; i++) {
        const px = map.xToPx(sim.t[i]);
        const py = map.yToPx(sim.x1Hat[i] + 2 * sim.sigma1[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      for (let i = sim.N - 1; i >= 0; i--) {
        ctx.lineTo(map.xToPx(sim.t[i]), map.yToPx(sim.x1Hat[i] - 2 * sim.sigma1[i]));
      }
      ctx.closePath();
      ctx.fill();

      // 2. Noisy Coral measurement dots z_k
      for (let i = 0; i < sim.N; i++) {
        const px = map.xToPx(sim.t[i]);
        const py = map.yToPx(sim.z[i]);
        const isOut = sim.isOutlier && sim.isOutlier[i];
        ctx.fillStyle = isOut ? COLORS.coral : 'rgba(251, 113, 133, 0.56)';
        ctx.beginPath();
        ctx.arc(px, py, isOut ? 4.2 : 2.1, 0, TWO_PI);
        ctx.fill();
        if (isOut) {
          ctx.strokeStyle = '#F8FAFC';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // 3. Optional Amber dashed naive EKF estimate (for UKF & MHE modes)
      if (sim.x1Ekf) {
        ctx.strokeStyle = COLORS.amber;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4.5, 3]);
        ctx.beginPath();
        for (let i = 0; i < sim.N; i++) {
          const px = map.xToPx(sim.t[i]);
          const py = map.yToPx(sim.x1Ekf[i]);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 4. True state x1(t) (Cyan)
      ctx.strokeStyle = COLORS.cyan;
      ctx.lineWidth = 1.85;
      ctx.beginPath();
      for (let i = 0; i < sim.N; i++) {
        const px = map.xToPx(sim.t[i]);
        const py = map.yToPx(sim.x1[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 5. Primary estimate x̂1(t) (glowing Emerald)
      ctx.strokeStyle = COLORS.emerald;
      ctx.shadowColor = COLORS.emeraldGlow;
      ctx.shadowBlur = 7;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < sim.N; i++) {
        const px = map.xToPx(sim.t[i]);
        const py = map.yToPx(sim.x1Hat[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Outlier spike badge for MHE mode
      if (sim.presetKey === 'mhe-graph') {
        const ox = clamp(map.xToPx(sim.t[sim.outlierMainIdx]) + 6, map.plotLeft + 4, map.plotRight - 72);
        const oy = clamp(map.yToPx(sim.z[sim.outlierMainIdx]) - 8, map.plotTop + 4, map.plotBottom - 20);
        drawCompactBadge(ctx, ox, oy, 'Outlier z_k', COLORS.coral, COLORS.coral, compact);
      }

      drawCursorLine(ctx, map, sim.t[k], pulse);
      drawGlowingDot(ctx, map.xToPx(sim.t[k]), map.yToPx(sim.x1Hat[k]), 4.4, COLORS.emerald, COLORS.emeraldGlow, pulse);

      drawCompactBadge(ctx, map.plotRight - (compact ? 64 : 74), map.plotBottom - 20, '±2σ band', COLORS.emerald, COLORS.emerald, compact);
    }

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // PANEL 3: Actuator Effort u(t) vs ±u_max OR Kalman Gain K_k & Error |e|
  // -------------------------------------------------------------------------
  _drawPanel3EffortOrGain(ctx, w, h, pulse) {
    const sim = this._sim;
    const k = clamp(this.cursorIdx, 0, sim.N - 1);
    const compact = w < 430;
    const pad = getPanelPad(w);

    if (sim.mode === 'control') {
      const eb = sim.effortBounds;
      const map = createPlotMapper(w, h, pad, 0, sim.T, eb.yMin, eb.yMax);
      const uLbl = this.mechatronicsLens ? 'τ(t)' : 'u(t)';

      drawCartesianGrid(ctx, w, h, map, {
        xTicks: [0, 1, 2, 3, 4, 5, 6],
        yTicks: [-3, 0, 3],
        xLabel: 't (s)',
        yLabel: uLbl,
        compact,
      });

      ctx.save();
      ctx.beginPath();
      ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
      ctx.clip();

      // Dashed Amber ±u_max constraint rails
      const yPosMax = map.yToPx(sim.uMax);
      const yNegMax = map.yToPx(-sim.uMax);
      ctx.strokeStyle = COLORS.amber;
      ctx.lineWidth = 1.45;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(map.plotLeft, yPosMax);
      ctx.lineTo(map.plotRight, yPosMax);
      ctx.moveTo(map.plotLeft, yNegMax);
      ctx.lineTo(map.plotRight, yNegMax);
      ctx.stroke();
      ctx.setLineDash([]);

      // Subtle shaded saturation zones outside ±u_max
      ctx.fillStyle = 'rgba(245, 158, 11, 0.07)';
      ctx.fillRect(map.plotLeft, map.plotTop, map.plotW, Math.max(0, yPosMax - map.plotTop));
      ctx.fillRect(map.plotLeft, yNegMax, map.plotW, Math.max(0, map.plotBottom - yNegMax));

      // Clipped LQR effort overlay in mpc-cbf mode
      if (sim.uLqr) {
        ctx.strokeStyle = COLORS.coral;
        ctx.lineWidth = 1.65;
        ctx.setLineDash([4.5, 3]);
        ctx.beginPath();
        for (let i = 0; i < sim.N; i++) {
          const px = map.xToPx(sim.t[i]);
          const py = map.yToPx(sim.uLqr[i]);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Optimal control u(t)
      const mainColor = sim.presetKey === 'mpc-cbf' ? COLORS.emerald : COLORS.cyan;
      const mainGlow = sim.presetKey === 'mpc-cbf' ? COLORS.emeraldGlow : COLORS.cyanGlow;
      ctx.strokeStyle = mainColor;
      ctx.shadowColor = mainGlow;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < sim.N; i++) {
        const px = map.xToPx(sim.t[i]);
        const py = map.yToPx(sim.u[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      drawCursorLine(ctx, map, sim.t[k], pulse);
      const uAtK = sim.u[k];
      const overRail = Math.abs(uAtK) > sim.uMax + 0.02;
      drawGlowingDot(
        ctx,
        map.xToPx(sim.t[k]),
        map.yToPx(uAtK),
        4.5,
        overRail ? COLORS.coral : mainColor,
        overRail ? COLORS.coralGlow : mainGlow,
        pulse
      );

      const railLabel = this.mechatronicsLens ? `±τ_max=${fmtPlain(sim.uMax, 1)}` : `±u_max=${fmtPlain(sim.uMax, 1)}`;
      drawCompactBadge(ctx, map.plotRight - (compact ? 78 : 88), map.plotTop + 4, railLabel, COLORS.amber, COLORS.amberLight, compact);

      ctx.restore();
      return;
    }

    // Estimation modes: Kalman Gain K_k (Violet) + Estimation Error |e| (Emerald vs Amber/Coral baseline)
    const mb = sim.metricBounds;
    const map = createPlotMapper(w, h, pad, 0, sim.T, mb.yMin, mb.yMax);

    drawCartesianGrid(ctx, w, h, map, {
      xTicks: [0, 1, 2, 3, 4, 5, 6],
      yTicks: [0, 0.5, 1.0],
      xLabel: 't (s)',
      yLabel: 'K_k / |e|',
      compact,
    });

    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    // Baseline error (raw sensor error for KF, or naive EKF error for UKF/MHE)
    ctx.strokeStyle = sim.presetKey === 'kf-fusion' ? 'rgba(251, 113, 133, 0.45)' : COLORS.amber;
    ctx.lineWidth = sim.presetKey === 'kf-fusion' ? 1.25 : 1.7;
    ctx.setLineDash([4.5, 3]);
    ctx.beginPath();
    for (let i = 0; i < sim.N; i++) {
      const px = map.xToPx(sim.t[i]);
      const py = map.yToPx(Math.min(mb.yMax * 0.98, sim.errBaseline[i]));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Kalman Gain / Huber weight K_k (Violet)
    ctx.strokeStyle = COLORS.violet;
    ctx.shadowColor = COLORS.violetGlow;
    ctx.shadowBlur = 7;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    for (let i = 0; i < sim.N; i++) {
      const px = map.xToPx(sim.t[i]);
      const py = map.yToPx(sim.gainK[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Primary Estimation Error |x1 - x̂1| (Emerald)
    ctx.strokeStyle = COLORS.emerald;
    ctx.shadowColor = COLORS.emeraldGlow;
    ctx.shadowBlur = 7;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    for (let i = 0; i < sim.N; i++) {
      const px = map.xToPx(sim.t[i]);
      const py = map.yToPx(Math.min(mb.yMax * 0.98, sim.errPrimary[i]));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    drawCursorLine(ctx, map, sim.t[k], pulse);
    drawGlowingDot(ctx, map.xToPx(sim.t[k]), map.yToPx(sim.gainK[k]), 4.2, COLORS.violet, COLORS.violetGlow, pulse);
    drawGlowingDot(
      ctx,
      map.xToPx(sim.t[k]),
      map.yToPx(Math.min(mb.yMax * 0.98, sim.errPrimary[k])),
      4.2,
      COLORS.emerald,
      COLORS.emeraldGlow,
      0
    );

    const errLbl = sim.presetKey === 'kf-fusion' ? 'K_k • |e| vs z' : sim.presetKey === 'ukf-nonlinear' ? 'K_k • UKF vs EKF' : 'Huber K_k • MHE vs EKF';
    drawCompactBadge(ctx, map.plotRight - (compact ? 112 : 132), map.plotTop + 4, errLbl, COLORS.violet, COLORS.violet, compact);

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
// PART 2: StateSpaceVisualQuizEngine (6 High-DPI Visual Intuition Challenges)
// ===========================================================================
const SS_QUIZ_CHALLENGES = [
  {
    id: 'ss-quiz-1',
    badge: 'PBH & Modes',
    title: 'Controllability & Stabilizability',
    headerMath: 'Block-Diagonal Phase Portrait',
    headerMech: 'Uncoupled 2-Axis Actuator Portrait',
    formulaTex: 'A = \\begin{bmatrix}0.5 & 0\\\\0 & -3\\end{bmatrix},\\; B = \\begin{bmatrix}1\\\\0\\end{bmatrix}',
    promptMath:
      'Input $u$ acts only along $x_1$ ($B = [1, 0]^T$), while $x_2$ decays naturally at $\\lambda_2 = -3$. What does the PBH rank test say about $(A, B)$?',
    promptMech:
      'The motor torque drives only axis $\\theta_1$ ($B = [1,0]^T$), while unactuated mode $\\theta_2$ has heavy passive damping $\\lambda_2 = -3$. Can feedback stabilize the system?',
    canvasKind: 'pbh-modes',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        textMath: 'Controllable and stabilizable — $u$ can steer both $x_1$ and $x_2$ arbitrarily.',
        textMech: 'Fully controllable — motor torque can steer both $\\theta_1$ and $\\theta_2$ directly.',
        hintMath: 'Check row 2 of $B$: $\\dot{x}_2 = -3x_2 + 0\\cdot u$. Input $u$ has **zero authority** over $x_2$, so $(A, B)$ is not controllable.',
        hintMech: 'Because $B = [1, 0]^T$, the motor exerts zero torque on $\\theta_2$ — so that mode is strictly uncontrollable.',
      },
      {
        letter: 'B',
        isCorrect: true,
        textMath: 'Uncontrollable, yet **stabilizable** — the uncontrollable mode $\\lambda_2 = -3$ is strictly LHP.',
        textMech: 'Uncontrollable, yet **stabilizable** — passive damping $\\lambda_2 = -3$ decays safely to $0$.',
        hintMath: '',
        hintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        textMath: 'Uncontrollable and unstabilizable — any uncontrollable mode prevents closed-loop stability.',
        textMech: 'Unstabilizable — any unactuated axis makes closed-loop stabilization impossible.',
        hintMath: 'Stabilizability only requires every **unstable** mode ($\\operatorname{Re}(\\lambda) \\ge 0$) to be controllable! Here $\\lambda_2 = -3 < 0$ already decays on its own.',
        hintMech: 'You only need actuator authority over unstable modes! A passively damped mode ($\\lambda_2 = -3 < 0$) settles to zero for free.',
      },
      {
        letter: 'D',
        isCorrect: false,
        textMath: 'Controllable, but unstabilizable — because $\\lambda_1 = +0.5$ starts in the RHP.',
        textMech: 'Controllable, but unstabilizable — because $\\theta_1$ is open-loop unstable ($\\lambda_1 = +0.5$).',
        hintMath: '$\\lambda_1 = +0.5$ IS controllable ($B_1 = 1 \\ne 0$), so $u = -k_1 x_1$ easily moves it into the LHP! Meanwhile $x_2$ is uncontrollable.',
        hintMech: 'State feedback $u = -k_1 \\theta_1$ easily stabilizes the actuated $\\theta_1$ axis; the unactuated $\\theta_2$ axis is what fails controllability.',
      },
    ],
    proofMath:
      'By the **PBH Test**, $\\operatorname{rank}[\\lambda I - A,\\; B] = 2$ at $\\lambda_1 = +0.5$ (controllable) and drops to $1$ at $\\lambda_2 = -3$ (uncontrollable). Because every uncontrollable eigenvalue satisfies $\\operatorname{Re}(\\lambda) < 0$, the pair $(A, B)$ is **stabilizable** — guaranteeing a unique stabilizing LQR solution $P \\succ 0$!',
    proofMech:
      'The motor can place the unstable axis $\\lambda_1 = +0.5$ anywhere in the LHP, while the unactuated axis $\\lambda_2 = -3$ is passively damped. Uncontrollable LHP modes never stop LQR or pole placement from stabilizing the robot!',
  },
  {
    id: 'ss-quiz-2',
    badge: 'LQR Cost',
    title: 'LQR Q/R Trade-Off ("Cheap Control")',
    headerMath: 'State Settling x₁(t) & Torque u(t)',
    headerMech: 'Joint Angle θ(t) & Motor Torque τ(t)',
    formulaTex: 'J = \\int_0^\\infty (x^T Q x + u^T R u)\\,dt',
    promptMath:
      'Compare **Curve 1 (Cyan)** and **Curve 2 (Amber)** produced by two LQR controllers on the same plant. Which curve corresponds to a **high $Q/R$ ratio**?',
    promptMech:
      'Compare **Curve 1 (Cyan)** and **Curve 2 (Amber)** for the same servo joint. Which response results from cranking up the LQR ratio $Q/R$ ("cheap torque")?',
    canvasKind: 'lqr-qr',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        textMath: '**Curve 1 (Cyan)** — high $Q/R$ penalizes state error heavily and spends aggressive $u(t)$ for rapid convergence.',
        textMech: '**Curve 1 (Cyan)** — high $Q/R$ demands tight tracking and spends a crisp motor torque burst $\\tau(t)$.',
        hintMath: '',
        hintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        textMath: '**Curve 2 (Amber)** — high $Q/R$ makes control effort expensive, yielding gentle settling.',
        textMech: '**Curve 2 (Amber)** — high $Q/R$ conserves battery power with a slow, low-torque ramp.',
        hintMath: 'You have the ratio inverted! **Expensive control** means large $R$ (small $Q/R$), which produces the gentle Amber curve.',
        hintMech: 'Large $R$ (small $Q/R$) is what penalizes motor current and yields the gentle Amber response. High $Q/R$ means state error hurts much more than torque!',
      },
      {
        letter: 'C',
        isCorrect: false,
        textMath: 'Neither — scaling $Q/R$ leaves optimal gain $K = R^{-1}B^T P$ unchanged.',
        textMech: 'Neither — only changing the plant inertia alters the optimal LQR gain $K$.',
        hintMath: 'Scaling both $Q$ and $R$ by the *same* constant leaves $K$ unchanged, but changing the **ratio** $Q/R$ directly moves the closed-loop poles!',
        hintMech: 'Multiplying both $Q$ and $R$ by $10$ cancels out, but raising the ratio $Q/R$ increases feedback gain $K$ and bandwidth.',
      },
      {
        letter: 'D',
        isCorrect: false,
        textMath: '**Curve 2 (Amber)** — larger $Q$ pushes closed-loop poles closer to the $j\\omega$-axis.',
        textMech: '**Curve 2 (Amber)** — heavier error weight slows the joint to reduce peak torque.',
        hintMath: 'Increasing $Q/R$ drives closed-loop poles **farther left** into the LHP (faster decay), demanding higher peak $u(t)$ as in Curve 1.',
        hintMech: 'Heavier error weight $Q$ pushes closed-loop poles deeper into the LHP for faster settling — Curve 1!',
      },
    ],
    proofMath:
      'In $J = \\int (x^T Q x + u^T R u)\\,dt$, only the ratio $Q/R$ governs the Riccati solution. When $Q/R \\gg 1$ ("cheap control"), LQR trades a large initial impulse in $u(t)$ to crush state error $x(t)$ rapidly — matching **Curve 1 (Cyan)**.',
    proofMech:
      'Cranking $Q/R$ tells the Riccati solver that angular tracking error is far costlier than motor current. The controller responds with high gain $K$, sharp torque $\\tau(t)$, and rapid settling (**Curve 1**).',
  },
  {
    id: 'ss-quiz-3',
    badge: 'MPC Preview',
    title: 'Hard Constraints: MPC vs. Clipped LQR',
    headerMath: 'Approaching Wall x = 1 under |u| ≤ u_max',
    headerMech: 'Robot Approaching Hard Stop under |τ| ≤ τ_max',
    formulaTex: '\\min_{u_{0:N-1}} J \\quad \\text{s.t. } x_k \\le 1,\\; |u_k| \\le u_{\\max}',
    promptMath:
      'Both controllers obey the exact same actuator ceiling $|u(t)| \\le u_{\\max}$ (Amber rails). Why does **MPC (Emerald)** stop safely before $x=1$ while **Clipped LQR (Coral)** overshoots?',
    promptMech:
      'Both controllers share the exact same motor torque limit $|\\tau| \\le \\tau_{\\max}$. Why does **MPC (Emerald)** avoid the hard stop while **Clipped LQR (Coral)** crashes through it?',
    canvasKind: 'mpc-preview',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        textMath: 'MPC exceeds $|u| \\le u_{\\max}$ briefly during emergency braking.',
        textMech: 'MPC momentarily overdrives the motor past $\\tau_{\\max}$ right before the wall.',
        hintMath: 'Look at the bottom torque plot: **both** trajectories strictly respect the dashed Amber $\\pm u_{\\max}$ rails! MPC simply starts braking earlier.',
        hintMech: 'Neither controller violates $\\pm \\tau_{\\max}$. Look at the timing of the braking step in the lower panel!',
      },
      {
        letter: 'B',
        isCorrect: false,
        textMath: 'MPC lowers its steady-state gain so the state never approaches the setpoint.',
        textMech: 'MPC permanently limits top speed regardless of wall distance.',
        hintMath: 'Notice MPC tracks briskly at first and still converges right to the safe target $x_{\\text{ref}}$ — it only brakes early because its horizon sees the wall ahead.',
        hintMech: 'MPC accelerates strongly at the start and settles smoothly right next to the target; it uses future prediction, not sluggish gains.',
      },
      {
        letter: 'C',
        isCorrect: true,
        textMath: '**Receding-horizon preview** — MPC anticipates the wall and $-u_{\\max}$ ceiling in advance, braking early.',
        textMech: '**Receding-horizon preview** — MPC plans $N$ steps ahead knowing $\\tau_{\\max}$ and brakes before stopping distance runs out.',
        hintMath: '',
        hintMech: '',
      },
      {
        letter: 'D',
        isCorrect: false,
        textMath: 'LQR cannot stabilize a double integrator without nonlinear MPC.',
        textMech: 'Standard LQR is unstable on double-integrator servos even far from walls.',
        hintMath: 'Unconstrained LQR stabilizes a double integrator effortlessly — it fails here only because clipping $u$ *after* solving ignores future state & input constraints.',
        hintMech: 'LQR works great when unconstrained! The overshoot happens because post-hoc torque clipping has no look-ahead for stopping distance.',
      },
    ],
    proofMath:
      'Because LQR solves an **unconstrained** infinite-horizon problem and merely clips $u(t)$ afterward, it accelerates blindly until stopping distance exceeds the remaining gap. **MPC** embeds both $|u_k| \\le u_{\\max}$ and $x_k \\le x_{\\text{wall}}$ inside its receding-horizon QP, initiating braking right at the optimal preview instant!',
    proofMech:
      'Post-hoc saturation blinds LQR to the robot’s braking distance under $-\\tau_{\\max}$. **MPC** looks $N$ steps ahead at every tick and hits the brakes early so kinetic energy reaches zero cleanly inside the safe zone.',
  },
  {
    id: 'ss-quiz-4',
    badge: 'CBF-QP Safety',
    title: 'Control Barrier Forward Invariance',
    headerMath: 'Barrier Condition ḣ(x) ≥ −α h(x)',
    headerMech: 'Safety Filter Approaching Barrier h(θ) = 0',
    formulaTex: '\\dot{h}(x) + \\alpha h(x) \\ge 0 \\quad (\\alpha > 0)',
    promptMath:
      'A CBF-QP safety filter enforces $\\dot{h}(x) \\ge -\\alpha h(x)$ with $\\alpha > 0$ inside the safe set $h(x) \\ge 0$. What happens to the permitted approach speed toward the boundary as $h(x) \\to 0^+$?',
    promptMech:
      'As the robot approaches a forbidden zone boundary $h(\\theta) = 0$ under the CBF-QP constraint $\\dot{h} \\ge -\\alpha h$, how does the safety filter regulate approach velocity?',
    canvasKind: 'cbf-invariance',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        textMath: 'Approach speed stays constant at $-\\alpha$ until $h(x) = 0$, then fires an infinite impulse.',
        textMech: 'The robot moves at full speed until touching the boundary, then slams an emergency brake.',
        hintMath: 'Notice $\\dot{h}$ is bounded by $-\\alpha \\cdot h(x)$, which is **proportional** to remaining distance $h(x)$ — not a constant $-\\alpha$!',
        hintMech: 'The speed limit scales linearly with remaining clearance $h(x)$, so deceleration happens smoothly well before contact.',
      },
      {
        letter: 'B',
        isCorrect: true,
        textMath: '**Shrinks smoothly toward zero** ($\\dot{h} \\ge -\\alpha h \\to 0$), causing exponential deceleration so $h(x)$ never crosses below $0$.',
        textMech: '**Decelerates exponentially toward zero** as clearance $h \\to 0^+$, guaranteeing the robot stays strictly inside the safe set.',
        hintMath: '',
        hintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        textMath: 'Approach speed grows as $1/h(x)$ so the trajectory crosses $h=0$ in finite time.',
        textMech: 'Velocity increases near the wall to minimize time spent near the barrier.',
        hintMath: 'That would violate safety! Since $\\dot{h} \\ge -\\alpha h$, by Nagumo’s theorem / Grönwall’s inequality $h(x(t)) \\ge h(x_0)e^{-\\alpha t} \\ge 0$.',
        hintMech: 'As $h \\to 0^+$, the lower bound $-\\alpha h \\to 0$ blocks any negative velocity toward the wall.',
      },
      {
        letter: 'D',
        isCorrect: false,
        textMath: 'The filter immediately resets the state back to $x = 0$ whenever $h(x) < 1$.',
        textMech: 'The robot immediately reverses to home position once inside the warning zone.',
        hintMath: 'CBF-QP is **minimally invasive** ($\\min \\|u - u_{\\text{nom}}\\|^2$): it allows approaching the barrier smoothly and only caps approach rate via $-\\alpha h$.',
        hintMech: 'A CBF-QP never hijacks the robot back home — it gently trims only the unsafe velocity component as clearance narrows.',
      },
    ],
    proofMath:
      'Integrating $\\dot{h} \\ge -\\alpha h$ yields the exact comparison bound $h(x(t)) \\ge h(x(0))\\,e^{-\\alpha t} \\ge 0$ for all $t \\ge 0$. Because the maximum inward rate shrinks to $0$ right at $h = 0$, the safe set $\\mathcal{C} = \\{x : h(x) \\ge 0\\}$ is mathematically **forward invariant**!',
    proofMech:
      'Think of $\\dot{h} \\ge -\\alpha h$ as a virtual speed limit proportional to wall clearance: at $h = 0$, the allowed inward speed is strictly $0$, so the robot glides exponentially up to the barrier without ever breaching.',
  },
  {
    id: 'ss-quiz-5',
    badge: 'Kalman Gain',
    title: 'Kalman Filter Trust Balance (R ≫ Q)',
    headerMath: 'Tight Model Prediction vs. Wildly Noisy Sensor z_k',
    headerMech: 'Precise Dynamics Model vs. Noisy GPS / Encoder',
    formulaTex: 'K_k = P_{k|k-1}H^T(HP_{k|k-1}H^T + R)^{-1}',
    promptMath:
      'The sensor measurements $z_k$ (Coral dots) are wildly corrupted ($R \\gg Q$), while the physics prediction has tiny uncertainty $P_{k|k-1}$. How does the optimal Kalman Gain $K_k$ respond?',
    promptMech:
      'Your motor model is super accurate ($Q$ tiny), but your sensor readings jump wildly ($R \\gg Q$). What value does the optimal Kalman Gain $K_k$ approach?',
    canvasKind: 'kalman-trust',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        textMath: '$K_k \\to H^{-1}$, snapping the state estimate directly onto every raw sensor dot $z_k$.',
        textMech: '$K_k \\to 1$, forcing the controller to follow every noisy sensor spike.',
        hintMath: 'That happens when $R \\to 0$ (perfect sensor)! Here $R$ sits in the **denominator** of $K_k = P H^T (H P H^T + R)^{-1}$.',
        hintMech: 'Following raw measurements only makes sense when the sensor is noiseless ($R \\approx 0$). With huge $R$ in the denominator, $K_k$ shrinks!',
      },
      {
        letter: 'B',
        isCorrect: false,
        textMath: '$K_k \\to \\infty$, amplifying innovations to cancel out measurement variance.',
        textMech: '$K_k$ grows large to overpower sensor jitter.',
        hintMath: 'In the update $\\hat{x} = \\hat{x}^- + K_k(z_k - H\\hat{x}^-)$, a large $K_k$ would inject *more* sensor noise! Huge $R$ in the denominator drives $K_k$ down.',
        hintMech: 'Large $K_k$ multiplies the noisy sensor error $(z_k - H\\hat{x}^-)$, which would ruin the estimate. Look at $R$ in the denominator of $K_k$!',
      },
      {
        letter: 'C',
        isCorrect: true,
        textMath: '**$K_k \\to 0$** — the filter heavily down-weights noisy $z_k$ and trusts its smooth physics prediction.',
        textMech: '**$K_k \\to 0$** — the estimator ignores sensor jitter and glides smoothly on the physics prediction.',
        hintMath: '',
        hintMech: '',
      },
      {
        letter: 'D',
        isCorrect: false,
        textMath: '$K_k$ stays fixed at $0.5$ regardless of the noise ratio $R/Q$.',
        textMech: 'Kalman Gain is always a 50/50 blend between model and sensor.',
        hintMath: 'The whole beauty of the Kalman Filter is that $K_k$ **adapts dynamically** to the ratio of model covariance $P$ to measurement noise $R$!',
        hintMech: 'Unlike a fixed filter, the Kalman Filter continuously rebalances trust based on $P$ vs. $R$.',
      },
    ],
    proofMath:
      'In $K_k = \\frac{P_{k|k-1}H^T}{H P_{k|k-1} H^T + R}$, as $R \\to \\infty$ (huge sensor noise), **$K_k \\to 0$** so $\\hat{x}_{k|k} \\approx \\hat{x}_{k|k-1}$ trusts the crisp dynamics model. Conversely, as $R \\to 0$, $K_k \\to H^{-1}$ trusts the crisp sensor!',
    proofMech:
      'When $R \\gg Q$, the denominator explodes so $K_k \\to 0$: the Emerald posterior hugs the clean dynamics prediction and filters out almost all the Coral sensor scatter.',
  },
  {
    id: 'ss-quiz-6',
    badge: 'UKF & MHE',
    title: 'Why UKF & Factor Graphs Beat Naive EKF',
    headerMath: 'Banana Posterior (UKF) + Outlier Rejection (MHE)',
    headerMech: 'Curved Lidar Belief & GPS Glitch Immunity',
    formulaTex: '\\mathcal{X}^{(i)} \\mapsto g(\\mathcal{X}^{(i)}),\\quad \\rho_\\delta(\\|r_k\\|_R^2)',
    promptMath:
      'Inspect the two failure modes of a naive single-step EKF (Amber): **curved nonlinear belief** (left) and a **sudden sensor outlier** (right). Why do UKF and MHE/factor graphs stay locked on truth?',
    promptMech:
      'A naive EKF (Amber) drifts on curved polar scans (left) and jumps wildly on a single GPS glitch (right). What gives UKF and MHE/GTSAM their advantage?',
    canvasKind: 'ukf-mhe',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        textMath: 'They discard the dynamics model and simply average the two most recent raw measurements.',
        textMech: 'They turn off the physics model and apply a 2-tap moving average to sensor readings.',
        hintMath: 'A 2-tap average would still get dragged halfway into the Coral outlier spike! Both UKF and MHE rely *deeply* on the nonlinear dynamics model.',
        hintMech: 'Throwing away dynamics would make outlier spikes worse! MHE actually uses *more* dynamics constraints across a multi-step window.',
      },
      {
        letter: 'B',
        isCorrect: true,
        textMath: '**UKF propagates sigma points without fragile Jacobians, and MHE/factor graphs jointly optimize a window with robust loss to reject outliers.**',
        textMech: '**UKF maps 5 sigma points through the true nonlinear curve, while MHE/GTSAM re-linearizes a sliding window with Huber loss to shrug off glitches.**',
        hintMath: '',
        hintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        textMath: 'EKF only works on 1D scalar states, whereas UKF and MHE are needed for any 2D system.',
        textMech: 'EKF cannot track 2-state systems like position and velocity.',
        hintMath: 'EKF handles multi-dimensional states routinely — its real weaknesses are **1st-order local linearization bias** and **irreversible 1-step quadratic updates**.',
        hintMech: 'EKF works in any dimension! Its blind spots are curved nonlinearities (Jacobian error) and single-step sensitivity to outliers.',
      },
      {
        letter: 'D',
        isCorrect: false,
        textMath: 'UKF and MHE physically eliminate sensor noise so covariance $R = 0$.',
        textMech: 'UKF and MHE require noiseless sensors ($R = 0$) to converge.',
        hintMath: 'Sensor noise $R > 0$ is still present — UKF captures how noise transforms nonlinearly, and Huber MHE bounds the influence of giant residuals!',
        hintMech: 'Both estimators thrive under noisy measurements ($R > 0$) by transforming distributions accurately and down-weighting outliers.',
      },
    ],
    proofMath:
      '**UKF** propagates $2n+1$ deterministic sigma points through the true nonlinearity $g(\\cdot)$ (3rd-order mean accuracy, zero Jacobians), while **MHE / GTSAM factor graphs** jointly optimize a sliding window with robust M-estimators (Huber $\\rho_\\delta$) — turning outlier spikes into harmless bounded residuals!',
    proofMech:
      'Modern autonomy stacks (drones, quadrupeds, self-driving cars) combine unscented/nonlinear propagation with sliding-window factor graphs + Huber loss so curved lidar scans and sudden GPS multipath glitches never derail state estimation.',
  },
];

export class StateSpaceVisualQuizEngine {
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

    this._challenges = SS_QUIZ_CHALLENGES;
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
    this._canvasSize = { w: 0, h: 152 };
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
    return SS_QUIZ_CHALLENGES;
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
        'el-ss-pill w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[11px] sm:text-xs font-mono font-semibold flex items-center justify-center border cursor-pointer ' +
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
    canvasWrap.className = 'relative w-full max-w-full h-[146px] sm:h-[192px]';

    const canvas = document.createElement('canvas');
    canvas.className = 'el-ss-canvas h-full';
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
        'el-ssq-btn w-full text-left rounded-xl border border-slate-800/90 bg-[#0F131C]/85 px-2.5 py-2 sm:px-3 sm:py-2.5 flex items-start gap-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-400/50';

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
          item.btn.classList.remove('el-ss-shake');
          void item.btn.offsetWidth;
          item.btn.classList.add('el-ss-shake');
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
        State-Space Insight Unlocked
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
      'el-ss-pill px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-400/60 text-emerald-100 cursor-pointer whitespace-nowrap';

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

  _resizeCanvas() {
    if (!this._canvas || !this._canvasWrap) return;
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 3);
    const r = this._canvasWrap.getBoundingClientRect();
    if (r.width < 20 || r.height < 20) return;
    const w = Math.floor(r.width);
    const h = Math.floor(r.height);
    if (this._canvasSize.w !== w || this._canvasSize.h !== h || this._canvas.width !== Math.round(w * dpr)) {
      this._canvasSize = { w, h };
      this._canvas.width = Math.round(w * dpr);
      this._canvas.height = Math.round(h * dpr);
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

      if (this._canvasSize.w >= 20) {
        this._drawCanvas();
      }
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  _drawCanvas() {
    if (!this._ctx || this._canvasSize.w < 20 || this._canvasSize.h < 20) return;
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 3);
    const { w, h } = this._canvasSize;
    const ctx = this._ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const ch = this._getCurrentChallenge();
    const solved = this._isCurrentSolved();
    const pulse = 0.5 + 0.5 * Math.sin(this._pulsePhase);

    if (ch.canvasKind === 'pbh-modes') {
      this._drawQuizPbhModes(ctx, w, h, solved, pulse);
    } else if (ch.canvasKind === 'lqr-qr') {
      this._drawQuizLqrQr(ctx, w, h, solved, pulse);
    } else if (ch.canvasKind === 'mpc-preview') {
      this._drawQuizMpcPreview(ctx, w, h, solved, pulse);
    } else if (ch.canvasKind === 'cbf-invariance') {
      this._drawQuizCbfInvariance(ctx, w, h, solved, pulse);
    } else if (ch.canvasKind === 'kalman-trust') {
      this._drawQuizKalmanTrust(ctx, w, h, solved, pulse);
    } else {
      this._drawQuizUkfMhe(ctx, w, h, solved, pulse);
    }
  }

  // Quiz 1 Diagram: Block-diagonal 2-mode phase portrait (x1 steerable, x2 decaying at -3)
  _drawQuizPbhModes(ctx, w, h, solved, pulse) {
    const compact = w < 430;
    const pad = getPanelPad(w, true);
    const map = createPlotMapper(w, h, pad, -2.2, 2.2, -1.8, 1.8);

    drawCartesianGrid(ctx, w, h, map, {
      xTicks: [-2, -1, 0, 1, 2],
      yTicks: [-1, 0, 1],
      xLabel: this.mechatronicsLens ? 'θ₁ (B₁=1)' : 'x₁ (B₁=1)',
      yLabel: this.mechatronicsLens ? 'θ₂ (B₂=0)' : 'x₂ (B₂=0)',
      compact,
    });

    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    // Vertical Emerald passive decay vectors along x2 (λ₂ = -3)
    for (const gx of [-1.6, -0.8, 0.8, 1.6]) {
      for (const gy of [-1.35, -0.65, 0.65, 1.35]) {
        const px = map.xToPx(gx);
        const py = map.yToPx(gy);
        const dy = gy > 0 ? 15 : -15;
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + dy);
        ctx.stroke();
        drawArrowHead(ctx, px, py + dy, dy > 0 ? Math.PI / 2 : -Math.PI / 2, 3.8, COLORS.emerald);
      }
    }

    // Horizontal Cyan controllable authority band along x1 axis (B = [1, 0]^T)
    const y0 = map.yToPx(0);
    ctx.strokeStyle = COLORS.cyan;
    ctx.shadowColor = COLORS.cyanGlow;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(map.xToPx(-1.9), y0);
    ctx.lineTo(map.xToPx(1.9), y0);
    ctx.stroke();
    ctx.shadowBlur = 0;
    drawArrowHead(ctx, map.xToPx(1.9), y0, 0, 5.5, COLORS.cyan);
    drawArrowHead(ctx, map.xToPx(-1.9), y0, Math.PI, 5.5, COLORS.cyan);

    // Sample stabilized trajectory: starts at (1.5, 1.35), steered in x1 while x2 decays e^{-3t}
    ctx.strokeStyle = solved ? COLORS.emerald : COLORS.amberLight;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const t = (2.6 * i) / 60;
      const sx1 = 1.55 * Math.exp(-1.2 * t);
      const sx2 = 1.38 * Math.exp(-3.0 * t);
      const px = map.xToPx(sx1);
      const py = map.yToPx(sx2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    drawGlowingDot(ctx, map.xToPx(0), y0, 4.5, COLORS.emerald, COLORS.emeraldGlow, pulse);

    drawCompactBadge(ctx, map.plotLeft + 6, map.plotTop + 5, 'λ₂ = −3 (LHP decay)', COLORS.emerald, COLORS.emerald, compact);
    drawCompactBadge(ctx, map.plotRight - (compact ? 104 : 118), map.plotBottom - 20, 'u steers x₁ only', COLORS.cyan, COLORS.cyan, compact);

    ctx.restore();
  }

  // Quiz 2 Diagram: LQR Q/R Cost Ratio (Curve 1 Cyan fast/aggressive vs Curve 2 Amber gentle)
  _drawQuizLqrQr(ctx, w, h, solved, pulse) {
    const compact = w < 430;
    const splitX = Math.floor(w * 0.52);

    // Left sub-plot: State x1(t)
    const padL = { left: compact ? 30 : 38, right: 10, top: 14, bottom: 20 };
    const mapL = createPlotMapper(splitX, h, padL, 0, 5, -0.25, 1.35);
    drawCartesianGrid(ctx, splitX, h, mapL, {
      xTicks: [0, 2, 4],
      yTicks: [0, 0.5, 1],
      xLabel: 't',
      yLabel: this.mechatronicsLens ? 'θ(t)' : 'x₁(t)',
      compact,
    });

    // Right sub-plot: Control effort u(t)
    const rightW = w - splitX;
    const padR = { left: compact ? 32 : 40, right: 10, top: 14, bottom: 20 };
    ctx.save();
    ctx.translate(splitX, 0);
    const mapR = createPlotMapper(rightW, h, padR, 0, 5, -3.8, 0.8);
    drawCartesianGrid(ctx, rightW, h, mapR, {
      xTicks: [0, 2, 4],
      yTicks: [-3, -1, 0],
      xLabel: 't',
      yLabel: this.mechatronicsLens ? 'τ(t)' : 'u(t)',
      compact,
    });
    ctx.restore();

    // Curve 1 (Cyan — High Q/R: fast settling, large initial torque)
    // Curve 2 (Amber — Low Q/R: slow gentle settling, tiny torque)
    const drawPair = (fnX, fnU, color, glow, width) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(mapL.plotLeft, mapL.plotTop, mapL.plotW, mapL.plotH);
      ctx.clip();
      ctx.strokeStyle = color;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 8;
      ctx.lineWidth = width;
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const t = (5 * i) / 80;
        const px = mapL.xToPx(t);
        const py = mapL.yToPx(fnX(t));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(splitX, 0);
      ctx.beginPath();
      ctx.rect(mapR.plotLeft, mapR.plotTop, mapR.plotW, mapR.plotH);
      ctx.clip();
      ctx.strokeStyle = color;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 8;
      ctx.lineWidth = width;
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const t = (5 * i) / 80;
        const px = mapR.xToPx(t);
        const py = mapR.yToPx(fnU(t));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    };

    // Curve 2 (Amber)
    drawPair(
      (t) => Math.exp(-0.48 * t) * (1 + 0.15 * t),
      (t) => -0.75 * Math.exp(-0.55 * t) * Math.cos(0.4 * t),
      COLORS.amber,
      COLORS.amberGlow,
      2.0
    );

    // Curve 1 (Cyan)
    drawPair(
      (t) => Math.exp(-2.15 * t) * Math.cos(1.4 * t),
      (t) => -3.35 * Math.exp(-2.1 * t) * Math.cos(1.7 * t),
      COLORS.cyan,
      COLORS.cyanGlow,
      solved ? 2.6 : 2.2
    );

    // Labels
    drawCompactBadge(ctx, mapL.plotRight - (compact ? 64 : 74), mapL.plotTop + 5, '1: Cyan', COLORS.cyan, COLORS.cyan, compact);
    drawCompactBadge(ctx, mapL.plotRight - (compact ? 64 : 74), mapL.plotTop + 24, '2: Amber', COLORS.amber, COLORS.amberLight, compact);

    if (solved) {
      drawGlowingDot(ctx, splitX + mapR.xToPx(0.08), mapR.yToPx(-3.2), 4.2, COLORS.cyan, COLORS.cyanGlow, pulse);
      drawCompactBadge(ctx, splitX + mapR.plotLeft + 6, mapR.plotBottom - 20, 'High Q/R', COLORS.emerald, COLORS.emerald, compact);
    }
  }

  // Quiz 3 Diagram: MPC Preview vs Clipped LQR under ±u_max
  _drawQuizMpcPreview(ctx, w, h, solved, pulse) {
    const compact = w < 430;
    const sim = simulatePreset('mpc-cbf', 2.45);
    const splitY = Math.floor(h * 0.54);

    // Top half: x1(t) approaching wall
    const padT = { left: compact ? 34 : 44, right: 12, top: 10, bottom: 10 };
    const mapT = createPlotMapper(w, splitY, padT, 0, sim.T, -1.75, 1.55);
    drawCartesianGrid(ctx, w, splitY, mapT, {
      xTicks: [0, 2, 4, 6],
      yTicks: [-1, 0, 1],
      yLabel: this.mechatronicsLens ? 'θ(t)' : 'x₁(t)',
      compact,
    });

    ctx.save();
    ctx.beginPath();
    ctx.rect(mapT.plotLeft, mapT.plotTop, mapT.plotW, mapT.plotH);
    ctx.clip();
    const yWall = mapT.yToPx(sim.xWall);
    ctx.fillStyle = COLORS.coralFill;
    ctx.fillRect(mapT.plotLeft, mapT.plotTop, mapT.plotW, Math.max(0, yWall - mapT.plotTop));
    ctx.strokeStyle = COLORS.coral;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(mapT.plotLeft, yWall);
    ctx.lineTo(mapT.plotRight, yWall);
    ctx.stroke();
    ctx.setLineDash([]);

    // LQR breaching
    ctx.strokeStyle = COLORS.coral;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4.5, 3]);
    ctx.beginPath();
    for (let i = 0; i < sim.N; i++) {
      const px = mapT.xToPx(sim.t[i]);
      const py = mapT.yToPx(sim.x1Lqr[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // MPC safe
    ctx.strokeStyle = COLORS.emerald;
    ctx.shadowColor = COLORS.emeraldGlow;
    ctx.shadowBlur = 7;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i < sim.N; i++) {
      const px = mapT.xToPx(sim.t[i]);
      const py = mapT.yToPx(sim.x1[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    drawCompactBadge(ctx, mapT.plotRight - (compact ? 74 : 84), mapT.plotTop + 3, 'Wall x=1', COLORS.coral, COLORS.coral, compact);
    ctx.restore();

    // Bottom half: u(t) with ±u_max rails
    const botH = h - splitY;
    const padB = { left: compact ? 34 : 44, right: 12, top: 6, bottom: 18 };
    ctx.save();
    ctx.translate(0, splitY);
    const mapB = createPlotMapper(w, botH, padB, 0, sim.T, -4.1, 4.1);
    drawCartesianGrid(ctx, w, botH, mapB, {
      xTicks: [0, 2, 4, 6],
      yTicks: [-3, 0, 3],
      xLabel: 't (s)',
      yLabel: this.mechatronicsLens ? 'τ(t)' : 'u(t)',
      compact,
    });

    ctx.beginPath();
    ctx.rect(mapB.plotLeft, mapB.plotTop, mapB.plotW, mapB.plotH);
    ctx.clip();

    // ±u_max rails
    ctx.strokeStyle = COLORS.amber;
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(mapB.plotLeft, mapB.yToPx(sim.uMax));
    ctx.lineTo(mapB.plotRight, mapB.yToPx(sim.uMax));
    ctx.moveTo(mapB.plotLeft, mapB.yToPx(-sim.uMax));
    ctx.lineTo(mapB.plotRight, mapB.yToPx(-sim.uMax));
    ctx.stroke();
    ctx.setLineDash([]);

    // LQR clipped effort
    ctx.strokeStyle = COLORS.coral;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4.5, 3]);
    ctx.beginPath();
    for (let i = 0; i < sim.N; i++) {
      const px = mapB.xToPx(sim.t[i]);
      const py = mapB.yToPx(sim.uLqr[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // MPC early braking effort
    ctx.strokeStyle = COLORS.emerald;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    for (let i = 0; i < sim.N; i++) {
      const px = mapB.xToPx(sim.t[i]);
      const py = mapB.yToPx(sim.u[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    if (solved) {
      drawGlowingDot(ctx, mapB.xToPx(0.95), mapB.yToPx(-sim.uMax), 4.2, COLORS.emerald, COLORS.emeraldGlow, pulse);
      drawCompactBadge(ctx, mapB.plotLeft + 6, mapB.plotBottom - 18, 'Early brake!', COLORS.emerald, COLORS.emerald, compact);
    } else {
      drawCompactBadge(ctx, mapB.plotRight - (compact ? 64 : 74), mapB.plotTop + 2, '±u_max', COLORS.amber, COLORS.amberLight, compact);
    }
    ctx.restore();
  }

  // Quiz 4 Diagram: CBF-QP Forward Invariance (exponential slowdown as h(x) -> 0+)
  _drawQuizCbfInvariance(ctx, w, h, solved, pulse) {
    const compact = w < 430;
    const pad = getPanelPad(w, true);
    const map = createPlotMapper(w, h, pad, 0, 5.0, -0.45, 1.45);

    drawCartesianGrid(ctx, w, h, map, {
      xTicks: [0, 1, 2, 3, 4, 5],
      yTicks: [0, 0.5, 1.0],
      xLabel: 't (s)',
      yLabel: 'h(x)',
      compact,
    });

    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    const y0 = map.yToPx(0);
    // Emerald safe region h >= 0
    ctx.fillStyle = COLORS.emeraldFill;
    ctx.fillRect(map.plotLeft, map.plotTop, map.plotW, Math.max(0, y0 - map.plotTop));

    // Coral unsafe region h < 0
    ctx.fillStyle = COLORS.coralFill;
    ctx.fillRect(map.plotLeft, y0, map.plotW, Math.max(0, map.plotBottom - y0));

    // Barrier h(x) = 0
    ctx.strokeStyle = COLORS.coral;
    ctx.shadowColor = COLORS.coralGlow;
    ctx.shadowBlur = 9;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(map.plotLeft, y0);
    ctx.lineTo(map.plotRight, y0);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Exponential barrier boundary h(t) = h0 * exp(-alpha * t)
    const alpha = 0.85;
    ctx.strokeStyle = COLORS.emerald;
    ctx.shadowColor = COLORS.emeraldGlow;
    ctx.shadowBlur = 9;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const t = (5 * i) / 100;
      const hv = 1.25 * Math.exp(-alpha * t);
      const px = map.xToPx(t);
      const py = map.yToPx(hv);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Shrinking downward approach-speed arrows along the curve illustrating |ḣ| <= α*h -> 0!
    for (const ts of [0.5, 1.4, 2.5, 3.8]) {
      const hv = 1.25 * Math.exp(-alpha * ts);
      const px = map.xToPx(ts);
      const py = map.yToPx(hv);
      const arrowLen = Math.max(6, 26 * hv);
      ctx.strokeStyle = COLORS.amberLight;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py + arrowLen);
      ctx.stroke();
      drawArrowHead(ctx, px, py + arrowLen, Math.PI / 2, 3.8, COLORS.amberLight);
    }

    if (solved) {
      const ptT = 3.8;
      drawGlowingDot(ctx, map.xToPx(ptT), map.yToPx(1.25 * Math.exp(-alpha * ptT)), 4.6, COLORS.emerald, COLORS.emeraldGlow, pulse);
    }

    drawCompactBadge(ctx, map.plotRight - (compact ? 98 : 114), map.plotTop + 5, 'h(t) ≥ h₀e^(−αt)', COLORS.emerald, COLORS.emerald, compact);
    drawCompactBadge(ctx, map.plotLeft + 6, map.plotBottom - 19, 'Unsafe h(x) < 0', COLORS.coral, COLORS.coral, compact);

    ctx.restore();
  }

  // Quiz 5 Diagram: Kalman Gain Trust Balance (R >> Q: smooth model vs wild Coral dots)
  _drawQuizKalmanTrust(ctx, w, h, solved, pulse) {
    const compact = w < 430;
    const pad = getPanelPad(w);
    const map = createPlotMapper(w, h, pad, 0, 6, -2.1, 2.2);

    drawCartesianGrid(ctx, w, h, map, {
      xTicks: [0, 1, 2, 3, 4, 5, 6],
      yTicks: [-2, -1, 0, 1, 2],
      xLabel: 't (s)',
      yLabel: this.mechatronicsLens ? 'θ(t)' : 'x₁(t)',
      compact,
    });

    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    const rng = makeRng(44108);
    const N = 64;
    const truthFn = (t) => 0.85 * Math.sin(0.95 * t);

    // Tight ±2σ model prediction band (Cyan)
    ctx.fillStyle = 'rgba(34, 211, 238, 0.16)';
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const t = (6 * i) / (N - 1);
      const px = map.xToPx(t);
      const py = map.yToPx(truthFn(t) + 0.16);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    for (let i = N - 1; i >= 0; i--) {
      const t = (6 * i) / (N - 1);
      ctx.lineTo(map.xToPx(t), map.yToPx(truthFn(t) - 0.16));
    }
    ctx.closePath();
    ctx.fill();

    // Wildly scattered Coral measurements (R >> Q)
    for (let i = 0; i < N; i++) {
      const t = (6 * i) / (N - 1);
      const z = clamp(truthFn(t) + rng.gaussian() * 0.88, -1.98, 2.05);
      ctx.fillStyle = 'rgba(251, 113, 133, 0.72)';
      ctx.beginPath();
      ctx.arc(map.xToPx(t), map.yToPx(z), 2.5, 0, TWO_PI);
      ctx.fill();
    }

    // Smooth physics model + KF posterior estimate hugging model (Emerald/Cyan)
    ctx.strokeStyle = COLORS.emerald;
    ctx.shadowColor = COLORS.emeraldGlow;
    ctx.shadowBlur = 9;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const t = (6 * i) / (N - 1);
      const px = map.xToPx(t);
      const py = map.yToPx(truthFn(t) + 0.03 * Math.sin(2.5 * t));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (solved) {
      drawGlowingDot(ctx, map.xToPx(3.0), map.yToPx(truthFn(3.0)), 4.6, COLORS.emerald, COLORS.emeraldGlow, pulse);
      drawCompactBadge(ctx, map.plotLeft + 6, map.plotBottom - 20, 'K_k → 0 (Trust Model)', COLORS.emerald, COLORS.emerald, compact);
    }
    drawCompactBadge(ctx, map.plotRight - (compact ? 94 : 108), map.plotTop + 5, 'Huge R ≫ Q', COLORS.coral, COLORS.coral, compact);

    ctx.restore();
  }

  // Quiz 6 Diagram: Split UKF Banana Sigma Points (left) + MHE Outlier Rejection (right)
  _drawQuizUkfMhe(ctx, w, h, solved, pulse) {
    const compact = w < 430;
    const splitX = Math.floor(w * 0.48);

    // Left: Banana nonlinear cloud + 5 Violet UKF sigma points vs Amber EKF ellipse
    const padL = { left: 10, right: 8, top: 14, bottom: 14 };
    const mapL = createPlotMapper(splitX, h, padL, -0.4, 2.2, -0.4, 2.1);
    drawCartesianGrid(ctx, splitX, h, mapL, { xTicks: [0, 1, 2], yTicks: [0, 1, 2], compact: true });

    ctx.save();
    ctx.beginPath();
    ctx.rect(mapL.plotLeft, mapL.plotTop, mapL.plotW, mapL.plotH);
    ctx.clip();

    const rng = makeRng(31415);
    const r0 = 1.45;
    const th0 = 0.78;
    const sR = 0.09;
    const sTh = 0.44;
    ctx.fillStyle = 'rgba(34, 211, 238, 0.45)';
    for (let i = 0; i < 65; i++) {
      const rr = r0 + rng.gaussian() * sR;
      const tt = th0 + rng.gaussian() * sTh;
      ctx.beginPath();
      ctx.arc(mapL.xToPx(rr * Math.cos(tt)), mapL.yToPx(rr * Math.sin(tt)), 2.0, 0, TWO_PI);
      ctx.fill();
    }

    // Mismatched Amber EKF ellipse
    const cosT = Math.cos(th0), sinT = Math.sin(th0);
    const ekfPts = sampleEllipsePoints(
      r0 * cosT + 0.14 * cosT,
      r0 * sinT + 0.14 * sinT,
      cosT * cosT * sR * sR + (r0 * sinT) ** 2 * sTh * sTh,
      cosT * sinT * (sR * sR - r0 * r0 * sTh * sTh),
      sinT * sinT * sR * sR + (r0 * cosT) ** 2 * sTh * sTh,
      1.75,
      56
    );
    drawPolygonPath(ctx, mapL, ekfPts);
    ctx.strokeStyle = COLORS.amber;
    ctx.lineWidth = 1.7;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5 Violet UKF sigma points
    const sigmas = [
      [r0, th0],
      [r0 + 0.16, th0],
      [r0 - 0.16, th0],
      [r0, th0 + 0.72],
      [r0, th0 - 0.72],
    ];
    for (let i = 0; i < sigmas.length; i++) {
      const [rr, tt] = sigmas[i];
      drawGlowingDot(ctx, mapL.xToPx(rr * Math.cos(tt)), mapL.yToPx(rr * Math.sin(tt)), i === 0 ? 4.2 : 3.4, COLORS.violet, COLORS.violetGlow, solved ? pulse : 0);
    }
    drawCompactBadge(ctx, mapL.plotLeft + 4, mapL.plotTop + 4, 'UKF σ-pts', COLORS.violet, COLORS.violet, true);
    ctx.restore();

    // Right: MHE / Factor-Graph Huber smoothing rejecting Coral outlier spike vs derailed EKF
    const rightW = w - splitX;
    const padR = { left: 10, right: 10, top: 14, bottom: 14 };
    ctx.save();
    ctx.translate(splitX, 0);
    const mapR = createPlotMapper(rightW, h, padR, 0, 5, -1.2, 2.2);
    drawCartesianGrid(ctx, rightW, h, mapR, { xTicks: [1, 3, 5], yTicks: [0, 1], compact: true });

    ctx.beginPath();
    ctx.rect(mapR.plotLeft, mapR.plotTop, mapR.plotW, mapR.plotH);
    ctx.clip();

    // Derailed EKF curve (dashed Amber)
    ctx.strokeStyle = COLORS.amber;
    ctx.lineWidth = 1.7;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    for (let i = 0; i <= 50; i++) {
      const t = (5 * i) / 50;
      const spike = t >= 2.2 ? 1.35 * Math.exp(-1.55 * (t - 2.2)) : 0;
      const y = 0.25 * Math.sin(1.2 * t) + spike;
      const px = mapR.xToPx(t);
      const py = mapR.yToPx(y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Smooth MHE/GTSAM curve (glowing Emerald)
    ctx.strokeStyle = COLORS.emerald;
    ctx.shadowColor = COLORS.emeraldGlow;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i <= 50; i++) {
      const t = (5 * i) / 50;
      const y = 0.25 * Math.sin(1.2 * t);
      const px = mapR.xToPx(t);
      const py = mapR.yToPx(y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Outlier Coral spike dot
    drawGlowingDot(ctx, mapR.xToPx(2.2), mapR.yToPx(1.85), 4.2, COLORS.coral, COLORS.coralGlow, pulse);
    drawCompactBadge(ctx, mapR.plotLeft + 4, mapR.plotTop + 4, 'MHE vs Glitch', COLORS.emerald, COLORS.emerald, true);
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
    this._canvas = null;
    this._ctx = null;
    this._canvasWrap = null;
    this._optionButtons = [];
    this._feedbackSlot = null;
    this._root = null;
  }
}
