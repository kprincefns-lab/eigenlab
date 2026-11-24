/**
 * EIGENLAB — Controls 01: Physical Modeling, Transfer Functions & s-Plane Dynamics
 * 10 deep, engineering-grade, multi-part (5–6 steps each) control problems taking real
 * physical systems end-to-end: Governing Physics ODE → Laplace Transfer Function →
 * Canonical Parameters (ωn, ζ, Kdc) → Exact s-Plane Poles → Unity Feedback Loop →
 * Physical / Gain Redesign.
 *
 * Every step includes:
 *  - whyThisStep  : Spoiler-free engineering rationale shown while solving.
 *  - systemImpact : Physical takeaway revealed on lock-in & pinned in the ledger.
 *
 * Color convention inside KaTeX highlights:
 *  - Cyan   (#22D3EE): Plant physics / open-loop G(s) / state variables
 *  - Amber  (#F59E0B): Controller gain K / target specs (ωn, ζ, Ts) / redesign target
 *  - Emerald(#34D399): Solved result / closed-loop T(s) / s-plane poles
 */

export const MODELING_SOLVER_TIERS = [
  { id: 'all', label: 'All Tiers' },
  { id: 'mechanical', label: 'Mass-Spring' },
  { id: 'circuits', label: 'RLC Circuits' },
  { id: 'electromech', label: 'Motors & Thermal' },
  { id: 'closed-loop-s', label: 'Closed-Loop s-Plane' },
];

export const MODELING_PROBLEMS = [
  // =========================================================================
  // TIER 1: MECHANICAL MASS-SPRING-DAMPER & ROTATIONAL (3 problems)
  // =========================================================================
  {
    id: 'mod1-msd-underdamped',
    tier: 'mechanical',
    tierLabel: 'Mass-Spring',
    title: 'Mass-Spring-Damper Full Pipeline',
    mechatronicsContext:
      'A precision voice-coil stage riding on titanium flexures and an eddy-current damper obeys second-order translational mechanics; mapping its open-loop parameters through proportional feedback exposes how gain trades stiffness for damping.',
    expressionLatex: 'm=1,\\; c=6,\\; k=25 \\;\\;(\\text{MSD} \\to \\text{CL})',
    finalAnswerLatex:
      'T(s)=\\frac{11}{s^2+6s+36}, \\quad s_{\\text{CL}}=-3\\pm 3\\sqrt{3}\\,j, \\quad c_{\\text{crit}}=12',
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 2.2],
      setpoint: 11 / 36,
      setpointLabel: 'CL DC Gain = 11/36',
      primaryLabel: 'Redesigned c=12 (ζ=1)',
      baselineLabel: 'Closed-Loop c=6 (ζ=0.5)',
      primaryFn: (t) => (11 / 36) * (1 - (1 + 6 * t) * Math.exp(-6 * t)),
      baselineFn: (t) =>
        (11 / 36) *
        (1 -
          Math.exp(-3 * t) *
            (Math.cos(3 * Math.sqrt(3) * t) +
              (1 / Math.sqrt(3)) * Math.sin(3 * Math.sqrt(3) * t))),
      defaultCursor: 0.36,
      subtitle:
        'Hover or drag across time $t$ to compare the ringing closed-loop stage ($c=6,\\;\\zeta=0.5$, Cyan dashed) against the critically damped redesign ($c=12,\\;\\zeta=1$, Emerald).',
      domainMeta: 'Closed-Loop Step · k_eff = 36 · c = 6 vs c_crit = 12',
      metrics: [
        { label: 'OL Poles', value: '−3 ± 4j (ζ=0.6)' },
        { label: 'CL Poles (Kp=11)', value: '−3 ± 5.20j (ζ=0.5)' },
        { label: 'CL Settling Ts', value: '≈ 1.33 s (unchanged)' },
        { label: 'Redesign c_crit', value: '12 N·s/m ✓' },
      ],
    },
    steps: [
      {
        stepType: 'ode_fbd',
        badge: "Newton's 2nd Law ODE",
        whyThisStep:
          "Writing Newton's 2nd law in the time domain separates kinetic energy storage ($m\\ddot{x}$), elastic storage ($kx$), and viscous dissipation ($c\\dot{x}$) before transforming to algebra.",
        systemImpact:
          'Every positive coefficient ($m, c, k > 0$) guarantees passive energy dissipation, so the unforced open-loop stage is strictly stable and settles back to equilibrium.',
        prompt:
          'Apply a free-body force balance $\\sum F = m\\ddot{x}$ with applied input force $f(t)$ opposing spring force $kx$ and damper force $c\\dot{x}$ for $m=1,\\; c=6,\\; k=25$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{m}\\ddot{x} + \\textcolor{#F59E0B}{c}\\dot{x} + \\textcolor{#22D3EE}{k}x = f(t)',
        options: [
          {
            id: 'a',
            latex: '\\ddot{x} + 6\\dot{x} + 25x = f(t)',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\ddot{x} - 6\\dot{x} - 25x = f(t)',
            correct: false,
            misconception:
              'Spring ($-kx$) and damper ($-c\\dot{x}$) oppose motion on the force side ($f - c\\dot{x} - kx = m\\ddot{x}$), so moving them to the left gives positive signs.',
          },
          {
            id: 'c',
            latex: '6\\ddot{x} + 25\\dot{x} + x = f(t)',
            correct: false,
            misconception:
              'Match each physical parameter to its derivative order: mass $m=1$ multiplies $\\ddot{x}$, damper $c=6$ multiplies $\\dot{x}$, and spring $k=25$ multiplies $x$.',
          },
          {
            id: 'd',
            latex: '\\ddot{x} + 25\\dot{x} + 6x = f(t)',
            correct: false,
            misconception:
              'Do not swap damping $c=6$ (proportional to velocity $\\dot{x}$) with stiffness $k=25$ (proportional to displacement $x$).',
          },
        ],
        lockedLabel: 'Governing ODE',
        lockedResultLatex: '\\textcolor{#34D399}{\\ddot{x} + 6\\dot{x} + 25x = f(t)}',
        hint: 'From $f(t) - c\\dot{x} - kx = m\\ddot{x}$, move all $x$-terms to the left side.',
      },
      {
        stepType: 'laplace_tf',
        badge: 'Laplace Transfer Function',
        whyThisStep:
          'The Laplace transform converts differential operators into powers of $s$ under zero initial conditions, turning cascaded blocks and feedback loops into rational algebra.',
        systemImpact:
          'The denominator $s^2 + 6s + 25$ is the plant characteristic polynomial — its roots completely determine the natural modes regardless of what force waveform drives the stage.',
        prompt:
          'Take $\\mathcal{L}\\{\\cdot\\}$ of $\\ddot{x} + 6\\dot{x} + 25x = f(t)$ with zero initial conditions and form the open-loop transfer function $G(s) = X(s)/F(s)$.',
        highlightLatex:
          '(\\textcolor{#22D3EE}{s^2 + 6s + 25})\\,X(s) = F(s) \\implies G(s) = \\frac{X(s)}{F(s)}',
        options: [
          {
            id: 'a',
            latex: 'G(s) = \\frac{25}{s^2 + 6s + 25}',
            correct: false,
            misconception:
              'The input $f(t)$ has coefficient $1$, not $k=25$, so the numerator of $X(s)/F(s)$ is $1$ (giving DC compliance $1/k = 1/25$).',
          },
          {
            id: 'b',
            latex: 'G(s) = \\frac{1}{s^2 + 6s + 25}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'G(s) = \\frac{s}{s^2 + 6s + 25}',
            correct: false,
            misconception:
              'A numerator factor of $s$ would represent velocity output $\\dot{X}(s)/F(s)$, not displacement $X(s)/F(s)$.',
          },
          {
            id: 'd',
            latex: 'G(s) = s^2 + 6s + 25',
            correct: false,
            misconception:
              'That is the dynamic stiffness $F(s)/X(s)$; the compliance transfer function $X(s)/F(s)$ is its reciprocal.',
          },
        ],
        lockedLabel: 'Open-Loop G(s)',
        lockedResultLatex: 'G(s) = \\textcolor{#34D399}{\\frac{1}{s^2 + 6s + 25}}',
        hint: 'Divide $X(s)$ by $F(s)$ directly from $(s^2 + 6s + 25)X(s) = F(s)$.',
      },
      {
        stepType: 'canonical_params',
        badge: 'Extract ωn, ζ & K_dc',
        whyThisStep:
          'Normalizing any second-order plant into $(\\omega_n, \\zeta, K_{dc})$ lets engineers predict overshoot, speed, and steady-state deflection without ever solving the ODE.',
        systemImpact:
          'With $\\zeta = 0.6 < 1$ and $\\omega_n = 5\\text{ rad/s}$, the open-loop stage is moderately underdamped (~9.5% step overshoot) and deflects $0.04\\text{ m}$ per Newton at DC.',
        prompt:
          'Match $s^2 + 6s + 25$ to $s^2 + 2\\zeta\\omega_n s + \\omega_n^2$ and evaluate $K_{dc} = G(0)$ to classify the open-loop dynamics.',
        highlightLatex:
          's^2 + \\textcolor{#F59E0B}{6}s + \\textcolor{#22D3EE}{25} \\equiv s^2 + 2\\textcolor{#F59E0B}{\\zeta}\\textcolor{#22D3EE}{\\omega_n}s + \\textcolor{#22D3EE}{\\omega_n}^2',
        options: [
          {
            id: 'a',
            latex: '\\omega_n = 25,\\; \\zeta = 0.12\\;(\\text{Underdamped}),\\; K_{dc} = 1',
            correct: false,
            misconception:
              'Remember $\\omega_n^2 = 25$ (not $\\omega_n = 25$), so $\\omega_n = 5\\text{ rad/s}$, and $G(0) = 1/25 = 0.04$.',
          },
          {
            id: 'b',
            latex: '\\omega_n = 5,\\; \\zeta = 1.2\\;(\\text{Overdamped}),\\; K_{dc} = 0.04',
            correct: false,
            misconception:
              'Don\'t forget the factor of $2$ in $2\\zeta\\omega_n = 6$: $\\zeta = \\frac{6}{2\\cdot 5} = 0.6$, not $6/5 = 1.2$.',
          },
          {
            id: 'c',
            latex: '\\omega_n = 5,\\; \\zeta = 0.6\\;(\\text{Underdamped}),\\; K_{dc} = 0.04',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\omega_n = 5,\\; \\zeta = 0.6\\;(\\text{Underdamped}),\\; K_{dc} = 25',
            correct: false,
            misconception:
              'Setting $s=0$ gives $K_{dc} = G(0) = 1/25 = 0.04\\text{ m/N}$ (compliance), whereas $25\\text{ N/m}$ is the stiffness $k$.',
          },
        ],
        lockedLabel: 'Canonical Params',
        lockedResultLatex:
          '\\textcolor{#34D399}{\\omega_n=5,\\; \\zeta=0.6\\;(\\text{Underdamped}),\\; K_{dc}=0.04}',
        hint: 'Take $\\omega_n = \\sqrt{25}$, then solve $2\\zeta\\omega_n = 6$ and evaluate $G(0)$.',
      },
      {
        stepType: 's_plane_poles',
        badge: 'Exact s-Plane Poles & Ts',
        whyThisStep:
          'Locating the exact complex poles $s = -\\sigma \\pm j\\omega_d$ directly maps the algebra onto $s$-plane geometry: real part $\\sigma$ sets decay speed while imaginary part $\\omega_d$ sets ringing frequency.',
        systemImpact:
          'Because the poles sit at $s = -3 \\pm 4j$ (a clean 3-4-5 triangle!), the stage rings at $\\omega_d = 4\\text{ rad/s}$ and settles inside $\\pm 2\\%$ in $T_s \\approx 4/3 = 1.33\\text{ s}$.',
        prompt:
          'Solve $s^2 + 6s + 25 = 0$ for the complex poles $s = -\\sigma \\pm j\\omega_d$ and estimate the 2% settling time $T_s \\approx 4/\\sigma$.',
        highlightLatex:
          's = -\\textcolor{#F59E0B}{\\zeta\\omega_n} \\pm j\\,\\textcolor{#22D3EE}{\\omega_n\\sqrt{1-\\zeta^2}}, \\qquad T_s \\approx \\frac{4}{\\sigma}',
        options: [
          {
            id: 'a',
            latex: 's = -3 \\pm 4j, \\qquad T_s \\approx \\frac{4}{3}\\text{ s}',
            correct: true,
          },
          {
            id: 'b',
            latex: 's = -3 \\pm 5j, \\qquad T_s \\approx \\frac{4}{3}\\text{ s}',
            correct: false,
            misconception:
              '$5$ is the undamped radius $\\omega_n = \\sqrt{\\sigma^2 + \\omega_d^2}$; the imaginary coordinate is $\\omega_d = \\sqrt{25 - 9} = 4$.',
          },
          {
            id: 'c',
            latex: 's = -6 \\pm 4j, \\qquad T_s \\approx \\frac{2}{3}\\text{ s}',
            correct: false,
            misconception:
              'Complete the square using half of the $s$-coefficient: $(s+3)^2 + 16 = 0$, so $\\sigma = 3$, not $6$.',
          },
          {
            id: 'd',
            latex: 's = -4 \\pm 3j, \\qquad T_s \\approx 1.0\\text{ s}',
            correct: false,
            misconception:
              'The real part is $-b/2 = -6/2 = -3$ and the imaginary part is $\\sqrt{25 - 9} = 4$, not reversed.',
          },
        ],
        lockedLabel: 'Open-Loop Poles',
        lockedResultLatex: 's = \\textcolor{#34D399}{-3 \\pm 4j}, \\quad T_s \\approx \\textcolor{#34D399}{1.33\\text{ s}}',
        hint: 'Complete the square: $s^2 + 6s + 25 = (s+3)^2 + 16 = 0$.',
      },
      {
        stepType: 'close_unity_loop',
        badge: 'Close Unity Loop (Kp = 11)',
        whyThisStep:
          'Closing a unity proportional loop adds electronic spring stiffness $K_p$ without adding damping — tracking how the poles move reveals why pure P-control makes plants ring harder.',
        systemImpact:
          'The poles shoot straight UP/DOWN to $-3 \\pm 3\\sqrt{3}\\,j$: $\\sigma = 3$ (so $T_s$ stays $1.33\\text{ s}$!), $\\omega_n$ rises $5 \\to 6\\text{ rad/s}$, and $\\zeta$ drops $0.6 \\to 0.5$ (overshoot jumps to $16.3\\%$!).',
        prompt:
          'Wrap unity negative feedback with $C(s) = K_p = 11$ around $G(s) = \\frac{1}{s^2+6s+25}$. Find $T(s) = \\frac{K_p G}{1 + K_p G}$ and the new closed-loop poles.',
        highlightLatex:
          'T(s) = \\frac{\\textcolor{#F59E0B}{11}}{s^2 + 6s + (\\textcolor{#22D3EE}{25} + \\textcolor{#F59E0B}{11})}',
        options: [
          {
            id: 'a',
            latex: 'T(s) = \\frac{11}{s^2+6s+36}, \\quad s = -3 \\pm 6j',
            correct: false,
            misconception:
              'Here $\\omega_n = \\sqrt{36} = 6$, so $\\omega_d = \\sqrt{36 - 9} = \\sqrt{27} = 3\\sqrt{3} \\approx 5.20$, not $6$.',
          },
          {
            id: 'b',
            latex: 'T(s) = \\frac{11}{s^2+17s+25}, \\quad s = -8.5 \\pm 6.87j',
            correct: false,
            misconception:
              'Proportional feedback $K_p = 11$ adds to the constant ($s^0$) stiffness term $25$, not the velocity ($s^1$) damping term $6$.',
          },
          {
            id: 'c',
            latex: 'T(s) = \\frac{11}{s^2+6s+14}, \\quad s = -3 \\pm \\sqrt{5}\\,j',
            correct: false,
            misconception:
              'Negative feedback gives $1 + K_p G(s)$, which ADDS $11$ to $25$ ($25 + 11 = 36$), rather than subtracting.',
          },
          {
            id: 'd',
            latex: 'T(s) = \\frac{11}{s^2+6s+36}, \\quad s = -3 \\pm 3\\sqrt{3}\\,j',
            correct: true,
          },
        ],
        lockedLabel: 'Closed-Loop T(s)',
        lockedResultLatex:
          'T(s) = \\textcolor{#34D399}{\\frac{11}{s^2+6s+36}}, \\; s_{\\text{CL}} = \\textcolor{#34D399}{-3 \\pm 3\\sqrt{3}\\,j}',
        hint: 'Compute $(s+3)^2 + (36 - 9) = 0$ to find the exact vertical pole shift.',
      },
      {
        stepType: 'redesign_damper',
        badge: 'Redesign Damper for ζ = 1',
        whyThisStep:
          'When proportional stiffness increases $\\omega_n$, engineers must either upgrade physical damping $c$ or add derivative feedback $K_d$ to restore critical damping and eliminate overshoot.',
        systemImpact:
          'Doubling damping to $c_{\\text{crit}} = 12\\text{ N}\\cdot\\text{s/m}$ collapses the complex pair onto a repeated pole at $s = -6$, cutting settling time in HALF ($1.33\\text{ s} \\to 0.67\\text{ s}$) with ZERO overshoot.',
        prompt:
          'Holding closed-loop stiffness $k_{\\text{eff}} = 25 + 11 = 36$ and $m = 1$, find the exact physical damper $c_{\\text{crit}}$ that places the closed loop at critical damping ($\\zeta_{\\text{cl}} = 1$).',
        highlightLatex:
          's^2 + \\textcolor{#F59E0B}{c_{\\text{crit}}}s + \\textcolor{#22D3EE}{36} = (s + \\textcolor{#34D399}{\\omega_n})^2',
        options: [
          {
            id: 'a',
            latex: 'c_{\\text{crit}} = 6\\text{ N}\\cdot\\text{s/m} \\;\\;(s = -3,-3)',
            correct: false,
            misconception:
              '$c = 6$ gives $\\zeta = 6/(2\\cdot 6) = 0.5$ (underdamped); critical damping requires $c = 2\\sqrt{m k_{\\text{eff}}}$.',
          },
          {
            id: 'b',
            latex: 'c_{\\text{crit}} = 12\\text{ N}\\cdot\\text{s/m} \\;\\;(s = -6,-6)',
            correct: true,
          },
          {
            id: 'c',
            latex: 'c_{\\text{crit}} = 36\\text{ N}\\cdot\\text{s/m} \\;\\;(s = -18,-18)',
            correct: false,
            misconception:
              'Setting $c = k_{\\text{eff}} = 36$ makes $\\zeta = 3.0$ (heavily overdamped); use $c_{\\text{crit}} = 2\\sqrt{m k_{\\text{eff}}} = 2\\sqrt{36}$.',
          },
          {
            id: 'd',
            latex: 'c_{\\text{crit}} = 10\\text{ N}\\cdot\\text{s/m} \\;\\;(s = -5,-5)',
            correct: false,
            misconception:
              '$10$ is critical damping for the open-loop stiffness $k = 25$, not the closed-loop stiffness $k_{\\text{eff}} = 36$.',
          },
        ],
        lockedLabel: 'Critical Redesign',
        lockedResultLatex:
          'c_{\\text{crit}} = \\textcolor{#34D399}{12\\text{ N}\\cdot\\text{s/m}} \\;\\;(\\textcolor{#34D399}{s = -6,-6})',
        hint: 'Match $c_{\\text{crit}} = 2\\zeta\\omega_n$ with $\\zeta = 1$ and $\\omega_n = \\sqrt{36} = 6$.',
      },
    ],
  },

  {
    id: 'mod1-msd-overdamped',
    tier: 'mechanical',
    tierLabel: 'Mass-Spring',
    title: 'Overdamped Shock Absorber & Gain Tightening',
    mechatronicsContext:
      'A heavy-duty hydraulic suspension strut sits deeply overdamped in open loop; adding proportional active feedback pulls its separated real poles together to maximize speed without introducing bounce.',
    expressionLatex: 'm=1,\\; c=7,\\; k=10 \\;\\;(\\text{Overdamped} \\to \\zeta=1)',
    finalAnswerLatex:
      'G(s)=\\frac{1}{(s+2)(s+5)}, \\qquad K_p = 2.25 \\implies s_{\\text{CL}} = -3.5,-3.5',
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 3.0],
      setpoint: 1,
      setpointLabel: 'Normalized Final Value = 1',
      primaryLabel: 'Closed-Loop Kp=2.25 (ζ=1, s=−3.5)',
      baselineLabel: 'Open-Loop Overdamped (s=−2, −5)',
      primaryFn: (t) => 1 - (1 + 3.5 * t) * Math.exp(-3.5 * t),
      baselineFn: (t) => 1 - (5 / 3) * Math.exp(-2 * t) + (2 / 3) * Math.exp(-5 * t),
      defaultCursor: 0.45,
      subtitle:
        'Hover or drag across time $t$ (DC-normalized): closing the loop at $K_p=2.25$ collides the poles at $s=-3.5$, nearly halving the settling time with zero overshoot.',
      domainMeta: 'Normalized Step · Dominant s=−2 vs Critical s=−3.5',
      metrics: [
        { label: 'OL Poles', value: '−2, −5 (Overdamped)' },
        { label: 'OL Dominant Ts', value: '≈ 2.00 s (from −2)' },
        { label: 'Critical Kp', value: '2.25 (Δ = 0)' },
        { label: 'CL Double Pole', value: 's = −3.5, −3.5 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'ode_to_tf',
        badge: 'ODE & Open-Loop G(s)',
        whyThisStep:
          'Jumping directly from physical parameters $(m, c, k)$ to the Laplace plant $G(s)$ lets you inspect pole structure and damping immediately.',
        systemImpact:
          'The constant term $10$ sets open-loop DC compliance ($0.10\\text{ m/N}$), while the large $7s$ damping term dominates energy dissipation.',
        prompt:
          'Write the open-loop transfer function $G(s) = X(s)/F(s)$ for the shock absorber with $m=1,\\; c=7,\\; k=10$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{1}\\cdot\\ddot{x} + \\textcolor{#F59E0B}{7}\\dot{x} + \\textcolor{#22D3EE}{10}x = f(t) \\;\\xrightarrow{\\mathcal{L}}\\; G(s)',
        options: [
          {
            id: 'a',
            latex: 'G(s) = \\frac{10}{s^2 + 7s + 10}',
            correct: false,
            misconception:
              'Unit applied force $f(t)$ gives numerator $1$, not $k=10$; the $10$ belongs only in the denominator.',
          },
          {
            id: 'b',
            latex: 'G(s) = \\frac{1}{s^2 + 7s + 10}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'G(s) = \\frac{1}{s^2 + 10s + 7}',
            correct: false,
            misconception:
              'Keep viscous damping $c=7$ on the $s^1$ velocity term and stiffness $k=10$ on the $s^0$ position term.',
          },
          {
            id: 'd',
            latex: 'G(s) = \\frac{1}{7s^2 + 10s + 1}',
            correct: false,
            misconception:
              'The inertia $m=1$ multiplies $s^2$; shifting coefficients left misassigns every physical element.',
          },
        ],
        lockedLabel: 'Open-Loop G(s)',
        lockedResultLatex: 'G(s) = \\textcolor{#34D399}{\\frac{1}{s^2 + 7s + 10}}',
        hint: 'Map $m\\ddot{x}+c\\dot{x}+kx=f$ to $G(s) = \\frac{1}{ms^2 + cs + k}$.',
      },
      {
        stepType: 'factor_poles',
        badge: 'Factor Real Poles & Classify',
        whyThisStep:
          'Factoring the denominator into real roots immediately distinguishes sluggish overdamped decay from oscillatory underdamped motion.',
        systemImpact:
          'Two distinct real LHP poles ($s=-2, -5$) give $\\zeta = \\frac{7}{2\\sqrt{10}} \\approx 1.11 > 1$: the strut returns monotonically with zero overshoot, behaving as a sum of two pure exponentials.',
        prompt:
          'Factor $s^2 + 7s + 10 = 0$ to find the open-loop poles and confirm the damping regime.',
        highlightLatex:
          '\\textcolor{#22D3EE}{s^2 + 7s + 10} = (s - p_1)(s - p_2) = 0, \\qquad \\zeta = \\frac{7}{2\\sqrt{10}}',
        options: [
          {
            id: 'a',
            latex: 's = +2,\\; +5 \\;\\;(\\text{Unstable})',
            correct: false,
            misconception:
              'Factoring $(s+2)(s+5) = 0$ yields NEGATIVE roots $s = -2$ and $s = -5$ in the stable LHP.',
          },
          {
            id: 'b',
            latex: 's = -3.5 \\pm 1.5j \\;\\;(\\text{Underdamped})',
            correct: false,
            misconception:
              'Check the discriminant: $\\Delta = 7^2 - 4(10) = 49 - 40 = +9 > 0$, so the roots are real and distinct, not complex.',
          },
          {
            id: 'c',
            latex: 's = -2,\\; -5 \\;\\;(\\zeta > 1,\\; \\text{Overdamped})',
            correct: true,
          },
          {
            id: 'd',
            latex: 's = -1,\\; -10 \\;\\;(\\zeta > 1,\\; \\text{Overdamped})',
            correct: false,
            misconception:
              'The roots must sum to $-7$ and multiply to $+10$: $(-2)+(-5)=-7$ and $(-2)(-5)=10$.',
          },
        ],
        lockedLabel: 'Open-Loop Poles',
        lockedResultLatex: 's = \\textcolor{#34D399}{-2,\\; -5} \\;\\;(\\textcolor{#34D399}{\\zeta \\approx 1.11,\\; \\text{Overdamped}})',
        hint: 'Find two numbers multiplying to $10$ and adding to $7$.',
      },
      {
        stepType: 'dominant_pole',
        badge: 'Dominant-Pole Settling Time',
        whyThisStep:
          'In multi-pole systems, the pole closest to the imaginary axis decays slowest and dictates the practical settling time — a core simplification for rapid engineering estimation.',
        systemImpact:
          'Because $e^{-5t}$ dies out $2.5\\times$ faster than $e^{-2t}$, the slow pole at $s = -2$ bottlenecks the entire shock absorber at $T_s \\approx 4/2 = 2.0\\text{ s}$.',
        prompt:
          'Between the open-loop poles $s = -2$ and $s = -5$, identify the dominant pole and estimate the 2% settling time $T_s \\approx 4/|\\sigma_{\\text{dom}}|$.',
        highlightLatex:
          'y(t) \\sim c_1 e^{\\textcolor{#F59E0B}{-2}t} + c_2 e^{\\textcolor{#22D3EE}{-5}t} \\quad\\implies\\quad T_s \\approx \\frac{4}{|\\sigma_{\\text{dom}}|}',
        options: [
          {
            id: 'a',
            latex: 's_{\\text{dom}} = -5 \\implies T_s \\approx 0.8\\text{ s}',
            correct: false,
            misconception:
              'The pole at $-5$ decays FASTER ($\\tau = 0.2\\text{ s}$); the slowest tail ($-2$, $\\tau = 0.5\\text{ s}$) is always the dominant pole.',
          },
          {
            id: 'b',
            latex: 's_{\\text{dom}} = -2 \\implies T_s \\approx 2.0\\text{ s}',
            correct: true,
          },
          {
            id: 'c',
            latex: 's_{\\text{dom}} = -3.5 \\implies T_s \\approx 1.14\\text{ s}',
            correct: false,
            misconception:
              '$-3.5$ is the average of the two real poles, not an actual open-loop pole; open-loop decay is governed by the slowest real root $-2$.',
          },
          {
            id: 'd',
            latex: 's_{\\text{dom}} = -2 \\implies T_s \\approx 0.5\\text{ s}',
            correct: false,
            misconception:
              '$\\tau = 1/2 = 0.5\\text{ s}$ is ONE time constant (63% settled); 2% settling requires $4\\tau = 4/2 = 2.0\\text{ s}$.',
          },
        ],
        lockedLabel: 'Dominant Pole',
        lockedResultLatex: 's_{\\text{dom}} = \\textcolor{#34D399}{-2} \\implies T_s \\approx \\textcolor{#34D399}{2.0\\text{ s}}',
        hint: 'The dominant pole is closest to the $j\\omega$-axis (smallest $|\\sigma|$), with $T_s \\approx 4/|\\sigma|$.',
      },
      {
        stepType: 'closed_loop_char',
        badge: 'Closed-Loop Characteristic Eq',
        whyThisStep:
          'Writing $1 + K_p G(s) = 0$ parameterized by $K_p$ reveals the exact trajectory of the closed-loop poles as you dial up proportional gain.',
        systemImpact:
          'As $K_p$ increases from $0$, the two real poles march toward each other along the real axis from $-2$ and $-5$, speeding up the slow mode until they collide at $-3.5$.',
        prompt:
          'Close unity negative feedback with proportional gain $C(s) = K_p$ around $G(s) = \\frac{1}{s^2+7s+10}$ and form the closed-loop characteristic equation.',
        highlightLatex:
          '1 + \\textcolor{#F59E0B}{K_p}\\,\\textcolor{#22D3EE}{\\frac{1}{s^2 + 7s + 10}} = 0',
        options: [
          {
            id: 'a',
            latex: 's^2 + (7 + K_p)s + 10 = 0',
            correct: false,
            misconception:
              'Proportional feedback $K_p$ has no factor of $s$, so it adds to the constant term $10$, not the $7s$ term.',
          },
          {
            id: 'b',
            latex: 's^2 + 7s + 10 K_p = 0',
            correct: false,
            misconception:
              'Clearing the denominator of $1 + \\frac{K_p}{s^2+7s+10} = 0$ ADDS $K_p$ to $10$ rather than multiplying.',
          },
          {
            id: 'c',
            latex: 's^2 + 7s + (10 - K_p) = 0',
            correct: false,
            misconception:
              'Negative feedback produces $1 + K_p G(s) = 0$, giving $+K_p$ in the characteristic polynomial.',
          },
          {
            id: 'd',
            latex: 's^2 + 7s + (10 + K_p) = 0',
            correct: true,
          },
        ],
        lockedLabel: 'CL Characteristic',
        lockedResultLatex: '\\textcolor{#34D399}{s^2 + 7s + (10 + K_p) = 0}',
        hint: 'Multiply $1 + \\frac{K_p}{s^2+7s+10} = 0$ by $(s^2+7s+10)$.',
      },
      {
        stepType: 'critical_kp',
        badge: 'Solve Kp for Critical Damping',
        whyThisStep:
          'Setting the quadratic discriminant $\\Delta = 0$ finds the exact sweet-spot gain where the sluggish pole reaches its fastest possible non-oscillatory location.',
        systemImpact:
          'At $K_p = 2.25$, both poles meet at $s = -3.5$: settling time plunges from $2.0\\text{ s}$ to $\\sim 1.14\\text{ s}$ with zero bounce, and any higher $K_p$ launches the poles vertically into oscillation.',
        prompt:
          'Solve for the exact proportional gain $K_p$ that makes $s^2 + 7s + (10 + K_p) = 0$ critically damped ($\\Delta = 0$), and find the resulting repeated pole.',
        highlightLatex:
          '\\Delta = \\textcolor{#22D3EE}{7}^2 - 4(1)(\\textcolor{#22D3EE}{10} + \\textcolor{#F59E0B}{K_p}) = 0',
        options: [
          {
            id: 'a',
            latex: 'K_p = 2.25, \\qquad s = -3.5,\\; -3.5',
            correct: true,
          },
          {
            id: 'b',
            latex: 'K_p = 9.0, \\qquad s = -3.5,\\; -3.5',
            correct: false,
            misconception:
              'You found $4 K_p = 49 - 40 = 9$, so remember to divide by $4$: $K_p = 9/4 = 2.25$.',
          },
          {
            id: 'c',
            latex: 'K_p = 12.25, \\qquad s = -3.5,\\; -3.5',
            correct: false,
            misconception:
              '$12.25$ is the TOTAL constant term $10 + K_p = (3.5)^2$; subtract the plant\'s existing $k = 10$ to get $K_p = 2.25$.',
          },
          {
            id: 'd',
            latex: 'K_p = 2.25, \\qquad s = -7,\\; -7',
            correct: false,
            misconception:
              'For $(s + a)^2 = s^2 + 7s + 12.25$, $2a = 7$ gives the double pole at $s = -3.5$, not $-7$.',
          },
        ],
        lockedLabel: 'Critical Gain Kp',
        lockedResultLatex: 'K_p = \\textcolor{#34D399}{2.25}, \\quad s_{\\text{CL}} = \\textcolor{#34D399}{-3.5,\\; -3.5}',
        hint: 'Solve $49 - 4(10 + K_p) = 0$ for $K_p$, then take $s = -7/2$.',
      },
    ],
  },

  {
    id: 'mod1-rotational-servo',
    tier: 'mechanical',
    tierLabel: 'Mass-Spring',
    title: 'Rotational Gimbal Inertia & Derivative Damping',
    mechatronicsContext:
      'A direct-drive optical gimbal couples rotor inertia, viscous bearing drag, and a torsional flexure spring; understanding its critically damped repeated pole explains why extra velocity feedback actually slows down one of the modes.',
    expressionLatex: 'J=2,\\; b=8,\\; k_\\theta=8 \\;\\;(\\text{Gimbal})',
    finalAnswerLatex:
      'G(s)=\\frac{0.5}{(s+2)^2}, \\qquad s=-2,-2 \\;\\;(\\zeta=1 \\xrightarrow{+K_d} \\text{overdamped})',
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 4.5],
      setpoint: 1,
      setpointLabel: 'Normalized Step = 1',
      primaryLabel: 'Critical Baseline (Kd=0, ζ=1)',
      baselineLabel: 'With Kd=4 (Overdamped, ζ=1.5)',
      primaryFn: (t) => 1 - (1 + 2 * t) * Math.exp(-2 * t),
      baselineFn: (t) => {
        const p1 = -3 + Math.sqrt(5);
        const p2 = -3 - Math.sqrt(5);
        return 1 - (p2 * Math.exp(p1 * t) - p1 * Math.exp(p2 * t)) / (p2 - p1);
      },
      defaultCursor: 0.42,
      subtitle:
        'Hover or drag across time $t$: notice that adding extra velocity feedback ($K_d = 4$, Cyan dashed) splits the $-2$ double pole to $-0.76$ and $-5.24$, making the gimbal SLOWER to settle than critical damping (Emerald)!',
      domainMeta: 'Gimbal Step · Critical s=−2,−2 vs Overdamped s=−0.76,−5.24',
      metrics: [
        { label: 'Monic G(s)', value: '0.5 / (s + 2)²' },
        { label: 'Natural Freq ωn', value: '2.0 rad/s' },
        { label: 'Baseline Regime', value: 'Critical (ζ = 1.0)' },
        { label: 'Adding Kd > 0', value: 'Splits on −ℝ (slower) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'torque_ode',
        badge: 'Newton-Euler Torque Balance',
        whyThisStep:
          'Rotational mechanics obeys the exact mirror of translational dynamics ($J\\leftrightarrow m,\\; b\\leftrightarrow c,\\; k_\\theta\\leftrightarrow k$), letting you model gimbals, joints, and flywheels identically.',
        systemImpact:
          'Because rotor inertia $J = 2$ is twice unity, torque commands produce half the angular acceleration of a unit-inertia axis — scaling the plant gain down by $1/J$.',
        prompt:
          'Write the rotational Newton-Euler ODE relating input motor torque $\\tau(t)$ to gimbal angle $\\theta(t)$ for $J=2,\\; b=8,\\; k_\\theta=8$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{J}\\ddot{\\theta} + \\textcolor{#F59E0B}{b}\\dot{\\theta} + \\textcolor{#22D3EE}{k_\\theta}\\theta = \\tau(t)',
        options: [
          {
            id: 'a',
            latex: '2\\ddot{\\theta} + 8\\dot{\\theta} + 8\\theta = \\tau(t)',
            correct: true,
          },
          {
            id: 'b',
            latex: '8\\ddot{\\theta} + 8\\dot{\\theta} + 2\\theta = \\tau(t)',
            correct: false,
            misconception:
              'Inertia $J=2$ multiplies angular acceleration $\\ddot{\\theta}$, while torsional stiffness $k_\\theta=8$ multiplies angle $\\theta$.',
          },
          {
            id: 'c',
            latex: '2\\ddot{\\theta} + 8\\theta = \\tau(t)',
            correct: false,
            misconception:
              'Do not drop the viscous bearing drag term $b\\dot{\\theta} = 8\\dot{\\theta}$ — without it the gimbal would ring forever.',
          },
          {
            id: 'd',
            latex: '2\\dot{\\theta} + 8\\theta = \\tau(t)',
            correct: false,
            misconception:
              'Angular momentum balance is $J\\ddot{\\theta}$ (second derivative of angle $\\theta$), not first derivative.',
          },
        ],
        lockedLabel: 'Torque ODE',
        lockedResultLatex: '\\textcolor{#34D399}{2\\ddot{\\theta} + 8\\dot{\\theta} + 8\\theta = \\tau(t)}',
        hint: 'Substitute $J=2$, $b=8$, and $k_\\theta=8$ into $J\\ddot{\\theta} + b\\dot{\\theta} + k_\\theta\\theta = \\tau(t)$.',
      },
      {
        stepType: 'rotational_tf',
        badge: 'Monic Transfer Function',
        whyThisStep:
          'Normalizing the leading $s^2$ coefficient to $1$ (monic form) is mandatory before reading off $2\\zeta\\omega_n$ and $\\omega_n^2$ — skipping this step is the #1 source of $\\zeta$ mistakes.',
        systemImpact:
          'Dividing by $J=2$ reveals the true high-frequency gain $0.5$ ($1/J$) and exposes the clean canonical denominator $s^2 + 4s + 4$.',
        prompt:
          'Transform $2\\ddot{\\theta} + 8\\dot{\\theta} + 8\\theta = \\tau(t)$ into $G(s) = \\Theta(s)/\\mathcal{T}(s)$ and normalize the denominator to monic form.',
        highlightLatex:
          'G(s) = \\frac{1}{\\textcolor{#22D3EE}{2}s^2 + 8s + 8} = \\frac{1/\\textcolor{#22D3EE}{2}}{s^2 + \\tfrac{8}{\\textcolor{#22D3EE}{2}}s + \\tfrac{8}{\\textcolor{#22D3EE}{2}}}',
        options: [
          {
            id: 'a',
            latex: 'G(s) = \\frac{1}{s^2 + 4s + 4}',
            correct: false,
            misconception:
              'When dividing the denominator by $2$, you must ALSO divide the numerator by $2$, leaving $0.5$ on top.',
          },
          {
            id: 'b',
            latex: 'G(s) = \\frac{2}{s^2 + 4s + 4}',
            correct: false,
            misconception:
              'Dividing top and bottom by $2$ gives $1/2 = 0.5$ in the numerator, not $2$.',
          },
          {
            id: 'c',
            latex: 'G(s) = \\frac{0.5}{s^2 + 4s + 4}',
            correct: true,
          },
          {
            id: 'd',
            latex: 'G(s) = \\frac{0.5}{s^2 + 8s + 8}',
            correct: false,
            misconception:
              'Every term in the denominator must be divided by $J=2$: $8/2 = 4$ for both the $s$ and constant terms.',
          },
        ],
        lockedLabel: 'Monic G(s)',
        lockedResultLatex: 'G(s) = \\textcolor{#34D399}{\\frac{0.5}{s^2 + 4s + 4}}',
        hint: 'Divide numerator and denominator of $\\frac{1}{2s^2+8s+8}$ by $2$.',
      },
      {
        stepType: 'repeated_poles',
        badge: 'Classify Damping & Poles',
        whyThisStep:
          'Checking whether $\\zeta$ equals $1$ identifies the razor-thin critical boundary separating monotonic overdamped motion from oscillatory ringing.',
        systemImpact:
          'With repeated pole $s = -2, -2$ ($\\omega_n = 2,\\; \\zeta = 1.0$), this gimbal delivers the fastest possible zero-overshoot step response for its natural frequency.',
        prompt:
          'Factor the monic denominator $s^2 + 4s + 4$ to determine $\\omega_n$, $\\zeta$, and the exact pole locations.',
        highlightLatex:
          '\\textcolor{#22D3EE}{s^2 + 4s + 4} = (s + \\textcolor{#34D399}{2})^2 = 0',
        options: [
          {
            id: 'a',
            latex: 's = -2,\\; -2 \\;\\;(\\omega_n = 2,\\; \\zeta = 1.0,\\; \\text{Critical})',
            correct: true,
          },
          {
            id: 'b',
            latex: 's = -2 \\pm 2j \\;\\;(\\omega_n = 2,\\; \\zeta = 0.707,\\; \\text{Underdamped})',
            correct: false,
            misconception:
              'Here $\\Delta = 4^2 - 4(4) = 0$, so there is zero imaginary part — the roots coalesce on the real axis at $-2$.',
          },
          {
            id: 'c',
            latex: 's = -1,\\; -4 \\;\\;(\\omega_n = 2,\\; \\zeta = 1.25,\\; \\text{Overdamped})',
            correct: false,
            misconception:
              '$(s+1)(s+4) = s^2 + 5s + 4$, whereas our denominator is $s^2 + 4s + 4 = (s+2)^2$.',
          },
          {
            id: 'd',
            latex: 's = -2,\\; -2 \\;\\;(\\omega_n = 4,\\; \\zeta = 0.5,\\; \\text{Underdamped})',
            correct: false,
            misconception:
              '$\\omega_n = \\sqrt{4} = 2$ (not $4$), so $\\zeta = 4/(2\\cdot 2) = 1.0$ (critically damped).',
          },
        ],
        lockedLabel: 'Repeated Poles',
        lockedResultLatex: 's = \\textcolor{#34D399}{-2,\\; -2} \\;\\;(\\textcolor{#34D399}{\\omega_n=2,\\; \\zeta=1.0})',
        hint: 'Recognize $s^2 + 4s + 4$ as a perfect square $(s+2)^2$.',
      },
      {
        stepType: 'time_form',
        badge: 'Repeated-Pole Time Mode',
        whyThisStep:
          'Repeated $s$-plane poles cannot span a 2D solution space with a single exponential alone — recognizing the repeated-root mode structure is essential for impulse analysis and state-space Jordan blocks.',
        systemImpact:
          'The $t e^{-2t}$ term creates a smooth, bell-shaped impulse pulse that peaks at $t = 1/2 = 0.5\\text{ s}$ and decays without ever crossing zero.',
        prompt:
          'Identify the homogeneous time-domain response structure generated by the repeated pole $(s + 2)^2 = 0$.',
        highlightLatex:
          '\\mathcal{L}^{-1}\\!\\left\\{\\frac{A}{s+2} + \\frac{B}{(s+2)^2}\\right\\} \\;\\longrightarrow\\; \\theta_h(t)',
        options: [
          {
            id: 'a',
            latex: 'C_1 e^{-2t} + C_2 e^{2t}',
            correct: false,
            misconception:
              'There is no RHP pole at $+2$; both repeated poles sit at $s = -2$.',
          },
          {
            id: 'b',
            latex: '(C_1 + C_2 t)\\,e^{-2t}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'e^{-2t}(C_1\\cos 2t + C_2\\sin 2t)',
            correct: false,
            misconception:
              'Sinusoids arise only from complex conjugate poles ($\\omega_d > 0$); a repeated real pole has $\\omega_d = 0$.',
          },
          {
            id: 'd',
            latex: 'C_1 e^{-2t} + C_2 e^{-4t}',
            correct: false,
            misconception:
              'That requires two distinct real poles at $-2$ and $-4$; a repeated pole at $-2$ multiplies the second mode by $t$.',
          },
        ],
        lockedLabel: 'Natural Mode',
        lockedResultLatex: '\\theta_h(t) = \\textcolor{#34D399}{(C_1 + C_2 t)\\,e^{-2t}}',
        hint: 'Recall the Laplace pair $\\mathcal{L}\\{t e^{-at}\\} = \\frac{1}{(s+a)^2}$.',
      },
      {
        stepType: 'derivative_feedback',
        badge: 'Velocity Feedback Kd Impact',
        whyThisStep:
          'Intuition might say "more damping is always better," but analyzing how $K_d\\dot{\\theta}$ moves a critically damped double pole reveals a classic controls counter-intuition.',
        systemImpact:
          'Adding $K_d > 0$ makes $\\zeta_{\\text{cl}} = 1 + 0.125 K_d > 1$: the double pole at $-2$ SPLITS apart along the negative real axis — pushing one pole CLOSER to the origin and actually SLOWING down settling!',
        prompt:
          'Add negative velocity feedback $\\tau = \\tau_{\\text{ref}} - K_d\\dot{\\theta}$ ($K_d > 0$) to $2\\ddot{\\theta} + 8\\dot{\\theta} + 8\\theta = \\tau$. How do the closed-loop poles move?',
        highlightLatex:
          's^2 + \\left(4 + \\textcolor{#F59E0B}{0.5 K_d}\\right)s + 4 = 0 \\qquad (\\textcolor{#F59E0B}{K_d > 0})',
        options: [
          {
            id: 'a',
            latex: '\\zeta_{\\text{cl}} < 1:\\; \\text{poles split vertically into complex pairs}',
            correct: false,
            misconception:
              'Increasing the $s^1$ coefficient INCREASES damping $\\zeta_{\\text{cl}} > 1$ (positive discriminant), keeping poles strictly real.',
          },
          {
            id: 'b',
            latex: '\\zeta_{\\text{cl}} = 1:\\; \\text{double pole shifts rigidly left}',
            correct: false,
            misconception:
              'Since the constant term $\\omega_n^2 = 4$ is unchanged, the product of the two roots must stay $4$ — so they cannot both move left of $-2$!',
          },
          {
            id: 'c',
            latex: '\\zeta_{\\text{cl}} > 1:\\; \\text{poles split on negative real axis (one slower)}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\text{Unstable: one pole crosses into RHP}',
            correct: false,
            misconception:
              'All coefficients remain strictly positive ($1, 4+0.5K_d, 4 > 0$), so both real roots remain strictly in the LHP.',
          },
        ],
        lockedLabel: 'Kd Pole Split',
        lockedResultLatex:
          '\\textcolor{#34D399}{\\zeta_{\\text{cl}} > 1:\\; \\text{poles split on }-\\mathbb{R}\\text{ (one pole }> -2\\text{)}}',
        hint: 'Check the product of roots $p_1 p_2 = 4$ and sum $p_1 + p_2 = -(4 + 0.5K_d) < -4$.',
      },
    ],
  },

  // =========================================================================
  // TIER 2: RLC & ACTIVE CIRCUITS (3 problems)
  // =========================================================================
  {
    id: 'mod2-rlc-series',
    tier: 'circuits',
    tierLabel: 'RLC Circuits',
    title: 'Series RLC Voltage Divider & Mechanical Analogy',
    mechatronicsContext:
      'The LC output filter of a high-current motor inverter always carries winding resistance $R$; deriving its voltage transfer function and mechanical analogy predicts resonant ringing that can over-voltage power switches.',
    expressionLatex: 'L=0.5\\text{H},\\; R=4\\Omega,\\; C=0.05\\text{F}',
    finalAnswerLatex:
      'G(s)=\\frac{40}{s^2+8s+40}, \\quad s=-4\\pm 2\\sqrt{6}\\,j, \\quad R_{\\text{crit}}=2\\sqrt{10}\\,\\Omega',
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 1.8],
      setpoint: 1,
      setpointLabel: 'Input Step v_in = 1 V',
      primaryLabel: 'Critical R = 6.32 Ω (ζ=1)',
      baselineLabel: 'Actual R = 4 Ω (ζ=0.632)',
      primaryFn: (t) => 1 - (1 + 2 * Math.sqrt(10) * t) * Math.exp(-2 * Math.sqrt(10) * t),
      baselineFn: (t) =>
        1 -
        Math.exp(-4 * t) *
          (Math.cos(2 * Math.sqrt(6) * t) + (4 / (2 * Math.sqrt(6))) * Math.sin(2 * Math.sqrt(6) * t)),
      defaultCursor: 0.34,
      subtitle:
        'Hover or drag across time $t$: with $R=4\\,\\Omega$ (Cyan dashed), capacitor voltage overshoots by ~7.7% at $\\omega_d=4.90\\text{ rad/s}$; raising resistance to $R_{\\text{crit}}=6.32\\,\\Omega$ (Emerald) removes overshoot completely.',
      domainMeta: 'Series RLC Step · R=4 Ω (ζ=0.632) vs R_crit=6.32 Ω (ζ=1)',
      metrics: [
        { label: 'Monic G(s)', value: '40 / (s² + 8s + 40)' },
        { label: 'Params (ωn, ζ)', value: '6.32 rad/s, 0.632' },
        { label: 's-Plane Poles', value: '−4 ± 4.90j' },
        { label: 'Critical R_crit', value: '2√10 ≈ 6.32 Ω ✓' },
      ],
    },
    steps: [
      {
        stepType: 'kvl_ode',
        badge: 'KVL Mesh Equation',
        whyThisStep:
          'Expressing KVL solely in terms of the output state $v_C(t)$ via the constitutive law $i = C\\dot{v}_C$ eliminates the intermediate current variable in one clean stroke.',
        systemImpact:
          'The product $LC = 0.025\\text{ s}^2$ sets the resonant timescale while $RC = 0.2\\text{ s}$ sets the electrical dissipation timescale.',
        prompt:
          'Combine series KVL $L\\frac{di}{dt} + Ri + v_C = v_{\\text{in}}$ with $i = C\\dot{v}_C$ for $L=0.5\\text{ H},\\; R=4\\,\\Omega,\\; C=0.05\\text{ F}$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{LC}\\,\\ddot{v}_C + \\textcolor{#F59E0B}{RC}\\,\\dot{v}_C + v_C = v_{\\text{in}}(t)',
        options: [
          {
            id: 'a',
            latex: '0.025\\ddot{v}_C + 0.2\\dot{v}_C + v_C = v_{\\text{in}}',
            correct: true,
          },
          {
            id: 'b',
            latex: '0.5\\ddot{v}_C + 4\\dot{v}_C + 0.05 v_C = v_{\\text{in}}',
            correct: false,
            misconception:
              'That writes the equation for charge $q$ (with $1/C=20$, not $0.05$); for output $v_C$, substitute $i = C\\dot{v}_C$ so $L$ and $R$ multiply by $C = 0.05$.',
          },
          {
            id: 'c',
            latex: '0.025\\ddot{v}_C + 4\\dot{v}_C + v_C = v_{\\text{in}}',
            correct: false,
            misconception:
              'Remember to multiply $R$ by $C$ in $Ri = RC\\dot{v}_C = (4)(0.05)\\dot{v}_C = 0.2\\dot{v}_C$.',
          },
          {
            id: 'd',
            latex: '0.25\\ddot{v}_C + 0.2\\dot{v}_C + v_C = v_{\\text{in}}',
            correct: false,
            misconception:
              'Check the arithmetic: $LC = (0.5)(0.05) = 0.025$, not $0.25$.',
          },
        ],
        lockedLabel: 'KVL Output ODE',
        lockedResultLatex: '\\textcolor{#34D399}{0.025\\ddot{v}_C + 0.2\\dot{v}_C + v_C = v_{\\text{in}}}',
        hint: 'Compute $LC = 0.5\\times 0.05$ and $RC = 4\\times 0.05$.',
      },
      {
        stepType: 'rlc_tf',
        badge: 'Monic Transfer Function',
        whyThisStep:
          'Dividing by $LC$ puts the circuit transfer function into standard low-pass form $\\frac{\\omega_n^2}{s^2 + (R/L)s + 1/(LC)}$ where unity DC gain ($G(0) = 1$) is immediately obvious.',
        systemImpact:
          'Because $G(0) = 40/40 = 1$, steady DC voltage passes across the inductor with zero drop while high-frequency switching ripple rolls off at $-40\\text{ dB/dec}$.',
        prompt:
          'Take $\\mathcal{L}\\{\\cdot\\}$ and divide by $LC = 0.025$ to form the monic voltage transfer function $G(s) = V_C(s)/V_{\\text{in}}(s)$.',
        highlightLatex:
          'G(s) = \\frac{1/(\\textcolor{#22D3EE}{LC})}{s^2 + (\\textcolor{#F59E0B}{R/L})s + 1/(\\textcolor{#22D3EE}{LC})}',
        options: [
          {
            id: 'a',
            latex: 'G(s) = \\frac{1}{s^2 + 8s + 40}',
            correct: false,
            misconception:
              'Dividing numerator $1$ by $LC = 0.025$ puts $40$ in the numerator — preserving unity DC gain $G(0) = 40/40 = 1$.',
          },
          {
            id: 'b',
            latex: 'G(s) = \\frac{40}{s^2 + 8s + 40}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'G(s) = \\frac{40}{s^2 + 2s + 40}',
            correct: false,
            misconception:
              'Compute $R/L = 4 / 0.5 = 8$ (or $0.2 / 0.025 = 8$), not $4 \\times 0.5 = 2$.',
          },
          {
            id: 'd',
            latex: 'G(s) = \\frac{8s}{s^2 + 8s + 40}',
            correct: false,
            misconception:
              '$\\frac{8s}{s^2+8s+40}$ is the resistor voltage $V_R/V_{\\text{in}}$ (bandpass); capacitor voltage $V_C/V_{\\text{in}}$ is low-pass with constant numerator $40$.',
          },
        ],
        lockedLabel: 'Voltage TF G(s)',
        lockedResultLatex: 'G(s) = \\textcolor{#34D399}{\\frac{40}{s^2 + 8s + 40}}',
        hint: 'Evaluate $1/0.025 = 40$ and $R/L = 4/0.5 = 8$.',
      },
      {
        stepType: 'rlc_params',
        badge: 'Extract ωn & ζ',
        whyThisStep:
          'Reading $\\omega_n$ and $\\zeta$ directly off the monic RLC denominator lets you predict whether an inverter step will trigger voltage overshoot on the DC bus.',
        systemImpact:
          'At $\\omega_n = 2\\sqrt{10} \\approx 6.32\\text{ rad/s}$ and $\\zeta = \\sqrt{0.4} \\approx 0.632 < 0.707$, the filter is underdamped with ~7.7% step overshoot and minimal frequency peaking.',
        prompt:
          'Extract the exact natural frequency $\\omega_n$ and damping ratio $\\zeta$ from $s^2 + 8s + 40$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{\\omega_n}^2 = 40, \\qquad 2\\textcolor{#F59E0B}{\\zeta}\\textcolor{#22D3EE}{\\omega_n} = 8',
        options: [
          {
            id: 'a',
            latex: '\\omega_n = 2\\sqrt{10}, \\quad \\zeta = \\sqrt{0.4} \\approx 0.632',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\omega_n = 4\\sqrt{10}, \\quad \\zeta = \\sqrt{0.1} \\approx 0.316',
            correct: false,
            misconception:
              '$\\sqrt{40} = \\sqrt{4\\cdot 10} = 2\\sqrt{10}$, not $4\\sqrt{10}$.',
          },
          {
            id: 'c',
            latex: '\\omega_n = 2\\sqrt{10}, \\quad \\zeta = \\frac{8}{\\sqrt{40}} \\approx 1.265',
            correct: false,
            misconception:
              'Divide by $2\\omega_n$, not $\\omega_n$: $\\zeta = \\frac{8}{2\\sqrt{40}} = \\frac{4}{\\sqrt{40}} = \\sqrt{16/40} = \\sqrt{0.4}$.',
          },
          {
            id: 'd',
            latex: '\\omega_n = 40, \\quad \\zeta = 0.1',
            correct: false,
            misconception:
              'Take the square root of $40$ to get $\\omega_n = \\sqrt{40} \\approx 6.325\\text{ rad/s}$.',
          },
        ],
        lockedLabel: 'RLC Parameters',
        lockedResultLatex: '\\textcolor{#34D399}{\\omega_n = 2\\sqrt{10} \\approx 6.32,\\; \\zeta = \\sqrt{0.4} \\approx 0.632}',
        hint: 'Simplify $\\zeta = \\frac{4}{\\sqrt{40}} = \\sqrt{\\frac{16}{40}}$.',
      },
      {
        stepType: 'rlc_poles',
        badge: 'Exact s-Plane Poles',
        whyThisStep:
          'Computing the exact complex roots gives both the decay rate $\\sigma = R/(2L)$ and the damped ringing frequency $\\omega_d$ you would measure on an oscilloscope.',
        systemImpact:
          'The poles at $s = -4 \\pm 2\\sqrt{6}\\,j$ ($\\approx -4 \\pm 4.90j$) decay with $T_s \\approx 4/4 = 1.0\\text{ s}$ while ringing at $4.90\\text{ rad/s}$ ($0.78\\text{ Hz}$).',
        prompt:
          'Solve $s^2 + 8s + 40 = 0$ for the exact complex conjugate poles.',
        highlightLatex:
          '(s + \\textcolor{#F59E0B}{4})^2 + (\\textcolor{#22D3EE}{40} - 16) = 0',
        options: [
          {
            id: 'a',
            latex: 's = -4 \\pm 2\\sqrt{10}\\,j',
            correct: false,
            misconception:
              'Subtract $\\sigma^2 = 16$ from $\\omega_n^2 = 40$: $\\omega_d = \\sqrt{40 - 16} = \\sqrt{24} = 2\\sqrt{6}$.',
          },
          {
            id: 'b',
            latex: 's = -8 \\pm 2\\sqrt{6}\\,j',
            correct: false,
            misconception:
              'The real part is $-b/2 = -8/2 = -4$, not $-8$.',
          },
          {
            id: 'c',
            latex: 's = -4 \\pm 2\\sqrt{6}\\,j',
            correct: true,
          },
          {
            id: 'd',
            latex: 's = -4 \\pm 4\\sqrt{6}\\,j',
            correct: false,
            misconception:
              '$\\sqrt{24} = \\sqrt{4\\cdot 6} = 2\\sqrt{6} \\approx 4.90$, whereas $4\\sqrt{6} = \\sqrt{96}$.',
          },
        ],
        lockedLabel: 'Circuit Poles',
        lockedResultLatex: 's = \\textcolor{#34D399}{-4 \\pm 2\\sqrt{6}\\,j} \\;\\;(\\approx -4 \\pm 4.90j)',
        hint: 'Simplify $\\sqrt{40 - 4^2} = \\sqrt{24} = 2\\sqrt{6}$.',
      },
      {
        stepType: 'mech_analogy',
        badge: 'Force-Voltage Analogy',
        whyThisStep:
          'Cross-domain analogies let mechatronics engineers transfer intuition seamlessly between circuits and mechanisms — inductance IS electrical inertia, capacitance IS electrical compliance.',
        systemImpact:
          'Because $L\\leftrightarrow m$, $R\\leftrightarrow c$, and $1/C\\leftrightarrow k$, increasing capacitance $C$ SOFTENS the spring ($k \\downarrow$) and lowers $\\omega_n = 1/\\sqrt{LC}$.',
        prompt:
          'Comparing $L\\ddot{q} + R\\dot{q} + \\frac{1}{C}q = v_{\\text{in}}$ against $m\\ddot{x} + c\\dot{x} + kx = f$, match the electrical parameters to their mechanical analogs.',
        highlightLatex:
          '\\textcolor{#22D3EE}{L}\\ddot{q} + \\textcolor{#F59E0B}{R}\\dot{q} + \\textcolor{#22D3EE}{\\tfrac{1}{C}}q = v_{\\text{in}} \\;\\Longleftrightarrow\\; m\\ddot{x} + c\\dot{x} + kx = f',
        options: [
          {
            id: 'a',
            latex: 'L \\leftrightarrow m, \\quad R \\leftrightarrow c, \\quad C \\leftrightarrow k',
            correct: false,
            misconception:
              'Watch the reciprocal! Energy stored in a capacitor is $\\frac{1}{2C}q^2$ vs spring $\\frac{1}{2}kx^2$, so $1/C \\leftrightarrow k$ (capacitance is compliance $1/k$).',
          },
          {
            id: 'b',
            latex: 'L \\leftrightarrow k, \\quad R \\leftrightarrow c, \\quad \\tfrac{1}{C} \\leftrightarrow m',
            correct: false,
            misconception:
              'Inductance resists current changes ($\\frac{1}{2}L\\dot{q}^2$), directly matching kinetic mass inertia ($\\frac{1}{2}m\\dot{x}^2$).',
          },
          {
            id: 'c',
            latex: 'L \\leftrightarrow m, \\quad R \\leftrightarrow c, \\quad \\tfrac{1}{C} \\leftrightarrow k',
            correct: true,
          },
          {
            id: 'd',
            latex: 'L \\leftrightarrow m, \\quad \\tfrac{1}{R} \\leftrightarrow c, \\quad \\tfrac{1}{C} \\leftrightarrow k',
            correct: false,
            misconception:
              'In a SERIES loop, higher $R$ dissipates more power $R\\dot{q}^2$ just like higher $c$ dissipates $c\\dot{x}^2$, so $R \\leftrightarrow c$ directly.',
          },
        ],
        lockedLabel: 'Domain Analogy',
        lockedResultLatex: '\\textcolor{#34D399}{L \\leftrightarrow m,\\;\\; R \\leftrightarrow c,\\;\\; \\tfrac{1}{C} \\leftrightarrow k}',
        hint: 'Match the coefficients of $\\ddot{q}, \\dot{q}, q$ directly to $\\ddot{x}, \\dot{x}, x$.',
      },
      {
        stepType: 'critical_r',
        badge: 'Critical Resistance R_crit',
        whyThisStep:
          'Using the exact analogy $c_{\\text{crit}} = 2\\sqrt{mk} \\iff R_{\\text{crit}} = 2\\sqrt{L/C}$ lets you size damping resistors instantly to suppress filter ringing without over-dissipating power.',
        systemImpact:
          'Raising series resistance from $4\\,\\Omega$ to $R_{\\text{crit}} = 2\\sqrt{10} \\approx 6.32\\,\\Omega$ moves the poles to $s = -6.32, -6.32$ and eliminates capacitor voltage overshoot completely.',
        prompt:
          'Using $L = 0.5\\text{ H}$ and $C = 0.05\\text{ F}$, solve for the exact critical resistance $R_{\\text{crit}}$ that yields $\\zeta = 1$.',
        highlightLatex:
          '\\frac{\\textcolor{#F59E0B}{R_{\\text{crit}}}}{L} = 2\\,\\omega_n = \\frac{2}{\\sqrt{LC}} \\implies \\textcolor{#F59E0B}{R_{\\text{crit}}} = 2\\sqrt{\\frac{\\textcolor{#22D3EE}{L}}{\\textcolor{#22D3EE}{C}}}',
        options: [
          {
            id: 'a',
            latex: 'R_{\\text{crit}} = 2\\sqrt{10} \\approx 6.32\\,\\Omega',
            correct: true,
          },
          {
            id: 'b',
            latex: 'R_{\\text{crit}} = \\sqrt{10} \\approx 3.16\\,\\Omega',
            correct: false,
            misconception:
              'Don\'t drop the factor of $2$: $R_{\\text{crit}} = 2\\sqrt{L/C} = 2\\sqrt{0.5/0.05} = 2\\sqrt{10}$.',
          },
          {
            id: 'c',
            latex: 'R_{\\text{crit}} = 20\\,\\Omega',
            correct: false,
            misconception:
              'Take the square root of $L/C = 10$ before multiplying by $2$: $2\\sqrt{10} \\approx 6.32\\,\\Omega$, not $2\\cdot 10 = 20\\,\\Omega$.',
          },
          {
            id: 'd',
            latex: 'R_{\\text{crit}} = 2\\sqrt{0.025} \\approx 0.316\\,\\Omega',
            correct: false,
            misconception:
              'Characteristic impedance is $\\sqrt{L/C}$ (ratio), not $\\sqrt{LC}$ (product).',
          },
        ],
        lockedLabel: 'Critical Resistance',
        lockedResultLatex: 'R_{\\text{crit}} = \\textcolor{#34D399}{2\\sqrt{L/C} = 2\\sqrt{10} \\approx 6.32\\,\\Omega}',
        hint: 'Evaluate $L/C = 0.5 / 0.05 = 10$, then multiply $\\sqrt{10}$ by $2$.',
      },
    ],
  },

  {
    id: 'mod2-rlc-parallel',
    tier: 'circuits',
    tierLabel: 'RLC Circuits',
    title: 'Parallel RLC Tank Impedance & Zero at Origin',
    mechatronicsContext:
      'Wireless inductive charging receivers and resonant ultrasonic drivers use current-driven parallel RLC tanks; knowing how a zero at the origin blocks DC and how shunt resistance controls damping prevents costly tuning errors.',
    expressionLatex: 'R=10\\Omega,\\; L=0.2\\text{H},\\; C=0.02\\text{F}\\;\\;(\\parallel\\text{RLC})',
    finalAnswerLatex:
      'Z(s)=\\frac{50s}{s^2+5s+250}, \\quad s=-2.5\\pm 15.61j, \\quad R\\to 5\\Omega \\Rightarrow \\sigma: 2.5\\to 5',
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 1.8],
      setpoint: 0,
      setpointLabel: 'DC Blocked (v_ss = 0 V)',
      primaryLabel: 'Halved R = 5 Ω (σ=5, ωd=15)',
      baselineLabel: 'Original R = 10 Ω (σ=2.5, ωd=15.6)',
      primaryFn: (t) => (50 / 15) * Math.exp(-5 * t) * Math.sin(15 * t),
      baselineFn: (t) =>
        (50 / Math.sqrt(243.75)) * Math.exp(-2.5 * t) * Math.sin(Math.sqrt(243.75) * t),
      defaultCursor: 0.25,
      subtitle:
        'Hover or drag across time $t$ (unit current step): the zero at $s=0$ forces steady-state voltage back to $0\\text{ V}$, while halving shunt $R$ from $10\\,\\Omega$ (Cyan) to $5\\,\\Omega$ (Emerald) DOUBLES decay rate $\\sigma$!',
      domainMeta: 'Parallel Tank Current-Step · Zero at s=0 · R=10 Ω vs R=5 Ω',
      metrics: [
        { label: 'Impedance Z(s)', value: '50s / (s²+5s+250)' },
        { label: 'Zero at Origin', value: 's = 0 (blocks DC)' },
        { label: 'Tank Poles', value: '−2.5 ± 15.61j (ζ=0.16)' },
        { label: 'Halve R → 5 Ω', value: 'σ: 2.5 → 5.0 (2× damp) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'kcl_node',
        badge: 'KCL Node Equation',
        whyThisStep:
          'In parallel topologies all branches share one voltage $v(t)$, so summing branch currents via KCL is far faster and less error-prone than mesh equations.',
        systemImpact:
          'The inductor integral term $\\frac{1}{L}\\int v\\,dt$ acts as a DC short circuit, guaranteeing that no steady DC voltage can survive across the tank.',
        prompt:
          'Write the KCL current balance at the shared node voltage $v(t)$ driven by current source $i_{\\text{in}}(t)$ across parallel $C, R, L$.',
        highlightLatex:
          'i_C + i_R + i_L = i_{\\text{in}}(t) \\quad\\text{at shared node } \\textcolor{#22D3EE}{v(t)}',
        options: [
          {
            id: 'a',
            latex: 'C\\dot{v} + \\frac{v}{R} + \\frac{1}{L}\\int v\\,dt = i_{\\text{in}}(t)',
            correct: true,
          },
          {
            id: 'b',
            latex: 'L\\dot{v} + R v + \\frac{1}{C}\\int v\\,dt = i_{\\text{in}}(t)',
            correct: false,
            misconception:
              'Those are impedances for a series loop; in KCL, capacitor current is $C\\dot{v}$, resistor current is $v/R$, and inductor current is $\\frac{1}{L}\\int v\\,dt$.',
          },
          {
            id: 'c',
            latex: 'C\\dot{v} + R v + L\\int v\\,dt = i_{\\text{in}}(t)',
            correct: false,
            misconception:
              'By Ohm\'s law and Faraday\'s law, $i_R = v/R$ and $i_L = \\frac{1}{L}\\int v\\,dt$ (both divide by $R$ and $L$).',
          },
          {
            id: 'd',
            latex: '\\frac{1}{C}\\dot{v} + \\frac{v}{R} + \\frac{1}{L}\\int v\\,dt = i_{\\text{in}}(t)',
            correct: false,
            misconception:
              'Capacitor constitutive law is $i_C = C\\dot{v}$, multiplying by $C$, not $1/C$.',
          },
        ],
        lockedLabel: 'KCL Balance',
        lockedResultLatex:
          '\\textcolor{#34D399}{C\\dot{v} + \\frac{v}{R} + \\frac{1}{L}\\int v\\,dt = i_{\\text{in}}(t)}',
        hint: 'Sum $i_C = C\\dot{v}$, $i_R = v/R$, and $i_L = \\frac{1}{L}\\int v\\,dt$.',
      },
      {
        stepType: 'impedance_tf',
        badge: 'Impedance TF Z(s) & Zero',
        whyThisStep:
          'Inverting total admittance $Y(s) = Cs + \\frac{1}{R} + \\frac{1}{Ls}$ exposes the numerator zero at $s = 0$ — the hallmark of a bandpass tank.',
        systemImpact:
          'The zero at $s = 0$ forces $Z(0) = 0$ (DC blocked by inductor) and $Z(\\infty) = 0$ (HF shorted by capacitor), turning the tank into a narrow bandpass impedance.',
        prompt:
          'Substitute $R=10\\,\\Omega,\\; L=0.2\\text{ H},\\; C=0.02\\text{ F}$ into $Y(s) = Cs + \\frac{1}{R} + \\frac{1}{Ls}$ and invert to obtain monic $Z(s) = V(s)/I_{\\text{in}}(s)$.',
        highlightLatex:
          'Z(s) = \\frac{1}{\\textcolor{#22D3EE}{0.02}s + \\textcolor{#F59E0B}{0.1} + \\textcolor{#22D3EE}{5}/s} = \\frac{s/0.02}{s^2 + \\tfrac{0.1}{0.02}s + \\tfrac{5}{0.02}}',
        options: [
          {
            id: 'a',
            latex: 'Z(s) = \\frac{50}{s^2 + 5s + 250}',
            correct: false,
            misconception:
              'Clearing the $1/s$ inductor term multiplies BOTH numerator and denominator by $s$, creating a zero $50s$ in the numerator!',
          },
          {
            id: 'b',
            latex: 'Z(s) = \\frac{50s}{s^2 + 5s + 250} \\;\\;(\\text{zero at } s=0)',
            correct: true,
          },
          {
            id: 'c',
            latex: 'Z(s) = \\frac{50s}{s^2 + 10s + 250}',
            correct: false,
            misconception:
              'Compute $\\frac{1}{RC} = \\frac{1}{(10)(0.02)} = \\frac{1}{0.2} = 5$, not $10$.',
          },
          {
            id: 'd',
            latex: 'Z(s) = \\frac{250s}{s^2 + 5s + 250}',
            correct: false,
            misconception:
              'The numerator is $s/C = s/0.02 = 50s$, whereas $250 = 1/(LC)$ belongs in the denominator.',
          },
        ],
        lockedLabel: 'Impedance Z(s)',
        lockedResultLatex: 'Z(s) = \\textcolor{#34D399}{\\frac{50s}{s^2 + 5s + 250}} \\;\\;(\\text{zero } s=0)',
        hint: 'Multiply numerator and denominator by $s/C = 50s$.',
      },
      {
        stepType: 'parallel_params',
        badge: 'Natural Freq & Light Damping',
        whyThisStep:
          'Evaluating $\\sigma$ and $\\zeta$ measures the sharpness (Q-factor $Q = \\frac{1}{2\\zeta}$) of a resonant tank.',
        systemImpact:
          'With $\\zeta \\approx 0.158$ ($Q = \\frac{1}{2\\zeta} = \\sqrt{10} \\approx 3.16$), the tank is lightly damped and rings strongly near $15.81\\text{ rad/s}$ before decaying.',
        prompt:
          'Extract $\\omega_n$, decay rate $\\sigma = \\zeta\\omega_n$, and damping ratio $\\zeta$ from $s^2 + 5s + 250$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{\\omega_n} = \\sqrt{250}, \\qquad \\textcolor{#F59E0B}{\\sigma} = \\frac{5}{2}, \\qquad \\zeta = \\frac{\\sigma}{\\omega_n}',
        options: [
          {
            id: 'a',
            latex: '\\omega_n \\approx 15.81,\\; \\sigma = 5.0,\\; \\zeta \\approx 0.316',
            correct: false,
            misconception:
              'The decay rate is HALF the $s^1$ coefficient: $\\sigma = 5/2 = 2.5$, not $5.0$.',
          },
          {
            id: 'b',
            latex: '\\omega_n \\approx 15.81,\\; \\sigma = 2.5,\\; \\zeta \\approx 0.158',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\omega_n = 250,\\; \\sigma = 2.5,\\; \\zeta = 0.01',
            correct: false,
            misconception:
              'Take the square root: $\\omega_n = \\sqrt{250} = 5\\sqrt{10} \\approx 15.81\\text{ rad/s}$.',
          },
          {
            id: 'd',
            latex: '\\omega_n \\approx 15.81,\\; \\sigma = 2.5,\\; \\zeta \\approx 0.632',
            correct: false,
            misconception:
              'Check $\\zeta = \\frac{2.5}{15.811} = \\frac{1}{2\\sqrt{10}} \\approx 0.158$.',
          },
        ],
        lockedLabel: 'Tank Parameters',
        lockedResultLatex: '\\textcolor{#34D399}{\\omega_n \\approx 15.81,\\; \\sigma = 2.5,\\; \\zeta \\approx 0.158}',
        hint: 'Use $\\omega_n = \\sqrt{250} \\approx 15.81$, $\\sigma = 5/2 = 2.5$, and $\\zeta = \\sigma/\\omega_n$.',
      },
      {
        stepType: 'parallel_poles',
        badge: 'Exact Tank Poles',
        whyThisStep:
          'For lightly damped systems ($\\zeta \\ll 1$), seeing how close $\\omega_d$ stays to $\\omega_n$ builds instant geometric intuition on the $s$-plane.',
        systemImpact:
          'At $s = -2.5 \\pm 15.61j$, the poles hug the $j\\omega$-axis tightly ($\\theta \\approx 81^\\circ$), producing ~6 full oscillation cycles before settling in $T_s \\approx 4/2.5 = 1.6\\text{ s}$.',
        prompt:
          'Compute the exact complex conjugate poles of $s^2 + 5s + 250 = 0$.',
        highlightLatex:
          's = -\\textcolor{#F59E0B}{2.5} \\pm j\\sqrt{\\textcolor{#22D3EE}{250} - (2.5)^2}',
        options: [
          {
            id: 'a',
            latex: 's = -2.5 \\pm j\\sqrt{250} \\approx -2.5 \\pm 15.81j',
            correct: false,
            misconception:
              'Subtract $\\sigma^2 = 6.25$ inside the square root: $\\omega_d = \\sqrt{250 - 6.25} = \\sqrt{243.75} \\approx 15.61$.',
          },
          {
            id: 'b',
            latex: 's = -5 \\pm j\\sqrt{225} = -5 \\pm 15j',
            correct: false,
            misconception:
              'Those are the poles when $R = 5\\,\\Omega$ ($\\sigma = 5$); at $R = 10\\,\\Omega$, $\\sigma = 2.5$.',
          },
          {
            id: 'c',
            latex: 's = -2.5 \\pm j\\sqrt{243.75} \\approx -2.5 \\pm 15.61j',
            correct: true,
          },
          {
            id: 'd',
            latex: 's = -2.5 \\pm j\\sqrt{245} \\approx -2.5 \\pm 15.65j',
            correct: false,
            misconception:
              'Square $2.5$ carefully: $(2.5)^2 = 6.25$ (not $5$), giving $250 - 6.25 = 243.75$.',
          },
        ],
        lockedLabel: 'Tank Poles',
        lockedResultLatex: 's = \\textcolor{#34D399}{-2.5 \\pm j\\sqrt{243.75} \\approx -2.5 \\pm 15.61j}',
        hint: 'Evaluate $250 - 2.5^2 = 250 - 6.25 = 243.75$.',
      },
      {
        stepType: 'shunt_r_effect',
        badge: 'Halving Shunt R → 5 Ω',
        whyThisStep:
          'Parallel RLC damping behaves OPPOSITE to series RLC damping — a crucial physical distinction when loading a resonant power stage or piezo driver.',
        systemImpact:
          'Halving shunt $R$ to $5\\,\\Omega$ draws twice the dissipative current ($v/R$), doubling $\\sigma$ from $2.5 \\to 5.0$ and cutting settling time in half ($1.6\\text{ s} \\to 0.8\\text{ s}$) with clean poles at $-5 \\pm 15j$!',
        prompt:
          'If the parallel load resistance $R$ is halved from $10\\,\\Omega$ to $5\\,\\Omega$, how do $\\sigma = \\frac{1}{2RC}$ and the damping ratio $\\zeta$ change?',
        highlightLatex:
          '\\sigma = \\frac{1}{2\\textcolor{#F59E0B}{R}C}: \\quad \\textcolor{#F59E0B}{R}: 10\\,\\Omega \\longrightarrow 5\\,\\Omega',
        options: [
          {
            id: 'a',
            latex: '\\sigma: 2.5 \\to 1.25 \\;\\;(\\text{damping halves})',
            correct: false,
            misconception:
              'That happens in a SERIES RLC ($\\sigma = R/2L$); in a PARALLEL RLC, $\\sigma = \\frac{1}{2RC}$ is INVERSELY proportional to $R$.',
          },
          {
            id: 'b',
            latex: '\\sigma: 2.5 \\to 5.0 \\;\\;(\\text{damping doubles})',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\sigma\\text{ unchanged},\\; \\omega_n\\text{ doubles}',
            correct: false,
            misconception:
              '$\\omega_n = 1/\\sqrt{LC}$ is independent of $R$; changing $R$ changes ONLY the damping coefficient $\\frac{1}{RC}$.',
          },
          {
            id: 'd',
            latex: '\\sigma: 2.5 \\to 10.0 \\;\\;(\\text{damping quadruples})',
            correct: false,
            misconception:
              '$\\sigma = \\frac{1}{2RC}$ scales linearly with $1/R$, so halving $R$ doubles $\\sigma$ ($2.5 \\to 5.0$), not quadruples it.',
          },
        ],
        lockedLabel: 'Shunt R Effect',
        lockedResultLatex: '\\textcolor{#34D399}{\\sigma: 2.5 \\to 5.0} \\;\\;(\\text{damping doubles, } s = -5 \\pm 15j)',
        hint: 'Check $\\sigma = \\frac{1}{2RC}$ when $R$ drops by a factor of $2$.',
      },
    ],
  },

  {
    id: 'mod2-active-sallen-key',
    tier: 'circuits',
    tierLabel: 'RLC Circuits',
    title: 'Buffered 2-Stage RC Cascade Under Feedback',
    mechatronicsContext:
      'Passive RC stages separated by unity-gain op-amp buffers can only create real, sluggish poles; wrapping active negative feedback around them synthesizes complex conjugate Butterworth or Chebyshev filter poles without bulky inductors.',
    expressionLatex: '\\tau_1=0.5\\text{s},\\; \\tau_2=0.25\\text{s} \\;\\;(\\text{RC} \\to \\text{CL})',
    finalAnswerLatex:
      'T(s)=\\frac{8K}{s^2+6s+8+8K}, \\quad K_{\\text{crit}}=0.125, \\quad K_{\\zeta=0.5}=3.5',
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 2.6],
      setpoint: 1,
      setpointLabel: 'Normalized Final Value = 1',
      primaryLabel: 'Feedback K=3.5 (ζ=0.5, ωn=6)',
      baselineLabel: 'Passive RC Cascade (s=−2, −4)',
      primaryFn: (t) =>
        1 -
        Math.exp(-3 * t) *
          (Math.cos(3 * Math.sqrt(3) * t) +
            (1 / Math.sqrt(3)) * Math.sin(3 * Math.sqrt(3) * t)),
      baselineFn: (t) => 1 - 2 * Math.exp(-2 * t) + Math.exp(-4 * t),
      defaultCursor: 0.38,
      subtitle:
        'Hover or drag across time $t$ (DC-normalized): passive buffered RC stages (Cyan dashed) can never overshoot, while feedback $K=3.5$ (Emerald) synthesizes complex poles $-3\\pm 3\\sqrt{3}\\,j$ with rapid rise time.',
      domainMeta: 'Buffered RC Cascade · Open-Loop vs Active Feedback K=3.5',
      metrics: [
        { label: 'Passive Poles', value: '−2, −4 (Overdamped)' },
        { label: 'Critical Gain', value: 'K = 1/8 = 0.125' },
        { label: 'Gain for ζ=0.5', value: 'K = 3.5' },
        { label: 'CL Poles (K=3.5)', value: '−3 ± 3√3 j ✓' },
      ],
    },
    steps: [
      {
        stepType: 'cascade_tf',
        badge: 'Buffered Cascade G(s)',
        whyThisStep:
          'Because a unity-gain op-amp buffer prevents loading between RC stages, the total open-loop transfer function is simply the exact product of the individual first-order blocks.',
        systemImpact:
          'Multiplying two unity-DC-gain lags gives $G(0) = 8/8 = 1$ with a $-40\\text{ dB/dec}$ high-frequency roll-off.',
        prompt:
          'Multiply two buffered RC low-pass stages with $\\tau_1 = 0.5\\text{ s}$ and $\\tau_2 = 0.25\\text{ s}$ and write $G(s)$ in monic denominator form.',
        highlightLatex:
          'G(s) = \\frac{1}{\\textcolor{#22D3EE}{0.5}s + 1}\\cdot\\frac{1}{\\textcolor{#F59E0B}{0.25}s + 1}',
        options: [
          {
            id: 'a',
            latex: 'G(s) = \\frac{1}{s^2 + 6s + 8}',
            correct: false,
            misconception:
              'Factoring $0.5$ and $0.25$ out of the denominator produces $0.125(s+2)(s+4)$, so $1/0.125 = 8$ must appear in the numerator.',
          },
          {
            id: 'b',
            latex: 'G(s) = \\frac{8}{s^2 + 6s + 8}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'G(s) = \\frac{2}{s^2 + 0.75s + 0.125}',
            correct: false,
            misconception:
              'The un-normalized form is $\\frac{1}{0.125s^2 + 0.75s + 1}$; divide top and bottom by $0.125$ to make it monic.',
          },
          {
            id: 'd',
            latex: 'G(s) = \\frac{8}{s^2 + 8s + 6}',
            correct: false,
            misconception:
              'Expand $(s+2)(s+4) = s^2 + 6s + 8$ (sum $= 6$, product $= 8$).',
          },
        ],
        lockedLabel: 'Cascade G(s)',
        lockedResultLatex: 'G(s) = \\textcolor{#34D399}{\\frac{8}{(s+2)(s+4)} = \\frac{8}{s^2 + 6s + 8}}',
        hint: 'Rewrite $\\frac{1}{0.5s+1} = \\frac{2}{s+2}$ and $\\frac{1}{0.25s+1} = \\frac{4}{s+4}$, then multiply.',
      },
      {
        stepType: 'passive_poles',
        badge: 'Open-Loop Passive Poles',
        whyThisStep:
          'Confirming that every passive RC cascade has $\\zeta \\ge 1$ explains why active op-amp feedback is required to build sharp Butterworth or resonant filters without inductors.',
        systemImpact:
          'Poles at $s = -2$ and $s = -4$ yield $\\zeta = \\frac{6}{2\\sqrt{8}} \\approx 1.06 > 1$, so the passive cascade is strictly overdamped and can never ring.',
        prompt:
          'Identify the open-loop poles and damping ratio $\\zeta$ of $G(s) = \\frac{8}{(s+2)(s+4)}$.',
        highlightLatex:
          '(s+2)(s+4) = 0, \\qquad \\zeta = \\frac{6}{2\\sqrt{8}}',
        options: [
          {
            id: 'a',
            latex: 's = -2,\\; -4 \\;\\;(\\zeta \\approx 1.06 > 1,\\; \\text{Overdamped})',
            correct: true,
          },
          {
            id: 'b',
            latex: 's = -0.5,\\; -0.25 \\;\\;(\\text{Overdamped})',
            correct: false,
            misconception:
              'Poles sit at the RECIPROCAL of time constants: $p = -1/\\tau$, giving $-2$ and $-4$, not $-0.5$ and $-0.25$.',
          },
          {
            id: 'c',
            latex: 's = -3 \\pm j \\;\\;(\\zeta \\approx 0.95,\\; \\text{Underdamped})',
            correct: false,
            misconception:
              '$(s+2)(s+4)$ already factors over the reals; no passive RC network can produce complex poles without feedback.',
          },
          {
            id: 'd',
            latex: 's = -2,\\; -4 \\;\\;(\\zeta = 0.75,\\; \\text{Underdamped})',
            correct: false,
            misconception:
              'Distinct real poles ALWAYS have $\\zeta > 1$: here $\\zeta = 3/\\sqrt{8} \\approx 1.061$.',
          },
        ],
        lockedLabel: 'Passive Poles',
        lockedResultLatex: 's = \\textcolor{#34D399}{-2,\\; -4} \\;\\;(\\textcolor{#34D399}{\\zeta \\approx 1.06,\\; \\text{Overdamped}})',
        hint: 'Read the roots directly from $(s+2)(s+4)=0$ and compute $6/(2\\sqrt{8})$.',
      },
      {
        stepType: 'feedback_tf',
        badge: 'Close Unity Feedback (Gain K)',
        whyThisStep:
          'Putting scalar gain $K$ around the RC cascade synthesizes a virtual inductor through feedback, unlocking complex poles on the vertical line $\\sigma = -3$.',
        systemImpact:
          'Because $K$ enters ONLY the constant term $8 + 8K$, the real-part midpoint stays pinned at $-3$ while $\\omega_n$ scales up with $\\sqrt{1+K}$.',
        prompt:
          'Cascade gain $K$ with $G(s) = \\frac{8}{s^2+6s+8}$ inside unity negative feedback to derive $T(s) = \\frac{KG(s)}{1 + KG(s)}$.',
        highlightLatex:
          'T(s) = \\frac{\\textcolor{#F59E0B}{K}\\cdot\\textcolor{#22D3EE}{\\frac{8}{s^2+6s+8}}}{1 + \\textcolor{#F59E0B}{K}\\cdot\\textcolor{#22D3EE}{\\frac{8}{s^2+6s+8}}}',
        options: [
          {
            id: 'a',
            latex: 'T(s) = \\frac{8K}{s^2 + 6s + 8 + K}',
            correct: false,
            misconception:
              'Keep the plant numerator factor $8$ attached to $K$: $L(s) = \\frac{8K}{s^2+6s+8}$ adds $8K$ (not $K$) to the denominator.',
          },
          {
            id: 'b',
            latex: 'T(s) = \\frac{8K}{s^2 + 6s + (8 + 8K)}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'T(s) = \\frac{K}{s^2 + 6s + (8 + 8K)}',
            correct: false,
            misconception:
              'Clearing $(s^2+6s+8)$ leaves the full forward numerator $8K$ on top.',
          },
          {
            id: 'd',
            latex: 'T(s) = \\frac{8K}{s^2 + (6+8K)s + 8}',
            correct: false,
            misconception:
              'Constant feedback $8K$ adds to the $s^0$ term $8$, leaving $6s$ untouched.',
          },
        ],
        lockedLabel: 'Closed-Loop T(s)',
        lockedResultLatex: 'T(s) = \\textcolor{#34D399}{\\frac{8K}{s^2 + 6s + (8 + 8K)}}',
        hint: 'Multiply numerator and denominator by $(s^2 + 6s + 8)$.',
      },
      {
        stepType: 'collide_critical',
        badge: 'Gain K for Critical Damping',
        whyThisStep:
          'Finding the breakaway gain $K_{\\text{crit}}$ pinpoints the exact threshold where active feedback overcomes the passive RC barrier and creates complex poles.',
        systemImpact:
          'It takes only a tiny gain $K = 0.125$ to collide the real poles at $s = -3, -3$ — any gain above $0.125$ creates virtual inductance and complex poles!',
        prompt:
          'Solve for the exact gain $K$ where the closed-loop denominator $s^2 + 6s + (8 + 8K)$ has a repeated critically damped pole.',
        highlightLatex:
          's^2 + 6s + (\\textcolor{#22D3EE}{8} + \\textcolor{#F59E0B}{8K}) = (s + \\textcolor{#34D399}{3})^2 = s^2 + 6s + 9',
        options: [
          {
            id: 'a',
            latex: 'K = 1 \\;\\;(s = -3,\\; -3)',
            correct: false,
            misconception:
              'Set $8 + 8K = 9$, which gives $8K = 1$, so $K = 1/8 = 0.125$ (not $1$).',
          },
          {
            id: 'b',
            latex: 'K = \\frac{1}{8} = 0.125 \\;\\;(s = -3,\\; -3)',
            correct: true,
          },
          {
            id: 'c',
            latex: 'K = \\frac{9}{8} = 1.125 \\;\\;(s = -3,\\; -3)',
            correct: false,
            misconception:
              'Remember to subtract the existing $+8$ in $8 + 8K = 9$: $8K = 9 - 8 = 1$.',
          },
          {
            id: 'd',
            latex: 'K = 0.5 \\;\\;(s = -3,\\; -3)',
            correct: false,
            misconception:
              'At $K = 0.5$, the constant term is $8 + 4 = 12 > 9$, which is already underdamped.',
          },
        ],
        lockedLabel: 'Breakaway Gain',
        lockedResultLatex: 'K_{\\text{crit}} = \\textcolor{#34D399}{\\frac{1}{8} = 0.125} \\;\\;(\\textcolor{#34D399}{s = -3,-3})',
        hint: 'Equate $8 + 8K = 3^2 = 9$ and solve for $K$.',
      },
      {
        stepType: 'target_zeta_half',
        badge: 'Solve K for ζ = 0.5',
        whyThisStep:
          'Tuning a single gain knob $K$ to hit a target damping ratio $\\zeta = 0.5$ is the exact design workflow behind active Sallen-Key filter tuning and root-locus gain selection.',
        systemImpact:
          'At $K = 3.5$, the active loop places poles at $s = -3 \\pm 3\\sqrt{3}\\,j$ ($\\omega_n = 6\\text{ rad/s}$), tripling bandwidth over the slowest passive pole while keeping overshoot at $16.3\\%$.',
        prompt:
          'Increase $K$ until the closed-loop poles achieve $\\zeta = 0.5$ ($\\omega_n = 6$). Solve for $K$ and the resulting closed-loop poles.',
        highlightLatex:
          '2(\\textcolor{#F59E0B}{0.5})\\omega_n = 6 \\implies \\omega_n^2 = 36 = \\textcolor{#22D3EE}{8} + \\textcolor{#F59E0B}{8K}',
        options: [
          {
            id: 'a',
            latex: 'K = 4.5, \\qquad s = -3 \\pm 3\\sqrt{3}\\,j',
            correct: false,
            misconception:
              'Subtract $8$ first: $8K = 36 - 8 = 28 \\implies K = 28/8 = 3.5$, not $36/8 = 4.5$.',
          },
          {
            id: 'b',
            latex: 'K = 3.5, \\qquad s = -3 \\pm 6j',
            correct: false,
            misconception:
              '$\\omega_n = 6$ is the distance from the origin; the imaginary coordinate is $\\omega_d = \\sqrt{36 - 9} = 3\\sqrt{3}$.',
          },
          {
            id: 'c',
            latex: 'K = 2.0, \\qquad s = -3 \\pm \\sqrt{15}\\,j',
            correct: false,
            misconception:
              'At $K=2$, $\\omega_n^2 = 24$ giving $\\zeta = 3/\\sqrt{24} \\approx 0.612$, not $0.5$.',
          },
          {
            id: 'd',
            latex: 'K = 3.5, \\qquad s = -3 \\pm 3\\sqrt{3}\\,j',
            correct: true,
          },
        ],
        lockedLabel: 'Active Filter Gain',
        lockedResultLatex: 'K = \\textcolor{#34D399}{3.5}, \\quad s_{\\text{CL}} = \\textcolor{#34D399}{-3 \\pm 3\\sqrt{3}\\,j}',
        hint: 'Solve $8 + 8K = 36$ for $K$, then find $\\omega_d = \\sqrt{36 - 3^2}$.',
      },
    ],
  },

  // =========================================================================
  // TIER 3: ELECTROMECHANICAL MOTORS & THERMAL PLANTS (2 problems)
  // =========================================================================
  {
    id: 'mod3-dc-motor-full',
    tier: 'electromech',
    tierLabel: 'Motors & Thermal',
    title: 'Armature-Controlled DC Motor Position Loop',
    mechatronicsContext:
      'Brushed and brushless DC servo actuators couple an electrical armature circuit directly to a rotating shaft via back-EMF; deriving the full coupled position model reveals free electrical braking and Type-1 zero steady-state error.',
    expressionLatex: 'J=0.5,\\; b=0.5,\\; R_a=2,\\; K_t=K_e=2',
    finalAnswerLatex:
      'G_\\theta(s)=\\frac{2}{s(s+5)}, \\qquad K_p = 6.25 \\implies \\zeta = \\frac{1}{\\sqrt{2}}',
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 2.8],
      setpoint: 1,
      setpointLabel: 'Target Angle θ_ref = 1 rad',
      primaryLabel: 'Optimal Kp=6.25 (ζ=0.707)',
      baselineLabel: 'Aggressive Kp=25 (ζ=0.354)',
      primaryFn: (t) => 1 - Math.exp(-2.5 * t) * (Math.cos(2.5 * t) + Math.sin(2.5 * t)),
      baselineFn: (t) => {
        const wd = Math.sqrt(43.75);
        return 1 - Math.exp(-2.5 * t) * (Math.cos(wd * t) + (2.5 / wd) * Math.sin(wd * t));
      },
      defaultCursor: 0.36,
      subtitle:
        'Hover or drag across time $t$: the built-in integrator $1/s$ gives ZERO steady-state angle error for any $K_p > 0$; $K_p=6.25$ (Emerald) hits crisp $4.3\\%$ overshoot while $K_p=25$ (Cyan dashed) rings over $30\\%$.',
      domainMeta: 'DC Motor Position Step · Type-1 Plant · ζ=0.707 vs ζ=0.354',
      metrics: [
        { label: 'Back-EMF b_eff', value: '2.5 (5× mechanical b!)' },
        { label: 'Position Plant', value: '2 / [s(s + 5)]' },
        { label: 'Optimal Gain Kp', value: '6.25 (Butterworth)' },
        { label: 'CL Poles', value: '−2.5 ± 2.5j (4.3% OS) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'coupled_eqs',
        badge: 'Coupled Electrical & Shaft ODEs',
        whyThisStep:
          'Electromechanical energy conversion couples two domains symmetrically: armature current drives torque ($K_t i$) while shaft speed induces opposing back-EMF ($K_e\\omega$).',
        systemImpact:
          'In SI units ($K_t = K_e$), power conservation guarantees zero lossless energy leakage between electrical ($K_e\\omega\\cdot i$) and mechanical ($K_t i\\cdot \\omega$) ports.',
        prompt:
          'Select the coupled armature KVL equation and rotor shaft torque balance linking voltage $v_a(t)$, current $i(t)$, and angular speed $\\omega(t)$.',
        highlightLatex:
          '\\text{Armature KVL } (L_a, R_a, \\textcolor{#F59E0B}{K_e\\omega}) \\;\\;\\&\\;\\; \\text{Shaft } (J, b, \\textcolor{#22D3EE}{K_t i})',
        options: [
          {
            id: 'a',
            latex: 'L_a\\dot{i} + R_a i + K_e\\omega = v_a, \\quad J\\dot{\\omega} + b\\omega = K_t i',
            correct: true,
          },
          {
            id: 'b',
            latex: 'L_a\\dot{i} + R_a i - K_e\\omega = v_a, \\quad J\\dot{\\omega} + b\\omega = K_t i',
            correct: false,
            misconception:
              'By Lenz\'s law, back-EMF OPPOSES applied voltage ($v_a - K_e\\omega = L_a\\dot{i} + R_a i$), so moving it left gives $+K_e\\omega$.',
          },
          {
            id: 'c',
            latex: 'L_a\\dot{i} + R_a i + K_t\\omega = v_a, \\quad J\\ddot{\\omega} + b\\dot{\\omega} = K_e i',
            correct: false,
            misconception:
              'Angular acceleration is $\\dot{\\omega}$ (not $\\ddot{\\omega}$), and torque constant $K_t$ multiplies current $i$ while back-EMF constant $K_e$ multiplies speed $\\omega$.',
          },
          {
            id: 'd',
            latex: 'R_a\\dot{i} + L_a i + K_e\\omega = v_a, \\quad J\\dot{\\omega} + b\\omega = K_t i',
            correct: false,
            misconception:
              'Inductor voltage is $L_a\\dot{i}$ and resistor voltage is $R_a i$, not swapped.',
          },
        ],
        lockedLabel: 'Coupled ODEs',
        lockedResultLatex:
          '\\textcolor{#34D399}{L_a\\dot{i} + R_a i + K_e\\omega = v_a,\\;\\; J\\dot{\\omega} + b\\omega = K_t i}',
        hint: 'Back-EMF drops voltage in the armature loop ($+K_e\\omega$) while torque $K_t i$ accelerates $J\\dot{\\omega} + b\\omega$.',
      },
      {
        stepType: 'back_emf_elim',
        badge: 'Eliminate Current (La ≈ 0)',
        whyThisStep:
          'Because electrical time constants ($L_a/R_a$) are typically $10\\text{–}100\\times$ faster than rotor inertia, dropping $L_a$ exposes the dramatic hidden damping created by back-EMF.',
        systemImpact:
          'Back-EMF adds pure electrical viscous damping $\\frac{K_t K_e}{R_a}$ directly to $b$ — explaining why shorting a DC motor\'s terminals makes the shaft feel stiff like thick oil!',
        prompt:
          'Set $L_a \\approx 0$, solve KVL for $i = \\frac{v_a - K_e\\omega}{R_a}$, and substitute into $J\\dot{\\omega} + b\\omega = K_t i$.',
        highlightLatex:
          'J\\dot{\\omega} + b\\omega = K_t\\!\\left(\\frac{v_a - \\textcolor{#F59E0B}{K_e\\omega}}{\\textcolor{#22D3EE}{R_a}}\\right)',
        options: [
          {
            id: 'a',
            latex: 'J\\dot{\\omega} + \\left(b - \\frac{K_t K_e}{R_a}\\right)\\omega = \\frac{K_t}{R_a}v_a',
            correct: false,
            misconception:
              'Moving $-\\frac{K_t K_e}{R_a}\\omega$ from the right-hand side to the left-hand side makes it PLUS, increasing effective damping.',
          },
          {
            id: 'b',
            latex: 'J\\dot{\\omega} + \\left(b + \\frac{K_t K_e}{R_a}\\right)\\omega = \\frac{K_t}{R_a}v_a',
            correct: true,
          },
          {
            id: 'c',
            latex: 'J\\dot{\\omega} + (b + K_t K_e R_a)\\omega = K_t R_a v_a',
            correct: false,
            misconception:
              'Ohm\'s law divides voltage by $R_a$, so lower armature resistance produces STRONGER back-EMF braking ($1/R_a$).',
          },
          {
            id: 'd',
            latex: 'J\\dot{\\omega} + b\\omega = \\frac{K_t}{R_a}v_a',
            correct: false,
            misconception:
              'Do not drop the back-EMF term $-K_e\\omega$; it is typically the largest source of motor damping!',
          },
        ],
        lockedLabel: 'Back-EMF Damping',
        lockedResultLatex:
          '\\textcolor{#34D399}{J\\dot{\\omega} + \\left(b + \\frac{K_t K_e}{R_a}\\right)\\omega = \\frac{K_t}{R_a}v_a}',
        hint: 'Substitute $i = (v_a - K_e\\omega)/R_a$ and collect all $\\omega$ terms on the left.',
      },
      {
        stepType: 'vel_tf',
        badge: 'Velocity TF Ω(s)/Va(s)',
        whyThisStep:
          'Evaluating the concrete pole of the velocity stage reveals the motor\'s true mechanical time constant $\\tau_m$ after electrical braking is accounted for.',
        systemImpact:
          'Back-EMF quadruples friction alone ($b_{\\text{eff}} = 0.5 + 2.0 = 2.5$), pushing the velocity pole from $-1$ all the way to $-5$ ($5\\times$ faster speed response: $\\tau_m = 0.2\\text{ s}$!).',
        prompt:
          'Plug $J=0.5,\\; b=0.5,\\; R_a=2,\\; K_t=K_e=2$ into the eliminated ODE and write the monic velocity transfer function $\\Omega(s)/V_a(s)$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{0.5}\\dot{\\omega} + \\left(0.5 + \\frac{\\textcolor{#F59E0B}{2\\cdot 2}}{\\textcolor{#22D3EE}{2}}\\right)\\omega = \\frac{2}{2}v_a',
        options: [
          {
            id: 'a',
            latex: '\\frac{\\Omega(s)}{V_a(s)} = \\frac{1}{s + 5}',
            correct: false,
            misconception:
              'Dividing $0.5s + 2.5$ by $J = 0.5$ also divides the numerator $1$ by $0.5$, yielding $2$ on top.',
          },
          {
            id: 'b',
            latex: '\\frac{\\Omega(s)}{V_a(s)} = \\frac{2}{s + 1}',
            correct: false,
            misconception:
              'Include the back-EMF damping $\\frac{K_t K_e}{R_a} = 2$: total damping is $0.5 + 2 = 2.5$, and $2.5/0.5 = 5$.',
          },
          {
            id: 'c',
            latex: '\\frac{\\Omega(s)}{V_a(s)} = \\frac{2}{s + 5}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\frac{\\Omega(s)}{V_a(s)} = \\frac{0.5}{s + 2.5}',
            correct: false,
            misconception:
              'Normalize by dividing top and bottom by $0.5$ (i.e. multiplying by $2$): $\\frac{1}{0.5s+2.5} = \\frac{2}{s+5}$.',
          },
        ],
        lockedLabel: 'Velocity TF',
        lockedResultLatex: '\\frac{\\Omega(s)}{V_a(s)} = \\textcolor{#34D399}{\\frac{2}{s + 5}}',
        hint: 'Simplify $0.5s + 2.5 = 0.5(s + 5)$ and multiply numerator and denominator by $2$.',
      },
      {
        stepType: 'pos_tf',
        badge: 'Integrate to Position Θ(s)/Va(s)',
        whyThisStep:
          'Integrating angular velocity $\\omega = \\dot{\\theta}$ to shaft angle $\\theta$ introduces a free pole at $s = 0$ — automatically making every DC motor position plant a Type-1 system.',
        systemImpact:
          'That free integrator $1/s$ guarantees ZERO steady-state position error to any constant angle command even with a purely proportional controller (no I-term needed for step setpoints!).',
        prompt:
          'Using $\\Theta(s) = \\Omega(s)/s$, write the armature-voltage-to-shaft-position transfer function $G_\\theta(s) = \\Theta(s)/V_a(s)$.',
        highlightLatex:
          'G_\\theta(s) = \\frac{1}{\\textcolor{#F59E0B}{s}}\\cdot\\textcolor{#22D3EE}{\\frac{2}{s + 5}}',
        options: [
          {
            id: 'a',
            latex: 'G_\\theta(s) = \\frac{2s}{s + 5}',
            correct: false,
            misconception:
              'Multiplying by $s$ differentiates velocity into acceleration; integrating velocity to position DIVIDES by $s$.',
          },
          {
            id: 'b',
            latex: 'G_\\theta(s) = \\frac{2}{s(s + 5)} \\;\\;(\\text{Type-1 plant})',
            correct: true,
          },
          {
            id: 'c',
            latex: 'G_\\theta(s) = \\frac{2}{(s + 5)^2}',
            correct: false,
            misconception:
              'Pure integration adds a pole at the origin $s = 0$, not a second pole at $s = -5$.',
          },
          {
            id: 'd',
            latex: 'G_\\theta(s) = \\frac{2}{s^2(s + 5)}',
            correct: false,
            misconception:
              'One integration converts velocity $\\omega$ to position $\\theta$; $1/s^2$ would integrate acceleration.',
          },
        ],
        lockedLabel: 'Position Plant',
        lockedResultLatex: 'G_\\theta(s) = \\textcolor{#34D399}{\\frac{2}{s(s + 5)}} \\;\\;(\\text{Type-1})',
        hint: 'Multiply the velocity transfer function $\\frac{2}{s+5}$ by the integrator $\\frac{1}{s}$.',
      },
      {
        stepType: 'pos_cl_tf',
        badge: 'Close Unity Position Loop',
        whyThisStep:
          'Wrapping an encoder feedback loop with gain $K_p$ converts the unstable-to-disturbances free integrator into a damped, self-centering second-order servo.',
        systemImpact:
          'Check $T(0) = \\frac{2K_p}{2K_p} = 1$ for ANY $K_p > 0$: the closed-loop motor tracks constant angle commands with zero steady-state droop!',
        prompt:
          'Close unity negative position feedback with proportional gain $K_p$ around $G_\\theta(s) = \\frac{2}{s(s+5)}$ to obtain $T(s) = \\Theta(s)/\\Theta_{\\text{ref}}(s)$.',
        highlightLatex:
          'T(s) = \\frac{\\textcolor{#F59E0B}{K_p}\\cdot\\textcolor{#22D3EE}{\\frac{2}{s(s+5)}}}{1 + \\textcolor{#F59E0B}{K_p}\\cdot\\textcolor{#22D3EE}{\\frac{2}{s(s+5)}}}',
        options: [
          {
            id: 'a',
            latex: 'T(s) = \\frac{2K_p}{s^2 + 5s + 2K_p}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'T(s) = \\frac{2K_p}{s^2 + (5 + 2K_p)s}',
            correct: false,
            misconception:
              'Clearing $s(s+5)$ gives $s^2 + 5s + 2K_p$ — the $2K_p$ is the constant ($s^0$) restoring stiffness, not attached to $s$.',
          },
          {
            id: 'c',
            latex: 'T(s) = \\frac{K_p}{s^2 + 5s + 2K_p}',
            correct: false,
            misconception:
              'Keep the motor gain factor $2$ in the numerator ($2K_p$) so that $T(0) = 1$.',
          },
          {
            id: 'd',
            latex: 'T(s) = \\frac{2K_p}{s^2 + 5s + K_p}',
            correct: false,
            misconception:
              'Both numerator and denominator add the full loop numerator $2K_p$, not $K_p$.',
          },
        ],
        lockedLabel: 'Position Loop T(s)',
        lockedResultLatex: 'T(s) = \\textcolor{#34D399}{\\frac{2K_p}{s^2 + 5s + 2K_p}}',
        hint: 'Multiply top and bottom by $s(s+5) = s^2 + 5s$.',
      },
      {
        stepType: 'optimal_kp',
        badge: 'Tune Kp for ζ = 1/√2',
        whyThisStep:
          'The Butterworth damping ratio $\\zeta = 1/\\sqrt{2} \\approx 0.707$ is the universal mechatronics sweet spot: maximally flat frequency response ($M_r = 1$) with crisp $4.3\\%$ overshoot.',
        systemImpact:
          'Setting $K_p = 6.25$ places the servo poles right on the $45^\\circ$ Butterworth rays at $s = -2.5 \\pm 2.5j$ ($T_s \\approx 1.6\\text{ s}$, $4.3\\%$ overshoot, $0\\%$ DC error!).',
        prompt:
          'Solve for the exact proportional gain $K_p$ that places $s^2 + 5s + 2K_p = 0$ at $\\zeta = \\frac{1}{\\sqrt{2}} \\approx 0.707$.',
        highlightLatex:
          '2\\left(\\textcolor{#F59E0B}{\\tfrac{1}{\\sqrt{2}}}\\right)\\omega_n = 5 \\implies \\omega_n^2 = \\textcolor{#22D3EE}{2K_p}',
        options: [
          {
            id: 'a',
            latex: 'K_p = 12.5 \\;\\;(s = -2.5 \\pm 4.33j)',
            correct: false,
            misconception:
              '$12.5$ is $\\omega_n^2 = 2K_p$; remember to divide by the plant gain $2$ to get $K_p = 6.25$.',
          },
          {
            id: 'b',
            latex: 'K_p = 3.125 \\;\\;(s = -2.5,\\; -2.5)',
            correct: false,
            misconception:
              '$K_p = 3.125$ gives $\\omega_n^2 = 6.25$ ($\\zeta = 1.0$, critical damping); for $\\zeta = 1/\\sqrt{2}$, $\\omega_n^2 = 2(2.5)^2 = 12.5$.',
          },
          {
            id: 'c',
            latex: 'K_p = 6.25 \\;\\;(s = -2.5 \\pm 2.5j)',
            correct: true,
          },
          {
            id: 'd',
            latex: 'K_p = 25.0 \\;\\;(s = -2.5 \\pm 6.61j)',
            correct: false,
            misconception:
              'At $K_p = 25$, $\\omega_n^2 = 50$ which drops $\\zeta$ to $0.354$ (over $30\\%$ overshoot!).',
          },
        ],
        lockedLabel: 'Optimal Gain Kp',
        lockedResultLatex: 'K_p = \\textcolor{#34D399}{6.25} \\;\\;(\\textcolor{#34D399}{s = -2.5 \\pm 2.5j,\\; \\zeta = 0.707})',
        hint: 'From $\\sqrt{2}\\,\\omega_n = 5$, compute $\\omega_n^2 = 25/2 = 12.5$, then solve $2K_p = 12.5$.',
      },
    ],
  },

  {
    id: 'mod3-thermal-chamber',
    tier: 'electromech',
    tierLabel: 'Motors & Thermal',
    title: 'Two-Zone Thermal Chamber & Feedback Oscillation',
    mechatronicsContext:
      'In semiconductor wafer chucks and reflow ovens, heat flows sequentially from a heater block through thermal resistance into the payload; discovering how high proportional gain makes even a purely diffusive thermal plant ring prevents temperature cycling.',
    expressionLatex: 'C_1=C_2=1,\\; R_{12}=R_a=1 \\;\\;(\\text{2-Zone})',
    finalAnswerLatex:
      'G(s)=\\frac{1}{s^2+3s+1} \\;\\;(\\text{real poles}) \\xrightarrow{K_p=8} \\zeta_{\\text{cl}}=0.5',
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 7.0],
      setpoint: 8 / 9,
      setpointLabel: 'CL Final Temp = 8/9',
      primaryLabel: 'Closed-Loop Kp=8 (ζ=0.5, rings!)',
      baselineLabel: 'Open-Loop Passive (Overdamped)',
      primaryFn: (t) =>
        (8 / 9) *
        (1 -
          Math.exp(-1.5 * t) *
            (Math.cos(1.5 * Math.sqrt(3) * t) +
              (1 / Math.sqrt(3)) * Math.sin(1.5 * Math.sqrt(3) * t))),
      baselineFn: (t) => {
        const p1 = (-3 + Math.sqrt(5)) / 2;
        const p2 = (-3 - Math.sqrt(5)) / 2;
        return 1 - (p2 * Math.exp(p1 * t) - p1 * Math.exp(p2 * t)) / (p2 - p1);
      },
      defaultCursor: 0.28,
      subtitle:
        'Hover or drag across time $t$: the passive 2-zone oven (Cyan dashed) creeps monotonically ($\\tau \\approx 2.6\\text{ s}$), while feedback $K_p=8$ (Emerald) accelerates it dramatically — yet induces classic thermal overshoot!',
      domainMeta: '2-Zone Thermal Step · Passive Real Poles vs CL Kp=8 (ζ=0.5)',
      metrics: [
        { label: 'Payload TF G(s)', value: '1 / (s² + 3s + 1)' },
        { label: 'Open-Loop Poles', value: '−0.382, −2.618 (Real)' },
        { label: 'CL Poly (Kp=8)', value: 's² + 3s + 9 = 0' },
        { label: 'CL Damping ζ', value: '0.50 (16.3% OS!) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'thermal_odes',
        badge: 'Two-Zone Heat Balance',
        whyThisStep:
          'Thermal systems follow an exact RC-circuit analogy (temperature $\\leftrightarrow$ voltage, heat flow $\\leftrightarrow$ current), letting you write coupled energy balances directly.',
        systemImpact:
          'Because the heater block ($T_1$) and payload ($T_2$) exchange heat symmetrically across $R_{12}$, a sensor placed on the payload lags behind heater power by two cascaded thermal stages.',
        prompt:
          'Write the coupled energy balances for heater $T_1$ (input $q$) and payload $T_2$ (ambient loss through $R_a$) with $C_1=C_2=1,\\; R_{12}=R_a=1$.',
        highlightLatex:
          'C_1\\dot{T}_1 + \\frac{T_1-T_2}{R_{12}} = q, \\qquad C_2\\dot{T}_2 + \\frac{T_2-T_1}{R_{12}} + \\frac{T_2}{R_a} = 0',
        options: [
          {
            id: 'a',
            latex: '\\dot{T}_1 + T_1 - T_2 = q, \\quad \\dot{T}_2 + 2T_2 - T_1 = 0',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\dot{T}_1 + T_1 + T_2 = q, \\quad \\dot{T}_2 + 2T_2 + T_1 = 0',
            correct: false,
            misconception:
              'Conductive heat flow depends on temperature DIFFERENCE $(T_1 - T_2)$, so the cross-coupling terms carry minus signs.',
          },
          {
            id: 'c',
            latex: '\\dot{T}_1 + T_1 - T_2 = q, \\quad \\dot{T}_2 + T_2 - T_1 = 0',
            correct: false,
            misconception:
              'Don\'t omit the payload\'s ambient heat loss $+T_2/R_a$: combining $(T_2 - T_1) + T_2$ gives $+2T_2 - T_1$.',
          },
          {
            id: 'd',
            latex: '\\dot{T}_1 + 2T_1 - T_2 = q, \\quad \\dot{T}_2 + T_2 - T_1 = 0',
            correct: false,
            misconception:
              'Ambient loss $R_a$ is attached to the payload $T_2$ (not heater $T_1$), so the $2$ multiplies $T_2$.',
          },
        ],
        lockedLabel: 'Coupled Heat ODEs',
        lockedResultLatex: '\\textcolor{#34D399}{\\dot{T}_1 + T_1 - T_2 = q,\\;\\; \\dot{T}_2 + 2T_2 - T_1 = 0}',
        hint: 'Plug $C_1=C_2=R_{12}=R_a=1$ and collect the two $+T_2$ terms in the second equation.',
      },
      {
        stepType: 'elim_t1',
        badge: 'Eliminate T₁ → Payload ODE',
        whyThisStep:
          'Eliminating the internal heater temperature $T_1$ collapses the two coupled first-order thermal zones into a single input-output differential equation for the controlled payload $T_2$.',
        systemImpact:
          'The resulting $3\\dot{T}_2$ coefficient is larger than $2\\sqrt{1\\cdot 1} = 2$, reflecting the inherent overdamped diffusion of coupled passive heat capacities.',
        prompt:
          'Solve the second equation for $T_1 = \\dot{T}_2 + 2T_2$ and substitute into $\\dot{T}_1 + T_1 - T_2 = q$ to get the payload ODE.',
        highlightLatex:
          '(\\textcolor{#22D3EE}{\\ddot{T}_2 + 2\\dot{T}_2}) + (\\textcolor{#F59E0B}{\\dot{T}_2 + 2T_2}) - T_2 = q',
        options: [
          {
            id: 'a',
            latex: '\\ddot{T}_2 + 3\\dot{T}_2 + 2T_2 = q(t)',
            correct: false,
            misconception:
              'Remember to subtract the $-T_2$ term: $2T_2 - T_2 = +1\\cdot T_2$, not $2T_2$.',
          },
          {
            id: 'b',
            latex: '\\ddot{T}_2 + 2\\dot{T}_2 + T_2 = q(t)',
            correct: false,
            misconception:
              'Add BOTH first-derivative terms: $2\\dot{T}_2$ from $\\dot{T}_1$ plus $\\dot{T}_2$ from $T_1$ equals $3\\dot{T}_2$.',
          },
          {
            id: 'c',
            latex: '\\ddot{T}_2 + 3\\dot{T}_2 + T_2 = q(t)',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\ddot{T}_2 + 3\\dot{T}_2 + 3T_2 = q(t)',
            correct: false,
            misconception:
              'Collect $2T_2 - T_2 = T_2$ (not $2T_2 + T_2$).',
          },
        ],
        lockedLabel: 'Payload ODE',
        lockedResultLatex: '\\textcolor{#34D399}{\\ddot{T}_2 + 3\\dot{T}_2 + T_2 = q(t)}',
        hint: 'Differentiate $T_1 = \\dot{T}_2 + 2T_2$ to get $\\dot{T}_1 = \\ddot{T}_2 + 2\\dot{T}_2$, then sum all terms.',
      },
      {
        stepType: 'thermal_tf',
        badge: 'Payload Transfer Function',
        whyThisStep:
          'Converting the eliminated payload ODE into $G(s) = T_2(s)/Q(s)$ gives the exact plant seen by a thermocouple-based temperature controller.',
        systemImpact:
          'At DC ($s=0$), $G(0) = 1$: every watt of steady heater power must escape through $R_a = 1$, raising payload temperature by $1^\\circ\\text{C/W}$ regardless of $R_{12}$.',
        prompt:
          'Transform $\\ddot{T}_2 + 3\\dot{T}_2 + T_2 = q(t)$ into the payload transfer function $G(s) = T_2(s)/Q(s)$.',
        highlightLatex:
          '(s^2 + 3s + 1)\\,T_2(s) = Q(s) \\implies G(s) = \\frac{T_2(s)}{Q(s)}',
        options: [
          {
            id: 'a',
            latex: 'G(s) = \\frac{s + 2}{s^2 + 3s + 1}',
            correct: false,
            misconception:
              '$\\frac{s+2}{s^2+3s+1}$ is the HEATER transfer function $T_1(s)/Q(s)$; the payload $T_2(s)/Q(s)$ has no finite zero (numerator $= 1$).',
          },
          {
            id: 'b',
            latex: 'G(s) = \\frac{1}{s^2 + 3s + 1}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'G(s) = \\frac{3}{s^2 + 3s + 1}',
            correct: false,
            misconception:
              'The forcing term $q(t)$ has coefficient $1$, preserving $G(0) = 1$.',
          },
          {
            id: 'd',
            latex: 'G(s) = \\frac{1}{(s + 1)(s + 2)}',
            correct: false,
            misconception:
              '$(s+1)(s+2) = s^2 + 3s + 2$; thermal loading between zones shifts the constant term to $1$, spreading the poles apart.',
          },
        ],
        lockedLabel: 'Thermal TF G(s)',
        lockedResultLatex: 'G(s) = \\textcolor{#34D399}{\\frac{1}{s^2 + 3s + 1}}',
        hint: 'Divide $T_2(s)$ by $Q(s)$ from $(s^2 + 3s + 1)T_2(s) = Q(s)$.',
      },
      {
        stepType: 'thermal_poles',
        badge: 'Real Poles of Passive Heat',
        whyThisStep:
          'Solving for the exact open-loop poles illustrates a deep law of thermodynamics: passive conductive-capacitive thermal networks ALWAYS have strictly real negative poles and can never ring on their own.',
        systemImpact:
          'The slow pole at $s \\approx -0.382$ dominates the oven with a sluggish open-loop settling time $T_s \\approx 4/0.382 \\approx 10.5\\text{ s}$ (7× slower than the fast pole at $-2.618$).',
        prompt:
          'Solve $s^2 + 3s + 1 = 0$ and classify the open-loop thermal dynamics.',
        highlightLatex:
          's = \\frac{-3 \\pm \\sqrt{\\textcolor{#22D3EE}{3^2 - 4(1)(1)}}}{2}',
        options: [
          {
            id: 'a',
            latex: 's = \\frac{-3 \\pm \\sqrt{5}}{2} \\approx -0.382,\\; -2.618 \\;(\\text{Overdamped})',
            correct: true,
          },
          {
            id: 'b',
            latex: 's = -1.5 \\pm 0.5j \\;(\\text{Underdamped})',
            correct: false,
            misconception:
              'The discriminant is $9 - 4 = +5 > 0$ (strictly positive); passive thermal systems cannot have complex poles.',
          },
          {
            id: 'c',
            latex: 's = -1,\\; -2 \\;(\\text{Overdamped})',
            correct: false,
            misconception:
              'Roots $-1, -2$ multiply to $+2$, whereas our constant term is $+1$.',
          },
          {
            id: 'd',
            latex: 's = \\frac{-3 \\pm \\sqrt{13}}{2} \\approx +0.303,\\; -3.303 \\;(\\text{Unstable})',
            correct: false,
            misconception:
              'Check the sign inside the discriminant: $b^2 - 4ac = 9 - 4 = 5$, not $9 + 4 = 13$.',
          },
        ],
        lockedLabel: 'Passive Poles',
        lockedResultLatex: 's = \\textcolor{#34D399}{\\frac{-3 \\pm \\sqrt{5}}{2} \\approx -0.382,\\; -2.618}',
        hint: 'Apply the quadratic formula to $s^2 + 3s + 1 = 0$: $\\Delta = 9 - 4 = 5$.',
      },
      {
        stepType: 'thermal_cl_ring',
        badge: 'Closed-Loop Ringing (Kp = 8)',
        whyThisStep:
          'Many engineers are surprised when a purely thermal oven starts oscillating; closing the loop shows algebraically how high feedback gain manufactures complex poles out of two real lags.',
        systemImpact:
          'At $K_p = 8$, the poles jump to $-1.5 \\pm 2.60j$ ($\\zeta_{\\text{cl}} = 0.5$): settling speeds up $4\\times$ ($10.5\\text{ s} \\to 2.7\\text{ s}$), but the payload now overshoots by $16.3\\%$ — dangerous for thermally sensitive wafers!',
        prompt:
          'Close unity negative feedback on $T_2$ with proportional gain $K_p = 8$. Find the closed-loop damping ratio $\\zeta_{\\text{cl}}$ and poles.',
        highlightLatex:
          's^2 + 3s + (\\textcolor{#22D3EE}{1} + \\textcolor{#F59E0B}{8}) = s^2 + 3s + 9 = 0',
        options: [
          {
            id: 'a',
            latex: '\\zeta_{\\text{cl}} = 1.0, \\quad s = -3,\\; -3',
            correct: false,
            misconception:
              'For $s^2 + 3s + 9$, $\\omega_n = 3$, so $2\\zeta(3) = 3 \\implies \\zeta = 0.5$ (not $1.0$, which would require $6s$).',
          },
          {
            id: 'b',
            latex: '\\zeta_{\\text{cl}} = 0.5, \\quad s = -1.5 \\pm 3j',
            correct: false,
            misconception:
              '$\\omega_n = 3$ is the radius; compute $\\omega_d = \\sqrt{9 - 1.5^2} = \\sqrt{6.75} = \\frac{3\\sqrt{3}}{2} \\approx 2.60$.',
          },
          {
            id: 'c',
            latex: '\\text{Still overdamped — thermal plants cannot oscillate}',
            correct: false,
            misconception:
              'PASSIVE open-loop thermal plants cannot oscillate, but ACTIVE feedback around 2+ thermal lags easily creates complex poles ($\\Delta = 9 - 36 = -27 < 0$)!',
          },
          {
            id: 'd',
            latex: '\\zeta_{\\text{cl}} = 0.5, \\quad s = -1.5 \\pm \\tfrac{3\\sqrt{3}}{2}\\,j',
            correct: true,
          },
        ],
        lockedLabel: 'Closed-Loop Ringing',
        lockedResultLatex:
          '\\textcolor{#34D399}{\\zeta_{\\text{cl}} = 0.5}, \\quad s_{\\text{CL}} = \\textcolor{#34D399}{-1.5 \\pm \\tfrac{3\\sqrt{3}}{2}\\,j}',
        hint: 'Match $s^2 + 3s + 9$ to $s^2 + 2\\zeta\\omega_n s + \\omega_n^2$ with $\\omega_n = 3$.',
      },
    ],
  },

  // =========================================================================
  // TIER 4: CLOSED-LOOP s-PLANE DESIGN & POLE PLACEMENT (2 problems)
  // =========================================================================
  {
    id: 'mod4-cl-pd-placement',
    tier: 'closed-loop-s',
    tierLabel: 'Closed-Loop s-Plane',
    title: 'Closed-Loop PD Pole Placement & LHP Zero',
    mechatronicsContext:
      'An active piezo nanopositioner must be actively stiffened and damped using a PD law; placing the closed-loop poles is only half the story — you must also account for the closed-loop zero injected by derivative action.',
    expressionLatex: 'G(s)=\\frac{2}{s^2+2s+5},\\; s_d=-4\\pm 4j',
    finalAnswerLatex:
      'K_d = 3,\\; K_p = 13.5, \\quad T(s)=\\frac{6s+27}{s^2+8s+32} \\;\\;(z_{\\text{CL}}=-4.5)',
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 1.8],
      setpoint: 27 / 32,
      setpointLabel: 'CL DC Gain = 27/32 ≈ 0.844',
      primaryLabel: 'Actual PD T(s) (with zero z=−4.5)',
      baselineLabel: 'Pure All-Pole 27/(s²+8s+32)',
      primaryFn: (t) =>
        27 / 32 - Math.exp(-4 * t) * ((27 / 32) * Math.cos(4 * t) - (21 / 32) * Math.sin(4 * t)),
      baselineFn: (t) => (27 / 32) * (1 - Math.exp(-4 * t) * (Math.cos(4 * t) + Math.sin(4 * t))),
      defaultCursor: 0.28,
      subtitle:
        'Hover or drag across time $t$: BOTH curves share identical poles $s=-4\\pm 4j$, yet the PD numerator zero at $z=-4.5$ (Emerald) shoots upward $2\\times$ faster and boosts overshoot from $4.3\\%$ (Cyan dashed) to $\\sim 24\\%$!',
      domainMeta: 'Zero Effect · Same Poles −4±4j · With vs Without Zero z=−4.5',
      metrics: [
        { label: 'Derivative Kd', value: '3.0' },
        { label: 'Proportional Kp', value: '13.5' },
        { label: 'Placed Poles', value: '−4 ± 4j (ζ=0.707)' },
        { label: 'Induced Zero', value: 'z = −4.5 (boosts OS!) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'pd_cl_tf',
        badge: 'Closed-Loop T(s) with PD',
        whyThisStep:
          'Unlike pure P-control (which can only shift the $s^0$ stiffness term), PD control gives you TWO independent algebraic knobs ($K_d$ on $s^1$ and $K_p$ on $s^0$) to place poles anywhere in the $s$-plane.',
        systemImpact:
          'Putting $C(s) = K_p + K_d s$ in the forward path grants arbitrary pole placement, while simultaneously planting a finite numerator zero at $s = -K_p/K_d$.',
        prompt:
          'Combine $C(s) = K_p + K_d s$ with $G(s) = \\frac{2}{s^2+2s+5}$ in unity negative feedback to form $T(s) = \\frac{CG}{1 + CG}$.',
        highlightLatex:
          'L(s) = \\frac{\\textcolor{#22D3EE}{2}(\\textcolor{#F59E0B}{K_d s + K_p})}{\\textcolor{#22D3EE}{s^2 + 2s + 5}} \\implies T(s) = \\frac{L}{1+L}',
        options: [
          {
            id: 'a',
            latex: 'T(s) = \\frac{2(K_d s + K_p)}{s^2 + (2+2K_d)s + (5+2K_p)}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'T(s) = \\frac{2(K_d s + K_p)}{s^2 + (2+K_d)s + (5+K_p)}',
            correct: false,
            misconception:
              'Don\'t forget to distribute the plant numerator gain $2$ onto both $K_d s$ and $K_p$ inside the denominator!',
          },
          {
            id: 'c',
            latex: 'T(s) = \\frac{2K_p}{s^2 + (2+2K_d)s + (5+2K_p)}',
            correct: false,
            misconception:
              'When $C(s) = K_p + K_d s$ sits in the forward path (rather than rate feedback in the return path), the derivative term $2K_d s$ remains in the numerator of $T(s)$.',
          },
          {
            id: 'd',
            latex: 'T(s) = \\frac{2(K_d s + K_p)}{s^2 + (2+2K_p)s + (5+2K_d)}',
            correct: false,
            misconception:
              '$K_d$ multiplies $s^1$ (damping) and $K_p$ multiplies $s^0$ (stiffness) — do not swap them.',
          },
        ],
        lockedLabel: 'PD Closed-Loop',
        lockedResultLatex:
          'T(s) = \\textcolor{#34D399}{\\frac{2(K_d s + K_p)}{s^2 + (2+2K_d)s + (5+2K_p)}}',
        hint: 'Add numerator $2K_d s + 2K_p$ directly to the plant denominator $s^2 + 2s + 5$.',
      },
      {
        stepType: 'target_poly',
        badge: 'Expand Target Characteristic',
        whyThisStep:
          'Converting desired complex poles $s_d = -\\sigma \\pm j\\omega_d$ into an expanded monic polynomial turns geometric pole placement into direct coefficient matching.',
        systemImpact:
          'Poles at $-4 \\pm 4j$ target $T_s \\approx 4/4 = 1.0\\text{ s}$ and a $45^\\circ$ damping angle ($\\zeta = 0.707$, $\\omega_n = 4\\sqrt{2} \\approx 5.66\\text{ rad/s}$).',
        prompt:
          'Expand the desired characteristic polynomial $(s - (-4 + 4j))(s - (-4 - 4j)) = (s + 4)^2 + 4^2$.',
        highlightLatex:
          '(s + \\textcolor{#F59E0B}{4})^2 + \\textcolor{#22D3EE}{4}^2 = 0',
        options: [
          {
            id: 'a',
            latex: 's^2 + 8s + 16 = 0',
            correct: false,
            misconception:
              'Add $\\omega_d^2 = 16$ onto $\\sigma^2 = 16$: $16 + 16 = 32$ (not $16$, which would put a double real pole at $-4$).',
          },
          {
            id: 'b',
            latex: 's^2 + 4s + 32 = 0',
            correct: false,
            misconception:
              'Expanding $(s+4)^2$ produces $+8s$ ($2\\sigma s$), not $+4s$.',
          },
          {
            id: 'c',
            latex: 's^2 + 8s + 32 = 0',
            correct: true,
          },
          {
            id: 'd',
            latex: 's^2 + 8s + 20 = 0',
            correct: false,
            misconception:
              'Square the imaginary part $\\omega_d = 4$ to get $4^2 = 16$: $16 + 16 = 32$.',
          },
        ],
        lockedLabel: 'Target Poly',
        lockedResultLatex: '\\textcolor{#34D399}{s^2 + 8s + 32 = 0}',
        hint: 'Use $(s+\\sigma)^2 + \\omega_d^2 = s^2 + 2\\sigma s + (\\sigma^2 + \\omega_d^2)$.',
      },
      {
        stepType: 'solve_kd',
        badge: 'Solve Derivative Gain Kd',
        whyThisStep:
          'Equating the $s^1$ coefficients isolates $K_d$ cleanly without coupling into $K_p$ — showing how derivative action independently controls the real-part decay rate $\\sigma$.',
        systemImpact:
          'Setting $K_d = 3$ quadruples the effective damping coefficient from $2$ to $8$, cutting settling time by $4\\times$ ($4.0\\text{ s} \\to 1.0\\text{ s}$)!',
        prompt:
          'Match the $s^1$ coefficient of $s^2 + (2 + 2K_d)s + (5 + 2K_p)$ against $s^2 + 8s + 32$ to solve for $K_d$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{2} + \\textcolor{#22D3EE}{2}\\textcolor{#F59E0B}{K_d} = \\textcolor{#34D399}{8}',
        options: [
          {
            id: 'a',
            latex: 'K_d = 6',
            correct: false,
            misconception:
              'Remember to divide by the plant gain $2$: $2K_d = 8 - 2 = 6 \\implies K_d = 3$.',
          },
          {
            id: 'b',
            latex: 'K_d = 3',
            correct: true,
          },
          {
            id: 'c',
            latex: 'K_d = 4',
            correct: false,
            misconception:
              'Subtract the plant\'s existing damping $2$ before dividing: $(8 - 2)/2 = 3$, not $8/2 = 4$.',
          },
          {
            id: 'd',
            latex: 'K_d = 5',
            correct: false,
            misconception:
              'Solving $2 + 2K_d = 8$ gives $2K_d = 6$, so $K_d = 3$.',
          },
        ],
        lockedLabel: 'Derivative Gain',
        lockedResultLatex: 'K_d = \\textcolor{#34D399}{3}',
        hint: 'Subtract $2$ from $8$, then divide by $2$.',
      },
      {
        stepType: 'solve_kp',
        badge: 'Solve Proportional Gain Kp',
        whyThisStep:
          'Equating the $s^0$ coefficients independently dials in the closed-loop natural frequency $\\omega_n = \\sqrt{32}$ without disturbing $\\sigma = 4$.',
        systemImpact:
          'Setting $K_p = 13.5$ boosts effective stiffness from $5$ to $32$ ($6.4\\times$ stiffer against external load forces) and brings closed-loop DC gain up to $27/32 \\approx 0.844$.',
        prompt:
          'Match the constant $s^0$ coefficient $5 + 2K_p = 32$ to solve for $K_p$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{5} + \\textcolor{#22D3EE}{2}\\textcolor{#F59E0B}{K_p} = \\textcolor{#34D399}{32}',
        options: [
          {
            id: 'a',
            latex: 'K_p = 27',
            correct: false,
            misconception:
              '$27$ is $2K_p = 32 - 5$; divide by the plant gain $2$ to get $K_p = 13.5$.',
          },
          {
            id: 'b',
            latex: 'K_p = 16',
            correct: false,
            misconception:
              'Subtract the plant\'s existing stiffness $5$ before dividing by $2$: $(32 - 5)/2 = 13.5$.',
          },
          {
            id: 'c',
            latex: 'K_p = 18.5',
            correct: false,
            misconception:
              'Subtract $5$ from $32$ ($32 - 5 = 27$), rather than adding ($32 + 5 = 37$).',
          },
          {
            id: 'd',
            latex: 'K_p = 13.5',
            correct: true,
          },
        ],
        lockedLabel: 'Proportional Gain',
        lockedResultLatex: 'K_p = \\textcolor{#34D399}{13.5}',
        hint: 'Compute $K_p = (32 - 5)/2$.',
      },
      {
        stepType: 'induced_zero',
        badge: 'Closed-Loop LHP Zero Impact',
        whyThisStep:
          'Blindly applying the standard 2nd-order overshoot formula without checking for closed-loop zeros causes nasty hardware surprises — LHP zeros near dominant poles dramatically reshape step transients!',
        systemImpact:
          'Because $z = -4.5$ sits right beside $\\sigma = -4$ ($|z|/\\sigma = 1.125$), its derivative kick speeds up rise time AND inflates overshoot from $4.3\\%$ to $\\sim 24\\%$ (fixable via velocity-feedback PD or a prefilter!).',
        prompt:
          'Locate the closed-loop zero of $T(s) = \\frac{2(3s + 13.5)}{s^2 + 8s + 32}$ and determine how it alters the step response relative to an all-pole system with poles $-4 \\pm 4j$.',
        highlightLatex:
          '2(\\textcolor{#F59E0B}{3}s + \\textcolor{#F59E0B}{13.5}) = 0 \\implies z_{\\text{CL}} = -\\frac{K_p}{K_d}',
        options: [
          {
            id: 'a',
            latex: 'z = -4.5:\\; \\text{faster rise time, higher overshoot}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'z = -4.5:\\; \\text{slower rise time, lower overshoot}',
            correct: false,
            misconception:
              'An LHP zero adds a positive derivative component to the step response ($y + \\frac{1}{|z|}\\dot{y}$), which ACCELERATES initial rise and INCREASES overshoot.',
          },
          {
            id: 'c',
            latex: 'z = -4.5:\\; \\text{zero impact since poles are fixed}',
            correct: false,
            misconception:
              'Zeros do not alter stability or decay rate, but any LHP zero within $4\\times$ of $\\sigma$ strongly increases peak overshoot and initial slope!',
          },
          {
            id: 'd',
            latex: 'z = +4.5:\\; \\text{initial inverse undershoot (non-minimum phase)}',
            correct: false,
            misconception:
              'Solving $3s + 13.5 = 0$ gives $z = -4.5$ (strictly LHP, minimum-phase); inverse undershoot occurs only for RHP zeros ($z > 0$).',
          },
        ],
        lockedLabel: 'LHP Zero Analysis',
        lockedResultLatex:
          'z_{\\text{CL}} = \\textcolor{#34D399}{-4.5} \\;\\;(\\text{faster rise, boosts OS above }4.3\\%)',
        hint: 'Solve $3s + 13.5 = 0$, then recall how an LHP zero near the dominant poles adds derivative kick.',
      },
    ],
  },

  {
    id: 'mod4-s-plane-spec-box',
    tier: 'closed-loop-s',
    tierLabel: 'Closed-Loop s-Plane',
    title: 'Time-Domain Specs to s-Plane Target Region',
    mechatronicsContext:
      'High-speed pick-and-place robots receive customer specs as hard settling-time and overshoot limits; converting them into an $s$-plane feasible wedge lets you pick the minimum-bandwidth corner pole that minimizes actuator saturation and noise.',
    expressionLatex: 'G(s)=\\frac{1}{s(s+2)},\\; T_s\\le 1\\text{s},\\; \\%OS\\le 4.3\\%',
    finalAnswerLatex:
      's_d = -4\\pm 4j \\;\\;(\\sigma\\ge 4,\\; \\theta\\le 45^\\circ) \\implies K_d = 6,\\; K_p = 32',
    verifyPlot: {
      kind: 'pole-map',
      bounds: { minRe: -7, maxRe: 1, minIm: -5.5, maxIm: 5.5 },
      specRegion: { minSigma: 4, maxAngleDeg: 45 },
      poles: [
        { re: -4, im: 4, label: '−4 + 4j (corner)', status: 'lhp' },
        { re: -4, im: -4, label: '−4 − 4j (corner)', status: 'lhp' },
      ],
      zeros: [{ re: -32 / 6, im: 0, label: 'PD z=−5.33' }],
      hudLabel: 'Feasible Region: σ ≥ 4 & θ ≤ 45° · Corner Poles −4±4j',
      defaultCursor: 0.5,
      subtitle:
        'Complex $s$-plane design map: the shaded Emerald wedge marks all poles satisfying BOTH $T_s \\le 1\\text{ s}$ ($\\sigma \\ge 4$) and $\\%OS \\le 4.3\\%$ ($\\theta \\le 45^\\circ$), with $K_d=6, K_p=32$ hitting the minimum-bandwidth corners $-4\\pm 4j$.',
      domainMeta: 's-Plane Spec Region · σ ≥ 4 · |ωd| ≤ σ (45° Cone)',
      metrics: [
        { label: 'Settling Bound', value: 'Re(s) ≤ −4 (σ ≥ 4)' },
        { label: 'Overshoot Cone', value: 'θ ≤ 45° (ζ ≥ 0.707)' },
        { label: 'Corner Poles', value: '−4 ± 4j (ωn = 5.66)' },
        { label: 'Exact PD Gains', value: 'Kd = 6, Kp = 32 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'settling_bound',
        badge: 'Settling-Time Vertical Boundary',
        whyThisStep:
          'Every time-domain settling requirement carves a vertical exclusion zone out of the $s$-plane — any pole right of that line is guaranteed to violate $T_s$.',
        systemImpact:
          'Requiring $\\operatorname{Re}(s) \\le -4$ guarantees the exponential envelope $e^{-\\sigma t}$ drops below $2\\%$ ($e^{-4} \\approx 0.0183$) in at most $1.0\\text{ s}$.',
        prompt:
          'Translate the 2% settling-time specification $T_s \\approx \\frac{4}{\\sigma} \\le 1.0\\text{ s}$ into an exact $s$-plane inequality.',
        highlightLatex:
          'T_s \\approx \\frac{4}{\\textcolor{#F59E0B}{\\sigma}} \\le 1.0\\text{ s} \\quad\\Longleftrightarrow\\quad \\operatorname{Re}(s) = -\\sigma',
        options: [
          {
            id: 'a',
            latex: '\\sigma \\ge 4 \\iff \\operatorname{Re}(s) \\le -4',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\sigma \\le 4 \\iff -4 \\le \\operatorname{Re}(s) < 0',
            correct: false,
            misconception:
              'Faster settling ($T_s \\le 1\\text{ s}$) requires LARGER decay rate $\\sigma \\ge 4$, pushing poles further LEFT ($\\operatorname{Re}(s) \\le -4$).',
          },
          {
            id: 'c',
            latex: '\\omega_n \\ge 4 \\iff |s| \\ge 4',
            correct: false,
            misconception:
              'Settling time depends strictly on the horizontal decay rate $\\sigma = \\zeta\\omega_n$, not total radius $\\omega_n$ (a lightly damped pole at $|s|=4$ settles slowly!).',
          },
          {
            id: 'd',
            latex: '\\sigma \\ge 1 \\iff \\operatorname{Re}(s) \\le -1',
            correct: false,
            misconception:
              'Use the 2% settling rule $T_s \\approx 4/\\sigma$ (4 time constants), giving $\\sigma \\ge 4/1 = 4$, not $1$.',
          },
        ],
        lockedLabel: 'Settling Bound',
        lockedResultLatex: '\\textcolor{#34D399}{\\sigma \\ge 4 \\iff \\operatorname{Re}(s) \\le -4}',
        hint: 'Rearrange $4/\\sigma \\le 1.0$ to bound $\\sigma$, remembering $s = -\\sigma \\pm j\\omega_d$.',
      },
      {
        stepType: 'overshoot_cone',
        badge: 'Overshoot Damping Cone',
        whyThisStep:
          'Percent overshoot depends SOLELY on damping ratio $\\zeta = \\cos\\theta$, mapping any overshoot ceiling cleanly onto a symmetric angular cone measured from the negative real axis.',
        systemImpact:
          'Staying inside the $\\pm 45^\\circ$ cone ($|\\omega_d| \\le \\sigma$) locks $\\zeta \\ge 0.707$ — guaranteeing $\\%OS \\le 4.3\\%$ and zero frequency-domain resonant peaking.',
        prompt:
          'Convert $\\%OS \\le 4.3\\%$ ($\\zeta \\ge \\frac{1}{\\sqrt{2}} \\approx 0.707$) into a damping-cone angle $\\theta = \\arccos(\\zeta)$ and coordinate bound between $\\omega_d$ and $\\sigma$.',
        highlightLatex:
          '\\cos\\textcolor{#F59E0B}{\\theta} = \\zeta \\ge \\frac{1}{\\sqrt{2}}, \\qquad \\tan\\textcolor{#F59E0B}{\\theta} = \\frac{|\\omega_d|}{\\sigma}',
        options: [
          {
            id: 'a',
            latex: '\\theta \\ge 45^\\circ \\iff |\\omega_d| \\ge \\sigma',
            correct: false,
            misconception:
              'Larger angles $\\theta$ move poles CLOSER to the $j\\omega$-axis (lower $\\zeta$, MORE overshoot); you need $\\theta \\le 45^\\circ$.',
          },
          {
            id: 'b',
            latex: '\\theta \\le 30^\\circ \\iff |\\omega_d| \\le \\frac{\\sigma}{\\sqrt{3}}',
            correct: false,
            misconception:
              '$\\cos(30^\\circ) = \\sqrt{3}/2 \\approx 0.866$; for $\\zeta = 1/\\sqrt{2}$, $\\arccos(1/\\sqrt{2}) = 45^\\circ$.',
          },
          {
            id: 'c',
            latex: '\\theta \\le 45^\\circ \\iff |\\omega_d| \\le \\sigma',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\theta \\le 60^\\circ \\iff |\\omega_d| \\le \\sqrt{3}\\,\\sigma',
            correct: false,
            misconception:
              '$60^\\circ$ corresponds to $\\zeta = 0.5$ ($16.3\\%$ overshoot), which violates the $4.3\\%$ limit.',
          },
        ],
        lockedLabel: 'Damping Cone',
        lockedResultLatex: '\\textcolor{#34D399}{\\theta \\le 45^\\circ \\iff |\\omega_d| \\le \\sigma}',
        hint: 'Evaluate $\\arccos(1/\\sqrt{2}) = 45^\\circ$ and use $\\tan 45^\\circ = 1$.',
      },
      {
        stepType: 'corner_pole',
        badge: 'Minimum-Bandwidth Corner Pole',
        whyThisStep:
          'Placing poles deeper inside the feasible wedge wastes actuator torque and amplifies sensor noise — seasoned control engineers target the exact corner intersection first.',
        systemImpact:
          'The corner pair $s = -4 \\pm 4j$ meets both specs with the smallest possible natural frequency $\\omega_n = 4\\sqrt{2} \\approx 5.66\\text{ rad/s}$, keeping control effort lean.',
        prompt:
          'Pick the conjugate poles right at the boundary intersection $\\sigma = 4$ and $|\\omega_d| = \\sigma$, and form the target characteristic polynomial.',
        highlightLatex:
          '\\sigma = \\textcolor{#F59E0B}{4}, \\quad \\omega_d = \\textcolor{#22D3EE}{4} \\implies (s + \\sigma)^2 + \\omega_d^2 = 0',
        options: [
          {
            id: 'a',
            latex: 's = -4 \\pm 4j \\implies s^2 + 8s + 32 = 0',
            correct: true,
          },
          {
            id: 'b',
            latex: 's = -4 \\pm 4j \\implies s^2 + 8s + 16 = 0',
            correct: false,
            misconception:
              'Compute $\\sigma^2 + \\omega_d^2 = 4^2 + 4^2 = 32$, not $16$.',
          },
          {
            id: 'c',
            latex: 's = -4,\\; -4 \\implies s^2 + 8s + 16 = 0',
            correct: false,
            misconception:
              'While $-4,-4$ is inside the wedge, the corner intersection of $\\sigma=4$ and $|\\omega_d|=\\sigma$ is the complex pair $-4\\pm 4j$.',
          },
          {
            id: 'd',
            latex: 's = -2 \\pm 2j \\implies s^2 + 4s + 8 = 0',
            correct: false,
            misconception:
              'Poles at $-2 \\pm 2j$ have $T_s \\approx 4/2 = 2.0\\text{ s}$, violating the $T_s \\le 1.0\\text{ s}$ requirement.',
          },
        ],
        lockedLabel: 'Corner Target',
        lockedResultLatex: 's_d = \\textcolor{#34D399}{-4 \\pm 4j} \\implies \\textcolor{#34D399}{s^2 + 8s + 32 = 0}',
        hint: 'Expand $(s+4)^2 + 4^2 = s^2 + 8s + 32$.',
      },
      {
        stepType: 'pd_denom',
        badge: 'Closed-Loop Characteristic Eq',
        whyThisStep:
          'Writing the plant + PD characteristic equation in terms of $(K_d, K_p)$ exposes which plant coefficients need assistance from the controller.',
        systemImpact:
          'The plant\'s inherent damping is only $2$ ($\\sigma = 1$), so without $K_d$ the poles could NEVER cross left of $-1$ regardless of how huge $K_p$ is!',
        prompt:
          'Wrap PD controller $C(s) = K_p + K_d s$ in unity feedback around $G(s) = \\frac{1}{s(s+2)}$ to obtain the closed-loop characteristic polynomial.',
        highlightLatex:
          '1 + \\frac{\\textcolor{#F59E0B}{K_d s + K_p}}{\\textcolor{#22D3EE}{s(s + 2)}} = 0',
        options: [
          {
            id: 'a',
            latex: 's^2 + (2 + K_p)s + K_d = 0',
            correct: false,
            misconception:
              'Keep $K_d$ on the $s^1$ term and $K_p$ on the constant $s^0$ term.',
          },
          {
            id: 'b',
            latex: 's^2 + (2 + K_d)s + K_p = 0',
            correct: true,
          },
          {
            id: 'c',
            latex: 's^2 + 2s + (K_d + K_p) = 0',
            correct: false,
            misconception:
              'Derivative action multiplies by $s$, so $K_d s$ merges with $2s$ to give $(2 + K_d)s$.',
          },
          {
            id: 'd',
            latex: '(1 + K_d)s^2 + 2s + K_p = 0',
            correct: false,
            misconception:
              '$K_d s$ is first-order in $s$, not second-order $s^2$ (acceleration feedback).',
          },
        ],
        lockedLabel: 'CL Characteristic',
        lockedResultLatex: '\\textcolor{#34D399}{s^2 + (2 + K_d)s + K_p = 0}',
        hint: 'Multiply through by $s(s+2) = s^2 + 2s$ and group powers of $s$.',
      },
      {
        stepType: 'solve_gains',
        badge: 'Solve Exact PD Gains',
        whyThisStep:
          'Direct coefficient matching gives the exact analytical PD gains in seconds — turning geometric $s$-plane specs into real firmware constants.',
        systemImpact:
          'With $K_d = 6$ and $K_p = 32$, the servo locks onto $s = -4 \\pm 4j$ with zero steady-state step error (Type-1!); remember that its forward PD zero at $z = -32/6 \\approx -5.33$ will slightly raise step overshoot unless rate feedback is placed in the return path.',
        prompt:
          'Equate $s^2 + (2 + K_d)s + K_p = s^2 + 8s + 32$ to solve for exact $K_d$ and $K_p$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{2} + \\textcolor{#F59E0B}{K_d} = \\textcolor{#34D399}{8}, \\qquad \\textcolor{#F59E0B}{K_p} = \\textcolor{#34D399}{32}',
        options: [
          {
            id: 'a',
            latex: 'K_d = 8, \\qquad K_p = 32',
            correct: false,
            misconception:
              'Don\'t forget the plant\'s existing viscous damping $+2$: $K_d = 8 - 2 = 6$, not $8$.',
          },
          {
            id: 'b',
            latex: 'K_d = 6, \\qquad K_p = 30',
            correct: false,
            misconception:
              'The open-loop plant $s(s+2) = s^2 + 2s + 0$ has ZERO spring stiffness, so $K_p$ supplies the full $32$.',
          },
          {
            id: 'c',
            latex: 'K_d = 32, \\qquad K_p = 6',
            correct: false,
            misconception:
              'Match $s^1$ to $K_d$ ($2 + K_d = 8 \\implies K_d = 6$) and $s^0$ to $K_p$ ($K_p = 32$).',
          },
          {
            id: 'd',
            latex: 'K_d = 6, \\qquad K_p = 32',
            correct: true,
          },
        ],
        lockedLabel: 'Exact PD Gains',
        lockedResultLatex: 'K_d = \\textcolor{#34D399}{6}, \\qquad K_p = \\textcolor{#34D399}{32}',
        hint: 'Solve $2 + K_d = 8$ and read $K_p = 32$ directly.',
      },
    ],
  },
];
