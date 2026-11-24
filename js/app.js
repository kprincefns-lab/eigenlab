/**
 * EIGENLAB — Unified Application Shell, Discipline Hub & Lesson 01 Orchestrator
 * Coordinates:
 *  - View 1: Discipline Hub (Home Dashboard + Ambient 3D Preview + Mastery Ring + 4-Domain Grid)
 *  - View 2: Lesson 01 (`calc-derivatives`) 4-Stage Interactive Studio
 *    1. 3D Limit & Tangent Lab (`3d-lab`)
 *    2. Curve & Derivative Intuition (`intuition`)
 *    3. Paperless Step Solver (`solver`)
 *    4. Applied Word Problems Queue (`word-problems`)
 */

import { store, sound, renderKatex } from './store.js';
import {
  Derivative3DStudio,
  FUNCTION_PRESETS,
  createAmbientHeroScene,
} from './viz/derivative-3d.js';
import { StackedDerivativeLab, VisualQuizEngine } from './viz/stacked-graphs.js';
import { Integral3DStudio, INTEGRAL_PRESETS } from './viz/integral-3d.js';
import { StackedIntegralLab, IntegralVisualQuizEngine } from './viz/integral-graphs.js';
import { DiffEq3DStudio, DIFFEQ_PRESETS } from './viz/diffeq-3d.js';
import { LaplaceSPlaneLab, DiffEqVisualQuizEngine } from './viz/diffeq-graphs.js';
import { LinAlg3DStudio, LINALG_PRESETS } from './viz/linalg-3d.js';
import { LinearTransform2DLab, LinAlgVisualQuizEngine } from './viz/linalg-graphs.js';
import { Pid3DStudio, PID_PRESETS } from './viz/pid-3d.js';
import { PidDecompositionLab, PidVisualQuizEngine } from './viz/pid-graphs.js';
import { Modeling3DStudio, MODELING_PRESETS } from './viz/modeling-3d.js';
import { ModelingSPlaneLab, ModelingVisualQuizEngine } from './viz/modeling-graphs.js';
import { Freq3DStudio, FREQ_PRESETS } from './viz/freq-3d.js';
import { RootBodeLab, FreqVisualQuizEngine } from './viz/freq-graphs.js';
import {
  StateSpace3DStudio,
  STATESPACE_PRESETS,
  analyzeStateSpaceSystem,
} from './viz/statespace-3d.js';
import {
  StateSpaceGraphLab,
  StateSpaceVisualQuizEngine,
} from './viz/statespace-graphs.js';
import {
  Kinematics3DStudio,
  KINEMATICS_PRESETS,
  analyzeKinematicsSystem,
} from './viz/kinematics-3d.js';
import {
  KinematicsGraphLab,
  KinematicsVisualQuizEngine,
} from './viz/kinematics-graphs.js';
import { PaperlessStepSolver } from './solver/step-solver.js';
import { INTEGRAL_PROBLEMS, INTEGRAL_SOLVER_TIERS } from '../data/lessons/integrals-problems.js';
import { DIFFEQ_PROBLEMS, DIFFEQ_SOLVER_TIERS } from '../data/lessons/diffeq-problems.js';
import { LINALG_PROBLEMS, LINALG_SOLVER_TIERS } from '../data/lessons/linalg-problems.js';
import { PID_PROBLEMS, PID_SOLVER_TIERS } from '../data/lessons/pid-problems.js';
import { MODELING_PROBLEMS, MODELING_SOLVER_TIERS } from '../data/lessons/modeling-problems.js';
import { FREQ_PROBLEMS, FREQ_SOLVER_TIERS } from '../data/lessons/freq-problems.js';
import {
  STATESPACE_PROBLEMS,
  STATESPACE_SOLVER_TIERS,
} from '../data/lessons/statespace-problems.js';
import {
  KINEMATICS_PROBLEMS,
  KINEMATICS_SOLVER_TIERS,
} from '../data/lessons/kinematics-problems.js';
import {
  DAG_TRACKS,
  DAG_NODES,
  getDagNode,
  getDagSummary,
} from './data/dag-curriculum.js';
import { CurriculumSkillGraph } from './viz/curriculum-graph.js';
import {
  FrontierLessonShell,
  getFrontierCompletedIds,
} from './lab/frontier-shell.js';
import { createF12JacobianLab } from './lab/labs/f12-jacobian-lab.js';
import { createM11DiffusionLab } from './lab/labs/m11-diffusion-lab.js';
import { createM41CbfLab } from './lab/labs/m41-cbf-lab.js';

// ---------------------------------------------------------------------------
// Constants & Fallback Data
// ---------------------------------------------------------------------------

const LESSON_ID = 'calc-derivatives';
const INTEGRAL_LESSON_ID = 'calc-integrals';
const DIFFEQ_LESSON_ID = 'math-diff-eq';
const LINALG_LESSON_ID = 'math-lin-alg';
const MODELING_LESSON_ID = 'mech-modeling';
const PID_LESSON_ID = 'mech-pid';
const FREQ_LESSON_ID = 'mech-root-bode';
const STATESPACE_LESSON_ID = 'mech-state-space';
const KINEMATICS_LESSON_ID = 'mech-kinematics';

const FRONTIER_LAB_FACTORIES = {
  'F1.2': createF12JacobianLab,
  'M1.1': createM11DiffusionLab,
  'M4.1': createM41CbfLab,
};

const STAGES = [
  {
    id: '3d-lab',
    number: 1,
    icon: '🌐',
    shortLabel: '3D Limit Lab',
    mobileLabel: '3D Lab',
    label: '1. 3D Limit & Tangent Lab',
  },
  {
    id: 'intuition',
    number: 2,
    icon: '📈',
    shortLabel: 'Curve Intuition',
    mobileLabel: 'Graphs',
    label: '2. Curve & Derivative Intuition',
  },
  {
    id: 'solver',
    number: 3,
    icon: '🧮',
    shortLabel: 'Step Solver',
    mobileLabel: 'Solver',
    label: '3. Paperless Step Solver',
  },
  {
    id: 'word-problems',
    number: 4,
    icon: '⚙️',
    shortLabel: 'Word Problems',
    mobileLabel: 'Applied',
    label: '4. Applied Word Problems',
  },
];

const INTEGRAL_STAGES = [
  {
    id: '3d-lab',
    number: 1,
    icon: '🌐',
    shortLabel: '3D Riemann Lab',
    mobileLabel: '3D Area',
    label: '1. 3D Riemann & Area Lab',
  },
  {
    id: 'intuition',
    number: 2,
    icon: '📈',
    shortLabel: 'FTC Intuition',
    mobileLabel: 'Graphs',
    label: '2. Accumulation & FTC Intuition',
  },
  {
    id: 'solver',
    number: 3,
    icon: '🧮',
    shortLabel: 'Integral Solver',
    mobileLabel: 'Solver',
    label: '3. Paperless Integral Solver',
  },
  {
    id: 'word-problems',
    number: 4,
    icon: '⚙️',
    shortLabel: 'Word Problems',
    mobileLabel: 'Applied',
    label: '4. Applied Word Problems',
  },
];

const DIFFEQ_STAGES = [
  {
    id: '3d-lab',
    number: 1,
    icon: '🌐',
    shortLabel: '3D Dynamics',
    mobileLabel: '3D ODE',
    label: '1. 3D Dynamics & Phase Lab',
  },
  {
    id: 'intuition',
    number: 2,
    icon: '📈',
    shortLabel: 's-Plane Lab',
    mobileLabel: 's-Plane',
    label: '2. Laplace s-Plane & Quiz',
  },
  {
    id: 'solver',
    number: 3,
    icon: '🧮',
    shortLabel: 'ODE/Laplace Solver',
    mobileLabel: 'Solver',
    label: '3. ODE & Laplace Step Solver',
  },
  {
    id: 'word-problems',
    number: 4,
    icon: '⚙️',
    shortLabel: 'Word Problems',
    mobileLabel: 'Applied',
    label: '4. Applied Word Problems',
  },
];

const LINALG_STAGES = [
  {
    id: '3d-lab',
    number: 1,
    icon: '🌐',
    shortLabel: '3D Eigen Lab',
    mobileLabel: '3D Space',
    label: '1. 3D Transform & Eigen Lab',
  },
  {
    id: 'intuition',
    number: 2,
    icon: '📐',
    shortLabel: '2D Basis & SVD',
    mobileLabel: '2D Eigen',
    label: '2. 2D Basis, SVD & Visual Quiz',
  },
  {
    id: 'solver',
    number: 3,
    icon: '🧮',
    shortLabel: 'LinAlg Solver',
    mobileLabel: 'Solver',
    label: '3. Paperless Linear Algebra Solver',
  },
  {
    id: 'word-problems',
    number: 4,
    icon: '⚙️',
    shortLabel: 'Word Problems',
    mobileLabel: 'Applied',
    label: '4. Applied Word Problems',
  },
];

const PID_STAGES = [
  {
    id: '3d-lab',
    number: 1,
    icon: '🎛️',
    shortLabel: '3D PID Rig',
    mobileLabel: '3D PID',
    label: '1. 3D PID & Disturbance Rig',
  },
  {
    id: 'intuition',
    number: 2,
    icon: '📊',
    shortLabel: 'P/I/D Lab',
    mobileLabel: 'P/I/D',
    label: '2. P/I/D Decomposition & Quiz',
  },
  {
    id: 'solver',
    number: 3,
    icon: '🧮',
    shortLabel: 'Control Solver',
    mobileLabel: 'Solver',
    label: '3. Paperless Control & PID Solver',
  },
  {
    id: 'word-problems',
    number: 4,
    icon: '⚙️',
    shortLabel: 'Word Problems',
    mobileLabel: 'Applied',
    label: '4. Applied Word Problems',
  },
];

const MODELING_STAGES = [
  {
    id: '3d-lab',
    number: 1,
    icon: '🔩',
    shortLabel: '3D Rig & s-Plane',
    mobileLabel: '3D Rig',
    label: '1. 3D Physical Rig & s-Plane',
  },
  {
    id: 'intuition',
    number: 2,
    icon: '📐',
    shortLabel: 's-Plane Locus',
    mobileLabel: 's-Plane',
    label: '2. Pole Locus, Analogy & Quiz',
  },
  {
    id: 'solver',
    number: 3,
    icon: '🧮',
    shortLabel: 'Modeling Solver',
    mobileLabel: 'Solver',
    label: '3. Deep Multi-Part ODE → CL Solver',
  },
  {
    id: 'word-problems',
    number: 4,
    icon: '⚙️',
    shortLabel: 'Word Problems',
    mobileLabel: 'Applied',
    label: '4. Applied Word Problems',
  },
];

const FREQ_STAGES = [
  {
    id: '3d-lab',
    number: 1,
    icon: '🏔️',
    shortLabel: '3D |G(s)| Surface',
    mobileLabel: '3D |G(s)|',
    label: '1. 3D |G(s)| Surface & Root Locus',
  },
  {
    id: 'intuition',
    number: 2,
    icon: '📈',
    shortLabel: 'Locus & Bode',
    mobileLabel: 'Bode',
    label: '2. Root Locus ↔ Bode Lab & Quiz',
  },
  {
    id: 'solver',
    number: 3,
    icon: '🧮',
    shortLabel: 'Lead-Lag Solver',
    mobileLabel: 'Solver',
    label: '3. Root Locus, Bode & Lead-Lag Solver',
  },
  {
    id: 'word-problems',
    number: 4,
    icon: '⚙️',
    shortLabel: 'Word Problems',
    mobileLabel: 'Applied',
    label: '4. Applied Word Problems',
  },
];

const STATESPACE_STAGES = [
  {
    id: '3d-lab',
    number: 1,
    icon: '🧊',
    shortLabel: '3D State-Space',
    mobileLabel: '3D Lab',
    label: '1. 3D State-Space & Estimation Studio',
  },
  {
    id: 'intuition',
    number: 2,
    icon: '📈',
    shortLabel: 'Phase & KF Lab',
    mobileLabel: 'Phase/KF',
    label: '2. Phase Plane, MPC & KF Lab + Quiz',
  },
  {
    id: 'solver',
    number: 3,
    icon: '🧮',
    shortLabel: 'Modern Solver',
    mobileLabel: 'Solver',
    label: '3. State-Space, LQR, MPC & SOTA Solver',
  },
  {
    id: 'word-problems',
    number: 4,
    icon: '⚙️',
    shortLabel: 'Word Problems',
    mobileLabel: 'Applied',
    label: '4. Applied Word Problems',
  },
];

const KINEMATICS_STAGES = [
  {
    id: '3d-lab',
    number: 1,
    icon: '🦾',
    shortLabel: '3D Kinematics',
    mobileLabel: '3D Arm',
    label: '1. 3D Robot Kinematics & Jacobian Lab',
  },
  {
    id: 'intuition',
    number: 2,
    icon: '📐',
    shortLabel: 'IK & Ellipsoid',
    mobileLabel: 'IK/Ellip',
    label: '2. Workspace, Ellipsoid & IK Quiz',
  },
  {
    id: 'solver',
    number: 3,
    icon: '🧮',
    shortLabel: 'Kinematics Solver',
    mobileLabel: 'Solver',
    label: '3. DH, PoE SE(3) & QP-IK Solver',
  },
  {
    id: 'word-problems',
    number: 4,
    icon: '⚙️',
    shortLabel: 'Word Problems',
    mobileLabel: 'Applied',
    label: '4. Applied Word Problems',
  },
];

const PLANNED_TOPIC_METADATA = {
  'Servo Velocity & Acceleration Profiling': {
    domain: 'Mechatronics',
    accent: 'amber',
    equation: 'v(t) = \\frac{dx}{dt}, \\quad a(t) = \\frac{d^2x}{dt^2}',
    summary:
      'Compute peak velocity, torque limits, and S-curve jerk constraints for a closed-loop robotic actuator.',
  },
  'Capacitor Current i(t) = C dv/dt': {
    domain: 'Electronics',
    accent: 'cyan',
    equation: 'i(t) = C\\,\\frac{dv(t)}{dt}',
    summary:
      'Relate voltage ramp rates across power-rail decoupling capacitors to transient surge current.',
  },
  'Thermal Cooling Rates & Optimization': {
    domain: 'Physics',
    accent: 'violet',
    equation: '\\frac{dT}{dt} = -k\\,(T - T_{\\text{amb}})',
    summary:
      'Model heatsink dissipation rates and optimize fin geometry for embedded compute modules.',
  },
  'Gradient Descent Loss Minimization': {
    domain: 'AI & ML',
    accent: 'emerald',
    equation: '\\theta_{k+1} = \\theta_k - \\eta\\,\\frac{d\\mathcal{L}}{d\\theta}',
    summary:
      'Use local derivative slopes to tune learning rates and converge cleanly across loss landscapes.',
  },
  'Actuator Displacement from Velocity Profiles': {
    domain: 'Mechatronics',
    accent: 'amber',
    equation: '\\Delta x = \\int_{t_0}^{t_1} v(t)\\,dt',
    summary:
      'Integrate trapezoidal and sinusoidal servo velocity commands to compute exact linear stroke displacement.',
  },
  'Work & Energy Along Variable Force Paths': {
    domain: 'Physics',
    accent: 'violet',
    equation: 'W = \\int_{x_0}^{x_1} F(x)\\,dx',
    summary:
      'Compute mechanical work stored in nonlinear springs, magnetic solenoids, and pneumatic actuators.',
  },
  'Capacitor Voltage from Current Pulses': {
    domain: 'Electronics',
    accent: 'cyan',
    equation: 'v(t) = v(0) + \\frac{1}{C}\\int_{0}^{t} i(\\tau)\\,d\\tau',
    summary:
      'Track accumulated charge and voltage ripple across DC bus capacitors under pulsed PWM loads.',
  },
  'Probability Mass & Expected Value in AI': {
    domain: 'AI & ML',
    accent: 'emerald',
    equation: '\\mathbb{E}[X] = \\int_{-\\infty}^{\\infty} x\\,p(x)\\,dx',
    summary:
      'Connect continuous area under probability density curves to Bayesian expectations and sensor fusion.',
  },
  'RLC Circuit Transient & Resonance Analysis': {
    domain: 'Electronics',
    accent: 'cyan',
    equation: 'L\\ddot{q} + R\\dot{q} + \\frac{1}{C}q = V(t)',
    summary:
      'Analyze damping ratios, quality factors, and Laplace impedance poles for switched power filters.',
  },
  'Closed-Loop DC Motor Speed Transfer Function': {
    domain: 'Mechatronics',
    accent: 'amber',
    equation: 'G(s) = \\frac{\\Omega(s)}{V(s)} = \\frac{K_t}{(Js+b)(Ls+R)+K_e K_t}',
    summary:
      'Map armature dynamics to s-plane poles to predict step settling time and zero steady-state error.',
  },
  'Quarter-Car Suspension Damping & Ride Stability': {
    domain: 'Physics',
    accent: 'violet',
    equation: 'm\\ddot{x} + c\\dot{x} + kx = F_{\\text{road}}(t)',
    summary:
      'Tune damper coefficient c to hit critical damping and eliminate chassis overshoot over road impulses.',
  },
  'Neural ODEs & Continuous-Depth Dynamics': {
    domain: 'AI & ML',
    accent: 'emerald',
    equation: '\\frac{d\\mathbf{h}(t)}{dt} = f_{\\theta}(\\mathbf{h}(t), t)',
    summary:
      'Interpret residual neural network layers as continuous differential flows solved with adaptive integrators.',
  },
  '2-Link Robot Arm Jacobian & Singularity Analysis': {
    domain: 'Robotics',
    accent: 'cyan',
    equation: '\\dot{\\mathbf{x}} = J(\\mathbf{q})\\dot{\\mathbf{q}}, \\quad \\det(J) = L_1 L_2 \\sin\\theta_2',
    summary:
      'Map joint velocities to end-effector motion and locate kinematic singularities where the Jacobian loses rank.',
  },
  'Rigid-Body Inertia Tensor & Principal Rotation Axes': {
    domain: 'Mechatronics',
    accent: 'amber',
    equation: '\\mathbf{I}\\boldsymbol{\\omega}_i = \\lambda_i\\boldsymbol{\\omega}_i, \\quad \\mathbf{I} = Q\\Lambda Q^T',
    summary:
      'Diagonalize symmetric 3×3 inertia tensors to discover wobble-free principal axes for aerospace and robotic payloads.',
  },
  'Kalman Filter Covariance Ellipse & Eigen-Propagation': {
    domain: 'Control & Estimation',
    accent: 'violet',
    equation: 'P_{k|k-1} = F P_{k-1} F^T + Q, \\quad \\sigma_i = \\sqrt{\\lambda_i(P)}',
    summary:
      'Track state uncertainty ellipsoids through linear dynamics using symmetric positive-definite covariance matrices.',
  },
  'PCA & Low-Rank SVD Compression in Neural Networks': {
    domain: 'AI & ML',
    accent: 'emerald',
    equation: 'W \\approx U_r \\Sigma_r V_r^T = \\sum_{i=1}^{r} \\sigma_i \\mathbf{u}_i \\mathbf{v}_i^T',
    summary:
      'Compress high-dimensional weight matrices and extract dominant variance directions via truncated Singular Value Decomposition.',
  },
  'Quadcopter Pitch & Attitude Cascade PID': {
    domain: 'Aerospace & Robotics',
    accent: 'cyan',
    equation: '\\tau_\\theta = K_{p,\\omega}\\big(K_{p,\\theta}(\\theta_{\\text{ref}}-\\theta) - \\dot{\\theta}\\big)',
    summary:
      'Nest an inner high-bandwidth gyro rate loop inside an outer attitude loop for crisp disturbance-resistant flight.',
  },
  'CNC Ball-Screw Feedforward & Anti-Windup': {
    domain: 'Precision Motion',
    accent: 'amber',
    equation: 'u = K_p e + K_i\\int e\\,dt + K_d\\dot{e} + K_{ff}\\ddot{r}, \\quad |u| \\le u_{\\max}',
    summary:
      'Combine acceleration feedforward with back-calculation anti-windup to eliminate tracking lag without integrator saturation.',
  },
  'Inverted Pendulum Stabilization & Lead Compensation': {
    domain: 'Unstable Control',
    accent: 'violet',
    equation: 'G(s) = \\frac{1}{s^2 - g/L}, \\quad C_{\\text{lead}}(s) = K\\frac{s+z}{s+p} \\;(z < p)',
    summary:
      'Stabilize an open-loop RHP pole by adding positive phase lead near crossover to achieve robust gain and phase margins.',
  },
  'Thermal Reflow Oven Smith Predictor with Delay': {
    domain: 'Process Control',
    accent: 'emerald',
    equation: 'G(s) = \\frac{K e^{-\\tau s}}{T s + 1}, \\quad \\tau_{\\max} = \\frac{\\text{PM}}{\\omega_{gc}}',
    summary:
      'Compensate for pure transport lag in heated zones so thermal profiles track reflow curves without phase-lag ringing.',
  },
  'Quarter-Car Active Suspension ODE to s-Plane': {
    domain: 'Automotive Dynamics',
    accent: 'cyan',
    equation: 'm_s\\ddot{z}_s + c_s(\\dot{z}_s - \\dot{z}_u) + k_s(z_s - z_u) = f_a',
    summary:
      'Derive coupled sprung/unsprung chassis dynamics, map ride-comfort poles on the s-plane, and shape active damping.',
  },
  'Voice-Coil Linear Actuator Coupled Electromechanical Model': {
    domain: 'Mechatronics',
    accent: 'amber',
    equation: 'L\\dot{i} + Ri + K_e\\dot{x} = v, \\quad m\\ddot{x} + c\\dot{x} + kx = K_f i',
    summary:
      'Couple Lorentz force and back-EMF into a single 3rd-order transfer function and isolate electrical vs mechanical poles.',
  },
  'Dual-Tank Hydraulic Level Transfer Function': {
    domain: 'Fluid Systems',
    accent: 'violet',
    equation: 'G(s) = \\frac{R_2}{(R_1 C_1 s + 1)(R_2 C_2 s + 1) + R_2 C_1 s}',
    summary:
      'Linearize interacting orifice flows around steady head to prove passive fluid cascades always yield overdamped real poles.',
  },
  'MEMS Accelerometer Proof-Mass Damping Design': {
    domain: 'MEMS & Sensors',
    accent: 'emerald',
    equation: '\\frac{X(s)}{A_{\\text{in}}(s)} = \\frac{1}{s^2 + 2\\zeta\\omega_n s + \\omega_n^2}, \\quad \\zeta \\approx 0.707',
    summary:
      'Size squeeze-film gas damping for a silicon proof mass to maximize flat accelerometer bandwidth without resonant ringing.',
  },
  'Hard-Disk Drive Dual-Stage Lead-Lag Servo': {
    domain: 'Precision Mechatronics',
    accent: 'cyan',
    equation: 'C(s) = K\\frac{1 + \\alpha T_1 s}{1 + T_1 s}\\cdot\\frac{1 + T_2 s}{1 + \\beta T_2 s}',
    summary:
      'Combine high-bandwidth phase lead with low-frequency lag boost to hold sub-nanometer read-head track following.',
  },
  'Flexible Robotic Link Notch Filter & Resonance Suppression': {
    domain: 'Robotics',
    accent: 'amber',
    equation: 'N(s) = \\frac{s^2 + 2\\zeta_z\\omega_r s + \\omega_r^2}{s^2 + 2\\zeta_p\\omega_r s + \\omega_r^2} \\;\\;(\\zeta_z \\ll \\zeta_p)',
    summary:
      'Cancel structural Bode resonant peaks M_r in lightweight robotic arms without sacrificing closed-loop phase margin.',
  },
  'Magnetic Levitation Nyquist Stabilization': {
    domain: 'Unstable Control',
    accent: 'violet',
    equation: 'G(s) = \\frac{-K_i}{m s^2 - K_x}, \\quad Z = N + P = 0 \\implies N = -1',
    summary:
      'Stabilize an open-loop RHP magnetic pole using Nyquist encirclement counts and phase-lead compensation.',
  },
  'Satellite Attitude Loop-Shaping Sensitivity Budget': {
    domain: 'Aerospace Control',
    accent: 'emerald',
    equation: 'S(s) + T(s) = 1, \\quad M_s = \\max_\\omega |S(j\\omega)| \\le 1.6',
    summary:
      'Shape open-loop gain L(jω) to reject solar-torque disturbances at low frequencies while rolling off star-tracker noise.',
  },
  'Quadruped Whole-Body MPC + InEKF Foot-Contact Estimation': {
    domain: 'Legged Robotics',
    accent: 'cyan',
    equation: '\\min_{u_{0:N-1}} \\sum \\|x_k\\|_Q^2 + \\|u_k\\|_R^2, \\quad X_k \\in SE_2(3)',
    summary:
      'Solve convex ground-reaction-force MPC under friction-cone constraints while fusing IMU and leg kinematics via an Invariant EKF.',
  },
  'Autonomous Drone CBF-QP Safety Filter + VIO Factor Graph': {
    domain: 'Aerial Autonomy',
    accent: 'emerald',
    equation: '\\dot{h}(x,u) + \\alpha h(x) \\ge 0, \\quad \\min_{x_{0:N}} \\sum \\rho(\\|r_i\\|_{\\Sigma_i^{-1}})',
    summary:
      'Enforce provable obstacle-avoidance forward invariance with a real-time CBF-QP filter backed by Huber-robust visual-inertial factor graphs.',
  },
  'Satellite Reaction-Wheel LQR + Star-Tracker Observer': {
    domain: 'Aerospace Control',
    accent: 'violet',
    equation: 'A^T P + PA - PBR^{-1}B^T P + Q = 0, \\quad \\dot{\\hat{x}} = A\\hat{x} + Bu + L(y - C\\hat{x})',
    summary:
      'Balance pointing precision against reaction-wheel torque via CARE LQR while reconstructing angular rates from sparse star-tracker fixes.',
  },
  'Autonomous Car Nonlinear MHE + UKF Sensor Fusion': {
    domain: 'Autonomous Vehicles',
    accent: 'amber',
    equation: '\\mathcal{X}_i = \\hat{x} \\pm \\sqrt{(n+\\lambda)P}, \\quad \\min_{x_{t-N:t}} J_{\\text{MHE}}',
    summary:
      'Reject LiDAR/GPS outlier spikes with moving-horizon estimation and propagate nonlinear bicycle-model uncertainty via sigma points.',
  },
};

const FALLBACK_CURRICULUM = {
  brand: 'EIGENLAB',
  tagline: 'Interactive 3D Engineering & Deep-Learning Studio',
  domains: [
    {
      id: 'math',
      title: 'Engineering Mathematics',
      subtitle: 'Calculus, differential systems, and linear geometry.',
      accent: '#22D3EE',
      symbol: '∂/∂x',
      lessons: [
        {
          id: 'calc-derivatives',
          status: 'live',
          title: 'Derivatives & Instantaneous Rate of Change',
          tag: 'Lesson 01 • 3D Interactive + Step Solver',
          description:
            'Collapse secant chords into tangent vectors on live 3D surfaces, map curves to slopes, and master 18 symbolic rules.',
          estimatedMinutes: 25,
        },
        {
          id: 'calc-integrals',
          status: 'live',
          title: 'Integrals, Accumulation & Flux',
          tag: 'Lesson 02 • 3D Riemann Lab + Step Solver',
          description:
            'Refine 3D Riemann glass slices into continuous area, visualize FTC accumulation, and master u-sub, trig, by parts, and partial fractions.',
          estimatedMinutes: 30,
        },
      ],
    },
    {
      id: 'mechatronics',
      title: 'Mechatronics & Control Systems',
      subtitle: 'Closed-loop feedback, robotics, and electromechanical dynamics.',
      accent: '#F59E0B',
      symbol: 'G(s)',
      lessons: [
        {
          id: 'mech-pid',
          status: 'planned',
          title: 'PID Control & Feedback Stability',
          tag: 'Control Lab • Coming Next',
        },
      ],
    },
    {
      id: 'physics',
      title: 'Theoretical Physics',
      subtitle: 'Variational mechanics, fields, and quantum wave phenomena.',
      accent: '#A78BFA',
      symbol: '∇×E',
      lessons: [
        {
          id: 'phys-lagrangian',
          status: 'planned',
          title: 'Lagrangian & Hamiltonian Mechanics',
          tag: 'Analytical Mechanics • Coming Next',
        },
      ],
    },
    {
      id: 'ai',
      title: 'AI & Machine Learning',
      subtitle: 'Optimization landscapes, automatic differentiation, and attention.',
      accent: '#34D399',
      symbol: '∇L(θ)',
      lessons: [
        {
          id: 'ai-backprop',
          status: 'planned',
          title: 'Multivariable Gradients & Backpropagation',
          tag: 'Optimization • Coming Next',
        },
      ],
    },
  ],
};

const FALLBACK_WORD_PROBLEMS = {
  lessonId: 'calc-derivatives',
  status: 'coming_soon',
  plannedTopics: [
    'Servo Velocity & Acceleration Profiling',
    'Capacitor Current i(t) = C dv/dt',
    'Thermal Cooling Rates & Optimization',
    'Gradient Descent Loss Minimization',
  ],
  problems: [],
};

const FALLBACK_INTEGRAL_WORD_PROBLEMS = {
  lessonId: 'calc-integrals',
  status: 'coming_soon',
  plannedTopics: [
    'Actuator Displacement from Velocity Profiles',
    'Work & Energy Along Variable Force Paths',
    'Capacitor Voltage from Current Pulses',
    'Probability Mass & Expected Value in AI',
  ],
  problems: [],
};

const FALLBACK_DIFFEQ_WORD_PROBLEMS = {
  lessonId: 'math-diff-eq',
  status: 'coming_soon',
  plannedTopics: [
    'RLC Circuit Transient & Resonance Analysis',
    'Closed-Loop DC Motor Speed Transfer Function',
    'Quarter-Car Suspension Damping & Ride Stability',
    'Neural ODEs & Continuous-Depth Dynamics',
  ],
  problems: [],
};

const FALLBACK_LINALG_WORD_PROBLEMS = {
  lessonId: 'math-lin-alg',
  status: 'coming_soon',
  plannedTopics: [
    '2-Link Robot Arm Jacobian & Singularity Analysis',
    'Rigid-Body Inertia Tensor & Principal Rotation Axes',
    'Kalman Filter Covariance Ellipse & Eigen-Propagation',
    'PCA & Low-Rank SVD Compression in Neural Networks',
  ],
  problems: [],
};

const FALLBACK_PID_WORD_PROBLEMS = {
  lessonId: 'mech-pid',
  status: 'coming_soon',
  plannedTopics: [
    'Quadcopter Pitch & Attitude Cascade PID',
    'CNC Ball-Screw Feedforward & Anti-Windup',
    'Inverted Pendulum Stabilization & Lead Compensation',
    'Thermal Reflow Oven Smith Predictor with Delay',
  ],
  problems: [],
};

const FALLBACK_MODELING_WORD_PROBLEMS = {
  lessonId: 'mech-modeling',
  status: 'coming_soon',
  plannedTopics: [
    'Quarter-Car Active Suspension ODE to s-Plane',
    'Voice-Coil Linear Actuator Coupled Electromechanical Model',
    'Dual-Tank Hydraulic Level Transfer Function',
    'MEMS Accelerometer Proof-Mass Damping Design',
  ],
  problems: [],
};

const FALLBACK_FREQ_WORD_PROBLEMS = {
  lessonId: 'mech-root-bode',
  status: 'coming_soon',
  plannedTopics: [
    'Hard-Disk Drive Dual-Stage Lead-Lag Servo',
    'Flexible Robotic Link Notch Filter & Resonance Suppression',
    'Magnetic Levitation Nyquist Stabilization',
    'Satellite Attitude Loop-Shaping Sensitivity Budget',
  ],
  problems: [],
};

const FALLBACK_STATESPACE_WORD_PROBLEMS = {
  lessonId: 'mech-state-space',
  status: 'coming_soon',
  plannedTopics: [
    'Quadruped Whole-Body MPC + InEKF Foot-Contact Estimation',
    'Autonomous Drone CBF-QP Safety Filter + VIO Factor Graph',
    'Satellite Reaction-Wheel LQR + Star-Tracker Observer',
    'Autonomous Car Nonlinear MHE + UKF Sensor Fusion',
  ],
  problems: [],
};

const FALLBACK_KINEMATICS_WORD_PROBLEMS = {
  lessonId: 'mech-kinematics',
  status: 'coming_soon',
  plannedTopics: [
    '7-DOF Franka Panda Redundant Nullspace & Collision Avoidance',
    'UR5e 6-DOF Analytical Pieper IK & Wrist Singularity Detour',
    'SCARA High-Speed PCB Pick-and-Place Trajectory',
    'Humanoid Whole-Body QP-IK (Pink/Mink) Dual-Arm Manipulation',
  ],
  problems: [],
};

// ---------------------------------------------------------------------------
// Application Runtime State
// ---------------------------------------------------------------------------

const appState = {
  view: 'hub', // 'hub' | 'lesson' | 'frontier-lab'
  hubViewMode: 'skill-graph', // 'skill-graph' | 'review-vault'
  activeFrontierLabId: null,
  lessonId: LESSON_ID,
  stage: '3d-lab', // '3d-lab' | 'intuition' | 'solver' | 'word-problems'
  curriculum: FALLBACK_CURRICULUM,
  wordProblems: FALLBACK_WORD_PROBLEMS,
  wordProblemsByLesson: {
    'calc-derivatives': FALLBACK_WORD_PROBLEMS,
    'calc-integrals': FALLBACK_INTEGRAL_WORD_PROBLEMS,
    'math-diff-eq': FALLBACK_DIFFEQ_WORD_PROBLEMS,
    'math-lin-alg': FALLBACK_LINALG_WORD_PROBLEMS,
    'mech-modeling': FALLBACK_MODELING_WORD_PROBLEMS,
    'mech-pid': FALLBACK_PID_WORD_PROBLEMS,
    'mech-root-bode': FALLBACK_FREQ_WORD_PROBLEMS,
    'mech-state-space': FALLBACK_STATESPACE_WORD_PROBLEMS,
    'mech-kinematics': FALLBACK_KINEMATICS_WORD_PROBLEMS,
  },
  lab: {
    presetId: null,
    x0: 0.6,
    dx: 1.15,
    cameraPreset: '3d',
    showDerivativeCurve: true,
    isAnimating: false,
  },
  telemetry: {
    x0: 0.6,
    dx: 1.15,
    fx0: 0,
    fx1: 0,
    secantSlope: 0,
    exactSlope: 0,
    tangentLocked: false,
  },
  integralLab: {
    presetId: 'parabola',
    a: -1.5,
    b: 2.0,
    n: 12,
    rule: 'midpoint', // 'left' | 'midpoint' | 'right'
    cameraPreset: '3d',
    showAccumulation: true,
    isAnimating: false,
  },
  integralTelemetry: {
    a: -1.5,
    b: 2.0,
    n: 12,
    rule: 'midpoint',
    riemannSum: 0,
    exactIntegral: 0,
    error: 0,
    positiveArea: 0,
    negativeArea: 0,
    fb: 0,
    isExactLocked: false,
  },
  diffeqLab: {
    presetId: 'underdamped',
    zeta: 0.25,
    omega: 2.6,
    t: 1.4,
    cameraPreset: '3d',
    showPhaseWall: true,
    isAnimating: false,
  },
  diffeqTelemetry: {
    order: 2,
    zeta: 0.25,
    omega: 2.6,
    t: 1.4,
    yt: 0,
    dydt: 0,
    regime: 'UNDERDAMPED',
    overshootPct: 44.4,
    settlingTime: 6.15,
    polesLatex: 's = -0.65 \\pm 2.52j',
    poles: [],
    transferLatex: '',
    odeLatex: '',
  },
  linalgLab: {
    presetId: 'eigen-stretch',
    morph: 1.0,
    param: 0.8,
    cameraPreset: '3d',
    showEigen: true,
    isAnimating: false,
  },
  linalgTelemetry: {
    presetId: 'eigen-stretch',
    label: 'Symmetric Stretch',
    mechatronicsLabel: 'Principal Inertia Tensor',
    morph: 1.0,
    param: 0.8,
    paramLabel: 'Coupling Off-Diag k',
    paramMin: -1.2,
    paramMax: 1.4,
    paramStep: 0.05,
    paramUnit: '',
    det: 1.976,
    trace: 4.3,
    rank: 3,
    isSingular: false,
    orientation: 'Preserved',
    eigenvalues: [],
    realEigenvectors: [],
    matrixLatex: '',
    eigenLatex: '',
    showEigen: true,
    mechatronicsLens: false,
  },
  pidLab: {
    presetId: 'dc-servo',
    kp: 4.0,
    ki: 0.8,
    kd: 1.2,
    disturbance: false,
    showEffort: true,
    cameraPreset: '3d',
    isAnimating: false,
  },
  pidTelemetry: {
    presetId: 'dc-servo',
    label: 'DC Servo Position',
    mechatronicsLabel: 'DC Servo Motor Loop',
    kp: 4.0,
    ki: 0.8,
    kd: 1.2,
    disturbance: false,
    showEffort: true,
    t: 8.0,
    yt: 1.0,
    ut: 0.0,
    overshootPct: 10.0,
    settlingTime: 3.2,
    riseTime: 0.65,
    steadyStateError: 0.004,
    stability: 'STABLE',
    controllerLatex: 'C(s) = 4.0 + \\frac{0.8}{s} + 1.2s',
    plantLatex: 'G(s) = \\frac{1}{s(0.4s + 1)}',
  },
  modelingLab: {
    presetId: 'msd-underdamped',
    m: 1.0,
    c: 1.2,
    k: 9.0,
    kp: 0.0,
    showSPlane: true,
    cameraPreset: '3d',
    isAnimating: false,
  },
  modelingTelemetry: {
    presetId: 'msd-underdamped',
    label: 'Mass-Spring-Damper',
    domain: 'mechanical',
    paramLabels: { m: 'Mass m (kg)', c: 'Damper c (N·s/m)', k: 'Spring k (N/m)' },
    m: 1.0,
    c: 1.2,
    k: 9.0,
    kp: 0.0,
    wn: 3.0,
    zeta: 0.2,
    sigma: 0.6,
    wd: 2.94,
    regime: 'UNDERDAMPED',
    poles: [],
    overshootPct: 52.7,
    settlingTime: 6.52,
    odeLatex: '',
    tfLatex: '',
    polesLatex: '',
    showSPlane: true,
  },
  freqLab: {
    presetId: 'rl-3pole',
    k: 8.0,
    param: 2.0,
    showLocus: true,
    cameraPreset: '3d',
    isAnimating: false,
  },
  freqTelemetry: {
    presetId: 'rl-3pole',
    label: '3-Pole Cubic Locus',
    mechatronicsLabel: '3-Stage Hydraulic Loop',
    k: 8.0,
    kMax: 36,
    param: 2.0,
    paramLabel: '3rd Pole p₃',
    paramMin: 1.5,
    paramMax: 5.0,
    paramStep: 0.1,
    showLocus: true,
    closedLoopPoles: [],
    gainCrossover: 1.6,
    phaseMarginDeg: -8.0,
    gainMarginDb: -2.5,
    resonantPeakDb: 0,
    stability: 'UNSTABLE',
    olLatex: '',
    clPolesLatex: '',
  },
  statespaceLab: {
    presetId: 'lqr-cart',
    paramA: STATESPACE_PRESETS['lqr-cart'].paramA.default,
    paramB: STATESPACE_PRESETS['lqr-cart'].paramB.default,
    cameraPreset: '3d',
  },
  statespaceTelemetry: analyzeStateSpaceSystem({
    presetId: 'lqr-cart',
    paramA: STATESPACE_PRESETS['lqr-cart'].paramA.default,
    paramB: STATESPACE_PRESETS['lqr-cart'].paramB.default,
  }),
  kinematicsLab: {
    presetId: 'planar-2r',
    paramA: KINEMATICS_PRESETS['planar-2r'].paramA.default,
    paramB: KINEMATICS_PRESETS['planar-2r'].paramB.default,
    cameraPreset: '3d',
  },
  kinematicsTelemetry: analyzeKinematicsSystem({
    presetId: 'planar-2r',
    paramA: KINEMATICS_PRESETS['planar-2r'].paramA.default,
    paramB: KINEMATICS_PRESETS['planar-2r'].paramB.default,
  }),
};

const activeInstances = {
  ambientHero: null,
  studio3D: null,
  stackedLab: null,
  quizEngine: null,
  stepSolver: null,
  skillGraph: null,
  frontierShell: null,
  cleanupFns: [],
};

function isIntegralLesson() {
  return appState.lessonId === INTEGRAL_LESSON_ID;
}

function isDiffEqLesson() {
  return appState.lessonId === DIFFEQ_LESSON_ID;
}

function isLinAlgLesson() {
  return appState.lessonId === LINALG_LESSON_ID;
}

function isModelingLesson() {
  return appState.lessonId === MODELING_LESSON_ID;
}

function isPidLesson() {
  return appState.lessonId === PID_LESSON_ID;
}

function isFreqLesson() {
  return appState.lessonId === FREQ_LESSON_ID;
}

function isStateSpaceLesson() {
  return appState.lessonId === STATESPACE_LESSON_ID;
}

function isKinematicsLesson() {
  return appState.lessonId === KINEMATICS_LESSON_ID;
}

function getLessonStages() {
  if (isIntegralLesson()) return INTEGRAL_STAGES;
  if (isDiffEqLesson()) return DIFFEQ_STAGES;
  if (isLinAlgLesson()) return LINALG_STAGES;
  if (isModelingLesson()) return MODELING_STAGES;
  if (isPidLesson()) return PID_STAGES;
  if (isFreqLesson()) return FREQ_STAGES;
  if (isStateSpaceLesson()) return STATESPACE_STAGES;
  if (isKinematicsLesson()) return KINEMATICS_STAGES;
  return STAGES;
}

function stageStoreKey(stageId) {
  if (isIntegralLesson()) return `int:${stageId}`;
  if (isDiffEqLesson()) return `de:${stageId}`;
  if (isLinAlgLesson()) return `la:${stageId}`;
  if (isModelingLesson()) return `mod:${stageId}`;
  if (isPidLesson()) return `pid:${stageId}`;
  if (isFreqLesson()) return `freq:${stageId}`;
  if (isStateSpaceLesson()) return `ss:${stageId}`;
  if (isKinematicsLesson()) return `kin:${stageId}`;
  return stageId;
}

// ---------------------------------------------------------------------------
// Store & Peer Interop Helpers
// ---------------------------------------------------------------------------

function normalizePresets() {
  if (!FUNCTION_PRESETS) return [];
  const list = Array.isArray(FUNCTION_PRESETS)
    ? FUNCTION_PRESETS
    : Object.entries(FUNCTION_PRESETS).map(([id, v]) => ({ id, ...v }));

  return list.map((p, idx) => ({
    id: p.id ?? p.key ?? `preset-${idx}`,
    name: p.name ?? p.label ?? p.title ?? `Preset ${idx + 1}`,
    mechatronicsLabel: p.mechatronicsLabel ?? null,
    latex: p.latex ?? p.formulaLatex ?? p.equation ?? 'f(x)',
    derivLatex: p.derivLatex ?? p.derivativeLatex ?? p.dfLatex ?? "f'(x)",
    mechLatex: p.mechLatex ?? p.mechatronicsLatex ?? null,
    mechDerivLatex: p.mechDerivLatex ?? p.mechatronicsDerivLatex ?? null,
    f: p.f ?? p.fn ?? p.eval ?? ((x) => x * x),
    df: p.df ?? p.dfn ?? p.deriv ?? ((x) => 2 * x),
    xMin: p.xMin ?? p.domain?.[0] ?? -3.0,
    xMax: p.xMax ?? p.domain?.[1] ?? 3.0,
    defaultX: p.defaultX ?? p.initialX ?? 0.6,
    raw: p,
  }));
}

function normalizeIntegralPresets() {
  if (!INTEGRAL_PRESETS) return [];
  const list = Array.isArray(INTEGRAL_PRESETS)
    ? INTEGRAL_PRESETS
    : Object.entries(INTEGRAL_PRESETS).map(([id, v]) => ({ id, ...v }));

  return list.map((p, idx) => ({
    id: p.id ?? p.key ?? `int-preset-${idx}`,
    name: p.name ?? p.label ?? `Preset ${idx + 1}`,
    mechatronicsLabel: p.mechatronicsLabel ?? null,
    latex: p.latex ?? 'f(x)',
    integralLatex: p.integralLatex ?? 'F(x)',
    fn: p.fn ?? ((x) => x),
    antideriv: p.antideriv ?? ((x) => 0.5 * x * x),
    xMin: p.domain?.[0] ?? -2.8,
    xMax: p.domain?.[1] ?? 2.8,
    defaultA: p.defaultA ?? (p.domain?.[0] ?? -1.5),
    defaultB: p.defaultB ?? (p.domain?.[1] ?? 2.0),
    raw: p,
  }));
}

function normalizeDiffEqPresets() {
  if (!DIFFEQ_PRESETS) return [];
  const list = Array.isArray(DIFFEQ_PRESETS)
    ? DIFFEQ_PRESETS
    : Object.entries(DIFFEQ_PRESETS).map(([id, v]) => ({ id, ...v }));

  return list.map((p, idx) => ({
    id: p.id ?? p.key ?? `de-preset-${idx}`,
    name: p.name ?? p.label ?? `System ${idx + 1}`,
    mechatronicsLabel: p.mechatronicsLabel ?? null,
    order: p.order ?? 2,
    defaultZeta: p.defaultZeta ?? 0.25,
    defaultOmega: p.defaultOmega ?? 2.5,
    odeLatex: p.odeLatex ?? '',
    transferLatex: p.transferLatex ?? '',
    raw: p,
  }));
}

function normalizeLinAlgPresets() {
  if (!LINALG_PRESETS) return [];
  const list = Array.isArray(LINALG_PRESETS)
    ? LINALG_PRESETS
    : Object.entries(LINALG_PRESETS).map(([id, v]) => ({ id, ...v }));

  return list.map((p, idx) => ({
    id: p.id ?? p.key ?? `la-preset-${idx}`,
    name: p.label ?? p.name ?? `Transform ${idx + 1}`,
    mechatronicsLabel: p.mechatronicsLabel ?? null,
    defaultParam: p.defaultParam ?? 0.8,
    paramLabel: p.paramLabel ?? 'Parameter k',
    paramMin: p.paramMin ?? -2.0,
    paramMax: p.paramMax ?? 2.0,
    paramStep: p.paramStep ?? 0.05,
    paramUnit: p.paramUnit ?? '',
    raw: p,
  }));
}

function getActiveLinAlgPreset(presets) {
  if (!presets.length) return null;
  if (!appState.linalgLab.presetId) {
    appState.linalgLab.presetId = presets[0].id;
  }
  return presets.find((p) => p.id === appState.linalgLab.presetId) || presets[0];
}

function normalizePidPresets() {
  if (!PID_PRESETS) return [];
  const list = Array.isArray(PID_PRESETS)
    ? PID_PRESETS
    : Object.entries(PID_PRESETS).map(([id, v]) => ({ id, ...v }));

  return list.map((p, idx) => ({
    id: p.id ?? p.key ?? `pid-preset-${idx}`,
    name: p.label ?? p.name ?? `Plant ${idx + 1}`,
    mechatronicsLabel: p.mechatronicsLabel ?? null,
    defaultKp: p.defaultKp ?? 4.0,
    defaultKi: p.defaultKi ?? 0.8,
    defaultKd: p.defaultKd ?? 1.2,
    defaultDisturbance: Boolean(p.defaultDisturbance),
    plantLatex: p.plantLatex ?? '',
    raw: p,
  }));
}

function getActivePidPreset(presets) {
  if (!presets.length) return null;
  if (!appState.pidLab.presetId) {
    appState.pidLab.presetId = presets[0].id;
  }
  return presets.find((p) => p.id === appState.pidLab.presetId) || presets[0];
}

function normalizeModelingPresets() {
  if (!MODELING_PRESETS) return [];
  const list = Array.isArray(MODELING_PRESETS)
    ? MODELING_PRESETS
    : Object.entries(MODELING_PRESETS).map(([id, v]) => ({ id, ...v }));

  return list.map((p, idx) => ({
    id: p.id ?? p.key ?? `mod-preset-${idx}`,
    name: p.label ?? p.name ?? `System ${idx + 1}`,
    domain: p.domain ?? 'mechanical',
    defaults: p.defaults ?? { m: 1.0, c: 1.2, k: 9.0, kp: 0.0 },
    paramLabels: p.paramLabels ?? {
      m: 'Mass m (kg)',
      c: 'Damper c (N·s/m)',
      k: 'Spring k (N/m)',
    },
    raw: p,
  }));
}

function getActiveModelingPreset(presets) {
  if (!presets.length) return null;
  if (!appState.modelingLab.presetId) {
    appState.modelingLab.presetId = presets[0].id;
  }
  return presets.find((p) => p.id === appState.modelingLab.presetId) || presets[0];
}

function normalizeFreqPresets() {
  if (!FREQ_PRESETS) return [];
  const list = Array.isArray(FREQ_PRESETS)
    ? FREQ_PRESETS
    : Object.entries(FREQ_PRESETS).map(([id, v]) => ({ id, ...v }));

  return list.map((p, idx) => ({
    id: p.id ?? p.key ?? `freq-preset-${idx}`,
    name: p.label ?? p.name ?? `Loop ${idx + 1}`,
    mechatronicsLabel: p.mechatronicsLabel ?? null,
    defaultK: p.defaultK ?? 4.0,
    kMax: p.kMax ?? 20,
    defaultParam: p.defaultParam ?? 2.0,
    paramLabel: p.paramLabel ?? 'Parameter',
    paramMin: p.paramMin ?? 0.5,
    paramMax: p.paramMax ?? 4.0,
    paramStep: p.paramStep ?? 0.1,
    raw: p,
  }));
}

function getActiveFreqPreset(presets) {
  if (!presets.length) return null;
  if (!appState.freqLab.presetId) {
    appState.freqLab.presetId = presets[0].id;
  }
  return presets.find((p) => p.id === appState.freqLab.presetId) || presets[0];
}

function normalizeStateSpacePresets() {
  if (!STATESPACE_PRESETS) return [];
  const list = Array.isArray(STATESPACE_PRESETS)
    ? STATESPACE_PRESETS
    : Object.entries(STATESPACE_PRESETS).map(([id, v]) => ({ id, ...v }));

  return list.map((p, idx) => ({
    id: p.id ?? p.key ?? `ss-preset-${idx}`,
    name: p.name ?? p.label ?? `Mode ${idx + 1}`,
    shortName: p.shortName ?? p.name ?? `M${idx + 1}`,
    formulaLatex: p.formulaLatex ?? '\\dot{x} = Ax + Bu',
    paramALabel: p.paramALabel ?? 'Parameter A',
    paramA: p.paramA ?? { min: 0, max: 10, step: 0.1, default: 1 },
    paramBLabel: p.paramBLabel ?? 'Parameter B',
    paramB: p.paramB ?? { min: 0, max: 10, step: 0.1, default: 1 },
    raw: p,
  }));
}

function getActiveStateSpacePreset(presets) {
  if (!presets.length) return null;
  if (!appState.statespaceLab.presetId) {
    appState.statespaceLab.presetId = presets[0].id;
  }
  return presets.find((p) => p.id === appState.statespaceLab.presetId) || presets[0];
}

function formatStateSpaceParam(val, step = 0.1) {
  if (typeof val !== 'number' || !Number.isFinite(val)) return '0';
  if (step >= 1) return String(Math.round(val));
  if (step >= 0.1) return formatNum(val, 1);
  return formatNum(val, 2);
}

function normalizeKinematicsPresets() {
  if (!KINEMATICS_PRESETS) return [];
  const list = Array.isArray(KINEMATICS_PRESETS)
    ? KINEMATICS_PRESETS
    : Object.entries(KINEMATICS_PRESETS).map(([id, v]) => ({ id, ...v }));

  return list.map((p, idx) => ({
    id: p.id ?? p.key ?? `kin-preset-${idx}`,
    name: p.name ?? p.label ?? `Arm ${idx + 1}`,
    shortName: p.shortName ?? p.name ?? `K${idx + 1}`,
    formulaLatex: p.formulaLatex ?? 'T(\\theta) \\in SE(3)',
    paramALabel: p.paramALabel ?? 'Parameter A',
    paramA: p.paramA ?? { min: -90, max: 90, step: 1, default: 30 },
    paramBLabel: p.paramBLabel ?? 'Parameter B',
    paramB: p.paramB ?? { min: -90, max: 90, step: 1, default: 45 },
    raw: p,
  }));
}

function getActiveKinematicsPreset(presets) {
  if (!presets.length) return null;
  if (!appState.kinematicsLab.presetId) {
    appState.kinematicsLab.presetId = presets[0].id;
  }
  return presets.find((p) => p.id === appState.kinematicsLab.presetId) || presets[0];
}

function formatKinematicsParam(val, step = 0.1) {
  if (typeof val !== 'number' || !Number.isFinite(val)) return '0';
  if (step >= 1) return String(Math.round(val));
  if (step >= 0.1) return formatNum(val, 1);
  return formatNum(val, 2);
}

function getActiveDiffEqPreset(presets) {
  if (!presets.length) return null;
  if (!appState.diffeqLab.presetId) {
    appState.diffeqLab.presetId = presets[0].id;
  }
  return presets.find((p) => p.id === appState.diffeqLab.presetId) || presets[0];
}

function getActiveIntegralPreset(presets) {
  if (!presets.length) return null;
  if (!appState.integralLab.presetId) {
    appState.integralLab.presetId = presets[0].id;
  }
  return presets.find((p) => p.id === appState.integralLab.presetId) || presets[0];
}

function getActivePreset(presets) {
  if (!presets.length) return null;
  if (!appState.lab.presetId) {
    appState.lab.presetId = presets[0].id;
  }
  return presets.find((p) => p.id === appState.lab.presetId) || presets[0];
}

function getStoreState() {
  return typeof store?.getState === 'function'
    ? store.getState()
    : {
        completedStages: [],
        solvedProblems: [],
        solvedQuizzes: [],
        accuracyStreak: 0,
        activeLens: 'math',
        muted: false,
      };
}

function isMechatronicsLens() {
  return getStoreState().activeLens === 'mechatronics';
}

function isSoundMuted() {
  return Boolean(getStoreState().muted);
}

function playSfx(kind = 'tick') {
  if (!sound || isSoundMuted()) return;
  try {
    if (kind === 'tick') sound.playTick?.();
    else if (kind === 'snap') sound.playSnap?.();
    else if (kind === 'success') sound.playSuccess?.();
    else if (kind === 'error') sound.playGentleError?.();
  } catch {
    // Never interrupt interaction on Web Audio errors
  }
}

function getMasterySnapshot() {
  const s = getStoreState();
  const stats =
    typeof store?.getMasteryStats === 'function' ? store.getMasteryStats() : {};

  const solvedProblems =
    stats.solvedProblemsCount ??
    (Array.isArray(s.solvedProblems) ? s.solvedProblems.length : 0);
  const solvedVisual =
    stats.solvedQuizzesCount ??
    (Array.isArray(s.solvedQuizzes) ? s.solvedQuizzes.length : 0);
  const streak = stats.streak ?? s.accuracyStreak ?? 0;
  const completedStages = Array.isArray(s.completedStages) ? s.completedStages : [];
  const percent = Math.max(
    0,
    Math.min(100, Math.round(stats.overallPct ?? 0))
  );

  return {
    percent,
    solvedProblems,
    totalProblems: 106,
    solvedVisual,
    totalVisual: 50,
    totalStages: 32,
    streak,
    accuracyPct: stats.accuracyPct ?? 100,
    completedStages,
  };
}

function isStageDone(stageId) {
  return getStoreState().completedStages.includes(stageStoreKey(stageId));
}

function markStageDone(stageId) {
  if (!stageId || isStageDone(stageId)) return;
  store?.markStageComplete?.(stageStoreKey(stageId));
  updateLessonStageDotsUI();
}

function typesetMath(el, tex, displayMode = false) {
  if (!el) return;
  if (typeof renderKatex === 'function') {
    renderKatex(el, tex, displayMode);
  } else if (window.katex?.render) {
    window.katex.render(String(tex ?? ''), el, {
      displayMode: Boolean(displayMode),
      throwOnError: false,
      strict: false,
    });
  } else {
    el.textContent = String(tex ?? '');
  }
}

function syncSliderTrackFill(inputEl) {
  if (!inputEl) return;
  const min = parseFloat(inputEl.min || '0');
  const max = parseFloat(inputEl.max || '100');
  const val = parseFloat(inputEl.value || '0');
  const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
  inputEl.style.setProperty('--slider-pct', `${Math.max(0, Math.min(100, pct)).toFixed(2)}%`);
}

function formatNum(n, digits = 3) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '0.000';
  const cleaned = Math.abs(n) < 1e-9 ? 0 : n;
  return cleaned.toFixed(digits);
}

function formatSigned(n, digits = 2) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '0.00';
  const cleaned = Math.abs(n) < 1e-9 ? 0 : n;
  return `${cleaned >= 0 ? '+' : ''}${cleaned.toFixed(digits)}`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toMechatronicsFormula(tex, isDerivative = false) {
  if (!tex) return isDerivative ? 'v(t) = \\dot{x}(t)' : 'x(t)';
  return String(tex)
    .replace(/(?<![a-zA-Z\\])x(?![a-zA-Z])/g, 't')
    .replace(/f'\(t\)/g, 'v(t)')
    .replace(/f\(t\)/g, 'x(t)');
}

function resolveAccentKey(accentOrDomainId) {
  const val = String(accentOrDomainId ?? '').toLowerCase();
  if (val === 'amber' || val === 'mechatronics' || val === '#f59e0b') return 'amber';
  if (val === 'violet' || val === 'physics' || val === '#a78bfa') return 'violet';
  if (val === 'emerald' || val === 'ai' || val === '#34d399') return 'emerald';
  return 'cyan';
}

function getAccentClasses(accentOrDomainId) {
  const key = resolveAccentKey(accentOrDomainId);
  switch (key) {
    case 'amber':
      return {
        border: 'hover:border-amberGlow/45',
        badge: 'bg-amberGlow/15 text-amberGlow border-amberGlow/30',
        iconBg: 'bg-amberGlow/15 text-amberGlow border-amberGlow/30',
        glow: 'from-amberGlow/15 via-transparent to-transparent',
      };
    case 'violet':
      return {
        border: 'hover:border-violetGlow/45',
        badge: 'bg-violetGlow/15 text-violetGlow border-violetGlow/30',
        iconBg: 'bg-violetGlow/15 text-violetGlow border-violetGlow/30',
        glow: 'from-violetGlow/15 via-transparent to-transparent',
      };
    case 'emerald':
      return {
        border: 'hover:border-emeraldGlow/45',
        badge: 'bg-emeraldGlow/15 text-emeraldGlow border-emeraldGlow/30',
        iconBg: 'bg-emeraldGlow/15 text-emeraldGlow border-emeraldGlow/30',
        glow: 'from-emeraldGlow/15 via-transparent to-transparent',
      };
    case 'cyan':
    default:
      return {
        border: 'hover:border-cyanGlow/45',
        badge: 'bg-cyanGlow/15 text-cyanGlow border-cyanGlow/30',
        iconBg: 'bg-cyanGlow/15 text-cyanGlow border-cyanGlow/30',
        glow: 'from-cyanGlow/15 via-transparent to-transparent',
      };
  }
}

// ---------------------------------------------------------------------------
// Lifecycle Disposal — Zero Leaked WebGL Contexts or Event Listeners
// ---------------------------------------------------------------------------

function safeDispose(instance) {
  if (!instance) return;
  try {
    if (typeof instance === 'function') {
      instance();
    } else if (typeof instance.dispose === 'function') {
      instance.dispose();
    } else if (typeof instance.destroy === 'function') {
      instance.destroy();
    }
  } catch (err) {
    console.warn('[EIGENLAB] Disposal warning:', err);
  }
}

function disposeActiveWidgets() {
  safeDispose(activeInstances.ambientHero);
  safeDispose(activeInstances.studio3D);
  safeDispose(activeInstances.stackedLab);
  safeDispose(activeInstances.quizEngine);
  safeDispose(activeInstances.stepSolver);
  safeDispose(activeInstances.skillGraph);
  safeDispose(activeInstances.frontierShell);

  activeInstances.ambientHero = null;
  activeInstances.studio3D = null;
  activeInstances.stackedLab = null;
  activeInstances.quizEngine = null;
  activeInstances.stepSolver = null;
  activeInstances.skillGraph = null;
  activeInstances.frontierShell = null;

  while (activeInstances.cleanupFns.length) {
    const fn = activeInstances.cleanupFns.pop();
    try {
      fn?.();
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ---------------------------------------------------------------------------
// Shared Header Controls (Brand Mark, Lens Switch, Audio Toggle)
// ---------------------------------------------------------------------------

function renderBrandLogo() {
  return `
    <div class="flex items-center gap-3 select-none">
      <div class="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyanGlow/20 via-slate-900 to-violetGlow/20 border border-white/15 flex items-center justify-center shadow-[0_0_24px_rgba(34,211,238,0.18)]">
        <svg viewBox="0 0 36 36" class="w-5 h-5" fill="none" aria-hidden="true">
          <path d="M9 10H26M9 18H21M9 26H26M9 10V26" stroke="#22D3EE" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="26.5" cy="18" r="2.75" fill="#F59E0B"/>
        </svg>
      </div>
      <div class="leading-tight">
        <div class="flex items-center gap-2">
          <span class="font-display font-bold tracking-[0.12em] text-base text-white">EIGENLAB</span>
          <span class="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyanGlow/10 text-cyanGlow border border-cyanGlow/25">Studio</span>
        </div>
        <div class="text-[11px] text-slate-400 hidden sm:block">Interactive 3D Engineering Studio</div>
      </div>
    </div>
  `;
}

function renderLensToggleButton(id = 'btn-lens-toggle') {
  const on = isMechatronicsLens();
  return `
    <button
      id="${id}"
      type="button"
      role="switch"
      aria-checked="${on ? 'true' : 'false'}"
      class="group inline-flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border text-[11px] sm:text-xs font-medium transition-all duration-200 cursor-pointer ${
        on
          ? 'bg-amberGlow/15 border-amberGlow/50 text-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.22)]'
          : 'bg-white/[0.04] border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
      }"
      title="Toggle Mechatronics Lens: switch between pure calculus f(x) and servo kinematics x(t), v(t)"
    >
      <span class="text-xs sm:text-sm leading-none" aria-hidden="true">⚙️</span>
      <span class="hidden md:inline">Mechatronics Lens:</span>
      <span class="md:hidden">Mech</span>
      <span class="font-mono font-semibold tracking-wider ${on ? 'text-amberGlow' : 'text-slate-400'}">${
        on ? 'ON' : 'OFF'
      }</span>
      <span class="hidden sm:inline-flex relative w-8 h-4 rounded-full transition-colors duration-200 ${
        on ? 'bg-amberGlow/45' : 'bg-slate-700/80'
      }">
        <span class="inline-block w-3 h-3 rounded-full shadow transition-transform duration-200 mt-0.5 ${
          on ? 'bg-amber-300' : 'bg-slate-300'
        }" style="transform: translateX(${on ? '17px' : '2px'})"></span>
      </span>
    </button>
  `;
}

function renderAudioButton(id = 'btn-audio-toggle') {
  const muted = isSoundMuted();
  return `
    <button
      id="${id}"
      type="button"
      aria-label="${muted ? 'Unmute studio audio' : 'Mute studio audio'}"
      aria-pressed="${muted ? 'true' : 'false'}"
      class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border transition-all duration-200 cursor-pointer ${
        muted
          ? 'bg-white/[0.03] border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
          : 'bg-white/[0.05] border-white/15 text-slate-200 hover:border-cyanGlow/40 hover:text-cyanGlow'
      }"
      title="${muted ? 'Sound muted (click to enable)' : 'Studio audio active (click to mute)'}"
    >
      <span class="text-sm leading-none">${muted ? '🔇' : '🔊'}</span>
    </button>
  `;
}

// ---------------------------------------------------------------------------
// VIEW 1 — EIGENLAB Discipline Hub (Home Dashboard)
// ---------------------------------------------------------------------------

function renderMasteryRingSVG(percent) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return `
    <div class="relative w-24 h-24 shrink-0 flex items-center justify-center">
      <svg class="w-24 h-24 -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
        <defs>
          <linearGradient id="eigenMasteryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#22D3EE" />
            <stop offset="55%" stop-color="#A78BFA" />
            <stop offset="100%" stop-color="#34D399" />
          </linearGradient>
        </defs>
        <circle
          cx="48" cy="48" r="${radius}"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          stroke-width="7"
        />
        <circle
          cx="48" cy="48" r="${radius}"
          fill="none"
          stroke="url(#eigenMasteryGrad)"
          stroke-width="7"
          stroke-linecap="round"
          stroke-dasharray="${circumference.toFixed(2)}"
          stroke-dashoffset="${offset.toFixed(2)}"
          style="transition: stroke-dashoffset 600ms cubic-bezier(0.22, 1, 0.36, 1);"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span class="font-display font-bold text-xl text-white leading-none">${percent}%</span>
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-1">Mastery</span>
      </div>
    </div>
  `;
}

function renderDomainCardsHTML() {
  const domains = appState.curriculum?.domains || FALLBACK_CURRICULUM.domains;

  return domains
    .map((domain) => {
      const accent = getAccentClasses(domain.accent || domain.id);
      const lessons = Array.isArray(domain.lessons) ? domain.lessons : [];
      const liveCount = lessons.filter((l) => l.status === 'live').length;
      const symbolText = domain.symbol || domain.icon || '◆';

      const lessonsMarkup = lessons
        .map((lesson) => {
          const isLive = lesson.status === 'live';
          if (isLive) {
            return `
              <div class="group/lesson relative rounded-2xl p-4 bg-gradient-to-br from-cyanGlow/[0.08] via-slate-900/75 to-slate-950/90 border border-cyanGlow/35 hover:border-cyanGlow/65 transition-all duration-200 shadow-[0_0_28px_rgba(34,211,238,0.09)]">
                <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span class="inline-flex items-center gap-2 text-[11px] font-mono tracking-wide text-cyanGlow">
                    ${escapeHtml(lesson.tag || 'Lesson 01 • 3D Interactive + Step Solver')}
                  </span>
                  <span class="status-live">Live</span>
                </div>
                <h4 class="font-display font-semibold text-base text-white mb-1">
                  ${escapeHtml(lesson.title)}
                </h4>
                ${
                  lesson.description
                    ? `<p class="text-xs text-slate-300/90 leading-relaxed mb-3.5">${escapeHtml(lesson.description)}</p>`
                    : ''
                }
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    data-launch-lesson="${escapeHtml(lesson.id)}"
                    class="btn-glow-cyan !rounded-xl !text-xs !py-2 !px-4"
                  >
                    <span>Launch 3D Lab</span>
                    <span aria-hidden="true">→</span>
                  </button>
                  ${
                    lesson.estimatedMinutes
                      ? `<span class="text-[11px] font-mono text-slate-400">~${lesson.estimatedMinutes} min • 4 Stages</span>`
                      : ''
                  }
                </div>
              </div>
            `;
          }

          return `
            <div class="glass-card !rounded-xl px-3.5 py-3 flex items-center justify-between gap-3 !bg-white/[0.025] hover:!bg-white/[0.045]">
              <div class="min-w-0">
                <h4 class="text-sm font-medium text-slate-200 truncate">${escapeHtml(lesson.title)}</h4>
                ${
                  lesson.description
                    ? `<p class="text-[11px] text-slate-400 truncate mt-0.5">${escapeHtml(lesson.description)}</p>`
                    : ''
                }
              </div>
              <span class="status-planned shrink-0">Coming Next</span>
            </div>
          `;
        })
        .join('');

      return `
        <article class="glass-panel relative overflow-hidden p-5 sm:p-6 ${accent.border} transition-all duration-300 flex flex-col">
          <div class="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accent.glow} opacity-70"></div>
          <div class="relative flex items-start justify-between gap-3 mb-4">
            <div class="flex items-center gap-3">
              <div class="min-w-[46px] h-11 px-2 rounded-2xl border ${accent.iconBg} flex items-center justify-center font-mono font-bold text-sm shrink-0">
                ${escapeHtml(symbolText)}
              </div>
              <div>
                <h3 class="font-display font-semibold text-lg text-white leading-snug">
                  ${escapeHtml(domain.title)}
                </h3>
                <p class="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  ${escapeHtml(domain.subtitle || '')}
                </p>
              </div>
            </div>
            <span class="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
              liveCount > 0
                ? 'bg-cyanGlow/10 text-cyanGlow border-cyanGlow/30'
                : 'bg-white/[0.04] text-slate-400 border-white/10'
            }">
              ${liveCount > 0 ? `${liveCount} Live` : 'Roadmap'}
            </span>
          </div>

          <div class="relative space-y-2.5 flex-1">
            ${lessonsMarkup}
          </div>
        </article>
      `;
    })
    .join('');
}

function getMergedDagCompletedIds() {
  const completed = new Set(getFrontierCompletedIds());
  const s = getStoreState();
  const stages = Array.isArray(s.completedStages) ? s.completedStages : [];
  const quizzes = Array.isArray(s.solvedQuizzes) ? s.solvedQuizzes : [];
  const problems = Array.isArray(s.solvedProblems) ? s.solvedProblems : [];

  const hasDerivProgress =
    stages.some((k) => k === '3d-lab' || k === 'intuition' || k === 'solver' || k === 'word-problems') ||
    quizzes.some((q) => !String(q).includes('-') || String(q).startsWith('deriv') || String(q).startsWith('q')) ||
    problems.some((p) => String(p).startsWith('deriv') || String(p).startsWith('p'));
  if (hasDerivProgress) completed.add('F1.1');

  const hasKinProgress =
    stages.some((k) => String(k).startsWith('kin:')) ||
    quizzes.some((q) => String(q).startsWith('kin-'));
  if (hasKinProgress) completed.add('F1.3');

  const hasFreqProgress =
    stages.some((k) => String(k).startsWith('freq:')) ||
    quizzes.some((q) => String(q).startsWith('freq-'));
  if (hasFreqProgress) completed.add('F4.2');

  const hasStateSpaceProgress =
    stages.some((k) => String(k).startsWith('ss:')) ||
    quizzes.some((q) => String(q).startsWith('ss-'));
  if (hasStateSpaceProgress) {
    completed.add('F4.3');
    completed.add('F6.1');
    completed.add('F6.4');
  }

  const hasPidProgress =
    stages.some((k) => String(k).startsWith('pid:')) ||
    quizzes.some((q) => String(q).startsWith('pid-'));
  if (hasPidProgress) completed.add('F6.2');

  return completed;
}

function setRouteHash(nextHash) {
  if (typeof window === 'undefined') return;
  const target = nextHash ? (nextHash.startsWith('#') ? nextHash : `#${nextHash}`) : '';
  const current = window.location.hash || '';
  if (current === target) return;
  try {
    const base = `${window.location.pathname}${window.location.search}`;
    window.history.pushState(null, '', target ? `${base}${target}` : base);
  } catch {
    window.location.hash = target;
  }
}

function openHub({ updateHash = true } = {}) {
  appState.activeFrontierLabId = null;
  if (updateHash) {
    setRouteHash(appState.hubViewMode === 'review-vault' ? '#vault' : '');
  }
  window.scrollTo?.({ top: 0, behavior: 'auto' });
  renderHubView();
}

function renderHubContentSection() {
  const host = document.getElementById('hub-mode-content');
  if (!host) return;

  safeDispose(activeInstances.skillGraph);
  activeInstances.skillGraph = null;

  const isGraph = appState.hubViewMode !== 'review-vault';

  if (isGraph) {
    const dagSummary = getDagSummary();
    host.innerHTML = `
      <div class="space-y-3 sm:space-y-4">
        <div class="flex flex-wrap items-end justify-between gap-2 sm:gap-3">
          <div class="min-w-0">
            <div class="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.16em] text-cyanGlow">Two-Tier Causal Curriculum DAG</div>
            <h2 class="font-display font-bold text-lg sm:text-2xl text-white mt-0.5">Physical AI Prerequisite-to-Frontier Skill Graph</h2>
          </div>
          <div class="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-slate-300">
            <span class="px-2.5 py-1 rounded-full bg-cyanGlow/10 border border-cyanGlow/30 text-cyan-200">${dagSummary.implementedCount} Live Labs</span>
            <span class="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-300">${dagSummary.tier1Count} Foundations → ${dagSummary.tier2Count} Frontier</span>
          </div>
        </div>
        <div id="hub-skill-graph-host" class="w-full min-w-0"></div>
      </div>
    `;

    const graphHost = document.getElementById('hub-skill-graph-host');
    if (graphHost && typeof CurriculumSkillGraph === 'function') {
      try {
        const graph = new CurriculumSkillGraph();
        graph.mount(graphHost, {
          completedIds: getMergedDagCompletedIds(),
          onLaunchNode: (nodeOrId) => handleLaunchDagNode(nodeOrId),
        });
        activeInstances.skillGraph = graph;
      } catch (err) {
        console.error('[EIGENLAB] CurriculumSkillGraph mount error:', err);
      }
    }
    return;
  }

  host.innerHTML = `
    <div class="space-y-3 sm:space-y-4">
      <div class="flex flex-wrap items-end justify-between gap-2 sm:gap-3">
        <div>
          <div class="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.16em] text-slate-400">Review Vault • All 9 3D &amp; Symbolic Studios</div>
          <h2 class="font-display font-bold text-lg sm:text-2xl text-white mt-0.5">Engineering &amp; Science Tracks</h2>
        </div>
        <p class="hidden sm:block text-xs text-slate-400 max-w-md">
          Deep-dive 3D WebGL studios and multi-part paperless solvers spanning Calculus, Linear Algebra, Classical/Modern Control, and Robot Kinematics.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        ${renderDomainCardsHTML()}
      </div>
    </div>
  `;

  host.querySelectorAll('[data-launch-lesson]').forEach((btn) => {
    btn.addEventListener('click', () => {
      playSfx('tick');
      const lessonId = btn.getAttribute('data-launch-lesson') || LESSON_ID;
      openLesson(lessonId, '3d-lab');
    });
  });
}

function updateHubModeToggleUI() {
  const isGraph = appState.hubViewMode !== 'review-vault';
  document.querySelectorAll('[data-hub-mode]').forEach((btn) => {
    const mode = btn.getAttribute('data-hub-mode');
    const active = (mode === 'skill-graph') === isGraph;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.className = active
      ? 'w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-display font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 bg-cyanGlow/15 border border-cyanGlow/55 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
      : 'w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-display font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 bg-transparent border border-transparent text-slate-300 hover:text-white hover:bg-white/[0.04]';
  });
}

function renderHubView() {
  disposeActiveWidgets();
  appState.view = 'hub';

  const root = document.getElementById('app');
  if (!root) return;

  const stats = getMasterySnapshot();
  const dagSummary = getDagSummary();
  const completedSet = getMergedDagCompletedIds();
  const isGraphMode = appState.hubViewMode !== 'review-vault';

  root.innerHTML = `
    <div class="min-h-screen flex flex-col relative view-enter overflow-x-hidden">
      <div class="ambient-mesh" aria-hidden="true"></div>

      <!-- Sticky Frosted Top Studio Header -->
      <header class="sticky top-0 z-40 border-b border-white/10 bg-[#0B0D12]/80 backdrop-blur-xl">
        <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-13 sm:h-16 py-2 sm:py-0 flex items-center justify-between gap-2 sm:gap-3">
          ${renderBrandLogo()}

          <div class="flex items-center gap-1.5 sm:gap-3">
            <div class="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono">
              <span class="text-amberGlow" aria-hidden="true">🔥</span>
              <span class="text-slate-300">Streak:</span>
              <span id="hub-header-streak" class="text-white font-semibold">${stats.streak}</span>
            </div>
            <div id="hub-lens-slot">${renderLensToggleButton('hub-lens-toggle')}</div>
            <div id="hub-audio-slot">${renderAudioButton('hub-audio-toggle')}</div>
          </div>
        </div>
      </header>

      <!-- Main Hub Content -->
      <main class="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-7 lg:py-9 space-y-5 sm:space-y-8">
        <!-- Hero Grid -->
        <section class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          <!-- Left Hero Column -->
          <div class="lg:col-span-7 flex flex-col justify-between gap-4 sm:gap-5 min-w-0">
            <div class="space-y-3 sm:space-y-4">
              <div class="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyanGlow/10 border border-cyanGlow/25 text-[11px] font-mono uppercase tracking-[0.14em] text-cyanGlow">
                <span class="w-1.5 h-1.5 rounded-full bg-cyanGlow animate-pulse"></span>
                Physical AI &amp; Spatial Engineering Studio • ${DAG_TRACKS.length} Tracks / ${DAG_NODES.length} Nodes
              </div>

              <h1 class="font-display font-bold text-2xl sm:text-4xl lg:text-[2.65rem] text-white tracking-tight leading-[1.12]">
                Invariant Foundations to
                <span class="bg-gradient-to-r from-cyanGlow via-sky-300 to-violetGlow bg-clip-text text-transparent">
                  Physical AI &amp; Robotics
                </span>
              </h1>

              <p class="text-xs sm:text-sm lg:text-base text-slate-300/90 max-w-2xl leading-relaxed">
                Explore interactive 60 FPS labs with live Break-the-System fault injectors—connecting Jacobians, SVD, and Control Theory directly to <span class="text-cyanGlow font-medium">Diffusion Policies</span> and <span class="text-emeraldGlow font-medium">CBF-QP Safety Shields</span>.
              </p>

              <!-- Compact 1-Tap Flagship Quick-Launch Bar (Zero Overflow on 390px) -->
              <div class="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-0.5">
                <button
                  id="hub-hero-launch-f12"
                  type="button"
                  class="btn-glow-cyan w-full sm:w-auto !rounded-2xl !px-3 sm:!px-4 !py-2.5 !text-xs sm:!text-sm !justify-between sm:!justify-center"
                >
                  <span class="truncate">F1.2 · Jacobians</span>
                  <span aria-hidden="true" class="shrink-0">→</span>
                </button>

                <button
                  id="hub-hero-launch-m11"
                  type="button"
                  class="btn-glass w-full sm:w-auto !rounded-2xl !px-3 sm:!px-4 !py-2.5 !text-xs sm:!text-sm !border-violetGlow/50 !bg-violetGlow/[0.08] !text-violet-200 hover:!border-violetGlow/85 hover:!bg-violetGlow/15 !justify-between sm:!justify-center"
                >
                  <span class="truncate">M1.1 · Diffusion vs MSE</span>
                  <span aria-hidden="true" class="shrink-0 text-violetGlow">→</span>
                </button>

                <button
                  id="hub-hero-launch-m41"
                  type="button"
                  class="btn-glass w-full sm:w-auto !rounded-2xl !px-3 sm:!px-4 !py-2.5 !text-xs sm:!text-sm !border-emeraldGlow/50 !bg-emeraldGlow/[0.08] !text-emerald-200 hover:!border-emeraldGlow/85 hover:!bg-emeraldGlow/15 !justify-between sm:!justify-center"
                >
                  <span class="truncate">M4.1 · CBF-QP Shield</span>
                  <span aria-hidden="true" class="shrink-0 text-emeraldGlow">→</span>
                </button>

                <button
                  id="hub-hero-launch"
                  type="button"
                  class="btn-glass w-full sm:w-auto !rounded-2xl !px-3 sm:!px-4 !py-2.5 !text-xs sm:!text-sm !border-amberGlow/45 !text-amber-200 hover:!border-amberGlow/80 hover:!bg-amberGlow/10 !justify-between sm:!justify-center"
                >
                  <span class="truncate">F1.1 · Derivatives 3D</span>
                  <span aria-hidden="true" class="shrink-0 text-amberGlow">→</span>
                </button>
              </div>
            </div>

            <!-- Mastery Progress Ring Card -->
            <div class="glass-panel p-3.5 sm:p-5 flex flex-row items-center gap-3.5 sm:gap-5">
              <div class="shrink-0 scale-90 sm:scale-100 -m-1 sm:m-0">${renderMasteryRingSVG(stats.percent)}</div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                  <div class="min-w-0">
                    <h2 class="font-display font-semibold text-xs sm:text-sm text-white truncate">Studio Mastery Telemetry</h2>
                    <p class="hidden sm:block text-xs text-slate-400">Progress saved locally across Physical AI Labs &amp; 9 Review Vault Studios</p>
                  </div>
                  <span class="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono bg-emeraldGlow/10 text-emeraldGlow border border-emeraldGlow/25 shrink-0">
                    ${completedSet.size}/${dagSummary.implementedCount} Live DAG
                  </span>
                </div>

                <div class="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                  <div class="rounded-xl sm:rounded-2xl px-2 py-1.5 sm:px-3 sm:py-2.5 bg-white/[0.03] border border-white/[0.07]">
                    <div class="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-slate-400 truncate">Solver</div>
                    <div class="font-display font-bold text-sm sm:text-lg text-white mt-0.5">
                      ${stats.solvedProblems}<span class="text-slate-500 text-xs sm:text-sm">/${stats.totalProblems}</span>
                    </div>
                  </div>
                  <div class="rounded-xl sm:rounded-2xl px-2 py-1.5 sm:px-3 sm:py-2.5 bg-white/[0.03] border border-white/[0.07]">
                    <div class="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-slate-400 truncate">Quiz</div>
                    <div class="font-display font-bold text-sm sm:text-lg text-white mt-0.5">
                      ${stats.solvedVisual}<span class="text-slate-500 text-xs sm:text-sm">/${stats.totalVisual}</span>
                    </div>
                  </div>
                  <div class="rounded-xl sm:rounded-2xl px-2 py-1.5 sm:px-3 sm:py-2.5 bg-white/[0.03] border border-white/[0.07]">
                    <div class="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-slate-400 truncate">Streak</div>
                    <div class="font-display font-bold text-sm sm:text-lg text-amberGlow mt-0.5">
                      ${stats.streak} <span class="hidden sm:inline text-xs font-mono text-slate-400">run</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Hero Column: Interactive 3D Ambient Preview Card -->
          <div class="lg:col-span-5 flex flex-col min-w-0">
            <div class="canvas-stage relative flex-1 min-h-[180px] sm:min-h-[300px] lg:min-h-[380px] flex flex-col">
              <!-- Live Three.js Ambient Container -->
              <div id="hub-ambient-3d" class="absolute inset-0 w-full h-full"></div>

              <!-- HUD Overlays -->
              <div class="pointer-events-none relative z-10 flex items-center justify-between p-3 sm:p-4">
                <span class="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] font-mono text-cyanGlow">
                  <span class="w-2 h-2 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>
                  Live 3D Tangent Manifold
                </span>
                <span class="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-[#0B0D12]/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300">
                  Three.js 0.170
                </span>
              </div>

              <div class="pointer-events-none relative z-10 mt-auto p-3 sm:p-4 bg-gradient-to-t from-[#0B0D12]/90 via-[#0B0D12]/45 to-transparent">
                <div class="flex items-end justify-between gap-3">
                  <div>
                    <div class="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-amberGlow/90">Interactive Preview</div>
                    <div class="font-display font-semibold text-sm sm:text-base text-white">Secant → Tangent Convergence</div>
                    <div class="hidden sm:block text-xs text-slate-400 mt-0.5">Orbit the curve, scrub Δx → 0, and bridge directly to Physical AI score fields.</div>
                  </div>
                  <button
                    id="hub-preview-launch"
                    type="button"
                    class="pointer-events-auto btn-glass !py-1.5 sm:!py-2 !px-3 sm:!px-3.5 !text-xs !font-mono shrink-0"
                  >
                    Open F1.1 ↗
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Segmented Hub Mode Switcher: Two-Tier Skill Graph vs. Review Vault -->
        <section aria-label="Curriculum view mode" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="grid grid-cols-1 sm:inline-grid sm:grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-[#10131A]/95 border border-white/10 w-full sm:w-auto shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <button
              type="button"
              data-hub-mode="skill-graph"
              aria-pressed="${isGraphMode ? 'true' : 'false'}"
              class="${
                isGraphMode
                  ? 'w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-display font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 bg-cyanGlow/15 border border-cyanGlow/55 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                  : 'w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-display font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 bg-transparent border border-transparent text-slate-300 hover:text-white hover:bg-white/[0.04]'
              }"
            >
              <span aria-hidden="true">🧭</span>
              <span>Physical AI Skill Graph (Tier 1 → Tier 2)</span>
            </button>
            <button
              type="button"
              data-hub-mode="review-vault"
              aria-pressed="${!isGraphMode ? 'true' : 'false'}"
              class="${
                !isGraphMode
                  ? 'w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-display font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 bg-cyanGlow/15 border border-cyanGlow/55 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                  : 'w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-display font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 bg-transparent border border-transparent text-slate-300 hover:text-white hover:bg-white/[0.04]'
              }"
            >
              <span aria-hidden="true">📚</span>
              <span>Review Vault (All 9 Studios)</span>
            </button>
          </div>

          <div class="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span class="w-1.5 h-1.5 rounded-full bg-emeraldGlow"></span>
            <span>${dagSummary.flagshipCount} Flagship Frontier Labs + 9 Interactive 3D Studios</span>
          </div>
        </section>

        <!-- Active Hub Mode Host (Skill Graph OR Review Vault) -->
        <section id="hub-mode-content" class="w-full min-w-0"></section>
      </main>
    </div>
  `;

  // Mount Ambient 3D Hero Preview Scene
  const previewEl = document.getElementById('hub-ambient-3d');
  if (previewEl && typeof createAmbientHeroScene === 'function') {
    try {
      activeInstances.ambientHero = createAmbientHeroScene(previewEl);
    } catch (err) {
      console.warn('[EIGENLAB] Ambient 3D preview fallback:', err);
    }
  }

  // Mount Skill Graph or Review Vault content
  renderHubContentSection();

  // Wire Segmented Mode Switcher
  root.querySelectorAll('[data-hub-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextMode = btn.getAttribute('data-hub-mode') === 'review-vault' ? 'review-vault' : 'skill-graph';
      if (nextMode === appState.hubViewMode) return;
      playSfx('tick');
      appState.hubViewMode = nextMode;
      setRouteHash(nextMode === 'review-vault' ? '#vault' : '');
      updateHubModeToggleUI();
      renderHubContentSection();
    });
  });

  // Wire Hero Quick-Launch Flagship Pills
  document.getElementById('hub-hero-launch-f12')?.addEventListener('click', () => {
    playSfx('snap');
    handleLaunchDagNode('F1.2');
  });

  document.getElementById('hub-hero-launch-m11')?.addEventListener('click', () => {
    playSfx('snap');
    handleLaunchDagNode('M1.1');
  });

  document.getElementById('hub-hero-launch-m41')?.addEventListener('click', () => {
    playSfx('snap');
    handleLaunchDagNode('M4.1');
  });

  document.getElementById('hub-hero-launch')?.addEventListener('click', () => {
    playSfx('tick');
    handleLaunchDagNode('F1.1');
  });

  document.getElementById('hub-preview-launch')?.addEventListener('click', () => {
    playSfx('tick');
    handleLaunchDagNode('F1.1');
  });

  document.getElementById('hub-lens-toggle')?.addEventListener('click', () => {
    playSfx('snap');
    store.toggleLens();
    renderHubView();
  });

  bindHubAudioToggle();
}

function bindHubAudioToggle() {
  document.getElementById('hub-audio-toggle')?.addEventListener('click', () => {
    const nextMuted = store.toggleMute();
    if (!nextMuted) playSfx('tick');
    const slot = document.getElementById('hub-audio-slot');
    if (slot) slot.innerHTML = renderAudioButton('hub-audio-toggle');
    bindHubAudioToggle();
  });
}

// ---------------------------------------------------------------------------
// DAG Node Router & VIEW 3 — Physical AI Frontier Lab (`frontier-lab`)
// ---------------------------------------------------------------------------

function handleLaunchDagNode(nodeOrId) {
  const node = typeof nodeOrId === 'string' ? getDagNode(nodeOrId) : nodeOrId;
  if (!node) return;

  if (node.status !== 'implemented') {
    appState.hubViewMode = 'skill-graph';
    if (appState.view !== 'hub' || !activeInstances.skillGraph) {
      openHub();
    }
    activeInstances.skillGraph?.selectNode?.(node.id);
    return;
  }

  const target = node.launchTarget;
  if (target?.kind === 'frontier-lab') {
    openFrontierLab(target.labId || node.id);
    return;
  }

  if (target?.kind === 'studio') {
    if (target.lessonId === STATESPACE_LESSON_ID && target.preset) {
      const presetDef = STATESPACE_PRESETS?.[target.preset];
      if (presetDef) {
        appState.statespaceLab.presetId = target.preset;
        appState.statespaceLab.paramA = presetDef.paramA.default;
        appState.statespaceLab.paramB = presetDef.paramB.default;
        appState.statespaceTelemetry = analyzeStateSpaceSystem({
          presetId: target.preset,
          paramA: presetDef.paramA.default,
          paramB: presetDef.paramB.default,
        });
      }
    }
    openLesson(target.lessonId, target.stage || '3d-lab');
  }
}

function openFrontierLab(labId, { updateHash = true } = {}) {
  const normalizedId = String(labId || '').toUpperCase();
  const factory = FRONTIER_LAB_FACTORIES[normalizedId];
  if (typeof factory !== 'function') {
    const node = getDagNode(normalizedId);
    if (node) {
      handleLaunchDagNode(node);
    } else {
      openHub({ updateHash });
    }
    return;
  }

  appState.view = 'frontier-lab';
  appState.activeFrontierLabId = normalizedId;
  disposeActiveWidgets();

  if (updateHash) {
    setRouteHash(`#frontier/${normalizedId}`);
  }
  window.scrollTo?.({ top: 0, behavior: 'auto' });

  renderFrontierLabView();
}

function bindFrontierAudioToggle() {
  document.getElementById('frontier-audio-toggle')?.addEventListener('click', () => {
    const nextMuted = store.toggleMute();
    if (!nextMuted) playSfx('tick');
    const slot = document.getElementById('frontier-audio-slot');
    if (slot) slot.innerHTML = renderAudioButton('frontier-audio-toggle');
    bindFrontierAudioToggle();
  });
}

function renderFrontierLabView() {
  disposeActiveWidgets();
  const root = document.getElementById('app');
  if (!root) return;

  const labId = appState.activeFrontierLabId;
  const factory = FRONTIER_LAB_FACTORIES[labId];
  if (typeof factory !== 'function') {
    openHub();
    return;
  }

  const node = getDagNode(labId);
  const labDescriptor = factory();
  const displayTitle = node?.title || labDescriptor?.title || `Frontier Lab ${labId}`;
  const isTier2 = (node?.tier || labDescriptor?.tier) === 2;
  const secondary = node?.secondaryStudio || null;

  root.innerHTML = `
    <div class="min-h-screen flex flex-col relative view-enter bg-[#0B0D12] overflow-x-hidden">
      <div class="ambient-mesh" aria-hidden="true"></div>

      <!-- Stealth-Slate Frontier Lab Top Header -->
      <header class="sticky top-0 z-40 border-b border-white/10 bg-[#0B0D12]/90 backdrop-blur-xl">
        <div class="max-w-[1480px] mx-auto px-2.5 sm:px-6 h-13 sm:h-15 py-2 flex items-center justify-between gap-2 sm:gap-4">
          <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              id="btn-frontier-back-graph"
              type="button"
              class="btn-glass !py-1.5 !px-2.5 sm:!px-3 !text-xs shrink-0"
            >
              <span aria-hidden="true">←</span>
              <span>Skill Graph</span>
            </button>

            <div class="flex items-center gap-2 min-w-0">
              <span class="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold tracking-wider shrink-0 border ${
                isTier2
                  ? 'bg-violetGlow/15 border-violetGlow/45 text-violet-200'
                  : 'bg-cyanGlow/15 border-cyanGlow/45 text-cyan-200'
              }">
                ${escapeHtml(labId)}
              </span>
              <h1 class="font-display font-bold text-xs sm:text-base text-white truncate">
                ${escapeHtml(displayTitle)}
              </h1>
            </div>
          </div>

          <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
            ${
              secondary
                ? `
                  <button
                    id="btn-frontier-secondary-studio"
                    type="button"
                    class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amberGlow/10 border border-amberGlow/40 text-amber-200 hover:bg-amberGlow/20 hover:border-amberGlow/70 text-xs font-medium transition-all cursor-pointer"
                  >
                    <span>3D Studio</span>
                    <span aria-hidden="true">→</span>
                  </button>
                `
                : ''
            }
            <div id="frontier-audio-slot">${renderAudioButton('frontier-audio-toggle')}</div>
          </div>
        </div>
      </header>

      <!-- Full-Width Frontier Lesson Shell Host -->
      <main class="relative z-10 flex-1 w-full max-w-[1480px] mx-auto px-2.5 sm:px-6 py-3 sm:py-5">
        <div id="frontier-lab-host" class="w-full min-w-0"></div>
      </main>
    </div>
  `;

  document.getElementById('btn-frontier-back-graph')?.addEventListener('click', () => {
    playSfx('tick');
    appState.hubViewMode = 'skill-graph';
    openHub();
  });

  if (secondary) {
    document.getElementById('btn-frontier-secondary-studio')?.addEventListener('click', () => {
      playSfx('tick');
      openLesson(secondary.lessonId, secondary.stage || '3d-lab');
    });
  }

  bindFrontierAudioToggle();

  const host = document.getElementById('frontier-lab-host');
  if (host && typeof FrontierLessonShell === 'function') {
    try {
      const shell = new FrontierLessonShell();
      shell.mount(host, labDescriptor, {
        hideTopBar: true,
        onBackToGraph: () => {
          appState.hubViewMode = 'skill-graph';
          openHub();
        },
        onNavigateNode: (targetId) => handleLaunchDagNode(targetId),
        onOpenStudio: secondary
          ? (lessonId, stage) =>
              openLesson(
                lessonId || secondary.lessonId,
                stage || secondary.stage || '3d-lab'
              )
          : undefined,
      });
      activeInstances.frontierShell = shell;
    } catch (err) {
      console.error('[EIGENLAB] FrontierLessonShell mount error:', err);
      host.innerHTML = `
        <div class="glass-panel p-6 text-center text-slate-300 text-sm">
          Failed to mount Frontier Lab ${escapeHtml(labId)}: ${escapeHtml(err?.message || err)}
        </div>
      `;
    }
  }
}

function applyRouteFromHash() {
  const rawHash = (typeof window !== 'undefined' ? window.location.hash : '') || '';
  const cleaned = rawHash.replace(/^#\/?/, '').trim();

  if (!cleaned || cleaned === 'hub' || cleaned === 'skill-graph') {
    appState.hubViewMode = 'skill-graph';
    openHub({ updateHash: false });
    return;
  }

  if (cleaned === 'vault' || cleaned === 'review-vault') {
    appState.hubViewMode = 'review-vault';
    openHub({ updateHash: false });
    return;
  }

  const frontierMatch = cleaned.match(/^frontier\/([A-Za-z0-9._-]+)$/i);
  if (frontierMatch) {
    const labId = frontierMatch[1].toUpperCase();
    if (FRONTIER_LAB_FACTORIES[labId]) {
      openFrontierLab(labId, { updateHash: false });
      return;
    }
    const dagNode = getDagNode(labId);
    if (dagNode) {
      handleLaunchDagNode(dagNode);
      return;
    }
  }

  const lessonMatch = cleaned.match(/^lesson\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/i);
  if (lessonMatch) {
    openLesson(lessonMatch[1], lessonMatch[2] || '3d-lab', { updateHash: false });
    return;
  }

  appState.hubViewMode = 'skill-graph';
  openHub({ updateHash: false });
}

// ---------------------------------------------------------------------------
// VIEW 2 — Interactive Lesson Studio (`calc-*`, `math-*`, `mech-*`)
// ---------------------------------------------------------------------------

function openLesson(lessonId = LESSON_ID, stageId = '3d-lab', { updateHash = true } = {}) {
  appState.view = 'lesson';
  appState.activeFrontierLabId = null;
  if (lessonId === INTEGRAL_LESSON_ID) appState.lessonId = INTEGRAL_LESSON_ID;
  else if (lessonId === DIFFEQ_LESSON_ID) appState.lessonId = DIFFEQ_LESSON_ID;
  else if (lessonId === LINALG_LESSON_ID) appState.lessonId = LINALG_LESSON_ID;
  else if (lessonId === MODELING_LESSON_ID) appState.lessonId = MODELING_LESSON_ID;
  else if (lessonId === PID_LESSON_ID) appState.lessonId = PID_LESSON_ID;
  else if (lessonId === FREQ_LESSON_ID) appState.lessonId = FREQ_LESSON_ID;
  else if (lessonId === STATESPACE_LESSON_ID) appState.lessonId = STATESPACE_LESSON_ID;
  else if (lessonId === KINEMATICS_LESSON_ID) appState.lessonId = KINEMATICS_LESSON_ID;
  else appState.lessonId = LESSON_ID;
  appState.stage = stageId;
  if (updateHash) {
    setRouteHash(`#lesson/${appState.lessonId}/${appState.stage}`);
  }
  window.scrollTo?.({ top: 0, behavior: 'auto' });
  renderLessonShell();
  mountActiveStage();
}

function getLessonSubtitleText(on) {
  if (isIntegralLesson()) {
    return on
      ? 'Mechatronics Lens: Velocity v(t) → Net Displacement Δx & Accumulator Dynamics'
      : 'Calculus Lens: 3D Riemann Sums, FTC Accumulation & Symbolic Integration';
  }
  if (isDiffEqLesson()) {
    return on
      ? 'Mechatronics Lens: Spring-Mass-Damper Dynamics, Poles & Closed-Loop Stability'
      : 'Calculus Lens: ODE Phase Space, Laplace s-Plane & Transfer Functions';
  }
  if (isLinAlgLesson()) {
    return on
      ? 'Mechatronics Lens: Rigid-Body Frames SO(3), Jacobians & Principal Inertia Axes'
      : 'Linear Geometry Lens: 3D Matrix Warps, Eigenvector Spans, Determinants & SVD';
  }
  if (isModelingLesson()) {
    return on
      ? 'Hardware Analogy Lens: Mass-Spring-Damper ↔ Series RLC, Motors & Closed-Loop Redesign'
      : 'First-Principles Lens: Governing ODE → Laplace G(s) → s-Plane Poles → Closed Loop';
  }
  if (isPidLesson()) {
    return on
      ? 'Hardware Rig Lens: Actuator Torque Saturation, Load Disturbance Rejection & Servo Tracking'
      : 'Control Theory Lens: Closed-Loop Transfer Functions, Routh-Hurwitz & Phase Margin';
  }
  if (isFreqLesson()) {
    return on
      ? 'Loop-Shaping Lens: Servo Resonance Mr, Bandwidth, Lead-Lag Compensators & Sensitivity'
      : 'Frequency Lens: 3D |G(s)| Surface, Root Locus Branches, Bode Margins & Nyquist';
  }
  if (isStateSpaceLesson()) {
    return on
      ? 'Hardware Rig Lens: Cart-Pole Torque Limits, CBF Safety & InEKF/UKF Sensor Fusion'
      : 'State-Space Lens: LQR Riccati Bowls, MPC/CBF-QP, Kalman Covariance & Factor Graphs';
  }
  if (isKinematicsLesson()) {
    return on
      ? 'Servo Torque Rig Lens: τ = JᵀF Duality, Actuator Saturation & QP-IK Joint Limits'
      : 'Kinematics Lens: DH/MDH Frames, PoE SE(3) Screws, Jacobians & Manipulability';
  }
  return on
    ? 'Mechatronics Lens: Displacement x(t) → Velocity v(t) & Actuator Dynamics'
    : 'Calculus Lens: Secant Limits, Tangent Slopes & Symbolic Rules';
}

function renderStageCompletionDotsHTML() {
  return getLessonStages()
    .map((stage) => {
      const done = isStageDone(stage.id);
      const active = appState.stage === stage.id;
      let classes = 'bg-white/10 border-white/20 text-slate-400 hover:border-white/40';
      if (done) {
        classes =
          'bg-emeraldGlow/20 border-emeraldGlow/60 text-emeraldGlow shadow-[0_0_10px_rgba(52,211,153,0.3)]';
      } else if (active) {
        classes =
          'bg-cyanGlow/20 border-cyanGlow text-cyanGlow shadow-[0_0_10px_rgba(34,211,238,0.35)]';
      }
      return `
        <button
          type="button"
          data-stage-jump="${stage.id}"
          title="Stage ${stage.number}: ${escapeHtml(stage.shortLabel)}${done ? ' (Completed)' : ''}"
          class="w-6 h-6 rounded-full border text-[11px] font-mono font-semibold flex items-center justify-center transition-all cursor-pointer ${classes}"
        >
          ${done ? '✓' : stage.number}
        </button>
      `;
    })
    .join('');
}

function updateLessonStageDotsUI() {
  const dotsWrap = document.getElementById('lesson-stage-dots');
  if (dotsWrap) {
    dotsWrap.innerHTML = renderStageCompletionDotsHTML();
    dotsWrap.querySelectorAll('[data-stage-jump]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-stage-jump');
        if (target && target !== appState.stage) {
          playSfx('tick');
          switchStage(target);
        }
      });
    });
  }

  getLessonStages().forEach((stage) => {
    const done = isStageDone(stage.id);
    document.querySelectorAll(`[data-stage-pill="${stage.id}"]`).forEach((pill) => {
      pill.classList.toggle('is-complete', done);
      const badge = pill.querySelector('[data-stage-check]');
      if (badge) {
        if (pill.classList.contains('mobile-tab')) {
          badge.className = done
            ? 'absolute top-1 right-2 w-2 h-2 rounded-full bg-emeraldGlow shadow-[0_0_6px_#34D399]'
            : 'hidden';
          badge.textContent = '';
        } else {
          badge.className = done
            ? 'ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emeraldGlow/20 text-emeraldGlow text-[10px]'
            : 'hidden';
          badge.textContent = done ? '✓' : '';
        }
      }
    });
  });
}

function renderLessonShell() {
  disposeActiveWidgets();
  const root = document.getElementById('app');
  if (!root) return;

  const stages = getLessonStages();
  const isInt = isIntegralLesson();
  const isDE = isDiffEqLesson();
  const isLA = isLinAlgLesson();
  const isMod = isModelingLesson();
  const isPid = isPidLesson();
  const isFreq = isFreqLesson();
  const isSS = isStateSpaceLesson();
  const isKin = isKinematicsLesson();
  const lessonBadge = isKin
    ? 'Robotics 01'
    : isSS
      ? 'Controls 04'
      : isFreq
        ? 'Controls 03'
        : isPid
          ? 'Controls 02'
          : isMod
            ? 'Controls 01'
            : isLA
              ? 'Lesson 04'
              : isDE
                ? 'Lesson 03'
                : isInt
                  ? 'Lesson 02'
                  : 'F1.1 • Lesson 01';
  const lessonBadgeColor = isKin
    ? 'text-cyanGlow'
    : isSS
      ? 'text-emeraldGlow'
      : isFreq
        ? 'text-violetGlow'
        : isPid || isMod
          ? 'text-amberGlow'
          : isLA
            ? 'text-emeraldGlow'
            : isDE
              ? 'text-amberGlow'
              : isInt
                ? 'text-violetGlow'
                : 'text-cyanGlow';
  const lessonTitle = isKin
    ? 'Robot Kinematics & IK Studio'
    : isSS
      ? 'State-Space & Estimation'
      : isFreq
        ? 'Root Locus & Bode'
        : isPid
          ? 'PID Control Studio'
          : isMod
            ? 'System Modeling Studio'
            : isLA
              ? 'Linear Algebra Studio'
              : isDE
                ? 'ODE & Laplace Studio'
                : isInt
                  ? 'Integrals Studio'
                  : 'Derivatives Studio';

  root.innerHTML = `
    <div class="min-h-screen flex flex-col relative view-enter">
      <div class="ambient-mesh" aria-hidden="true"></div>

      <!-- Sticky Frosted Top Bar (Compact h-12 on Mobile, h-16 on Desktop) -->
      <header class="sticky top-0 z-40 border-b border-white/10 bg-[#0B0D12]/88 backdrop-blur-xl">
        <div class="max-w-[1440px] mx-auto px-2.5 sm:px-6 h-12 md:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <!-- Back + Lesson Title + Completion Dots -->
          <div class="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              id="btn-back-hub"
              type="button"
              class="btn-glass !py-1 md:!py-1.5 !px-2.5 md:!px-3 !text-xs shrink-0"
            >
              <span aria-hidden="true">←</span>
              <span class="hidden sm:inline">Skill Graph</span>
              <span class="sm:hidden">Hub</span>
            </button>

            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-mono uppercase tracking-wider ${lessonBadgeColor} hidden md:inline">${lessonBadge}</span>
                <h1 class="font-display font-bold text-xs sm:text-base text-white truncate">
                  ${lessonTitle}
                </h1>
              </div>
              <div id="lesson-lens-subtitle" class="text-[11px] text-slate-400 truncate hidden md:block">
                ${getLessonSubtitleText(isMechatronicsLens())}
              </div>
            </div>

            <div id="lesson-stage-dots" class="hidden lg:flex items-center gap-1.5 pl-3 border-l border-white/10">
              ${renderStageCompletionDotsHTML()}
            </div>
          </div>

          <!-- Global Lens & Audio Controls -->
          <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div id="lesson-lens-toggle-slot">${renderLensToggleButton('lesson-lens-toggle')}</div>
            <div id="lesson-audio-toggle-slot">${renderAudioButton('lesson-audio-toggle')}</div>
          </div>
        </div>
      </header>

      <!-- Desktop/Tablet Floating Pill Navigation Bar (Hidden on Mobile in favor of Thumb Bottom Bar) -->
      <nav aria-label="Lesson stages" class="hidden md:block sticky top-16 z-30 py-3 px-3 sm:px-6 bg-gradient-to-b from-[#0B0D12]/90 via-[#0B0D12]/65 to-transparent backdrop-blur-md">
        <div class="max-w-[1440px] mx-auto flex justify-center">
          <div class="stage-nav studio-scroll">
            ${stages
              .map((stage) => {
                const active = appState.stage === stage.id;
                const done = isStageDone(stage.id);
                return `
                  <button
                    type="button"
                    data-stage-pill="${stage.id}"
                    aria-current="${active ? 'page' : 'false'}"
                    class="stage-pill ${active ? 'active' : ''} ${done ? 'is-complete' : ''}"
                  >
                    <span aria-hidden="true">${stage.icon}</span>
                    <span>${escapeHtml(stage.label)}</span>
                    <span data-stage-check class="${
                      done
                        ? 'ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emeraldGlow/20 text-emeraldGlow text-[10px]'
                        : 'hidden'
                    }">${done ? '✓' : ''}</span>
                  </button>
                `;
              })
              .join('')}
          </div>
        </div>
      </nav>

      <!-- Active Stage Mount Point -->
      <main id="stage-container" class="relative z-10 flex-1 w-full max-w-[1440px] mx-auto px-2.5 sm:px-6 pt-2 md:pt-0 pb-24 md:pb-10"></main>

      <!-- Mobile Thumb-Friendly Floating Bottom Tab Bar (md:hidden) -->
      <nav aria-label="Mobile lesson stages" class="mobile-bottom-nav md:hidden">
        <div class="grid grid-cols-4 gap-1 max-w-md mx-auto">
          ${stages
            .map((stage) => {
              const active = appState.stage === stage.id;
              const done = isStageDone(stage.id);
              return `
                <button
                  type="button"
                  data-stage-pill="${stage.id}"
                  aria-current="${active ? 'page' : 'false'}"
                  class="mobile-tab ${active ? 'active' : ''} ${done ? 'is-complete' : ''}"
                >
                  <span aria-hidden="true" class="text-base leading-none">${stage.icon}</span>
                  <span>${escapeHtml(stage.mobileLabel || stage.shortLabel)}</span>
                  <span data-stage-check class="${
                    done
                      ? 'absolute top-1 right-2 w-2 h-2 rounded-full bg-emeraldGlow shadow-[0_0_6px_#34D399]'
                      : 'hidden'
                  }"></span>
                </button>
              `;
            })
            .join('')}
        </div>
      </nav>
    </div>
  `;

  // Wire Top Bar & Pill Nav
  document.getElementById('btn-back-hub')?.addEventListener('click', () => {
    playSfx('tick');
    openHub();
  });

  bindLessonLensToggle();
  bindLessonAudioToggle();
  updateLessonStageDotsUI();

  root.querySelectorAll('[data-stage-pill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextStage = btn.getAttribute('data-stage-pill');
      if (nextStage && nextStage !== appState.stage) {
        playSfx('tick');
        switchStage(nextStage);
      }
    });
  });
}

function bindLessonLensToggle() {
  document.getElementById('lesson-lens-toggle')?.addEventListener('click', () => {
    playSfx('snap');
    store.toggleLens();
    propagateLensToActiveStage();
  });
}

function bindLessonAudioToggle() {
  document.getElementById('lesson-audio-toggle')?.addEventListener('click', () => {
    const nextMuted = store.toggleMute();
    if (!nextMuted) playSfx('tick');
    const slot = document.getElementById('lesson-audio-toggle-slot');
    if (slot) slot.innerHTML = renderAudioButton('lesson-audio-toggle');
    bindLessonAudioToggle();
  });
}

function propagateLensToActiveStage() {
  const on = isMechatronicsLens();
  const lensStr = on ? 'mechatronics' : 'math';

  // Update top bar button & subtitle
  const lensSlot = document.getElementById('lesson-lens-toggle-slot');
  if (lensSlot) {
    lensSlot.innerHTML = renderLensToggleButton('lesson-lens-toggle');
    bindLessonLensToggle();
  }

  const sub = document.getElementById('lesson-lens-subtitle');
  if (sub) {
    sub.textContent = getLessonSubtitleText(on);
  }

  // Propagate immediately to active stage components
  if (activeInstances.studio3D) {
    activeInstances.studio3D.toggleMechatronicsLens?.(on);
    if (isIntegralLesson()) {
      updateIntegralStage1LensUI();
      updateIntegralStage1TelemetryUI();
    } else if (isDiffEqLesson()) {
      updateDiffEqStage1LensUI();
      updateDiffEqStage1TelemetryUI();
    } else if (isLinAlgLesson()) {
      updateLinAlgStage1LensUI();
      updateLinAlgStage1TelemetryUI();
    } else if (isModelingLesson()) {
      updateModelingStage1LensUI();
      updateModelingStage1TelemetryUI();
    } else if (isPidLesson()) {
      updatePidStage1LensUI();
      updatePidStage1TelemetryUI();
    } else if (isFreqLesson()) {
      updateFreqStage1LensUI();
      updateFreqStage1TelemetryUI();
    } else if (isStateSpaceLesson()) {
      updateStateSpaceStage1LensUI();
      updateStateSpaceStage1TelemetryUI();
    } else if (isKinematicsLesson()) {
      updateKinematicsStage1LensUI();
      updateKinematicsStage1TelemetryUI();
    } else {
      updateStage1LensUI();
      updateStage1TelemetryUI();
    }
  }
  if (activeInstances.stackedLab) {
    activeInstances.stackedLab.setMechatronicsLens?.(on);
    activeInstances.stackedLab.setLens?.(lensStr);
    const titleEl = document.getElementById('stage2-lab-title');
    if (titleEl) {
      if (isIntegralLesson()) {
        titleEl.textContent = on
          ? 'Synchronized Velocity v(t) & Displacement x(t)'
          : 'Synchronized Integrand f(x) & Accumulation F(x)';
      } else if (isDiffEqLesson()) {
        titleEl.textContent = on
          ? 'Control s-Plane Poles & Impulse Response x(t)'
          : 'Interactive Laplace s-Plane ↔ Time Response y(t)';
      } else if (isLinAlgLesson()) {
        titleEl.textContent = on
          ? '2-DOF Robot Jacobian J & Manipulability Ellipse'
          : "Interactive 2D Linear Map A = [î'  ĵ'] & SVD Ellipse";
      } else if (isModelingLesson()) {
        titleEl.textContent = on
          ? 'Series RLC Analogy (L↔m, R↔c, 1/C↔k) & s-Plane Locus'
          : 'Physical Damping Sweep: s-Plane Pole Locus & Step Response';
      } else if (isPidLesson()) {
        titleEl.textContent = on
          ? 'Servo Position θ(t) & Motor Torque τ(t) (P/I/D Channels)'
          : 'Closed-Loop Output y(t) & P/I/D Effort Decomposition u(t)';
      } else if (isFreqLesson()) {
        titleEl.textContent = on
          ? 'Closed-Loop Pole Migration & Servo Loop Robustness Margins'
          : 'Interactive Root Locus 1 + KG(s) = 0 ↔ Bode Gain/Phase Margins';
      } else if (isStateSpaceLesson()) {
        titleEl.textContent = on
          ? 'Actuator Phase Portrait, Torque Limits & Real-Time Sensor Fusion'
          : 'Synchronized Phase Portrait, State Tracking & Effort / Kalman Gain';
      } else if (isKinematicsLesson()) {
        titleEl.textContent = on
          ? 'Servo Torque Demands τ = JᵀF, Actuator Saturation & Workspace Safety'
          : 'Synchronized Workspace Arm, Manipulability Ellipsoid & IK Convergence';
      } else {
        titleEl.textContent = on
          ? 'Synchronized Position x(t) & Velocity v(t)'
          : "Synchronized f(x) & Derivative f'(x)";
      }
    }
  }
  if (activeInstances.quizEngine) {
    activeInstances.quizEngine.setMechatronicsLens?.(on);
    activeInstances.quizEngine.setLens?.(lensStr);
  }
  if (activeInstances.stepSolver) {
    activeInstances.stepSolver.setMechatronicsLens?.(on);
    activeInstances.stepSolver.setLens?.(lensStr);
  }
  if (appState.stage === 'word-problems') {
    mountStage4WordProblems(document.getElementById('stage-container'));
  }
}

function switchStage(stageId) {
  disposeActiveWidgets();
  appState.stage = stageId;
  setRouteHash(`#lesson/${appState.lessonId}/${appState.stage}`);

  document.querySelectorAll('[data-stage-pill]').forEach((btn) => {
    const id = btn.getAttribute('data-stage-pill');
    const active = id === stageId;
    btn.setAttribute('aria-current', active ? 'page' : 'false');
    btn.classList.toggle('active', active);
  });

  updateLessonStageDotsUI();
  mountActiveStage();
}

function mountActiveStage() {
  const container = document.getElementById('stage-container');
  if (!container) return;

  if (isIntegralLesson()) {
    switch (appState.stage) {
      case '3d-lab':
        mountIntegralStage1Lab3D(container);
        break;
      case 'intuition':
        mountIntegralStage2Intuition(container);
        break;
      case 'solver':
        mountIntegralStage3Solver(container);
        break;
      case 'word-problems':
        mountStage4WordProblems(container);
        break;
      default:
        mountIntegralStage1Lab3D(container);
    }
    return;
  }

  if (isDiffEqLesson()) {
    switch (appState.stage) {
      case '3d-lab':
        mountDiffEqStage1Lab3D(container);
        break;
      case 'intuition':
        mountDiffEqStage2Intuition(container);
        break;
      case 'solver':
        mountDiffEqStage3Solver(container);
        break;
      case 'word-problems':
        mountStage4WordProblems(container);
        break;
      default:
        mountDiffEqStage1Lab3D(container);
    }
    return;
  }

  if (isLinAlgLesson()) {
    switch (appState.stage) {
      case '3d-lab':
        mountLinAlgStage1Lab3D(container);
        break;
      case 'intuition':
        mountLinAlgStage2Intuition(container);
        break;
      case 'solver':
        mountLinAlgStage3Solver(container);
        break;
      case 'word-problems':
        mountStage4WordProblems(container);
        break;
      default:
        mountLinAlgStage1Lab3D(container);
    }
    return;
  }

  if (isModelingLesson()) {
    switch (appState.stage) {
      case '3d-lab':
        mountModelingStage1Lab3D(container);
        break;
      case 'intuition':
        mountModelingStage2Intuition(container);
        break;
      case 'solver':
        mountModelingStage3Solver(container);
        break;
      case 'word-problems':
        mountStage4WordProblems(container);
        break;
      default:
        mountModelingStage1Lab3D(container);
    }
    return;
  }

  if (isPidLesson()) {
    switch (appState.stage) {
      case '3d-lab':
        mountPidStage1Lab3D(container);
        break;
      case 'intuition':
        mountPidStage2Intuition(container);
        break;
      case 'solver':
        mountPidStage3Solver(container);
        break;
      case 'word-problems':
        mountStage4WordProblems(container);
        break;
      default:
        mountPidStage1Lab3D(container);
    }
    return;
  }

  if (isFreqLesson()) {
    switch (appState.stage) {
      case '3d-lab':
        mountFreqStage1Lab3D(container);
        break;
      case 'intuition':
        mountFreqStage2Intuition(container);
        break;
      case 'solver':
        mountFreqStage3Solver(container);
        break;
      case 'word-problems':
        mountStage4WordProblems(container);
        break;
      default:
        mountFreqStage1Lab3D(container);
    }
    return;
  }

  if (isStateSpaceLesson()) {
    switch (appState.stage) {
      case '3d-lab':
        mountStateSpaceStage1Lab3D(container);
        break;
      case 'intuition':
        mountStateSpaceStage2Intuition(container);
        break;
      case 'solver':
        mountStateSpaceStage3Solver(container);
        break;
      case 'word-problems':
        mountStage4WordProblems(container);
        break;
      default:
        mountStateSpaceStage1Lab3D(container);
    }
    return;
  }

  if (isKinematicsLesson()) {
    switch (appState.stage) {
      case '3d-lab':
        mountKinematicsStage1Lab3D(container);
        break;
      case 'intuition':
        mountKinematicsStage2Intuition(container);
        break;
      case 'solver':
        mountKinematicsStage3Solver(container);
        break;
      case 'word-problems':
        mountStage4WordProblems(container);
        break;
      default:
        mountKinematicsStage1Lab3D(container);
    }
    return;
  }

  switch (appState.stage) {
    case '3d-lab':
      mountStage1Lab3D(container);
      break;
    case 'intuition':
      mountStage2Intuition(container);
      break;
    case 'solver':
      mountStage3Solver(container);
      break;
    case 'word-problems':
      mountStage4WordProblems(container);
      break;
    default:
      mountStage1Lab3D(container);
  }
}

// ---------------------------------------------------------------------------
// STAGE 1 — Full-Bleed Spline-Style 3D Limit & Tangent Lab (`3d-lab`)
// ---------------------------------------------------------------------------

function computeLocalTelemetry(preset, x0, dx) {
  const safeDx = Math.abs(dx) < 1e-6 ? 1e-6 : dx;
  let fx0 = 0;
  let fx1 = 0;
  let exactSlope = 0;
  let secantSlope = 0;

  try {
    fx0 = Number(preset.f(x0));
    fx1 = Number(preset.f(x0 + safeDx));
    secantSlope = (fx1 - fx0) / safeDx;
    exactSlope =
      typeof preset.df === 'function'
        ? Number(preset.df(x0))
        : (preset.f(x0 + 1e-5) - preset.f(x0 - 1e-5)) / 2e-5;
  } catch {
    // Fallback zeros
  }

  return {
    x0,
    dx: safeDx,
    fx0,
    fx1,
    secantSlope,
    exactSlope,
    tangentLocked: Math.abs(safeDx) <= 0.025,
  };
}

function mountStage1Lab3D(container) {
  const presets = normalizePresets();
  const activePreset = getActivePreset(presets);
  const lensOn = isMechatronicsLens();

  if (activePreset) {
    appState.lab.x0 = Math.max(
      activePreset.xMin + 0.2,
      Math.min(activePreset.xMax - 0.2, appState.lab.x0 ?? activePreset.defaultX)
    );
    appState.telemetry = computeLocalTelemetry(
      activePreset,
      appState.lab.x0,
      appState.lab.dx
    );
  }

  container.innerHTML = `
    <section class="space-y-2 sm:space-y-4 view-enter">
      <!-- Top Preset Strip + Camera Angle Presets -->
      <div class="flex items-center justify-between gap-2 sm:gap-3">
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar xl:flex-wrap flex-1 min-w-0 py-0.5" role="tablist" aria-label="Function presets">
          ${presets
            .map((p) => {
              const isSelected = activePreset && p.id === activePreset.id;
              return `
                <button
                  type="button"
                  data-preset-id="${escapeHtml(p.id)}"
                  class="shrink-0 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyanGlow/15 border-cyanGlow/50 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.2)]'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }"
                >
                  ${escapeHtml(p.name)}
                </button>
              `;
            })
            .join('')}
        </div>

        <div class="hidden xl:flex items-center gap-1 bg-slate-900/75 p-1 rounded-xl border border-white/10 shrink-0">
          ${[
            { id: '3d', label: '3D Studio' },
            { id: 'front', label: 'Front 2D Graph' },
            { id: 'iso', label: 'Isometric' },
          ]
            .map((cam) => {
              const active = appState.lab.cameraPreset === cam.id;
              return `
                <button
                  type="button"
                  data-camera-preset="${cam.id}"
                  class="px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    active
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 border border-transparent hover:text-white'
                  }"
                >
                  ${cam.label}
                </button>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- Main Full-Bleed Spline-Style 3D Studio Layout -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-2.5 sm:gap-4 items-stretch">
        <!-- 3D Viewport Canvas Container (Compact Split-Screen on Mobile, Full-Bleed on Desktop) -->
        <div class="xl:col-span-8 canvas-stage relative h-[37dvh] min-h-[215px] max-h-[300px] sm:h-[420px] sm:max-h-none xl:h-[calc(100vh-210px)] xl:min-h-[540px] flex flex-col">
          <!-- Three.js Mount -->
          <div id="derivative-3d-canvas" class="absolute inset-0 w-full h-full"></div>

          <!-- Top-Left Floating Equation HUD -->
          <div class="pointer-events-none relative z-10 flex items-start justify-between gap-2 p-2.5 sm:p-4">
            <div class="pointer-events-auto rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-3 bg-[#0B0D12]/80 backdrop-blur-xl border border-white/15 shadow-lg max-w-full">
              <div class="hidden sm:flex items-center gap-2 mb-1.5">
                <span class="w-2 h-2 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>
                <span id="hud-curve-label" class="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  ${lensOn ? 'Actuator Displacement & Velocity' : 'Active Curve & Exact Derivative'}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-x-2.5 sm:gap-x-4 gap-y-0.5 text-xs sm:text-sm text-white">
                <span id="hud-fx-math" class="text-cyan-200"></span>
                <span class="hidden sm:inline text-slate-600">|</span>
                <span id="hud-dfx-math" class="hidden sm:inline text-violet-300"></span>
              </div>
            </div>

            <!-- Synced Mechatronics 3D Actuator Indicator (Desktop/Tablet) -->
            <div id="hud-mech-indicator" class="hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
              lensOn
                ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
                : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
            }">
              <div class="flex items-center gap-2 text-[11px] font-mono">
                <span class="w-2 h-2 rounded-full ${lensOn ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}"></span>
                <span id="hud-mech-text">${lensOn ? '3D Servo Actuator: SYNCED' : '3D Actuator: Standby'}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Floating Canvas Legend + Compact Mobile Camera Switcher -->
          <div class="pointer-events-none relative z-10 mt-auto p-2 sm:p-4 flex items-center justify-between gap-2">
            <div class="hidden sm:inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300">
              <span><span class="text-cyanGlow">●</span> Curve</span>
              <span><span class="text-amberGlow">●</span> Secant Δx</span>
              <span><span class="text-emeraldGlow">●</span> Tangent</span>
              <span><span class="text-violetGlow">●</span> f&apos;(x) Ribbon</span>
            </div>

            <!-- Compact 1-tap Camera Presets inside Viewport on Mobile/Tablet -->
            <div class="pointer-events-auto xl:hidden ml-auto flex items-center gap-0.5 bg-[#0B0D12]/80 backdrop-blur-md p-0.5 rounded-xl border border-white/15">
              ${[
                { id: '3d', label: '3D' },
                { id: 'front', label: '2D' },
                { id: 'iso', label: 'Iso' },
              ]
                .map((cam) => {
                  const active = appState.lab.cameraPreset === cam.id;
                  return `
                    <button
                      type="button"
                      data-camera-preset="${cam.id}"
                      class="px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                        active
                          ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                          : 'text-slate-400 border border-transparent hover:text-white'
                      }"
                    >
                      ${cam.label}
                    </button>
                  `;
                })
                .join('')}
            </div>

            <div class="hidden xl:inline-flex items-center px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-400">
              Drag to orbit • Scroll to zoom
            </div>
          </div>
        </div>

        <!-- Tactile Control Deck & Live KaTeX Telemetry Card -->
        <aside class="xl:col-span-4 flex flex-col gap-2.5 sm:gap-4 xl:h-[calc(100vh-210px)] xl:overflow-y-auto studio-scroll pr-0.5">
          <!-- Live Telemetry Card (Ultra-Compact 1-Row Strip on Mobile with Tap-to-Expand KaTeX; Always Expanded on xl) -->
          <div class="glass-panel p-2.5 sm:p-5 space-y-2 sm:space-y-4">
            <!-- Header + Mobile Compact Slope Strip -->
            <div class="flex items-center justify-between gap-2">
              <div class="hidden xl:block">
                <div class="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-400">Live Limit Telemetry</div>
                <h2 class="font-display font-semibold text-sm text-white mt-0.5">Difference Quotient</h2>
              </div>

              <!-- Compact Inline Secant vs Exact Readout (always visible on mobile/tablet!) -->
              <div class="flex xl:hidden items-center gap-2 min-w-0 flex-1">
                <div class="flex-1 min-w-0 rounded-xl px-2.5 py-1.5 bg-amberGlow/[0.08] border border-amberGlow/25">
                  <div class="text-[9px] font-mono uppercase tracking-wider text-amberGlow/90 truncate">
                    ${lensOn ? 'Avg Δx/Δt' : 'Secant'}
                  </div>
                  <div id="val-secant-slope-compact" class="font-mono font-semibold text-sm text-white leading-tight">
                    ${formatNum(appState.telemetry.secantSlope, 3)}
                  </div>
                </div>
                <div class="flex-1 min-w-0 rounded-xl px-2.5 py-1.5 bg-emeraldGlow/[0.08] border border-emeraldGlow/25">
                  <div class="text-[9px] font-mono uppercase tracking-wider text-emeraldGlow/90 truncate">
                    ${lensOn ? 'v(t₀)' : "Exact f'"}
                  </div>
                  <div id="val-exact-slope-compact" class="font-mono font-semibold text-sm text-emeraldGlow leading-tight">
                    ${formatNum(appState.telemetry.exactSlope, 3)}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <div
                  id="badge-tangent-locked"
                  class="px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 ${
                    appState.telemetry.tangentLocked
                      ? 'bg-emeraldGlow/20 border-emeraldGlow/60 text-emeraldGlow shadow-[0_0_18px_rgba(52,211,153,0.3)]'
                      : 'bg-amberGlow/15 border-amberGlow/30 text-amberGlow'
                  }"
                >
                  ${appState.telemetry.tangentLocked ? 'TANGENT ✓' : 'SECANT'}
                </div>
                <button
                  id="btn-toggle-mobile-formula"
                  type="button"
                  aria-expanded="false"
                  title="Toggle KaTeX difference quotient formula"
                  class="xl:hidden px-2 py-1 rounded-lg bg-white/[0.05] border border-white/15 text-[11px] font-mono text-cyan-200 cursor-pointer"
                >
                  ƒ ▾
                </button>
              </div>
            </div>

            <!-- Collapsible on Mobile (<xl), Always Open on Desktop (xl:block): Full KaTeX Formula & Error Metrics -->
            <div id="mobile-formula-drawer" class="hidden xl:block space-y-3 sm:space-y-4">
              <!-- KaTeX Difference Quotient Formula -->
              <div class="katex-card flex items-center justify-center min-h-[60px] sm:min-h-[76px]">
                <div id="telemetry-quotient-katex" class="text-slate-100 text-xs sm:text-sm overflow-x-auto"></div>
              </div>

              <!-- Secant vs Exact Slope Comparison Grid (Desktop xl) -->
              <div class="hidden xl:grid grid-cols-2 gap-3">
                <div class="rounded-2xl p-3.5 bg-amberGlow/[0.06] border border-amberGlow/25">
                  <div id="label-secant-metric" class="text-[10px] font-mono uppercase tracking-wider text-amberGlow/90">
                    ${lensOn ? 'Avg Velocity Δx/Δt' : 'Secant Slope Δy/Δx'}
                  </div>
                  <div id="val-secant-slope" class="font-mono font-semibold text-xl text-white mt-1">
                    ${formatNum(appState.telemetry.secantSlope, 4)}
                  </div>
                </div>

                <div class="rounded-2xl p-3.5 bg-emeraldGlow/[0.06] border border-emeraldGlow/25">
                  <div id="label-exact-metric" class="text-[10px] font-mono uppercase tracking-wider text-emeraldGlow/90">
                    ${lensOn ? 'Instant v(t₀)' : "Exact f'(x₀)"}
                  </div>
                  <div id="val-exact-slope" class="font-mono font-semibold text-xl text-emeraldGlow mt-1">
                    ${formatNum(appState.telemetry.exactSlope, 4)}
                  </div>
                </div>
              </div>

              <!-- Residual Error Readout -->
              <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                <span>Approximation Error |m_sec − f&apos;|</span>
                <span id="val-slope-error" class="text-slate-200">${formatNum(
                  Math.abs(appState.telemetry.secantSlope - appState.telemetry.exactSlope),
                  5
                )}</span>
              </div>
            </div>
          </div>

          <!-- Tactile Sliders & Limit Controls (Always Immediately Visible Below Canvas on Mobile!) -->
          <div class="glass-panel p-3 sm:p-5 space-y-3 sm:space-y-5 flex-1 flex flex-col justify-between">
            <div class="space-y-2.5 sm:space-y-5">
              <!-- Probe Position x0 Slider (Cyan) -->
              <div class="space-y-1 sm:space-y-2">
                <div class="flex items-center justify-between">
                  <label for="slider-x0" id="label-x0-slider" class="text-xs font-medium text-slate-200 flex items-center gap-2">
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>
                    ${lensOn ? 'Time Probe t₀ (s)' : 'Probe Position x₀'}
                  </label>
                  <span id="readout-x0" class="px-2 py-0.5 rounded-lg bg-cyanGlow/15 border border-cyanGlow/30 font-mono text-[11px] sm:text-xs text-cyanGlow font-semibold">
                    ${formatSigned(appState.lab.x0, 2)}
                  </span>
                </div>
                <input
                  id="slider-x0"
                  type="range"
                  min="${activePreset ? activePreset.xMin : -3}"
                  max="${activePreset ? activePreset.xMax : 3}"
                  step="0.02"
                  value="${appState.lab.x0}"
                  class="studio-slider-cyan"
                />
              </div>

              <!-- Step Size Δx Slider (Amber) -->
              <div class="space-y-1 sm:space-y-2">
                <div class="flex items-center justify-between">
                  <label for="slider-dx" id="label-dx-slider" class="text-xs font-medium text-slate-200 flex items-center gap-2">
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B]"></span>
                    ${lensOn ? 'Time Window Δt (s)' : 'Step Size Δx'}
                  </label>
                  <span id="readout-dx" class="px-2 py-0.5 rounded-lg bg-amberGlow/15 border border-amberGlow/30 font-mono text-[11px] sm:text-xs text-amberGlow font-semibold">
                    ${formatNum(appState.lab.dx, 3)}
                  </span>
                </div>
                <input
                  id="slider-dx"
                  type="range"
                  min="0.001"
                  max="2.2"
                  step="0.001"
                  value="${appState.lab.dx}"
                  class="studio-slider-amber"
                />
                <div class="hidden sm:flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0.001 (Tangent Limit)</span>
                  <span>2.200 (Wide Secant)</span>
                </div>
              </div>

              <!-- Action Row: Prominent Animate Limit Button + Compact Mobile Ribbon Toggle -->
              <div class="flex items-center gap-2 pt-0.5">
                <button
                  id="btn-animate-limit"
                  type="button"
                  class="flex-1 py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amberGlow via-amber-400 to-cyanGlow text-slate-950 font-display font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_24px_rgba(245,158,11,0.28)] hover:shadow-[0_0_38px_rgba(34,211,238,0.42)] hover:brightness-110 active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  <span id="animate-btn-icon" aria-hidden="true">▶</span>
                  <span id="animate-btn-text">${
                    lensOn ? 'Animate Δt → 0' : 'Animate Δx → 0'
                  }</span>
                </button>

                <label class="xl:hidden shrink-0 inline-flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-violetGlow/10 border border-violetGlow/30 text-[11px] font-mono text-violet-200 cursor-pointer select-none">
                  <input
                    id="toggle-deriv-ribbon-mobile"
                    type="checkbox"
                    ${appState.lab.showDerivativeCurve ? 'checked' : ''}
                    class="w-3.5 h-3.5 rounded accent-violet-400 cursor-pointer"
                  />
                  <span>${lensOn ? 'v(t)' : "f'(x)"}</span>
                </label>
              </div>
            </div>

            <!-- Toggle Switches & Stage Forward Link (Desktop xl) -->
            <div class="hidden xl:block pt-4 border-t border-white/10 space-y-3">
              <label class="flex items-center justify-between gap-3 cursor-pointer select-none group">
                <div class="flex items-center gap-2.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-violetGlow shadow-[0_0_8px_#A78BFA]"></span>
                  <div>
                    <div id="label-ribbon-toggle" class="text-xs font-medium text-slate-200 group-hover:text-white">
                      ${lensOn ? 'Show v(t) 3D Velocity Ribbon' : "Show f'(x) 3D Ribbon"}
                    </div>
                    <div class="text-[11px] text-slate-400">Parallel 3D slope projection track</div>
                  </div>
                </div>
                <input
                  id="toggle-deriv-ribbon"
                  type="checkbox"
                  ${appState.lab.showDerivativeCurve ? 'checked' : ''}
                  class="w-4 h-4 rounded accent-violet-400 cursor-pointer"
                />
              </label>

              <button
                id="btn-next-intuition"
                type="button"
                class="btn-glass w-full !justify-between !text-xs"
              >
                <span>Continue to Stage 2: Curve Intuition</span>
                <span class="text-cyanGlow" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      <!-- F1.1 Frontier Bridge Strip — Physical AI Upgrade -->
      <div
        id="f11-frontier-bridge"
        class="rounded-2xl bg-[#141820]/95 border border-cyanGlow/25 px-3.5 sm:px-5 py-3 sm:py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col lg:flex-row lg:items-center justify-between gap-3"
      >
        <div class="space-y-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyanGlow/15 border border-cyanGlow/40 font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-200">
              <span class="w-1.5 h-1.5 rounded-full bg-cyanGlow"></span>
              F1.1 • FRONTIER BRIDGE
            </span>
            <span class="font-display font-semibold text-xs sm:text-sm text-white">
              Why This Matters for Physical AI
            </span>
          </div>
          <p class="text-[11px] sm:text-xs text-slate-300/90 leading-relaxed max-w-3xl">
            Instantaneous derivatives scale directly into <strong class="text-white">3D Loss Landscapes</strong> (backprop), <strong class="text-violet-200">Diffusion Score Fields</strong> <span class="font-mono text-cyan-200">∇ₓ log p(x)</span> (<span class="font-mono text-violet-300">M1.1</span> / <span class="font-mono text-violet-300">M1.2</span>), and smooth SDF contact gradients in <strong class="text-emerald-200">Differentiable Physics</strong> (<span class="font-mono text-emerald-300">M3.1</span>).
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            data-bridge-jump="F1.2"
            class="px-3 py-1.5 rounded-xl bg-cyanGlow/15 border border-cyanGlow/45 text-cyan-100 hover:bg-cyanGlow/25 hover:border-cyanGlow/80 font-mono text-[11px] font-semibold transition-all cursor-pointer"
          >
            F1.2 Jacobians Lab →
          </button>
          <button
            type="button"
            data-bridge-jump="M1.1"
            class="px-3 py-1.5 rounded-xl bg-violetGlow/15 border border-violetGlow/45 text-violet-100 hover:bg-violetGlow/25 hover:border-violetGlow/80 font-mono text-[11px] font-semibold transition-all cursor-pointer"
          >
            M1.1 Diffusion vs. Regression →
          </button>
          <button
            type="button"
            data-bridge-jump="M4.1"
            class="px-3 py-1.5 rounded-xl bg-emeraldGlow/15 border border-emeraldGlow/45 text-emerald-100 hover:bg-emeraldGlow/25 hover:border-emeraldGlow/80 font-mono text-[11px] font-semibold transition-all cursor-pointer"
          >
            M4.1 CBF-QP Shield →
          </button>
        </div>
      </div>
    </section>
  `;

  container.querySelectorAll('[data-bridge-jump]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-bridge-jump');
      if (!targetId) return;
      playSfx('snap');
      handleLaunchDagNode(targetId);
    });
  });

  const sliderX0 = document.getElementById('slider-x0');
  const sliderDx = document.getElementById('slider-dx');
  syncSliderTrackFill(sliderX0);
  syncSliderTrackFill(sliderDx);

  // Mount Derivative3DStudio
  const canvasHost = document.getElementById('derivative-3d-canvas');
  let prevLocked = appState.telemetry.tangentLocked;

  const handleTelemetryUpdate = (t = {}) => {
    const currentPreset = getActivePreset(presets);
    const x0 =
      typeof t.x0 === 'number'
        ? t.x0
        : typeof t.x === 'number'
        ? t.x
        : appState.lab.x0;
    const dx =
      typeof t.dx === 'number'
        ? t.dx
        : typeof t.deltaX === 'number'
        ? t.deltaX
        : appState.lab.dx;

    appState.lab.x0 = x0;
    appState.lab.dx = dx;

    const computed = currentPreset
      ? computeLocalTelemetry(currentPreset, x0, dx)
      : appState.telemetry;

    appState.telemetry = {
      x0,
      dx,
      fx0: typeof t.fx0 === 'number' ? t.fx0 : computed.fx0,
      fx1: typeof t.fx1 === 'number' ? t.fx1 : computed.fx1,
      secantSlope:
        typeof t.secantSlope === 'number' ? t.secantSlope : computed.secantSlope,
      exactSlope:
        typeof t.exactSlope === 'number'
          ? t.exactSlope
          : typeof t.derivative === 'number'
          ? t.derivative
          : computed.exactSlope,
      tangentLocked: Math.abs(dx) <= 0.025,
    };

    if (sliderDx && document.activeElement !== sliderDx) {
      sliderDx.value = String(Math.max(0.001, Math.min(2.2, Math.abs(dx))));
      syncSliderTrackFill(sliderDx);
    }
    if (sliderX0 && document.activeElement !== sliderX0) {
      sliderX0.value = String(x0);
      syncSliderTrackFill(sliderX0);
    }

    if (appState.telemetry.tangentLocked && !prevLocked) {
      playSfx('snap');
    }
    prevLocked = appState.telemetry.tangentLocked;

    if (Math.abs(dx) <= 0.03) {
      markStageDone('3d-lab');
    }

    updateStage1TelemetryUI();
  };

  if (canvasHost && typeof Derivative3DStudio === 'function') {
    try {
      const studio = new Derivative3DStudio({
        fnKey: activePreset?.id || 'cubic',
        x: appState.lab.x0,
        dx: appState.lab.dx,
        showDerivative: appState.lab.showDerivativeCurve,
        showMechatronics: isMechatronicsLens(),
        onChange: handleTelemetryUpdate,
      });
      studio.init(canvasHost);
      studio.setCameraPreset(appState.lab.cameraPreset);
      studio.toggleDerivativeCurve(appState.lab.showDerivativeCurve);
      studio.toggleMechatronicsLens(isMechatronicsLens());
      activeInstances.studio3D = studio;
      handleTelemetryUpdate(studio.getMetrics());
    } catch (err) {
      console.error('[EIGENLAB] Derivative3DStudio mount error:', err);
      canvasHost.innerHTML = `
        <div class="w-full h-full flex items-center justify-center p-6 text-center text-slate-400 text-sm">
          WebGL 3D Viewport initializing… (${escapeHtml(err.message)})
        </div>
      `;
    }
  }

  updateStage1LensUI();
  updateStage1TelemetryUI();

  let cancelActiveLimitAnim = null;
  const finishAnimUI = () => {
    appState.lab.isAnimating = false;
    const on = isMechatronicsLens();
    const btnIcon = document.getElementById('animate-btn-icon');
    const btnText = document.getElementById('animate-btn-text');
    if (btnIcon) btnIcon.textContent = '▶';
    if (btnText) btnText.textContent = on ? 'Animate Limit Δt → 0' : 'Animate Limit Δx → 0';
  };
  const stopLimitAnim = () => {
    if (typeof cancelActiveLimitAnim === 'function') {
      cancelActiveLimitAnim();
      cancelActiveLimitAnim = null;
    }
    finishAnimUI();
  };
  activeInstances.cleanupFns.push(() => {
    if (typeof cancelActiveLimitAnim === 'function') {
      cancelActiveLimitAnim();
      cancelActiveLimitAnim = null;
    }
    appState.lab.isAnimating = false;
  });

  // Wire Function Preset Selector
  container.querySelectorAll('[data-preset-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-preset-id');
      if (!id) return;
      playSfx('tick');
      stopLimitAnim();
      appState.lab.presetId = id;
      const preset = getActivePreset(presets);

      container.querySelectorAll('[data-preset-id]').forEach((el) => {
        const active = el.getAttribute('data-preset-id') === id;
        el.className = `px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
          active
            ? 'bg-cyanGlow/15 border-cyanGlow/50 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.2)]'
            : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
        }`;
      });

      if (preset) {
        if (sliderX0) {
          sliderX0.min = String(preset.xMin);
          sliderX0.max = String(preset.xMax);
          appState.lab.x0 = preset.defaultX;
          sliderX0.value = String(preset.defaultX);
          syncSliderTrackFill(sliderX0);
        }
        const metrics = activeInstances.studio3D?.setFunction?.(id);
        handleTelemetryUpdate(metrics || { x: appState.lab.x0, dx: appState.lab.dx });
        updateStage1LensUI();
      }
    });
  });

  // Wire Camera Angle Presets
  container.querySelectorAll('[data-camera-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const camId = btn.getAttribute('data-camera-preset');
      if (!camId) return;
      playSfx('tick');
      appState.lab.cameraPreset = camId;
      container.querySelectorAll('[data-camera-preset]').forEach((el) => {
        const active = el.getAttribute('data-camera-preset') === camId;
        el.className = `px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
          active
            ? 'bg-white/15 text-white border border-white/20 shadow-sm'
            : 'text-slate-400 border border-transparent hover:text-white'
        }`;
      });
      activeInstances.studio3D?.setCameraPreset?.(camId);
    });
  });

  // Wire x0 Slider
  sliderX0?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    syncSliderTrackFill(sliderX0);
    appState.lab.x0 = val;
    playSfx('tick');
    const metrics = activeInstances.studio3D?.setX?.(val);
    if (!metrics) handleTelemetryUpdate({ x: val, dx: appState.lab.dx });
  });

  // Wire Δx Slider
  sliderDx?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (appState.lab.isAnimating) stopLimitAnim();
    syncSliderTrackFill(sliderDx);
    appState.lab.dx = val;
    playSfx('tick');
    const metrics = activeInstances.studio3D?.setDeltaX?.(val);
    if (!metrics) handleTelemetryUpdate({ x: appState.lab.x0, dx: val });
  });

  // Wire Derivative 3D Ribbon Toggle (Desktop + Mobile synced)
  const ribbonToggle = document.getElementById('toggle-deriv-ribbon');
  const ribbonToggleMobile = document.getElementById('toggle-deriv-ribbon-mobile');
  const syncRibbon = (checked) => {
    playSfx('snap');
    appState.lab.showDerivativeCurve = !!checked;
    if (ribbonToggle) ribbonToggle.checked = appState.lab.showDerivativeCurve;
    if (ribbonToggleMobile) ribbonToggleMobile.checked = appState.lab.showDerivativeCurve;
    activeInstances.studio3D?.toggleDerivativeCurve?.(appState.lab.showDerivativeCurve);
  };
  ribbonToggle?.addEventListener('change', (e) => syncRibbon(e.target.checked));
  ribbonToggleMobile?.addEventListener('change', (e) => syncRibbon(e.target.checked));

  // Wire Mobile KaTeX Difference Quotient Drawer Toggle
  const formulaBtn = document.getElementById('btn-toggle-mobile-formula');
  const formulaDrawer = document.getElementById('mobile-formula-drawer');
  formulaBtn?.addEventListener('click', () => {
    playSfx('tick');
    if (!formulaDrawer) return;
    const isHidden = formulaDrawer.classList.contains('hidden');
    formulaDrawer.classList.toggle('hidden', !isHidden);
    formulaBtn.setAttribute('aria-expanded', String(isHidden));
    formulaBtn.textContent = isHidden ? 'ƒ ▴' : 'ƒ ▾';
  });

  // Wire Animate Limit Δx → 0 Button (synced live with studio.animateLimit(onFrame))
  const animateBtn = document.getElementById('btn-animate-limit');
  animateBtn?.addEventListener('click', () => {
    playSfx('snap');
    markStageDone('3d-lab');
    stopLimitAnim();

    const studio = activeInstances.studio3D;
    if (!studio || typeof studio.animateLimit !== 'function') return;

    appState.lab.isAnimating = true;
    const btnText = document.getElementById('animate-btn-text');
    const btnIcon = document.getElementById('animate-btn-icon');
    if (btnIcon) btnIcon.textContent = '◉';
    if (btnText) {
      btnText.textContent = isMechatronicsLens()
        ? 'Converging Δt → 0...'
        : 'Converging Δx → 0...';
    }

    cancelActiveLimitAnim = studio.animateLimit((metrics) => {
      if (metrics && Math.abs(metrics.dx) <= 0.0012) {
        cancelActiveLimitAnim = null;
        finishAnimUI();
      }
    });
  });

  document.getElementById('btn-next-intuition')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('intuition');
  });
}

function updateStage1LensUI() {
  const presets = normalizePresets();
  const preset = getActivePreset(presets);
  const on = isMechatronicsLens();

  const fxEl = document.getElementById('hud-fx-math');
  const dfxEl = document.getElementById('hud-dfx-math');
  if (preset) {
    const fTex = on ? preset.mechLatex || toMechatronicsFormula(preset.latex, false) : preset.latex;
    const dfTex = on
      ? preset.mechDerivLatex || toMechatronicsFormula(preset.derivLatex, true)
      : preset.derivLatex;
    typesetMath(fxEl, fTex, false);
    typesetMath(dfxEl, dfTex, false);
  }

  const curveLabel = document.getElementById('hud-curve-label');
  if (curveLabel) {
    curveLabel.textContent = on
      ? preset?.mechatronicsLabel || 'Actuator Displacement & Velocity'
      : 'Active Curve & Exact Derivative';
  }

  const mechInd = document.getElementById('hud-mech-indicator');
  const mechText = document.getElementById('hud-mech-text');
  if (mechInd && mechText) {
    mechInd.className = `hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
      on
        ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
        : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
    }`;
    const dot = mechInd.querySelector('span');
    if (dot) {
      dot.className = `w-2 h-2 rounded-full ${on ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}`;
    }
    mechText.textContent = on ? '3D Servo Actuator: SYNCED' : '3D Actuator: Standby';
  }

  const x0Label = document.getElementById('label-x0-slider');
  if (x0Label) {
    x0Label.innerHTML = `<span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>${
      on ? 'Time Probe t₀ (s)' : 'Probe Position x₀'
    }`;
  }
  const dxLabel = document.getElementById('label-dx-slider');
  if (dxLabel) {
    dxLabel.innerHTML = `<span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B]"></span>${
      on ? 'Time Window Δt (s)' : 'Step Size Δx'
    }`;
  }

  const ribbonLabel = document.getElementById('label-ribbon-toggle');
  if (ribbonLabel) {
    ribbonLabel.textContent = on ? 'Show v(t) 3D Velocity Ribbon' : "Show f'(x) 3D Ribbon";
  }

  const secMetric = document.getElementById('label-secant-metric');
  if (secMetric) secMetric.textContent = on ? 'Avg Velocity Δx/Δt' : 'Secant Slope Δy/Δx';

  const exactMetric = document.getElementById('label-exact-metric');
  if (exactMetric) exactMetric.textContent = on ? 'Instant v(t₀)' : "Exact f'(x₀)";

  if (!appState.lab.isAnimating) {
    const btnText = document.getElementById('animate-btn-text');
    if (btnText) btnText.textContent = on ? 'Animate Δt → 0' : 'Animate Δx → 0';
  }
}

function updateStage1TelemetryUI() {
  const t = appState.telemetry;
  const on = isMechatronicsLens();

  const rX0 = document.getElementById('readout-x0');
  if (rX0) rX0.textContent = formatSigned(t.x0, 2);

  const rDx = document.getElementById('readout-dx');
  if (rDx) rDx.textContent = formatNum(t.dx, 3);

  const secVal = document.getElementById('val-secant-slope');
  if (secVal) secVal.textContent = formatNum(t.secantSlope, 4);

  const exactVal = document.getElementById('val-exact-slope');
  if (exactVal) exactVal.textContent = formatNum(t.exactSlope, 4);

  const secCompact = document.getElementById('val-secant-slope-compact');
  if (secCompact) secCompact.textContent = formatNum(t.secantSlope, 3);

  const exactCompact = document.getElementById('val-exact-slope-compact');
  if (exactCompact) exactCompact.textContent = formatNum(t.exactSlope, 3);

  const errVal = document.getElementById('val-slope-error');
  if (errVal) errVal.textContent = formatNum(Math.abs(t.secantSlope - t.exactSlope), 5);

  const badge = document.getElementById('badge-tangent-locked');
  if (badge) {
    if (t.tangentLocked) {
      badge.textContent = 'TANGENT ✓';
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-emeraldGlow/20 border-emeraldGlow/60 text-emeraldGlow shadow-[0_0_18px_rgba(52,211,153,0.3)]';
    } else {
      badge.textContent = 'SECANT';
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-amberGlow/15 border-amberGlow/30 text-amberGlow';
    }
  }

  const quotientEl = document.getElementById('telemetry-quotient-katex');
  if (quotientEl) {
    const slopeStr = formatNum(t.secantSlope, 3);
    const tex = on
      ? `\\frac{\\Delta x}{\\Delta t} = \\frac{x(t_0+\\Delta t)-x(t_0)}{\\Delta t} \\approx ${slopeStr}`
      : `\\frac{\\Delta y}{\\Delta x} = \\frac{f(x_0+\\Delta x)-f(x_0)}{\\Delta x} \\approx ${slopeStr}`;
    typesetMath(quotientEl, tex, true);
  }
}

// ---------------------------------------------------------------------------
// STAGE 2 — Curve & Derivative Intuition (`intuition`)
// ---------------------------------------------------------------------------

function mountStage2Intuition(container) {
  const on = isMechatronicsLens();
  const s = getStoreState();
  const solvedDerivQuizzes = (s.solvedQuizzes || []).filter(
    (id) => !String(id).startsWith('int-quiz-') && !String(id).startsWith('de-quiz-') && !String(id).startsWith('la-quiz-') && !String(id).startsWith('pid-quiz-') && !String(id).startsWith('mod-quiz-') && !String(id).startsWith('freq-quiz-') && !String(id).startsWith('ss-quiz-')
  ).length;
  let activeSubTab = 'lab'; // 'lab' | 'quiz' on mobile (<lg)

  container.innerHTML = `
    <section class="space-y-3 lg:space-y-6 view-enter">
      <!-- Mobile Segmented Sub-Tab Switcher (<lg) so Explorer & Visual Quiz never force long vertical scrolling -->
      <div class="lg:hidden grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#0E121C]/90 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <button
          type="button"
          data-stage2-subtab="lab"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-cyanGlow/20 border border-cyanGlow/45 text-cyan-100 shadow-sm"
        >
          📈 3-Graph Explorer
        </button>
        <button
          type="button"
          data-stage2-subtab="quiz"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white"
        >
          🎯 Match Quiz (${solvedDerivQuizzes}/8)
        </button>
      </div>

      <!-- Stacked Interactive Curve Lab -->
      <div id="stage2-panel-lab" class="glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-cyanGlow">Interactive Dual-Graph Lab</div>
            <h2 id="stage2-lab-title" class="font-display font-bold text-xl text-white mt-0.5">
              ${on ? 'Synchronized Position x(t) & Velocity v(t)' : "Synchronized f(x) & Derivative f'(x)"}
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Scrub along the curve to see how peaks, troughs, and inflection points map directly to zeros and extrema in the derivative.
            </p>
          </div>
          <span class="px-3 py-1 rounded-full text-[11px] font-mono bg-white/[0.04] border border-white/10 text-slate-300">
            Hover or drag cursor across graph
          </span>
        </div>

        <div id="stacked-derivative-lab-host" class="w-full min-h-[300px] sm:min-h-[380px]"></div>

        <div class="lg:hidden flex justify-end pt-0.5">
          <button
            type="button"
            id="btn-mobile-jump-quiz"
            class="btn-glow-cyan !py-2 !px-3.5 !text-xs !rounded-xl w-full"
          >
            Test Your Intuition: Match the Derivative Quiz →
          </button>
        </div>
      </div>

      <!-- Visual "Match the Derivative" Quiz Engine -->
      <div id="stage2-panel-quiz" class="hidden lg:block glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-violetGlow">Visual Pattern Mastery</div>
            <h2 class="font-display font-bold text-xl text-white mt-0.5">Match the Derivative Challenges</h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Inspect slope signs, horizontal tangents, and steepness on the top curve—then pick its matching derivative graph.
            </p>
          </div>
          <button
            id="btn-next-solver"
            type="button"
            class="btn-glass !text-xs"
          >
            Next: Step Solver →
          </button>
        </div>

        <div id="visual-quiz-engine-host" class="w-full min-h-[280px] sm:min-h-[320px]"></div>
      </div>
    </section>
  `;

  const panelLab = document.getElementById('stage2-panel-lab');
  const panelQuiz = document.getElementById('stage2-panel-quiz');
  const setSubTab = (tab) => {
    activeSubTab = tab;
    if (panelLab && panelQuiz) {
      panelLab.classList.toggle('hidden', tab !== 'lab');
      panelLab.classList.add('lg:block');
      panelQuiz.classList.toggle('hidden', tab !== 'quiz');
      panelQuiz.classList.add('lg:block');
    }
    container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
      const isAct = btn.getAttribute('data-stage2-subtab') === tab;
      btn.className = isAct
        ? 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-cyanGlow/20 border border-cyanGlow/45 text-cyan-100 shadow-sm'
        : 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white';
    });
    // Force crisp high-DPI canvas redraw immediately after un-hiding on mobile
    requestAnimationFrame(() => {
      if (tab === 'lab') {
        activeInstances.stackedLab?._resizeAll?.();
        activeInstances.stackedLab?._drawAll?.();
      } else {
        activeInstances.quizEngine?._resizeCanvases?.();
        activeInstances.quizEngine?._drawCanvases?.();
      }
      window.dispatchEvent(new Event('resize'));
    });
  };

  container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-stage2-subtab');
      if (next && next !== activeSubTab) {
        playSfx('tick');
        setSubTab(next);
      }
    });
  });

  document.getElementById('btn-mobile-jump-quiz')?.addEventListener('click', () => {
    playSfx('tick');
    setSubTab('quiz');
  });

  const labHost = document.getElementById('stacked-derivative-lab-host');
  if (labHost && typeof StackedDerivativeLab === 'function') {
    try {
      activeInstances.stackedLab = new StackedDerivativeLab(labHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onInteract: () => markStageDone('intuition'),
        onComplete: () => markStageDone('intuition'),
      });
    } catch (err) {
      console.error('[EIGENLAB] StackedDerivativeLab mount error:', err);
    }
  }

  const quizHost = document.getElementById('visual-quiz-engine-host');
  if (quizHost && typeof VisualQuizEngine === 'function') {
    try {
      const updateQuizTabCount = () => {
        const solvedDeriv = (getStoreState().solvedQuizzes || []).filter(
          (id) => !String(id).startsWith('int-quiz-') && !String(id).startsWith('de-quiz-') && !String(id).startsWith('la-quiz-') && !String(id).startsWith('pid-quiz-') && !String(id).startsWith('mod-quiz-') && !String(id).startsWith('freq-quiz-') && !String(id).startsWith('ss-quiz-') && !String(id).startsWith('kin-quiz-')
        ).length;
        const quizBtn = container.querySelector('[data-stage2-subtab="quiz"]');
        if (quizBtn) quizBtn.textContent = `🎯 Match Quiz (${solvedDeriv}/8)`;
      };
      activeInstances.quizEngine = new VisualQuizEngine(quizHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onAnswer: () => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateQuizTabCount();
        },
        onProgress: () => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateQuizTabCount();
        },
        onComplete: () => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateQuizTabCount();
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] VisualQuizEngine mount error:', err);
    }
  }

  document.getElementById('btn-next-solver')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('solver');
  });
}

// ---------------------------------------------------------------------------
// STAGE 3 — Paperless Step Solver (`solver`)
// ---------------------------------------------------------------------------

function mountStage3Solver(container) {
  container.innerHTML = `
    <section class="max-w-4xl mx-auto space-y-3 sm:space-y-5 view-enter">
      <div class="hidden md:flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-emeraldGlow">Interactive Symbolic Drill</div>
          <h2 class="font-display font-bold text-2xl text-white mt-0.5">Paperless Step-by-Step Derivative Solver</h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
            Identify the differentiation rule, verify each algebraic transformation, and build muscle memory across 18 curated engineering problems.
          </p>
        </div>

        <button
          id="btn-next-word-problems"
          type="button"
          class="btn-glass !text-xs"
        >
          Next: Word Problems →
        </button>
      </div>

      <div id="paperless-solver-host" class="glass-panel p-2.5 sm:p-5 md:p-6 min-h-[420px]"></div>
    </section>
  `;

  const host = document.getElementById('paperless-solver-host');
  if (host && typeof PaperlessStepSolver === 'function') {
    try {
      activeInstances.stepSolver = new PaperlessStepSolver(host, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onSolve: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProblemSolved: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProgress: (info) => {
          if (!info || (info.solvedCount ?? 1) >= 1) {
            markStageDone('solver');
            updateLessonStageDotsUI();
          }
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] PaperlessStepSolver mount error:', err);
    }
  }

  if (getMasterySnapshot().solvedProblems >= 1) {
    markStageDone('solver');
  }

  document.getElementById('btn-next-word-problems')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('word-problems');
  });
}

// ---------------------------------------------------------------------------
// STAGE 4 — Applied Word Problems Queue (`word-problems`)
// ---------------------------------------------------------------------------

function enrichPlannedTopic(entry, idx) {
  const defaultAccents = ['amber', 'cyan', 'violet', 'emerald'];
  if (typeof entry === 'string') {
    const meta = PLANNED_TOPIC_METADATA[entry] || {};
    return {
      title: entry,
      domain: meta.domain || ['Mechatronics', 'Electronics', 'Physics', 'AI & ML'][idx % 4],
      accent: meta.accent || defaultAccents[idx % 4],
      equation: meta.equation || '',
      summary:
        meta.summary ||
        'Interactive real-world engineering modeling problem queued for this module.',
    };
  }
  const title = entry?.title || entry?.name || 'Engineering Topic';
  const meta = PLANNED_TOPIC_METADATA[title] || {};
  return {
    title,
    domain: entry?.domain || entry?.tag || meta.domain || 'Engineering',
    accent: entry?.accent || meta.accent || defaultAccents[idx % 4],
    equation: entry?.equation || entry?.latex || entry?.previewEquation || meta.equation || '',
    summary: entry?.summary || entry?.description || meta.summary || '',
  };
}

// ---------------------------------------------------------------------------
// LESSON 02 — INTEGRALS STUDIO (`calc-integrals`) STAGES 1–3
// ---------------------------------------------------------------------------

function mountIntegralStage1Lab3D(container) {
  const presets = normalizeIntegralPresets();
  const activePreset = getActiveIntegralPreset(presets);
  const lensOn = isMechatronicsLens();

  if (activePreset) {
    if (
      appState.integralLab.b < activePreset.xMin ||
      appState.integralLab.b > activePreset.xMax
    ) {
      appState.integralLab.a = activePreset.defaultA;
      appState.integralLab.b = activePreset.defaultB;
    }
  }

  container.innerHTML = `
    <section class="space-y-2 sm:space-y-4 view-enter">
      <!-- Top Preset Strip + Camera Angle Presets -->
      <div class="flex items-center justify-between gap-2 sm:gap-3">
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar xl:flex-wrap flex-1 min-w-0 py-0.5" role="tablist" aria-label="Integral curve presets">
          ${presets
            .map((p) => {
              const isSelected = activePreset && p.id === activePreset.id;
              return `
                <button
                  type="button"
                  data-int-preset-id="${escapeHtml(p.id)}"
                  class="shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyanGlow/15 border-cyanGlow/50 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.2)]'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }"
                >
                  ${escapeHtml(p.name)}
                </button>
              `;
            })
            .join('')}
        </div>

        <div class="hidden xl:flex items-center gap-1 bg-slate-900/75 p-1 rounded-xl border border-white/10 shrink-0">
          ${[
            { id: '3d', label: '3D Studio' },
            { id: 'front', label: 'Front 2D Graph' },
            { id: 'iso', label: 'Isometric' },
          ]
            .map((cam) => {
              const active = appState.integralLab.cameraPreset === cam.id;
              return `
                <button
                  type="button"
                  data-int-camera-preset="${cam.id}"
                  class="px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    active
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 border border-transparent hover:text-white'
                  }"
                >
                  ${cam.label}
                </button>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- Main Split-Screen Mobile / Full-Bleed Desktop 3D Riemann Studio -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-2.5 sm:gap-4 items-stretch">
        <!-- 3D Viewport Canvas Container -->
        <div class="xl:col-span-8 canvas-stage relative h-[36dvh] min-h-[210px] max-h-[295px] sm:h-[420px] sm:max-h-none xl:h-[calc(100vh-210px)] xl:min-h-[540px] flex flex-col">
          <div id="integral-3d-canvas" class="absolute inset-0 w-full h-full"></div>

          <!-- Top-Left Floating Equation HUD -->
          <div class="pointer-events-none relative z-10 flex items-start justify-between gap-2 p-2.5 sm:p-4">
            <div class="pointer-events-auto rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-3 bg-[#0B0D12]/80 backdrop-blur-xl border border-white/15 shadow-lg max-w-full">
              <div class="hidden sm:flex items-center gap-2 mb-1.5">
                <span class="w-2 h-2 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>
                <span id="int-hud-curve-label" class="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  ${lensOn ? 'Velocity Rate & Accumulated Stroke' : 'Integrand f(x) & Antiderivative F(x)'}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-x-2.5 sm:gap-x-4 gap-y-0.5 text-xs sm:text-sm text-white">
                <span id="int-hud-fx-math" class="text-cyan-200"></span>
                <span class="hidden sm:inline text-slate-600">|</span>
                <span id="int-hud-Fx-math" class="hidden sm:inline text-violet-300"></span>
              </div>
            </div>

            <!-- Mechatronics Accumulator Gauge Indicator (Desktop/Tablet) -->
            <div id="int-hud-mech-indicator" class="hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
              lensOn
                ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
                : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
            }">
              <div class="flex items-center gap-2 text-[11px] font-mono">
                <span class="w-2 h-2 rounded-full ${lensOn ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}"></span>
                <span id="int-hud-mech-text">${lensOn ? '3D Accumulator Gauge: SYNCED' : '3D Gauge: Standby'}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Legend + Compact Mobile Camera Switcher -->
          <div class="pointer-events-none relative z-10 mt-auto p-2 sm:p-4 flex items-center justify-between gap-2">
            <div class="hidden sm:inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300">
              <span><span class="text-emeraldGlow">■</span> +Area</span>
              <span><span class="text-rose-400">■</span> −Area</span>
              <span><span class="text-amberGlow">●</span> Limit b</span>
              <span><span class="text-violetGlow">●</span> F(x) Ribbon</span>
            </div>

            <div class="pointer-events-auto xl:hidden ml-auto flex items-center gap-0.5 bg-[#0B0D12]/80 backdrop-blur-md p-0.5 rounded-xl border border-white/15">
              ${[
                { id: '3d', label: '3D' },
                { id: 'front', label: '2D' },
                { id: 'iso', label: 'Iso' },
              ]
                .map((cam) => {
                  const active = appState.integralLab.cameraPreset === cam.id;
                  return `
                    <button
                      type="button"
                      data-int-camera-preset="${cam.id}"
                      class="px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                        active
                          ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                          : 'text-slate-400 border border-transparent hover:text-white'
                      }"
                    >
                      ${cam.label}
                    </button>
                  `;
                })
                .join('')}
            </div>

            <div class="hidden xl:inline-flex items-center px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-400">
              Drag to orbit • Scroll to zoom
            </div>
          </div>
        </div>

        <!-- Tactile Riemann Control Deck & Live Telemetry Card -->
        <aside class="xl:col-span-4 flex flex-col gap-2 sm:gap-4 xl:h-[calc(100vh-210px)] xl:overflow-y-auto studio-scroll pr-0.5">
          <!-- Compact 1-Row Mobile Telemetry / Expanded Desktop KaTeX Telemetry -->
          <div class="glass-panel p-2.5 sm:p-5 space-y-2 sm:space-y-4">
            <div class="flex items-center justify-between gap-2">
              <div class="hidden xl:block">
                <div class="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-400">Live Accumulation Telemetry</div>
                <h2 class="font-display font-semibold text-sm text-white mt-0.5">Riemann Sum vs. Definite Integral</h2>
              </div>

              <!-- Mobile Compact Inline Readout -->
              <div class="flex xl:hidden items-center gap-2 min-w-0 flex-1">
                <div class="flex-1 min-w-0 rounded-xl px-2.5 py-1 bg-amberGlow/[0.08] border border-amberGlow/25">
                  <div class="text-[9px] font-mono uppercase tracking-wider text-amberGlow/90 truncate">Riemann</div>
                  <div id="int-val-riemann-compact" class="font-mono font-semibold text-sm text-white leading-tight">0.000</div>
                </div>
                <div class="flex-1 min-w-0 rounded-xl px-2.5 py-1 bg-emeraldGlow/[0.08] border border-emeraldGlow/25">
                  <div class="text-[9px] font-mono uppercase tracking-wider text-emeraldGlow/90 truncate">
                    ${lensOn ? 'Net Δx' : 'Exact ∫'}
                  </div>
                  <div id="int-val-exact-compact" class="font-mono font-semibold text-sm text-emeraldGlow leading-tight">0.000</div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <div
                  id="int-badge-exact"
                  class="px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-amberGlow/15 border-amberGlow/30 text-amberGlow"
                >
                  RIEMANN
                </div>
                <button
                  id="int-btn-toggle-mobile-formula"
                  type="button"
                  aria-expanded="false"
                  title="Toggle KaTeX integral formula"
                  class="xl:hidden px-2 py-1 rounded-lg bg-white/[0.05] border border-white/15 text-[11px] font-mono text-cyan-200 cursor-pointer"
                >
                  ∫ ▾
                </button>
              </div>
            </div>

            <!-- Collapsible on Mobile (<xl), Always Open on Desktop (xl:block) -->
            <div id="int-mobile-formula-drawer" class="hidden xl:block space-y-3 sm:space-y-4">
              <div class="katex-card flex items-center justify-center min-h-[60px] sm:min-h-[76px]">
                <div id="int-telemetry-katex" class="text-slate-100 text-xs sm:text-sm overflow-x-auto"></div>
              </div>

              <div class="hidden xl:grid grid-cols-2 gap-3">
                <div class="rounded-2xl p-3.5 bg-amberGlow/[0.06] border border-amberGlow/25">
                  <div id="int-label-riemann" class="text-[10px] font-mono uppercase tracking-wider text-amberGlow/90">
                    Riemann Sum (N=${appState.integralLab.n})
                  </div>
                  <div id="int-val-riemann" class="font-mono font-semibold text-xl text-white mt-1">0.0000</div>
                </div>
                <div class="rounded-2xl p-3.5 bg-emeraldGlow/[0.06] border border-emeraldGlow/25">
                  <div id="int-label-exact" class="text-[10px] font-mono uppercase tracking-wider text-emeraldGlow/90">
                    ${lensOn ? 'Exact Displacement Δx' : 'Exact Integral ∫ f dx'}
                  </div>
                  <div id="int-val-exact" class="font-mono font-semibold text-xl text-emeraldGlow mt-1">0.0000</div>
                </div>
              </div>

              <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                <span>Signed Split (+ / −)</span>
                <span id="int-val-signed" class="text-slate-200">+0.00 / -0.00</span>
              </div>
            </div>
          </div>

          <!-- Tactile Sliders, Rule Switcher & Animate N → ∞ -->
          <div class="glass-panel p-2.5 sm:p-5 space-y-2.5 sm:space-y-4 flex-1 flex flex-col justify-between">
            <div class="space-y-2 sm:space-y-4">
              <!-- Upper Limit b Slider (Amber) -->
              <div class="space-y-1 sm:space-y-1.5">
                <div class="flex items-center justify-between">
                  <label for="slider-int-b" id="label-int-b" class="text-xs font-medium text-slate-200 flex items-center gap-2">
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B]"></span>
                    ${lensOn ? 'End Time b (s)' : 'Upper Limit b'}
                  </label>
                  <span id="readout-int-b" class="px-2 py-0.5 rounded-lg bg-amberGlow/15 border border-amberGlow/30 font-mono text-[11px] sm:text-xs text-amberGlow font-semibold">
                    ${formatSigned(appState.integralLab.b, 2)}
                  </span>
                </div>
                <input
                  id="slider-int-b"
                  type="range"
                  min="${activePreset ? activePreset.xMin : -2.8}"
                  max="${activePreset ? activePreset.xMax : 2.8}"
                  step="0.05"
                  value="${appState.integralLab.b}"
                  class="studio-slider-amber"
                />
              </div>

              <!-- Subdivisions N Slider (Cyan) + Compact Rule Pills -->
              <div class="space-y-1 sm:space-y-1.5">
                <div class="flex items-center justify-between gap-2">
                  <label for="slider-int-n" class="text-xs font-medium text-slate-200 flex items-center gap-2">
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>
                    Slices N
                  </label>
                  <div class="flex items-center gap-1">
                    <div class="inline-flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-white/10">
                      ${[
                        { id: 'left', label: 'L' },
                        { id: 'midpoint', label: 'Mid' },
                        { id: 'right', label: 'R' },
                      ]
                        .map((r) => {
                          const act = appState.integralLab.rule === r.id;
                          return `
                            <button
                              type="button"
                              data-int-rule="${r.id}"
                              class="px-2 py-0.5 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
                                act
                                  ? 'bg-cyanGlow/20 text-cyan-200 border border-cyanGlow/45'
                                  : 'text-slate-400 border border-transparent hover:text-white'
                              }"
                            >${r.label}</button>
                          `;
                        })
                        .join('')}
                    </div>
                    <span id="readout-int-n" class="px-2 py-0.5 rounded-lg bg-cyanGlow/15 border border-cyanGlow/30 font-mono text-[11px] sm:text-xs text-cyanGlow font-semibold">
                      ${appState.integralLab.n}
                    </span>
                  </div>
                </div>
                <input
                  id="slider-int-n"
                  type="range"
                  min="4"
                  max="80"
                  step="1"
                  value="${appState.integralLab.n}"
                  class="studio-slider-cyan"
                />
              </div>

              <!-- Action Row: Animate N → ∞ + Mobile F(x) Ribbon Toggle -->
              <div class="flex items-center gap-2 pt-0.5">
                <button
                  id="btn-animate-refine"
                  type="button"
                  class="flex-1 py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emeraldGlow via-cyanGlow to-violetGlow text-slate-950 font-display font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_24px_rgba(34,211,238,0.28)] hover:brightness-110 active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  <span id="int-anim-icon" aria-hidden="true">▶</span>
                  <span id="int-anim-text">Animate N → ∞</span>
                </button>

                <label class="xl:hidden shrink-0 inline-flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-violetGlow/10 border border-violetGlow/30 text-[11px] font-mono text-violet-200 cursor-pointer select-none">
                  <input
                    id="toggle-accum-ribbon-mobile"
                    type="checkbox"
                    ${appState.integralLab.showAccumulation ? 'checked' : ''}
                    class="w-3.5 h-3.5 rounded accent-violet-400 cursor-pointer"
                  />
                  <span>${lensOn ? 'x(t)' : 'F(x)'}</span>
                </label>
              </div>
            </div>

            <!-- Desktop F(x) Ribbon Toggle + Stage 2 Forward Link -->
            <div class="hidden xl:block pt-4 border-t border-white/10 space-y-3">
              <label class="flex items-center justify-between gap-3 cursor-pointer select-none group">
                <div class="flex items-center gap-2.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-violetGlow shadow-[0_0_8px_#A78BFA]"></span>
                  <div>
                    <div id="int-label-ribbon" class="text-xs font-medium text-slate-200 group-hover:text-white">
                      ${lensOn ? 'Show x(t) 3D Displacement Ribbon' : 'Show F(x) 3D Accumulation Ribbon'}
                    </div>
                    <div class="text-[11px] text-slate-400">Parallel 3D antiderivative track</div>
                  </div>
                </div>
                <input
                  id="toggle-accum-ribbon"
                  type="checkbox"
                  ${appState.integralLab.showAccumulation ? 'checked' : ''}
                  class="w-4 h-4 rounded accent-violet-400 cursor-pointer"
                />
              </label>

              <button
                id="btn-int-next-intuition"
                type="button"
                class="btn-glass w-full !justify-between !text-xs"
              >
                <span>Continue to Stage 2: FTC &amp; Area Intuition</span>
                <span class="text-cyanGlow" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;

  const sliderB = document.getElementById('slider-int-b');
  const sliderN = document.getElementById('slider-int-n');
  syncSliderTrackFill(sliderB);
  syncSliderTrackFill(sliderN);

  const canvasHost = document.getElementById('integral-3d-canvas');
  let prevLocked = false;

  const handleIntegralTelemetry = (m = {}) => {
    const a = Number.isFinite(m.a) ? m.a : appState.integralLab.a;
    const b = Number.isFinite(m.b) ? m.b : appState.integralLab.b;
    const n = Number.isFinite(m.n) ? m.n : appState.integralLab.n;
    const rule = m.rule || appState.integralLab.rule;

    appState.integralLab.a = a;
    appState.integralLab.b = b;
    appState.integralLab.n = n;
    appState.integralLab.rule = rule;

    const riemannSum = Number.isFinite(m.riemannSum) ? m.riemannSum : 0;
    const exactIntegral = Number.isFinite(m.exactIntegral) ? m.exactIntegral : 0;
    const error = Number.isFinite(m.error) ? m.error : Math.abs(riemannSum - exactIntegral);
    const positiveArea = Number.isFinite(m.positiveArea) ? m.positiveArea : 0;
    const negativeArea = Number.isFinite(m.negativeArea) ? m.negativeArea : 0;
    const isExactLocked = Boolean(m.isExactLocked ?? (n >= 64 || error < 0.015));

    appState.integralTelemetry = {
      a,
      b,
      n,
      rule,
      riemannSum,
      exactIntegral,
      error,
      positiveArea,
      negativeArea,
      fb: Number.isFinite(m.fb) ? m.fb : 0,
      isExactLocked,
    };

    if (sliderB && Math.abs(parseFloat(sliderB.value) - b) > 0.005) {
      sliderB.value = String(b);
      syncSliderTrackFill(sliderB);
    }
    if (sliderN && Math.abs(parseInt(sliderN.value, 10) - n) >= 1) {
      sliderN.value = String(n);
      syncSliderTrackFill(sliderN);
    }

    if (isExactLocked && !prevLocked) {
      playSfx('success');
      markStageDone('3d-lab');
    }
    prevLocked = isExactLocked;

    updateIntegralStage1TelemetryUI();
  };

  if (canvasHost && typeof Integral3DStudio === 'function') {
    try {
      const studio = new Integral3DStudio({
        fnKey: activePreset?.id || 'parabola',
        a: appState.integralLab.a,
        b: appState.integralLab.b,
        n: appState.integralLab.n,
        rule: appState.integralLab.rule,
        showAccumulation: appState.integralLab.showAccumulation,
        showMechatronics: lensOn,
        onChange: handleIntegralTelemetry,
      });
      studio.init(canvasHost);
      studio.setCameraPreset?.(appState.integralLab.cameraPreset);
      activeInstances.studio3D = studio;
      const initMetrics = studio.getMetrics?.();
      if (initMetrics) handleIntegralTelemetry(initMetrics);
    } catch (err) {
      console.error('[EIGENLAB] Integral3DStudio init error:', err);
    }
  }

  updateIntegralStage1LensUI();
  updateIntegralStage1TelemetryUI();

  let cancelRefineAnim = null;
  const finishRefineUI = () => {
    appState.integralLab.isAnimating = false;
    const icon = document.getElementById('int-anim-icon');
    const txt = document.getElementById('int-anim-text');
    if (icon) icon.textContent = '▶';
    if (txt) txt.textContent = 'Animate N → ∞';
  };
  const stopRefineAnim = () => {
    if (typeof cancelRefineAnim === 'function') {
      try {
        cancelRefineAnim();
      } catch {
        // Ignore
      }
      cancelRefineAnim = null;
    }
    finishRefineUI();
  };
  activeInstances.cleanupFns.push(stopRefineAnim);

  // Wire Integral Preset Pills
  container.querySelectorAll('[data-int-preset-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-int-preset-id');
      if (!id || id === appState.integralLab.presetId) return;
      playSfx('tick');
      stopRefineAnim();
      appState.integralLab.presetId = id;
      const preset = presets.find((p) => p.id === id);

      container.querySelectorAll('[data-int-preset-id]').forEach((el) => {
        const sel = el.getAttribute('data-int-preset-id') === id;
        el.className = `shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
          sel
            ? 'bg-cyanGlow/15 border-cyanGlow/50 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.2)]'
            : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
        }`;
      });

      if (preset) {
        appState.integralLab.a = preset.defaultA;
        appState.integralLab.b = preset.defaultB;
        if (sliderB) {
          sliderB.min = String(preset.xMin);
          sliderB.max = String(preset.xMax);
          sliderB.value = String(preset.defaultB);
          syncSliderTrackFill(sliderB);
        }
        const m = activeInstances.studio3D?.setFunction?.(id);
        if (m) handleIntegralTelemetry(m);
        updateIntegralStage1LensUI();
      }
    });
  });

  // Wire Camera Presets
  container.querySelectorAll('[data-int-camera-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const camId = btn.getAttribute('data-int-camera-preset');
      if (!camId) return;
      playSfx('tick');
      appState.integralLab.cameraPreset = camId;
      container.querySelectorAll('[data-int-camera-preset]').forEach((el) => {
        const active = el.getAttribute('data-int-camera-preset') === camId;
        el.className = `${
          el.textContent.trim().length <= 3 ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'
        } rounded-lg font-mono transition-all cursor-pointer ${
          active
            ? 'bg-white/15 text-white border border-white/20 shadow-sm'
            : 'text-slate-400 border border-transparent hover:text-white'
        }`;
      });
      activeInstances.studio3D?.setCameraPreset?.(camId);
    });
  });

  // Wire Rule Pills (Left / Midpoint / Right)
  container.querySelectorAll('[data-int-rule]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rule = btn.getAttribute('data-int-rule');
      if (!rule || rule === appState.integralLab.rule) return;
      playSfx('tick');
      appState.integralLab.rule = rule;
      container.querySelectorAll('[data-int-rule]').forEach((el) => {
        const act = el.getAttribute('data-int-rule') === rule;
        el.className = `px-2 py-0.5 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
          act
            ? 'bg-cyanGlow/20 text-cyan-200 border border-cyanGlow/45'
            : 'text-slate-400 border border-transparent hover:text-white'
        }`;
      });
      const m = activeInstances.studio3D?.setRule?.(rule);
      if (m) handleIntegralTelemetry(m);
    });
  });

  // Wire Sliders
  sliderB?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    syncSliderTrackFill(sliderB);
    appState.integralLab.b = val;
    playSfx('tick');
    activeInstances.studio3D?.setB?.(val);
  });

  sliderN?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (appState.integralLab.isAnimating) stopRefineAnim();
    syncSliderTrackFill(sliderN);
    appState.integralLab.n = val;
    playSfx('tick');
    activeInstances.studio3D?.setSubdivisions?.(val);
  });

  // Wire Accumulation Ribbon Toggle (Desktop + Mobile synced)
  const accToggle = document.getElementById('toggle-accum-ribbon');
  const accToggleMob = document.getElementById('toggle-accum-ribbon-mobile');
  const syncAccum = (checked) => {
    playSfx('snap');
    appState.integralLab.showAccumulation = !!checked;
    if (accToggle) accToggle.checked = appState.integralLab.showAccumulation;
    if (accToggleMob) accToggleMob.checked = appState.integralLab.showAccumulation;
    activeInstances.studio3D?.toggleAccumulationCurve?.(appState.integralLab.showAccumulation);
  };
  accToggle?.addEventListener('change', (e) => syncAccum(e.target.checked));
  accToggleMob?.addEventListener('change', (e) => syncAccum(e.target.checked));

  // Wire Mobile KaTeX Drawer Toggle
  const intFormulaBtn = document.getElementById('int-btn-toggle-mobile-formula');
  const intFormulaDrawer = document.getElementById('int-mobile-formula-drawer');
  intFormulaBtn?.addEventListener('click', () => {
    playSfx('tick');
    if (!intFormulaDrawer) return;
    const isHidden = intFormulaDrawer.classList.contains('hidden');
    intFormulaDrawer.classList.toggle('hidden', !isHidden);
    intFormulaBtn.setAttribute('aria-expanded', String(isHidden));
    intFormulaBtn.textContent = isHidden ? '∫ ▴' : '∫ ▾';
  });

  // Wire Animate N → ∞
  document.getElementById('btn-animate-refine')?.addEventListener('click', () => {
    playSfx('snap');
    markStageDone('3d-lab');
    stopRefineAnim();
    const studio = activeInstances.studio3D;
    if (!studio || typeof studio.animateRefine !== 'function') return;

    appState.integralLab.isAnimating = true;
    const icon = document.getElementById('int-anim-icon');
    const txt = document.getElementById('int-anim-text');
    if (icon) icon.textContent = '◉';
    if (txt) txt.textContent = 'Refining N → 80...';

    cancelRefineAnim = studio.animateRefine((m) => {
      if (m && m.n >= 80) {
        cancelRefineAnim = null;
        finishRefineUI();
      }
    });
  });

  document.getElementById('btn-int-next-intuition')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('intuition');
  });
}

function updateIntegralStage1LensUI() {
  const presets = normalizeIntegralPresets();
  const preset = getActiveIntegralPreset(presets);
  const on = isMechatronicsLens();

  const fxEl = document.getElementById('int-hud-fx-math');
  const FxEl = document.getElementById('int-hud-Fx-math');
  if (preset) {
    typesetMath(fxEl, preset.latex, false);
    typesetMath(FxEl, preset.integralLatex, false);
  }

  const label = document.getElementById('int-hud-curve-label');
  if (label) {
    label.textContent = on
      ? preset?.mechatronicsLabel || 'Velocity Rate & Accumulated Stroke'
      : 'Integrand f(x) & Antiderivative F(x)';
  }

  const mechInd = document.getElementById('int-hud-mech-indicator');
  const mechText = document.getElementById('int-hud-mech-text');
  if (mechInd && mechText) {
    mechInd.className = `hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
      on
        ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
        : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
    }`;
    const dot = mechInd.querySelector('span');
    if (dot) dot.className = `w-2 h-2 rounded-full ${on ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}`;
    mechText.textContent = on ? '3D Accumulator Gauge: SYNCED' : '3D Gauge: Standby';
  }

  const bLbl = document.getElementById('label-int-b');
  if (bLbl) {
    bLbl.innerHTML = `<span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B]"></span>${
      on ? 'End Time b (s)' : 'Upper Limit b'
    }`;
  }

  const exactLbl = document.getElementById('int-label-exact');
  if (exactLbl) exactLbl.textContent = on ? 'Exact Displacement Δx' : 'Exact Integral ∫ f dx';

  const ribLbl = document.getElementById('int-label-ribbon');
  if (ribLbl) {
    ribLbl.textContent = on
      ? 'Show x(t) 3D Displacement Ribbon'
      : 'Show F(x) 3D Accumulation Ribbon';
  }
}

function updateIntegralStage1TelemetryUI() {
  const t = appState.integralTelemetry;
  const on = isMechatronicsLens();

  const rB = document.getElementById('readout-int-b');
  if (rB) rB.textContent = formatSigned(t.b, 2);

  const rN = document.getElementById('readout-int-n');
  if (rN) rN.textContent = String(t.n);

  const rLbl = document.getElementById('int-label-riemann');
  if (rLbl) rLbl.textContent = `Riemann Sum (N=${t.n})`;

  const vR = document.getElementById('int-val-riemann');
  if (vR) vR.textContent = formatNum(t.riemannSum, 4);

  const vE = document.getElementById('int-val-exact');
  if (vE) vE.textContent = formatNum(t.exactIntegral, 4);

  const vRC = document.getElementById('int-val-riemann-compact');
  if (vRC) vRC.textContent = formatNum(t.riemannSum, 3);

  const vEC = document.getElementById('int-val-exact-compact');
  if (vEC) vEC.textContent = formatNum(t.exactIntegral, 3);

  const vS = document.getElementById('int-val-signed');
  if (vS) {
    vS.textContent = `+${formatNum(t.positiveArea, 2)} / ${formatNum(t.negativeArea, 2)}`;
  }

  const badge = document.getElementById('int-badge-exact');
  if (badge) {
    if (t.isExactLocked) {
      badge.textContent = 'EXACT ∫ ✓';
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-emeraldGlow/20 border-emeraldGlow/60 text-emeraldGlow shadow-[0_0_18px_rgba(52,211,153,0.3)]';
    } else {
      badge.textContent = 'RIEMANN';
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-amberGlow/15 border-amberGlow/30 text-amberGlow';
    }
  }

  const katexEl = document.getElementById('int-telemetry-katex');
  if (katexEl) {
    const aStr = formatNum(t.a, 1);
    const bStr = formatNum(t.b, 2);
    const valStr = formatNum(t.riemannSum, 3);
    const tex = on
      ? `\\sum_{i=1}^{${t.n}} v(t_i^*)\\Delta t \\approx \\int_{${aStr}}^{${bStr}} v(t)\\,dt = ${valStr}`
      : `\\sum_{i=1}^{${t.n}} f(x_i^*)\\Delta x \\approx \\int_{${aStr}}^{${bStr}} f(x)\\,dx = ${valStr}`;
    typesetMath(katexEl, tex, true);
  }
}

function mountIntegralStage2Intuition(container) {
  const on = isMechatronicsLens();
  const s = getStoreState();
  const solvedIntQuizzes = (s.solvedQuizzes || []).filter((id) =>
    String(id).startsWith('int-quiz-')
  ).length;
  let activeSubTab = 'lab';

  container.innerHTML = `
    <section class="space-y-3 lg:space-y-6 view-enter">
      <!-- Mobile Segmented Sub-Tab Switcher (<lg) -->
      <div class="lg:hidden grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#0E121C]/90 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <button
          type="button"
          data-stage2-subtab="lab"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-cyanGlow/20 border border-cyanGlow/45 text-cyan-100 shadow-sm"
        >
          📈 FTC Area Lab
        </button>
        <button
          type="button"
          data-stage2-subtab="quiz"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white"
        >
          🎯 Match Quiz (${solvedIntQuizzes}/6)
        </button>
      </div>

      <!-- Synchronized Integrand f(x) & Accumulation F(x) Lab -->
      <div id="stage2-panel-lab" class="glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-cyanGlow">Fundamental Theorem of Calculus</div>
            <h2 id="stage2-lab-title" class="font-display font-bold text-xl text-white mt-0.5">
              ${on ? 'Synchronized Velocity v(t) & Displacement x(t)' : 'Synchronized Integrand f(x) & Accumulation F(x)'}
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Drag the upper limit b to watch signed area accumulate in real time—and see how the height of f(x) is the exact tangent slope of F(x).
            </p>
          </div>
          <span class="px-3 py-1 rounded-full text-[11px] font-mono bg-white/[0.04] border border-white/10 text-slate-300">
            Scrub cursor b across graph
          </span>
        </div>

        <div id="stacked-integral-lab-host" class="w-full min-h-[300px] sm:min-h-[380px]"></div>

        <div class="lg:hidden flex justify-end pt-0.5">
          <button
            type="button"
            id="btn-mobile-jump-quiz"
            class="btn-glow-cyan !py-2 !px-3.5 !text-xs !rounded-xl w-full"
          >
            Test Your Intuition: Match the Accumulation Quiz →
          </button>
        </div>
      </div>

      <!-- Visual "Match the Accumulation" Quiz Engine -->
      <div id="stage2-panel-quiz" class="hidden lg:block glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-violetGlow">Visual Area Mastery</div>
            <h2 class="font-display font-bold text-xl text-white mt-0.5">Match the Accumulation Challenges</h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Trace positive &amp; negative area regions on the rate curve—then pick its matching accumulation graph F(x).
            </p>
          </div>
          <button
            id="btn-next-solver"
            type="button"
            class="btn-glass !text-xs"
          >
            Next: Integral Solver →
          </button>
        </div>

        <div id="integral-quiz-engine-host" class="w-full min-h-[280px] sm:min-h-[320px]"></div>
      </div>
    </section>
  `;

  const panelLab = document.getElementById('stage2-panel-lab');
  const panelQuiz = document.getElementById('stage2-panel-quiz');
  const setSubTab = (tab) => {
    activeSubTab = tab;
    if (panelLab && panelQuiz) {
      panelLab.classList.toggle('hidden', tab !== 'lab');
      panelLab.classList.add('lg:block');
      panelQuiz.classList.toggle('hidden', tab !== 'quiz');
      panelQuiz.classList.add('lg:block');
    }
    container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
      const isAct = btn.getAttribute('data-stage2-subtab') === tab;
      btn.className = isAct
        ? 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-cyanGlow/20 border border-cyanGlow/45 text-cyan-100 shadow-sm'
        : 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white';
    });
    requestAnimationFrame(() => {
      if (tab === 'lab') {
        activeInstances.stackedLab?._resizeAll?.();
        activeInstances.stackedLab?._drawAll?.();
      } else {
        activeInstances.quizEngine?._resizeCanvases?.();
        activeInstances.quizEngine?._drawCanvases?.();
      }
      window.dispatchEvent(new Event('resize'));
    });
  };

  container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-stage2-subtab');
      if (next && next !== activeSubTab) {
        playSfx('tick');
        setSubTab(next);
      }
    });
  });

  document.getElementById('btn-mobile-jump-quiz')?.addEventListener('click', () => {
    playSfx('tick');
    setSubTab('quiz');
  });

  const labHost = document.getElementById('stacked-integral-lab-host');
  if (labHost && typeof StackedIntegralLab === 'function') {
    try {
      activeInstances.stackedLab = new StackedIntegralLab(labHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onInteract: () => markStageDone('intuition'),
      });
    } catch (err) {
      console.error('[EIGENLAB] StackedIntegralLab mount error:', err);
    }
  }

  const quizHost = document.getElementById('integral-quiz-engine-host');
  if (quizHost && typeof IntegralVisualQuizEngine === 'function') {
    try {
      const updateTabCount = (payload) => {
        const count =
          payload?.solvedCount ??
          (getStoreState().solvedQuizzes || []).filter((id) =>
            String(id).startsWith('int-quiz-')
          ).length;
        const quizBtn = container.querySelector('[data-stage2-subtab="quiz"]');
        if (quizBtn) quizBtn.textContent = `🎯 Match Quiz (${count}/6)`;
      };
      activeInstances.quizEngine = new IntegralVisualQuizEngine(quizHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onAnswer: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
        onProgress: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
        onComplete: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] IntegralVisualQuizEngine mount error:', err);
    }
  }

  document.getElementById('btn-next-solver')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('solver');
  });
}

function mountIntegralStage3Solver(container) {
  container.innerHTML = `
    <section class="max-w-4xl mx-auto space-y-3 sm:space-y-5 view-enter">
      <div class="hidden md:flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-violetGlow">Interactive Integration Drill</div>
          <h2 class="font-display font-bold text-2xl text-white mt-0.5">Paperless Step-by-Step Integral Solver</h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
            Master Power &amp; FTC, u-Substitution, Trig &amp; Half-Angle, Integration by Parts, and Partial Fractions across 14 step-by-step problems.
          </p>
        </div>

        <button
          id="btn-next-word-problems"
          type="button"
          class="btn-glass !text-xs"
        >
          Next: Word Problems →
        </button>
      </div>

      <div id="paperless-solver-host" class="glass-panel p-2.5 sm:p-5 md:p-6 min-h-[420px]"></div>
    </section>
  `;

  const host = document.getElementById('paperless-solver-host');
  if (host && typeof PaperlessStepSolver === 'function') {
    try {
      activeInstances.stepSolver = new PaperlessStepSolver(host, {
        mode: 'integrals',
        problems: INTEGRAL_PROBLEMS,
        tiers: INTEGRAL_SOLVER_TIERS,
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onSolve: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProblemSolved: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProgress: (info) => {
          if (!info || (info.solvedCount ?? 1) >= 1) {
            markStageDone('solver');
            updateLessonStageDotsUI();
          }
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] Integral PaperlessStepSolver mount error:', err);
    }
  }

  document.getElementById('btn-next-word-problems')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('word-problems');
  });
}

// ---------------------------------------------------------------------------
// LESSON 03 — ODE & LAPLACE STUDIO (`math-diff-eq`) STAGES 1–3
// ---------------------------------------------------------------------------

function mountDiffEqStage1Lab3D(container) {
  const presets = normalizeDiffEqPresets();
  const activePreset = getActiveDiffEqPreset(presets);
  const lensOn = isMechatronicsLens();
  const isFirstOrder = activePreset?.order === 1;

  container.innerHTML = `
    <section class="space-y-2 sm:space-y-4 view-enter">
      <!-- Top System Preset Strip + Desktop Camera Presets -->
      <div class="flex items-center justify-between gap-2 sm:gap-3">
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar xl:flex-wrap flex-1 min-w-0 py-0.5" role="tablist" aria-label="Dynamical system presets">
          ${presets
            .map((p) => {
              const isSelected = activePreset && p.id === activePreset.id;
              return `
                <button
                  type="button"
                  data-de-preset-id="${escapeHtml(p.id)}"
                  class="shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyanGlow/15 border-cyanGlow/50 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.2)]'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }"
                >
                  ${escapeHtml(p.name)}
                </button>
              `;
            })
            .join('')}
        </div>

        <div class="hidden xl:flex items-center gap-1 bg-slate-900/75 p-1 rounded-xl border border-white/10 shrink-0">
          ${[
            { id: '3d', label: '3D Studio' },
            { id: 'front', label: 'Front 2D Graph' },
            { id: 'iso', label: 'Isometric' },
          ]
            .map((cam) => {
              const active = appState.diffeqLab.cameraPreset === cam.id;
              return `
                <button
                  type="button"
                  data-de-camera-preset="${cam.id}"
                  class="px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    active
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 border border-transparent hover:text-white'
                  }"
                >
                  ${cam.label}
                </button>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- Main Split-Screen Mobile / Full-Bleed Desktop 3D ODE Studio -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-2.5 sm:gap-4 items-stretch">
        <!-- 3D Viewport Canvas Container -->
        <div class="xl:col-span-8 canvas-stage relative h-[36dvh] min-h-[210px] max-h-[295px] sm:h-[420px] sm:max-h-none xl:h-[calc(100vh-210px)] xl:min-h-[540px] flex flex-col">
          <div id="diffeq-3d-canvas" class="absolute inset-0 w-full h-full"></div>

          <!-- Top-Left Floating ODE & Transfer Function HUD -->
          <div class="pointer-events-none relative z-10 flex items-start justify-between gap-2 p-2.5 sm:p-4">
            <div class="pointer-events-auto rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-3 bg-[#0B0D12]/80 backdrop-blur-xl border border-white/15 shadow-lg max-w-full">
              <div class="hidden sm:flex items-center gap-2 mb-1.5">
                <span class="w-2 h-2 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>
                <span id="de-hud-curve-label" class="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  ${lensOn ? 'Spring-Mass-Damper Dynamics' : 'ODE Time–Phase Trajectory'}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-x-2.5 sm:gap-x-4 gap-y-0.5 text-[11px] sm:text-sm text-white">
                <span id="de-hud-ode-math" class="text-cyan-200"></span>
              </div>
            </div>

            <!-- Mechatronics Spring-Mass-Damper Rig Indicator -->
            <div id="de-hud-mech-indicator" class="hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
              lensOn
                ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
                : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
            }">
              <div class="flex items-center gap-2 text-[11px] font-mono">
                <span class="w-2 h-2 rounded-full ${lensOn ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}"></span>
                <span id="de-hud-mech-text">${lensOn ? '3D Spring-Mass Rig: SYNCED' : '3D Rig: Standby'}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Legend + Compact Mobile Camera Switcher -->
          <div class="pointer-events-none relative z-10 mt-auto p-2 sm:p-4 flex items-center justify-between gap-2">
            <div class="hidden sm:inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300">
              <span><span class="text-cyanGlow">●</span> 3D Helix (t, y, y&apos;)</span>
              <span><span class="text-emeraldGlow">—</span> Setpoint y=1</span>
              <span><span class="text-violetGlow">●</span> Phase Portrait</span>
            </div>

            <div class="pointer-events-auto xl:hidden ml-auto flex items-center gap-0.5 bg-[#0B0D12]/80 backdrop-blur-md p-0.5 rounded-xl border border-white/15">
              ${[
                { id: '3d', label: '3D' },
                { id: 'front', label: '2D' },
                { id: 'iso', label: 'Iso' },
              ]
                .map((cam) => {
                  const active = appState.diffeqLab.cameraPreset === cam.id;
                  return `
                    <button
                      type="button"
                      data-de-camera-preset="${cam.id}"
                      class="px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                        active
                          ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                          : 'text-slate-400 border border-transparent hover:text-white'
                      }"
                    >
                      ${cam.label}
                    </button>
                  `;
                })
                .join('')}
            </div>

            <div class="hidden xl:inline-flex items-center px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-400">
              Drag to orbit • Scroll to zoom
            </div>
          </div>
        </div>

        <!-- Tactile ODE & Laplace Telemetry + Parameter Sliders -->
        <aside class="xl:col-span-4 flex flex-col gap-2 sm:gap-4 xl:h-[calc(100vh-210px)] xl:overflow-y-auto studio-scroll pr-0.5">
          <!-- Compact 1-Row Mobile Telemetry / Expanded Desktop Transfer Function Card -->
          <div class="glass-panel p-2.5 sm:p-5 space-y-2 sm:space-y-4">
            <div class="flex items-center justify-between gap-2">
              <div class="hidden xl:block">
                <div class="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-400">Laplace Domain Telemetry</div>
                <h2 class="font-display font-semibold text-sm text-white mt-0.5">Transfer Function &amp; Poles</h2>
              </div>

              <!-- Mobile Compact Inline Readout -->
              <div class="flex xl:hidden items-center gap-2 min-w-0 flex-1">
                <div class="flex-1 min-w-0 rounded-xl px-2.5 py-1 bg-cyanGlow/[0.08] border border-cyanGlow/25">
                  <div class="text-[9px] font-mono uppercase tracking-wider text-cyanGlow/90 truncate">Overshoot</div>
                  <div id="de-val-os-compact" class="font-mono font-semibold text-sm text-white leading-tight">44.4%</div>
                </div>
                <div class="flex-1 min-w-0 rounded-xl px-2.5 py-1 bg-violetGlow/[0.08] border border-violetGlow/25">
                  <div class="text-[9px] font-mono uppercase tracking-wider text-violetGlow/90 truncate">Settling Ts</div>
                  <div id="de-val-ts-compact" class="font-mono font-semibold text-sm text-violet-200 leading-tight">6.15s</div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <div
                  id="de-badge-regime"
                  class="px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-cyanGlow/15 border-cyanGlow/40 text-cyan-200"
                >
                  UNDERDAMPED
                </div>
                <button
                  id="de-btn-toggle-mobile-formula"
                  type="button"
                  aria-expanded="false"
                  title="Toggle Laplace transfer function & poles"
                  class="xl:hidden px-2 py-1 rounded-lg bg-white/[0.05] border border-white/15 text-[11px] font-mono text-cyan-200 cursor-pointer"
                >
                  ℒ ▾
                </button>
              </div>
            </div>

            <!-- Collapsible on Mobile (<xl), Always Open on Desktop (xl:block) -->
            <div id="de-mobile-formula-drawer" class="hidden xl:block space-y-2.5 sm:space-y-3.5">
              <div class="katex-card flex flex-col items-center justify-center gap-1.5 min-h-[68px] sm:min-h-[82px]">
                <div id="de-telemetry-transfer-katex" class="text-slate-100 text-xs sm:text-sm overflow-x-auto"></div>
                <div id="de-telemetry-poles-katex" class="text-violet-300 text-xs overflow-x-auto"></div>
              </div>

              <div class="hidden xl:grid grid-cols-2 gap-3">
                <div class="rounded-2xl p-3.5 bg-cyanGlow/[0.06] border border-cyanGlow/25">
                  <div class="text-[10px] font-mono uppercase tracking-wider text-cyanGlow/90">Percent Overshoot</div>
                  <div id="de-val-os" class="font-mono font-semibold text-xl text-white mt-1">44.4%</div>
                </div>
                <div class="rounded-2xl p-3.5 bg-violetGlow/[0.06] border border-violetGlow/25">
                  <div class="text-[10px] font-mono uppercase tracking-wider text-violetGlow/90">2% Settling Time</div>
                  <div id="de-val-ts" class="font-mono font-semibold text-xl text-violet-200 mt-1">6.15s</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tactile Damping & Natural Frequency Sliders -->
          <div class="glass-panel p-2.5 sm:p-5 space-y-2.5 sm:space-y-4 flex-1 flex flex-col justify-between">
            <div class="space-y-2 sm:space-y-4">
              <!-- Damping Ratio ζ Slider (Amber) -->
              <div id="de-zeta-wrap" class="space-y-1 sm:space-y-1.5 ${isFirstOrder ? 'opacity-45' : ''}">
                <div class="flex items-center justify-between">
                  <label for="slider-de-zeta" class="text-xs font-medium text-slate-200 flex items-center gap-2">
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B]"></span>
                    Damping Ratio ζ
                  </label>
                  <span id="readout-de-zeta" class="px-2 py-0.5 rounded-lg bg-amberGlow/15 border border-amberGlow/30 font-mono text-[11px] sm:text-xs text-amberGlow font-semibold">
                    ${formatNum(appState.diffeqLab.zeta, 2)}
                  </span>
                </div>
                <input
                  id="slider-de-zeta"
                  type="range"
                  min="0"
                  max="2.0"
                  step="0.02"
                  value="${appState.diffeqLab.zeta}"
                  ${isFirstOrder ? 'disabled' : ''}
                  class="studio-slider-amber"
                />
              </div>

              <!-- Natural Frequency ωn Slider (Cyan) -->
              <div class="space-y-1 sm:space-y-1.5">
                <div class="flex items-center justify-between">
                  <label for="slider-de-omega" id="label-de-omega" class="text-xs font-medium text-slate-200 flex items-center gap-2">
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>
                    ${isFirstOrder ? 'Decay Rate a = 1/τ' : 'Natural Freq ωₙ (rad/s)'}
                  </label>
                  <span id="readout-de-omega" class="px-2 py-0.5 rounded-lg bg-cyanGlow/15 border border-cyanGlow/30 font-mono text-[11px] sm:text-xs text-cyanGlow font-semibold">
                    ${formatNum(appState.diffeqLab.omega, 2)}
                  </span>
                </div>
                <input
                  id="slider-de-omega"
                  type="range"
                  min="0.8"
                  max="4.0"
                  step="0.05"
                  value="${appState.diffeqLab.omega}"
                  class="studio-slider-cyan"
                />
              </div>

              <!-- Action Row: Simulate Step Response + Mobile Phase Wall Toggle -->
              <div class="flex items-center gap-2 pt-0.5">
                <button
                  id="btn-animate-diffeq"
                  type="button"
                  class="flex-1 py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amberGlow via-cyanGlow to-violetGlow text-slate-950 font-display font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_24px_rgba(34,211,238,0.28)] hover:brightness-110 active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  <span id="de-anim-icon" aria-hidden="true">▶</span>
                  <span id="de-anim-text">Simulate Step Response</span>
                </button>

                <label class="xl:hidden shrink-0 inline-flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-violetGlow/10 border border-violetGlow/30 text-[11px] font-mono text-violet-200 cursor-pointer select-none">
                  <input
                    id="toggle-phase-wall-mobile"
                    type="checkbox"
                    ${appState.diffeqLab.showPhaseWall ? 'checked' : ''}
                    class="w-3.5 h-3.5 rounded accent-violet-400 cursor-pointer"
                  />
                  <span>Phase</span>
                </label>
              </div>
            </div>

            <!-- Desktop Phase Wall Toggle + Stage 2 Forward Link -->
            <div class="hidden xl:block pt-4 border-t border-white/10 space-y-3">
              <label class="flex items-center justify-between gap-3 cursor-pointer select-none group">
                <div class="flex items-center gap-2.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-violetGlow shadow-[0_0_8px_#A78BFA]"></span>
                  <div>
                    <div class="text-xs font-medium text-slate-200 group-hover:text-white">
                      Show 3D Phase-Portrait Wall (y vs y&apos;)
                    </div>
                    <div class="text-[11px] text-slate-400">State-space spiral converging to equilibrium</div>
                  </div>
                </div>
                <input
                  id="toggle-phase-wall"
                  type="checkbox"
                  ${appState.diffeqLab.showPhaseWall ? 'checked' : ''}
                  class="w-4 h-4 rounded accent-violet-400 cursor-pointer"
                />
              </label>

              <button
                id="btn-de-next-intuition"
                type="button"
                class="btn-glass w-full !justify-between !text-xs"
              >
                <span>Continue to Stage 2: Laplace s-Plane Lab</span>
                <span class="text-cyanGlow" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;

  const sliderZeta = document.getElementById('slider-de-zeta');
  const sliderOmega = document.getElementById('slider-de-omega');
  syncSliderTrackFill(sliderZeta);
  syncSliderTrackFill(sliderOmega);

  const canvasHost = document.getElementById('diffeq-3d-canvas');

  const handleDiffEqTelemetry = (m = {}) => {
    appState.diffeqTelemetry = {
      ...appState.diffeqTelemetry,
      ...m,
    };
    if (Number.isFinite(m.zeta)) {
      appState.diffeqLab.zeta = m.zeta;
      if (sliderZeta && Math.abs(parseFloat(sliderZeta.value) - m.zeta) > 0.005) {
        sliderZeta.value = String(m.zeta);
        syncSliderTrackFill(sliderZeta);
      }
    }
    if (Number.isFinite(m.omega)) {
      appState.diffeqLab.omega = m.omega;
      if (sliderOmega && Math.abs(parseFloat(sliderOmega.value) - m.omega) > 0.01) {
        sliderOmega.value = String(m.omega);
        syncSliderTrackFill(sliderOmega);
      }
    }
    updateDiffEqStage1TelemetryUI();
  };

  if (canvasHost && typeof DiffEq3DStudio === 'function') {
    try {
      const studio = new DiffEq3DStudio({
        presetKey: activePreset?.id || 'underdamped',
        zeta: appState.diffeqLab.zeta,
        omega: appState.diffeqLab.omega,
        t: appState.diffeqLab.t,
        showPhaseWall: appState.diffeqLab.showPhaseWall,
        showMechatronics: lensOn,
        onChange: handleDiffEqTelemetry,
      });
      studio.init(canvasHost);
      studio.setCameraPreset?.(appState.diffeqLab.cameraPreset);
      activeInstances.studio3D = studio;
      const initM = studio.getMetrics?.();
      if (initM) handleDiffEqTelemetry(initM);
    } catch (err) {
      console.error('[EIGENLAB] DiffEq3DStudio init error:', err);
    }
  }

  updateDiffEqStage1LensUI();
  updateDiffEqStage1TelemetryUI();

  let cancelSimAnim = null;
  const finishSimUI = () => {
    appState.diffeqLab.isAnimating = false;
    const icon = document.getElementById('de-anim-icon');
    const txt = document.getElementById('de-anim-text');
    if (icon) icon.textContent = '▶';
    if (txt) txt.textContent = 'Simulate Step Response';
  };
  const stopSimAnim = () => {
    if (typeof cancelSimAnim === 'function') {
      try {
        cancelSimAnim();
      } catch {
        // Ignore
      }
      cancelSimAnim = null;
    }
    finishSimUI();
  };
  activeInstances.cleanupFns.push(stopSimAnim);

  // Wire System Preset Pills
  container.querySelectorAll('[data-de-preset-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-de-preset-id');
      if (!id || id === appState.diffeqLab.presetId) return;
      playSfx('tick');
      stopSimAnim();
      appState.diffeqLab.presetId = id;
      const preset = presets.find((p) => p.id === id);

      container.querySelectorAll('[data-de-preset-id]').forEach((el) => {
        const sel = el.getAttribute('data-de-preset-id') === id;
        el.className = `shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
          sel
            ? 'bg-cyanGlow/15 border-cyanGlow/50 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.2)]'
            : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
        }`;
      });

      if (preset) {
        appState.diffeqLab.zeta = preset.defaultZeta;
        appState.diffeqLab.omega = preset.defaultOmega;
        const firstOrd = preset.order === 1;
        const zWrap = document.getElementById('de-zeta-wrap');
        if (zWrap) zWrap.classList.toggle('opacity-45', firstOrd);
        if (sliderZeta) {
          sliderZeta.disabled = firstOrd;
          sliderZeta.value = String(preset.defaultZeta);
          syncSliderTrackFill(sliderZeta);
        }
        if (sliderOmega) {
          sliderOmega.value = String(preset.defaultOmega);
          syncSliderTrackFill(sliderOmega);
        }
        const omLbl = document.getElementById('label-de-omega');
        if (omLbl) {
          omLbl.innerHTML = `<span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>${
            firstOrd ? 'Decay Rate a = 1/τ' : 'Natural Freq ωₙ (rad/s)'
          }`;
        }
        const m = activeInstances.studio3D?.setPreset?.(id);
        if (m) handleDiffEqTelemetry(m);
        updateDiffEqStage1LensUI();
      }
    });
  });

  // Wire Camera Presets
  container.querySelectorAll('[data-de-camera-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const camId = btn.getAttribute('data-de-camera-preset');
      if (!camId) return;
      playSfx('tick');
      appState.diffeqLab.cameraPreset = camId;
      container.querySelectorAll('[data-de-camera-preset]').forEach((el) => {
        const active = el.getAttribute('data-de-camera-preset') === camId;
        el.className = `${
          el.textContent.trim().length <= 3 ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'
        } rounded-lg font-mono transition-all cursor-pointer ${
          active
            ? 'bg-white/15 text-white border border-white/20 shadow-sm'
            : 'text-slate-400 border border-transparent hover:text-white'
        }`;
      });
      activeInstances.studio3D?.setCameraPreset?.(camId);
    });
  });

  // Wire Damping & Natural Frequency Sliders
  sliderZeta?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    syncSliderTrackFill(sliderZeta);
    appState.diffeqLab.zeta = val;
    playSfx('tick');
    activeInstances.studio3D?.setDamping?.(val);
    if (Math.abs(val - 1.0) <= 0.03) markStageDone('3d-lab');
  });

  sliderOmega?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    syncSliderTrackFill(sliderOmega);
    appState.diffeqLab.omega = val;
    playSfx('tick');
    activeInstances.studio3D?.setOmega?.(val);
  });

  // Wire Phase Wall Toggle (Desktop + Mobile synced)
  const phToggle = document.getElementById('toggle-phase-wall');
  const phToggleMob = document.getElementById('toggle-phase-wall-mobile');
  const syncPhase = (checked) => {
    playSfx('snap');
    appState.diffeqLab.showPhaseWall = !!checked;
    if (phToggle) phToggle.checked = appState.diffeqLab.showPhaseWall;
    if (phToggleMob) phToggleMob.checked = appState.diffeqLab.showPhaseWall;
    activeInstances.studio3D?.togglePhaseWall?.(appState.diffeqLab.showPhaseWall);
  };
  phToggle?.addEventListener('change', (e) => syncPhase(e.target.checked));
  phToggleMob?.addEventListener('change', (e) => syncPhase(e.target.checked));

  // Wire Mobile Laplace Formula Drawer Toggle
  const deFormulaBtn = document.getElementById('de-btn-toggle-mobile-formula');
  const deFormulaDrawer = document.getElementById('de-mobile-formula-drawer');
  deFormulaBtn?.addEventListener('click', () => {
    playSfx('tick');
    if (!deFormulaDrawer) return;
    const isHidden = deFormulaDrawer.classList.contains('hidden');
    deFormulaDrawer.classList.toggle('hidden', !isHidden);
    deFormulaBtn.setAttribute('aria-expanded', String(isHidden));
    deFormulaBtn.textContent = isHidden ? 'ℒ ▴' : 'ℒ ▾';
  });

  // Wire Simulate Step Response Animation
  document.getElementById('btn-animate-diffeq')?.addEventListener('click', () => {
    playSfx('snap');
    markStageDone('3d-lab');
    stopSimAnim();
    const studio = activeInstances.studio3D;
    if (!studio || typeof studio.animateResponse !== 'function') return;

    appState.diffeqLab.isAnimating = true;
    const icon = document.getElementById('de-anim-icon');
    const txt = document.getElementById('de-anim-text');
    if (icon) icon.textContent = '◉';
    if (txt) txt.textContent = 'Simulating t: 0 → 8s...';

    cancelSimAnim = studio.animateResponse((m) => {
      if (m && m.t >= 7.98) {
        cancelSimAnim = null;
        finishSimUI();
      }
    });
  });

  document.getElementById('btn-de-next-intuition')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('intuition');
  });
}

function updateDiffEqStage1LensUI() {
  const presets = normalizeDiffEqPresets();
  const preset = getActiveDiffEqPreset(presets);
  const on = isMechatronicsLens();

  const label = document.getElementById('de-hud-curve-label');
  if (label) {
    label.textContent = on
      ? preset?.mechatronicsLabel || 'Spring-Mass-Damper Dynamics'
      : 'ODE Time–Phase Trajectory';
  }

  const mechInd = document.getElementById('de-hud-mech-indicator');
  const mechText = document.getElementById('de-hud-mech-text');
  if (mechInd && mechText) {
    mechInd.className = `hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
      on
        ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
        : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
    }`;
    const dot = mechInd.querySelector('span');
    if (dot) dot.className = `w-2 h-2 rounded-full ${on ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}`;
    mechText.textContent = on ? '3D Spring-Mass Rig: SYNCED' : '3D Rig: Standby';
  }
}

function updateDiffEqStage1TelemetryUI() {
  const t = appState.diffeqTelemetry;

  const rZ = document.getElementById('readout-de-zeta');
  if (rZ) rZ.textContent = t.order === 1 ? '1st' : formatNum(t.zeta, 2);

  const rO = document.getElementById('readout-de-omega');
  if (rO) rO.textContent = formatNum(t.omega, 2);

  const osStr = Number.isFinite(t.overshootPct) ? `${t.overshootPct.toFixed(1)}%` : '0.0%';
  const tsStr = Number.isFinite(t.settlingTime) && t.settlingTime < 999 ? `${t.settlingTime.toFixed(2)}s` : '∞';

  const vOs = document.getElementById('de-val-os');
  if (vOs) vOs.textContent = osStr;
  const vTs = document.getElementById('de-val-ts');
  if (vTs) vTs.textContent = tsStr;
  const vOsC = document.getElementById('de-val-os-compact');
  if (vOsC) vOsC.textContent = osStr;
  const vTsC = document.getElementById('de-val-ts-compact');
  if (vTsC) vTsC.textContent = tsStr;

  const badge = document.getElementById('de-badge-regime');
  if (badge && t.regime) {
    badge.textContent = t.regime;
    const isCrit = String(t.regime).includes('CRITICAL') || String(t.regime).includes('1ST');
    const isUnd = String(t.regime).includes('UNDAMPED');
    badge.className = `px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 ${
      isCrit
        ? 'bg-emeraldGlow/20 border-emeraldGlow/60 text-emeraldGlow shadow-[0_0_16px_rgba(52,211,153,0.28)]'
        : isUnd
          ? 'bg-amberGlow/20 border-amberGlow/55 text-amberGlow'
          : 'bg-cyanGlow/15 border-cyanGlow/40 text-cyan-200'
    }`;
  }

  const odeEl = document.getElementById('de-hud-ode-math');
  if (odeEl && t.odeLatex) typesetMath(odeEl, t.odeLatex, false);

  const tfEl = document.getElementById('de-telemetry-transfer-katex');
  if (tfEl && t.transferLatex) typesetMath(tfEl, t.transferLatex, false);

  const polesEl = document.getElementById('de-telemetry-poles-katex');
  if (polesEl && t.polesLatex) typesetMath(polesEl, t.polesLatex, false);
}

function mountDiffEqStage2Intuition(container) {
  const on = isMechatronicsLens();
  const s = getStoreState();
  const solvedDEQuizzes = (s.solvedQuizzes || []).filter((id) =>
    String(id).startsWith('de-quiz-')
  ).length;
  let activeSubTab = 'lab';

  container.innerHTML = `
    <section class="space-y-3 lg:space-y-6 view-enter">
      <!-- Mobile Segmented Sub-Tab Switcher (<lg) -->
      <div class="lg:hidden grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#0E121C]/90 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <button
          type="button"
          data-stage2-subtab="lab"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-cyanGlow/20 border border-cyanGlow/45 text-cyan-100 shadow-sm"
        >
          📈 s-Plane Lab
        </button>
        <button
          type="button"
          data-stage2-subtab="quiz"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white"
        >
          🎯 Match Quiz (${solvedDEQuizzes}/6)
        </button>
      </div>

      <!-- Interactive Complex Laplace s-Plane Lab -->
      <div id="stage2-panel-lab" class="glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-cyanGlow">Complex Frequency Intuition</div>
            <h2 id="stage2-lab-title" class="font-display font-bold text-xl text-white mt-0.5">
              ${on ? 'Control s-Plane Poles & Impulse Response x(t)' : 'Interactive Laplace s-Plane ↔ Time Response y(t)'}
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Drag the glowing pole × across the complex plane: move left for faster decay, up/down for faster oscillation, or right of zero to trigger instability.
            </p>
          </div>
          <span class="px-3 py-1 rounded-full text-[11px] font-mono bg-white/[0.04] border border-white/10 text-slate-300">
            Drag × pole in s-Plane
          </span>
        </div>

        <div id="laplace-splane-lab-host" class="w-full min-h-[300px] sm:min-h-[380px]"></div>

        <div class="lg:hidden flex justify-end pt-0.5">
          <button
            type="button"
            id="btn-mobile-jump-quiz"
            class="btn-glow-cyan !py-2 !px-3.5 !text-xs !rounded-xl w-full"
          >
            Test Your Intuition: Match the Pole Quiz →
          </button>
        </div>
      </div>

      <!-- Visual "Match the Pole / ODE" Quiz Engine -->
      <div id="stage2-panel-quiz" class="hidden lg:block glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-amberGlow">Pole-Response Pattern Mastery</div>
            <h2 class="font-display font-bold text-xl text-white mt-0.5">Match the Laplace Pole Challenges</h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Read the real decay rate σ and imaginary frequency ω directly from the s-plane map—then pick the matching time response.
            </p>
          </div>
          <button
            id="btn-next-solver"
            type="button"
            class="btn-glass !text-xs"
          >
            Next: ODE &amp; Laplace Solver →
          </button>
        </div>

        <div id="diffeq-quiz-engine-host" class="w-full min-h-[280px] sm:min-h-[320px]"></div>
      </div>
    </section>
  `;

  const panelLab = document.getElementById('stage2-panel-lab');
  const panelQuiz = document.getElementById('stage2-panel-quiz');
  const setSubTab = (tab) => {
    activeSubTab = tab;
    if (panelLab && panelQuiz) {
      panelLab.classList.toggle('hidden', tab !== 'lab');
      panelLab.classList.add('lg:block');
      panelQuiz.classList.toggle('hidden', tab !== 'quiz');
      panelQuiz.classList.add('lg:block');
    }
    container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
      const isAct = btn.getAttribute('data-stage2-subtab') === tab;
      btn.className = isAct
        ? 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-cyanGlow/20 border border-cyanGlow/45 text-cyan-100 shadow-sm'
        : 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white';
    });
    requestAnimationFrame(() => {
      if (tab === 'lab') {
        activeInstances.stackedLab?._resizeAll?.();
        activeInstances.stackedLab?._drawAll?.();
      } else {
        activeInstances.quizEngine?._resizeCanvases?.();
        activeInstances.quizEngine?._drawCanvases?.();
      }
      window.dispatchEvent(new Event('resize'));
    });
  };

  container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-stage2-subtab');
      if (next && next !== activeSubTab) {
        playSfx('tick');
        setSubTab(next);
      }
    });
  });

  document.getElementById('btn-mobile-jump-quiz')?.addEventListener('click', () => {
    playSfx('tick');
    setSubTab('quiz');
  });

  const labHost = document.getElementById('laplace-splane-lab-host');
  if (labHost && typeof LaplaceSPlaneLab === 'function') {
    try {
      activeInstances.stackedLab = new LaplaceSPlaneLab(labHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onInteract: () => markStageDone('intuition'),
      });
    } catch (err) {
      console.error('[EIGENLAB] LaplaceSPlaneLab mount error:', err);
    }
  }

  const quizHost = document.getElementById('diffeq-quiz-engine-host');
  if (quizHost && typeof DiffEqVisualQuizEngine === 'function') {
    try {
      const updateTabCount = (payload) => {
        const count =
          payload?.solvedCount ??
          (getStoreState().solvedQuizzes || []).filter((id) =>
            String(id).startsWith('de-quiz-')
          ).length;
        const quizBtn = container.querySelector('[data-stage2-subtab="quiz"]');
        if (quizBtn) quizBtn.textContent = `🎯 Match Quiz (${count}/6)`;
      };
      activeInstances.quizEngine = new DiffEqVisualQuizEngine(quizHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onAnswer: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
        onProgress: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
        onComplete: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] DiffEqVisualQuizEngine mount error:', err);
    }
  }

  document.getElementById('btn-next-solver')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('solver');
  });
}

function mountDiffEqStage3Solver(container) {
  container.innerHTML = `
    <section class="max-w-4xl mx-auto space-y-3 sm:space-y-5 view-enter">
      <div class="hidden md:flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-amberGlow">Interactive ODE &amp; Laplace Drill</div>
          <h2 class="font-display font-bold text-2xl text-white mt-0.5">Paperless ODE &amp; Laplace Step Solver</h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
            Master Separable ODEs, Integrating Factors, 2nd-Order Characteristic Roots, Forward/Inverse Laplace Transforms, and Laplace IVPs across 14 step-by-step problems.
          </p>
        </div>

        <button
          id="btn-next-word-problems"
          type="button"
          class="btn-glass !text-xs"
        >
          Next: Word Problems →
        </button>
      </div>

      <div id="paperless-solver-host" class="glass-panel p-2.5 sm:p-5 md:p-6 min-h-[420px]"></div>
    </section>
  `;

  const host = document.getElementById('paperless-solver-host');
  if (host && typeof PaperlessStepSolver === 'function') {
    try {
      activeInstances.stepSolver = new PaperlessStepSolver(host, {
        mode: 'diffeq',
        problems: DIFFEQ_PROBLEMS,
        tiers: DIFFEQ_SOLVER_TIERS,
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onSolve: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProblemSolved: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProgress: (info) => {
          if (!info || (info.solvedCount ?? 1) >= 1) {
            markStageDone('solver');
            updateLessonStageDotsUI();
          }
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] DiffEq PaperlessStepSolver mount error:', err);
    }
  }

  document.getElementById('btn-next-word-problems')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('word-problems');
  });
}

// ---------------------------------------------------------------------------
// LESSON 04 — LINEAR ALGEBRA & EIGEN-STUDIO (`math-lin-alg`) STAGES 1–3
// ---------------------------------------------------------------------------

function mountLinAlgStage1Lab3D(container) {
  const presets = normalizeLinAlgPresets();
  const activePreset = getActiveLinAlgPreset(presets);
  const lensOn = isMechatronicsLens();
  const paramUnit = activePreset?.paramUnit || '';
  const fmtParam = (v) =>
    paramUnit === '°' ? `${Math.round(v)}°` : `${formatNum(v, 2)}${paramUnit}`;

  container.innerHTML = `
    <section class="space-y-2 sm:space-y-4 view-enter">
      <!-- Top Matrix Preset Strip + Desktop Camera Presets -->
      <div class="flex items-center justify-between gap-2 sm:gap-3">
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar xl:flex-wrap flex-1 min-w-0 py-0.5" role="tablist" aria-label="3D matrix transformation presets">
          ${presets
            .map((p) => {
              const isSelected = activePreset && p.id === activePreset.id;
              return `
                <button
                  type="button"
                  data-la-preset-id="${escapeHtml(p.id)}"
                  class="shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emeraldGlow/15 border-emeraldGlow/50 text-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.2)]'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }"
                >
                  ${escapeHtml(p.name)}
                </button>
              `;
            })
            .join('')}
        </div>

        <div class="hidden xl:flex items-center gap-1 bg-slate-900/75 p-1 rounded-xl border border-white/10 shrink-0">
          ${[
            { id: '3d', label: '3D Studio' },
            { id: 'front', label: 'Front 2D Graph' },
            { id: 'iso', label: 'Isometric' },
          ]
            .map((cam) => {
              const active = appState.linalgLab.cameraPreset === cam.id;
              return `
                <button
                  type="button"
                  data-la-camera-preset="${cam.id}"
                  class="px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    active
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 border border-transparent hover:text-white'
                  }"
                >
                  ${cam.label}
                </button>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- Main Split-Screen Mobile / Full-Bleed Desktop 3D Linear Algebra Studio -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-2.5 sm:gap-4 items-stretch">
        <!-- 3D Viewport Canvas Container -->
        <div class="xl:col-span-8 canvas-stage relative h-[36dvh] min-h-[210px] max-h-[295px] sm:h-[420px] sm:max-h-none xl:h-[calc(100vh-210px)] xl:min-h-[540px] flex flex-col">
          <div id="linalg-3d-canvas" class="absolute inset-0 w-full h-full"></div>

          <!-- Top-Left Floating Matrix A HUD -->
          <div class="pointer-events-none relative z-10 flex items-start justify-between gap-2 p-2.5 sm:p-4">
            <div class="pointer-events-auto rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-3 bg-[#0B0D12]/80 backdrop-blur-xl border border-white/15 shadow-lg max-w-full">
              <div class="hidden sm:flex items-center gap-2 mb-1.5">
                <span class="w-2 h-2 rounded-full bg-emeraldGlow shadow-[0_0_8px_#34D399]"></span>
                <span id="la-hud-title" class="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  ${lensOn ? 'Rigid-Body Frame & Principal Ellipsoid' : '3D Linear Transformation A'}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-x-2.5 sm:gap-x-4 gap-y-0.5 text-[10px] sm:text-xs text-white">
                <span id="la-hud-matrix-math" class="text-cyan-200"></span>
              </div>
            </div>

            <!-- Mechatronics Ellipsoid / Gimbal Indicator -->
            <div id="la-hud-mech-indicator" class="hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
              lensOn
                ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
                : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
            }">
              <div class="flex items-center gap-2 text-[11px] font-mono">
                <span class="w-2 h-2 rounded-full ${lensOn ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}"></span>
                <span id="la-hud-mech-text">${lensOn ? 'Pose Gimbal & Ellipsoid: LIVE' : '3D Ellipsoid: Standby'}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Legend + Compact Mobile Camera Switcher -->
          <div class="pointer-events-none relative z-10 mt-auto p-2 sm:p-4 flex items-center justify-between gap-2">
            <div class="hidden sm:inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300">
              <span><span class="text-cyanGlow">●</span> î&apos;</span>
              <span><span class="text-amberGlow">●</span> ĵ&apos;</span>
              <span><span class="text-violetGlow">●</span> k̂&apos;</span>
              <span><span class="text-emeraldGlow">━</span> Eigenspan</span>
            </div>

            <div class="pointer-events-auto xl:hidden ml-auto flex items-center gap-0.5 bg-[#0B0D12]/80 backdrop-blur-md p-0.5 rounded-xl border border-white/15">
              ${[
                { id: '3d', label: '3D' },
                { id: 'front', label: '2D' },
                { id: 'iso', label: 'Iso' },
              ]
                .map((cam) => {
                  const active = appState.linalgLab.cameraPreset === cam.id;
                  return `
                    <button
                      type="button"
                      data-la-camera-preset="${cam.id}"
                      class="px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                        active
                          ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                          : 'text-slate-400 border border-transparent hover:text-white'
                      }"
                    >
                      ${cam.label}
                    </button>
                  `;
                })
                .join('')}
            </div>

            <div class="hidden xl:inline-flex items-center px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-400">
              Drag to orbit • Scroll to zoom
            </div>
          </div>
        </div>

        <!-- Tactile Eigen & Determinant Telemetry + Morph/Parameter Sliders -->
        <aside class="xl:col-span-4 flex flex-col gap-2 sm:gap-4 xl:h-[calc(100vh-210px)] xl:overflow-y-auto studio-scroll pr-0.5">
          <!-- Compact 1-Row Mobile Telemetry / Expanded Desktop Eigen Card -->
          <div class="glass-panel p-2.5 sm:p-5 space-y-2 sm:space-y-4">
            <div class="flex items-center justify-between gap-2">
              <div class="hidden xl:block">
                <div class="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-400">Spectral &amp; Volume Telemetry</div>
                <h2 class="font-display font-semibold text-sm text-white mt-0.5">Determinant, Rank &amp; Eigenvalues</h2>
              </div>

              <!-- Mobile Compact Inline Readout -->
              <div class="flex xl:hidden items-center gap-2 min-w-0 flex-1">
                <div class="flex-1 min-w-0 rounded-xl px-2.5 py-1 bg-emeraldGlow/[0.08] border border-emeraldGlow/25">
                  <div class="text-[9px] font-mono uppercase tracking-wider text-emeraldGlow/90 truncate">det(A) Vol</div>
                  <div id="la-val-det-compact" class="font-mono font-semibold text-sm text-white leading-tight">1.98</div>
                </div>
                <div class="flex-1 min-w-0 rounded-xl px-2.5 py-1 bg-cyanGlow/[0.08] border border-cyanGlow/25">
                  <div class="text-[9px] font-mono uppercase tracking-wider text-cyanGlow/90 truncate">Rank / tr</div>
                  <div id="la-val-rank-compact" class="font-mono font-semibold text-sm text-cyan-200 leading-tight">R3 · 4.3</div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <div
                  id="la-badge-orient"
                  class="px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-emeraldGlow/15 border-emeraldGlow/40 text-emerald-200"
                >
                  Preserved
                </div>
                <button
                  id="la-btn-toggle-mobile-formula"
                  type="button"
                  aria-expanded="false"
                  title="Toggle eigenvalues & trace formula"
                  class="xl:hidden px-2 py-1 rounded-lg bg-white/[0.05] border border-white/15 text-[11px] font-mono text-emerald-200 cursor-pointer"
                >
                  λ ▾
                </button>
              </div>
            </div>

            <!-- Collapsible on Mobile (<xl), Always Open on Desktop (xl:block) -->
            <div id="la-mobile-formula-drawer" class="hidden xl:block space-y-2.5 sm:space-y-3.5">
              <div class="katex-card flex flex-col items-center justify-center gap-1.5 min-h-[64px] sm:min-h-[76px]">
                <div id="la-telemetry-eigen-katex" class="text-emerald-200 text-xs sm:text-sm overflow-x-auto"></div>
              </div>

              <div class="hidden xl:grid grid-cols-3 gap-2.5">
                <div class="rounded-2xl p-3 bg-emeraldGlow/[0.06] border border-emeraldGlow/25">
                  <div class="text-[10px] font-mono uppercase tracking-wider text-emeraldGlow/90">det(A)</div>
                  <div id="la-val-det" class="font-mono font-semibold text-lg text-white mt-0.5">1.98</div>
                </div>
                <div class="rounded-2xl p-3 bg-cyanGlow/[0.06] border border-cyanGlow/25">
                  <div class="text-[10px] font-mono uppercase tracking-wider text-cyanGlow/90">Trace tr(A)</div>
                  <div id="la-val-trace" class="font-mono font-semibold text-lg text-cyan-200 mt-0.5">4.30</div>
                </div>
                <div class="rounded-2xl p-3 bg-violetGlow/[0.06] border border-violetGlow/25">
                  <div class="text-[10px] font-mono uppercase tracking-wider text-violetGlow/90">Rank</div>
                  <div id="la-val-rank" class="font-mono font-semibold text-lg text-violet-200 mt-0.5">3 / 3</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tactile Morph & Parameter Sliders -->
          <div class="glass-panel p-2.5 sm:p-5 space-y-2.5 sm:space-y-4 flex-1 flex flex-col justify-between">
            <div class="space-y-2 sm:space-y-4">
              <!-- Transform Morph t Slider (Cyan) -->
              <div class="space-y-1 sm:space-y-1.5">
                <div class="flex items-center justify-between">
                  <label for="slider-la-morph" class="text-xs font-medium text-slate-200 flex items-center gap-2">
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>
                    Transform Morph I → A (t)
                  </label>
                  <span id="readout-la-morph" class="px-2 py-0.5 rounded-lg bg-cyanGlow/15 border border-cyanGlow/30 font-mono text-[11px] sm:text-xs text-cyanGlow font-semibold">
                    ${Math.round(appState.linalgLab.morph * 100)}%
                  </span>
                </div>
                <input
                  id="slider-la-morph"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value="${appState.linalgLab.morph}"
                  class="studio-slider-cyan"
                />
              </div>

              <!-- Matrix Parameter k / θ Slider (Amber) -->
              <div class="space-y-1 sm:space-y-1.5">
                <div class="flex items-center justify-between">
                  <label for="slider-la-param" id="label-la-param" class="text-xs font-medium text-slate-200 flex items-center gap-2">
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B]"></span>
                    ${escapeHtml(activePreset?.paramLabel || 'Coupling Off-Diag k')}
                  </label>
                  <span id="readout-la-param" class="px-2 py-0.5 rounded-lg bg-amberGlow/15 border border-amberGlow/30 font-mono text-[11px] sm:text-xs text-amberGlow font-semibold">
                    ${fmtParam(appState.linalgLab.param)}
                  </span>
                </div>
                <input
                  id="slider-la-param"
                  type="range"
                  min="${activePreset?.paramMin ?? -1.2}"
                  max="${activePreset?.paramMax ?? 1.4}"
                  step="${activePreset?.paramStep ?? 0.05}"
                  value="${appState.linalgLab.param}"
                  class="studio-slider-amber"
                />
              </div>

              <!-- Action Row: Animate Transform I -> A + Mobile Eigen Toggle -->
              <div class="flex items-center gap-2 pt-0.5">
                <button
                  id="btn-animate-linalg"
                  type="button"
                  class="flex-1 py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emeraldGlow via-cyanGlow to-violetGlow text-slate-950 font-display font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_24px_rgba(52,211,153,0.28)] hover:brightness-110 active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  <span id="la-anim-icon" aria-hidden="true">▶</span>
                  <span id="la-anim-text">Animate Transform I → A</span>
                </button>

                <label class="xl:hidden shrink-0 inline-flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-emeraldGlow/10 border border-emeraldGlow/30 text-[11px] font-mono text-emerald-200 cursor-pointer select-none">
                  <input
                    id="toggle-eigen-mobile"
                    type="checkbox"
                    ${appState.linalgLab.showEigen ? 'checked' : ''}
                    class="w-3.5 h-3.5 rounded accent-emerald-400 cursor-pointer"
                  />
                  <span>Eigen</span>
                </label>
              </div>
            </div>

            <!-- Desktop Eigen Span Toggle + Stage 2 Forward Link -->
            <div class="hidden xl:block pt-4 border-t border-white/10 space-y-3">
              <label class="flex items-center justify-between gap-3 cursor-pointer select-none group">
                <div class="flex items-center gap-2.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-emeraldGlow shadow-[0_0_8px_#34D399]"></span>
                  <div>
                    <div class="text-xs font-medium text-slate-200 group-hover:text-white">
                      Show Eigenvector Laser Spans &amp; Contrast Probe
                    </div>
                    <div class="text-[11px] text-slate-400">Watch eigenvectors lock on their span while non-eigenvectors swing off</div>
                  </div>
                </div>
                <input
                  id="toggle-eigen"
                  type="checkbox"
                  ${appState.linalgLab.showEigen ? 'checked' : ''}
                  class="w-4 h-4 rounded accent-emerald-400 cursor-pointer"
                />
              </label>

              <button
                id="btn-la-next-intuition"
                type="button"
                class="btn-glass w-full !justify-between !text-xs"
              >
                <span>Continue to Stage 2: 2D Basis &amp; SVD Playground</span>
                <span class="text-emeraldGlow" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;

  const sliderMorph = document.getElementById('slider-la-morph');
  const sliderParam = document.getElementById('slider-la-param');
  syncSliderTrackFill(sliderMorph);
  syncSliderTrackFill(sliderParam);

  const canvasHost = document.getElementById('linalg-3d-canvas');

  const handleLinAlgTelemetry = (m = {}) => {
    appState.linalgTelemetry = {
      ...appState.linalgTelemetry,
      ...m,
    };
    if (typeof m.morph === 'number') {
      appState.linalgLab.morph = m.morph;
      if (sliderMorph) {
        sliderMorph.value = String(m.morph);
        syncSliderTrackFill(sliderMorph);
      }
      const rMorph = document.getElementById('readout-la-morph');
      if (rMorph) rMorph.textContent = `${Math.round(m.morph * 100)}%`;
    }
    if (typeof m.param === 'number') {
      appState.linalgLab.param = m.param;
      const rParam = document.getElementById('readout-la-param');
      const unit = m.paramUnit ?? '';
      if (rParam) {
        rParam.textContent =
          unit === '°' ? `${Math.round(m.param)}°` : `${formatNum(m.param, 2)}${unit}`;
      }
    }
    updateLinAlgStage1TelemetryUI();
  };

  if (canvasHost && typeof LinAlg3DStudio === 'function') {
    try {
      const studio = new LinAlg3DStudio();
      studio.init(canvasHost, {
        presetId: activePreset?.id || 'eigen-stretch',
        morph: appState.linalgLab.morph,
        param: appState.linalgLab.param,
        showEigen: appState.linalgLab.showEigen,
        mechatronicsLens: isMechatronicsLens(),
        onTelemetry: handleLinAlgTelemetry,
      });
      studio.setCameraPreset?.(appState.linalgLab.cameraPreset);
      activeInstances.studio3D = studio;
      if (typeof studio.getTelemetry === 'function') {
        handleLinAlgTelemetry(studio.getTelemetry());
      }
    } catch (err) {
      console.error('[EIGENLAB] LinAlg3DStudio init error:', err);
      canvasHost.innerHTML = `
        <div class="w-full h-full flex items-center justify-center p-6 text-center text-sm text-slate-400">
          3D WebGL Matrix viewport could not initialize on this device.
        </div>
      `;
    }
  }

  updateLinAlgStage1LensUI();
  updateLinAlgStage1TelemetryUI();

  // Mobile Formula Drawer Toggle
  const mobBtn = document.getElementById('la-btn-toggle-mobile-formula');
  const mobDrawer = document.getElementById('la-mobile-formula-drawer');
  mobBtn?.addEventListener('click', () => {
    playSfx('tick');
    const isHidden = mobDrawer?.classList.toggle('hidden');
    mobBtn.setAttribute('aria-expanded', String(!isHidden));
    mobBtn.textContent = isHidden ? 'λ ▾' : 'λ ▴';
  });

  // Matrix Preset Selection
  container.querySelectorAll('[data-la-preset-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-la-preset-id');
      if (!id || id === appState.linalgLab.presetId) return;
      playSfx('tick');
      appState.linalgLab.presetId = id;
      const preset = getActiveLinAlgPreset(presets);
      if (preset) {
        appState.linalgLab.param = preset.defaultParam;
        appState.linalgLab.morph = 1.0;
        if (sliderParam) {
          sliderParam.min = String(preset.paramMin);
          sliderParam.max = String(preset.paramMax);
          sliderParam.step = String(preset.paramStep);
          sliderParam.value = String(preset.defaultParam);
          syncSliderTrackFill(sliderParam);
        }
        const lbl = document.getElementById('label-la-param');
        if (lbl) {
          lbl.innerHTML = `<span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B]"></span>${escapeHtml(preset.paramLabel)}`;
        }
        const rParam = document.getElementById('readout-la-param');
        if (rParam) {
          rParam.textContent =
            preset.paramUnit === '°'
              ? `${Math.round(preset.defaultParam)}°`
              : `${formatNum(preset.defaultParam, 2)}${preset.paramUnit || ''}`;
        }
      }

      container.querySelectorAll('[data-la-preset-id]').forEach((b) => {
        const sel = b.getAttribute('data-la-preset-id') === id;
        b.className = `shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
          sel
            ? 'bg-emeraldGlow/15 border-emeraldGlow/50 text-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.2)]'
            : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
        }`;
      });

      activeInstances.studio3D?.setPreset?.(id);
      activeInstances.studio3D?.setMorph?.(1.0);
      if (typeof activeInstances.studio3D?.getTelemetry === 'function') {
        handleLinAlgTelemetry(activeInstances.studio3D.getTelemetry());
      }
      markStageDone('3d-lab');
    });
  });

  // Camera Presets
  container.querySelectorAll('[data-la-camera-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const camId = btn.getAttribute('data-la-camera-preset');
      if (!camId) return;
      playSfx('tick');
      appState.linalgLab.cameraPreset = camId;
      container.querySelectorAll('[data-la-camera-preset]').forEach((b) => {
        const act = b.getAttribute('data-la-camera-preset') === camId;
        const isCompact = b.textContent.trim().length <= 3;
        b.className = `${isCompact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'} rounded-lg font-mono transition-all cursor-pointer ${
          act
            ? 'bg-white/15 text-white border border-white/20 shadow-sm'
            : 'text-slate-400 border border-transparent hover:text-white'
        }`;
      });
      activeInstances.studio3D?.setCameraPreset?.(camId);
    });
  });

  // Morph Slider
  sliderMorph?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.linalgLab.morph = val;
    syncSliderTrackFill(sliderMorph);
    const rMorph = document.getElementById('readout-la-morph');
    if (rMorph) rMorph.textContent = `${Math.round(val * 100)}%`;
    activeInstances.studio3D?.setMorph?.(val);
    markStageDone('3d-lab');
  });

  // Parameter Slider
  sliderParam?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.linalgLab.param = val;
    syncSliderTrackFill(sliderParam);
    activeInstances.studio3D?.setParam?.(val);
    markStageDone('3d-lab');
  });

  // Eigenvector Span Toggles (Desktop + Mobile synced)
  const eigToggle = document.getElementById('toggle-eigen');
  const eigToggleMob = document.getElementById('toggle-eigen-mobile');
  const handleEigenToggle = (checked) => {
    playSfx('tick');
    appState.linalgLab.showEigen = !!checked;
    if (eigToggle) eigToggle.checked = appState.linalgLab.showEigen;
    if (eigToggleMob) eigToggleMob.checked = appState.linalgLab.showEigen;
    activeInstances.studio3D?.toggleEigen?.(appState.linalgLab.showEigen);
  };
  eigToggle?.addEventListener('change', (e) => handleEigenToggle(e.target.checked));
  eigToggleMob?.addEventListener('change', (e) => handleEigenToggle(e.target.checked));

  // Animate Transform I -> A Button
  document.getElementById('btn-animate-linalg')?.addEventListener('click', () => {
    if (appState.linalgLab.isAnimating) return;
    playSfx('snap');
    appState.linalgLab.isAnimating = true;
    const icon = document.getElementById('la-anim-icon');
    const txt = document.getElementById('la-anim-text');
    if (icon) icon.textContent = '◌';
    if (txt) txt.textContent = 'Warping Space I → A...';

    const finishAnim = () => {
      appState.linalgLab.isAnimating = false;
      if (icon) icon.textContent = '▶';
      if (txt) txt.textContent = 'Animate Transform I → A';
      playSfx('success');
      markStageDone('3d-lab');
    };

    if (typeof activeInstances.studio3D?.animateTransform === 'function') {
      activeInstances.studio3D.animateTransform(finishAnim);
    } else {
      finishAnim();
    }
  });

  document.getElementById('btn-la-next-intuition')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('intuition');
  });
}

function updateLinAlgStage1LensUI() {
  const on = isMechatronicsLens();
  const titleEl = document.getElementById('la-hud-title');
  if (titleEl) {
    titleEl.textContent = on
      ? 'Rigid-Body Frame & Principal Ellipsoid'
      : '3D Linear Transformation A';
  }
  const mechBox = document.getElementById('la-hud-mech-indicator');
  const mechTxt = document.getElementById('la-hud-mech-text');
  if (mechBox) {
    mechBox.className = `hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
      on
        ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
        : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
    }`;
    const dot = mechBox.querySelector('span.rounded-full');
    if (dot) dot.className = `w-2 h-2 rounded-full ${on ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}`;
  }
  if (mechTxt) {
    mechTxt.textContent = on ? 'Pose Gimbal & Ellipsoid: LIVE' : '3D Ellipsoid: Standby';
  }
}

function updateLinAlgStage1TelemetryUI() {
  const t = appState.linalgTelemetry;
  const detStr = formatNum(t.det ?? 1, 2);
  const traceStr = formatNum(t.trace ?? 3, 2);
  const rankVal = t.rank ?? 3;

  const detEl = document.getElementById('la-val-det');
  const detMobEl = document.getElementById('la-val-det-compact');
  if (detEl) detEl.textContent = detStr;
  if (detMobEl) detMobEl.textContent = detStr;

  const traceEl = document.getElementById('la-val-trace');
  if (traceEl) traceEl.textContent = traceStr;

  const rankEl = document.getElementById('la-val-rank');
  const rankMobEl = document.getElementById('la-val-rank-compact');
  if (rankEl) rankEl.textContent = `${rankVal} / 3`;
  if (rankMobEl) rankMobEl.textContent = `R${rankVal} · ${formatNum(t.trace ?? 3, 1)}`;

  const badge = document.getElementById('la-badge-orient');
  if (badge) {
    const orient = t.orientation || 'Preserved';
    badge.textContent = orient;
    if (orient === 'Flipped') {
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-rose-500/15 border-rose-400/45 text-rose-200';
    } else if (orient === 'Collapsed') {
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-amberGlow/15 border-amberGlow/45 text-amber-200';
    } else {
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-emeraldGlow/15 border-emeraldGlow/40 text-emerald-200';
    }
  }

  const matEl = document.getElementById('la-hud-matrix-math');
  if (matEl && t.matrixLatex) typesetMath(matEl, t.matrixLatex, false);

  const eigEl = document.getElementById('la-telemetry-eigen-katex');
  if (eigEl && t.eigenLatex) typesetMath(eigEl, t.eigenLatex, false);
}

function mountLinAlgStage2Intuition(container) {
  const on = isMechatronicsLens();
  const s = getStoreState();
  const solvedLAQuizzes = (s.solvedQuizzes || []).filter((id) =>
    String(id).startsWith('la-quiz-')
  ).length;
  let activeSubTab = 'lab';

  container.innerHTML = `
    <section class="space-y-3 lg:space-y-6 view-enter">
      <!-- Mobile Segmented Sub-Tab Switcher (<lg) -->
      <div class="lg:hidden grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#0E121C]/90 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <button
          type="button"
          data-stage2-subtab="lab"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-emeraldGlow/20 border border-emeraldGlow/45 text-emerald-100 shadow-sm"
        >
          📐 2D Basis Lab
        </button>
        <button
          type="button"
          data-stage2-subtab="quiz"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white"
        >
          🎯 Match Quiz (${solvedLAQuizzes}/6)
        </button>
      </div>

      <!-- Interactive 2D Basis, Determinant & SVD Playground -->
      <div id="stage2-panel-lab" class="glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-emeraldGlow">Interactive Vector Space Geometry</div>
            <h2 id="stage2-lab-title" class="font-display font-bold text-xl text-white mt-0.5">
              ${on ? '2-DOF Robot Jacobian J & Manipulability Ellipse' : "Interactive 2D Linear Map A = [î'  ĵ'] & SVD Ellipse"}
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Drag the Cyan î&apos; and Amber ĵ&apos; basis vectors directly to watch the grid warp, signed area det(A) flip, SVD ellipse stretch, and real eigenvectors lock on.
            </p>
          </div>
          <span class="px-3 py-1 rounded-full text-[11px] font-mono bg-white/[0.04] border border-white/10 text-slate-300">
            Drag î&apos; &amp; ĵ&apos; handles
          </span>
        </div>

        <div id="linalg-2d-lab-host" class="w-full min-h-[300px] sm:min-h-[380px]"></div>
      </div>

      <!-- Visual "Match the Transform / Eigenvector" Quiz Engine -->
      <div id="stage2-panel-quiz" class="hidden lg:block glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-amberGlow">Geometric Intuition Mastery</div>
            <h2 class="font-display font-bold text-xl text-white mt-0.5">Match the Matrix &amp; Eigenvector Challenges</h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Read basis columns, determinant sign, rank collapse, and invariant eigenspans straight from the warped plane.
            </p>
          </div>
          <button
            id="btn-next-solver"
            type="button"
            class="btn-glass !text-xs"
          >
            Next: Linear Algebra Solver →
          </button>
        </div>

        <div id="linalg-quiz-engine-host" class="w-full min-h-[280px] sm:min-h-[320px]"></div>
      </div>
    </section>
  `;

  const panelLab = document.getElementById('stage2-panel-lab');
  const panelQuiz = document.getElementById('stage2-panel-quiz');
  const setSubTab = (tab) => {
    activeSubTab = tab;
    if (panelLab && panelQuiz) {
      panelLab.classList.toggle('hidden', tab !== 'lab');
      panelLab.classList.add('lg:block');
      panelQuiz.classList.toggle('hidden', tab !== 'quiz');
      panelQuiz.classList.add('lg:block');
    }
    container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
      const isAct = btn.getAttribute('data-stage2-subtab') === tab;
      btn.className = isAct
        ? 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-emeraldGlow/20 border border-emeraldGlow/45 text-emerald-100 shadow-sm'
        : 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white';
    });
    requestAnimationFrame(() => {
      if (tab === 'lab') {
        activeInstances.stackedLab?._resizeAll?.();
        activeInstances.stackedLab?._drawAll?.();
      } else {
        activeInstances.quizEngine?._resizeCanvases?.();
        activeInstances.quizEngine?._drawCanvases?.();
      }
      window.dispatchEvent(new Event('resize'));
    });
  };

  container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-stage2-subtab');
      if (next && next !== activeSubTab) {
        playSfx('tick');
        setSubTab(next);
      }
    });
  });

  const labHost = document.getElementById('linalg-2d-lab-host');
  if (labHost && typeof LinearTransform2DLab === 'function') {
    try {
      activeInstances.stackedLab = new LinearTransform2DLab(labHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onInteract: () => markStageDone('intuition'),
        onOpenQuiz: () => {
          playSfx('tick');
          setSubTab('quiz');
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] LinearTransform2DLab mount error:', err);
    }
  }

  const quizHost = document.getElementById('linalg-quiz-engine-host');
  if (quizHost && typeof LinAlgVisualQuizEngine === 'function') {
    try {
      const updateTabCount = (payload) => {
        const count =
          payload?.solvedCount ??
          (getStoreState().solvedQuizzes || []).filter((id) =>
            String(id).startsWith('la-quiz-')
          ).length;
        const quizBtn = container.querySelector('[data-stage2-subtab="quiz"]');
        if (quizBtn) quizBtn.textContent = `🎯 Match Quiz (${count}/6)`;
      };
      activeInstances.quizEngine = new LinAlgVisualQuizEngine(quizHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onAnswer: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
        onProgress: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
        onComplete: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] LinAlgVisualQuizEngine mount error:', err);
    }
  }

  document.getElementById('btn-next-solver')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('solver');
  });
}

function mountLinAlgStage3Solver(container) {
  container.innerHTML = `
    <section class="max-w-4xl mx-auto space-y-3 sm:space-y-5 view-enter">
      <div class="hidden md:flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-emeraldGlow">Interactive Matrix &amp; Eigen Drill</div>
          <h2 class="font-display font-bold text-2xl text-white mt-0.5">Paperless Linear Algebra Step Solver</h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
            Master Vectors &amp; Projections, Determinants &amp; Inverses, Eigenvalues &amp; Diagonalization, Gram-Schmidt, Least Squares, and SVD/SPD across 14 step-by-step problems.
          </p>
        </div>

        <button
          id="btn-next-word-problems"
          type="button"
          class="btn-glass !text-xs"
        >
          Next: Word Problems →
        </button>
      </div>

      <div id="paperless-solver-host" class="glass-panel p-2.5 sm:p-5 md:p-6 min-h-[420px]"></div>
    </section>
  `;

  const host = document.getElementById('paperless-solver-host');
  if (host && typeof PaperlessStepSolver === 'function') {
    try {
      activeInstances.stepSolver = new PaperlessStepSolver(host, {
        mode: 'linalg',
        problems: LINALG_PROBLEMS,
        tiers: LINALG_SOLVER_TIERS,
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onSolve: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProblemSolved: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProgress: (info) => {
          if (!info || (info.solvedCount ?? 1) >= 1) {
            markStageDone('solver');
            updateLessonStageDotsUI();
          }
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] LinAlg PaperlessStepSolver mount error:', err);
    }
  }

  document.getElementById('btn-next-word-problems')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('word-problems');
  });
}

// ---------------------------------------------------------------------------
// MECHATRONICS 01 — PID CONTROL & FEEDBACK STABILITY (`mech-pid`) STAGES 1–3
// ---------------------------------------------------------------------------

function mountPidStage1Lab3D(container) {
  const presets = normalizePidPresets();
  const activePreset = getActivePidPreset(presets);
  const lensOn = isMechatronicsLens();

  container.innerHTML = `
    <section class="space-y-1.5 sm:space-y-4 view-enter">
      <!-- Top Plant Preset Strip + Desktop Camera Presets -->
      <div class="flex items-center justify-between gap-2 sm:gap-3">
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar xl:flex-wrap flex-1 min-w-0 py-0.5" role="tablist" aria-label="Closed-loop plant presets">
          ${presets
            .map((p) => {
              const isSelected = activePreset && p.id === activePreset.id;
              return `
                <button
                  type="button"
                  data-pid-preset-id="${escapeHtml(p.id)}"
                  class="shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amberGlow/15 border-amberGlow/50 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }"
                >
                  ${escapeHtml(p.name)}
                </button>
              `;
            })
            .join('')}
        </div>

        <div class="hidden xl:flex items-center gap-1 bg-slate-900/75 p-1 rounded-xl border border-white/10 shrink-0">
          ${[
            { id: '3d', label: '3D Studio' },
            { id: 'front', label: 'Front 2D Graph' },
            { id: 'iso', label: 'Isometric' },
          ]
            .map((cam) => {
              const active = appState.pidLab.cameraPreset === cam.id;
              return `
                <button
                  type="button"
                  data-pid-camera-preset="${cam.id}"
                  class="px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    active
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 border border-transparent hover:text-white'
                  }"
                >
                  ${cam.label}
                </button>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- Main Split-Screen Mobile / Full-Bleed Desktop 3D PID Studio -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-2 sm:gap-4 items-stretch">
        <!-- 3D Viewport Canvas Container (Slightly trimmer on mobile so all 3 Kp/Ki/Kd sliders stay above the fold) -->
        <div class="xl:col-span-8 canvas-stage relative h-[30dvh] min-h-[190px] max-h-[248px] sm:h-[420px] sm:max-h-none xl:h-[calc(100vh-210px)] xl:min-h-[540px] flex flex-col">
          <div id="pid-3d-canvas" class="absolute inset-0 w-full h-full"></div>

          <!-- Top-Left Floating Plant & Controller HUD -->
          <div class="pointer-events-none relative z-10 flex items-start justify-between gap-2 p-2 sm:p-4">
            <div class="pointer-events-auto rounded-xl sm:rounded-2xl px-2.5 py-1 sm:px-4 sm:py-2.5 bg-[#0B0D12]/80 backdrop-blur-xl border border-white/15 shadow-lg max-w-full">
              <div class="hidden sm:flex items-center gap-2 mb-1">
                <span class="w-2 h-2 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B]"></span>
                <span id="pid-hud-title" class="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  ${lensOn ? 'Closed-Loop Servo Rig & Torque Effort' : 'Unity-Feedback Plant Transfer G(s)'}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-x-2.5 sm:gap-x-4 gap-y-0.5 text-[10px] sm:text-xs text-white">
                <span id="pid-hud-plant-math" class="text-cyan-200"></span>
              </div>
            </div>

            <!-- Mechatronics Torque/Rig Indicator -->
            <div id="pid-hud-mech-indicator" class="hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
              lensOn
                ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
                : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
            }">
              <div class="flex items-center gap-2 text-[11px] font-mono">
                <span class="w-2 h-2 rounded-full ${lensOn ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}"></span>
                <span id="pid-hud-mech-text">${lensOn ? 'Actuator Saturation & Caliper: ON' : 'Hardware Rig: Standard'}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Legend + Compact Mobile Camera Switcher -->
          <div class="pointer-events-none relative z-10 mt-auto p-1.5 sm:p-4 flex items-center justify-between gap-2">
            <div class="hidden sm:inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300">
              <span><span class="text-cyanGlow">●</span> Output y(t)</span>
              <span><span class="text-emeraldGlow">—</span> Setpoint r=1</span>
              <span><span class="text-amberGlow">●</span> Effort u(t)</span>
            </div>

            <div class="pointer-events-auto xl:hidden ml-auto flex items-center gap-0.5 bg-[#0B0D12]/80 backdrop-blur-md p-0.5 rounded-xl border border-white/15">
              ${[
                { id: '3d', label: '3D' },
                { id: 'front', label: '2D' },
                { id: 'iso', label: 'Iso' },
              ]
                .map((cam) => {
                  const active = appState.pidLab.cameraPreset === cam.id;
                  return `
                    <button
                      type="button"
                      data-pid-camera-preset="${cam.id}"
                      class="px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                        active
                          ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                          : 'text-slate-400 border border-transparent hover:text-white'
                      }"
                    >
                      ${cam.label}
                    </button>
                  `;
                })
                .join('')}
            </div>

            <div class="hidden xl:inline-flex items-center px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-400">
              Drag to orbit • Scroll to zoom
            </div>
          </div>
        </div>

        <!-- Tactile PID Telemetry + 3-Channel Kp / Ki / Kd Sliders -->
        <aside class="xl:col-span-4 flex flex-col gap-1.5 sm:gap-4 xl:h-[calc(100vh-210px)] xl:overflow-y-auto studio-scroll pr-0.5">
          <!-- Compact 1-Row Mobile Telemetry / Expanded Desktop Spec Card -->
          <div class="glass-panel p-2 sm:p-5 space-y-1.5 sm:space-y-4">
            <div class="flex items-center justify-between gap-2">
              <div class="hidden xl:block">
                <div class="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-400">Closed-Loop Performance</div>
                <h2 class="font-display font-semibold text-sm text-white mt-0.5">Overshoot, Error &amp; Stability</h2>
              </div>

              <!-- Mobile Compact Inline Readout -->
              <div class="flex xl:hidden items-center gap-1.5 min-w-0 flex-1">
                <div class="flex-1 min-w-0 rounded-xl px-2 py-1 bg-cyanGlow/[0.08] border border-cyanGlow/25">
                  <div class="text-[8.5px] font-mono uppercase tracking-wider text-cyanGlow/90 truncate">Overshoot</div>
                  <div id="pid-val-os-compact" class="font-mono font-semibold text-xs text-white leading-tight">10.0%</div>
                </div>
                <div class="flex-1 min-w-0 rounded-xl px-2 py-1 bg-violetGlow/[0.08] border border-violetGlow/25">
                  <div class="text-[8.5px] font-mono uppercase tracking-wider text-violetGlow/90 truncate">SS Error eₛₛ</div>
                  <div id="pid-val-ess-compact" class="font-mono font-semibold text-xs text-violet-200 leading-tight">0.004</div>
                </div>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <div
                  id="pid-badge-stability"
                  class="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-emeraldGlow/15 border-emeraldGlow/40 text-emerald-200"
                >
                  STABLE
                </div>
                <button
                  id="pid-btn-toggle-mobile-formula"
                  type="button"
                  aria-expanded="false"
                  title="Toggle PID controller C(s) formula"
                  class="xl:hidden px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/15 text-[10px] font-mono text-amber-200 cursor-pointer"
                >
                  C(s) ▾
                </button>
              </div>
            </div>

            <!-- Collapsible on Mobile (<xl), Always Open on Desktop (xl:block) -->
            <div id="pid-mobile-formula-drawer" class="hidden xl:block space-y-2.5 sm:space-y-3.5">
              <div class="katex-card flex flex-col items-center justify-center gap-1.5 min-h-[58px] sm:min-h-[72px]">
                <div id="pid-telemetry-controller-katex" class="text-amber-200 text-xs sm:text-sm overflow-x-auto"></div>
              </div>

              <div class="hidden xl:grid grid-cols-3 gap-2">
                <div class="rounded-2xl p-3 bg-cyanGlow/[0.06] border border-cyanGlow/25">
                  <div class="text-[10px] font-mono uppercase tracking-wider text-cyanGlow/90">Overshoot</div>
                  <div id="pid-val-os" class="font-mono font-semibold text-base text-white mt-0.5">10.0%</div>
                </div>
                <div class="rounded-2xl p-3 bg-violetGlow/[0.06] border border-violetGlow/25">
                  <div class="text-[10px] font-mono uppercase tracking-wider text-violetGlow/90">SS Error</div>
                  <div id="pid-val-ess" class="font-mono font-semibold text-base text-violet-200 mt-0.5">0.004</div>
                </div>
                <div class="rounded-2xl p-3 bg-emeraldGlow/[0.06] border border-emeraldGlow/25">
                  <div class="text-[10px] font-mono uppercase tracking-wider text-emeraldGlow/90">Settling Ts</div>
                  <div id="pid-val-ts" class="font-mono font-semibold text-base text-emerald-200 mt-0.5">3.20s</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Compact 3-Slider PID Gain Deck (Kp Cyan, Ki Violet, Kd Amber) -->
          <div class="glass-panel p-2.5 sm:p-5 space-y-2 sm:space-y-3.5 flex-1 flex flex-col justify-between">
            <div class="space-y-1.5 sm:space-y-3">
              <!-- Proportional Gain Kp (Cyan) -->
              <div class="space-y-0.5 sm:space-y-1">
                <div class="flex items-center justify-between">
                  <label for="slider-pid-kp" class="text-[11px] sm:text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>
                    <span>Proportional Gain K<sub>p</sub></span>
                  </label>
                  <span id="readout-pid-kp" class="px-1.5 py-0.5 rounded-lg bg-cyanGlow/15 border border-cyanGlow/30 font-mono text-[10px] sm:text-xs text-cyanGlow font-semibold">
                    ${formatNum(appState.pidLab.kp, 1)}
                  </span>
                </div>
                <input
                  id="slider-pid-kp"
                  type="range"
                  min="0"
                  max="12"
                  step="0.2"
                  value="${appState.pidLab.kp}"
                  class="studio-slider-cyan"
                />
              </div>

              <!-- Integral Gain Ki (Violet/Emerald) -->
              <div class="space-y-0.5 sm:space-y-1">
                <div class="flex items-center justify-between">
                  <label for="slider-pid-ki" class="text-[11px] sm:text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-violetGlow shadow-[0_0_8px_#A78BFA]"></span>
                    <span>Integral Gain K<sub>i</sub> (Zero Droop)</span>
                  </label>
                  <span id="readout-pid-ki" class="px-1.5 py-0.5 rounded-lg bg-violetGlow/15 border border-violetGlow/30 font-mono text-[10px] sm:text-xs text-violet-200 font-semibold">
                    ${formatNum(appState.pidLab.ki, 1)}
                  </span>
                </div>
                <input
                  id="slider-pid-ki"
                  type="range"
                  min="0"
                  max="6"
                  step="0.1"
                  value="${appState.pidLab.ki}"
                  class="studio-slider-cyan"
                />
              </div>

              <!-- Derivative Gain Kd (Amber) -->
              <div class="space-y-0.5 sm:space-y-1">
                <div class="flex items-center justify-between">
                  <label for="slider-pid-kd" class="text-[11px] sm:text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B]"></span>
                    <span>Derivative Gain K<sub>d</sub> (Damping)</span>
                  </label>
                  <span id="readout-pid-kd" class="px-1.5 py-0.5 rounded-lg bg-amberGlow/15 border border-amberGlow/30 font-mono text-[10px] sm:text-xs text-amberGlow font-semibold">
                    ${formatNum(appState.pidLab.kd, 1)}
                  </span>
                </div>
                <input
                  id="slider-pid-kd"
                  type="range"
                  min="0"
                  max="4"
                  step="0.1"
                  value="${appState.pidLab.kd}"
                  class="studio-slider-amber"
                />
              </div>

              <!-- Action Row: Run Step Response + Load Disturbance Toggle + Effort Toggle -->
              <div class="flex items-center gap-1.5 pt-0.5">
                <button
                  id="btn-animate-pid"
                  type="button"
                  class="flex-1 py-2 sm:py-3 px-2.5 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amberGlow via-cyanGlow to-emeraldGlow text-slate-950 font-display font-bold text-[11px] sm:text-sm tracking-wide shadow-[0_0_22px_rgba(245,158,11,0.28)] hover:brightness-110 active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span id="pid-anim-icon" aria-hidden="true">▶</span>
                  <span id="pid-anim-text">Run Step</span>
                </button>

                <button
                  id="btn-toggle-pid-disturbance"
                  type="button"
                  aria-pressed="${appState.pidLab.disturbance ? 'true' : 'false'}"
                  class="shrink-0 py-2 sm:py-3 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-mono font-semibold border transition-all cursor-pointer ${
                    appState.pidLab.disturbance
                      ? 'bg-rose-500/20 border-rose-400/55 text-rose-200 shadow-[0_0_16px_rgba(251,113,133,0.25)]'
                      : 'bg-slate-900/70 border-white/15 text-slate-300 hover:border-white/30'
                  }"
                >
                  ⚡ Load ${appState.pidLab.disturbance ? 'ON' : 'OFF'}
                </button>

                <label class="xl:hidden shrink-0 inline-flex items-center gap-1 px-2 py-2 rounded-xl bg-amberGlow/10 border border-amberGlow/30 text-[10px] font-mono text-amber-200 cursor-pointer select-none">
                  <input
                    id="toggle-pid-effort-mobile"
                    type="checkbox"
                    ${appState.pidLab.showEffort ? 'checked' : ''}
                    class="w-3.5 h-3.5 rounded accent-amber-400 cursor-pointer"
                  />
                  <span>u(t)</span>
                </label>
              </div>
            </div>

            <!-- Desktop Effort Ribbon Toggle + Stage 2 Forward Link -->
            <div class="hidden xl:block pt-3 border-t border-white/10 space-y-2.5">
              <label class="flex items-center justify-between gap-3 cursor-pointer select-none group">
                <div class="flex items-center gap-2.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B]"></span>
                  <div>
                    <div class="text-xs font-medium text-slate-200 group-hover:text-white">
                      Show 3D Control Effort Ribbon u(t)
                    </div>
                    <div class="text-[11px] text-slate-400">Visualize actuator torque demand &amp; saturation rails</div>
                  </div>
                </div>
                <input
                  id="toggle-pid-effort"
                  type="checkbox"
                  ${appState.pidLab.showEffort ? 'checked' : ''}
                  class="w-4 h-4 rounded accent-amber-400 cursor-pointer"
                />
              </label>

              <button
                id="btn-pid-next-intuition"
                type="button"
                class="btn-glass w-full !justify-between !text-xs"
              >
                <span>Continue to Stage 2: P/I/D Effort Decomposition Lab</span>
                <span class="text-amberGlow" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;

  const sliderKp = document.getElementById('slider-pid-kp');
  const sliderKi = document.getElementById('slider-pid-ki');
  const sliderKd = document.getElementById('slider-pid-kd');
  syncSliderTrackFill(sliderKp);
  syncSliderTrackFill(sliderKi);
  syncSliderTrackFill(sliderKd);

  const canvasHost = document.getElementById('pid-3d-canvas');

  const handlePidTelemetry = (m = {}) => {
    appState.pidTelemetry = {
      ...appState.pidTelemetry,
      ...m,
    };
    updatePidStage1TelemetryUI();
  };

  if (canvasHost && typeof Pid3DStudio === 'function') {
    try {
      const studio = new Pid3DStudio();
      studio.init(canvasHost, {
        presetId: activePreset?.id || 'dc-servo',
        kp: appState.pidLab.kp,
        ki: appState.pidLab.ki,
        kd: appState.pidLab.kd,
        disturbance: appState.pidLab.disturbance,
        showEffort: appState.pidLab.showEffort,
        mechatronicsLens: isMechatronicsLens(),
        onTelemetry: handlePidTelemetry,
      });
      studio.setCameraPreset?.(appState.pidLab.cameraPreset);
      activeInstances.studio3D = studio;
      if (typeof studio.getTelemetry === 'function') {
        handlePidTelemetry(studio.getTelemetry());
      }
    } catch (err) {
      console.error('[EIGENLAB] Pid3DStudio init error:', err);
      canvasHost.innerHTML = `
        <div class="w-full h-full flex items-center justify-center p-6 text-center text-sm text-slate-400">
          3D WebGL PID Control viewport could not initialize on this device.
        </div>
      `;
    }
  }

  updatePidStage1LensUI();
  updatePidStage1TelemetryUI();

  // Mobile C(s) Formula Drawer Toggle
  const mobBtn = document.getElementById('pid-btn-toggle-mobile-formula');
  const mobDrawer = document.getElementById('pid-mobile-formula-drawer');
  mobBtn?.addEventListener('click', () => {
    playSfx('tick');
    const isHidden = mobDrawer?.classList.toggle('hidden');
    mobBtn.setAttribute('aria-expanded', String(!isHidden));
    mobBtn.textContent = isHidden ? 'C(s) ▾' : 'C(s) ▴';
  });

  // Helper to sync disturbance button styling
  const syncDistBtn = () => {
    const btn = document.getElementById('btn-toggle-pid-disturbance');
    if (!btn) return;
    const active = appState.pidLab.disturbance;
    btn.setAttribute('aria-pressed', String(active));
    btn.textContent = `⚡ Load ${active ? 'ON' : 'OFF'}`;
    btn.className = `shrink-0 py-2 sm:py-3 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-mono font-semibold border transition-all cursor-pointer ${
      active
        ? 'bg-rose-500/20 border-rose-400/55 text-rose-200 shadow-[0_0_16px_rgba(251,113,133,0.25)]'
        : 'bg-slate-900/70 border-white/15 text-slate-300 hover:border-white/30'
    }`;
  };

  // Plant Preset Selection
  container.querySelectorAll('[data-pid-preset-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-pid-preset-id');
      if (!id || id === appState.pidLab.presetId) return;
      playSfx('tick');
      appState.pidLab.presetId = id;
      const preset = getActivePidPreset(presets);
      if (preset) {
        appState.pidLab.kp = preset.defaultKp;
        appState.pidLab.ki = preset.defaultKi;
        appState.pidLab.kd = preset.defaultKd;
        appState.pidLab.disturbance = preset.defaultDisturbance;

        if (sliderKp) {
          sliderKp.value = String(preset.defaultKp);
          syncSliderTrackFill(sliderKp);
        }
        if (sliderKi) {
          sliderKi.value = String(preset.defaultKi);
          syncSliderTrackFill(sliderKi);
        }
        if (sliderKd) {
          sliderKd.value = String(preset.defaultKd);
          syncSliderTrackFill(sliderKd);
        }
        const rKp = document.getElementById('readout-pid-kp');
        const rKi = document.getElementById('readout-pid-ki');
        const rKd = document.getElementById('readout-pid-kd');
        if (rKp) rKp.textContent = formatNum(preset.defaultKp, 1);
        if (rKi) rKi.textContent = formatNum(preset.defaultKi, 1);
        if (rKd) rKd.textContent = formatNum(preset.defaultKd, 1);
        syncDistBtn();
      }

      container.querySelectorAll('[data-pid-preset-id]').forEach((b) => {
        const sel = b.getAttribute('data-pid-preset-id') === id;
        b.className = `shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
          sel
            ? 'bg-amberGlow/15 border-amberGlow/50 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
            : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
        }`;
      });

      activeInstances.studio3D?.setPreset?.(id);
      if (typeof activeInstances.studio3D?.getTelemetry === 'function') {
        handlePidTelemetry(activeInstances.studio3D.getTelemetry());
      }
      markStageDone('3d-lab');
    });
  });

  // Camera Presets
  container.querySelectorAll('[data-pid-camera-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const camId = btn.getAttribute('data-pid-camera-preset');
      if (!camId) return;
      playSfx('tick');
      appState.pidLab.cameraPreset = camId;
      container.querySelectorAll('[data-pid-camera-preset]').forEach((b) => {
        const act = b.getAttribute('data-pid-camera-preset') === camId;
        const isCompact = b.textContent.trim().length <= 3;
        b.className = `${isCompact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'} rounded-lg font-mono transition-all cursor-pointer ${
          act
            ? 'bg-white/15 text-white border border-white/20 shadow-sm'
            : 'text-slate-400 border border-transparent hover:text-white'
        }`;
      });
      activeInstances.studio3D?.setCameraPreset?.(camId);
    });
  });

  // Gain Sliders (Kp, Ki, Kd)
  const applyGains = () => {
    activeInstances.studio3D?.setGains?.({
      kp: appState.pidLab.kp,
      ki: appState.pidLab.ki,
      kd: appState.pidLab.kd,
    });
    markStageDone('3d-lab');
  };

  sliderKp?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.pidLab.kp = val;
    syncSliderTrackFill(sliderKp);
    const r = document.getElementById('readout-pid-kp');
    if (r) r.textContent = formatNum(val, 1);
    applyGains();
  });

  sliderKi?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.pidLab.ki = val;
    syncSliderTrackFill(sliderKi);
    const r = document.getElementById('readout-pid-ki');
    if (r) r.textContent = formatNum(val, 1);
    applyGains();
  });

  sliderKd?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.pidLab.kd = val;
    syncSliderTrackFill(sliderKd);
    const r = document.getElementById('readout-pid-kd');
    if (r) r.textContent = formatNum(val, 1);
    applyGains();
  });

  // Disturbance Toggle Button
  document.getElementById('btn-toggle-pid-disturbance')?.addEventListener('click', () => {
    playSfx('snap');
    appState.pidLab.disturbance = !appState.pidLab.disturbance;
    syncDistBtn();
    activeInstances.studio3D?.setDisturbance?.(appState.pidLab.disturbance);
    markStageDone('3d-lab');
  });

  // Effort Ribbon Toggles (Desktop + Mobile synced)
  const effToggle = document.getElementById('toggle-pid-effort');
  const effToggleMob = document.getElementById('toggle-pid-effort-mobile');
  const handleEffortToggle = (checked) => {
    playSfx('tick');
    appState.pidLab.showEffort = !!checked;
    if (effToggle) effToggle.checked = appState.pidLab.showEffort;
    if (effToggleMob) effToggleMob.checked = appState.pidLab.showEffort;
    activeInstances.studio3D?.toggleEffort?.(appState.pidLab.showEffort);
  };
  effToggle?.addEventListener('change', (e) => handleEffortToggle(e.target.checked));
  effToggleMob?.addEventListener('change', (e) => handleEffortToggle(e.target.checked));

  // Run Step Response Button
  document.getElementById('btn-animate-pid')?.addEventListener('click', () => {
    if (appState.pidLab.isAnimating) return;
    playSfx('snap');
    appState.pidLab.isAnimating = true;
    const icon = document.getElementById('pid-anim-icon');
    const txt = document.getElementById('pid-anim-text');
    if (icon) icon.textContent = '◌';
    if (txt) txt.textContent = 'Simulating...';

    const finishAnim = () => {
      appState.pidLab.isAnimating = false;
      if (icon) icon.textContent = '▶';
      if (txt) txt.textContent = 'Run Step';
      playSfx('success');
      markStageDone('3d-lab');
    };

    if (typeof activeInstances.studio3D?.animateResponse === 'function') {
      activeInstances.studio3D.animateResponse(finishAnim);
    } else {
      finishAnim();
    }
  });

  document.getElementById('btn-pid-next-intuition')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('intuition');
  });
}

function updatePidStage1LensUI() {
  const on = isMechatronicsLens();
  const titleEl = document.getElementById('pid-hud-title');
  if (titleEl) {
    titleEl.textContent = on
      ? 'Closed-Loop Servo Rig & Torque Effort'
      : 'Unity-Feedback Plant Transfer G(s)';
  }
  const mechBox = document.getElementById('pid-hud-mech-indicator');
  const mechTxt = document.getElementById('pid-hud-mech-text');
  if (mechBox) {
    mechBox.className = `hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
      on
        ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
        : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
    }`;
    const dot = mechBox.querySelector('span.rounded-full');
    if (dot) dot.className = `w-2 h-2 rounded-full ${on ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}`;
  }
  if (mechTxt) {
    mechTxt.textContent = on ? 'Actuator Saturation & Caliper: ON' : 'Hardware Rig: Standard';
  }
}

function updatePidStage1TelemetryUI() {
  const t = appState.pidTelemetry;
  const osStr = Number.isFinite(t.overshootPct) ? `${formatNum(t.overshootPct, 1)}%` : '—';
  const essStr = Number.isFinite(t.steadyStateError) ? formatNum(t.steadyStateError, 3) : '—';
  const tsStr =
    Number.isFinite(t.settlingTime) && t.settlingTime <= 8.0
      ? `${formatNum(t.settlingTime, 2)}s`
      : '>8s';

  const osEl = document.getElementById('pid-val-os');
  const osMobEl = document.getElementById('pid-val-os-compact');
  if (osEl) osEl.textContent = osStr;
  if (osMobEl) osMobEl.textContent = osStr;

  const essEl = document.getElementById('pid-val-ess');
  const essMobEl = document.getElementById('pid-val-ess-compact');
  if (essEl) essEl.textContent = essStr;
  if (essMobEl) essMobEl.textContent = essStr;

  const tsEl = document.getElementById('pid-val-ts');
  if (tsEl) tsEl.textContent = tsStr;

  const badge = document.getElementById('pid-badge-stability');
  if (badge) {
    const st = t.stability || 'STABLE';
    badge.textContent = st;
    if (st === 'UNSTABLE') {
      badge.className =
        'px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-rose-500/20 border-rose-400/50 text-rose-200';
    } else if (st === 'OSCILLATORY') {
      badge.className =
        'px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-amberGlow/15 border-amberGlow/45 text-amber-200';
    } else {
      badge.className =
        'px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-emeraldGlow/15 border-emeraldGlow/40 text-emerald-200';
    }
  }

  const plantEl = document.getElementById('pid-hud-plant-math');
  if (plantEl && t.plantLatex) typesetMath(plantEl, t.plantLatex, false);

  const ctrlEl = document.getElementById('pid-telemetry-controller-katex');
  if (ctrlEl && t.controllerLatex) typesetMath(ctrlEl, t.controllerLatex, false);
}

function mountPidStage2Intuition(container) {
  const on = isMechatronicsLens();
  const s = getStoreState();
  const solvedPidQuizzes = (s.solvedQuizzes || []).filter((id) =>
    String(id).startsWith('pid-quiz-')
  ).length;
  let activeSubTab = 'lab';

  container.innerHTML = `
    <section class="space-y-3 lg:space-y-6 view-enter">
      <!-- Mobile Segmented Sub-Tab Switcher (<lg) -->
      <div class="lg:hidden grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#0E121C]/90 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <button
          type="button"
          data-stage2-subtab="lab"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-amberGlow/20 border border-amberGlow/45 text-amber-100 shadow-sm"
        >
          📊 P/I/D Lab
        </button>
        <button
          type="button"
          data-stage2-subtab="quiz"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white"
        >
          🎯 Tuning Quiz (${solvedPidQuizzes}/6)
        </button>
      </div>

      <!-- Interactive P / I / D Control Effort Decomposition Lab -->
      <div id="stage2-panel-lab" class="glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-amberGlow">Controller Anatomy &amp; Effort Channels</div>
            <h2 id="stage2-lab-title" class="font-display font-bold text-xl text-white mt-0.5">
              ${on ? 'Servo Position θ(t) & Motor Torque τ(t) (P/I/D Channels)' : 'Closed-Loop Output y(t) & P/I/D Effort Decomposition u(t)'}
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Scrub the synchronized time cursor to dissect how Proportional kick, Integral lift, and Derivative braking combine into total actuator effort.
            </p>
          </div>
          <span class="px-3 py-1 rounded-full text-[11px] font-mono bg-white/[0.04] border border-white/10 text-slate-300">
            Scrub time t ∈ [0, 8s]
          </span>
        </div>

        <div id="pid-decomp-lab-host" class="w-full min-h-[300px] sm:min-h-[380px]"></div>
      </div>

      <!-- Visual PID Tuning & Stability Quiz Engine -->
      <div id="stage2-panel-quiz" class="hidden lg:block glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-cyanGlow">Feedback Diagnostics Mastery</div>
            <h2 class="font-display font-bold text-xl text-white mt-0.5">PID Tuning &amp; Stability Visual Challenges</h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Diagnose P-only droop, derivative braking, load disturbance recovery, RHP instability, and Ziegler-Nichols ultimate oscillations by eye.
            </p>
          </div>
          <button
            id="btn-next-solver"
            type="button"
            class="btn-glass !text-xs"
          >
            Next: Control &amp; PID Solver →
          </button>
        </div>

        <div id="pid-quiz-engine-host" class="w-full min-h-[280px] sm:min-h-[320px]"></div>
      </div>
    </section>
  `;

  const panelLab = document.getElementById('stage2-panel-lab');
  const panelQuiz = document.getElementById('stage2-panel-quiz');
  const setSubTab = (tab) => {
    activeSubTab = tab;
    if (panelLab && panelQuiz) {
      panelLab.classList.toggle('hidden', tab !== 'lab');
      panelLab.classList.add('lg:block');
      panelQuiz.classList.toggle('hidden', tab !== 'quiz');
      panelQuiz.classList.add('lg:block');
    }
    container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
      const isAct = btn.getAttribute('data-stage2-subtab') === tab;
      btn.className = isAct
        ? 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-amberGlow/20 border border-amberGlow/45 text-amber-100 shadow-sm'
        : 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white';
    });
    requestAnimationFrame(() => {
      if (tab === 'lab') {
        activeInstances.stackedLab?._resizeAll?.();
        activeInstances.stackedLab?._drawAll?.();
      } else {
        activeInstances.quizEngine?._resizeCanvases?.();
        activeInstances.quizEngine?._drawCanvases?.();
      }
      window.dispatchEvent(new Event('resize'));
    });
  };

  container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-stage2-subtab');
      if (next && next !== activeSubTab) {
        playSfx('tick');
        setSubTab(next);
      }
    });
  });

  const labHost = document.getElementById('pid-decomp-lab-host');
  if (labHost && typeof PidDecompositionLab === 'function') {
    try {
      activeInstances.stackedLab = new PidDecompositionLab(labHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onInteract: () => markStageDone('intuition'),
        onOpenQuiz: () => {
          playSfx('tick');
          setSubTab('quiz');
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] PidDecompositionLab mount error:', err);
    }
  }

  const quizHost = document.getElementById('pid-quiz-engine-host');
  if (quizHost && typeof PidVisualQuizEngine === 'function') {
    try {
      const updateTabCount = (payload) => {
        const count =
          payload?.solvedCount ??
          (getStoreState().solvedQuizzes || []).filter((id) =>
            String(id).startsWith('pid-quiz-')
          ).length;
        const quizBtn = container.querySelector('[data-stage2-subtab="quiz"]');
        if (quizBtn) quizBtn.textContent = `🎯 Tuning Quiz (${count}/6)`;
      };
      activeInstances.quizEngine = new PidVisualQuizEngine(quizHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onAnswer: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
        onProgress: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
        onComplete: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] PidVisualQuizEngine mount error:', err);
    }
  }

  document.getElementById('btn-next-solver')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('solver');
  });
}

function mountPidStage3Solver(container) {
  container.innerHTML = `
    <section class="max-w-4xl mx-auto space-y-3 sm:space-y-5 view-enter">
      <div class="hidden md:flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-amberGlow">Interactive Control Engineering Drill</div>
          <h2 class="font-display font-bold text-2xl text-white mt-0.5">Paperless Control &amp; PID Step Solver</h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
            Master Closed-Loop Transfer Functions, Final Value Theorem, Routh-Hurwitz Stability Bounds, Ziegler-Nichols PID Tuning, and Phase/Delay Margins across 14 step-by-step problems.
          </p>
        </div>

        <button
          id="btn-next-word-problems"
          type="button"
          class="btn-glass !text-xs"
        >
          Next: Word Problems →
        </button>
      </div>

      <div id="paperless-solver-host" class="glass-panel p-2.5 sm:p-5 md:p-6 min-h-[420px]"></div>
    </section>
  `;

  const host = document.getElementById('paperless-solver-host');
  if (host && typeof PaperlessStepSolver === 'function') {
    try {
      activeInstances.stepSolver = new PaperlessStepSolver(host, {
        mode: 'pid',
        problems: PID_PROBLEMS,
        tiers: PID_SOLVER_TIERS,
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onSolve: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProblemSolved: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProgress: (info) => {
          if (!info || (info.solvedCount ?? 1) >= 1) {
            markStageDone('solver');
            updateLessonStageDotsUI();
          }
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] PID PaperlessStepSolver mount error:', err);
    }
  }

  document.getElementById('btn-next-word-problems')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('word-problems');
  });
}

// ---------------------------------------------------------------------------
// CONTROLS 01 — PHYSICAL SYSTEM MODELING & s-PLANE (`mech-modeling`) STAGES 1–3
// ---------------------------------------------------------------------------

function mountModelingStage1Lab3D(container) {
  const presets = normalizeModelingPresets();
  const activePreset = getActiveModelingPreset(presets);
  const lensOn = isMechatronicsLens();
  const pLabels = activePreset?.paramLabels || {
    m: 'Mass m (kg)',
    c: 'Damper c (N·s/m)',
    k: 'Spring k (N/m)',
  };
  const clActive = appState.modelingLab.kp > 0.01;

  container.innerHTML = `
    <section class="space-y-1.5 sm:space-y-4 view-enter">
      <!-- Top Physical System Preset Strip + Desktop Camera Presets -->
      <div class="flex items-center justify-between gap-2 sm:gap-3">
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar xl:flex-wrap flex-1 min-w-0 py-0.5" role="tablist" aria-label="Physical system presets">
          ${presets
            .map((p) => {
              const isSelected = activePreset && p.id === activePreset.id;
              return `
                <button
                  type="button"
                  data-mod-preset-id="${escapeHtml(p.id)}"
                  class="shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amberGlow/15 border-amberGlow/50 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }"
                >
                  ${escapeHtml(p.name)}
                </button>
              `;
            })
            .join('')}
        </div>

        <div class="hidden xl:flex items-center gap-1 bg-slate-900/75 p-1 rounded-xl border border-white/10 shrink-0">
          ${[
            { id: '3d', label: '3D Studio' },
            { id: 'front', label: 'Front 2D Graph' },
            { id: 'iso', label: 'Isometric' },
          ]
            .map((cam) => {
              const active = appState.modelingLab.cameraPreset === cam.id;
              return `
                <button
                  type="button"
                  data-mod-camera-preset="${cam.id}"
                  class="px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    active
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 border border-transparent hover:text-white'
                  }"
                >
                  ${cam.label}
                </button>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- Main Split-Screen Mobile / Full-Bleed Desktop 3D Physical Modeling Studio -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-2 sm:gap-4 items-stretch">
        <!-- 3D Viewport Canvas Container -->
        <div class="xl:col-span-8 canvas-stage relative h-[30dvh] min-h-[190px] max-h-[246px] sm:h-[420px] sm:max-h-none xl:h-[calc(100vh-210px)] xl:min-h-[540px] flex flex-col">
          <div id="modeling-3d-canvas" class="absolute inset-0 w-full h-full"></div>

          <!-- Top-Left Floating Governing ODE HUD -->
          <div class="pointer-events-none relative z-10 flex items-start justify-between gap-2 p-2 sm:p-4">
            <div class="pointer-events-auto rounded-xl sm:rounded-2xl px-2.5 py-1 sm:px-4 sm:py-2.5 bg-[#0B0D12]/80 backdrop-blur-xl border border-white/15 shadow-lg max-w-full">
              <div class="hidden sm:flex items-center gap-2 mb-1">
                <span class="w-2 h-2 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B]"></span>
                <span id="mod-hud-title" class="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  ${lensOn ? 'Physical Hardware ODE → s-Plane Rig' : 'Governing Differential Equation'}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-x-2.5 text-[10px] sm:text-xs text-white">
                <span id="mod-hud-ode-math" class="text-cyan-200"></span>
              </div>
            </div>

            <!-- Hardware Rig Status Indicator -->
            <div id="mod-hud-mech-indicator" class="hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
              lensOn
                ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
                : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
            }">
              <div class="flex items-center gap-2 text-[11px] font-mono">
                <span class="w-2 h-2 rounded-full ${lensOn ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}"></span>
                <span id="mod-hud-mech-text">${lensOn ? '2% Corridor & Root Locus: ON' : 'Physical Rig: Standard'}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Legend + Mobile Camera Switcher -->
          <div class="pointer-events-none relative z-10 mt-auto p-1.5 sm:p-4 flex items-center justify-between gap-2">
            <div class="hidden sm:inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300">
              <span><span class="text-cyanGlow">×</span> s-Plane Poles</span>
              <span><span class="text-emeraldGlow">—</span> Setpoint</span>
              <span><span class="text-amberGlow">●</span> 3D Rig</span>
            </div>

            <div class="pointer-events-auto xl:hidden ml-auto flex items-center gap-0.5 bg-[#0B0D12]/80 backdrop-blur-md p-0.5 rounded-xl border border-white/15">
              ${[
                { id: '3d', label: '3D' },
                { id: 'front', label: '2D' },
                { id: 'iso', label: 'Iso' },
              ]
                .map((cam) => {
                  const active = appState.modelingLab.cameraPreset === cam.id;
                  return `
                    <button
                      type="button"
                      data-mod-camera-preset="${cam.id}"
                      class="px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                        active
                          ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                          : 'text-slate-400 border border-transparent hover:text-white'
                      }"
                    >
                      ${cam.label}
                    </button>
                  `;
                })
                .join('')}
            </div>

            <div class="hidden xl:inline-flex items-center px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-400">
              Drag to orbit • Scroll to zoom
            </div>
          </div>
        </div>

        <!-- Tactile Physical Parameters & Live s-Plane Telemetry -->
        <aside class="xl:col-span-4 flex flex-col gap-1.5 sm:gap-4 xl:h-[calc(100vh-210px)] xl:overflow-y-auto studio-scroll pr-0.5">
          <!-- Compact 1-Row Mobile Telemetry / Expanded Desktop Transfer Function Card -->
          <div class="glass-panel p-2 sm:p-5 space-y-1.5 sm:space-y-4">
            <div class="flex items-center justify-between gap-2">
              <div class="hidden xl:block">
                <div class="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-400">Laplace &amp; Pole Telemetry</div>
                <h2 class="font-display font-semibold text-sm text-white mt-0.5">Transfer Function &amp; Damping</h2>
              </div>

              <!-- Mobile Compact Inline Readout -->
              <div class="flex xl:hidden items-center gap-1.5 min-w-0 flex-1">
                <div class="flex-1 min-w-0 rounded-xl px-2 py-1 bg-cyanGlow/[0.08] border border-cyanGlow/25">
                  <div class="text-[8.5px] font-mono uppercase tracking-wider text-cyanGlow/90 truncate">Damping ζ</div>
                  <div id="mod-val-zeta-compact" class="font-mono font-semibold text-xs text-white leading-tight">0.20</div>
                </div>
                <div class="flex-1 min-w-0 rounded-xl px-2 py-1 bg-violetGlow/[0.08] border border-violetGlow/25">
                  <div class="text-[8.5px] font-mono uppercase tracking-wider text-violetGlow/90 truncate">Freq ωₙ</div>
                  <div id="mod-val-wn-compact" class="font-mono font-semibold text-xs text-violet-200 leading-tight">3.00</div>
                </div>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <div
                  id="mod-badge-regime"
                  class="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-cyanGlow/15 border-cyanGlow/40 text-cyan-200"
                >
                  UNDERDAMPED
                </div>
                <button
                  id="mod-btn-toggle-mobile-formula"
                  type="button"
                  aria-expanded="false"
                  title="Toggle Transfer Function G(s) & poles"
                  class="xl:hidden px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/15 text-[10px] font-mono text-amber-200 cursor-pointer"
                >
                  G(s) ▾
                </button>
              </div>
            </div>

            <!-- Collapsible on Mobile (<xl), Always Open on Desktop (xl:block) -->
            <div id="mod-mobile-formula-drawer" class="hidden xl:block space-y-2.5 sm:space-y-3.5">
              <div class="katex-card flex flex-col items-center justify-center gap-1.5 min-h-[64px] sm:min-h-[78px]">
                <div id="mod-telemetry-tf-katex" class="text-amber-200 text-xs sm:text-sm overflow-x-auto"></div>
                <div id="mod-telemetry-poles-katex" class="text-cyan-200 text-xs overflow-x-auto"></div>
              </div>

              <div class="hidden xl:grid grid-cols-3 gap-2">
                <div class="rounded-2xl p-3 bg-cyanGlow/[0.06] border border-cyanGlow/25">
                  <div class="text-[10px] font-mono uppercase tracking-wider text-cyanGlow/90">Damping ζ</div>
                  <div id="mod-val-zeta" class="font-mono font-semibold text-base text-white mt-0.5">0.20</div>
                </div>
                <div class="rounded-2xl p-3 bg-violetGlow/[0.06] border border-violetGlow/25">
                  <div class="text-[10px] font-mono uppercase tracking-wider text-violetGlow/90">ωₙ (rad/s)</div>
                  <div id="mod-val-wn" class="font-mono font-semibold text-base text-violet-200 mt-0.5">3.00</div>
                </div>
                <div class="rounded-2xl p-3 bg-emeraldGlow/[0.06] border border-emeraldGlow/25">
                  <div class="text-[10px] font-mono uppercase tracking-wider text-emeraldGlow/90">Overshoot</div>
                  <div id="mod-val-os" class="font-mono font-semibold text-base text-emerald-200 mt-0.5">52.7%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Compact 3-Slider Physical Parameter Deck (m/L, c/R, k/(1/C)) -->
          <div class="glass-panel p-2.5 sm:p-5 space-y-2 sm:space-y-3.5 flex-1 flex flex-col justify-between">
            <div class="space-y-1.5 sm:space-y-3">
              <!-- Inertia m / Inductance L -->
              <div class="space-y-0.5 sm:space-y-1">
                <div class="flex items-center justify-between">
                  <label for="slider-mod-m" id="label-mod-m" class="text-[11px] sm:text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>
                    <span>${escapeHtml(pLabels.m)}</span>
                  </label>
                  <span id="readout-mod-m" class="px-1.5 py-0.5 rounded-lg bg-cyanGlow/15 border border-cyanGlow/30 font-mono text-[10px] sm:text-xs text-cyanGlow font-semibold">
                    ${formatNum(appState.modelingLab.m, 1)}
                  </span>
                </div>
                <input
                  id="slider-mod-m"
                  type="range"
                  min="0.3"
                  max="3.0"
                  step="0.1"
                  value="${appState.modelingLab.m}"
                  class="studio-slider-cyan"
                />
              </div>

              <!-- Damping c / Resistance R -->
              <div class="space-y-0.5 sm:space-y-1">
                <div class="flex items-center justify-between">
                  <label for="slider-mod-c" id="label-mod-c" class="text-[11px] sm:text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B]"></span>
                    <span>${escapeHtml(pLabels.c)}</span>
                  </label>
                  <span id="readout-mod-c" class="px-1.5 py-0.5 rounded-lg bg-amberGlow/15 border border-amberGlow/30 font-mono text-[10px] sm:text-xs text-amberGlow font-semibold">
                    ${formatNum(appState.modelingLab.c, 1)}
                  </span>
                </div>
                <input
                  id="slider-mod-c"
                  type="range"
                  min="0.0"
                  max="12.0"
                  step="0.2"
                  value="${appState.modelingLab.c}"
                  class="studio-slider-amber"
                />
              </div>

              <!-- Stiffness k / Elastance 1/C -->
              <div class="space-y-0.5 sm:space-y-1">
                <div class="flex items-center justify-between">
                  <label for="slider-mod-k" id="label-mod-k" class="text-[11px] sm:text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emeraldGlow shadow-[0_0_8px_#34D399]"></span>
                    <span>${escapeHtml(pLabels.k)}</span>
                  </label>
                  <span id="readout-mod-k" class="px-1.5 py-0.5 rounded-lg bg-emeraldGlow/15 border border-emeraldGlow/30 font-mono text-[10px] sm:text-xs text-emerald-200 font-semibold">
                    ${formatNum(appState.modelingLab.k, 1)}
                  </span>
                </div>
                <input
                  id="slider-mod-k"
                  type="range"
                  min="1.0"
                  max="16.0"
                  step="0.5"
                  value="${appState.modelingLab.k}"
                  class="studio-slider-cyan"
                />
              </div>

              <!-- Action Row: Run Step + Close Loop (+Kp) Toggle + s-Plane Toggle -->
              <div class="flex items-center gap-1.5 pt-0.5">
                <button
                  id="btn-animate-mod"
                  type="button"
                  class="flex-1 py-2 sm:py-3 px-2.5 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amberGlow via-cyanGlow to-emeraldGlow text-slate-950 font-display font-bold text-[11px] sm:text-sm tracking-wide shadow-[0_0_22px_rgba(34,211,238,0.25)] hover:brightness-110 active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span id="mod-anim-icon" aria-hidden="true">▶</span>
                  <span id="mod-anim-text">Run Step</span>
                </button>

                <button
                  id="btn-toggle-mod-cl"
                  type="button"
                  aria-pressed="${clActive ? 'true' : 'false'}"
                  class="shrink-0 py-2 sm:py-3 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-mono font-semibold border transition-all cursor-pointer ${
                    clActive
                      ? 'bg-emeraldGlow/20 border-emeraldGlow/55 text-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.25)]'
                      : 'bg-slate-900/70 border-white/15 text-slate-300 hover:border-white/30'
                  }"
                >
                  ${clActive ? 'CL +Kp ON' : 'Loop: OL'}
                </button>

                <label class="xl:hidden shrink-0 inline-flex items-center gap-1 px-2 py-2 rounded-xl bg-cyanGlow/10 border border-cyanGlow/30 text-[10px] font-mono text-cyan-200 cursor-pointer select-none">
                  <input
                    id="toggle-mod-splane-mobile"
                    type="checkbox"
                    ${appState.modelingLab.showSPlane ? 'checked' : ''}
                    class="w-3.5 h-3.5 rounded accent-cyan-400 cursor-pointer"
                  />
                  <span>s-Pl</span>
                </label>
              </div>
            </div>

            <!-- Desktop s-Plane Toggle + Stage 2 Forward Link -->
            <div class="hidden xl:block pt-3 border-t border-white/10 space-y-2.5">
              <label class="flex items-center justify-between gap-3 cursor-pointer select-none group">
                <div class="flex items-center gap-2.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>
                  <div>
                    <div class="text-xs font-medium text-slate-200 group-hover:text-white">
                      Show 3D Complex s-Plane Pole Plate
                    </div>
                    <div class="text-[11px] text-slate-400">Watch poles collide at critical damping &amp; split on real axis</div>
                  </div>
                </div>
                <input
                  id="toggle-mod-splane"
                  type="checkbox"
                  ${appState.modelingLab.showSPlane ? 'checked' : ''}
                  class="w-4 h-4 rounded accent-cyan-400 cursor-pointer"
                />
              </label>

              <button
                id="btn-mod-next-intuition"
                type="button"
                class="btn-glass w-full !justify-between !text-xs"
              >
                <span>Continue to Stage 2: s-Plane Locus &amp; Analogy Lab</span>
                <span class="text-amberGlow" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;

  const sliderM = document.getElementById('slider-mod-m');
  const sliderC = document.getElementById('slider-mod-c');
  const sliderK = document.getElementById('slider-mod-k');
  syncSliderTrackFill(sliderM);
  syncSliderTrackFill(sliderC);
  syncSliderTrackFill(sliderK);

  const canvasHost = document.getElementById('modeling-3d-canvas');

  const handleModelingTelemetry = (m = {}) => {
    appState.modelingTelemetry = {
      ...appState.modelingTelemetry,
      ...m,
    };
    updateModelingStage1TelemetryUI();
  };

  if (canvasHost && typeof Modeling3DStudio === 'function') {
    try {
      const studio = new Modeling3DStudio();
      studio.init(canvasHost, {
        presetId: activePreset?.id || 'msd-underdamped',
        m: appState.modelingLab.m,
        c: appState.modelingLab.c,
        k: appState.modelingLab.k,
        kp: appState.modelingLab.kp,
        showSPlane: appState.modelingLab.showSPlane,
        mechatronicsLens: isMechatronicsLens(),
        onTelemetry: handleModelingTelemetry,
      });
      studio.setCameraPreset?.(appState.modelingLab.cameraPreset);
      activeInstances.studio3D = studio;
      if (typeof studio.getTelemetry === 'function') {
        handleModelingTelemetry(studio.getTelemetry());
      }
    } catch (err) {
      console.error('[EIGENLAB] Modeling3DStudio init error:', err);
      canvasHost.innerHTML = `
        <div class="w-full h-full flex items-center justify-center p-6 text-center text-sm text-slate-400">
          3D Physical Modeling viewport could not initialize on this device.
        </div>
      `;
    }
  }

  updateModelingStage1LensUI();
  updateModelingStage1TelemetryUI();

  const mobBtn = document.getElementById('mod-btn-toggle-mobile-formula');
  const mobDrawer = document.getElementById('mod-mobile-formula-drawer');
  mobBtn?.addEventListener('click', () => {
    playSfx('tick');
    const isHidden = mobDrawer?.classList.toggle('hidden');
    mobBtn.setAttribute('aria-expanded', String(!isHidden));
    mobBtn.textContent = isHidden ? 'G(s) ▾' : 'G(s) ▴';
  });

  const syncClBtn = () => {
    const btn = document.getElementById('btn-toggle-mod-cl');
    if (!btn) return;
    const on = appState.modelingLab.kp > 0.01;
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'CL +Kp ON' : 'Loop: OL';
    btn.className = `shrink-0 py-2 sm:py-3 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-mono font-semibold border transition-all cursor-pointer ${
      on
        ? 'bg-emeraldGlow/20 border-emeraldGlow/55 text-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.25)]'
        : 'bg-slate-900/70 border-white/15 text-slate-300 hover:border-white/30'
    }`;
  };

  container.querySelectorAll('[data-mod-preset-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-mod-preset-id');
      if (!id || id === appState.modelingLab.presetId) return;
      playSfx('tick');
      appState.modelingLab.presetId = id;
      const preset = getActiveModelingPreset(presets);
      if (preset) {
        const d = preset.defaults;
        appState.modelingLab.m = d.m;
        appState.modelingLab.c = d.c;
        appState.modelingLab.k = d.k;
        appState.modelingLab.kp = d.kp;

        if (sliderM) {
          sliderM.value = String(d.m);
          syncSliderTrackFill(sliderM);
        }
        if (sliderC) {
          sliderC.value = String(d.c);
          syncSliderTrackFill(sliderC);
        }
        if (sliderK) {
          sliderK.value = String(d.k);
          syncSliderTrackFill(sliderK);
        }
        const lm = document.getElementById('label-mod-m');
        const lc = document.getElementById('label-mod-c');
        const lk = document.getElementById('label-mod-k');
        if (lm) lm.innerHTML = `<span class="w-2 h-2 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span><span>${escapeHtml(preset.paramLabels.m)}</span>`;
        if (lc) lc.innerHTML = `<span class="w-2 h-2 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B]"></span><span>${escapeHtml(preset.paramLabels.c)}</span>`;
        if (lk) lk.innerHTML = `<span class="w-2 h-2 rounded-full bg-emeraldGlow shadow-[0_0_8px_#34D399]"></span><span>${escapeHtml(preset.paramLabels.k)}</span>`;

        const rm = document.getElementById('readout-mod-m');
        const rc = document.getElementById('readout-mod-c');
        const rk = document.getElementById('readout-mod-k');
        if (rm) rm.textContent = formatNum(d.m, 1);
        if (rc) rc.textContent = formatNum(d.c, 1);
        if (rk) rk.textContent = formatNum(d.k, 1);
        syncClBtn();
      }

      container.querySelectorAll('[data-mod-preset-id]').forEach((b) => {
        const sel = b.getAttribute('data-mod-preset-id') === id;
        b.className = `shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
          sel
            ? 'bg-amberGlow/15 border-amberGlow/50 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
            : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
        }`;
      });

      activeInstances.studio3D?.setPreset?.(id);
      if (typeof activeInstances.studio3D?.getTelemetry === 'function') {
        handleModelingTelemetry(activeInstances.studio3D.getTelemetry());
      }
      markStageDone('3d-lab');
    });
  });

  container.querySelectorAll('[data-mod-camera-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const camId = btn.getAttribute('data-mod-camera-preset');
      if (!camId) return;
      playSfx('tick');
      appState.modelingLab.cameraPreset = camId;
      container.querySelectorAll('[data-mod-camera-preset]').forEach((b) => {
        const act = b.getAttribute('data-mod-camera-preset') === camId;
        const isCompact = b.textContent.trim().length <= 3;
        b.className = `${isCompact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'} rounded-lg font-mono transition-all cursor-pointer ${
          act
            ? 'bg-white/15 text-white border border-white/20 shadow-sm'
            : 'text-slate-400 border border-transparent hover:text-white'
        }`;
      });
      activeInstances.studio3D?.setCameraPreset?.(camId);
    });
  });

  const applyParams = () => {
    activeInstances.studio3D?.setParams?.({
      m: appState.modelingLab.m,
      c: appState.modelingLab.c,
      k: appState.modelingLab.k,
      kp: appState.modelingLab.kp,
    });
    markStageDone('3d-lab');
  };

  sliderM?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.modelingLab.m = val;
    syncSliderTrackFill(sliderM);
    const r = document.getElementById('readout-mod-m');
    if (r) r.textContent = formatNum(val, 1);
    applyParams();
  });

  sliderC?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.modelingLab.c = val;
    syncSliderTrackFill(sliderC);
    const r = document.getElementById('readout-mod-c');
    if (r) r.textContent = formatNum(val, 1);
    applyParams();
  });

  sliderK?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.modelingLab.k = val;
    syncSliderTrackFill(sliderK);
    const r = document.getElementById('readout-mod-k');
    if (r) r.textContent = formatNum(val, 1);
    applyParams();
  });

  document.getElementById('btn-toggle-mod-cl')?.addEventListener('click', () => {
    playSfx('snap');
    appState.modelingLab.kp = appState.modelingLab.kp > 0.01 ? 0.0 : 6.0;
    syncClBtn();
    applyParams();
  });

  const spToggle = document.getElementById('toggle-mod-splane');
  const spToggleMob = document.getElementById('toggle-mod-splane-mobile');
  const handleSPlaneToggle = (checked) => {
    playSfx('tick');
    appState.modelingLab.showSPlane = !!checked;
    if (spToggle) spToggle.checked = appState.modelingLab.showSPlane;
    if (spToggleMob) spToggleMob.checked = appState.modelingLab.showSPlane;
    activeInstances.studio3D?.toggleSPlane?.(appState.modelingLab.showSPlane);
  };
  spToggle?.addEventListener('change', (e) => handleSPlaneToggle(e.target.checked));
  spToggleMob?.addEventListener('change', (e) => handleSPlaneToggle(e.target.checked));

  document.getElementById('btn-animate-mod')?.addEventListener('click', () => {
    if (appState.modelingLab.isAnimating) return;
    playSfx('snap');
    appState.modelingLab.isAnimating = true;
    const icon = document.getElementById('mod-anim-icon');
    const txt = document.getElementById('mod-anim-text');
    if (icon) icon.textContent = '◌';
    if (txt) txt.textContent = 'Running...';

    const finishAnim = () => {
      appState.modelingLab.isAnimating = false;
      if (icon) icon.textContent = '▶';
      if (txt) txt.textContent = 'Run Step';
      playSfx('success');
      markStageDone('3d-lab');
    };

    if (typeof activeInstances.studio3D?.animateResponse === 'function') {
      activeInstances.studio3D.animateResponse(finishAnim);
    } else {
      finishAnim();
    }
  });

  document.getElementById('btn-mod-next-intuition')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('intuition');
  });
}

function updateModelingStage1LensUI() {
  const on = isMechatronicsLens();
  const titleEl = document.getElementById('mod-hud-title');
  if (titleEl) {
    titleEl.textContent = on
      ? 'Physical Hardware ODE → s-Plane Rig'
      : 'Governing Differential Equation';
  }
  const mechBox = document.getElementById('mod-hud-mech-indicator');
  const mechTxt = document.getElementById('mod-hud-mech-text');
  if (mechBox) {
    mechBox.className = `hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
      on
        ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
        : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
    }`;
    const dot = mechBox.querySelector('span.rounded-full');
    if (dot) dot.className = `w-2 h-2 rounded-full ${on ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}`;
  }
  if (mechTxt) {
    mechTxt.textContent = on ? '2% Corridor & Root Locus: ON' : 'Physical Rig: Standard';
  }
}

function updateModelingStage1TelemetryUI() {
  const t = appState.modelingTelemetry;
  const zStr = formatNum(t.zeta ?? 0.2, 2);
  const wnStr = formatNum(t.wn ?? 3.0, 2);
  const osStr = Number.isFinite(t.overshootPct) ? `${formatNum(t.overshootPct, 1)}%` : '0.0%';

  const zEl = document.getElementById('mod-val-zeta');
  const zMobEl = document.getElementById('mod-val-zeta-compact');
  if (zEl) zEl.textContent = zStr;
  if (zMobEl) zMobEl.textContent = zStr;

  const wnEl = document.getElementById('mod-val-wn');
  const wnMobEl = document.getElementById('mod-val-wn-compact');
  if (wnEl) wnEl.textContent = wnStr;
  if (wnMobEl) wnMobEl.textContent = wnStr;

  const osEl = document.getElementById('mod-val-os');
  if (osEl) osEl.textContent = osStr;

  const badge = document.getElementById('mod-badge-regime');
  if (badge) {
    const reg = t.regime || 'UNDERDAMPED';
    badge.textContent = reg;
    if (reg === 'CRITICAL') {
      badge.className =
        'px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-emeraldGlow/15 border-emeraldGlow/45 text-emerald-200';
    } else if (reg === 'OVERDAMPED') {
      badge.className =
        'px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-violetGlow/15 border-violetGlow/45 text-violet-200';
    } else if (reg === 'UNDAMPED') {
      badge.className =
        'px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-amberGlow/15 border-amberGlow/45 text-amber-200';
    } else {
      badge.className =
        'px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-cyanGlow/15 border-cyanGlow/40 text-cyan-200';
    }
  }

  const odeEl = document.getElementById('mod-hud-ode-math');
  if (odeEl && t.odeLatex) typesetMath(odeEl, t.odeLatex, false);

  const tfEl = document.getElementById('mod-telemetry-tf-katex');
  if (tfEl && t.tfLatex) typesetMath(tfEl, t.tfLatex, false);

  const polesEl = document.getElementById('mod-telemetry-poles-katex');
  if (polesEl && t.polesLatex) typesetMath(polesEl, t.polesLatex, false);
}

function mountModelingStage2Intuition(container) {
  const on = isMechatronicsLens();
  const s = getStoreState();
  const solvedModQuizzes = (s.solvedQuizzes || []).filter((id) =>
    String(id).startsWith('mod-quiz-')
  ).length;
  let activeSubTab = 'lab';

  container.innerHTML = `
    <section class="space-y-3 lg:space-y-6 view-enter">
      <!-- Mobile Segmented Sub-Tab Switcher (<lg) -->
      <div class="lg:hidden grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#0E121C]/90 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <button
          type="button"
          data-stage2-subtab="lab"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-amberGlow/20 border border-amberGlow/45 text-amber-100 shadow-sm"
        >
          📐 s-Plane Locus
        </button>
        <button
          type="button"
          data-stage2-subtab="quiz"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white"
        >
          🎯 Match Quiz (${solvedModQuizzes}/6)
        </button>
      </div>

      <!-- Interactive s-Plane Damping Locus & Mechanical ↔ Electrical Analogy Lab -->
      <div id="stage2-panel-lab" class="glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-amberGlow">Physical Parameters ↔ Complex Poles</div>
            <h2 id="stage2-lab-title" class="font-display font-bold text-xl text-white mt-0.5">
              ${on ? 'Series RLC Analogy (L↔m, R↔c, 1/C↔k) & s-Plane Locus' : 'Physical Damping Sweep: s-Plane Pole Locus & Step Response'}
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Drag the pole along the constant-ωₙ semicircle to watch underdamped pairs collide at critical damping (−ωₙ) and split into overdamped real poles.
            </p>
          </div>
          <span class="px-3 py-1 rounded-full text-[11px] font-mono bg-white/[0.04] border border-white/10 text-slate-300">
            Drag pole or scrub ζ
          </span>
        </div>

        <div id="modeling-splane-lab-host" class="w-full min-h-[300px] sm:min-h-[380px]"></div>
      </div>

      <!-- Visual Modeling & s-Plane Quiz Engine -->
      <div id="stage2-panel-quiz" class="hidden lg:block glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-cyanGlow">First-Principles Pattern Mastery</div>
            <h2 class="font-display font-bold text-xl text-white mt-0.5">Modeling &amp; s-Plane Visual Challenges</h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Diagnose critical damping, constant-ωₙ damping sweeps, dominant overdamped poles, RLC analogies, and closed-loop stiffness shifts.
            </p>
          </div>
          <button
            id="btn-next-solver"
            type="button"
            class="btn-glass !text-xs"
          >
            Next: Deep Multi-Part Solver →
          </button>
        </div>

        <div id="modeling-quiz-engine-host" class="w-full min-h-[280px] sm:min-h-[320px]"></div>
      </div>
    </section>
  `;

  const panelLab = document.getElementById('stage2-panel-lab');
  const panelQuiz = document.getElementById('stage2-panel-quiz');
  const setSubTab = (tab) => {
    activeSubTab = tab;
    if (panelLab && panelQuiz) {
      panelLab.classList.toggle('hidden', tab !== 'lab');
      panelLab.classList.add('lg:block');
      panelQuiz.classList.toggle('hidden', tab !== 'quiz');
      panelQuiz.classList.add('lg:block');
    }
    container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
      const isAct = btn.getAttribute('data-stage2-subtab') === tab;
      btn.className = isAct
        ? 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-amberGlow/20 border border-amberGlow/45 text-amber-100 shadow-sm'
        : 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white';
    });
    requestAnimationFrame(() => {
      if (tab === 'lab') {
        activeInstances.stackedLab?._resizeAll?.();
        activeInstances.stackedLab?._drawAll?.();
      } else {
        activeInstances.quizEngine?._resizeCanvases?.();
        activeInstances.quizEngine?._drawCanvases?.();
      }
      window.dispatchEvent(new Event('resize'));
    });
  };

  container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-stage2-subtab');
      if (next && next !== activeSubTab) {
        playSfx('tick');
        setSubTab(next);
      }
    });
  });

  const labHost = document.getElementById('modeling-splane-lab-host');
  if (labHost && typeof ModelingSPlaneLab === 'function') {
    try {
      activeInstances.stackedLab = new ModelingSPlaneLab(labHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onInteract: () => markStageDone('intuition'),
        onOpenQuiz: () => {
          playSfx('tick');
          setSubTab('quiz');
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] ModelingSPlaneLab mount error:', err);
    }
  }

  const quizHost = document.getElementById('modeling-quiz-engine-host');
  if (quizHost && typeof ModelingVisualQuizEngine === 'function') {
    try {
      const updateTabCount = (payload) => {
        const count =
          payload?.solvedCount ??
          (getStoreState().solvedQuizzes || []).filter((id) =>
            String(id).startsWith('mod-quiz-')
          ).length;
        const quizBtn = container.querySelector('[data-stage2-subtab="quiz"]');
        if (quizBtn) quizBtn.textContent = `🎯 Match Quiz (${count}/6)`;
      };
      activeInstances.quizEngine = new ModelingVisualQuizEngine(quizHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onAnswer: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
        onProgress: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
        onComplete: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] ModelingVisualQuizEngine mount error:', err);
    }
  }

  document.getElementById('btn-next-solver')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('solver');
  });
}

function mountModelingStage3Solver(container) {
  container.innerHTML = `
    <section class="max-w-4xl mx-auto space-y-3 sm:space-y-5 view-enter">
      <div class="hidden md:flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-amberGlow">End-to-End Physical Modeling Drills</div>
          <h2 class="font-display font-bold text-2xl text-white mt-0.5">ODE → Laplace → s-Plane → Closed-Loop Solver</h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
            10 deep 5-to-6-part engineering pipelines (Mass-Spring-Damper, Series/Parallel RLC, DC Motor, Thermal, PD Placement) with Why &amp; System Impact insights at every step.
          </p>
        </div>

        <button
          id="btn-next-word-problems"
          type="button"
          class="btn-glass !text-xs"
        >
          Next: Word Problems →
        </button>
      </div>

      <div id="paperless-solver-host" class="glass-panel p-2.5 sm:p-5 md:p-6 min-h-[420px]"></div>
    </section>
  `;

  const host = document.getElementById('paperless-solver-host');
  if (host && typeof PaperlessStepSolver === 'function') {
    try {
      activeInstances.stepSolver = new PaperlessStepSolver(host, {
        mode: 'modeling',
        problems: MODELING_PROBLEMS,
        tiers: MODELING_SOLVER_TIERS,
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onSolve: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProblemSolved: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProgress: (info) => {
          if (!info || (info.solvedCount ?? 1) >= 1) {
            markStageDone('solver');
            updateLessonStageDotsUI();
          }
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] Modeling PaperlessStepSolver mount error:', err);
    }
  }

  document.getElementById('btn-next-word-problems')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('word-problems');
  });
}

// ---------------------------------------------------------------------------
// CONTROLS 03 — ROOT LOCUS, BODE & LEAD-LAG DESIGN (`mech-root-bode`) STAGES 1–3
// ---------------------------------------------------------------------------

function mountFreqStage1Lab3D(container) {
  const presets = normalizeFreqPresets();
  const activePreset = getActiveFreqPreset(presets);
  const lensOn = isMechatronicsLens();

  container.innerHTML = `
    <section class="space-y-2 sm:space-y-4 view-enter">
      <!-- Top Control Topology Preset Strip + Desktop Camera Presets -->
      <div class="flex items-center justify-between gap-2 sm:gap-3">
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar xl:flex-wrap flex-1 min-w-0 py-0.5" role="tablist" aria-label="Root locus and frequency presets">
          ${presets
            .map((p) => {
              const isSelected = activePreset && p.id === activePreset.id;
              return `
                <button
                  type="button"
                  data-freq-preset-id="${escapeHtml(p.id)}"
                  class="shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-violetGlow/20 border-violetGlow/55 text-violet-200 shadow-[0_0_16px_rgba(167,139,250,0.22)]'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }"
                >
                  ${escapeHtml(p.name)}
                </button>
              `;
            })
            .join('')}
        </div>

        <div class="hidden xl:flex items-center gap-1 bg-slate-900/75 p-1 rounded-xl border border-white/10 shrink-0">
          ${[
            { id: '3d', label: '3D Studio' },
            { id: 'front', label: 'Front 2D Graph' },
            { id: 'iso', label: 'Isometric' },
          ]
            .map((cam) => {
              const active = appState.freqLab.cameraPreset === cam.id;
              return `
                <button
                  type="button"
                  data-freq-camera-preset="${cam.id}"
                  class="px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    active
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 border border-transparent hover:text-white'
                  }"
                >
                  ${cam.label}
                </button>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- Main Split-Screen Mobile / Full-Bleed Desktop 3D |G(s)| & Root Locus Studio -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-2.5 sm:gap-4 items-stretch">
        <!-- 3D Viewport Canvas Container -->
        <div class="xl:col-span-8 canvas-stage relative h-[35dvh] min-h-[210px] max-h-[290px] sm:h-[420px] sm:max-h-none xl:h-[calc(100vh-210px)] xl:min-h-[540px] flex flex-col">
          <div id="freq-3d-canvas" class="absolute inset-0 w-full h-full"></div>

          <!-- Top-Left Floating Open-Loop L(s) HUD -->
          <div class="pointer-events-none relative z-10 flex items-start justify-between gap-2 p-2.5 sm:p-4">
            <div class="pointer-events-auto rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-3 bg-[#0B0D12]/80 backdrop-blur-xl border border-white/15 shadow-lg max-w-full">
              <div class="hidden sm:flex items-center gap-2 mb-1">
                <span class="w-2 h-2 rounded-full bg-violetGlow shadow-[0_0_8px_#A78BFA]"></span>
                <span id="freq-hud-title" class="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  ${lensOn ? '3D Loop-Shaping |L(s)| & Robustness Wall' : '3D Laplace Surface |KG(s)| & jω Bode Slice'}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-x-2.5 text-[10px] sm:text-xs text-white">
                <span id="freq-hud-ol-math" class="text-cyan-200"></span>
              </div>
            </div>

            <!-- Loop-Shaping Caliper Indicator -->
            <div id="freq-hud-mech-indicator" class="hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
              lensOn
                ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
                : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
            }">
              <div class="flex items-center gap-2 text-[11px] font-mono">
                <span class="w-2 h-2 rounded-full ${lensOn ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}"></span>
                <span id="freq-hud-mech-text">${lensOn ? 'PM / GM / Mr Calipers: LIVE' : 'Stability Calipers: Standby'}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Legend + Mobile Camera Switcher -->
          <div class="pointer-events-none relative z-10 mt-auto p-2 sm:p-4 flex items-center justify-between gap-2">
            <div class="hidden sm:inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300">
              <span><span class="text-cyanGlow">▲</span> |KG(s)| Surface</span>
              <span><span class="text-amberGlow">━</span> jω Bode Slice</span>
              <span><span class="text-emeraldGlow">●</span> Root Locus</span>
            </div>

            <div class="pointer-events-auto xl:hidden ml-auto flex items-center gap-0.5 bg-[#0B0D12]/80 backdrop-blur-md p-0.5 rounded-xl border border-white/15">
              ${[
                { id: '3d', label: '3D' },
                { id: 'front', label: '2D' },
                { id: 'iso', label: 'Iso' },
              ]
                .map((cam) => {
                  const active = appState.freqLab.cameraPreset === cam.id;
                  return `
                    <button
                      type="button"
                      data-freq-camera-preset="${cam.id}"
                      class="px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                        active
                          ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                          : 'text-slate-400 border border-transparent hover:text-white'
                      }"
                    >
                      ${cam.label}
                    </button>
                  `;
                })
                .join('')}
            </div>

            <div class="hidden xl:inline-flex items-center px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-400">
              Drag to orbit • Scroll to zoom
            </div>
          </div>
        </div>

        <!-- Tactile Bode Margin Telemetry + Loop Gain K & Parameter Sliders -->
        <aside class="xl:col-span-4 flex flex-col gap-2 sm:gap-4 xl:h-[calc(100vh-210px)] xl:overflow-y-auto studio-scroll pr-0.5">
          <!-- Compact 1-Row Mobile Telemetry / Expanded Desktop Margin Card -->
          <div class="glass-panel p-2.5 sm:p-5 space-y-2 sm:space-y-4">
            <div class="flex items-center justify-between gap-2">
              <div class="hidden xl:block">
                <div class="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-400">Frequency &amp; Locus Telemetry</div>
                <h2 class="font-display font-semibold text-sm text-white mt-0.5">Phase Margin, Gain Margin &amp; Poles</h2>
              </div>

              <!-- Mobile Compact Inline Readout -->
              <div class="flex xl:hidden items-center gap-1.5 min-w-0 flex-1">
                <div class="flex-1 min-w-0 rounded-xl px-2.5 py-1 bg-cyanGlow/[0.08] border border-cyanGlow/25">
                  <div class="text-[9px] font-mono uppercase tracking-wider text-cyanGlow/90 truncate">Phase Margin</div>
                  <div id="freq-val-pm-compact" class="font-mono font-semibold text-sm text-white leading-tight">—</div>
                </div>
                <div class="flex-1 min-w-0 rounded-xl px-2.5 py-1 bg-violetGlow/[0.08] border border-violetGlow/25">
                  <div class="text-[9px] font-mono uppercase tracking-wider text-violetGlow/90 truncate">Gain Margin</div>
                  <div id="freq-val-gm-compact" class="font-mono font-semibold text-sm text-violet-200 leading-tight">—</div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <div
                  id="freq-badge-stability"
                  class="px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-emeraldGlow/15 border-emeraldGlow/40 text-emerald-200"
                >
                  STABLE
                </div>
                <button
                  id="freq-btn-toggle-mobile-formula"
                  type="button"
                  aria-expanded="false"
                  title="Toggle closed-loop pole locations"
                  class="xl:hidden px-2 py-1 rounded-lg bg-white/[0.05] border border-white/15 text-[11px] font-mono text-violet-200 cursor-pointer"
                >
                  s ▾
                </button>
              </div>
            </div>

            <!-- Collapsible on Mobile (<xl), Always Open on Desktop (xl:block) -->
            <div id="freq-mobile-formula-drawer" class="hidden xl:block space-y-2.5 sm:space-y-3.5">
              <div class="katex-card flex flex-col items-center justify-center gap-1.5 min-h-[60px] sm:min-h-[72px]">
                <div id="freq-telemetry-poles-katex" class="text-violet-200 text-xs sm:text-sm overflow-x-auto"></div>
              </div>

              <div class="hidden xl:grid grid-cols-3 gap-2">
                <div class="rounded-2xl p-3 bg-cyanGlow/[0.06] border border-cyanGlow/25">
                  <div class="text-[10px] font-mono uppercase tracking-wider text-cyanGlow/90">Phase Margin</div>
                  <div id="freq-val-pm" class="font-mono font-semibold text-base text-white mt-0.5">—</div>
                </div>
                <div class="rounded-2xl p-3 bg-violetGlow/[0.06] border border-violetGlow/25">
                  <div class="text-[10px] font-mono uppercase tracking-wider text-violetGlow/90">Gain Margin</div>
                  <div id="freq-val-gm" class="font-mono font-semibold text-base text-violet-200 mt-0.5">—</div>
                </div>
                <div class="rounded-2xl p-3 bg-amberGlow/[0.06] border border-amberGlow/25">
                  <div class="text-[10px] font-mono uppercase tracking-wider text-amberGlow/90">Peak Mr</div>
                  <div id="freq-val-mr" class="font-mono font-semibold text-base text-amber-200 mt-0.5">—</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tactile Loop Gain K & Topology Parameter Sliders -->
          <div class="glass-panel p-2.5 sm:p-5 space-y-2.5 sm:space-y-4 flex-1 flex flex-col justify-between">
            <div class="space-y-2 sm:space-y-4">
              <!-- Loop Gain K Slider (Cyan) -->
              <div class="space-y-1 sm:space-y-1.5">
                <div class="flex items-center justify-between">
                  <label for="slider-freq-k" class="text-xs font-medium text-slate-200 flex items-center gap-2">
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>
                    <span>Loop Gain K</span>
                  </label>
                  <span id="readout-freq-k" class="px-2 py-0.5 rounded-lg bg-cyanGlow/15 border border-cyanGlow/30 font-mono text-[11px] sm:text-xs text-cyanGlow font-semibold">
                    ${formatNum(appState.freqLab.k, 1)}
                  </span>
                </div>
                <input
                  id="slider-freq-k"
                  type="range"
                  min="0.2"
                  max="${activePreset?.kMax ?? 36}"
                  step="0.2"
                  value="${appState.freqLab.k}"
                  class="studio-slider-cyan"
                />
              </div>

              <!-- Topology Parameter Slider (Amber) -->
              <div class="space-y-1 sm:space-y-1.5">
                <div class="flex items-center justify-between">
                  <label for="slider-freq-param" id="label-freq-param" class="text-xs font-medium text-slate-200 flex items-center gap-2">
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B]"></span>
                    <span>${escapeHtml(activePreset?.paramLabel || '3rd Pole p₃')}</span>
                  </label>
                  <span id="readout-freq-param" class="px-2 py-0.5 rounded-lg bg-amberGlow/15 border border-amberGlow/30 font-mono text-[11px] sm:text-xs text-amberGlow font-semibold">
                    ${formatNum(appState.freqLab.param, 2)}
                  </span>
                </div>
                <input
                  id="slider-freq-param"
                  type="range"
                  min="${activePreset?.paramMin ?? 1.5}"
                  max="${activePreset?.paramMax ?? 5.0}"
                  step="${activePreset?.paramStep ?? 0.1}"
                  value="${appState.freqLab.param}"
                  class="studio-slider-amber"
                />
              </div>

              <!-- Action Row: Sweep Gain K + Mobile Locus Toggle -->
              <div class="flex items-center gap-2 pt-0.5">
                <button
                  id="btn-animate-freq"
                  type="button"
                  class="flex-1 py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-violetGlow via-cyanGlow to-amberGlow text-slate-950 font-display font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_24px_rgba(167,139,250,0.28)] hover:brightness-110 active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  <span id="freq-anim-icon" aria-hidden="true">▶</span>
                  <span id="freq-anim-text">Sweep Gain K</span>
                </button>

                <label class="xl:hidden shrink-0 inline-flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-emeraldGlow/10 border border-emeraldGlow/30 text-[11px] font-mono text-emerald-200 cursor-pointer select-none">
                  <input
                    id="toggle-freq-locus-mobile"
                    type="checkbox"
                    ${appState.freqLab.showLocus ? 'checked' : ''}
                    class="w-3.5 h-3.5 rounded accent-emerald-400 cursor-pointer"
                  />
                  <span>Locus</span>
                </label>
              </div>
            </div>

            <!-- Desktop Locus Toggle + Stage 2 Forward Link -->
            <div class="hidden xl:block pt-4 border-t border-white/10 space-y-3">
              <label class="flex items-center justify-between gap-3 cursor-pointer select-none group">
                <div class="flex items-center gap-2.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-emeraldGlow shadow-[0_0_8px_#34D399]"></span>
                  <div>
                    <div class="text-xs font-medium text-slate-200 group-hover:text-white">
                      Show 3D Root Locus Branches &amp; Pole Orbs
                    </div>
                    <div class="text-[11px] text-slate-400">Trace closed-loop poles on s-plane floor as gain K rises</div>
                  </div>
                </div>
                <input
                  id="toggle-freq-locus"
                  type="checkbox"
                  ${appState.freqLab.showLocus ? 'checked' : ''}
                  class="w-4 h-4 rounded accent-emerald-400 cursor-pointer"
                />
              </label>

              <button
                id="btn-freq-next-intuition"
                type="button"
                class="btn-glass w-full !justify-between !text-xs"
              >
                <span>Continue to Stage 2: Root Locus ↔ Bode Lab</span>
                <span class="text-violetGlow" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;

  const sliderK = document.getElementById('slider-freq-k');
  const sliderParam = document.getElementById('slider-freq-param');
  syncSliderTrackFill(sliderK);
  syncSliderTrackFill(sliderParam);

  const canvasHost = document.getElementById('freq-3d-canvas');

  const handleFreqTelemetry = (m = {}) => {
    appState.freqTelemetry = {
      ...appState.freqTelemetry,
      ...m,
    };
    if (typeof m.k === 'number') {
      appState.freqLab.k = m.k;
      if (sliderK) {
        sliderK.value = String(m.k);
        syncSliderTrackFill(sliderK);
      }
      const rK = document.getElementById('readout-freq-k');
      if (rK) rK.textContent = formatNum(m.k, 1);
    }
    updateFreqStage1TelemetryUI();
  };

  if (canvasHost && typeof Freq3DStudio === 'function') {
    try {
      const studio = new Freq3DStudio();
      studio.init(canvasHost, {
        presetId: activePreset?.id || 'rl-3pole',
        k: appState.freqLab.k,
        param: appState.freqLab.param,
        showLocus: appState.freqLab.showLocus,
        mechatronicsLens: isMechatronicsLens(),
        onTelemetry: handleFreqTelemetry,
      });
      studio.setCameraPreset?.(appState.freqLab.cameraPreset);
      activeInstances.studio3D = studio;
      if (typeof studio.getTelemetry === 'function') {
        handleFreqTelemetry(studio.getTelemetry());
      }
    } catch (err) {
      console.error('[EIGENLAB] Freq3DStudio init error:', err);
      canvasHost.innerHTML = `
        <div class="w-full h-full flex items-center justify-center p-6 text-center text-sm text-slate-400">
          3D WebGL |G(s)| &amp; Root Locus viewport could not initialize on this device.
        </div>
      `;
    }
  }

  updateFreqStage1LensUI();
  updateFreqStage1TelemetryUI();

  const mobBtn = document.getElementById('freq-btn-toggle-mobile-formula');
  const mobDrawer = document.getElementById('freq-mobile-formula-drawer');
  mobBtn?.addEventListener('click', () => {
    playSfx('tick');
    const isHidden = mobDrawer?.classList.toggle('hidden');
    mobBtn.setAttribute('aria-expanded', String(!isHidden));
    mobBtn.textContent = isHidden ? 's ▾' : 's ▴';
  });

  container.querySelectorAll('[data-freq-preset-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-freq-preset-id');
      if (!id || id === appState.freqLab.presetId) return;
      playSfx('tick');
      appState.freqLab.presetId = id;
      const preset = getActiveFreqPreset(presets);
      if (preset) {
        appState.freqLab.k = preset.defaultK;
        appState.freqLab.param = preset.defaultParam;
        if (sliderK) {
          sliderK.max = String(preset.kMax);
          sliderK.value = String(preset.defaultK);
          syncSliderTrackFill(sliderK);
        }
        if (sliderParam) {
          sliderParam.min = String(preset.paramMin);
          sliderParam.max = String(preset.paramMax);
          sliderParam.step = String(preset.paramStep);
          sliderParam.value = String(preset.defaultParam);
          syncSliderTrackFill(sliderParam);
        }
        const lbl = document.getElementById('label-freq-param');
        if (lbl) {
          lbl.innerHTML = `<span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B]"></span><span>${escapeHtml(preset.paramLabel)}</span>`;
        }
        const rK = document.getElementById('readout-freq-k');
        const rP = document.getElementById('readout-freq-param');
        if (rK) rK.textContent = formatNum(preset.defaultK, 1);
        if (rP) rP.textContent = formatNum(preset.defaultParam, 2);
      }

      container.querySelectorAll('[data-freq-preset-id]').forEach((b) => {
        const sel = b.getAttribute('data-freq-preset-id') === id;
        b.className = `shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
          sel
            ? 'bg-violetGlow/20 border-violetGlow/55 text-violet-200 shadow-[0_0_16px_rgba(167,139,250,0.22)]'
            : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
        }`;
      });

      activeInstances.studio3D?.setPreset?.(id);
      if (typeof activeInstances.studio3D?.getTelemetry === 'function') {
        handleFreqTelemetry(activeInstances.studio3D.getTelemetry());
      }
      markStageDone('3d-lab');
    });
  });

  container.querySelectorAll('[data-freq-camera-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const camId = btn.getAttribute('data-freq-camera-preset');
      if (!camId) return;
      playSfx('tick');
      appState.freqLab.cameraPreset = camId;
      container.querySelectorAll('[data-freq-camera-preset]').forEach((b) => {
        const act = b.getAttribute('data-freq-camera-preset') === camId;
        const isCompact = b.textContent.trim().length <= 3;
        b.className = `${isCompact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'} rounded-lg font-mono transition-all cursor-pointer ${
          act
            ? 'bg-white/15 text-white border border-white/20 shadow-sm'
            : 'text-slate-400 border border-transparent hover:text-white'
        }`;
      });
      activeInstances.studio3D?.setCameraPreset?.(camId);
    });
  });

  sliderK?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.freqLab.k = val;
    syncSliderTrackFill(sliderK);
    const r = document.getElementById('readout-freq-k');
    if (r) r.textContent = formatNum(val, 1);
    activeInstances.studio3D?.setGainK?.(val);
    markStageDone('3d-lab');
  });

  sliderParam?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.freqLab.param = val;
    syncSliderTrackFill(sliderParam);
    const r = document.getElementById('readout-freq-param');
    if (r) r.textContent = formatNum(val, 2);
    activeInstances.studio3D?.setParam?.(val);
    markStageDone('3d-lab');
  });

  const locToggle = document.getElementById('toggle-freq-locus');
  const locToggleMob = document.getElementById('toggle-freq-locus-mobile');
  const handleLocusToggle = (checked) => {
    playSfx('tick');
    appState.freqLab.showLocus = !!checked;
    if (locToggle) locToggle.checked = appState.freqLab.showLocus;
    if (locToggleMob) locToggleMob.checked = appState.freqLab.showLocus;
    activeInstances.studio3D?.toggleLocus?.(appState.freqLab.showLocus);
  };
  locToggle?.addEventListener('change', (e) => handleLocusToggle(e.target.checked));
  locToggleMob?.addEventListener('change', (e) => handleLocusToggle(e.target.checked));

  document.getElementById('btn-animate-freq')?.addEventListener('click', () => {
    if (appState.freqLab.isAnimating) return;
    playSfx('snap');
    appState.freqLab.isAnimating = true;
    const icon = document.getElementById('freq-anim-icon');
    const txt = document.getElementById('freq-anim-text');
    if (icon) icon.textContent = '◌';
    if (txt) txt.textContent = 'Sweeping K...';

    const finishAnim = () => {
      appState.freqLab.isAnimating = false;
      if (icon) icon.textContent = '▶';
      if (txt) txt.textContent = 'Sweep Gain K';
      playSfx('success');
      markStageDone('3d-lab');
    };

    if (typeof activeInstances.studio3D?.animateGainSweep === 'function') {
      activeInstances.studio3D.animateGainSweep(finishAnim);
    } else {
      finishAnim();
    }
  });

  document.getElementById('btn-freq-next-intuition')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('intuition');
  });
}

function updateFreqStage1LensUI() {
  const on = isMechatronicsLens();
  const titleEl = document.getElementById('freq-hud-title');
  if (titleEl) {
    titleEl.textContent = on
      ? '3D Loop-Shaping |L(s)| & Robustness Wall'
      : '3D Laplace Surface |KG(s)| & jω Bode Slice';
  }
  const mechBox = document.getElementById('freq-hud-mech-indicator');
  const mechTxt = document.getElementById('freq-hud-mech-text');
  if (mechBox) {
    mechBox.className = `hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
      on
        ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
        : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
    }`;
    const dot = mechBox.querySelector('span.rounded-full');
    if (dot) dot.className = `w-2 h-2 rounded-full ${on ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}`;
  }
  if (mechTxt) {
    mechTxt.textContent = on ? 'PM / GM / Mr Calipers: LIVE' : 'Stability Calipers: Standby';
  }
}

function updateFreqStage1TelemetryUI() {
  const t = appState.freqTelemetry;
  const pmStr = Number.isFinite(t.phaseMarginDeg) ? `${formatNum(t.phaseMarginDeg, 1)}°` : '∞';
  const gmStr = Number.isFinite(t.gainMarginDb) ? `${formatNum(t.gainMarginDb, 1)} dB` : '∞ dB';
  const mrStr = Number.isFinite(t.resonantPeakDb) ? `${formatNum(t.resonantPeakDb, 1)} dB` : '—';

  const pmEl = document.getElementById('freq-val-pm');
  const pmMobEl = document.getElementById('freq-val-pm-compact');
  if (pmEl) pmEl.textContent = pmStr;
  if (pmMobEl) pmMobEl.textContent = pmStr;

  const gmEl = document.getElementById('freq-val-gm');
  const gmMobEl = document.getElementById('freq-val-gm-compact');
  if (gmEl) gmEl.textContent = gmStr;
  if (gmMobEl) gmMobEl.textContent = gmStr;

  const mrEl = document.getElementById('freq-val-mr');
  if (mrEl) mrEl.textContent = mrStr;

  const badge = document.getElementById('freq-badge-stability');
  if (badge) {
    const st = t.stability || 'STABLE';
    badge.textContent = st;
    if (st === 'UNSTABLE') {
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-rose-500/20 border-rose-400/50 text-rose-200';
    } else if (st === 'MARGINAL') {
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-amberGlow/15 border-amberGlow/45 text-amber-200';
    } else {
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-emeraldGlow/15 border-emeraldGlow/40 text-emerald-200';
    }
  }

  const olEl = document.getElementById('freq-hud-ol-math');
  if (olEl && t.olLatex) typesetMath(olEl, t.olLatex, false);

  const polesEl = document.getElementById('freq-telemetry-poles-katex');
  if (polesEl && t.clPolesLatex) typesetMath(polesEl, t.clPolesLatex, false);
}

function mountFreqStage2Intuition(container) {
  const on = isMechatronicsLens();
  const s = getStoreState();
  const solvedFreqQuizzes = (s.solvedQuizzes || []).filter((id) =>
    String(id).startsWith('freq-quiz-')
  ).length;
  let activeSubTab = 'lab';

  container.innerHTML = `
    <section class="space-y-3 lg:space-y-6 view-enter">
      <!-- Mobile Segmented Sub-Tab Switcher (<lg) -->
      <div class="lg:hidden grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#0E121C]/90 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <button
          type="button"
          data-stage2-subtab="lab"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-violetGlow/20 border border-violetGlow/45 text-violet-100 shadow-sm"
        >
          📈 Locus &amp; Bode
        </button>
        <button
          type="button"
          data-stage2-subtab="quiz"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white"
        >
          🎯 Bode Quiz (${solvedFreqQuizzes}/6)
        </button>
      </div>

      <!-- Interactive Root Locus <-> Bode Margin Lab -->
      <div id="stage2-panel-lab" class="glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-violetGlow">Closed-Loop Poles ↔ Frequency Margins</div>
            <h2 id="stage2-lab-title" class="font-display font-bold text-xl text-white mt-0.5">
              ${on ? 'Closed-Loop Pole Migration & Servo Loop Robustness Margins' : 'Interactive Root Locus 1 + KG(s) = 0 ↔ Bode Gain/Phase Margins'}
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Sweep Loop Gain K to watch poles migrate along the Root Locus while the Bode magnitude shifts vertically and Phase/Gain Margins tighten.
            </p>
          </div>
          <span class="px-3 py-1 rounded-full text-[11px] font-mono bg-white/[0.04] border border-white/10 text-slate-300">
            Scrub Loop Gain K
          </span>
        </div>

        <div id="freq-root-bode-lab-host" class="w-full min-h-[300px] sm:min-h-[380px]"></div>
      </div>

      <!-- Visual Root Locus & Bode Quiz Engine -->
      <div id="stage2-panel-quiz" class="hidden lg:block glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-amberGlow">Frequency-Domain Mastery</div>
            <h2 class="font-display font-bold text-xl text-white mt-0.5">Root Locus &amp; Bode Visual Challenges</h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Master real-axis locus rules, stabilizing Lead zeros, Phase Margin angles, resonant peaks, and negative Gain Margin instability.
            </p>
          </div>
          <button
            id="btn-next-solver"
            type="button"
            class="btn-glass !text-xs"
          >
            Next: Lead-Lag &amp; Bode Solver →
          </button>
        </div>

        <div id="freq-quiz-engine-host" class="w-full min-h-[280px] sm:min-h-[320px]"></div>
      </div>
    </section>
  `;

  const panelLab = document.getElementById('stage2-panel-lab');
  const panelQuiz = document.getElementById('stage2-panel-quiz');
  const setSubTab = (tab) => {
    activeSubTab = tab;
    if (panelLab && panelQuiz) {
      panelLab.classList.toggle('hidden', tab !== 'lab');
      panelLab.classList.add('lg:block');
      panelQuiz.classList.toggle('hidden', tab !== 'quiz');
      panelQuiz.classList.add('lg:block');
    }
    container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
      const isAct = btn.getAttribute('data-stage2-subtab') === tab;
      btn.className = isAct
        ? 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-violetGlow/20 border border-violetGlow/45 text-violet-100 shadow-sm'
        : 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white';
    });
    requestAnimationFrame(() => {
      if (tab === 'lab') {
        activeInstances.stackedLab?._resizeAll?.();
        activeInstances.stackedLab?._drawAll?.();
      } else {
        activeInstances.quizEngine?._resizeCanvases?.();
        activeInstances.quizEngine?._drawCanvases?.();
      }
      window.dispatchEvent(new Event('resize'));
    });
  };

  container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-stage2-subtab');
      if (next && next !== activeSubTab) {
        playSfx('tick');
        setSubTab(next);
      }
    });
  });

  const labHost = document.getElementById('freq-root-bode-lab-host');
  if (labHost && typeof RootBodeLab === 'function') {
    try {
      activeInstances.stackedLab = new RootBodeLab(labHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onInteract: () => markStageDone('intuition'),
        onOpenQuiz: () => {
          playSfx('tick');
          setSubTab('quiz');
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] RootBodeLab mount error:', err);
    }
  }

  const quizHost = document.getElementById('freq-quiz-engine-host');
  if (quizHost && typeof FreqVisualQuizEngine === 'function') {
    try {
      const updateTabCount = (payload) => {
        const count =
          payload?.solvedCount ??
          (getStoreState().solvedQuizzes || []).filter((id) =>
            String(id).startsWith('freq-quiz-')
          ).length;
        const quizBtn = container.querySelector('[data-stage2-subtab="quiz"]');
        if (quizBtn) quizBtn.textContent = `🎯 Bode Quiz (${count}/6)`;
      };
      activeInstances.quizEngine = new FreqVisualQuizEngine(quizHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onAnswer: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
        onProgress: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
        onComplete: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] FreqVisualQuizEngine mount error:', err);
    }
  }

  document.getElementById('btn-next-solver')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('solver');
  });
}

function mountFreqStage3Solver(container) {
  container.innerHTML = `
    <section class="max-w-4xl mx-auto space-y-3 sm:space-y-5 view-enter">
      <div class="hidden md:flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-violetGlow">Compensator &amp; Robustness Design Drills</div>
          <h2 class="font-display font-bold text-2xl text-white mt-0.5">Root Locus, Bode &amp; Lead-Lag Step Solver</h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
            10 deep 5-to-6-part design drills covering Root Locus asymptotes/zeros, exact Bode GM/PM, Phase-Lead &amp; Phase-Lag synthesis, Sensitivity S+T=1, and Nyquist stability.
          </p>
        </div>

        <button
          id="btn-next-word-problems"
          type="button"
          class="btn-glass !text-xs"
        >
          Next: Word Problems →
        </button>
      </div>

      <div id="paperless-solver-host" class="glass-panel p-2.5 sm:p-5 md:p-6 min-h-[420px]"></div>
    </section>
  `;

  const host = document.getElementById('paperless-solver-host');
  if (host && typeof PaperlessStepSolver === 'function') {
    try {
      activeInstances.stepSolver = new PaperlessStepSolver(host, {
        mode: 'freq',
        problems: FREQ_PROBLEMS,
        tiers: FREQ_SOLVER_TIERS,
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onSolve: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProblemSolved: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProgress: (info) => {
          if (!info || (info.solvedCount ?? 1) >= 1) {
            markStageDone('solver');
            updateLessonStageDotsUI();
          }
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] Freq PaperlessStepSolver mount error:', err);
    }
  }

  document.getElementById('btn-next-word-problems')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('word-problems');
  });
}

// ---------------------------------------------------------------------------
// CONTROLS 04 — MODERN STATE-SPACE, MPC & SOTA ESTIMATION (`mech-state-space`) STAGES 1–3
// ---------------------------------------------------------------------------

function mountStateSpaceStage1Lab3D(container) {
  const presets = normalizeStateSpacePresets();
  const activePreset = getActiveStateSpacePreset(presets);
  const lensOn = isMechatronicsLens();
  const initMetrics = appState.statespaceTelemetry?.metrics || {};

  container.innerHTML = `
    <section class="space-y-2 sm:space-y-4 view-enter">
      <!-- Top Mode Preset Strip + Desktop Camera Presets -->
      <div class="flex items-center justify-between gap-2 sm:gap-3">
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar xl:flex-wrap flex-1 min-w-0 py-0.5" role="tablist" aria-label="State-space and estimation presets">
          ${presets
            .map((p) => {
              const isSelected = activePreset && p.id === activePreset.id;
              return `
                <button
                  type="button"
                  data-ss-preset-id="${escapeHtml(p.id)}"
                  class="shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emeraldGlow/20 border-emeraldGlow/55 text-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.22)]'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }"
                >
                  <span class="sm:hidden">${escapeHtml(p.shortName)}</span>
                  <span class="hidden sm:inline">${escapeHtml(p.name)}</span>
                </button>
              `;
            })
            .join('')}
        </div>

        <div class="hidden xl:flex items-center gap-1 bg-slate-900/75 p-1 rounded-xl border border-white/10 shrink-0">
          ${[
            { id: '3d', label: '3D Studio' },
            { id: 'front', label: 'Phase 2D' },
            { id: 'iso', label: 'Isometric' },
          ]
            .map((cam) => {
              const active = appState.statespaceLab.cameraPreset === cam.id;
              return `
                <button
                  type="button"
                  data-ss-camera-preset="${cam.id}"
                  class="px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    active
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 border border-transparent hover:text-white'
                  }"
                >
                  ${cam.label}
                </button>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- Main Split-Screen Mobile / Full-Bleed Desktop 3D State-Space & Estimation Studio -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-2.5 sm:gap-4 items-stretch">
        <!-- 3D Viewport Canvas Container -->
        <div class="xl:col-span-8 canvas-stage relative h-[35dvh] min-h-[210px] max-h-[290px] sm:h-[420px] sm:max-h-none xl:h-[calc(100vh-210px)] xl:min-h-[540px] flex flex-col">
          <div id="ss-3d-canvas" class="absolute inset-0 w-full h-full"></div>

          <!-- Top-Left Floating Formula HUD -->
          <div class="pointer-events-none relative z-10 flex items-start justify-between gap-2 p-2.5 sm:p-4">
            <div class="pointer-events-auto rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-3 bg-[#0B0D12]/80 backdrop-blur-xl border border-white/15 shadow-lg max-w-full">
              <div class="hidden sm:flex items-center gap-2 mb-1">
                <span class="w-2 h-2 rounded-full bg-emeraldGlow shadow-[0_0_8px_#34D399]"></span>
                <span id="ss-hud-title" class="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  ${lensOn ? 'Hardware Rig + State-Space Manifold' : '3D State-Space, MPC & Estimation Manifold'}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-x-2.5 text-[10px] sm:text-xs text-white">
                <span id="ss-hud-formula-math" class="text-cyan-200"></span>
              </div>
            </div>

            <!-- Mechatronics Actuator Rig Indicator -->
            <div id="ss-hud-mech-indicator" class="hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
              lensOn
                ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
                : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
            }">
              <div class="flex items-center gap-2 text-[11px] font-mono">
                <span class="w-2 h-2 rounded-full ${lensOn ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}"></span>
                <span id="ss-hud-mech-text">${lensOn ? 'Cart-Pole Actuator Rig: LIVE' : 'Hardware Rig Overlay: Standby'}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Legend + Mobile Camera Switcher -->
          <div class="pointer-events-none relative z-10 mt-auto p-2 sm:p-4 flex items-center justify-between gap-2">
            <div class="hidden sm:inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300">
              <span><span class="text-cyanGlow">━</span> Optimal / True x(t)</span>
              <span><span class="text-violetGlow">◯</span> Covariance / Sigma</span>
              <span><span class="text-emeraldGlow">◆</span> Safe / MAP Estimate</span>
            </div>

            <div class="pointer-events-auto xl:hidden ml-auto flex items-center gap-0.5 bg-[#0B0D12]/80 backdrop-blur-md p-0.5 rounded-xl border border-white/15">
              ${[
                { id: '3d', label: '3D' },
                { id: 'front', label: '2D' },
                { id: 'iso', label: 'Iso' },
              ]
                .map((cam) => {
                  const active = appState.statespaceLab.cameraPreset === cam.id;
                  return `
                    <button
                      type="button"
                      data-ss-camera-preset="${cam.id}"
                      class="px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                        active
                          ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                          : 'text-slate-400 border border-transparent hover:text-white'
                      }"
                    >
                      ${cam.label}
                    </button>
                  `;
                })
                .join('')}
            </div>

            <div class="hidden xl:inline-flex items-center px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-400">
              Drag to orbit • Scroll to zoom
            </div>
          </div>
        </div>

        <!-- Tactile State-Space Telemetry HUD + Dual Parameter Sliders -->
        <aside class="xl:col-span-4 flex flex-col gap-2 sm:gap-4 xl:h-[calc(100vh-210px)] xl:overflow-y-auto studio-scroll pr-0.5">
          <!-- Compact 1-Row Mobile Telemetry / Expanded Desktop Metrics Card -->
          <div class="glass-panel p-2.5 sm:p-5 space-y-2 sm:space-y-4">
            <div class="flex items-center justify-between gap-2">
              <div class="hidden xl:block">
                <div class="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-400">State-Space &amp; Filter Telemetry</div>
                <h2 id="ss-panel-mode-title" class="font-display font-semibold text-sm text-white mt-0.5">
                  ${escapeHtml(activePreset?.name || 'LQR Regulator')}
                </h2>
              </div>

              <!-- Mobile Compact Inline Readout -->
              <div class="flex xl:hidden items-center gap-1.5 min-w-0 flex-1">
                <div class="flex-1 min-w-0 rounded-xl px-2.5 py-1 bg-cyanGlow/[0.08] border border-cyanGlow/25">
                  <div id="ss-lbl-primary-compact" class="text-[9px] font-mono uppercase tracking-wider text-cyanGlow/90 truncate">
                    ${escapeHtml(initMetrics.primaryLabel || 'Primary')}
                  </div>
                  <div id="ss-val-primary-compact" class="font-mono font-semibold text-xs sm:text-sm text-white leading-tight truncate">
                    ${escapeHtml(initMetrics.primaryValue || '—')}
                  </div>
                </div>
                <div class="flex-1 min-w-0 rounded-xl px-2.5 py-1 bg-violetGlow/[0.08] border border-violetGlow/25">
                  <div id="ss-lbl-secondary-compact" class="text-[9px] font-mono uppercase tracking-wider text-violetGlow/90 truncate">
                    ${escapeHtml(initMetrics.secondaryLabel || 'Secondary')}
                  </div>
                  <div id="ss-val-secondary-compact" class="font-mono font-semibold text-xs sm:text-sm text-violet-200 leading-tight truncate">
                    ${escapeHtml(initMetrics.secondaryValue || '—')}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <div
                  id="ss-badge-status"
                  class="px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold border transition-all duration-300 bg-cyanGlow/15 border-cyanGlow/40 text-cyan-200 max-w-[130px] sm:max-w-none truncate"
                >
                  ${escapeHtml(initMetrics.statusText || 'OPTIMAL')}
                </div>
                <button
                  id="ss-btn-toggle-mobile-formula"
                  type="button"
                  aria-expanded="false"
                  title="Toggle equation & tertiary telemetry"
                  class="xl:hidden px-2 py-1 rounded-lg bg-white/[0.05] border border-white/15 text-[11px] font-mono text-emerald-200 cursor-pointer"
                >
                  J ▾
                </button>
              </div>
            </div>

            <!-- Collapsible on Mobile (<xl), Always Open on Desktop (xl:block) -->
            <div id="ss-mobile-formula-drawer" class="hidden xl:block space-y-2.5 sm:space-y-3.5">
              <div class="katex-card flex flex-col items-center justify-center gap-1.5 min-h-[58px] sm:min-h-[68px]">
                <div id="ss-telemetry-formula-katex" class="text-emerald-200 text-xs sm:text-sm overflow-x-auto max-w-full"></div>
              </div>

              <div class="grid grid-cols-3 gap-2">
                <div class="rounded-2xl p-2.5 sm:p-3 bg-cyanGlow/[0.06] border border-cyanGlow/25 min-w-0">
                  <div id="ss-lbl-primary" class="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-cyanGlow/90 truncate">
                    ${escapeHtml(initMetrics.primaryLabel || 'Primary')}
                  </div>
                  <div id="ss-val-primary" class="font-mono font-semibold text-xs sm:text-sm text-white mt-0.5 truncate">
                    ${escapeHtml(initMetrics.primaryValue || '—')}
                  </div>
                </div>
                <div class="rounded-2xl p-2.5 sm:p-3 bg-violetGlow/[0.06] border border-violetGlow/25 min-w-0">
                  <div id="ss-lbl-secondary" class="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-violetGlow/90 truncate">
                    ${escapeHtml(initMetrics.secondaryLabel || 'Secondary')}
                  </div>
                  <div id="ss-val-secondary" class="font-mono font-semibold text-xs sm:text-sm text-violet-200 mt-0.5 truncate">
                    ${escapeHtml(initMetrics.secondaryValue || '—')}
                  </div>
                </div>
                <div class="rounded-2xl p-2.5 sm:p-3 bg-amberGlow/[0.06] border border-amberGlow/25 min-w-0">
                  <div id="ss-lbl-tertiary" class="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-amberGlow/90 truncate">
                    ${escapeHtml(initMetrics.tertiaryLabel || 'Tertiary')}
                  </div>
                  <div id="ss-val-tertiary" class="font-mono font-semibold text-xs sm:text-sm text-amber-200 mt-0.5 truncate">
                    ${escapeHtml(initMetrics.tertiaryValue || '—')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Dual Tactile Parameter Sliders -->
          <div class="glass-panel p-2.5 sm:p-5 space-y-2.5 sm:space-y-4 flex-1 flex flex-col justify-between">
            <div class="space-y-2 sm:space-y-4">
              <!-- Parameter A Slider (Cyan) -->
              <div class="space-y-1 sm:space-y-1.5">
                <div class="flex items-center justify-between gap-2">
                  <label for="slider-ss-param-a" id="label-ss-param-a" class="text-xs font-medium text-slate-200 flex items-center gap-2 min-w-0">
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE] shrink-0"></span>
                    <span class="truncate">${escapeHtml(activePreset?.paramALabel || 'Parameter A')}</span>
                  </label>
                  <span id="readout-ss-param-a" class="px-2 py-0.5 rounded-lg bg-cyanGlow/15 border border-cyanGlow/30 font-mono text-[11px] sm:text-xs text-cyanGlow font-semibold shrink-0">
                    ${formatStateSpaceParam(appState.statespaceLab.paramA, activePreset?.paramA?.step)}
                  </span>
                </div>
                <input
                  id="slider-ss-param-a"
                  type="range"
                  min="${activePreset?.paramA?.min ?? 0.2}"
                  max="${activePreset?.paramA?.max ?? 25}"
                  step="${activePreset?.paramA?.step ?? 0.2}"
                  value="${appState.statespaceLab.paramA}"
                  class="studio-slider-cyan"
                />
              </div>

              <!-- Parameter B Slider (Amber) -->
              <div class="space-y-1 sm:space-y-1.5">
                <div class="flex items-center justify-between gap-2">
                  <label for="slider-ss-param-b" id="label-ss-param-b" class="text-xs font-medium text-slate-200 flex items-center gap-2 min-w-0">
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B] shrink-0"></span>
                    <span class="truncate">${escapeHtml(activePreset?.paramBLabel || 'Parameter B')}</span>
                  </label>
                  <span id="readout-ss-param-b" class="px-2 py-0.5 rounded-lg bg-amberGlow/15 border border-amberGlow/30 font-mono text-[11px] sm:text-xs text-amberGlow font-semibold shrink-0">
                    ${formatStateSpaceParam(appState.statespaceLab.paramB, activePreset?.paramB?.step)}
                  </span>
                </div>
                <input
                  id="slider-ss-param-b"
                  type="range"
                  min="${activePreset?.paramB?.min ?? 0.6}"
                  max="${activePreset?.paramB?.max ?? 2.6}"
                  step="${activePreset?.paramB?.step ?? 0.1}"
                  value="${appState.statespaceLab.paramB}"
                  class="studio-slider-amber"
                />
              </div>

              <!-- Action Row: Reset Preset + Quick Stage 2 Mobile Jump -->
              <div class="flex items-center gap-2 pt-0.5">
                <button
                  id="btn-ss-reset"
                  type="button"
                  class="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl bg-white/[0.05] border border-white/15 text-slate-200 hover:border-emeraldGlow/45 hover:text-white font-display font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span aria-hidden="true">↺</span>
                  <span>Reset Defaults</span>
                </button>
                <button
                  id="btn-ss-next-intuition-mobile"
                  type="button"
                  class="xl:hidden flex-1 py-2 px-3 rounded-xl bg-emeraldGlow/15 border border-emeraldGlow/40 text-emerald-200 font-display font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Phase/KF Lab</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>

            <!-- Desktop Stage 2 Forward Link -->
            <div class="hidden xl:block pt-4 border-t border-white/10 space-y-3">
              <div class="text-[11px] text-slate-400 leading-relaxed">
                Toggle <span class="text-amberGlow font-medium">Mechatronics Lens</span> in the header to overlay the live cart-pole actuator rig &amp; force gauges directly on the 3D manifold.
              </div>

              <button
                id="btn-ss-next-intuition"
                type="button"
                class="btn-glass w-full !justify-between !text-xs"
              >
                <span>Continue to Stage 2: Phase Plane &amp; KF Lab</span>
                <span class="text-emeraldGlow" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;

  const sliderA = document.getElementById('slider-ss-param-a');
  const sliderB = document.getElementById('slider-ss-param-b');
  syncSliderTrackFill(sliderA);
  syncSliderTrackFill(sliderB);

  const syncSlidersForPreset = (preset, valA, valB) => {
    if (!preset) return;
    if (sliderA) {
      sliderA.min = String(preset.paramA.min);
      sliderA.max = String(preset.paramA.max);
      sliderA.step = String(preset.paramA.step);
      sliderA.value = String(valA);
      syncSliderTrackFill(sliderA);
    }
    if (sliderB) {
      sliderB.min = String(preset.paramB.min);
      sliderB.max = String(preset.paramB.max);
      sliderB.step = String(preset.paramB.step);
      sliderB.value = String(valB);
      syncSliderTrackFill(sliderB);
    }
    const lblA = document.getElementById('label-ss-param-a');
    if (lblA) {
      lblA.innerHTML = `<span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE] shrink-0"></span><span class="truncate">${escapeHtml(preset.paramALabel)}</span>`;
    }
    const lblB = document.getElementById('label-ss-param-b');
    if (lblB) {
      lblB.innerHTML = `<span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B] shrink-0"></span><span class="truncate">${escapeHtml(preset.paramBLabel)}</span>`;
    }
    const rA = document.getElementById('readout-ss-param-a');
    const rB = document.getElementById('readout-ss-param-b');
    if (rA) rA.textContent = formatStateSpaceParam(valA, preset.paramA.step);
    if (rB) rB.textContent = formatStateSpaceParam(valB, preset.paramB.step);

    const modeTitle = document.getElementById('ss-panel-mode-title');
    if (modeTitle) modeTitle.textContent = preset.name;
  };

  const canvasHost = document.getElementById('ss-3d-canvas');

  const handleStateSpaceTelemetry = (m = {}) => {
    appState.statespaceTelemetry = {
      ...appState.statespaceTelemetry,
      ...m,
    };
    const preset = STATESPACE_PRESETS[m.presetId || appState.statespaceLab.presetId];
    if (typeof m.paramA === 'number') {
      appState.statespaceLab.paramA = m.paramA;
      if (sliderA) {
        sliderA.value = String(m.paramA);
        syncSliderTrackFill(sliderA);
      }
      const rA = document.getElementById('readout-ss-param-a');
      if (rA) rA.textContent = formatStateSpaceParam(m.paramA, preset?.paramA?.step);
    }
    if (typeof m.paramB === 'number') {
      appState.statespaceLab.paramB = m.paramB;
      if (sliderB) {
        sliderB.value = String(m.paramB);
        syncSliderTrackFill(sliderB);
      }
      const rB = document.getElementById('readout-ss-param-b');
      if (rB) rB.textContent = formatStateSpaceParam(m.paramB, preset?.paramB?.step);
    }
    updateStateSpaceStage1TelemetryUI();
  };

  if (canvasHost && typeof StateSpace3DStudio === 'function') {
    try {
      const studio = new StateSpace3DStudio({
        presetId: activePreset?.id || 'lqr-cart',
        paramA: appState.statespaceLab.paramA,
        paramB: appState.statespaceLab.paramB,
        mechatronicsLens: isMechatronicsLens(),
        onTelemetry: handleStateSpaceTelemetry,
      });
      studio.init(canvasHost, {
        presetId: activePreset?.id || 'lqr-cart',
        paramA: appState.statespaceLab.paramA,
        paramB: appState.statespaceLab.paramB,
        mechatronicsLens: isMechatronicsLens(),
        onTelemetry: handleStateSpaceTelemetry,
      });
      studio.setCameraPreset?.(appState.statespaceLab.cameraPreset);
      activeInstances.studio3D = studio;
      if (typeof studio.getTelemetry === 'function') {
        handleStateSpaceTelemetry(studio.getTelemetry());
      }
    } catch (err) {
      console.error('[EIGENLAB] StateSpace3DStudio init error:', err);
      canvasHost.innerHTML = `
        <div class="w-full h-full flex items-center justify-center p-6 text-center text-sm text-slate-400">
          3D WebGL State-Space &amp; Estimation viewport could not initialize on this device.
        </div>
      `;
    }
  }

  updateStateSpaceStage1LensUI();
  updateStateSpaceStage1TelemetryUI();

  const mobBtn = document.getElementById('ss-btn-toggle-mobile-formula');
  const mobDrawer = document.getElementById('ss-mobile-formula-drawer');
  mobBtn?.addEventListener('click', () => {
    playSfx('tick');
    const isHidden = mobDrawer?.classList.toggle('hidden');
    mobBtn.setAttribute('aria-expanded', String(!isHidden));
    mobBtn.textContent = isHidden ? 'J ▾' : 'J ▴';
  });

  container.querySelectorAll('[data-ss-preset-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-ss-preset-id');
      if (!id || id === appState.statespaceLab.presetId) return;
      playSfx('tick');
      appState.statespaceLab.presetId = id;
      const preset = getActiveStateSpacePreset(presets);
      if (preset) {
        appState.statespaceLab.paramA = preset.paramA.default;
        appState.statespaceLab.paramB = preset.paramB.default;
        syncSlidersForPreset(preset, preset.paramA.default, preset.paramB.default);
      }

      container.querySelectorAll('[data-ss-preset-id]').forEach((b) => {
        const sel = b.getAttribute('data-ss-preset-id') === id;
        b.className = `shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
          sel
            ? 'bg-emeraldGlow/20 border-emeraldGlow/55 text-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.22)]'
            : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
        }`;
      });

      activeInstances.studio3D?.setPreset?.(id);
      if (typeof activeInstances.studio3D?.getTelemetry === 'function') {
        handleStateSpaceTelemetry(activeInstances.studio3D.getTelemetry());
      } else {
        handleStateSpaceTelemetry(
          analyzeStateSpaceSystem({
            presetId: id,
            paramA: appState.statespaceLab.paramA,
            paramB: appState.statespaceLab.paramB,
          })
        );
      }
      markStageDone('3d-lab');
    });
  });

  container.querySelectorAll('[data-ss-camera-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const camId = btn.getAttribute('data-ss-camera-preset');
      if (!camId) return;
      playSfx('tick');
      appState.statespaceLab.cameraPreset = camId;
      container.querySelectorAll('[data-ss-camera-preset]').forEach((b) => {
        const act = b.getAttribute('data-ss-camera-preset') === camId;
        const isCompact = b.textContent.trim().length <= 3;
        b.className = `${isCompact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'} rounded-lg font-mono transition-all cursor-pointer ${
          act
            ? 'bg-white/15 text-white border border-white/20 shadow-sm'
            : 'text-slate-400 border border-transparent hover:text-white'
        }`;
      });
      activeInstances.studio3D?.setCameraPreset?.(camId);
    });
  });

  sliderA?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const preset = getActiveStateSpacePreset(presets);
    appState.statespaceLab.paramA = val;
    syncSliderTrackFill(sliderA);
    const r = document.getElementById('readout-ss-param-a');
    if (r) r.textContent = formatStateSpaceParam(val, preset?.paramA?.step);
    activeInstances.studio3D?.setParams?.({
      paramA: val,
      paramB: appState.statespaceLab.paramB,
    });
    markStageDone('3d-lab');
  });

  sliderB?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const preset = getActiveStateSpacePreset(presets);
    appState.statespaceLab.paramB = val;
    syncSliderTrackFill(sliderB);
    const r = document.getElementById('readout-ss-param-b');
    if (r) r.textContent = formatStateSpaceParam(val, preset?.paramB?.step);
    activeInstances.studio3D?.setParams?.({
      paramA: appState.statespaceLab.paramA,
      paramB: val,
    });
    markStageDone('3d-lab');
  });

  document.getElementById('btn-ss-reset')?.addEventListener('click', () => {
    playSfx('snap');
    const preset = getActiveStateSpacePreset(presets);
    if (preset) {
      appState.statespaceLab.paramA = preset.paramA.default;
      appState.statespaceLab.paramB = preset.paramB.default;
      appState.statespaceLab.cameraPreset = '3d';
      syncSlidersForPreset(preset, preset.paramA.default, preset.paramB.default);
    }
    container.querySelectorAll('[data-ss-camera-preset]').forEach((b) => {
      const act = b.getAttribute('data-ss-camera-preset') === '3d';
      const isCompact = b.textContent.trim().length <= 3;
      b.className = `${isCompact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'} rounded-lg font-mono transition-all cursor-pointer ${
        act
          ? 'bg-white/15 text-white border border-white/20 shadow-sm'
          : 'text-slate-400 border border-transparent hover:text-white'
      }`;
    });
    if (typeof activeInstances.studio3D?.reset === 'function') {
      const t = activeInstances.studio3D.reset();
      if (t) handleStateSpaceTelemetry(t);
    }
  });

  const goStage2 = () => {
    playSfx('tick');
    switchStage('intuition');
  };
  document.getElementById('btn-ss-next-intuition')?.addEventListener('click', goStage2);
  document.getElementById('btn-ss-next-intuition-mobile')?.addEventListener('click', goStage2);
}

function updateStateSpaceStage1LensUI() {
  const on = isMechatronicsLens();
  const titleEl = document.getElementById('ss-hud-title');
  if (titleEl) {
    titleEl.textContent = on
      ? 'Hardware Rig + State-Space Manifold'
      : '3D State-Space, MPC & Estimation Manifold';
  }
  const mechBox = document.getElementById('ss-hud-mech-indicator');
  const mechTxt = document.getElementById('ss-hud-mech-text');
  if (mechBox) {
    mechBox.className = `hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
      on
        ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
        : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
    }`;
    const dot = mechBox.querySelector('span.rounded-full');
    if (dot) dot.className = `w-2 h-2 rounded-full ${on ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}`;
  }
  if (mechTxt) {
    mechTxt.textContent = on ? 'Cart-Pole Actuator Rig: LIVE' : 'Hardware Rig Overlay: Standby';
  }
}

function updateStateSpaceStage1TelemetryUI() {
  const t = appState.statespaceTelemetry || {};
  const m = t.metrics || {};

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('ss-lbl-primary', m.primaryLabel || 'Primary');
  setText('ss-lbl-primary-compact', m.primaryLabel || 'Primary');
  setText('ss-val-primary', m.primaryValue || '—');
  setText('ss-val-primary-compact', m.primaryValue || '—');

  setText('ss-lbl-secondary', m.secondaryLabel || 'Secondary');
  setText('ss-lbl-secondary-compact', m.secondaryLabel || 'Secondary');
  setText('ss-val-secondary', m.secondaryValue || '—');
  setText('ss-val-secondary-compact', m.secondaryValue || '—');

  setText('ss-lbl-tertiary', m.tertiaryLabel || 'Tertiary');
  setText('ss-val-tertiary', m.tertiaryValue || '—');

  const badge = document.getElementById('ss-badge-status');
  if (badge) {
    const statusText = m.statusText || 'OPTIMAL';
    badge.textContent = statusText;
    const c = String(m.statusColor || '').toUpperCase();
    if (c === '#FB7185') {
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold border transition-all duration-300 bg-rose-500/20 border-rose-400/50 text-rose-200 max-w-[130px] sm:max-w-none truncate';
    } else if (c === '#F59E0B') {
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold border transition-all duration-300 bg-amberGlow/15 border-amberGlow/45 text-amber-200 max-w-[130px] sm:max-w-none truncate';
    } else if (c === '#A78BFA') {
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold border transition-all duration-300 bg-violetGlow/15 border-violetGlow/45 text-violet-200 max-w-[130px] sm:max-w-none truncate';
    } else if (c === '#34D399') {
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold border transition-all duration-300 bg-emeraldGlow/15 border-emeraldGlow/40 text-emerald-200 max-w-[130px] sm:max-w-none truncate';
    } else {
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold border transition-all duration-300 bg-cyanGlow/15 border-cyanGlow/40 text-cyan-200 max-w-[130px] sm:max-w-none truncate';
    }
  }

  const formulaTex =
    t.formulaLatex || STATESPACE_PRESETS[appState.statespaceLab.presetId]?.formulaLatex || '';
  if (formulaTex) {
    const hudFormulaEl = document.getElementById('ss-hud-formula-math');
    if (hudFormulaEl) typesetMath(hudFormulaEl, formulaTex, false);
    const panelFormulaEl = document.getElementById('ss-telemetry-formula-katex');
    if (panelFormulaEl) typesetMath(panelFormulaEl, formulaTex, false);
  }
}

function mountStateSpaceStage2Intuition(container) {
  const on = isMechatronicsLens();
  const s = getStoreState();
  const solvedSsQuizzes = (s.solvedQuizzes || []).filter((id) =>
    String(id).startsWith('ss-quiz-')
  ).length;
  let activeSubTab = 'lab';

  container.innerHTML = `
    <section class="space-y-3 lg:space-y-6 view-enter">
      <!-- Mobile Segmented Sub-Tab Switcher (<lg) -->
      <div class="lg:hidden grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#0E121C]/90 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <button
          type="button"
          data-stage2-subtab="lab"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-emeraldGlow/20 border border-emeraldGlow/45 text-emerald-100 shadow-sm"
        >
          📈 Phase/KF Lab
        </button>
        <button
          type="button"
          data-stage2-subtab="quiz"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white"
        >
          🎯 Visual Quiz (${solvedSsQuizzes}/6)
        </button>
      </div>

      <!-- Interactive 2D Phase Portrait, MPC & Kalman Filter Lab -->
      <div id="stage2-panel-lab" class="glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-emeraldGlow">Modern State-Space ↔ SOTA Estimation</div>
            <h2 id="stage2-lab-title" class="font-display font-bold text-xl text-white mt-0.5">
              ${
                on
                  ? 'Actuator Phase Portrait, Torque Limits & Real-Time Sensor Fusion'
                  : 'Synchronized Phase Portrait, State Tracking & Effort / Kalman Gain'
              }
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Scrub time across synchronized phase-plane, state-trajectory, and control/gain panels for LQR, MPC + CBF-QP, Kalman Fusion, UKF vs. EKF, and MHE Factor Graphs.
            </p>
          </div>
          <span class="px-3 py-1 rounded-full text-[11px] font-mono bg-white/[0.04] border border-white/10 text-slate-300">
            Drag time cursor t
          </span>
        </div>

        <div id="ss-graph-lab-host" class="w-full min-h-[300px] sm:min-h-[380px]"></div>
      </div>

      <!-- Visual State-Space & Estimation Quiz Engine -->
      <div id="stage2-panel-quiz" class="hidden lg:block glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-cyanGlow">Modern Control &amp; Estimation Mastery</div>
            <h2 class="font-display font-bold text-xl text-white mt-0.5">State-Space, MPC &amp; SOTA Visual Challenges</h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Build deep geometric intuition across PBH controllability, LQR Q/R trade-offs, MPC constraint preview, CBF-QP invariance, Kalman gain trust, and UKF/MHE robustness.
            </p>
          </div>
          <button
            id="btn-next-solver"
            type="button"
            class="btn-glass !text-xs"
          >
            Next: State-Space &amp; MPC Solver →
          </button>
        </div>

        <div id="ss-quiz-engine-host" class="w-full min-h-[280px] sm:min-h-[320px]"></div>
      </div>
    </section>
  `;

  const panelLab = document.getElementById('stage2-panel-lab');
  const panelQuiz = document.getElementById('stage2-panel-quiz');
  const setSubTab = (tab) => {
    activeSubTab = tab;
    if (panelLab && panelQuiz) {
      panelLab.classList.toggle('hidden', tab !== 'lab');
      panelLab.classList.add('lg:block');
      panelQuiz.classList.toggle('hidden', tab !== 'quiz');
      panelQuiz.classList.add('lg:block');
    }
    container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
      const isAct = btn.getAttribute('data-stage2-subtab') === tab;
      btn.className = isAct
        ? 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-emeraldGlow/20 border border-emeraldGlow/45 text-emerald-100 shadow-sm'
        : 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white';
    });
    requestAnimationFrame(() => {
      if (tab === 'lab') {
        activeInstances.stackedLab?._resizeAll?.();
        activeInstances.stackedLab?._drawAll?.();
      } else {
        activeInstances.quizEngine?._resizeCanvas?.();
        activeInstances.quizEngine?._resizeCanvases?.();
        activeInstances.quizEngine?._drawCanvas?.();
        activeInstances.quizEngine?._drawCanvases?.();
      }
      window.dispatchEvent(new Event('resize'));
    });
  };

  container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-stage2-subtab');
      if (next && next !== activeSubTab) {
        playSfx('tick');
        setSubTab(next);
      }
    });
  });

  const labHost = document.getElementById('ss-graph-lab-host');
  if (labHost && typeof StateSpaceGraphLab === 'function') {
    try {
      activeInstances.stackedLab = new StateSpaceGraphLab(labHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        initialPreset: appState.statespaceLab.presetId || 'lqr-cart',
        onInteract: () => markStageDone('intuition'),
        onOpenQuiz: () => {
          playSfx('tick');
          setSubTab('quiz');
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] StateSpaceGraphLab mount error:', err);
    }
  }

  const quizHost = document.getElementById('ss-quiz-engine-host');
  if (quizHost && typeof StateSpaceVisualQuizEngine === 'function') {
    try {
      const updateTabCount = (payload) => {
        const count =
          payload?.solvedCount ??
          (getStoreState().solvedQuizzes || []).filter((id) =>
            String(id).startsWith('ss-quiz-')
          ).length;
        const quizBtn = container.querySelector('[data-stage2-subtab="quiz"]');
        if (quizBtn) quizBtn.textContent = `🎯 Visual Quiz (${count}/6)`;
      };
      activeInstances.quizEngine = new StateSpaceVisualQuizEngine(quizHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onAnswer: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
        onProgress: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
        onComplete: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] StateSpaceVisualQuizEngine mount error:', err);
    }
  }

  document.getElementById('btn-next-solver')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('solver');
  });
}

function mountStateSpaceStage3Solver(container) {
  container.innerHTML = `
    <section class="max-w-4xl mx-auto space-y-3 sm:space-y-5 view-enter">
      <div class="hidden md:flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-emeraldGlow">Modern Control &amp; SOTA Estimation Drills</div>
          <h2 class="font-display font-bold text-2xl text-white mt-0.5">State-Space, LQR, MPC &amp; SOTA Step Solver</h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
            12 deep 5-to-7-part engineering drills covering (A,B,C,D) matrices, PBH controllability, LQR Riccati, condensed MPC QP, CBF-QP safety barriers, Kalman/UKF filtering, Factor Graphs, MHE, and InEKF on Lie groups.
          </p>
        </div>

        <button
          id="btn-next-word-problems"
          type="button"
          class="btn-glass !text-xs"
        >
          Next: Word Problems →
        </button>
      </div>

      <div id="paperless-solver-host" class="glass-panel p-2.5 sm:p-5 md:p-6 min-h-[420px]"></div>
    </section>
  `;

  const host = document.getElementById('paperless-solver-host');
  if (host && typeof PaperlessStepSolver === 'function') {
    try {
      activeInstances.stepSolver = new PaperlessStepSolver(host, {
        mode: 'statespace',
        curriculum: 'statespace',
        problems: STATESPACE_PROBLEMS,
        tiers: STATESPACE_SOLVER_TIERS,
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onSolve: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProblemSolved: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProgress: (info) => {
          if (!info || (info.solvedCount ?? 1) >= 1) {
            markStageDone('solver');
            updateLessonStageDotsUI();
          }
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] StateSpace PaperlessStepSolver mount error:', err);
    }
  }

  document.getElementById('btn-next-word-problems')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('word-problems');
  });
}

// ---------------------------------------------------------------------------
// ROBOTICS 01 — FORWARD & INVERSE ROBOT KINEMATICS (`mech-kinematics`) STAGES 1–3
// ---------------------------------------------------------------------------

function mountKinematicsStage1Lab3D(container) {
  const presets = normalizeKinematicsPresets();
  const activePreset = getActiveKinematicsPreset(presets);
  const lensOn = isMechatronicsLens();
  const initMetrics = appState.kinematicsTelemetry?.metrics || {};

  container.innerHTML = `
    <section class="space-y-2 sm:space-y-4 view-enter">
      <!-- Top Robot Preset Strip + Desktop Camera Presets -->
      <div class="flex items-center justify-between gap-2 sm:gap-3">
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar xl:flex-wrap flex-1 min-w-0 py-0.5" role="tablist" aria-label="Robot kinematics presets">
          ${presets
            .map((p) => {
              const isSelected = activePreset && p.id === activePreset.id;
              return `
                <button
                  type="button"
                  data-kin-preset-id="${escapeHtml(p.id)}"
                  class="shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyanGlow/20 border-cyanGlow/55 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.22)]'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }"
                >
                  <span class="sm:hidden">${escapeHtml(p.shortName)}</span>
                  <span class="hidden sm:inline">${escapeHtml(p.name)}</span>
                </button>
              `;
            })
            .join('')}
        </div>

        <div class="hidden xl:flex items-center gap-1 bg-slate-900/75 p-1 rounded-xl border border-white/10 shrink-0">
          ${[
            { id: '3d', label: '3D Studio' },
            { id: 'front', label: 'Front 2D' },
            { id: 'iso', label: 'Isometric' },
          ]
            .map((cam) => {
              const active = appState.kinematicsLab.cameraPreset === cam.id;
              return `
                <button
                  type="button"
                  data-kin-camera-preset="${cam.id}"
                  class="px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    active
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 border border-transparent hover:text-white'
                  }"
                >
                  ${cam.label}
                </button>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- Main Split-Screen Mobile / Full-Bleed Desktop 3D Robot Kinematics Studio -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-2.5 sm:gap-4 items-stretch">
        <!-- 3D Viewport Canvas Container -->
        <div class="xl:col-span-8 canvas-stage relative h-[35dvh] min-h-[210px] max-h-[290px] sm:h-[420px] sm:max-h-none xl:h-[calc(100vh-210px)] xl:min-h-[540px] flex flex-col">
          <div id="kin-3d-canvas" class="absolute inset-0 w-full h-full"></div>

          <!-- Top-Left Floating Formula HUD -->
          <div class="pointer-events-none relative z-10 flex items-start justify-between gap-2 p-2.5 sm:p-4">
            <div class="pointer-events-auto rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-3 bg-[#0B0D12]/80 backdrop-blur-xl border border-white/15 shadow-lg max-w-full">
              <div class="hidden sm:flex items-center gap-2 mb-1">
                <span class="w-2 h-2 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>
                <span id="kin-hud-title" class="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  ${lensOn ? 'Servo Torque Rig + 3D Kinematics Workcell' : '3D Robot Kinematics, Jacobian & IK Studio'}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-x-2.5 text-[10px] sm:text-xs text-white">
                <span id="kin-hud-formula-math" class="text-cyan-200"></span>
              </div>
            </div>

            <!-- Mechatronics Servo Torque & Actuator Indicator -->
            <div id="kin-hud-mech-indicator" class="hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
              lensOn
                ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
                : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
            }">
              <div class="flex items-center gap-2 text-[11px] font-mono">
                <span class="w-2 h-2 rounded-full ${lensOn ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}"></span>
                <span id="kin-hud-mech-text">${lensOn ? 'Servo Torques τ = JᵀF: LIVE' : 'Servo Torque Overlay: Standby'}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Legend + Mobile Camera Switcher -->
          <div class="pointer-events-none relative z-10 mt-auto p-2 sm:p-4 flex items-center justify-between gap-2">
            <div class="hidden sm:inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300">
              <span><span class="text-cyanGlow">━</span> Active Arm / EE</span>
              <span><span class="text-violetGlow">◯</span> Manipulability / Screw</span>
              <span><span class="text-emeraldGlow">◆</span> Target / Safe Clearance</span>
            </div>

            <div class="pointer-events-auto xl:hidden ml-auto flex items-center gap-0.5 bg-[#0B0D12]/80 backdrop-blur-md p-0.5 rounded-xl border border-white/15">
              ${[
                { id: '3d', label: '3D' },
                { id: 'front', label: '2D' },
                { id: 'iso', label: 'Iso' },
              ]
                .map((cam) => {
                  const active = appState.kinematicsLab.cameraPreset === cam.id;
                  return `
                    <button
                      type="button"
                      data-kin-camera-preset="${cam.id}"
                      class="px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                        active
                          ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                          : 'text-slate-400 border border-transparent hover:text-white'
                      }"
                    >
                      ${cam.label}
                    </button>
                  `;
                })
                .join('')}
            </div>

            <div class="hidden xl:inline-flex items-center px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-400">
              Drag to orbit • Scroll to zoom
            </div>
          </div>
        </div>

        <!-- Tactile Kinematics Telemetry HUD + Dual Parameter Sliders -->
        <aside class="xl:col-span-4 flex flex-col gap-2 sm:gap-4 xl:h-[calc(100vh-210px)] xl:overflow-y-auto studio-scroll pr-0.5">
          <!-- Compact 1-Row Mobile Telemetry / Expanded Desktop Metrics Card -->
          <div class="glass-panel p-2.5 sm:p-5 space-y-2 sm:space-y-4">
            <div class="flex items-center justify-between gap-2">
              <div class="hidden xl:block">
                <div class="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-400">Kinematics &amp; Jacobian Telemetry</div>
                <h2 id="kin-panel-mode-title" class="font-display font-semibold text-sm text-white mt-0.5">
                  ${escapeHtml(activePreset?.name || '2R Planar (DH/MDH)')}
                </h2>
              </div>

              <!-- Mobile Compact Inline Readout -->
              <div class="flex xl:hidden items-center gap-1.5 min-w-0 flex-1">
                <div class="flex-1 min-w-0 rounded-xl px-2.5 py-1 bg-cyanGlow/[0.08] border border-cyanGlow/25">
                  <div id="kin-lbl-primary-compact" class="text-[9px] font-mono uppercase tracking-wider text-cyanGlow/90 truncate">
                    ${escapeHtml(initMetrics.primaryLabel || 'Primary')}
                  </div>
                  <div id="kin-val-primary-compact" class="font-mono font-semibold text-xs sm:text-sm text-white leading-tight truncate">
                    ${escapeHtml(initMetrics.primaryValue || '—')}
                  </div>
                </div>
                <div class="flex-1 min-w-0 rounded-xl px-2.5 py-1 bg-violetGlow/[0.08] border border-violetGlow/25">
                  <div id="kin-lbl-secondary-compact" class="text-[9px] font-mono uppercase tracking-wider text-violetGlow/90 truncate">
                    ${escapeHtml(initMetrics.secondaryLabel || 'Secondary')}
                  </div>
                  <div id="kin-val-secondary-compact" class="font-mono font-semibold text-xs sm:text-sm text-violet-200 leading-tight truncate">
                    ${escapeHtml(initMetrics.secondaryValue || '—')}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <div
                  id="kin-badge-status"
                  class="px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold border transition-all duration-300 bg-cyanGlow/15 border-cyanGlow/40 text-cyan-200 max-w-[130px] sm:max-w-none truncate"
                >
                  ${escapeHtml(initMetrics.statusText || 'WELL-CONDITIONED')}
                </div>
                <button
                  id="kin-btn-toggle-mobile-formula"
                  type="button"
                  aria-expanded="false"
                  title="Toggle equation & tertiary telemetry"
                  class="xl:hidden px-2 py-1 rounded-lg bg-white/[0.05] border border-white/15 text-[11px] font-mono text-cyan-200 cursor-pointer"
                >
                  T ▾
                </button>
              </div>
            </div>

            <!-- Collapsible on Mobile (<xl), Always Open on Desktop (xl:block) -->
            <div id="kin-mobile-formula-drawer" class="hidden xl:block space-y-2.5 sm:space-y-3.5">
              <div class="katex-card flex flex-col items-center justify-center gap-1.5 min-h-[58px] sm:min-h-[68px]">
                <div id="kin-telemetry-formula-katex" class="text-cyan-200 text-xs sm:text-sm overflow-x-auto max-w-full"></div>
              </div>

              <div class="grid grid-cols-3 gap-2">
                <div class="rounded-2xl p-2.5 sm:p-3 bg-cyanGlow/[0.06] border border-cyanGlow/25 min-w-0">
                  <div id="kin-lbl-primary" class="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-cyanGlow/90 truncate">
                    ${escapeHtml(initMetrics.primaryLabel || 'Primary')}
                  </div>
                  <div id="kin-val-primary" class="font-mono font-semibold text-xs sm:text-sm text-white mt-0.5 truncate">
                    ${escapeHtml(initMetrics.primaryValue || '—')}
                  </div>
                </div>
                <div class="rounded-2xl p-2.5 sm:p-3 bg-violetGlow/[0.06] border border-violetGlow/25 min-w-0">
                  <div id="kin-lbl-secondary" class="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-violetGlow/90 truncate">
                    ${escapeHtml(initMetrics.secondaryLabel || 'Secondary')}
                  </div>
                  <div id="kin-val-secondary" class="font-mono font-semibold text-xs sm:text-sm text-violet-200 mt-0.5 truncate">
                    ${escapeHtml(initMetrics.secondaryValue || '—')}
                  </div>
                </div>
                <div class="rounded-2xl p-2.5 sm:p-3 bg-amberGlow/[0.06] border border-amberGlow/25 min-w-0">
                  <div id="kin-lbl-tertiary" class="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-amberGlow/90 truncate">
                    ${escapeHtml(initMetrics.tertiaryLabel || 'Tertiary')}
                  </div>
                  <div id="kin-val-tertiary" class="font-mono font-semibold text-xs sm:text-sm text-amber-200 mt-0.5 truncate">
                    ${escapeHtml(initMetrics.tertiaryValue || '—')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Dual Tactile Parameter Sliders -->
          <div class="glass-panel p-2.5 sm:p-5 space-y-2.5 sm:space-y-4 flex-1 flex flex-col justify-between">
            <div class="space-y-2 sm:space-y-4">
              <!-- Parameter A Slider (Cyan) -->
              <div class="space-y-1 sm:space-y-1.5">
                <div class="flex items-center justify-between gap-2">
                  <label for="slider-kin-param-a" id="label-kin-param-a" class="text-xs font-medium text-slate-200 flex items-center gap-2 min-w-0">
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE] shrink-0"></span>
                    <span class="truncate">${escapeHtml(activePreset?.paramALabel || 'Parameter A')}</span>
                  </label>
                  <span id="readout-kin-param-a" class="px-2 py-0.5 rounded-lg bg-cyanGlow/15 border border-cyanGlow/30 font-mono text-[11px] sm:text-xs text-cyanGlow font-semibold shrink-0">
                    ${formatKinematicsParam(appState.kinematicsLab.paramA, activePreset?.paramA?.step)}
                  </span>
                </div>
                <input
                  id="slider-kin-param-a"
                  type="range"
                  min="${activePreset?.paramA?.min ?? -135}"
                  max="${activePreset?.paramA?.max ?? 135}"
                  step="${activePreset?.paramA?.step ?? 1}"
                  value="${appState.kinematicsLab.paramA}"
                  class="studio-slider-cyan"
                />
              </div>

              <!-- Parameter B Slider (Amber) -->
              <div class="space-y-1 sm:space-y-1.5">
                <div class="flex items-center justify-between gap-2">
                  <label for="slider-kin-param-b" id="label-kin-param-b" class="text-xs font-medium text-slate-200 flex items-center gap-2 min-w-0">
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B] shrink-0"></span>
                    <span class="truncate">${escapeHtml(activePreset?.paramBLabel || 'Parameter B')}</span>
                  </label>
                  <span id="readout-kin-param-b" class="px-2 py-0.5 rounded-lg bg-amberGlow/15 border border-amberGlow/30 font-mono text-[11px] sm:text-xs text-amberGlow font-semibold shrink-0">
                    ${formatKinematicsParam(appState.kinematicsLab.paramB, activePreset?.paramB?.step)}
                  </span>
                </div>
                <input
                  id="slider-kin-param-b"
                  type="range"
                  min="${activePreset?.paramB?.min ?? -165}"
                  max="${activePreset?.paramB?.max ?? 165}"
                  step="${activePreset?.paramB?.step ?? 1}"
                  value="${appState.kinematicsLab.paramB}"
                  class="studio-slider-amber"
                />
              </div>

              <!-- Action Row: Reset Preset + Quick Stage 2 Mobile Jump -->
              <div class="flex items-center gap-2 pt-0.5">
                <button
                  id="btn-kin-reset"
                  type="button"
                  class="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl bg-white/[0.05] border border-white/15 text-slate-200 hover:border-cyanGlow/45 hover:text-white font-display font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span aria-hidden="true">↺</span>
                  <span>Reset Defaults</span>
                </button>
                <button
                  id="btn-kin-next-intuition-mobile"
                  type="button"
                  class="xl:hidden flex-1 py-2 px-3 rounded-xl bg-cyanGlow/15 border border-cyanGlow/40 text-cyan-200 font-display font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>IK/Ellip Lab</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>

            <!-- Desktop Stage 2 Forward Link -->
            <div class="hidden xl:block pt-4 border-t border-white/10 space-y-3">
              <div class="text-[11px] text-slate-400 leading-relaxed">
                Toggle <span class="text-amberGlow font-medium">Mechatronics Lens</span> in the header to overlay live servo torque vectors τ = JᵀF &amp; joint-stop strain rings directly on the 3D manipulator.
              </div>

              <button
                id="btn-kin-next-intuition"
                type="button"
                class="btn-glass w-full !justify-between !text-xs"
              >
                <span>Continue to Stage 2: IK &amp; Manipulability Lab</span>
                <span class="text-cyanGlow" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;

  const sliderA = document.getElementById('slider-kin-param-a');
  const sliderB = document.getElementById('slider-kin-param-b');
  syncSliderTrackFill(sliderA);
  syncSliderTrackFill(sliderB);

  const syncSlidersForPreset = (preset, valA, valB) => {
    if (!preset) return;
    if (sliderA) {
      sliderA.min = String(preset.paramA.min);
      sliderA.max = String(preset.paramA.max);
      sliderA.step = String(preset.paramA.step);
      sliderA.value = String(valA);
      syncSliderTrackFill(sliderA);
    }
    if (sliderB) {
      sliderB.min = String(preset.paramB.min);
      sliderB.max = String(preset.paramB.max);
      sliderB.step = String(preset.paramB.step);
      sliderB.value = String(valB);
      syncSliderTrackFill(sliderB);
    }
    const lblA = document.getElementById('label-kin-param-a');
    if (lblA) {
      lblA.innerHTML = `<span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE] shrink-0"></span><span class="truncate">${escapeHtml(preset.paramALabel)}</span>`;
    }
    const lblB = document.getElementById('label-kin-param-b');
    if (lblB) {
      lblB.innerHTML = `<span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B] shrink-0"></span><span class="truncate">${escapeHtml(preset.paramBLabel)}</span>`;
    }
    const rA = document.getElementById('readout-kin-param-a');
    const rB = document.getElementById('readout-kin-param-b');
    if (rA) rA.textContent = formatKinematicsParam(valA, preset.paramA.step);
    if (rB) rB.textContent = formatKinematicsParam(valB, preset.paramB.step);

    const modeTitle = document.getElementById('kin-panel-mode-title');
    if (modeTitle) modeTitle.textContent = preset.name;
  };

  const canvasHost = document.getElementById('kin-3d-canvas');

  const handleKinematicsTelemetry = (m = {}) => {
    appState.kinematicsTelemetry = {
      ...appState.kinematicsTelemetry,
      ...m,
    };
    const preset = KINEMATICS_PRESETS[m.presetId || appState.kinematicsLab.presetId];
    if (typeof m.paramA === 'number') {
      appState.kinematicsLab.paramA = m.paramA;
      if (sliderA) {
        sliderA.value = String(m.paramA);
        syncSliderTrackFill(sliderA);
      }
      const rA = document.getElementById('readout-kin-param-a');
      if (rA) rA.textContent = formatKinematicsParam(m.paramA, preset?.paramA?.step);
    }
    if (typeof m.paramB === 'number') {
      appState.kinematicsLab.paramB = m.paramB;
      if (sliderB) {
        sliderB.value = String(m.paramB);
        syncSliderTrackFill(sliderB);
      }
      const rB = document.getElementById('readout-kin-param-b');
      if (rB) rB.textContent = formatKinematicsParam(m.paramB, preset?.paramB?.step);
    }
    updateKinematicsStage1TelemetryUI();
  };

  if (canvasHost && typeof Kinematics3DStudio === 'function') {
    try {
      const studio = new Kinematics3DStudio({
        presetId: activePreset?.id || 'planar-2r',
        paramA: appState.kinematicsLab.paramA,
        paramB: appState.kinematicsLab.paramB,
        mechatronicsLens: isMechatronicsLens(),
        onTelemetry: handleKinematicsTelemetry,
      });
      studio.init(canvasHost, {
        presetId: activePreset?.id || 'planar-2r',
        paramA: appState.kinematicsLab.paramA,
        paramB: appState.kinematicsLab.paramB,
        mechatronicsLens: isMechatronicsLens(),
        onTelemetry: handleKinematicsTelemetry,
      });
      studio.setCameraPreset?.(appState.kinematicsLab.cameraPreset);
      activeInstances.studio3D = studio;
      if (typeof studio.getTelemetry === 'function') {
        handleKinematicsTelemetry(studio.getTelemetry());
      }
    } catch (err) {
      console.error('[EIGENLAB] Kinematics3DStudio init error:', err);
      canvasHost.innerHTML = `
        <div class="w-full h-full flex items-center justify-center p-6 text-center text-sm text-slate-400">
          3D WebGL Robot Kinematics viewport could not initialize on this device.
        </div>
      `;
    }
  }

  updateKinematicsStage1LensUI();
  updateKinematicsStage1TelemetryUI();

  const mobBtn = document.getElementById('kin-btn-toggle-mobile-formula');
  const mobDrawer = document.getElementById('kin-mobile-formula-drawer');
  mobBtn?.addEventListener('click', () => {
    playSfx('tick');
    const isHidden = mobDrawer?.classList.toggle('hidden');
    mobBtn.setAttribute('aria-expanded', String(!isHidden));
    mobBtn.textContent = isHidden ? 'T ▾' : 'T ▴';
  });

  container.querySelectorAll('[data-kin-preset-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-kin-preset-id');
      if (!id || id === appState.kinematicsLab.presetId) return;
      playSfx('tick');
      appState.kinematicsLab.presetId = id;
      const preset = getActiveKinematicsPreset(presets);
      if (preset) {
        appState.kinematicsLab.paramA = preset.paramA.default;
        appState.kinematicsLab.paramB = preset.paramB.default;
        syncSlidersForPreset(preset, preset.paramA.default, preset.paramB.default);
      }

      container.querySelectorAll('[data-kin-preset-id]').forEach((b) => {
        const sel = b.getAttribute('data-kin-preset-id') === id;
        b.className = `shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
          sel
            ? 'bg-cyanGlow/20 border-cyanGlow/55 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.22)]'
            : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
        }`;
      });

      activeInstances.studio3D?.setPreset?.(id);
      if (typeof activeInstances.studio3D?.getTelemetry === 'function') {
        handleKinematicsTelemetry(activeInstances.studio3D.getTelemetry());
      } else {
        handleKinematicsTelemetry(
          analyzeKinematicsSystem({
            presetId: id,
            paramA: appState.kinematicsLab.paramA,
            paramB: appState.kinematicsLab.paramB,
          })
        );
      }
      markStageDone('3d-lab');
    });
  });

  container.querySelectorAll('[data-kin-camera-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const camId = btn.getAttribute('data-kin-camera-preset');
      if (!camId) return;
      playSfx('tick');
      appState.kinematicsLab.cameraPreset = camId;
      container.querySelectorAll('[data-kin-camera-preset]').forEach((b) => {
        const act = b.getAttribute('data-kin-camera-preset') === camId;
        const isCompact = b.textContent.trim().length <= 3;
        b.className = `${isCompact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'} rounded-lg font-mono transition-all cursor-pointer ${
          act
            ? 'bg-white/15 text-white border border-white/20 shadow-sm'
            : 'text-slate-400 border border-transparent hover:text-white'
        }`;
      });
      activeInstances.studio3D?.setCameraPreset?.(camId);
    });
  });

  sliderA?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const preset = getActiveKinematicsPreset(presets);
    appState.kinematicsLab.paramA = val;
    syncSliderTrackFill(sliderA);
    const r = document.getElementById('readout-kin-param-a');
    if (r) r.textContent = formatKinematicsParam(val, preset?.paramA?.step);
    if (typeof activeInstances.studio3D?.setParams === 'function') {
      activeInstances.studio3D.setParams({
        paramA: val,
        paramB: appState.kinematicsLab.paramB,
      });
    } else {
      handleKinematicsTelemetry(
        analyzeKinematicsSystem({
          presetId: appState.kinematicsLab.presetId,
          paramA: val,
          paramB: appState.kinematicsLab.paramB,
        })
      );
    }
    markStageDone('3d-lab');
  });

  sliderB?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const preset = getActiveKinematicsPreset(presets);
    appState.kinematicsLab.paramB = val;
    syncSliderTrackFill(sliderB);
    const r = document.getElementById('readout-kin-param-b');
    if (r) r.textContent = formatKinematicsParam(val, preset?.paramB?.step);
    if (typeof activeInstances.studio3D?.setParams === 'function') {
      activeInstances.studio3D.setParams({
        paramA: appState.kinematicsLab.paramA,
        paramB: val,
      });
    } else {
      handleKinematicsTelemetry(
        analyzeKinematicsSystem({
          presetId: appState.kinematicsLab.presetId,
          paramA: appState.kinematicsLab.paramA,
          paramB: val,
        })
      );
    }
    markStageDone('3d-lab');
  });

  document.getElementById('btn-kin-reset')?.addEventListener('click', () => {
    playSfx('snap');
    const preset = getActiveKinematicsPreset(presets);
    if (preset) {
      appState.kinematicsLab.paramA = preset.paramA.default;
      appState.kinematicsLab.paramB = preset.paramB.default;
      appState.kinematicsLab.cameraPreset = '3d';
      syncSlidersForPreset(preset, preset.paramA.default, preset.paramB.default);
    }
    container.querySelectorAll('[data-kin-camera-preset]').forEach((b) => {
      const act = b.getAttribute('data-kin-camera-preset') === '3d';
      const isCompact = b.textContent.trim().length <= 3;
      b.className = `${isCompact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'} rounded-lg font-mono transition-all cursor-pointer ${
        act
          ? 'bg-white/15 text-white border border-white/20 shadow-sm'
          : 'text-slate-400 border border-transparent hover:text-white'
      }`;
    });
    if (typeof activeInstances.studio3D?.reset === 'function') {
      const t = activeInstances.studio3D.reset();
      if (t) handleKinematicsTelemetry(t);
    } else if (preset) {
      handleKinematicsTelemetry(
        analyzeKinematicsSystem({
          presetId: preset.id,
          paramA: preset.paramA.default,
          paramB: preset.paramB.default,
        })
      );
    }
  });

  const goStage2 = () => {
    playSfx('tick');
    switchStage('intuition');
  };
  document.getElementById('btn-kin-next-intuition')?.addEventListener('click', goStage2);
  document.getElementById('btn-kin-next-intuition-mobile')?.addEventListener('click', goStage2);
}

function updateKinematicsStage1LensUI() {
  const on = isMechatronicsLens();
  const titleEl = document.getElementById('kin-hud-title');
  if (titleEl) {
    titleEl.textContent = on
      ? 'Servo Torque Rig + 3D Kinematics Workcell'
      : '3D Robot Kinematics, Jacobian & IK Studio';
  }
  const mechBox = document.getElementById('kin-hud-mech-indicator');
  const mechTxt = document.getElementById('kin-hud-mech-text');
  if (mechBox) {
    mechBox.className = `hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
      on
        ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
        : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
    }`;
    const dot = mechBox.querySelector('span.rounded-full');
    if (dot) dot.className = `w-2 h-2 rounded-full ${on ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}`;
  }
  if (mechTxt) {
    mechTxt.textContent = on ? 'Servo Torques τ = JᵀF: LIVE' : 'Servo Torque Overlay: Standby';
  }
}

function updateKinematicsStage1TelemetryUI() {
  const t = appState.kinematicsTelemetry || {};
  const m = t.metrics || {};

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('kin-lbl-primary', m.primaryLabel || 'Primary');
  setText('kin-lbl-primary-compact', m.primaryLabel || 'Primary');
  setText('kin-val-primary', m.primaryValue || '—');
  setText('kin-val-primary-compact', m.primaryValue || '—');

  setText('kin-lbl-secondary', m.secondaryLabel || 'Secondary');
  setText('kin-lbl-secondary-compact', m.secondaryLabel || 'Secondary');
  setText('kin-val-secondary', m.secondaryValue || '—');
  setText('kin-val-secondary-compact', m.secondaryValue || '—');

  setText('kin-lbl-tertiary', m.tertiaryLabel || 'Tertiary');
  setText('kin-val-tertiary', m.tertiaryValue || '—');

  const badge = document.getElementById('kin-badge-status');
  if (badge) {
    const statusText = m.statusText || 'WELL-CONDITIONED';
    badge.textContent = statusText;
    const c = String(m.statusColor || '').toUpperCase();
    if (c === '#FB7185') {
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold border transition-all duration-300 bg-rose-500/20 border-rose-400/50 text-rose-200 max-w-[130px] sm:max-w-none truncate';
    } else if (c === '#F59E0B') {
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold border transition-all duration-300 bg-amberGlow/15 border-amberGlow/45 text-amber-200 max-w-[130px] sm:max-w-none truncate';
    } else if (c === '#A78BFA') {
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold border transition-all duration-300 bg-violetGlow/15 border-violetGlow/45 text-violet-200 max-w-[130px] sm:max-w-none truncate';
    } else if (c === '#34D399') {
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold border transition-all duration-300 bg-emeraldGlow/15 border-emeraldGlow/40 text-emerald-200 max-w-[130px] sm:max-w-none truncate';
    } else {
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold border transition-all duration-300 bg-cyanGlow/15 border-cyanGlow/40 text-cyan-200 max-w-[130px] sm:max-w-none truncate';
    }
  }

  const formulaTex =
    t.formulaLatex || KINEMATICS_PRESETS[appState.kinematicsLab.presetId]?.formulaLatex || '';
  if (formulaTex) {
    const hudFormulaEl = document.getElementById('kin-hud-formula-math');
    if (hudFormulaEl) typesetMath(hudFormulaEl, formulaTex, false);
    const panelFormulaEl = document.getElementById('kin-telemetry-formula-katex');
    if (panelFormulaEl) typesetMath(panelFormulaEl, formulaTex, false);
  }
}

function mountKinematicsStage2Intuition(container) {
  const on = isMechatronicsLens();
  const s = getStoreState();
  const solvedKinQuizzes = (s.solvedQuizzes || []).filter((id) =>
    String(id).startsWith('kin-quiz-')
  ).length;
  let activeSubTab = 'lab';

  container.innerHTML = `
    <section class="space-y-3 lg:space-y-6 view-enter">
      <!-- Mobile Segmented Sub-Tab Switcher (<lg) -->
      <div class="lg:hidden grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#0E121C]/90 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <button
          type="button"
          data-stage2-subtab="lab"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-cyanGlow/20 border border-cyanGlow/45 text-cyan-100 shadow-sm"
        >
          📐 IK/Ellip Lab
        </button>
        <button
          type="button"
          data-stage2-subtab="quiz"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white"
        >
          🎯 Visual Quiz (${solvedKinQuizzes}/6)
        </button>
      </div>

      <!-- Interactive 2D Workspace, Manipulability Ellipsoid & IK Lab -->
      <div id="stage2-panel-lab" class="glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-cyanGlow">Robot Kinematics ↔ Jacobian &amp; IK</div>
            <h2 id="stage2-lab-title" class="font-display font-bold text-xl text-white mt-0.5">
              ${
                on
                  ? 'Servo Torque Demands τ = JᵀF, Actuator Saturation & Workspace Safety'
                  : 'Synchronized Workspace Arm, Manipulability Ellipsoid & IK Convergence'
              }
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Scrub trajectory time across synchronized workspace geometry, Yoshikawa manipulability ellipses, condition number, and DLS / QP-IK joint velocity panels.
            </p>
          </div>
          <span class="px-3 py-1 rounded-full text-[11px] font-mono bg-white/[0.04] border border-white/10 text-slate-300">
            Drag trajectory cursor t
          </span>
        </div>

        <div id="kin-graph-lab-host" class="w-full min-h-[300px] sm:min-h-[380px]"></div>
      </div>

      <!-- Visual Kinematics & IK Quiz Engine -->
      <div id="stage2-panel-quiz" class="hidden lg:block glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-violetGlow">Robotics Geometric Mastery</div>
            <h2 class="font-display font-bold text-xl text-white mt-0.5">DH, PoE, Singularity &amp; QP-IK Visual Challenges</h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Master Standard vs. Modified DH, parallel-axis calibration flaws, workspace branch multiplicity, collapsed manipulability ellipses, DLS damping, and nullspace projection.
            </p>
          </div>
          <button
            id="btn-next-solver"
            type="button"
            class="btn-glass !text-xs"
          >
            Next: Robot Kinematics Solver →
          </button>
        </div>

        <div id="kin-quiz-engine-host" class="w-full min-h-[280px] sm:min-h-[320px]"></div>
      </div>
    </section>
  `;

  const panelLab = document.getElementById('stage2-panel-lab');
  const panelQuiz = document.getElementById('stage2-panel-quiz');
  const setSubTab = (tab) => {
    activeSubTab = tab;
    if (panelLab && panelQuiz) {
      panelLab.classList.toggle('hidden', tab !== 'lab');
      panelLab.classList.add('lg:block');
      panelQuiz.classList.toggle('hidden', tab !== 'quiz');
      panelQuiz.classList.add('lg:block');
    }
    container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
      const isAct = btn.getAttribute('data-stage2-subtab') === tab;
      btn.className = isAct
        ? 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-cyanGlow/20 border border-cyanGlow/45 text-cyan-100 shadow-sm'
        : 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white';
    });
    requestAnimationFrame(() => {
      if (tab === 'lab') {
        activeInstances.stackedLab?._resizeAll?.();
        activeInstances.stackedLab?._drawAll?.();
      } else {
        activeInstances.quizEngine?._resizeCanvas?.();
        activeInstances.quizEngine?._resizeCanvases?.();
        activeInstances.quizEngine?._drawCanvas?.();
        activeInstances.quizEngine?._drawCanvases?.();
      }
      window.dispatchEvent(new Event('resize'));
    });
  };

  container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-stage2-subtab');
      if (next && next !== activeSubTab) {
        playSfx('tick');
        setSubTab(next);
      }
    });
  });

  const labHost = document.getElementById('kin-graph-lab-host');
  if (labHost && typeof KinematicsGraphLab === 'function') {
    try {
      activeInstances.stackedLab = new KinematicsGraphLab(labHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        initialPreset: appState.kinematicsLab.presetId || 'planar-2r',
        onInteract: () => markStageDone('intuition'),
        onOpenQuiz: () => {
          playSfx('tick');
          setSubTab('quiz');
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] KinematicsGraphLab mount error:', err);
    }
  }

  const quizHost = document.getElementById('kin-quiz-engine-host');
  if (quizHost && typeof KinematicsVisualQuizEngine === 'function') {
    try {
      const updateTabCount = (payload) => {
        const count =
          payload?.solvedCount ??
          (getStoreState().solvedQuizzes || []).filter((id) =>
            String(id).startsWith('kin-quiz-')
          ).length;
        const quizBtn = container.querySelector('[data-stage2-subtab="quiz"]');
        if (quizBtn) quizBtn.textContent = `🎯 Visual Quiz (${count}/6)`;
      };
      activeInstances.quizEngine = new KinematicsVisualQuizEngine(quizHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onAnswer: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
        onProgress: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
        onComplete: (p) => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateTabCount(p);
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] KinematicsVisualQuizEngine mount error:', err);
    }
  }

  document.getElementById('btn-next-solver')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('solver');
  });
}

function mountKinematicsStage3Solver(container) {
  container.innerHTML = `
    <section class="max-w-4xl mx-auto space-y-3 sm:space-y-5 view-enter">
      <div class="hidden md:flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-cyanGlow">Robotics &amp; Modern IK Drills</div>
          <h2 class="font-display font-bold text-2xl text-white mt-0.5">DH, PoE SE(3), Jacobian &amp; QP-IK Step Solver</h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
            12 deep 5-to-6-part robotics drills covering Standard &amp; Modified DH, Rodrigues SO(3) / SE(3) Product of Exponentials, Space/Body Jacobians, Yoshikawa manipulability, Pieper spherical-wrist IK, Damped Least Squares, and differential QP-IK.
          </p>
        </div>

        <button
          id="btn-next-word-problems"
          type="button"
          class="btn-glass !text-xs"
        >
          Next: Word Problems →
        </button>
      </div>

      <div id="paperless-solver-host" class="glass-panel p-2.5 sm:p-5 md:p-6 min-h-[420px]"></div>
    </section>
  `;

  const host = document.getElementById('paperless-solver-host');
  if (host && typeof PaperlessStepSolver === 'function') {
    try {
      activeInstances.stepSolver = new PaperlessStepSolver(host, {
        mode: 'kinematics',
        curriculum: 'kinematics',
        problems: KINEMATICS_PROBLEMS,
        tiers: KINEMATICS_SOLVER_TIERS,
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onSolve: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProblemSolved: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProgress: (info) => {
          if (!info || (info.solvedCount ?? 1) >= 1) {
            markStageDone('solver');
            updateLessonStageDotsUI();
          }
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] Kinematics PaperlessStepSolver mount error:', err);
    }
  }

  document.getElementById('btn-next-word-problems')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('word-problems');
  });
}

function mountStage4WordProblems(container) {
  if (!container) return;

  const isInt = isIntegralLesson();
  const isDE = isDiffEqLesson();
  const isLA = isLinAlgLesson();
  const isMod = isModelingLesson();
  const isPid = isPidLesson();
  const isFreq = isFreqLesson();
  const isSS = isStateSpaceLesson();
  const isKin = isKinematicsLesson();
  const fallbackData = isKin
    ? FALLBACK_KINEMATICS_WORD_PROBLEMS
    : isSS
      ? FALLBACK_STATESPACE_WORD_PROBLEMS
      : isFreq
        ? FALLBACK_FREQ_WORD_PROBLEMS
        : isPid
          ? FALLBACK_PID_WORD_PROBLEMS
          : isMod
            ? FALLBACK_MODELING_WORD_PROBLEMS
            : isLA
              ? FALLBACK_LINALG_WORD_PROBLEMS
              : isDE
                ? FALLBACK_DIFFEQ_WORD_PROBLEMS
                : isInt
                  ? FALLBACK_INTEGRAL_WORD_PROBLEMS
                  : FALLBACK_WORD_PROBLEMS;
  const data = appState.wordProblemsByLesson?.[appState.lessonId] || fallbackData;
  const jsonFilePath = isKin
    ? 'data/lessons/kinematics-word-problems.json'
    : isSS
      ? 'data/lessons/statespace-word-problems.json'
      : isFreq
        ? 'data/lessons/freq-word-problems.json'
        : isPid
          ? 'data/lessons/pid-word-problems.json'
          : isMod
            ? 'data/lessons/modeling-word-problems.json'
            : isLA
              ? 'data/lessons/linalg-word-problems.json'
              : isDE
                ? 'data/lessons/diffeq-word-problems.json'
                : isInt
                  ? 'data/lessons/integrals-word-problems.json'
                  : 'data/lessons/derivatives-word-problems.json';
  const problems = Array.isArray(data.problems) ? data.problems : [];
  const rawPlanned =
    Array.isArray(data.plannedTopics) && data.plannedTopics.length
      ? data.plannedTopics
      : fallbackData.plannedTopics;
  const plannedTopics = rawPlanned.map(enrichPlannedTopic);
  const isComingSoon = data.status === 'coming_soon' && problems.length === 0;

  container.innerHTML = `
    <section class="max-w-5xl mx-auto space-y-4 sm:space-y-6 view-enter">
      <!-- Engineering Blueprint Header Card -->
      <div class="glass-panel relative overflow-hidden p-4 sm:p-8">
        <div class="pointer-events-none absolute inset-0 opacity-[0.06]" style="background-image: linear-gradient(to right, #22D3EE 1px, transparent 1px), linear-gradient(to bottom, #22D3EE 1px, transparent 1px); background-size: 28px 28px;"></div>

        <div class="relative flex flex-wrap items-start justify-between gap-3 sm:gap-4">
          <div class="space-y-2 max-w-2xl">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider border ${
                isComingSoon
                  ? 'bg-amberGlow/15 border-amberGlow/40 text-amberGlow'
                  : 'bg-emeraldGlow/15 border-emeraldGlow/40 text-emeraldGlow'
              }">
                <span class="w-1.5 h-1.5 rounded-full ${isComingSoon ? 'bg-amberGlow animate-pulse' : 'bg-emeraldGlow'}"></span>
                ${
                  isComingSoon
                    ? 'status: coming_soon'
                    : `${problems.length} Active Problem${problems.length === 1 ? '' : 's'} Ready`
                }
              </span>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-mono bg-white/[0.04] border border-white/10 text-slate-300">
                Engineering Blueprint Preview
              </span>
            </div>

            <h2 class="font-display font-bold text-xl sm:text-3xl text-white">
              ${escapeHtml(
                data.title ||
                  (isKin
                    ? 'Applied Robot Kinematics, Redundant Nullspace & QP-IK Cases'
                    : isSS
                      ? 'Applied Modern Control, MPC & SOTA Estimation Cases'
                      : isFreq
                        ? 'Applied Root Locus, Bode & Loop-Shaping Design Cases'
                        : isPid
                          ? 'Applied PID Control & Mechatronics Stabilization Problems'
                          : isMod
                            ? 'Applied Physical Modeling & s-Plane Design Problems'
                            : isLA
                              ? 'Applied Linear Algebra & Eigen-Engineering Problems'
                              : isDE
                                ? 'Applied ODE & Laplace Engineering Problems'
                                : isInt
                                  ? 'Applied Integral Word Problems'
                                  : 'Applied Engineering Word Problems')
              )}
            </h2>
            <p class="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
              ${escapeHtml(
                data.subtitle ||
                  (isKin
                    ? 'Design 7-DOF Franka Panda nullspace obstacle avoidance, UR5e analytical Pieper IK detours, high-speed SCARA PCB trajectories, and dual-arm humanoid QP-IK controllers.'
                    : isSS
                      ? 'Synthesize quadruped whole-body MPC + InEKF contact estimators, drone CBF-QP safety filters, satellite reaction-wheel LQR observers, and autonomous car MHE/UKF fusion.'
                      : isFreq
                        ? 'Synthesize dual-stage HDD lead-lag servos, flexible-link notch filters, maglev Nyquist loops, and satellite attitude sensitivity budgets.'
                        : isPid
                          ? 'Design cascaded drone attitude controllers, anti-windup CNC servos, lead-compensated inverted pendulums, and Smith predictors for delayed thermal plants.'
                          : isMod
                            ? 'Model coupled quarter-car suspensions, voice-coil actuators, interacting hydraulic tanks, and MEMS proof-mass sensors from first principles.'
                            : isLA
                              ? 'Apply Jacobians, rigid-body inertia tensors, Kalman covariance propagation, and low-rank SVD compression to real robotics and AI pipelines.'
                              : isDE
                                ? 'Model RLC transients, closed-loop DC motor transfer functions, suspension damping, and continuous Neural ODEs.'
                                : isInt
                                  ? 'Translate velocity profiles, variable force paths, pulsed currents, and probability densities into definite integrals.'
                                  : 'Translate physical mechatronics, electronics, thermal, and machine learning narratives into differential models and solve them interactively.')
              )}
            </p>
          </div>

          <button
            id="btn-mark-blueprint-reviewed"
            type="button"
            class="btn-glass !text-xs !font-mono shrink-0"
          >
            ${isStageDone('word-problems') ? '✓ Stage 4 Reviewed' : 'Mark Stage 4 Reviewed'}
          </button>
        </div>

        <!-- Auto-Activation Architectural Note -->
        <div class="relative mt-4 sm:mt-6 rounded-2xl p-3 sm:p-4 bg-[#080A0F]/80 border border-cyanGlow/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div class="flex items-start gap-2.5 sm:gap-3">
            <span class="text-base sm:text-lg leading-none mt-0.5" aria-hidden="true">📐</span>
            <div class="text-xs text-slate-300 leading-relaxed">
              <strong class="text-white">Automatic Activation:</strong> Dropping structured word problems into
              <code class="px-1.5 py-0.5 rounded bg-white/10 text-cyanGlow font-mono">${jsonFilePath}</code>
              activates them automatically in this stage without modifying any app code.
            </div>
          </div>
          <span class="shrink-0 text-[11px] font-mono text-slate-400">
            ${problems.length} loaded
          </span>
        </div>
      </div>

      ${
        problems.length > 0
          ? `
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="font-display font-semibold text-lg text-white">Active Word Problems (${problems.length})</h3>
                <span class="status-live">Ready</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${problems
                  .map(
                    (prob, idx) => `
                      <article class="glass-card p-5 space-y-2.5 !border-emeraldGlow/25">
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-[11px] font-mono text-emeraldGlow uppercase">Problem ${idx + 1}</span>
                          ${
                            prob.domain
                              ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.05] text-slate-300 border border-white/10">${escapeHtml(prob.domain)}</span>`
                              : ''
                          }
                        </div>
                        <h4 class="font-display font-semibold text-base text-white">${escapeHtml(prob.title || `Applied Problem ${idx + 1}`)}</h4>
                        <p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(prob.prompt || prob.description || '')}</p>
                        ${
                          prob.equation || prob.latex
                            ? `<div class="katex-card !py-2.5"><span data-wp-katex="${escapeHtml(prob.equation || prob.latex)}"></span></div>`
                            : ''
                        }
                      </article>
                    `
                  )
                  .join('')}
              </div>
            </div>
          `
          : ''
      }

      <!-- 4 Planned Engineering Topics Grid -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="font-display font-semibold text-lg text-white">Upcoming Engineering Problem Modules</h3>
          <span class="text-xs font-mono text-slate-400">${plannedTopics.length} Planned Tracks</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${plannedTopics
            .map((topic) => {
              const accent = getAccentClasses(topic.accent);
              return `
                <article class="glass-card p-5 ${accent.border} flex flex-col justify-between gap-4">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between gap-2">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${accent.badge}">
                        ${escapeHtml(topic.domain)}
                      </span>
                      <span class="status-planned !text-[10px]">Queued</span>
                    </div>
                    <h4 class="font-display font-semibold text-base text-white">
                      ${escapeHtml(topic.title)}
                    </h4>
                    <p class="text-xs text-slate-400 leading-relaxed">
                      ${escapeHtml(topic.summary)}
                    </p>
                  </div>

                  ${
                    topic.equation
                      ? `
                        <div class="katex-card !py-3 flex items-center justify-center min-h-[54px]">
                          <span data-wp-katex="${escapeHtml(topic.equation)}" class="text-slate-100 text-sm"></span>
                        </div>
                      `
                      : ''
                  }
                </article>
              `;
            })
            .join('')}
        </div>
      </div>
    </section>
  `;

  container.querySelectorAll('[data-wp-katex]').forEach((el) => {
    const tex = el.getAttribute('data-wp-katex');
    if (tex) typesetMath(el, tex, false);
  });

  document.getElementById('btn-mark-blueprint-reviewed')?.addEventListener('click', () => {
    playSfx('success');
    markStageDone('word-problems');
    const btn = document.getElementById('btn-mark-blueprint-reviewed');
    if (btn) btn.textContent = '✓ Stage 4 Reviewed';
  });
}

// ---------------------------------------------------------------------------
// Data Loading & KaTeX Readiness Boot Sequence
// ---------------------------------------------------------------------------

async function fetchJsonSafe(url, fallback) {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[EIGENLAB] Could not fetch ${url}, using fallback:`, err);
    return fallback;
  }
}

function waitForKatex(timeoutMs = 2500) {
  return new Promise((resolve) => {
    if (window.katex) {
      resolve();
      return;
    }
    const start = performance.now();
    const check = () => {
      if (window.katex || performance.now() - start >= timeoutMs) {
        resolve();
      } else {
        setTimeout(check, 40);
      }
    };
    check();
  });
}

function subscribeToStoreUpdates() {
  if (typeof store?.subscribe !== 'function') return;
  store.subscribe(() => {
    const stats = getMasterySnapshot();
    if (appState.view === 'lesson') {
      updateLessonStageDotsUI();
    } else if (appState.view === 'hub') {
      const streakEl = document.getElementById('hub-header-streak');
      if (streakEl) streakEl.textContent = String(stats.streak);
      activeInstances.skillGraph?.refreshProgress?.(getMergedDagCompletedIds());
    }
  });
}

async function boot() {
  const [
    curriculum,
    derivWordProblems,
    intWordProblems,
    deWordProblems,
    laWordProblems,
    modWordProblems,
    pidWordProblems,
    freqWordProblems,
    statespaceWordProblems,
    kinematicsWordProblems,
  ] = await Promise.all([
    fetchJsonSafe('./data/curriculum.json', FALLBACK_CURRICULUM),
    fetchJsonSafe('./data/lessons/derivatives-word-problems.json', FALLBACK_WORD_PROBLEMS),
    fetchJsonSafe(
      './data/lessons/integrals-word-problems.json',
      FALLBACK_INTEGRAL_WORD_PROBLEMS
    ),
    fetchJsonSafe(
      './data/lessons/diffeq-word-problems.json',
      FALLBACK_DIFFEQ_WORD_PROBLEMS
    ),
    fetchJsonSafe(
      './data/lessons/linalg-word-problems.json',
      FALLBACK_LINALG_WORD_PROBLEMS
    ),
    fetchJsonSafe(
      './data/lessons/modeling-word-problems.json',
      FALLBACK_MODELING_WORD_PROBLEMS
    ),
    fetchJsonSafe('./data/lessons/pid-word-problems.json', FALLBACK_PID_WORD_PROBLEMS),
    fetchJsonSafe('./data/lessons/freq-word-problems.json', FALLBACK_FREQ_WORD_PROBLEMS),
    fetchJsonSafe(
      './data/lessons/statespace-word-problems.json',
      FALLBACK_STATESPACE_WORD_PROBLEMS
    ),
    fetchJsonSafe(
      './data/lessons/kinematics-word-problems.json',
      FALLBACK_KINEMATICS_WORD_PROBLEMS
    ),
    waitForKatex(),
  ]);

  if (curriculum && Array.isArray(curriculum.domains)) {
    appState.curriculum = curriculum;
  }
  if (derivWordProblems && typeof derivWordProblems === 'object') {
    appState.wordProblems = derivWordProblems;
    appState.wordProblemsByLesson['calc-derivatives'] = derivWordProblems;
  }
  if (intWordProblems && typeof intWordProblems === 'object') {
    appState.wordProblemsByLesson['calc-integrals'] = intWordProblems;
  }
  if (deWordProblems && typeof deWordProblems === 'object') {
    appState.wordProblemsByLesson['math-diff-eq'] = deWordProblems;
  }
  if (laWordProblems && typeof laWordProblems === 'object') {
    appState.wordProblemsByLesson['math-lin-alg'] = laWordProblems;
  }
  if (modWordProblems && typeof modWordProblems === 'object') {
    appState.wordProblemsByLesson['mech-modeling'] = modWordProblems;
  }
  if (pidWordProblems && typeof pidWordProblems === 'object') {
    appState.wordProblemsByLesson['mech-pid'] = pidWordProblems;
  }
  if (freqWordProblems && typeof freqWordProblems === 'object') {
    appState.wordProblemsByLesson['mech-root-bode'] = freqWordProblems;
  }
  if (statespaceWordProblems && typeof statespaceWordProblems === 'object') {
    appState.wordProblemsByLesson['mech-state-space'] = statespaceWordProblems;
  }
  if (kinematicsWordProblems && typeof kinematicsWordProblems === 'object') {
    appState.wordProblemsByLesson['mech-kinematics'] = kinematicsWordProblems;
  }

  subscribeToStoreUpdates();

  window.addEventListener('hashchange', applyRouteFromHash);
  window.addEventListener('popstate', applyRouteFromHash);

  window.addEventListener('beforeunload', () => {
    disposeActiveWidgets();
  });

  applyRouteFromHash();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
