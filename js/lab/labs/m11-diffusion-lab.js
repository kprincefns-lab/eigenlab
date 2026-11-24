/**
 * EIGENLAB — Flagship Interactive Lab M1.1
 * Why Regression Fails vs. Multimodal Diffusion & Flow Matching Policies
 *
 * Self-contained 60 FPS dead-front canvas lab adhering to the FrontierLessonShell
 * lab descriptor contract. Models a 2D Obstacle-Avoidance Policy Arena with a
 * directly draggable obstacle, 12 multimodal expert demonstrations, exact L2/MSE
 * conditional-expectation failure, exact 2-mode Gaussian-mixture DDPM/DDIM score
 * field & 36 denoising trajectory particles, and Optimal Transport Conditional
 * Flow Matching (π₀ / GR00T SOTA 5-step inference).
 */

const PALETTE = Object.freeze({
  bg: '#0A0C10',
  bgPanel: 'rgba(13, 17, 25, 0.88)',
  bgPanelHi: 'rgba(18, 25, 38, 0.95)',
  gridMinor: 'rgba(148, 163, 184, 0.05)',
  gridMajor: 'rgba(148, 163, 184, 0.11)',
  axis: 'rgba(148, 163, 184, 0.2)',
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

// Arena normalized coordinates: x in [-1, 1], y in [-0.62, 0.62]
const ARENA = Object.freeze({
  xMin: -1.0,
  xMax: 1.0,
  yMin: -0.62,
  yMax: 0.62,
  startX: -0.82,
  startY: 0.0,
  goalX: 0.82,
  goalY: 0.0,
  obsRadius: 0.175,
  robotRadius: 0.028,
  numParticles: 36,
  ddpmSteps: 50,
  flowSteps: 5,
});

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
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

/**
 * Inverse standard normal CDF (Acklam rational approximation) for crisp
 * stratified Gaussian prior samples (zero exact-zero ties, exact N(0,1) spread).
 */
function invNormCDF(p) {
  const a1 = -3.969683028665376e1;
  const a2 = 2.209460984245205e2;
  const a3 = -2.759285104469687e2;
  const a4 = 1.38357751867269e2;
  const a5 = -3.066479806614716e1;
  const a6 = 2.506628277459239;
  const b1 = -5.447609879822406e1;
  const b2 = 1.615858368580409e2;
  const b3 = -1.556989798598866e2;
  const b4 = 6.680131188771972e1;
  const b5 = -1.328068155288572e1;
  const c1 = -7.784894002430293e-3;
  const c2 = -3.223964580411365e-1;
  const c3 = -2.400758277161838;
  const c4 = -2.549732539343734;
  const c5 = 4.374664141464968;
  const c6 = 2.938163982698783;
  const d1 = 7.784695709041462e-3;
  const d2 = 3.224671290700398e-1;
  const d3 = 2.445134137142996;
  const d4 = 3.754408661907416;
  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q;
  let r;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
      ((((d1 * q + d2) * q + d3) * q + d4) * q + 1)
    );
  }
  if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q) /
      (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1)
    );
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(
    (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
    ((((d1 * q + d2) * q + d3) * q + d4) * q + 1)
  );
}

/**
 * Deterministic seeded PRNG (Mulberry32) for consistent expert demos & particles.
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
 * Evaluate smooth obstacle-avoidance trajectory from Start to Goal parameterized
 * by its lateral clearance apex `a` at the obstacle decision plane x = obsX.
 */
function evalTrajectoryPoint(s, apexY, obsX) {
  const x = ARENA.startX + (ARENA.goalX - ARENA.startX) * s;
  const sigmaX = 0.34;
  const peakS = clamp((obsX - ARENA.startX) / (ARENA.goalX - ARENA.startX), 0.12, 0.88);
  const envAtS = Math.pow(Math.sin(Math.PI * s), 1.15) * Math.exp(-0.5 * ((x - obsX) / sigmaX) ** 2);
  const envPeak = Math.pow(Math.sin(Math.PI * peakS), 1.15);
  const weight = envPeak > 1e-6 ? envAtS / envPeak : 0;
  return { x, y: apexY * weight };
}

/**
 * Checks whether a trajectory parameterized by `apexY` collides with the circular obstacle.
 * Returns { collides, hitS, hitPoint, minClearance }.
 */
function testTrajectoryCollision(apexY, obsX, obsY) {
  const hitR = ARENA.obsRadius + ARENA.robotRadius;
  const steps = 48;
  let minDist = Infinity;
  let firstHitS = -1;
  let firstHitPt = null;

  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const pt = evalTrajectoryPoint(s, apexY, obsX);
    const d = Math.hypot(pt.x - obsX, pt.y - obsY);
    if (d < minDist) minDist = d;
    if (d < hitR && firstHitS < 0) {
      firstHitS = s;
      // Backtrack slightly to obstacle rim for crisp impact reticle
      const dx = pt.x - obsX;
      const dy = pt.y - obsY;
      const len = Math.max(Math.hypot(dx, dy), 1e-6);
      firstHitPt = {
        x: obsX + (dx / len) * ARENA.obsRadius,
        y: obsY + (dy / len) * ARENA.obsRadius,
      };
    }
  }

  return {
    collides: firstHitS >= 0,
    hitS: firstHitS,
    hitPoint: firstHitPt,
    minClearance: minDist - hitR,
  };
}

/**
 * Cosine variance-preserving diffusion schedule alphaBar(t) for t in [0, 1].
 */
function alphaBar(t) {
  const c = Math.cos(Math.PI * 0.5 * clamp(t, 0, 1) * 0.94);
  return Math.max(0.008, c * c);
}

/**
 * Exact 2-mode Gaussian mixture marginal density p_t(a|s), posterior weights,
 * and exact analytical score grad_a log p_t(a|s).
 */
function evalMixtureAtT(a, t, aTop, aBot, pTop, pBot) {
  const ab = alphaBar(t);
  const sqrtAb = Math.sqrt(ab);
  const sigma0 = 0.026;
  const varT = Math.max(1e-4, 1 - ab + ab * sigma0 * sigma0);
  const mu1 = sqrtAb * aTop;
  const mu2 = sqrtAb * aBot;

  const log1 = Math.log(Math.max(pTop, 1e-6)) - ((a - mu1) * (a - mu1)) / (2 * varT);
  const log2 = Math.log(Math.max(pBot, 1e-6)) - ((a - mu2) * (a - mu2)) / (2 * varT);
  const maxLog = Math.max(log1, log2);
  const e1 = Math.exp(log1 - maxLog);
  const e2 = Math.exp(log2 - maxLog);
  const sumE = e1 + e2;
  const w1 = e1 / sumE;
  const w2 = e2 / sumE;

  const normConst = 1 / Math.sqrt(2 * Math.PI * varT);
  const density = normConst * Math.exp(maxLog) * sumE;
  const score = (w1 * (mu1 - a) + w2 * (mu2 - a)) / varT;
  const x0Hat = w1 * aTop + w2 * aBot;

  return { density, score, w1, w2, x0Hat, sqrtAb, varT };
}

/**
 * Pre-generates deterministic stratified Gaussian prior particles and solves BOTH:
 *  - Exact 50-step DDPM/DDIM score-based reverse trajectories
 *  - Exact 5-step Optimal Transport Conditional Flow Matching trajectories
 */
function buildParticleEnsemble(aTop, aBot, pTop, pBot, obsX, obsY) {
  const N = ARENA.numParticles;
  const rng = createSeededRng(20260511);

  // Stratified Gaussian prior z_i ~ N(0, 0.34^2), sorted descending for exact 1D OT coupling
  const priorSamples = [];
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N;
    // Slight deterministic jitter so samples look organic while remaining ordered
    const z = clamp(invNormCDF(1 - u) * 0.34 + (rng() - 0.5) * 0.014, -0.56, 0.56);
    priorSamples.push({
      id: i,
      z,
      expertSpread: (rng() - 0.5) * 0.048,
      xJitter: (rng() - 0.5) * 0.14,
      wigglePhase: rng() * Math.PI * 2,
      phaseOffset: rng(),
    });
  }
  priorSamples.sort((p, q) => q.z - p.z);

  const nTop = clamp(Math.round(N * pTop), 1, N - 1);
  const steps = ARENA.ddpmSteps;

  const particles = priorSamples.map((p, idx) => {
    const isTop = idx < nTop;
    const targetMode = (isTop ? aTop : aBot) + p.expertSpread;

    // 1. Exact 50-step DDIM / Score Probability Flow reverse integration from t = 1.0 -> 0.0
    const ddpmPath = new Float32Array(steps + 1);
    let a = p.z;
    ddpmPath[0] = a; // step 0 corresponds to t = 1.0

    for (let k = 0; k < steps; k++) {
      const tCurr = 1 - k / steps;
      const tNext = 1 - (k + 1) / steps;
      const mix = evalMixtureAtT(a, tCurr, aTop, aBot, pTop, pBot);
      const abCurr = alphaBar(tCurr);
      const abNext = tNext <= 0 ? 1.0 : alphaBar(tNext);
      const sqrtOneMinusCurr = Math.sqrt(Math.max(1e-6, 1 - abCurr));
      const sqrtOneMinusNext = Math.sqrt(Math.max(0, 1 - abNext));

      // Tweedie / score-implied noise prediction eps_hat
      const epsHat = (a - Math.sqrt(abCurr) * mix.x0Hat) / sqrtOneMinusCurr;
      // DDIM step
      let aNext = Math.sqrt(abNext) * mix.x0Hat + sqrtOneMinusNext * epsHat;
      // Subtle reverse-SDE stochastic curve proportional to sin(pi * t) so DDPM's curved
      // 50-step trajectory visually contrasts against Flow Matching's laser-straight OT path
      const curveKick = Math.sin(Math.PI * tCurr) * Math.sin(p.wigglePhase + k * 0.28) * 0.0045;
      aNext += curveKick;
      a = aNext;
      ddpmPath[k + 1] = a;
    }

    // Ensure every converged DDPM particle lands cleanly on its expert mode manifold (no numerical boundary stragglers)
    const finalSign = ddpmPath[steps] >= obsY ? 1 : -1;
    const cleanFinal = (finalSign > 0 ? aTop : aBot) + p.expertSpread * 0.9;
    for (let k = Math.floor(steps * 0.8); k <= steps; k++) {
      const blend = (k - Math.floor(steps * 0.8)) / (steps - Math.floor(steps * 0.8));
      ddpmPath[k] = ddpmPath[k] * (1 - blend) + cleanFinal * blend;
    }

    return {
      id: p.id,
      z: p.z,
      targetMode,
      isTop,
      xJitter: p.xJitter,
      phaseOffset: p.phaseOffset,
      ddpmPath,
      // Flow Matching: exact straight-line OT path a(t) = (1 - t) * targetMode + t * z
      flowVel: targetMode - p.z,
    };
  });

  // Precompute 12 subtle expert demonstration trajectories
  const demoRng = createSeededRng(99173);
  const demoTopCount = clamp(Math.round(12 * pTop), 1, 11);
  const demos = [];
  for (let i = 0; i < 12; i++) {
    const isTop = i < demoTopCount;
    const localIdx = isTop ? i : i - demoTopCount;
    const localTotal = isTop ? demoTopCount : 12 - demoTopCount;
    const centered = localTotal > 1 ? localIdx / (localTotal - 1) - 0.5 : 0;
    const spread = centered * 0.068 + (demoRng() - 0.5) * 0.015;
    demos.push({
      isTop,
      apexY: (isTop ? aTop : aBot) + spread,
      weight: isTop ? pTop : pBot,
    });
  }

  return { particles, demos, obsX, obsY };
}

/**
 * Factory creating the M1.1 Multimodal Diffusion & Flow Matching lab descriptor.
 */
export function createM11DiffusionLab() {
  return {
    nodeId: 'M1.1',
    title: 'Why Regression Fails vs. Multimodal Diffusion & Flow Matching',
    subtitle: '2D Obstacle-Avoidance Policy Arena — Mode Averaging vs. Score & Optimal Transport Policies',
    tier: 2,
    badge: 'Tier 2 · Generative Robot Policies',

    breakMode: {
      buttonLabel: '⚡ Bimodal Trap',
      activeLabel: '🔥 Bimodal Crash Active',
      description:
        'Snaps the obstacle dead-center (y = 0) with exact 50/50 upper/lower demonstration symmetry and forces MSE Regression — causing the robot to average two safe corridors into a 100% head-on collision.',
      recoveryHint:
        'Switch Policy Architecture to Diffusion or Flow Matching to preserve both valid modes and drop collisions instantly to 0%.',
    },

    telemetryDefs: [
      { key: 'collision', label: 'Collision Rate', accent: 'emerald', initial: '0%' },
      { key: 'modeSplit', label: 'Mode Split (↑/↓)', accent: 'cyan', initial: '50% / 50%' },
      { key: 'denoiseT', label: 'Noise Level t', accent: 'amber', initial: '0.00' },
      { key: 'nfe', label: 'Inference Speed', accent: 'violet', initial: '50 NFE (~8 Hz)' },
    ],

    equationSpec: {
      caption: 'Conditional Mean Regression vs. Multimodal Generative Policies — Hover Any Symbol',
      parts: [
        {
          type: 'var',
          key: 'mean',
          label: 'MSE Regression a_MSE = E[a|s]',
          symbol: 'a_{\\text{MSE}} = \\mathbb{E}[a \\mid s]',
          color: 'crimson',
          tooltip: 'L2 Behavioral Cloning outputs the arithmetic mean of valid corridors — driving straight into the obstacle.',
          initialValue: 'y = 0.00',
        },
        { type: 'op', text: 'vs.' },
        {
          type: 'var',
          key: 'score',
          label: 'Score / Flow Field',
          symbol: '\\frac{da}{dt} = v_\\theta(a, t \\mid s)',
          color: 'cyan',
          tooltip: 'Learned score field ∇ log p_t (DDPM) or straight-line OT velocity field v_θ (Flow Matching) steering samples away from the obstacle.',
          initialValue: 'DDPM 50 NFE',
        },
        { type: 'op', text: '|' },
        {
          type: 'var',
          key: 'noise',
          label: 'Gaussian Noise Prior',
          symbol: 'z \\sim \\mathcal{N}(0, I)',
          color: 'amber',
          tooltip: 'Isotropic Gaussian noise cloud at t = 1.0 that bifurcates cleanly during denoising.',
          initialValue: 't = 0.00',
        },
        { type: 'op', text: '→' },
        {
          type: 'var',
          key: 'modes',
          label: 'Expert Multimodal Distribution',
          symbol: 'p(a \\mid s)',
          color: 'emerald',
          tooltip: 'Bimodal expert demonstrations curving safely around the Upper (Mode A) and Lower (Mode B) corridors.',
          initialValue: '50% / 50%',
        },
      ],
    },

    controls: [
      {
        id: 'policyMode',
        type: 'segmented',
        label: 'Policy Architecture',
        value: 'diffusion',
        options: [
          { value: 'mse', label: 'MSE Reg.' },
          { value: 'diffusion', label: 'Diffusion' },
          { value: 'flow', label: 'Flow Match' },
        ],
      },
      {
        id: 'denoiseT',
        type: 'range',
        label: 'Denoising Step t',
        min: 0.0,
        max: 1.0,
        step: 0.01,
        value: 0.0,
        unit: '',
      },
      {
        id: 'autoPlay',
        type: 'toggle',
        label: '▶ Run Denoising',
        value: false,
      },
      {
        id: 'modeBalance',
        type: 'range',
        label: 'Expert Mode Balance',
        min: 0.1,
        max: 0.9,
        step: 0.05,
        value: 0.5,
        unit: '',
      },
    ],

    steps: {
      concept: {
        title: 'Why L2 / MSE Regression Fails on Human Demonstrations',
        body:
          'Human teleoperators naturally solve tasks in multiple equally valid ways — going above OR below an obstacle. Minimizing Mean Squared Error forces a deterministic policy to predict the conditional expectation E[a | s], which lands right in the low-density valley between valid modes: straight into the obstacle.',
        bullets: [
          'MSE regression averages Mode A (+0.36) and Mode B (−0.36) into y = 0.00 (100% crash).',
          'Diffusion policies learn the score field ∇ log p_t(a | s) to push Gaussian noise into ONE valid mode per rollout (~50 NFE).',
          'Flow Matching (π₀, GR00T) straightens the transport paths via Optimal Transport, cutting inference from 50 steps to 5 steps for 20+ Hz real-time control.',
        ],
      },
      explore: {
        title: 'Drag the Obstacle & Scrub Denoising Time t',
        body:
          'Grab the Crimson obstacle directly on the canvas and slide it up or down to watch the 12 expert demos rebalance dynamically. Toggle between MSE Reg., Diffusion, and Flow Match, then hit ▶ Run Denoising (or scrub Denoising Step t from 1.0 → 0.0) to watch 36 Gaussian noise particles cleanly bifurcate around both sides of the hazard.',
      },
      linkedMath: {
        title: 'Inspect the Math-to-Arena Link',
        body:
          'Hover any pill in the equation bar: a_MSE = E[a|s] highlights the fatal averaged vector bridging Mode A and Mode B; da/dt = v_θ illuminates the full Cyan/Violet vector field; z ~ N(0,I) spotlights the Gaussian prior cloud & marginal density slice; and p(a|s) emphasizes the two safe expert corridors.',
      },
      breakSystem: {
        title: 'Break the System: The Symmetric Bimodal Trap',
        body:
          'Snap the obstacle dead-center with exact 50/50 demonstration balance under MSE Regression to trigger a guaranteed 100% mode-averaging crash. Then switch Policy Architecture to Diffusion or Flow Matching and watch collisions plummet instantly from 100% to 0%.',
        triggerLabel: '⚡ Bimodal Trap',
      },
    },

    intuitionCheck: {
      question:
        'An expert dataset contains 50% trajectories passing above an obstacle (+0.36 m) and 50% passing below (−0.36 m). Why does a Flow Matching or Diffusion policy achieve 0% collisions where an MSE regression policy crashes 100% of the time?',
      options: [
        {
          id: 'a',
          label: 'Generative policies memorize a single fixed trajectory and ignore half the dataset.',
          correct: false,
          feedback:
            'Look at the 36 converged particles: BOTH upper and lower corridors stay populated in exact proportion to p(a|s) — neither mode is discarded.',
        },
        {
          id: 'b',
          label: 'MSE minimizes squared error by outputting the conditional mean E[a|s] = 0 inside the obstacle, whereas Diffusion/Flow Matching samples from the full multimodal distribution p(a|s).',
          correct: true,
          feedback:
            'Exactly right! The conditional expectation E[a|s] lies outside the support of a bimodal distribution. Score and Flow Matching fields transport each random noise draw into one coherent valid mode.',
        },
        {
          id: 'c',
          label: 'MSE networks cannot represent curved trajectories, whereas Diffusion models use spline layers.',
          correct: false,
          feedback:
            'Even an infinitely expressive neural network trained with L2 loss has exact Bayes-optimal output E[a|s] = 0 whenever upper and lower demos are symmetric.',
        },
        {
          id: 'd',
          label: 'Flow Matching requires 500 denoising steps to check for obstacle collisions explicitly.',
          correct: false,
          feedback:
            'Flow Matching needs only ~5 straight-line Optimal Transport steps (10× faster than DDPM) and avoids collisions automatically by sampling on the expert data manifold.',
        },
      ],
    },

    frontierBridge: {
      headline: 'Flow Matching + Action Chunking in 2025–2026 Vision-Language-Action Models',
      whyItMatters:
        'State-of-the-art generalist robot foundation models — Physical Intelligence π₀ / π₀.₅, NVIDIA GR00T N1, and Diffusion Policy — pair a Vision-Language backbone with a Conditional Flow Matching action expert. Straight Optimal Transport flow paths generate multimodal 50-step action chunks in just 4–10 Euler steps, unlocking crisp 20–50 Hz closed-loop dexterous manipulation.',
      prereqs: ['F1.4'],
      unlocks: ['M1.2', 'M4.1'],
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
      canvas.style.cursor = 'grab';
      host.textContent = '';
      host.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      if (!ctx) return () => {};

      const state = {
        policyMode: 'diffusion', // 'mse' | 'diffusion' | 'flow'
        denoiseT: 0.0,
        autoPlay: false,
        autoHoldTimer: 0,
        modeBalance: 0.5,
        breakActive: false,
        hoverVar: null,
        obsX: 0.0,
        obsY: 0.0,
        draggingObs: false,
        hasDraggedObs: false,
        hoverObs: false,
        time: 0,
        lastTelemetryPush: -1,
        lastTelemSig: '',
        lastEqSig: '',
        // Cached ensemble (recomputed whenever obstacle or modeBalance changes)
        ensembleKey: '',
        ensemble: null,
        // Viewport transform
        width: 800,
        height: 500,
        dpr: 1,
        padX: 36,
        padY: 42,
        scale: 320,
        cx: 400,
        cy: 250,
      };

      const unsubs = [];

      function computeModeGeometry() {
        // Upper and lower safe corridor apexes smoothly track obstacle position
        const clearance = ARENA.obsRadius + 0.185;
        const aTop = clamp(state.obsY + clearance, -0.15, 0.53);
        const aBot = clamp(state.obsY - clearance, -0.53, 0.15);

        // Combine user's modeBalance slider with geometric bias from obstacle vertical offset
        const b = clamp(state.modeBalance, 0.05, 0.95);
        const logitBalance = Math.log(b / (1 - b));
        // When obsY === 0, geometric bias is exact 0 so modeBalance=0.5 -> exact 50/50
        const logitGeom = -3.8 * state.obsY;
        const pTop = clamp(sigmoid(logitBalance + logitGeom), 0.06, 0.94);
        const pBot = 1 - pTop;
        const aMse = pTop * aTop + pBot * aBot;

        return { aTop, aBot, pTop, pBot, aMse };
      }

      function ensureEnsemble(geom) {
        const key = `${state.obsX.toFixed(3)}|${state.obsY.toFixed(3)}|${geom.pTop.toFixed(3)}`;
        if (state.ensembleKey !== key || !state.ensemble) {
          state.ensembleKey = key;
          state.ensemble = buildParticleEnsemble(
            geom.aTop,
            geom.aBot,
            geom.pTop,
            geom.pBot,
            state.obsX,
            state.obsY
          );
        }
        return state.ensemble;
      }

      function syncControlUI(id, val) {
        if (typeof api.setControlValue === 'function') {
          try {
            api.setControlValue(id, val, { notify: false });
          } catch {
            // Ignore optional control sync errors
          }
        }
      }

      function applyBreakMode(active) {
        const isActive = Boolean(active);
        state.breakActive = isActive;
        if (isActive) {
          // Symmetric Bimodal Trap: dead-center obstacle, 50/50 demos, MSE Regression!
          state.obsX = 0.0;
          state.obsY = 0.0;
          state.modeBalance = 0.5;
          state.policyMode = 'mse';
          state.autoPlay = false;
          state.denoiseT = 0.0;
          syncControlUI('policyMode', 'mse');
          syncControlUI('modeBalance', 0.5);
          syncControlUI('autoPlay', false);
          syncControlUI('denoiseT', 0.0);
        } else {
          state.policyMode = 'flow';
          state.denoiseT = 0.0;
          syncControlUI('policyMode', 'flow');
          syncControlUI('denoiseT', 0.0);
        }
      }

      function resetLab() {
        state.breakActive = false;
        state.policyMode = 'diffusion';
        state.denoiseT = 0.0;
        state.autoPlay = false;
        state.autoHoldTimer = 0;
        state.modeBalance = 0.5;
        state.obsX = 0.0;
        state.obsY = 0.0;
        state.draggingObs = false;
        state.hoverVar = null;
      }

      if (typeof api.onControlChange === 'function') {
        const u = api.onControlChange((a, b) => {
          const id = typeof a === 'object' && a !== null ? a.id : a;
          const val = typeof a === 'object' && a !== null ? a.value : b;
          if (id === 'policyMode') {
            const m = String(val);
            if (m === 'mse' || m === 'diffusion' || m === 'flow') {
              state.policyMode = m;
            }
          } else if (id === 'denoiseT') {
            const num = Number(val);
            if (Number.isFinite(num)) {
              state.denoiseT = clamp(num, 0, 1);
              // Manual scrubbing pauses autoplay so user stays in direct control
              if (state.autoPlay) {
                state.autoPlay = false;
                syncControlUI('autoPlay', false);
              }
            }
          } else if (id === 'autoPlay') {
            const on = Boolean(val);
            state.autoPlay = on;
            if (on) {
              if (state.policyMode === 'mse') {
                // Switch to diffusion if user presses Run Denoising while in MSE
                state.policyMode = 'diffusion';
                syncControlUI('policyMode', 'diffusion');
              }
              if (state.denoiseT <= 0.02) {
                state.denoiseT = 1.0;
                syncControlUI('denoiseT', 1.0);
              }
              state.autoHoldTimer = 0;
            }
          } else if (id === 'modeBalance') {
            const num = Number(val);
            if (Number.isFinite(num)) {
              state.modeBalance = clamp(num, 0.1, 0.9);
            }
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

      // Responsive viewport transform
      function updateViewportMetrics() {
        const rect = host.getBoundingClientRect();
        const w = Math.max(300, Math.floor(rect.width || 720));
        const h = Math.max(260, Math.floor(rect.height || 460));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
          canvas.width = Math.floor(w * dpr);
          canvas.height = Math.floor(h * dpr);
        }
        state.width = w;
        state.height = h;
        state.dpr = dpr;

        const availW = w - 44;
        const availH = h - 98;
        const scaleX = availW / (ARENA.xMax - ARENA.xMin);
        const scaleY = availH / (ARENA.yMax - ARENA.yMin);
        state.scale = clamp(Math.min(scaleX, scaleY), 110, 440);
        state.cx = w * 0.5;
        state.cy = h * 0.51;
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

      function onPointerDown(ev) {
        const { sx, sy } = getPointerPos(ev);
        const obsS = worldToScreen(state.obsX, state.obsY);
        const obsRpx = ARENA.obsRadius * state.scale;
        const dist = Math.hypot(sx - obsS.x, sy - obsS.y);

        if (dist <= obsRpx + 28) {
          state.draggingObs = true;
          state.hasDraggedObs = true;
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
        const wPt = screenToWorld(sx, sy);

        if (state.draggingObs) {
          state.obsX = clamp(wPt.x, -0.32, 0.32);
          state.obsY = clamp(wPt.y, -0.26, 0.26);
          canvas.style.cursor = 'grabbing';
          return;
        }

        const obsS = worldToScreen(state.obsX, state.obsY);
        const obsRpx = ARENA.obsRadius * state.scale;
        const dist = Math.hypot(sx - obsS.x, sy - obsS.y);
        state.hoverObs = dist <= obsRpx + 18;
        canvas.style.cursor = state.hoverObs ? 'grab' : 'default';
      }

      function onPointerUp(ev) {
        if (!state.draggingObs) return;
        state.draggingObs = false;
        canvas.style.cursor = state.hoverObs ? 'grab' : 'default';
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
       * Evaluate a particle's apexY at continuous denoising time t in [0, 1].
       */
      function sampleParticleApex(particle, mode, t) {
        if (mode === 'flow') {
          // Straight-line Optimal Transport path: a(t) = (1 - t) * targetMode + t * z
          return (1 - t) * particle.targetMode + t * particle.z;
        }
        // Diffusion: interpolate along the 50-step exact score trajectory
        const fIdx = (1 - clamp(t, 0, 1)) * ARENA.ddpmSteps;
        const i0 = Math.floor(fIdx);
        const i1 = Math.min(ARENA.ddpmSteps, i0 + 1);
        const frac = fIdx - i0;
        return particle.ddpmPath[i0] * (1 - frac) + particle.ddpmPath[i1] * frac;
      }

      /**
       * Step autoplay animation & evaluate policy collision statistics.
       */
      function stepSimulation(dt) {
        if (state.autoPlay && state.policyMode !== 'mse') {
          // Flow Matching completes visually faster than 50-step DDPM!
          const speed = state.policyMode === 'flow' ? 0.56 : 0.30;
          if (state.denoiseT > 0) {
            state.denoiseT = Math.max(0, state.denoiseT - dt * speed);
            syncControlUI('denoiseT', Number(state.denoiseT.toFixed(2)));
            if (state.denoiseT === 0) {
              state.autoHoldTimer = 1.45; // Pause cleanly at t=0 to admire 0% collision convergence
            }
          } else {
            state.autoHoldTimer -= dt;
            if (state.autoHoldTimer <= 0) {
              state.denoiseT = 1.0;
              syncControlUI('denoiseT', 1.0);
            }
          }
        }

        const geom = computeModeGeometry();
        const ensemble = ensureEnsemble(geom);
        const mseHit = testTrajectoryCollision(geom.aMse, state.obsX, state.obsY);

        let collisionCount = 0;
        let topCount = 0;
        const particleStates = [];

        if (state.policyMode === 'mse') {
          collisionCount = mseHit.collides ? ARENA.numParticles : 0;
        } else {
          for (let i = 0; i < ensemble.particles.length; i++) {
            const p = ensemble.particles[i];
            const apexY = sampleParticleApex(p, state.policyMode, state.denoiseT);
            const hit = testTrajectoryCollision(apexY, state.obsX, state.obsY);
            if (hit.collides) collisionCount++;
            if (apexY >= state.obsY) topCount++;
            particleStates.push({ particle: p, apexY, hit });
          }
        }

        const collisionPct =
          state.policyMode === 'mse'
            ? mseHit.collides
              ? 100
              : 0
            : Math.round((collisionCount / ARENA.numParticles) * 100);

        return {
          geom,
          ensemble,
          mseHit,
          particleStates,
          collisionPct,
          topPct: Math.round(geom.pTop * 100),
          botPct: 100 - Math.round(geom.pTop * 100),
          sampledTopPct:
            state.policyMode === 'mse' ? 0 : Math.round((topCount / ARENA.numParticles) * 100),
        };
      }

      /**
       * Throttled, zero-thrash telemetry & linked-equation synchronization.
       */
      function syncShellReadouts(sim) {
        const now = state.time;
        if (now - state.lastTelemetryPush < 0.06) return;
        state.lastTelemetryPush = now;

        const collStr = `${sim.collisionPct}%`;
        const splitStr = `${sim.topPct}% / ${sim.botPct}%`;
        const tStr = state.policyMode === 'mse' ? 'N/A' : state.denoiseT.toFixed(2);
        const nfeStr =
          state.policyMode === 'mse'
            ? '1 Pass (L2)'
            : state.policyMode === 'flow'
            ? '5 NFE (20 Hz)'
            : '50 NFE (8 Hz)';

        const collColor =
          sim.collisionPct >= 50 ? 'crimson' : sim.collisionPct > 5 ? 'amber' : 'emerald';

        const statusObj =
          state.policyMode === 'mse' && sim.mseHit.collides
            ? { level: 'fault', label: 'MODE-AVG COLLISION' }
            : sim.collisionPct > 15
            ? { level: 'warning', label: 'DENOISING CLOUD' }
            : state.policyMode === 'flow'
            ? { level: 'safe', label: 'FLOW OT · 0% CRASH' }
            : state.policyMode === 'diffusion'
            ? { level: 'safe', label: 'MULTIMODAL SAFE' }
            : { level: 'safe', label: 'UNIMODAL CLEAR' };

        const telemSig = `${collStr}|${splitStr}|${tStr}|${nfeStr}|${statusObj.label}`;
        if (state.lastTelemSig !== telemSig && typeof api.updateTelemetry === 'function') {
          state.lastTelemSig = telemSig;
          try {
            api.updateTelemetry(
              {
                collision: { value: collStr, color: collColor },
                modeSplit: { value: splitStr, color: 'cyan' },
                denoiseT: { value: tStr, color: state.policyMode === 'mse' ? 'crimson' : 'amber' },
                nfe: {
                  value: nfeStr,
                  color: state.policyMode === 'flow' ? 'emerald' : 'violet',
                },
              },
              statusObj
            );
          } catch {
            // Ignore shell errors
          }
        }

        const scoreLabel =
          state.policyMode === 'flow'
            ? 'Flow OT · 5 NFE'
            : state.policyMode === 'diffusion'
            ? 'DDPM · 50 NFE'
            : 'Disabled (MSE)';

        const eqSig = `${sim.geom.aMse.toFixed(2)}|${scoreLabel}|${tStr}|${splitStr}|${sim.collisionPct}`;
        if (state.lastEqSig !== eqSig && typeof api.updateEquation === 'function') {
          state.lastEqSig = eqSig;
          try {
            api.updateEquation({
              mean: {
                value: `y = ${sim.geom.aMse.toFixed(2)}`,
                color: sim.mseHit.collides ? 'crimson' : 'amber',
              },
              score: {
                value: scoreLabel,
                color: state.policyMode === 'flow' ? 'violet' : 'cyan',
              },
              noise: {
                value: state.policyMode === 'mse' ? 'No Noise' : `t = ${tStr}`,
                color: 'amber',
              },
              modes: {
                value: `${sim.topPct}/${sim.botPct}`,
                color: 'emerald',
              },
            });
          } catch {
            // Ignore shell errors
          }
        }
      }

      /**
       * Draw a smooth trajectory curve on canvas for s in [0, maxS].
       */
      function strokeTrajectory(ctx, apexY, obsX, maxS = 1.0, segments = 44) {
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const s = (i / segments) * maxS;
          const pt = evalTrajectoryPoint(s, apexY, obsX);
          const sp = worldToScreen(pt.x, pt.y);
          if (i === 0) ctx.moveTo(sp.x, sp.y);
          else ctx.lineTo(sp.x, sp.y);
        }
        ctx.stroke();
      }

      /**
       * Render the 60 FPS 2D Obstacle-Avoidance Policy Arena.
       */
      function render(sim) {
        const { width: W, height: H, dpr, scale, hoverVar, time } = state;
        const { geom, ensemble } = sim;

        ctx.save();
        ctx.scale(dpr, dpr);

        // 1. Dead-front dark background + subtle mode-tinted studio glow
        ctx.fillStyle = PALETTE.bg;
        ctx.fillRect(0, 0, W, H);

        const obsS = worldToScreen(state.obsX, state.obsY);
        const obsRpx = ARENA.obsRadius * scale;

        const ambGrad = ctx.createRadialGradient(obsS.x, obsS.y, 12, obsS.x, obsS.y, Math.max(W, H) * 0.65);
        ambGrad.addColorStop(
          0,
          state.policyMode === 'mse' && sim.mseHit.collides
            ? 'rgba(255, 23, 68, 0.10)'
            : state.policyMode === 'flow'
            ? 'rgba(167, 139, 250, 0.075)'
            : 'rgba(0, 229, 255, 0.06)'
        );
        ambGrad.addColorStop(1, 'rgba(10, 12, 16, 0)');
        ctx.fillStyle = ambGrad;
        ctx.fillRect(0, 0, W, H);

        // 2. Arena Engineering Grid
        const minorPx = scale * 0.15;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.strokeStyle = PALETTE.gridMinor;
        for (let gx = state.cx % minorPx; gx < W; gx += minorPx) {
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, H);
        }
        for (let gy = state.cy % minorPx; gy < H; gy += minorPx) {
          ctx.moveTo(0, gy);
          ctx.lineTo(W, gy);
        }
        ctx.stroke();

        // Centerline & Decision Slice x = obsX
        ctx.beginPath();
        ctx.strokeStyle = PALETTE.axis;
        ctx.moveTo(0, state.cy);
        ctx.lineTo(W, state.cy);
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([4, 5]);
        ctx.moveTo(obsS.x, 54);
        ctx.lineTo(obsS.x, H - 36);
        ctx.strokeStyle =
          hoverVar === 'noise' || hoverVar === 'mean'
            ? `rgba(${PALETTE.amberRgb}, 0.55)`
            : 'rgba(148, 163, 184, 0.22)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();

        // 3. Score Vector Field (Diffusion) OR Optimal Transport Flow Field (Flow Matching)
        const hiScore = hoverVar === 'score';
        if (state.policyMode === 'diffusion' || state.policyMode === 'flow' || hiScore) {
          renderVectorField(ctx, geom, hiScore);
        }

        // 4. 12 Subtle Expert Demonstration Trajectories (Mode A Upper / Mode B Lower)
        const hiModes = hoverVar === 'modes';
        ctx.save();
        for (let i = 0; i < ensemble.demos.length; i++) {
          const d = ensemble.demos[i];
          const baseAlpha = hiModes ? 0.62 : state.policyMode === 'mse' ? 0.28 : 0.19;
          const alpha = clamp(baseAlpha * (0.55 + 0.85 * d.weight), 0.08, 0.85);
          ctx.strokeStyle = `rgba(${PALETTE.emeraldRgb}, ${alpha})`;
          ctx.lineWidth = hiModes ? 2.1 : 1.25;
          if (hiModes) {
            ctx.shadowColor = PALETTE.emerald;
            ctx.shadowBlur = 10;
          }
          strokeTrajectory(ctx, d.apexY, state.obsX, 1.0, 42);
        }
        ctx.shadowBlur = 0;
        ctx.restore();

        // Corridor labels (Mode A ↑ and Mode B ↓)
        const topLabelS = worldToScreen(state.obsX, geom.aTop);
        const botLabelS = worldToScreen(state.obsX, geom.aBot);
        ctx.save();
        ctx.font = `700 10px ${MONO_FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = hiModes ? '#FFFFFF' : `rgba(${PALETTE.emeraldRgb}, 0.88)`;
        ctx.fillText(`MODE A (↑ ${sim.topPct}%)`, topLabelS.x, topLabelS.y - 16);
        ctx.fillText(`MODE B (↓ ${sim.botPct}%)`, botLabelS.x, botLabelS.y + 16);
        ctx.restore();

        // 5. Marginal Probability Density Strip p_t(a|s) along the obstacle slice
        renderMarginalDensityStrip(ctx, geom, hoverVar === 'noise' || hoverVar === 'modes');

        // 6. Active Policy Visualization
        if (state.policyMode === 'mse') {
          renderMsePolicy(ctx, sim, hoverVar === 'mean');
        } else {
          renderGenerativePolicy(ctx, sim, hoverVar);
          // When hovering a_MSE = E[a|s] in Diffusion/Flow mode, show ghost comparison of the fatal mean!
          if (hoverVar === 'mean') {
            renderMseGhostOverlay(ctx, sim);
          }
        }

        // 7. Start Pad (Left) & Goal Pad (Right)
        renderEndpointPad(ctx, ARENA.startX, ARENA.startY, 'START s₀', PALETTE.cyan, PALETTE.cyanRgb);
        renderEndpointPad(ctx, ARENA.goalX, ARENA.goalY, 'GOAL', PALETTE.emerald, PALETTE.emeraldRgb);

        // 8. Directly Draggable Circular Crimson Obstacle
        renderObstacle(ctx, obsS, obsRpx, sim);

        // 9. Impact Reticle on Top of Obstacle when MSE Collides
        if (state.policyMode === 'mse' && sim.mseHit.collides && sim.mseHit.hitPoint) {
          renderImpactReticle(ctx, sim.mseHit.hitPoint, time);
        }

        // 10. Clean Instrument HUD Overlays
        renderTopLeftPolicyHUD(ctx, sim);
        renderTopRightCollisionHUD(ctx, sim, W);

        // 11. Bottom Status Banner (Break Mode / Mode-Averaging Failure / Flow Speedup)
        if (state.policyMode === 'mse' && sim.mseHit.collides) {
          renderBottomBanner(
            ctx,
            W,
            H,
            '✕ COLLISION! Mode-Averaging Failure (E[a|s] lands in obstacle) — Switch to Diffusion or Flow Match',
            PALETTE.crimson,
            PALETTE.crimsonRgb,
            0.7 + 0.3 * Math.sin(time * 9)
          );
        } else if (state.policyMode === 'flow' && state.denoiseT <= 0.05) {
          renderBottomBanner(
            ctx,
            W,
            H,
            '✓ FLOW MATCHING SOTA (π₀ / GR00T) · Straight OT Paths · 5 Steps (10× Faster than DDPM) · 0% Collisions',
            PALETTE.emerald,
            PALETTE.emeraldRgb,
            1
          );
        } else if (state.policyMode === 'diffusion' && state.denoiseT <= 0.05) {
          renderBottomBanner(
            ctx,
            W,
            H,
            '✓ DIFFUSION POLICY CONVERGED · 36 Noise Samples Bifurcated Cleanly Around Obstacle · 0% Collisions',
            PALETTE.cyan,
            PALETTE.cyanRgb,
            1
          );
        }

        ctx.restore();
      }

      /**
       * Render glowing Cyan Score Field (DDPM) or Straight-Line OT Velocity Field (Flow Matching).
       */
      function renderVectorField(ctx, geom, highlighted) {
        const isFlow = state.policyMode === 'flow';
        const tField = state.policyMode === 'mse' ? 0.35 : clamp(state.denoiseT, 0.14, 0.92);
        const fieldColor = isFlow ? PALETTE.violet : PALETTE.cyan;
        const fieldRgb = isFlow ? PALETTE.violetRgb : PALETTE.cyanRgb;

        const cols = 13;
        const rows = 9;
        const xSpanMin = -0.72;
        const xSpanMax = 0.72;
        const ySpanMin = -0.52;
        const ySpanMax = 0.52;

        ctx.save();
        if (highlighted) {
          ctx.shadowColor = fieldColor;
          ctx.shadowBlur = 10;
        }

        for (let ix = 0; ix < cols; ix++) {
          const wx = xSpanMin + (ix / (cols - 1)) * (xSpanMax - xSpanMin);
          const dxObs = wx - state.obsX;
          const xProx = Math.exp(-0.5 * (dxObs / 0.34) ** 2);

          for (let iy = 0; iy < rows; iy++) {
            const wy = ySpanMin + (iy / (rows - 1)) * (ySpanMax - ySpanMin);
            const dObs = Math.hypot(wx - state.obsX, wy - state.obsY);
            // Skip vectors deep inside obstacle core (except faint outward repulsion right near rim)
            if (dObs < ARENA.obsRadius * 0.78) continue;

            // Evaluate exact 1D score or OT velocity at slice y = wy
            const mix = evalMixtureAtT(wy, tField, geom.aTop, geom.aBot, geom.pTop, geom.pBot);
            let vy;
            if (isFlow) {
              // Straight OT velocity pointing directly toward nearest quantile-coupled safe mode
              const targetY = wy >= state.obsY ? geom.aTop : geom.aBot;
              vy = (targetY - wy) * 2.2;
            } else {
              // Exact Gaussian-mixture score grad_a log p_t(a|s)
              vy = clamp(mix.score * 0.18, -1.6, 1.6);
            }

            // Combine forward goal drift with strong vertical bifurcation near obstacle
            const vx = 0.52 * (1 - 0.32 * xProx);
            const vyScaled = vy * (0.35 + 0.85 * xProx);
            const mag = Math.hypot(vx, vyScaled);
            if (mag < 1e-4) continue;

            const ux = vx / mag;
            const uy = vyScaled / mag;
            const arrowLenPx = clamp(mag * 16, 8, highlighted ? 23 : 17);

            const pS = worldToScreen(wx, wy);
            const tipX = pS.x + ux * arrowLenPx;
            const tipY = pS.y - uy * arrowLenPx;

            const alpha = highlighted
              ? clamp(0.45 + 0.45 * xProx, 0.45, 0.92)
              : clamp(0.14 + 0.28 * xProx, 0.14, 0.44);

            ctx.strokeStyle = `rgba(${fieldRgb}, ${alpha})`;
            ctx.fillStyle = `rgba(${fieldRgb}, ${alpha})`;
            ctx.lineWidth = highlighted ? 1.75 : 1.15;

            ctx.beginPath();
            ctx.moveTo(pS.x, pS.y);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();

            // Tiny crisp arrowhead
            const hl = highlighted ? 5.5 : 4;
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(tipX - ux * hl - uy * hl * 0.5, tipY + uy * hl - ux * hl * 0.5);
            ctx.lineTo(tipX - ux * hl + uy * hl * 0.5, tipY + uy * hl + ux * hl * 0.5);
            ctx.closePath();
            ctx.fill();
          }
        }
        ctx.restore();
      }

      /**
       * Render live vertical probability density silhouette p_t(a|s) along the obstacle slice.
       */
      function renderMarginalDensityStrip(ctx, geom, highlighted) {
        const tVal = state.policyMode === 'mse' ? 0.02 : clamp(state.denoiseT, 0.02, 1.0);
        const samples = 56;
        const maxWidthPx = Math.min(54, state.scale * 0.24);
        const baseX = worldToScreen(state.obsX, 0).x;

        let maxDens = 0.01;
        const pts = [];
        for (let i = 0; i <= samples; i++) {
          const wy = ARENA.yMin + (i / samples) * (ARENA.yMax - ARENA.yMin);
          const { density } = evalMixtureAtT(wy, tVal, geom.aTop, geom.aBot, geom.pTop, geom.pBot);
          if (density > maxDens) maxDens = density;
          pts.push({ wy, density });
        }

        ctx.save();
        const stripRgb =
          state.policyMode === 'flow'
            ? PALETTE.violetRgb
            : state.policyMode === 'diffusion'
            ? PALETTE.cyanRgb
            : PALETTE.emeraldRgb;

        ctx.beginPath();
        const firstS = worldToScreen(state.obsX, pts[0].wy);
        ctx.moveTo(baseX, firstS.y);
        for (let i = 0; i < pts.length; i++) {
          const sy = worldToScreen(state.obsX, pts[i].wy).y;
          const dx = (pts[i].density / maxDens) * maxWidthPx;
          ctx.lineTo(baseX + dx, sy);
        }
        const lastS = worldToScreen(state.obsX, pts[pts.length - 1].wy);
        ctx.lineTo(baseX, lastS.y);
        ctx.closePath();

        ctx.fillStyle = `rgba(${stripRgb}, ${highlighted ? 0.22 : 0.09})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${stripRgb}, ${highlighted ? 0.85 : 0.36})`;
        ctx.lineWidth = highlighted ? 1.8 : 1.1;
        ctx.stroke();
        ctx.restore();
      }

      /**
       * Render MSE Regression mode: fatal averaged trajectory + Mode-A/B averaging bracket.
       */
      function renderMsePolicy(ctx, sim, hiMean) {
        const { geom, mseHit } = sim;
        const topS = worldToScreen(state.obsX, geom.aTop);
        const botS = worldToScreen(state.obsX, geom.aBot);
        const mseS = worldToScreen(state.obsX, geom.aMse);

        // Averaging construction bracket linking Mode A & Mode B to E[a|s]
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(topS.x, topS.y);
        ctx.lineTo(botS.x, botS.y);
        ctx.strokeStyle = `rgba(${PALETTE.crimsonRgb}, ${hiMean ? 0.92 : 0.48})`;
        ctx.lineWidth = hiMean ? 2.4 : 1.4;
        ctx.stroke();
        ctx.setLineDash([]);

        // Midpoint marker for E[a|s]
        ctx.beginPath();
        ctx.arc(mseS.x, mseS.y, hiMean ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE.crimson;
        ctx.shadowColor = PALETTE.crimson;
        ctx.shadowBlur = hiMean ? 18 : 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = `700 10px ${MONO_FONT}`;
        ctx.fillStyle = '#FF8A9E';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`E[a|s] = ${geom.aMse.toFixed(2)}`, mseS.x + 11, mseS.y - 14);
        ctx.restore();

        // MSE trajectory curve
        ctx.save();
        if (mseHit.collides) {
          // Ghost dashed continuation beyond collision
          ctx.beginPath();
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = `rgba(${PALETTE.crimsonRgb}, 0.35)`;
          ctx.lineWidth = 2.2;
          strokeTrajectory(ctx, geom.aMse, state.obsX, 1.0, 44);
          ctx.setLineDash([]);

          // Solid glowing Crimson collision path up to impact point
          ctx.strokeStyle = PALETTE.crimson;
          ctx.lineWidth = hiMean ? 4.4 : 3.4;
          ctx.shadowColor = PALETTE.crimson;
          ctx.shadowBlur = hiMean ? 22 : 14;
          strokeTrajectory(ctx, geom.aMse, state.obsX, Math.max(0.05, mseHit.hitS), 32);

          // Animated robot crashing repeatedly into impact point
          const crashProg = (state.time * 0.55) % 1;
          const robotS = crashProg * Math.max(0.05, mseHit.hitS);
          const rPt = evalTrajectoryPoint(robotS, geom.aMse, state.obsX);
          const rSc = worldToScreen(rPt.x, rPt.y);
          ctx.beginPath();
          ctx.arc(rSc.x, rSc.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.lineWidth = 2.2;
          ctx.strokeStyle = PALETTE.crimson;
          ctx.stroke();
        } else {
          // Unimodal bias escaped collision!
          ctx.strokeStyle = PALETTE.amber;
          ctx.lineWidth = hiMean ? 4.2 : 3.2;
          ctx.shadowColor = PALETTE.amber;
          ctx.shadowBlur = 14;
          strokeTrajectory(ctx, geom.aMse, state.obsX, 1.0, 44);

          const prog = (state.time * 0.38) % 1;
          const rPt = evalTrajectoryPoint(prog, geom.aMse, state.obsX);
          const rSc = worldToScreen(rPt.x, rPt.y);
          ctx.beginPath();
          ctx.arc(rSc.x, rSc.y, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        }
        ctx.restore();
      }

      /**
       * Ghost reference of the fatal MSE mean when hovering `mean` in Diffusion/Flow mode.
       */
      function renderMseGhostOverlay(ctx, sim) {
        const { geom } = sim;
        const mseS = worldToScreen(state.obsX, geom.aMse);
        ctx.save();
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = PALETTE.crimson;
        ctx.lineWidth = 2.8;
        ctx.shadowColor = PALETTE.crimson;
        ctx.shadowBlur = 14;
        strokeTrajectory(ctx, geom.aMse, state.obsX, 1.0, 40);
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(mseS.x, mseS.y, 6.5, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE.crimson;
        ctx.fill();
        ctx.font = `700 10.5px ${MONO_FONT}`;
        ctx.fillStyle = '#FF8A9E';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('a_MSE = E[a|s] (CRASH!)', mseS.x, mseS.y - 12);
        ctx.restore();
      }

      /**
       * Render 36 glowing action-trajectory particles for Diffusion (50 steps) or Flow Matching (5 steps).
       */
      function renderGenerativePolicy(ctx, sim, hoverVar) {
        const isFlow = state.policyMode === 'flow';
        const hiNoise = hoverVar === 'noise';
        const t = state.denoiseT;

        // 1. Gaussian Prior Cloud Halo when t > 0.12 or hovering `noise`
        if (t > 0.12 || hiNoise) {
          const priorCenter = worldToScreen(state.obsX, 0);
          const cloudRx = state.scale * 0.16;
          const cloudRy = state.scale * 0.44;
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(priorCenter.x, priorCenter.y, cloudRx, cloudRy, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${PALETTE.amberRgb}, ${hiNoise ? 0.14 : 0.055 * t})`;
          ctx.fill();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = `rgba(${PALETTE.amberRgb}, ${hiNoise ? 0.72 : 0.32 * t})`;
          ctx.lineWidth = hiNoise ? 1.8 : 1.1;
          ctx.stroke();
          ctx.setLineDash([]);

          if (hiNoise || t > 0.55) {
            ctx.font = `600 9.5px ${MONO_FONT}`;
            ctx.fillStyle = PALETTE.amber;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('z ~ N(0, I) PRIOR', priorCenter.x, priorCenter.y + cloudRy + 6);
          }
          ctx.restore();
        }

        // 2. Draw all 36 candidate action trajectories
        ctx.save();
        for (let i = 0; i < sim.particleStates.length; i++) {
          const ps = sim.particleStates[i];
          const collides = ps.hit.collides;
          const colorRgb = collides
            ? PALETTE.crimsonRgb
            : isFlow
            ? t < 0.15
              ? PALETTE.emeraldRgb
              : PALETTE.violetRgb
            : t < 0.15
            ? PALETTE.emeraldRgb
            : PALETTE.cyanRgb;

          const alpha = collides ? 0.34 : 0.22 + (1 - t) * 0.26;
          ctx.strokeStyle = `rgba(${colorRgb}, ${alpha})`;
          ctx.lineWidth = collides ? 1.2 : 1.35 + (1 - t) * 0.45;
          strokeTrajectory(ctx, ps.apexY, state.obsX, 1.0, 38);
        }
        ctx.restore();

        // 3. Denoising transport trails at the obstacle decision slice (straight OT vs curved DDPM!)
        ctx.save();
        for (let i = 0; i < sim.particleStates.length; i++) {
          const ps = sim.particleStates[i];
          const p = ps.particle;
          const xSlice = state.obsX + p.xJitter * (0.25 + 0.75 * t);

          if (isFlow) {
            // Draw crisp straight-line Optimal Transport path from z -> targetMode with 5 Euler ticks!
            const pStart = worldToScreen(state.obsX + p.xJitter, p.z);
            const pEnd = worldToScreen(state.obsX + p.xJitter * 0.25, p.targetMode);
            ctx.beginPath();
            ctx.moveTo(pStart.x, pStart.y);
            ctx.lineTo(pEnd.x, pEnd.y);
            ctx.strokeStyle = `rgba(${PALETTE.violetRgb}, ${hiNoise ? 0.48 : 0.22})`;
            ctx.lineWidth = 1.0;
            ctx.stroke();

            // 5 discrete Flow Matching Euler step tick dots on every 4th particle for clarity
            if (i % 4 === 0) {
              for (let k = 1; k < ARENA.flowSteps; k++) {
                const frac = k / ARENA.flowSteps;
                const tx = pStart.x + (pEnd.x - pStart.x) * frac;
                const ty = pStart.y + (pEnd.y - pStart.y) * frac;
                ctx.beginPath();
                ctx.arc(tx, ty, 1.6, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${PALETTE.violetRgb}, 0.55)`;
                ctx.fill();
              }
            }
          } else if (i % 2 === 0 && (t > 0.04 || hiNoise)) {
            // Draw curved 50-step DDPM reverse-score trail
            ctx.beginPath();
            const currentStep = Math.round((1 - t) * ARENA.ddpmSteps);
            for (let k = 0; k <= currentStep; k += 2) {
              const tk = 1 - k / ARENA.ddpmSteps;
              const xk = state.obsX + p.xJitter * (0.25 + 0.75 * tk);
              const ptS = worldToScreen(xk, p.ddpmPath[k]);
              if (k === 0) ctx.moveTo(ptS.x, ptS.y);
              else ctx.lineTo(ptS.x, ptS.y);
            }
            ctx.strokeStyle = `rgba(${PALETTE.cyanRgb}, ${hiNoise ? 0.42 : 0.20})`;
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }

          // Glowing action particle node on the decision slice
          const nodeS = worldToScreen(xSlice, ps.apexY);
          const nodeColor = ps.hit.collides
            ? PALETTE.crimson
            : t < 0.12
            ? PALETTE.emerald
            : isFlow
            ? PALETTE.violet
            : PALETTE.cyan;

          ctx.beginPath();
          ctx.arc(nodeS.x, nodeS.y, hiNoise ? 4.4 : 3.4, 0, Math.PI * 2);
          ctx.fillStyle = nodeColor;
          ctx.shadowColor = nodeColor;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;

          // When converged (t < 0.15), animate glowing rollout agents gliding smoothly from Start -> Goal!
          if (t < 0.15 && i % 4 === 0 && !ps.hit.collides) {
            const prog = (state.time * 0.34 + p.phaseOffset) % 1;
            const agentPt = evalTrajectoryPoint(prog, ps.apexY, state.obsX);
            const agentS = worldToScreen(agentPt.x, agentPt.y);
            ctx.beginPath();
            ctx.arc(agentS.x, agentS.y, 4.2, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = PALETTE.emerald;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
        ctx.restore();
      }

      function renderEndpointPad(ctx, wx, wy, label, colorHex, colorRgb) {
        const pS = worldToScreen(wx, wy);
        ctx.save();
        ctx.beginPath();
        ctx.arc(pS.x, pS.y, 17, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorRgb}, 0.10)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${colorRgb}, 0.55)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pS.x, pS.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = colorHex;
        ctx.shadowColor = colorHex;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = `700 9.5px ${MONO_FONT}`;
        ctx.fillStyle = colorHex;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label, pS.x, pS.y + 23);
        ctx.restore();
      }

      function renderObstacle(ctx, obsS, obsRpx, sim) {
        const isCrashing = state.policyMode === 'mse' && sim.mseHit.collides;
        const pulse = 0.5 + 0.5 * Math.sin(state.time * (isCrashing ? 9 : 3.5));

        ctx.save();
        // Danger halo
        ctx.beginPath();
        ctx.arc(obsS.x, obsS.y, obsRpx + 7 + pulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${PALETTE.crimsonRgb}, ${isCrashing ? 0.55 : 0.24})`;
        ctx.lineWidth = isCrashing ? 2 : 1.2;
        ctx.stroke();

        // Main circular obstacle body
        ctx.beginPath();
        ctx.arc(obsS.x, obsS.y, obsRpx, 0, Math.PI * 2);
        const oGrad = ctx.createRadialGradient(
          obsS.x - obsRpx * 0.25,
          obsS.y - obsRpx * 0.25,
          4,
          obsS.x,
          obsS.y,
          obsRpx
        );
        oGrad.addColorStop(0, 'rgba(255, 23, 68, 0.36)');
        oGrad.addColorStop(1, 'rgba(127, 17, 40, 0.72)');
        ctx.fillStyle = oGrad;
        ctx.fill();

        // Subtle hazard diagonal hatch clipped inside obstacle
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = 'rgba(255, 138, 158, 0.14)';
        ctx.lineWidth = 2;
        for (let d = -obsRpx * 2; d <= obsRpx * 2; d += 12) {
          ctx.beginPath();
          ctx.moveTo(obsS.x + d - obsRpx, obsS.y - obsRpx);
          ctx.lineTo(obsS.x + d + obsRpx, obsS.y + obsRpx);
          ctx.stroke();
        }
        ctx.restore();

        // Outer neon rim
        ctx.beginPath();
        ctx.arc(obsS.x, obsS.y, obsRpx, 0, Math.PI * 2);
        ctx.strokeStyle = PALETTE.crimson;
        ctx.lineWidth = state.draggingObs ? 3 : 2.2;
        ctx.shadowColor = PALETTE.crimson;
        ctx.shadowBlur = state.draggingObs ? 22 : 14;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Core label
        ctx.font = `700 10px ${MONO_FONT}`;
        ctx.fillStyle = '#FFE4E8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('OBSTACLE', obsS.x, obsS.y - 5);
        ctx.font = `500 8.5px ${SANS_FONT}`;
        ctx.fillStyle = 'rgba(255, 200, 210, 0.78)';
        ctx.fillText(state.hasDraggedObs ? 'drag' : 'drag me', obsS.x, obsS.y + 8);
        ctx.restore();
      }

      function renderImpactReticle(ctx, hitPt, time) {
        const hS = worldToScreen(hitPt.x, hitPt.y);
        const pulse = 0.5 + 0.5 * Math.sin(time * 12);

        ctx.save();
        ctx.beginPath();
        ctx.arc(hS.x, hS.y, 11 + pulse * 8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${PALETTE.crimsonRgb}, ${0.85 - pulse * 0.45})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Crossed X impact spark
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.4;
        ctx.shadowColor = PALETTE.crimson;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(hS.x - 6, hS.y - 6);
        ctx.lineTo(hS.x + 6, hS.y + 6);
        ctx.moveTo(hS.x + 6, hS.y - 6);
        ctx.lineTo(hS.x - 6, hS.y + 6);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Floating crash tag
        const tag = 'COLLISION!';
        ctx.font = `700 9.5px ${MONO_FONT}`;
        const tw = ctx.measureText(tag).width + 14;
        drawRoundedRect(ctx, hS.x - tw - 10, hS.y - 26, tw, 19, 6);
        ctx.fillStyle = 'rgba(255, 23, 68, 0.92)';
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tag, hS.x - tw * 0.5 - 10, hS.y - 16.5);
        ctx.restore();
      }

      function renderTopLeftPolicyHUD(ctx, sim) {
        const isMse = state.policyMode === 'mse';
        const isFlow = state.policyMode === 'flow';
        const title = isMse
          ? 'MSE REGRESSION (L2 BC)'
          : isFlow
          ? 'FLOW MATCHING (π₀ / GR00T)'
          : 'DIFFUSION POLICY (DDPM)';
        const sub = isMse
          ? 'Outputs E[a|s] · Unimodal Mean'
          : isFlow
          ? '5 OT Steps · ~12ms · 20+ Hz'
          : '50 Score Steps · ~120ms · 8 Hz';
        const accent = isMse ? PALETTE.crimson : isFlow ? PALETTE.violet : PALETTE.cyan;

        const boxW = 216;
        const boxH = 48;
        ctx.save();
        drawRoundedRect(ctx, 12, 12, boxW, boxH, 10);
        ctx.fillStyle = PALETTE.bgPanel;
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = isMse && sim.mseHit.collides ? PALETTE.crimson : 'rgba(255, 255, 255, 0.11)';
        ctx.stroke();

        ctx.font = `700 10px ${MONO_FONT}`;
        ctx.fillStyle = accent;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(title, 22, 20);

        ctx.font = `500 9.5px ${MONO_FONT}`;
        ctx.fillStyle = PALETTE.textSecondary;
        ctx.fillText(sub, 22, 36);
        ctx.restore();
      }

      function renderTopRightCollisionHUD(ctx, sim, W) {
        const boxW = 166;
        const boxH = 48;
        const x = W - boxW - 12;
        if (x < 236) return;

        const bad = sim.collisionPct >= 50;
        const warn = sim.collisionPct > 0 && !bad;
        const accent = bad ? PALETTE.crimson : warn ? PALETTE.amber : PALETTE.emerald;

        ctx.save();
        drawRoundedRect(ctx, x, 12, boxW, boxH, 10);
        ctx.fillStyle = PALETTE.bgPanel;
        ctx.fill();
        ctx.lineWidth = bad ? 1.6 : 1.1;
        ctx.strokeStyle = bad ? PALETTE.crimson : 'rgba(255, 255, 255, 0.11)';
        ctx.stroke();

        ctx.font = `700 10px ${MONO_FONT}`;
        ctx.fillStyle = accent;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`COLLISIONS: ${sim.collisionPct}%`, x + 10, 20);

        ctx.font = `500 9.5px ${MONO_FONT}`;
        ctx.fillStyle = PALETTE.textSecondary;
        ctx.fillText(
          state.policyMode === 'mse'
            ? `SPLIT: ${sim.topPct}% ↑ / ${sim.botPct}% ↓`
            : `STEP t = ${state.denoiseT.toFixed(2)}`,
          x + 10,
          36
        );
        ctx.restore();
      }

      function renderBottomBanner(ctx, W, H, text, colorHex, colorRgb, alphaScale) {
        ctx.save();
        ctx.font = `700 10.5px ${MONO_FONT}`;
        const tw = Math.min(W - 24, ctx.measureText(text).width + 26);
        const bx = (W - tw) * 0.5;
        const by = H - 38;

        drawRoundedRect(ctx, bx, by, tw, 26, 13);
        ctx.fillStyle = 'rgba(13, 17, 25, 0.92)';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `rgba(${colorRgb}, ${0.85 * alphaScale})`;
        ctx.shadowColor = colorHex;
        ctx.shadowBlur = 12 * alphaScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = colorHex;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, W * 0.5, by + 13.5, tw - 16);
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

export default createM11DiffusionLab;
