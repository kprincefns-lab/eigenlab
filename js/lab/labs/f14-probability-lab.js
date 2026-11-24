/**
 * EIGENLAB — Interactive Lab F1.4
 * Probability Distributions, Multimodality & Score Fields
 *
 * Self-contained 60 FPS dead-front canvas lab adhering to the FrontierLessonShell
 * lab descriptor contract. Models a 2D isotropic Gaussian Mixture Model
 * p(x) = w1 N(x; mu1, sigma^2 I) + (1 - w1) N(x; mu2, sigma^2 I) with two directly
 * draggable mode centers, exact log-sum-exp analytical score field s(x) = grad log p(x),
 * exact single-Gaussian MLE overlay, 32 animated Langevin dynamics particles,
 * differential entropy H(p), and a live 1D marginal density & score slice strip.
 */

const PALETTE = Object.freeze({
  bg: '#0A0C10',
  bgStrip: '#07090D',
  bgPanel: 'rgba(13, 17, 25, 0.90)',
  gridMinor: 'rgba(148, 163, 184, 0.05)',
  gridMajor: 'rgba(148, 163, 184, 0.11)',
  axis: 'rgba(148, 163, 184, 0.22)',
  cyan: '#00E5FF',
  cyanRgb: '0, 229, 255',
  emerald: '#00E676',
  emeraldRgb: '0, 230, 118',
  amber: '#FFB300',
  amberRgb: '255, 179, 0',
  crimson: '#FF1744',
  crimsonRgb: '255, 23, 68',
  violet: '#A78BFA',
  violetRgb: '167, 139, 250',
  textPrimary: '#F3F6FC',
  textSecondary: '#A5B0C7',
  textMuted: '#6C7893',
});

const MONO_FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS_FONT = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

const WORLD = Object.freeze({
  xMin: -2.65,
  xMax: 2.65,
  yMin: -1.32,
  yMax: 1.32,
  dragXLimit: 2.28,
  dragYLimit: 1.02,
  numParticles: 32,
  trailLength: 14,
  sliceRange: 2.85,
  defaultMu1: Object.freeze({ x: -1.12, y: 0.14 }),
  defaultMu2: Object.freeze({ x: 1.12, y: -0.14 }),
  breakMu1: Object.freeze({ x: -1.78, y: 0.06 }),
  breakMu2: Object.freeze({ x: 1.78, y: -0.06 }),
});

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawArrow(ctx, x1, y1, x2, y2, headLen, color, lineWidth = 1.5, glow = 0) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1.5) return;
  const ux = dx / len;
  const uy = dy / len;
  const hl = Math.min(headLen, len * 0.52);
  const hw = hl * 0.52;

  ctx.save();
  if (glow > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
  }
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - ux * hl * 0.65, y2 - uy * hl * 0.65);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * hl - uy * hw, y2 - uy * hl + ux * hw);
  ctx.lineTo(x2 - ux * hl + uy * hw, y2 - uy * hl - ux * hw);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Deterministic seeded PRNG (Mulberry32) for reproducible Langevin particle initialization.
 */
function createSeededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Standard normal sample via Box-Muller transform.
 */
function sampleNormal(rng) {
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Exact 2D isotropic Gaussian mixture density p(x) and analytical score s(x) = grad_x log p(x).
 * Uses log-sum-exp stabilization for posterior responsibilities r1, r2 so there are ZERO NaNs
 * or Infinities even in extreme zero-density voids (e.g. sigma = 0.22, wide separation).
 */
export function evalMixture2D(x, y, mu1, mu2, w1, sigma) {
  const sig = Math.max(sigma, 1e-4);
  const invVar = 1.0 / (sig * sig);
  const w1c = clamp(w1, 1e-6, 1.0 - 1e-6);
  const w2c = 1.0 - w1c;

  const dx1 = x - mu1.x;
  const dy1 = y - mu1.y;
  const dx2 = x - mu2.x;
  const dy2 = y - mu2.y;

  const d1Sq = dx1 * dx1 + dy1 * dy1;
  const d2Sq = dx2 * dx2 + dy2 * dy2;

  const logA1 = Math.log(w1c) - 0.5 * d1Sq * invVar;
  const logA2 = Math.log(w2c) - 0.5 * d2Sq * invVar;
  const maxLog = Math.max(logA1, logA2);

  const e1 = Math.exp(logA1 - maxLog);
  const e2 = Math.exp(logA2 - maxLog);
  const sumE = e1 + e2;

  const r1 = e1 / sumE;
  const r2 = e2 / sumE;

  const logNorm = Math.log(2.0 * Math.PI * sig * sig);
  const logDensity = maxLog + Math.log(sumE) - logNorm;
  const density = logDensity < -700 ? 0.0 : Math.exp(logDensity);

  // Exact analytical score: s(x) = sum_k r_k(x) * (-(x - mu_k) / sigma^2)
  const sx = (r1 * -dx1 + r2 * -dx2) * invVar;
  const sy = (r1 * -dy1 + r2 * -dy2) * invVar;
  const scoreNorm = Math.hypot(sx, sy);

  return {
    density,
    logDensity,
    r1,
    r2,
    sx,
    sy,
    scoreNorm,
  };
}

/**
 * Exact 1D marginal Gaussian mixture density p(u) and score s(u) = d/du log p(u)
 * along the unit axis connecting mu1 (at u1 = -d/2) and mu2 (at u2 = +d/2).
 */
export function evalMixture1DSlice(u, u1, u2, w1, sigma) {
  const sig = Math.max(sigma, 1e-4);
  const invVar = 1.0 / (sig * sig);
  const w1c = clamp(w1, 1e-6, 1.0 - 1e-6);
  const w2c = 1.0 - w1c;

  const du1 = u - u1;
  const du2 = u - u2;

  const logA1 = Math.log(w1c) - 0.5 * du1 * du1 * invVar;
  const logA2 = Math.log(w2c) - 0.5 * du2 * du2 * invVar;
  const maxLog = Math.max(logA1, logA2);

  const e1 = Math.exp(logA1 - maxLog);
  const e2 = Math.exp(logA2 - maxLog);
  const sumE = e1 + e2;

  const r1 = e1 / sumE;
  const r2 = e2 / sumE;

  const logNorm = 0.5 * Math.log(2.0 * Math.PI * sig * sig);
  const logDensity = maxLog + Math.log(sumE) - logNorm;
  const density = logDensity < -700 ? 0.0 : Math.exp(logDensity);
  const score = (r1 * -du1 + r2 * -du2) * invVar;

  return {
    density,
    logDensity,
    r1,
    r2,
    score,
  };
}

/**
 * Exact single-Gaussian Maximum Likelihood Estimate (MLE) fit to the 2-mode mixture:
 *   E[x] = w1 * mu1 + (1 - w1) * mu2
 *   Sigma_MLE = sigma^2 I + w1*(1-w1)*(mu2 - mu1)(mu2 - mu1)^T
 */
export function evalUnimodalFit(mu1, mu2, w1, sigma) {
  const sig = Math.max(sigma, 1e-4);
  const w1c = clamp(w1, 1e-6, 1.0 - 1e-6);
  const w2c = 1.0 - w1c;

  const meanX = w1c * mu1.x + w2c * mu2.x;
  const meanY = w1c * mu1.y + w2c * mu2.y;

  const midX = 0.5 * (mu1.x + mu2.x);
  const midY = 0.5 * (mu1.y + mu2.y);

  const dx = mu2.x - mu1.x;
  const dy = mu2.y - mu1.y;
  const dist = Math.hypot(dx, dy);
  const ux = dist > 1e-6 ? dx / dist : 1.0;
  const uy = dist > 1e-6 ? dy / dist : 0.0;
  const angle = Math.atan2(uy, ux);

  const varParallel = sig * sig + w1c * w2c * dist * dist;
  const sigmaParallel = Math.sqrt(varParallel);
  const sigmaPerp = sig;

  const u1 = -0.5 * dist;
  const u2 = 0.5 * dist;
  const uMean = (w2c - w1c) * 0.5 * dist;

  return {
    meanX,
    meanY,
    midX,
    midY,
    dist,
    ux,
    uy,
    angle,
    sigmaParallel,
    sigmaPerp,
    u1,
    u2,
    uMean,
  };
}

/**
 * Exact 2D differential entropy H(p) = -integral p(x) log p(x) dx (in nats).
 * Because the isotropic mixture factorizes into an orthogonal 1D Gaussian plus
 * a 1D bimodal mixture along the mu1-mu2 axis:
 *   H(p) = 0.5 * log(2 * pi * e * sigma^2) + H_1D(dist, w1, sigma).
 */
export function computeDifferentialEntropy2D(dist, w1, sigma) {
  const sig = Math.max(sigma, 1e-4);
  const hPerp = 0.5 * Math.log(2.0 * Math.PI * Math.E * sig * sig);

  const u1 = -0.5 * dist;
  const u2 = 0.5 * dist;
  const lo = u1 - 5.5 * sig;
  const hi = u2 + 5.5 * sig;
  const steps = 72;
  const du = (hi - lo) / steps;

  let hParallel = 0.0;
  for (let i = 0; i <= steps; i++) {
    const u = lo + i * du;
    const weight = i === 0 || i === steps ? 0.5 : 1.0;
    const res = evalMixture1DSlice(u, u1, u2, w1, sig);
    if (res.density > 1e-300 && Number.isFinite(res.logDensity)) {
      hParallel -= weight * res.density * res.logDensity * du;
    }
  }

  return hPerp + hParallel;
}

/**
 * Finds exact stationary points where 1D score s(u) = 0 (peaks & unstable saddle).
 */
export function find1DScoreZeros(u1, u2, w1, sigma) {
  const zeros = [];
  const lo = Math.min(u1, u2) - 0.5 * sigma;
  const hi = Math.max(u1, u2) + 0.5 * sigma;
  const N = 84;
  const du = (hi - lo) / N;

  let prevU = lo;
  let prevS = evalMixture1DSlice(prevU, u1, u2, w1, sigma).score;

  for (let i = 1; i <= N; i++) {
    const curU = lo + i * du;
    const curS = evalMixture1DSlice(curU, u1, u2, w1, sigma).score;
    if ((prevS > 0 && curS <= 0) || (prevS < 0 && curS >= 0)) {
      let a = prevU;
      let b = curU;
      let sa = prevS;
      for (let iter = 0; iter < 14; iter++) {
        const mid = 0.5 * (a + b);
        const sm = evalMixture1DSlice(mid, u1, u2, w1, sigma).score;
        if ((sa > 0 && sm > 0) || (sa < 0 && sm < 0)) {
          a = mid;
          sa = sm;
        } else {
          b = mid;
        }
      }
      const rootU = 0.5 * (a + b);
      const isPeak = prevS > 0 && curS <= 0;
      const evalRoot = evalMixture1DSlice(rootU, u1, u2, w1, sigma);
      zeros.push({
        u: rootU,
        density: evalRoot.density,
        kind: isPeak ? 'peak' : 'saddle',
      });
    }
    prevU = curU;
    prevS = curS;
  }

  return zeros;
}

/**
 * Evaluates full analytical diagnostics for the current 2D mixture configuration.
 */
export function computeMixtureSummary(mu1, mu2, w1, sigma, probeOffset = 0.16) {
  const unimodal = evalUnimodalFit(mu1, mu2, w1, sigma);
  const atMean = evalMixture2D(unimodal.meanX, unimodal.meanY, mu1, mu2, w1, sigma);
  const atMu1 = evalMixture2D(mu1.x, mu1.y, mu1, mu2, w1, sigma);
  const atMu2 = evalMixture2D(mu2.x, mu2.y, mu1, mu2, w1, sigma);
  const peakDensity = Math.max(atMu1.density, atMu2.density, 1e-12);
  const valleyRatio = atMean.density / peakDensity;

  // Void probe placed in the low-density canyon just off the saddle point
  const probeX = unimodal.midX + unimodal.ux * probeOffset;
  const probeY = unimodal.midY + unimodal.uy * probeOffset;
  const atProbe = evalMixture2D(probeX, probeY, mu1, mu2, w1, sigma);

  const entropy = computeDifferentialEntropy2D(unimodal.dist, w1, sigma);
  const zeros = find1DScoreZeros(unimodal.u1, unimodal.u2, w1, sigma);
  const isBimodal = zeros.filter((z) => z.kind === 'peak').length >= 2;
  const isCollapsed = isBimodal && valleyRatio < 0.12 && atMean.density < 0.035;

  return {
    unimodal,
    atMean,
    atMu1,
    atMu2,
    peakDensity,
    valleyRatio,
    probePos: { x: probeX, y: probeY, u: probeOffset },
    atProbe,
    entropy,
    zeros,
    isBimodal,
    isCollapsed,
  };
}

/**
 * Factory creating the F1.4 Probability Distributions, Multimodality & Score Fields lab descriptor.
 */
export function createF14ProbabilityLab() {
  return {
    nodeId: 'F1.4',
    tier: 1,
    badge: 'TIER 1 • APPLIED MATH & PROBABILITY',
    title: 'Probability Distributions, Multimodality & Score Fields',
    subtitle:
      'Drag Gaussian modes, inspect ∇log p(x) score fields, and watch Langevin sampling climb into multimodal peaks',

    breakMode: {
      buttonLabel: '⚡ Unimodal Collapse',
      triggerLabel: '⚡ Trigger Unimodal Collapse & Void Score Explosion',
      activeLabel: '🔥 Unimodal Collapse Active',
      activeBanner:
        'UNIMODAL COLLAPSE & VOID SCORE EXPLOSION — p(E[x]) → 0 while ‖∇log p‖ spikes across the void',
      description:
        'Wide-separates μ₁ and μ₂, shrinks σ to 0.24, overlays the single-Gaussian MLE fit, and drops a Void Probe particle into the zero-density canyon between modes. Watch p(E[x]) collapse near 0.000 while the score field develops a violent ±30 cliff across the empty void.',
      failureSymptom:
        'Unimodal MLE assigns peak likelihood to the dead valley E[x] where p(E[x]) ≈ 0.000, while unsmoothed score estimation explodes in zero-density voids — stranding Langevin samplers.',
      recoveryHint:
        'Raise Mode Spread σ above 0.65 (simulating Diffusion multi-scale noise injection σ_noise) to flood the void with smooth, well-defined score vectors that bridge both modes!',
    },

    telemetryDefs: [
      { key: 'valleyDensity', label: 'p(E[x]) Valley', accent: 'crimson', color: 'crimson', initial: '0.025' },
      { key: 'scoreNorm', label: 'Probe ‖∇log p‖', accent: 'cyan', color: 'cyan', initial: '3.60' },
      { key: 'modeSplit', label: 'Langevin (μ₁/μ₂)', accent: 'emerald', color: 'emerald', initial: '50% / 50%' },
      { key: 'entropy', label: 'Entropy H(p)', accent: 'violet', color: 'violet', initial: '2.15 nats' },
    ],

    equationSpec: {
      caption: 'Multimodal Mixture Score Field & Unimodal Failure Diagnostics — Hover Any Symbol',
      parts: [
        {
          type: 'var',
          key: 'score',
          label: 'Score Field s(x) = ∇ log p(x)',
          symbol: 's(x) = \\nabla_x \\log p(x)',
          color: 'cyan',
          tooltip:
            'Exact gradient of the log-density pointing uphill toward the nearest high-density peak — independent of the intractable normalizing constant Z.',
          initialValue: '‖s‖ = 3.60',
        },
        { type: 'op', text: '|' },
        {
          type: 'var',
          key: 'mean',
          label: 'Unimodal Mean E[x]',
          symbol: '\\mathbb{E}[x]',
          color: 'amber',
          tooltip:
            'Expected value w₁μ₁ + (1−w₁)μ₂. Lands stranded in the low-density valley whenever two valid modes separate.',
          initialValue: '(0.00, 0.00)',
        },
        { type: 'op', text: '⇒' },
        {
          type: 'var',
          key: 'valleyDensity',
          label: 'Valley Density p(E[x])',
          symbol: 'p(\\mathbb{E}[x])',
          color: 'crimson',
          tooltip:
            'True probability density evaluated at the mean E[x]. Crashes toward 0.000 during unimodal collapse.',
          initialValue: '0.025',
        },
        { type: 'op', text: '|' },
        {
          type: 'var',
          key: 'sigma',
          label: 'Mode Spread σ',
          symbol: '\\sigma',
          color: 'emerald',
          tooltip:
            'Isotropic Gaussian standard deviation around each mode. Larger σ acts like diffusion noise smoothing scores across voids.',
          initialValue: '0.52',
        },
        { type: 'op', text: '|' },
        {
          type: 'var',
          key: 'entropy',
          label: 'Differential Entropy H(p)',
          symbol: 'H(p)',
          color: 'violet',
          tooltip:
            'Total continuous uncertainty −∫ p(x) log p(x) dx in nats, combining within-mode spread and bimodal branching entropy.',
          initialValue: '2.15 nats',
        },
      ],
    },

    controls: [
      {
        id: 'sigma',
        type: 'range',
        label: 'Mode Spread σ',
        min: 0.22,
        max: 1.15,
        step: 0.02,
        value: 0.52,
        unit: '',
      },
      {
        id: 'modeWeight',
        type: 'range',
        label: 'Mode 1 Weight w₁',
        min: 0.15,
        max: 0.85,
        step: 0.05,
        value: 0.5,
        unit: '',
      },
      {
        id: 'langevinTemp',
        type: 'range',
        label: 'Sampling Noise τ',
        min: 0.0,
        max: 1.2,
        step: 0.05,
        value: 0.45,
        unit: '',
      },
      {
        id: 'showUnimodalFit',
        type: 'toggle',
        label: 'Overlay Single-Gaussian Fit',
        value: true,
      },
    ],

    steps: {
      concept: {
        title: 'Why Averages Lie & Score Fields Unlock Multimodality',
        body:
          'When a physical system or robot expert has two distinct valid solutions μ₁ and μ₂, the true distribution p(x) is multimodal. A unimodal estimator predicts the mean E[x] = w₁μ₁ + w₂μ₂ — landing straight in the low-density valley between peaks. By contrast, the Score Function s(x) = ∇ₓ log p(x) points directly uphill into whichever peak owns each basin, allowing Langevin sampling to populate BOTH modes.',
        bullets: [
          'The score s(x) = ∇ₓ log p(x) eliminates any unknown normalizing constant Z because ∇ₓ log Z = 0.',
          'At every probability peak, s(x) = 0 with negative slope; between separated modes, s(x) = 0 at an unstable saddle.',
          'Langevin Dynamics x ← x + η s(x) + √(2η) τ ε climbs the score field while Gaussian noise τ prevents collapse to a single point.',
        ],
      },
      explore: {
        title: 'Drag μ₁ & μ₂ Live Across the Score Field',
        body:
          'Grab the glowing Cyan (μ₁) and Emerald (μ₂) mode handles directly on the 2D plane and pull them apart or push them together. Adjust Mode Spread σ, Mode 1 Weight w₁, and Sampling Noise τ (try τ = 0.0 for pure deterministic gradient ascent vs. τ = 1.0 for full equilibrium exploration), and watch the bottom 1D marginal slice p(u) & score curve s(u) update at 60 FPS.',
      },
      linkedMath: {
        title: 'Hover Any Symbol to Spotlight Its Geometry',
        body:
          'Hover the live equation bar pills: s(x) = ∇ₓ log p(x) illuminates the entire Cyan 2D vector field and Violet 1D score curve; E[x] pulses the stranded mean crosshair and Crimson MLE ellipse; p(E[x]) spotlights the valley dip on the 1D density slice; σ pulses both 1σ mode radius circles; and H(p) highlights the entropy spread of the 32 Langevin particles.',
      },
      breakSystem: {
        title: 'Break the System: Unimodal Collapse & Void Score Explosion',
        body:
          'Inject the fault to pull μ₁ and μ₂ wide apart, shrink σ down to 0.24, overlay the single-Gaussian MLE fit, and drop a probe into the zero-density void between modes. Notice TWO simultaneous failures: (1) the unimodal MLE puts maximum probability on the empty valley where p(E[x]) ≈ 0.000, and (2) the unsmoothed score norm spikes violently across the razor-sharp saddle cliff — explaining why Diffusion models inject multi-scale noise σ_noise so scores stay smooth everywhere!',
        triggerLabel: '⚡ Unimodal Collapse',
      },
    },

    intuitionCheck: {
      question:
        'When two Gaussian modes μ₁ and μ₂ are separated by a wide zero-density void (σ = 0.24), why do modern Diffusion & Score-Based models train on multiple noise-inflated scales σ₁ > σ₂ > … > σ_T instead of learning ∇ log p(x) only on clean data?',
      options: [
        {
          id: 'a',
          label: 'Adding noise forces the two modes to merge permanently so the model only needs to learn E[x].',
          correct: false,
          feedback:
            'Noise is annealed back down to σ_T ≈ 0 during reverse sampling — the final distribution remains sharply multimodal without collapsing onto E[x].',
        },
        {
          id: 'b',
          label: 'In low-density voids where p(x) ≈ 0, empirical score estimates are undefined or explode violently; multi-scale Gaussian noise fills the void with smooth scores that guide samples toward both modes before sharpening.',
          correct: true,
          feedback:
            'Spot on! High-σ levels bridge separated modes with clean, well-conditioned score vectors across empty space, and annealing σ → 0 sharpens Langevin/reverse-SDE particles cleanly into each true peak.',
        },
        {
          id: 'c',
          label: 'The analytical score function s(x) = ∇ log p(x) cannot be computed without knowing the partition function Z.',
          correct: false,
          feedback:
            'The key superpower of score matching is that ∇ₓ log(p̃(x)/Z) = ∇ₓ log p̃(x) − ∇ₓ log Z = ∇ₓ log p̃(x) — the partition function Z cancels out completely!',
        },
        {
          id: 'd',
          label: 'Langevin dynamics only works when Sampling Noise τ = 0, so extra dataset noise replaces τ.',
          correct: false,
          feedback:
            'At τ = 0, Langevin reduces to deterministic gradient ascent onto local maxima. Exact Langevin sampling requires stochastic noise √(2η) ε to explore full mode support and maintain calibrated entropy H(p).',
        },
      ],
    },

    frontierBridge: {
      headline: 'From Score Fields to Diffusion Policies, Flow Matching & World Models',
      whyItMatters:
        'Every modern multimodal Physical AI policy — Diffusion Policy, DDPM/Score SDEs, Physical Intelligence π₀ / GR00T Flow Matching, and stochastic video world models — builds directly on the geometry you just manipulated. By estimating ∇ₓ log p_σ(x) across annealed noise scales, robots escape the unimodal mean trap and sample crisp, high-probability trajectories even when multiple valid strategies exist simultaneously.',
      prereqs: ['F1.1'],
      unlocks: ['M1.1', 'M1.2', 'M2.1', 'F4.3'],
    },

    mountCanvas(canvasHost, api = {}) {
      const host = canvasHost;
      if (!host) return () => {};

      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.background = PALETTE.bg;
      canvas.style.touchAction = 'none';
      canvas.style.cursor = 'default';
      host.textContent = '';
      host.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      if (!ctx) return () => {};

      const rng = createSeededRng(20260414);

      const state = {
        mu1: { ...WORLD.defaultMu1 },
        mu2: { ...WORLD.defaultMu2 },
        sigma: 0.52,
        modeWeight: 0.5,
        langevinTemp: 0.45,
        showUnimodalFit: true,
        breakActive: false,
        hoverVar: null,
        draggingMode: null, // 'mu1' | 'mu2' | null
        hoverMode: null, // 'mu1' | 'mu2' | null
        hasDragged: false,
        time: 0,
        lastTelemetryPush: -1,
        lastTelemSig: '',
        lastEqSig: '',
        // Viewport metrics (Top 72% 2D field, Bottom 28% 1D marginal slice)
        width: 800,
        height: 520,
        dpr: 1,
        topH: 374,
        stripY: 374,
        stripH: 146,
        scale: 130,
        cx: 400,
        cy: 187,
      };

      const unsubs = [];

      /**
       * Initialize 32 Langevin dynamics particles stratified across the 2D arena
       * so users immediately see both settled mode density and active uphill climbing.
       */
      function createParticle(index, isExplorer) {
        let x;
        let y;
        if (isExplorer) {
          // Spawn across the arena so fresh particles visibly ride the score arrows uphill
          x = lerp(-2.25, 2.25, rng());
          y = lerp(-1.05, 1.05, rng());
        } else {
          // Stratified initial spread across the two basins and saddle
          const chooseFirst = index % 2 === 0;
          const anchor = chooseFirst ? state.mu1 : state.mu2;
          x = clamp(anchor.x + sampleNormal(rng) * (state.sigma * 1.15), -2.4, 2.4);
          y = clamp(anchor.y + sampleNormal(rng) * (state.sigma * 1.15), -1.12, 1.12);
        }
        return {
          id: index,
          x,
          y,
          r1: 0.5,
          isExplorer,
          age: rng() * 4.5,
          lifetime: isExplorer ? 3.2 + rng() * 2.4 : 1e9,
          trail: [{ x, y }],
        };
      }

      const particles = [];
      for (let i = 0; i < WORLD.numParticles; i++) {
        // 25 equilibrium particles + 7 continuous uphill explorer particles
        particles.push(createParticle(i, i >= 25));
      }

      function respawnParticlesForCurrentModes() {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (p.isExplorer) {
            p.x = lerp(-2.25, 2.25, rng());
            p.y = lerp(-1.02, 1.02, rng());
            p.age = 0;
          } else {
            const pick1 = rng() < state.modeWeight;
            const anchor = pick1 ? state.mu1 : state.mu2;
            p.x = clamp(anchor.x + sampleNormal(rng) * Math.max(state.sigma, 0.35), -2.4, 2.4);
            p.y = clamp(anchor.y + sampleNormal(rng) * Math.max(state.sigma, 0.35), -1.12, 1.12);
          }
          p.trail = [{ x: p.x, y: p.y }];
        }
      }

      function syncControlUI(id, val) {
        if (typeof api.setControlValue === 'function') {
          try {
            api.setControlValue(id, val, { notify: false });
          } catch {
            // Ignore optional shell control sync errors
          }
        }
      }

      function applyBreakMode(active) {
        const isActive = Boolean(active);
        state.breakActive = isActive;
        if (isActive) {
          state.mu1 = { ...WORLD.breakMu1 };
          state.mu2 = { ...WORLD.breakMu2 };
          state.sigma = 0.24;
          state.modeWeight = 0.5;
          state.showUnimodalFit = true;
          syncControlUI('sigma', 0.24);
          syncControlUI('modeWeight', 0.5);
          syncControlUI('showUnimodalFit', true);
          respawnParticlesForCurrentModes();
        } else {
          state.mu1 = { ...WORLD.defaultMu1 };
          state.mu2 = { ...WORLD.defaultMu2 };
          state.sigma = 0.58;
          state.modeWeight = 0.5;
          state.showUnimodalFit = true;
          syncControlUI('sigma', 0.58);
          syncControlUI('modeWeight', 0.5);
          syncControlUI('showUnimodalFit', true);
        }
      }

      function resetLab() {
        state.breakActive = false;
        state.mu1 = { ...WORLD.defaultMu1 };
        state.mu2 = { ...WORLD.defaultMu2 };
        state.sigma = 0.52;
        state.modeWeight = 0.5;
        state.langevinTemp = 0.45;
        state.showUnimodalFit = true;
        state.draggingMode = null;
        state.hoverMode = null;
        state.hoverVar = null;
        syncControlUI('sigma', 0.52);
        syncControlUI('modeWeight', 0.5);
        syncControlUI('langevinTemp', 0.45);
        syncControlUI('showUnimodalFit', true);
        respawnParticlesForCurrentModes();
      }

      if (typeof api.onControlChange === 'function') {
        const u = api.onControlChange((a, b) => {
          const id = typeof a === 'object' && a !== null ? a.id : a;
          const val = typeof a === 'object' && a !== null ? a.value : b;
          if (id === 'sigma') {
            const num = Number(val);
            if (Number.isFinite(num)) {
              state.sigma = clamp(num, 0.22, 1.15);
            }
          } else if (id === 'modeWeight') {
            const num = Number(val);
            if (Number.isFinite(num)) {
              state.modeWeight = clamp(num, 0.15, 0.85);
            }
          } else if (id === 'langevinTemp') {
            const num = Number(val);
            if (Number.isFinite(num)) {
              state.langevinTemp = clamp(num, 0.0, 1.2);
            }
          } else if (id === 'showUnimodalFit') {
            state.showUnimodalFit = Boolean(val);
          }
        });
        if (typeof u === 'function') unsubs.push(u);
      }

      if (typeof api.onBreakToggle === 'function') {
        const u = api.onBreakToggle((v) => {
          const active = typeof v === 'object' && v !== null ? v.active : v;
          applyBreakMode(active);
        });
        if (typeof u === 'function') unsubs.push(u);
      }

      if (typeof api.onHoverVar === 'function') {
        const u = api.onHoverVar((v) => {
          const key = typeof v === 'object' && v !== null ? v.key : v;
          state.hoverVar = typeof key === 'string' && key.length > 0 ? key : null;
        });
        if (typeof u === 'function') unsubs.push(u);
      }

      if (typeof api.onReset === 'function') {
        const u = api.onReset(() => resetLab());
        if (typeof u === 'function') unsubs.push(u);
      }

      // Responsive 72% / 28% layout & world-to-screen transform
      function updateViewportMetrics() {
        const rect = host.getBoundingClientRect();
        const w = Math.max(300, Math.floor(rect.width || 760));
        const h = Math.max(300, Math.floor(rect.height || 520));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
          canvas.width = Math.floor(w * dpr);
          canvas.height = Math.floor(h * dpr);
        }

        state.width = w;
        state.height = h;
        state.dpr = dpr;

        // Exact 72% top 2D arena / 28% bottom 1D marginal slice
        state.topH = Math.floor(h * 0.72);
        state.stripY = state.topH;
        state.stripH = h - state.topH;

        const availW = w - 36;
        const availH = state.topH - 34;
        const scaleX = availW / (WORLD.xMax - WORLD.xMin);
        const scaleY = availH / (WORLD.yMax - WORLD.yMin);
        state.scale = clamp(Math.min(scaleX, scaleY), 68, 220);
        state.cx = w * 0.5;
        state.cy = state.topH * 0.52;
      }

      function worldToScreen(wx, wy) {
        return {
          x: state.cx + wx * state.scale,
          y: state.cy - wy * state.scale,
        };
      }

      function screenToWorld(sx, sy) {
        return {
          x: (sx - state.cx) / state.scale,
          y: -(sy - state.cy) / state.scale,
        };
      }

      function getPointerPos(ev) {
        const rect = canvas.getBoundingClientRect();
        return {
          sx: ev.clientX - rect.left,
          sy: ev.clientY - rect.top,
        };
      }

      function hitTestModeHandle(sx, sy) {
        if (sy > state.topH + 8) return null;
        const p1 = worldToScreen(state.mu1.x, state.mu1.y);
        const p2 = worldToScreen(state.mu2.x, state.mu2.y);
        const d1 = Math.hypot(sx - p1.x, sy - p1.y);
        const d2 = Math.hypot(sx - p2.x, sy - p2.y);
        const hitRadius = 34;
        if (d1 <= hitRadius && d1 <= d2) return 'mu1';
        if (d2 <= hitRadius) return 'mu2';
        return null;
      }

      function onPointerDown(ev) {
        const { sx, sy } = getPointerPos(ev);
        const hit = hitTestModeHandle(sx, sy);
        if (hit) {
          state.draggingMode = hit;
          state.hoverMode = hit;
          state.hasDragged = true;
          canvas.style.cursor = 'grabbing';
          try {
            canvas.setPointerCapture(ev.pointerId);
          } catch {
            // Ignore synthetic event errors
          }
        }
      }

      function onPointerMove(ev) {
        const { sx, sy } = getPointerPos(ev);
        if (state.draggingMode) {
          const wPt = screenToWorld(sx, clamp(sy, 22, state.topH - 18));
          const maxWorldX = Math.min(WORLD.dragXLimit, (state.width * 0.5 - 26) / state.scale);
          const maxWorldY = Math.min(WORLD.dragYLimit, (state.topH * 0.45 - 16) / state.scale);
          const clampedX = clamp(wPt.x, -maxWorldX, maxWorldX);
          const clampedY = clamp(wPt.y, -maxWorldY, maxWorldY);

          if (state.draggingMode === 'mu1') {
            state.mu1.x = clampedX;
            state.mu1.y = clampedY;
          } else {
            state.mu2.x = clampedX;
            state.mu2.y = clampedY;
          }
          canvas.style.cursor = 'grabbing';
          return;
        }

        const hit = hitTestModeHandle(sx, sy);
        state.hoverMode = hit;
        canvas.style.cursor = hit ? 'grab' : 'default';
      }

      function onPointerUp(ev) {
        if (!state.draggingMode) return;
        state.draggingMode = null;
        canvas.style.cursor = state.hoverMode ? 'grab' : 'default';
        try {
          canvas.releasePointerCapture(ev.pointerId);
        } catch {
          // Ignore
        }
      }

      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerUp);

      let resizeObserver = null;
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => updateViewportMetrics());
        resizeObserver.observe(host);
      }
      window.addEventListener('resize', updateViewportMetrics);
      updateViewportMetrics();

      /**
       * Advance 32 Langevin dynamics particles:
       *   x <- x + eta * s(x) + sqrt(2 * eta) * tau * eps
       * Uses 4 substeps per frame so Euler-Maruyama stays unconditionally stable even at sigma = 0.22.
       */
      function stepSimulation(dt) {
        const subSteps = 4;
        // Scale time step carefully so particles glide smoothly at 60 FPS and respect exact Ornstein-Uhlenbeck variance
        const totalEta = clamp(dt, 0.004, 0.032) * 0.34;
        const subEta = totalEta / subSteps;
        const noiseAmp = Math.sqrt(2.0 * subEta) * state.langevinTemp;
        const maxDriftPerSub = 0.14;

        let countMode1 = 0;
        let maxParticleScore = 0;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.age += dt;

          if (p.isExplorer && p.age >= p.lifetime) {
            p.x = lerp(-2.35, 2.35, rng());
            p.y = lerp(-1.05, 1.05, rng());
            p.age = 0;
            p.trail = [{ x: p.x, y: p.y }];
          }

          let lastEval = null;
          for (let s = 0; s < subSteps; s++) {
            const ev = evalMixture2D(p.x, p.y, state.mu1, state.mu2, state.modeWeight, state.sigma);
            lastEval = ev;

            let dx = ev.sx * subEta;
            let dy = ev.sy * subEta;
            const dNorm = Math.hypot(dx, dy);
            if (dNorm > maxDriftPerSub) {
              const scale = maxDriftPerSub / dNorm;
              dx *= scale;
              dy *= scale;
            }

            if (noiseAmp > 0) {
              dx += noiseAmp * sampleNormal(rng);
              dy += noiseAmp * sampleNormal(rng);
            }

            p.x += dx;
            p.y += dy;

            // Gentle soft reflection at arena bounds
            if (p.x < WORLD.xMin + 0.08) p.x = WORLD.xMin + 0.08 + Math.abs(p.x - (WORLD.xMin + 0.08)) * 0.4;
            if (p.x > WORLD.xMax - 0.08) p.x = WORLD.xMax - 0.08 - Math.abs(p.x - (WORLD.xMax - 0.08)) * 0.4;
            if (p.y < WORLD.yMin + 0.08) p.y = WORLD.yMin + 0.08 + Math.abs(p.y - (WORLD.yMin + 0.08)) * 0.4;
            if (p.y > WORLD.yMax - 0.08) p.y = WORLD.yMax - 0.08 - Math.abs(p.y - (WORLD.yMax - 0.08)) * 0.4;
          }

          p.r1 = lastEval ? lastEval.r1 : 0.5;
          if (lastEval && lastEval.scoreNorm > maxParticleScore) {
            maxParticleScore = lastEval.scoreNorm;
          }
          if (p.r1 >= 0.5) countMode1++;

          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > WORLD.trailLength) {
            p.trail.shift();
          }
        }

        // In Break mode, oscillate probe subtly across the razor-edge of the void saddle
        const probeOffset = state.breakActive
          ? 0.14 + 0.06 * Math.sin(state.time * 2.1)
          : 0.22;

        const summary = computeMixtureSummary(
          state.mu1,
          state.mu2,
          state.modeWeight,
          state.sigma,
          probeOffset
        );

        const mode1Pct = Math.round((countMode1 / particles.length) * 100);
        const mode2Pct = 100 - mode1Pct;

        return {
          summary,
          mode1Pct,
          mode2Pct,
          maxParticleScore,
        };
      }

      /**
       * Throttled, zero-thrash telemetry & linked-equation synchronization.
       */
      function syncShellReadouts(sim) {
        const now = state.time;
        if (now - state.lastTelemetryPush < 0.06) return;
        state.lastTelemetryPush = now;

        const { summary, mode1Pct, mode2Pct } = sim;
        const valleyVal = summary.atMean.density;
        const valleyStr = valleyVal < 0.0005 ? '0.000' : valleyVal.toFixed(3);
        const probeScore = summary.atProbe.scoreNorm;
        const scoreStr = probeScore >= 100 ? `${probeScore.toFixed(0)}` : probeScore.toFixed(2);
        const splitStr = `${mode1Pct}% / ${mode2Pct}%`;
        const entStr = `${summary.entropy.toFixed(2)} nats`;

        const valleyColor =
          summary.isCollapsed || valleyVal < 0.012
            ? 'crimson'
            : summary.valleyRatio < 0.45
            ? 'amber'
            : 'emerald';

        const scoreColor =
          state.breakActive || probeScore > 14
            ? 'crimson'
            : probeScore > 7
            ? 'amber'
            : 'cyan';

        const statusObj =
          state.breakActive || (summary.isCollapsed && valleyVal < 0.006)
            ? { level: 'fault', label: 'UNIMODAL COLLAPSE!' }
            : summary.isCollapsed
            ? { level: 'warning', label: 'BIMODAL VALLEY DIP' }
            : summary.isBimodal
            ? { level: 'safe', label: 'MULTIMODAL ACTIVE' }
            : { level: 'safe', label: 'UNIMODAL OVERLAP' };

        const telemSig = `${valleyStr}|${scoreStr}|${splitStr}|${entStr}|${statusObj.label}`;
        if (state.lastTelemSig !== telemSig && typeof api.updateTelemetry === 'function') {
          state.lastTelemSig = telemSig;
          try {
            api.updateTelemetry(
              {
                valleyDensity: { value: valleyStr, color: valleyColor },
                scoreNorm: { value: scoreStr, color: scoreColor },
                modeSplit: { value: splitStr, color: 'emerald' },
                entropy: { value: entStr, color: 'violet' },
              },
              statusObj
            );
          } catch {
            // Ignore shell errors
          }
        }

        const meanCoordStr = `(${summary.unimodal.meanX.toFixed(2)}, ${summary.unimodal.meanY.toFixed(2)})`;
        const sigStr = state.sigma.toFixed(2);
        const eqSig = `${scoreStr}|${meanCoordStr}|${valleyStr}|${sigStr}|${entStr}`;
        if (state.lastEqSig !== eqSig && typeof api.updateEquation === 'function') {
          state.lastEqSig = eqSig;
          try {
            api.updateEquation({
              score: { value: `‖s‖ = ${scoreStr}`, color: scoreColor },
              mean: { value: meanCoordStr, color: summary.isCollapsed ? 'crimson' : 'amber' },
              valleyDensity: { value: valleyStr, color: valleyColor },
              sigma: { value: sigStr, color: 'emerald' },
              entropy: { value: entStr, color: 'violet' },
            });
          } catch {
            // Ignore shell errors
          }
        }
      }

      // =========================================================================
      // 60 FPS DEAD-FRONT CANVAS RENDERING
      // =========================================================================

      function renderTopBackgroundGrid(ctx, W, topH) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, topH);
        ctx.clip();

        // Subtle technical world grid (0.5 unit spacing)
        const step = 0.5;
        const xStart = Math.floor(WORLD.xMin / step) * step;
        const xEnd = Math.ceil(WORLD.xMax / step) * step;
        const yStart = Math.floor(WORLD.yMin / step) * step;
        const yEnd = Math.ceil(WORLD.yMax / step) * step;

        for (let gx = xStart; gx <= xEnd + 1e-6; gx += step) {
          const sx = worldToScreen(gx, 0).x;
          if (sx < 0 || sx > W) continue;
          const isAxis = Math.abs(gx) < 1e-6;
          const isMajor = Math.abs(gx - Math.round(gx)) < 1e-6;
          ctx.beginPath();
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, topH);
          ctx.strokeStyle = isAxis
            ? PALETTE.axis
            : isMajor
            ? PALETTE.gridMajor
            : PALETTE.gridMinor;
          ctx.lineWidth = isAxis ? 1.2 : 1;
          ctx.stroke();
        }

        for (let gy = yStart; gy <= yEnd + 1e-6; gy += step) {
          const sy = worldToScreen(0, gy).y;
          if (sy < 0 || sy > topH) continue;
          const isAxis = Math.abs(gy) < 1e-6;
          const isMajor = Math.abs(gy - Math.round(gy)) < 1e-6;
          ctx.beginPath();
          ctx.moveTo(0, sy);
          ctx.lineTo(W, sy);
          ctx.strokeStyle = isAxis
            ? PALETTE.axis
            : isMajor
            ? PALETTE.gridMajor
            : PALETTE.gridMinor;
          ctx.lineWidth = isAxis ? 1.2 : 1;
          ctx.stroke();
        }

        // Subtle axis tags
        ctx.font = `600 9.5px ${MONO_FONT}`;
        ctx.fillStyle = PALETTE.textMuted;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('x₁', W - 10, clamp(state.cy - 4, 16, topH - 6));
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('x₂', clamp(state.cx + 6, 8, W - 26), 10);

        ctx.restore();
      }

      /**
       * Render concentric translucent density iso-contours around both Gaussian modes.
       */
      function renderModeIsoContours(ctx, hoverVar) {
        const hiSigma = hoverVar === 'sigma';
        const pulse = 0.5 + 0.5 * Math.sin(state.time * 6.5);
        const modes = [
          {
            pos: state.mu1,
            weight: state.modeWeight,
            hex: PALETTE.cyan,
            rgb: PALETTE.cyanRgb,
            label: '1σ',
          },
          {
            pos: state.mu2,
            weight: 1 - state.modeWeight,
            hex: PALETTE.emerald,
            rgb: PALETTE.emeraldRgb,
            label: '1σ',
          },
        ];

        const ringMultipliers = [2.6, 2.0, 1.5, 1.0, 0.55];

        ctx.save();
        for (let m = 0; m < modes.length; m++) {
          const mode = modes[m];
          const c = worldToScreen(mode.pos.x, mode.pos.y);
          const weightGain = 0.55 + 0.9 * mode.weight;
          const maxR = Math.max(12, 2.75 * state.sigma * state.scale);

          // Soft luminous density cloud
          const grad = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, maxR);
          grad.addColorStop(0, `rgba(${mode.rgb}, ${(0.24 * weightGain).toFixed(3)})`);
          grad.addColorStop(0.36, `rgba(${mode.rgb}, ${(0.12 * weightGain).toFixed(3)})`);
          grad.addColorStop(0.72, `rgba(${mode.rgb}, ${(0.04 * weightGain).toFixed(3)})`);
          grad.addColorStop(1, `rgba(${mode.rgb}, 0)`);
          ctx.beginPath();
          ctx.arc(c.x, c.y, maxR, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          // Crisp concentric iso-contours (0.55σ, 1σ, 1.5σ, 2σ, 2.6σ)
          for (let rIdx = 0; rIdx < ringMultipliers.length; rIdx++) {
            const mult = ringMultipliers[rIdx];
            const radiusPx = mult * state.sigma * state.scale;
            const isOneSigma = Math.abs(mult - 1.0) < 1e-6;

            ctx.beginPath();
            ctx.arc(c.x, c.y, radiusPx, 0, Math.PI * 2);

            if (isOneSigma && hiSigma) {
              ctx.strokeStyle = mode.hex;
              ctx.lineWidth = 2.4 + pulse * 1.1;
              ctx.shadowColor = mode.hex;
              ctx.shadowBlur = 14 + pulse * 8;
              ctx.setLineDash([]);
              ctx.stroke();
              ctx.shadowBlur = 0;
            } else {
              const baseAlpha = isOneSigma ? 0.52 : mult < 1 ? 0.34 : 0.24 / (mult * 0.65);
              ctx.strokeStyle = `rgba(${mode.rgb}, ${(baseAlpha * weightGain).toFixed(3)})`;
              ctx.lineWidth = isOneSigma ? 1.45 : 1.0;
              ctx.setLineDash(mult > 1.2 ? [4, 4] : []);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }

          // Radius marker for 1σ when hovering sigma
          if (hiSigma) {
            const r1 = state.sigma * state.scale;
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(c.x + r1, c.y);
            ctx.strokeStyle = mode.hex;
            ctx.lineWidth = 1.6;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.font = `700 10px ${MONO_FONT}`;
            ctx.fillStyle = mode.hex;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`σ=${state.sigma.toFixed(2)}`, c.x + r1 * 0.5, c.y - 5);
          }
        }
        ctx.restore();
      }

      /**
       * Render dashed 1D slice axis connecting μ₁ and μ₂ so the bottom strip geometry is transparent.
       */
      function renderSliceAxis(ctx, summary) {
        const { unimodal } = summary;
        const pA = worldToScreen(
          unimodal.midX - unimodal.ux * 2.75,
          unimodal.midY - unimodal.uy * 2.75
        );
        const pB = worldToScreen(
          unimodal.midX + unimodal.ux * 2.75,
          unimodal.midY + unimodal.uy * 2.75
        );

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.setLineDash([5, 6]);
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.28)';
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.setLineDash([]);

        // Label along axis near right end
        const lblPt = worldToScreen(
          unimodal.midX + unimodal.ux * 2.02,
          unimodal.midY + unimodal.uy * 2.02
        );
        ctx.font = `600 8.5px ${MONO_FONT}`;
        ctx.fillStyle = 'rgba(167, 139, 250, 0.65)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('1D SLICE u', clamp(lblPt.x, 54, state.width - 54), clamp(lblPt.y - 6, 20, state.topH - 10));
        ctx.restore();
      }

      /**
       * Render the 2D Score Vector Field s(x) = ∇log p(x) on a clean uniform grid.
       */
      function renderScoreVectorField(ctx, hoverVar) {
        const hiScore = hoverVar === 'score';
        const stepWorld = 0.34;
        const xHalf = Math.min(WORLD.xMax - 0.15, (state.width * 0.5 - 24) / state.scale);
        const yHalf = Math.min(WORLD.yMax - 0.12, (state.topH * 0.46 - 14) / state.scale);

        const cols = Math.floor((xHalf * 2) / stepWorld);
        const rows = Math.floor((yHalf * 2) / stepWorld);
        const x0 = -cols * stepWorld * 0.5;
        const y0 = -rows * stepWorld * 0.5;

        const maxArrowPx = Math.min(stepWorld * state.scale * 0.72, hiScore ? 26 : 21);

        ctx.save();
        for (let ix = 0; ix <= cols; ix++) {
          const wx = x0 + ix * stepWorld;
          for (let iy = 0; iy <= rows; iy++) {
            const wy = y0 + iy * stepWorld;
            const res = evalMixture2D(wx, wy, state.mu1, state.mu2, state.modeWeight, state.sigma);
            if (res.scoreNorm < 1e-4) continue;

            // Smooth bounded magnitude scaling so arrows never overlap into visual noise
            const magFrac = Math.tanh(res.scoreNorm * 0.24);
            const lenPx = Math.max(4.5, maxArrowPx * magFrac);

            const ux = res.sx / res.scoreNorm;
            const uy = res.sy / res.scoreNorm;

            const centerS = worldToScreen(wx, wy);
            // Note: screen Y is inverted relative to world Y
            const halfX = ux * lenPx * 0.5;
            const halfY = -uy * lenPx * 0.5;

            const isVoidExplosion = state.breakActive && res.density < 1e-4 && res.scoreNorm > 16;
            const baseAlpha = hiScore
              ? 0.46 + 0.5 * magFrac
              : 0.16 + 0.36 * magFrac;

            const color = isVoidExplosion
              ? `rgba(${PALETTE.crimsonRgb}, ${Math.min(0.88, baseAlpha + 0.22).toFixed(3)})`
              : `rgba(${PALETTE.cyanRgb}, ${Math.min(0.95, baseAlpha).toFixed(3)})`;

            drawArrow(
              ctx,
              centerS.x - halfX,
              centerS.y - halfY,
              centerS.x + halfX,
              centerS.y + halfY,
              hiScore ? 5.6 : 4.4,
              color,
              hiScore ? 1.65 : 1.15,
              hiScore ? 9 : isVoidExplosion ? 6 : 0
            );
          }
        }
        ctx.restore();
      }

      /**
       * Optional Single-Gaussian MLE Ellipse Overlay centered on E[x].
       */
      function renderUnimodalMLEOverlay(ctx, summary, hoverVar) {
        if (!state.showUnimodalFit) return;
        const { unimodal } = summary;
        const hiMean = hoverVar === 'mean' || hoverVar === 'valleyDensity';
        const meanS = worldToScreen(unimodal.meanX, unimodal.meanY);
        const rx1 = unimodal.sigmaParallel * state.scale;
        const ry1 = unimodal.sigmaPerp * state.scale;

        ctx.save();
        ctx.translate(meanS.x, meanS.y);
        // Canvas Y is downward, so world +angle rotates by -angle on screen
        ctx.rotate(-unimodal.angle);

        // 2σ outer dashed envelope
        ctx.beginPath();
        ctx.ellipse(0, 0, rx1 * 1.85, ry1 * 1.85, 0, 0, Math.PI * 2);
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = `rgba(${PALETTE.crimsonRgb}, ${hiMean ? 0.42 : 0.20})`;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // 1σ primary MLE ellipse
        ctx.beginPath();
        ctx.ellipse(0, 0, rx1, ry1, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${PALETTE.crimsonRgb}, ${hiMean ? 0.13 : 0.065})`;
        ctx.fill();
        ctx.setLineDash([7, 5]);
        ctx.strokeStyle = `rgba(${PALETTE.crimsonRgb}, ${hiMean ? 0.92 : 0.64})`;
        ctx.lineWidth = hiMean ? 2.4 : 1.75;
        if (hiMean || state.breakActive) {
          ctx.shadowColor = PALETTE.crimson;
          ctx.shadowBlur = hiMean ? 14 : 8;
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        ctx.restore();

        // Crisp label above ellipse
        ctx.save();
        ctx.font = `700 9px ${MONO_FONT}`;
        ctx.fillStyle = `rgba(255, 138, 158, ${hiMean ? 1.0 : 0.85})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(
          'UNIMODAL MLE N(E[x], Σ)',
          meanS.x,
          clamp(meanS.y - ry1 - 8, 22, state.topH - 18)
        );
        ctx.restore();
      }

      /**
       * Render 32 animated Langevin dynamics particles climbing the score field into BOTH peaks.
       */
      function renderLangevinParticles(ctx, hoverVar) {
        const hiEntropy = hoverVar === 'entropy';
        const pulse = 0.5 + 0.5 * Math.sin(state.time * 5.2);

        ctx.save();
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          // Blend Cyan (Mode 1) -> Emerald (Mode 2) based on posterior responsibility r1
          const r = Math.round(lerp(0, 0, p.r1));
          const g = Math.round(lerp(230, 229, p.r1));
          const b = Math.round(lerp(118, 255, p.r1));
          const rgbStr = `${r}, ${g}, ${b}`;

          // Fade-in for freshly spawned explorer particles
          const fadeIn = p.isExplorer ? clamp(p.age * 2.5, 0.15, 1.0) : 1.0;

          // Draw glowing particle trail
          if (p.trail.length > 1) {
            ctx.beginPath();
            for (let k = 0; k < p.trail.length; k++) {
              const sp = worldToScreen(p.trail[k].x, p.trail[k].y);
              if (k === 0) ctx.moveTo(sp.x, sp.y);
              else ctx.lineTo(sp.x, sp.y);
            }
            ctx.strokeStyle = hiEntropy
              ? `rgba(${PALETTE.violetRgb}, ${(0.52 * fadeIn).toFixed(3)})`
              : `rgba(${rgbStr}, ${(0.36 * fadeIn).toFixed(3)})`;
            ctx.lineWidth = hiEntropy ? 1.85 : 1.25;
            ctx.lineCap = 'round';
            ctx.stroke();
          }

          const headS = worldToScreen(p.x, p.y);

          // Highlight entropy spread halo around every particle when hovering H(p)
          if (hiEntropy) {
            ctx.beginPath();
            ctx.arc(headS.x, headS.y, 8 + pulse * 3.5, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${PALETTE.violetRgb}, 0.55)`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }

          // Particle glowing phosphor core
          ctx.beginPath();
          ctx.arc(headS.x, headS.y, hiEntropy ? 4.2 : 3.2, 0, Math.PI * 2);
          ctx.fillStyle = hiEntropy
            ? PALETTE.violet
            : `rgba(${rgbStr}, ${(0.95 * fadeIn).toFixed(3)})`;
          ctx.shadowColor = hiEntropy ? PALETTE.violet : `rgb(${rgbStr})`;
          ctx.shadowBlur = hiEntropy ? 12 : 7;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.restore();
      }

      /**
       * Render the Unimodal Mean E[x] crosshair stranded in the valley between modes.
       */
      function renderUnimodalMeanMarker(ctx, summary, hoverVar) {
        const { unimodal, atMean, isCollapsed } = summary;
        const meanS = worldToScreen(unimodal.meanX, unimodal.meanY);
        const hiMean = hoverVar === 'mean' || hoverVar === 'valleyDensity';
        const isDanger = isCollapsed || state.breakActive;
        const pulse = 0.5 + 0.5 * Math.sin(state.time * (isDanger ? 9.5 : 4.2));

        const colorHex = isDanger ? PALETTE.crimson : PALETTE.amber;
        const colorRgb = isDanger ? PALETTE.crimsonRgb : PALETTE.amberRgb;

        ctx.save();
        // Outer pulsing alert ring
        ctx.beginPath();
        ctx.arc(meanS.x, meanS.y, (hiMean ? 16 : 11) + pulse * (hiMean ? 7 : 4), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${colorRgb}, ${(hiMean ? 0.9 : 0.62 - pulse * 0.25).toFixed(3)})`;
        ctx.lineWidth = hiMean ? 2.4 : 1.6;
        ctx.stroke();

        // Precision crosshair
        const arm = hiMean ? 11 : 8.5;
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = hiMean ? 2.4 : 1.9;
        ctx.shadowColor = colorHex;
        ctx.shadowBlur = hiMean ? 16 : 10;
        ctx.beginPath();
        ctx.moveTo(meanS.x - arm, meanS.y);
        ctx.lineTo(meanS.x + arm, meanS.y);
        ctx.moveTo(meanS.x, meanS.y - arm);
        ctx.lineTo(meanS.x, meanS.y + arm);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(meanS.x, meanS.y, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Crisp pill label
        const tag = isDanger
          ? `E[x] · p=${atMean.density < 0.0005 ? '0.000' : atMean.density.toFixed(3)}`
          : 'E[x]';
        ctx.font = `700 9.5px ${MONO_FONT}`;
        const tw = ctx.measureText(tag).width + 12;
        const py = meanS.y + 15;
        drawRoundedRect(ctx, meanS.x - tw * 0.5, py, tw, 18, 6);
        ctx.fillStyle = isDanger ? 'rgba(136, 19, 44, 0.92)' : 'rgba(26, 20, 10, 0.88)';
        ctx.fill();
        ctx.strokeStyle = `rgba(${colorRgb}, 0.82)`;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.fillStyle = isDanger ? '#FFE4E8' : PALETTE.amber;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tag, meanS.x, py + 9.2);
        ctx.restore();
      }

      /**
       * In Break Mode, render the Void Probe particle dropped into the zero-density canyon
       * showing p(x) ≈ 0.000 and wildly spiking score vector ‖∇log p‖!
       */
      function renderVoidProbe(ctx, summary) {
        if (!state.breakActive) return;
        const { probePos, atProbe } = summary;
        const pS = worldToScreen(probePos.x, probePos.y);
        const pulse = 0.5 + 0.5 * Math.sin(state.time * 13);

        // Simulated finite-sample score jitter ring visualizing 1/p(x) estimation instability
        const jitterAngle = Math.sin(state.time * 24) * 0.14;
        const baseAngle = Math.atan2(-atProbe.sy, atProbe.sx);
        const arrowLen = clamp(24 + atProbe.scoreNorm * 1.4, 28, 68);
        const tipX = pS.x + Math.cos(baseAngle + jitterAngle) * arrowLen;
        const tipY = pS.y + Math.sin(baseAngle + jitterAngle) * arrowLen;

        ctx.save();
        // Pulsing crimson shockwave around void probe
        ctx.beginPath();
        ctx.arc(pS.x, pS.y, 12 + pulse * 10, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${PALETTE.crimsonRgb}, ${(0.85 - pulse * 0.45).toFixed(3)})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Exploding score arrow
        drawArrow(ctx, pS.x, pS.y, tipX, tipY, 9, PALETTE.crimson, 2.8, 16);

        // Probe diamond core
        ctx.beginPath();
        ctx.moveTo(pS.x, pS.y - 6);
        ctx.lineTo(pS.x + 6, pS.y);
        ctx.lineTo(pS.x, pS.y + 6);
        ctx.lineTo(pS.x - 6, pS.y);
        ctx.closePath();
        ctx.fillStyle = PALETTE.amber;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = PALETTE.crimson;
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Void Probe callout badge
        const label = `VOID PROBE · ‖∇log p‖=${atProbe.scoreNorm.toFixed(1)}`;
        ctx.font = `700 9.5px ${MONO_FONT}`;
        const tw = ctx.measureText(label).width + 14;
        const bx = clamp(pS.x - tw * 0.5, 10, state.width - tw - 10);
        const by = clamp(pS.y - 42, 62, state.topH - 36);
        drawRoundedRect(ctx, bx, by, tw, 20, 6);
        ctx.fillStyle = 'rgba(255, 23, 68, 0.92)';
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, bx + tw * 0.5, by + 10.2);
        ctx.restore();
      }

      /**
       * Render the two directly draggable glowing Gaussian mode handles μ₁ (Cyan) and μ₂ (Emerald).
       */
      function renderDraggableModeHandles(ctx) {
        const pulse = 0.5 + 0.5 * Math.sin(state.time * 4.0);
        const handles = [
          {
            id: 'mu1',
            pos: state.mu1,
            sym: 'μ₁',
            weightPct: Math.round(state.modeWeight * 100),
            hex: PALETTE.cyan,
            rgb: PALETTE.cyanRgb,
          },
          {
            id: 'mu2',
            pos: state.mu2,
            sym: 'μ₂',
            weightPct: 100 - Math.round(state.modeWeight * 100),
            hex: PALETTE.emerald,
            rgb: PALETTE.emeraldRgb,
          },
        ];

        ctx.save();
        for (let i = 0; i < handles.length; i++) {
          const h = handles[i];
          const pS = worldToScreen(h.pos.x, h.pos.y);
          const isDrag = state.draggingMode === h.id;
          const isHover = state.hoverMode === h.id;
          const ringR = isDrag ? 21 : isHover ? 19 : 16 + pulse * 1.8;

          // Outer grab halo
          ctx.beginPath();
          ctx.arc(pS.x, pS.y, ringR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${h.rgb}, ${isDrag ? 0.24 : isHover ? 0.16 : 0.09})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(${h.rgb}, ${isDrag || isHover ? 0.95 : 0.68})`;
          ctx.lineWidth = isDrag ? 2.4 : 1.6;
          ctx.stroke();

          // Inner glowing phosphor node
          ctx.beginPath();
          ctx.arc(pS.x, pS.y, 7.2, 0, Math.PI * 2);
          ctx.fillStyle = h.hex;
          ctx.shadowColor = h.hex;
          ctx.shadowBlur = isDrag ? 22 : 14;
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.beginPath();
          ctx.arc(pS.x, pS.y, 2.7, 0, Math.PI * 2);
          ctx.fillStyle = '#0A0C10';
          ctx.fill();

          // Mode pill label above handle
          const lbl = `${h.sym} (${h.weightPct}%)`;
          ctx.font = `700 10px ${MONO_FONT}`;
          const tw = ctx.measureText(lbl).width + 12;
          const lx = clamp(pS.x - tw * 0.5, 8, state.width - tw - 8);
          const ly = clamp(pS.y - ringR - 23, 8, state.topH - 28);

          drawRoundedRect(ctx, lx, ly, tw, 18, 6);
          ctx.fillStyle = PALETTE.bgPanel;
          ctx.fill();
          ctx.strokeStyle = `rgba(${h.rgb}, 0.72)`;
          ctx.lineWidth = 1.1;
          ctx.stroke();

          ctx.fillStyle = h.hex;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(lbl, lx + tw * 0.5, ly + 9.2);

          if (!state.hasDragged) {
            ctx.font = `500 8.5px ${SANS_FONT}`;
            ctx.fillStyle = `rgba(${h.rgb}, 0.82)`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('drag', pS.x, pS.y + ringR + 4);
          }
        }
        ctx.restore();
      }

      /**
       * Render compact HUD badges inside the Top 72% 2D viewport.
       */
      function renderTopHUD(ctx, sim, W, topH) {
        const { summary, mode1Pct, mode2Pct } = sim;
        const collapsed = state.breakActive || summary.isCollapsed;

        // Top-Left HUD
        const leftW = 224;
        const leftH = 44;
        ctx.save();
        drawRoundedRect(ctx, 12, 10, leftW, leftH, 10);
        ctx.fillStyle = PALETTE.bgPanel;
        ctx.fill();
        ctx.strokeStyle = collapsed ? PALETTE.crimson : 'rgba(255, 255, 255, 0.11)';
        ctx.lineWidth = collapsed ? 1.5 : 1.1;
        ctx.stroke();

        ctx.font = `700 9.8px ${MONO_FONT}`;
        ctx.fillStyle = collapsed ? PALETTE.crimson : PALETTE.cyan;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(
          collapsed ? 'UNIMODAL COLLAPSE!' : '2D SCORE FIELD · ∇log p(x)',
          22,
          17
        );

        ctx.font = `500 9.2px ${MONO_FONT}`;
        ctx.fillStyle = PALETTE.textSecondary;
        ctx.fillText(
          `σ=${state.sigma.toFixed(2)} · d=${summary.unimodal.dist.toFixed(2)} · p(E[x])=${
            summary.atMean.density < 0.0005 ? '0.000' : summary.atMean.density.toFixed(3)
          }`,
          22,
          33
        );
        ctx.restore();

        // Top-Right HUD (hide gracefully on very narrow viewports)
        const rightW = 178;
        const rightX = W - rightW - 12;
        if (rightX > leftW + 24) {
          ctx.save();
          drawRoundedRect(ctx, rightX, 10, rightW, leftH, 10);
          ctx.fillStyle = PALETTE.bgPanel;
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.11)';
          ctx.lineWidth = 1.1;
          ctx.stroke();

          ctx.font = `700 9.8px ${MONO_FONT}`;
          ctx.fillStyle = PALETTE.emerald;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(`LANGEVIN · ${WORLD.numParticles} PARTICLES`, rightX + 10, 17);

          ctx.font = `500 9.2px ${MONO_FONT}`;
          ctx.fillStyle = PALETTE.textSecondary;
          ctx.fillText(
            `τ=${state.langevinTemp.toFixed(2)} · SPLIT ${mode1Pct}/${mode2Pct}%`,
            rightX + 10,
            33
          );
          ctx.restore();
        }

        // Collapse warning banner at bottom of 2D panel when Break mode active
        if (state.breakActive) {
          const msg =
            'UNIMODAL COLLAPSE! p(E[x]) ≈ 0.000 · VOID SCORE SPIKING — RAISE σ TO BRIDGE MODES';
          ctx.save();
          ctx.font = `700 9.5px ${MONO_FONT}`;
          const tw = Math.min(W - 24, ctx.measureText(msg).width + 22);
          const bx = (W - tw) * 0.5;
          const by = topH - 29;
          drawRoundedRect(ctx, bx, by, tw, 22, 11);
          ctx.fillStyle = 'rgba(18, 8, 12, 0.92)';
          ctx.fill();
          ctx.strokeStyle = PALETTE.crimson;
          ctx.lineWidth = 1.35;
          ctx.shadowColor = PALETTE.crimson;
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#FF8A9E';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(msg, W * 0.5, by + 11.2, tw - 14);
          ctx.restore();
        }
      }

      /**
       * Bottom 28% Strip: Live 1D Marginal Slice along the line connecting μ₁ and μ₂.
       * Plots exact bimodal p(u), optional single-Gaussian MLE curve, Violet dashed score s(u),
       * zero crossings (both peaks + unstable saddle), and E[x] valley dip marker.
       */
      function renderBottom1DSlice(ctx, sim, hoverVar) {
        const { summary } = sim;
        const { unimodal, zeros, isCollapsed } = summary;
        const W = state.width;
        const y0 = state.stripY;
        const H = state.stripH;

        ctx.save();
        // Clip to bottom 28% strip
        ctx.beginPath();
        ctx.rect(0, y0, W, H);
        ctx.clip();

        // Dead-front oscilloscope strip background
        ctx.fillStyle = PALETTE.bgStrip;
        ctx.fillRect(0, y0, W, H);

        // Top separator hairline
        ctx.beginPath();
        ctx.moveTo(0, y0 + 0.5);
        ctx.lineTo(W, y0 + 0.5);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Header row & legend inside strip
        ctx.font = `700 9.5px ${MONO_FONT}`;
        ctx.fillStyle = PALETTE.textSecondary;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('1D MARGINAL SLICE (μ₁ ↔ μ₂)', 14, y0 + 7);

        if (W > 430) {
          const items = [
            { text: 'p(u)', color: PALETTE.emerald },
            { text: 's(u)=d/du log p', color: PALETTE.violet },
            ...(state.showUnimodalFit ? [{ text: 'MLE Fit', color: PALETTE.crimson }] : []),
            { text: 'E[x]', color: isCollapsed ? PALETTE.crimson : PALETTE.amber },
          ];
          let rx = W - 14;
          ctx.font = `600 9px ${MONO_FONT}`;
          ctx.textAlign = 'right';
          for (let i = items.length - 1; i >= 0; i--) {
            const it = items[i];
            ctx.fillStyle = it.color;
            ctx.fillText(it.text, rx, y0 + 7);
            const tw = ctx.measureText(it.text).width;
            ctx.beginPath();
            ctx.arc(rx - tw - 6, y0 + 11.5, 2.7, 0, Math.PI * 2);
            ctx.fill();
            rx -= tw + 20;
          }
        }

        // Plot inner rect
        const padL = 22;
        const padR = 22;
        const padT = 24;
        const padB = 19;
        const plotX = padL;
        const plotY = y0 + padT;
        const plotW = Math.max(80, W - padL - padR);
        const plotH = Math.max(40, H - padT - padB);
        const baseY = plotY + plotH;
        const scoreMidY = plotY + plotH * 0.50;

        const uRange = Math.max(WORLD.sliceRange, unimodal.dist * 0.65 + 2.4 * state.sigma);
        const uToX = (u) => plotX + ((u + uRange) / (2 * uRange)) * plotW;

        // Sample 1D bimodal density, unimodal MLE density, and exact 1D score
        const samples = 140;
        const pts = [];
        let maxDensity = 0.05;
        const mleInvNorm = 1.0 / (Math.sqrt(2.0 * Math.PI) * unimodal.sigmaParallel);
        const mleInvTwoVar = 0.5 / (unimodal.sigmaParallel * unimodal.sigmaParallel);

        for (let i = 0; i <= samples; i++) {
          const frac = i / samples;
          const u = -uRange + frac * 2 * uRange;
          const res = evalMixture1DSlice(u, unimodal.u1, unimodal.u2, state.modeWeight, state.sigma);
          const duMle = u - unimodal.uMean;
          const mleD = mleInvNorm * Math.exp(-duMle * duMle * mleInvTwoVar);
          if (res.density > maxDensity) maxDensity = res.density;
          if (state.showUnimodalFit && mleD > maxDensity) maxDensity = mleD;
          pts.push({ u, x: plotX + frac * plotW, density: res.density, mleD, score: res.score });
        }

        const densityToY = (d) => baseY - (d / (maxDensity * 1.12)) * plotH;
        // Smooth tanh compression for 1D score so ±30 void cliffs remain legible inside the strip
        const scoreScale = state.breakActive ? 0.12 : 0.24;
        const scoreToY = (s) => scoreMidY - Math.tanh(s * scoreScale) * (plotH * 0.44);

        // Baseline & score zero-line
        ctx.beginPath();
        ctx.moveTo(plotX, baseY);
        ctx.lineTo(plotX + plotW, baseY);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(plotX, scoreMidY);
        ctx.lineTo(plotX + plotW, scoreMidY);
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle =
          hoverVar === 'score' ? 'rgba(167, 139, 250, 0.55)' : 'rgba(167, 139, 250, 0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = `600 8px ${MONO_FONT}`;
        ctx.fillStyle = 'rgba(167, 139, 250, 0.65)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('s=0', plotX + 2, scoreMidY - 2);

        // 1. Bimodal density p(u) gradient fill + glowing stroke
        const fillGrad = ctx.createLinearGradient(plotX, 0, plotX + plotW, 0);
        fillGrad.addColorStop(0.12, `rgba(${PALETTE.cyanRgb}, 0.26)`);
        fillGrad.addColorStop(0.5, `rgba(${PALETTE.cyanRgb}, 0.14)`);
        fillGrad.addColorStop(0.88, `rgba(${PALETTE.emeraldRgb}, 0.26)`);

        ctx.beginPath();
        ctx.moveTo(pts[0].x, baseY);
        for (let i = 0; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, densityToY(pts[i].density));
        }
        ctx.lineTo(pts[pts.length - 1].x, baseY);
        ctx.closePath();
        ctx.fillStyle = fillGrad;
        ctx.fill();

        const strokeGrad = ctx.createLinearGradient(plotX, 0, plotX + plotW, 0);
        strokeGrad.addColorStop(0.2, PALETTE.cyan);
        strokeGrad.addColorStop(0.8, PALETTE.emerald);

        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const py = densityToY(pts[i].density);
          if (i === 0) ctx.moveTo(pts[i].x, py);
          else ctx.lineTo(pts[i].x, py);
        }
        ctx.strokeStyle = strokeGrad;
        ctx.lineWidth = 2.0;
        ctx.stroke();

        // 2. Optional Single-Gaussian MLE curve (Crimson dashed peaking over the valley!)
        if (state.showUnimodalFit) {
          const hiMean = hoverVar === 'mean' || hoverVar === 'valleyDensity';
          ctx.beginPath();
          for (let i = 0; i < pts.length; i++) {
            const py = densityToY(pts[i].mleD);
            if (i === 0) ctx.moveTo(pts[i].x, py);
            else ctx.lineTo(pts[i].x, py);
          }
          ctx.setLineDash([5, 4]);
          ctx.strokeStyle = `rgba(${PALETTE.crimsonRgb}, ${hiMean ? 0.96 : 0.72})`;
          ctx.lineWidth = hiMean ? 2.1 : 1.5;
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // 3. Exact 1D score function s(u) = d/du log p(u) (Violet dashed curve)
        const hiScore = hoverVar === 'score';
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const py = scoreToY(pts[i].score);
          if (i === 0) ctx.moveTo(pts[i].x, py);
          else ctx.lineTo(pts[i].x, py);
        }
        ctx.setLineDash(hiScore ? [6, 3] : [4, 4]);
        ctx.strokeStyle = hiScore ? '#C4B5FD' : PALETTE.violet;
        ctx.lineWidth = hiScore ? 2.4 : 1.65;
        if (hiScore) {
          ctx.shadowColor = PALETTE.violet;
          ctx.shadowBlur = 10;
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        // 4. Score zero-crossing dots (stable peaks + unstable saddle)
        for (let z = 0; z < zeros.length; z++) {
          const zero = zeros[z];
          const zx = uToX(zero.u);
          if (zx < plotX || zx > plotX + plotW) continue;
          ctx.beginPath();
          ctx.arc(zx, scoreMidY, zero.kind === 'peak' ? 3.5 : 4.2, 0, Math.PI * 2);
          if (zero.kind === 'peak') {
            ctx.fillStyle = zero.u <= 0 ? PALETTE.cyan : PALETTE.emerald;
            ctx.fill();
          } else {
            ctx.fillStyle = PALETTE.bgStrip;
            ctx.fill();
            ctx.strokeStyle = state.breakActive ? PALETTE.crimson : PALETTE.amber;
            ctx.lineWidth = 1.8;
            ctx.stroke();
          }
        }

        // 5. Mode vertical ticks μ₁ & μ₂ (plus ±1σ brackets when hovering sigma)
        const xMu1 = uToX(unimodal.u1);
        const xMu2 = uToX(unimodal.u2);
        const modeTicks = [
          { x: xMu1, u: unimodal.u1, label: 'μ₁', color: PALETTE.cyan },
          { x: xMu2, u: unimodal.u2, label: 'μ₂', color: PALETTE.emerald },
        ];

        for (let i = 0; i < modeTicks.length; i++) {
          const mt = modeTicks[i];
          const dAtMode = evalMixture1DSlice(mt.u, unimodal.u1, unimodal.u2, state.modeWeight, state.sigma).density;
          const yTop = densityToY(dAtMode);

          ctx.beginPath();
          ctx.moveTo(mt.x, baseY);
          ctx.lineTo(mt.x, yTop);
          ctx.strokeStyle = mt.color;
          ctx.globalAlpha = 0.45;
          ctx.lineWidth = 1.1;
          ctx.stroke();
          ctx.globalAlpha = 1;

          ctx.beginPath();
          ctx.arc(mt.x, yTop, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = mt.color;
          ctx.fill();

          ctx.font = `700 8.8px ${MONO_FONT}`;
          ctx.fillStyle = mt.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(mt.label, mt.x, baseY + 3);

          // Highlight ±1σ width bar on 1D curve when hovering sigma
          if (hoverVar === 'sigma') {
            const xL = uToX(mt.u - state.sigma);
            const xR = uToX(mt.u + state.sigma);
            const yBar = densityToY(dAtMode * 0.6065);
            ctx.beginPath();
            ctx.moveTo(xL, yBar);
            ctx.lineTo(xR, yBar);
            ctx.strokeStyle = mt.color;
            ctx.lineWidth = 2.0;
            ctx.stroke();
          }
        }

        // 6. E[x] marker & valley density dip highlight
        const xMean = uToX(unimodal.uMean);
        const dMean1D = evalMixture1DSlice(
          unimodal.uMean,
          unimodal.u1,
          unimodal.u2,
          state.modeWeight,
          state.sigma
        ).density;
        const yMeanDensity = densityToY(dMean1D);
        const hiValley = hoverVar === 'valleyDensity' || hoverVar === 'mean';
        const meanColor = isCollapsed || state.breakActive ? PALETTE.crimson : PALETTE.amber;

        // Valley highlight band when hovering valleyDensity
        if (hoverVar === 'valleyDensity') {
          const bandW = Math.max(26, (xMu2 - xMu1) * 0.24);
          ctx.fillStyle = `rgba(${PALETTE.crimsonRgb}, 0.16)`;
          ctx.fillRect(xMean - bandW * 0.5, plotY, bandW, plotH);
        }

        ctx.beginPath();
        ctx.moveTo(xMean, plotY + 2);
        ctx.lineTo(xMean, baseY);
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = meanColor;
        ctx.lineWidth = hiValley ? 2.2 : 1.4;
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(xMean, yMeanDensity, hiValley ? 5.2 : 3.8, 0, Math.PI * 2);
        ctx.fillStyle = meanColor;
        ctx.shadowColor = meanColor;
        ctx.shadowBlur = hiValley ? 12 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = `700 8.8px ${MONO_FONT}`;
        ctx.fillStyle = meanColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('E[x]', xMean, baseY + 3);

        // Callout showing valley dip when hovering valleyDensity or collapsed
        if (hoverVar === 'valleyDensity' || state.breakActive) {
          const tag = `p(E[x])=${
            summary.atMean.density < 0.0005 ? '0.000' : summary.atMean.density.toFixed(3)
          }`;
          ctx.font = `700 8.5px ${MONO_FONT}`;
          const tw = ctx.measureText(tag).width + 10;
          const bx = clamp(xMean - tw * 0.5, plotX + 2, plotX + plotW - tw - 2);
          const by = clamp(yMeanDensity - 22, plotY + 2, baseY - 20);
          drawRoundedRect(ctx, bx, by, tw, 15, 4);
          ctx.fillStyle = 'rgba(20, 10, 14, 0.90)';
          ctx.fill();
          ctx.strokeStyle = meanColor;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = '#FFE4E8';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tag, bx + tw * 0.5, by + 7.8);
        }

        ctx.restore();
      }

      function render(sim) {
        const W = state.width;
        const H = state.height;
        const topH = state.topH;
        const hoverVar = state.hoverVar;

        ctx.save();
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

        // Clear full dead-front surface
        ctx.fillStyle = PALETTE.bg;
        ctx.fillRect(0, 0, W, H);

        // --- TOP 72%: 2D Density & Score Field ---
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, topH);
        ctx.clip();

        renderTopBackgroundGrid(ctx, W, topH);
        renderModeIsoContours(ctx, hoverVar);
        renderSliceAxis(ctx, sim.summary);
        renderScoreVectorField(ctx, hoverVar);
        renderUnimodalMLEOverlay(ctx, sim.summary, hoverVar);
        renderLangevinParticles(ctx, hoverVar);
        renderUnimodalMeanMarker(ctx, sim.summary, hoverVar);
        renderVoidProbe(ctx, sim.summary);
        renderDraggableModeHandles(ctx);
        renderTopHUD(ctx, sim, W, topH);

        ctx.restore();

        // --- BOTTOM 28%: Live 1D Marginal Slice ---
        renderBottom1DSlice(ctx, sim, hoverVar);

        ctx.restore();
      }

      // 60 FPS Animation Loop
      let rafId = 0;
      let lastTs = performance.now();

      function frame(ts) {
        const dt = clamp((ts - lastTs) * 0.001, 0.001, 0.05);
        lastTs = ts;
        state.time += dt;

        const sim = stepSimulation(dt);
        render(sim);
        syncShellReadouts(sim);

        rafId = requestAnimationFrame(frame);
      }

      rafId = requestAnimationFrame(frame);

      return () => {
        cancelAnimationFrame(rafId);
        if (resizeObserver) resizeObserver.disconnect();
        window.removeEventListener('resize', updateViewportMetrics);
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerup', onPointerUp);
        canvas.removeEventListener('pointercancel', onPointerUp);
        for (const fn of unsubs) {
          try {
            fn();
          } catch {
            // Ignore cleanup errors
          }
        }
        if (canvas.parentNode === host) {
          host.removeChild(canvas);
        }
      };
    },
  };
}

export default createF14ProbabilityLab;
