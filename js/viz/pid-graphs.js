/**
 * EIGENLAB — Interactive PID P/I/D Decomposition Lab & Visual Intuition Quiz Engine
 *
 * Exports:
 *   - PidDecompositionLab  : Mobile-first 2-panel synchronized high-DPI canvas lab
 *                            showing closed-loop step + load-disturbance response y(t)
 *                            alongside live P / I / D control effort decomposition
 *                            u(t) = u_P + u_I + u_D with a unified draggable vertical
 *                            time cursor t ∈ [0, 8 s], glowing live error bar e(t),
 *                            5 one-tap controller mode presets, live telemetry pills,
 *                            and Math ↔ Mechatronics Lens relabeling.
 *   - PidVisualQuizEngine  : Brilliant.org-style 6-challenge PID visual intuition quiz
 *                            (pid-quiz-1 .. pid-quiz-6) with mobile zero-scroll
 *                            3-column layout, custom on-canvas proof overlays, KaTeX
 *                            explanations, and store/sound integration.
 */

import { store, sound, renderKatex, renderInlineMathText } from '../store.js';

// ---------------------------------------------------------------------------
// Palette & Visual Constants (EIGENLAB Dark Engineering Studio)
// ---------------------------------------------------------------------------
const COLORS = {
  bg: '#0B0D12',
  bgPanel: '#0F131C',
  gridMinor: 'rgba(148, 163, 184, 0.065)',
  gridMajor: 'rgba(148, 163, 184, 0.115)',
  axis: 'rgba(148, 163, 184, 0.34)',
  axisLabel: 'rgba(148, 163, 184, 0.65)',
  cyan: '#22D3EE',
  cyanGlow: 'rgba(34, 211, 238, 0.45)',
  violet: '#A78BFA',
  violetGlow: 'rgba(167, 139, 250, 0.44)',
  amber: '#F59E0B',
  amberLight: '#FCD34D',
  amberGlow: 'rgba(245, 158, 11, 0.48)',
  emerald: '#34D399',
  emeraldGlow: 'rgba(52, 211, 153, 0.44)',
  emeraldBand: 'rgba(52, 211, 153, 0.095)',
  emeraldLhpNear: 'rgba(52, 211, 153, 0.045)',
  emeraldLhpFar: 'rgba(52, 211, 153, 0.11)',
  coral: '#FB7185',
  coralGlow: 'rgba(251, 113, 133, 0.46)',
  coralRhpNear: 'rgba(251, 113, 133, 0.055)',
  coralRhpFar: 'rgba(251, 113, 133, 0.15)',
  white: '#F8FAFC',
  whiteGlow: 'rgba(248, 250, 252, 0.36)',
  pillBg: 'rgba(11, 13, 18, 0.92)',
  pillBorder: 'rgba(148, 163, 184, 0.28)',
};

const TWO_PI = Math.PI * 2;
const FONT_MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const FONT_SANS = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';

const LAB_T_MIN = 0;
const LAB_T_MAX = 8.0;
const LAB_SETPOINT = 1.0;

// Type-0 2nd-order servo/spring-damper plant with realistic motor current lag:
//   tau_a * df/dt + f = u(t)
//   m * y'' + b * y' + k * y = f(t) - d(t)
const PLANT = {
  m: 0.5,
  b: 1.08,
  k: 0.85,
  tau: 0.13,
};

const QUIZ_SPLANE_BOUNDS = {
  sigmaMin: -2.8,
  sigmaMax: 1.2,
  omegaMin: -5.0,
  omegaMax: 5.0,
};

const QUIZ_TARGET_PAD = { left: 40, right: 16, top: 16, bottom: 22 };
const QUIZ_OPTION_PAD = { left: 26, right: 10, top: 10, bottom: 16 };

function getLabPad(width) {
  if (width < 430) {
    return { left: 36, right: 12, top: 14, bottom: 20 };
  }
  return { left: 46, right: 18, top: 16, bottom: 22 };
}

// ---------------------------------------------------------------------------
// Scoped Component Styles (injected once into <head>)
// ---------------------------------------------------------------------------
function injectStylesOnce() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('eigenlab-pid-graphs-styles')) return;

  const style = document.createElement('style');
  style.id = 'eigenlab-pid-graphs-styles';
  style.textContent = `
    @keyframes eigenlabPidShakeGentle {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(5px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(3px); }
    }
    .shake-gentle {
      animation: eigenlabPidShakeGentle 0.42s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .el-pid-canvas {
      display: block;
      width: 100%;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }
    .el-pid-pill {
      transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease, transform 120ms ease;
    }
    .el-pid-pill:active {
      transform: scale(0.97);
    }
    .el-pidq-card {
      transition: border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease, transform 160ms ease;
      cursor: pointer;
    }
    .el-pidq-card:hover:not([data-locked="true"]) {
      transform: translateY(-2px);
      border-color: rgba(34, 211, 238, 0.55);
      box-shadow: 0 10px 30px -12px rgba(34, 211, 238, 0.25);
    }
    .el-pidq-card[data-state="correct"] {
      border-color: rgba(52, 211, 153, 0.85) !important;
      background: linear-gradient(180deg, rgba(52, 211, 153, 0.12), rgba(15, 19, 28, 0.92)) !important;
      box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.35), 0 12px 32px -12px rgba(52, 211, 153, 0.35) !important;
    }
    .el-pidq-card[data-state="wrong"] {
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
    // Fall back to monospace
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

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function fmtPlain(val, decimals = 2) {
  if (!Number.isFinite(val)) return '0.00';
  const cleaned = Math.abs(val) < 0.004 ? 0 : val;
  return cleaned.toFixed(decimals);
}

function fmtSigned(val, decimals = 2) {
  if (!Number.isFinite(val)) return '0.00';
  const cleaned = Math.abs(val) < 0.004 ? 0 : val;
  const sign = cleaned > 0 ? '+' : '';
  return `${sign}${cleaned.toFixed(decimals)}`;
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
// Closed-Loop PID RK4 Physics Engine (Derivative-on-Measurement)
// ---------------------------------------------------------------------------
/**
 * Simulates a Type-0 2nd-order mechanical/servo plant with realistic actuator lag
 * under parallel PID control with derivative-on-measurement:
 *   e(t)  = r - y(t)
 *   uP(t) = Kp * e(t)
 *   uI(t) = Ki * ∫ e(τ) dτ
 *   uD(t) = -Kd * y'(t)
 *   u(t)  = uP + uI + uD
 */
function simulatePidLoop({
  kp = 4.0,
  ki = 1.4,
  kd = 1.2,
  setpoint = LAB_SETPOINT,
  disturbance = 0,
  distTime = 4.0,
  tMax = LAB_T_MAX,
  dt = 0.005,
  plant = PLANT,
}) {
  const steps = Math.max(100, Math.round(tMax / dt));
  const { m, b, k, tau } = plant;

  const tArr = new Float64Array(steps + 1);
  const yArr = new Float64Array(steps + 1);
  const vArr = new Float64Array(steps + 1);
  const eArr = new Float64Array(steps + 1);
  const uPArr = new Float64Array(steps + 1);
  const uIArr = new Float64Array(steps + 1);
  const uDArr = new Float64Array(steps + 1);
  const uArr = new Float64Array(steps + 1);

  let y = 0;
  let v = 0;
  let integ = 0;
  let f = 0;

  let yMin = 0;
  let yMax = Math.max(1.2, setpoint * 1.2);
  let uMin = -1.0;
  let uMax = 1.5;

  const deriv = (yy, vv, ii, ff, load) => {
    const ee = setpoint - yy;
    const uu = kp * ee + ki * ii - kd * vv;
    const df = tau > 1e-4 ? (uu - ff) / tau : 0;
    const effForce = tau > 1e-4 ? ff : uu;
    const acc = (effForce - load - b * vv - k * yy) / m;
    return [vv, acc, ee, df];
  };

  for (let i = 0; i <= steps; i++) {
    const t = i * dt;
    const load = disturbance !== 0 && t >= distTime ? disturbance : 0;
    const e = setpoint - y;
    const uP = kp * e;
    const uI = ki * integ;
    const uD = -kd * v;
    const u = uP + uI + uD;

    tArr[i] = t;
    yArr[i] = y;
    vArr[i] = v;
    eArr[i] = e;
    uPArr[i] = uP;
    uIArr[i] = uI;
    uDArr[i] = uD;
    uArr[i] = u;

    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
    const cMin = Math.min(uP, uI, uD, u);
    const cMax = Math.max(uP, uI, uD, u);
    if (cMin < uMin) uMin = cMin;
    if (cMax > uMax) uMax = cMax;

    if (i < steps) {
      const tMid = t + 0.5 * dt;
      const tEnd = t + dt;
      const d1 = load;
      const d2 = disturbance !== 0 && tMid >= distTime ? disturbance : 0;
      const d4 = disturbance !== 0 && tEnd >= distTime ? disturbance : 0;

      const [k1y, k1v, k1i, k1f] = deriv(y, v, integ, f, d1);
      const [k2y, k2v, k2i, k2f] = deriv(
        y + 0.5 * dt * k1y,
        v + 0.5 * dt * k1v,
        integ + 0.5 * dt * k1i,
        f + 0.5 * dt * k1f,
        d2
      );
      const [k3y, k3v, k3i, k3f] = deriv(
        y + 0.5 * dt * k2y,
        v + 0.5 * dt * k2v,
        integ + 0.5 * dt * k2i,
        f + 0.5 * dt * k2f,
        d2
      );
      const [k4y, k4v, k4i, k4f] = deriv(
        y + dt * k3y,
        v + dt * k3v,
        integ + dt * k3i,
        f + dt * k3f,
        d4
      );

      y += (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
      v += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
      integ += (dt / 6) * (k1i + 2 * k2i + 2 * k3i + k4i);
      f += (dt / 6) * (k1f + 2 * k2f + 2 * k3f + k4f);
    }
  }

  return {
    dt,
    steps,
    tMax,
    setpoint,
    disturbance,
    distTime,
    t: tArr,
    y: yArr,
    v: vArr,
    e: eArr,
    uP: uPArr,
    uI: uIArr,
    uD: uDArr,
    u: uArr,
    yBounds: [Math.min(-0.15, yMin - 0.14), Math.max(1.38, yMax + 0.16)],
    uBounds: [Math.min(-2.2, uMin - 0.45), Math.max(4.5, uMax + 0.55)],
  };
}

function sampleSimAt(sim, tRaw) {
  const t = clamp(Number(tRaw) || 0, 0, sim.tMax);
  const idxF = t / sim.dt;
  const i0 = clamp(Math.floor(idxF), 0, sim.steps);
  const i1 = clamp(i0 + 1, 0, sim.steps);
  const alpha = idxF - i0;
  const lerp = (arr) => arr[i0] + (arr[i1] - arr[i0]) * alpha;

  return {
    t,
    y: lerp(sim.y),
    v: lerp(sim.v),
    e: lerp(sim.e),
    uP: lerp(sim.uP),
    uI: lerp(sim.uI),
    uD: lerp(sim.uD),
    u: lerp(sim.u),
  };
}

// ---------------------------------------------------------------------------
// 5 One-Tap Controller Mode Presets for PidDecompositionLab
// ---------------------------------------------------------------------------
const PID_PRESETS = [
  {
    key: 'tuned-pid',
    label: 'Tuned PID',
    kp: 4.0,
    ki: 1.4,
    kd: 1.2,
    disturbance: 0.85,
    distTime: 4.0,
    defaultCursorT: 0.72,
    accent: 'cyan',
    summaryMath: 'Balanced P+I+D: fast rise, D brakes overshoot, I rejects load at t=4s',
    summaryMech: 'Balanced servo loop: D brakes overshoot while I shoulders the t=4s payload',
  },
  {
    key: 'p-only-droop',
    label: 'P-Only Droop',
    kp: 3.0,
    ki: 0.0,
    kd: 0.5,
    disturbance: 0,
    distTime: 4.0,
    defaultCursorT: 5.4,
    accent: 'coral',
    summaryMath: 'Ki = 0 on Type-0 plant → permanent steady-state error gap e_ss > 0',
    summaryMech: 'No integral action → gravity sags the arm permanently below θ_ref',
  },
  {
    key: 'pi-zero-error',
    label: 'PI Zero-Error',
    kp: 2.8,
    ki: 1.8,
    kd: 0.0,
    disturbance: 0,
    distTime: 4.0,
    defaultCursorT: 1.45,
    accent: 'violet',
    summaryMath: 'Integral channel u_I eliminates droop completely, with slight overshoot',
    summaryMech: 'Integral torque eliminates gravity sag, trading a bit of overshoot',
  },
  {
    key: 'pd-brake',
    label: 'PD Brake',
    kp: 4.5,
    ki: 0.0,
    kd: 2.2,
    disturbance: 0.85,
    distTime: 4.0,
    defaultCursorT: 5.5,
    accent: 'amber',
    summaryMath: 'Strong D-braking kills ringing, but Ki = 0 still droops under t=4s load',
    summaryMech: 'Heavy viscous D-braking kills ringing, but the arm sags under payload',
  },
  {
    key: 'high-i-ring',
    label: 'High-I Ring',
    kp: 5.5,
    ki: 5.0,
    kd: 0.1,
    disturbance: 0,
    distTime: 4.0,
    defaultCursorT: 1.05,
    accent: 'coral',
    summaryMath: 'Excessive Ki + tiny Kd erodes phase margin → dramatic near-marginal ringing!',
    summaryMech: 'Aggressive integral windup with minimal braking → violent servo ringing!',
  },
];

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

function drawEngineeringGrid(ctx, width, height, map, xMin, xMax, yMin, yMax, opts = {}) {
  const { showXLabels = true, showYLabels = true, xUnit = '', compact = false } = opts;
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);

  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, 'rgba(30, 41, 59, 0.22)');
  bgGrad.addColorStop(1, 'rgba(11, 13, 18, 0.0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(map.plotLeft, map.plotTop, map.plotW, map.plotH);

  // Vertical grid lines
  const xStep = niceStep(xMax - xMin, compact ? 4 : 6);
  const firstX = Math.ceil(xMin / xStep) * xStep;
  ctx.lineWidth = 1;
  ctx.font = `500 ${compact ? 9 : 10}px ${FONT_MONO}`;

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
      ctx.fillText(txt, px, map.plotBottom + 4);
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
      ctx.fillText(formatTickValue(gy), map.plotLeft - 5, py);
    }
  }

  // Explicit crisp zero axes
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
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x0, map.plotTop);
    ctx.lineTo(x0, map.plotBottom);
    ctx.stroke();
  }

  // Subtle frame border
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 1;
  ctx.strokeRect(map.plotLeft + 0.5, map.plotTop + 0.5, map.plotW - 1, map.plotH - 1);
}

function drawGlowingCurve(ctx, map, fn, xStart, xEnd, color, glowColor, lineWidth = 2.3, samples = 240, dash = null) {
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
    if (!Number.isFinite(y) || Math.abs(y) > 1e5) {
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
    ctx.shadowBlur = dash ? 6 : 9;
  }
  ctx.stroke();

  if (glowColor && !dash) {
    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(1.25, lineWidth - 0.55);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

function drawSampledCurve(ctx, map, tArr, yArr, color, glowColor, lineWidth = 2.2, dash = null, stride = 2) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
  ctx.clip();

  ctx.beginPath();
  const n = tArr.length;
  for (let i = 0; i < n; i += stride) {
    const px = map.xToPx(tArr[i]);
    const py = map.yToPx(yArr[i]);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  if ((n - 1) % stride !== 0) {
    ctx.lineTo(map.xToPx(tArr[n - 1]), map.yToPx(yArr[n - 1]));
  }

  if (dash) ctx.setLineDash(dash);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = dash ? 6 : 9;
  }
  ctx.stroke();

  if (glowColor && !dash) {
    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(1.2, lineWidth - 0.5);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

function drawFloatingPill(ctx, map, anchorX, anchorY, text, accentColor, preferAbove = true, compact = false) {
  ctx.save();
  ctx.font = `600 ${compact ? 9 : 10}px ${FONT_MONO}`;
  const metrics = ctx.measureText(text);
  const padX = compact ? 5 : 7;
  const pillW = Math.ceil(metrics.width + padX * 2 + 5);
  const pillH = compact ? 16 : 18;

  let x = anchorX + 9;
  if (x + pillW > map.plotRight - 4) {
    x = anchorX - pillW - 9;
  }
  x = clamp(x, map.plotLeft + 4, Math.max(map.plotLeft + 4, map.plotRight - pillW - 4));

  let y = preferAbove ? anchorY - pillH - 6 : anchorY + 6;
  if (y < map.plotTop + 3) y = anchorY + 7;
  if (y + pillH > map.plotBottom - 3) y = map.plotBottom - pillH - 3;

  drawRoundedRect(ctx, x, y, pillW, pillH, 4.5);
  ctx.fillStyle = COLORS.pillBg;
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.0;
  ctx.stroke();

  ctx.fillStyle = accentColor;
  drawRoundedRect(ctx, x + 3, y + 3.5, 2.5, pillH - 7, 1.25);
  ctx.fill();

  ctx.fillStyle = '#F8FAFC';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + (compact ? 8 : 9.5), y + pillH / 2 + 0.5);
  ctx.restore();
}

function drawGlowingDot(ctx, px, py, radius, fillColor, glowColor) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(px, py, radius + 2.2, 0, TWO_PI);
  ctx.fillStyle = glowColor;
  ctx.globalAlpha = 0.28;
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, TWO_PI);
  ctx.fillStyle = fillColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 8;
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = COLORS.bg;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

function drawMiniSPlane(ctx, width, height, map, bounds, poles, poleTag, pulse, compact) {
  const { sigmaMin, sigmaMax, omegaMin, omegaMax } = bounds;
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);

  const x0 = map.xToPx(0);
  const y0 = map.yToPx(0);

  // LHP Emerald & RHP Coral fills
  const lhpW = Math.max(0, Math.min(x0, map.plotRight) - map.plotLeft);
  if (lhpW > 1) {
    const lhpGrad = ctx.createLinearGradient(map.plotLeft, 0, map.plotLeft + lhpW, 0);
    lhpGrad.addColorStop(0, COLORS.emeraldLhpFar);
    lhpGrad.addColorStop(1, COLORS.emeraldLhpNear);
    ctx.fillStyle = lhpGrad;
    ctx.fillRect(map.plotLeft, map.plotTop, lhpW, map.plotH);
  }
  const rhpLeft = Math.max(map.plotLeft, x0);
  const rhpW = Math.max(0, map.plotRight - rhpLeft);
  if (rhpW > 1) {
    const rhpGrad = ctx.createLinearGradient(rhpLeft, 0, map.plotRight, 0);
    rhpGrad.addColorStop(0, COLORS.coralRhpNear);
    rhpGrad.addColorStop(1, COLORS.coralRhpFar);
    ctx.fillStyle = rhpGrad;
    ctx.fillRect(rhpLeft, map.plotTop, rhpW, map.plotH);
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
  ctx.clip();

  // Grid lines
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
  for (let w = -4; w <= 4; w += 2) {
    if (w === 0) continue;
    const py = Math.round(map.yToPx(w)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(map.plotLeft, py);
    ctx.lineTo(map.plotRight, py);
    ctx.stroke();
  }

  // Real axis
  const y0Snap = Math.round(y0) + 0.5;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.42)';
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(map.plotLeft, y0Snap);
  ctx.lineTo(map.plotRight, y0Snap);
  ctx.stroke();

  // Glowing Amber jω stability boundary
  const x0Snap = Math.round(x0) + 0.5;
  ctx.save();
  ctx.strokeStyle = COLORS.amber;
  ctx.lineWidth = 2.0;
  ctx.shadowColor = COLORS.amberGlow;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(x0Snap, map.plotTop);
  ctx.lineTo(x0Snap, map.plotBottom);
  ctx.stroke();
  ctx.restore();

  // Region labels
  ctx.font = `700 ${compact ? 8.5 : 9.5}px ${FONT_MONO}`;
  ctx.textBaseline = 'top';
  if (lhpW > 50) {
    ctx.fillStyle = 'rgba(52, 211, 153, 0.72)';
    ctx.textAlign = 'left';
    ctx.fillText('STABLE LHP', map.plotLeft + 6, map.plotTop + 5);
  }
  if (rhpW > 36) {
    ctx.fillStyle = 'rgba(251, 113, 133, 0.8)';
    ctx.textAlign = 'right';
    ctx.fillText(rhpW > 84 ? 'UNSTABLE RHP' : 'RHP', map.plotRight - 5, map.plotTop + 5);
  }

  ctx.font = `600 ${compact ? 8.5 : 9.5}px ${FONT_MONO}`;
  ctx.fillStyle = 'rgba(252, 211, 77, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText('jω', x0Snap + 4, map.plotTop + 5);

  ctx.fillStyle = 'rgba(148, 163, 184, 0.72)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Re(s)', map.plotRight - 5, y0Snap - 3);

  // Conjugate dashed link
  if (poles.length === 2) {
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.25)';
    ctx.lineWidth = 1.1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(map.xToPx(poles[0].sigma), map.yToPx(poles[0].omega));
    ctx.lineTo(map.xToPx(poles[1].sigma), map.yToPx(poles[1].omega));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Pole × markers
  const sz = compact ? 5.5 : 6.8;
  for (const p of poles) {
    const px = map.xToPx(p.sigma);
    const py = map.yToPx(p.omega);
    ctx.beginPath();
    ctx.arc(px, py, sz + 4 + pulse * 3.5, 0, TWO_PI);
    ctx.strokeStyle = p.color;
    ctx.globalAlpha = 0.28 + 0.28 * (1 - pulse);
    ctx.lineWidth = 1.25;
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.shadowColor = p.glow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(px - sz, py - sz);
    ctx.lineTo(px + sz, py + sz);
    ctx.moveTo(px + sz, py - sz);
    ctx.lineTo(px - sz, py + sz);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(px - sz * 0.68, py - sz * 0.68);
    ctx.lineTo(px + sz * 0.68, py + sz * 0.68);
    ctx.moveTo(px + sz * 0.68, py - sz * 0.68);
    ctx.lineTo(px - sz * 0.68, py + sz * 0.68);
    ctx.stroke();
  }

  ctx.restore();

  // Axis ticks
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
  for (let w = -4; w <= 4; w += 2) {
    if (w < omegaMin || w > omegaMax) continue;
    const py = map.yToPx(w);
    ctx.fillStyle = w === 0 ? 'rgba(203, 213, 225, 0.85)' : COLORS.axisLabel;
    ctx.fillText(w === 0 ? '0' : `${w > 0 ? '+' : ''}${w}j`, map.plotLeft - 5, py);
  }

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
  ctx.lineWidth = 1;
  ctx.strokeRect(map.plotLeft + 0.5, map.plotTop + 0.5, map.plotW - 1, map.plotH - 1);

  if (poles.length > 0 && poleTag) {
    drawFloatingPill(
      ctx,
      map,
      map.xToPx(poles[0].sigma),
      map.yToPx(poles[0].omega),
      poleTag,
      poles[0].color,
      true,
      compact
    );
  }
}

// ===========================================================================
// PART 1: PidDecompositionLab (2-Panel Synchronized Output ↔ P/I/D Effort Lab)
// ===========================================================================
export class PidDecompositionLab {
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
      initialPreset = 'tuned-pid',
      onInteract = null,
      onOpenQuiz = null,
    } = options;

    this.mechatronicsLens = Boolean(mechatronicsLens);
    this.onInteract = typeof onInteract === 'function' ? onInteract : null;
    this.onOpenQuiz = typeof onOpenQuiz === 'function' ? onOpenQuiz : null;

    this._presetMap = new Map(PID_PRESETS.map((p) => [p.key, p]));
    this._simCache = new Map();

    const startPreset = this._presetMap.get(initialPreset) || PID_PRESETS[0];
    this.presetKey = startPreset.key;
    this.kp = startPreset.kp;
    this.ki = startPreset.ki;
    this.kd = startPreset.kd;
    this.disturbance = startPreset.disturbance;
    this.distTime = startPreset.distTime;
    this.cursorT = startPreset.defaultCursorT;

    this._sim = this._getOrSimulate(startPreset);
    this._hasInteracted = false;
    this._userDraggedCursor = false;
    this._isDragging = false;
    this._activePointerId = null;

    this._container = null;
    this._root = null;
    this._canvases = [];
    this._ctxs = [];
    this._sizes = [
      { w: 0, h: 132 },
      { w: 0, h: 132 },
    ];
    this._panelMetaEls = [];
    this._presetButtons = new Map();
    this._telemetryEls = {};

    this._resizeObserver = null;
    this._abortController = null;
    this._rafId = null;
    this._pulsePhase = 0;
    this._lastFrameTs = 0;
    this._lastTickMs = 0;
    this._lastTickBucket = -1;
    this._disposed = false;

    if (autoMountContainer) {
      this.mount(autoMountContainer);
    }
  }

  static get PRESETS() {
    return PID_PRESETS;
  }

  _getOrSimulate(preset) {
    if (preset && preset.key && this._simCache.has(preset.key)) {
      return this._simCache.get(preset.key);
    }
    const sim = simulatePidLoop({
      kp: preset.kp,
      ki: preset.ki,
      kd: preset.kd,
      disturbance: preset.disturbance || 0,
      distTime: preset.distTime || 4.0,
    });
    if (preset && preset.key) {
      this._simCache.set(preset.key, sim);
    }
    return sim;
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

    // Row 1: 5 One-Tap Controller Mode Preset Pills (horizontally scrollable on 390px)
    const pillRow = document.createElement('div');
    pillRow.className =
      'flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap sm:flex-wrap pb-0.5 sm:pb-0';
    this._presetButtons.clear();

    for (const preset of PID_PRESETS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.presetKey = preset.key;
      btn.className =
        'el-pid-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer';
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

    // Row 2: Compact Live Telemetry Pill Strip (zero overflow on 390px)
    const telemetryRow = document.createElement('div');
    telemetryRow.className =
      'flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap sm:flex-wrap';

    const makePill = (extraClasses) => {
      const el = document.createElement('span');
      el.className = `shrink-0 whitespace-nowrap px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border ${extraClasses}`;
      return el;
    };

    const tPill = makePill('bg-slate-900/95 border-slate-700/80 text-slate-200');
    const yPill = makePill('bg-cyan-500/10 border-cyan-400/40 text-cyan-200');
    const ePill = makePill('bg-rose-500/10 border-rose-400/45 text-rose-200');
    const uPPill = makePill('bg-cyan-500/10 border-cyan-400/35 text-cyan-300');
    const uIPill = makePill('bg-violet-500/10 border-violet-400/40 text-violet-300');
    const uDPill = makePill('bg-amber-500/10 border-amber-400/40 text-amber-300');
    const uTotPill = makePill('bg-slate-100/10 border-slate-300/40 text-slate-100');

    telemetryRow.append(tPill, yPill, ePill, uPPill, uIPill, uDPill, uTotPill);

    // Row 3 (Desktop/tablet only): Live KaTeX PID law + active preset insight
    const desktopRow = document.createElement('div');
    desktopRow.className = 'hidden sm:flex flex-wrap items-center justify-between gap-2 text-xs';

    const formulaEl = document.createElement('div');
    formulaEl.className = 'text-cyan-200/95 font-medium flex items-center gap-2';

    const summaryEl = document.createElement('div');
    summaryEl.className = 'text-[11px] text-slate-400 truncate';

    desktopRow.append(formulaEl, summaryEl);

    this._telemetryEls = {
      tPill,
      yPill,
      ePill,
      uPPill,
      uIPill,
      uDPill,
      uTotPill,
      formulaEl,
      summaryEl,
    };

    topBar.append(pillRow, telemetryRow, desktopRow);
    root.appendChild(topBar);

    // --- 2. Synchronized 2-Panel Canvas Stack ---
    const stackWrap = document.createElement('div');
    stackWrap.className = 'divide-y divide-slate-800/80 bg-[#0B0D12]';
    stackWrap.tabIndex = 0;
    stackWrap.setAttribute(
      'aria-label',
      'Interactive PID closed-loop response and P I D control effort breakdown; drag horizontally or use left and right arrow keys to scrub time cursor'
    );

    const panelDots = [COLORS.cyan, COLORS.violet];
    const panelHeights = ['h-[132px] sm:h-[175px]', 'h-[132px] sm:h-[175px]'];

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
      canvasWrap.className = `relative w-full cursor-ew-resize ${panelHeights[i]}`;

      const canvas = document.createElement('canvas');
      canvas.className = 'el-pid-canvas h-full';
      canvas.style.touchAction = 'none';
      canvasWrap.appendChild(canvas);
      panel.appendChild(canvasWrap);

      stackWrap.appendChild(panel);

      this._canvases.push(canvas);
      this._ctxs.push(canvas.getContext('2d'));
      this._sizes[i] = { w: 0, h: 132 };
      this._panelMetaEls.push({ titleEl, readoutEl, canvasWrap });

      this._bindCursorScrubEvents(canvas, signal);
    }

    // Keyboard time scrubbing when focused
    stackWrap.addEventListener(
      'keydown',
      (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        const step = e.shiftKey ? 0.5 : 0.12;
        const delta = e.key === 'ArrowRight' ? step : -step;
        this._userDraggedCursor = true;
        this._applyScrubbedTime(this.cursorT + delta, true);
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
      footerNote.textContent = 'Drag the vertical cursor on either chart to inspect P, I & D channels.';

      const ctaBtn = document.createElement('button');
      ctaBtn.type = 'button';
      ctaBtn.className =
        'el-pid-pill w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-100 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(34,211,238,0.16)]';
      ctaBtn.textContent = 'Test Your Intuition: PID Tuning Quiz →';
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

  _bindCursorScrubEvents(canvas, signal) {
    const pointerToTime = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 20) return null;
      const pad = getLabPad(rect.width);
      const map = createPlotMapper(rect.width, rect.height, pad, LAB_T_MIN, LAB_T_MAX, 0, 1);
      const localX = clientX - rect.left;
      return clamp(map.pxToX(localX), LAB_T_MIN, LAB_T_MAX);
    };

    canvas.addEventListener(
      'pointerdown',
      (e) => {
        const nextT = pointerToTime(e.clientX);
        if (nextT === null) return;
        this._isDragging = true;
        this._activePointerId = e.pointerId;
        this._userDraggedCursor = true;
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {
          // Ignore synthetic events
        }
        this._applyScrubbedTime(nextT, true);
      },
      { signal }
    );

    canvas.addEventListener(
      'pointermove',
      (e) => {
        if (!this._isDragging || e.pointerId !== this._activePointerId) return;
        const nextT = pointerToTime(e.clientX);
        if (nextT === null) return;
        this._applyScrubbedTime(nextT, true);
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
        this._drawAll();
      }
    };

    canvas.addEventListener('pointerup', endDrag, { signal });
    canvas.addEventListener('pointercancel', endDrag, { signal });
  }

  _applyScrubbedTime(rawT, allowAudio) {
    const nextT = clamp(Number(rawT) || 0, LAB_T_MIN, LAB_T_MAX);
    this.cursorT = nextT;

    if (allowAudio) {
      const bucket = Math.round(nextT * 2); // gentle 0.5s ticks
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (bucket !== this._lastTickBucket && now - this._lastTickMs > 65) {
        this._lastTickBucket = bucket;
        this._lastTickMs = now;
        safeSound('playTick');
      }
    }

    this._updateTelemetryAndReadouts();
    this._drawAll();
    if (allowAudio) this._markInteracted();
  }

  _markInteracted() {
    if (!this._hasInteracted) {
      this._hasInteracted = true;
      try {
        this.onInteract?.({
          presetKey: this.presetKey,
          t: this.cursorT,
          kp: this.kp,
          ki: this.ki,
          kd: this.kd,
        });
      } catch (_) {
        // Ignore consumer errors
      }
    }
  }

  setPreset(key) {
    const preset = this._presetMap.get(key);
    if (!preset) return;
    this.presetKey = preset.key;
    this.kp = preset.kp;
    this.ki = preset.ki;
    this.kd = preset.kd;
    this.disturbance = preset.disturbance;
    this.distTime = preset.distTime;
    this._sim = this._getOrSimulate(preset);

    // Jump cursor to the preset's educational sweet spot unless user already dragged
    if (!this._userDraggedCursor) {
      this.cursorT = preset.defaultCursorT;
    }

    this._syncControlUI();
    this._drawAll();
  }

  setGains({ kp, ki, kd, disturbance = 0, distTime = 4.0 } = {}) {
    if (Number.isFinite(Number(kp))) this.kp = Number(kp);
    if (Number.isFinite(Number(ki))) this.ki = Number(ki);
    if (Number.isFinite(Number(kd))) this.kd = Number(kd);
    this.disturbance = Number.isFinite(Number(disturbance)) ? Number(disturbance) : 0;
    this.distTime = Number.isFinite(Number(distTime)) ? Number(distTime) : 4.0;
    this.presetKey = null;
    this._sim = simulatePidLoop({
      kp: this.kp,
      ki: this.ki,
      kd: this.kd,
      disturbance: this.disturbance,
      distTime: this.distTime,
    });
    this._syncControlUI();
    this._drawAll();
  }

  setTime(t) {
    this._applyScrubbedTime(t, false);
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

    for (const [key, btn] of this._presetButtons.entries()) {
      const preset = this._presetMap.get(key);
      const isActive = key === this.presetKey;
      if (isActive) {
        if (preset?.accent === 'coral') {
          btn.className =
            'el-pid-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border cursor-pointer bg-rose-500/15 border-rose-400/70 text-rose-200 shadow-[0_0_14px_rgba(251,113,133,0.22)]';
        } else if (preset?.accent === 'violet') {
          btn.className =
            'el-pid-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border cursor-pointer bg-violet-500/15 border-violet-400/70 text-violet-200 shadow-[0_0_14px_rgba(167,139,250,0.22)]';
        } else if (preset?.accent === 'amber') {
          btn.className =
            'el-pid-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border cursor-pointer bg-amber-400/15 border-amber-400/70 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.22)]';
        } else {
          btn.className =
            'el-pid-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border cursor-pointer bg-cyan-400/15 border-cyan-400/70 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.22)]';
        }
      } else {
        btn.className =
          'el-pid-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700';
      }
    }

    const titles = this.mechatronicsLens
      ? ['Servo Position θ(t) [rad] vs Ref', 'Motor Torque τ(t) [N·m] (P/I/D Channels)']
      : ['Closed-Loop Output y(t)', 'Controller Output u(t) = u_P + u_I + u_D'];

    for (let i = 0; i < 2; i++) {
      if (this._panelMetaEls[i]) {
        this._panelMetaEls[i].titleEl.textContent = titles[i];
      }
    }

    this._updateTelemetryAndReadouts();
  }

  _updateTelemetryAndReadouts() {
    if (!this._root) return;
    const sample = sampleSimAt(this._sim, this.cursorT);
    const settled = Math.abs(sample.e) <= 0.02;

    const { tPill, yPill, ePill, uPPill, uIPill, uDPill, uTotPill, formulaEl, summaryEl } =
      this._telemetryEls;

    const ySym = this.mechatronicsLens ? 'θ' : 'y';
    const uSym = this.mechatronicsLens ? 'τ' : 'u';

    if (tPill) tPill.textContent = `t=${fmtPlain(sample.t, 2)}s`;
    if (yPill) yPill.textContent = `${ySym}=${fmtPlain(sample.y, 2)}`;
    if (ePill) {
      ePill.textContent = `e=${fmtSigned(sample.e, 2)}`;
      ePill.className = settled
        ? 'shrink-0 whitespace-nowrap px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border bg-emerald-500/15 border-emerald-400/55 text-emerald-200'
        : 'shrink-0 whitespace-nowrap px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border bg-rose-500/12 border-rose-400/45 text-rose-200';
    }
    if (uPPill) uPPill.textContent = `uP ${fmtSigned(sample.uP, 2)}`;
    if (uIPill) uIPill.textContent = `uI ${fmtSigned(sample.uI, 2)}`;
    if (uDPill) uDPill.textContent = `uD ${fmtSigned(sample.uD, 2)}`;
    if (uTotPill) uTotPill.textContent = `Σ${uSym} ${fmtSigned(sample.u, 2)}`;

    if (this._panelMetaEls.length === 2) {
      this._panelMetaEls[0].readoutEl.textContent = `Kp=${fmtPlain(this.kp, 1)} Ki=${fmtPlain(this.ki, 1)} Kd=${fmtPlain(this.kd, 1)}`;
      this._panelMetaEls[1].readoutEl.innerHTML =
        `<span class="text-cyan-300">P</span> <span class="text-violet-300">I</span> <span class="text-amber-300">D</span> <span class="text-slate-100">Σ${uSym}</span>`;
    }

    if (formulaEl) {
      const tex = this.mechatronicsLens
        ? `\\tau(t) = ${fmtPlain(this.kp, 1)}\\,e + ${fmtPlain(this.ki, 1)}\\!\\int e\\,dt - ${fmtPlain(this.kd, 1)}\\,\\dot{\\theta}`
        : `u(t) = ${fmtPlain(this.kp, 1)}\\,e + ${fmtPlain(this.ki, 1)}\\!\\int e\\,dt - ${fmtPlain(this.kd, 1)}\\,\\dot{y}`;
      formulaEl.innerHTML = `
        <span class="text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">
          ${this.mechatronicsLens ? 'Servo PID' : 'PID Law'}
        </span>
        <span>${formatKatex(tex, false)}</span>
      `;
    }

    if (summaryEl) {
      const activePreset = this._presetMap.get(this.presetKey);
      summaryEl.textContent = activePreset
        ? this.mechatronicsLens
          ? activePreset.summaryMech
          : activePreset.summaryMath
        : 'Custom PID gains active';
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
    const sample = sampleSimAt(this._sim, this.cursorT);

    for (let i = 0; i < 2; i++) {
      const ctx = this._ctxs[i];
      const { w, h } = this._sizes[i];
      if (!ctx || w < 20 || h < 20) continue;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (i === 0) this._drawOutputPanel(ctx, w, h, sample, pulse);
      else this._drawEffortPanel(ctx, w, h, sample, pulse);
    }
  }

  _drawCanvases() {
    this._drawAll();
  }

  _drawOutputPanel(ctx, w, h, sample, pulse) {
    const compact = w < 430;
    const pad = getLabPad(w);
    const [yMin, yMax] = this._sim.yBounds;
    const map = createPlotMapper(w, h, pad, LAB_T_MIN, LAB_T_MAX, yMin, yMax);

    drawEngineeringGrid(ctx, w, h, map, LAB_T_MIN, LAB_T_MAX, yMin, yMax, {
      showXLabels: true,
      showYLabels: true,
      xUnit: 's',
      compact,
    });

    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    // 1. Subtle 2% Emerald settling band (0.98 .. 1.02)
    const pyBandTop = map.yToPx(LAB_SETPOINT * 1.02);
    const pyBandBot = map.yToPx(LAB_SETPOINT * 0.98);
    ctx.fillStyle = COLORS.emeraldBand;
    ctx.fillRect(map.plotLeft, pyBandTop, map.plotW, Math.max(2, pyBandBot - pyBandTop));

    // 2. Dashed Emerald setpoint line r = 1.0
    const pyRef = Math.round(map.yToPx(LAB_SETPOINT)) + 0.5;
    ctx.strokeStyle = COLORS.emerald;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 4]);
    ctx.shadowColor = COLORS.emeraldGlow;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(map.plotLeft, pyRef);
    ctx.lineTo(map.plotRight, pyRef);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Tiny setpoint badge top-left
    ctx.font = `600 ${compact ? 8.5 : 9.5}px ${FONT_MONO}`;
    ctx.fillStyle = 'rgba(52, 211, 153, 0.88)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(this.mechatronicsLens ? 'θ_ref=1.0 (±2%)' : 'r=1.0 (±2%)', map.plotLeft + 5, pyRef - 3);

    // 3. Soft translucent Cyan fill under y(t)
    const pyZero = clamp(map.yToPx(0), map.plotTop, map.plotBottom);
    ctx.beginPath();
    ctx.moveTo(map.xToPx(this._sim.t[0]), pyZero);
    for (let i = 0; i < this._sim.t.length; i += 4) {
      ctx.lineTo(map.xToPx(this._sim.t[i]), map.yToPx(this._sim.y[i]));
    }
    ctx.lineTo(map.xToPx(this._sim.t[this._sim.t.length - 1]), pyZero);
    ctx.closePath();
    ctx.fillStyle = 'rgba(34, 211, 238, 0.075)';
    ctx.fill();

    // 4. Coral vertical dashed disturbance marker at t = 4.0s (when active)
    if (this._sim.disturbance > 0) {
      const pxDist = Math.round(map.xToPx(this._sim.distTime)) + 0.5;
      ctx.strokeStyle = COLORS.coral;
      ctx.lineWidth = 1.35;
      ctx.setLineDash([4, 3]);
      ctx.shadowColor = COLORS.coralGlow;
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.moveTo(pxDist, map.plotTop);
      ctx.lineTo(pxDist, map.plotBottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      const dLabel = this.mechatronicsLens ? 'Payload t=4s' : 'Load d(t)';
      ctx.font = `600 ${compact ? 8.5 : 9.5}px ${FONT_MONO}`;
      const dw = ctx.measureText(dLabel).width + 8;
      const dx = clamp(pxDist + 4, map.plotLeft + 4, map.plotRight - dw - 4);
      const dy = map.plotTop + 4;
      drawRoundedRect(ctx, dx, dy, dw, 15, 3.5);
      ctx.fillStyle = 'rgba(11, 13, 18, 0.88)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.65)';
      ctx.lineWidth = 0.85;
      ctx.stroke();
      ctx.fillStyle = '#FDA4AF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(dLabel, dx + 4, dy + 8);
    }

    ctx.restore();

    // 5. Glowing Cyan response curve y(t)
    drawSampledCurve(ctx, map, this._sim.t, this._sim.y, COLORS.cyan, COLORS.cyanGlow, 2.4, null, 2);

    // 6. Unified vertical time cursor + glowing vertical error bar e(t) = 1 - y(t)
    const pxCur = map.xToPx(sample.t);
    const pyCurY = map.yToPx(sample.y);
    const settled = Math.abs(sample.e) <= 0.02;
    const errColor = settled ? COLORS.emerald : COLORS.coral;
    const errGlow = settled ? COLORS.emeraldGlow : COLORS.coralGlow;

    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    // Faint full-height cursor guide
    ctx.strokeStyle = this._isDragging ? 'rgba(248, 250, 252, 0.55)' : 'rgba(248, 250, 252, 0.30)';
    ctx.lineWidth = this._isDragging ? 1.5 : 1.15;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pxCur, map.plotTop);
    ctx.lineTo(pxCur, map.plotBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing vertical error bar between y(t) and r = 1.0
    if (Math.abs(pyRef - pyCurY) >= 2.5) {
      ctx.strokeStyle = errColor;
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.shadowColor = errGlow;
      ctx.shadowBlur = 11;
      ctx.beginPath();
      ctx.moveTo(pxCur, pyCurY);
      ctx.lineTo(pxCur, pyRef);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Tiny horizontal end caps on error bar
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(pxCur - 4, pyRef);
      ctx.lineTo(pxCur + 4, pyRef);
      ctx.stroke();
    }

    ctx.restore();

    // Top handle triangle on cursor
    ctx.save();
    ctx.fillStyle = COLORS.white;
    ctx.shadowColor = COLORS.cyanGlow;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(pxCur, map.plotTop + 6);
    ctx.lineTo(pxCur - 4.5, map.plotTop);
    ctx.lineTo(pxCur + 4.5, map.plotTop);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Glowing dot on y(t)
    drawGlowingDot(ctx, pxCur, pyCurY, 4.0, COLORS.cyan, COLORS.cyanGlow);

    // Floating compact error callout pill
    const midErrY = (pyCurY + pyRef) * 0.5;
    drawFloatingPill(
      ctx,
      map,
      pxCur,
      midErrY,
      `e=${fmtSigned(sample.e, 2)}`,
      errColor,
      sample.y < LAB_SETPOINT,
      compact
    );

    // Subtle drag prompt bottom-left until user interacts
    if (!this._hasInteracted) {
      ctx.save();
      const hintTxt = compact ? 'Drag cursor t' : 'Drag cursor to scrub t ∈ [0, 8s]';
      ctx.font = `600 ${compact ? 8.5 : 9.5}px ${FONT_SANS}`;
      const tw = ctx.measureText(hintTxt).width + 12;
      const hx = map.plotLeft + 6;
      const hy = map.plotBottom - 20;
      drawRoundedRect(ctx, hx, hy, tw, 16, 4.5);
      ctx.fillStyle = 'rgba(15, 19, 28, 0.86)';
      ctx.fill();
      ctx.strokeStyle = `rgba(34, 211, 238, ${(0.34 + 0.3 * pulse).toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#BAE6FD';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(hintTxt, hx + 6, hy + 8.5);
      ctx.restore();
    }
  }

  _drawEffortPanel(ctx, w, h, sample, _pulse) {
    const compact = w < 430;
    const pad = getLabPad(w);
    const [uMin, uMax] = this._sim.uBounds;
    const map = createPlotMapper(w, h, pad, LAB_T_MIN, LAB_T_MAX, uMin, uMax);

    drawEngineeringGrid(ctx, w, h, map, LAB_T_MIN, LAB_T_MAX, uMin, uMax, {
      showXLabels: true,
      showYLabels: true,
      xUnit: 's',
      compact,
    });

    // Disturbance marker synced with Panel 1
    if (this._sim.disturbance > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
      ctx.clip();
      const pxDist = Math.round(map.xToPx(this._sim.distTime)) + 0.5;
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(pxDist, map.plotTop);
      ctx.lineTo(pxDist, map.plotBottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Channel curves: u_P (Cyan), u_I (Violet), u_D (Amber), and total Σu (dashed White)
    drawSampledCurve(ctx, map, this._sim.t, this._sim.uP, COLORS.cyan, COLORS.cyanGlow, 1.85, null, 2);
    drawSampledCurve(ctx, map, this._sim.t, this._sim.uI, COLORS.violet, COLORS.violetGlow, 1.95, null, 2);
    drawSampledCurve(ctx, map, this._sim.t, this._sim.uD, COLORS.amber, COLORS.amberGlow, 1.85, null, 2);
    drawSampledCurve(ctx, map, this._sim.t, this._sim.u, COLORS.white, COLORS.whiteGlow, 1.9, [5, 3.5], 2);

    // Unified synchronized vertical cursor line
    const pxCur = map.xToPx(sample.t);
    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    ctx.strokeStyle = this._isDragging ? 'rgba(248, 250, 252, 0.58)' : 'rgba(248, 250, 252, 0.30)';
    ctx.lineWidth = this._isDragging ? 1.5 : 1.15;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pxCur, map.plotTop);
    ctx.lineTo(pxCur, map.plotBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing cursor dots on each channel
    drawGlowingDot(ctx, pxCur, map.yToPx(sample.uP), 3.3, COLORS.cyan, COLORS.cyanGlow);
    drawGlowingDot(ctx, pxCur, map.yToPx(sample.uI), 3.3, COLORS.violet, COLORS.violetGlow);
    drawGlowingDot(ctx, pxCur, map.yToPx(sample.uD), 3.3, COLORS.amber, COLORS.amberGlow);
    drawGlowingDot(ctx, pxCur, map.yToPx(sample.u), 3.7, COLORS.white, COLORS.whiteGlow);

    ctx.restore();

    // Floating total effort callout pill
    const uSym = this.mechatronicsLens ? 'Στ' : 'Σu';
    drawFloatingPill(
      ctx,
      map,
      pxCur,
      map.yToPx(sample.u),
      `${uSym}=${fmtSigned(sample.u, 2)}`,
      COLORS.white,
      sample.u >= 0,
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
    this._root = null;
  }
}

// ===========================================================================
// PART 2: PidVisualQuizEngine (6-Challenge PID Visual Intuition Quiz)
// ===========================================================================

// Pre-compute exact physics waveform for Challenge 3 (Identify u_D(t) = -Kd * y'(t))
const Q3_SIM = simulatePidLoop({
  kp: 3.6,
  ki: 1.9,
  kd: 0.75,
  disturbance: 0,
  tMax: 6.0,
  dt: 0.005,
});

// Find exact peak time of Q3_SIM y(t) where y'(t) = 0 -> u_D(t_peak) = 0!
let Q3_PEAK_T = 1.05;
let Q3_PEAK_Y = 0;
let Q3_MIN_UD_T = 0.35;
let Q3_MIN_UD = 0;
for (let i = 0; i <= Q3_SIM.steps; i++) {
  if (Q3_SIM.y[i] > Q3_PEAK_Y) {
    Q3_PEAK_Y = Q3_SIM.y[i];
    Q3_PEAK_T = Q3_SIM.t[i];
  }
  if (Q3_SIM.uD[i] < Q3_MIN_UD) {
    Q3_MIN_UD = Q3_SIM.uD[i];
    Q3_MIN_UD_T = Q3_SIM.t[i];
  }
}

// Pre-compute exact disturbance rejection traces for Challenge 4 (disturbance at t = 3.5s)
const Q4_PID_SIM = simulatePidLoop({
  kp: 4.2,
  ki: 2.2,
  kd: 1.4,
  disturbance: 0.9,
  distTime: 3.5,
  tMax: 7.5,
  dt: 0.005,
});

const Q4_PD_SIM = simulatePidLoop({
  kp: 4.5,
  ki: 0.0,
  kd: 1.6,
  disturbance: 0.9,
  distTime: 3.5,
  tMax: 7.5,
  dt: 0.005,
});

const PID_QUIZ_CHALLENGES = [
  {
    id: 'pid-quiz-1',
    badge: 'Steady-State Droop',
    title: 'P-Only Droop → Integral Action (Ki)',
    tDomain: [0, 6.5],
    targetType: 'droop',
    targetTitleMath: 'P-Only Response (Ki = 0, Droop)',
    targetTitleMech: 'P-Only Gravity-Loaded Arm (Ki = 0)',
    targetFormulaMath: 'K_i = 0 \\implies e_{ss} > 0',
    targetFormulaMech: 'K_i = 0 \\implies \\text{Gravity Sag}',
    promptMath:
      'A gravity-loaded Type-0 plant under P-only control settles below $r = 1.0$. Which response shows adding Integral gain ($K_i > 0$) to eliminate steady-state error?',
    promptMech:
      'A gravity-loaded servo arm under P-only control sags permanently below $\\theta_{\\text{ref}} = 1.0$. Which trace shows adding Integral action ($K_i > 0$)?',
    targetFn: (t) => 0.72 * (1 - Math.exp(-1.15 * t) * (Math.cos(2.3 * t) + 0.5 * Math.sin(2.3 * t))),
    targetYBounds: [-0.12, 1.32],
    proofOverlay: { type: 'zero-error', setpoint: 1.0 },
    proofTextMath:
      'Integral action $u_I(t) = K_i\\int e\\,dt$ keeps ramping up as long as any error $e > 0$ remains, driving $e_{ss} \\to 0$ so $y(t)$ locks squarely onto $r = 1.0$.',
    proofTextMech:
      'The integrator builds steady holding torque $\\tau_I$ equal to gravity until the arm lifts all the way to $\\theta_{\\text{ref}} = 1.0$ with zero sag.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        yBounds: [-0.12, 1.35],
        showSetpoint: true,
        fn: (t) => 0.83 * (1 - Math.exp(-1.2 * t) * Math.cos(3.0 * t)),
        wrongHintMath:
          'That curve settles around $0.83$ — still below $r = 1.0$! Higher $K_p$ shrinks droop, but only $K_i > 0$ drives $e_{ss}$ all the way to zero.',
        wrongHintMech:
          'Raising $K_p$ alone reduces sag (from $0.72$ to $0.83$), but the arm still cannot hold $\\theta_{\\text{ref}} = 1.0$ without an integrator ($K_i > 0$).',
      },
      {
        letter: 'B',
        isCorrect: true,
        yBounds: [-0.12, 1.38],
        showSetpoint: true,
        fn: (t) => 1.0 - Math.exp(-0.85 * t) * (Math.cos(2.2 * t) + 0.18 * Math.sin(2.2 * t)),
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        yBounds: [-0.6, 2.5],
        showSetpoint: true,
        fn: (t) => 1.0 - 0.35 * Math.exp(0.24 * t) * Math.cos(3.2 * t),
        wrongHintMath:
          'Those oscillations are growing without bound (RHP instability). Moderate Integral gain $K_i > 0$ eliminates droop cleanly while staying stable.',
        wrongHintMech:
          'That is runaway instability! Properly added $K_i > 0$ lifts the arm smoothly to $\\theta_{\\text{ref}} = 1.0$ without blowing up.',
      },
    ],
  },
  {
    id: 'pid-quiz-2',
    badge: 'Derivative Damping',
    title: 'Derivative Braking (Kd) vs. Ringing',
    tDomain: [0, 6.5],
    targetType: 'ringing',
    targetTitleMath: 'Underdamped Ringing (Low Kd)',
    targetTitleMech: 'Ringing Servo Joint (Low Kd)',
    targetFormulaMath: 'u_D = -K_d\\dot{y} \\approx 0',
    targetFormulaMech: '\\tau_D = -K_d\\dot{\\theta} \\approx 0',
    promptMath:
      'This underdamped loop rings violently around $r = 1.0$. Which response matches increasing Derivative gain $K_d$ to add virtual viscous braking?',
    promptMech:
      'This servo joint rings violently past $\\theta_{\\text{ref}} = 1.0$. Which response matches increasing Derivative damping $K_d$ to brake the overshoot?',
    targetFn: (t) => 1.0 - Math.exp(-0.24 * t) * Math.cos(3.5 * t),
    targetYBounds: [-0.1, 2.05],
    proofOverlay: { type: 'damped-settle', setpoint: 1.0, settleT: 2.3 },
    proofTextMath:
      'Derivative feedback $u_D(t) = -K_d\\dot{y}(t)$ opposes fast motion like a virtual damper, pulling closed-loop poles left in the LHP to crush overshoot and ringing!',
    proofTextMech:
      'Increasing $K_d$ adds electronic viscous damping $\\tau_D = -K_d\\dot{\\theta}$ that brakes the motor as it approaches target, settling crisply with minimal overshoot.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        yBounds: [-0.25, 2.25],
        showSetpoint: true,
        fn: (t) => 1.0 - Math.exp(-0.14 * t) * Math.cos(5.2 * t),
        wrongHintMath:
          'Faster, wilder ringing happens when you crank up $K_p$ (stiffness), not $K_d$! Derivative gain adds damping to suppress oscillations.',
        wrongHintMech:
          'That servo is ringing even harder — typical of raising $K_p$, whereas raising $K_d$ acts like a brake to calm the oscillations.',
      },
      {
        letter: 'B',
        isCorrect: false,
        yBounds: [-0.1, 1.35],
        showSetpoint: true,
        fn: (t) => 0.56 * (1 - Math.exp(-0.65 * t)),
        wrongHintMath:
          'That sluggish curve droops permanently at $0.56$ (very low $K_p$, zero $K_i$). Adding $K_d$ preserves steady-state accuracy at $r = 1.0$ while killing ringing.',
        wrongHintMech:
          'Adding Derivative damping $K_d$ does not drop the final target below $1.0$ — it simply brakes velocity so the servo lands smoothly on $\\theta_{\\text{ref}} = 1.0$.',
      },
      {
        letter: 'C',
        isCorrect: true,
        yBounds: [-0.1, 1.45],
        showSetpoint: true,
        fn: (t) => 1.0 - Math.exp(-1.55 * t) * (Math.cos(2.0 * t) + 0.52 * Math.sin(2.0 * t)),
        wrongHintMath: '',
        wrongHintMech: '',
      },
    ],
  },
  {
    id: 'pid-quiz-3',
    badge: 'Effort Channel',
    title: 'Identify the Derivative Effort u_D(t)',
    tDomain: [0, 6.0],
    targetType: 'step-for-ud',
    targetTitleMath: 'Closed-Loop Step Response y(t)',
    targetTitleMech: 'Measured Servo Position θ(t)',
    targetFormulaMath: 'u_D(t) = -K_d\\,\\dot{y}(t)',
    targetFormulaMech: '\\tau_D(t) = -K_d\\,\\dot{\\theta}(t)',
    promptMath:
      'Given this underdamped step response $y(t)$, which control waveform is the Derivative term $u_D(t) = -K_d \\dot{y}(t)$?',
    promptMech:
      'Given this servo position $\\theta(t)$, which motor torque channel is the Derivative brake $\\tau_D(t) = -K_d \\dot{\\theta}(t)$?',
    targetFn: (t) => sampleSimAt(Q3_SIM, t).y,
    targetYBounds: [-0.12, 1.52],
    peakTime: Q3_PEAK_T,
    peakVal: Q3_PEAK_Y,
    proofOverlay: { type: 'ud-zero-cross', peakT: Q3_PEAK_T, minT: Q3_MIN_UD_T, minVal: Q3_MIN_UD },
    proofTextMath:
      'Because $u_D = -K_d\\dot{y}$, it plunges most negative during the steepest rise ($\\dot{y} > 0$), crosses $0$ right at the overshoot peak ($\\dot{y} = 0$), and vanishes at steady state!',
    proofTextMech:
      'The brake torque $\\tau_D = -K_d\\dot{\\theta}$ pulls hard negative while the arm sprints upward, hits $0$ at the top of the overshoot ($\\dot{\\theta}=0$), and settles to $0$.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        yBounds: [-1.45, 0.75],
        showSetpoint: false,
        curveColor: COLORS.amber,
        curveGlow: COLORS.amberGlow,
        fn: (t) => sampleSimAt(Q3_SIM, t).uD,
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        yBounds: [-1.4, 4.1],
        showSetpoint: false,
        fn: (t) => sampleSimAt(Q3_SIM, t).uP,
        wrongHintMath:
          'That is the Proportional term $u_P(t) = K_p e(t)$! It starts maximally positive at $t = 0$ (largest error) and crosses zero when $y = 1$, BEFORE the peak.',
        wrongHintMech:
          'That is Proportional torque $\\tau_P = K_p e(t)$ — highest at $t = 0$ when error is widest. Derivative braking starts at $0$ and dips negative during the rise!',
      },
      {
        letter: 'C',
        isCorrect: false,
        yBounds: [-0.25, 2.1],
        showSetpoint: false,
        fn: (t) => sampleSimAt(Q3_SIM, t).uI,
        wrongHintMath:
          'That is the Integral term $u_I(t) = K_i \\int e\\,dt$, which builds up and stays positive at steady state. Derivative effort $u_D = -K_d\\dot{y}$ always returns to $0$ when motion stops!',
        wrongHintMech:
          'That is Integral torque $\\tau_I$, which stays nonzero to hold the static load. Derivative brake torque $\\tau_D = -K_d\\dot{\\theta}$ goes to $0$ once the arm stops.',
      },
    ],
  },
  {
    id: 'pid-quiz-4',
    badge: 'Disturbance Rejection',
    title: 'Load Disturbance Rejection at t = 3.5s',
    tDomain: [0, 7.5],
    targetType: 'disturbance',
    distTime: 3.5,
    targetTitleMath: 'External Step Load Disturbance d(t)',
    targetTitleMech: 'Sudden Arm Payload Disturbance d(t)',
    targetFormulaMath: 'd(t) = d_0\\,u(t - 3.5)',
    targetFormulaMech: '\\tau_{\\text{load}}(t)\\text{ at }t = 3.5\\text{ s}',
    promptMath:
      'A constant load disturbance hits the actuator at $t = 3.5\\text{ s}$. Which response belongs to a PI/PID controller that recovers completely back to $r = 1.0$?',
    promptMech:
      'A sudden constant payload drops onto the arm at $t = 3.5\\text{ s}$. Which trace shows a PI/PID controller rejecting the disturbance back to $\\theta_{\\text{ref}} = 1.0$?',
    targetFn: (t) => (t >= 3.5 ? 0.9 : 0),
    targetYBounds: [-0.15, 1.25],
    proofOverlay: { type: 'disturbance-recover', distTime: 3.5, setpoint: 1.0 },
    proofTextMath:
      'When the step load hits at $t = 3.5\\text{ s}$, the output dips briefly — creating positive error that the Integral term $u_I$ accumulates until it completely cancels $d_0$ and restores $y = 1.0$!',
    proofTextMech:
      'Only a controller with Integral action ($K_i > 0$) ramps up extra holding torque after $t = 3.5\\text{ s}$ to lift the arm all the way back to $\\theta_{\\text{ref}} = 1.0$.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        yBounds: [-0.1, 1.35],
        showSetpoint: true,
        distTime: 3.5,
        fn: (t) => sampleSimAt(Q4_PD_SIM, t).y,
        wrongHintMath:
          'Look after $t = 3.5\\text{ s}$: that curve sags permanently and never returns to $r = 1.0$! That is P/PD control ($K_i = 0$), which cannot reject a constant load.',
        wrongHintMech:
          'Without Integral action ($K_i = 0$), the arm sags permanently under the $t = 3.5\\text{ s}$ payload. Look for the curve that climbs right back to $1.0$!',
      },
      {
        letter: 'B',
        isCorrect: true,
        yBounds: [-0.1, 1.38],
        showSetpoint: true,
        distTime: 3.5,
        fn: (t) => sampleSimAt(Q4_PID_SIM, t).y,
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        yBounds: [-0.9, 2.7],
        showSetpoint: true,
        distTime: 3.5,
        fn: (t) =>
          t < 3.5
            ? 1.0 - Math.exp(-1.2 * t) * Math.cos(2.5 * t)
            : 1.0 - 0.28 * Math.exp(0.45 * (t - 3.5)) * Math.sin(4.2 * (t - 3.5)),
        wrongHintMath:
          'After $t = 3.5\\text{ s}$, that response blows up with growing oscillations — an unstable loop with RHP poles, not stable PID disturbance rejection.',
        wrongHintMech:
          'That disturbance triggered unstable runaway oscillation! A well-tuned PI/PID controller absorbs the dip and settles calmly back onto $\\theta_{\\text{ref}} = 1.0$.',
      },
    ],
  },
  {
    id: 'pid-quiz-5',
    badge: 'RHP Instability',
    title: 'Closed-Loop Instability (RHP Poles)',
    tDomain: [0, 5.5],
    targetType: 'splane',
    poles: [
      { sigma: 0.35, omega: 3.2, color: COLORS.coral, glow: COLORS.coralGlow },
      { sigma: 0.35, omega: -3.2, color: COLORS.coral, glow: COLORS.coralGlow },
    ],
    poleTag: 'Re(s)=+0.35 > 0',
    targetTitleMath: 'Closed-Loop s-Plane (RHP Poles)',
    targetTitleMech: 'Servo Closed-Loop Poles (Unstable RHP)',
    targetFormulaMath: 's = +0.35 \\pm 3.2j\\ (\\text{RHP})',
    targetFormulaMech: '\\text{Re}(s) > 0 \\implies \\text{Unstable}',
    promptMath:
      'Pushing loop gain past the Routh-Hurwitz limit drives closed-loop poles into the Right-Half Plane ($\\text{Re}(s) > 0$). Which step response shows an unstable closed-loop system?',
    promptMech:
      'Pushing PID gain past the Routh-Hurwitz limit drives closed-loop poles into the Coral RHP ($\\text{Re}(s) > 0$). Which response shows runaway servo instability?',
    proofOverlay: { type: 'rhp-growth', sigma: 0.32, center: 1.0, amp: 0.34 },
    proofTextMath:
      'Any closed-loop pole with $\\text{Re}(s) = \\sigma > 0$ injects a growing exponential $e^{+\\sigma t}$ into the response, causing unbounded oscillations that never settle!',
    proofTextMech:
      'Once poles cross into the RHP ($\\text{Re}(s) > 0$), feedback reinforces every swing instead of damping it — driving exponentially growing oscillations until saturation.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        yBounds: [-0.15, 1.55],
        showSetpoint: true,
        fn: (t) => 1.0 - Math.exp(-0.55 * t) * Math.cos(3.2 * t),
        wrongHintMath:
          'Those oscillations shrink steadily toward $r = 1.0$, which means the poles are still safely in the stable LHP ($\\text{Re}(s) < 0$).',
        wrongHintMech:
          'Damped ringing that settles to $1.0$ is stable (LHP poles). Look for oscillations whose amplitude grows larger every cycle!',
      },
      {
        letter: 'B',
        isCorrect: false,
        yBounds: [-0.15, 1.35],
        showSetpoint: true,
        fn: (t) => 1.0 - Math.exp(-1.2 * t),
        wrongHintMath:
          'Smooth monotonic convergence to $1.0$ comes from a real pole in the stable LHP ($\\text{Re}(s) < 0$), not an unstable RHP pair.',
        wrongHintMech:
          'An overdamped servo settling cleanly to target has stable LHP poles. RHP poles cause amplitude to explode outward!',
      },
      {
        letter: 'C',
        isCorrect: true,
        yBounds: [-1.5, 3.5],
        showSetpoint: true,
        fn: (t) => 1.0 - 0.34 * Math.exp(0.32 * t) * Math.cos(3.2 * t),
        wrongHintMath: '',
        wrongHintMech: '',
      },
    ],
  },
  {
    id: 'pid-quiz-6',
    badge: 'Ziegler-Nichols',
    title: 'Ultimate Gain (Ku, Tu) on jω-Axis',
    tDomain: [0, 6.5],
    targetType: 'splane',
    poles: [
      { sigma: 0, omega: 3.14, color: COLORS.amberLight, glow: COLORS.amberGlow },
      { sigma: 0, omega: -3.14, color: COLORS.amberLight, glow: COLORS.amberGlow },
    ],
    poleTag: 'Kp = Ku (Re=0)',
    targetTitleMath: 'Closed-Loop s-Plane at Kp = Ku',
    targetTitleMech: 'Ziegler-Nichols Bench Limit (Kp = Ku)',
    targetFormulaMath: 's = \\pm j\\omega_u \\quad (T_u = 2\\pi/\\omega_u)',
    targetFormulaMech: 'K_p = K_u \\implies \\text{Marginal } T_u',
    promptMath:
      'Tuning $K_p = K_u$ places closed-loop poles directly on the Amber $j\\omega$-axis for sustained constant-amplitude oscillation. Which response shows marginal stability at $K_u$?',
    promptMech:
      'In Ziegler-Nichols tuning, setting $K_p = K_u$ puts poles on the $j\\omega$-axis so the loop oscillates forever at constant amplitude. Which trace shows $T_u$?',
    proofOverlay: { type: 'zn-marginal', center: 0.9, amp: 0.48, tu: 2.0 },
    proofTextMath:
      'At $K_p = K_u$, the real part vanishes ($\\text{Re}(s) = 0$, $e^{0\\cdot t} = 1$), producing a sustained constant-amplitude wave whose peak-to-peak period $T_u$ directly sets the Ziegler-Nichols PID gains!',
    proofTextMech:
      'Constant-amplitude oscillation marks the exact stability boundary $K_u$: measure the steady peak-to-peak period $T_u$ and plug $(K_u, T_u)$ into the Ziegler-Nichols table.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        yBounds: [-0.05, 1.65],
        showSetpoint: true,
        fn: (t) => 0.9 - 0.48 * Math.cos(Math.PI * t),
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        yBounds: [-0.05, 1.65],
        showSetpoint: true,
        fn: (t) => 0.9 - 0.65 * Math.exp(-0.52 * t) * Math.cos(Math.PI * t),
        wrongHintMath:
          'Those peaks decay over time, meaning $\\text{Re}(s) < 0$ ($K_p < K_u$). At the exact ultimate gain $K_u$, peaks remain strictly constant!',
        wrongHintMech:
          'Since the ringing dies down, $K_p$ is still below $K_u$. Keep raising $K_p$ until the oscillation neither decays nor grows!',
      },
      {
        letter: 'C',
        isCorrect: false,
        yBounds: [-1.2, 3.1],
        showSetpoint: true,
        fn: (t) => 0.9 - 0.25 * Math.exp(0.32 * t) * Math.cos(Math.PI * t),
        wrongHintMath:
          'Those oscillations are expanding exponentially ($K_p > K_u$, poles already in the RHP). Marginal stability at $K_u$ has flat, constant-height peaks!',
        wrongHintMech:
          'You pushed past $K_u$ into unstable RHP growth! Back $K_p$ down slightly until the wave holds a steady constant amplitude.',
      },
    ],
  },
];

export class PidVisualQuizEngine {
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

    this._challenges = PID_QUIZ_CHALLENGES;
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
    return PID_QUIZ_CHALLENGES;
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
      <span class="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider bg-cyan-500/15 border border-cyan-400/35 text-cyan-300">
        PID Intuition
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
        'el-pid-pill w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[11px] sm:text-xs font-mono font-semibold flex items-center justify-center border cursor-pointer ' +
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

    // --- 2. Concise Prompt & Compact Target Canvas (h-[112px] sm:h-[168px]) ---
    const body = document.createElement('div');
    body.className = 'p-2.5 sm:p-4 flex flex-col gap-2.5 sm:gap-3.5';

    const promptBox = document.createElement('div');
    promptBox.className = 'flex flex-col gap-1.5 sm:gap-2';

    const promptText = document.createElement('p');
    promptText.className = 'text-xs sm:text-[14.5px] leading-snug sm:leading-relaxed text-slate-200';
    promptText.innerHTML = formatInlineMath(this.mechatronicsLens ? ch.promptMech : ch.promptMath);
    promptBox.appendChild(promptText);

    const targetFrame = document.createElement('div');
    targetFrame.className =
      'relative rounded-xl border border-slate-800/90 bg-[#0B0D12] overflow-hidden';

    const targetTopBar = document.createElement('div');
    targetTopBar.className =
      'px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#0E121B]/95 border-b border-slate-800/60 flex items-center justify-between gap-2';

    const targetTitle = this.mechatronicsLens ? ch.targetTitleMech : ch.targetTitleMath;
    const targetFormula = this.mechatronicsLens ? ch.targetFormulaMech : ch.targetFormulaMath;
    targetTopBar.innerHTML = `
      <span class="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-cyan-200 truncate">
        <span class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE] shrink-0"></span>
        ${escapeHtml(targetTitle)}
      </span>
      <span class="text-[10.5px] sm:text-xs text-slate-200 shrink-0">${formatKatex(targetFormula, false)}</span>
    `;
    targetFrame.appendChild(targetTopBar);

    const targetCanvasWrap = document.createElement('div');
    targetCanvasWrap.className = 'relative w-full h-[112px] sm:h-[168px]';

    const targetCanvas = document.createElement('canvas');
    targetCanvas.className = 'el-pid-canvas h-full';
    targetCanvasWrap.appendChild(targetCanvas);
    targetFrame.appendChild(targetCanvasWrap);

    this._targetCanvas = targetCanvas;
    this._targetCtx = targetCanvas.getContext('2d');
    this._targetWrap = targetCanvasWrap;

    promptBox.appendChild(targetFrame);
    body.appendChild(promptBox);

    // --- 3. 3-Column Side-by-Side Candidate Grid (Mobile Zero-Scroll!) ---
    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'grid grid-cols-3 gap-1.5 sm:gap-3';

    ch.options.forEach((opt) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className =
        'el-pidq-card text-left rounded-xl border border-slate-800/90 bg-[#0F131C]/80 overflow-hidden flex flex-col focus:outline-none focus:ring-2 focus:ring-cyan-400/50';

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

      const channelNoun = ch.id === 'pid-quiz-3' ? (this.mechatronicsLens ? 'τ(t)' : 'u(t)') : this.mechatronicsLens ? 'θ(t)' : 'y(t)';
      cardHeader.innerHTML = `
        <span class="inline-flex items-center gap-1.5 sm:gap-2">
          <span class="w-5 h-5 rounded-md text-[11px] font-mono font-bold border flex items-center justify-center ${badgeColor}">
            ${opt.letter}
          </span>
          <span class="hidden sm:inline text-xs font-medium text-slate-300">${channelNoun} Option ${opt.letter}</span>
        </span>
        ${rightBadge}
      `;
      card.appendChild(cardHeader);

      const canvasWrap = document.createElement('div');
      canvasWrap.className = 'relative w-full bg-[#0B0D12] h-[84px] sm:h-[132px]';

      const canvas = document.createElement('canvas');
      canvas.className = 'el-pid-canvas h-full';
      canvasWrap.appendChild(canvas);
      card.appendChild(canvasWrap);

      card.addEventListener('click', () => this._handleOptionClick(opt), { signal });

      optionsGrid.appendChild(card);
      this._optionCards.push({ card, canvasWrap, opt });
      this._optionCanvases.push(canvas);
      this._optionCtxs.push(canvas.getContext('2d'));
    });

    body.appendChild(optionsGrid);

    // --- 4. Feedback Banner (Proof Explanation OR Targeted Misconception Hint) ---
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
        // Ignore consumer errors
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
      'rounded-xl border border-emerald-400/45 bg-emerald-500/10 p-2.5 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3';

    const left = document.createElement('div');
    left.className = 'flex flex-col gap-1';
    left.innerHTML = `
      <div class="flex items-center gap-2 text-xs font-semibold text-emerald-300">
        <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-400/20 border border-emerald-400/60 text-[10px]">✓</span>
        PID Visual Proof Unlocked
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
      'el-pid-pill px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-400/60 text-emerald-100 cursor-pointer whitespace-nowrap';

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
      if (!canvas || !wrap) return { w: 0, h: 84 };
      const r = wrap.getBoundingClientRect();
      if (r.width < 20 || r.height < 20) return { w: 0, h: 84 };
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
    const [tMin, tMax] = ch.tDomain;

    // --- 1. Target Canvas ---
    if (this._targetCtx && this._targetSize && this._targetSize.w >= 20) {
      const { w, h } = this._targetSize;
      const ctx = this._targetCtx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const compact = w < 430;
      const pad = compact ? { left: 34, right: 12, top: 12, bottom: 18 } : QUIZ_TARGET_PAD;

      if (ch.targetType === 'splane') {
        const map = createPlotMapper(
          w,
          h,
          pad,
          QUIZ_SPLANE_BOUNDS.sigmaMin,
          QUIZ_SPLANE_BOUNDS.sigmaMax,
          QUIZ_SPLANE_BOUNDS.omegaMin,
          QUIZ_SPLANE_BOUNDS.omegaMax
        );
        drawMiniSPlane(ctx, w, h, map, QUIZ_SPLANE_BOUNDS, ch.poles, ch.poleTag, pulse, compact);
      } else {
        const [yMin, yMax] = ch.targetYBounds;
        const map = createPlotMapper(w, h, pad, tMin, tMax, yMin, yMax);
        drawEngineeringGrid(ctx, w, h, map, tMin, tMax, yMin, yMax, {
          showXLabels: true,
          showYLabels: true,
          xUnit: 's',
          compact,
        });

        this._drawTargetDecorations(ctx, map, ch, tMin, tMax, pulse, compact);

        const curveColor = ch.targetType === 'disturbance' ? COLORS.coral : COLORS.cyan;
        const curveGlow = ch.targetType === 'disturbance' ? COLORS.coralGlow : COLORS.cyanGlow;
        drawGlowingCurve(ctx, map, ch.targetFn, tMin, tMax, curveColor, curveGlow, 2.35, 240);
      }
    }

    // --- 2. 3-Column Candidate Canvases ---
    const optionSizes = this._optionSizes || [];
    ch.options.forEach((opt, idx) => {
      const ctx = this._optionCtxs[idx];
      const size = optionSizes[idx];
      if (!ctx || !size || size.w < 20) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const [yMin, yMax] = opt.yBounds;
      const isNarrow = size.w < 175;
      const optPad = isNarrow ? { left: 7, right: 7, top: 7, bottom: 9 } : QUIZ_OPTION_PAD;
      const map = createPlotMapper(size.w, size.h, optPad, tMin, tMax, yMin, yMax);

      drawEngineeringGrid(ctx, size.w, size.h, map, tMin, tMax, yMin, yMax, {
        showXLabels: !isNarrow,
        showYLabels: !isNarrow,
        xUnit: !isNarrow ? 's' : '',
        compact: true,
      });

      // Setpoint reference dashed line on candidate canvases when relevant
      if (opt.showSetpoint && 1.0 >= yMin && 1.0 <= yMax) {
        const pyRef = Math.round(map.yToPx(1.0)) + 0.5;
        ctx.save();
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.52)';
        ctx.lineWidth = 1.1;
        ctx.setLineDash([3.5, 3]);
        ctx.beginPath();
        ctx.moveTo(map.plotLeft, pyRef);
        ctx.lineTo(map.plotRight, pyRef);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Disturbance marker on Q4 candidate canvases
      if (opt.distTime) {
        const pxD = Math.round(map.xToPx(opt.distTime)) + 0.5;
        ctx.save();
        ctx.strokeStyle = 'rgba(251, 113, 133, 0.62)';
        ctx.lineWidth = 1.1;
        ctx.setLineDash([3, 2.5]);
        ctx.beginPath();
        ctx.moveTo(pxD, map.plotTop);
        ctx.lineTo(pxD, map.plotBottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      const isSolvedCorrect = solved && opt.isCorrect;

      if (isSolvedCorrect && ch.proofOverlay) {
        this._drawProofOverlay(ctx, map, ch.proofOverlay, tMin, tMax, pulse, isNarrow);
      }

      const strokeColor = isSolvedCorrect ? COLORS.emerald : COLORS.violet;
      const glowColor = isSolvedCorrect ? COLORS.emeraldGlow : COLORS.violetGlow;
      drawGlowingCurve(ctx, map, opt.fn, tMin, tMax, strokeColor, glowColor, isNarrow ? 1.95 : 2.25, 200);
    });
  }

  _drawAll() {
    this._drawCanvases();
  }

  _drawTargetDecorations(ctx, map, ch, tMin, tMax, pulse, compact) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    if (ch.targetType === 'droop' || ch.targetType === 'ringing' || ch.targetType === 'step-for-ud') {
      const pyRef = Math.round(map.yToPx(1.0)) + 0.5;
      ctx.strokeStyle = COLORS.emerald;
      ctx.lineWidth = 1.3;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(map.plotLeft, pyRef);
      ctx.lineTo(map.plotRight, pyRef);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = `600 ${compact ? 8.5 : 9.5}px ${FONT_MONO}`;
      ctx.fillStyle = 'rgba(52, 211, 153, 0.85)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('r=1.0', map.plotLeft + 5, pyRef - 2);
    }

    if (ch.targetType === 'droop') {
      // Glowing Coral steady-state droop bar at t = 5.4s
      const px = map.xToPx(5.4);
      const pyRef = map.yToPx(1.0);
      const pyVal = map.yToPx(ch.targetFn(5.4));
      ctx.strokeStyle = COLORS.coral;
      ctx.lineWidth = 2.8;
      ctx.shadowColor = COLORS.coralGlow;
      ctx.shadowBlur = 8 + pulse * 4;
      ctx.beginPath();
      ctx.moveTo(px, pyVal);
      ctx.lineTo(px, pyRef);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      drawFloatingPill(ctx, map, px, (pyVal + pyRef) * 0.5, 'e_ss = 0.28', COLORS.coral, false, compact);
      return;
    }

    if (ch.targetType === 'step-for-ud' && ch.peakTime) {
      // Highlight peak where y'(t) = 0 -> u_D crosses zero
      const pxPeak = Math.round(map.xToPx(ch.peakTime)) + 0.5;
      const pyPeak = map.yToPx(ch.peakVal);
      ctx.strokeStyle = `rgba(252, 211, 77, ${(0.5 + 0.3 * pulse).toFixed(2)})`;
      ctx.lineWidth = 1.35;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(pxPeak, map.plotTop);
      ctx.lineTo(pxPeak, map.plotBottom);
      ctx.stroke();
      ctx.setLineDash([]);
      drawGlowingDot(ctx, pxPeak, pyPeak, 3.6, COLORS.amberLight, COLORS.amberGlow);
      ctx.restore();

      drawFloatingPill(ctx, map, pxPeak, pyPeak, 'Peak: y\'=0', COLORS.amberLight, false, compact);
      return;
    }

    if (ch.targetType === 'disturbance' && ch.distTime) {
      // Shaded Coral disturbance step region after t = 3.5s
      const pxD = Math.round(map.xToPx(ch.distTime)) + 0.5;
      const pyLoad = map.yToPx(0.9);
      const pyZero = map.yToPx(0);
      ctx.fillStyle = 'rgba(251, 113, 133, 0.14)';
      ctx.fillRect(pxD, pyLoad, map.plotRight - pxD, pyZero - pyLoad);

      ctx.strokeStyle = COLORS.coral;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(pxD, map.plotTop);
      ctx.lineTo(pxD, map.plotBottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      drawFloatingPill(ctx, map, pxD, pyLoad, 'Load d₀ @ 3.5s', COLORS.coral, false, compact);
      return;
    }

    ctx.restore();
  }

  _drawProofOverlay(ctx, map, proof, tMin, tMax, pulse, isNarrow) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    if (proof.type === 'zero-error' || proof.type === 'damped-settle' || proof.type === 'disturbance-recover') {
      const sp = proof.setpoint ?? 1.0;
      const pyTop = map.yToPx(sp * 1.035);
      const pyBot = map.yToPx(sp * 0.965);
      ctx.fillStyle = 'rgba(52, 211, 153, 0.18)';
      ctx.fillRect(map.plotLeft, pyTop, map.plotW, Math.max(3, pyBot - pyTop));

      const pxEnd = map.xToPx(tMax - 0.35);
      const pyEnd = map.yToPx(sp);
      ctx.beginPath();
      ctx.arc(pxEnd, pyEnd, (isNarrow ? 3.5 : 4.5) + pulse * 2.2, 0, TWO_PI);
      ctx.strokeStyle = `rgba(52, 211, 153, ${(0.75 - pulse * 0.35).toFixed(2)})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      drawGlowingDot(ctx, pxEnd, pyEnd, isNarrow ? 2.5 : 3.2, COLORS.emerald, COLORS.emeraldGlow);

      if (proof.settleT) {
        const pxS = Math.round(map.xToPx(proof.settleT)) + 0.5;
        ctx.strokeStyle = 'rgba(252, 211, 77, 0.65)';
        ctx.lineWidth = 1.15;
        ctx.setLineDash([3, 2.5]);
        ctx.beginPath();
        ctx.moveTo(pxS, map.plotTop);
        ctx.lineTo(pxS, map.plotBottom);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (proof.type === 'ud-zero-cross') {
      // Mark zero crossing right at peakT + negative braking dip
      const pxPeak = Math.round(map.xToPx(proof.peakT)) + 0.5;
      const pyZero = map.yToPx(0);
      ctx.strokeStyle = `rgba(252, 211, 77, ${(0.55 + 0.3 * pulse).toFixed(2)})`;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([3, 2.5]);
      ctx.beginPath();
      ctx.moveTo(pxPeak, map.plotTop);
      ctx.lineTo(pxPeak, map.plotBottom);
      ctx.stroke();
      ctx.setLineDash([]);
      drawGlowingDot(ctx, pxPeak, pyZero, isNarrow ? 2.6 : 3.4, COLORS.amberLight, COLORS.amberGlow);
      drawGlowingDot(ctx, map.xToPx(proof.minT), map.yToPx(proof.minVal), isNarrow ? 2.4 : 3.1, COLORS.coral, COLORS.coralGlow);
    } else if (proof.type === 'rhp-growth') {
      const envPos = (t) => proof.center + proof.amp * Math.exp(proof.sigma * t);
      const envNeg = (t) => proof.center - proof.amp * Math.exp(proof.sigma * t);
      const dash = isNarrow ? [3.5, 3] : [5, 3.5];
      drawGlowingCurve(ctx, map, envPos, tMin, tMax, COLORS.coral, COLORS.coralGlow, 1.35, 120, dash);
      drawGlowingCurve(ctx, map, envNeg, tMin, tMax, COLORS.coral, COLORS.coralGlow, 1.35, 120, dash);
    } else if (proof.type === 'zn-marginal') {
      // Constant Amber upper/lower envelopes + Tu peak-to-peak bracket
      const pyHi = Math.round(map.yToPx(proof.center + proof.amp)) + 0.5;
      const pyLo = Math.round(map.yToPx(proof.center - proof.amp)) + 0.5;
      ctx.strokeStyle = COLORS.amberLight;
      ctx.lineWidth = 1.3;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(map.plotLeft, pyHi);
      ctx.lineTo(map.plotRight, pyHi);
      ctx.moveTo(map.plotLeft, pyLo);
      ctx.lineTo(map.plotRight, pyLo);
      ctx.stroke();
      ctx.setLineDash([]);

      // Peak-to-peak Tu bracket from t=1.0 to t=3.0
      const px1 = map.xToPx(1.0);
      const px2 = map.xToPx(1.0 + proof.tu);
      const pyBr = Math.max(map.plotTop + 6, pyHi - 4);
      ctx.strokeStyle = COLORS.emerald;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(px1, pyBr + 3);
      ctx.lineTo(px1, pyBr);
      ctx.lineTo(px2, pyBr);
      ctx.lineTo(px2, pyBr + 3);
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
    this._feedbackSlot = null;
    this._root = null;
  }
}
