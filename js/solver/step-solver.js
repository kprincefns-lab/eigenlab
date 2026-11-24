/**
 * EIGENLAB — Paperless Multi-Step Symbolic Solver
 * Supports Derivatives, Integrals, Diff Eq / Laplace, Linear Algebra,
 * Physical Modeling & s-Plane, PID Control, Root Locus & Bode Frequency Design,
 * Modern State-Space, MPC & SOTA Estimation, and Forward & Inverse Robot Kinematics.
 * Zero scratch paper required: every completed micro-step locks into a persistent
 * Working Step Ledger with per-step "Why This Step?" and "⚡ System Impact" insights,
 * culminating in a high-DPI interactive numerical or geometric verification plot.
 */

import { DERIVATIVE_PROBLEMS, SOLVER_TIERS } from '../../data/lessons/derivatives-problems.js';
import {
  INTEGRAL_PROBLEMS,
  INTEGRAL_SOLVER_TIERS,
} from '../../data/lessons/integrals-problems.js';
import {
  DIFFEQ_PROBLEMS,
  DIFFEQ_SOLVER_TIERS,
} from '../../data/lessons/diffeq-problems.js';
import {
  LINALG_PROBLEMS,
  LINALG_SOLVER_TIERS,
} from '../../data/lessons/linalg-problems.js';
import {
  PID_PROBLEMS,
  PID_SOLVER_TIERS,
} from '../../data/lessons/pid-problems.js';
import {
  MODELING_PROBLEMS,
  MODELING_SOLVER_TIERS,
} from '../../data/lessons/modeling-problems.js';
import {
  FREQ_PROBLEMS,
  FREQ_SOLVER_TIERS,
} from '../../data/lessons/freq-problems.js';
import {
  STATESPACE_PROBLEMS,
  STATESPACE_SOLVER_TIERS,
} from '../../data/lessons/statespace-problems.js';
import {
  KINEMATICS_PROBLEMS,
  KINEMATICS_SOLVER_TIERS,
} from '../../data/lessons/kinematics-problems.js';
import { store, sound, renderKatex, renderInlineMathText } from '../store.js';
import { renderSystemSchematicSVG } from '../viz/schematic-svg.js';

const CHEAT_SHEET_RULES = [
  {
    name: 'Power Rule',
    tag: 'Algebraic',
    latex:
      '\\frac{d}{dx}\\!\\left(\\textcolor{#22D3EE}{x}^{\\textcolor{#F59E0B}{n}}\\right) = \\textcolor{#34D399}{\\textcolor{#F59E0B}{n}\\,\\textcolor{#22D3EE}{x}^{\\textcolor{#F59E0B}{n}-1}}',
  },
  {
    name: 'Constant & Linearity',
    tag: 'Linearity',
    latex:
      '\\frac{d}{dx}(c) = \\textcolor{#34D399}{0}, \\quad \\frac{d}{dx}(a\\textcolor{#22D3EE}{u} \\pm b\\textcolor{#F59E0B}{v}) = a\\textcolor{#34D399}{u\'} \\pm b\\textcolor{#34D399}{v\'}',
  },
  {
    name: 'Product Rule',
    tag: 'u · v',
    latex:
      '(\\textcolor{#22D3EE}{u}\\,\\textcolor{#F59E0B}{v})\' = \\textcolor{#34D399}{u\'}\\textcolor{#F59E0B}{v} + \\textcolor{#22D3EE}{u}\\textcolor{#34D399}{v\'}',
  },
  {
    name: 'Quotient Rule',
    tag: 'u / v',
    latex:
      '\\left(\\frac{\\textcolor{#22D3EE}{u}}{\\textcolor{#F59E0B}{v}}\\right)\' = \\frac{\\textcolor{#34D399}{u\'}\\textcolor{#F59E0B}{v} - \\textcolor{#22D3EE}{u}\\textcolor{#34D399}{v\'}}{\\textcolor{#F59E0B}{v}^2}',
  },
  {
    name: 'Chain Rule',
    tag: 'Outer(Inner)',
    latex:
      '\\frac{d}{dx}\\,\\textcolor{#22D3EE}{g}\\!\\big(\\textcolor{#F59E0B}{u(x)}\\big) = \\textcolor{#34D399}{g\'}(\\textcolor{#F59E0B}{u}) \\cdot \\textcolor{#34D399}{u\'(x)}',
  },
  {
    name: 'Trigonometric',
    tag: 'sin / cos / tan',
    latex:
      '(\\sin x)\' = \\textcolor{#34D399}{\\cos x}, \\;\; (\\cos x)\' = \\textcolor{#34D399}{-\\sin x}, \\;\; (\\tan x)\' = \\textcolor{#34D399}{\\sec^2 x}',
  },
  {
    name: 'Exponential & Log',
    tag: 'e^x / ln x',
    latex:
      '(e^x)\' = \\textcolor{#34D399}{e^x}, \\qquad (\\ln x)\' = \\textcolor{#34D399}{\\frac{1}{x}} \\;\;(x > 0)',
  },
];

const INTEGRAL_CHEAT_SHEET_RULES = [
  {
    name: 'Reverse Power Rule',
    tag: 'n ≠ -1',
    latex:
      '\\int \\textcolor{#22D3EE}{x}^{\\textcolor{#F59E0B}{n}}\\,dx = \\textcolor{#34D399}{\\frac{\\textcolor{#22D3EE}{x}^{\\textcolor{#F59E0B}{n}+1}}{\\textcolor{#F59E0B}{n}+1}} + C',
  },
  {
    name: 'Log & Exponential',
    tag: '1/x & e^x',
    latex:
      '\\int \\frac{1}{\\textcolor{#22D3EE}{x}}\\,dx = \\textcolor{#34D399}{\\ln|\\textcolor{#22D3EE}{x}|} + C, \\quad \\int e^{\\textcolor{#22D3EE}{x}}\\,dx = \\textcolor{#34D399}{e^{\\textcolor{#22D3EE}{x}}} + C',
  },
  {
    name: 'u-Substitution',
    tag: 'Chain Reverse',
    latex:
      '\\int f(\\textcolor{#22D3EE}{u})\\,\\textcolor{#F59E0B}{u\'(x)\\,dx} = \\int f(\\textcolor{#22D3EE}{u})\\,\\textcolor{#F59E0B}{du} = \\textcolor{#34D399}{F(\\textcolor{#22D3EE}{u})} + C',
  },
  {
    name: 'Trig & Half-Angle',
    tag: 'sin / cos / sin²',
    latex:
      '\\int \\cos(kx)\\,dx = \\textcolor{#34D399}{\\frac{\\sin(kx)}{k}}, \\;\; \\sin^2 x = \\textcolor{#34D399}{\\frac{1 - \\cos(2x)}{2}}',
  },
  {
    name: 'Integration by Parts',
    tag: 'LIATE',
    latex:
      '\\int \\textcolor{#22D3EE}{u}\\,\\textcolor{#F59E0B}{dv} = \\textcolor{#22D3EE}{u}\\textcolor{#34D399}{v} - \\int \\textcolor{#34D399}{v}\\,\\textcolor{#F59E0B}{du} \\;\;(\\text{LIATE})',
  },
  {
    name: 'Partial Fractions',
    tag: 'Linear Poles',
    latex:
      '\\frac{P(x)}{(\\textcolor{#22D3EE}{x-a})(\\textcolor{#F59E0B}{x-b})} = \\frac{\\textcolor{#22D3EE}{A}}{x-a} + \\frac{\\textcolor{#F59E0B}{B}}{x-b}',
  },
  {
    name: 'Fundamental Theorem',
    tag: 'FTC Definite',
    latex:
      '\\int_{\\textcolor{#22D3EE}{a}}^{\\textcolor{#F59E0B}{b}} f(x)\\,dx = \\textcolor{#34D399}{F(\\textcolor{#F59E0B}{b}) - F(\\textcolor{#22D3EE}{a})}',
  },
];

const DIFFEQ_CHEAT_SHEET_RULES = [
  {
    name: 'Separable ODE',
    tag: 'g(y)dy = h(t)dt',
    latex:
      '\\frac{dy}{dt} = \\textcolor{#22D3EE}{f(y)}\\,\\textcolor{#F59E0B}{g(t)} \\implies \\int \\frac{dy}{\\textcolor{#22D3EE}{f(y)}} = \\int \\textcolor{#F59E0B}{g(t)}\\,dt',
  },
  {
    name: 'Integrating Factor',
    tag: '1st-Order Linear',
    latex:
      'y\' + \\textcolor{#22D3EE}{P(t)}y = \\textcolor{#F59E0B}{Q(t)}, \\;\; \\textcolor{#34D399}{\\mu = e^{\\int P\\,dt}} \\implies (\\mu y)\' = \\mu Q',
  },
  {
    name: 'Characteristic Roots',
    tag: 'ar² + br + c = 0',
    latex:
      'a\\textcolor{#22D3EE}{r}^2 + b\\textcolor{#22D3EE}{r} + c = 0 \\implies \\textcolor{#34D399}{e^{r_1 t},\\; t e^{rt},\\; e^{\\alpha t}\\cos\\omega t}',
  },
  {
    name: 'Core Laplace Table',
    tag: '1, tⁿ, eᵃᵗ',
    latex:
      '\\mathcal{L}\\{1\\}=\\textcolor{#34D399}{\\tfrac{1}{s}},\\; \\mathcal{L}\\{t^n\\}=\\textcolor{#34D399}{\\tfrac{n!}{s^{n+1}}},\\; \\mathcal{L}\\{e^{at}\\}=\\textcolor{#34D399}{\\tfrac{1}{s-a}}',
  },
  {
    name: 'Trig Laplace Table',
    tag: 'sin ωt / cos ωt',
    latex:
      '\\mathcal{L}\\{\\sin\\omega t\\}=\\textcolor{#34D399}{\\frac{\\omega}{s^2+\\omega^2}}, \\;\; \\mathcal{L}\\{\\cos\\omega t\\}=\\textcolor{#34D399}{\\frac{s}{s^2+\\omega^2}}',
  },
  {
    name: 'Derivative Property',
    tag: 'IVP → Algebra',
    latex:
      '\\mathcal{L}\\{y\'\\} = \\textcolor{#34D399}{sY - y(0)}, \\;\; \\mathcal{L}\\{y\'\'\\} = \\textcolor{#34D399}{s^2Y - sy(0) - y\'(0)}',
  },
  {
    name: 'First Shifting Theorem',
    tag: 's → s + a',
    latex:
      '\\mathcal{L}\\!\\left\\{\\textcolor{#F59E0B}{e^{-at}}\\,\\textcolor{#22D3EE}{f(t)}\\right\\} = \\textcolor{#34D399}{F(s + a)}',
  },
];

const LINALG_CHEAT_SHEET_RULES = [
  {
    name: 'Dot & Projection',
    tag: 'Inner Product',
    latex:
      '\\textcolor{#22D3EE}{\\mathbf{u}}\\cdot\\textcolor{#F59E0B}{\\mathbf{v}} = \\|\\mathbf{u}\\|\\|\\mathbf{v}\\|\\cos\\theta, \\;\; \\operatorname{proj}_{\\mathbf{b}}\\mathbf{a} = \\textcolor{#34D399}{\\frac{\\mathbf{a}\\cdot\\mathbf{b}}{\\mathbf{b}\\cdot\\mathbf{b}}\\,\\mathbf{b}}',
  },
  {
    name: '2×2 Det & Inverse',
    tag: 'ad − bc ≠ 0',
    latex:
      'A^{-1} = \\frac{1}{\\textcolor{#34D399}{ad-bc}}\\begin{bmatrix} \\textcolor{#22D3EE}{d} & \\textcolor{#F59E0B}{-b} \\\\ \\textcolor{#F59E0B}{-c} & \\textcolor{#22D3EE}{a} \\end{bmatrix}',
  },
  {
    name: 'Characteristic Eq',
    tag: 'Eigenpairs',
    latex:
      '\\det(\\textcolor{#22D3EE}{A} - \\textcolor{#F59E0B}{\\lambda} I) = \\textcolor{#34D399}{0}, \\quad (\\textcolor{#22D3EE}{A} - \\textcolor{#F59E0B}{\\lambda} I)\\mathbf{v} = \\mathbf{0}',
  },
  {
    name: 'Trace & Det Shortcuts',
    tag: '2×2 Invariants',
    latex:
      '\\textcolor{#22D3EE}{\\operatorname{tr}(A)} = \\textcolor{#34D399}{\\lambda_1 + \\lambda_2}, \\quad \\textcolor{#F59E0B}{\\det(A)} = \\textcolor{#34D399}{\\lambda_1\\lambda_2}',
  },
  {
    name: 'Diagonalization',
    tag: 'Matrix Powers',
    latex:
      'A = \\textcolor{#22D3EE}{P}\\,\\textcolor{#F59E0B}{D}\\,\\textcolor{#22D3EE}{P^{-1}} \\implies A^k = \\textcolor{#34D399}{P\\,D^k\\,P^{-1}}',
  },
  {
    name: 'Least Squares',
    tag: 'Normal Eq',
    latex:
      '\\textcolor{#22D3EE}{A^T A}\\,\\textcolor{#34D399}{\\hat{\\mathbf{x}}} = \\textcolor{#F59E0B}{A^T\\mathbf{b}} \\quad (\\mathbf{e} \\perp \\operatorname{Col} A)',
  },
  {
    name: 'SVD & SPD Spectral',
    tag: 'σᵢ & QΛQᵀ',
    latex:
      '\\textcolor{#34D399}{\\sigma_i} = \\sqrt{\\lambda_i(\\textcolor{#22D3EE}{A^T A})}, \\;\; \\kappa = \\tfrac{\\sigma_1}{\\sigma_n}, \\;\; A = \\textcolor{#34D399}{Q\\Lambda Q^T}',
  },
];

const PID_CHEAT_SHEET_RULES = [
  {
    name: 'Closed-Loop TF',
    tag: 'Unity Feedback',
    latex:
      'T(s) = \\frac{\\textcolor{#22D3EE}{L(s)}}{1 + \\textcolor{#22D3EE}{L(s)}}, \\qquad S(s) = \\frac{E(s)}{R(s)} = \\textcolor{#34D399}{\\frac{1}{1 + \\textcolor{#22D3EE}{L(s)}}}',
  },
  {
    name: 'Parallel PID Form',
    tag: 'P + I + D',
    latex:
      'C(s) = \\textcolor{#22D3EE}{K_p} + \\frac{\\textcolor{#F59E0B}{K_i}}{s} + \\textcolor{#34D399}{K_d}\\,s = \\frac{\\textcolor{#34D399}{K_d}s^2 + \\textcolor{#22D3EE}{K_p}s + \\textcolor{#F59E0B}{K_i}}{s}',
  },
  {
    name: 'Final Value Theorem',
    tag: 'LHP Poles Only',
    latex:
      'e_{ss} = \\lim_{s\\to 0} s\\,E(s), \\;\; e_{\\text{step}} = \\textcolor{#34D399}{\\frac{1}{1+K_p^{\\text{pos}}}}, \\;\; e_{\\text{ramp}} = \\textcolor{#34D399}{\\frac{1}{K_v}}',
  },
  {
    name: '2nd-Order Specs',
    tag: 'ωn, ζ, ωd, Ts',
    latex:
      's^2 + 2\\textcolor{#F59E0B}{\\zeta}\\textcolor{#22D3EE}{\\omega_n}s + \\textcolor{#22D3EE}{\\omega_n}^2, \\;\; \\omega_d = \\textcolor{#34D399}{\\omega_n\\sqrt{1-\\zeta^2}}, \\;\; T_s \\approx \\textcolor{#34D399}{\\frac{4}{\\zeta\\omega_n}}',
  },
  {
    name: 'Routh-Hurwitz 3rd-Order',
    tag: 'All LHP Roots',
    latex:
      's^3 + \\textcolor{#22D3EE}{a_2}s^2 + \\textcolor{#22D3EE}{a_1}s + \\textcolor{#F59E0B}{a_0} = 0 \\iff a_i > 0,\\; \\textcolor{#34D399}{a_2 a_1 > a_0}',
  },
  {
    name: 'Ziegler-Nichols PID',
    tag: 'Ku & Tu Tuning',
    latex:
      '\\textcolor{#34D399}{K_p = 0.6K_u}, \\quad \\textcolor{#22D3EE}{T_i = 0.5T_u}, \\quad \\textcolor{#F59E0B}{T_d = 0.125T_u}',
  },
  {
    name: 'Phase & Delay Margin',
    tag: 'Bode Robustness',
    latex:
      '\\textcolor{#34D399}{\\text{PM}} = 180^\\circ + \\angle L(j\\textcolor{#22D3EE}{\\omega_{gc}}), \\qquad \\textcolor{#F59E0B}{\\tau_{\\max}} = \\frac{\\text{PM}_{\\text{rad}}}{\\textcolor{#22D3EE}{\\omega_{gc}}}',
  },
];

const MODELING_CHEAT_SHEET_RULES = [
  {
    name: 'Mass-Spring-Damper',
    tag: 'Newton 2nd Law',
    latex:
      '\\textcolor{#22D3EE}{m}\\ddot{x}+\\textcolor{#F59E0B}{c}\\dot{x}+\\textcolor{#22D3EE}{k}x=f \\implies G(s)=\\textcolor{#34D399}{\\frac{1}{ms^2+cs+k}}',
  },
  {
    name: 'Rotational & Analogies',
    tag: 'Cross-Domain',
    latex:
      'J\\ddot{\\theta}+b\\dot{\\theta}+k_\\theta\\theta=\\tau, \\qquad \\textcolor{#22D3EE}{L\\leftrightarrow m},\\; \\textcolor{#F59E0B}{R\\leftrightarrow c},\\; \\textcolor{#34D399}{\\tfrac{1}{C}\\leftrightarrow k}',
  },
  {
    name: 'Canonical 2nd-Order',
    tag: 'ωn, ζ, σ, ωd',
    latex:
      's^2 + 2\\textcolor{#F59E0B}{\\zeta}\\textcolor{#22D3EE}{\\omega_n}s + \\textcolor{#22D3EE}{\\omega_n}^2, \\quad s = -\\sigma \\pm j\\textcolor{#34D399}{\\omega_n\\sqrt{1-\\zeta^2}}',
  },
  {
    name: 'Damping Regimes',
    tag: 'ζ Classification',
    latex:
      '\\textcolor{#22D3EE}{\\zeta<1}:\\text{complex}, \\;\; \\textcolor{#34D399}{\\zeta=1}:\\text{repeated } t e^{-\\sigma t}, \\;\; \\textcolor{#F59E0B}{\\zeta>1}:\\text{real } p_1,p_2',
  },
  {
    name: 'Series vs Parallel RLC',
    tag: 'Critical Damping',
    latex:
      '\\textcolor{#34D399}{R_{\\text{crit}}^{\\text{ser}} = 2\\sqrt{\\tfrac{L}{C}}}, \\qquad \\textcolor{#F59E0B}{\\sigma_{\\parallel} = \\frac{1}{2RC}} \\;\\;(\\text{smaller }R\\uparrow\\zeta)',
  },
  {
    name: 'DC Motor Back-EMF',
    tag: 'Type-1 Plant',
    latex:
      'b_{\\text{eff}} = b + \\textcolor{#F59E0B}{\\frac{K_t K_e}{R_a}}, \\qquad \\frac{\\Theta(s)}{V_a(s)} = \\textcolor{#34D399}{\\frac{K_m}{s(s + p_m)}}',
  },
  {
    name: 's-Plane Spec Region',
    tag: 'Ts & %OS Bounds',
    latex:
      '\\textcolor{#34D399}{\\sigma \\ge \\frac{4}{T_s}}, \\qquad \\textcolor{#F59E0B}{\\theta = \\arccos(\\zeta)}, \\qquad T(s) = \\frac{\\textcolor{#22D3EE}{L}}{1+\\textcolor{#22D3EE}{L}}',
  },
];

const FREQ_CHEAT_SHEET_RULES = [
  {
    name: 'Root Locus Geometry',
    tag: 'Odd Rule & φk',
    latex:
      '\\text{Real axis: odd count right}, \\qquad \\textcolor{#34D399}{\\phi_k = \\frac{(2k+1)180^\\circ}{n - m}}',
  },
  {
    name: 'Centroid & Breakaway',
    tag: 'σa & dK/ds = 0',
    latex:
      '\\textcolor{#22D3EE}{\\sigma_a = \\frac{\\sum p_i - \\sum z_j}{n - m}}, \\qquad \\textcolor{#F59E0B}{\\frac{dK}{ds} = 0}',
  },
  {
    name: 'Angle & Magnitude',
    tag: 'Exact Placement',
    latex:
      '\\angle\\textcolor{#22D3EE}{L(s_d)} = -180^\\circ, \\qquad \\textcolor{#34D399}{K = \\frac{\\prod|s_d - p_i|}{\\prod|s_d - z_j|}}',
  },
  {
    name: 'Resonance Peak Mr',
    tag: 'ζ < 0.707',
    latex:
      '\\textcolor{#22D3EE}{\\omega_r = \\omega_n\\sqrt{1-2\\zeta^2}}, \\qquad \\textcolor{#F59E0B}{M_r = \\frac{1}{2\\zeta\\sqrt{1-\\zeta^2}}}',
  },
  {
    name: 'GM, PM & Delay',
    tag: 'Bode Margins',
    latex:
      '\\textcolor{#34D399}{\\text{GM}=\\tfrac{1}{|L(j\\omega_{pc})|}},\\; \\textcolor{#34D399}{\\text{PM}=180^\\circ+\\angle L(j\\omega_{gc})},\\; \\textcolor{#F59E0B}{\\tau_{\\max}=\\tfrac{\\text{PM}_{\\text{rad}}}{\\omega_{gc}}}',
  },
  {
    name: 'Lead & Lag Design',
    tag: 'Compensators',
    latex:
      '\\textcolor{#34D399}{\\alpha = \\frac{1+\\sin\\phi_m}{1-\\sin\\phi_m}},\\; \\omega_m=\\frac{1}{T\\sqrt{\\alpha}},\\; \\textcolor{#F59E0B}{z_{\\text{lag}}\\approx 0.1\\omega_{gc}}',
  },
  {
    name: 'Sensitivity & Nyquist',
    tag: 'Robustness',
    latex:
      '\\textcolor{#22D3EE}{S} + \\textcolor{#34D399}{T} = 1, \\quad d_{\\min} = \\textcolor{#F59E0B}{\\frac{1}{M_s}}, \\quad \\textcolor{#34D399}{Z = N + P}',
  },
];

const STATESPACE_CHEAT_SHEET_RULES = [
  {
    name: 'State-Space (A,B,C,D)',
    tag: 'Modeling',
    latex:
      '\\dot{x}=\\textcolor{#22D3EE}{A}x+\\textcolor{#F59E0B}{B}u,\\; y=\\textcolor{#34D399}{C}x+Du',
  },
  {
    name: 'Controllability & PBH',
    tag: 'Structure',
    latex:
      '\\mathcal{C}=[B\\; AB\\; \\dots\\; A^{n-1}B],\\;\\; \\operatorname{rank}[A-\\lambda I\\;\\; B]=n',
  },
  {
    name: 'LQR & Riccati (CARE)',
    tag: 'Optimal',
    latex:
      'A^TP+PA-PBR^{-1}B^TP+Q=0,\\;\\; \\textcolor{#34D399}{K=R^{-1}B^TP}',
  },
  {
    name: 'Receding-Horizon MPC',
    tag: 'Constrained',
    latex:
      '\\min_U \\tfrac{1}{2}U^THU+f^TU\\;\\text{ s.t. }\\; GU\\le w\\;(\\text{apply }\\textcolor{#34D399}{u_0^*})',
  },
  {
    name: 'CBF-QP Safety Filter',
    tag: 'Safety SOTA',
    latex:
      '\\dot{h}(x,u)+\\alpha h(x)\\ge 0 \\;\\implies\\; \\textcolor{#34D399}{x(t)\\in\\mathcal{C}\\;\\forall t}',
  },
  {
    name: 'Luenberger Observer',
    tag: 'Observer',
    latex:
      '\\dot{\\hat{x}}=A\\hat{x}+Bu+\\textcolor{#F59E0B}{L}(y-C\\hat{x}),\\;\\; \\dot{e}=(A-LC)e',
  },
  {
    name: 'Kalman Filter (Joseph)',
    tag: 'Bayesian',
    latex:
      'K_k=P^-H^T(HP^-H^T+R)^{-1},\\;\\; P_k=(I-K_kH)P^-(I-K_kH)^T+K_kRK_k^T',
  },
  {
    name: 'UKF, InEKF & MHE',
    tag: 'Modern SOTA',
    latex:
      '\\mathcal{X}_i=\\hat{x}\\pm\\sqrt{(n+\\lambda)P},\\;\\; \\dot{\\xi}=A_t\\xi,\\;\\; \\min\\sum\\|r\\|_{\\Sigma^{-1}}^2',
  },
];

const KINEMATICS_CHEAT_SHEET_RULES = [
  {
    name: 'Standard DH Transform',
    tag: 'Classical DH',
    latex:
      'T_i^{i-1} = \\operatorname{Rot}_z(\\theta_i)\\operatorname{Trans}_z(d_i)\\operatorname{Trans}_x(a_i)\\operatorname{Rot}_x(\\alpha_i)',
  },
  {
    name: 'Modified DH (Craig)',
    tag: 'Proximal MDH',
    latex:
      'T_i^{i-1} = \\operatorname{Rot}_x(\\alpha_{i-1})\\operatorname{Trans}_x(a_{i-1})\\operatorname{Rot}_z(\\theta_i)\\operatorname{Trans}_z(d_i)',
  },
  {
    name: 'Product of Exponentials',
    tag: 'SOTA SE(3)',
    latex:
      'T(\\theta) = e^{[\\mathcal{S}_1]\\theta_1}\\cdots e^{[\\mathcal{S}_n]\\theta_n}\\,M, \\quad v_i = -\\omega_i \\times q_i',
  },
  {
    name: 'Rodrigues & Adjoint',
    tag: 'Lie Group',
    latex:
      'e^{[\\omega]\\theta}=I+s_\\theta[\\omega]+(1-c_\\theta)[\\omega]^2, \\quad \\operatorname{Ad}_T=\\begin{bmatrix}R&0\\\\{}[p]R&R\\end{bmatrix}',
  },
  {
    name: 'Jacobian & Force Duality',
    tag: 'Differential',
    latex:
      '\\mathcal{V}_s = \\textcolor{#22D3EE}{J_s(\\theta)}\\dot{\\theta}, \\quad \\textcolor{#F59E0B}{\\tau} = J^T(\\theta)\\mathcal{F}, \\quad w=\\sqrt{\\det(JJ^T)}',
  },
  {
    name: 'Pieper 6-DOF Decoupling',
    tag: 'Analytical IK',
    latex:
      'p_{wc} = p_e - d_6 R_e \\hat{z}, \\quad R_6^3 = (R_3^0)^T R_e \\;(\\le 8\\text{ sols})',
  },
  {
    name: 'DLS & Nullspace IK',
    tag: 'Singularity-Safe',
    latex:
      '\\dot{q} = J^T(JJ^T+\\lambda^2 I)^{-1}v + (I - J^+ J)\\dot{q}_0',
  },
  {
    name: 'Differential QP-IK',
    tag: 'Pink / Mink SOTA',
    latex:
      '\\min_{\\dot{q}}\\sum w_i\\|J_i\\dot{q}-v_i^*\\|^2+\\lambda\\|\\dot{q}\\|^2 \\;\\text{s.t. }\\; q_{\\min}\\le q+\\dot{q}\\Delta t\\le q_{\\max}',
  },
];

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatNum(val, decimals = 4) {
  if (!Number.isFinite(val)) return '—';
  const rounded = Math.abs(val) < 5e-6 ? 0 : val;
  if (Math.abs(rounded) >= 10000) {
    return rounded.toExponential(3);
  }
  return rounded.toFixed(decimals);
}

function formatAxisTick(val) {
  if (!Number.isFinite(val)) return '';
  if (Math.abs(val) < 1e-6) return '0';
  if (Math.abs(val) >= 10000) return `${(val / 1000).toFixed(0)}k`;
  if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}k`;
  if (Math.abs(val) >= 100) return val.toFixed(0);
  if (Math.abs(val) >= 10) return val.toFixed(1);
  return val.toFixed(2).replace(/\.?0+$/, '');
}

function centralDiff(fn, x, h = 1e-5) {
  return (fn(x + h) - fn(x - h)) / (2 * h);
}

function numericalLaplace(fn, s) {
  if (!Number.isFinite(s) || s <= 0) return NaN;
  const upper = Math.max(24, Math.min(120, 22 / Math.max(s, 0.15)));
  let n = Math.max(600, Math.min(6000, Math.ceil(upper * 36) * 2));
  if (n % 2 !== 0) n += 1;
  const h = upper / n;
  let sum = fn(0) + Math.exp(-s * upper) * fn(upper);
  for (let i = 1; i < n; i++) {
    const t = i * h;
    const w = i % 2 === 0 ? 2 : 4;
    sum += w * Math.exp(-s * t) * fn(t);
  }
  return (h / 3) * sum;
}

function solveMonicCubicRoots(a2, a1, a0) {
  // Solve s^3 + a2*s^2 + a1*s + a0 = 0 for a0 > 0 via guaranteed negative real root bisection + deflation
  const evalPoly = (s) => ((s + a2) * s + a1) * s + a0;
  let lo = -Math.max(Math.abs(a2) + 2, Math.cbrt(Math.abs(a0) + 1) + Math.abs(a2) + 2);
  let hi = 0;
  while (evalPoly(lo) > 0 && lo > -1e6) lo *= 2;
  for (let i = 0; i < 52; i++) {
    const mid = 0.5 * (lo + hi);
    if (evalPoly(mid) > 0) hi = mid;
    else lo = mid;
  }
  const r1 = 0.5 * (lo + hi);
  const b = a2 + r1;
  const c = a1 + b * r1;
  const disc = b * b - 4 * c;
  if (disc >= 0) {
    const sq = Math.sqrt(disc);
    return [
      { re: r1, im: 0 },
      { re: 0.5 * (-b + sq), im: 0 },
      { re: 0.5 * (-b - sq), im: 0 },
    ];
  }
  const im = 0.5 * Math.sqrt(-disc);
  return [
    { re: r1, im: 0 },
    { re: -0.5 * b, im },
    { re: -0.5 * b, im: -im },
  ];
}

export class PaperlessStepSolver {
  /**
   * Supports both calling conventions:
   *  - new PaperlessStepSolver({ mode, problems, tiers, mechatronicsLens, onProblemSolved }) + solver.mount(el)
   *  - new PaperlessStepSolver(containerEl, { mode, problems, tiers, mechatronicsLens, onProblemSolved })
   */
  constructor(containerOrOptions = {}, maybeOptions = {}) {
    const isElement =
      containerOrOptions &&
      typeof containerOrOptions === 'object' &&
      typeof containerOrOptions.appendChild === 'function';

    const options = isElement ? maybeOptions || {} : containerOrOptions || {};

    const modeOpt = options.mode ?? options.curriculum;
    this.mode =
      modeOpt === 'integrals'
        ? 'integrals'
        : modeOpt === 'diffeq'
          ? 'diffeq'
          : modeOpt === 'linalg'
            ? 'linalg'
            : modeOpt === 'pid'
              ? 'pid'
              : modeOpt === 'modeling'
                ? 'modeling'
                : modeOpt === 'freq'
                  ? 'freq'
                  : modeOpt === 'statespace'
                    ? 'statespace'
                    : modeOpt === 'kinematics'
                      ? 'kinematics'
                      : 'derivatives';
    this.problems =
      Array.isArray(options.problems) && options.problems.length
        ? options.problems
        : this.mode === 'integrals'
          ? INTEGRAL_PROBLEMS
          : this.mode === 'diffeq'
            ? DIFFEQ_PROBLEMS
            : this.mode === 'linalg'
              ? LINALG_PROBLEMS
              : this.mode === 'pid'
                ? PID_PROBLEMS
                : this.mode === 'modeling'
                  ? MODELING_PROBLEMS
                  : this.mode === 'freq'
                    ? FREQ_PROBLEMS
                    : this.mode === 'statespace'
                      ? STATESPACE_PROBLEMS
                      : this.mode === 'kinematics'
                        ? KINEMATICS_PROBLEMS
                        : DERIVATIVE_PROBLEMS;
    this.tiers =
      Array.isArray(options.tiers) && options.tiers.length
        ? options.tiers
        : this.mode === 'integrals'
          ? INTEGRAL_SOLVER_TIERS
          : this.mode === 'diffeq'
            ? DIFFEQ_SOLVER_TIERS
            : this.mode === 'linalg'
              ? LINALG_SOLVER_TIERS
              : this.mode === 'pid'
                ? PID_SOLVER_TIERS
                : this.mode === 'modeling'
                  ? MODELING_SOLVER_TIERS
                  : this.mode === 'freq'
                    ? FREQ_SOLVER_TIERS
                    : this.mode === 'statespace'
                      ? STATESPACE_SOLVER_TIERS
                      : this.mode === 'kinematics'
                        ? KINEMATICS_SOLVER_TIERS
                        : SOLVER_TIERS;
    this.cheatSheetRules =
      this.mode === 'integrals'
        ? INTEGRAL_CHEAT_SHEET_RULES
        : this.mode === 'diffeq'
          ? DIFFEQ_CHEAT_SHEET_RULES
          : this.mode === 'linalg'
            ? LINALG_CHEAT_SHEET_RULES
            : this.mode === 'pid'
              ? PID_CHEAT_SHEET_RULES
              : this.mode === 'modeling'
                ? MODELING_CHEAT_SHEET_RULES
                : this.mode === 'freq'
                  ? FREQ_CHEAT_SHEET_RULES
                  : this.mode === 'statespace'
                    ? STATESPACE_CHEAT_SHEET_RULES
                    : this.mode === 'kinematics'
                      ? KINEMATICS_CHEAT_SHEET_RULES
                      : CHEAT_SHEET_RULES;

    this.mechatronicsLens = Boolean(
      options.mechatronicsLens ?? options.lens === 'mechatronics'
    );
    this.onProblemSolved =
      typeof options.onProblemSolved === 'function' ? options.onProblemSolved : null;
    this.onSolve = typeof options.onSolve === 'function' ? options.onSolve : null;
    this.onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;

    this.container = null;
    this.activeTier = 'all';
    this.activeProblemId = this.problems[0]?.id ?? null;

    // Step progression state for the currently active problem
    this.currentStepIndex = 0;
    this.completedSteps = []; // Array of step objects locked into the ledger
    this.wrongOptionIds = new Set();
    this.activeMisconception = null;
    this._lastSystemImpact = null;
    this._expandedLedgerImpacts = new Set();
    this.hintVisible = false;
    this.cheatSheetOpen = false;
    this.diagramExpanded = true;
    this.mobilePickerOpen = false;
    this.isProblemCompleted = false;
    this.isAdvancing = false;
    this.newlyLockedIndex = -1;

    // Verification canvas state
    this.verifyCanvas = null;
    this.verifyCursorX = null;
    this.isDraggingVerify = false;
    this.verifyPlotGeom = null;

    // Lifecycle handles
    this._advanceTimer = null;
    this._resizeObserver = null;
    this._unsubscribeStore = null;
    this._boundKeyDown = this._handleKeyDown.bind(this);
    this._boundCanvasPointerDown = this._handleCanvasPointerDown.bind(this);
    this._boundCanvasPointerMove = this._handleCanvasPointerMove.bind(this);
    this._boundCanvasPointerUp = this._handleCanvasPointerUp.bind(this);
    this._boundCanvasPointerLeave = this._handleCanvasPointerLeave.bind(this);

    if (isElement) {
      this.mount(containerOrOptions);
    }
  }

  /* ========================================================================
     Public API
     ======================================================================== */

  mount(container) {
    if (!container) return this;
    this.dispose();

    this.container = container;
    this.container.classList.add('eigenlab-step-solver');

    // Sync initial solved state from persistent store
    this._unsubscribeStore = store.subscribe(() => {
      if (this.container && this.container.isConnected) {
        this._updateSolvedBadges();
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this._boundKeyDown);
    }

    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => {
        if (this.isProblemCompleted && this.verifyCanvas) {
          this._drawVerificationCanvas();
        }
      });
      this._resizeObserver.observe(this.container);
    }

    this._render();
    return this;
  }

  setMechatronicsLens(bool) {
    const next = Boolean(bool);
    if (this.mechatronicsLens === next) return;
    this.mechatronicsLens = next;
    this._updateMechatronicsPill();
  }

  setLens(lens) {
    this.setMechatronicsLens(lens === 'mechatronics' || lens === true);
  }

  selectProblem(problemId) {
    const target = this.problems.find((p) => p.id === problemId);
    if (!target) return;

    if (this.activeTier !== 'all' && target.tier !== this.activeTier) {
      this.activeTier = 'all';
    }

    this.activeProblemId = target.id;
    this._resetActiveProblemState();
    this._render();
  }

  dispose() {
    if (this._advanceTimer) {
      clearTimeout(this._advanceTimer);
      this._advanceTimer = null;
    }
    this._detachCanvasListeners();

    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this._boundKeyDown);
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._unsubscribeStore) {
      this._unsubscribeStore();
      this._unsubscribeStore = null;
    }

    this.verifyCanvas = null;
    this.container = null;
  }

  /* ========================================================================
     Internal Data Helpers
     ======================================================================== */

  _isIntegralMode() {
    return this.mode === 'integrals';
  }

  _isDiffEqMode() {
    return this.mode === 'diffeq';
  }

  _isLinAlgMode() {
    return this.mode === 'linalg';
  }

  _isPidMode() {
    return this.mode === 'pid';
  }

  _isModelingMode() {
    return this.mode === 'modeling';
  }

  _isFreqMode() {
    return this.mode === 'freq';
  }

  _isStateSpaceMode() {
    return this.mode === 'statespace';
  }

  _isKinematicsMode() {
    return this.mode === 'kinematics';
  }

  _isControlPlotMode() {
    return (
      this.mode === 'pid' ||
      this.mode === 'modeling' ||
      this.mode === 'freq' ||
      this.mode === 'statespace' ||
      this.mode === 'kinematics'
    );
  }

  _isLaplaceForward(problem) {
    return this._isDiffEqMode() && problem?.verifyKind === 'laplace-forward';
  }

  _isLaplaceInverse(problem) {
    return this._isDiffEqMode() && problem?.verifyKind === 'laplace-inverse';
  }

  _getDefaultVerifyCursorX(problem) {
    if (this._isControlPlotMode()) {
      const def = problem?.verifyPlot?.defaultCursor;
      return Number.isFinite(def) ? def : 0.56;
    }
    if (this._isLinAlgMode() || !Array.isArray(problem?.domain)) {
      return 1;
    }
    const [xMin, xMax] = problem.domain;
    const margin = (xMax - xMin) * 0.015;
    if (this._isIntegralMode() && Array.isArray(problem.definiteBounds)) {
      const upper = problem.definiteBounds[1];
      if (Number.isFinite(upper)) {
        return Math.max(xMin + margin, Math.min(xMax - margin, upper));
      }
    }
    return xMin + (xMax - xMin) * 0.56;
  }

  _getSolvedSet() {
    const st = store?.getState?.();
    const list = Array.isArray(st?.solvedProblems) ? st.solvedProblems : [];
    return new Set(list);
  }

  _getFilteredProblems() {
    if (this.activeTier === 'all') return this.problems;
    return this.problems.filter((p) => p.tier === this.activeTier);
  }

  _getActiveProblem() {
    return (
      this.problems.find((p) => p.id === this.activeProblemId) ||
      this.problems[0]
    );
  }

  _resetActiveProblemState() {
    if (this._advanceTimer) {
      clearTimeout(this._advanceTimer);
      this._advanceTimer = null;
    }
    this.currentStepIndex = 0;
    this.completedSteps = [];
    this.wrongOptionIds = new Set();
    this.activeMisconception = null;
    this._lastSystemImpact = null;
    this._expandedLedgerImpacts = new Set();
    this.hintVisible = false;
    this.diagramExpanded = true;
    this.isProblemCompleted = false;
    this.isAdvancing = false;
    this.newlyLockedIndex = -1;
    this.verifyCursorX = null;
    this.isDraggingVerify = false;
  }

  _setTier(tierId) {
    if (this.activeTier === tierId) return;
    sound?.playTick?.();
    this.activeTier = tierId;
    const filtered = this._getFilteredProblems();
    if (filtered.length && !filtered.some((p) => p.id === this.activeProblemId)) {
      this.activeProblemId = filtered[0].id;
      this._resetActiveProblemState();
    }
    this._render();
  }

  _navigateRelative(delta) {
    const list = this._getFilteredProblems();
    if (!list.length) return;
    const idx = list.findIndex((p) => p.id === this.activeProblemId);
    const nextIdx = (idx + delta + list.length) % list.length;
    sound?.playTick?.();
    this.activeProblemId = list[nextIdx].id;
    this._resetActiveProblemState();
    this._render();
  }

  _toggleCheatSheet() {
    sound?.playTick?.();
    this.cheatSheetOpen = !this.cheatSheetOpen;
    const drawer = this.container?.querySelector('[data-cheat-drawer]');
    const btns = this.container?.querySelectorAll('[data-cheat-toggle], [data-cheat-toggle-mobile]') || [];
    if (drawer && btns.length) {
      drawer.classList.toggle('hidden', !this.cheatSheetOpen);
      btns.forEach((btn) => {
        btn.setAttribute('aria-expanded', String(this.cheatSheetOpen));
        btn.classList.toggle('border-cyanGlow/50', this.cheatSheetOpen);
        btn.classList.toggle('bg-cyanGlow/15', this.cheatSheetOpen);
        btn.classList.toggle('text-cyan-200', this.cheatSheetOpen);
      });
    } else {
      this._render();
    }
  }

  _toggleMobilePicker() {
    sound?.playTick?.();
    this.mobilePickerOpen = !this.mobilePickerOpen;
    const drawer = this.container?.querySelector('[data-mobile-picker-drawer]');
    const btn = this.container?.querySelector('[data-mobile-picker-toggle]');
    if (drawer && btn) {
      drawer.classList.toggle('hidden', !this.mobilePickerOpen);
      drawer.classList.toggle('flex', this.mobilePickerOpen);
      btn.setAttribute('aria-expanded', String(this.mobilePickerOpen));
      btn.classList.toggle('border-cyanGlow/50', this.mobilePickerOpen);
      btn.classList.toggle('border-white/10', !this.mobilePickerOpen);
      const arrow = btn.querySelector('span:last-child span:last-child');
      if (arrow) arrow.textContent = this.mobilePickerOpen ? '▲' : '▼';
    } else {
      this._render();
    }
  }

  _toggleHint() {
    if (this.isProblemCompleted) return;
    sound?.playTick?.();
    this.hintVisible = !this.hintVisible;
    const box = this.container?.querySelector('[data-hint-box]');
    const btn = this.container?.querySelector('[data-hint-btn]');
    if (box && btn) {
      box.classList.toggle('hidden', !this.hintVisible);
      btn.setAttribute('aria-expanded', String(this.hintVisible));
    } else {
      this._render();
    }
  }

  /* ========================================================================
     Option Selection & Keyboard Handling
     ======================================================================== */

  _handleOptionSelect(optionId) {
    if (this.isProblemCompleted || this.isAdvancing) return;

    const problem = this._getActiveProblem();
    const step = problem?.steps?.[this.currentStepIndex];
    if (!step) return;

    const option = step.options.find((o) => o.id === optionId);
    if (!option) return;

    const tileEl = this.container?.querySelector(
      `[data-option-id="${CSS.escape(optionId)}"]`
    );

    if (option.correct) {
      this.isAdvancing = true;
      this.activeMisconception = null;
      store.recordAttempt(true);

      const isFinalStep = this.currentStepIndex >= problem.steps.length - 1;
      if (isFinalStep) {
        sound.playSuccess();
      } else {
        sound.playSnap();
      }

      // Tactile lock visual on all tiles before advancing
      const allTiles = this.container?.querySelectorAll('[data-option-id]') || [];
      allTiles.forEach((btn) => {
        btn.classList.add('is-locked');
        btn.setAttribute('disabled', 'true');
      });
      if (tileEl) {
        tileEl.classList.remove('is-wrong', 'shake-gentle');
        tileEl.classList.add('is-correct');
      }

      // Hide any previous misconception banner
      const feedbackEl = this.container?.querySelector('[data-misconception-banner]');
      if (feedbackEl) {
        feedbackEl.classList.add('hidden');
      }

      this._advanceTimer = setTimeout(() => {
        this._advanceTimer = null;
        this.completedSteps.push(step);
        this.newlyLockedIndex = this.completedSteps.length - 1;
        this._lastSystemImpact = step.systemImpact
          ? {
              stepNum: this.completedSteps.length,
              badge: step.badge,
              text: step.systemImpact,
            }
          : null;
        this.wrongOptionIds = new Set();
        this.hintVisible = false;
        this.isAdvancing = false;

        if (isFinalStep) {
          this.isProblemCompleted = true;
          this.currentStepIndex = problem.steps.length;
          this.verifyCursorX = this._getDefaultVerifyCursorX(problem);

          store.markProblemSolved(problem.id);
          const solvedSet = this._getSolvedSet();
          const solvedCount = this.problems.filter((p) => solvedSet.has(p.id)).length;
          const payload = {
            problemId: problem.id,
            problem,
            solvedCount,
            totalProblems: this.problems.length,
          };

          try {
            this.onProblemSolved?.(problem.id, payload);
            this.onSolve?.(problem.id, payload);
            this.onProgress?.(payload);
          } catch (err) {
            console.warn('[PaperlessStepSolver] callback error:', err);
          }
        } else {
          this.currentStepIndex += 1;
        }

        this._render();
      }, 300);
    } else {
      // Gentle error feedback + targeted misconception explanation
      sound.playGentleError();
      store.recordAttempt(false);
      this.wrongOptionIds.add(option.id);
      this.activeMisconception =
        option.misconception ||
        'Not quite—check the signs, exponents, and structure in the highlight strip above.';

      if (tileEl) {
        tileEl.classList.remove('shake-gentle');
        // Force reflow so rapid retries replay the gentle shake cleanly
        void tileEl.offsetWidth;
        tileEl.classList.add('is-wrong', 'shake-gentle');
      }

      const banner = this.container?.querySelector('[data-misconception-banner]');
      const bannerText = this.container?.querySelector('[data-misconception-text]');
      if (banner && bannerText) {
        bannerText.innerHTML = renderInlineMathText(this.activeMisconception);
        banner.classList.remove('hidden');
        banner.classList.remove('fade-in');
        void banner.offsetWidth;
        banner.classList.add('fade-in');
      } else {
        this._render();
      }
    }
  }

  _handleKeyDown(e) {
    if (!this.container || !this.container.isConnected) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const tag = e.target?.tagName?.toLowerCase();
    if (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      e.target?.isContentEditable
    ) {
      return;
    }

    if (e.key >= '1' && e.key <= '4') {
      if (this.isProblemCompleted || this.isAdvancing) return;
      const problem = this._getActiveProblem();
      const step = problem?.steps?.[this.currentStepIndex];
      const idx = Number(e.key) - 1;
      const opt = step?.options?.[idx];
      if (opt) {
        e.preventDefault();
        this._handleOptionSelect(opt.id);
      }
      return;
    }

    if (e.key === 'h' || e.key === 'H') {
      if (!this.isProblemCompleted) {
        e.preventDefault();
        this._toggleHint();
      }
      return;
    }

    if (e.key === 'Enter' && this.isProblemCompleted) {
      e.preventDefault();
      this._navigateRelative(1);
    }
  }

  /* ========================================================================
     DOM Rendering
     ======================================================================== */

  _render() {
    if (!this.container) return;
    this._detachCanvasListeners();

    const isIntegral = this._isIntegralMode();
    const isDiffEq = this._isDiffEqMode();
    const isLinAlg = this._isLinAlgMode();
    const isPid = this._isPidMode();
    const isModeling = this._isModelingMode();
    const isFreq = this._isFreqMode();
    const isStateSpace = this._isStateSpaceMode();
    const isKinematics = this._isKinematicsMode();
    const solvedSet = this._getSolvedSet();
    const totalSolved = this.problems.filter((p) => solvedSet.has(p.id)).length;
    const totalProblems = this.problems.length;
    const filteredProblems = this._getFilteredProblems();
    const problem = this._getActiveProblem();
    const globalIndex = this.problems.findIndex((p) => p.id === problem.id);
    const problemIsSolved = solvedSet.has(problem.id);

    const cheatTitle = isModeling
      ? 'Physical Modeling Reference'
      : isFreq
        ? 'Root Locus & Bode Reference'
        : isStateSpace
          ? 'Modern Controls Formula Sheet'
          : isKinematics
            ? 'Robot Kinematics Formula Sheet'
            : isPid
              ? 'Control & PID Reference'
              : isLinAlg
                ? 'Linear Algebra Reference'
                : isDiffEq
                  ? 'ODE & Laplace Reference'
                  : isIntegral
                    ? 'Integration Formula Reference'
                    : 'Differentiation Formula Reference';
    const targetHeaderLabel = isModeling
      ? 'MODEL & DESIGN s-PLANE'
      : isFreq
        ? 'ROOT LOCUS & BODE DESIGN'
        : isStateSpace
          ? 'MODERN STATE-SPACE & ESTIMATION'
          : isKinematics
            ? 'ROBOT KINEMATICS & MODERN IK'
            : isPid
              ? 'SOLVE CONTROL & PID'
              : isLinAlg
                ? 'Solve Linear Algebra'
                : isDiffEq
                  ? 'Solve the ODE / Laplace'
                  : isIntegral
                    ? 'Evaluate the Integral'
                    : 'Differentiate w.r.t. x';
    const legendCyan = isModeling
      ? 'Cyan: Plant Physics / G(s)'
      : isFreq
        ? 'Cyan: Open-Loop L(s) / ω'
        : isStateSpace
          ? 'Cyan: State Matrix A / x / P'
          : isKinematics
            ? 'Cyan: Screw Sᵢ / Jacobian J / T'
            : isPid
              ? 'Cyan: Plant G(s) / Loop L(s)'
              : isLinAlg
                ? 'Cyan: Primary / A / u'
                : isDiffEq
                  ? 'Cyan: y / P(t) / f(t)'
                  : isIntegral
                    ? 'Cyan: u / Factor A'
                    : 'Cyan: Outer / u';
    const legendAmber = isModeling
      ? 'Amber: Damping / Gain / Spec'
      : isFreq
        ? 'Amber: Gain K / Target φm / −1'
        : isStateSpace
          ? 'Amber: Input B / Gain L / R'
          : isKinematics
            ? 'Amber: Joint θᵢ / Target / λ'
            : isPid
              ? 'Amber: Gain / Spec / Delay'
              : isLinAlg
                ? 'Amber: Secondary / λ / b'
                : isDiffEq
                  ? 'Amber: t / Q(t) / IC'
                  : isIntegral
                    ? 'Amber: dv / Factor B'
                    : 'Amber: Inner / v';
    const legendEmerald = isModeling
      ? 'Emerald: Poles / CL T(s)'
      : isFreq
        ? 'Emerald: Compensator / Margin'
        : isStateSpace
          ? 'Emerald: Optimal K / MPC / Safe'
          : isKinematics
            ? 'Emerald: Pose / IK q̇* / Torque τ'
            : isPid
              ? 'Emerald: Closed-Loop / Margin'
              : isLinAlg
                ? 'Emerald: Result / Eigen / Fit'
                : isDiffEq
                  ? 'Emerald: Solution / F(s)'
                  : isIntegral
                    ? 'Emerald: Antideriv'
                    : 'Emerald: Deriv';

    const tierPillsHtml = this.tiers.map((tier) => {
      const list =
        tier.id === 'all'
          ? this.problems
          : this.problems.filter((p) => p.tier === tier.id);
      const tierSolved = list.filter((p) => solvedSet.has(p.id)).length;
      const isActive = this.activeTier === tier.id;
      const allDone = list.length > 0 && tierSolved === list.length;

      return `
        <button
          type="button"
          data-tier-id="${escapeHtml(tier.id)}"
          class="stage-pill ${isActive ? 'active' : ''} ${allDone && !isActive ? 'is-complete' : ''}"
          aria-pressed="${isActive}"
        >
          <span>${escapeHtml(tier.label)}</span>
          <span class="font-mono text-[11px] px-1.5 py-0.5 rounded-full ${
            isActive
              ? 'bg-cyanGlow/20 text-cyan-100'
              : allDone
                ? 'bg-emeraldGlow/20 text-emerald-300'
                : 'bg-white/[0.06] text-slate-400'
          }" data-tier-count="${escapeHtml(tier.id)}">${tierSolved}/${list.length}</span>
        </button>
      `;
    }).join('');

    const problemDotsHtml = filteredProblems
      .map((p) => {
        const num = this.problems.findIndex((item) => item.id === p.id) + 1;
        const active = p.id === problem.id;
        const solved = solvedSet.has(p.id);
        return `
          <button
            type="button"
            data-problem-id="${escapeHtml(p.id)}"
            title="Problem ${num}: ${escapeHtml(p.title)} (${escapeHtml(p.tierLabel)})"
            aria-label="Problem ${num}: ${escapeHtml(p.title)}${solved ? ' (Solved)' : ''}"
            aria-current="${active ? 'true' : 'false'}"
            class="inline-flex items-center justify-center gap-1 min-w-[2.1rem] h-8 px-2 rounded-lg font-mono text-xs font-semibold border transition-all cursor-pointer ${
              active
                ? 'bg-cyanGlow/20 border-cyanGlow/65 text-cyan-100 shadow-[0_0_14px_-4px_rgba(34,211,238,0.65)] scale-105'
                : solved
                  ? 'bg-emeraldGlow/15 border-emeraldGlow/40 text-emerald-300 hover:border-emeraldGlow/70'
                  : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-slate-100 hover:border-white/25'
            }"
          >
            <span>${num}</span>
            ${solved ? '<span class="text-emerald-300 text-[11px] leading-none">✓</span>' : ''}
          </button>
        `;
      })
      .join('');

    const cheatSheetCardsHtml = this.cheatSheetRules.map(
      (rule, i) => `
        <div class="rounded-xl p-3 bg-slate-950/75 border border-white/[0.08] flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2">
            <span class="font-display text-xs font-semibold text-slate-200">${escapeHtml(rule.name)}</span>
            <span class="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400">${escapeHtml(rule.tag)}</span>
          </div>
          <div class="overflow-x-auto py-1 text-sm text-slate-100" data-cheat-formula="${i}"></div>
        </div>
      `
    ).join('');

    const ledgerRowsHtml = this.completedSteps.length
      ? this.completedSteps
          .map((st, idx) => {
            const isFresh = idx === this.newlyLockedIndex;
            const hasImpact = Boolean(st.systemImpact);
            const isImpactOpen = hasImpact && this._expandedLedgerImpacts.has(idx);
            return `
              <div class="ledger-row ${isFresh ? 'snap-in' : ''} ${hasImpact ? '!flex-col !items-stretch !gap-1.5' : ''}">
                <div class="flex flex-wrap items-center justify-between gap-2 w-full">
                  <div class="flex items-center gap-2.5 shrink-0">
                    <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emeraldGlow/20 border border-emeraldGlow/45 text-emerald-300 font-mono text-xs font-semibold">
                      ${idx + 1}
                    </span>
                    <span class="chip-deriv">${escapeHtml(st.lockedLabel || st.badge)}</span>
                  </div>
                  <div class="flex items-center gap-2 min-w-0 max-w-full">
                    <div class="overflow-x-auto max-w-full py-0.5 text-slate-100" data-ledger-latex="${idx}"></div>
                    ${
                      hasImpact
                        ? `<button
                            type="button"
                            data-ledger-impact-toggle="${idx}"
                            aria-expanded="${isImpactOpen}"
                            title="${escapeHtml(st.systemImpact)}"
                            class="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-mono text-[10px] font-semibold border transition-colors cursor-pointer ${
                              isImpactOpen
                                ? 'bg-emeraldGlow/20 border-emeraldGlow/55 text-emerald-200'
                                : 'bg-emeraldGlow/[0.08] border-emeraldGlow/25 text-emerald-300/90 hover:border-emeraldGlow/55'
                            }"
                          >⚡<span class="hidden sm:inline">Impact</span></button>`
                        : ''
                    }
                  </div>
                </div>
                ${
                  hasImpact
                    ? `<div
                        data-ledger-impact-body="${idx}"
                        class="${isImpactOpen ? '' : 'hidden'} rounded-lg px-2.5 py-1.5 bg-emeraldGlow/[0.07] border border-emeraldGlow/25 text-[11px] sm:text-xs text-emerald-100/95 leading-snug"
                      >
                        <span class="font-mono font-semibold text-emerald-300 uppercase tracking-wider mr-1">⚡ Impact:</span>
                        ${renderInlineMathText(st.systemImpact)}
                      </div>`
                    : ''
                }
              </div>
            `;
          })
          .join('')
      : `
        <div class="rounded-xl px-4 py-3 border border-dashed border-white/10 bg-white/[0.015] flex items-center justify-between gap-3 text-xs text-slate-400">
          <span>Complete Step 1 below to lock your first milestone into the Working Step Ledger.</span>
          <span class="font-mono text-[11px] text-slate-500 shrink-0">0 / ${problem.steps.length} locked</span>
        </div>
      `;

    const activeAreaHtml = this.isProblemCompleted
      ? this._buildVerificationCardHtml(problem)
      : this._buildActiveStepHtml(problem);

    const diagramBlockHtml = problem.diagram
      ? `
        <div class="w-full mt-1 pt-2 border-t border-white/[0.08] flex flex-col gap-1.5 min-w-0" data-system-schematic>
          <div class="w-full flex items-center justify-between gap-2 min-w-0">
            <span class="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-cyan-200/90 truncate min-w-0">
              📐 System Schematic${problem.diagram.subtitle ? ` · ${escapeHtml(problem.diagram.subtitle)}` : ''}
            </span>
            <button
              type="button"
              data-diagram-toggle
              aria-expanded="${this.diagramExpanded}"
              class="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] sm:text-[11px] font-semibold bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-cyanGlow/40 text-slate-300 hover:text-cyan-200 transition-colors cursor-pointer"
            >
              ${this.diagramExpanded ? 'Hide ▴' : 'Show ▾'}
            </button>
          </div>
          ${
            this.diagramExpanded
              ? `<div class="w-full overflow-hidden bg-[#06090F]/90 border border-white/10 rounded-xl p-1.5 sm:p-2 flex items-center justify-center [&>svg]:max-h-[118px] sm:[&>svg]:max-h-[156px] [&>svg]:w-full [&>svg]:h-auto [&>svg]:block">
                  ${renderSystemSchematicSVG(problem.diagram, { activeStepIndex: this.currentStepIndex })}
                </div>`
              : ''
          }
        </div>
      `
      : '';

    this.container.innerHTML = `
      <div class="flex flex-col gap-2.5 sm:gap-5">
        <!-- TOP PROBLEM HEADER -->
        <div class="flex flex-col gap-2 sm:gap-3.5">
          <!-- Compact Mobile Problem Switcher Bar (md:hidden) -->
          <div class="flex md:hidden items-center justify-between gap-1.5">
            <button
              type="button"
              data-nav-prev-mobile
              class="btn-glass !py-1.5 !px-2.5 !text-xs shrink-0"
              aria-label="Previous problem"
            >
              ←
            </button>
            <button
              type="button"
              data-mobile-picker-toggle
              aria-expanded="${this.mobilePickerOpen}"
              class="flex-1 min-w-0 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 border ${
                this.mobilePickerOpen ? 'border-cyanGlow/50 text-cyan-100' : 'border-white/10 text-slate-100'
              } text-xs cursor-pointer"
            >
              <span class="flex items-center gap-1.5 min-w-0">
                <span class="font-mono font-semibold text-cyanGlow shrink-0">#${globalIndex + 1}/${totalProblems}</span>
                <span class="truncate font-medium">${escapeHtml(problem.title)}</span>
              </span>
              <span class="flex items-center gap-1.5 shrink-0">
                ${problemIsSolved ? '<span class="text-emeraldGlow text-[11px]">✓</span>' : ''}
                <span class="text-[10px] font-mono text-slate-400">${this.mobilePickerOpen ? '▲' : '▼'}</span>
              </span>
            </button>
            <button
              type="button"
              data-nav-next-mobile
              class="btn-glass !py-1.5 !px-2.5 !text-xs shrink-0"
              aria-label="Next problem"
            >
              →
            </button>
            <button
              type="button"
              data-cheat-toggle-mobile
              aria-expanded="${this.cheatSheetOpen}"
              title="Formula Cheat Sheet"
              class="btn-glass !py-1.5 !px-2.5 !text-xs shrink-0 ${
                this.cheatSheetOpen ? 'border-cyanGlow/50 bg-cyanGlow/15 text-cyan-200' : ''
              }"
            >
              📘
            </button>
          </div>

          <!-- Collapsible on Mobile / Always Visible on Desktop: Tier Filters + Problem Selector -->
          <div
            data-mobile-picker-drawer
            class="${this.mobilePickerOpen ? 'flex' : 'hidden'} md:flex flex-col gap-2.5 sm:gap-3.5 p-2.5 md:p-0 rounded-2xl md:rounded-none bg-slate-950/75 md:bg-transparent border border-white/10 md:border-0"
          >
            <!-- Tier Filters + Overall Progress -->
            <div class="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
              <div class="flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-[#0E121C]/85 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" role="tablist" aria-label="Mastery tier filter">
                ${tierPillsHtml}
              </div>
              <div class="flex items-center gap-2.5">
                <div
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emeraldGlow/10 border border-emeraldGlow/30 text-xs font-mono text-emerald-200"
                  data-overall-solved
                >
                  <span class="w-2 h-2 rounded-full bg-emeraldGlow shadow-[0_0_8px_#34D399]"></span>
                  <span>Solved <strong class="text-white">${totalSolved}</strong> / ${totalProblems}</span>
                </div>
                <button
                  type="button"
                  data-cheat-toggle
                  aria-expanded="${this.cheatSheetOpen}"
                  class="hidden md:inline-flex btn-glass text-xs py-1.5 px-3 ${
                    this.cheatSheetOpen
                      ? 'border-cyanGlow/50 bg-cyanGlow/15 text-cyan-200'
                      : ''
                  }"
                >
                  <span>📘</span>
                  <span>Formula Cheat Sheet</span>
                </button>
              </div>
            </div>

            <!-- Problem Navigation Row -->
            <div class="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pt-0.5">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  data-nav-prev
                  class="hidden md:inline-flex btn-glass text-xs py-1.5 px-3"
                  title="Previous problem"
                >
                  ← Prev
                </button>
                <div class="flex flex-wrap items-center gap-1.5" role="navigation" aria-label="Problem selector">
                  ${problemDotsHtml}
                </div>
                <button
                  type="button"
                  data-nav-next
                  class="hidden md:inline-flex btn-glass text-xs py-1.5 px-3"
                  title="Next problem"
                >
                  Next →
                </button>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <span class="chip-outer">${escapeHtml(problem.tierLabel)}</span>
                <span class="font-display text-sm sm:text-base font-semibold text-white">
                  ${globalIndex + 1}. ${escapeHtml(problem.title)}
                </span>
                ${
                  problemIsSolved
                    ? '<span class="status-live" data-problem-solved-badge>Mastered</span>'
                    : '<span class="status-planned" data-problem-solved-badge>In Progress</span>'
                }
              </div>
            </div>
          </div>

          <!-- Collapsible Formula Cheat Sheet Drawer -->
          <div
            data-cheat-drawer
            class="${this.cheatSheetOpen ? '' : 'hidden'} rounded-2xl p-3 sm:p-4 bg-slate-950/90 border border-cyanGlow/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            <div class="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div class="flex items-center gap-2">
                <span class="font-display text-xs sm:text-sm font-semibold text-cyan-200">${escapeHtml(cheatTitle)}</span>
              </div>
              <div class="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px]">
                <span class="chip-outer">${escapeHtml(legendCyan)}</span>
                <span class="chip-inner">${escapeHtml(legendAmber)}</span>
                <span class="chip-deriv">${escapeHtml(legendEmerald)}</span>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[260px] md:max-h-none overflow-y-auto studio-scroll">
              ${cheatSheetCardsHtml}
            </div>
          </div>

          <!-- Optional Mechatronics Context Pill -->
          <div
            data-mechatronics-pill
            class="${this.mechatronicsLens ? '' : 'hidden'} rounded-xl px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 bg-amberGlow/10 border border-amberGlow/35 text-[11px] sm:text-sm text-amber-100 flex items-start gap-2"
          >
            <span class="shrink-0 mt-0.5 text-amber-300 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-amberGlow/20 border border-amberGlow/40">
              ⚙ Mech
            </span>
            <span class="leading-snug sm:leading-relaxed" data-mechatronics-text>${renderInlineMathText(problem.mechatronicsContext)}</span>
          </div>

          <!-- Target Expression Card -->
          <div class="katex-card katex-hero flex-col gap-1 sm:gap-2">
            <div class="w-full flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <span class="truncate">${escapeHtml(targetHeaderLabel)}</span>
              <span class="text-cyan-300/90 shrink-0">${escapeHtml(problem.tierLabel)} • ${globalIndex + 1}/${totalProblems}</span>
            </div>
            <div class="w-full flex items-center justify-center py-0.5 sm:py-1 overflow-x-auto" data-target-expression></div>
            ${diagramBlockHtml}
          </div>
        </div>

        <!-- LIVE WORKING STEP LEDGER -->
        <div class="rounded-2xl p-2.5 sm:p-4 bg-slate-950/55 border border-white/[0.08] flex flex-col gap-1.5 sm:gap-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <span class="w-2 h-2 rounded-full bg-emeraldGlow"></span>
              <h3 class="font-display text-[11px] sm:text-sm font-semibold uppercase tracking-wider text-slate-200">
                Working Step Ledger
              </h3>
              <span class="text-xs text-slate-400 hidden sm:inline">• Locked milestones stay pinned — no paper needed</span>
            </div>
            <span class="font-mono text-[11px] sm:text-xs text-emerald-300">
              ${this.completedSteps.length} / ${problem.steps.length} locked
            </span>
          </div>
          <div data-ledger-scroll class="flex flex-col gap-1.5 sm:gap-2 max-h-[104px] sm:max-h-none overflow-y-auto studio-scroll">
            ${ledgerRowsHtml}
          </div>
        </div>

        <!-- ACTIVE MICRO-STEP OR VERIFICATION CARD -->
        ${activeAreaHtml}
      </div>
    `;

    // Render KaTeX equations cleanly after injecting structure
    this._hydrateKatex(problem);
    this._bindEvents();

    // Auto-scroll ledger to the newest locked milestone on compact mobile screens
    const ledgerScroll = this.container.querySelector('[data-ledger-scroll]');
    if (ledgerScroll && this.completedSteps.length > 0) {
      ledgerScroll.scrollTop = ledgerScroll.scrollHeight;
    }

    if (this.isProblemCompleted) {
      this._initVerificationCanvas();
    }

    // Reset fresh animation index so subsequent micro-updates don't re-animate old rows
    this.newlyLockedIndex = -1;
  }

  _buildSystemImpactBannerHtml() {
    const impact = this._lastSystemImpact;
    if (!impact || !impact.text) return '';
    return `
      <div
        data-system-impact-banner
        class="rounded-xl px-2.5 py-2 sm:px-3.5 sm:py-2.5 bg-emeraldGlow/[0.11] border border-emeraldGlow/35 text-[11px] sm:text-xs text-emerald-100 flex items-start justify-between gap-2 snap-in"
      >
        <div class="leading-snug min-w-0">
          <span class="font-mono font-semibold text-emerald-300 uppercase tracking-wider mr-1.5">⚡ System Impact${
            impact.badge ? ` (${escapeHtml(impact.badge)})` : ''
          }:</span>
          <span>${renderInlineMathText(impact.text)}</span>
        </div>
        <button
          type="button"
          data-dismiss-impact
          aria-label="Dismiss system impact takeaway"
          class="shrink-0 w-5 h-5 inline-flex items-center justify-center rounded-md text-emerald-300/75 hover:text-emerald-100 hover:bg-emeraldGlow/20 font-mono text-xs transition-colors cursor-pointer"
        >×</button>
      </div>
    `;
  }

  _buildActiveStepHtml(problem) {
    const step = problem.steps[this.currentStepIndex];
    if (!step) return '';

    const totalSteps = problem.steps.length;
    const stepNum = this.currentStepIndex + 1;
    const pct = Math.round(((stepNum - 1) / totalSteps) * 100);

    const segmentsHtml = problem.steps
      .map((_, i) => {
        const done = i < this.currentStepIndex;
        const active = i === this.currentStepIndex;
        return `
          <div class="h-1.5 flex-1 rounded-full transition-all ${
            done
              ? 'bg-emeraldGlow shadow-[0_0_8px_rgba(52,211,153,0.55)]'
              : active
                ? 'bg-cyanGlow shadow-[0_0_10px_rgba(34,211,238,0.65)]'
                : 'bg-white/10'
          }"></div>
        `;
      })
      .join('');

    const optionsHtml = step.options
      .map((opt, idx) => {
        const wasWrong = this.wrongOptionIds.has(opt.id);
        return `
          <button
            type="button"
            data-option-id="${escapeHtml(opt.id)}"
            class="math-tile ${wasWrong ? 'is-wrong' : ''}"
          >
            <span class="tile-key">${idx + 1}</span>
            <div class="flex-1 min-w-0 overflow-x-auto py-0.5 text-sm sm:text-base" data-option-latex="${escapeHtml(opt.id)}"></div>
          </button>
        `;
      })
      .join('');

    const systemImpactBannerHtml = this._buildSystemImpactBannerHtml();
    const whyThisStepHtml = step.whyThisStep
      ? `
          <div data-why-this-step class="rounded-xl px-2.5 py-1.5 bg-cyanGlow/[0.06] border border-cyanGlow/20 text-[11px] sm:text-xs text-slate-300 leading-snug">
            <span class="font-mono font-semibold text-cyanGlow uppercase tracking-wider mr-1.5">Why:</span>${renderInlineMathText(step.whyThisStep)}
          </div>
        `
      : '';

    return `
      <div class="rounded-2xl p-3 sm:p-5 bg-slate-900/75 border border-cyanGlow/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.09)] flex flex-col gap-2.5 sm:gap-4 view-enter">
        ${systemImpactBannerHtml}

        <!-- Step Progress Bar & Header -->
        <div class="flex flex-col gap-1.5 sm:gap-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
              <span class="shrink-0 font-mono text-[11px] sm:text-xs font-semibold text-cyan-300">Step ${stepNum}/${totalSteps}</span>
              <span class="chip-outer !whitespace-normal !leading-snug max-w-full">${escapeHtml(step.badge)}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="hidden sm:inline font-mono text-[11px] text-slate-500">Keys 1–4 select • H hint</span>
              <button
                type="button"
                data-hint-btn
                aria-expanded="${this.hintVisible}"
                class="btn-glass text-[11px] sm:text-xs py-1 px-2 sm:px-2.5 text-amber-200 border-amberGlow/30 hover:border-amberGlow/60"
              >
                <span>💡</span>
                <span>Hint</span>
              </button>
            </div>
          </div>

          <div class="flex items-center gap-1.5" aria-label="Step progress ${pct}%">
            ${segmentsHtml}
          </div>
        </div>

        <!-- Prompt & Color-Coded Focus Strip -->
        <div class="flex flex-col gap-1.5 sm:gap-2.5">
          ${whyThisStepHtml}
          <p class="text-xs sm:text-base text-slate-100 font-medium leading-snug sm:leading-relaxed m-0">
            ${renderInlineMathText(step.prompt)}
          </p>
          <div class="katex-card flex items-center justify-center py-2 px-3 sm:py-3 sm:px-4 border-cyanGlow/20 bg-slate-950/75">
            <div class="overflow-x-auto max-w-full text-sm sm:text-lg" data-step-highlight></div>
          </div>
        </div>

        <!-- Optional Hint Callout -->
        <div
          data-hint-box
          class="${this.hintVisible ? '' : 'hidden'} rounded-xl px-3 py-2 sm:px-4 sm:py-3 bg-amberGlow/10 border border-amberGlow/35 text-xs sm:text-sm text-amber-100 flex items-start gap-2"
        >
          <span class="text-amber-300 shrink-0 mt-0.5">💡</span>
          <div class="leading-snug sm:leading-relaxed">
            <strong class="font-display text-amber-200 mr-1">Hint:</strong>
            ${renderInlineMathText(step.hint)}
          </div>
        </div>

        <!-- Tactile KaTeX Choice Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3" role="group" aria-label="Step answer choices">
          ${optionsHtml}
        </div>

        <!-- Misconception Feedback Banner -->
        <div
          data-misconception-banner
          class="${this.activeMisconception ? '' : 'hidden'} rounded-xl px-3 py-2 sm:px-4 sm:py-3 bg-rose-500/15 border border-rose-400/40 text-xs sm:text-sm text-rose-100 flex items-start gap-2"
          role="alert"
        >
          <span class="shrink-0 mt-0.5 text-rose-300 font-bold">✕</span>
          <div class="leading-snug sm:leading-relaxed">
            <strong class="font-display text-rose-200 mr-1">Check that step:</strong>
            <span data-misconception-text>${this.activeMisconception ? renderInlineMathText(this.activeMisconception) : ''}</span>
          </div>
        </div>
      </div>
    `;
  }

  _getLinAlgVerifyMeta(problem) {
    const vp = problem?.verifyPlot || {};
    const kind = vp.kind || 'vectors';
    const dot = (cls, label, dashed = false) =>
      dashed
        ? `<span class="inline-flex items-center gap-1 ${cls}"><span class="w-3 h-0 border-t-2 border-dashed border-current inline-block"></span>${label}</span>`
        : `<span class="inline-flex items-center gap-1 ${cls}"><span class="w-2.5 h-0.5 rounded bg-current inline-block"></span>${label}</span>`;

    const presets = {
      vectors: {
        subtitle:
          'Geometric proof in $\\mathbb{R}^2$ verifying the dot product, lengths, and exact angle $\\theta$ between $\\mathbf{u}$ and $\\mathbf{v}$.',
        legendHtml:
          dot('text-cyan-300', 'u vector') +
          dot('text-amber-300', 'v vector') +
          dot('text-emerald-300', 'angle θ'),
        domainMeta: '2D Vector Plane · Equal Aspect',
        canvasAria: 'Geometric verification plot of vectors u and v with angle arc',
      },
      projection: {
        subtitle:
          'Geometric proof showing $\\operatorname{proj}_{\\mathbf{b}}\\mathbf{a}$ lying along $\\mathbf{b}$ with residual $\\mathbf{e} \\perp \\mathbf{b}$.',
        legendHtml:
          dot('text-cyan-300', 'a vector') +
          dot('text-slate-300', 'b line', true) +
          dot('text-emerald-300', 'proj_b(a)') +
          dot('text-amber-300', 'e residual (⊥)', true),
        domainMeta: 'Orthogonal Projection · 90° Check',
        canvasAria: 'Geometric plot of orthogonal vector projection and perpendicular residual',
      },
      'vectors-3d': {
        subtitle:
          'Isometric 3D view confirming torque $\\boldsymbol{\\tau} = \\mathbf{r} \\times \\mathbf{F}$ rises perpendicular to the $(\\mathbf{r}, \\mathbf{F})$ plane. Drag horizontally to orbit.',
        legendHtml:
          dot('text-cyan-300', 'r lever arm') +
          dot('text-amber-300', 'F force') +
          dot('text-emerald-300', 'τ = r × F (⊥)'),
        domainMeta: '3D Isometric · Drag to Orbit',
        canvasAria: '3D isometric plot of lever arm r, force F, and cross-product torque tau',
      },
      matrix: {
        subtitle:
          'Hover or drag horizontally to morph $I \\to A$: watch the unit square deform into a parallelogram of area $|\\det(A)|$.',
        legendHtml:
          dot('text-slate-400', 'unit square', true) +
          dot('text-cyan-300', 'A e₁') +
          dot('text-amber-300', 'A e₂') +
          dot('text-emerald-300', 'image (det)'),
        domainMeta: 'Linear Map ℝ² → ℝ² · Drag t ∈ [0,1]',
        canvasAria: 'Interactive linear transformation plot mapping unit square to parallelogram',
      },
      'linear-system': {
        subtitle:
          'Row picture in $\\mathbb{R}^2$: both linear constraints intersect cleanly at the unique solution $\\mathbf{x}$.',
        legendHtml:
          dot('text-cyan-300', 'Row 1 eq') +
          dot('text-amber-300', 'Row 2 eq') +
          dot('text-emerald-300', 'Solution x'),
        domainMeta: 'Row Picture ℝ² · Unique Intersection',
        canvasAria: 'Geometric plot of two linear equations intersecting at exact solution x',
      },
      det3x3: {
        subtitle:
          'Isometric 3D parallelepiped spanned by the 3 columns of $A$ with volume $|\\det(A)| = 13 \\neq 0$. Drag horizontally to orbit.',
        legendHtml:
          dot('text-cyan-300', 'col 1') +
          dot('text-amber-300', 'col 2') +
          dot('text-violet-300', 'col 3') +
          dot('text-emerald-300', 'volume |det|'),
        domainMeta: '3D Column Volume · Drag to Orbit',
        canvasAria: '3D isometric parallelepiped verifying nonzero determinant volume',
      },
      eigen: {
        subtitle:
          'Hover or drag horizontally to morph $I \\to A$: eigenvectors stay locked on their invariant spans while scaling purely by $\\lambda$.',
        legendHtml:
          dot('text-slate-400', 'unit square', true) +
          dot('text-emerald-300', 'A(square)') +
          dot('text-cyan-300', 'v₁ → λ₁v₁') +
          dot('text-amber-300', 'v₂ → λ₂v₂'),
        domainMeta: 'Eigen-Directions ℝ² · Drag t ∈ [0,1]',
        canvasAria: 'Interactive eigenvalue plot showing invariant eigenvector spans under A',
      },
      'complex-rotation': {
        subtitle:
          'Hover or drag horizontally to animate the spiral action: $A$ rotates every vector by $\\phi$ and scales radius by $|\\lambda|$ with no real eigen-lines.',
        legendHtml:
          dot('text-slate-400', 'unit circle', true) +
          dot('text-emerald-300', 'scaled |λ|') +
          dot('text-cyan-300', 'e₁') +
          dot('text-amber-300', 'spiral φ', true),
        domainMeta: 'Scaled Rotation ℝ² · Drag t ∈ [0,1]',
        canvasAria: 'Interactive scaled rotation plot illustrating complex eigenvalues',
      },
      'gram-schmidt': {
        subtitle:
          'Geometric proof: raw inputs $\\mathbf{a}_1, \\mathbf{a}_2$ orthogonalize and normalize onto the unit circle with $\\mathbf{q}_1 \\perp \\mathbf{q}_2$.',
        legendHtml:
          dot('text-slate-400', 'a₁, a₂ raw', true) +
          dot('text-cyan-300', 'q₁ unit') +
          dot('text-emerald-300', 'q₂ unit (⊥)'),
        domainMeta: 'Orthonormal Basis · QᵀQ = I',
        canvasAria: 'Geometric plot of Gram-Schmidt orthonormal vectors on the unit circle',
      },
      'least-squares': {
        subtitle:
          'Best-fit regression line $\\hat{y}(t) = c + mt$ minimizing $\\|\\mathbf{e}\\|^2$ with orthogonal vertical residuals ($A^T\\mathbf{e} = \\mathbf{0}$).',
        legendHtml:
          dot('text-cyan-300', 'data points') +
          dot('text-emerald-300', 'best-fit ŷ(t)') +
          dot('text-amber-300', 'residuals eᵢ', true),
        domainMeta: 'Least-Squares Fit · Min ‖e‖²',
        canvasAria: 'Least-squares regression plot with data points, fitted line, and residuals',
      },
      svd: {
        subtitle: vp.isSpd
          ? 'Hover or drag horizontally to morph $I \\to A$: symmetric $A = Q\\Lambda Q^T$ maps the unit circle to an ellipse aligned with orthonormal eigenvectors $\\mathbf{q}_1, \\mathbf{q}_2$.'
          : 'Hover or drag horizontally to morph $I \\to A$: the unit circle maps to the SVD ellipse with orthogonal semi-axes $\\sigma_1, \\sigma_2$.',
        legendHtml:
          dot('text-slate-400', 'unit circle', true) +
          dot('text-emerald-300', vp.isSpd ? 'SPD ellipse' : 'SVD ellipse') +
          dot('text-cyan-300', vp.isSpd ? 'λ₁ q₁' : 'σ₁ u₁') +
          dot('text-amber-300', vp.isSpd ? 'λ₂ q₂' : 'σ₂ u₂'),
        domainMeta: vp.isSpd
          ? 'SPD Spectral Ellipse · Drag t ∈ [0,1]'
          : 'SVD Principal Ellipse · Drag t ∈ [0,1]',
        canvasAria: 'Interactive unit-circle to SVD ellipse geometric verification plot',
      },
    };

    const meta = presets[kind] || presets.vectors;
    const metrics = Array.isArray(vp.metrics) ? vp.metrics : [];
    return {
      ...meta,
      subtitleHtml: renderInlineMathText(meta.subtitle),
      metrics: [
        metrics[0] || { label: 'Metric 1', value: '—' },
        metrics[1] || { label: 'Metric 2', value: '—' },
        metrics[2] || { label: 'Metric 3', value: '—' },
        metrics[3] || { label: 'Verification', value: '0.0000 ✓' },
      ],
    };
  }

  _getPidVerifyMeta(problem) {
    const vp = problem?.verifyPlot || {};
    const kind = vp.kind || 'step-compare';
    const dot = (cls, label, dashed = false) =>
      dashed
        ? `<span class="inline-flex items-center gap-1 ${cls}"><span class="w-3 h-0 border-t-2 border-dashed border-current inline-block"></span>${escapeHtml(label)}</span>`
        : `<span class="inline-flex items-center gap-1 ${cls}"><span class="w-2.5 h-0.5 rounded bg-current inline-block"></span>${escapeHtml(label)}</span>`;

    let legendHtml = '';
    let defaultSubtitle = '';
    let defaultDomain = '';
    let canvasAria = '';

    if (kind === 'step-compare') {
      legendHtml =
        dot('text-emerald-300', vp.primaryLabel || 'Closed-Loop y(t)') +
        (vp.baselineLabel ? dot('text-cyan-300', vp.baselineLabel, true) : '') +
        dot('text-amber-300', vp.setpointLabel || 'Setpoint r = 1', true);
      defaultSubtitle =
        'Hover or drag across time $t$ to inspect the closed-loop transient response and steady-state behavior.';
      defaultDomain = 'Step Response · Time Domain';
      canvasAria = 'Interactive closed-loop step response comparison plot';
    } else if (kind === 'ramp-track') {
      legendHtml =
        dot('text-amber-300', 'Unit Ramp r(t) = t', true) +
        dot('text-emerald-300', 'System Output y(t)') +
        dot('text-cyan-300', 'Lag e(t) → 1/Kv', true);
      defaultSubtitle =
        'Hover or drag across time $t$ to verify the Type-1 servo tracking a unit ramp with constant steady-state lag $1/K_v$.';
      defaultDomain = 'Ramp Tracking · Constant Lag = 1/Kv';
      canvasAria = 'Interactive unit ramp tracking plot showing steady-state lag 1/Kv';
    } else if (kind === 'pole-map') {
      const hasZeros = Array.isArray(vp.zeros) && vp.zeros.length > 0;
      if (vp.circleLocus) {
        legendHtml =
          dot('text-cyan-300', 'Circular Locus') +
          dot('text-emerald-300', 'Live Poles (×) & Zero (○)') +
          dot('text-amber-300', '45° Butterworth Ray', true);
      } else if (vp.specRegion) {
        legendHtml =
          dot('text-emerald-300', 'Feasible Wedge & Poles (×)') +
          dot('text-cyan-300', 'PD Zero (○)') +
          dot('text-amber-300', 'Spec Boundary', true);
      } else {
        legendHtml =
          dot('text-emerald-300', hasZeros ? 'LHP Poles (×) & Zeros (○)' : 'Stable LHP Poles (×)') +
          dot('text-amber-300', 'jω Boundary (×)') +
          (vp.gainSweep || !hasZeros ? dot('text-rose-300', 'Unstable RHP (σ > 0)') : '');
      }
      defaultSubtitle =
        'Complex $s$-plane verification showing left half-plane stability, imaginary-axis boundaries, and unstable right half-plane modes.';
      defaultDomain = 'Complex s-Plane · σ + jω';
      canvasAria = 'Complex s-plane pole-zero and root-locus verification map';
    } else if (kind === 'nyquist-circle') {
      legendHtml =
        dot('text-emerald-300', 'Stable CCW Loop (K > 2)') +
        dot('text-rose-300', 'Unstable Loop (K < 2)') +
        dot('text-amber-300', 'Critical Point −1 + j0', true);
      defaultSubtitle =
        'Hover or drag horizontally to sweep $K$ and watch the Nyquist circle enclose $-1 + j0$ counter-clockwise ($N = -1$) for $K > 2$.';
      defaultDomain = 'Nyquist Complex Plane · L(jω)';
      canvasAria = 'Interactive Nyquist plot sweeping gain K around critical point minus one';
    } else if (vp.sensitivityMode) {
      legendHtml =
        dot('text-cyan-300', 'Sensitivity |S(jω)| dB') +
        dot('text-emerald-300', 'Comp. Sens. |T(jω)| dB') +
        dot('text-amber-300', 'Loop |L(jω)| & Ms Peak');
      defaultSubtitle =
        'Hover or drag across frequency $\\omega$ to inspect the $S + T = 1$ loop-shaping trade-off across crossover.';
      defaultDomain = 'Sensitivity |S| & |T| vs Loop |L| · Log ω';
      canvasAria = 'Interactive Bode sensitivity plot comparing S, T, and loop gain L';
    } else {
      // 'bode-margin'
      const hasDelay = typeof vp.delayedPhaseDegFn === 'function';
      const hasGm = Number.isFinite(vp.wPc);
      const hasPeak = Boolean(vp.peakMarker);
      legendHtml =
        dot('text-cyan-300', hasDelay ? 'Mag |L| & Nom ∠L' : hasPeak ? 'Magnitude |T(jω)| dB' : 'Magnitude |L(jω)| dB') +
        dot('text-emerald-300', hasDelay ? 'PM Reserve' : hasPeak ? 'Phase ∠T(jω)' : 'Phase ∠L(jω) & PM') +
        (hasDelay ? dot('text-amber-300', 'Delayed ∠L − ωτ') : '') +
        (hasGm ? dot('text-amber-300', 'GM at ωpc') : '') +
        (hasPeak ? dot('text-amber-300', 'Resonant Peak Mr') : '') +
        dot('text-rose-300', '−180° Limit', true);
      defaultSubtitle =
        'Hover or drag across frequency $\\omega$ to inspect the Bode magnitude crossover $\\omega_{gc}$ and phase margin above $-180^\\circ$.';
      defaultDomain = 'Bode Magnitude & Phase · Log ω';
      canvasAria = 'Interactive Bode magnitude and phase plot marking gain crossover and phase margin';
    }

    const metrics = Array.isArray(vp.metrics) ? vp.metrics : [];
    return {
      subtitleHtml: renderInlineMathText(vp.subtitle || defaultSubtitle),
      legendHtml,
      domainMeta: vp.domainMeta || defaultDomain,
      canvasAria,
      metrics: [
        metrics[0] || { label: 'Metric 1', value: '—' },
        metrics[1] || { label: 'Metric 2', value: '—' },
        metrics[2] || { label: 'Metric 3', value: '—' },
        metrics[3] || { label: 'Verification', value: 'VERIFIED ✓' },
      ],
    };
  }

  _buildVerificationCardHtml(problem) {
    const isIntegral = this._isIntegralMode();
    const isDiffEq = this._isDiffEqMode();
    const isLinAlg = this._isLinAlgMode();
    const isPid = this._isPidMode();
    const isModeling = this._isModelingMode();
    const isFreq = this._isFreqMode();
    const isStateSpace = this._isStateSpaceMode();
    const isKinematics = this._isKinematicsMode();
    const isControlPlot = this._isControlPlotMode();
    const isLaplaceFwd = this._isLaplaceForward(problem);
    const isLaplaceInv = this._isLaplaceInverse(problem);
    const hasDiffEqDeriv = isDiffEq && typeof problem.verifyDerivFn === 'function';
    const linAlgMeta = isLinAlg ? this._getLinAlgVerifyMeta(problem) : null;
    const pidMeta = isControlPlot ? this._getPidVerifyMeta(problem) : null;

    const heading = isModeling
      ? 'Physical Model & s-Plane Verified'
      : isFreq
        ? 'Frequency & Stability Verified'
        : isStateSpace
          ? 'State-Space & SOTA Estimation Verified'
          : isKinematics
            ? 'Robot Kinematics & IK Verified'
            : isPid
              ? 'Closed-Loop Verification'
              : isLinAlg
                ? 'Geometric Verification'
                : isDiffEq
                  ? 'Solution Verified Numerically'
                  : isIntegral
                    ? 'Antiderivative Verified Numerically'
                    : 'Derivative Verified Numerically';

    const subtitle = isControlPlot
      ? pidMeta.subtitleHtml
      : isLinAlg
        ? linAlgMeta.subtitleHtml
        : isDiffEq
          ? isLaplaceFwd
            ? renderInlineMathText(
                'Hover or drag across the plot to compare the time signal $f(t)$ against its Laplace transform $F(s) = \\int_0^\\infty e^{-st}f(t)\\,dt$.'
              )
            : isLaplaceInv
              ? renderInlineMathText(
                  "Hover or drag across the plot to inspect the inverted signal $y(t)$, its slope $y'(t)$, and the numerical Laplace check."
                )
              : renderInlineMathText(
                  "Hover or drag across the plot to verify your solution $y(t)$, its slope $y'(t)$, and confirm the ODE residual vanishes everywhere."
                )
          : isIntegral
            ? renderInlineMathText(
                'Hover or drag across the plot to verify $\\frac{d}{dx}F(x) = f(x)$ and watch the shaded area under $f(x)$.'
              )
            : renderInlineMathText(
                "Hover or drag across the plot to compare your solved $f'(x)$ against the curve's true tangent slope."
              );

    const legendHtml = isControlPlot
      ? pidMeta.legendHtml
      : isLinAlg
        ? linAlgMeta.legendHtml
        : isDiffEq
          ? isLaplaceFwd
            ? `
                <span class="inline-flex items-center gap-1 text-cyan-300">
                  <span class="w-2.5 h-0.5 rounded bg-cyanGlow inline-block"></span>
                  f(t) signal
                </span>
                <span class="inline-flex items-center gap-1 text-emerald-300">
                  <span class="w-2.5 h-0.5 rounded bg-emeraldGlow inline-block"></span>
                  F(s) transform
                </span>
              `
            : `
                <span class="inline-flex items-center gap-1 text-emerald-300">
                  <span class="w-2.5 h-0.5 rounded bg-emeraldGlow inline-block"></span>
                  y(t) solution
                </span>
                ${
                  hasDiffEqDeriv
                    ? `<span class="inline-flex items-center gap-1 text-cyan-300">
                        <span class="w-3 h-0 border-t-2 border-dashed border-cyanGlow inline-block"></span>
                        y'(t) rate
                      </span>`
                    : ''
                }
                <span class="inline-flex items-center gap-1 text-amber-300">
                  <span class="w-2.5 h-0.5 rounded bg-amberGlow inline-block"></span>
                  tangent
                </span>
              `
          : isIntegral
            ? `
                <span class="inline-flex items-center gap-1 text-cyan-300">
                  <span class="w-2.5 h-0.5 rounded bg-cyanGlow inline-block"></span>
                  f(x)
                </span>
                <span class="inline-flex items-center gap-1 text-emerald-300">
                  <span class="w-2.5 h-0.5 rounded bg-emeraldGlow inline-block"></span>
                  F(x)
                </span>
                <span class="inline-flex items-center gap-1 text-emerald-200/90">
                  <span class="w-2.5 h-2 rounded-sm bg-emeraldGlow/35 border border-emeraldGlow/60 inline-block"></span>
                  area
                </span>
                <span class="inline-flex items-center gap-1 text-amber-300">
                  <span class="w-2.5 h-0.5 rounded bg-amberGlow inline-block"></span>
                  F'(x) tangent
                </span>
              `
            : `
                <span class="inline-flex items-center gap-1 text-cyan-300">
                  <span class="w-2.5 h-0.5 rounded bg-cyanGlow inline-block"></span>
                  f(x)
                </span>
                <span class="inline-flex items-center gap-1 text-emerald-300">
                  <span class="w-2.5 h-0.5 rounded bg-emeraldGlow inline-block"></span>
                  f'(x)
                </span>
                <span class="inline-flex items-center gap-1 text-amber-300">
                  <span class="w-2.5 h-0.5 rounded bg-amberGlow inline-block"></span>
                  tangent
                </span>
              `;

    const domainMeta = isControlPlot
      ? pidMeta.domainMeta
      : isLinAlg
        ? linAlgMeta.domainMeta
        : isDiffEq
          ? isLaplaceFwd && Array.isArray(problem.sDomain)
            ? `t ∈ [${problem.domain[0]}, ${problem.domain[1]}] · s ∈ [${problem.sDomain[0]}, ${problem.sDomain[1]}]`
            : `t ∈ [${problem.domain[0]}, ${problem.domain[1]}]`
          : isIntegral && Array.isArray(problem.definiteBounds)
            ? `∫[${problem.definiteBounds[0]}, ${problem.definiteBounds[1]}] = ${problem.definiteValue} · [${problem.domain[0]}, ${problem.domain[1]}]`
            : `[${problem.domain[0]}, ${problem.domain[1]}]`;

    const canvasAria = isControlPlot
      ? pidMeta.canvasAria
      : isLinAlg
        ? linAlgMeta.canvasAria
        : isDiffEq
          ? isLaplaceFwd
            ? 'Interactive dual curve graph comparing time-domain signal f(t) and Laplace transform F(s)'
            : "Interactive dual curve graph verifying ODE solution y(t) and rate y'(t)"
          : isIntegral
            ? 'Interactive dual curve graph comparing integrand f(x) and antiderivative F(x)'
            : "Interactive dual curve graph comparing f(x) and f'(x)";

    const col1Label = isControlPlot
      ? pidMeta.metrics[0].label
      : isLinAlg
        ? linAlgMeta.metrics[0].label
        : isDiffEq
          ? isLaplaceFwd
            ? 'Time t / s'
            : 'Time t'
          : 'Probe x';
    const col2Label = isControlPlot
      ? pidMeta.metrics[1].label
      : isLinAlg
        ? linAlgMeta.metrics[1].label
        : isDiffEq
          ? isLaplaceFwd
            ? 'Signal f(t)'
            : 'Solution y(t)'
          : isIntegral
            ? 'Integrand f(x)'
            : 'f(x) Height';
    const col3Label = isControlPlot
      ? pidMeta.metrics[2].label
      : isLinAlg
        ? linAlgMeta.metrics[2].label
        : isDiffEq
          ? isLaplaceFwd
            ? 'Transform F(s)'
            : "Slope y'(t)"
          : isIntegral
            ? 'Antideriv F(x)'
            : "Exact f'(x)";
    const col4Label = isControlPlot
      ? pidMeta.metrics[3].label
      : isLinAlg
        ? linAlgMeta.metrics[3].label
        : isDiffEq
          ? isLaplaceFwd || isLaplaceInv
            ? 'Laplace Residual'
            : 'ODE Residual'
          : isIntegral
            ? "Slope F'(x)"
            : 'True Slope';

    const col2BoxClass =
      isDiffEq && !isLaplaceFwd
        ? 'bg-emeraldGlow/[0.08] border border-emeraldGlow/25'
        : 'bg-cyanGlow/[0.06] border border-cyanGlow/20';
    const col2LabelClass =
      isDiffEq && !isLaplaceFwd ? 'text-emerald-300/80' : 'text-cyan-300/80';
    const col2ValClass =
      isDiffEq && !isLaplaceFwd ? 'text-emerald-200' : 'text-cyan-200';

    const col3BoxClass =
      isDiffEq && !isLaplaceFwd
        ? 'bg-cyanGlow/[0.06] border border-cyanGlow/20'
        : 'bg-emeraldGlow/[0.08] border border-emeraldGlow/25';
    const col3LabelClass =
      isDiffEq && !isLaplaceFwd ? 'text-cyan-300/80' : 'text-emerald-300/80';
    const col3ValClass =
      isDiffEq && !isLaplaceFwd ? 'text-cyan-200' : 'text-emerald-200';

    const finalSystemImpactHtml = this._buildSystemImpactBannerHtml();

    return `
      <div class="rounded-2xl p-3 sm:p-5 bg-gradient-to-b from-emeraldGlow/[0.11] to-slate-950/85 border border-emeraldGlow/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] flex flex-col gap-3 sm:gap-4 snap-in">
        ${finalSystemImpactHtml}

        <!-- Solved Banner -->
        <div class="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div class="flex items-center gap-2 sm:gap-2.5">
            <span class="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emeraldGlow/20 border border-emeraldGlow/55 text-emerald-300 font-bold text-xs sm:text-sm shadow-[0_0_16px_rgba(52,211,153,0.45)]">
              ✓
            </span>
            <div>
              <h3 class="font-display text-sm sm:text-lg font-bold text-emerald-200 leading-tight m-0">
                ${escapeHtml(heading)}
              </h3>
              <p class="hidden sm:block text-xs text-slate-300 m-0">
                ${subtitle}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" data-solve-again class="btn-glass text-xs sm:text-sm">
              ↺ Again
            </button>
            <button type="button" data-next-problem class="btn-glow-cyan text-xs sm:text-sm">
              Next →
            </button>
          </div>
        </div>

        <!-- Final Solved Formula Card -->
        <div class="katex-card border-emeraldGlow/35 bg-slate-950/80 flex items-center justify-center py-2 sm:py-3">
          <div class="overflow-x-auto max-w-full text-base sm:text-xl" data-final-answer></div>
        </div>

        <!-- Dual-Curve Interactive Verification Canvas -->
        <div class="rounded-xl overflow-hidden border border-white/10 bg-[#080A0F] relative">
          <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 border-b border-white/[0.07] bg-slate-950/75 text-[10px] sm:text-[11px] font-mono">
            <div class="flex flex-wrap items-center gap-2.5 sm:gap-3">
              ${legendHtml}
            </div>
            <span class="text-slate-400">${escapeHtml(domainMeta)}</span>
          </div>

          <div class="relative w-full h-[175px] sm:h-[260px] select-none touch-none">
            <canvas
              data-verify-canvas
              class="block w-full h-full cursor-crosshair"
              aria-label="${escapeHtml(canvasAria)}"
            ></canvas>
          </div>

          <!-- Live Numerical Verification Telemetry Bar -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 border-t border-white/[0.08] bg-slate-950/90 font-mono text-xs">
            <div class="rounded-lg px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.06]">
              <div class="text-[10px] uppercase tracking-wider text-slate-400">${escapeHtml(col1Label)}</div>
              <div class="text-slate-100 font-semibold mt-0.5" data-verify-x>—</div>
            </div>
            <div class="rounded-lg px-2.5 py-1.5 ${col2BoxClass}">
              <div class="text-[10px] uppercase tracking-wider ${col2LabelClass}">${escapeHtml(col2Label)}</div>
              <div class="${col2ValClass} font-semibold mt-0.5" data-verify-fx>—</div>
            </div>
            <div class="rounded-lg px-2.5 py-1.5 ${col3BoxClass}">
              <div class="text-[10px] uppercase tracking-wider ${col3LabelClass}">${escapeHtml(col3Label)}</div>
              <div class="${col3ValClass} font-semibold mt-0.5" data-verify-exact>—</div>
            </div>
            <div class="rounded-lg px-2.5 py-1.5 bg-violetGlow/[0.08] border border-violetGlow/25">
              <div class="flex items-center justify-between gap-1">
                <span class="text-[10px] uppercase tracking-wider text-violet-300/80">${escapeHtml(col4Label)}</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded bg-emeraldGlow/20 text-emerald-300 font-semibold" data-verify-match>MATCH ✓</span>
              </div>
              <div class="text-violet-200 font-semibold mt-0.5" data-verify-numeric>—</div>
            </div>
          </div>
        </div>

        <div class="text-center text-[11px] font-mono text-slate-400">
          Press <kbd class="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-slate-200">Enter</kbd> to advance to the next problem
        </div>
      </div>
    `;
  }

  _hydrateKatex(problem) {
    if (!this.container) return;

    const targetEl = this.container.querySelector('[data-target-expression]');
    if (targetEl) {
      renderKatex(targetEl, problem.expressionLatex, true);
    }

    // Cheat sheet formulas
    this.cheatSheetRules.forEach((rule, idx) => {
      const el = this.container.querySelector(`[data-cheat-formula="${idx}"]`);
      if (el) renderKatex(el, rule.latex, false);
    });

    // Locked ledger rows
    this.completedSteps.forEach((st, idx) => {
      const el = this.container.querySelector(`[data-ledger-latex="${idx}"]`);
      if (el) renderKatex(el, st.lockedResultLatex, false);
    });

    if (this.isProblemCompleted) {
      const finalEl = this.container.querySelector('[data-final-answer]');
      if (finalEl) renderKatex(finalEl, problem.finalAnswerLatex, true);
    } else {
      const step = problem.steps[this.currentStepIndex];
      if (step) {
        const hlEl = this.container.querySelector('[data-step-highlight]');
        if (hlEl) renderKatex(hlEl, step.highlightLatex, false);

        step.options.forEach((opt) => {
          const optEl = this.container.querySelector(
            `[data-option-latex="${CSS.escape(opt.id)}"]`
          );
          if (optEl) renderKatex(optEl, opt.latex, false);
        });
      }
    }
  }

  _bindEvents() {
    if (!this.container) return;

    this.container.querySelectorAll('[data-tier-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._setTier(btn.getAttribute('data-tier-id'));
      });
    });

    this.container.querySelectorAll('[data-problem-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-problem-id');
        if (id && id !== this.activeProblemId) {
          sound?.playTick?.();
          this.mobilePickerOpen = false;
          this.selectProblem(id);
        }
      });
    });

    this.container.querySelector('[data-mobile-picker-toggle]')?.addEventListener('click', () => {
      this._toggleMobilePicker();
    });

    this.container.querySelectorAll('[data-nav-prev], [data-nav-prev-mobile]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._navigateRelative(-1);
      });
    });
    this.container.querySelectorAll('[data-nav-next], [data-nav-next-mobile]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._navigateRelative(1);
      });
    });

    this.container.querySelectorAll('[data-cheat-toggle], [data-cheat-toggle-mobile]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._toggleCheatSheet();
      });
    });

    this.container.querySelector('[data-diagram-toggle]')?.addEventListener('click', () => {
      sound?.playTick?.();
      this.diagramExpanded = !this.diagramExpanded;
      this._render();
    });

    this.container.querySelector('[data-hint-btn]')?.addEventListener('click', () => {
      this._toggleHint();
    });

    this.container.querySelectorAll('[data-option-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._handleOptionSelect(btn.getAttribute('data-option-id'));
      });
    });

    this.container.querySelector('[data-solve-again]')?.addEventListener('click', () => {
      sound?.playTick?.();
      this._resetActiveProblemState();
      this._render();
    });

    this.container.querySelector('[data-next-problem]')?.addEventListener('click', () => {
      this._navigateRelative(1);
    });

    this.container.querySelector('[data-dismiss-impact]')?.addEventListener('click', () => {
      sound?.playTick?.();
      this._lastSystemImpact = null;
      const banner = this.container?.querySelector('[data-system-impact-banner]');
      if (banner) banner.classList.add('hidden');
    });

    this.container.querySelectorAll('[data-ledger-impact-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound?.playTick?.();
        const idx = Number(btn.getAttribute('data-ledger-impact-toggle'));
        if (!Number.isFinite(idx)) return;
        const isOpen = this._expandedLedgerImpacts.has(idx);
        if (isOpen) {
          this._expandedLedgerImpacts.delete(idx);
        } else {
          this._expandedLedgerImpacts.add(idx);
        }
        const body = this.container?.querySelector(`[data-ledger-impact-body="${idx}"]`);
        const nextOpen = !isOpen;
        btn.setAttribute('aria-expanded', String(nextOpen));
        btn.classList.toggle('bg-emeraldGlow/20', nextOpen);
        btn.classList.toggle('border-emeraldGlow/55', nextOpen);
        btn.classList.toggle('text-emerald-200', nextOpen);
        btn.classList.toggle('bg-emeraldGlow/[0.08]', !nextOpen);
        btn.classList.toggle('border-emeraldGlow/25', !nextOpen);
        btn.classList.toggle('text-emerald-300/90', !nextOpen);
        if (body) body.classList.toggle('hidden', !nextOpen);
      });
    });
  }

  _updateMechatronicsPill() {
    if (!this.container) return;
    const pill = this.container.querySelector('[data-mechatronics-pill]');
    if (pill) {
      pill.classList.toggle('hidden', !this.mechatronicsLens);
    }
  }

  _updateSolvedBadges() {
    if (!this.container) return;
    const solvedSet = this._getSolvedSet();
    const totalSolved = this.problems.filter((p) => solvedSet.has(p.id)).length;

    const overallEl = this.container.querySelector('[data-overall-solved] strong');
    if (overallEl) {
      overallEl.textContent = String(totalSolved);
    }

    this.tiers.forEach((tier) => {
      const list =
        tier.id === 'all'
          ? this.problems
          : this.problems.filter((p) => p.tier === tier.id);
      const count = list.filter((p) => solvedSet.has(p.id)).length;
      const badge = this.container.querySelector(
        `[data-tier-count="${CSS.escape(tier.id)}"]`
      );
      if (badge) badge.textContent = `${count}/${list.length}`;
    });
  }

  /* ========================================================================
     High-DPI Interactive Dual-Curve Verification Canvas
     ======================================================================== */

  _initVerificationCanvas() {
    const canvas = this.container?.querySelector('[data-verify-canvas]');
    if (!canvas) return;
    this.verifyCanvas = canvas;

    canvas.addEventListener('pointerdown', this._boundCanvasPointerDown);
    canvas.addEventListener('pointermove', this._boundCanvasPointerMove);
    canvas.addEventListener('pointerup', this._boundCanvasPointerUp);
    canvas.addEventListener('pointercancel', this._boundCanvasPointerUp);
    canvas.addEventListener('pointerleave', this._boundCanvasPointerLeave);

    const problem = this._getActiveProblem();
    if (this.verifyCursorX == null) {
      this.verifyCursorX = this._getDefaultVerifyCursorX(problem);
    }

    this._drawVerificationCanvas();
  }

  _detachCanvasListeners() {
    if (!this.verifyCanvas) return;
    this.verifyCanvas.removeEventListener('pointerdown', this._boundCanvasPointerDown);
    this.verifyCanvas.removeEventListener('pointermove', this._boundCanvasPointerMove);
    this.verifyCanvas.removeEventListener('pointerup', this._boundCanvasPointerUp);
    this.verifyCanvas.removeEventListener('pointercancel', this._boundCanvasPointerUp);
    this.verifyCanvas.removeEventListener('pointerleave', this._boundCanvasPointerLeave);
    this.verifyCanvas = null;
  }

  _updateCursorFromEvent(e) {
    if (!this.verifyCanvas || !this.verifyPlotGeom) return;
    const rect = this.verifyCanvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const { padL, plotW, xMin, xMax } = this.verifyPlotGeom;
    const t = Math.max(0, Math.min(1, (cssX - padL) / plotW));
    if (this._isLinAlgMode() || this._isControlPlotMode()) {
      this.verifyCursorX = t;
      this._drawVerificationCanvas();
      return;
    }
    const margin = (xMax - xMin) * 0.015;
    this.verifyCursorX = Math.max(
      xMin + margin,
      Math.min(xMax - margin, xMin + t * (xMax - xMin))
    );
    this._drawVerificationCanvas();
  }

  _handleCanvasPointerDown(e) {
    this.isDraggingVerify = true;
    try {
      this.verifyCanvas?.setPointerCapture?.(e.pointerId);
    } catch {
      // Safe fallback
    }
    this._updateCursorFromEvent(e);
  }

  _handleCanvasPointerMove(e) {
    // Allow effortless hover scrubbing on desktop AND touch drag on mobile
    if (e.pointerType === 'mouse' || this.isDraggingVerify) {
      this._updateCursorFromEvent(e);
    }
  }

  _handleCanvasPointerUp(e) {
    this.isDraggingVerify = false;
    try {
      this.verifyCanvas?.releasePointerCapture?.(e.pointerId);
    } catch {
      // Safe fallback
    }
  }

  _handleCanvasPointerLeave() {
    this.isDraggingVerify = false;
  }

  _drawIntegralAreaFill(ctx, fn, xStart, xEnd, mapX, mapYf) {
    const lo = Math.min(xStart, xEnd);
    const hi = Math.max(xStart, xEnd);
    if (hi - lo < 1e-6) return;

    const steps = 120;
    const yZeroPx = mapYf(0);
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const x = lo + (i / steps) * (hi - lo);
      const y = fn(x);
      if (Number.isFinite(y)) {
        pts.push({ x, y });
      }
    }
    if (pts.length < 2) return;

    // Split into contiguous positive (>=0) and negative (<0) segments with exact zero crossings
    const segments = [];
    let current = { sign: pts[0].y >= 0 ? 1 : -1, points: [pts[0]] };

    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const currSign = curr.y >= 0 ? 1 : -1;

      if (currSign === current.sign) {
        current.points.push(curr);
      } else {
        const denom = curr.y - prev.y;
        const frac = Math.abs(denom) > 1e-12 ? (0 - prev.y) / denom : 0.5;
        const cross = { x: prev.x + frac * (curr.x - prev.x), y: 0 };
        current.points.push(cross);
        segments.push(current);
        current = { sign: currSign, points: [cross, curr] };
      }
    }
    segments.push(current);

    ctx.save();
    for (const seg of segments) {
      if (seg.points.length < 2) continue;
      ctx.fillStyle =
        seg.sign >= 0 ? 'rgba(52, 211, 153, 0.22)' : 'rgba(251, 113, 133, 0.22)';
      ctx.beginPath();
      ctx.moveTo(mapX(seg.points[0].x), yZeroPx);
      for (const p of seg.points) {
        ctx.lineTo(mapX(p.x), mapYf(p.y));
      }
      ctx.lineTo(mapX(seg.points[seg.points.length - 1].x), yZeroPx);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  _drawVerificationCanvas() {
    const canvas = this.verifyCanvas;
    if (!canvas || !canvas.isConnected) return;

    const problem = this._getActiveProblem();
    if (this._isControlPlotMode()) {
      this._drawPidVerificationCanvas(canvas, problem);
      return;
    }
    if (this._isLinAlgMode()) {
      this._drawLinAlgVerificationCanvas(canvas, problem);
      return;
    }
    if (this._isDiffEqMode()) {
      this._drawDiffEqVerificationCanvas(canvas, problem);
      return;
    }

    const isIntegral = this._isIntegralMode();
    const secondFn = isIntegral
      ? problem.verifyAntiderivFn || problem.verifyDerivFn
      : problem.verifyDerivFn;
    if (typeof problem.verifyFn !== 'function' || typeof secondFn !== 'function') return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background studio fill
    ctx.fillStyle = '#080B11';
    ctx.fillRect(0, 0, width, height);

    const [xMin, xMax] = problem.domain;
    const samples = 220;
    const xs = [];
    const fVals = [];
    const secVals = [];

    let fMin = isIntegral ? 0 : Infinity;
    let fMax = isIntegral ? 0 : -Infinity;
    let secMin = Infinity;
    let secMax = -Infinity;

    for (let i = 0; i <= samples; i++) {
      const x = xMin + (i / samples) * (xMax - xMin);
      const y = problem.verifyFn(x);
      const sy = secondFn(x);
      xs.push(x);
      fVals.push(y);
      secVals.push(sy);
      if (Number.isFinite(y)) {
        if (y < fMin) fMin = y;
        if (y > fMax) fMax = y;
      }
      if (Number.isFinite(sy)) {
        if (sy < secMin) secMin = sy;
        if (sy > secMax) secMax = sy;
      }
    }

    const fSpan = Math.max(1e-3, fMax - fMin);
    const secSpan = Math.max(1e-3, secMax - secMin);
    const scaleRatio = Math.max(fSpan / secSpan, secSpan / fSpan);
    const useDualAxis = scaleRatio > 2.6;

    let fyMin;
    let fyMax;
    let secyMin;
    let secyMax;

    if (useDualAxis) {
      fyMin = fMin - fSpan * 0.14;
      fyMax = fMax + fSpan * 0.14;
      secyMin = secMin - secSpan * 0.14;
      secyMax = secMax + secSpan * 0.14;
    } else {
      const combMin = Math.min(fMin, secMin);
      const combMax = Math.max(fMax, secMax);
      const combSpan = Math.max(1e-3, combMax - combMin);
      fyMin = combMin - combSpan * 0.14;
      fyMax = combMax + combSpan * 0.14;
      secyMin = fyMin;
      secyMax = fyMax;
    }

    const padL = 52;
    const padR = useDualAxis ? 54 : 22;
    const padT = 18;
    const padB = 30;
    const plotW = Math.max(40, width - padL - padR);
    const plotH = Math.max(40, height - padT - padB);

    this.verifyPlotGeom = { padL, padR, padT, padB, plotW, plotH, xMin, xMax };

    const mapX = (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW;
    const mapYf = (y) => padT + (1 - (y - fyMin) / (fyMax - fyMin)) * plotH;
    const mapYsec = (y) => padT + (1 - (y - secyMin) / (secyMax - secyMin)) * plotH;

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
    ctx.lineWidth = 1;
    const gridRows = 4;
    const gridCols = 5;

    ctx.font = '10px "JetBrains Mono", monospace';
    for (let r = 0; r <= gridRows; r++) {
      const yPx = padT + (r / gridRows) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, yPx);
      ctx.lineTo(padL + plotW, yPx);
      ctx.stroke();

      const fTick = fyMax - (r / gridRows) * (fyMax - fyMin);
      ctx.fillStyle = useDualAxis ? 'rgba(103, 232, 249, 0.8)' : 'rgba(148, 163, 184, 0.78)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatAxisTick(fTick), padL - 7, yPx);

      if (useDualAxis) {
        const secTick = secyMax - (r / gridRows) * (secyMax - secyMin);
        ctx.fillStyle = 'rgba(110, 231, 183, 0.8)';
        ctx.textAlign = 'left';
        ctx.fillText(formatAxisTick(secTick), padL + plotW + 7, yPx);
      }
    }

    for (let c = 0; c <= gridCols; c++) {
      const xPx = padL + (c / gridCols) * plotW;
      ctx.beginPath();
      ctx.moveTo(xPx, padT);
      ctx.lineTo(xPx, padT + plotH);
      ctx.stroke();

      const xTick = xMin + (c / gridCols) * (xMax - xMin);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(formatAxisTick(xTick), xPx, padT + plotH + 8);
    }

    // Emphasized x=0 and y=0 axes when in view
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.1;
    if (xMin < 0 && xMax > 0) {
      const x0 = mapX(0);
      ctx.beginPath();
      ctx.moveTo(x0, padT);
      ctx.lineTo(x0, padT + plotH);
      ctx.stroke();
    }
    if (fyMin < 0 && fyMax > 0) {
      const y0 = mapYf(0);
      ctx.beginPath();
      ctx.moveTo(padL, y0);
      ctx.lineTo(padL + plotW, y0);
      ctx.stroke();
    }
    ctx.restore();

    const cx = this.verifyCursorX ?? this._getDefaultVerifyCursorX(problem);

    // Clip to plot box for shaded area, curves, and tangent line
    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH);
    ctx.clip();

    // Integral mode: shade signed area under integrand f(x) from start bound to cursor x
    if (isIntegral) {
      const areaStart = Array.isArray(problem.definiteBounds)
        ? problem.definiteBounds[0]
        : xMin;
      this._drawIntegralAreaFill(ctx, problem.verifyFn, areaStart, cx, mapX, mapYf);

      // Subtle vertical guides for definite integral bounds [a, b]
      if (Array.isArray(problem.definiteBounds)) {
        const [aBound, bBound] = problem.definiteBounds;
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.2;
        [
          { x: aBound, color: 'rgba(34, 211, 238, 0.45)' },
          { x: bBound, color: 'rgba(245, 158, 11, 0.55)' },
        ].forEach(({ x, color }) => {
          if (x >= xMin && x <= xMax) {
            const bx = mapX(x);
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(bx, padT);
            ctx.lineTo(bx, padT + plotH);
            ctx.stroke();
          }
        });
        ctx.restore();
      }
    }

    // Draw secondary curve — f'(x) in derivative mode or F(x) in integral mode — in luminous Emerald
    ctx.save();
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 2.25;
    ctx.shadowColor = 'rgba(52, 211, 153, 0.55)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= samples; i++) {
      if (!Number.isFinite(secVals[i])) continue;
      const px = mapX(xs[i]);
      const py = mapYsec(secVals[i]);
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();

    // Draw primary curve f(x) in luminous Cyan
    ctx.save();
    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(34, 211, 238, 0.6)';
    ctx.shadowBlur = 11;
    ctx.beginPath();
    started = false;
    for (let i = 0; i <= samples; i++) {
      if (!Number.isFinite(fVals[i])) continue;
      const px = mapX(xs[i]);
      const py = mapYf(fVals[i]);
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();

    // Interactive cursor, tangent segment, and markers
    const fxVal = problem.verifyFn(cx);
    const secVal = secondFn(cx);
    const numericSlope = isIntegral
      ? centralDiff(secondFn, cx, 1e-5)
      : centralDiff(problem.verifyFn, cx, 1e-5);

    const cxPx = mapX(cx);
    const fyPx = mapYf(fxVal);
    const secyPx = mapYsec(secVal);

    // Vertical glowing scan line
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cxPx, padT);
    ctx.lineTo(cxPx, padT + plotH);
    ctx.stroke();
    ctx.restore();

    // Exact screen-space tangent segment:
    //  - derivatives mode: kisses f(x) at (cxPx, fyPx) with slope f'(cx)
    //  - integrals mode: kisses F(x) at (cxPx, secyPx) with slope F'(cx) === f(cx)
    const tangentVal = isIntegral ? secVal : fxVal;
    const tangentSlope = isIntegral ? numericSlope : secVal;
    const tangentAnchorY = isIntegral ? secyPx : fyPx;
    const tangentSpanY = isIntegral ? secyMax - secyMin : fyMax - fyMin;

    if (Number.isFinite(tangentVal) && Number.isFinite(tangentSlope)) {
      const dPxDx = plotW / (xMax - xMin);
      const dPyDx = (-tangentSlope * plotH) / tangentSpanY;
      const mag = Math.hypot(dPxDx, dPyDx) || 1;
      const halfLen = 40;
      const ux = (dPxDx / mag) * halfLen;
      const uy = (dPyDx / mag) * halfLen;

      ctx.save();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(cxPx - ux, tangentAnchorY - uy);
      ctx.lineTo(cxPx + ux, tangentAnchorY + uy);
      ctx.stroke();
      ctx.restore();
    }

    // Glowing point on secondary curve (f'(x) or F(x))
    if (Number.isFinite(secVal)) {
      ctx.save();
      ctx.fillStyle = '#34D399';
      ctx.shadowColor = 'rgba(52, 211, 153, 0.9)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cxPx, secyPx, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isIntegral ? '#FFFFFF' : '#080B11';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }

    // Glowing point on f(x)
    if (Number.isFinite(fxVal)) {
      ctx.save();
      ctx.fillStyle = '#22D3EE';
      ctx.shadowColor = 'rgba(34, 211, 238, 0.95)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cxPx, fyPx, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore(); // end clip

    // Dual-axis hint tag if dual scaling is active
    if (useDualAxis) {
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.72)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      const dualHint = isIntegral
        ? 'Dual Y-axis: Cyan f(x) left · Emerald F(x) right'
        : "Dual Y-axis: Cyan f(x) left · Emerald f'(x) right";
      ctx.fillText(dualHint, padL + plotW - 6, padT + 4);
    }

    ctx.restore();

    // Update live numerical verification telemetry readout
    this._updateVerificationReadout(cx, fxVal, secVal, numericSlope);
  }

  _updateVerificationReadout(x, fxVal, secVal, numericSlope) {
    if (!this.container) return;
    const isIntegral = this._isIntegralMode();
    const xEl = this.container.querySelector('[data-verify-x]');
    const fxEl = this.container.querySelector('[data-verify-fx]');
    const exactEl = this.container.querySelector('[data-verify-exact]');
    const numEl = this.container.querySelector('[data-verify-numeric]');
    const matchEl = this.container.querySelector('[data-verify-match]');

    if (xEl) xEl.textContent = formatNum(x, 3);
    if (fxEl) fxEl.textContent = formatNum(fxVal, 4);
    if (exactEl) exactEl.textContent = formatNum(secVal, 4);
    if (numEl) numEl.textContent = formatNum(numericSlope, 4);

    // Compare:
    //  - derivatives: exact f'(x) (secVal) vs numerical centralDiff of f(x) (numericSlope)
    //  - integrals: integrand f(x) (fxVal) vs numerical centralDiff of F(x) (numericSlope)
    const expected = isIntegral ? fxVal : secVal;
    if (matchEl && Number.isFinite(expected) && Number.isFinite(numericSlope)) {
      const denom = Math.max(1, Math.abs(expected));
      const relErr = Math.abs(expected - numericSlope) / denom;
      matchEl.textContent = relErr < 1e-4 ? 'MATCH ✓' : `Δ ${relErr.toExponential(1)}`;
    }
  }

  _drawDiffEqVerificationCanvas(canvas, problem) {
    if (typeof problem?.verifyFn !== 'function') return;

    const isLaplaceFwd = this._isLaplaceForward(problem);
    const hasDeriv = !isLaplaceFwd && typeof problem.verifyDerivFn === 'function';
    const hasTransform = typeof problem.verifyTransformFn === 'function';
    if (isLaplaceFwd && !hasTransform) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background studio fill
    ctx.fillStyle = '#080B11';
    ctx.fillRect(0, 0, width, height);

    const [xMin, xMax] = problem.domain;
    const [sMin, sMax] = Array.isArray(problem.sDomain) ? problem.sDomain : [0.2, 6];
    const samples = 220;
    const xs = [];
    const primaryVals = [];
    const secondaryVals = [];

    let pMin = Infinity;
    let pMax = -Infinity;
    let sValMin = Infinity;
    let sValMax = -Infinity;

    for (let i = 0; i <= samples; i++) {
      const u = i / samples;
      const t = xMin + u * (xMax - xMin);
      const pVal = problem.verifyFn(t);
      const secVal = isLaplaceFwd
        ? problem.verifyTransformFn(sMin + u * (sMax - sMin))
        : hasDeriv
          ? problem.verifyDerivFn(t)
          : NaN;

      xs.push(t);
      primaryVals.push(pVal);
      secondaryVals.push(secVal);

      if (Number.isFinite(pVal)) {
        if (pVal < pMin) pMin = pVal;
        if (pVal > pMax) pMax = pVal;
      }
      if (Number.isFinite(secVal)) {
        if (secVal < sValMin) sValMin = secVal;
        if (secVal > sValMax) sValMax = secVal;
      }
    }

    const hasSecondaryCurve = (isLaplaceFwd && hasTransform) || hasDeriv;
    const pSpan = Math.max(1e-3, pMax - pMin);
    const secSpan = hasSecondaryCurve ? Math.max(1e-3, sValMax - sValMin) : pSpan;
    const scaleRatio = hasSecondaryCurve
      ? Math.max(pSpan / secSpan, secSpan / pSpan)
      : 1;
    const useDualAxis = hasSecondaryCurve && scaleRatio > 2.6;

    let pyMin;
    let pyMax;
    let secyMin;
    let secyMax;

    if (!hasSecondaryCurve) {
      pyMin = pMin - pSpan * 0.14;
      pyMax = pMax + pSpan * 0.14;
      secyMin = pyMin;
      secyMax = pyMax;
    } else if (useDualAxis) {
      pyMin = pMin - pSpan * 0.14;
      pyMax = pMax + pSpan * 0.14;
      secyMin = sValMin - secSpan * 0.14;
      secyMax = sValMax + secSpan * 0.14;
    } else {
      const combMin = Math.min(pMin, sValMin);
      const combMax = Math.max(pMax, sValMax);
      const combSpan = Math.max(1e-3, combMax - combMin);
      pyMin = combMin - combSpan * 0.14;
      pyMax = combMax + combSpan * 0.14;
      secyMin = pyMin;
      secyMax = pyMax;
    }

    const padL = 52;
    const padR = useDualAxis ? 54 : 22;
    const padT = isLaplaceFwd ? 24 : 18;
    const padB = 30;
    const plotW = Math.max(40, width - padL - padR);
    const plotH = Math.max(40, height - padT - padB);

    this.verifyPlotGeom = { padL, padR, padT, padB, plotW, plotH, xMin, xMax };

    const mapX = (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW;
    const mapYp = (y) => padT + (1 - (y - pyMin) / (pyMax - pyMin)) * plotH;
    const mapYsec = (y) => padT + (1 - (y - secyMin) / (secyMax - secyMin)) * plotH;

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
    ctx.lineWidth = 1;
    const gridRows = 4;
    const gridCols = 5;

    ctx.font = '10px "JetBrains Mono", monospace';
    for (let r = 0; r <= gridRows; r++) {
      const yPx = padT + (r / gridRows) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, yPx);
      ctx.lineTo(padL + plotW, yPx);
      ctx.stroke();

      const leftTick = pyMax - (r / gridRows) * (pyMax - pyMin);
      ctx.fillStyle = useDualAxis
        ? isLaplaceFwd
          ? 'rgba(103, 232, 249, 0.8)'
          : 'rgba(110, 231, 183, 0.85)'
        : 'rgba(148, 163, 184, 0.78)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatAxisTick(leftTick), padL - 7, yPx);

      if (useDualAxis) {
        const rightTick = secyMax - (r / gridRows) * (secyMax - secyMin);
        ctx.fillStyle = isLaplaceFwd
          ? 'rgba(110, 231, 183, 0.85)'
          : 'rgba(103, 232, 249, 0.8)';
        ctx.textAlign = 'left';
        ctx.fillText(formatAxisTick(rightTick), padL + plotW + 7, yPx);
      }
    }

    for (let c = 0; c <= gridCols; c++) {
      const u = c / gridCols;
      const xPx = padL + u * plotW;
      ctx.beginPath();
      ctx.moveTo(xPx, padT);
      ctx.lineTo(xPx, padT + plotH);
      ctx.stroke();

      const tTick = xMin + u * (xMax - xMin);
      ctx.fillStyle = isLaplaceFwd
        ? 'rgba(103, 232, 249, 0.78)'
        : 'rgba(148, 163, 184, 0.75)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(
        isLaplaceFwd ? `t=${formatAxisTick(tTick)}` : formatAxisTick(tTick),
        xPx,
        padT + plotH + 8
      );

      if (isLaplaceFwd) {
        const sTick = sMin + u * (sMax - sMin);
        ctx.fillStyle = 'rgba(110, 231, 183, 0.78)';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`s=${formatAxisTick(sTick)}`, xPx, padT - 5);
      }
    }

    // Emphasized zero axis when in view
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.1;
    if (pyMin < 0 && pyMax > 0) {
      const y0 = mapYp(0);
      ctx.beginPath();
      ctx.moveTo(padL, y0);
      ctx.lineTo(padL + plotW, y0);
      ctx.stroke();
    }
    ctx.restore();

    const cx = this.verifyCursorX ?? this._getDefaultVerifyCursorX(problem);
    const uCursor = Math.max(0, Math.min(1, (cx - xMin) / (xMax - xMin)));
    const sCursor = sMin + uCursor * (sMax - sMin);

    // Clip to plot box for curves and cursor markers
    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH);
    ctx.clip();

    // Draw secondary curve:
    //  - laplace-forward: F(s) in solid luminous Emerald
    //  - ODE / laplace-inverse: y'(t) in dashed luminous Cyan
    if (hasSecondaryCurve) {
      ctx.save();
      ctx.strokeStyle = isLaplaceFwd ? '#34D399' : '#22D3EE';
      ctx.lineWidth = isLaplaceFwd ? 2.5 : 2.0;
      if (!isLaplaceFwd) {
        ctx.setLineDash([6, 4]);
      }
      ctx.shadowColor = isLaplaceFwd
        ? 'rgba(52, 211, 153, 0.6)'
        : 'rgba(34, 211, 238, 0.5)';
      ctx.shadowBlur = isLaplaceFwd ? 11 : 8;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= samples; i++) {
        if (!Number.isFinite(secondaryVals[i])) continue;
        const px = mapX(xs[i]);
        const py = mapYsec(secondaryVals[i]);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw primary curve:
    //  - laplace-forward: f(t) in solid luminous Cyan
    //  - ODE / laplace-inverse: y(t) solution in solid luminous Emerald
    ctx.save();
    ctx.strokeStyle = isLaplaceFwd ? '#22D3EE' : '#34D399';
    ctx.lineWidth = 2.6;
    ctx.shadowColor = isLaplaceFwd
      ? 'rgba(34, 211, 238, 0.6)'
      : 'rgba(52, 211, 153, 0.65)';
    ctx.shadowBlur = 11;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= samples; i++) {
      if (!Number.isFinite(primaryVals[i])) continue;
      const px = mapX(xs[i]);
      const py = mapYp(primaryVals[i]);
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();

    // Evaluate cursor telemetry values
    const yVal = problem.verifyFn(cx);
    const dyExact = hasDeriv
      ? problem.verifyDerivFn(cx)
      : !isLaplaceFwd
        ? centralDiff(problem.verifyFn, cx, 1e-5)
        : NaN;
    const transformVal = isLaplaceFwd ? problem.verifyTransformFn(sCursor) : NaN;

    const cxPx = mapX(cx);
    const pyPx = mapYp(yVal);
    const secAtCursor = isLaplaceFwd ? transformVal : dyExact;
    const secyPx = mapYsec(secAtCursor);

    // Vertical glowing scan line
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cxPx, padT);
    ctx.lineTo(cxPx, padT + plotH);
    ctx.stroke();
    ctx.restore();

    // Exact tangent segment kissing y(t) for ODE & Laplace-inverse modes
    if (!isLaplaceFwd && Number.isFinite(yVal) && Number.isFinite(dyExact)) {
      const dPxDx = plotW / (xMax - xMin);
      const dPyDx = (-dyExact * plotH) / (pyMax - pyMin);
      const mag = Math.hypot(dPxDx, dPyDx) || 1;
      const halfLen = 40;
      const ux = (dPxDx / mag) * halfLen;
      const uy = (dPyDx / mag) * halfLen;

      ctx.save();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(cxPx - ux, pyPx - uy);
      ctx.lineTo(cxPx + ux, pyPx + uy);
      ctx.stroke();
      ctx.restore();
    }

    // Glowing point on secondary curve
    if (hasSecondaryCurve && Number.isFinite(secAtCursor)) {
      ctx.save();
      ctx.fillStyle = isLaplaceFwd ? '#34D399' : '#22D3EE';
      ctx.shadowColor = isLaplaceFwd
        ? 'rgba(52, 211, 153, 0.95)'
        : 'rgba(34, 211, 238, 0.9)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cxPx, secyPx, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isLaplaceFwd ? '#FFFFFF' : '#080B11';
      ctx.lineWidth = 1.7;
      ctx.stroke();
      ctx.restore();
    }

    // Glowing point on primary curve
    if (Number.isFinite(yVal)) {
      ctx.save();
      ctx.fillStyle = isLaplaceFwd ? '#22D3EE' : '#34D399';
      ctx.shadowColor = isLaplaceFwd
        ? 'rgba(34, 211, 238, 0.95)'
        : 'rgba(52, 211, 153, 0.95)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cxPx, pyPx, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore(); // end clip

    // Dual-axis hint tag if dual scaling is active
    if (useDualAxis) {
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.72)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      const dualHint = isLaplaceFwd
        ? 'Dual Y-axis: Cyan f(t) left · Emerald F(s) right'
        : "Dual Y-axis: Emerald y(t) left · Cyan y'(t) right";
      ctx.fillText(dualHint, padL + plotW - 6, padT + 4);
    }

    ctx.restore();

    // Compute exact numerical residual to prove ODE or Laplace identity at hovered point
    let residual = NaN;
    if (isLaplaceFwd) {
      const fsNum = numericalLaplace(problem.verifyFn, sCursor);
      residual = Math.abs(transformVal - fsNum);
    } else if (typeof problem.odeResidual === 'function') {
      const dyNum = centralDiff(problem.verifyFn, cx, 1e-5);
      const d2yNum = hasDeriv
        ? centralDiff(problem.verifyDerivFn, cx, 1e-5)
        : (problem.verifyFn(cx + 1e-4) - 2 * yVal + problem.verifyFn(cx - 1e-4)) / 1e-8;
      residual = Math.abs(problem.odeResidual(cx, yVal, dyNum, d2yNum));
    } else if (hasTransform) {
      const fsExact = problem.verifyTransformFn(sCursor);
      const fsNum = numericalLaplace(problem.verifyFn, sCursor);
      residual = Math.abs(fsExact - fsNum);
    }

    this._updateDiffEqVerificationReadout({
      isLaplaceFwd,
      t: cx,
      s: sCursor,
      primaryVal: yVal,
      secondaryVal: secAtCursor,
      residual,
    });
  }

  _updateDiffEqVerificationReadout({
    isLaplaceFwd,
    t,
    s,
    primaryVal,
    secondaryVal,
    residual,
  }) {
    if (!this.container) return;
    const xEl = this.container.querySelector('[data-verify-x]');
    const fxEl = this.container.querySelector('[data-verify-fx]');
    const exactEl = this.container.querySelector('[data-verify-exact]');
    const numEl = this.container.querySelector('[data-verify-numeric]');
    const matchEl = this.container.querySelector('[data-verify-match]');

    if (xEl) {
      xEl.textContent = isLaplaceFwd
        ? `${formatNum(t, 2)} / ${formatNum(s, 2)}`
        : formatNum(t, 3);
    }
    if (fxEl) fxEl.textContent = formatNum(primaryVal, 4);
    if (exactEl) exactEl.textContent = formatNum(secondaryVal, 4);

    if (Number.isFinite(residual)) {
      const isClean = residual < 1e-4;
      if (numEl) {
        numEl.textContent = isClean ? '0.0000 ✓' : formatNum(residual, 5);
      }
      if (matchEl) {
        matchEl.textContent = isClean ? 'MATCH ✓' : `Δ ${residual.toExponential(1)}`;
      }
    } else {
      if (numEl) numEl.textContent = '—';
    }
  }

  /* ========================================================================
     Linear Algebra High-DPI Geometric Verification Canvas
     ======================================================================== */

  _drawLinAlgArrow(ctx, x1, y1, x2, y2, color, opts = {}) {
    const {
      lineWidth = 2.4,
      dashed = false,
      glow = true,
      headLen = 9,
      alpha = 1,
    } = opts;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 1e-3) return;

    const ang = Math.atan2(dy, dx);
    const hl = Math.min(headLen, len * 0.45);
    const shaftEndX = x2 - Math.cos(ang) * (hl * 0.65);
    const shaftEndY = y2 - Math.sin(ang) * (hl * 0.65);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    if (dashed) ctx.setLineDash([5, 4]);
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
    }

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(shaftEndX, shaftEndY);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - hl * Math.cos(ang - Math.PI / 6),
      y2 - hl * Math.sin(ang - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - hl * Math.cos(ang + Math.PI / 6),
      y2 - hl * Math.sin(ang + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawLinAlgRightAngle(ctx, mapX, mapY, corner, dir1, dir2, sizePx = 10, color = '#F59E0B') {
    const p0x = mapX(corner[0]);
    const p0y = mapY(corner[1]);
    const p1x = mapX(corner[0] + dir1[0]);
    const p1y = mapY(corner[1] + dir1[1]);
    const p2x = mapX(corner[0] + dir2[0]);
    const p2y = mapY(corner[1] + dir2[1]);

    const len1 = Math.hypot(p1x - p0x, p1y - p0y) || 1;
    const len2 = Math.hypot(p2x - p0x, p2y - p0y) || 1;
    const u1x = ((p1x - p0x) / len1) * sizePx;
    const u1y = ((p1y - p0y) / len1) * sizePx;
    const u2x = ((p2x - p0x) / len2) * sizePx;
    const u2y = ((p2y - p0y) / len2) * sizePx;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p0x + u1x, p0y + u1y);
    ctx.lineTo(p0x + u1x + u2x, p0y + u1y + u2y);
    ctx.lineTo(p0x + u2x, p0y + u2y);
    ctx.stroke();
    ctx.restore();
  }

  _makeLinAlgEqualPlane(ctx, width, height, bounds) {
    const padL = 34;
    const padR = 20;
    const padT = 18;
    const padB = 26;
    const plotW = Math.max(40, width - padL - padR);
    const plotH = Math.max(40, height - padT - padB);

    const spanX = Math.max(1e-3, bounds.maxX - bounds.minX);
    const spanY = Math.max(1e-3, bounds.maxY - bounds.minY);
    const scale = Math.min(plotW / spanX, plotH / spanY);

    const midX = (bounds.minX + bounds.maxX) / 2;
    const midY = (bounds.minY + bounds.maxY) / 2;
    const cx = padL + plotW / 2;
    const cy = padT + plotH / 2;

    const mapX = (x) => cx + (x - midX) * scale;
    const mapY = (y) => cy - (y - midY) * scale;

    const viewMinX = midX - plotW / (2 * scale);
    const viewMaxX = midX + plotW / (2 * scale);
    const viewMinY = midY - plotH / (2 * scale);
    const viewMaxY = midY + plotH / (2 * scale);

    // Choose crisp grid spacing
    const rawStep = Math.max(viewMaxX - viewMinX, viewMaxY - viewMinY) / 6;
    const stepCandidates = [0.25, 0.5, 1, 2, 5, 10];
    const step =
      stepCandidates.find((s) => s >= rawStep) || Math.ceil(rawStep);

    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH);
    ctx.clip();

    // Subtle coordinate grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
    ctx.lineWidth = 1;
    const gxStart = Math.ceil(viewMinX / step) * step;
    for (let gx = gxStart; gx <= viewMaxX + 1e-6; gx += step) {
      const px = mapX(gx);
      ctx.beginPath();
      ctx.moveTo(px, padT);
      ctx.lineTo(px, padT + plotH);
      ctx.stroke();
    }
    const gyStart = Math.ceil(viewMinY / step) * step;
    for (let gy = gyStart; gy <= viewMaxY + 1e-6; gy += step) {
      const py = mapY(gy);
      ctx.beginPath();
      ctx.moveTo(padL, py);
      ctx.lineTo(padL + plotW, py);
      ctx.stroke();
    }

    // Emphasized axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.25;
    if (viewMinX <= 0 && viewMaxX >= 0) {
      const x0 = mapX(0);
      ctx.beginPath();
      ctx.moveTo(x0, padT);
      ctx.lineTo(x0, padT + plotH);
      ctx.stroke();
    }
    if (viewMinY <= 0 && viewMaxY >= 0) {
      const y0 = mapY(0);
      ctx.beginPath();
      ctx.moveTo(padL, y0);
      ctx.lineTo(padL + plotW, y0);
      ctx.stroke();
    }
    ctx.restore();

    // Axis ticks outside/along border
    ctx.save();
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.72)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let gx = gxStart; gx <= viewMaxX + 1e-6; gx += step) {
      const px = mapX(gx);
      if (px >= padL + 8 && px <= padL + plotW - 8) {
        ctx.fillText(formatAxisTick(gx), px, padT + plotH + 6);
      }
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let gy = gyStart; gy <= viewMaxY + 1e-6; gy += step) {
      const py = mapY(gy);
      if (py >= padT + 6 && py <= padT + plotH - 6) {
        ctx.fillText(formatAxisTick(gy), padL - 6, py);
      }
    }
    ctx.restore();

    this.verifyPlotGeom = { padL, padR, padT, padB, plotW, plotH, xMin: 0, xMax: 1 };
    return { padL, padT, plotW, plotH, mapX, mapY, viewMinX, viewMaxX, viewMinY, viewMaxY, scale };
  }

  _drawLinAlgLabel(ctx, text, x, y, color = '#E2E8F0', align = 'left') {
    ctx.save();
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(8, 11, 17, 0.95)';
    ctx.shadowBlur = 4;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  _drawLinAlgHudTag(ctx, text, padL, padT, plotW) {
    ctx.save();
    ctx.font = '10px "JetBrains Mono", monospace';
    const tw = ctx.measureText(text).width;
    const bx = padL + plotW - tw - 16;
    const by = padT + 5;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.32)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(bx, by, tw + 12, 18, 5);
    } else {
      ctx.rect(bx, by, tw + 12, 18);
    }
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#A7F3D0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + 6, by + 9);
    ctx.restore();
  }

  _drawLinAlgVerificationCanvas(canvas, problem) {
    const vp = problem?.verifyPlot;
    if (!vp) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Studio background fill
    ctx.fillStyle = '#080B11';
    ctx.fillRect(0, 0, width, height);

    const t = Math.max(0, Math.min(1, this.verifyCursorX ?? 1));
    const apply2 = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]];
    const lerpMat2 = (A, s) => [
      [1 + s * (A[0][0] - 1), s * A[0][1]],
      [s * A[1][0], 1 + s * (A[1][1] - 1)],
    ];

    if (vp.kind === 'vectors') {
      const { u, v, uLabel = 'u', vLabel = 'v', angleDeg = 30 } = vp;
      const maxX = Math.max(0.5, u[0], v[0]) + 0.65;
      const minX = Math.min(-0.4, u[0], v[0]) - 0.35;
      const maxY = Math.max(0.5, u[1], v[1]) + 0.65;
      const minY = Math.min(-0.4, u[1], v[1]) - 0.35;
      const plane = this._makeLinAlgEqualPlane(ctx, width, height, { minX, maxX, minY, maxY });
      const { mapX, mapY, padL, padT, plotW, plotH } = plane;

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, plotH);
      ctx.clip();

      const ox = mapX(0);
      const oy = mapY(0);
      const angU = Math.atan2(-(u[1]), u[0]);
      const angV = Math.atan2(-(v[1]), v[0]);
      const aStart = Math.min(angU, angV);
      const aEnd = Math.max(angU, angV);
      const arcR = 44;

      // Shaded angle sector
      ctx.save();
      ctx.fillStyle = 'rgba(52, 211, 153, 0.16)';
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.arc(ox, oy, arcR, aStart, aEnd);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ox, oy, arcR, aStart, aEnd);
      ctx.stroke();
      ctx.restore();

      const midAng = (aStart + aEnd) / 2;
      this._drawLinAlgLabel(
        ctx,
        `θ = ${angleDeg}°`,
        ox + Math.cos(midAng) * (arcR + 24),
        oy + Math.sin(midAng) * (arcR + 24),
        '#6EE7B7',
        'center'
      );

      this._drawLinAlgArrow(ctx, ox, oy, mapX(u[0]), mapY(u[1]), '#22D3EE', { lineWidth: 2.8 });
      this._drawLinAlgArrow(ctx, ox, oy, mapX(v[0]), mapY(v[1]), '#F59E0B', { lineWidth: 2.8 });

      this._drawLinAlgLabel(ctx, `${uLabel} = [1, √3]ᵀ`, mapX(u[0]) + 8, mapY(u[1]) - 6, '#67E8F9');
      this._drawLinAlgLabel(ctx, `${vLabel} = [√3, 1]ᵀ`, mapX(v[0]) + 8, mapY(v[1]) + 4, '#FCD34D');

      ctx.restore();
    } else if (vp.kind === 'projection') {
      const { a, b, p } = vp;
      const xs = [0, a[0], b[0], p[0]];
      const ys = [0, a[1], b[1], p[1]];
      const plane = this._makeLinAlgEqualPlane(ctx, width, height, {
        minX: Math.min(...xs) - 0.8,
        maxX: Math.max(...xs) + 1.0,
        minY: Math.min(...ys) - 0.8,
        maxY: Math.max(...ys) + 0.9,
      });
      const { mapX, mapY, padL, padT, plotW, plotH } = plane;

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, plotH);
      ctx.clip();

      const ox = mapX(0);
      const oy = mapY(0);

      // Infinite span line along b
      ctx.save();
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.25)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(mapX(-3 * b[0]), mapY(-3 * b[1]));
      ctx.lineTo(mapX(4 * b[0]), mapY(4 * b[1]));
      ctx.stroke();
      ctx.restore();

      // Right-angle marker at foot p between -b and residual e
      this._drawLinAlgRightAngle(
        ctx,
        mapX,
        mapY,
        p,
        [-b[0], -b[1]],
        [a[0] - p[0], a[1] - p[1]],
        10,
        '#F59E0B'
      );

      // Residual e (from p to a)
      this._drawLinAlgArrow(ctx, mapX(p[0]), mapY(p[1]), mapX(a[0]), mapY(a[1]), '#F59E0B', {
        lineWidth: 2.2,
        dashed: true,
      });

      // Projection p (emerald) and base vector b (slate)
      this._drawLinAlgArrow(ctx, ox, oy, mapX(p[0]), mapY(p[1]), '#34D399', { lineWidth: 3.0 });
      this._drawLinAlgArrow(ctx, ox, oy, mapX(b[0]), mapY(b[1]), '#CBD5E1', {
        lineWidth: 2.2,
        glow: false,
      });

      // Original vector a (cyan)
      this._drawLinAlgArrow(ctx, ox, oy, mapX(a[0]), mapY(a[1]), '#22D3EE', { lineWidth: 2.8 });

      this._drawLinAlgLabel(ctx, 'a [3,4]', mapX(a[0]) - 6, mapY(a[1]) - 10, '#67E8F9', 'right');
      this._drawLinAlgLabel(ctx, 'b [2,1]', mapX(b[0]) + 4, mapY(b[1]) + 14, '#CBD5E1');
      this._drawLinAlgLabel(ctx, 'proj [4,2]', mapX(p[0]) + 8, mapY(p[1]) + 10, '#6EE7B7');
      this._drawLinAlgLabel(
        ctx,
        'e [-1,2] ⊥',
        mapX((p[0] + a[0]) / 2) + 8,
        mapY((p[1] + a[1]) / 2) - 4,
        '#FCD34D'
      );

      ctx.restore();
    } else if (vp.kind === 'vectors-3d' || vp.kind === 'det3x3') {
      const padL = 20;
      const padR = 20;
      const padT = 18;
      const padB = 18;
      const plotW = Math.max(40, width - padL - padR);
      const plotH = Math.max(40, height - padT - padB);
      this.verifyPlotGeom = { padL, padR, padT, padB, plotW, plotH, xMin: 0, xMax: 1 };

      // Isometric 3D projector with horizontal orbit controlled by cursor t
      const az = -0.58 + (t - 1) * 1.45;
      const el = 0.42;
      const cosA = Math.cos(az);
      const sinA = Math.sin(az);
      const cosE = Math.cos(el);
      const sinE = Math.sin(el);

      const projRaw = (v) => {
        const rx = v[0] * cosA - v[1] * sinA;
        const ry = v[0] * sinA + v[1] * cosA;
        return [rx, v[2] * cosE - ry * sinE];
      };

      const samplePts = [[0, 0, 0]];
      if (vp.kind === 'vectors-3d') {
        const { r, F, tau } = vp;
        const tauVis = tau.map((c) => c * 0.45); // Gentle visual scale so τ fits cleanly alongside r & F
        samplePts.push(r, F, [r[0] + F[0], r[1] + F[1], r[2] + F[2]], tauVis, [3, 0, 0], [0, 3, 0], [0, 0, 4]);
      } else {
        const A = vp.A;
        const c1 = [A[0][0], A[1][0], A[2][0]];
        const c2 = [A[0][1], A[1][1], A[2][1]];
        const c3 = [A[0][2], A[1][2], A[2][2]];
        for (const a1 of [0, 1]) {
          for (const a2 of [0, 1]) {
            for (const a3 of [0, 1]) {
              samplePts.push([
                a1 * c1[0] + a2 * c2[0] + a3 * c3[0],
                a1 * c1[1] + a2 * c2[1] + a3 * c3[1],
                a1 * c1[2] + a2 * c2[2] + a3 * c3[2],
              ]);
            }
          }
        }
      }

      const projected = samplePts.map(projRaw);
      const pxs = projected.map((p) => p[0]);
      const pys = projected.map((p) => p[1]);
      const minPx = Math.min(...pxs) - 0.6;
      const maxPx = Math.max(...pxs) + 0.6;
      const minPy = Math.min(...pys) - 0.6;
      const maxPy = Math.max(...pys) + 0.6;
      const scale = Math.min(plotW / (maxPx - minPx), plotH / (maxPy - minPy));
      const midX = (minPx + maxPx) / 2;
      const midY = (minPy + maxPy) / 2;
      const toScreen = (v) => {
        const [rx, ry] = projRaw(v);
        return [
          padL + plotW / 2 + (rx - midX) * scale,
          padT + plotH / 2 - (ry - midY) * scale,
        ];
      };

      const o = toScreen([0, 0, 0]);
      const axisLen = vp.kind === 'vectors-3d' ? 3.2 : 2.8;
      [
        { v: [axisLen, 0, 0], lbl: 'x' },
        { v: [0, axisLen, 0], lbl: 'y' },
        { v: [0, 0, axisLen], lbl: 'z' },
      ].forEach(({ v, lbl }) => {
        const pt = toScreen(v);
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(o[0], o[1]);
        ctx.lineTo(pt[0], pt[1]);
        ctx.stroke();
        ctx.restore();
        this._drawLinAlgLabel(ctx, lbl, pt[0] + 6, pt[1], 'rgba(148,163,184,0.8)', 'left');
      });

      if (vp.kind === 'vectors-3d') {
        const { r, F, tau } = vp;
        const tauVis = tau.map((c) => c * 0.45);
        const pr = toScreen(r);
        const pF = toScreen(F);
        const prF = toScreen([r[0] + F[0], r[1] + F[1], r[2] + F[2]]);
        const pT = toScreen(tauVis);

        // Shaded (r, F) plane parallelogram
        ctx.save();
        ctx.fillStyle = 'rgba(34, 211, 238, 0.11)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(o[0], o[1]);
        ctx.lineTo(pr[0], pr[1]);
        ctx.lineTo(prF[0], prF[1]);
        ctx.lineTo(pF[0], pF[1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        this._drawLinAlgArrow(ctx, o[0], o[1], pr[0], pr[1], '#22D3EE', { lineWidth: 2.6 });
        this._drawLinAlgArrow(ctx, o[0], o[1], pF[0], pF[1], '#F59E0B', { lineWidth: 2.6 });
        this._drawLinAlgArrow(ctx, o[0], o[1], pT[0], pT[1], '#34D399', { lineWidth: 3.0 });

        this._drawLinAlgLabel(ctx, 'r [2,1,0]', pr[0] + 6, pr[1] + 8, '#67E8F9');
        this._drawLinAlgLabel(ctx, 'F [0,3,4]', pF[0] + 6, pF[1] - 6, '#FCD34D');
        this._drawLinAlgLabel(ctx, 'τ = r×F [4,-8,6]', pT[0] + 6, pT[1] - 6, '#6EE7B7');
        this._drawLinAlgHudTag(ctx, 'τ ⊥ r, τ ⊥ F · ‖τ‖ = 2√29', padL, padT, plotW);
      } else {
        // det3x3 parallelepiped
        const A = vp.A;
        const c1 = [A[0][0], A[1][0], A[2][0]];
        const c2 = [A[0][1], A[1][1], A[2][1]];
        const c3 = [A[0][2], A[1][2], A[2][2]];
        const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

        const p000 = toScreen([0, 0, 0]);
        const p100 = toScreen(c1);
        const p010 = toScreen(c2);
        const p001 = toScreen(c3);
        const p110 = toScreen(add3(c1, c2));
        const p101 = toScreen(add3(c1, c3));
        const p011 = toScreen(add3(c2, c3));
        const p111 = toScreen(add3(add3(c1, c2), c3));

        // Subtle unit cube wireframe
        const uPts = [
          [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
          [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
        ].map(toScreen);
        const cubeEdges = [
          [0, 1], [0, 2], [1, 3], [2, 3],
          [4, 5], [4, 6], [5, 7], [6, 7],
          [0, 4], [1, 5], [2, 6], [3, 7],
        ];
        ctx.save();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        cubeEdges.forEach(([i, j]) => {
          ctx.beginPath();
          ctx.moveTo(uPts[i][0], uPts[i][1]);
          ctx.lineTo(uPts[j][0], uPts[j][1]);
          ctx.stroke();
        });
        ctx.restore();

        // Shaded parallelepiped faces
        const faces = [
          [p000, p100, p110, p010],
          [p000, p100, p101, p001],
          [p000, p010, p011, p001],
          [p001, p101, p111, p011],
          [p100, p110, p111, p101],
          [p010, p110, p111, p011],
        ];
        ctx.save();
        ctx.fillStyle = 'rgba(52, 211, 153, 0.11)';
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.48)';
        ctx.lineWidth = 1.25;
        faces.forEach((f) => {
          ctx.beginPath();
          ctx.moveTo(f[0][0], f[0][1]);
          f.slice(1).forEach((pt) => ctx.lineTo(pt[0], pt[1]));
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
        ctx.restore();

        this._drawLinAlgArrow(ctx, p000[0], p000[1], p100[0], p100[1], '#22D3EE', { lineWidth: 2.6 });
        this._drawLinAlgArrow(ctx, p000[0], p000[1], p010[0], p010[1], '#F59E0B', { lineWidth: 2.6 });
        this._drawLinAlgArrow(ctx, p000[0], p000[1], p001[0], p001[1], '#A78BFA', { lineWidth: 2.6 });

        this._drawLinAlgLabel(ctx, 'c₁ [2,0,1]', p100[0] + 5, p100[1] + 6, '#67E8F9');
        this._drawLinAlgLabel(ctx, 'c₂ [1,3,0]', p010[0] + 5, p010[1] + 6, '#FCD34D');
        this._drawLinAlgLabel(ctx, 'c₃ [0,1,2]', p001[0] + 5, p001[1] - 6, '#C4B5FD');
        this._drawLinAlgHudTag(ctx, `Vol = |det(A)| = ${vp.det}`, padL, padT, plotW);
      }
    } else if (vp.kind === 'matrix') {
      const A = vp.A;
      const M = lerpMat2(A, t);
      const corners = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ];
      const fullImg = corners.map((c) => apply2(A, c));
      const allPts = [...corners, ...fullImg];
      const plane = this._makeLinAlgEqualPlane(ctx, width, height, {
        minX: Math.min(...allPts.map((p) => p[0])) - 0.8,
        maxX: Math.max(...allPts.map((p) => p[0])) + 0.9,
        minY: Math.min(...allPts.map((p) => p[1])) - 0.8,
        maxY: Math.max(...allPts.map((p) => p[1])) + 0.9,
      });
      const { mapX, mapY, padL, padT, plotW, plotH } = plane;

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, plotH);
      ctx.clip();

      // Original unit square
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.06)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      corners.forEach((c, i) => {
        if (i === 0) ctx.moveTo(mapX(c[0]), mapY(c[1]));
        else ctx.lineTo(mapX(c[0]), mapY(c[1]));
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Transformed parallelogram M(t)[0,1]^2
      const img = corners.map((c) => apply2(M, c));
      ctx.save();
      ctx.fillStyle = 'rgba(52, 211, 153, 0.19)';
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(52, 211, 153, 0.45)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      img.forEach((c, i) => {
        if (i === 0) ctx.moveTo(mapX(c[0]), mapY(c[1]));
        else ctx.lineTo(mapX(c[0]), mapY(c[1]));
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      const ox = mapX(0);
      const oy = mapY(0);
      const e1 = apply2(M, [1, 0]);
      const e2 = apply2(M, [0, 1]);
      this._drawLinAlgArrow(ctx, ox, oy, mapX(e1[0]), mapY(e1[1]), '#22D3EE', { lineWidth: 2.8 });
      this._drawLinAlgArrow(ctx, ox, oy, mapX(e2[0]), mapY(e2[1]), '#F59E0B', { lineWidth: 2.8 });

      this._drawLinAlgLabel(ctx, 'A e₁', mapX(e1[0]) + 8, mapY(e1[1]) + 4, '#67E8F9');
      this._drawLinAlgLabel(ctx, 'A e₂', mapX(e2[0]) - 6, mapY(e2[1]) - 10, '#FCD34D', 'right');

      const curDet = M[0][0] * M[1][1] - M[0][1] * M[1][0];
      this._drawLinAlgHudTag(
        ctx,
        `t=${t.toFixed(2)} · Area = |det| = ${Math.abs(curDet).toFixed(2)}`,
        padL,
        padT,
        plotW
      );
      ctx.restore();
    } else if (vp.kind === 'linear-system') {
      const { A, b, x } = vp;
      const plane = this._makeLinAlgEqualPlane(ctx, width, height, {
        minX: x[0] - 2.6,
        maxX: x[0] + 3.4,
        minY: x[1] - 2.2,
        maxY: x[1] + 2.2,
      });
      const { mapX, mapY, padL, padT, plotW, plotH, viewMinX, viewMaxX } = plane;

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, plotH);
      ctx.clip();

      const drawLineEq = (row, rhs, color) => {
        const [a1, a2] = row;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.4;
        ctx.shadowColor = color;
        ctx.shadowBlur = 9;
        ctx.beginPath();
        if (Math.abs(a2) > 1e-6) {
          const y1 = (rhs - a1 * viewMinX) / a2;
          const y2 = (rhs - a1 * viewMaxX) / a2;
          ctx.moveTo(mapX(viewMinX), mapY(y1));
          ctx.lineTo(mapX(viewMaxX), mapY(y2));
        } else {
          const xv = rhs / a1;
          ctx.moveTo(mapX(xv), padT);
          ctx.lineTo(mapX(xv), padT + plotH);
        }
        ctx.stroke();
        ctx.restore();
      };

      drawLineEq(A[0], b[0], '#22D3EE');
      drawLineEq(A[1], b[1], '#F59E0B');

      const sx = mapX(x[0]);
      const sy = mapY(x[1]);

      // Dashed guides to axes
      ctx.save();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.42)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, mapY(0));
      ctx.moveTo(sx, sy);
      ctx.lineTo(mapX(0), sy);
      ctx.stroke();
      ctx.restore();

      // Glowing intersection point
      ctx.save();
      ctx.fillStyle = '#34D399';
      ctx.shadowColor = 'rgba(52, 211, 153, 0.95)';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();

      this._drawLinAlgLabel(ctx, `x = (${x[0]}, ${x[1]})`, sx + 10, sy - 10, '#6EE7B7');
      this._drawLinAlgLabel(ctx, 'x₁ + 2x₂ = 5', mapX(x[0] + 1.8), mapY((b[0] - A[0][0] * (x[0] + 1.8)) / A[0][1]) - 10, '#67E8F9');
      this._drawLinAlgLabel(ctx, '3x₁ + 4x₂ = 11', mapX(x[0] + 1.4), mapY((b[1] - A[1][0] * (x[0] + 1.4)) / A[1][1]) + 14, '#FCD34D');

      ctx.restore();
    } else if (vp.kind === 'eigen') {
      const { A, eigenpairs = [] } = vp;
      const M = lerpMat2(A, t);
      const corners = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ];
      const fullImg = corners.map((c) => apply2(A, c));
      const unitEigs = eigenpairs.map((ep) => {
        const mag = Math.hypot(ep.v[0], ep.v[1]) || 1;
        return { ...ep, u: [ep.v[0] / mag, ep.v[1] / mag] };
      });
      const allPts = [...corners, ...fullImg];
      unitEigs.forEach((ep) => {
        allPts.push(ep.u, [ep.lambda * ep.u[0], ep.lambda * ep.u[1]]);
      });

      const plane = this._makeLinAlgEqualPlane(ctx, width, height, {
        minX: Math.min(...allPts.map((p) => p[0])) - 0.8,
        maxX: Math.max(...allPts.map((p) => p[0])) + 0.9,
        minY: Math.min(...allPts.map((p) => p[1])) - 0.8,
        maxY: Math.max(...allPts.map((p) => p[1])) + 0.9,
      });
      const { mapX, mapY, padL, padT, plotW, plotH } = plane;

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, plotH);
      ctx.clip();

      // Dashed invariant eigen-lines through origin
      unitEigs.forEach((ep) => {
        ctx.save();
        ctx.strokeStyle = ep.color;
        ctx.globalAlpha = 0.3;
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(mapX(-12 * ep.u[0]), mapY(-12 * ep.u[1]));
        ctx.lineTo(mapX(12 * ep.u[0]), mapY(12 * ep.u[1]));
        ctx.stroke();
        ctx.restore();
      });

      // Unit square
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.42)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      corners.forEach((c, i) => {
        if (i === 0) ctx.moveTo(mapX(c[0]), mapY(c[1]));
        else ctx.lineTo(mapX(c[0]), mapY(c[1]));
      });
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Transformed parallelogram
      const img = corners.map((c) => apply2(M, c));
      ctx.save();
      ctx.fillStyle = 'rgba(52, 211, 153, 0.14)';
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.75)';
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      img.forEach((c, i) => {
        if (i === 0) ctx.moveTo(mapX(c[0]), mapY(c[1]));
        else ctx.lineTo(mapX(c[0]), mapY(c[1]));
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      const ox = mapX(0);
      const oy = mapY(0);

      // Eigenvectors u -> M(t)u locked onto invariant lines
      unitEigs.forEach((ep, idx) => {
        const mapped = apply2(M, ep.u);
        // Ghost original unit eigenvector
        this._drawLinAlgArrow(ctx, ox, oy, mapX(ep.u[0]), mapY(ep.u[1]), ep.color, {
          lineWidth: 1.8,
          alpha: 0.45,
          glow: false,
          headLen: 7,
        });
        // Glowing stretched eigenvector
        this._drawLinAlgArrow(ctx, ox, oy, mapX(mapped[0]), mapY(mapped[1]), ep.color, {
          lineWidth: 2.9,
        });
        this._drawLinAlgLabel(
          ctx,
          ep.label || `λ${idx + 1}=${ep.lambda}`,
          mapX(mapped[0]) + (mapped[0] >= 0 ? 8 : -8),
          mapY(mapped[1]) + (mapped[1] >= 0 ? -8 : 10),
          ep.color,
          mapped[0] >= 0 ? 'left' : 'right'
        );
      });

      this._drawLinAlgHudTag(ctx, `Morph t=${t.toFixed(2)} (I → A)`, padL, padT, plotW);
      ctx.restore();
    } else if (vp.kind === 'complex-rotation') {
      const { modulus = Math.sqrt(5), angleDeg = 63.43 } = vp;
      const phiMax = (angleDeg * Math.PI) / 180;
      const curR = Math.pow(modulus, t);
      const curPhi = t * phiMax;
      const rPad = modulus + 0.65;

      const plane = this._makeLinAlgEqualPlane(ctx, width, height, {
        minX: -rPad,
        maxX: rPad,
        minY: -rPad,
        maxY: rPad,
      });
      const { mapX, mapY, padL, padT, plotW, plotH, scale } = plane;

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, plotH);
      ctx.clip();

      const ox = mapX(0);
      const oy = mapY(0);

      // Unit circle
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.42)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(ox, oy, scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Scaled circle of radius |λ|^t
      ctx.save();
      ctx.fillStyle = 'rgba(52, 211, 153, 0.1)';
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2.1;
      ctx.shadowColor = 'rgba(52, 211, 153, 0.5)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ox, oy, curR * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Spiral arc from e1 to A^t e1
      ctx.save();
      ctx.strokeStyle = '#F59E0B';
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      const spiralSteps = 48;
      for (let i = 0; i <= spiralSteps; i++) {
        const s = (i / spiralSteps) * t;
        const sr = Math.pow(modulus, s);
        const sa = s * phiMax;
        const sx = mapX(sr * Math.cos(sa));
        const sy = mapY(sr * Math.sin(sa));
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.restore();

      const tipX = curR * Math.cos(curPhi);
      const tipY = curR * Math.sin(curPhi);
      this._drawLinAlgArrow(ctx, ox, oy, mapX(1), mapY(0), '#22D3EE', { lineWidth: 2.5 });
      this._drawLinAlgArrow(ctx, ox, oy, mapX(tipX), mapY(tipY), '#34D399', { lineWidth: 2.8 });

      this._drawLinAlgLabel(ctx, 'e₁', mapX(1) + 6, mapY(0) + 12, '#67E8F9');
      this._drawLinAlgLabel(ctx, 'A e₁ = [1, 2]ᵀ', mapX(tipX) + 8, mapY(tipY) - 6, '#6EE7B7');
      this._drawLinAlgHudTag(
        ctx,
        `r=${curR.toFixed(2)} · φ=${((curPhi * 180) / Math.PI).toFixed(1)}°`,
        padL,
        padT,
        plotW
      );
      ctx.restore();
    } else if (vp.kind === 'gram-schmidt') {
      const { a1, a2, q1, q2 } = vp;
      const allPts = [[0, 0], a1, a2, q1, q2, [-1.1, -1.1], [1.1, 1.1]];
      const plane = this._makeLinAlgEqualPlane(ctx, width, height, {
        minX: Math.min(...allPts.map((p) => p[0])) - 0.5,
        maxX: Math.max(...allPts.map((p) => p[0])) + 0.6,
        minY: Math.min(...allPts.map((p) => p[1])) - 0.5,
        maxY: Math.max(...allPts.map((p) => p[1])) + 0.6,
      });
      const { mapX, mapY, padL, padT, plotW, plotH, scale } = plane;

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, plotH);
      ctx.clip();

      const ox = mapX(0);
      const oy = mapY(0);

      // Unit circle showing both q1 and q2 have unit length
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(ox, oy, scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Raw input vectors a1, a2 (dashed muted)
      this._drawLinAlgArrow(ctx, ox, oy, mapX(a1[0]), mapY(a1[1]), '#94A3B8', {
        lineWidth: 1.8,
        dashed: true,
        glow: false,
      });
      this._drawLinAlgArrow(ctx, ox, oy, mapX(a2[0]), mapY(a2[1]), '#F59E0B', {
        lineWidth: 1.8,
        dashed: true,
        glow: false,
        alpha: 0.65,
      });

      // Right-angle square between q1 and q2
      this._drawLinAlgRightAngle(ctx, mapX, mapY, [0, 0], q1, q2, 9, '#34D399');

      // Orthonormal vectors q1 (cyan) and q2 (emerald)
      this._drawLinAlgArrow(ctx, ox, oy, mapX(q1[0]), mapY(q1[1]), '#22D3EE', { lineWidth: 2.9 });
      this._drawLinAlgArrow(ctx, ox, oy, mapX(q2[0]), mapY(q2[1]), '#34D399', { lineWidth: 2.9 });

      this._drawLinAlgLabel(ctx, 'a₁ [3,4]', mapX(a1[0]) + 6, mapY(a1[1]), '#94A3B8');
      this._drawLinAlgLabel(ctx, 'a₂ [1,0]', mapX(a2[0]) + 8, mapY(a2[1]) - 8, '#FCD34D');
      this._drawLinAlgLabel(ctx, 'q₁', mapX(q1[0]) - 8, mapY(q1[1]) - 6, '#67E8F9', 'right');
      this._drawLinAlgLabel(ctx, 'q₂ (⊥)', mapX(q2[0]) + 8, mapY(q2[1]) + 6, '#6EE7B7');
      this._drawLinAlgHudTag(ctx, '‖q₁‖ = ‖q₂‖ = 1 · q₁·q₂ = 0', padL, padT, plotW);

      ctx.restore();
    } else if (vp.kind === 'least-squares') {
      const { points = [], intercept = 0, slope = 1 } = vp;
      const padL = 44;
      const padR = 24;
      const padT = 20;
      const padB = 28;
      const plotW = Math.max(40, width - padL - padR);
      const plotH = Math.max(40, height - padT - padB);
      this.verifyPlotGeom = { padL, padR, padT, padB, plotW, plotH, xMin: 0, xMax: 1 };

      const xMin = -1.6;
      const xMax = 1.6;
      const yMin = -0.3;
      const yMax = 4.8;
      const mapX = (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW;
      const mapY = (y) => padT + (1 - (y - yMin) / (yMax - yMin)) * plotH;

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
      ctx.lineWidth = 1;
      ctx.font = '10px "JetBrains Mono", monospace';
      for (let yTick = 0; yTick <= 4; yTick += 1) {
        const py = mapY(yTick);
        ctx.beginPath();
        ctx.moveTo(padL, py);
        ctx.lineTo(padL + plotW, py);
        ctx.stroke();
        ctx.fillStyle = 'rgba(148, 163, 184, 0.78)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(yTick), padL - 7, py);
      }
      for (const xTick of [-1, 0, 1]) {
        const px = mapX(xTick);
        ctx.beginPath();
        ctx.moveTo(px, padT);
        ctx.lineTo(px, padT + plotH);
        ctx.stroke();
        ctx.fillStyle = 'rgba(148, 163, 184, 0.78)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`t=${xTick}`, px, padT + plotH + 7);
      }

      // Emphasized axes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.beginPath();
      ctx.moveTo(mapX(0), padT);
      ctx.lineTo(mapX(0), padT + plotH);
      ctx.moveTo(padL, mapY(0));
      ctx.lineTo(padL + plotW, mapY(0));
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, plotH);
      ctx.clip();

      // Best-fit regression line y = c + m*t
      ctx.save();
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2.6;
      ctx.shadowColor = 'rgba(52, 211, 153, 0.65)';
      ctx.shadowBlur = 11;
      ctx.beginPath();
      ctx.moveTo(mapX(xMin), mapY(intercept + slope * xMin));
      ctx.lineTo(mapX(xMax), mapY(intercept + slope * xMax));
      ctx.stroke();
      ctx.restore();

      // Vertical residual segments & data points
      points.forEach(([ptX, ptY]) => {
        const yHat = intercept + slope * ptX;
        const err = ptY - yHat;
        const px = mapX(ptX);
        const pyData = mapY(ptY);
        const pyFit = mapY(yHat);

        ctx.save();
        ctx.strokeStyle = '#F59E0B';
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(px, pyFit);
        ctx.lineTo(px, pyData);
        ctx.stroke();
        ctx.restore();

        // Small marker on fitted line
        ctx.save();
        ctx.fillStyle = '#34D399';
        ctx.beginPath();
        ctx.arc(px, pyFit, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Glowing cyan data point
        ctx.save();
        ctx.fillStyle = '#22D3EE';
        ctx.shadowColor = 'rgba(34, 211, 238, 0.95)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(px, pyData, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();

        const signStr = err >= 0 ? `+${err.toFixed(1)}` : err.toFixed(1);
        this._drawLinAlgLabel(ctx, `e=${signStr}`, px + 10, (pyFit + pyData) / 2, '#FCD34D');
      });

      this._drawLinAlgHudTag(ctx, `ŷ(t) = ${intercept} + ${slope}t · Aᵀe = 0`, padL, padT, plotW);
      ctx.restore();
    } else if (vp.kind === 'svd') {
      const { A, sigma1 = 4, sigma2 = 2, u1 = [1, 0], u2 = [0, 1], isSpd = false } = vp;
      const M = lerpMat2(A, t);
      const rPad = Math.max(sigma1, 2) + 0.9;
      const plane = this._makeLinAlgEqualPlane(ctx, width, height, {
        minX: -rPad,
        maxX: rPad,
        minY: -rPad,
        maxY: rPad,
      });
      const { mapX, mapY, padL, padT, plotW, plotH, scale } = plane;

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, plotH);
      ctx.clip();

      const ox = mapX(0);
      const oy = mapY(0);

      // Original unit circle
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.42)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(ox, oy, scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Transformed ellipse M(t) S^1
      ctx.save();
      ctx.fillStyle = 'rgba(52, 211, 153, 0.14)';
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2.3;
      ctx.shadowColor = 'rgba(52, 211, 153, 0.55)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      const segs = 120;
      for (let i = 0; i <= segs; i++) {
        const th = (i / segs) * Math.PI * 2;
        const pt = apply2(M, [Math.cos(th), Math.sin(th)]);
        const px = mapX(pt[0]);
        const py = mapY(pt[1]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Principal axes (for symmetric A, M(t) u_i = (1 + t*(sigma_i - 1)) u_i)
      const s1 = 1 + t * (sigma1 - 1);
      const s2 = 1 + t * (sigma2 - 1);
      const p1 = [s1 * u1[0], s1 * u1[1]];
      const p2 = [s2 * u2[0], s2 * u2[1]];

      this._drawLinAlgRightAngle(ctx, mapX, mapY, [0, 0], p1, p2, 9, '#34D399');
      this._drawLinAlgArrow(ctx, ox, oy, mapX(p1[0]), mapY(p1[1]), '#22D3EE', { lineWidth: 2.8 });
      this._drawLinAlgArrow(ctx, ox, oy, mapX(p2[0]), mapY(p2[1]), '#F59E0B', { lineWidth: 2.8 });

      const lbl1 = isSpd ? `λ₁=${sigma1}` : `σ₁=${sigma1}`;
      const lbl2 = isSpd ? `λ₂=${sigma2}` : `σ₂=${sigma2}`;
      this._drawLinAlgLabel(ctx, lbl1, mapX(p1[0]) + 8, mapY(p1[1]) - 6, '#67E8F9');
      this._drawLinAlgLabel(ctx, lbl2, mapX(p2[0]) - 8, mapY(p2[1]) - 8, '#FCD34D', 'right');
      this._drawLinAlgHudTag(
        ctx,
        `t=${t.toFixed(2)} · κ=${(s1 / Math.max(1e-6, s2)).toFixed(2)}`,
        padL,
        padT,
        plotW
      );
      ctx.restore();
    }

    ctx.restore();
    this._updateLinAlgVerificationReadout(problem);
  }

  _updateLinAlgVerificationReadout(problem) {
    if (!this.container) return;
    const metrics = this._getLinAlgVerifyMeta(problem).metrics;
    const xEl = this.container.querySelector('[data-verify-x]');
    const fxEl = this.container.querySelector('[data-verify-fx]');
    const exactEl = this.container.querySelector('[data-verify-exact]');
    const numEl = this.container.querySelector('[data-verify-numeric]');
    const matchEl = this.container.querySelector('[data-verify-match]');

    if (xEl) xEl.textContent = metrics[0].value;
    if (fxEl) fxEl.textContent = metrics[1].value;
    if (exactEl) exactEl.textContent = metrics[2].value;
    if (numEl) numEl.textContent = metrics[3].value;
    if (matchEl) matchEl.textContent = 'EXACT ✓';
  }

  /* ========================================================================
     PID Control & Stability High-DPI Verification Canvas
     ======================================================================== */

  _drawPidPoleX(ctx, px, py, color, size = 6) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(px - size, py - size);
    ctx.lineTo(px + size, py + size);
    ctx.moveTo(px - size, py + size);
    ctx.lineTo(px + size, py - size);
    ctx.stroke();
    ctx.restore();
  }

  _drawPidZeroO(ctx, px, py, color, radius = 6) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = '#080B11';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawPidVerificationCanvas(canvas, problem) {
    const vp = problem?.verifyPlot;
    if (!vp) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Studio background fill
    ctx.fillStyle = '#080B11';
    ctx.fillRect(0, 0, width, height);

    const uCursor = Math.max(0, Math.min(1, this.verifyCursorX ?? vp.defaultCursor ?? 0.56));

    if (vp.kind === 'step-compare') {
      const [tMin, tMax] = vp.domain || [0, 3];
      const samples = 220;
      const ts = [];
      const pVals = [];
      const bVals = [];
      const hasBase = typeof vp.baselineFn === 'function';
      const setpoint = Number.isFinite(vp.setpoint) ? vp.setpoint : 1;

      let yMin = Math.min(0, setpoint);
      let yMax = Math.max(0, setpoint);
      for (let i = 0; i <= samples; i++) {
        const t = tMin + (i / samples) * (tMax - tMin);
        const py = vp.primaryFn(t);
        const by = hasBase ? vp.baselineFn(t) : NaN;
        ts.push(t);
        pVals.push(py);
        bVals.push(by);
        if (Number.isFinite(py)) {
          if (py < yMin) yMin = py;
          if (py > yMax) yMax = py;
        }
        if (Number.isFinite(by)) {
          if (by < yMin) yMin = by;
          if (by > yMax) yMax = by;
        }
      }

      const span = Math.max(0.05, yMax - yMin);
      const fyMin = yMin - span * 0.14;
      const fyMax = yMax + span * 0.18;

      const padL = 46;
      const padR = 20;
      const padT = 18;
      const padB = 28;
      const plotW = Math.max(40, width - padL - padR);
      const plotH = Math.max(40, height - padT - padB);
      this.verifyPlotGeom = { padL, padR, padT, padB, plotW, plotH, xMin: 0, xMax: 1 };

      const mapX = (t) => padL + ((t - tMin) / (tMax - tMin)) * plotW;
      const mapY = (y) => padT + (1 - (y - fyMin) / (fyMax - fyMin)) * plotH;

      // Grid & ticks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
      ctx.lineWidth = 1;
      ctx.font = '10px "JetBrains Mono", monospace';
      for (let r = 0; r <= 4; r++) {
        const py = padT + (r / 4) * plotH;
        ctx.beginPath();
        ctx.moveTo(padL, py);
        ctx.lineTo(padL + plotW, py);
        ctx.stroke();
        const tick = fyMax - (r / 4) * (fyMax - fyMin);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.78)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(formatAxisTick(tick), padL - 7, py);
      }
      for (let c = 0; c <= 5; c++) {
        const px = padL + (c / 5) * plotW;
        ctx.beginPath();
        ctx.moveTo(px, padT);
        ctx.lineTo(px, padT + plotH);
        ctx.stroke();
        const tTick = tMin + (c / 5) * (tMax - tMin);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${formatAxisTick(tTick)}s`, px, padT + plotH + 7);
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, plotH);
      ctx.clip();

      // Optional ±2% settling band & vertical Ts marker
      if (vp.tsMarker) {
        const { t: tsVal, label: tsLbl, band = 0.02 } = vp.tsMarker;
        const yTop = mapY(setpoint + band);
        const yBot = mapY(setpoint - band);
        ctx.save();
        ctx.fillStyle = 'rgba(52, 211, 153, 0.12)';
        ctx.fillRect(padL, yTop, plotW, Math.max(2, yBot - yTop));
        const tsPx = mapX(tsVal);
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(tsPx, padT);
        ctx.lineTo(tsPx, padT + plotH);
        ctx.stroke();
        ctx.restore();
        this._drawLinAlgLabel(ctx, tsLbl || 'Ts', tsPx + 6, padT + plotH - 12, '#6EE7B7');
      }

      // Setpoint reference line
      const ySp = mapY(setpoint);
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padL, ySp);
      ctx.lineTo(padL + plotW, ySp);
      ctx.stroke();
      ctx.restore();

      // Optional steady-state error droop bracket (e.g. Type-0)
      if (vp.steadyErrorGap) {
        const yFinPx = mapY(vp.steadyErrorGap.yFinal);
        const bx = padL + plotW - 18;
        ctx.save();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(bx, ySp + 2);
        ctx.lineTo(bx, yFinPx - 2);
        ctx.moveTo(bx - 4, ySp + 2);
        ctx.lineTo(bx + 4, ySp + 2);
        ctx.moveTo(bx - 4, yFinPx - 2);
        ctx.lineTo(bx + 4, yFinPx - 2);
        ctx.stroke();
        ctx.restore();
        this._drawLinAlgLabel(
          ctx,
          vp.steadyErrorGap.label || 'e_ss',
          bx - 8,
          0.5 * (ySp + yFinPx),
          '#FCD34D',
          'right'
        );
      }

      // Baseline comparison curve (Cyan dashed)
      if (hasBase) {
        ctx.save();
        ctx.strokeStyle = '#22D3EE';
        ctx.lineWidth = 2.0;
        ctx.setLineDash([6, 4]);
        ctx.shadowColor = 'rgba(34, 211, 238, 0.45)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let i = 0; i <= samples; i++) {
          const px = mapX(ts[i]);
          const py = mapY(bVals[i]);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Primary response curve (luminous Emerald solid)
      ctx.save();
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2.6;
      ctx.shadowColor = 'rgba(52, 211, 153, 0.65)';
      ctx.shadowBlur = 11;
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const px = mapX(ts[i]);
        const py = mapY(pVals[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      // Interactive time cursor
      const tCur = tMin + uCursor * (tMax - tMin);
      const yCur = vp.primaryFn(tCur);
      const bCur = hasBase ? vp.baselineFn(tCur) : NaN;
      const cxPx = mapX(tCur);

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cxPx, padT);
      ctx.lineTo(cxPx, padT + plotH);
      ctx.stroke();
      ctx.restore();

      if (hasBase && Number.isFinite(bCur)) {
        ctx.save();
        ctx.fillStyle = '#22D3EE';
        ctx.shadowColor = 'rgba(34, 211, 238, 0.9)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cxPx, mapY(bCur), 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (Number.isFinite(yCur)) {
        ctx.save();
        ctx.fillStyle = '#34D399';
        ctx.shadowColor = 'rgba(52, 211, 153, 0.95)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(cxPx, mapY(yCur), 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      }

      const errCur = setpoint - yCur;
      const hudText = `t=${tCur.toFixed(2)}s · y=${yCur.toFixed(3)} · e=${errCur.toFixed(3)}`;
      this._drawLinAlgHudTag(ctx, hudText, padL, padT, plotW);
      ctx.restore();
    } else if (vp.kind === 'ramp-track') {
      const [tMin, tMax] = vp.domain || [0, 3.0];
      const samples = 220;
      const ts = [];
      const rVals = [];
      const yVals = [];
      for (let i = 0; i <= samples; i++) {
        const t = tMin + (i / samples) * (tMax - tMin);
        ts.push(t);
        rVals.push(vp.rampFn(t));
        yVals.push(vp.outputFn(t));
      }

      const fyMin = -0.15;
      const fyMax = Math.max(...rVals) * 1.12;
      const padL = 44;
      const padR = 20;
      const padT = 18;
      const padB = 28;
      const plotW = Math.max(40, width - padL - padR);
      const plotH = Math.max(40, height - padT - padB);
      this.verifyPlotGeom = { padL, padR, padT, padB, plotW, plotH, xMin: 0, xMax: 1 };

      const mapX = (t) => padL + ((t - tMin) / (tMax - tMin)) * plotW;
      const mapY = (y) => padT + (1 - (y - fyMin) / (fyMax - fyMin)) * plotH;

      // Grid & ticks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
      ctx.lineWidth = 1;
      ctx.font = '10px "JetBrains Mono", monospace';
      for (let r = 0; r <= 4; r++) {
        const py = padT + (r / 4) * plotH;
        ctx.beginPath();
        ctx.moveTo(padL, py);
        ctx.lineTo(padL + plotW, py);
        ctx.stroke();
        const tick = fyMax - (r / 4) * (fyMax - fyMin);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.78)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(formatAxisTick(tick), padL - 7, py);
      }
      for (let c = 0; c <= 5; c++) {
        const px = padL + (c / 5) * plotW;
        ctx.beginPath();
        ctx.moveTo(px, padT);
        ctx.lineTo(px, padT + plotH);
        ctx.stroke();
        const tTick = tMin + (c / 5) * (tMax - tMin);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${formatAxisTick(tTick)}s`, px, padT + plotH + 7);
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, plotH);
      ctx.clip();

      // Shaded steady-state lag ribbon between r(t) and y(t)
      ctx.save();
      ctx.fillStyle = 'rgba(34, 211, 238, 0.14)';
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const px = mapX(ts[i]);
        const py = mapY(rVals[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      for (let i = samples; i >= 0; i--) {
        ctx.lineTo(mapX(ts[i]), mapY(yVals[i]));
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Ramp reference r(t) = t (Amber dashed)
      ctx.save();
      ctx.strokeStyle = '#F59E0B';
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(mapX(tMin), mapY(vp.rampFn(tMin)));
      ctx.lineTo(mapX(tMax), mapY(vp.rampFn(tMax)));
      ctx.stroke();
      ctx.restore();

      // Output y(t) (luminous Emerald solid)
      ctx.save();
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2.6;
      ctx.shadowColor = 'rgba(52, 211, 153, 0.65)';
      ctx.shadowBlur = 11;
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const px = mapX(ts[i]);
        const py = mapY(yVals[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      // Interactive cursor with vertical lag segment
      const tCur = tMin + uCursor * (tMax - tMin);
      const rCur = vp.rampFn(tCur);
      const yCur = vp.outputFn(tCur);
      const lag = rCur - yCur;
      const cxPx = mapX(tCur);
      const ryPx = mapY(rCur);
      const yyPx = mapY(yCur);

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(cxPx, padT);
      ctx.lineTo(cxPx, padT + plotH);
      ctx.stroke();
      ctx.restore();

      // Highlighted lag gap bar
      ctx.save();
      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = 2.6;
      ctx.shadowColor = 'rgba(34, 211, 238, 0.85)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(cxPx, ryPx);
      ctx.lineTo(cxPx, yyPx);
      ctx.stroke();
      ctx.restore();

      // Glowing dots on r(t) and y(t)
      [
        { py: ryPx, color: '#F59E0B' },
        { py: yyPx, color: '#34D399' },
      ].forEach(({ py, color }) => {
        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cxPx, py, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      });

      this._drawLinAlgHudTag(
        ctx,
        `t=${tCur.toFixed(2)}s · r=${rCur.toFixed(2)} · y=${yCur.toFixed(2)} · lag=${lag.toFixed(3)}`,
        padL,
        padT,
        plotW
      );
      ctx.restore();
    } else if (vp.kind === 'pole-map') {
      const b = vp.bounds || { minRe: -6, maxRe: 2, minIm: -4, maxIm: 4 };
      const padL = 40;
      const padR = 20;
      const padT = 18;
      const padB = 26;
      const plotW = Math.max(40, width - padL - padR);
      const plotH = Math.max(40, height - padT - padB);
      this.verifyPlotGeom = { padL, padR, padT, padB, plotW, plotH, xMin: 0, xMax: 1 };

      const mapX = (re) => padL + ((re - b.minRe) / (b.maxRe - b.minRe)) * plotW;
      const mapY = (im) => padT + (1 - (im - b.minIm) / (b.maxIm - b.minIm)) * plotH;
      const xZero = mapX(0);
      const yZero = mapY(0);

      // Subtle grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
      ctx.lineWidth = 1;
      ctx.font = '10px "JetBrains Mono", monospace';
      for (let re = Math.ceil(b.minRe); re <= Math.floor(b.maxRe); re++) {
        const px = mapX(re);
        ctx.beginPath();
        ctx.moveTo(px, padT);
        ctx.lineTo(px, padT + plotH);
        ctx.stroke();
        ctx.fillStyle = 'rgba(148, 163, 184, 0.72)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(re), px, padT + plotH + 6);
      }
      const imStep = b.maxIm - b.minIm > 7 ? 2 : 1;
      for (let im = Math.ceil(b.minIm / imStep) * imStep; im <= b.maxIm; im += imStep) {
        const py = mapY(im);
        ctx.beginPath();
        ctx.moveTo(padL, py);
        ctx.lineTo(padL + plotW, py);
        ctx.stroke();
        ctx.fillStyle = 'rgba(148, 163, 184, 0.72)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(im === 0 ? '0' : `${im}j`, padL - 6, py);
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, plotH);
      ctx.clip();

      // Shade Unstable RHP (σ > 0)
      if (b.maxRe > 0) {
        ctx.fillStyle = 'rgba(244, 63, 94, 0.11)';
        ctx.fillRect(xZero, padT, padL + plotW - xZero, plotH);
        ctx.font = '600 9.5px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(251, 113, 133, 0.75)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('UNSTABLE RHP (σ > 0)', padL + plotW - 6, padT + plotH - 5);
      }
      ctx.font = '600 9.5px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(110, 231, 183, 0.6)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('STABLE LHP (σ < 0)', padL + 6, padT + plotH - 5);

      // Emphasized real axis & jω imaginary axis
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(padL, yZero);
      ctx.lineTo(padL + plotW, yZero);
      ctx.stroke();

      ctx.save();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.62)';
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xZero, padT);
      ctx.lineTo(xZero, padT + plotH);
      ctx.stroke();
      ctx.restore();

      if (vp.specRegion) {
        const { minSigma, maxAngleDeg = 45 } = vp.specRegion;
        const slope = Math.tan((maxAngleDeg * Math.PI) / 180);
        const reLeft = b.minRe;
        const reCut = -minSigma;
        ctx.save();
        ctx.fillStyle = 'rgba(52, 211, 153, 0.12)';
        ctx.beginPath();
        ctx.moveTo(mapX(reCut), mapY(minSigma * slope));
        ctx.lineTo(mapX(reLeft), mapY(Math.abs(reLeft) * slope));
        ctx.lineTo(mapX(reLeft), mapY(-Math.abs(reLeft) * slope));
        ctx.lineTo(mapX(reCut), mapY(-minSigma * slope));
        ctx.closePath();
        ctx.fill();

        // Dashed spec boundary (vertical σ = -minSigma + ±angle rays)
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(mapX(reCut), padT);
        ctx.lineTo(mapX(reCut), padT + plotH);
        ctx.moveTo(mapX(0), mapY(0));
        ctx.lineTo(mapX(reLeft), mapY(Math.abs(reLeft) * slope));
        ctx.moveTo(mapX(0), mapY(0));
        ctx.lineTo(mapX(reLeft), mapY(-Math.abs(reLeft) * slope));
        ctx.stroke();
        ctx.restore();
      }

      if (vp.gainSweep) {
        const { a2, a1, kMin, kMax, ku } = vp.gainSweep;
        // Trace smooth root-locus branches across [kMin, kMax]
        const steps = 110;
        const branchPts = [[], [], []];
        for (let i = 0; i <= steps; i++) {
          const kk = kMin + (i / steps) * (kMax - kMin);
          const roots = solveMonicCubicRoots(a2, a1, kk);
          // roots[0] is real negative; roots[1], roots[2] are complex conjugate or remaining real
          branchPts[0].push(roots[0]);
          branchPts[1].push(roots[1]);
          branchPts[2].push(roots[2]);
        }
        branchPts.forEach((pts) => {
          ctx.save();
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.42)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          pts.forEach((p, idx) => {
            const px = mapX(p.re);
            const py = mapY(p.im);
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
          ctx.restore();
        });

        // Mark exact marginal crossing on jω-axis
        const wu = Math.sqrt(a1);
        [wu, -wu].forEach((imVal) => {
          ctx.save();
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(xZero, mapY(imVal), 7.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        });

        let kCur = kMin + uCursor * (kMax - kMin);
        if (Math.abs(kCur - ku) < (kMax - kMin) * 0.025) {
          kCur = ku;
        }
        const curRoots = solveMonicCubicRoots(a2, a1, kCur);
        const isMarginal = Math.abs(kCur - ku) < 1e-4;
        const isUnstable = kCur > ku + 1e-4;

        curRoots.forEach((r, idx) => {
          const px = mapX(r.re);
          const py = mapY(r.im);
          const color =
            r.re > 0.03 ? '#FB7185' : Math.abs(r.re) <= 0.03 ? '#F59E0B' : '#34D399';
          this._drawPidPoleX(ctx, px, py, color, 6.5);
          if (idx === 1 && Math.abs(r.im) > 0.05) {
            const lbl = `${r.re >= 0 ? '+' : ''}${r.re.toFixed(2)} ± ${r.im.toFixed(2)}j`;
            this._drawLinAlgLabel(ctx, lbl, px + 10, py - 8, color);
          } else if (idx === 0) {
            this._drawLinAlgLabel(ctx, `${r.re.toFixed(2)}`, px, py - 12, '#6EE7B7', 'center');
          }
        });

        const statusStr = isMarginal
          ? `K=${ku} (Ku) · MARGINAL`
          : isUnstable
            ? `K=${kCur.toFixed(1)} > ${ku} · UNSTABLE`
            : `K=${kCur.toFixed(1)} < ${ku} · STABLE`;
        this._drawLinAlgHudTag(ctx, statusStr, padL, padT, plotW);
      } else if (vp.circleLocus) {
        const { centerRe = -2, radius = 2, realSeg = [-6.5, -2], kMin = 0.2, kMax = 12 } =
          vp.circleLocus;
        const z = -centerRe; // e.g., z = 2 for L(s) = K(s+z)/s^2

        // 45° Butterworth damping rays (ζ = 0.707)
        ctx.save();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(xZero, yZero);
        ctx.lineTo(mapX(b.minRe), mapY(Math.abs(b.minRe)));
        ctx.moveTo(xZero, yZero);
        ctx.lineTo(mapX(b.minRe), mapY(-Math.abs(b.minRe)));
        ctx.stroke();
        ctx.restore();

        // Real-axis locus segment (-∞, -z)
        ctx.save();
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(mapX(realSeg[0]), yZero);
        ctx.lineTo(mapX(realSeg[1]), yZero);
        ctx.stroke();
        ctx.restore();

        // Exact circular locus (centerRe, 0) with radius R
        ctx.save();
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.65)';
        ctx.lineWidth = 2.0;
        ctx.shadowColor = 'rgba(34, 211, 238, 0.4)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const ang = (i / 120) * Math.PI * 2;
          const px = mapX(centerRe + radius * Math.cos(ang));
          const py = mapY(radius * Math.sin(ang));
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // Open-loop zero at centerRe and break-in marker at -2z
        this._drawPidZeroO(ctx, mapX(centerRe), yZero, '#34D399', 6.5);
        this._drawLinAlgLabel(ctx, `z=${centerRe}`, mapX(centerRe), yZero + 15, '#6EE7B7', 'center');

        // Interactive gain K sweep for s^2 + K*s + K*z = 0
        let kCur = kMin + uCursor * (kMax - kMin);
        if (Math.abs(kCur - 2 * z) < 0.25) kCur = 2 * z;
        if (Math.abs(kCur - 4 * z) < 0.25) kCur = 4 * z;

        const disc = kCur * kCur - 4 * kCur * z;
        let roots;
        let hudStr;
        if (disc < 0) {
          const re = -0.5 * kCur;
          const im = 0.5 * Math.sqrt(-disc);
          const zeta = Math.abs(re) / Math.hypot(re, im);
          roots = [
            { re, im },
            { re, im: -im },
          ];
          hudStr = `K=${kCur.toFixed(1)} · s=${re.toFixed(2)}±${im.toFixed(2)}j · ζ=${zeta.toFixed(2)}`;
        } else {
          const sq = Math.sqrt(disc);
          const r1 = 0.5 * (-kCur + sq);
          const r2 = 0.5 * (-kCur - sq);
          roots = [
            { re: r1, im: 0 },
            { re: r2, im: 0 },
          ];
          hudStr = `K=${kCur.toFixed(1)} · s=${r1.toFixed(2)}, ${r2.toFixed(2)} (ζ≥1)`;
        }

        roots.forEach((r, idx) => {
          const px = mapX(r.re);
          const py = mapY(r.im);
          this._drawPidPoleX(ctx, px, py, '#34D399', 6.5);
          if (idx === 0 && Math.abs(r.im) > 0.05) {
            this._drawLinAlgLabel(
              ctx,
              `${r.re.toFixed(2)}±${r.im.toFixed(2)}j`,
              px + 10,
              py - 8,
              '#6EE7B7'
            );
          }
        });

        this._drawLinAlgHudTag(ctx, hudStr, padL, padT, plotW);
      } else {
        // Static poles & optional zeros
        const poles = Array.isArray(vp.poles) ? vp.poles : [];
        const zeros = Array.isArray(vp.zeros) ? vp.zeros : [];

        poles.forEach((p) => {
          const px = mapX(p.re);
          const py = mapY(p.im);
          const color =
            p.status === 'rhp' ? '#FB7185' : p.status === 'marginal' ? '#F59E0B' : '#34D399';
          this._drawPidPoleX(ctx, px, py, color, 6.5);
          if (p.label) {
            const dy = p.im > 0 ? -12 : p.im < 0 ? 14 : -13;
            this._drawLinAlgLabel(
              ctx,
              p.label,
              px + (p.re >= 0 ? 8 : 0),
              py + dy,
              color,
              p.re >= 0 ? 'left' : 'center'
            );
          }
        });

        zeros.forEach((z) => {
          const px = mapX(z.re);
          const py = mapY(z.im);
          this._drawPidZeroO(ctx, px, py, vp.specRegion ? '#22D3EE' : '#34D399', 6.5);
          if (z.label) {
            this._drawLinAlgLabel(
              ctx,
              z.label,
              px,
              py + 15,
              vp.specRegion ? '#67E8F9' : '#6EE7B7',
              'center'
            );
          }
        });

        const rhpCount = poles.filter((p) => p.re > 1e-6).length;
        const defaultHud =
          zeros.length > 0
            ? `Poles (×) · Zeros (○) · All LHP`
            : rhpCount > 0
              ? `${rhpCount} RHP Unstable · ${poles.length - rhpCount} LHP Stable`
              : `All ${poles.length} Poles Stable`;
        this._drawLinAlgHudTag(ctx, vp.hudLabel || defaultHud, padL, padT, plotW);
      }

      ctx.restore();
    } else if (vp.kind === 'nyquist-circle') {
      const b = vp.bounds || { minRe: -3.2, maxRe: 0.8, minIm: -1.8, maxIm: 1.8 };
      const kMin = vp.kMin || 0.6;
      const kMax = vp.kMax || 5.5;
      const kCrit = vp.kCrit || 2.0;

      const padL = 42;
      const padR = 20;
      const padT = 18;
      const padB = 26;
      const plotW = Math.max(40, width - padL - padR);
      const plotH = Math.max(40, height - padT - padB);
      this.verifyPlotGeom = { padL, padR, padT, padB, plotW, plotH, xMin: 0, xMax: 1 };

      // Keep isotropic aspect so the Nyquist circle renders as a true circle
      const spanRe = b.maxRe - b.minRe;
      const spanIm = b.maxIm - b.minIm;
      const scale = Math.min(plotW / spanRe, plotH / spanIm);
      const cxMid = padL + plotW * 0.5;
      const cyMid = padT + plotH * 0.5;
      const reMid = 0.5 * (b.minRe + b.maxRe);
      const imMid = 0.5 * (b.minIm + b.maxIm);
      const mapX = (re) => cxMid + (re - reMid) * scale;
      const mapY = (im) => cyMid - (im - imMid) * scale;

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
      ctx.lineWidth = 1;
      ctx.font = '10px "JetBrains Mono", monospace';
      for (let re = Math.ceil(b.minRe); re <= Math.floor(b.maxRe); re++) {
        const px = mapX(re);
        if (px < padL || px > padL + plotW) continue;
        ctx.beginPath();
        ctx.moveTo(px, padT);
        ctx.lineTo(px, padT + plotH);
        ctx.stroke();
        ctx.fillStyle = re === -1 ? '#FCD34D' : 'rgba(148, 163, 184, 0.72)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(re), px, padT + plotH + 6);
      }
      for (let im = -2; im <= 2; im++) {
        const py = mapY(im);
        if (py < padT || py > padT + plotH) continue;
        ctx.beginPath();
        ctx.moveTo(padL, py);
        ctx.lineTo(padL + plotW, py);
        ctx.stroke();
        ctx.fillStyle = 'rgba(148, 163, 184, 0.72)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(im === 0 ? '0' : `${im}j`, padL - 6, py);
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, plotH);
      ctx.clip();

      // Axes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(padL, mapY(0));
      ctx.lineTo(padL + plotW, mapY(0));
      ctx.moveTo(mapX(0), padT);
      ctx.lineTo(mapX(0), padT + plotH);
      ctx.stroke();

      // Interactive K sweep (snaps gently near K=2)
      let kCur = kMin + uCursor * (kMax - kMin);
      if (Math.abs(kCur - kCrit) < 0.12) kCur = kCrit;
      const isStable = kCur > kCrit + 1e-4;
      const isCrit = Math.abs(kCur - kCrit) <= 1e-4;
      const loopColor = isStable ? '#34D399' : isCrit ? '#F59E0B' : '#FB7185';
      const loopFill = isStable
        ? 'rgba(52, 211, 153, 0.11)'
        : isCrit
          ? 'rgba(245, 158, 11, 0.11)'
          : 'rgba(251, 113, 133, 0.11)';

      // Nyquist circle for L(jω) = K / (jω - 2): center (-K/4, 0), radius K/4
      const cRe = -kCur / 4;
      const rVal = kCur / 4;
      const cPx = mapX(cRe);
      const cPy = mapY(0);
      const rPx = rVal * scale;

      ctx.save();
      ctx.fillStyle = loopFill;
      ctx.strokeStyle = loopColor;
      ctx.lineWidth = 2.4;
      ctx.shadowColor = loopColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cPx, cPy, rPx, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // CCW direction chevrons on top & bottom of circle
      [
        { x: cPx, y: cPy - rPx, dir: -1 }, // top moves left (CCW)
        { x: cPx, y: cPy + rPx, dir: 1 }, // bottom moves right (CCW)
      ].forEach(({ x, y, dir }) => {
        ctx.save();
        ctx.fillStyle = loopColor;
        ctx.beginPath();
        ctx.moveTo(x + dir * 6, y);
        ctx.lineTo(x - dir * 4, y - 4.5);
        ctx.lineTo(x - dir * 4, y + 4.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // Leftmost intercept L(0) = -K/2
      const leftPx = mapX(-kCur / 2);
      ctx.save();
      ctx.fillStyle = loopColor;
      ctx.beginPath();
      ctx.arc(leftPx, cPy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      this._drawLinAlgLabel(ctx, `−K/2=${(-kCur / 2).toFixed(2)}`, leftPx, cPy - 14, loopColor, 'center');

      // Critical point -1 + j0
      const critPx = mapX(-1);
      this._drawPidPoleX(ctx, critPx, cPy, '#F59E0B', 6.5);
      this._drawLinAlgLabel(ctx, '−1 + j0', critPx, cPy + 16, '#FCD34D', 'center');

      const hud = isStable
        ? `K=${kCur.toFixed(2)} > 2 · N=−1 (CCW) · Z=0 STABLE`
        : isCrit
          ? `K=2.00 · Hits −1 · MARGINAL`
          : `K=${kCur.toFixed(2)} < 2 · N=0 · Z=1 UNSTABLE`;
      this._drawLinAlgHudTag(ctx, hud, padL, padT, plotW);
      ctx.restore();
    } else if (vp.kind === 'bode-margin' && vp.sensitivityMode) {
      const wMin = vp.wMin || 0.1;
      const wMax = vp.wMax || 30;
      const logMin = Math.log10(wMin);
      const logMax = Math.log10(wMax);

      const padL = 48;
      const padR = 18;
      const padT = 14;
      const padB = 24;
      const gap = 14;
      const plotW = Math.max(40, width - padL - padR);
      const availH = Math.max(60, height - padT - padB - gap);
      const topH = availH * 0.54;
      const botH = availH * 0.46;
      const topY = padT;
      const botY = padT + topH + gap;

      this.verifyPlotGeom = { padL, padR, padT, padB, plotW, plotH: availH + gap, xMin: 0, xMax: 1 };

      const mapW = (w) => padL + ((Math.log10(w) - logMin) / (logMax - logMin)) * plotW;
      const stMin = vp.magMin ?? -28;
      const stMax = vp.magMax ?? 12;
      const lMin = -32;
      const lMax = 32;
      const mapST = (db) => topY + (1 - (db - stMin) / (stMax - stMin)) * topH;
      const mapL = (db) => botY + (1 - (db - lMin) / (lMax - lMin)) * botH;

      ctx.font = '9.5px "JetBrains Mono", monospace';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(padL, topY, plotW, topH);
      ctx.strokeRect(padL, botY, plotW, botH);

      [-20, 0, 6].forEach((db) => {
        const py = mapST(db);
        if (py < topY || py > topY + topH) return;
        ctx.strokeStyle = db === 0 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(padL, py);
        ctx.lineTo(padL + plotW, py);
        ctx.stroke();
        ctx.fillStyle = db === 0 ? '#E2E8F0' : 'rgba(148, 163, 184, 0.72)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${db}dB`, padL - 6, py);
      });

      [-20, 0, 20].forEach((db) => {
        const py = mapL(db);
        ctx.strokeStyle = db === 0 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(padL, py);
        ctx.lineTo(padL + plotW, py);
        ctx.stroke();
        ctx.fillStyle = db === 0 ? '#E2E8F0' : 'rgba(148, 163, 184, 0.72)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${db}dB`, padL - 6, py);
      });

      [0.1, 0.3, 1, 3, 10, 30].forEach((wt) => {
        if (wt < wMin - 1e-6 || wt > wMax + 1e-6) return;
        const px = mapW(wt);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
        ctx.beginPath();
        ctx.moveTo(px, topY);
        ctx.lineTo(px, topY + topH);
        ctx.moveTo(px, botY);
        ctx.lineTo(px, botY + botH);
        ctx.stroke();
        ctx.fillStyle = 'rgba(148, 163, 184, 0.78)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(wt), px, botY + botH + 5);
      });

      const samples = 200;
      const ws = [];
      for (let i = 0; i <= samples; i++) {
        ws.push(Math.pow(10, logMin + (i / samples) * (logMax - logMin)));
      }

      // Top panel: |S(jω)| (Cyan) & |T(jω)| (Emerald)
      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, topY, plotW, topH);
      ctx.clip();

      [
        { fn: vp.sDbFn, color: '#22D3EE', glow: 'rgba(34, 211, 238, 0.5)' },
        { fn: vp.tDbFn, color: '#34D399', glow: 'rgba(52, 211, 153, 0.5)' },
      ].forEach(({ fn, color, glow }) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.3;
        ctx.shadowColor = glow;
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ws.forEach((w, i) => {
          const px = mapW(w);
          const py = mapST(fn(w));
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.restore();
      });

      if (vp.msPeak) {
        const mPx = mapW(vp.msPeak.w);
        const mPy = mapST(vp.msPeak.db);
        ctx.fillStyle = '#F59E0B';
        ctx.shadowColor = 'rgba(245, 158, 11, 0.9)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(mPx, mPy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        this._drawLinAlgLabel(ctx, `Ms=${vp.msPeak.val} (+${vp.msPeak.db.toFixed(1)}dB)`, mPx + 8, mPy - 6, '#FCD34D');
      }
      ctx.restore();

      // Bottom panel: |L(jω)| (Amber)
      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, botY, plotW, botH);
      ctx.clip();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ws.forEach((w, i) => {
        const px = mapW(w);
        const py = mapL(vp.magDbFn(w));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      const wgcPx = mapW(vp.wGc);
      ctx.fillStyle = '#34D399';
      ctx.beginPath();
      ctx.arc(wgcPx, mapL(0), 4, 0, Math.PI * 2);
      ctx.fill();
      this._drawLinAlgLabel(ctx, `|L|=0dB (ω=${vp.wGc})`, wgcPx + 8, mapL(0) - 7, '#6EE7B7');
      ctx.restore();

      // Interactive frequency cursor
      const wCur = Math.pow(10, logMin + uCursor * (logMax - logMin));
      const curPx = mapW(wCur);
      const sCur = vp.sDbFn(wCur);
      const tCur = vp.tDbFn(wCur);
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(curPx, topY);
      ctx.lineTo(curPx, botY + botH);
      ctx.stroke();
      ctx.restore();

      const hud = `ω=${wCur.toFixed(2)} · |S|=${sCur.toFixed(1)}dB · |T|=${tCur.toFixed(1)}dB`;
      this._drawLinAlgHudTag(ctx, hud, padL, topY, plotW);
    } else if (vp.kind === 'bode-margin') {
      const wMin = vp.wMin || 0.1;
      const wMax = vp.wMax || 10;
      const logMin = Math.log10(wMin);
      const logMax = Math.log10(wMax);
      const hasDelay = typeof vp.delayedPhaseDegFn === 'function';

      const padL = 48;
      const padR = 18;
      const padT = 14;
      const padB = 24;
      const gap = 14;
      const plotW = Math.max(40, width - padL - padR);
      const availH = Math.max(60, height - padT - padB - gap);
      const magH = availH * 0.46;
      const phH = availH * 0.54;
      const magTop = padT;
      const phTop = padT + magH + gap;

      this.verifyPlotGeom = { padL, padR, padT, padB, plotW, plotH: availH + gap, xMin: 0, xMax: 1 };

      const mapW = (w) => padL + ((Math.log10(w) - logMin) / (logMax - logMin)) * plotW;

      const magMin = Number.isFinite(vp.magMin) ? vp.magMin : -32;
      const magMax = Number.isFinite(vp.magMax) ? vp.magMax : 32;
      const phMin = Number.isFinite(vp.phMin) ? vp.phMin : hasDelay ? -235 : -205;
      const phMax = Number.isFinite(vp.phMax) ? vp.phMax : -80;
      const mapMag = (db) => magTop + (1 - (db - magMin) / (magMax - magMin)) * magH;
      const mapPh = (deg) => phTop + (1 - (deg - phMin) / (phMax - phMin)) * phH;

      // Grid lines & ticks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
      ctx.lineWidth = 1;
      ctx.font = '9.5px "JetBrains Mono", monospace';

      // Panel borders
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(padL, magTop, plotW, magH);
      ctx.strokeRect(padL, phTop, plotW, phH);

      // Magnitude ticks
      [-20, 0, 20, 40].forEach((db) => {
        if (db < magMin || db > magMax) return;
        const py = mapMag(db);
        ctx.strokeStyle = db === 0 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(padL, py);
        ctx.lineTo(padL + plotW, py);
        ctx.stroke();
        ctx.fillStyle = db === 0 ? '#E2E8F0' : 'rgba(148, 163, 184, 0.72)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${db}dB`, padL - 6, py);
      });

      // Phase ticks
      [0, -45, -90, -135, -180].forEach((deg) => {
        if (deg < phMin || deg > phMax) return;
        const py = mapPh(deg);
        if (py < phTop || py > phTop + phH) return;
        ctx.save();
        if (deg === -180) {
          ctx.strokeStyle = 'rgba(251, 113, 133, 0.65)';
          ctx.setLineDash([5, 4]);
          ctx.lineWidth = 1.4;
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
        }
        ctx.beginPath();
        ctx.moveTo(padL, py);
        ctx.lineTo(padL + plotW, py);
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = deg === -180 ? '#FDA4AF' : 'rgba(148, 163, 184, 0.72)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${deg}°`, padL - 6, py);
      });

      // Frequency grid & labels
      const freqTicks = [0.01, 0.03, 0.1, 0.3, 0.5, 1, 2, 3, 5, 10, 25, 50].filter(
        (wt) => wt >= wMin - 1e-6 && wt <= wMax + 1e-6
      );
      let lastTickPx = -999;
      freqTicks.forEach((wt) => {
        const px = mapW(wt);
        if (px - lastTickPx < 30) return;
        lastTickPx = px;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
        ctx.beginPath();
        ctx.moveTo(px, magTop);
        ctx.lineTo(px, magTop + magH);
        ctx.moveTo(px, phTop);
        ctx.lineTo(px, phTop + phH);
        ctx.stroke();
        ctx.fillStyle = 'rgba(148, 163, 184, 0.78)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(wt), px, phTop + phH + 5);
      });

      const samples = 200;
      const ws = [];
      for (let i = 0; i <= samples; i++) {
        ws.push(Math.pow(10, logMin + (i / samples) * (logMax - logMin)));
      }

      // Vertical ω_gc crossover guide spanning both panels
      const wgcPx = mapW(vp.wGc);
      ctx.save();
      ctx.strokeStyle = vp.peakMarker ? 'rgba(245, 158, 11, 0.48)' : 'rgba(52, 211, 153, 0.48)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(wgcPx, magTop);
      ctx.lineTo(wgcPx, phTop + phH);
      ctx.stroke();
      ctx.restore();

      // Optional vertical ω_pc phase-crossover guide
      if (Number.isFinite(vp.wPc)) {
        const wpcPx = mapW(vp.wPc);
        ctx.save();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.48)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(wpcPx, magTop);
        ctx.lineTo(wpcPx, phTop + phH);
        ctx.stroke();
        ctx.restore();
      }

      // Top panel: Magnitude curve (clipped)
      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, magTop, plotW, magH);
      ctx.clip();
      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = 2.3;
      ctx.shadowColor = 'rgba(34, 211, 238, 0.55)';
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ws.forEach((w, i) => {
        const px = mapW(w);
        const py = mapMag(vp.magDbFn(w));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      if (vp.peakMarker) {
        const pPx = mapW(vp.peakMarker.w);
        const pPy = mapMag(vp.peakMarker.db);
        ctx.fillStyle = '#F59E0B';
        ctx.shadowColor = 'rgba(245, 158, 11, 0.9)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(pPx, pPy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        this._drawLinAlgLabel(ctx, vp.peakMarker.label, pPx - 8, pPy - 10, '#FCD34D', 'right');
      } else {
        // Glowing dot at (ω_gc, 0 dB)
        ctx.fillStyle = '#34D399';
        ctx.shadowColor = 'rgba(52, 211, 153, 0.9)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(wgcPx, mapMag(0), 4.5, 0, Math.PI * 2);
        ctx.fill();
        this._drawLinAlgLabel(ctx, `ω_gc=${vp.wGc}`, wgcPx + 8, mapMag(0) - 8, '#6EE7B7');
      }

      // Optional Gain Margin vertical bracket at ω_pc
      if (Number.isFinite(vp.wPc)) {
        const wpcPx = mapW(vp.wPc);
        const magPcDb = vp.magDbFn(vp.wPc);
        const y0 = mapMag(0);
        const yPc = mapMag(magPcDb);
        ctx.save();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.4;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.85)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(wpcPx, y0);
        ctx.lineTo(wpcPx, yPc);
        ctx.stroke();
        ctx.restore();
        this._drawLinAlgLabel(
          ctx,
          `GM=+${(vp.gmDb ?? -magPcDb).toFixed(1)}dB`,
          wpcPx + 8,
          0.5 * (y0 + yPc),
          '#FCD34D'
        );
      }
      ctx.restore();

      // Bottom panel: Phase curve(s) & PM bracket (clipped)
      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, phTop, plotW, phH);
      ctx.clip();

      // Nominal phase curve
      ctx.save();
      ctx.strokeStyle = hasDelay ? '#22D3EE' : '#34D399';
      ctx.lineWidth = hasDelay ? 2.0 : 2.4;
      if (hasDelay) ctx.setLineDash([5, 4]);
      ctx.shadowColor = hasDelay ? 'rgba(34, 211, 238, 0.45)' : 'rgba(52, 211, 153, 0.55)';
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ws.forEach((w, i) => {
        const px = mapW(w);
        const py = mapPh(vp.phaseDegFn(w));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.restore();

      // Optional delayed phase curve (Amber solid)
      if (hasDelay) {
        ctx.save();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.4;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.65)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ws.forEach((w, i) => {
          const px = mapW(w);
          const py = mapPh(vp.delayedPhaseDegFn(w));
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.restore();
      }

      // Phase Margin vertical arrow at ω_gc between -180° and nominal ∠L(jω_gc)
      if (!vp.hidePmBracket) {
        const phGc = vp.phaseDegFn(vp.wGc);
        const y180 = mapPh(-180);
        const yPhGc = mapPh(phGc);
        ctx.save();
        ctx.strokeStyle = '#34D399';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(52, 211, 153, 0.85)';
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.moveTo(wgcPx, y180);
        ctx.lineTo(wgcPx, yPhGc);
        ctx.stroke();
        ctx.restore();

        this._drawLinAlgLabel(
          ctx,
          hasDelay ? `PM=60° → 0° at τ_max` : `PM = ${vp.pmDeg}°`,
          wgcPx + 8,
          0.5 * (y180 + yPhGc),
          '#6EE7B7'
        );
      }
      ctx.restore();

      // Interactive frequency cursor spanning both panels
      const wCur = Math.pow(10, logMin + uCursor * (logMax - logMin));
      const curPx = mapW(wCur);
      const curDb = vp.magDbFn(wCur);
      const curPh = hasDelay ? vp.delayedPhaseDegFn(wCur) : vp.phaseDegFn(wCur);

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(curPx, magTop);
      ctx.lineTo(curPx, phTop + phH);
      ctx.stroke();
      ctx.restore();

      const curMagY = mapMag(curDb);
      if (curMagY >= magTop && curMagY <= magTop + magH) {
        ctx.save();
        ctx.fillStyle = '#22D3EE';
        ctx.beginPath();
        ctx.arc(curPx, curMagY, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.restore();
      }
      const curPhY = mapPh(curPh);
      if (curPhY >= phTop && curPhY <= phTop + phH) {
        ctx.save();
        ctx.fillStyle = hasDelay ? '#F59E0B' : '#34D399';
        ctx.beginPath();
        ctx.arc(curPx, curPhY, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.restore();
      }

      const hudPrefix = vp.peakMarker ? '|T|' : '|L|';
      const hud = `ω=${wCur.toFixed(2)} rad/s · ${hudPrefix}=${curDb.toFixed(1)} dB · ∠=${curPh.toFixed(1)}°`;
      this._drawLinAlgHudTag(ctx, hud, padL, magTop, plotW);
    }

    ctx.restore();
    this._updatePidVerificationReadout(problem);
  }

  _updatePidVerificationReadout(problem) {
    if (!this.container) return;
    const metrics = this._getPidVerifyMeta(problem).metrics;
    const xEl = this.container.querySelector('[data-verify-x]');
    const fxEl = this.container.querySelector('[data-verify-fx]');
    const exactEl = this.container.querySelector('[data-verify-exact]');
    const numEl = this.container.querySelector('[data-verify-numeric]');
    const matchEl = this.container.querySelector('[data-verify-match]');

    if (xEl) xEl.textContent = metrics[0].value;
    if (fxEl) fxEl.textContent = metrics[1].value;
    if (exactEl) exactEl.textContent = metrics[2].value;
    if (numEl) numEl.textContent = metrics[3].value;
    if (matchEl) matchEl.textContent = 'VERIFIED ✓';
  }
}
