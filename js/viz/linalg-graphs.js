/**
 * EIGENLAB — Interactive 2D Linear Transform & Eigenvector Playground + Visual Quiz Engine
 *
 * Exports:
 *   - LinearTransform2DLab   : High-DPI interactive 2D linear transformation playground with
 *                              draggable basis handles (c1 = i', c2 = j'), live warped grid,
 *                              shaded unit parallelogram (det area & orientation), SVD
 *                              manipulability ellipse, auto-computed real/complex eigenvector
 *                              span lines, 5 one-tap presets, and Mechatronics Lens relabeling.
 *   - LinAlgVisualQuizEngine : Brilliant.org-style 6-challenge visual intuition quiz (`la-quiz-1`
 *                              .. `la-quiz-6`) with mobile-first 3-column zero-scroll layout,
 *                              geometric proof overlays, targeted hints, and store/sound sync.
 */

import { store, sound, renderKatex, renderInlineMathText } from '../store.js';

// ---------------------------------------------------------------------------
// Palette & Visual Constants (EIGENLAB Dark Engineering Studio)
// ---------------------------------------------------------------------------
const COLORS = {
  bg: '#0B0D12',
  bgPanel: '#0F131C',
  gridMinor: 'rgba(148, 163, 184, 0.065)',
  gridMajor: 'rgba(148, 163, 184, 0.12)',
  axis: 'rgba(148, 163, 184, 0.36)',
  axisLabel: 'rgba(148, 163, 184, 0.62)',
  cyan: '#22D3EE',
  cyanLight: '#67E8F9',
  cyanGlow: 'rgba(34, 211, 238, 0.48)',
  violet: '#A78BFA',
  violetGlow: 'rgba(167, 139, 250, 0.44)',
  amber: '#F59E0B',
  amberLight: '#FCD34D',
  amberGlow: 'rgba(245, 158, 11, 0.50)',
  emerald: '#34D399',
  emeraldGlow: 'rgba(52, 211, 153, 0.46)',
  coral: '#FB7185',
  coralGlow: 'rgba(251, 113, 133, 0.48)',
  pillBg: 'rgba(11, 13, 18, 0.92)',
  pillBorder: 'rgba(148, 163, 184, 0.28)',
};

const TWO_PI = Math.PI * 2;
const FONT_MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const FONT_SANS = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
const DET_EPS = 0.04;

// ---------------------------------------------------------------------------
// Scoped Component Styles (injected once into <head>)
// ---------------------------------------------------------------------------
function injectStylesOnce() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('eigenlab-linalg-graphs-styles')) return;

  const style = document.createElement('style');
  style.id = 'eigenlab-linalg-graphs-styles';
  style.textContent = `
    @keyframes eigenlabLinAlgShakeGentle {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(5px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(3px); }
    }
    .la-shake-gentle {
      animation: eigenlabLinAlgShakeGentle 0.42s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .el-la-canvas {
      display: block;
      width: 100%;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }
    .el-la-pill {
      transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease, transform 120ms ease;
    }
    .el-la-pill:active {
      transform: scale(0.97);
    }
    .el-laq-card {
      transition: border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease, transform 160ms ease;
      cursor: pointer;
    }
    .el-laq-card:hover:not([data-locked="true"]) {
      transform: translateY(-2px);
      border-color: rgba(34, 211, 238, 0.55);
      box-shadow: 0 10px 30px -12px rgba(34, 211, 238, 0.25);
    }
    .el-laq-card[data-state="correct"] {
      border-color: rgba(52, 211, 153, 0.85) !important;
      background: linear-gradient(180deg, rgba(52, 211, 153, 0.12), rgba(15, 19, 28, 0.92)) !important;
      box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.35), 0 12px 32px -12px rgba(52, 211, 153, 0.35) !important;
    }
    .el-laq-card[data-state="wrong"] {
      border-color: rgba(251, 113, 133, 0.72) !important;
      background: linear-gradient(180deg, rgba(251, 113, 133, 0.09), rgba(15, 19, 28, 0.92)) !important;
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Safe Store, Sound, KaTeX & Formatting Helpers
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
    // Fall back to code
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
    // Fall through
  }
  return text.replace(/\$([^$]+)\$/g, (_, expr) => formatKatex(expr, false));
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function fmtNum(val, decimals = 2) {
  if (!Number.isFinite(val)) return '0.00';
  const cleaned = Math.abs(val) < 0.004 ? 0 : val;
  return cleaned.toFixed(decimals);
}

function fmtCompact(val) {
  if (!Number.isFinite(val)) return '0';
  const cleaned = Math.abs(val) < 0.005 ? 0 : val;
  if (Math.abs(cleaned - Math.round(cleaned)) < 0.01) return String(Math.round(cleaned));
  if (Math.abs(cleaned * 10 - Math.round(cleaned * 10)) < 0.02) return cleaned.toFixed(1);
  return cleaned.toFixed(2);
}

// ---------------------------------------------------------------------------
// 2×2 Linear Algebra Engine (Det, Rank, Exact Eigenpairs, Exact 2×2 SVD)
// ---------------------------------------------------------------------------
function applyMat2(m, x, y) {
  return [m.a * x + m.b * y, m.c * x + m.d * y];
}

function normalize2(vx, vy) {
  const n = Math.hypot(vx, vy);
  if (n < 1e-9) return null;
  let ux = vx / n;
  let uy = vy / n;
  // Canonicalize sign so span labels remain stable while dragging
  if (ux < -1e-4 || (Math.abs(ux) <= 1e-4 && uy < 0)) {
    ux = -ux;
    uy = -uy;
  }
  return [ux, uy];
}

function computeEigenvector2(m, lam) {
  // Candidates orthogonal to rows of (A - λI) = [[a-λ, b], [c, d-λ]]
  const r1x = -m.b;
  const r1y = m.a - lam;
  const r2x = m.d - lam;
  const r2y = -m.c;
  const n1 = Math.hypot(r1x, r1y);
  const n2 = Math.hypot(r2x, r2y);
  if (n1 < 1e-7 && n2 < 1e-7) return null; // Scalar multiple of I
  return n1 >= n2 ? normalize2(r1x, r1y) : normalize2(r2x, r2y);
}

function analyzeMatrix2D(a, b, c, d) {
  const m = { a, b, c, d };
  const trace = a + d;
  const det = a * d - b * c;
  const disc = trace * trace - 4 * det;

  const norm1 = Math.hypot(a, c);
  const norm2 = Math.hypot(b, d);
  const isZero = norm1 < 0.04 && norm2 < 0.04;
  const isSingular = Math.abs(det) <= DET_EPS;
  const rank = isZero ? 0 : isSingular ? 1 : 2;
  const orientation = isSingular ? 'singular' : det > 0 ? 'positive' : 'negative';

  // Exact 2×2 SVD via symmetric eigendecomposition of B = A A^T
  const p = a * a + b * b;
  const q = a * c + b * d;
  const r = c * c + d * d;
  const R = Math.hypot(p - r, 2 * q);
  const s1Sq = Math.max(0, 0.5 * (p + r + R));
  const s2Sq = Math.max(0, 0.5 * (p + r - R));
  const sigma1 = Math.sqrt(s1Sq);
  const sigma2 = Math.sqrt(s2Sq);
  const phi = R > 1e-8 ? 0.5 * Math.atan2(2 * q, p - r) : 0;
  const u1 = [Math.cos(phi), Math.sin(phi)];
  const u2 = [-Math.sin(phi), Math.cos(phi)];
  const cond = sigma2 > 1e-4 ? sigma1 / sigma2 : Infinity;

  // Eigenvalues & real eigenvector spans
  let eigen;
  if (disc >= -1e-4) {
    const sqrtD = Math.sqrt(Math.max(0, disc));
    const l1 = 0.5 * (trace + sqrtD);
    const l2 = 0.5 * (trace - sqrtD);
    const isScalar = Math.abs(b) < 1e-4 && Math.abs(c) < 1e-4 && Math.abs(a - d) < 1e-4;

    if (isScalar) {
      eigen = {
        type: 'scalar',
        lambda1: l1,
        lambda2: l2,
        vectors: [
          { lambda: l1, dir: [1, 0], color: COLORS.emerald, tag: 'λ₁' },
          { lambda: l2, dir: [0, 1], color: COLORS.amberLight, tag: 'λ₂' },
        ],
      };
    } else {
      const v1 = computeEigenvector2(m, l1);
      const v2 = computeEigenvector2(m, l2);
      const vectors = [];
      if (v1) {
        vectors.push({ lambda: l1, dir: v1, color: COLORS.emerald, tag: 'λ₁' });
      }
      if (v2) {
        const cross = v1 ? Math.abs(v1[0] * v2[1] - v1[1] * v2[0]) : 1;
        if (cross > 0.035) {
          vectors.push({ lambda: l2, dir: v2, color: COLORS.amberLight, tag: 'λ₂' });
        } else if (vectors.length === 1) {
          vectors[0].defective = true;
          vectors[0].tag = 'λ';
        }
      }
      eigen = {
        type: vectors.length === 1 ? 'defective' : 'real',
        lambda1: l1,
        lambda2: l2,
        vectors,
      };
    }
  } else {
    const alpha = 0.5 * trace;
    const beta = 0.5 * Math.sqrt(Math.abs(disc));
    eigen = {
      type: 'complex',
      alpha,
      beta,
      vectors: [],
    };
  }

  const isSymmetric = Math.abs(b - c) < 0.03;

  return {
    a,
    b,
    c,
    d,
    trace,
    det,
    disc,
    rank,
    orientation,
    isSingular,
    isSymmetric,
    eigen,
    svd: { sigma1, sigma2, u1, u2, cond },
  };
}

// ---------------------------------------------------------------------------
// Isotropic 2D Plane Mapper & High-DPI Drawing Primitives
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

/**
 * Creates a strictly isotropic (1:1 aspect ratio) Cartesian mapper so circles,
 * rotations, and 90° orthogonal eigenvectors render with exact geometry.
 */
function createIsotropicMapper(width, height, halfExtentY = 3.0) {
  const cx = width * 0.5;
  const cy = height * 0.5;
  const scale = Math.min(width, height) / (halfExtentY * 2);
  const xHalf = width / (2 * scale);
  const yHalf = height / (2 * scale);

  return {
    width,
    height,
    cx,
    cy,
    scale,
    xMin: -xHalf,
    xMax: xHalf,
    yMin: -yHalf,
    yMax: yHalf,
    xToPx: (x) => cx + x * scale,
    yToPx: (y) => cy - y * scale,
    pxToX: (px) => (px - cx) / scale,
    pxToY: (py) => (cy - py) / scale,
  };
}

function drawReferencePlane(ctx, map, opts = {}) {
  const { showLabels = true, showUnitRefs = true, compact = false } = opts;

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, map.width, map.height);

  // Subtle radial engineering studio vignette
  const radGrad = ctx.createRadialGradient(
    map.cx,
    map.cy,
    12,
    map.cx,
    map.cy,
    Math.max(map.width, map.height) * 0.65
  );
  radGrad.addColorStop(0, 'rgba(30, 41, 59, 0.24)');
  radGrad.addColorStop(1, 'rgba(11, 13, 18, 0)');
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, map.width, map.height);

  // Subtle fixed reference Cartesian grid
  const gxMin = Math.floor(map.xMin);
  const gxMax = Math.ceil(map.xMax);
  const gyMin = Math.floor(map.yMin);
  const gyMax = Math.ceil(map.yMax);

  ctx.lineWidth = 1;
  for (let gx = gxMin; gx <= gxMax; gx++) {
    const px = Math.round(map.xToPx(gx)) + 0.5;
    ctx.strokeStyle = gx === 0 ? COLORS.axis : COLORS.gridMinor;
    ctx.lineWidth = gx === 0 ? 1.25 : 1;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, map.height);
    ctx.stroke();
  }
  for (let gy = gyMin; gy <= gyMax; gy++) {
    const py = Math.round(map.yToPx(gy)) + 0.5;
    ctx.strokeStyle = gy === 0 ? COLORS.axis : COLORS.gridMinor;
    ctx.lineWidth = gy === 0 ? 1.25 : 1;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(map.width, py);
    ctx.stroke();
  }

  // Faint dashed reference unit circle & unit square
  if (showUnitRefs) {
    ctx.save();
    ctx.setLineDash([3, 3.5]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.beginPath();
    ctx.arc(map.cx, map.cy, map.scale, 0, TWO_PI);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
    ctx.strokeRect(
      Math.round(map.xToPx(0)) + 0.5,
      Math.round(map.yToPx(1)) + 0.5,
      map.scale,
      map.scale
    );
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Integer axis tick labels
  if (showLabels) {
    ctx.save();
    ctx.font = `500 ${compact ? 8.5 : 9.5}px ${FONT_MONO}`;
    ctx.fillStyle = COLORS.axisLabel;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xLabelLimit = Math.min(3, Math.floor(map.xMax - 0.15));
    for (let gx = -xLabelLimit; gx <= xLabelLimit; gx++) {
      if (gx === 0) continue;
      ctx.fillText(String(gx), map.xToPx(gx), map.cy + 4);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const yLabelLimit = Math.min(3, Math.floor(map.yMax - 0.15));
    for (let gy = -yLabelLimit; gy <= yLabelLimit; gy++) {
      if (gy === 0) continue;
      ctx.fillText(String(gy), map.cx - 5, map.yToPx(gy));
    }
    ctx.restore();
  }
}

function drawWarpedGrid(ctx, map, m, opts = {}) {
  const { range = 5, lineAlpha = 0.19, axisAlpha = 0.36, color = '34, 211, 238' } = opts;
  ctx.save();
  ctx.lineCap = 'round';

  // Transformed vertical lines (constant x, varying y)
  for (let x = -range; x <= range; x++) {
    const p0 = applyMat2(m, x, -range);
    const p1 = applyMat2(m, x, range);
    ctx.strokeStyle = `rgba(${color}, ${x === 0 ? axisAlpha : lineAlpha})`;
    ctx.lineWidth = x === 0 ? 1.45 : 0.95;
    ctx.beginPath();
    ctx.moveTo(map.xToPx(p0[0]), map.yToPx(p0[1]));
    ctx.lineTo(map.xToPx(p1[0]), map.yToPx(p1[1]));
    ctx.stroke();
  }

  // Transformed horizontal lines (constant y, varying x)
  for (let y = -range; y <= range; y++) {
    const p0 = applyMat2(m, -range, y);
    const p1 = applyMat2(m, range, y);
    ctx.strokeStyle = `rgba(${color}, ${y === 0 ? axisAlpha : lineAlpha})`;
    ctx.lineWidth = y === 0 ? 1.45 : 0.95;
    ctx.beginPath();
    ctx.moveTo(map.xToPx(p0[0]), map.yToPx(p0[1]));
    ctx.lineTo(map.xToPx(p1[0]), map.yToPx(p1[1]));
    ctx.stroke();
  }

  ctx.restore();
}

function drawUnitParallelogram(ctx, map, info, opts = {}) {
  const { showAreaLabel = true, showOrientationArc = true, compact = false, pulse = 0.5 } = opts;
  const { a, b, c, d, det, isSingular } = info;
  const oX = map.cx;
  const oY = map.cy;
  const c1X = map.xToPx(a);
  const c1Y = map.yToPx(c);
  const c2X = map.xToPx(b);
  const c2Y = map.yToPx(d);
  const sumX = map.xToPx(a + b);
  const sumY = map.yToPx(c + d);

  ctx.save();
  if (isSingular) {
    // Glowing Amber collapse highlight along the 1D column space
    const dir = Math.hypot(a, c) >= Math.hypot(b, d) ? normalize2(a, c) : normalize2(b, d);
    if (dir) {
      const span = Math.max(map.xMax, map.yMax) * 1.6;
      ctx.strokeStyle = COLORS.amber;
      ctx.lineWidth = 3.2 + pulse * 1.4;
      ctx.shadowColor = COLORS.amberGlow;
      ctx.shadowBlur = 14;
      ctx.globalAlpha = 0.55 + 0.25 * pulse;
      ctx.beginPath();
      ctx.moveTo(map.xToPx(-dir[0] * span), map.yToPx(-dir[1] * span));
      ctx.lineTo(map.xToPx(dir[0] * span), map.yToPx(dir[1] * span));
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  } else {
    const isPos = det > 0;
    const fill = isPos ? 'rgba(52, 211, 153, 0.16)' : 'rgba(251, 113, 133, 0.18)';
    const stroke = isPos ? 'rgba(52, 211, 153, 0.65)' : 'rgba(251, 113, 133, 0.72)';

    ctx.beginPath();
    ctx.moveTo(oX, oY);
    ctx.lineTo(c1X, c1Y);
    ctx.lineTo(sumX, sumY);
    ctx.lineTo(c2X, c2Y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.25;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Small curved orientation sweep arc from c1 -> c2 near origin
    if (showOrientationArc && Math.hypot(a, c) > 0.25 && Math.hypot(b, d) > 0.25) {
      const rArc = Math.min(map.scale * 0.42, Math.min(Math.hypot(a, c), Math.hypot(b, d)) * map.scale * 0.55);
      if (rArc > 8) {
        const ang1 = Math.atan2(-c, a); // canvas Y inverted
        const ang2 = Math.atan2(-d, b);
        const anticlockwise = isPos; // positive det sweeps CCW in math = anticlockwise in canvas
        ctx.beginPath();
        ctx.arc(oX, oY, rArc, ang1, ang2, anticlockwise);
        ctx.strokeStyle = isPos ? 'rgba(52, 211, 153, 0.85)' : 'rgba(251, 113, 133, 0.9)';
        ctx.lineWidth = 1.75;
        ctx.stroke();

        // Small arrowhead at ang2 along arc tangent
        const tipX = oX + Math.cos(ang2) * rArc;
        const tipY = oY + Math.sin(ang2) * rArc;
        const tangent = anticlockwise ? ang2 - Math.PI / 2 : ang2 + Math.PI / 2;
        const ah = compact ? 4.5 : 5.5;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - ah * Math.cos(tangent - 0.55), tipY - ah * Math.sin(tangent - 0.55));
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - ah * Math.cos(tangent + 0.55), tipY - ah * Math.sin(tangent + 0.55));
        ctx.stroke();
      }
    }
  }

  if (showAreaLabel) {
    const midX = isSingular ? map.xToPx((a + b) * 0.35) : map.xToPx((a + b) * 0.5);
    const midY = isSingular ? map.yToPx((c + d) * 0.35) : map.yToPx((c + d) * 0.5);
    const label = isSingular
      ? 'Area = 0 (Collapse!)'
      : det < 0
      ? `Area = ${fmtNum(Math.abs(det), 2)} (Flip)`
      : `Area = ${fmtNum(det, 2)}`;
    const accent = isSingular ? COLORS.amber : det > 0 ? COLORS.emerald : COLORS.coral;
    drawCanvasPill(ctx, map, midX, midY, label, accent, { compact, centered: true });
  }
  ctx.restore();
}

function drawSVDEllipse(ctx, map, info, opts = {}) {
  const { showSemiAxes = true, showLabels = true, compact = false } = opts;
  const { a, b, c, d, svd } = info;
  const { sigma1, sigma2, u1, u2 } = svd;
  if (sigma1 < 0.03) return;

  ctx.save();
  // Parametric transformed unit circle A * [cos θ, sin θ]^T
  const steps = 96;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * TWO_PI;
    const ct = Math.cos(th);
    const st = Math.sin(th);
    const px = map.xToPx(a * ct + b * st);
    const py = map.yToPx(c * ct + d * st);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(167, 139, 250, 0.075)';
  ctx.fill();
  ctx.strokeStyle = COLORS.violet;
  ctx.lineWidth = compact ? 1.65 : 2.0;
  ctx.shadowColor = COLORS.violetGlow;
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (showSemiAxes) {
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.72)';

    // Major semi-axis ±σ₁ u₁
    ctx.beginPath();
    ctx.moveTo(map.xToPx(-u1[0] * sigma1), map.yToPx(-u1[1] * sigma1));
    ctx.lineTo(map.xToPx(u1[0] * sigma1), map.yToPx(u1[1] * sigma1));
    ctx.stroke();

    // Minor semi-axis ±σ₂ u₂
    if (sigma2 > 0.08) {
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.48)';
      ctx.beginPath();
      ctx.moveTo(map.xToPx(-u2[0] * sigma2), map.yToPx(-u2[1] * sigma2));
      ctx.lineTo(map.xToPx(u2[0] * sigma2), map.yToPx(u2[1] * sigma2));
      ctx.stroke();
    }
    ctx.setLineDash([]);

    if (showLabels && !compact) {
      ctx.font = `600 9.5px ${FONT_MONO}`;
      ctx.fillStyle = '#DDD6FE';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`σ₁=${fmtNum(sigma1, 1)}`, map.xToPx(u1[0] * (sigma1 + 0.28)), map.yToPx(u1[1] * (sigma1 + 0.28)));
      if (sigma2 > 0.35) {
        ctx.fillText(`σ₂=${fmtNum(sigma2, 1)}`, map.xToPx(u2[0] * (sigma2 + 0.28)), map.yToPx(u2[1] * (sigma2 + 0.28)));
      }
    }
  }
  ctx.restore();
}

function drawEigenvectorSpans(ctx, map, info, opts = {}) {
  const { showLabels = true, compact = false, showComplexBadge = true, pulse = 0.5 } = opts;
  const { eigen } = info;
  ctx.save();

  if (eigen.type === 'complex') {
    // Subtle swirl arcs indicating pure rotation/spiral with no real invariant line
    const rSwirl = map.scale * 0.78;
    ctx.strokeStyle = `rgba(167, 139, 250, ${(0.35 + 0.25 * pulse).toFixed(2)})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(map.cx, map.cy, rSwirl, -0.35, -1.65, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(map.cx, map.cy, rSwirl, Math.PI - 0.35, Math.PI - 1.65, true);
    ctx.stroke();
    ctx.setLineDash([]);

    if (showComplexBadge) {
      const txt = compact
        ? 'Complex λ — pure rotation/spiral'
        : `Complex eigenvalues (${fmtNum(eigen.alpha, 2)} ± ${fmtNum(eigen.beta, 2)}j) — pure rotation/spiral`;
      drawCanvasPill(ctx, map, map.cx, 18, txt, COLORS.violet, { compact, centered: true });
    }
    ctx.restore();
    return;
  }

  const maxSpan = Math.hypot(map.xMax, map.yMax) * 1.15;
  for (let i = 0; i < eigen.vectors.length; i++) {
    const ev = eigen.vectors[i];
    const [vx, vy] = ev.dir;
    const color = ev.color;
    const glow = i === 0 ? COLORS.emeraldGlow : COLORS.amberGlow;

    // Glowing infinite span line
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = compact ? 1.5 : 1.85;
    ctx.globalAlpha = 0.72;
    ctx.setLineDash([6, 4]);
    ctx.shadowColor = glow;
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.moveTo(map.xToPx(-vx * maxSpan), map.yToPx(-vy * maxSpan));
    ctx.lineTo(map.xToPx(vx * maxSpan), map.yToPx(vy * maxSpan));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Small crisp eigen-scaling tick at λ·v along the span
    const lamClamped = clamp(ev.lambda, -2.9, 2.9);
    if (Math.abs(lamClamped) > 0.12) {
      drawVectorArrow(ctx, map, 0, 0, vx * lamClamped, vy * lamClamped, color, {
        lineWidth: compact ? 1.6 : 2.0,
        headLen: compact ? 6 : 7.5,
        alpha: 0.72,
      });
    }

    if (showLabels) {
      // Position λ tag along the side of the span opposite the basis handle cluster to avoid pill overlap
      const labelR = Math.min(2.25, Math.max(1.35, Math.min(map.xMax, map.yMax) * 0.8));
      const dotCluster = vx * (info.a + info.b) + vy * (info.c + info.d);
      const raySign = dotCluster > 0.25 ? -1 : 1;
      const lx = map.xToPx(raySign * vx * labelR);
      const ly = map.yToPx(raySign * vy * labelR);
      const tagText = `${ev.tag}=${fmtCompact(ev.lambda)}`;
      drawCanvasPill(ctx, map, lx, ly + (i === 0 ? 12 : -12), tagText, color, { compact: true, centered: true });
    }
  }

  ctx.restore();
}

function drawVectorArrow(ctx, map, x0, y0, x1, y1, color, opts = {}) {
  const { lineWidth = 2.6, headLen = 9, glowColor = null, alpha = 1, dashed = false } = opts;
  const p0x = map.xToPx(x0);
  const p0y = map.yToPx(y0);
  const p1x = map.xToPx(x1);
  const p1y = map.yToPx(y1);
  const dx = p1x - p0x;
  const dy = p1y - p0y;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;

  const angle = Math.atan2(dy, dx);
  const trim = Math.min(headLen * 0.75, len * 0.35);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
  }
  if (dashed) ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(p0x, p0y);
  ctx.lineTo(p1x - Math.cos(angle) * trim, p1y - Math.sin(angle) * trim);
  ctx.stroke();
  ctx.setLineDash([]);

  // Filled triangular arrowhead
  ctx.beginPath();
  ctx.moveTo(p1x, p1y);
  ctx.lineTo(p1x - headLen * Math.cos(angle - 0.42), p1y - headLen * Math.sin(angle - 0.42));
  ctx.lineTo(p1x - headLen * Math.cos(angle + 0.42), p1y - headLen * Math.sin(angle + 0.42));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBasisHandle(ctx, map, vx, vy, label, color, glowColor, opts = {}) {
  const { pulse = 0.5, isActive = false, compact = false } = opts;
  const px = map.xToPx(vx);
  const py = map.yToPx(vy);

  // Vector shaft + arrow
  drawVectorArrow(ctx, map, 0, 0, vx, vy, color, {
    lineWidth: isActive ? 3.4 : 2.8,
    headLen: compact ? 8.5 : 10,
    glowColor,
  });

  // Glowing touch grab handle at tip
  ctx.save();
  const baseR = compact ? 7.5 : 8.5;
  const ringR = baseR + 4.5 + pulse * 3.5 + (isActive ? 3.5 : 0);

  ctx.beginPath();
  ctx.arc(px, py, ringR, 0, TWO_PI);
  ctx.strokeStyle = color;
  ctx.globalAlpha = isActive ? 0.65 : 0.28 + 0.25 * (1 - pulse);
  ctx.lineWidth = isActive ? 1.8 : 1.25;
  ctx.stroke();

  ctx.globalAlpha = 0.22;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, py, baseR + 4, 0, TWO_PI);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(px, py, baseR, 0, TWO_PI);
  ctx.fillStyle = COLORS.bg;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = isActive ? 16 : 10;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Crisp inner dot
  ctx.beginPath();
  ctx.arc(px, py, 2.7, 0, TWO_PI);
  ctx.fillStyle = '#F8FAFC';
  ctx.fill();

  // Offset label pill next to handle
  const norm = Math.hypot(vx, vy) || 1;
  const offX = (vx / norm) * 20;
  const offY = -(vy / norm) * 18;
  drawCanvasPill(ctx, map, px + offX, py + offY, label, color, { compact: true, centered: true });
  ctx.restore();
}

function drawCanvasPill(ctx, map, anchorX, anchorY, text, accentColor, opts = {}) {
  const { compact = false, centered = false } = opts;
  ctx.save();
  ctx.font = `600 ${compact ? 9 : 10}px ${FONT_MONO}`;
  const tw = ctx.measureText(text).width;
  const padX = compact ? 5.5 : 7;
  const pillW = Math.ceil(tw + padX * 2 + 4);
  const pillH = compact ? 16 : 19;

  let x = centered ? anchorX - pillW / 2 : anchorX;
  let y = centered ? anchorY - pillH / 2 : anchorY;
  x = clamp(x, 5, Math.max(5, map.width - pillW - 5));
  y = clamp(y, 5, Math.max(5, map.height - pillH - 5));

  drawRoundedRect(ctx, x, y, pillW, pillH, 5);
  ctx.fillStyle = COLORS.pillBg;
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = accentColor;
  drawRoundedRect(ctx, x + 3, y + 3.5, 2.2, pillH - 7, 1.2);
  ctx.fill();

  ctx.fillStyle = '#F8FAFC';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 8, y + pillH / 2 + 0.5);
  ctx.restore();
}


// ---------------------------------------------------------------------------
// 1-Tap Matrix Presets for LinearTransform2DLab
// ---------------------------------------------------------------------------
const MATRIX_PRESETS = [
  { key: 'symmetric', label: 'Symmetric', a: 1.8, b: 0.7, c: 0.7, d: 1.1 },
  { key: 'shear', label: 'Shear', a: 1.0, b: 1.2, c: 0.0, d: 1.0 },
  { key: 'rot45', label: '45° Rot', a: 0.71, b: -0.71, c: 0.71, d: 0.71 },
  { key: 'rank1', label: 'Rank-1', a: 1.5, b: 0.75, c: 1.0, d: 0.5 },
  { key: 'mirror', label: 'Mirror', a: -1.2, b: 0.4, c: 0.3, d: 1.1 },
];

// ===========================================================================
// PART 1: LinearTransform2DLab (Interactive 2D Linear Transform & Eigen Lab)
// ===========================================================================
export class LinearTransform2DLab {
  constructor(containerOrOptions = {}, maybeOptions = {}) {
    const isElement =
      containerOrOptions &&
      typeof containerOrOptions === 'object' &&
      containerOrOptions.nodeType === 1;
    const autoMountContainer = isElement ? containerOrOptions : null;
    const options = isElement ? maybeOptions || {} : containerOrOptions || {};

    const {
      initialMatrix = null,
      lens = 'math',
      mechatronicsLens = lens === 'mechatronics',
      onChange = null,
      onInteract = null,
      onOpenQuiz = null,
    } = options;

    const init = Array.isArray(initialMatrix) && initialMatrix.length === 4
      ? { a: initialMatrix[0], b: initialMatrix[1], c: initialMatrix[2], d: initialMatrix[3] }
      : initialMatrix && typeof initialMatrix === 'object'
      ? initialMatrix
      : MATRIX_PRESETS[0];

    this.a = Number.isFinite(Number(init.a)) ? Number(init.a) : 1.8;
    this.b = Number.isFinite(Number(init.b)) ? Number(init.b) : 0.7;
    this.c = Number.isFinite(Number(init.c)) ? Number(init.c) : 0.7;
    this.d = Number.isFinite(Number(init.d)) ? Number(init.d) : 1.1;

    this.mechatronicsLens = Boolean(mechatronicsLens);
    this.onChange = typeof onChange === 'function' ? onChange : null;
    this.onInteract = typeof onInteract === 'function' ? onInteract : null;
    this.onOpenQuiz = typeof onOpenQuiz === 'function' ? onOpenQuiz : null;

    this._hasInteracted = false;
    this._activeHandle = null; // 'c1' | 'c2' | null
    this._keyboardHandle = 'c1';
    this._activePointerId = null;

    this._container = null;
    this._root = null;
    this._canvas = null;
    this._ctx = null;
    this._canvasWrap = null;
    this._size = { w: 0, h: 276 };

    this._presetButtons = new Map();
    this._els = {};

    this._resizeObserver = null;
    this._abortController = null;
    this._rafId = null;
    this._pulsePhase = 0;
    this._lastFrameTs = 0;
    this._lastTickMs = 0;
    this._lastSnapKey = '';
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

    // --- 1. Compact Header + 5 Presets + Live Telemetry Strip ---
    const topBar = document.createElement('div');
    topBar.className =
      'px-2.5 py-2 sm:px-3.5 sm:py-2.5 border-b border-slate-800/80 bg-[#0F131C]/90 flex flex-col gap-1.5 sm:gap-2';

    // Header row: lens title + ellipse legend pill
    const headerRow = document.createElement('div');
    headerRow.className = 'flex items-center justify-between gap-2 min-w-0';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'flex items-center gap-1.5 min-w-0';

    const dot = document.createElement('span');
    dot.className = 'w-2 h-2 rounded-full shrink-0 bg-cyan-400 shadow-[0_0_8px_#22D3EE]';

    const titleEl = document.createElement('span');
    titleEl.className = 'text-[11px] sm:text-xs font-semibold tracking-tight text-slate-100 truncate';

    titleWrap.append(dot, titleEl);

    const ellipseTagEl = document.createElement('span');
    ellipseTagEl.className =
      'hidden xs:inline-flex sm:inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-violet-500/10 border border-violet-400/35 text-violet-200 truncate max-w-[54%]';

    headerRow.append(titleWrap, ellipseTagEl);

    // Preset pills row (horizontally scrollable on mobile, zero overflow)
    const presetRow = document.createElement('div');
    presetRow.className = 'flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap sm:flex-wrap pb-0.5 sm:pb-0';
    this._presetButtons.clear();

    for (const preset of MATRIX_PRESETS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.presetKey = preset.key;
      btn.className =
        'el-la-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer';
      btn.textContent = preset.label;
      btn.addEventListener(
        'click',
        () => {
          safeSound('playTick');
          this.setMatrix(preset.a, preset.b, preset.c, preset.d);
          this._markInteracted();
        },
        { signal }
      );
      presetRow.appendChild(btn);
      this._presetButtons.set(preset.key, btn);
    }

    // Live compact telemetry pill strip (Matrix A, det, λ, rank/orientation)
    const telemetryRow = document.createElement('div');
    telemetryRow.className = 'flex flex-wrap items-center gap-1 sm:gap-1.5';

    const matrixPill = document.createElement('span');
    matrixPill.className =
      'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-slate-900/95 border border-slate-700/80 text-slate-100';

    const detPill = document.createElement('span');
    detPill.className =
      'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold border transition-colors';

    const eigenPill = document.createElement('span');
    eigenPill.className =
      'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-emerald-500/10 border border-emerald-400/40 text-emerald-200';

    const rankPill = document.createElement('span');
    rankPill.className =
      'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-colors';

    telemetryRow.append(matrixPill, detPill, eigenPill, rankPill);

    // Desktop-only Row: KaTeX Matrix + SVD & Legend
    const desktopRow = document.createElement('div');
    desktopRow.className = 'hidden sm:flex flex-wrap items-center justify-between gap-2 text-xs pt-0.5';

    const formulaEl = document.createElement('div');
    formulaEl.className = 'text-cyan-200/95 font-medium flex items-center gap-2';

    const legendEl = document.createElement('div');
    legendEl.className = 'text-[11px] text-slate-400 flex items-center gap-3';

    desktopRow.append(formulaEl, legendEl);

    topBar.append(headerRow, presetRow, telemetryRow, desktopRow);
    root.appendChild(topBar);

    // --- 2. Interactive High-DPI 2D Canvas ---
    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'relative w-full h-[272px] sm:h-[360px] bg-[#0B0D12] cursor-grab';
    canvasWrap.tabIndex = 0;
    canvasWrap.setAttribute(
      'aria-label',
      'Interactive 2D linear transformation canvas; drag cyan i-prime or amber j-prime handles, or use arrow keys'
    );

    const canvas = document.createElement('canvas');
    canvas.className = 'el-la-canvas h-full';
    canvas.style.touchAction = 'none';
    canvasWrap.appendChild(canvas);
    root.appendChild(canvasWrap);

    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._canvasWrap = canvasWrap;

    // --- 3. Compact Bottom Quiz CTA (when onOpenQuiz callback provided) ---
    let ctaBtn = null;
    if (this.onOpenQuiz) {
      const footer = document.createElement('div');
      footer.className =
        'px-2.5 py-2 sm:px-3.5 sm:py-2.5 border-t border-slate-800/80 bg-[#0E121B]/95 flex items-center justify-between gap-2';

      const footerNote = document.createElement('span');
      footerNote.className = 'hidden sm:inline text-[11px] text-slate-400';
      footerNote.textContent = 'Drag Cyan î\' & Amber ĵ\' handles to test eigenvectors & collapse.';

      ctaBtn = document.createElement('button');
      ctaBtn.type = 'button';
      ctaBtn.className =
        'el-la-pill w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-100 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(34,211,238,0.16)]';
      ctaBtn.textContent = 'Test Your Intuition: Visual Eigen Quiz →';
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

    this._els = {
      titleEl,
      ellipseTagEl,
      matrixPill,
      detPill,
      eigenPill,
      rankPill,
      formulaEl,
      legendEl,
      ctaBtn,
    };

    container.appendChild(root);

    this._bindPointerEvents(canvas, canvasWrap, signal);
    this._bindKeyboardEvents(canvasWrap, signal);

    this._syncUI();
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

  _getMapper(w, h) {
    const compact = w < 430;
    return createIsotropicMapper(w, h, compact ? 2.85 : 3.2);
  }

  _bindPointerEvents(canvas, wrap, signal) {
    const getLocalCoords = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return null;
      const map = this._getMapper(rect.width, rect.height);
      const lx = clientX - rect.left;
      const ly = clientY - rect.top;
      return { lx, ly, map };
    };

    canvas.addEventListener(
      'pointerdown',
      (e) => {
        const pt = getLocalCoords(e.clientX, e.clientY);
        if (!pt) return;
        const { lx, ly, map } = pt;

        const c1Px = map.xToPx(this.a);
        const c1Py = map.yToPx(this.c);
        const c2Px = map.xToPx(this.b);
        const c2Py = map.yToPx(this.d);

        const d1 = Math.hypot(lx - c1Px, ly - c1Py);
        const d2 = Math.hypot(lx - c2Px, ly - c2Py);
        const grabRadius = e.pointerType === 'touch' ? 38 : 34;

        let chosen = null;
        if (d1 <= grabRadius && d2 <= grabRadius) {
          chosen = d1 <= d2 ? 'c1' : 'c2';
        } else if (d1 <= grabRadius) {
          chosen = 'c1';
        } else if (d2 <= grabRadius) {
          chosen = 'c2';
        } else {
          // Generous fallback: allow grabbing nearest handle if user taps anywhere in canvas
          chosen = d1 <= d2 ? 'c1' : 'c2';
        }

        this._activeHandle = chosen;
        this._keyboardHandle = chosen;
        this._activePointerId = e.pointerId;
        wrap.classList.remove('cursor-grab');
        wrap.classList.add('cursor-grabbing');

        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {
          // Ignore synthetic pointer events
        }

        this._applyDraggedHandle(chosen, map.pxToX(lx), map.pxToY(ly), map);
      },
      { signal }
    );

    canvas.addEventListener(
      'pointermove',
      (e) => {
        if (!this._activeHandle || e.pointerId !== this._activePointerId) return;
        const pt = getLocalCoords(e.clientX, e.clientY);
        if (!pt) return;
        this._applyDraggedHandle(this._activeHandle, pt.map.pxToX(pt.lx), pt.map.pxToY(pt.ly), pt.map);
      },
      { signal }
    );

    const endDrag = (e) => {
      if (this._activePointerId === e.pointerId) {
        this._activeHandle = null;
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

  _bindKeyboardEvents(wrap, signal) {
    wrap.addEventListener(
      'keydown',
      (e) => {
        if (e.key === ' ') {
          e.preventDefault();
          this._keyboardHandle = this._keyboardHandle === 'c1' ? 'c2' : 'c1';
          safeSound('playTick');
          this._drawAll();
          return;
        }
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault();
        const step = e.shiftKey ? 0.25 : 0.1;
        let x = this._keyboardHandle === 'c1' ? this.a : this.b;
        let y = this._keyboardHandle === 'c1' ? this.c : this.d;
        if (e.key === 'ArrowLeft') x -= step;
        if (e.key === 'ArrowRight') x += step;
        if (e.key === 'ArrowUp') y += step;
        if (e.key === 'ArrowDown') y -= step;
        x = clamp(x, -3.25, 3.25);
        y = clamp(y, -2.65, 2.65);
        if (this._keyboardHandle === 'c1') {
          this.a = x;
          this.c = y;
        } else {
          this.b = x;
          this.d = y;
        }
        this._playThrottledTick();
        this._syncUI();
        this._drawAll();
        this._emitChange();
        this._markInteracted();
      },
      { signal }
    );
  }

  _snapCoord(v) {
    if (Math.abs(v) < 0.075) return 0;
    const q = Math.round(v * 4) / 4;
    if (Math.abs(v - q) < 0.065) return q;
    return v;
  }

  _playThrottledTick() {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this._lastTickMs > 72) {
      this._lastTickMs = now;
      safeSound('playTick');
    }
  }

  _applyDraggedHandle(handle, rawX, rawY, map) {
    const maxX = Math.min(3.35, Math.max(2.2, map.xMax - 0.22));
    const maxY = Math.min(3.0, Math.max(2.0, map.yMax - 0.22));
    const x = this._snapCoord(clamp(rawX, -maxX, maxX));
    const y = this._snapCoord(clamp(rawY, -maxY, maxY));

    const prevDet = this.a * this.d - this.b * this.c;

    if (handle === 'c1') {
      this.a = x;
      this.c = y;
    } else {
      this.b = x;
      this.d = y;
    }

    const nextDet = this.a * this.d - this.b * this.c;
    const snapKey = `${handle}:${Math.round(x * 4)},${Math.round(y * 4)}`;

    // Tactile snap audio on grid detent or determinant zero crossing
    const crossedZero =
      (prevDet > DET_EPS && nextDet <= DET_EPS) ||
      (prevDet < -DET_EPS && nextDet >= -DET_EPS) ||
      (Math.abs(prevDet) > DET_EPS && Math.abs(nextDet) <= DET_EPS);

    if (crossedZero) {
      safeSound('playSnap');
    } else if (snapKey !== this._lastSnapKey) {
      this._lastSnapKey = snapKey;
      this._playThrottledTick();
    }

    this._syncUI();
    this._drawAll();
    this._emitChange();
    this._markInteracted();
  }

  _markInteracted() {
    if (!this._hasInteracted) {
      this._hasInteracted = true;
      try {
        this.onInteract?.(this.getAnalysis());
      } catch (_) {
        // Ignore consumer errors
      }
    }
  }

  getAnalysis() {
    return analyzeMatrix2D(this.a, this.b, this.c, this.d);
  }

  _emitChange() {
    if (!this.onChange) return;
    try {
      this.onChange(this.getAnalysis());
    } catch (_) {
      // Ignore consumer errors
    }
  }

  setMatrix(aOrObj, b, c, d) {
    let na = this.a;
    let nb = this.b;
    let nc = this.c;
    let nd = this.d;

    if (Array.isArray(aOrObj) && aOrObj.length === 4) {
      [na, nb, nc, nd] = aOrObj.map(Number);
    } else if (aOrObj && typeof aOrObj === 'object') {
      na = Number(aOrObj.a);
      nb = Number(aOrObj.b);
      nc = Number(aOrObj.c);
      nd = Number(aOrObj.d);
    } else {
      na = Number(aOrObj);
      nb = Number(b);
      nc = Number(c);
      nd = Number(d);
    }

    if (![na, nb, nc, nd].every(Number.isFinite)) return;
    this.a = clamp(na, -3.5, 3.5);
    this.b = clamp(nb, -3.5, 3.5);
    this.c = clamp(nc, -3.5, 3.5);
    this.d = clamp(nd, -3.5, 3.5);

    this._syncUI();
    this._drawAll();
    this._emitChange();
  }

  setMechatronicsLens(bool) {
    const next = Boolean(bool);
    if (next === this.mechatronicsLens) return;
    this.mechatronicsLens = next;
    this._syncUI();
    this._drawAll();
  }

  setLens(lens) {
    this.setMechatronicsLens(lens === 'mechatronics');
  }

  _getMatchingPresetKey() {
    for (const p of MATRIX_PRESETS) {
      if (
        Math.abs(this.a - p.a) < 0.06 &&
        Math.abs(this.b - p.b) < 0.06 &&
        Math.abs(this.c - p.c) < 0.06 &&
        Math.abs(this.d - p.d) < 0.06
      ) {
        return p.key;
      }
    }
    return null;
  }

  _syncUI() {
    if (!this._root) return;
    const info = this.getAnalysis();
    const {
      titleEl,
      ellipseTagEl,
      matrixPill,
      detPill,
      eigenPill,
      rankPill,
      formulaEl,
      legendEl,
    } = this._els;

    // 1. Preset active styles
    const activeKey = this._getMatchingPresetKey();
    for (const [key, btn] of this._presetButtons.entries()) {
      const isAct = key === activeKey;
      if (isAct) {
        if (key === 'rank1') {
          btn.className =
            'el-la-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border cursor-pointer bg-amber-400/15 border-amber-400/70 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.22)]';
        } else if (key === 'mirror') {
          btn.className =
            'el-la-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border cursor-pointer bg-rose-500/15 border-rose-400/70 text-rose-200 shadow-[0_0_14px_rgba(251,113,133,0.22)]';
        } else {
          btn.className =
            'el-la-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border cursor-pointer bg-cyan-400/15 border-cyan-400/70 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.22)]';
        }
      } else {
        btn.className =
          'el-la-pill shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700';
      }
    }

    // 2. Lens-aware headers
    if (titleEl) {
      titleEl.textContent = this.mechatronicsLens
        ? '2-DOF Robot Jacobian J & Manipulability Ellipse'
        : "2D Linear Map A = [î'  ĵ']";
    }
    if (ellipseTagEl) {
      ellipseTagEl.textContent = this.mechatronicsLens
        ? 'Joint Velocity Circle → End-Effector Ellipsoid'
        : 'Unit Circle → SVD Ellipse';
    }

    // 3. Compact live telemetry pills
    const sym = this.mechatronicsLens ? 'J' : 'A';
    if (matrixPill) {
      matrixPill.innerHTML = `${sym}=[<span class="text-cyan-300">${fmtCompact(info.a)}</span> <span class="text-amber-300">${fmtCompact(info.b)}</span>; <span class="text-cyan-300">${fmtCompact(info.c)}</span> <span class="text-amber-300">${fmtCompact(info.d)}</span>]`;
    }

    if (detPill) {
      const detVal = Math.abs(info.det) < 0.005 ? 0 : info.det;
      detPill.textContent = `det = ${fmtNum(detVal, 2)}`;
      if (info.isSingular) {
        detPill.className =
          'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold border bg-amber-400/15 border-amber-400/65 text-amber-200';
      } else if (info.det > 0) {
        detPill.className =
          'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold border bg-emerald-400/15 border-emerald-400/55 text-emerald-300';
      } else {
        detPill.className =
          'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold border bg-rose-500/15 border-rose-400/60 text-rose-300';
      }
    }

    if (eigenPill) {
      if (info.eigen.type === 'complex') {
        eigenPill.textContent = `λ = ${fmtNum(info.eigen.alpha, 2)} ± ${fmtNum(info.eigen.beta, 2)}j`;
        eigenPill.className =
          'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border bg-violet-500/15 border-violet-400/50 text-violet-200';
      } else if (info.eigen.type === 'defective' || Math.abs(info.eigen.lambda1 - info.eigen.lambda2) < 0.02) {
        eigenPill.textContent = `λ = ${fmtNum(info.eigen.lambda1, 2)} (×2)`;
        eigenPill.className =
          'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border bg-emerald-500/10 border-emerald-400/45 text-emerald-200';
      } else {
        eigenPill.textContent = `λ = ${fmtNum(info.eigen.lambda1, 2)}, ${fmtNum(info.eigen.lambda2, 2)}`;
        eigenPill.className =
          'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border bg-emerald-500/10 border-emerald-400/45 text-emerald-200';
      }
    }

    if (rankPill) {
      if (info.rank === 0) {
        rankPill.textContent = 'rank 0 • Zero';
        rankPill.className =
          'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border bg-amber-400/15 border-amber-400/60 text-amber-200';
      } else if (info.rank === 1) {
        rankPill.textContent = this.mechatronicsLens ? 'rank 1 • Singularity' : 'rank 1 • Collapse';
        rankPill.className =
          'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border bg-amber-400/15 border-amber-400/60 text-amber-200';
      } else if (info.det < 0) {
        rankPill.textContent = 'rank 2 • Flip';
        rankPill.className =
          'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border bg-rose-500/15 border-rose-400/55 text-rose-200';
      } else {
        rankPill.textContent = 'rank 2 • +CCW';
        rankPill.className =
          'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border bg-slate-900/90 border-slate-700/80 text-slate-200';
      }
    }

    // 4. Desktop KaTeX formula & legend
    if (formulaEl) {
      const matTex = `${sym} = \\begin{bmatrix} ${fmtCompact(info.a)} & ${fmtCompact(info.b)} \\\\ ${fmtCompact(info.c)} & ${fmtCompact(info.d)} \\end{bmatrix}`;
      const svdTex = `\\sigma_1 = ${fmtNum(info.svd.sigma1, 2)},\\ \\sigma_2 = ${fmtNum(info.svd.sigma2, 2)}`;
      formulaEl.innerHTML = `
        <span>${formatKatex(matTex, false)}</span>
        <span class="text-slate-600">•</span>
        <span class="text-violet-300">${formatKatex(svdTex, false)}</span>
      `;
    }
    if (legendEl) {
      const c1Name = this.mechatronicsLens ? 'J₁' : "î'";
      const c2Name = this.mechatronicsLens ? 'J₂' : "ĵ'";
      const ellName = this.mechatronicsLens ? 'Manipulability' : 'SVD Ellipse';
      legendEl.innerHTML = `
        <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>${c1Name}</span>
        <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>${c2Name}</span>
        <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-violet-400 inline-block"></span>${ellName}</span>
        <span class="inline-flex items-center gap-1"><span class="w-3 h-0.5 border-t border-dashed border-emerald-400 inline-block"></span>Eigenvectors</span>
      `;
    }
  }

  _resizeAll() {
    if (!this._canvas || !this._canvasWrap) return;
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 3);
    const rect = this._canvasWrap.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;

    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    if (this._size.w !== w || this._size.h !== h || this._canvas.width !== Math.round(w * dpr)) {
      this._size = { w, h };
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

      if (this._size.w >= 20) {
        this._drawAll();
      }
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  _drawAll() {
    const ctx = this._ctx;
    const { w, h } = this._size;
    if (!ctx || w < 20 || h < 20) return;

    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 3);
    const pulse = 0.5 + 0.5 * Math.sin(this._pulsePhase);
    const compact = w < 430;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const map = this._getMapper(w, h);
    const info = this.getAnalysis();

    // 1. Reference Cartesian plane + dashed unit circle & unit square
    drawReferencePlane(ctx, map, { showLabels: true, showUnitRefs: true, compact });

    // 2. Live warped grid
    drawWarpedGrid(ctx, map, info, { range: 5, lineAlpha: 0.16, axisAlpha: 0.34 });

    // 3. Shaded unit square parallelogram & det area
    drawUnitParallelogram(ctx, map, info, {
      showAreaLabel: true,
      showOrientationArc: true,
      compact,
      pulse,
    });

    // 4. Live Unit Circle -> SVD Manipulability Ellipse
    drawSVDEllipse(ctx, map, info, {
      showSemiAxes: true,
      showLabels: !compact,
      compact,
    });

    // 5. Auto-computed real eigenvector span lines (or complex badge)
    drawEigenvectorSpans(ctx, map, info, {
      showLabels: true,
      compact,
      showComplexBadge: true,
      pulse,
    });

    // 6. Touch-draggable Cyan î' and Amber ĵ' basis handles
    const c1Label = this.mechatronicsLens
      ? `J₁(${fmtCompact(this.a)},${fmtCompact(this.c)})`
      : `î'(${fmtCompact(this.a)},${fmtCompact(this.c)})`;
    const c2Label = this.mechatronicsLens
      ? `J₂(${fmtCompact(this.b)},${fmtCompact(this.d)})`
      : `ĵ'(${fmtCompact(this.b)},${fmtCompact(this.d)})`;

    drawBasisHandle(ctx, map, this.a, this.c, c1Label, COLORS.cyan, COLORS.cyanGlow, {
      pulse,
      isActive: this._activeHandle === 'c1',
      compact,
    });
    drawBasisHandle(ctx, map, this.b, this.d, c2Label, COLORS.amber, COLORS.amberGlow, {
      pulse,
      isActive: this._activeHandle === 'c2',
      compact,
    });

    // Subtle origin anchor dot
    ctx.beginPath();
    ctx.arc(map.cx, map.cy, 3.2, 0, TWO_PI);
    ctx.fillStyle = '#F8FAFC';
    ctx.fill();

    // Gentle bottom-left drag hint until first interaction
    if (!this._hasInteracted) {
      const hintTxt = compact ? "Drag î' or ĵ' handles" : "Drag Cyan î' or Amber ĵ' handles anywhere";
      ctx.save();
      ctx.font = `600 ${compact ? 9 : 10}px ${FONT_SANS}`;
      const tw = ctx.measureText(hintTxt).width + 14;
      const hx = 8;
      const hy = h - 25;
      drawRoundedRect(ctx, hx, hy, tw, 18, 5);
      ctx.fillStyle = 'rgba(15, 19, 28, 0.88)';
      ctx.fill();
      ctx.strokeStyle = `rgba(34, 211, 238, ${(0.35 + 0.3 * pulse).toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#BAE6FD';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(hintTxt, hx + 7, hy + 9.5);
      ctx.restore();
    }
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
    this._presetButtons.clear();
    this._els = {};
    this._root = null;
  }
}


// ===========================================================================
// PART 2: LinAlgVisualQuizEngine (6 Brilliant.org-Style Visual Challenges)
// ===========================================================================
const LINALG_QUIZ_CHALLENGES = [
  {
    id: 'la-quiz-1',
    mode: 'columns',
    title: 'Read the Matrix Columns',
    targetFormulaMath: 'A = \\begin{bmatrix} 2 & 1 \\\\ 0 & 1 \\end{bmatrix}',
    targetFormulaMech: 'J = \\begin{bmatrix} 2 & 1 \\\\ 0 & 1 \\end{bmatrix}',
    targetMatrix: { a: 2, b: 1, c: 0, d: 1 },
    promptMath:
      'The columns of $A = \\begin{bmatrix} 2 & 1 \\\\ 0 & 1 \\end{bmatrix}$ tell where $\\hat{i}$ (Cyan) and $\\hat{j}$ (Amber) land. Which warped grid matches $A$?',
    promptMech:
      'A 2-DOF Jacobian $J = \\begin{bmatrix} 2 & 1 \\\\ 0 & 1 \\end{bmatrix}$ maps joint rates to velocity columns $\\mathbf{j}_1 = (2,0)$ and $\\mathbf{j}_2 = (1,1)$. Which workspace matches?',
    proofTextMath:
      'Column 1 stretches $\\hat{i}$ to $(2,0)$ along the x-axis, while Column 2 shears $\\hat{j}$ right to $(1,1)$ — forming a right-leaning parallelogram of area $\\det(A) = 2$.',
    proofTextMech:
      'Joint 1 drives pure horizontal velocity $(2,0)$ while Joint 2 tilts diagonally along $(1,1)$, producing a right-sheared velocity parallelogram with $\\det(J) = 2$.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        matrix: { a: 1, b: 0, c: 1, d: 2 },
        wrongHintMath:
          'Read columns, not rows! Here $\\hat{i}\'=(1,1)$ tilts upward while $\\hat{j}\'=(0,2)$ stretches vertically — that is $A^T$ with columns swapped.',
        wrongHintMech:
          'Check column 1: $\\mathbf{j}_1 = (2,0)$ must point strictly horizontally along $+x$, not diagonally upward.',
      },
      {
        letter: 'B',
        isCorrect: true,
        matrix: { a: 2, b: 1, c: 0, d: 1 },
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        matrix: { a: 2, b: -1, c: 0, d: 1 },
        wrongHintMath:
          'Watch the sign of the top-right entry! Here $\\hat{j}\'=(-1,1)$ leans left, whereas $b = +1$ leans $\\hat{j}\'$ to the right at $(+1, 1)$.',
        wrongHintMech:
          'Column 2 is $(+1, 1)$ in the first quadrant, whereas this grid tilts $\\mathbf{j}_2$ negatively to $(-1, 1)$.',
      },
    ],
  },
  {
    id: 'la-quiz-2',
    mode: 'eigenvector',
    title: 'Spot the Eigenvector',
    targetFormulaMath: 'A\\mathbf{v} = \\lambda\\mathbf{v} \\quad (A = \\begin{bmatrix} 1.7 & 1 \\\\ 0 & 0.9 \\end{bmatrix})',
    targetFormulaMech: 'J\\mathbf{v} = \\lambda\\mathbf{v} \\quad (\\text{Invariant Direction})',
    targetMatrix: { a: 1.7, b: 1.0, c: 0.0, d: 0.9 },
    promptMath:
      'Under the horizontal stretch-shear $A$ shown below, which candidate highlights a true eigenvector (where $A\\mathbf{v}$ stays strictly on $\\mathbf{v}$’s dashed span line)?',
    promptMech:
      'Under the linear map $J$ shown below, which input direction $\\mathbf{v}$ stays strictly aligned with its output $J\\mathbf{v}$ along the same dashed span?',
    proofTextMath:
      'Along the x-axis, $\\mathbf{v}=(1,0)$ maps to $A\\mathbf{v}=(1.7,0) = 1.7\\mathbf{v}$ — scaled without rotating off its dashed span line!',
    proofTextMech:
      'Because $\\mathbf{v}=(1,0)$ has zero vertical component, the shear leaves its direction unchanged and purely scales magnitude by $\\lambda_1 = 1.7$.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        matrix: { a: 1.7, b: 1.0, c: 0.0, d: 0.9 },
        testVec: [1.05, 0],
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        matrix: { a: 1.7, b: 1.0, c: 0.0, d: 0.9 },
        testVec: [0, 1.15],
        wrongHintMath:
          'Look at $A\\mathbf{v}$: the vertical vector gets sheared hard to the right off the y-axis span line, so $A\\mathbf{v}$ is NOT a scalar multiple of $\\mathbf{v}$.',
        wrongHintMech:
          'The shear pushes the vertical vector sideways off its dashed line — a true eigenvector never rotates away from its span.',
      },
      {
        letter: 'C',
        isCorrect: false,
        matrix: { a: 1.7, b: 1.0, c: 0.0, d: 0.9 },
        testVec: [0.8, 0.95],
        wrongHintMath:
          'Here $A\\mathbf{v}$ bends noticeably clockwise below the dashed span line — only vectors staying collinear with their own span are eigenvectors.',
        wrongHintMech:
          'Notice the angle gap between $\\mathbf{v}$ and $J\\mathbf{v}$: because $J\\mathbf{v}$ deflects downward off the dashed line, it is not an eigenvector.',
      },
    ],
  },
  {
    id: 'la-quiz-3',
    mode: 'collapse',
    title: 'Zero Det = Dimension Collapse',
    targetFormulaMath: '\\det(A) = 0 \\iff \\text{rank}(A) < 2',
    targetFormulaMech: '\\det(J) = 0 \\iff \\text{Kinematic Singularity}',
    targetMatrix: { a: 1.5, b: 0.75, c: 1.0, d: 0.5 },
    promptMath:
      'When $\\det(A) = 0$, the entire 2D plane squishes onto a 1D line with zero area. Which transformed space has $\\det(A) = 0$?',
    promptMech:
      'At a kinematic singularity ($\\det(J) = 0$), the robot loses a degree of freedom and its velocity space collapses to a 1D line. Which workspace is singular?',
    proofTextMath:
      'In Option C, $\\hat{i}\'=(1.5,1)$ and $\\hat{j}\'=(0.75,0.5)$ are linearly dependent ($\\hat{i}\'=2\\hat{j}\'$), collapsing all 2D area to a 1D line ($\\det(A) = 0$, $\\text{rank}=1$).',
    proofTextMech:
      'Both Jacobian columns align along the exact same line ($\\mathbf{j}_1 = 2\\mathbf{j}_2$), so the manipulability ellipse flattens to zero width — a rank-1 singularity!',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        matrix: { a: 1.4, b: 0.3, c: 0.2, d: 1.2 },
        wrongHintMath:
          'This transformation preserves a clear 2D shaded parallelogram ($\\det = 1.62 \\neq 0$), so both basis columns are independent.',
        wrongHintMech:
          'This workspace still spans 2 full dimensions with healthy positive manipulability area ($\\det(J) = 1.62 > 0$).',
      },
      {
        letter: 'B',
        isCorrect: false,
        matrix: { a: 0.9, b: -0.8, c: 0.8, d: 0.9 },
        wrongHintMath:
          'Rotating and scaling keeps $\\hat{i}\'$ and $\\hat{j}\'$ perpendicular with positive area ($\\det = 1.45 > 0$) — no dimension is lost.',
        wrongHintMech:
          'A rotated orthogonal frame has full rank 2 and non-zero determinant ($\\det = 1.45$) — far from any singularity.',
      },
      {
        letter: 'C',
        isCorrect: true,
        matrix: { a: 1.5, b: 0.75, c: 1.0, d: 0.5 },
        wrongHintMath: '',
        wrongHintMech: '',
      },
    ],
  },
  {
    id: 'la-quiz-4',
    mode: 'flip',
    title: 'Negative Det = Orientation Flip',
    targetFormulaMath: '\\det(A) < 0 \\iff \\text{Orientation Reversed}',
    targetFormulaMech: '\\det(J) < 0 \\iff \\text{Handedness Flipped}',
    targetMatrix: { a: -1.2, b: 0.4, c: 0.3, d: 1.1 },
    promptMath:
      'A negative determinant flips space like a mirror, reversing the sweep from $\\hat{i}\'$ (Cyan) to $\\hat{j}\'$ (Amber) from CCW to CW. Which map has $\\det(A) < 0$?',
    promptMech:
      'A negative Jacobian determinant reverses right-handed frame orientation (CW sweep from $\\mathbf{j}_1$ to $\\mathbf{j}_2$). Which transformation flips handedness?',
    proofTextMath:
      'In Option B, $\\hat{i}\'$ points left while $\\hat{j}\'$ points up, so sweeping $\\hat{i}\' \\to \\hat{j}\'$ turns clockwise — mirroring space with $\\det(A) = -1.44 < 0$.',
    proofTextMech:
      'Swapping the relative cyclic order of $\\mathbf{j}_1$ (Cyan) and $\\mathbf{j}_2$ (Amber) reverses orientation to clockwise, yielding $\\det(J) = -1.44 < 0$.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        matrix: { a: 0.6, b: -1.1, c: 1.1, d: 0.6 },
        wrongHintMath:
          'A rotation turns both vectors together — trace from Cyan $\\hat{i}\'$ to Amber $\\hat{j}\'$ and you still sweep counterclockwise ($\\det = +1.57 > 0$).',
        wrongHintMech:
          'Pure rotation + scaling preserves right-handed CCW order ($\\det = +1.57 > 0$). Look for a mirror flip where $\\mathbf{j}_1 \\to \\mathbf{j}_2$ runs clockwise.',
      },
      {
        letter: 'B',
        isCorrect: true,
        matrix: { a: -1.2, b: 0.4, c: 0.3, d: 1.1 },
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'C',
        isCorrect: false,
        matrix: { a: 1.5, b: 0.8, c: 0.2, d: 1.1 },
        wrongHintMath:
          'Amber $\\hat{j}\'$ still sits counterclockwise from Cyan $\\hat{i}\'$, so orientation is preserved ($\\det = +1.49 > 0$).',
        wrongHintMech:
          'This shear stretches the frame without crossing the vectors over each other — handedness stays positive ($\\det = +1.49$).',
      },
    ],
  },
  {
    id: 'la-quiz-5',
    mode: 'rotation',
    title: 'Pure Rotation: Complex Eigenvalues',
    targetFormulaMath: '\\lambda = e^{\\pm i\\theta} = \\cos\\theta \\pm i\\sin\\theta',
    targetFormulaMech: '\\lambda = e^{\\pm i\\theta} \\quad (\\text{Zero Real Spans})',
    targetMatrix: { a: 0.5, b: -0.866, c: 0.866, d: 0.5 },
    promptMath:
      'Which 2D transformation has purely complex eigenvalues $\\lambda = e^{\\pm i\\theta}$ — rotating every nonzero vector off its own span line?',
    promptMech:
      'Which 2D linear operator has purely complex eigenvalues with zero real invariant axes, rotating every state vector continuously?',
    proofTextMath:
      'A $60^\\circ$ CCW rotation $R(60^\\circ)$ maps the unit circle onto itself and turns every nonzero vector by $60^\\circ$ — leaving zero real eigenvectors ($\\lambda = 0.5 \\pm 0.87j$).',
    proofTextMech:
      'Pure $60^\\circ$ rotation turns every velocity vector off its starting axis, producing complex conjugate eigenvalues $\\lambda = 0.5 \\pm 0.87j$ on the unit circle.',
    options: [
      {
        letter: 'A',
        isCorrect: false,
        matrix: { a: 1.7, b: 0, c: 0, d: 0.6 },
        wrongHintMath:
          'An axis-aligned stretch has two obvious real eigenvectors: the x-axis ($\\lambda_1=1.7$) and y-axis ($\\lambda_2=0.6$) never rotate!',
        wrongHintMech:
          'Diagonal scaling preserves both coordinate axes as real invariant directions ($\\lambda = 1.7, 0.6$).',
      },
      {
        letter: 'B',
        isCorrect: false,
        matrix: { a: 1.0, b: 1.15, c: 0, d: 1.0 },
        wrongHintMath:
          'A horizontal shear still keeps the entire x-axis fixed as a real eigenvector ($\\lambda = 1$). Pure rotation leaves NO real line fixed.',
        wrongHintMech:
          'Horizontal shear leaves vectors along the x-axis unrotated ($\\lambda = 1$). Look for a map that rotates every vector.',
      },
      {
        letter: 'C',
        isCorrect: true,
        matrix: { a: 0.5, b: -0.866, c: 0.866, d: 0.5 },
        wrongHintMath: '',
        wrongHintMech: '',
      },
    ],
  },
  {
    id: 'la-quiz-6',
    mode: 'symmetric',
    title: 'Symmetric = Orthogonal Axes',
    targetFormulaMath: 'A = A^T \\implies \\mathbf{v}_1 \\perp \\mathbf{v}_2\\ (90^\\circ)',
    targetFormulaMech: 'K = K^T \\implies \\text{Orthogonal Principal Axes}',
    targetMatrix: { a: 1.75, b: 0.65, c: 0.65, d: 1.05 },
    promptMath:
      'By the Spectral Theorem, a symmetric matrix ($A = A^T$) maps the unit circle to an ellipse whose eigenvectors (Emerald & Gold) meet at exact $90^\\circ$. Which diagram is symmetric?',
    promptMech:
      'Symmetric stiffness/inertia matrices ($K = K^T$) always have strictly perpendicular ($90^\\circ$) principal eigen-axes aligned with the ellipse. Which diagram matches?',
    proofTextMath:
      'In Option A ($b=c=0.65$), the Emerald and Gold eigenvector spans cross at an exact $90^\\circ$ right angle and align perfectly with the Violet ellipse’s major & minor axes!',
    proofTextMech:
      'Option A is symmetric, guaranteeing perpendicular ($90^\\circ$) principal axes that coincide directly with the SVD manipulability ellipse semi-axes.',
    options: [
      {
        letter: 'A',
        isCorrect: true,
        matrix: { a: 1.75, b: 0.65, c: 0.65, d: 1.05 },
        wrongHintMath: '',
        wrongHintMech: '',
      },
      {
        letter: 'B',
        isCorrect: false,
        matrix: { a: 1.6, b: 1.1, c: 0, d: 0.7 },
        wrongHintMath:
          'Notice the sharp oblique angle (~$39^\\circ$) between the Emerald and Gold eigenvector lines! Non-symmetric matrices have skewed, non-perpendicular eigenvectors.',
        wrongHintMech:
          'Those two eigen-axes cross at an acute ~$39^\\circ$ angle rather than $90^\\circ$ — a dead giveaway of an asymmetric matrix.',
      },
      {
        letter: 'C',
        isCorrect: false,
        matrix: { a: 1.5, b: 0, c: 1.2, d: 0.7 },
        wrongHintMath:
          'Look closely at the origin: the Emerald and Gold eigenvector lines meet at an acute ~$34^\\circ$ angle and miss the ellipse’s principal axes.',
        wrongHintMech:
          'Non-orthogonal eigen-axes (~$34^\\circ$ apart) prove $A \\neq A^T$. Symmetric operators always separate eigenvectors by a crisp $90^\\circ$.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Quiz Canvas Renderers (Crisp, Unmistakable at Mobile 3-Column Widths!)
// ---------------------------------------------------------------------------
function drawQuizTargetCanvas(ctx, w, h, ch, pulse, mechatronicsLens) {
  const compact = w < 430;
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, 'rgba(30, 41, 59, 0.24)');
  bgGrad.addColorStop(1, 'rgba(11, 13, 18, 0.05)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  if (ch.mode === 'columns') {
    // Left: standard unit basis; Right: color-coded target column readout
    const leftW = Math.floor(w * 0.44);
    const mapL = createIsotropicMapper(leftW, h, 1.85);
    drawReferencePlane(ctx, mapL, { showLabels: false, showUnitRefs: true, compact: true });
    drawVectorArrow(ctx, mapL, 0, 0, 1, 0, COLORS.cyan, { lineWidth: 2.3, headLen: 7, glowColor: COLORS.cyanGlow });
    drawVectorArrow(ctx, mapL, 0, 0, 0, 1, COLORS.amber, { lineWidth: 2.3, headLen: 7, glowColor: COLORS.amberGlow });
    drawCanvasPill(ctx, mapL, mapL.xToPx(1), mapL.yToPx(-0.45), 'î(1,0)', COLORS.cyan, { compact: true, centered: true });
    drawCanvasPill(ctx, mapL, mapL.xToPx(-0.48), mapL.yToPx(1.05), 'ĵ(0,1)', COLORS.amber, { compact: true, centered: true });

    // Divider arrow
    const midX = leftW + 14;
    const midY = h * 0.5;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(midX - 8, midY);
    ctx.lineTo(midX + 12, midY);
    ctx.lineTo(midX + 7, midY - 4);
    ctx.moveTo(midX + 12, midY);
    ctx.lineTo(midX + 7, midY + 4);
    ctx.stroke();

    // Right: crisp visual matrix column key
    const rx = midX + 24;
    const sym = mechatronicsLens ? 'J' : 'A';
    ctx.font = `700 ${compact ? 11 : 13}px ${FONT_MONO}`;
    ctx.fillStyle = '#E2E8F0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${sym} =`, rx, midY);

    const bx = rx + (compact ? 32 : 38);
    const bh = compact ? 52 : 66;
    const bw = compact ? 64 : 78;
    const by = midY - bh / 2;

    // Matrix brackets
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(bx + 7, by);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx + 7, by + bh);
    ctx.moveTo(bx + bw - 7, by);
    ctx.lineTo(bx + bw, by);
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx + bw - 7, by + bh);
    ctx.stroke();

    // Column 1 (Cyan) and Column 2 (Amber)
    ctx.textAlign = 'center';
    ctx.font = `700 ${compact ? 14 : 16}px ${FONT_MONO}`;
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText('2', bx + bw * 0.3, by + bh * 0.3);
    ctx.fillText('0', bx + bw * 0.3, by + bh * 0.72);
    ctx.fillStyle = COLORS.amberLight;
    ctx.fillText('1', bx + bw * 0.72, by + bh * 0.3);
    ctx.fillText('1', bx + bw * 0.72, by + bh * 0.72);

    // Column caption below/beside
    const infoX = bx + bw + (compact ? 10 : 18);
    if (infoX + 55 < w) {
      ctx.textAlign = 'left';
      ctx.font = `600 ${compact ? 10 : 11}px ${FONT_MONO}`;
      ctx.fillStyle = COLORS.cyan;
      ctx.fillText(mechatronicsLens ? 'j₁=(2,0)' : "î'=(2,0)", infoX, midY - 12);
      ctx.fillStyle = COLORS.amberLight;
      ctx.fillText(mechatronicsLens ? 'j₂=(1,1)' : "ĵ'=(1,1)", infoX, midY + 12);
    }
    return;
  }

  if (ch.mode === 'eigenvector') {
    // Show the warped stretch-shear grid directly in target canvas
    const map = createIsotropicMapper(w, h, 2.2);
    const info = analyzeMatrix2D(ch.targetMatrix.a, ch.targetMatrix.b, ch.targetMatrix.c, ch.targetMatrix.d);
    drawReferencePlane(ctx, map, { showLabels: false, showUnitRefs: true, compact: true });
    drawWarpedGrid(ctx, map, info, { range: 4, lineAlpha: 0.2, axisAlpha: 0.38 });
    drawUnitParallelogram(ctx, map, info, { showAreaLabel: false, showOrientationArc: false, compact: true });
    drawVectorArrow(ctx, map, 0, 0, info.a, info.c, COLORS.cyan, { lineWidth: 2.3, headLen: 7.5, glowColor: COLORS.cyanGlow });
    drawVectorArrow(ctx, map, 0, 0, info.b, info.d, COLORS.amber, { lineWidth: 2.3, headLen: 7.5, glowColor: COLORS.amberGlow });
    drawCanvasPill(ctx, map, w - 68, 16, 'Find Av = λv', COLORS.emerald, { compact: true, centered: true });
    return;
  }

  if (ch.mode === 'collapse') {
    // Schematic: 2D unit square (Area = 1) -> 1D glowing line (Area = 0)
    const leftW = Math.floor(w * 0.45);
    const mapL = createIsotropicMapper(leftW, h, 1.9);
    drawReferencePlane(ctx, mapL, { showLabels: false, showUnitRefs: false, compact: true });
    ctx.fillStyle = 'rgba(52, 211, 153, 0.2)';
    ctx.strokeStyle = COLORS.emerald;
    ctx.lineWidth = 1.4;
    ctx.fillRect(mapL.xToPx(0), mapL.yToPx(1), mapL.scale, mapL.scale);
    ctx.strokeRect(mapL.xToPx(0), mapL.yToPx(1), mapL.scale, mapL.scale);
    drawCanvasPill(ctx, mapL, mapL.cx, h - 14, '2D Area = 1', COLORS.emerald, { compact: true, centered: true });

    const midX = w * 0.5;
    const midY = h * 0.5;
    ctx.strokeStyle = COLORS.amberLight;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(midX - 12, midY);
    ctx.lineTo(midX + 12, midY);
    ctx.lineTo(midX + 6, midY - 4.5);
    ctx.moveTo(midX + 12, midY);
    ctx.lineTo(midX + 6, midY + 4.5);
    ctx.stroke();

    // Right: collapsed 1D glowing Amber line
    ctx.save();
    ctx.translate(Math.floor(w * 0.55), 0);
    const rightW = w - Math.floor(w * 0.55);
    const mapR = createIsotropicMapper(rightW, h, 1.9);
    drawReferencePlane(ctx, mapR, { showLabels: false, showUnitRefs: false, compact: true });
    ctx.strokeStyle = COLORS.amber;
    ctx.lineWidth = 3 + pulse * 1.2;
    ctx.shadowColor = COLORS.amberGlow;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(mapR.xToPx(-1.9), mapR.yToPx(-1.1));
    ctx.lineTo(mapR.xToPx(1.9), mapR.yToPx(1.1));
    ctx.stroke();
    ctx.shadowBlur = 0;
    drawCanvasPill(ctx, mapR, mapR.cx, h - 14, '1D Collapse (det=0)', COLORS.amber, { compact: true, centered: true });
    ctx.restore();
    return;
  }

  if (ch.mode === 'flip') {
    // Left: Standard CCW (+det); Right: Mirrored CW (-det)
    const half = Math.floor(w * 0.5);
    const mapL = createIsotropicMapper(half, h, 1.85);
    drawReferencePlane(ctx, mapL, { showLabels: false, showUnitRefs: false, compact: true });
    drawUnitParallelogram(ctx, mapL, analyzeMatrix2D(1.1, 0, 0, 1.1), {
      showAreaLabel: false,
      showOrientationArc: true,
      compact: true,
    });
    drawVectorArrow(ctx, mapL, 0, 0, 1.1, 0, COLORS.cyan, { lineWidth: 2.2, headLen: 7 });
    drawVectorArrow(ctx, mapL, 0, 0, 0, 1.1, COLORS.amber, { lineWidth: 2.2, headLen: 7 });
    drawCanvasPill(ctx, mapL, mapL.cx, h - 14, '+CCW (det > 0)', COLORS.emerald, { compact: true, centered: true });

    ctx.save();
    ctx.translate(half, 0);
    const mapR = createIsotropicMapper(w - half, h, 1.85);
    drawReferencePlane(ctx, mapR, { showLabels: false, showUnitRefs: false, compact: true });
    drawUnitParallelogram(ctx, mapR, analyzeMatrix2D(-1.1, 0, 0, 1.1), {
      showAreaLabel: false,
      showOrientationArc: true,
      compact: true,
    });
    drawVectorArrow(ctx, mapR, 0, 0, -1.1, 0, COLORS.cyan, { lineWidth: 2.2, headLen: 7 });
    drawVectorArrow(ctx, mapR, 0, 0, 0, 1.1, COLORS.amber, { lineWidth: 2.2, headLen: 7 });
    drawCanvasPill(ctx, mapR, mapR.cx, h - 14, 'CW Flip (det < 0)', COLORS.coral, { compact: true, centered: true });
    ctx.restore();
    return;
  }

  if (ch.mode === 'rotation') {
    // Unit circle + conjugate complex eigenvalues e^(±iθ) + rotation arc
    const map = createIsotropicMapper(w, h, 1.75);
    drawReferencePlane(ctx, map, { showLabels: false, showUnitRefs: true, compact: true });
    const r = map.scale;
    ctx.strokeStyle = COLORS.violet;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.violetGlow;
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.arc(map.cx, map.cy, r, 0, TWO_PI);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Conjugate eigenvalue dots at 60° and -60°
    for (const sgn of [1, -1]) {
      const px = map.xToPx(0.5);
      const py = map.yToPx(sgn * 0.866);
      ctx.beginPath();
      ctx.arc(px, py, 4.5 + pulse * 1.5, 0, TWO_PI);
      ctx.fillStyle = COLORS.cyan;
      ctx.shadowColor = COLORS.cyanGlow;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    drawCanvasPill(ctx, map, map.xToPx(1.55), map.yToPx(0.75), 'λ = cosθ ± i·sinθ', COLORS.violet, {
      compact: true,
      centered: true,
    });
    drawCanvasPill(ctx, map, map.xToPx(-1.55), map.yToPx(-0.65), 'No real span!', COLORS.cyan, {
      compact: true,
      centered: true,
    });
    return;
  }

  // mode === 'symmetric': ellipse + glowing 90° orthogonal eigen-axes
  const map = createIsotropicMapper(w, h, 2.2);
  const info = analyzeMatrix2D(1.65, 0.55, 0.55, 1.0);
  drawReferencePlane(ctx, map, { showLabels: false, showUnitRefs: true, compact: true });
  drawSVDEllipse(ctx, map, info, { showSemiAxes: false, showLabels: false, compact: true });
  drawEigenvectorSpans(ctx, map, info, { showLabels: false, compact: true, showComplexBadge: false, pulse });
  drawRightAngleSymbol(ctx, map, info.eigen.vectors[0].dir, info.eigen.vectors[1].dir, 0.34, COLORS.emerald);
  drawCanvasPill(ctx, map, w - 62, 16, 'v₁ ⊥ v₂ (90°)', COLORS.emerald, { compact: true, centered: true });
}

function drawRightAngleSymbol(ctx, map, d1, d2, sizeUnits, color) {
  const p1 = [d1[0] * sizeUnits, d1[1] * sizeUnits];
  const p2 = [d2[0] * sizeUnits, d2[1] * sizeUnits];
  const pCorner = [p1[0] + p2[0], p1[1] + p2[1]];
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.shadowColor = COLORS.emeraldGlow;
  ctx.shadowBlur = 7;
  ctx.beginPath();
  ctx.moveTo(map.xToPx(p1[0]), map.yToPx(p1[1]));
  ctx.lineTo(map.xToPx(pCorner[0]), map.yToPx(pCorner[1]));
  ctx.lineTo(map.xToPx(p2[0]), map.yToPx(p2[1]));
  ctx.stroke();
  ctx.restore();
}

function drawQuizOptionCanvas(ctx, w, h, ch, opt, isSolvedCorrect, pulse) {
  const m = opt.matrix;
  const info = analyzeMatrix2D(m.a, m.b, m.c, m.d);
  const halfExtent = ch.mode === 'rotation' ? 2.15 : ch.mode === 'columns' ? 2.5 : 2.35;
  const map = createIsotropicMapper(w, h, halfExtent);

  drawReferencePlane(ctx, map, { showLabels: false, showUnitRefs: true, compact: true });

  if (ch.mode === 'columns' || ch.mode === 'collapse' || ch.mode === 'flip') {
    drawWarpedGrid(ctx, map, info, { range: 4, lineAlpha: 0.19, axisAlpha: 0.36 });
    drawUnitParallelogram(ctx, map, info, {
      showAreaLabel: false,
      showOrientationArc: ch.mode === 'flip' || isSolvedCorrect,
      compact: true,
      pulse,
    });
    drawVectorArrow(ctx, map, 0, 0, m.a, m.c, COLORS.cyan, {
      lineWidth: 2.2,
      headLen: 6.5,
      glowColor: COLORS.cyanGlow,
    });
    drawVectorArrow(ctx, map, 0, 0, m.b, m.d, COLORS.amber, {
      lineWidth: 2.2,
      headLen: 6.5,
      glowColor: COLORS.amberGlow,
    });

    // Geometric proof overlay when solved!
    if (isSolvedCorrect) {
      if (ch.mode === 'columns') {
        drawCanvasPill(ctx, map, map.cx, h - 13, 'det = 2', COLORS.emerald, { compact: true, centered: true });
      } else if (ch.mode === 'collapse') {
        drawCanvasPill(ctx, map, map.cx, h - 13, 'Area = 0', COLORS.amber, { compact: true, centered: true });
      } else if (ch.mode === 'flip') {
        drawCanvasPill(ctx, map, map.cx, h - 13, 'CW • det<0', COLORS.coral, { compact: true, centered: true });
      }
    }
    return;
  }

  if (ch.mode === 'eigenvector') {
    drawWarpedGrid(ctx, map, info, { range: 4, lineAlpha: 0.12, axisAlpha: 0.24 });
    const [vx, vy] = opt.testVec;
    const [avx, avy] = applyMat2(m, vx, vy);
    const dir = normalize2(vx, vy);

    // Dashed span line of candidate vector v
    if (dir) {
      const span = 3.2;
      ctx.save();
      ctx.strokeStyle = isSolvedCorrect ? COLORS.emerald : 'rgba(226, 232, 240, 0.58)';
      ctx.lineWidth = isSolvedCorrect ? 1.9 : 1.3;
      ctx.setLineDash([4, 3]);
      if (isSolvedCorrect) {
        ctx.shadowColor = COLORS.emeraldGlow;
        ctx.shadowBlur = 9;
      }
      ctx.beginPath();
      ctx.moveTo(map.xToPx(-dir[0] * span), map.yToPx(-dir[1] * span));
      ctx.lineTo(map.xToPx(dir[0] * span), map.yToPx(dir[1] * span));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Transformed image Av (Emerald/Violet) and original v (Cyan)
    drawVectorArrow(ctx, map, 0, 0, avx, avy, isSolvedCorrect ? COLORS.emerald : COLORS.violet, {
      lineWidth: 2.5,
      headLen: 7,
      glowColor: isSolvedCorrect ? COLORS.emeraldGlow : COLORS.violetGlow,
    });
    drawVectorArrow(ctx, map, 0, 0, vx, vy, COLORS.cyan, {
      lineWidth: 2.2,
      headLen: 6.5,
    });

    if (isSolvedCorrect) {
      drawCanvasPill(ctx, map, map.cx, h - 13, 'Av = 1.7v', COLORS.emerald, { compact: true, centered: true });
    }
    return;
  }

  if (ch.mode === 'rotation') {
    drawWarpedGrid(ctx, map, info, { range: 4, lineAlpha: 0.16, axisAlpha: 0.34 });
    drawSVDEllipse(ctx, map, info, { showSemiAxes: false, showLabels: false, compact: true });
    drawVectorArrow(ctx, map, 0, 0, m.a, m.c, COLORS.cyan, { lineWidth: 2.1, headLen: 6.5 });
    drawVectorArrow(ctx, map, 0, 0, m.b, m.d, COLORS.amber, { lineWidth: 2.1, headLen: 6.5 });

    // Show sample rotation arc on pure rotation when solved
    if (isSolvedCorrect) {
      const rArc = map.scale * 0.62;
      ctx.save();
      ctx.strokeStyle = COLORS.emerald;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = COLORS.emeraldGlow;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(map.cx, map.cy, rArc, 0, -Math.PI / 3, true);
      ctx.stroke();
      ctx.restore();
      drawCanvasPill(ctx, map, map.cx, h - 13, '60° • Complex λ', COLORS.emerald, { compact: true, centered: true });
    }
    return;
  }

  // mode === 'symmetric': Violet SVD ellipse + Emerald & Gold real eigenvector spans
  drawSVDEllipse(ctx, map, info, { showSemiAxes: false, showLabels: false, compact: true });
  drawEigenvectorSpans(ctx, map, info, {
    showLabels: false,
    compact: true,
    showComplexBadge: false,
    pulse,
  });

  if (isSolvedCorrect && info.eigen.vectors.length === 2) {
    drawRightAngleSymbol(ctx, map, info.eigen.vectors[0].dir, info.eigen.vectors[1].dir, 0.38, COLORS.emerald);
    drawCanvasPill(ctx, map, map.cx, h - 13, '90° • A = Aᵀ', COLORS.emerald, { compact: true, centered: true });
  }
}


export class LinAlgVisualQuizEngine {
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

    this._challenges = LINALG_QUIZ_CHALLENGES;
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

    // --- 1. Compact Header & 1–6 Pill Stepper ---
    const header = document.createElement('div');
    header.className =
      'px-3 py-2 sm:px-4 sm:py-2.5 border-b border-slate-800/80 bg-[#0F131C]/90 flex flex-wrap items-center justify-between gap-2';

    const titleBlock = document.createElement('div');
    titleBlock.className = 'flex items-center gap-2 min-w-0';
    titleBlock.innerHTML = `
      <span class="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider bg-cyan-500/15 border border-cyan-400/35 text-cyan-300">
        Visual Eigen Quiz
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
        'el-la-pill w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[11px] sm:text-xs font-mono font-semibold flex items-center justify-center border cursor-pointer ' +
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

    // --- 2. Concise Prompt + Compact Target Visualization Canvas ---
    const body = document.createElement('div');
    body.className = 'p-2.5 sm:p-4 flex flex-col gap-2 sm:gap-3.5';

    const promptBox = document.createElement('div');
    promptBox.className = 'flex flex-col gap-1.5 sm:gap-2';

    const promptText = document.createElement('p');
    promptText.className = 'text-xs sm:text-[14px] leading-snug sm:leading-relaxed text-slate-200';
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
      <span class="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-cyan-200 shrink-0">
        <span class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE]"></span>
        ${this.mechatronicsLens ? 'Target Jacobian Cue' : 'Target Geometry'}
      </span>
      <span class="text-[10px] sm:text-xs text-slate-200 truncate">${formatKatex(targetFormula, false)}</span>
    `;
    targetFrame.appendChild(targetTopBar);

    const targetCanvasWrap = document.createElement('div');
    targetCanvasWrap.className = 'relative w-full h-[112px] sm:h-[168px]';

    const targetCanvas = document.createElement('canvas');
    targetCanvas.className = 'el-la-canvas h-full';
    targetCanvasWrap.appendChild(targetCanvas);
    targetFrame.appendChild(targetCanvasWrap);

    this._targetCanvas = targetCanvas;
    this._targetCtx = targetCanvas.getContext('2d');
    this._targetWrap = targetCanvasWrap;

    promptBox.appendChild(targetFrame);
    body.appendChild(promptBox);

    // --- 3. 3-Column Side-by-Side Candidate Canvases (Mobile Zero-Scroll) ---
    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'grid grid-cols-3 gap-1.5 sm:gap-3';

    ch.options.forEach((opt) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className =
        'el-laq-card text-left rounded-xl border border-slate-800/90 bg-[#0F131C]/80 overflow-hidden flex flex-col focus:outline-none focus:ring-2 focus:ring-cyan-400/50';

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

      cardHeader.innerHTML = `
        <span class="inline-flex items-center gap-1.5">
          <span class="w-5 h-5 rounded-md text-[11px] font-mono font-bold border flex items-center justify-center ${badgeColor}">
            ${opt.letter}
          </span>
          <span class="hidden sm:inline text-xs font-medium text-slate-300">Option ${opt.letter}</span>
        </span>
        ${rightBadge}
      `;
      card.appendChild(cardHeader);

      const canvasWrap = document.createElement('div');
      canvasWrap.className = 'relative w-full bg-[#0B0D12] h-[96px] sm:h-[146px]';

      const canvas = document.createElement('canvas');
      canvas.className = 'el-la-canvas h-full';
      canvasWrap.appendChild(canvas);
      card.appendChild(canvasWrap);

      card.addEventListener('click', () => this._handleOptionClick(opt), { signal });

      optionsGrid.appendChild(card);
      this._optionCards.push({ card, canvasWrap, opt });
      this._optionCanvases.push(canvas);
      this._optionCtxs.push(canvas.getContext('2d'));
    });

    body.appendChild(optionsGrid);

    // --- 4. Feedback Banner (Geometric Proof OR Targeted Hint) ---
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
          item.card.classList.remove('la-shake-gentle');
          void item.card.offsetWidth;
          item.card.classList.add('la-shake-gentle');
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
      'rounded-xl border border-emerald-400/45 bg-emerald-500/10 p-2.5 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3';

    const left = document.createElement('div');
    left.className = 'flex flex-col gap-0.5 sm:gap-1';
    left.innerHTML = `
      <div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
        <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-400/20 border border-emerald-400/60 text-[10px]">✓</span>
        Geometric Proof Unlocked
      </div>
      <p class="text-xs sm:text-[13px] leading-snug sm:leading-relaxed text-slate-200">
        ${formatInlineMath(proofText)}
      </p>
    `;

    const actionWrap = document.createElement('div');
    actionWrap.className = 'shrink-0 flex items-center gap-2';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className =
      'el-la-pill px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-semibold bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-400/60 text-emerald-100 cursor-pointer whitespace-nowrap';

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
    box.className = 'rounded-xl border border-rose-400/40 bg-rose-500/10 p-2.5 sm:p-3 flex items-start gap-2';
    box.innerHTML = `
      <span class="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-rose-400/20 border border-rose-400/60 text-rose-300 text-xs font-bold flex items-center justify-center">!</span>
      <div class="text-xs sm:text-[13px] leading-snug sm:leading-relaxed text-rose-100/95">
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
      if (!canvas || !wrap) return { w: 0, h: 96 };
      const r = wrap.getBoundingClientRect();
      if (r.width < 20 || r.height < 20) return { w: 0, h: 96 };
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

    if (this._targetCtx && this._targetSize && this._targetSize.w >= 20) {
      const { w, h } = this._targetSize;
      this._targetCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawQuizTargetCanvas(this._targetCtx, w, h, ch, pulse, this.mechatronicsLens);
    }

    const optionSizes = this._optionSizes || [];
    ch.options.forEach((opt, idx) => {
      const ctx = this._optionCtxs[idx];
      const size = optionSizes[idx];
      if (!ctx || !size || size.w < 20) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const isSolvedCorrect = solved && opt.isCorrect;
      drawQuizOptionCanvas(ctx, size.w, size.h, ch, opt, isSolvedCorrect, pulse);
    });
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
