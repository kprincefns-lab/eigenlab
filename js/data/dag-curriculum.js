/**
 * EIGENLAB — Two-Tier Prerequisite-to-Frontier Physical AI Skill Graph (DAG)
 *
 * Pure, zero-build ES Module defining:
 *  - Tier 1 (F1–F8): Pruned Invariant Engineering Foundations (25 nodes)
 *  - Tier 2 (M1–M5): Bleeding-Edge Physical AI & Robotics Frontier (12 nodes)
 *  - Typed DAG query utilities for upstream/downstream chains, edges, and summary metrics.
 *
 * No bundler or runtime dependencies required; works directly in browser ES modules and Node.js.
 */

/**
 * @typedef {Object} Track
 * @property {string} id - Unique track code (e.g., 'F1'..'F8' for Tier 1, 'M1'..'M5' for Tier 2).
 * @property {1 | 2} tier - Curriculum tier (1 = Pruned Invariant Foundations, 2 = Physical AI Frontier).
 * @property {string} tierLabel - Human-readable tier title.
 * @property {string} name - Full track title.
 * @property {string} shortName - Compact track label for chips and graph headers.
 * @property {string} symbol - Mathematical or engineering glyph representing the track.
 * @property {string} accent - Primary hex accent color aligned with EIGENLAB dark glass theme.
 * @property {string} accentBg - Translucent RGBA badge background color.
 * @property {string} summary - One-sentence invariant or frontier scope of the track.
 * @property {number} order - Display order within its tier (1-indexed).
 */

/**
 * @typedef {Object} FrontierBridge
 * @property {string} headline - Punchy title linking the invariant foundation to frontier Physical AI.
 * @property {string} whyItMatters - Engineering rationale explaining the exact failure mode or unlock.
 * @property {string[]} targetIds - Downstream Tier 2 frontier node IDs unlocked or informed by this node.
 */

/**
 * @typedef {Object} BreakTheSystemSpec
 * @property {string} title - Name of the adversarial "Break the System" stress-test scenario.
 * @property {string} description - Actionable steps to push the simulation into physical or numerical failure.
 * @property {string} failureSignature - Measurable pathology observed when the system breaks.
 * @property {string[]} telemetryTriggers - Metric keys from `telemetry` that breach danger thresholds.
 */

/**
 * @typedef {Object} TelemetryMetric
 * @property {string} key - Stable machine-readable metric identifier.
 * @property {string} label - Display name shown on HUD readouts and strip charts.
 * @property {string} unit - Physical unit or '—' for dimensionless quantities.
 * @property {string} nominalRange - Healthy operating envelope.
 * @property {string} dangerThreshold - Fault, saturation, or instability boundary.
 */

/**
 * @typedef {Object} LaunchTarget
 * @property {'frontier-lab' | 'studio' | 'planned'} kind - Destination route kind.
 * @property {string} [labId] - Frontier Lab identifier when kind === 'frontier-lab'.
 * @property {string} [lessonId] - Existing EIGENLAB studio lesson ID when kind === 'studio'.
 * @property {'3d-lab' | 'intuition' | 'solver' | 'word-problems'} [stage] - Initial studio stage tab.
 * @property {string} [preset] - Optional simulator preset identifier inside the target studio.
 */

/**
 * @typedef {Object} SecondaryStudioTarget
 * @property {string} lessonId - Companion EIGENLAB studio lesson ID.
 * @property {'3d-lab' | 'intuition' | 'solver' | 'word-problems'} stage - Companion stage tab.
 * @property {string} [preset] - Optional simulator preset identifier.
 */

/**
 * @typedef {Object} DagNode
 * @property {string} id - Unique node identifier (e.g., 'F1.2', 'M1.1', 'M4.1').
 * @property {string} trackId - Parent track ID in `DAG_TRACKS`.
 * @property {1 | 2} tier - Tier classification (1 = Foundation, 2 = Frontier).
 * @property {string} title - Full curriculum node title.
 * @property {string} shortTitle - Concise card title for interactive DAG layout.
 * @property {string} summary - High-signal technical overview emphasizing invariants and failure modes.
 * @property {string} equation - Representative KaTeX-ready invariant formula (without outer delimiters).
 * @property {'implemented' | 'planned'} status - Implementation status in EIGENLAB.
 * @property {boolean} isFlagship - True for dedicated flagship interactive Frontier Labs.
 * @property {1 | 2 | 3 | 4} slice - Vertical delivery slice number matching ROADMAP.md.
 * @property {number} estimatedMinutes - Expected interactive lab duration in minutes.
 * @property {string[]} prereqs - Direct upstream prerequisite node IDs (DAG incoming edges).
 * @property {LaunchTarget} launchTarget - Primary interactive launch destination.
 * @property {SecondaryStudioTarget} [secondaryStudio] - Optional deep-dive companion Review Vault studio.
 * @property {FrontierBridge | null} frontierBridge - Required for all Tier 1 nodes; null for Tier 2 frontier endpoints.
 * @property {BreakTheSystemSpec} breakMode - Interactive adversarial failure mode specification.
 * @property {TelemetryMetric[]} telemetry - Key live engineering telemetry channels for this node.
 * @property {string[]} tags - Searchable domain and SOTA keywords.
 */

/**
 * @typedef {Object} DagEdge
 * @property {string} from - Upstream prerequisite node ID.
 * @property {string} to - Downstream unlocked node ID.
 * @property {boolean} isCrossTier - True when the edge crosses from Tier 1 (Foundation) to Tier 2 (Frontier).
 */

/**
 * @typedef {Object} DagSummary
 * @property {number} totalNodes - Total count of nodes across both tiers.
 * @property {number} tier1Count - Number of Tier 1 Foundation nodes.
 * @property {number} tier2Count - Number of Tier 2 Frontier nodes.
 * @property {number} implementedCount - Number of currently playable nodes.
 * @property {number} plannedCount - Number of roadmap-planned nodes.
 * @property {number} flagshipCount - Number of dedicated flagship Frontier Labs.
 * @property {number} trackCount - Total number of tracks.
 * @property {number} tier1TrackCount - Number of Tier 1 tracks.
 * @property {number} tier2TrackCount - Number of Tier 2 tracks.
 * @property {number} totalEdges - Total directed prerequisite edges.
 * @property {number} crossTierEdges - Number of directed edges crossing from Tier 1 into Tier 2.
 * @property {string[]} flagshipIds - Node IDs marked `isFlagship: true`.
 * @property {string[]} implementedIds - Node IDs marked `status: 'implemented'`.
 */

const TIER_1_LABEL = 'Pruned Invariant Foundations';
const TIER_2_LABEL = 'Bleeding-Edge Physical AI & Robotics';

/** @type {readonly Track[]} */
export const DAG_TRACKS = Object.freeze([
  // ── Tier 1: Pruned Invariant Foundations ────────────────────────────────────
  {
    id: 'F1',
    tier: 1,
    tierLabel: TIER_1_LABEL,
    name: 'Applied Math & Spatial Geometry',
    shortName: 'Math & SE(3)',
    symbol: '∇J',
    accent: '#22D3EE',
    accentBg: 'rgba(34, 211, 238, 0.14)',
    summary: 'Gradients, Jacobians, SVD conditioning, Lie-group pose algebra, and multimodal score fields.',
    order: 1,
  },
  {
    id: 'F2',
    tier: 1,
    tierLabel: TIER_1_LABEL,
    name: 'Electronic Circuits & Power Integrity',
    shortName: 'Power & FOC',
    symbol: 'V(t)',
    accent: '#F59E0B',
    accentBg: 'rgba(245, 158, 11, 0.14)',
    summary: 'Switching PDN ripple, 3-phase inverter FOC, regen back-EMF, and analog EMI integrity.',
    order: 2,
  },
  {
    id: 'F3',
    tier: 1,
    tierLabel: TIER_1_LABEL,
    name: 'Digital Logic & AI Compute Architecture',
    shortName: 'AI Compute',
    symbol: 'CLK',
    accent: '#38BDF8',
    accentBg: 'rgba(56, 189, 248, 0.14)',
    summary: 'Timing closure, SRAM/HBM memory bandwidth walls, systolic arrays, and low-bit quantization physics.',
    order: 3,
  },
  {
    id: 'F4',
    tier: 1,
    tierLabel: TIER_1_LABEL,
    name: 'Signal Processing & State Estimation',
    shortName: 'Signals & Est.',
    symbol: 'H(jω)',
    accent: '#818CF8',
    accentBg: 'rgba(129, 140, 248, 0.14)',
    summary: 'Aliasing limits, loop phase lag, and modern UKF, Lie-group InEKF, and Factor-Graph sensor fusion.',
    order: 4,
  },
  {
    id: 'F5',
    tier: 1,
    tierLabel: TIER_1_LABEL,
    name: 'Embedded Systems & Real-Time Buses',
    shortName: 'RTOS & Buses',
    symbol: 'DMA',
    accent: '#FB923C',
    accentBg: 'rgba(251, 146, 60, 0.14)',
    summary: 'Hard real-time determinism, jitter budgets, DMA pipelines, and CAN-FD/EtherCAT/MIPI bandwidth limits.',
    order: 5,
  },
  {
    id: 'F6',
    tier: 1,
    tierLabel: TIER_1_LABEL,
    name: 'Modern Control Systems',
    shortName: 'Modern Control',
    symbol: 'V(x)',
    accent: '#34D399',
    accentBg: 'rgba(52, 211, 153, 0.14)',
    summary: 'Lyapunov energy certificates, robustness margins, contact impedance, and constrained receding-horizon MPC.',
    order: 6,
  },
  {
    id: 'F7',
    tier: 1,
    tierLabel: TIER_1_LABEL,
    name: 'Solid Dynamics & Mechanics',
    shortName: 'Rigid & Contact',
    symbol: 'M(q)',
    accent: '#F472B6',
    accentBg: 'rgba(244, 114, 182, 0.14)',
    summary: 'Spatial inertia coupling, Coulomb friction cones, modal resonance, and compliant elastomer deformation.',
    order: 7,
  },
  {
    id: 'F8',
    tier: 1,
    tierLabel: TIER_1_LABEL,
    name: 'Thermal & Targeted Fluid Limits',
    shortName: 'Thermal & Drag',
    symbol: 'R_th',
    accent: '#EF4444',
    accentBg: 'rgba(239, 68, 68, 0.14)',
    summary: 'Transient thermal RC networks, peak-vs-continuous throttling, liquid cooling, and v² aerodynamic drag.',
    order: 8,
  },

  // ── Tier 2: Bleeding-Edge Physical AI & Robotics ────────────────────────────
  {
    id: 'M1',
    tier: 2,
    tierLabel: TIER_2_LABEL,
    name: 'Generative Robot Policies (VLAs, Diffusion & Flow Matching)',
    shortName: 'Gen Policies',
    symbol: 'π_θ',
    accent: '#A78BFA',
    accentBg: 'rgba(167, 139, 250, 0.16)',
    summary: 'Overcoming multimodal action averaging via Diffusion, Flow Matching, Action Chunking, and 20 Hz→1000 Hz VLA stacks.',
    order: 1,
  },
  {
    id: 'M2',
    tier: 2,
    tierLabel: TIER_2_LABEL,
    name: 'World Models & Latent Dynamics',
    shortName: 'World Models',
    symbol: 'z_t',
    accent: '#2DD4BF',
    accentBg: 'rgba(45, 212, 191, 0.16)',
    summary: 'JEPA-style latent prediction vs. pixel rollouts, compounding horizon error, and real-time compute budgets.',
    order: 2,
  },
  {
    id: 'M3',
    tier: 2,
    tierLabel: TIER_2_LABEL,
    name: 'Differentiable Physics & Sim-to-Real',
    shortName: 'DiffSim & Sim2Real',
    symbol: 'SDF',
    accent: '#60A5FA',
    accentBg: 'rgba(96, 165, 250, 0.16)',
    summary: 'Smooth SDF contact gradients, latency/backlash/mass-drift sim-to-real transfer, and tactile latent spaces.',
    order: 3,
  },
  {
    id: 'M4',
    tier: 2,
    tierLabel: TIER_2_LABEL,
    name: 'Safety-Critical Hybrid Control & Verification',
    shortName: 'Safety & CBF',
    symbol: 'h(x)',
    accent: '#10B981',
    accentBg: 'rgba(16, 185, 129, 0.16)',
    summary: 'Deterministic Control Barrier Function QP shields wrapping stochastic AI policies and adversarial red-teaming.',
    order: 4,
  },
  {
    id: 'M5',
    tier: 2,
    tierLabel: TIER_2_LABEL,
    name: 'Physical-Layer Hardware Co-Design',
    shortName: 'HW Co-Design',
    symbol: 'τ/W',
    accent: '#FBBF24',
    accentBg: 'rgba(251, 191, 36, 0.16)',
    summary: 'Quasi-Direct-Drive actuator torque-speed-thermal design and coupled edge AI memory-power-thermal envelopes.',
    order: 5,
  },
]);

/** @type {readonly DagNode[]} */
export const DAG_NODES = Object.freeze([
  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 1 — PRUNED INVARIANT FOUNDATIONS (F1.1 .. F8.2)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── F1: Applied Math & Spatial Geometry ─────────────────────────────────────
  {
    id: 'F1.1',
    trackId: 'F1',
    tier: 1,
    title: 'Derivatives, Gradients & Loss Landscapes',
    shortTitle: 'Gradients & Loss',
    summary: 'Collapse secant chords into tangent hyperplanes, track curvature and saddle points, and connect instantaneous rates directly to gradient flow in optimization and physics.',
    equation: '\\theta_{k+1} = \\theta_k - \\eta \\nabla_\\theta \\mathcal{L}(\\theta_k)',
    status: 'implemented',
    isFlagship: false,
    slice: 1,
    estimatedMinutes: 25,
    prereqs: [],
    launchTarget: {
      kind: 'studio',
      lessonId: 'calc-derivatives',
      stage: '3d-lab',
    },
    frontierBridge: {
      headline: 'Backprop, Score Fields & Smooth Contact Gradients',
      whyItMatters: 'Every modern robot policy and differentiable simulator flows down gradients of high-dimensional loss and SDF landscapes.',
      targetIds: ['M1.2', 'M3.1'],
    },
    breakMode: {
      title: 'Step-Size Divergence & Saddle Stall',
      description: 'Push learning rate η past 2/L_max on a high-curvature ravine or drop onto a non-smooth kink to watch gradient descent explode or oscillate.',
      failureSignature: 'Loss diverges exponentially or chatters across canyon walls without converging.',
      telemetryTriggers: ['gradNorm', 'curvature'],
    },
    telemetry: [
      { key: 'gradNorm', label: 'Gradient Norm ‖∇f‖', unit: '—', nominalRange: '0.01 – 4.0', dangerThreshold: '> 20.0 (Exploding)' },
      { key: 'curvature', label: 'Curvature |f″(x)|', unit: '—', nominalRange: '0.1 – 5.0', dangerThreshold: '> 15.0 (Stiff Ravine)' },
    ],
    tags: ['calculus', 'gradients', 'optimization', 'autodiff', 'loss-landscape'],
  },
  {
    id: 'F1.2',
    trackId: 'F1',
    tier: 1,
    title: 'Jacobians, SVD & Manipulability Ellipsoids',
    shortTitle: 'Jacobians & SVD',
    summary: 'Decompose differential kinematics J(q) = UΣVᵀ to inspect manipulability ellipsoids, condition number spikes near kinematic singularities, and Damped Least Squares / QP-IK regularization.',
    equation: '\\dot{x} = J(q)\\dot{q},\\quad w(q) = \\sqrt{\\det(J J^\\top)},\\quad \\kappa(J) = \\frac{\\sigma_{\\max}}{\\sigma_{\\min}}',
    status: 'implemented',
    isFlagship: true,
    slice: 1,
    estimatedMinutes: 35,
    prereqs: ['F1.1'],
    launchTarget: {
      kind: 'frontier-lab',
      labId: 'F1.2',
    },
    secondaryStudio: {
      lessonId: 'mech-kinematics',
      stage: '3d-lab',
    },
    frontierBridge: {
      headline: 'Whole-Body QP-IK & CBF-QP Safety Shields',
      whyItMatters: 'Task-space policies and safety barriers map Cartesian constraints to joint velocities via J(q); near det(J)→0, naive commands explode actuators.',
      targetIds: ['M1.3', 'M4.1'],
    },
    breakMode: {
      title: 'Singularity Collapse with λ = 0',
      description: 'Drive the elbow to full extension (q₂ → 0) with damping λ = 0 while commanding a radial Cartesian velocity to collapse the manipulability ellipsoid into a line.',
      failureSignature: 'σ_min → 0, κ(J) → ∞, and raw pseudoinverse joint velocity ‖q̇‖ slams into actuator saturation.',
      telemetryTriggers: ['condNumber', 'jointVelPeak', 'manipulability'],
    },
    telemetry: [
      { key: 'manipulability', label: 'Yoshikawa Index w(q)', unit: 'm²', nominalRange: '0.25 – 1.00', dangerThreshold: '< 0.05 (Collapsed)' },
      { key: 'condNumber', label: 'Condition Number κ(J)', unit: '—', nominalRange: '1.0 – 8.0', dangerThreshold: '> 25.0 (Singular)' },
      { key: 'jointVelPeak', label: 'Peak Joint Velocity ‖q̇‖∞', unit: 'rad/s', nominalRange: '0.0 – 4.0', dangerThreshold: '> 12.0 (Actuator Fault)' },
    ],
    tags: ['jacobian', 'svd', 'manipulability', 'singularity', 'dls', 'qp-ik'],
  },
  {
    id: 'F1.3',
    trackId: 'F1',
    tier: 1,
    title: 'SE(3) Rigid Transforms, Quaternions & Gimbal Lock',
    shortTitle: 'SE(3) & Quaternions',
    summary: 'Master homogeneous transforms, unit quaternion SLERP vs. Euler-angle gimbal lock, and Product of Exponentials screw twists in the Lie algebra se(3).',
    equation: 'T(\\theta) = e^{[\\mathcal{S}_1]\\theta_1} \\cdots e^{[\\mathcal{S}_n]\\theta_n} M \\in SE(3)',
    status: 'implemented',
    isFlagship: false,
    slice: 1,
    estimatedMinutes: 35,
    prereqs: ['F1.2'],
    launchTarget: {
      kind: 'studio',
      lessonId: 'mech-kinematics',
      stage: 'solver',
    },
    frontierBridge: {
      headline: 'Product of Exponentials & Singularity-Free 6-DOF Pose Errors',
      whyItMatters: 'Modern IK (Pink/Mink) and Invariant EKFs compute errors directly in se(3) tangent space—never subtracting Euler angles.',
      targetIds: ['M1.3', 'M3.1'],
    },
    breakMode: {
      title: '±90° Pitch Gimbal Lock & Euler Flip',
      description: 'Command a 6-DOF end-effector through θ_pitch = 90° under naive Euler-angle subtraction to lose one rotational DOF and trigger violent roll/yaw spin.',
      failureSignature: 'Roll and yaw axes become collinear; orientation error jumps by π radians.',
      telemetryTriggers: ['poseErrorSe3', 'quatNormDrift'],
    },
    telemetry: [
      { key: 'poseErrorSe3', label: 'Tangent Error ‖log(T⁻¹T_d)‖', unit: 'rad', nominalRange: '0.00 – 0.25', dangerThreshold: '> 1.20 (Divergent)' },
      { key: 'quatNormDrift', label: 'Quaternion Norm Drift |‖q‖−1|', unit: '—', nominalRange: '< 1e-5', dangerThreshold: '> 1e-2 (Non-Unit)' },
    ],
    tags: ['se3', 'lie-groups', 'quaternions', 'gimbal-lock', 'poe', 'screw-theory'],
  },
  {
    id: 'F1.4',
    trackId: 'F1',
    tier: 1,
    title: 'Probability Distributions, Multimodality & Score Fields',
    shortTitle: 'Score Fields',
    summary: 'Build geometric intuition for Gaussian vs. multimodal densities, Bayes updates, Langevin sampling along score vector fields ∇ₓ log p(x), and why conditional expectation fails on split modes.',
    equation: 's_\\theta(x, t) \\approx \\nabla_x \\log p_t(x),\\quad dx = \\bigl[f(x,t) - g(t)^2 s_\\theta\\bigr]dt',
    status: 'planned',
    isFlagship: false,
    slice: 2,
    estimatedMinutes: 30,
    prereqs: ['F1.1'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: {
      headline: 'Why Generative Policies Replace MSE Regression',
      whyItMatters: 'Real manipulation tasks have multimodal solutions (left vs right); modeling distributions and score fields ∇log p(x) unlocks Diffusion & Flow Matching.',
      targetIds: ['M1.1', 'M1.2', 'M2.1'],
    },
    breakMode: {
      title: 'Mode Collapse Under Unimodal Gaussian Fit',
      description: 'Fit a single Gaussian MLE to a bimodal horseshoe distribution and watch the predicted mean land in a zero-density void.',
      failureSignature: 'Mean sample falls into an out-of-distribution low-density trough (log p(μ) ≪ 0).',
      telemetryTriggers: ['logLikelihood', 'klDivergence'],
    },
    telemetry: [
      { key: 'logLikelihood', label: 'Sample Log-Density log p(x)', unit: 'nats', nominalRange: '-2.5 – 0.0', dangerThreshold: '< -8.0 (OOD Void)' },
      { key: 'klDivergence', label: 'Mode Coverage KL(p‖q)', unit: 'nats', nominalRange: '0.0 – 0.3', dangerThreshold: '> 2.0 (Mode Drop)' },
    ],
    tags: ['probability', 'score-matching', 'multimodal', 'langevin', 'distributions'],
  },

  // ── F2: Electronic Circuits & Power Integrity ───────────────────────────────
  {
    id: 'F2.1',
    trackId: 'F2',
    tier: 1,
    title: 'Switching Power (Buck/Boost), Parasitic L/C & PDN Ripple',
    shortTitle: 'Switching PDN',
    summary: 'Analyze high-dI/dt buck/boost converter transients, PCB trace parasitic inductance L·di/dt voltage droop, and decoupling capacitor impedance across frequencies.',
    equation: '\\Delta V_{\\text{droop}} = L_{\\text{loop}}\\frac{di}{dt} + I_{\\text{step}} R_{\\text{ESR}}',
    status: 'planned',
    isFlagship: false,
    slice: 3,
    estimatedMinutes: 30,
    prereqs: [],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: {
      headline: 'PDN Voltage Droop & Edge Compute/Actuator Brownouts',
      whyItMatters: 'Simultaneous GPU tensor-core bursts and humanoid leg torque impulses pull 100A+ transients; excessive loop inductance collapses rails and triggers mid-stride resets.',
      targetIds: ['M5.1', 'M5.2'],
    },
    breakMode: {
      title: 'Uncapped Loop Inductance Load-Step Brownout',
      description: 'Double PCB power-loop inductance and fire a 60 A GPU + actuator load step without bulk/ceramic decoupling to crash the 12 V / 0.8 V rails.',
      failureSignature: 'Rail voltage droops below UVLO threshold, resetting the real-time MCU mid-trajectory.',
      telemetryTriggers: ['vDroop', 'rippleVpp'],
    },
    telemetry: [
      { key: 'vDroop', label: 'Transient Rail Droop ΔV', unit: 'mV', nominalRange: '0 – 45', dangerThreshold: '> 120 (UVLO Reset)' },
      { key: 'rippleVpp', label: 'Switching Ripple Vpp', unit: 'mV', nominalRange: '5 – 30', dangerThreshold: '> 80 (ADC Noise)' },
    ],
    tags: ['power-integrity', 'buck-boost', 'pdn', 'parasitics', 'decoupling'],
  },
  {
    id: 'F2.2',
    trackId: 'F2',
    tier: 1,
    title: '3-Phase Inverters, FOC & Regenerative Back-EMF',
    shortTitle: '3-Phase FOC',
    summary: 'Transform 3-phase stator currents via Clarke/Park (d-q) frames for independent torque/flux control, and handle voltage saturation and regenerative bus pumping during hard braking.',
    equation: '\\tau_e = \\frac{3}{2} p \\lambda_m i_q,\\qquad v_q = R_s i_q + L_q \\frac{di_q}{dt} + \\omega_e \\lambda_m',
    status: 'planned',
    isFlagship: false,
    slice: 3,
    estimatedMinutes: 35,
    prereqs: ['F2.1'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: {
      headline: 'QDD Torque Bandwidth, Field Weakening & Regen Bus Spikes',
      whyItMatters: 'Dynamic legged and manipulation hardware depends on 20 kHz FOC torque loops; unabsorbed landing regeneration spikes DC bus voltage and destroys MOSFET bridges.',
      targetIds: ['M5.1', 'M1.3'],
    },
    breakMode: {
      title: 'Unclamped Landing Regeneration Over-Voltage',
      description: 'Disable the brake-chopper resistor during a high-speed negative-work impact so regenerative back-EMF pumps the DC link past MOSFET breakdown.',
      failureSignature: 'DC bus surges > 65 V on a 48 V pack, tripping inverter over-voltage fault and cutting leg torque.',
      telemetryTriggers: ['vBus', 'iqTrackingErr'],
    },
    telemetry: [
      { key: 'vBus', label: 'DC Link Bus Voltage', unit: 'V', nominalRange: '44.0 – 52.0', dangerThreshold: '> 60.0 (OVP Trip)' },
      { key: 'iqTrackingErr', label: 'q-Axis Current Error Δi_q', unit: 'A', nominalRange: '0.0 – 0.8', dangerThreshold: '> 5.0 (Voltage Sat.)' },
    ],
    tags: ['foc', 'inverter', 'bldc', 'back-emf', 'regen', 'motor-control'],
  },
  {
    id: 'F2.3',
    trackId: 'F2',
    tier: 1,
    title: 'Ground Loops, EMI Coupling & Op-Amp Saturation',
    shortTitle: 'EMI & Analog',
    summary: 'Isolate common-mode ground bounce, inductive/capacitive switching EMI from PWM phases into millivolt strain-gauge bridges, and op-amp slew-rate / rail clipping.',
    equation: 'V_{\\text{noise}} = M \\frac{di_{\\text{PWM}}}{dt} + Z_{\\text{gnd}} I_{\\text{ret}},\\qquad \\text{CMRR}_{\\text{dB}} = 20\\log_{10}\\!\\left(\\frac{A_d}{A_{cm}}\\right)',
    status: 'planned',
    isFlagship: false,
    slice: 3,
    estimatedMinutes: 30,
    prereqs: ['F2.1'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: {
      headline: 'Clean Tactile & Force-Torque Sensing Under High-dI/dt Switching',
      whyItMatters: 'Contact-rich policies and force controllers rely on microvolt strain-gauge and tactile arrays routed millimeters from 40 kHz motor inverters.',
      targetIds: ['M3.3', 'M4.2'],
    },
    breakMode: {
      title: 'Shared Return Path Motor-to-Sensor Ground Loop',
      description: 'Route the 30 A motor return through the analog force-sensor ground plane and watch phantom contact forces corrupt the grasp controller.',
      failureSignature: 'Force-torque baseline shifts by > 8 N in phase with PWM duty cycle, causing premature release or crush.',
      telemetryTriggers: ['snrDb', 'commonModeV'],
    },
    telemetry: [
      { key: 'snrDb', label: 'Force Channel SNR', unit: 'dB', nominalRange: '55 – 85', dangerThreshold: '< 25 (EMI Flood)' },
      { key: 'commonModeV', label: 'Ground Bounce V_cm', unit: 'mV', nominalRange: '0 – 15', dangerThreshold: '> 150 (Amp Clip)' },
    ],
    tags: ['emi', 'ground-loops', 'op-amp', 'analog-front-end', 'strain-gauge'],
  },

  // ── F3: Digital Logic & AI Compute Architecture ─────────────────────────────
  {
    id: 'F3.1',
    trackId: 'F3',
    tier: 1,
    title: 'Setup/Hold Timing, Clock Skew & Metastability',
    shortTitle: 'Timing & Metastability',
    summary: 'Enforce flip-flop setup/hold slack equations across clock trees, analyze clock-domain crossing (CDC) metastability MTBF, and connect digital timing closure to deterministic edge pipelines.',
    equation: 'T_{\\text{clk}} \\ge t_{cq} + t_{\\text{comb}} + t_{\\text{setup}} - t_{\\text{skew}}',
    status: 'planned',
    isFlagship: false,
    slice: 3,
    estimatedMinutes: 25,
    prereqs: [],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: {
      headline: 'Deterministic Edge Silicon & Synchronized Sensor Pipelines',
      whyItMatters: 'FPGA motor controllers, hardware safety watchdogs, and multi-camera timestamping depend on clean CDC synchronization and deterministic clock closure.',
      targetIds: ['M1.3', 'M5.2'],
    },
    breakMode: {
      title: 'Unsynchronized CDC Metastability Glitch',
      description: 'Remove the 2-FF synchronizer between an async encoder domain and the main control clock while overclocking past setup slack.',
      failureSignature: 'Random corrupted encoder bits inject 180° phantom position jumps into the torque loop.',
      telemetryTriggers: ['setupSlackNs', 'cdcErrorRate'],
    },
    telemetry: [
      { key: 'setupSlackNs', label: 'Worst Setup Slack', unit: 'ns', nominalRange: '+0.4 – +3.0', dangerThreshold: '< 0.0 (Timing Fail)' },
      { key: 'cdcErrorRate', label: 'Metastable Bit Faults', unit: 'err/s', nominalRange: '0', dangerThreshold: '> 1 (Corrupt State)' },
    ],
    tags: ['digital-logic', 'timing-closure', 'cdc', 'metastability', 'fpga'],
  },
  {
    id: 'F3.2',
    trackId: 'F3',
    tier: 1,
    title: 'The Memory Wall (SRAM vs. HBM) & Systolic Matrix Engines',
    shortTitle: 'Memory Wall & Roofline',
    summary: 'Diagnose compute-bound vs. memory-bandwidth-bound transformer layers using the Roofline model, on-chip SRAM tiling, KV-cache footprint, and systolic GEMM dataflow.',
    equation: 'P_{\\text{eff}} = \\min\\!\\bigl(P_{\\text{peak}},\\; I_{\\text{arith}} \\cdot \\text{BW}_{\\text{mem}}\\bigr)',
    status: 'planned',
    isFlagship: false,
    slice: 3,
    estimatedMinutes: 35,
    prereqs: ['F3.1'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: {
      headline: 'Keeping Edge VLAs & World Models Out of HBM Starvation',
      whyItMatters: 'Batch-1 autoregressive robot policies are overwhelmingly memory-bandwidth bound; knowing arithmetic intensity determines whether a 7B VLA runs at 20 Hz or stalls at 3 Hz.',
      targetIds: ['M2.1', 'M5.2'],
    },
    breakMode: {
      title: 'Batch-1 KV-Cache Bandwidth Starvation',
      description: 'Expand context length and disable SRAM tiling on an edge SoC to watch tensor-core utilization plunge below 8% while policy latency breaches 120 ms.',
      failureSignature: 'Roofline stalls deep in memory-bound regime; inference period misses 20 Hz VLA deadline.',
      telemetryTriggers: ['memBwUtil', 'inferenceMs'],
    },
    telemetry: [
      { key: 'memBwUtil', label: 'Memory Bandwidth Utilization', unit: '%', nominalRange: '40 – 85', dangerThreshold: '> 95 (Stalled)' },
      { key: 'inferenceMs', label: 'Forward Pass Latency', unit: 'ms', nominalRange: '8 – 40', dangerThreshold: '> 50 (Missed 20 Hz)' },
    ],
    tags: ['roofline', 'memory-wall', 'sram', 'hbm', 'systolic-array', 'kv-cache'],
  },
  {
    id: 'F3.3',
    trackId: 'F3',
    tier: 1,
    title: 'Quantization Physics (FP32 → FP8 → INT4 Dynamic Range & Clipping)',
    shortTitle: 'Quantization Physics',
    summary: 'Measure quantization noise variance Δ²/12, activation outlier clipping, per-channel scaling, and how precision reduction trades memory traffic against fine action fidelity.',
    equation: 'q(x) = \\text{clip}\\!\\left(\\left\\lfloor\\frac{x}{s}\\right\\rceil + z,\\; q_{\\min}, q_{\\max}\\right),\\quad \\sigma_q^2 \\approx \\frac{\\Delta^2}{12}',
    status: 'planned',
    isFlagship: false,
    slice: 3,
    estimatedMinutes: 30,
    prereqs: ['F3.2'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: {
      headline: 'Sub-50ms Edge VLA Inference Without Action-Head Jitter',
      whyItMatters: 'INT4 weights slash memory traffic 4× to hit onboard robot power budgets, but naive quantization of continuous action heads introduces millimeter-scale chatter during precision insertion.',
      targetIds: ['M1.2', 'M5.2'],
    },
    breakMode: {
      title: 'Per-Tensor INT4 Outlier Clipping Collapse',
      description: 'Apply naive per-tensor INT4 quantization to an activation channel with a 12σ outlier and observe robotic peg-in-hole trajectory quantization jitter.',
      failureSignature: 'Action SNR drops below 18 dB; end-effector steps erratically and jams during insertion.',
      telemetryTriggers: ['sqnrDb', 'actionJitterMm'],
    },
    telemetry: [
      { key: 'sqnrDb', label: 'Action Head SQNR', unit: 'dB', nominalRange: '32 – 60', dangerThreshold: '< 20 (Coarse Steps)' },
      { key: 'actionJitterMm', label: 'Quantized Pose Jitter', unit: 'mm', nominalRange: '0.05 – 0.40', dangerThreshold: '> 2.00 (Jamming)' },
    ],
    tags: ['quantization', 'fp8', 'int4', 'edge-ai', 'sqnr', 'outliers'],
  },

  // ── F4: Signal Processing & State Estimation ────────────────────────────────
  {
    id: 'F4.1',
    trackId: 'F4',
    tier: 1,
    title: 'Aliasing, Spectral Leakage & Anti-Aliasing Filters',
    shortTitle: 'Aliasing & Filters',
    summary: 'Fold high-frequency vibration and PWM switching harmonics across the Nyquist boundary, inspect window leakage, and trade analog anti-aliasing roll-off against introduced phase lag.',
    equation: 'f_{\\text{alias}} = \\bigl|\\,f_{\\text{sig}} - k f_s\\,\\bigr| \\le \\frac{f_s}{2}',
    status: 'planned',
    isFlagship: false,
    slice: 2,
    estimatedMinutes: 25,
    prereqs: ['F1.1'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: {
      headline: 'Unaliased IMU, Encoder & Tactile Streams for Closed-Loop Policies',
      whyItMatters: 'Unfiltered rotor or structural vibration above f_s/2 folds right into the 5–40 Hz control band, tricking state estimators and tactile encoders into reacting to phantom motion.',
      targetIds: ['M3.2', 'M3.3'],
    },
    breakMode: {
      title: 'Motor Harmonic Fold-Back Into Control Band',
      description: 'Disable the analog low-pass anti-aliasing filter on a 200 Hz IMU while exciting a 185 Hz frame vibration to inject a fake 15 Hz wobble.',
      failureSignature: 'Aliased 15 Hz ghost oscillation excites the balance controller into positive feedback.',
      telemetryTriggers: ['aliasPowerDb', 'nyquistRatio'],
    },
    telemetry: [
      { key: 'aliasPowerDb', label: 'In-Band Aliased Spur', unit: 'dBc', nominalRange: '< -50', dangerThreshold: '> -20 (Ghost Signal)' },
      { key: 'nyquistRatio', label: 'Signal / Nyquist Ratio', unit: '—', nominalRange: '0.05 – 0.45', dangerThreshold: '> 1.00 (Folded)' },
    ],
    tags: ['nyquist', 'aliasing', 'fft', 'anti-aliasing', 'imu', 'signal-processing'],
  },
  {
    id: 'F4.2',
    trackId: 'F4',
    tier: 1,
    title: 'Phase Lag & Group Delay in Closed Loops',
    shortTitle: 'Phase Lag & Delay',
    summary: 'Connect filter group delay and pure transport dead-time e⁻ˢᵀ directly to Bode phase roll-off and closed-loop ringing, slicing the 3D |G(s)| Laplace magnitude surface.',
    equation: '\\Delta \\text{PM}(\\tau) = \\omega_{gc} \\cdot \\tau \\cdot \\frac{180^\\circ}{\\pi},\\qquad \\tau_g(\\omega) = -\\frac{d\\angle H(j\\omega)}{d\\omega}',
    status: 'implemented',
    isFlagship: false,
    slice: 1,
    estimatedMinutes: 35,
    prereqs: ['F4.1'],
    launchTarget: {
      kind: 'studio',
      lessonId: 'mech-root-bode',
      stage: '3d-lab',
    },
    frontierBridge: {
      headline: 'Sim-to-Real Delay Margins & Phase Erosion',
      whyItMatters: 'Every millisecond of camera-to-torque latency eats directly into phase margin (ΔPM = ω_gc·τ), turning sim-stable policies oscillatory on hardware.',
      targetIds: ['M3.2'],
    },
    breakMode: {
      title: 'Transport Delay Phase-Margin Exhaustion',
      description: 'Inject 35 ms of pure pipeline delay into a high-bandwidth loop (ω_gc = 30 rad/s) until phase margin crosses 0°.',
      failureSignature: 'Closed-loop poles cross the jω-axis; step response erupts into growing limit-cycle oscillation.',
      telemetryTriggers: ['phaseMarginDeg', 'delayMarginMs'],
    },
    telemetry: [
      { key: 'phaseMarginDeg', label: 'Phase Margin PM', unit: '°', nominalRange: '45 – 75', dangerThreshold: '< 15 (Oscillatory)' },
      { key: 'delayMarginMs', label: 'Remaining Delay Margin', unit: 'ms', nominalRange: '15 – 60', dangerThreshold: '< 4 (Unstable)' },
    ],
    tags: ['bode', 'phase-lag', 'group-delay', 'dead-time', 'stability'],
  },
  {
    id: 'F4.3',
    trackId: 'F4',
    tier: 1,
    title: 'Sensor Fusion: KF, UKF, InEKF & Factor Graphs',
    shortTitle: 'UKF, InEKF & Graphs',
    summary: 'Progress from Joseph-form Kalman Filters to Unscented sigma points, Lie-group Invariant EKFs (SE_2(3)), and GTSAM/MHE nonlinear factor graphs for calibrated multi-modal state estimation.',
    equation: '\\hat{x}_{k|k} = \\arg\\min_x \\sum_i \\bigl\\| h_i(x) - z_i \\bigr\\|_{\\Sigma_i}^2',
    status: 'implemented',
    isFlagship: false,
    slice: 1,
    estimatedMinutes: 40,
    prereqs: ['F1.4', 'F4.1'],
    launchTarget: {
      kind: 'studio',
      lessonId: 'mech-state-space',
      stage: '3d-lab',
      preset: 'kf-fusion',
    },
    frontierBridge: {
      headline: 'Uncertainty-Aware World Models & Tactile Belief State',
      whyItMatters: 'Modern robots replace fragile EKFs with UKF sigma points, Lie-group InEKFs, and GTSAM/MHE factor graphs to keep pose uncertainty calibrated.',
      targetIds: ['M2.2', 'M3.3'],
    },
    breakMode: {
      title: 'Linearized EKF Divergence & Overconfident Covariance',
      description: 'Inject high yaw-rate nonlinearity and IMU bias drift with underestimated process noise Q to watch standard EKF covariance collapse while true error diverges.',
      failureSignature: 'NEES χ² statistic blows past 99% bound; filter reports 2 mm uncertainty while 18 cm off.',
      telemetryTriggers: ['neesScore', 'poseRmseMm'],
    },
    telemetry: [
      { key: 'neesScore', label: 'Consistency NEES (χ²)', unit: '—', nominalRange: '0.5 – 2.5', dangerThreshold: '> 6.0 (Overconfident)' },
      { key: 'poseRmseMm', label: '3D State RMSE', unit: 'mm', nominalRange: '0.5 – 5.0', dangerThreshold: '> 25.0 (Lost Lock)' },
    ],
    tags: ['kalman', 'ukf', 'inekf', 'factor-graphs', 'gtsam', 'sensor-fusion'],
  },

  // ── F5: Embedded Systems & Real-Time Buses ──────────────────────────────────
  {
    id: 'F5.1',
    trackId: 'F5',
    tier: 1,
    title: 'Deterministic Latency vs. Jitter (RTOS & DMA Pipelines)',
    shortTitle: 'RTOS & Jitter',
    summary: 'Separate mean latency from p99.9 tail jitter, trace priority inversion and interrupt preemption, and design zero-copy DMA pipelines for hard 1 kHz control loops.',
    equation: 'T_{\\text{worst}} = \\text{WCET}_{\\text{ctrl}} + \\sum_{j \\in hp} \\left\\lceil \\frac{T_{\\text{worst}}}{P_j} \\right\\rceil C_j + J_{\\text{IRQ}}',
    status: 'planned',
    isFlagship: false,
    slice: 2,
    estimatedMinutes: 30,
    prereqs: ['F3.1', 'F4.2'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: {
      headline: 'Hard 1 kHz Real-Time Loops & Zero-Jitter Policy-to-Shield Handshake',
      whyItMatters: 'Linux GC pauses or priority inversion on the low-level motor thread break control stability and can starve the deterministic CBF safety shield during contact.',
      targetIds: ['M1.3', 'M3.2', 'M4.1'],
    },
    breakMode: {
      title: 'Priority Inversion & Unbounded Tail Jitter',
      description: 'Disable priority inheritance on a shared telemetry mutex while logging bursty camera frames, starving the 1 kHz torque task past its 1 ms deadline.',
      failureSignature: 'p99.9 cycle time spikes from 0.4 ms to 6.8 ms; consecutive missed frames trigger watchdog e-stop.',
      telemetryTriggers: ['jitterUs', 'deadlineMisses'],
    },
    telemetry: [
      { key: 'jitterUs', label: 'p99.9 Loop Jitter', unit: 'µs', nominalRange: '5 – 40', dangerThreshold: '> 250 (Phase Erosion)' },
      { key: 'deadlineMisses', label: 'Missed 1 kHz Deadlines', unit: 'cnt/s', nominalRange: '0', dangerThreshold: '>= 1 (Hard RT Fault)' },
    ],
    tags: ['rtos', 'dma', 'jitter', 'wcet', 'priority-inversion', 'real-time'],
  },
  {
    id: 'F5.2',
    trackId: 'F5',
    tier: 1,
    title: 'Bus Bandwidth Bottlenecks (CAN-FD, EtherCAT, Camera MIPI)',
    shortTitle: 'Fieldbus & MIPI',
    summary: 'Budget arbitration overhead, distributed-clock frame cycles, and serialized pixel bitrates across CAN-FD, 100 Mbps EtherCAT daisy chains, and multi-lane MIPI CSI-2 cameras.',
    equation: 'U_{\\text{bus}} = \\sum_i \\frac{L_i^{\\text{frame}} + L_i^{\\text{ovh}}}{B_{\\text{eff}} \\cdot T_i} < U_{\\max}',
    status: 'planned',
    isFlagship: false,
    slice: 2,
    estimatedMinutes: 30,
    prereqs: ['F5.1'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: {
      headline: 'Synchronizing Multi-Camera VLA Feeds, Tactile Arrays & EtherCAT Torques',
      whyItMatters: 'A 30-DOF humanoid with wrist cameras and 1 kHz tactile fingertips saturates poorly partitioned buses, desynchronizing observation timestamps from torque commands.',
      targetIds: ['M1.3', 'M3.3', 'M5.2'],
    },
    breakMode: {
      title: 'CAN-FD Arbitration Starvation on 12-Actuator Bus',
      description: 'Stream raw 2 kHz diagnostics alongside 12 actuator torque commands on a single 5 Mbps CAN-FD segment until low-ID arbitration starves ankle joints.',
      failureSignature: 'Bus utilization exceeds 85%; ankle feedback packets drop and timestamps skew by > 12 ms.',
      telemetryTriggers: ['busUtilPct', 'packetDropRate'],
    },
    telemetry: [
      { key: 'busUtilPct', label: 'Bus Utilization', unit: '%', nominalRange: '20 – 65', dangerThreshold: '> 82 (Arbitration Stall)' },
      { key: 'packetDropRate', label: 'Dropped Telemetry Frames', unit: 'pkt/s', nominalRange: '0', dangerThreshold: '> 2 (Desync)' },
    ],
    tags: ['can-fd', 'ethercat', 'mipi', 'fieldbus', 'bandwidth', 'synchronization'],
  },

  // ── F6: Modern Control Systems ──────────────────────────────────────────────
  {
    id: 'F6.1',
    trackId: 'F6',
    tier: 1,
    title: 'State-Space Dynamics & Lyapunov Energy Stability',
    shortTitle: 'State-Space & Lyapunov',
    summary: 'Formulate multivariable (A, B, C, D) dynamics, verify PBH stabilizability, synthesize optimal LQR feedback, and construct Lyapunov energy functions V(x) that prove asymptotic convergence.',
    equation: '\\dot{x} = Ax + Bu,\\qquad V(x) = x^\\top P x > 0,\\; \\dot{V}(x) = -x^\\top Q x < 0',
    status: 'implemented',
    isFlagship: false,
    slice: 1,
    estimatedMinutes: 40,
    prereqs: ['F1.1'],
    launchTarget: {
      kind: 'studio',
      lessonId: 'mech-state-space',
      stage: '3d-lab',
      preset: 'lqr-cart',
    },
    frontierBridge: {
      headline: 'Safety Certificates & Lyapunov-Guided Policy Verification',
      whyItMatters: 'Lyapunov functions V(x) prove convergence while Control Barrier Functions h(x) prove forward-invariant safety—wrapping stochastic AI policies.',
      targetIds: ['M4.1'],
    },
    breakMode: {
      title: 'Sign-Indefinite V̇(x) & Unstabilizable Mode',
      description: 'Degrade actuator authority or move a pole onto an uncontrollable subspace so V̇(x) turns positive and energy pumps outward.',
      failureSignature: 'Lyapunov energy V(x) grows monotonically; inverted pendulum escapes region of attraction.',
      telemetryTriggers: ['lyapunovDot', 'maxRealEig'],
    },
    telemetry: [
      { key: 'lyapunovDot', label: 'Energy Rate V̇(x)', unit: 'J/s', nominalRange: '-50.0 – -0.01', dangerThreshold: '> 0.0 (Energy Growth)' },
      { key: 'maxRealEig', label: 'Max Re(λ_i(A−BK))', unit: '1/s', nominalRange: '-15.0 – -0.5', dangerThreshold: '>= 0.0 (Unstable)' },
    ],
    tags: ['state-space', 'lyapunov', 'lqr', 'controllability', 'stability'],
  },
  {
    id: 'F6.2',
    trackId: 'F6',
    tier: 1,
    title: 'Phase/Gain Margins & Closed-Loop Destabilization',
    shortTitle: 'Margins & Robustness',
    summary: 'Quantify gain margin, phase margin, and peak sensitivity M_s = ‖S‖_∞ on live servo disturbance rigs, seeing how integrator windup and derivative noise blow up nominal tuning.',
    equation: 'M_s = \\sup_{\\omega} \\left|\\frac{1}{1 + L(j\\omega)}\\right|,\\qquad \\text{GM} \\ge \\frac{M_s}{M_s - 1}',
    status: 'implemented',
    isFlagship: false,
    slice: 1,
    estimatedMinutes: 35,
    prereqs: ['F4.2'],
    launchTarget: {
      kind: 'studio',
      lessonId: 'mech-pid',
      stage: '3d-lab',
    },
    frontierBridge: {
      headline: 'Robustness Budgets Under Hardware Drift',
      whyItMatters: 'Quantifying GM, PM, and sensitivity peak M_s prevents field instability when payloads, friction, or battery voltage drift from nominal sim.',
      targetIds: ['M3.2', 'M4.2'],
    },
    breakMode: {
      title: 'Integrator Windup + Payload Inertia Double',
      description: 'Double end-effector payload mass while clamping torque limits without anti-windup to drive sensitivity peak M_s > 3.5.',
      failureSignature: 'Sustained overshoot > 60% and actuator saturation limit cycle.',
      telemetryTriggers: ['sensitivityPeak', 'overshootPct'],
    },
    telemetry: [
      { key: 'sensitivityPeak', label: 'Sensitivity Peak M_s', unit: '—', nominalRange: '1.1 – 1.8', dangerThreshold: '> 2.5 (Fragile Loop)' },
      { key: 'overshootPct', label: 'Step Overshoot', unit: '%', nominalRange: '0 – 12', dangerThreshold: '> 35 (Ringing)' },
    ],
    tags: ['pid', 'gain-margin', 'phase-margin', 'sensitivity', 'robust-control'],
  },
  {
    id: 'F6.3',
    trackId: 'F6',
    tier: 1,
    title: 'Impedance & Admittance Control (Virtual Springs for Contact)',
    shortTitle: 'Impedance Control',
    summary: 'Shape apparent end-effector stiffness K_d, damping D_d, and inertia M_d in Cartesian space so robots absorb unmodeled impacts instead of fighting stiff environments.',
    equation: '\\tau = J(q)^\\top\\!\\bigl[K_d(x_d - x) + D_d(\\dot{x}_d - \\dot{x})\\bigr] + g(q)',
    status: 'planned',
    isFlagship: false,
    slice: 2,
    estimatedMinutes: 35,
    prereqs: ['F6.1'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: {
      headline: 'Compliant Contact Execution Beneath Generative Policy Waypoints',
      whyItMatters: 'A 20 Hz VLA outputs noisy target poses; stiff position tracking shatters glass or trips torque faults on contact, whereas operational-space impedance absorbs millimeter pose errors safely.',
      targetIds: ['M1.3', 'M3.3'],
    },
    breakMode: {
      title: 'High-Stiffness Position Control Into Rigid Wall',
      description: 'Crank virtual stiffness K_d to 8000 N/m with low damping while commanding a 4 mm penetration into a steel table to trigger violent contact bounce.',
      failureSignature: 'Contact force spikes > 120 N and end-effector chatters off the surface at 45 Hz.',
      telemetryTriggers: ['contactForceN', 'dampingRatio'],
    },
    telemetry: [
      { key: 'contactForceN', label: 'Peak Contact Force', unit: 'N', nominalRange: '2 – 25', dangerThreshold: '> 80 (Impact Fault)' },
      { key: 'dampingRatio', label: 'Contact Damping ζ', unit: '—', nominalRange: '0.70 – 1.10', dangerThreshold: '< 0.25 (Chatter)' },
    ],
    tags: ['impedance', 'admittance', 'osc', 'compliance', 'force-control'],
  },
  {
    id: 'F6.4',
    trackId: 'F6',
    tier: 1,
    title: 'Model Predictive Control (MPC) & Receding Horizons',
    shortTitle: 'MPC & Horizons',
    summary: 'Solve finite-horizon constrained quadratic programs online at every tick, balancing horizon length N against solver wall-clock time, terminal cost, and feasibility.',
    equation: '\\min_{u_{0:N-1}} \\sum_{k=0}^{N-1} \\bigl(x_k^\\top Q x_k + u_k^\\top R u_k\\bigr) + x_N^\\top P_f x_N \\;\\text{s.t.}\\; x_k \\in \\mathcal{X},\\, u_k \\in \\mathcal{U}',
    status: 'implemented',
    isFlagship: false,
    slice: 1,
    estimatedMinutes: 40,
    prereqs: ['F6.1'],
    launchTarget: {
      kind: 'studio',
      lessonId: 'mech-state-space',
      stage: '3d-lab',
      preset: 'mpc-cbf',
    },
    frontierBridge: {
      headline: 'Constrained Receding Horizons & Latent World-Model Planning',
      whyItMatters: 'MPC enforces hard actuator/contact limits online and shares the exact horizon-compounding trade-offs of neural World Models.',
      targetIds: ['M1.3', 'M2.2'],
    },
    breakMode: {
      title: 'Short-Horizon Blindness & QP Infeasibility',
      description: 'Shrink prediction horizon N to 3 steps at high velocity approaching a state barrier so the robot cannot brake within torque bounds and the QP goes infeasible.',
      failureSignature: 'QP solver returns primal infeasible; emergency fallback misses braking distance.',
      telemetryTriggers: ['qpSolveMs', 'constraintSlack'],
    },
    telemetry: [
      { key: 'qpSolveMs', label: 'QP Solve Time', unit: 'ms', nominalRange: '0.2 – 2.5', dangerThreshold: '> 8.0 (Overrun)' },
      { key: 'constraintSlack', label: 'Constraint Violation ε', unit: '—', nominalRange: '0.000', dangerThreshold: '> 0.05 (Infeasible)' },
    ],
    tags: ['mpc', 'qp', 'receding-horizon', 'constraints', 'optimal-control'],
  },

  // ── F7: Solid Dynamics & Mechanics ──────────────────────────────────────────
  {
    id: 'F7.1',
    trackId: 'F7',
    tier: 1,
    title: 'Inertia Tensors, Coriolis Coupling & Dynamic Balance',
    shortTitle: 'Inertia & Dynamics',
    summary: 'Compute full manipulator dynamics M(q)q̈ + C(q,q̇)q̇ + g(q) = τ, centroidal momentum / ZMP balance criteria, and cross-joint inertial coupling during rapid accelerations.',
    equation: 'M(q)\\ddot{q} + C(q,\\dot{q})\\dot{q} + g(q) = \\tau + J_c(q)^\\top f_c',
    status: 'planned',
    isFlagship: false,
    slice: 2,
    estimatedMinutes: 35,
    prereqs: ['F1.3'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: {
      headline: 'Whole-Body Centroidal Dynamics & Dynamic Balance Under Payload Shifts',
      whyItMatters: 'Ignoring Coriolis coupling or off-diagonal inertia terms breaks fast arm swings and bipedal stance balance when policies accelerate heavy limbs or pick unknown objects.',
      targetIds: ['M1.3', 'M3.2', 'M5.1'],
    },
    breakMode: {
      title: 'Uncanceled Coriolis Whip & ZMP Tip-Over',
      description: 'Command a high-speed shoulder-elbow slew with diagonal-only inertia feedforward while carrying an unmodeled 3 kg payload.',
      failureSignature: 'Cross-axis torque kicks the elbow off-path and pushes the Zero-Moment Point outside the support polygon.',
      telemetryTriggers: ['zmpMarginMm', 'coriolisTorqueNm'],
    },
    telemetry: [
      { key: 'zmpMarginMm', label: 'Support Polygon ZMP Margin', unit: 'mm', nominalRange: '25 – 85', dangerThreshold: '< 5 (Tip-Over)' },
      { key: 'coriolisTorqueNm', label: 'Uncompensated C(q,q̇)q̇', unit: 'N·m', nominalRange: '0.0 – 3.5', dangerThreshold: '> 12.0 (Tracking Lag)' },
    ],
    tags: ['rigid-body', 'inertia-tensor', 'coriolis', 'zmp', 'whole-body-dynamics'],
  },
  {
    id: 'F7.2',
    trackId: 'F7',
    tier: 1,
    title: 'Contact Mechanics: Friction Cones, Impulses & Slip',
    shortTitle: 'Contact & Friction',
    summary: 'Model unilateral complementarity contact constraints, 3D Coulomb friction cones ‖f_t‖ ≤ μ f_n, stick-slip transitions, and rigid-body collision impulses.',
    equation: '\\phi(q) \\ge 0,\\; f_n \\ge 0,\\; \\phi(q) f_n = 0,\\qquad \\|f_t\\|_2 \\le \\mu f_n',
    status: 'planned',
    isFlagship: false,
    slice: 4,
    estimatedMinutes: 35,
    prereqs: ['F7.1'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: {
      headline: 'Differentiable Contact Solvers & Slip-Aware Dexterous Manipulation',
      whyItMatters: 'Discontinuous stick-slip and impact impulses create vanishing or infinite gradients; understanding friction cones is prerequisite to smooth differentiable physics and in-hand manipulation.',
      targetIds: ['M3.1', 'M3.3'],
    },
    breakMode: {
      title: 'Friction Cone Breach & Sudden Grasp Slip',
      description: 'Drop surface friction μ from 0.8 to 0.25 under tangential shear acceleration without increasing normal grasp force.',
      failureSignature: 'Force vector exits the Coulomb cone (‖f_t‖/f_n > μ); object slides out of fingertips.',
      telemetryTriggers: ['coneRatio', 'slipVelMmS'],
    },
    telemetry: [
      { key: 'coneRatio', label: 'Cone Utilization ‖f_t‖/(μf_n)', unit: '—', nominalRange: '0.10 – 0.70', dangerThreshold: '>= 1.00 (Slipping)' },
      { key: 'slipVelMmS', label: 'Tangential Slip Velocity', unit: 'mm/s', nominalRange: '0.0 – 0.5', dangerThreshold: '> 10.0 (Dropped)' },
    ],
    tags: ['contact-mechanics', 'friction-cone', 'lcp', 'impulses', 'manipulation'],
  },
  {
    id: 'F7.3',
    trackId: 'F7',
    tier: 1,
    title: 'Modal Resonance, Structural Stiffness & Fatigue Hotspots',
    shortTitle: 'Modal Resonance',
    summary: 'Extract structural eigenmodes ω_n = √(k/m), notch-filter transmission anti-resonances, and map backlash and cyclic stress risers in lightweight robot links.',
    equation: '\\bigl(K - \\omega_i^2 M\\bigr)\\phi_i = 0,\\qquad \\sigma_{\\text{eff}} = K_t \\sigma_{\\text{nom}}',
    status: 'planned',
    isFlagship: false,
    slice: 2,
    estimatedMinutes: 30,
    prereqs: ['F7.1'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: {
      headline: 'Unmodeled Structural Flex & Gearbox Backlash in Sim-to-Real Transfer',
      whyItMatters: 'Rigid-body simulators assume infinite link stiffness; real harmonic drives and thin aluminum arms resonate at 18–45 Hz, destabilizing high-gain sim policies on hardware.',
      targetIds: ['M3.2', 'M5.1'],
    },
    breakMode: {
      title: 'Control Bandwidth Colliding With First Flex Mode',
      description: 'Push joint PD bandwidth right onto the 24 Hz harmonic-drive torsional resonance without a notch filter.',
      failureSignature: 'Sustained structural howling and ±1.8° tip oscillation even at zero velocity command.',
      telemetryTriggers: ['modalGainDb', 'backlashDeg'],
    },
    telemetry: [
      { key: 'modalGainDb', label: 'Resonant Peak Gain', unit: 'dB', nominalRange: '-6.0 – +3.0', dangerThreshold: '> +12.0 (Howling)' },
      { key: 'backlashDeg', label: 'Transmission Backlash', unit: '°', nominalRange: '0.01 – 0.08', dangerThreshold: '> 0.35 (Limit Cycle)' },
    ],
    tags: ['modal-analysis', 'resonance', 'stiffness', 'backlash', 'fatigue'],
  },
  {
    id: 'F7.4',
    trackId: 'F7',
    tier: 1,
    title: 'Compliant Mechanisms & Soft Elastomer Deformation',
    shortTitle: 'Soft Elastomers',
    summary: 'Capture hyperelastic stress-strain behavior, silicone gel pad shear/indentation mapping, and monolithic flexure kinematics for gentle contact adaptation.',
    equation: '\\Psi = C_{10}(\\bar{I}_1 - 3) + C_{01}(\\bar{I}_2 - 3) + \\frac{1}{D_1}(J - 1)^2',
    status: 'planned',
    isFlagship: false,
    slice: 4,
    estimatedMinutes: 30,
    prereqs: ['F7.2'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: {
      headline: 'Visuotactile Elastomer Skins & Deformable Manipulation',
      whyItMatters: 'Optical tactile sensors (GelSight/DIGIT) literally measure elastomer deformation fields; soft compliance governs both contact patch geometry and tactile latent observability.',
      targetIds: ['M3.3', 'M3.1'],
    },
    breakMode: {
      title: 'Elastomer Bottom-Out & Shear Hysteresis Drift',
      description: 'Over-compress a soft tactile gel pad past 45% strain under oblique shear so optical markers saturate and viscoelastic recovery lags.',
      failureSignature: 'Tactile shear readout clips and exhibits 30% hysteresis drift after release.',
      telemetryTriggers: ['strainPct', 'hysteresisErr'],
    },
    telemetry: [
      { key: 'strainPct', label: 'Elastomer Peak Strain', unit: '%', nominalRange: '5 – 28', dangerThreshold: '> 45 (Bottom-Out)' },
      { key: 'hysteresisErr', label: 'Viscoelastic Drift', unit: '%', nominalRange: '0.5 – 3.0', dangerThreshold: '> 12.0 (Bias Shift)' },
    ],
    tags: ['elastomers', 'hyperelastic', 'compliant-mechanisms', 'gelsight', 'tactile'],
  },

  // ── F8: Thermal & Targeted Fluid Limits ─────────────────────────────────────
  {
    id: 'F8.1',
    trackId: 'F8',
    tier: 1,
    title: 'Thermal Resistance Networks & Transient Duty-Cycle Throttling',
    shortTitle: 'Thermal RC Networks',
    summary: 'Model multi-node Cauer/Foster thermal RC networks for motor windings and AI SoC junctions, distinguishing 3-second peak torque bursts from steady-state thermal limits.',
    equation: 'C_{\\text{th}}\\frac{dT_j}{dt} = P_{\\text{loss}}(t) - \\frac{T_j - T_{\\text{amb}}}{R_{\\text{th}}},\\qquad P_{\\text{cu}} = I^2 R(T_j)',
    status: 'planned',
    isFlagship: false,
    slice: 3,
    estimatedMinutes: 30,
    prereqs: ['F2.2'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: {
      headline: 'Continuous vs. Peak QDD Torque & SoC Thermal Throttling',
      whyItMatters: 'Copper resistance rises +0.39%/°C creating positive thermal runaway in stalled actuators, while edge SoC throttling halves VLA frequency right when workloads peak.',
      targetIds: ['M5.1', 'M5.2'],
    },
    breakMode: {
      title: 'Stalled-Actuator I²R(T) Thermal Runaway',
      description: 'Hold 3× continuous torque during a static crouch with clogged heatsink airflow so rising winding resistance accelerates Joule heating past insulation rating.',
      failureSignature: 'Winding hits 135 °C in 18 s; thermal governor slashes torque 60% mid-lift.',
      telemetryTriggers: ['windingTempC', 'throttlePct'],
    },
    telemetry: [
      { key: 'windingTempC', label: 'Winding / Junction Temp', unit: '°C', nominalRange: '35 – 95', dangerThreshold: '> 125 (Derate / Burn)' },
      { key: 'throttlePct', label: 'Thermal Derating', unit: '%', nominalRange: '0', dangerThreshold: '> 25 (Capability Loss)' },
    ],
    tags: ['thermal', 'rc-network', 'joule-heating', 'duty-cycle', 'throttling'],
  },
  {
    id: 'F8.2',
    trackId: 'F8',
    tier: 1,
    title: 'Convective/Liquid Cooling & Aerodynamic Drag Scaling (v²)',
    shortTitle: 'Cooling & v² Drag',
    summary: 'Size forced-air and cold-plate liquid loops for dense compute+actuator packs, and quantify quadratic drag F_d ∝ v² and cubic power P_d ∝ v³ limits on mobile and aerial robots.',
    equation: '\\dot{Q} = \\dot{m} c_p \\Delta T,\\qquad F_d = \\frac{1}{2}\\rho C_d A v^2,\\; P_d = F_d v \\propto v^3',
    status: 'planned',
    isFlagship: false,
    slice: 3,
    estimatedMinutes: 25,
    prereqs: ['F8.1'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: {
      headline: 'Sustained Edge Inference Power Envelopes & Aerial/Mobile Endurance',
      whyItMatters: 'Dissipating 150 W of onboard VLA compute in a sealed humanoid torso requires active cooling loops, while v³ drag power governs high-speed drone and rover energy budgets.',
      targetIds: ['M5.2', 'M5.1'],
    },
    breakMode: {
      title: 'Sealed-Chassis Heat Soak & High-Speed v³ Battery Cliff',
      description: 'Cut radiator airflow by 70% at 120 W compute load or double drone cruise velocity and watch power draw jump 8×.',
      failureSignature: 'Coolant ΔT saturates chassis soak limit and mission endurance collapses by > 65%.',
      telemetryTriggers: ['coolantDeltaC', 'dragPowerW'],
    },
    telemetry: [
      { key: 'coolantDeltaC', label: 'Heatsink ΔT Above Ambient', unit: '°C', nominalRange: '8 – 28', dangerThreshold: '> 48 (Heat Soak)' },
      { key: 'dragPowerW', label: 'Aero Drag Power Draw', unit: 'W', nominalRange: '15 – 120', dangerThreshold: '> 400 (Range Cliff)' },
    ],
    tags: ['liquid-cooling', 'convection', 'aerodynamic-drag', 'power-budget', 'thermal'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 2 — BLEEDING-EDGE PHYSICAL AI & ROBOTICS (M1.1 .. M5.2)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── M1: Generative Robot Policies ───────────────────────────────────────────
  {
    id: 'M1.1',
    trackId: 'M1',
    tier: 2,
    title: 'Why Regression Fails: Multimodal Action Averaging',
    shortTitle: 'Multimodal Averaging',
    summary: 'Compare L2/MSE behavioral cloning head-to-head against multimodal generative policies (Diffusion / Flow Matching) when human demonstrations split around an obstacle.',
    equation: '\\arg\\min_{\\hat{a}} \\mathbb{E}_{a \\sim p(a|o)}\\!\\bigl[\\|\\hat{a} - a\\|_2^2\\bigr] = \\mathbb{E}[a \\mid o] \\notin \\text{supp}(p)',
    status: 'implemented',
    isFlagship: true,
    slice: 1,
    estimatedMinutes: 30,
    prereqs: ['F1.4'],
    launchTarget: {
      kind: 'frontier-lab',
      labId: 'M1.1',
    },
    frontierBridge: null,
    breakMode: {
      title: 'Symmetric Bimodal Trap',
      description: 'Center the obstacle with 50/50 left-right demos and run MSE regression to trigger mode-averaging collision.',
      failureSignature: 'MSE policy outputs the arithmetic average of left and right paths, driving straight into the obstacle.',
      telemetryTriggers: ['collisionRatePct', 'modeEntropy'],
    },
    telemetry: [
      { key: 'collisionRatePct', label: 'Obstacle Collision Rate', unit: '%', nominalRange: '0 – 3', dangerThreshold: '> 50 (Mode Average)' },
      { key: 'modeEntropy', label: 'Demo Split Balance H(m)', unit: 'bits', nominalRange: '0.0 – 1.0', dangerThreshold: '1.0 under MSE' },
      { key: 'wassersteinDist', label: 'Policy–Demo W₂ Distance', unit: 'm', nominalRange: '0.02 – 0.12', dangerThreshold: '> 0.45 (Off-Manifold)' },
    ],
    tags: ['multimodal', 'behavioral-cloning', 'mse-failure', 'diffusion', 'flow-matching'],
  },
  {
    id: 'M1.2',
    trackId: 'M1',
    tier: 2,
    title: 'Diffusion Policies, Flow Matching & Action Chunking',
    shortTitle: 'Flow & Action Chunks',
    summary: 'Contrast 100-step DDPM denoising against straight-path Conditional Flow Matching (1–4 NFE) and receding-horizon Action Chunking (ACT/π₀) with temporal ensembling.',
    equation: '\\frac{da_t}{dt} = v_\\theta(a_t, o, t),\\qquad \\mathcal{L}_{\\text{CFM}} = \\mathbb{E}\\!\\left[\\bigl\\|v_\\theta(a_t, o, t) - (a_1 - a_0)\\bigr\\|_2^2\\right]',
    status: 'planned',
    isFlagship: false,
    slice: 2,
    estimatedMinutes: 35,
    prereqs: ['F1.1', 'F1.4', 'M1.1'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: null,
    breakMode: {
      title: 'Chunk-Boundary Discontinuity & High-NFE Latency Stall',
      description: 'Set action-chunk horizon H = 32 without temporal ensembling under a moving target, or push DDPM to 100 steps on an edge GPU.',
      failureSignature: 'Open-loop chunk drifts off target between replans and snaps violently at chunk boundaries.',
      telemetryTriggers: ['nfeLatencyMs', 'chunkJerk'],
    },
    telemetry: [
      { key: 'nfeLatencyMs', label: 'Policy Inference Latency', unit: 'ms', nominalRange: '8 – 35', dangerThreshold: '> 60 (Stale Chunk)' },
      { key: 'chunkJerk', label: 'Boundary Jerk Spike', unit: 'm/s³', nominalRange: '0.5 – 6.0', dangerThreshold: '> 25.0 (Snap)' },
    ],
    tags: ['diffusion-policy', 'flow-matching', 'action-chunking', 'act', 'vla'],
  },
  {
    id: 'M1.3',
    trackId: 'M1',
    tier: 2,
    title: 'Hierarchical VLA (20 Hz) → Whole-Body Control (1000 Hz)',
    shortTitle: 'VLA → 1 kHz WBC',
    summary: 'Bridge slow semantic Vision-Language-Action planners (System 2, 5–20 Hz) to real-time QP Whole-Body Controllers and impedance loops (System 1, 1000 Hz) with smooth spline interpolation.',
    equation: '\\min_{\\ddot{q}, f_c} \\sum_k w_k \\|J_k \\ddot{q} + \\dot{J}_k\\dot{q} - \\ddot{x}_k^{\\text{VLA}}\\|^2 \\;\\text{s.t.}\\; M\\ddot{q} + h = S^\\top\\tau + J_c^\\top f_c',
    status: 'planned',
    isFlagship: false,
    slice: 2,
    estimatedMinutes: 40,
    prereqs: ['F1.2', 'F5.1', 'F6.3', 'F7.1'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: null,
    breakMode: {
      title: 'Zero-Order Hold Staircase Excitation',
      description: 'Feed raw 10 Hz VLA Cartesian jumps directly into a stiff 1 kHz IK solver without spline smoothing or impedance compliance.',
      failureSignature: '10 Hz stair-step impulses excite structural resonance and trip joint torque limits.',
      telemetryTriggers: ['wbcTrackErrMm', 'torqueSpikeNm'],
    },
    telemetry: [
      { key: 'wbcTrackErrMm', label: 'WBC Task-Space Error', unit: 'mm', nominalRange: '0.5 – 4.0', dangerThreshold: '> 20.0 (Diverged)' },
      { key: 'torqueSpikeNm', label: 'Step-Boundary Torque Spike', unit: 'N·m', nominalRange: '0.5 – 8.0', dangerThreshold: '> 35.0 (Tripped)' },
    ],
    tags: ['vla', 'whole-body-control', 'hierarchical', 'system1-system2', 'qp-wbc'],
  },

  // ── M2: World Models & Latent Dynamics ──────────────────────────────────────
  {
    id: 'M2.1',
    trackId: 'M2',
    tier: 2,
    title: 'Pixel Rollouts vs. Latent World Models (JEPA Intuition)',
    shortTitle: 'Latent World Models',
    summary: 'Contrast compute-heavy pixel-level video prediction against Joint-Embedding Predictive Architectures (V-JEPA/TD-MPC2) that discard stochastic background noise to model task-relevant latent dynamics.',
    equation: '\\hat{z}_{t+1} = f_\\phi(z_t, a_t),\\qquad \\mathcal{L}_{\\text{JEPA}} = \\bigl\\| \\hat{z}_{t+1} - \\text{sg}\\bigl(E_{\\bar{\\theta}}(o_{t+1})\\bigr) \\bigr\\|_2^2',
    status: 'planned',
    isFlagship: false,
    slice: 4,
    estimatedMinutes: 35,
    prereqs: ['F1.4', 'F3.2'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: null,
    breakMode: {
      title: 'Representation Collapse vs. Pixel Hallucination',
      description: 'Remove stop-gradient / variance regularization to collapse latent embeddings to a constant vector, or inject moving background clutter into a pixel decoder.',
      failureSignature: 'Latent rank collapses to 1 (zero planning signal) or pixel rollout spends 90% capacity hallucinating shadows.',
      telemetryTriggers: ['latentRank', 'rolloutFps'],
    },
    telemetry: [
      { key: 'latentRank', label: 'Effective Latent Rank', unit: '—', nominalRange: '24 – 128', dangerThreshold: '< 4 (Collapsed)' },
      { key: 'rolloutFps', label: 'Imagined Rollout Throughput', unit: 'step/s', nominalRange: '500 – 5000', dangerThreshold: '< 30 (Too Slow)' },
    ],
    tags: ['world-models', 'jepa', 'latent-dynamics', 'td-mpc', 'representation-learning'],
  },
  {
    id: 'M2.2',
    trackId: 'M2',
    tier: 2,
    title: 'Compounding Horizon Error & Compute-vs-Accuracy Budgets',
    shortTitle: 'Horizon Compounding',
    summary: 'Measure how single-step model bias ε compounds exponentially over horizon H, and optimize MPC/CEM shooting rollouts under strict real-time latency and uncertainty-gating budgets.',
    equation: '\\|\\hat{z}_{t+H} - z_{t+H}\\| \\le \\epsilon \\frac{L_f^H - 1}{L_f - 1}',
    status: 'planned',
    isFlagship: false,
    slice: 4,
    estimatedMinutes: 35,
    prereqs: ['F4.3', 'F6.4', 'M2.1'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: null,
    breakMode: {
      title: 'Model Exploitation Over Uncalibrated Long Horizon',
      description: 'Stretch open-loop imagination horizon to H = 60 without ensemble disagreement penalties so CEM planner exploits hallucinated shortcuts.',
      failureSignature: 'Predicted reward climbs while real physical success rate plunges to 0%.',
      telemetryTriggers: ['horizonDrift', 'epistemicStd'],
    },
    telemetry: [
      { key: 'horizonDrift', label: 'H-Step Latent Drift', unit: 'σ', nominalRange: '0.1 – 1.2', dangerThreshold: '> 4.0 (Hallucinated)' },
      { key: 'epistemicStd', label: 'Ensemble Disagreement', unit: '—', nominalRange: '0.02 – 0.20', dangerThreshold: '> 0.80 (OOD Plan)' },
    ],
    tags: ['compounding-error', 'horizon', 'cem', 'model-based-rl', 'uncertainty'],
  },

  // ── M3: Differentiable Physics & Sim-to-Real ────────────────────────────────
  {
    id: 'M3.1',
    trackId: 'M3',
    tier: 2,
    title: 'Signed Distance Functions (SDFs) & Smooth Contact Gradients',
    shortTitle: 'SDF & Diff Contact',
    summary: 'Differentiate through rigid contact using continuous Signed Distance Fields, soft complementarity/barrier relaxation, and implicit adjoint gradients without exploding step-function impulses.',
    equation: '\\|\\nabla \\phi(p)\\|_2 = 1,\\qquad f_n(\\phi) = \\kappa \\log\\!\\bigl(1 + e^{-\\phi / \\epsilon}\\bigr)',
    status: 'planned',
    isFlagship: false,
    slice: 4,
    estimatedMinutes: 35,
    prereqs: ['F1.1', 'F7.2'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: null,
    breakMode: {
      title: 'Stiff Contact Gradient Explosion vs. Ghost Tunneling',
      description: 'Push smoothing temperature ε → 0 to trigger Dirac impulse gradients, or raise ε too high until fingertips tunnel through the object.',
      failureSignature: 'Policy gradients spike > 10⁵ (NaN weights) or contact force acts at 3 cm standoff.',
      telemetryTriggers: ['contactGradNorm', 'penetrationMm'],
    },
    telemetry: [
      { key: 'contactGradNorm', label: 'Contact Gradient Norm', unit: '—', nominalRange: '0.1 – 20.0', dangerThreshold: '> 1e4 (Exploded)' },
      { key: 'penetrationMm', label: 'Max Interpenetration', unit: 'mm', nominalRange: '0.0 – 0.5', dangerThreshold: '> 5.0 (Tunneling)' },
    ],
    tags: ['sdf', 'differentiable-physics', 'mjx', 'warp', 'contact-gradients'],
  },
  {
    id: 'M3.2',
    trackId: 'M3',
    tier: 2,
    title: 'Sim-to-Real Gap: Domain Randomization vs. Latency/Backlash/Mass Drift',
    shortTitle: 'Sim-to-Real Gap',
    summary: 'Dissect why visual/mass domain randomization alone fails when unmodeled bus latency, actuator backlash, and structural flex erode phase margin during zero-shot hardware deployment.',
    equation: '\\pi^* = \\arg\\max_\\pi \\mathbb{E}_{\\xi \\sim p(\\xi)}\\!\\bigl[J(\\pi; \\xi_{\\text{mass}}, \\xi_{\\tau}, \\xi_{\\text{backlash}})\\bigr]',
    status: 'planned',
    isFlagship: false,
    slice: 2,
    estimatedMinutes: 35,
    prereqs: ['F4.2', 'F5.1', 'F7.1', 'F7.3'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: null,
    breakMode: {
      title: 'Zero-Delay Sim Policy Deployed on 28ms Real Rig',
      description: 'Train with 0 ms latency and rigid gears, then toggle real-world 28 ms camera+CAN delay, 0.3° backlash, and +25% payload drift.',
      failureSignature: 'Sim-perfect policy breaks into violent gait oscillation within 1.5 seconds of transfer.',
      telemetryTriggers: ['simRealDropPct', 'effectivePmDeg'],
    },
    telemetry: [
      { key: 'simRealDropPct', label: 'Sim-to-Real Return Drop', unit: '%', nominalRange: '0 – 12', dangerThreshold: '> 45 (Transfer Fail)' },
      { key: 'effectivePmDeg', label: 'Hardware Phase Margin', unit: '°', nominalRange: '35 – 65', dangerThreshold: '< 10 (Oscillating)' },
    ],
    tags: ['sim-to-real', 'domain-randomization', 'latency', 'backlash', 'sysid'],
  },
  {
    id: 'M3.3',
    trackId: 'M3',
    tier: 2,
    title: 'Tactile Latent Spaces & Contact-Rich Manipulation',
    shortTitle: 'Tactile Latents',
    summary: 'Fuse high-dimensional visuotactile shear fields with proprioceptive wrench estimates into compact contact-mode latents for blind insertion, slip recovery, and delicate grasping.',
    equation: 'z^{\\text{tac}}_t = E_\\psi\\!\\bigl(I^{\\text{gel}}_t, f^{\\text{FT}}_t, q_t\\bigr) \\mapsto \\{p_{\\text{slip}}, \\Delta p_{\\text{obj}}\\}' ,
    status: 'planned',
    isFlagship: false,
    slice: 4,
    estimatedMinutes: 35,
    prereqs: ['F4.3', 'F7.4'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: null,
    breakMode: {
      title: 'Vision-Only Occlusion During Blind Peg Insertion',
      description: 'Occlude wrist cameras behind the gripper fingers and disable tactile shear feedback during a 0.2 mm tolerance insertion.',
      failureSignature: 'Policy keeps pressing laterally into the chamfer until torque overload aborts.',
      telemetryTriggers: ['slipProb', 'jamForceN'],
    },
    telemetry: [
      { key: 'slipProb', label: 'Incipient Slip Probability', unit: '%', nominalRange: '0 – 15', dangerThreshold: '> 75 (Drop Imminent)' },
      { key: 'jamForceN', label: 'Lateral Jamming Force', unit: 'N', nominalRange: '0.5 – 6.0', dangerThreshold: '> 30.0 (Wedged)' },
    ],
    tags: ['tactile', 'visuotactile', 'contact-rich', 'dexterous-manipulation', 'slip-detection'],
  },

  // ── M4: Safety-Critical Hybrid Control & Verification ───────────────────────
  {
    id: 'M4.1',
    trackId: 'M4',
    tier: 2,
    title: 'Control Barrier Functions (CBFs) Wrapping Stochastic AI Policies',
    shortTitle: 'CBF-QP Safety Shield',
    summary: 'Wrap a stochastic generative policy π_θ with a deterministic 1 kHz CBF-QP minimally invasive safety filter guaranteeing forward invariance h(x) ≥ 0 across humans, obstacles, and joint limits.',
    equation: 'u^* = \\arg\\min_u \\|u - u_{\\text{AI}}\\|_2^2 \\quad \\text{s.t.} \\quad L_f h(x) + L_g h(x) u + \\alpha\\bigl(h(x)\\bigr) \\ge 0',
    status: 'implemented',
    isFlagship: true,
    slice: 1,
    estimatedMinutes: 35,
    prereqs: ['F1.2', 'F6.1', 'M1.2'],
    launchTarget: {
      kind: 'frontier-lab',
      labId: 'M4.1',
    },
    frontierBridge: null,
    breakMode: {
      title: 'Disable CBF + 40ms Latency',
      description: 'Strip the deterministic CBF-QP shield and inject 40ms bus delay + stochastic policy noise to trigger a safety violation.',
      failureSignature: 'Barrier value h(x) plunges below 0, breaching the forbidden human/workspace safety boundary.',
      telemetryTriggers: ['barrierH', 'shieldInterventionPct'],
    },
    telemetry: [
      { key: 'barrierH', label: 'Barrier Value h(x)', unit: 'm²', nominalRange: '>= 0.05 (Safe)', dangerThreshold: '< 0.00 (Violation)' },
      { key: 'shieldInterventionPct', label: 'QP Override ‖u*−u_AI‖', unit: '%', nominalRange: '0 – 35', dangerThreshold: '100 (Saturated)' },
      { key: 'qpLatencyUs', label: 'CBF-QP Solve Time', unit: 'µs', nominalRange: '40 – 250', dangerThreshold: '> 1000 (Missed Tick)' },
    ],
    tags: ['cbf', 'safety-filter', 'qp', 'forward-invariance', 'hybrid-control'],
  },
  {
    id: 'M4.2',
    trackId: 'M4',
    tier: 2,
    title: 'Adversarial Eval Harnesses: Red-Teaming Physical Policies',
    shortTitle: 'Adversarial Eval',
    summary: 'Stress-test physical policies systematically across worst-case OOD lighting, impulse shoves, sensor dropouts, and latency spikes to surface tail-risk failure manifolds before field deployment.',
    equation: '\\delta^* = \\arg\\max_{\\delta \\in \\mathcal{B}_\\epsilon} \\; \\mathbb{P}\\!\\bigl(\\exists t : h(x_t(\\pi, \\delta)) < 0\\bigr)',
    status: 'planned',
    isFlagship: false,
    slice: 2,
    estimatedMinutes: 30,
    prereqs: ['M3.2', 'M4.1'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: null,
    breakMode: {
      title: 'Correlated Sensor Dropout + Mid-Stride Impulse',
      description: 'Fire a 60 N·s lateral shove simultaneously with 150 ms wrist-camera blackout to find the worst-case safety failure corner.',
      failureSignature: 'Nominal 98% benchmark policy drops to 14% survival under correlated tail perturbations.',
      telemetryTriggers: ['worstCaseSurvivalPct', 'tailRiskCvar'],
    },
    telemetry: [
      { key: 'worstCaseSurvivalPct', label: 'Adversarial Survival Rate', unit: '%', nominalRange: '95 – 100', dangerThreshold: '< 80 (Fragile)' },
      { key: 'tailRiskCvar', label: 'CVaR₉₅ Safety Margin', unit: 'm', nominalRange: '> 0.08', dangerThreshold: '< 0.00 (Breach)' },
    ],
    tags: ['red-teaming', 'adversarial-eval', 'verification', 'tail-risk', 'cvar'],
  },

  // ── M5: Physical-Layer Hardware Co-Design ───────────────────────────────────
  {
    id: 'M5.1',
    trackId: 'M5',
    tier: 2,
    title: 'Quasi-Direct-Drive (QDD) Actuator Torque-Speed-Thermal Co-Design',
    shortTitle: 'QDD Co-Design',
    summary: 'Co-optimize motor constant K_m, planetary gear ratio N (6:1–12:1), reflected inertia N²J_m, backdrivability, and winding thermal mass for dynamic legged and manipulation joints.',
    equation: 'J_{\\text{ref}} = N^2 J_m,\\qquad \\tau_{\\text{peak}} = N K_t I_{\\text{max}},\\qquad P_{\\text{loss}} = \\left(\\frac{\\tau}{N K_m}\\right)^2',
    status: 'planned',
    isFlagship: false,
    slice: 3,
    estimatedMinutes: 35,
    prereqs: ['F2.2', 'F7.1', 'F8.1'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: null,
    breakMode: {
      title: 'Over-Geared Impact Shatter vs. Under-Geared Thermal Burn',
      description: 'Push gear ratio N = 80:1 to spike reflected inertia 6400× during landing impact, or drop N = 2:1 to melt windings under static hold.',
      failureSignature: 'High-N gearbox strips teeth on impact; low-N direct drive hits 140 °C in 9 seconds.',
      telemetryTriggers: ['reflectedInertiaRatio', 'motorMarginC'],
    },
    telemetry: [
      { key: 'reflectedInertiaRatio', label: 'Reflected / Link Inertia', unit: '—', nominalRange: '0.1 – 1.5', dangerThreshold: '> 8.0 (Impact Fragile)' },
      { key: 'motorMarginC', label: 'Thermal Headroom to 130°C', unit: '°C', nominalRange: '30 – 85', dangerThreshold: '< 10 (Derating)' },
    ],
    tags: ['qdd', 'actuators', 'gear-ratio', 'reflected-inertia', 'hardware-codesign'],
  },
  {
    id: 'M5.2',
    trackId: 'M5',
    tier: 2,
    title: 'Edge AI Compute Envelopes: Memory Wall + Power + Thermal Limits',
    shortTitle: 'Edge AI Envelopes',
    summary: 'Co-design onboard robot AI stacks across quantization precision, memory bandwidth, battery TDP, and heatsink thermal capacity to sustain real-time 20 Hz VLA + 1 kHz control without throttling.',
    equation: 'f_{\\text{VLA}} \\le \\min\\!\\left(\\frac{\\text{BW}_{\\text{mem}}}{B_{\\text{weights}} + B_{\\text{KV}}},\\; \\frac{P_{\\text{cool}}}{E_{\\text{step}}}\\right)',
    status: 'planned',
    isFlagship: false,
    slice: 3,
    estimatedMinutes: 35,
    prereqs: ['F2.1', 'F3.2', 'F3.3', 'F8.1', 'F8.2'],
    launchTarget: {
      kind: 'planned',
    },
    frontierBridge: null,
    breakMode: {
      title: 'Unquantized 7B FP16 Overload on 45 W Torso Envelope',
      description: 'Deploy an FP16 7B VLA on a 45 W thermally constrained edge SoC while running dual stereo depth streams.',
      failureSignature: 'Memory bandwidth caps rate at 4.2 Hz and thermal throttle halves clocks after 90 seconds.',
      telemetryTriggers: ['sustainedVlaHz', 'socPowerW'],
    },
    telemetry: [
      { key: 'sustainedVlaHz', label: 'Sustained VLA Frequency', unit: 'Hz', nominalRange: '15 – 30', dangerThreshold: '< 8 (Laggy Policy)' },
      { key: 'socPowerW', label: 'SoC Package Power', unit: 'W', nominalRange: '18 – 60', dangerThreshold: '> 90 (Thermal Cap)' },
    ],
    tags: ['edge-ai', 'tdp', 'memory-bandwidth', 'quantization', 'hardware-codesign'],
  },
]);

// ── Internal O(1) Lookup Indexes ──────────────────────────────────────────────

/** @type {Map<string, Track>} */
const TRACK_BY_ID = new Map(DAG_TRACKS.map((track) => [track.id, track]));

/** @type {Map<string, DagNode>} */
const NODE_BY_ID = new Map(DAG_NODES.map((node) => [node.id, node]));

/** @type {Map<string, string[]>} */
const DIRECT_UNLOCKS_BY_ID = new Map(DAG_NODES.map((node) => [node.id, []]));
for (const node of DAG_NODES) {
  for (const prereqId of node.prereqs) {
    const unlocks = DIRECT_UNLOCKS_BY_ID.get(prereqId);
    if (unlocks) {
      unlocks.push(node.id);
    }
  }
}

// ── Exported DAG Query Helpers ────────────────────────────────────────────────

/**
 * Lookup a DAG node by its ID (e.g., 'F1.2', 'M1.1', 'M4.1').
 * @param {string} id
 * @returns {DagNode | undefined}
 */
export function getDagNode(id) {
  return NODE_BY_ID.get(id);
}

/**
 * Lookup a DAG track by its ID (e.g., 'F1'..'F8', 'M1'..'M5').
 * @param {string} trackId
 * @returns {Track | undefined}
 */
export function getDagTrack(trackId) {
  return TRACK_BY_ID.get(trackId);
}

/**
 * Return all transitive upstream prerequisite node IDs required before `id`.
 * Does not include `id` itself.
 * @param {string} id
 * @returns {Set<string>}
 */
export function getUpstreamChain(id) {
  /** @type {Set<string>} */
  const visited = new Set();
  const start = NODE_BY_ID.get(id);
  if (!start) return visited;

  const stack = [...start.prereqs];
  while (stack.length > 0) {
    const currId = stack.pop();
    if (!currId || visited.has(currId)) continue;
    visited.add(currId);
    const currNode = NODE_BY_ID.get(currId);
    if (currNode) {
      for (const nextPrereq of currNode.prereqs) {
        if (!visited.has(nextPrereq)) {
          stack.push(nextPrereq);
        }
      }
    }
  }
  return visited;
}

/**
 * Return all transitive downstream unlocked node IDs reachable from `id`.
 * Does not include `id` itself.
 * @param {string} id
 * @returns {Set<string>}
 */
export function getDownstreamChain(id) {
  /** @type {Set<string>} */
  const visited = new Set();
  if (!NODE_BY_ID.has(id)) return visited;

  const stack = [...(DIRECT_UNLOCKS_BY_ID.get(id) ?? [])];
  while (stack.length > 0) {
    const currId = stack.pop();
    if (!currId || visited.has(currId)) continue;
    visited.add(currId);
    const nextUnlocks = DIRECT_UNLOCKS_BY_ID.get(currId);
    if (nextUnlocks) {
      for (const childId of nextUnlocks) {
        if (!visited.has(childId)) {
          stack.push(childId);
        }
      }
    }
  }
  return visited;
}

/**
 * Return direct downstream node IDs whose `prereqs` array includes `id`.
 * @param {string} id
 * @returns {string[]}
 */
export function getDirectUnlocks(id) {
  const unlocks = DIRECT_UNLOCKS_BY_ID.get(id);
  return unlocks ? [...unlocks] : [];
}

/**
 * Return all directed prerequisite edges `{ from, to, isCrossTier }` in the DAG.
 * @returns {DagEdge[]}
 */
export function getDagEdges() {
  /** @type {DagEdge[]} */
  const edges = [];
  for (const node of DAG_NODES) {
    for (const prereqId of node.prereqs) {
      const fromNode = NODE_BY_ID.get(prereqId);
      edges.push({
        from: prereqId,
        to: node.id,
        isCrossTier: Boolean(fromNode && fromNode.tier !== node.tier),
      });
    }
  }
  return edges;
}

/**
 * Return aggregate counts and flagship/implemented metadata for the DAG curriculum.
 * @returns {DagSummary}
 */
export function getDagSummary() {
  let tier1Count = 0;
  let tier2Count = 0;
  let implementedCount = 0;
  let plannedCount = 0;
  let flagshipCount = 0;
  /** @type {string[]} */
  const flagshipIds = [];
  /** @type {string[]} */
  const implementedIds = [];

  for (const node of DAG_NODES) {
    if (node.tier === 1) tier1Count += 1;
    else tier2Count += 1;

    if (node.status === 'implemented') {
      implementedCount += 1;
      implementedIds.push(node.id);
    } else {
      plannedCount += 1;
    }

    if (node.isFlagship) {
      flagshipCount += 1;
      flagshipIds.push(node.id);
    }
  }

  let tier1TrackCount = 0;
  let tier2TrackCount = 0;
  for (const track of DAG_TRACKS) {
    if (track.tier === 1) tier1TrackCount += 1;
    else tier2TrackCount += 1;
  }

  const edges = getDagEdges();
  let crossTierEdges = 0;
  for (const edge of edges) {
    if (edge.isCrossTier) crossTierEdges += 1;
  }

  return {
    totalNodes: DAG_NODES.length,
    tier1Count,
    tier2Count,
    implementedCount,
    plannedCount,
    flagshipCount,
    trackCount: DAG_TRACKS.length,
    tier1TrackCount,
    tier2TrackCount,
    totalEdges: edges.length,
    crossTierEdges,
    flagshipIds,
    implementedIds,
  };
}
