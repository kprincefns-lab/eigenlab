/**
 * EIGENLAB — Flagship Lab M4.1: Control Barrier Functions (CBF-QP) Wrapping AI Policies
 * Deterministic 1000 Hz forward-invariance shield projecting noisy, delayed VLA/RL
 * velocity commands onto the safe half-space ∇h(x)·u + α·h(x) ≥ 0.
 *
 * Native ES Module (zero external dependencies).
 */

const COLORS = Object.freeze({
  bg: '#0A0C10',
  panel: '#1C1F26',
  gridMajor: 'rgba(255, 255, 255, 0.055)',
  gridMinor: 'rgba(255, 255, 255, 0.022)',
  axisLabel: 'rgba(165, 176, 199, 0.42)',
  emerald: '#00E676',
  emeraldRgb: '0, 230, 118',
  cyan: '#00E5FF',
  cyanRgb: '0, 229, 255',
  amber: '#FFB300',
  amberRgb: '255, 179, 0',
  crimson: '#FF1744',
  crimsonRgb: '255, 23, 68',
  textPrimary: '#F3F6FC',
  textMuted: '#8B97B0',
});

const WORLD = Object.freeze({
  halfW: 4.3,
  halfH: 2.65,
  robotRadius: 0.22,
  maxGoalSpeed: 2.55,
  maxCmdSpeed: 3.85,
  goalKp: 1.55,
  ouTau: 0.34,
  substepDt: 0.001, // 1000 Hz deterministic inner CBF-QP loop
  maxLatencyMs: 60,
  trailCapacity: 200,
  sparkCapacity: 240,
});

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function hypot2(x, y) {
  return Math.sqrt(x * x + y * y);
}

/** Box-Muller standard normal sample */
function randNormal() {
  let u1 = 0;
  let u2 = 0;
  while (u1 <= 1e-7) u1 = Math.random();
  u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Exact 2-obstacle CBF-QP solver via Dykstra's alternating projection algorithm.
 * Solves:
 *   u* = argmin_u  0.5 * ||u - u_nom||^2
 *        s.t.      ∇h_i(x) · u + α · h_i(x) >= margin   for i = 0, 1
 *
 * Returns { ux, uy, activeCount, minH, nearestIdx, gradX, gradY }
 */
export function solveCbfQp(robotX, robotY, uNomX, uNomY, obstacles, alpha, margin = 0.0) {
  const n = obstacles.length;
  const constraints = new Array(n);
  let minH = Infinity;
  let nearestIdx = 0;

  for (let i = 0; i < n; i++) {
    const obs = obstacles[i];
    const dx = robotX - obs.x;
    const dy = robotY - obs.y;
    const distSq = dx * dx + dy * dy;
    const rSafe = obs.rSafe;
    const h = distSq - rSafe * rSafe;
    const gx = 2.0 * dx;
    const gy = 2.0 * dy;
    const gNormSq = gx * gx + gy * gy;

    if (h < minH) {
      minH = h;
      nearestIdx = i;
    }

    constraints[i] = {
      ax: gx,
      ay: gy,
      aNormSq: gNormSq,
      b: -alpha * h + margin,
      h,
      dx,
      dy,
    };
  }

  // Slight tangential symmetry breaker when aiming dead-center at an obstacle
  let seedX = uNomX;
  let seedY = uNomY;
  const near = constraints[nearestIdx];
  if (near && near.h < 0.35 && near.aNormSq > 1e-6) {
    const dot = near.ax * seedX + near.ay * seedY;
    const cross = near.ax * seedY - near.ay * seedX;
    if (dot < -0.15 && Math.abs(cross) < 0.08) {
      const invLen = 1.0 / Math.sqrt(near.aNormSq);
      const tx = -near.ay * invLen;
      const ty = near.ax * invLen;
      const sign = cross >= 0 ? 1 : -1;
      seedX += sign * 0.22 * tx;
      seedY += sign * 0.22 * ty;
    }
  }

  // Dykstra's projection onto the intersection of half-spaces { u : a_i · u >= b_i }
  let ux = seedX;
  let uy = seedY;
  const px = new Float64Array(n);
  const py = new Float64Array(n);

  const maxIter = 12;
  for (let iter = 0; iter < maxIter; iter++) {
    let maxViolation = 0;
    for (let i = 0; i < n; i++) {
      const c = constraints[i];
      const yx = ux + px[i];
      const yy = uy + py[i];

      let nextX = yx;
      let nextY = yy;

      if (c.aNormSq > 1e-8) {
        const val = c.ax * yx + c.ay * yy;
        const viol = c.b - val;
        if (viol > 0) {
          const step = viol / c.aNormSq;
          nextX = yx + step * c.ax;
          nextY = yy + step * c.ay;
          if (viol > maxViolation) maxViolation = viol;
        }
      }

      px[i] = yx - nextX;
      py[i] = yy - nextY;
      ux = nextX;
      uy = nextY;
    }
    if (maxViolation < 1e-6) break;
  }

  // Soft velocity saturation while keeping safety direction intact
  const speed = hypot2(ux, uy);
  if (speed > WORLD.maxCmdSpeed * 1.15) {
    const s = (WORLD.maxCmdSpeed * 1.15) / speed;
    ux *= s;
    uy *= s;
  }

  let activeCount = 0;
  for (let i = 0; i < n; i++) {
    const c = constraints[i];
    if (c.ax * uNomX + c.ay * uNomY < c.b - 1e-4) {
      activeCount++;
    }
  }

  return {
    ux,
    uy,
    activeCount,
    minH,
    nearestIdx,
    gradX: near ? near.ax : 0,
    gradY: near ? near.ay : 0,
    nearestB: near ? near.b : 0,
  };
}

/**
 * Factory creating the FrontierLessonShell descriptor for Lab M4.1.
 */
export function createM41CbfLab() {
  return {
    nodeId: 'M4.1',
    title: 'Control Barrier Functions (CBF-QP) Wrapping AI Policies',
    subtitle:
      'Deterministic forward-invariance shield projecting noisy VLA/RL commands into safe velocities at 1000 Hz',
    tier: 2,
    badge: 'TIER 2 • SAFETY-CRITICAL HYBRID CONTROL',

    breakMode: {
      buttonLabel: '⚡ Break: Strip CBF + 40ms Lag',
      activeLabel: '🔥 Unshielded Fault Active',
      activeBanner: '🔥 UNSHIELDED FAULT — CBF-QP Stripped + 40ms Bus Lag + High Policy Noise',
      triggerLabel: '⚡ Break: Strip CBF + 40ms Lag',
      recoverLabel: '✓ Restore CBF-QP Shield',
      description:
        'Disables the deterministic CBF-QP shield and injects 40ms bus latency + high stochastic policy noise so the AI policy breaches the forbidden zone.',
      failureSymptom:
        'Delayed stochastic commands u_nom(t − 40ms) drive straight across h(x) = 0, triggering crimson barrier breaches and climbing collision hits.',
      recoveryHint:
        'Re-enable the CBF-QP Shield toggle to watch the safety filter smoothly bend unsafe commands around h(x)=0 with 0 collisions!',
      faultControls: {
        cbfEnabled: false,
        busLatencyMs: 40,
        policyNoise: 2.1,
      },
    },

    telemetryDefs: [
      {
        id: 'hMin',
        key: 'hMin',
        label: 'Barrier h(x)',
        unit: 'm²',
        initialValue: '+1.85',
        color: 'emerald',
      },
      {
        id: 'deltaU',
        key: 'deltaU',
        label: 'Intervention ‖Δu‖',
        unit: 'm/s',
        initialValue: '0.00',
        color: 'amber',
      },
      {
        id: 'latency',
        key: 'latency',
        label: 'Bus Latency τ',
        unit: 'ms',
        initialValue: '10',
        color: 'cyan',
      },
      {
        id: 'safetyStatus',
        key: 'safetyStatus',
        label: 'Safety Status',
        unit: '',
        initialValue: 'SAFE • 0 hits',
        color: 'emerald',
      },
    ],

    equationSpec: {
      caption: 'Real-Time CBF-QP Safety Filter (1000 Hz)',
      parts: [
        { type: 'op', text: 'min ½‖' },
        {
          type: 'var',
          key: 'u_star',
          symbol: 'u^*',
          label: 'Safe Velocity u*',
          color: 'emerald',
          unit: 'm/s',
          decimals: 2,
          initialValue: 0,
          tooltip:
            'Minimum-deviation safe velocity output by the 1000 Hz convex QP solver.',
        },
        { type: 'op', text: '−' },
        {
          type: 'var',
          key: 'u_nom',
          symbol: 'u_{\\text{nom}}',
          label: 'AI Policy u_nom',
          color: 'cyan',
          unit: 'm/s',
          decimals: 2,
          initialValue: 0,
          tooltip:
            'Raw stochastic velocity from the learned VLA/RL policy arriving after bus latency τ.',
        },
        { type: 'op', text: '‖²  s.t.' },
        {
          type: 'var',
          key: 'grad_h',
          symbol: '\\nabla h(x)',
          label: 'Barrier Gradient ∇h(x)',
          color: 'amber',
          unit: 'm',
          decimals: 2,
          initialValue: 0,
          tooltip:
            'Outward normal 2(x − c) pointing directly away from the nearest forbidden obstacle.',
        },
        { type: 'op', text: '· u +' },
        {
          type: 'var',
          key: 'alpha',
          symbol: '\\alpha',
          label: 'Barrier Rate α',
          color: 'cyan',
          unit: 's⁻¹',
          decimals: 1,
          initialValue: 1.8,
          tooltip:
            'Class-K decay rate governing how aggressively approach velocity is damped near h(x) = 0.',
        },
        { type: 'op', text: '·' },
        {
          type: 'var',
          key: 'h_x',
          symbol: 'h(x)',
          label: 'Barrier Margin h(x)',
          color: 'emerald',
          unit: 'm²',
          decimals: 2,
          initialValue: 1.4,
          tooltip:
            'Control Barrier Function ‖x − c‖² − R². Forward invariance guarantees h(x) ≥ 0 for all t.',
        },
        { type: 'op', text: '≥ 0' },
      ],
    },

    controls: [
      {
        id: 'cbfEnabled',
        type: 'toggle',
        label: 'CBF-QP Safety Shield',
        value: true,
        color: 'emerald',
        hint: 'Enforces ∇h(x)·u + α·h(x) ≥ 0 at 1000 Hz',
      },
      {
        id: 'alpha',
        type: 'range',
        label: 'Barrier Rate α',
        min: 0.4,
        max: 4.0,
        step: 0.1,
        value: 1.8,
        unit: 's⁻¹',
        color: 'cyan',
        hint: 'Low α brakes early; high α permits tight boundary grazing',
      },
      {
        id: 'policyNoise',
        type: 'range',
        label: 'AI Policy Noise σ',
        min: 0.0,
        max: 2.6,
        step: 0.1,
        value: 1.1,
        unit: 'm/s',
        color: 'amber',
        hint: 'Correlated Ornstein-Uhlenbeck VLA/RL command jitter',
      },
      {
        id: 'busLatencyMs',
        type: 'range',
        label: 'Bus Latency τ',
        min: 0,
        max: 60,
        step: 5,
        value: 10,
        unit: 'ms',
        color: 'crimson',
        hint: 'Real ring-buffer command lag on the policy transport bus',
      },
    ],

    presets: [
      {
        label: 'Defensive Cushion',
        values: { cbfEnabled: true, alpha: 0.6, policyNoise: 1.0, busLatencyMs: 10 },
        breakMode: false,
      },
      {
        label: 'Tight Grazing',
        values: { cbfEnabled: true, alpha: 3.6, policyNoise: 1.4, busLatencyMs: 15 },
        breakMode: false,
      },
      {
        label: 'Noisy VLA Stress',
        values: { cbfEnabled: true, alpha: 1.8, policyNoise: 2.5, busLatencyMs: 45 },
        breakMode: false,
      },
    ],

    steps: {
      concept: {
        title: 'Deterministic Safety Around Stochastic AI',
        body:
          'Learned policies (VLA, diffusion, RL) excel at semantic tasks but cannot offer zero-collision mathematical guarantees. A Control Barrier Function Quadratic Program (CBF-QP) wraps any neural policy as a minimally invasive 1000 Hz safety shield.',
        bullets: [
          'Define the safe workspace as the superlevel set C = {x : h(x) ≥ 0}, where h(x) = ‖x − c‖² − R².',
          'Whenever the robot starts inside C and satisfies ∇h(x)·u + α·h(x) ≥ 0, Nagumo’s theorem guarantees h(x(t)) ≥ h(x(0))·e^(−αt) ≥ 0 forever.',
          'When u_nom is already safe, Δu = 0 and the AI policy drives completely untouched.',
        ],
        callout:
          'Try dragging either crimson forbidden zone directly into the robot’s path — the glowing Amber intervention vector Δu activates only when needed!',
      },
      explore: {
        title: 'Drag Obstacles & Probe the Safe Set',
        body:
          'Grab either crimson forbidden zone or the emerald goal beacon directly on the dead-front arena, then sweep α, σ, and τ to test forward invariance.',
        bullets: [
          'Pull an obstacle into the robot’s trajectory — watch the glowing Amber intervention vector Δu = u* − u_nom spring to life.',
          'Lower Barrier Rate α (e.g. 0.5 s⁻¹) for early defensive braking; raise α (e.g. 3.5 s⁻¹) for tight high-speed grazing.',
          'Crank AI Policy Noise σ to 2.5 m/s and inspect the bottom-left h(x) sparkline: it kisses zero but never crosses below.',
        ],
      },
      linkedMath: {
        title: 'Inspect the Live QP Geometry',
        body:
          'Hover or tap any symbol in the Live Linked Equation below the canvas (or in the list here) to illuminate its exact geometric counterpart on the arena.',
        bullets: [
          'u_nom (dashed cyan) vs. u* (solid emerald): the QP computes the Euclidean orthogonal projection of u_nom onto the safe half-space.',
          '∇h(x) (amber normal): points radially outward from the nearest obstacle, defining the separating safety hyperplane.',
          'α (approach-speed cone): scales how much inward velocity −α·h(x) is permitted at the current margin h(x).',
        ],
      },
      breakSystem: {
        title: 'Inject Unshielded Latency Fault',
        body:
          'Trigger "⚡ Break: Strip CBF + 40ms Lag" to disable the deterministic safety filter, inject 40 ms bus delay, and spike policy noise to 2.1 m/s.',
        symptom:
          'The delayed AI policy drives straight into the crimson forbidden zone, dropping the h(x) sparkline below zero and incrementing collision hits.',
        recovery:
          'Re-enable the CBF-QP Safety Shield toggle (or click Restore) — even under 40 ms lag and high noise, the local 1000 Hz shield immediately restores zero-collision invariance.',
      },
    },

    intuitionCheck: {
      question:
        'An RL policy outputs a noisy velocity u_nom pointing directly into a forbidden obstacle while the robot sits right on the boundary h(x) = 0. What does the CBF-QP constraint ∇h(x)·u + α·h(x) ≥ 0 enforce?',
      options: [
        {
          id: 'a',
          text: 'It freezes the robot completely (u* = 0) until the AI policy retrains.',
          correct: false,
          feedback:
            'Not quite — the QP minimizes ½‖u − u_nom‖², so it preserves the tangential component of u_nom and glides around the obstacle rather than dead-stopping.',
        },
        {
          id: 'b',
          text: 'It cancels only the inward normal component so ∇h(x)·u* ≥ 0, letting the robot slide tangentially along the boundary.',
          correct: true,
          feedback:
            'Spot on! At h(x) = 0, α·h(x) vanishes, leaving ∇h(x)·u* ≥ 0. Projecting u_nom onto this half-space removes only the unsafe inward velocity while keeping all safe tangential progress.',
        },
        {
          id: 'c',
          text: 'It increases α automatically so that h(x) is allowed to become negative briefly.',
          correct: false,
          feedback:
            'No — α is a fixed class-K decay rate and h(x) ≥ 0 is a hard forward-invariance guarantee that never permits crossing into h(x) < 0.',
        },
        {
          id: 'd',
          text: 'It reverses the command to u* = −u_nom regardless of obstacle geometry.',
          correct: false,
          feedback:
            'Reversing full velocity wastes energy and causes violent chatter. The convex QP computes the minimum-norm correction Δu strictly along ∇h(x).',
        },
      ],
      correctIndex: 1,
      explanation:
        'At h(x) = 0, the CBF inequality reduces to ∇h(x)·u* ≥ 0. Minimizing ½‖u − u_nom‖² performs an orthogonal half-space projection that strips only the inward collision component while preserving tangential glide.',
    },

    frontierBridge: {
      headline: 'How Humanoids & Surgical Arms Deploy Foundation Models Safely',
      whyItMatters:
        'Modern Vision-Language-Action (VLA) models run at 5–50 Hz with stochastic token/diffusion outputs and network jitter. Production physical AI stacks decouple intelligence from safety: the neural policy proposes u_nom while a deterministic 1000 Hz CBF-QP safety layer guarantees zero self-collision, joint-limit respect, and human-workspace invariance.',
      prereqs: ['F1.2', 'F6.1', 'M1.2'],
      unlocks: ['M4.2'],
    },

    /**
     * Mounts the interactive 60 FPS dead-front CBF-QP arena into `canvasHost`.
     * Compatible with both subscription-style and imperative FrontierLessonShell APIs.
     */
    mountCanvas(canvasHost, api = {}) {
      if (!canvasHost) return { destroy() {} };

      // Ensure deadfront container styling without overriding shell height
      canvasHost.classList.add('deadfront-canvas');
      if (getComputedStyle(canvasHost).position === 'static') {
        canvasHost.style.position = 'relative';
      }

      const canvas = document.createElement('canvas');
      canvas.style.cssText =
        'display:block;width:100%;height:100%;touch-action:none;cursor:default;';
      canvas.setAttribute(
        'aria-label',
        'Interactive CBF-QP Safety Filter arena. Drag the crimson obstacles or emerald goal beacon.'
      );
      canvasHost.textContent = '';
      canvasHost.appendChild(canvas);

      const ctx = canvas.getContext('2d');

      // ---- Control & Shell State ----
      const readInitialControl = (id, fallback) => {
        try {
          if (typeof api.getControlValue === 'function') {
            const v = api.getControlValue(id);
            if (v !== undefined) return v;
          }
          if (typeof api.getControl === 'function') {
            const v = api.getControl(id);
            if (v !== undefined) return v;
          }
          if (typeof api.getControls === 'function') {
            const all = api.getControls();
            if (all && all[id] !== undefined) return all[id];
          }
          if (typeof api.getParams === 'function') {
            const all = api.getParams();
            if (all && all[id] !== undefined) return all[id];
          }
        } catch {
          // Ignore shell read error and use default
        }
        return fallback;
      };

      const params = {
        cbfEnabled: Boolean(readInitialControl('cbfEnabled', true)),
        alpha: Number(readInitialControl('alpha', 1.8)),
        policyNoise: Number(readInitialControl('policyNoise', 1.1)),
        busLatencyMs: Number(readInitialControl('busLatencyMs', 10)),
      };

      let breakActive = Boolean(
        typeof api.isBroken === 'function'
          ? api.isBroken()
          : typeof api.getBreakActive === 'function'
            ? api.getBreakActive()
            : false
      );
      let savedBeforeBreak = {
        cbfEnabled: true,
        policyNoise: params.policyNoise,
        busLatencyMs: params.busLatencyMs,
      };
      let highlightedVar = null;
      let syncingControls = false;

      // ---- Physical World State ----
      const robot = {
        x: -3.05,
        y: -0.25,
        vx: 0,
        vy: 0,
        heading: 0,
      };

      const obstacles = [
        { id: 0, label: 'OBS 1', x: -0.55, y: 0.42, rSafe: 1.05, pulse: 0 },
        { id: 1, label: 'OBS 2', x: 1.08, y: -0.58, rSafe: 0.94, pulse: 0 },
      ];

      const goal = {
        x: 3.1,
        y: 0.25,
        patrolSide: 1, // +1 right flank, -1 left flank
        dwellTimer: 0,
        userPinnedTimer: 0,
      };

      // Ornstein-Uhlenbeck correlated stochastic AI policy noise
      const ouNoise = { x: 0, y: 0 };

      // Real 1ms-resolution ring buffer for bus latency (up to 64ms)
      const latencyCap = WORLD.maxLatencyMs + 4;
      const delayBufX = new Float64Array(latencyCap);
      const delayBufY = new Float64Array(latencyCap);
      let delayHead = 0;

      // Latest kinematic & CBF-QP telemetry snapshot
      const live = {
        uNomX: 0,
        uNomY: 0,
        uStarX: 0,
        uStarY: 0,
        deltaUX: 0,
        deltaUY: 0,
        minH: 1.8,
        nearestIdx: 0,
        gradX: 0,
        gradY: 0,
        nearestB: 0,
        activeCount: 0,
        inBreach: false,
        breachCount: 0,
        breachFlash: 0,
        simTime: 0,
      };

      // Trajectory trail & h(x) sparkline ring histories
      const trail = [];
      let trailAccum = 0;
      const sparkHistory = [];
      let sparkAccum = 0;

      // Pointer drag & hover state
      let dragTarget = null; // { kind: 'obstacle', idx } | { kind: 'goal' }
      let dragOffsetX = 0;
      let dragOffsetY = 0;
      let hoverTarget = null;
      let canvasHoverVar = null;

      // Viewport metrics (updated via ResizeObserver)
      let cssW = 720;
      let cssH = 440;
      let dpr = Math.min(window.devicePixelRatio || 1, 2);
      let scale = 80;
      let originX = 360;
      let originY = 220;

      function updateViewport() {
        const rect = canvasHost.getBoundingClientRect();
        cssW = Math.max(280, Math.round(rect.width || canvasHost.clientWidth || 720));
        cssH = Math.max(300, Math.round(rect.height || canvasHost.clientHeight || 440));
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        const targetW = Math.round(cssW * dpr);
        const targetH = Math.round(cssH * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        const padX = 24;
        const padY = 26;
        const sx = (cssW - padX * 2) / (WORLD.halfW * 2);
        const sy = (cssH - padY * 2) / (WORLD.halfH * 2);
        scale = Math.min(sx, sy);
        originX = cssW * 0.5;
        originY = cssH * 0.5;
      }

      function worldToScreenX(wx) {
        return originX + wx * scale;
      }
      function worldToScreenY(wy) {
        return originY - wy * scale;
      }
      function screenToWorldX(sx) {
        return (sx - originX) / scale;
      }
      function screenToWorldY(sy) {
        return (originY - sy) / scale;
      }

      function pushShellControl(id, value) {
        syncingControls = true;
        try {
          if (typeof api.setControlValue === 'function') api.setControlValue(id, value, { notify: false });
          else if (typeof api.setControl === 'function') api.setControl(id, value);
          else if (typeof api.updateControl === 'function') api.updateControl(id, value);
          else if (typeof api.setParam === 'function') api.setParam(id, value);
        } catch {
          // Ignore shell push errors
        } finally {
          syncingControls = false;
        }
      }

      function nudgeOutOfObstacles() {
        for (const obs of obstacles) {
          const dx = robot.x - obs.x;
          const dy = robot.y - obs.y;
          const d = hypot2(dx, dy);
          if (d < obs.rSafe + 0.04) {
            const nx = d > 1e-4 ? dx / d : -1;
            const ny = d > 1e-4 ? dy / d : 0;
            robot.x = obs.x + nx * (obs.rSafe + 0.08);
            robot.y = obs.y + ny * (obs.rSafe + 0.08);
          }
        }
      }

      function applyControl(id, rawValue) {
        if (syncingControls) return;
        if (id === 'cbfEnabled') {
          params.cbfEnabled = Boolean(rawValue);
          if (params.cbfEnabled) {
            nudgeOutOfObstacles();
            if (breakActive) {
              canvasHost.classList.remove('is-fault');
            }
          }
        } else if (id === 'alpha') {
          const v = Number(rawValue);
          if (Number.isFinite(v)) params.alpha = clamp(v, 0.2, 6.0);
        } else if (id === 'policyNoise') {
          const v = Number(rawValue);
          if (Number.isFinite(v)) params.policyNoise = clamp(v, 0.0, 4.0);
        } else if (id === 'busLatencyMs') {
          const v = Number(rawValue);
          if (Number.isFinite(v)) params.busLatencyMs = clamp(v, 0, WORLD.maxLatencyMs);
        }
      }

      function applyBreakMode(active) {
        const next = Boolean(active);
        breakActive = next;
        canvasHost.classList.toggle('is-fault', next);

        if (next) {
          savedBeforeBreak = {
            cbfEnabled: true,
            policyNoise: params.policyNoise,
            busLatencyMs: params.busLatencyMs,
          };
          params.cbfEnabled = false;
          params.busLatencyMs = 40;
          params.policyNoise = 2.1;

          pushShellControl('cbfEnabled', false);
          pushShellControl('busLatencyMs', 40);
          pushShellControl('policyNoise', 2.1);

          // Line up robot -> obstacle 0 -> goal so the unshielded fault breaches immediately
          robot.x = -2.85;
          robot.y = 0.06;
          obstacles[0].x = -0.15;
          obstacles[0].y = 0.04;
          obstacles[1].x = 1.45;
          obstacles[1].y = -0.88;
          goal.x = 2.95;
          goal.y = 0.02;
          goal.patrolSide = 1;
          goal.dwellTimer = 0;
          goal.userPinnedTimer = 0;
          trail.length = 0;
        } else {
          params.cbfEnabled = true;
          params.busLatencyMs = savedBeforeBreak.busLatencyMs ?? 10;
          params.policyNoise = savedBeforeBreak.policyNoise ?? 1.1;

          pushShellControl('cbfEnabled', true);
          pushShellControl('busLatencyMs', params.busLatencyMs);
          pushShellControl('policyNoise', params.policyNoise);

          // If robot is currently trapped deep inside an obstacle, nudge cleanly onto safe boundary
          for (const obs of obstacles) {
            const dx = robot.x - obs.x;
            const dy = robot.y - obs.y;
            const d = hypot2(dx, dy);
            if (d < obs.rSafe + 0.04) {
              const nx = d > 1e-4 ? dx / d : -1;
              const ny = d > 1e-4 ? dy / d : 0;
              robot.x = obs.x + nx * (obs.rSafe + 0.08);
              robot.y = obs.y + ny * (obs.rSafe + 0.08);
            }
          }
        }
      }

      function resetWorld() {
        robot.x = -3.05;
        robot.y = -0.25;
        robot.vx = 0;
        robot.vy = 0;
        obstacles[0].x = -0.55;
        obstacles[0].y = 0.42;
        obstacles[1].x = 1.08;
        obstacles[1].y = -0.58;
        goal.x = 3.1;
        goal.y = 0.25;
        goal.patrolSide = 1;
        goal.dwellTimer = 0;
        goal.userPinnedTimer = 0;
        ouNoise.x = 0;
        ouNoise.y = 0;
        delayBufX.fill(0);
        delayBufY.fill(0);
        live.breachCount = 0;
        live.inBreach = false;
        live.breachFlash = 0;
        trail.length = 0;
        sparkHistory.length = 0;
      }

      // ---- 1000 Hz Physics Substep ----
      function stepPhysics1ms() {
        const dt = WORLD.substepDt;
        live.simTime += dt;

        // 1. Goal auto-patrol cycling (keeps continuous motion across obstacle field)
        if (goal.userPinnedTimer > 0) {
          goal.userPinnedTimer = Math.max(0, goal.userPinnedTimer - dt);
        }
        const distToGoal = hypot2(goal.x - robot.x, goal.y - robot.y);
        if (distToGoal < 0.34 && dragTarget?.kind !== 'goal' && goal.userPinnedTimer <= 0) {
          goal.dwellTimer += dt;
          if (goal.dwellTimer > 0.35) {
            goal.dwellTimer = 0;
            goal.patrolSide *= -1;
            const targetX = goal.patrolSide * (2.85 + (Math.random() - 0.5) * 0.5);
            const targetY = (Math.random() - 0.5) * 2.2;
            // Ensure patrol beacon doesn't spawn inside an obstacle
            let gx = clamp(targetX, -WORLD.halfW + 0.55, WORLD.halfW - 0.55);
            let gy = clamp(targetY, -WORLD.halfH + 0.55, WORLD.halfH - 0.55);
            for (const obs of obstacles) {
              const dx = gx - obs.x;
              const dy = gy - obs.y;
              const d = hypot2(dx, dy);
              if (d < obs.rSafe + 0.45) {
                const nx = d > 1e-3 ? dx / d : goal.patrolSide;
                const ny = d > 1e-3 ? dy / d : 0.4;
                gx = clamp(obs.x + nx * (obs.rSafe + 0.55), -WORLD.halfW + 0.55, WORLD.halfW - 0.55);
                gy = clamp(obs.y + ny * (obs.rSafe + 0.55), -WORLD.halfH + 0.55, WORLD.halfH - 0.55);
              }
            }
            goal.x = gx;
            goal.y = gy;
          }
        } else {
          goal.dwellTimer = 0;
        }

        // 2. Stochastic AI policy nominal velocity with smooth Ornstein-Uhlenbeck noise
        const sigma = params.policyNoise;
        const decay = Math.exp(-dt / WORLD.ouTau);
        const diffScale = sigma * Math.sqrt(Math.max(0, 1 - decay * decay));
        ouNoise.x = ouNoise.x * decay + diffScale * randNormal();
        ouNoise.y = ouNoise.y * decay + diffScale * randNormal();

        let vxGoal = WORLD.goalKp * (goal.x - robot.x);
        let vyGoal = WORLD.goalKp * (goal.y - robot.y);
        const vGoalMag = hypot2(vxGoal, vyGoal);
        if (vGoalMag > WORLD.maxGoalSpeed) {
          const s = WORLD.maxGoalSpeed / vGoalMag;
          vxGoal *= s;
          vyGoal *= s;
        }

        let uRawX = vxGoal + ouNoise.x;
        let uRawY = vyGoal + ouNoise.y;
        const uRawMag = hypot2(uRawX, uRawY);
        if (uRawMag > WORLD.maxCmdSpeed) {
          const s = WORLD.maxCmdSpeed / uRawMag;
          uRawX *= s;
          uRawY *= s;
        }

        // 3. Push raw AI command into 1ms ring buffer & read delayed command (bus latency τ)
        delayBufX[delayHead] = uRawX;
        delayBufY[delayHead] = uRawY;
        const delaySlots = clamp(Math.round(params.busLatencyMs), 0, WORLD.maxLatencyMs);
        const readIdx = (delayHead - delaySlots + latencyCap) % latencyCap;
        const uNomX = delayBufX[readIdx];
        const uNomY = delayBufY[readIdx];
        delayHead = (delayHead + 1) % latencyCap;

        // 4. Deterministic 1000 Hz CBF-QP Safety Filter
        // Small conservative buffer proportional to latency ensures strict h(x) >= 0 invariance
        const latencyMargin = 0.015 + 0.045 * (delaySlots / WORLD.maxLatencyMs);
        const qp = solveCbfQp(
          robot.x,
          robot.y,
          uNomX,
          uNomY,
          obstacles,
          params.alpha,
          latencyMargin
        );

        let uStarX = uNomX;
        let uStarY = uNomY;
        if (params.cbfEnabled) {
          uStarX = qp.ux;
          uStarY = qp.uy;
        }

        // 5. Integrate holonomic robot state
        robot.vx = uStarX;
        robot.vy = uStarY;
        robot.x += robot.vx * dt;
        robot.y += robot.vy * dt;

        // Keep robot inside arena bounds cleanly
        const boundX = WORLD.halfW - WORLD.robotRadius - 0.06;
        const boundY = WORLD.halfH - WORLD.robotRadius - 0.06;
        robot.x = clamp(robot.x, -boundX, boundX);
        robot.y = clamp(robot.y, -boundY, boundY);

        const speed = hypot2(robot.vx, robot.vy);
        if (speed > 0.08) {
          const targetAngle = Math.atan2(robot.vy, robot.vx);
          let diff = targetAngle - robot.heading;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          robot.heading += diff * clamp(dt * 14, 0, 1);
        }

        // Recompute exact post-step minimum barrier h(x) for breach detection
        let postMinH = Infinity;
        let postNearestIdx = 0;
        let postGradX = 0;
        let postGradY = 0;
        for (let i = 0; i < obstacles.length; i++) {
          const obs = obstacles[i];
          const dx = robot.x - obs.x;
          const dy = robot.y - obs.y;
          const h = dx * dx + dy * dy - obs.rSafe * obs.rSafe;
          if (h < postMinH) {
            postMinH = h;
            postNearestIdx = i;
            postGradX = 2.0 * dx;
            postGradY = 2.0 * dy;
          }
          if (obs.pulse > 0) {
            obs.pulse = Math.max(0, obs.pulse - dt * 2.2);
          }
        }

        const isBreachNow = postMinH < -0.005;
        if (isBreachNow && !live.inBreach) {
          live.breachCount += 1;
          live.breachFlash = 1.0;
          obstacles[postNearestIdx].pulse = 1.0;
        }
        live.inBreach = isBreachNow;
        if (live.breachFlash > 0) {
          live.breachFlash = Math.max(0, live.breachFlash - dt * 1.8);
        }

        live.uNomX = uNomX;
        live.uNomY = uNomY;
        live.uStarX = uStarX;
        live.uStarY = uStarY;
        live.deltaUX = uStarX - uNomX;
        live.deltaUY = uStarY - uNomY;
        live.minH = postMinH;
        live.nearestIdx = postNearestIdx;
        live.gradX = postGradX;
        live.gradY = postGradY;
        live.nearestB = -params.alpha * postMinH + latencyMargin;
        live.activeCount = params.cbfEnabled ? qp.activeCount : 0;

        // Record trajectory trail (~45 Hz)
        trailAccum += dt;
        if (trailAccum >= 0.022) {
          trailAccum = 0;
          const duMag = hypot2(live.deltaUX, live.deltaUY);
          const mode = isBreachNow ? 'breach' : duMag > 0.08 ? 'grazing' : 'safe';
          trail.push({ x: robot.x, y: robot.y, mode });
          if (trail.length > WORLD.trailCapacity) trail.shift();
        }

        // Record h(x) sparkline (~50 Hz -> ~4.8s window)
        sparkAccum += dt;
        if (sparkAccum >= 0.02) {
          sparkAccum = 0;
          sparkHistory.push(postMinH);
          if (sparkHistory.length > WORLD.sparkCapacity) sparkHistory.shift();
        }
      }

      // ---- Vector & HUD Drawing Helpers ----
      function drawArrow(x1, y1, x2, y2, color, lineWidth, dashed, glowAlpha, label, labelOffset) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = hypot2(dx, dy);
        if (len < 3) return;

        const angle = Math.atan2(dy, dx);
        const headLen = Math.min(13, Math.max(7, len * 0.28));

        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (glowAlpha > 0) {
          ctx.shadowColor = color;
          ctx.shadowBlur = glowAlpha;
        }
        if (dashed) {
          ctx.setLineDash([6, 4]);
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2 - Math.cos(angle) * (headLen * 0.6), y2 - Math.sin(angle) * (headLen * 0.6));
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headLen * Math.cos(angle - Math.PI / 6.2),
          y2 - headLen * Math.sin(angle - Math.PI / 6.2)
        );
        ctx.lineTo(
          x2 - headLen * Math.cos(angle + Math.PI / 6.2),
          y2 - headLen * Math.sin(angle + Math.PI / 6.2)
        );
        ctx.closePath();
        ctx.fill();

        if (label) {
          ctx.shadowBlur = 0;
          ctx.font = '600 11px "JetBrains Mono", ui-monospace, monospace';
          const ox = labelOffset ? labelOffset.x : Math.cos(angle) * 12;
          const oy = labelOffset ? labelOffset.y : Math.sin(angle) * 12;
          const tx = x2 + ox;
          const ty = y2 + oy;
          const metrics = ctx.measureText(label);
          const padX = 4;
          const bw = metrics.width + padX * 2;
          const bh = 16;
          ctx.fillStyle = 'rgba(10, 12, 16, 0.84)';
          ctx.beginPath();
          ctx.roundRect(tx - bw * 0.5, ty - bh * 0.5, bw, bh, 4);
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 0.85;
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, tx, ty + 0.5);
        }

        ctx.restore();
      }

      function drawGrid() {
        const minX = -Math.floor(WORLD.halfW);
        const maxX = Math.floor(WORLD.halfW);
        const minY = -Math.floor(WORLD.halfH);
        const maxY = Math.floor(WORLD.halfH);

        ctx.save();
        // Minor 0.5m grid
        ctx.strokeStyle = COLORS.gridMinor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let wx = minX - 0.5; wx <= maxX + 0.5; wx += 0.5) {
          const sx = Math.round(worldToScreenX(wx)) + 0.5;
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, cssH);
        }
        for (let wy = minY - 0.5; wy <= maxY + 0.5; wy += 0.5) {
          const sy = Math.round(worldToScreenY(wy)) + 0.5;
          ctx.moveTo(0, sy);
          ctx.lineTo(cssW, sy);
        }
        ctx.stroke();

        // Major 1.0m grid
        ctx.strokeStyle = COLORS.gridMajor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let wx = minX; wx <= maxX; wx += 1) {
          const sx = Math.round(worldToScreenX(wx)) + 0.5;
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, cssH);
        }
        for (let wy = minY; wy <= maxY; wy += 1) {
          const sy = Math.round(worldToScreenY(wy)) + 0.5;
          ctx.moveTo(0, sy);
          ctx.lineTo(cssW, sy);
        }
        ctx.stroke();

        // Subtle origin crosshair
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.11)';
        ctx.beginPath();
        ctx.moveTo(originX - 10, originY);
        ctx.lineTo(originX + 10, originY);
        ctx.moveTo(originX, originY - 10);
        ctx.lineTo(originX, originY + 10);
        ctx.stroke();

        // Subtle meter tick labels along bottom-right axis
        ctx.font = '500 9.5px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = COLORS.axisLabel;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let wx = -3; wx <= 3; wx += 1) {
          if (wx === 0) continue;
          ctx.fillText(`${wx}m`, worldToScreenX(wx), cssH - 16);
        }
        ctx.restore();
      }

      function drawObstacles(nowSec) {
        const activeVar = highlightedVar || canvasHoverVar;
        const highlightH = activeVar === 'h_x';
        const pulseWave = 0.5 + 0.5 * Math.sin(nowSec * 6.0);

        for (let i = 0; i < obstacles.length; i++) {
          const obs = obstacles[i];
          const cx = worldToScreenX(obs.x);
          const cy = worldToScreenY(obs.y);
          const rSafePx = obs.rSafe * scale;
          const rCorePx = Math.max(12, (obs.rSafe - WORLD.robotRadius) * scale);
          const isNearest = i === live.nearestIdx;
          const isBreachingThis =
            live.inBreach && isNearest;
          const isHovered =
            (hoverTarget && hoverTarget.kind === 'obstacle' && hoverTarget.idx === i) ||
            (dragTarget && dragTarget.kind === 'obstacle' && dragTarget.idx === i);

          ctx.save();

          // Concentric outer barrier level sets: h(x) = +0.8, +1.8
          const levelSets = [0.8, 1.8];
          for (let li = 0; li < levelSets.length; li++) {
            const hVal = levelSets[li];
            const rLevel = Math.sqrt(obs.rSafe * obs.rSafe + hVal) * scale;
            ctx.beginPath();
            ctx.arc(cx, cy, rLevel, 0, Math.PI * 2);
            ctx.setLineDash([4, 6]);
            ctx.lineWidth = highlightH ? 1.5 : 1;
            const alpha = highlightH
              ? 0.28 + 0.2 * pulseWave
              : li === 0
              ? 0.16
              : 0.08;
            ctx.strokeStyle = `rgba(${COLORS.crimsonRgb}, ${alpha})`;
            ctx.stroke();
          }
          ctx.setLineDash([]);

          // Breach shockwave ring
          if (obs.pulse > 0.01) {
            const shockR = rSafePx + (1 - obs.pulse) * 34;
            ctx.beginPath();
            ctx.arc(cx, cy, shockR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${COLORS.crimsonRgb}, ${obs.pulse * 0.85})`;
            ctx.lineWidth = 2.5;
            ctx.stroke();
          }

          // Forbidden zone radial fill
          const grad = ctx.createRadialGradient(cx, cy, rCorePx * 0.12, cx, cy, rSafePx);
          grad.addColorStop(
            0,
            isBreachingThis ? 'rgba(255, 23, 68, 0.42)' : 'rgba(255, 23, 68, 0.24)'
          );
          grad.addColorStop(
            0.72,
            isBreachingThis ? 'rgba(255, 23, 68, 0.22)' : 'rgba(255, 23, 68, 0.10)'
          );
          grad.addColorStop(1, 'rgba(255, 23, 68, 0.02)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, rSafePx, 0, Math.PI * 2);
          ctx.fill();

          // Subtle diagonal hazard hatch clipped to physical core radius
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, rCorePx, 0, Math.PI * 2);
          ctx.clip();
          ctx.strokeStyle = isBreachingThis
            ? 'rgba(255, 23, 68, 0.34)'
            : 'rgba(255, 23, 68, 0.15)';
          ctx.lineWidth = 1;
          const step = 11;
          for (let k = -rCorePx * 2; k <= rCorePx * 2; k += step) {
            ctx.beginPath();
            ctx.moveTo(cx + k - rCorePx, cy + rCorePx);
            ctx.lineTo(cx + k + rCorePx, cy - rCorePx);
            ctx.stroke();
          }
          ctx.restore();

          // Inner physical core outline
          ctx.beginPath();
          ctx.arc(cx, cy, rCorePx, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 23, 68, 0.38)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Exact h(x) = 0 Barrier Boundary Ring
          const grazingGlow = isNearest && live.activeCount > 0 && params.cbfEnabled;
          const ringColor = isBreachingThis
            ? COLORS.crimson
            : grazingGlow
            ? COLORS.amber
            : COLORS.crimson;
          ctx.beginPath();
          ctx.arc(cx, cy, rSafePx, 0, Math.PI * 2);
          ctx.strokeStyle = ringColor;
          ctx.lineWidth = highlightH
            ? 2.8 + pulseWave * 1.4
            : isBreachingThis
            ? 3.0
            : grazingGlow
            ? 2.4
            : isHovered
            ? 2.2
            : 1.75;
          ctx.shadowColor = ringColor;
          ctx.shadowBlur = highlightH
            ? 18 + pulseWave * 10
            : isBreachingThis
            ? 20
            : grazingGlow
            ? 14
            : 8;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // h(x) = 0 badge pinned to top edge of boundary
          ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace';
          ctx.fillStyle = highlightH ? '#FFFFFF' : 'rgba(255, 138, 158, 0.92)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(
            `h${i + 1}(x) = 0`,
            cx,
            cy - rSafePx - 5
          );

          // Center drag grip & label
          ctx.beginPath();
          ctx.arc(cx, cy, isHovered ? 7.5 : 5.5, 0, Math.PI * 2);
          ctx.fillStyle = isHovered ? 'rgba(255, 23, 68, 0.4)' : 'rgba(10, 12, 16, 0.8)';
          ctx.fill();
          ctx.strokeStyle = isHovered ? '#FFFFFF' : 'rgba(255, 130, 150, 0.78)';
          ctx.lineWidth = 1.3;
          ctx.stroke();

          ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace';
          ctx.fillStyle = 'rgba(255, 205, 214, 0.86)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(isHovered ? 'DRAG ZONE' : obs.label, cx, cy + 11);

          ctx.restore();
        }
      }

      function drawGoal(nowSec) {
        const gx = worldToScreenX(goal.x);
        const gy = worldToScreenY(goal.y);
        const isHovered =
          (hoverTarget && hoverTarget.kind === 'goal') ||
          (dragTarget && dragTarget.kind === 'goal');
        const pulse = 0.5 + 0.5 * Math.sin(nowSec * 3.8);

        ctx.save();

        // Outer rotating dashed reticle
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(nowSec * 0.75);
        ctx.beginPath();
        ctx.arc(0, 0, isHovered ? 22 : 18, 0, Math.PI * 2);
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = `rgba(${COLORS.emeraldRgb}, ${isHovered ? 0.95 : 0.65})`;
        ctx.lineWidth = isHovered ? 2 : 1.4;
        ctx.shadowColor = COLORS.emerald;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();

        // Pulsing halo
        const halo = ctx.createRadialGradient(gx, gy, 2, gx, gy, 24 + pulse * 6);
        halo.addColorStop(0, `rgba(${COLORS.emeraldRgb}, 0.42)`);
        halo.addColorStop(1, `rgba(${COLORS.emeraldRgb}, 0.0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(gx, gy, 24 + pulse * 6, 0, Math.PI * 2);
        ctx.fill();

        // Crisp core diamond / beacon
        ctx.beginPath();
        ctx.arc(gx, gy, isHovered ? 7.5 : 6, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.emerald;
        ctx.shadowColor = COLORS.emerald;
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#0A0C10';
        ctx.fill();

        ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = COLORS.emerald;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(isHovered ? 'DRAG GOAL' : 'GOAL', gx, gy + 23);

        ctx.restore();
      }

      function drawTrail() {
        if (trail.length < 2) return;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < trail.length; i++) {
          const p0 = trail[i - 1];
          const p1 = trail[i];
          const t = i / trail.length;
          const rgb =
            p1.mode === 'breach'
              ? COLORS.crimsonRgb
              : p1.mode === 'grazing'
              ? COLORS.amberRgb
              : COLORS.emeraldRgb;

          ctx.strokeStyle = `rgba(${rgb}, ${0.08 + t * 0.78})`;
          ctx.lineWidth = 1.2 + t * 2.6;
          ctx.beginPath();
          ctx.moveTo(worldToScreenX(p0.x), worldToScreenY(p0.y));
          ctx.lineTo(worldToScreenX(p1.x), worldToScreenY(p1.y));
          ctx.stroke();
        }
        ctx.restore();
      }

      /**
       * Draws linked-equation geometric overlays when user hovers `grad_h`, `alpha`, or `h_x`.
       */
      function drawLinkedMathOverlays(rx, ry) {
        const activeVar = highlightedVar || canvasHoverVar;
        if (!activeVar) return;

        const obs = obstacles[live.nearestIdx];
        if (!obs) return;
        const ox = worldToScreenX(obs.x);
        const oy = worldToScreenY(obs.y);
        const gx = live.gradX;
        const gy = live.gradY;
        const gLen = hypot2(gx, gy);
        if (gLen < 1e-4) return;
        const nx = gx / gLen;
        const ny = gy / gLen;

        // Screen-space unit normal (note Y inversion!)
        const snx = nx;
        const sny = -ny;
        // Tangent unit vector
        const stx = -sny;
        const sty = snx;

        if (activeVar === 'grad_h') {
          ctx.save();
          // Draw outward normal ∇h(x) vector from robot
          const vecPx = clamp(gLen * 22, 46, 118);
          drawArrow(
            rx,
            ry,
            rx + snx * vecPx,
            ry + sny * vecPx,
            COLORS.amber,
            3.0,
            false,
            16,
            `∇h(x)  ‖${gLen.toFixed(1)}‖`,
            { x: snx * 20, y: sny * 20 }
          );

          // Draw orthogonal safety tangent hyperplane through robot
          ctx.strokeStyle = 'rgba(255, 179, 0, 0.52)';
          ctx.lineWidth = 1.4;
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.moveTo(rx - stx * 95, ry - sty * 95);
          ctx.lineTo(rx + stx * 95, ry + sty * 95);
          ctx.stroke();
          ctx.restore();
        }

        if (activeVar === 'alpha') {
          // Illustrate allowable approach-speed half-space: { u : n · u >= -α·h / ‖∇h‖ }
          const vScale = scale * 0.42;
          const maxApproachSpeed = (params.alpha * Math.max(0, live.minH)) / Math.max(0.25, gLen);
          const shiftPx = clamp(maxApproachSpeed * vScale, 0, 95);

          // Boundary line shifted inward (opposite to normal) by shiftPx
          const bx = rx - snx * shiftPx;
          const by = ry - sny * shiftPx;

          ctx.save();
          // Shaded SAFE velocity half-plane
          ctx.beginPath();
          ctx.moveTo(bx - stx * 130, by - sty * 130);
          ctx.lineTo(bx + stx * 130, by + sty * 130);
          ctx.lineTo(bx + stx * 130 + snx * 115, by + sty * 130 + sny * 115);
          ctx.lineTo(bx - stx * 130 + snx * 115, by - sty * 130 + sny * 115);
          ctx.closePath();
          ctx.fillStyle = 'rgba(0, 229, 255, 0.13)';
          ctx.fill();

          // Safe velocity half-plane boundary line
          ctx.strokeStyle = COLORS.cyan;
          ctx.lineWidth = 2.0;
          ctx.setLineDash([5, 4]);
          ctx.shadowColor = COLORS.cyan;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(bx - stx * 125, by - sty * 125);
          ctx.lineTo(bx + stx * 125, by + sty * 125);
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.setLineDash([]);

          // Approach-speed cone rays from robot toward the shifted boundary
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(bx - stx * 58, by - sty * 58);
          ctx.moveTo(rx, ry);
          ctx.lineTo(bx + stx * 58, by + sty * 58);
          ctx.stroke();

          // Label showing allowable inward velocity bound
          ctx.font = '600 10.5px "JetBrains Mono", ui-monospace, monospace';
          ctx.fillStyle = COLORS.cyan;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            `SAFE CONE  v_in ≤ ${maxApproachSpeed.toFixed(2)} m/s  (α=${params.alpha.toFixed(1)})`,
            bx + snx * 26,
            by + sny * 26
          );
          ctx.restore();
        }

        if (activeVar === 'h_x') {
          // Draw radial clearance measurement from obstacle boundary to robot
          const rSafePx = obs.rSafe * scale;
          const edgeX = ox + snx * rSafePx;
          const edgeY = oy + sny * rSafePx;
          ctx.save();
          ctx.strokeStyle = live.minH < 0 ? COLORS.crimson : COLORS.emerald;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(edgeX, edgeY);
          ctx.lineTo(rx, ry);
          ctx.stroke();
          ctx.setLineDash([]);

          const mx = (edgeX + rx) * 0.5;
          const my = (edgeY + ry) * 0.5;
          const tag = `h(x) = ${live.minH >= 0 ? '+' : ''}${live.minH.toFixed(2)} m²`;
          ctx.font = '600 10.5px "JetBrains Mono", ui-monospace, monospace';
          const tw = ctx.measureText(tag).width + 12;
          ctx.fillStyle = 'rgba(10, 12, 16, 0.9)';
          ctx.beginPath();
          ctx.roundRect(mx - tw * 0.5, my - 10, tw, 20, 5);
          ctx.fill();
          ctx.strokeStyle = live.minH < 0 ? COLORS.crimson : COLORS.emerald;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = live.minH < 0 ? COLORS.crimson : COLORS.emerald;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tag, mx, my + 0.5);
          ctx.restore();
        }
      }

      function drawRobotAndVectors() {
        const rx = worldToScreenX(robot.x);
        const ry = worldToScreenY(robot.y);
        const rPx = WORLD.robotRadius * scale;
        const vScale = scale * 0.42;

        const activeVar = highlightedVar || canvasHoverVar;
        const dimOther = activeVar === 'u_nom' || activeVar === 'u_star';

        // Linked-equation geometry overlays underneath vectors
        drawLinkedMathOverlays(rx, ry);

        // Compute screen endpoints for the three luminous velocity vectors
        const nomTipX = rx + live.uNomX * vScale;
        const nomTipY = ry - live.uNomY * vScale;
        const starTipX = rx + live.uStarX * vScale;
        const starTipY = ry - live.uStarY * vScale;

        // 1. Dashed Electric Cyan u_nom (raw stochastic AI policy command)
        const nomHot = activeVar === 'u_nom';
        ctx.save();
        if (dimOther && !nomHot) ctx.globalAlpha = 0.35;
        drawArrow(
          rx,
          ry,
          nomTipX,
          nomTipY,
          COLORS.cyan,
          nomHot ? 3.2 : 2.1,
          true,
          nomHot ? 18 : 9,
          nomHot ? `u_nom ${hypot2(live.uNomX, live.uNomY).toFixed(2)}` : 'u_nom',
          { x: 0, y: -14 }
        );
        ctx.restore();

        // 2. Solid Phosphor Emerald u* (CBF-QP safe velocity; crimson if unshielded breach)
        const starHot = activeVar === 'u_star';
        const starColor = live.inBreach ? COLORS.crimson : COLORS.emerald;
        ctx.save();
        if (dimOther && !starHot) ctx.globalAlpha = 0.35;
        drawArrow(
          rx,
          ry,
          starTipX,
          starTipY,
          starColor,
          starHot ? 3.6 : 2.6,
          false,
          starHot ? 20 : 12,
          starHot ? `u* ${hypot2(live.uStarX, live.uStarY).toFixed(2)}` : 'u*',
          { x: 0, y: 16 }
        );
        ctx.restore();

        // 3. Glowing Amber Δu = u* − u_nom (exact real-time QP safety intervention vector)
        const duMag = hypot2(live.deltaUX, live.deltaUY);
        if (duMag > 0.06) {
          drawArrow(
            nomTipX,
            nomTipY,
            starTipX,
            starTipY,
            COLORS.amber,
            2.6,
            false,
            16,
            `Δu ${duMag.toFixed(1)}`,
            { x: 16, y: -12 }
          );
        }

        // Robot chassis body
        ctx.save();
        ctx.translate(rx, ry);

        // Soft glow ring around robot
        const bodyColor = live.inBreach
          ? COLORS.crimson
          : duMag > 0.08
          ? COLORS.amber
          : COLORS.emerald;

        ctx.beginPath();
        ctx.arc(0, 0, rPx + 4, 0, Math.PI * 2);
        ctx.strokeStyle = live.inBreach
          ? `rgba(${COLORS.crimsonRgb}, 0.55)`
          : duMag > 0.08
          ? `rgba(${COLORS.amberRgb}, 0.55)`
          : `rgba(${COLORS.emeraldRgb}, 0.35)`;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Matte stealth chassis disc
        ctx.beginPath();
        ctx.arc(0, 0, rPx, 0, Math.PI * 2);
        ctx.fillStyle = '#141821';
        ctx.shadowColor = bodyColor;
        ctx.shadowBlur = live.inBreach ? 20 : 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.lineWidth = 2.2;
        ctx.strokeStyle = bodyColor;
        ctx.stroke();

        // Directional heading chevron
        ctx.rotate(-robot.heading);
        ctx.beginPath();
        ctx.moveTo(rPx * 0.62, 0);
        ctx.lineTo(-rPx * 0.32, -rPx * 0.42);
        ctx.lineTo(-rPx * 0.14, 0);
        ctx.lineTo(-rPx * 0.32, rPx * 0.42);
        ctx.closePath();
        ctx.fillStyle = bodyColor;
        ctx.fill();

        ctx.restore();
      }

      /**
       * Compact live h(x) sparkline in bottom-left corner so user sees h(x) >= 0 vs breach < 0.
       */
      function drawSparkline() {
        const w = Math.min(204, Math.max(152, cssW * 0.28));
        const h = 72;
        const x = 14;
        const y = cssH - h - 14;
        const activeVar = highlightedVar || canvasHoverVar;
        const highlightH = activeVar === 'h_x';

        ctx.save();
        ctx.fillStyle = 'rgba(10, 12, 16, 0.88)';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 10);
        ctx.fill();

        ctx.strokeStyle = live.inBreach
          ? 'rgba(255, 23, 68, 0.78)'
          : highlightH
          ? 'rgba(0, 230, 118, 0.85)'
          : 'rgba(255, 255, 255, 0.11)';
        ctx.lineWidth = highlightH || live.inBreach ? 1.5 : 1;
        if (highlightH) {
          ctx.shadowColor = COLORS.emerald;
          ctx.shadowBlur = 12;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Header row inside sparkline
        ctx.font = '600 9.5px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = COLORS.textMuted;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('LIVE h(x)', x + 9, y + 7);

        const hValColor = live.minH < 0 ? COLORS.crimson : live.minH < 0.25 ? COLORS.amber : COLORS.emerald;
        ctx.fillStyle = hValColor;
        ctx.textAlign = 'right';
        ctx.fillText(
          `${live.minH >= 0 ? '+' : ''}${live.minH.toFixed(2)} m²`,
          x + w - 9,
          y + 7
        );

        // Plot bounds
        const px = x + 8;
        const py = y + 22;
        const pw = w - 16;
        const ph = h - 30;
        const minVal = -1.1;
        const maxVal = 3.4;
        const mapY = (val) => {
          const clamped = clamp(val, minVal, maxVal);
          const norm = (clamped - minVal) / (maxVal - minVal);
          return py + ph * (1 - norm);
        };

        const zeroY = mapY(0);

        // Crimson danger region shading below h = 0
        ctx.fillStyle = 'rgba(255, 23, 68, 0.11)';
        ctx.fillRect(px, zeroY, pw, py + ph - zeroY);

        // Dashed h = 0 safety boundary line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(px, zeroY);
        ctx.lineTo(px + pw, zeroY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '500 8px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('h=0', px + 2, zeroY - 1.5);

        // Draw live trace
        const n = sparkHistory.length;
        if (n >= 2) {
          ctx.lineWidth = 1.75;
          ctx.lineJoin = 'round';
          for (let i = 1; i < n; i++) {
            const v0 = sparkHistory[i - 1];
            const v1 = sparkHistory[i];
            const x0 = px + ((i - 1) / (WORLD.sparkCapacity - 1)) * pw;
            const x1 = px + (i / (WORLD.sparkCapacity - 1)) * pw;
            const y0 = mapY(v0);
            const y1 = mapY(v1);

            ctx.strokeStyle =
              v1 < 0 ? COLORS.crimson : v1 < 0.2 ? COLORS.amber : COLORS.emerald;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
          }

          // Live dot at rightmost sample
          const lastV = sparkHistory[n - 1];
          const lastX = px + ((n - 1) / (WORLD.sparkCapacity - 1)) * pw;
          const lastY = mapY(lastV);
          ctx.beginPath();
          ctx.arc(lastX, lastY, 2.8, 0, Math.PI * 2);
          ctx.fillStyle = lastV < 0 ? COLORS.crimson : COLORS.emerald;
          ctx.fill();
        }

        ctx.restore();
      }

      function drawHudOverlays() {
        ctx.save();

        // Top-left status badge (nudged down when shell fault banner is visible)
        const topY = breakActive ? 54 : 12;
        const badgeX = 14;
        const badgeY = topY;
        const shieldText = params.cbfEnabled
          ? 'CBF-QP SHIELD: ACTIVE • 1000 Hz'
          : 'CBF-QP SHIELD: BYPASSED (UNSHIELDED)';
        const statusColor = live.inBreach
          ? COLORS.crimson
          : params.cbfEnabled
          ? COLORS.emerald
          : COLORS.amber;

        ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace';
        const tw = ctx.measureText(shieldText).width + 26;
        ctx.fillStyle = 'rgba(10, 12, 16, 0.84)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, tw, 24, 999);
        ctx.fill();
        ctx.strokeStyle = params.cbfEnabled
          ? 'rgba(0, 230, 118, 0.35)'
          : 'rgba(255, 23, 68, 0.65)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Status LED
        ctx.beginPath();
        ctx.arc(badgeX + 11, badgeY + 12, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = statusColor;
        ctx.shadowColor = statusColor;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = COLORS.textPrimary;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(shieldText, badgeX + 20, badgeY + 12.5);

        // Top-right compact vector legend
        const legendW = 146;
        const legendH = 62;
        const lx = cssW - legendW - 14;
        const ly = topY;
        if (cssW >= 440) {
          ctx.fillStyle = 'rgba(10, 12, 16, 0.82)';
          ctx.beginPath();
          ctx.roundRect(lx, ly, legendW, legendH, 10);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
          ctx.lineWidth = 1;
          ctx.stroke();

          const rows = [
            { color: COLORS.cyan, dashed: true, text: 'u_nom  AI Policy' },
            { color: COLORS.emerald, dashed: false, text: 'u*     CBF Safe' },
            { color: COLORS.amber, dashed: false, text: 'Δu     Intervention' },
          ];
          ctx.font = '500 9.5px "JetBrains Mono", ui-monospace, monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          for (let i = 0; i < rows.length; i++) {
            const ry = ly + 13 + i * 17;
            ctx.strokeStyle = rows[i].color;
            ctx.lineWidth = 2;
            ctx.setLineDash(rows[i].dashed ? [4, 3] : []);
            ctx.beginPath();
            ctx.moveTo(lx + 10, ry);
            ctx.lineTo(lx + 26, ry);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = COLORS.textPrimary;
            ctx.fillText(rows[i].text, lx + 33, ry + 0.5);
          }
        }

        // Bottom-right subtle interaction hint
        ctx.font = '500 10px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(165, 176, 199, 0.62)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Drag crimson obstacles or emerald goal', cssW - 14, cssH - 14);

        ctx.restore();
      }

      function render(nowMs) {
        const nowSec = nowMs * 0.001;
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Dead-front pitch-black backdrop
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, cssW, cssH);

        // Subtle crimson ambient vignette during breach flash
        if (live.inBreach || live.breachFlash > 0.01) {
          const intensity = Math.max(live.inBreach ? 0.16 : 0, live.breachFlash * 0.24);
          const vig = ctx.createRadialGradient(
            cssW * 0.5,
            cssH * 0.5,
            Math.min(cssW, cssH) * 0.22,
            cssW * 0.5,
            cssH * 0.5,
            Math.max(cssW, cssH) * 0.68
          );
          vig.addColorStop(0, 'rgba(255, 23, 68, 0)');
          vig.addColorStop(1, `rgba(255, 23, 68, ${intensity})`);
          ctx.fillStyle = vig;
          ctx.fillRect(0, 0, cssW, cssH);
        }

        drawGrid();
        drawObstacles(nowSec);
        drawGoal(nowSec);
        drawTrail();
        drawRobotAndVectors();
        drawSparkline();
        drawHudOverlays();

        ctx.restore();
      }

      // ---- Telemetry & Linked-Equation Push ----
      let lastTelemetryPush = 0;
      function pushLiveReadouts(nowMs) {
        if (nowMs - lastTelemetryPush < 50) return; // ~20 Hz crisp UI telemetry
        lastTelemetryPush = nowMs;

        const duMag = hypot2(live.deltaUX, live.deltaUY);
        const uNomMag = hypot2(live.uNomX, live.uNomY);
        const uStarMag = hypot2(live.uStarX, live.uStarY);
        const gradMag = hypot2(live.gradX, live.gradY);

        const hTone = live.minH < 0 ? 'crimson' : live.minH < 0.25 ? 'amber' : 'emerald';
        const statusTone = live.inBreach
          ? 'crimson'
          : duMag > 0.08
          ? 'amber'
          : 'emerald';
        const statusText = live.inBreach
          ? `BREACH • ${live.breachCount} ${live.breachCount === 1 ? 'hit' : 'hits'}`
          : params.cbfEnabled
          ? duMag > 0.08
            ? `SHIELDING • ${live.breachCount} hits`
            : `SAFE • ${live.breachCount} hits`
          : `UNSHIELDED • ${live.breachCount} hits`;

        const telemetryPayload = {
          hMin: {
            value: `${live.minH >= 0 ? '+' : ''}${live.minH.toFixed(2)}`,
            color: hTone,
          },
          deltaU: {
            value: duMag.toFixed(2),
            color: duMag > 0.08 ? 'amber' : 'cyan',
          },
          latency: {
            value: `${Math.round(params.busLatencyMs)}`,
            color: params.busLatencyMs >= 35 ? 'crimson' : 'cyan',
          },
          safetyStatus: {
            value: statusText,
            color: statusTone,
          },
        };

        const eqPayload = {
          u_star: { value: uStarMag, color: live.inBreach ? 'crimson' : 'emerald' },
          u_nom: { value: uNomMag, color: 'cyan' },
          grad_h: { value: gradMag, color: 'amber' },
          alpha: { value: params.alpha, color: 'cyan' },
          h_x: {
            value: `${live.minH >= 0 ? '+' : ''}${live.minH.toFixed(2)}`,
            color: hTone,
          },
        };

        const statusObj = live.inBreach
          ? { level: 'fault', label: `BREACH • h=${live.minH.toFixed(2)}` }
          : !params.cbfEnabled
            ? { level: 'warning', label: 'UNSHIELDED POLICY' }
            : duMag > 0.08
              ? { level: 'warning', label: 'CBF-QP INTERVENING' }
              : { level: 'safe', label: 'SAFE INVARIANT' };

        try {
          if (typeof api.updateTelemetry === 'function') api.updateTelemetry(telemetryPayload, statusObj);
          else if (typeof api.setTelemetry === 'function') api.setTelemetry(telemetryPayload, statusObj);

          if (typeof api.updateEquation === 'function') api.updateEquation(eqPayload);
          else if (typeof api.updateEquationValues === 'function') api.updateEquationValues(eqPayload);
          else if (typeof api.setEquationValues === 'function') api.setEquationValues(eqPayload);
        } catch {
          // Ignore UI callback errors so physics stays uninterrupted
        }
      }

      // ---- Pointer Interaction (Drag Obstacles or Goal + Hover Inspect) ----
      function getPointerWorld(ev) {
        const rect = canvas.getBoundingClientRect();
        const sx = ev.clientX - rect.left;
        const sy = ev.clientY - rect.top;
        return { sx, sy, wx: screenToWorldX(sx), wy: screenToWorldY(sy) };
      }

      function hitTest(wx, wy) {
        // Check emerald goal first (smaller handle)
        if (hypot2(wx - goal.x, wy - goal.y) <= 0.42) {
          return { kind: 'goal' };
        }
        // Check crimson obstacle zones
        for (let i = 0; i < obstacles.length; i++) {
          const obs = obstacles[i];
          if (hypot2(wx - obs.x, wy - obs.y) <= obs.rSafe) {
            return { kind: 'obstacle', idx: i };
          }
        }
        return null;
      }

      function detectHoverEquationVar(sx, sy) {
        const rx = worldToScreenX(robot.x);
        const ry = worldToScreenY(robot.y);
        const vScale = scale * 0.42;
        const nomTipX = rx + live.uNomX * vScale;
        const nomTipY = ry - live.uNomY * vScale;
        const starTipX = rx + live.uStarX * vScale;
        const starTipY = ry - live.uStarY * vScale;

        if (hypot2(sx - nomTipX, sy - nomTipY) < 20) return 'u_nom';
        if (hypot2(sx - starTipX, sy - starTipY) < 20) return 'u_star';

        // Near an h(x) = 0 boundary ring
        for (const obs of obstacles) {
          const ox = worldToScreenX(obs.x);
          const oy = worldToScreenY(obs.y);
          const d = hypot2(sx - ox, sy - oy);
          if (Math.abs(d - obs.rSafe * scale) < 12) return 'h_x';
        }
        return null;
      }

      const onPointerDown = (ev) => {
        const { wx, wy } = getPointerWorld(ev);
        const hit = hitTest(wx, wy);
        if (!hit) return;

        dragTarget = hit;
        if (hit.kind === 'goal') {
          dragOffsetX = goal.x - wx;
          dragOffsetY = goal.y - wy;
          goal.userPinnedTimer = 5.0;
        } else if (hit.kind === 'obstacle') {
          const obs = obstacles[hit.idx];
          dragOffsetX = obs.x - wx;
          dragOffsetY = obs.y - wy;
        }
        canvas.style.cursor = 'grabbing';
        try {
          canvas.setPointerCapture(ev.pointerId);
        } catch {
          // Ignore pointer capture errors
        }
      };

      const onPointerMove = (ev) => {
        const { sx, sy, wx, wy } = getPointerWorld(ev);
        if (dragTarget) {
          if (dragTarget.kind === 'goal') {
            goal.x = clamp(wx + dragOffsetX, -WORLD.halfW + 0.35, WORLD.halfW - 0.35);
            goal.y = clamp(wy + dragOffsetY, -WORLD.halfH + 0.35, WORLD.halfH - 0.35);
            goal.userPinnedTimer = 5.0;
            goal.dwellTimer = 0;
          } else if (dragTarget.kind === 'obstacle') {
            const obs = obstacles[dragTarget.idx];
            obs.x = clamp(wx + dragOffsetX, -WORLD.halfW + obs.rSafe * 0.5, WORLD.halfW - obs.rSafe * 0.5);
            obs.y = clamp(wy + dragOffsetY, -WORLD.halfH + obs.rSafe * 0.5, WORLD.halfH - obs.rSafe * 0.5);
          }
          return;
        }

        hoverTarget = hitTest(wx, wy);
        canvas.style.cursor = hoverTarget ? 'grab' : 'default';

        // Bidirectional canvas -> equation hover highlight
        const nextVar = detectHoverEquationVar(sx, sy);
        if (nextVar !== canvasHoverVar) {
          canvasHoverVar = nextVar;
          if (!highlightedVar && typeof api.setHighlightedVar === 'function') {
            try {
              api.setHighlightedVar(nextVar);
            } catch {
              // Ignore callback errors
            }
          }
        }
      };

      const onPointerUp = (ev) => {
        if (!dragTarget) return;
        dragTarget = null;
        canvas.style.cursor = hoverTarget ? 'grab' : 'default';
        try {
          canvas.releasePointerCapture(ev.pointerId);
        } catch {
          // Ignore
        }
      };

      const onPointerLeave = () => {
        if (!dragTarget) {
          hoverTarget = null;
          if (canvasHoverVar !== null) {
            canvasHoverVar = null;
            if (!highlightedVar && typeof api.setHighlightedVar === 'function') {
              try {
                api.setHighlightedVar(null);
              } catch {
                // Ignore
              }
            }
          }
          canvas.style.cursor = 'default';
        }
      };

      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerUp);
      canvas.addEventListener('pointerleave', onPointerLeave);

      // Subscribe to shell callbacks if provided on `api`
      const unsubs = [];
      const registerSub = (fn, handler) => {
        if (typeof fn === 'function') {
          const maybeUnsub = fn(handler);
          if (typeof maybeUnsub === 'function') unsubs.push(maybeUnsub);
        }
      };

      registerSub(api.onControlChange, (id, val) => {
        if (id && typeof id === 'object') {
          for (const [k, v] of Object.entries(id)) applyControl(k, v);
        } else {
          applyControl(id, val);
        }
      });
      registerSub(api.onParamChange, (id, val) => {
        if (id && typeof id === 'object') {
          for (const [k, v] of Object.entries(id)) applyControl(k, v);
        } else {
          applyControl(id, val);
        }
      });
      registerSub(api.onBreakToggle, (active) => applyBreakMode(active));
      registerSub(api.onBreakChange, (active) => applyBreakMode(active));
      registerSub(api.onReset, () => resetWorld());
      registerSub(api.onHoverVar, (key) => {
        highlightedVar = key || null;
      });
      registerSub(api.onHighlightChange, (key) => {
        highlightedVar = key || null;
      });

      // Responsive ResizeObserver
      updateViewport();
      let resizeObserver = null;
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => updateViewport());
        resizeObserver.observe(canvasHost);
      }
      const onWinResize = () => updateViewport();
      window.addEventListener('resize', onWinResize);

      // ---- 60 FPS Animation Loop driving 1000 Hz Physics ----
      let rafId = 0;
      let destroyed = false;
      let lastFrameMs = performance.now();
      let accumulator = 0;

      function tick(nowMs) {
        if (destroyed) return;
        const dtFrame = Math.min(0.032, Math.max(0, (nowMs - lastFrameMs) * 0.001));
        lastFrameMs = nowMs;

        accumulator += dtFrame;
        let substeps = 0;
        const maxSubsteps = 25;
        while (accumulator >= WORLD.substepDt && substeps < maxSubsteps) {
          stepPhysics1ms();
          accumulator -= WORLD.substepDt;
          substeps++;
        }

        render(nowMs);
        pushLiveReadouts(nowMs);

        rafId = requestAnimationFrame(tick);
      }

      rafId = requestAnimationFrame(tick);

      // Return imperative control handle for FrontierLessonShell
      const controller = {
        setControl(id, val) {
          applyControl(id, val);
        },
        updateControl(id, val) {
          applyControl(id, val);
        },
        setParam(id, val) {
          applyControl(id, val);
        },
        setParams(obj) {
          if (obj && typeof obj === 'object') {
            for (const [k, v] of Object.entries(obj)) applyControl(k, v);
          }
        },
        setBreakMode(active) {
          applyBreakMode(active);
        },
        onBreakToggle(active) {
          applyBreakMode(active);
        },
        setHighlightedVar(key) {
          highlightedVar = key || null;
        },
        highlightVar(key) {
          highlightedVar = key || null;
        },
        onHoverVar(key) {
          highlightedVar = key || null;
        },
        reset() {
          resetWorld();
        },
        resize() {
          updateViewport();
        },
        destroy() {
          if (destroyed) return;
          destroyed = true;
          cancelAnimationFrame(rafId);
          canvas.removeEventListener('pointerdown', onPointerDown);
          canvas.removeEventListener('pointermove', onPointerMove);
          canvas.removeEventListener('pointerup', onPointerUp);
          canvas.removeEventListener('pointercancel', onPointerUp);
          canvas.removeEventListener('pointerleave', onPointerLeave);
          window.removeEventListener('resize', onWinResize);
          if (resizeObserver) resizeObserver.disconnect();
          for (const u of unsubs) {
            try {
              u();
            } catch {
              // Ignore unsubscribe error
            }
          }
          canvasHost.classList.remove('is-fault');
          if (canvas.parentNode === canvasHost) {
            canvasHost.removeChild(canvas);
          }
        },
      };
      controller.dispose = controller.destroy;

      return controller;
    },
  };
}

export default createM41CbfLab;
