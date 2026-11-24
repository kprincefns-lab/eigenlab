/**
 * EIGENLAB — Flagship Interactive Lab F1.2
 * Jacobians, SVD & Manipulability Ellipsoids (2-DOF / 3-DOF Planar Kinematics)
 *
 * Self-contained 60 FPS dead-front canvas lab adhering to the FrontierLessonShell
 * lab descriptor contract. Computes exact analytical forward kinematics, 2×2 / 2×3
 * geometric Jacobians, exact SVD singular values & principal axes, Yoshikawa
 * manipulability, condition number, and Damped Least-Squares (DLS) IK in real time.
 */

const PALETTE = Object.freeze({
  bg: '#0A0C10',
  bgPanel: 'rgba(13, 17, 25, 0.86)',
  bgPanelHi: 'rgba(18, 25, 38, 0.94)',
  gridMinor: 'rgba(148, 163, 184, 0.055)',
  gridMajor: 'rgba(148, 163, 184, 0.12)',
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

const LINK_CONFIG = Object.freeze({
  '2dof': {
    lengths: [1.05, 0.85],
    homeQ: [0.46, 1.12],
    defaultTarget: { x: 1.05, y: 0.72 },
  },
  '3dof': {
    lengths: [0.82, 0.65, 0.43],
    homeQ: [0.35, 0.78, 0.56],
    defaultTarget: { x: 1.05, y: 0.72 },
  },
});

const MONO_FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS_FONT = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function wrapAngle(a) {
  let r = a;
  while (r > Math.PI) r -= Math.PI * 2;
  while (r < -Math.PI) r += Math.PI * 2;
  return r;
}

/**
 * Forward kinematics for an n-link planar serial manipulator.
 * @param {number[]} q
 * @param {number[]} lengths
 */
function computeFK(q, lengths) {
  const n = lengths.length;
  const joints = new Array(n + 1);
  joints[0] = { x: 0, y: 0 };
  let phi = 0;
  let x = 0;
  let y = 0;
  for (let i = 0; i < n; i++) {
    phi += q[i];
    x += lengths[i] * Math.cos(phi);
    y += lengths[i] * Math.sin(phi);
    joints[i + 1] = { x, y };
  }
  return joints;
}

/**
 * Exact analytical 2×n geometric Jacobian J(q).
 * Column k is z_hat × (p_ee - p_{k-1}) = [-(y_ee - y_{k-1}), (x_ee - x_{k-1})]^T.
 * @param {{ x: number, y: number }[]} joints
 */
function computeJacobian(joints) {
  const n = joints.length - 1;
  const ee = joints[n];
  const row0 = new Array(n);
  const row1 = new Array(n);
  for (let k = 0; k < n; k++) {
    row0[k] = -(ee.y - joints[k].y);
    row1[k] = ee.x - joints[k].x;
  }
  return { row0, row1, n };
}

/**
 * Exact analytical SVD of a 2×n Jacobian via symmetric 2×2 Gram matrix M = J J^T.
 * Returns singular values (sigma1 >= sigma2 >= 0), left singular vectors (u1, u2),
 * principal ellipse angle thetaU, Yoshikawa manipulability w, condition number kappa,
 * and Gram components (a, b, c).
 */
function computeSVD(J) {
  const { row0, row1, n } = J;
  let a = 0;
  let b = 0;
  let c = 0;
  for (let k = 0; k < n; k++) {
    a += row0[k] * row0[k];
    b += row0[k] * row1[k];
    c += row1[k] * row1[k];
  }
  const trace = a + c;
  const diff = a - c;
  const disc = Math.sqrt(Math.max(0, diff * diff + 4 * b * b));
  const mu1 = Math.max(0, 0.5 * (trace + disc));
  const mu2 = Math.max(0, 0.5 * (trace - disc));
  const sigma1 = Math.sqrt(mu1);
  const sigma2 = Math.sqrt(mu2);

  const thetaU = 0.5 * Math.atan2(2 * b, diff);
  const cosU = Math.cos(thetaU);
  const sinU = Math.sin(thetaU);
  const u1 = { x: cosU, y: sinU };
  const u2 = { x: -sinU, y: cosU };

  // Right singular vectors in joint space: v_i = (1 / sigma_i) J^T u_i
  const v1 = new Array(n).fill(0);
  const v2 = new Array(n).fill(0);
  if (sigma1 > 1e-8) {
    for (let k = 0; k < n; k++) {
      v1[k] = (row0[k] * u1.x + row1[k] * u1.y) / sigma1;
    }
  }
  if (sigma2 > 1e-8) {
    for (let k = 0; k < n; k++) {
      v2[k] = (row0[k] * u2.x + row1[k] * u2.y) / sigma2;
    }
  }

  const w = sigma1 * sigma2;
  const kappa = sigma1 / Math.max(sigma2, 1e-4);

  return {
    sigma1,
    sigma2,
    thetaU,
    u1,
    u2,
    v1,
    v2,
    w,
    kappa,
    gram: { a, b, c },
  };
}

/**
 * Solves Damped Least-Squares J^T (J J^T + lambda^2 I)^(-1) * v_cart
 */
function solveDLS(J, gram, lambda, vx, vy) {
  const { row0, row1, n } = J;
  const lam2 = lambda * lambda;
  const a = gram.a + lam2;
  const b = gram.b;
  const c = gram.c + lam2;
  const det = a * c - b * b;
  const invDet = Math.abs(det) > 1e-12 ? 1 / det : 0;

  // y = (J J^T + lambda^2 I)^(-1) * v
  const y0 = (c * vx - b * vy) * invDet;
  const y1 = (-b * vx + a * vy) * invDet;

  const qdot = new Array(n);
  let normSq = 0;
  for (let k = 0; k < n; k++) {
    const val = row0[k] * y0 + row1[k] * y1;
    qdot[k] = val;
    normSq += val * val;
  }
  return { qdot, norm: Math.sqrt(normSq) };
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

function drawArrow(ctx, x1, y1, x2, y2, color, lineWidth = 2, headLen = 9, glow = 0) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const ux = dx / len;
  const uy = dy / len;
  const hl = Math.min(headLen, len * 0.45);
  const hw = hl * 0.56;

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
  ctx.lineTo(x2 - ux * hl * 0.72, y2 - uy * hl * 0.72);
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
 * Factory creating the F1.2 Jacobians, SVD & Manipulability Ellipsoids lab descriptor.
 */
export function createF12JacobianLab() {
  return {
    nodeId: 'F1.2',
    title: 'Jacobians, SVD & Manipulability Ellipsoids',
    subtitle: 'Interactive 2-Link / 3-Link Planar Kinematics & Singularity Lab',
    tier: 1,
    badge: 'Tier 1 · Kinematics & Linear Algebra',

    breakMode: {
      buttonLabel: '⚡ Force Singularity',
      activeLabel: '🔥 Singularity Fault Active',
      description:
        'Locks the target past the stretched outer boundary (r = L₁ + L₂ + 0.08, θ₂ → 0°) with near-zero DLS damping (λ = 0.002), collapsing the manipulability ellipse into a pulsing 1D line and causing joint velocities to explode past 40 rad/s.',
      recoveryHint:
        'Raise the DLS Safety λ slider above 0.10 to regularize Jᵀ(JJᵀ + λ²I)⁻¹ and immediately rescue the actuators.',
    },

    telemetryDefs: [
      { key: 'w', label: 'Manipulability w', accent: 'emerald', initial: '0.84' },
      { key: 'kappa', label: 'Condition κ', accent: 'cyan', initial: '2.15' },
      { key: 'sigma2', label: 'Min Singular σ₂', accent: 'amber', initial: '0.58' },
      { key: 'qdot', label: 'Joint Vel ‖q̇‖', accent: 'crimson', initial: '1.72 rad/s' },
    ],

    equationSpec: {
      caption: 'Differential Kinematics & SVD Manipulability — Hover Any Symbol',
      parts: [
        {
          type: 'var',
          key: 'v',
          label: 'End-Effector Velocity v',
          symbol: '\\mathbf{v}',
          color: 'cyan',
          tooltip: 'Unit Cartesian task velocity command (1.0 m/s) along the weakest singular axis u₂.',
          initialValue: '1.00 m/s',
        },
        { type: 'op', text: '=' },
        {
          type: 'var',
          key: 'J',
          label: 'Jacobian Matrix J(θ)',
          symbol: 'J(\\theta)',
          color: 'violet',
          tooltip: 'Analytical Jacobian columns J₁, J₂ (, J₃) showing how each joint instantaneously pushes the tip.',
          initialValue: '2×2',
        },
        { type: 'op', text: '·' },
        {
          type: 'var',
          key: 'qdot',
          label: 'Joint Velocity q̇',
          symbol: '\\dot{\\mathbf{q}}',
          color: 'crimson',
          tooltip: 'Required joint angular velocities solved via Damped Least-Squares Jᵀ(JJᵀ + λ²I)⁻¹ v.',
          initialValue: '1.72 rad/s',
        },
        { type: 'op', text: '|' },
        {
          type: 'var',
          key: 'sigma',
          label: 'Manipulability w = σ₁·σ₂',
          symbol: 'w = \\sigma_1 \\cdot \\sigma_2',
          color: 'emerald',
          tooltip: 'Yoshikawa manipulability proportional to the area of the SVD velocity ellipsoid.',
          initialValue: '0.84',
        },
        { type: 'op', text: '|' },
        {
          type: 'var',
          key: 'kappa',
          label: 'Condition Number κ',
          symbol: '\\kappa = \\sigma_1 / \\sigma_2',
          color: 'amber',
          tooltip: 'Ratio of longest to shortest ellipse semi-axis; diverges to ∞ at kinematic singularities.',
          initialValue: '2.15',
        },
      ],
    },

    controls: [
      {
        id: 'armDof',
        type: 'segmented',
        label: 'Manipulator DOF',
        value: '2dof',
        options: [
          { value: '2dof', label: '2-DOF' },
          { value: '3dof', label: '3-DOF' },
        ],
      },
      {
        id: 'dlsLambda',
        type: 'range',
        label: 'DLS Safety λ',
        min: 0.005,
        max: 0.5,
        step: 0.005,
        value: 0.06,
        unit: '',
      },
      {
        id: 'showVectors',
        type: 'toggle',
        label: 'Show J Columns & SVD Axes',
        value: true,
      },
    ],

    steps: {
      concept: {
        title: 'From Joint Angles to Velocity Geometry',
        body:
          'The Jacobian J(θ) linearizes forward kinematics around the robot’s current posture, mapping unit-norm joint speeds ‖q̇‖ = 1 into an ellipsoid of achievable Cartesian end-effector velocities. Its Singular Value Decomposition (SVD) exposes the exact directions of easiest motion (σ₁) and hardest motion (σ₂).',
        bullets: [
          'Each column Jₖ of J(θ) is perpendicular to the lever arm from joint k to the tip.',
          'When the ellipse is round (κ ≈ 1), the arm moves effortlessly in every direction.',
          'At a kinematic singularity (θ₂ → 0°), columns J₁ and J₂ align collinearly, σ₂ → 0, and the arm loses a full degree of freedom.',
        ],
      },
      explore: {
        title: 'Drag the Target Across the Workspace',
        body:
          'Grab the glowing cyan target puck directly on the canvas and sweep from the sweet-spot mid-workspace out toward the dashed reach boundary. Watch the manipulability ellipse morph from a lush Emerald oval into an Amber needle and finally a pulsing Crimson line. Switch to 3-DOF to see how kinematic redundancy cushions singularities.',
      },
      linkedMath: {
        title: 'Inspect the Live Math-to-Geometry Bridge',
        body:
          'Hover or click any pill in the equation bar above: J(θ) lights up the Jacobian column vectors and live matrix readout; w = σ₁·σ₂ illuminates the ellipse semi-axes; q̇ highlights the joint velocity arcs and actuator gauge; and v reveals the Cartesian probe command.',
      },
      breakSystem: {
        title: 'Break the System: Force a Boundary Singularity',
        body:
          'Trigger the singularity fault to drive the arm onto its fully extended outer boundary with near-zero damping (λ = 0.002). Because σ₂ collapses toward zero, inverting J demands explosive joint speeds exceeding 40 rad/s for a modest 1 m/s radial push — then rescue the hardware by sliding DLS Safety λ back up.',
        triggerLabel: '⚡ Force Singularity',
      },
    },

    intuitionCheck: {
      question:
        'As a 2-link planar arm fully extends toward its outer workspace boundary (θ₂ → 0°), what happens to the Jacobian columns J₁, J₂ and the smallest singular value σ₂?',
      options: [
        {
          id: 'a',
          label: 'J₁ and J₂ become orthogonal, maximizing σ₂ and making radial motion effortless.',
          correct: false,
          feedback:
            'Orthogonal columns maximize manipulability near θ₂ ≈ 90°, not at full extension. At θ₂ → 0°, both lever arms point along the same ray.',
        },
        {
          id: 'b',
          label: 'J₁ and J₂ become collinear (rank drops to 1), σ₂ → 0, and inverse velocity commands along the radial axis explode unless damped.',
          correct: true,
          feedback:
            'Spot on! Collinear columns mean neither joint can produce radial velocity at the tip — the ellipse flattens into a 1D tangent line and ‖q̇‖ ~ 1/σ₂ blows up without DLS damping λ.',
        },
        {
          id: 'c',
          label: 'Both σ₁ and σ₂ drop to zero simultaneously, freezing the arm in every direction.',
          correct: false,
          feedback:
            'Look closely at the flattened Crimson ellipse: tangential motion perpendicular to the arm stays huge (σ₁ > 2.0), while only the radial axis σ₂ collapses.',
        },
        {
          id: 'd',
          label: 'The condition number κ approaches 1.0 because all links are aligned.',
          correct: false,
          feedback:
            'Condition number κ = σ₁/σ₂ equals 1 only when σ₁ = σ₂ (a perfect circle). When σ₂ → 0 while σ₁ remains large, κ diverges toward ∞.',
        },
      ],
    },

    frontierBridge: {
      headline: 'Whole-Body Inverse Kinematics & Operational-Space Control in Humanoids',
      whyItMatters:
        'Modern bipedal humanoids and bimanual manipulators (Figure 02, Optimus, Boston Dynamics Atlas, π₀ low-level controllers) run 500–1000 Hz whole-body quadratic programs (WB-QP) built directly on Damped Least-Squares Jacobians and manipulability-aware nullspace objectives so knees, elbows, and wrists never lock into singularities during dynamic reaching.',
      prereqs: ['F1.1'],
      unlocks: ['F1.3', 'M1.3', 'M4.1'],
    },

    mountCanvas(canvasHost, api = {}) {
      const host = canvasHost;
      if (!host) return () => {};

      // Ensure dead-front styling on host & create responsive high-DPI canvas
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

      // Lab mutable simulation state
      const state = {
        armDof: '2dof',
        dlsLambda: 0.06,
        showVectors: true,
        breakActive: false,
        hoverVar: null,
        q: [...LINK_CONFIG['2dof'].homeQ],
        target: { ...LINK_CONFIG['2dof'].defaultTarget },
        dragging: false,
        hasDragged: false,
        pointerWorld: null,
        pointerHoverTarget: false,
        dragVel: { x: 0, y: 0 },
        lastTargetForVel: { ...LINK_CONFIG['2dof'].defaultTarget },
        time: 0,
        lastTelemetryPush: -1,
        lastTelemCache: {},
        lastEqCache: {},
        // Cached viewport transform
        width: 800,
        height: 520,
        dpr: 1,
        cx: 400,
        cy: 260,
        scale: 120,
      };

      const unsubs = [];

      function getConfig() {
        return LINK_CONFIG[state.armDof] || LINK_CONFIG['2dof'];
      }

      function getMaxReach() {
        const lens = getConfig().lengths;
        let sum = 0;
        for (let i = 0; i < lens.length; i++) sum += lens[i];
        return sum;
      }

      function switchDof(nextDof) {
        const mode = nextDof === '3dof' ? '3dof' : '2dof';
        if (mode === state.armDof) return;
        state.armDof = mode;
        const cfg = LINK_CONFIG[mode];
        if (state.breakActive) {
          state.q = mode === '2dof' ? [0.18, 0.016] : [0.18, 0.015, 0.015];
        } else {
          state.q = [...cfg.homeQ];
        }
      }

      function applyBreakMode(active) {
        const isActive = Boolean(active);
        state.breakActive = isActive;
        const rMax = getMaxReach();
        if (isActive) {
          // Lock target just beyond stretched outer boundary singularity
          const ang = 0.18;
          state.target.x = (rMax + 0.08) * Math.cos(ang);
          state.target.y = (rMax + 0.08) * Math.sin(ang);
          state.dlsLambda = 0.002;
          if (typeof api.setControlValue === 'function') {
            try {
              api.setControlValue('dlsLambda', 0.005, { notify: false });
            } catch {
              // Ignore optional shell control sync errors
            }
          }
        } else {
          const cfg = getConfig();
          state.dlsLambda = 0.06;
          state.target = { ...cfg.defaultTarget };
          if (typeof api.setControlValue === 'function') {
            try {
              api.setControlValue('dlsLambda', 0.06, { notify: false });
            } catch {
              // Ignore optional shell control sync errors
            }
          }
        }
      }

      function resetLab() {
        state.breakActive = false;
        state.armDof = '2dof';
        state.dlsLambda = 0.06;
        state.showVectors = true;
        state.q = [...LINK_CONFIG['2dof'].homeQ];
        state.target = { ...LINK_CONFIG['2dof'].defaultTarget };
        state.dragging = false;
        state.hoverVar = null;
      }

      // Wire shell API callbacks defensively (supports (id, val) or ({ id, value }))
      if (typeof api.onControlChange === 'function') {
        const u = api.onControlChange((a, b) => {
          const id = typeof a === 'object' && a !== null ? a.id : a;
          const val = typeof a === 'object' && a !== null ? a.value : b;
          if (id === 'armDof') {
            switchDof(String(val));
          } else if (id === 'dlsLambda') {
            const num = Number(val);
            if (Number.isFinite(num)) {
              state.dlsLambda = clamp(num, 0.002, 0.6);
            }
          } else if (id === 'showVectors') {
            state.showVectors = Boolean(val);
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
        const u = api.onReset(() => {
          resetLab();
        });
        if (typeof u === 'function') unsubs.push(u);
      }

      // Coordinate transforms (world Y up -> screen Y down)
      function updateViewportMetrics() {
        const rect = host.getBoundingClientRect();
        const w = Math.max(280, Math.floor(rect.width || 680));
        const h = Math.max(260, Math.floor(rect.height || 460));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
          canvas.width = Math.floor(w * dpr);
          canvas.height = Math.floor(h * dpr);
        }
        state.width = w;
        state.height = h;
        state.dpr = dpr;

        // Place robot base cleanly centered with slight downward offset for HUD clearance
        const minDim = Math.min(w, h);
        state.scale = clamp(minDim / 4.55, 56, 155);
        state.cx = w * 0.5;
        state.cy = h * 0.53;
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

      function clampTargetToArena(wx, wy) {
        const maxR = getMaxReach() + 0.34;
        const r = Math.hypot(wx, wy);
        if (r > maxR) {
          return { x: (wx / r) * maxR, y: (wy / r) * maxR };
        }
        return { x: wx, y: wy };
      }

      function onPointerDown(ev) {
        const { sx, sy } = getPointerPos(ev);
        const pW = screenToWorld(sx, sy);
        const tS = worldToScreen(state.target.x, state.target.y);
        const distPx = Math.hypot(sx - tS.x, sy - tS.y);

        // Allow grabbing target puck directly OR clicking anywhere in workspace to pull target
        if (distPx <= 42 || true) {
          state.dragging = true;
          state.hasDragged = true;
          // If user drags target while in break mode, let them pull it off the locked singularity
          if (state.breakActive && distPx <= 48) {
            state.breakActive = false;
          }
          const clamped = clampTargetToArena(pW.x, pW.y);
          state.target.x = clamped.x;
          state.target.y = clamped.y;
          canvas.style.cursor = 'grabbing';
          try {
            canvas.setPointerCapture(ev.pointerId);
          } catch {
            // Ignore capture failures on synthetic events
          }
        }
      }

      function onPointerMove(ev) {
        const { sx, sy } = getPointerPos(ev);
        const pW = screenToWorld(sx, sy);
        state.pointerWorld = pW;

        if (state.dragging) {
          const clamped = clampTargetToArena(pW.x, pW.y);
          state.target.x = clamped.x;
          state.target.y = clamped.y;
          canvas.style.cursor = 'grabbing';
          return;
        }

        const tS = worldToScreen(state.target.x, state.target.y);
        const distPx = Math.hypot(sx - tS.x, sy - tS.y);
        state.pointerHoverTarget = distPx <= 32;
        canvas.style.cursor = state.pointerHoverTarget ? 'grab' : 'crosshair';
      }

      function onPointerUp(ev) {
        if (!state.dragging) return;
        state.dragging = false;
        canvas.style.cursor = state.pointerHoverTarget ? 'grab' : 'crosshair';
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
       * Step damped iterative IK + compute live kinematics, SVD, and unit-velocity probe.
       */
      function stepSimulation(dt) {
        const cfg = getConfig();
        const lengths = cfg.lengths;
        const n = lengths.length;
        const rMax = getMaxReach();

        // Keep break-mode target locked at outer singularity unless user drags away
        if (state.breakActive) {
          const ang = 0.18;
          state.target.x = (rMax + 0.08) * Math.cos(ang);
          state.target.y = (rMax + 0.08) * Math.sin(ang);
        }

        // Track smoothed user drag velocity (world units/sec)
        const rawVx = (state.target.x - state.lastTargetForVel.x) / Math.max(dt, 1e-3);
        const rawVy = (state.target.y - state.lastTargetForVel.y) / Math.max(dt, 1e-3);
        state.dragVel.x = state.dragVel.x * 0.78 + rawVx * 0.22;
        state.dragVel.y = state.dragVel.y * 0.78 + rawVy * 0.22;
        state.lastTargetForVel.x = state.target.x;
        state.lastTargetForVel.y = state.target.y;

        // Iterative DLS IK (6 substeps per frame for silky convergence)
        const subSteps = 6;
        const ikLambda = Math.max(state.dlsLambda, 0.025);
        const stepGain = 0.34;
        const maxDelta = 0.18;

        for (let s = 0; s < subSteps; s++) {
          const joints = computeFK(state.q, lengths);
          const ee = joints[n];
          const ex = state.target.x - ee.x;
          const ey = state.target.y - ee.y;
          const errDist = Math.hypot(ex, ey);
          if (errDist < 1e-4 && !state.breakActive) break;

          const J = computeJacobian(joints);
          const svd = computeSVD(J);
          const { qdot } = solveDLS(J, svd.gram, ikLambda, ex, ey);

          // Gentle nullspace posture regularization for 3-DOF redundancy
          let nullVec = null;
          if (n === 3 && !state.breakActive) {
            const qPref = cfg.homeQ;
            const dq0 = [qPref[0] - state.q[0], qPref[1] - state.q[1], qPref[2] - state.q[2]];
            // Project dq0 into nullspace: (I - J† J) dq0
            const jdq0 = J.row0[0] * dq0[0] + J.row0[1] * dq0[1] + J.row0[2] * dq0[2];
            const jdq1 = J.row1[0] * dq0[0] + J.row1[1] * dq0[1] + J.row1[2] * dq0[2];
            const proj = solveDLS(J, svd.gram, ikLambda, jdq0, jdq1).qdot;
            nullVec = [
              (dq0[0] - proj[0]) * 0.045,
              (dq0[1] - proj[1]) * 0.045,
              (dq0[2] - proj[2]) * 0.045,
            ];
          }

          for (let k = 0; k < n; k++) {
            const d = clamp(qdot[k] * stepGain + (nullVec ? nullVec[k] : 0), -maxDelta, maxDelta);
            state.q[k] = wrapAngle(state.q[k] + d);
          }
        }

        // In active singularity fault with low damping, maintain realistic tiny residual
        // encoder chatter (~0.9 deg) near theta2 -> 0 so sigma2 sits right in the explosive
        // band (sigma2 ~ 0.014) where 1/sigma2 exceeds 60 rad/s until DLS lambda rescues it!
        if (state.breakActive) {
          const targetAng = Math.atan2(state.target.y, state.target.x);
          const rescueBlend = clamp((state.dlsLambda - 0.015) / 0.12, 0, 1);
          const chatterAmp = (1 - rescueBlend) * 0.0045;
          const jitter = Math.sin(state.time * 42) * chatterAmp;
          if (n === 2) {
            state.q[0] = targetAng - 0.008 + jitter * 0.5;
            state.q[1] = 0.0165 + jitter;
          } else {
            state.q[0] = targetAng - 0.011 + jitter * 0.4;
            state.q[1] = 0.0145 + jitter * 0.8;
            state.q[2] = 0.0145 + jitter * 0.8;
          }
        }

        // Final exact kinematic & SVD evaluation for rendering + telemetry
        const joints = computeFK(state.q, lengths);
        const J = computeJacobian(joints);
        const svd = computeSVD(J);

        // Unit Cartesian task velocity command (1.0 m/s):
        // Aligns with weakest singular axis u2 (pointing outward from base) so actuator
        // sensitivity along the singular direction is immediately visible and exact.
        const ee = joints[n];
        const radialSign = ee.x * svd.u2.x + ee.y * svd.u2.y >= 0 ? 1 : -1;
        const vCmd = {
          x: svd.u2.x * radialSign,
          y: svd.u2.y * radialSign,
        };

        // Compute exact joint velocity vector for the 1.0 m/s unit command with user's DLS lambda
        const dlsCmd = solveDLS(J, svd.gram, state.dlsLambda, vCmd.x, vCmd.y);

        // Health classification for ellipse color & warnings
        let health = 'emerald';
        if (svd.sigma2 < 0.12) {
          health = 'crimson';
        } else if (svd.sigma2 < 0.35) {
          health = 'amber';
        }
        const velocityExplosion = dlsCmd.norm > 40;
        const rescuedFromBreak = state.breakActive && !velocityExplosion && state.dlsLambda >= 0.06;

        return {
          joints,
          J,
          svd,
          vCmd,
          qdotCmd: dlsCmd.qdot,
          qdotNorm: dlsCmd.norm,
          health,
          velocityExplosion,
          rescuedFromBreak,
          rMax,
          rMin: n === 2 ? Math.abs(lengths[0] - lengths[1]) : 0,
        };
      }

      /**
       * Push live telemetry & equation values smoothly (throttled + diff-checked).
       */
      function syncShellReadouts(sim) {
        const now = state.time;
        if (now - state.lastTelemetryPush < 0.055) return;
        state.lastTelemetryPush = now;

        const wStr = sim.svd.w.toFixed(2);
        const kappaStr = sim.svd.kappa > 999 ? '999+' : sim.svd.kappa.toFixed(2);
        const sig2Str = sim.svd.sigma2.toFixed(3);
        const qdotStr =
          sim.qdotNorm >= 100
            ? `${sim.qdotNorm.toFixed(0)} rad/s`
            : `${sim.qdotNorm.toFixed(2)} rad/s`;

        const statusObj = sim.velocityExplosion
          ? { level: 'fault', label: 'SINGULARITY FAULT' }
          : sim.rescuedFromBreak
          ? { level: 'safe', label: 'DLS RESCUED' }
          : sim.health === 'crimson'
          ? { level: 'warning', label: 'NEAR SINGULARITY' }
          : sim.health === 'amber'
          ? { level: 'warning', label: 'ANISOTROPIC' }
          : { level: 'safe', label: 'WELL-CONDITIONED' };

        const qdotColor = sim.velocityExplosion
          ? 'crimson'
          : sim.qdotNorm > 12
          ? 'amber'
          : 'emerald';

        const nextTelem = {
          w: { value: wStr, color: sim.health },
          kappa: { value: kappaStr, color: sim.svd.kappa > 15 ? 'crimson' : sim.svd.kappa > 5 ? 'amber' : 'cyan' },
          sigma2: { value: sig2Str, color: sim.health },
          qdot: { value: qdotStr, color: qdotColor },
        };

        const telemKey = `${wStr}|${kappaStr}|${sig2Str}|${qdotStr}|${statusObj.label}`;
        if (state.lastTelemCache._sig !== telemKey && typeof api.updateTelemetry === 'function') {
          state.lastTelemCache._sig = telemKey;
          try {
            api.updateTelemetry(nextTelem, statusObj);
          } catch {
            // Ignore shell errors
          }
        }

        const nextEq = {
          v: '1.00 m/s',
          J: `2×${sim.J.n}`,
          qdot: qdotStr,
          sigma: wStr,
          kappa: kappaStr,
        };

        let eqChanged = false;
        for (const k of Object.keys(nextEq)) {
          if (state.lastEqCache[k] !== nextEq[k]) {
            eqChanged = true;
            break;
          }
        }
        if (eqChanged && typeof api.updateEquation === 'function') {
          state.lastEqCache = nextEq;
          try {
            api.updateEquation(nextEq);
          } catch {
            // Ignore shell errors
          }
        }
      }

      /**
       * Render full 60 FPS dead-front engineering canvas.
       */
      function render(sim) {
        const { width: W, height: H, dpr, cx, cy, scale, hoverVar, time } = state;
        ctx.save();
        ctx.scale(dpr, dpr);

        // 1. Dead-front dark background + subtle radial studio depth
        ctx.fillStyle = PALETTE.bg;
        ctx.fillRect(0, 0, W, H);

        const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(W, H) * 0.72);
        bgGrad.addColorStop(
          0,
          sim.velocityExplosion
            ? 'rgba(255, 23, 68, 0.085)'
            : 'rgba(0, 229, 255, 0.045)'
        );
        bgGrad.addColorStop(1, 'rgba(10, 12, 16, 0)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // 2. Precision engineering grid (0.5m minor, 1.0m major)
        const minorPx = scale * 0.5;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.strokeStyle = PALETTE.gridMinor;
        for (let gx = cx % minorPx; gx < W; gx += minorPx) {
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, H);
        }
        for (let gy = cy % minorPx; gy < H; gy += minorPx) {
          ctx.moveTo(0, gy);
          ctx.lineTo(W, gy);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = PALETTE.gridMajor;
        for (let i = -4; i <= 4; i++) {
          const sx = cx + i * scale;
          const sy = cy - i * scale;
          if (sx >= 0 && sx <= W) {
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, H);
          }
          if (sy >= 0 && sy <= H) {
            ctx.moveTo(0, sy);
            ctx.lineTo(W, sy);
          }
        }
        ctx.stroke();

        // Crosshair axes
        ctx.beginPath();
        ctx.strokeStyle = PALETTE.axis;
        ctx.moveTo(0, cy);
        ctx.lineTo(W, cy);
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, H);
        ctx.stroke();

        // Coordinate tick labels
        ctx.font = `500 10px ${MONO_FONT}`;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.42)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let i = -2; i <= 2; i++) {
          if (i === 0) continue;
          const sx = cx + i * scale;
          if (sx > 24 && sx < W - 24) {
            ctx.fillText(`${i}m`, sx, cy + 5);
          }
        }

        // 3. Reachable Workspace Annulus
        const outerR = sim.rMax * scale;
        const innerR = sim.rMin * scale;
        const ee = sim.joints[sim.joints.length - 1];
        const eeDist = Math.hypot(ee.x, ee.y);
        const nearBoundary = eeDist > sim.rMax - 0.14 || sim.velocityExplosion;

        // Subtle workspace fill
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        if (innerR > 4) {
          ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
        }
        ctx.fillStyle = 'rgba(34, 211, 238, 0.026)';
        ctx.fill('evenodd');

        // Outer singularity ring
        const boundaryPulse = 0.5 + 0.5 * Math.sin(time * 7);
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        ctx.setLineDash([7, 6]);
        ctx.lineWidth = nearBoundary ? 1.8 : 1.15;
        ctx.strokeStyle = nearBoundary
          ? `rgba(${PALETTE.crimsonRgb}, ${0.52 + 0.35 * boundaryPulse})`
          : 'rgba(148, 163, 184, 0.28)';
        if (nearBoundary) {
          ctx.shadowColor = PALETTE.crimson;
          ctx.shadowBlur = 14;
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        // Inner dead-zone boundary (2-DOF only)
        if (innerR > 4) {
          ctx.beginPath();
          ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 23, 68, 0.05)';
          ctx.fill();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(255, 23, 68, 0.25)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();

        // Outer boundary annotation
        ctx.font = `600 9.5px ${MONO_FONT}`;
        ctx.fillStyle = nearBoundary
          ? `rgba(${PALETTE.crimsonRgb}, 0.88)`
          : 'rgba(148, 163, 184, 0.45)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(
          `WORKSPACE SINGULARITY BOUNDARY · R = ${sim.rMax.toFixed(2)}m`,
          cx,
          Math.max(20, cy - outerR - 6)
        );

        // 4. Glowing Manipulability Ellipsoid at End-Effector
        const eeS = worldToScreen(ee.x, ee.y);
        const ellipseScale = scale * 0.34;
        const rx = Math.max(4, sim.svd.sigma1 * ellipseScale);
        const ry = Math.max(2.2, sim.svd.sigma2 * ellipseScale);

        const healthRgb =
          sim.health === 'emerald'
            ? PALETTE.emeraldRgb
            : sim.health === 'amber'
            ? PALETTE.amberRgb
            : PALETTE.crimsonRgb;
        const healthHex =
          sim.health === 'emerald'
            ? PALETTE.emerald
            : sim.health === 'amber'
            ? PALETTE.amber
            : PALETTE.crimson;

        const hiSigma = hoverVar === 'sigma' || hoverVar === 'kappa';
        const singPulse = sim.health === 'crimson' ? 0.55 + 0.45 * Math.sin(time * 9) : 1;

        ctx.save();
        ctx.translate(eeS.x, eeS.y);
        // Negate angle because canvas Y points downward
        ctx.rotate(-sim.svd.thetaU);

        // Outer soft glow halo
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        const ellGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, rx);
        ellGrad.addColorStop(0, `rgba(${healthRgb}, ${hiSigma ? 0.34 : 0.21})`);
        ellGrad.addColorStop(1, `rgba(${healthRgb}, ${hiSigma ? 0.14 : 0.05})`);
        ctx.fillStyle = ellGrad;
        ctx.fill();

        ctx.shadowColor = healthHex;
        ctx.shadowBlur = hiSigma ? 22 : sim.health === 'crimson' ? 18 * singPulse : 12;
        ctx.lineWidth = hiSigma ? 2.8 : sim.health === 'crimson' ? 2.4 : 1.9;
        ctx.strokeStyle = `rgba(${healthRgb}, ${sim.health === 'crimson' ? 0.65 + 0.35 * singPulse : 0.92})`;
        ctx.stroke();

        // Singular principal axes (σ₁, σ₂)
        if (state.showVectors || hiSigma) {
          ctx.shadowBlur = hiSigma ? 12 : 0;
          // Major axis σ₁
          ctx.beginPath();
          ctx.moveTo(-rx, 0);
          ctx.lineTo(rx, 0);
          ctx.strokeStyle = hiSigma ? '#FFFFFF' : `rgba(${healthRgb}, 0.72)`;
          ctx.lineWidth = hiSigma ? 2.2 : 1.25;
          ctx.setLineDash(hiSigma ? [] : [4, 3]);
          ctx.stroke();

          // Minor axis σ₂
          ctx.beginPath();
          ctx.moveTo(0, -Math.max(ry, 3));
          ctx.lineTo(0, Math.max(ry, 3));
          ctx.strokeStyle =
            sim.health === 'crimson'
              ? PALETTE.crimson
              : hiSigma
              ? PALETTE.amber
              : `rgba(${healthRgb}, 0.72)`;
          ctx.lineWidth = hiSigma ? 2.4 : 1.25;
          ctx.stroke();
          ctx.setLineDash([]);

          // Principal axis labels (unrotated for crisp legibility)
          ctx.restore();
          ctx.save();
          ctx.font = `600 10.5px ${MONO_FONT}`;
          const s1Tip = {
            x: eeS.x + sim.svd.u1.x * (rx + 15),
            y: eeS.y - sim.svd.u1.y * (rx + 15),
          };
          const s2Tip = {
            x: eeS.x + sim.svd.u2.x * (Math.max(ry, 12) + 16),
            y: eeS.y - sim.svd.u2.y * (Math.max(ry, 12) + 16),
          };
          ctx.fillStyle = hiSigma ? '#FFFFFF' : healthHex;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`σ₁=${sim.svd.sigma1.toFixed(2)}`, s1Tip.x, s1Tip.y);
          ctx.fillStyle = sim.health === 'crimson' ? PALETTE.crimson : hiSigma ? PALETTE.amber : healthHex;
          ctx.fillText(`σ₂=${sim.svd.sigma2.toFixed(2)}`, s2Tip.x, s2Tip.y);
        }
        ctx.restore();

        // 5. Anodized Articulated Robot Arm
        const jointsS = sim.joints.map((p) => worldToScreen(p.x, p.y));
        const hiQdot = hoverVar === 'qdot' || sim.velocityExplosion;

        // Draw machined base pedestal
        ctx.save();
        const baseS = jointsS[0];
        ctx.beginPath();
        ctx.arc(baseS.x, baseS.y, 19, 0, Math.PI * 2);
        const baseGrad = ctx.createRadialGradient(baseS.x - 4, baseS.y - 4, 2, baseS.x, baseS.y, 19);
        baseGrad.addColorStop(0, '#334155');
        baseGrad.addColorStop(1, '#0F172A');
        ctx.fillStyle = baseGrad;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.stroke();

        // Mounting bolts
        for (let b = 0; b < 4; b++) {
          const ba = (b * Math.PI) / 2 + Math.PI / 4;
          ctx.beginPath();
          ctx.arc(baseS.x + Math.cos(ba) * 13, baseS.y + Math.sin(ba) * 13, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
          ctx.fill();
        }
        ctx.restore();

        // Draw tapered anodized links
        for (let k = 0; k < sim.J.n; k++) {
          const pA = jointsS[k];
          const pB = jointsS[k + 1];
          const dx = pB.x - pA.x;
          const dy = pB.y - pA.y;
          const len = Math.hypot(dx, dy);
          const ang = Math.atan2(dy, dx);
          const wA = 11.5 - k * 1.8;
          const wB = 8.5 - k * 1.4;

          ctx.save();
          ctx.translate(pA.x, pA.y);
          ctx.rotate(ang);

          // Link silhouette
          ctx.beginPath();
          ctx.moveTo(0, -wA);
          ctx.lineTo(len, -wB);
          ctx.arc(len, 0, wB, -Math.PI / 2, Math.PI / 2);
          ctx.lineTo(0, wA);
          ctx.arc(0, 0, wA, Math.PI / 2, -Math.PI / 2);
          ctx.closePath();

          const linkGrad = ctx.createLinearGradient(0, -wA, 0, wA);
          linkGrad.addColorStop(0, '#334155');
          linkGrad.addColorStop(0.35, '#1E293B');
          linkGrad.addColorStop(1, '#0F172A');
          ctx.fillStyle = linkGrad;
          ctx.fill();

          ctx.lineWidth = 1.3;
          ctx.strokeStyle = sim.velocityExplosion
            ? `rgba(${PALETTE.crimsonRgb}, 0.65)`
            : 'rgba(148, 163, 184, 0.42)';
          ctx.stroke();

          // Recessed brushed titanium slot
          if (len > 36) {
            ctx.beginPath();
            ctx.moveTo(18, 0);
            ctx.lineTo(len - 18, 0);
            ctx.lineWidth = 3.2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = 'rgba(10, 12, 16, 0.72)';
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(18, -wA * 0.55);
            ctx.lineTo(len - 18, -wB * 0.55);
            ctx.lineWidth = 0.8;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
            ctx.stroke();
          }
          ctx.restore();
        }

        // Draw servo joints + live joint velocity arcs (q̇)
        for (let k = 0; k < sim.J.n; k++) {
          const jS = jointsS[k];
          const qd = sim.qdotCmd[k] || 0;
          const qdMag = Math.abs(qd);
          const arcR = 21 - k * 2;

          // Live Joint Velocity Arc around joint k
          if (hiQdot || qdMag > 0.35) {
            const sweep = clamp(qd * 0.16, -Math.PI * 1.35, Math.PI * 1.35);
            const startAng = -Math.PI * 0.5;
            const arcColor =
              qdMag > 25
                ? PALETTE.crimson
                : qdMag > 6
                ? PALETTE.amber
                : PALETTE.cyan;
            ctx.save();
            ctx.beginPath();
            ctx.arc(jS.x, jS.y, arcR, startAng, startAng - sweep, sweep > 0);
            ctx.strokeStyle = arcColor;
            ctx.lineWidth = hiQdot ? 3.2 : 2.1;
            ctx.lineCap = 'round';
            ctx.shadowColor = arcColor;
            ctx.shadowBlur = hiQdot ? 14 : 7;
            ctx.stroke();
            ctx.restore();
          }

          // Joint bearing hub
          const hubR = 9.5 - k * 1.1;
          ctx.beginPath();
          ctx.arc(jS.x, jS.y, hubR, 0, Math.PI * 2);
          ctx.fillStyle = '#0F172A';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = hiQdot ? PALETTE.crimson : PALETTE.cyan;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(jS.x, jS.y, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = hiQdot ? PALETTE.crimson : '#E2E8F0';
          ctx.fill();

          // Joint label
          ctx.font = `600 9.5px ${MONO_FONT}`;
          ctx.fillStyle = hiQdot ? PALETTE.crimson : 'rgba(203, 213, 225, 0.72)';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(
            hiQdot ? `q̇${k + 1}=${qd.toFixed(1)}` : `θ${k + 1}`,
            jS.x + hubR + 5,
            jS.y + 4
          );
        }

        // End-effector tool center point (TCP)
        ctx.beginPath();
        ctx.arc(eeS.x, eeS.y, 6.2, 0, Math.PI * 2);
        ctx.fillStyle = healthHex;
        ctx.shadowColor = healthHex;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#0A0C10';
        ctx.stroke();

        // 6. Jacobian Column Vectors (J₁, J₂, [J₃]) at End-Effector
        const hiJ = hoverVar === 'J';
        if (state.showVectors || hiJ) {
          const colColors = [PALETTE.violet, '#38BDF8', '#F472B6'];
          const jVecScale = scale * 0.34;
          for (let k = 0; k < sim.J.n; k++) {
            const jx = sim.J.row0[k];
            const jy = sim.J.row1[k];
            const tipX = eeS.x + jx * jVecScale;
            const tipY = eeS.y - jy * jVecScale;
            const colColor = colColors[k % colColors.length];

            drawArrow(
              ctx,
              eeS.x,
              eeS.y,
              tipX,
              tipY,
              colColor,
              hiJ ? 3.2 : 1.9,
              hiJ ? 11 : 8,
              hiJ ? 16 : 4
            );

            // Label near arrow tip
            const len = Math.hypot(tipX - eeS.x, tipY - eeS.y);
            if (len > 14) {
              const ux = (tipX - eeS.x) / len;
              const uy = (tipY - eeS.y) / len;
              ctx.font = `700 ${hiJ ? 11.5 : 10}px ${MONO_FONT}`;
              ctx.fillStyle = colColor;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`J${k + 1}`, tipX + ux * 13, tipY + uy * 13);
            }
          }
        }

        // 7. End-Effector Unit Cartesian Command Vector v (along weakest axis u₂)
        const hiV = hoverVar === 'v';
        if (state.showVectors || hiV) {
          const vScale = scale * 0.44;
          const vTipX = eeS.x + sim.vCmd.x * vScale;
          const vTipY = eeS.y - sim.vCmd.y * vScale;
          drawArrow(
            ctx,
            eeS.x,
            eeS.y,
            vTipX,
            vTipY,
            PALETTE.cyan,
            hiV ? 3.4 : 2.1,
            hiV ? 12 : 9,
            hiV ? 18 : 7
          );
          ctx.font = `700 ${hiV ? 11.5 : 10}px ${MONO_FONT}`;
          ctx.fillStyle = PALETTE.cyan;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            'v',
            vTipX + sim.vCmd.x * 13,
            vTipY - sim.vCmd.y * 13
          );
        }

        // 8. Directly Draggable Glowing Target Puck
        const tS = worldToScreen(state.target.x, state.target.y);
        const puckPulse = 0.5 + 0.5 * Math.sin(time * 4.5);

        // Tether line from EE to Target if unreachable
        const eeToTargetPx = Math.hypot(tS.x - eeS.x, tS.y - eeS.y);
        if (eeToTargetPx > 8) {
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.moveTo(eeS.x, eeS.y);
          ctx.lineTo(tS.x, tS.y);
          ctx.strokeStyle = sim.velocityExplosion
            ? `rgba(${PALETTE.crimsonRgb}, 0.72)`
            : `rgba(${PALETTE.cyanRgb}, 0.45)`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        const puckColor = sim.breakActive && sim.velocityExplosion ? PALETTE.crimson : PALETTE.cyan;
        const puckRgb =
          sim.breakActive && sim.velocityExplosion ? PALETTE.crimsonRgb : PALETTE.cyanRgb;

        // Animated outer ripple
        ctx.beginPath();
        ctx.arc(tS.x, tS.y, 16 + puckPulse * 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${puckRgb}, ${0.42 - puckPulse * 0.25})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Main interactive puck ring
        ctx.beginPath();
        ctx.arc(tS.x, tS.y, state.dragging ? 14.5 : 12.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${puckRgb}, ${state.dragging ? 0.28 : 0.16})`;
        ctx.fill();
        ctx.shadowColor = puckColor;
        ctx.shadowBlur = state.dragging ? 20 : 12;
        ctx.lineWidth = 2;
        ctx.strokeStyle = puckColor;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Precision reticle ticks
        ctx.beginPath();
        ctx.moveTo(tS.x - 17, tS.y);
        ctx.lineTo(tS.x - 8, tS.y);
        ctx.moveTo(tS.x + 8, tS.y);
        ctx.lineTo(tS.x + 17, tS.y);
        ctx.moveTo(tS.x, tS.y - 17);
        ctx.lineTo(tS.x, tS.y - 8);
        ctx.moveTo(tS.x, tS.y + 8);
        ctx.lineTo(tS.x, tS.y + 17);
        ctx.strokeStyle = puckColor;
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // Center dot
        ctx.beginPath();
        ctx.arc(tS.x, tS.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Drag prompt pill before first drag
        if (!state.hasDragged && !state.breakActive) {
          ctx.font = `600 10px ${SANS_FONT}`;
          const hint = 'Drag target';
          const tw = ctx.measureText(hint).width + 14;
          drawRoundedRect(ctx, tS.x - tw * 0.5, tS.y - 38, tw, 19, 9);
          ctx.fillStyle = 'rgba(13, 17, 25, 0.88)';
          ctx.fill();
          ctx.strokeStyle = `rgba(${PALETTE.cyanRgb}, 0.45)`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = '#E0F7FA';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(hint, tS.x, tS.y - 28.5);
        }
        ctx.restore();

        // 9. Top-Left HUD: Live 2×2 / 2×3 Jacobian Matrix Overlay
        renderJacobianHUD(ctx, sim, hiJ);

        // 10. Top-Right HUD: Live Actuator Velocity Gauge (‖q̇‖)
        renderVelocityGaugeHUD(ctx, sim, W, hiQdot);

        // 11. Bottom-Center Alert Banner (Velocity Explosion or Rescued State)
        if (sim.velocityExplosion) {
          renderAlertBanner(
            ctx,
            W,
            H,
            `⚠ ACTUATOR VELOCITY EXPLOSION · ‖q̇‖ = ${sim.qdotNorm.toFixed(1)} rad/s! Raise DLS Safety λ`,
            PALETTE.crimson,
            PALETTE.crimsonRgb,
            0.7 + 0.3 * Math.sin(time * 10)
          );
        } else if (sim.rescuedFromBreak) {
          renderAlertBanner(
            ctx,
            W,
            H,
            `✓ DLS DAMPING RESCUE (λ = ${state.dlsLambda.toFixed(3)}) · Actuators Stabilized (‖q̇‖ = ${sim.qdotNorm.toFixed(2)} rad/s)`,
            PALETTE.emerald,
            PALETTE.emeraldRgb,
            1
          );
        }

        ctx.restore();
      }

      function renderJacobianHUD(ctx, sim, highlighted) {
        const n = sim.J.n;
        const padX = 12;
        const padY = 12;
        const colW = 54;
        const boxW = 30 + n * colW;
        const boxH = 74;

        ctx.save();
        drawRoundedRect(ctx, padX, padY, boxW, boxH, 10);
        ctx.fillStyle = highlighted ? PALETTE.bgPanelHi : PALETTE.bgPanel;
        ctx.fill();
        ctx.lineWidth = highlighted ? 1.8 : 1;
        ctx.strokeStyle = highlighted
          ? PALETTE.violet
          : sim.health === 'crimson'
          ? `rgba(${PALETTE.crimsonRgb}, 0.55)`
          : 'rgba(255, 255, 255, 0.11)';
        if (highlighted) {
          ctx.shadowColor = PALETTE.violet;
          ctx.shadowBlur = 14;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Header line
        ctx.font = `700 9.5px ${MONO_FONT}`;
        ctx.fillStyle = highlighted ? PALETTE.violet : PALETTE.textSecondary;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`J(θ) [${n === 2 ? '2×2' : '2×3'}]`, padX + 10, padY + 8);

        // Rank / status tag
        const isSing = sim.svd.sigma2 < 0.12;
        ctx.textAlign = 'right';
        ctx.fillStyle = isSing ? PALETTE.crimson : PALETTE.emerald;
        ctx.fillText(isSing ? 'RANK→1!' : 'RANK 2', padX + boxW - 10, padY + 8);

        // Matrix brackets
        const mLeft = padX + 12;
        const mRight = padX + boxW - 12;
        const mTop = padY + 26;
        const mBot = padY + boxH - 10;
        ctx.strokeStyle = highlighted ? PALETTE.violet : 'rgba(148, 163, 184, 0.55)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(mLeft + 5, mTop);
        ctx.lineTo(mLeft, mTop);
        ctx.lineTo(mLeft, mBot);
        ctx.lineTo(mLeft + 5, mBot);
        ctx.moveTo(mRight - 5, mTop);
        ctx.lineTo(mRight, mTop);
        ctx.lineTo(mRight, mBot);
        ctx.lineTo(mRight - 5, mBot);
        ctx.stroke();

        // Matrix numerical entries colored by column
        const colColors = [PALETTE.violet, '#38BDF8', '#F472B6'];
        ctx.font = `600 11px ${MONO_FONT}`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let k = 0; k < n; k++) {
          const xPos = mLeft + (k + 1) * colW - 4;
          ctx.fillStyle = highlighted ? colColors[k % colColors.length] : PALETTE.textPrimary;
          ctx.fillText(sim.J.row0[k].toFixed(2), xPos, mTop + 11);
          ctx.fillText(sim.J.row1[k].toFixed(2), xPos, mBot - 9);
        }
        ctx.restore();
      }

      function renderVelocityGaugeHUD(ctx, sim, W, highlighted) {
        const boxW = 166;
        const boxH = 64;
        const x = W - boxW - 12;
        const y = 12;
        if (x < 210) return; // Hide cleanly on ultra-narrow viewports

        const isExploding = sim.velocityExplosion;
        const barColor = isExploding
          ? PALETTE.crimson
          : sim.qdotNorm > 12
          ? PALETTE.amber
          : PALETTE.emerald;

        ctx.save();
        drawRoundedRect(ctx, x, y, boxW, boxH, 10);
        ctx.fillStyle = highlighted ? PALETTE.bgPanelHi : PALETTE.bgPanel;
        ctx.fill();
        ctx.lineWidth = highlighted || isExploding ? 1.7 : 1;
        ctx.strokeStyle = isExploding
          ? PALETTE.crimson
          : highlighted
          ? PALETTE.cyan
          : 'rgba(255, 255, 255, 0.11)';
        if (highlighted || isExploding) {
          ctx.shadowColor = isExploding ? PALETTE.crimson : PALETTE.cyan;
          ctx.shadowBlur = 14;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = `700 9.5px ${MONO_FONT}`;
        ctx.fillStyle = PALETTE.textSecondary;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('ACTUATOR ‖q̇‖', x + 10, y + 8);

        ctx.textAlign = 'right';
        ctx.fillStyle = barColor;
        ctx.fillText(
          `${sim.qdotNorm >= 100 ? sim.qdotNorm.toFixed(0) : sim.qdotNorm.toFixed(2)} rad/s`,
          x + boxW - 10,
          y + 8
        );

        // Bar track (log-compressed 0..60 rad/s)
        const trackX = x + 10;
        const trackY = y + 29;
        const trackW = boxW - 20;
        const trackH = 8;
        drawRoundedRect(ctx, trackX, trackY, trackW, trackH, 4);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();

        const ratio = clamp(Math.log1p(sim.qdotNorm) / Math.log1p(65), 0.03, 1);
        drawRoundedRect(ctx, trackX, trackY, trackW * ratio, trackH, 4);
        ctx.fillStyle = barColor;
        ctx.fill();

        // 40 rad/s explosion threshold tick
        const threshX = trackX + trackW * (Math.log1p(40) / Math.log1p(65));
        ctx.beginPath();
        ctx.moveTo(threshX, trackY - 2);
        ctx.lineTo(threshX, trackY + trackH + 2);
        ctx.strokeStyle = `rgba(${PALETTE.crimsonRgb}, 0.85)`;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Sub-caption: DLS λ
        ctx.font = `500 9.5px ${MONO_FONT}`;
        ctx.fillStyle = PALETTE.textMuted;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`DLS λ = ${state.dlsLambda.toFixed(3)}`, x + 10, y + boxH - 6);

        ctx.textAlign = 'right';
        ctx.fillStyle = isExploding ? PALETTE.crimson : PALETTE.textMuted;
        ctx.fillText(isExploding ? 'LIMIT >40!' : 'LIM 40', x + boxW - 10, y + boxH - 6);
        ctx.restore();
      }

      function renderAlertBanner(ctx, W, H, text, colorHex, colorRgb, alphaScale) {
        ctx.save();
        ctx.font = `700 11px ${MONO_FONT}`;
        const tw = Math.min(W - 24, ctx.measureText(text).width + 26);
        const bx = (W - tw) * 0.5;
        const by = H - 40;

        drawRoundedRect(ctx, bx, by, tw, 28, 14);
        ctx.fillStyle = `rgba(13, 17, 25, 0.92)`;
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = `rgba(${colorRgb}, ${0.85 * alphaScale})`;
        ctx.shadowColor = colorHex;
        ctx.shadowBlur = 14 * alphaScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = colorHex;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, W * 0.5, by + 14.5, tw - 16);
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

      // Cleanup function
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

export default createF12JacobianLab;
