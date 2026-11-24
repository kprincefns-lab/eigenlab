/**
 * EIGENLAB — Interactive Laplace s-Plane ↔ Time-Domain Intuition Lab & Visual Quiz Engine
 *
 * Exports:
 *   - LaplaceSPlaneLab       : Synchronized 2-panel high-DPI HTML5 canvas lab linking
 *                              draggable complex poles s = σ ± jω on the Laplace s-Plane
 *                              directly to the coupled time-domain response y(t) with
 *                              glowing ±e^(σt) decay/growth envelopes, LHP/RHP stability
 *                              shading, constant-ω_n / constant-ζ guides, and Mechatronics
 *                              Lens relabeling.
 *   - DiffEqVisualQuizEngine : Brilliant.org-style 6-challenge "Match the s-Plane Pole / ODE
 *                              to Time Response" visual intuition quiz with mobile-first
 *                              3-column zero-scroll layout, glowing s-Plane target maps,
 *                              envelope proof overlays, conceptual hints, and store/sound
 *                              integration.
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
  cyanGlow: 'rgba(34, 211, 238, 0.44)',
  violet: '#A78BFA',
  violetGlow: 'rgba(167, 139, 250, 0.42)',
  amber: '#F59E0B',
  amberLight: '#FCD34D',
  amberGlow: 'rgba(245, 158, 11, 0.48)',
  emerald: '#34D399',
  emeraldGlow: 'rgba(52, 211, 153, 0.44)',
  emeraldLhpNear: 'rgba(52, 211, 153, 0.045)',
  emeraldLhpFar: 'rgba(52, 211, 153, 0.11)',
  coral: '#FB7185',
  coralGlow: 'rgba(251, 113, 133, 0.46)',
  coralRhpNear: 'rgba(251, 113, 133, 0.055)',
  coralRhpFar: 'rgba(251, 113, 133, 0.15)',
  pillBg: 'rgba(11, 13, 18, 0.92)',
  pillBorder: 'rgba(148, 163, 184, 0.28)',
};

const TWO_PI = Math.PI * 2;
const FONT_MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const FONT_SANS = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';

const SPLANE_BOUNDS = {
  sigmaMin: -3.2,
  sigmaMax: 1.2,
  omegaMin: -6.5,
  omegaMax: 6.5,
};

const QUIZ_SPLANE_BOUNDS = {
  sigmaMin: -3.5,
  sigmaMax: 1.2,
  omegaMin: -5.2,
  omegaMax: 5.2,
};

const QUIZ_TARGET_PAD = { left: 42, right: 16, top: 18, bottom: 22 };
const QUIZ_OPTION_PAD = { left: 28, right: 10, top: 12, bottom: 16 };

function getLabPad(width) {
  if (width < 430) {
    return { left: 38, right: 14, top: 16, bottom: 22 };
  }
  return { left: 48, right: 20, top: 20, bottom: 24 };
}

// ---------------------------------------------------------------------------
// Scoped Component Styles (injected once into <head>)
// ---------------------------------------------------------------------------
function injectStylesOnce() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('eigenlab-diffeq-graphs-styles')) return;

  const style = document.createElement('style');
  style.id = 'eigenlab-diffeq-graphs-styles';
  style.textContent = `
    @keyframes eigenlabDiffEqShakeGentle {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(5px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(3px); }
    }
    .shake-gentle {
      animation: eigenlabDiffEqShakeGentle 0.42s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .el-de-canvas {
      display: block;
      width: 100%;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }
    .el-de-pill {
      transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease, transform 120ms ease;
    }
    .el-de-pill:active {
      transform: scale(0.97);
    }
    .el-dvq-card {
      transition: border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease, transform 160ms ease;
      cursor: pointer;
    }
    .el-dvq-card:hover:not([data-locked="true"]) {
      transform: translateY(-2px);
      border-color: rgba(34, 211, 238, 0.55);
      box-shadow: 0 10px 30px -12px rgba(34, 211, 238, 0.25);
    }
    .el-dvq-card[data-state="correct"] {
      border-color: rgba(52, 211, 153, 0.85) !important;
      background: linear-gradient(180deg, rgba(52, 211, 153, 0.12), rgba(15, 19, 28, 0.92)) !important;
      box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.35), 0 12px 32px -12px rgba(52, 211, 153, 0.35) !important;
    }
    .el-dvq-card[data-state="wrong"] {
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

function classifyStability(sigma) {
  if (sigma < -0.025) return 'stable';
  if (sigma > 0.025) return 'unstable';
  return 'marginal';
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
  ctx.font = `500 ${compact ? 9 : 10.5}px ${FONT_MONO}`;

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
      ctx.fillText(txt, px, map.plotBottom + 5);
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
      ctx.fillText(formatTickValue(gy), map.plotLeft - 6, py);
    }
  }

  // Crisp explicit zero axes
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
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(x0, map.plotTop);
    ctx.lineTo(x0, map.plotBottom);
    ctx.stroke();
  }

  // Subtle plot frame border
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 1;
  ctx.strokeRect(map.plotLeft + 0.5, map.plotTop + 0.5, map.plotW - 1, map.plotH - 1);
}

function drawGlowingCurve(ctx, map, fn, xStart, xEnd, color, glowColor, lineWidth = 2.4, samples = 260, dash = null) {
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
    ctx.shadowBlur = dash ? 7 : 10;
  }
  ctx.stroke();

  if (glowColor && !dash) {
    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(1.35, lineWidth - 0.55);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

/**
 * Draws the complex Laplace s-Plane background:
 *  - Translucent Emerald LHP (σ < 0) & Coral RHP (σ > 0) fills + region badges
 *  - Faint concentric constant-ω_n circles & constant-ζ radial rays in the LHP
 *  - Real σ & Imaginary jω axes with glowing Amber stability boundary at σ = 0
 */
function drawSPlaneCanvas(ctx, width, height, map, bounds, opts = {}) {
  const {
    compact = false,
    flashBoundary = 0,
    flashRealAxis = 0,
    showZetaLabels = true,
  } = opts;
  const { sigmaMin, sigmaMax, omegaMin, omegaMax } = bounds;

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);

  const x0 = map.xToPx(0);
  const y0 = map.yToPx(0);

  // 1. Translucent LHP (Stable Emerald) and RHP (Unstable Coral) regions
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

  // 2. Clipped grid + constant-ω_n arcs + constant-ζ rays inside LHP
  ctx.save();
  ctx.beginPath();
  ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
  ctx.clip();

  // Cartesian σ & jω minor grid
  ctx.lineWidth = 1;
  for (let s = Math.ceil(sigmaMin); s <= Math.floor(sigmaMax); s += 1) {
    if (s === 0) continue;
    const px = Math.round(map.xToPx(s)) + 0.5;
    ctx.strokeStyle = COLORS.gridMinor;
    ctx.beginPath();
    ctx.moveTo(px, map.plotTop);
    ctx.lineTo(px, map.plotBottom);
    ctx.stroke();
  }
  const wStep = compact ? 3 : 2;
  for (let w = Math.ceil(omegaMin / wStep) * wStep; w <= omegaMax; w += wStep) {
    if (Math.abs(w) < 1e-5) continue;
    const py = Math.round(map.yToPx(w)) + 0.5;
    ctx.strokeStyle = COLORS.gridMinor;
    ctx.beginPath();
    ctx.moveTo(map.plotLeft, py);
    ctx.lineTo(map.plotRight, py);
    ctx.stroke();
  }

  // Faint concentric constant-ω_n arcs & constant-ζ rays clipped strictly to LHP (σ <= 0)
  ctx.save();
  ctx.beginPath();
  ctx.rect(map.plotLeft, map.plotTop, Math.max(0, x0 - map.plotLeft), map.plotH);
  ctx.clip();

  // Concentric ω_n circles in data coordinates (ellipse in pixel coordinates)
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.125)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  const wnRadii = compact ? [1.5, 3, 4.5, 6] : [1, 2, 3, 4, 5, 6];
  for (const r of wnRadii) {
    const rx = r * map.scaleX;
    const ry = r * map.scaleY;
    if (rx < 4 || ry < 4) continue;
    ctx.beginPath();
    ctx.ellipse(x0, y0, rx, ry, 0, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.stroke();
  }

  // Constant-ζ damping ratio radial rays in LHP
  const zetas = compact ? [0.25, 0.5, 0.75] : [0.2, 0.4, 0.6, 0.8];
  const rayLen = Math.hypot(Math.abs(sigmaMin) + 1, Math.max(Math.abs(omegaMin), Math.abs(omegaMax)) + 1);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.135)';
  ctx.setLineDash([2, 4]);
  for (const z of zetas) {
    const sinTheta = Math.sqrt(Math.max(0, 1 - z * z));
    const endSigma = -z * rayLen;
    const endOmega = sinTheta * rayLen;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(map.xToPx(endSigma), map.yToPx(endOmega));
    ctx.moveTo(x0, y0);
    ctx.lineTo(map.xToPx(endSigma), map.yToPx(-endOmega));
    ctx.stroke();

    if (showZetaLabels && !compact && (z === 0.4 || z === 0.8)) {
      const labelR = z === 0.4 ? 2.55 : 2.25;
      const lx = map.xToPx(-z * labelR);
      const ly = map.yToPx(sinTheta * labelR);
      if (lx > map.plotLeft + 20 && ly > map.plotTop + 14) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.42)';
        ctx.font = `500 8.5px ${FONT_MONO}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`ζ=${z.toFixed(1)}`, lx, ly);
      }
    }
  }
  ctx.setLineDash([]);
  ctx.restore();

  // Real axis (ω = 0)
  const y0Snap = Math.round(y0) + 0.5;
  ctx.strokeStyle =
    flashRealAxis > 0.05
      ? `rgba(34, 211, 238, ${(0.45 + 0.5 * flashRealAxis).toFixed(2)})`
      : 'rgba(148, 163, 184, 0.42)';
  ctx.lineWidth = flashRealAxis > 0.05 ? 2.1 : 1.3;
  if (flashRealAxis > 0.05) {
    ctx.shadowColor = COLORS.cyanGlow;
    ctx.shadowBlur = 10;
  }
  ctx.beginPath();
  ctx.moveTo(map.plotLeft, y0Snap);
  ctx.lineTo(map.plotRight, y0Snap);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Glowing Amber Imaginary Axis (σ = 0 — Stability Boundary!)
  const x0Snap = Math.round(x0) + 0.5;
  ctx.save();
  ctx.strokeStyle = flashBoundary > 0.05 ? '#FDE68A' : COLORS.amber;
  ctx.lineWidth = 2.0 + flashBoundary * 1.4;
  ctx.shadowColor = COLORS.amberGlow;
  ctx.shadowBlur = 10 + flashBoundary * 8;
  ctx.beginPath();
  ctx.moveTo(x0Snap, map.plotTop);
  ctx.lineTo(x0Snap, map.plotBottom);
  ctx.stroke();
  ctx.restore();

  // Region Labels: STABLE LHP & UNSTABLE RHP
  ctx.font = `700 ${compact ? 8.5 : 10}px ${FONT_MONO}`;
  ctx.textBaseline = 'top';
  if (lhpW > 56) {
    ctx.fillStyle = 'rgba(52, 211, 153, 0.72)';
    ctx.textAlign = 'left';
    ctx.fillText('STABLE LHP', map.plotLeft + 7, map.plotTop + 6);
  }
  if (rhpW > 40) {
    ctx.fillStyle = 'rgba(251, 113, 133, 0.78)';
    ctx.textAlign = 'right';
    ctx.fillText(rhpW > 88 ? 'UNSTABLE RHP' : 'RHP', map.plotRight - 6, map.plotTop + 6);
  }

  // Axis name tags inside plot
  ctx.font = `600 ${compact ? 9 : 10}px ${FONT_MONO}`;
  ctx.fillStyle = 'rgba(252, 211, 77, 0.85)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  if (x0Snap + 5 < map.plotRight - 22) {
    ctx.fillText('jω', x0Snap + 5, map.plotTop + 6);
  }
  ctx.fillStyle = 'rgba(148, 163, 184, 0.78)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('σ = Re(s)', map.plotRight - 6, y0Snap - 4);

  ctx.restore();

  // Outer tick labels (σ along bottom, jω along left)
  ctx.font = `500 ${compact ? 9 : 10}px ${FONT_MONO}`;
  ctx.fillStyle = COLORS.axisLabel;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let s = Math.ceil(sigmaMin); s <= Math.floor(sigmaMax); s += 1) {
    const px = map.xToPx(s);
    if (px < map.plotLeft - 2 || px > map.plotRight + 2) continue;
    ctx.fillStyle = s === 0 ? COLORS.amberLight : COLORS.axisLabel;
    ctx.fillText(s > 0 ? `+${s}` : String(s), px, map.plotBottom + 5);
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let w = Math.ceil(omegaMin / wStep) * wStep; w <= omegaMax; w += wStep) {
    const py = map.yToPx(w);
    if (py < map.plotTop - 2 || py > map.plotBottom + 2) continue;
    ctx.fillStyle = Math.abs(w) < 1e-5 ? 'rgba(203, 213, 225, 0.85)' : COLORS.axisLabel;
    const label = Math.abs(w) < 1e-5 ? '0' : `${w > 0 ? '+' : ''}${w}j`;
    ctx.fillText(label, map.plotLeft - 6, py);
  }

  // Subtle frame border
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
  ctx.lineWidth = 1;
  ctx.strokeRect(map.plotLeft + 0.5, map.plotTop + 0.5, map.plotW - 1, map.plotH - 1);
}

/**
 * Draws a crisp glowing × pole marker with pulsing halo at (sigma, omega).
 */
function drawPoleMarker(ctx, map, sigma, omega, opts = {}) {
  const {
    pulse = 0.5,
    color = COLORS.cyan,
    glow = COLORS.cyanGlow,
    size = 7,
    isDragging = false,
  } = opts;

  const px = map.xToPx(sigma);
  const py = map.yToPx(omega);

  ctx.save();
  ctx.beginPath();
  ctx.rect(map.plotLeft - 2, map.plotTop - 2, map.plotW + 4, map.plotH + 4);
  ctx.clip();

  // Pulsing outer ring
  const ringR = size + 5 + pulse * 4 + (isDragging ? 3 : 0);
  ctx.beginPath();
  ctx.arc(px, py, ringR, 0, TWO_PI);
  ctx.strokeStyle = color;
  ctx.globalAlpha = isDragging ? 0.55 : 0.25 + 0.26 * (1 - pulse);
  ctx.lineWidth = isDragging ? 1.7 : 1.25;
  ctx.stroke();

  // Soft translucent core halo
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, py, size + 3.5, 0, TWO_PI);
  ctx.fill();

  // Crisp glowing × cross
  ctx.globalAlpha = 1;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = isDragging ? 3.4 : 2.8;
  ctx.shadowColor = glow;
  ctx.shadowBlur = isDragging ? 16 : 12;
  ctx.beginPath();
  ctx.moveTo(px - size, py - size);
  ctx.lineTo(px + size, py + size);
  ctx.moveTo(px + size, py - size);
  ctx.lineTo(px - size, py + size);
  ctx.stroke();

  // Bright inner core stroke for high-DPI clarity
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#F8FAFC';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(px - size * 0.72, py - size * 0.72);
  ctx.lineTo(px + size * 0.72, py + size * 0.72);
  ctx.moveTo(px + size * 0.72, py - size * 0.72);
  ctx.lineTo(px - size * 0.72, py + size * 0.72);
  ctx.stroke();

  ctx.restore();
}

function drawFloatingPill(ctx, map, anchorX, anchorY, text, accentColor, preferAbove = true, compact = false) {
  ctx.save();
  ctx.font = `600 ${compact ? 9.5 : 10.5}px ${FONT_MONO}`;
  const metrics = ctx.measureText(text);
  const padX = compact ? 5.5 : 7.5;
  const pillW = Math.ceil(metrics.width + padX * 2 + 5);
  const pillH = compact ? 18 : 20;

  let x = anchorX + 10;
  if (x + pillW > map.plotRight - 4) {
    x = anchorX - pillW - 10;
  }
  x = clamp(x, map.plotLeft + 4, Math.max(map.plotLeft + 4, map.plotRight - pillW - 4));

  let y = preferAbove ? anchorY - pillH - 8 : anchorY + 8;
  if (y < map.plotTop + 4) y = anchorY + 9;
  if (y + pillH > map.plotBottom - 4) y = map.plotBottom - pillH - 4;

  drawRoundedRect(ctx, x, y, pillW, pillH, 5);
  ctx.fillStyle = COLORS.pillBg;
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.05;
  ctx.stroke();

  ctx.fillStyle = accentColor;
  drawRoundedRect(ctx, x + 3.5, y + 4, 2.5, pillH - 8, 1.5);
  ctx.fill();

  ctx.fillStyle = '#F8FAFC';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + (compact ? 8.5 : 10), y + pillH / 2 + 0.5);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Pole Presets for LaplaceSPlaneLab
// ---------------------------------------------------------------------------
const POLE_PRESETS = [
  { key: 'underdamped', label: 'Underdamped', sigma: -0.55, omega: 3.2 },
  { key: 'fast-decay', label: 'Fast Decay', sigma: -2.2, omega: 0 },
  { key: 'slow-ringing', label: 'Slow Ringing', sigma: -0.25, omega: 5.0 },
  { key: 'marginal', label: 'Marginal (jω)', sigma: 0, omega: 3.2 },
  { key: 'unstable', label: 'Unstable!', sigma: 0.35, omega: 3.0 },
];

// ===========================================================================
// PART 1: LaplaceSPlaneLab (2-Panel Synchronized s-Plane ↔ Time Response Lab)
// ===========================================================================
export class LaplaceSPlaneLab {
  constructor(containerOrOptions = {}, maybeOptions = {}) {
    const isElement =
      containerOrOptions &&
      typeof containerOrOptions === 'object' &&
      containerOrOptions.nodeType === 1;
    const autoMountContainer = isElement ? containerOrOptions : null;
    const options = isElement ? maybeOptions || {} : containerOrOptions || {};

    const {
      initialSigma = -0.55,
      initialOmega = 3.2,
      mechatronicsLens = options.lens === 'mechatronics',
      onPoleChange = null,
      onInteract = null,
    } = options;

    this.sigma = clamp(Number(initialSigma), SPLANE_BOUNDS.sigmaMin, SPLANE_BOUNDS.sigmaMax);
    const rawW = Math.abs(Number(initialOmega));
    this.omega = rawW <= 0.15 ? 0 : clamp(rawW, 0, SPLANE_BOUNDS.omegaMax);
    this.mechatronicsLens = Boolean(mechatronicsLens);
    this.onPoleChange = typeof onPoleChange === 'function' ? onPoleChange : null;
    this.onInteract = typeof onInteract === 'function' ? onInteract : null;

    this._hasInteracted = false;
    this._isDragging = false;
    this._activePointerId = null;
    this._activePoleSign = 1; // +1 for upper pole, -1 for lower conjugate pole

    this._container = null;
    this._root = null;
    this._canvases = [];
    this._ctxs = [];
    this._sizes = [
      { w: 0, h: 148 },
      { w: 0, h: 138 },
    ];
    this._panelMetaEls = [];
    this._presetButtons = new Map();
    this._badgeEls = {};

    this._resizeObserver = null;
    this._abortController = null;
    this._rafId = null;
    this._pulsePhase = 0;
    this._lastFrameTs = 0;
    this._lastTickMs = 0;
    this._boundaryFlashTs = 0;
    this._realAxisFlashTs = 0;
    this._disposed = false;

    if (autoMountContainer) {
      this.mount(autoMountContainer);
    }
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

    // --- Mobile-Compact Top Control Strip ---
    const topBar = document.createElement('div');
    topBar.className =
      'px-2.5 py-2 sm:px-3.5 sm:py-3 border-b border-slate-800/80 bg-[#0F131C]/90 flex flex-col gap-1.5 sm:gap-2.5';

    // Row 1: Horizontally swipeable quick pole preset pills + live compact badges
    const row1 = document.createElement('div');
    row1.className = 'flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-1.5 sm:gap-2.5';

    const pillGroup = document.createElement('div');
    pillGroup.className =
      'flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap sm:flex-wrap pb-0.5 sm:pb-0';
    this._presetButtons.clear();

    for (const preset of POLE_PRESETS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.presetKey = preset.key;
      btn.className =
        'el-de-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer';
      btn.textContent = preset.label;
      btn.addEventListener(
        'click',
        () => {
          safeSound('playTick');
          this.setPole(preset.sigma, preset.omega);
          this._markInteracted();
        },
        { signal }
      );
      pillGroup.appendChild(btn);
      this._presetButtons.set(preset.key, btn);
    }

    const badgesWrap = document.createElement('div');
    badgesWrap.className = 'flex flex-wrap items-center gap-1 sm:gap-1.5';

    const poleBadge = document.createElement('span');
    poleBadge.className =
      'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-cyan-500/10 border border-cyan-400/45 text-cyan-200';

    const stabilityBadge = document.createElement('span');
    stabilityBadge.className =
      'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wide border transition-colors';

    const metricBadge = document.createElement('span');
    metricBadge.className =
      'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-slate-900/90 border border-slate-700/80 text-slate-200';

    badgesWrap.append(poleBadge, stabilityBadge, metricBadge);
    this._badgeEls = { poleBadge, stabilityBadge, metricBadge };

    row1.append(pillGroup, badgesWrap);

    // Row 2: Desktop/tablet equation & visual legend
    const row2 = document.createElement('div');
    row2.className = 'hidden sm:flex flex-wrap items-center justify-between gap-2 text-xs';

    const formulaEl = document.createElement('div');
    formulaEl.className = 'text-cyan-200/95 font-medium flex items-center gap-2';
    this._badgeEls.formulaEl = formulaEl;

    const hintEl = document.createElement('div');
    hintEl.className = 'text-[11px] text-slate-400 flex items-center gap-3';
    this._badgeEls.hintEl = hintEl;

    row2.append(formulaEl, hintEl);
    topBar.append(row1, row2);
    root.appendChild(topBar);

    // --- Synchronized 2-Panel Canvas Stack ---
    const stackWrap = document.createElement('div');
    stackWrap.className = 'divide-y divide-slate-800/80 bg-[#0B0D12]';
    stackWrap.tabIndex = 0;
    stackWrap.setAttribute(
      'aria-label',
      'Interactive Laplace s-Plane and coupled time response lab; drag poles or use arrow keys to adjust sigma and omega'
    );

    const panelDots = [COLORS.cyan, COLORS.amberLight];
    const panelHeights = ['h-[148px] sm:h-[210px]', 'h-[138px] sm:h-[195px]'];
    const panelCursors = ['cursor-grab', 'cursor-default'];

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
        'px-1.5 py-0.5 sm:px-2 rounded-md text-[10px] sm:text-[11px] font-mono font-semibold bg-slate-900/90 border border-slate-800 text-slate-100 shrink-0';

      header.append(titleWrap, readoutEl);
      panel.appendChild(header);

      const canvasWrap = document.createElement('div');
      canvasWrap.className = `relative w-full ${panelCursors[i]} ${panelHeights[i]}`;

      const canvas = document.createElement('canvas');
      canvas.className = 'el-de-canvas h-full';
      canvas.style.touchAction = 'none';
      canvasWrap.appendChild(canvas);
      panel.appendChild(canvasWrap);

      stackWrap.appendChild(panel);

      this._canvases.push(canvas);
      this._ctxs.push(canvas.getContext('2d'));
      this._sizes[i] = { w: 0, h: i === 0 ? 148 : 138 };
      this._panelMetaEls.push({ titleEl, readoutEl, canvasWrap });
    }

    // Bind direct pointer/touch dragging on Panel 1 (s-Plane)
    this._bindSPlanePointerEvents(this._canvases[0], this._panelMetaEls[0].canvasWrap, signal);

    // Keyboard micro-nudging when focused
    stackWrap.addEventListener(
      'keydown',
      (e) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault();
        const stepS = e.shiftKey ? 0.25 : 0.08;
        const stepW = e.shiftKey ? 0.5 : 0.2;
        let nextSigma = this.sigma;
        let nextOmega = this.omega;
        if (e.key === 'ArrowLeft') nextSigma -= stepS;
        if (e.key === 'ArrowRight') nextSigma += stepS;
        if (e.key === 'ArrowUp') nextOmega += stepW;
        if (e.key === 'ArrowDown') nextOmega = Math.max(0, nextOmega - stepW);
        this._applyDraggedPole(nextSigma, nextOmega, true);
      },
      { signal }
    );

    root.appendChild(stackWrap);
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

  _bindSPlanePointerEvents(canvas, wrap, signal) {
    const pointerToComplex = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return null;
      const pad = getLabPad(rect.width);
      const map = createPlotMapper(
        rect.width,
        rect.height,
        pad,
        SPLANE_BOUNDS.sigmaMin,
        SPLANE_BOUNDS.sigmaMax,
        SPLANE_BOUNDS.omegaMin,
        SPLANE_BOUNDS.omegaMax
      );
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      return {
        sigma: clamp(map.pxToX(localX), SPLANE_BOUNDS.sigmaMin, SPLANE_BOUNDS.sigmaMax),
        rawOmega: clamp(map.pxToY(localY), SPLANE_BOUNDS.omegaMin, SPLANE_BOUNDS.omegaMax),
      };
    };

    canvas.addEventListener(
      'pointerdown',
      (e) => {
        const pt = pointerToComplex(e.clientX, e.clientY);
        if (!pt) return;
        this._isDragging = true;
        this._activePointerId = e.pointerId;
        this._activePoleSign = pt.rawOmega < 0 ? -1 : 1;
        wrap.classList.remove('cursor-grab');
        wrap.classList.add('cursor-grabbing');
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {
          // Ignore synthetic events
        }
        this._applyDraggedPole(pt.sigma, Math.abs(pt.rawOmega), true);
      },
      { signal }
    );

    canvas.addEventListener(
      'pointermove',
      (e) => {
        if (!this._isDragging || e.pointerId !== this._activePointerId) return;
        const pt = pointerToComplex(e.clientX, e.clientY);
        if (!pt) return;
        this._activePoleSign = pt.rawOmega < 0 ? -1 : 1;
        this._applyDraggedPole(pt.sigma, Math.abs(pt.rawOmega), true);
      },
      { signal }
    );

    const endDrag = (e) => {
      if (this._activePointerId === e.pointerId) {
        this._isDragging = false;
        this._activePointerId = null;
        wrap.classList.remove('cursor-grabbing');
        wrap.classList.add('cursor-grab');
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

  _playThrottledTick() {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this._lastTickMs > 75) {
      this._lastTickMs = now;
      safeSound('playTick');
    }
  }

  _applyDraggedPole(rawSigma, rawAbsOmega, allowAudio) {
    const prevSigma = this.sigma;
    const prevOmega = this.omega;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

    let nextSigma = clamp(Number(rawSigma), SPLANE_BOUNDS.sigmaMin, SPLANE_BOUNDS.sigmaMax);
    let nextOmega = clamp(Math.abs(Number(rawAbsOmega)), 0, SPLANE_BOUNDS.omegaMax);

    // Clean real-axis snap when dragged within 0.22 of ω = 0
    if (nextOmega <= 0.22) {
      nextOmega = 0;
    }

    // Subtle tactile detent on the jω stability boundary (σ = 0)
    if (Math.abs(nextSigma) <= 0.055) {
      nextSigma = 0;
    }

    if (allowAudio) {
      const crossedStability =
        (prevSigma < 0 && nextSigma >= 0) ||
        (prevSigma > 0 && nextSigma <= 0) ||
        (prevSigma === 0 && nextSigma !== 0);
      if (crossedStability) {
        this._boundaryFlashTs = now;
        this._playThrottledTick();
      }

      const snappedToReal = prevOmega > 0.15 && nextOmega === 0;
      const liftedFromReal = prevOmega === 0 && nextOmega > 0.15;
      if (snappedToReal || liftedFromReal) {
        this._realAxisFlashTs = now;
        this._playThrottledTick();
      }
    }

    this.sigma = nextSigma;
    this.omega = nextOmega;

    this._syncControlUI();
    this._drawAll();
    this._emitPoleChange();
    if (allowAudio) this._markInteracted();
  }

  _markInteracted() {
    if (!this._hasInteracted) {
      this._hasInteracted = true;
      try {
        this.onInteract?.({ sigma: this.sigma, omega: this.omega });
      } catch (_) {
        // Ignore consumer errors
      }
    }
  }

  _emitPoleChange() {
    if (!this.onPoleChange) return;
    try {
      const stability = classifyStability(this.sigma);
      const wn = Math.hypot(this.sigma, this.omega);
      const zeta = wn > 1e-4 ? -this.sigma / wn : 0;
      this.onPoleChange({
        sigma: this.sigma,
        omega: this.omega,
        stability,
        wn,
        zeta,
      });
    } catch (_) {
      // Ignore consumer errors
    }
  }

  setPole(sigma, omega = 0) {
    const s = Number(sigma);
    const w = Math.abs(Number(omega));
    if (!Number.isFinite(s) || !Number.isFinite(w)) return;
    this.sigma = clamp(s, SPLANE_BOUNDS.sigmaMin, SPLANE_BOUNDS.sigmaMax);
    this.omega = w <= 0.15 ? 0 : clamp(w, 0, SPLANE_BOUNDS.omegaMax);
    this._syncControlUI();
    this._drawAll();
    this._emitPoleChange();
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

  _getMatchingPresetKey() {
    for (const p of POLE_PRESETS) {
      if (Math.abs(this.sigma - p.sigma) < 0.08 && Math.abs(this.omega - p.omega) < 0.18) {
        return p.key;
      }
    }
    return null;
  }

  _syncControlUI() {
    if (!this._root) return;

    const activePresetKey = this._getMatchingPresetKey();
    for (const [key, btn] of this._presetButtons.entries()) {
      const isActive = key === activePresetKey;
      if (isActive) {
        if (key === 'unstable') {
          btn.className =
            'el-de-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border cursor-pointer bg-rose-500/15 border-rose-400/70 text-rose-200 shadow-[0_0_14px_rgba(251,113,133,0.22)]';
        } else if (key === 'marginal') {
          btn.className =
            'el-de-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border cursor-pointer bg-amber-400/15 border-amber-400/70 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.22)]';
        } else {
          btn.className =
            'el-de-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border cursor-pointer bg-cyan-400/15 border-cyan-400/70 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.22)]';
        }
      } else {
        btn.className =
          'el-de-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700';
      }
    }

    const titles = this.mechatronicsLens
      ? ['Control s-Plane (Closed-Loop Poles)', 'Impulse Response x(t) [mm]']
      : ['Complex Laplace s-Plane', 'Inverse Laplace y(t) = e^(σt)cos(ωt)'];

    for (let i = 0; i < 2; i++) {
      if (this._panelMetaEls[i]) {
        this._panelMetaEls[i].titleEl.textContent = titles[i];
      }
    }

    this._updateLiveBadgesAndReadouts();
  }

  _updateLiveBadgesAndReadouts() {
    if (!this._root) return;
    const s = this.sigma;
    const w = this.omega;
    const isComplex = w > 0.15;
    const stability = classifyStability(s);

    const { poleBadge, stabilityBadge, metricBadge, formulaEl, hintEl } = this._badgeEls;

    // Pole coordinate badge: s = σ ± jω
    if (poleBadge) {
      if (isComplex) {
        poleBadge.textContent =
          Math.abs(s) < 0.025
            ? `s = ±${fmtPlain(w, 2)}j`
            : `s = ${fmtSigned(s, 2)} ± ${fmtPlain(w, 2)}j`;
      } else {
        poleBadge.textContent = `s = ${fmtSigned(s, 2)}`;
      }
    }

    // Stability pill
    if (stabilityBadge) {
      if (stability === 'stable') {
        stabilityBadge.textContent = '● STABLE';
        stabilityBadge.className =
          'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wide border bg-emerald-400/15 border-emerald-400/55 text-emerald-300';
      } else if (stability === 'marginal') {
        stabilityBadge.textContent = '● MARGINAL';
        stabilityBadge.className =
          'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wide border bg-amber-400/15 border-amber-400/60 text-amber-200';
      } else {
        stabilityBadge.textContent = '▲ UNSTABLE';
        stabilityBadge.className =
          'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wide border bg-rose-500/15 border-rose-400/60 text-rose-300';
      }
    }

    // Time constant / frequency badge
    if (metricBadge) {
      if (stability === 'stable') {
        const tau = 1 / Math.abs(s);
        metricBadge.textContent = isComplex
          ? `τ = ${fmtPlain(tau, 2)}s • ω = ${fmtPlain(w, 1)}`
          : `τ = ${fmtPlain(tau, 2)}s • Overdamped`;
      } else if (stability === 'marginal') {
        metricBadge.textContent = isComplex
          ? `τ = ∞ • ω = ${fmtPlain(w, 1)} rad/s`
          : 'DC Pole (s = 0)';
      } else {
        const tDouble = Math.LN2 / Math.abs(s);
        metricBadge.textContent = isComplex
          ? `T₂ = ${fmtPlain(tDouble, 2)}s • ω = ${fmtPlain(w, 1)}`
          : `Grow e^(${fmtSigned(s, 2)}t)`;
      }
    }

    // Panel readouts
    if (this._panelMetaEls.length === 2) {
      const wn = Math.hypot(s, w);
      const zeta = wn > 1e-4 ? -s / wn : 0;
      if (this.mechatronicsLens) {
        this._panelMetaEls[0].readoutEl.textContent = isComplex
          ? `ζ = ${fmtPlain(zeta, 2)} • ωₙ = ${fmtPlain(wn, 2)}`
          : `σ = ${fmtSigned(s, 2)} s⁻¹`;
      } else {
        this._panelMetaEls[0].readoutEl.textContent = isComplex
          ? `σ = ${fmtSigned(s, 2)} • ω = ±${fmtPlain(w, 2)}`
          : `σ = ${fmtSigned(s, 2)} • ω = 0`;
      }

      const varName = this.mechatronicsLens ? 'x(t)' : 'y(t)';
      const envPart = Math.abs(s) < 0.025 ? '' : `e^(${fmtSigned(s, 2)}t)`;
      const oscPart = isComplex ? `cos(${fmtPlain(w, 2)}t)` : Math.abs(s) < 0.025 ? '1' : '';
      this._panelMetaEls[1].readoutEl.textContent = `${varName} = ${envPart}${oscPart}`;
    }

    // Desktop Row 2 KaTeX formula & legend
    if (formulaEl) {
      const varName = this.mechatronicsLens ? 'x(t)' : 'y(t)';
      const expTex = Math.abs(s) < 0.025 ? '' : `e^{${fmtPlain(s, 2)}t}`;
      const cosTex = isComplex ? `\\cos(${fmtPlain(w, 2)}t)` : Math.abs(s) < 0.025 ? '1' : '';
      const timeTex = `${varName} = ${expTex}${cosTex}`;
      const badgeLabel = this.mechatronicsLens ? 'Closed-Loop' : 'Laplace Live';
      const wn = Math.hypot(s, w);
      const zeta = wn > 1e-4 ? -s / wn : 0;
      const rightTex = this.mechatronicsLens
        ? `\\zeta = ${fmtPlain(zeta, 2)},\\ \\omega_n = ${fmtPlain(wn, 2)}\\text{ rad/s}`
        : isComplex
        ? `\\sigma = ${fmtSigned(s, 2)},\\ \\omega = ${fmtPlain(w, 2)}`
        : `\\sigma = ${fmtSigned(s, 2)},\\ \\omega = 0`;

      formulaEl.innerHTML = `
        <span class="text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">
          ${badgeLabel}
        </span>
        <span>${formatKatex(timeTex, false)}</span>
        <span class="text-slate-500">•</span>
        <span class="text-amber-300">${formatKatex(rightTex, false)}</span>
      `;
    }

    if (hintEl) {
      hintEl.innerHTML = `
        <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-emerald-400/70 inline-block"></span>LHP Stable</span>
        <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-rose-400/70 inline-block"></span>RHP Unstable</span>
        <span class="inline-flex items-center gap-1"><span class="w-3 h-0.5 border-t border-dashed border-amber-300 inline-block"></span>±e^(σt) Envelope</span>
      `;
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
      this._pulsePhase = (this._pulsePhase + dt * 2.7) % TWO_PI;

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
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

    for (let i = 0; i < 2; i++) {
      const ctx = this._ctxs[i];
      const { w, h } = this._sizes[i];
      if (!ctx || w < 20 || h < 20) continue;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (i === 0) this._drawSPlanePanel(ctx, w, h, pulse, now);
      else this._drawTimeResponsePanel(ctx, w, h, pulse);
    }
  }

  _drawSPlanePanel(ctx, w, h, pulse, now) {
    const compact = w < 430;
    const pad = getLabPad(w);
    const map = createPlotMapper(
      w,
      h,
      pad,
      SPLANE_BOUNDS.sigmaMin,
      SPLANE_BOUNDS.sigmaMax,
      SPLANE_BOUNDS.omegaMin,
      SPLANE_BOUNDS.omegaMax
    );

    const flashBoundary =
      this._boundaryFlashTs > 0 ? clamp(1 - (now - this._boundaryFlashTs) / 380, 0, 1) : 0;
    const flashRealAxis =
      this._realAxisFlashTs > 0 ? clamp(1 - (now - this._realAxisFlashTs) / 380, 0, 1) : 0;

    drawSPlaneCanvas(ctx, w, h, map, SPLANE_BOUNDS, {
      compact,
      flashBoundary,
      flashRealAxis,
      showZetaLabels: !compact,
    });

    const s = this.sigma;
    const wVal = this.omega;
    const isComplex = wVal > 0.15;
    const stability = classifyStability(s);

    const poleColor =
      stability === 'stable'
        ? COLORS.cyan
        : stability === 'marginal'
        ? COLORS.amberLight
        : COLORS.coral;
    const poleGlow =
      stability === 'stable'
        ? COLORS.cyanGlow
        : stability === 'marginal'
        ? COLORS.amberGlow
        : COLORS.coralGlow;

    const pxS = map.xToPx(s);
    const py0 = map.yToPx(0);
    const px0 = map.xToPx(0);

    // Subtle projection guides from pole to σ & jω axes
    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.1;
    if (isComplex) {
      const pyPos = map.yToPx(wVal);
      const pyNeg = map.yToPx(-wVal);

      // Vertical conjugate connector
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.30)';
      ctx.beginPath();
      ctx.moveTo(pxS, pyPos);
      ctx.lineTo(pxS, pyNeg);
      ctx.stroke();

      // Horizontal projection to imaginary axis for upper pole
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.30)';
      ctx.beginPath();
      ctx.moveTo(pxS, pyPos);
      ctx.lineTo(px0, pyPos);
      ctx.stroke();
    } else {
      // Horizontal real-axis displacement line from origin to pole
      ctx.strokeStyle = poleColor;
      ctx.globalAlpha = 0.38;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(px0, py0);
      ctx.lineTo(pxS, py0);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.setLineDash([]);
    ctx.restore();

    // Draw glowing × pole marker(s)
    const markerSize = compact ? 6.5 : 7.5;
    if (isComplex) {
      drawPoleMarker(ctx, map, s, wVal, {
        pulse,
        color: poleColor,
        glow: poleGlow,
        size: markerSize,
        isDragging: this._isDragging && this._activePoleSign >= 0,
      });
      drawPoleMarker(ctx, map, s, -wVal, {
        pulse,
        color: poleColor,
        glow: poleGlow,
        size: markerSize,
        isDragging: this._isDragging && this._activePoleSign < 0,
      });
    } else {
      drawPoleMarker(ctx, map, s, 0, {
        pulse,
        color: poleColor,
        glow: poleGlow,
        size: markerSize + 0.5,
        isDragging: this._isDragging,
      });
    }

    // Floating compact coordinate pill next to upper/active pole
    const pillAnchorY = isComplex ? map.yToPx(wVal) : py0;
    const pillText = isComplex
      ? Math.abs(s) < 0.025
        ? `±${fmtPlain(wVal, 1)}j`
        : `${fmtSigned(s, 2)}±${fmtPlain(wVal, 1)}j`
      : `σ=${fmtSigned(s, 2)}`;
    drawFloatingPill(ctx, map, pxS, pillAnchorY, pillText, poleColor, true, compact);

    // Subtle drag prompt bottom-left until user drags
    if (!this._hasInteracted) {
      ctx.save();
      const hintTxt = compact ? 'Drag × pole' : 'Drag × pole anywhere in s-plane';
      ctx.font = `600 ${compact ? 9 : 10}px ${FONT_SANS}`;
      const tw = ctx.measureText(hintTxt).width + 14;
      const hx = map.plotLeft + 7;
      const hy = map.plotBottom - 22;
      drawRoundedRect(ctx, hx, hy, tw, 17, 5);
      ctx.fillStyle = 'rgba(15, 19, 28, 0.84)';
      ctx.fill();
      ctx.strokeStyle = `rgba(34, 211, 238, ${(0.35 + 0.3 * pulse).toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#BAE6FD';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(hintTxt, hx + 7, hy + 8.5);
      ctx.restore();
    }
  }

  _drawTimeResponsePanel(ctx, w, h, pulse) {
    const compact = w < 430;
    const pad = getLabPad(w);
    const tMin = 0;
    const tMax = 6;
    const s = this.sigma;
    const wVal = this.omega;
    const isComplex = wVal > 0.15;
    const stability = classifyStability(s);

    // Adaptive oscilloscope Y bounds so stable responses are crisp and unstable growth pops dramatically
    let yMaxAbs = 1.38;
    if (s > 0.025) {
      yMaxAbs = clamp(Math.min(Math.exp(s * 5.2) * 1.08, 6.0), 1.45, 6.0);
    }
    const yMin = isComplex ? -yMaxAbs : -0.25 * yMaxAbs;
    const yMax = yMaxAbs;

    const map = createPlotMapper(w, h, pad, tMin, tMax, yMin, yMax);
    drawEngineeringGrid(ctx, w, h, map, tMin, tMax, yMin, yMax, {
      showXLabels: true,
      showYLabels: true,
      xUnit: 's',
      compact,
    });

    const envPos = (t) => Math.exp(s * t);
    const envNeg = (t) => -Math.exp(s * t);
    const respFn = isComplex ? (t) => Math.exp(s * t) * Math.cos(wVal * t) : envPos;

    // Subtle shaded wash between curve and y = 0 for studio depth
    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    const yZero = clamp(map.yToPx(0), map.plotTop, map.plotBottom);
    const fillSamples = 200;
    ctx.beginPath();
    ctx.moveTo(map.xToPx(tMin), yZero);
    for (let i = 0; i <= fillSamples; i++) {
      const t = tMin + ((tMax - tMin) * i) / fillSamples;
      const val = clamp(respFn(t), yMin * 2.5, yMax * 2.5);
      ctx.lineTo(map.xToPx(t), map.yToPx(val));
    }
    ctx.lineTo(map.xToPx(tMax), yZero);
    ctx.closePath();
    ctx.fillStyle =
      stability === 'stable'
        ? 'rgba(34, 211, 238, 0.085)'
        : stability === 'marginal'
        ? 'rgba(245, 158, 11, 0.09)'
        : 'rgba(251, 113, 133, 0.11)';
    ctx.fill();

    // Time constant τ = 1/|σ| indicator when stable & within visible time window
    if (stability === 'stable') {
      const tau = 1 / Math.abs(s);
      if (tau >= 0.22 && tau <= tMax - 0.25) {
        const pxTau = Math.round(map.xToPx(tau)) + 0.5;
        const pyEnv = map.yToPx(Math.exp(-1));
        ctx.strokeStyle = `rgba(52, 211, 153, ${(0.35 + 0.25 * pulse).toFixed(2)})`;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(pxTau, map.plotTop);
        ctx.lineTo(pxTau, map.plotBottom);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(pxTau, pyEnv, 3.2, 0, TWO_PI);
        ctx.fillStyle = COLORS.emerald;
        ctx.fill();
        ctx.strokeStyle = COLORS.bg;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        if (!compact || tau < 4.6) {
          ctx.font = `600 9px ${FONT_MONO}`;
          const tauTxt = `τ=${fmtPlain(tau, 2)}s (37%)`;
          const tw = ctx.measureText(tauTxt).width + 8;
          const lx = clamp(pxTau + 5, map.plotLeft + 4, map.plotRight - tw - 4);
          const ly = clamp(pyEnv - 18, map.plotTop + 4, map.plotBottom - 18);
          drawRoundedRect(ctx, lx, ly, tw, 15, 4);
          ctx.fillStyle = 'rgba(11, 13, 18, 0.86)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
          ctx.lineWidth = 0.85;
          ctx.stroke();
          ctx.fillStyle = '#A7F3D0';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(tauTxt, lx + 4, ly + 8);
        }
      }
    }
    ctx.restore();

    // Glowing dashed Amber decay/growth envelope curves ±e^(σt)
    drawGlowingCurve(
      ctx,
      map,
      envPos,
      tMin,
      tMax,
      COLORS.amberLight,
      COLORS.amberGlow,
      isComplex ? 1.55 : 1.75,
      180,
      [5, 4]
    );
    if (isComplex) {
      drawGlowingCurve(
        ctx,
        map,
        envNeg,
        tMin,
        tMax,
        COLORS.amberLight,
        COLORS.amberGlow,
        1.55,
        180,
        [5, 4]
      );
    }

    // Main coupled response curve y(t)
    const curveColor =
      stability === 'stable'
        ? COLORS.cyan
        : stability === 'marginal'
        ? COLORS.amberLight
        : COLORS.coral;
    const curveGlow =
      stability === 'stable'
        ? COLORS.cyanGlow
        : stability === 'marginal'
        ? COLORS.amberGlow
        : COLORS.coralGlow;

    drawGlowingCurve(ctx, map, respFn, tMin, tMax, curveColor, curveGlow, 2.55, 340);

    // Compact top-right envelope callout pill
    const envLabel =
      stability === 'marginal'
        ? '±1 const envelope'
        : isComplex
        ? `±e^(${fmtSigned(s, 2)}t) envelope`
        : `e^(${fmtSigned(s, 2)}t) envelope`;
    ctx.save();
    ctx.font = `600 ${compact ? 9 : 10}px ${FONT_MONO}`;
    const ew = ctx.measureText(envLabel).width + 14;
    const ex = map.plotRight - ew - 5;
    const ey = map.plotTop + 5;
    drawRoundedRect(ctx, ex, ey, ew, 17, 4);
    ctx.fillStyle = 'rgba(11, 13, 18, 0.88)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.fillStyle = COLORS.amberLight;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(envLabel, ex + ew / 2, ey + 9);
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
    this._badgeEls = {};
    this._root = null;
  }
}

// ===========================================================================
// PART 2: DiffEqVisualQuizEngine (6-Challenge s-Plane → Time Response Quiz)
// ===========================================================================
const DIFFEQ_QUIZ_CHALLENGES = [
  {
    id: 'de-quiz-1st-decay',
    badge: '1st-Order LHP',
    title: 'Real LHP Pole → Pure Exponential Decay',
    tDomain: [0, 4.5],
    poles: [{ sigma: -2.0, omega: 0, color: COLORS.cyan, glow: COLORS.cyanGlow }],
    poleTag: 's = -2',
    targetFormulaMath: 's = -2 \\quad (\\dot{y} + 2y = 0)',
    targetFormulaMech: 's = -2\\text{ s}^{-1} \\quad (\\tau = 0.5\\text{ s})',
    promptMath:
      'A 1st-order ODE $\\dot{y} + 2y = 0$ has a single real LHP pole at $s = -2$. Which time response $y(t)$ matches this pole?',
    promptMech:
      'An RC thermal actuator has a single closed-loop pole at $s = -2\\text{ s}^{-1}$ in the stable LHP. Which free response $x(t)$ matches?',
    proofEnvelope: { type: 'decay', sigma: -2.0, symmetric: false, tau: 0.5 },
    proofTextMath:
      'A purely real LHP pole $s = -2$ ($\\sigma = -2 < 0,\\ \\omega = 0$) produces zero oscillation and decays monotonically as $y(t) = e^{-2t}$ with time constant $\\tau = 1/2 = 0.5\\text{ s}$.',
    proofTextMech:
      'With $\\sigma = -2\\text{ s}^{-1}$ and $\\omega = 0$, the actuator discharges smoothly with zero ringing along $x(t) = e^{-2t}$, falling to $37\\%$ at $\\tau = 0.5\\text{ s}$.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        yBounds: [-1.35, 1.35],
        fn: (t) => Math.cos(3.0 * t),
        wrongHintMath:
          'Sustained oscillation requires imaginary poles $s = \\pm j\\omega$ off the real axis. Because $s = -2$ has $\\omega = 0$, $y(t)$ cannot oscillate.',
        wrongHintMech:
          'Ringing requires complex poles with nonzero $\\omega$. A real pole at $s = -2$ is purely dissipative with zero oscillation.',
      },
      {
        letter: 'B',
        isCorrect: true,
        yBounds: [-0.25, 1.25],
        fn: (t) => Math.exp(-2.0 * t),
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        yBounds: [-0.25, 3.2],
        fn: (t) => 0.32 * Math.exp(0.52 * t),
        wrongHintMath:
          'Exponential blow-up only occurs in the Right Half-Plane ($\\sigma > 0$). Here $s = -2$ sits firmly in the stable LHP, so $e^{-2t} \\to 0$.',
        wrongHintMech:
          'Unstable runaway requires a pole in the RHP ($\\sigma > 0$). A negative real pole $s = -2$ always drains stored energy back to zero.',
      },
    ],
  },
  {
    id: 'de-quiz-underdamped',
    badge: 'Underdamped',
    title: 'Complex LHP Poles → Decaying Oscillation',
    tDomain: [0, 6.0],
    poles: [
      { sigma: -0.5, omega: 3.0, color: COLORS.cyan, glow: COLORS.cyanGlow },
      { sigma: -0.5, omega: -3.0, color: COLORS.cyan, glow: COLORS.cyanGlow },
    ],
    poleTag: 's = -0.5 ± 3j',
    targetFormulaMath: 's = -0.5 \\pm 3j',
    targetFormulaMech: 's = -0.5 \\pm 3j \\quad (\\text{Underdamped})',
    promptMath:
      'Complex conjugate poles lie in the LHP at $s = -0.5 \\pm 3j$. Which time-domain response $y(t) = \\mathcal{L}^{-1}\\{Y(s)\\}$ corresponds to this pair?',
    promptMech:
      'A robotic arm joint has underdamped closed-loop poles at $s = -0.5 \\pm 3j$. Which impulse response $x(t)$ will the encoder record?',
    proofEnvelope: { type: 'decay', sigma: -0.5, symmetric: true, tau: 2.0 },
    proofTextMath:
      'The real part $\\sigma = -0.5 < 0$ wraps the wave inside the decaying Amber envelope $\\pm e^{-0.5t}$, while the imaginary part $\\omega = 3$ sets the oscillation frequency in $y(t) = e^{-0.5t}\\cos(3t)$.',
    proofTextMech:
      'Negative damping $\\sigma = -0.5$ decays the overshoot envelope $\\pm e^{-0.5t}$ to rest while $\\omega_d = 3\\text{ rad/s}$ produces damped ringing: $x(t) = e^{-0.5t}\\cos(3t)$.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        yBounds: [-1.35, 1.35],
        fn: (t) => Math.exp(-0.5 * t) * Math.cos(3.0 * t),
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        yBounds: [-1.35, 1.35],
        fn: (t) => Math.cos(3.0 * t),
        wrongHintMath:
          'Constant-amplitude oscillation occurs only on the imaginary axis ($\\sigma = 0$). Since $\\sigma = -0.5 < 0$, the peaks must shrink along $\\pm e^{-0.5t}$.',
        wrongHintMech:
          'Undamped ringing never loses energy ($\\sigma = 0$). Here the LHP shift $\\sigma = -0.5$ provides active damping that shrinks each swing.',
      },
      {
        letter: 'C',
        isCorrect: false,
        yBounds: [-0.25, 1.25],
        fn: (t) => Math.exp(-1.1 * t),
        wrongHintMath:
          'Monotonic decay without ringing only happens when $\\omega = 0$ (poles on the real axis). Here $\\omega = \\pm 3$ drives clear oscillation.',
        wrongHintMech:
          'Overdamped non-oscillating decay requires poles on the real axis ($\\omega = 0$). Poles at $\\pm 3j$ force the joint to oscillate as it settles.',
      },
    ],
  },
  {
    id: 'de-quiz-marginal',
    badge: 'Marginal (jω)',
    title: 'Imaginary Axis Poles → Sustained Oscillation',
    tDomain: [0, 6.0],
    poles: [
      { sigma: 0, omega: 3.0, color: COLORS.amberLight, glow: COLORS.amberGlow },
      { sigma: 0, omega: -3.0, color: COLORS.amberLight, glow: COLORS.amberGlow },
    ],
    poleTag: 's = ±3j',
    targetFormulaMath: 's = \\pm 3j \\quad (\\ddot{y} + 9y = 0)',
    targetFormulaMech: 's = \\pm 3j \\quad (\\zeta = 0,\\ \\text{Lossless})',
    promptMath:
      'Purely imaginary poles sit right on the Amber $j\\omega$-axis at $s = \\pm 3j$ ($\\ddot{y} + 9y = 0$). Which time response matches?',
    promptMech:
      'A frictionless spring-mass oscillator has zero damping ($\\zeta = 0$), placing its poles at $s = \\pm 3j$. Which motion $x(t)$ results?',
    proofEnvelope: { type: 'marginal', sigma: 0, symmetric: true },
    proofTextMath:
      'Because $\\sigma = 0$, the envelope is constant ($e^{0\\cdot t} = 1$) — neither decaying nor growing — leaving a pure sustained sinusoid $y(t) = \\cos(3t)$.',
    proofTextMech:
      'With zero damping ($\\sigma = 0$), mechanical energy is conserved forever between kinetic and spring potential energy, tracing a constant-amplitude wave $x(t) = \\cos(3t)$.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        yBounds: [-1.35, 1.35],
        fn: (t) => Math.exp(-0.55 * t) * Math.cos(3.0 * t),
        wrongHintMath:
          'A shrinking envelope requires $\\sigma < 0$ in the LHP. Here $\\sigma = 0$ right on the $j\\omega$-axis, so $e^{0\\cdot t} = 1$ stays flat.',
        wrongHintMech:
          'Decay requires friction/damping ($\\sigma < 0$). Sitting directly on the $j\\omega$-axis means zero damping, so amplitude never shrinks.',
      },
      {
        letter: 'B',
        isCorrect: false,
        yBounds: [-3.4, 3.4],
        fn: (t) => 0.45 * Math.exp(0.35 * t) * Math.cos(3.0 * t),
        wrongHintMath:
          'Growing oscillations require $\\sigma > 0$ in the RHP. On the boundary $\\sigma = 0$, the amplitude remains strictly constant.',
        wrongHintMech:
          'Energy only grows when poles cross into the unstable RHP ($\\sigma > 0$). Poles on the $j\\omega$-axis oscillate neutrally without blowing up.',
      },
      {
        letter: 'C',
        isCorrect: true,
        yBounds: [-1.35, 1.35],
        fn: (t) => Math.cos(3.0 * t),
        wrongHintMath: '',
        wrongHintMech: '',
      },
    ],
  },
  {
    id: 'de-quiz-unstable',
    badge: 'Unstable RHP',
    title: 'Complex RHP Poles → Growing Instability',
    tDomain: [0, 4.2],
    poles: [
      { sigma: 0.4, omega: 3.0, color: COLORS.coral, glow: COLORS.coralGlow },
      { sigma: 0.4, omega: -3.0, color: COLORS.coral, glow: COLORS.coralGlow },
    ],
    poleTag: 's = +0.4 ± 3j',
    targetFormulaMath: 's = +0.4 \\pm 3j',
    targetFormulaMech: 's = +0.4 \\pm 3j \\quad (\\text{RHP Instability})',
    promptMath:
      'A complex conjugate pair crosses into the Coral Right Half-Plane at $s = +0.4 \\pm 3j$. Which time response $y(t)$ results?',
    promptMech:
      'Excessive PID derivative feedback pushes a servo’s closed-loop poles into the RHP at $s = +0.4 \\pm 3j$. What happens to $x(t)$?',
    proofEnvelope: { type: 'growth', sigma: 0.4, symmetric: true },
    proofTextMath:
      'Positive real part $\\sigma = +0.4 > 0$ makes the Amber envelope $\\pm e^{+0.4t}$ expand exponentially while $\\omega = 3$ oscillates inside it: $y(t) = e^{0.4t}\\cos(3t)$ — classic RHP instability!',
    proofTextMech:
      'Any pole in the RHP ($\\sigma > 0$) pumps energy into every cycle, driving runaway oscillatory instability $x(t) = e^{0.4t}\\cos(3t)$ until the actuator hits its mechanical stops.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        yBounds: [-1.35, 1.35],
        fn: (t) => Math.exp(-0.45 * t) * Math.cos(3.0 * t),
        wrongHintMath:
          'Check the sign of $\\sigma$! These poles are in the Right Half-Plane ($\\sigma = +0.4 > 0$), so $e^{+0.4t}$ grows explosively rather than decaying.',
        wrongHintMech:
          'Only Left Half-Plane poles ($\\sigma < 0$) damp out. RHP poles at $\\sigma = +0.4$ amplify every swing instead of settling.',
      },
      {
        letter: 'B',
        isCorrect: true,
        yBounds: [-5.8, 5.8],
        fn: (t) => Math.exp(0.4 * t) * Math.cos(3.0 * t),
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        yBounds: [-0.25, 1.35],
        fn: (t) => 1 - Math.exp(-1.5 * t),
        wrongHintMath:
          'Smooth saturation requires a stable LHP pole plus a pole at $s = 0$ with $\\omega = 0$. Here $\\sigma = +0.4 > 0$ and $\\omega = 3$ force unbounded oscillation.',
        wrongHintMech:
          'A servo with RHP complex poles cannot settle to a flat target — positive feedback makes it ring violently outward.',
      },
    ],
  },
  {
    id: 'de-quiz-fast-pole',
    badge: 'Deep LHP',
    title: 'Deep LHP Pole → Rapid Fast Settling',
    tDomain: [0, 5.0],
    poles: [{ sigma: -3.0, omega: 0, color: COLORS.cyan, glow: COLORS.cyanGlow }],
    poleTag: 's = -3.0',
    targetFormulaMath: 's = -3.0 \\quad (\\text{Deep LHP Pole})',
    targetFormulaMech: 's = -3.0\\text{ s}^{-1} \\quad (\\tau = 0.33\\text{ s})',
    promptMath:
      'Compare decay speed! This pole sits far left in the deep LHP at $s = -3.0$ (not near the origin). Which response settles fast as $e^{-3t}$?',
    promptMech:
      'A high-bandwidth motor current loop places its pole deep in the LHP at $s = -3.0\\text{ s}^{-1}$. Which curve shows its rapid settling?',
    proofEnvelope: { type: 'decay', sigma: -3.0, symmetric: false, tau: 1 / 3 },
    proofTextMath:
      'Farther left in the LHP means a larger $|\\sigma|$ and smaller time constant $\\tau = 1/|\\sigma| = 0.33\\text{ s}$ — so $e^{-3t}$ drops below $5\\%$ by $t = 1\\text{ s}$, ten times faster than $e^{-0.3t}$.',
    proofTextMech:
      'Pushing a pole deep left to $s = -3.0\\text{ s}^{-1}$ shrinks the time constant to $\\tau = 0.33\\text{ s}$, snapping the transient to zero in ~1 second with zero overshoot.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        yBounds: [-0.2, 1.22],
        fn: (t) => Math.exp(-3.0 * t),
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        yBounds: [-0.2, 1.22],
        fn: (t) => Math.exp(-0.3 * t),
        wrongHintMath:
          'That sluggish curve is $e^{-0.3t}$ (a slow pole near $s = -0.3$). Deeper left at $s = -3.0$ decays $10\\times$ faster ($\\tau = 0.33\\text{ s}$)!',
        wrongHintMech:
          'That slow tail corresponds to a pole near the origin ($s = -0.3$). Deep LHP poles at $s = -3.0\\text{ s}^{-1}$ settle almost instantaneously.',
      },
      {
        letter: 'C',
        isCorrect: false,
        yBounds: [-1.35, 1.35],
        fn: (t) => Math.exp(-0.5 * t) * Math.cos(3.2 * t),
        wrongHintMath:
          'The pole $s = -3.0$ sits squarely on the real axis ($\\omega = 0$), so the response decays cleanly with zero oscillation.',
        wrongHintMech:
          'Zero imaginary component ($\\omega = 0$) guarantees a crisp non-oscillating transient with no ringing.',
      },
    ],
  },
  {
    id: 'de-quiz-step-rc',
    badge: 'Step Response',
    title: '1st-Order Step Transform → Smooth Saturation',
    tDomain: [0, 4.5],
    poles: [
      { sigma: 0, omega: 0, color: COLORS.amberLight, glow: COLORS.amberGlow, tag: 's=0' },
      { sigma: -2.0, omega: 0, color: COLORS.cyan, glow: COLORS.cyanGlow, tag: 's=-2' },
    ],
    poleTag: 's = 0, -2',
    targetFormulaMath: 'Y(s) = \\frac{1}{s(s+2)} \\quad (s = 0,\\ -2)',
    targetFormulaMech: 'V_c(s) = \\frac{1}{s(s+2)} \\quad (\\text{RC Step})',
    promptMath:
      'A 1st-order step transform $Y(s) = \\frac{1}{s(s+2)}$ has two real poles: a step pole at $s = 0$ and a plant pole at $s = -2$. Which normalized time response matches?',
    promptMech:
      'Applying a step voltage to an RC filter adds a pole at $s = 0$ to the plant pole at $s = -2\\text{ s}^{-1}$. Which capacitor voltage curve matches?',
    proofEnvelope: { type: 'step', sigma: -2.0, asymptote: 1.0, tau: 0.5 },
    proofTextMath:
      'Partial fractions split the poles into a constant DC plateau (from $s = 0$) minus a decaying transient (from $s = -2$), yielding smooth saturation $1 - e^{-2t} \\to 1$ with zero overshoot.',
    proofTextMech:
      'The step pole at $s = 0$ holds the target steady-state level $1$, while the real LHP pole at $s = -2$ charges the capacitor smoothly along $1 - e^{-2t}$ with $\\tau = 0.5\\text{ s}$.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        yBounds: [-0.22, 1.38],
        fn: (t) => Math.exp(-2.0 * t),
        wrongHintMath:
          'Don’t ignore the pole at $s = 0$! Pure decay $e^{-2t}$ comes from $\\frac{1}{s+2}$ alone. The $1/s$ pole adds a constant term so the response rises to $1$ instead of falling to $0$.',
        wrongHintMech:
          'That is the unforced discharge ($e^{-2t}$). Because a constant step input ($1/s$) stays applied, voltage climbs smoothly to its steady-state target $1$.',
      },
      {
        letter: 'B',
        isCorrect: false,
        yBounds: [-0.22, 1.48],
        fn: (t) => 1 - Math.exp(-0.65 * t) * Math.cos(3.4 * t),
        wrongHintMath:
          'Overshoot and ringing require complex conjugate poles ($\\omega \\neq 0$). Here both poles $s = 0$ and $s = -2$ lie strictly on the real axis!',
        wrongHintMech:
          'A 1st-order RC circuit has only real poles ($\\omega = 0$), so it can never overshoot or ring past its steady-state target.',
      },
      {
        letter: 'C',
        isCorrect: true,
        yBounds: [-0.22, 1.38],
        fn: (t) => 1 - Math.exp(-2.0 * t),
        wrongHintMath: '',
        wrongHintMech: '',
      },
    ],
  },
];

export class DiffEqVisualQuizEngine {
  constructor(containerOrOptions = {}, maybeOptions = {}) {
    const isElement =
      containerOrOptions &&
      typeof containerOrOptions === 'object' &&
      containerOrOptions.nodeType === 1;
    const autoMountContainer = isElement ? containerOrOptions : null;
    const options = isElement ? maybeOptions || {} : containerOrOptions || {};

    const {
      mechatronicsLens = options.lens === 'mechatronics',
      onProgress = null,
      onAnswer = null,
      onComplete = null,
    } = options;

    this.mechatronicsLens = Boolean(mechatronicsLens);
    this.onProgress = typeof onProgress === 'function' ? onProgress : null;
    this.onAnswer = typeof onAnswer === 'function' ? onAnswer : null;
    this.onComplete = typeof onComplete === 'function' ? onComplete : null;

    this._challenges = DIFFEQ_QUIZ_CHALLENGES;
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
        Match the Pole
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
        'el-de-pill w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[11px] sm:text-xs font-mono font-semibold flex items-center justify-center border cursor-pointer ' +
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

    // --- 2. Compact Prompt & Glowing s-Plane Target Canvas ---
    const body = document.createElement('div');
    body.className = 'p-2.5 sm:p-4 flex flex-col gap-2.5 sm:gap-4';

    const promptBox = document.createElement('div');
    promptBox.className = 'flex flex-col gap-1.5 sm:gap-2';

    const promptText = document.createElement('p');
    promptText.className = 'text-xs sm:text-[15px] leading-snug sm:leading-relaxed text-slate-200';
    promptText.innerHTML = formatInlineMath(this.mechatronicsLens ? ch.promptMech : ch.promptMath);
    promptBox.appendChild(promptText);

    const targetFrame = document.createElement('div');
    targetFrame.className =
      'relative rounded-xl border border-slate-800/90 bg-[#0B0D12] overflow-hidden';

    const targetTopBar = document.createElement('div');
    targetTopBar.className =
      'px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#0E121B]/95 border-b border-slate-800/60 flex items-center justify-between gap-2';

    const targetFormula = this.mechatronicsLens ? ch.targetFormulaMech : ch.targetFormulaMath;
    targetTopBar.innerHTML = `
      <span class="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-cyan-200">
        <span class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE]"></span>
        ${this.mechatronicsLens ? 'Control s-Plane Poles' : 'Laplace s-Plane Pole Map'}
      </span>
      <span class="text-[11px] sm:text-xs text-slate-200">${formatKatex(targetFormula, false)}</span>
    `;
    targetFrame.appendChild(targetTopBar);

    const targetCanvasWrap = document.createElement('div');
    targetCanvasWrap.className = 'relative w-full h-[126px] sm:h-[192px]';

    const targetCanvas = document.createElement('canvas');
    targetCanvas.className = 'el-de-canvas h-full';
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
        'el-dvq-card text-left rounded-xl border border-slate-800/90 bg-[#0F131C]/80 overflow-hidden flex flex-col focus:outline-none focus:ring-2 focus:ring-cyan-400/50';

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
        'px-2 py-1 sm:px-3 sm:py-2 border-b border-slate-800/60 flex items-center justify-between gap-1 bg-[#0E121B]/90';

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

      const respVar = this.mechatronicsLens ? 'x(t)' : 'y(t)';
      cardHeader.innerHTML = `
        <span class="inline-flex items-center gap-1.5 sm:gap-2">
          <span class="w-5 h-5 rounded-md text-[11px] font-mono font-bold border flex items-center justify-center ${badgeColor}">
            ${opt.letter}
          </span>
          <span class="hidden sm:inline text-xs font-medium text-slate-300">${respVar} Option ${opt.letter}</span>
        </span>
        ${rightBadge}
      `;
      card.appendChild(cardHeader);

      const canvasWrap = document.createElement('div');
      canvasWrap.className = 'relative w-full bg-[#0B0D12] h-[86px] sm:h-[136px]';

      const canvas = document.createElement('canvas');
      canvas.className = 'el-de-canvas h-full';
      canvasWrap.appendChild(canvas);
      card.appendChild(canvasWrap);

      card.addEventListener('click', () => this._handleOptionClick(opt), { signal });

      optionsGrid.appendChild(card);
      this._optionCards.push({ card, canvasWrap, opt });
      this._optionCanvases.push(canvas);
      this._optionCtxs.push(canvas.getContext('2d'));
    });

    body.appendChild(optionsGrid);

    // --- 4. Feedback Banner (Envelope Proof OR Targeted Misconception Hint) ---
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
      'rounded-xl border border-emerald-400/45 bg-emerald-500/10 p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3';

    const left = document.createElement('div');
    left.className = 'flex flex-col gap-1';
    left.innerHTML = `
      <div class="flex items-center gap-2 text-xs font-semibold text-emerald-300">
        <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-400/20 border border-emerald-400/60 text-[10px]">✓</span>
        s-Plane Envelope Proof Unlocked
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
      'el-de-pill px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-400/60 text-emerald-100 cursor-pointer whitespace-nowrap';

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

    // --- Target Canvas: Glowing s-Plane Pole Map ---
    if (this._targetCtx && this._targetSize && this._targetSize.w >= 20) {
      const { w, h } = this._targetSize;
      const ctx = this._targetCtx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const compact = w < 430;
      const targetPad = compact ? { left: 34, right: 12, top: 14, bottom: 20 } : QUIZ_TARGET_PAD;
      const map = createPlotMapper(
        w,
        h,
        targetPad,
        QUIZ_SPLANE_BOUNDS.sigmaMin,
        QUIZ_SPLANE_BOUNDS.sigmaMax,
        QUIZ_SPLANE_BOUNDS.omegaMin,
        QUIZ_SPLANE_BOUNDS.omegaMax
      );

      drawSPlaneCanvas(ctx, w, h, map, QUIZ_SPLANE_BOUNDS, {
        compact,
        showZetaLabels: false,
      });

      // Draw conjugate connector if pair shares σ with ±ω
      if (
        ch.poles.length === 2 &&
        Math.abs(ch.poles[0].sigma - ch.poles[1].sigma) < 1e-4 &&
        ch.poles[0].omega * ch.poles[1].omega < 0
      ) {
        ctx.save();
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.32)';
        ctx.lineWidth = 1.1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(map.xToPx(ch.poles[0].sigma), map.yToPx(ch.poles[0].omega));
        ctx.lineTo(map.xToPx(ch.poles[1].sigma), map.yToPx(ch.poles[1].omega));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Draw pulsing Cyan/Amber/Coral × pole markers
      const markerSize = compact ? 6 : 7.5;
      for (const p of ch.poles) {
        drawPoleMarker(ctx, map, p.sigma, p.omega, {
          pulse,
          color: p.color || COLORS.cyan,
          glow: p.glow || COLORS.cyanGlow,
          size: markerSize,
        });
      }

      // Floating pole coordinate callout pill on target s-plane
      const primaryPole = ch.poles[0];
      drawFloatingPill(
        ctx,
        map,
        map.xToPx(primaryPole.sigma),
        map.yToPx(primaryPole.omega),
        ch.poleTag,
        primaryPole.color || COLORS.cyan,
        true,
        compact
      );
    }

    // --- 3-Column Candidate Time-Domain Response Canvases ---
    const optionSizes = this._optionSizes || [];
    ch.options.forEach((opt, idx) => {
      const ctx = this._optionCtxs[idx];
      const size = optionSizes[idx];
      if (!ctx || !size || size.w < 20) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const [yMin, yMax] = opt.yBounds;
      const isNarrow = size.w < 175;
      const optPad = isNarrow ? { left: 8, right: 8, top: 8, bottom: 10 } : QUIZ_OPTION_PAD;
      const map = createPlotMapper(size.w, size.h, optPad, tMin, tMax, yMin, yMax);

      drawEngineeringGrid(ctx, size.w, size.h, map, tMin, tMax, yMin, yMax, {
        showXLabels: !isNarrow,
        showYLabels: !isNarrow,
        xUnit: !isNarrow ? 's' : '',
        compact: true,
      });

      const isSolvedCorrect = solved && opt.isCorrect;

      // Glowing decay/growth envelope proof overlay directly on the matching answer canvas!
      if (isSolvedCorrect && ch.proofEnvelope) {
        this._drawEnvelopeProofOverlay(ctx, map, ch.proofEnvelope, tMin, tMax, pulse, isNarrow);
      }

      const strokeColor = isSolvedCorrect ? COLORS.emerald : COLORS.violet;
      const glowColor = isSolvedCorrect ? COLORS.emeraldGlow : COLORS.violetGlow;
      drawGlowingCurve(ctx, map, opt.fn, tMin, tMax, strokeColor, glowColor, isNarrow ? 2.0 : 2.3, 200);
    });
  }

  _drawEnvelopeProofOverlay(ctx, map, env, tMin, tMax, pulse, isNarrow) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(map.plotLeft, map.plotTop, map.plotW, map.plotH);
    ctx.clip();

    if (env.type === 'step') {
      // Glowing dashed Amber horizontal asymptote y = 1 + τ vertical marker
      const pyAsym = Math.round(map.yToPx(env.asymptote)) + 0.5;
      ctx.strokeStyle = COLORS.amberLight;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = COLORS.amberGlow;
      ctx.shadowBlur = 7;
      ctx.setLineDash([4, 3.5]);
      ctx.beginPath();
      ctx.moveTo(map.plotLeft, pyAsym);
      ctx.lineTo(map.plotRight, pyAsym);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      if (env.tau) {
        const pxTau = Math.round(map.xToPx(env.tau)) + 0.5;
        const pyTau = map.yToPx(1 - Math.exp(-1));
        ctx.strokeStyle = `rgba(52, 211, 153, ${(0.45 + 0.35 * pulse).toFixed(2)})`;
        ctx.lineWidth = 1.25;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(pxTau, map.plotTop);
        ctx.lineTo(pxTau, map.plotBottom);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(pxTau, pyTau, isNarrow ? 2.8 : 3.5, 0, TWO_PI);
        ctx.fillStyle = COLORS.amberLight;
        ctx.fill();
      }
    } else {
      const s = env.sigma;
      const envPos = (t) => Math.exp(s * t);
      const envNeg = (t) => -Math.exp(s * t);
      const dash = isNarrow ? [3.5, 3] : [5, 3.5];

      drawGlowingCurve(
        ctx,
        map,
        envPos,
        tMin,
        tMax,
        COLORS.amberLight,
        COLORS.amberGlow,
        isNarrow ? 1.4 : 1.65,
        140,
        dash
      );
      if (env.symmetric) {
        drawGlowingCurve(
          ctx,
          map,
          envNeg,
          tMin,
          tMax,
          COLORS.amberLight,
          COLORS.amberGlow,
          isNarrow ? 1.4 : 1.65,
          140,
          dash
        );
      }

      if (env.tau && env.tau > tMin && env.tau < tMax) {
        const pxTau = Math.round(map.xToPx(env.tau)) + 0.5;
        const pyTau = map.yToPx(Math.exp(-1));
        ctx.strokeStyle = `rgba(252, 211, 77, ${(0.42 + 0.34 * pulse).toFixed(2)})`;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(pxTau, map.plotTop);
        ctx.lineTo(pxTau, map.plotBottom);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(pxTau, pyTau, (isNarrow ? 3.5 : 4.6) + pulse * 2, 0, TWO_PI);
        ctx.strokeStyle = `rgba(252, 211, 77, ${(0.7 - pulse * 0.35).toFixed(2)})`;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pxTau, pyTau, isNarrow ? 2.5 : 3.2, 0, TWO_PI);
        ctx.fillStyle = COLORS.amberLight;
        ctx.fill();
      }
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
