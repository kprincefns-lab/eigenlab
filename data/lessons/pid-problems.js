/**
 * EIGENLAB — PID Control & Feedback Stability Paperless Step-by-Step Problem Bank
 * 14 multi-step engineering control problems spanning 5 progressive mastery tiers:
 * Closed-Loop Dynamics, Steady-State Error, Routh-Hurwitz Stability,
 * PID Tuning & Disturbance Rejection, and Frequency Margins & Time Delay.
 *
 * Color convention inside KaTeX highlights:
 *  - Cyan   (#22D3EE): Plant G(s) / open-loop L(s) / polynomial coefficients / primary signal
 *  - Amber  (#F59E0B): Controller gain K / target specs (ωn, ζ) / disturbance D(s) / delay τ
 *  - Emerald(#34D399): Solved step result / closed-loop T(s) / stability bound / phase margin
 */

export const PID_SOLVER_TIERS = [
  { id: 'all', label: 'All Tiers' },
  { id: 'feedback', label: 'Closed-Loop' },
  { id: 'steady-state', label: 'Steady-State' },
  { id: 'routh', label: 'Routh Stability' },
  { id: 'pid-tuning', label: 'PID Tuning' },
  { id: 'freq-margins', label: 'Margins & Delay' },
];

export const PID_PROBLEMS = [
  // =========================================================================
  // TIER 1: CLOSED-LOOP FEEDBACK & SECOND-ORDER DYNAMICS (3 problems)
  // =========================================================================
  {
    id: 'pid1-closed-loop-tf',
    tier: 'feedback',
    tierLabel: 'Closed-Loop',
    title: 'Unity-Feedback Closed-Loop Transfer Function',
    mechatronicsContext:
      'Wrapping proportional negative feedback around a DC motor velocity stage shifts its dominant pole deeper into the left half-plane, shrinking its mechanical time constant compared to open-loop operation.',
    expressionLatex:
      'G(s) = \\frac{1}{s + 2},\\; K = 6 \\;\\;(\\text{find } T(s))',
    finalAnswerLatex:
      'T(s) = \\frac{6}{s + 8}, \\qquad p_{\\text{CL}} = -8 \\;\\;\\left(4\\times\\text{ faster than } p_{\\text{OL}} = -2\\right)',
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 2.2],
      setpoint: 1,
      setpointLabel: 'Reference r(t) = 1',
      primaryLabel: 'Closed-Loop T(s)',
      baselineLabel: 'Open-Loop G(s)',
      primaryFn: (t) => 0.75 * (1 - Math.exp(-8 * t)),
      baselineFn: (t) => 0.5 * (1 - Math.exp(-2 * t)),
      defaultCursor: 0.25,
      subtitle:
        'Hover or drag across time $t$ to compare the slow open-loop plant $G(s)$ ($\\tau = 0.5\\text{ s}$) against the accelerated closed-loop response $T(s)$ ($\\tau = 0.125\\text{ s}$).',
      domainMeta: 'Unit Step Response · τ_CL = 0.125 s vs τ_OL = 0.50 s',
      metrics: [
        { label: 'Closed-Loop T(s)', value: '6 / (s + 8)' },
        { label: 'Pole Shift', value: '−2 → −8' },
        { label: 'Speedup', value: '4× faster' },
        { label: 'CL DC Gain', value: '0.750 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'open_loop_product',
        badge: 'Form Open-Loop L(s)',
        prompt:
          'Multiply the proportional gain $K = 6$ by the plant $G(s) = \\frac{1}{s+2}$ to form the forward open-loop transfer function $L(s) = K G(s)$.',
        highlightLatex:
          'L(s) = \\textcolor{#F59E0B}{K}\\,\\textcolor{#22D3EE}{G(s)} = \\textcolor{#F59E0B}{6} \\cdot \\textcolor{#22D3EE}{\\frac{1}{s+2}}',
        options: [
          {
            id: 'a',
            latex: 'L(s) = \\frac{6}{s + 2}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'L(s) = \\frac{1}{6s + 12}',
            correct: false,
            misconception:
              'Series cascade multiplies $K$ into the numerator, not the denominator: $6 \\cdot \\frac{1}{s+2} = \\frac{6}{s+2}$.',
          },
          {
            id: 'c',
            latex: 'L(s) = \\frac{6}{s + 12}',
            correct: false,
            misconception:
              'Multiplying a fraction by $6$ scales only the numerator; the denominator $(s+2)$ stays unchanged.',
          },
          {
            id: 'd',
            latex: 'L(s) = 6 + \\frac{1}{s + 2}',
            correct: false,
            misconception:
              'Blocks in series multiply ($K G(s)$); adding $K + G(s)$ would represent parallel paths instead of a forward cascade.',
          },
        ],
        lockedLabel: 'Open-Loop L(s)',
        lockedResultLatex: 'L(s) = \\textcolor{#34D399}{\\frac{6}{s + 2}}',
        hint: 'Series blocks multiply: place $K = 6$ directly in the numerator of $G(s)$.',
      },
      {
        stepType: 'feedback_formula',
        badge: 'Apply Unity Feedback',
        prompt:
          'Substitute $L(s) = \\frac{6}{s+2}$ into the unity negative feedback formula $T(s) = \\frac{L(s)}{1 + L(s)}$.',
        highlightLatex:
          'T(s) = \\frac{\\textcolor{#22D3EE}{L(s)}}{1 + \\textcolor{#22D3EE}{L(s)}}',
        options: [
          {
            id: 'a',
            latex: 'T(s) = \\frac{\\frac{6}{s+2}}{1 - \\frac{6}{s+2}}',
            correct: false,
            misconception:
              'Negative feedback produces a PLUS sign in the denominator ($1 + L(s)$); $1 - L(s)$ is for positive feedback.',
          },
          {
            id: 'b',
            latex: 'T(s) = \\frac{\\frac{6}{s+2}}{1 + \\frac{6}{s+2}}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'T(s) = \\frac{1}{1 + \\frac{6}{s+2}}',
            correct: false,
            misconception:
              'That is the sensitivity function $E(s)/R(s) = \\frac{1}{1+L}$; the output transfer function $Y(s)/R(s)$ needs $L(s)$ in the numerator.',
          },
          {
            id: 'd',
            latex: 'T(s) = \\frac{1 + \\frac{6}{s+2}}{\\frac{6}{s+2}}',
            correct: false,
            misconception:
              'This fraction is inverted—closed-loop gain is always forward path divided by $(1 + \\text{loop gain})$.',
          },
        ],
        lockedLabel: 'Feedback Setup',
        lockedResultLatex:
          'T(s) = \\frac{\\textcolor{#22D3EE}{6/(s+2)}}{1 + \\textcolor{#22D3EE}{6/(s+2)}}',
        hint: 'For negative feedback with $H(s) = 1$, $T(s) = \\frac{L(s)}{1 + L(s)}$.',
      },
      {
        stepType: 'simplify_cl_tf',
        badge: 'Clear Complex Fraction',
        prompt:
          'Multiply numerator and denominator by $(s+2)$ to simplify $T(s)$ into standard rational form.',
        highlightLatex:
          'T(s) = \\frac{6}{(\\textcolor{#22D3EE}{s + 2}) + \\textcolor{#F59E0B}{6}}',
        options: [
          {
            id: 'a',
            latex: 'T(s) = \\frac{6}{s + 6}',
            correct: false,
            misconception:
              'Remember to include the $+2$ from $1 \\cdot (s+2)$: $(s + 2) + 6 = s + 8$.',
          },
          {
            id: 'b',
            latex: 'T(s) = \\frac{6}{6s + 12}',
            correct: false,
            misconception:
              'Add $(s+2)$ and $6$ rather than multiplying them: $(s+2) + 6 = s + 8$.',
          },
          {
            id: 'c',
            latex: 'T(s) = \\frac{6}{s + 8}',
            correct: true,
          },
          {
            id: 'd',
            latex: 'T(s) = \\frac{6s + 12}{s + 8}',
            correct: false,
            misconception:
              'Multiplying the numerator $\\frac{6}{s+2}$ by $(s+2)$ cancels the denominator, leaving just $6$.',
          },
        ],
        lockedLabel: 'Closed-Loop T(s)',
        lockedResultLatex: 'T(s) = \\textcolor{#34D399}{\\frac{6}{s + 8}}',
        hint: 'Clearing $(s+2)$ yields $\\frac{6}{(s+2) + 6}$. Combine the constants $2 + 6$.',
      },
      {
        stepType: 'pole_comparison',
        badge: 'Compare Closed-Loop Pole',
        prompt:
          'Set the closed-loop denominator $s + 8 = 0$ and compare the new pole against the open-loop pole $p_{\\text{OL}} = -2$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{s + 2 = 0 \\Rightarrow -2} \\quad\\longrightarrow\\quad \\textcolor{#34D399}{s + 8 = 0 \\Rightarrow \\;?}',
        options: [
          {
            id: 'a',
            latex: 'p_{\\text{CL}} = +8 \\;(\\text{unstable})',
            correct: false,
            misconception:
              'Solving $s + 8 = 0$ gives $s = -8$, which sits deep in the stable left half-plane (LHP).',
          },
          {
            id: 'b',
            latex: 'p_{\\text{CL}} = -8 \\;(\\text{decay } 4\\times\\text{ faster})',
            correct: true,
          },
          {
            id: 'c',
            latex: 'p_{\\text{CL}} = -8 \\;(\\text{decay } 4\\times\\text{ slower})',
            correct: false,
            misconception:
              'A pole further left has a larger decay rate $\\sigma = 8$ and shorter time constant $\\tau = 1/8 = 0.125\\text{ s}$, so it decays $4\\times$ faster.',
          },
          {
            id: 'd',
            latex: 'p_{\\text{CL}} = -6 \\;(\\text{decay } 3\\times\\text{ faster})',
            correct: false,
            misconception:
              'The denominator is $s + 8$, not $s + 6$; the gain $6$ adds onto the plant\'s existing pole magnitude $2$.',
          },
        ],
        lockedLabel: 'Pole Speedup',
        lockedResultLatex:
          'p_{\\text{CL}} = \\textcolor{#34D399}{-8} \\;\\;\\left(\\textcolor{#34D399}{4\\times\\text{ faster}}\\right)',
        hint: 'Compare $\\tau_{\\text{OL}} = 1/2$ with $\\tau_{\\text{CL}} = 1/8$: the ratio is $8/2 = 4$.',
      },
    ],
  },

  {
    id: 'pid1-pd-damping',
    tier: 'feedback',
    tierLabel: 'Closed-Loop',
    title: 'PD Pole Placement for Double Integrator',
    mechatronicsContext:
      'A frictionless satellite reaction-wheel axis behaves like a pure double integrator $1/s^2$: proportional feedback alone oscillates forever, so adding derivative velocity feedback is mandatory to place damped closed-loop poles.',
    expressionLatex:
      'G(s) = \\frac{1}{s^2},\\; \\omega_n = 4,\\; \\zeta = 0.75',
    finalAnswerLatex:
      'T(s) = \\frac{6s + 16}{s^2 + 6s + 16}, \\qquad K_p = 16, \\quad K_d = 6',
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 3.0],
      setpoint: 1,
      setpointLabel: 'Reference r(t) = 1',
      primaryLabel: 'PD (Kp=16, Kd=6)',
      baselineLabel: 'P-only (Kd=0, undamped)',
      primaryFn: (t) =>
        1 -
        Math.exp(-3 * t) *
          (Math.cos(Math.sqrt(7) * t) - (3 / Math.sqrt(7)) * Math.sin(Math.sqrt(7) * t)),
      baselineFn: (t) => 1 - Math.cos(4 * t),
      defaultCursor: 0.35,
      subtitle:
        'Hover or drag across $t$: without derivative damping ($K_d=0$, Cyan dashed), the double integrator rings indefinitely; with $K_d=6$ (Emerald), the loop damps cleanly onto $r=1$.',
      domainMeta: 'Double Integrator Step · ζ = 0.75, ωn = 4 rad/s',
      metrics: [
        { label: 'Gain Kp', value: '16.0' },
        { label: 'Gain Kd', value: '6.0' },
        { label: 'Target (ωn, ζ)', value: '4 rad/s, 0.75' },
        { label: 'CL Poles', value: '−3 ± 2.65j ✓' },
      ],
    },
    steps: [
      {
        stepType: 'pd_closed_loop',
        badge: 'Derive Closed-Loop T(s)',
        prompt:
          'Combine $L(s) = C(s)G(s) = \\frac{K_d s + K_p}{s^2}$ in unity negative feedback $T(s) = \\frac{L(s)}{1 + L(s)}$.',
        highlightLatex:
          'T(s) = \\frac{\\textcolor{#F59E0B}{K_d s + K_p} / \\textcolor{#22D3EE}{s^2}}{1 + (\\textcolor{#F59E0B}{K_d s + K_p}) / \\textcolor{#22D3EE}{s^2}}',
        options: [
          {
            id: 'a',
            latex: 'T(s) = \\frac{K_d s + K_p}{s^2 + K_d s + K_p}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'T(s) = \\frac{K_p}{s^2 + K_d s + K_p}',
            correct: false,
            misconception:
              'When $C(s) = K_p + K_d s$ sits in the forward path, the numerator of $T(s)$ retains the controller zero $(K_d s + K_p)$.',
          },
          {
            id: 'c',
            latex: 'T(s) = \\frac{K_d s + K_p}{s^2 + K_p s + K_d}',
            correct: false,
            misconception:
              'Keep the derivative gain $K_d$ attached to $s^1$ and the proportional gain $K_p$ as the constant $s^0$ term.',
          },
          {
            id: 'd',
            latex: 'T(s) = \\frac{1}{s^2 + K_d s + K_p}',
            correct: false,
            misconception:
              'Multiplying top and bottom by $s^2$ keeps $L(s)\\cdot s^2 = K_d s + K_p$ in the numerator, not $1$.',
          },
        ],
        lockedLabel: 'Closed-Loop T(s)',
        lockedResultLatex:
          'T(s) = \\textcolor{#34D399}{\\frac{K_d s + K_p}{s^2 + K_d s + K_p}}',
        hint: 'Multiply numerator and denominator by $s^2$ to clear the fraction.',
      },
      {
        stepType: 'target_char_poly',
        badge: 'Build Target Polynomial',
        prompt:
          'Substitute $\\omega_n = 4$ and $\\zeta = 0.75$ into the canonical second-order characteristic polynomial $s^2 + 2\\zeta\\omega_n s + \\omega_n^2$.',
        highlightLatex:
          's^2 + 2(\\textcolor{#F59E0B}{0.75})(\\textcolor{#22D3EE}{4})\\,s + (\\textcolor{#22D3EE}{4})^2',
        options: [
          {
            id: 'a',
            latex: 's^2 + 3s + 16',
            correct: false,
            misconception:
              'Don\'t forget the factor of $2$ in $2\\zeta\\omega_n$: $2(0.75)(4) = 6$, whereas $\\zeta\\omega_n = 3$.',
          },
          {
            id: 'b',
            latex: 's^2 + 6s + 4',
            correct: false,
            misconception:
              'The constant term is $\\omega_n^2$, not $\\omega_n$: $4^2 = 16$.',
          },
          {
            id: 'c',
            latex: 's^2 + 6s + 16',
            correct: true,
          },
          {
            id: 'd',
            latex: 's^2 + 8s + 12',
            correct: false,
            misconception:
              'Check both products: $2(0.75)(4) = 6$ for the linear coefficient and $4^2 = 16$ for the constant term.',
          },
        ],
        lockedLabel: 'Target Poly',
        lockedResultLatex:
          's^2 + \\textcolor{#34D399}{6}s + \\textcolor{#34D399}{16} = 0',
        hint: 'Compute $2\\zeta\\omega_n = 2 \\times 0.75 \\times 4$ and $\\omega_n^2 = 4^2$.',
      },
      {
        stepType: 'match_pd_gains',
        badge: 'Match Coefficients',
        prompt:
          'Equate coefficients of the closed-loop denominator $s^2 + K_d s + K_p$ with the target $s^2 + 6s + 16$ to solve for $K_p$ and $K_d$.',
        highlightLatex:
          's^2 + \\textcolor{#F59E0B}{K_d}\\,s + \\textcolor{#22D3EE}{K_p} \\equiv s^2 + \\textcolor{#34D399}{6}\\,s + \\textcolor{#34D399}{16}',
        options: [
          {
            id: 'a',
            latex: 'K_p = 6, \\quad K_d = 16',
            correct: false,
            misconception:
              'You swapped $K_p$ and $K_d$! $K_d$ multiplies $s$ (damping term $6$), while $K_p$ is the stiffness constant ($16$).',
          },
          {
            id: 'b',
            latex: 'K_p = 4, \\quad K_d = 3',
            correct: false,
            misconception:
              'Match directly against $\\omega_n^2 = 16$ and $2\\zeta\\omega_n = 6$, not $\\omega_n$ and $\\zeta\\omega_n$.',
          },
          {
            id: 'c',
            latex: 'K_p = 16, \\quad K_d = 3',
            correct: false,
            misconception:
              '$K_d$ equals the full $s^1$ coefficient $2\\zeta\\omega_n = 6$, not half of it.',
          },
          {
            id: 'd',
            latex: 'K_p = 16, \\quad K_d = 6',
            correct: true,
          },
        ],
        lockedLabel: 'PD Gains',
        lockedResultLatex:
          '\\textcolor{#34D399}{K_p = 16}, \\qquad \\textcolor{#34D399}{K_d = 6}',
        hint: 'Match the $s^1$ coefficient to $K_d$ and the $s^0$ constant term to $K_p$.',
      },
      {
        stepType: 'verify_pd_poles',
        badge: 'Verify Closed-Loop Poles',
        prompt:
          'Find the closed-loop poles of $s^2 + 6s + 16 = 0$ to confirm both sit strictly in the damped left half-plane.',
        highlightLatex:
          's = \\frac{-\\textcolor{#F59E0B}{6} \\pm \\sqrt{\\textcolor{#F59E0B}{6}^2 - 4(\\textcolor{#22D3EE}{16})}}{2}',
        options: [
          {
            id: 'a',
            latex: 's = -3 \\pm j\\sqrt{7}',
            correct: true,
          },
          {
            id: 'b',
            latex: 's = -6 \\pm j\\sqrt{7}',
            correct: false,
            misconception:
              'Divide the real part by $2$ as well: $-6/2 = -3$, not $-6$.',
          },
          {
            id: 'c',
            latex: 's = -3 \\pm 4j',
            correct: false,
            misconception:
              'The imaginary part is $\\omega_d = \\sqrt{\\omega_n^2 - \\sigma^2} = \\sqrt{16 - 9} = \\sqrt{7}$, not $\\omega_n = 4$.',
          },
          {
            id: 'd',
            latex: 's = +3 \\pm j\\sqrt{7}',
            correct: false,
            misconception:
              'The quadratic formula uses $-b/(2a) = -6/2 = -3$; positive real parts would indicate an unstable system.',
          },
        ],
        lockedLabel: 'Damped Poles',
        lockedResultLatex:
          's = \\textcolor{#34D399}{-3 \\pm j\\sqrt{7}} \\;\\;(\\text{stable LHP})',
        hint: 'Compute the discriminant $36 - 64 = -28$, then divide $-6 \\pm j\\sqrt{28}$ by $2$.',
      },
    ],
  },

  {
    id: 'pid1-second-order-specs',
    tier: 'feedback',
    tierLabel: 'Closed-Loop',
    title: 'Second-Order Specs: ωn, ζ, ωd & Settling Time',
    mechatronicsContext:
      'Before clearing a gimbal control loop for flight testing, engineers extract natural frequency, damping ratio, damped ringing frequency, and 2% settling time directly from its closed-loop denominator.',
    expressionLatex:
      'T(s) = \\frac{25}{s^2 + 6s + 25} \\;\\;(\\omega_n, \\zeta, \\omega_d, T_s)',
    finalAnswerLatex:
      '\\omega_n = 5\\text{ rad/s}, \\quad \\zeta = 0.6, \\quad \\omega_d = 4\\text{ rad/s}, \\quad T_s \\approx \\frac{4}{3}\\text{ s}',
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 2.6],
      setpoint: 1,
      setpointLabel: 'Setpoint r = 1 (±2% band)',
      primaryLabel: 'T(s) (ζ=0.6, ωd=4)',
      baselineLabel: 'Critically Damped (ζ=1)',
      primaryFn: (t) => 1 - Math.exp(-3 * t) * (Math.cos(4 * t) + 0.75 * Math.sin(4 * t)),
      baselineFn: (t) => 1 - Math.exp(-5 * t) * (1 + 5 * t),
      tsMarker: { t: 4 / 3, label: 'Ts ≈ 1.33 s', band: 0.02 },
      defaultCursor: 0.51,
      subtitle:
        'Hover or drag across $t$: the underdamped gimbal ($\\zeta=0.6$) peaks at $9.5\\%$ overshoot and locks inside the $\\pm 2\\%$ tolerance band right near $T_s = 4/3\\text{ s}$.',
      domainMeta: '2nd-Order Step · ωn=5, ζ=0.6, Ts=1.33 s',
      metrics: [
        { label: 'Natural ωn', value: '5.00 rad/s' },
        { label: 'Damping ζ', value: '0.600' },
        { label: 'Damped ωd', value: '4.00 rad/s' },
        { label: '2% Settling Ts', value: '1.333 s ✓' },
      ],
    },
    steps: [
      {
        stepType: 'extract_wn',
        badge: 'Natural Frequency ωn',
        prompt:
          'Match the constant term in $s^2 + 6s + 25$ against the canonical form $s^2 + 2\\zeta\\omega_n s + \\omega_n^2$ to find $\\omega_n$.',
        highlightLatex:
          's^2 + 6s + \\textcolor{#22D3EE}{25} \\equiv s^2 + 2\\zeta\\omega_n s + \\textcolor{#F59E0B}{\\omega_n^2}',
        options: [
          {
            id: 'a',
            latex: '\\omega_n = 25\\text{ rad/s}',
            correct: false,
            misconception:
              'The constant term equals $\\omega_n^2$, so take the positive square root: $\\omega_n = \\sqrt{25} = 5\\text{ rad/s}$.',
          },
          {
            id: 'b',
            latex: '\\omega_n = 5\\text{ rad/s}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\omega_n = 6\\text{ rad/s}',
            correct: false,
            misconception:
              '$6$ is the middle coefficient $2\\zeta\\omega_n$, not the natural frequency $\\omega_n$.',
          },
          {
            id: 'd',
            latex: '\\omega_n = 12.5\\text{ rad/s}',
            correct: false,
            misconception:
              'Take the square root of $25$, not half of $25$: $\\sqrt{25} = 5$.',
          },
        ],
        lockedLabel: 'Natural Freq',
        lockedResultLatex: '\\omega_n = \\textcolor{#34D399}{5\\text{ rad/s}}',
        hint: 'Solve $\\omega_n^2 = 25$ with $\\omega_n > 0$.',
      },
      {
        stepType: 'extract_zeta',
        badge: 'Damping Ratio ζ',
        prompt:
          'Use $2\\zeta\\omega_n = 6$ with $\\omega_n = 5$ to solve for the damping ratio $\\zeta$.',
        highlightLatex:
          '2\\,\\textcolor{#F59E0B}{\\zeta}\\,(\\textcolor{#34D399}{5}) = \\textcolor{#22D3EE}{6}',
        options: [
          {
            id: 'a',
            latex: '\\zeta = 1.2',
            correct: false,
            misconception:
              'Include the factor of $2$ in the denominator: $\\zeta = \\frac{6}{2\\cdot 5} = 0.6$, not $\\frac{6}{5} = 1.2$.',
          },
          {
            id: 'b',
            latex: '\\zeta = 0.24',
            correct: false,
            misconception:
              'Divide by $2\\omega_n = 10$, not by $\\omega_n^2 = 25$: $6/10 = 0.6$.',
          },
          {
            id: 'c',
            latex: '\\zeta = 0.6',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\zeta = 3.0',
            correct: false,
            misconception:
              '$6/2 = 3$ equals $\\sigma = \\zeta\\omega_n$; divide once more by $\\omega_n = 5$ to isolate $\\zeta = 0.6$.',
          },
        ],
        lockedLabel: 'Damping Ratio',
        lockedResultLatex: '\\zeta = \\textcolor{#34D399}{0.6} \\;\\;(\\text{underdamped})',
        hint: 'Since $2\\zeta(5) = 10\\zeta = 6$, divide both sides by $10$.',
      },
      {
        stepType: 'extract_wd',
        badge: 'Damped Frequency ωd',
        prompt:
          'Compute the damped oscillation frequency $\\omega_d = \\omega_n\\sqrt{1 - \\zeta^2}$.',
        highlightLatex:
          '\\omega_d = \\textcolor{#34D399}{5}\\sqrt{1 - (\\textcolor{#F59E0B}{0.6})^2}',
        options: [
          {
            id: 'a',
            latex: '\\omega_d = 3\\text{ rad/s}',
            correct: false,
            misconception:
              '$3 = \\zeta\\omega_n$ is the real decay rate $\\sigma$; the imaginary oscillation part uses $\\sqrt{1 - 0.6^2} = 0.8$, giving $5(0.8) = 4$.',
          },
          {
            id: 'b',
            latex: '\\omega_d = 4\\text{ rad/s}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\omega_d = 2\\text{ rad/s}',
            correct: false,
            misconception:
              'Square $0.6$ before subtracting from $1$: $\\sqrt{1 - 0.36} = \\sqrt{0.64} = 0.8$, not $1 - 0.6 = 0.4$.',
          },
          {
            id: 'd',
            latex: '\\omega_d = 5\\text{ rad/s}',
            correct: false,
            misconception:
              'Damping slows the oscillation below $\\omega_n = 5$: $5\\sqrt{1 - 0.36} = 4\\text{ rad/s}$.',
          },
        ],
        lockedLabel: 'Damped Freq',
        lockedResultLatex: '\\omega_d = \\textcolor{#34D399}{4\\text{ rad/s}}',
        hint: 'Recognize the 3-4-5 triangle: $\\sqrt{1 - 0.36} = \\sqrt{0.64} = 0.8$, then multiply by $5$.',
      },
      {
        stepType: 'settling_time',
        badge: '2% Settling Time Ts',
        prompt:
          'Apply the 2% settling-time criterion $T_s \\approx \\frac{4}{\\zeta\\omega_n}$ using $\\sigma = \\zeta\\omega_n = 3$.',
        highlightLatex:
          'T_s \\approx \\frac{4}{\\textcolor{#F59E0B}{\\zeta}\\,\\textcolor{#34D399}{\\omega_n}} = \\frac{4}{\\textcolor{#22D3EE}{3}}',
        options: [
          {
            id: 'a',
            latex: 'T_s \\approx \\frac{4}{5} = 0.80\\text{ s}',
            correct: false,
            misconception:
              'The envelope decays as $e^{-\\zeta\\omega_n t} = e^{-3t}$, not $e^{-\\omega_n t}$; divide $4$ by $\\sigma = 3$.',
          },
          {
            id: 'b',
            latex: 'T_s \\approx \\frac{4}{6} = 0.67\\text{ s}',
            correct: false,
            misconception:
              '$6$ is $2\\zeta\\omega_n$; the envelope exponent is $\\sigma = \\zeta\\omega_n = 3$, so $T_s \\approx 4/3\\text{ s}$.',
          },
          {
            id: 'c',
            latex: 'T_s \\approx 1\\text{ s}',
            correct: false,
            misconception:
              'Divide $4$ by $\\sigma = 3$, not by $\\omega_d = 4$: settling depends only on the real decay rate $\\sigma = \\zeta\\omega_n$.',
          },
          {
            id: 'd',
            latex: 'T_s \\approx \\frac{4}{3} \\approx 1.33\\text{ s}',
            correct: true,
          },
        ],
        lockedLabel: 'Settling Time',
        lockedResultLatex:
          'T_s \\approx \\textcolor{#34D399}{\\frac{4}{3}\\text{ s}} \\;\\;(\\approx 1.33\\text{ s})',
        hint: 'At $4$ time constants ($4/\\sigma$), $e^{-4} \\approx 0.018 < 2\\%$.',
      },
    ],
  },

  // =========================================================================
  // TIER 2: STEADY-STATE ERROR & SYSTEM TYPE (3 problems)
  // =========================================================================
  {
    id: 'pid2-fvt-type0',
    tier: 'steady-state',
    tierLabel: 'Steady-State',
    title: 'Type-0 Step Steady-State Error',
    mechatronicsContext:
      'A proportional-only DC speed controller or thermal heater without an integrator always exhibits finite steady-state droop beneath its constant setpoint—the static position constant predicts the exact residual gap.',
    expressionLatex:
      'L(s) = \\frac{8}{s + 2},\\; R(s) = \\frac{1}{s} \\;\\;(\\text{find } e_{ss})',
    finalAnswerLatex:
      'K_p^{\\text{pos}} = 4, \\qquad e_{ss} = \\frac{1}{1 + 4} = \\frac{1}{5} = 0.20',
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 1.0],
      setpoint: 1,
      setpointLabel: 'Step Command r(t) = 1',
      primaryLabel: 'Closed-Loop y(t) → 0.80',
      baselineLabel: null,
      primaryFn: (t) => 0.8 * (1 - Math.exp(-10 * t)),
      baselineFn: null,
      steadyErrorGap: { yFinal: 0.8, label: 'e_ss = 0.20' },
      defaultCursor: 0.65,
      subtitle:
        'Hover or drag across $t$: because $L(s)$ has no integrator (Type-0), the closed-loop step response $y(t) = 0.8(1-e^{-10t})$ plateaus at $0.80$, leaving permanent droop $e_{ss} = 0.20$.',
      domainMeta: 'Type-0 Step Droop · y(∞) = 0.80, e_ss = 0.20',
      metrics: [
        { label: 'System Type', value: 'Type-0' },
        { label: 'Pos Const Kp', value: '4.000' },
        { label: 'Final Output', value: '0.800' },
        { label: 'Step Error e_ss', value: '0.200 (1/5) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'system_type',
        badge: 'Identify System Type',
        prompt:
          'Count how many pure integrators ($1/s$ poles at the origin $s = 0$) appear in the open-loop transfer function $L(s) = \\frac{8}{s+2}$.',
        highlightLatex:
          'L(s) = \\frac{8}{\\textcolor{#22D3EE}{s^0}\\,(s + 2)}',
        options: [
          {
            id: 'a',
            latex: '\\text{Type-0 (no pole at } s = 0\\text{)}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\text{Type-1 (one pole at } s = -2\\text{)}',
            correct: false,
            misconception:
              'System Type counts ONLY poles at the origin $s = 0$ (free integrators), not total system order.',
          },
          {
            id: 'c',
            latex: '\\text{Type-2 (denominator constant is } 2\\text{)}',
            correct: false,
            misconception:
              'The pole location $-2$ determines speed, not System Type; Type equals the multiplicity $N$ of $s^N$ factored out of the denominator.',
          },
          {
            id: 'd',
            latex: '\\text{Type-8 (numerator gain is } 8\\text{)}',
            correct: false,
            misconception:
              'Numerator gain sets the loop strength, not System Type. Look for free $1/s$ integrators in the denominator.',
          },
        ],
        lockedLabel: 'System Type',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{Type-0}} \\;\\;(N = 0)',
        hint: 'System Type $N$ is the power of $s$ factored out of the open-loop denominator.',
      },
      {
        stepType: 'position_constant',
        badge: 'Position Constant Kp',
        prompt:
          'Evaluate the static position error constant $K_p^{\\text{pos}} = \\lim_{s \\to 0} L(s)$.',
        highlightLatex:
          'K_p^{\\text{pos}} = \\lim_{s \\to 0} \\frac{\\textcolor{#F59E0B}{8}}{\\textcolor{#22D3EE}{s + 2}}',
        options: [
          {
            id: 'a',
            latex: 'K_p^{\\text{pos}} = 8',
            correct: false,
            misconception:
              'Evaluate the denominator at $s = 0$ as well: $0 + 2 = 2$, so $8/2 = 4$.',
          },
          {
            id: 'b',
            latex: 'K_p^{\\text{pos}} = 4',
            correct: true,
          },
          {
            id: 'c',
            latex: 'K_p^{\\text{pos}} = 0',
            correct: false,
            misconception:
              'Setting $s = 0$ does not zero the numerator $8$; $L(0) = 8/2 = 4$.',
          },
          {
            id: 'd',
            latex: 'K_p^{\\text{pos}} = \\infty',
            correct: false,
            misconception:
              '$K_p^{\\text{pos}}$ is infinite only for Type-1 or higher systems that contain a $1/s$ integrator.',
          },
        ],
        lockedLabel: 'Position Const',
        lockedResultLatex: 'K_p^{\\text{pos}} = \\textcolor{#34D399}{4}',
        hint: 'Simply plug $s = 0$ into $L(s) = \\frac{8}{s+2}$.',
      },
      {
        stepType: 'fvt_stability_check',
        badge: 'Verify Stability for FVT',
        prompt:
          'Before applying the Final Value Theorem, check the closed-loop pole from $1 + L(s) = 0 \\iff (s + 2) + 8 = 0$.',
        highlightLatex:
          '1 + \\frac{8}{s + 2} = 0 \\implies \\textcolor{#22D3EE}{s + 10} = 0',
        options: [
          {
            id: 'a',
            latex: 'p_{\\text{CL}} = -10 < 0 \\;\\;(\\text{stable, FVT valid})',
            correct: true,
          },
          {
            id: 'b',
            latex: 'p_{\\text{CL}} = +10 > 0 \\;\\;(\\text{unstable, FVT invalid})',
            correct: false,
            misconception:
              '$s + 10 = 0$ gives $s = -10$, which lies strictly in the stable left half-plane.',
          },
          {
            id: 'c',
            latex: 'p_{\\text{CL}} = -6 < 0 \\;\\;(\\text{stable, FVT valid})',
            correct: false,
            misconception:
              'For negative feedback, add the numerator and denominator: $2 + 8 = 10$, giving $s = -10$.',
          },
          {
            id: 'd',
            latex: 'p_{\\text{CL}} = 0 \\;\\;(\\text{marginal, FVT invalid})',
            correct: false,
            misconception:
              'Neither $s+2$ nor $s+10$ vanishes at $s = 0$; the closed-loop pole is strictly negative at $-10$.',
          },
        ],
        lockedLabel: 'FVT Check',
        lockedResultLatex:
          'p_{\\text{CL}} = \\textcolor{#34D399}{-10} < 0 \\;\\;(\\text{FVT valid})',
        hint: 'FVT requires all poles of $sE(s)$ to have strictly negative real parts.',
      },
      {
        stepType: 'step_ess_value',
        badge: 'Compute Step Error e_ss',
        prompt:
          'Compute the unit-step steady-state error $e_{ss} = \\frac{1}{1 + K_p^{\\text{pos}}}$.',
        highlightLatex:
          'e_{ss} = \\frac{1}{1 + \\textcolor{#34D399}{K_p^{\\text{pos}}}} = \\frac{1}{1 + \\textcolor{#34D399}{4}}',
        options: [
          {
            id: 'a',
            latex: 'e_{ss} = \\frac{1}{4} = 0.25',
            correct: false,
            misconception:
              'Don\'t drop the $1 +$ in the denominator: $e_{ss} = \\frac{1}{1 + K_p^{\\text{pos}}} = \\frac{1}{5} = 0.20$.',
          },
          {
            id: 'b',
            latex: 'e_{ss} = \\frac{4}{5} = 0.80',
            correct: false,
            misconception:
              '$0.80$ is the final output $y_{ss} = \\frac{K_p^{\\text{pos}}}{1 + K_p^{\\text{pos}}}$; the steady-state error is $1 - 0.80 = 0.20$.',
          },
          {
            id: 'c',
            latex: 'e_{ss} = \\frac{1}{5} = 0.20',
            correct: true,
          },
          {
            id: 'd',
            latex: 'e_{ss} = 0',
            correct: false,
            misconception:
              'A Type-0 system with finite $K_p^{\\text{pos}} = 4$ cannot achieve zero step error without adding an integrator.',
          },
        ],
        lockedLabel: 'Steady Error',
        lockedResultLatex:
          'e_{ss} = \\textcolor{#34D399}{\\frac{1}{5} = 0.20}',
        hint: 'Add $1$ to $K_p^{\\text{pos}} = 4$ in the denominator: $1 / (1 + 4)$.',
      },
    ],
  },

  {
    id: 'pid2-pi-zero-error',
    tier: 'steady-state',
    tierLabel: 'Steady-State',
    title: 'Integral Action Eliminates Step Error',
    mechatronicsContext:
      'Adding an integral accumulator to a servo loop lets sustained torque compensate for static friction and command offsets until the actuator locks cleanly onto its step reference.',
    expressionLatex:
      'L(s) = \\frac{3s + 6}{s(s + 3)},\\; R(s) = \\frac{1}{s} \\;\\;(\\text{find } e_{ss})',
    finalAnswerLatex:
      'E(s) = \\frac{s + 3}{s^2 + 6s + 6} \\implies e_{ss} = \\lim_{s\\to 0} s\\,E(s) = 0',
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 3.5],
      setpoint: 1,
      setpointLabel: 'Step Command r(t) = 1',
      primaryLabel: 'PI Type-1 (e_ss = 0)',
      baselineLabel: 'P-only Type-0 (e_ss = 0.50)',
      primaryFn: (t) => 1 - Math.exp(-3 * t) * Math.cosh(Math.sqrt(3) * t),
      baselineFn: (t) => 0.5 * (1 - Math.exp(-6 * t)),
      defaultCursor: 0.55,
      subtitle:
        'Hover or drag across $t$: proportional-only feedback stalls at $0.50$ (Cyan dashed), while PI integral action drives $y(t) = 1 - e^{-3t}\\cosh(\\sqrt{3}\\,t)$ all the way to $r = 1$ with $e_{ss} = 0$.',
      domainMeta: 'PI Integral Tracking · Zero Step Error',
      metrics: [
        { label: 'System Type', value: 'Type-1 (1/s)' },
        { label: 'CL Poles', value: '−1.27, −4.73' },
        { label: 'P-Only Droop', value: '0.500 (50%)' },
        { label: 'PI Step Error', value: '0.0000 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'sensitivity_tf',
        badge: 'Form Sensitivity E(s)/R(s)',
        prompt:
          'Compute the error transfer function $\\frac{E(s)}{R(s)} = \\frac{1}{1 + L(s)}$ for $L(s) = \\frac{3s + 6}{s(s+3)}$.',
        highlightLatex:
          '\\frac{E(s)}{R(s)} = \\frac{1}{1 + \\frac{\\textcolor{#F59E0B}{3s + 6}}{\\textcolor{#22D3EE}{s(s+3)}}} = \\frac{\\textcolor{#22D3EE}{s(s+3)}}{\\textcolor{#22D3EE}{s(s+3)} + \\textcolor{#F59E0B}{3s + 6}}',
        options: [
          {
            id: 'a',
            latex: '\\frac{E(s)}{R(s)} = \\frac{3s + 6}{s^2 + 6s + 6}',
            correct: false,
            misconception:
              'That is the output transfer function $T(s) = Y(s)/R(s)$; error sensitivity puts the open-loop denominator $s(s+3)$ in the numerator.',
          },
          {
            id: 'b',
            latex: '\\frac{E(s)}{R(s)} = \\frac{s(s + 3)}{s^2 + 6s + 6}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\frac{E(s)}{R(s)} = \\frac{s(s + 3)}{s^2 + 3s + 6}',
            correct: false,
            misconception:
              'Expand carefully: $s(s+3) + (3s+6) = s^2 + 3s + 3s + 6 = s^2 + 6s + 6$.',
          },
          {
            id: 'd',
            latex: '\\frac{E(s)}{R(s)} = \\frac{1}{s^2 + 6s + 6}',
            correct: false,
            misconception:
              'When clearing $s(s+3)$ from the compound denominator, you must multiply the numerator $1$ by $s(s+3)$ too!',
          },
        ],
        lockedLabel: 'Sensitivity',
        lockedResultLatex:
          '\\frac{E(s)}{R(s)} = \\textcolor{#34D399}{\\frac{s(s + 3)}{s^2 + 6s + 6}}',
        hint: 'Multiply top and bottom by $s(s+3)$ and simplify $s^2 + 3s + 3s + 6$.',
      },
      {
        stepType: 'error_laplace',
        badge: 'Multiply by Step R(s)',
        prompt:
          'Multiply $\\frac{E(s)}{R(s)} = \\frac{s(s+3)}{s^2+6s+6}$ by the unit step input $R(s) = \\frac{1}{s}$ to obtain $E(s)$.',
        highlightLatex:
          'E(s) = \\frac{\\textcolor{#34D399}{s}(s + 3)}{s^2 + 6s + 6} \\cdot \\frac{1}{\\textcolor{#F59E0B}{s}}',
        options: [
          {
            id: 'a',
            latex: 'E(s) = \\frac{s + 3}{s^2 + 6s + 6}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'E(s) = \\frac{s(s + 3)}{s^2 + 6s + 6}',
            correct: false,
            misconception:
              'Don\'t forget to multiply by $R(s) = 1/s$, which cancels the leading factor of $s$ in the numerator.',
          },
          {
            id: 'c',
            latex: 'E(s) = \\frac{s + 3}{s(s^2 + 6s + 6)}',
            correct: false,
            misconception:
              'The numerator $s$ and the step input $1/s$ cancel cleanly, leaving no extra $s$ in the denominator.',
          },
          {
            id: 'd',
            latex: 'E(s) = \\frac{3}{s^2 + 6s + 6}',
            correct: false,
            misconception:
              'Cancel only the outer factor $s$, not the $s$ inside $(s + 3)$!',
          },
        ],
        lockedLabel: 'Error E(s)',
        lockedResultLatex:
          'E(s) = \\textcolor{#34D399}{\\frac{s + 3}{s^2 + 6s + 6}}',
        hint: 'The free zero at $s = 0$ from the integrator cancels the step\'s $1/s$ pole.',
      },
      {
        stepType: 'pi_pole_stability',
        badge: 'Confirm LHP Poles',
        prompt:
          'Check the roots of $s^2 + 6s + 6 = 0$ to confirm FVT is valid.',
        highlightLatex:
          's = \\frac{-6 \\pm \\sqrt{6^2 - 4(6)}}{2} = \\textcolor{#22D3EE}{-3 \\pm \\sqrt{3}}',
        options: [
          {
            id: 'a',
            latex: 's = -3 \\pm \\sqrt{3} \\;(\\text{both negative, LHP stable})',
            correct: true,
          },
          {
            id: 'b',
            latex: 's = -3 \\pm \\sqrt{3} \\;(\\text{one pole in RHP})',
            correct: false,
            misconception:
              'Since $\\sqrt{3} \\approx 1.73 < 3$, both $-3 + 1.73 = -1.27$ and $-3 - 1.73 = -4.73$ are strictly negative.',
          },
          {
            id: 'c',
            latex: 's = +3 \\pm \\sqrt{3} \\;(\\text{both unstable})',
            correct: false,
            misconception:
              'All coefficients of $s^2 + 6s + 6$ are positive, so every root has a negative real part ($-3 \\pm \\sqrt{3}$).',
          },
          {
            id: 'd',
            latex: 's = -3 \\pm j\\sqrt{3} \\;(\\text{underdamped})',
            correct: false,
            misconception:
              'The discriminant is $36 - 24 = +12 > 0$, so both roots are real and overdamped, not complex.',
          },
        ],
        lockedLabel: 'CL Stability',
        lockedResultLatex:
          's = \\textcolor{#34D399}{-3 \\pm \\sqrt{3} < 0} \\;\\;(\\text{FVT valid})',
        hint: 'Compare $\\sqrt{3} \\approx 1.732$ with $3$: is $-3 + \\sqrt{3}$ still negative?',
      },
      {
        stepType: 'apply_fvt_zero',
        badge: 'Evaluate Final Value Limit',
        prompt:
          'Apply the Final Value Theorem $e_{ss} = \\lim_{s \\to 0} s\\,E(s)$ to find the steady-state step error.',
        highlightLatex:
          'e_{ss} = \\lim_{s \\to 0} \\textcolor{#F59E0B}{s} \\cdot \\frac{\\textcolor{#22D3EE}{s + 3}}{\\textcolor{#22D3EE}{s^2 + 6s + 6}}',
        options: [
          {
            id: 'a',
            latex: 'e_{ss} = \\frac{3}{6} = 0.5',
            correct: false,
            misconception:
              'Don\'t omit the multiplying factor $s$ in the Final Value Theorem $\\lim_{s\\to 0} s E(s)$!',
          },
          {
            id: 'b',
            latex: 'e_{ss} = 1',
            correct: false,
            misconception:
              'Substitute $s = 0$ into $\\frac{s(s+3)}{s^2+6s+6}$: the numerator vanishes ($0 \\cdot 3 = 0$) while the denominator is $6$.',
          },
          {
            id: 'c',
            latex: 'e_{ss} = 0',
            correct: true,
          },
          {
            id: 'd',
            latex: 'e_{ss} = \\frac{1}{2}',
            correct: false,
            misconception:
              'That omits the $s$ factor in FVT; with the $s$ present, $\\frac{0(3)}{6} = 0$.',
          },
        ],
        lockedLabel: 'Step Error',
        lockedResultLatex:
          'e_{ss} = \\lim_{s\\to 0}\\frac{s(s+3)}{s^2+6s+6} = \\textcolor{#34D399}{0}',
        hint: 'Plug $s = 0$ directly into $\\frac{s(s+3)}{s^2+6s+6}$.',
      },
    ],
  },

  {
    id: 'pid2-ramp-kv',
    tier: 'steady-state',
    tierLabel: 'Steady-State',
    title: 'Velocity Constant Kv & Ramp Tracking Error',
    mechatronicsContext:
      'When a CNC milling axis or radar turret tracks a constant-velocity ramp command, a Type-1 servo settles into a constant following lag inversely proportional to its open-loop velocity constant.',
    expressionLatex:
      'L(s) = \\frac{20}{s(s + 4)},\\; R(s) = \\frac{1}{s^2} \\;\\;(\\text{find } K_v, e_{ss})',
    finalAnswerLatex:
      'K_v = 5\\text{ s}^{-1}, \\qquad e_{ss} = \\frac{1}{K_v} = \\frac{1}{5} = 0.20',
    verifyPlot: {
      kind: 'ramp-track',
      domain: [0, 3.0],
      kv: 5,
      ess: 0.2,
      rampFn: (t) => t,
      outputFn: (t) =>
        t - 0.2 + 0.2 * Math.exp(-2 * t) * (Math.cos(4 * t) - 0.75 * Math.sin(4 * t)),
      defaultCursor: 0.72,
      subtitle:
        'Hover or drag across $t$: after the initial transient decays, the Type-1 servo output $y(t)$ tracks parallel to the ramp $r(t)=t$ with a constant steady-state lag $e_{ss} = 1/K_v = 0.20$.',
      domainMeta: 'Unit Ramp Tracking · Constant Lag = 0.20',
      metrics: [
        { label: 'System Type', value: 'Type-1' },
        { label: 'Vel Const Kv', value: '5.00 s⁻¹' },
        { label: 'CL Poles', value: '−2 ± 4j' },
        { label: 'Ramp Lag e_ss', value: '0.200 (1/5) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'ramp_type_stability',
        badge: 'Check Type & Stability',
        prompt:
          'Verify the System Type of $L(s) = \\frac{20}{s(s+4)}$ and check that the closed-loop denominator $s^2 + 4s + 20 = 0$ is stable.',
        highlightLatex:
          'L(s) = \\frac{20}{\\textcolor{#F59E0B}{s}(\\textcolor{#22D3EE}{s + 4})} \\implies s^2 + 4s + 20 = 0',
        options: [
          {
            id: 'a',
            latex: '\\text{Type-0, poles } s = -2 \\pm 4j \\;(\\text{stable})',
            correct: false,
            misconception:
              'There is a free $1/s$ factor in the denominator of $L(s)$, making it Type-1, not Type-0.',
          },
          {
            id: 'b',
            latex: '\\text{Type-1, poles } s = -2 \\pm 4j \\;(\\text{stable})',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{Type-2, poles } s = 0, -4 \\;(\\text{marginal})',
            correct: false,
            misconception:
              '$0$ and $-4$ are the OPEN-loop poles; closed-loop poles solve $s(s+4) + 20 = s^2 + 4s + 20 = 0$, giving $-2 \\pm 4j$.',
          },
          {
            id: 'd',
            latex: '\\text{Type-1, poles } s = +2 \\pm 4j \\;(\\text{unstable})',
            correct: false,
            misconception:
              'The real part is $-b/(2a) = -4/2 = -2$, strictly in the stable left half-plane.',
          },
        ],
        lockedLabel: 'Type & Poles',
        lockedResultLatex:
          '\\textcolor{#34D399}{\\text{Type-1}}, \\quad p_{\\text{CL}} = \\textcolor{#34D399}{-2 \\pm 4j} \\;(\\text{stable})',
        hint: 'Count powers of $s$ at the origin in $L(s)$, then apply the quadratic formula to $s^2 + 4s + 20 = 0$.',
      },
      {
        stepType: 'velocity_constant',
        badge: 'Velocity Constant Kv',
        prompt:
          'Compute the static velocity error constant $K_v = \\lim_{s \\to 0} s\\,L(s)$.',
        highlightLatex:
          'K_v = \\lim_{s \\to 0} \\textcolor{#F59E0B}{s} \\cdot \\frac{\\textcolor{#22D3EE}{20}}{\\textcolor{#F59E0B}{s}(\\textcolor{#22D3EE}{s + 4})}',
        options: [
          {
            id: 'a',
            latex: 'K_v = 20\\text{ s}^{-1}',
            correct: false,
            misconception:
              'Don\'t forget to evaluate the remaining denominator $(s + 4)$ at $s = 0$: $20 / 4 = 5$.',
          },
          {
            id: 'b',
            latex: 'K_v = \\infty',
            correct: false,
            misconception:
              'Multiplying by $s$ cancels the single $1/s$ integrator, leaving a finite limit $20/4 = 5$.',
          },
          {
            id: 'c',
            latex: 'K_v = 5\\text{ s}^{-1}',
            correct: true,
          },
          {
            id: 'd',
            latex: 'K_v = 0',
            correct: false,
            misconception:
              'Cancel $s / s = 1$ BEFORE setting $s = 0$; otherwise $0/0$ is indeterminate.',
          },
        ],
        lockedLabel: 'Velocity Const',
        lockedResultLatex: 'K_v = \\textcolor{#34D399}{5\\text{ s}^{-1}}',
        hint: 'Cancel the $s$ factors first, then substitute $s = 0$ into $\\frac{20}{s+4}$.',
      },
      {
        stepType: 'ramp_ess_value',
        badge: 'Ramp Tracking Error',
        prompt:
          'Compute the steady-state unit-ramp tracking error $e_{ss} = \\frac{1}{K_v}$.',
        highlightLatex:
          'e_{ss} = \\frac{1}{\\textcolor{#34D399}{K_v}} = \\frac{1}{\\textcolor{#34D399}{5}}',
        options: [
          {
            id: 'a',
            latex: 'e_{ss} = \\frac{1}{1 + 5} = 0.167',
            correct: false,
            misconception:
              'The $1 +$ belongs ONLY in the step error formula $\\frac{1}{1+K_p^{\\text{pos}}}$; for a ramp input, $e_{ss} = \\frac{1}{K_v}$ directly!',
          },
          {
            id: 'b',
            latex: 'e_{ss} = 0',
            correct: false,
            misconception:
              'Zero ramp error requires a Type-2 system (two integrators); a Type-1 system always trails a ramp by $1/K_v$.',
          },
          {
            id: 'c',
            latex: 'e_{ss} = 5',
            correct: false,
            misconception:
              'Steady-state error is the RECIPROCAL of $K_v$: higher velocity gain shrinks the lag ($e_{ss} = 1/K_v$).',
          },
          {
            id: 'd',
            latex: 'e_{ss} = \\frac{1}{5} = 0.20',
            correct: true,
          },
        ],
        lockedLabel: 'Ramp Error',
        lockedResultLatex:
          'e_{ss} = \\frac{1}{K_v} = \\textcolor{#34D399}{0.20}',
        hint: 'For a unit ramp, $e_{ss} = 1 / K_v$ (no $+1$ in the denominator).',
      },
    ],
  },

  // =========================================================================
  // TIER 3: ROUTH-HURWITZ STABILITY ANALYSIS (3 problems)
  // =========================================================================
  {
    id: 'pid3-routh-cubic',
    tier: 'routh',
    tierLabel: 'Routh Stability',
    title: 'Routh-Hurwitz Gain Stability Bound',
    mechatronicsContext:
      'Cranking up proportional gain on a multi-stage hydraulic actuator improves stiffness up to a sharp threshold—beyond that critical limit, complex poles cross into the right half-plane and the axis erupts into growing oscillation.',
    expressionLatex:
      's^3 + 6s^2 + 11s + K = 0 \\;\\;(\\text{stable } K?)',
    finalAnswerLatex:
      '0 < K < 66 \\qquad \\left(s^1\\text{ pivot } \\frac{66 - K}{6} > 0 \\text{ and } K > 0\\right)',
    verifyPlot: {
      kind: 'pole-map',
      bounds: { minRe: -7.2, maxRe: 2.4, minIm: -4.4, maxIm: 4.4 },
      gainSweep: {
        a2: 6,
        a1: 11,
        kMin: 2,
        kMax: 84,
        ku: 66,
        defaultK: 66,
      },
      defaultCursor: 0.78,
      subtitle:
        'Hover or drag horizontally to sweep gain $K \\in [2, 84]$: watch the complex conjugate poles march across the $j\\omega$ boundary right at $K = 66$ into the shaded unstable RHP!',
      domainMeta: 's-Plane Root Sweep · Drag Gain K ∈ [2, 84]',
      metrics: [
        { label: 's¹ Pivot b₁', value: '(66 − K) / 6' },
        { label: 'Lower Bound', value: 'K > 0' },
        { label: 'Upper Limit', value: 'K < 66' },
        { label: 'Stable Range', value: '0 < K < 66 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'routh_init_rows',
        badge: 'Populate Top Two Rows',
        prompt:
          'Fill the $s^3$ and $s^2$ rows of the Routh array by alternating coefficients of $1\\,s^3 + 6\\,s^2 + 11\\,s + K = 0$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{1}\\,s^3 + \\textcolor{#F59E0B}{6}\\,s^2 + \\textcolor{#22D3EE}{11}\\,s + \\textcolor{#F59E0B}{K} = 0',
        options: [
          {
            id: 'a',
            latex: 's^3: [1,\\; 6], \\qquad s^2: [11,\\; K]',
            correct: false,
            misconception:
              'Routh rows alternate coefficients! Put odd-power coefficients $(a_3, a_1) = [1, 11]$ in $s^3$ and even-power $(a_2, a_0) = [6, K]$ in $s^2$.',
          },
          {
            id: 'b',
            latex: 's^3: [1,\\; 11], \\qquad s^2: [6,\\; K]',
            correct: true,
          },
          {
            id: 'c',
            latex: 's^3: [1,\\; K], \\qquad s^2: [6,\\; 11]',
            correct: false,
            misconception:
              'Place coefficients in descending power order column by column: column 1 has $[1, 6]^T$ and column 2 has $[11, K]^T$.',
          },
          {
            id: 'd',
            latex: 's^3: [6,\\; K], \\qquad s^2: [1,\\; 11]',
            correct: false,
            misconception:
              'The highest power $s^3$ takes the leading coefficient $1$ first, followed by $s^1$\'s coefficient $11$.',
          },
        ],
        lockedLabel: 'Top Rows',
        lockedResultLatex:
          's^3:[\\textcolor{#22D3EE}{1, 11}], \\quad s^2:[\\textcolor{#F59E0B}{6, K}]',
        hint: 'Row $s^3$ takes $a_3, a_1$; row $s^2$ takes $a_2, a_0$.',
      },
      {
        stepType: 'routh_s1_pivot',
        badge: 'Compute s¹ Row Entry',
        prompt:
          'Evaluate the $s^1$ first-column entry $b_1 = \\frac{a_2 a_1 - a_3 a_0}{a_2}$ from the top two rows.',
        highlightLatex:
          'b_1 = \\frac{(\\textcolor{#F59E0B}{6})(\\textcolor{#22D3EE}{11}) - (\\textcolor{#22D3EE}{1})(\\textcolor{#F59E0B}{K})}{\\textcolor{#F59E0B}{6}}',
        options: [
          {
            id: 'a',
            latex: 'b_1 = \\frac{K - 66}{6}',
            correct: false,
            misconception:
              'The Routh cross-product is $(-1/a_2)\\det\\begin{smallmatrix}1&11\\\\6&K\\end{smallmatrix} = \\frac{6(11) - 1(K)}{6}$, which is $+66 - K$, not $K - 66$.',
          },
          {
            id: 'b',
            latex: 'b_1 = \\frac{66 - K}{11}',
            correct: false,
            misconception:
              'Always divide by the pivot directly above $b_1$ in the first column ($a_2 = 6$), not $a_1 = 11$.',
          },
          {
            id: 'c',
            latex: 'b_1 = \\frac{66 - K}{6}',
            correct: true,
          },
          {
            id: 'd',
            latex: 'b_1 = 66 - 6K',
            correct: false,
            misconception:
              'Multiply $1 \\cdot K = K$ (not $6K$), and divide the whole numerator by the pivot $6$.',
          },
        ],
        lockedLabel: 's¹ Pivot',
        lockedResultLatex:
          's^1: \\left[\\textcolor{#34D399}{\\frac{66 - K}{6}},\\; 0\\right]',
        hint: 'Compute $(6 \\times 11 - 1 \\times K)$ and divide by the pivot $6$.',
      },
      {
        stepType: 'routh_s0_entry',
        badge: 'Compute s⁰ Row Entry',
        prompt:
          'Compute the final $s^0$ row entry $c_1 = \\frac{b_1 K - 6(0)}{b_1}$ (assuming $b_1 \\neq 0$).',
        highlightLatex:
          'c_1 = \\frac{\\textcolor{#34D399}{b_1}\\cdot\\textcolor{#F59E0B}{K} - 6\\cdot 0}{\\textcolor{#34D399}{b_1}}',
        options: [
          {
            id: 'a',
            latex: 'c_1 = 6K',
            correct: false,
            misconception:
              'The second diagonal product is $6 \\cdot 0 = 0$, and $b_1$ cancels cleanly: $b_1 K / b_1 = K$.',
          },
          {
            id: 'b',
            latex: 'c_1 = K',
            correct: true,
          },
          {
            id: 'c',
            latex: 'c_1 = 66 - K',
            correct: false,
            misconception:
              'Because the second entry in the $s^1$ row is $0$, $c_1$ always drops straight down as the constant term $a_0 = K$.',
          },
          {
            id: 'd',
            latex: 'c_1 = \\frac{K}{6}',
            correct: false,
            misconception:
              '$b_1$ appears in both numerator and denominator of $c_1 = \\frac{b_1 K}{b_1}$, so it cancels completely to leave $K$.',
          },
        ],
        lockedLabel: 's⁰ Row',
        lockedResultLatex: 's^0: [\\textcolor{#34D399}{K}]',
        hint: 'Notice $b_1$ cancels between top and bottom whenever the right entry is $0$.',
      },
      {
        stepType: 'routh_inequalities',
        badge: 'Enforce First-Column Signs',
        prompt:
          'For zero sign changes in the first column $[1,\\; 6,\\; \\frac{66-K}{6},\\; K]$, require every entry to be strictly positive.',
        highlightLatex:
          '\\textcolor{#34D399}{\\frac{66 - K}{6} > 0} \\quad\\text{and}\\quad \\textcolor{#F59E0B}{K > 0}',
        options: [
          {
            id: 'a',
            latex: 'K > 66',
            correct: false,
            misconception:
              'If $K > 66$, then $66 - K < 0$, causing two sign changes and two unstable RHP poles!',
          },
          {
            id: 'b',
            latex: '0 < K < 11',
            correct: false,
            misconception:
              'Remember the product $a_2 a_1 = 6 \\times 11 = 66$, so the upper stability limit is $66$, not $11$.',
          },
          {
            id: 'c',
            latex: 'K < 66 \\;\\;(\\text{including } K \\le 0)',
            correct: false,
            misconception:
              'You also need the $s^0$ entry strictly positive ($K > 0$); if $K < 0$, a real pole moves into the RHP!',
          },
          {
            id: 'd',
            latex: '0 < K < 66',
            correct: true,
          },
        ],
        lockedLabel: 'Stability Bound',
        lockedResultLatex: '\\textcolor{#34D399}{0 < K < 66}',
        hint: 'Combine $K > 0$ from the $s^0$ row with $66 - K > 0$ from the $s^1$ row.',
      },
    ],
  },

  {
    id: 'pid3-routh-rhp-count',
    tier: 'routh',
    tierLabel: 'Routh Stability',
    title: 'Counting Unstable RHP Poles',
    mechatronicsContext:
      'During flight-control verification, the Routh first-column sign count lets engineers immediately determine how many closed-loop modes sit in the unstable right half-plane without factoring the polynomial numerically.',
    expressionLatex:
      's^3 + 2s^2 + s + 6 = 0 \\;\\;(\\text{count RHP poles})',
    finalAnswerLatex:
      '\\text{1st column } [+1,\\; +2,\\; -2,\\; +6] \\implies 2\\text{ RHP (unstable)}, \\; 1\\text{ LHP (stable)}',
    verifyPlot: {
      kind: 'pole-map',
      bounds: { minRe: -3.6, maxRe: 1.8, minIm: -2.5, maxIm: 2.5 },
      poles: [
        { re: -2.5377, im: 0, label: '−2.54 (LHP)', status: 'lhp' },
        { re: 0.2688, im: 1.514, label: '+0.27+1.51j', status: 'rhp' },
        { re: 0.2688, im: -1.514, label: '+0.27−1.51j', status: 'rhp' },
      ],
      defaultCursor: 0.5,
      subtitle:
        'Numerical roots confirm the Routh sign count exactly: 1 real pole sits in the stable LHP ($-2.54$) while 2 conjugate poles sit inside the shaded unstable RHP ($+0.27 \\pm 1.51j$).',
      domainMeta: 'Complex s-Plane · 2 RHP Unstable, 1 LHP Stable',
      metrics: [
        { label: '1st Column', value: '[+1, +2, −2, +6]' },
        { label: 'Sign Changes', value: '2 (+→−, −→+)' },
        { label: 'Unstable RHP', value: '2 poles' },
        { label: 'Stable LHP', value: '1 pole ✓' },
      ],
    },
    steps: [
      {
        stepType: 'routh_rows_rhp',
        badge: 'Build Top Two Rows',
        prompt:
          'Arrange the coefficients of $1\\,s^3 + 2\\,s^2 + 1\\,s + 6 = 0$ into the $s^3$ and $s^2$ rows.',
        highlightLatex:
          '\\textcolor{#22D3EE}{1}\\,s^3 + \\textcolor{#F59E0B}{2}\\,s^2 + \\textcolor{#22D3EE}{1}\\,s + \\textcolor{#F59E0B}{6} = 0',
        options: [
          {
            id: 'a',
            latex: 's^3: [1,\\; 1], \\qquad s^2: [2,\\; 6]',
            correct: true,
          },
          {
            id: 'b',
            latex: 's^3: [1,\\; 2], \\qquad s^2: [1,\\; 6]',
            correct: false,
            misconception:
              'Alternate coefficients across the top two rows: odd powers $[1, 1]$ go in $s^3$ and even powers $[2, 6]$ go in $s^2$.',
          },
          {
            id: 'c',
            latex: 's^3: [1,\\; 6], \\qquad s^2: [2,\\; 1]',
            correct: false,
            misconception:
              'Keep descending order: $s^1$ has coefficient $1$ (in row $s^3$), and $s^0$ has coefficient $6$ (in row $s^2$).',
          },
          {
            id: 'd',
            latex: 's^3: [1,\\; 0], \\qquad s^2: [2,\\; 6]',
            correct: false,
            misconception:
              'The term $+s$ has an implicit coefficient of $1$, not $0$!',
          },
        ],
        lockedLabel: 'Top Rows',
        lockedResultLatex:
          's^3:[\\textcolor{#22D3EE}{1, 1}], \\quad s^2:[\\textcolor{#F59E0B}{2, 6}]',
        hint: 'Notice $+s = +1\\cdot s$, so the odd-power coefficients are $1$ and $1$.',
      },
      {
        stepType: 'routh_pivot_neg',
        badge: 'Compute s¹ and s⁰ Entries',
        prompt:
          'Compute $b_1 = \\frac{2(1) - 1(6)}{2}$ for row $s^1$, and bring down $c_1 = 6$ for row $s^0$.',
        highlightLatex:
          'b_1 = \\frac{(\\textcolor{#F59E0B}{2})(\\textcolor{#22D3EE}{1}) - (\\textcolor{#22D3EE}{1})(\\textcolor{#F59E0B}{6})}{\\textcolor{#F59E0B}{2}}',
        options: [
          {
            id: 'a',
            latex: 'b_1 = +2, \\quad c_1 = 6',
            correct: false,
            misconception:
              'Watch the subtraction order: $2(1) - 1(6) = 2 - 6 = -4$, and $-4/2 = -2$ (negative!).',
          },
          {
            id: 'b',
            latex: 'b_1 = -4, \\quad c_1 = 6',
            correct: false,
            misconception:
              'Remember to divide $-4$ by the pivot $a_2 = 2$: $-4/2 = -2$.',
          },
          {
            id: 'c',
            latex: 'b_1 = -2, \\quad c_1 = 6',
            correct: true,
          },
          {
            id: 'd',
            latex: 'b_1 = -2, \\quad c_1 = -6',
            correct: false,
            misconception:
              '$c_1 = \\frac{(-2)(6) - 2(0)}{-2} = +6$: the minus sign cancels between numerator and denominator!',
          },
        ],
        lockedLabel: 'Remaining Rows',
        lockedResultLatex:
          'b_1 = \\textcolor{#F59E0B}{-2}, \\qquad c_1 = \\textcolor{#34D399}{6}',
        hint: 'Evaluate $(2 - 6)/2$ carefully, and check that $(-2)(6)/(-2) = +6$.',
      },
      {
        stepType: 'count_sign_changes',
        badge: 'Count First-Column Sign Changes',
        prompt:
          'Inspect the complete first column $[+1,\\; +2,\\; -2,\\; +6]$ from top to bottom and count every sign reversal.',
        highlightLatex:
          '\\text{Signs: } (\\textcolor{#34D399}{+}\\,,\\; \\textcolor{#34D399}{+}\\,,\\; \\textcolor{#F59E0B}{-}\\,,\\; \\textcolor{#34D399}{+})',
        options: [
          {
            id: 'a',
            latex: '1\\text{ sign change}',
            correct: false,
            misconception:
              'Count BOTH transitions: from $+2$ to $-2$ is one change, and from $-2$ back to $+6$ is a second sign change!',
          },
          {
            id: 'b',
            latex: '2\\text{ sign changes}',
            correct: true,
          },
          {
            id: 'c',
            latex: '3\\text{ sign changes}',
            correct: false,
            misconception:
              'Going from $+1$ to $+2$ keeps the same positive sign, so only $+2 \\to -2$ and $-2 \\to +6$ flip sign.',
          },
          {
            id: 'd',
            latex: '0\\text{ sign changes}',
            correct: false,
            misconception:
              'Although all polynomial coefficients were positive, the Routh pivot $-2$ is negative, creating two sign changes.',
          },
        ],
        lockedLabel: 'Sign Changes',
        lockedResultLatex:
          '(+, +, -, +) \\implies \\textcolor{#F59E0B}{2\\text{ sign changes}}',
        hint: 'Trace adjacent pairs: $+\\to+$ (0), $+\\to-$ (1), $-\\to+$ (2).',
      },
      {
        stepType: 'pole_count_conclusion',
        badge: 'Classify RHP vs LHP Poles',
        prompt:
          'For a degree-3 polynomial with 2 first-column sign changes and no all-zero row, determine the exact pole split.',
        highlightLatex:
          '\\text{Degree } 3 = \\textcolor{#F59E0B}{N_{\\text{RHP}}} + \\textcolor{#34D399}{N_{\\text{LHP}}}',
        options: [
          {
            id: 'a',
            latex: '2\\text{ poles in LHP}, \\; 1\\text{ pole in RHP}',
            correct: false,
            misconception:
              'Routh-Hurwitz says the number of sign changes equals the number of UNSTABLE RHP poles, not LHP poles.',
          },
          {
            id: 'b',
            latex: '3\\text{ poles in RHP}, \\; 0\\text{ poles in LHP}',
            correct: false,
            misconception:
              'There are only 2 sign changes, so the remaining $3 - 2 = 1$ pole must lie in the stable LHP.',
          },
          {
            id: 'c',
            latex: '2\\text{ poles in RHP (unstable)}, \\; 1\\text{ pole in LHP (stable)}',
            correct: true,
          },
          {
            id: 'd',
            latex: '2\\text{ poles on } j\\omega\\text{-axis}, \\; 1\\text{ pole in LHP}',
            correct: false,
            misconception:
              'Imaginary-axis poles only occur when an entire Routh row vanishes; here $b_1 = -2 \\neq 0$, so both unstable poles are strictly in the RHP.',
          },
        ],
        lockedLabel: 'Pole Split',
        lockedResultLatex:
          '\\textcolor{#F59E0B}{2\\text{ RHP}} \\;+\\; \\textcolor{#34D399}{1\\text{ LHP}} \\;\\;(\\text{unstable})',
        hint: 'Routh theorem: # sign changes = # RHP roots; the remaining roots lie in the LHP.',
      },
    ],
  },

  {
    id: 'pid3-marginal-freq',
    tier: 'routh',
    tierLabel: 'Routh Stability',
    title: 'Ultimate Gain Ku & Frequency ωu',
    mechatronicsContext:
      'During closed-loop commissioning, engineers raise proportional gain until a robot axis transitions from decaying transients into sustained harmonic ringing—the Routh auxiliary equation predicts both the exact threshold gain and oscillation frequency.',
    expressionLatex:
      's^3 + 4s^2 + 9s + K = 0 \\;\\;(\\text{find } K_u, \\omega_u)',
    finalAnswerLatex:
      'K_u = 36, \\qquad s = \\pm 3j \\;\\;\\left(\\omega_u = 3\\text{ rad/s},\\; T_u = \\frac{2\\pi}{3}\\text{ s}\\right)',
    verifyPlot: {
      kind: 'pole-map',
      bounds: { minRe: -5.4, maxRe: 1.8, minIm: -4.2, maxIm: 4.2 },
      gainSweep: {
        a2: 4,
        a1: 9,
        kMin: 2,
        kMax: 54,
        ku: 36,
        defaultK: 36,
      },
      defaultCursor: 0.6538,
      subtitle:
        'At $K = K_u = 36$, $(s+4)(s^2+9)=0$ places a real pole at $-4$ and a conjugate pair right on the $j\\omega$-axis at $\\pm 3j$. Drag horizontally to test gains below and above $K_u$!',
      domainMeta: 'Marginal Stability · s = −4, ±3j at Ku = 36',
      metrics: [
        { label: 'Ultimate Ku', value: '36.0' },
        { label: 'Aux Roots', value: 's = ±3j' },
        { label: 'Freq ωu', value: '3.00 rad/s' },
        { label: 'Period Tu', value: '2π/3 ≈ 2.09 s ✓' },
      ],
    },
    steps: [
      {
        stepType: 'routh_ku_pivot',
        badge: 'Compute s¹ Routh Entry',
        prompt:
          'From $s^3: [1,\\; 9]$ and $s^2: [4,\\; K]$, compute the $s^1$ pivot entry $b_1$.',
        highlightLatex:
          'b_1 = \\frac{(\\textcolor{#F59E0B}{4})(\\textcolor{#22D3EE}{9}) - (\\textcolor{#22D3EE}{1})(\\textcolor{#F59E0B}{K})}{\\textcolor{#F59E0B}{4}}',
        options: [
          {
            id: 'a',
            latex: 'b_1 = \\frac{36 - K}{4}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'b_1 = \\frac{36 - K}{9}',
            correct: false,
            misconception:
              'Divide by the $s^2$ first-column pivot $4$, not by $9$.',
          },
          {
            id: 'c',
            latex: 'b_1 = \\frac{K - 36}{4}',
            correct: false,
            misconception:
              'Keep the Routh sign order $a_2 a_1 - a_3 a_0 = 4(9) - 1(K) = 36 - K$.',
          },
          {
            id: 'd',
            latex: 'b_1 = \\frac{13 - K}{4}',
            correct: false,
            misconception:
              'Multiply $4 \\times 9 = 36$; do not add $4 + 9$.',
          },
        ],
        lockedLabel: 's¹ Pivot',
        lockedResultLatex: 'b_1 = \\textcolor{#34D399}{\\frac{36 - K}{4}}',
        hint: 'Compute $4 \\times 9 = 36$, subtract $1 \\times K$, and divide by $4$.',
      },
      {
        stepType: 'solve_ku',
        badge: 'Solve Ultimate Gain Ku',
        prompt:
          'Set the $s^1$ row to zero ($b_1 = 0$) to locate the marginal stability boundary $K = K_u$.',
        highlightLatex:
          '\\frac{36 - \\textcolor{#F59E0B}{K_u}}{4} = 0',
        options: [
          {
            id: 'a',
            latex: 'K_u = 9',
            correct: false,
            misconception:
              'Multiplying both sides by $4$ gives $36 - K_u = 0 \\implies K_u = 36$, not $36/4 = 9$.',
          },
          {
            id: 'b',
            latex: 'K_u = 36',
            correct: true,
          },
          {
            id: 'c',
            latex: 'K_u = 4',
            correct: false,
            misconception:
              'Set the numerator $36 - K_u$ to zero to make the fraction vanish.',
          },
          {
            id: 'd',
            latex: 'K_u = 144',
            correct: false,
            misconception:
              '$0 \\times 4 = 0$, so $36 - K_u = 0$ directly gives $K_u = 36$.',
          },
        ],
        lockedLabel: 'Ultimate Gain',
        lockedResultLatex: 'K_u = \\textcolor{#34D399}{36}',
        hint: 'A fraction equals zero precisely when its numerator equals zero.',
      },
      {
        stepType: 'auxiliary_equation',
        badge: 'Solve Auxiliary Equation',
        prompt:
          'Form the even-power auxiliary equation $A(s) = 0$ from the $s^2$ row $[4,\\; K_u] = [4,\\; 36]$ and solve for the $j\\omega$-axis roots.',
        highlightLatex:
          'A(s) = \\textcolor{#22D3EE}{4}\\,s^2 + \\textcolor{#34D399}{36} = 0',
        options: [
          {
            id: 'a',
            latex: 's = \\pm 3',
            correct: false,
            misconception:
              'Because $4s^2 = -36 \\implies s^2 = -9 < 0$, the square root is purely imaginary: $s = \\pm 3j$.',
          },
          {
            id: 'b',
            latex: 's = \\pm 9j',
            correct: false,
            misconception:
              'Take the square root of $9$ after dividing by $4$: $\\sqrt{-9} = \\pm 3j$, not $\\pm 9j$.',
          },
          {
            id: 'c',
            latex: 's = \\pm 3j',
            correct: true,
          },
          {
            id: 'd',
            latex: 's = \\pm 6j',
            correct: false,
            misconception:
              'Divide $36$ by the leading coefficient $4$ first ($s^2 = -9$), then take the square root.',
          },
        ],
        lockedLabel: 'Imaginary Roots',
        lockedResultLatex: '4s^2 + 36 = 0 \\implies s = \\textcolor{#34D399}{\\pm 3j}',
        hint: 'Divide by $4$ to get $s^2 + 9 = 0$, then solve $s^2 = -9$.',
      },
      {
        stepType: 'ultimate_period',
        badge: 'Extract ωu and Period Tu',
        prompt:
          'Read the ultimate frequency $\\omega_u$ from $s = \\pm j\\omega_u$ and compute the ultimate oscillation period $T_u = \\frac{2\\pi}{\\omega_u}$.',
        highlightLatex:
          '\\omega_u = \\textcolor{#34D399}{3\\text{ rad/s}} \\implies T_u = \\frac{2\\pi}{\\textcolor{#34D399}{\\omega_u}}',
        options: [
          {
            id: 'a',
            latex: '\\omega_u = 3\\text{ rad/s}, \\quad T_u = \\frac{2\\pi}{3}\\text{ s}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\omega_u = 3\\text{ rad/s}, \\quad T_u = \\frac{1}{3}\\text{ s}',
            correct: false,
            misconception:
              '$\\omega_u$ is in rad/s (not Hz), so period is $T_u = \\frac{2\\pi}{\\omega_u} = \\frac{2\\pi}{3}\\text{ s}$, not $1/\\omega_u$.',
          },
          {
            id: 'c',
            latex: '\\omega_u = 3\\text{ rad/s}, \\quad T_u = 6\\pi\\text{ s}',
            correct: false,
            misconception:
              'Higher frequency means a SHORTER period: divide $2\\pi$ by $\\omega_u$, don\'t multiply.',
          },
          {
            id: 'd',
            latex: '\\omega_u = 9\\text{ rad/s}, \\quad T_u = \\frac{2\\pi}{9}\\text{ s}',
            correct: false,
            misconception:
              'From $s = \\pm 3j$, the oscillation frequency is $\\omega_u = 3\\text{ rad/s}$, whereas $9 = \\omega_u^2$.',
          },
        ],
        lockedLabel: 'Ultimate Freq',
        lockedResultLatex:
          '\\omega_u = \\textcolor{#34D399}{3\\text{ rad/s}}, \\quad T_u = \\textcolor{#34D399}{\\frac{2\\pi}{3}\\text{ s}}',
        hint: 'One full cycle spans $2\\pi$ radians at angular rate $\\omega_u = 3\\text{ rad/s}$.',
      },
    ],
  },

  // =========================================================================
  // TIER 4: PID TUNING & DISTURBANCE REJECTION (3 problems)
  // =========================================================================
  {
    id: 'pid4-disturbance-p-vs-pi',
    tier: 'pid-tuning',
    tierLabel: 'PID Tuning',
    title: 'Load Disturbance Rejection: P vs PI',
    mechatronicsContext:
      'When an autonomous rover climbs a sudden incline or a conveyor receives a heavy payload, a constant torque disturbance enters the plant—comparing proportional versus proportional-integral feedback reveals why integral action is vital for load immunity.',
    expressionLatex:
      'G(s) = \\frac{1}{s + 1},\\; D(s) = \\frac{1}{s} \\;\\;(\\text{P vs PI})',
    finalAnswerLatex:
      '\\text{P-only: } y_{ss} = 0.10 \\;(\\text{droop}), \\qquad \\text{PI: } y_{ss} = 0 \\;(\\text{full rejection})',
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 8.0],
      setpoint: 0,
      setpointLabel: 'Zero Disturbance Target (y = 0)',
      primaryLabel: 'PI Rejects Load (→ 0)',
      baselineLabel: 'P-Only Droops (→ 0.10)',
      primaryFn: (t) =>
        (Math.exp((-5 + Math.sqrt(21)) * t) - Math.exp((-5 - Math.sqrt(21)) * t)) /
        (2 * Math.sqrt(21)),
      baselineFn: (t) => 0.1 * (1 - Math.exp(-10 * t)),
      defaultCursor: 0.45,
      subtitle:
        'Hover or drag across $t$: after a unit step torque load $D(s)=1/s$ hits at $t=0$, P-only control (Cyan dashed) remains permanently offset at $+0.10$, while PI control (Emerald) winds up restoring torque and drives output back to $0$.',
      domainMeta: 'Load Disturbance Response · Target y = 0',
      metrics: [
        { label: 'Disturbance TF', value: 'G / (1 + CG)' },
        { label: 'P-Only Offset', value: '0.100 (droop)' },
        { label: 'PI Denominator', value: 's² + 10s + 4' },
        { label: 'PI Steady Output', value: '0.0000 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'disturbance_tf',
        badge: 'Disturbance Transfer Function',
        prompt:
          'With reference $R(s) = 0$ and disturbance $D(s)$ entering at the plant input ($Y = G(D - CY)$), solve for $\\frac{Y_D(s)}{D(s)}$.',
        highlightLatex:
          'Y_D(s) = \\textcolor{#22D3EE}{G(s)}\\big(\\textcolor{#F59E0B}{D(s)} - C(s)Y_D(s)\\big)',
        options: [
          {
            id: 'a',
            latex: '\\frac{Y_D(s)}{D(s)} = \\frac{C(s)G(s)}{1 + C(s)G(s)}',
            correct: false,
            misconception:
              'That is the reference transfer function $Y/R$; the disturbance enters AFTER the controller, so only $G(s)$ sits in the forward path.',
          },
          {
            id: 'b',
            latex: '\\frac{Y_D(s)}{D(s)} = \\frac{G(s)}{1 + C(s)G(s)}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\frac{Y_D(s)}{D(s)} = \\frac{1}{1 + C(s)G(s)}',
            correct: false,
            misconception:
              'That applies to a disturbance at the plant OUTPUT; an input torque load passes through $G(s)$ first.',
          },
          {
            id: 'd',
            latex: '\\frac{Y_D(s)}{D(s)} = \\frac{G(s)}{1 - C(s)G(s)}',
            correct: false,
            misconception:
              'Moving $-G(s)C(s)Y_D$ to the left-hand side changes its sign to $+C(s)G(s)$, yielding $1 + C(s)G(s)$.',
          },
        ],
        lockedLabel: 'Disturbance TF',
        lockedResultLatex:
          '\\frac{Y_D(s)}{D(s)} = \\textcolor{#34D399}{\\frac{G(s)}{1 + C(s)G(s)}}',
        hint: 'Collect $Y_D(s)$ terms on the left: $(1 + C(s)G(s))Y_D(s) = G(s)D(s)$.',
      },
      {
        stepType: 'p_only_disturbance',
        badge: 'P-Only Steady-State Offset',
        prompt:
          'Plug $G(s) = \\frac{1}{s+1}$, $C(s) = 9$, and $D(s) = \\frac{1}{s}$ into $Y_D(s)$ and evaluate $y_{ss}^{\\text{P}} = \\lim_{s\\to 0} s\\,Y_D(s)$.',
        highlightLatex:
          'Y_D(s) = \\frac{1/(s+1)}{1 + 9/(s+1)} \\cdot \\frac{1}{s} = \\frac{1}{\\textcolor{#22D3EE}{s + 10}}\\cdot\\frac{1}{s}',
        options: [
          {
            id: 'a',
            latex: 'y_{ss}^{\\text{P}} = 0.90',
            correct: false,
            misconception:
              '$0.90$ would be the reference step gain $\\frac{9}{10}$; for the disturbance, the numerator is $1$, giving $\\frac{1}{10} = 0.10$.',
          },
          {
            id: 'b',
            latex: 'y_{ss}^{\\text{P}} = 0',
            correct: false,
            misconception:
              'P-only control needs a nonzero steady error to produce steady restoring force, leaving $y_{ss} = \\frac{1}{10} = 0.10$.',
          },
          {
            id: 'c',
            latex: 'y_{ss}^{\\text{P}} = 0.10',
            correct: true,
          },
          {
            id: 'd',
            latex: 'y_{ss}^{\\text{P}} = \\frac{1}{9} \\approx 0.111',
            correct: false,
            misconception:
              'Include the plant\'s own $+1$ in the denominator: $(s+1) + 9 = s + 10$, so $1/10 = 0.10$.',
          },
        ],
        lockedLabel: 'P-Only Droop',
        lockedResultLatex:
          'y_{ss}^{\\text{P}} = \\lim_{s\\to 0}\\frac{1}{s + 10} = \\textcolor{#F59E0B}{0.10}',
        hint: 'Cancel $s$ with $1/s$ in FVT, then evaluate $\\frac{1}{s + 10}$ at $s = 0$.',
      },
      {
        stepType: 'pi_disturbance_tf',
        badge: 'PI Disturbance Response',
        prompt:
          'Now substitute $C(s) = 9 + \\frac{4}{s} = \\frac{9s + 4}{s}$ into $\\frac{Y_D(s)}{D(s)} = \\frac{G(s)}{1 + C(s)G(s)}$ with $G(s) = \\frac{1}{s+1}$.',
        highlightLatex:
          '\\frac{Y_D(s)}{D(s)} = \\frac{1/(s+1)}{1 + \\frac{\\textcolor{#F59E0B}{9s + 4}}{s(\\textcolor{#22D3EE}{s + 1})}} = \\frac{s}{s(s+1) + 9s + 4}',
        options: [
          {
            id: 'a',
            latex: '\\frac{Y_D(s)}{D(s)} = \\frac{s}{s^2 + 10s + 4}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\frac{Y_D(s)}{D(s)} = \\frac{1}{s^2 + 10s + 4}',
            correct: false,
            misconception:
              'Clearing $s(s+1)$ multiplies the numerator $\\frac{1}{s+1}$ by $s(s+1)$, leaving a crucial zero $s$ in the numerator!',
          },
          {
            id: 'c',
            latex: '\\frac{Y_D(s)}{D(s)} = \\frac{s}{s^2 + 9s + 4}',
            correct: false,
            misconception:
              'Combine $s(s+1) + 9s + 4 = s^2 + s + 9s + 4 = s^2 + 10s + 4$.',
          },
          {
            id: 'd',
            latex: '\\frac{Y_D(s)}{D(s)} = \\frac{9s + 4}{s^2 + 10s + 4}',
            correct: false,
            misconception:
              'That is the reference response $Y/R$; the disturbance bypasses $C(s)$, so $s$ (not $9s+4$) appears in the numerator.',
          },
        ],
        lockedLabel: 'PI Disturb TF',
        lockedResultLatex:
          '\\frac{Y_D(s)}{D(s)} = \\textcolor{#34D399}{\\frac{s}{s^2 + 10s + 4}}',
        hint: 'Multiply numerator and denominator by $s(s+1)$ and collect like powers of $s$.',
      },
      {
        stepType: 'pi_disturbance_fvt',
        badge: 'Verify Complete Rejection',
        prompt:
          'Multiply by $D(s) = \\frac{1}{s}$ and apply the Final Value Theorem to find $y_{ss}^{\\text{PI}} = \\lim_{s\\to 0} s\\,Y_D(s)$.',
        highlightLatex:
          'y_{ss}^{\\text{PI}} = \\lim_{s \\to 0} \\textcolor{#F59E0B}{s} \\cdot \\frac{s}{s^2 + 10s + 4} \\cdot \\frac{1}{s} = \\lim_{s\\to 0} \\frac{\\textcolor{#34D399}{s}}{s^2 + 10s + 4}',
        options: [
          {
            id: 'a',
            latex: 'y_{ss}^{\\text{PI}} = 0.25',
            correct: false,
            misconception:
              'Don\'t drop the $s$ in the numerator from FVT: $\\frac{0}{0 + 0 + 4} = 0$, not $\\frac{1}{4}$.',
          },
          {
            id: 'b',
            latex: 'y_{ss}^{\\text{PI}} = 0.10',
            correct: false,
            misconception:
              'The PI controller\'s integrator creates a blocking zero at $s = 0$ in $Y_D/D$, eliminating the $0.10$ offset completely.',
          },
          {
            id: 'c',
            latex: 'y_{ss}^{\\text{PI}} = 0',
            correct: true,
          },
          {
            id: 'd',
            latex: 'y_{ss}^{\\text{PI}} = \\infty',
            correct: false,
            misconception:
              'All coefficients of $s^2 + 10s + 4$ are positive (poles at $-5 \\pm \\sqrt{21} < 0$), so the loop is stable and settles cleanly to $0$.',
          },
        ],
        lockedLabel: 'PI Steady Out',
        lockedResultLatex:
          'y_{ss}^{\\text{PI}} = \\textcolor{#34D399}{0} \\;\\;(\\text{100\\% load rejection})',
        hint: 'Since $s^2 + 10s + 4$ has stable LHP poles, simply plug $s = 0$ into $\\frac{s}{s^2+10s+4}$.',
      },
    ],
  },

  {
    id: 'pid4-pid-zeros',
    tier: 'pid-tuning',
    tierLabel: 'PID Tuning',
    title: 'Factoring Parallel PID into Pole-Zero Form',
    mechatronicsContext:
      'Converting parallel firmware PID gains into pole-zero form exposes the exact break frequencies where the controller switches from low-frequency integral boost to mid-band derivative phase lead.',
    expressionLatex:
      'C(s) = 10 + \\frac{8}{s} + 2s \\;\\;(\\text{pole-zero form})',
    finalAnswerLatex:
      'C(s) = \\frac{2(s + 1)(s + 4)}{s} \\qquad \\left(\\text{pole } p = 0; \\;\\;\\text{zeros } z_1 = -1,\\; z_2 = -4\\right)',
    verifyPlot: {
      kind: 'pole-map',
      bounds: { minRe: -5.4, maxRe: 1.6, minIm: -2.4, maxIm: 2.4 },
      poles: [{ re: 0, im: 0, label: 'p = 0 (Integrator)', status: 'marginal' }],
      zeros: [
        { re: -1, im: 0, label: 'z₁ = −1' },
        { re: -4, im: 0, label: 'z₂ = −4' },
      ],
      defaultCursor: 0.5,
      subtitle:
        'Complex $s$-plane view of $C(s) = \\frac{2(s+1)(s+4)}{s}$: the origin pole ($\\times$ at $s=0$) eliminates step error while the two LHP zeros ($\\circ$ at $-1, -4$) pull the root locus leftward for stability.',
      domainMeta: 'PID Pole-Zero Map · p = 0, z = −1, −4',
      metrics: [
        { label: 'Gain Kd', value: '2.0' },
        { label: 'Origin Pole', value: 's = 0 (×)' },
        { label: 'LHP Zeros', value: 's = −1, −4 (○)' },
        { label: 'Check Kd·z₁z₂', value: '2(1)(4) = 8 = Ki ✓' },
      ],
    },
    steps: [
      {
        stepType: 'pid_common_denom',
        badge: 'Combine Over Denominator s',
        prompt:
          'Write $C(s) = 10 + \\frac{8}{s} + 2s$ as a single rational function over the common denominator $s$, ordered in descending powers of $s$.',
        highlightLatex:
          'C(s) = \\textcolor{#F59E0B}{2s} + \\textcolor{#22D3EE}{10} + \\frac{\\textcolor{#34D399}{8}}{s}',
        options: [
          {
            id: 'a',
            latex: 'C(s) = \\frac{2s^2 + 10s + 8}{s}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'C(s) = \\frac{2s + 10 + 8}{s}',
            correct: false,
            misconception:
              'When placing $2s$ and $10$ over $s$, multiply each by $s$: $2s = \\frac{2s^2}{s}$ and $10 = \\frac{10s}{s}$.',
          },
          {
            id: 'c',
            latex: 'C(s) = \\frac{10s^2 + 2s + 8}{s}',
            correct: false,
            misconception:
              'The derivative gain $K_d = 2$ multiplies $s^2$, and the proportional gain $K_p = 10$ multiplies $s$.',
          },
          {
            id: 'd',
            latex: 'C(s) = \\frac{2s^2 + 8s + 10}{s}',
            correct: false,
            misconception:
              '$K_i = 8$ is already over $s$, so $8$ is the constant term and $10s$ is the middle term.',
          },
        ],
        lockedLabel: 'Rational Form',
        lockedResultLatex: 'C(s) = \\textcolor{#34D399}{\\frac{2s^2 + 10s + 8}{s}}',
        hint: 'Multiply $2s$ by $s/s$ and $10$ by $s/s$, then combine all three numerators.',
      },
      {
        stepType: 'pid_factor_kd',
        badge: 'Factor Out Leading Kd',
        prompt:
          'Factor the derivative gain $K_d = 2$ out of the numerator $2s^2 + 10s + 8$ to leave a monic quadratic.',
        highlightLatex:
          '\\frac{\\textcolor{#F59E0B}{2}s^2 + 10s + 8}{s} = \\frac{\\textcolor{#F59E0B}{2}(\\dots)}{s}',
        options: [
          {
            id: 'a',
            latex: 'C(s) = \\frac{2(s^2 + 10s + 8)}{s}',
            correct: false,
            misconception:
              'Divide EVERY term inside the parentheses by $2$: $10/2 = 5$ and $8/2 = 4$.',
          },
          {
            id: 'b',
            latex: 'C(s) = \\frac{2(s^2 + 5s + 4)}{s}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'C(s) = \\frac{2(s^2 + 5s + 8)}{s}',
            correct: false,
            misconception:
              'Don\'t forget to divide the constant term $8$ by $2$ as well: $8/2 = 4$.',
          },
          {
            id: 'd',
            latex: 'C(s) = \\frac{2(s^2 + 4s + 5)}{s}',
            correct: false,
            misconception:
              'Keep the coefficients in order: $10/2 = 5$ belongs on $s$, and $8/2 = 4$ is the constant.',
          },
        ],
        lockedLabel: 'Monic Quadratic',
        lockedResultLatex: 'C(s) = \\textcolor{#34D399}{\\frac{2(s^2 + 5s + 4)}{s}}',
        hint: 'Divide $2$, $10$, and $8$ each by $2$.',
      },
      {
        stepType: 'pid_factor_quad',
        badge: 'Factor the Numerator Quadratic',
        prompt:
          'Factor $s^2 + 5s + 4$ into two linear factors $(s + a)(s + b)$ with $a + b = 5$ and $ab = 4$.',
        highlightLatex:
          's^2 + \\textcolor{#22D3EE}{5}s + \\textcolor{#F59E0B}{4} = (s + a)(s + b)',
        options: [
          {
            id: 'a',
            latex: 'C(s) = \\frac{2(s + 2)(s + 2)}{s}',
            correct: false,
            misconception:
              '$(s+2)(s+2) = s^2 + 4s + 4$, which gives middle coefficient $4$ instead of $5$.',
          },
          {
            id: 'b',
            latex: 'C(s) = \\frac{2(s - 1)(s - 4)}{s}',
            correct: false,
            misconception:
              '$(s-1)(s-4) = s^2 - 5s + 4$ has a negative middle term; we need $+5s$, so use $+1$ and $+4$.',
          },
          {
            id: 'c',
            latex: 'C(s) = \\frac{2(s + 1)(s + 4)}{s}',
            correct: true,
          },
          {
            id: 'd',
            latex: 'C(s) = \\frac{2(s + 1)(s + 5)}{s}',
            correct: false,
            misconception:
              'Check the product of constants: $1 \\times 5 = 5$, whereas we need $a b = 4$ and $a + b = 5$.',
          },
        ],
        lockedLabel: 'Factored Form',
        lockedResultLatex: 'C(s) = \\textcolor{#34D399}{\\frac{2(s + 1)(s + 4)}{s}}',
        hint: 'Which two positive integers multiply to $4$ and sum to $5$?',
      },
      {
        stepType: 'pid_pole_zero_readout',
        badge: 'Read Poles & Zeros',
        prompt:
          'Read the controller pole (denominator root) and two zeros (numerator roots) of $C(s) = \\frac{2(s+1)(s+4)}{s}$.',
        highlightLatex:
          'C(s) = \\frac{2(\\textcolor{#34D399}{s + 1})(\\textcolor{#34D399}{s + 4})}{\\textcolor{#F59E0B}{s}}',
        options: [
          {
            id: 'a',
            latex: '\\text{Pole: } s = 0; \\quad \\text{Zeros: } s = +1,\\; +4',
            correct: false,
            misconception:
              'Set $(s + 1) = 0$ and $(s + 4) = 0$: the signs flip, placing both zeros in the LHP at $-1$ and $-4$.',
          },
          {
            id: 'b',
            latex: '\\text{Poles: } s = -1,\\; -4; \\quad \\text{Zero: } s = 0',
            correct: false,
            misconception:
              'Poles come from the DENOMINATOR ($s = 0$); zeros come from the NUMERATOR ($s = -1, -4$).',
          },
          {
            id: 'c',
            latex: '\\text{Pole: } s = 0; \\quad \\text{Zeros: } s = -1,\\; -4',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\text{Pole: } s = 0; \\quad \\text{Zeros: } s = -2,\\; -4',
            correct: false,
            misconception:
              'The factor $2$ is a scalar gain, not a root; the numerator factors $(s+1)$ and $(s+4)$ vanish at $-1$ and $-4$.',
          },
        ],
        lockedLabel: 'Poles & Zeros',
        lockedResultLatex:
          'p = \\textcolor{#F59E0B}{0}, \\qquad z = \\textcolor{#34D399}{-1,\\; -4}',
        hint: 'Numerator roots are zeros; denominator roots are poles.',
      },
    ],
  },

  {
    id: 'pid4-ziegler-nichols',
    tier: 'pid-tuning',
    tierLabel: 'PID Tuning',
    title: 'Ziegler-Nichols Closed-Loop PID Tuning',
    mechatronicsContext:
      'When commissioning an industrial thermal chamber without a plant model, engineers bump proportional gain until sustained oscillation appears, measure the ultimate gain and period, and apply the classic Ziegler-Nichols PID formulas.',
    expressionLatex:
      'K_u = 10,\\; T_u = 2.0\\text{ s} \\;\\;(\\text{ZN PID gains})',
    finalAnswerLatex:
      'K_p = 6, \\quad K_i = 6\\text{ s}^{-1}, \\quad K_d = 1.5\\text{ s} \\qquad \\left(C(s) = 6 + \\frac{6}{s} + 1.5s\\right)',
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 6.0],
      setpoint: 1,
      setpointLabel: 'Setpoint r(t) = 1',
      primaryLabel: 'ZN PID (Quarter-Wave Decay)',
      baselineLabel: 'Ultimate P-Only (Ku=10, Tu=2s)',
      primaryFn: (t) =>
        1 - Math.exp(-1.2 * t) * (Math.cos(Math.PI * t) + (1.2 / Math.PI) * Math.sin(Math.PI * t)),
      baselineFn: (t) => 1 - Math.cos(Math.PI * t),
      defaultCursor: 0.33,
      subtitle:
        'Hover or drag across $t$: backing off from the sustained $T_u = 2.0\\text{ s}$ oscillation (Cyan dashed) with Ziegler-Nichols PID gains ($K_p=6, K_i=6, K_d=1.5$) yields brisk quarter-wave decay onto $r = 1$.',
      domainMeta: 'Ziegler-Nichols PID · Ku = 10, Tu = 2.0 s',
      metrics: [
        { label: 'Prop Gain Kp', value: '6.00 (0.6 Ku)' },
        { label: 'Int Gain Ki', value: '6.00 s⁻¹ (Ti=1s)' },
        { label: 'Deriv Gain Kd', value: '1.50 s (Td=0.25s)' },
        { label: 'Double Zero', value: 's = −2.0 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'zn_kp',
        badge: 'Proportional Gain Kp',
        prompt:
          'Apply the Ziegler-Nichols closed-loop PID rule $K_p = 0.6\\,K_u$ for $K_u = 10$.',
        highlightLatex:
          'K_p = \\textcolor{#22D3EE}{0.6}\\,\\textcolor{#F59E0B}{K_u} = 0.6(\\textcolor{#F59E0B}{10})',
        options: [
          {
            id: 'a',
            latex: 'K_p = 4.5',
            correct: false,
            misconception:
              '$0.45\\,K_u$ is the ZN rule for a PI controller; full PID uses $0.6\\,K_u = 6$.',
          },
          {
            id: 'b',
            latex: 'K_p = 5.0',
            correct: false,
            misconception:
              '$0.5\\,K_u$ is the ZN rule for a P-only controller; adding derivative damping lets PID use $0.6\\,K_u = 6$.',
          },
          {
            id: 'c',
            latex: 'K_p = 6',
            correct: true,
          },
          {
            id: 'd',
            latex: 'K_p = 10',
            correct: false,
            misconception:
              'Keeping $K_p = K_u = 10$ leaves the loop on the edge of oscillation; ZN backs off to $0.6\\,K_u = 6$.',
          },
        ],
        lockedLabel: 'ZN Kp',
        lockedResultLatex: 'K_p = 0.6(10) = \\textcolor{#34D399}{6}',
        hint: 'Classic ZN multipliers: P uses $0.5$, PI uses $0.45$, and PID uses $0.6$.',
      },
      {
        stepType: 'zn_ki',
        badge: 'Integral Time Ti & Gain Ki',
        prompt:
          'Compute $T_i = 0.5\\,T_u$ for $T_u = 2.0\\text{ s}$, then convert to parallel integral gain $K_i = \\frac{K_p}{T_i}$.',
        highlightLatex:
          'T_i = 0.5(\\textcolor{#F59E0B}{2.0}), \\qquad K_i = \\frac{\\textcolor{#34D399}{K_p}}{T_i}',
        options: [
          {
            id: 'a',
            latex: 'T_i = 1.0\\text{ s}, \\quad K_i = 6\\text{ s}^{-1}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'T_i = 1.67\\text{ s}, \\quad K_i = 3.6\\text{ s}^{-1}',
            correct: false,
            misconception:
              '$T_u / 1.2$ is the PI rule; for full PID, $T_i = 0.5\\,T_u = 1.0\\text{ s}$, giving $K_i = 6/1.0 = 6$.',
          },
          {
            id: 'c',
            latex: 'T_i = 1.0\\text{ s}, \\quad K_i = 1.0\\text{ s}^{-1}',
            correct: false,
            misconception:
              'In parallel form $K_p(1 + \\frac{1}{T_i s})$, the integral gain is $K_i = K_p / T_i = 6/1 = 6$, not $1/T_i$.',
          },
          {
            id: 'd',
            latex: 'T_i = 4.0\\text{ s}, \\quad K_i = 1.5\\text{ s}^{-1}',
            correct: false,
            misconception:
              'Multiply $T_u = 2.0$ by $0.5$ ($1.0\\text{ s}$), not by $2$.',
          },
        ],
        lockedLabel: 'ZN Ti & Ki',
        lockedResultLatex:
          'T_i = \\textcolor{#34D399}{1.0\\text{ s}}, \\quad K_i = \\textcolor{#34D399}{6\\text{ s}^{-1}}',
        hint: 'First find $T_i = 0.5(2.0) = 1.0\\text{ s}$, then divide $K_p = 6$ by $T_i$.',
      },
      {
        stepType: 'zn_kd',
        badge: 'Derivative Time Td & Gain Kd',
        prompt:
          'Compute $T_d = 0.125\\,T_u = \\frac{T_u}{8}$ for $T_u = 2.0\\text{ s}$, then convert to parallel derivative gain $K_d = K_p\\,T_d$.',
        highlightLatex:
          'T_d = \\frac{\\textcolor{#F59E0B}{2.0}}{8}, \\qquad K_d = \\textcolor{#34D399}{K_p}\\cdot T_d',
        options: [
          {
            id: 'a',
            latex: 'T_d = 0.25\\text{ s}, \\quad K_d = 24\\text{ s}',
            correct: false,
            misconception:
              'Multiply $K_p$ by $T_d$ (don\'t divide!): $K_d = 6 \\times 0.25 = 1.5$, whereas $6 / 0.25 = 24$.',
          },
          {
            id: 'b',
            latex: 'T_d = 0.50\\text{ s}, \\quad K_d = 3.0\\text{ s}',
            correct: false,
            misconception:
              'ZN PID uses $T_d = T_u / 8 = 0.125\\,T_u = 0.25\\text{ s}$ (which is $T_i / 4$), not $T_u / 4$.',
          },
          {
            id: 'c',
            latex: 'T_d = 0.25\\text{ s}, \\quad K_d = 0.25\\text{ s}',
            correct: false,
            misconception:
              'Remember to multiply $T_d$ by $K_p = 6$ when converting from standard form $K_p(1 + \\frac{1}{T_i s} + T_d s)$ to parallel form!',
          },
          {
            id: 'd',
            latex: 'T_d = 0.25\\text{ s}, \\quad K_d = 1.5\\text{ s}',
            correct: true,
          },
        ],
        lockedLabel: 'ZN Td & Kd',
        lockedResultLatex:
          'T_d = \\textcolor{#34D399}{0.25\\text{ s}}, \\quad K_d = \\textcolor{#34D399}{1.5\\text{ s}}',
        hint: 'Notice $2.0 / 8 = 0.25\\text{ s}$, and $6 \\times 0.25 = 1.5$.',
      },
      {
        stepType: 'zn_assemble_pid',
        badge: 'Assemble Parallel Controller',
        prompt:
          'Assemble $C(s) = K_p + \\frac{K_i}{s} + K_d s$ and verify the classic ZN repeated-zero factorization.',
        highlightLatex:
          'C(s) = \\textcolor{#34D399}{6} + \\frac{\\textcolor{#34D399}{6}}{s} + \\textcolor{#34D399}{1.5}s = \\frac{1.5(s^2 + 4s + 4)}{s}',
        options: [
          {
            id: 'a',
            latex: 'C(s) = 6 + \\frac{6}{s} + 1.5s = \\frac{1.5(s + 2)^2}{s}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'C(s) = 6 + \\frac{6}{s} + 1.5s = \\frac{1.5(s + 4)^2}{s}',
            correct: false,
            misconception:
              'Expand $(s+2)^2 = s^2 + 4s + 4$; $(s+4)^2 = s^2 + 8s + 16$ would give $K_p = 12$ and $K_i = 24$.',
          },
          {
            id: 'c',
            latex: 'C(s) = 6 + \\frac{1}{s} + 0.25s = \\frac{0.25(s + 2)^2}{s}',
            correct: false,
            misconception:
              'Use the parallel gains $K_i = 6$ and $K_d = 1.5$ (after distributing $K_p = 6$), not $T_i$ and $T_d$ raw.',
          },
          {
            id: 'd',
            latex: 'C(s) = 6 + \\frac{6}{s} + 1.5s = \\frac{6(s + 1)^2}{s}',
            correct: false,
            misconception:
              'Factor out the leading $s^2$ coefficient $K_d = 1.5$: $6 / 1.5 = 4$, giving $1.5(s^2 + 4s + 4) = 1.5(s+2)^2$.',
          },
        ],
        lockedLabel: 'ZN Controller',
        lockedResultLatex:
          'C(s) = \\textcolor{#34D399}{6 + \\frac{6}{s} + 1.5s = \\frac{1.5(s + 2)^2}{s}}',
        hint: 'Because $T_i = 4T_d$ in ZN PID, the numerator always forms a perfect square $(s + 4/T_u)^2$.',
      },
    ],
  },

  // =========================================================================
  // TIER 5: FREQUENCY MARGINS & TIME DELAY (2 problems)
  // =========================================================================
  {
    id: 'pid5-phase-margin',
    tier: 'freq-margins',
    tierLabel: 'Margins & Delay',
    title: 'Gain Crossover & Phase Margin',
    mechatronicsContext:
      'Frequency-response testing on an electro-mechanical servo measures how many degrees of phase reserve remain at unity loop gain—a healthy phase margin guarantees damped transients even when mechanical payloads vary.',
    expressionLatex:
      'L(s) = \\frac{\\sqrt{2}}{s(s + 1)} \\;\\;(\\text{find } \\omega_{gc}, \\text{PM})',
    finalAnswerLatex:
      '\\omega_{gc} = 1\\text{ rad/s}, \\qquad \\angle L(j1) = -135^\\circ, \\qquad \\text{PM} = 45^\\circ',
    verifyPlot: {
      kind: 'bode-margin',
      wMin: 0.1,
      wMax: 10,
      wGc: 1.0,
      pmDeg: 45,
      delaySec: 0,
      magDbFn: (w) => 20 * Math.log10(Math.SQRT2 / (w * Math.hypot(w, 1))),
      phaseDegFn: (w) => -90 - (Math.atan(w) * 180) / Math.PI,
      delayedPhaseDegFn: null,
      defaultCursor: 0.5,
      subtitle:
        'Hover or drag across log-frequency $\\omega$: magnitude $|L(j\\omega)|$ crosses $0\\text{ dB}$ right at $\\omega_{gc} = 1\\text{ rad/s}$, where the phase sits $45^\\circ$ above the $-180^\\circ$ instability line.',
      domainMeta: 'Bode Plot · ω_gc = 1 rad/s, PM = 45°',
      metrics: [
        { label: 'Crossover ω_gc', value: '1.00 rad/s' },
        { label: '|L(jω_gc)|', value: '0.00 dB (1.0)' },
        { label: 'Phase ∠L(j1)', value: '−135.0°' },
        { label: 'Phase Margin', value: '45.0° ✓' },
      ],
    },
    steps: [
      {
        stepType: 'bode_magnitude',
        badge: 'Write Magnitude |L(jω)|',
        prompt:
          'Substitute $s = j\\omega$ into $L(s) = \\frac{\\sqrt{2}}{s(s+1)}$ and compute the modulus $|L(j\\omega)|$.',
        highlightLatex:
          '|L(j\\omega)| = \\frac{\\textcolor{#F59E0B}{\\sqrt{2}}}{|\\textcolor{#22D3EE}{j\\omega}|\\cdot|\\textcolor{#22D3EE}{1 + j\\omega}|}',
        options: [
          {
            id: 'a',
            latex: '|L(j\\omega)| = \\frac{\\sqrt{2}}{\\omega(\\omega + 1)}',
            correct: false,
            misconception:
              'The modulus of a complex number is $|1 + j\\omega| = \\sqrt{1 + \\omega^2}$, NOT $1 + \\omega$!',
          },
          {
            id: 'b',
            latex: '|L(j\\omega)| = \\frac{\\sqrt{2}}{\\omega\\sqrt{\\omega^2 + 1}}',
            correct: true,
          },
          {
            id: 'c',
            latex: '|L(j\\omega)| = \\frac{\\sqrt{2}}{\\sqrt{\\omega^2 + 1}}',
            correct: false,
            misconception:
              'Keep the integrator magnitude $|j\\omega| = \\omega$ in the denominator alongside $\\sqrt{\\omega^2 + 1}$.',
          },
          {
            id: 'd',
            latex: '|L(j\\omega)| = \\frac{2}{\\omega^2(\\omega^2 + 1)}',
            correct: false,
            misconception:
              'That is $|L(j\\omega)|^2$ (magnitude squared), not $|L(j\\omega)|$.',
          },
        ],
        lockedLabel: 'Magnitude',
        lockedResultLatex:
          '|L(j\\omega)| = \\textcolor{#34D399}{\\frac{\\sqrt{2}}{\\omega\\sqrt{\\omega^2 + 1}}}',
        hint: 'Use $|j\\omega| = \\omega$ and $|1 + j\\omega| = \\sqrt{1^2 + \\omega^2}$ for $\\omega > 0$.',
      },
      {
        stepType: 'solve_wgc',
        badge: 'Find Gain Crossover ω_gc',
        prompt:
          'Set $|L(j\\omega_{gc})| = 1$ (0 dB), square both sides to get $\\omega^2(\\omega^2 + 1) = 2$, and solve for $\\omega_{gc} > 0$.',
        highlightLatex:
          '\\omega^4 + \\omega^2 - 2 = (\\omega^2 + 2)(\\textcolor{#34D399}{\\omega^2 - 1}) = 0',
        options: [
          {
            id: 'a',
            latex: '\\omega_{gc} = \\sqrt{2}\\text{ rad/s}',
            correct: false,
            misconception:
              'Check $\\omega = \\sqrt{2}$: $|L(j\\sqrt{2})| = \\frac{\\sqrt{2}}{\\sqrt{2}\\sqrt{3}} = \\frac{1}{\\sqrt{3}} \\neq 1$. Solve $\\omega^2 - 1 = 0$ instead.',
          },
          {
            id: 'b',
            latex: '\\omega_{gc} = 2\\text{ rad/s}',
            correct: false,
            misconception:
              'The factor $(\\omega^2 + 2) = 0$ gives imaginary solutions; the only positive real root comes from $\\omega^2 - 1 = 0$.',
          },
          {
            id: 'c',
            latex: '\\omega_{gc} = 1\\text{ rad/s}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\omega_{gc} = 0.5\\text{ rad/s}',
            correct: false,
            misconception:
              'Verify directly: at $\\omega = 1$, $1\\cdot\\sqrt{1^2 + 1} = \\sqrt{2}$, which cancels the numerator $\\sqrt{2}$ cleanly to $1$.',
          },
        ],
        lockedLabel: 'Crossover ω_gc',
        lockedResultLatex: '\\omega_{gc} = \\textcolor{#34D399}{1\\text{ rad/s}}',
        hint: 'Only $\\omega^2 = 1$ yields a positive real frequency $\\omega_{gc} > 0$.',
      },
      {
        stepType: 'eval_phase_wgc',
        badge: 'Evaluate Phase at ω_gc',
        prompt:
          'Compute the open-loop phase $\\angle L(j\\omega_{gc}) = -\\angle(j\\omega_{gc}) - \\angle(1 + j\\omega_{gc})$ at $\\omega_{gc} = 1$.',
        highlightLatex:
          '\\angle L(j1) = -\\textcolor{#22D3EE}{90^\\circ} - \\arctan\\!\\left(\\frac{\\textcolor{#34D399}{1}}{1}\\right)',
        options: [
          {
            id: 'a',
            latex: '\\angle L(j1) = -45^\\circ',
            correct: false,
            misconception:
              'Don\'t forget the $-90^\\circ$ phase lag contributed by the pure integrator $1/(j\\omega)$!',
          },
          {
            id: 'b',
            latex: '\\angle L(j1) = -135^\\circ',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\angle L(j1) = +135^\\circ',
            correct: false,
            misconception:
              'Poles in the denominator SUBTRACT phase, giving $-90^\\circ - 45^\\circ = -135^\\circ$ (phase lag, not lead).',
          },
          {
            id: 'd',
            latex: '\\angle L(j1) = -120^\\circ',
            correct: false,
            misconception:
              '$\\arctan(1) = 45^\\circ$ (not $30^\\circ$), so $-90^\\circ - 45^\\circ = -135^\\circ$.',
          },
        ],
        lockedLabel: 'Phase at ω_gc',
        lockedResultLatex: '\\angle L(j1) = \\textcolor{#F59E0B}{-135^\\circ}',
        hint: 'Add the integrator\'s $-90^\\circ$ and the pole\'s $-\\arctan(1) = -45^\\circ$.',
      },
      {
        stepType: 'compute_pm',
        badge: 'Compute Phase Margin',
        prompt:
          'Calculate the Phase Margin $\\text{PM} = 180^\\circ + \\angle L(j\\omega_{gc})$.',
        highlightLatex:
          '\\text{PM} = 180^\\circ + (\\textcolor{#F59E0B}{-135^\\circ})',
        options: [
          {
            id: 'a',
            latex: '\\text{PM} = 135^\\circ',
            correct: false,
            misconception:
              'Phase margin measures distance ABOVE $-180^\\circ$: $180^\\circ - 135^\\circ = 45^\\circ$, not $135^\\circ$.',
          },
          {
            id: 'b',
            latex: '\\text{PM} = -45^\\circ',
            correct: false,
            misconception:
              'Since $-135^\\circ$ sits $45^\\circ$ ABOVE $-180^\\circ$, the phase margin is POSITIVE ($+45^\\circ$, stable!).',
          },
          {
            id: 'c',
            latex: '\\text{PM} = 315^\\circ',
            correct: false,
            misconception:
              'Add the negative angle ($180^\\circ + (-135^\\circ) = 45^\\circ$); subtracting a negative would add $135^\\circ$ by mistake.',
          },
          {
            id: 'd',
            latex: '\\text{PM} = 45^\\circ',
            correct: true,
          },
        ],
        lockedLabel: 'Phase Margin',
        lockedResultLatex: '\\text{PM} = \\textcolor{#34D399}{45^\\circ} \\;\\;(\\text{stable})',
        hint: 'Compute $180^\\circ - 135^\\circ$.',
      },
    ],
  },

  {
    id: 'pid5-delay-margin',
    tier: 'freq-margins',
    tierLabel: 'Margins & Delay',
    title: 'Maximum Tolerable Loop Time Delay τ_max',
    mechatronicsContext:
      'Every digital motion controller accumulates pure transport delay from ADC sampling, CAN-bus packets, and firmware compute time—computing the delay margin reveals the exact latency budget before the closed loop destabilizes.',
    expressionLatex:
      '\\omega_{gc} = 5,\\; \\text{PM} = 60^\\circ \\;\\;(\\text{find } \\tau_{\\max})',
    finalAnswerLatex:
      '\\text{PM} = \\frac{\\pi}{3}\\text{ rad} \\implies \\tau_{\\max} = \\frac{\\text{PM}}{\\omega_{gc}} = \\frac{\\pi}{15}\\text{ s} \\approx 0.209\\text{ s}',
    verifyPlot: {
      kind: 'bode-margin',
      wMin: 0.5,
      wMax: 25,
      wGc: 5.0,
      pmDeg: 60,
      delaySec: Math.PI / 15,
      magDbFn: (w) => 20 * Math.log10(50 / (w * Math.hypot(w, 5 * Math.sqrt(3)))),
      phaseDegFn: (w) => -90 - (Math.atan(w / (5 * Math.sqrt(3))) * 180) / Math.PI,
      delayedPhaseDegFn: (w) =>
        -90 -
        (Math.atan(w / (5 * Math.sqrt(3))) * 180) / Math.PI -
        ((w * (Math.PI / 15)) * 180) / Math.PI,
      defaultCursor: 0.5886,
      subtitle:
        'Hover or drag across $\\omega$: pure delay $e^{-\\tau s}$ leaves $|L(j\\omega)|$ untouched, while peeling the phase curve downward (Amber) until it touches $-180^\\circ$ right at $\\omega_{gc} = 5\\text{ rad/s}$ when $\\tau = \\tau_{\\max} = \\pi/15\\text{ s}$.',
      domainMeta: 'Delay Margin · ω_gc = 5 rad/s, τ_max = 0.209 s',
      metrics: [
        { label: 'Crossover ω_gc', value: '5.00 rad/s' },
        { label: 'PM (rad)', value: 'π/3 ≈ 1.047' },
        { label: 'Delay Roll-Off', value: '−ω·τ rad' },
        { label: 'Max Delay τ_max', value: 'π/15 ≈ 0.209 s ✓' },
      ],
    },
    steps: [
      {
        stepType: 'delay_bode_effect',
        badge: 'Frequency Effect of e^(−τs)',
        prompt:
          'Determine how inserting a pure transport delay $e^{-\\tau s}$ affects the open-loop magnitude $|L(j\\omega)|$ and phase $\\angle L(j\\omega)$.',
        highlightLatex:
          'e^{-j\\omega\\tau} = \\cos(\\omega\\tau) - j\\sin(\\omega\\tau)',
        options: [
          {
            id: 'a',
            latex: '|e^{-j\\omega\\tau}| = 1 \\;(\\text{unchanged } \\omega_{gc}), \\quad \\Delta\\phi = -\\omega\\tau\\text{ rad}',
            correct: true,
          },
          {
            id: 'b',
            latex: '|e^{-j\\omega\\tau}| = e^{-\\omega\\tau}, \\quad \\Delta\\phi = 0',
            correct: false,
            misconception:
              'Because the exponent $-j\\omega\\tau$ is purely imaginary, Euler\'s formula gives unit magnitude $|e^{-j\\omega\\tau}| = 1$ and pure phase lag $-\\omega\\tau$!',
          },
          {
            id: 'c',
            latex: '|e^{-j\\omega\\tau}| = 1, \\quad \\Delta\\phi = +\\omega\\tau\\text{ rad}',
            correct: false,
            misconception:
              'Time delay always SUBTRACTS phase (phase lag $-\\omega\\tau$), eroding phase margin rather than improving it.',
          },
          {
            id: 'd',
            latex: '|e^{-j\\omega\\tau}| = 1, \\quad \\Delta\\phi = -\\frac{\\tau}{\\omega}\\text{ rad}',
            correct: false,
            misconception:
              'Delay phase lag grows LINEARLY with frequency ($-\\omega\\tau$), which is why high-bandwidth loops are far more sensitive to delay.',
          },
        ],
        lockedLabel: 'Delay Effect',
        lockedResultLatex:
          '|e^{-j\\omega\\tau}| = \\textcolor{#22D3EE}{1}, \\quad \\Delta\\phi = \\textcolor{#F59E0B}{-\\omega\\tau\\text{ rad}}',
        hint: 'Recall $|e^{j\\theta}| = 1$ and $\\angle e^{j\\theta} = \\theta$ in radians.',
      },
      {
        stepType: 'pm_to_radians',
        badge: 'Convert PM to Radians',
        prompt:
          'Convert the nominal phase margin $\\text{PM} = 60^\\circ$ into radians so its units match $\\omega_{gc}\\tau$ (rad/s $\\times$ s = rad).',
        highlightLatex:
          '\\text{PM}_{\\text{rad}} = \\textcolor{#F59E0B}{60^\\circ} \\cdot \\frac{\\pi\\text{ rad}}{180^\\circ}',
        options: [
          {
            id: 'a',
            latex: '\\text{PM} = \\frac{\\pi}{6}\\text{ rad}',
            correct: false,
            misconception:
              '$\\pi/6$ is $30^\\circ$; $60^\\circ$ is one-third of $180^\\circ$, which is $\\frac{\\pi}{3}\\text{ rad}$.',
          },
          {
            id: 'b',
            latex: '\\text{PM} = \\frac{\\pi}{3}\\text{ rad}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{PM} = \\frac{\\pi}{2}\\text{ rad}',
            correct: false,
            misconception:
              '$\\pi/2$ corresponds to $90^\\circ$, not $60^\\circ$.',
          },
          {
            id: 'd',
            latex: '\\text{PM} = 60\\text{ rad}',
            correct: false,
            misconception:
              'Never plug degrees directly into $\\omega_{gc}\\tau$: you must convert $60^\\circ$ to radians ($\\pi/3 \\approx 1.047\\text{ rad}$) first!',
          },
        ],
        lockedLabel: 'PM in Radians',
        lockedResultLatex:
          '\\text{PM} = \\textcolor{#34D399}{\\frac{\\pi}{3}\\text{ rad}} \\;\\;(\\approx 1.047\\text{ rad})',
        hint: 'Simplify the ratio $60 / 180 = 1/3$.',
      },
      {
        stepType: 'delay_margin_eq',
        badge: 'Set Stability-Loss Condition',
        prompt:
          'Stability is lost when the delay phase lag at $\\omega_{gc} = 5\\text{ rad/s}$ consumes the entire phase margin $\\text{PM} = \\frac{\\pi}{3}\\text{ rad}$. Set up the equation for $\\tau_{\\max}$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{\\omega_{gc}}\\,\\textcolor{#F59E0B}{\\tau_{\\max}} = \\textcolor{#34D399}{\\text{PM}_{\\text{rad}}}',
        options: [
          {
            id: 'a',
            latex: '5\\,\\tau_{\\max} = 60',
            correct: false,
            misconception:
              'Use radians on the right-hand side ($\\pi/3$), not degrees ($60^\\circ$); mixing units produces a $57.3\\times$ error!',
          },
          {
            id: 'b',
            latex: '\\frac{\\tau_{\\max}}{5} = \\frac{\\pi}{3}',
            correct: false,
            misconception:
              'Phase lag is the PRODUCT $\\omega_{gc}\\tau_{\\max} = 5\\tau_{\\max}$, not the quotient $\\tau_{\\max}/5$.',
          },
          {
            id: 'c',
            latex: '5\\,\\tau_{\\max} = \\frac{\\pi}{3}',
            correct: true,
          },
          {
            id: 'd',
            latex: '5\\,\\tau_{\\max} = \\pi',
            correct: false,
            misconception:
              'Only the remaining phase margin $\\text{PM} = \\pi/3$ is available before hitting $-180^\\circ$, not a full $\\pi$ radians.',
          },
        ],
        lockedLabel: 'Margin Equation',
        lockedResultLatex:
          '\\textcolor{#22D3EE}{5}\\,\\textcolor{#F59E0B}{\\tau_{\\max}} = \\textcolor{#34D399}{\\frac{\\pi}{3}}',
        hint: 'Equate the phase lag $\\omega_{gc}\\tau_{\\max}$ to $\\text{PM}_{\\text{rad}}$.',
      },
      {
        stepType: 'solve_tau_max',
        badge: 'Solve Maximum Delay τ_max',
        prompt:
          'Solve $5\\,\\tau_{\\max} = \\frac{\\pi}{3}$ for the delay margin $\\tau_{\\max}$ in seconds.',
        highlightLatex:
          '\\tau_{\\max} = \\frac{\\textcolor{#34D399}{\\pi / 3}}{\\textcolor{#22D3EE}{5}}',
        options: [
          {
            id: 'a',
            latex: '\\tau_{\\max} = \\frac{5\\pi}{3} \\approx 5.24\\text{ s}',
            correct: false,
            misconception:
              'Divide by $\\omega_{gc} = 5$ instead of multiplying: faster loops tolerate LESS time delay.',
          },
          {
            id: 'b',
            latex: '\\tau_{\\max} = 12\\text{ s}',
            correct: false,
            misconception:
              '$60 / 5 = 12$ forgot the degree-to-radian conversion! Dividing $\\pi/3$ by $5$ gives $\\pi/15 \\approx 0.209\\text{ s}$.',
          },
          {
            id: 'c',
            latex: '\\tau_{\\max} = \\frac{\\pi}{8} \\approx 0.393\\text{ s}',
            correct: false,
            misconception:
              'Multiply the denominators $3 \\times 5 = 15$ (don\'t add $3 + 5 = 8$).',
          },
          {
            id: 'd',
            latex: '\\tau_{\\max} = \\frac{\\pi}{15} \\approx 0.209\\text{ s}',
            correct: true,
          },
        ],
        lockedLabel: 'Delay Margin',
        lockedResultLatex:
          '\\tau_{\\max} = \\textcolor{#34D399}{\\frac{\\pi}{15}\\text{ s} \\approx 0.209\\text{ s}}',
        hint: 'Divide $\\pi/3$ by $5$ to get $\\pi/15 \\approx 3.1416 / 15$.',
      },
    ],
  },
];
